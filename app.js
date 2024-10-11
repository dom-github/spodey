//const e = require("express");

const canvas = document.getElementById("worldCanvas");
const viewport = document.getElementById("viewport");
const background = document.getElementById('background');


//viewport.id = "viewport";
viewport.width = window.innerWidth;// * 0.99;
viewport.height = window.innerHeight;// * 0.99;


const context = canvas.getContext("2d", { alpha: false });
const vctx = viewport.getContext("2d", { alpha: false });

const bgctx = background.getContext("2d", { alpha: false });


console.log(viewport.clientHeight, viewport.clientWidth)
console.log(window.innerHeight, window.innerWidth)


//15360
const worldSize = {width: 15360, height: 6666};

background.width = window.innerWidth;
background.height = window.innerHeight;
// canvas.width = worldSize.width;
// canvas.height = worldSize.height;

const worldScale = 3;
//const worldCanvas = {width: canvas.width, height: canvas.height}
// canvas.width *= worldScale;
// canvas.height *= worldScale;
// background.width *= worldScale;
// background.height *= worldScale;
//context.save();


window.onresize = setDim;
function setDim() {

    viewport.width =  window.innerWidth;
    viewport.height = window.innerHeight;
    
    viewport.width = Math.max(400, viewport.width);
    viewport.height = Math.max(300,viewport.height);
    
}
context.scale(worldScale, worldScale)
bgctx.scale(worldScale, worldScale)
//vctx.scale(0.5, 1)

const framerate = 60;
const perfectFrameTime = 1000 / framerate;
let deltaTime = 1;
let prevTimestamp = 0;
let lastTimestamp = 0;

//debug infos

let jactive = false;

//42 is the answer
const spideyRadius = 50;

const EPSILON = 0.00000001

const areEqual = (one, other, epsilon = EPSILON) =>
Math.abs(one - other) < epsilon

const toDegrees = radians => (radians * 180) / Math.PI
const toRadians = degrees => (degrees * Math.PI) / 180

const zoomEvent = new Event('zoom')
let currentRatio = window.devicePixelRatio

function checkZooming() {
  if (currentRatio !== window.devicePixelRatio) {
    window.dispatchEvent(zoomEvent)
  }
}

window.addEventListener('resize', checkZooming)

// usage
window.addEventListener('zoom', (e) => {
  console.log('zoomed!')
    console.log(window.innerHeight, window.innerWidth)
})

// Pawel
function pointInTriangle (p, p0, p1, p2) {
    return (((p1.y - p0.y) * (p.x - p0.x) - (p1.x - p0.x) * (p.y - p0.y)) | ((p2.y - p1.y) * (p.x - p1.x) - (p2.x - p1.x) * (p.y - p1.y)) | ((p0.y - p2.y) * (p.x - p2.x) - (p0.x - p2.x) * (p.y - p2.y))) >= 0;
  }

class Vector {
    constructor(...components) {
        this.components = components
    }
    //scaleBy
    
    scaleBy(number) {
        return new Vector(
        ...this.components.map(component => component * number)
        )
    }
    //ADD
    //let v = new Vector(1, 2, 3);
    add({ components }) {
        return new Vector(
        ...components.map((component, index) => this.components[index] + component)
        )
    }
    subtract({ components }) {
        return new Vector(
        ...components.map((component, index) => this.components[index] - component)
        )
    }
    
    length() {
        return Math.hypot(...this.components)
    }

    dotProduct({ components }) {
        return components.reduce((acc, component, index) => acc + component * this.components[index], 0)
    }
    
    //normalize
    normalize() {
        return this.scaleBy(1 / this.length())
    }

    haveSameDirectionWith(other) {
        const dotProduct = this.normalize().dotProduct(other.normalize())
        return areEqual(dotProduct, 1)
    }

    haveOppositeDirectionTo(other) {
        const dotProduct = this.normalize().dotProduct(other.normalize())
        return areEqual(dotProduct, -1)
    }
    
    isPerpendicularTo(other) {
        const dotProduct = this.normalize().dotProduct(other.normalize())
        return areEqual(dotProduct, 0)
    }

    angleBetween(other) {
        return toDegrees(
            Math.acos(
            this.dotProduct(other) /
            (this.length() * other.length())
            )
        )
        }

    negate() {
        return this.scaleBy(-1)
    }

    projectOn(other) {
        const normalized = other.normalize()
        return normalized.scaleBy(this.dotProduct(normalized))
    }
    
    withLength(newLength) {
        return this.normalize().scaleBy(newLength)
    }

    equalTo({ components }) {
        return components.every((component, index) => areEqual(component, this.components[index]))
    }
}


/*
 * @description Get information about the intersection points of a circle.
 * Adapted from: https://stackoverflow.com/a/12221389/5553768.
 * @param {Object} c1 An object describing the first circle.
 * @param {float} c1.x The x coordinate of the circle.
 * @param {float} c1.y The y coordinate of the circle.
 * @param {float} c1.r The radius of the circle.
 * @param {Object} c2 An object describing the second circle.
 * @param {float} c2.x The x coordinate of the circle.
 * @param {float} c2.y The y coordinate of the circle.
 * @param {float} c2.r The radius of the circle.
 * @returns {Object} Data about the intersections of the circles.
 */
function intersection(c1, c2) {
    // Start constructing the response object.
    const result = {
        intersect_count: 0,
        intersect_occurs: true,
        one_is_in_other: false,
        are_equal: false,
        point_1: { x: null, y: null },
        point_2: { x: null, y: null },
    };

    // Get vertical and horizontal distances between circles.
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;

    // Calculate the distance between the circle centers as a straight line.
    const dist = Math.hypot(dy, dx);

    // Check if circles intersect.
    if (dist > c1.r + c2.r) {
        result.intersect_occurs = false;
    }

    // Check one circle isn't inside the other.
    if (dist < Math.abs(c1.r - c2.r)) {
        result.intersect_occurs = false;
        result.one_is_in_other = true;
    }

    // Check if circles are the same.
    if (c1.x === c2.x && c1.y === c2.y && c1.r === c2.r) {
        result.are_equal = true;
        result.are_equal = true;
    }

    // Find the intersection points
    if (result.intersect_occurs) {
        // Centroid is the pt where two lines cross. A line between the circle centers
        // and a line between the intersection points.
        const centroid = (c1.r * c1.r - c2.r * c2.r + dist * dist) / (2.0 * dist);

        // Get the coordinates of centroid.
        const x2 = c1.x + (dx * centroid) / dist;
        const y2 = c1.y + (dy * centroid) / dist;

        // Get the distance from centroid to the intersection points.
        const h = Math.sqrt(c1.r * c1.r - centroid * centroid);

        // Get the x and y dist of the intersection points from centroid.
        const rx = -dy * (h / dist);
        const ry = dx * (h / dist);

        // Get the intersection points.
        result.point_1.x = Number((x2 + rx).toFixed(15));
        result.point_1.y = Number((y2 + ry).toFixed(15));

        result.point_2.x = Number((x2 - rx).toFixed(15));
        result.point_2.y = Number((y2 - ry).toFixed(15));new Vector

        // Add intersection count to results
        if (result.are_equal) {
            result.intersect_count = null;
        } else if (result.point_1.x === result.point_2.x && result.point_1.y === result.point_2.y) {
            result.intersect_count = 1;
        } else {
            result.intersect_count = 2;
        }
    }
    return result;
}



let position = new Vector(0, 0);
let speed = new Vector(0, 0);
let mousedir = new Vector(0, 0);
let cursorPos = new Vector(viewport.width * 0.5, viewport.height * 0.5);
let mousePosition = {x: viewport.width * 0.5, y: viewport.height * 0.5}

    function sqr(x) { return x * x }
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    //p = point, v = linestart, w = lineend
    function distToSegmentSquared(p, v, w) {
        let l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return dist2(p, { x: v.x + t * (w.x - v.x),
                        y: v.y + t * (w.y - v.y) });
    }
    function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

    //return the point
    function closestSegmentPoint(p, v, w) {
        let l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return { x: v.x + t * (w.x - v.x),
                y: v.y + t * (w.y - v.y) };
    }

let layWeb = false;
let webOrigin = {x: 0, y: 0, webID: -1}

function getNearestWalkLine(x, y){
    let nearest = 9999999;
    let line = -1;
    for(let i=0; i<walkLines.length; i++){
        if (walkLines[i].valid) {
            const point = closestSegmentPoint({x: x, y:x},
            walkLines[i].p1, walkLines[i].p2)
            const dist = dist2({x: x, y: y}, point)
            
            if (dist < nearest) {
                line = i;
                nearest = dist;
            }
        if(jactive){
            context.fillStyle = "#ee5555"
            context.fillCircle(spideyPos.x + point.x,spideyPos.y + point.y, 5);
            context.fillStyle = "#000000"
        }
        
        }
    };
    return line;
}

let LMBHeld = 0;
let RMBHeld = 0;
let LMBDouble = 0;
let RMBDouble = 0;
function mousedown(e){
    if(mouseFocus) {
        // const w = viewport.width;
        // const h = viewport.height;
        mouseCursor.x = !LMBHeld && !RMBHeld ? 0 : mouseCursor.x// + Math.max(0,Math.min(spideyPos.x - (w * 0.5), worldCanvas.width - w));
        mouseCursor.y = !LMBHeld && !RMBHeld ? 0 : mouseCursor.y// + Math.min(spideyPos.y - (h * 0.5), worldCanvas.height - h);
        cursorPos = new Vector(mouseCursor.x, mouseCursor.y)
        cursorPos = cursorPos.scaleBy(Math.min(1,spideyRadius / cursorPos.length()))
        const moveX = mousedir.components[0] * spideyRadius;
        const moveY = mousedir.components[1] * spideyRadius;
        let dist = 999999;
        let closest = -1;
        let count = 0;
        for(let i=0;i<spideyLegs.length;i++){
            

            //anim ID is lt all attack anims
            if ((e.button === 0 && (legMods[i].anim === grabWeb || legMods[i].anim === readyWeb || legMods[i].anim === throwWeb)) || ((legMods[i].anim === readyStrike || legMods[i].anim === throwStrike) && e.button === 2)) {
                count++;
                closest = i;
                dist = 0;
            } else if (legMods[i].anim < grabWeb) {
                const distTo = dist2({x: legMods[i].x + spideyLegs[i].x, y: legMods[i].y + spideyLegs[i].y}, {x: moveX, y: moveY});
                closest = distTo < dist ? i : closest;
                dist = distTo < dist ? distTo : dist;
            }
        }

        if (closest > -1) {
            const mirror = closest < 4 ? closest + 4: closest - 4;

            if (e.button === 0){
                LMBHeld = lastTimestamp;
                //console.log("Doubleclick?", LMBHeld - LMBDouble);
                if (count === 0){
                    legMods[closest].anim = grabWeb;
                    legMods[closest].start = lastTimestamp;
                    legMods[closest].dx = -spideyLegs[closest].x;
                    legMods[closest].dy = -spideyLegs[closest].y;
                } else if (count === 1 && LMBHeld - LMBDouble < 500 ) {
                    //console.log("Ldlbclick!")
                        //restart anim on dblclick
                        legMods[closest].anim = grabWeb;
                        legMods[closest].start = lastTimestamp;
                        legMods[closest].dx = -spideyLegs[closest].x;
                        legMods[closest].dy = -spideyLegs[closest].y;
                        legMods[mirror].anim = grabWeb;
                        legMods[mirror].start = lastTimestamp;
                        legMods[mirror].dx = -spideyLegs[mirror].x;
                        legMods[mirror].dy = -spideyLegs[mirror].y;
                    }
                
            

            } else if(e.button === 2 ){
            RMBHeld = lastTimestamp;
            //console.log("RDoubleclick?", RMBHeld - RMBDouble);
            if(count === 0){
                legMods[closest].anim = readyStrike;
                legMods[closest].start = lastTimestamp;
                legMods[closest].dx = 0;
                legMods[closest].dy = -spideyLegs[closest].y * 2;
            }else if (count === 1 && RMBHeld - RMBDouble < 500){
                //console.log("Rdlbclick!")
                legMods[closest].anim = readyStrike;
                legMods[closest].start = lastTimestamp;
                legMods[closest].dx = 0;
                legMods[closest].dy = -spideyLegs[closest].y * 2;
                legMods[mirror].anim = readyStrike;
                legMods[mirror].dx = 0;
                legMods[mirror].dy = -spideyLegs[mirror].y * 2;
                legMods[mirror].start = lastTimestamp;
            }
            
            }
        }
        

    } else {
        mouseCursor.x = e.clientX;
        mouseCursor.y = e.clientY;
    }
    
}
function mouseup(e){
    if (mouseFocus && e.button === 0){
        //console.log(lastTimestamp - LMBHeld)
        LMBDouble = LMBHeld;
        LMBHeld = 0;
        //layWeb? placeWeb() : startWeb();
    } else if (mouseFocus && e.button === 2) {
        //console.log(lastTimestamp - RMBHeld);
        RMBDouble = RMBHeld;
        RMBHeld = 0;
        //stopWeb();
    }}
function mouseout(){console.log('mouseout')}
// function clickFunction(e) {
//     //console.log(e)
// }
// function rightClickFunction() {
//     stopWeb()
// }

