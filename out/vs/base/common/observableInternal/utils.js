/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observableInternal/autorun", "vs/base/common/observableInternal/base", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/derived", "vs/base/common/observableInternal/logging"], function (require, exports, event_1, lifecycle_1, autorun_1, base_1, debugName_1, derived_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueWithChangeEventFromObservable = exports.KeepAliveObserver = exports.FromEventObservable = void 0;
    exports.constObservable = constObservable;
    exports.observableFromPromise = observableFromPromise;
    exports.observableFromEvent = observableFromEvent;
    exports.observableSignalFromEvent = observableSignalFromEvent;
    exports.observableSignal = observableSignal;
    exports.debouncedObservable = debouncedObservable;
    exports.debouncedObservable2 = debouncedObservable2;
    exports.wasEventTriggeredRecently = wasEventTriggeredRecently;
    exports.keepObserved = keepObserved;
    exports.recomputeInitiallyAndOnChange = recomputeInitiallyAndOnChange;
    exports.derivedObservableWithCache = derivedObservableWithCache;
    exports.derivedObservableWithWritableCache = derivedObservableWithWritableCache;
    exports.mapObservableArrayCached = mapObservableArrayCached;
    exports.observableFromValueWithChangeEvent = observableFromValueWithChangeEvent;
    /**
     * Represents an efficient observable whose value never changes.
     */
    function constObservable(value) {
        return new ConstObservable(value);
    }
    class ConstObservable extends base_1.ConvenientObservable {
        constructor(value) {
            super();
            this.value = value;
        }
        get debugName() {
            return this.toString();
        }
        get() {
            return this.value;
        }
        addObserver(observer) {
            // NO OP
        }
        removeObserver(observer) {
            // NO OP
        }
        toString() {
            return `Const: ${this.value}`;
        }
    }
    function observableFromPromise(promise) {
        const observable = (0, base_1.observableValue)('promiseValue', {});
        promise.then((value) => {
            observable.set({ value }, undefined);
        });
        return observable;
    }
    function observableFromEvent(event, getValue) {
        return new FromEventObservable(event, getValue);
    }
    class FromEventObservable extends base_1.BaseObservable {
        constructor(event, _getValue) {
            super();
            this.event = event;
            this._getValue = _getValue;
            this.hasValue = false;
            this.handleEvent = (args) => {
                const newValue = this._getValue(args);
                const oldValue = this.value;
                const didChange = !this.hasValue || oldValue !== newValue;
                let didRunTransaction = false;
                if (didChange) {
                    this.value = newValue;
                    if (this.hasValue) {
                        didRunTransaction = true;
                        (0, base_1.subtransaction)(FromEventObservable.globalTransaction, (tx) => {
                            (0, logging_1.getLogger)()?.handleFromEventObservableTriggered(this, { oldValue, newValue, change: undefined, didChange, hadValue: this.hasValue });
                            for (const o of this.observers) {
                                tx.updateObserver(o, this);
                                o.handleChange(this, undefined);
                            }
                        }, () => {
                            const name = this.getDebugName();
                            return 'Event fired' + (name ? `: ${name}` : '');
                        });
                    }
                    this.hasValue = true;
                }
                if (!didRunTransaction) {
                    (0, logging_1.getLogger)()?.handleFromEventObservableTriggered(this, { oldValue, newValue, change: undefined, didChange, hadValue: this.hasValue });
                }
            };
        }
        getDebugName() {
            return (0, debugName_1.getFunctionName)(this._getValue);
        }
        get debugName() {
            const name = this.getDebugName();
            return 'From Event' + (name ? `: ${name}` : '');
        }
        onFirstObserverAdded() {
            this.subscription = this.event(this.handleEvent);
        }
        onLastObserverRemoved() {
            this.subscription.dispose();
            this.subscription = undefined;
            this.hasValue = false;
            this.value = undefined;
        }
        get() {
            if (this.subscription) {
                if (!this.hasValue) {
                    this.handleEvent(undefined);
                }
                return this.value;
            }
            else {
                // no cache, as there are no subscribers to keep it updated
                const value = this._getValue(undefined);
                return value;
            }
        }
    }
    exports.FromEventObservable = FromEventObservable;
    (function (observableFromEvent) {
        observableFromEvent.Observer = FromEventObservable;
        function batchEventsGlobally(tx, fn) {
            let didSet = false;
            if (FromEventObservable.globalTransaction === undefined) {
                FromEventObservable.globalTransaction = tx;
                didSet = true;
            }
            try {
                fn();
            }
            finally {
                if (didSet) {
                    FromEventObservable.globalTransaction = undefined;
                }
            }
        }
        observableFromEvent.batchEventsGlobally = batchEventsGlobally;
    })(observableFromEvent || (exports.observableFromEvent = observableFromEvent = {}));
    function observableSignalFromEvent(debugName, event) {
        return new FromEventObservableSignal(debugName, event);
    }
    class FromEventObservableSignal extends base_1.BaseObservable {
        constructor(debugName, event) {
            super();
            this.debugName = debugName;
            this.event = event;
            this.handleEvent = () => {
                (0, base_1.transaction)((tx) => {
                    for (const o of this.observers) {
                        tx.updateObserver(o, this);
                        o.handleChange(this, undefined);
                    }
                }, () => this.debugName);
            };
        }
        onFirstObserverAdded() {
            this.subscription = this.event(this.handleEvent);
        }
        onLastObserverRemoved() {
            this.subscription.dispose();
            this.subscription = undefined;
        }
        get() {
            // NO OP
        }
    }
    function observableSignal(debugNameOrOwner) {
        if (typeof debugNameOrOwner === 'string') {
            return new ObservableSignal(debugNameOrOwner);
        }
        else {
            return new ObservableSignal(undefined, debugNameOrOwner);
        }
    }
    class ObservableSignal extends base_1.BaseObservable {
        get debugName() {
            return new debugName_1.DebugNameData(this._owner, this._debugName, undefined).getDebugName(this) ?? 'Observable Signal';
        }
        constructor(_debugName, _owner) {
            super();
            this._debugName = _debugName;
            this._owner = _owner;
        }
        trigger(tx, change) {
            if (!tx) {
                (0, base_1.transaction)(tx => {
                    this.trigger(tx, change);
                }, () => `Trigger signal ${this.debugName}`);
                return;
            }
            for (const o of this.observers) {
                tx.updateObserver(o, this);
                o.handleChange(this, change);
            }
        }
        get() {
            // NO OP
        }
    }
    /**
     * @deprecated Use `debouncedObservable2` instead.
     */
    function debouncedObservable(observable, debounceMs, disposableStore) {
        const debouncedObservable = (0, base_1.observableValue)('debounced', undefined);
        let timeout = undefined;
        disposableStore.add((0, autorun_1.autorun)(reader => {
            /** @description debounce */
            const value = observable.read(reader);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                (0, base_1.transaction)(tx => {
                    debouncedObservable.set(value, tx);
                });
            }, debounceMs);
        }));
        return debouncedObservable;
    }
    /**
     * Creates an observable that debounces the input observable.
     */
    function debouncedObservable2(observable, debounceMs) {
        let hasValue = false;
        let lastValue;
        let timeout = undefined;
        return observableFromEvent(cb => {
            const d = (0, autorun_1.autorun)(reader => {
                const value = observable.read(reader);
                if (!hasValue) {
                    hasValue = true;
                    lastValue = value;
                }
                else {
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                    timeout = setTimeout(() => {
                        lastValue = value;
                        cb();
                    }, debounceMs);
                }
            });
            return {
                dispose() {
                    d.dispose();
                    hasValue = false;
                    lastValue = undefined;
                },
            };
        }, () => {
            if (hasValue) {
                return lastValue;
            }
            else {
                return observable.get();
            }
        });
    }
    function wasEventTriggeredRecently(event, timeoutMs, disposableStore) {
        const observable = (0, base_1.observableValue)('triggeredRecently', false);
        let timeout = undefined;
        disposableStore.add(event(() => {
            observable.set(true, undefined);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                observable.set(false, undefined);
            }, timeoutMs);
        }));
        return observable;
    }
    /**
     * This makes sure the observable is being observed and keeps its cache alive.
     */
    function keepObserved(observable) {
        const o = new KeepAliveObserver(false, undefined);
        observable.addObserver(o);
        return (0, lifecycle_1.toDisposable)(() => {
            observable.removeObserver(o);
        });
    }
    (0, base_1._setKeepObserved)(keepObserved);
    /**
     * This converts the given observable into an autorun.
     */
    function recomputeInitiallyAndOnChange(observable, handleValue) {
        const o = new KeepAliveObserver(true, handleValue);
        observable.addObserver(o);
        if (handleValue) {
            handleValue(observable.get());
        }
        else {
            observable.reportChanges();
        }
        return (0, lifecycle_1.toDisposable)(() => {
            observable.removeObserver(o);
        });
    }
    (0, base_1._setRecomputeInitiallyAndOnChange)(recomputeInitiallyAndOnChange);
    class KeepAliveObserver {
        constructor(_forceRecompute, _handleValue) {
            this._forceRecompute = _forceRecompute;
            this._handleValue = _handleValue;
            this._counter = 0;
        }
        beginUpdate(observable) {
            this._counter++;
        }
        endUpdate(observable) {
            this._counter--;
            if (this._counter === 0 && this._forceRecompute) {
                if (this._handleValue) {
                    this._handleValue(observable.get());
                }
                else {
                    observable.reportChanges();
                }
            }
        }
        handlePossibleChange(observable) {
            // NO OP
        }
        handleChange(observable, change) {
            // NO OP
        }
    }
    exports.KeepAliveObserver = KeepAliveObserver;
    function derivedObservableWithCache(owner, computeFn) {
        let lastValue = undefined;
        const observable = (0, derived_1.derived)(owner, reader => {
            lastValue = computeFn(reader, lastValue);
            return lastValue;
        });
        return observable;
    }
    function derivedObservableWithWritableCache(owner, computeFn) {
        let lastValue = undefined;
        const onChange = observableSignal('derivedObservableWithWritableCache');
        const observable = (0, derived_1.derived)(owner, reader => {
            onChange.read(reader);
            lastValue = computeFn(reader, lastValue);
            return lastValue;
        });
        return Object.assign(observable, {
            clearCache: (tx) => {
                lastValue = undefined;
                onChange.trigger(tx);
            },
            setCache: (newValue, tx) => {
                lastValue = newValue;
                onChange.trigger(tx);
            }
        });
    }
    /**
     * When the items array changes, referential equal items are not mapped again.
     */
    function mapObservableArrayCached(owner, items, map, keySelector) {
        let m = new ArrayMap(map, keySelector);
        const self = (0, derived_1.derivedOpts)({
            debugReferenceFn: map,
            owner,
            onLastObserverRemoved: () => {
                m.dispose();
                m = new ArrayMap(map);
            }
        }, (reader) => {
            m.setItems(items.read(reader));
            return m.getItems();
        });
        return self;
    }
    class ArrayMap {
        constructor(_map, _keySelector) {
            this._map = _map;
            this._keySelector = _keySelector;
            this._cache = new Map();
            this._items = [];
        }
        dispose() {
            this._cache.forEach(entry => entry.store.dispose());
            this._cache.clear();
        }
        setItems(items) {
            const newItems = [];
            const itemsToRemove = new Set(this._cache.keys());
            for (const item of items) {
                const key = this._keySelector ? this._keySelector(item) : item;
                let entry = this._cache.get(key);
                if (!entry) {
                    const store = new lifecycle_1.DisposableStore();
                    const out = this._map(item, store);
                    entry = { out, store };
                    this._cache.set(key, entry);
                }
                else {
                    itemsToRemove.delete(key);
                }
                newItems.push(entry.out);
            }
            for (const item of itemsToRemove) {
                const entry = this._cache.get(item);
                entry.store.dispose();
                this._cache.delete(item);
            }
            this._items = newItems;
        }
        getItems() {
            return this._items;
        }
    }
    class ValueWithChangeEventFromObservable {
        constructor(observable) {
            this.observable = observable;
        }
        get onDidChange() {
            return event_1.Event.fromObservableLight(this.observable);
        }
        get value() {
            return this.observable.get();
        }
    }
    exports.ValueWithChangeEventFromObservable = ValueWithChangeEventFromObservable;
    function observableFromValueWithChangeEvent(_owner, value) {
        if (value instanceof ValueWithChangeEventFromObservable) {
            return value.observable;
        }
        return observableFromEvent(value.onDidChange, () => value.value);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9vYnNlcnZhYmxlSW50ZXJuYWwvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLDBDQUVDO0lBMkJELHNEQU1DO0lBRUQsa0RBS0M7SUF5R0QsOERBS0M7SUE2Q0QsNENBTUM7SUF3Q0Qsa0RBcUJDO0lBS0Qsb0RBcUNDO0lBRUQsOERBaUJDO0lBS0Qsb0NBTUM7SUFPRCxzRUFZQztJQW9DRCxnRUFPQztJQUVELGdGQW1CQztJQUtELDREQWNDO0lBOERELGdGQUtDO0lBNWZEOztPQUVHO0lBQ0gsU0FBZ0IsZUFBZSxDQUFJLEtBQVE7UUFDMUMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsTUFBTSxlQUFtQixTQUFRLDJCQUE2QjtRQUM3RCxZQUE2QixLQUFRO1lBQ3BDLEtBQUssRUFBRSxDQUFDO1lBRG9CLFVBQUssR0FBTCxLQUFLLENBQUc7UUFFckMsQ0FBQztRQUVELElBQW9CLFNBQVM7WUFDNUIsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVNLEdBQUc7WUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUNNLFdBQVcsQ0FBQyxRQUFtQjtZQUNyQyxRQUFRO1FBQ1QsQ0FBQztRQUNNLGNBQWMsQ0FBQyxRQUFtQjtZQUN4QyxRQUFRO1FBQ1QsQ0FBQztRQUVRLFFBQVE7WUFDaEIsT0FBTyxVQUFVLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMvQixDQUFDO0tBQ0Q7SUFHRCxTQUFnQixxQkFBcUIsQ0FBSSxPQUFtQjtRQUMzRCxNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFlLEVBQWdCLGNBQWMs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