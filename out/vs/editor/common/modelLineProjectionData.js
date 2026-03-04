/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/editor/common/core/position", "vs/editor/common/model"], function (require, exports, assert_1, position_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputPosition = exports.InjectedText = exports.ModelLineProjectionData = void 0;
    /**
     * *input*:
     * ```
     * xxxxxxxxxxxxxxxxxxxxxxxxxxx
     * ```
     *
     * -> Applying injections `[i...i]`, *inputWithInjections*:
     * ```
     * xxxxxx[iiiiiiiiii]xxxxxxxxxxxxxxxxx[ii]xxxx
     * ```
     *
     * -> breaking at offsets `|` in `xxxxxx[iiiiiii|iii]xxxxxxxxxxx|xxxxxx[ii]xxxx|`:
     * ```
     * xxxxxx[iiiiiii
     * iii]xxxxxxxxxxx
     * xxxxxx[ii]xxxx
     * ```
     *
     * -> applying wrappedTextIndentLength, *output*:
     * ```
     * xxxxxx[iiiiiii
     *    iii]xxxxxxxxxxx
     *    xxxxxx[ii]xxxx
     * ```
     */
    class ModelLineProjectionData {
        constructor(injectionOffsets, 
        /**
         * `injectionOptions.length` must equal `injectionOffsets.length`
         */
        injectionOptions, 
        /**
         * Refers to offsets after applying injections to the source.
         * The last break offset indicates the length of the source after applying injections.
         */
        breakOffsets, 
        /**
         * Refers to offsets after applying injections
         */
        breakOffsetsVisibleColumn, wrappedTextIndentLength) {
            this.injectionOffsets = injectionOffsets;
            this.injectionOptions = injectionOptions;
            this.breakOffsets = breakOffsets;
            this.breakOffsetsVisibleColumn = breakOffsetsVisibleColumn;
            this.wrappedTextIndentLength = wrappedTextIndentLength;
        }
        getOutputLineCount() {
            return this.breakOffsets.length;
        }
        getMinOutputOffset(outputLineIndex) {
            if (outputLineIndex > 0) {
                return this.wrappedTextIndentLength;
            }
            return 0;
        }
        getLineLength(outputLineIndex) {
            // These offsets refer to model text with injected text.
            const startOffset = outputLineIndex > 0 ? this.breakOffsets[outputLineIndex - 1] : 0;
            const endOffset = this.breakOffsets[outputLineIndex];
            let lineLength = endOffset - startOffset;
            if (outputLineIndex > 0) {
                lineLength += this.wrappedTextIndentLength;
            }
            return lineLength;
        }
        getMaxOutputOffset(outputLineIndex) {
            return this.getLineLength(outputLineIndex);
        }
        translateToInputOffset(outputLineIndex, outputOffset) {
            if (outputLineIndex > 0) {
                outputOffset = Math.max(0, outputOffset - this.wrappedTextIndentLength);
            }
            const offsetInInputWithInjection = outputLineIndex === 0 ? outputOffset : this.breakOffsets[outputLineIndex - 1] + outputOffset;
            let offsetInInput = offsetInInputWithInjection;
            if (this.injectionOffsets !== null) {
                for (let i = 0; i < this.injectionOffsets.length; i++) {
                    if (offsetInInput > this.injectionOffsets[i]) {
                        if (offsetInInput < this.injectionOffsets[i] + this.injectionOptions[i].content.length) {
                            // `inputOffset` is within injected text
                            offsetInInput = this.injectionOffsets[i];
                        }
                        else {
                            offsetInInput -= this.injectionOptions[i].content.length;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return offsetInInput;
        }
        translateToOutputPosition(inputOffset, affinity = 2 /* PositionAffinity.None */) {
            let inputOffsetInInputWithInjection = inputOffset;
            if (this.injectionOffsets !== null) {
                for (let i = 0; i < this.injectionOffsets.length; i++) {
                    if (inputOffset < this.injectionOffsets[i]) {
                        break;
                    }
                    if (affinity !== 1 /* PositionAffinity.Right */ && inputOffset === this.injectionOffsets[i]) {
                        break;
                    }
                    inputOffsetInInputWithInjection += this.injectionOptions[i].content.length;
                }
            }
            return this.offsetInInputWithInjectionsToOutputPosition(inputOffsetInInputWithInjection, affinity);
        }
        offsetInInputWithInjectionsToOutputPosition(offsetInInputWithInjections, affinity = 2 /* PositionAffinity.None */) {
            let low = 0;
            let high = this.breakOffsets.length - 1;
            let mid = 0;
            let midStart = 0;
            while (low <= high) {
                mid = low + ((high - low) / 2) | 0;
                const midStop = this.breakOffsets[mid];
                midStart = mid > 0 ? this.breakOffsets[mid - 1] : 0;
                if (affinity === 0 /* PositionAffinity.Left */) {
                    if (offsetInInputWithInjections <= midStart) {
                        high = mid - 1;
                    }
                    else if (offsetInInputWithInjections > midStop) {
                        low = mid + 1;
                    }
                    else {
                        break;
                    }
                }
                else {
                    if (offsetInInputWithInjections < midStart) {
                        high = mid - 1;
                    }
                    else if (offsetInInputWithInjections >= midStop) {
                        low = mid + 1;
                    }
                    else {
                        break;
                    }
                }
            }
            let outputOffset = offsetInInputWithInjections - midStart;
            if (mid > 0) {
                outputOffset += this.wrappedTextIndentLength;
            }
            return new OutputPosition(mid, outputOffset);
        }
        normalizeOutputPosition(outputLineIndex, outputOffset, affinity) {
            if (this.injectionOffsets !== null) {
                const offsetInInputWithInjections = this.outputPositionToOffsetInInputWithInjections(outputLineIndex, outputOffset);
                const normalizedOffsetInUnwrappedLine = this.normalizeOffsetInInputWithInjectionsAroundInjections(offsetInInputWithInjections, affinity);
                if (normalizedOffsetInUnwrappedLine !== offsetInInputWithInjections) {
                    // injected text caused a change
                    return this.offsetInInputWithInjectionsToOutputPosition(normalizedOffsetInUnwrappedLine, affinity);
                }
            }
            if (affinity === 0 /* PositionAffinity.Left */) {
                if (outputLineIndex > 0 && outputOffset === this.getMinOutputOffset(outputLineIndex)) {
                    return new OutputPosition(outputLineIndex - 1, this.getMaxOutputOffset(outputLineIndex - 1));
                }
            }
            else if (affinity === 1 /* PositionAffinity.Right */) {
                const maxOutputLineIndex = this.getOutputLineCount() - 1;
                if (outputLineIndex < maxOutputLineIndex && outputOffset === this.getMaxOutputOffset(outputLineIndex)) {
                    return new OutputPosition(outputLineIndex + 1, this.getMinOutputOffset(outputLineIndex + 1));
                }
            }
            return new OutputPosition(outputLineIndex, outputOffset);
        }
        outputPositionToOffsetInInputWithInjections(outputLineIndex, outputOffset) {
            if (outputLineIndex > 0) {
                outputOffset = Math.max(0, outputOffset - this.wrappedTextIndentLength);
            }
            const result = (outputLineIndex > 0 ? this.breakOffsets[outputLineIndex - 1] : 0) + outputOffset;
            return result;
        }
        normalizeOffsetInInputWithInjectionsAroundInjections(offsetInInputWithInjections, affinity) {
            const injectedText = this.getInjectedTextAtOffset(offsetInInputWithInjections);
            if (!injectedText) {
                return offsetInInputWithInjections;
            }
            if (affinity === 2 /* PositionAffinity.None */) {
                if (offsetInInputWithInjections === injectedText.offsetInInputWithInjections + injectedText.length
                    && hasRightCursorStop(this.injectionOptions[injectedText.injectedTextIndex].cursorStops)) {
                    return injectedText.offsetInInputWithInjections + injectedText.length;
                }
                else {
                    let result = injectedText.offsetInInputWithInjections;
                    if (hasLeftCursorStop(this.injectionOptions[injectedText.injectedTextIndex].cursorStops)) {
                        return result;
                    }
                    let index = injectedText.injectedTextIndex - 1;
                    while (index >= 0 && this.injectionOffsets[index] === this.injectionOffsets[injectedText.injectedTextIndex]) {
                        if (hasRightCursorStop(this.injectionOptions[index].cursorStops)) {
                            break;
                        }
                        result -= this.injectionOptions[index].content.length;
                        if (hasLeftCursorStop(this.injectionOptions[index].cursorStops)) {
                            break;
                        }
                        index--;
                    }
                    return result;
                }
            }
            else if (affinity === 1 /* PositionAffinity.Right */ || affinity === 4 /* PositionAffinity.RightOfInjectedText */) {
                let result = injectedText.offsetInInputWithInjections + injectedText.length;
                let index = injectedText.injectedTextIndex;
                // traverse all injected text that touch each other
                while (index + 1 < this.injectionOffsets.length && this.injectionOffsets[index + 1] === this.injectionOffsets[index]) {
                    result += this.injectionOptions[index + 1].content.length;
                    index++;
                }
                return result;
            }
            else if (affinity === 0 /* PositionAffinity.Left */ || affinity === 3 /* PositionAffinity.LeftOfInjectedText */) {
                // affinity is left
                let result = injectedText.offsetInInputWithInjections;
                let index = injectedText.injectedTextIndex;
                // traverse all injected text that touch each other
                while (index - 1 >= 0 && this.injectionOffsets[index - 1] === this.injectionOffsets[index]) {
                    result -= this.injectionOptions[index - 1].content.length;
                    index--;
                }
                return result;
            }
            (0, assert_1.assertNever)(affinity);
        }
        getInjectedText(outputLineIndex, outputOffset) {
            const offset = this.outputPositionToOffsetInInputWithInjections(outputLineIndex, outputOffset);
            const injectedText = this.getInjectedTextAtOffset(offset);
            if (!injectedText) {
                return null;
            }
            return {
                options: this.injectionOptions[injectedText.injectedTextIndex]
            };
        }
        getInjectedTextAtOffset(offsetInInputWithInjections) {
            const injectionOffsets = this.injectionOffsets;
            const injectionOptions = this.injectionOptions;
            if (injectionOffsets !== null) {
                let totalInjectedTextLengthBefore = 0;
                for (let i = 0; i < injectionOffsets.length; i++) {
                    const length = injectionOptions[i].content.length;
                    const injectedTextStartOffsetInInputWithInjections = injectionOffsets[i] + totalInjectedTextLengthBefore;
                    const injectedTextEndOffsetInInputWithInjections = injectionOffsets[i] + totalInjectedTextLengthBefore + length;
                    if (injectedTextStartOffsetInInputWithInjections > offsetInInputWithInjections) {
                        // Injected text starts later.
                        break; // All later injected texts have an even larger offset.
                    }
                    if (offsetInInputWithInjections <= injectedTextEndOffsetInInputWithInjections) {
                        // Injected text ends after or with the given position (but also starts with or before it).
                        return {
                            injectedTextIndex: i,
                            offsetInInputWithInjections: injectedTextStartOffsetInInputWithInjections,
                            length
                        };
                    }
                    totalInjectedTextLengthBefore += length;
                }
            }
            return undefined;
        }
    }
    exports.ModelLineProjectionData = ModelLineProjectionData;
    function hasRightCursorStop(cursorStop) {
        if (cursorStop === null || cursorStop === undefined) {
            return true;
        }
        return cursorStop === model_1.InjectedTextCursorStops.Right || cursorStop === model_1.InjectedTextCursorStops.Both;
    }
    function hasLeftCursorStop(cursorStop) {
        if (cursorStop === null || cursorStop === undefined) {
            return true;
        }
        return cursorStop === model_1.InjectedTextCursorStops.Left || cursorStop === model_1.InjectedTextCursorStops.Both;
    }
    class InjectedText {
        constructor(options) {
            this.options = options;
        }
    }
    exports.InjectedText = InjectedText;
    class OutputPosition {
        constructor(outputLineIndex, outputOffset) {
            this.outputLineIndex = outputLineIndex;
            this.outputOffset = outputOffset;
        }
        toString() {
            return `${this.outputLineIndex}:${this.outputOffset}`;
        }
        toPosition(baseLineNumber) {
            return new position_1.Position(baseLineNumber + this.outputLineIndex, this.outputOffset + 1);
        }
    }
    exports.OutputPosition = OutputPosition;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxMaW5lUHJvamVjdGlvbkRhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsTGluZVByb2plY3Rpb25EYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bd0JHO0lBQ0gsTUFBYSx1QkFBdUI7UUFDbkMsWUFDUSxnQkFBaUM7UUFDeEM7O1dBRUc7UUFDSSxnQkFBOEM7UUFDckQ7OztXQUdHO1FBQ0ksWUFBc0I7UUFDN0I7O1dBRUc7UUFDSSx5QkFBbUMsRUFDbkMsdUJBQStCO1lBZC9CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBaUI7WUFJakMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUE4QjtZQUs5QyxpQkFBWSxHQUFaLFlBQVksQ0FBVTtZQUl0Qiw4QkFBeUIsR0FBekIseUJBQXlCLENBQVU7WUFDbkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUFRO1FBRXZDLENBQUM7UUFFTSxrQkFBa0I7WUFDeEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxDQUFDO1FBRU0sa0JBQWtCLENBQUMsZUFBdUI7WUFDaEQsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQ3JDLENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFFTSxhQUFhLENBQUMsZUFBdUI7WUFDM0Msd0RBQXdEO1lBQ3hELE1BQU0sV0FBVyxHQUFHLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckYsTUFB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