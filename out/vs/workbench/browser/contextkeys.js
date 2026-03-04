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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspace", "vs/workbench/services/layout/browser/layoutService", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/platform", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/product/common/productService", "vs/platform/files/common/files", "vs/platform/window/common/window", "vs/base/browser/window", "vs/workbench/common/editor/diffEditorInput", "vs/base/browser/browser", "vs/base/common/network"], function (require, exports, event_1, lifecycle_1, contextkey_1, contextkeys_1, contextkeys_2, editor_1, dom_1, editorGroupsService_1, configuration_1, environmentService_1, editorService_1, workspace_1, layoutService_1, remoteHosts_1, virtualWorkspace_1, workingCopyService_1, platform_1, editorResolverService_1, panecomposite_1, webFileSystemAccess_1, productService_1, files_1, window_1, window_2, diffEditorInput_1, browser_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchContextKeysHandler = void 0;
    let WorkbenchContextKeysHandler = class WorkbenchContextKeysHandler extends lifecycle_1.Disposable {
        constructor(contextKeyService, contextService, configurationService, environmentService, productService, editorService, editorResolverService, editorGroupService, layoutService, paneCompositeService, workingCopyService, fileService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.productService = productService;
            this.editorService = editorService;
            this.editorResolverService = editorResolverService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.paneCompositeService = paneCompositeService;
            this.workingCopyService = workingCopyService;
            this.fileService = fileService;
            // Platform
            contextkeys_1.IsMacContext.bindTo(this.contextKeyService);
            contextkeys_1.IsLinuxContext.bindTo(this.contextKeyService);
            contextkeys_1.IsWindowsContext.bindTo(this.contextKeyService);
            contextkeys_1.IsWebContext.bindTo(this.contextKeyService);
            contextkeys_1.IsMacNativeContext.bindTo(this.contextKeyService);
            contextkeys_1.IsIOSContext.bindTo(this.contextKeyService);
            contextkeys_1.IsMobileContext.bindTo(this.contextKeyService);
            contextkeys_2.RemoteNameContext.bindTo(this.contextKeyService).set((0, remoteHosts_1.getRemoteName)(this.environmentService.remoteAuthority) || '');
            this.virtualWorkspaceContext = contextkeys_2.VirtualWorkspaceContext.bindTo(this.contextKeyService);
            this.temporaryWorkspaceContext = contextkeys_2.TemporaryWorkspaceContext.bindTo(this.contextKeyService);
            this.updateWorkspaceContextKeys();
            // Capabilities
            contextkeys_2.HasWebFileSystemAccess.bindTo(this.contextKeyService).set(webFileSystemAccess_1.WebFileSystemAccess.supported(window_2.mainWindow));
            // Development
            const isDevelopment = !this.environmentService.isBuilt || this.environmentService.isExtensionDevelopment;
            contextkeys_1.IsDevelopmentContext.bindTo(this.contextKeyService).set(isDevelopment);
            (0, contextkey_1.setConstant)(contextkeys_1.IsDevelopmentContext.key, isDevelopment);
            // Product Service
            contextkeys_1.ProductQualityContext.bindTo(this.contextKeyService).set(this.productService.quality || '');
            contextkeys_2.EmbedderIdentifierContext.bindTo(this.contextKeyService).set(productService.embedderIdentifier);
            // Editors
            this.activeEditorContext = contextkeys_2.ActiveEditorContext.bindTo(this.contextKeyService);
            this.activeEditorIsReadonly = contextkeys_2.ActiveEditorReadonlyContext.bindTo(this.contextKeyService);
            this.activeCompareEditorCanSwap = contextkeys_2.ActiveCompareEditorCanSwapContext.bindTo(this.contextKeyService);
            this.activeEditorCanToggleReadonly = contextkeys_2.ActiveEditorCanToggleReadonlyContext.bindTo(this.contextKeyService);
            this.activeEditorCanRevert = contextkeys_2.ActiveEditorCanRevertContext.bindTo(this.contextKeyService);
            this.activeEditorCanSplitInGroup = contextkeys_2.ActiveEditorCanSplitInGroupContext.bindTo(this.contextKeyService);
            this.activeEditorAvailableEditorIds = contextkeys_2.ActiveEditorAvailableEditorIdsContext.bindTo(this.contextKeyService);
            this.editorsVisibleContext = contextkeys_2.EditorsVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorVisibleContext = contextkeys_2.TextCompareEditorVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorActiveContext = contextkeys_2.TextCompareEditorActiveContext.bindTo(this.contextKeyService);
            this.sideBySideEditorActiveContext = contextkeys_2.SideBySideEditorActiveContext.bindTo(this.contextKeyService);
            this.activeEditorGroupEmpty = contextkeys_2.ActiveEditorGroupEmptyContext.bindTo(this.contextKeyService);
            this.activeEditorGroupIndex = contextkeys_2.ActiveEditorGroupIndexContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLast = contextkeys_2.ActiveEditorGroupLastContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLocked = contextkeys_2.ActiveEditorGroupLockedContext.bindTo(this.contextKeyService);
            this.multipleEditorGroupsContext = contextkeys_2.MultipleEditorGroupsContext.bindTo(this.contextKeyService);
            // Working Copies
            this.dirtyWorkingCopiesContext = contextkeys_2.DirtyWorkingCopiesContext.bindTo(this.contextKeyService);
            this.dirtyWorkingCopiesContext.set(this.workingCopyService.hasDirty);
            // Inputs
            this.inputFocusedContext = contextkeys_1.InputFocusedContext.bindTo(this.contextKeyService);
            // Workbench State
            this.workbenchStateContext = contextkeys_2.WorkbenchStateContext.bindTo(this.contextKeyService);
            this.updateWorkbenchStateContextKey();
            // Workspace Folder Count
            this.workspaceFolderCountContext = contextkeys_2.WorkspaceFolderCountContext.bindTo(this.contextKeyService);
            this.updateWorkspaceFolderCountContextKey();
            // Opening folder support: support for opening a folder workspace
            // (e.g. "Open Folder...") is limited in web when not connected
            // to a remote.
            this.openFolderWorkspaceSupportContext = contextkeys_2.OpenFolderWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.openFolderWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Empty workspace support: empty workspaces require built-in file system
            // providers to be available that allow to enter a workspace or open loose
            // files. This condition is met:
            // - desktop: always
            // -     web: only when connected to a remote
            this.emptyWorkspaceSupportContext = contextkeys_2.EmptyWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.emptyWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Entering a multi root workspace support: support for entering a multi-root
            // workspace (e.g. "Open Workspace from File...", "Duplicate Workspace", "Save Workspace")
            // is driven by the ability to resolve a workspace configuration file (*.code-workspace)
            // with a built-in file system provider.
            // This condition is met:
            // - desktop: always
            // -     web: only when connected to a remote
            this.enterMultiRootWorkspaceSupportContext = contextkeys_2.EnterMultiRootWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.enterMultiRootWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Editor Layout
            this.splitEditorsVerticallyContext = contextkeys_2.SplitEditorsVertically.bindTo(this.contextKeyService);
            this.updateSplitEditorsVerticallyContext();
            // Window
            this.isMainWindowFullscreenContext = contextkeys_2.IsMainWindowFullscreenContext.bindTo(this.contextKeyService);
            this.isAuxiliaryWindowFocusedContext = contextkeys_2.IsAuxiliaryWindowFocusedContext.bindTo(this.contextKeyService);
            // Zen Mode
            this.inZenModeContext = contextkeys_2.InEditorZenModeContext.bindTo(this.contextKeyService);
            // Centered Layout (Main Editor)
            this.isMainEditorCenteredLayoutContext = contextkeys_2.IsMainEditorCenteredLayoutContext.bindTo(this.contextKeyService);
            // Editor Area
            this.mainEditorAreaVisibleContext = contextkeys_2.MainEditorAreaVisibleContext.bindTo(this.contextKeyService);
            this.editorTabsVisibleContext = contextkeys_2.EditorTabsVisibleContext.bindTo(this.contextKeyService);
            // Sidebar
            this.sideBarVisibleContext = contextkeys_2.SideBarVisibleContext.bindTo(this.contextKeyService);
            // Title Bar
            this.titleAreaVisibleContext = contextkeys_2.TitleBarVisibleContext.bindTo(this.contextKeyService);
            this.titleBarStyleContext = contextkeys_2.TitleBarStyleContext.bindTo(this.contextKeyService);
            this.updateTitleBarContextKeys();
            // Panel
            this.panelPositionContext = contextkeys_2.PanelPositionContext.bindTo(this.contextKeyService);
            this.panelPositionContext.set((0, layoutService_1.positionToString)(this.layoutService.getPanelPosition()));
            this.panelVisibleContext = contextkeys_2.PanelVisibleContext.bindTo(this.contextKeyService);
            this.panelVisibleContext.set(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */));
            this.panelMaximizedContext = contextkeys_2.PanelMaximizedContext.bindTo(this.contextKeyService);
            this.panelMaximizedContext.set(this.layoutService.isPanelMaximized());
            this.panelAlignmentContext = contextkeys_2.PanelAlignmentContext.bindTo(this.contextKeyService);
            this.panelAlignmentContext.set(this.layoutService.getPanelAlignment());
            // Auxiliary Bar
            this.auxiliaryBarVisibleContext = contextkeys_2.AuxiliaryBarVisibleContext.bindTo(this.contextKeyService);
            this.auxiliaryBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */));
            this.registerListeners();
        }
        registerListeners() {
            this.editorGroupService.whenReady.then(() => {
                this.updateEditorAreaContextKeys();
                this.updateEditorContextKeys();
            });
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidAddGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidChangeGroupIndex(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidChangeActiveGroup(() => this.updateEditorGroupContextKeys()));
            this._register(this.editorGroupService.onDidChangeGroupLocked(() => this.updateEditorGroupContextKeys()));
            this._register(this.editorGroupService.onDidChangeEditorPartOptions(() => this.updateEditorAreaContextKeys()));
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => disposables.add((0, dom_1.addDisposableListener)(window, dom_1.EventType.FOCUS_IN, () => this.updateInputContextKeys(window.document), true)), { window: window_2.mainWindow, disposables: this._store }));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateWorkbenchStateContextKey()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                this.updateWorkspaceFolderCountContextKey();
                this.updateWorkspaceContextKeys();
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.updateSplitEditorsVerticallyContext();
                }
            }));
            this._register(this.layoutService.onDidChangeZenMode(enabled => this.inZenModeContext.set(enabled)));
            this._register(this.layoutService.onDidChangeActiveContainer(() => this.isAuxiliaryWindowFocusedContext.set(this.layoutService.activeContainer !== this.layoutService.mainContainer)));
            this._register((0, browser_1.onDidChangeFullscreen)(windowId => {
                if (windowId === window_2.mainWindow.vscodeWindowId) {
                    this.isMainWindowFullscreenContext.set((0, browser_1.isFullscreen)(window_2.mainWindow));
                }
            }));
            this._register(this.layoutService.onDidChangeMainEditorCenteredLayout(centered => this.isMainEditorCenteredLayoutContext.set(centered)));
            this._register(this.layoutService.onDidChangePanelPosition(position => this.panelPositionContext.set(position)));
            this._register(this.layoutService.onDidChangePanelAlignment(alignment => this.panelAlignmentContext.set(alignment)));
            this._register(this.paneCompositeService.onDidPaneCompositeClose(() => this.updateSideBarContextKeys()));
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(() => this.updateSideBarContextKeys()));
            this._register(this.layoutService.onDidChangePartVisibility(() => {
                this.mainEditorAreaVisibleContext.set(this.layoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, window_2.mainWindow));
                this.panelVisibleContext.set(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */));
                this.panelMaximizedContext.set(this.layoutService.isPanelMaximized());
                this.auxiliaryBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */));
                this.updateTitleBarContextKeys();
            }));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.dirtyWorkingCopiesContext.set(workingCopy.isDirty() || this.workingCopyService.hasDirty)));
        }
        updateEditorAreaContextKeys() {
            this.editorTabsVisibleContext.set(this.editorGroupService.partOptions.showTabs === 'multiple');
        }
        updateEditorContextKeys() {
            const activeEditorPane = this.editorService.activeEditorPane;
            const visibleEditorPanes = this.editorService.visibleEditorPanes;
            this.textCompareEditorActiveContext.set(activeEditorPane?.getId() === editor_1.TEXT_DIFF_EDITOR_ID);
            this.textCompareEditorVisibleContext.set(visibleEditorPanes.some(editorPane => editorPane.getId() === editor_1.TEXT_DIFF_EDITOR_ID));
            this.sideBySideEditorActiveContext.set(activeEditorPane?.getId() === editor_1.SIDE_BY_SIDE_EDITOR_ID);
            if (visibleEditorPanes.length > 0) {
                this.editorsVisibleContext.set(true);
            }
            else {
                this.editorsVisibleContext.reset();
            }
            if (!this.editorService.activeEditor) {
                this.activeEditorGroupEmpty.set(true);
            }
            else {
                this.activeEditorGroupEmpty.reset();
            }
            this.updateEditorGroupContextKeys();
            if (activeEditorPane) {
                this.activeEditorContext.set(activeEditorPane.getId());
                this.activeEditorCanRevert.set(!activeEditorPane.input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
                this.activeEditorCanSplitInGroup.set(activeEditorPane.input.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */));
                (0, contextkeys_2.applyAvailableEditorIds)(this.activeEditorAvailableEditorIds, activeEditorPane.input, this.editorResolverService);
                this.activeEditorIsReadonly.set(!!activeEditorPane.input.isReadonly());
                const primaryEditorResource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                const secondaryEditorResource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                this.activeCompareEditorCanSwap.set(activeEditorPane.input instanceof diffEditorInput_1.DiffEditorInput && !activeEditorPane.input.original.isReadonly() && !!primaryEditorResource && (this.fileService.hasProvider(primaryEditorResource) || primaryEditorResource.scheme === network_1.Schemas.untitled) && !!secondaryEditorResource && (this.fileService.hasProvider(secondaryEditorResource) || secondaryEditorResource.scheme === network_1.Schemas.untitled));
                this.activeEditorCanToggleReadonly.set(!!primaryEditorResource && this.fileService.hasProvider(primaryEditorResource) && !this.fileService.hasCapability(primaryEditorResource, 2048 /* FileSystemProviderCapabilities.Readonly */));
            }
            else {
                this.activeEditorContext.reset();
                this.activeEditorIsReadonly.reset();
                this.activeCompareEditorCanSwap.reset();
                this.activeEditorCanToggleReadonly.reset();
                this.activeEditorCanRevert.reset();
                this.activeEditorCanSplitInGroup.reset();
                this.activeEditorAvailableEditorIds.reset();
            }
        }
        updateEditorGroupContextKeys() {
            const groupCount = this.editorGroupService.count;
            if (groupCount > 1) {
                this.multipleEditorGroupsContext.set(true);
            }
            else {
                this.multipleEditorGroupsContext.reset();
            }
            const activeGroup = this.editorGroupService.activeGroup;
            this.activeEditorGroupIndex.set(activeGroup.index + 1); // not zero-indexed
            this.activeEditorGroupLast.set(activeGroup.index === groupCount - 1);
            this.activeEditorGroupLocked.set(activeGroup.isLocked);
        }
        updateInputContextKeys(ownerDocument) {
            function activeElementIsInput() {
                return !!ownerDocument.activeElement && (ownerDocument.activeElement.tagName === 'INPUT' || ownerDocument.activeElement.tagName === 'TEXTAREA');
            }
            const isInputFocused = activeElementIsInput();
            this.inputFocusedContext.set(isInputFocused);
            if (isInputFocused) {
                const tracker = (0, dom_1.trackFocus)(ownerDocument.activeElement);
                event_1.Event.once(tracker.onDidBlur)(() => {
                    // Ensure we are only updating the context key if we are
                    // still in the same document that we are tracking. This
                    // fixes a race condition in multi-window setups where
                    // the blur event arrives in the inactive window overwriting
                    // the context key of the active window. This is because
                    // blur events from the focus tracker are emitted with a
                    // timeout of 0.
                    if ((0, dom_1.getActiveWindow)().document === ownerDocument) {
                        this.inputFocusedContext.set(activeElementIsInput());
                    }
                    tracker.dispose();
                });
            }
        }
        updateWorkbenchStateContextKey() {
            this.workbenchStateContext.set(this.getWorkbenchStateString());
        }
        updateWorkspaceFolderCountContextKey() {
            this.workspaceFolderCountContext.set(this.contextService.getWorkspace().folders.length);
        }
        updateSplitEditorsVerticallyContext() {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this.configurationService);
            this.splitEditorsVerticallyContext.set(direction === 1 /* GroupDirection.DOWN */);
        }
        getWorkbenchStateString() {
            switch (this.contextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: return 'empty';
                case 2 /* WorkbenchState.FOLDER */: return 'folder';
                case 3 /* WorkbenchState.WORKSPACE */: return 'workspace';
            }
        }
        updateSideBarContextKeys() {
            this.sideBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */));
        }
        updateTitleBarContextKeys() {
            this.titleAreaVisibleContext.set(this.layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow));
            this.titleBarStyleContext.set((0, window_1.getTitleBarStyle)(this.configurationService));
        }
        updateWorkspaceContextKeys() {
            this.virtualWorkspaceContext.set((0, virtualWorkspace_1.getVirtualWorkspaceScheme)(this.contextService.getWorkspace()) || '');
            this.temporaryWorkspaceContext.set((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()));
        }
    };
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler;
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, productService_1.IProductService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorResolverService_1.IEditorResolverService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, panecomposite_1.IPaneCompositePartService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, files_1.IFileService)
    ], WorkbenchContextKeysHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9jb250ZXh0a2V5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4QnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFxRDFELFlBQ3NDLGlCQUFxQyxFQUMvQixjQUF3QyxFQUMzQyxvQkFBMkMsRUFDcEMsa0JBQWdELEVBQzdELGNBQStCLEVBQ2hDLGFBQTZCLEVBQ3JCLHFCQUE2QyxFQUMvQyxrQkFBd0MsRUFDckMsYUFBc0MsRUFDcEMsb0JBQStDLEVBQ3JELGtCQUF1QyxFQUM5QyxXQUF5QjtZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQWI2QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3BDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDN0QsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2hDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNyQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQy9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDckMsa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQ3BDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDckQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUl4RCxXQUFXO1lBQ1gsMEJBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDNUMsNEJBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxD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