class Ellipse extends Drawing {
    static isDrawing = false;
    static clickPoint = null;

    static mouseDown() {
        if (!Ellipse.isDrawing) {
            drawings.push(new Ellipse(mouseX, mouseY, 0, 0,
                                      fillColorPicker.value,
                                      strokeColorPicker.value,
                                      strokeWeightSlider.value()));
        }
        Ellipse.isDrawing = true;
        Ellipse.clickPoint = [mouseX, mouseY];
    }
    static mouseUp() { Ellipse.isDrawing = false; }
    static mouseDragged() {
        const last_drawing = drawings[drawings.length-1];
        if (Ellipse.isDrawing && last_drawing instanceof Ellipse) {
            last_drawing.width = abs(mouseX - Ellipse.clickPoint[0]);
            last_drawing.height = abs(mouseY - Ellipse.clickPoint[1]);

            if (mouseX < Ellipse.clickPoint[0])
                last_drawing.corner = [mouseX, last_drawing.corner[1]];

            if (mouseY < Ellipse.clickPoint[1])
                last_drawing.corner = [last_drawing.corner[0], mouseY];
        }
    }
    
    constructor(px, py, w, h, fill_color, stroke_color, stroke_weight) {
        super(fill_color, stroke_color, stroke_weight || 1);
        this.data.push(px / width, py / height, w / width, h / height);
    }

    get corner() { return [this.data[0] * width, this.data[1] * height]; }
    set corner(value) {
        this.data[0] = value[0] / width;
        this.data[1] = value[1] / height;
    }
    get position() { return this.corner; }
    set position(value) { this.corner = value; }
    get width() { return this.data[2] * width; }
    set width(value) { this.data[2] = value / width; }
    get height() { return this.data[3] * height; }
    set height(value) { this.data[3] = value / height; }
    get bbox() {
        return new Box(this.position[0], this.position[1],
                       this.width, this.height);
    }

    draw() {
        ellipseMode(CORNER);
        if (this.fill) fill(this.fill);
        else noFill();

        if (this.stroke) {
            stroke(this.stroke);
            strokeWeight(this.strokeWeight);
        } else noStroke();

        ellipse(this.corner[0], this.corner[1], this.width, this.height);
    }
}

