/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/equals", "vs/base/common/lifecycle", "vs/base/common/observableInternal/base", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/logging"], function (require, exports, assert_1, equals_1, lifecycle_1, base_1, debugName_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Derived = void 0;
    exports.derived = derived;
    exports.derivedOpts = derivedOpts;
    exports.derivedHandleChanges = derivedHandleChanges;
    exports.derivedWithStore = derivedWithStore;
    exports.derivedDisposable = derivedDisposable;
    function derived(computeFnOrOwner, computeFn) {
        if (computeFn !== undefined) {
            return new Derived(new debugName_1.DebugNameData(computeFnOrOwner, undefined, computeFn), computeFn, undefined, undefined, undefined, equals_1.strictEquals);
        }
        return new Derived(new debugName_1.DebugNameData(undefined, undefined, computeFnOrOwner), computeFnOrOwner, undefined, undefined, undefined, equals_1.strictEquals);
    }
    function derivedOpts(options, computeFn) {
        return new Derived(new debugName_1.DebugNameData(options.owner, options.debugName, options.debugReferenceFn), computeFn, undefined, undefined, options.onLastObserverRemoved, options.equalsFn ?? equals_1.strictEquals);
    }
    (0, base_1._setDerivedOpts)(derivedOpts);
    /**
     * Represents an observable that is derived from other observables.
     * The value is only recomputed when absolutely needed.
     *
     * {@link computeFn} should start with a JS Doc using `@description` to name the derived.
     *
     * Use `createEmptyChangeSummary` to create a "change summary" that can collect the changes.
     * Use `handleChange` to add a reported change to the change summary.
     * The compute function is given the last change summary.
     * The change summary is discarded after the compute function was called.
     *
     * @see derived
     */
    function derivedHandleChanges(options, computeFn) {
        return new Derived(new debugName_1.DebugNameData(options.owner, options.debugName, undefined), computeFn, options.createEmptyChangeSummary, options.handleChange, undefined, options.equalityComparer ?? equals_1.strictEquals);
    }
    function derivedWithStore(computeFnOrOwner, computeFnOrUndefined) {
        let computeFn;
        let owner;
        if (computeFnOrUndefined === undefined) {
            computeFn = computeFnOrOwner;
            owner = undefined;
        }
        else {
            owner = computeFnOrOwner;
            computeFn = computeFnOrUndefined;
        }
        const store = new lifecycle_1.DisposableStore();
        return new Derived(new debugName_1.DebugNameData(owner, undefined, computeFn), r => {
            store.clear();
            return computeFn(r, store);
        }, undefined, undefined, () => store.dispose(), equals_1.strictEquals);
    }
    function derivedDisposable(computeFnOrOwner, computeFnOrUndefined) {
        let computeFn;
        let owner;
        if (computeFnOrUndefined === undefined) {
            computeFn = computeFnOrOwner;
            owner = undefined;
        }
        else {
            owner = computeFnOrOwner;
            computeFn = computeFnOrUndefined;
        }
        const store = new lifecycle_1.DisposableStore();
        return new Derived(new debugName_1.DebugNameData(owner, undefined, computeFn), r => {
            store.clear();
            const result = computeFn(r);
            if (result) {
                store.add(result);
            }
            return result;
        }, undefined, undefined, () => store.dispose(), equals_1.strictEquals);
    }
    var DerivedState;
    (function (DerivedState) {
        /** Initial state, no previous value, recomputation needed */
        DerivedState[DerivedState["initial"] = 0] = "initial";
        /**
         * A dependency could have changed.
         * We need to explicitly ask them if at least one dependency changed.
         */
        DerivedState[DerivedState["dependenciesMightHaveChanged"] = 1] = "dependenciesMightHaveChanged";
        /**
         * A dependency changed and we need to recompute.
         * After recomputation, we need to check the previous value to see if we changed as well.
         */
        DerivedState[DerivedState["stale"] = 2] = "stale";
        /**
         * No change reported, our cached value is up to date.
         */
        DerivedState[DerivedState["upToDate"] = 3] = "upToDate";
    })(DerivedState || (DerivedState = {}));
    class Derived extends base_1.BaseObservable {
        get debugName() {
            return this._debugNameData.getDebugName(this) ?? '(anonymous)';
        }
        constructor(_debugNameData, _computeFn, createChangeSummary, _handleChange, _handleLastObserverRemoved = undefined, _equalityComparator) {
            super();
            this._debugNameData = _debugNameData;
            this._computeFn = _computeFn;
            this.createChangeSummary = createChangeSummary;
            this._handleChange = _handleChange;
            this._handleLastObserverRemoved = _handleLastObserverRemoved;
            this._equalityComparator = _equalityComparator;
            this.state = 0 /* DerivedState.initial */;
            this.value = undefined;
            this.updateCount = 0;
            this.dependencies = new Set();
            this.dependenciesToBeRemoved = new Set();
            this.changeSummary = undefined;
            this.changeSummary = this.createChangeSummary?.();
            (0, logging_1.getLogger)()?.handleDerivedCreated(this);
        }
        onLastObserverRemoved() {
            /**
             * We are not tracking changes anymore, thus we have to assume
             * that our cache is invalid.
             */
            this.state = 0 /* DerivedState.initial */;
            this.value = undefined;
            for (const d of this.dependencies) {
                d.removeObserver(this);
            }
            this.dependencies.clear();
            this._handleLastObserverRemoved?.();
        }
        get() {
            if (this.observers.size === 0) {
                // Without observers, we don't know when to clean up stuff.
                // Thus, we don't cache anything to prevent memory leaks.
                const result = this._computeFn(this, this.createChangeSummary?.());
                // Clear new dependencies
                this.onLastObserverRemoved();
                return result;
            }
            else {
                do {
                    // We might not get a notification for a dependency that changed while it is updating,
                    // thus we also have to ask all our depedencies if they changed in this case.
                    if (this.state === 1 /* DerivedState.dependenciesMightHaveChanged */) {
                        for (const d of this.dependencies) {
                            /** might call {@link handleChange} indirectly, which could make us stale */
                            d.reportChanges();
                            if (this.state === 2 /* DerivedState.stale */) {
                                // The other dependencies will refresh on demand, so early break
                                break;
                            }
                        }
                    }
                    // We called report changes of all dependencies.
                    // If we are still not stale, we can assume to be up to date again.
                    if (this.state === 1 /* DerivedState.dependenciesMightHaveChanged */) {
                        this.state = 3 /* DerivedState.upToDate */;
                    }
                    this._recomputeIfNeeded();
                    // In case recomputation changed one of our dependencies, we need to recompute again.
                } while (this.state !== 3 /* DerivedState.upToDate */);
                return this.value;
            }
        }
        _recomputeIfNeeded() {
            if (this.state === 3 /* DerivedState.upToDate */) {
                return;
            }
            const emptySet = this.dependenciesToBeRemoved;
            this.dependenciesToBeRemoved = this.dependencies;
            this.dependencies = emptySet;
            const hadValue = this.state !== 0 /* DerivedState.initial */;
            const oldValue = this.value;
            this.state = 3 /* DerivedState.upToDate */;
            const changeSummary = this.changeSummary;
            this.changeSummary = this.createChangeSummary?.();
            try {
                /** might call {@link handleChange} indirectly, which could invalidate us */
                this.value = this._computeFn(this, changeSummary);
            }
            finally {
                // We don't want our observed observables to think that they are (not even temporarily) not being observed.
                // Thus, we only unsubscribe from observables that are definitely not read anymore.
                for (const o of this.dependenciesToBeRemoved) {
                    o.removeObserver(this);
                }
                this.dependenciesToBeRemoved.clear();
            }
            const didChange = hadValue && !(this._equalityComparator(oldValue, this.value));
            (0, logging_1.getLogger)()?.handleDerivedRecomputed(this, {
                oldValue,
                newValue: this.value,
                change: undefined,
                didChange,
                hadValue,
            });
            if (didChange) {
                for (const r of this.observers) {
                    r.handleChange(this, undefined);
                }
            }
        }
        toString() {
            return `LazyDerived<${this.debugName}>`;
        }
        // IObserver Implementation
        beginUpdate(_observable) {
            this.updateCount++;
            const propagateBeginUpdate = this.updateCount === 1;
            if (this.state === 3 /* DerivedState.upToDate */) {
                this.state = 1 /* DerivedState.dependenciesMightHaveChanged */;
                // If we propagate begin update, that will already signal a possible change.
                if (!propagateBeginUpdate) {
                    for (const r of this.observers) {
                        r.handlePossibleChange(this);
                    }
                }
            }
            if (propagateBeginUpdate) {
                for (const r of this.observers) {
                    r.beginUpdate(this); // This signals a possible change
                }
            }
        }
        endUpdate(_observable) {
            this.updateCount--;
            if (this.updateCount === 0) {
                // End update could change the observer list.
                const observers = [...this.observers];
                for (const r of observers) {
                    r.endUpdate(this);
                }
            }
            (0, assert_1.assertFn)(() => this.updateCount >= 0);
        }
        handlePossibleChange(observable) {
            // In all other states, observers already know that we might have changed.
            if (this.state === 3 /* DerivedState.upToDate */ && this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                this.state = 1 /* DerivedState.dependenciesMightHaveChanged */;
                for (const r of this.observers) {
                    r.handlePossibleChange(this);
                }
            }
        }
        handleChange(observable, change) {
            if (this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                const shouldReact = this._handleChange ? this._handleChange({
                    changedObservable: observable,
                    change,
                    didChange: o => o === observable,
                }, this.changeSummary) : true;
                const wasUpToDate = this.state === 3 /* DerivedState.upToDate */;
                if (shouldReact && (this.state === 1 /* DerivedState.dependenciesMightHaveChanged */ || wasUpToDate)) {
                    this.state = 2 /* DerivedState.stale */;
                    if (wasUpToDate) {
                        for (const r of this.observers) {
                            r.handlePossibleChange(this);
                        }
                    }
                }
            }
        }
        // IReader Implementation
        readObservable(observable) {
            // Subscribe before getting the value to enable caching
            observable.addObserver(this);
            /** This might call {@link handleChange} indirectly, which could invalidate us */
            const value = observable.get();
            // Which is why we only add the observable to the dependencies now.
            this.dependencies.add(observable);
            this.dependenciesToBeRemoved.delete(observable);
            return value;
        }
        addObserver(observer) {
            const shouldCallBeginUpdate = !this.observers.has(observer) && this.updateCount > 0;
            super.addObserver(observer);
            if (shouldCallBeginUpdate) {
                observer.beginUpdate(this);
            }
        }
        removeObserver(observer) {
            const shouldCallEndUpdate = this.observers.has(observer) && this.updateCount > 0;
            super.removeObserver(observer);
            if (shouldCallEndUpdate) {
                // Calling end update after removing the observer makes sure endUpdate cannot be called twice here.
                observer.endUpdate(this);
            }
        }
    }
    exports.Derived = Derived;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVyaXZlZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL29ic2VydmFibGVJbnRlcm5hbC9kZXJpdmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsMEJBbUJDO0lBRUQsa0NBZUM7SUFpQkQsb0RBZ0JDO0lBSUQsNENBc0JDO0lBSUQsOENBMEJDO0lBN0hELFNBQWdCLE9BQU8sQ0FBSSxnQkFBa0QsRUFBRSxTQUFnRDtRQUM5SCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM3QixPQUFPLElBQUksT0FBTyxDQUNqQixJQUFJLHlCQUFhLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUN6RCxTQUFTLEVBQ1QsU0FBUyxFQUNULFNBQVMsRUFDVCxTQUFTLEVBQ1QscUJBQVksQ0FDWixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sSUFBSSxPQUFPLENBQ2pCLElBQUkseUJBQWEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLGdCQUF1QixDQUFDLEVBQ2hFLGdCQUF1QixFQUN2QixTQUFTLEVBQ1QsU0FBUyxFQUNULFNBQVMsRUFDVCxxQkFBWSxDQUNaLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0IsV0FBVyxDQUMxQixPQUdDLEVBQ0QsU0FBaUM7UUFFakMsT0FBTyxJQUFJLE9BQU8sQ0FDakIsSUFBSSx5QkFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDN0UsU0FBUyxFQUNULFNBQVMsRUFDVCxTQUFTLEVBQ1QsT0FBTyxDQUFDLHFCQUFxQixFQUM3QixPQUFPLENBQUMsUUFBUSxJQUFJLHFCQUFZLENBQ2hDLENBQUM7SUFDSCxDQUFDO0lBRUQsSUFBQSxzQkFBZSxFQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRTdCOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILFNBQWdCLG9CQUFvQixDQUNuQyxPQUlDLEVBQ0QsU0FBZ0U7UUFFaEUsT0FBTyxJQUFJLE9BQU8sQ0FDakIsSUFBSSx5QkFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFDOUQsU0FBUyxFQUNULE9BQU8sQ0FBQyx3QkFBd0IsRUFDaEMsT0FBTyxDQUFDLFlBQVksRUFDcEIsU0FBUyxFQUNULE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxxQkFBWSxDQUN4QyxDQUFDO0lBQ0gsQ0FBQztJQUlELFNBQWdCLGdCQUFnQixDQUFJLGdCQUEyRSxFQUFFLG9CQUF1RTtRQUN2TCxJQUFJLFNBQXlELENBQUM7UUFDOUQsSUFBSSxLQUFZLENBQUM7UUFDakIsSUFBSSxvQkFBb0IsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN4QyxTQUFTLEdBQUcsZ0JBQXVCLENBQUM7WUFDcEMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUNuQixDQUFDO2FBQU0sQ0FBQztZQUNQLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQztZQUN6QixTQUFTLEdBQUcsb0JBQTJCLENBQUM7UUFDekMsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQ3BDLE9BQU8sSUFBSSxPQUFPLENBQ2pCLElBQUkseUJBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUM5QyxDQUFDLENBQUMsRUFBRTtZQUNILEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNkLE9BQU8sU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QixDQUFDLEVBQUUsU0FBUyxFQUNaLFNBQVMsRUFDVCxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQ3JCLHFCQUFZLENBQ1osQ0FBQztJQUNILENBQUM7SUFJRCxTQUFnQixpQkFBaUIsQ0FBb0MsZ0JBQWtELEVBQUUsb0JBQStDO1FBQ3ZLLElBQUksU0FBaUMsQ0FBQztRQUN0QyxJQUFJLEtBQVksQ0FBQztRQUNqQixJQUFJLG9CQUFvQixLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hDLFNBQVMsR0FBRyxnQkFBdUIsQ0FBQztZQUNwQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1FBQ25CLENBQUM7YUFBTSxDQUFDO1lBQ1AsS0FBSyxHQUFHLGdCQUFnQixDQUFDO1lBQ3pCLFNBQVMsR0FBRyxvQkFBMkIsQ0FBQztRQUN6QyxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDcEMsT0FBTyxJQUFJLE9BQU8sQ0FDakIsSUFBSSx5QkFBYSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQzlDLENBQUMsQ0FBQyxFQUFFO1lBQ0gsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2QsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDLEVBQUUsU0FBUyxFQUNaLFNBQVMsRUFDVCxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQ3JCLHFCQUFZLENBQ1osQ0FBQztJQUNILENBQUM7SUFFRCxJQUFXLFlBb0JWO0lBcEJELFdBQVcsWUFBWTtRQUN0Qiw2REFBNkQ7UUFDN0QscURBQVcsQ0FBQTtRQUVYOzs7V0FHRztRQUNILCtGQUFnQyxDQUFBO1FBRWhDOzs7V0FHRztRQUNILGlEQUFTLENBQUE7UUFFVDs7V0FFRztRQUNILHVEQUFZLENBQUE7SUFDYixDQUFDLEVBcEJVLFlBQVksS0FBWixZQUFZLFFBb0J0QjtJQUVELE1BQWEsT0FBaUMsU0FBUSxxQkFBdUI7UUFRNUUsSUFBb0IsU0FBUztZQUM1QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQWEsQ0FBQztRQUNoRSxDQUFDO1FBRUQsWUFDa0IsY0FBNkIsRUFDOUIsVUFBaUUsRUFDaEUsbUJBQXVELEVBQ3ZELGFBQTBGLEVBQzFGLDZCQUF1RCxTQUFTLEVBQ2hFLG1CQUF3QztZQUV6RCxLQUFLLEVBQUUsQ0FBQztZQVBTLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1lBQzlCLGVBQVUsR0FBVixVQUFVLENBQXVEO1lBQ2hFLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBb0M7WUFDdkQsa0JBQWEsR0FBYixhQUFhLENBQTZFO1lBQzFGLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFDaEUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQWpCbEQsVUFBSyxnQ0FBd0I7WUFDN0IsVUFBSyxHQUFrQixTQUFTLENBQUM7WUFDakMsZ0JBQVcsR0FBRyxDQUFDLENBQUM7WUFDaEIsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztZQUMzQyw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztZQUN0RCxrQkFBYSxHQUErQixTQUFTLENBQUM7WUFlN0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO1lBQ2xELElBQUEsbUJBQVMsR0FBRSxFQUFFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFa0IscUJBQXFCO1lBQ3ZDOzs7ZUFHRztZQUNILElBQUksQ0FBQyxLQUFLLCtCQUF1QixDQUFDO1lBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNuQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRTFCLElBQUksQ0FBQywwQkFBMEIsRUFBRSxFQUFFLENBQUM7UUFDckMsQ0FBQztRQUVlLEdBQUc7WUFDbEIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsMkRBQTJEO2dCQUMzRCx5REFBeUQ7Z0JBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFHLENBQUMsQ0FBQztnQkFDcEUseUJBQXlCO2dCQUN6QixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsR0FBRyxDQUFDO29CQUNILHNGQUFzRjtvQkFDdEYsNkVBQTZFO29CQUM3RSxJQUFJLElBQUksQ0FBQyxLQUFLLHNEQUE4QyxFQUFFLENBQUM7d0JBQzlELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDOzRCQUNuQyw0RUFBNEU7NEJBQzVFLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQzs0QkFFbEIsSUFBSSxJQUFJLENBQUMsS0FBcUIsK0JBQXVCLEVBQUUsQ0FBQztnQ0FDdkQsZ0VBQWdFO2dDQUNoRSxNQUFNOzRCQUNQLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUVELGdEQUFnRDtvQkFDaEQsbUVBQW1FO29CQUNuRSxJQUFJLElBQUksQ0FBQyxLQUFLLHNEQUE4QyxFQUFFLENBQUM7d0JBQzlELElBQUksQ0FBQyxLQUFLLGdDQUF3QixDQUFDO29CQUNwQyxDQUFDO29CQUVELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUMxQixxRkFBcUY7Z0JBQ3RGLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSyxrQ0FBMEIsRUFBRTtnQkFDL0MsT0FBTyxJQUFJLENBQUMsS0FBTSxDQUFDO1lBQ3BCLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLElBQUksSUFBSSxDQUFDLEtBQUssa0NBQTBCLEVBQUUsQ0FBQztnQkFDMUMsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUM7WUFDOUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDakQsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7WUFFN0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssaUNBQXlCLENBQUM7WUFDckQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixJQUFJLENBQUMsS0FBSyxnQ0FBd0IsQ0FBQztZQUVuQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYyxDQUFDO1lBQzFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUM7Z0JBQ0osNEVBQTRFO2dCQUM1RSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ25ELENBQUM7b0JBQVMsQ0FBQztnQkFDViwyR0FBMkc7Z0JBQzNHLG1GQUFtRjtnQkFDbkYsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDOUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztnQkFDRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUVqRixJQUFBLG1CQUFTLEdBQUUsRUFBRSx1QkFBdUIsQ0FBQyxJQUFJLEVBQUU7Z0JBQzFDLFFBQVE7Z0JBQ1IsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNwQixNQUFNLEVBQUUsU0FBUztnQkFDakIsU0FBUztnQkFDVCxRQUFRO2FBQ1IsQ0FBQyxDQUFDO1lBRUgsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDaEMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVlLFFBQVE7WUFDdkIsT0FBTyxlQUFlLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQztRQUN6QyxDQUFDO1FBRUQsMkJBQTJCO1FBQ3BCLFdBQVcsQ0FBSSxXQUEyQjtZQUNoRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQztZQUNwRCxJQUFJLElBQUksQ0FBQyxLQUFLLGtDQUEwQixFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxLQUFLLG9EQUE0QyxDQUFDO2dCQUN2RCw0RUFBNEU7Z0JBQzVFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUMzQixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDaEMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM5QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDaEMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlDQUFpQztnQkFDdkQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU0sU0FBUyxDQUFJLFdBQTJCO1lBQzlDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLDZDQUE2QztnQkFDN0MsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdEMsS0FBSyxNQUFNLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkIsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRU0sb0JBQW9CLENBQUksVUFBbUM7WUFDakUsMEVBQTBFO1lBQzFFLElBQUksSUFBSSxDQUFDLEtBQUssa0NBQTBCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hJLElBQUksQ0FBQyxLQUFLLG9EQUE0QyxDQUFDO2dCQUN2RCxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDaEMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTSxZQUFZLENBQWEsVUFBbUMsRUFBRSxNQUFlO1lBQ25GLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7b0JBQzNELGlCQUFpQixFQUFFLFVBQVU7b0JBQzdCLE1BQU07b0JBQ04sU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLFVBQWlCO2lCQUN2QyxFQUFFLElBQUksQ0FBQyxhQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMvQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxrQ0FBMEIsQ0FBQztnQkFDekQsSUFBSSxXQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxzREFBOEMsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUM5RixJQUFJLENBQUMsS0FBSyw2QkFBcUIsQ0FBQztvQkFDaEMsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ2hDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDOUIsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELHlCQUF5QjtRQUNsQixjQUFjLENBQUksVUFBMEI7WUFDbEQsdURBQXVEO1lBQ3ZELFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsaUZBQWlGO1lBQ2pGLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixtRUFBbUU7WUFDbkUsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFZSxXQUFXLENBQUMsUUFBbUI7WUFDOUMsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ3BGLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFNUIsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMzQixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO1FBRWUsY0FBYyxDQUFDLFFBQW1CO1lBQ2pELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFDakYsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUvQixJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3pCLG1HQUFtRztnQkFDbkcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBdk5ELDBCQXVOQyJ9