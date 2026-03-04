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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/baseCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/editor/common/services/resolverService", "vs/platform/undoRedo/common/undoRedo", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/notebook/browser/notebookViewEvents"], function (require, exports, event_1, UUID, configuration_1, notebookBrowser_1, baseCellViewModel_1, notebookCommon_1, resolverService_1, undoRedo_1, codeEditorService_1, notebookViewEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkupCellViewModel = void 0;
    let MarkupCellViewModel = class MarkupCellViewModel extends baseCellViewModel_1.BaseCellViewModel {
        get renderedHtml() { return this._renderedHtml; }
        set renderedHtml(value) {
            if (this._renderedHtml !== value) {
                this._renderedHtml = value;
                this._onDidChangeState.fire({ contentChanged: true });
            }
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        set renderedMarkdownHeight(newHeight) {
            this._previewHeight = newHeight;
            this._updateTotalHeight(this._computeTotalHeight());
        }
        set chatHeight(newHeight) {
            this._chatHeight = newHeight;
            this._updateTotalHeight(this._computeTotalHeight());
        }
        get chatHeight() {
            return this._chatHeight;
        }
        set editorHeight(newHeight) {
            this._editorHeight = newHeight;
            this._statusBarHeight = this.viewContext.notebookOptions.computeStatusBarHeight();
            this._updateTotalHeight(this._computeTotalHeight());
        }
        get editorHeight() {
            throw new Error('MarkdownCellViewModel.editorHeight is write only');
        }
        get foldingState() {
            return this.foldingDelegate.getFoldingState(this.foldingDelegate.getCellIndex(this));
        }
        get outputIsHovered() {
            return this._hoveringOutput;
        }
        set outputIsHovered(v) {
            this._hoveringOutput = v;
        }
        get outputIsFocused() {
            return this._focusOnOutput;
        }
        set outputIsFocused(v) {
            this._focusOnOutput = v;
        }
        get inputInOutputIsFocused() {
            return false;
        }
        set inputInOutputIsFocused(_) {
            //
        }
        get cellIsHovered() {
            return this._hoveringCell;
        }
        set cellIsHovered(v) {
            this._hoveringCell = v;
            this._onDidChangeState.fire({ cellIsHoveredChanged: true });
        }
        constructor(viewType, model, initialNotebookLayoutInfo, foldingDelegate, viewContext, configurationService, textModelService, undoRedoService, codeEditorService) {
            super(viewType, model, UUID.generateUuid(), viewContext, configurationService, textModelService, undoRedoService, codeEditorService);
            this.foldingDelegate = foldingDelegate;
            this.viewContext = viewContext;
            this.cellKind = notebookCommon_1.CellKind.Markup;
            this._previewHeight = 0;
            this._chatHeight = 0;
            this._editorHeight = 0;
            this._statusBarHeight = 0;
            this._onDidChangeLayout = this._register(new event_1.Emitter());
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._hoveringOutput = false;
            this._focusOnOutput = false;
            this._hoveringCell = false;
            /**
             * we put outputs stuff here to make compiler happy
             */
            this.outputsViewModels = [];
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            const { bottomToolbarGap } = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            this._layoutInfo = {
                chatHeight: 0,
                editorHeight: 0,
                previewHeight: 0,
                fontInfo: initialNotebookLayoutInfo?.fontInfo || null,
                editorWidth: initialNotebookLayoutInfo?.width
                    ? this.viewContext.notebookOptions.computeMarkdownCellEditorWidth(initialNotebookLayoutInfo.width)
                    : 0,
                bottomToolbarOffset: bottomToolbarGap,
                totalHeight: 100,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized,
                foldHintHeight: 0,
                statusBarHeight: 0
            };
            this._register(this.onDidChangeState(e => {
                this.viewContext.eventDispatcher.emit([new notebookViewEvents_1.NotebookCellStateChangedEvent(e, this.model)]);
                if (e.foldingStateChanged) {
                    this._updateTotalHeight(this._computeTotalHeight(), notebookBrowser_1.CellLayoutContext.Fold);
                }
            }));
        }
        _computeTotalHeight() {
            const layoutConfiguration = this.viewContext.notebookOptions.getLayoutConfiguration();
            const { bottomToolbarGap } = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            const foldHintHeight = this._computeFoldHintHeight();
            if (this.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                return this._editorHeight
                    + layoutConfiguration.markdownCellTopMargin
                    + layoutConfiguration.markdownCellBottomMargin
                    + bottomToolbarGap
                    + this._statusBarHeight;
            }
            else {
                // @rebornix
                // On file open, the previewHeight + bottomToolbarGap for a cell out of viewport can be 0
                // When it's 0, the list view will never try to render it anymore even if we scroll the cell into view.
                // Thus we make sure it's greater than 0
                return Math.max(1, this._previewHeight + bottomToolbarGap + foldHintHeight);
            }
        }
        _computeFoldHintHeight() {
            return (this.getEditState() === notebookBrowser_1.CellEditState.Editing || this.foldingState !== 2 /* CellFoldingState.Collapsed */) ?
                0 : this.viewContext.notebookOptions.getLayoutConfiguration().markdownFoldHintHeight;
        }
        updateOptions(e) {
            if (e.cellStatusBarVisibility || e.insertToolbarPosition || e.cellToolbarLocation) {
                this._updateTotalHeight(this._computeTotalHeight());
            }
        }
        getOutputOffset(index) {
            // throw new Error('Method not implemented.');
            return -1;
        }
        updateOutputHeight(index, height) {
            // throw new Error('Method not implemented.');
        }
        triggerFoldingStateChange() {
            this._onDidChangeState.fire({ foldingStateChanged: true });
        }
        _updateTotalHeight(newHeight, context) {
            if (newHeight !== this.layoutInfo.totalHeight) {
                this.layoutChange({ totalHeight: newHeight, context });
            }
        }
        layoutChange(state) {
            // recompute
            const foldHintHeight = this._computeFoldHintHeight();
            if (!this.isInputCollapsed) {
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeMarkdownCellEditorWidth(state.outerWidth)
                    : this._layoutInfo.editorWidth;
                const totalHeight = state.totalHeight === undefined
                    ? (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized ? 100 : this._layoutInfo.totalHeight)
                    : state.totalHeight;
                const previewHeight = this._previewHeight;
                this._layoutInfo = {
                    fontInfo: state.font || this._layoutInfo.fontInfo,
                    editorWidth,
                    previewHeight,
                    chatHeight: this._chatHeight,
                    editorHeight: this._editorHeight,
                    statusBarHeight: this._statusBarHeight,
                    bottomToolbarOffset: this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType),
                    totalHeight,
                    layoutState: notebookBrowser_1.CellLayoutState.Measured,
                    foldHintHeight
                };
            }
            else {
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeMarkdownCellEditorWidth(state.outerWidth)
                    : this._layoutInfo.editorWidth;
                const totalHeight = this.viewContext.notebookOptions.computeCollapsedMarkdownCellHeight(this.viewType);
                state.totalHeight = totalHeight;
                this._layoutInfo = {
                    fontInfo: state.font || this._layoutInfo.fontInfo,
                    editorWidth,
                    chatHeight: this._chatHeight,
                    editorHeight: this._editorHeight,
                    statusBarHeight: this._statusBarHeight,
                    previewHeight: this._previewHeight,
                    bottomToolbarOffset: this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType),
                    totalHeight,
                    layoutState: notebookBrowser_1.CellLayoutState.Measured,
                    foldHintHeight: 0
                };
            }
            this._onDidChangeLayout.fire(state);
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            super.restoreEditorViewState(editorViewStates);
            // we might already warmup the viewport so the cell has a total height computed
            if (totalHeight !== undefined && this.layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                this._layoutInfo = {
                    fontInfo: this._layoutInfo.fontInfo,
                    editorWidth: this._layoutInfo.editorWidth,
                    previewHeight: this._layoutInfo.previewHeight,
                    bottomToolbarOffset: this._layoutInfo.bottomToolbarOffset,
                    totalHeight: totalHeight,
                    chatHeight: this._chatHeight,
                    editorHeight: this._editorHeight,
                    statusBarHeight: this._statusBarHeight,
                    layoutState: notebookBrowser_1.CellLayoutState.FromCache,
                    foldHintHeight: this._layoutInfo.foldHintHeight
                };
                this.layoutChange({});
            }
        }
        getDynamicHeight() {
            return null;
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                return 100;
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        onDidChangeTextModelContent() {
            this._onDidChangeState.fire({ contentChanged: true });
        }
        onDeselect() {
        }
        startFind(value, options) {
            const matches = super.cellStartFind(value, options);
            if (matches === null) {
                return null;
            }
            return {
                cell: this,
                contentMatches: matches
            };
        }
        dispose() {
            super.dispose();
            this.foldingDelegate = null;
        }
    };
    exports.MarkupCellViewModel = MarkupCellViewModel;
    exports.MarkupCellViewModel = MarkupCellViewModel = __decorate([
        __param(5, configuration_1.IConfigurationService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, undoRedo_1.IUndoRedoService),
        __param(8, codeEditorService_1.ICodeEditorService)
    ], MarkupCellViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya3VwQ2VsbFZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL21hcmt1cENlbGxWaWV3TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHFDQUFpQjtRQVF6RCxJQUFXLFlBQVksS0FBeUIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUM1RSxJQUFXLFlBQVksQ0FBQyxLQUF5QjtZQUNoRCxJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2dCQUMzQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdkQsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUlELElBQUksc0JBQXNCLENBQUMsU0FBaUI7WUFDM0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7WUFDaEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUlELElBQUksVUFBVSxDQUFDLFNBQWlCO1lBQy9CLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQzdCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxJQUFJ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