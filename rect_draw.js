class Rect extends Drawing {
    static isDrawing = false;
    static clickPoint = null;

    static mouseDown() {
        if (!Rect.isDrawing) {
            drawings.push(new Rect(mouseX, mouseY, 0, 0,
                                   fillColorPicker.value,
                                   strokeColorPicker.value,
                                   strokeWeightSlider.value()));
        }
        Rect.isDrawing = true;
        Rect.clickPoint = [mouseX, mouseY];
    }
    static mouseUp() { Rect.isDrawing = false; }
    static mouseDragged() {
        const last_drawing = drawings[drawings.length-1];
        if (Rect.isDrawing && last_drawing instanceof Rect) {
            last_drawing.width = abs(mouseX - Rect.clickPoint[0]);
            last_drawing.height = abs(mouseY - Rect.clickPoint[1]);

            if (mouseX < Rect.clickPoint[0])
                last_drawing.corner = [mouseX, last_drawing.corner[1]];

            if (mouseY < Rect.clickPoint[1])
                last_drawing.corner = [last_drawing.corner[0], mouseY];
        }
        last_drawing.draw();
    }

    constructor(px, py, width, height, fill_color, stroke_color, stroke_weight) {
        super(fill_color, stroke_color, stroke_weight || 1);
        this.data.push(px, py, width, height);
    }

    get corner() { return [this.data[0], this.data[1]]; }
    set corner(value) { this.data[0] = value[0]; this.data[1] = value[1]; }
    get position() { return this.corner; }
    set position(value) { this.corner = value; }
    get width() { return this.data[2]; }
    set width(value) { this.data[2] = value; }
    get height() { return this.data[3]; }
    set height(value) { this.data[3] = value; }
    get bbox() {
        return new Box(this.position[0], this.position[1],
                       this.width, this.height);
    }

    draw() {
        if (this.fill) fill(this.fill);
        else noFill();

        if (this.stroke) {
            stroke(this.stroke);
            strokeWeight(this.strokeWeight);
        } else noStroke();

        rect(this.corner[0], this.corner[1], this.width, this.height);
    }
}

