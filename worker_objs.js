let canvas, bgctx, scnObj, boundaryCircles, boundaryColliders, areaBoxes, worldScale, cameraX, cameraY, clip, overX, overY;

let worldSize = {width: 15360, height: 6666};
let viewport = {width: 0, height: 0}

const ground = 0;
const rockMed = 1;
const stopSign = 2;
const cactus = 3;
const tree = 4;
const flower = 5;

const bgOverflow = 512;
const overdraw = bgOverflow*0.5;

function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
onmessage = function(event){
    //document.getElementById("result").innerHTML = event.data;
    //console.log(event);
    //this.postMessage("Messge from worker")
    // if (event.data.type === 1) {
    //     console.log("Special!", event.data)
    //     bgctx.save();
    //     bgctx.translate(-event.data.x, -event.data.y);
    //     bgctx.drawImage(canvas, -1024, 0, canvas.width - 256, canvas.height - 256, 0, 0, canvas.width - 256, canvas.height - 256)
    //     bgctx.restore();
    // } else

    if(event.data[0] === "move"){ 
        bgctx.drawImage(canvas, event.data[1], event.data[2], canvas.width * worldScale, canvas.height * worldScale, 0, 0, bgctx.width, bgctx.height);
        this.postMessage("moved");
    }
    else if(event.data === "clear"){ 
        bgctx.clearRect(0,0,bgctx.width, bgctx.height)
    }
    else if(!event.data.canvas){ 
        //render()
        cameraX = event.data[0].x;
        cameraY = event.data[0].y;
        scnObj = event.data[0].obj;
        boundaryCircles = event.data[0].circ;
        boundaryColliders = event.data[0].lines;
        clip = event.data[0].clip; 
        overX = event.data[0].overX; 
        overY = event.data[0].overY; 
        if(worldScale !== event.data[0].s){
            bgctx.scale(1/worldScale, 1/worldScale);
            worldScale = event.data[0].s;
            bgctx.scale(worldScale, worldScale);
            viewport.width *= worldScale;
            viewport.height *= worldScale;
        }
        render();
        
    } else {
        canvas = event.data.canvas;
        bgctx = canvas.getContext("2d", { alpha: false });
        bgctx.width = event.data.width + bgOverflow*2;
        bgctx.height = event.data.height + bgOverflow*2;
        canvas.width = event.data.width + bgOverflow*2;
        canvas.height = event.data.height + bgOverflow*2;
        viewport.width = event.data.width;
        viewport.height = event.data.height;
        // scnObj = event.data.scnObj;
        // boundaryCircles = event.data.boundaryCircles;
        // boundaryColliders = event.data.boundaryColliders;
        // areaBoxes = event.data.areaBoxes;
        //
    }


};

