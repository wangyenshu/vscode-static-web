/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator"], function (require, exports, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WellDefinedPrefixTree = void 0;
    const unset = Symbol('unset');
    /**
     * A simple prefix tree implementation where a value is stored based on
     * well-defined prefix segments.
     */
    class WellDefinedPrefixTree {
        constructor() {
            this.root = new Node();
            this._size = 0;
        }
        get size() {
            return this._size;
        }
        /** Gets the top-level nodes of the tree */
        get nodes() {
            return this.root.children?.values() || iterator_1.Iterable.empty();
        }
        /**
         * Inserts a new value in the prefix tree.
         * @param onNode - called for each node as we descend to the insertion point,
         * including the insertion point itself.
         */
        insert(key, value, onNode) {
            this.opNode(key, n => n._value = value, onNode);
        }
        /** Mutates a value in the prefix tree. */
        mutate(key, mutate) {
            this.opNode(key, n => n._value = mutate(n._value === unset ? undefined : n._value));
        }
        /** Deletes a node from the prefix tree, returning the value it contained. */
        delete(key) {
            const path = this.getPathToKey(key);
            if (!path) {
                return;
            }
            let i = path.length - 1;
            const value = path[i].node._value;
            if (value === unset) {
                return; // not actually a real node
            }
            this._size--;
            path[i].node._value = unset;
            for (; i > 0; i--) {
                const { node, part } = path[i];
                if (node.children?.size || node._value !== unset) {
                    break;
                }
                path[i - 1].node.children.delete(part);
            }
            return value;
        }
        /** Deletes a subtree from the prefix tree, returning the values they contained. */
        *deleteRecursive(key) {
            const path = this.getPathToKey(key);
            if (!path) {
                return;
            }
            const subtree = path[path.length - 1].node;
            // important: run the deletion before we start to yield results, so that
            // it still runs even if the caller doesn't consumer the iterator
            for (let i = path.length - 1; i > 0; i--) {
                const parent = path[i - 1];
                parent.node.children.delete(path[i].part);
                if (parent.node.children.size > 0 || parent.node._value !== unset) {
                    break;
                }
            }
            for (const node of bfsIterate(subtree)) {
                if (node._value !== unset) {
                    this._size--;
                    yield node._value;
                }
            }
        }
        /** Gets a value from the tree. */
        find(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return undefined;
                }
                node = next;
            }
            return node._value === unset ? undefined : node._value;
        }
        /** Gets whether the tree has the key, or a parent of the key, already inserted. */
        hasKeyOrParent(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return false;
                }
                if (next._value !== unset) {
                    return true;
                }
                node = next;
            }
            return false;
        }
        /** Gets whether the tree has the given key or any children. */
        hasKeyOrChildren(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return false;
                }
                node = next;
            }
            return true;
        }
        /** Gets whether the tree has the given key. */
        hasKey(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return false;
                }
                node = next;
            }
            return node._value !== unset;
        }
        getPathToKey(key) {
            const path = [{ part: '', node: this.root }];
            let i = 0;
            for (const part of key) {
                const node = path[i].node.children?.get(part);
                if (!node) {
                    return; // node not in tree
                }
                path.push({ part, node });
                i++;
            }
            return path;
        }
        opNode(key, fn, onDescend) {
            let node = this.root;
            for (const part of key) {
                if (!node.children) {
                    const next = new Node();
                    node.children = new Map([[part, next]]);
                    node = next;
                }
                else if (!node.children.has(part)) {
                    const next = new Node();
                    node.children.set(part, next);
                    node = next;
                }
                else {
                    node = node.children.get(part);
                }
                onDescend?.(node);
            }
            const sizeBefore = node._value === unset ? 0 : 1;
            fn(node);
            const sizeAfter = node._value === unset ? 0 : 1;
            this._size += sizeAfter - sizeBefore;
        }
        /** Returns an iterable of the tree values in no defined order. */
        *values() {
            for (const { _value } of bfsIterate(this.root)) {
                if (_value !== unset) {
                    yield _value;
                }
            }
        }
    }
    exports.WellDefinedPrefixTree = WellDefinedPrefixTree;
    function* bfsIterate(root) {
        const stack = [root];
        while (stack.length > 0) {
            const node = stack.pop();
            yield node;
            if (node.children) {
                for (const child of node.children.values()) {
                    stack.push(child);
                }
            }
        }
    }
    class Node {
        constructor() {
            this._value = unset;
        }
        get value() {
            return this._value === unset ? undefined : this._value;
        }
        set value(value) {
            this._value = value === undefined ? unset : value;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZml4VHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3ByZWZpeFRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQVU5Qjs7O09BR0c7SUFDSCxNQUFhLHFCQUFxQjtRQUFsQztZQUNrQixTQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUssQ0FBQztZQUM5QixVQUFLLEdBQUcsQ0FBQyxDQUFDO1FBOExuQixDQUFDO1FBNUxBLElBQVcsSUFBSTtZQUNkLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRUQsMkNBQTJDO1FBQzNDLElBQVcsS0FBSztZQUNmLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksbUJBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6RCxDQUFDO1FBRUQ7Ozs7V0FJRztRQUNILE1BQU0sQ0FBQyxHQUFxQixFQUFFLEtBQVEsRUFBRSxNQUF3QztZQUMvRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCwwQ0FBMEM7UUFDMUMsTUFBTSxDQUFDLEdBQXFCLEVBQUUsTUFBd0I7WUFDckQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFB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