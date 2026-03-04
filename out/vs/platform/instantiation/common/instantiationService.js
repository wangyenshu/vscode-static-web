/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/graph", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/base/common/linkedList"], function (require, exports, async_1, errors_1, lifecycle_1, descriptors_1, graph_1, instantiation_1, serviceCollection_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Trace = exports.InstantiationService = void 0;
    // TRACING
    const _enableAllTracing = false;
    class CyclicDependencyError extends Error {
        constructor(graph) {
            super('cyclic dependency between services');
            this.message = graph.findCycleSlow() ?? `UNABLE to detect cycle, dumping graph: \n${graph.toString()}`;
        }
    }
    class InstantiationService {
        constructor(_services = new serviceCollection_1.ServiceCollection(), _strict = false, _parent, _enableTracing = _enableAllTracing) {
            this._services = _services;
            this._strict = _strict;
            this._parent = _parent;
            this._enableTracing = _enableTracing;
            this._isDisposed = false;
            this._servicesToMaybeDispose = new Set();
            this._children = new Set();
            this._activeInstantiations = new Set();
            this._services.set(instantiation_1.IInstantiationService, this);
            this._globalGraph = _enableTracing ? _parent?._globalGraph ?? new graph_1.Graph(e => e) : undefined;
        }
        dispose() {
            if (!this._isDisposed) {
                this._isDisposed = true;
                // dispose all child services
                (0, lifecycle_1.dispose)(this._children);
                this._children.clear();
                // dispose all services created by this service
                for (const candidate of this._servicesToMaybeDispose) {
                    if ((0, lifecycle_1.isDisposable)(candidate)) {
                        candidate.dispose();
                    }
                }
                this._servicesToMaybeDispose.clear();
            }
        }
        _throwIfDisposed() {
            if (this._isDisposed) {
                throw new Error('InstantiationService has been disposed');
            }
        }
        createChild(services) {
            this._throwIfDisposed();
            const result = new class extends InstantiationService {
                dispose() {
                    this._children.delete(result);
                    super.dispose();
                }
            }(services, this._strict, this, this._enableTracing);
            this._children.add(result);
            return result;
        }
        invokeFunction(fn, ...args) {
            this._throwIfDisposed();
            const _trace = Trace.traceInvocation(this._enableTracing, fn);
            let _done = false;
            try {
                const accessor = {
                    get: (id) => {
                        if (_done) {
                            throw (0, errors_1.illegalState)('service accessor is only valid during the invocation of its target method');
                        }
                        const result = this._getOrCreateServiceInstance(id, _trace);
                        if (!result) {
                            throw new Error(`[invokeFunction] unknown service '${id}'`);
                        }
                        return result;
                    }
                };
                return fn(accessor, ...args);
            }
            finally {
                _done = true;
                _trace.stop();
            }
        }
        createInstance(ctorOrDescriptor, ...rest) {
            this._throwIfDisposed();
            let _trace;
            let result;
            if (ctorOrDescriptor instanceof descriptors_1.SyncDescriptor) {
                _trace = Trace.traceCreation(this._enableTracing, ctorOrDescriptor.ctor);
                result = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.staticArguments.concat(rest), _trace);
            }
            else {
                _trace = Trace.traceCreation(this._enableTracing, ctorOrDescriptor);
                result = this._createInstance(ctorOrDescriptor, rest, _trace);
            }
            _trace.stop();
            return result;
        }
        _createInstance(ctor, args = [], _trace) {
            // arguments defined by service decorators
            const serviceDependencies = instantiation_1._util.getServiceDependencies(ctor).sort((a, b) => a.index - b.index);
            const serviceArgs = [];
            for (const dependency of serviceDependencies) {
                const service = this._getOrCreateServiceInstance(dependency.id, _trace);
                if (!service) {
                    this._throwIfStrict(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`, false);
                }
                serviceArgs.push(service);
            }
            const firstServiceArgPos = serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;
            // check for argument mismatches, adjust static args if needed
            if (args.length !== firstServiceArgPos) {
                console.trace(`[createInstance] First service dependency of ${ctor.name} at position ${firstServiceArgPos + 1} conflicts with ${args.length} static arguments`);
                const delta = firstServiceArgPos - args.length;
                if (delta > 0) {
                    args = args.concat(new Array(delta));
                }
                else {
                    args = args.slice(0, firstServiceArgPos);
                }
            }
            // now create the instance
            return Reflect.construct(ctor, args.concat(serviceArgs));
        }
        _setCreatedServiceInstance(id, instance) {
            if (this._services.get(id) instanceof descriptors_1.SyncDescriptor) {
                this._services.set(id, instance);
            }
            else if (this._parent) {
                this._parent._setCreatedServiceInstance(id, instance);
            }
            else {
                throw new Error('illegalState - setting UNKNOWN service instance');
            }
        }
        _getServiceInstanceOrDescriptor(id) {
            const instanceOrDesc = this._services.get(id);
            if (!instanceOrDesc && this._parent) {
                return this._parent._getServiceInstanceOrDescriptor(id);
            }
            else {
                return instanceOrDesc;
            }
        }
        _getOrCreateServiceInstance(id, _trace) {
            if (this._globalGraph && this._globalGraphImplicitDependency) {
                this._globalGraph.insertEdge(this._globalGraphImplicitDependency, String(id));
            }
            const thing = this._getServiceInstanceOrDescriptor(id);
            if (thing instanceof descriptors_1.SyncDescriptor) {
                return this._safeCreateAndCacheServiceInstance(id, thing, _trace.branch(id, true));
            }
            else {
                _trace.branch(id, false);
                return thing;
            }
        }
        _safeCreateAndCacheServiceInstance(id, desc, _trace) {
            if (this._activeInstantiations.has(id)) {
                throw new Error(`illegal state - RECURSIVELY instantiating service '${id}'`);
            }
            this._activeInstantiations.add(id);
            try {
                return this._createAndCacheServiceInstance(id, desc, _trace);
            }
            finally {
                this._activeInstantiations.delete(id);
            }
        }
        _createAndCacheServiceInstance(id, desc, _trace) {
            const graph = new graph_1.Graph(data => data.id.toString());
            let cycleCount = 0;
            const stack = [{ id, desc, _trace }];
            while (stack.length) {
                const item = stack.pop();
                graph.lookupOrInsertNode(item);
                // a weak but working heuristic for cycle checks
                if (cycleCount++ > 1000) {
                    throw new CyclicDependencyError(graph);
                }
                // check all dependencies for existence and if they need to be created first
                for (const dependency of instantiation_1._util.getServiceDependencies(item.desc.ctor)) {
                    const instanceOrDesc = this._getServiceInstanceOrDescriptor(dependency.id);
                    if (!instanceOrDesc) {
                        this._throwIfStrict(`[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`, true);
                    }
                    // take note of all service dependencies
                    this._globalGraph?.insertEdge(String(item.id), String(dependency.id));
                    if (instanceOrDesc instanceof descriptors_1.SyncDescriptor) {
                        const d = { id: dependency.id, desc: instanceOrDesc, _trace: item._trace.branch(dependency.id, true) };
                        graph.insertEdge(item, d);
                        stack.push(d);
                    }
                }
            }
            while (true) {
                const roots = graph.roots();
                // if there is no more roots but still
                // nodes in the graph we have a cycle
                if (roots.length === 0) {
                    if (!graph.isEmpty()) {
                        throw new CyclicDependencyError(graph);
                    }
                    break;
                }
                for (const { data } of roots) {
                    // Repeat the check for this still being a service sync descriptor. That's because
                    // instantiating a dependency might have side-effect and recursively trigger instantiation
                    // so that some dependencies are now fullfilled already.
                    const instanceOrDesc = this._getServiceInstanceOrDescriptor(data.id);
                    if (instanceOrDesc instanceof descriptors_1.SyncDescriptor) {
                        // create instance and overwrite the service collections
                        const instance = this._createServiceInstanceWithOwner(data.id, data.desc.ctor, data.desc.staticArguments, data.desc.supportsDelayedInstantiation, data._trace);
                        this._setCreatedServiceInstance(data.id, instance);
                    }
                    graph.removeNode(data);
                }
            }
            return this._getServiceInstanceOrDescriptor(id);
        }
        _createServiceInstanceWithOwner(id, ctor, args = [], supportsDelayedInstantiation, _trace) {
            if (this._services.get(id) instanceof descriptors_1.SyncDescriptor) {
                return this._createServiceInstance(id, ctor, args, supportsDelayedInstantiation, _trace, this._servicesToMaybeDispose);
            }
            else if (this._parent) {
                return this._parent._createServiceInstanceWithOwner(id, ctor, args, supportsDelayedInstantiation, _trace);
            }
            else {
                throw new Error(`illegalState - creating UNKNOWN service instance ${ctor.name}`);
            }
        }
        _createServiceInstance(id, ctor, args = [], supportsDelayedInstantiation, _trace, disposeBucket) {
            if (!supportsDelayedInstantiation) {
                // eager instantiation
                const result = this._createInstance(ctor, args, _trace);
                disposeBucket.add(result);
                return result;
            }
            else {
                const child = new InstantiationService(undefined, this._strict, this, this._enableTracing);
                child._globalGraphImplicitDependency = String(id);
                // Return a proxy object that's backed by an idle value. That
                // strategy is to instantiate services in our idle time or when actually
                // needed but not when injected into a consumer
                // return "empty events" when the service isn't instantiated yet
                const earlyListeners = new Map();
                const idle = new async_1.GlobalIdleValue(() => {
                    const result = child._createInstance(ctor, args, _trace);
                    // early listeners that we kept are now being subscribed to
                    // the real service
                    for (const [key, values] of earlyListeners) {
                        const candidate = result[key];
                        if (typeof candidate === 'function') {
                            for (const value of values) {
                                value.disposable = candidate.apply(result, value.listener);
                            }
                        }
                    }
                    earlyListeners.clear();
                    disposeBucket.add(result);
                    return result;
                });
                return new Proxy(Object.create(null), {
                    get(target, key) {
                        if (!idle.isInitialized) {
                            // looks like an event
                            if (typeof key === 'string' && (key.startsWith('onDid') || key.startsWith('onWill'))) {
                                let list = earlyListeners.get(key);
                                if (!list) {
                                    list = new linkedList_1.LinkedList();
                                    earlyListeners.set(key, list);
                                }
                                const event = (callback, thisArg, disposables) => {
                                    if (idle.isInitialized) {
                                        return idle.value[key](callback, thisArg, disposables);
                                    }
                                    else {
                                        const entry = { listener: [callback, thisArg, disposables], disposable: undefined };
                                        const rm = list.push(entry);
                                        const result = (0, lifecycle_1.toDisposable)(() => {
                                            rm();
                                            entry.disposable?.dispose();
                                        });
                                        return result;
                                    }
                                };
                                return event;
                            }
                        }
                        // value already exists
                        if (key in target) {
                            return target[key];
                        }
                        // create value
                        const obj = idle.value;
                        let prop = obj[key];
                        if (typeof prop !== 'function') {
                            return prop;
                        }
                        prop = prop.bind(obj);
                        target[key] = prop;
                        return prop;
                    },
                    set(_target, p, value) {
                        idle.value[p] = value;
                        return true;
                    },
                    getPrototypeOf(_target) {
                        return ctor.prototype;
                    }
                });
            }
        }
        _throwIfStrict(msg, printWarning) {
            if (printWarning) {
                console.warn(msg);
            }
            if (this._strict) {
                throw new Error(msg);
            }
        }
    }
    exports.InstantiationService = InstantiationService;
    //#region -- tracing ---
    var TraceType;
    (function (TraceType) {
        TraceType[TraceType["None"] = 0] = "None";
        TraceType[TraceType["Creation"] = 1] = "Creation";
        TraceType[TraceType["Invocation"] = 2] = "Invocation";
        TraceType[TraceType["Branch"] = 3] = "Branch";
    })(TraceType || (TraceType = {}));
    class Trace {
        static { this.all = new Set(); }
        static { this._None = new class extends Trace {
            constructor() { super(0 /* TraceType.None */, null); }
            stop() { }
            branch() { return this; }
        }; }
        static traceInvocation(_enableTracing, ctor) {
            return !_enableTracing ? Trace._None : new Trace(2 /* TraceType.Invocation */, ctor.name || new Error().stack.split('\n').slice(3, 4).join('\n'));
        }
        static traceCreation(_enableTracing, ctor) {
            return !_enableTracing ? Trace._None : new Trace(1 /* TraceType.Creation */, ctor.name);
        }
        static { this._totals = 0; }
        constructor(type, name) {
            this.type = type;
            this.name = name;
            this._start = Date.now();
            this._dep = [];
        }
        branch(id, first) {
            const child = new Trace(3 /* TraceType.Branch */, id.toString());
            this._dep.push([id, first, child]);
            return child;
        }
        stop() {
            const dur = Date.now() - this._start;
            Trace._totals += dur;
            let causedCreation = false;
            function printChild(n, trace) {
                const res = [];
                const prefix = new Array(n + 1).join('\t');
                for (const [id, first, child] of trace._dep) {
                    if (first && child) {
                        causedCreation = true;
                        res.push(`${prefix}CREATES -> ${id}`);
                        const nested = printChild(n + 1, child);
                        if (nested) {
                            res.push(nested);
                        }
                    }
                    else {
                        res.push(`${prefix}uses -> ${id}`);
                    }
                }
                return res.join('\n');
            }
            const lines = [
                `${this.type === 1 /* TraceType.Creation */ ? 'CREATE' : 'CALL'} ${this.name}`,
                `${printChild(1, this)}`,
                `DONE, took ${dur.toFixed(2)}ms (grand total ${Trace._totals.toFixed(2)}ms)`
            ];
            if (dur > 2 || causedCreation) {
                Trace.all.add(lines.join('\n'));
            }
        }
    }
    exports.Trace = Trace;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFudGlhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9pbnN0YW50aWF0aW9uL2NvbW1vbi9pbnN0YW50aWF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsVUFBVTtJQUNWLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUU3QjtJQUVGLE1BQU0scUJBQXNCLFNBQVEsS0FBSztRQUN4QyxZQUFZLEtBQWlCO1lBQzVCLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRSxJQUFJLDRDQUE0QyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztRQUN4RyxDQUFDO0tBQ0Q7SUFFRCxNQUFhLG9CQUFvQjtRQVdoQyxZQUNrQixZQUErQixJQUFJLHFDQUFpQixFQUFFLEVBQ3RELFVBQW1CLEtBQUssRUFDeEIsT0FBOEIsRUFDOUIsaUJBQTBCLGlCQUFpQjtZQUgzQyxjQUFTLEdBQVQsU0FBUyxDQUE2QztZQUN0RCxZQUFPLEdBQVAsT0FBTyxDQUFpQjtZQUN4QixZQUFPLEdBQVAsT0FBTyxDQUF1QjtZQUM5QixtQkFBYyxHQUFkLGNBQWMsQ0FBNkI7WUFSckQsZ0JBQVcsR0FBRyxLQUFLLENBQUM7WUFDWCw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBTyxDQUFDO1lBQ3pDLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztZQTZKNUMsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFwSjFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFDQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxZQUFZLEdBQUcs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