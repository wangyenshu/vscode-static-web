/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/textModelBracketPairs", "./beforeEditPositionMapper", "./brackets", "./length", "./parser", "./smallImmutableSet", "./tokenizer", "vs/base/common/arrays", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos"], function (require, exports, event_1, lifecycle_1, textModelBracketPairs_1, beforeEditPositionMapper_1, brackets_1, length_1, parser_1, smallImmutableSet_1, tokenizer_1, arrays_1, combineTextEditInfos_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairsTree = void 0;
    class BracketPairsTree extends lifecycle_1.Disposable {
        didLanguageChange(languageId) {
            return this.brackets.didLanguageChange(languageId);
        }
        constructor(textModel, getLanguageConfiguration) {
            super();
            this.textModel = textModel;
            this.getLanguageConfiguration = getLanguageConfiguration;
            this.didChangeEmitter = new event_1.Emitter();
            this.denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
            this.brackets = new brackets_1.LanguageAgnosticBracketTokens(this.denseKeyProvider, this.getLanguageConfiguration);
            this.onDidChange = this.didChangeEmitter.event;
            this.queuedTextEditsForInitialAstWithoutTokens = [];
            this.queuedTextEdits = [];
            if (!textModel.tokenization.hasTokens) {
                const brackets = this.brackets.getSingleLanguageBracketTokens(this.textModel.getLanguageId());
                const tokenizer = new tokenizer_1.FastTokenizer(this.textModel.getValue(), brackets);
                this.initialAstWithoutTokens = (0, parser_1.parseDocument)(tokenizer, [], undefined, true);
                this.astWithTokens = this.initialAstWithoutTokens;
            }
            else if (textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                // Skip the initial ast, as there is no flickering.
                // Directly create the tree with token information.
                this.initialAstWithoutTokens = undefined;
                this.astWithTokens = this.parseDocumentFromTextBuffer([], undefined, false);
            }
            else {
                // We missed some token changes already, so we cannot use the fast tokenizer + delta increments
                this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer([], undefined, true);
                this.astWithTokens = this.initialAstWithoutTokens;
            }
        }
        //#region TextModel events
        handleDidChangeBackgroundTokenizationState() {
            if (this.textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                const wasUndefined = this.initialAstWithoutTokens === undefined;
                // Clear the initial tree as we can use the tree with token information now.
                this.initialAstWithoutTokens = undefined;
                if (!wasUndefined) {
                    this.didChangeEmitter.fire();
                }
            }
        }
        handleDidChangeTokens({ ranges }) {
            const edits = ranges.map(r => new beforeEditPositionMapper_1.TextEditInfo((0, length_1.toLength)(r.fromLineNumber - 1, 0), (0, length_1.toLength)(r.toLineNumber, 0), (0, length_1.toLength)(r.toLineNumber - r.fromLineNumber + 1, 0)));
            this.handleEdits(edits, true);
            if (!this.initialAstWithoutTokens) {
                this.didChangeEmitter.fire();
            }
        }
        handleContentChanged(change) {
            const edits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(change.changes);
            this.handleEdits(edits, false);
        }
        handleEdits(edits, tokenChange) {
            // Lazily queue the edits and only apply them when the tree is accessed.
            const result = (0, combineTextEditInfos_1.combineTextEditInfos)(this.queuedTextEdits, edits);
            this.queuedTextEdits = result;
            if (this.initialAstWithoutTokens && !tokenChange) {
                this.queuedTextEditsForInitialAstWithoutTokens = (0, combineTextEditInfos_1.combineTextEditInfos)(this.queuedTextEditsForInitialAstWithoutTokens, edits);
            }
        }
        //#endregion
        flushQueue() {
            if (this.queuedTextEdits.length > 0) {
                this.astWithTokens = this.parseDocumentFromTextBuffer(this.queuedTextEdits, this.astWithTokens, false);
                this.queuedTextEdits = [];
            }
            if (this.queuedTextEditsForInitialAstWithoutTokens.length > 0) {
                if (this.initialAstWithoutTokens) {
                    this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer(this.queuedTextEditsForInitialAstWithoutTokens, this.initialAstWithoutTokens, false);
                }
                this.queuedTextEditsForInitialAstWithoutTokens = [];
            }
        }
        /**
         * @pure (only if isPure = true)
        */
        parseDocumentFromTextBuffer(edits, previousAst, immutable) {
            // Is much faster if `isPure = false`.
            const isPure = false;
            const previousAstClone = isPure ? previousAst?.deepClone() : previousAst;
            const tokenizer = new tokenizer_1.TextBufferTokenizer(this.textModel, this.brackets);
            const result = (0, parser_1.parseDocument)(tokenizer, edits, previousAstClone, immutable);
            return result;
        }
        getBracketsInRange(range, onlyColorizedBrackets) {
            this.flushQueue();
            const startOffset = (0, length_1.toLength)(range.startLineNumber - 1, range.startColumn - 1);
            const endOffset = (0, length_1.toLength)(range.endLineNumber - 1, range.endColumn - 1);
            return new arrays_1.CallbackIterable(cb => {
                const node = this.initialAstWithoutTokens || this.astWithTokens;
                collectBrackets(node, length_1.lengthZero, node.length, startOffset, endOffset, cb, 0, 0, new Map(), onlyColorizedBrackets);
            });
        }
        getBracketPairsInRange(range, includeMinIndentation) {
            this.flushQueue();
            const startLength = (0, length_1.positionToLength)(range.getStartPosition());
            const endLength = (0, length_1.positionToLength)(range.getEndPosition());
            return new arrays_1.CallbackIterable(cb => {
                const node = this.initialAstWithoutTokens || this.astWithTokens;
                const context = new CollectBracketPairsContext(cb, includeMinIndentation, this.textModel);
                collectBracketPairs(node, length_1.lengthZero, node.length, startLength, endLength, context, 0, new Map());
            });
        }
        getFirstBracketAfter(position) {
            this.flushQueue();
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            return getFirstBracketAfter(node, length_1.lengthZero, node.length, (0, length_1.positionToLength)(position));
        }
        getFirstBracketBefore(position) {
            this.flushQueue();
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            return getFirstBracketBefore(node, length_1.lengthZero, node.length, (0, length_1.positionToLength)(position));
        }
    }
    exports.BracketPairsTree = BracketPairsTree;
    function getFirstBracketBefore(node, nodeOffsetStart, nodeOffsetEnd, position) {
        if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
            const lengths = [];
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                lengths.push({ nodeOffsetStart, nodeOffsetEnd });
                nodeOffsetStart = nodeOffsetEnd;
            }
            for (let i = lengths.length - 1; i >= 0; i--) {
                const { nodeOffsetStart, nodeOffsetEnd } = lengths[i];
                if ((0, length_1.lengthLessThan)(nodeOffsetStart, position)) {
                    const result = getFirstBracketBefore(node.children[i], nodeOffsetStart, nodeOffsetEnd, position);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            return null;
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            return {
                bracketInfo: node.bracketInfo,
                range
            };
        }
        return null;
    }
    function getFirstBracketAfter(node, nodeOffsetStart, nodeOffsetEnd, position) {
        if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThan)(position, nodeOffsetEnd)) {
                    const result = getFirstBracketAfter(child, nodeOffsetStart, nodeOffsetEnd, position);
                    if (result) {
                        return result;
                    }
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
            return null;
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            return null;
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            return {
                bracketInfo: node.bracketInfo,
                range
            };
        }
        return null;
    }
    function collectBrackets(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, push, level, nestingLevelOfEqualBracketType, levelPerBracketType, onlyColorizedBrackets, parentPairIsIncomplete = false) {
        if (level > 200) {
            return true;
        }
        whileLoop: while (true) {
            switch (node.kind) {
                case 4 /* AstNodeKind.List */: {
                    const childCount = node.childrenLength;
                    for (let i = 0; i < childCount; i++) {
                        const child = node.getChild(i);
                        if (!child) {
                            continue;
                        }
                        nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                        if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                            (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                            const childEndsAfterEnd = (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, endOffset);
                            if (childEndsAfterEnd) {
                                // No child after this child in the requested window, don't recurse
                                node = child;
                                continue whileLoop;
                            }
                            const shouldContinue = collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, push, level, 0, levelPerBracketType, onlyColorizedBrackets);
                            if (!shouldContinue) {
                                return false;
                            }
                        }
                        nodeOffsetStart = nodeOffsetEnd;
                    }
                    return true;
                }
                case 2 /* AstNodeKind.Pair */: {
                    const colorize = !onlyColorizedBrackets || !node.closingBracket || node.closingBracket.bracketInfo.closesColorized(node.openingBracket.bracketInfo);
                    let levelPerBracket = 0;
                    if (levelPerBracketType) {
                        let existing = levelPerBracketType.get(node.openingBracket.text);
                        if (existing === undefined) {
                            existing = 0;
                        }
                        levelPerBracket = existing;
                        if (colorize) {
                            existing++;
                            levelPerBracketType.set(node.openingBracket.text, existing);
                        }
                    }
                    const childCount = node.childrenLength;
                    for (let i = 0; i < childCount; i++) {
                        const child = node.getChild(i);
                        if (!child) {
                            continue;
                        }
                        nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                        if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                            (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                            const childEndsAfterEnd = (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, endOffset);
                            if (childEndsAfterEnd && child.kind !== 1 /* AstNodeKind.Bracket */) {
                                // No child after this child in the requested window, don't recurse
                                // Don't do this for brackets because of unclosed/unopened brackets
                                node = child;
                                if (colorize) {
                                    level++;
                                    nestingLevelOfEqualBracketType = levelPerBracket + 1;
                                }
                                else {
                                    nestingLevelOfEqualBracketType = levelPerBracket;
                                }
                                continue whileLoop;
                            }
                            if (colorize || child.kind !== 1 /* AstNodeKind.Bracket */ || !node.closingBracket) {
                                const shouldContinue = collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, push, colorize ? level + 1 : level, colorize ? levelPerBracket + 1 : levelPerBracket, levelPerBracketType, onlyColorizedBrackets, !node.closingBracket);
                                if (!shouldContinue) {
                                    return false;
                                }
                            }
                        }
                        nodeOffsetStart = nodeOffsetEnd;
                    }
                    levelPerBracketType?.set(node.openingBracket.text, levelPerBracket);
                    return true;
                }
                case 3 /* AstNodeKind.UnexpectedClosingBracket */: {
                    const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
                    return push(new textModelBracketPairs_1.BracketInfo(range, level - 1, 0, true));
                }
                case 1 /* AstNodeKind.Bracket */: {
                    const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
                    return push(new textModelBracketPairs_1.BracketInfo(range, level - 1, nestingLevelOfEqualBracketType - 1, parentPairIsIncomplete));
                }
                case 0 /* AstNodeKind.Text */:
                    return true;
            }
        }
    }
    class CollectBracketPairsContext {
        constructor(push, includeMinIndentation, textModel) {
            this.push = push;
            this.includeMinIndentation = includeMinIndentation;
            this.textModel = textModel;
        }
    }
    function collectBracketPairs(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level, levelPerBracketType) {
        if (level > 200) {
            return true;
        }
        let shouldContinue = true;
        if (node.kind === 2 /* AstNodeKind.Pair */) {
            let levelPerBracket = 0;
            if (levelPerBracketType) {
                let existing = levelPerBracketType.get(node.openingBracket.text);
                if (existing === undefined) {
                    existing = 0;
                }
                levelPerBracket = existing;
                existing++;
                levelPerBracketType.set(node.openingBracket.text, existing);
            }
            const openingBracketEnd = (0, length_1.lengthAdd)(nodeOffsetStart, node.openingBracket.length);
            let minIndentation = -1;
            if (context.includeMinIndentation) {
                minIndentation = node.computeMinIndentation(nodeOffsetStart, context.textModel);
            }
            shouldContinue = context.push(new textModelBracketPairs_1.BracketPairWithMinIndentationInfo((0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd), (0, length_1.lengthsToRange)(nodeOffsetStart, openingBracketEnd), node.closingBracket
                ? (0, length_1.lengthsToRange)((0, length_1.lengthAdd)(openingBracketEnd, node.child?.length || length_1.lengthZero), nodeOffsetEnd)
                : undefined, level, levelPerBracket, node, minIndentation));
            nodeOffsetStart = openingBracketEnd;
            if (shouldContinue && node.child) {
                const child = node.child;
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    shouldContinue = collectBracketPairs(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level + 1, levelPerBracketType);
                    if (!shouldContinue) {
                        return false;
                    }
                }
            }
            levelPerBracketType?.set(node.openingBracket.text, levelPerBracket);
        }
        else {
            let curOffset = nodeOffsetStart;
            for (const child of node.children) {
                const childOffset = curOffset;
                curOffset = (0, length_1.lengthAdd)(curOffset, child.length);
                if ((0, length_1.lengthLessThanEqual)(childOffset, endOffset) &&
                    (0, length_1.lengthLessThanEqual)(startOffset, curOffset)) {
                    shouldContinue = collectBracketPairs(child, childOffset, curOffset, startOffset, endOffset, context, level, levelPerBracketType);
                    if (!shouldContinue) {
                        return false;
                    }
                }
            }
        }
        return shouldContinue;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFBhaXJzVHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNUcmVlL2JyYWNrZXRQYWlyc1RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyxNQUFhLGdCQUFpQixTQUFRLHNCQUFVO1FBa0J4QyxpQkFBaUIsQ0FBQyxVQUFrQjtZQUMxQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQU1ELFlBQ2tCLFNBQW9CLEVBQ3BCLHdCQUErRTtZQUVoRyxLQUFLLEVBQUUsQ0FBQztZQUhTLGNBQVMsR0FBVCxTQUFTLENBQVc7WUFDcEIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUF1RDtZQTNCaEYscUJBQWdCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQWN2QyxxQkFBZ0IsR0FBRyxJQUFJLG9DQUFnQixFQUFVLENBQUM7WUFDbEQsYUFBUSxHQUFHLElBQUksd0NBQTZCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBTXBHLGdCQUFXLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUNsRCw4Q0FBeUMsR0FBbUIsRUFBRSxDQUFDO1lBQy9ELG9CQUFlLEdBQW1CLEVBQUUsQ0FBQztZQVE1QyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDLENB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