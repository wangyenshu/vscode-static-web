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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/window/common/window", "vs/workbench/services/title/browser/titleService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/window/electron-sandbox/window", "vs/base/browser/browser", "vs/platform/commands/common/commands", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/integrity/common/integrity", "vs/base/common/platform", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/native/common/native", "vs/base/common/path", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/event", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/editor", "vs/platform/ipc/electron-sandbox/services", "vs/platform/progress/common/progress", "vs/base/common/errorMessage", "vs/platform/label/common/label", "vs/base/common/resources", "vs/workbench/services/banner/browser/bannerService", "vs/base/common/codicons", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/utilityProcess/electron-sandbox/utilityProcessWorkerWorkbenchService", "vs/workbench/services/driver/electron-sandbox/driver", "vs/base/browser/window", "vs/workbench/browser/window", "vs/workbench/services/host/browser/host", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/themables", "vs/workbench/common/contributions", "vs/workbench/common/configuration", "vs/platform/hover/browser/hover", "vs/css!./media/window"], function (require, exports, nls_1, uri_1, errors_1, objects_1, dom_1, actions_1, files_1, editor_1, editorService_1, telemetry_1, window_1, titleService_1, workbenchThemeService_1, window_2, browser_1, commands_1, globals_1, workspaceEditing_1, actions_2, menuEntryActionViewItem_1, async_1, lifecycle_1, lifecycle_2, integrity_1, platform_1, productService_1, notification_1, keybinding_1, environmentService_1, accessibility_1, workspace_1, arrays_1, configuration_1, storage_1, types_1, opener_1, network_1, native_1, path_1, tunnel_1, layoutService_1, workingCopyService_1, filesConfigurationService_1, event_1, remoteAuthorityResolver_1, editorGroupsService_1, dialogs_1, log_1, instantiation_1, editor_2, services_1, progress_1, errorMessage_1, label_1, resources_1, bannerService_1, codicons_1, uriIdentity_1, preferences_1, utilityProcessWorkerWorkbenchService_1, driver_1, window_3, window_4, host_1, statusbar_1, actionbar_1, themables_1, contributions_1, configuration_2, hover_1) {
    "use strict";
    var NativeWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWindow = void 0;
    let NativeWindow = NativeWindow_1 = class NativeWindow extends window_4.BaseWindow {
        constructor(editorService, editorGroupService, configurationService, titleService, themeService, notificationService, commandService, keybindingService, telemetryService, workspaceEditingService, fileService, menuService, lifecycleService, integrityService, nativeEnvironmentService, accessibilityService, contextService, openerService, nativeHostService, tunnelService, layoutService, workingCopyService, filesConfigurationService, productService, remoteAuthorityResolverService, dialogService, storageService, logService, instantiationService, sharedProcessService, progressService, labelService, bannerService, uriIdentityService, preferencesService, utilityProcessWorkerWorkbenchService, hostService) {
            super(window_3.mainWindow, undefined, hostService, nativeEnvironmentService);
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.titleService = titleService;
            this.themeService = themeService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.workspaceEditingService = workspaceEditingService;
            this.fileService = fileService;
            this.menuService = menuService;
            this.lifecycleService = lifecycleService;
            this.integrityService = integrityService;
            this.nativeEnvironmentService = nativeEnvironmentService;
            this.accessibilityService = accessibilityService;
            this.contextService = contextService;
            this.openerService = openerService;
            this.nativeHostService = nativeHostService;
            this.tunnelService = tunnelService;
            this.layoutService = layoutService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.productService = productService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.logService = logService;
            this.instantiationService = instantiationService;
            this.sharedProcessService = sharedProcessService;
            this.progressService = progressService;
            this.labelService = labelService;
            this.bannerService = bannerService;
            this.uriIdentityService = uriIdentityService;
            this.preferencesService = preferencesService;
            this.utilityProcessWorkerWorkbenchService = utilityProcessWorkerWorkbenchService;
            this.customTitleContextMenuDisposable = this._register(new lifecycle_1.DisposableStore());
            this.addFoldersScheduler = this._register(new async_1.RunOnceScheduler(() => this.doAddFolders(), 100));
            this.pendingFoldersToAdd = [];
            this.isDocumentedEdited = false;
            this.touchBarDisposables = this._register(new lifecycle_1.DisposableStore());
            //#region Window Zoom
            this.mapWindowIdToZoomStatusEntry = new Map();
            this.configuredWindowZoomLevel = this.resolveConfiguredWindowZoomLevel();
            this.mainPartEditorService = editorService.createScoped('main', this._store);
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // Layout
            this._register((0, dom_1.addDisposableListener)(window_3.mainWindow, dom_1.EventType.RESIZE, () => this.layoutService.layout()));
            // React to editor input changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateTouchbarMenu()));
            // Prevent opening a real URL inside the window
            for (const event of [dom_1.EventType.DRAG_OVER, dom_1.EventType.DROP]) {
                this._register((0, dom_1.addDisposableListener)(window_3.mainWindow.document.body, event, (e) => {
                    dom_1.EventHelper.stop(e);
                }));
            }
            // Support `runAction` event
            globals_1.ipcRenderer.on('vscode:runAction', async (event, request) => {
                const args = request.args || [];
                // If we run an action from the touchbar, we fill in the currently active resource
                // as payload because the touch bar items are context aware depending on the editor
                if (request.from === 'touchbar') {
                    const activeEditor = this.editorService.activeEditor;
                    if (activeEditor) {
                        const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                        if (resource) {
                            args.push(resource);
                        }
                    }
                }
                else {
                    args.push({ from: request.from });
                }
                try {
                    await this.commandService.executeCommand(request.id, ...args);
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: request.id, from: request.from });
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            });
            // Support runKeybinding event
            globals_1.ipcRenderer.on('vscode:runKeybinding', (event, request) => {
                const activeElement = (0, dom_1.getActiveElement)();
                if (activeElement) {
                    this.keybindingService.dispatchByUserSettingsLabel(request.userSettingsLabel, activeElement);
                }
            });
            // Error reporting from main
            globals_1.ipcRenderer.on('vscode:reportError', (event, error) => {
                if (error) {
                    (0, errors_1.onUnexpectedError)(JSON.parse(error));
                }
            });
            // Support openFiles event for existing and new files
            globals_1.ipcRenderer.on('vscode:openFiles', (event, request) => { this.onOpenFiles(request); });
            // Support addFolders event if we have a workspace opened
            globals_1.ipcRenderer.on('vscode:addFolders', (event, request) => { this.onAddFoldersRequest(request); });
            // Message support
            globals_1.ipcRenderer.on('vscode:showInfoMessage', (event, message) => { this.notificationService.info(message); });
            // Shell Environment Issue Notifications
            globals_1.ipcRenderer.on('vscode:showResolveShellEnvError', (event, message) => {
                this.notificationService.prompt(notification_1.Severity.Error, message, [{
                        label: (0, nls_1.localize)('restart', "Restart"),
                        run: () => this.nativeHostService.relaunch()
                    },
                    {
                        label: (0, nls_1.localize)('configure', "Configure"),
                        run: () => this.preferencesService.openUserSettings({ query: 'application.shellEnvironmentResolutionTimeout' })
                    },
                    {
                        label: (0, nls_1.localize)('learnMore', "Learn More"),
                        run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2149667')
                    }]);
            });
            globals_1.ipcRenderer.on('vscode:showCredentialsError', (event, message) => {
                this.notificationService.prompt(notification_1.Severity.Error, (0, nls_1.localize)('keychainWriteError', "Writing login information to the keychain failed with error '{0}'.", message), [{
                        label: (0, nls_1.localize)('troubleshooting', "Troubleshooting Guide"),
                        run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2190713')
                    }]);
            });
            globals_1.ipcRenderer.on('vscode:showTranslatedBuildWarning', (event, message) => {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)("runningTranslated", "You are running an emulated version of {0}. For better performance download the native arm64 version of {0} build for your machine.", this.productService.nameLong), [{
                        label: (0, nls_1.localize)('downloadArmBuild', "Download"),
                        run: () => {
                            const quality = this.productService.quality;
                            const stableURL = 'https://code.visualstudio.com/docs/?dv=osx';
                            const insidersURL = 'https://code.visualstudio.com/docs/?dv=osx&build=insiders';
                            this.openerService.open(quality === 'stable' ? stableURL : insidersURL);
                        }
                    }]);
            });
            // Fullscreen Events
            globals_1.ipcRenderer.on('vscode:enterFullScreen', async () => { (0, browser_1.setFullscreen)(true, window_3.mainWindow); });
            globals_1.ipcRenderer.on('vscode:leaveFullScreen', async () => { (0, browser_1.setFullscreen)(false, window_3.mainWindow); });
            // Proxy Login Dialog
            globals_1.ipcRenderer.on('vscode:openProxyAuthenticationDialog', async (event, payload) => {
                const rememberCredentialsKey = 'window.rememberProxyCredentials';
                const rememberCredentials = this.storageService.getBoolean(rememberCredentialsKey, -1 /* StorageScope.APPLICATION */);
                const result = await this.dialogService.input({
                    type: 'warning',
                    message: (0, nls_1.localize)('proxyAuthRequired', "Proxy Authentication Required"),
                    primaryButton: (0, nls_1.localize)({ key: 'loginButton', comment: ['&& denotes a mnemonic'] }, "&&Log In"),
                    inputs: [
                        { placeholder: (0, nls_1.localize)('username', "Username"), value: payload.username },
                        { placeholder: (0, nls_1.localize)('password', "Password"), type: 'password', value: payload.password }
                    ],
                    detail: (0, nls_1.localize)('proxyDetail', "The proxy {0} requires a username and password.", `${payload.authInfo.host}:${payload.authInfo.port}`),
                    checkbox: {
                        label: (0, nls_1.localize)('rememberCredentials', "Remember my credentials"),
                        checked: rememberCredentials
                    }
                });
                // Reply back to the channel without result to indicate
                // that the login dialog was cancelled
                if (!result.confirmed || !result.values) {
                    globals_1.ipcRenderer.send(payload.replyChannel);
                }
                // Other reply back with the picked credentials
                else {
                    // Update state based on checkbox
                    if (result.checkboxChecked) {
                        this.storageService.store(rememberCredentialsKey, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    }
                    else {
                        this.storageService.remove(rememberCredentialsKey, -1 /* StorageScope.APPLICATION */);
                    }
                    // Reply back to main side with credentials
                    const [username, password] = result.values;
                    globals_1.ipcRenderer.send(payload.replyChannel, { username, password, remember: !!result.checkboxChecked });
                }
            });
            // Accessibility support changed event
            globals_1.ipcRenderer.on('vscode:accessibilitySupportChanged', (event, accessibilitySupportEnabled) => {
                this.accessibilityService.setAccessibilitySupport(accessibilitySupportEnabled ? 2 /* AccessibilitySupport.Enabled */ : 1 /* AccessibilitySupport.Disabled */);
            });
            // Allow to update security settings around allowed UNC Host
            globals_1.ipcRenderer.on('vscode:configureAllowedUNCHost', async (event, host) => {
                if (!platform_1.isWindows) {
                    return; // only supported on Windows
                }
                const allowedUncHosts = new Set();
                const configuredAllowedUncHosts = this.configurationService.getValue('security.allowedUNCHosts') ?? [];
                if (Array.isArray(configuredAllowedUncHosts)) {
                    for (const configuredAllowedUncHost of configuredAllowedUncHosts) {
                        if (typeof configuredAllowedUncHost === 'string') {
                            allowedUncHosts.add(configuredAllowedUncHost);
                        }
                    }
                }
                if (!allowedUncHosts.has(host)) {
                    allowedUncHosts.add(host);
                    await (0, contributions_1.getWorkbenchContribution)(configuration_2.DynamicWorkbenchSecurityConfiguration.ID).ready; // ensure this setting is registered
                    this.configurationService.updateValue('security.allowedUNCHosts', [...allowedUncHosts.values()], 2 /* ConfigurationTarget.USER */);
                }
            });
            // Allow to update security settings around protocol handlers
            globals_1.ipcRenderer.on('vscode:disablePromptForProtocolHandling', (event, kind) => {
                const setting = kind === 'local' ? 'security.promptForLocalFileProtocolHandling' : 'security.promptForRemoteFileProtocolHandling';
                this.configurationService.updateValue(setting, false);
            });
            // Window Zoom
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.zoomLevel') || (e.affectsConfiguration('window.zoomPerWindow') && this.configurationService.getValue('window.zoomPerWindow') === false)) {
                    this.onDidChangeConfiguredWindowZoomLevel();
                }
                else if (e.affectsConfiguration('keyboard.touchbar.enabled') || e.affectsConfiguration('keyboard.touchbar.ignored')) {
                    this.updateTouchbarMenu();
                }
            }));
            this._register((0, browser_1.onDidChangeZoomLevel)(targetWindowId => this.handleOnDidChangeZoomLevel(targetWindowId)));
            this._register(this.editorGroupService.onDidCreateAuxiliaryEditorPart(({ instantiationService, disposables, part }) => {
                this.createWindowZoomStatusEntry(instantiationService, part.windowId, disposables);
            }));
            // Listen to visible editor changes (debounced in case a new editor opens immediately after)
            this._register(event_1.Event.debounce(this.editorService.onDidVisibleEditorsChange, () => undefined, 0, undefined, undefined, undefined, this._store)(() => this.maybeCloseWindow()));
            // Listen to editor closing (if we run with --wait)
            const filesToWait = this.nativeEnvironmentService.filesToWait;
            if (filesToWait) {
                this.trackClosedWaitFiles(filesToWait.waitMarkerFileUri, (0, arrays_1.coalesce)(filesToWait.paths.map(path => path.fileUri)));
            }
            // macOS OS integration
            if (platform_1.isMacintosh) {
                const updateRepresentedFilename = (editorService, targetWindowId) => {
                    const file = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file });
                    // Represented Filename
                    this.nativeHostService.setRepresentedFilename(file?.fsPath ?? '', { targetWindowId });
                    // Custom title menu (main window only currently)
                    if (typeof targetWindowId !== 'number') {
                        this.provideCustomTitleContextMenu(file?.fsPath);
                    }
                };
                this._register(this.mainPartEditorService.onDidActiveEditorChange(() => updateRepresentedFilename(this.mainPartEditorService, undefined)));
                this._register(this.editorGroupService.onDidCreateAuxiliaryEditorPart(({ part, disposables }) => {
                    const auxiliaryEditorService = this.editorService.createScoped(part, disposables);
                    disposables.add(auxiliaryEditorService.onDidActiveEditorChange(() => updateRepresentedFilename(auxiliaryEditorService, part.windowId)));
                }));
            }
            // Maximize/Restore on doubleclick (for macOS custom title)
            if (platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                    const targetWindow = (0, dom_1.getWindow)(container);
                    const targetWindowId = targetWindow.vscodeWindowId;
                    const titlePart = (0, types_1.assertIsDefined)(this.layoutService.getContainer(targetWindow, "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */));
                    disposables.add((0, dom_1.addDisposableListener)(titlePart, dom_1.EventType.DBLCLICK, e => {
                        dom_1.EventHelper.stop(e);
                        this.nativeHostService.handleTitleDoubleClick({ targetWindowId });
                    }));
                }, { container: this.layoutService.mainContainer, disposables: this._store }));
            }
            // Document edited: indicate for dirty working copies
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => {
                const gotDirty = workingCopy.isDirty();
                if (gotDirty && !(workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) && this.filesConfigurationService.hasShortAutoSaveDelay(workingCopy.resource)) {
                    return; // do not indicate dirty of working copies that are auto saved after short delay
                }
                this.updateDocumentEdited(gotDirty ? true : undefined);
            }));
            this.updateDocumentEdited(undefined);
            // Detect minimize / maximize
            this._register(event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidMaximizeWindow, windowId => !!(0, dom_1.hasWindow)(windowId)), windowId => ({ maximized: true, windowId })), event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidUnmaximizeWindow, windowId => !!(0, dom_1.hasWindow)(windowId)), windowId => ({ maximized: false, windowId })))(e => this.layoutService.updateWindowMaximizedState((0, dom_1.getWindowById)(e.windowId).window, e.maximized)));
            this.layoutService.updateWindowMaximizedState(window_3.mainWindow, this.nativeEnvironmentService.window.maximized ?? false);
            // Detect panel position to determine minimum width
            this._register(this.layoutService.onDidChangePanelPosition(pos => this.onDidChangePanelPosition((0, layoutService_1.positionFromString)(pos))));
            this.onDidChangePanelPosition(this.layoutService.getPanelPosition());
            // Lifecycle
            this._register(this.lifecycleService.onBeforeShutdown(e => this.onBeforeShutdown(e)));
            this._register(this.lifecycleService.onBeforeShutdownError(e => this.onBeforeShutdownError(e)));
            this._register(this.lifecycleService.onWillShutdown(e => this.onWillShutdown(e)));
        }
        //#region Window Lifecycle
        onBeforeShutdown({ veto, reason }) {
            if (reason === 1 /* ShutdownReason.CLOSE */) {
                const confirmBeforeCloseSetting = this.configurationService.getValue('window.confirmBeforeClose');
                const confirmBeforeClose = confirmBeforeCloseSetting === 'always' || (confirmBeforeCloseSetting === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed);
                if (confirmBeforeClose) {
                    // When we need to confirm on close or quit, veto the shutdown
                    // with a long running promise to figure out whether shutdown
                    // can proceed or not.
                    return veto((async () => {
                        let actualReason = reason;
                        if (reason === 1 /* ShutdownReason.CLOSE */ && !platform_1.isMacintosh) {
                            const windowCount = await this.nativeHostService.getWindowCount();
                            if (windowCount === 1) {
                                actualReason = 2 /* ShutdownReason.QUIT */; // Windows/Linux: closing last window means to QUIT
                            }
                        }
                        let confirmed = true;
                        if (confirmBeforeClose) {
                            confirmed = await this.instantiationService.invokeFunction(accessor => NativeWindow_1.confirmOnShutdown(accessor, actualReason));
                        }
                        // Progress for long running shutdown
                        if (confirmed) {
                            this.progressOnBeforeShutdown(reason);
                        }
                        return !confirmed;
                    })(), 'veto.confirmBeforeClose');
                }
            }
            // Progress for long running shutdown
            this.progressOnBeforeShutdown(reason);
        }
        progressOnBeforeShutdown(reason) {
            this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */, // use window progress to not be too annoying about this operation
                delay: 800, // delay so that it only appears when operation takes a long time
                title: this.toShutdownLabel(reason, false),
            }, () => {
                return event_1.Event.toPromise(event_1.Event.any(this.lifecycleService.onWillShutdown, // dismiss this dialog when we shutdown
                this.lifecycleService.onShutdownVeto, // or when shutdown was vetoed
                this.dialogService.onWillShowDialog // or when a dialog asks for input
                ));
            });
        }
        onBeforeShutdownError({ error, reason }) {
            this.dialogService.error(this.toShutdownLabel(reason, true), (0, nls_1.localize)('shutdownErrorDetail', "Error: {0}", (0, errorMessage_1.toErrorMessage)(error)));
        }
        onWillShutdown({ reason, force, joiners }) {
            // Delay so that the dialog only appears after timeout
            const shutdownDialogScheduler = new async_1.RunOnceScheduler(() => {
                const pendingJoiners = joiners();
                this.progressService.withProgress({
                    location: 20 /* ProgressLocation.Dialog */, // use a dialog to prevent the user from making any more interactions now
                    buttons: [this.toForceShutdownLabel(reason)], // allow to force shutdown anyway
                    cancellable: false, // do not allow to cancel
                    sticky: true, // do not allow to dismiss
                    title: this.toShutdownLabel(reason, false),
                    detail: pendingJoiners.length > 0 ? (0, nls_1.localize)('willShutdownDetail', "The following operations are still running: \n{0}", pendingJoiners.map(joiner => `- ${joiner.label}`).join('\n')) : undefined
                }, () => {
                    return event_1.Event.toPromise(this.lifecycleService.onDidShutdown); // dismiss this dialog when we actually shutdown
                }, () => {
                    force();
                });
            }, 1200);
            shutdownDialogScheduler.schedule();
            // Dispose scheduler when we actually shutdown
            event_1.Event.once(this.lifecycleService.onDidShutdown)(() => shutdownDialogScheduler.dispose());
        }
        toShutdownLabel(reason, isError) {
            if (isError) {
                switch (reason) {
                    case 1 /* ShutdownReason.CLOSE */:
                        return (0, nls_1.localize)('shutdownErrorClose', "An unexpected error prevented the window to close");
                    case 2 /* ShutdownReason.QUIT */:
                        return (0, nls_1.localize)('shutdownErrorQuit', "An unexpected error prevented the application to quit");
                    case 3 /* ShutdownReason.RELOAD */:
                        return (0, nls_1.localize)('shutdownErrorReload', "An unexpected error prevented the window to reload");
                    case 4 /* ShutdownReason.LOAD */:
                        return (0, nls_1.localize)('shutdownErrorLoad', "An unexpected error prevented to change the workspace");
                }
            }
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    return (0, nls_1.localize)('shutdownTitleClose', "Closing the window is taking a bit longer...");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownTitleQuit', "Quitting the application is taking a bit longer...");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownTitleReload', "Reloading the window is taking a bit longer...");
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownTitleLoad', "Changing the workspace is taking a bit longer...");
            }
        }
        toForceShutdownLabel(reason) {
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    return (0, nls_1.localize)('shutdownForceClose', "Close Anyway");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownForceQuit', "Quit Anyway");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownForceReload', "Reload Anyway");
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownForceLoad', "Change Anyway");
            }
        }
        //#endregion
        updateDocumentEdited(documentEdited) {
            let setDocumentEdited;
            if (typeof documentEdited === 'boolean') {
                setDocumentEdited = documentEdited;
            }
            else {
                setDocumentEdited = this.workingCopyService.hasDirty;
            }
            if ((!this.isDocumentedEdited && setDocumentEdited) || (this.isDocumentedEdited && !setDocumentEdited)) {
                this.isDocumentedEdited = setDocumentEdited;
                this.nativeHostService.setDocumentEdited(setDocumentEdited);
            }
        }
        getWindowMinimumWidth(panelPosition = this.layoutService.getPanelPosition()) {
            // if panel is on the side, then return the larger minwidth
            const panelOnSide = panelPosition === 0 /* Position.LEFT */ || panelPosition === 1 /* Position.RIGHT */;
            if (panelOnSide) {
                return window_1.WindowMinimumSize.WIDTH_WITH_VERTICAL_PANEL;
            }
            return window_1.WindowMinimumSize.WIDTH;
        }
        onDidChangePanelPosition(pos) {
            const minWidth = this.getWindowMinimumWidth(pos);
            this.nativeHostService.setMinimumSize(minWidth, undefined);
        }
        maybeCloseWindow() {
            const closeWhenEmpty = this.configurationService.getValue('window.closeWhenEmpty') || this.nativeEnvironmentService.args.wait;
            if (!closeWhenEmpty) {
                return; // return early if configured to not close when empty
            }
            // Close empty editor groups based on setting and environment
            for (const editorPart of this.editorGroupService.parts) {
                if (editorPart.groups.some(group => !group.isEmpty)) {
                    continue; // not empty
                }
                if (editorPart === this.editorGroupService.mainPart && (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ || // only for empty windows
                    this.environmentService.isExtensionDevelopment || // not when developing an extension
                    this.editorService.visibleEditors.length > 0 // not when there are still editors open in other windows
                )) {
                    continue;
                }
                if (editorPart === this.editorGroupService.mainPart) {
                    this.nativeHostService.closeWindow();
                }
                else {
                    editorPart.removeGroup(editorPart.activeGroup);
                }
            }
        }
        provideCustomTitleContextMenu(filePath) {
            // Clear old menu
            this.customTitleContextMenuDisposable.clear();
            // Provide new menu if a file is opened and we are on a custom title
            if (!filePath || !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                return;
            }
            // Split up filepath into segments
            const segments = filePath.split(path_1.posix.sep);
            for (let i = segments.length; i > 0; i--) {
                const isFile = (i === segments.length);
                let pathOffset = i;
                if (!isFile) {
                    pathOffset++; // for segments which are not the file name we want to open the folder
                }
                const path = uri_1.URI.file(segments.slice(0, pathOffset).join(path_1.posix.sep));
                let label;
                if (!isFile) {
                    label = this.labelService.getUriBasenameLabel((0, resources_1.dirname)(path));
                }
                else {
                    label = this.labelService.getUriBasenameLabel(path);
                }
                const commandId = `workbench.action.revealPathInFinder${i}`;
                this.customTitleContextMenuDisposable.add(commands_1.CommandsRegistry.registerCommand(commandId, () => this.nativeHostService.showItemInFolder(path.fsPath)));
                this.customTitleContextMenuDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TitleBarTitleContext, { command: { id: commandId, title: label || path_1.posix.sep }, order: -i, group: '1_file' }));
            }
        }
        create() {
            // Handle open calls
            this.setupOpenHandlers();
            // Notify some services about lifecycle phases
            this.lifecycleService.when(2 /* LifecyclePhase.Ready */).then(() => this.nativeHostService.notifyReady());
            this.lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                this.sharedProcessService.notifyRestored();
                this.utilityProcessWorkerWorkbenchService.notifyRestored();
            });
            // Check for situations that are worth warning the user about
            this.handleWarnings();
            // Touchbar menu (if enabled)
            this.updateTouchbarMenu();
            // Zoom status
            for (const { window, disposables } of (0, dom_1.getWindows)()) {
                this.createWindowZoomStatusEntry(this.instantiationService, window.vscodeWindowId, disposables);
            }
            // Smoke Test Driver
            if (this.environmentService.enableSmokeTestDriver) {
                this.setupDriver();
            }
        }
        async handleWarnings() {
            // Check for cyclic dependencies
            if (typeof require.hasDependencyCycle === 'function' && require.hasDependencyCycle()) {
                if (platform_1.isCI) {
                    this.logService.error('Error: There is a dependency cycle in the AMD modules that needs to be resolved!');
                    this.nativeHostService.exit(37); // running on a build machine, just exit without showing a dialog
                }
                else {
                    this.dialogService.error((0, nls_1.localize)('loaderCycle', "There is a dependency cycle in the AMD modules that needs to be resolved!"));
                    this.nativeHostService.openDevTools();
                }
            }
            // After restored phase is fine for the following ones
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Integrity / Root warning
            (async () => {
                const isAdmin = await this.nativeHostService.isAdmin();
                const { isPure } = await this.integrityService.isPure();
                // Update to title
                this.titleService.updateProperties({ isPure, isAdmin });
                // Show warning message (unix only)
                if (isAdmin && !platform_1.isWindows) {
                    this.notificationService.warn((0, nls_1.localize)('runningAsRoot', "It is not recommended to run {0} as root user.", this.productService.nameShort));
                }
            })();
            // Installation Dir Warning
            if (this.environmentService.isBuilt) {
                let installLocationUri;
                if (platform_1.isMacintosh) {
                    // appRoot = /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app
                    installLocationUri = (0, resources_1.dirname)((0, resources_1.dirname)((0, resources_1.dirname)(uri_1.URI.file(this.nativeEnvironmentService.appRoot))));
                }
                else {
                    // appRoot = C:\Users\<name>\AppData\Local\Programs\Microsoft VS Code Insiders\resources\app
                    // appRoot = /usr/share/code-insiders/resources/app
                    installLocationUri = (0, resources_1.dirname)((0, resources_1.dirname)(uri_1.URI.file(this.nativeEnvironmentService.appRoot)));
                }
                for (const folder of this.contextService.getWorkspace().folders) {
                    if (this.uriIdentityService.extUri.isEqualOrParent(folder.uri, installLocationUri)) {
                        this.bannerService.show({
                            id: 'appRootWarning.banner',
                            message: (0, nls_1.localize)('appRootWarning.banner', "Files you store within the installation folder ('{0}') may be OVERWRITTEN or DELETED IRREVERSIBLY without warning at update time.", this.labelService.getUriLabel(installLocationUri)),
                            icon: codicons_1.Codicon.warning
                        });
                        break;
                    }
                }
            }
            // macOS 10.13 and 10.14 warning
            if (platform_1.isMacintosh) {
                const majorVersion = this.nativeEnvironmentService.os.release.split('.')[0];
                const eolReleases = new Map([
                    ['17', 'macOS High Sierra'],
                    ['18', 'macOS Mojave'],
                ]);
                if (eolReleases.has(majorVersion)) {
                    const message = (0, nls_1.localize)('macoseolmessage', "{0} on {1} will soon stop receiving updates. Consider upgrading your macOS version.", this.productService.nameLong, eolReleases.get(majorVersion));
                    this.notificationService.prompt(notification_1.Severity.Warning, message, [{
                            label: (0, nls_1.localize)('learnMore', "Learn More"),
                            run: () => this.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-faq-old-macOS'))
                        }], {
                        neverShowAgain: { id: 'macoseol', isSecondary: true, scope: notification_1.NeverShowAgainScope.APPLICATION },
                        priority: notification_1.NotificationPriority.URGENT,
                        sticky: true
                    });
                }
            }
            // Slow shell environment progress indicator
            const shellEnv = globals_1.process.shellEnv();
            this.progressService.withProgress({
                title: (0, nls_1.localize)('resolveShellEnvironment', "Resolving shell environment..."),
                location: 10 /* ProgressLocation.Window */,
                delay: 1600,
                buttons: [(0, nls_1.localize)('learnMore', "Learn More")]
            }, () => shellEnv, () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2149667'));
        }
        setupDriver() {
            const that = this;
            let pendingQuit = false;
            (0, driver_1.registerWindowDriver)(this.instantiationService, {
                async exitApplication() {
                    if (pendingQuit) {
                        that.logService.info('[driver] not handling exitApplication() due to pending quit() call');
                        return;
                    }
                    that.logService.info('[driver] handling exitApplication()');
                    pendingQuit = true;
                    return that.nativeHostService.quit();
                }
            });
        }
        async openTunnel(address, port) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            const addressProvider = remoteAuthority ? {
                getAddress: async () => {
                    return (await this.remoteAuthorityResolverService.resolveAuthority(remoteAuthority)).authority;
                }
            } : undefined;
            const tunnel = await this.tunnelService.getExistingTunnel(address, port);
            if (!tunnel || (typeof tunnel === 'string')) {
                return this.tunnelService.openTunnel(addressProvider, address, port);
            }
            return tunnel;
        }
        async resolveExternalUri(uri, options) {
            let queryTunnel;
            if (options?.allowTunneling) {
                const portMappingRequest = (0, tunnel_1.extractLocalHostUriMetaDataForPortMapping)(uri);
                const queryPortMapping = (0, tunnel_1.extractQueryLocalHostUriMetaDataForPortMapping)(uri);
                if (queryPortMapping) {
                    queryTunnel = await this.openTunnel(queryPortMapping.address, queryPortMapping.port);
                    if (queryTunnel && (typeof queryTunnel !== 'string')) {
                        // If the tunnel was mapped to a different port, dispose it, because some services
                        // validate the port number in the query string.
                        if (queryTunnel.tunnelRemotePort !== queryPortMapping.port) {
                            queryTunnel.dispose();
                            queryTunnel = undefined;
                        }
                        else {
                            if (!portMappingRequest) {
                                const tunnel = queryTunnel;
                                return {
                                    resolved: uri,
                                    dispose: () => tunnel.dispose()
                                };
                            }
                        }
                    }
                }
                if (portMappingRequest) {
                    const tunnel = await this.openTunnel(portMappingRequest.address, portMappingRequest.port);
                    if (tunnel && (typeof tunnel !== 'string')) {
                        const addressAsUri = uri_1.URI.parse(tunnel.localAddress);
                        const resolved = addressAsUri.scheme.startsWith(uri.scheme) ? addressAsUri : uri.with({ authority: tunnel.localAddress });
                        return {
                            resolved,
                            dispose() {
                                tunnel.dispose();
                                if (queryTunnel && (typeof queryTunnel !== 'string')) {
                                    queryTunnel.dispose();
                                }
                            }
                        };
                    }
                }
            }
            if (!options?.openExternal) {
                const canHandleResource = await this.fileService.canHandleResource(uri);
                if (canHandleResource) {
                    return {
                        resolved: uri_1.URI.from({
                            scheme: this.productService.urlProtocol,
                            path: 'workspace',
                            query: uri.toString()
                        }),
                        dispose() { }
                    };
                }
            }
            return undefined;
        }
        setupOpenHandlers() {
            // Handle external open() calls
            this.openerService.setDefaultExternalOpener({
                openExternal: async (href) => {
                    const success = await this.nativeHostService.openExternal(href);
                    if (!success) {
                        const fileCandidate = uri_1.URI.parse(href);
                        if (fileCandidate.scheme === network_1.Schemas.file) {
                            // if opening failed, and this is a file, we can still try to reveal it
                            await this.nativeHostService.showItemInFolder(fileCandidate.fsPath);
                        }
                    }
                    return true;
                }
            });
            // Register external URI resolver
            this.openerService.registerExternalUriResolver({
                resolveExternalUri: async (uri, options) => {
                    return this.resolveExternalUri(uri, options);
                }
            });
        }
        updateTouchbarMenu() {
            if (!platform_1.isMacintosh) {
                return; // macOS only
            }
            // Dispose old
            this.touchBarDisposables.clear();
            this.touchBarMenu = undefined;
            // Create new (delayed)
            const scheduler = this.touchBarDisposables.add(new async_1.RunOnceScheduler(() => this.doUpdateTouchbarMenu(scheduler), 300));
            scheduler.schedule();
        }
        doUpdateTouchbarMenu(scheduler) {
            if (!this.touchBarMenu) {
                const scopedContextKeyService = this.editorService.activeEditorPane?.scopedContextKeyService || this.editorGroupService.activeGroup.scopedContextKeyService;
                this.touchBarMenu = this.menuService.createMenu(actions_2.MenuId.TouchBarContext, scopedContextKeyService);
                this.touchBarDisposables.add(this.touchBarMenu);
                this.touchBarDisposables.add(this.touchBarMenu.onDidChange(() => scheduler.schedule()));
            }
            const actions = [];
            const disabled = this.configurationService.getValue('keyboard.touchbar.enabled') === false;
            const touchbarIgnored = this.configurationService.getValue('keyboard.touchbar.ignored');
            const ignoredItems = Array.isArray(touchbarIgnored) ? touchbarIgnored : [];
            // Fill actions into groups respecting order
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.touchBarMenu, undefined, actions);
            // Convert into command action multi array
            const items = [];
            let group = [];
            if (!disabled) {
                for (const action of actions) {
                    // Command
                    if (action instanceof actions_2.MenuItemAction) {
                        if (ignoredItems.indexOf(action.item.id) >= 0) {
                            continue; // ignored
                        }
                        group.push(action.item);
                    }
                    // Separator
                    else if (action instanceof actions_1.Separator) {
                        if (group.length) {
                            items.push(group);
                        }
                        group = [];
                    }
                }
                if (group.length) {
                    items.push(group);
                }
            }
            // Only update if the actions have changed
            if (!(0, objects_1.equals)(this.lastInstalledTouchedBar, items)) {
                this.lastInstalledTouchedBar = items;
                this.nativeHostService.updateTouchBar(items);
            }
        }
        //#endregion
        onAddFoldersRequest(request) {
            // Buffer all pending requests
            this.pendingFoldersToAdd.push(...request.foldersToAdd.map(folder => uri_1.URI.revive(folder)));
            // Delay the adding of folders a bit to buffer in case more requests are coming
            if (!this.addFoldersScheduler.isScheduled()) {
                this.addFoldersScheduler.schedule();
            }
        }
        doAddFolders() {
            const foldersToAdd = [];
            for (const folder of this.pendingFoldersToAdd) {
                foldersToAdd.push(({ uri: folder }));
            }
            this.pendingFoldersToAdd = [];
            this.workspaceEditingService.addFolders(foldersToAdd);
        }
        async onOpenFiles(request) {
            const diffMode = !!(request.filesToDiff && (request.filesToDiff.length === 2));
            const mergeMode = !!(request.filesToMerge && (request.filesToMerge.length === 4));
            const inputs = (0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(mergeMode ? request.filesToMerge : diffMode ? request.filesToDiff : request.filesToOpenOrCreate, this.fileService, this.logService));
            if (inputs.length) {
                const openedEditorPanes = await this.openResources(inputs, diffMode, mergeMode);
                if (request.filesToWait) {
                    // In wait mode, listen to changes to the editors and wait until the files
                    // are closed that the user wants to wait for. When this happens we delete
                    // the wait marker file to signal to the outside that editing is done.
                    // However, it is possible that opening of the editors failed, as such we
                    // check for whether editor panes got opened and otherwise delete the marker
                    // right away.
                    if (openedEditorPanes.length) {
                        return this.trackClosedWaitFiles(uri_1.URI.revive(request.filesToWait.waitMarkerFileUri), (0, arrays_1.coalesce)(request.filesToWait.paths.map(path => uri_1.URI.revive(path.fileUri))));
                    }
                    else {
                        return this.fileService.del(uri_1.URI.revive(request.filesToWait.waitMarkerFileUri));
                    }
                }
            }
        }
        async trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor) {
            // Wait for the resources to be closed in the text editor...
            await this.instantiationService.invokeFunction(accessor => (0, editor_2.whenEditorClosed)(accessor, resourcesToWaitFor));
            // ...before deleting the wait marker file
            await this.fileService.del(waitMarkerFile);
        }
        async openResources(resources, diffMode, mergeMode) {
            const editors = [];
            if (mergeMode && (0, editor_1.isResourceEditorInput)(resources[0]) && (0, editor_1.isResourceEditorInput)(resources[1]) && (0, editor_1.isResourceEditorInput)(resources[2]) && (0, editor_1.isResourceEditorInput)(resources[3])) {
                const mergeEditor = {
                    input1: { resource: resources[0].resource },
                    input2: { resource: resources[1].resource },
                    base: { resource: resources[2].resource },
                    result: { resource: resources[3].resource },
                    options: { pinned: true }
                };
                editors.push(mergeEditor);
            }
            else if (diffMode && (0, editor_1.isResourceEditorInput)(resources[0]) && (0, editor_1.isResourceEditorInput)(resources[1])) {
                const diffEditor = {
                    original: { resource: resources[0].resource },
                    modified: { resource: resources[1].resource },
                    options: { pinned: true }
                };
                editors.push(diffEditor);
            }
            else {
                editors.push(...resources);
            }
            return this.editorService.openEditors(editors, undefined, { validateTrust: true });
        }
        resolveConfiguredWindowZoomLevel() {
            const windowZoomLevel = this.configurationService.getValue('window.zoomLevel');
            return typeof windowZoomLevel === 'number' ? windowZoomLevel : 0;
        }
        handleOnDidChangeZoomLevel(targetWindowId) {
            // Zoom status entry
            this.updateWindowZoomStatusEntry(targetWindowId);
            // Notify main process about a custom zoom level
            if (targetWindowId === window_3.mainWindow.vscodeWindowId) {
                const currentWindowZoomLevel = (0, browser_1.getZoomLevel)(window_3.mainWindow);
                let notifyZoomLevel = undefined;
                if (this.configuredWindowZoomLevel !== currentWindowZoomLevel) {
                    notifyZoomLevel = currentWindowZoomLevel;
                }
                globals_1.ipcRenderer.invoke('vscode:notifyZoomLevel', notifyZoomLevel);
            }
        }
        createWindowZoomStatusEntry(instantiationService, targetWindowId, disposables) {
            this.mapWindowIdToZoomStatusEntry.set(targetWindowId, disposables.add(instantiationService.createInstance(ZoomStatusEntry)));
            disposables.add((0, lifecycle_1.toDisposable)(() => this.mapWindowIdToZoomStatusEntry.delete(targetWindowId)));
            this.updateWindowZoomStatusEntry(targetWindowId);
        }
        updateWindowZoomStatusEntry(targetWindowId) {
            const targetWindow = (0, dom_1.getWindowById)(targetWindowId);
            const entry = this.mapWindowIdToZoomStatusEntry.get(targetWindowId);
            if (entry && targetWindow) {
                const currentZoomLevel = (0, browser_1.getZoomLevel)(targetWindow.window);
                let text = undefined;
                if (currentZoomLevel < this.configuredWindowZoomLevel) {
                    text = '$(zoom-out)';
                }
                else if (currentZoomLevel > this.configuredWindowZoomLevel) {
                    text = '$(zoom-in)';
                }
                entry.updateZoomEntry(text ?? false, targetWindowId);
            }
        }
        onDidChangeConfiguredWindowZoomLevel() {
            this.configuredWindowZoomLevel = this.resolveConfiguredWindowZoomLevel();
            let applyZoomLevel = false;
            for (const { window } of (0, dom_1.getWindows)()) {
                if ((0, browser_1.getZoomLevel)(window) !== this.configuredWindowZoomLevel) {
                    applyZoomLevel = true;
                    break;
                }
            }
            if (applyZoomLevel) {
                (0, window_2.applyZoom)(this.configuredWindowZoomLevel, window_2.ApplyZoomTarget.ALL_WINDOWS);
            }
            for (const [windowId] of this.mapWindowIdToZoomStatusEntry) {
                this.updateWindowZoomStatusEntry(windowId);
            }
        }
        //#endregion
        dispose() {
            super.dispose();
            for (const [, entry] of this.mapWindowIdToZoomStatusEntry) {
                entry.dispose();
            }
        }
    };
    exports.NativeWindow = NativeWindow;
    exports.NativeWindow = NativeWindow = NativeWindow_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, titleService_1.ITitleService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, notification_1.INotificationService),
        __param(6, commands_1.ICommandService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, workspaceEditing_1.IWorkspaceEditingService),
        __param(10, files_1.IFileService),
        __param(11, actions_2.IMenuService),
        __param(12, lifecycle_2.ILifecycleService),
        __param(13, integrity_1.IIntegrityService),
        __param(14, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(15, accessibility_1.IAccessibilityService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, opener_1.IOpenerService),
        __param(18, native_1.INativeHostService),
        __param(19, tunnel_1.ITunnelService),
        __param(20, layoutService_1.IWorkbenchLayoutService),
        __param(21, workingCopyService_1.IWorkingCopyService),
        __param(22, filesConfigurationService_1.IFilesConfigurationService),
        __param(23, productService_1.IProductService),
        __param(24, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(25, dialogs_1.IDialogService),
        __param(26, storage_1.IStorageService),
        __param(27, log_1.ILogService),
        __param(28, instantiation_1.IInstantiationService),
        __param(29, services_1.ISharedProcessService),
        __param(30, progress_1.IProgressService),
        __param(31, label_1.ILabelService),
        __param(32, bannerService_1.IBannerService),
        __param(33, uriIdentity_1.IUriIdentityService),
        __param(34, preferences_1.IPreferencesService),
        __param(35, utilityProcessWorkerWorkbenchService_1.IUtilityProcessWorkerWorkbenchService),
        __param(36, host_1.IHostService)
    ], NativeWindow);
    let ZoomStatusEntry = class ZoomStatusEntry extends lifecycle_1.Disposable {
        constructor(statusbarService, commandService, keybindingService) {
            super();
            this.statusbarService = statusbarService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.disposable = this._register(new lifecycle_1.MutableDisposable());
            this.zoomLevelLabel = undefined;
        }
        updateZoomEntry(visibleOrText, targetWindowId) {
            if (typeof visibleOrText === 'string') {
                if (!this.disposable.value) {
                    this.createZoomEntry(targetWindowId, visibleOrText);
                }
                this.updateZoomLevelLabel(targetWindowId);
            }
            else {
                this.disposable.clear();
            }
        }
        createZoomEntry(targetWindowId, visibleOrText) {
            const disposables = new lifecycle_1.DisposableStore();
            this.disposable.value = disposables;
            const container = document.createElement('div');
            container.classList.add('zoom-status');
            const left = document.createElement('div');
            left.classList.add('zoom-status-left');
            container.appendChild(left);
            const zoomOutAction = disposables.add(new actions_1.Action('workbench.action.zoomOut', (0, nls_1.localize)('zoomOut', "Zoom Out"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.remove), true, () => this.commandService.executeCommand(zoomOutAction.id)));
            const zoomInAction = disposables.add(new actions_1.Action('workbench.action.zoomIn', (0, nls_1.localize)('zoomIn', "Zoom In"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.plus), true, () => this.commandService.executeCommand(zoomInAction.id)));
            const zoomResetAction = disposables.add(new actions_1.Action('workbench.action.zoomReset', (0, nls_1.localize)('zoomReset', "Reset"), undefined, true, () => this.commandService.executeCommand(zoomResetAction.id)));
            zoomResetAction.tooltip = (0, nls_1.localize)('zoomResetLabel', "{0} ({1})", zoomResetAction.label, this.keybindingService.lookupKeybinding(zoomResetAction.id)?.getLabel());
            const zoomSettingsAction = disposables.add(new actions_1.Action('workbench.action.openSettings', (0, nls_1.localize)('zoomSettings', "Settings"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.settingsGear), true, () => this.commandService.executeCommand(zoomSettingsAction.id, 'window.zoom')));
            const zoomLevelLabel = disposables.add(new actions_1.Action('zoomLabel', undefined, undefined, false));
            this.zoomLevelLabel = zoomLevelLabel;
            disposables.add((0, lifecycle_1.toDisposable)(() => this.zoomLevelLabel = undefined));
            const actionBarLeft = disposables.add(new actionbar_1.ActionBar(left, { hoverDelegate: hover_1.nativeHoverDelegate }));
            actionBarLeft.push(zoomOutAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(zoomOutAction.id)?.getLabel() });
            actionBarLeft.push(this.zoomLevelLabel, { icon: false, label: true });
            actionBarLeft.push(zoomInAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(zoomInAction.id)?.getLabel() });
            const right = document.createElement('div');
            right.classList.add('zoom-status-right');
            container.appendChild(right);
            const actionBarRight = disposables.add(new actionbar_1.ActionBar(right, { hoverDelegate: hover_1.nativeHoverDelegate }));
            actionBarRight.push(zoomResetAction, { icon: false, label: true });
            actionBarRight.push(zoomSettingsAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(zoomSettingsAction.id)?.getLabel() });
            const name = (0, nls_1.localize)('status.windowZoom', "Window Zoom");
            disposables.add(this.statusbarService.addEntry({
                name,
                text: visibleOrText,
                tooltip: container,
                ariaLabel: name,
                command: statusbar_1.ShowTooltipCommand,
                kind: 'prominent'
            }, 'status.windowZoom', 1 /* StatusbarAlignment.RIGHT */, 102));
        }
        updateZoomLevelLabel(targetWindowId) {
            if (this.zoomLevelLabel) {
                const targetWindow = (0, dom_1.getWindowById)(targetWindowId, true).window;
                const zoomFactor = Math.round((0, browser_1.getZoomFactor)(targetWindow) * 100);
                const zoomLevel = (0, browser_1.getZoomLevel)(targetWindow);
                this.zoomLevelLabel.label = `${zoomLevel}`;
                this.zoomLevelLabel.tooltip = (0, nls_1.localize)('zoomNumber', "Zoom Level: {0} ({1}%)", zoomLevel, zoomFactor);
            }
        }
    };
    ZoomStatusEntry = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, commands_1.ICommandService),
        __param(2, keybinding_1.IKeybindingService)
    ], ZoomStatusEntry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvd2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnRnpGLElBQU0sWUFBWSxvQkFBbEIsTUFBTSxZQUFhLFNBQVEsbUJBQVU7UUFXM0MsWUFDaUIsYUFBOEMsRUFDeEMsa0JBQXlELEVBQ3hELG9CQUE0RCxFQUNwRSxZQUE0QyxFQUNuQyxZQUE4QyxFQUNoRCxtQkFBMEQsRUFDL0QsY0FBZ0QsRUFDN0MsaUJBQXNELEVBQ3ZELGdCQUFvRCxFQUM3Qyx1QkFBa0UsRUFDOUUsV0FBMEMsRUFDMUMsV0FBMEMsRUFDckMsZ0JBQW9ELEVBQ3BELGdCQUFvRCxFQUNuQyx3QkFBNkUsRUFDMUYsb0JBQTRELEVBQ3pELGNBQXlELEVBQ25FLGFBQThDLEVBQzFDLGlCQUFzRCxFQUMxRCxhQUE4QyxFQUNyQyxhQUF1RCxFQUMzRCxrQkFBd0QsRUFDakQseUJBQXNFLEVBQ2pGLGNBQWdELEVBQ2hDLDhCQUFnRixFQUNqRyxhQUE4QyxFQUM3QyxjQUFnRCxFQUNwRCxVQUF3QyxFQUM5QixvQkFBNEQsRUFDNUQsb0JBQTRELEVBQ2pFLGVBQWtELEVBQ3JELFlBQTRDLEVBQzNDLGFBQThDLEVBQ3pDLGtCQUF3RCxFQUN4RCxrQkFBd0QsRUFDdEMsb0NBQTRGLEVBQ3JILFdBQXlCO1lBRXZDLEtBQUssQ0FBQyxtQkFBVSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQXRDbkMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFa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