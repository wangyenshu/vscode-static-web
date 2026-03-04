/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestId = exports.TestPosition = exports.TestIdPathParts = void 0;
    var TestIdPathParts;
    (function (TestIdPathParts) {
        /** Delimiter for path parts in test IDs */
        TestIdPathParts["Delimiter"] = "\0";
    })(TestIdPathParts || (exports.TestIdPathParts = TestIdPathParts = {}));
    /**
     * Enum for describing relative positions of tests. Similar to
     * `node.compareDocumentPosition` in the DOM.
     */
    var TestPosition;
    (function (TestPosition) {
        /** a === b */
        TestPosition[TestPosition["IsSame"] = 0] = "IsSame";
        /** Neither a nor b are a child of one another. They may share a common parent, though. */
        TestPosition[TestPosition["Disconnected"] = 1] = "Disconnected";
        /** b is a child of a */
        TestPosition[TestPosition["IsChild"] = 2] = "IsChild";
        /** b is a parent of a */
        TestPosition[TestPosition["IsParent"] = 3] = "IsParent";
    })(TestPosition || (exports.TestPosition = TestPosition = {}));
    /**
     * The test ID is a stringifiable client that
     */
    class TestId {
        /**
         * Creates a test ID from an ext host test item.
         */
        static fromExtHostTestItem(item, rootId, parent = item.parent) {
            if (item._isRoot) {
                return new TestId([rootId]);
            }
            const path = [item.id];
            for (let i = parent; i && i.id !== rootId; i = i.parent) {
                path.push(i.id);
            }
            path.push(rootId);
            return new TestId(path.reverse());
        }
        /**
         * Cheaply ets whether the ID refers to the root .
         */
        static isRoot(idString) {
            return !idString.includes("\0" /* TestIdPathParts.Delimiter */);
        }
        /**
         * Cheaply gets whether the ID refers to the root .
         */
        static root(idString) {
            const idx = idString.indexOf("\0" /* TestIdPathParts.Delimiter */);
            return idx === -1 ? idString : idString.slice(0, idx);
        }
        /**
         * Creates a test ID from a serialized TestId instance.
         */
        static fromString(idString) {
            return new TestId(idString.split("\0" /* TestIdPathParts.Delimiter */));
        }
        /**
         * Gets the ID resulting from adding b to the base ID.
         */
        static join(base, b) {
            return new TestId([...base.path, b]);
        }
        /**
         * Gets the string ID resulting from adding b to the base ID.
         */
        static joinToString(base, b) {
            return base.toString() + "\0" /* TestIdPathParts.Delimiter */ + b;
        }
        /**
         * Cheaply gets the parent ID of a test identified with the string.
         */
        static parentId(idString) {
            const idx = idString.lastIndexOf("\0" /* TestIdPathParts.Delimiter */);
            return idx === -1 ? undefined : idString.slice(0, idx);
        }
        /**
         * Cheaply gets the local ID of a test identified with the string.
         */
        static localId(idString) {
            const idx = idString.lastIndexOf("\0" /* TestIdPathParts.Delimiter */);
            return idx === -1 ? idString : idString.slice(idx + "\0" /* TestIdPathParts.Delimiter */.length);
        }
        /**
         * Gets whether maybeChild is a child of maybeParent.
         * todo@connor4312: review usages of this to see if using the WellDefinedPrefixTree is better
         */
        static isChild(maybeParent, maybeChild) {
            return maybeChild.startsWith(maybeParent) && maybeChild[maybeParent.length] === "\0" /* TestIdPathParts.Delimiter */;
        }
        /**
         * Compares the position of the two ID strings.
         * todo@connor4312: review usages of this to see if using the WellDefinedPrefixTree is better
         */
        static compare(a, b) {
            if (a === b) {
                return 0 /* TestPosition.IsSame */;
            }
            if (TestId.isChild(a, b)) {
                return 2 /* TestPosition.IsChild */;
            }
            if (TestId.isChild(b, a)) {
                return 3 /* TestPosition.IsParent */;
            }
            return 1 /* TestPosition.Disconnected */;
        }
        constructor(path, viewEnd = path.length) {
            this.path = path;
            this.viewEnd = viewEnd;
            if (path.length === 0 || viewEnd < 1) {
                throw new Error('cannot create test with empty path');
            }
        }
        /**
         * Gets the ID of the parent test.
         */
        get rootId() {
            return new TestId(this.path, 1);
        }
        /**
         * Gets the ID of the parent test.
         */
        get parentId() {
            return this.viewEnd > 1 ? new TestId(this.path, this.viewEnd - 1) : undefined;
        }
        /**
         * Gets the local ID of the current full test ID.
         */
        get localId() {
            return this.path[this.viewEnd - 1];
        }
        /**
         * Gets whether this ID refers to the root.
         */
        get controllerId() {
            return this.path[0];
        }
        /**
         * Gets whether this ID refers to the root.
         */
        get isRoot() {
            return this.viewEnd === 1;
        }
        /**
         * Returns an iterable that yields IDs of all parent items down to and
         * including the current item.
         */
        *idsFromRoot() {
            for (let i = 1; i <= this.viewEnd; i++) {
                yield new TestId(this.path, i);
            }
        }
        /**
         * Returns an iterable that yields IDs of the current item up to the root
         * item.
         */
        *idsToRoot() {
            for (let i = this.viewEnd; i > 0; i--) {
                yield new TestId(this.path, i);
            }
        }
        /**
         * Compares the other test ID with this one.
         */
        compare(other) {
            if (typeof other === 'string') {
                return TestId.compare(this.toString(), other);
            }
            for (let i = 0; i < other.viewEnd && i < this.viewEnd; i++) {
                if (other.path[i] !== this.path[i]) {
                    return 1 /* TestPosition.Disconnected */;
                }
            }
            if (other.viewEnd > this.viewEnd) {
                return 2 /* TestPosition.IsChild */;
            }
            if (other.viewEnd < this.viewEnd) {
                return 3 /* TestPosition.IsParent */;
            }
            return 0 /* TestPosition.IsSame */;
        }
        /**
         * Serializes the ID.
         */
        toJSON() {
            return this.toString();
        }
        /**
         * Serializes the ID to a string.
         */
        toString() {
            if (!this.stringifed) {
                this.stringifed = this.path[0];
                for (let i = 1; i < this.viewEnd; i++) {
                    this.stringifed += "\0" /* TestIdPathParts.Delimiter */;
                    this.stringifed += this.path[i];
                }
            }
            return this.stringifed;
        }
    }
    exports.TestId = TestId;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdElkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdElkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRyxJQUFrQixlQUdqQjtJQUhELFdBQWtCLGVBQWU7UUFDaEMsMkNBQTJDO1FBQzNDLG1DQUFnQixDQUFBO0lBQ2pCLENBQUMsRUFIaUIsZUFBZSwrQkFBZixlQUFlLFFBR2hDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBa0IsWUFTakI7SUFURCxXQUFrQixZQUFZO1FBQzdCLGNBQWM7UUFDZCxtREFBTSxDQUFBO1FBQ04sMEZBQTBGO1FBQzFGLCtEQUFZLENBQUE7UUFDWix3QkFBd0I7UUFDeEIscURBQU8sQ0FBQTtRQUNQLHlCQUF5QjtRQUN6Qix1REFBUSxDQUFBO0lBQ1QsQ0FBQyxFQVRpQixZQUFZLDRCQUFaLFlBQVksUUFTN0I7SUFJRDs7T0FFRztJQUNILE1BQWEsTUFBTTtRQUdsQjs7V0FFRztRQUNJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFrQixFQUFFLE1BQWMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU07WUFDekYsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzdCLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxDQUFDLElB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