function render() {
    bgctx.save();
    if(clip) {
        const minX = overX < 0 && scnObj.type !== ground? overdraw/worldScale : 0;
        const maxX =  overX > 0 && scnObj.type !== ground ? overdraw/worldScale : 0;
        const minY =  overY < 0 && scnObj.type !== ground ? overdraw/worldScale : 0;
        const maxY =  overY > 0 && scnObj.type !== ground ? overdraw/worldScale : 0;
        bgctx.beginPath();
        bgctx.rect(0,0,bgctx.width/worldScale,bgctx.height/worldScale);
        bgctx.moveTo(minX + Math.abs(Math.min(0, overX/worldScale)), minY + Math.abs(Math.min(0,overY/worldScale)));
        bgctx.lineTo(minX + Math.abs(Math.min(0, overX/worldScale)), bgctx.height/worldScale - (maxY + Math.max(0, overY/worldScale)));
        bgctx.lineTo(bgctx.width/worldScale - (maxX + Math.max(0, overX/worldScale)), bgctx.height/worldScale - (maxY + Math.max(0, overY/worldScale)));
        bgctx.lineTo(bgctx.width/worldScale - (maxX + Math.max(0, overX/worldScale)), minY + Math.abs(Math.min(0,overY/worldScale)));
    
        bgctx.clip();
    }
    bgctx.translate(cameraX, cameraY);
            //animate
            switch (scnObj.type){
                case ground:
                    paintGround(); 
                    break
                case rockMed:
                    paintRockMed(0, scnObj.length); 
                    break
                case stopSign:
                    paintStopSign(0, scnObj.length);  
                    break
                case tree:
                    paintTree(0, scnObj.length, 0, scnObj.circLen);  
                    break
                case cactus:
                    paintCactus(0, scnObj.length, 0, scnObj.circLen);  
                    break
                case flower:
                    paintFlower(0, scnObj.length, 0, scnObj.circLen);  
                    break
            }
    bgctx.restore();    
    
    //
}
    function paintGround(id, length){
    
        // Create gradient
        let sky = bgctx.createLinearGradient(0, 0, 0, worldSize.height);
        //dusk-y FFC9D6 FFF3E5
        // sky.addColorStop(0, "#FFC9D6");
        // sky.addColorStop(0.5, "#FFF3E5");
        
        sky.addColorStop(0, "#001749");
        sky.addColorStop(0.75, "#0252FF");
        sky.addColorStop(1.0, "#C9E6FF"); //#93CBFF
    
        // Fill with gradient
        bgctx.fillStyle = sky;
        bgctx.fillRect(0, 0, worldSize.width, worldSize.height);
    
        //background
        // const box = areaBoxes
        const box = {p1: {x: 0, y: worldSize.height}, p2: {x: worldSize.width, y: worldSize.height - 200}}
        // var bkgrd = bgctx.createLinearGradient(0, box.p2.y * 0.95, 0, worldSize.height);
        // // bkgrd.addColorStop(0.1, 'rgba(221, 135, 107, 0.5)'); //221 185 157 //#DDB99D
        // // bkgrd.addColorStop(0.5, 'rgba(226, 208, 140, 1)'); //#E2D08C //
        // bkgrd.addColorStop(0.1, 'rgba(226, 208, 140, 1)'); 
        // bkgrd.addColorStop(0.5, 'rgba(221, 200, 107, 1)'); 
        // bgctx.fillStyle = bkgrd;
        // bgctx.fillRect(box.p1.x, box.p2.y * 0.95, box.p2.x, box.p1.y); 
        // bgctx.beginPath();
        // bgctx.moveTo(box.p1.x, box.p2.y)
        // bgctx.bezierCurveTo(worldSize.width * random, box.p2.y - (150 * random), worldSize.width* 2 * random, worldSize.height - (150 * random), worldSize.width, worldSize.height)
        // bgctx.fill();
        
        
        const chunkW = worldSize.width / 1920;
        //bgctx.fillStyle = "#FFE57F";
        //distant terrain
        let far = bgctx.createLinearGradient(0, 0, 0, worldSize.height-200)
        far.addColorStop(0, "#007F5B");
        far.addColorStop(0.5, "#00996B");
        bgctx.fillStyle = far;
        bgctx.fillRect(box.p1.x, box.p2.y-31, box.p2.x, box.p1.y-31);
        for(let i=0;i<chunkW;i++){
            const random = mulberry32(i + id + length)();
            bgctx.beginPath();
            bgctx.moveTo(box.p1.x + (1920*i) - 960, box.p2.y-30)
            bgctx.bezierCurveTo((1920*i)+ 1920 * random, box.p2.y - (200 * random), (1920*i) + 1920 * random, worldSize.height - (250 * random), (1920*i)+1920, box.p2.y-30)
            bgctx.fill();
        }
    
        //sand
        let hill = bgctx.createLinearGradient(0, box.p2.y * 0.95, 0, worldSize.height)
        hill.addColorStop(0, "#69BC58");
        hill.addColorStop(1, "#76D162");
        bgctx.fillStyle = hill;
        bgctx.fillRect(box.p1.x, box.p2.y-15, box.p2.x, box.p1.y-15);
        for(let i=0;i<chunkW;i++){
            const random = mulberry32(i + id + length)();
            bgctx.beginPath();
            bgctx.moveTo(box.p1.x + (1920*i), box.p2.y-15)
            bgctx.bezierCurveTo((1920*i)+ 1920 * random, box.p2.y - (180*random), (1920*i) + 1920 * random, worldSize.height - (180 * random), (1920*i)+1920, worldSize.height-15)
            bgctx.fill();
        }
        
        bgctx.fillStyle = "#000000";
    };
    
    function paintDesertGround(id, length){
        
        // Create gradient
        let sky = bgctx.createLinearGradient(0, 0, 0, worldSize.height);
        //dusk-y FFC9D6 FFF3E5
        // sky.addColorStop(0, "#FFC9D6");
        // sky.addColorStop(0.5, "#FFF3E5");
        
        sky.addColorStop(0, "#001749");
        sky.addColorStop(0.75, "#0252FF");
        sky.addColorStop(1.0, "#C9E6FF"); //#93CBFF
    
        // Fill with gradient
        bgctx.fillStyle = sky;
        bgctx.fillRect(0, 0, worldSize.width, worldSize.height);
    
        //background
        const box = areaBoxes
        // var bkgrd = bgctx.createLinearGradient(0, box.p2.y * 0.95, 0, worldSize.height);
        // // bkgrd.addColorStop(0.1, 'rgba(221, 135, 107, 0.5)'); //221 185 157 //#DDB99D
        // // bkgrd.addColorStop(0.5, 'rgba(226, 208, 140, 1)'); //#E2D08C //
        // bkgrd.addColorStop(0.1, 'rgba(226, 208, 140, 1)'); 
        // bkgrd.addColorStop(0.5, 'rgba(221, 200, 107, 1)'); 
        // bgctx.fillStyle = bkgrd;
        // bgctx.fillRect(box.p1.x, box.p2.y * 0.95, box.p2.x, box.p1.y); 
        // bgctx.beginPath();
        // bgctx.moveTo(box.p1.x, box.p2.y)
        // bgctx.bezierCurveTo(worldSize.width * random, box.p2.y - (150 * random), worldSize.width* 2 * random, worldSize.height - (150 * random), worldSize.width, worldSize.height)
        // bgctx.fill();
        
        
        const chunkW = worldSize.width / 1920;
        //bgctx.fillStyle = "#FFE57F";
        //distant terrain
        let far = bgctx.createLinearGradient(0, box.p2.y - 300, 0, worldSize.height-200)
        far.addColorStop(0, "#FF5947");
        far.addColorStop(1, "#FFC647");
        bgctx.fillStyle = far;
        bgctx.fillRect(box.p1.x, box.p2.y-31, box.p2.x, box.p1.y-31);
        for(let i=0;i<chunkW;i++){
            const random = mulberry32(i + id + length)();
            bgctx.beginPath();
            bgctx.moveTo(box.p1.x + (1920*i) - 960, box.p2.y-30)
            bgctx.bezierCurveTo((1920*i)+ 1920 * random, box.p2.y - (200 * random), (1920*i) + 1920 * random, worldSize.height - (250 * random), (1920*i)+1920, box.p2.y-30)
            bgctx.fill();
        }
    
        //sand
        let hill = bgctx.createLinearGradient(0, box.p2.y * 0.95, 0, worldSize.height)
        hill.addColorStop(0, "#FFF3C9");
        hill.addColorStop(1, "#FFBE6B");
        bgctx.fillStyle = hill;
        bgctx.fillRect(box.p1.x, box.p2.y-15, box.p2.x, box.p1.y-15);
        for(let i=0;i<chunkW;i++){
            const random = mulberry32(i + id + length)();
            bgctx.beginPath();
            bgctx.moveTo(box.p1.x + (1920*i), box.p2.y-15)
            bgctx.bezierCurveTo((1920*i)+ 1920 * random, box.p2.y - (180*random), (1920*i) + 1920 * random, worldSize.height - (180 * random), (1920*i)+1920, worldSize.height-15)
            bgctx.fill();
        }
        
        bgctx.fillStyle = "#000000";
    };
    
