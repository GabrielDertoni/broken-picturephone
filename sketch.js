
let debug = false;

let strokeColorPicker;
let fillColorPicker;
let strokeWeightSlider;
let smoothingSlider;

let pdrawnMouseX = undefined, pdrawnMouseY;
let ppmouseX, ppmouseY;
let penX, penY;
let updatePmouse = 2;
let isDrawing = false;

let drawings = [];
let lastSnap = 0;

const smallestSegment = 2;
let useLine = false;

function setup() {
    createCanvas(800, 600);
    background(255);

    fillColorPicker = document.getElementById("fill-color");
    strokeColorPicker = document.getElementById("stroke-color");
    strokeWeightSlider = createSlider(1, 20, 5);
    smoothingSlider = createSlider(0, 1, 0.3, 0.01);

    /*
    drawings.push(new Segment(
        [[100, 100], [150, 140], [200, 200], [300, 100]],
        strokeColorPicker.value,
        strokeWeightSlider.value()
    ));

    simple = drawings[0].simplifyRDP(50);
    */
}

function draw() {
    background(255);
    for (let i = lastSnap; i < drawings.length; i++) {
        drawings[i].draw();
    }

    if (frameCount % updatePmouse == 0) {
        ppmouseX = pmouseX;
        ppmouseY = pmouseY;
    }
}

function updateDrawing(index, updated) {
    if (!index) index = 0;
    if (!updated) updated = [];
    updated.push(index);
    if (!Ellipse.isDrawing && !Segment.isDrawing)
        console.log(`Updated ${index}`);
    
    drawings[index].bbox.fill(color(255));
    drawings[index].draw();
    for (let i = 1; i < drawings.length; i++)
        if (!updated.includes(i) && drawings[i].bbox.collidesWith(drawings[index].bbox))
            updated.concat(updateDrawing(i, updated));

    return updated;
}

function ctrlZ(e) {
    if (e.keyCode == 90 && e.ctrlKey) {
        drawings.pop();
        if (lastSnap >= drawings.length) {
            lastSnap = 0;
            for (let i = 0; i < drawings.length; i++)
                if (drawings[i] instanceof Bucket && drawings[i].snapshot)
                    lastSnap = i;
        }
    }
}

document.addEventListener("keydown", ctrlZ);

document.addEventListener("mousedown", event => {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        if (selected_tool == "line-tool") {
            Segment.mouseDown?.call(event);
            document.addEventListener("mousemove", Segment.mouseDragged);
        } else if (selected_tool == "ellipse-tool") {
            Ellipse.mouseDown?.call(event)
            document.addEventListener("mousemove", Ellipse.mouseDragged);
        } else if (selected_tool == "rect-tool") {
            Rect.mouseDown?.call(event)
            document.addEventListener("mousemove", Rect.mouseDragged);
        } else if (selected_tool == "bucket-tool") {
            Bucket.mouseDown?.call(event)
            document.addEventListener("mousemove", Bucket.mouseDragged);
        }
    }
});

document.addEventListener("mouseup", event => {
    if (selected_tool == "line-tool") {
        document.removeEventListener("mousemove", Segment.mouseDragged);
        Segment.mouseUp?.call(event);
    } else if (selected_tool == "ellipse-tool") {
        document.removeEventListener("mousemove", Ellipse.mouseDragged);
        Ellipse.mouseUp?.call(event);
    } else if (selected_tool == "rect-tool") {
        document.removeEventListener("mousemove", Rect.mouseDragged);
        Rect.mouseUp?.call(event);
    } else if (selected_tool == "bucket-tool") {
        document.removeEventListener("mousemove", Bucket.mouseDragged);
        Bucket.mouseUp?.call(event);
    }
});
