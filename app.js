//const e = require("express");

const canvas = document.getElementById("worldCanvas");
const viewport = document.getElementById("viewport");
// viewport.id = "viewport";
// viewport.width = window.innerWidth;
// viewport.height = window.innerHeight;

const background = document.getElementById('background');
background.width = 15360;
background.height = 2160;


const context = canvas.getContext("2d");
const vctx = viewport.getContext("2d");

const bgctx = background.getContext("2d");


//vctx.scale(2, 2)
// context.scale(2, 2)

const perfectFrameTime = 1000 / 60;
var deltaTime = 0;
var lastTimestamp = 0;

console.log(canvas.clientHeight, canvas.clientWidth)
console.log(window.innerHeight, window.innerWidth)

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
let cursorPos = new Vector(0, 0);

    function sqr(x) { return x * x }
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    //p = point, v = linestart, w = lineend
    function distToSegmentSquared(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return dist2(p, { x: v.x + t * (w.x - v.x),
                        y: v.y + t * (w.y - v.y) });
    }
    function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

    //return the point
    function closestSegmentPoint(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return { x: v.x + t * (w.x - v.x),
                y: v.y + t * (w.y - v.y) };
    }

let layWeb = false;
let webOrigin = {x: 0, y: 0}

function getNearestWalkLine(x, y){
    var nearest = 9999999;
    var line = -1;
    for(i=0; i<walkLines.length; i++){
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
function mousedown(e){
    if(mouseFocus) {
        const w = viewport.width;
        const h = viewport.height;
        mouseCursor.x = !LMBHeld && !RMBHeld ? 0 : mouseCursor.x// + Math.max(0,Math.min(spideyPos.x - (w * 0.5), canvas.width - w));
        mouseCursor.y = !LMBHeld && !RMBHeld ? 0 : mouseCursor.y// + Math.min(spideyPos.y - (h * 0.5), canvas.height - h);
        cursorPos = new Vector(mouseCursor.x, mouseCursor.y)
        cursorPos = cursorPos.scaleBy(Math.min(1,spideyRadius / cursorPos.length()))
        const moveX = mousedir.components[0] * spideyRadius;
        const moveY = mousedir.components[1] * spideyRadius;
        var dist = 999999;
        var closest = -1;
        for(i=0;i<spideyLegs.length;i++){
            const distTo = dist2({x: legMods[i].x + spideyLegs[i].x, y: legMods[i].y + spideyLegs[i].y}, {x: moveX, y: moveY})

            //anim ID is lt all attack anims
            if (legMods[i].anim < grabWeb) {
                closest = distTo < dist ? i : closest;
                dist = distTo < dist ? distTo : dist;
            }
        }

        if (closest > -1) {
            const mirror = closest < 4 ? closest + 4: closest - 4;

            if (e.button === 0){
            LMBHeld = lastTimestamp;
            if(legMods.every(x=>{return x.anim < grabWeb || x.anim > throwWeb})){
                legMods[closest].anim = grabWeb;
                legMods[closest].start = lastTimestamp;
                legMods[closest].dx = -spideyLegs[closest].x;
                legMods[closest].dy = -spideyLegs[closest].y;
                if (falling) {
                    legMods[mirror].anim = grabWeb;
                    legMods[mirror].start = lastTimestamp;
                    legMods[mirror].dx = -spideyLegs[mirror].x;
                    legMods[mirror].dy = -spideyLegs[mirror].y;
                }
            }
            

            } else if(e.button === 2 ){
            RMBHeld = lastTimestamp;
            if(legMods.every(x=>{return x.anim < readyStrike})){
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
        

    }
    
}
function mouseup(e){
    if (mouseFocus && e.button === 0){
        console.log(lastTimestamp - LMBHeld)
        LMBHeld = 0;
        layWeb? placeWeb() : startWeb();
    } else if (mouseFocus && e.button === 2) {
        console.log(lastTimestamp - RMBHeld);
        RMBHeld = 0;
        stopWeb();
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
                        webOrigin.x = tx;
                        webOrigin.y = ty;
                        layWeb = true;
                        walkArea = true;
                    }
            });
            if(!walkArea){
                const line = getNearestWalkLine(cursorPos.components[0], cursorPos.components[1]);
                if (line > -1) {
                    const start = closestSegmentPoint({x: cursorPos.components[0], y: cursorPos.components[1]}, 
                    {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
                    {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, );
                    webOrigin.x = spideyPos.x + start.x;
                    webOrigin.y = spideyPos.y + start.y;
                    layWeb = true;        
                };
            }
        
       
    
}

function stopWeb(){
    //console.log("stop");
    
    const tx = cursorPos.components[0] + spideyPos.x;
    const ty = cursorPos.components[1] + spideyPos.y;
    

    if(Math.hypot(cursorPos.components[0], cursorPos.components[1]) < spideyRadius/5) {
        layWeb = false;
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
    //console.log("end");
    let walkArea = false;
        //walkAreas
        areaCircles.forEach((x) => {
            const intersect = intersection({x: tx, 
                y: ty, r: 1}, x)
                //console.log(intersect)
                if (intersect.one_is_in_other){
                    walkArea = true;
                    layWeb = false;
                    webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {x: tx, y: ty}, solid: false, stuck: []})
                }
        });
        
        areaBoxes.forEach((x) => { 
            if(tx >= x.p1.x
                && tx <= x.p2.x
                 && ty <= x.p1.y
                  && ty >= x.p2.y){
                    walkArea = true;
                    layWeb = false;
                    webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {x: doubleClamp(tx, x.p1.x, x.p2.x),
                        y: doubleClamp(ty, x.p2.y, x.p1.y)}, solid: false, stuck: []})
                }
        });
    if(!walkArea){
        const line = getNearestWalkLine(cursorPos.components[0], cursorPos.components[1]);
        if (line > -1) {
            const start = closestSegmentPoint({x: cursorPos.components[0], y: cursorPos.components[1]}, 
            {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
            {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, );
            place = {x: spideyPos.x + start.x, y: spideyPos.y + start.y};
            layWeb = false;
            webArray.push({p1: {x: webOrigin.x, y: webOrigin.y}, p2: {...place}, solid: false, stuck: []})
            //console.log(boundaryColliders, walkLines)

        //console.log(boundaryColliders.length, deltaTime)
        };
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
    mouseCursor.x += e.movementX;
    mouseCursor.y += e.movementY;
    mouseCursor.lastMove = lastTimestamp;
    mousedir = new Vector(e.movementX, e.movementY)
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
    this.beginPath();
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

//sene objects
const scnObj = [];
//obj types
const ground = 0;
const rockMed = 1;
const stopSign = 2;
const cactus = 3;


//boundaries
const buffer = 3;
const topLeft = {x: 0 + buffer, y: 0 + buffer};
const topRight = {x: canvas.width - buffer, y: 0 + buffer};
const bottomRight = {x: canvas.width - buffer, y: canvas.height - buffer};
const bottomLeft = {x: 0 + buffer, y: canvas.height - buffer};
const boundaryCorners = [topLeft, topRight, bottomRight, bottomLeft];
const barrierColliders = [];
const boundaryColliders = [];
const webArray = [];

const boundaryCircles = [];
const areaCircles = [];
const areaBoxes = [];


function addBoundaries() {

    
    boundaryColliders.push({p1: bottomRight, p2: bottomLeft, solid: true});
    //console.log('start')
    // for (i=0; i<boundaryCorners.length; i++) {
    //     const p1 = boundaryCorners[i];
    //     const p2 = boundaryCorners[(i + 1) % 4];
    //     boundaryColliders.push({p1, p2, solid: true});
    // }
    //centre lines
    //boundaryColliders.push({p1: {x: canvas.width / 2, y: 0}, p2: {x: canvas.width / 2, y: canvas.height}})
    //boundaryColliders.push({p1: {x: 0, y: canvas.height / 2}, p2: {x: canvas.width, y: canvas.height / 2}})

// ground
const id = areaBoxes.length;
scnObj.push({id: id, type: ground, length: 9999*Math.random()});
areaBoxes.push({p1: {x: 0, y: canvas.height}, p2: {x: canvas.width, y: canvas.height - 60}});
boundaryColliders.push({p1: {x: 0, y: canvas.height-60},p2: {x: canvas.width, y: canvas.height - 60}, solid: false});


//fill da screen by width
// 15360px
// every ~300 px or so
for(i=200;i<15360;i+=300){
    const type = Math.random();
    const scale = 0.25 + Math.random();
    const ground = canvas.height - 50;
    const height = ground - canvas.height * Math.random() + 15;
    //console.log(type)
    if (type < 0.25){
            
        enemies.push({type: 0, x: i, y: height, start: 1000 *  Math.random(), dx: i, dy: height, active: true, anim: flying});
        } else if (type < 0.5) {
            i+=80 * scale;
            drawRockMed(i, ground + 30 * Math.random(), -scale, true);
            //drawRockMed(i, ground, scale);
        } else if (type < 0.65) {
            drawRockMed(i, ground, scale);
        } else if (type < 0.95) {
            i+=40;
            drawCactus(i, ground + 20 * Math.random(), 1);
            i+=40;
        } else {
            drawStopSign(i, ground, 1.2);
        }
    }

    // boundaryCircles.push({x: 300, y: 600, r: 120, half: false, solid: false});
    // areaCircles.push({x: 300, y: 600, r: 120});

    //drawStopSign(450, canvas.height - 3, 1.2);
// boundaryCircles.push({x: 550, y: 637, r: 80, half: false, solid: false});
//boundaryCircles.push({x: 50, y: 100, r: 20, half: false, solid: true});
}

addBoundaries(); 

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function paintGround(id, length){
    
    // Create gradient
    var sky = bgctx.createLinearGradient(0, 0, 0, canvas.height);
    //dusk-y FFC9D6 FFF3E5
    // sky.addColorStop(0, "#FFC9D6");
    // sky.addColorStop(0.5, "#FFF3E5");
    sky.addColorStop(0, "#0252FF");
    sky.addColorStop(0.5, "#93CBFF");

    // Fill with gradient
    bgctx.fillStyle = sky;
    bgctx.fillRect(0, 0, canvas.width, canvas.height);

    const random = mulberry32(id + length)();
    //background
    const box = areaBoxes[id]
    var bkgrd = bgctx.createLinearGradient(0, box.p2.y * 0.95, 0, canvas.height);
    // bkgrd.addColorStop(0.1, 'rgba(221, 135, 107, 0.5)'); //221 185 157 //#DDB99D
    // bkgrd.addColorStop(0.5, 'rgba(226, 208, 140, 1)'); //#E2D08C //
    bkgrd.addColorStop(0.1, 'rgba(221, 200, 107, 0.5)'); 
    bkgrd.addColorStop(0.5, 'rgba(226, 208, 140, 1)'); 
    bgctx.fillStyle = bkgrd;
    bgctx.fillRect(box.p1.x, box.p2.y * 0.95, box.p2.x, box.p1.y); 
    bgctx.beginPath();
    bgctx.moveTo(box.p1.x, box.p2.y)
    bgctx.bezierCurveTo(canvas.width * random, box.p2.y - (150 * random), canvas.width* 2 * random, canvas.height - (150 * random), canvas.width, canvas.height)
    bgctx.fill();
    
    
    
    //bgctx.fillStyle = "#FFE57F";
    //grd
    var hill = bgctx.createLinearGradient(0, box.p2.y * 0.95, 0, canvas.height)
    hill.addColorStop(0, "#FFF3C9");
    hill.addColorStop(1, "#FFE57F");
    bgctx.fillStyle = hill;
    bgctx.fillRect(box.p1.x, box.p2.y, box.p2.x, box.p1.y);
    bgctx.beginPath();
    bgctx.moveTo(box.p1.x, box.p2.y)
    bgctx.bezierCurveTo(canvas.width * random, box.p2.y - (80*random), canvas.width * random, canvas.height - (80 * random), canvas.width, canvas.height)
    bgctx.fill();
    
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
   
    areaBoxes.push({p1: {x: leftSide + width/2, y: y}, p2: {x: rightSide, y: top + height/4}})
 

}

//id is the array ID from 1st boundary + number of boundaries in obj
function paintRockMed(id, len){
    bgctx.fillStyle = "#C0C0C0";
    bgctx.strokeStyle = "#707070";
    bgctx.lineWidth = 3;

    bgctx.beginPath();
    bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
    bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
    for(i = id+1; i < id + len; i++){
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
    for(i = id+3; i < id + len; i++){
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
        const height = (350 + 200 * abs * random1) * abs;
        const width = (40 + 30 * abs * random2) * abs;
        const widthAbs = (40 + 30 * abs * random2) * abs;
        const top = y - height;
        const leftSide = x - width;
        const rightSide = x + width;
        const armlength = (70 + 50 * abs * random3) * abs;
        const arm1 = armlength + (armlength * abs * random4);
        const arm2 = armlength + (armlength * 2 * abs * random1);
        const solid = false;
        
        const id = boundaryColliders.length;
        const circID = boundaryCircles.length;
        scnObj.push({id: id, length: 12, circID: circID, circLen: 3, type: cactus});
        
        areaBoxes.push({p1: {x: leftSide + offset, y: y}, p2: {x: rightSide - offset, y: top + (widthAbs * 0.5)}})

        //line starts at bottom left and traces up and around
        
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
        bgctx.lineWidth = 3;

        let width = boundaryCircles[cid].r;
        let top = boundaryCircles[cid].y - width;
        let middle = boundaryCircles[cid].x;
        let bottom = boundaryColliders[id].p1.y;
    
        for(i = cid; i < cid + clen; i++){
            const obj = boundaryCircles[i];
            bgctx.fillCircle(obj.x, obj.y, obj.r)
            
        }
        
        bgctx.beginPath();
        bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
        bgctx.lineTo(boundaryColliders[id].p2.x, boundaryColliders[id].p2.y);
        for(i = id+1; i < id + len; i++){
            const obj = boundaryColliders[i]
            bgctx.lineTo(obj.p1.x, obj.p1.y);
            bgctx.lineTo(obj.p2.x, obj.p2.y);
        }
        bgctx.fill();
        
        //outline
        bgctx.beginPath();
        //bgctx.moveTo(boundaryColliders[id].p1.x, boundaryColliders[id].p1.y);
        for(i = id; i < id + len; i++){
            const obj = boundaryColliders[i]
                bgctx.moveTo(obj.p1.x, obj.p1.y);
                bgctx.lineTo(obj.p2.x, obj.p2.y);
            }
        //bgctx.setLineDash([15, 10, 5, 10]);
        bgctx.stroke()
        for(i = cid; i < cid + clen; i++){
            const obj = boundaryCircles[i];
            
            bgctx.strokeHalfCircle(obj.x, obj.y, obj.r)
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
        bgctx.quadraticCurveTo(middle + width, top - width, middle + width*0.5, bottom)
        bgctx.stroke();
        bgctx.beginPath();
        bgctx.moveTo(middle, top)
        bgctx.quadraticCurveTo(middle - width, top - width, middle - width*0.5, bottom)
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

//lets make a spidey boi
var spideyPos = {x: 60, y: canvas.height - 60};
//'natural' leg values for anchor + neutral position
var spideyLegs = [
    //Left leggies
    {x: -30, y: 24},
    {x: -35, y: 22},
    {x: -33, y: 18},
    {x: -27, y: 15},
    //Right leggies
    {x: 30, y: 24},
    {x: 35, y: 22},
    {x: 33, y: 18},
    {x: 27, y: 15}
]


//large spread/reaching up legs for jumpin anim
var spideyJump = [
    //Left leggies
    {x: -16, y: 15},
    {x: -24, y: 5},
    {x: -30, y: -15},
    {x: -16, y: -22},
    //Right leggies
    {x: 16, y: 15},
    {x: 24, y: 5},
    {x: 30, y: -15},
    {x: 16, y: -22}
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
    {x: -7, y: -2},
    {x: -7, y: -1},
    {x: -7, y: 1},
    {x: -7, y: 2},
    //Right leggies
    {x: 7, y: -2},
    {x: 7, y: -1},
    {x: 7, y: 1},
    {x: 7, y: 2},
]


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
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},

    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},

    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},

    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},
    {p1: {x: 0, y: 0}, p2: {x: 0, y: 0}, valid: false},

]


//function spideyMove
//move individual legs

//order legs by farthest 
//if farthest leg is outside spideyradius animate 2x 1y
//if nearest is inside r/2 animate it 1x 2y
function spideyMove(leg) {
    
    //x and y offset in relation to spidey
    if (legMods[leg].anim === grabbing) {
        const pos = {};
        pos.x = 0;
        pos.y = 0;
        const x = (spideyLegs[leg].x + legMods[leg].x);
        const y = (spideyLegs[leg].y + legMods[leg].y);
        const speedx = speed.components[0];
        const speedy = speed.components[1];
        
         const dist = Math.sqrt(x * x + y * y);
        if (dist > spideyRadius) {
            // pos.x *= 1 / spideyLegs[leg].x;
            // pos.y *= 1 / spideyLegs[leg].y;
            // if (upPressed) {
            //     pos.y = -(spideyRadius);
            // } else if (downPressed) {
            //     pos.y = (spideyRadius / 4);
            // }
            // if (rightPressed) {
            //     pos.x = (spideyRadius / 4);
            // } else if (leftPressed) {
            //     pos.x = -(spideyRadius / 4);
            // }
            //send to animation 
            //if isAnimating bool true skip checks
            //play anims
            //simple as 
            legMods[leg].anim = walking;
            legMods[leg].start = lastTimestamp;
            legMods[leg].dx = pos.x;
            legMods[leg].dy = pos.y;
        } else if(dist < (spideyRadius / 3)) {
            //console.log(leg, "-", dist)
            // pos.x *= 1 / spideyLegs[leg].x;
            // pos.y *= 1 / spideyLegs[leg].y;
            // if (upPressed) {
            //     pos.y = -(spideyRadius);
            // } else if (downPressed) {
            //     pos.y = (spideyRadius / 4);
            // }
            // if (rightPressed) {
            //     pos.x = (spideyRadius / 4);
            // } else if (leftPressed && speedx < 1) {
            //     pos.x = -(spideyRadius / 4);
            // }
            //send to animation 
            //if isAnimating bool true skip checks
            //play anims
            //simple as 
            legMods[leg].anim = walking;
            legMods[leg].start = lastTimestamp;
            legMods[leg].dx = pos.x;
            legMods[leg].dy = pos.y;
            //console.log(pos);
        } else if (Math.abs(speed.components[0]) > Math.abs(speed.components[1]) && Math.sign(x) !== Math.sign(spideyLegs[leg].x)) {
            //if the leg crosses spidey's x axis reset it
            legMods[leg].anim = walking;
            legMods[leg].start = lastTimestamp;
            legMods[leg].dx = 0;
            legMods[leg].dy = 0;
        } else if (Math.abs(speed.components[1]) > Math.abs(speed.components[0]) && Math.abs(y) <= 1) {
            //if the leg crosses spidey's y axis reset it
            legMods[leg].anim = walking;
            legMods[leg].start = lastTimestamp;
            //if mod is less than 
            legMods[leg].dy = y < 0 ? (spideyRadius - spideyLegs[leg].y)/4 : spideyRadius/4; 
            legMods[leg].dx = 0;
        }
        
        const dlen = Math.hypot(legMods[leg].dx + spideyLegs[leg].x, legMods[leg].dy + spideyLegs[leg].y)
        if(dlen > spideyRadius){
            //console.log(dlen)
            legMods[leg].dx -= (copySign(2 + dlen - spideyRadius, legMods[leg].dx));
            legMods[leg].dy -= (copySign(2 + dlen - spideyRadius, legMods[leg].dy));
            //console.log("new",Math.hypot(legMods[leg].dx + spideyLegs[leg].x, legMods[leg].dy + spideyLegs[leg].y))
        }
    }

    //adjust y pos of all legs 
    //if y difference is +- Radius/2 = scale y +- 1.0
    //y anchor set by dy * -2.5 ... 0 ... 2.5
    //mods Y value + legY value (y dist from spidey) / (spideyRadius / 2)
    //
    
        //enforce destination to valid grab point
        //always runs for now
        //old: only run if leg is newly walking
        //freeLeg = false;
        //const line = getNearestWalkLine()
        
        var walkArea = false;
        //walkAreas
        areaCircles.forEach((x) => {
            const intersect = intersection({x: legMods[leg].dx + spideyLegs[leg].x + spideyPos.x, 
                y: legMods[leg].dy + spideyLegs[leg].y + spideyPos.y, r: 1}, x)
                //console.log(intersect)
                if (intersect.one_is_in_other || intersect.intersect_occurs){
                    walkArea = true;
                }
        });
        const legPosX = legMods[leg].dx + spideyLegs[leg].x + spideyPos.x;
        const legPosY = legMods[leg].dy + spideyLegs[leg].y + spideyPos.y;
        areaBoxes.forEach((x) => {
            if(legPosX >= x.p1.x - 1
                && legPosX <= x.p2.x + 1
                 && legPosY <= x.p1.y + 1
                  && legPosY >= x.p2.y - 1){
                    walkArea = true;
                }
        });

        var nearest = 9999999;
        var line = -1;
        if(!walkArea){
            for(i=0; i<walkLines.length; i++){
                if (walkLines[i].valid) {
                const dist = distToSegmentSquared({x: legMods[leg].dx + spideyLegs[leg].x, 
                    y: legMods[leg].dy + spideyLegs[leg].y},
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
        if(walkArea && (legMods[leg].anim === none || legMods[leg].anim === jumping) && !spacePressed) {
            legMods[leg].anim = grabbing;
            legMods[leg].start = 0;
        }
        if((line >= 0) && legMods[leg].anim !== grabbing) {
            //console.log("LEG:", leg, "GRAB:", grab, `LINE: ${line}`, walkLines[line])
            //context.fillCircle(grab.x + spideyPos.x, grab.y + spideyPos.y, 2);
            if (legMods[leg].anim === walking) {
            const grab = closestSegmentPoint({x: legMods[leg].dx + spideyLegs[leg].x, 
            y: legMods[leg].dy + spideyLegs[leg].y}, 
            {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
            {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, 
            )
            legMods[leg].dx = grab.x - spideyLegs[leg].x;
            legMods[leg].dy = grab.y - spideyLegs[leg].y;
            }

            if((legMods[leg].anim === none || legMods[leg].anim === jumping) && !spacePressed) {
                const land = distToSegmentSquared({x: legMods[leg].x + spideyLegs[leg].x, 
                    y: legMods[leg].y + spideyLegs[leg].y}, 
                    {x: walkLines[line].p1.x, y: walkLines[line].p1.y}, 
                    {x: walkLines[line].p2.x, y: walkLines[line].p2.y}, 
                    )
                    //console.log(land, grab)
                    if(land < 10) {
                        //legMods[leg].x = legMods[leg].dx;
                        //legMods[leg].y = legMods[leg].dy;
                        // legMods[leg].dx = land.x - spideyLegs[leg].x;
                        // legMods[leg].dy = land.y - spideyLegs[leg].y;
                        legMods[leg].anim = grabbing;
                        //console.log("landed on web")
                    }
            }
            //context.fillCircle(legMods[leg].dx + spideyPos.x, legMods[leg].dy + spideyPos.y, 3);
    } else if (line === -1 && !walkArea && legMods[leg].anim !== none && legMods[leg].anim !== swinging && legMods[leg].anim < grabWeb){
        //set falling
        //console.log(legMods[leg].anim, "fell off a web")
        if (legMods[leg].anim !== jumping){
            legMods[leg].anim = none;
        }
        
        // legMods[leg].x = 0;
        // legMods[leg].y = -15;
        legMods[leg].dx = 0;
        legMods[leg].dy = -15;
    }
    
}



//spideymove simply updates the positions stored in spideyPos and spideyLegs 
//the center moves in a limited radius with opposite offsets in all legs
//when a leg is too close to or far from move dir the leg moves in reaction 
//think of spidey body as "pushing" and "pulling" the legs 
// only one leg L and R should be affected per cycle 
// lifting legs...difficult maybe - if u reverse dir it should return to ground eg
// movement and collision are the same system...


//debug infos

let jactive = false;

//42 is the answer
const spideyRadius = 50;

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

function smoothstep(x) {
    return x = (x * x * (3-2 * x))
}
function degs_to_rads (degs) { return degs / (180/Math.PI); }
function rads_to_degs (rads) { return rads * (180/Math.PI); }

//lets draw a fly
//   (()
//    O
//
function drawFly(x, y, start) {
    const flyR = 5

    const sec1 = (Math.abs(lastTimestamp - start))%200/100; //(start + lastTimestamp%200)/100;  
    const sec = sec1 > 1? 2 - sec1 : sec1;
    const step = sec * sec * (3-2 * sec);

    const sec2 = (lastTimestamp%1000)/500; 
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


    //body
    context.fillStyle = "#442211"
    context.fillCircle(x, y, flyR/1.1);
    //wings
    context.strokeStyle = "#000000";
    context.lineWidth = 0.5;
    context.beginPath();
    context.moveTo(x,y);
    //anchorx, anchory, destx, desty
    context.bezierCurveTo(pLX1, pY1, pLX2, pY2, x - flyR/2, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x,y);
    //anchorx, anchory, destx, desty
    context.bezierCurveTo(pRX1, pY1, pRX2, pY2, x + flyR/2, y);
    context.stroke();

    //lil leggies
    context.strokeStyle = "#442211"
    for(i=0;i<6;i++){
        context.beginPath();
            context.moveTo(x, y);
        if(i%2===0){
            context.quadraticCurveTo(x + flyR + i, y, x + flyR/4 + i, y + flyR*1.5 - i);
        } else {
            context.quadraticCurveTo(x - flyR - i, y, x - flyR/4 - i, y + flyR*1.5 - i);
        }
        context.stroke();
    }
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

function drawSpidey(x, y) {

    console.log()
    //drawFly(311 + lastTimestamp/100, 311 - lastTimestamp/500, 50);
    spideyCollider();
    
    //leg dir
    //"rotation" values are derived from avg. foot placement dist from middle (-50...0...50)

    yrotation = 20;
    xrotation = 0.1;
    //prevent 0 values
    let sumx = -0.01;
    let sumy = -0.01;
    for(e=0; e < spideyLegs.length; e++) {
        if(!falling){
            sumy += legMods[e].jy + spideyLegs[e].y;
            sumx += legMods[e].jx + spideyLegs[e].x;
            yrotation = doubleClamp(sumy / 8, -spideyRadius, spideyRadius);
            xrotation = doubleClamp(sumx / 8, -spideyRadius, spideyRadius);
        }
    }
//console.log(xrotation, yrotation)
    let box = 0;
    let boy = 0;
    if (rightPressed) box = -4;
    if (leftPressed) box = 4;
    if (upPressed) boy = 4;
    if (downPressed) boy = -4;
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

        const difx = ex - ox;
        const dify = ey - oy;
        // const normx = 1 / difx;
        // const normy = 1 / dify;
        const elapsed = lastTimestamp - legMods[i].start;
        //animations 
        // this was very poorly set up


        if (legMods[i].anim === jumping || legMods[i].anim === none || legMods[i].anim === swinging ) {
            
        
            const sec = Math.min(elapsed/200*deltaTime, 1);  
            const step = sec * sec * (3-2 * sec);

            ox += (difx * step);
            oy += (dify * step);
            //current position in anim frame
            legMods[i].jx = ox;
            legMods[i].jy = oy;
            
            //console.log(origin, dest)
            if (Math.trunc(Math.round(ox * 100)) === Math.trunc(Math.round(ex * 100)) 
            && Math.trunc(Math.round(oy*100)) === Math.trunc(Math.round(ey*100))) {
                //console.log("stopping:", ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].start = 0;
                legMods[i].anim = none;
                //freeLeg = true;
            }
        }
        if (legMods[i].anim === walking) {

            //using timestamped animation method
            //normalize origin - dest : 0 - 100%
            //elapsed = timestamp - start
            //

            
//     if (previousTimeStamp !== timestamp) {
//         // Math.min() is used here to make sure the element stops at exactly 200px
//         const count = Math.min(0.1 * elapsed, 200);
//         canvas.style.transform = `translateX(${count}px)`;
//         if (count === 200) done = true;


            const sec = Math.min(elapsed/250*deltaTime, 1);  
            //console.log(speed.length())

            //sec = 0.1second interval
            //dif x and y are moved % 0->100 over .1 second 
            //this could be changed to a dynamic animation system l8r

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

            if (Math.trunc(Math.round(ox * 100)) === Math.trunc(Math.round(ex * 100)) 
            && Math.trunc(Math.round(oy*100)) === Math.trunc(Math.round(ey*100))) {
                //console.log("stopping:", ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].anim = grabbing;
                legMods[i].start = 0;
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
                    const intersect = intersection({x: spideyPos.x + spideyLegs[i].x + legMods[i].x, 
                        y: spideyPos.y + spideyLegs[i].y + legMods[i].y, r: spideyRadius/5}, {x: x.x, y: x.y, r: spideyRadius/4})
                        if(intersect.intersect_count > 0) {
                            console.log(intersect)
                            x.active = false;
                            //enemyHit = true;
                        };
                })
            }
            

            if (Math.trunc(Math.round(ox * 100)) === Math.trunc(Math.round(ex * 100)) 
            && Math.trunc(Math.round(oy*100)) === Math.trunc(Math.round(ey*100))) {
                //console.log("stopping:", i, legMods[i].anim, ox, ex, oy, ey, sec);
                legMods[i].x = legMods[i].dx;
                legMods[i].y = legMods[i].dy;
                legMods[i].start = lastTimestamp;
                if(legMods[i].anim === readyWeb) {
                    if(LMBHeld){
                        legMods[i].anim = readyWeb;    
                        legMods[i].dx = cursorPos.components[0]/2 - spideyLegs[i].x/2;
                        // legMods[i].dx += falling ? spideyLegs[i].x * 0.5 : 0;
                        legMods[i].dy = cursorPos.components[1]/2 - spideyLegs[i].y;
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
                        legMods[i].dx = cursorPos.components[0] - spideyLegs[i].x*0.9;
                        legMods[i].dy = cursorPos.components[1] - spideyLegs[i].y;
                    }
                } else {
                    legMods[i].anim = falling ? none : walking;   
                    legMods[i].dx = 0;
                    legMods[i].dy = 0;
                }
                //freeLeg = true;
                //console.log(lastTimestamp, i, legMods[i])
            }
        }
            
        if (legMods[i].anim === grabWeb) {
            
            const sec = Math.min(elapsed/100*deltaTime, 1);  
            const step = sec * sec * (3-2 * sec);

            ox += (difx * step);
            oy += (dify * step);
            //current position in anim frame
            legMods[i].jx = ox;
            legMods[i].jy = oy;
            
            if (Math.trunc(Math.round(ox * 100)) === Math.trunc(Math.round(ex * 100)) 
            && Math.trunc(Math.round(oy*100)) === Math.trunc(Math.round(ey*100))) {
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
        context.beginPath();
        const startx = x + legOrigX;
        const starty = y + legOrigY;
        context.moveTo(startx, starty);

        //console.log((rotation / Math.abs(rotation)))
        const xanchor = x + dx + (copySign(dx, legOrigX) * (1 - Math.abs(yrotation  / (spideyRadius / 2))) / 2)
        const yanchor = y - dy * (yrotation / Math.abs(yrotation))
            * Math.min(1, Math.abs(yrotation / (spideyRadius / 3)))
            + (((dy) * (legOrigins[i].y/2)) 
            * (1 - Math.abs(yrotation / (spideyRadius))))
             
        //anchor x, anchor y, dest x, dest y
        context.quadraticCurveTo(
            //x anchor
            xanchor, 

            //y anchor !
            // 
            yanchor, 

            // y                               //spideyPos y/init y
            // - ((dy * 2.5)                   //inverted leg pos Y * multiplier
            // * (rotation / (spideyRadius * 2))   //* -1 ... 0 ... 1  based on leg average
            // + ((dy * legOrigins[i].y / 2) * (1 - Math.abs(rotation / spideyRadius)))), 
            //destination
            //spidey pos + (dest + offset), spidey pos + (dest + offset + step)
           // Math.min(
                //canvas.width - 5,
                Math.max(5,
                    x + (dx + ox)//)
                ), 
                
            //Math.min(
                //canvas.height - 3, 
                Math.max(5, y + (dy + oy + ay)//)
                )
            );
         //draw leg then foot
            context.lineWidth = 1;
            context.stroke();
            context.strokeCircle(
            // Math.min(
            //     canvas.width - 5,
                Math.max(5,
                    x + (dx + ox)//)
                ), 
            // Math.min(
            //     canvas.height - 3, 
                Math.max(5, y + (dy + oy + ay)//)
                ),
            // foot size
            1.5);
        //console.log(Math.min(canvas.width - 20, x + (dx + ox)), Math.min(canvas.height - 20, y + (dy + oy + ay)))
        
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
    if (upPressed) eo = -2;
    if (downPressed) eo = 2;
    if (rightPressed) po = 2;
    if (leftPressed) po = -2;
    if(RMBHeld || LMBHeld){
        po = cursorPos.components[0] / spideyRadius * 2
        eo = cursorPos.components[1] / spideyRadius * 2
    }
    context.fillStyle = "#ffffff";
    context.fillCircle(x - (4 + (2 * xrotation/spideyRadius)), y - (2 + (-2 * xrotation/spideyRadius)), 4);
    context.fillCircle(x + (4 - (2 * xrotation/spideyRadius)), y - (2 + (2 * xrotation/spideyRadius)), 4);
    //pupils
    context.fillStyle = "#000000";
    context.fillCircle(x - (4 - po + (2 * xrotation/spideyRadius)), y - (2 - eo + (-2 * xrotation/spideyRadius)), 1.5);
    context.fillCircle(x + (4 + po - (2 * xrotation/spideyRadius)), y - (2 - eo + (2 * xrotation/spideyRadius)), 1.5);
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
        var dist;
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
        var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
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

    //friction
    setSpeed(-speed.components[0]/3,-speed.components[1]/3);

    var count = 0;
    for(i=0; i < spideyLegs.length; i++) {
        if(legMods[i].anim === none || legMods[i].anim === jumping || legMods[i].anim === swinging || legMods[i].anim >= grabWeb) {
            count++
        } 
    }
    const gravity = count < 7 ? 0 : count * 0.25;
    let wasFalling = falling;
    falling = gravity > 0 ? true: false;
    
    if (falling && count < 8 && layWeb === false) {
        velocity = velocity.scaleBy(0.90);
        for(i=0; i < spideyLegs.length; i++) {
            const footPosX = legMods[i].x + spideyLegs[i].x + spideyPos.x;
            const footPosY = legMods[i].y + spideyLegs[i].y + spideyPos.y; 
            if(legMods[i].anim === grabbing) {
                webOrigin.x = footPosX
                webOrigin.y = footPosY;

                //skip legs under spidey
                if(footPosY > spideyPos.y) {
                    count++
                    for(j=0; j < spideyLegs.length; j++) {
                        if(j===i || legMods[j].anim >= grabWeb){} else {
                            //console.log("Grab under spidey");
                            legMods[j].anim = walking;
                            legMods[j].start = lastTimestamp;
                            legMods[j].dx = 0;
                            legMods[j].dy = 0;
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
            console.log(position.subtract(swingPoint).length())
            for(j=0; j < spideyLegs.length; j++) {
                const scale =  (position.subtract(swingPoint).length() + (spideyJump[j].y/2)) / position.subtract(swingPoint).length();
                let rope = position.subtract(swingPoint).scaleBy(scale).add(swingPoint)
                
                    if(legMods[j].anim !== swinging && legMods[j].anim < grabWeb){
                        legMods[j].anim = swinging;
                        legMods[j].start = lastTimestamp;
                        legMods[j].dx = rope.components[0] - spideyPos.x - spideyLegs[j].x;
                        legMods[j].dy = rope.components[1] - spideyPos.y - spideyLegs[j].y;
                    }
            }
        }
        //context.fillCircle(swingPoint.components[0], swingPoint.components[1], 5)
        if ((testPos.subtract(swingPoint).length()) > swingPoint.subtract(position).length())
        {
            let swingLength = swingPoint.subtract(position).length()
            let newPos = testPos.subtract(swingPoint).normalize().scaleBy(swingLength).add(swingPoint);
            // newPos = newPos.normalize()
            // newPos = newPos.scaleBy(swingLength)
            // newPos = swingPoint.add(newPos)
            //context.fillCircle(testPos.components[0], testPos.components[1], 5)
            //context.fillCircle(newPos.components[0], newPos.components[1], 10)
            //setSpeed((rope.components[0]) * 1.2, (-gravity + rope.components[1]) * 1.2)
            velocity = newPos.subtract(position).scaleBy(1.01);
            //console.log(newPos.subtract(position).normalize());
        }
    }

    for(i=0; i < spideyLegs.length; i++) {
            //if falling stops make others reach for nearest lines again
            if(!falling && wasFalling && (legMods[i].anim === none || legMods[i].anim === jumping || legMods[i].anim === swinging)){
                //console.log("WasFalling");
                legMods[i].anim = walking;
                legMods[i].start = lastTimestamp;
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
    
    for (j=0; j < walkLines.length; j++){
        walkLines[j].valid = false;
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
    var moveCounter = 0;
    //circle
    boundaryCircles.forEach((x) => {
        const circRadius = x.r;
        const circPos = {x: x.x, y: x.y};
        if(jactive){
            if (x.solid){
                context.lineWidth = 3;
                context.strokeStyle = "#444444"
            } else {
                context.lineWidth = 1;
                context.strokeStyle = "#555555"
            }
            if(x.half){
                context.strokeHalfCircle(circPos.x, circPos.y, circRadius);
            } else {
                context.strokeCircle(circPos.x, circPos.y, circRadius);
            }
        }
        
        const circDist = Math.sqrt(dist2({x: testPos.components[0], y: testPos.components[1]}, circPos));
        const circDiff = {x: spideyPos.x - circPos.x, y: spideyPos.y - circPos.y};
        circDepth =  (circRadius - circDist + (spideyRadius)) / spideyRadius - 0.1;
        
        if(circDist < spideyRadius + circRadius) {
            if(circDist < spideyRadius / 4 + circRadius) {
                
                //if falling grab hold
                if(falling && !spacePressed){
                    for(i=0; i < spideyLegs.length; i++) {
                        //console.log("grab")
                        if(legMods[i].anim < grabWeb){
                            legMods[i].anim = walking;
                            legMods[i].start = lastTimestamp;
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
                        for (i=0; i < spideyLegs.length; i++) {
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
            spideyPos.x >= canvas.width - (radius) - buffer)
        {
            //console.log("X");
            setSpeed(-speed.components[0], 0);
            spideyPos.x = doubleClamp(spideyPos.x, (radius) + buffer, canvas.width - (radius) - buffer);
            
        }
        if ((radius) + buffer >= spideyPos.y ||
            spideyPos.y >= canvas.height - (radius) - buffer
            )
        {
            //console.log("Y") 
            setSpeed(0, -speed.components[1]);
            spideyPos.y = doubleClamp(spideyPos.y, (radius) + buffer, canvas.height - (radius) - buffer);

        }

        //lines 
        boundaryColliders.forEach((x) => {
        if(jactive){
            if (x.solid){
            context.lineWidth = 3.0;
            context.strokeStyle = "#444444";
            } else {
                context.lineWidth = 1;
                context.strokeStyle = "#aaaaaa";
            }
            context.beginPath();
            context.moveTo(x.p1.x, x.p1.y);
            context.lineTo(x.p2.x, x.p2.y);
            context.stroke();
        }
        
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
                    if(falling && !spacePressed){
                        for(i=0; i < spideyLegs.length; i++) {
                            //console.log("grab");
                        if(legMods[i].anim < grabWeb){
                            legMods[i].anim = walking;
                            //init bug? 
                            legMods[i].start = lastTimestamp > 0? lastTimestamp : 0;
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
                            var closest;
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
                            for (i=0; i < spideyLegs.length; i++) {
                                if(legMods[i].anim === grabbing){
                                    legMods[i].y -= ypush;
                                    legMods[i].dy -= ypush;
                                }
                                
                            }
                        }
                        if (Math.abs(dx) > EPSILON && Math.abs(dx) > Math.abs(dy)) {
                            spideyPos.x += xpush;
                            //setSpeed(-speed.components[0], 0);
                            for (i=0; i < spideyLegs.length; i++) {
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

    webArray.forEach((x) => {
        
        context.lineWidth = 1.5;
        context.strokeStyle = "#ffffff";
        if (jactive) context.strokeStyle = "#dddddd";
        context.beginPath();
        context.moveTo(x.p1.x, x.p1.y);
        context.lineTo(x.p2.x, x.p2.y);
        context.stroke();
        
        context.lineWidth = 1;
            // const animate = (lastTimestamp%300)/150; 
            // const lineWave = animate > 1? 2 - animate : animate;
            // context.quadraticCurveTo(
            //     x.p1.x + ((x.p2.x - x.p1.x) /2), (x.p1.y + ((x.p2.y - x.p1.y) / 2) + ( lineWave * 20)),
            //     x.p2.x, x.p2.y
            // );
        
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
                            var closest;
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
    

    context.lineWidth = 1.5; 
    context.strokeStyle = "#ffffff"; 
    let holdWeb = -1;  
    for(i=0; i<spideyLegs.length; i++){
        if(legMods[i].anim === readyWeb || legMods[i].anim === throwWeb){
            holdWeb = i
            context.beginPath();
            context.moveTo(spideyPos.x, spideyPos.y);
            context.lineTo(spideyPos.x + spideyLegs[i].x + legMods[i].jx, spideyPos.y + spideyLegs[i].y + legMods[i].jy);
            context.stroke();
        }
    }
    if(layWeb) {
        context.lineWidth = 1.5;
        context.strokeStyle = "#ffffff";
        if (jactive) context.strokeStyle = "#dddddd";
        context.beginPath();
        context.moveTo(webOrigin.x, webOrigin.y);
        holdWeb > -1 ? context.lineTo(spideyPos.x + spideyLegs[holdWeb].x + legMods[holdWeb].jx, spideyPos.y + spideyLegs[holdWeb].y + legMods[holdWeb].jy) : context.lineTo(spideyPos.x, spideyPos.y);
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
    acceleration = acceleration.add(new Vector((x / perfectFrameTime)*deltaTime, (y / perfectFrameTime)*deltaTime))
    velocity = velocity.add(acceleration);
    speed = velocity;
    // console.log(acceleration.components, velocity.components)
    // console.log(speed.components[0], speed.components[1]);
    acceleration = acceleration.subtract(acceleration);
    //return xmov, ymov;
    
}

function move() {

    xmov = speed.components[0];
    ymov = speed.components[1];

    // if (!isNaN(deltaTime)) {
    // //console.log(xmov, ymov);
    xmov *= deltaTime;
    ymov *= deltaTime;
    // }
    //move spidey pos
    spideyPos.x += xmov;
    spideyPos.y += ymov;

    //enforce pos 
    //spideyPos.x = Math.min(canvas.width - radius + buffer,Math.max(radius - buffer, spideyPos.x))
    //spideyPos.y = Math.min(canvas.height - radius + buffer,Math.max(radius - buffer, spideyPos.y))

    
    for (let i=0; i < legMods.length; i++) {
        if (legMods[i].anim !== grabbing) {
            legMods[i].x += xmov;
            legMods[i].dx += xmov;
            legMods[i].y += ymov;
            legMods[i].dy += ymov;
        }
        
        // if (0 + (radius) + buffer <= spideyPos.x &&
        //     spideyPos.x <= canvas.width - (radius) - buffer)
        // {
            //console.log("X")
            legMods[i].x -= (xmov);
            legMods[i].dx -= (xmov);
        // }
        // if (0 + (radius) + buffer <= spideyPos.y &&
        //     spideyPos.y <= canvas.height - (radius) - buffer
        //     )
        // {
            //console.log("y")
            legMods[i].y -= (ymov);
            legMods[i].dy -= (ymov);
        // }
        
    }
}


//.type, .x, .y, .anim, .start, .dx, dy
function drawEnemies(){
    enemies.forEach((x) => {
        if(x.type === 0 && x.active){
            //animate
            drawFly(x.x, x.y, x.start);
        }        
    })
}

//.type, .x, .y, .anim, .start, .dx, dy
function drawObjects(){
    if(!jactive) {
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
            
        }        
    })
    }
}

function processAI(){
    enemies.forEach((x) => {
        if(x.active) {
            const targetx = x.x - x.dx;
            const targety = x.y - x.dy;
            let hitLine = -1;
            if(x.type === 0){
                webArray.forEach((y, i) => {
                    if (doesLineInterceptCircle(y.p1, y.p2, x, 3)) {
                        hitLine = i;
                    //     const distx = y.p2.x - y.p1.x;
                    //     const disty = y.p2.y - y.p1.y;
                    //     const percent = Math.hypot(distx, disty);
                    //     console.log(percent)
                        webArray[i].stuck.push(x.x, x.y) 
                        x.anim = stuck;

                    };
                })
                if(hitLine > -1) {
                    //console.log(hitLine)
                } else if(Math.abs(targetx) < 1 && Math.abs(targety) < 1){
                    x.dx += 2000 * Math.random() - 1000;
                    x.dy += 2000 * Math.random() - 1000;
                    //enforce valid
                    x.dx = Math.min(canvas.width - 15, Math.max(15, x.dx));
                    x.dy = Math.min(canvas.height - 15, Math.max(15, x.dy));
                    //console.log(x.dx, x.dy);
                } else {
                    x.x -= copySign(0.5, targetx);
                    x.y -= copySign(0.5, targety);
                }
            } 
        }
            
    })
}

drawObjects();


var spaceHeld = 0;
var jumpCoolDown = 0;
var curYPos = 0;
//main game draw
function update(timestamp) {
    requestAnimationFrame(update);
    deltaTime = (timestamp - lastTimestamp) / perfectFrameTime;
    deltaTime = isNaN(deltaTime) ? 1 : deltaTime;
    //console.log(deltaTime);
    lastTimestamp = timestamp;
    
    //reset frame
    //context.clearRect(0, 0, canvas.clientWidth, canvas.height);
    vctx.clearRect(0, 0, viewport.clientWidth, viewport.height);


    context.drawImage(background, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)

    //player movement
    move();
    

    //gravity + forces
    gravity();


    drawCursor();
    drawSpidey(spideyPos.x, spideyPos.y);


    drawEnemies();

    const w = viewport.width/2;
    const h = viewport.height/2;
    //source, sourceXY, WH, destXY, dWH
    vctx.drawImage(canvas, 
        Math.max(0,Math.min(spideyPos.x - (w * 0.5), canvas.width - w)), Math.min(spideyPos.y - (h * 0.5), canvas.height - h), w, h, 
        0, 0, viewport.clientWidth, viewport.clientHeight)

    processAI();

    //fps counter
    const fps = Math.trunc(Math.round(60 * deltaTime));
    vctx.font = "22px serif";
    if(fps < 50) {
        vctx.fillStyle = "#ff00ff";
    }else if(fps < 30){
        vctx.fillStyle = "#ff0000";
    }
    vctx.fillText(`${fps}`, 5, 20)

    //spideyPos.x += 0.5;
    // const input1 = false;
    // const input2 = false;

    if(upPressed && !downPressed && !legMods.every(x => {return x.anim !== grabbing && x.anim !== walking})) {
        setSpeed(0, -1.5);
        
    }
    if(downPressed && !upPressed && !legMods.every(x => {return x.anim === swinging})) {
        setSpeed(0, 1.5);
        // spideyPos.y += (1 * deltaTime);
        // for (let i=0; i < legMods.length; i++) {
        //     legMods[i].y -= (1 * deltaTime);
        //     legMods[i].dy -= (1 * deltaTime);
        // }
    }

    if(rightPressed && !leftPressed) {
        setSpeed(1.5, 0);
        // spideyPos.x += (1 * deltaTime);
        // for (let i=0; i < legMods.length; i++) {
        //     legMods[i].x -= (1 * deltaTime);
        //     legMods[i].dx -= (1 * deltaTime);
        // }
    }
    if(leftPressed && !rightPressed) {
        setSpeed(-1.5, 0);
        // spideyPos.x -= (1 * deltaTime);
        // for (let i=0; i < legMods.length; i++) {
        //     legMods[i].x += (1 * deltaTime);
        //     legMods[i].dx += (1 * deltaTime);
        // }
    }

    
    if(!falling && !upPressed && !downPressed && !rightPressed && !leftPressed && !shiftPressed) {
        velocity = velocity.subtract(velocity);
        

    let count = 0;
    for (let i = 0; i < spideyLegs.length; i++) {
            if(legMods[i].anim === walking && count <= 1) {
                count++;
                //timestamp 
                legMods[i].start += (1000 / 60) * deltaTime;
                //console.log(i, legMods[i].start, lastTimestamp)
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
        
        if (!falling && spaceHeld === 0 && lastTimestamp - jumpCoolDown > 600) {
            
        for(i=0; i < legMods.length; i++) {
            if(legMods[i].anim < grabWeb) {
                legMods[i].anim = none;
                legMods[i].start = lastTimestamp; 
                // const yval = (i) % 2 !== 0 ? -30 : -10;
                // const xval = -spideyLegs[i].x / ((i) % 2 !== 0 ? 3 : 4);
                
                //}
                const xval = spideyJump[i].x - spideyLegs[i].x;
                const yval = spideyJump[i].y - spideyLegs[i].y;
                // legMods[i].x =  xval;
                // legMods[i].y = yval;
                legMods[i].dx = xval;
                legMods[i].dy = yval;
                }
            }
            var speedx = speed.components[0] * 2;
            var speedy = (speed.components[1] - 10) * 3;
            console.log(jumpCoolDown, lastTimestamp);

            setSpeed(speedx, speedy)

            jumpCoolDown = lastTimestamp;
        } else if(falling) {
            
                for(i=0; i < legMods.length; i++) {
                    if(legMods[i].anim === none && legMods[i].start === 0) {
                
                    legMods[i].start = lastTimestamp; 
                    
                    const xval = spideyJump[i].x - spideyLegs[i].x;
                    const yval = spideyJump[i].y - spideyLegs[i].y;
                    
                    legMods[i].dx = xval;
                    legMods[i].dy = yval;
                    }
                }  

        
            }

        spaceHeld += 0.01;
        // setSpeed(0, -2);
        
        } else if(!spacePressed && spaceHeld > 0){
            spaceHeld = 0;

        // const jump = new Vector(speedx, speedy);
        // speed = jump;
        } else if(dipPressed) {
        //
        
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
    
    if (e.key === " " || e.key === "_" || e.key === "e") {
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
