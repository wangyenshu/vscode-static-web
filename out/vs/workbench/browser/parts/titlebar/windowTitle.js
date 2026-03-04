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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/workbench/services/environment/browser/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/labels", "vs/platform/label/common/label", "vs/base/common/event", "vs/base/common/async", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/views/common/viewsService", "vs/editor/browser/editorBrowser", "vs/platform/contextkey/common/contextkey", "vs/base/browser/dom"], function (require, exports, nls_1, resources_1, configuration_1, editorService_1, lifecycle_1, editor_1, environmentService_1, workspace_1, platform_1, strings_1, labels_1, label_1, event_1, async_1, productService_1, network_1, virtualWorkspace_1, userDataProfile_1, viewsService_1, editorBrowser_1, contextkey_1, dom_1) {
    "use strict";
    var WindowTitle_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowTitle = exports.defaultWindowTitleSeparator = exports.defaultWindowTitle = void 0;
    var WindowSettingNames;
    (function (WindowSettingNames) {
        WindowSettingNames["titleSeparator"] = "window.titleSeparator";
        WindowSettingNames["title"] = "window.title";
    })(WindowSettingNames || (WindowSettingNames = {}));
    exports.defaultWindowTitle = (() => {
        if (platform_1.isMacintosh && platform_1.isNative) {
            return '${activeEditorShort}${separator}${rootName}${separator}${profileName}'; // macOS has native dirty indicator
        }
        const base = '${dirty}${activeEditorShort}${separator}${rootName}${separator}${profileName}${separator}${appName}';
        if (platform_1.isWeb) {
            return base + '${separator}${remoteName}'; // Web: always show remote name
        }
        return base;
    })();
    exports.defaultWindowTitleSeparator = platform_1.isMacintosh ? ' \u2014 ' : ' - ';
    let WindowTitle = class WindowTitle extends lifecycle_1.Disposable {
        static { WindowTitle_1 = this; }
        static { this.NLS_USER_IS_ADMIN = platform_1.isWindows ? (0, nls_1.localize)('userIsAdmin', "[Administrator]") : (0, nls_1.localize)('userIsSudo', "[Superuser]"); }
        static { this.NLS_EXTENSION_HOST = (0, nls_1.localize)('devExtensionWindowTitlePrefix', "[Extension Development Host]"); }
        static { this.TITLE_DIRTY = '\u25cf '; }
        get value() { return this.title ?? ''; }
        get workspaceName() { return this.labelService.getWorkspaceLabel(this.contextService.getWorkspace()); }
        get fileName() {
            const activeEditor = this.editorService.activeEditor;
            if (!activeEditor) {
                return undefined;
            }
            const fileName = activeEditor.getTitle(0 /* Verbosity.SHORT */);
            const dirty = activeEditor?.isDirty() && !activeEditor.isSaving() ? WindowTitle_1.TITLE_DIRTY : '';
            return `${dirty}${fileName}`;
        }
        constructor(targetWindow, editorGroupsContainer, configurationService, contextKeyService, editorService, environmentService, contextService, labelService, userDataProfileService, productService, viewsService) {
            super();
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.userDataProfileService = userDataProfileService;
            this.productService = productService;
            this.viewsService = viewsService;
            this.properties = { isPure: true, isAdmin: false, prefix: undefined };
            this.variables = new Map();
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.titleUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateTitle(), 0));
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.titleIncludesFocusedView = false;
            this.editorService = editorService.createScoped(editorGroupsContainer, this._store);
            this.windowId = targetWindow.vscodeWindowId;
            this.updateTitleIncludesFocusedView();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChange()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkspaceName(() => this.titleUpdater.schedule()));
            this._register(this.labelService.onDidChangeFormatters(() => this.titleUpdater.schedule()));
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(() => this.titleUpdater.schedule()));
            this._register(this.viewsService.onDidChangeFocusedView(() => {
                if (this.titleIncludesFocusedView) {
                    this.titleUpdater.schedule();
                }
            }));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(this.variables)) {
                    this.titleUpdater.schedule();
                }
            }));
        }
        onConfigurationChanged(event) {
            if (event.affectsConfiguration("window.title" /* WindowSettingNames.title */)) {
                this.updateTitleIncludesFocusedView();
            }
            if (event.affectsConfiguration("window.title" /* WindowSettingNames.title */) || event.affectsConfiguration("window.titleSeparator" /* WindowSettingNames.titleSeparator */)) {
                this.titleUpdater.schedule();
            }
        }
        updateTitleIncludesFocusedView() {
            const titleTemplate = this.configurationService.getValue("window.title" /* WindowSettingNames.title */);
            this.titleIncludesFocusedView = typeof titleTemplate === 'string' && titleTemplate.includes('${focusedView}');
        }
        onActiveEditorChange() {
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Calculate New Window Title
            this.titleUpdater.schedule();
            // Apply listener for dirty and label changes
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                this.activeEditorListeners.add(activeEditor.onDidChangeDirty(() => this.titleUpdater.schedule()));
                this.activeEditorListeners.add(activeEditor.onDidChangeLabel(() => this.titleUpdater.schedule()));
            }
            // Apply listeners for tracking focused code editor
            if (this.titleIncludesFocusedView) {
                const activeTextEditorControl = this.editorService.activeTextEditorControl;
                const textEditorControls = [];
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    textEditorControls.push(activeTextEditorControl);
                }
                else if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                    textEditorControls.push(activeTextEditorControl.getOriginalEditor(), activeTextEditorControl.getModifiedEditor());
                }
                for (const textEditorControl of textEditorControls) {
                    this.activeEditorListeners.add(textEditorControl.onDidBlurEditorText(() => this.titleUpdater.schedule()));
                    this.activeEditorListeners.add(textEditorControl.onDidFocusEditorText(() => this.titleUpdater.schedule()));
                }
            }
        }
        doUpdateTitle() {
            const title = this.getFullWindowTitle();
            if (title !== this.title) {
                // Always set the native window title to identify us properly to the OS
                let nativeTitle = title;
                if (!(0, strings_1.trim)(nativeTitle)) {
                    nativeTitle = this.productService.nameLong;
                }
                const window = (0, dom_1.getWindowById)(this.windowId, true).window;
                if (!window.document.title && platform_1.isMacintosh && nativeTitle === this.productService.nameLong) {
                    // TODO@electron macOS: if we set a window title for
                    // the first time and it matches the one we set in
                    // `windowImpl.ts` somehow the window does not appear
                    // in the "Windows" menu. As such, we set the title
                    // briefly to something different to ensure macOS
                    // recognizes we have a window.
                    // See: https://github.com/microsoft/vscode/issues/191288
                    window.document.title = `${this.productService.nameLong} ${WindowTitle_1.TITLE_DIRTY}`;
                }
                window.document.title = nativeTitle;
                this.title = title;
                this.onDidChangeEmitter.fire();
            }
        }
        getFullWindowTitle() {
            const { prefix, suffix } = this.getTitleDecorations();
            let title = this.getWindowTitle() || this.productService.nameLong;
            if (prefix) {
                title = `${prefix} ${title}`;
            }
            if (suffix) {
                title = `${title} ${suffix}`;
            }
            // Replace non-space whitespace
            return title.replace(/[^\S ]/g, ' ');
        }
        getTitleDecorations() {
            let prefix;
            let suffix;
            if (this.properties.prefix) {
                prefix = this.properties.prefix;
            }
            if (this.environmentService.isExtensionDevelopment) {
                prefix = !prefix
                    ? WindowTitle_1.NLS_EXTENSION_HOST
                    : `${WindowTitle_1.NLS_EXTENSION_HOST} - ${prefix}`;
            }
            if (this.properties.isAdmin) {
                suffix = WindowTitle_1.NLS_USER_IS_ADMIN;
            }
            return { prefix, suffix };
        }
        updateProperties(properties) {
            const isAdmin = typeof properties.isAdmin === 'boolean' ? properties.isAdmin : this.properties.isAdmin;
            const isPure = typeof properties.isPure === 'boolean' ? properties.isPure : this.properties.isPure;
            const prefix = typeof properties.prefix === 'string' ? properties.prefix : this.properties.prefix;
            if (isAdmin !== this.properties.isAdmin || isPure !== this.properties.isPure || prefix !== this.properties.prefix) {
                this.properties.isAdmin = isAdmin;
                this.properties.isPure = isPure;
                this.properties.prefix = prefix;
                this.titleUpdater.schedule();
            }
        }
        registerVariables(variables) {
            let changed = false;
            for (const { name, contextKey } of variables) {
                if (!this.variables.has(contextKey)) {
                    this.variables.set(contextKey, name);
                    changed = true;
                }
            }
            if (changed) {
                this.titleUpdater.schedule();
            }
        }
        /**
         * Possible template values:
         *
         * {activeEditorLong}: e.g. /Users/Development/myFolder/myFileFolder/myFile.txt
         * {activeEditorMedium}: e.g. myFolder/myFileFolder/myFile.txt
         * {activeEditorShort}: e.g. myFile.txt
         * {activeFolderLong}: e.g. /Users/Development/myFolder/myFileFolder
         * {activeFolderMedium}: e.g. myFolder/myFileFolder
         * {activeFolderShort}: e.g. myFileFolder
         * {rootName}: e.g. myFolder1, myFolder2, myFolder3
         * {rootPath}: e.g. /Users/Development
         * {folderName}: e.g. myFolder
         * {folderPath}: e.g. /Users/Development/myFolder
         * {appName}: e.g. VS Code
         * {remoteName}: e.g. SSH
         * {dirty}: indicator
         * {focusedView}: e.g. Terminal
         * {separator}: conditional separator
         */
        getWindowTitle() {
            const editor = this.editorService.activeEditor;
            const workspace = this.contextService.getWorkspace();
            // Compute root
            let root;
            if (workspace.configuration) {
                root = workspace.configuration;
            }
            else if (workspace.folders.length) {
                root = workspace.folders[0].uri;
            }
            // Compute active editor folder
            const editorResource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            let editorFolderResource = editorResource ? (0, resources_1.dirname)(editorResource) : undefined;
            if (editorFolderResource?.path === '.') {
                editorFolderResource = undefined;
            }
            // Compute folder resource
            // Single Root Workspace: always the root single workspace in this case
            // Otherwise: root folder of the currently active file if any
            let folder = undefined;
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                folder = workspace.folders[0];
            }
            else if (editorResource) {
                folder = this.contextService.getWorkspaceFolder(editorResource) ?? undefined;
            }
            // Compute remote
            // vscode-remtoe: use as is
            // otherwise figure out if we have a virtual folder opened
            let remoteName = undefined;
            if (this.environmentService.remoteAuthority && !platform_1.isWeb) {
                remoteName = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.environmentService.remoteAuthority);
            }
            else {
                const virtualWorkspaceLocation = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(workspace);
                if (virtualWorkspaceLocation) {
                    remoteName = this.labelService.getHostLabel(virtualWorkspaceLocation.scheme, virtualWorkspaceLocation.authority);
                }
            }
            // Variables
            const activeEditorShort = editor ? editor.getTitle(0 /* Verbosity.SHORT */) : '';
            const activeEditorMedium = editor ? editor.getTitle(1 /* Verbosity.MEDIUM */) : activeEditorShort;
            const activeEditorLong = editor ? editor.getTitle(2 /* Verbosity.LONG */) : activeEditorMedium;
            const activeFolderShort = editorFolderResource ? (0, resources_1.basename)(editorFolderResource) : '';
            const activeFolderMedium = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource, { relative: true }) : '';
            const activeFolderLong = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource) : '';
            const rootName = this.labelService.getWorkspaceLabel(workspace);
            const rootNameShort = this.labelService.getWorkspaceLabel(workspace, { verbose: 0 /* LabelVerbosity.SHORT */ });
            const rootPath = root ? this.labelService.getUriLabel(root) : '';
            const folderName = folder ? folder.name : '';
            const folderPath = folder ? this.labelService.getUriLabel(folder.uri) : '';
            const dirty = editor?.isDirty() && !editor.isSaving() ? WindowTitle_1.TITLE_DIRTY : '';
            const appName = this.productService.nameLong;
            const profileName = this.userDataProfileService.currentProfile.isDefault ? '' : this.userDataProfileService.currentProfile.name;
            const focusedView = this.viewsService.getFocusedViewName();
            const variables = {};
            for (const [contextKey, name] of this.variables) {
                variables[name] = this.contextKeyService.getContextKeyValue(contextKey) ?? '';
            }
            let titleTemplate = this.configurationService.getValue("window.title" /* WindowSettingNames.title */);
            if (typeof titleTemplate !== 'string') {
                titleTemplate = exports.defaultWindowTitle;
            }
            let separator = this.configurationService.getValue("window.titleSeparator" /* WindowSettingNames.titleSeparator */);
            if (typeof separator !== 'string') {
                separator = exports.defaultWindowTitleSeparator;
            }
            return (0, labels_1.template)(titleTemplate, {
                ...variables,
                activeEditorShort,
                activeEditorLong,
                activeEditorMedium,
                activeFolderShort,
                activeFolderMedium,
                activeFolderLong,
                rootName,
                rootPath,
                rootNameShort,
                folderName,
                folderPath,
                dirty,
                appName,
                remoteName,
                profileName,
                focusedView,
                separator: { label: separator }
            });
        }
        isCustomTitleFormat() {
            const title = this.configurationService.inspect("window.title" /* WindowSettingNames.title */);
            const titleSeparator = this.configurationService.inspect("window.titleSeparator" /* WindowSettingNames.titleSeparator */);
            return title.value !== title.defaultValue || titleSeparator.value !== titleSeparator.defaultValue;
        }
    };
    exports.WindowTitle = WindowTitle;
    exports.WindowTitle = WindowTitle = WindowTitle_1 = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, editorService_1.IEditorService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, label_1.ILabelService),
        __param(8, userDataProfile_1.IUserDataProfileService),
        __param(9, productService_1.IProductService),
        __param(10, viewsService_1.IViewsService)
    ], WindowTitle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93VGl0bGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy90aXRsZWJhci93aW5kb3dUaXRsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkJoRyxJQUFXLGtCQUdWO0lBSEQsV0FBVyxrQkFBa0I7UUFDNUIsOERBQXdDLENBQUE7UUFDeEMsNENBQXNCLENBQUE7SUFDdkIsQ0FBQyxFQUhVLGtCQUFrQixLQUFsQixrQkFBa0IsUUFHNUI7SUFFWSxRQUFBLGtCQUFrQixHQUFHLENBQUMsR0FBRyxFQUFFO1FBQ3ZDLElBQUksc0JBQVcsSUFBSSxtQkFBUSxFQUFFLENBQUM7WUFDN0IsT0FBTyx1RUFBdUUsQ0FBQyxDQUFDLG1DQUFtQztRQUNwSCxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcscUdBQXFHLENBQUM7UUFDbkgsSUFBSSxnQkFBSyxFQUFFLENBQUM7WUFDWCxPQUFPLElBQUksR0FBRywyQkFBMkIsQ0FBQyxDQUFDLCtCQUErQjtRQUMzRSxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1EsUUFBQSwyQkFBMkIsR0FBRyxzQkFBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUVyRSxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsc0JBQVU7O2lCQUVsQixzQkFBaUIsR0FBRyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxBQUFqRyxDQUFrRztpQkFDbkgsdUJBQWtCLEdBQUcsSUFB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