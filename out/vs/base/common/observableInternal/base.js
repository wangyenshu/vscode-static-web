/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/equals", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/logging"], function (require, exports, equals_1, debugName_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisposableObservableValue = exports.ObservableValue = exports.TransactionImpl = exports.BaseObservable = exports.ConvenientObservable = void 0;
    exports._setRecomputeInitiallyAndOnChange = _setRecomputeInitiallyAndOnChange;
    exports._setKeepObserved = _setKeepObserved;
    exports._setDerivedOpts = _setDerivedOpts;
    exports.transaction = transaction;
    exports.globalTransaction = globalTransaction;
    exports.asyncTransaction = asyncTransaction;
    exports.subtransaction = subtransaction;
    exports.observableValue = observableValue;
    exports.observableValueOpts = observableValueOpts;
    exports.disposableObservableValue = disposableObservableValue;
    let _recomputeInitiallyAndOnChange;
    function _setRecomputeInitiallyAndOnChange(recomputeInitiallyAndOnChange) {
        _recomputeInitiallyAndOnChange = recomputeInitiallyAndOnChange;
    }
    let _keepObserved;
    function _setKeepObserved(keepObserved) {
        _keepObserved = keepObserved;
    }
    let _derived;
    /**
     * @internal
     * This is to allow splitting files.
    */
    function _setDerivedOpts(derived) {
        _derived = derived;
    }
    class ConvenientObservable {
        get TChange() { return null; }
        reportChanges() {
            this.get();
        }
        /** @sealed */
        read(reader) {
            if (reader) {
                return reader.readObservable(this);
            }
            else {
                return this.get();
            }
        }
        map(fnOrOwner, fnOrUndefined) {
            const owner = fnOrUndefined === undefined ? undefined : fnOrOwner;
            const fn = fnOrUndefined === undefined ? fnOrOwner : fnOrUndefined;
            return _derived({
                owner,
                debugName: () => {
                    const name = (0, debugName_1.getFunctionName)(fn);
                    if (name !== undefined) {
                        return name;
                    }
                    // regexp to match `x => x.y` or `x => x?.y` where x and y can be arbitrary identifiers (uses backref):
                    const regexp = /^\s*\(?\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*\)?\s*=>\s*\1(?:\??)\.([a-zA-Z_$][a-zA-Z_$0-9]*)\s*$/;
                    const match = regexp.exec(fn.toString());
                    if (match) {
                        return `${this.debugName}.${match[2]}`;
                    }
                    if (!owner) {
                        return `${this.debugName} (mapped)`;
                    }
                    return undefined;
                },
                debugReferenceFn: fn,
            }, (reader) => fn(this.read(reader), reader));
        }
        recomputeInitiallyAndOnChange(store, handleValue) {
            store.add(_recomputeInitiallyAndOnChange(this, handleValue));
            return this;
        }
        /**
         * Ensures that this observable is observed. This keeps the cache alive.
         * However, in case of deriveds, it does not force eager evaluation (only when the value is read/get).
         * Use `recomputeInitiallyAndOnChange` for eager evaluation.
         */
        keepObserved(store) {
            store.add(_keepObserved(this));
            return this;
        }
        get debugValue() {
            return this.get();
        }
    }
    exports.ConvenientObservable = ConvenientObservable;
    class BaseObservable extends ConvenientObservable {
        constructor() {
            super(...arguments);
            this.observers = new Set();
        }
        addObserver(observer) {
            const len = this.observers.size;
            this.observers.add(observer);
            if (len === 0) {
                this.onFirstObserverAdded();
            }
        }
        removeObserver(observer) {
            const deleted = this.observers.delete(observer);
            if (deleted && this.observers.size === 0) {
                this.onLastObserverRemoved();
            }
        }
        onFirstObserverAdded() { }
        onLastObserverRemoved() { }
    }
    exports.BaseObservable = BaseObservable;
    /**
     * Starts a transaction in which many observables can be changed at once.
     * {@link fn} should start with a JS Doc using `@description` to give the transaction a debug name.
     * Reaction run on demand or when the transaction ends.
     */
    function transaction(fn, getDebugName) {
        const tx = new TransactionImpl(fn, getDebugName);
        try {
            fn(tx);
        }
        finally {
            tx.finish();
        }
    }
    let _globalTransaction = undefined;
    function globalTransaction(fn) {
        if (_globalTransaction) {
            fn(_globalTransaction);
        }
        else {
            const tx = new TransactionImpl(fn, undefined);
            _globalTransaction = tx;
            try {
                fn(tx);
            }
            finally {
                tx.finish(); // During finish, more actions might be added to the transaction.
                // Which is why we only clear the global transaction after finish.
                _globalTransaction = undefined;
            }
        }
    }
    async function asyncTransaction(fn, getDebugName) {
        const tx = new TransactionImpl(fn, getDebugName);
        try {
            await fn(tx);
        }
        finally {
            tx.finish();
        }
    }
    /**
     * Allows to chain transactions.
     */
    function subtransaction(tx, fn, getDebugName) {
        if (!tx) {
            transaction(fn, getDebugName);
        }
        else {
            fn(tx);
        }
    }
    class TransactionImpl {
        constructor(_fn, _getDebugName) {
            this._fn = _fn;
            this._getDebugName = _getDebugName;
            this.updatingObservers = [];
            (0, logging_1.getLogger)()?.handleBeginTransaction(this);
        }
        getDebugName() {
            if (this._getDebugName) {
                return this._getDebugName();
            }
            return (0, debugName_1.getFunctionName)(this._fn);
        }
        updateObserver(observer, observable) {
            // When this gets called while finish is active, they will still get considered
            this.updatingObservers.push({ observer, observable });
            observer.beginUpdate(observable);
        }
        finish() {
            const updatingObservers = this.updatingObservers;
            for (let i = 0; i < updatingObservers.length; i++) {
                const { observer, observable } = updatingObservers[i];
                observer.endUpdate(observable);
            }
            // Prevent anyone from updating observers from now on.
            this.updatingObservers = null;
            (0, logging_1.getLogger)()?.handleEndTransaction();
        }
    }
    exports.TransactionImpl = TransactionImpl;
    function observableValue(nameOrOwner, initialValue) {
        let debugNameData;
        if (typeof nameOrOwner === 'string') {
            debugNameData = new debugName_1.DebugNameData(undefined, nameOrOwner, undefined);
        }
        else {
            debugNameData = new debugName_1.DebugNameData(nameOrOwner, undefined, undefined);
        }
        return new ObservableValue(debugNameData, initialValue, equals_1.strictEquals);
    }
    function observableValueOpts(options, initialValue) {
        return new ObservableValue(new debugName_1.DebugNameData(options.owner, options.debugName, undefined), initialValue, options.equalsFn ?? equals_1.strictEquals);
    }
    class ObservableValue extends BaseObservable {
        get debugName() {
            return this._debugNameData.getDebugName(this) ?? 'ObservableValue';
        }
        constructor(_debugNameData, initialValue, _equalityComparator) {
            super();
            this._debugNameData = _debugNameData;
            this._equalityComparator = _equalityComparator;
            this._value = initialValue;
        }
        get() {
            return this._value;
        }
        set(value, tx, change) {
            if (this._equalityComparator(this._value, value)) {
                return;
            }
            let _tx;
            if (!tx) {
                tx = _tx = new TransactionImpl(() => { }, () => `Setting ${this.debugName}`);
            }
            try {
                const oldValue = this._value;
                this._setValue(value);
                (0, logging_1.getLogger)()?.handleObservableChanged(this, { oldValue, newValue: value, change, didChange: true, hadValue: true });
                for (const observer of this.observers) {
                    tx.updateObserver(observer, this);
                    observer.handleChange(this, change);
                }
            }
            finally {
                if (_tx) {
                    _tx.finish();
                }
            }
        }
        toString() {
            return `${this.debugName}: ${this._value}`;
        }
        _setValue(newValue) {
            this._value = newValue;
        }
    }
    exports.ObservableValue = ObservableValue;
    /**
     * A disposable observable. When disposed, its value is also disposed.
     * When a new value is set, the previous value is disposed.
     */
    function disposableObservableValue(nameOrOwner, initialValue) {
        let debugNameData;
        if (typeof nameOrOwner === 'string') {
            debugNameData = new debugName_1.DebugNameData(undefined, nameOrOwner, undefined);
        }
        else {
            debugNameData = new debugName_1.DebugNameData(nameOrOwner, undefined, undefined);
        }
        return new DisposableObservableValue(debugNameData, initialValue, equals_1.strictEquals);
    }
    class DisposableObservableValue extends ObservableValue {
        _setValue(newValue) {
            if (this._value === newValue) {
                return;
            }
            if (this._value) {
                this._value.dispose();
            }
            this._value = newValue;
        }
        dispose() {
            this._value?.dispose();
        }
    }
    exports.DisposableObservableValue = DisposableObservableValue;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL29ic2VydmFibGVJbnRlcm5hbC9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThKaEcsOEVBRUM7SUFHRCw0Q0FFQztJQVFELDBDQUVDO0lBMEdELGtDQU9DO0lBSUQsOENBY0M7SUFFRCw0Q0FPQztJQUtELHdDQU1DO0lBZ0RELDBDQVFDO0lBRUQsa0RBV0M7SUE2REQsOERBUUM7SUFuVEQsSUFBSSw4QkFBb0UsQ0FBQztJQUN6RSxTQUFnQixpQ0FBaUMsQ0FBQyw2QkFBb0U7UUFDckgsOEJBQThCLEdBQUcsNkJBQTZCLENBQUM7SUFDaEUsQ0FBQztJQUVELElBQUksYUFBa0MsQ0FBQztJQUN2QyxTQUFnQixnQkFBZ0IsQ0FBQyxZQUFrQztRQUNsRSxhQUFhLEdBQUcsWUFBWSxDQUFDO0lBQzlCLENBQUM7SUFHRCxJQUFJLFFBQTRCLENBQUM7SUFDakM7OztNQUdFO0lBQ0YsU0FBZ0IsZUFBZSxDQUFDLE9BQXdCO1FBQ3ZELFFBQVEsR0FBRyxPQUFPLENBQUM7SUFDcEIsQ0FBQztJQUVELE1BQXNCLG9CQUFvQjtRQUN6QyxJQUFJLE9BQU8sS0FBYyxPQUFPLElBQUssQ0FBQyxDQUFDLENBQUM7UUFJakMsYUFBYTtZQUNuQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDWixDQUFDO1FBS0QsY0FBYztRQUNQLElBQUksQ0FBQyxNQUEyQjtZQUN0QyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFL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