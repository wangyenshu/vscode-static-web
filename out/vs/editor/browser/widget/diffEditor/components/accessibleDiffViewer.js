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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/trustedTypes", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/config/editorOptions", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/diff/rangeMapping", "vs/editor/common/languages/language", "vs/editor/common/tokens/lineTokens", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel", "vs/nls", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "vs/css!./accessibleDiffViewer"], function (require, exports, dom_1, trustedTypes_1, actionbar_1, scrollableElement_1, actions_1, arrays_1, codicons_1, lifecycle_1, observable_1, themables_1, domFontInfo_1, utils_1, editorOptions_1, lineRange_1, offsetRange_1, position_1, range_1, rangeMapping_1, language_1, lineTokens_1, viewLineRenderer_1, viewModel_1, nls_1, accessibilitySignalService_1, instantiation_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleDiffViewerModelFromEditors = exports.AccessibleDiffViewer = void 0;
    const accessibleDiffViewerInsertIcon = (0, iconRegistry_1.registerIcon)('diff-review-insert', codicons_1.Codicon.add, (0, nls_1.localize)('accessibleDiffViewerInsertIcon', 'Icon for \'Insert\' in accessible diff viewer.'));
    const accessibleDiffViewerRemoveIcon = (0, iconRegistry_1.registerIcon)('diff-review-remove', codicons_1.Codicon.remove, (0, nls_1.localize)('accessibleDiffViewerRemoveIcon', 'Icon for \'Remove\' in accessible diff viewer.'));
    const accessibleDiffViewerCloseIcon = (0, iconRegistry_1.registerIcon)('diff-review-close', codicons_1.Codicon.close, (0, nls_1.localize)('accessibleDiffViewerCloseIcon', 'Icon for \'Close\' in accessible diff viewer.'));
    let AccessibleDiffViewer = class AccessibleDiffViewer extends lifecycle_1.Disposable {
        static { this._ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('diffReview', { createHTML: value => value }); }
        constructor(_parentNode, _visible, _setVisible, _canClose, _width, _height, _diffs, _models, _instantiationService) {
            super();
            this._parentNode = _parentNode;
            this._visible = _visible;
            this._setVisible = _setVisible;
            this._canClose = _canClose;
            this._width = _width;
            this._height = _height;
            this._diffs = _diffs;
            this._models = _models;
            this._instantiationService = _instantiationService;
            this._state = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                const visible = this._visible.read(reader);
                this._parentNode.style.visibility = visible ? 'visible' : 'hidden';
                if (!visible) {
                    return null;
                }
                const model = store.add(this._instantiationService.createInstance(ViewModel, this._diffs, this._models, this._setVisible, this._canClose));
                const view = store.add(this._instantiationService.createInstance(View, this._parentNode, model, this._width, this._height, this._models));
                return { model, view, };
            }).recomputeInitiallyAndOnChange(this._store);
        }
        next() {
            (0, observable_1.transaction)(tx => {
                const isVisible = this._visible.get();
                this._setVisible(true, tx);
                if (isVisible) {
                    this._state.get().model.nextGroup(tx);
                }
            });
        }
        prev() {
            (0, observable_1.transaction)(tx => {
                this._setVisible(true, tx);
                this._state.get().model.previousGroup(tx);
            });
        }
        close() {
            (0, observable_1.transaction)(tx => {
                this._setVisible(false, tx);
            });
        }
    };
    exports.AccessibleDiffViewer = AccessibleDiffViewer;
    exports.AccessibleDiffViewer = AccessibleDiffViewer = __decorate([
        __param(8, instantiation_1.IInstantiationService)
    ], AccessibleDiffViewer);
    let ViewModel = class ViewModel extends lifecycle_1.Disposable {
        constructor(_diffs, _models, _setVisible, canClose, _accessibilitySignalService) {
            super();
            this._diffs = _diffs;
            this._models = _models;
            this._setVisible = _setVisible;
            this.canClose = canClose;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._groups = (0, observable_1.observableValue)(this, []);
            this._currentGroupIdx = (0, observable_1.observableValue)(this, 0);
            this._currentElementIdx = (0, observable_1.observableValue)(this, 0);
            this.groups = this._groups;
            this.currentGroup = this._currentGroupIdx.map((idx, r) => this._groups.read(r)[idx]);
            this.currentGroupIndex = this._currentGroupIdx;
            this.currentElement = this._currentElementIdx.map((idx, r) => this.currentGroup.read(r)?.lines[idx]);
            this._register((0, observable_1.autorun)(reader => {
                /** @description update groups */
                const diffs = this._diffs.read(reader);
                if (!diffs) {
                    this._groups.set([], undefined);
                    return;
                }
                const groups = computeViewElementGroups(diffs, this._models.getOriginalModel().getLineCount(), this._models.getModifiedModel().getLineCount());
                (0, observable_1.transaction)(tx => {
                    const p = this._models.getModifiedPosition();
                    if (p) {
                        const nextGroup = groups.findIndex(g => p?.lineNumber < g.range.modified.endLineNumberExclusive);
                        if (nextGroup !== -1) {
                            this._currentGroupIdx.set(nextGroup, tx);
                        }
                    }
                    this._groups.set(groups, tx);
                });
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description play audio-cue for diff */
                const currentViewItem = this.currentElement.read(reader);
                if (currentViewItem?.type === LineType.Deleted) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineDeleted, { source: 'accessibleDiffViewer.currentElementChanged' });
                }
                else if (currentViewItem?.type === LineType.Added) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineInserted, { source: 'accessibleDiffViewer.currentElementChanged' });
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description select lines in editor */
                // This ensures editor commands (like revert/stage) work
                const currentViewItem = this.currentElement.read(reader);
                if (currentViewItem && currentViewItem.type !== LineType.Header) {
                    const lineNumber = currentViewItem.modifiedLineNumber ?? currentViewItem.diff.modified.startLineNumber;
                    this._models.modifiedSetSelection(range_1.Range.fromPositions(new position_1.Position(lineNumber, 1)));
                }
            }));
        }
        _goToGroupDelta(delta, tx) {
            const groups = this.groups.get();
            if (!groups || groups.length <= 1) {
                return;
            }
            (0, observable_1.subtransaction)(tx, tx => {
                this._currentGroupIdx.set(offsetRange_1.OffsetRange.ofLength(groups.length).clipCyclic(this._currentGroupIdx.get() + delta), tx);
                this._currentElementIdx.set(0, tx);
            });
        }
        nextGroup(tx) { this._goToGroupDelta(1, tx); }
        previousGroup(tx) { this._goToGroupDelta(-1, tx); }
        _goToLineDelta(delta) {
            const group = this.currentGroup.get();
            if (!group || group.lines.length <= 1) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                this._currentElementIdx.set(offsetRange_1.OffsetRange.ofLength(group.lines.length).clip(this._currentElementIdx.get() + delta), tx);
            });
        }
        goToNextLine() { this._goToLineDelta(1); }
        goToPreviousLine() { this._goToLineDelta(-1); }
        goToLine(line) {
            const group = this.currentGroup.get();
            if (!group) {
                return;
            }
            const idx = group.lines.indexOf(line);
            if (idx === -1) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                this._currentElementIdx.set(idx, tx);
            });
        }
        revealCurrentElementInEditor() {
            if (!this.canClose.get()) {
                return;
            }
            this._setVisible(false, undefined);
            const curElem = this.currentElement.get();
            if (curElem) {
                if (curElem.type === LineType.Deleted) {
                    this._models.originalReveal(range_1.Range.fromPositions(new position_1.Position(curElem.originalLineNumber, 1)));
                }
                else {
                    this._models.modifiedReveal(curElem.type !== LineType.Header
                        ? range_1.Range.fromPositions(new position_1.Position(curElem.modifiedLineNumber, 1))
                        : undefined);
                }
            }
        }
        close() {
            if (!this.canClose.get()) {
                return;
            }
            this._setVisible(false, undefined);
            this._models.modifiedFocus();
        }
    };
    ViewModel = __decorate([
        __param(4, accessibilitySignalService_1.IAccessibilitySignalService)
    ], ViewModel);
    const viewElementGroupLineMargin = 3;
    function computeViewElementGroups(diffs, originalLineCount, modifiedLineCount) {
        const result = [];
        for (const g of (0, arrays_1.groupAdjacentBy)(diffs, (a, b) => (b.modified.startLineNumber - a.modified.endLineNumberExclusive < 2 * viewElementGroupLineMargin))) {
            const viewElements = [];
            viewElements.push(new HeaderViewElement());
            const origFullRange = new lineRange_1.LineRange(Math.max(1, g[0].original.startLineNumber - viewElementGroupLineMargin), Math.min(g[g.length - 1].original.endLineNumberExclusive + viewElementGroupLineMargin, originalLineCount + 1));
            const modifiedFullRange = new lineRange_1.LineRange(Math.max(1, g[0].modified.startLineNumber - viewElementGroupLineMargin), Math.min(g[g.length - 1].modified.endLineNumberExclusive + viewElementGroupLineMargin, modifiedLineCount + 1));
            (0, arrays_1.forEachAdjacent)(g, (a, b) => {
                const origRange = new lineRange_1.LineRange(a ? a.original.endLineNumberExclusive : origFullRange.startLineNumber, b ? b.original.startLineNumber : origFullRange.endLineNumberExclusive);
                const modifiedRange = new lineRange_1.LineRange(a ? a.modified.endLineNumberExclusive : modifiedFullRange.startLineNumber, b ? b.modified.startLineNumber : modifiedFullRange.endLineNumberExclusive);
                origRange.forEach(origLineNumber => {
                    viewElements.push(new UnchangedLineViewElement(origLineNumber, modifiedRange.startLineNumber + (origLineNumber - origRange.startLineNumber)));
                });
                if (b) {
                    b.original.forEach(origLineNumber => {
                        viewElements.push(new DeletedLineViewElement(b, origLineNumber));
                    });
                    b.modified.forEach(modifiedLineNumber => {
                        viewElements.push(new AddedLineViewElement(b, modifiedLineNumber));
                    });
                }
            });
            const modifiedRange = g[0].modified.join(g[g.length - 1].modified);
            const originalRange = g[0].original.join(g[g.length - 1].original);
            result.push(new ViewElementGroup(new rangeMapping_1.LineRangeMapping(modifiedRange, originalRange), viewElements));
        }
        return result;
    }
    var LineType;
    (function (LineType) {
        LineType[LineType["Header"] = 0] = "Header";
        LineType[LineType["Unchanged"] = 1] = "Unchanged";
        LineType[LineType["Deleted"] = 2] = "Deleted";
        LineType[LineType["Added"] = 3] = "Added";
    })(LineType || (LineType = {}));
    class ViewElementGroup {
        constructor(range, lines) {
            this.range = range;
            this.lines = lines;
        }
    }
    class HeaderViewElement {
        constructor() {
            this.type = LineType.Header;
        }
    }
    class DeletedLineViewElement {
        constructor(diff, originalLineNumber) {
            this.diff = diff;
            this.originalLineNumber = originalLineNumber;
            this.type = LineType.Deleted;
            this.modifiedLineNumber = undefined;
        }
    }
    class AddedLineViewElement {
        constructor(diff, modifiedLineNumber) {
            this.diff = diff;
            this.modifiedLineNumber = modifiedLineNumber;
            this.type = LineType.Added;
            this.originalLineNumber = undefined;
        }
    }
    class UnchangedLineViewElement {
        constructor(originalLineNumber, modifiedLineNumber) {
            this.originalLineNumber = originalLineNumber;
            this.modifiedLineNumber = modifiedLineNumber;
            this.type = LineType.Unchanged;
        }
    }
    let View = class View extends lifecycle_1.Disposable {
        constructor(_element, _model, _width, _height, _models, _languageService) {
            super();
            this._element = _element;
            this._model = _model;
            this._width = _width;
            this._height = _height;
            this._models = _models;
            this._languageService = _languageService;
            this.domNode = this._element;
            this.domNode.className = 'monaco-component diff-review monaco-editor-background';
            const actionBarContainer = document.createElement('div');
            actionBarContainer.className = 'diff-review-actions';
            this._actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update actions */
                this._actionBar.clear();
                if (this._model.canClose.read(reader)) {
                    this._actionBar.push(new actions_1.Action('diffreview.close', (0, nls_1.localize)('label.close', "Close"), 'close-diff-review ' + themables_1.ThemeIcon.asClassName(accessibleDiffViewerCloseIcon), true, async () => _model.close()), { label: false, icon: true });
                }
            }));
            this._content = document.createElement('div');
            this._content.className = 'diff-review-content';
            this._content.setAttribute('role', 'code');
            this._scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this._content, {}));
            (0, dom_1.reset)(this.domNode, this._scrollbar.getDomNode(), actionBarContainer);
            this._register((0, observable_1.autorun)(r => {
                this._height.read(r);
                this._width.read(r);
                this._scrollbar.scanDomNode();
            }));
            this._register((0, lifecycle_1.toDisposable)(() => { (0, dom_1.reset)(this.domNode); }));
            this._register((0, utils_1.applyStyle)(this.domNode, { width: this._width, height: this._height }));
            this._register((0, utils_1.applyStyle)(this._content, { width: this._width, height: this._height }));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description render */
                this._model.currentGroup.read(reader);
                this._render(store);
            }));
            // TODO@hediet use commands
            this._register((0, dom_1.addStandardDisposableListener)(this.domNode, 'keydown', (e) => {
                if (e.equals(18 /* KeyCode.DownArrow */)
                    || e.equals(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */)
                    || e.equals(512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */)) {
                    e.preventDefault();
                    this._model.goToNextLine();
                }
                if (e.equals(16 /* KeyCode.UpArrow */)
                    || e.equals(2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */)
                    || e.equals(512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */)) {
                    e.preventDefault();
                    this._model.goToPreviousLine();
                }
                if (e.equals(9 /* KeyCode.Escape */)
                    || e.equals(2048 /* KeyMod.CtrlCmd */ | 9 /* KeyCode.Escape */)
                    || e.equals(512 /* KeyMod.Alt */ | 9 /* KeyCode.Escape */)
                    || e.equals(1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */)) {
                    e.preventDefault();
                    this._model.close();
                }
                if (e.equals(10 /* KeyCode.Space */)
                    || e.equals(3 /* KeyCode.Enter */)) {
                    e.preventDefault();
                    this._model.revealCurrentElementInEditor();
                }
            }));
        }
        _render(store) {
            const originalOptions = this._models.getOriginalOptions();
            const modifiedOptions = this._models.getModifiedOptions();
            const container = document.createElement('div');
            container.className = 'diff-review-table';
            container.setAttribute('role', 'list');
            container.setAttribute('aria-label', (0, nls_1.localize)('ariaLabel', 'Accessible Diff Viewer. Use arrow up and down to navigate.'));
            (0, domFontInfo_1.applyFontInfo)(container, modifiedOptions.get(50 /* EditorOption.fontInfo */));
            (0, dom_1.reset)(this._content, container);
            const originalModel = this._models.getOriginalModel();
            const modifiedModel = this._models.getModifiedModel();
            if (!originalModel || !modifiedModel) {
                return;
            }
            const originalModelOpts = originalModel.getOptions();
            const modifiedModelOpts = modifiedModel.getOptions();
            const lineHeight = modifiedOptions.get(67 /* EditorOption.lineHeight */);
            const group = this._model.currentGroup.get();
            for (const viewItem of group?.lines || []) {
                if (!group) {
                    break;
                }
                let row;
                if (viewItem.type === LineType.Header) {
                    const header = document.createElement('div');
                    header.className = 'diff-review-row';
                    header.setAttribute('role', 'listitem');
                    const r = group.range;
                    const diffIndex = this._model.currentGroupIndex.get();
                    const diffsLength = this._model.groups.get().length;
                    const getAriaLines = (lines) => lines === 0 ? (0, nls_1.localize)('no_lines_changed', "no lines changed")
                        : lines === 1 ? (0, nls_1.localize)('one_line_changed', "1 line changed")
                            : (0, nls_1.localize)('more_lines_changed', "{0} lines changed", lines);
                    const originalChangedLinesCntAria = getAriaLines(r.original.length);
                    const modifiedChangedLinesCntAria = getAriaLines(r.modified.length);
                    header.setAttribute('aria-label', (0, nls_1.localize)({
                        key: 'header',
                        comment: [
                            'This is the ARIA label for a git diff header.',
                            'A git diff header looks like this: @@ -154,12 +159,39 @@.',
                            'That encodes that at original line 154 (which is now line 159), 12 lines were removed/changed with 39 lines.',
                            'Variables 0 and 1 refer to the diff index out of total number of diffs.',
                            'Variables 2 and 4 will be numbers (a line number).',
                            'Variables 3 and 5 will be "no lines changed", "1 line changed" or "X lines changed", localized separately.'
                        ]
                    }, "Difference {0} of {1}: original line {2}, {3}, modified line {4}, {5}", (diffIndex + 1), diffsLength, r.original.startLineNumber, originalChangedLinesCntAria, r.modified.startLineNumber, modifiedChangedLinesCntAria));
                    const cell = document.createElement('div');
                    cell.className = 'diff-review-cell diff-review-summary';
                    // e.g.: `1/10: @@ -504,7 +517,7 @@`
                    cell.appendChild(document.createTextNode(`${diffIndex + 1}/${diffsLength}: @@ -${r.original.startLineNumber},${r.original.length} +${r.modified.startLineNumber},${r.modified.length} @@`));
                    header.appendChild(cell);
                    row = header;
                }
                else {
                    row = this._createRow(viewItem, lineHeight, this._width.get(), originalOptions, originalModel, originalModelOpts, modifiedOptions, modifiedModel, modifiedModelOpts);
                }
                container.appendChild(row);
                const isSelectedObs = (0, observable_1.derived)(reader => /** @description isSelected */ this._model.currentElement.read(reader) === viewItem);
                store.add((0, observable_1.autorun)(reader => {
                    /** @description update tab index */
                    const isSelected = isSelectedObs.read(reader);
                    row.tabIndex = isSelected ? 0 : -1;
                    if (isSelected) {
                        row.focus();
                    }
                }));
                store.add((0, dom_1.addDisposableListener)(row, 'focus', () => {
                    this._model.goToLine(viewItem);
                }));
            }
            this._scrollbar.scanDomNode();
        }
        _createRow(item, lineHeight, width, originalOptions, originalModel, originalModelOpts, modifiedOptions, modifiedModel, modifiedModelOpts) {
            const originalLayoutInfo = originalOptions.get(145 /* EditorOption.layoutInfo */);
            const originalLineNumbersWidth = originalLayoutInfo.glyphMarginWidth + originalLayoutInfo.lineNumbersWidth;
            const modifiedLayoutInfo = modifiedOptions.get(145 /* EditorOption.layoutInfo */);
            const modifiedLineNumbersWidth = 10 + modifiedLayoutInfo.glyphMarginWidth + modifiedLayoutInfo.lineNumbersWidth;
            let rowClassName = 'diff-review-row';
            let lineNumbersExtraClassName = '';
            const spacerClassName = 'diff-review-spacer';
            let spacerIcon = null;
            switch (item.type) {
                case LineType.Added:
                    rowClassName = 'diff-review-row line-insert';
                    lineNumbersExtraClassName = ' char-insert';
                    spacerIcon = accessibleDiffViewerInsertIcon;
                    break;
                case LineType.Deleted:
                    rowClassName = 'diff-review-row line-delete';
                    lineNumbersExtraClassName = ' char-delete';
                    spacerIcon = accessibleDiffViewerRemoveIcon;
                    break;
            }
            const row = document.createElement('div');
            row.style.minWidth = width + 'px';
            row.className = rowClassName;
            row.setAttribute('role', 'listitem');
            row.ariaLevel = '';
            const cell = document.createElement('div');
            cell.className = 'diff-review-cell';
            cell.style.height = `${lineHeight}px`;
            row.appendChild(cell);
            const originalLineNumber = document.createElement('span');
            originalLineNumber.style.width = (originalLineNumbersWidth + 'px');
            originalLineNumber.style.minWidth = (originalLineNumbersWidth + 'px');
            originalLineNumber.className = 'diff-review-line-number' + lineNumbersExtraClassName;
            if (item.originalLineNumber !== undefined) {
                originalLineNumber.appendChild(document.createTextNode(String(item.originalLineNumber)));
            }
            else {
                originalLineNumber.innerText = '\u00a0';
            }
            cell.appendChild(originalLineNumber);
            const modifiedLineNumber = document.createElement('span');
            modifiedLineNumber.style.width = (modifiedLineNumbersWidth + 'px');
            modifiedLineNumber.style.minWidth = (modifiedLineNumbersWidth + 'px');
            modifiedLineNumber.style.paddingRight = '10px';
            modifiedLineNumber.className = 'diff-review-line-number' + lineNumbersExtraClassName;
            if (item.modifiedLineNumber !== undefined) {
                modifiedLineNumber.appendChild(document.createTextNode(String(item.modifiedLineNumber)));
            }
            else {
                modifiedLineNumber.innerText = '\u00a0';
            }
            cell.appendChild(modifiedLineNumber);
            const spacer = document.createElement('span');
            spacer.className = spacerClassName;
            if (spacerIcon) {
                const spacerCodicon = document.createElement('span');
                spacerCodicon.className = themables_1.ThemeIcon.asClassName(spacerIcon);
                spacerCodicon.innerText = '\u00a0\u00a0';
                spacer.appendChild(spacerCodicon);
            }
            else {
                spacer.innerText = '\u00a0\u00a0';
            }
            cell.appendChild(spacer);
            let lineContent;
            if (item.modifiedLineNumber !== undefined) {
                let html = this._getLineHtml(modifiedModel, modifiedOptions, modifiedModelOpts.tabSize, item.modifiedLineNumber, this._languageService.languageIdCodec);
                if (AccessibleDiffViewer._ttPolicy) {
                    html = AccessibleDiffViewer._ttPolicy.createHTML(html);
                }
                cell.insertAdjacentHTML('beforeend', html);
                lineContent = modifiedModel.getLineContent(item.modifiedLineNumber);
            }
            else {
                let html = this._getLineHtml(originalModel, originalOptions, originalModelOpts.tabSize, item.originalLineNumber, this._languageService.languageIdCodec);
                if (AccessibleDiffViewer._ttPolicy) {
                    html = AccessibleDiffViewer._ttPolicy.createHTML(html);
                }
                cell.insertAdjacentHTML('beforeend', html);
                lineContent = originalModel.getLineContent(item.originalLineNumber);
            }
            if (lineContent.length === 0) {
                lineContent = (0, nls_1.localize)('blankLine', "blank");
            }
            let ariaLabel = '';
            switch (item.type) {
                case LineType.Unchanged:
                    if (item.originalLineNumber === item.modifiedLineNumber) {
                        ariaLabel = (0, nls_1.localize)({ key: 'unchangedLine', comment: ['The placeholders are contents of the line and should not be translated.'] }, "{0} unchanged line {1}", lineContent, item.originalLineNumber);
                    }
                    else {
                        ariaLabel = (0, nls_1.localize)('equalLine', "{0} original line {1} modified line {2}", lineContent, item.originalLineNumber, item.modifiedLineNumber);
                    }
                    break;
                case LineType.Added:
                    ariaLabel = (0, nls_1.localize)('insertLine', "+ {0} modified line {1}", lineContent, item.modifiedLineNumber);
                    break;
                case LineType.Deleted:
                    ariaLabel = (0, nls_1.localize)('deleteLine', "- {0} original line {1}", lineContent, item.originalLineNumber);
                    break;
            }
            row.setAttribute('aria-label', ariaLabel);
            return row;
        }
        _getLineHtml(model, options, tabSize, lineNumber, languageIdCodec) {
            const lineContent = model.getLineContent(lineNumber);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const lineTokens = lineTokens_1.LineTokens.createEmpty(lineContent, languageIdCodec);
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(lineContent, model.mightContainNonBasicASCII());
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, model.mightContainRTL());
            const r = (0, viewLineRenderer_1.renderViewLine2)(new viewLineRenderer_1.RenderLineInput((fontInfo.isMonospace && !options.get(33 /* EditorOption.disableMonospaceOptimizations */)), fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, [], tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, options.get(117 /* EditorOption.stopRenderingLineAfter */), options.get(99 /* EditorOption.renderWhitespace */), options.get(94 /* EditorOption.renderControlCharacters */), options.get(51 /* EditorOption.fontLigatures */) !== editorOptions_1.EditorFontLigatures.OFF, null));
            return r.html;
        }
    };
    View = __decorate([
        __param(5, language_1.ILanguageService)
    ], View);
    class AccessibleDiffViewerModelFromEditors {
        constructor(editors) {
            this.editors = editors;
        }
        getOriginalModel() {
            return this.editors.original.getModel();
        }
        getOriginalOptions() {
            return this.editors.original.getOptions();
        }
        originalReveal(range) {
            this.editors.original.revealRange(range);
            this.editors.original.setSelection(range);
            this.editors.original.focus();
        }
        getModifiedModel() {
            return this.editors.modified.getModel();
        }
        getModifiedOptions() {
            return this.editors.modified.getOptions();
        }
        modifiedReveal(range) {
            if (range) {
                this.editors.modified.revealRange(range);
                this.editors.modified.setSelection(range);
            }
            this.editors.modified.focus();
        }
        modifiedSetSelection(range) {
            this.editors.modified.setSelection(range);
        }
        modifiedFocus() {
            this.editors.modified.focus();
        }
        getModifiedPosition() {
            return this.editors.modified.getPosition() ?? undefined;
        }
    }
    exports.AccessibleDiffViewerModelFromEditors = AccessibleDiffViewerModelFromEditors;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZURpZmZWaWV3ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21wb25lbnRzL2FjY2Vzc2libGVEaWZmVmlld2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtDaEcsTUFBTSw4QkFBOEIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsb0JBQW9CLEVBQUUsa0JBQU8sQ0FBQyxHQUFHLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO0lBQ3JMLE1BQU0sOEJBQThCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG9CQUFvQixFQUFFLGtCQUFPLENBQUMsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLGdEQUFnRCxDQUFDLENBQUMsQ0FBQztJQUN4TCxNQUFNLDZCQUE2QixHQUFHLElBQUEsMkJBQVksRUFBQyxtQkFBbUIsRUFBRSxrQkFBTyxDQUFDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDLENBQUM7SUF1QjVLLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7aUJBQ3JDLGNBQVMsR0FBRyxJQUFBLHVDQUF3QixFQUFDLFlBQVksRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLEFBQXpFLENBQTBFO1FBRWpHLFlBQ2tCLFdBQXdCLEVBQ3hCLFFBQThCLEVBQzlCLFdBQXFFLEVBQ3JFLFNBQStCLEVBQy9CLE1BQTJCLEVBQzNCLE9BQTRCLEVBQzVCLE1BQTJELEVBQzNELE9BQW1DLEVBQzdCLHFCQUE2RDtZQUVwRixLQUFL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