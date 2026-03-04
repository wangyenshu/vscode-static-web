/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./ast", "./beforeEditPositionMapper", "./smallImmutableSet", "./length", "./concat23Trees", "./nodeReader"], function (require, exports, ast_1, beforeEditPositionMapper_1, smallImmutableSet_1, length_1, concat23Trees_1, nodeReader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseDocument = parseDocument;
    /**
     * Non incrementally built ASTs are immutable.
    */
    function parseDocument(tokenizer, edits, oldNode, createImmutableLists) {
        const parser = new Parser(tokenizer, edits, oldNode, createImmutableLists);
        return parser.parseDocument();
    }
    /**
     * Non incrementally built ASTs are immutable.
    */
    class Parser {
        /**
         * Reports how many nodes were constructed in the last parse operation.
        */
        get nodesConstructed() {
            return this._itemsConstructed;
        }
        /**
         * Reports how many nodes were reused in the last parse operation.
        */
        get nodesReused() {
            return this._itemsFromCache;
        }
        constructor(tokenizer, edits, oldNode, createImmutableLists) {
            this.tokenizer = tokenizer;
            this.createImmutableLists = createImmutableLists;
            this._itemsConstructed = 0;
            this._itemsFromCache = 0;
            if (oldNode && createImmutableLists) {
                throw new Error('Not supported');
            }
            this.oldNodeReader = oldNode ? new nodeReader_1.NodeReader(oldNode) : undefined;
            this.positionMapper = new beforeEditPositionMapper_1.BeforeEditPositionMapper(edits);
        }
        parseDocument() {
            this._itemsConstructed = 0;
            this._itemsFromCache = 0;
            let result = this.parseList(smallImmutableSet_1.SmallImmutableSet.getEmpty(), 0);
            if (!result) {
                result = ast_1.ListAstNode.getEmpty();
            }
            return result;
        }
        parseList(openedBracketIds, level) {
            const items = [];
            while (true) {
                let child = this.tryReadChildFromCache(openedBracketIds);
                if (!child) {
                    const token = this.tokenizer.peek();
                    if (!token ||
                        (token.kind === 2 /* TokenKind.ClosingBracket */ &&
                            token.bracketIds.intersects(openedBracketIds))) {
                        break;
                    }
                    child = this.parseChild(openedBracketIds, level + 1);
                }
                if (child.kind === 4 /* AstNodeKind.List */ && child.childrenLength === 0) {
                    continue;
                }
                items.push(child);
            }
            // When there is no oldNodeReader, all items are created from scratch and must have the same height.
            const result = this.oldNodeReader ? (0, concat23Trees_1.concat23Trees)(items) : (0, concat23Trees_1.concat23TreesOfSameHeight)(items, this.createImmutableLists);
            return result;
        }
        tryReadChildFromCache(openedBracketIds) {
            if (this.oldNodeReader) {
                const maxCacheableLength = this.positionMapper.getDistanceToNextChange(this.tokenizer.offset);
                if (maxCacheableLength === null || !(0, length_1.lengthIsZero)(maxCacheableLength)) {
                    const cachedNode = this.oldNodeReader.readLongestNodeAt(this.positionMapper.getOffsetBeforeChange(this.tokenizer.offset), curNode => {
                        // The edit could extend the ending token, thus we cannot re-use nodes that touch the edit.
                        // If there is no edit anymore, we can re-use the node in any case.
                        if (maxCacheableLength !== null && !(0, length_1.lengthLessThan)(curNode.length, maxCacheableLength)) {
                            // Either the node contains edited text or touches edited text.
                            // In the latter case, brackets might have been extended (`end` -> `ending`), so even touching nodes cannot be reused.
                            return false;
                        }
                        const canBeReused = curNode.canBeReused(openedBracketIds);
                        return canBeReused;
                    });
                    if (cachedNode) {
                        this._itemsFromCache++;
                        this.tokenizer.skip(cachedNode.length);
                        return cachedNode;
                    }
                }
            }
            return undefined;
        }
        parseChild(openedBracketIds, level) {
            this._itemsConstructed++;
            const token = this.tokenizer.read();
            switch (token.kind) {
                case 2 /* TokenKind.ClosingBracket */:
                    return new ast_1.InvalidBracketAstNode(token.bracketIds, token.length);
                case 0 /* TokenKind.Text */:
                    return token.astNode;
                case 1 /* TokenKind.OpeningBracket */: {
                    if (level > 300) {
                        // To prevent stack overflows
                        return new ast_1.TextAstNode(token.length);
                    }
                    const set = openedBracketIds.merge(token.bracketIds);
                    const child = this.parseList(set, level + 1);
                    const nextToken = this.tokenizer.peek();
                    if (nextToken &&
                        nextToken.kind === 2 /* TokenKind.ClosingBracket */ &&
                        (nextToken.bracketId === token.bracketId || nextToken.bracketIds.intersects(token.bracketIds))) {
                        this.tokenizer.read();
                        return ast_1.PairAstNode.create(token.astNode, child, nextToken.astNode);
                    }
                    else {
                        return ast_1.PairAstNode.create(token.astNode, child, null);
                    }
                }
                default:
                    throw new Error('unexpected');
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLHNDQUdDO0lBTkQ7O01BRUU7SUFDRixTQUFnQixhQUFhLENBQUMsU0FBb0IsRUFBRSxLQUFxQixFQUFFLE9BQTRCLEVBQUUsb0JBQTZCO1FBQ3JJLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDM0UsT0FBTyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVEOztNQUVFO0lBQ0YsTUFBTSxNQUFNO1FBTVg7O1VBRUU7UUFDRixJQUFJLGdCQUFnQjtZQUNuQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUMvQixDQUFDO1FBRUQ7O1VBRUU7UUFDRixJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELFlBQ2tCLFNBQW9CLEVBQ3JDLEtBQXFCLEVBQ3JCLE9BQTRCLEVBQ1gsb0JBQTZCO1lBSDdCLGNBQVMsR0FBVCxTQUFTLENBQVc7WUFHcEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFTO1lBckJ2QyxzQkFBaUIsR0FBVyxDQUFDLENBQUM7WUFDOUIsb0JBQWUsR0FBVyxDQUFDLENBQUM7WUFzQm5DLElBQUksT0FBTyxJQUFJLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUVELElBQUksQ0FBQyxhQUFhLEdBQUcs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