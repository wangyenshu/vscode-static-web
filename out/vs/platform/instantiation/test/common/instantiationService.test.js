/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection"], function (require, exports, assert, event_1, lifecycle_1, utils_1, descriptors_1, instantiation_1, instantiationService_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const IService1 = (0, instantiation_1.createDecorator)('service1');
    class Service1 {
        constructor() {
            this.c = 1;
        }
    }
    const IService2 = (0, instantiation_1.createDecorator)('service2');
    class Service2 {
        constructor() {
            this.d = true;
        }
    }
    const IService3 = (0, instantiation_1.createDecorator)('service3');
    class Service3 {
        constructor() {
            this.s = 'farboo';
        }
    }
    const IDependentService = (0, instantiation_1.createDecorator)('dependentService');
    let DependentService = class DependentService {
        constructor(service) {
            this.name = 'farboo';
            assert.strictEqual(service.c, 1);
        }
    };
    DependentService = __decorate([
        __param(0, IService1)
    ], DependentService);
    let Service1Consumer = class Service1Consumer {
        constructor(service1) {
            assert.ok(service1);
            assert.strictEqual(service1.c, 1);
        }
    };
    Service1Consumer = __decorate([
        __param(0, IService1)
    ], Service1Consumer);
    let Target2Dep = class Target2Dep {
        constructor(service1, service2) {
            assert.ok(service1 instanceof Service1);
            assert.ok(service2 instanceof Service2);
        }
    };
    Target2Dep = __decorate([
        __param(0, IService1),
        __param(1, IService2)
    ], Target2Dep);
    let TargetWithStaticParam = class TargetWithStaticParam {
        constructor(v, service1) {
            assert.ok(v);
            assert.ok(service1);
            assert.strictEqual(service1.c, 1);
        }
    };
    TargetWithStaticParam = __decorate([
        __param(1, IService1)
    ], TargetWithStaticParam);
    let DependentServiceTarget = class DependentServiceTarget {
        constructor(d) {
            assert.ok(d);
            assert.strictEqual(d.name, 'farboo');
        }
    };
    DependentServiceTarget = __decorate([
        __param(0, IDependentService)
    ], DependentServiceTarget);
    let DependentServiceTarget2 = class DependentServiceTarget2 {
        constructor(d, s) {
            assert.ok(d);
            assert.strictEqual(d.name, 'farboo');
            assert.ok(s);
            assert.strictEqual(s.c, 1);
        }
    };
    DependentServiceTarget2 = __decorate([
        __param(0, IDependentService),
        __param(1, IService1)
    ], DependentServiceTarget2);
    let ServiceLoop1 = class ServiceLoop1 {
        constructor(s) {
            this.c = 1;
        }
    };
    ServiceLoop1 = __decorate([
        __param(0, IService2)
    ], ServiceLoop1);
    let ServiceLoop2 = class ServiceLoop2 {
        constructor(s) {
            this.d = true;
        }
    };
    ServiceLoop2 = __decorate([
        __param(0, IService1)
    ], ServiceLoop2);
    suite('Instantiation Service', () => {
        test('service collection, cannot overwrite', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            let result = collection.set(IService1, null);
            assert.strictEqual(result, undefined);
            result = collection.set(IService1, new Service1());
            assert.strictEqual(result, null);
        });
        test('service collection, add/has', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(IService1, null);
            assert.ok(collection.has(IService1));
            collection.set(IService2, null);
            assert.ok(collection.has(IService1));
            assert.ok(collection.has(IService2));
        });
        test('@Param - simple clase', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            collection.set(IService3, new Service3());
            service.createInstance(Service1Consumer);
        });
        test('@Param - fixed args', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            collection.set(IService3, new Service3());
            service.createInstance(TargetWithStaticParam, true);
        });
        test('service collection is live', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(IService1, new Service1());
            const service = new instantiationService_1.InstantiationService(collection);
            service.createInstance(Service1Consumer);
            collection.set(IService2, new Service2());
            service.createInstance(Target2Dep);
            service.invokeFunction(function (a) {
                assert.ok(a.get(IService1));
                assert.ok(a.get(IService2));
            });
        });
        // we made this a warning
        // test('@Param - too many args', function () {
        // 	let service = instantiationService.create(Object.create(null));
        // 	service.addSingleton(IService1, new Service1());
        // 	service.addSingleton(IService2, new Service2());
        // 	service.addSingleton(IService3, new Service3());
        // 	assert.throws(() => service.createInstance(ParameterTarget2, true, 2));
        // });
        // test('@Param - too few args', function () {
        // 	let service = instantiationService.create(Object.create(null));
        // 	service.addSingleton(IService1, new Service1());
        // 	service.addSingleton(IService2, new Service2());
        // 	service.addSingleton(IService3, new Service3());
        // 	assert.throws(() => service.createInstance(ParameterTarget2));
        // });
        test('SyncDesc - no dependencies', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            service.invokeFunction(accessor => {
                const service1 = accessor.get(IService1);
                assert.ok(service1);
                assert.strictEqual(service1.c, 1);
                const service2 = accessor.get(IService1);
                assert.ok(service1 === service2);
            });
        });
        test('SyncDesc - service with service dependency', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            collection.set(IDependentService, new descriptors_1.SyncDescriptor(DependentService));
            service.invokeFunction(accessor => {
                const d = accessor.get(IDependentService);
                assert.ok(d);
                assert.strictEqual(d.name, 'farboo');
            });
        });
        test('SyncDesc - target depends on service future', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            collection.set(IDependentService, new descriptors_1.SyncDescriptor(DependentService));
            const d = service.createInstance(DependentServiceTarget);
            assert.ok(d instanceof DependentServiceTarget);
            const d2 = service.createInstance(DependentServiceTarget2);
            assert.ok(d2 instanceof DependentServiceTarget2);
        });
        test('SyncDesc - explode on loop', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(ServiceLoop1));
            collection.set(IService2, new descriptors_1.SyncDescriptor(ServiceLoop2));
            assert.throws(() => {
                service.invokeFunction(accessor => {
                    accessor.get(IService1);
                });
            });
            assert.throws(() => {
                service.invokeFunction(accessor => {
                    accessor.get(IService2);
                });
            });
            try {
                service.invokeFunction(accessor => {
                    accessor.get(IService1);
                });
            }
            catch (err) {
                assert.ok(err.name);
                assert.ok(err.message);
            }
        });
        test('Invoke - get services', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.strictEqual(accessor.get(IService1).c, 1);
                return true;
            }
            assert.strictEqual(service.invokeFunction(test), true);
        });
        test('Invoke - get service, optional', function () {
            const collection = new serviceCollection_1.ServiceCollection([IService1, new Service1()]);
            const service = new instantiationService_1.InstantiationService(collection);
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.throws(() => accessor.get(IService2));
                return true;
            }
            assert.strictEqual(service.invokeFunction(test), true);
        });
        test('Invoke - keeping accessor NOT allowed', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            let cached;
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.strictEqual(accessor.get(IService1).c, 1);
                cached = accessor;
                return true;
            }
            assert.strictEqual(service.invokeFunction(test), true);
            assert.throws(() => cached.get(IService2));
        });
        test('Invoke - throw error', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            function test(accessor) {
                throw new Error();
            }
            assert.throws(() => service.invokeFunction(test));
        });
        test('Create child', function () {
            let serviceInstanceCount = 0;
            const CtorCounter = class {
                constructor() {
                    this.c = 1;
                    serviceInstanceCount += 1;
                }
            };
            // creating the service instance BEFORE the child service
            let service = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([IService1, new descriptors_1.SyncDescriptor(CtorCounter)]));
            service.createInstance(Service1Consumer);
            // second instance must be earlier ONE
            let child = service.createChild(new serviceCollection_1.ServiceCollection([IService2, new Service2()]));
            child.createInstance(Service1Consumer);
            assert.strictEqual(serviceInstanceCount, 1);
            // creating the service instance AFTER the child service
            serviceInstanceCount = 0;
            service = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([IService1, new descriptors_1.SyncDescriptor(CtorCounter)]));
            child = service.createChild(new serviceCollection_1.ServiceCollection([IService2, new Service2()]));
            // second instance must be earlier ONE
            service.createInstance(Service1Consumer);
            child.createInstance(Service1Consumer);
            assert.strictEqual(serviceInstanceCount, 1);
        });
        test('Remote window / integration tests is broken #105562', function () {
            const Service1 = (0, instantiation_1.createDecorator)('service1');
            let Service1Impl = class Service1Impl {
                constructor(insta) {
                    const c = insta.invokeFunction(accessor => accessor.get(Service2)); // THIS is the recursive call
                    assert.ok(c);
                }
            };
            Service1Impl = __decorate([
                __param(0, instantiation_1.IInstantiationService)
            ], Service1Impl);
            const Service2 = (0, instantiation_1.createDecorator)('service2');
            class Service2Impl {
                constructor() { }
            }
            // This service depends on Service1 and Service2 BUT creating Service1 creates Service2 (via recursive invocation)
            // and then Servce2 should not be created a second time
            const Service21 = (0, instantiation_1.createDecorator)('service21');
            let Service21Impl = class Service21Impl {
                constructor(service2, service1) {
                    this.service2 = service2;
                    this.service1 = service1;
                }
            };
            Service21Impl = __decorate([
                __param(0, Service2),
                __param(1, Service1)
            ], Service21Impl);
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([Service1, new descriptors_1.SyncDescriptor(Service1Impl)], [Service2, new descriptors_1.SyncDescriptor(Service2Impl)], [Service21, new descriptors_1.SyncDescriptor(Service21Impl)]));
            const obj = insta.invokeFunction(accessor => accessor.get(Service21));
            assert.ok(obj);
        });
        test('Sync/Async dependency loop', async function () {
            const A = (0, instantiation_1.createDecorator)('A');
            const B = (0, instantiation_1.createDecorator)('B');
            let BConsumer = class BConsumer {
                constructor(b) {
                    this.b = b;
                }
                doIt() {
                    return this.b.b();
                }
            };
            BConsumer = __decorate([
                __param(0, B)
            ], BConsumer);
            let AService = class AService {
                constructor(insta) {
                    this.prop = insta.createInstance(BConsumer);
                }
                doIt() {
                    return this.prop.doIt();
                }
            };
            AService = __decorate([
                __param(0, instantiation_1.IInstantiationService)
            ], AService);
            let BService = class BService {
                constructor(a) {
                    assert.ok(a);
                }
                b() { return true; }
            };
            BService = __decorate([
                __param(0, A)
            ], BService);
            // SYNC -> explodes AImpl -> [insta:BConsumer] -> BImpl -> AImpl
            {
                const insta1 = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AService)], [B, new descriptors_1.SyncDescriptor(BService)]), true, undefined, true);
                try {
                    insta1.invokeFunction(accessor => accessor.get(A));
                    assert.ok(false);
                }
                catch (error) {
                    assert.ok(error instanceof Error);
                    assert.ok(error.message.includes('RECURSIVELY'));
                }
            }
            // ASYNC -> doesn't explode but cycle is tracked
            {
                const insta2 = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AService, undefined, true)], [B, new descriptors_1.SyncDescriptor(BService, undefined)]), true, undefined, true);
                const a = insta2.invokeFunction(accessor => accessor.get(A));
                a.doIt();
                const cycle = insta2._globalGraph?.findCycleSlow();
                assert.strictEqual(cycle, 'A -> B -> A');
            }
        });
        test('Delayed and events', function () {
            const A = (0, instantiation_1.createDecorator)('A');
            let created = false;
            class AImpl {
                constructor() {
                    this._doIt = 0;
                    this._onDidDoIt = new event_1.Emitter();
                    this.onDidDoIt = this._onDidDoIt.event;
                    created = true;
                }
                doIt() {
                    this._doIt += 1;
                    this._onDidDoIt.fire(this);
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a) {
                    this.a = a;
                    // eager subscribe -> NO service instance
                }
            };
            Consumer = __decorate([
                __param(0, A)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            let eventCount = 0;
            // subscribing to event doesn't trigger instantiation
            const listener = (e) => {
                assert.ok(e instanceof AImpl);
                eventCount++;
            };
            const d1 = c.a.onDidDoIt(listener);
            const d2 = c.a.onDidDoIt(listener);
            assert.strictEqual(created, false);
            assert.strictEqual(eventCount, 0);
            d2.dispose();
            // instantiation happens on first call
            c.a.doIt();
            assert.strictEqual(created, true);
            assert.strictEqual(eventCount, 1);
            const d3 = c.a.onDidDoIt(listener);
            c.a.doIt();
            assert.strictEqual(eventCount, 3);
            (0, lifecycle_1.dispose)([d1, d3]);
        });
        test('Capture event before init, use after init', function () {
            const A = (0, instantiation_1.createDecorator)('A');
            let created = false;
            class AImpl {
                constructor() {
                    this._doIt = 0;
                    this._onDidDoIt = new event_1.Emitter();
                    this.onDidDoIt = this._onDidDoIt.event;
                    created = true;
                }
                doIt() {
                    this._doIt += 1;
                    this._onDidDoIt.fire(this);
                }
                noop() {
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a) {
                    this.a = a;
                    // eager subscribe -> NO service instance
                }
            };
            Consumer = __decorate([
                __param(0, A)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            let eventCount = 0;
            // subscribing to event doesn't trigger instantiation
            const listener = (e) => {
                assert.ok(e instanceof AImpl);
                eventCount++;
            };
            const event = c.a.onDidDoIt;
            // const d1 = c.a.onDidDoIt(listener);
            assert.strictEqual(created, false);
            c.a.noop();
            assert.strictEqual(created, true);
            const d1 = event(listener);
            c.a.doIt();
            // instantiation happens on first call
            assert.strictEqual(eventCount, 1);
            (0, lifecycle_1.dispose)(d1);
        });
        test('Dispose early event listener', function () {
            const A = (0, instantiation_1.createDecorator)('A');
            let created = false;
            class AImpl {
                constructor() {
                    this._doIt = 0;
                    this._onDidDoIt = new event_1.Emitter();
                    this.onDidDoIt = this._onDidDoIt.event;
                    created = true;
                }
                doIt() {
                    this._doIt += 1;
                    this._onDidDoIt.fire(this);
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a) {
                    this.a = a;
                    // eager subscribe -> NO service instance
                }
            };
            Consumer = __decorate([
                __param(0, A)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            let eventCount = 0;
            // subscribing to event doesn't trigger instantiation
            const listener = (e) => {
                assert.ok(e instanceof AImpl);
                eventCount++;
            };
            const d1 = c.a.onDidDoIt(listener);
            assert.strictEqual(created, false);
            assert.strictEqual(eventCount, 0);
            c.a.doIt();
            // instantiation happens on first call
            assert.strictEqual(created, true);
            assert.strictEqual(eventCount, 1);
            (0, lifecycle_1.dispose)(d1);
            c.a.doIt();
            assert.strictEqual(eventCount, 1);
        });
        test('Dispose services it created', function () {
            let disposedA = false;
            let disposedB = false;
            const A = (0, instantiation_1.createDecorator)('A');
            class AImpl {
                constructor() {
                    this.value = 1;
                }
                dispose() {
                    disposedA = true;
                }
            }
            const B = (0, instantiation_1.createDecorator)('B');
            class BImpl {
                constructor() {
                    this.value = 1;
                }
                dispose() {
                    disposedB = true;
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)], [B, new BImpl()]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a, b) {
                    this.a = a;
                    this.b = b;
                    assert.strictEqual(a.value, b.value);
                }
            };
            Consumer = __decorate([
                __param(0, A),
                __param(1, B)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            insta.dispose();
            assert.ok(c);
            assert.strictEqual(disposedA, true);
            assert.strictEqual(disposedB, false);
        });
        test('Disposed service cannot be used anymore', function () {
            const B = (0, instantiation_1.createDecorator)('B');
            class BImpl {
                constructor() {
                    this.value = 1;
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([B, new BImpl()]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(b) {
                    this.b = b;
                    assert.strictEqual(b.value, 1);
                }
            };
            Consumer = __decorate([
                __param(0, B)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            assert.ok(c);
            insta.dispose();
            assert.throws(() => insta.createInstance(Consumer));
            assert.throws(() => insta.invokeFunction(accessor => { }));
            assert.throws(() => insta.createChild(new serviceCollection_1.ServiceCollection()));
        });
        test('Child does not dispose parent', function () {
            const B = (0, instantiation_1.createDecorator)('B');
            class BImpl {
                constructor() {
                    this.value = 1;
                }
            }
            const insta1 = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([B, new BImpl()]), true, undefined, true);
            const insta2 = insta1.createChild(new serviceCollection_1.ServiceCollection());
            let Consumer = class Consumer {
                constructor(b) {
                    this.b = b;
                    assert.strictEqual(b.value, 1);
                }
            };
            Consumer = __decorate([
                __param(0, B)
            ], Consumer);
            assert.ok(insta1.createInstance(Consumer));
            assert.ok(insta2.createInstance(Consumer));
            insta2.dispose();
            assert.ok(insta1.createInstance(Consumer)); // parent NOT disposed by child
            assert.throws(() => insta2.createInstance(Consumer));
        });
        test('Parent does dispose children', function () {
            const B = (0, instantiation_1.createDecorator)('B');
            class BImpl {
                constructor() {
                    this.value = 1;
                }
            }
            const insta1 = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([B, new BImpl()]), true, undefined, true);
            const insta2 = insta1.createChild(new serviceCollection_1.ServiceCollection());
            let Consumer = class Consumer {
                constructor(b) {
                    this.b = b;
                    assert.strictEqual(b.value, 1);
                }
            };
            Consumer = __decorate([
                __param(0, B)
            ], Consumer);
            assert.ok(insta1.createInstance(Consumer));
            assert.ok(insta2.createInstance(Consumer));
            insta1.dispose();
            assert.throws(() => insta2.createInstance(Consumer)); // child is disposed by parent
            assert.throws(() => insta1.createInstance(Consumer));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFudGlhdGlvblNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2luc3RhbnRpYXRpb24vdGVzdC9jb21tb24vaW5zdGFudGlhdGlvblNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVdoRyxNQUFNLFNBQVMsR0FBRyxJQUFBLCtCQUFlLEVBQVksVUFBVSxDQUFDLENBQUM7SUFPekQsTUFBTSxRQUFRO1FBQWQ7WUFFQyxNQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSwrQkFBZSxFQUFZLFVBQVUsQ0FBQyxDQUFDO0lBT3pELE1BQU0sUUFBUTtRQUFkO1lBRUMsTUFBQyxHQUFHLElBQUksQ0FBQztRQUNWLENBQUM7S0FBQTtJQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsK0JBQWUsRUFBWSxVQUFVLENBQUMsQ0FBQztJQU96RCxNQUFNLFFBQVE7UUFBZDtZQUVDLE1BQUMsR0FBRyxRQUFRLENBQUM7UUFDZCxDQUFDO0tBQUE7SUFFRCxNQUFNLGlCQUFpQixHQUFHLElBQUEsK0JBQWUsRUFBb0Isa0JBQWtCLENBQUMsQ0FBQztJQU9qRixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtRQUVyQixZQUF1QixPQUFrQjtZQUl6QyxTQUFJLEdBQUcsUUFBUSxDQUFDO1lBSGYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7S0FHRCxDQUFBO0lBUEssZ0JBQWdCO1FBRVIsV0FBQSxTQUFTLENBQUE7T0FGakIsZ0JBQWdCLENBT3JCO0lBRUQsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7UUFFckIsWUFBdUIsUUFBbUI7WUFDekMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUNELENBQUE7SUFOSyxnQkFBZ0I7UUFFUixXQUFBLFNBQVMsQ0FBQTtPQUZqQixnQkFBZ0IsQ0FNckI7SUFFRCxJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFVO1FBRWYsWUFBdUIsUUFBbUIsRUFBYSxRQUFrQjtZQUN4RSxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsWUFBWSxRQUFRLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsWUFBWSxRQUFRLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBQ0QsQ0FBQTtJQU5LLFVBQVU7UUFFRixXQUFBLFNBQVMsQ0FBQTtRQUF1QixXQUFBLFNBQVMsQ0FBQTtPQUZqRCxVQUFVLENBTWY7SUFFRCxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQUMxQixZQUFZLENBQVUsRUFBYSxRQUFtQjtZQUNyRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUNELENBQUE7SUFOSyxxQkFBcUI7UUFDRCxXQUFBLFNBQVMsQ0FBQTtPQUQ3QixxQkFBcUIsQ0FNMUI7SUFJRCxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUMzQixZQUErQixDQUFvQjtZQUNsRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRCxDQUFBO0lBTEssc0JBQXNCO1FBQ2QsV0FBQSxpQkFBaUIsQ0FBQTtPQUR6QixzQkFBc0IsQ0FLM0I7SUFFRCxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQUM1QixZQUErQixDQUFvQixFQUFhLENBQVk7WUFDM0UsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUM7S0FDRCxDQUFBO0lBUEssdUJBQXVCO1FBQ2YsV0FBQSxpQkFBaUIsQ0FBQTtRQUF3QixXQUFBLFNBQVMsQ0FBQTtPQUQxRCx1QkFBdUIsQ0FPNUI7SUFHRCxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFZO1FBSWpCLFlBQXVCLENBQVk7WUFGbkMsTUFBQyxHQUFHLENBQUMsQ0FBQztRQUlOLENBQUM7S0FDRCxDQUFBO0lBUEssWUFBWTtRQUlKLFdBQUEsU0FBUyxDQUFBO09BSmpCLFlBQVksQ0FPakI7SUFFRCxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFZO1FBSWpCLFlBQXVCLENBQVk7WUFGbkMsTUFBQyxHQUFHLElBQUksQ0FBQztRQUlULENBQUM7S0FDRCxDQUFBO0lBUEssWUFBWTtRQUlKLFdBQUEsU0FBUyxDQUFBO09BSmpCLFlBQVksQ0FPakI7SUFFRCxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLElBQUksQ0FBQyxzQ0FBc0MsRUFBRTtZQUM1QyxNQUFNLFVBQVUsR0FBRyxJQUFJLHFDQUFpQixFQUFFLENBQUM7WUFDM0MsSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSyxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRTtZQUNuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLHFDQUFpQixFQUFFLENBQUM7WUFDM0MsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFckMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUU7WUFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksMkNBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMxQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFMUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1lBQzNCLE1BQU0sVUFBVSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMxQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDMUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRTFDLE9BQU8sQ0FBQyxjQUFjLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUU7WUFFbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUUxQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUV6QyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFMUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuQyxPQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztnQkFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsK0NBQStDO1FBQy9DLG1FQUFtRTtRQUNuRSxvREFBb0Q7UUFDcEQsb0RBQW9EO1FBQ3BELG9EQUFvRDtRQUVwRCwyRUFBMkU7UUFDM0UsTUFBTTtRQUVOLDhDQUE4QztRQUM5QyxtRUFBbUU7UUFDbkUsb0RBQW9EO1FBQ3BELG9EQUFvRDtRQUNwRCxvREFBb0Q7UUFFcEQsa0VBQWtFO1FBQ2xFLE1BQU07UUFFTixJQUFJLENBQUMsNEJBQTRCLEVBQUU7WUFDbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksMkNBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSw0QkFBYyxDQUFZLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFbkUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFFakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVsQyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRDQUE0QyxFQUFFO1lBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksNEJBQWMsQ0FBWSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ25FLFVBQVUsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSw0QkFBYyxDQUFvQixnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFFM0YsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMxQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFO1lBQ25ELE1BQU0sVUFBVSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksNEJBQWMsQ0FBWSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ25FLFVBQVUsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSw0QkFBYyxDQUFvQixnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFFM0YsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLHNCQUFzQixDQUFDLENBQUM7WUFFL0MsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxZQUFZLHVCQUF1QixDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUU7WUFDbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksMkNBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSw0QkFBYyxDQUFZLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDdkUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSw0QkFBYyxDQUFZLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFdkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ2pDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDakMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQztnQkFDSixPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNqQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN6QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUU7WUFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksMkNBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUUxQyxTQUFTLElBQUksQ0FBQyxRQUEwQjtnQkFDdkMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVqRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUU7WUFDdEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLE9BQU8sR0FBRyxJQUFJLDJDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXJELFNBQVMsSUFBSSxDQUFDLFFBQTBCO2dCQUN2QyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksUUFBUSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUNBQXVDLEVBQUU7WUFDN0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksMkNBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUUxQyxJQUFJLE1BQXdCLENBQUM7WUFFN0IsU0FBUyxJQUFJLENBQUMsUUFBMEI7Z0JBQ3ZDLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsWUFBWSxRQUFRLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakQsTUFBTSxHQUFHLFFBQVEsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXZELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMxQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFMUMsU0FBUyxJQUFJLENBQUMsUUFBMEI7Z0JBQ3ZDLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFO1lBRXBCLElBQUksb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBRTdCLE1BQU0sV0FBVyxHQUFHO2dCQUduQjtvQkFEQSxNQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUVMLG9CQUFvQixJQUFJLENBQUMsQ0FBQztnQkFDM0IsQ0FBQzthQUNELENBQUM7WUFFRix5REFBeUQ7WUFDekQsSUFBSSxPQUFPLEdBQUcsSUFBSSwyQ0FBb0IsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksNEJBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RyxPQUFPLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFekMsc0NBQXNDO1lBQ3RDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLEtBQUssQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUV2QyxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVDLHdEQUF3RDtZQUN4RCxvQkFBb0IsR0FBRyxDQUFDLENBQUM7WUFDekIsT0FBTyxHQUFHLElBQUksMkNBQW9CLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLDRCQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEcsS0FBSyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhGLHNDQUFzQztZQUN0QyxPQUFPLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDekMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscURBQXFELEVBQUU7WUFFM0QsTUFBTSxRQUFRLEdBQUcsSUFBQSwrQkFBZSxFQUFNLFVBQVUsQ0FBQyxDQUFDO1lBQ2xELElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQVk7Z0JBQ2pCLFlBQW1DLEtBQTRCO29CQUM5RCxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsNkJBQTZCO29CQUNqRyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNkLENBQUM7YUFDRCxDQUFBO1lBTEssWUFBWTtnQkFDSixXQUFBLHFDQUFxQixDQUFBO2VBRDdCLFlBQVksQ0FLakI7WUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFBLCtCQUFlLEVBQU0sVUFBVSxDQUFDLENBQUM7WUFDbEQsTUFBTSxZQUFZO2dCQUNqQixnQkFBZ0IsQ0FBQzthQUNqQjtZQUVELGtIQUFrSDtZQUNsSCx1REFBdUQ7WUFDdkQsTUFBTSxTQUFTLEdBQUcsSUFBQSwrQkFBZSxFQUFNLFdBQVcsQ0FBQyxDQUFDO1lBQ3BELElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7Z0JBQ2xCLFlBQXNDLFFBQXNCLEVBQTRCLFFBQXNCO29CQUF4RSxhQUFRLEdBQVIsUUFBUSxDQUFjO29CQUE0QixhQUFRLEdBQVIsUUFBUSxDQUFjO2dCQUFJLENBQUM7YUFDbkgsQ0FBQTtZQUZLLGFBQWE7Z0JBQ0wsV0FBQSxRQUFRLENBQUE7Z0JBQTBDLFdBQUEsUUFBUSxDQUFBO2VBRGxFLGFBQWEsQ0FFbEI7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLDJDQUFvQixDQUFDLElBQUkscUNBQWlCLENBQzNELENBQUMsUUFBUSxFQUFFLElBQUksNEJBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUM1QyxDQUFDLFFBQVEsRUFBRSxJQUFJLDRCQUFjLENBQUMsWUFBWSxDQUFDLENBQUMsRUFDNUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQzlDLENBQUMsQ0FBQztZQUVILE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0QkFBNEIsRUFBRSxLQUFLO1lBRXZDLE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBSSxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsR0FBRyxJQUFBLCtCQUFlLEVBQUksR0FBRyxDQUFDLENBQUM7WUFJbEMsSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFTO2dCQUNkLFlBQWdDLENBQUk7b0JBQUosTUFBQyxHQUFELENBQUMsQ0FBRztnQkFFcEMsQ0FBQztnQkFDRCxJQUFJO29CQUNILE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQzthQUNELENBQUE7WUFQSyxTQUFTO2dCQUNELFdBQUEsQ0FBQyxDQUFBO2VBRFQsU0FBUyxDQU9kO1lBRUQsSUFBTSxRQUFRLEdBQWQsTUFBTSxRQUFRO2dCQUdiLFlBQW1DLEtBQTRCO29CQUM5RCxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzdDLENBQUM7Z0JBQ0QsSUFBSTtvQkFDSCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3pCLENBQUM7YUFDRCxDQUFBO1lBVEssUUFBUTtnQkFHQSxXQUFBLHFDQUFxQixDQUFBO2VBSDdCLFFBQVEsQ0FTYjtZQUVELElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtnQkFFYixZQUFlLENBQUk7b0JBQ2xCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2QsQ0FBQztnQkFDRCxDQUFDLEtBQUssT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3BCLENBQUE7WUFOSyxRQUFRO2dCQUVBLFdBQUEsQ0FBQyxDQUFBO2VBRlQsUUFBUSxDQU1iO1lBRUQsZ0VBQWdFO1lBQ2hFLENBQUM7Z0JBQ0EsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBb0IsQ0FBQyxJQUFJLHFDQUFpQixDQUM1RCxDQUFDLENBQUMsRUFBRSxJQUFJLDRCQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsRUFDakMsQ0FBQyxDQUFDLEVBQUUsSUFBSSw0QkFBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQ2pDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFMUIsSUFBSSxDQUFDO29CQUNKLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRWxCLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsQ0FBQztZQUNGLENBQUM7WUFFRCxnREFBZ0Q7WUFDaEQsQ0FBQztnQkFDQSxNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFvQixDQUFDLElBQUkscUNBQWlCLENBQzVELENBQUMsQ0FBQyxFQUFFLElBQUksNEJBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQ2xELENBQUMsQ0FBQyxFQUFFLElBQUksNEJBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FDNUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUxQixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRVQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzFCLE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBSSxHQUFHLENBQUMsQ0FBQztZQU9sQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsTUFBTSxLQUFLO2dCQU9WO29CQUxBLFVBQUssR0FBRyxDQUFDLENBQUM7b0JBRVYsZUFBVSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7b0JBQ2pDLGNBQVMsR0FBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7b0JBRzlDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7Z0JBRUQsSUFBSTtvQkFDSCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7YUFDRDtZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksMkNBQW9CLENBQUMsSUFBSSxxQ0FBaUIsQ0FDM0QsQ0FBQyxDQUFDLEVBQUUsSUFBSSw0QkFBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FDL0MsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTFCLElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtnQkFDYixZQUErQixDQUFJO29CQUFKLE1BQUMsR0FBRCxDQUFDLENBQUc7b0JBQ2xDLHlDQUF5QztnQkFDMUMsQ0FBQzthQUNELENBQUE7WUFKSyxRQUFRO2dCQUNBLFdBQUEsQ0FBQyxDQUFBO2VBRFQsUUFBUSxDQUliO1lBRUQsTUFBTSxDQUFDLEdBQWEsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFFbkIscURBQXFEO1lBQ3JELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBTSxFQUFFLEVBQUU7Z0JBQzNCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixVQUFVLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQztZQUNGLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUViLHNDQUFzQztZQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFHbEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxDLElBQUEsbUJBQU8sRUFBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLDJDQUEyQyxFQUFFO1lBQ2pELE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBSSxHQUFHLENBQUMsQ0FBQztZQVFsQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsTUFBTSxLQUFLO2dCQU9WO29CQUxBLFVBQUssR0FBRyxDQUFDLENBQUM7b0JBRVYsZUFBVSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7b0JBQ2pDLGNBQVMsR0FBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7b0JBRzlDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7Z0JBRUQsSUFBSTtvQkFDSCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBRUQsSUFBSTtnQkFDSixDQUFDO2FBQ0Q7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLDJDQUFvQixDQUFDLElBQUkscUNBQWlCLENBQzNELENBQUMsQ0FBQyxFQUFFLElBQUksNEJBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQy9DLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUxQixJQUFNLFFBQVEsR0FBZCxNQUFNLFFBQVE7Z0JBQ2IsWUFBK0IsQ0FBSTtvQkFBSixNQUFDLEdBQUQsQ0FBQyxDQUFHO29CQUNsQyx5Q0FBeUM7Z0JBQzFDLENBQUM7YUFDRCxDQUFBO1lBSkssUUFBUTtnQkFDQSxXQUFBLENBQUMsQ0FBQTtlQURULFFBQVEsQ0FJYjtZQUVELE1BQU0sQ0FBQyxHQUFhLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBRW5CLHFEQUFxRDtZQUNyRCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFO2dCQUMzQixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQztnQkFDOUIsVUFBVSxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUM7WUFFRixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUU1QixzQ0FBc0M7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWxDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUzQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBR1gsc0NBQXNDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxDLElBQUEsbUJBQU8sRUFBQyxFQUFFLENBQUMsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFO1lBQ3BDLE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBSSxHQUFHLENBQUMsQ0FBQztZQU1sQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsTUFBTSxLQUFLO2dCQU9WO29CQUxBLFVBQUssR0FBRyxDQUFDLENBQUM7b0JBRVYsZUFBVSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7b0JBQ2pDLGNBQVMsR0FBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7b0JBRzlDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7Z0JBRUQsSUFBSTtvQkFDSCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7YUFDRDtZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksMkNBQW9CLENBQUMsSUFBSSxxQ0FBaUIsQ0FDM0QsQ0FBQyxDQUFDLEVBQUUsSUFBSSw0QkFBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FDL0MsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTFCLElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtnQkFDYixZQUErQixDQUFJO29CQUFKLE1BQUMsR0FBRCxDQUFDLENBQUc7b0JBQ2xDLHlDQUF5QztnQkFDMUMsQ0FBQzthQUNELENBQUE7WUFKSyxRQUFRO2dCQUNBLFdBQUEsQ0FBQyxDQUFBO2VBRFQsUUFBUSxDQUliO1lBRUQsTUFBTSxDQUFDLEdBQWEsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFFbkIscURBQXFEO1lBQ3JELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBTSxFQUFFLEVBQUU7Z0JBQzNCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixVQUFVLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQztZQUVGLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFWCxzQ0FBc0M7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEMsSUFBQSxtQkFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRVosQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLDZCQUE2QixFQUFFO1lBQ25DLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFdEIsTUFBTSxDQUFDLEdBQUcsSUFBQSwrQkFBZSxFQUFJLEdBQUcsQ0FBQyxDQUFDO1lBS2xDLE1BQU0sS0FBSztnQkFBWDtvQkFFQyxVQUFLLEdBQU0sQ0FBQyxDQUFDO2dCQUlkLENBQUM7Z0JBSEEsT0FBTztvQkFDTixTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixDQUFDO2FBQ0Q7WUFFRCxNQUFNLENBQUMsR0FBRyxJQUFBLCtCQUFlLEVBQUksR0FBRyxDQUFDLENBQUM7WUFLbEMsTUFBTSxLQUFLO2dCQUFYO29CQUVDLFVBQUssR0FBTSxDQUFDLENBQUM7Z0JBSWQsQ0FBQztnQkFIQSxPQUFPO29CQUNOLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLENBQUM7YUFDRDtZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksMkNBQW9CLENBQUMsSUFBSSxxQ0FBaUIsQ0FDM0QsQ0FBQyxDQUFDLEVBQUUsSUFBSSw0QkFBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFDL0MsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUNoQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFMUIsSUFBTSxRQUFRLEdBQWQsTUFBTSxRQUFRO2dCQUNiLFlBQ29CLENBQUksRUFDSixDQUFJO29CQURKLE1BQUMsR0FBRCxDQUFDLENBQUc7b0JBQ0osTUFBQyxHQUFELENBQUMsQ0FBRztvQkFFdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEMsQ0FBQzthQUNELENBQUE7WUFQSyxRQUFRO2dCQUVYLFdBQUEsQ0FBQyxDQUFBO2dCQUNELFdBQUEsQ0FBQyxDQUFBO2VBSEUsUUFBUSxDQU9iO1lBRUQsTUFBTSxDQUFDLEdBQWEsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVuRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlDQUF5QyxFQUFFO1lBRy9DLE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBSSxHQUFHLENBQUMsQ0FBQztZQUtsQyxNQUFNLEtBQUs7Z0JBQVg7b0JBRUMsVUFBSyxHQUFNLENBQUMsQ0FBQztnQkFDZCxDQUFDO2FBQUE7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLDJDQUFvQixDQUFDLElBQUkscUNBQWlCLENBQzNELENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxFQUFFLENBQUMsQ0FDaEIsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTFCLElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtnQkFDYixZQUNvQixDQUFJO29CQUFKLE1BQUMsR0FBRCxDQUFDLENBQUc7b0JBRXZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsQ0FBQzthQUNELENBQUE7WUFOSyxRQUFRO2dCQUVYLFdBQUEsQ0FBQyxDQUFBO2VBRkUsUUFBUSxDQU1iO1lBRUQsTUFBTSxDQUFDLEdBQWEsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUkscUNBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUU7WUFFckMsTUFBTSxDQUFDLEdBQUcsSUFBQSwrQkFBZSxFQUFJLEdBQUcsQ0FBQyxDQUFDO1lBS2xDLE1BQU0sS0FBSztnQkFBWDtvQkFFQyxVQUFLLEdBQU0sQ0FBQyxDQUFDO2dCQUNkLENBQUM7YUFBQTtZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQW9CLENBQUMsSUFBSSxxQ0FBaUIsQ0FDNUQsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUNoQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFMUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLHFDQUFpQixFQUFFLENBQUMsQ0FBQztZQUUzRCxJQUFNLFFBQVEsR0FBZCxNQUFNLFFBQVE7Z0JBQ2IsWUFDb0IsQ0FBSTtvQkFBSixNQUFDLEdBQUQsQ0FBQyxDQUFHO29CQUV2QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7YUFDRCxDQUFBO1lBTkssUUFBUTtnQkFFWCxXQUFBLENBQUMsQ0FBQTtlQUZFLFFBQVEsQ0FNYjtZQUVELE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVqQixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLCtCQUErQjtZQUMzRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4QkFBOEIsRUFBRTtZQUVwQyxNQUFNLENBQUMsR0FBRyxJQUFBLCtCQUFlLEVBQUksR0FBRyxDQUFDLENBQUM7WUFLbEMsTUFBTSxLQUFLO2dCQUFYO29CQUVDLFVBQUssR0FBTSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQzthQUFBO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBb0IsQ0FBQyxJQUFJLHFDQUFpQixDQUM1RCxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQ2hCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUxQixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUkscUNBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBRTNELElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtnQkFDYixZQUNvQixDQUFJO29CQUFKLE1BQUMsR0FBRCxDQUFDLENBQUc7b0JBRXZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsQ0FBQzthQUNELENBQUE7WUFOSyxRQUFRO2dCQUVYLFdBQUEsQ0FBQyxDQUFBO2VBRkUsUUFBUSxDQU1iO1lBRUQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFM0MsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWpCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsOEJBQThCO1lBQ3BGLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=