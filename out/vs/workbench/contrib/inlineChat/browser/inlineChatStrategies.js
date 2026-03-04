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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker", "vs/editor/common/viewModel", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "vs/workbench/contrib/chat/common/chatWordCounter", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/base/common/types", "vs/editor/common/services/model", "./utils", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/browser/codeBlockPart", "vs/base/common/resources"], function (require, exports, dom_1, arrays_1, event_1, lifecycle_1, themables_1, stableEditorScroll_1, renderLines_1, lineRange_1, range_1, model_1, textModel_1, editorWorker_1, viewModel_1, nls_1, contextkey_1, progress_1, chatWordCounter_1, inlineChat_1, types_1, model_2, utils_1, accessibility_1, configuration_1, textfiles_1, network_1, instantiation_1, codeBlockPart_1, resources_1) {
    "use strict";
    var EditModeStrategy_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiveStrategy = exports.PreviewStrategy = exports.EditModeStrategy = void 0;
    let EditModeStrategy = class EditModeStrategy {
        static { EditModeStrategy_1 = this; }
        static { this._decoBlock = textModel_1.ModelDecorationOptions.register({
            description: 'inline-chat',
            showIfCollapsed: false,
            isWholeLine: true,
            className: 'inline-chat-block-selection',
        }); }
        constructor(_session, _editor, _zone, _textFileService, _instaService) {
            this._session = _session;
            this._editor = _editor;
            this._zone = _zone;
            this._textFileService = _textFileService;
            this._instaService = _instaService;
            this._store = new lifecycle_1.DisposableStore();
            this._onDidAccept = this._store.add(new event_1.Emitter());
            this._onDidDiscard = this._store.add(new event_1.Emitter());
            this._editCount = 0;
            this.onDidAccept = this._onDidAccept.event;
            this.onDidDiscard = this._onDidDiscard.event;
        }
        dispose() {
            this._store.dispose();
        }
        async _doApplyChanges(ignoreLocal) {
            const untitledModels = [];
            const editor = this._instaService.createInstance(codeBlockPart_1.DefaultChatTextEditor);
            for (const request of this._session.chatModel.getRequests()) {
                if (!request.response?.response) {
                    continue;
                }
                for (const item of request.response.response.value) {
                    if (item.kind !== 'textEditGroup') {
                        continue;
                    }
                    if (ignoreLocal && (0, resources_1.isEqual)(item.uri, this._session.textModelN.uri)) {
                        continue;
                    }
                    await editor.apply(request.response, item);
                    if (item.uri.scheme === network_1.Schemas.untitled) {
                        const untitled = this._textFileService.untitled.get(item.uri);
                        if (untitled) {
                            untitledModels.push(untitled);
                        }
                    }
                }
            }
            for (const untitledModel of untitledModels) {
                if (!untitledModel.isDisposed()) {
                    await untitledModel.resolve();
                    await untitledModel.save({ reason: 1 /* SaveReason.EXPLICIT */ });
                }
            }
        }
        cancel() {
            return this._session.hunkData.discardAll();
        }
        async acceptHunk() {
            this._onDidAccept.fire();
        }
        async discardHunk() {
            this._onDidDiscard.fire();
        }
        async _makeChanges(edits, obs, opts, progress) {
            // push undo stop before first edit
            if (++this._editCount === 1) {
                this._editor.pushUndoStop();
            }
            if (opts) {
                // ASYNC
                const durationInSec = opts.duration / 1000;
                for (const edit of edits) {
                    const wordCount = (0, chatWordCounter_1.countWords)(edit.text ?? '');
                    const speed = wordCount / durationInSec;
                    // console.log({ durationInSec, wordCount, speed: wordCount / durationInSec });
                    const asyncEdit = (0, utils_1.asProgressiveEdit)(new dom_1.WindowIntervalTimer(this._zone.domNode), edit, speed, opts.token);
                    await (0, utils_1.performAsyncTextEdit)(this._session.textModelN, asyncEdit, progress, obs);
                }
            }
            else {
                // SYNC
                obs.start();
                this._session.textModelN.pushEditOperations(null, edits, (undoEdits) => {
                    progress?.report(undoEdits);
                    return null;
                });
                obs.stop();
            }
        }
        getWholeRangeDecoration() {
            const ranges = [this._session.wholeRange.value];
            const newDecorations = ranges.map(range => range.isEmpty() ? undefined : ({ range, options: EditModeStrategy_1._decoBlock }));
            (0, arrays_1.coalesceInPlace)(newDecorations);
            return newDecorations;
        }
    };
    exports.EditModeStrategy = EditModeStrategy;
    exports.EditModeStrategy = EditModeStrategy = EditModeStrategy_1 = __decorate([
        __param(3, textfiles_1.ITextFileService),
        __param(4, instantiation_1.IInstantiationService)
    ], EditModeStrategy);
    let PreviewStrategy = class PreviewStrategy extends EditModeStrategy {
        constructor(session, editor, zone, modelService, contextKeyService, textFileService, instaService) {
            super(session, editor, zone, textFileService, instaService);
            this._ctxDocumentChanged = inlineChat_1.CTX_INLINE_CHAT_DOCUMENT_CHANGED.bindTo(contextKeyService);
            const baseModel = modelService.getModel(session.targetUri);
            event_1.Event.debounce(baseModel.onDidChangeContent.bind(baseModel), () => { }, 350)(_ => {
                if (!baseModel.isDisposed() && !session.textModel0.isDisposed()) {
                    this._ctxDocumentChanged.set(session.hasChangedText);
                }
            }, undefined, this._store);
        }
        dispose() {
            this._ctxDocumentChanged.reset();
            super.dispose();
        }
        async apply() {
            await super._doApplyChanges(false);
        }
        async makeChanges(edits, obs) {
        }
        async makeProgressiveChanges(edits, obs, opts) {
        }
        async undoChanges(altVersionId) {
            const { textModelN } = this._session;
            await undoModelUntil(textModelN, altVersionId);
        }
        async renderChanges(response) {
        }
        hasFocus() {
            return this._zone.widget.hasFocus();
        }
    };
    exports.PreviewStrategy = PreviewStrategy;
    exports.PreviewStrategy = PreviewStrategy = __decorate([
        __param(3, model_2.IModelService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, instantiation_1.IInstantiationService)
    ], PreviewStrategy);
    let LiveStrategy = class LiveStrategy extends EditModeStrategy {
        constructor(session, editor, zone, contextKeyService, _editorWorkerService, _accessibilityService, _configService, textFileService, instaService) {
            super(session, editor, zone, textFileService, instaService);
            this._editorWorkerService = _editorWorkerService;
            this._accessibilityService = _accessibilityService;
            this._configService = _configService;
            this._decoInsertedText = textModel_1.ModelDecorationOptions.register({
                description: 'inline-modified-line',
                className: 'inline-chat-inserted-range-linehighlight',
                isWholeLine: true,
                overviewRuler: {
                    position: model_1.OverviewRulerLane.Full,
                    color: (0, themables_1.themeColorFromId)(inlineChat_1.overviewRulerInlineChatDiffInserted),
                },
                minimap: {
                    position: 1 /* MinimapPosition.Inline */,
                    color: (0, themables_1.themeColorFromId)(inlineChat_1.minimapInlineChatDiffInserted),
                }
            });
            this._decoInsertedTextRange = textModel_1.ModelDecorationOptions.register({
                description: 'inline-chat-inserted-range-linehighlight',
                className: 'inline-chat-inserted-range',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            });
            this.acceptHunk = () => super.acceptHunk();
            this.discardHunk = () => super.discardHunk();
            this._hunkDisplayData = new Map();
            this._ctxCurrentChangeHasDiff = inlineChat_1.CTX_INLINE_CHAT_CHANGE_HAS_DIFF.bindTo(contextKeyService);
            this._ctxCurrentChangeShowsDiff = inlineChat_1.CTX_INLINE_CHAT_CHANGE_SHOWS_DIFF.bindTo(contextKeyService);
            this._progressiveEditingDecorations = this._editor.createDecorationsCollection();
        }
        dispose() {
            this._resetDiff();
            super.dispose();
        }
        _resetDiff() {
            this._ctxCurrentChangeHasDiff.reset();
            this._ctxCurrentChangeShowsDiff.reset();
            this._zone.widget.updateStatus('');
            this._progressiveEditingDecorations.clear();
            for (const data of this._hunkDisplayData.values()) {
                data.remove();
            }
        }
        async apply() {
            this._resetDiff();
            if (this._editCount > 0) {
                this._editor.pushUndoStop();
            }
            await super._doApplyChanges(true);
        }
        cancel() {
            this._resetDiff();
            return super.cancel();
        }
        async undoChanges(altVersionId) {
            const { textModelN } = this._session;
            await undoModelUntil(textModelN, altVersionId);
        }
        async makeChanges(edits, obs) {
            return this._makeChanges(edits, obs, undefined, undefined);
        }
        async makeProgressiveChanges(edits, obs, opts) {
            // add decorations once per line that got edited
            const progress = new progress_1.Progress(edits => {
                const newLines = new Set();
                for (const edit of edits) {
                    lineRange_1.LineRange.fromRange(edit.range).forEach(line => newLines.add(line));
                }
                const existingRanges = this._progressiveEditingDecorations.getRanges().map(lineRange_1.LineRange.fromRange);
                for (const existingRange of existingRanges) {
                    existingRange.forEach(line => newLines.delete(line));
                }
                const newDecorations = [];
                for (const line of newLines) {
                    newDecorations.push({ range: new range_1.Range(line, 1, line, Number.MAX_VALUE), options: this._decoInsertedText });
                }
                this._progressiveEditingDecorations.append(newDecorations);
            });
            return this._makeChanges(edits, obs, opts, progress);
        }
        async renderChanges(response) {
            this._progressiveEditingDecorations.clear();
            const renderHunks = () => {
                let widgetData;
                changeDecorationsAndViewZones(this._editor, (decorationsAccessor, viewZoneAccessor) => {
                    const keysNow = new Set(this._hunkDisplayData.keys());
                    widgetData = undefined;
                    for (const hunkData of this._session.hunkData.getInfo()) {
                        keysNow.delete(hunkData);
                        const hunkRanges = hunkData.getRangesN();
                        let data = this._hunkDisplayData.get(hunkData);
                        if (!data) {
                            // first time -> create decoration
                            const decorationIds = [];
                            for (let i = 0; i < hunkRanges.length; i++) {
                                decorationIds.push(decorationsAccessor.addDecoration(hunkRanges[i], i === 0
                                    ? this._decoInsertedText
                                    : this._decoInsertedTextRange));
                            }
                            const acceptHunk = () => {
                                hunkData.acceptChanges();
                                renderHunks();
                            };
                            const discardHunk = () => {
                                hunkData.discardChanges();
                                renderHunks();
                            };
                            // original view zone
                            const mightContainNonBasicASCII = this._session.textModel0.mightContainNonBasicASCII();
                            const mightContainRTL = this._session.textModel0.mightContainRTL();
                            const renderOptions = renderLines_1.RenderOptions.fromEditor(this._editor);
                            const originalRange = hunkData.getRanges0()[0];
                            const source = new renderLines_1.LineSource(lineRange_1.LineRange.fromRangeInclusive(originalRange).mapToLineArray(l => this._session.textModel0.tokenization.getLineTokens(l)), [], mightContainNonBasicASCII, mightContainRTL);
                            const domNode = document.createElement('div');
                            domNode.className = 'inline-chat-original-zone2';
                            const result = (0, renderLines_1.renderLines)(source, renderOptions, [new viewModel_1.InlineDecoration(new range_1.Range(originalRange.startLineNumber, 1, originalRange.startLineNumber, 1), '', 0 /* InlineDecorationType.Regular */)], domNode);
                            const viewZoneData = {
                                afterLineNumber: -1,
                                heightInLines: result.heightInLines,
                                domNode,
                            };
                            const toggleDiff = () => {
                                const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editor);
                                changeDecorationsAndViewZones(this._editor, (_decorationsAccessor, viewZoneAccessor) => {
                                    (0, types_1.assertType)(data);
                                    if (!data.viewZoneId) {
                                        const [hunkRange] = hunkData.getRangesN();
                                        viewZoneData.afterLineNumber = hunkRange.startLineNumber - 1;
                                        data.viewZoneId = viewZoneAccessor.addZone(viewZoneData);
                                    }
                                    else {
                                        viewZoneAccessor.removeZone(data.viewZoneId);
                                        data.viewZoneId = undefined;
                                    }
                                });
                                this._ctxCurrentChangeShowsDiff.set(typeof data?.viewZoneId === 'string');
                                scrollState.restore(this._editor);
                            };
                            const remove = () => {
                                changeDecorationsAndViewZones(this._editor, (decorationsAccessor, viewZoneAccessor) => {
                                    (0, types_1.assertType)(data);
                                    for (const decorationId of data.decorationIds) {
                                        decorationsAccessor.removeDecoration(decorationId);
                                    }
                                    if (data.viewZoneId) {
                                        viewZoneAccessor.removeZone(data.viewZoneId);
                                    }
                                    data.decorationIds = [];
                                    data.viewZoneId = undefined;
                                });
                            };
                            const move = (next) => {
                                (0, types_1.assertType)(widgetData);
                                const candidates = [];
                                for (const item of this._session.hunkData.getInfo()) {
                                    if (item.getState() === 0 /* HunkState.Pending */) {
                                        candidates.push(item.getRangesN()[0].getStartPosition().delta(-1));
                                    }
                                }
                                if (candidates.length < 2) {
                                    return;
                                }
                                for (let i = 0; i < candidates.length; i++) {
                                    if (candidates[i].equals(widgetData.position)) {
                                        let newPos;
                                        if (next) {
                                            newPos = candidates[(i + 1) % candidates.length];
                                        }
                                        else {
                                            newPos = candidates[(i + candidates.length - 1) % candidates.length];
                                        }
                                        this._zone.updatePositionAndHeight(newPos);
                                        renderHunks();
                                        break;
                                    }
                                }
                            };
                            const zoneLineNumber = this._zone.position.lineNumber;
                            const myDistance = zoneLineNumber <= hunkRanges[0].startLineNumber
                                ? hunkRanges[0].startLineNumber - zoneLineNumber
                                : zoneLineNumber - hunkRanges[0].endLineNumber;
                            data = {
                                hunk: hunkData,
                                decorationIds,
                                viewZoneId: '',
                                viewZone: viewZoneData,
                                distance: myDistance,
                                position: hunkRanges[0].getStartPosition().delta(-1),
                                acceptHunk,
                                discardHunk,
                                toggleDiff: !hunkData.isInsertion() ? toggleDiff : undefined,
                                remove,
                                move,
                            };
                            this._hunkDisplayData.set(hunkData, data);
                        }
                        else if (hunkData.getState() !== 0 /* HunkState.Pending */) {
                            data.remove();
                        }
                        else {
                            // update distance and position based on modifiedRange-decoration
                            const zoneLineNumber = this._zone.position.lineNumber;
                            const modifiedRangeNow = hunkRanges[0];
                            data.position = modifiedRangeNow.getStartPosition().delta(-1);
                            data.distance = zoneLineNumber <= modifiedRangeNow.startLineNumber
                                ? modifiedRangeNow.startLineNumber - zoneLineNumber
                                : zoneLineNumber - modifiedRangeNow.endLineNumber;
                        }
                        if (hunkData.getState() === 0 /* HunkState.Pending */ && (!widgetData || data.distance < widgetData.distance)) {
                            widgetData = data;
                        }
                    }
                    for (const key of keysNow) {
                        const data = this._hunkDisplayData.get(key);
                        if (data) {
                            this._hunkDisplayData.delete(key);
                            data.remove();
                        }
                    }
                });
                if (widgetData) {
                    this._zone.updatePositionAndHeight(widgetData.position);
                    this._editor.revealPositionInCenterIfOutsideViewport(widgetData.position);
                    const remainingHunks = this._session.hunkData.pending;
                    this._updateSummaryMessage(remainingHunks, this._session.hunkData.size);
                    const mode = this._configService.getValue("inlineChat.accessibleDiffView" /* InlineChatConfigKeys.AccessibleDiffView */);
                    if (mode === 'on' || mode === 'auto' && this._accessibilityService.isScreenReaderOptimized()) {
                        this._zone.widget.showAccessibleHunk(this._session, widgetData.hunk);
                    }
                    this._ctxCurrentChangeHasDiff.set(Boolean(widgetData.toggleDiff));
                    this.toggleDiff = widgetData.toggleDiff;
                    this.acceptHunk = async () => widgetData.acceptHunk();
                    this.discardHunk = async () => widgetData.discardHunk();
                    this.move = next => widgetData.move(next);
                }
                else if (this._hunkDisplayData.size > 0) {
                    // everything accepted or rejected
                    let oneAccepted = false;
                    for (const hunkData of this._session.hunkData.getInfo()) {
                        if (hunkData.getState() === 1 /* HunkState.Accepted */) {
                            oneAccepted = true;
                            break;
                        }
                    }
                    if (oneAccepted) {
                        this._onDidAccept.fire();
                    }
                    else {
                        this._onDidDiscard.fire();
                    }
                }
                return widgetData;
            };
            return renderHunks()?.position;
        }
        _updateSummaryMessage(remaining, total) {
            const needsReview = this._configService.getValue("inlineChat.acceptedOrDiscardBeforeSave" /* InlineChatConfigKeys.AcceptedOrDiscardBeforeSave */);
            let message;
            if (total === 0) {
                message = (0, nls_1.localize)('change.0', "Nothing changed.");
            }
            else if (remaining === 1) {
                message = needsReview
                    ? (0, nls_1.localize)('review.1', "$(info) Accept or Discard 1 change.")
                    : (0, nls_1.localize)('change.1', "1 change");
            }
            else {
                message = needsReview
                    ? (0, nls_1.localize)('review.N', "$(info) Accept or Discard {0} changes.", remaining)
                    : (0, nls_1.localize)('change.N', "{0} changes", total);
            }
            let title;
            if (needsReview) {
                title = (0, nls_1.localize)('review', "Review (accept or discard) all changes before continuing.");
            }
            this._zone.widget.updateStatus(message, { title });
        }
        hasFocus() {
            return this._zone.widget.hasFocus();
        }
        getWholeRangeDecoration() {
            // don't render the blue in live mode
            return [];
        }
    };
    exports.LiveStrategy = LiveStrategy;
    exports.LiveStrategy = LiveStrategy = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, accessibility_1.IAccessibilityService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, instantiation_1.IInstantiationService)
    ], LiveStrategy);
    async function undoModelUntil(model, targetAltVersion) {
        while (targetAltVersion < model.getAlternativeVersionId() && model.canUndo()) {
            await model.undo();
        }
    }
    function changeDecorationsAndViewZones(editor, callback) {
        editor.changeDecorations(decorationsAccessor => {
            editor.changeViewZones(viewZoneAccessor => {
                callback(decorationsAccessor, viewZoneAccessor);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFN0cmF0ZWdpZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdFN0cmF0ZWdpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThDekYsSUFBZSxnQkFBZ0IsR0FBL0IsTUFBZSxnQkFBZ0I7O2lCQUVwQixlQUFVLEdBQUcsa0NBQXNCLENBQUMsUUFBUSxDQUFDO1lBQzdELFdBQVcsRUFBRSxhQUFhO1lBQzFCLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFNBQVMsRUFBRSw2QkFBNkI7U0FDeEMsQ0FBQyxBQUx5QixDQUt4QjtRQWFILFlBQ29CLFFBQWlCLEVBQ2pCLE9BQW9CLEVBQ3BCLEtBQTJCLEVBQzVCLGdCQUFtRCxFQUM5QyxhQUFxRDtZQUp6RCxhQUFRLEdBQVIsUUFBUSxDQUFTO1lBQ2pCLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDcEIsVUFBSyxHQUFMLEtBQUssQ0FBc0I7WUFDWCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQzdCLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQWhCMUQsV0FBTSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQy9CLGlCQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3BELGtCQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBRTlELGVBQVUsR0FBVyxDQUFDLENBQUM7WUFFeEIsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFD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