function startWeb(){
    const tx = cursorPos.components[0] + spideyPos.x;
    const ty = cursorPos.components[1] + spideyPos.y;
    //console.log("start");
    let walkArea = false;

    //walkAreas
    areaCircles.forEach((x) => {
        const intersect = intersection({x: tx, 
            y: ty, r: spideyRadius/5}, x)
            //console.log(intersect)
            if (intersect.one_is_in_other){
                webOrigin.x = tx;
                webOrigin.y = ty;
                layWeb = true;
                walkArea = true;
            }
    });
    
    areaBoxes.forEach((x) => { 
        if(tx >= x.p1.x - 1
            && tx <= x.p2.x + 1
            && ty <= x.p1.y + 1
            && ty >= x.p2.y - 1){
            if(x.p3){
                if(
                pointInTriangle({x: tx, y: ty}, x.p5, x.p6, x.p3)
                || pointInTriangle({x: tx, y: ty}, x.p5, x.p6, x.p4)
                ) {
                    // console.log("startweb triangle");
                    webOrigin.x = tx;
                    webOrigin.y = ty;
                    layWeb = true;
                    walkArea = true;
                }
            } else {
                webOrigin.x = tx;
                webOrigin.y = ty;
                layWeb = true;
                walkArea = true;
            }
        }}
    );

    if(!walkArea){
        const line = getNearestWalkLine(cursorPos.components[0], cursorPos.components[1]);
        if (line > -1) {
            const start = closestSegmentPoint({x: cursorPos.components[0], y: cursorPos.components[1]}, 
            {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
            {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, );
            webOrigin.x = spideyPos.x + start.x;
            webOrigin.y = spideyPos.y + start.y;
            webOrigin.webID = walkLines[line].webID;
            layWeb = true;        
        };
    } else {
        webOrigin.x = tx;
        webOrigin.y = ty;
        layWeb = true;
    }
}

function stopWeb(){
    //console.log("stop");
    
    // const tx = cursorPos.components[0] + spideyPos.x;
    // const ty = cursorPos.components[1] + spideyPos.y;
    const len = Math.hypot(cursorPos.components[0], cursorPos.components[1])
    if(len < spideyRadius/5
        || (lastTimestamp - RMBDouble < 300 && len < spideyRadius / 2)) {
        layWeb = false;
    }
    
}
function launchWeb(leg){
    

    if(
        Math.hypot(mouseCursor.x, mouseCursor.y) > spideyRadius 
        && lastTimestamp - LMBDouble > 500 ) {
        //console.log(LMBDouble)
        var scaled = new Vector(mouseCursor.x, mouseCursor.y);
        //scaled = scaled.scaleBy(2);
        scaled = scaled.scaleBy(Math.min(2, (spideyRadius*4)/scaled.length()));
        let other = -1;
        for(let i=0;i<spideyLegs.length;i++){
            if (legMods[i].anim === throwWeb && i !== leg){
                other = i;
                legMods[i].anim = falling ? none : walking;
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].start = lastTimestamp;
                legMods[i].dx = 0;
                legMods[i].dy = 0;
            }
        }
        //console.log(other)
        
        if (!layWeb || (layWeb && shiftPressed)){
            const type = other >= 0 ? 0 : 1;
            if (type) scaled = scaled.scaleBy(0.85)
            projectiles.push({type: type, x: spideyPos.x, y: spideyPos.y, speedx: scaled.components[0] + speed.components[0], speedy: scaled.components[1] + speed.components[1], start: lastTimestamp})
        } else {
            placeWeb();
            if (other >= 0) startWeb();
        }
    } else {
        if(layWeb){
            placeWeb();
        } else {
            startWeb();
            //if startweb fails ... maybe remove
            if (falling && !layWeb) {
                var scaled = new Vector(mouseCursor.x, mouseCursor.y);
                //scaled = scaled.scaleBy(2);
                scaled = scaled.scaleBy(Math.min(2, (spideyRadius*4)/scaled.length())).scaleBy(0.75);
                projectiles.push({type: 1, x: spideyPos.x, y: spideyPos.y, speedx: scaled.components[0] + speed.components[0], speedy: scaled.components[1] + speed.components[1], start: lastTimestamp})
            }
        };
    }
    
    
}

function doubleClamp(d, min, max) {
    const t = d < min ? min : d;
    return t > max ? max : t;
  }
function placeWeb(){

    //targets
    const tx = cursorPos.components[0] + spideyPos.x;
    const ty = cursorPos.components[1] + spideyPos.y;
    const dist = dist2({x: tx, y: ty}, {x: webOrigin.x, y: webOrigin.y});
    //console.log(Math.sqrt(dist));
    //don't make short webs 
    if(Math.sqrt(dist) > spideyRadius/4) {
        let walkArea = false;
        let p1, p2;
        let lineID = -1;
        //walkAreas
        areaCircles.forEach((x) => {
            const intersect = intersection({x: tx, 
                y: ty, r: 1}, x)
                //console.log(intersect)
                if (intersect.one_is_in_other){
                    walkArea = true;
                    layWeb = false;
                    // length: dist, 
                    //webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {x: tx, y: ty}, solid: false, stuck: [], attached: [], attachedTo: [webOrigin.webID, -1]})
                    p1 = {x: webOrigin.x, y: webOrigin.y};
                    p2 = {x: tx, y: ty};
                }
        });
        if (!walkArea){
            areaBoxes.forEach((x) => { 
                if(tx >= x.p1.x - 1
                    && tx <= x.p2.x + 1
                    && ty <= x.p1.y + 1
                    && ty >= x.p2.y - 1){
                    if(x.p3){
                        // console.log("triangle check");
                        if(
                        pointInTriangle({x: tx, y: ty}, x.p5, x.p6, x.p3)
                        || pointInTriangle({x: tx, y: ty}, x.p5, x.p6, x.p4)
                        ) {
                            // console.log("placeweb triangle");
                            walkArea = true;
                            layWeb = false;
                            //webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {x: doubleClamp(tx, x.p1.x, x.p2.x),
                            //    y: doubleClamp(ty, x.p2.y, x.p1.y)}, solid: false, stuck: [], attached: [], attachedTo: [webOrigin.webID, -1]})
                            p1 = {x: webOrigin.x, y: webOrigin.y};
                            p2 = {x: doubleClamp(tx, x.p1.x, x.p2.x), y: doubleClamp(ty, x.p2.y, x.p1.y)};
                        }
                    } else {
                        walkArea = true;
                        layWeb = false;
                        //webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {x: doubleClamp(tx, x.p1.x, x.p2.x),
                        //    y: doubleClamp(ty, x.p2.y, x.p1.y)}, solid: false, stuck: [], attached: [], attachedTo: [webOrigin.webID, -1]})
                        p1 = {x: webOrigin.x, y: webOrigin.y};
                        p2 = {x: doubleClamp(tx, x.p1.x, x.p2.x), y: doubleClamp(ty, x.p2.y, x.p1.y)};
                    }
                }});
            }
        if(!walkArea){
            const line = getNearestWalkLine(cursorPos.components[0], cursorPos.components[1]);
            if (line > -1) {
                const start = closestSegmentPoint({x: cursorPos.components[0], y: cursorPos.components[1]}, 
                {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
                {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, );
                const place = {x: spideyPos.x + start.x, y: spideyPos.y + start.y};
                if (Math.sqrt(dist2(place, {x: webOrigin.x, y: webOrigin.y})) > spideyRadius/4) {
                        
                    layWeb = false;
                    //webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: place, solid: false, stuck: [], attached: [], attachedTo: [webOrigin.webID, walkLines[line].webID]})
                    p1 = {x: webOrigin.x, y: webOrigin.y};
                    p2 = place;
                    lineID = walkLines[line].webID;
                }
            //console.log(boundaryColliders.length, deltaTime)
            };
        }
        //push a new web
        //dont push if orig and dest are on the same web 
        if (!layWeb && (webOrigin.webID !== lineID || lineID === -1)){
            webArray.push({p1: p1, p2: p2, solid: false, stuck: [], vibros: [], attached: [], attachedTo: [webOrigin.webID, lineID]});
            if(webOrigin.webID > -1) webArray[webOrigin.webID].attached.push(webArray.length - 1);
            if(lineID > -1) webArray[lineID].attached.push(webArray.length - 1);
            webOrigin.webID = -1;
            console.log(webArray)
        }
    }
    
}


function getTransformedPoint(x, y) {
    const transform = context.getTransform();
    const transformedX = x - transform.e;
    const transformedY = y - transform.f;
    return { x: transformedX, y: transformedY };
}


//drawCursor
function drawCursor() {
   //console.log(mouseCursor.lastMove, lastTimestamp)
    // if (mouseCursor.lastMove > 0 && lastTimestamp - mouseCursor.lastMove < 700){
    if (LMBHeld || RMBHeld){
        if (dist2({x: mouseCursor.x + spideyPos.x, y: mouseCursor.y + spideyPos.y},
                {x: spideyPos.x, y: spideyPos.y}) < spideyRadius*spideyRadius){
        context.strokeStyle = 'rgba(255, 255, 255, 1)';
    }   else {
        context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    }
    context.lineWidth = 3;
    context.beginPath();
    context.strokeCircle(mouseCursor.x + spideyPos.x, mouseCursor.y + spideyPos.y, 8);
    context.strokeCircle(mouseCursor.x + spideyPos.x, mouseCursor.y + spideyPos.y, 3);
    // context.strokeCircle(cursorPos.components[0] + spideyPos.x, cursorPos.components[1] + spideyPos.y, 8);
    // context.strokeCircle(cursorPos.components[0] + spideyPos.x, cursorPos.components[1] + spideyPos.y, 3);
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    } 
}


viewport.addEventListener("click", async () => {
    if (!document.pointerLockElement) {
    await viewport.requestPointerLock({
        unadjustedMovement: true,
    });
    }
    
});

let mouseCursor = {x: 0, y: 0, lastMove: 0};
function mouseMove(e){
    mousePosition.x += e.movementX * 0.5;
    mousePosition.y += e.movementY * 0.5;
    mouseCursor.x += e.movementX * 0.5;
    mouseCursor.y += e.movementY * 0.5;
    mouseCursor.x = Math.min(viewport.width*0.5 / worldScale, Math.max(-viewport.width*0.5 / worldScale, mouseCursor.x));
    mouseCursor.y = Math.min(viewport.height*0.5 / worldScale, Math.max(-viewport.height*0.5 / worldScale, mouseCursor.y));
    mouseCursor.lastMove = lastTimestamp;
    mousedir = new Vector(e.movementX * 0.5, e.movementY * 0.5)
    cursorPos = new Vector(mouseCursor.x, mouseCursor.y)
    cursorPos = cursorPos.scaleBy(Math.min(1,spideyRadius / cursorPos.length()))
    //console.log(e)
}

document.addEventListener("pointerlockchange", lockChangeAlert, false);
let mouseFocus = false;
function lockChangeAlert() {
    if (document.pointerLockElement === viewport) {
        mouseFocus = true;
        //console.log("The pointer lock status is now locked");
        document.addEventListener("mousemove", mouseMove, false);
    } else {
        mouseFocus = false;
        //console.log("The pointer lock status is now unlocked");
        document.removeEventListener("mousemove", mouseMove, false);
    }
}


//track since last move 
// canvas.addEventListener('mousemove', event => {
//     const transformedCursorPos = getTransformedPoint(event.offsetX, event.offsetY);
//     //console.log(mouseCursor);
//     mouseCursor = {...mouseCursor, x: transformedCursorPos.x, y: transformedCursorPos.y, lastMove: lastTimestamp}
// })

//draw circle function
CanvasRenderingContext2D.prototype.strokeCircle = function (x,y,r) {
    this.beginPath();
    this.arc (x,y,r,0,2*Math.PI);
    this.stroke();
}
//draw halfcircle function
CanvasRenderingContext2D.prototype.strokeHalfCircle = function (x,y,r) {
    //this.beginPath();
    this.arc (x,y,r,Math.PI,2*Math.PI);
    this.stroke();
}

//draw circle function
CanvasRenderingContext2D.prototype.fillCircle = function (x,y,r) {
    this.beginPath();
    this.arc (x,y,r,0,2*Math.PI);
    this.fill();
}

//canvas.addEventListener('click', clickFunction, false);
//canvas.addEventListener('mouserelease', function(){console.log('mouserel')}, false);

function ongoingTouchIndexById(idToFind) {
    for (let i = 0; i < ongoingTouches.length; i++) {
      const id = ongoingTouches[ i ].identifier;
  
      if (id == idToFind) {
        return i;
      }
    }
    return -1;    // not found
  }

function touchStart(evt) {
    evt.preventDefault();
    console.log("touchstart.");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
        console.log(`touchstart: ${i}.`);
      ongoingTouches.push(copyTouch(touches[i]));
    }
  }

  function copyTouch({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
  }
  function touchCancel(evt) {
    evt.preventDefault();
    console.log("touchcancel.");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      let idx = ongoingTouchIndexById(touches[i].identifier);
      ongoingTouches.splice(idx, 1); // remove it; we're done
    }
  }
  function touchMove(evt) {
    evt.preventDefault();
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      const idx = ongoingTouchIndexById(touches[i].identifier);
  
      if (idx >= 0) {
  
        ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
      } else {
        console.log("can't figure out which touch to continue");
      }
    }
  }

  function touchEnd(evt) {
    evt.preventDefault();
    console.log("touchend");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      let idx = ongoingTouchIndexById(touches[i].identifier);
  
      if (idx >= 0) {
        ongoingTouches.splice(idx, 1); // remove it; we're done
      } else {
        console.log("can't figure out which touch to end");
      }
    }
  }
//touch events ..!
const ongoingTouches = [];
viewport.addEventListener("touchstart", touchStart);
viewport.addEventListener("touchend", touchEnd);
viewport.addEventListener("touchcancel", touchCancel);
viewport.addEventListener("touchmove", touchMove);

viewport.addEventListener('mousedown', mousedown, false);
viewport.addEventListener('mouseout', mouseout, false);
viewport.addEventListener('mouseup', mouseup, false);
viewport.addEventListener('contextmenu', function(ev) {
//    ev.preventDefault();
//    rightClickFunction();
}, false);

    //enemies
const enemies = [];

//anims for enemies
const flying = 0;
const stuck = 1;
const dead = 2;
const tethered = 3;
const wrapped = 4; //maybe replace with a generic item that takes enemy size 

//projectiles/phys objs

const projectiles = [];

//sene objects
const scnObj = [];
//obj types
const ground = 0;
const rockMed = 1;
const stopSign = 2;
const cactus = 3;
const tree = 4;


//boundaries
const buffer = 3;
const topLeft = {x: 0 + buffer, y: 0 + buffer};
const topRight = {x: worldSize.width - buffer, y: 0 + buffer};
const bottomRight = {x: worldSize.width - buffer, y: worldSize.height - buffer};
const bottomLeft = {x: 0 + buffer, y: worldSize.height - buffer};
const boundaryCorners = [topLeft, topRight, bottomRight, bottomLeft];
const barrierColliders = [];
const boundaryColliders = [];
const webArray = [];
const groundHeight = 200;

const boundaryCircles = [];
const areaCircles = [];
const areaBoxes = [];


function addBoundaries() {

    
    boundaryColliders.push({p1: bottomRight, p2: bottomLeft, solid: true});
    //console.log('start')
    // for (let i=0; i<boundaryCorners.length; i++) {
    //     const p1 = boundaryCorners[i];
    //     const p2 = boundaryCorners[(i + 1) % 4];
    //     boundaryColliders.push({p1, p2, solid: true});
    // }
    //centre lines
    //boundaryColliders.push({p1: {x: worldCanvas.width / 2, y: 0}, p2: {x: worldCanvas.width / 2, y: worldCanvas.height}})
    //boundaryColliders.push({p1: {x: 0, y: worldCanvas.height / 2}, p2: {x: worldCanvas.width, y: worldCanvas.height / 2}})

// ground
const id = areaBoxes.length;
scnObj.push({id: id, type: ground, length: 1});
areaBoxes.push({p1: {x: 0, y: worldSize.height}, p2: {x: worldSize.width, y: worldSize.height - groundHeight}});
boundaryColliders.push({p1: {x: 0, y: worldSize.height - groundHeight},p2: {x: worldSize.width, y: worldSize.height - groundHeight}, solid: false});


//fill da screen by width
// 15360px
// every ~300 px or so
for(let i=333;i<worldSize.width+333;i+=300){
    const type = Math.random();
    const scale = 0.25 + 2 * Math.random();
    const ground = worldSize.height - groundHeight + 15;
    const height = ground - worldSize.height * Math.random() + 15;
    //console.log(type)
    //enemies.push({type: 0, x: i, y: height, start: 1000 *  Math.random(), dx: i, dy: height, active: true, anim: flying});
    if (type < 0.25){
            
        } else if (type < 0.15) {
            i+=80 * scale;
            drawRockMed(i, ground + 160 * Math.random(), -scale, true);
            //drawRockMed(i, ground, scale);
        } else if (type < 0.35) {
            drawRockMed(i, ground, scale);
        } else if (type < 0.75) {
            i+=40;
            drawCactus(i, ground + 150 * Math.random(), 1);
            i+=40;
        } else if (type < 0.95) {
            i+=300;
            drawTree(i, ground + 125 * Math.random(), 15 + (85 * Math.random()), 1 + (Math.floor(8 * Math.random())), 40*Math.random()-20);
            i+=300;
        } else {
            drawStopSign(i, ground + 40 * Math.random(), 1.2);
        }
    }
    console.log("enemies:", enemies.length, "objs:", scnObj.length, "boundaries:", boundaryColliders.length, boundaryCircles.length, "areas:", areaBoxes.length, areaCircles.length)


//drawTree(666, worldSize.height - 25, 15 + (85 * Math.random()), 1 + Math.floor(7 * Math.random()), 40*Math.random()-20);
    // boundaryCircles.push({x: 300, y: 600, r: 120, half: false, solid: false});
    // areaCircles.push({x: 300, y: 600, r: 120});

    //drawStopSign(450, worldCanvas.height - 3, 1.2);
// boundaryCircles.push({x: 550, y: 637, r: 80, half: false, solid: false});
//boundaryCircles.push({x: 50, y: 100, r: 20, half: false, solid: true});
}

addBoundaries(); 
//bgpostctx.drawImage();

function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
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
    const box = areaBoxes[id]
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

//lets draw a rock
//    /\
//  /   |_ 
// |      \ 
//         
//          
function drawRockMed(x,y,s,r){
    let height = r? Math.abs(100 * s) : 100 * s;
    
    const width = 80 * s;
    const top = y - height;
    const leftSide = x - width;
    const rightSide = x + width;

    const col = false;

    const id = boundaryColliders.length;
    scnObj.push({id: id, length: 4, type: rockMed});
    
    // // bottom
    // boundaryColliders.push({p1: {x: leftSide, y: y}, p2: {x: rightSide + width/2, y: y}, solid: col});
   
  // right
    boundaryColliders.push({p1: {x: rightSide + width/2, y: y}, p2: {x: rightSide, y: top + height/4}, solid: col});
     // right
    boundaryColliders.push({p1: {x: rightSide, y: top + height/4}, p2: {x: x, y: top}, solid: col});
      // left
    boundaryColliders.push({p1: {x: x, y: top}, p2: {x: leftSide + width/2, y: top + height/8}, solid: col});
    // left
    boundaryColliders.push({p1: {x: leftSide + width/2, y: top + height/8}, p2: {x: leftSide, y: y}, solid: col});
   
    areaBoxes.push({p1: {x: Math.min(leftSide + width/2, rightSide), y: y}, p2: {x: Math.max(leftSide + width/2, rightSide), y: top + height/4}})
 

}

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

//lets draw a stop sign
//     ___  
//   /     \
//  |       |
//   \ ___ /
//     ||
//     ||
//     ||
//     ||

function drawStopSign(x,y,s){
    const height = 360 * s;
    const width = 10 * s;
    const top = y - height;
    const leftSide = x - width;
    const rightSide = x + width;

    const sideLength = 60 * s;
    const col = false;

    const id = boundaryColliders.length;
    const circID = areaCircles.length;
    scnObj.push({id: id, length: 10, type: stopSign});
    //pole
    boundaryColliders.push({p1: {x: leftSide, y: y}, p2: {x: leftSide, y: top}, solid: col});
    boundaryColliders.push({p1: {x: rightSide, y: top}, p2: {x: rightSide, y: y}, solid: col});
    areaBoxes.push({p1: {x: leftSide, y: y}, p2: {x: rightSide, y: top}})

    //bottom
    boundaryColliders.push({p1: {x: x - sideLength * 0.9, y: top}, p2: {x: x + sideLength * 0.9, y: top}, solid: col});

    boundaryColliders.push({p1: {x: x - sideLength * 0.9, y: top}, p2: {x: x - sideLength*1.8, y: top - sideLength}, solid: col});
    boundaryColliders.push({p1: {x: x - sideLength*1.8, y: top - sideLength}, p2: {x: x - sideLength*1.8, y: top - sideLength*2.5}, solid: col});
    boundaryColliders.push({p1: {x: x - sideLength * 0.9, y: top - sideLength*3.6}, p2: {x: x - sideLength*1.8, y: top - sideLength*2.5}, solid: col});
    boundaryColliders.push({p1:{x: x - sideLength * 0.9, y: top - sideLength*3.6}, p2: {x: x + sideLength * 0.9, y: top - sideLength*3.6}, solid: col});

    boundaryColliders.push({p1: {x: x + sideLength * 0.9, y: top - sideLength*3.6}, p2: {x: x + sideLength*1.8, y: top - sideLength*2.5}, solid: col});

    boundaryColliders.push({p1: {x: x + sideLength*1.8, y: top - sideLength*2.5}, p2: {x: x + sideLength*1.8, y: top - sideLength}, solid: col});

    boundaryColliders.push({p1: {x: x + sideLength*1.8, y: top - sideLength}, p2: {x: x + sideLength * 0.9, y: top}, solid: col});

    
    areaCircles.push({x: x, y: top - sideLength - (sideLength * 0.8), r: sideLength * 1.8, half: false, solid: true});
    //boundaryCircles.push({x: x, y: top - sideLength - (sideLength * 0.8), r: sideLength * 1.8, half: false, solid: false});
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

function rotate_point(cx, cy, angle, p){

    return {x:(Math.cos(angle) * (p.x - cx) - Math.sin(angle) * (p.y - cy) + cx),
                 y: (Math.sin(angle) * (p.x - cx) + Math.cos(angle) * (p.y - cy) + cy)};
}

//let's draw a tree???
/*
                    *****
                *****+/***,  .,
              ** ***+**|*+*****
               ****+**+*+*+*+***
            **_*\***+**+/**+*"
            *****+_\ |} |//
             ``   \\  } /
                   \|{ |
                    | {|
                    |} |
                    | {|
                  _/  \ \_
                     `
*/

// rectangle trunk - h/w
// 1-3 triangles to <<top>> 
// 1-3 per sub
// half w/h per section 
// up to 3 subsection
// d o n e 

function drawTree(x, y, s, seg, ang){
    //const rseed = 100 * Math.random();
    const left =  x - (s*0.5)
    //const right = x + (s*0.5)

    const id = boundaryColliders.length;
    const areaid = areaBoxes.length;
    //areaBoxes.push({p1: {x: left, y: y}, p2: {x: right, y: height}});
    const angR = toRadians(ang);
    // const rotL = rotate_point(x, y, angR, {x: left, y: y})
    // const rotR = rotate_point(x, y, -angR, {x: right, y: y})
    //bottom
    //boundaryColliders.push({p1: {x: right, y: y}, p2: {x: left, y: y}, solid: false});
    //boundaryColliders.push({p1: {...rotR}, p2: {...rotL}, solid: false});
    //left
    //boundaryColliders.push({p1: {x: left, y: y}, p2: {x: left, y: height}, solid: false}); 

    let len = 0;
    //let angAr = [];
    //left
    for(let k=0;k<=seg;k++){
        const rlength = s + s + seg +((s*4) * Math.random());
        const ang2 = (20 * Math.random()) - 10;
        const ang2R = toRadians(ang2);
        //angAr.push(ang2R);
        const sx = k === 0 ? left : boundaryColliders[boundaryColliders.length - 1].p2.x;
        const sy = k === 0 ? y : boundaryColliders[boundaryColliders.length - 1].p2.y;
        const prot = rotate_point(x, y, ang2R, {x: sx, y: sy - rlength})
        boundaryColliders.push({p1: {x: sx, y: sy+0.5}, p2: {...prot}, solid: false});
        len += 1;
    };
    //right
    for(let j=0;j<=seg;j++){
        const sx = boundaryColliders[boundaryColliders.length-1].p2.x;
        const sy = boundaryColliders[boundaryColliders.length-1].p2.y;

         const dsx = boundaryColliders[boundaryColliders.length-1 - (j*2)].p1.x;
         const dsy = boundaryColliders[boundaryColliders.length- 1 - (j*2)].p1.y;

        //  const sx1 = boundaryColliders[boundaryColliders.length-1].p1.x;
        //  const sy1 = boundaryColliders[boundaryColliders.length-1].p1.y;
 
          const dsx2 = boundaryColliders[boundaryColliders.length-1 - (j*2)].p2.x;
          const dsy2 = boundaryColliders[boundaryColliders.length- 1 - (j*2)].p2.y;
        //const prot = rotate_point(x, y, -angAr.pop(), {x: dsx + s, y: dsy});
        //prot.x += s;
        //prot.x += s/seg;
        // if(j===seg) {
        //     prot.y = y
        // };
        boundaryColliders.push({p1: {x: sx, y: sy-0.5}, p2: {x: dsx + s + (j*2), y: dsy+0.5}, solid: false});

        //area collision for big tree only
        if(s > spideyRadius/2){
            areaBoxes.push({p1: {x: dsx, y: dsy}, p2: {x: sx, y: sy}, p3: {x: dsx2, y:dsy2}, p4: {x: dsx + s + (j*2), y: dsy}})
        } 
        
        len += 1;
    //connect
    // if(j===seg) {
    //     const origx = boundaryColliders[boundaryColliders.length-len].p1.x
    //     const origy = boundaryColliders[boundaryColliders.length-len].p1.y
    //     boundaryColliders.push({p1: {x: prot.x, y: prot.y}, p2: {x: origx, y: origy}, solid: false});
    //     len += 1;
    // }
    };
    
    //angled
    for(let l=0;l<len;l++){
        const cur = boundaryColliders[id + l];
        const prot1 = rotate_point(x, y, angR, cur.p1);
        const prot2 = rotate_point(x, y, angR, cur.p2);
        boundaryColliders[id+l].p1 = prot1;
        boundaryColliders[id+l].p2 = prot2;
    }
    //rotate colliders
    if(s > spideyRadius/2){
        for(let l=0;l<=seg;l++){
            const cur = areaBoxes[areaid + l];
            const prot1 = rotate_point(x, y, angR, cur.p1);
            const prot2 = rotate_point(x, y, angR, cur.p2);
            const prot3 = rotate_point(x, y, angR, cur.p3);
            const prot4 = rotate_point(x, y, angR, cur.p4);
            // for triangle collisions
            // we use areaboxes for AABB check in p1,p2 
            // and finally get all vtex points in p3,p4,p5,p6 for 2 tris
            // cur.p1 = prot1;
            // cur.p2 = prot2;
            cur.p3 = prot3;
            cur.p4 = prot4;
            cur.p5 = prot1;
            cur.p6 = prot2;
            //get min XY and max XY from all 4 points (could have any rotation)
            cur.p1 = {x: Math.min(Math.min(cur.p3.x, cur.p5.x), Math.min(cur.p4.x, cur.p6.x)),
                y: Math.max(Math.max(cur.p3.y, cur.p5.y), Math.max(cur.p4.y, cur.p6.y))};
            cur.p2 = {x: Math.max(Math.max(cur.p3.x, cur.p5.x), Math.max(cur.p4.x, cur.p6.x)),
                    y: Math.min(Math.min(cur.p3.y, cur.p5.y), Math.min(cur.p4.y, cur.p6.y))};
                
        }
    }


    scnObj.push({id: id, length: len, type: tree});

    //draw branches
        for(let m=0, count=seg, lid=id;m<count;m++){
            if (count-m >= 0 && s > 10){
                const cur = boundaryColliders[lid + m];
                const rotL = 50 + (20 * Math.random() - 10); //+ (180 * Math.random());
                const rotR = -50 - (20 * Math.random() - 10);
                const prot1 = rotate_point(x, y, -angR, {...cur.p2});
                //const prot2 =  cur.p2);
                //console.log("ID:", id, "Seg:", seg, "Loop:", m)
                if(Math.random() > 0.25){
                    const prot2 = rotate_point(x, y, angR, {x: prot1.x + (s*0.20) + m, y: prot1.y});
                    //console.log("tree", prot2.x, prot2.y, s*0.5, count-1-m, rotR + ang)
                    if (prot2.y < worldSize.height - groundHeight) {
                        drawTree(prot2.x, prot2.y, (s - count)*0.5,  count - 1 - m,  rotR + ang);
                    }
                }
                if(Math.random() > 0.25){
                const prot3 = rotate_point(x, y, angR, {x: prot1.x + (s*0.80) - m, y: prot1.y});
                    //console.log("tree", prot3.x, prot3.y, s*0.5, Math.max(1, seg-m), rotL + ang)
                    if (prot3.y < worldSize.height - groundHeight) {
                        drawTree(prot3.x, prot3.y, (s - count)*0.5, count - m, rotL + ang);
                    }
                }    
                }
            }
}

function paintTree(id, len){
    bgctx.fillStyle = "#563B27"; 
    bgctx.strokeStyle = "#3A2B22";
    bgctx.lineWidth = 2.1;

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
        }
    //bgctx.setLineDash([15, 10, 5, 10]);
    bgctx.stroke();
    //bgctx.setLineDash([]);

    //roots
    // bgctx.beginPath();
    // bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    // bgctx.lineTo(boundaryColliders[id].p1.x - 60, boundaryColliders[id].p1.y + 60);
    // bgctx.stroke();
    
    // bgctx.beginPath();
    // bgctx.moveTo(boundaryColliders[id+len-1].p1.x, boundaryColliders[id+len-1].p1.y);
    // bgctx.lineTo(boundaryColliders[id+len-1].p1.x + 60, boundaryColliders[id+len-1].p1.y + 60);
    // bgctx.stroke();

}


