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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/extensions/common/extensions", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "vs/base/common/uri", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/common/globalStateSync", "vs/base/common/errors", "vs/base/common/async", "vs/base/common/cancellation", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/secrets/common/secrets", "vs/platform/files/common/files", "vs/base/common/strings", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, userDataSync_1, telemetry_1, extensions_1, userDataSync_2, lifecycle_1, event_1, authenticationService_1, authentication_1, userDataSyncAccount_1, quickInput_1, storage_1, log_1, productService_1, extensions_2, nls_1, notification_1, dialogs_1, contextkey_1, progress_1, uri_1, views_1, viewsService_1, lifecycle_2, platform_1, instantiation_1, userDataSyncStoreService_1, globalStateSync_1, errors_1, async_1, cancellation_1, editorService_1, uriIdentity_1, editor_1, environmentService_1, userDataInit_1, secrets_1, files_1, strings_1, userDataSyncMachines_1) {
    "use strict";
    var UserDataSyncWorkbenchService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchService = void 0;
    exports.isMergeEditorInput = isMergeEditorInput;
    class UserDataSyncAccount {
        constructor(authenticationProviderId, session) {
            this.authenticationProviderId = authenticationProviderId;
            this.session = session;
        }
        get sessionId() { return this.session.id; }
        get accountName() { return this.session.account.label; }
        get accountId() { return this.session.account.id; }
        get token() { return this.session.idToken || this.session.accessToken; }
    }
    function isMergeEditorInput(editor) {
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.base) && uri_1.URI.isUri(candidate?.input1?.uri) && uri_1.URI.isUri(candidate?.input2?.uri) && uri_1.URI.isUri(candidate?.result);
    }
    let UserDataSyncWorkbenchService = class UserDataSyncWorkbenchService extends lifecycle_1.Disposable {
        static { UserDataSyncWorkbenchService_1 = this; }
        static { this.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY = 'userDataSyncAccount.donotUseWorkbenchSession'; }
        static { this.CACHED_AUTHENTICATION_PROVIDER_KEY = 'userDataSyncAccountProvider'; }
        static { this.CACHED_SESSION_STORAGE_KEY = 'userDataSyncAccountPreference'; }
        get enabled() { return !!this.userDataSyncStoreManagementService.userDataSyncStore; }
        get authenticationProviders() { return this._authenticationProviders; }
        get accountStatus() { return this._accountStatus; }
        get current() { return this._current; }
        constructor(userDataSyncService, uriIdentityService, authenticationService, userDataSyncAccountService, quickInputService, storageService, userDataSyncEnablementService, userDataAutoSyncService, telemetryService, logService, productService, extensionService, environmentService, secretStorageService, notificationService, progressService, dialogService, contextKeyService, viewsService, viewDescriptorService, userDataSyncStoreManagementService, lifecycleService, instantiationService, editorService, userDataInitializationService, fileService, fileDialogService, userDataSyncMachinesService) {
            super();
            this.userDataSyncService = userDataSyncService;
            this.uriIdentityService = uriIdentityService;
            this.authenticationService = authenticationService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.quickInputService = quickInputService;
            this.storageService = storageService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.productService = productService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this.secretStorageService = secretStorageService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.viewsService = viewsService;
            this.viewDescriptorService = viewDescriptorService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.userDataInitializationService = userDataInitializationService;
            this.fileService = fileService;
            this.fileDialogService = fileDialogService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this._authenticationProviders = [];
            this._accountStatus = "unavailable" /* AccountStatus.Unavailable */;
            this._onDidChangeAccountStatus = this._register(new event_1.Emitter());
            this.onDidChangeAccountStatus = this._onDidChangeAccountStatus.event;
            this.turnOnSyncCancellationToken = undefined;
            this._cachedCurrentAuthenticationProviderId = null;
            this._cachedCurrentSessionId = null;
            this.syncEnablementContext = userDataSync_2.CONTEXT_SYNC_ENABLEMENT.bindTo(contextKeyService);
            this.syncStatusContext = userDataSync_2.CONTEXT_SYNC_STATE.bindTo(contextKeyService);
            this.accountStatusContext = userDataSync_2.CONTEXT_ACCOUNT_STATE.bindTo(contextKeyService);
            this.activityViewsEnablementContext = userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS.bindTo(contextKeyService);
            this.hasConflicts = userDataSync_2.CONTEXT_HAS_CONFLICTS.bindTo(contextKeyService);
            this.enableConflictsViewContext = userDataSync_2.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW.bindTo(contextKeyService);
            if (this.userDataSyncStoreManagementService.userDataSyncStore) {
                this.syncStatusContext.set(this.userDataSyncService.status);
                this._register(userDataSyncService.onDidChangeStatus(status => this.syncStatusContext.set(status)));
                this.syncEnablementContext.set(userDataSyncEnablementService.isEnabled());
                this._register(userDataSyncEnablementService.onDidChangeEnablement(enabled => this.syncEnablementContext.set(enabled)));
                this.waitAndInitialize();
            }
        }
        updateAuthenticationProviders() {
            this._authenticationProviders = (this.userDataSyncStoreManagementService.userDataSyncStore?.authenticationProviders || []).filter(({ id }) => this.authenticationService.declaredProviders.some(provider => provider.id === id));
        }
        isSupportedAuthenticationProviderId(authenticationProviderId) {
            return this.authenticationProviders.some(({ id }) => id === authenticationProviderId);
        }
        async waitAndInitialize() {
            /* wait */
            await Promise.all([this.extensionService.whenInstalledExtensionsRegistered(), this.userDataInitializationService.whenInitializationFinished()]);
            /* initialize */
            try {
                await this.initialize();
            }
            catch (error) {
                // Do not log if the current window is running extension tests
                if (!this.environmentService.extensionTestsLocationURI) {
                    this.logService.error(error);
                }
            }
        }
        async initialize() {
            if (platform_1.isWeb) {
                const authenticationSession = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService);
                if (this.currentSessionId === undefined && authenticationSession?.id) {
                    if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider && this.environmentService.options.settingsSyncOptions.enabled) {
                        this.currentSessionId = authenticationSession.id;
                    }
                    // Backward compatibility
                    else if (this.useWorkbenchSessionId) {
                        this.currentSessionId = authenticationSession.id;
                    }
                    this.useWorkbenchSessionId = false;
                }
            }
            await this.update();
            this._register(this.authenticationService.onDidChangeDeclaredProviders(() => this.updateAuthenticationProviders()));
            this._register(event_1.Event.filter(event_1.Event.any(this.authenticationService.onDidRegisterAuthenticationProvider, this.authenticationService.onDidUnregisterAuthenticationProvider), info => this.isSupportedAuthenticationProviderId(info.id))(() => this.update()));
            this._register(event_1.Event.filter(this.userDataSyncAccountService.onTokenFailed, isSuccessive => !isSuccessive)(() => this.update('token failure')));
            this._register(event_1.Event.filter(this.authenticationService.onDidChangeSessions, e => this.isSupportedAuthenticationProviderId(e.providerId))(({ event }) => this.onDidChangeSessions(event)));
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidChangeStorage()));
            this._register(event_1.Event.filter(this.userDataSyncAccountService.onTokenFailed, bailout => bailout)(() => this.onDidAuthFailure()));
            this.hasConflicts.set(this.userDataSyncService.conflicts.length > 0);
            this._register(this.userDataSyncService.onDidChangeConflicts(conflicts => {
                this.hasConflicts.set(conflicts.length > 0);
                if (!conflicts.length) {
                    this.enableConflictsViewContext.reset();
                }
                // Close merge editors with no conflicts
                this.editorService.editors.filter(input => {
                    const remoteResource = (0, editor_1.isDiffEditorInput)(input) ? input.original.resource : isMergeEditorInput(input) ? input.input1.uri : undefined;
                    if (remoteResource?.scheme !== userDataSync_1.USER_DATA_SYNC_SCHEME) {
                        return false;
                    }
                    return !this.userDataSyncService.conflicts.some(({ conflicts }) => conflicts.some(({ previewResource }) => this.uriIdentityService.extUri.isEqual(previewResource, input.resource)));
                }).forEach(input => input.dispose());
            }));
        }
        async update(reason) {
            if (reason) {
                this.logService.info(`Settings Sync: Updating due to ${reason}`);
            }
            this.updateAuthenticationProviders();
            await this.updateCurrentAccount();
            if (this._current) {
                this.currentAuthenticationProviderId = this._current.authenticationProviderId;
            }
            await this.updateToken(this._current);
            this.updateAccountStatus(this._current ? "available" /* AccountStatus.Available */ : "unavailable" /* AccountStatus.Unavailable */);
        }
        async updateCurrentAccount() {
            const currentSessionId = this.currentSessionId;
            const currentAuthenticationProviderId = this.currentAuthenticationProviderId;
            if (currentSessionId) {
                const authenticationProviders = currentAuthenticationProviderId ? this.authenticationProviders.filter(({ id }) => id === currentAuthenticationProviderId) : this.authenticationProviders;
                for (const { id, scopes } of authenticationProviders) {
                    const sessions = (await this.authenticationService.getSessions(id, scopes)) || [];
                    for (const session of sessions) {
                        if (session.id === currentSessionId) {
                            this._current = new UserDataSyncAccount(id, session);
                            return;
                        }
                    }
                }
            }
            this._current = undefined;
        }
        async updateToken(current) {
            let value = undefined;
            if (current) {
                try {
                    this.logService.trace('Settings Sync: Updating the token for the account', current.accountName);
                    const token = current.token;
                    this.logService.trace('Settings Sync: Token updated for the account', current.accountName);
                    value = { token, authenticationProviderId: current.authenticationProviderId };
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            await this.userDataSyncAccountService.updateAccount(value);
        }
        updateAccountStatus(accountStatus) {
            if (this._accountStatus !== accountStatus) {
                const previous = this._accountStatus;
                this.logService.trace(`Settings Sync: Account status changed from ${previous} to ${accountStatus}`);
                this._accountStatus = accountStatus;
                this.accountStatusContext.set(accountStatus);
                this._onDidChangeAccountStatus.fire(accountStatus);
            }
        }
        async turnOn() {
            if (!this.authenticationProviders.length) {
                throw new Error((0, nls_1.localize)('no authentication providers', "Settings sync cannot be turned on because there are no authentication providers available."));
            }
            if (this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            if (this.userDataSyncService.status !== "idle" /* SyncStatus.Idle */) {
                throw new Error('Cannot turn on sync while syncing');
            }
            const picked = await this.pick();
            if (!picked) {
                throw new errors_1.CancellationError();
            }
            // User did not pick an account or login failed
            if (this.accountStatus !== "available" /* AccountStatus.Available */) {
                throw new Error((0, nls_1.localize)('no account', "No account available"));
            }
            const turnOnSyncCancellationToken = this.turnOnSyncCancellationToken = new cancellation_1.CancellationTokenSource();
            const disposable = platform_1.isWeb ? lifecycle_1.Disposable.None : this.lifecycleService.onBeforeShutdown(e => e.veto((async () => {
                const { confirmed } = await this.dialogService.confirm({
                    type: 'warning',
                    message: (0, nls_1.localize)('sync in progress', "Settings Sync is being turned on. Would you like to cancel it?"),
                    title: (0, nls_1.localize)('settings sync', "Settings Sync"),
                    primaryButton: (0, nls_1.localize)({ key: 'yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                    cancelButton: (0, nls_1.localize)('no', "No")
                });
                if (confirmed) {
                    turnOnSyncCancellationToken.cancel();
                }
                return !confirmed;
            })(), 'veto.settingsSync'));
            try {
                await this.doTurnOnSync(turnOnSyncCancellationToken.token);
            }
            finally {
                disposable.dispose();
                this.turnOnSyncCancellationToken = undefined;
            }
            await this.userDataAutoSyncService.turnOn();
            if (this.userDataSyncStoreManagementService.userDataSyncStore?.canSwitch) {
                await this.synchroniseUserDataSyncStoreType();
            }
            this.currentAuthenticationProviderId = this.current?.authenticationProviderId;
            if (this.environmentService.options?.settingsSyncOptions?.enablementHandler && this.currentAuthenticationProviderId) {
                this.environmentService.options.settingsSyncOptions.enablementHandler(true, this.currentAuthenticationProviderId);
            }
            this.notificationService.info((0, nls_1.localize)('sync turned on', "{0} is turned on", userDataSync_2.SYNC_TITLE.value));
        }
        async turnoff(everywhere) {
            if (this.userDataSyncEnablementService.isEnabled()) {
                await this.userDataAutoSyncService.turnOff(everywhere);
                if (this.environmentService.options?.settingsSyncOptions?.enablementHandler && this.currentAuthenticationProviderId) {
                    this.environmentService.options.settingsSyncOptions.enablementHandler(false, this.currentAuthenticationProviderId);
                }
            }
            if (this.turnOnSyncCancellationToken) {
                this.turnOnSyncCancellationToken.cancel();
            }
        }
        async synchroniseUserDataSyncStoreType() {
            if (!this.userDataSyncAccountService.account) {
                throw new Error('Cannot update because you are signed out from settings sync. Please sign in and try again.');
            }
            if (!platform_1.isWeb || !this.userDataSyncStoreManagementService.userDataSyncStore) {
                // Not supported
                return;
            }
            const userDataSyncStoreUrl = this.userDataSyncStoreManagementService.userDataSyncStore.type === 'insiders' ? this.userDataSyncStoreManagementService.userDataSyncStore.stableUrl : this.userDataSyncStoreManagementService.userDataSyncStore.insidersUrl;
            const userDataSyncStoreClient = this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreClient, userDataSyncStoreUrl);
            userDataSyncStoreClient.setAuthToken(this.userDataSyncAccountService.account.token, this.userDataSyncAccountService.account.authenticationProviderId);
            await this.instantiationService.createInstance(globalStateSync_1.UserDataSyncStoreTypeSynchronizer, userDataSyncStoreClient).sync(this.userDataSyncStoreManagementService.userDataSyncStore.type);
        }
        syncNow() {
            return this.userDataAutoSyncService.triggerSync(['Sync Now'], false, true);
        }
        async doTurnOnSync(token) {
            const disposables = new lifecycle_1.DisposableStore();
            const manualSyncTask = await this.userDataSyncService.createManualSyncTask();
            try {
                await this.progressService.withProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: userDataSync_2.SYNC_TITLE.value,
                    command: userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID,
                    delay: 500,
                }, async (progress) => {
                    progress.report({ message: (0, nls_1.localize)('turning on', "Turning on...") });
                    disposables.add(this.userDataSyncService.onDidChangeStatus(status => {
                        if (status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                            progress.report({ message: (0, nls_1.localize)('resolving conflicts', "Resolving conflicts...") });
                        }
                        else {
                            progress.report({ message: (0, nls_1.localize)('syncing...', "Turning on...") });
                        }
                    }));
                    await manualSyncTask.merge();
                    if (this.userDataSyncService.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                        await this.handleConflictsWhileTurningOn(token);
                    }
                    await manualSyncTask.apply();
                });
            }
            catch (error) {
                await manualSyncTask.stop();
                throw error;
            }
            finally {
                disposables.dispose();
            }
        }
        async handleConflictsWhileTurningOn(token) {
            await this.dialogService.prompt({
                type: notification_1.Severity.Warning,
                message: (0, nls_1.localize)('conflicts detected', "Conflicts Detected"),
                detail: (0, nls_1.localize)('resolve', "Please resolve conflicts to turn on..."),
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'show conflicts', comment: ['&& denotes a mnemonic'] }, "&&Show Conflicts"),
                        run: async () => {
                            const waitUntilConflictsAreResolvedPromise = (0, async_1.raceCancellationError)(event_1.Event.toPromise(event_1.Event.filter(this.userDataSyncService.onDidChangeConflicts, conficts => conficts.length === 0)), token);
                            await this.showConflicts(this.userDataSyncService.conflicts[0]?.conflicts[0]);
                            await waitUntilConflictsAreResolvedPromise;
                        }
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'replace local', comment: ['&& denotes a mnemonic'] }, "Replace &&Local"),
                        run: async () => this.replace(true)
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'replace remote', comment: ['&& denotes a mnemonic'] }, "Replace &&Remote"),
                        run: () => this.replace(false)
                    },
                ],
                cancelButton: {
                    run: () => {
                        throw new errors_1.CancellationError();
                    }
                }
            });
        }
        async replace(local) {
            for (const conflict of this.userDataSyncService.conflicts) {
                for (const preview of conflict.conflicts) {
                    await this.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, local ? preview.remoteResource : preview.localResource, undefined, { force: true });
                }
            }
        }
        async accept(resource, conflictResource, content, apply) {
            return this.userDataSyncService.accept(resource, conflictResource, content, apply);
        }
        async showConflicts(conflictToOpen) {
            if (!this.userDataSyncService.conflicts.length) {
                return;
            }
            this.enableConflictsViewContext.set(true);
            const view = await this.viewsService.openView(userDataSync_2.SYNC_CONFLICTS_VIEW_ID);
            if (view && conflictToOpen) {
                await view.open(conflictToOpen);
            }
        }
        async resetSyncedData() {
            const { confirmed } = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('reset', "This will clear your data in the cloud and stop sync on all your devices."),
                title: (0, nls_1.localize)('reset title', "Clear"),
                primaryButton: (0, nls_1.localize)({ key: 'resetButton', comment: ['&& denotes a mnemonic'] }, "&&Reset"),
            });
            if (confirmed) {
                await this.userDataSyncService.resetRemote();
            }
        }
        async getAllLogResources() {
            const logsFolders = [];
            const stat = await this.fileService.resolve(this.uriIdentityService.extUri.dirname(this.environmentService.logsHome));
            if (stat.children) {
                logsFolders.push(...stat.children
                    .filter(stat => stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name))
                    .sort()
                    .reverse()
                    .map(d => d.resource));
            }
            const result = [];
            for (const logFolder of logsFolders) {
                const folderStat = await this.fileService.resolve(logFolder);
                const childStat = folderStat.children?.find(stat => this.uriIdentityService.extUri.basename(stat.resource).startsWith(`${userDataSync_1.USER_DATA_SYNC_LOG_ID}.`));
                if (childStat) {
                    result.push(childStat.resource);
                }
            }
            return result;
        }
        async showSyncActivity() {
            this.activityViewsEnablementContext.set(true);
            await this.waitForActiveSyncViews();
            await this.viewsService.openViewContainer(userDataSync_2.SYNC_VIEW_CONTAINER_ID);
        }
        async downloadSyncActivity() {
            const result = await this.fileDialogService.showOpenDialog({
                title: (0, nls_1.localize)('download sync activity dialog title', "Select folder to download Settings Sync activity"),
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: (0, nls_1.localize)('download sync activity dialog open label', "Save"),
            });
            if (!result?.[0]) {
                return;
            }
            return this.progressService.withProgress({ location: 10 /* ProgressLocation.Window */ }, async () => {
                const machines = await this.userDataSyncMachinesService.getMachines();
                const currentMachine = machines.find(m => m.isCurrent);
                const name = (currentMachine ? currentMachine.name + ' - ' : '') + 'Settings Sync Activity';
                const stat = await this.fileService.resolve(result[0]);
                const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(name)}\\s(\\d+)`);
                const indexes = [];
                for (const child of stat.children ?? []) {
                    if (child.name === name) {
                        indexes.push(0);
                    }
                    else {
                        const matches = nameRegEx.exec(child.name);
                        if (matches) {
                            indexes.push(parseInt(matches[1]));
                        }
                    }
                }
                indexes.sort((a, b) => a - b);
                const folder = this.uriIdentityService.extUri.joinPath(result[0], indexes[0] !== 0 ? name : `${name} ${indexes[indexes.length - 1] + 1}`);
                await Promise.all([
                    this.userDataSyncService.saveRemoteActivityData(this.uriIdentityService.extUri.joinPath(folder, 'remoteActivity.json')),
                    (async () => {
                        const logResources = await this.getAllLogResources();
                        await Promise.all(logResources.map(async (logResource) => this.fileService.copy(logResource, this.uriIdentityService.extUri.joinPath(folder, 'logs', `${this.uriIdentityService.extUri.basename(this.uriIdentityService.extUri.dirname(logResource))}.log`))));
                    })(),
                    this.fileService.copy(this.environmentService.userDataSyncHome, this.uriIdentityService.extUri.joinPath(folder, 'localActivity')),
                ]);
                return folder;
            });
        }
        async waitForActiveSyncViews() {
            const viewContainer = this.viewDescriptorService.getViewContainerById(userDataSync_2.SYNC_VIEW_CONTAINER_ID);
            if (viewContainer) {
                const model = this.viewDescriptorService.getViewContainerModel(viewContainer);
                if (!model.activeViewDescriptors.length) {
                    await event_1.Event.toPromise(event_1.Event.filter(model.onDidChangeActiveViewDescriptors, e => model.activeViewDescriptors.length > 0));
                }
            }
        }
        async signIn() {
            const currentAuthenticationProviderId = this.currentAuthenticationProviderId;
            const authenticationProvider = currentAuthenticationProviderId ? this.authenticationProviders.find(p => p.id === currentAuthenticationProviderId) : undefined;
            if (authenticationProvider) {
                await this.doSignIn(authenticationProvider);
            }
            else {
                await this.pick();
            }
        }
        async pick() {
            const result = await this.doPick();
            if (!result) {
                return false;
            }
            await this.doSignIn(result);
            return true;
        }
        async doPick() {
            if (this.authenticationProviders.length === 0) {
                return undefined;
            }
            const authenticationProviders = [...this.authenticationProviders].sort(({ id }) => id === this.currentAuthenticationProviderId ? -1 : 1);
            const allAccounts = new Map();
            if (authenticationProviders.length === 1) {
                const accounts = await this.getAccounts(authenticationProviders[0].id, authenticationProviders[0].scopes);
                if (accounts.length) {
                    allAccounts.set(authenticationProviders[0].id, accounts);
                }
                else {
                    // Single auth provider and no accounts
                    return authenticationProviders[0];
                }
            }
            let result;
            const disposables = new lifecycle_1.DisposableStore();
            const quickPick = disposables.add(this.quickInputService.createQuickPick());
            const promise = new Promise(c => {
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c(result);
                }));
            });
            quickPick.title = userDataSync_2.SYNC_TITLE.value;
            quickPick.ok = false;
            quickPick.ignoreFocusOut = true;
            quickPick.placeholder = (0, nls_1.localize)('choose account placeholder', "Select an account to sign in");
            quickPick.show();
            if (authenticationProviders.length > 1) {
                quickPick.busy = true;
                for (const { id, scopes } of authenticationProviders) {
                    const accounts = await this.getAccounts(id, scopes);
                    if (accounts.length) {
                        allAccounts.set(id, accounts);
                    }
                }
                quickPick.busy = false;
            }
            quickPick.items = this.createQuickpickItems(authenticationProviders, allAccounts);
            disposables.add(quickPick.onDidAccept(() => {
                result = quickPick.selectedItems[0]?.account ? quickPick.selectedItems[0]?.account : quickPick.selectedItems[0]?.authenticationProvider;
                quickPick.hide();
            }));
            return promise;
        }
        async getAccounts(authenticationProviderId, scopes) {
            const accounts = new Map();
            let currentAccount = null;
            const sessions = await this.authenticationService.getSessions(authenticationProviderId, scopes) || [];
            for (const session of sessions) {
                const account = new UserDataSyncAccount(authenticationProviderId, session);
                accounts.set(account.accountId, account);
                if (account.sessionId === this.currentSessionId) {
                    currentAccount = account;
                }
            }
            if (currentAccount) {
                // Always use current account if available
                accounts.set(currentAccount.accountId, currentAccount);
            }
            return currentAccount ? [...accounts.values()] : [...accounts.values()].sort(({ sessionId }) => sessionId === this.currentSessionId ? -1 : 1);
        }
        createQuickpickItems(authenticationProviders, allAccounts) {
            const quickPickItems = [];
            // Signed in Accounts
            if (allAccounts.size) {
                quickPickItems.push({ type: 'separator', label: (0, nls_1.localize)('signed in', "Signed in") });
                for (const authenticationProvider of authenticationProviders) {
                    const accounts = (allAccounts.get(authenticationProvider.id) || []).sort(({ sessionId }) => sessionId === this.currentSessionId ? -1 : 1);
                    const providerName = this.authenticationService.getProvider(authenticationProvider.id).label;
                    for (const account of accounts) {
                        quickPickItems.push({
                            label: `${account.accountName} (${providerName})`,
                            description: account.sessionId === this.current?.sessionId ? (0, nls_1.localize)('last used', "Last Used with Sync") : undefined,
                            account,
                            authenticationProvider,
                        });
                    }
                }
                quickPickItems.push({ type: 'separator', label: (0, nls_1.localize)('others', "Others") });
            }
            // Account Providers
            for (const authenticationProvider of authenticationProviders) {
                const provider = this.authenticationService.getProvider(authenticationProvider.id);
                if (!allAccounts.has(authenticationProvider.id) || provider.supportsMultipleAccounts) {
                    const providerName = provider.label;
                    quickPickItems.push({ label: (0, nls_1.localize)('sign in using account', "Sign in with {0}", providerName), authenticationProvider });
                }
            }
            return quickPickItems;
        }
        async doSignIn(accountOrAuthProvider) {
            let sessionId;
            if ((0, userDataSync_1.isAuthenticationProvider)(accountOrAuthProvider)) {
                if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.id === accountOrAuthProvider.id) {
                    sessionId = await this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.signIn();
                }
                else {
                    sessionId = (await this.authenticationService.createSession(accountOrAuthProvider.id, accountOrAuthProvider.scopes)).id;
                }
                this.currentAuthenticationProviderId = accountOrAuthProvider.id;
            }
            else {
                if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.id === accountOrAuthProvider.authenticationProviderId) {
                    sessionId = await this.environmentService.options?.settingsSyncOptions?.authenticationProvider?.signIn();
                }
                else {
                    sessionId = accountOrAuthProvider.sessionId;
                }
                this.currentAuthenticationProviderId = accountOrAuthProvider.authenticationProviderId;
            }
            this.currentSessionId = sessionId;
            await this.update();
        }
        async onDidAuthFailure() {
            this.telemetryService.publicLog2('sync/successiveAuthFailures');
            this.currentSessionId = undefined;
            await this.update('auth failure');
        }
        onDidChangeSessions(e) {
            if (this.currentSessionId && e.removed?.find(session => session.id === this.currentSessionId)) {
                this.currentSessionId = undefined;
            }
            this.update('change in sessions');
        }
        onDidChangeStorage() {
            if (this.currentSessionId !== this.getStoredCachedSessionId() /* This checks if current window changed the value or not */) {
                this._cachedCurrentSessionId = null;
                this.update('change in storage');
            }
        }
        get currentAuthenticationProviderId() {
            if (this._cachedCurrentAuthenticationProviderId === null) {
                this._cachedCurrentAuthenticationProviderId = this.storageService.get(UserDataSyncWorkbenchService_1.CACHED_AUTHENTICATION_PROVIDER_KEY, -1 /* StorageScope.APPLICATION */);
            }
            return this._cachedCurrentAuthenticationProviderId;
        }
        set currentAuthenticationProviderId(currentAuthenticationProviderId) {
            if (this._cachedCurrentAuthenticationProviderId !== currentAuthenticationProviderId) {
                this._cachedCurrentAuthenticationProviderId = currentAuthenticationProviderId;
                if (currentAuthenticationProviderId === undefined) {
                    this.storageService.remove(UserDataSyncWorkbenchService_1.CACHED_AUTHENTICATION_PROVIDER_KEY, -1 /* StorageScope.APPLICATION */);
                }
                else {
                    this.storageService.store(UserDataSyncWorkbenchService_1.CACHED_AUTHENTICATION_PROVIDER_KEY, currentAuthenticationProviderId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }
        }
        get currentSessionId() {
            if (this._cachedCurrentSessionId === null) {
                this._cachedCurrentSessionId = this.getStoredCachedSessionId();
            }
            return this._cachedCurrentSessionId;
        }
        set currentSessionId(cachedSessionId) {
            if (this._cachedCurrentSessionId !== cachedSessionId) {
                this._cachedCurrentSessionId = cachedSessionId;
                if (cachedSessionId === undefined) {
                    this.logService.info('Settings Sync: Reset current session');
                    this.storageService.remove(UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
                }
                else {
                    this.logService.info('Settings Sync: Updated current session', cachedSessionId);
                    this.storageService.store(UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, cachedSessionId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }
        }
        getStoredCachedSessionId() {
            return this.storageService.get(UserDataSyncWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
        }
        get useWorkbenchSessionId() {
            return !this.storageService.getBoolean(UserDataSyncWorkbenchService_1.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, false);
        }
        set useWorkbenchSessionId(useWorkbenchSession) {
            this.storageService.store(UserDataSyncWorkbenchService_1.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, !useWorkbenchSession, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.UserDataSyncWorkbenchService = UserDataSyncWorkbenchService;
    exports.UserDataSyncWorkbenchService = UserDataSyncWorkbenchService = UserDataSyncWorkbenchService_1 = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, authentication_1.IAuthenticationService),
        __param(3, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, storage_1.IStorageService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, userDataSync_1.IUserDataAutoSyncService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, log_1.ILogService),
        __param(10, productService_1.IProductService),
        __param(11, extensions_2.IExtensionService),
        __param(12, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(13, secrets_1.ISecretStorageService),
        __param(14, notification_1.INotificationService),
        __param(15, progress_1.IProgressService),
        __param(16, dialogs_1.IDialogService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, viewsService_1.IViewsService),
        __param(19, views_1.IViewDescriptorService),
        __param(20, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(21, lifecycle_2.ILifecycleService),
        __param(22, instantiation_1.IInstantiationService),
        __param(23, editorService_1.IEditorService),
        __param(24, userDataInit_1.IUserDataInitializationService),
        __param(25, files_1.IFileService),
        __param(26, dialogs_1.IFileDialogService),
        __param(27, userDataSyncMachines_1.IUserDataSyncMachinesService)
    ], UserDataSyncWorkbenchService);
    (0, extensions_1.registerSingleton)(userDataSync_2.IUserDataSyncWorkbenchService, UserDataSyncWorkbenchService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jV29ya2JlbmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVN5bmMvYnJvd3Nlci91c2VyRGF0YVN5bmNXb3JrYmVuY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1RGhHLGdEQUdDO0lBZEQsTUFBTSxtQkFBbUI7UUFFeEIsWUFBcUIsd0JBQWdDLEVBQW1CLE9BQThCO1lBQWpGLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBUTtZQUFtQixZQUFPLEdBQVAsT0FBTyxDQUF1QjtRQUFJLENBQUM7UUFFM0csSUFBSSxTQUFTLEtBQWEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxXQUFXLEtBQWEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLElBQUksU0FBUyxLQUFhLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzRCxJQUFJLEtBQUssS0FBYSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztLQUNoRjtJQUdELFNBQWdCLGtCQUFrQixDQUFDLE1BQWU7UUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBMEIsQ0FBQztRQUM3QyxPQUFPLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxTQUFHLENBQUMs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