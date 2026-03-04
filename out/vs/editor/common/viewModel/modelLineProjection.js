/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/tokens/lineTokens", "vs/editor/common/core/position", "vs/editor/common/textModelEvents", "vs/editor/common/viewModel"], function (require, exports, lineTokens_1, position_1, textModelEvents_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createModelLineProjection = createModelLineProjection;
    function createModelLineProjection(lineBreakData, isVisible) {
        if (lineBreakData === null) {
            // No mapping needed
            if (isVisible) {
                return IdentityModelLineProjection.INSTANCE;
            }
            return HiddenModelLineProjection.INSTANCE;
        }
        else {
            return new ModelLineProjection(lineBreakData, isVisible);
        }
    }
    /**
     * This projection is used to
     * * wrap model lines
     * * inject text
     */
    class ModelLineProjection {
        constructor(lineBreakData, isVisible) {
            this._projectionData = lineBreakData;
            this._isVisible = isVisible;
        }
        isVisible() {
            return this._isVisible;
        }
        setVisible(isVisible) {
            this._isVisible = isVisible;
            return this;
        }
        getProjectionData() {
            return this._projectionData;
        }
        getViewLineCount() {
            if (!this._isVisible) {
                return 0;
            }
            return this._projectionData.getOutputLineCount();
        }
        getViewLineContent(model, modelLineNumber, outputLineIndex) {
            this._assertVisible();
            const startOffsetInInputWithInjections = outputLineIndex > 0 ? this._projectionData.breakOffsets[outputLineIndex - 1] : 0;
            const endOffsetInInputWithInjections = this._projectionData.breakOffsets[outputLineIndex];
            let r;
            if (this._projectionData.injectionOffsets !== null) {
                const injectedTexts = this._projectionData.injectionOffsets.map((offset, idx) => new textModelEvents_1.LineInjectedText(0, 0, offset + 1, this._projectionData.injectionOptions[idx], 0));
                const lineWithInjections = textModelEvents_1.LineInjectedText.applyInjectedText(model.getLineContent(modelLineNumber), injectedTexts);
                r = lineWithInjections.substring(startOffsetInInputWithInjections, endOffsetInInputWithInjections);
            }
            else {
                r = model.getValueInRange({
                    startLineNumber: modelLineNumber,
                    startColumn: startOffsetInInputWithInjections + 1,
                    endLineNumber: modelLineNumber,
                    endColumn: endOffsetInInputWithInjections + 1
                });
            }
            if (outputLineIndex > 0) {
                r = spaces(this._projectionData.wrappedTextIndentLength) + r;
            }
            return r;
        }
        getViewLineLength(model, modelLineNumber, outputLineIndex) {
            this._assertVisible();
            return this._projectionData.getLineLength(outputLineIndex);
        }
        getViewLineMinColumn(_model, _modelLineNumber, outputLineIndex) {
            this._assertVisible();
            return this._projectionData.getMinOutputOffset(outputLineIndex) + 1;
        }
        getViewLineMaxColumn(model, modelLineNumber, outputLineIndex) {
            this._assertVisible();
            return this._projectionData.getMaxOutputOffset(outputLineIndex) + 1;
        }
        /**
         * Try using {@link getViewLinesData} instead.
        */
        getViewLineData(model, modelLineNumber, outputLineIndex) {
            const arr = new Array();
            this.getViewLinesData(model, modelLineNumber, outputLineIndex, 1, 0, [true], arr);
            return arr[0];
        }
        getViewLinesData(model, modelLineNumber, outputLineIdx, lineCount, globalStartIndex, needed, result) {
            this._assertVisible();
            const lineBreakData = this._projectionData;
            const injectionOffsets = lineBreakData.injectionOffsets;
            const injectionOptions = lineBreakData.injectionOptions;
            let inlineDecorationsPerOutputLine = null;
            if (injectionOffsets) {
                inlineDecorationsPerOutputLine = [];
                let totalInjectedTextLengthBefore = 0;
                let currentInjectedOffset = 0;
                for (let outputLineIndex = 0; outputLineIndex < lineBreakData.getOutputLineCount(); outputLineIndex++) {
                    const inlineDecorations = new Array();
                    inlineDecorationsPerOutputLine[outputLineIndex] = inlineDecorations;
                    const lineStartOffsetInInputWithInjections = outputLineIndex > 0 ? lineBreakData.breakOffsets[outputLineIndex - 1] : 0;
                    const lineEndOffsetInInputWithInjections = lineBreakData.breakOffsets[outputLineIndex];
                    while (currentInjectedOffset < injectionOffsets.length) {
                        const length = injectionOptions[currentInjectedOffset].content.length;
                        const injectedTextStartOffsetInInputWithInjections = injectionOffsets[currentInjectedOffset] + totalInjectedTextLengthBefore;
                        const injectedTextEndOffsetInInputWithInjections = injectedTextStartOffsetInInputWithInjections + length;
                        if (injectedTextStartOffsetInInputWithInjections > lineEndOffsetInInputWithInjections) {
                            // Injected text only starts in later wrapped lines.
                            break;
                        }
                        if (lineStartOffsetInInputWithInjections < injectedTextEndOffsetInInputWithInjections) {
                            // Injected text ends after or in this line (but also starts in or before this line).
                            const options = injectionOptions[currentInjectedOffset];
                            if (options.inlineClassName) {
                                const offset = (outputLineIndex > 0 ? lineBreakData.wrappedTextIndentLength : 0);
                                const start = offset + Math.max(injectedTextStartOffsetInInputWithInjections - lineStartOffsetInInputWithInjections, 0);
                                const end = offset + Math.min(injectedTextEndOffsetInInputWithInjections - lineStartOffsetInInputWithInjections, lineEndOffsetInInputWithInjections - lineStartOffsetInInputWithInjections);
                                if (start !== end) {
                                    inlineDecorations.push(new viewModel_1.SingleLineInlineDecoration(start, end, options.inlineClassName, options.inlineClassNameAffectsLetterSpacing));
                                }
                            }
                        }
                        if (injectedTextEndOffsetInInputWithInjections <= lineEndOffsetInInputWithInjections) {
                            totalInjectedTextLengthBefore += length;
                            currentInjectedOffset++;
                        }
                        else {
                            // injected text breaks into next line, process it again
                            break;
                        }
                    }
                }
            }
            let lineWithInjections;
            if (injectionOffsets) {
                lineWithInjections = model.tokenization.getLineTokens(modelLineNumber).withInserted(injectionOffsets.map((offset, idx) => ({
                    offset,
                    text: injectionOptions[idx].content,
                    tokenMetadata: lineTokens_1.LineTokens.defaultTokenMetadata
                })));
            }
            else {
                lineWithInjections = model.tokenization.getLineTokens(modelLineNumber);
            }
            for (let outputLineIndex = outputLineIdx; outputLineIndex < outputLineIdx + lineCount; outputLineIndex++) {
                const globalIndex = globalStartIndex + outputLineIndex - outputLineIdx;
                if (!needed[globalIndex]) {
                    result[globalIndex] = null;
                    continue;
                }
                result[globalIndex] = this._getViewLineData(lineWithInjections, inlineDecorationsPerOutputLine ? inlineDecorationsPerOutputLine[outputLineIndex] : null, outputLineIndex);
            }
        }
        _getViewLineData(lineWithInjections, inlineDecorations, outputLineIndex) {
            this._assertVisible();
            const lineBreakData = this._projectionData;
            const deltaStartIndex = (outputLineIndex > 0 ? lineBreakData.wrappedTextIndentLength : 0);
            const lineStartOffsetInInputWithInjections = outputLineIndex > 0 ? lineBreakData.breakOffsets[outputLineIndex - 1] : 0;
            const lineEndOffsetInInputWithInjections = lineBreakData.breakOffsets[outputLineIndex];
            const tokens = lineWithInjections.sliceAndInflate(lineStartOffsetInInputWithInjections, lineEndOffsetInInputWithInjections, deltaStartIndex);
            let lineContent = tokens.getLineContent();
            if (outputLineIndex > 0) {
                lineContent = spaces(lineBreakData.wrappedTextIndentLength) + lineContent;
            }
            const minColumn = this._projectionData.getMinOutputOffset(outputLineIndex) + 1;
            const maxColumn = lineContent.length + 1;
            const continuesWithWrappedLine = (outputLineIndex + 1 < this.getViewLineCount());
            const startVisibleColumn = (outputLineIndex === 0 ? 0 : lineBreakData.breakOffsetsVisibleColumn[outputLineIndex - 1]);
            return new viewModel_1.ViewLineData(lineContent, continuesWithWrappedLine, minColumn, maxColumn, startVisibleColumn, tokens, inlineDecorations);
        }
        getModelColumnOfViewPosition(outputLineIndex, outputColumn) {
            this._assertVisible();
            return this._projectionData.translateToInputOffset(outputLineIndex, outputColumn - 1) + 1;
        }
        getViewPositionOfModelPosition(deltaLineNumber, inputColumn, affinity = 2 /* PositionAffinity.None */) {
            this._assertVisible();
            const r = this._projectionData.translateToOutputPosition(inputColumn - 1, affinity);
            return r.toPosition(deltaLineNumber);
        }
        getViewLineNumberOfModelPosition(deltaLineNumber, inputColumn) {
            this._assertVisible();
            const r = this._projectionData.translateToOutputPosition(inputColumn - 1);
            return deltaLineNumber + r.outputLineIndex;
        }
        normalizePosition(outputLineIndex, outputPosition, affinity) {
            const baseViewLineNumber = outputPosition.lineNumber - outputLineIndex;
            const normalizedOutputPosition = this._projectionData.normalizeOutputPosition(outputLineIndex, outputPosition.column - 1, affinity);
            const result = normalizedOutputPosition.toPosition(baseViewLineNumber);
            return result;
        }
        getInjectedTextAt(outputLineIndex, outputColumn) {
            return this._projectionData.getInjectedText(outputLineIndex, outputColumn - 1);
        }
        _assertVisible() {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
        }
    }
    /**
     * This projection does not change the model line.
    */
    class IdentityModelLineProjection {
        static { this.INSTANCE = new IdentityModelLineProjection(); }
        constructor() { }
        isVisible() {
            return true;
        }
        setVisible(isVisible) {
            if (isVisible) {
                return this;
            }
            return HiddenModelLineProjection.INSTANCE;
        }
        getProjectionData() {
            return null;
        }
        getViewLineCount() {
            return 1;
        }
        getViewLineContent(model, modelLineNumber, _outputLineIndex) {
            return model.getLineContent(modelLineNumber);
        }
        getViewLineLength(model, modelLineNumber, _outputLineIndex) {
            return model.getLineLength(modelLineNumber);
        }
        getViewLineMinColumn(model, modelLineNumber, _outputLineIndex) {
            return model.getLineMinColumn(modelLineNumber);
        }
        getViewLineMaxColumn(model, modelLineNumber, _outputLineIndex) {
            return model.getLineMaxColumn(modelLineNumber);
        }
        getViewLineData(model, modelLineNumber, _outputLineIndex) {
            const lineTokens = model.tokenization.getLineTokens(modelLineNumber);
            const lineContent = lineTokens.getLineContent();
            return new viewModel_1.ViewLineData(lineContent, false, 1, lineContent.length + 1, 0, lineTokens.inflate(), null);
        }
        getViewLinesData(model, modelLineNumber, _fromOuputLineIndex, _toOutputLineIndex, globalStartIndex, needed, result) {
            if (!needed[globalStartIndex]) {
                result[globalStartIndex] = null;
                return;
            }
            result[globalStartIndex] = this.getViewLineData(model, modelLineNumber, 0);
        }
        getModelColumnOfViewPosition(_outputLineIndex, outputColumn) {
            return outputColumn;
        }
        getViewPositionOfModelPosition(deltaLineNumber, inputColumn) {
            return new position_1.Position(deltaLineNumber, inputColumn);
        }
        getViewLineNumberOfModelPosition(deltaLineNumber, _inputColumn) {
            return deltaLineNumber;
        }
        normalizePosition(outputLineIndex, outputPosition, affinity) {
            return outputPosition;
        }
        getInjectedTextAt(_outputLineIndex, _outputColumn) {
            return null;
        }
    }
    /**
     * This projection hides the model line.
     */
    class HiddenModelLineProjection {
        static { this.INSTANCE = new HiddenModelLineProjection(); }
        constructor() { }
        isVisible() {
            return false;
        }
        setVisible(isVisible) {
            if (!isVisible) {
                return this;
            }
            return IdentityModelLineProjection.INSTANCE;
        }
        getProjectionData() {
            return null;
        }
        getViewLineCount() {
            return 0;
        }
        getViewLineContent(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineLength(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineMinColumn(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineMaxColumn(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineData(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLinesData(_model, _modelLineNumber, _fromOuputLineIndex, _toOutputLineIndex, _globalStartIndex, _needed, _result) {
            throw new Error('Not supported');
        }
        getModelColumnOfViewPosition(_outputLineIndex, _outputColumn) {
            throw new Error('Not supported');
        }
        getViewPositionOfModelPosition(_deltaLineNumber, _inputColumn) {
            throw new Error('Not supported');
        }
        getViewLineNumberOfModelPosition(_deltaLineNumber, _inputColumn) {
            throw new Error('Not supported');
        }
        normalizePosition(outputLineIndex, outputPosition, affinity) {
            throw new Error('Not supported');
        }
        getInjectedTextAt(_outputLineIndex, _outputColumn) {
            throw new Error('Not supported');
        }
    }
    const _spaces = [''];
    function spaces(count) {
        if (count >= _spaces.length) {
            for (let i = 1; i <= count; i++) {
                _spaces[i] = _makeSpaces(i);
            }
        }
        return _spaces[count];
    }
    function _makeSpaces(count) {
        return new Array(count + 1).join(' ');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxMaW5lUHJvamVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld01vZGVsL21vZGVsTGluZVByb2plY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE4Q2hHLDhEQVVDO0lBVkQsU0FBZ0IseUJBQXlCLENBQUMsYUFBNkMsRUFBRSxTQUFrQjtRQUMxRyxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUM1QixvQkFBb0I7WUFDcEIsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixPQUFPLDJCQUEyQixDQUFDLFFBQVEsQ0FBQztZQUM3QyxDQUFDO1lBQ0QsT0FBTyx5QkFBeUIsQ0FBQyxRQUFRLENBQUM7UUFDM0MsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLElBQUksbUJBQW1CLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFELENBQUM7SUFDRixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sbUJBQW1CO1FBSXhCLFlBQVksYUFBc0MsRUFBRSxTQUFrQjtZQUNyRSxJQUFJLENBQUMsZUFBZSxHQUFHLGFBQWEsQ0FBQztZQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUM3QixDQUFDO1FBRU0sU0FBUztZQUNmLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBRU0sVUFBVSxDQUFDLFNBQWtCO1lBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLGlCQUFpQjtZQUN2QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVNLGdCQUFnQjtZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUs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