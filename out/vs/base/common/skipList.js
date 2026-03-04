/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SkipList = void 0;
    class Node {
        constructor(level, key, value) {
            this.level = level;
            this.key = key;
            this.value = value;
            this.forward = [];
        }
    }
    const NIL = undefined;
    class SkipList {
        /**
         *
         * @param capacity Capacity at which the list performs best
         */
        constructor(comparator, capacity = 2 ** 16) {
            this.comparator = comparator;
            this[_a] = 'SkipList';
            this._level = 0;
            this._size = 0;
            this._maxLevel = Math.max(1, Math.log2(capacity) | 0);
            this._header = new Node(this._maxLevel, NIL, NIL);
        }
        get size() {
            return this._size;
        }
        clear() {
            this._header = new Node(this._maxLevel, NIL, NIL);
            this._size = 0;
        }
        has(key) {
            return Boolean(SkipList._search(this, key, this.comparator));
        }
        get(key) {
            return SkipList._search(this, key, this.comparator)?.value;
        }
        set(key, value) {
            if (SkipList._insert(this, key, value, this.comparator)) {
                this._size += 1;
            }
            return this;
        }
        delete(key) {
            const didDelete = SkipList._delete(this, key, this.comparator);
            if (didDelete) {
                this._size -= 1;
            }
            return didDelete;
        }
        // --- iteration
        forEach(callbackfn, thisArg) {
            let node = this._header.forward[0];
            while (node) {
                callbackfn.call(thisArg, node.value, node.key, this);
                node = node.forward[0];
            }
        }
        [(_a = Symbol.toStringTag, Symbol.iterator)]() {
            return this.entries();
        }
        *entries() {
            let node = this._header.forward[0];
            while (node) {
                yield [node.key, node.value];
                node = node.forward[0];
            }
        }
        *keys() {
            let node = this._header.forward[0];
            while (node) {
                yield node.key;
                node = node.forward[0];
            }
        }
        *values() {
            let node = this._header.forward[0];
            while (node) {
                yield node.value;
                node = node.forward[0];
            }
        }
        toString() {
            // debug string...
            let result = '[SkipList]:';
            let node = this._header.forward[0];
            while (node) {
                result += `node(${node.key}, ${node.value}, lvl:${node.level})`;
                node = node.forward[0];
            }
            return result;
        }
        // from https://www.epaperpress.com/sortsearch/download/skiplist.pdf
        static _search(list, searchKey, comparator) {
            let x = list._header;
            for (let i = list._level - 1; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
            }
            x = x.forward[0];
            if (x && comparator(x.key, searchKey) === 0) {
                return x;
            }
            return undefined;
        }
        static _insert(list, searchKey, value, comparator) {
            const update = [];
            let x = list._header;
            for (let i = list._level - 1; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
                update[i] = x;
            }
            x = x.forward[0];
            if (x && comparator(x.key, searchKey) === 0) {
                // update
                x.value = value;
                return false;
            }
            else {
                // insert
                const lvl = SkipList._randomLevel(list);
                if (lvl > list._level) {
                    for (let i = list._level; i < lvl; i++) {
                        update[i] = list._header;
                    }
                    list._level = lvl;
                }
                x = new Node(lvl, searchKey, value);
                for (let i = 0; i < lvl; i++) {
                    x.forward[i] = update[i].forward[i];
                    update[i].forward[i] = x;
                }
                return true;
            }
        }
        static _randomLevel(list, p = 0.5) {
            let lvl = 1;
            while (Math.random() < p && lvl < list._maxLevel) {
                lvl += 1;
            }
            return lvl;
        }
        static _delete(list, searchKey, comparator) {
            const update = [];
            let x = list._header;
            for (let i = list._level - 1; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
                update[i] = x;
            }
            x = x.forward[0];
            if (!x || comparator(x.key, searchKey) !== 0) {
                // not found
                return false;
            }
            for (let i = 0; i < list._level; i++) {
                if (update[i].forward[i] !== x) {
                    break;
                }
                update[i].forward[i] = x.forward[i];
            }
            while (list._level > 0 && list._header.forward[list._level - 1] === NIL) {
                list._level -= 1;
            }
            return true;
        }
    }
    exports.SkipList = SkipList;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcExpc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9za2lwTGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7O0lBR2hHLE1BQU0sSUFBSTtRQUVULFlBQXFCLEtBQWEsRUFBVyxHQUFNLEVBQVMsS0FBUTtZQUEvQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQVcsUUFBRyxHQUFILEdBQUcsQ0FBRztZQUFTLFVBQUssR0FBTCxLQUFLLENBQUc7WUFDbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBRUQsTUFBTSxHQUFHLEdBQWMsU0FBUyxDQUFDO0lBTWpDLE1BQWEsUUFBUTtRQVNwQjs7O1dBR0c7UUFDSCxZQUNVLFVBQWtDLEVBQzNDLFdBQW1CLENBQUMsSUFBSSxFQUFFO1lBRGpCLGVBQVUsR0FBVixVQUFVLENBQXdCO1lBWm5DLFFBQW9CLEdBQUcsVUFBVSxDQUFDO1lBR25DLFdBQU0sR0FBVyxDQUFDLENBQUM7WUFFbkIsVUFBSyxHQUFXLENBQUMsQ0FBQztZQVV6QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLE9BQU8sR0FBUSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLE9BQU8sR0FBUSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMs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