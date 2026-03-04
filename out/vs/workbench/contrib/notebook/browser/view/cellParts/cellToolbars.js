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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/async", "vs/base/common/event", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/view/cellParts/cellToolbarStickyScroll", "vs/platform/actions/browser/toolbar", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, DOM, toolbar_1, async_1, event_1, menuEntryActionViewItem_1, actions_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, cellActionView_1, cellPart_1, cellToolbarStickyScroll_1, toolbar_2, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellTitleToolbarPart = exports.BetweenCellToolbar = void 0;
    let BetweenCellToolbar = class BetweenCellToolbar extends cellPart_1.CellOverlayPart {
        constructor(_notebookEditor, _titleToolbarContainer, _bottomCellToolbarContainer, instantiationService, contextMenuService, contextKeyService, menuService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._bottomCellToolbarContainer = _bottomCellToolbarContainer;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        _initialize() {
            if (this._betweenCellToolbar) {
                return this._betweenCellToolbar;
            }
            const betweenCellToolbar = this._register(new toolbar_1.ToolBar(this._bottomCellToolbarContainer, this.contextMenuService, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction) {
                        if (this._notebookEditor.notebookOptions.getDisplayOptions().insertToolbarAlignment === 'center') {
                            return this.instantiationService.createInstance(cellActionView_1.CodiconActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                        }
                        else {
                            return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                        }
                    }
                    return undefined;
                }
            }));
            this._betweenCellToolbar = betweenCellToolbar;
            const menu = this._register(this.menuService.createMenu(this._notebookEditor.creationOptions.menuIds.cellInsertToolbar, this.contextKeyService));
            const updateActions = () => {
                const actions = getCellToolbarActions(menu);
                betweenCellToolbar.setActions(actions.primary, actions.secondary);
            };
            this._register(menu.onDidChange(() => updateActions()));
            this._register(this._notebookEditor.notebookOptions.onDidChangeOptions((e) => {
                if (e.insertToolbarAlignment) {
                    updateActions();
                }
            }));
            updateActions();
            return betweenCellToolbar;
        }
        didRenderCell(element) {
            const betweenCellToolbar = this._initialize();
            betweenCellToolbar.context = {
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                source: 'insertToolbar',
                $mid: 13 /* MarshalledId.NotebookCellActionContext */
            };
            this.updateInternalLayoutNow(element);
        }
        updateInternalLayoutNow(element) {
            const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
            this._bottomCellToolbarContainer.style.transform = `translateY(${bottomToolbarOffset}px)`;
        }
    };
    exports.BetweenCellToolbar = BetweenCellToolbar;
    exports.BetweenCellToolbar = BetweenCellToolbar = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService)
    ], BetweenCellToolbar);
    let CellTitleToolbarPart = class CellTitleToolbarPart extends cellPart_1.CellOverlayPart {
        get hasActions() {
            if (!this._model) {
                return false;
            }
            return this._model.actions.primary.length
                + this._model.actions.secondary.length
                + this._model.deleteActions.primary.length
                + this._model.deleteActions.secondary.length
                > 0;
        }
        constructor(toolbarContainer, _rootClassDelegate, toolbarId, deleteToolbarId, _notebookEditor, contextKeyService, menuService, instantiationService) {
            super();
            this.toolbarContainer = toolbarContainer;
            this._rootClassDelegate = _rootClassDelegate;
            this.toolbarId = toolbarId;
            this.deleteToolbarId = deleteToolbarId;
            this._notebookEditor = _notebookEditor;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.instantiationService = instantiationService;
            this._onDidUpdateActions = this._register(new event_1.Emitter());
            this.onDidUpdateActions = this._onDidUpdateActions.event;
        }
        _initializeModel() {
            if (this._model) {
                return this._model;
            }
            const titleMenu = this._register(this.menuService.createMenu(this.toolbarId, this.contextKeyService));
            const deleteMenu = this._register(this.menuService.createMenu(this.deleteToolbarId, this.contextKeyService));
            const actions = getCellToolbarActions(titleMenu);
            const deleteActions = getCellToolbarActions(deleteMenu);
            this._model = {
                titleMenu,
                actions,
                deleteMenu,
                deleteActions
            };
            return this._model;
        }
        _initialize(model, element) {
            if (this._view) {
                return this._view;
            }
            const hoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            const toolbar = this._register(this.instantiationService.createInstance(toolbar_2.WorkbenchToolBar, this.toolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
                },
                renderDropdownAsChildElement: true,
                hoverDelegate
            }));
            const deleteToolbar = this._register(this.instantiationService.invokeFunction(accessor => createDeleteToolbar(accessor, this.toolbarContainer, hoverDelegate, 'cell-delete-toolbar')));
            if (model.deleteActions.primary.length !== 0 || model.deleteActions.secondary.length !== 0) {
                deleteToolbar.setActions(model.deleteActions.primary, model.deleteActions.secondary);
            }
            this.setupChangeListeners(toolbar, model.titleMenu, model.actions);
            this.setupChangeListeners(deleteToolbar, model.deleteMenu, model.deleteActions);
            this._view = {
                toolbar,
                deleteToolbar
            };
            return this._view;
        }
        prepareRenderCell(element) {
            this._initializeModel();
        }
        didRenderCell(element) {
            const model = this._initializeModel();
            const view = this._initialize(model, element);
            this.cellDisposables.add((0, cellToolbarStickyScroll_1.registerCellToolbarStickyScroll)(this._notebookEditor, element, this.toolbarContainer, { extraOffset: 4, min: -14 }));
            this.updateContext(view, {
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                source: 'cellToolbar',
                $mid: 13 /* MarshalledId.NotebookCellActionContext */
            });
        }
        updateContext(view, toolbarContext) {
            view.toolbar.context = toolbarContext;
            view.deleteToolbar.context = toolbarContext;
        }
        setupChangeListeners(toolbar, menu, initActions) {
            // #103926
            let dropdownIsVisible = false;
            let deferredUpdate;
            this.updateActions(toolbar, initActions);
            this._register(menu.onDidChange(() => {
                if (dropdownIsVisible) {
                    const actions = getCellToolbarActions(menu);
                    deferredUpdate = () => this.updateActions(toolbar, actions);
                    return;
                }
                const actions = getCellToolbarActions(menu);
                this.updateActions(toolbar, actions);
            }));
            this._rootClassDelegate.toggle('cell-toolbar-dropdown-active', false);
            this._register(toolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                this._rootClassDelegate.toggle('cell-toolbar-dropdown-active', visible);
                if (deferredUpdate && !visible) {
                    (0, async_1.disposableTimeout)(() => {
                        deferredUpdate?.();
                    }, 0, this._store);
                    deferredUpdate = undefined;
                }
            }));
        }
        updateActions(toolbar, actions) {
            const hadFocus = DOM.isAncestorOfActiveElement(toolbar.getElement());
            toolbar.setActions(actions.primary, actions.secondary);
            if (hadFocus) {
                this._notebookEditor.focus();
            }
            if (actions.primary.length || actions.secondary.length) {
                this._rootClassDelegate.toggle('cell-has-toolbar-actions', true);
                this._onDidUpdateActions.fire();
            }
            else {
                this._rootClassDelegate.toggle('cell-has-toolbar-actions', false);
                this._onDidUpdateActions.fire();
            }
        }
    };
    exports.CellTitleToolbarPart = CellTitleToolbarPart;
    exports.CellTitleToolbarPart = CellTitleToolbarPart = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService)
    ], CellTitleToolbarPart);
    function getCellToolbarActions(menu) {
        const primary = [];
        const secondary = [];
        const result = { primary, secondary };
        (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
        return result;
    }
    function createDeleteToolbar(accessor, container, hoverDelegate, elementClass) {
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const toolbar = new toolbar_1.ToolBar(container, contextMenuService, {
            getKeyBinding: action => keybindingService.lookupKeybinding(action.id),
            actionViewItemProvider: (action, options) => {
                return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, options);
            },
            renderDropdownAsChildElement: true,
            hoverDelegate
        });
        if (elementClass) {
            toolbar.getElement().classList.add(elementClass);
        }
        return toolbar;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFRvb2xiYXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsVG9vbGJhcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLDBCQUFlO1FBR3RELFlBQ2tCLGVBQXdDLEVBQ3pELHNCQUFtQyxFQUNsQiwyQkFBd0MsRUFDakIsb0JBQTJDLEVBQzdDLGtCQUF1QyxFQUN4QyxpQkFBcUMsRUFDM0MsV0FBeUI7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFSUyxvQkFBZSxHQUFmLGVBQWUsQ0FBeUI7WUFFeEMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFhO1lBQ2pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzNDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1FBR3pELENBQUM7UUFFTyxXQUFXO1lBQ2xCLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQ2pDLENBQUM7WUFFRCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ2hILHNCQUFzQixFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFO29CQUMzQyxJQUFJLE1BQU0sWUFBWSx3QkFBYyxFQUFFLENBQUM7d0JBQ3RDLElBQUksSUFB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