import {Poolable} from './pool/abstract-pool';

const defaultPoolSize = 10;
const defaultRecycle = <T>(o: T): T => o;
const poolMap: Map<any, Poolable<any>> = new Map();

/**
 * Builds a managed object pool for a given class constructor.
 * Pools created with this function are singletons based on the constructor.
 * Subsequent calls with the same constructor will return the same pool instance.
 * @param Type The class constructor for the objects in the pool.
 * @param reserve The initial number of objects to reserve in the pool.
 * @param recycle A function to reset an object's state when it is returned to the pool.
 * @returns A Poolable instance.
 */
export function build<T>(Type: { new(): T }, reserve?: number, recycle?: (o: T) => T): Poolable<T> {
    let pool: Poolable<T> | undefined = poolMap.get(Type);
    if (pool) {
        return pool;
    }

    pool = new Poolable<T>({
        create: () => new Type(),
        recycle: recycle || defaultRecycle,
        reserve: reserve || defaultPoolSize,
    });

    // Add the constructor to the instance for management functions
    (pool as any).ctor = Type;

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
 * @returns A new Poolable instance.
 */
export function buildFactory<T>(factoryFunction: () => T, reservePool?: number, recycleFn?: (o: T) => T): Poolable<T> {
    return new Poolable<T>({
        create: factoryFunction,
        recycle: recycleFn || defaultRecycle,
        reserve: reservePool || defaultPoolSize,
    });
}

/**
 * Retrieves a managed pool by its class constructor.
 * @param Type The class constructor of the pool to retrieve.
 * @returns The Poolable instance, or undefined if not found.
 */
export function getPool<T>(Type: { new(): T }): Poolable<T> | undefined {
    return poolMap.get(Type);
}

/**
 * Destroys a managed pool and removes it from the pool map.
 * @param pool The pool to destroy.
 */
export function destroyPool<T>(pool: Poolable<T>): void {
    pool.destroy();
    const poolConstructor = (pool as any).ctor;
    if (poolConstructor && poolMap.has(poolConstructor)) {
        poolMap.delete(poolConstructor);
    }
}

/**
 * Destroys all managed pools.
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
    const poolConstructor = (pool as any).ctor;
    if (poolConstructor && !poolMap.has(poolConstructor)) {
        poolMap.set(poolConstructor, pool);
    }
}