// let's draw a cactusÊÊÊ
/*
        .0.   
        \.\ .,
     o. |.|.J`
     \.\|.|/
       `|.|
        |.|
    *///          
   //
    
//position, scale
    function drawCactus(x, y, s){


        //test some random values 
        const random1 = Math.random();
        const random2 = Math.random();
        const random3 = Math.random();
        const random4 = Math.random();

        //boundaryoffset
        const abs = Math.abs(s);
        const offset = 5 * abs;
        const height = (200 + 500 * abs * random1) * abs;
        const width = (40 + 30 * abs * random2) * abs;
        const widthAbs = (40 + 30 * abs * random2) * abs;
        const top = y - height;
        const leftSide = x - width;
        const rightSide = x + width;
        const armlength = (50 + 70 * abs * random3) * abs;
        const arm1 = armlength + (armlength * abs * random4 + 100 * random1);
        const arm2 = armlength + (armlength * 2 * abs * random1 + 50 * random1);
        const solid = false;
        
        const id = boundaryColliders.length;
        const circID = boundaryCircles.length;
        scnObj.push({id: id, length: 12, circID: circID, circLen: 3, type: cactus});

        //central trunk
        areaBoxes.push({p1: {x: leftSide + offset, y: y}, p2: {x: rightSide - offset, y: top + (widthAbs * 0.5)}})

        //line starts at bottom left and traces up and around
        
        //short left arm
        boundaryColliders.push({p1: {x: leftSide + offset, y: y}, p2: {x: leftSide, y: y - arm2}, solid: solid});
        boundaryColliders.push({p1: {x: leftSide, y: y - arm2}, 
            p2: {x: leftSide - armlength, y: y - arm2 - width/2}, solid: solid});
        
        
        boundaryColliders.push({
            p1: {x: leftSide - armlength, y: y - arm2 - width/2}, 
            p2: {x: leftSide - armlength, y: y - arm2 - width/2 - armlength}, solid: solid});
        boundaryColliders.push({
            p1: {x: leftSide - armlength + width/2, y: y - arm2 - width/2 - armlength}, 
            p2: {x: leftSide - armlength + width/2, y: y - arm2 - width * 0.9}, solid: solid});
        
        boundaryColliders.push({p1: {x: leftSide, y: y - arm2 - width/2}, 
            p2: {x: leftSide - armlength + width/2, y: y - arm2 - width * 0.9}, solid: solid});
        boundaryColliders.push({p1: {x: leftSide, y: y - arm2 - width/2}, p2: {x: leftSide, y: top}, solid: solid});
        
        boundaryCircles.push({x: x, y: top, r: widthAbs, half: true, solid: solid});
        areaCircles.push({x: x, y: top, r: widthAbs, half: false});

        areaBoxes.push({p1: {x: leftSide - armlength, y: y - arm2 - width/2}, p2: {x: leftSide - armlength + width/2, y: y - arm2 - width * 0.9}})

        
        boundaryColliders.push({p1: {x: rightSide, y: top}, p2: {x: rightSide, y: y - arm1 - width/1.5}, solid: solid});
        boundaryColliders.push({p1: {x: rightSide, y: y - arm1 - width/1.5}, 
            p2: {x: rightSide + armlength - width/2, y: y - arm1 - width}, solid: solid});

        boundaryColliders.push({
            p1: {x: rightSide + armlength - width/2, y: y - arm1 - width}, 
            p2: {x: rightSide + armlength - width/2, y: y - arm1 - width/2 - armlength*2}, solid: solid});
        boundaryColliders.push({
            p1: {x: rightSide + armlength + width/3.33, y: y - arm1 - width/2 - armlength*2}, 
            p2: {x: rightSide + armlength + width/10, y: y - arm1 - width/2}, solid: solid});
            
        boundaryColliders.push({p1: {x: rightSide + armlength + width/10, y: y - arm1 - width/2}, 
            p2: {x: rightSide, y: y - arm1}, solid: solid});
        
        areaBoxes.push({p1: {x: rightSide + armlength - width/2, y: y - arm1 - width/2}, p2: {x: rightSide + armlength + width/10, y: y - arm1 - width/2 - armlength*2}})

        
        boundaryColliders.push({p1: {x: rightSide, y: y - arm1}, p2: {x: rightSide - offset, y: y}, solid: solid});

        boundaryCircles.push({x: rightSide + armlength - width/10, y: y - arm1 - width/2 - armlength*2, r: widthAbs/2.5, half: true, solid: solid});
    
        areaCircles.push({x: rightSide + armlength - width/10, y: y - arm1 - width/2 - armlength*2, r: widthAbs/2.5});

                
        boundaryCircles.push({x: leftSide - armlength + width/4, y: y - arm2 - width/2 - armlength, r: widthAbs/4, half: true, solid: solid});
    
        areaCircles.push({x: leftSide - armlength + width/4, y: y - arm2 - width/2 - armlength, r: widthAbs/4, half: true});


        }
    // ex. 

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
            bgctx.fillCircle(obj.x, obj.y, obj.r)
            
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

        bgctx.fillStyle = "#000000";
        bgctx.strokeStyle = "#000000";
        bgctx.setLineDash([]);
    }

var fliesEaten = 0;
//lets make a spidey boi
var spideyPos = {x: viewport.width*0.5, y: worldSize.height - 190}; // ??? This has to intersect w/ a collision?
//'natural' leg values for anchor + neutral position
var spideyLegs = [
    //Left leggies
    {x: -28, y: 15},
    {x: -33, y: 17},
    {x: -31, y: 21},
    {x: -25, y: 22},
    //Right leggies
    {x: 28, y: 15},
    {x: 33, y: 17},
    {x: 31, y: 21},
    {x: 25, y: 22}
]

//large spread/reaching up legs for jumpin anim
var spideyJump = [
    //Left leggies
    {x: -16, y: 15},
    {x: -24, y: 5},
    {x: -27, y: -15},
    {x: -16, y: -20},
    //Right leggies
    {x: 16, y: 15},
    {x: 24, y: 5},
    {x: 27, y: -15},
    {x: 16, y: -20}
]
// var spideyJump = [
//     //Left leggies
//     {x: -16, y: 16},
//     {x: -40, y: 5},
//     {x: -38, y: -16},
//     {x: -24, y: -30},
//     //Right leggies
//     {x: 16, y: 16},
//     {x: 40, y: 5},
//     {x: 38, y: -16},
//     {x: 24, y: -30},
// ]

/*

    \   /       4
   --   --      3
  ,-      -,    2
    /   \       1

*/
var legOrigins = [
    //Left leggies
    {x: -4, y: -2},
    {x: -4, y: -1},
    {x: -6, y: 0},
    {x: -5, y: 1},
    //Right leggies
    {x: 4, y: -2},
    {x: 4, y: -1},
    {x: 6, y: 0},
    {x: 5, y: 1},
]


// spideyLegs.forEach((x) => {
//     x.x *= 1.5;
//     x.y *= 1.5;
// })
// legOrigins.forEach((x) => {
//     x.x *= 0.2;
//     x.y *= 0.2;
// })
// spideyJump.forEach((x) => {
//     x.x *= 0.2;
//     x.y *= 0.2;
// })
//variable leg offsets for animation - offset from spideyLeg defaults


//anims for legs 
const none = 0;
const grabbing = 1;
const walking = 2;
const jumping = 3;
const crouching = 4;
const swinging = 5;

const grabWeb = 6;
const readyWeb = 7;
const throwWeb = 8;

const readyStrike = 9;
const throwStrike = 10;


var legMods = [
    //Left leggies
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    //Right leggies
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0},
    {x: 0, y: 0, anim: none, dx: 0, dy: 0, start: 0, jx: 0, jy: 0}
]

//16 lines (32 pts) relative to spideypos within radius
//valid for spidey feetsies
var walkLines = [
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},

    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},

    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},

    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false, webID: -1},

]

const audioCtx = new AudioContext;


// Create sound attack and release functions.
const attack = (type, frequency, attackTime, decayTime, sustainValue, releaseTime, volume) => {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = frequency;
  g.gain.setValueAtTime(0, audioCtx.currentTime); // start from silence!
  o.connect(g);
  g.connect(audioCtx.destination)
  o.start(0)

  g.gain.setValueAtTime(0, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(1 * volume,
                        audioCtx.currentTime + attackTime);
  g.gain.linearRampToValueAtTime(sustainValue * volume,
                        audioCtx.currentTime + attackTime + decayTime);

    //release
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + releaseTime);
    o.stop(audioCtx.currentTime + releaseTime);

};
// const release = (audioCtx, oscillatorGain, releaseTime) => {
//     //oscillatorGain.gain.cancelScheduledValues(audioCtx.currentTime)
//     oscillatorGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + releaseTime);
// };


//this returns the webID (or -1) thus only truey/falsey
function checkWebCollision(tx, ty, r){
    let hitLine = -1;
    webArray.forEach((y, i) => {
        if (doesLineInterceptCircle(y.p1, y.p2, {x:tx,y:ty}, r)) {
            hitLine = i;
        };
    })
    return hitLine;
};

function checkCollision(tx, ty, r){
    //walkAreas
    let collision = false;
    areaCircles.forEach((x) => {
        //if (collision) return;
        const intersect = intersection({x: tx, 
            y: ty, r: r}, x)
            //console.log(intersect)
            if (intersect.one_is_in_other){
                collision = true;
            }
    });
    //if (collision) return;

    areaBoxes.forEach((x) => { 
        //if (collision) return;
        if(tx >= x.p1.x - 1
            && tx <= x.p2.x + 1
            && ty <= x.p1.y + 1
            && ty >= x.p2.y - 1){
            if(x.p3){
                if(
                pointInTriangle({x: tx, y: ty}, x.p5, x.p6, x.p3)
                || pointInTriangle({x: tx, y: ty}, x.p5, x.p6, x.p4)
                ) {
                    collision = true;
                }
            } else {
                collision = true;
            }
        }}
    );
    boundaryCircles.forEach((x) => {
        const circRadius = x.r;
        const circPos = {x: x.x, y: x.y};
        const hits = intersection({x: tx, y: ty, r: r}, {...circPos, r: circRadius});
        if (hits > 0) collision = true;
    });
    //lines 
    boundaryColliders.forEach((x) => {
        if(doesLineInterceptCircle(x.p1, x.p2, {x: tx, y: ty}, r)) collision = true;
    });
    return collision;
}

function footStep(i, vol){
    const type = "sine";
    const freq1 = 1111.6 + (i * 44.4)
    const freq2 = 666.6 + (i * 44.4)

    
    attack(type, freq1,  0.01, 0.002, 0.0, 0.05, vol);
    attack(type, freq2, 0.003, 0.005, 0.0, 0.05, vol);
    // release(acontext, g, 0.05);
    // release(acontext, g2, 0.05);
}
function footStepLand(i){
    const type = "sine";
    const freq = 455 + (i * 14.8);

    attack(type, freq, 0.015, 0.01, 0.0, 0.02, 0.2);
    
      
}
function jumpSFX(i){
    // o.type = "sine";
    // o.frequency.value = 444.6 + (i * 5.5);
    // attack(acontext, g, 0.001, 0.001, 0.1, 0.5);
    const type = "sine";
    const freq = 444.6 + (i * 23.66)

    attack(type, freq, 0.001, 0.001, 0.1, 2.0, 0.1);
    //release(acontext, g, 1.0);
      
}
function fallSFX(i){
    const type = "sine";
    const freq = 444.6 + (i * 4.4);
    
    attack(type, freq, 0.001, 0.001, 0.1, 2.0, 0.1);

    //release(acontext, g, 2.0);
      
}

//function spideyMove
//move individual legs

