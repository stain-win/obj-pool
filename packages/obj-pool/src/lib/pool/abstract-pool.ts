export interface PoolableOptions<T> {
    reserve: number;
    recycle: (o: T) => T;
    create: () => T;
}

export const placeholder = Object.freeze(Object.create(null));

export class Poolable<T> {
    protected freeSlot: Array<T>;
    protected freeSlotsCount: number;
    protected poolSize = 0;
    protected recycle: (o: T) => T;
    public create: () => T;

    // Kept for compatibility with existing management functions, but can be refactored out.
    type: T | undefined;
    id = Symbol('id');

    private issueSlot(): T {
        const obj: T = this.freeSlot[--this.freeSlotsCount];
        this.freeSlot[this.freeSlotsCount] = placeholder as T;
        return obj;
    }

    constructor({create, recycle, reserve}: PoolableOptions<T>) {
        this.freeSlot = [];
        this.freeSlotsCount = 0;
        this.recycle = recycle;
        this.create = create;

        if (reserve > 0) {
            this.reserve(reserve);
        }
    }

    get capacity(): number {
        return this.freeSlot.length;
    }

    allocate(): T {
        if (this.freeSlotsCount > 0) {
            return this.issueSlot();
        } else {
            // Grow the pool by 10% or a minimum of 10.
            const grow = Math.max(10, Math.floor(this.poolSize * 0.1));
            this.reserve(grow);
            return this.issueSlot();
        }
    }

    release(object: T | T[]): void {
        const objects = Array.isArray(object) ? object : [object];
        for (const o of objects) {
            if (this.freeSlotsCount < this.poolSize) {
                this.freeSlot[this.freeSlotsCount++] = this.recycle(o);
            }
        }
    }

    reserve(count: number): void {
        if (count <= 0) return;

        this.poolSize += count;

        for (let i = 0; i < count; i++) {
            if (this.freeSlotsCount < this.poolSize) {
                this.freeSlot[this.freeSlotsCount++] = this.create();
            }
        }
    }

    destroy(): void {
        this.poolSize = 0;
        this.freeSlot = [];
        this.freeSlotsCount = 0;
    }
}
