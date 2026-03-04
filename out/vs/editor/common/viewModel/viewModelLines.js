/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/textModelGuides", "vs/editor/common/model/textModel", "vs/editor/common/textModelEvents", "vs/editor/common/viewEvents", "vs/editor/common/viewModel/modelLineProjection", "vs/editor/common/model/prefixSumComputer", "vs/editor/common/viewModel"], function (require, exports, arrays, position_1, range_1, textModelGuides_1, textModel_1, textModelEvents_1, viewEvents, modelLineProjection_1, prefixSumComputer_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModelLinesFromModelAsIs = exports.ViewModelLinesFromProjectedModel = void 0;
    class ViewModelLinesFromProjectedModel {
        constructor(editorId, model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, fontInfo, tabSize, wrappingStrategy, wrappingColumn, wrappingIndent, wordBreak) {
            this._editorId = editorId;
            this.model = model;
            this._validModelVersionId = -1;
            this._domLineBreaksComputerFactory = domLineBreaksComputerFactory;
            this._monospaceLineBreaksComputerFactory = monospaceLineBreaksComputerFactory;
            this.fontInfo = fontInfo;
            this.tabSize = tabSize;
            this.wrappingStrategy = wrappingStrategy;
            this.wrappingColumn = wrappingColumn;
            this.wrappingIndent = wrappingIndent;
            this.wordBreak = wordBreak;
            this._constructLines(/*resetHiddenAreas*/ true, null);
        }
        dispose() {
            this.hiddenAreasDecorationIds = this.model.deltaDecorations(this.hiddenAreasDecorationIds, []);
        }
        createCoordinatesConverter() {
            return new CoordinatesConverter(this);
        }
        _constructLines(resetHiddenAreas, previousLineBreaks) {
            this.modelLineProjections = [];
            if (resetHiddenAreas) {
                this.hiddenAreasDecorationIds = this.model.deltaDecorations(this.hiddenAreasDecorationIds, []);
            }
            const linesContent = this.model.getLinesContent();
            const injectedTextDecorations = this.model.getInjectedTextDecorations(this._editorId);
            const lineCount = linesContent.length;
            const lineBreaksComputer = this.createLineBreaksComputer();
            const injectedTextQueue = new arrays.ArrayQueue(textModelEvents_1.LineInjectedText.fromDecorations(injectedTextDecorations));
            for (let i = 0; i < lineCount; i++) {
                const lineInjectedText = injectedTextQueue.takeWhile(t => t.lineNumber === i + 1);
                lineBreaksComputer.addRequest(linesContent[i], lineInjectedText, previousLineBreaks ? previousLineBreaks[i] : null);
            }
            const linesBreaks = lineBreaksComputer.finalize();
            const values = [];
            const hiddenAreas = this.hiddenAreasDecorationIds.map((areaId) => this.model.getDecorationRange(areaId)).sort(range_1.Range.compareRangesUsingStarts);
            let hiddenAreaStart = 1, hiddenAreaEnd = 0;
            let hiddenAreaIdx = -1;
            let nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : lineCount + 2;
            for (let i = 0; i < lineCount; i++) {
                const lineNumber = i + 1;
                if (lineNumber === nextLineNumberToUpdateHiddenArea) {
                    hiddenAreaIdx++;
                    hiddenAreaStart = hiddenAreas[hiddenAreaIdx].startLineNumber;
                    hiddenAreaEnd = hiddenAreas[hiddenAreaIdx].endLineNumber;
                    nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : lineCount + 2;
                }
                const isInHiddenArea = (lineNumber >= hiddenAreaStart && lineNumber <= hiddenAreaEnd);
                const line = (0, modelLineProjection_1.createModelLineProjection)(linesBreaks[i], !isInHiddenArea);
                values[i] = line.getViewLineCount();
                this.modelLineProjections[i] = line;
            }
            this._validModelVersionId = this.model.getVersionId();
            this.projectedModelLineLineCounts = new prefixSumComputer_1.ConstantTimePrefixSumComputer(values);
        }
        getHiddenAreas() {
            return this.hiddenAreasDecorationIds.map((decId) => this.model.getDecorationRange(decId));
        }
        setHiddenAreas(_ranges) {
            const validatedRanges = _ranges.map(r => this.model.validateRange(r));
            const newRanges = normalizeLineRanges(validatedRanges);
            // TODO@Martin: Please stop calling this method on each model change!
            // This checks if there really was a change
            const oldRanges = this.hiddenAreasDecorationIds.map((areaId) => this.model.getDecorationRange(areaId)).sort(range_1.Range.compareRangesUsingStarts);
            if (newRanges.length === oldRanges.length) {
                let hasDifference = false;
                for (let i = 0; i < newRanges.length; i++) {
                    if (!newRanges[i].equalsRange(oldRanges[i])) {
                        hasDifference = true;
                        break;
                    }
                }
                if (!hasDifference) {
                    return false;
                }
            }
            const newDecorations = newRanges.map((r) => ({
                range: r,
                options: textModel_1.ModelDecorationOptions.EMPTY,
            }));
            this.hiddenAreasDecorationIds = this.model.deltaDecorations(this.hiddenAreasDecorationIds, newDecorations);
            const hiddenAreas = newRanges;
            let hiddenAreaStart = 1, hiddenAreaEnd = 0;
            let hiddenAreaIdx = -1;
            let nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : this.modelLineProjections.length + 2;
            let hasVisibleLine = false;
            for (let i = 0; i < this.modelLineProjections.length; i++) {
                const lineNumber = i + 1;
                if (lineNumber === nextLineNumberToUpdateHiddenArea) {
                    hiddenAreaIdx++;
                    hiddenAreaStart = hiddenAreas[hiddenAreaIdx].startLineNumber;
                    hiddenAreaEnd = hiddenAreas[hiddenAreaIdx].endLineNumber;
                    nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : this.modelLineProjections.length + 2;
                }
                let lineChanged = false;
                if (lineNumber >= hiddenAreaStart && lineNumber <= hiddenAreaEnd) {
                    // Line should be hidden
                    if (this.modelLineProjections[i].isVisible()) {
                        this.modelLineProjections[i] = this.modelLineProjections[i].setVisible(false);
                        lineChanged = true;
                    }
                }
                else {
                    hasVisibleLine = true;
                    // Line should be visible
                    if (!this.modelLineProjections[i].isVisible()) {
                        this.modelLineProjections[i] = this.modelLineProjections[i].setVisible(true);
                        lineChanged = true;
                    }
                }
                if (lineChanged) {
                    const newOutputLineCount = this.modelLineProjections[i].getViewLineCount();
                    this.projectedModelLineLineCounts.setValue(i, newOutputLineCount);
                }
            }
            if (!hasVisibleLine) {
                // Cannot have everything be hidden => reveal everything!
                this.setHiddenAreas([]);
            }
            return true;
        }
        modelPositionIsVisible(modelLineNumber, _modelColumn) {
            if (modelLineNumber < 1 || modelLineNumber > this.modelLineProjections.length) {
                // invalid arguments
                return false;
            }
            return this.modelLineProjections[modelLineNumber - 1].isVisible();
        }
        getModelLineViewLineCount(modelLineNumber) {
            if (modelLineNumber < 1 || modelLineNumber > this.modelLineProjections.length) {
                // invalid arguments
                return 1;
            }
            return this.modelLineProjections[modelLineNumber - 1].getViewLineCount();
        }
        setTabSize(newTabSize) {
            if (this.tabSize === newTabSize) {
                return false;
            }
            this.tabSize = newTabSize;
            this._constructLines(/*resetHiddenAreas*/ false, null);
            return true;
        }
        setWrappingSettings(fontInfo, wrappingStrategy, wrappingColumn, wrappingIndent, wordBreak) {
            const equalFontInfo = this.fontInfo.equals(fontInfo);
            const equalWrappingStrategy = (this.wrappingStrategy === wrappingStrategy);
            const equalWrappingColumn = (this.wrappingColumn === wrappingColumn);
            const equalWrappingIndent = (this.wrappingIndent === wrappingIndent);
            const equalWordBreak = (this.wordBreak === wordBreak);
            if (equalFontInfo && equalWrappingStrategy && equalWrappingColumn && equalWrappingIndent && equalWordBreak) {
                return false;
            }
            const onlyWrappingColumnChanged = (equalFontInfo && equalWrappingStrategy && !equalWrappingColumn && equalWrappingIndent && equalWordBreak);
            this.fontInfo = fontInfo;
            this.wrappingStrategy = wrappingStrategy;
            this.wrappingColumn = wrappingColumn;
            this.wrappingIndent = wrappingIndent;
            this.wordBreak = wordBreak;
            let previousLineBreaks = null;
            if (onlyWrappingColumnChanged) {
                previousLineBreaks = [];
                for (let i = 0, len = this.modelLineProjections.length; i < len; i++) {
                    previousLineBreaks[i] = this.modelLineProjections[i].getProjectionData();
                }
            }
            this._constructLines(/*resetHiddenAreas*/ false, previousLineBreaks);
            return true;
        }
        createLineBreaksComputer() {
            const lineBreaksComputerFactory = (this.wrappingStrategy === 'advanced'
                ? this._domLineBreaksComputerFactory
                : this._monospaceLineBreaksComputerFactory);
            return lineBreaksComputerFactory.createLineBreaksComputer(this.fontInfo, this.tabSize, this.wrappingColumn, this.wrappingIndent, this.wordBreak);
        }
        onModelFlushed() {
            this._constructLines(/*resetHiddenAreas*/ true, null);
        }
        onModelLinesDeleted(versionId, fromLineNumber, toLineNumber) {
            if (!versionId || versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return null;
            }
            const outputFromLineNumber = (fromLineNumber === 1 ? 1 : this.projectedModelLineLineCounts.getPrefixSum(fromLineNumber - 1) + 1);
            const outputToLineNumber = this.projectedModelLineLineCounts.getPrefixSum(toLineNumber);
            this.modelLineProjections.splice(fromLineNumber - 1, toLineNumber - fromLineNumber + 1);
            this.projectedModelLineLineCounts.removeValues(fromLineNumber - 1, toLineNumber - fromLineNumber + 1);
            return new viewEvents.ViewLinesDeletedEvent(outputFromLineNumber, outputToLineNumber);
        }
        onModelLinesInserted(versionId, fromLineNumber, _toLineNumber, lineBreaks) {
            if (!versionId || versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return null;
            }
            // cannot use this.getHiddenAreas() because those decorations have already seen the effect of this model change
            const isInHiddenArea = (fromLineNumber > 2 && !this.modelLineProjections[fromLineNumber - 2].isVisible());
            const outputFromLineNumber = (fromLineNumber === 1 ? 1 : this.projectedModelLineLineCounts.getPrefixSum(fromLineNumber - 1) + 1);
            let totalOutputLineCount = 0;
            const insertLines = [];
            const insertPrefixSumValues = [];
            for (let i = 0, len = lineBreaks.length; i < len; i++) {
                const line = (0, modelLineProjection_1.createModelLineProjection)(lineBreaks[i], !isInHiddenArea);
                insertLines.push(line);
                const outputLineCount = line.getViewLineCount();
                totalOutputLineCount += outputLineCount;
                insertPrefixSumValues[i] = outputLineCount;
            }
            // TODO@Alex: use arrays.arrayInsert
            this.modelLineProjections =
                this.modelLineProjections.slice(0, fromLineNumber - 1)
                    .concat(insertLines)
                    .concat(this.modelLineProjections.slice(fromLineNumber - 1));
            this.projectedModelLineLineCounts.insertValues(fromLineNumber - 1, insertPrefixSumValues);
            return new viewEvents.ViewLinesInsertedEvent(outputFromLineNumber, outputFromLineNumber + totalOutputLineCount - 1);
        }
        onModelLineChanged(versionId, lineNumber, lineBreakData) {
            if (versionId !== null && versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return [false, null, null, null];
            }
            const lineIndex = lineNumber - 1;
            const oldOutputLineCount = this.modelLineProjections[lineIndex].getViewLineCount();
            const isVisible = this.modelLineProjections[lineIndex].isVisible();
            const line = (0, modelLineProjection_1.createModelLineProjection)(lineBreakData, isVisible);
            this.modelLineProjections[lineIndex] = line;
            const newOutputLineCount = this.modelLineProjections[lineIndex].getViewLineCount();
            let lineMappingChanged = false;
            let changeFrom = 0;
            let changeTo = -1;
            let insertFrom = 0;
            let insertTo = -1;
            let deleteFrom = 0;
            let deleteTo = -1;
            if (oldOutputLineCount > newOutputLineCount) {
                changeFrom = this.projectedModelLineLineCounts.getPrefixSum(lineNumber - 1) + 1;
                changeTo = changeFrom + newOutputLineCount - 1;
                deleteFrom = changeTo + 1;
                deleteTo = deleteFrom + (oldOutputLineCount - newOutputLineCount) - 1;
                lineMappingChanged = true;
            }
            else if (oldOutputLineCount < newOutputLineCount) {
                changeFrom = this.projectedModelLineLineCounts.getPrefixSum(lineNumber - 1) + 1;
                changeTo = changeFrom + oldOutputLineCount - 1;
                insertFrom = changeTo + 1;
                insertTo = insertFrom + (newOutputLineCount - oldOutputLineCount) - 1;
                lineMappingChanged = true;
            }
            else {
                changeFrom = this.projectedModelLineLineCounts.getPrefixSum(lineNumber - 1) + 1;
                changeTo = changeFrom + newOutputLineCount - 1;
            }
            this.projectedModelLineLineCounts.setValue(lineIndex, newOutputLineCount);
            const viewLinesChangedEvent = (changeFrom <= changeTo ? new viewEvents.ViewLinesChangedEvent(changeFrom, changeTo - changeFrom + 1) : null);
            const viewLinesInsertedEvent = (insertFrom <= insertTo ? new viewEvents.ViewLinesInsertedEvent(insertFrom, insertTo) : null);
            const viewLinesDeletedEvent = (deleteFrom <= deleteTo ? new viewEvents.ViewLinesDeletedEvent(deleteFrom, deleteTo) : null);
            return [lineMappingChanged, viewLinesChangedEvent, viewLinesInsertedEvent, viewLinesDeletedEvent];
        }
        acceptVersionId(versionId) {
            this._validModelVersionId = versionId;
            if (this.modelLineProjections.length === 1 && !this.modelLineProjections[0].isVisible()) {
                // At least one line must be visible => reset hidden areas
                this.setHiddenAreas([]);
            }
        }
        getViewLineCount() {
            return this.projectedModelLineLineCounts.getTotalSum();
        }
        _toValidViewLineNumber(viewLineNumber) {
            if (viewLineNumber < 1) {
                return 1;
            }
            const viewLineCount = this.getViewLineCount();
            if (viewLineNumber > viewLineCount) {
                return viewLineCount;
            }
            return viewLineNumber | 0;
        }
        getActiveIndentGuide(viewLineNumber, minLineNumber, maxLineNumber) {
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            minLineNumber = this._toValidViewLineNumber(minLineNumber);
            maxLineNumber = this._toValidViewLineNumber(maxLineNumber);
            const modelPosition = this.convertViewPositionToModelPosition(viewLineNumber, this.getViewLineMinColumn(viewLineNumber));
            const modelMinPosition = this.convertViewPositionToModelPosition(minLineNumber, this.getViewLineMinColumn(minLineNumber));
            const modelMaxPosition = this.convertViewPositionToModelPosition(maxLineNumber, this.getViewLineMinColumn(maxLineNumber));
            const result = this.model.guides.getActiveIndentGuide(modelPosition.lineNumber, modelMinPosition.lineNumber, modelMaxPosition.lineNumber);
            const viewStartPosition = this.convertModelPositionToViewPosition(result.startLineNumber, 1);
            const viewEndPosition = this.convertModelPositionToViewPosition(result.endLineNumber, this.model.getLineMaxColumn(result.endLineNumber));
            return {
                startLineNumber: viewStartPosition.lineNumber,
                endLineNumber: viewEndPosition.lineNumber,
                indent: result.indent
            };
        }
        // #region ViewLineInfo
        getViewLineInfo(viewLineNumber) {
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            const r = this.projectedModelLineLineCounts.getIndexOf(viewLineNumber - 1);
            const lineIndex = r.index;
            const remainder = r.remainder;
            return new ViewLineInfo(lineIndex + 1, remainder);
        }
        getMinColumnOfViewLine(viewLineInfo) {
            return this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewLineMinColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
        }
        getMaxColumnOfViewLine(viewLineInfo) {
            return this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewLineMaxColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
        }
        getModelStartPositionOfViewLine(viewLineInfo) {
            const line = this.modelLineProjections[viewLineInfo.modelLineNumber - 1];
            const minViewColumn = line.getViewLineMinColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
            const column = line.getModelColumnOfViewPosition(viewLineInfo.modelLineWrappedLineIdx, minViewColumn);
            return new position_1.Position(viewLineInfo.modelLineNumber, column);
        }
        getModelEndPositionOfViewLine(viewLineInfo) {
            const line = this.modelLineProjections[viewLineInfo.modelLineNumber - 1];
            const maxViewColumn = line.getViewLineMaxColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
            const column = line.getModelColumnOfViewPosition(viewLineInfo.modelLineWrappedLineIdx, maxViewColumn);
            return new position_1.Position(viewLineInfo.modelLineNumber, column);
        }
        getViewLineInfosGroupedByModelRanges(viewStartLineNumber, viewEndLineNumber) {
            const startViewLine = this.getViewLineInfo(viewStartLineNumber);
            const endViewLine = this.getViewLineInfo(viewEndLineNumber);
            const result = new Array();
            let lastVisibleModelPos = this.getModelStartPositionOfViewLine(startViewLine);
            let viewLines = new Array();
            for (let curModelLine = startViewLine.modelLineNumber; curModelLine <= endViewLine.modelLineNumber; curModelLine++) {
                const line = this.modelLineProjections[curModelLine - 1];
                if (line.isVisible()) {
                    const startOffset = curModelLine === startViewLine.modelLineNumber
                        ? startViewLine.modelLineWrappedLineIdx
                        : 0;
                    const endOffset = curModelLine === endViewLine.modelLineNumber
                        ? endViewLine.modelLineWrappedLineIdx + 1
                        : line.getViewLineCount();
                    for (let i = startOffset; i < endOffset; i++) {
                        viewLines.push(new ViewLineInfo(curModelLine, i));
                    }
                }
                if (!line.isVisible() && lastVisibleModelPos) {
                    const lastVisibleModelPos2 = new position_1.Position(curModelLine - 1, this.model.getLineMaxColumn(curModelLine - 1) + 1);
                    const modelRange = range_1.Range.fromPositions(lastVisibleModelPos, lastVisibleModelPos2);
                    result.push(new ViewLineInfoGroupedByModelRange(modelRange, viewLines));
                    viewLines = [];
                    lastVisibleModelPos = null;
                }
                else if (line.isVisible() && !lastVisibleModelPos) {
                    lastVisibleModelPos = new position_1.Position(curModelLine, 1);
                }
            }
            if (lastVisibleModelPos) {
                const modelRange = range_1.Range.fromPositions(lastVisibleModelPos, this.getModelEndPositionOfViewLine(endViewLine));
                result.push(new ViewLineInfoGroupedByModelRange(modelRange, viewLines));
            }
            return result;
        }
        // #endregion
        getViewLinesBracketGuides(viewStartLineNumber, viewEndLineNumber, activeViewPosition, options) {
            const modelActivePosition = activeViewPosition ? this.convertViewPositionToModelPosition(activeViewPosition.lineNumber, activeViewPosition.column) : null;
            const resultPerViewLine = [];
            for (const group of this.getViewLineInfosGroupedByModelRanges(viewStartLineNumber, viewEndLineNumber)) {
                const modelRangeStartLineNumber = group.modelRange.startLineNumber;
                const bracketGuidesPerModelLine = this.model.guides.getLinesBracketGuides(modelRangeStartLineNumber, group.modelRange.endLineNumber, modelActivePosition, options);
                for (const viewLineInfo of group.viewLines) {
                    const bracketGuides = bracketGuidesPerModelLine[viewLineInfo.modelLineNumber - modelRangeStartLineNumber];
                    // visibleColumns stay as they are (this is a bug and needs to be fixed, but it is not a regression)
                    // model-columns must be converted to view-model columns.
                    const result = bracketGuides.map(g => {
                        if (g.forWrappedLinesAfterColumn !== -1) {
                            const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.forWrappedLinesAfterColumn);
                            if (p.lineNumber >= viewLineInfo.modelLineWrappedLineIdx) {
                                return undefined;
                            }
                        }
                        if (g.forWrappedLinesBeforeOrAtColumn !== -1) {
                            const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.forWrappedLinesBeforeOrAtColumn);
                            if (p.lineNumber < viewLineInfo.modelLineWrappedLineIdx) {
                                return undefined;
                            }
                        }
                        if (!g.horizontalLine) {
                            return g;
                        }
                        let column = -1;
                        if (g.column !== -1) {
                            const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.column);
                            if (p.lineNumber === viewLineInfo.modelLineWrappedLineIdx) {
                                column = p.column;
                            }
                            else if (p.lineNumber < viewLineInfo.modelLineWrappedLineIdx) {
                                column = this.getMinColumnOfViewLine(viewLineInfo);
                            }
                            else if (p.lineNumber > viewLineInfo.modelLineWrappedLineIdx) {
                                return undefined;
                            }
                        }
                        const viewPosition = this.convertModelPositionToViewPosition(viewLineInfo.modelLineNumber, g.horizontalLine.endColumn);
                        const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.horizontalLine.endColumn);
                        if (p.lineNumber === viewLineInfo.modelLineWrappedLineIdx) {
                            return new textModelGuides_1.IndentGuide(g.visibleColumn, column, g.className, new textModelGuides_1.IndentGuideHorizontalLine(g.horizontalLine.top, viewPosition.column), -1, -1);
                        }
                        else if (p.lineNumber < viewLineInfo.modelLineWrappedLineIdx) {
                            return undefined;
                        }
                        else {
                            if (g.visibleColumn !== -1) {
                                // Don't repeat horizontal lines that use visibleColumn for unrelated lines.
                                return undefined;
                            }
                            return new textModelGuides_1.IndentGuide(g.visibleColumn, column, g.className, new textModelGuides_1.IndentGuideHorizontalLine(g.horizontalLine.top, this.getMaxColumnOfViewLine(viewLineInfo)), -1, -1);
                        }
                    });
                    resultPerViewLine.push(result.filter((r) => !!r));
                }
            }
            return resultPerViewLine;
        }
        getViewLinesIndentGuides(viewStartLineNumber, viewEndLineNumber) {
            // TODO: Use the same code as in `getViewLinesBracketGuides`.
            // Future TODO: Merge with `getViewLinesBracketGuides`.
            // However, this requires more refactoring of indent guides.
            viewStartLineNumber = this._toValidViewLineNumber(viewStartLineNumber);
            viewEndLineNumber = this._toValidViewLineNumber(viewEndLineNumber);
            const modelStart = this.convertViewPositionToModelPosition(viewStartLineNumber, this.getViewLineMinColumn(viewStartLineNumber));
            const modelEnd = this.convertViewPositionToModelPosition(viewEndLineNumber, this.getViewLineMaxColumn(viewEndLineNumber));
            let result = [];
            const resultRepeatCount = [];
            const resultRepeatOption = [];
            const modelStartLineIndex = modelStart.lineNumber - 1;
            const modelEndLineIndex = modelEnd.lineNumber - 1;
            let reqStart = null;
            for (let modelLineIndex = modelStartLineIndex; modelLineIndex <= modelEndLineIndex; modelLineIndex++) {
                const line = this.modelLineProjections[modelLineIndex];
                if (line.isVisible()) {
                    const viewLineStartIndex = line.getViewLineNumberOfModelPosition(0, modelLineIndex === modelStartLineIndex ? modelStart.column : 1);
                    const viewLineEndIndex = line.getViewLineNumberOfModelPosition(0, this.model.getLineMaxColumn(modelLineIndex + 1));
                    const count = viewLineEndIndex - viewLineStartIndex + 1;
                    let option = 0 /* IndentGuideRepeatOption.BlockNone */;
                    if (count > 1 && line.getViewLineMinColumn(this.model, modelLineIndex + 1, viewLineEndIndex) === 1) {
                        // wrapped lines should block indent guides
                        option = (viewLineStartIndex === 0 ? 1 /* IndentGuideRepeatOption.BlockSubsequent */ : 2 /* IndentGuideRepeatOption.BlockAll */);
                    }
                    resultRepeatCount.push(count);
                    resultRepeatOption.push(option);
                    // merge into previous request
                    if (reqStart === null) {
                        reqStart = new position_1.Position(modelLineIndex + 1, 0);
                    }
                }
                else {
                    // hit invisible line => flush request
                    if (reqStart !== null) {
                        result = result.concat(this.model.guides.getLinesIndentGuides(reqStart.lineNumber, modelLineIndex));
                        reqStart = null;
                    }
                }
            }
            if (reqStart !== null) {
                result = result.concat(this.model.guides.getLinesIndentGuides(reqStart.lineNumber, modelEnd.lineNumber));
                reqStart = null;
            }
            const viewLineCount = viewEndLineNumber - viewStartLineNumber + 1;
            const viewIndents = new Array(viewLineCount);
            let currIndex = 0;
            for (let i = 0, len = result.length; i < len; i++) {
                let value = result[i];
                const count = Math.min(viewLineCount - currIndex, resultRepeatCount[i]);
                const option = resultRepeatOption[i];
                let blockAtIndex;
                if (option === 2 /* IndentGuideRepeatOption.BlockAll */) {
                    blockAtIndex = 0;
                }
                else if (option === 1 /* IndentGuideRepeatOption.BlockSubsequent */) {
                    blockAtIndex = 1;
                }
                else {
                    blockAtIndex = count;
                }
                for (let j = 0; j < count; j++) {
                    if (j === blockAtIndex) {
                        value = 0;
                    }
                    viewIndents[currIndex++] = value;
                }
            }
            return viewIndents;
        }
        getViewLineContent(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineContent(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineLength(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineLength(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineMinColumn(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineMinColumn(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineMaxColumn(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineMaxColumn(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineData(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineData(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLinesData(viewStartLineNumber, viewEndLineNumber, needed) {
            viewStartLineNumber = this._toValidViewLineNumber(viewStartLineNumber);
            viewEndLineNumber = this._toValidViewLineNumber(viewEndLineNumber);
            const start = this.projectedModelLineLineCounts.getIndexOf(viewStartLineNumber - 1);
            let viewLineNumber = viewStartLineNumber;
            const startModelLineIndex = start.index;
            const startRemainder = start.remainder;
            const result = [];
            for (let modelLineIndex = startModelLineIndex, len = this.model.getLineCount(); modelLineIndex < len; modelLineIndex++) {
                const line = this.modelLineProjections[modelLineIndex];
                if (!line.isVisible()) {
                    continue;
                }
                const fromViewLineIndex = (modelLineIndex === startModelLineIndex ? startRemainder : 0);
                let remainingViewLineCount = line.getViewLineCount() - fromViewLineIndex;
                let lastLine = false;
                if (viewLineNumber + remainingViewLineCount > viewEndLineNumber) {
                    lastLine = true;
                    remainingViewLineCount = viewEndLineNumber - viewLineNumber + 1;
                }
                line.getViewLinesData(this.model, modelLineIndex + 1, fromViewLineIndex, remainingViewLineCount, viewLineNumber - viewStartLineNumber, needed, result);
                viewLineNumber += remainingViewLineCount;
                if (lastLine) {
                    break;
                }
            }
            return result;
        }
        validateViewPosition(viewLineNumber, viewColumn, expectedModelPosition) {
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            const r = this.projectedModelLineLineCounts.getIndexOf(viewLineNumber - 1);
            const lineIndex = r.index;
            const remainder = r.remainder;
            const line = this.modelLineProjections[lineIndex];
            const minColumn = line.getViewLineMinColumn(this.model, lineIndex + 1, remainder);
            const maxColumn = line.getViewLineMaxColumn(this.model, lineIndex + 1, remainder);
            if (viewColumn < minColumn) {
                viewColumn = minColumn;
            }
            if (viewColumn > maxColumn) {
                viewColumn = maxColumn;
            }
            const computedModelColumn = line.getModelColumnOfViewPosition(remainder, viewColumn);
            const computedModelPosition = this.model.validatePosition(new position_1.Position(lineIndex + 1, computedModelColumn));
            if (computedModelPosition.equals(expectedModelPosition)) {
                return new position_1.Position(viewLineNumber, viewColumn);
            }
            return this.convertModelPositionToViewPosition(expectedModelPosition.lineNumber, expectedModelPosition.column);
        }
        validateViewRange(viewRange, expectedModelRange) {
            const validViewStart = this.validateViewPosition(viewRange.startLineNumber, viewRange.startColumn, expectedModelRange.getStartPosition());
            const validViewEnd = this.validateViewPosition(viewRange.endLineNumber, viewRange.endColumn, expectedModelRange.getEndPosition());
            return new range_1.Range(validViewStart.lineNumber, validViewStart.column, validViewEnd.lineNumber, validViewEnd.column);
        }
        convertViewPositionToModelPosition(viewLineNumber, viewColumn) {
            const info = this.getViewLineInfo(viewLineNumber);
            const inputColumn = this.modelLineProjections[info.modelLineNumber - 1].getModelColumnOfViewPosition(info.modelLineWrappedLineIdx, viewColumn);
            // console.log('out -> in ' + viewLineNumber + ',' + viewColumn + ' ===> ' + (lineIndex+1) + ',' + inputColumn);
            return this.model.validatePosition(new position_1.Position(info.modelLineNumber, inputColumn));
        }
        convertViewRangeToModelRange(viewRange) {
            const start = this.convertViewPositionToModelPosition(viewRange.startLineNumber, viewRange.startColumn);
            const end = this.convertViewPositionToModelPosition(viewRange.endLineNumber, viewRange.endColumn);
            return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        convertModelPositionToViewPosition(_modelLineNumber, _modelColumn, affinity = 2 /* PositionAffinity.None */, allowZeroLineNumber = false, belowHiddenRanges = false) {
            const validPosition = this.model.validatePosition(new position_1.Position(_modelLineNumber, _modelColumn));
            const inputLineNumber = validPosition.lineNumber;
            const inputColumn = validPosition.column;
            let lineIndex = inputLineNumber - 1, lineIndexChanged = false;
            if (belowHiddenRanges) {
                while (lineIndex < this.modelLineProjections.length && !this.modelLineProjections[lineIndex].isVisible()) {
                    lineIndex++;
                    lineIndexChanged = true;
                }
            }
            else {
                while (lineIndex > 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                    lineIndex--;
                    lineIndexChanged = true;
                }
            }
            if (lineIndex === 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                // Could not reach a real line
                // console.log('in -> out ' + inputLineNumber + ',' + inputColumn + ' ===> ' + 1 + ',' + 1);
                // TODO@alexdima@hediet this isn't soo pretty
                return new position_1.Position(allowZeroLineNumber ? 0 : 1, 1);
            }
            const deltaLineNumber = 1 + this.projectedModelLineLineCounts.getPrefixSum(lineIndex);
            let r;
            if (lineIndexChanged) {
                if (belowHiddenRanges) {
                    r = this.modelLineProjections[lineIndex].getViewPositionOfModelPosition(deltaLineNumber, 1, affinity);
                }
                else {
                    r = this.modelLineProjections[lineIndex].getViewPositionOfModelPosition(deltaLineNumber, this.model.getLineMaxColumn(lineIndex + 1), affinity);
                }
            }
            else {
                r = this.modelLineProjections[inputLineNumber - 1].getViewPositionOfModelPosition(deltaLineNumber, inputColumn, affinity);
            }
            // console.log('in -> out ' + inputLineNumber + ',' + inputColumn + ' ===> ' + r.lineNumber + ',' + r);
            return r;
        }
        /**
         * @param affinity The affinity in case of an empty range. Has no effect for non-empty ranges.
        */
        convertModelRangeToViewRange(modelRange, affinity = 0 /* PositionAffinity.Left */) {
            if (modelRange.isEmpty()) {
                const start = this.convertModelPositionToViewPosition(modelRange.startLineNumber, modelRange.startColumn, affinity);
                return range_1.Range.fromPositions(start);
            }
            else {
                const start = this.convertModelPositionToViewPosition(modelRange.startLineNumber, modelRange.startColumn, 1 /* PositionAffinity.Right */);
                const end = this.convertModelPositionToViewPosition(modelRange.endLineNumber, modelRange.endColumn, 0 /* PositionAffinity.Left */);
                return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
            }
        }
        getViewLineNumberOfModelPosition(modelLineNumber, modelColumn) {
            let lineIndex = modelLineNumber - 1;
            if (this.modelLineProjections[lineIndex].isVisible()) {
                // this model line is visible
                const deltaLineNumber = 1 + this.projectedModelLineLineCounts.getPrefixSum(lineIndex);
                return this.modelLineProjections[lineIndex].getViewLineNumberOfModelPosition(deltaLineNumber, modelColumn);
            }
            // this model line is not visible
            while (lineIndex > 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                lineIndex--;
            }
            if (lineIndex === 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                // Could not reach a real line
                return 1;
            }
            const deltaLineNumber = 1 + this.projectedModelLineLineCounts.getPrefixSum(lineIndex);
            return this.modelLineProjections[lineIndex].getViewLineNumberOfModelPosition(deltaLineNumber, this.model.getLineMaxColumn(lineIndex + 1));
        }
        getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations) {
            const modelStart = this.convertViewPositionToModelPosition(range.startLineNumber, range.startColumn);
            const modelEnd = this.convertViewPositionToModelPosition(range.endLineNumber, range.endColumn);
            if (modelEnd.lineNumber - modelStart.lineNumber <= range.endLineNumber - range.startLineNumber) {
                // most likely there are no hidden lines => fast path
                // fetch decorations from column 1 to cover the case of wrapped lines that have whole line decorations at column 1
                return this.model.getDecorationsInRange(new range_1.Range(modelStart.lineNumber, 1, modelEnd.lineNumber, modelEnd.column), ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations);
            }
            let result = [];
            const modelStartLineIndex = modelStart.lineNumber - 1;
            const modelEndLineIndex = modelEnd.lineNumber - 1;
            let reqStart = null;
            for (let modelLineIndex = modelStartLineIndex; modelLineIndex <= modelEndLineIndex; modelLineIndex++) {
                const line = this.modelLineProjections[modelLineIndex];
                if (line.isVisible()) {
                    // merge into previous request
                    if (reqStart === null) {
                        reqStart = new position_1.Position(modelLineIndex + 1, modelLineIndex === modelStartLineIndex ? modelStart.column : 1);
                    }
                }
                else {
                    // hit invisible line => flush request
                    if (reqStart !== null) {
                        const maxLineColumn = this.model.getLineMaxColumn(modelLineIndex);
                        result = result.concat(this.model.getDecorationsInRange(new range_1.Range(reqStart.lineNumber, reqStart.column, modelLineIndex, maxLineColumn), ownerId, filterOutValidation, onlyMinimapDecorations));
                        reqStart = null;
                    }
                }
            }
            if (reqStart !== null) {
                result = result.concat(this.model.getDecorationsInRange(new range_1.Range(reqStart.lineNumber, reqStart.column, modelEnd.lineNumber, modelEnd.column), ownerId, filterOutValidation, onlyMinimapDecorations));
                reqStart = null;
            }
            result.sort((a, b) => {
                const res = range_1.Range.compareRangesUsingStarts(a.range, b.range);
                if (res === 0) {
                    if (a.id < b.id) {
                        return -1;
                    }
                    if (a.id > b.id) {
                        return 1;
                    }
                    return 0;
                }
                return res;
            });
            // Eliminate duplicate decorations that might have intersected our visible ranges multiple times
            const finalResult = [];
            let finalResultLen = 0;
            let prevDecId = null;
            for (const dec of result) {
                const decId = dec.id;
                if (prevDecId === decId) {
                    // skip
                    continue;
                }
                prevDecId = decId;
                finalResult[finalResultLen++] = dec;
            }
            return finalResult;
        }
        getInjectedTextAt(position) {
            const info = this.getViewLineInfo(position.lineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getInjectedTextAt(info.modelLineWrappedLineIdx, position.column);
        }
        normalizePosition(position, affinity) {
            const info = this.getViewLineInfo(position.lineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].normalizePosition(info.modelLineWrappedLineIdx, position, affinity);
        }
        getLineIndentColumn(lineNumber) {
            const info = this.getViewLineInfo(lineNumber);
            if (info.modelLineWrappedLineIdx === 0) {
                return this.model.getLineIndentColumn(info.modelLineNumber);
            }
            // wrapped lines have no indentation.
            // We deliberately don't handle the case that indentation is wrapped
            // to avoid two view lines reporting indentation for the very same model line.
            return 0;
        }
    }
    exports.ViewModelLinesFromProjectedModel = ViewModelLinesFromProjectedModel;
    /**
     * Overlapping unsorted ranges:
     * [   )      [ )       [  )
     *    [    )      [       )
     * ->
     * Non overlapping sorted ranges:
     * [       )  [ ) [        )
     *
     * Note: This function only considers line information! Columns are ignored.
    */
    function normalizeLineRanges(ranges) {
        if (ranges.length === 0) {
            return [];
        }
        const sortedRanges = ranges.slice();
        sortedRanges.sort(range_1.Range.compareRangesUsingStarts);
        const result = [];
        let currentRangeStart = sortedRanges[0].startLineNumber;
        let currentRangeEnd = sortedRanges[0].endLineNumber;
        for (let i = 1, len = sortedRanges.length; i < len; i++) {
            const range = sortedRanges[i];
            if (range.startLineNumber > currentRangeEnd + 1) {
                result.push(new range_1.Range(currentRangeStart, 1, currentRangeEnd, 1));
                currentRangeStart = range.startLineNumber;
                currentRangeEnd = range.endLineNumber;
            }
            else if (range.endLineNumber > currentRangeEnd) {
                currentRangeEnd = range.endLineNumber;
            }
        }
        result.push(new range_1.Range(currentRangeStart, 1, currentRangeEnd, 1));
        return result;
    }
    /**
     * Represents a view line. Can be used to efficiently query more information about it.
     */
    class ViewLineInfo {
        get isWrappedLineContinuation() {
            return this.modelLineWrappedLineIdx > 0;
        }
        constructor(modelLineNumber, modelLineWrappedLineIdx) {
            this.modelLineNumber = modelLineNumber;
            this.modelLineWrappedLineIdx = modelLineWrappedLineIdx;
        }
    }
    /**
     * A list of view lines that have a contiguous span in the model.
    */
    class ViewLineInfoGroupedByModelRange {
        constructor(modelRange, viewLines) {
            this.modelRange = modelRange;
            this.viewLines = viewLines;
        }
    }
    class CoordinatesConverter {
        constructor(lines) {
            this._lines = lines;
        }
        // View -> Model conversion and related methods
        convertViewPositionToModelPosition(viewPosition) {
            return this._lines.convertViewPositionToModelPosition(viewPosition.lineNumber, viewPosition.column);
        }
        convertViewRangeToModelRange(viewRange) {
            return this._lines.convertViewRangeToModelRange(viewRange);
        }
        validateViewPosition(viewPosition, expectedModelPosition) {
            return this._lines.validateViewPosition(viewPosition.lineNumber, viewPosition.column, expectedModelPosition);
        }
        validateViewRange(viewRange, expectedModelRange) {
            return this._lines.validateViewRange(viewRange, expectedModelRange);
        }
        // Model -> View conversion and related methods
        convertModelPositionToViewPosition(modelPosition, affinity, allowZero, belowHiddenRanges) {
            return this._lines.convertModelPositionToViewPosition(modelPosition.lineNumber, modelPosition.column, affinity, allowZero, belowHiddenRanges);
        }
        convertModelRangeToViewRange(modelRange, affinity) {
            return this._lines.convertModelRangeToViewRange(modelRange, affinity);
        }
        modelPositionIsVisible(modelPosition) {
            return this._lines.modelPositionIsVisible(modelPosition.lineNumber, modelPosition.column);
        }
        getModelLineViewLineCount(modelLineNumber) {
            return this._lines.getModelLineViewLineCount(modelLineNumber);
        }
        getViewLineNumberOfModelPosition(modelLineNumber, modelColumn) {
            return this._lines.getViewLineNumberOfModelPosition(modelLineNumber, modelColumn);
        }
    }
    var IndentGuideRepeatOption;
    (function (IndentGuideRepeatOption) {
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockNone"] = 0] = "BlockNone";
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockSubsequent"] = 1] = "BlockSubsequent";
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockAll"] = 2] = "BlockAll";
    })(IndentGuideRepeatOption || (IndentGuideRepeatOption = {}));
    class ViewModelLinesFromModelAsIs {
        constructor(model) {
            this.model = model;
        }
        dispose() {
        }
        createCoordinatesConverter() {
            return new IdentityCoordinatesConverter(this);
        }
        getHiddenAreas() {
            return [];
        }
        setHiddenAreas(_ranges) {
            return false;
        }
        setTabSize(_newTabSize) {
            return false;
        }
        setWrappingSettings(_fontInfo, _wrappingStrategy, _wrappingColumn, _wrappingIndent) {
            return false;
        }
        createLineBreaksComputer() {
            const result = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    result.push(null);
                },
                finalize: () => {
                    return result;
                }
            };
        }
        onModelFlushed() {
        }
        onModelLinesDeleted(_versionId, fromLineNumber, toLineNumber) {
            return new viewEvents.ViewLinesDeletedEvent(fromLineNumber, toLineNumber);
        }
        onModelLinesInserted(_versionId, fromLineNumber, toLineNumber, lineBreaks) {
            return new viewEvents.ViewLinesInsertedEvent(fromLineNumber, toLineNumber);
        }
        onModelLineChanged(_versionId, lineNumber, lineBreakData) {
            return [false, new viewEvents.ViewLinesChangedEvent(lineNumber, 1), null, null];
        }
        acceptVersionId(_versionId) {
        }
        getViewLineCount() {
            return this.model.getLineCount();
        }
        getActiveIndentGuide(viewLineNumber, _minLineNumber, _maxLineNumber) {
            return {
                startLineNumber: viewLineNumber,
                endLineNumber: viewLineNumber,
                indent: 0
            };
        }
        getViewLinesBracketGuides(startLineNumber, endLineNumber, activePosition) {
            return new Array(endLineNumber - startLineNumber + 1).fill([]);
        }
        getViewLinesIndentGuides(viewStartLineNumber, viewEndLineNumber) {
            const viewLineCount = viewEndLineNumber - viewStartLineNumber + 1;
            const result = new Array(viewLineCount);
            for (let i = 0; i < viewLineCount; i++) {
                result[i] = 0;
            }
            return result;
        }
        getViewLineContent(viewLineNumber) {
            return this.model.getLineContent(viewLineNumber);
        }
        getViewLineLength(viewLineNumber) {
            return this.model.getLineLength(viewLineNumber);
        }
        getViewLineMinColumn(viewLineNumber) {
            return this.model.getLineMinColumn(viewLineNumber);
        }
        getViewLineMaxColumn(viewLineNumber) {
            return this.model.getLineMaxColumn(viewLineNumber);
        }
        getViewLineData(viewLineNumber) {
            const lineTokens = this.model.tokenization.getLineTokens(viewLineNumber);
            const lineContent = lineTokens.getLineContent();
            return new viewModel_1.ViewLineData(lineContent, false, 1, lineContent.length + 1, 0, lineTokens.inflate(), null);
        }
        getViewLinesData(viewStartLineNumber, viewEndLineNumber, needed) {
            const lineCount = this.model.getLineCount();
            viewStartLineNumber = Math.min(Math.max(1, viewStartLineNumber), lineCount);
            viewEndLineNumber = Math.min(Math.max(1, viewEndLineNumber), lineCount);
            const result = [];
            for (let lineNumber = viewStartLineNumber; lineNumber <= viewEndLineNumber; lineNumber++) {
                const idx = lineNumber - viewStartLineNumber;
                result[idx] = needed[idx] ? this.getViewLineData(lineNumber) : null;
            }
            return result;
        }
        getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations) {
            return this.model.getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations);
        }
        normalizePosition(position, affinity) {
            return this.model.normalizePosition(position, affinity);
        }
        getLineIndentColumn(lineNumber) {
            return this.model.getLineIndentColumn(lineNumber);
        }
        getInjectedTextAt(position) {
            // Identity lines collection does not support injected text.
            return null;
        }
    }
    exports.ViewModelLinesFromModelAsIs = ViewModelLinesFromModelAsIs;
    class IdentityCoordinatesConverter {
        constructor(lines) {
            this._lines = lines;
        }
        _validPosition(pos) {
            return this._lines.model.validatePosition(pos);
        }
        _validRange(range) {
            return this._lines.model.validateRange(range);
        }
        // View -> Model conversion and related methods
        convertViewPositionToModelPosition(viewPosition) {
            return this._validPosition(viewPosition);
        }
        convertViewRangeToModelRange(viewRange) {
            return this._validRange(viewRange);
        }
        validateViewPosition(_viewPosition, expectedModelPosition) {
            return this._validPosition(expectedModelPosition);
        }
        validateViewRange(_viewRange, expectedModelRange) {
            return this._validRange(expectedModelRange);
        }
        // Model -> View conversion and related methods
        convertModelPositionToViewPosition(modelPosition) {
            return this._validPosition(modelPosition);
        }
        convertModelRangeToViewRange(modelRange) {
            return this._validRange(modelRange);
        }
        modelPositionIsVisible(modelPosition) {
            const lineCount = this._lines.model.getLineCount();
            if (modelPosition.lineNumber < 1 || modelPosition.lineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            return true;
        }
        modelRangeIsVisible(modelRange) {
            const lineCount = this._lines.model.getLineCount();
            if (modelRange.startLineNumber < 1 || modelRange.startLineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            if (modelRange.endLineNumber < 1 || modelRange.endLineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            return true;
        }
        getModelLineViewLineCount(modelLineNumber) {
            return 1;
        }
        getViewLineNumberOfModelPosition(modelLineNumber, modelColumn) {
            return modelLineNumber;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsTGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdNb2RlbC92aWV3TW9kZWxMaW5lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3RGhHLE1BQWEsZ0NBQWdDO1FBd0I1QyxZQUNDLFFBQWdCLEVBQ2hCLEtBQWlCLEVBQ2pCLDRCQUF3RCxFQUN4RCxrQ0FBOEQsRUFDOUQsUUFBa0IsRUFDbEIsT0FBZSxFQUNmLGdCQUF1QyxFQUN2QyxjQUFzQixFQUN0QixjQUE4QixFQUM5QixTQUErQjtZQUUvQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLDZCQUE2QixHQUFHLDRCQUE0QixDQUFDO1lBQ2xFLElBQUksQ0FBQyxtQ0FBbUMsR0FBRyxrQ0FBa0MsQ0FBQztZQUM5RSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztZQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7WUFDekMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFDckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFFM0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVNLE9BQU87WUFDYixJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLEtB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