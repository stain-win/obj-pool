import {objPool, build} from './obj-pool';
import {beforeEach, describe, expect} from 'vitest';
import {Dummy} from './test/dummy';
import {Grumpy} from './test/grumpy';
import {Poolable} from './pool/abstract-pool';

let poolDummy: Poolable<Dummy>;
let poolGrumpy: Poolable<Grumpy>;
describe('ObjPool', () => {
    it('should work', () => {
        expect(objPool()).toEqual('obj-pool-obj-pool');
    });
});

describe('ObjPool build', () => {
    beforeEach(() => {
        poolGrumpy = build(Grumpy);
        poolDummy = build(Dummy, 1, (dummy: Dummy) => {
            dummy.setChangeMe(0);
            return dummy;
        });
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

    });
});
