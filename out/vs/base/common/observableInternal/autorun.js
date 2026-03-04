/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/lifecycle", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/logging"], function (require, exports, assert_1, lifecycle_1, debugName_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutorunObserver = void 0;
    exports.autorun = autorun;
    exports.autorunOpts = autorunOpts;
    exports.autorunHandleChanges = autorunHandleChanges;
    exports.autorunWithStoreHandleChanges = autorunWithStoreHandleChanges;
    exports.autorunWithStore = autorunWithStore;
    exports.autorunDelta = autorunDelta;
    /**
     * Runs immediately and whenever a transaction ends and an observed observable changed.
     * {@link fn} should start with a JS Doc using `@description` to name the autorun.
     */
    function autorun(fn) {
        return new AutorunObserver(new debugName_1.DebugNameData(undefined, undefined, fn), fn, undefined, undefined);
    }
    /**
     * Runs immediately and whenever a transaction ends and an observed observable changed.
     * {@link fn} should start with a JS Doc using `@description` to name the autorun.
     */
    function autorunOpts(options, fn) {
        return new AutorunObserver(new debugName_1.DebugNameData(options.owner, options.debugName, options.debugReferenceFn ?? fn), fn, undefined, undefined);
    }
    /**
     * Runs immediately and whenever a transaction ends and an observed observable changed.
     * {@link fn} should start with a JS Doc using `@description` to name the autorun.
     *
     * Use `createEmptyChangeSummary` to create a "change summary" that can collect the changes.
     * Use `handleChange` to add a reported change to the change summary.
     * The run function is given the last change summary.
     * The change summary is discarded after the run function was called.
     *
     * @see autorun
     */
    function autorunHandleChanges(options, fn) {
        return new AutorunObserver(new debugName_1.DebugNameData(options.owner, options.debugName, options.debugReferenceFn ?? fn), fn, options.createEmptyChangeSummary, options.handleChange);
    }
    /**
     * @see autorunHandleChanges (but with a disposable store that is cleared before the next run or on dispose)
     */
    function autorunWithStoreHandleChanges(options, fn) {
        const store = new lifecycle_1.DisposableStore();
        const disposable = autorunHandleChanges({
            owner: options.owner,
            debugName: options.debugName,
            debugReferenceFn: options.debugReferenceFn,
            createEmptyChangeSummary: options.createEmptyChangeSummary,
            handleChange: options.handleChange,
        }, (reader, changeSummary) => {
            store.clear();
            fn(reader, changeSummary, store);
        });
        return (0, lifecycle_1.toDisposable)(() => {
            disposable.dispose();
            store.dispose();
        });
    }
    /**
     * @see autorun (but with a disposable store that is cleared before the next run or on dispose)
     */
    function autorunWithStore(fn) {
        const store = new lifecycle_1.DisposableStore();
        const disposable = autorunOpts({
            owner: undefined,
            debugName: undefined,
            debugReferenceFn: fn,
        }, reader => {
            store.clear();
            fn(reader, store);
        });
        return (0, lifecycle_1.toDisposable)(() => {
            disposable.dispose();
            store.dispose();
        });
    }
    function autorunDelta(observable, handler) {
        let _lastValue;
        return autorunOpts({ debugReferenceFn: handler }, (reader) => {
            const newValue = observable.read(reader);
            const lastValue = _lastValue;
            _lastValue = newValue;
            handler({ lastValue, newValue });
        });
    }
    var AutorunState;
    (function (AutorunState) {
        /**
         * A dependency could have changed.
         * We need to explicitly ask them if at least one dependency changed.
         */
        AutorunState[AutorunState["dependenciesMightHaveChanged"] = 1] = "dependenciesMightHaveChanged";
        /**
         * A dependency changed and we need to recompute.
         */
        AutorunState[AutorunState["stale"] = 2] = "stale";
        AutorunState[AutorunState["upToDate"] = 3] = "upToDate";
    })(AutorunState || (AutorunState = {}));
    class AutorunObserver {
        get debugName() {
            return this._debugNameData.getDebugName(this) ?? '(anonymous)';
        }
        constructor(_debugNameData, _runFn, createChangeSummary, _handleChange) {
            this._debugNameData = _debugNameData;
            this._runFn = _runFn;
            this.createChangeSummary = createChangeSummary;
            this._handleChange = _handleChange;
            this.state = 2 /* AutorunState.stale */;
            this.updateCount = 0;
            this.disposed = false;
            this.dependencies = new Set();
            this.dependenciesToBeRemoved = new Set();
            this.changeSummary = this.createChangeSummary?.();
            (0, logging_1.getLogger)()?.handleAutorunCreated(this);
            this._runIfNeeded();
            (0, lifecycle_1.trackDisposable)(this);
        }
        dispose() {
            this.disposed = true;
            for (const o of this.dependencies) {
                o.removeObserver(this);
            }
            this.dependencies.clear();
            (0, lifecycle_1.markAsDisposed)(this);
        }
        _runIfNeeded() {
            if (this.state === 3 /* AutorunState.upToDate */) {
                return;
            }
            const emptySet = this.dependenciesToBeRemoved;
            this.dependenciesToBeRemoved = this.dependencies;
            this.dependencies = emptySet;
            this.state = 3 /* AutorunState.upToDate */;
            const isDisposed = this.disposed;
            try {
                if (!isDisposed) {
                    (0, logging_1.getLogger)()?.handleAutorunTriggered(this);
                    const changeSummary = this.changeSummary;
                    this.changeSummary = this.createChangeSummary?.();
                    this._runFn(this, changeSummary);
                }
            }
            finally {
                if (!isDisposed) {
                    (0, logging_1.getLogger)()?.handleAutorunFinished(this);
                }
                // We don't want our observed observables to think that they are (not even temporarily) not being observed.
                // Thus, we only unsubscribe from observables that are definitely not read anymore.
                for (const o of this.dependenciesToBeRemoved) {
                    o.removeObserver(this);
                }
                this.dependenciesToBeRemoved.clear();
            }
        }
        toString() {
            return `Autorun<${this.debugName}>`;
        }
        // IObserver implementation
        beginUpdate() {
            if (this.state === 3 /* AutorunState.upToDate */) {
                this.state = 1 /* AutorunState.dependenciesMightHaveChanged */;
            }
            this.updateCount++;
        }
        endUpdate() {
            if (this.updateCount === 1) {
                do {
                    if (this.state === 1 /* AutorunState.dependenciesMightHaveChanged */) {
                        this.state = 3 /* AutorunState.upToDate */;
                        for (const d of this.dependencies) {
                            d.reportChanges();
                            if (this.state === 2 /* AutorunState.stale */) {
                                // The other dependencies will refresh on demand
                                break;
                            }
                        }
                    }
                    this._runIfNeeded();
                } while (this.state !== 3 /* AutorunState.upToDate */);
            }
            this.updateCount--;
            (0, assert_1.assertFn)(() => this.updateCount >= 0);
        }
        handlePossibleChange(observable) {
            if (this.state === 3 /* AutorunState.upToDate */ && this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                this.state = 1 /* AutorunState.dependenciesMightHaveChanged */;
            }
        }
        handleChange(observable, change) {
            if (this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                const shouldReact = this._handleChange ? this._handleChange({
                    changedObservable: observable,
                    change,
                    didChange: o => o === observable,
                }, this.changeSummary) : true;
                if (shouldReact) {
                    this.state = 2 /* AutorunState.stale */;
                }
            }
        }
        // IReader implementation
        readObservable(observable) {
            // In case the run action disposes the autorun
            if (this.disposed) {
                return observable.get();
            }
            observable.addObserver(this);
            const value = observable.get();
            this.dependencies.add(observable);
            this.dependenciesToBeRemoved.delete(observable);
            return value;
        }
    }
    exports.AutorunObserver = AutorunObserver;
    (function (autorun) {
        autorun.Observer = AutorunObserver;
    })(autorun || (exports.autorun = autorun = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3J1bi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL29ic2VydmFibGVJbnRlcm5hbC9hdXRvcnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRywwQkFPQztJQU1ELGtDQU9DO0lBYUQsb0RBYUM7SUFLRCxzRUF5QkM7SUFLRCw0Q0FpQkM7SUFFRCxvQ0FXQztJQW5IRDs7O09BR0c7SUFDSCxTQUFnQixPQUFPLENBQUMsRUFBNkI7UUFDcEQsT0FBTyxJQUFJLGVBQWUsQ0FDekIsSUFBSSx5QkFBYSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQzNDLEVBQUUsRUFDRixTQUFTLEVBQ1QsU0FBUyxDQUNULENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0IsV0FBVyxDQUFDLE9BQTRCLEVBQUUsRUFBNkI7UUFDdEYsT0FBTyxJQUFJLGVBQWUsQ0FDekIsSUFBSSx5QkFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDLEVBQ25GLEVBQUUsRUFDRixTQUFTLEVBQ1QsU0FBUyxDQUNULENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILFNBQWdCLG9CQUFvQixDQUNuQyxPQUdDLEVBQ0QsRUFBNEQ7UUFFNUQsT0FBTyxJQUFJLGVBQWUsQ0FDekIsSUFBSSx5QkFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDLEVBQ25GLEVBQUUsRUFDRixPQUFPLENBQUMsd0JBQXdCLEVBQ2hDLE9BQU8sQ0FBQyxZQUFZLENBQ3BCLENBQUM7SUFD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