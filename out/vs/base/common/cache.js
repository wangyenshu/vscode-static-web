/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation"], function (require, exports, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedFunction = exports.LRUCachedFunction = exports.Cache = void 0;
    exports.identity = identity;
    class Cache {
        constructor(task) {
            this.task = task;
            this.result = null;
        }
        get() {
            if (this.result) {
                return this.result;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const promise = this.task(cts.token);
            this.result = {
                promise,
                dispose: () => {
                    this.result = null;
                    cts.cancel();
                    cts.dispose();
                }
            };
            return this.result;
        }
    }
    exports.Cache = Cache;
    function identity(t) {
        return t;
    }
    /**
     * Uses a LRU cache to make a given parametrized function cached.
     * Caches just the last key/value.
    */
    class LRUCachedFunction {
        constructor(arg1, arg2) {
            this.lastCache = undefined;
            this.lastArgKey = undefined;
            if (typeof arg1 === 'function') {
                this._fn = arg1;
                this._computeKey = identity;
            }
            else {
                this._fn = arg2;
                this._computeKey = arg1.getCacheKey;
            }
        }
        get(arg) {
            const key = this._computeKey(arg);
            if (this.lastArgKey !== key) {
                this.lastArgKey = key;
                this.lastCache = this._fn(arg);
            }
            return this.lastCache;
        }
    }
    exports.LRUCachedFunction = LRUCachedFunction;
    /**
     * Uses an unbounded cache to memoize the results of the given function.
    */
    class CachedFunction {
        get cachedValues() {
            return this._map;
        }
        constructor(arg1, arg2) {
            this._map = new Map();
            this._map2 = new Map();
            if (typeof arg1 === 'function') {
                this._fn = arg1;
                this._computeKey = identity;
            }
            else {
                this._fn = arg2;
                this._computeKey = arg1.getCacheKey;
            }
        }
        get(arg) {
            const key = this._computeKey(arg);
            if (this._map2.has(key)) {
                return this._map2.get(key);
            }
            const value = this._fn(arg);
            this._map.set(arg, value);
            this._map2.set(key, value);
            return value;
        }
    }
    exports.CachedFunction = CachedFunction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9jYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQ2hHLDRCQUVDO0lBNUJELE1BQWEsS0FBSztRQUdqQixZQUFvQixJQUEyQztZQUEzQyxTQUFJLEdBQUosSUFBSSxDQUF1QztZQUR2RCxXQUFNLEdBQTBCLElBQUksQ0FBQztRQUNzQixDQUFDO1FBRXBFLEdBQUc7WUFDRixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3BCLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFDMUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFckMsSUFBSSxDQUFDLE1BQU0sR0FBRztnQkFDYixPQUFPO2dCQUNQLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7b0JBQ25CLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsQ0FBQzthQUNELENBQUM7WUFFRixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztLQUNEO0lBeEJELHNCQXdCQztJQUVELFNBQWdCLFFBQVEsQ0FBSSxDQUFJO1FBQy9CLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQVVEOzs7TUFHRTtJQUNGLE1BQWEsaUJBQWlCO1FBUzdCLFlBQVksSUFBc0QsRUFBRSxJQUErQjtZQVIzRixjQUFTLEdBQTBCLFNBQVMsQ0FBQztZQUM3QyxlQUFVLEdBQXdCLFNBQVMsQ0FBQztZQVFuRCxJQUFJLE9BQU8sSUFBSSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUM7WUFDN0IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSyxDQUFDO2dCQUNqQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFTSxHQUFHLENBQUMsR0FBUztZQUNuQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsU0FBVSxDQUFDO1FBQ3hCLENBQUM7S0FDRDtJQTNCRCw4Q0EyQkM7SUFFRDs7TUFFRTtJQUNGLE1BQWEsY0FBYztRQUcxQixJQUFXLFlBQVk7WUFDdEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFPRCxZQUFZLElBQXNELEVBQUUsSUFBK0I7WUFYbEYsU0FBSSxHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1lBQ2xDLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBc0IsQ0FBQztZQVd0RCxJQUFJLE9BQU8sSUFBSSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUM7WUFDN0IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSyxDQUFDO2dCQUNqQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFTSxHQUFHLENBQUMsR0FBUztZQUNuQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNEO0lBakNELHdDQWlDQyJ9