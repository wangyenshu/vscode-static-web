/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/common/core/cursorColumns", "./length", "./smallImmutableSet"], function (require, exports, errors_1, cursorColumns_1, length_1, smallImmutableSet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidBracketAstNode = exports.BracketAstNode = exports.TextAstNode = exports.ListAstNode = exports.PairAstNode = exports.AstNodeKind = void 0;
    var AstNodeKind;
    (function (AstNodeKind) {
        AstNodeKind[AstNodeKind["Text"] = 0] = "Text";
        AstNodeKind[AstNodeKind["Bracket"] = 1] = "Bracket";
        AstNodeKind[AstNodeKind["Pair"] = 2] = "Pair";
        AstNodeKind[AstNodeKind["UnexpectedClosingBracket"] = 3] = "UnexpectedClosingBracket";
        AstNodeKind[AstNodeKind["List"] = 4] = "List";
    })(AstNodeKind || (exports.AstNodeKind = AstNodeKind = {}));
    /**
     * The base implementation for all AST nodes.
    */
    class BaseAstNode {
        /**
         * The length of the entire node, which should equal the sum of lengths of all children.
        */
        get length() {
            return this._length;
        }
        constructor(length) {
            this._length = length;
        }
    }
    /**
     * Represents a bracket pair including its child (e.g. `{ ... }`).
     * Might be unclosed.
     * Immutable, if all children are immutable.
    */
    class PairAstNode extends BaseAstNode {
        static create(openingBracket, child, closingBracket) {
            let length = openingBracket.length;
            if (child) {
                length = (0, length_1.lengthAdd)(length, child.length);
            }
            if (closingBracket) {
                length = (0, length_1.lengthAdd)(length, closingBracket.length);
            }
            return new PairAstNode(length, openingBracket, child, closingBracket, child ? child.missingOpeningBracketIds : smallImmutableSet_1.SmallImmutableSet.getEmpty());
        }
        get kind() {
            return 2 /* AstNodeKind.Pair */;
        }
        get listHeight() {
            return 0;
        }
        get childrenLength() {
            return 3;
        }
        getChild(idx) {
            switch (idx) {
                case 0: return this.openingBracket;
                case 1: return this.child;
                case 2: return this.closingBracket;
            }
            throw new Error('Invalid child index');
        }
        /**
         * Avoid using this property, it allocates an array!
        */
        get children() {
            const result = [];
            result.push(this.openingBracket);
            if (this.child) {
                result.push(this.child);
            }
            if (this.closingBracket) {
                result.push(this.closingBracket);
            }
            return result;
        }
        constructor(length, openingBracket, child, closingBracket, missingOpeningBracketIds) {
            super(length);
            this.openingBracket = openingBracket;
            this.child = child;
            this.closingBracket = closingBracket;
            this.missingOpeningBracketIds = missingOpeningBracketIds;
        }
        canBeReused(openBracketIds) {
            if (this.closingBracket === null) {
                // Unclosed pair ast nodes only
                // end at the end of the document
                // or when a parent node is closed.
                // This could be improved:
                // Only return false if some next token is neither "undefined" nor a bracket that closes a parent.
                return false;
            }
            if (openBracketIds.intersects(this.missingOpeningBracketIds)) {
                return false;
            }
            return true;
        }
        flattenLists() {
            return PairAstNode.create(this.openingBracket.flattenLists(), this.child && this.child.flattenLists(), this.closingBracket && this.closingBracket.flattenLists());
        }
        deepClone() {
            return new PairAstNode(this.length, this.openingBracket.deepClone(), this.child && this.child.deepClone(), this.closingBracket && this.closingBracket.deepClone(), this.missingOpeningBracketIds);
        }
        computeMinIndentation(offset, textModel) {
            return this.child ? this.child.computeMinIndentation((0, length_1.lengthAdd)(offset, this.openingBracket.length), textModel) : Number.MAX_SAFE_INTEGER;
        }
    }
    exports.PairAstNode = PairAstNode;
    class ListAstNode extends BaseAstNode {
        /**
         * This method uses more memory-efficient list nodes that can only store 2 or 3 children.
        */
        static create23(item1, item2, item3, immutable = false) {
            let length = item1.length;
            let missingBracketIds = item1.missingOpeningBracketIds;
            if (item1.listHeight !== item2.listHeight) {
                throw new Error('Invalid list heights');
            }
            length = (0, length_1.lengthAdd)(length, item2.length);
            missingBracketIds = missingBracketIds.merge(item2.missingOpeningBracketIds);
            if (item3) {
                if (item1.listHeight !== item3.listHeight) {
                    throw new Error('Invalid list heights');
                }
                length = (0, length_1.lengthAdd)(length, item3.length);
                missingBracketIds = missingBracketIds.merge(item3.missingOpeningBracketIds);
            }
            return immutable
                ? new Immutable23ListAstNode(length, item1.listHeight + 1, item1, item2, item3, missingBracketIds)
                : new TwoThreeListAstNode(length, item1.listHeight + 1, item1, item2, item3, missingBracketIds);
        }
        static create(items, immutable = false) {
            if (items.length === 0) {
                return this.getEmpty();
            }
            else {
                let length = items[0].length;
                let unopenedBrackets = items[0].missingOpeningBracketIds;
                for (let i = 1; i < items.length; i++) {
                    length = (0, length_1.lengthAdd)(length, items[i].length);
                    unopenedBrackets = unopenedBrackets.merge(items[i].missingOpeningBracketIds);
                }
                return immutable
                    ? new ImmutableArrayListAstNode(length, items[0].listHeight + 1, items, unopenedBrackets)
                    : new ArrayListAstNode(length, items[0].listHeight + 1, items, unopenedBrackets);
            }
        }
        static getEmpty() {
            return new ImmutableArrayListAstNode(length_1.lengthZero, 0, [], smallImmutableSet_1.SmallImmutableSet.getEmpty());
        }
        get kind() {
            return 4 /* AstNodeKind.List */;
        }
        get missingOpeningBracketIds() {
            return this._missingOpeningBracketIds;
        }
        /**
         * Use ListAstNode.create.
        */
        constructor(length, listHeight, _missingOpeningBracketIds) {
            super(length);
            this.listHeight = listHeight;
            this._missingOpeningBracketIds = _missingOpeningBracketIds;
            this.cachedMinIndentation = -1;
        }
        throwIfImmutable() {
            // NOOP
        }
        makeLastElementMutable() {
            this.throwIfImmutable();
            const childCount = this.childrenLength;
            if (childCount === 0) {
                return undefined;
            }
            const lastChild = this.getChild(childCount - 1);
            const mutable = lastChild.kind === 4 /* AstNodeKind.List */ ? lastChild.toMutable() : lastChild;
            if (lastChild !== mutable) {
                this.setChild(childCount - 1, mutable);
            }
            return mutable;
        }
        makeFirstElementMutable() {
            this.throwIfImmutable();
            const childCount = this.childrenLength;
            if (childCount === 0) {
                return undefined;
            }
            const firstChild = this.getChild(0);
            const mutable = firstChild.kind === 4 /* AstNodeKind.List */ ? firstChild.toMutable() : firstChild;
            if (firstChild !== mutable) {
                this.setChild(0, mutable);
            }
            return mutable;
        }
        canBeReused(openBracketIds) {
            if (openBracketIds.intersects(this.missingOpeningBracketIds)) {
                return false;
            }
            if (this.childrenLength === 0) {
                // Don't reuse empty lists.
                return false;
            }
            let lastChild = this;
            while (lastChild.kind === 4 /* AstNodeKind.List */) {
                const lastLength = lastChild.childrenLength;
                if (lastLength === 0) {
                    // Empty lists should never be contained in other lists.
                    throw new errors_1.BugIndicatingError();
                }
                lastChild = lastChild.getChild(lastLength - 1);
            }
            return lastChild.canBeReused(openBracketIds);
        }
        handleChildrenChanged() {
            this.throwIfImmutable();
            const count = this.childrenLength;
            let length = this.getChild(0).length;
            let unopenedBrackets = this.getChild(0).missingOpeningBracketIds;
            for (let i = 1; i < count; i++) {
                const child = this.getChild(i);
                length = (0, length_1.lengthAdd)(length, child.length);
                unopenedBrackets = unopenedBrackets.merge(child.missingOpeningBracketIds);
            }
            this._length = length;
            this._missingOpeningBracketIds = unopenedBrackets;
            this.cachedMinIndentation = -1;
        }
        flattenLists() {
            const items = [];
            for (const c of this.children) {
                const normalized = c.flattenLists();
                if (normalized.kind === 4 /* AstNodeKind.List */) {
                    items.push(...normalized.children);
                }
                else {
                    items.push(normalized);
                }
            }
            return ListAstNode.create(items);
        }
        computeMinIndentation(offset, textModel) {
            if (this.cachedMinIndentation !== -1) {
                return this.cachedMinIndentation;
            }
            let minIndentation = Number.MAX_SAFE_INTEGER;
            let childOffset = offset;
            for (let i = 0; i < this.childrenLength; i++) {
                const child = this.getChild(i);
                if (child) {
                    minIndentation = Math.min(minIndentation, child.computeMinIndentation(childOffset, textModel));
                    childOffset = (0, length_1.lengthAdd)(childOffset, child.length);
                }
            }
            this.cachedMinIndentation = minIndentation;
            return minIndentation;
        }
    }
    exports.ListAstNode = ListAstNode;
    class TwoThreeListAstNode extends ListAstNode {
        get childrenLength() {
            return this._item3 !== null ? 3 : 2;
        }
        getChild(idx) {
            switch (idx) {
                case 0: return this._item1;
                case 1: return this._item2;
                case 2: return this._item3;
            }
            throw new Error('Invalid child index');
        }
        setChild(idx, node) {
            switch (idx) {
                case 0:
                    this._item1 = node;
                    return;
                case 1:
                    this._item2 = node;
                    return;
                case 2:
                    this._item3 = node;
                    return;
            }
            throw new Error('Invalid child index');
        }
        get children() {
            return this._item3 ? [this._item1, this._item2, this._item3] : [this._item1, this._item2];
        }
        get item1() {
            return this._item1;
        }
        get item2() {
            return this._item2;
        }
        get item3() {
            return this._item3;
        }
        constructor(length, listHeight, _item1, _item2, _item3, missingOpeningBracketIds) {
            super(length, listHeight, missingOpeningBracketIds);
            this._item1 = _item1;
            this._item2 = _item2;
            this._item3 = _item3;
        }
        deepClone() {
            return new TwoThreeListAstNode(this.length, this.listHeight, this._item1.deepClone(), this._item2.deepClone(), this._item3 ? this._item3.deepClone() : null, this.missingOpeningBracketIds);
        }
        appendChildOfSameHeight(node) {
            if (this._item3) {
                throw new Error('Cannot append to a full (2,3) tree node');
            }
            this.throwIfImmutable();
            this._item3 = node;
            this.handleChildrenChanged();
        }
        unappendChild() {
            if (!this._item3) {
                throw new Error('Cannot remove from a non-full (2,3) tree node');
            }
            this.throwIfImmutable();
            const result = this._item3;
            this._item3 = null;
            this.handleChildrenChanged();
            return result;
        }
        prependChildOfSameHeight(node) {
            if (this._item3) {
                throw new Error('Cannot prepend to a full (2,3) tree node');
            }
            this.throwIfImmutable();
            this._item3 = this._item2;
            this._item2 = this._item1;
            this._item1 = node;
            this.handleChildrenChanged();
        }
        unprependChild() {
            if (!this._item3) {
                throw new Error('Cannot remove from a non-full (2,3) tree node');
            }
            this.throwIfImmutable();
            const result = this._item1;
            this._item1 = this._item2;
            this._item2 = this._item3;
            this._item3 = null;
            this.handleChildrenChanged();
            return result;
        }
        toMutable() {
            return this;
        }
    }
    /**
     * Immutable, if all children are immutable.
    */
    class Immutable23ListAstNode extends TwoThreeListAstNode {
        toMutable() {
            return new TwoThreeListAstNode(this.length, this.listHeight, this.item1, this.item2, this.item3, this.missingOpeningBracketIds);
        }
        throwIfImmutable() {
            throw new Error('this instance is immutable');
        }
    }
    /**
     * For debugging.
    */
    class ArrayListAstNode extends ListAstNode {
        get childrenLength() {
            return this._children.length;
        }
        getChild(idx) {
            return this._children[idx];
        }
        setChild(idx, child) {
            this._children[idx] = child;
        }
        get children() {
            return this._children;
        }
        constructor(length, listHeight, _children, missingOpeningBracketIds) {
            super(length, listHeight, missingOpeningBracketIds);
            this._children = _children;
        }
        deepClone() {
            const children = new Array(this._children.length);
            for (let i = 0; i < this._children.length; i++) {
                children[i] = this._children[i].deepClone();
            }
            return new ArrayListAstNode(this.length, this.listHeight, children, this.missingOpeningBracketIds);
        }
        appendChildOfSameHeight(node) {
            this.throwIfImmutable();
            this._children.push(node);
            this.handleChildrenChanged();
        }
        unappendChild() {
            this.throwIfImmutable();
            const item = this._children.pop();
            this.handleChildrenChanged();
            return item;
        }
        prependChildOfSameHeight(node) {
            this.throwIfImmutable();
            this._children.unshift(node);
            this.handleChildrenChanged();
        }
        unprependChild() {
            this.throwIfImmutable();
            const item = this._children.shift();
            this.handleChildrenChanged();
            return item;
        }
        toMutable() {
            return this;
        }
    }
    /**
     * Immutable, if all children are immutable.
    */
    class ImmutableArrayListAstNode extends ArrayListAstNode {
        toMutable() {
            return new ArrayListAstNode(this.length, this.listHeight, [...this.children], this.missingOpeningBracketIds);
        }
        throwIfImmutable() {
            throw new Error('this instance is immutable');
        }
    }
    const emptyArray = [];
    class ImmutableLeafAstNode extends BaseAstNode {
        get listHeight() {
            return 0;
        }
        get childrenLength() {
            return 0;
        }
        getChild(idx) {
            return null;
        }
        get children() {
            return emptyArray;
        }
        flattenLists() {
            return this;
        }
        deepClone() {
            return this;
        }
    }
    class TextAstNode extends ImmutableLeafAstNode {
        get kind() {
            return 0 /* AstNodeKind.Text */;
        }
        get missingOpeningBracketIds() {
            return smallImmutableSet_1.SmallImmutableSet.getEmpty();
        }
        canBeReused(_openedBracketIds) {
            return true;
        }
        computeMinIndentation(offset, textModel) {
            const start = (0, length_1.lengthToObj)(offset);
            // Text ast nodes don't have partial indentation (ensured by the tokenizer).
            // Thus, if this text node does not start at column 0, the first line cannot have any indentation at all.
            const startLineNumber = (start.columnCount === 0 ? start.lineCount : start.lineCount + 1) + 1;
            const endLineNumber = (0, length_1.lengthGetLineCount)((0, length_1.lengthAdd)(offset, this.length)) + 1;
            let result = Number.MAX_SAFE_INTEGER;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const firstNonWsColumn = textModel.getLineFirstNonWhitespaceColumn(lineNumber);
                const lineContent = textModel.getLineContent(lineNumber);
                if (firstNonWsColumn === 0) {
                    continue;
                }
                const visibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(lineContent, firstNonWsColumn, textModel.getOptions().tabSize);
                result = Math.min(result, visibleColumn);
            }
            return result;
        }
    }
    exports.TextAstNode = TextAstNode;
    class BracketAstNode extends ImmutableLeafAstNode {
        static create(length, bracketInfo, bracketIds) {
            const node = new BracketAstNode(length, bracketInfo, bracketIds);
            return node;
        }
        get kind() {
            return 1 /* AstNodeKind.Bracket */;
        }
        get missingOpeningBracketIds() {
            return smallImmutableSet_1.SmallImmutableSet.getEmpty();
        }
        constructor(length, bracketInfo, 
        /**
         * In case of a opening bracket, this is the id of the opening bracket.
         * In case of a closing bracket, this contains the ids of all opening brackets it can close.
        */
        bracketIds) {
            super(length);
            this.bracketInfo = bracketInfo;
            this.bracketIds = bracketIds;
        }
        get text() {
            return this.bracketInfo.bracketText;
        }
        get languageId() {
            return this.bracketInfo.languageId;
        }
        canBeReused(_openedBracketIds) {
            // These nodes could be reused,
            // but not in a general way.
            // Their parent may be reused.
            return false;
        }
        computeMinIndentation(offset, textModel) {
            return Number.MAX_SAFE_INTEGER;
        }
    }
    exports.BracketAstNode = BracketAstNode;
    class InvalidBracketAstNode extends ImmutableLeafAstNode {
        get kind() {
            return 3 /* AstNodeKind.UnexpectedClosingBracket */;
        }
        constructor(closingBrackets, length) {
            super(length);
            this.missingOpeningBracketIds = closingBrackets;
        }
        canBeReused(openedBracketIds) {
            return !openedBracketIds.intersects(this.missingOpeningBracketIds);
        }
        computeMinIndentation(offset, textModel) {
            return Number.MAX_SAFE_INTEGER;
        }
    }
    exports.InvalidBracketAstNode = InvalidBracketAstNode;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvYXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxJQUFrQixXQU1qQjtJQU5ELFdBQWtCLFdBQVc7UUFDNUIsNkNBQVEsQ0FBQTtRQUNSLG1EQUFXLENBQUE7UUFDWCw2Q0FBUSxDQUFBO1FBQ1IscUZBQTRCLENBQUE7UUFDNUIsNkNBQVEsQ0FBQTtJQUNULENBQUMsRUFOaUIsV0FBVywyQkFBWCxXQUFXLFFBTTVCO0lBSUQ7O01BRUU7SUFDRixNQUFlLFdBQVc7UUE0QnpCOztVQUVFO1FBQ0YsSUFBVyxNQUFNO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsWUFBbUIsTUFBYztZQUNoQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN2QixDQUFDO0tBb0JEO0lBRUQ7Ozs7TUFJRTtJQUNGLE1BQWEsV0FBWSxTQUFRLFdBQVc7UUFDcEMsTUFBTSxDQUFDLE1BQU0sQ0FDbkIsY0FBOEIsRUFDOUIsS0FBcUIsRUFDckIsY0FBcUM7WUFFckMsSUFBSSxNQUFNLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQztZQUNuQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE1BQU0sR0FBRyxJQUFBLGtCQUFTLEVBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxHQUFHLElBQUEsa0JBQVMsRUFBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFD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