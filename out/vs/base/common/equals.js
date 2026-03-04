/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays"], function (require, exports, arrays) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.strictEquals = void 0;
    exports.itemsEquals = itemsEquals;
    exports.jsonStringifyEquals = jsonStringifyEquals;
    exports.itemEquals = itemEquals;
    exports.equalsIfDefined = equalsIfDefined;
    exports.structuralEquals = structuralEquals;
    exports.getStructuralKey = getStructuralKey;
    const strictEquals = (a, b) => a === b;
    exports.strictEquals = strictEquals;
    /**
     * Checks if the items of two arrays are equal.
     * By default, strict equality is used to compare elements, but a custom equality comparer can be provided.
     */
    function itemsEquals(itemEquals = exports.strictEquals) {
        return (a, b) => arrays.equals(a, b, itemEquals);
    }
    /**
     * Two items are considered equal, if their stringified representations are equal.
    */
    function jsonStringifyEquals() {
        return (a, b) => JSON.stringify(a) === JSON.stringify(b);
    }
    /**
     * Uses `item.equals(other)` to determine equality.
     */
    function itemEquals() {
        return (a, b) => a.equals(b);
    }
    function equalsIfDefined(v1, v2, equals) {
        if (!v1 || !v2) {
            return v1 === v2;
        }
        return equals(v1, v2);
    }
    /**
     * Drills into arrays (items ordered) and objects (keys unordered) and uses strict equality on everything else.
    */
    function structuralEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0; i < a.length; i++) {
                if (!structuralEquals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        if (a && typeof a === 'object' && b && typeof b === 'object') {
            if (Object.getPrototypeOf(a) === Object.prototype && Object.getPrototypeOf(b) === Object.prototype) {
                const aObj = a;
                const bObj = b;
                const keysA = Object.keys(aObj);
                const keysB = Object.keys(bObj);
                const keysBSet = new Set(keysB);
                if (keysA.length !== keysB.length) {
                    return false;
                }
                for (const key of keysA) {
                    if (!keysBSet.has(key)) {
                        return false;
                    }
                    if (!structuralEquals(aObj[key], bObj[key])) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    /**
     * `getStructuralKey(a) === getStructuralKey(b) <=> structuralEquals(a, b)`
     * (assuming that a and b are not cyclic structures and nothing extends globalThis Array).
    */
    function getStructuralKey(t) {
        return JSON.stringify(toNormalizedJsonStructure(t));
    }
    let objectId = 0;
    const objIds = new WeakMap();
    function toNormalizedJsonStructure(t) {
        if (Array.isArray(t)) {
            return t.map(toNormalizedJsonStructure);
        }
        if (t && typeof t === 'object') {
            if (Object.getPrototypeOf(t) === Object.prototype) {
                const tObj = t;
                const res = Object.create(null);
                for (const key of Object.keys(tObj).sort()) {
                    res[key] = toNormalizedJsonStructure(tObj[key]);
                }
                return res;
            }
            else {
                let objId = objIds.get(t);
                if (objId === undefined) {
                    objId = objectId++;
                    objIds.set(t, objId);
                }
                // Random string to prevent collisions
                return objId + '----2b76a038c20c4bcc';
            }
        }
        return t;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXF1YWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZXF1YWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxrQ0FFQztJQUtELGtEQUVDO0lBS0QsZ0NBRUM7SUFFRCwwQ0FLQztJQUtELDRDQTJDQztJQU1ELDRDQUVDO0lBckZNLE1BQU0sWUFBWSxHQUEwQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFBeEQsUUFBQSxZQUFZLGdCQUE0QztJQUVyRTs7O09BR0c7SUFDSCxTQUFnQixXQUFXLENBQUksYUFBa0Msb0JBQVk7UUFDNUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQ7O01BRUU7SUFDRixTQUFnQixtQkFBbUI7UUFDbEMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixVQUFVO1FBQ3pCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxTQUFnQixlQUFlLENBQUksRUFBaUIsRUFBRSxFQUFpQixFQUFFLE1BQTJCO1FBQ25HLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQixPQUFPLEVBQUUs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