import {Bench} from 'tinybench';
import {Dummy} from '../packages/obj-pool/src/lib/test/dummy';
import {build, releaseAllPools, releasePool, restorePool} from '@stain-win/objPool';
import {Poolable} from '@stain-win/objPool';

const poolReserve = 50;
const cycle = 5000;
const bench = new Bench({
    time: 250,
});

const playgroundLimits = [0, 100];
const playground = Array(playgroundLimits[0] + playgroundLimits[1] + 1)
    .fill(0).map((_, idx) => playgroundLimits[0] + idx);

enum MODE {
    USE_POOL,
    USE_POOL_GC_SOFT,
    USE_POOL_GC_HARD,
    USE_FACTORY,
}

let dummyPool = build(Dummy, 0, (dummy: Dummy) => dummy.reset());
let dummyPoolGC_soft = build(Dummy, 30, (dummy: Dummy) => dummy.reset());
let dummyPoolGC_hard = build(Dummy, 30, (dummy: Dummy) => dummy.reset());

dummyPool.id = Symbol('dummyPool');
dummyPoolGC_soft.id = Symbol('dummyPoolGC_soft');
dummyPoolGC_hard.id = Symbol('dummyPoolGC_hard');
function playGroundDummyF(dummy: Dummy, playgroundField: number[]) {

    for (const i of playgroundField) {
        dummy.setDummyPrealloc(i);
        // dummy.setDummy(i);
    }
    return dummy.getDummy()
}

function playGroundDummyP(dummy: Dummy, playgroundField: number[]) {
    for (const i of playgroundField) {
        dummy.setDummyPrealloc(i);
    }
    return dummy.getDummyPre()
}

function spinDummyP(dummyPool: Poolable<Dummy>, limit: number, playground: number[]) {
    const dummies: Dummy[] = [];
    for (let i = 0; i < limit; i++) {

        const dummy: Dummy = dummyPool.allocate();
        playGroundDummyP(dummy, playground);
        dummies.push(dummy);
        if ((i % 10 === 0) && i > 0) {
            for(let j = dummies.length; j > 0; j--) {
                dummyPool.release(dummies.pop());
            }
        }
    }
}

function spinDummyF(factory: () => Dummy, limit: number, playground: number[]) {
    const dumMap: number[] = [];
    for (let i = 0; i < limit; i++) {
        const dummy: Dummy = factory();
        dumMap.push(...playGroundDummyF(dummy, playground));
    }
    return dumMap.length;
}

function goDummy(mode: MODE, limit: number) {
    let dummy: Dummy;
    switch (mode) {
        case MODE.USE_POOL:
            spinDummyP(dummyPool, limit, playground);
            break;
        case MODE.USE_POOL_GC_SOFT:
            spinDummyP(dummyPool, limit, playground);
            break;
        case MODE.USE_POOL_GC_HARD:
            spinDummyP(dummyPool, limit, playground);
            break;
        case MODE.USE_FACTORY:
            const dummyFactory = () => new Dummy('test Dummy');
            spinDummyF(dummyFactory, limit, playground);
            break;
    }

}

bench
    .add('Dummy Pooling', () => {
        goDummy(MODE.USE_POOL, cycle);
    }, {
        beforeAll: () => dummyPool.reserve(poolReserve),
        afterAll: () => { releasePool(dummyPool); restorePool(dummyPool); },
    })
    .add('Dummy Pooling with GC soft reset', () => {
        dummyPoolGC_soft.reserve(poolReserve);
        goDummy(MODE.USE_POOL_GC_SOFT, cycle);
    }, {
        afterAll: () => {
            releasePool(dummyPoolGC_soft);
            restorePool(dummyPoolGC_soft);
            dummyPool.reserve(poolReserve);
        }
    })
    .add('Dummy Pooling with GC hard reset', () => {
        dummyPoolGC_hard.reserve(poolReserve);
        goDummy(MODE.USE_POOL_GC_HARD, cycle);
    }, {
        // beforeAll: () => dummyPoolGC_hard.reserve(poolReserve),
        afterEach: () => {
            releasePool(dummyPoolGC_hard);
            restorePool(dummyPoolGC_hard);
            dummyPoolGC_hard.reserve(poolReserve);
        },
        afterAll: () => {
            releasePool(dummyPoolGC_hard);
            restorePool(dummyPoolGC_hard);
            dummyPoolGC_hard.reserve(poolReserve);
        }
    })
    .add('Dummy Factory', () => {
        goDummy(MODE.USE_FACTORY, cycle);
    });

// await bench.warmup();
await bench.run();
const tasks = [...bench.tasks];

tasks.sort((a, b) => a.result!.mean - b.result!.mean);

console.table(
    tasks.map(({name, result}) => ({
        'Task Name': name,
        'Samples Run': result.samples.length,
        'Average Time (ps)': (result!.mean * 1000).toFixed(2),
        'Variance (ps)': (result!.variance * 1000).toFixed(2),
        'Slowest (GC) (ps)': (result!.max * 1000).toFixed(2),
        'Fastest (ps)': (result!.min * 1000).toFixed(2),
    }))
);
console.log('\n');
