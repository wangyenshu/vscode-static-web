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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/workbench/contrib/files/common/files", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/files/browser/views/explorerView", "vs/workbench/contrib/files/browser/views/emptyView", "vs/workbench/contrib/files/browser/views/openEditorsView", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/workbench/common/views", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/keyCodes", "vs/platform/registry/common/platform", "vs/platform/progress/common/progress", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/actions/windowActions", "vs/base/common/platform", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/browser/dom", "vs/css!./media/explorerviewlet"], function (require, exports, nls_1, performance_1, files_1, configuration_1, explorerView_1, emptyView_1, openEditorsView_1, storage_1, instantiation_1, extensions_1, workspace_1, telemetry_1, contextkey_1, themeService_1, views_1, contextView_1, lifecycle_1, layoutService_1, viewPaneContainer_1, keyCodes_1, platform_1, progress_1, descriptors_1, contextkeys_1, contextkeys_2, workspaceActions_1, windowActions_1, platform_2, codicons_1, iconRegistry_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VIEW_CONTAINER = exports.ExplorerViewPaneContainer = exports.ExplorerViewletViewsContribution = void 0;
    const explorerViewIcon = (0, iconRegistry_1.registerIcon)('explorer-view-icon', codicons_1.Codicon.files, (0, nls_1.localize)('explorerViewIcon', 'View icon of the explorer view.'));
    const openEditorsViewIcon = (0, iconRegistry_1.registerIcon)('open-editors-view-icon', codicons_1.Codicon.book, (0, nls_1.localize)('openEditorsIcon', 'View icon of the open editors view.'));
    let ExplorerViewletViewsContribution = class ExplorerViewletViewsContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.explorerViewletViews'; }
        constructor(workspaceContextService, progressService) {
            super();
            this.workspaceContextService = workspaceContextService;
            progressService.withProgress({ location: 1 /* ProgressLocation.Explorer */ }, () => workspaceContextService.getCompleteWorkspace()).finally(() => {
                this.registerViews();
                this._register(workspaceContextService.onDidChangeWorkbenchState(() => this.registerViews()));
                this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => this.registerViews()));
            });
        }
        registerViews() {
            (0, performance_1.mark)('code/willRegisterExplorerViews');
            const viewDescriptors = viewsRegistry.getViews(exports.VIEW_CONTAINER);
            const viewDescriptorsToRegister = [];
            const viewDescriptorsToDeregister = [];
            const openEditorsViewDescriptor = this.createOpenEditorsViewDescriptor();
            if (!viewDescriptors.some(v => v.id === openEditorsViewDescriptor.id)) {
                viewDescriptorsToRegister.push(openEditorsViewDescriptor);
            }
            const explorerViewDescriptor = this.createExplorerViewDescriptor();
            const registeredExplorerViewDescriptor = viewDescriptors.find(v => v.id === explorerViewDescriptor.id);
            const emptyViewDescriptor = this.createEmptyViewDescriptor();
            const registeredEmptyViewDescriptor = viewDescriptors.find(v => v.id === emptyViewDescriptor.id);
            if (this.workspaceContextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ || this.workspaceContextService.getWorkspace().folders.length === 0) {
                if (registeredExplorerViewDescriptor) {
                    viewDescriptorsToDeregister.push(registeredExplorerViewDescriptor);
                }
                if (!registeredEmptyViewDescriptor) {
                    viewDescriptorsToRegister.push(emptyViewDescriptor);
                }
            }
            else {
                if (registeredEmptyViewDescriptor) {
                    viewDescriptorsToDeregister.push(registeredEmptyViewDescriptor);
                }
                if (!registeredExplorerViewDescriptor) {
                    viewDescriptorsToRegister.push(explorerViewDescriptor);
                }
            }
            if (viewDescriptorsToDeregister.length) {
                viewsRegistry.deregisterViews(viewDescriptorsToDeregister, exports.VIEW_CONTAINER);
            }
            if (viewDescriptorsToRegister.length) {
                viewsRegistry.registerViews(viewDescriptorsToRegister, exports.VIEW_CONTAINER);
            }
            (0, performance_1.mark)('code/didRegisterExplorerViews');
        }
        createOpenEditorsViewDescriptor() {
            return {
                id: openEditorsView_1.OpenEditorsView.ID,
                name: openEditorsView_1.OpenEditorsView.NAME,
                ctorDescriptor: new descriptors_1.SyncDescriptor(openEditorsView_1.OpenEditorsView),
                containerIcon: openEditorsViewIcon,
                order: 0,
                canToggleVisibility: true,
                canMoveView: true,
                collapsed: false,
                hideByDefault: true,
                focusCommand: {
                    id: 'workbench.files.action.focusOpenEditorsView',
                    keybindings: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 35 /* KeyCode.KeyE */) }
                }
            };
        }
        createEmptyViewDescriptor() {
            return {
                id: emptyView_1.EmptyView.ID,
                name: emptyView_1.EmptyView.NAME,
                containerIcon: explorerViewIcon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(emptyView_1.EmptyView),
                order: 1,
                canToggleVisibility: true,
                focusCommand: {
                    id: 'workbench.explorer.fileView.focus'
                }
            };
        }
        createExplorerViewDescriptor() {
            return {
                id: files_1.VIEW_ID,
                name: (0, nls_1.localize2)('folders', "Folders"),
                containerIcon: explorerViewIcon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(explorerView_1.ExplorerView),
                order: 1,
                canMoveView: true,
                canToggleVisibility: false,
                focusCommand: {
                    id: 'workbench.explorer.fileView.focus'
                }
            };
        }
    };
    exports.ExplorerViewletViewsContribution = ExplorerViewletViewsContribution;
    exports.ExplorerViewletViewsContribution = ExplorerViewletViewsContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, progress_1.IProgressService)
    ], ExplorerViewletViewsContribution);
    let ExplorerViewPaneContainer = class ExplorerViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, contextKeyService, themeService, contextMenuService, extensionService, viewDescriptorService) {
            super(files_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.viewletVisibleContextKey = files_1.ExplorerViewletVisibleContext.bindTo(contextKeyService);
            this._register(this.contextService.onDidChangeWorkspaceName(e => this.updateTitleArea()));
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('explorer-viewlet');
        }
        createView(viewDescriptor, options) {
            if (viewDescriptor.id === files_1.VIEW_ID) {
                return this.instantiationService.createInstance(explorerView_1.ExplorerView, {
                    ...options, delegate: {
                        willOpenElement: e => {
                            if (!(0, dom_1.isMouseEvent)(e)) {
                                return; // only delay when user clicks
                            }
                            const openEditorsView = this.getOpenEditorsView();
                            if (openEditorsView) {
                                let delay = 0;
                                const config = this.configurationService.getValue();
                                if (!!config.workbench?.editor?.enablePreview) {
                                    // delay open editors view when preview is enabled
                                    // to accomodate for the user doing a double click
                                    // to pin the editor.
                                    // without this delay a double click would be not
                                    // possible because the next element would move
                                    // under the mouse after the first click.
                                    delay = 250;
                                }
                                openEditorsView.setStructuralRefreshDelay(delay);
                            }
                        },
                        didOpenElement: e => {
                            if (!(0, dom_1.isMouseEvent)(e)) {
                                return; // only delay when user clicks
                            }
                            const openEditorsView = this.getOpenEditorsView();
                            openEditorsView?.setStructuralRefreshDelay(0);
                        }
                    }
                });
            }
            return super.createView(viewDescriptor, options);
        }
        getExplorerView() {
            return this.getView(files_1.VIEW_ID);
        }
        getOpenEditorsView() {
            return this.getView(openEditorsView_1.OpenEditorsView.ID);
        }
        setVisible(visible) {
            this.viewletVisibleContextKey.set(visible);
            super.setVisible(visible);
        }
        focus() {
            const explorerView = this.getView(files_1.VIEW_ID);
            if (explorerView && this.panes.every(p => !p.isExpanded())) {
                explorerView.setExpanded(true);
            }
            if (explorerView?.isExpanded()) {
                explorerView.focus();
            }
            else {
                super.focus();
            }
        }
    };
    exports.ExplorerViewPaneContainer = ExplorerViewPaneContainer;
    exports.ExplorerViewPaneContainer = ExplorerViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, views_1.IViewDescriptorService)
    ], ExplorerViewPaneContainer);
    const viewContainerRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
    /**
     * Explorer viewlet container.
     */
    exports.VIEW_CONTAINER = viewContainerRegistry.registerViewContainer({
        id: files_1.VIEWLET_ID,
        title: (0, nls_1.localize2)('explore', "Explorer"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(ExplorerViewPaneContainer),
        storageId: 'workbench.explorer.views.state',
        icon: explorerViewIcon,
        alwaysUseContainerInfo: true,
        hideIfEmpty: true,
        order: 0,
        openCommandActionDescriptor: {
            id: files_1.VIEWLET_ID,
            title: (0, nls_1.localize2)('explore', "Explorer"),
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewExplorer', comment: ['&& denotes a mnemonic'] }, "&&Explorer"),
            keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 35 /* KeyCode.KeyE */ },
            order: 0
        },
    }, 0 /* ViewContainerLocation.Sidebar */, { isDefault: true });
    const openFolder = (0, nls_1.localize)('openFolder', "Open Folder");
    const addAFolder = (0, nls_1.localize)('addAFolder', "add a folder");
    const openRecent = (0, nls_1.localize)('openRecent', "Open Recent");
    const addRootFolderButton = `[${openFolder}](command:${workspaceActions_1.AddRootFolderAction.ID})`;
    const addAFolderButton = `[${addAFolder}](command:${workspaceActions_1.AddRootFolderAction.ID})`;
    const openFolderButton = `[${openFolder}](command:${(platform_2.isMacintosh && !platform_2.isWeb) ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID})`;
    const openFolderViaWorkspaceButton = `[${openFolder}](command:${workspaceActions_1.OpenFolderViaWorkspaceAction.ID})`;
    const openRecentButton = `[${openRecent}](command:${windowActions_1.OpenRecentAction.ID})`;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noWorkspaceHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet added a folder to the workspace.\n{0}", addRootFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // inside a .code-workspace
        contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), 
        // unless we cannot enter or open workspaces (e.g. web serverless)
        contextkeys_1.OpenFolderWorkspaceSupportContext),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noFolderHelpWeb', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet opened a folder.\n{0}\n{1}", openFolderViaWorkspaceButton, openRecentButton),
        when: contextkey_1.ContextKeyExpr.and(
        // inside a .code-workspace
        contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), 
        // we cannot enter workspaces (e.g. web serverless)
        contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated()),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'remoteNoFolderHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "Connected to remote.\n{0}", openFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // not inside a .code-workspace
        contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), 
        // connected to a remote
        contextkeys_1.RemoteNameContext.notEqualsTo(''), 
        // but not in web
        contextkeys_2.IsWebContext.toNegated()),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noFolderButEditorsHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet opened a folder.\n{0}\nOpening a folder will close all currently open editors. To keep them open, {1} instead.", openFolderButton, addAFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // editors are opened
        contextkey_1.ContextKeyExpr.has('editorIsOpen'), contextkey_1.ContextKeyExpr.or(
        // not inside a .code-workspace and local
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_1.RemoteNameContext.isEqualTo('')), 
        // not inside a .code-workspace and web
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_2.IsWebContext))),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noFolderHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet opened a folder.\n{0}", openFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // no editor is open
        contextkey_1.ContextKeyExpr.has('editorIsOpen')?.negate(), contextkey_1.ContextKeyExpr.or(
        // not inside a .code-workspace and local
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_1.RemoteNameContext.isEqualTo('')), 
        // not inside a .code-workspace and web
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_2.IsWebContext))),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3bGV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9leHBsb3JlclZpZXdsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0NoRyxNQUFNLGdCQUFnQixHQUFHLElBQUEsMkJBQVksRUFBQyxvQkFBb0IsRUFBRSxrQkFBTyxDQUFDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7SUFDNUksTUFBTSxtQkFBbUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsd0JBQXdCLEVBQUUsa0JBQU8sQ0FBQyxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUscUNBQXFDLENBQUMsQ0FBQyxDQUFDO0lBRTlJLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7aUJBRS9DLE9BQUUsR0FBRyx3Q0FBd0MsQUFBM0MsQ0FBNEM7UUFFOUQsWUFDNEMsdUJBQWlELEVBQzFFLGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBSG1DLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFLNUYsZUFBZSxDQUFDLFlBQVksQ0FBQyxFQUFFLFFBQVEsbUNBQTJCLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDeEksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUVyQixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7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