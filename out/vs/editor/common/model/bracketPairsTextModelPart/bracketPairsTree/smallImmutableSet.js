/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DenseKeyProvider = exports.identityKeyProvider = exports.SmallImmutableSet = void 0;
    const emptyArr = [];
    /**
     * Represents an immutable set that works best for a small number of elements (less than 32).
     * It uses bits to encode element membership efficiently.
    */
    class SmallImmutableSet {
        static { this.cache = new Array(129); }
        static create(items, additionalItems) {
            if (items <= 128 && additionalItems.length === 0) {
                // We create a cache of 128=2^7 elements to cover all sets with up to 7 (dense) elements.
                let cached = SmallImmutableSet.cache[items];
                if (!cached) {
                    cached = new SmallImmutableSet(items, additionalItems);
                    SmallImmutableSet.cache[items] = cached;
                }
                return cached;
            }
            return new SmallImmutableSet(items, additionalItems);
        }
        static { this.empty = SmallImmutableSet.create(0, emptyArr); }
        static getEmpty() {
            return this.empty;
        }
        constructor(items, additionalItems) {
            this.items = items;
            this.additionalItems = additionalItems;
        }
        add(value, keyProvider) {
            const key = keyProvider.getKey(value);
            let idx = key >> 5; // divided by 32
            if (idx === 0) {
                // fast path
                const newItem = (1 << key) | this.items;
                if (newItem === this.items) {
                    return this;
                }
                return SmallImmutableSet.create(newItem, this.additionalItems);
            }
            idx--;
            const newItems = this.additionalItems.slice(0);
            while (newItems.length < idx) {
                newItems.push(0);
            }
            newItems[idx] |= 1 << (key & 31);
            return SmallImmutableSet.create(this.items, newItems);
        }
        has(value, keyProvider) {
            const key = keyProvider.getKey(value);
            let idx = key >> 5; // divided by 32
            if (idx === 0) {
                // fast path
                return (this.items & (1 << key)) !== 0;
            }
            idx--;
            return ((this.additionalItems[idx] || 0) & (1 << (key & 31))) !== 0;
        }
        merge(other) {
            const merged = this.items | other.items;
            if (this.additionalItems === emptyArr && other.additionalItems === emptyArr) {
                // fast path
                if (merged === this.items) {
                    return this;
                }
                if (merged === other.items) {
                    return other;
                }
                return SmallImmutableSet.create(merged, emptyArr);
            }
            // This can be optimized, but it's not a common case
            const newItems = [];
            for (let i = 0; i < Math.max(this.additionalItems.length, other.additionalItems.length); i++) {
                const item1 = this.additionalItems[i] || 0;
                const item2 = other.additionalItems[i] || 0;
                newItems.push(item1 | item2);
            }
            return SmallImmutableSet.create(merged, newItems);
        }
        intersects(other) {
            if ((this.items & other.items) !== 0) {
                return true;
            }
            for (let i = 0; i < Math.min(this.additionalItems.length, other.additionalItems.length); i++) {
                if ((this.additionalItems[i] & other.additionalItems[i]) !== 0) {
                    return true;
                }
            }
            return false;
        }
        equals(other) {
            if (this.items !== other.items) {
                return false;
            }
            if (this.additionalItems.length !== other.additionalItems.length) {
                return false;
            }
            for (let i = 0; i < this.additionalItems.length; i++) {
                if (this.additionalItems[i] !== other.additionalItems[i]) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.SmallImmutableSet = SmallImmutableSet;
    exports.identityKeyProvider = {
        getKey(value) {
            return value;
        }
    };
    /**
     * Assigns values a unique incrementing key.
    */
    class DenseKeyProvider {
        constructor() {
            this.items = new Map();
        }
        getKey(value) {
            let existing = this.items.get(value);
            if (existing === undefined) {
                existing = this.items.size;
                this.items.set(value, existing);
            }
            return existing;
        }
        reverseLookup(value) {
            return [...this.items].find(([_key, v]) => v === value)?.[0];
        }
        reverseLookupSet(set) {
            const result = [];
            for (const [key] of this.items) {
                if (set.has(key, this)) {
                    result.push(key);
                }
            }
            return result;
        }
        keys() {
            return this.items.keys();
        }
    }
    exports.DenseKeyProvider = DenseKeyProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hbGxJbW11dGFibGVTZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9zbWFsbEltbXV0YWJsZVNldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO0lBRTlCOzs7TUFHRTtJQUNGLE1BQWEsaUJBQWlCO2lCQUNkLFVBQUssR0FBRyxJQUFJLEtBQUssQ0FBeUIsR0FBRyxDQUFDLENBQUM7UUFFdEQsTUFBTSxDQUFDLE1BQU0sQ0FBSSxLQUFhLEVBQUUsZUFBa0M7WUFDekUsSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xELHlGQUF5RjtnQkFDekYsSUFBSSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2IsTUFBTSxHQUFHLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO29CQUN2RCxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUN6QyxDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUVELE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDdEQsQ0FBQztpQkFFYyxVQUFLLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFNLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzRCxNQUFNLENBQUMsUUFBUTtZQUNyQixPQUFPLElBQUks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