//order legs by farthest 
//if farthest leg is outside spideyradius animate 2x 1y
//if nearest is inside r/2 animate it 1x 2y
function spideyMove(leg) {
    
    const rotate = rotate_point(0, 0, Math.atan2(-xrotation, Math.abs(yrotation)+20), {x: spideyLegs[leg].x, y: spideyLegs[leg].y})
    rotate.y = yrotation >= 0? rotate.y : -rotate.y;
    //x and y offset in relation to spidey
    if (legMods[leg].anim === grabbing) {
        const x = (spideyLegs[leg].x + legMods[leg].x);
        const y = (spideyLegs[leg].y + legMods[leg].y);
        if (jactive){
            context.fillStyle = "#ff0000";
            context.fillCircle(spideyPos.x+rotate.x, spideyPos.y+rotate.y, 3)
            context.fillStyle = "#000000";
        }
        

         const dist = Math.sqrt(x * x + y * y);
        if (dist < spideyRadius && dist > (spideyRadius / 3)){}
        else if(Math.abs(speed.components[0]) > EPSILON
            || Math.abs(speed.components[1]) > EPSILON){
            //console.log("Moving");
            legMods[leg].anim = walking;
            legMods[leg].start = lastTimestamp;
            // legMods[leg].x = legMods[leg].jx;
            // legMods[leg].y = legMods[leg].jy;
            legMods[leg].dx = 0;
            legMods[leg].dy = 0;
        }
        
        if ((Math.abs(speed.components[0]) > EPSILON && (Math.sign(x) !== Math.sign(rotate.x) || Math.sign(yrotation - y) !== Math.sign(yrotation - rotate.y)))
        || (Math.abs(speed.components[1]) > EPSILON && (Math.abs(y) <= 1 || Math.sign(yrotation - y) !== Math.sign(yrotation - rotate.y)))) {
            //if the leg crosses spidey's x axis reset it
            //console.log("Crossing");
            legMods[leg].anim = walking;
            legMods[leg].start = lastTimestamp;
            // legMods[leg].x = legMods[leg].jx;
            // legMods[leg].y = legMods[leg].jy;
            legMods[leg].dx = rotate.x - spideyLegs[leg].x;
            legMods[leg].dy = rotate.y - spideyLegs[leg].y;
        }
        
    }

    
        //enforce destination to valid grab point
        //always runs for now
        //old: only run if leg is newly walking
        //freeLeg = false;
        //const line = getNearestWalkLine()
    
        let walkArea = false;
        const legPosX =  legMods[leg].dx + spideyLegs[leg].x + spideyPos.x;
        const legPosY =  legMods[leg].dy + spideyLegs[leg].y + spideyPos.y;
        //walkAreas
        areaCircles.forEach((x) => {
            const intersect = intersection({x: legPosX, 
                y: legPosY, r: 1}, x)
                //console.log(intersect)
                if (intersect.one_is_in_other || intersect.intersect_occurs){
                    walkArea = true; 
                }
        });
    if (!walkArea){
        areaBoxes.forEach((x) => { 
            if(legPosX >= x.p1.x - 1
                && legPosX <= x.p2.x + 1
                && legPosY <= x.p1.y + 1
                && legPosY >= x.p2.y - 1){
                if(x.p3){
                    if(
                    pointInTriangle({x: legPosX, y: legPosY}, x.p5, x.p6, x.p3)
                    || pointInTriangle({x: legPosX, y: legPosY}, x.p5, x.p6, x.p4)
                    ) {
                        //console.log("Spideymove triangle");
                        walkArea = true;
                    }
                } else {
                    walkArea = true;
                }
            }}
        );
    }
        let nearest = 9999999;
        let line = -1;
        if(!walkArea){
            for(let i=0; i<walkLines.length; i++){
                if (walkLines[i].valid) {
                const dist = distToSegmentSquared({x: rotate.x, 
                    y: rotate.y},
                    walkLines[i].p1, walkLines[i].p2)
                        //if (line >= 0) console.log("Closest:", line, dist)
                    if (dist < nearest) {
                        line = i;
                        nearest = dist;
                    }
                }
            }
        }
        
        //landing on within walkable areas
        if(walkArea && (legMods[leg].anim === none || (legMods[leg].anim === jumping && lastTimestamp - legMods[leg].start > 600)) && !spacePressed && !shiftPressed) {
            legMods[leg].anim = grabbing;
            legMods[leg].start = 0;
            legMods[leg].x = legMods[leg].jx;
            legMods[leg].y = legMods[leg].jy;
            footStepLand(leg);
        }
        if((line >= 0) && legMods[leg].anim !== grabbing) {
            //console.log("LEG:", leg, "GRAB:", grab, `LINE: ${line}`, walkLines[line])
            //context.fillCircle(grab.x + spideyPos.x, grab.y + spideyPos.y, 2);
            if (legMods[leg].anim === walking) {
                    const grab = closestSegmentPoint({x: rotate.x, 
                    y: rotate.y}, 
                    {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
                    {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, 
                    )
                    

                if(Math.abs(legMods[leg].dx - (grab.x - spideyLegs[leg].x)) > spideyRadius/3
                || Math.abs(legMods[leg].dy - (grab.y - spideyLegs[leg].y)) > spideyRadius/3){
                    //console.log("recalculate");
                    legMods[leg].x = legMods[leg].jx;
                    legMods[leg].y = legMods[leg].jy;
                    if (legMods[leg].start !== lastTimestamp) legMods[leg].start = lastTimestamp-0.1
                }
                
                legMods[leg].dx =  grab.x - spideyLegs[leg].x;
                legMods[leg].dy =  grab.y - spideyLegs[leg].y;
            }

            if((legMods[leg].anim === none || (legMods[leg].anim === jumping && lastTimestamp - legMods[leg].start > 600)) && !spacePressed && !shiftPressed) {
                const land = distToSegmentSquared({x: legMods[leg].x + spideyLegs[leg].x, 
                    y: legMods[leg].y + spideyLegs[leg].y}, 
                    {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
                    {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, 
                    )
                    //console.log(land, grab)
                    if(land < (10 * deltaTime)) {
                        legMods[leg].x = legMods[leg].jx;
                        legMods[leg].y = legMods[leg].jy;
                        legMods[leg].dx = land.x - spideyLegs[leg].x;
                        legMods[leg].dy = land.y - spideyLegs[leg].y;
                        legMods[leg].anim = grabbing;
                        legMods[leg].start = 0;
                        footStepLand(leg);
                        //console.log("landed on web")
                    }
            }
            //context.fillCircle(legMods[leg].dx + spideyPos.x, legMods[leg].dy + spideyPos.y, 3);
        } else if (line === -1 && !walkArea && legMods[leg].anim !== none && legMods[leg].anim < grabWeb){
            //set falling
            if (legMods[leg].anim !== jumping && !(legMods[leg].anim === swinging && shiftPressed)){
                //console.log(legMods[leg].anim, "fell off a web")
                legMods[leg].anim = none;
                legMods[leg].start = lastTimestamp;
                legMods[leg].x = legMods[leg].jx;
                legMods[leg].y = legMods[leg].jy;
                legMods[leg].dx = 0;
                legMods[leg].dy = -15;
                fallSFX(leg+8)
            }
            
            // legMods[leg].x = 0;
            // legMods[leg].y = -15;
        }
        // const stretch = spideyRadius + 3;
        // legMods[leg].x = doubleClamp(legMods[leg].x, -stretch, stretch);
        // legMods[leg].y = doubleClamp(legMods[leg].y, -stretch, stretch);
        // legMods[leg].dx = doubleClamp(legMods[leg].dx, -stretch, stretch);
        // legMods[leg].dy = doubleClamp(legMods[leg].dy, -stretch, stretch);
        // legMods[leg].jx = doubleClamp(legMods[leg].jx, -stretch, stretch);
        // legMods[leg].jy = doubleClamp(legMods[leg].jy, -stretch, stretch);
    
}



//spideymove simply updates the positions stored in spideyPos and spideyLegs 
//the center moves in a limited radius with opposite offsets in all legs
//when a leg is too close to or far from move dir the leg moves in reaction 
//think of spidey body as "pushing" and "pulling" the legs 
// only one leg L and R should be affected per cycle 
// lifting legs...difficult maybe - if u reverse dir it should return to ground eg
// movement and collision are the same system...



//large collider checks all edges + lines within radius
//sends actual leg positions to drawSpidey 
//and rotates spidey accordingly
function spideyCollider() {
    //visualizer
    if(jactive) {
    context.lineWidth = 0.5;
    context.strokeStyle = "#ee5555"


    const line = getNearestWalkLine(0, 0);
    if (line > -1) {
        const start = closestSegmentPoint({x: 0, y:0}, 
        {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
        {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, );
        
        context.fillStyle = "#ee5555"
        context.fillCircle(spideyPos.x + start.x,spideyPos.y + start.y, 5);
        context.fillStyle = "#000000"
        
    };

    context.strokeCircle(spideyPos.x, spideyPos.y, spideyRadius);
    context.strokeStyle = "#ee9999"
    context.strokeCircle(spideyPos.x, spideyPos.y, spideyRadius / 3);
    context.strokeStyle = "#000000"
    }
}

function easeInBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    
    return c3 * x * x * x - c1 * x * x;
    }
function smoothstep(x) {
    return x = (x * x * (3-2 * x))
}
function degs_to_rads (degs) { return degs / (180/Math.PI); }
function rads_to_degs (rads) { return rads * (180/Math.PI); }


function drawBugLeg(root, dest, l1, lw, fx, fy, dang){
    let dirx = dest.x - root.x;
    let diry = dest.y - root.y;
    let len = Math.sqrt(dirx * dirx + diry * diry);
    dirx = dirx / len;
    diry = diry / len;

    let joint1x, joint1y;
    var dist = l1 * l1 - len * len / 4;
    if(dist < 0){
        joint1x = root.x + dirx * l1;
        joint1y = root.y + diry * l1;
        dest.x = root.x + dirx * l1 * 2;
        dest.y = root.y + diry * l1 * 2;
    } else {
        joint1x = root.x + dirx * len / 2;
        joint1y = root.y + diry * len / 2;
        dist = Math.sqrt(dist);
        if(dang < 0){
            dist = -dist; 
        }
        joint1x -= diry * dist;
        joint1y += dirx * dist;
    }
    context.lineCap = "round";
    context.lineWidth = lw;
    context.beginPath();
    context.moveTo(root.x, root.y);
    context.lineTo(joint1x, joint1y);
    context.stroke();
    //context.lineCap = "butt";
    context.beginPath();
    context.moveTo(joint1x, joint1y);
    context.lineTo(dest.x, dest.y);
    context.lineWidth = lw-1;
    context.stroke();
    context.beginPath();
    context.moveTo(dest.x, dest.y);
    context.quadraticCurveTo(
        dest.x - fx*2, dest.y - fy,
        dest.x - fx, dest.y - fy
    );
    context.lineWidth = lw-2;
    context.stroke();

}


//lets draw a ladybug 
//and test out a rotation system for bug 
//  ,,-c`"""-,
//  CMb___o_·_;
//  ''  ''  ''
const ladybugLegs = [
    //right leggies
    {x: -12, y: 20},
    {x: 2, y: 20},
    {x: 22, y: 20},
    //left leggies
    {x: -11, y: 20},
    {x: 7, y: 20},
    {x: 12, y: 20},
]
function drawLadybug(bug) {
    bug.x += 0.2*deltaTime
    let x = bug.x;
    let y = bug.y;
    const start = bug.start;
    const anim = bug.anim;
    const bugR = 50
    
    //backlegs
    context.fillStyle = "#111111";
    context.strokeStyle = "#000000";
    context.lineWidth = 1.5;
    let step = lastTimestamp%2000/500;
    console.log("STEP", step)
    let walk = 0;
    if(step > 3) {
        step = 4-step;    
        walk = 1;
    }else if (step>2) {
        step = step-2;
        walk = 1;
    }else if (step>1) {
        step = 2-step;
        walk = 0;
    }

    for(let l=0;l<6;l++){
        const lift = l%2===walk? 0: -bugR*0.2*step;
        bug.lmods[l].x += lift !== 0? 0.2*deltaTime : -0.2*deltaTime;
        const lx = ladybugLegs[l].x+bug.lmods[l].x;
        const ly = ladybugLegs[l].y+bug.lmods[l].y+lift;
        const k = l%3;
        const dir = l>=3? 1 : -1;
        const foot = (6)* dir;
        drawBugLeg(
            {x:x + (10*k),y:y-2},
            {x:x+lx, y: y+ly-(5*dir)},
            bugR*0.33+(3-k),
            3.5,
            foot,-2,
            dir)
    }
    // //L
    // //back
    // drawBugLeg({x:x-15,y:y-10},{x:x-19+5*step,y:y+10+5*(1-step)},bugR-2,3.5,-6,-2,-1)
    // //mid
    // drawBugLeg({x:x,y:y-10},{x:x-5*step,y:y+10+5*step},bugR-2,3.5,-6,-3,-1)
    // //front
    // drawBugLeg({x:x+25,y:y-10},{x:x+15+10*step,y:y+10+5*(1-step)},bugR-2,3.5,-4,-2,-1)
    // //R
    // //back
    //  drawBugLeg({x:x-15,y:y},{x:x-19+5*step,y:y+15+5*step},bugR,3.5,6,-2,1)
    //  //mid
    //  drawBugLeg({x:x,y:y},{x:x-5*step,y:y+15+10*(1-step)},bugR,3.5,6,-3,1)
    //  //front
    //  drawBugLeg({x:x+25,y:y},{x:x+15+10*(1-step),y:y+15+5*step},bugR,3.5,4,-2,1)
    // context.beginPath();
    // context.ellipse(x-12, y+6, 16, 2, Math.PI / 1.1, 0, 2 * Math.PI);
    // context.stroke();
    // context.fill();
    // context.beginPath();
    // context.ellipse(x-27, y+19, 1, 9, -Math.PI, 0, Math.PI);
    // context.stroke();
    // context.fill();
    // context.beginPath();
    // context.bezierCurveTo(
    //     x-27, y+18,
    //     x-27, y+24,
    //     x-33, y+24,
    // );
    // //forelegs
    // for(i=0;i<2;i++){    
    //     context.stroke();
    //     context.fillStyle = "#111111";
    //     context.lineWidth = 1.5;
    //     context.beginPath();
    //     context.ellipse(x + (12*i) + 6, y+6, 16, 2, -Math.PI / 1.1, 0, 2 * Math.PI);
    //     context.stroke();
    //     context.fill();
    //     context.beginPath();
    //     context.ellipse(x + (12*i) + 20, y+18, 1, 9, Math.PI, 0, Math.PI);
    //     context.stroke();
    //     context.fill();
    //     context.beginPath();
    //     context.bezierCurveTo(
    //         x + (12*i) + 20, y+17,
    //         x + (12*i) + 27, y+24,
    //         x + (12*i) + 31, y+21,
    //     );
    //     context.stroke();

    //}
    
    
    //body
    context.fillStyle = "#ff1111";
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(x, y, 30, 28, 0, -Math.PI, 0);
    context.ellipse(x, y, 30, 10, 0, 0, -Math.PI);
    context.stroke();
    context.fill();

    //spots
    context.fillStyle = "#111111";
    context.beginPath();
    context.ellipse(x+12, y-3, 4, 6, 1.2, 2 * Math.PI, 0);
    context.stroke();
    context.fill();
    context.beginPath();
    context.ellipse(x, y-24, 6, 4, 0, 2 * Math.PI, 0);
    context.stroke();
    context.fill();
    context.beginPath();
    context.ellipse(x-18, y-6, 5, 6, -1.2, 2 * Math.PI, 0);
    context.stroke();
    context.fill();

    //neck
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(x+25, y-8, 12, 10, Math.PI / 2.6, -Math.PI, 0);
    context.ellipse(x+25, y-8, 12, 5, Math.PI / 2.6, 0, -Math.PI);
    context.stroke();
    context.fill();
    //neck spots 
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.ellipse(x+29, y-2, 6, 12, -0.6, -Math.PI, 0);
    context.ellipse(x+29, y-2, 6, 5, -0.6, 0, -Math.PI);
    context.stroke();
    context.fill();
    //antenna    
    context.lineWidth = 1.0;
    context.beginPath();
    context.moveTo(x+35, y-9);
    context.lineTo(x+45, y-11);
    context.stroke();
    //head
    context.fillStyle = "#111111";
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(x+35, y-2, 6, 12, -0.2, -Math.PI, 0);
    context.ellipse(x+35, y-2, 6, 5, -0.2, 0, -Math.PI);
    //mouthparts
    context.moveTo(x+36, y);
    context.ellipse(x+40, y+5, 2, 2, 0, 0, -Math.PI);
    context.fill();
    //eye spots 
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.ellipse(x+40, y-6, 3, 1, 1.3, -Math.PI, 0);
    context.ellipse(x+40, y-6, 3, 0.5, 1.3, 0, -Math.PI);
    context.stroke();
    context.fill();

    //antenna    
    context.lineWidth = 1.0;
    context.beginPath();
    context.moveTo(x+35, y-10);
    context.lineTo(x+43, y-12);
    context.stroke();

    if(jactive){
        context.lineWidth = 1.5;
        context.strokeStyle = "#ee5555";
        context.strokeCircle(x,y,bugR)
    }
    
}
//lets draw an ant
//           ,, 
//    </\oÔ:B"  z
//    // | \    xy
// 
//    \ H /
//   -- T --    y
//    / A \     zx
function drawAnt(ant) {
    let x = ant.x;
    let y = ant.y;
    const start = ant.start;
    const anim = ant.anim;
    const antR = 12
    
    //legs
    context.fillStyle = "#CB5F00";
    //context.strokeStyle = "#CB5F00";
    //context.strokeStyle = "#ffffff";
    context.fillStyle = "#111111";
    context.strokeStyle = "#111111";
    context.lineWidth = 1.5;
    //shoulders
    context.beginPath();
    context.ellipse(x, y+5, 2, 5, Math.PI / 1.4, 0, 2 * Math.PI);
     context.stroke();
    context.fill();
    context.beginPath();
    context.ellipse(x-7, y+4, 2, 5, Math.PI / 1.1, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.ellipse(x-16, y+3, 2, 6, Math.PI / 1.4, 0, 2 * Math.PI);
    context.fill();
    // //R
    // //front
    // drawBugLeg({x:x-10, y:y-4}, {x:x-30, y:y+15}, 15, 3, -4, 1);
    // //mid
    // drawBugLeg({x:x-4, y:y-4}, {x:x-5, y:y+12}, 15, 3, -4, 1);
    // //back
    // drawBugLeg({x:x+4, y:y-2}, {x:x+25, y:y+14}, 15, -3, -4, -1);

    let step = 1;//lastTimestamp%1000/500;
    step = step > 1 ? 2 - step : step;
    //R
    //front
    drawBugLeg({x:x-13, y:y}, {x:x-40+8*step, y:y+28+10 * (1-step)}, 28, 3.5, 3, -15, 1);
    //mid
    drawBugLeg({x:x-7, y:y}, {x:x-10+8*(1-step), y:y+25+13*(step)}, 28, 3.5, -3, -15, 1);
    //back
    drawBugLeg({x:x+4, y:y}, {x:x+20+8*step, y:y+25+9*(1-step)}, 28, 3.5, -3, -15, -1);
    //L
    //front
    drawBugLeg({x:x-13, y:y+7}, {x:x-40+8*(1-step), y:y+(28 * step)}, 28, 3.5, 3, -15, 1);
    //mid
    drawBugLeg({x:x-7, y:y+8}, {x:x-10+8*step, y:y+35+13*(1-step)}, 28, 3.5, -3, -15, 1);
    //back
    drawBugLeg({x:x+4, y:y+7}, {x:x+20+8*(1-step), y:y+44*step}, 28, 3.5, -3, -15, -1);
    context.lineWidth = 1.5;
    //body
    //context.strokeStyle = "#ffffff";
    context.beginPath();
    context.ellipse(x+18, y, 9, 14, Math.PI / 2.6, 0, 2 * Math.PI);
    context.stroke();
    context.fill();
    
    //thorax
    context.beginPath();
    context.ellipse(x-4, y, 4, 12, Math.PI / 1.8, 0, 2 * Math.PI);
    context.ellipse(x-12, y-2, 5, 8, Math.PI / 1.8, 0, 2 * Math.PI);
    context.stroke();
    context.fill();

    //head
    context.beginPath();
    context.ellipse(x-28, y-2, 7, 10, Math.PI / 3.8, 0, 2 * Math.PI);
    context.stroke();
    context.fill();

    context.strokeStyle = "#111111";
    //antennae
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(x-28.5, y-9.5);
    context.lineTo(x-36, y-20);
    context.stroke();
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x-35.5, y-20);
    //context.lineTo(x-51, y-20);
    context.bezierCurveTo(x-51, y-18,x-51, y-20,x-51, y-20);
    context.stroke();
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x-28, y-9);
    context.lineTo(x-36, y-20);
    context.stroke();
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x-35.5, y-20);
    //context.lineTo(x-51, y-20);
    context.bezierCurveTo(x-51, y-18,x-51, y-20,x-51, y-20);
    context.stroke();

    // //legs
    // for(let i=0; i<3; i++){
    //     x += i===0? 0 : 10;
    //     context.strokeStyle = "#CB5F00";
    //  //shoulder
    //     context.beginPath();
    //     context.ellipse(x-16, y+2, 2, 6, Math.PI / 1.3, 0, 2 * Math.PI);
    //     //upper arm
    //     context.ellipse(x-18, y+6, 1.5, 6, Math.PI / 1.8, 0, 2 * Math.PI);
        
    //     context.stroke();
    //     context.fill();
    //     //lower arm
    //     context.beginPath();
    //     context.ellipse(x-22, y+11, 1, 6, Math.PI / 1.1, 0, 2 * Math.PI);
    //     context.stroke();
    //     context.fill();
    //     //foot
    //     context.lineWidth = 2;
    //     context.beginPath();
    //     context.moveTo(x-20.5, y+16);
    //     context.bezierCurveTo(x-18, y + 24, x-18, y+28, x-22, y+33);
    //     context.stroke();
    //     context.strokeStyle = "#111111";
    //     context.lineWidth = 1;
    //     context.beginPath();
    //     context.moveTo(x-20.5, y+16);
    //     context.bezierCurveTo(x-18, y + 24, x-18, y+28, x-22, y+33);
    //     context.stroke();
    // }
   
    context.lineWidth = 1;
    context.fillStyle = "#000000"
    context.strokeStyle = "#000000"
}


//lets draw a fly
//   (()
//    O
//
function drawFly(fly) {

    let x = fly.x;
    let y = fly.y;
    const start = fly.start;
    const anim = fly.anim;

    const flyR = 5

    const sec1 = anim === flying ? (Math.abs(lastTimestamp - start))%200/100 : 1; //(start + lastTimestamp%200)/100;  
    const sec = sec1 > 1? 2 - sec1 : sec1;
    const step = sec * sec * (3-2 * sec);

    const sec2 = anim === flying ? (lastTimestamp%1000)/500 : 1; 
    const hover = sec2 > 1? 2 - sec2 : sec2;
    const step2 = hover * hover * (3-2 * hover);
    y += step2*2;
    // x += step2;

    //wings up
    const anchorLX1 = x + flyR;
    const anchorLX2 = x - flyR*2;
    const anchorRX1 = x - flyR;
    const anchorRX2 = x + flyR*2;
    const anchorY1 = y - flyR * 4;
    const anchorY2 = y - flyR * 5;
    //wings down
    //case sensitive fight me
    const anchorLx1 = x - flyR * 4;
    const anchorLx2 = x - flyR * 4;
    const anchorRx1 = x + flyR * 4;
    const anchorRx2 = x + flyR * 4;
    const anchory1 = y - flyR * 3;
    const anchory2 = y + flyR;

    const dLX1 = anchorLx1 - anchorLX1;
    const dLX2 = anchorLx2 - anchorLX2;
    const dRX1 = anchorRx1 - anchorRX1;
    const dRX2 = anchorRx2 - anchorRX2;
    const dY1 = anchory1 - anchorY1;
    const dY2 = anchory2 - anchorY2;

    const pLX1 = anchorLX1 + (dLX1 * step);
    const pLX2 = anchorLX2 + (dLX2 * step);
    const pRX1 = anchorRX1 + (dRX1 * step);
    const pRX2 = anchorRX2 + (dRX2 * step);
    const pY1 = anchorY1 + (dY1 * step);
    const pY2 = anchorY2 + (dY2 * step);

    // const pLX1 = anchorLx1 - (dLX1 * step);
    // const pLX2 = anchorLx2 - (dLX2 * step);
    // const pRX1 = anchorRx1 - (dRX1 * step);
    // const pRX2 = anchorRx2 - (dRX2 * step);
    // const pY1 = anchory1 - (dY1 * step);
    // const pY2 = anchory2 - (dY2 * step);


    //wings
    context.strokeStyle = "#000000";
    context.fillStyle = 'rgba(255, 255, 255,0.3)'
    context.lineWidth = 0.5;
    context.beginPath();
    context.moveTo(x,y);
    //anchorx, anchory, destx, desty
    context.bezierCurveTo(pLX1, pY1, pLX2, pY2, x - flyR/2, y);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(x,y);
    //anchorx, anchory, destx, desty
    context.bezierCurveTo(pRX1, pY1, pRX2, pY2, x + flyR/2, y);
    context.stroke();
    context.fill();

    //lil leggies
    context.strokeStyle = "#442211"
    for(let i=0;i<6;i++){
        context.beginPath();
            context.moveTo(x, y);
        if(i%2===0){
            context.quadraticCurveTo(x + flyR + i, y, x + flyR/4 + i, y + flyR*1.5 - i);
        } else {
            context.quadraticCurveTo(x - flyR - i, y, x - flyR/4 - i, y + flyR*1.5 - i);
        }
        context.stroke();
    }
    //body
    context.fillStyle = "#3F2C1B"
    context.fillCircle(x, y, flyR*0.9);

    context.lineWidth = 1;
    context.strokeStyle = "#000000"

    //eyes
    context.fillStyle = "#dd0000"
    context.fillCircle(x-flyR/2, y - 3, flyR/3);
    context.fillCircle(x+flyR/3, y - 3, flyR/3);
    //reset colour
    context.fillStyle = "#000000"

}

const rand1 = Math.random();
const rand2 = Math.random();
const rand3 = Math.random();


let yrotation = 20;
let xrotation = 0.1;

let prevyrot = [yrotation,0,0,0,
    yrotation,0,0,0,
    yrotation,0,0,0,
    0,0,0,yrotation
];
let prevxrot = [xrotation,0,0,0,
    0,0,0,xrotation,
    0,0,0,xrotation,
    0,0,0,xrotation];
function drawSpidey(x, y) {

    //console.log()
    //drawFly(311 + lastTimestamp/100, 311 - lastTimestamp/500, 50);
    spideyCollider();
    
    //leg dir
    //"rotation" values are derived from avg. foot placement dist from middle (-50...0...50)

    yrotation = 20;
    xrotation = 0.1;
    //prevent 0 values
    let sumx = 0;
    let sumy = 0;
    for(let e=0; e < spideyLegs.length; e++) {
        if(!falling){
            sumy += legMods[e].jy + spideyLegs[e].y;
            sumx += legMods[e].jx + spideyLegs[e].x;
            yrotation = doubleClamp(sumy / 8, -spideyRadius, spideyRadius);
            xrotation = doubleClamp(sumx / 8, -spideyRadius, spideyRadius);
        }
    }
    if (Math.abs(yrotation) >= 0) {
        prevyrot.shift();
        prevxrot.shift()
        prevyrot.push(yrotation);
        prevxrot.push(xrotation);
    }
    yrotation = prevyrot.reduce((acc, cur) => acc + cur) / prevyrot.length;
    xrotation = prevxrot.reduce((acc, cur) => acc + cur) / prevxrot.length;

//console.log("Rotations",yrotation, xrotation)
    // let box = 0;
    // let boy = 0;
    // if (rightPressed) box = -4;
    // if (leftPressed) box = 4;
    // if (upPressed) boy = 4;
    // if (downPressed) boy = -4;
    //body
    // context.fillStyle = "#dddddd"    
    // //context.fillCircle(x - 1 + box, y + 1 + boy, spideyRadius/4);
    // context.beginPath();
    // context.moveTo(x,y);
    // context.bezierCurveTo(x + spideyRadius/2, y - spideyRadius, x - spideyRadius/2, y - spideyRadius, x, y);
    // context.fill();
    context.fillStyle = "#000000"    
    context.fillCircle(x, y, spideyRadius/6);
    
    //leg
    // context.beginPath();
    // context.moveTo(x,y);
    // context.quadraticCurveTo(x - 40, y - 60, x - 60, y + 20);
    // context.stroke();
    for (let i = 0; i < spideyLegs.length; i++) {

        //leg positions
        const dx = spideyLegs[i].x;
        const dy = spideyLegs[i].y;
        //offsets
        //stepping height
        let ay = 0;
        //legmod origin
        let ox = legMods[i].x;
        let oy = legMods[i].y;
        //legmod end destinations
        const ex = legMods[i].dx;
        const ey = legMods[i].dy;
        //const dot = origin.normalize().dotProduct(dest.normalize());
        //formulaaaa
        //console.log("Leg:", i, legMods[i])

        legMods[i].jx = ox;
        legMods[i].jy = oy;
        
        const difx = ex - ox;
        const dify = ey - oy;
        // const normx = 1 / difx;
        // const normy = 1 / dify;
        const elapsed = lastTimestamp - legMods[i].start;
        //animations 
        // this was very poorly set up


        if (legMods[i].anim === jumping || legMods[i].anim === none || legMods[i].anim === swinging ) {
            
        
            const stepSpeed = 16 + (500 * (Math.trunc(Math.hypot(difx, dify)) / (spideyRadius*2)))
            const sec = Math.min(elapsed/stepSpeed, 1);  
            const step = sec * sec * (3-2 * sec);

            ox += (difx * step);
            oy += (dify * step);
            //current position in anim frame
            legMods[i].jx = ox;
            legMods[i].jy = oy;
            
            //console.log(origin, dest)
            if (legMods[i].anim === jumping && lastTimestamp - legMods[i].start < 600)
            {
                legMods[i].x = legMods[i].jx;
                legMods[i].y = legMods[i].jy;
            } else if (sec === 1) {
                //console.log("stopping:", ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].start = 0;
                legMods[i].anim = none;
                //freeLeg = true;
            }
        }
        if (legMods[i].anim === walking) {
            //250ms default step ... 1/4 spidey radius 
            const stepSpeed = 333//(233 + (233 * Math.abs(Math.hypot(difx, dify)) / (spideyRadius))) ;
            const sec = Math.min(elapsed/stepSpeed, 1);  
            //console.log(Math.trunc(Math.hypot(difx, dify)) / (spideyRadius*2))

            //easing function here is pretty superfluous
            //const step = sec;
            const step = sec * sec * (3-2 * sec);

            ox += (difx * step);
            oy += (dify * step);
            
            //abs (0.5 - sec) = 0.5...0...-0.5
            
            ay = -(100 * ((yrotation / 2) / (spideyRadius / 3))) * (0.5 - Math.abs(0.5 - step));
            //console.log("leg:", i, ay);
            
            //current position in anim frame
            legMods[i].jx = ox;
            legMods[i].jy = oy;

            // if (elapsed <= perfectFrameTime * deltaTime && Math.abs(difx+dify) > 1){
            //     footStep(i, 0.3);
            // }
            

            if (sec === 1) {
                // console.log("stopping:", ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].anim = grabbing;
                legMods[i].start = 0;
                if (elapsed > 17 * deltaTime){
                    footStepLand(i);
                }
                //freeLeg = true;
            }
        }


        if (legMods[i].anim === readyWeb || legMods[i].anim === readyStrike || legMods[i].anim === throwWeb || legMods[i].anim === throwStrike ) {
            
            const dur = legMods[i].anim === readyWeb || legMods[i].anim === readyStrike ? 200 : 80;
            const sec = Math.min(elapsed/dur, 1);  
            const step = sec * sec * (3-2 * sec);

            ox += (difx * step);
            oy += (dify * step);
            //current position in anim frame
            legMods[i].jx = ox;
            legMods[i].jy = oy;
            
            if(legMods[i].anim === throwWeb){
                ay = -(100 * ((yrotation / 2) / (spideyRadius / 3))) * (0.5 - Math.abs(0.5 - step));
            }
            
            if(legMods[i].anim === throwWeb || legMods[i].anim === throwStrike ){
                //let enemyHit = false;
                enemies.forEach((x) => {
                    const intersect = intersection({x: spideyPos.x + spideyLegs[i].x + legMods[i].jx, 
                        y: spideyPos.y + spideyLegs[i].y + legMods[i].jy, r: spideyRadius/10}, {x: x.x, y: x.y, r: spideyRadius/6})
                        if(intersect.intersect_count > 0) {
                            //console.log(intersect)
                            if (x.active) {x.active = false;
                            fliesEaten++
                            }
                            //enemyHit = true;
                        };
                })
            }
            

            if (sec === 1) {
                //console.log("stopping:", i, legMods[i].anim, ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].start = lastTimestamp;
                if (legMods[i].anim === throwStrike){
                    stopWeb();
                    legMods[i].anim = falling ? none : walking;   
                    footStep(i, 0.5)
                    legMods[i].dx = 0;
                    legMods[i].dy = 0;
                }
                if (legMods[i].anim === throwWeb){
                    launchWeb(i);
                    legMods[i].anim = falling ? none : walking;   
                    footStep(i, 0.5)
                    legMods[i].dx = 0;
                    legMods[i].dy = 0;
                } else if(legMods[i].anim === readyWeb) {
                    if(LMBHeld){
                        //const rotw = rotate_point(0, 0, Math.atan2(-xrotation, Math.abs(yrotation)), {x: , y: });
                        legMods[i].anim = readyWeb;    
                            legMods[i].dx = cursorPos.components[0]/2 - spideyLegs[i].x/2;
                            // legMods[i].dx += falling ? spideyLegs[i].x * 0.5 : 0;
                            legMods[i].dy = cursorPos.components[1]/2 - spideyLegs[i].y;
                        if (!legMods.some((x, j) => {return x.anim == readyWeb && j !== i}) && !layWeb){
                            let scale = Math.abs(Math.hypot(mouseCursor.x, mouseCursor.y)) / spideyRadius;
                            scale = Math.min(1, scale - 1);
                            //console.log(scale)
                            legMods[i].dx += (-cursorPos.components[0]) * scale;
                            legMods[i].dy += (-cursorPos.components[1]) * scale;
                            // legMods[i].dx *= -1;
                            // legMods[i].dy *= -1;
                        }
                    } else {
                        legMods[i].anim = throwWeb;    
                        legMods[i].dx = cursorPos.components[0] - spideyLegs[i].x;
                        legMods[i].dy = cursorPos.components[1] - spideyLegs[i].y;
                    }
                    
                } else if(legMods[i].anim === readyStrike) {
                    if(RMBHeld){
                        legMods[i].anim = readyStrike;    
                        legMods[i].dx = cursorPos.components[0]/3 - spideyLegs[i].x/2;
                        legMods[i].dy = -Math.abs(cursorPos.components[1]/3) - spideyLegs[i].y;
                    } else {
                        legMods[i].anim = throwStrike;    
                        legMods[i].dx = cursorPos.components[0] - spideyLegs[i].x*0.95;
                        legMods[i].dy = cursorPos.components[1] - spideyLegs[i].y;
                    }
                } 
                
                //freeLeg = true;
                //console.log(lastTimestamp, i, legMods[i])
            }
        }
            
        if (legMods[i].anim === grabWeb) {
            
            const sec = Math.min(elapsed/100, 1);  
            const step = sec * sec * (3-2 * sec);

            ox += (difx * step);
            oy += (dify * step);
            //current position in anim frame
            legMods[i].jx = ox;
            legMods[i].jy = oy;
            
            if (sec === 1) {
                //console.log("stopping:", ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].start = lastTimestamp;
                legMods[i].anim = readyWeb;
                legMods[i].dx = cursorPos.components[0]/2 - spideyLegs[i].x;
                legMods[i].dy = cursorPos.components[1]/2 - spideyLegs[i].y;
                //freeLeg = true;
            }
        }


        //console.log(xrotation, yrotation)

        const legOrigX = (legOrigins[i].x + ((legOrigins[i].y - legOrigins[i].x) * Math.min(1, Math.abs(xrotation/(spideyRadius/2)))))
        const legOrigY = (legOrigins[i].y + ((legOrigins[i].x - legOrigins[i].y) * doubleClamp(-xrotation/spideyRadius, -0.5, 1)))
        //const legrot = rotate_point(0, 0, Math.atan2(copySign(yrotation,legOrigins[i].x), -xrotation), {x: legOrigX,y: legOrigY});
        //console.log((rotation / Math.abs(rotation)))
        const xanchor = x + dx + (copySign(dx, legOrigins[i].x) * (1 - Math.abs(yrotation  / (spideyRadius / 2))) / 2)
        const yanchor = y - dy * (yrotation / Math.abs(yrotation))
            * Math.min(1, Math.abs(yrotation / (spideyRadius / 3)))
            + (((dy) * (legOrigins[i].y/2)) 
            * (1 - Math.abs(yrotation / (spideyRadius))))

        const rotated = rotate_point(0, 0, Math.atan2(xrotation, -20), {x: xanchor-x,y: yanchor-y});
        const invrotated = rotate_point(0, 0, Math.atan2(xrotation, 20), {x: xanchor-x,y: yanchor-y});
        //rotate the stepping offset!
        const rotay = rotate_point(0, 0, Math.atan2(-xrotation, Math.abs(yrotation)), {x: 0, y: ay});
        ay = rotay.y
        rotay.x *= yrotation > 0 ? 1 : -1;
        // const anchrotx = x-rotated.x;
        // const anchroty = y-rotated.y;
        //rotated.x = Math.abs(yrotation) > 12 ? x-xanchor : x-xanchor;

        rotated.y = Math.abs(yrotation) > 5 ? rotated.y : yanchor-y + Math.max(0.1,(rotated.y-yanchor+y) * (yrotation/5));
        invrotated.y = Math.abs(yrotation) > 5 ? invrotated.y : yanchor-y + ((invrotated.y-yanchor+y) * (-yrotation/5));
        const anchrotx = yrotation >= 0 ? x-rotated.x : x+invrotated.x;
        const anchroty = yrotation >= 0 ? y-rotated.y : y+invrotated.y;
           if (jactive){
            context.fillStyle = "#00ff00"; 
            context.fillCircle(spideyPos.x+xrotation,spideyPos.y+yrotation,3)
            // context.fillStyle = "#0000ff";     
            // context.fillCircle(xanchor,yanchor,2)   
            // context.strokeStyle = "#00ffff";     
            // context.strokeCircle(anchrotx,anchroty,2)   
            // context.strokeStyle = "#000000"; 
            context.fillStyle = "#000000"; 
        }
    
        context.beginPath();
        const startx = x + legOrigX;
        const starty = y + legOrigY;
        context.moveTo(startx, starty);

        //anchor x, anchor y, dest x, dest y
        context.quadraticCurveTo(
            //x anchor
            anchrotx, 
            // ,

            //y anchor !
            // 
            anchroty, 
            // ,

            // y                               //spideyPos y/init y
            // - ((dy * 2.5)                   //inverted leg pos Y * multiplier
            // * (rotation / (spideyRadius * 2))   //* -1 ... 0 ... 1  based on leg average
            // + ((dy * legOrigins[i].y / 2) * (1 - Math.abs(rotation / spideyRadius)))), 
            //destination
            //spidey pos + (dest + offset), spidey pos + (dest + offset + step)
           // Math.min(
                //worldCanvas.width - 5,
                Math.max(5,
                    x + (dx + ox + rotay.x)//)
                ), 
                
            //Math.min(
                //worldCanvas.height - 3, 
                Math.max(5, y + (dy + oy + ay)//)
                )
            );
         //draw leg then foot
            context.lineWidth = 1;
            context.stroke();
            if (legMods[i].anim === grabbing){
                context.fillCircle(
                Math.max(5,
                    x + (dx + ox + rotay.x)
                ), 
                Math.max(5, y + (dy + oy + ay)
                ),
            // foot size
            1.5);
                } else {
                context.strokeCircle(
                Math.max(5,
                    x + (dx + ox + rotay.x)
                ), 
                Math.max(5, y + (dy + oy + ay) + 1
                ),
            // foot size
            1);
                }
                
            if (legMods[i].anim === readyWeb){
                context.fillStyle = "#ffffff";
                context.fillCircle(
                Math.max(5,
                    x + (dx + ox + rotay.x)
                ), 
                Math.max(5, y + (dy + oy + ay) + 1
                ),
            // foot size
            0.75);
                }

        context.fillStyle = "#000";
        //console.log(Math.min(worldCanvas.width - 20, x + (dx + ox)), Math.min(worldCanvas.height - 20, y + (dy + oy + ay)))
        
        //update legs
        //if(freeLeg === true) {
        //}
        
        
        spideyMove(i);

        
    }
    
    //console.log(xrotation/Math.abs(xrotation), yrotation/Math.abs(yrotation))
    //eyes temp
    //whites
    //eye offset (y)
    let eo = 0;
    //pupil offset (x)
    let po = 0;
    if (upPressed) eo = -0.5;
    if (downPressed) eo = 0.5;
    if (rightPressed) po = 0.5;
    if (leftPressed) po = -0.5;
    if(RMBHeld || LMBHeld){
        po = cursorPos.components[0] / spideyRadius * 0.5
        eo = cursorPos.components[1] / spideyRadius * 0.5
    }
    context.fillStyle = "#ffffff";
    context.fillCircle(x - (4 + (2 * xrotation/spideyRadius)), y - (2 + (-2 * xrotation/spideyRadius)), 2.5);
    context.fillCircle(x + (4 - (2 * xrotation/spideyRadius)), y - (2 + (2 * xrotation/spideyRadius)), 2.5);
    //pupils
    context.fillStyle = "#000000";
    context.fillCircle(x - (4 - po + (2 * xrotation/spideyRadius)), y - (2 - eo + (-2 * xrotation/spideyRadius)), 2);
    context.fillCircle(x + (4 + po - (2 * xrotation/spideyRadius)), y - (2 - eo + (2 * xrotation/spideyRadius)), 2);

    context.strokeStyle = "#ffffff";
    context.lineWidth = 0.5;
    //fangs
    if(lastTimestamp - dashCoolDown < 750){
        const bite = lastTimestamp - dashCoolDown > 500 ? 1 :  2.5 * (((lastTimestamp - dashCoolDown)%1000)/500);
        let bob = (((lastTimestamp - dashCoolDown)%750)/500);
        
        const step = bob ;
        const weave = bob > 1 ? 2 - step : -step;
        spideyPos.y += weave;
        for(let l=0;l<spideyLegs.length;l++){
            legMods[l].y -= weave; 
        }
    context.beginPath();
    context.moveTo(x-3 - bite + (2 * xrotation/spideyRadius), y+2.5 - (-2 * xrotation/spideyRadius));
    context.bezierCurveTo(
        x - 3 - bite + (2 * xrotation/spideyRadius), y + 3 - (-2 * xrotation/spideyRadius),
        x - 4 - bite + (2 * xrotation/spideyRadius), y + 5 - (-2 * xrotation/spideyRadius),
        x - 1 - bite + (2 * xrotation/spideyRadius), y + 6 - (-2 * xrotation/spideyRadius),
    );
    context.bezierCurveTo(
        x - 2 - bite + (2 * xrotation/spideyRadius), y + 4 - (-2 * xrotation/spideyRadius),
        x - 1.5 - bite + (2 * xrotation/spideyRadius), y + 3.5 - (-2 * xrotation/spideyRadius),
        x - 1 - bite + (2 * xrotation/spideyRadius), y + 3 - (-2 * xrotation/spideyRadius),
    );
    context.stroke();
    context.beginPath();
    context.moveTo(x+3 + bite + (2 * xrotation/spideyRadius), y+2.5 - (2 * xrotation/spideyRadius));
    context.bezierCurveTo(
        x + 3 + bite + (2 * xrotation/spideyRadius), y + 3 - (2 * xrotation/spideyRadius),
        x + 4 + bite + (2 * xrotation/spideyRadius), y + 5 - (2 * xrotation/spideyRadius),
        x + 1 + bite + (2 * xrotation/spideyRadius), y + 6 - (2 * xrotation/spideyRadius),
    );
    context.bezierCurveTo(
        x + 2 + bite + (2 * xrotation/spideyRadius), y + 4 - (2 * xrotation/spideyRadius),
        x + 1.5 + bite + (2 * xrotation/spideyRadius), y + 3.5 - (2 * xrotation/spideyRadius),
        x + 1 + bite + (2 * xrotation/spideyRadius), y + 3 - (2 * xrotation/spideyRadius),
    );
    context.stroke();}

}

//edge detect
function collision() {
    const x = spideyPos.x;
    const y = spideyPos.y;


}

//let freeLeg = 0;
// Function to check intercept of line seg and circle
    // A,B end points of line segment
    // C center of circle
    // radius of circle
    // returns true if touching or crossing else false   
    function doesLineInterceptCircle(A, B, C, radius) {
        let dist;
        const v1x = B.x - A.x;
        const v1y = B.y - A.y;
        const v2x = C.x - A.x;
        const v2y = C.y - A.y;
        // get the unit distance along the line of the closest point to
        // circle center
        const u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x);
        
        
        // if the point is on the line segment get the distance squared
        // from that point to the circle center
        if(u >= 0 && u <= 1){
            dist  = (A.x + v1x * u - C.x) ** 2 + (A.y + v1y * u - C.y) ** 2;
        } else {
            // if closest point not on the line segment
            // use the unit distance to determine which end is closest
            // and get dist square to circle
            dist = u < 0 ?
                  (A.x - C.x) ** 2 + (A.y - C.y) ** 2 :
                  (B.x - C.x) ** 2 + (B.y - C.y) ** 2;
        }
        return dist < radius * radius;
    }
    function interceptCircleLineSeg(circle, line){
        let a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
        v1 = {};
        v2 = {};
        v1.x = line.p2.x - line.p1.x;
        v1.y = line.p2.y - line.p1.y;
        v2.x = line.p1.x - circle.center.x;
        v2.y = line.p1.y - circle.center.y;
        b = (v1.x * v2.x + v1.y * v2.y);
        c = 2 * (v1.x * v1.x + v1.y * v1.y);
        b *= -2;
        d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
        if(isNaN(d)){ // no intercept
            return [];
        }
        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
        u2 = (b + d) / c;    
        
        retP1 = {};   // return points
        retP2 = {}  
        ret = []; // return array
        if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
            retP1.x = line.p1.x + v1.x * u1;
            retP1.y = line.p1.y + v1.y * u1;
            ret[0] = retP1;
        }
        if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
            retP2.x = line.p1.x + v1.x * u2;
            retP2.y = line.p1.y + v1.y * u2;
            ret[ret.length] = retP2;
        }   
        return ret;
    }