//id is the array ID from 1st boundary + number of boundaries in obj
function paintRockMed(id, len){
    bgctx.fillStyle = "#C0C0C0";
    bgctx.strokeStyle = "#707070";
    bgctx.lineWidth = 3;

    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
    for(let i = id+1; i < id + len; i++){
        const obj = boundaryColliders[i]
        bgctx.lineTo(obj.p1.x, obj.p1.y);
        bgctx.lineTo(obj.p2.x, obj.p2.y);
    }
    bgctx.fill();
    bgctx.stroke();
    bgctx.strokeStyle = "#000000";
    bgctx.fillStyle = "#000000";
}

//id is the array ID from 1st boundary + number of boundaries in obj
function paintFlower(id, len, cid, clen){
    bgctx.fillStyle = "#18BC12";
    bgctx.strokeStyle = "#077105";
    bgctx.lineWidth = 3;

    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
    bgctx.lineTo(boundaryColliders[id+1].p2.x, boundaryColliders[id+1].p2.y);
    bgctx.lineTo(boundaryColliders[id+1].p1.x, boundaryColliders[id+1].p1.y);
    bgctx.fill();
    bgctx.stroke();

    bgctx.lineWidth = 1.5;
    bgctx.beginPath();
    bgctx.ellipse(boundaryCircles[cid+1].x, boundaryCircles[cid+1].y, boundaryCircles[cid+1].r, boundaryCircles[cid+1].r*0.5,0, 0, 2*Math.PI)
    //bgctx.arc(boundaryCircles[cid+1].x, boundaryCircles[cid+1].y, boundaryCircles[cid+1].r, 0, 2*Math.PI);
    bgctx.fill();
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.ellipse(boundaryCircles[cid+2].x, boundaryCircles[cid+2].y, boundaryCircles[cid+2].r, boundaryCircles[cid+2].r*0.7,0, 0, 2*Math.PI)
    //bgctx.arc(boundaryCircles[cid+2].x, boundaryCircles[cid+2].y, boundaryCircles[cid+2].r, 0, 2*Math.PI);
    bgctx.fill();
    bgctx.stroke();

    
    
    bgctx.fillStyle = "#C90000";
    bgctx.strokeStyle = "#8F0000";
    bgctx.lineWidth = 3;
    bgctx.beginPath();
    bgctx.arc(boundaryCircles[cid].x, boundaryCircles[cid].y, boundaryCircles[cid].r, Math.PI, 2*Math.PI, true);

    bgctx.moveTo(boundaryColliders[id+2].p1.x, boundaryColliders[id+2].p1.y);
    for(let i = id+2; i < id + len; i++){
        const obj = boundaryColliders[i]
        //bgctx.lineTo(obj.p1.x, obj.p1.y);
        bgctx.lineTo(obj.p2.x, obj.p2.y);
    }
    bgctx.fill();
    bgctx.stroke();
    bgctx.strokeStyle = "#000000";
    bgctx.fillStyle = "#000000";
}



