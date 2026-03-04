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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/remoteTunnel/common/remoteTunnel", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/common/contributions", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/output/common/output", "vs/workbench/services/preferences/common/preferences"], function (require, exports, actions_1, lifecycle_1, network_1, resources_1, types_1, uri_1, nls_1, actions_2, clipboardService_1, commands_1, configurationRegistry_1, contextkey_1, dialogs_1, environment_1, log_1, notification_1, opener_1, productService_1, progress_1, quickInput_1, platform_1, remoteTunnel_1, storage_1, workspace_1, contributions_1, authentication_1, extensions_1, output_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTunnelWorkbenchContribution = exports.REMOTE_TUNNEL_CONNECTION_STATE = exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY = exports.REMOTE_TUNNEL_CATEGORY = void 0;
    exports.REMOTE_TUNNEL_CATEGORY = (0, nls_1.localize2)('remoteTunnel.category', 'Remote Tunnels');
    exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY = 'remoteTunnelConnection';
    exports.REMOTE_TUNNEL_CONNECTION_STATE = new contextkey_1.RawContextKey(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected');
    const REMOTE_TUNNEL_USED_STORAGE_KEY = 'remoteTunnelServiceUsed';
    const REMOTE_TUNNEL_PROMPTED_PREVIEW_STORAGE_KEY = 'remoteTunnelServicePromptedPreview';
    const REMOTE_TUNNEL_EXTENSION_RECOMMENDED_KEY = 'remoteTunnelExtensionRecommended';
    const REMOTE_TUNNEL_HAS_USED_BEFORE = 'remoteTunnelHasUsed';
    const REMOTE_TUNNEL_EXTENSION_TIMEOUT = 4 * 60 * 1000; // show the recommendation that a machine started using tunnels if it joined less than 4 minutes ago
    const INVALID_TOKEN_RETRIES = 2;
    var RemoteTunnelCommandIds;
    (function (RemoteTunnelCommandIds) {
        RemoteTunnelCommandIds["turnOn"] = "workbench.remoteTunnel.actions.turnOn";
        RemoteTunnelCommandIds["turnOff"] = "workbench.remoteTunnel.actions.turnOff";
        RemoteTunnelCommandIds["connecting"] = "workbench.remoteTunnel.actions.connecting";
        RemoteTunnelCommandIds["manage"] = "workbench.remoteTunnel.actions.manage";
        RemoteTunnelCommandIds["showLog"] = "workbench.remoteTunnel.actions.showLog";
        RemoteTunnelCommandIds["configure"] = "workbench.remoteTunnel.actions.configure";
        RemoteTunnelCommandIds["copyToClipboard"] = "workbench.remoteTunnel.actions.copyToClipboard";
        RemoteTunnelCommandIds["learnMore"] = "workbench.remoteTunnel.actions.learnMore";
    })(RemoteTunnelCommandIds || (RemoteTunnelCommandIds = {}));
    // name shown in nofications
    var RemoteTunnelCommandLabels;
    (function (RemoteTunnelCommandLabels) {
        RemoteTunnelCommandLabels.turnOn = (0, nls_1.localize)('remoteTunnel.actions.turnOn', 'Turn on Remote Tunnel Access...');
        RemoteTunnelCommandLabels.turnOff = (0, nls_1.localize)('remoteTunnel.actions.turnOff', 'Turn off Remote Tunnel Access...');
        RemoteTunnelCommandLabels.showLog = (0, nls_1.localize)('remoteTunnel.actions.showLog', 'Show Remote Tunnel Service Log');
        RemoteTunnelCommandLabels.configure = (0, nls_1.localize)('remoteTunnel.actions.configure', 'Configure Tunnel Name...');
        RemoteTunnelCommandLabels.copyToClipboard = (0, nls_1.localize)('remoteTunnel.actions.copyToClipboard', 'Copy Browser URI to Clipboard');
        RemoteTunnelCommandLabels.learnMore = (0, nls_1.localize)('remoteTunnel.actions.learnMore', 'Get Started with Tunnels');
    })(RemoteTunnelCommandLabels || (RemoteTunnelCommandLabels = {}));
    let RemoteTunnelWorkbenchContribution = class RemoteTunnelWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(authenticationService, dialogService, extensionService, contextKeyService, productService, storageService, loggerService, quickInputService, environmentService, remoteTunnelService, commandService, workspaceContextService, progressService, notificationService) {
            super();
            this.authenticationService = authenticationService;
            this.dialogService = dialogService;
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this.quickInputService = quickInputService;
            this.environmentService = environmentService;
            this.remoteTunnelService = remoteTunnelService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.expiredSessions = new Set();
            this.logger = this._register(loggerService.createLogger((0, resources_1.joinPath)(environmentService.logsHome, `${remoteTunnel_1.LOG_ID}.log`), { id: remoteTunnel_1.LOG_ID, name: remoteTunnel_1.LOGGER_NAME }));
            this.connectionStateContext = exports.REMOTE_TUNNEL_CONNECTION_STATE.bindTo(this.contextKeyService);
            const serverConfiguration = productService.tunnelApplicationConfig;
            if (!serverConfiguration || !productService.tunnelApplicationName) {
                this.logger.error('Missing \'tunnelApplicationConfig\' or \'tunnelApplicationName\' in product.json. Remote tunneling is not available.');
                this.serverConfiguration = { authenticationProviders: {}, editorWebUrl: '', extension: { extensionId: '', friendlyName: '' } };
                return;
            }
            this.serverConfiguration = serverConfiguration;
            this._register(this.remoteTunnelService.onDidChangeTunnelStatus(s => this.handleTunnelStatusUpdate(s)));
            this.registerCommands();
            this.initialize();
            this.recommendRemoteExtensionIfNeeded();
        }
        handleTunnelStatusUpdate(status) {
            this.connectionInfo = undefined;
            if (status.type === 'disconnected') {
                if (status.onTokenFailed) {
                    this.expiredSessions.add(status.onTokenFailed.sessionId);
                }
                this.connectionStateContext.set('disconnected');
            }
            else if (status.type === 'connecting') {
                this.connectionStateContext.set('connecting');
            }
            else if (status.type === 'connected') {
                this.connectionInfo = status.info;
                this.connectionStateContext.set('connected');
            }
        }
        async recommendRemoteExtensionIfNeeded() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const remoteExtension = this.serverConfiguration.extension;
            const shouldRecommend = async () => {
                if (this.storageService.getBoolean(REMOTE_TUNNEL_EXTENSION_RECOMMENDED_KEY, -1 /* StorageScope.APPLICATION */)) {
                    return false;
                }
                if (await this.extensionService.getExtension(remoteExtension.extensionId)) {
                    return false;
                }
                const usedOnHostMessage = this.storageService.get(REMOTE_TUNNEL_USED_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
                if (!usedOnHostMessage) {
                    return false;
                }
                let usedTunnelName;
                try {
                    const message = JSON.parse(usedOnHostMessage);
                    if (!(0, types_1.isObject)(message)) {
                        return false;
                    }
                    const { hostName, timeStamp } = message;
                    if (!(0, types_1.isString)(hostName) || !(0, types_1.isNumber)(timeStamp) || new Date().getTime() > timeStamp + REMOTE_TUNNEL_EXTENSION_TIMEOUT) {
                        return false;
                    }
                    usedTunnelName = hostName;
                }
                catch (_) {
                    // problems parsing the message, likly the old message format
                    return false;
                }
                const currentTunnelName = await this.remoteTunnelService.getTunnelName();
                if (!currentTunnelName || currentTunnelName === usedTunnelName) {
                    return false;
                }
                return usedTunnelName;
            };
            const recommed = async () => {
                const usedOnHost = await shouldRecommend();
                if (!usedOnHost) {
                    return false;
                }
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, nls_1.localize)({
                        key: 'recommend.remoteExtension',
                        comment: ['{0} will be a tunnel name, {1} will the link address to the web UI, {6} an extension name. [label](command:commandId) is a markdown link. Only translate the label, do not modify the format']
                    }, "Tunnel '{0}' is avaiable for remote access. The {1} extension can be used to connect to it.", usedOnHost, remoteExtension.friendlyName),
                    actions: {
                        primary: [
                            new actions_1.Action('showExtension', (0, nls_1.localize)('action.showExtension', "Show Extension"), undefined, true, () => {
                                return this.commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', [remoteExtension.extensionId]);
                            }),
                            new actions_1.Action('doNotShowAgain', (0, nls_1.localize)('action.doNotShowAgain', "Do not show again"), undefined, true, () => {
                                this.storageService.store(REMOTE_TUNNEL_EXTENSION_RECOMMENDED_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                            }),
                        ]
                    }
                });
                return true;
            };
            if (await shouldRecommend()) {
                const disposables = this._register(new lifecycle_1.DisposableStore());
                disposables.add(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, REMOTE_TUNNEL_USED_STORAGE_KEY, disposables)(async () => {
                    const success = await recommed();
                    if (success) {
                        disposables.dispose();
                    }
                }));
            }
        }
        async initialize() {
            const [mode, status] = await Promise.all([
                this.remoteTunnelService.getMode(),
                this.remoteTunnelService.getTunnelStatus(),
            ]);
            this.handleTunnelStatusUpdate(status);
            if (mode.active && mode.session.token) {
                return; // already initialized, token available
            }
            const doInitialStateDiscovery = async (progress) => {
                const listener = progress && this.remoteTunnelService.onDidChangeTunnelStatus(status => {
                    switch (status.type) {
                        case 'connecting':
                            if (status.progress) {
                                progress.report({ message: status.progress });
                            }
                            break;
                    }
                });
                let newSession;
                if (mode.active) {
                    const token = await this.getSessionToken(mode.session);
                    if (token) {
                        newSession = { ...mode.session, token };
                    }
                }
                const status = await this.remoteTunnelService.initialize(mode.active && newSession ? { ...mode, session: newSession } : remoteTunnel_1.INACTIVE_TUNNEL_MODE);
                listener?.dispose();
                if (status.type === 'connected') {
                    this.connectionInfo = status.info;
                    this.connectionStateContext.set('connected');
                    return;
                }
            };
            const hasUsed = this.storageService.getBoolean(REMOTE_TUNNEL_HAS_USED_BEFORE, -1 /* StorageScope.APPLICATION */, false);
            if (hasUsed) {
                await this.progressService.withProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: (0, nls_1.localize)({ key: 'initialize.progress.title', comment: ['Only translate \'Looking for remote tunnel\', do not change the format of the rest (markdown link format)'] }, "[Looking for remote tunnel](command:{0})", RemoteTunnelCommandIds.showLog),
                }, doInitialStateDiscovery);
            }
            else {
                doInitialStateDiscovery(undefined);
            }
        }
        getPreferredTokenFromSession(session) {
            return session.session.accessToken || session.session.idToken;
        }
        async startTunnel(asService) {
            if (this.connectionInfo) {
                return this.connectionInfo;
            }
            this.storageService.store(REMOTE_TUNNEL_HAS_USED_BEFORE, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            let tokenProblems = false;
            for (let i = 0; i < INVALID_TOKEN_RETRIES; i++) {
                tokenProblems = false;
                const authenticationSession = await this.getAuthenticationSession();
                if (authenticationSession === undefined) {
                    this.logger.info('No authentication session available, not starting tunnel');
                    return undefined;
                }
                const result = await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    title: (0, nls_1.localize)({ key: 'startTunnel.progress.title', comment: ['Only translate \'Starting remote tunnel\', do not change the format of the rest (markdown link format)'] }, "[Starting remote tunnel](command:{0})", RemoteTunnelCommandIds.showLog),
                }, (progress) => {
                    return new Promise((s, e) => {
                        let completed = false;
                        const listener = this.remoteTunnelService.onDidChangeTunnelStatus(status => {
                            switch (status.type) {
                                case 'connecting':
                                    if (status.progress) {
                                        progress.report({ message: status.progress });
                                    }
                                    break;
                                case 'connected':
                                    listener.dispose();
                                    completed = true;
                                    s(status.info);
                                    if (status.serviceInstallFailed) {
                                        this.notificationService.notify({
                                            severity: notification_1.Severity.Warning,
                                            message: (0, nls_1.localize)({
                                                key: 'remoteTunnel.serviceInstallFailed',
                                                comment: ['{Locked="](command:{0})"}']
                                            }, "Installation as a service failed, and we fell back to running the tunnel for this session. See the [error log](command:{0}) for details.", RemoteTunnelCommandIds.showLog),
                                        });
                                    }
                                    break;
                                case 'disconnected':
                                    listener.dispose();
                                    completed = true;
                                    tokenProblems = !!status.onTokenFailed;
                                    s(undefined);
                                    break;
                            }
                        });
                        const token = this.getPreferredTokenFromSession(authenticationSession);
                        const account = { sessionId: authenticationSession.session.id, token, providerId: authenticationSession.providerId, accountLabel: authenticationSession.session.account.label };
                        this.remoteTunnelService.startTunnel({ active: true, asService, session: account }).then(status => {
                            if (!completed && (status.type === 'connected' || status.type === 'disconnected')) {
                                listener.dispose();
                                if (status.type === 'connected') {
                                    s(status.info);
                                }
                                else {
                                    tokenProblems = !!status.onTokenFailed;
                                    s(undefined);
                                }
                            }
                        });
                    });
                });
                if (result || !tokenProblems) {
                    return result;
                }
            }
            return undefined;
        }
        async getAuthenticationSession() {
            const sessions = await this.getAllSessions();
            const quickpick = this.quickInputService.createQuickPick();
            quickpick.ok = false;
            quickpick.placeholder = (0, nls_1.localize)('accountPreference.placeholder', "Sign in to an account to enable remote access");
            quickpick.ignoreFocusOut = true;
            quickpick.items = await this.createQuickpickItems(sessions);
            return new Promise((resolve, reject) => {
                quickpick.onDidHide((e) => {
                    resolve(undefined);
                    quickpick.dispose();
                });
                quickpick.onDidAccept(async (e) => {
                    const selection = quickpick.selectedItems[0];
                    if ('provider' in selection) {
                        const session = await this.authenticationService.createSession(selection.provider.id, selection.provider.scopes);
                        resolve(this.createExistingSessionItem(session, selection.provider.id));
                    }
                    else if ('session' in selection) {
                        resolve(selection);
                    }
                    else {
                        resolve(undefined);
                    }
                    quickpick.hide();
                });
                quickpick.show();
            });
        }
        createExistingSessionItem(session, providerId) {
            return {
                label: session.account.label,
                description: this.authenticationService.getProvider(providerId).label,
                session,
                providerId
            };
        }
        async createQuickpickItems(sessions) {
            const options = [];
            if (sessions.length) {
                options.push({ type: 'separator', label: (0, nls_1.localize)('signed in', "Signed In") });
                options.push(...sessions);
                options.push({ type: 'separator', label: (0, nls_1.localize)('others', "Others") });
            }
            for (const authenticationProvider of (await this.getAuthenticationProviders())) {
                const signedInForProvider = sessions.some(account => account.providerId === authenticationProvider.id);
                const provider = this.authenticationService.getProvider(authenticationProvider.id);
                if (!signedInForProvider || provider.supportsMultipleAccounts) {
                    options.push({ label: (0, nls_1.localize)({ key: 'sign in using account', comment: ['{0} will be a auth provider (e.g. Github)'] }, "Sign in with {0}", provider.label), provider: authenticationProvider });
                }
            }
            return options;
        }
        /**
         * Returns all authentication sessions available from {@link getAuthenticationProviders}.
         */
        async getAllSessions() {
            const authenticationProviders = await this.getAuthenticationProviders();
            const accounts = new Map();
            const currentAccount = await this.remoteTunnelService.getMode();
            let currentSession;
            for (const provider of authenticationProviders) {
                const sessions = await this.authenticationService.getSessions(provider.id, provider.scopes);
                for (const session of sessions) {
                    if (!this.expiredSessions.has(session.id)) {
                        const item = this.createExistingSessionItem(session, provider.id);
                        accounts.set(item.session.account.id, item);
                        if (currentAccount.active && currentAccount.session.sessionId === session.id) {
                            currentSession = item;
                        }
                    }
                }
            }
            if (currentSession !== undefined) {
                accounts.set(currentSession.session.account.id, currentSession);
            }
            return [...accounts.values()];
        }
        async getSessionToken(session) {
            if (session) {
                const sessionItem = (await this.getAllSessions()).find(s => s.session.id === session.sessionId);
                if (sessionItem) {
                    return this.getPreferredTokenFromSession(sessionItem);
                }
            }
            return undefined;
        }
        /**
         * Returns all authentication providers which can be used to authenticate
         * to the remote storage service, based on product.json configuration
         * and registered authentication providers.
         */
        async getAuthenticationProviders() {
            // Get the list of authentication providers configured in product.json
            const authenticationProviders = this.serverConfiguration.authenticationProviders;
            const configuredAuthenticationProviders = Object.keys(authenticationProviders).reduce((result, id) => {
                result.push({ id, scopes: authenticationProviders[id].scopes });
                return result;
            }, []);
            // Filter out anything that isn't currently available through the authenticationService
            const availableAuthenticationProviders = this.authenticationService.declaredProviders;
            return configuredAuthenticationProviders.filter(({ id }) => availableAuthenticationProviders.some(provider => provider.id === id));
        }
        registerCommands() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.turnOn,
                        title: RemoteTunnelCommandLabels.turnOn,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected'),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                            },
                            {
                                id: actions_2.MenuId.AccountsContext,
                                group: '2_remoteTunnel',
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected'),
                            }]
                    });
                }
                async run(accessor) {
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const productService = accessor.get(productService_1.IProductService);
                    const didNotifyPreview = storageService.getBoolean(REMOTE_TUNNEL_PROMPTED_PREVIEW_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, false);
                    if (!didNotifyPreview) {
                        const { confirmed } = await dialogService.confirm({
                            message: (0, nls_1.localize)('tunnel.preview', 'Remote Tunnels is currently in preview. Please report any problems using the "Help: Report Issue" command.'),
                            primaryButton: (0, nls_1.localize)({ key: 'enable', comment: ['&& denotes a mnemonic'] }, '&&Enable')
                        });
                        if (!confirmed) {
                            return;
                        }
                        storageService.store(REMOTE_TUNNEL_PROMPTED_PREVIEW_STORAGE_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = quickInputService.createQuickPick();
                    quickPick.placeholder = (0, nls_1.localize)('tunnel.enable.placeholder', 'Select how you want to enable access');
                    quickPick.items = [
                        { service: false, label: (0, nls_1.localize)('tunnel.enable.session', 'Turn on for this session'), description: (0, nls_1.localize)('tunnel.enable.session.description', 'Run whenever {0} is open', productService.nameShort) },
                        { service: true, label: (0, nls_1.localize)('tunnel.enable.service', 'Install as a service'), description: (0, nls_1.localize)('tunnel.enable.service.description', 'Run whenever you\'re logged in') }
                    ];
                    const asService = await new Promise(resolve => {
                        disposables.add(quickPick.onDidAccept(() => resolve(quickPick.selectedItems[0]?.service)));
                        disposables.add(quickPick.onDidHide(() => resolve(undefined)));
                        quickPick.show();
                    });
                    quickPick.dispose();
                    if (asService === undefined) {
                        return; // no-op
                    }
                    const connectionInfo = await that.startTunnel(/* installAsService= */ asService);
                    if (connectionInfo) {
                        const linkToOpen = that.getLinkToOpen(connectionInfo);
                        const remoteExtension = that.serverConfiguration.extension;
                        const linkToOpenForMarkdown = linkToOpen.toString(false).replace(/\)/g, '%29');
                        notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)({
                                key: 'progress.turnOn.final',
                                comment: ['{0} will be the tunnel name, {1} will the link address to the web UI, {6} an extension name, {7} a link to the extension documentation. [label](command:commandId) is a markdown link. Only translate the label, do not modify the format']
                            }, "You can now access this machine anywhere via the secure tunnel [{0}](command:{4}). To connect via a different machine, use the generated [{1}]({2}) link or use the [{6}]({7}) extension in the desktop or web. You can [configure](command:{3}) or [turn off](command:{5}) this access via the VS Code Accounts menu.", connectionInfo.tunnelName, connectionInfo.domain, linkToOpenForMarkdown, RemoteTunnelCommandIds.manage, RemoteTunnelCommandIds.configure, RemoteTunnelCommandIds.turnOff, remoteExtension.friendlyName, 'https://code.visualstudio.com/docs/remote/tunnels'),
                            actions: {
                                primary: [
                                    new actions_1.Action('copyToClipboard', (0, nls_1.localize)('action.copyToClipboard', "Copy Browser Link to Clipboard"), undefined, true, () => clipboardService.writeText(linkToOpen.toString(true))),
                                    new actions_1.Action('showExtension', (0, nls_1.localize)('action.showExtension', "Show Extension"), undefined, true, () => {
                                        return commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', [remoteExtension.extensionId]);
                                    })
                                ]
                            }
                        });
                        const usedOnHostMessage = { hostName: connectionInfo.tunnelName, timeStamp: new Date().getTime() };
                        storageService.store(REMOTE_TUNNEL_USED_STORAGE_KEY, JSON.stringify(usedOnHostMessage), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                    else {
                        notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('progress.turnOn.failed', "Unable to turn on the remote tunnel access. Check the Remote Tunnel Service log for details."),
                        });
                        await commandService.executeCommand(RemoteTunnelCommandIds.showLog);
                    }
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.manage,
                        title: (0, nls_1.localize)('remoteTunnel.actions.manage.on.v2', 'Remote Tunnel Access is On'),
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.AccountsContext,
                                group: '2_remoteTunnel',
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connected'),
                            }]
                    });
                }
                async run() {
                    that.showManageOptions();
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.connecting,
                        title: (0, nls_1.localize)('remoteTunnel.actions.manage.connecting', 'Remote Tunnel Access is Connecting'),
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.AccountsContext,
                                group: '2_remoteTunnel',
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connecting'),
                            }]
                    });
                }
                async run() {
                    that.showManageOptions();
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.turnOff,
                        title: RemoteTunnelCommandLabels.turnOff,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected'),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, ''),
                            }]
                    });
                }
                async run() {
                    const message = that.connectionInfo?.isAttached ?
                        (0, nls_1.localize)('remoteTunnel.turnOffAttached.confirm', 'Do you want to turn off Remote Tunnel Access? This will also stop the service that was started externally.') :
                        (0, nls_1.localize)('remoteTunnel.turnOff.confirm', 'Do you want to turn off Remote Tunnel Access?');
                    const { confirmed } = await that.dialogService.confirm({ message });
                    if (confirmed) {
                        that.remoteTunnelService.stopTunnel();
                    }
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.showLog,
                        title: RemoteTunnelCommandLabels.showLog,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, ''),
                            }]
                    });
                }
                async run(accessor) {
                    const outputService = accessor.get(output_1.IOutputService);
                    outputService.showChannel(remoteTunnel_1.LOG_ID);
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.configure,
                        title: RemoteTunnelCommandLabels.configure,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, ''),
                            }]
                    });
                }
                async run(accessor) {
                    const preferencesService = accessor.get(preferences_1.IPreferencesService);
                    preferencesService.openSettings({ query: remoteTunnel_1.CONFIGURATION_KEY_PREFIX });
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.copyToClipboard,
                        title: RemoteTunnelCommandLabels.copyToClipboard,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connected'),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connected'),
                            }]
                    });
                }
                async run(accessor) {
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    if (that.connectionInfo) {
                        const linkToOpen = that.getLinkToOpen(that.connectionInfo);
                        clipboardService.writeText(linkToOpen.toString(true));
                    }
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.learnMore,
                        title: RemoteTunnelCommandLabels.learnMore,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: []
                    });
                }
                async run(accessor) {
                    const openerService = accessor.get(opener_1.IOpenerService);
                    await openerService.open('https://aka.ms/vscode-server-doc');
                }
            }));
        }
        getLinkToOpen(connectionInfo) {
            const workspace = this.workspaceContextService.getWorkspace();
            const folders = workspace.folders;
            let resource;
            if (folders.length === 1) {
                resource = folders[0].uri;
            }
            else if (workspace.configuration && !(0, workspace_1.isUntitledWorkspace)(workspace.configuration, this.environmentService)) {
                resource = workspace.configuration;
            }
            const link = uri_1.URI.parse(connectionInfo.link);
            if (resource?.scheme === network_1.Schemas.file) {
                return (0, resources_1.joinPath)(link, resource.path);
            }
            return (0, resources_1.joinPath)(link, this.environmentService.userHome.path);
        }
        async showManageOptions() {
            const account = await this.remoteTunnelService.getMode();
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.placeholder = (0, nls_1.localize)('manage.placeholder', 'Select a command to invoke');
                disposables.add(quickPick);
                const items = [];
                items.push({ id: RemoteTunnelCommandIds.learnMore, label: RemoteTunnelCommandLabels.learnMore });
                if (this.connectionInfo) {
                    quickPick.title =
                        this.connectionInfo.isAttached ?
                            (0, nls_1.localize)({ key: 'manage.title.attached', comment: ['{0} is the tunnel name'] }, 'Remote Tunnel Access enabled for {0} (launched externally)', this.connectionInfo.tunnelName) :
                            (0, nls_1.localize)({ key: 'manage.title.orunning', comment: ['{0} is the tunnel name'] }, 'Remote Tunnel Access enabled for {0}', this.connectionInfo.tunnelName);
                    items.push({ id: RemoteTunnelCommandIds.copyToClipboard, label: RemoteTunnelCommandLabels.copyToClipboard, description: this.connectionInfo.domain });
                }
                else {
                    quickPick.title = (0, nls_1.localize)('manage.title.off', 'Remote Tunnel Access not enabled');
                }
                items.push({ id: RemoteTunnelCommandIds.showLog, label: (0, nls_1.localize)('manage.showLog', 'Show Log') });
                items.push({ type: 'separator' });
                items.push({ id: RemoteTunnelCommandIds.configure, label: (0, nls_1.localize)('manage.tunnelName', 'Change Tunnel Name'), description: this.connectionInfo?.tunnelName });
                items.push({ id: RemoteTunnelCommandIds.turnOff, label: RemoteTunnelCommandLabels.turnOff, description: account.active ? `${account.session.accountLabel} (${account.session.providerId})` : undefined });
                quickPick.items = items;
                disposables.add(quickPick.onDidAccept(() => {
                    if (quickPick.selectedItems[0] && quickPick.selectedItems[0].id) {
                        this.commandService.executeCommand(quickPick.selectedItems[0].id);
                    }
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
                quickPick.show();
            });
        }
    };
    exports.RemoteTunnelWorkbenchContribution = RemoteTunnelWorkbenchContribution;
    exports.RemoteTunnelWorkbenchContribution = RemoteTunnelWorkbenchContribution = __decorate([
        __param(0, authentication_1.IAuthenticationService),
        __param(1, dialogs_1.IDialogService),
        __param(2, extensions_1.IExtensionService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, productService_1.IProductService),
        __param(5, storage_1.IStorageService),
        __param(6, log_1.ILoggerService),
        __param(7, quickInput_1.IQuickInputService),
        __param(8, environment_1.INativeEnvironmentService),
        __param(9, remoteTunnel_1.IRemoteTunnelService),
        __param(10, commands_1.ICommandService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, progress_1.IProgressService),
        __param(13, notification_1.INotificationService)
    ], RemoteTunnelWorkbenchContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(RemoteTunnelWorkbenchContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        type: 'object',
        properties: {
            [remoteTunnel_1.CONFIGURATION_KEY_HOST_NAME]: {
                description: (0, nls_1.localize)('remoteTunnelAccess.machineName', "The name under which the remote tunnel access is registered. If not set, the host name is used."),
                type: 'string',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                ignoreSync: true,
                pattern: '^(\\w[\\w-]*)?$',
                patternErrorMessage: (0, nls_1.localize)('remoteTunnelAccess.machineNameRegex', "The name must only consist of letters, numbers, underscore and dash. It must not start with a dash."),
                maxLength: 20,
                default: ''
            },
            [remoteTunnel_1.CONFIGURATION_KEY_PREVENT_SLEEP]: {
                description: (0, nls_1.localize)('remoteTunnelAccess.preventSleep', "Prevent this computer from sleeping when remote tunnel access is turned on."),
                type: 'boolean',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                default: false,
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVHVubmVsLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbW90ZVR1bm5lbC9lbGVjdHJvbi1zYW5kYm94L3JlbW90ZVR1bm5lbC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUNuRixRQUFBLHNCQUFzQixHQUFHLElBQUEsZUFBUyxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFJOUUsUUFBQSxrQ0FBa0MsR0FBRyx3QkFBd0IsQ0FBQztJQUM5RCxRQUFBLDhCQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBcUIsMENBQWtDLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFFeEksTUFBTSw4QkFBOEIsR0FBRyx5QkFBeUIsQ0FBQztJQUNqRSxNQUFNLDBDQUEwQyxHQUFHLG9DQUFvQyxDQUFDO0lBQ3hGLE1BQU0sdUNBQXVDLEdBQUcsa0NBQWtDLENBQUM7SUFDbkYsTUFBTSw2QkFBNkIsR0FBRyxxQkFBcUIsQ0FBQztJQUM1RCxNQUFNLCtCQUErQixHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsb0dBQW9HO0lBRTNKLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxDQUFDO0lBUWhDLElBQUssc0JBU0o7SUFURCxXQUFLLHNCQUFzQjtRQUMxQiwwRUFBZ0QsQ0FBQTtRQUNoRCw0RUFBa0QsQ0FBQTtRQUNsRCxrRkFBd0QsQ0FBQTtRQUN4RCwwRUFBZ0QsQ0FBQTtRQUNoRCw0RUFBa0QsQ0FBQTtRQUNsRCxnRkFBc0QsQ0FBQTtRQUN0RCw0RkFBa0UsQ0FBQTtRQUNsRSxnRkFBc0QsQ0FBQTtJQUN2RCxDQUFDLEVBVEksc0JBQXNCLEtBQXRCLHNCQUFzQixRQVMxQjtJ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