const copySign = (x, y) => Math.sign(x) === Math.sign(y) ? x : -x;
let falling = true;
//let swinging = false;
function gravity() {


    let count = 0;
    for(let i=0; i < spideyLegs.length; i++) {
        if(legMods[i].anim === none || legMods[i].anim === jumping || legMods[i].anim === swinging || legMods[i].anim >= grabWeb) {
            count++
        } 
    }
    const gravity = count < 7 ? 0 : (count * 0.25);
    let wasFalling = falling;
    falling = gravity > 0 ? true: false;
    
    //friction
    if (falling && shiftPressed && layWeb) 
        {
            setSpeed(-speed.components[0] * 0.1,-speed.components[1]* 0.1)
        } else {
            setSpeed(-speed.components[0]/3,-speed.components[1]/3);
    };
    
    if (falling && count < 8 && layWeb === false) {
        velocity = velocity.scaleBy(0.90);
        for(let i=0; i < spideyLegs.length; i++) {
            const footPosX = legMods[i].x + spideyLegs[i].x + spideyPos.x;
            const footPosY = legMods[i].y + spideyLegs[i].y + spideyPos.y; 
            if(legMods[i].anim === grabbing) {
                webOrigin.x = footPosX
                webOrigin.y = footPosY;

                //skip legs under spidey
                if(footPosY > spideyPos.y) {
                    count++
                    for(let j=0; j < spideyLegs.length; j++) {
                        if(j===i || legMods[j].anim >= grabWeb){} else {
                            //console.log("Grab under spidey");
                            legMods[j].anim = walking;
                            legMods[j].start = lastTimestamp;
                            legMods[j].dx = 0;
                            legMods[j].dy = 0;
                            legMods[j].x = legMods[j].jx;
                            legMods[j].y = legMods[j].jy;
                        }
                        
                    }
                }
            }
        }

    }

    //console.log(wasFalling);
    //spideyPos.y += gravity;
    setSpeed(0, gravity)
    position = new Vector(spideyPos.x ,spideyPos.y);
    let testPos = position.add(velocity);
    
    //swinging
    if (falling && (layWeb || count < 8) && shiftPressed) {
        

        let swingPoint = new Vector(webOrigin.x, webOrigin.y)
        
        //console.log(scale, swingPoint.length());
        //if trueswinging 
        if(layWeb) {
            //context.fillCircle(rope.components[0], rope.components[1], 5)
            //console.log(position.subtract(swingPoint).length())
            for(let j=0; j < spideyLegs.length; j++) {
                const scale =  (position.subtract(swingPoint).length() + (spideyJump[j].y/2) - spideyRadius*0.1) / position.subtract(swingPoint).length();
                let rope = position.subtract(swingPoint).scaleBy(scale).add(swingPoint)
                
                    if(legMods[j].anim !== swinging && legMods[j].anim < grabWeb){
                        legMods[j].anim = swinging;
                       // legMods[j].start = lastTimestamp - legMods[j].start;
                        
                        legMods[j].dx = rope.components[0] - spideyPos.x - spideyLegs[j].x;
                        legMods[j].dy = rope.components[1] - spideyPos.y - spideyLegs[j].y;
                    } 
            }
        }
        //context.fillCircle(swingPoint.components[0], swingPoint.components[1], 5)
        if ((testPos.subtract(swingPoint).length()) > swingPoint.subtract(position).length())
        {
            let swingLength = swingPoint.subtract(position).length()
            //console.log(swingLength)
            if (swingLength < 12){
                shiftPressed = false;
                spacePressed = false;
            } else {
            let newPos = testPos.subtract(swingPoint).normalize().scaleBy(swingLength).add(swingPoint);
            //newPos = newPos.subtract(new Vector(0, gravity));
            // newPos = newPos.normalize()
            // newPos = newPos.scaleBy(swingLength)
            // newPos = swingPoint.add(newPos)
            //context.fillCircle(testPos.components[0], testPos.components[1], 5)
            //context.fillCircle(newPos.components[0], newPos.components[1], 10)
            setSpeed(
                newPos.subtract(position.add(new Vector (0, gravity))).components[0],
                newPos.subtract(position.add(new Vector (0, gravity))).components[1]
                );
            velocity = newPos.subtract(position).scaleBy(1+(0.001 * deltaTime))
            //console.log(newPos.subtract(position).normalize());
            }
        }
    }

    for(let i=0; i < spideyLegs.length; i++) {
            //if falling stops make others reach for nearest lines again
            if(!falling && wasFalling && (legMods[i].anim === none || (legMods[i].anim === jumping && lastTimestamp - legMods[i].start > 600) || legMods[i].anim === swinging)){
                //console.log("WasFalling");
                legMods[i].anim = walking;
                legMods[i].start = lastTimestamp;
                legMods[i].x = legMods[i].jx;
                legMods[i].y = legMods[i].jy;
                legMods[i].dx = 0;
                legMods[i].dy = 0;
            }
        }

    //draw collisions

    
    //context.beginPath();
    // context.strokeStyle = "#555555"

//collision objects 
//hard line 
//hard circle 
//area box
//area circle

//other body

//area points
//areaPoints = [];
//areaPoints.push({x: 0, y: 0})

//if 
// areaPoints.forEach((x) => {
//     const pointdistx = spideyPos.x - x.x;
//     const pointdisty = spideyPos.x - x.x;


// })

//detection circle

    let line = 0;
    const circle = {radius: spideyRadius, center: spideyPos};
    
    for (let j=0; j < walkLines.length; j++){
        walkLines[j].valid = false;
        walkLines[j].webID = -1;
    }
    
    //area circle
    // areaCircles.forEach((x) => {
    //     const circRadius = x.r;
    //     const circPos = {x: x.x, y: x.y};
    //     if (x.solid){
    //         context.lineWidth = 3;
    //         context.strokeStyle = "#444444"
    //     } else {
    //         context.lineWidth = 1;
    //         context.strokeStyle = "#555555"
    //     }
    //     if(x.half){
    //         context.strokeHalfCircle(circPos.x, circPos.y, circRadius);
    //     } else {
    //         context.strokeCircle(circPos.x, circPos.y, circRadius);
    //     }
    //     const circDist = Math.sqrt(dist2({x: testPos.components[0], y: testPos.components[1]}, circPos));
    //     const circDiff = {x: spideyPos.x - circPos.x, y: spideyPos.y - circPos.y};
    //     circDepth =  (circRadius - circDist + (spideyRadius)) / spideyRadius - 0.1;
    // });
    let moveCounter = 0;
    //circle
    boundaryCircles.forEach((x) => {
        const circRadius = x.r;
        const circPos = {x: x.x, y: x.y};
        // if(jactive){
        //     if (x.solid){
        //         context.lineWidth = 3;
        //         context.strokeStyle = "#444444"
        //     } else {
        //         context.lineWidth = 1;
        //         context.strokeStyle = "#555555"
        //     }
        //     if(x.half){
        //         context.strokeHalfCircle(circPos.x, circPos.y, circRadius);
        //     } else {
        //         context.strokeCircle(circPos.x, circPos.y, circRadius);
        //     }
        // }
        
        const circDist = Math.sqrt(dist2({x: testPos.components[0], y: testPos.components[1]}, circPos));
        const circDiff = {x: spideyPos.x - circPos.x, y: spideyPos.y - circPos.y};
        const circDepth =  (circRadius - circDist + (spideyRadius)) / spideyRadius - 0.1;
        
        if(circDist < spideyRadius + circRadius) {
            if(circDist < spideyRadius / 4 + circRadius) {
                
                //if falling grab hold
                if(falling && !spacePressed && !shiftPressed){
                    for(let i=0; i < spideyLegs.length; i++) {
                        //console.log("grab")
                        if(legMods[i].anim < grabWeb){
                            legMods[i].anim = walking;
                            legMods[i].start = lastTimestamp;
                            legMods[i].x = legMods[i].jx;
                            legMods[i].y = legMods[i].jy;
                            legMods[i].dx = 0;
                            legMods[i].dy = 0;
                        }
                        
                    }
                }
                if(x.solid){
                    // const xpush = (spideyRadius/4) - (circDist - circRadius);
                    // const ypush = (spideyRadius/4) - (circDist - circRadius);
                    const ypush = copySign((spideyRadius / 4) - Math.abs(circDist - circRadius), circDiff.y);
                    const xpush = copySign((spideyRadius / 4) - Math.abs(circDist - circRadius), circDiff.x);
                    spideyPos.x +=  xpush;
                    spideyPos.y +=  ypush;
                    //console.log(circDist-circRadius, spideyRadius/4, circDepth, xpush, ypush);
                    let bouncePos = new Vector(spideyPos.x, spideyPos.y);
                    velocity = velocity.add(bouncePos.subtract(position));
                    if(moveCounter === 0){moveCounter++}    //stops double-bounce with line overlaps
                        for (let i=0; i < spideyLegs.length; i++) {
                            if(legMods[i].anim === grabbing){
                                legMods[i].y -= ypush;
                                legMods[i].dy -= ypush;
                                legMods[i].x -= xpush;
                                legMods[i].dx -= xpush;
                            }
                        }
                }
                
                }
                const hits = intersection({...spideyPos, r: spideyRadius}, {...circPos, r: circRadius});
                
                if (hits.intersect_count === 2){
                    
                    //when hitting a circle
                    //make 3 lines: intersect pts -> spidey * depth, +line between
                    const grab1 = {x: hits.point_1.x - spideyPos.x, y: hits.point_1.y - spideyPos.y};
                    const grab2 = { x: hits.point_2.x - spideyPos.x, y: hits.point_2.y - spideyPos.y};
                    walkLines[line].valid = true;
                    walkLines[line].p1.x = grab1.x;
                    walkLines[line].p1.y = grab1.y;
                    walkLines[line].p2.x = grab1.x - (grab1.x * circDepth/2);
                    walkLines[line].p2.y = grab1.y - (grab1.y * circDepth/2);
                    line < 16 ? line++ : line;
                    walkLines[line].valid = true;
                    walkLines[line].p1.x = grab2.x;
                    walkLines[line].p1.y = grab2.y;
                    walkLines[line].p2.x = grab2.x - (grab2.x * circDepth/2);
                    walkLines[line].p2.y = grab2.y - (grab2.y * circDepth/2);
                    line < 16 ? line++ : line;
                    walkLines[line].valid = true;
                    walkLines[line].p1.x = grab1.x - (grab1.x * circDepth/2);
                    walkLines[line].p1.y = grab1.y - (grab1.y * circDepth/2);
                    walkLines[line].p2.x = grab2.x - (grab2.x * circDepth/2);
                    walkLines[line].p2.y = grab2.y - (grab2.y * circDepth/2);
                    line < 16 ? line++ : line;
                    //boundaryColliders.push({...walkLines[0], solid:true} )
                    //console.log(xmov, ymov, walkLines);
                }
            }
        })

        const radius = spideyRadius / 8;
        //edge barriers 
        if ((radius) + buffer >= spideyPos.x ||
            spideyPos.x >= worldSize.width - (radius) - buffer)
        {
            //console.log("X");
            setSpeed(-speed.components[0], 0);
            spideyPos.x = doubleClamp(spideyPos.x, (radius) + buffer, worldSize.width - (radius) - buffer);
            
        }
        if ((radius) + buffer >= spideyPos.y ||
            spideyPos.y >= worldSize.height - (radius) - buffer
            )
        {
            //console.log("Y") 
            setSpeed(0, -speed.components[1]);
            spideyPos.y = doubleClamp(spideyPos.y, (radius) + buffer, worldSize.height - (radius) - buffer);

        }

        //lines 
        boundaryColliders.forEach((x) => {
        // if(jactive){
        //     if (x.solid){
        //     context.lineWidth = 3.0;
        //     context.strokeStyle = "#444444";
        //     } else {
        //         context.lineWidth = 1;
        //         context.strokeStyle = "#aaaaaa";
        //     }
        //     context.beginPath();
        //     context.moveTo(x.p1.x, x.p1.y);
        //     context.lineTo(x.p2.x, x.p2.y);
        //     context.stroke();
        // }
        
            //A, B, C, r
            if(doesLineInterceptCircle(x.p1, x.p2, spideyPos, spideyRadius)){
                //console.log(interceptCircleLineSeg(circle, line));
                const intercepts = interceptCircleLineSeg(circle, x);
                if (line > 15) {
                    const distA = distToSegmentSquared(spideyPos, x.p1, x.p2);
                    const distB = distToSegmentSquared({x:0,y:0}, walkLines[15].p1, walkLines[15].p2);
                    if (distA < distB){ 
                        line = 15;
                        };
                }
                const distD = distToSegment(spideyPos, x.p1, x.p2);
                if (distD < (spideyRadius / 4)) {
                    //if falling grab hold
                    if(falling && !spacePressed && !shiftPressed){
                        for(let i=0; i < spideyLegs.length; i++) {
                            //console.log("grab");
                        if(legMods[i].anim < grabWeb){
                            legMods[i].anim = walking;
                            //init bug? 
                            legMods[i].start = lastTimestamp > 0? lastTimestamp : 0;
                            legMods[i].x = legMods[i].jx;
                            legMods[i].y = legMods[i].jy;
                            legMods[i].dx = 0;
                            legMods[i].dy = 0;
                        }
                        }
                    }
                }

                if (line < 16) {
                    //console.log(line, intercepts, walkLines)
                    walkLines[line].valid = true;
                    if(intercepts.length === 0) {
                        //console.log("Line is inside circle!");
                        walkLines[line].p1 = {x: x.p1.x - spideyPos.x, y: x.p1.y - spideyPos.y};
                        walkLines[line].p2 = {x: x.p2.x - spideyPos.x, y: x.p2.y - spideyPos.y};
                        //context.fillCircle(x.p1.x, x.p1.y, 3);
                        //context.fillCircle(x.p2.x, x.p2.y, 3);
                    }
                    if(intercepts.length > 0) {
                        walkLines[line].p1 = {x: intercepts[0].x - spideyPos.x, y: intercepts[0].y - spideyPos.y};
                        walkLines[line].p2 = {x: intercepts[0].x - spideyPos.x, y: intercepts[0].y - spideyPos.y};
                        //debug
                        //context.fillCircle(intercepts[0].x, intercepts[0].y, 3);
                        if(intercepts.length > 1) {
                            walkLines[line].p2 = {x: intercepts[1].x - spideyPos.x, y: intercepts[1].y - spideyPos.y}
                            //debug
                            //context.fillCircle(intercepts[1].x, intercepts[1].y, 3);
                            //console.log(line, walkLines)
                        } else {
                            //console.log("Line end within circle!")
                            const d1 = dist2(x.p1, spideyPos);
                            const d2 = dist2(x.p2, spideyPos);
                            let closest;
                            //
                            d1 < d2 ? closest = x.p1 : closest = x.p2;
                            walkLines[line].p2 = {x: closest.x - spideyPos.x, y: closest.y - spideyPos.y}
                            //context.fillCircle(closest.x, closest.y, 3);
                        }
                    }
                if(x.solid) {
                    const testx = testPos.components[0];
                    const testy = testPos.components[1];
                    const bounce = intercepts.length === 1;
                    const distC = distToSegment({x: testx, y: testy}, {x: walkLines[line].p1.x + spideyPos.x, 
                        y: walkLines[line].p1.y + spideyPos.y}, {x: walkLines[line].p2.x + spideyPos.x, 
                        y: walkLines[line].p2.y + spideyPos.y});

                        if (distC < (spideyRadius / 4)) {

                        //enforce distance 
                        //
                        let pointOne = intercepts[0];
                        let pointTwo = intercepts[1];
                        if (intercepts.length === 0){
                            //console.log("inside")
                            pointOne = {x: walkLines[line].p1.x + spideyPos.x, 
                                y: walkLines[line].p1.y + spideyPos.y}
                            pointTwo = {x: walkLines[line].p2.x + spideyPos.x, 
                                y: walkLines[line].p2.y + spideyPos.y}
                        }
                        if (bounce) {
                            //console.log("1PT")
                            pointTwo = {x: walkLines[line].p2.x + spideyPos.x, 
                                y: walkLines[line].p2.y + spideyPos.y}
                        }
                        const nearest = closestSegmentPoint({x: testx, y: testy}, pointOne, pointTwo);
                        const dx = spideyPos.x - nearest.x;
                        const dy = spideyPos.y - nearest.y;
                        const ypush = copySign((spideyRadius / 4) - Math.abs(dy), dy)
                        const xpush = copySign((spideyRadius / 4) - Math.abs(dx), dx)

                            //console.log(distC, dx, dy);
                            // console.log(pointTwo);
                            //console.log(xpush, ypush);
                        if (Math.abs(dy) > EPSILON && Math.abs(dy) > Math.abs(dx)) {
                                

                            spideyPos.y += ypush;
                            //setSpeed(0, -speed.components[1] / ());
                            for (let i=0; i < spideyLegs.length; i++) {
                                if(legMods[i].anim === grabbing){
                                    legMods[i].y -= ypush;
                                    legMods[i].dy -= ypush;
                                }
                                
                            }
                        }
                        if (Math.abs(dx) > EPSILON && Math.abs(dx) > Math.abs(dy)) {
                            spideyPos.x += xpush;
                            //setSpeed(-speed.components[0], 0);
                            for (let i=0; i < spideyLegs.length; i++) {
                                legMods[i].x -= xpush;
                                legMods[i].dx -= xpush;
                            }
                        }
                        
                        //we only change velocity on primary collision
                        //prevents bouncing + phasing bugs 
                        if (moveCounter === 0){
                            let bouncePos = new Vector(spideyPos.x, spideyPos.y);
                            velocity = velocity.add(bouncePos.subtract(position));
                            // console.log(velocity);
                            moveCounter++
                        }
                    }
                
                }
                
            }
                //increment line
                line++
            }
    })

    webArray.forEach((x, j) => {
        
        
            //A, B, C, r
            if(doesLineInterceptCircle(x.p1, x.p2, spideyPos, spideyRadius)){
                //console.log(interceptCircleLineSeg(circle, line));
                const intercepts = interceptCircleLineSeg(circle, x);
                if (line > 15) {
                    const distA = distToSegmentSquared(spideyPos, x.p1, x.p2);
                    const distB = distToSegmentSquared({x:0,y:0}, walkLines[15].p1, walkLines[15].p2);
                    if (distA < distB){ 
                        line = 15;
                        };
                }

                if (line < 16) {
                    //console.log(line, intercepts, walkLines)
                    walkLines[line].valid = true;
                    walkLines[line].webID = j;
                    if(intercepts.length === 0) {
                        //console.log("Line is inside circle!");
                        walkLines[line].p1 = {x: x.p1.x - spideyPos.x, y: x.p1.y - spideyPos.y};
                        walkLines[line].p2 = {x: x.p2.x - spideyPos.x, y: x.p2.y - spideyPos.y};
                        //context.fillCircle(x.p1.x, x.p1.y, 3);
                        //context.fillCircle(x.p2.x, x.p2.y, 3);
                    }
                    if(intercepts.length > 0) {
                        walkLines[line].p1 = {x: intercepts[0].x - spideyPos.x, y: intercepts[0].y - spideyPos.y};
                        walkLines[line].p2 = {x: intercepts[0].x - spideyPos.x, y: intercepts[0].y - spideyPos.y};
                        //debug
                        //context.fillCircle(intercepts[0].x, intercepts[0].y, 3);
                        if(intercepts.length > 1) {
                            walkLines[line].p2 = {x: intercepts[1].x - spideyPos.x, y: intercepts[1].y - spideyPos.y}
                            //debug
                            //context.fillCircle(intercepts[1].x, intercepts[1].y, 3);
                            //console.log(line, walkLines)
                        } else {
                            //console.log("Line end within circle!")
                            const d1 = dist2(x.p1, spideyPos);
                            const d2 = dist2(x.p2, spideyPos);
                            let closest;
                            //
                            d1 < d2 ? closest = x.p1 : closest = x.p2;
                            walkLines[line].p2 = {x: closest.x - spideyPos.x, y: closest.y - spideyPos.y}
                            //context.fillCircle(closest.x, closest.y, 3);
                        }
                    }
                    

                // context.strokeStyle = "#ffffff"
                // context.lineWidth = 1.5;
                // context.beginPath();
                // context.moveTo(x.p1.x, x.p1.y);
                // context.lineTo(walkLines[line].p1.x + spideyPos.x,walkLines[line].p1.y + spideyPos.y);
                // context.stroke();
                // //context.strokeStyle = "#992233"
                // context.beginPath();
                // context.moveTo(walkLines[line].p1.x + spideyPos.x,walkLines[line].p1.y + spideyPos.y);
                // context.lineTo(walkLines[line].p2.x + spideyPos.x,walkLines[line].p2.y + spideyPos.y);
                // context.stroke();
                // //context.strokeStyle = "#332299"
                // context.beginPath();
                // context.moveTo(walkLines[line].p2.x + spideyPos.x,walkLines[line].p2.y + spideyPos.y);
                // context.lineTo(x.p2.x, x.p2.y);
                // context.stroke();
                // context.strokeStyle = "#000000"
                // context.lineWidth = 1;
                    
            }
                //increment line
                line++
            }
    })
    


}


