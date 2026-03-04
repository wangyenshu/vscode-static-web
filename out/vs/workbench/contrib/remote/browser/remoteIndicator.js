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
define(["require", "exports", "vs/nls", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/environment/browser/environmentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/host/browser/host", "vs/base/common/platform", "vs/base/common/strings", "vs/platform/workspace/common/workspace", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/base/common/iconLabels", "vs/platform/log/common/log", "vs/workbench/browser/actions/windowActions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/htmlContent", "vs/workbench/common/contextkeys", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/telemetry/common/telemetry", "vs/platform/product/common/productService", "vs/base/browser/event", "vs/platform/extensions/common/extensions", "vs/base/common/cancellation", "vs/base/common/themables", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/base/browser/window", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/platform/configuration/common/configuration"], function (require, exports, nls, remoteAgentService_1, async_1, event_1, lifecycle_1, actions_1, statusbar_1, label_1, contextkey_1, commands_1, network_1, extensions_1, quickInput_1, environmentService_1, remoteAuthorityResolver_1, host_1, platform_1, strings_1, workspace_1, remoteHosts_1, virtualWorkspace_1, iconLabels_1, log_1, windowActions_1, extensionManagement_1, extensions_2, htmlContent_1, contextkeys_1, panecomposite_1, telemetry_1, productService_1, event_2, extensions_3, cancellation_1, themables_1, extensionsIcons_1, opener_1, uri_1, window_1, platform_2, configurationRegistry_1, configuration_1, configuration_2) {
    "use strict";
    var RemoteStatusIndicator_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteStatusIndicator = void 0;
    let RemoteStatusIndicator = class RemoteStatusIndicator extends lifecycle_1.Disposable {
        static { RemoteStatusIndicator_1 = this; }
        static { this.ID = 'workbench.contrib.remoteStatusIndicator'; }
        static { this.REMOTE_ACTIONS_COMMAND_ID = 'workbench.action.remote.showMenu'; }
        static { this.CLOSE_REMOTE_COMMAND_ID = 'workbench.action.remote.close'; }
        static { this.SHOW_CLOSE_REMOTE_COMMAND_ID = !platform_1.isWeb; } // web does not have a "Close Remote" command
        static { this.INSTALL_REMOTE_EXTENSIONS_ID = 'workbench.action.remote.extensions'; }
        static { this.REMOTE_STATUS_LABEL_MAX_LENGTH = 40; }
        static { this.REMOTE_CONNECTION_LATENCY_SCHEDULER_DELAY = 60 * 1000; }
        static { this.REMOTE_CONNECTION_LATENCY_SCHEDULER_FIRST_RUN_DELAY = 10 * 1000; }
        get remoteExtensionMetadata() {
            if (!this._remoteExtensionMetadata) {
                const remoteExtensionTips = { ...this.productService.remoteExtensionTips, ...this.productService.virtualWorkspaceExtensionTips };
                this._remoteExtensionMetadata = Object.values(remoteExtensionTips).filter(value => value.startEntry !== undefined).map(value => {
                    return {
                        id: value.extensionId,
                        installed: false,
                        friendlyName: value.friendlyName,
                        isPlatformCompatible: false,
                        dependencies: [],
                        helpLink: value.startEntry?.helpLink ?? '',
                        startConnectLabel: value.startEntry?.startConnectLabel ?? '',
                        startCommand: value.startEntry?.startCommand ?? '',
                        priority: value.startEntry?.priority ?? 10,
                        supportedPlatforms: value.supportedPlatforms
                    };
                });
                this.remoteExtensionMetadata.sort((ext1, ext2) => ext1.priority - ext2.priority);
            }
            return this._remoteExtensionMetadata;
        }
        constructor(statusbarService, environmentService, labelService, contextKeyService, menuService, quickInputService, commandService, extensionService, remoteAgentService, remoteAuthorityResolverService, hostService, workspaceContextService, logService, extensionGalleryService, telemetryService, productService, extensionManagementService, openerService, configurationService) {
            super();
            this.statusbarService = statusbarService;
            this.environmentService = environmentService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.extensionService = extensionService;
            this.remoteAgentService = remoteAgentService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.hostService = hostService;
            this.workspaceContextService = workspaceContextService;
            this.logService = logService;
            this.extensionGalleryService = extensionGalleryService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.extensionManagementService = extensionManagementService;
            this.openerService = openerService;
            this.configurationService = configurationService;
            this.legacyIndicatorMenu = this._register(this.menuService.createMenu(actions_1.MenuId.StatusBarWindowIndicatorMenu, this.contextKeyService)); // to be removed once migration completed
            this.remoteIndicatorMenu = this._register(this.menuService.createMenu(actions_1.MenuId.StatusBarRemoteIndicatorMenu, this.contextKeyService));
            this.remoteAuthority = this.environmentService.remoteAuthority;
            this.virtualWorkspaceLocation = undefined;
            this.connectionState = undefined;
            this.connectionToken = undefined;
            this.connectionStateContextKey = new contextkey_1.RawContextKey('remoteConnectionState', '').bindTo(this.contextKeyService);
            this.networkState = undefined;
            this.measureNetworkConnectionLatencyScheduler = undefined;
            this.loggedInvalidGroupNames = Object.create(null);
            this._remoteExtensionMetadata = undefined;
            this.remoteMetadataInitialized = false;
            this._onDidChangeEntries = this._register(new event_1.Emitter());
            this.onDidChangeEntries = this._onDidChangeEntries.event;
            // Set initial connection state
            if (this.remoteAuthority) {
                this.connectionState = 'initializing';
                this.connectionStateContextKey.set(this.connectionState);
            }
            else {
                this.updateVirtualWorkspaceLocation();
            }
            this.registerActions();
            this.registerListeners();
            this.updateWhenInstalledExtensionsRegistered();
            this.updateRemoteStatusIndicator();
        }
        registerActions() {
            const category = nls.localize2('remote.category', "Remote");
            // Show Remote Menu
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: RemoteStatusIndicator_1.REMOTE_ACTIONS_COMMAND_ID,
                        category,
                        title: nls.localize2('remote.showMenu', "Show Remote Menu"),
                        f1: true,
                        keybinding: {
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 45 /* KeyCode.KeyO */,
                        }
                    });
                    this.run = () => that.showRemoteMenu();
                }
            }));
            // Close Remote Connection
            if (RemoteStatusIndicator_1.SHOW_CLOSE_REMOTE_COMMAND_ID) {
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: RemoteStatusIndicator_1.CLOSE_REMOTE_COMMAND_ID,
                            category,
                            title: nls.localize2('remote.close', "Close Remote Connection"),
                            f1: true,
                            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.RemoteNameContext, contextkeys_1.VirtualWorkspaceContext)
                        });
                        this.run = () => that.hostService.openWindow({ forceReuseWindow: true, remoteAuthority: null });
                    }
                }));
                if (this.remoteAuthority) {
                    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
                        group: '6_close',
                        command: {
                            id: RemoteStatusIndicator_1.CLOSE_REMOTE_COMMAND_ID,
                            title: nls.localize({ key: 'miCloseRemote', comment: ['&& denotes a mnemonic'] }, "Close Re&&mote Connection")
                        },
                        order: 3.5
                    });
                }
            }
            if (this.extensionGalleryService.isEnabled()) {
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: RemoteStatusIndicator_1.INSTALL_REMOTE_EXTENSIONS_ID,
                            category,
                            title: nls.localize2('remote.install', "Install Remote Development Extensions"),
                            f1: true
                        });
                        this.run = (accessor, input) => {
                            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
                            return paneCompositeService.openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true).then(viewlet => {
                                if (viewlet) {
                                    (viewlet?.getViewPaneContainer()).search(`@recommended:remotes`);
                                    viewlet.focus();
                                }
                            });
                        };
                    }
                }));
            }
        }
        registerListeners() {
            // Menu changes
            const updateRemoteActions = () => {
                this.remoteMenuActionsGroups = undefined;
                this.updateRemoteStatusIndicator();
            };
            this._register(this.legacyIndicatorMenu.onDidChange(updateRemoteActions));
            this._register(this.remoteIndicatorMenu.onDidChange(updateRemoteActions));
            // Update indicator when formatter changes as it may have an impact on the remote label
            this._register(this.labelService.onDidChangeFormatters(() => this.updateRemoteStatusIndicator()));
            // Update based on remote indicator changes if any
            const remoteIndicator = this.environmentService.options?.windowIndicator;
            if (remoteIndicator && remoteIndicator.onDidChange) {
                this._register(remoteIndicator.onDidChange(() => this.updateRemoteStatusIndicator()));
            }
            // Listen to changes of the connection
            if (this.remoteAuthority) {
                const connection = this.remoteAgentService.getConnection();
                if (connection) {
                    this._register(connection.onDidStateChange((e) => {
                        switch (e.type) {
                            case 0 /* PersistentConnectionEventType.ConnectionLost */:
                            case 2 /* PersistentConnectionEventType.ReconnectionRunning */:
                            case 1 /* PersistentConnectionEventType.ReconnectionWait */:
                                this.setConnectionState('reconnecting');
                                break;
                            case 3 /* PersistentConnectionEventType.ReconnectionPermanentFailure */:
                                this.setConnectionState('disconnected');
                                break;
                            case 4 /* PersistentConnectionEventType.ConnectionGain */:
                                this.setConnectionState('connected');
                                break;
                        }
                    }));
                }
            }
            else {
                this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => {
                    this.updateVirtualWorkspaceLocation();
                    this.updateRemoteStatusIndicator();
                }));
            }
            // Online / Offline changes (web only)
            if (platform_1.isWeb) {
                this._register(event_1.Event.any(this._register(new event_2.DomEmitter(window_1.mainWindow, 'online')).event, this._register(new event_2.DomEmitter(window_1.mainWindow, 'offline')).event)(() => this.setNetworkState(navigator.onLine ? 'online' : 'offline')));
            }
            this._register(this.extensionService.onDidChangeExtensions(async (result) => {
                for (const ext of result.added) {
                    const index = this.remoteExtensionMetadata.findIndex(value => extensions_3.ExtensionIdentifier.equals(value.id, ext.identifier));
                    if (index > -1) {
                        this.remoteExtensionMetadata[index].installed = true;
                    }
                }
            }));
            this._register(this.extensionManagementService.onDidUninstallExtension(async (result) => {
                const index = this.remoteExtensionMetadata.findIndex(value => extensions_3.ExtensionIdentifier.equals(value.id, result.identifier.id));
                if (index > -1) {
                    this.remoteExtensionMetadata[index].installed = false;
                }
            }));
        }
        async initializeRemoteMetadata() {
            if (this.remoteMetadataInitialized) {
                return;
            }
            const currentPlatform = (0, platform_1.PlatformToString)(platform_1.platform);
            for (let i = 0; i < this.remoteExtensionMetadata.length; i++) {
                const extensionId = this.remoteExtensionMetadata[i].id;
                const supportedPlatforms = this.remoteExtensionMetadata[i].supportedPlatforms;
                const isInstalled = (await this.extensionManagementService.getInstalled()).find(value => extensions_3.ExtensionIdentifier.equals(value.identifier.id, extensionId)) ? true : false;
                this.remoteExtensionMetadata[i].installed = isInstalled;
                if (isInstalled) {
                    this.remoteExtensionMetadata[i].isPlatformCompatible = true;
                }
                else if (supportedPlatforms && !supportedPlatforms.includes(currentPlatform)) {
                    this.remoteExtensionMetadata[i].isPlatformCompatible = false;
                }
                else {
                    this.remoteExtensionMetadata[i].isPlatformCompatible = true;
                }
            }
            this.remoteMetadataInitialized = true;
            this._onDidChangeEntries.fire();
            this.updateRemoteStatusIndicator();
        }
        updateVirtualWorkspaceLocation() {
            this.virtualWorkspaceLocation = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.workspaceContextService.getWorkspace());
        }
        async updateWhenInstalledExtensionsRegistered() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const remoteAuthority = this.remoteAuthority;
            if (remoteAuthority) {
                // Try to resolve the authority to figure out connection state
                (async () => {
                    try {
                        const { authority } = await this.remoteAuthorityResolverService.resolveAuthority(remoteAuthority);
                        this.connectionToken = authority.connectionToken;
                        this.setConnectionState('connected');
                    }
                    catch (error) {
                        this.setConnectionState('disconnected');
                    }
                })();
            }
            this.updateRemoteStatusIndicator();
            this.initializeRemoteMetadata();
        }
        setConnectionState(newState) {
            if (this.connectionState !== newState) {
                this.connectionState = newState;
                // simplify context key which doesn't support `connecting`
                if (this.connectionState === 'reconnecting') {
                    this.connectionStateContextKey.set('disconnected');
                }
                else {
                    this.connectionStateContextKey.set(this.connectionState);
                }
                // indicate status
                this.updateRemoteStatusIndicator();
                // start measuring connection latency once connected
                if (newState === 'connected') {
                    this.scheduleMeasureNetworkConnectionLatency();
                }
            }
        }
        scheduleMeasureNetworkConnectionLatency() {
            if (!this.remoteAuthority || // only when having a remote connection
                this.measureNetworkConnectionLatencyScheduler // already scheduled
            ) {
                return;
            }
            this.measureNetworkConnectionLatencyScheduler = this._register(new async_1.RunOnceScheduler(() => this.measureNetworkConnectionLatency(), RemoteStatusIndicator_1.REMOTE_CONNECTION_LATENCY_SCHEDULER_DELAY));
            this.measureNetworkConnectionLatencyScheduler.schedule(RemoteStatusIndicator_1.REMOTE_CONNECTION_LATENCY_SCHEDULER_FIRST_RUN_DELAY);
        }
        async measureNetworkConnectionLatency() {
            // Measure latency if we are online
            // but only when the window has focus to prevent constantly
            // waking up the connection to the remote
            if (this.hostService.hasFocus && this.networkState !== 'offline') {
                const measurement = await remoteAgentService_1.remoteConnectionLatencyMeasurer.measure(this.remoteAgentService);
                if (measurement) {
                    if (measurement.high) {
                        this.setNetworkState('high-latency');
                    }
                    else if (this.networkState === 'high-latency') {
                        this.setNetworkState('online');
                    }
                }
            }
            this.measureNetworkConnectionLatencyScheduler?.schedule();
        }
        setNetworkState(newState) {
            if (this.networkState !== newState) {
                const oldState = this.networkState;
                this.networkState = newState;
                if (newState === 'high-latency') {
                    this.logService.warn(`Remote network connection appears to have high latency (${remoteAgentService_1.remoteConnectionLatencyMeasurer.latency?.current?.toFixed(2)}ms last, ${remoteAgentService_1.remoteConnectionLatencyMeasurer.latency?.average?.toFixed(2)}ms average)`);
                }
                if (this.connectionToken) {
                    if (newState === 'online' && oldState === 'high-latency') {
                        this.logNetworkConnectionHealthTelemetry(this.connectionToken, 'good');
                    }
                    else if (newState === 'high-latency' && oldState === 'online') {
                        this.logNetworkConnectionHealthTelemetry(this.connectionToken, 'poor');
                    }
                }
                // update status
                this.updateRemoteStatusIndicator();
            }
        }
        logNetworkConnectionHealthTelemetry(connectionToken, connectionHealth) {
            this.telemetryService.publicLog2('remoteConnectionHealth', {
                remoteName: (0, remoteHosts_1.getRemoteName)(this.remoteAuthority),
                reconnectionToken: connectionToken,
                connectionHealth
            });
        }
        validatedGroup(group) {
            if (!group.match(/^(remote|virtualfs)_(\d\d)_(([a-z][a-z0-9+.-]*)_(.*))$/)) {
                if (!this.loggedInvalidGroupNames[group]) {
                    this.loggedInvalidGroupNames[group] = true;
                    this.logService.warn(`Invalid group name used in "statusBar/remoteIndicator" menu contribution: ${group}. Entries ignored. Expected format: 'remote_$ORDER_$REMOTENAME_$GROUPING or 'virtualfs_$ORDER_$FILESCHEME_$GROUPING.`);
                }
                return false;
            }
            return true;
        }
        getRemoteMenuActions(doNotUseCache) {
            if (!this.remoteMenuActionsGroups || doNotUseCache) {
                this.remoteMenuActionsGroups = this.remoteIndicatorMenu.getActions().filter(a => this.validatedGroup(a[0])).concat(this.legacyIndicatorMenu.getActions());
            }
            return this.remoteMenuActionsGroups;
        }
        updateRemoteStatusIndicator() {
            // Remote Indicator: show if provided via options, e.g. by the web embedder API
            const remoteIndicator = this.environmentService.options?.windowIndicator;
            if (remoteIndicator) {
                let remoteIndicatorLabel = remoteIndicator.label.trim();
                if (!remoteIndicatorLabel.startsWith('$(')) {
                    remoteIndicatorLabel = `$(remote) ${remoteIndicatorLabel}`; // ensure the indicator has a codicon
                }
                this.renderRemoteStatusIndicator((0, strings_1.truncate)(remoteIndicatorLabel, RemoteStatusIndicator_1.REMOTE_STATUS_LABEL_MAX_LENGTH), remoteIndicator.tooltip, remoteIndicator.command);
                return;
            }
            // Show for remote windows on the desktop
            if (this.remoteAuthority) {
                const hostLabel = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.remoteAuthority) || this.remoteAuthority;
                switch (this.connectionState) {
                    case 'initializing':
                        this.renderRemoteStatusIndicator(nls.localize('host.open', "Opening Remote..."), nls.localize('host.open', "Opening Remote..."), undefined, true /* progress */);
                        break;
                    case 'reconnecting':
                        this.renderRemoteStatusIndicator(`${nls.localize('host.reconnecting', "Reconnecting to {0}...", (0, strings_1.truncate)(hostLabel, RemoteStatusIndicator_1.REMOTE_STATUS_LABEL_MAX_LENGTH))}`, undefined, undefined, true /* progress */);
                        break;
                    case 'disconnected':
                        this.renderRemoteStatusIndicator(`$(alert) ${nls.localize('disconnectedFrom', "Disconnected from {0}", (0, strings_1.truncate)(hostLabel, RemoteStatusIndicator_1.REMOTE_STATUS_LABEL_MAX_LENGTH))}`);
                        break;
                    default: {
                        const tooltip = new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
                        const hostNameTooltip = this.labelService.getHostTooltip(network_1.Schemas.vscodeRemote, this.remoteAuthority);
                        if (hostNameTooltip) {
                            tooltip.appendMarkdown(hostNameTooltip);
                        }
                        else {
                            tooltip.appendText(nls.localize({ key: 'host.tooltip', comment: ['{0} is a remote host name, e.g. Dev Container'] }, "Editing on {0}", hostLabel));
                        }
                        this.renderRemoteStatusIndicator(`$(remote) ${(0, strings_1.truncate)(hostLabel, RemoteStatusIndicator_1.REMOTE_STATUS_LABEL_MAX_LENGTH)}`, tooltip);
                    }
                }
                return;
            }
            // Show when in a virtual workspace
            if (this.virtualWorkspaceLocation) {
                // Workspace with label: indicate editing source
                const workspaceLabel = this.labelService.getHostLabel(this.virtualWorkspaceLocation.scheme, this.virtualWorkspaceLocation.authority);
                if (workspaceLabel) {
                    const tooltip = new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
                    const hostNameTooltip = this.labelService.getHostTooltip(this.virtualWorkspaceLocation.scheme, this.virtualWorkspaceLocation.authority);
                    if (hostNameTooltip) {
                        tooltip.appendMarkdown(hostNameTooltip);
                    }
                    else {
                        tooltip.appendText(nls.localize({ key: 'workspace.tooltip', comment: ['{0} is a remote workspace name, e.g. GitHub'] }, "Editing on {0}", workspaceLabel));
                    }
                    if (!platform_1.isWeb || this.remoteAuthority) {
                        tooltip.appendMarkdown('\n\n');
                        tooltip.appendMarkdown(nls.localize({ key: 'workspace.tooltip2', comment: ['[features are not available]({1}) is a link. Only translate `features are not available`. Do not change brackets and parentheses or {0}'] }, "Some [features are not available]({0}) for resources located on a virtual file system.", `command:${extensions_2.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`));
                    }
                    this.renderRemoteStatusIndicator(`$(remote) ${(0, strings_1.truncate)(workspaceLabel, RemoteStatusIndicator_1.REMOTE_STATUS_LABEL_MAX_LENGTH)}`, tooltip);
                    return;
                }
            }
            this.renderRemoteStatusIndicator(`$(remote)`, nls.localize('noHost.tooltip', "Open a Remote Window"));
            return;
        }
        renderRemoteStatusIndicator(initialText, initialTooltip, command, showProgress) {
            const { text, tooltip, ariaLabel } = this.withNetworkStatus(initialText, initialTooltip, showProgress);
            const properties = {
                name: nls.localize('remoteHost', "Remote Host"),
                kind: this.networkState === 'offline' ? 'offline' : 'remote',
                ariaLabel,
                text,
                showProgress,
                tooltip,
                command: command ?? RemoteStatusIndicator_1.REMOTE_ACTIONS_COMMAND_ID
            };
            if (this.remoteStatusEntry) {
                this.remoteStatusEntry.update(properties);
            }
            else {
                this.remoteStatusEntry = this.statusbarService.addEntry(properties, 'status.host', 0 /* StatusbarAlignment.LEFT */, Number.MAX_VALUE /* first entry */);
            }
        }
        withNetworkStatus(initialText, initialTooltip, showProgress) {
            let text = initialText;
            let tooltip = initialTooltip;
            let ariaLabel = (0, iconLabels_1.getCodiconAriaLabel)(text);
            function textWithAlert() {
                // `initialText` can have a codicon in the beginning that already
                // indicates some kind of status, or we may have been asked to
                // show progress, where a spinning codicon appears. we only want
                // to replace with an alert icon for when a normal remote indicator
                // is shown.
                if (!showProgress && initialText.startsWith('$(remote)')) {
                    return initialText.replace('$(remote)', '$(alert)');
                }
                return initialText;
            }
            switch (this.networkState) {
                case 'offline': {
                    const offlineMessage = nls.localize('networkStatusOfflineTooltip', "Network appears to be offline, certain features might be unavailable.");
                    text = textWithAlert();
                    tooltip = this.appendTooltipLine(tooltip, offlineMessage);
                    ariaLabel = `${ariaLabel}, ${offlineMessage}`;
                    break;
                }
                case 'high-latency':
                    text = textWithAlert();
                    tooltip = this.appendTooltipLine(tooltip, nls.localize('networkStatusHighLatencyTooltip', "Network appears to have high latency ({0}ms last, {1}ms average), certain features may be slow to respond.", remoteAgentService_1.remoteConnectionLatencyMeasurer.latency?.current?.toFixed(2), remoteAgentService_1.remoteConnectionLatencyMeasurer.latency?.average?.toFixed(2)));
                    break;
            }
            return { text, tooltip, ariaLabel };
        }
        appendTooltipLine(tooltip, line) {
            let markdownTooltip;
            if (typeof tooltip === 'string') {
                markdownTooltip = new htmlContent_1.MarkdownString(tooltip, { isTrusted: true, supportThemeIcons: true });
            }
            else {
                markdownTooltip = tooltip ?? new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
            }
            if (markdownTooltip.value.length > 0) {
                markdownTooltip.appendMarkdown('\n\n');
            }
            markdownTooltip.appendMarkdown(line);
            return markdownTooltip;
        }
        async installExtension(extensionId) {
            const galleryExtension = (await this.extensionGalleryService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
            await this.extensionManagementService.installFromGallery(galleryExtension, {
                isMachineScoped: false,
                donotIncludePackAndDependencies: false,
                context: { [extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT]: true }
            });
        }
        async runRemoteStartCommand(extensionId, startCommand) {
            // check to ensure the extension is installed
            await (0, async_1.retry)(async () => {
                const ext = await this.extensionService.getExtension(extensionId);
                if (!ext) {
                    throw Error('Failed to find installed remote extension');
                }
                return ext;
            }, 300, 10);
            this.commandService.executeCommand(startCommand);
            this.telemetryService.publicLog2('workbenchActionExecuted', {
                id: 'remoteInstallAndRun',
                detail: extensionId,
                from: 'remote indicator'
            });
        }
        showRemoteMenu() {
            const getCategoryLabel = (action) => {
                if (action.item.category) {
                    return typeof action.item.category === 'string' ? action.item.category : action.item.category.value;
                }
                return undefined;
            };
            const matchCurrentRemote = () => {
                if (this.remoteAuthority) {
                    return new RegExp(`^remote_\\d\\d_${(0, remoteHosts_1.getRemoteName)(this.remoteAuthority)}_`);
                }
                else if (this.virtualWorkspaceLocation) {
                    return new RegExp(`^virtualfs_\\d\\d_${this.virtualWorkspaceLocation.scheme}_`);
                }
                return undefined;
            };
            const computeItems = () => {
                let actionGroups = this.getRemoteMenuActions(true);
                const items = [];
                const currentRemoteMatcher = matchCurrentRemote();
                if (currentRemoteMatcher) {
                    // commands for the current remote go first
                    actionGroups = actionGroups.sort((g1, g2) => {
                        const isCurrentRemote1 = currentRemoteMatcher.test(g1[0]);
                        const isCurrentRemote2 = currentRemoteMatcher.test(g2[0]);
                        if (isCurrentRemote1 !== isCurrentRemote2) {
                            return isCurrentRemote1 ? -1 : 1;
                        }
                        // legacy indicator commands go last
                        if (g1[0] !== '' && g2[0] === '') {
                            return -1;
                        }
                        else if (g1[0] === '' && g2[0] !== '') {
                            return 1;
                        }
                        return g1[0].localeCompare(g2[0]);
                    });
                }
                let lastCategoryName = undefined;
                for (const actionGroup of actionGroups) {
                    let hasGroupCategory = false;
                    for (const action of actionGroup[1]) {
                        if (action instanceof actions_1.MenuItemAction) {
                            if (!hasGroupCategory) {
                                const category = getCategoryLabel(action);
                                if (category !== lastCategoryName) {
                                    items.push({ type: 'separator', label: category });
                                    lastCategoryName = category;
                                }
                                hasGroupCategory = true;
                            }
                            const label = typeof action.item.title === 'string' ? action.item.title : action.item.title.value;
                            items.push({
                                type: 'item',
                                id: action.item.id,
                                label
                            });
                        }
                    }
                }
                const showExtensionRecommendations = this.configurationService.getValue('workbench.remoteIndicator.showExtensionRecommendations');
                if (showExtensionRecommendations && this.extensionGalleryService.isEnabled() && this.remoteMetadataInitialized) {
                    const notInstalledItems = [];
                    for (const metadata of this.remoteExtensionMetadata) {
                        if (!metadata.installed && metadata.isPlatformCompatible) {
                            // Create Install QuickPick with a help link
                            const label = metadata.startConnectLabel;
                            const buttons = [{
                                    iconClass: themables_1.ThemeIcon.asClassName(extensionsIcons_1.infoIcon),
                                    tooltip: nls.localize('remote.startActions.help', "Learn More")
                                }];
                            notInstalledItems.push({ type: 'item', id: metadata.id, label: label, buttons: buttons });
                        }
                    }
                    items.push({
                        type: 'separator', label: nls.localize('remote.startActions.install', 'Install')
                    });
                    items.push(...notInstalledItems);
                }
                items.push({
                    type: 'separator'
                });
                const entriesBeforeConfig = items.length;
                if (RemoteStatusIndicator_1.SHOW_CLOSE_REMOTE_COMMAND_ID) {
                    if (this.remoteAuthority) {
                        items.push({
                            type: 'item',
                            id: RemoteStatusIndicator_1.CLOSE_REMOTE_COMMAND_ID,
                            label: nls.localize('closeRemoteConnection.title', 'Close Remote Connection')
                        });
                        if (this.connectionState === 'disconnected') {
                            items.push({
                                type: 'item',
                                id: windowActions_1.ReloadWindowAction.ID,
                                label: nls.localize('reloadWindow', 'Reload Window')
                            });
                        }
                    }
                    else if (this.virtualWorkspaceLocation) {
                        items.push({
                            type: 'item',
                            id: RemoteStatusIndicator_1.CLOSE_REMOTE_COMMAND_ID,
                            label: nls.localize('closeVirtualWorkspace.title', 'Close Remote Workspace')
                        });
                    }
                }
                if (items.length === entriesBeforeConfig) {
                    items.pop(); // remove the separator again
                }
                return items;
            };
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.placeholder = nls.localize('remoteActions', "Select an option to open a Remote Window");
            quickPick.items = computeItems();
            quickPick.sortByLabel = false;
            quickPick.canSelectMany = false;
            event_1.Event.once(quickPick.onDidAccept)((async (_) => {
                const selectedItems = quickPick.selectedItems;
                if (selectedItems.length === 1) {
                    const commandId = selectedItems[0].id;
                    const remoteExtension = this.remoteExtensionMetadata.find(value => extensions_3.ExtensionIdentifier.equals(value.id, commandId));
                    if (remoteExtension) {
                        quickPick.items = [];
                        quickPick.busy = true;
                        quickPick.placeholder = nls.localize('remote.startActions.installingExtension', 'Installing extension... ');
                        await this.installExtension(remoteExtension.id);
                        quickPick.hide();
                        await this.runRemoteStartCommand(remoteExtension.id, remoteExtension.startCommand);
                    }
                    else {
                        this.telemetryService.publicLog2('workbenchActionExecuted', {
                            id: commandId,
                            from: 'remote indicator'
                        });
                        this.commandService.executeCommand(commandId);
                        quickPick.hide();
                    }
                }
            }));
            event_1.Event.once(quickPick.onDidTriggerItemButton)(async (e) => {
                const remoteExtension = this.remoteExtensionMetadata.find(value => extensions_3.ExtensionIdentifier.equals(value.id, e.item.id));
                if (remoteExtension) {
                    await this.openerService.open(uri_1.URI.parse(remoteExtension.helpLink));
                }
            });
            // refresh the items when actions change
            const legacyItemUpdater = this.legacyIndicatorMenu.onDidChange(() => quickPick.items = computeItems());
            quickPick.onDidHide(legacyItemUpdater.dispose);
            const itemUpdater = this.remoteIndicatorMenu.onDidChange(() => quickPick.items = computeItems());
            quickPick.onDidHide(itemUpdater.dispose);
            if (!this.remoteMetadataInitialized) {
                quickPick.busy = true;
                this._register(this.onDidChangeEntries(() => {
                    // If quick pick is open, update the quick pick items after initialization.
                    quickPick.busy = false;
                    quickPick.items = computeItems();
                }));
            }
            quickPick.show();
        }
    };
    exports.RemoteStatusIndicator = RemoteStatusIndicator;
    exports.RemoteStatusIndicator = RemoteStatusIndicator = RemoteStatusIndicator_1 = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, label_1.ILabelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, commands_1.ICommandService),
        __param(7, extensions_1.IExtensionService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, host_1.IHostService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, log_1.ILogService),
        __param(13, extensionManagement_1.IExtensionGalleryService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, productService_1.IProductService),
        __param(16, extensionManagement_1.IExtensionManagementService),
        __param(17, opener_1.IOpenerService),
        __param(18, configuration_2.IConfigurationService)
    ], RemoteStatusIndicator);
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.remoteIndicator.showExtensionRecommendations': {
                type: 'boolean',
                markdownDescription: nls.localize('remote.showExtensionRecommendations', "When enabled, remote extensions recommendations will be shown in the Remote Indicator menu."),
                default: true
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlSW5kaWNhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvcmVtb3RlSW5kaWNhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtRXpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7O2lCQUVwQyxPQUFFLEdBQUcseUNBQXlDLEFBQTVDLENBQTZDO2lCQUV2Qyw4QkFBeUIsR0FBRyxrQ0FBa0MsQUFBckMsQ0FBc0M7aUJBQy9ELDRCQUF1QixHQUFHLCtCQUErQixBQUFsQyxDQUFtQztpQkFDMUQsaUNBQTRCLEdBQUcsQ0FBQyxnQkFBSyxBQUFULENBQVUsR0FBQyw2Q0FBNkM7aUJBQ3BGLGlDQUE0QixHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztpQkFFcEUsbUNBQThCLEdBQUcsRUFBRSxBQUFMLENBQU07aUJBRXBDLDhDQUF5QyxHQUFHLEVBQUUsR0FBRyxJQUFJLEFBQVosQ0FBYTtpQkFDdEQsd0RBQW1ELEdBQUcsRUFBRSxHQUFHLElBQUksQUFBWixDQUFhO1FBdUJ4RixJQUFZLHVCQUF1QjtZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLDZCQUE2QixFQUFFLENBQUM7Z0JBQ2pJLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxTQUFT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