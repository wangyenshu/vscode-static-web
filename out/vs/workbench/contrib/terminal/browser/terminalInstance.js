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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/config/tabFocus", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dnd/browser/dnd", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/environmentVariableShared", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalStrings", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/workbench/contrib/terminal/browser/terminalRunRecentQuickPick", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/browser/widgets/widgetManager", "vs/workbench/contrib/terminal/browser/xterm/lineDataEventAddon", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/common/history", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/preferences/common/preferences", "vs/amdX", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminal/common/terminalClipboard", "vs/workbench/contrib/terminal/browser/terminalIconPicker"], function (require, exports, browser_1, canIUse_1, dnd_1, dom, keyboardEvent_1, scrollableElement_1, async_1, codicons_1, decorators_1, errors_1, event_1, labels_1, lifecycle_1, network_1, path, platform_1, uri_1, tabFocus_1, nls, accessibility_1, accessibilitySignalService_1, clipboardService_1, commands_1, configuration_1, contextkey_1, dnd_2, files_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, opener_1, productService_1, quickInput_1, storage_1, telemetry_1, terminalCapabilityStore_1, environmentVariableShared_1, terminal_1, terminalStrings_1, colorRegistry_1, iconRegistry_1, themeService_1, workspace_1, workspaceTrust_1, theme_1, views_1, viewsService_1, terminal_2, terminalActions_1, terminalEditorInput_1, terminalExtensions_1, terminalIcon_1, terminalProcessManager_1, terminalRunRecentQuickPick_1, terminalStatusList_1, terminalUri_1, widgetManager_1, lineDataEventAddon_1, xtermTerminal_1, history_1, terminal_3, terminalColorRegistry_1, terminalContextKey_1, terminalEnvironment_1, editorService_1, environmentService_1, history_2, layoutService_1, pathService_1, preferences_1, amdX_1, terminalStrings_2, terminalClipboard_1, terminalIconPicker_1) {
    "use strict";
    var TerminalInstance_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInstanceColorProvider = exports.TerminalLabelComputer = exports.TerminalInstance = void 0;
    exports.parseExitResult = parseExitResult;
    var Constants;
    (function (Constants) {
        /**
         * The maximum amount of milliseconds to wait for a container before starting to create the
         * terminal process. This period helps ensure the terminal has good initial dimensions to work
         * with if it's going to be a foreground terminal.
         */
        Constants[Constants["WaitForContainerThreshold"] = 100] = "WaitForContainerThreshold";
        Constants[Constants["DefaultCols"] = 80] = "DefaultCols";
        Constants[Constants["DefaultRows"] = 30] = "DefaultRows";
        Constants[Constants["MaxCanvasWidth"] = 4096] = "MaxCanvasWidth";
    })(Constants || (Constants = {}));
    let xtermConstructor;
    const shellIntegrationSupportedShellTypes = [
        "bash" /* PosixShellType.Bash */,
        "zsh" /* PosixShellType.Zsh */,
        "pwsh" /* PosixShellType.PowerShell */,
        "python" /* PosixShellType.Python */,
        "pwsh" /* WindowsShellType.PowerShell */
    ];
    let TerminalInstance = class TerminalInstance extends lifecycle_1.Disposable {
        static { TerminalInstance_1 = this; }
        static { this._instanceIdCounter = 1; }
        get domElement() { return this._wrapperElement; }
        get usedShellIntegrationInjection() { return this._usedShellIntegrationInjection; }
        get store() {
            return this._store;
        }
        get extEnvironmentVariableCollection() { return this._processManager.extEnvironmentVariableCollection; }
        get waitOnExit() { return this._shellLaunchConfig.attachPersistentProcess?.waitOnExit || this._shellLaunchConfig.waitOnExit; }
        set waitOnExit(value) {
            this._shellLaunchConfig.waitOnExit = value;
        }
        get target() { return this._target; }
        set target(value) {
            this._target = value;
            this._onDidChangeTarget.fire(value);
        }
        get instanceId() { return this._instanceId; }
        get resource() { return this._resource; }
        get cols() {
            if (this._fixedCols !== undefined) {
                return this._fixedCols;
            }
            if (this._dimensionsOverride && this._dimensionsOverride.cols) {
                if (this._dimensionsOverride.forceExactSize) {
                    return this._dimensionsOverride.cols;
                }
                return Math.min(Math.max(this._dimensionsOverride.cols, 2), this._cols);
            }
            return this._cols;
        }
        get rows() {
            if (this._fixedRows !== undefined) {
                return this._fixedRows;
            }
            if (this._dimensionsOverride && this._dimensionsOverride.rows) {
                if (this._dimensionsOverride.forceExactSize) {
                    return this._dimensionsOverride.rows;
                }
                return Math.min(Math.max(this._dimensionsOverride.rows, 2), this._rows);
            }
            return this._rows;
        }
        get isDisposed() { return this._store.isDisposed; }
        get fixedCols() { return this._fixedCols; }
        get fixedRows() { return this._fixedRows; }
        get maxCols() { return this._cols; }
        get maxRows() { return this._rows; }
        // TODO: Ideally processId would be merged into processReady
        get processId() { return this._processManager.shellProcessId; }
        // TODO: How does this work with detached processes?
        // TODO: Should this be an event as it can fire twice?
        get processReady() { return this._processManager.ptyProcessReady; }
        get hasChildProcesses() { return this.shellLaunchConfig.attachPersistentProcess?.hasChildProcesses || this._processManager.hasChildProcesses; }
        get reconnectionProperties() { return this.shellLaunchConfig.attachPersistentProcess?.reconnectionProperties || this.shellLaunchConfig.reconnectionProperties; }
        get areLinksReady() { return this._areLinksReady; }
        get initialDataEvents() { return this._initialDataEvents; }
        get exitCode() { return this._exitCode; }
        get exitReason() { return this._exitReason; }
        get hadFocusOnExit() { return this._hadFocusOnExit; }
        get isTitleSetByProcess() { return !!this._messageTitleDisposable.value; }
        get shellLaunchConfig() { return this._shellLaunchConfig; }
        get shellType() { return this._shellType; }
        get os() { return this._processManager.os; }
        get isRemote() { return this._processManager.remoteAuthority !== undefined; }
        get remoteAuthority() { return this._processManager.remoteAuthority; }
        get hasFocus() { return dom.isAncestorOfActiveElement(this._wrapperElement); }
        get title() { return this._title; }
        get titleSource() { return this._titleSource; }
        get icon() { return this._getIcon(); }
        get color() { return this._getColor(); }
        get processName() { return this._processName; }
        get sequence() { return this._sequence; }
        get staticTitle() { return this._staticTitle; }
        get workspaceFolder() { return this._workspaceFolder; }
        get cwd() { return this._cwd; }
        get initialCwd() { return this._initialCwd; }
        get description() {
            if (this._description) {
                return this._description;
            }
            const type = this.shellLaunchConfig.attachPersistentProcess?.type || this.shellLaunchConfig.type;
            switch (type) {
                case 'Task': return terminalStrings_2.terminalStrings.typeTask;
                case 'Local': return terminalStrings_2.terminalStrings.typeLocal;
                default: return undefined;
            }
        }
        get userHome() { return this._userHome; }
        get shellIntegrationNonce() { return this._processManager.shellIntegrationNonce; }
        get injectedArgs() { return this._injectedArgs; }
        constructor(_terminalShellTypeContextKey, _terminalInRunCommandPicker, _shellLaunchConfig, _contextKeyService, instantiationService, _terminalConfigurationService, _terminalProfileResolverService, _pathService, _keybindingService, _notificationService, _preferencesService, _viewsService, _clipboardService, _themeService, _configurationService, _logService, _storageService, _accessibilityService, _productService, _quickInputService, workbenchEnvironmentService, _workspaceContextService, _editorService, _workspaceTrustRequestService, _historyService, _telemetryService, _openerService, _commandService, _accessibilitySignalService, _viewDescriptorService) {
            super();
            this._terminalShellTypeContextKey = _terminalShellTypeContextKey;
            this._terminalInRunCommandPicker = _terminalInRunCommandPicker;
            this._shellLaunchConfig = _shellLaunchConfig;
            this._contextKeyService = _contextKeyService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._pathService = _pathService;
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._preferencesService = _preferencesService;
            this._viewsService = _viewsService;
            this._clipboardService = _clipboardService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._storageService = _storageService;
            this._accessibilityService = _accessibilityService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._workspaceContextService = _workspaceContextService;
            this._editorService = _editorService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._historyService = _historyService;
            this._telemetryService = _telemetryService;
            this._openerService = _openerService;
            this._commandService = _commandService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._viewDescriptorService = _viewDescriptorService;
            this._contributions = new Map();
            this._latestXtermWriteData = 0;
            this._latestXtermParseData = 0;
            this._title = '';
            this._titleSource = terminal_1.TitleEventSource.Process;
            this._cols = 0;
            this._rows = 0;
            this._cwd = undefined;
            this._initialCwd = undefined;
            this._injectedArgs = undefined;
            this._layoutSettingsChanged = true;
            this._areLinksReady = false;
            this._initialDataEventsListener = this._register(new lifecycle_1.MutableDisposable());
            this._initialDataEvents = [];
            this._messageTitleDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._dndObserver = this._register(new lifecycle_1.MutableDisposable());
            this._processName = '';
            this._usedShellIntegrationInjection = false;
            this.capabilities = this._register(new terminalCapabilityStore_1.TerminalCapabilityStoreMultiplexer());
            this.disableLayout = false;
            // The onExit event is special in that it fires and is disposed after the terminal instance
            // itself is disposed
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDisposed = this._register(new event_1.Emitter());
            this.onDisposed = this._onDisposed.event;
            this._onProcessIdReady = this._register(new event_1.Emitter());
            this.onProcessIdReady = this._onProcessIdReady.event;
            this._onProcessReplayComplete = this._register(new event_1.Emitter());
            this.onProcessReplayComplete = this._onProcessReplayComplete.event;
            this._onTitleChanged = this._register(new event_1.Emitter());
            this.onTitleChanged = this._onTitleChanged.event;
            this._onIconChanged = this._register(new event_1.Emitter());
            this.onIconChanged = this._onIconChanged.event;
            this._onData = this._register(new event_1.Emitter());
            this.onData = this._onData.event;
            this._onBinary = this._register(new event_1.Emitter());
            this.onBinary = this._onBinary.event;
            this._onLineData = this._register(new event_1.Emitter({
                onDidAddFirstListener: () => this._onLineDataSetup()
            }));
            this.onLineData = this._onLineData.event;
            this._onRequestExtHostProcess = this._register(new event_1.Emitter());
            this.onRequestExtHostProcess = this._onRequestExtHostProcess.event;
            this._onDimensionsChanged = this._register(new event_1.Emitter());
            this.onDimensionsChanged = this._onDimensionsChanged.event;
            this._onMaximumDimensionsChanged = this._register(new event_1.Emitter());
            this.onMaximumDimensionsChanged = this._onMaximumDimensionsChanged.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidRequestFocus = this._register(new event_1.Emitter());
            this.onDidRequestFocus = this._onDidRequestFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidInputData = this._register(new event_1.Emitter());
            this.onDidInputData = this._onDidInputData.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onRequestAddInstanceToGroup = this._register(new event_1.Emitter());
            this.onRequestAddInstanceToGroup = this._onRequestAddInstanceToGroup.event;
            this._onDidChangeHasChildProcesses = this._register(new event_1.Emitter());
            this.onDidChangeHasChildProcesses = this._onDidChangeHasChildProcesses.event;
            this._onDidExecuteText = this._register(new event_1.Emitter());
            this.onDidExecuteText = this._onDidExecuteText.event;
            this._onDidChangeTarget = this._register(new event_1.Emitter());
            this.onDidChangeTarget = this._onDidChangeTarget.event;
            this._onDidSendText = this._register(new event_1.Emitter());
            this.onDidSendText = this._onDidSendText.event;
            this._overrideCopySelection = undefined;
            this._wrapperElement = document.createElement('div');
            this._wrapperElement.classList.add('terminal-wrapper');
            this._widgetManager = this._register(instantiationService.createInstance(widgetManager_1.TerminalWidgetManager));
            this._skipTerminalCommands = [];
            this._isExiting = false;
            this._hadFocusOnExit = false;
            this._isVisible = false;
            this._instanceId = TerminalInstance_1._instanceIdCounter++;
            this._hasHadInput = false;
            this._fixedRows = _shellLaunchConfig.attachPersistentProcess?.fixedDimensions?.rows;
            this._fixedCols = _shellLaunchConfig.attachPersistentProcess?.fixedDimensions?.cols;
            this._resource = (0, terminalUri_1.getTerminalUri)(this._workspaceContextService.getWorkspace().id, this.instanceId, this.title);
            if (this._shellLaunchConfig.attachPersistentProcess?.hideFromUser) {
                this._shellLaunchConfig.hideFromUser = this._shellLaunchConfig.attachPersistentProcess.hideFromUser;
            }
            if (this._shellLaunchConfig.attachPersistentProcess?.isFeatureTerminal) {
                this._shellLaunchConfig.isFeatureTerminal = this._shellLaunchConfig.attachPersistentProcess.isFeatureTerminal;
            }
            if (this._shellLaunchConfig.attachPersistentProcess?.type) {
                this._shellLaunchConfig.type = this._shellLaunchConfig.attachPersistentProcess.type;
            }
            if (this.shellLaunchConfig.cwd) {
                const cwdUri = typeof this._shellLaunchConfig.cwd === 'string' ? uri_1.URI.from({
                    scheme: network_1.Schemas.file,
                    path: this._shellLaunchConfig.cwd
                }) : this._shellLaunchConfig.cwd;
                if (cwdUri) {
                    this._workspaceFolder = this._workspaceContextService.getWorkspaceFolder(cwdUri) ?? undefined;
                }
            }
            if (!this._workspaceFolder) {
                const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                this._workspaceFolder = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            }
            const scopedContextKeyService = this._register(_contextKeyService.createScoped(this._wrapperElement));
            this._scopedContextKeyService = scopedContextKeyService;
            this._scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            this._terminalFocusContextKey = terminalContextKey_1.TerminalContextKeys.focus.bindTo(scopedContextKeyService);
            this._terminalHasFixedWidth = terminalContextKey_1.TerminalContextKeys.terminalHasFixedWidth.bindTo(scopedContextKeyService);
            this._terminalHasTextContextKey = terminalContextKey_1.TerminalContextKeys.textSelected.bindTo(scopedContextKeyService);
            this._terminalAltBufferActiveContextKey = terminalContextKey_1.TerminalContextKeys.altBufferActive.bindTo(scopedContextKeyService);
            this._terminalShellIntegrationEnabledContextKey = terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled.bindTo(scopedContextKeyService);
            this._logService.trace(`terminalInstance#ctor (instanceId: ${this.instanceId})`, this._shellLaunchConfig);
            this._register(this.capabilities.onDidAddCapabilityType(e => {
                this._logService.debug('terminalInstance added capability', e);
                if (e === 0 /* TerminalCapability.CwdDetection */) {
                    this.capabilities.get(0 /* TerminalCapability.CwdDetection */)?.onDidChangeCwd(e => {
                        this._cwd = e;
                        this._setTitle(this.title, terminal_1.TitleEventSource.Config);
                        this._scopedInstantiationService.invokeFunction(history_1.getDirectoryHistory)?.add(e, { remoteAuthority: this.remoteAuthority });
                    });
                }
                else if (e === 2 /* TerminalCapability.CommandDetection */) {
                    const commandCapability = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
                    commandCapability?.onCommandFinished(e => {
                        if (e.command.trim().length > 0) {
                            this._scopedInstantiationService.invokeFunction(history_1.getCommandHistory)?.add(e.command, { shellType: this._shellType });
                        }
                    });
                }
            }));
            this._register(this.capabilities.onDidRemoveCapabilityType(e => this._logService.debug('terminalInstance removed capability', e)));
            // Resolve just the icon ahead of time so that it shows up immediately in the tabs. This is
            // disabled in remote because this needs to be sync and the OS may differ on the remote
            // which would result in the wrong profile being selected and the wrong icon being
            // permanently attached to the terminal. This also doesn't work when the default profile
            // setting is set to null, that's handled after the process is created.
            if (!this.shellLaunchConfig.executable && !workbenchEnvironmentService.remoteAuthority) {
                this._terminalProfileResolverService.resolveIcon(this._shellLaunchConfig, platform_1.OS);
            }
            this._icon = _shellLaunchConfig.attachPersistentProcess?.icon || _shellLaunchConfig.icon;
            // When a custom pty is used set the name immediately so it gets passed over to the exthost
            // and is available when Pseudoterminal.open fires.
            if (this.shellLaunchConfig.customPtyImplementation) {
                this._setTitle(this._shellLaunchConfig.name, terminal_1.TitleEventSource.Api);
            }
            this.statusList = this._register(this._scopedInstantiationService.createInstance(terminalStatusList_1.TerminalStatusList));
            this._initDimensions();
            this._processManager = this._createProcessManager();
            this._containerReadyBarrier = new async_1.AutoOpenBarrier(100 /* Constants.WaitForContainerThreshold */);
            this._attachBarrier = new async_1.AutoOpenBarrier(1000);
            this._xtermReadyPromise = this._createXterm();
            this._xtermReadyPromise.then(async () => {
                // Wait for a period to allow a container to be ready
                await this._containerReadyBarrier.wait();
                // Resolve the executable ahead of time if shell integration is enabled, this should not
                // be done for custom PTYs as that would cause extension Pseudoterminal-based terminals
                // to hang in resolver extensions
                if (!this.shellLaunchConfig.customPtyImplementation && this._terminalConfigurationService.config.shellIntegration?.enabled && !this.shellLaunchConfig.executable) {
                    const os = await this._processManager.getBackendOS();
                    const defaultProfile = (await this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority: this.remoteAuthority, os }));
                    this.shellLaunchConfig.executable = defaultProfile.path;
                    this.shellLaunchConfig.args = defaultProfile.args;
                    if (this.shellLaunchConfig.isExtensionOwnedTerminal) {
                        // Only use default icon and color and env if they are undefined in the SLC
                        this.shellLaunchConfig.icon ??= defaultProfile.icon;
                        this.shellLaunchConfig.color ??= defaultProfile.color;
                        this.shellLaunchConfig.env ??= defaultProfile.env;
                    }
                    else {
                        this.shellLaunchConfig.icon = defaultProfile.icon;
                        this.shellLaunchConfig.color = defaultProfile.color;
                        this.shellLaunchConfig.env = defaultProfile.env;
                    }
                }
                await this._createProcess();
                // Re-establish the title after reconnect
                if (this.shellLaunchConfig.attachPersistentProcess) {
                    this._cwd = this.shellLaunchConfig.attachPersistentProcess.cwd;
                    this._setTitle(this.shellLaunchConfig.attachPersistentProcess.title, this.shellLaunchConfig.attachPersistentProcess.titleSource);
                    this.setShellType(this.shellType);
                }
                if (this._fixedCols) {
                    await this._addScrollbar();
                }
            }).catch((err) => {
                // Ignore exceptions if the terminal is already disposed
                if (!this.isDisposed) {
                    throw err;
                }
            });
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */)) {
                    this._setAriaLabel(this.xterm?.raw, this._instanceId, this.title);
                }
                if (e.affectsConfiguration('terminal.integrated')) {
                    this.updateConfig();
                    this.setVisible(this._isVisible);
                }
                const layoutSettings = [
                    "terminal.integrated.fontSize" /* TerminalSettingId.FontSize */,
                    "terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */,
                    "terminal.integrated.fontWeight" /* TerminalSettingId.FontWeight */,
                    "terminal.integrated.fontWeightBold" /* TerminalSettingId.FontWeightBold */,
                    "terminal.integrated.letterSpacing" /* TerminalSettingId.LetterSpacing */,
                    "terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */,
                    'editor.fontFamily'
                ];
                if (layoutSettings.some(id => e.affectsConfiguration(id))) {
                    this._layoutSettingsChanged = true;
                    await this._resize();
                }
                if (e.affectsConfiguration("terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */)) {
                    this._updateUnicodeVersion();
                }
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this.updateAccessibilitySupport();
                }
                if (e.affectsConfiguration("terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.separator" /* TerminalSettingId.TerminalTitleSeparator */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */)) {
                    this._labelComputer?.refreshLabel(this);
                }
            }));
            this._register(this._workspaceContextService.onDidChangeWorkspaceFolders(() => this._labelComputer?.refreshLabel(this)));
            // Clear out initial data events after 10 seconds, hopefully extension hosts are up and
            // running at that point.
            let initialDataEventsTimeout = dom.getWindow(this._container).setTimeout(() => {
                initialDataEventsTimeout = undefined;
                this._initialDataEvents = undefined;
                this._initialDataEventsListener.clear();
            }, 10000);
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (initialDataEventsTimeout) {
                    dom.getWindow(this._container).clearTimeout(initialDataEventsTimeout);
                }
            }));
            // Initialize contributions
            const contributionDescs = terminalExtensions_1.TerminalExtensionsRegistry.getTerminalContributions();
            for (const desc of contributionDescs) {
                if (this._contributions.has(desc.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two terminal contributions with the same id ${desc.id}`));
                    continue;
                }
                let contribution;
                try {
                    contribution = this._register(this._scopedInstantiationService.createInstance(desc.ctor, this, this._processManager, this._widgetManager));
                    this._contributions.set(desc.id, contribution);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                this._xtermReadyPromise.then(xterm => {
                    contribution.xtermReady?.(xterm);
                });
                this.onDisposed(() => {
                    contribution.dispose();
                    this._contributions.delete(desc.id);
                    // Just in case to prevent potential future memory leaks due to cyclic dependency.
                    if ('instance' in contribution) {
                        delete contribution.instance;
                    }
                    if ('_instance' in contribution) {
                        delete contribution._instance;
                    }
                });
            }
        }
        getContribution(id) {
            return this._contributions.get(id);
        }
        _getIcon() {
            if (!this._icon) {
                this._icon = this._processManager.processState >= 2 /* ProcessState.Launching */
                    ? (0, iconRegistry_1.getIconRegistry)().getIcon(this._configurationService.getValue("terminal.integrated.tabs.defaultIcon" /* TerminalSettingId.TabsDefaultIcon */))
                    : undefined;
            }
            return this._icon;
        }
        _getColor() {
            if (this.shellLaunchConfig.color) {
                return this.shellLaunchConfig.color;
            }
            if (this.shellLaunchConfig?.attachPersistentProcess?.color) {
                return this.shellLaunchConfig.attachPersistentProcess.color;
            }
            if (this._processManager.processState >= 2 /* ProcessState.Launching */) {
                return undefined;
            }
            return undefined;
        }
        _initDimensions() {
            // The terminal panel needs to have been created to get the real view dimensions
            if (!this._container) {
                // Set the fallback dimensions if not
                this._cols = 80 /* Constants.DefaultCols */;
                this._rows = 30 /* Constants.DefaultRows */;
                return;
            }
            const computedStyle = dom.getWindow(this._container).getComputedStyle(this._container);
            const width = parseInt(computedStyle.width);
            const height = parseInt(computedStyle.height);
            this._evaluateColsAndRows(width, height);
        }
        /**
         * Evaluates and sets the cols and rows of the terminal if possible.
         * @param width The width of the container.
         * @param height The height of the container.
         * @return The terminal's width if it requires a layout.
         */
        _evaluateColsAndRows(width, height) {
            // Ignore if dimensions are undefined or 0
            if (!width || !height) {
                this._setLastKnownColsAndRows();
                return null;
            }
            const dimension = this._getDimension(width, height);
            if (!dimension) {
                this._setLastKnownColsAndRows();
                return null;
            }
            const font = this.xterm ? this.xterm.getFont() : this._terminalConfigurationService.getFont(dom.getWindow(this.domElement));
            const newRC = (0, xtermTerminal_1.getXtermScaledDimensions)(dom.getWindow(this.domElement), font, dimension.width, dimension.height);
            if (!newRC) {
                this._setLastKnownColsAndRows();
                return null;
            }
            if (this._cols !== newRC.cols || this._rows !== newRC.rows) {
                this._cols = newRC.cols;
                this._rows = newRC.rows;
                this._fireMaximumDimensionsChanged();
            }
            return dimension.width;
        }
        _setLastKnownColsAndRows() {
            if (TerminalInstance_1._lastKnownGridDimensions) {
                this._cols = TerminalInstance_1._lastKnownGridDimensions.cols;
                this._rows = TerminalInstance_1._lastKnownGridDimensions.rows;
            }
        }
        _fireMaximumDimensionsChanged() {
            this._onMaximumDimensionsChanged.fire();
        }
        _getDimension(width, height) {
            // The font needs to have been initialized
            const font = this.xterm ? this.xterm.getFont() : this._terminalConfigurationService.getFont(dom.getWindow(this.domElement));
            if (!font || !font.charWidth || !font.charHeight) {
                return undefined;
            }
            if (!this.xterm?.raw.element) {
                return undefined;
            }
            const computedStyle = dom.getWindow(this.xterm.raw.element).getComputedStyle(this.xterm.raw.element);
            const horizontalPadding = parseInt(computedStyle.paddingLeft) + parseInt(computedStyle.paddingRight);
            const verticalPadding = parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom);
            TerminalInstance_1._lastKnownCanvasDimensions = new dom.Dimension(Math.min(4096 /* Constants.MaxCanvasWidth */, width - horizontalPadding), height + (this._hasScrollBar && !this._horizontalScrollbar ? -5 /* scroll bar height */ : 0) - 2 /* bottom padding */ - verticalPadding);
            return TerminalInstance_1._lastKnownCanvasDimensions;
        }
        get persistentProcessId() { return this._processManager.persistentProcessId; }
        get shouldPersist() { return this._processManager.shouldPersist && !this.shellLaunchConfig.isTransient && (!this.reconnectionProperties || this._configurationService.getValue('task.reconnection') === true); }
        static getXtermConstructor(keybindingService, contextKeyService) {
            const keybinding = keybindingService.lookupKeybinding("workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */, contextKeyService);
            if (xtermConstructor) {
                return xtermConstructor;
            }
            xtermConstructor = async_1.Promises.withAsyncBody(async (resolve) => {
                const Terminal = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
                // Localize strings
                Terminal.strings.promptLabel = nls.localize('terminal.integrated.a11yPromptLabel', 'Terminal input');
                Terminal.strings.tooMuchOutput = keybinding ? nls.localize('terminal.integrated.useAccessibleBuffer', 'Use the accessible buffer {0} to manually review output', keybinding.getLabel()) : nls.localize('terminal.integrated.useAccessibleBufferNoKb', 'Use the Terminal: Focus Accessible Buffer command to manually review output');
                resolve(Terminal);
            });
            return xtermConstructor;
        }
        /**
         * Create xterm.js instance and attach data listeners.
         */
        async _createXterm() {
            const Terminal = await TerminalInstance_1.getXtermConstructor(this._keybindingService, this._contextKeyService);
            if (this.isDisposed) {
                throw new errors_1.ErrorNoTelemetry('Terminal disposed of during xterm.js creation');
            }
            const disableShellIntegrationReporting = (this.shellLaunchConfig.executable === undefined || this.shellType === undefined) || !shellIntegrationSupportedShellTypes.includes(this.shellType);
            const xterm = this._scopedInstantiationService.createInstance(xtermTerminal_1.XtermTerminal, Terminal, this._cols, this._rows, this._scopedInstantiationService.createInstance(TerminalInstanceColorProvider, this), this.capabilities, this._processManager.shellIntegrationNonce, disableShellIntegrationReporting);
            this.xterm = xterm;
            this.updateAccessibilitySupport();
            this._register(this.xterm.onDidRequestRunCommand(e => {
                if (e.copyAsHtml) {
                    this.copySelection(true, e.command);
                }
                else {
                    this.sendText(e.command.command, e.noNewLine ? false : true);
                }
            }));
            this._register(this.xterm.onDidRequestFocus(() => this.focus()));
            this._register(this.xterm.onDidRequestSendText(e => this.sendText(e, false)));
            // Write initial text, deferring onLineFeed listener when applicable to avoid firing
            // onLineData events containing initialText
            const initialTextWrittenPromise = this._shellLaunchConfig.initialText ? new Promise(r => this._writeInitialText(xterm, r)) : undefined;
            const lineDataEventAddon = this._register(new lineDataEventAddon_1.LineDataEventAddon(initialTextWrittenPromise));
            this._register(lineDataEventAddon.onLineData(e => this._onLineData.fire(e)));
            this._lineDataEventAddon = lineDataEventAddon;
            // Delay the creation of the bell listener to avoid showing the bell when the terminal
            // starts up or reconnects
            (0, async_1.disposableTimeout)(() => {
                this._register(xterm.raw.onBell(() => {
                    if (this._configurationService.getValue("terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */) || this._configurationService.getValue("terminal.integrated.enableVisualBell" /* TerminalSettingId.EnableVisualBell */)) {
                        this.statusList.add({
                            id: "bell" /* TerminalStatus.Bell */,
                            severity: notification_1.Severity.Warning,
                            icon: codicons_1.Codicon.bell,
                            tooltip: nls.localize('bellStatus', "Bell")
                        }, this._terminalConfigurationService.config.bellDuration);
                    }
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.terminalBell);
                }));
            }, 1000, this._store);
            this._register(xterm.raw.onSelectionChange(async () => this._onSelectionChange()));
            this._register(xterm.raw.buffer.onBufferChange(() => this._refreshAltBufferContextKey()));
            this._register(this._processManager.onProcessData(e => this._onProcessData(e)));
            this._register(xterm.raw.onData(async (data) => {
                await this._processManager.write(data);
                this._onDidInputData.fire(this);
            }));
            this._register(xterm.raw.onBinary(data => this._processManager.processBinary(data)));
            // Init winpty compat and link handler after process creation as they rely on the
            // underlying process OS
            this._register(this._processManager.onProcessReady(async (processTraits) => {
                if (this._processManager.os) {
                    lineDataEventAddon.setOperatingSystem(this._processManager.os);
                }
                xterm.raw.options.windowsPty = processTraits.windowsPty;
            }));
            this._register(this._processManager.onRestoreCommands(e => this.xterm?.shellIntegration.deserialize(e)));
            this._register(this._viewDescriptorService.onDidChangeLocation(({ views }) => {
                if (views.some(v => v.id === terminal_3.TERMINAL_VIEW_ID)) {
                    xterm.refresh();
                }
            }));
            // Set up updating of the process cwd on key press, this is only needed when the cwd
            // detection capability has not been registered
            if (!this.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
                let onKeyListener = xterm.raw.onKey(e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e.domEvent);
                    if (event.equals(3 /* KeyCode.Enter */)) {
                        this._updateProcessCwd();
                    }
                });
                this._register(this.capabilities.onDidAddCapabilityType(e => {
                    if (e === 0 /* TerminalCapability.CwdDetection */) {
                        onKeyListener?.dispose();
                        onKeyListener = undefined;
                    }
                }));
            }
            this._pathService.userHome().then(userHome => {
                this._userHome = userHome.fsPath;
            });
            if (this._isVisible) {
                this._open();
            }
            return xterm;
        }
        async _onLineDataSetup() {
            const xterm = this.xterm || await this._xtermReadyPromise;
            xterm.raw.loadAddon(this._lineDataEventAddon);
        }
        async runCommand(commandLine, shouldExecute) {
            let commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            // Await command detection if the terminal is starting up
            if (!commandDetection && (this._processManager.processState === 1 /* ProcessState.Uninitialized */ || this._processManager.processState === 2 /* ProcessState.Launching */)) {
                const store = new lifecycle_1.DisposableStore();
                await Promise.race([
                    new Promise(r => {
                        store.add(this.capabilities.onDidAddCapabilityType(e => {
                            if (e === 2 /* TerminalCapability.CommandDetection */) {
                                commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
                                r();
                            }
                        }));
                    }),
                    (0, async_1.timeout)(2000),
                ]);
                store.dispose();
            }
            // Determine whether to send ETX (ctrl+c) before running the command. This should always
            // happen unless command detection can reliably say that a command is being entered and
            // there is no content in the prompt
            if (commandDetection?.hasInput !== false) {
                await this.sendText('\x03', false);
                // Wait a little before running the command to avoid the sequences being echoed while the ^C
                // is being evaluated
                await (0, async_1.timeout)(100);
            }
            // Use bracketed paste mode only when not running the command
            await this.sendText(commandLine, shouldExecute, !shouldExecute);
        }
        async runRecent(type, filterMode, value) {
            return this._scopedInstantiationService.invokeFunction(terminalRunRecentQuickPick_1.showRunRecentQuickPick, this, this._terminalInRunCommandPicker, type, filterMode, value);
        }
        detachFromElement() {
            this._wrapperElement.remove();
            this._container = undefined;
        }
        attachToElement(container) {
            // The container did not change, do nothing
            if (this._container === container) {
                return;
            }
            this._attachBarrier.open();
            // The container changed, reattach
            this._container = container;
            this._container.appendChild(this._wrapperElement);
            // If xterm is already attached, call open again to pick up any changes to the window.
            if (this.xterm?.raw.element) {
                this.xterm.raw.open(this.xterm.raw.element);
            }
            this.xterm?.refresh();
            setTimeout(() => this._initDragAndDrop(container));
        }
        /**
         * Opens the the terminal instance inside the parent DOM element previously set with
         * `attachToElement`, you must ensure the parent DOM element is explicitly visible before
         * invoking this function as it performs some DOM calculations internally
         */
        _open() {
            if (!this.xterm || this.xterm.raw.element) {
                return;
            }
            if (!this._container || !this._container.isConnected) {
                throw new Error('A container element needs to be set with `attachToElement` and be part of the DOM before calling `_open`');
            }
            const xtermElement = document.createElement('div');
            this._wrapperElement.appendChild(xtermElement);
            this._container.appendChild(this._wrapperElement);
            const xterm = this.xterm;
            // Attach the xterm object to the DOM, exposing it to the smoke tests
            this._wrapperElement.xterm = xterm.raw;
            const screenElement = xterm.attachToElement(xtermElement);
            // Fire xtermOpen on all contributions
            for (const contribution of this._contributions.values()) {
                if (!this.xterm) {
                    this._xtermReadyPromise.then(xterm => contribution.xtermOpen?.(xterm));
                }
                else {
                    contribution.xtermOpen?.(this.xterm);
                }
            }
            this._register(xterm.shellIntegration.onDidChangeStatus(() => {
                if (this.hasFocus) {
                    this._setShellIntegrationContextKey();
                }
                else {
                    this._terminalShellIntegrationEnabledContextKey.reset();
                }
            }));
            if (!xterm.raw.element || !xterm.raw.textarea) {
                throw new Error('xterm elements not set after open');
            }
            this._setAriaLabel(xterm.raw, this._instanceId, this._title);
            xterm.raw.attachCustomKeyEventHandler((event) => {
                // Disable all input if the terminal is exiting
                if (this._isExiting) {
                    return false;
                }
                const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(event);
                const resolveResult = this._keybindingService.softDispatch(standardKeyboardEvent, standardKeyboardEvent.target);
                // Respect chords if the allowChords setting is set and it's not Escape. Escape is
                // handled specially for Zen Mode's Escape, Escape chord, plus it's important in
                // terminals generally
                const isValidChord = resolveResult.kind === 1 /* ResultKind.MoreChordsNeeded */ && this._terminalConfigurationService.config.allowChords && event.key !== 'Escape';
                if (this._keybindingService.inChordMode || isValidChord) {
                    event.preventDefault();
                    return false;
                }
                const SHOW_TERMINAL_CONFIG_PROMPT_KEY = 'terminal.integrated.showTerminalConfigPrompt';
                const EXCLUDED_KEYS = ['RightArrow', 'LeftArrow', 'UpArrow', 'DownArrow', 'Space', 'Meta', 'Control', 'Shift', 'Alt', '', 'Delete', 'Backspace', 'Tab'];
                // only keep track of input if prompt hasn't already been shown
                if (this._storageService.getBoolean(SHOW_TERMINAL_CONFIG_PROMPT_KEY, -1 /* StorageScope.APPLICATION */, true) &&
                    !EXCLUDED_KEYS.includes(event.key) &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey) {
                    this._hasHadInput = true;
                }
                // for keyboard events that resolve to commands described
                // within commandsToSkipShell, either alert or skip processing by xterm.js
                if (resolveResult.kind === 2 /* ResultKind.KbFound */ && resolveResult.commandId && this._skipTerminalCommands.some(k => k === resolveResult.commandId) && !this._terminalConfigurationService.config.sendKeybindingsToShell) {
                    // don't alert when terminal is opened or closed
                    if (this._storageService.getBoolean(SHOW_TERMINAL_CONFIG_PROMPT_KEY, -1 /* StorageScope.APPLICATION */, true) &&
                        this._hasHadInput &&
                        !terminal_3.TERMINAL_CREATION_COMMANDS.includes(resolveResult.commandId)) {
                        this._notificationService.prompt(notification_1.Severity.Info, nls.localize('keybindingHandling', "Some keybindings don't go to the terminal by default and are handled by {0} instead.", this._productService.nameLong), [
                            {
                                label: nls.localize('configureTerminalSettings', "Configure Terminal Settings"),
                                run: () => {
                                    this._preferencesService.openSettings({ jsonEditor: false, query: `@id:${"terminal.integrated.commandsToSkipShell" /* TerminalSettingId.CommandsToSkipShell */},${"terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */},${"terminal.integrated.allowChords" /* TerminalSettingId.AllowChords */}` });
                                }
                            }
                        ]);
                        this._storageService.store(SHOW_TERMINAL_CONFIG_PROMPT_KEY, false, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                    event.preventDefault();
                    return false;
                }
                // Skip processing by xterm.js of keyboard events that match menu bar mnemonics
                if (this._terminalConfigurationService.config.allowMnemonics && !platform_1.isMacintosh && event.altKey) {
                    return false;
                }
                // If tab focus mode is on, tab is not passed to the terminal
                if (tabFocus_1.TabFocus.getTabFocusMode() && event.key === 'Tab') {
                    return false;
                }
                // Prevent default when shift+tab is being sent to the terminal to avoid it bubbling up
                // and changing focus https://github.com/microsoft/vscode/issues/188329
                if (event.key === 'Tab' && event.shiftKey) {
                    event.preventDefault();
                    return true;
                }
                // Always have alt+F4 skip the terminal on Windows and allow it to be handled by the
                // system
                if (platform_1.isWindows && event.altKey && event.key === 'F4' && !event.ctrlKey) {
                    return false;
                }
                // Fallback to force ctrl+v to paste on browsers that do not support
                // navigator.clipboard.readText
                if (!canIUse_1.BrowserFeatures.clipboard.readText && event.key === 'v' && event.ctrlKey) {
                    return false;
                }
                return true;
            });
            this._register(dom.addDisposableListener(xterm.raw.element, 'mousedown', () => {
                // We need to listen to the mouseup event on the document since the user may release
                // the mouse button anywhere outside of _xterm.element.
                const listener = dom.addDisposableListener(xterm.raw.element.ownerDocument, 'mouseup', () => {
                    // Delay with a setTimeout to allow the mouseup to propagate through the DOM
                    // before evaluating the new selection state.
                    setTimeout(() => this._refreshSelectionContextKey(), 0);
                    listener.dispose();
                });
            }));
            this._register(dom.addDisposableListener(xterm.raw.element, 'touchstart', () => {
                xterm.raw.focus();
            }));
            // xterm.js currently drops selection on keyup as we need to handle this case.
            this._register(dom.addDisposableListener(xterm.raw.element, 'keyup', () => {
                // Wait until keyup has propagated through the DOM before evaluating
                // the new selection state.
                setTimeout(() => this._refreshSelectionContextKey(), 0);
            }));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'focus', () => this._setFocus(true)));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'blur', () => this._setFocus(false)));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'focusout', () => this._setFocus(false)));
            this._initDragAndDrop(this._container);
            this._widgetManager.attachToElement(screenElement);
            if (this._lastLayoutDimensions) {
                this.layout(this._lastLayoutDimensions);
            }
            this.updateConfig();
            // If IShellLaunchConfig.waitOnExit was true and the process finished before the terminal
            // panel was initialized.
            if (xterm.raw.options.disableStdin) {
                this._attachPressAnyKeyToCloseListener(xterm.raw);
            }
        }
        _setFocus(focused) {
            if (focused) {
                this._terminalFocusContextKey.set(true);
                this._setShellIntegrationContextKey();
                this._onDidFocus.fire(this);
            }
            else {
                this.resetFocusContextKey();
                this._onDidBlur.fire(this);
                this._refreshSelectionContextKey();
            }
        }
        _setShellIntegrationContextKey() {
            if (this.xterm) {
                this._terminalShellIntegrationEnabledContextKey.set(this.xterm.shellIntegration.status === 2 /* ShellIntegrationStatus.VSCode */);
            }
        }
        resetFocusContextKey() {
            this._terminalFocusContextKey.reset();
            this._terminalShellIntegrationEnabledContextKey.reset();
        }
        _initDragAndDrop(container) {
            const store = new lifecycle_1.DisposableStore();
            const dndController = store.add(this._scopedInstantiationService.createInstance(TerminalInstanceDragAndDropController, container));
            store.add(dndController.onDropTerminal(e => this._onRequestAddInstanceToGroup.fire(e)));
            store.add(dndController.onDropFile(async (path) => {
                this.focus();
                await this.sendPath(path, false);
            }));
            store.add(new dom.DragAndDropObserver(container, dndController));
            this._dndObserver.value = store;
        }
        hasSelection() {
            return this.xterm ? this.xterm.raw.hasSelection() : false;
        }
        async copySelection(asHtml, command) {
            const xterm = await this._xtermReadyPromise;
            await xterm.copySelection(asHtml, command);
        }
        get selection() {
            return this.xterm && this.hasSelection() ? this.xterm.raw.getSelection() : undefined;
        }
        clearSelection() {
            this.xterm?.raw.clearSelection();
        }
        _refreshAltBufferContextKey() {
            this._terminalAltBufferActiveContextKey.set(!!(this.xterm && this.xterm.raw.buffer.active === this.xterm.raw.buffer.alternate));
        }
        dispose(reason) {
            if (this.isDisposed) {
                return;
            }
            this._logService.trace(`terminalInstance#dispose (instanceId: ${this.instanceId})`);
            (0, lifecycle_1.dispose)(this._widgetManager);
            if (this.xterm?.raw.element) {
                this._hadFocusOnExit = this.hasFocus;
            }
            if (this._wrapperElement.xterm) {
                this._wrapperElement.xterm = undefined;
            }
            if (this._horizontalScrollbar) {
                this._horizontalScrollbar.dispose();
                this._horizontalScrollbar = undefined;
            }
            try {
                this.xterm?.dispose();
            }
            catch (err) {
                // See https://github.com/microsoft/vscode/issues/153486
                this._logService.error('Exception occurred during xterm disposal', err);
            }
            // HACK: Workaround for Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=559561,
            // as 'blur' event in xterm.raw.textarea is not triggered on xterm.dispose()
            // See https://github.com/microsoft/vscode/issues/138358
            if (browser_1.isFirefox) {
                this.resetFocusContextKey();
                this._terminalHasTextContextKey.reset();
                this._onDidBlur.fire(this);
            }
            if (this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener.dispose();
                this._pressAnyKeyToCloseListener = undefined;
            }
            if (this._exitReason === undefined) {
                this._exitReason = reason ?? terminal_1.TerminalExitReason.Unknown;
            }
            this._processManager.dispose();
            // Process manager dispose/shutdown doesn't fire process exit, trigger with undefined if it
            // hasn't happened yet
            this._onProcessExit(undefined);
            this._onDisposed.fire(this);
            super.dispose();
        }
        async detachProcessAndDispose(reason) {
            // Detach the process and dispose the instance, without the instance dispose the terminal
            // won't go away. Force persist if the detach was requested by the user (not shutdown).
            await this._processManager.detachFromProcess(reason === terminal_1.TerminalExitReason.User);
            this.dispose(reason);
        }
        focus(force) {
            this._refreshAltBufferContextKey();
            if (!this.xterm) {
                return;
            }
            if (force || !dom.getActiveWindow().getSelection()?.toString()) {
                this.xterm.raw.focus();
                this._onDidRequestFocus.fire();
            }
        }
        async focusWhenReady(force) {
            await this._xtermReadyPromise;
            await this._attachBarrier.wait();
            this.focus(force);
        }
        async paste() {
            await this._paste(await this._clipboardService.readText());
        }
        async pasteSelection() {
            await this._paste(await this._clipboardService.readText('selection'));
        }
        async _paste(value) {
            if (!this.xterm) {
                return;
            }
            let currentText = value;
            const shouldPasteText = await this._scopedInstantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, currentText, this.xterm?.raw.modes.bracketedPasteMode);
            if (!shouldPasteText) {
                return;
            }
            if (typeof shouldPasteText === 'object') {
                currentText = shouldPasteText.modifiedText;
            }
            this.focus();
            this.xterm.raw.paste(currentText);
        }
        async sendText(text, shouldExecute, bracketedPasteMode) {
            // Apply bracketed paste sequences if the terminal has the mode enabled, this will prevent
            // the text from triggering keybindings and ensure new lines are handled properly
            if (bracketedPasteMode && this.xterm?.raw.modes.bracketedPasteMode) {
                text = `\x1b[200~${text}\x1b[201~`;
            }
            // Normalize line endings to 'enter' press.
            text = text.replace(/\r?\n/g, '\r');
            if (shouldExecute && !text.endsWith('\r')) {
                text += '\r';
            }
            // Send it to the process
            await this._processManager.write(text);
            this._onDidInputData.fire(this);
            this._onDidSendText.fire(text);
            this.xterm?.scrollToBottom();
            if (shouldExecute) {
                this._onDidExecuteText.fire();
            }
        }
        async sendPath(originalPath, shouldExecute) {
            return this.sendText(await this.preparePathForShell(originalPath), shouldExecute);
        }
        async preparePathForShell(originalPath) {
            // Wait for shell type to be ready
            await this.processReady;
            return (0, terminalEnvironment_1.preparePathForShell)(originalPath, this.shellLaunchConfig.executable, this.title, this.shellType, this._processManager.backend, this._processManager.os);
        }
        setVisible(visible) {
            this._isVisible = visible;
            this._wrapperElement.classList.toggle('active', visible);
            if (visible && this.xterm) {
                this._open();
                // Resize to re-evaluate dimensions, this will ensure when switching to a terminal it is
                // using the most up to date dimensions (eg. when terminal is created in the background
                // using cached dimensions of a split terminal).
                this._resize();
                // HACK: Trigger a forced refresh of the viewport to sync the viewport and scroll bar.
                // This is necessary if the number of rows in the terminal has decreased while it was in
                // the background since scrollTop changes take no effect but the terminal's position
                // does change since the number of visible rows decreases.
                // This can likely be removed after https://github.com/xtermjs/xterm.js/issues/291 is
                // fixed upstream.
                setTimeout(() => this.xterm.forceRefresh(), 0);
            }
        }
        scrollDownLine() {
            this.xterm?.scrollDownLine();
        }
        scrollDownPage() {
            this.xterm?.scrollDownPage();
        }
        scrollToBottom() {
            this.xterm?.scrollToBottom();
        }
        scrollUpLine() {
            this.xterm?.scrollUpLine();
        }
        scrollUpPage() {
            this.xterm?.scrollUpPage();
        }
        scrollToTop() {
            this.xterm?.scrollToTop();
        }
        clearBuffer() {
            this._processManager.clearBuffer();
            this.xterm?.clearBuffer();
        }
        _refreshSelectionContextKey() {
            const isActive = !!this._viewsService.getActiveViewWithId(terminal_3.TERMINAL_VIEW_ID);
            let isEditorActive = false;
            const editor = this._editorService.activeEditor;
            if (editor) {
                isEditorActive = editor instanceof terminalEditorInput_1.TerminalEditorInput;
            }
            this._terminalHasTextContextKey.set((isActive || isEditorActive) && this.hasSelection());
        }
        _createProcessManager() {
            let deserializedCollections;
            if (this.shellLaunchConfig.attachPersistentProcess?.environmentVariableCollections) {
                deserializedCollections = (0, environmentVariableShared_1.deserializeEnvironmentVariableCollections)(this.shellLaunchConfig.attachPersistentProcess.environmentVariableCollections);
            }
            const processManager = this._scopedInstantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, this._instanceId, this.shellLaunchConfig?.cwd, deserializedCollections, this.shellLaunchConfig.attachPersistentProcess?.shellIntegrationNonce);
            this.capabilities.add(processManager.capabilities);
            this._register(processManager.onProcessReady(async (e) => {
                this._onProcessIdReady.fire(this);
                this._initialCwd = await this.getInitialCwd();
                // Set the initial name based on the _resolved_ shell launch config, this will also
                // ensure the resolved icon gets shown
                if (!this._labelComputer) {
                    this._labelComputer = this._register(this._scopedInstantiationService.createInstance(TerminalLabelComputer));
                    this._register(this._labelComputer.onDidChangeLabel(e => {
                        const wasChanged = this._title !== e.title || this._description !== e.description;
                        if (wasChanged) {
                            this._title = e.title;
                            this._description = e.description;
                            this._onTitleChanged.fire(this);
                        }
                    }));
                }
                if (this._shellLaunchConfig.name) {
                    this._setTitle(this._shellLaunchConfig.name, terminal_1.TitleEventSource.Api);
                }
                else {
                    // Listen to xterm.js' sequence title change event, trigger this async to ensure
                    // _xtermReadyPromise is ready constructed since this is called from the ctor
                    setTimeout(() => {
                        this._xtermReadyPromise.then(xterm => {
                            this._messageTitleDisposable.value = xterm.raw.onTitleChange(e => this._onTitleChange(e));
                        });
                    });
                    this._setTitle(this._shellLaunchConfig.executable, terminal_1.TitleEventSource.Process);
                }
            }));
            this._register(processManager.onProcessExit(exitCode => this._onProcessExit(exitCode)));
            this._register(processManager.onDidChangeProperty(({ type, value }) => {
                switch (type) {
                    case "cwd" /* ProcessPropertyType.Cwd */:
                        this._cwd = value;
                        this._labelComputer?.refreshLabel(this);
                        break;
                    case "initialCwd" /* ProcessPropertyType.InitialCwd */:
                        this._initialCwd = value;
                        this._cwd = this._initialCwd;
                        this._setTitle(this.title, terminal_1.TitleEventSource.Config);
                        this._icon = this._shellLaunchConfig.attachPersistentProcess?.icon || this._shellLaunchConfig.icon;
                        this._onIconChanged.fire({ instance: this, userInitiated: false });
                        break;
                    case "title" /* ProcessPropertyType.Title */:
                        this._setTitle(value ?? '', terminal_1.TitleEventSource.Process);
                        break;
                    case "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */:
                        this.setOverrideDimensions(value, true);
                        break;
                    case "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */:
                        this._setResolvedShellLaunchConfig(value);
                        break;
                    case "shellType" /* ProcessPropertyType.ShellType */:
                        this.setShellType(value);
                        break;
                    case "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */:
                        this._onDidChangeHasChildProcesses.fire(value);
                        break;
                    case "usedShellIntegrationInjection" /* ProcessPropertyType.UsedShellIntegrationInjection */:
                        this._usedShellIntegrationInjection = true;
                        break;
                }
            }));
            this._initialDataEventsListener.value = processManager.onProcessData(ev => this._initialDataEvents?.push(ev.data));
            this._register(processManager.onProcessReplayComplete(() => this._onProcessReplayComplete.fire()));
            this._register(processManager.onEnvironmentVariableInfoChanged(e => this._onEnvironmentVariableInfoChanged(e)));
            this._register(processManager.onPtyDisconnect(() => {
                if (this.xterm) {
                    this.xterm.raw.options.disableStdin = true;
                }
                this.statusList.add({
                    id: "disconnected" /* TerminalStatus.Disconnected */,
                    severity: notification_1.Severity.Error,
                    icon: codicons_1.Codicon.debugDisconnect,
                    tooltip: nls.localize('disconnectStatus', "Lost connection to process")
                });
            }));
            this._register(processManager.onPtyReconnect(() => {
                if (this.xterm) {
                    this.xterm.raw.options.disableStdin = false;
                }
                this.statusList.remove("disconnected" /* TerminalStatus.Disconnected */);
            }));
            return processManager;
        }
        async _createProcess() {
            if (this.isDisposed) {
                return;
            }
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            if (activeWorkspaceRootUri) {
                const trusted = await this._trust();
                if (!trusted) {
                    this._onProcessExit({ message: nls.localize('workspaceNotTrustedCreateTerminal', "Cannot launch a terminal process in an untrusted workspace") });
                }
            }
            else if (this._cwd && this._userHome && this._cwd !== this._userHome) {
                // something strange is going on if cwd is not userHome in an empty workspace
                this._onProcessExit({
                    message: nls.localize('workspaceNotTrustedCreateTerminalCwd', "Cannot launch a terminal process in an untrusted workspace with cwd {0} and userHome {1}", this._cwd, this._userHome)
                });
            }
            // Re-evaluate dimensions if the container has been set since the xterm instance was created
            if (this._container && this._cols === 0 && this._rows === 0) {
                this._initDimensions();
                this.xterm?.raw.resize(this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */);
            }
            const originalIcon = this.shellLaunchConfig.icon;
            await this._processManager.createProcess(this._shellLaunchConfig, this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */).then(result => {
                if (result) {
                    if ('message' in result) {
                        this._onProcessExit(result);
                    }
                    else if ('injectedArgs' in result) {
                        this._injectedArgs = result.injectedArgs;
                    }
                }
            });
            if (this.xterm?.shellIntegration) {
                this.capabilities.add(this.xterm.shellIntegration.capabilities);
            }
            if (originalIcon !== this.shellLaunchConfig.icon || this.shellLaunchConfig.color) {
                this._icon = this._shellLaunchConfig.attachPersistentProcess?.icon || this._shellLaunchConfig.icon;
                this._onIconChanged.fire({ instance: this, userInitiated: false });
            }
        }
        registerMarker(offset) {
            return this.xterm?.raw.registerMarker(offset);
        }
        addBufferMarker(properties) {
            this.capabilities.get(4 /* TerminalCapability.BufferMarkDetection */)?.addMark(properties);
        }
        scrollToMark(startMarkId, endMarkId, highlight) {
            this.xterm?.markTracker.scrollToClosestMarker(startMarkId, endMarkId, highlight);
        }
        async freePortKillProcess(port, command) {
            await this._processManager?.freePortKillProcess(port);
            this.runCommand(command, false);
        }
        _onProcessData(ev) {
            // Ensure events are split by SI command execute sequence to ensure the output of the
            // command can be read by extensions. This must be done here as xterm.js does not currently
            // have a listener for when individual data events are parsed, only `onWriteParsed` which
            // fires when the write buffer is flushed.
            const execIndex = ev.data.indexOf('\x1b]633;C\x07');
            if (execIndex !== -1) {
                if (ev.trackCommit) {
                    this._writeProcessData(ev.data.substring(0, execIndex + '\x1b]633;C\x07'.length));
                    ev.writePromise = new Promise(r => this._writeProcessData(ev.data.substring(execIndex + '\x1b]633;C\x07'.length), r));
                }
                else {
                    this._writeProcessData(ev.data.substring(0, execIndex + '\x1b]633;C\x07'.length));
                    this._writeProcessData(ev.data.substring(execIndex + '\x1b]633;C\x07'.length));
                }
            }
            else {
                if (ev.trackCommit) {
                    ev.writePromise = new Promise(r => this._writeProcessData(ev.data, r));
                }
                else {
                    this._writeProcessData(ev.data);
                }
            }
        }
        _writeProcessData(data, cb) {
            const messageId = ++this._latestXtermWriteData;
            this.xterm?.raw.write(data, () => {
                this._latestXtermParseData = messageId;
                this._processManager.acknowledgeDataEvent(data.length);
                cb?.();
                this._onData.fire(data);
            });
        }
        /**
         * Called when either a process tied to a terminal has exited or when a terminal renderer
         * simulates a process exiting (e.g. custom execution task).
         * @param exitCode The exit code of the process, this is undefined when the terminal was exited
         * through user action.
         */
        async _onProcessExit(exitCodeOrError) {
            // Prevent dispose functions being triggered multiple times
            if (this._isExiting) {
                return;
            }
            const parsedExitResult = parseExitResult(exitCodeOrError, this.shellLaunchConfig, this._processManager.processState, this._initialCwd);
            if (this._usedShellIntegrationInjection && this._processManager.processState === 4 /* ProcessState.KilledDuringLaunch */ && parsedExitResult?.code !== 0) {
                this._relaunchWithShellIntegrationDisabled(parsedExitResult?.message);
                this._onExit.fire(exitCodeOrError);
                return;
            }
            this._isExiting = true;
            await this._flushXtermData();
            this._exitCode = parsedExitResult?.code;
            const exitMessage = parsedExitResult?.message;
            this._logService.debug('Terminal process exit', 'instanceId', this.instanceId, 'code', this._exitCode, 'processState', this._processManager.processState);
            // Only trigger wait on exit when the exit was *not* triggered by the
            // user (via the `workbench.action.terminal.kill` command).
            const waitOnExit = this.waitOnExit;
            if (waitOnExit && this._processManager.processState !== 5 /* ProcessState.KilledByUser */) {
                this._xtermReadyPromise.then(xterm => {
                    if (exitMessage) {
                        xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(exitMessage));
                    }
                    switch (typeof waitOnExit) {
                        case 'string':
                            xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(waitOnExit, { excludeLeadingNewLine: true }));
                            break;
                        case 'function':
                            if (this.exitCode !== undefined) {
                                xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(waitOnExit(this.exitCode), { excludeLeadingNewLine: true }));
                            }
                            break;
                    }
                    // Disable all input if the terminal is exiting and listen for next keypress
                    xterm.raw.options.disableStdin = true;
                    if (xterm.raw.textarea) {
                        this._attachPressAnyKeyToCloseListener(xterm.raw);
                    }
                });
            }
            else {
                this.dispose(terminal_1.TerminalExitReason.Process);
                if (exitMessage) {
                    const failedDuringLaunch = this._processManager.processState === 4 /* ProcessState.KilledDuringLaunch */;
                    if (failedDuringLaunch || this._terminalConfigurationService.config.showExitAlert) {
                        // Always show launch failures
                        this._notificationService.notify({
                            message: exitMessage,
                            severity: notification_1.Severity.Error,
                            actions: { primary: [this._scopedInstantiationService.createInstance(terminalActions_1.TerminalLaunchHelpAction)] }
                        });
                    }
                    else {
                        // Log to help surface the error in case users report issues with showExitAlert
                        // disabled
                        this._logService.warn(exitMessage);
                    }
                }
            }
            // First onExit to consumers, this can happen after the terminal has already been disposed.
            this._onExit.fire(exitCodeOrError);
            // Dispose of the onExit event if the terminal will not be reused again
            if (this.isDisposed) {
                this._onExit.dispose();
            }
        }
        _relaunchWithShellIntegrationDisabled(exitMessage) {
            this._shellLaunchConfig.ignoreShellIntegration = true;
            this.relaunch();
            this.statusList.add({
                id: "shell-integration-attention-needed" /* TerminalStatus.ShellIntegrationAttentionNeeded */,
                severity: notification_1.Severity.Warning,
                icon: codicons_1.Codicon.warning,
                tooltip: (`${exitMessage} ` ?? '') + nls.localize('launchFailed.exitCodeOnlyShellIntegration', 'Disabling shell integration in user settings might help.'),
                hoverActions: [{
                        commandId: "workbench.action.terminal.learnMore" /* TerminalCommandId.ShellIntegrationLearnMore */,
                        label: nls.localize('shellIntegration.learnMore', "Learn more about shell integration"),
                        run: () => {
                            this._openerService.open('https://code.visualstudio.com/docs/editor/integrated-terminal#_shell-integration');
                        }
                    }, {
                        commandId: 'workbench.action.openSettings',
                        label: nls.localize('shellIntegration.openSettings', "Open user settings"),
                        run: () => {
                            this._commandService.executeCommand('workbench.action.openSettings', 'terminal.integrated.shellIntegration.enabled');
                        }
                    }]
            });
            this._telemetryService.publicLog2('terminal/shellIntegrationFailureProcessExit');
        }
        /**
         * Ensure write calls to xterm.js have finished before resolving.
         */
        _flushXtermData() {
            if (this._latestXtermWriteData === this._latestXtermParseData) {
                return Promise.resolve();
            }
            let retries = 0;
            return new Promise(r => {
                const interval = dom.disposableWindowInterval(dom.getActiveWindow().window, () => {
                    if (this._latestXtermWriteData === this._latestXtermParseData || ++retries === 5) {
                        interval.dispose();
                        r();
                    }
                }, 20);
            });
        }
        _attachPressAnyKeyToCloseListener(xterm) {
            if (xterm.textarea && !this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener = dom.addDisposableListener(xterm.textarea, 'keypress', (event) => {
                    if (this._pressAnyKeyToCloseListener) {
                        this._pressAnyKeyToCloseListener.dispose();
                        this._pressAnyKeyToCloseListener = undefined;
                        this.dispose(terminal_1.TerminalExitReason.Process);
                        event.preventDefault();
                    }
                });
            }
        }
        _writeInitialText(xterm, callback) {
            if (!this._shellLaunchConfig.initialText) {
                callback?.();
                return;
            }
            const text = typeof this._shellLaunchConfig.initialText === 'string'
                ? this._shellLaunchConfig.initialText
                : this._shellLaunchConfig.initialText?.text;
            if (typeof this._shellLaunchConfig.initialText === 'string') {
                xterm.raw.writeln(text, callback);
            }
            else {
                if (this._shellLaunchConfig.initialText.trailingNewLine) {
                    xterm.raw.writeln(text, callback);
                }
                else {
                    xterm.raw.write(text, callback);
                }
            }
        }
        async reuseTerminal(shell, reset = false) {
            // Unsubscribe any key listener we may have.
            this._pressAnyKeyToCloseListener?.dispose();
            this._pressAnyKeyToCloseListener = undefined;
            const xterm = this.xterm;
            if (xterm) {
                if (!reset) {
                    // Ensure new processes' output starts at start of new line
                    await new Promise(r => xterm.raw.write('\n\x1b[G', r));
                }
                // Print initialText if specified
                if (shell.initialText) {
                    this._shellLaunchConfig.initialText = shell.initialText;
                    await new Promise(r => this._writeInitialText(xterm, r));
                }
                // Clean up waitOnExit state
                if (this._isExiting && this._shellLaunchConfig.waitOnExit) {
                    xterm.raw.options.disableStdin = false;
                    this._isExiting = false;
                }
                if (reset) {
                    xterm.clearDecorations();
                }
            }
            // Dispose the environment info widget if it exists
            this.statusList.remove("relaunch-needed" /* TerminalStatus.RelaunchNeeded */);
            if (!reset) {
                // HACK: Force initialText to be non-falsy for reused terminals such that the
                // conptyInheritCursor flag is passed to the node-pty, this flag can cause a Window to stop
                // responding in Windows 10 1903 so we only want to use it when something is definitely written
                // to the terminal.
                shell.initialText = ' ';
            }
            // Set the new shell launch config
            this._shellLaunchConfig = shell; // Must be done before calling _createProcess()
            await this._processManager.relaunch(this._shellLaunchConfig, this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */, reset).then(result => {
                if (result) {
                    if ('message' in result) {
                        this._onProcessExit(result);
                    }
                    else if ('injectedArgs' in result) {
                        this._injectedArgs = result.injectedArgs;
                    }
                }
            });
        }
        relaunch() {
            this.reuseTerminal(this._shellLaunchConfig, true);
        }
        _onTitleChange(title) {
            if (this.isTitleSetByProcess) {
                this._setTitle(title, terminal_1.TitleEventSource.Sequence);
            }
        }
        async _trust() {
            return (await this._workspaceTrustRequestService.requestWorkspaceTrust({
                message: nls.localize('terminal.requestTrust', "Creating a terminal process requires executing code")
            })) === true;
        }
        async _onSelectionChange() {
            this._onDidChangeSelection.fire(this);
            if (this._configurationService.getValue("terminal.integrated.copyOnSelection" /* TerminalSettingId.CopyOnSelection */)) {
                if (this._overrideCopySelection === false) {
                    return;
                }
                if (this.hasSelection()) {
                    await this.copySelection();
                }
            }
        }
        overrideCopyOnSelection(value) {
            if (this._overrideCopySelection !== undefined) {
                throw new Error('Cannot set a copy on selection override multiple times');
            }
            this._overrideCopySelection = value;
            return (0, lifecycle_1.toDisposable)(() => this._overrideCopySelection = undefined);
        }
        async _updateProcessCwd() {
            if (this.isDisposed || this.shellLaunchConfig.customPtyImplementation) {
                return;
            }
            // reset cwd if it has changed, so file based url paths can be resolved
            try {
                const cwd = await this._refreshProperty("cwd" /* ProcessPropertyType.Cwd */);
                if (typeof cwd !== 'string') {
                    throw new Error(`cwd is not a string ${cwd}`);
                }
            }
            catch (e) {
                // Swallow this as it means the process has been killed
                if (e instanceof Error && e.message === 'Cannot refresh property when process is not set') {
                    return;
                }
                throw e;
            }
        }
        updateConfig() {
            this._setCommandsToSkipShell(this._terminalConfigurationService.config.commandsToSkipShell);
            this._refreshEnvironmentVariableInfoWidgetState(this._processManager.environmentVariableInfo);
        }
        async _updateUnicodeVersion() {
            this._processManager.setUnicodeVersion(this._terminalConfigurationService.config.unicodeVersion);
        }
        updateAccessibilitySupport() {
            this.xterm.raw.options.screenReaderMode = this._accessibilityService.isScreenReaderOptimized();
        }
        _setCommandsToSkipShell(commands) {
            const excludeCommands = commands.filter(command => command[0] === '-').map(command => command.slice(1));
            this._skipTerminalCommands = terminal_3.DEFAULT_COMMANDS_TO_SKIP_SHELL.filter(defaultCommand => {
                return !excludeCommands.includes(defaultCommand);
            }).concat(commands);
        }
        layout(dimension) {
            this._lastLayoutDimensions = dimension;
            if (this.disableLayout) {
                return;
            }
            // Don't layout if dimensions are invalid (eg. the container is not attached to the DOM or
            // if display: none
            if (dimension.width <= 0 || dimension.height <= 0) {
                return;
            }
            // Evaluate columns and rows, exclude the wrapper element's margin
            const terminalWidth = this._evaluateColsAndRows(dimension.width, dimension.height);
            if (!terminalWidth) {
                return;
            }
            this._resize();
            // Signal the container is ready
            this._containerReadyBarrier.open();
            // Layout all contributions
            for (const contribution of this._contributions.values()) {
                if (!this.xterm) {
                    this._xtermReadyPromise.then(xterm => contribution.layout?.(xterm, dimension));
                }
                else {
                    contribution.layout?.(this.xterm, dimension);
                }
            }
        }
        async _resize() {
            this._resizeNow(false);
        }
        async _resizeNow(immediate) {
            let cols = this.cols;
            let rows = this.rows;
            if (this.xterm) {
                // Only apply these settings when the terminal is visible so that
                // the characters are measured correctly.
                if (this._isVisible && this._layoutSettingsChanged) {
                    const font = this.xterm.getFont();
                    const config = this._terminalConfigurationService.config;
                    this.xterm.raw.options.letterSpacing = font.letterSpacing;
                    this.xterm.raw.options.lineHeight = font.lineHeight;
                    this.xterm.raw.options.fontSize = font.fontSize;
                    this.xterm.raw.options.fontFamily = font.fontFamily;
                    this.xterm.raw.options.fontWeight = config.fontWeight;
                    this.xterm.raw.options.fontWeightBold = config.fontWeightBold;
                    // Any of the above setting changes could have changed the dimensions of the
                    // terminal, re-evaluate now.
                    this._initDimensions();
                    cols = this.cols;
                    rows = this.rows;
                    this._layoutSettingsChanged = false;
                }
                if (isNaN(cols) || isNaN(rows)) {
                    return;
                }
                if (cols !== this.xterm.raw.cols || rows !== this.xterm.raw.rows) {
                    if (this._fixedRows || this._fixedCols) {
                        await this._updateProperty("fixedDimensions" /* ProcessPropertyType.FixedDimensions */, { cols: this._fixedCols, rows: this._fixedRows });
                    }
                    this._onDimensionsChanged.fire();
                }
                this.xterm.raw.resize(cols, rows);
                TerminalInstance_1._lastKnownGridDimensions = { cols, rows };
            }
            if (immediate) {
                // do not await, call setDimensions synchronously
                this._processManager.setDimensions(cols, rows, true);
            }
            else {
                await this._processManager.setDimensions(cols, rows);
            }
        }
        setShellType(shellType) {
            this._shellType = shellType;
            if (shellType) {
                this._terminalShellTypeContextKey.set(shellType?.toString());
            }
        }
        _setAriaLabel(xterm, terminalId, title) {
            const labelParts = [];
            if (xterm && xterm.textarea) {
                if (title && title.length > 0) {
                    labelParts.push(nls.localize('terminalTextBoxAriaLabelNumberAndTitle', "Terminal {0}, {1}", terminalId, title));
                }
                else {
                    labelParts.push(nls.localize('terminalTextBoxAriaLabel', "Terminal {0}", terminalId));
                }
                const screenReaderOptimized = this._accessibilityService.isScreenReaderOptimized();
                if (!screenReaderOptimized) {
                    labelParts.push(nls.localize('terminalScreenReaderMode', "Run the command: Toggle Screen Reader Accessibility Mode for an optimized screen reader experience"));
                }
                const accessibilityHelpKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
                if (this._configurationService.getValue("accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */) && accessibilityHelpKeybinding) {
                    labelParts.push(nls.localize('terminalHelpAriaLabel', "Use {0} for terminal accessibility help", accessibilityHelpKeybinding));
                }
                xterm.textarea.setAttribute('aria-label', labelParts.join('\n'));
            }
        }
        _updateTitleProperties(title, eventSource) {
            if (!title) {
                return this._processName;
            }
            switch (eventSource) {
                case terminal_1.TitleEventSource.Process:
                    if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                        // Extract the file name without extension
                        title = path.win32.parse(title).name;
                    }
                    else {
                        const firstSpaceIndex = title.indexOf(' ');
                        if (title.startsWith('/')) {
                            title = path.basename(title);
                        }
                        else if (firstSpaceIndex > -1) {
                            title = title.substring(0, firstSpaceIndex);
                        }
                    }
                    this._processName = title;
                    break;
                case terminal_1.TitleEventSource.Api:
                    // If the title has not been set by the API or the rename command, unregister the handler that
                    // automatically updates the terminal name
                    this._staticTitle = title;
                    this._messageTitleDisposable.value = undefined;
                    break;
                case terminal_1.TitleEventSource.Sequence:
                    // On Windows, some shells will fire this with the full path which we want to trim
                    // to show just the file name. This should only happen if the title looks like an
                    // absolute Windows file path
                    this._sequence = title;
                    if (this._processManager.os === 1 /* OperatingSystem.Windows */ &&
                        title.match(/^[a-zA-Z]:\\.+\.[a-zA-Z]{1,3}/)) {
                        this._sequence = path.win32.parse(title).name;
                    }
                    break;
            }
            this._titleSource = eventSource;
            return title;
        }
        setOverrideDimensions(dimensions, immediate = false) {
            if (this._dimensionsOverride && this._dimensionsOverride.forceExactSize && !dimensions && this._rows === 0 && this._cols === 0) {
                // this terminal never had a real size => keep the last dimensions override exact size
                this._cols = this._dimensionsOverride.cols;
                this._rows = this._dimensionsOverride.rows;
            }
            this._dimensionsOverride = dimensions;
            if (immediate) {
                this._resizeNow(true);
            }
            else {
                this._resize();
            }
        }
        async setFixedDimensions() {
            const cols = await this._quickInputService.input({
                title: nls.localize('setTerminalDimensionsColumn', "Set Fixed Dimensions: Column"),
                placeHolder: 'Enter a number of columns or leave empty for automatic width',
                validateInput: async (text) => text.length > 0 && !text.match(/^\d+$/) ? { content: 'Enter a number or leave empty size automatically', severity: notification_1.Severity.Error } : undefined
            });
            if (cols === undefined) {
                return;
            }
            this._fixedCols = this._parseFixedDimension(cols);
            this._labelComputer?.refreshLabel(this);
            this._terminalHasFixedWidth.set(!!this._fixedCols);
            const rows = await this._quickInputService.input({
                title: nls.localize('setTerminalDimensionsRow', "Set Fixed Dimensions: Row"),
                placeHolder: 'Enter a number of rows or leave empty for automatic height',
                validateInput: async (text) => text.length > 0 && !text.match(/^\d+$/) ? { content: 'Enter a number or leave empty size automatically', severity: notification_1.Severity.Error } : undefined
            });
            if (rows === undefined) {
                return;
            }
            this._fixedRows = this._parseFixedDimension(rows);
            this._labelComputer?.refreshLabel(this);
            await this._refreshScrollbar();
            this._resize();
            this.focus();
        }
        _parseFixedDimension(value) {
            if (value === '') {
                return undefined;
            }
            const parsed = parseInt(value);
            if (parsed <= 0) {
                throw new Error(`Could not parse dimension "${value}"`);
            }
            return parsed;
        }
        async toggleSizeToContentWidth() {
            if (!this.xterm?.raw.buffer.active) {
                return;
            }
            if (this._hasScrollBar) {
                this._terminalHasFixedWidth.set(false);
                this._fixedCols = undefined;
                this._fixedRows = undefined;
                this._hasScrollBar = false;
                this._initDimensions();
                await this._resize();
            }
            else {
                const font = this.xterm ? this.xterm.getFont() : this._terminalConfigurationService.getFont(dom.getWindow(this.domElement));
                const maxColsForTexture = Math.floor(4096 /* Constants.MaxCanvasWidth */ / (font.charWidth ?? 20));
                // Fixed columns should be at least xterm.js' regular column count
                const proposedCols = Math.max(this.maxCols, Math.min(this.xterm.getLongestViewportWrappedLineLength(), maxColsForTexture));
                // Don't switch to fixed dimensions if the content already fits as it makes the scroll
                // bar look bad being off the edge
                if (proposedCols > this.xterm.raw.cols) {
                    this._fixedCols = proposedCols;
                }
            }
            await this._refreshScrollbar();
            this._labelComputer?.refreshLabel(this);
            this.focus();
        }
        _refreshScrollbar() {
            if (this._fixedCols || this._fixedRows) {
                return this._addScrollbar();
            }
            return this._removeScrollbar();
        }
        async _addScrollbar() {
            const charWidth = (this.xterm ? this.xterm.getFont() : this._terminalConfigurationService.getFont(dom.getWindow(this.domElement))).charWidth;
            if (!this.xterm?.raw.element || !this._container || !charWidth || !this._fixedCols) {
                return;
            }
            this._wrapperElement.classList.add('fixed-dims');
            this._hasScrollBar = true;
            this._initDimensions();
            // Always remove a row to make room for the scroll bar
            this._fixedRows = this._rows - 1;
            await this._resize();
            this._terminalHasFixedWidth.set(true);
            if (!this._horizontalScrollbar) {
                this._horizontalScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this._wrapperElement, {
                    vertical: 2 /* ScrollbarVisibility.Hidden */,
                    horizontal: 1 /* ScrollbarVisibility.Auto */,
                    useShadows: false,
                    scrollYToX: false,
                    consumeMouseWheelIfScrollbarIsNeeded: false
                }));
                this._container.appendChild(this._horizontalScrollbar.getDomNode());
            }
            this._horizontalScrollbar.setScrollDimensions({
                width: this.xterm.raw.element.clientWidth,
                scrollWidth: this._fixedCols * charWidth + 40 // Padding + scroll bar
            });
            this._horizontalScrollbar.getDomNode().style.paddingBottom = '16px';
            // work around for https://github.com/xtermjs/xterm.js/issues/3482
            if (platform_1.isWindows) {
                for (let i = this.xterm.raw.buffer.active.viewportY; i < this.xterm.raw.buffer.active.length; i++) {
                    const line = this.xterm.raw.buffer.active.getLine(i);
                    line._line.isWrapped = false;
                }
            }
        }
        async _removeScrollbar() {
            if (!this._container || !this._horizontalScrollbar) {
                return;
            }
            this._horizontalScrollbar.getDomNode().remove();
            this._horizontalScrollbar.dispose();
            this._horizontalScrollbar = undefined;
            this._wrapperElement.remove();
            this._wrapperElement.classList.remove('fixed-dims');
            this._container.appendChild(this._wrapperElement);
        }
        _setResolvedShellLaunchConfig(shellLaunchConfig) {
            this._shellLaunchConfig.args = shellLaunchConfig.args;
            this._shellLaunchConfig.cwd = shellLaunchConfig.cwd;
            this._shellLaunchConfig.executable = shellLaunchConfig.executable;
            this._shellLaunchConfig.env = shellLaunchConfig.env;
        }
        _onEnvironmentVariableInfoChanged(info) {
            if (info.requiresAction) {
                this.xterm?.raw.textarea?.setAttribute('aria-label', nls.localize('terminalStaleTextBoxAriaLabel', "Terminal {0} environment is stale, run the 'Show Environment Information' command for more information", this._instanceId));
            }
            this._refreshEnvironmentVariableInfoWidgetState(info);
        }
        async _refreshEnvironmentVariableInfoWidgetState(info) {
            // Check if the status should exist
            if (!info) {
                this.statusList.remove("relaunch-needed" /* TerminalStatus.RelaunchNeeded */);
                this.statusList.remove("env-var-info-changes-active" /* TerminalStatus.EnvironmentVariableInfoChangesActive */);
                return;
            }
            // Recreate the process seamlessly without informing the use if the following conditions are
            // met.
            if (
            // The change requires a relaunch
            info.requiresAction &&
                // The feature is enabled
                this._terminalConfigurationService.config.environmentChangesRelaunch &&
                // Has not been interacted with
                !this._processManager.hasWrittenData &&
                // Not a feature terminal or is a reconnecting task terminal (TODO: Need to explain the latter case)
                (!this._shellLaunchConfig.isFeatureTerminal || (this.reconnectionProperties && this._configurationService.getValue('task.reconnection') === true)) &&
                // Not a custom pty
                !this._shellLaunchConfig.customPtyImplementation &&
                // Not an extension owned terminal
                !this._shellLaunchConfig.isExtensionOwnedTerminal &&
                // Not a reconnected or revived terminal
                !this._shellLaunchConfig.attachPersistentProcess &&
                // Not a Windows remote using ConPTY (#187084)
                !(this._processManager.remoteAuthority && this._terminalConfigurationService.config.windowsEnableConpty && (await this._processManager.getBackendOS()) === 1 /* OperatingSystem.Windows */)) {
                this.relaunch();
                return;
            }
            // Re-create statuses
            const workspaceFolder = (0, terminalEnvironment_1.getWorkspaceForTerminal)(this.shellLaunchConfig.cwd, this._workspaceContextService, this._historyService);
            this.statusList.add(info.getStatus({ workspaceFolder }));
        }
        async getInitialCwd() {
            if (!this._initialCwd) {
                this._initialCwd = this._processManager.initialCwd;
            }
            return this._initialCwd;
        }
        async getCwd() {
            if (this.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
                return this.capabilities.get(0 /* TerminalCapability.CwdDetection */).getCwd();
            }
            else if (this.capabilities.has(1 /* TerminalCapability.NaiveCwdDetection */)) {
                return this.capabilities.get(1 /* TerminalCapability.NaiveCwdDetection */).getCwd();
            }
            return this._processManager.initialCwd;
        }
        async _refreshProperty(type) {
            await this.processReady;
            return this._processManager.refreshProperty(type);
        }
        async _updateProperty(type, value) {
            return this._processManager.updateProperty(type, value);
        }
        async rename(title) {
            this._setTitle(title, terminal_1.TitleEventSource.Api);
        }
        _setTitle(title, eventSource) {
            const reset = !title;
            title = this._updateTitleProperties(title, eventSource);
            const titleChanged = title !== this._title;
            this._title = title;
            this._labelComputer?.refreshLabel(this, reset);
            this._setAriaLabel(this.xterm?.raw, this._instanceId, this._title);
            if (titleChanged) {
                this._onTitleChanged.fire(this);
            }
        }
        async changeIcon(icon) {
            if (icon) {
                this._icon = icon;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return icon;
            }
            const iconPicker = this._scopedInstantiationService.createInstance(terminalIconPicker_1.TerminalIconPicker);
            const pickedIcon = await iconPicker.pickIcons();
            iconPicker.dispose();
            if (!pickedIcon) {
                return undefined;
            }
            this._icon = pickedIcon;
            this._onIconChanged.fire({ instance: this, userInitiated: true });
            return pickedIcon;
        }
        async changeColor(color, skipQuickPick) {
            if (color) {
                this.shellLaunchConfig.color = color;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return color;
            }
            else if (skipQuickPick) {
                // Reset this tab's color
                this.shellLaunchConfig.color = '';
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return;
            }
            const icon = this._getIcon();
            if (!icon) {
                return;
            }
            const colorTheme = this._themeService.getColorTheme();
            const standardColors = (0, terminalIcon_1.getStandardColors)(colorTheme);
            const colorStyleDisposable = (0, terminalIcon_1.createColorStyleElement)(colorTheme);
            const items = [];
            for (const colorKey of standardColors) {
                const colorClass = (0, terminalIcon_1.getColorClass)(colorKey);
                items.push({
                    label: `$(${codicons_1.Codicon.circleFilled.id}) ${colorKey.replace('terminal.ansi', '')}`, id: colorKey, description: colorKey, iconClasses: [colorClass]
                });
            }
            items.push({ type: 'separator' });
            const showAllColorsItem = { label: 'Reset to default' };
            items.push(showAllColorsItem);
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.items = items;
            quickPick.matchOnDescription = true;
            quickPick.placeholder = nls.localize('changeColor', 'Select a color for the terminal');
            quickPick.show();
            const disposables = [];
            const result = await new Promise(r => {
                disposables.push(quickPick.onDidHide(() => r(undefined)));
                disposables.push(quickPick.onDidAccept(() => r(quickPick.selectedItems[0])));
            });
            (0, lifecycle_1.dispose)(disposables);
            if (result) {
                this.shellLaunchConfig.color = result.id;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
            }
            quickPick.hide();
            colorStyleDisposable.dispose();
            return result?.id;
        }
        forceScrollbarVisibility() {
            this._wrapperElement.classList.add('force-scrollbar');
        }
        resetScrollbarVisibility() {
            this._wrapperElement.classList.remove('force-scrollbar');
        }
        setParentContextKeyService(parentContextKeyService) {
            this._scopedContextKeyService.updateParent(parentContextKeyService);
        }
    };
    exports.TerminalInstance = TerminalInstance;
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TerminalInstance.prototype, "_fireMaximumDimensionsChanged", null);
    __decorate([
        (0, decorators_1.debounce)(1000)
    ], TerminalInstance.prototype, "relaunch", null);
    __decorate([
        (0, decorators_1.debounce)(2000)
    ], TerminalInstance.prototype, "_updateProcessCwd", null);
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TerminalInstance.prototype, "_resize", null);
    exports.TerminalInstance = TerminalInstance = TerminalInstance_1 = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, terminal_2.ITerminalConfigurationService),
        __param(6, terminal_3.ITerminalProfileResolverService),
        __param(7, pathService_1.IPathService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, preferences_1.IPreferencesService),
        __param(11, viewsService_1.IViewsService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, themeService_1.IThemeService),
        __param(14, configuration_1.IConfigurationService),
        __param(15, terminal_1.ITerminalLogService),
        __param(16, storage_1.IStorageService),
        __param(17, accessibility_1.IAccessibilityService),
        __param(18, productService_1.IProductService),
        __param(19, quickInput_1.IQuickInputService),
        __param(20, environmentService_1.IWorkbenchEnvironmentService),
        __param(21, workspace_1.IWorkspaceContextService),
        __param(22, editorService_1.IEditorService),
        __param(23, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(24, history_2.IHistoryService),
        __param(25, telemetry_1.ITelemetryService),
        __param(26, opener_1.IOpenerService),
        __param(27, commands_1.ICommandService),
        __param(28, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(29, views_1.IViewDescriptorService)
    ], TerminalInstance);
    let TerminalInstanceDragAndDropController = class TerminalInstanceDragAndDropController extends lifecycle_1.Disposable {
        get onDropFile() { return this._onDropFile.event; }
        get onDropTerminal() { return this._onDropTerminal.event; }
        constructor(_container, _layoutService, _viewDescriptorService) {
            super();
            this._container = _container;
            this._layoutService = _layoutService;
            this._viewDescriptorService = _viewDescriptorService;
            this._onDropFile = this._register(new event_1.Emitter());
            this._onDropTerminal = this._register(new event_1.Emitter());
            this._register((0, lifecycle_1.toDisposable)(() => this._clearDropOverlay()));
        }
        _clearDropOverlay() {
            if (this._dropOverlay && this._dropOverlay.parentElement) {
                this._dropOverlay.parentElement.removeChild(this._dropOverlay);
            }
            this._dropOverlay = undefined;
        }
        onDragEnter(e) {
            if (!(0, dnd_2.containsDragType)(e, dnd_1.DataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, "Terminals" /* TerminalDataTransfers.Terminals */, dnd_2.CodeDataTransfers.FILES)) {
                return;
            }
            if (!this._dropOverlay) {
                this._dropOverlay = document.createElement('div');
                this._dropOverlay.classList.add('terminal-drop-overlay');
            }
            // Dragging terminals
            if ((0, dnd_2.containsDragType)(e, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                const side = this._getDropSide(e);
                this._dropOverlay.classList.toggle('drop-before', side === 'before');
                this._dropOverlay.classList.toggle('drop-after', side === 'after');
            }
            if (!this._dropOverlay.parentElement) {
                this._container.appendChild(this._dropOverlay);
            }
        }
        onDragLeave(e) {
            this._clearDropOverlay();
        }
        onDragEnd(e) {
            this._clearDropOverlay();
        }
        onDragOver(e) {
            if (!e.dataTransfer || !this._dropOverlay) {
                return;
            }
            // Dragging terminals
            if ((0, dnd_2.containsDragType)(e, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                const side = this._getDropSide(e);
                this._dropOverlay.classList.toggle('drop-before', side === 'before');
                this._dropOverlay.classList.toggle('drop-after', side === 'after');
            }
            this._dropOverlay.style.opacity = '1';
        }
        async onDrop(e) {
            this._clearDropOverlay();
            if (!e.dataTransfer) {
                return;
            }
            const terminalResources = (0, terminalUri_1.getTerminalResourcesFromDragEvent)(e);
            if (terminalResources) {
                for (const uri of terminalResources) {
                    const side = this._getDropSide(e);
                    this._onDropTerminal.fire({ uri, side });
                }
                return;
            }
            // Check if files were dragged from the tree explorer
            let path;
            const rawResources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
            if (rawResources) {
                path = uri_1.URI.parse(JSON.parse(rawResources)[0]);
            }
            const rawCodeFiles = e.dataTransfer.getData(dnd_2.CodeDataTransfers.FILES);
            if (!path && rawCodeFiles) {
                path = uri_1.URI.file(JSON.parse(rawCodeFiles)[0]);
            }
            if (!path && e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                // Check if the file was dragged from the filesystem
                path = uri_1.URI.file(e.dataTransfer.files[0].path);
            }
            if (!path) {
                return;
            }
            this._onDropFile.fire(path);
        }
        _getDropSide(e) {
            const target = this._container;
            if (!target) {
                return 'after';
            }
            const rect = target.getBoundingClientRect();
            return this._getViewOrientation() === 1 /* Orientation.HORIZONTAL */
                ? (e.clientX - rect.left < rect.width / 2 ? 'before' : 'after')
                : (e.clientY - rect.top < rect.height / 2 ? 'before' : 'after');
        }
        _getViewOrientation() {
            const panelPosition = this._layoutService.getPanelPosition();
            const terminalLocation = this._viewDescriptorService.getViewLocationById(terminal_3.TERMINAL_VIEW_ID);
            return terminalLocation === 1 /* ViewContainerLocation.Panel */ && panelPosition === 2 /* Position.BOTTOM */
                ? 1 /* Orientation.HORIZONTAL */
                : 0 /* Orientation.VERTICAL */;
        }
    };
    TerminalInstanceDragAndDropController = __decorate([
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, views_1.IViewDescriptorService)
    ], TerminalInstanceDragAndDropController);
    var TerminalLabelType;
    (function (TerminalLabelType) {
        TerminalLabelType["Title"] = "title";
        TerminalLabelType["Description"] = "description";
    })(TerminalLabelType || (TerminalLabelType = {}));
    let TerminalLabelComputer = class TerminalLabelComputer extends lifecycle_1.Disposable {
        get title() { return this._title; }
        get description() { return this._description; }
        constructor(_fileService, _terminalConfigurationService, _workspaceContextService) {
            super();
            this._fileService = _fileService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._workspaceContextService = _workspaceContextService;
            this._title = '';
            this._description = '';
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
        }
        refreshLabel(instance, reset) {
            this._title = this.computeLabel(instance, this._terminalConfigurationService.config.tabs.title, "title" /* TerminalLabelType.Title */, reset);
            this._description = this.computeLabel(instance, this._terminalConfigurationService.config.tabs.description, "description" /* TerminalLabelType.Description */);
            if (this._title !== instance.title || this._description !== instance.description || reset) {
                this._onDidChangeLabel.fire({ title: this._title, description: this._description });
            }
        }
        computeLabel(instance, labelTemplate, labelType, reset) {
            const type = instance.shellLaunchConfig.attachPersistentProcess?.type || instance.shellLaunchConfig.type;
            const templateProperties = {
                cwd: instance.cwd || instance.initialCwd || '',
                cwdFolder: '',
                workspaceFolder: instance.workspaceFolder ? path.basename(instance.workspaceFolder.uri.fsPath) : undefined,
                local: type === 'Local' ? terminalStrings_2.terminalStrings.typeLocal : undefined,
                process: instance.processName,
                sequence: instance.sequence,
                task: type === 'Task' ? terminalStrings_2.terminalStrings.typeTask : undefined,
                fixedDimensions: instance.fixedCols
                    ? (instance.fixedRows ? `\u2194${instance.fixedCols} \u2195${instance.fixedRows}` : `\u2194${instance.fixedCols}`)
                    : (instance.fixedRows ? `\u2195${instance.fixedRows}` : ''),
                separator: { label: this._terminalConfigurationService.config.tabs.separator }
            };
            labelTemplate = labelTemplate.trim();
            if (!labelTemplate) {
                return labelType === "title" /* TerminalLabelType.Title */ ? (instance.processName || '') : '';
            }
            if (!reset && instance.staticTitle && labelType === "title" /* TerminalLabelType.Title */) {
                return instance.staticTitle.replace(/[\n\r\t]/g, '') || templateProperties.process?.replace(/[\n\r\t]/g, '') || '';
            }
            const detection = instance.capabilities.has(0 /* TerminalCapability.CwdDetection */) || instance.capabilities.has(1 /* TerminalCapability.NaiveCwdDetection */);
            const folders = this._workspaceContextService.getWorkspace().folders;
            const multiRootWorkspace = folders.length > 1;
            // Only set cwdFolder if detection is on
            if (templateProperties.cwd && detection && (!instance.shellLaunchConfig.isFeatureTerminal || labelType === "title" /* TerminalLabelType.Title */)) {
                const cwdUri = uri_1.URI.from({
                    scheme: instance.workspaceFolder?.uri.scheme || network_1.Schemas.file,
                    path: instance.cwd ? path.resolve(instance.cwd) : undefined
                });
                // Multi-root workspaces always show cwdFolder to disambiguate them, otherwise only show
                // when it differs from the workspace folder in which it was launched from
                let showCwd = false;
                if (multiRootWorkspace) {
                    showCwd = true;
                }
                else if (instance.workspaceFolder?.uri) {
                    const caseSensitive = this._fileService.hasCapability(instance.workspaceFolder.uri, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
                    showCwd = cwdUri.fsPath.localeCompare(instance.workspaceFolder.uri.fsPath, undefined, { sensitivity: caseSensitive ? 'case' : 'base' }) !== 0;
                }
                if (showCwd) {
                    templateProperties.cwdFolder = path.basename(templateProperties.cwd);
                }
            }
            // Remove special characters that could mess with rendering
            const label = (0, labels_1.template)(labelTemplate, templateProperties).replace(/[\n\r\t]/g, '').trim();
            return label === '' && labelType === "title" /* TerminalLabelType.Title */ ? (instance.processName || '') : label;
        }
    };
    exports.TerminalLabelComputer = TerminalLabelComputer;
    exports.TerminalLabelComputer = TerminalLabelComputer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, terminal_2.ITerminalConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], TerminalLabelComputer);
    function parseExitResult(exitCodeOrError, shellLaunchConfig, processState, initialCwd) {
        // Only return a message if the exit code is non-zero
        if (exitCodeOrError === undefined || exitCodeOrError === 0) {
            return { code: exitCodeOrError, message: undefined };
        }
        const code = typeof exitCodeOrError === 'number' ? exitCodeOrError : exitCodeOrError.code;
        // Create exit code message
        let message = undefined;
        switch (typeof exitCodeOrError) {
            case 'number': {
                let commandLine = undefined;
                if (shellLaunchConfig.executable) {
                    commandLine = shellLaunchConfig.executable;
                    if (typeof shellLaunchConfig.args === 'string') {
                        commandLine += ` ${shellLaunchConfig.args}`;
                    }
                    else if (shellLaunchConfig.args && shellLaunchConfig.args.length) {
                        commandLine += shellLaunchConfig.args.map(a => ` '${a}'`).join();
                    }
                }
                if (processState === 4 /* ProcessState.KilledDuringLaunch */) {
                    if (commandLine) {
                        message = nls.localize('launchFailed.exitCodeAndCommandLine', "The terminal process \"{0}\" failed to launch (exit code: {1}).", commandLine, code);
                    }
                    else {
                        message = nls.localize('launchFailed.exitCodeOnly', "The terminal process failed to launch (exit code: {0}).", code);
                    }
                }
                else {
                    if (commandLine) {
                        message = nls.localize('terminated.exitCodeAndCommandLine', "The terminal process \"{0}\" terminated with exit code: {1}.", commandLine, code);
                    }
                    else {
                        message = nls.localize('terminated.exitCodeOnly', "The terminal process terminated with exit code: {0}.", code);
                    }
                }
                break;
            }
            case 'object': {
                // Ignore internal errors
                if (exitCodeOrError.message.toString().includes('Could not find pty with id')) {
                    break;
                }
                // Convert conpty code-based failures into human friendly messages
                let innerMessage = exitCodeOrError.message;
                const conptyError = exitCodeOrError.message.match(/.*error code:\s*(\d+).*$/);
                if (conptyError) {
                    const errorCode = conptyError.length > 1 ? parseInt(conptyError[1]) : undefined;
                    switch (errorCode) {
                        case 5:
                            innerMessage = `Access was denied to the path containing your executable "${shellLaunchConfig.executable}". Manage and change your permissions to get this to work`;
                            break;
                        case 267:
                            innerMessage = `Invalid starting directory "${initialCwd}", review your terminal.integrated.cwd setting`;
                            break;
                        case 1260:
                            innerMessage = `Windows cannot open this program because it has been prevented by a software restriction policy. For more information, open Event Viewer or contact your system Administrator`;
                            break;
                    }
                }
                message = nls.localize('launchFailed.errorMessage', "The terminal process failed to launch: {0}.", innerMessage);
                break;
            }
        }
        return { code, message };
    }
    let TerminalInstanceColorProvider = class TerminalInstanceColorProvider {
        constructor(_instance, _viewDescriptorService) {
            this._instance = _instance;
            this._viewDescriptorService = _viewDescriptorService;
        }
        getBackgroundColor(theme) {
            const terminalBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR);
            if (terminalBackground) {
                return terminalBackground;
            }
            if (this._instance.target === terminal_1.TerminalLocation.Editor) {
                return theme.getColor(colorRegistry_1.editorBackground);
            }
            const location = this._viewDescriptorService.getViewLocationById(terminal_3.TERMINAL_VIEW_ID);
            if (location === 1 /* ViewContainerLocation.Panel */) {
                return theme.getColor(theme_1.PANEL_BACKGROUND);
            }
            return theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
        }
    };
    exports.TerminalInstanceColorProvider = TerminalInstanceColorProvider;
    exports.TerminalInstanceColorProvider = TerminalInstanceColorProvider = __decorate([
        __param(1, views_1.IViewDescriptorService)
    ], TerminalInstanceColorProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxJbnN0YW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdTdFaEcsMENBcUVDO0lBcDZFRCxJQUFXLFNBV1Y7SUFYRCxXQUFXLFNBQVM7UUFDbkI7Ozs7V0FJRztRQUNILHFGQUErQixDQUFBO1FBRS9CLHdEQUFnQixDQUFBO1FBQ2hCLHdEQUFnQixDQUFBO1FBQ2hCLGdFQUFxQixDQUFBO0lBQ3RCLENBQUMsRUFYVSxTQUFTLEtBQVQsU0FBUyxRQVduQjtJQUVELElBQUksZ0JBQTJELENBQUM7SUFZaEUsTUFBTSxtQ0FBbUMsR0FBRzs7Ozs7O0tBTTNDLENBQUM7SUFFSyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVOztpQkFHaEMsdUJBQWtCLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUF1QnRDLElBQUksVUFBVSxLQUFrQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBcUM5RCxJQUFJLDZCQUE2QixLQUFjLE9BQU8sSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztRQU81RixJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQUksZ0NBQWdDLEtBQXVELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7UUFLMUosSUFBSSxVQUFVLEtBQXNDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLHVCQUF1QixFQUFFLFVBQVUsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFD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