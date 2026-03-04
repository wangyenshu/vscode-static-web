/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/diff/diff", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/core/textLength", "vs/editor/common/core/textEdit", "vs/editor/contrib/inlineCompletions/browser/ghostText"], function (require, exports, diff_1, strings_1, range_1, textLength_1, textEdit_1, ghostText_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.singleTextRemoveCommonPrefix = singleTextRemoveCommonPrefix;
    exports.singleTextEditAugments = singleTextEditAugments;
    exports.computeGhostText = computeGhostText;
    function singleTextRemoveCommonPrefix(edit, model, validModelRange) {
        const modelRange = validModelRange ? edit.range.intersectRanges(validModelRange) : edit.range;
        if (!modelRange) {
            return edit;
        }
        const valueToReplace = model.getValueInRange(modelRange, 1 /* EndOfLinePreference.LF */);
        const commonPrefixLen = (0, strings_1.commonPrefixLength)(valueToReplace, edit.text);
        const start = textLength_1.TextLength.ofText(valueToReplace.substring(0, commonPrefixLen)).addToPosition(edit.range.getStartPosition());
        const text = edit.text.substring(commonPrefixLen);
        const range = range_1.Range.fromPositions(start, edit.range.getEndPosition());
        return new textEdit_1.SingleTextEdit(range, text);
    }
    function singleTextEditAugments(edit, base) {
        // The augmented completion must replace the base range, but can replace even more
        return edit.text.startsWith(base.text) && rangeExtends(edit.range, base.range);
    }
    /**
     * @param previewSuffixLength Sets where to split `inlineCompletion.text`.
     * 	If the text is `hello` and the suffix length is 2, the non-preview part is `hel` and the preview-part is `lo`.
    */
    function computeGhostText(edit, model, mode, cursorPosition, previewSuffixLength = 0) {
        let e = singleTextRemoveCommonPrefix(edit, model);
        if (e.range.endLineNumber !== e.range.startLineNumber) {
            // This edit might span multiple lines, but the first lines must be a common prefix.
            return undefined;
        }
        const sourceLine = model.getLineContent(e.range.startLineNumber);
        const sourceIndentationLength = (0, strings_1.getLeadingWhitespace)(sourceLine).length;
        const suggestionTouchesIndentation = e.range.startColumn - 1 <= sourceIndentationLength;
        if (suggestionTouchesIndentation) {
            // source:      ··········[······abc]
            //                         ^^^^^^^^^ inlineCompletion.range
            //              ^^^^^^^^^^ ^^^^^^ sourceIndentationLength
            //                         ^^^^^^ replacedIndentation.length
            //                               ^^^ rangeThatDoesNotReplaceIndentation
            // inlineCompletion.text: '··foo'
            //                         ^^ suggestionAddedIndentationLength
            const suggestionAddedIndentationLength = (0, strings_1.getLeadingWhitespace)(e.text).length;
            const replacedIndentation = sourceLine.substring(e.range.startColumn - 1, sourceIndentationLength);
            const [startPosition, endPosition] = [e.range.getStartPosition(), e.range.getEndPosition()];
            const newStartPosition = startPosition.column + replacedIndentation.length <= endPosition.column
                ? startPosition.delta(0, replacedIndentation.length)
                : endPosition;
            const rangeThatDoesNotReplaceIndentation = range_1.Range.fromPositions(newStartPosition, endPosition);
            const suggestionWithoutIndentationChange = e.text.startsWith(replacedIndentation)
                // Adds more indentation without changing existing indentation: We can add ghost text for this
                ? e.text.substring(replacedIndentation.length)
                // Changes or removes existing indentation. Only add ghost text for the non-indentation part.
                : e.text.substring(suggestionAddedIndentationLength);
            e = new textEdit_1.SingleTextEdit(rangeThatDoesNotReplaceIndentation, suggestionWithoutIndentationChange);
        }
        // This is a single line string
        const valueToBeReplaced = model.getValueInRange(e.range);
        const changes = cachingDiff(valueToBeReplaced, e.text);
        if (!changes) {
            // No ghost text in case the diff would be too slow to compute
            return undefined;
        }
        const lineNumber = e.range.startLineNumber;
        const parts = new Array();
        if (mode === 'prefix') {
            const filteredChanges = changes.filter(c => c.originalLength === 0);
            if (filteredChanges.length > 1 || filteredChanges.length === 1 && filteredChanges[0].originalStart !== valueToBeReplaced.length) {
                // Prefixes only have a single change.
                return undefined;
            }
        }
        const previewStartInCompletionText = e.text.length - previewSuffixLength;
        for (const c of changes) {
            const insertColumn = e.range.startColumn + c.originalStart + c.originalLength;
            if (mode === 'subwordSmart' && cursorPosition && cursorPosition.lineNumber === e.range.startLineNumber && insertColumn < cursorPosition.column) {
                // No ghost text before cursor
                return undefined;
            }
            if (c.originalLength > 0) {
                return undefined;
            }
            if (c.modifiedLength === 0) {
                continue;
            }
            const modifiedEnd = c.modifiedStart + c.modifiedLength;
            const nonPreviewTextEnd = Math.max(c.modifiedStart, Math.min(modifiedEnd, previewStartInCompletionText));
            const nonPreviewText = e.text.substring(c.modifiedStart, nonPreviewTextEnd);
            const italicText = e.text.substring(nonPreviewTextEnd, Math.max(c.modifiedStart, modifiedEnd));
            if (nonPreviewText.length > 0) {
                parts.push(new ghostText_1.GhostTextPart(insertColumn, nonPreviewText, false));
            }
            if (italicText.length > 0) {
                parts.push(new ghostText_1.GhostTextPart(insertColumn, italicText, true));
            }
        }
        return new ghostText_1.GhostText(lineNumber, parts);
    }
    function rangeExtends(extendingRange, rangeToExtend) {
        return rangeToExtend.getStartPosition().equals(extendingRange.getStartPosition())
            && rangeToExtend.getEndPosition().isBeforeOrEqual(extendingRange.getEndPosition());
    }
    let lastRequest = undefined;
    function cachingDiff(originalValue, newValue) {
        if (lastRequest?.originalValue === originalValue && lastRequest?.newValue === newValue) {
            return lastRequest?.changes;
        }
        else {
            let changes = smartDiff(originalValue, newValue, true);
            if (changes) {
                const deletedChars = deletedCharacters(changes);
                if (deletedChars > 0) {
                    // For performance reasons, don't compute diff if there is nothing to improve
                    const newChanges = smartDiff(originalValue, newValue, false);
                    if (newChanges && deletedCharacters(newChanges) < deletedChars) {
                        // Disabling smartness seems to be better here
                        changes = newChanges;
                    }
                }
            }
            lastRequest = {
                originalValue,
                newValue,
                changes
            };
            return changes;
        }
    }
    function deletedCharacters(changes) {
        let sum = 0;
        for (const c of changes) {
            sum += c.originalLength;
        }
        return sum;
    }
    /**
     * When matching `if ()` with `if (f() = 1) { g(); }`,
     * align it like this:        `if (       )`
     * Not like this:			  `if (  )`
     * Also not like this:		  `if (             )`.
     *
     * The parenthesis are preprocessed to ensure that they match correctly.
     */
    function smartDiff(originalValue, newValue, smartBracketMatching) {
        if (originalValue.length > 5000 || newValue.length > 5000) {
            // We don't want to work on strings that are too big
            return undefined;
        }
        function getMaxCharCode(val) {
            let maxCharCode = 0;
            for (let i = 0, len = val.length; i < len; i++) {
                const charCode = val.charCodeAt(i);
                if (charCode > maxCharCode) {
                    maxCharCode = charCode;
                }
            }
            return maxCharCode;
        }
        const maxCharCode = Math.max(getMaxCharCode(originalValue), getMaxCharCode(newValue));
        function getUniqueCharCode(id) {
            if (id < 0) {
                throw new Error('unexpected');
            }
            return maxCharCode + id + 1;
        }
        function getElements(source) {
            let level = 0;
            let group = 0;
            const characters = new Int32Array(source.length);
            for (let i = 0, len = source.length; i < len; i++) {
                // TODO support more brackets
                if (smartBracketMatching && source[i] === '(') {
                    const id = group * 100 + level;
                    characters[i] = getUniqueCharCode(2 * id);
                    level++;
                }
                else if (smartBracketMatching && source[i] === ')') {
                    level = Math.max(level - 1, 0);
                    const id = group * 100 + level;
                    characters[i] = getUniqueCharCode(2 * id + 1);
                    if (level === 0) {
                        group++;
                    }
                }
                else {
                    characters[i] = source.charCodeAt(i);
                }
            }
            return characters;
        }
        const elements1 = getElements(originalValue);
        const elements2 = getElements(newValue);
        return new diff_1.LcsDiff({ getElements: () => elements1 }, { getElements: () => elements2 }).ComputeDiff(false).changes;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlVGV4dEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL3NpbmdsZVRleHRFZGl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLG9FQVdDO0lBRUQsd0RBR0M7SUFNRCw0Q0F1R0M7SUE3SEQsU0FBZ0IsNEJBQTRCLENBQUMsSUFBb0IsRUFBRSxLQUFpQixFQUFFLGVBQXVCO1FBQzVHLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDOUYsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2pCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsVUFBVSxpQ0FBeUIsQ0FBQztRQUNqRixNQUFNLGVBQWUsR0FBRyxJQUFBLDRCQUFrQixFQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEUsTUFBTSxLQUFLLEdBQUcsdUJBQVUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFDM0gsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEQsTUFBTSxLQUFLLEdBQUcsYUFBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtB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