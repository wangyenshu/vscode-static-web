/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/model", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/contrib/inlineCompletions/browser/ghostTextWidget", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/css!./inlineEdit"], function (require, exports, lifecycle_1, observable_1, position_1, range_1, language_1, model_1, lineDecorations_1, ghostTextWidget_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GhostTextWidget = exports.INLINE_EDIT_DESCRIPTION = void 0;
    exports.INLINE_EDIT_DESCRIPTION = 'inline-edit';
    let GhostTextWidget = class GhostTextWidget extends lifecycle_1.Disposable {
        constructor(editor, model, languageService) {
            super();
            this.editor = editor;
            this.model = model;
            this.languageService = languageService;
            this.isDisposed = (0, observable_1.observableValue)(this, false);
            this.currentTextModel = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModel, () => /** @description editor.model */ this.editor.getModel());
            this.uiState = (0, observable_1.derived)(this, reader => {
                if (this.isDisposed.read(reader)) {
                    return undefined;
                }
                const textModel = this.currentTextModel.read(reader);
                if (textModel !== this.model.targetTextModel.read(reader)) {
                    return undefined;
                }
                const ghostText = this.model.ghostText.read(reader);
                if (!ghostText) {
                    return undefined;
                }
                let range = this.model.range?.read(reader);
                //if range is empty, we want to remove it
                if (range && range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                    range = undefined;
                }
                //check if both range and text are single line - in this case we want to do inline replacement
                //rather than replacing whole lines
                const isSingleLine = (range ? range.startLineNumber === range.endLineNumber : true) && ghostText.parts.length === 1 && ghostText.parts[0].lines.length === 1;
                //check if we're just removing code
                const isPureRemove = ghostText.parts.length === 1 && ghostText.parts[0].lines.every(l => l.length === 0);
                const inlineTexts = [];
                const additionalLines = [];
                function addToAdditionalLines(lines, className) {
                    if (additionalLines.length > 0) {
                        const lastLine = additionalLines[additionalLines.length - 1];
                        if (className) {
                            lastLine.decorations.push(new lineDecorations_1.LineDecoration(lastLine.content.length + 1, lastLine.content.length + 1 + lines[0].length, className, 0 /* InlineDecorationType.Regular */));
                        }
                        lastLine.content += lines[0];
                        lines = lines.slice(1);
                    }
                    for (const line of lines) {
                        additionalLines.push({
                            content: line,
                            decorations: className ? [new lineDecorations_1.LineDecoration(1, line.length + 1, className, 0 /* InlineDecorationType.Regular */)] : []
                        });
                    }
                }
                const textBufferLine = textModel.getLineContent(ghostText.lineNumber);
                let hiddenTextStartColumn = undefined;
                let lastIdx = 0;
                if (!isPureRemove) {
                    for (const part of ghostText.parts) {
                        let lines = part.lines;
                        //If remove range is set, we want to push all new liens to virtual area
                        if (range && !isSingleLine) {
                            addToAdditionalLines(lines, exports.INLINE_EDIT_DESCRIPTION);
                            lines = [];
                        }
                        if (hiddenTextStartColumn === undefined) {
                            inlineTexts.push({
                                column: part.column,
                                text: lines[0],
                                preview: part.preview,
                            });
                            lines = lines.slice(1);
                        }
                        else {
                            addToAdditionalLines([textBufferLine.substring(lastIdx, part.column - 1)], undefined);
                        }
                        if (lines.length > 0) {
                            addToAdditionalLines(lines, exports.INLINE_EDIT_DESCRIPTION);
                            if (hiddenTextStartColumn === undefined && part.column <= textBufferLine.length) {
                                hiddenTextStartColumn = part.column;
                            }
                        }
                        lastIdx = part.column - 1;
                    }
                    if (hiddenTextStartColumn !== undefined) {
                        addToAdditionalLines([textBufferLine.substring(lastIdx)], undefined);
                    }
                }
                const hiddenRange = hiddenTextStartColumn !== undefined ? new utils_1.ColumnRange(hiddenTextStartColumn, textBufferLine.length + 1) : undefined;
                const lineNumber = (isSingleLine || !range) ? ghostText.lineNumber : range.endLineNumber - 1;
                return {
                    inlineTexts,
                    additionalLines,
                    hiddenRange,
                    lineNumber,
                    additionalReservedLineCount: this.model.minReservedLineCount.read(reader),
                    targetTextModel: textModel,
                    range,
                    isSingleLine,
                    isPureRemove,
                    backgroundColoring: this.model.backgroundColoring.read(reader)
                };
            });
            this.decorations = (0, observable_1.derived)(this, reader => {
                const uiState = this.uiState.read(reader);
                if (!uiState) {
                    return [];
                }
                const decorations = [];
                if (uiState.hiddenRange) {
                    decorations.push({
                        range: uiState.hiddenRange.toRange(uiState.lineNumber),
                        options: { inlineClassName: 'inline-edit-hidden', description: 'inline-edit-hidden', }
                    });
                }
                if (uiState.range) {
                    const ranges = [];
                    if (uiState.isSingleLine) {
                        ranges.push(uiState.range);
                    }
                    else if (uiState.isPureRemove) {
                        const lines = uiState.range.endLineNumber - uiState.range.startLineNumber;
                        for (let i = 0; i < lines; i++) {
                            const line = uiState.range.startLineNumber + i;
                            const firstNonWhitespace = uiState.targetTextModel.getLineFirstNonWhitespaceColumn(line);
                            const lastNonWhitespace = uiState.targetTextModel.getLineLastNonWhitespaceColumn(line);
                            const range = new range_1.Range(line, firstNonWhitespace, line, lastNonWhitespace);
                            ranges.push(range);
                        }
                    }
                    else {
                        const lines = uiState.range.endLineNumber - uiState.range.startLineNumber;
                        for (let i = 0; i < lines; i++) {
                            const line = uiState.range.startLineNumber + i;
                            const firstNonWhitespace = uiState.targetTextModel.getLineFirstNonWhitespaceColumn(line);
                            const lastNonWhitespace = uiState.targetTextModel.getLineLastNonWhitespaceColumn(line);
                            const range = new range_1.Range(line, firstNonWhitespace, line, lastNonWhitespace);
                            ranges.push(range);
                        }
                    }
                    const className = uiState.backgroundColoring ? 'inline-edit-remove backgroundColoring' : 'inline-edit-remove';
                    for (const range of ranges) {
                        decorations.push({
                            range,
                            options: { inlineClassName: className, description: 'inline-edit-remove', }
                        });
                    }
                }
                for (const p of uiState.inlineTexts) {
                    decorations.push({
                        range: range_1.Range.fromPositions(new position_1.Position(uiState.lineNumber, p.column)),
                        options: {
                            description: exports.INLINE_EDIT_DESCRIPTION,
                            after: { content: p.text, inlineClassName: p.preview ? 'inline-edit-decoration-preview' : 'inline-edit-decoration', cursorStops: model_1.InjectedTextCursorStops.Left },
                            showIfCollapsed: true,
                        }
                    });
                }
                return decorations;
            });
            this.additionalLinesWidget = this._register(new ghostTextWidget_1.AdditionalLinesWidget(this.editor, this.languageService.languageIdCodec, (0, observable_1.derived)(reader => {
                /** @description lines */
                const uiState = this.uiState.read(reader);
                return uiState && !uiState.isPureRemove ? {
                    lineNumber: uiState.lineNumber,
                    additionalLines: uiState.additionalLines,
                    minReservedLineCount: uiState.additionalReservedLineCount,
                    targetTextModel: uiState.targetTextModel,
                } : undefined;
            })));
            this._register((0, lifecycle_1.toDisposable)(() => { this.isDisposed.set(true, undefined); }));
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
        }
        ownsViewZone(viewZoneId) {
            return this.additionalLinesWidget.viewZoneId === viewZoneId;
        }
    };
    exports.GhostTextWidget = GhostTextWidget;
    exports.GhostTextWidget = GhostTextWidget = __decorate([
        __param(2, language_1.ILanguageService)
    ], GhostTextWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hvc3RUZXh0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lRWRpdC9icm93c2VyL2dob3N0VGV4dFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQm5GLFFBQUEsdUJBQXVCLEdBQUcsYUFBYSxDQUFDO0lBUzlDLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7UUFJOUMsWUFDa0IsTUFBbUIsRUFDM0IsS0FBNEIsRUFDbkIsZUFBa0Q7WUFFcEUsS0FBSyxFQUFFLENBQUM7WUFKUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQzNCLFVBQUssR0FBTCxLQUFLLENBQXVCO1lBQ0Ysb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBTnBELGVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLHFCQUFnQixHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFhcEksWUFBTyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2pELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckQsSUFBSSxTQUFTLEtBQUssSUFBSSxDQUFD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