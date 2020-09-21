class Queue {
    constructor(size) {
        this.size = size || 100;
        this.list = new Array(this.size);
        this.start = 0;
        this.end = 0;
        this.nelem = 0;
    }

    get length() { return this.nelem; }

    isEmpty() { return this.nelem === 0; }
    isFull() { return this.nelem === this.size; }
    enqueue(elem) {
        if (!this.isFull()) {
            this.list[this.end] = elem;
            this.end = (this.end + 1) % this.size;
            this.nelem++;
            return true;
        }
        return false;
    }
    dequeue() {
        if (!this.isEmpty()) {
            this.nelem--;
            const elem = this.list[this.start];
            this.start = (this.start + 1) % this.size;
            return elem;
        }
        return null;
    }
    peek() {
        if (!this.isEmpty())
            return this.list[start];

        return null;
    }
}