function paintStopSign(id, len){
    bgctx.fillStyle = "#7E8BA8";
    bgctx.strokeStyle = "#393939";
    bgctx.lineWidth = 2;

    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
    bgctx.lineTo(boundaryColliders[id+1].p1.x, boundaryColliders[id+1].p1.y);
    bgctx.lineTo(boundaryColliders[id+1].p2.x, boundaryColliders[id+1].p2.y);
    bgctx.stroke();
    bgctx.fill();
    bgctx.fillStyle = "#BA2A2A";
    bgctx.strokeStyle = "#ffffff";
    bgctx.lineWidth = 9;
    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id+2].p1.x, boundaryColliders[id+2].p1.y);
    bgctx.lineTo(boundaryColliders[id+2].p2.x + 3, boundaryColliders[id+2].p2.y);
    for(let i = id+3; i < id + len; i++){
        const obj = boundaryColliders[i]
        bgctx.lineTo(obj.p1.x, obj.p1.y);
        bgctx.lineTo(obj.p2.x, obj.p2.y);
    }
    bgctx.fill();
    bgctx.stroke();

    
    bgctx.fillStyle = "#ffffff";
    bgctx.font = "85px sans-serif";
    bgctx.textAlign = "center";
    bgctx.fillText("STOP", 
    boundaryColliders[id+2].p1.x - (boundaryColliders[id+2].p1.x - boundaryColliders[id+2].p2.x)*0.5, 
    boundaryColliders[id+4].p2.y + (boundaryColliders[id+4].p1.y - boundaryColliders[id+4].p2.y)*0.75) 

    bgctx.fillStyle = "#000000";
}


