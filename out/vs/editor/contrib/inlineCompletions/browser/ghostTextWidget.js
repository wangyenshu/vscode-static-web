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
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/stringBuilder", "vs/editor/common/languages/language", "vs/editor/common/model", "vs/editor/common/tokens/lineTokens", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/css!./ghostText"], function (require, exports, trustedTypes_1, event_1, lifecycle_1, observable_1, strings, domFontInfo_1, editorOptions_1, position_1, range_1, stringBuilder_1, language_1, model_1, lineTokens_1, lineDecorations_1, viewLineRenderer_1, ghostText_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ttPolicy = exports.AdditionalLinesWidget = exports.GhostTextWidget = exports.GHOST_TEXT_DESCRIPTION = void 0;
    exports.GHOST_TEXT_DESCRIPTION = 'ghost-text';
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
                const replacedRange = ghostText instanceof ghostText_1.GhostTextReplacement ? ghostText.columnRange : undefined;
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
                for (const part of ghostText.parts) {
                    let lines = part.lines;
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
                        addToAdditionalLines(lines, exports.GHOST_TEXT_DESCRIPTION);
                        if (hiddenTextStartColumn === undefined && part.column <= textBufferLine.length) {
                            hiddenTextStartColumn = part.column;
                        }
                    }
                    lastIdx = part.column - 1;
                }
                if (hiddenTextStartColumn !== undefined) {
                    addToAdditionalLines([textBufferLine.substring(lastIdx)], undefined);
                }
                const hiddenRange = hiddenTextStartColumn !== undefined ? new utils_1.ColumnRange(hiddenTextStartColumn, textBufferLine.length + 1) : undefined;
                return {
                    replacedRange,
                    inlineTexts,
                    additionalLines,
                    hiddenRange,
                    lineNumber: ghostText.lineNumber,
                    additionalReservedLineCount: this.model.minReservedLineCount.read(reader),
                    targetTextModel: textModel,
                };
            });
            this.decorations = (0, observable_1.derived)(this, reader => {
                const uiState = this.uiState.read(reader);
                if (!uiState) {
                    return [];
                }
                const decorations = [];
                if (uiState.replacedRange) {
                    decorations.push({
                        range: uiState.replacedRange.toRange(uiState.lineNumber),
                        options: { inlineClassName: 'inline-completion-text-to-replace', description: 'GhostTextReplacement' }
                    });
                }
                if (uiState.hiddenRange) {
                    decorations.push({
                        range: uiState.hiddenRange.toRange(uiState.lineNumber),
                        options: { inlineClassName: 'ghost-text-hidden', description: 'ghost-text-hidden', }
                    });
                }
                for (const p of uiState.inlineTexts) {
                    decorations.push({
                        range: range_1.Range.fromPositions(new position_1.Position(uiState.lineNumber, p.column)),
                        options: {
                            description: exports.GHOST_TEXT_DESCRIPTION,
                            after: { content: p.text, inlineClassName: p.preview ? 'ghost-text-decoration-preview' : 'ghost-text-decoration', cursorStops: model_1.InjectedTextCursorStops.Left },
                            showIfCollapsed: true,
                        }
                    });
                }
                return decorations;
            });
            this.additionalLinesWidget = this._register(new AdditionalLinesWidget(this.editor, this.languageService.languageIdCodec, (0, observable_1.derived)(reader => {
                /** @description lines */
                const uiState = this.uiState.read(reader);
                return uiState ? {
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
    class AdditionalLinesWidget extends lifecycle_1.Disposable {
        get viewZoneId() { return this._viewZoneId; }
        constructor(editor, languageIdCodec, lines) {
            super();
            this.editor = editor;
            this.languageIdCodec = languageIdCodec;
            this.lines = lines;
            this._viewZoneId = undefined;
            this.editorOptionsChanged = (0, observable_1.observableSignalFromEvent)('editorOptionChanged', event_1.Event.filter(this.editor.onDidChangeConfiguration, e => e.hasChanged(33 /* EditorOption.disableMonospaceOptimizations */)
                || e.hasChanged(117 /* EditorOption.stopRenderingLineAfter */)
                || e.hasChanged(99 /* EditorOption.renderWhitespace */)
                || e.hasChanged(94 /* EditorOption.renderControlCharacters */)
                || e.hasChanged(51 /* EditorOption.fontLigatures */)
                || e.hasChanged(50 /* EditorOption.fontInfo */)
                || e.hasChanged(67 /* EditorOption.lineHeight */)));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update view zone */
                const lines = this.lines.read(reader);
                this.editorOptionsChanged.read(reader);
                if (lines) {
                    this.updateLines(lines.lineNumber, lines.additionalLines, lines.minReservedLineCount);
                }
                else {
                    this.clear();
                }
            }));
        }
        dispose() {
            super.dispose();
            this.clear();
        }
        clear() {
            this.editor.changeViewZones((changeAccessor) => {
                if (this._viewZoneId) {
                    changeAccessor.removeZone(this._viewZoneId);
                    this._viewZoneId = undefined;
                }
            });
        }
        updateLines(lineNumber, additionalLines, minReservedLineCount) {
            const textModel = this.editor.getModel();
            if (!textModel) {
                return;
            }
            const { tabSize } = textModel.getOptions();
            this.editor.changeViewZones((changeAccessor) => {
                if (this._viewZoneId) {
                    changeAccessor.removeZone(this._viewZoneId);
                    this._viewZoneId = undefined;
                }
                const heightInLines = Math.max(additionalLines.length, minReservedLineCount);
                if (heightInLines > 0) {
                    const domNode = document.createElement('div');
                    renderLines(domNode, tabSize, additionalLines, this.editor.getOptions(), this.languageIdCodec);
                    this._viewZoneId = changeAccessor.addZone({
                        afterLineNumber: lineNumber,
                        heightInLines: heightInLines,
                        domNode,
                        afterColumnAffinity: 1 /* PositionAffinity.Right */
                    });
                }
            });
        }
    }
    exports.AdditionalLinesWidget = AdditionalLinesWidget;
    function renderLines(domNode, tabSize, lines, opts, languageIdCodec) {
        const disableMonospaceOptimizations = opts.get(33 /* EditorOption.disableMonospaceOptimizations */);
        const stopRenderingLineAfter = opts.get(117 /* EditorOption.stopRenderingLineAfter */);
        // To avoid visual confusion, we don't want to render visible whitespace
        const renderWhitespace = 'none';
        const renderControlCharacters = opts.get(94 /* EditorOption.renderControlCharacters */);
        const fontLigatures = opts.get(51 /* EditorOption.fontLigatures */);
        const fontInfo = opts.get(50 /* EditorOption.fontInfo */);
        const lineHeight = opts.get(67 /* EditorOption.lineHeight */);
        const sb = new stringBuilder_1.StringBuilder(10000);
        sb.appendString('<div class="suggest-preview-text">');
        for (let i = 0, len = lines.length; i < len; i++) {
            const lineData = lines[i];
            const line = lineData.content;
            sb.appendString('<div class="view-line');
            sb.appendString('" style="top:');
            sb.appendString(String(i * lineHeight));
            sb.appendString('px;width:1000000px;">');
            const isBasicASCII = strings.isBasicASCII(line);
            const containsRTL = strings.containsRTL(line);
            const lineTokens = lineTokens_1.LineTokens.createEmpty(line, languageIdCodec);
            (0, viewLineRenderer_1.renderViewLine)(new viewLineRenderer_1.RenderLineInput((fontInfo.isMonospace && !disableMonospaceOptimizations), fontInfo.canUseHalfwidthRightwardsArrow, line, false, isBasicASCII, containsRTL, 0, lineTokens, lineData.decorations, tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, null), sb);
            sb.appendString('</div>');
        }
        sb.appendString('</div>');
        (0, domFontInfo_1.applyFontInfo)(domNode, fontInfo);
        const html = sb.build();
        const trustedhtml = exports.ttPolicy ? exports.ttPolicy.createHTML(html) : html;
        domNode.innerHTML = trustedhtml;
    }
    exports.ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('editorGhostText', { createHTML: value => value });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hvc3RUZXh0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9naG9zdFRleHRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0JuRixRQUFBLHNCQUFzQixHQUFHLFlBQVksQ0FBQztJQU81QyxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVO1FBSTlDLFlBQ2tCLE1BQW1CLEVBQ25CLEtBQTRCLEVBQzNCLGVBQWtEO1lBRXBFLEtBQUssRUFBRSxDQUFDO1lBSlMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixVQUFLLEdBQUwsS0FBSyxDQUF1QjtZQUNWLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQU5wRCxlQUFVLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQyxxQkFBZ0IsR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBYXBJLFlBQU8sR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNqRCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELElBQUksU0FBUyxLQUFLLElB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