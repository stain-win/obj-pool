import {Poolable} from './pool/abstract-pool';

export function objPool(): string {
    return 'obj-pool-obj-pool';
}

const defaultPoolSize = 10;
const defaultRecycle = <T>(o: T): T => o;
const poolMap: Map<{ new(): any }, Poolable<any>> = new Map();

export function build<T>(Type: { new(): T }, reserve?: number, recycle?: (o: T) => T): Poolable<T> {

    let pool: Poolable<T> | undefined = poolMap.get(Type) as Poolable<T> | undefined;
    if (pool) {
        return pool as Poolable<T>;
    }

    pool = new (class ObjectPool extends Poolable<T> {
        constructor() {
            reserve = reserve || defaultPoolSize;
            recycle = recycle || defaultRecycle;
            super({reserve, recycle});
        }
        create(): T {
            return new Type();
        }
    })();

    poolMap.set(Type, pool as Poolable<T>);
    return pool as Poolable<T>;
}

export function buildFactory<T>(factoryFunction: () => T, reservePool?: number, recycleFn?: <T>(o: T) => T): Poolable<T> {
    const reserve = reservePool || defaultPoolSize;
    const recycle = recycleFn || defaultRecycle;
    return new (class ObjectPool extends Poolable<T> {
        constructor() {
            super({reserve, recycle});
        }
        create = factoryFunction;
    })();
}

export function getPool<T>(Type: { new(): T }): Poolable<T> | undefined {
    return poolMap.get(Type) as Poolable<T> | undefined;
}

