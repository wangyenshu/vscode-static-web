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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/editSessions/common/editSessions", "vs/platform/dialogs/common/dialogs", "vs/base/common/uuid", "vs/workbench/services/authentication/browser/authenticationService", "vs/base/common/platform", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/base/common/event", "vs/base/common/errors", "vs/platform/secrets/common/secrets"], function (require, exports, lifecycle_1, nls_1, actions_1, contextkey_1, environment_1, files_1, productService_1, quickInput_1, storage_1, userDataSync_1, authentication_1, extensions_1, editSessions_1, dialogs_1, uuid_1, authenticationService_1, platform_1, userDataSyncMachines_1, event_1, errors_1, secrets_1) {
    "use strict";
    var EditSessionsWorkbenchService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsWorkbenchService = void 0;
    let EditSessionsWorkbenchService = class EditSessionsWorkbenchService extends lifecycle_1.Disposable {
        static { EditSessionsWorkbenchService_1 = this; }
        static { this.CACHED_SESSION_STORAGE_KEY = 'editSessionAccountPreference'; }
        get isSignedIn() {
            return this.existingSessionId !== undefined;
        }
        get onDidSignIn() {
            return this._didSignIn.event;
        }
        get onDidSignOut() {
            return this._didSignOut.event;
        }
        get lastWrittenResources() {
            return this._lastWrittenResources;
        }
        get lastReadResources() {
            return this._lastReadResources;
        }
        constructor(fileService, storageService, quickInputService, authenticationService, extensionService, environmentService, logService, productService, contextKeyService, dialogService, secretStorageService) {
            super();
            this.fileService = fileService;
            this.storageService = storageService;
            this.quickInputService = quickInputService;
            this.authenticationService = authenticationService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this.logService = logService;
            this.productService = productService;
            this.contextKeyService = contextKeyService;
            this.dialogService = dialogService;
            this.secretStorageService = secretStorageService;
            this.SIZE_LIMIT = Math.floor(1024 * 1024 * 1.9); // 2 MB
            this.serverConfiguration = this.productService['editSessions.store'];
            this.initialized = false;
            this._didSignIn = new event_1.Emitter();
            this._didSignOut = new event_1.Emitter();
            this._lastWrittenResources = new Map();
            this._lastReadResources = new Map();
            // If the user signs out of the current session, reset our cached auth state in memory and on disk
            this._register(this.authenticationService.onDidChangeSessions((e) => this.onDidChangeSessions(e.event)));
            // If another window changes the preferred session storage, reset our cached auth state in memory
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidChangeStorage()));
            this.registerSignInAction();
            this.registerResetAuthenticationAction();
            this.signedInContext = editSessions_1.EDIT_SESSIONS_SIGNED_IN.bindTo(this.contextKeyService);
            this.signedInContext.set(this.existingSessionId !== undefined);
        }
        /**
         * @param resource: The resource to retrieve content for.
         * @param content An object representing resource state to be restored.
         * @returns The ref of the stored state.
         */
        async write(resource, content) {
            await this.initialize('write', false);
            if (!this.initialized) {
                throw new Error('Please sign in to store your edit session.');
            }
            if (typeof content !== 'string' && content.machine === undefined) {
                content.machine = await this.getOrCreateCurrentMachineId();
            }
            content = typeof content === 'string' ? content : JSON.stringify(content);
            const ref = await this.storeClient.writeResource(resource, content, null, undefined, (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)()));
            this._lastWrittenResources.set(resource, { ref, content });
            return ref;
        }
        /**
         * @param resource: The resource to retrieve content for.
         * @param ref: A specific content ref to retrieve content for, if it exists.
         * If undefined, this method will return the latest saved edit session, if any.
         *
         * @returns An object representing the requested or latest state, if any.
         */
        async read(resource, ref) {
            await this.initialize('read', false);
            if (!this.initialized) {
                throw new Error('Please sign in to apply your latest edit session.');
            }
            let content;
            const headers = (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)());
            try {
                if (ref !== undefined) {
                    content = await this.storeClient?.resolveResourceContent(resource, ref, undefined, headers);
                }
                else {
                    const result = await this.storeClient?.readResource(resource, null, undefined, headers);
                    content = result?.content;
                    ref = result?.ref;
                }
            }
            catch (ex) {
                this.logService.error(ex);
            }
            // TODO@joyceerhl Validate session data, check schema version
            if (content !== undefined && content !== null && ref !== undefined) {
                this._lastReadResources.set(resource, { ref, content });
                return { ref, content };
            }
            return undefined;
        }
        async delete(resource, ref) {
            await this.initialize('write', false);
            if (!this.initialized) {
                throw new Error(`Unable to delete edit session with ref ${ref}.`);
            }
            try {
                await this.storeClient?.deleteResource(resource, ref);
            }
            catch (ex) {
                this.logService.error(ex);
            }
        }
        async list(resource) {
            await this.initialize('read', false);
            if (!this.initialized) {
                throw new Error(`Unable to list edit sessions.`);
            }
            try {
                return this.storeClient?.getAllResourceRefs(resource) ?? [];
            }
            catch (ex) {
                this.logService.error(ex);
            }
            return [];
        }
        async initialize(reason, silent = false) {
            if (this.initialized) {
                return true;
            }
            this.initialized = await this.doInitialize(reason, silent);
            this.signedInContext.set(this.initialized);
            if (this.initialized) {
                this._didSignIn.fire();
            }
            return this.initialized;
        }
        /**
         *
         * Ensures that the store client is initialized,
         * meaning that authentication is configured and it
         * can be used to communicate with the remote storage service
         */
        async doInitialize(reason, silent) {
            // Wait for authentication extensions to be registered
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (!this.serverConfiguration?.url) {
                throw new Error('Unable to initialize sessions sync as session sync preference is not configured in product.json.');
            }
            if (this.storeClient === undefined) {
                return false;
            }
            this._register(this.storeClient.onTokenFailed(() => {
                this.logService.info('Clearing edit sessions authentication preference because of successive token failures.');
                this.clearAuthenticationPreference();
            }));
            if (this.machineClient === undefined) {
                this.machineClient = new userDataSyncMachines_1.UserDataSyncMachinesService(this.environmentService, this.fileService, this.storageService, this.storeClient, this.logService, this.productService);
            }
            // If we already have an existing auth session in memory, use that
            if (this.authenticationInfo !== undefined) {
                return true;
            }
            const authenticationSession = await this.getAuthenticationSession(reason, silent);
            if (authenticationSession !== undefined) {
                this.authenticationInfo = authenticationSession;
                this.storeClient.setAuthToken(authenticationSession.token, authenticationSession.providerId);
            }
            return authenticationSession !== undefined;
        }
        async getMachineById(machineId) {
            await this.initialize('read', false);
            if (!this.cachedMachines) {
                const machines = await this.machineClient.getMachines();
                this.cachedMachines = machines.reduce((map, machine) => map.set(machine.id, machine.name), new Map());
            }
            return this.cachedMachines.get(machineId);
        }
        async getOrCreateCurrentMachineId() {
            const currentMachineId = await this.machineClient.getMachines().then((machines) => machines.find((m) => m.isCurrent)?.id);
            if (currentMachineId === undefined) {
                await this.machineClient.addCurrentMachine();
                return await this.machineClient.getMachines().then((machines) => machines.find((m) => m.isCurrent).id);
            }
            return currentMachineId;
        }
        async getAuthenticationSession(reason, silent) {
            // If the user signed in previously and the session is still available, reuse that without prompting the user again
            if (this.existingSessionId) {
                this.logService.info(`Searching for existing authentication session with ID ${this.existingSessionId}`);
                const existingSession = await this.getExistingSession();
                if (existingSession) {
                    this.logService.info(`Found existing authentication session with ID ${existingSession.session.id}`);
                    return { sessionId: existingSession.session.id, token: existingSession.session.idToken ?? existingSession.session.accessToken, providerId: existingSession.session.providerId };
                }
                else {
                    this._didSignOut.fire();
                }
            }
            // If settings sync is already enabled, avoid asking again to authenticate
            if (this.shouldAttemptEditSessionInit()) {
                this.logService.info(`Reusing user data sync enablement`);
                const authenticationSessionInfo = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService);
                if (authenticationSessionInfo !== undefined) {
                    this.logService.info(`Using current authentication session with ID ${authenticationSessionInfo.id}`);
                    this.existingSessionId = authenticationSessionInfo.id;
                    return { sessionId: authenticationSessionInfo.id, token: authenticationSessionInfo.accessToken, providerId: authenticationSessionInfo.providerId };
                }
            }
            // If we aren't supposed to prompt the user because
            // we're in a silent flow, just return here
            if (silent) {
                return;
            }
            // Ask the user to pick a preferred account
            const authenticationSession = await this.getAccountPreference(reason);
            if (authenticationSession !== undefined) {
                this.existingSessionId = authenticationSession.id;
                return { sessionId: authenticationSession.id, token: authenticationSession.idToken ?? authenticationSession.accessToken, providerId: authenticationSession.providerId };
            }
            return undefined;
        }
        shouldAttemptEditSessionInit() {
            return platform_1.isWeb && this.storageService.isNew(-1 /* StorageScope.APPLICATION */) && this.storageService.isNew(1 /* StorageScope.WORKSPACE */);
        }
        /**
         *
         * Prompts the user to pick an authentication option for storing and getting edit sessions.
         */
        async getAccountPreference(reason) {
            const quickpick = this.quickInputService.createQuickPick();
            quickpick.ok = false;
            quickpick.placeholder = reason === 'read' ? (0, nls_1.localize)('choose account read placeholder', "Select an account to restore your working changes from the cloud") : (0, nls_1.localize)('choose account placeholder', "Select an account to store your working changes in the cloud");
            quickpick.ignoreFocusOut = true;
            quickpick.items = await this.createQuickpickItems();
            return new Promise((resolve, reject) => {
                quickpick.onDidHide((e) => {
                    reject(new errors_1.CancellationError());
                    quickpick.dispose();
                });
                quickpick.onDidAccept(async (e) => {
                    const selection = quickpick.selectedItems[0];
                    const session = 'provider' in selection ? { ...await this.authenticationService.createSession(selection.provider.id, selection.provider.scopes), providerId: selection.provider.id } : ('session' in selection ? selection.session : undefined);
                    resolve(session);
                    quickpick.hide();
                });
                quickpick.show();
            });
        }
        async createQuickpickItems() {
            const options = [];
            options.push({ type: 'separator', label: (0, nls_1.localize)('signed in', "Signed In") });
            const sessions = await this.getAllSessions();
            options.push(...sessions);
            options.push({ type: 'separator', label: (0, nls_1.localize)('others', "Others") });
            for (const authenticationProvider of (await this.getAuthenticationProviders())) {
                const signedInForProvider = sessions.some(account => account.session.providerId === authenticationProvider.id);
                if (!signedInForProvider || this.authenticationService.getProvider(authenticationProvider.id).supportsMultipleAccounts) {
                    const providerName = this.authenticationService.getProvider(authenticationProvider.id).label;
                    options.push({ label: (0, nls_1.localize)('sign in using account', "Sign in with {0}", providerName), provider: authenticationProvider });
                }
            }
            return options;
        }
        /**
         *
         * Returns all authentication sessions available from {@link getAuthenticationProviders}.
         */
        async getAllSessions() {
            const authenticationProviders = await this.getAuthenticationProviders();
            const accounts = new Map();
            let currentSession;
            for (const provider of authenticationProviders) {
                const sessions = await this.authenticationService.getSessions(provider.id, provider.scopes);
                for (const session of sessions) {
                    const item = {
                        label: session.account.label,
                        description: this.authenticationService.getProvider(provider.id).label,
                        session: { ...session, providerId: provider.id }
                    };
                    accounts.set(item.session.account.id, item);
                    if (this.existingSessionId === session.id) {
                        currentSession = item;
                    }
                }
            }
            if (currentSession !== undefined) {
                accounts.set(currentSession.session.account.id, currentSession);
            }
            return [...accounts.values()].sort((a, b) => a.label.localeCompare(b.label));
        }
        /**
         *
         * Returns all authentication providers which can be used to authenticate
         * to the remote storage service, based on product.json configuration
         * and registered authentication providers.
         */
        async getAuthenticationProviders() {
            if (!this.serverConfiguration) {
                throw new Error('Unable to get configured authentication providers as session sync preference is not configured in product.json.');
            }
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
        get existingSessionId() {
            return this.storageService.get(EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
        }
        set existingSessionId(sessionId) {
            this.logService.trace(`Saving authentication session preference for ID ${sessionId}.`);
            if (sessionId === undefined) {
                this.storageService.remove(EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            }
            else {
                this.storageService.store(EditSessionsWorkbenchService_1.CACHED_SESSION_STORAGE_KEY, sessionId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
        }
        async getExistingSession() {
            const accounts = await this.getAllSessions();
            return accounts.find((account) => account.session.id === this.existingSessionId);
        }
        async onDidChangeStorage() {
            const newSessionId = this.existingSessionId;
            const previousSessionId = this.authenticationInfo?.sessionId;
            if (previousSessionId !== newSessionId) {
                this.logService.trace(`Resetting authentication state because authentication session ID preference changed from ${previousSessionId} to ${newSessionId}.`);
                this.authenticationInfo = undefined;
                this.initialized = false;
            }
        }
        clearAuthenticationPreference() {
            this.authenticationInfo = undefined;
            this.initialized = false;
            this.existingSessionId = undefined;
            this.signedInContext.set(false);
        }
        onDidChangeSessions(e) {
            if (this.authenticationInfo?.sessionId && e.removed?.find(session => session.id === this.authenticationInfo?.sessionId)) {
                this.clearAuthenticationPreference();
            }
        }
        registerSignInAction() {
            const that = this;
            const id = 'workbench.editSessions.actions.signIn';
            const when = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_PENDING_KEY, false), contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, false));
            this._register((0, actions_1.registerAction2)(class ResetEditSessionAuthenticationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id,
                        title: (0, nls_1.localize)('sign in', 'Turn on Cloud Changes...'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        precondition: when,
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                            },
                            {
                                id: actions_1.MenuId.AccountsContext,
                                group: '2_editSessions',
                                when,
                            }]
                    });
                }
                async run() {
                    return await that.initialize('write', false);
                }
            }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '2_editSessions',
                command: {
                    id,
                    title: (0, nls_1.localize)('sign in badge', 'Turn on Cloud Changes... (1)'),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_PENDING_KEY, true), contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, false))
            }));
        }
        registerResetAuthenticationAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ResetEditSessionAuthenticationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resetAuth',
                        title: (0, nls_1.localize)('reset auth.v3', 'Turn off Cloud Changes...'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, true),
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                            },
                            {
                                id: actions_1.MenuId.AccountsContext,
                                group: '2_editSessions',
                                when: contextkey_1.ContextKeyExpr.equals(editSessions_1.EDIT_SESSIONS_SIGNED_IN_KEY, true),
                            }]
                    });
                }
                async run() {
                    const result = await that.dialogService.confirm({
                        message: (0, nls_1.localize)('sign out of cloud changes clear data prompt', 'Do you want to disable storing working changes in the cloud?'),
                        checkbox: { label: (0, nls_1.localize)('delete all cloud changes', 'Delete all stored data from the cloud.') }
                    });
                    if (result.confirmed) {
                        if (result.checkboxChecked) {
                            that.storeClient?.deleteResource('editSessions', null);
                        }
                        that.clearAuthenticationPreference();
                    }
                }
            }));
        }
    };
    exports.EditSessionsWorkbenchService = EditSessionsWorkbenchService;
    exports.EditSessionsWorkbenchService = EditSessionsWorkbenchService = EditSessionsWorkbenchService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, authentication_1.IAuthenticationService),
        __param(4, extensions_1.IExtensionService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, editSessions_1.IEditSessionsLogService),
        __param(7, productService_1.IProductService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, dialogs_1.IDialogService),
        __param(10, secrets_1.ISecretStorageService)
    ], EditSessionsWorkbenchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zU3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lZGl0U2Vzc2lvbnMvYnJvd3Nlci9lZGl0U2Vzc2lvbnNTdG9yYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNEJ6RixJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVOztpQkFVNUMsK0JBQTBCLEdBQUcsOEJBQThCLEFBQWpDLENBQWtDO1FBSzNFLElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixLQUFLLFNBQVMsQ0FBQztRQUM3QyxDQUFDO1FBR0QsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUM5QixDQUFDO1FBR0QsSUFBSSxZQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztRQUMvQixDQUFDO1FBR0QsSUFBSSxvQkFBb0I7WUFDdkIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUM7UUFDbkMsQ0FBQztRQUdELElBQUksaUJBQWlCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFJRCxZQUNlLFdBQTBDLEVBQ3ZDLGNBQWdELEVBQzdDLGlCQUFzRCxFQUNsRCxxQkFBOEQsRUFDbkUsZ0JBQW9ELEVBQ2xELGtCQUF3RCxFQUNwRCxVQUFvRCxFQUM1RCxjQUFnRCxFQUM3QyxpQkFBc0QsRUFDMUQsYUFBOEMsRUFDdkMsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBWnVCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3RCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM1Qixz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