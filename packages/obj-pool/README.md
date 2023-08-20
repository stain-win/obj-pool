# ObjPool

_obj-pool_ is a lightweight JavaScript library for implementing object pooling, a design pattern used to improve performance in applications that require the frequent creation and destruction of objects. Object pooling can significantly reduce memory allocation and garbage collection overhead, leading to better application performance and smoother user experiences. Created for personal project and forked to npm package.

## Features

- Efficient object reuse: _obj-pool_ helps you reuse objects instead of creating new instances, reducing memory allocation and enhancing performance.
- Customizable pool size: Configure the maximum number of objects in the pool to match usage requirements.
- Simple API: _obj-pool_ provides a simple and straightforward API for borrowing and returning objects from the pool.


## Installation

You can install _obj-pool_ using npm:

```bash
npm install @stain-win/obj-pool
```

## Usage
Importing the Library
```javascript
import { build, buildFactory, Poolable } from '@stain-win/objPool';
```
### Creating a Pool
```javascript
build<T>(Type: { new(): T }, reserve?: number, recycle?: (o: T) => T): Poolable<T>
```


### Borrowing and Returning Objects

```javascript
// Borrow an object from the pool
const pooledObject:  = pool.allocate();

// Use the object
// ...
pooledObject.changeSomething('test');
// Return the object to the pool when done
pool.release(pooledObject);
```

## Examples
You can find more usage examples and integration scenarios in the demo app directory of this repository.

```typescript
const poolDummy: Poolable<Dummy> = build(Dummy, 20, (dummy: Dummy) => {
            dummy.setChangeMe(0);
            return dummy;
        });

const poolDummyFactory: Poolable<Dummy> = buildFactory(() => new Dummy(args));

const dummy: Dummy = poolDummy.allocate();
const dummyF: Dummy = poolDummyFacotry.allocate();

poolDummy.release(dummy);
poolDummyFactory.release(dummyF);
```


## License
This project is licensed under the [MIT]((http://getify.mit-license.org/)) License.

## Acknowledgments
_obj-pool_ was inspired by the concept of object pooling in game development and aims to bring similar performance benefits to a wide range of JavaScript applications. More optimizations coming soon.

