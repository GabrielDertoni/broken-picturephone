class Drawing {
    constructor(fill_color, stroke_color, stroke_weight) {
        this.fill_color = fill_color;
        this.stroke_color = stroke_color;
        this.stroke_weight = stroke_weight;
        this.data = [];
    }

    get fill() { return this.fill_color; }
    set fill(value) { this.fill_color = value; }
    get stroke() { return this.stroke_color; }
    set stroke(value) { this.stroke_color = value; }
    get strokeWeight() { return this.stroke_weight; }
    set strokeWeight(value) { this.stroke_weight = value; }

    push(value) {
        if (typeof value === "number")
            if (value >= 0 || value <= 1)
                this.data.push(value);
            else
                console.error("Value needs to be between 0 and 1.")
        else
            console.error("Can only push numbers as data.");
    }

    get dbData() {
        return JSON.stringify({
            fill_color: this.fill_color,
            stroke_color: this.stroke_color,
            stroke_weight: this.stroke_weight,
            data: this.data
        });
    }
    set dbData(value) {
        const obj = JSON.parse(value);
        this.fill_color = obj.fill_color;
        this.stroke_color = obj.stroke_color;
        this.stroke_weight = obj.stroke_weight;
        this.data = obj.data;
    }
}

function RDP(list, first, last, eps) {
    if (!eps) eps = 2.5;

    let kept = [];
    if (first == 0 && last == list.length - 1)
        kept.push(list[first]);

    let biggest_dist = 0, biggest_idx = -1;
    for (let i = first + 1; i < last; i++) {
        const dist = point_line_dist(list[i], list[first], list[last]);
        if (biggest_dist < dist) {
            biggest_dist = dist;
            biggest_idx = i;
        }
    }

    if (biggest_idx >= 0 && biggest_dist > eps) {
        kept = kept.concat(RDP(list, first, biggest_idx, eps));
        kept.push(list[biggest_idx]);
        kept = kept.concat(RDP(list, biggest_idx, last, eps));
    }

    if (first == 0 && last == list.length - 1)
        kept.push(list[last]);

    return kept;
}

function point_line_dist(point, line_start, line_end) {
    const segment_length = sqrt(sq(line_end[0] - line_start[0])
                              + sq(line_end[1] - line_start[1]));

    const cross = (point[0] - line_start[0]) * (line_end[1] - line_start[1])
                - (point[1] - line_start[1]) * (line_end[0] - line_start[0]);

    return abs(cross) / segment_length;
}