function paintTree(id, len){
    // let bark = bgctx.createLinearGradient(boundaryColliders[id].p1.x-50,0,boundaryColliders[id].p1.x+50,0)
    // bark.addColorStop(0,"#563B27")
    // bark.addColorStop(1,"#7A6252")
    bgctx.fillStyle = "#775137"; 
    bgctx.strokeStyle = "#3A2B22";
    bgctx.lineWidth = 2; //whole #s only for performance
    //bgctx.lineCap= "round";

    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
    for(let i = id+1; i < id + len; i++){
        const obj = boundaryColliders[i]
        bgctx.lineTo(obj.p1.x, obj.p1.y);
        bgctx.lineTo(obj.p2.x, obj.p2.y);
    }
    bgctx.fill();
    bgctx.stroke();

    //outline
    // bgctx.beginPath();
    // //bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    // for(let i = id; i < id + len; i++){
    //     const obj = boundaryColliders[i]
    //         bgctx.moveTo(obj.p1.x, obj.p1.y);
    //         bgctx.lineTo(obj.p2.x, obj.p2.y);

    //     }
    //bgctx.setLineDash([15, 10, 5, 10]);

    //bark
    // const top = boundaryColliders[id+len/2].p1.x
    // const height = boundaryColliders[id+len/2].p1.y
    //
    //const obj = boundaryColliders[id]
    // bgctx.moveTo(left, obj.p1.y);
    // bgctx.lineTo(top, height);
    // if(len > 3){
    //     bgctx.strokeStyle = "#563A27";
    // for(let i = id; i < id + (len/2); i++){
    //     const obj = boundaryColliders[i]
    //     const dx = obj.p1.x - boundaryColliders[(id + len-1) - (i-id)].p2.x;
    //     const dy = obj.p1.y - boundaryColliders[(id + len-1) - (i-id)].p2.y;
    //     let small = Math.hypot(dx,dy) > 50;
    //     if(small){
    //         bgctx.lineWidth = Math.max(0.5, (len/2)-1);
    //         bgctx.beginPath();
    //         bgctx.moveTo(obj.p1.x-(dx*0.5), obj.p1.y-(dy*0.5)-5);
    //         if(i === id+len/2-1){
    //             bgctx.lineTo(obj.p2.x, obj.p2.y);
    //         } else {
    //             bgctx.lineTo(obj.p2.x-(dx*0.5), obj.p2.y-(dy*0.5));
    //         }
    //         bgctx.setLineDash([5,120]);
    //         bgctx.lineCap = "round";
    //         bgctx.stroke();
    //     }
        

    //     bgctx.lineWidth = Math.max(0.5, (len/2)-1) * 0.5;
    //     bgctx.lineWidth -= small ? 1 : 0;
    //     bgctx.beginPath();
    //     bgctx.moveTo(obj.p1.x-(dx*0.25), obj.p1.y-(dy*0.25));
    //     if(i === id+len/2-1){
    //         bgctx.lineTo(obj.p2.x, obj.p2.y);
    //     } else {
    //         bgctx.lineTo(obj.p2.x-(dx*0.25), obj.p2.y-(dy*0.25));
    //     }
    //     bgctx.lineCap = "butt";
    //     bgctx.setLineDash([35, 70, 5, 20, 18, 33, 25]);
    //     bgctx.stroke();
        
    //     bgctx.beginPath();
    //     bgctx.moveTo(obj.p1.x-(dx*0.75), obj.p1.y-(dy*0.75));
    //     if(i === id+len/2-1){
    //         bgctx.lineTo(obj.p2.x, obj.p2.y);
    //     } else {
    //         bgctx.lineTo(obj.p2.x-(dx*0.75), obj.p2.y-(dy*0.75));
    //     }
    //     bgctx.setLineDash([15, 60, 15, 25, 40, 30, 55]);
    //     bgctx.lineCap = "butt";
    //     bgctx.stroke();

    //     }
    // bgctx.setLineDash([]);
    // bgctx.lineWidth = 1.0;}

    //roots
    // bgctx.beginPath();
    // bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    // bgctx.lineTo(boundaryColliders[id].p1.x - 60, boundaryColliders[id].p1.y + 60);
    // bgctx.stroke();
    
    // bgctx.beginPath();
    // bgctx.moveTo(boundaryColliders[id+len-1].p1.x, boundaryColliders[id+len-1].p1.y);
    // bgctx.lineTo(boundaryColliders[id+len-1].p1.x + 60, boundaryColliders[id+len-1].p1.y + 60);
    // bgctx.stroke();

    //bark
}

