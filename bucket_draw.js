class Bucket extends Drawing {
    static clickPoint = null;
    static color = null;
    static queue = [];

    static mouseDown() {
        loadPixels();
        Bucket.color = getPixel(mouseX, mouseY);
        if (colorDistSq(colorToInt(Bucket.color), colorToInt(fillColorPicker.value)) > 400) {
            drawings.push(new Bucket(mouseX, mouseY, fillColorPicker.value));
            Bucket.clickPoint = [mouseX, mouseY];
            if (drawings[lastSnap] instanceof Bucket)
                drawings[lastSnap].snapshot = null;
            
            drawings[drawings.length - 1].draw();
            lastSnap = drawings.length - 1;
        }
    }

    constructor(px, py, fill_color) {
        super(fill_color, null, null);
        this.data.push(px / width, py / height);
        this.snapshot = null;
        this.minX = 0;
        this.minY = 0;
        this.maxX = width;
        this.maxY = height;
        this.setBoundaries = false;
    }

    get position() { return [this.data[0] * width, this.data[1] * height]; }
    set position(value) {
        this.data[0] = value[0] / width;
        this.data[1] = value[1] / height;
    }
    get minX() { return this.data[2] * width; }
    set minX(value) { this.data[2] = value / width; }
    get minY() { return this.data[3] * height; }
    set minY(value) { this.data[3] = value / height; }
    get maxX() { return this.data[4] * width; }
    set maxX(value) { this.data[4] = value / width; }
    get maxY() { return this.data[5] * height; }
    set maxY(value) { this.data[5] = value / height; }
    get width() { return this.maxX - this.minX; }
    get height() { return this.maxY - this.minY; }
    get bbox() {
        return new Box(this.minX, this.minY,
                       this.width, this.height);
    }

    draw() {
        const pos = this.position;
        // drawBucketBF(pos[0], pos[1], Bucket.color, this.fill);
        // const start = performance.now();
        if (!this.snapshot) {
            if (this.setBoundaries) {
                const result = drawBucketBF(pos[0], pos[1], Bucket.color, this.fill, false,
                                            this.minX, this.minY, this.maxX, this.maxY);
                this.snapshot = result.snap;
            } else {
                const result = drawBucketBF(pos[0], pos[1], Bucket.color, this.fill, true);
                this.snapshot = result.snap;
                this.minX = result.minX;
                this.minY = result.minY;
                this.maxX = result.maxX;
                this.maxY = result.maxY;
                this.setBoundaries = true;
            }
        }
        drawingContext.putImageData(this.snapshot, 0, 0);
    }

}

function colorDistSq(c1, c2) {
    let s = 0;
    for (let i = 0; i < 24; i += 8)
        s += sq((c1 >> i & 0xff) - (c2 >> i & 0xff));
    
    return s;
}

function hsvDistSq(c1, c2) {
    const r1 = c1 & 0xff,
          g1 = c1 >> 8 & 0xff,
          b1 = c1 >> 16 & 0xff;

    const r2 = c2 & 0xff,
          g2 = c2 >> 8 & 0xff,
          b2 = c2 >> 16 & 0xff;

    const V1 = Math.max(r1, g1, b1),
          C1 = V1 - Math.min(r1, g1, b1),
          S1 = V1 === 0 ? 0 : C1 / V1;

    const V2 = Math.max(r2, g2, b2),
          C2 = V2 - Math.min(r2, g2, b2),
          S2 = V2 === 0 ? 0 : C2 / V2;

    let H1, H2;
    if (C1 == 0) H1 = 0;
    else if (V1 == r1) H1 = 60 * (g1 - b1) / C1;
    else if (V1 == g1) H1 = 60 * (2 + (b1 - r1) / C1);
    else H1 = 60 * (4 + (r1 - g1) / C1);

    if (C2 == 0) H2 = 0;
    else if (V2 == r2) H2 = 60 * (g2 - b2) / C2;
    else if (V2 == g2) H2 = 60 * (2 + (b2 - r2) / C2);
    else H2 = 60 * (4 + (r2 - g2) / C2);
    const dh = Math.min(Math.abs(H2 - H1), 360 - Math.abs(H2 - H1)) / 180;
    const ds = Math.abs(S2 - S1);
    const dv = Math.abs(V2 - V1) / 255;
    return dh*dh + ds*ds + dv*dv;

}

