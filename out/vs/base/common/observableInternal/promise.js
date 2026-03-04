define(["require", "exports", "vs/base/common/observableInternal/autorun", "./base", "vs/base/common/observableInternal/derived", "vs/base/common/cancellation", "vs/base/common/observableInternal/debugName", "vs/base/common/equals", "vs/base/common/errors"], function (require, exports, autorun_1, base_1, derived_1, cancellation_1, debugName_1, equals_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableLazyPromise = exports.PromiseResult = exports.ObservablePromise = exports.ObservableLazy = void 0;
    exports.waitForState = waitForState;
    exports.derivedWithCancellationToken = derivedWithCancellationToken;
    class ObservableLazy {
        /**
         * The cached value.
         * Does not force a computation of the value.
         */
        get cachedValue() { return this._value; }
        constructor(_computeValue) {
            this._computeValue = _computeValue;
            this._value = (0, base_1.observableValue)(this, undefined);
        }
        /**
         * Returns the cached value.
         * Computes the value if the value has not been cached yet.
         */
        getValue() {
            let v = this._value.get();
            if (!v) {
                v = this._computeValue();
                this._value.set(v, undefined);
            }
            return v;
        }
    }
    exports.ObservableLazy = ObservableLazy;
    /**
     * A promise whose state is observable.
     */
    class ObservablePromise {
        constructor(promise) {
            this._value = (0, base_1.observableValue)(this, undefined);
            /**
             * The current state of the promise.
             * Is `undefined` if the promise didn't resolve yet.
             */
            this.promiseResult = this._value;
            this.promise = promise.then(value => {
                (0, base_1.transaction)(tx => {
                    /** @description onPromiseResolved */
                    this._value.set(new PromiseResult(value, undefined), tx);
                });
                return value;
            }, error => {
                (0, base_1.transaction)(tx => {
                    /** @description onPromiseRejected */
                    this._value.set(new PromiseResult(undefined, error), tx);
                });
                throw error;
            });
        }
    }
    exports.ObservablePromise = ObservablePromise;
    class PromiseResult {
        constructor(
        /**
         * The value of the resolved promise.
         * Undefined if the promise rejected.
         */
        data, 
        /**
         * The error in case of a rejected promise.
         * Undefined if the promise resolved.
         */
        error) {
            this.data = data;
            this.error = error;
        }
        /**
         * Returns the value if the promise resolved, otherwise throws the error.
         */
        getDataOrThrow() {
            if (this.error) {
                throw this.error;
            }
            return this.data;
        }
    }
    exports.PromiseResult = PromiseResult;
    /**
     * A lazy promise whose state is observable.
     */
    class ObservableLazyPromise {
        constructor(_computePromise) {
            this._computePromise = _computePromise;
            this._lazyValue = new ObservableLazy(() => new ObservablePromise(this._computePromise()));
            /**
             * Does not enforce evaluation of the promise compute function.
             * Is undefined if the promise has not been computed yet.
             */
            this.cachedPromiseResult = (0, derived_1.derived)(this, reader => this._lazyValue.cachedValue.read(reader)?.promiseResult.read(reader));
        }
        getPromise() {
            return this._lazyValue.getValue().promise;
        }
    }
    exports.ObservableLazyPromise = ObservableLazyPromise;
    function waitForState(observable, predicate, isError, cancellationToken) {
        if (!predicate) {
            predicate = state => state !== null && state !== undefined;
        }
        return new Promise((resolve, reject) => {
            let isImmediateRun = true;
            let shouldDispose = false;
            const stateObs = observable.map(state => {
                /** @description waitForState.state */
                return {
                    isFinished: predicate(state),
                    error: isError ? isError(state) : false,
                    state
                };
            });
            const d = (0, autorun_1.autorun)(reader => {
                /** @description waitForState */
                const { isFinished, error, state } = stateObs.read(reader);
                if (isFinished || error) {
                    if (isImmediateRun) {
                        // The variable `d` is not initialized yet
                        shouldDispose = true;
                    }
                    else {
                        d.dispose();
                    }
                    if (error) {
                        reject(error === true ? state : error);
                    }
                    else {
                        resolve(state);
                    }
                }
            });
            if (cancellationToken) {
                const dc = cancellationToken.onCancellationRequested(() => {
                    d.dispose();
                    dc.dispose();
                    reject(new errors_1.CancellationError());
                });
                if (cancellationToken.isCancellationRequested) {
                    d.dispose();
                    dc.dispose();
                    reject(new errors_1.CancellationError());
                    return;
                }
            }
            isImmediateRun = false;
            if (shouldDispose) {
                d.dispose();
            }
        });
    }
    function derivedWithCancellationToken(computeFnOrOwner, computeFnOrUndefined) {
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
        let cancellationTokenSource = undefined;
        return new derived_1.Derived(new debugName_1.DebugNameData(owner, undefined, computeFn), r => {
            if (cancellationTokenSource) {
                cancellationTokenSource.dispose(true);
            }
            cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            return computeFn(r, cancellationTokenSource.token);
        }, undefined, undefined, () => cancellationTokenSource?.dispose(), equals_1.strictEquals);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbWlzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL29ic2VydmFibGVJbnRlcm5hbC9wcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUE2SEEsb0NBa0RDO0lBSUQsb0VBeUJDO0lBaE1ELE1BQWEsY0FBYztRQUcxQjs7O1dBR0c7UUFDSCxJQUFXLFdBQVcsS0FBaUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUU1RSxZQUE2QixhQUFzQjtZQUF0QixrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQVJsQyxXQUFNLEdBQUcsSUFBQSxzQkFBZSxFQUFnQixJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFTMUUsQ0FBQztRQUVEOzs7V0FHRztRQUNJLFFBQVE7WUFDZCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDUixDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztLQUNEO0lBeEJELHdDQXdCQztJQUVEOztPQUVHO0lBQ0gsTUFBYSxpQkFBaUI7UUFjN0IsWUFBWSxPQUFtQjtZQWJkLFdBQU0sR0FBRyxJQUFBLHNCQUFlLEVBQStCLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQU96Rjs7O2VBR0c7WUFDYSxrQkFBYSxHQUE4QyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBR3RGLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFB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