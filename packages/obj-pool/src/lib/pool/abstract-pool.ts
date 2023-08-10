export interface PoolableOptions<T> {
    reserve: number;
    recycle:(o: T) => T;
}

export const placeholder = Object.freeze(Object.create(null));
export abstract class Poolable<T> {
    protected freeSlot: Array<T>;
    protected freeSlotsCount: number;
    protected poolSize = 0;
    protected recycle: (o: T) => T;
    type: T | undefined;
    id = Symbol('id');

    private issueSlot (): T {
        const obj: T = this.freeSlot[--this.freeSlotsCount];
        this.freeSlot[this.freeSlotsCount] = placeholder as T;
        return obj;
    }

    protected constructor ({recycle, reserve}: PoolableOptions<T>) {
        this.freeSlot = [];
        this.freeSlotsCount = 0;
        this.recycle = recycle;
        if(reserve > 0) {
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
            //grow the pool by 10%
            const grow = (this.poolSize * 0.1) <= 10 ? 10 : (this.poolSize * 0.1);
            this.reserve(grow << 0 == grow ? grow : grow + 1);
            return this.issueSlot();
        }
    }

    release(object: T | T[]): void {
        if (Array.isArray(object)) {
            object.forEach((o) => {
                this.freeSlot[++this.freeSlotsCount] = this.recycle(o);
            });
            return;
        }
        this.freeSlot[this.freeSlotsCount] = this.recycle(object);
        ++this.freeSlotsCount;
    }

    reserve(count: number): void {
        this.poolSize += count << 0;

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

    destroy(): void {
        // send it to the garbage collector
        this.poolSize = 0;
        this.freeSlot = [];
        this.freeSlotsCount = 0;
    }

    abstract create(): T;
}
