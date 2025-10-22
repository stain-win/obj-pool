import {Poolable} from './pool/abstract-pool';

const defaultPoolSize = 10;
const defaultRecycle = <T>(o: T): T => o;

// Type-safe pool map using unknown for values since we store pools of different types
const poolMap: Map<Function, Poolable<unknown>> = new Map();

interface PoolConstructor {
    ctor: Function;
}

// Define the stats type once to avoid repetition
export interface PoolStats {
    available: number;
    inUse: number;
    capacity: number;
    maxSize: number;
    totalAllocations: number;
    totalReleases: number;
}

/**
 * Builds a managed object pool for a given class constructor.
 * Pools created with this function are singletons based on the constructor.
 * Subsequent calls with the same constructor will return the same pool instance.
 * @param Type The class constructor for the objects in the pool.
 * @param reserve The initial number of objects to reserve in the pool.
 * @param recycle A function to reset an object's state when it is returned to the pool.
 * @param maxSize Optional maximum pool size to prevent unbounded growth.
 * @returns A Poolable instance.
 */
export function build<T>(
    Type: { new(): T },
    reserve?: number,
    recycle?: (o: T) => T,
    maxSize?: number
): Poolable<T> {
    const existingPool = poolMap.get(Type) as Poolable<T> | undefined;
    if (existingPool) {
        return existingPool;
    }

    const pool = new Poolable<T>({
        create: () => new Type(),
        recycle: recycle || defaultRecycle,
        reserve: reserve || defaultPoolSize,
        maxSize,
    });

    // Add the constructor to the instance for management functions
    (pool as Poolable<T> & PoolConstructor).ctor = Type;

    poolMap.set(Type, pool);
    return pool;
}

/**
 * Builds a standalone, unmanaged object pool using a factory function.
 * Each call to this function creates a new pool instance.
 * This pool will not be accessible via getPool() or releaseAllPools().
 * @param factoryFunction A function that returns a new object instance.
 * @param reservePool The initial number of objects to reserve in the pool.
 * @param recycleFn A function to reset an object's state when it is returned to the pool.
 * @param maxSize Optional maximum pool size to prevent unbounded growth.
 * @returns A new Poolable instance.
 */
export function buildFactory<T>(
    factoryFunction: () => T,
    reservePool?: number,
    recycleFn?: (o: T) => T,
    maxSize?: number
): Poolable<T> {
    return new Poolable<T>({
        create: factoryFunction,
        recycle: recycleFn || defaultRecycle,
        reserve: reservePool || defaultPoolSize,
        maxSize,
    });
}

/**
 * Retrieves a managed pool by its class constructor.
 * @param Type The class constructor of the pool to retrieve.
 * @returns The Poolable instance, or undefined if not found.
 */
export function getPool<T>(Type: { new(): T }): Poolable<T> | undefined {
    return poolMap.get(Type) as Poolable<T> | undefined;
}

/**
 * Destroys a managed pool and removes it from the pool map.
 * @param pool The pool to destroy.
 */
export function destroyPool<T>(pool: Poolable<T>): void {
    pool.destroy();
    const poolConstructor = (pool as Poolable<T> & PoolConstructor).ctor;
    if (poolConstructor && poolMap.has(poolConstructor)) {
        poolMap.delete(poolConstructor);
    }
}

/**
 * Destroys all managed pools and clears the pool map.
 */
export function releaseAllPools(): void {
    poolMap.forEach((pool) => {
        pool.destroy();
    });
    poolMap.clear();
}

/**
 * Manually registers a pool with the pool manager.
 * This can be used to make an unmanaged pool (e.g., from buildFactory) managed,
 * provided it has a 'ctor' property.
 * @param pool The pool to register.
 */
export function restorePool<T>(pool: Poolable<T>): void {
    const poolConstructor = (pool as Poolable<T> & PoolConstructor).ctor;
    if (poolConstructor && !poolMap.has(poolConstructor)) {
        poolMap.set(poolConstructor, pool);
    }
}

/**
 * Gets statistics for all managed pools.
 * Useful for monitoring and debugging pool usage across the application.
 * @returns An array of pool statistics with constructor names.
 */
export function getAllPoolStats(): Array<{
    name: string;
    stats: PoolStats;
}> {
    const allStats: Array<{ name: string; stats: PoolStats }> = [];

    poolMap.forEach((pool, constructor) => {
        allStats.push({
            name: constructor.name || 'Anonymous',
            stats: pool.getStats(),
        });
    });

    return allStats;
}