function paintCactus(id, len, cid, clen){
    bgctx.fillStyle = "#7FD87F"; //EAFFEB D6FFD6
    bgctx.strokeStyle = "#539B58";
    bgctx.lineCap = "round";
    bgctx.lineWidth = 3;

    let width = boundaryCircles[cid].r;
    let top = boundaryCircles[cid].y - width;
    let middle = boundaryCircles[cid].x;
    let bottom = boundaryColliders[id].p1.y;

    for(let i = cid; i < cid + clen; i++){
        const obj = boundaryCircles[i];
        bgctx.beginPath();
        bgctx.arc(obj.x, obj.y, obj.r,0,2*Math.PI);
        bgctx.fill();
        
    }
    
    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
    for(let i = id+1; i < id + len; i++){
        const obj = boundaryColliders[i]
        bgctx.lineTo(obj.p1.x, obj.p1.y);
        bgctx.lineTo(obj.p2.x, obj.p2.y);
    }
    bgctx.fill();
    
    //outline
    bgctx.beginPath();
    //bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    for(let i = id; i < id + len; i++){
        const obj = boundaryColliders[i]
            bgctx.moveTo(obj.p1.x, obj.p1.y);
            bgctx.lineTo(obj.p2.x, obj.p2.y);
            bgctx.stroke();
        }
    //bgctx.setLineDash([15, 10, 5, 10]);
    for(let i = cid; i < cid + clen; i++){
        const obj = boundaryCircles[i];
        
        bgctx.moveTo(obj.x - obj.r, obj.y);
        bgctx.arc(obj.x, obj.y, obj.r,Math.PI,2*Math.PI);
        bgctx.stroke();
    }

    //needles
    //body
    bgctx.beginPath();
    bgctx.setLineDash([5, 15]);
    bgctx.moveTo(middle, top)
    bgctx.lineTo(middle, bottom)
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle + width, top - width*0.5, middle + width*0.5, bottom)
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle - width, top - width*0.5, middle - width*0.5, bottom)
    bgctx.stroke();
    
    //right arm
    bottom = boundaryColliders[id+8].p1.y;
    width = boundaryCircles[cid+1].r;
    top = boundaryCircles[cid+1].y - width;
    middle = boundaryCircles[cid+1].x;
    bgctx.setLineDash([5, 20]);
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle, top, middle, bottom)
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle - width, top, middle - width*0.5, bottom)
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle + width, top, middle + width*0.5, bottom)
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle + width, top, middle + width*0.5, bottom)
    bgctx.stroke();
    
    //right arm lower
    width = boundaryColliders[id+7].p1.x;
    top = boundaryColliders[id+7].p1.y;
    middle = boundaryColliders[id+7].p2.x + boundaryCircles[cid+1].r * 0.5;
    bottom = boundaryColliders[id+7].p2.y + boundaryCircles[cid+1].r * 0.2;
    bgctx.beginPath();
    bgctx.moveTo(width, top)
    bgctx.quadraticCurveTo(middle, top, middle, bottom)
    bgctx.stroke();
    width = boundaryColliders[id+7].p1.x;
    top = boundaryColliders[id+7].p1.y + boundaryCircles[cid+1].r;
    middle = boundaryColliders[id+7].p2.x + boundaryCircles[cid+1].r;
    bottom = boundaryColliders[id+7].p2.y + boundaryCircles[cid+1].r * 0.2;
    bgctx.beginPath();
    bgctx.moveTo(width, top)
    bgctx.quadraticCurveTo(middle, top, middle, bottom)
    bgctx.stroke();

    
    //left arm
    bottom = boundaryColliders[id+1].p2.y;
    width = boundaryCircles[cid+2].r;
    top = boundaryCircles[cid+2].y - width;
    middle = boundaryCircles[cid+2].x;
    // bgctx.beginPath();
    // bgctx.moveTo(middle, top)
    // bgctx.quadraticCurveTo(middle, top, middle, bottom)
    // bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle - width, top, middle - width*0.5, bottom)
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.moveTo(middle, top)
    bgctx.quadraticCurveTo(middle + width, top, middle + width*0.5, bottom)
    bgctx.stroke();
    //left arm lower
    width = boundaryColliders[id+1].p2.x + boundaryCircles[cid+2].r;
    top = boundaryColliders[id+1].p2.y - boundaryCircles[cid+2].r * 0.5;
    middle = boundaryColliders[id+1].p1.x + boundaryCircles[cid+2].r;
    bottom = boundaryColliders[id+1].p1.y - boundaryCircles[cid+2].r * 0.5;
    bgctx.setLineDash([5, 25]);
    bgctx.beginPath();
    bgctx.moveTo(width, top)
    bgctx.quadraticCurveTo(middle, bottom, middle, bottom)
    bgctx.stroke();
    width = boundaryColliders[id+1].p2.x + boundaryCircles[cid+2].r * 2;
    top = boundaryColliders[id+1].p2.y - boundaryCircles[cid+2].r;
    middle = boundaryColliders[id+1].p1.x + boundaryCircles[cid+2].r;
    bottom = boundaryColliders[id+1].p1.y - boundaryCircles[cid+2].r;
    bgctx.beginPath();
    bgctx.moveTo(width, top)
    bgctx.quadraticCurveTo(middle, bottom, middle, bottom)
    bgctx.stroke();
    bgctx.closePath();

    bgctx.fillStyle = "#000000";
    bgctx.strokeStyle = "#000000";
    bgctx.setLineDash([]);
    bgctx.lineCap = "butt";
    bgctx.lineWidth = 1;
}
