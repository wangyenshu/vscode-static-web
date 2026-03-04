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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView"], function (require, exports, DOM, lifecycle_1, toolbar_1, actions_1, contextView_1, instantiation_1, cellActionView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListTopCellToolbar = void 0;
    let ListTopCellToolbar = class ListTopCellToolbar extends lifecycle_1.Disposable {
        constructor(notebookEditor, notebookOptions, instantiationService, contextMenuService, menuService) {
            super();
            this.notebookEditor = notebookEditor;
            this.notebookOptions = notebookOptions;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.viewZone = this._register(new lifecycle_1.MutableDisposable());
            this._modelDisposables = this._register(new lifecycle_1.DisposableStore());
            this.topCellToolbarContainer = DOM.$('div');
            this.topCellToolbar = DOM.$('.cell-list-top-cell-toolbar-container');
            this.topCellToolbarContainer.appendChild(this.topCellToolbar);
            this._register(this.notebookEditor.onDidAttachViewModel(() => {
                this.updateTopToolbar();
            }));
            this._register(this.notebookOptions.onDidChangeOptions(e => {
                if (e.insertToolbarAlignment || e.insertToolbarPosition || e.cellToolbarLocation) {
                    this.updateTopToolbar();
                }
            }));
        }
        updateTopToolbar() {
            const layoutInfo = this.notebookOptions.getLayoutConfiguration();
            this.viewZone.value = new lifecycle_1.DisposableStore();
            if (layoutInfo.insertToolbarPosition === 'hidden' || layoutInfo.insertToolbarPosition === 'notebookToolbar') {
                const height = this.notebookOptions.computeTopInsertToolbarHeight(this.notebookEditor.textModel?.viewType);
                if (height !== 0) {
                    // reserve whitespace to avoid overlap with cell toolbar
                    this.notebookEditor.changeViewZones(accessor => {
                        const id = accessor.addZone({
                            afterModelPosition: 0,
                            heightInPx: height,
                            domNode: DOM.$('div')
                        });
                        accessor.layoutZone(id);
                        this.viewZone.value?.add({
                            dispose: () => {
                                if (!this.notebookEditor.isDisposed) {
                                    this.notebookEditor.changeViewZones(accessor => {
                                        accessor.removeZone(id);
                                    });
                                }
                            }
                        });
                    });
                }
                return;
            }
            this.notebookEditor.changeViewZones(accessor => {
                const height = this.notebookOptions.computeTopInsertToolbarHeight(this.notebookEditor.textModel?.viewType);
                const id = accessor.addZone({
                    afterModelPosition: 0,
                    heightInPx: height,
                    domNode: this.topCellToolbarContainer
                });
                accessor.layoutZone(id);
                this.viewZone.value?.add({
                    dispose: () => {
                        if (!this.notebookEditor.isDisposed) {
                            this.notebookEditor.changeViewZones(accessor => {
                                accessor.removeZone(id);
                            });
                        }
                    }
                });
                DOM.clearNode(this.topCellToolbar);
                const toolbar = this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this.topCellToolbar, this.notebookEditor.creationOptions.menuIds.cellTopInsertToolbar, {
                    actionViewItemProvider: (action, options) => {
                        if (action instanceof actions_1.MenuItemAction) {
                            const item = this.instantiationService.createInstance(cellActionView_1.CodiconActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                            return item;
                        }
                        return undefined;
                    },
                    menuOptions: {
                        shouldForwardArgs: true
                    },
                    toolbarOptions: {
                        primaryGroup: (g) => /^inline/.test(g),
                    },
                    hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */,
                });
                toolbar.context = {
                    notebookEditor: this.notebookEditor
                };
                this.viewZone.value?.add(toolbar);
                // update toolbar container css based on cell list length
                this.viewZone.value?.add(this.notebookEditor.onDidChangeModel(() => {
                    this._modelDisposables.clear();
                    if (this.notebookEditor.hasModel()) {
                        this._modelDisposables.add(this.notebookEditor.onDidChangeViewCells(() => {
                            this.updateClass();
                        }));
                        this.updateClass();
                    }
                }));
                this.updateClass();
            });
        }
        updateClass() {
            if (this.notebookEditor.hasModel() && this.notebookEditor.getLength() === 0) {
                this.topCellToolbar.classList.add('emptyNotebook');
            }
            else {
                this.topCellToolbar.classList.remove('emptyNotebook');
            }
        }
    };
    exports.ListTopCellToolbar = ListTopCellToolbar;
    exports.ListTopCellToolbar = ListTopCellToolbar = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, actions_1.IMenuService)
    ], ListTopCellToolbar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tUb3BDZWxsVG9vbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld1BhcnRzL25vdGVib29rVG9wQ2VsbFRvb2xiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUFLakQsWUFDb0IsY0FBdUMsRUFDekMsZUFBZ0MsRUFDMUIsb0JBQThELEVBQ2hFLGtCQUEwRCxFQUNqRSxXQUE0QztZQUUxRCxLQUFLLEVBQUUsQ0FBQztZQU5XLG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUN6QyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDUCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFQMUMsYUFBUSxHQUF1QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQVUxRSxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsdUNBQXVDLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFj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