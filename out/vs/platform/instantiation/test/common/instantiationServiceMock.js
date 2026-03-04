/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection"], function (require, exports, sinon, lifecycle_1, descriptors_1, instantiationService_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestInstantiationService = void 0;
    exports.createServices = createServices;
    const isSinonSpyLike = (fn) => fn && 'callCount' in fn;
    class TestInstantiationService extends instantiationService_1.InstantiationService {
        constructor(_serviceCollection = new serviceCollection_1.ServiceCollection(), strict = false, parent, _properDispose) {
            super(_serviceCollection, strict, parent);
            this._serviceCollection = _serviceCollection;
            this._properDispose = _properDispose;
            this._servciesMap = new Map();
        }
        get(service) {
            return super._getOrCreateServiceInstance(service, instantiationService_1.Trace.traceCreation(false, TestInstantiationService));
        }
        set(service, instance) {
            return this._serviceCollection.set(service, instance);
        }
        mock(service) {
            return this._create(service, { mock: true });
        }
        stub(serviceIdentifier, arg2, arg3, arg4) {
            const service = typeof arg2 !== 'string' ? arg2 : undefined;
            const serviceMock = { id: serviceIdentifier, service: service };
            const property = typeof arg2 === 'string' ? arg2 : arg3;
            const value = typeof arg2 === 'string' ? arg3 : arg4;
            const stubObject = this._create(serviceMock, { stub: true }, service && !property);
            if (property) {
                if (stubObject[property]) {
                    if (stubObject[property].hasOwnProperty('restore')) {
                        stubObject[property].restore();
                    }
                    if (typeof value === 'function') {
                        const spy = isSinonSpyLike(value) ? value : sinon.spy(value);
                        stubObject[property] = spy;
                        return spy;
                    }
                    else {
                        const stub = value ? sinon.stub().returns(value) : sinon.stub();
                        stubObject[property] = stub;
                        return stub;
                    }
                }
                else {
                    stubObject[property] = value;
                }
            }
            return stubObject;
        }
        stubPromise(arg1, arg2, arg3, arg4) {
            arg3 = typeof arg2 === 'string' ? Promise.resolve(arg3) : arg3;
            arg4 = typeof arg2 !== 'string' && typeof arg3 === 'string' ? Promise.resolve(arg4) : arg4;
            return this.stub(arg1, arg2, arg3, arg4);
        }
        spy(service, fnProperty) {
            const spy = sinon.spy();
            this.stub(service, fnProperty, spy);
            return spy;
        }
        _create(arg1, options, reset = false) {
            if (this.isServiceMock(arg1)) {
                const service = this._getOrCreateService(arg1, options, reset);
                this._serviceCollection.set(arg1.id, service);
                return service;
            }
            return options.mock ? sinon.mock(arg1) : this._createStub(arg1);
        }
        _getOrCreateService(serviceMock, opts, reset) {
            const service = this._serviceCollection.get(serviceMock.id);
            if (!reset && service) {
                if (opts.mock && service['sinonOptions'] && !!service['sinonOptions'].mock) {
                    return service;
                }
                if (opts.stub && service['sinonOptions'] && !!service['sinonOptions'].stub) {
                    return service;
                }
            }
            return this._createService(serviceMock, opts);
        }
        _createService(serviceMock, opts) {
            serviceMock.service = serviceMock.service ? serviceMock.service : this._servciesMap.get(serviceMock.id);
            const service = opts.mock ? sinon.mock(serviceMock.service) : this._createStub(serviceMock.service);
            service['sinonOptions'] = opts;
            return service;
        }
        _createStub(arg) {
            return typeof arg === 'object' ? arg : sinon.createStubInstance(arg);
        }
        isServiceMock(arg1) {
            return typeof arg1 === 'object' && arg1.hasOwnProperty('id');
        }
        createChild(services) {
            return new TestInstantiationService(services, false, this);
        }
        dispose() {
            sinon.restore();
            if (this._properDispose) {
                super.dispose();
            }
        }
    }
    exports.TestInstantiationService = TestInstantiationService;
    function createServices(disposables, services) {
        const serviceIdentifiers = [];
        const serviceCollection = new serviceCollection_1.ServiceCollection();
        const define = (id, ctorOrInstance) => {
            if (!serviceCollection.has(id)) {
                if (typeof ctorOrInstance === 'function') {
                    serviceCollection.set(id, new descriptors_1.SyncDescriptor(ctorOrInstance));
                }
                else {
                    serviceCollection.set(id, ctorOrInstance);
                }
            }
            serviceIdentifiers.push(id);
        };
        for (const [id, ctor] of services) {
            define(id, ctor);
        }
        const instantiationService = disposables.add(new TestInstantiationService(serviceCollection, true));
        disposables.add((0, lifecycle_1.toDisposable)(() => {
            for (const id of serviceIdentifiers) {
                const instanceOrDescriptor = serviceCollection.get(id);
                if (typeof instanceOrDescriptor.dispose === 'function') {
                    instanceOrDescriptor.dispose();
                }
            }
        }));
        return instantiationService;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFudGlhdGlvblNlcnZpY2VNb2NrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vaW5zdGFudGlhdGlvbi90ZXN0L2NvbW1vbi9pbnN0YW50aWF0aW9uU2VydmljZU1vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0poRyx3Q0E2QkM7SUEvSkQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxFQUFZLEVBQXdCLEVBQUUsQ0FBQyxFQUFFLElBQUksV0FBVyxJQUFJLEVBQUUsQ0FBQztJQUV2RixNQUFhLHdCQUF5QixTQUFRLDJDQUFvQjtRQUlqRSxZQUFvQixxQkFBd0MsSUFBSSxxQ0FBaUIsRUFBRSxFQUFFLFNBQWtCLEtBQUssRUFBRSxNQUFpQyxFQUFVLGNBQXdCO1lBQ2hMLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFEdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE2QztZQUFzRSxtQkFBYyxHQUFkLGNBQWMsQ0FBVTtZQUdoTCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1FBQzVELENBQUM7UUFFTSxHQUFHLENBQUksT0FBNkI7WUFDMUMsT0FBTyxLQUFLLENBQUMsMkJBQTJCLENBQUMsT0FBTyxFQUFFLDRCQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFDekcsQ0FBQztRQUVNLEdBQUcsQ0FBSSxPQUE2QixFQUFFLFFBQVc7WUFDdkQsT0FBVSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRU0sSUFBSSxDQUFJLE9BQTZCO1lBQzNDLE9BQVUsSUFBSSxDQUFDLE9BQU8sQ0FB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