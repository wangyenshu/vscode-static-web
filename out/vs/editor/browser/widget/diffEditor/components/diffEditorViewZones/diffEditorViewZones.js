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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/base/common/types", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/widget/diffEditor/registrations.contribution", "vs/editor/browser/widget/diffEditor/diffEditorViewModel", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/inlineDiffDeletedCodeMargin", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/viewModel", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextview/browser/contextView"], function (require, exports, dom_1, arrays_1, async_1, codicons_1, lifecycle_1, observable_1, themables_1, types_1, domFontInfo_1, registrations_contribution_1, diffEditorViewModel_1, inlineDiffDeletedCodeMargin_1, renderLines_1, utils_1, lineRange_1, position_1, viewModel_1, clipboardService_1, contextView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorViewZones = void 0;
    /**
     * Ensures both editors have the same height by aligning unchanged lines.
     * In inline view mode, inserts viewzones to show deleted code from the original text model in the modified code editor.
     * Synchronizes scrolling.
     *
     * Make sure to add the view zones!
     */
    let DiffEditorViewZones = class DiffEditorViewZones extends lifecycle_1.Disposable {
        constructor(_targetWindow, _editors, _diffModel, _options, _diffEditorWidget, _canIgnoreViewZoneUpdateEvent, _origViewZonesToIgnore, _modViewZonesToIgnore, _clipboardService, _contextMenuService) {
            super();
            this._targetWindow = _targetWindow;
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._diffEditorWidget = _diffEditorWidget;
            this._canIgnoreViewZoneUpdateEvent = _canIgnoreViewZoneUpdateEvent;
            this._origViewZonesToIgnore = _origViewZonesToIgnore;
            this._modViewZonesToIgnore = _modViewZonesToIgnore;
            this._clipboardService = _clipboardService;
            this._contextMenuService = _contextMenuService;
            this._originalTopPadding = (0, observable_1.observableValue)(this, 0);
            this._originalScrollOffset = (0, observable_1.observableValue)(this, 0);
            this._originalScrollOffsetAnimated = (0, utils_1.animatedObservable)(this._targetWindow, this._originalScrollOffset, this._store);
            this._modifiedTopPadding = (0, observable_1.observableValue)(this, 0);
            this._modifiedScrollOffset = (0, observable_1.observableValue)(this, 0);
            this._modifiedScrollOffsetAnimated = (0, utils_1.animatedObservable)(this._targetWindow, this._modifiedScrollOffset, this._store);
            const state = (0, observable_1.observableValue)('invalidateAlignmentsState', 0);
            const updateImmediately = this._register(new async_1.RunOnceScheduler(() => {
                state.set(state.get() + 1, undefined);
            }, 0));
            this._register(this._editors.original.onDidChangeViewZones((_args) => { if (!this._canIgnoreViewZoneUpdateEvent()) {
                updateImmediately.schedule();
            } }));
            this._register(this._editors.modified.onDidChangeViewZones((_args) => { if (!this._canIgnoreViewZoneUpdateEvent()) {
                updateImmediately.schedule();
            } }));
            this._register(this._editors.original.onDidChangeConfiguration((args) => {
                if (args.hasChanged(146 /* EditorOption.wrappingInfo */) || args.hasChanged(67 /* EditorOption.lineHeight */)) {
                    updateImmediately.schedule();
                }
            }));
            this._register(this._editors.modified.onDidChangeConfiguration((args) => {
                if (args.hasChanged(146 /* EditorOption.wrappingInfo */) || args.hasChanged(67 /* EditorOption.lineHeight */)) {
                    updateImmediately.schedule();
                }
            }));
            const originalModelTokenizationCompleted = this._diffModel.map(m => m ? (0, observable_1.observableFromEvent)(m.model.original.onDidChangeTokens, () => m.model.original.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) : undefined).map((m, reader) => m?.read(reader));
            const alignments = (0, observable_1.derived)((reader) => {
                /** @description alignments */
                const diffModel = this._diffModel.read(reader);
                const diff = diffModel?.diff.read(reader);
                if (!diffModel || !diff) {
                    return null;
                }
                state.read(reader);
                const renderSideBySide = this._options.renderSideBySide.read(reader);
                const innerHunkAlignment = renderSideBySide;
                return computeRangeAlignment(this._editors.original, this._editors.modified, diff.mappings, this._origViewZonesToIgnore, this._modViewZonesToIgnore, innerHunkAlignment);
            });
            const alignmentsSyncedMovedText = (0, observable_1.derived)((reader) => {
                /** @description alignmentsSyncedMovedText */
                const syncedMovedText = this._diffModel.read(reader)?.movedTextToCompare.read(reader);
                if (!syncedMovedText) {
                    return null;
                }
                state.read(reader);
                const mappings = syncedMovedText.changes.map(c => new diffEditorViewModel_1.DiffMapping(c));
                // TODO dont include alignments outside syncedMovedText
                return computeRangeAlignment(this._editors.original, this._editors.modified, mappings, this._origViewZonesToIgnore, this._modViewZonesToIgnore, true);
            });
            function createFakeLinesDiv() {
                const r = document.createElement('div');
                r.className = 'diagonal-fill';
                return r;
            }
            const alignmentViewZonesDisposables = this._register(new lifecycle_1.DisposableStore());
            this.viewZones = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                alignmentViewZonesDisposables.clear();
                const alignmentsVal = alignments.read(reader) || [];
                const origViewZones = [];
                const modViewZones = [];
                const modifiedTopPaddingVal = this._modifiedTopPadding.read(reader);
                if (modifiedTopPaddingVal > 0) {
                    modViewZones.push({
                        afterLineNumber: 0,
                        domNode: document.createElement('div'),
                        heightInPx: modifiedTopPaddingVal,
                        showInHiddenAreas: true,
                        suppressMouseDown: true,
                    });
                }
                const originalTopPaddingVal = this._originalTopPadding.read(reader);
                if (originalTopPaddingVal > 0) {
                    origViewZones.push({
                        afterLineNumber: 0,
                        domNode: document.createElement('div'),
                        heightInPx: originalTopPaddingVal,
                        showInHiddenAreas: true,
                        suppressMouseDown: true,
                    });
                }
                const renderSideBySide = this._options.renderSideBySide.read(reader);
                const deletedCodeLineBreaksComputer = !renderSideBySide ? this._editors.modified._getViewModel()?.createLineBreaksComputer() : undefined;
                if (deletedCodeLineBreaksComputer) {
                    const originalModel = this._editors.original.getModel();
                    for (const a of alignmentsVal) {
                        if (a.diff) {
                            for (let i = a.originalRange.startLineNumber; i < a.originalRange.endLineNumberExclusive; i++) {
                                // `i` can be out of bound when the diff has not been updated yet.
                                // In this case, we do an early return.
                                // TODO@hediet: Fix this by applying the edit directly to the diff model, so that the diff is always valid.
                                if (i > originalModel.getLineCount()) {
                                    return { orig: origViewZones, mod: modViewZones };
                                }
                                deletedCodeLineBreaksComputer?.addRequest(originalModel.getLineContent(i), null, null);
                            }
                        }
                    }
                }
                const lineBreakData = deletedCodeLineBreaksComputer?.finalize() ?? [];
                let lineBreakDataIdx = 0;
                const modLineHeight = this._editors.modified.getOption(67 /* EditorOption.lineHeight */);
                const syncedMovedText = this._diffModel.read(reader)?.movedTextToCompare.read(reader);
                const mightContainNonBasicASCII = this._editors.original.getModel()?.mightContainNonBasicASCII() ?? false;
                const mightContainRTL = this._editors.original.getModel()?.mightContainRTL() ?? false;
                const renderOptions = renderLines_1.RenderOptions.fromEditor(this._editors.modified);
                for (const a of alignmentsVal) {
                    if (a.diff && !renderSideBySide) {
                        if (!a.originalRange.isEmpty) {
                            originalModelTokenizationCompleted.read(reader); // Update view-zones once tokenization completes
                            const deletedCodeDomNode = document.createElement('div');
                            deletedCodeDomNode.classList.add('view-lines', 'line-delete', 'monaco-mouse-cursor-text');
                            const originalModel = this._editors.original.getModel();
                            // `a.originalRange` can be out of bound when the diff has not been updated yet.
                            // In this case, we do an early return.
                            // TODO@hediet: Fix this by applying the edit directly to the diff model, so that the diff is always valid.
                            if (a.originalRange.endLineNumberExclusive - 1 > originalModel.getLineCount()) {
                                return { orig: origViewZones, mod: modViewZones };
                            }
                            const source = new renderLines_1.LineSource(a.originalRange.mapToLineArray(l => originalModel.tokenization.getLineTokens(l)), a.originalRange.mapToLineArray(_ => lineBreakData[lineBreakDataIdx++]), mightContainNonBasicASCII, mightContainRTL);
                            const decorations = [];
                            for (const i of a.diff.innerChanges || []) {
                                decorations.push(new viewModel_1.InlineDecoration(i.originalRange.delta(-(a.diff.original.startLineNumber - 1)), registrations_contribution_1.diffDeleteDecoration.className, 0 /* InlineDecorationType.Regular */));
                            }
                            const result = (0, renderLines_1.renderLines)(source, renderOptions, decorations, deletedCodeDomNode);
                            const marginDomNode = document.createElement('div');
                            marginDomNode.className = 'inline-deleted-margin-view-zone';
                            (0, domFontInfo_1.applyFontInfo)(marginDomNode, renderOptions.fontInfo);
                            if (this._options.renderIndicators.read(reader)) {
                                for (let i = 0; i < result.heightInLines; i++) {
                                    const marginElement = document.createElement('div');
                                    marginElement.className = `delete-sign ${themables_1.ThemeIcon.asClassName(registrations_contribution_1.diffRemoveIcon)}`;
                                    marginElement.setAttribute('style', `position:absolute;top:${i * modLineHeight}px;width:${renderOptions.lineDecorationsWidth}px;height:${modLineHeight}px;right:0;`);
                                    marginDomNode.appendChild(marginElement);
                                }
                            }
                            let zoneId = undefined;
                            alignmentViewZonesDisposables.add(new inlineDiffDeletedCodeMargin_1.InlineDiffDeletedCodeMargin(() => (0, types_1.assertIsDefined)(zoneId), marginDomNode, this._editors.modified, a.diff, this._diffEditorWidget, result.viewLineCounts, this._editors.original.getModel(), this._contextMenuService, this._clipboardService));
                            for (let i = 0; i < result.viewLineCounts.length; i++) {
                                const count = result.viewLineCounts[i];
                                // Account for wrapped lines in the (collapsed) original editor (which doesn't wrap lines).
                                if (count > 1) {
                                    origViewZones.push({
                                        afterLineNumber: a.originalRange.startLineNumber + i,
                                        domNode: createFakeLinesDiv(),
                                        heightInPx: (count - 1) * modLineHeight,
                                        showInHiddenAreas: true,
                                        suppressMouseDown: true,
                                    });
                                }
                            }
                            modViewZones.push({
                                afterLineNumber: a.modifiedRange.startLineNumber - 1,
                                domNode: deletedCodeDomNode,
                                heightInPx: result.heightInLines * modLineHeight,
                                minWidthInPx: result.minWidthInPx,
                                marginDomNode,
                                setZoneId(id) { zoneId = id; },
                                showInHiddenAreas: true,
                                suppressMouseDown: true,
                            });
                        }
                        const marginDomNode = document.createElement('div');
                        marginDomNode.className = 'gutter-delete';
                        origViewZones.push({
                            afterLineNumber: a.originalRange.endLineNumberExclusive - 1,
                            domNode: createFakeLinesDiv(),
                            heightInPx: a.modifiedHeightInPx,
                            marginDomNode,
                            showInHiddenAreas: true,
                            suppressMouseDown: true,
                        });
                    }
                    else {
                        const delta = a.modifiedHeightInPx - a.originalHeightInPx;
                        if (delta > 0) {
                            if (syncedMovedText?.lineRangeMapping.original.delta(-1).deltaLength(2).contains(a.originalRange.endLineNumberExclusive - 1)) {
                                continue;
                            }
                            origViewZones.push({
                                afterLineNumber: a.originalRange.endLineNumberExclusive - 1,
                                domNode: createFakeLinesDiv(),
                                heightInPx: delta,
                                showInHiddenAreas: true,
                                suppressMouseDown: true,
                            });
                        }
                        else {
                            if (syncedMovedText?.lineRangeMapping.modified.delta(-1).deltaLength(2).contains(a.modifiedRange.endLineNumberExclusive - 1)) {
                                continue;
                            }
                            function createViewZoneMarginArrow() {
                                const arrow = document.createElement('div');
                                arrow.className = 'arrow-revert-change ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.arrowRight);
                                store.add((0, dom_1.addDisposableListener)(arrow, 'mousedown', e => e.stopPropagation()));
                                store.add((0, dom_1.addDisposableListener)(arrow, 'click', e => {
                                    e.stopPropagation();
                                    _diffEditorWidget.revert(a.diff);
                                }));
                                return (0, dom_1.$)('div', {}, arrow);
                            }
                            let marginDomNode = undefined;
                            if (a.diff && a.diff.modified.isEmpty && this._options.shouldRenderOldRevertArrows.read(reader)) {
                                marginDomNode = createViewZoneMarginArrow();
                            }
                            modViewZones.push({
                                afterLineNumber: a.modifiedRange.endLineNumberExclusive - 1,
                                domNode: createFakeLinesDiv(),
                                heightInPx: -delta,
                                marginDomNode,
                                showInHiddenAreas: true,
                                suppressMouseDown: true,
                            });
                        }
                    }
                }
                for (const a of alignmentsSyncedMovedText.read(reader) ?? []) {
                    if (!syncedMovedText?.lineRangeMapping.original.intersect(a.originalRange)
                        || !syncedMovedText?.lineRangeMapping.modified.intersect(a.modifiedRange)) {
                        // ignore unrelated alignments outside the synced moved text
                        continue;
                    }
                    const delta = a.modifiedHeightInPx - a.originalHeightInPx;
                    if (delta > 0) {
                        origViewZones.push({
                            afterLineNumber: a.originalRange.endLineNumberExclusive - 1,
                            domNode: createFakeLinesDiv(),
                            heightInPx: delta,
                            showInHiddenAreas: true,
                            suppressMouseDown: true,
                        });
                    }
                    else {
                        modViewZones.push({
                            afterLineNumber: a.modifiedRange.endLineNumberExclusive - 1,
                            domNode: createFakeLinesDiv(),
                            heightInPx: -delta,
                            showInHiddenAreas: true,
                            suppressMouseDown: true,
                        });
                    }
                }
                return { orig: origViewZones, mod: modViewZones };
            });
            let ignoreChange = false;
            this._register(this._editors.original.onDidScrollChange(e => {
                if (e.scrollLeftChanged && !ignoreChange) {
                    ignoreChange = true;
                    this._editors.modified.setScrollLeft(e.scrollLeft);
                    ignoreChange = false;
                }
            }));
            this._register(this._editors.modified.onDidScrollChange(e => {
                if (e.scrollLeftChanged && !ignoreChange) {
                    ignoreChange = true;
                    this._editors.original.setScrollLeft(e.scrollLeft);
                    ignoreChange = false;
                }
            }));
            this._originalScrollTop = (0, observable_1.observableFromEvent)(this._editors.original.onDidScrollChange, () => /** @description original.getScrollTop */ this._editors.original.getScrollTop());
            this._modifiedScrollTop = (0, observable_1.observableFromEvent)(this._editors.modified.onDidScrollChange, () => /** @description modified.getScrollTop */ this._editors.modified.getScrollTop());
            // origExtraHeight + origOffset - origScrollTop = modExtraHeight + modOffset - modScrollTop
            // origScrollTop = origExtraHeight + origOffset - modExtraHeight - modOffset + modScrollTop
            // modScrollTop = modExtraHeight + modOffset - origExtraHeight - origOffset + origScrollTop
            // origOffset - modOffset = heightOfLines(1..Y) - heightOfLines(1..X)
            // origScrollTop >= 0, modScrollTop >= 0
            this._register((0, observable_1.autorun)(reader => {
                /** @description update scroll modified */
                const newScrollTopModified = this._originalScrollTop.read(reader)
                    - (this._originalScrollOffsetAnimated.get() - this._modifiedScrollOffsetAnimated.read(reader))
                    - (this._originalTopPadding.get() - this._modifiedTopPadding.read(reader));
                if (newScrollTopModified !== this._editors.modified.getScrollTop()) {
                    this._editors.modified.setScrollTop(newScrollTopModified, 1 /* ScrollType.Immediate */);
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update scroll original */
                const newScrollTopOriginal = this._modifiedScrollTop.read(reader)
                    - (this._modifiedScrollOffsetAnimated.get() - this._originalScrollOffsetAnimated.read(reader))
                    - (this._modifiedTopPadding.get() - this._originalTopPadding.read(reader));
                if (newScrollTopOriginal !== this._editors.original.getScrollTop()) {
                    this._editors.original.setScrollTop(newScrollTopOriginal, 1 /* ScrollType.Immediate */);
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update editor top offsets */
                const m = this._diffModel.read(reader)?.movedTextToCompare.read(reader);
                let deltaOrigToMod = 0;
                if (m) {
                    const trueTopOriginal = this._editors.original.getTopForLineNumber(m.lineRangeMapping.original.startLineNumber, true) - this._originalTopPadding.get();
                    const trueTopModified = this._editors.modified.getTopForLineNumber(m.lineRangeMapping.modified.startLineNumber, true) - this._modifiedTopPadding.get();
                    deltaOrigToMod = trueTopModified - trueTopOriginal;
                }
                if (deltaOrigToMod > 0) {
                    this._modifiedTopPadding.set(0, undefined);
                    this._originalTopPadding.set(deltaOrigToMod, undefined);
                }
                else if (deltaOrigToMod < 0) {
                    this._modifiedTopPadding.set(-deltaOrigToMod, undefined);
                    this._originalTopPadding.set(0, undefined);
                }
                else {
                    setTimeout(() => {
                        this._modifiedTopPadding.set(0, undefined);
                        this._originalTopPadding.set(0, undefined);
                    }, 400);
                }
                if (this._editors.modified.hasTextFocus()) {
                    this._originalScrollOffset.set(this._modifiedScrollOffset.get() - deltaOrigToMod, undefined, true);
                }
                else {
                    this._modifiedScrollOffset.set(this._originalScrollOffset.get() + deltaOrigToMod, undefined, true);
                }
            }));
        }
    };
    exports.DiffEditorViewZones = DiffEditorViewZones;
    exports.DiffEditorViewZones = DiffEditorViewZones = __decorate([
        __param(8, clipboardService_1.IClipboardService),
        __param(9, contextView_1.IContextMenuService)
    ], DiffEditorViewZones);
    function computeRangeAlignment(originalEditor, modifiedEditor, diffs, originalEditorAlignmentViewZones, modifiedEditorAlignmentViewZones, innerHunkAlignment) {
        const originalLineHeightOverrides = new arrays_1.ArrayQueue(getAdditionalLineHeights(originalEditor, originalEditorAlignmentViewZones));
        const modifiedLineHeightOverrides = new arrays_1.ArrayQueue(getAdditionalLineHeights(modifiedEditor, modifiedEditorAlignmentViewZones));
        const origLineHeight = originalEditor.getOption(67 /* EditorOption.lineHeight */);
        const modLineHeight = modifiedEditor.getOption(67 /* EditorOption.lineHeight */);
        const result = [];
        let lastOriginalLineNumber = 0;
        let lastModifiedLineNumber = 0;
        function handleAlignmentsOutsideOfDiffs(untilOriginalLineNumberExclusive, untilModifiedLineNumberExclusive) {
            while (true) {
                let origNext = originalLineHeightOverrides.peek();
                let modNext = modifiedLineHeightOverrides.peek();
                if (origNext && origNext.lineNumber >= untilOriginalLineNumberExclusive) {
                    origNext = undefined;
                }
                if (modNext && modNext.lineNumber >= untilModifiedLineNumberExclusive) {
                    modNext = undefined;
                }
                if (!origNext && !modNext) {
                    break;
                }
                const distOrig = origNext ? origNext.lineNumber - lastOriginalLineNumber : Number.MAX_VALUE;
                const distNext = modNext ? modNext.lineNumber - lastModifiedLineNumber : Number.MAX_VALUE;
                if (distOrig < distNext) {
                    originalLineHeightOverrides.dequeue();
                    modNext = {
                        lineNumber: origNext.lineNumber - lastOriginalLineNumber + lastModifiedLineNumber,
                        heightInPx: 0,
                    };
                }
                else if (distOrig > distNext) {
                    modifiedLineHeightOverrides.dequeue();
                    origNext = {
                        lineNumber: modNext.lineNumber - lastModifiedLineNumber + lastOriginalLineNumber,
                        heightInPx: 0,
                    };
                }
                else {
                    originalLineHeightOverrides.dequeue();
                    modifiedLineHeightOverrides.dequeue();
                }
                result.push({
                    originalRange: lineRange_1.LineRange.ofLength(origNext.lineNumber, 1),
                    modifiedRange: lineRange_1.LineRange.ofLength(modNext.lineNumber, 1),
                    originalHeightInPx: origLineHeight + origNext.heightInPx,
                    modifiedHeightInPx: modLineHeight + modNext.heightInPx,
                    diff: undefined,
                });
            }
        }
        for (const m of diffs) {
            const c = m.lineRangeMapping;
            handleAlignmentsOutsideOfDiffs(c.original.startLineNumber, c.modified.startLineNumber);
            let first = true;
            let lastModLineNumber = c.modified.startLineNumber;
            let lastOrigLineNumber = c.original.startLineNumber;
            function emitAlignment(origLineNumberExclusive, modLineNumberExclusive) {
                if (origLineNumberExclusive < lastOrigLineNumber || modLineNumberExclusive < lastModLineNumber) {
                    return;
                }
                if (first) {
                    first = false;
                }
                else if (origLineNumberExclusive === lastOrigLineNumber || modLineNumberExclusive === lastModLineNumber) {
                    return;
                }
                const originalRange = new lineRange_1.LineRange(lastOrigLineNumber, origLineNumberExclusive);
                const modifiedRange = new lineRange_1.LineRange(lastModLineNumber, modLineNumberExclusive);
                if (originalRange.isEmpty && modifiedRange.isEmpty) {
                    return;
                }
                const originalAdditionalHeight = originalLineHeightOverrides
                    .takeWhile(v => v.lineNumber < origLineNumberExclusive)
                    ?.reduce((p, c) => p + c.heightInPx, 0) ?? 0;
                const modifiedAdditionalHeight = modifiedLineHeightOverrides
                    .takeWhile(v => v.lineNumber < modLineNumberExclusive)
                    ?.reduce((p, c) => p + c.heightInPx, 0) ?? 0;
                result.push({
                    originalRange,
                    modifiedRange,
                    originalHeightInPx: originalRange.length * origLineHeight + originalAdditionalHeight,
                    modifiedHeightInPx: modifiedRange.length * modLineHeight + modifiedAdditionalHeight,
                    diff: m.lineRangeMapping,
                });
                lastOrigLineNumber = origLineNumberExclusive;
                lastModLineNumber = modLineNumberExclusive;
            }
            if (innerHunkAlignment) {
                for (const i of c.innerChanges || []) {
                    if (i.originalRange.startColumn > 1 && i.modifiedRange.startColumn > 1) {
                        // There is some unmodified text on this line before the diff
                        emitAlignment(i.originalRange.startLineNumber, i.modifiedRange.startLineNumber);
                    }
                    const originalModel = originalEditor.getModel();
                    // When the diff is invalid, the ranges might be out of bounds (this should be fixed in the diff model by applying edits directly).
                    const maxColumn = i.originalRange.endLineNumber <= originalModel.getLineCount() ? originalModel.getLineMaxColumn(i.originalRange.endLineNumber) : Number.MAX_SAFE_INTEGER;
                    if (i.originalRange.endColumn < maxColumn) {
                        // // There is some unmodified text on this line after the diff
                        emitAlignment(i.originalRange.endLineNumber, i.modifiedRange.endLineNumber);
                    }
                }
            }
            emitAlignment(c.original.endLineNumberExclusive, c.modified.endLineNumberExclusive);
            lastOriginalLineNumber = c.original.endLineNumberExclusive;
            lastModifiedLineNumber = c.modified.endLineNumberExclusive;
        }
        handleAlignmentsOutsideOfDiffs(Number.MAX_VALUE, Number.MAX_VALUE);
        return result;
    }
    function getAdditionalLineHeights(editor, viewZonesToIgnore) {
        const viewZoneHeights = [];
        const wrappingZoneHeights = [];
        const hasWrapping = editor.getOption(146 /* EditorOption.wrappingInfo */).wrappingColumn !== -1;
        const coordinatesConverter = editor._getViewModel().coordinatesConverter;
        const editorLineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
        if (hasWrapping) {
            for (let i = 1; i <= editor.getModel().getLineCount(); i++) {
                const lineCount = coordinatesConverter.getModelLineViewLineCount(i);
                if (lineCount > 1) {
                    wrappingZoneHeights.push({ lineNumber: i, heightInPx: editorLineHeight * (lineCount - 1) });
                }
            }
        }
        for (const w of editor.getWhitespaces()) {
            if (viewZonesToIgnore.has(w.id)) {
                continue;
            }
            const modelLineNumber = w.afterLineNumber === 0 ? 0 : coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(w.afterLineNumber, 1)).lineNumber;
            viewZoneHeights.push({ lineNumber: modelLineNumber, heightInPx: w.height });
        }
        const result = (0, utils_1.joinCombine)(viewZoneHeights, wrappingZoneHeights, v => v.lineNumber, (v1, v2) => ({ lineNumber: v1.lineNumber, heightInPx: v1.heightInPx + v2.heightInPx }));
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvclZpZXdab25lcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2NvbXBvbmVudHMvZGlmZkVkaXRvclZpZXdab25lcy9kaWZmRWRpdG9yVmlld1pvbmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCaEc7Ozs7OztPQU1HO0lBQ0ksSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQWFsRCxZQUNrQixhQUFxQixFQUNyQixRQUEyQixFQUMzQixVQUF3RCxFQUN4RCxRQUEyQixFQUMzQixpQkFBbUMsRUFDbkMsNkJBQTRDLEVBQzVDLHNCQUFtQyxFQUNuQyxxQkFBa0MsRUFDaEMsaUJBQXFELEVBQ25ELG1CQUF5RDtZQUU5RSxLQUFLLEVBQUUsQ0FBQztZQVhTLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1lBQ3JCLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLGVBQVUsR0FBVixVQUFVLENBQThDO1lBQ3hELGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7WUFDbkMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFlO1lBQzVDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBYTtZQUNuQywwQkFBcUIsR0FBckIscUJBQXFCLENBQWE7WUFDZixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2xDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUF0QjlELHdCQUFtQixHQUFHLElBQUEsNEJBQWUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFL0MsMEJBQXFCLEdBQUcsSUFBQSw0QkFBZSxFQUFrQixJQUFJLEVBQUUsQ0FBQyxDQUFD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