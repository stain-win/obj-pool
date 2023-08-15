export interface PoolableOptions<T> {
    reserve: number;
    recycle:(o: T) => T;
}

export abstract class Poolable<T> {
    protected freeSlot: Array<T>;
    protected freeSlotsCount: number;
    protected poolSize: number;
    protected recycle: (o: T) => T;

    protected constructor ({recycle, reserve}: PoolableOptions<T>) {
        this.freeSlot = [];
        this.freeSlotsCount = 0;
        this.poolSize = reserve || 0;
        this.recycle = recycle;
    }

    protected get capacity(): number {
        return this.freeSlot.length;
    }

    protected set capacity(cap: number) {
        this.freeSlot.length = cap;
    }

    allocate(): T {
        if (this.freeSlotsCount > 0) {
            return this.freeSlot[--this.freeSlotsCount];
        }
        return this.create();
    }

    allocateArray (lengthOrArray: number | T[]): T[] {
        let array: T[];
        let length: number;

        if (Array.isArray(lengthOrArray)) {
            array = lengthOrArray;
            length = lengthOrArray.length;
        } else {
            length = lengthOrArray;
            array = new Array(length);
        }

        let filled = 0;

        // Allocate as many objects from the existing pool
        if (this.freeSlotsCount > 0) {
            const pool = this.freeSlot;
            const poolFilled = Math.min(this.freeSlotsCount, length);
            let poolSize = this.freeSlotsCount;

            for (let i = 0; i < poolFilled; i++) {
                array[filled] = pool[poolSize - 1];
                ++filled;
                --poolSize;
            }

            this.freeSlotsCount = poolSize;
        }

        // Construct the rest of the allocation
        while (filled < length) {
            array[filled] = this.create();
            ++filled;
        }

        return array;
    }

    release(object: T): void {
        this.freeSlot[this.freeSlotsCount] = this.recycle(object);
        ++this.freeSlotsCount;
    }

    releaseArray(array: T[]): void {
        if (this.freeSlotsCount + array.length > this.capacity) {
            // Ensure we have enough capacity to insert the release objects
            this.capacity = Math.max(this.freeSlotsCount + array.length);
        }

        // Place objects into pool list
        for (let i = 0, j = array.length; i < j; i++) {
            this.freeSlot[this.freeSlotsCount] = array[i];
            ++this.freeSlotsCount;
        }
    }

    reserve(count: number): void
    {
        this.poolSize = count;

        if (this.freeSlotsCount < count)
        {
            const diff = count - this.freeSlotsCount;

            for (let i = 0; i < diff; i++)
            {
                this.freeSlot[this.freeSlotsCount] = this.create();
                ++this.freeSlotsCount;
            }
        }
    }

    abstract create(): T;
}
