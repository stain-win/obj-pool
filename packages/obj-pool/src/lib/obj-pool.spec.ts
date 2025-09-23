import {build, destroyPool, restorePool} from './obj-pool';
import {afterEach, beforeEach, describe, expect} from 'vitest';
import {Dummy} from './test/dummy';
import {Grumpy} from './test/grumpy';
import {Poolable} from './pool/abstract-pool';

let poolDummy: Poolable<Dummy>;
let poolGrumpy: Poolable<Grumpy>;

describe('ObjPool build', () => {
    beforeEach(() => {
        poolGrumpy = build(Grumpy);
        poolDummy = build(Dummy, 1, (dummy: Dummy) => {
            dummy.reset();
            return dummy;
        });
    });
    afterEach(() => {
        poolDummy.destroy();
        destroyPool(poolDummy);
        restorePool(poolDummy);
        poolDummy.reserve(1);

        poolGrumpy.destroy();
        destroyPool(poolGrumpy);
        restorePool(poolGrumpy);
    });

    it('should allocate dummy', () => {
        const grum = poolGrumpy.allocate();

        expect(grum).toBeTruthy();
        expect(grum.constructor.name).toEqual('Grumpy');
    });

    it('should allocate dummy with factory', () => {
        let dum = poolDummy.allocate();
        expect(poolDummy['poolSize']).toEqual(1);
        expect(poolDummy['freeSlotsCount']).toEqual(0);
    });

    it('should recycle dummy correctly', () => {
        let dum = poolDummy.allocate();
        dum.setChangeMe(20);
        poolDummy.release(dum);

        dum = poolDummy.allocate();
        expect(dum.getChangeMe()).toEqual(0);
        // should replace the last dummy with placeholder
        expect(dum).not.toEqual(poolDummy['freeSlot'].at(-1));

    });

    it('should expand pool correctly', () => {
        let dum = poolDummy.allocate();
        let dum2 = poolDummy.allocate();

        expect(poolDummy['poolSize']).toEqual(11);
        expect(poolDummy['freeSlotsCount']).toEqual(9);

        let dum3 = poolDummy.allocate();
        expect(poolDummy['poolSize']).toEqual(11);
        expect(poolDummy['freeSlotsCount']).toEqual(8);
    });

    it('should clear pool', () => {
        poolDummy.destroy();
        expect(poolDummy['freeSlot'].length).toEqual(0);
        expect(poolDummy['freeSlotsCount']).toEqual(0);
        expect(poolDummy['poolSize']).toEqual(0);

        // reserve pool after destroy
        poolDummy.reserve(10);
        expect(poolDummy['freeSlot'].length).toEqual(10);
        expect(poolDummy['freeSlotsCount']).toEqual(10);
        expect(poolDummy['poolSize']).toEqual(10);

    })
});