function drawProjectiles(){
    if (projectiles.length > 0 && (lastTimestamp - projectiles[0].start > 8000 || projectiles[0].y > worldSize.height)) projectiles.shift();

    projectiles.forEach((x, j) => {
        //speed / spideyradius * 2, just cuz
        const changex = (x.speedx * 0.04) * deltaTime
        const changey = (x.speedy * 0.04) * deltaTime
        x.x += changex;
        x.y += changey;
        x.speedx *= 0.99;
        x.speedy *= 0.99;
        x.speedy += 1.2;
        context.lineWidth = 1.5;
        context.strokeStyle = "#ffffff";
        if (jactive) context.strokeStyle = "#dddddd";
        context.beginPath();
        const size = x.type === 0? 8 : 1.5;
        context.strokeCircle(x.x, x.y, size);
        if (x.type === 1) {
            context.fillStyle = "#ffffff";
            context.fillCircle(x.x, x.y, size);
            context.lineWidth = 1.0;
            if(x.type === 1 && lastTimestamp - x.start > 2000) {
                const time = lastTimestamp - x.start;
                context.lineWidth = 1.0 * (1 - time%501/501);
                if(lastTimestamp - x.start > 2500) return;
            }
            context.moveTo(x.x, x.y)
            context.lineTo(spideyPos.x, spideyPos.y)
            context.stroke();
            //check sticks to obj
            if (lastTimestamp - projectiles[0].start > Math.hypot(mouseCursor.x, mouseCursor.y)*2
                && (checkCollision(x.x, x.y, 5) || checkWebCollision(x.x, x.y, 5) > -1)) {
                //if big radius is a hit, do precise step-checking
                let web = -1;
                for(let i=1; i<20; i++){
                    const stepx = x.x - (changex / i);
                    const stepy = x.y - (changey / i);
                    web = checkWebCollision(stepx, stepy, 1.5)
                    if(checkCollision(stepx, stepy, 1) || web > -1){
                        //make web hits in precise middle 
                        if(web > -1){
                            const start = closestSegmentPoint({x: stepx, y: stepy}, 
                            {x: webArray[web].p1.x, y: webArray[web].p1.y}, 
                            {x: webArray[web].p2.x, y: webArray[web].p2.y});
                            webOrigin = {x: start.x, y: start.y, webID: web}
                        } else {
                            webOrigin = {x: stepx, y: stepy, webID: web}
                        }
                        layWeb = true;
                        projectiles.splice(j, 1);
                        if (shiftPressed && !falling) falling = true;
                        break;
                    }
                    //} else {
                        //webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {x: x.x, y: x.y}, solid: false, stuck: []})
                        //projectiles.splice(i, 1)
                        //layWeb = false;
                        //webOrigin = {x: 0, y: 0}
                    
                }
               
            }
        } 
        
        enemies.forEach((y) => {
            if (!y.active) return;
            if(intersection({x: x.x, y: x.y, r: 10}, {x: y.x, y: y.y, r: 10}).intersect_count > 0){
                for(let i=1; i<5; i++){
                    const stepx = x.x - (changex / i);
                    const stepy = x.y - (changey / i);
                    const intersect = intersection({x: stepx, y: stepy, r: size}, {x: y.x, y: y.y, r: 3});
                    if (intersect.intersect_count > 0) {
                        //console.log("Hit!", j, k);
                        projectiles.splice(j, 1);
                        y.active = false;
                        fliesEaten++
                        break;
                    }
                }
            }
           
           

            //
        })

    })
}

