import {build, destroyPool, restorePool, getAllPoolStats, buildFactory, releaseAllPools} from './obj-pool';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {Dummy} from './test/dummy';
import {Grumpy} from './test/grumpy';
import {Poolable} from './pool/abstract-pool';

let poolDummy: Poolable<Dummy>;
let poolGrumpy: Poolable<Grumpy>;

describe('ObjPool build', () => {
    beforeEach(() => {
        // Release all existing pools to start fresh
        releaseAllPools();

        // Now build fresh pools
        poolGrumpy = build(Grumpy, 10);
        poolDummy = build(Dummy, 1, (dummy: Dummy) => {
            dummy.reset();
            return dummy;
        });
    });

    afterEach(() => {
        // Clean up all pools
        releaseAllPools();
    });

    it('should allocate dummy', () => {
        const grum = poolGrumpy.allocate();

        expect(grum).toBeTruthy();
        expect(grum.constructor.name).toEqual('Grumpy');
    });

    it('should allocate dummy with factory', () => {
        let dum = poolDummy.allocate();
        expect(poolDummy.capacity).toEqual(1);
        expect(poolDummy.available).toEqual(0);
        expect(poolDummy.inUse).toEqual(1);
    });

    it('should recycle dummy correctly', () => {
        let dum = poolDummy.allocate();
        dum.setChangeMe(20);
        poolDummy.release(dum);

        dum = poolDummy.allocate();
        expect(dum.getChangeMe()).toEqual(0);
        expect(poolDummy.available).toEqual(0);
    });

    it('should expand pool correctly', () => {
        // Start fresh - pool has 1 object reserved from beforeEach
        expect(poolDummy.capacity).toEqual(1);
        expect(poolDummy.available).toEqual(1);

        let dum = poolDummy.allocate();
        expect(poolDummy.inUse).toEqual(1);
        expect(poolDummy.available).toEqual(0);
        expect(poolDummy.capacity).toEqual(1);

        // This allocation should trigger growth
        let dum2 = poolDummy.allocate();

        // Pool was at capacity 1, so it grows by 10 (initial growth)
        // After growth and allocation: capacity=11, inUse=2, available=9
        expect(poolDummy.inUse).toEqual(2);
        expect(poolDummy.capacity).toEqual(11);
        expect(poolDummy.available).toEqual(9);

        let dum3 = poolDummy.allocate();
        expect(poolDummy.inUse).toEqual(3);
        expect(poolDummy.available).toEqual(8);
        expect(poolDummy.capacity).toEqual(11);
    });

    it('should clear pool', () => {
        poolDummy.destroy();
        expect(poolDummy.available).toEqual(0);
        expect(poolDummy.capacity).toEqual(0);
        expect(poolDummy.inUse).toEqual(0);

        // reserve pool after destroy
        poolDummy.reserve(10);
        expect(poolDummy.available).toEqual(10);
        expect(poolDummy.capacity).toEqual(10);
    });

    it('should get pool statistics', () => {
        const dum1 = poolDummy.allocate();
        const dum2 = poolDummy.allocate();

        const stats = poolDummy.getStats();
        expect(stats.inUse).toEqual(2);
        expect(stats.totalAllocations).toEqual(2);
        expect(stats.totalReleases).toEqual(0);

        poolDummy.release(dum1);
        const stats2 = poolDummy.getStats();
        expect(stats2.inUse).toEqual(1);
        expect(stats2.totalReleases).toEqual(1);
    });

    it('should shrink pool correctly', () => {
        poolDummy.reserve(20);
        expect(poolDummy.available).toBeGreaterThan(10);

        poolDummy.shrink(5);
        expect(poolDummy.available).toEqual(5);
    });

    it('should respect max size', () => {
        // Use buildFactory to avoid singleton behavior
        const limitedPool = buildFactory(() => new Dummy(), 5, (d) => d.reset(), 10);

        // Initial reserve of 5 should work (within max of 10)
        expect(limitedPool.capacity).toEqual(5);

        // Trying to reserve 20 more should be capped at 10 total
        limitedPool.reserve(20);
        expect(limitedPool.capacity).toEqual(10); // Should be capped at maxSize

        limitedPool.destroy();
    });

    it('should get all pool stats', () => {
        const stats = getAllPoolStats();
        expect(stats.length).toBeGreaterThan(0);
        expect(stats.some(s => s.name === 'Dummy')).toBe(true);
        expect(stats.some(s => s.name === 'Grumpy')).toBe(true);
    });

    it('should handle batch release', () => {
        const dum1 = poolDummy.allocate();
        const dum2 = poolDummy.allocate();
        const dum3 = poolDummy.allocate();

        expect(poolDummy.inUse).toEqual(3);

        poolDummy.release([dum1, dum2, dum3]);
        expect(poolDummy.inUse).toEqual(0);
        expect(poolDummy.available).toBeGreaterThan(0);
    });
});
