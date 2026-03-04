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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/multiEditorTabsControl", "vs/base/common/lifecycle", "vs/workbench/common/editor/filteredEditorGroupModel"], function (require, exports, dom_1, instantiation_1, multiEditorTabsControl_1, lifecycle_1, filteredEditorGroupModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiRowEditorControl = void 0;
    let MultiRowEditorControl = class MultiRowEditorControl extends lifecycle_1.Disposable {
        constructor(parent, editorPartsView, groupsView, groupView, model, instantiationService) {
            super();
            this.parent = parent;
            this.groupsView = groupsView;
            this.groupView = groupView;
            this.model = model;
            this.instantiationService = instantiationService;
            const stickyModel = this._register(new filteredEditorGroupModel_1.StickyEditorGroupModel(this.model));
            const unstickyModel = this._register(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(this.model));
            this.stickyEditorTabsControl = this._register(this.instantiationService.createInstance(multiEditorTabsControl_1.MultiEditorTabsControl, this.parent, editorPartsView, this.groupsView, this.groupView, stickyModel));
            this.unstickyEditorTabsControl = this._register(this.instantiationService.createInstance(multiEditorTabsControl_1.MultiEditorTabsControl, this.parent, editorPartsView, this.groupsView, this.groupView, unstickyModel));
            this.handlePinnedTabsLayoutChange();
        }
        handlePinnedTabsLayoutChange() {
            if (this.groupView.count === 0) {
                // Do nothing as no tab bar is visible
                return;
            }
            const hadTwoTabBars = this.parent.classList.contains('two-tab-bars');
            const hasTwoTabBars = this.groupView.count !== this.groupView.stickyCount && this.groupView.stickyCount > 0;
            // Ensure action toolbar is only visible once
            this.parent.classList.toggle('two-tab-bars', hasTwoTabBars);
            if (hadTwoTabBars !== hasTwoTabBars) {
                this.groupView.relayout();
            }
        }
        getEditorTabsController(editor) {
            return this.model.isSticky(editor) ? this.stickyEditorTabsControl : this.unstickyEditorTabsControl;
        }
        openEditor(editor, options) {
            const [editorTabController, otherTabController] = this.model.isSticky(editor) ? [this.stickyEditorTabsControl, this.unstickyEditorTabsControl] : [this.unstickyEditorTabsControl, this.stickyEditorTabsControl];
            const didChange = editorTabController.openEditor(editor, options);
            if (didChange) {
                // HACK: To render all editor tabs on startup, otherwise only one row gets rendered
                otherTabController.openEditors([]);
                this.handleOpenedEditors();
            }
            return didChange;
        }
        openEditors(editors) {
            const stickyEditors = editors.filter(e => this.model.isSticky(e));
            const unstickyEditors = editors.filter(e => !this.model.isSticky(e));
            const didChangeOpenEditorsSticky = this.stickyEditorTabsControl.openEditors(stickyEditors);
            const didChangeOpenEditorsUnSticky = this.unstickyEditorTabsControl.openEditors(unstickyEditors);
            const didChange = didChangeOpenEditorsSticky || didChangeOpenEditorsUnSticky;
            if (didChange) {
                this.handleOpenedEditors();
            }
            return didChange;
        }
        handleOpenedEditors() {
            this.handlePinnedTabsLayoutChange();
        }
        beforeCloseEditor(editor) {
            this.getEditorTabsController(editor).beforeCloseEditor(editor);
        }
        closeEditor(editor) {
            // Has to be called on both tab bars as the editor could be either sticky or not
            this.stickyEditorTabsControl.closeEditor(editor);
            this.unstickyEditorTabsControl.closeEditor(editor);
            this.handleClosedEditors();
        }
        closeEditors(editors) {
            const stickyEditors = editors.filter(e => this.model.isSticky(e));
            const unstickyEditors = editors.filter(e => !this.model.isSticky(e));
            this.stickyEditorTabsControl.closeEditors(stickyEditors);
            this.unstickyEditorTabsControl.closeEditors(unstickyEditors);
            this.handleClosedEditors();
        }
        handleClosedEditors() {
            this.handlePinnedTabsLayoutChange();
        }
        moveEditor(editor, fromIndex, targetIndex, stickyStateChange) {
            if (stickyStateChange) {
                // If sticky state changes, move editor between tab bars
                if (this.model.isSticky(editor)) {
                    this.stickyEditorTabsControl.openEditor(editor);
                    this.unstickyEditorTabsControl.closeEditor(editor);
                }
                else {
                    this.stickyEditorTabsControl.closeEditor(editor);
                    this.unstickyEditorTabsControl.openEditor(editor);
                }
                this.handlePinnedTabsLayoutChange();
            }
            else {
                if (this.model.isSticky(editor)) {
                    this.stickyEditorTabsControl.moveEditor(editor, fromIndex, targetIndex, stickyStateChange);
                }
                else {
                    this.unstickyEditorTabsControl.moveEditor(editor, fromIndex - this.model.stickyCount, targetIndex - this.model.stickyCount, stickyStateChange);
                }
            }
        }
        pinEditor(editor) {
            this.getEditorTabsController(editor).pinEditor(editor);
        }
        stickEditor(editor) {
            this.unstickyEditorTabsControl.closeEditor(editor);
            this.stickyEditorTabsControl.openEditor(editor);
            this.handlePinnedTabsLayoutChange();
        }
        unstickEditor(editor) {
            this.stickyEditorTabsControl.closeEditor(editor);
            this.unstickyEditorTabsControl.openEditor(editor);
            this.handlePinnedTabsLayoutChange();
        }
        setActive(isActive) {
            this.stickyEditorTabsControl.setActive(isActive);
            this.unstickyEditorTabsControl.setActive(isActive);
        }
        updateEditorLabel(editor) {
            this.getEditorTabsController(editor).updateEditorLabel(editor);
        }
        updateEditorDirty(editor) {
            this.getEditorTabsController(editor).updateEditorDirty(editor);
        }
        updateOptions(oldOptions, newOptions) {
            this.stickyEditorTabsControl.updateOptions(oldOptions, newOptions);
            this.unstickyEditorTabsControl.updateOptions(oldOptions, newOptions);
        }
        layout(dimensions) {
            const stickyDimensions = this.stickyEditorTabsControl.layout(dimensions);
            const unstickyAvailableDimensions = {
                container: dimensions.container,
                available: new dom_1.Dimension(dimensions.available.width, dimensions.available.height - stickyDimensions.height)
            };
            const unstickyDimensions = this.unstickyEditorTabsControl.layout(unstickyAvailableDimensions);
            return new dom_1.Dimension(dimensions.container.width, stickyDimensions.height + unstickyDimensions.height);
        }
        getHeight() {
            return this.stickyEditorTabsControl.getHeight() + this.unstickyEditorTabsControl.getHeight();
        }
        dispose() {
            this.parent.classList.toggle('two-tab-bars', false);
            super.dispose();
        }
    };
    exports.MultiRowEditorControl = MultiRowEditorControl;
    exports.MultiRowEditorControl = MultiRowEditorControl = __decorate([
        __param(5, instantiation_1.IInstantiationService)
    ], MultiRowEditorControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlSb3dFZGl0b3JUYWJzQ29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9tdWx0aVJvd0VkaXRvclRhYnNDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBS3BELFlBQ2tCLE1BQW1CLEVBQ3BDLGVBQWlDLEVBQ2hCLFVBQTZCLEVBQzdCLFNBQTJCLEVBQzNCLEtBQWdDLEVBQ1Qsb0JBQTJDO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBUFMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUVuQixlQUFVLEdBQVYsVUFBVSxDQUFtQjtZQUM3QixjQUFTLEdBQVQsU0FBUyxDQUFrQjtZQUMzQixVQUFLLEdBQUwsS0FBSyxDQUEyQjtZQUNULHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFJbkYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGlEQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxtREFBd0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUUvRSxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLCtDQUFzQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzVM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