function drawBucketScanLine(px, py, color, replaceColor) {
    const buff = new ArrayBuffer(width * height * 4);
    let data = new Uint32Array(buff);
    const buff8 = new Uint8ClampedArray(buff);
    const imageData = drawingContext.getImageData(0, 0, width, height);

    let icol = colorToInt(color);
    let irepcol = colorToInt(replaceColor);
    
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            data[y * width + x] |= imageData.data[4 * (y * width + x)];
            data[y * width + x] |= imageData.data[4 * (y * width + x) + 1] << 8;
            data[y * width + x] |= imageData.data[4 * (y * width + x) + 2] << 16;
            data[y * width + x] |= imageData.data[4 * (y * width + x) + 3] << 24;
        }
    
    const stack = [];
    let godown = true, goup = true;
    const eps = 50;
    stack.push([px, py]);
    while (stack.length > 0) {
        if (stack.length > maxSz) maxSz = stack.length;
        const [sx, y] = stack.shift();
        let spanAbove = false, spanBelow = false;
        for (let x = sx; x < width && colorDistSq(data[y * width + x], icol) < eps * eps; x++) {
            data[y * width + x] = irepcol;
            if (y > 0 && spanAbove !== (colorDistSq(data[(y-1) * width + x], icol) < eps * eps)) {
                if (!spanAbove) stack.push([x, y - 1]);
                spanAbove = !spanAbove;
            }
            if (y < height - 1 && spanBelow !== (colorDistSq(data[(y+1) * width + x], icol) < eps * eps)) {
                if (!spanBelow) stack.push([x, y + 1]);
                spanAbove = !spanAbove;
            }
        }
        
        for (let x = sx - 1; x >= 0 && colorDistSq(data[y * width + x], icol) < eps * eps; x--) {
            data[y * width + x] = irepcol;
            if (y > 0 && spanAbove !== (colorDistSq(data[(y-1) * width + x], icol) < eps * eps)) {
                if (!spanAbove) stack.push([x, y - 1]);
                spanAbove = !spanAbove;
            }
            if (y < height - 1 && spanBelow !== (colorDistSq(data[(y+1) * width + x], icol) < eps * eps)) {
                if (!spanBelow) stack.push([x, y + 1]);
                spanAbove = !spanAbove;
            }
        }
    }
    
    imageData.data.set(buff8);
    drawingContext.putImageData(imageData, 0, 0);
}

function drawBucketBF(px, py, color, replaceColor, find_boundary, minX, minY, maxX, maxY) {
    if (!minX) minX = 0;
    if (!minY) minY = 0;
    if (!maxX) maxX = width;
    if (!maxY) maxY = height;

    const buff = new ArrayBuffer(width * height * 4);
    let data = new Uint32Array(buff);
    const buff8 = new Uint8ClampedArray(buff);
    const imageData = drawingContext.getImageData(0, 0, width, height);

    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            data[y * width + x] |= imageData.data[4 * (y * width + x)];
            data[y * width + x] |= imageData.data[4 * (y * width + x) + 1] << 8;
            data[y * width + x] |= imageData.data[4 * (y * width + x) + 2] << 16;
            data[y * width + x] |= imageData.data[4 * (y * width + x) + 3] << 24;
        }

    let icol = colorToInt(color);
    let irepcol = colorToInt(replaceColor);

    console.log(colorDistSq(icol, irepcol), Math.min(colorDistSq(icol, irepcol) / 2, 90000));
    const eps = Math.max(0, colorDistSq(icol, irepcol) - 1000);
    const queue = [];
    data[py * width + px] = irepcol;
    queue.push([px, py]);
    let fminX = width, fminY = height, fmaxX = 0, fmaxY = 0;
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        if (find_boundary) {
            if (x < fminX) fminX = x;
            if (x > fmaxX) fmaxX = x;
            if (y < fminY) fminY = y;
            if (y > fmaxY) fmaxY = y;
        }

        if (x + 1 < maxX && colorDistSq(data[y * width + (x+1)], icol) <= eps) {
            data[y * width + (x+1)] = irepcol;
            queue.push([x + 1, y]);
        }

        if (x - 1 >= minX && colorDistSq(data[y * width + (x-1)], icol) <= eps) {
            data[y * width + (x-1)] = irepcol;
            queue.push([x - 1, y]);
        }

        if (y + 1 < maxY && colorDistSq(data[(y+1) * width + x], icol) <= eps) {
            data[(y+1) * width + x] = irepcol;
            queue.push([x, y + 1]);
        }

        if (y - 1 >= minY && colorDistSq(data[(y-1) * width + x], icol) <= eps) {
            data[(y-1) * width + x] = irepcol;
            queue.push([x, y - 1]);
        }
    }
    imageData.data.set(buff8);
    drawingContext.putImageData(imageData, 0, 0);
    return {
        snap: imageData,
        minX: fminX,
        minY: fminY,
        maxX: fmaxX + 1,
        maxY: fmaxY + 1
    };
}

