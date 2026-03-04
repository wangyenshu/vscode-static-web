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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/workbench/browser/parts/editor/multiEditorTabsControl", "vs/workbench/browser/parts/editor/singleEditorTabsControl", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/multiRowEditorTabsControl", "vs/workbench/browser/parts/editor/noEditorTabsControl", "vs/css!./media/editortitlecontrol"], function (require, exports, dom_1, instantiation_1, themeService_1, breadcrumbsControl_1, multiEditorTabsControl_1, singleEditorTabsControl_1, lifecycle_1, multiRowEditorTabsControl_1, noEditorTabsControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorTitleControl = void 0;
    let EditorTitleControl = class EditorTitleControl extends themeService_1.Themable {
        get breadcrumbsControl() { return this.breadcrumbsControlFactory?.control; }
        constructor(parent, editorPartsView, groupsView, groupView, model, instantiationService, themeService) {
            super(themeService);
            this.parent = parent;
            this.editorPartsView = editorPartsView;
            this.groupsView = groupsView;
            this.groupView = groupView;
            this.model = model;
            this.instantiationService = instantiationService;
            this.editorTabsControlDisposable = this._register(new lifecycle_1.DisposableStore());
            this.breadcrumbsControlDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorTabsControl = this.createEditorTabsControl();
            this.breadcrumbsControlFactory = this.createBreadcrumbsControl();
        }
        createEditorTabsControl() {
            let tabsControlType;
            switch (this.groupsView.partOptions.showTabs) {
                case 'none':
                    tabsControlType = noEditorTabsControl_1.NoEditorTabsControl;
                    break;
                case 'single':
                    tabsControlType = singleEditorTabsControl_1.SingleEditorTabsControl;
                    break;
                case 'multiple':
                default:
                    tabsControlType = this.groupsView.partOptions.pinnedTabsOnSeparateRow ? multiRowEditorTabsControl_1.MultiRowEditorControl : multiEditorTabsControl_1.MultiEditorTabsControl;
                    break;
            }
            const control = this.instantiationService.createInstance(tabsControlType, this.parent, this.editorPartsView, this.groupsView, this.groupView, this.model);
            return this.editorTabsControlDisposable.add(control);
        }
        createBreadcrumbsControl() {
            if (this.groupsView.partOptions.showTabs === 'single') {
                return undefined; // Single tabs have breadcrumbs inlined. No tabs have no breadcrumbs.
            }
            // Breadcrumbs container
            const breadcrumbsContainer = document.createElement('div');
            breadcrumbsContainer.classList.add('breadcrumbs-below-tabs');
            this.parent.appendChild(breadcrumbsContainer);
            const breadcrumbsControlFactory = this.breadcrumbsControlDisposables.add(this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControlFactory, breadcrumbsContainer, this.groupView, {
                showFileIcons: true,
                showSymbolIcons: true,
                showDecorationColors: false,
                showPlaceholder: true
            }));
            // Breadcrumbs enablement & visibility change have an impact on layout
            // so we need to relayout the editor group when that happens.
            this.breadcrumbsControlDisposables.add(breadcrumbsControlFactory.onDidEnablementChange(() => this.groupView.relayout()));
            this.breadcrumbsControlDisposables.add(breadcrumbsControlFactory.onDidVisibilityChange(() => this.groupView.relayout()));
            return breadcrumbsControlFactory;
        }
        openEditor(editor, options) {
            const didChange = this.editorTabsControl.openEditor(editor, options);
            this.handleOpenedEditors(didChange);
        }
        openEditors(editors) {
            const didChange = this.editorTabsControl.openEditors(editors);
            this.handleOpenedEditors(didChange);
        }
        handleOpenedEditors(didChange) {
            if (didChange) {
                this.breadcrumbsControl?.update();
            }
            else {
                this.breadcrumbsControl?.revealLast();
            }
        }
        beforeCloseEditor(editor) {
            return this.editorTabsControl.beforeCloseEditor(editor);
        }
        closeEditor(editor) {
            this.editorTabsControl.closeEditor(editor);
            this.handleClosedEditors();
        }
        closeEditors(editors) {
            this.editorTabsControl.closeEditors(editors);
            this.handleClosedEditors();
        }
        handleClosedEditors() {
            if (!this.groupView.activeEditor) {
                this.breadcrumbsControl?.update();
            }
        }
        moveEditor(editor, fromIndex, targetIndex, stickyStateChange) {
            return this.editorTabsControl.moveEditor(editor, fromIndex, targetIndex, stickyStateChange);
        }
        pinEditor(editor) {
            return this.editorTabsControl.pinEditor(editor);
        }
        stickEditor(editor) {
            return this.editorTabsControl.stickEditor(editor);
        }
        unstickEditor(editor) {
            return this.editorTabsControl.unstickEditor(editor);
        }
        setActive(isActive) {
            return this.editorTabsControl.setActive(isActive);
        }
        updateEditorLabel(editor) {
            return this.editorTabsControl.updateEditorLabel(editor);
        }
        updateEditorDirty(editor) {
            return this.editorTabsControl.updateEditorDirty(editor);
        }
        updateOptions(oldOptions, newOptions) {
            // Update editor tabs control if options changed
            if (oldOptions.showTabs !== newOptions.showTabs ||
                (newOptions.showTabs !== 'single' && oldOptions.pinnedTabsOnSeparateRow !== newOptions.pinnedTabsOnSeparateRow)) {
                // Clear old
                this.editorTabsControlDisposable.clear();
                this.breadcrumbsControlDisposables.clear();
                (0, dom_1.clearNode)(this.parent);
                // Create new
                this.editorTabsControl = this.createEditorTabsControl();
                this.breadcrumbsControlFactory = this.createBreadcrumbsControl();
            }
            // Forward into editor tabs control
            else {
                this.editorTabsControl.updateOptions(oldOptions, newOptions);
            }
        }
        layout(dimensions) {
            // Layout tabs control
            const tabsControlDimension = this.editorTabsControl.layout(dimensions);
            // Layout breadcrumbs if visible
            let breadcrumbsControlDimension = undefined;
            if (this.breadcrumbsControl?.isHidden() === false) {
                breadcrumbsControlDimension = new dom_1.Dimension(dimensions.container.width, breadcrumbsControl_1.BreadcrumbsControl.HEIGHT);
                this.breadcrumbsControl.layout(breadcrumbsControlDimension);
            }
            return new dom_1.Dimension(dimensions.container.width, tabsControlDimension.height + (breadcrumbsControlDimension ? breadcrumbsControlDimension.height : 0));
        }
        getHeight() {
            const tabsControlHeight = this.editorTabsControl.getHeight();
            const breadcrumbsControlHeight = this.breadcrumbsControl?.isHidden() === false ? breadcrumbsControl_1.BreadcrumbsControl.HEIGHT : 0;
            return {
                total: tabsControlHeight + breadcrumbsControlHeight,
                offset: tabsControlHeight
            };
        }
    };
    exports.EditorTitleControl = EditorTitleControl;
    exports.EditorTitleControl = EditorTitleControl = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService)
    ], EditorTitleControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yVGl0bGVDb250cm9sLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvclRpdGxlQ29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ3pGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsdUJBQVE7UUFPL0MsSUFBWSxrQkFBa0IsS0FBSyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRXBGLFlBQ2tCLE1BQW1CLEVBQ25CLGVBQWlDLEVBQ2pDLFVBQTZCLEVBQzdCLFNBQTJCLEVBQzNCLEtBQWdDLEVBQzFCLG9CQUFtRCxFQUMzRCxZQUEyQjtZQUUxQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFSSCxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ25CLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNqQyxlQUFVLEdBQVYsVUFBVSxDQUFtQjtZQUM3QixjQUFTLEdBQVQsU0FBUyxDQUFrQjtZQUMzQixVQUFLLEdBQUwsS0FBSyxDQUEyQjtZQUNsQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBWjFELGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUdwRSxrQ0FBNkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFjdEYsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ3hELElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNsRSxDQUFDO1FBRU8s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