function drawWebs(){
    webArray.forEach((x, k) => {
            
        context.lineWidth = 1.5;
        context.strokeStyle = "#ffffff";
        if (jactive) context.strokeStyle = "#dddddd";
        context.beginPath();
        context.moveTo(x.p1.x, x.p1.y);
        // const animate = (lastTimestamp%3000)/1500; 
        // const lineWave = animate > 1? 2 - animate : animate;
        // context.quadraticCurveTo(
        //     x.p1.x + ((x.p2.x - x.p1.x) /2), (x.p1.y + ((x.p2.y - x.p1.y) / 2) + ( lineWave * 20)),
        //     x.p2.x, x.p2.y
        // );
        //context.stroke();
        

        // send vibros out from stuck enemies 
        // amplitude and frequency as rotation 
        // position is a modulo along bug.xy to p1 & p2 
        // curve repeats x3 
        // settings: speed, pattern?
        // speed: 
        // .___~____x___~____.
        // sine-ish wave 
        // 0.364212423249, 0, 0.635787576751, 1

        //temp/dupe array is debt...
        const vibros = [];
        //max of 8 at a time (= 16)
        x.vibros.length = Math.min(8, x.vibros.length)
        x.vibros.forEach((vibro, l) => {
            const rotation = Math.atan2(x.p2.y - x.p1.y, x.p2.x - x.p1.x)
            const amplitude = rotate_point(0, 0, rotation, {x:0, y: vibro.amp})
            const frequency = rotate_point(0, 0, rotation, {x:vibro.freq, y:0})

            const numvibes = vibros.length;
            // draw curves then lines 
            // push beginning and end locations 
            // sort as dist from p1
            // foreach drawline then move 
            let startx = -1;
            let starty = -1;
            for (let i=0;i<16;i++) {
                // towards the first or last point of the web
                const destx = i<8 ? x.p1.x : x.p2.x;
                const desty = i<8 ? x.p1.y : x.p2.y;
                const j = i%8;
                const freq = i<8 ? {...frequency} : {x: -frequency.x, y: -frequency.y};
                const dx = destx - vibro.x + freq.x * (3);
                const dy = desty - vibro.y + freq.y * (3);
                const dist = Math.hypot(-dx, -dy);
                const speed = 1000 * (dist / 250);
                const animate = Math.max(0, Math.min(1, (lastTimestamp - vibro.start - (42*j)) / speed)); 
                const prevanimate = (prevTimestamp - vibro.start - (42*j)) / speed; 
                const prevx = vibro.x + dx * prevanimate;
                const prevy = vibro.y + dy * prevanimate;
                const vx = vibro.x + dx * animate;
                const vy = vibro.y + dy * animate;
                const scaled = (100/dist);

                // const vlenx = vx - freq.x * (3);
                // const vleny = vy - freq.y * (3);
                if (j===0) {
                    context.moveTo(vx, vy);
                    startx = vx;
                    starty = vy;

                    if(vibro.amp > 1 && animate !== 0){
                        x.attachedTo.forEach((atd2, ind) => {
                                if (atd2 !== -1){
                                    const targetp = ind === 0 ? x.p1 : x.p2;
                                    if(prevanimate < 1 && animate === 1 && dist > 60){
                                        //console.log("AttachedTo:", k, atd2, prevanimate, dist)
                                        webArray[atd2].vibros.push({x: targetp.x, y: targetp.y, start: lastTimestamp, freq: vibro.freq, amp: vibro.amp * 0.5})
                                    }
                                }
                            })
                            //
                            if(vibro.amp * (1 - animate) > 1){
                                x.attached.forEach((atd) => {
                                    const atchd = webArray[atd];
                                    if (animate < 1){     
                                        const targetp = atchd.attachedTo[0] === k ? atchd.p1 : atchd.p2;
                                        //if sign flips from prev frame or is 0 for both x and y 
                                        if((Math.sign(vx - targetp.x) !== Math.sign(prevx - targetp.x) || Math.sign(vx - targetp.x) === 0)
                                        && (Math.sign(vy - targetp.y) !== Math.sign(prevy - targetp.y) || Math.sign(vy - targetp.y) === 0)){
                                            //console.log("Attached:", vx - targetp.x, vy - targetp.y)
                                            atchd.vibros.push({x: targetp.x, y: targetp.y, start: lastTimestamp, freq: vibro.freq, amp: vibro.amp * (1 - animate)})
                                        }
                                    }
                                }) 
                            }
                        //attachedTo: always 2 entries, either -1 or webID
                        //a simpler way? 
                        // if animate === 1
                        // dest p1/p2 === index 0/1 -- when anim is finished I know I am at my attachedTo "destination"
                        // send vibro to attachedTo at dest pos
                        // if (animate < 1){
                               
                        // }
                       
                    }
                }
                //temp - 2 groups of 3 curves -- later to define in pattern array: 0,1,1,1,0,1,1,1 etc
                if(animate < 1) {
                    //web to start position
                    const amp = {...amplitude};
                    amp.x *= 1 - animate;
                    amp.y *= 1 - animate;
                    if(animate < 0.1 * scaled) {
                        amp.x *= animate*(10/scaled);
                        amp.y *= animate*(10/scaled);
                        freq.x *= animate*(10/scaled);
                        freq.y *= animate*(10/scaled);
                    }
                    //console.log("AMP:", vibro.amp * (1-animate))
                    if (i===7 || i===15) {
                        //context.moveTo(vx, vy);
                        const p1 = {x: startx, y: starty};
                        const p2 = {x: vx, y: vy};
                        if (i===7) vibros.push({p1: p1, p2: p2, dist: Math.hypot(x.p1.x - startx, x.p1.y - starty)});
                        if (i===15) vibros.push({p1: p2, p2: p1, dist: Math.hypot(x.p1.x - vx, x.p1.y - vy)});
                    }
                    // formerly patterns
                    //if(i !== 0 && i !== 8){
                    context.bezierCurveTo(
                        vx - freq.x * (1) + amp.x, vy + amp.y - freq.y * (1),
                        vx - freq.x * (2) - amp.x, vy - amp.y - freq.y * (2),
                        vx, vy,
                    );
                    // }else{
                    //     context.lineTo(vx + freq.x * (3), vy + freq.y * (3),);
                    // }
                }
            }
            //if no vibro was pushed we can delete this entry
            if(numvibes === vibros.length){
                x.vibros.splice(k, 1);
                //console.log("Removing vibro", k, l, webArray[k])
            }
            
        })
        context.moveTo(x.p1.x, x.p1.y);
        if(vibros.length>0){
            vibros.sort((a, b) => {
                if(a.dist < b.dist){
                    return -1
                }
                if(a.dist > b.dist){
                    return 1
                }
                return 0
            })
            
            
            let prevx = 0;
            let prevy = 0;
            vibros.forEach((v) => {
                const distl = (v.p2.x - v.p1.x)*(v.p2.x - v.p1.x) + (v.p2.y - v.p1.y)*(v.p2.y - v.p1.y);
                if (Math.abs((v.p2.x - prevx)*(v.p2.x - prevx) + (v.p2.y - prevy)*(v.p2.y - prevy)) > Math.abs(distl)) {
                    context.lineTo(v.p1.x, v.p1.y);
                    }
                context.moveTo(v.p2.x, v.p2.y);
                prevx = v.p2.x;
                prevy = v.p2.y;
            })
        } else {
            //when all vibros are done animating, delete them all...
            //imperfect solution but it works 
            x.vibros.length = 0;
        }
        context.lineTo(x.p2.x, x.p2.y);
        context.stroke();
        
        //context.lineWidth = 1;
    })
    
    context.lineWidth = 1.5; 
    context.strokeStyle = "#ffffff"; 
    let holdWeb = -1;  
    let secondWeb = -1;
    for(let i=0; i<spideyLegs.length; i++){
        if(legMods[i].anim === readyWeb || legMods[i].anim === throwWeb){
            holdWeb = i;
            secondWeb = secondWeb >= 0? secondWeb : i;
            context.beginPath();
            context.moveTo(spideyPos.x, spideyPos.y);
            context.lineTo(spideyPos.x + spideyLegs[i].x + legMods[i].jx, spideyPos.y + spideyLegs[i].y + legMods[i].jy);
            context.stroke();
            if (secondWeb !== i && !layWeb || (falling && shiftPressed)){
                let j = secondWeb;
                context.beginPath();
                context.moveTo(spideyPos.x + spideyLegs[i].x + legMods[i].jx, spideyPos.y + spideyLegs[i].y + legMods[i].jy);
                context.lineTo(spideyPos.x + spideyLegs[j].x + legMods[j].jx, spideyPos.y + spideyLegs[j].y + legMods[j].jy);
                context.stroke();
            }
        }
    }
    if(layWeb) {
        context.lineWidth = 1.5;
        context.strokeStyle = "#ffffff";
        if (jactive) context.strokeStyle = "#dddddd";
        context.beginPath();
        context.moveTo(webOrigin.x, webOrigin.y);
        holdWeb > -1 && !(falling && shiftPressed) ? context.lineTo(spideyPos.x + spideyLegs[holdWeb].x + legMods[holdWeb].jx, spideyPos.y + spideyLegs[holdWeb].y + legMods[holdWeb].jy) : context.lineTo(spideyPos.x, spideyPos.y);
        context.stroke();
        

        context.strokeStyle = "#000000";
        context.lineWidth = 1;
    }
    context.strokeStyle = "#000000";
    context.lineWidth = 1;
}
let velocity = new Vector(0, 0)
let acceleration = new Vector(0, 0)


function setSpeed(x, y) {
    //xmov = Math.min(1, Math.max( -1, x));
    //ymov = Math.min(1, Math.max( -1, y));
    acceleration = acceleration.add(new Vector((x / perfectFrameTime) * deltaTime, (y / perfectFrameTime) * deltaTime))
    velocity = velocity.add(acceleration);
    speed = velocity;
    // console.log(acceleration.components, velocity.components)
    // console.log(speed.components[0], speed.components[1]);
    acceleration = acceleration.subtract(acceleration);
    //return xmov, ymov;
    
}

function move() {

    let xmov = speed.components[0];
    let ymov = speed.components[1];

    // if (!isNaN(deltaTime)) {
    // //console.log(xmov, ymov);
    xmov *= deltaTime;
    ymov *= deltaTime;
    // }
    //move spidey pos
    spideyPos.x += xmov;
    spideyPos.y += ymov;
    //enforce pos 
    //spideyPos.x = Math.min(worldCanvas.width - radius + buffer,Math.max(radius - buffer, spideyPos.x))
    //spideyPos.y = Math.min(worldCanvas.height - radius + buffer,Math.max(radius - buffer, spideyPos.y))

    
    for (let i=0; i < legMods.length; i++) {
        if (legMods[i].anim === grabbing) {
            legMods[i].x -= xmov;
            //legMods[i].dx -= xmov;
            legMods[i].y -= ymov;
            //legMods[i].dy -= ymov;
        } 
        
        // if (0 + (radius) + buffer <= spideyPos.x &&
        //     spideyPos.x <= worldCanvas.width - (radius) - buffer)
        // {
            //console.log("X")
            // legMods[i].x -= (xmov);
            // legMods[i].dx -= (xmov);
        // }
        // if (0 + (radius) + buffer <= spideyPos.y &&
        //     spideyPos.y <= worldCanvas.height - (radius) - buffer
        //     )
        // {
            //console.log("y")
            // legMods[i].y -= (ymov);
            // legMods[i].dy -= (ymov);
        
        // }
        
    }
}


