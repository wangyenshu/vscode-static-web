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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelView", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/async", "vs/platform/actions/browser/toolbar", "vs/platform/hover/browser/hover"], function (require, exports, DOM, scrollableElement_1, toolbar_1, actions_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextView_1, instantiation_1, keybinding_1, coreActions_1, notebookCommon_1, notebookKernelView_1, cellActionView_1, editorService_1, assignmentService_1, async_1, toolbar_2, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWorkbenchToolbar = exports.RenderLabel = void 0;
    exports.convertConfiguration = convertConfiguration;
    exports.workbenchCalculateActions = workbenchCalculateActions;
    exports.workbenchDynamicCalculateActions = workbenchDynamicCalculateActions;
    var RenderLabel;
    (function (RenderLabel) {
        RenderLabel[RenderLabel["Always"] = 0] = "Always";
        RenderLabel[RenderLabel["Never"] = 1] = "Never";
        RenderLabel[RenderLabel["Dynamic"] = 2] = "Dynamic";
    })(RenderLabel || (exports.RenderLabel = RenderLabel = {}));
    function convertConfiguration(value) {
        switch (value) {
            case true:
                return RenderLabel.Always;
            case false:
                return RenderLabel.Never;
            case 'always':
                return RenderLabel.Always;
            case 'never':
                return RenderLabel.Never;
            case 'dynamic':
                return RenderLabel.Dynamic;
        }
    }
    const ICON_ONLY_ACTION_WIDTH = 21;
    const TOGGLE_MORE_ACTION_WIDTH = 21;
    const ACTION_PADDING = 8;
    class WorkbenchAlwaysLabelStrategy {
        constructor(notebookEditor, editorToolbar, goToMenu, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.editorToolbar = editorToolbar;
            this.goToMenu = goToMenu;
            this.instantiationService = instantiationService;
        }
        actionProvider(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                //	this is being disposed by the consumer
                return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
            }
            if (action instanceof actions_2.MenuItemAction) {
                return this.instantiationService.createInstance(cellActionView_1.ActionViewWithLabel, action, { hoverDelegate: options.hoverDelegate });
            }
            if (action instanceof actions_2.SubmenuItemAction && action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, true, {
                    getActions: () => {
                        return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                    }
                }, this.actionProvider.bind(this));
            }
            return undefined;
        }
        calculateActions(leftToolbarContainerMaxWidth) {
            const initialPrimaryActions = this.editorToolbar.primaryActions;
            const initialSecondaryActions = this.editorToolbar.secondaryActions;
            const actionOutput = workbenchCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth);
            return {
                primaryActions: actionOutput.primaryActions.map(a => a.action),
                secondaryActions: actionOutput.secondaryActions
            };
        }
    }
    class WorkbenchNeverLabelStrategy {
        constructor(notebookEditor, editorToolbar, goToMenu, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.editorToolbar = editorToolbar;
            this.goToMenu = goToMenu;
            this.instantiationService = instantiationService;
        }
        actionProvider(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                //	this is being disposed by the consumer
                return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
            }
            if (action instanceof actions_2.MenuItemAction) {
                return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
            }
            if (action instanceof actions_2.SubmenuItemAction) {
                if (action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                    return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, false, {
                        getActions: () => {
                            return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                        }
                    }, this.actionProvider.bind(this));
                }
                else {
                    return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                }
            }
            return undefined;
        }
        calculateActions(leftToolbarContainerMaxWidth) {
            const initialPrimaryActions = this.editorToolbar.primaryActions;
            const initialSecondaryActions = this.editorToolbar.secondaryActions;
            const actionOutput = workbenchCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth);
            return {
                primaryActions: actionOutput.primaryActions.map(a => a.action),
                secondaryActions: actionOutput.secondaryActions
            };
        }
    }
    class WorkbenchDynamicLabelStrategy {
        constructor(notebookEditor, editorToolbar, goToMenu, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.editorToolbar = editorToolbar;
            this.goToMenu = goToMenu;
            this.instantiationService = instantiationService;
        }
        actionProvider(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                //	this is being disposed by the consumer
                return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
            }
            const a = this.editorToolbar.primaryActions.find(a => a.action.id === action.id);
            if (!a || a.renderLabel) {
                if (action instanceof actions_2.MenuItemAction) {
                    return this.instantiationService.createInstance(cellActionView_1.ActionViewWithLabel, action, { hoverDelegate: options.hoverDelegate });
                }
                if (action instanceof actions_2.SubmenuItemAction && action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                    return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, true, {
                        getActions: () => {
                            return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                        }
                    }, this.actionProvider.bind(this));
                }
                return undefined;
            }
            else {
                if (action instanceof actions_2.MenuItemAction) {
                    this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                }
                if (action instanceof actions_2.SubmenuItemAction) {
                    if (action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                        return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, false, {
                            getActions: () => {
                                return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                            }
                        }, this.actionProvider.bind(this));
                    }
                    else {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                    }
                }
                return undefined;
            }
        }
        calculateActions(leftToolbarContainerMaxWidth) {
            const initialPrimaryActions = this.editorToolbar.primaryActions;
            const initialSecondaryActions = this.editorToolbar.secondaryActions;
            const actionOutput = workbenchDynamicCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth);
            return {
                primaryActions: actionOutput.primaryActions.map(a => a.action),
                secondaryActions: actionOutput.secondaryActions
            };
        }
    }
    let NotebookEditorWorkbenchToolbar = class NotebookEditorWorkbenchToolbar extends lifecycle_1.Disposable {
        get primaryActions() {
            return this._primaryActions;
        }
        get secondaryActions() {
            return this._secondaryActions;
        }
        set visible(visible) {
            if (this._visible !== visible) {
                this._visible = visible;
                this._onDidChangeVisibility.fire(visible);
            }
        }
        get useGlobalToolbar() {
            return this._useGlobalToolbar;
        }
        constructor(notebookEditor, contextKeyService, notebookOptions, domNode, instantiationService, configurationService, contextMenuService, menuService, editorService, keybindingService, experimentService) {
            super();
            this.notebookEditor = notebookEditor;
            this.contextKeyService = contextKeyService;
            this.notebookOptions = notebookOptions;
            this.domNode = domNode;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.editorService = editorService;
            this.keybindingService = keybindingService;
            this.experimentService = experimentService;
            this._useGlobalToolbar = false;
            this._renderLabel = RenderLabel.Always;
            this._visible = false;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._dimension = null;
            this._primaryActions = [];
            this._secondaryActions = [];
            this._buildBody();
            this._register(event_1.Event.debounce(this.editorService.onDidActiveEditorChange, (last, _current) => last, 200)(this._updatePerEditorChange, this));
            this._registerNotebookActionsToolbar();
        }
        _buildBody() {
            this._notebookTopLeftToolbarContainer = document.createElement('div');
            this._notebookTopLeftToolbarContainer.classList.add('notebook-toolbar-left');
            this._leftToolbarScrollable = new scrollableElement_1.DomScrollableElement(this._notebookTopLeftToolbarContainer, {
                vertical: 2 /* ScrollbarVisibility.Hidden */,
                horizontal: 3 /* ScrollbarVisibility.Visible */,
                horizontalScrollbarSize: 3,
                useShadows: false,
                scrollYToX: true
            });
            this._register(this._leftToolbarScrollable);
            DOM.append(this.domNode, this._leftToolbarScrollable.getDomNode());
            this._notebookTopRightToolbarContainer = document.createElement('div');
            this._notebookTopRightToolbarContainer.classList.add('notebook-toolbar-right');
            DOM.append(this.domNode, this._notebookTopRightToolbarContainer);
        }
        _updatePerEditorChange() {
            if (this.editorService.activeEditorPane?.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
                const notebookEditor = this.editorService.activeEditorPane.getControl();
                if (notebookEditor === this.notebookEditor) {
                    // this is the active editor
                    this._showNotebookActionsinEditorToolbar();
                    return;
                }
            }
        }
        _registerNotebookActionsToolbar() {
            this._notebookGlobalActionsMenu = this._register(this.menuService.createMenu(this.notebookEditor.creationOptions.menuIds.notebookToolbar, this.contextKeyService));
            this._executeGoToActionsMenu = this._register(this.menuService.createMenu(actions_2.MenuId.NotebookCellExecuteGoTo, this.contextKeyService));
            this._useGlobalToolbar = this.notebookOptions.getDisplayOptions().globalToolbar;
            this._renderLabel = this._convertConfiguration(this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbarShowLabel));
            this._updateStrategy();
            const context = {
                ui: true,
                notebookEditor: this.notebookEditor,
                source: 'notebookToolbar'
            };
            const actionProvider = (action, options) => {
                if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                    // this is being disposed by the consumer
                    return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
                }
                if (this._renderLabel !== RenderLabel.Never) {
                    const a = this._primaryActions.find(a => a.action.id === action.id);
                    if (a && a.renderLabel) {
                        return action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(cellActionView_1.ActionViewWithLabel, action, { hoverDelegate: options.hoverDelegate }) : undefined;
                    }
                    else {
                        return action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate }) : undefined;
                    }
                }
                else {
                    return action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate }) : undefined;
                }
            };
            // Make sure both toolbars have the same hover delegate for instant hover to work
            // Due to the elements being further apart than normal toolbars, the default time limit is to short and has to be increased
            const hoverDelegate = this._register(this.instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, 'element', true, {}));
            hoverDelegate.setInstantHoverTimeLimit(600);
            const leftToolbarOptions = {
                hiddenItemStrategy: 1 /* HiddenItemStrategy.RenderInSecondaryGroup */,
                resetMenu: actions_2.MenuId.NotebookToolbar,
                actionViewItemProvider: (action, options) => {
                    return this._strategy.actionProvider(action, options);
                },
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                renderDropdownAsChildElement: true,
                hoverDelegate
            };
            this._notebookLeftToolbar = this.instantiationService.createInstance(toolbar_2.WorkbenchToolBar, this._notebookTopLeftToolbarContainer, leftToolbarOptions);
            this._register(this._notebookLeftToolbar);
            this._notebookLeftToolbar.context = context;
            this._notebookRightToolbar = new toolbar_1.ToolBar(this._notebookTopRightToolbarContainer, this.contextMenuService, {
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                actionViewItemProvider: actionProvider,
                renderDropdownAsChildElement: true,
                hoverDelegate
            });
            this._register(this._notebookRightToolbar);
            this._notebookRightToolbar.context = context;
            this._showNotebookActionsinEditorToolbar();
            let dropdownIsVisible = false;
            let deferredUpdate;
            this._register(this._notebookGlobalActionsMenu.onDidChange(() => {
                if (dropdownIsVisible) {
                    deferredUpdate = () => this._showNotebookActionsinEditorToolbar();
                    return;
                }
                if (this.notebookEditor.isVisible) {
                    this._showNotebookActionsinEditorToolbar();
                }
            }));
            this._register(this._notebookLeftToolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                if (deferredUpdate && !visible) {
                    setTimeout(() => {
                        deferredUpdate?.();
                    }, 0);
                    deferredUpdate = undefined;
                }
            }));
            this._register(this.notebookOptions.onDidChangeOptions(e => {
                if (e.globalToolbar !== undefined) {
                    this._useGlobalToolbar = this.notebookOptions.getDisplayOptions().globalToolbar;
                    this._showNotebookActionsinEditorToolbar();
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.globalToolbarShowLabel)) {
                    this._renderLabel = this._convertConfiguration(this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbarShowLabel));
                    this._updateStrategy();
                    const oldElement = this._notebookLeftToolbar.getElement();
                    oldElement.parentElement?.removeChild(oldElement);
                    this._notebookLeftToolbar.dispose();
                    this._notebookLeftToolbar = this.instantiationService.createInstance(toolbar_2.WorkbenchToolBar, this._notebookTopLeftToolbarContainer, leftToolbarOptions);
                    this._register(this._notebookLeftToolbar);
                    this._notebookLeftToolbar.context = context;
                    this._showNotebookActionsinEditorToolbar();
                    return;
                }
            }));
            if (this.experimentService) {
                this.experimentService.getTreatment('nbtoolbarineditor').then(treatment => {
                    if (treatment === undefined) {
                        return;
                    }
                    if (this._useGlobalToolbar !== treatment) {
                        this._useGlobalToolbar = treatment;
                        this._showNotebookActionsinEditorToolbar();
                    }
                });
            }
        }
        _updateStrategy() {
            switch (this._renderLabel) {
                case RenderLabel.Always:
                    this._strategy = new WorkbenchAlwaysLabelStrategy(this.notebookEditor, this, this._executeGoToActionsMenu, this.instantiationService);
                    break;
                case RenderLabel.Never:
                    this._strategy = new WorkbenchNeverLabelStrategy(this.notebookEditor, this, this._executeGoToActionsMenu, this.instantiationService);
                    break;
                case RenderLabel.Dynamic:
                    this._strategy = new WorkbenchDynamicLabelStrategy(this.notebookEditor, this, this._executeGoToActionsMenu, this.instantiationService);
                    break;
            }
        }
        _convertConfiguration(value) {
            switch (value) {
                case true:
                    return RenderLabel.Always;
                case false:
                    return RenderLabel.Never;
                case 'always':
                    return RenderLabel.Always;
                case 'never':
                    return RenderLabel.Never;
                case 'dynamic':
                    return RenderLabel.Dynamic;
            }
        }
        _showNotebookActionsinEditorToolbar() {
            // when there is no view model, just ignore.
            if (!this.notebookEditor.hasModel()) {
                this._deferredActionUpdate?.dispose();
                this._deferredActionUpdate = undefined;
                this.visible = false;
                return;
            }
            if (this._deferredActionUpdate) {
                return;
            }
            if (!this._useGlobalToolbar) {
                this.domNode.style.display = 'none';
                this._deferredActionUpdate = undefined;
                this.visible = false;
            }
            else {
                this._deferredActionUpdate = (0, async_1.disposableTimeout)(async () => {
                    await this._setNotebookActions();
                    this.visible = true;
                    this._deferredActionUpdate = undefined;
                }, 50);
            }
        }
        async _setNotebookActions() {
            const groups = this._notebookGlobalActionsMenu.getActions({ shouldForwardArgs: true, renderShortTitle: true });
            this.domNode.style.display = 'flex';
            const primaryLeftGroups = groups.filter(group => /^navigation/.test(group[0]));
            const primaryActions = [];
            primaryLeftGroups.sort((a, b) => {
                if (a[0] === 'navigation') {
                    return 1;
                }
                if (b[0] === 'navigation') {
                    return -1;
                }
                return 0;
            }).forEach((group, index) => {
                primaryActions.push(...group[1]);
                if (index < primaryLeftGroups.length - 1) {
                    primaryActions.push(new actions_1.Separator());
                }
            });
            const primaryRightGroup = groups.find(group => /^status/.test(group[0]));
            const primaryRightActions = primaryRightGroup ? primaryRightGroup[1] : [];
            const secondaryActions = groups.filter(group => !/^navigation/.test(group[0]) && !/^status/.test(group[0])).reduce((prev, curr) => { prev.push(...curr[1]); return prev; }, []);
            this._notebookLeftToolbar.setActions([], []);
            this._primaryActions = primaryActions.map(action => ({
                action: action,
                size: (action instanceof actions_1.Separator ? 1 : 0),
                renderLabel: true,
                visible: true
            }));
            this._notebookLeftToolbar.setActions(primaryActions, secondaryActions);
            this._secondaryActions = secondaryActions;
            this._notebookRightToolbar.setActions(primaryRightActions, []);
            this._secondaryActions = secondaryActions;
            if (this._dimension && this._dimension.width >= 0 && this._dimension.height >= 0) {
                this._cacheItemSizes(this._notebookLeftToolbar);
            }
            this._computeSizes();
        }
        _cacheItemSizes(toolbar) {
            for (let i = 0; i < toolbar.getItemsLength(); i++) {
                const action = toolbar.getItemAction(i);
                if (action && action.id !== 'toolbar.toggle.more') {
                    const existing = this._primaryActions.find(a => a.action.id === action.id);
                    if (existing) {
                        existing.size = toolbar.getItemWidth(i);
                    }
                }
            }
        }
        _computeSizes() {
            const toolbar = this._notebookLeftToolbar;
            const rightToolbar = this._notebookRightToolbar;
            if (toolbar && rightToolbar && this._dimension && this._dimension.height >= 0 && this._dimension.width >= 0) {
                // compute size only if it's visible
                if (this._primaryActions.length === 0 && toolbar.getItemsLength() !== this._primaryActions.length) {
                    this._cacheItemSizes(this._notebookLeftToolbar);
                }
                if (this._primaryActions.length === 0) {
                    return;
                }
                const kernelWidth = (rightToolbar.getItemsLength() ? rightToolbar.getItemWidth(0) : 0) + ACTION_PADDING;
                const leftToolbarContainerMaxWidth = this._dimension.width - kernelWidth - (ACTION_PADDING + TOGGLE_MORE_ACTION_WIDTH) - ( /** toolbar left margin */ACTION_PADDING) - ( /** toolbar right margin */ACTION_PADDING);
                const calculatedActions = this._strategy.calculateActions(leftToolbarContainerMaxWidth);
                this._notebookLeftToolbar.setActions(calculatedActions.primaryActions, calculatedActions.secondaryActions);
            }
        }
        layout(dimension) {
            this._dimension = dimension;
            if (!this._useGlobalToolbar) {
                this.domNode.style.display = 'none';
            }
            else {
                this.domNode.style.display = 'flex';
            }
            this._computeSizes();
        }
        dispose() {
            this._notebookLeftToolbar.context = undefined;
            this._notebookRightToolbar.context = undefined;
            this._notebookLeftToolbar.dispose();
            this._notebookRightToolbar.dispose();
            this._notebookLeftToolbar = null;
            this._notebookRightToolbar = null;
            this._deferredActionUpdate?.dispose();
            this._deferredActionUpdate = undefined;
            super.dispose();
        }
    };
    exports.NotebookEditorWorkbenchToolbar = NotebookEditorWorkbenchToolbar;
    exports.NotebookEditorWorkbenchToolbar = NotebookEditorWorkbenchToolbar = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, actions_2.IMenuService),
        __param(8, editorService_1.IEditorService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, assignmentService_1.IWorkbenchAssignmentService)
    ], NotebookEditorWorkbenchToolbar);
    function workbenchCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth) {
        return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, false);
    }
    function workbenchDynamicCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth) {
        if (initialPrimaryActions.length === 0) {
            return { primaryActions: [], secondaryActions: initialSecondaryActions };
        }
        // find true length of array, add 1 for each primary actions, ignoring an item when size = 0
        const visibleActionLength = initialPrimaryActions.filter(action => action.size !== 0).length;
        // step 1: try to fit all primary actions
        const totalWidthWithLabels = initialPrimaryActions.map(action => action.size).reduce((a, b) => a + b, 0) + (visibleActionLength - 1) * ACTION_PADDING;
        if (totalWidthWithLabels <= leftToolbarContainerMaxWidth) {
            initialPrimaryActions.forEach(action => {
                action.renderLabel = true;
            });
            return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, false);
        }
        // step 2: check if they fit without labels
        if ((visibleActionLength * ICON_ONLY_ACTION_WIDTH + (visibleActionLength - 1) * ACTION_PADDING) > leftToolbarContainerMaxWidth) {
            initialPrimaryActions.forEach(action => { action.renderLabel = false; });
            return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, true);
        }
        // step 3: render as many actions as possible with labels, rest without.
        let sum = 0;
        let lastActionWithLabel = -1;
        for (let i = 0; i < initialPrimaryActions.length; i++) {
            sum += initialPrimaryActions[i].size + ACTION_PADDING;
            if (initialPrimaryActions[i].action instanceof actions_1.Separator) {
                // find group separator
                const remainingItems = initialPrimaryActions.slice(i + 1).filter(action => action.size !== 0); // todo: need to exclude size 0 items from this
                const newTotalSum = sum + (remainingItems.length === 0 ? 0 : (remainingItems.length * ICON_ONLY_ACTION_WIDTH + (remainingItems.length - 1) * ACTION_PADDING));
                if (newTotalSum <= leftToolbarContainerMaxWidth) {
                    lastActionWithLabel = i;
                }
            }
            else {
                continue;
            }
        }
        // icons only don't fit either
        if (lastActionWithLabel < 0) {
            initialPrimaryActions.forEach(action => { action.renderLabel = false; });
            return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, true);
        }
        // render labels for the actions that have space
        initialPrimaryActions.slice(0, lastActionWithLabel + 1).forEach(action => { action.renderLabel = true; });
        initialPrimaryActions.slice(lastActionWithLabel + 1).forEach(action => { action.renderLabel = false; });
        return {
            primaryActions: initialPrimaryActions,
            secondaryActions: initialSecondaryActions
        };
    }
    function actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, iconOnly) {
        const renderActions = [];
        const overflow = [];
        let currentSize = 0;
        let nonZeroAction = false;
        let containerFull = false;
        if (initialPrimaryActions.length === 0) {
            return { primaryActions: [], secondaryActions: initialSecondaryActions };
        }
        for (let i = 0; i < initialPrimaryActions.length; i++) {
            const actionModel = initialPrimaryActions[i];
            const itemSize = iconOnly ? (actionModel.size === 0 ? 0 : ICON_ONLY_ACTION_WIDTH) : actionModel.size;
            // if two separators in a row, ignore the second
            if (actionModel.action instanceof actions_1.Separator && renderActions.length > 0 && renderActions[renderActions.length - 1].action instanceof actions_1.Separator) {
                continue;
            }
            // if a separator is the first nonZero action, ignore it
            if (actionModel.action instanceof actions_1.Separator && !nonZeroAction) {
                continue;
            }
            if (currentSize + itemSize <= leftToolbarContainerMaxWidth && !containerFull) {
                currentSize += ACTION_PADDING + itemSize;
                renderActions.push(actionModel);
                if (itemSize !== 0) {
                    nonZeroAction = true;
                }
                if (actionModel.action instanceof actions_1.Separator) {
                    nonZeroAction = false;
                }
            }
            else {
                containerFull = true;
                if (itemSize === 0) { // size 0 implies a hidden item, keep in primary to allow for Workbench to handle visibility
                    renderActions.push(actionModel);
                }
                else {
                    if (actionModel.action instanceof actions_1.Separator) { // never push a separator to overflow
                        continue;
                    }
                    overflow.push(actionModel.action);
                }
            }
        }
        for (let i = (renderActions.length - 1); i > 0; i--) {
            const temp = renderActions[i];
            if (temp.size === 0) {
                continue;
            }
            if (temp.action instanceof actions_1.Separator) {
                renderActions.splice(i, 1);
            }
            break;
        }
        if (renderActions.length && renderActions[renderActions.length - 1].action instanceof actions_1.Separator) {
            renderActions.pop();
        }
        if (overflow.length !== 0) {
            overflow.push(new actions_1.Separator());
        }
        if (iconOnly) {
            // if icon only mode, don't render both (+ code) and (+ markdown) buttons. remove of markdown action
            const markdownIndex = renderActions.findIndex(a => a.action.id === 'notebook.cell.insertMarkdownCellBelow');
            if (markdownIndex !== -1) {
                renderActions.splice(markdownIndex, 1);
            }
        }
        return {
            primaryActions: renderActions,
            secondaryActions: [...overflow, ...initialSecondaryActions]
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JUb29sYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3UGFydHMvbm90ZWJvb2tFZGl0b3JUb29sYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZDaEcsb0RBYUM7SUFpaUJELDhEQUVDO0lBRUQsNEVBdURDO0lBam5CRCxJQUFZLFdBSVg7SUFKRCxXQUFZLFdBQVc7UUFDdEIsaURBQVUsQ0FBQTtRQUNWLCtDQUFTLENBQUE7UUFDVCxtREFBVyxDQUFBO0lBQ1osQ0FBQyxFQUpXLFdBQVcsMkJBQVgsV0FBVyxRQUl0QjtJQUlELFNBQWdCLG9CQUFvQixDQUFDLEtBQThCO1FBQ2xFLFFBQVEsS0FBSyxFQUFFLENBQUM7WUFDZixLQUFLLElBQUk7Z0JBQ1IsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQzNCLEtBQUssS0FBSztnQkFDVCxPQUFPLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDMUIsS0FBSyxRQUFRO2dCQUNaLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUMzQixLQUFLLE9BQU87Z0JBQ1gsT0FBTyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQzFCLEtBQUssU0FBUztnQkFDYixPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDN0IsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztJQUNsQyxNQUFNLHdCQUF3QixHQUFHLEVBQUUsQ0FBQztJQUNwQyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFPekIsTUFBTSw0QkFBNEI7UUFDakMsWUFDVSxjQUF1QyxFQUN2QyxhQUE2QyxFQUM3QyxRQUFlLEVBQ2Ysb0JBQTJDO1lBSDNDLG1C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