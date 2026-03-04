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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/contrib/scm/common/scm", "vs/css!./media/scm"], function (require, exports, arrays_1, event_1, lifecycle_1, nls_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, serviceCollection_1, scm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMMenus = exports.SCMHistoryProviderMenus = exports.SCMRepositoryMenus = exports.SCMTitleMenu = void 0;
    function actionEquals(a, b) {
        return a.id === b.id;
    }
    const repositoryMenuDisposables = new lifecycle_1.DisposableStore();
    actions_1.MenuRegistry.onDidChangeMenu(e => {
        if (e.has(actions_1.MenuId.SCMTitle)) {
            repositoryMenuDisposables.clear();
            for (const menuItem of actions_1.MenuRegistry.getMenuItems(actions_1.MenuId.SCMTitle)) {
                repositoryMenuDisposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMSourceControlInline, menuItem));
            }
        }
    });
    let SCMTitleMenu = class SCMTitleMenu {
        get actions() { return this._actions; }
        get secondaryActions() { return this._secondaryActions; }
        constructor(menuService, contextKeyService) {
            this._actions = [];
            this._secondaryActions = [];
            this._onDidChangeTitle = new event_1.Emitter();
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this.disposables = new lifecycle_1.DisposableStore();
            this.menu = menuService.createMenu(actions_1.MenuId.SCMTitle, contextKeyService);
            this.disposables.add(this.menu);
            this.menu.onDidChange(this.updateTitleActions, this, this.disposables);
            this.updateTitleActions();
        }
        updateTitleActions() {
            const primary = [];
            const secondary = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { shouldForwardArgs: true }, { primary, secondary });
            if ((0, arrays_1.equals)(primary, this._actions, actionEquals) && (0, arrays_1.equals)(secondary, this._secondaryActions, actionEquals)) {
                return;
            }
            this._actions = primary;
            this._secondaryActions = secondary;
            this._onDidChangeTitle.fire();
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.SCMTitleMenu = SCMTitleMenu;
    exports.SCMTitleMenu = SCMTitleMenu = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, contextkey_1.IContextKeyService)
    ], SCMTitleMenu);
    class SCMMenusItem {
        get resourceGroupMenu() {
            if (!this._resourceGroupMenu) {
                this._resourceGroupMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceGroupContext, this.contextKeyService);
            }
            return this._resourceGroupMenu;
        }
        get resourceFolderMenu() {
            if (!this._resourceFolderMenu) {
                this._resourceFolderMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceFolderContext, this.contextKeyService);
            }
            return this._resourceFolderMenu;
        }
        constructor(contextKeyService, menuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        getResourceMenu(resource) {
            if (typeof resource.contextValue === 'undefined') {
                if (!this.genericResourceMenu) {
                    this.genericResourceMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceContext, this.contextKeyService);
                }
                return this.genericResourceMenu;
            }
            if (!this.contextualResourceMenus) {
                this.contextualResourceMenus = new Map();
            }
            let item = this.contextualResourceMenus.get(resource.contextValue);
            if (!item) {
                const contextKeyService = this.contextKeyService.createOverlay([['scmResourceState', resource.contextValue]]);
                const menu = this.menuService.createMenu(actions_1.MenuId.SCMResourceContext, contextKeyService);
                item = {
                    menu, dispose() {
                        menu.dispose();
                    }
                };
                this.contextualResourceMenus.set(resource.contextValue, item);
            }
            return item.menu;
        }
        dispose() {
            this._resourceGroupMenu?.dispose();
            this._resourceFolderMenu?.dispose();
            this.genericResourceMenu?.dispose();
            if (this.contextualResourceMenus) {
                (0, lifecycle_1.dispose)(this.contextualResourceMenus.values());
                this.contextualResourceMenus.clear();
                this.contextualResourceMenus = undefined;
            }
        }
    }
    let SCMRepositoryMenus = class SCMRepositoryMenus {
        get repositoryContextMenu() {
            if (!this._repositoryContextMenu) {
                this._repositoryContextMenu = this.menuService.createMenu(actions_1.MenuId.SCMSourceControl, this.contextKeyService);
                this.disposables.add(this._repositoryContextMenu);
            }
            return this._repositoryContextMenu;
        }
        get historyProviderMenu() {
            if (this.provider.historyProvider && !this._historyProviderMenu) {
                this._historyProviderMenu = new SCMHistoryProviderMenus(this.contextKeyService, this.menuService);
                this.disposables.add(this._historyProviderMenu);
            }
            return this._historyProviderMenu;
        }
        constructor(provider, contextKeyService, instantiationService, menuService) {
            this.provider = provider;
            this.menuService = menuService;
            this.resourceGroupMenusItems = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.contextKeyService = contextKeyService.createOverlay([
                ['scmProvider', provider.contextValue],
                ['scmProviderRootUri', provider.rootUri?.toString()],
                ['scmProviderHasRootUri', !!provider.rootUri],
            ]);
            const serviceCollection = new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]);
            instantiationService = instantiationService.createChild(serviceCollection);
            this.titleMenu = instantiationService.createInstance(SCMTitleMenu);
            this.disposables.add(this.titleMenu);
            this.repositoryMenu = menuService.createMenu(actions_1.MenuId.SCMSourceControlInline, this.contextKeyService);
            this.disposables.add(this.repositoryMenu);
            provider.onDidChangeResourceGroups(this.onDidChangeResourceGroups, this, this.disposables);
            this.onDidChangeResourceGroups();
        }
        getResourceGroupMenu(group) {
            return this.getOrCreateResourceGroupMenusItem(group).resourceGroupMenu;
        }
        getResourceMenu(resource) {
            return this.getOrCreateResourceGroupMenusItem(resource.resourceGroup).getResourceMenu(resource);
        }
        getResourceFolderMenu(group) {
            return this.getOrCreateResourceGroupMenusItem(group).resourceFolderMenu;
        }
        getOrCreateResourceGroupMenusItem(group) {
            let result = this.resourceGroupMenusItems.get(group);
            if (!result) {
                const contextKeyService = this.contextKeyService.createOverlay([
                    ['scmResourceGroup', group.id],
                    ['multiDiffEditorEnableViewChanges', group.multiDiffEditorEnableViewChanges],
                ]);
                result = new SCMMenusItem(contextKeyService, this.menuService);
                this.resourceGroupMenusItems.set(group, result);
            }
            return result;
        }
        onDidChangeResourceGroups() {
            for (const resourceGroup of this.resourceGroupMenusItems.keys()) {
                if (!this.provider.groups.includes(resourceGroup)) {
                    this.resourceGroupMenusItems.get(resourceGroup)?.dispose();
                    this.resourceGroupMenusItems.delete(resourceGroup);
                }
            }
        }
        dispose() {
            this.disposables.dispose();
            this.resourceGroupMenusItems.forEach(item => item.dispose());
        }
    };
    exports.SCMRepositoryMenus = SCMRepositoryMenus;
    exports.SCMRepositoryMenus = SCMRepositoryMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, actions_1.IMenuService)
    ], SCMRepositoryMenus);
    let SCMHistoryProviderMenus = class SCMHistoryProviderMenus {
        constructor(contextKeyService, menuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.historyItemMenus = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
        }
        getHistoryItemMenu(historyItem) {
            return this.getOrCreateHistoryItemMenu(historyItem);
        }
        getHistoryItemGroupMenu(historyItemGroup) {
            return historyItemGroup.direction === 'incoming' ?
                this.menuService.createMenu(actions_1.MenuId.SCMIncomingChanges, this.contextKeyService) :
                this.getOutgoingHistoryItemGroupMenu(actions_1.MenuId.SCMOutgoingChanges, historyItemGroup);
        }
        getHistoryItemGroupContextMenu(historyItemGroup) {
            return historyItemGroup.direction === 'incoming' ?
                this.menuService.createMenu(actions_1.MenuId.SCMIncomingChangesContext, this.contextKeyService) :
                this.getOutgoingHistoryItemGroupMenu(actions_1.MenuId.SCMOutgoingChangesContext, historyItemGroup);
        }
        getOrCreateHistoryItemMenu(historyItem) {
            let result = this.historyItemMenus.get(historyItem);
            if (!result) {
                let menuId;
                if (historyItem.historyItemGroup.direction === 'incoming') {
                    menuId = historyItem.type === 'allChanges' ?
                        actions_1.MenuId.SCMIncomingChangesAllChangesContext :
                        actions_1.MenuId.SCMIncomingChangesHistoryItemContext;
                }
                else {
                    menuId = historyItem.type === 'allChanges' ?
                        actions_1.MenuId.SCMOutgoingChangesAllChangesContext :
                        actions_1.MenuId.SCMOutgoingChangesHistoryItemContext;
                }
                const contextKeyService = this.contextKeyService.createOverlay([
                    ['scmHistoryItemFileCount', historyItem.statistics?.files ?? 0],
                ]);
                result = this.menuService.createMenu(menuId, contextKeyService);
                this.historyItemMenus.set(historyItem, result);
            }
            return result;
        }
        getOutgoingHistoryItemGroupMenu(menuId, historyItemGroup) {
            const contextKeyService = this.contextKeyService.createOverlay([
                ['scmHistoryItemGroupHasUpstream', !!historyItemGroup.repository.provider.historyProvider?.currentHistoryItemGroup?.base],
            ]);
            return this.menuService.createMenu(menuId, contextKeyService);
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.SCMHistoryProviderMenus = SCMHistoryProviderMenus;
    exports.SCMHistoryProviderMenus = SCMHistoryProviderMenus = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, actions_1.IMenuService)
    ], SCMHistoryProviderMenus);
    let SCMMenus = class SCMMenus {
        constructor(scmService, instantiationService) {
            this.instantiationService = instantiationService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.menus = new Map();
            this.titleMenu = instantiationService.createInstance(SCMTitleMenu);
            scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
        }
        onDidRemoveRepository(repository) {
            const menus = this.menus.get(repository.provider);
            menus?.dispose();
            this.menus.delete(repository.provider);
        }
        getRepositoryMenus(provider) {
            let result = this.menus.get(provider);
            if (!result) {
                const menus = this.instantiationService.createInstance(SCMRepositoryMenus, provider);
                const dispose = () => {
                    menus.dispose();
                    this.menus.delete(provider);
                };
                result = { menus, dispose };
                this.menus.set(provider, result);
            }
            return result.menus;
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.SCMMenus = SCMMenus;
    exports.SCMMenus = SCMMenus = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, instantiation_1.IInstantiationService)
    ], SCMMenus);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMResourceContext, {
        title: (0, nls_1.localize)('miShare', "Share"),
        submenu: actions_1.MenuId.SCMResourceContextShare,
        group: '45_share',
        order: 3,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9tZW51cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLFNBQVMsWUFBWSxDQUFDLENBQVUsRUFBRSxDQUFVO1FBQzNDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxNQUFNLHlCQUF5QixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO0lBRXhELHNCQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2hDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUIseUJBQXlCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFbEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxzQkFBWSxDQUFDLFlBQVksQ0FBQyxnQkFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLHNCQUFzQixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDckcsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVJLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQVk7UUFHeEIsSUFBSSxPQUFPLEtBQWdCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFHbEQsSUFBSSxnQkFBZ0IsS0FBZ0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBUXBFLFlBQ2UsV0FBeUIsRUFDbkIsaUJBQXFDO1lBZGxELGFBQVEsR0FBYyxF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