//.type, .x, .y, .anim, .start, .dx, dy
function drawEnemies(){
    
    if (enemies.length === 0 || enemies.every((x) => {return !x.active})) {
       // enemies.push({type: 1, x: viewport.width*0.6, y:worldSize.height - 190,start: 1000 *  Math.random(), dx: 0, dy: worldSize.height - 190, active: true, anim: none});
        enemies.push({type: 2, x: viewport.width*0.4, y:worldSize.height - 90,start: 1000 *  Math.random(), dx: worldSize.width, dy: worldSize.height - 90, active: true, anim: none, lmods: [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}]});
        for(let i=0;i<1001;i++){
            //enemies.push({type: 0, x: worldSize.width * Math.random(), y: worldSize.height * Math.random(), start: 1000 *  Math.random(), dx: worldSize.width * Math.random(), dy: worldSize.height * Math.random(), active: true, anim: flying})
            enemies.push({type: 0, x: worldSize.width * Math.random(), y: worldSize.height * Math.random(), start: 1000 *  Math.random(), dx: worldSize.width * Math.random(), dy: worldSize.height * Math.random(), active: true, anim: flying})

        }
    }
    enemies.forEach((x) => {
        if(x.active
            && x.x > spideyPos.x - viewport.width
            && x.x < spideyPos.x + viewport.width
            && x.y > spideyPos.y - viewport.height
            && x.y < spideyPos.y + viewport.height){
            //animate
            switch (x.type){
                case 0:
                    drawFly(x);
                    break
                    case 1:
                        drawAnt(x);
                        break
                    case 2:
                        drawLadybug(x);
                        break
                default: drawFly(x);
            }
            
        }
        
    })
}

//.type, .x, .y, .anim, .start, .dx, dy
function drawObjects(){
    //if(!jactive) {
    scnObj.forEach((x) => {
        if(x.type === ground){
            //
            paintGround(x.id, x.length);            
        } else if(x.type === rockMed){
            //
            paintRockMed(x.id, x.length); 
        } else if(x.type === stopSign){
            paintStopSign(x.id, x.length);  
            
        }   else if(x.type === cactus){
            paintCactus(x.id, x.length, x.circID, x.circLen);  
            
        }   else if(x.type === tree){
            paintTree(x.id, x.length, x.circID, x.circLen);  
            
        }        
    })
    //}
}

function processAI(){
    enemies.forEach((x, j) => {
        if(x.active) {
            const targetx = x.x - x.dx;
            const targety = x.y - x.dy;
            let hitLine = -1;
            if(x.type === 0 && x.anim != stuck){
                webArray.forEach((y, i) => {
                    if (doesLineInterceptCircle(y.p1, y.p2, x, 3) && Math.random() > 0.95) {
                        hitLine = i;
                    //     const distx = y.p2.x - y.p1.x;
                    //     const disty = y.p2.y - y.p1.y;
                    //     const percent = Math.hypot(distx, disty);
                    //     console.log(percent)
                        const intercepts = interceptCircleLineSeg({center: {x: x.x, y: x.y}, radius: 3}, y)
                        x.x = intercepts[0].x;
                        x.y = intercepts[0].y;
                        x.dx = intercepts[0].x;
                        x.dy = intercepts[0].y;
                        x.anim = stuck;
                        x.start = lastTimestamp;
                        webArray[i].stuck.push(j) 
                        webArray[i].vibros.push({x: x.x, y: x.y, start: lastTimestamp, amp: 6.35787, freq: 3.64212}) 

                    };
                })
                if(hitLine > -1) {
                    //console.log(hitLine)
                } else if(Math.abs(targetx) < 1 && Math.abs(targety) < 1){
                    x.dx += 100 * Math.random() - 50;
                    x.dy += 100 * Math.random() - 50;
                    //enforce valid
                    x.dx = Math.min(worldSize.width - 15, Math.max(15, x.dx));
                    x.dy = Math.min(worldSize.height - 15, Math.max(15, x.dy));
                    //console.log(x.dx, x.dy);
                } else {
                    x.x -= copySign(0.25, targetx);
                    x.y -= copySign(0.25, targety);
                }
            } 
        }
            
    })
}



var spaceHeld = 0;
var jumpCoolDown = 0;
var curYPos = 0;
var dashCoolDown = -9990;

var startgame = false;
//temp
if (startgame) {

    const w = viewport.width - buffer;
    const h = viewport.height - buffer;
    
        boundaryColliders.push({p1: {x: w, y: h}, p2: {x: 0, y: h}, solid: true});
        boundaryColliders.push({p1: {x: 0, y: h}, p2: {x: 0, y: 0}, solid: true});
        boundaryColliders.push({p1: {x: 0, y: 0}, p2: {x: w, y: 0}, solid: true});
        boundaryColliders.push({p1: {x: w, y: 0}, p2: {x: w, y: h}, solid: true});
        //areaBoxes.push({p1: {x: 0, y: h}, p2: {x: w, y: h-30}})
}   
//main game draw
function update(timestamp) {
    requestAnimationFrame(update);
    deltaTime = (timestamp - lastTimestamp) / perfectFrameTime;
    deltaTime = isNaN(deltaTime) ? 1 : deltaTime;
    //console.log(deltaTime);
    prevTimestamp = lastTimestamp;
    lastTimestamp = timestamp;
    
    //reset frame
    //context.clearRect(0, 0, canvas.clientWidth, worldCanvas.height);
    //vctx.clearRect(0, 0, viewport.width, viewport.height);


    //start screen 
    if (startgame) {

        const w = viewport.width - buffer;
        const h = viewport.height - buffer;
        

        context.fillStyle = "#aaaaaa";
        context.fillRect(0,0,w,h)


        drawWebs();
        context.fillStyle = "#ffffff";
        context.font = "35px Verdana";
        context.textAlign = "left";
        context.fillText("__ S P I D E Y __", w * 0.25, h * 0.2);
        const boxw = context.measureText("__ S P I D E Y __").width;
        const boxh = context.measureText("__ S P I D E Y __").actualBoundingBoxAscent;
        areaBoxes.push({p1: {x: w * 0.25, y: h * 0.2}, 
            p2: {x: w * 0.25 + boxw, y: h * 0.2 - boxh}});

        context.fillStyle = "#444444";
        context.textAlign = "left";
        context.font = "22px";
        context.fillText("start", w * 0.285, h * 0.33);
        const box1w = context.measureText("start").width;
        const box1h = context.measureText("start").actualBoundingBoxAscent;
        areaBoxes.push({p1: {x: w * 0.285, y: h * 0.33}, 
            p2: {x: w * 0.285 + box1w, y: h * 0.33 - box1h}});

        context.fillText("continue", w * 0.285, h * 0.33 + 60);
        const box2w = context.measureText("continue").width;
        const box2h = context.measureText("continue").actualBoundingBoxAscent;
        areaBoxes.push({p1: {x: w * 0.285, y: h * 0.33 + 60}, 
            p2: {x: w * 0.285 + box2w, y: h * 0.33 + 60 - box2h}});
            
        context.fillText("options", w * 0.285, h * 0.33 + 120);
        const box3w = context.measureText("options").width;
        const box3h = context.measureText("options").actualBoundingBoxAscent;
        areaBoxes.push({p1: {x: w * 0.285, y: h * 0.33 + 120}, 
            p2: {x: w * 0.285 + box3w, y: h * 0.33 + 120 - box3h}});
            
        context.fillText("continue", w * 0.285, h * 0.33 + 60);

        if (mouseFocus){
            const curX = spideyPos.x;
            const curY = spideyPos.y;
            mousePosition.x = Math.min(w - spideyRadius*0.2, Math.max(spideyRadius*0.2, mousePosition.x));
            mousePosition.y = Math.min(h - spideyRadius*0.2, Math.max(spideyRadius*0.2, mousePosition.y));
            spideyPos.x = mousePosition.x;
            spideyPos.y = mousePosition.y;
            for(let i=0; i < legMods.length; i++) {
                if(legMods[i].anim === grabbing) {
                    legMods[i].x += curX - spideyPos.x;
                    legMods[i].y += curY - spideyPos.y;
                    }
                }
            drawCursor();
            drawSpidey(spideyPos.x, spideyPos.y);
        } 
        vctx.drawImage(canvas, 0, 0,
            w, h, 
            0, 0, 
            w, h)
            
        processInput();
        move();
        gravity();
    }

    //game 
    if (!startgame){
        //player movement
        processInput();
        move();
        
        processAI();

        //gravity + forces
        gravity();

        const w = viewport.width;
        const h = viewport.height;
        const overdrawX = background.width;
        const overdrawY = background.height; 
        const bgw = background.width / worldScale;
        const bgh = background.height / worldScale;

        const bgXoffset = Math.max(0, Math.min((spideyPos.x + (bgw*0.5) - bgw), worldSize.width - bgw));
        const bgYoffset = Math.max(0, Math.min((spideyPos.y + (bgh*0.5) - bgh), worldSize.height - bgh));
        bgctx.save();
        bgctx.translate(
            -bgXoffset,
            -bgYoffset 
            );
        //console.log(spideyPos, worldSize)
        drawObjects();
        bgctx.restore();
        //source, sourceXY, WH, destXY, dWH
        //context.drawImage(background, 0, 0, overdrawX * worldScale, overdrawY * worldScale, 0, 0, overdrawX, overdrawY)
        context.drawImage(background, 0, 0,
            // Math.max(0,Math.min(spideyPos.x - (w * 0.5), worldSize.width - w)),
            //  Math.max(0, Math.min((spideyPos.y) - (h * 0.5), worldSize.height - h)), 
            w * worldScale, h * worldScale, 0, 0,
            // Math.max(0,Math.min(spideyPos.x - (w * 0.5), worldSize.width - w)), 
            // Math.max(0, Math.min((spideyPos.y) - (h * 0.5), worldSize.height - h)), 
            w, h)

        context.save();
        context.translate(
            -bgXoffset,
            -bgYoffset
            );
            //context.scale(worldScale, worldScale);
            drawProjectiles();
            drawWebs();
            drawCursor();
            drawSpidey(spideyPos.x, spideyPos.y);
            drawEnemies();
        context.restore();

        vctx.drawImage(canvas, 0, 0,
            // Math.max(0,Math.min(spideyPos.x - (w * 0.5), worldSize.width - w)),
            // Math.max(0, Math.min((spideyPos.y) - (h * 0.5), worldSize.height - h)),
            overdrawX, overdrawY, 
            0, 0, 
            w, h)
        //vctx.drawImage(canvas,0,0,worldCanvas.width, canvas.height,0,0,worldCanvas.width, canvas.height)
        
        //fps counter
        const fps = Math.trunc(Math.round(framerate / deltaTime));
        vctx.font = "22px serif";
        if(fps < 50) {
            vctx.fillStyle = "#ff00ff";
        }else if(fps < 30){
            vctx.fillStyle = "#ff0000";
        }
        vctx.fillText(`fps: ${fps}`, 5, 20);

        //fly counter for lisa
        vctx.fillStyle = "#ffffff";
        vctx.fillText(`flies: ${fliesEaten}`, 5, 40);
        //spideyPos.x += 0.5;
        // const input1 = false;
        // const input2 = false;

        //context.restore();
        
    
        //Leg Hover 
        // let count = 0;
        // for (let i = 0; i < spideyLegs.length; i++) {
        //         if(legMods[i].anim === walking && count <= 1) {
        //             count++;
        //             //timestamp 
        //             legMods[i].start += (1000 / 60);
        //             //console.log(i, legMods[i].start, lastTimestamp)
        //         }
        //     }
    // }


    
    }
    


}

function processInput () {
    if(upPressed && !downPressed) {
        setSpeed(0, -0.75);
        
    }
    if(downPressed && !upPressed) {
        setSpeed(0, 0.75);
    }

    if(rightPressed && !leftPressed) {
        setSpeed(0.75, 0);
    }
    if(leftPressed && !rightPressed) {
        setSpeed(-0.75, 0);
    }


    if(!falling && !upPressed && !downPressed && !rightPressed && !leftPressed && !shiftPressed) {
        velocity = velocity.subtract(velocity);  
    }

    // dash towards cursor 
    // or else current move direction 
    // if enemy is close, bite it 
    // if web sac is close, eat it 
    if (dashPressed){
        dashPressed = false;
        // console.log("Dash!")
        if (lastTimestamp - dashCoolDown > 2000){
            dashCoolDown = lastTimestamp;
            if(!(falling && shiftPressed && layWeb)){
            const grav = falling? 2 : 0
                let speedx = speed.components[0] * 12;
                let speedy = (speed.components[1] - grav) * 12;
                if((LMBHeld || RMBHeld) && cursorPos.length() > spideyRadius*0.5) {
                    speedx = cursorPos.components[0];
                    speedy = cursorPos.components[1] - grav;
                }
                setSpeed(speedx, speedy);
            }
        }
    }
    //jumping:
    // hold jump to charge
    //  -> Charge max 0.5s
    //  -> anim state crouching
    // release
    //  -> push
    //  -> animate to spideyjump 
    //  -> anim state jumping

    //jump
    if(spacePressed) {
        if(curYPos === spideyPos.y){
            //console.log("SameY!")
            spacePressed = false;
            jumpCoolDown = lastTimestamp;
        } else {
            curYPos = spideyPos.y;
        }
        
        if (!spaceHeld && lastTimestamp - jumpCoolDown > 600) {
            
        for(let i=0; i < legMods.length; i++) {
            if(legMods[i].anim < grabWeb && legMods[i].anim !== jumping) {
                // const yval = (i) % 2 !== 0 ? -30 : -10;
                // const xval = -spideyLegs[i].x / ((i) % 2 !== 0 ? 3 : 4);
                if (legMods[i].anim === walking){
                    legMods[i].x = legMods[i].jx;
                    legMods[i].y = legMods[i].jy;
                }
                legMods[i].anim = jumping;
                legMods[i].start = lastTimestamp; 
                //}
                const xval = spideyJump[i].x - spideyLegs[i].x;
                const yval = spideyJump[i].y - spideyLegs[i].y;
                // legMods[i].x =  xval;
                // legMods[i].y = yval;
                legMods[i].dx = xval;
                legMods[i].dy = yval;
                if (!falling || (shiftPressed && layWeb)){
                    jumpSFX(i)
                }
                }
            }
            if (!falling || (shiftPressed && layWeb)){
                let speedx = speed.components[0] * 2 ;
                let speedy = (speed.components[1] - 20) * 3;
                // delta because speed is already * dT 
                // so modified components need normalization before setSpeed
                setSpeed(speedx / deltaTime, speedy / deltaTime);
            }
            if (falling && (shiftPressed && layWeb)){
                layWeb = false;
                //shiftPressed = false
            }
            //console.log(jumpCoolDown, lastTimestamp);


            jumpCoolDown = lastTimestamp;
        } else if(falling) {
            
                for(let i=0; i < legMods.length; i++) {
                    if(legMods[i].anim === none && legMods[i].start === 0) {
                
                    legMods[i].start = lastTimestamp; 
                    
                    const xval = spideyJump[i].x - spideyLegs[i].x;
                    const yval = spideyJump[i].y - spideyLegs[i].y;
                    
                    legMods[i].dx = xval;
                    legMods[i].dy = yval;
                    }
                }  

        
        }

        spaceHeld += 0.01 * deltaTime;
        // setSpeed(0, -2);
        
        } else if(!spacePressed && spaceHeld > 0){
            spaceHeld = 0;

        // const jump = new Vector(speedx, speedy);
        // speed = jump;
        } 
}

//setInterval(update, 1000/60);
//alternate...
function drawFrame () {
    //window.requestAnimationFrame(drawFrame, canvas);
    
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                
                return window.setTimeout(callback, 1000/60);
            })
    }

    update();

};
drawFrame();

//input handlers
var upPressed = false;
var downPressed = false;
var rightPressed = false;
var leftPressed = false;
var spacePressed = false;
var shiftPressed = false;
var dashPressed = false;
var dipPressed = false;
var scrollUp = false;
var scrollDown = false;
document.addEventListener("wheel", wheelHandler, false);
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
function wheelHandler(e) {
    e.deltaY < 0 ? scrollUp = true : scrollUp = false;
    e.deltaY > 0 ? scrollDown = true : scrollDown = false;
    //console.log(scrollDown, scrollUp)
};
    function keyDownHandler(e) {
    //shift-swing
    if (e.key === "Shift") {
        shiftPressed = true;
        e.preventDefault();
        
    }
    if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        rightPressed = true;
        e.preventDefault();
    }
    if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        leftPressed = true;
        e.preventDefault();
    }
    if (e.key === "Up" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        upPressed = true;
        e.preventDefault();
    }
    if (e.key === "Down" || e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        downPressed = true;
        e.preventDefault();
    }
    if (e.key === "j" || e.key === "J") {
        jactive = !jactive;
        e.preventDefault();
    }
    if (e.key === "e" || e.key === "E" || e.key === "Enter") {
        dashPressed = true;
    }
    
    if (e.key === " " || e.key === "_") {
        spacePressed = true;
        e.preventDefault();
    } else if (e.key === "v" || e.key === "q" || e.key === "-") {
        dipPressed = true;
    }
    
// console.log(
//     "UP:", upPressed,
//     "DWN:", downPressed,
//     "RT:", rightPressed,
//     "LFT:", leftPressed,
//     "SPC:", spacePressed,
//     "SHFT:", shiftPressed,
//     "DIP:", dipPressed
// )
}
    function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        leftPressed = false;
    }
    if (e.key === "Up" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        upPressed = false;
    } else if (e.key === "Down" || e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        downPressed = false;
    }
    if (e.key === " " || e.key === "_" || e.key === "e" || e.key === "E") {
        spacePressed = false;
    } else if (e.key === "v" || e.key === "q" || e.key === "-") {
        dipPressed = false;
    }
    //shift-swing
    if (e.key === "Shift") {
        shiftPressed = false;
    }
    
    if (e.key === " " || e.key === "_" || e.key === "e") {
        spacePressed = false;
    }
    
// console.log(
//     "UP:", upPressed,
//     "DWN:", downPressed,
//     "RT:", rightPressed,
//     "LFT:", leftPressed,
//     "SPC:", spacePressed,
//     "SHFT:", shiftPressed,
//     "DIP:", dipPressed
// )
}





//init spidey -- temp
//drawSpidey(spideyPos.x, spideyPos.y);











// animationframe !
// example 

// let start, previousTimeStamp;
// let done = false

// function step(timestamp) {
//     if (start === undefined) {
//         start = timestamp;
//         }
//     const elapsed = timestamp - start;

//     if (previousTimeStamp !== timestamp) {
//         // Math.min() is used here to make sure the element stops at exactly 200px
//         const count = Math.min(0.1 * elapsed, 200);
//         canvas.style.transform = `translateX(${count}px)`;
//         if (count === 200) done = true;
//     }

//     if (elapsed < 2000) { // Stop the animation after 2 seconds
//         previousTimeStamp = timestamp;
//         if (!done) {
//         window.requestAnimationFrame(step);
//         }
//     }
// }

//window.requestAnimationFrame(step);
