/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlidingWindowAverage = exports.MovingAverage = exports.Counter = void 0;
    exports.clamp = clamp;
    exports.rot = rot;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    function rot(index, modulo) {
        return (modulo + (index % modulo)) % modulo;
    }
    class Counter {
        constructor() {
            this._next = 0;
        }
        getNext() {
            return this._next++;
        }
    }
    exports.Counter = Counter;
    class MovingAverage {
        constructor() {
            this._n = 1;
            this._val = 0;
        }
        update(value) {
            this._val = this._val + (value - this._val) / this._n;
            this._n += 1;
            return this._val;
        }
        get value() {
            return this._val;
        }
    }
    exports.MovingAverage = MovingAverage;
    class SlidingWindowAverage {
        constructor(size) {
            this._n = 0;
            this._val = 0;
            this._values = [];
            this._index = 0;
            this._sum = 0;
            this._values = new Array(size);
            this._values.fill(0, 0, size);
        }
        update(value) {
            const oldValue = this._values[this._index];
            this._values[this._index] = value;
            this._index = (this._index + 1) % this._values.length;
            this._sum -= oldValue;
            this._sum += value;
            if (this._n < this._values.length) {
                this._n += 1;
            }
            this._val = this._sum / this._n;
            return this._val;
        }
        get value() {
            return this._val;
        }
    }
    exports.SlidingWindowAverage = SlidingWindowAverage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL251bWJlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLHNCQUVDO0lBRUQsa0JBRUM7SUFORCxTQUFnQixLQUFLLENBQUMsS0FBYSxFQUFFLEdBQVcsRUFBRSxHQUFXO1FBQzVELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsU0FBZ0IsR0FBRyxDQUFDLEtBQWEsRUFBRSxNQUFjO1FBQ2hELE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDN0MsQ0FBQztJQUVELE1BQWEsT0FBTztRQUFwQjtZQUNTLFVBQUssR0FBRyxDQUFDLENBQUM7UUFLbkIsQ0FBQztRQUhBLE9BQU87WUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDO0tBQ0Q7SUFORCwwQkFNQztJQUVELE1BQWEsYUFBYTtRQUExQjtZQUVTLE9BQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxTQUFJLEdBQUcsQ0FBQyxDQUFDO1FBV2xCLENBQUM7UUFUQSxNQUFNLENBQUMsS0FBYTtZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdEQsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFkRCxzQ0FjQztJQUVELE1BQWEsb0JBQW9CO1FBU2hDLFlBQVksSUFBWTtZQVBoQixPQUFFLEdBQVcsQ0FBQyxDQUFDO1lBQ2YsU0FBSSxHQUFHLENBQUMsQ0FBQztZQUVBLFlBQU8sR0FBYSxFQUFFLENBQUM7WUFDaEMsV0FBTSxHQUFXLENBQUMsQ0FBQztZQUNuQixTQUFJLEdBQUcsQ0FBQyxDQUFDO1lBR2hCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQWE7WUFDbkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRXRELElBQUksQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1lBRW5CLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFqQ0Qsb0RBaUNDIn0=