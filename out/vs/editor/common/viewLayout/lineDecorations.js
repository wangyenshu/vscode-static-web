/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineDecorationsNormalizer = exports.DecorationSegment = exports.LineDecoration = void 0;
    class LineDecoration {
        constructor(startColumn, endColumn, className, type) {
            this.startColumn = startColumn;
            this.endColumn = endColumn;
            this.className = className;
            this.type = type;
            this._lineDecorationBrand = undefined;
        }
        static _equals(a, b) {
            return (a.startColumn === b.startColumn
                && a.endColumn === b.endColumn
                && a.className === b.className
                && a.type === b.type);
        }
        static equalsArr(a, b) {
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!LineDecoration._equals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        static extractWrapped(arr, startOffset, endOffset) {
            if (arr.length === 0) {
                return arr;
            }
            const startColumn = startOffset + 1;
            const endColumn = endOffset + 1;
            const lineLength = endOffset - startOffset;
            const r = [];
            let rLength = 0;
            for (const dec of arr) {
                if (dec.endColumn <= startColumn || dec.startColumn >= endColumn) {
                    continue;
                }
                r[rLength++] = new LineDecoration(Math.max(1, dec.startColumn - startColumn + 1), Math.min(lineLength + 1, dec.endColumn - startColumn + 1), dec.className, dec.type);
            }
            return r;
        }
        static filter(lineDecorations, lineNumber, minLineColumn, maxLineColumn) {
            if (lineDecorations.length === 0) {
                return [];
            }
            const result = [];
            let resultLen = 0;
            for (let i = 0, len = lineDecorations.length; i < len; i++) {
                const d = lineDecorations[i];
                const range = d.range;
                if (range.endLineNumber < lineNumber || range.startLineNumber > lineNumber) {
                    // Ignore decorations that sit outside this line
                    continue;
                }
                if (range.isEmpty() && (d.type === 0 /* InlineDecorationType.Regular */ || d.type === 3 /* InlineDecorationType.RegularAffectingLetterSpacing */)) {
                    // Ignore empty range decorations
                    continue;
                }
                const startColumn = (range.startLineNumber === lineNumber ? range.startColumn : minLineColumn);
                const endColumn = (range.endLineNumber === lineNumber ? range.endColumn : maxLineColumn);
                result[resultLen++] = new LineDecoration(startColumn, endColumn, d.inlineClassName, d.type);
            }
            return result;
        }
        static _typeCompare(a, b) {
            const ORDER = [2, 0, 1, 3];
            return ORDER[a] - ORDER[b];
        }
        static compare(a, b) {
            if (a.startColumn !== b.startColumn) {
                return a.startColumn - b.startColumn;
            }
            if (a.endColumn !== b.endColumn) {
                return a.endColumn - b.endColumn;
            }
            const typeCmp = LineDecoration._typeCompare(a.type, b.type);
            if (typeCmp !== 0) {
                return typeCmp;
            }
            if (a.className !== b.className) {
                return a.className < b.className ? -1 : 1;
            }
            return 0;
        }
    }
    exports.LineDecoration = LineDecoration;
    class DecorationSegment {
        constructor(startOffset, endOffset, className, metadata) {
            this.startOffset = startOffset;
            this.endOffset = endOffset;
            this.className = className;
            this.metadata = metadata;
        }
    }
    exports.DecorationSegment = DecorationSegment;
    class Stack {
        constructor() {
            this.stopOffsets = [];
            this.classNames = [];
            this.metadata = [];
            this.count = 0;
        }
        static _metadata(metadata) {
            let result = 0;
            for (let i = 0, len = metadata.length; i < len; i++) {
                result |= metadata[i];
            }
            return result;
        }
        consumeLowerThan(maxStopOffset, nextStartOffset, result) {
            while (this.count > 0 && this.stopOffsets[0] < maxStopOffset) {
                let i = 0;
                // Take all equal stopping offsets
                while (i + 1 < this.count && this.stopOffsets[i] === this.stopOffsets[i + 1]) {
                    i++;
                }
                // Basically we are consuming the first i + 1 elements of the stack
                result.push(new DecorationSegment(nextStartOffset, this.stopOffsets[i], this.classNames.join(' '), Stack._metadata(this.metadata)));
                nextStartOffset = this.stopOffsets[i] + 1;
                // Consume them
                this.stopOffsets.splice(0, i + 1);
                this.classNames.splice(0, i + 1);
                this.metadata.splice(0, i + 1);
                this.count -= (i + 1);
            }
            if (this.count > 0 && nextStartOffset < maxStopOffset) {
                result.push(new DecorationSegment(nextStartOffset, maxStopOffset - 1, this.classNames.join(' '), Stack._metadata(this.metadata)));
                nextStartOffset = maxStopOffset;
            }
            return nextStartOffset;
        }
        insert(stopOffset, className, metadata) {
            if (this.count === 0 || this.stopOffsets[this.count - 1] <= stopOffset) {
                // Insert at the end
                this.stopOffsets.push(stopOffset);
                this.classNames.push(className);
                this.metadata.push(metadata);
            }
            else {
                // Find the insertion position for `stopOffset`
                for (let i = 0; i < this.count; i++) {
                    if (this.stopOffsets[i] >= stopOffset) {
                        this.stopOffsets.splice(i, 0, stopOffset);
                        this.classNames.splice(i, 0, className);
                        this.metadata.splice(i, 0, metadata);
                        break;
                    }
                }
            }
            this.count++;
            return;
        }
    }
    class LineDecorationsNormalizer {
        /**
         * Normalize line decorations. Overlapping decorations will generate multiple segments
         */
        static normalize(lineContent, lineDecorations) {
            if (lineDecorations.length === 0) {
                return [];
            }
            const result = [];
            const stack = new Stack();
            let nextStartOffset = 0;
            for (let i = 0, len = lineDecorations.length; i < len; i++) {
                const d = lineDecorations[i];
                let startColumn = d.startColumn;
                let endColumn = d.endColumn;
                const className = d.className;
                const metadata = (d.type === 1 /* InlineDecorationType.Before */
                    ? 2 /* LinePartMetadata.PSEUDO_BEFORE */
                    : d.type === 2 /* InlineDecorationType.After */
                        ? 4 /* LinePartMetadata.PSEUDO_AFTER */
                        : 0);
                // If the position would end up in the middle of a high-low surrogate pair, we move it to before the pair
                if (startColumn > 1) {
                    const charCodeBefore = lineContent.charCodeAt(startColumn - 2);
                    if (strings.isHighSurrogate(charCodeBefore)) {
                        startColumn--;
                    }
                }
                if (endColumn > 1) {
                    const charCodeBefore = lineContent.charCodeAt(endColumn - 2);
                    if (strings.isHighSurrogate(charCodeBefore)) {
                        endColumn--;
                    }
                }
                const currentStartOffset = startColumn - 1;
                const currentEndOffset = endColumn - 2;
                nextStartOffset = stack.consumeLowerThan(currentStartOffset, nextStartOffset, result);
                if (stack.count === 0) {
                    nextStartOffset = currentStartOffset;
                }
                stack.insert(currentEndOffset, className, metadata);
            }
            stack.consumeLowerThan(1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, nextStartOffset, result);
            return result;
        }
    }
    exports.LineDecorationsNormalizer = LineDecorationsNormalizer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZURlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TGF5b3V0L2xpbmVEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxjQUFjO1FBRzFCLFlBQ2lCLFdBQW1CLEVBQ25CLFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLElBQTBCO1lBSDFCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixTQUFJLEdBQUosSUFBSSxDQUFzQjtZQU4zQyx5QkFBb0IsR0FBUyxTQUFTLENBQUM7UUFRdkMsQ0FBQztRQUVPLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBaUIsRUFBRSxDQUFpQjtZQUMxRCxPQUFPLENBQ04sQ0FBQyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUMsV0FBVzttQkFDNUIsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsU0FBUzttQkFDM0IsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsU0FBUzttQkFDM0IsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUNwQixDQUFDO1FBQ0gsQ0FBQztRQUVNLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBbUIsRUFBRSxDQUFtQjtZQUMvRCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3RCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDdEIsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFF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