export interface PoolableOptions<T> {
    reserve: number;
    recycle: (o: T) => T;
    create: () => T;
    maxSize?: number; // Optional max pool size to prevent unbounded growth
}

export class Poolable<T> {
    private freeSlot: T[];
    private recycle: (o: T) => T;
    private create: () => T;
    private maxSize: number;
    private totalAllocations = 0; // Track total allocations for metrics
    private totalReleases = 0; // Track total releases for metrics
    private currentlyInUse = 0; // Track objects currently allocated

    // Kept for compatibility with existing management functions
    type: T | undefined;
    id = Symbol('id');

    constructor({create, recycle, reserve, maxSize}: PoolableOptions<T>) {
        this.freeSlot = [];
        this.recycle = recycle;
        this.create = create;
        this.maxSize = maxSize || Infinity;

        if (reserve > 0) {
            // Respect max size even during initial reserve
            const actualReserve = Math.min(reserve, this.maxSize);
            this.reserve(actualReserve);
        }
    }

    /**
     * Gets the total capacity of the pool (all objects ever created)
     */
    get capacity(): number {
        return this.freeSlot.length + this.currentlyInUse;
    }

    /**
     * Gets the number of available objects in the pool
     */
    get available(): number {
        return this.freeSlot.length;
    }

    /**
     * Gets the number of currently allocated (in-use) objects
     */
    get inUse(): number {
        return this.currentlyInUse;
    }

    /**
     * Allocates an object from the pool. If the pool is empty, it will grow automatically.
     * @returns An object from the pool
     */
    allocate(): T {
        let obj: T;

        if (this.freeSlot.length > 0) {
            // Use pop() for O(1) performance instead of array indexing
            obj = this.freeSlot.pop()!;
        } else {
            // Smart growth strategy: grow based on current capacity
            const currentCapacity = this.capacity;
            let growAmount: number;

            if (currentCapacity < 10) {
                // For small pools, grow by a fixed amount to avoid tiny increments
                growAmount = 10;
            } else {
                // For larger pools, grow by 50%, capped at 100
                growAmount = Math.min(Math.ceil(currentCapacity * 0.5), 100);
            }

            this.reserve(growAmount);
            obj = this.freeSlot.pop()!;
        }

        this.totalAllocations++;
        this.currentlyInUse++;
        return obj;
    }

    /**
     * Returns an object or array of objects back to the pool.
     * Objects are recycled before being returned to the pool.
     * @param object The object(s) to return to the pool
     */
    release(object: T | T[]): void {
        const objects = Array.isArray(object) ? object : [object];

        for (const o of objects) {
            // Validation: Check if object is valid
            if (o === null || o === undefined) {
                console.warn('Attempted to release null/undefined object to pool');
                continue;
            }

            // Check if we're at max capacity
            if (this.freeSlot.length >= this.maxSize) {
                console.warn('Pool at maximum capacity, object will be discarded');
                this.currentlyInUse--;
                continue;
            }

            // Recycle and return to pool using push() for O(1) performance
            this.freeSlot.push(this.recycle(o));
            this.totalReleases++;
            this.currentlyInUse--;
        }
    }

    /**
     * Pre-allocates a specified number of objects in the pool.
     * @param count The number of objects to create and add to the pool
     */
    reserve(count: number): void {
        if (count <= 0) return;

        // Respect max size limit
        const currentSize = this.freeSlot.length;
        const actualCount = Math.min(count, this.maxSize - currentSize);

        if (actualCount <= 0) {
            if (count > 0) {
                console.warn(`Cannot reserve ${count} objects, pool at or near max size (${this.maxSize})`);
            }
            return;
        }

        // Create objects and add to pool
        for (let i = 0; i < actualCount; i++) {
            this.freeSlot.push(this.create());
        }
    }

    /**
     * Clears the pool and resets all counters.
     * Warning: This will not affect already allocated objects.
     */
    destroy(): void {
        this.freeSlot.length = 0;
        this.totalAllocations = 0;
        this.totalReleases = 0;
        this.currentlyInUse = 0;
    }

    /**
     * Shrinks the pool to the specified size by removing excess free objects.
     * Useful for memory management when peak usage has passed.
     * @param targetSize The desired number of free objects to keep
     */
    shrink(targetSize: number): void {
        if (targetSize < 0) {
            throw new Error('Target size must be non-negative');
        }

        if (this.freeSlot.length > targetSize) {
            this.freeSlot.length = targetSize;
        }
    }

    /**
     * Returns pool statistics for monitoring and debugging
     */
    getStats(): {
        available: number;
        inUse: number;
        capacity: number;
        maxSize: number;
        totalAllocations: number;
        totalReleases: number;
    } {
        return {
            available: this.available,
            inUse: this.inUse,
            capacity: this.capacity,
            maxSize: this.maxSize,
            totalAllocations: this.totalAllocations,
            totalReleases: this.totalReleases,
        };
    }
}