function setNeighbours(x, y, arr) {
    arr[y * width + x] = 1;
    if (!arr[(y + 1) * width + x]) arr[(y + 1) * width + x] = 2;
    if (!arr[(y - 1) * width + x]) arr[(y - 1) * width + x] = 2;
    if (!arr[y * width + x + 1]) arr[y * width + x + 1] = 2;
    if (!arr[y * width + x - 1]) arr[y * width + x - 1] = 2;
    return arr;
}

function colorToInt(color) {
    return (red(color)
         + (green(color) << 8)
         + (blue(color) << 16)
         + (alpha(color) << 24)) >>> 0;
}

function drawBucketLoop(px, py, color, replaceColor) {
    buff = new ArrayBuffer(width * height * 4);
    let pix = new Uint32Array(width * height);
    myGlobal = new Uint32Array(buff);
    buff8 = new Uint8ClampedArray(buff);
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            pix[y * width + x] |= pixels[4 * (y * width + x)];
            pix[y * width + x] |= pixels[4 * (y * width + x + 1)] << 8;
            pix[y * width + x] |= pixels[4 * (y * width + x + 2)] << 16;
            pix[y * width + x] |= pixels[4 * (y * width + x + 2)] << 24;
        }

    let icol = colorToInt(color);
    let irepcol = colorToInt(replaceColor);
    console.log(icol, pix[0]);

    let arr = new Uint8Array(width * height);
    arr = setNeighbours(px, py, arr);
    const eps = 50;
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
            if (arr[y * width + x] == 2 && pix[y * width + x] === icol >>> 0) {
                // setPixel(x, y - 1, replaceColor);
                myGlobal[y * width + x] = irepcol;
                arr = setNeighbours(x, y, arr);
            }

    console.log("iterated 1");
    /*
    for (let y = height-1; y >= 0; y--)
        for (let x = width-1; x >= 0; x--)
            if (arr[y * width + x] == 2 && colorDist(getPixel(x, y), color) < eps) {
                setPixel(x, y - 1, replaceColor);
                arr = setNeighbours(x, y, arr);
            }
    */
}

function getPixel(x, y) {
    let r = 0, g = 0, b = 0, a = 0;
    // let d = pixelDensity();
    let d = 1;
    for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
            index = 4 * (y * width + x);
            r += pixels[index];
            g += pixels[index+1];
            b += pixels[index+2];
            a += pixels[index+3];
        }
    }
    r /= sq(d);
    g /= sq(d);
    b /= sq(d);
    a /= sq(d);
    return color(r, g, b, a);
}

function setPixel(x, y, color) {
    let d = pixelDensity();
    for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
            index = 4 * ((y * d + j) * width * d + (x * d + i));
            pixels[index] = red(color);
            pixels[index+1] = green(color);
            pixels[index+2] = blue(color);
            pixels[index+3] = alpha(color);
        }
    }
}

function colorDist(c1, c2) {
    return sqrt(sq(red(c1) - red(c2))
              + sq(green(c1) - green(c2))
              + sq(blue(c1) - blue(c2))
              + sq(alpha(c1) - alpha(c2)));
}

function colorEqual(c1, c2) {
    return red(c1)   === red(c2)
        && green(c1) === green(c2)
        && blue(c1)  === blue(c2)
        && alpha(c1) === alpha(c2)
}
