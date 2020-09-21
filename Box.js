class Box {
    constructor(x, y, w, h) {
        this.x = x;
        this.y= y;
        this.width = w;
        this.height = h;
    }

    collidesWith(other) {
        return other.x + other.width > this.x && other.x < this.x + this.width
            && other.y + other.height > this.y && other.y < this.y + this.height;
    }

    draw() {
        noFill();
        stroke(255, 0, 0);
        strokeWeight(2);
        rect(this.x, this.y, this.width, this.height);
    }

    fill(color) {
        noStroke();
        fill(color);
        rect(this.x, this.y, this.width, this.height);
    }
}
