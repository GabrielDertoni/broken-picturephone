class Segment extends Drawing {
    static isDrawing = false;
    static penX = 0;
    static penY = 0;

    static mouseDragged() {
        drawWithLine();
    }

    static mouseDown() {
        Segment.penX = mouseX;
        Segment.penY = mouseY;
    }

    static mouseUp() {
        if (selected_tool == "line-tool") {
            if (drawings[drawings.length-1] instanceof Segment && Segment.isDrawing) {
                const before = drawings[drawings.length-1].canvasPoints.length;
                drawings[drawings.length-1] = drawings[drawings.length-1].simplifyRDP(1.5);
                const after = drawings[drawings.length-1].canvasPoints.length;
                console.log(`Saved ${100 * (1 - after / before)}%`);
            }
            Segment.isDrawing = false;
        }
    }

    constructor(points, stroke_color, stroke_weight) {
        super(null, stroke_color, stroke_weight);
        if (points)
            points = points.map(el => [el[0] / width, el[1] / height]);

        this.data = points?.reduce((acc, el) => acc.concat(el), []) || [];
    }

    get allPoints() {
        return this.data.reduce((acc, el, idx, arr) => {
            if (idx % 2 === 0) acc.push([el, arr[idx + 1]]);
            return acc;
        }, []);
    }

    get canvasPoints() {
        return this.allPoints.map(([px, py]) => [px * width, py * height]);
    }

    get bbox() {
        let minX, minY, maxX, maxY;
        for (const p of this.canvasPoints) {
            if (!minX || minX > p[0]) minX = p[0];
            if (!minY || minY > p[1]) minY = p[1];
            if (!maxX || maxX < p[0]) maxX = p[0];
            if (!maxY || maxY < p[1]) maxY = p[1];
        }
        return new Box(minX - this.strokeWeight,
                       minY - this.strokeWeight,
                       maxX - minX + this.strokeWeight,
                       maxY - minY + this.strokeWeight);
    }
    
    addPoint(px, py) {
        this.data.push(px / width, py / height);
    }

    simplifyRDP(eps) {
        const points = this.canvasPoints;
        return new Segment(RDP(points, 0, points.length-1, eps),
                           this.stroke, this.strokeWeight);
    }

    getBoxes() {
        const points = this.canvasPoints;
        const boxes = [];
        for (let i = 0; i < points.length; i++)
            boxes.push([points[i][0], points[i][1],
                        points[i + 1][0] - points[i][0],
                        points[i + 1][1] - points[i][1]]);

        return boxes;
    }

    draw() {
        const points = this.canvasPoints;
        if (points.length < 2) return;

        stroke(this.stroke);
        strokeWeight(this.strokeWeight);
        noFill();

        if (points.length >= 2) {
            beginShape();
            const first = points[0];
            const second = points[1];
            const prevX = 2 * second[0] - first[0];
            const prevY = 2 * second[1] - first[1];
            curveVertex(prevX, prevY);
            for (let i = 0; i < points.length; i++)
                curveVertex(points[i][0], points[i][1]);

            const prev = points[points.length - 2];
            const last = points[points.length - 1];
            const predX = 2 * last[0] - prev[0];
            const predY = 2 * last[1] - prev[1];
            curveVertex(predX, predY);
            endShape();
        }
        /*
        for (let i = 0; i < points.length - 1; i++) {
            const [pointX, pointY] = points[i]
            const [nextX, nextY] = points[i + 1];
            let prevX, prevY;
            let predX, predY;
            if (i == 0) {
                prevX = pointX - (nextX - pointX);
                prevY = pointY - (nextY - pointY);
            } else
                [prevX, prevY] = points[i - 1];

            predX = nextX + (nextX - pointX);
            predY = nextY + (nextY - pointY);

            curve(prevX, prevY,
                  pointX, pointY,
                  nextX, nextY,
                  predX, predY);
        }
        */
    }
}

function drawWithLine() {
    const mouseTravelDistanceSq = sq(mouseX - pdrawnMouseX)
                                + sq(mouseY - pdrawnMouseY);

    const isWorthDrawing = pdrawnMouseX == undefined
                        || mouseTravelDistanceSq > sq(smallestSegment);

    if (isWorthDrawing) {
        console.log("draw");
        if (!Segment.isDrawing) {
            pdrawnMouseX = pmouseX;
            pdrawnMouseY = pmouseY;
        }

        if (useLine)
            line(mouseX, mouseY, pmouseX, pmouseY);
        else
            drawCurve(!Segment.isDrawing);

    }

    Segment.isDrawing = true;
}

function drawCurve(isNewCurve) {
    fill(fillColorPicker.value);
    stroke(strokeColorPicker.value);
    strokeWeight(strokeWeightSlider.value());

    Segment.penX += (mouseX - Segment.penX) * smoothingSlider.value();
    Segment.penY += (mouseY - Segment.penY) * smoothingSlider.value();

    const predX = Segment.penX + (Segment.penX - pmouseX) * updatePmouse;
    const predY = Segment.penY + (Segment.penY - pmouseY) * updatePmouse;
    curve(ppmouseX, ppmouseY,
          pdrawnMouseX, pdrawnMouseY,
          Segment.penX, Segment.penY,
          predX, predY);

    if (isNewCurve)
        drawings.push(
            new Segment([[Segment.penX, Segment.penY]],
                        strokeColorPicker.value,
                        strokeWeightSlider.value())
        );
    else if (drawings.length > 0 && drawings[drawings.length-1] instanceof Segment)
        drawings[drawings.length-1].addPoint(Segment.penX, Segment.penY);

    pdrawnMouseX = Segment.penX;
    pdrawnMouseY = Segment.penY;
}
