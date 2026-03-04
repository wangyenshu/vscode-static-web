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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/editor/common/languages/language", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/network", "vs/workbench/common/editor", "vs/base/common/platform"], function (require, exports, lifecycle_1, nls_1, contextkey_1, resources_1, language_1, files_1, model_1, network_1, editor_1, platform_1) {
    "use strict";
    var ResourceContextKey_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceContextKey = exports.FocusedViewContext = exports.PanelMaximizedContext = exports.PanelVisibleContext = exports.PanelAlignmentContext = exports.PanelPositionContext = exports.PanelFocusContext = exports.ActivePanelContext = exports.AuxiliaryBarVisibleContext = exports.AuxiliaryBarFocusContext = exports.ActiveAuxiliaryContext = exports.NotificationsToastsVisibleContext = exports.NotificationsCenterVisibleContext = exports.NotificationFocusedContext = exports.BannerFocused = exports.TitleBarVisibleContext = exports.TitleBarStyleContext = exports.StatusBarFocused = exports.ActiveViewletContext = exports.SidebarFocusContext = exports.SideBarVisibleContext = exports.EditorTabsVisibleContext = exports.MainEditorAreaVisibleContext = exports.SplitEditorsVertically = exports.IsMainEditorCenteredLayoutContext = exports.InEditorZenModeContext = exports.EditorsVisibleContext = exports.IsAuxiliaryEditorPartContext = exports.EditorPartMaximizedEditorGroupContext = exports.EditorPartSingleEditorGroupsContext = exports.EditorPartMultipleEditorGroupsContext = exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext = exports.ActiveEditorGroupLockedContext = exports.ActiveEditorGroupLastContext = exports.ActiveEditorGroupIndexContext = exports.ActiveEditorGroupEmptyContext = exports.EditorGroupEditorsCountContext = exports.SideBySideEditorActiveContext = exports.TextCompareEditorActiveContext = exports.TextCompareEditorVisibleContext = exports.ActiveEditorAvailableEditorIdsContext = exports.ActiveEditorContext = exports.ActiveEditorCanSplitInGroupContext = exports.ActiveEditorCanRevertContext = exports.ActiveEditorCanToggleReadonlyContext = exports.ActiveCompareEditorCanSwapContext = exports.ActiveEditorReadonlyContext = exports.ActiveEditorStickyContext = exports.ActiveEditorLastInGroupContext = exports.ActiveEditorFirstInGroupContext = exports.ActiveEditorPinnedContext = exports.ActiveEditorDirtyContext = exports.EmbedderIdentifierContext = exports.HasWebFileSystemAccess = exports.IsAuxiliaryWindowFocusedContext = exports.IsMainWindowFullscreenContext = exports.TemporaryWorkspaceContext = exports.VirtualWorkspaceContext = exports.RemoteNameContext = exports.DirtyWorkingCopiesContext = exports.EmptyWorkspaceSupportContext = exports.EnterMultiRootWorkspaceSupportContext = exports.OpenFolderWorkspaceSupportContext = exports.WorkspaceFolderCountContext = exports.WorkbenchStateContext = void 0;
    exports.getVisbileViewContextKey = getVisbileViewContextKey;
    exports.applyAvailableEditorIds = applyAvailableEditorIds;
    //#region < --- Workbench --- >
    exports.WorkbenchStateContext = new contextkey_1.RawContextKey('workbenchState', undefined, { type: 'string', description: (0, nls_1.localize)('workbenchState', "The kind of workspace opened in the window, either 'empty' (no workspace), 'folder' (single folder) or 'workspace' (multi-root workspace)") });
    exports.WorkspaceFolderCountContext = new contextkey_1.RawContextKey('workspaceFolderCount', 0, (0, nls_1.localize)('workspaceFolderCount', "The number of root folders in the workspace"));
    exports.OpenFolderWorkspaceSupportContext = new contextkey_1.RawContextKey('openFolderWorkspaceSupport', true, true);
    exports.EnterMultiRootWorkspaceSupportContext = new contextkey_1.RawContextKey('enterMultiRootWorkspaceSupport', true, true);
    exports.EmptyWorkspaceSupportContext = new contextkey_1.RawContextKey('emptyWorkspaceSupport', true, true);
    exports.DirtyWorkingCopiesContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', false, (0, nls_1.localize)('dirtyWorkingCopies', "Whether there are any working copies with unsaved changes"));
    exports.RemoteNameContext = new contextkey_1.RawContextKey('remoteName', '', (0, nls_1.localize)('remoteName', "The name of the remote the window is connected to or an empty string if not connected to any remote"));
    exports.VirtualWorkspaceContext = new contextkey_1.RawContextKey('virtualWorkspace', '', (0, nls_1.localize)('virtualWorkspace', "The scheme of the current workspace is from a virtual file system or an empty string."));
    exports.TemporaryWorkspaceContext = new contextkey_1.RawContextKey('temporaryWorkspace', false, (0, nls_1.localize)('temporaryWorkspace', "The scheme of the current workspace is from a temporary file system."));
    exports.IsMainWindowFullscreenContext = new contextkey_1.RawContextKey('isFullscreen', false, (0, nls_1.localize)('isFullscreen', "Whether the main window is in fullscreen mode"));
    exports.IsAuxiliaryWindowFocusedContext = new contextkey_1.RawContextKey('isAuxiliaryWindowFocusedContext', false, (0, nls_1.localize)('isAuxiliaryWindowFocusedContext', "Whether an auxiliary window is focused"));
    exports.HasWebFileSystemAccess = new contextkey_1.RawContextKey('hasWebFileSystemAccess', false, true); // Support for FileSystemAccess web APIs (https://wicg.github.io/file-system-access)
    exports.EmbedderIdentifierContext = new contextkey_1.RawContextKey('embedderIdentifier', undefined, (0, nls_1.localize)('embedderIdentifier', 'The identifier of the embedder according to the product service, if one is defined'));
    //#endregion
    //#region < --- Editor --- >
    // Editor State Context Keys
    exports.ActiveEditorDirtyContext = new contextkey_1.RawContextKey('activeEditorIsDirty', false, (0, nls_1.localize)('activeEditorIsDirty', "Whether the active editor has unsaved changes"));
    exports.ActiveEditorPinnedContext = new contextkey_1.RawContextKey('activeEditorIsNotPreview', false, (0, nls_1.localize)('activeEditorIsNotPreview', "Whether the active editor is not in preview mode"));
    exports.ActiveEditorFirstInGroupContext = new contextkey_1.RawContextKey('activeEditorIsFirstInGroup', false, (0, nls_1.localize)('activeEditorIsFirstInGroup', "Whether the active editor is the first one in its group"));
    exports.ActiveEditorLastInGroupContext = new contextkey_1.RawContextKey('activeEditorIsLastInGroup', false, (0, nls_1.localize)('activeEditorIsLastInGroup', "Whether the active editor is the last one in its group"));
    exports.ActiveEditorStickyContext = new contextkey_1.RawContextKey('activeEditorIsPinned', false, (0, nls_1.localize)('activeEditorIsPinned', "Whether the active editor is pinned"));
    exports.ActiveEditorReadonlyContext = new contextkey_1.RawContextKey('activeEditorIsReadonly', false, (0, nls_1.localize)('activeEditorIsReadonly', "Whether the active editor is read-only"));
    exports.ActiveCompareEditorCanSwapContext = new contextkey_1.RawContextKey('activeCompareEditorCanSwap', false, (0, nls_1.localize)('activeCompareEditorCanSwap', "Whether the active compare editor can swap sides"));
    exports.ActiveEditorCanToggleReadonlyContext = new contextkey_1.RawContextKey('activeEditorCanToggleReadonly', true, (0, nls_1.localize)('activeEditorCanToggleReadonly', "Whether the active editor can toggle between being read-only or writeable"));
    exports.ActiveEditorCanRevertContext = new contextkey_1.RawContextKey('activeEditorCanRevert', false, (0, nls_1.localize)('activeEditorCanRevert', "Whether the active editor can revert"));
    exports.ActiveEditorCanSplitInGroupContext = new contextkey_1.RawContextKey('activeEditorCanSplitInGroup', true);
    // Editor Kind Context Keys
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null, { type: 'string', description: (0, nls_1.localize)('activeEditor', "The identifier of the active editor") });
    exports.ActiveEditorAvailableEditorIdsContext = new contextkey_1.RawContextKey('activeEditorAvailableEditorIds', '', (0, nls_1.localize)('activeEditorAvailableEditorIds', "The available editor identifiers that are usable for the active editor"));
    exports.TextCompareEditorVisibleContext = new contextkey_1.RawContextKey('textCompareEditorVisible', false, (0, nls_1.localize)('textCompareEditorVisible', "Whether a text compare editor is visible"));
    exports.TextCompareEditorActiveContext = new contextkey_1.RawContextKey('textCompareEditorActive', false, (0, nls_1.localize)('textCompareEditorActive', "Whether a text compare editor is active"));
    exports.SideBySideEditorActiveContext = new contextkey_1.RawContextKey('sideBySideEditorActive', false, (0, nls_1.localize)('sideBySideEditorActive', "Whether a side by side editor is active"));
    // Editor Group Context Keys
    exports.EditorGroupEditorsCountContext = new contextkey_1.RawContextKey('groupEditorsCount', 0, (0, nls_1.localize)('groupEditorsCount', "The number of opened editor groups"));
    exports.ActiveEditorGroupEmptyContext = new contextkey_1.RawContextKey('activeEditorGroupEmpty', false, (0, nls_1.localize)('activeEditorGroupEmpty', "Whether the active editor group is empty"));
    exports.ActiveEditorGroupIndexContext = new contextkey_1.RawContextKey('activeEditorGroupIndex', 0, (0, nls_1.localize)('activeEditorGroupIndex', "The index of the active editor group"));
    exports.ActiveEditorGroupLastContext = new contextkey_1.RawContextKey('activeEditorGroupLast', false, (0, nls_1.localize)('activeEditorGroupLast', "Whether the active editor group is the last group"));
    exports.ActiveEditorGroupLockedContext = new contextkey_1.RawContextKey('activeEditorGroupLocked', false, (0, nls_1.localize)('activeEditorGroupLocked', "Whether the active editor group is locked"));
    exports.MultipleEditorGroupsContext = new contextkey_1.RawContextKey('multipleEditorGroups', false, (0, nls_1.localize)('multipleEditorGroups', "Whether there are multiple editor groups opened"));
    exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext.toNegated();
    // Editor Part Context Keys
    exports.EditorPartMultipleEditorGroupsContext = new contextkey_1.RawContextKey('editorPartMultipleEditorGroups', false, (0, nls_1.localize)('editorPartMultipleEditorGroups', "Whether there are multiple editor groups opened in an editor part"));
    exports.EditorPartSingleEditorGroupsContext = exports.EditorPartMultipleEditorGroupsContext.toNegated();
    exports.EditorPartMaximizedEditorGroupContext = new contextkey_1.RawContextKey('editorPartMaximizedEditorGroup', false, (0, nls_1.localize)('editorPartEditorGroupMaximized', "Editor Part has a maximized group"));
    exports.IsAuxiliaryEditorPartContext = new contextkey_1.RawContextKey('isAuxiliaryEditorPart', false, (0, nls_1.localize)('isAuxiliaryEditorPart', "Editor Part is in an auxiliary window"));
    // Editor Layout Context Keys
    exports.EditorsVisibleContext = new contextkey_1.RawContextKey('editorIsOpen', false, (0, nls_1.localize)('editorIsOpen', "Whether an editor is open"));
    exports.InEditorZenModeContext = new contextkey_1.RawContextKey('inZenMode', false, (0, nls_1.localize)('inZenMode', "Whether Zen mode is enabled"));
    exports.IsMainEditorCenteredLayoutContext = new contextkey_1.RawContextKey('isCenteredLayout', false, (0, nls_1.localize)('isMainEditorCenteredLayout', "Whether centered layout is enabled for the main editor"));
    exports.SplitEditorsVertically = new contextkey_1.RawContextKey('splitEditorsVertically', false, (0, nls_1.localize)('splitEditorsVertically', "Whether editors split vertically"));
    exports.MainEditorAreaVisibleContext = new contextkey_1.RawContextKey('mainEditorAreaVisible', true, (0, nls_1.localize)('mainEditorAreaVisible', "Whether the editor area in the main window is visible"));
    exports.EditorTabsVisibleContext = new contextkey_1.RawContextKey('editorTabsVisible', true, (0, nls_1.localize)('editorTabsVisible', "Whether editor tabs are visible"));
    //#endregion
    //#region < --- Side Bar --- >
    exports.SideBarVisibleContext = new contextkey_1.RawContextKey('sideBarVisible', false, (0, nls_1.localize)('sideBarVisible', "Whether the sidebar is visible"));
    exports.SidebarFocusContext = new contextkey_1.RawContextKey('sideBarFocus', false, (0, nls_1.localize)('sideBarFocus', "Whether the sidebar has keyboard focus"));
    exports.ActiveViewletContext = new contextkey_1.RawContextKey('activeViewlet', '', (0, nls_1.localize)('activeViewlet', "The identifier of the active viewlet"));
    //#endregion
    //#region < --- Status Bar --- >
    exports.StatusBarFocused = new contextkey_1.RawContextKey('statusBarFocused', false, (0, nls_1.localize)('statusBarFocused', "Whether the status bar has keyboard focus"));
    //#endregion
    //#region < --- Title Bar --- >
    exports.TitleBarStyleContext = new contextkey_1.RawContextKey('titleBarStyle', platform_1.isLinux ? 'native' : 'custom', (0, nls_1.localize)('titleBarStyle', "Style of the window title bar"));
    exports.TitleBarVisibleContext = new contextkey_1.RawContextKey('titleBarVisible', false, (0, nls_1.localize)('titleBarVisible', "Whether the title bar is visible"));
    //#endregion
    //#region < --- Banner --- >
    exports.BannerFocused = new contextkey_1.RawContextKey('bannerFocused', false, (0, nls_1.localize)('bannerFocused', "Whether the banner has keyboard focus"));
    //#endregion
    //#region < --- Notifications --- >
    exports.NotificationFocusedContext = new contextkey_1.RawContextKey('notificationFocus', true, (0, nls_1.localize)('notificationFocus', "Whether a notification has keyboard focus"));
    exports.NotificationsCenterVisibleContext = new contextkey_1.RawContextKey('notificationCenterVisible', false, (0, nls_1.localize)('notificationCenterVisible', "Whether the notifications center is visible"));
    exports.NotificationsToastsVisibleContext = new contextkey_1.RawContextKey('notificationToastsVisible', false, (0, nls_1.localize)('notificationToastsVisible', "Whether a notification toast is visible"));
    //#endregion
    //#region < --- Auxiliary Bar --- >
    exports.ActiveAuxiliaryContext = new contextkey_1.RawContextKey('activeAuxiliary', '', (0, nls_1.localize)('activeAuxiliary', "The identifier of the active auxiliary panel"));
    exports.AuxiliaryBarFocusContext = new contextkey_1.RawContextKey('auxiliaryBarFocus', false, (0, nls_1.localize)('auxiliaryBarFocus', "Whether the auxiliary bar has keyboard focus"));
    exports.AuxiliaryBarVisibleContext = new contextkey_1.RawContextKey('auxiliaryBarVisible', false, (0, nls_1.localize)('auxiliaryBarVisible', "Whether the auxiliary bar is visible"));
    //#endregion
    //#region < --- Panel --- >
    exports.ActivePanelContext = new contextkey_1.RawContextKey('activePanel', '', (0, nls_1.localize)('activePanel', "The identifier of the active panel"));
    exports.PanelFocusContext = new contextkey_1.RawContextKey('panelFocus', false, (0, nls_1.localize)('panelFocus', "Whether the panel has keyboard focus"));
    exports.PanelPositionContext = new contextkey_1.RawContextKey('panelPosition', 'bottom', (0, nls_1.localize)('panelPosition', "The position of the panel, always 'bottom'"));
    exports.PanelAlignmentContext = new contextkey_1.RawContextKey('panelAlignment', 'center', (0, nls_1.localize)('panelAlignment', "The alignment of the panel, either 'center', 'left', 'right' or 'justify'"));
    exports.PanelVisibleContext = new contextkey_1.RawContextKey('panelVisible', false, (0, nls_1.localize)('panelVisible', "Whether the panel is visible"));
    exports.PanelMaximizedContext = new contextkey_1.RawContextKey('panelMaximized', false, (0, nls_1.localize)('panelMaximized', "Whether the panel is maximized"));
    //#endregion
    //#region < --- Views --- >
    exports.FocusedViewContext = new contextkey_1.RawContextKey('focusedView', '', (0, nls_1.localize)('focusedView', "The identifier of the view that has keyboard focus"));
    function getVisbileViewContextKey(viewId) { return `view.${viewId}.visible`; }
    //#endregion
    //#region < --- Resources --- >
    let ResourceContextKey = class ResourceContextKey {
        static { ResourceContextKey_1 = this; }
        // NOTE: DO NOT CHANGE THE DEFAULT VALUE TO ANYTHING BUT
        // UNDEFINED! IT IS IMPORTANT THAT DEFAULTS ARE INHERITED
        // FROM THE PARENT CONTEXT AND ONLY UNDEFINED DOES THIS
        static { this.Scheme = new contextkey_1.RawContextKey('resourceScheme', undefined, { type: 'string', description: (0, nls_1.localize)('resourceScheme', "The scheme of the resource") }); }
        static { this.Filename = new contextkey_1.RawContextKey('resourceFilename', undefined, { type: 'string', description: (0, nls_1.localize)('resourceFilename', "The file name of the resource") }); }
        static { this.Dirname = new contextkey_1.RawContextKey('resourceDirname', undefined, { type: 'string', description: (0, nls_1.localize)('resourceDirname', "The folder name the resource is contained in") }); }
        static { this.Path = new contextkey_1.RawContextKey('resourcePath', undefined, { type: 'string', description: (0, nls_1.localize)('resourcePath', "The full path of the resource") }); }
        static { this.LangId = new contextkey_1.RawContextKey('resourceLangId', undefined, { type: 'string', description: (0, nls_1.localize)('resourceLangId', "The language identifier of the resource") }); }
        static { this.Resource = new contextkey_1.RawContextKey('resource', undefined, { type: 'URI', description: (0, nls_1.localize)('resource', "The full value of the resource including scheme and path") }); }
        static { this.Extension = new contextkey_1.RawContextKey('resourceExtname', undefined, { type: 'string', description: (0, nls_1.localize)('resourceExtname', "The extension name of the resource") }); }
        static { this.HasResource = new contextkey_1.RawContextKey('resourceSet', undefined, { type: 'boolean', description: (0, nls_1.localize)('resourceSet', "Whether a resource is present or not") }); }
        static { this.IsFileSystemResource = new contextkey_1.RawContextKey('isFileSystemResource', undefined, { type: 'boolean', description: (0, nls_1.localize)('isFileSystemResource', "Whether the resource is backed by a file system provider") }); }
        constructor(_contextKeyService, _fileService, _languageService, _modelService) {
            this._contextKeyService = _contextKeyService;
            this._fileService = _fileService;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._schemeKey = ResourceContextKey_1.Scheme.bindTo(this._contextKeyService);
            this._filenameKey = ResourceContextKey_1.Filename.bindTo(this._contextKeyService);
            this._dirnameKey = ResourceContextKey_1.Dirname.bindTo(this._contextKeyService);
            this._pathKey = ResourceContextKey_1.Path.bindTo(this._contextKeyService);
            this._langIdKey = ResourceContextKey_1.LangId.bindTo(this._contextKeyService);
            this._resourceKey = ResourceContextKey_1.Resource.bindTo(this._contextKeyService);
            this._extensionKey = ResourceContextKey_1.Extension.bindTo(this._contextKeyService);
            this._hasResource = ResourceContextKey_1.HasResource.bindTo(this._contextKeyService);
            this._isFileSystemResource = ResourceContextKey_1.IsFileSystemResource.bindTo(this._contextKeyService);
            this._disposables.add(_fileService.onDidChangeFileSystemProviderRegistrations(() => {
                const resource = this.get();
                this._isFileSystemResource.set(Boolean(resource && _fileService.hasProvider(resource)));
            }));
            this._disposables.add(_modelService.onModelAdded(model => {
                if ((0, resources_1.isEqual)(model.uri, this.get())) {
                    this._setLangId();
                }
            }));
            this._disposables.add(_modelService.onModelLanguageChanged(e => {
                if ((0, resources_1.isEqual)(e.model.uri, this.get())) {
                    this._setLangId();
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        _setLangId() {
            const value = this.get();
            if (!value) {
                this._langIdKey.set(null);
                return;
            }
            const langId = this._modelService.getModel(value)?.getLanguageId() ?? this._languageService.guessLanguageIdByFilepathOrFirstLine(value);
            this._langIdKey.set(langId);
        }
        set(value) {
            value = value ?? undefined;
            if ((0, resources_1.isEqual)(this._value, value)) {
                return;
            }
            this._value = value;
            this._contextKeyService.bufferChangeEvents(() => {
                this._resourceKey.set(value ? value.toString() : null);
                this._schemeKey.set(value ? value.scheme : null);
                this._filenameKey.set(value ? (0, resources_1.basename)(value) : null);
                this._dirnameKey.set(value ? this.uriToPath((0, resources_1.dirname)(value)) : null);
                this._pathKey.set(value ? this.uriToPath(value) : null);
                this._setLangId();
                this._extensionKey.set(value ? (0, resources_1.extname)(value) : null);
                this._hasResource.set(Boolean(value));
                this._isFileSystemResource.set(value ? this._fileService.hasProvider(value) : false);
            });
        }
        uriToPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return uri.fsPath;
            }
            return uri.path;
        }
        reset() {
            this._value = undefined;
            this._contextKeyService.bufferChangeEvents(() => {
                this._resourceKey.reset();
                this._schemeKey.reset();
                this._filenameKey.reset();
                this._dirnameKey.reset();
                this._pathKey.reset();
                this._langIdKey.reset();
                this._extensionKey.reset();
                this._hasResource.reset();
                this._isFileSystemResource.reset();
            });
        }
        get() {
            return this._value;
        }
    };
    exports.ResourceContextKey = ResourceContextKey;
    exports.ResourceContextKey = ResourceContextKey = ResourceContextKey_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, files_1.IFileService),
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService)
    ], ResourceContextKey);
    //#endregion
    function applyAvailableEditorIds(contextKey, editor, editorResolverService) {
        if (!editor) {
            contextKey.set('');
            return;
        }
        const editorResource = editor.resource;
        const editors = editorResource ? editorResolverService.getEditors(editorResource).map(editor => editor.id) : [];
        if (editorResource?.scheme === network_1.Schemas.untitled && editor.editorId !== editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
            // Non text editor untitled files cannot be easily serialized between extensions
            // so instead we disable this context key to prevent common commands that act on the active editor
            contextKey.set('');
        }
        else {
            contextKey.set(editors.join(','));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2NvbnRleHRrZXlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3SmhHLDREQUFxRztJQW9JckcsMERBZ0JDO0lBNVJELCtCQUErQjtJQUVsQixRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBUyxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSwySUFBMkksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6UixRQUFBLDJCQUEyQixHQUFHLElBQUksMEJBQWEsQ0FBUyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsNkNBQTZDLENBQUMsQ0FBQyxDQUFDO0lBRXBLLFFBQUEsaUNBQWlDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDRCQUE0QixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN6RyxRQUFBLHFDQUFxQyxHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakgsUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRS9GLFFBQUEseUJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG9CQUFvQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLENBQUM7SUFFakwsUUFBQSxpQkFBaUIsR0FBRyxJQUFJLDBCQUFhLENBQVMsWUFBWSxFQUFFLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUscUdBQXFHLENBQUMsQ0FBQyxDQUFDO0lBRS9MLFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGtCQUFrQixFQUFFLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSx1RkFBdUYsQ0FBQyxDQUFDLENBQUM7SUFDbk0sUUFBQSx5QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHNFQUFzRSxDQUFDLENBQUMsQ0FBQztJQUU1TCxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBVSxjQUFjLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDLENBQUM7SUFDN0osUUFBQSwrQkFBK0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsaUNBQWlDLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLHdDQUF3QyxDQUFDLENBQUMsQ0FBQztJQUU5TCxRQUFBLHNCQUFzQixHQUFHLElBQUksMEJBQWEsQ0FBVSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxvRkFBb0Y7SUFFaEwsUUFBQSx5QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQXFCLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxvRkFBb0YsQ0FBQyxDQUFDLENBQUM7SUFFdE8sWUFBWTtJQUdaLDRCQUE0QjtJQUU1Qiw0QkFBNEI7SUFDZixRQUFBLHdCQUF3QixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsK0NBQStDLENBQUMsQ0FBQyxDQUFDO0lBQ3RLLFFBQUEseUJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxrREFBa0QsQ0FBQyxDQUFDLENBQUM7SUFDcEwsUUFBQSwrQkFBK0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsNEJBQTRCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLHlEQUF5RCxDQUFDLENBQUMsQ0FBQztJQUNyTSxRQUFBLDhCQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsd0RBQXdELENBQUMsQ0FBQyxDQUFDO0lBQ2pNLFFBQUEseUJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHNCQUFzQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDLENBQUM7SUFDL0osUUFBQSwyQkFBMkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLHdDQUF3QyxDQUFDLENBQUMsQ0FBQztJQUN4SyxRQUFBLGlDQUFpQyxHQUFHLElBQUksMEJBQWEsQ0FBVSw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsa0RBQWtELENBQUMsQ0FBQyxDQUFDO0lBQ2hNLFFBQUEsb0NBQW9DLEdBQUcsSUFBSSwwQkFBYSxDQUFVLCtCQUErQixFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSwyRUFBMkUsQ0FBQyxDQUFDLENBQUM7SUFDak8sUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHNDQUFzQyxDQUFDLENBQUMsQ0FBQztJQUNySyxRQUFBLGtDQUFrQyxHQUFHLElBQUksMEJBQWEsQ0FBVSw2QkFBNkIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVsSCwyQkFBMkI7SUFDZCxRQUFBLG1CQUFtQixHQUFHLElBQUksMEJBQWEsQ0FBZ0IsY0FBYyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxxQ0FBcUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvSyxRQUFBLHFDQUFxQyxHQUFHLElBQUksMEJBQWEsQ0FBUyxnQ0FBZ0MsRUFBRSxFQUFFLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsd0VBQXdFLENBQUMsQ0FBQyxDQUFDO0lBQzlOLFFBQUEsK0JBQStCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDLENBQUM7SUFDbEwsUUFBQSw4QkFBOEIsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztJQUM5SyxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBVSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUseUNBQXlDLENBQUMsQ0FBQyxDQUFDO0lBRXhMLDRCQUE0QjtJQUNmLFFBQUEsOEJBQThCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLG1CQUFtQixFQUFFLENBQUMsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDLENBQUM7SUFDeEosUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztJQUM1SyxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBUyx3QkFBd0IsRUFBRSxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO0lBQ25LLFFBQUEsNEJBQTRCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxtREFBbUQsQ0FBQyxDQUFDLENBQUM7SUFDbEwsUUFBQSw4QkFBOEIsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLDJDQUEyQyxDQUFDLENBQUMsQ0FBQztJQUNoTCxRQUFBLDJCQUEyQixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsaURBQWlELENBQUMsQ0FBQyxDQUFDO0lBQzdLLFFBQUEseUJBQXlCLEdBQUcsbUNBQTJCLENBQUMsU0FBUyxFQUFFLENBQUM7SUFFakYsMkJBQTJCO0lBQ2QsUUFBQSxxQ0FBcUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0NBQWdDLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLG1FQUFtRSxDQUFDLENBQUMsQ0FBQztJQUM3TixRQUFBLG1DQUFtQyxHQUFHLDZDQUFxQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3hGLFFBQUEscUNBQXFDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdDQUFnQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDLENBQUM7SUFDN0wsUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQztJQUVuTCw2QkFBNkI7SUFDaEIsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsY0FBYyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO0lBQ2pJLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDZCQUE2QixDQUFDLENBQUMsQ0FBQztJQUM5SCxRQUFBLGlDQUFpQyxHQUFHLElBQUksMEJBQWEsQ0FBVSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsd0RBQXdELENBQUMsQ0FBQyxDQUFDO0lBQzVMLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHdCQUF3QixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7SUFDN0osUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHVEQUF1RCxDQUFDLENBQUMsQ0FBQztJQUNyTCxRQUFBLHdCQUF3QixHQUFHLElBQUksMEJBQWEsQ0FBVSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsaUNBQWlDLENBQUMsQ0FBQyxDQUFDO0lBRWhLLFlBQVk7SUFHWiw4QkFBOEI7SUFFakIsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztJQUMxSSxRQUFBLG1CQUFtQixHQUFHLElBQUksMEJBQWEsQ0FBVSxjQUFjLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDLENBQUM7SUFDNUksUUFBQSxvQkFBb0IsR0FBRyxJQUFJLDBCQUFhLENBQVMsZUFBZSxFQUFFLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO0lBRXRKLFlBQVk7SUFHWixnQ0FBZ0M7SUFFbkIsUUFBQSxnQkFBZ0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLDJDQUEyQyxDQUFDLENBQUMsQ0FBQztJQUVqSyxZQUFZO0lBRVosK0JBQStCO0lBRWxCLFFBQUEsb0JBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGVBQWUsRUFBRSxrQkFBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsK0JBQStCLENBQUMsQ0FBQyxDQUFDO0lBQzdKLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGlCQUFpQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7SUFFNUosWUFBWTtJQUdaLDRCQUE0QjtJQUVmLFFBQUEsYUFBYSxHQUFHLElBQUksMEJBQWEsQ0FBVSxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDLENBQUM7SUFFcEosWUFBWTtJQUdaLG1DQUFtQztJQUV0QixRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsMkNBQTJDLENBQUMsQ0FBQyxDQUFDO0lBQy9KLFFBQUEsaUNBQWlDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDLENBQUM7SUFDekwsUUFBQSxpQ0FBaUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztJQUVsTSxZQUFZO0lBR1osbUNBQW1DO0lBRXRCLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDLENBQUM7SUFDdkosUUFBQSx3QkFBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLDhDQUE4QyxDQUFDLENBQUMsQ0FBQztJQUNqSyxRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO0lBRTVLLFlBQVk7SUFHWiwyQkFBMkI7SUFFZCxRQUFBLGtCQUFrQixHQUFHLElBQUksMEJBQWEsQ0FBUyxhQUFhLEVBQUUsRUFBRSxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDLENBQUM7SUFDakksUUFBQSxpQkFBaUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsWUFBWSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO0lBQ3BJLFFBQUEsb0JBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGVBQWUsRUFBRSxRQUFRLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztJQUNySixRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBUyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsMkVBQTJFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZMLFFBQUEsbUJBQW1CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGNBQWMsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLDhCQUE4QixDQUFDLENBQUMsQ0FBQztJQUNsSSxRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0lBRXZKLFlBQVk7SUFHWiwyQkFBMkI7SUFFZCxRQUFBLGtCQUFrQixHQUFHLElBQUksMEJBQWEsQ0FBUyxhQUFhLEVBQUUsRUFBRSxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxvREFBb0QsQ0FBQyxDQUFDLENBQUM7SUFDOUosU0FBZ0Isd0JBQXdCLENBQUMsTUFBYyxJQUFZLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFFckcsWUFBWTtJQUdaLCtCQUErQjtJQUV4QixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjs7UUFFOUIsd0RBQXdEO1FBQ3hELHlEQUF5RDtRQUN6RCx1REFBdUQ7aUJBRXZDLFdBQU0sR0FBRyxJQUFJLDBCQUFhLENBQVMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsNEJBQTRCLENBQUMsRUFBRSxDQUFDLEFBQXBKLENBQXFKO2lCQUMzSixhQUFRLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLCtCQUErQixDQUFDLEVBQUUsQ0FBQyxBQUEzSixDQUE0SjtpQkFDcEssWUFBTyxHQUFHLElBQUksMEJBQWEsQ0FBUyxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSw4Q0FBOEMsQ0FBQyxFQUFFLENBQUMsQUFBeEssQ0FBeUs7aUJBQ2hMLFNBQUksR0FBRyxJQUFJLDBCQUFhLENBQVMsY0FBYyxFQUFFLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSwrQkFBK0IsQ0FBQyxFQUFFLENBQUMsQUFBbkosQ0FBb0o7aUJBQ3hKLFdBQU0sR0FBRyxJQUFJLDBCQUFhLENBQVMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUseUNBQXlDLENBQUMsRUFBRSxDQUFDLEFBQWpLLENBQWtLO2lCQUN4SyxhQUFRLEdBQUcsSUFBSSwwQkFBYSxDQUFTLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsMERBQTBELENBQUMsRUFBRSxDQUFDLEFBQW5LLENBQW9LO2lCQUM1SyxjQUFTLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxBQUE5SixDQUErSjtpQkFDeEssZ0JBQVcsR0FBRyxJQUFJLDBCQUFhLENBQVUsYUFBYSxFQUFFLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxzQ0FBc0MsQ0FBQyxFQUFFLENBQUMsQUFBMUosQ0FBMko7aUJBQ3RLLHlCQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSwwREFBMEQsQ0FBQyxFQUFFLENBQUMsQUFBaE0sQ0FBaU07UUFlck8sWUFDcUIsa0JBQXVELEVBQzdELFlBQTJDLEVBQ3ZDLGdCQUFtRCxFQUN0RCxhQUE2QztZQUh2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzVDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ3RCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDckMsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFqQjVDLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFtQnJELElBQUksQ0FBQyxVQUFVLEdBQUcsb0JBQWtCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFrQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDaEYsSUFBSSxDQUFDLFdBQVcsR0FBRyxvQkFBa0IsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzlFLElBQUksQ0FBQyxRQUFRLEdBQUcsb0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsVUFBVSxHQUFHLG9CQUFrQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLFlBQVksR0FBRyxvQkFBa0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hGLElBQUksQ0FBQyxhQUFhLEdBQUcsb0JBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFrQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDbkYsSUFBSSxDQUFDLHFCQUFxQixHQUFHLG9CQUFrQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUVyRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsMENBQTBDLENBQUMsR0FBRyxFQUFFO2dCQUNsRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxZQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDeEQsSUFBSSxJQUFBLG1CQUFPLEVBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNwQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM5RCxJQUFJLElBQUEsbUJBQU8sRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUN0QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFTyxVQUFVO1lBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxHQUFHLENBQUMsS0FBNkI7WUFDaEMsS0FBSyxHQUFHLEtBQUssSUFBSSxTQUFTLENBQUM7WUFDM0IsSUFBSSxJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxtQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBQSxtQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sU0FBUyxDQUFDLEdBQVE7WUFDekIsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUNuQixDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDeEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUc7WUFDRixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQzs7SUF4SFcsZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUE4QjVCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLHFCQUFhLENBQUE7T0FqQ0gsa0JBQWtCLENBeUg5QjtJQUVELFlBQVk7SUFFWixTQUFnQix1QkFBdUIsQ0FBQyxVQUErQixFQUFFLE1BQXNDLEVBQUUscUJBQTZDO1FBQzdKLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkIsT0FBTztRQUNSLENBQUM7UUFFRCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ3ZDLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRWhILElBQUksY0FBYyxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLG1DQUEwQixDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RHLGdGQUFnRjtZQUNoRixrR0FBa0c7WUFDbEcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQixDQUFDO2FBQU0sQ0FBQztZQUNQLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDRixDQUFDIn0=