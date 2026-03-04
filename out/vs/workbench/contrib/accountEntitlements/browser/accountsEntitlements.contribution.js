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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/authentication/common/authentication", "vs/platform/actions/common/actions", "vs/workbench/services/activity/common/activity", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/platform", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, platform_1, contributions_1, lifecycle_1, contextkey_1, commands_1, telemetry_1, authentication_1, actions_1, activity_1, productService_1, extensionManagement_1, extensions_1, storage_1, extensions_2, configurationRegistry_1, configuration_1, nls_1, configuration_2, request_1, cancellation_1, dialogs_1, platform_2, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const accountsBadgeConfigKey = 'workbench.accounts.experimental.showEntitlements';
    const chatWelcomeViewConfigKey = 'workbench.chat.experimental.showWelcomeView';
    let EntitlementsContribution = class EntitlementsContribution extends lifecycle_1.Disposable {
        constructor(contextService, telemetryService, authenticationService, productService, storageService, extensionManagementService, activityService, extensionService, configurationService, requestService) {
            super();
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.authenticationService = authenticationService;
            this.productService = productService;
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.activityService = activityService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.requestService = requestService;
            this.isInitialized = false;
            this.showAccountsBadgeContextKey = new contextkey_1.RawContextKey(accountsBadgeConfigKey, false).bindTo(this.contextService);
            this.showChatWelcomeViewContextKey = new contextkey_1.RawContextKey(chatWelcomeViewConfigKey, false).bindTo(this.contextService);
            this.accountsMenuBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            if (!this.productService.gitHubEntitlement || platform_2.isWeb) {
                return;
            }
            this.extensionManagementService.getInstalled().then(async (exts) => {
                const installed = exts.find(value => extensions_1.ExtensionIdentifier.equals(value.identifier.id, this.productService.gitHubEntitlement.extensionId));
                if (installed) {
                    this.disableEntitlements();
                }
                else {
                    this.registerListeners();
                }
            });
        }
        registerListeners() {
            if (this.storageService.getBoolean(accountsBadgeConfigKey, -1 /* StorageScope.APPLICATION */) === false) {
                // we have already shown the entitlements. Do not show again
                return;
            }
            this._register(this.extensionService.onDidChangeExtensions(async (result) => {
                for (const ext of result.added) {
                    if (extensions_1.ExtensionIdentifier.equals(this.productService.gitHubEntitlement.extensionId, ext.identifier)) {
                        this.disableEntitlements();
                        return;
                    }
                }
            }));
            this._register(this.authenticationService.onDidChangeSessions(async (e) => {
                if (e.providerId === this.productService.gitHubEntitlement.providerId && e.event.added?.length) {
                    await this.enableEntitlements(e.event.added[0]);
                }
                else if (e.providerId === this.productService.gitHubEntitlement.providerId && e.event.removed?.length) {
                    this.showAccountsBadgeContextKey.set(false);
                    this.showChatWelcomeViewContextKey.set(false);
                    this.accountsMenuBadgeDisposable.clear();
                }
            }));
            this._register(this.authenticationService.onDidRegisterAuthenticationProvider(async (e) => {
                if (e.id === this.productService.gitHubEntitlement.providerId) {
                    await this.enableEntitlements((await this.authenticationService.getSessions(e.id))[0]);
                }
            }));
        }
        async getEntitlementsInfo(session) {
            if (this.isInitialized) {
                return [false, ''];
            }
            const context = await this.requestService.request({
                type: 'GET',
                url: this.productService.gitHubEntitlement.entitlementUrl,
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode && context.res.statusCode !== 200) {
                return [false, ''];
            }
            const result = await (0, request_1.asText)(context);
            if (!result) {
                return [false, ''];
            }
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            }
            catch (err) {
                //ignore
                return [false, ''];
            }
            if (!(this.productService.gitHubEntitlement.enablementKey in parsedResult) || !parsedResult[this.productService.gitHubEntitlement.enablementKey]) {
                this.telemetryService.publicLog2('entitlements.enabled', { enabled: false });
                return [false, ''];
            }
            this.telemetryService.publicLog2('entitlements.enabled', { enabled: true });
            this.isInitialized = true;
            const orgs = parsedResult['organization_list'];
            return [true, orgs && orgs.length > 0 ? (orgs[0].name ? orgs[0].name : orgs[0].login) : undefined];
        }
        async enableEntitlements(session) {
            const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(this.productService, this.configurationService);
            const showAccountsBadge = this.configurationService.inspect(accountsBadgeConfigKey).value ?? false;
            const showWelcomeView = this.configurationService.inspect(chatWelcomeViewConfigKey).value ?? false;
            const [enabled, org] = await this.getEntitlementsInfo(session);
            if (enabled) {
                if (isInternal && showWelcomeView) {
                    this.showChatWelcomeViewContextKey.set(true);
                    this.telemetryService.publicLog2(chatWelcomeViewConfigKey, { enabled: true });
                }
                if (showAccountsBadge) {
                    this.createAccountsBadge(org);
                    this.showAccountsBadgeContextKey.set(showAccountsBadge);
                    this.telemetryService.publicLog2(accountsBadgeConfigKey, { enabled: true });
                }
            }
        }
        disableEntitlements() {
            this.storageService.store(accountsBadgeConfigKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this.storageService.store(chatWelcomeViewConfigKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this.showAccountsBadgeContextKey.set(false);
            this.showChatWelcomeViewContextKey.set(false);
            this.accountsMenuBadgeDisposable.clear();
        }
        async createAccountsBadge(org) {
            const menuTitle = org ? this.productService.gitHubEntitlement.command.title.replace('{{org}}', org) : this.productService.gitHubEntitlement.command.titleWithoutPlaceHolder;
            const badge = new activity_1.NumberBadge(1, () => menuTitle);
            this.accountsMenuBadgeDisposable.value = this.activityService.showAccountsActivity({ badge });
            this.contextService.onDidChangeContext(e => {
                if (e.affectsSome(new Set([accountsBadgeConfigKey]))) {
                    if (!this.contextService.getContextKeyValue(accountsBadgeConfigKey)) {
                        this.accountsMenuBadgeDisposable.clear();
                    }
                }
            });
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.entitlementAction',
                        title: menuTitle,
                        f1: false,
                        menu: {
                            id: actions_1.MenuId.AccountsContext,
                            group: '5_AccountsEntitlements',
                            when: contextkey_1.ContextKeyExpr.equals(accountsBadgeConfigKey, true),
                        }
                    });
                }
                async run(accessor) {
                    const productService = accessor.get(productService_1.IProductService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                    const confirmation = await dialogService.confirm({
                        type: 'question',
                        message: productService.gitHubEntitlement.confirmationMessage,
                        primaryButton: productService.gitHubEntitlement.confirmationAction,
                    });
                    if (confirmation.confirmed) {
                        commandService.executeCommand(productService.gitHubEntitlement.command.action, productService.gitHubEntitlement.extensionId);
                        telemetryService.publicLog2('accountsEntitlements.action', {
                            command: productService.gitHubEntitlement.command.action,
                        });
                    }
                    else {
                        telemetryService.publicLog2('accountsEntitlements.action', {
                            command: productService.gitHubEntitlement.command.action + '-dismissed',
                        });
                    }
                    const contextKey = new contextkey_1.RawContextKey(accountsBadgeConfigKey, false).bindTo(contextKeyService);
                    contextKey.set(false);
                    storageService.store(accountsBadgeConfigKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }));
        }
    };
    EntitlementsContribution = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, authentication_1.IAuthenticationService),
        __param(3, productService_1.IProductService),
        __param(4, storage_1.IStorageService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, activity_1.IActivityService),
        __param(7, extensions_2.IExtensionService),
        __param(8, configuration_2.IConfigurationService),
        __param(9, request_1.IRequestService)
    ], EntitlementsContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_1.applicationConfigurationNodeBase,
        properties: {
            'workbench.accounts.experimental.showEntitlements': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                description: (0, nls_1.localize)('workbench.accounts.showEntitlements', "When enabled, available entitlements for the account will be show in the accounts menu.")
            }
        }
    });
    configurationRegistry.registerConfiguration({
        ...configuration_1.applicationConfigurationNodeBase,
        properties: {
            'workbench.chat.experimental.showWelcomeView': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                description: (0, nls_1.localize)('workbench.chat.showWelcomeView', "When enabled, the chat panel welcome view will be shown.")
            }
        }
    });
    (0, contributions_1.registerWorkbenchContribution2)('workbench.contrib.entitlements', EntitlementsContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudHNFbnRpdGxlbWVudHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYWNjb3VudEVudGl0bGVtZW50cy9icm93c2VyL2FjY291bnRzRW50aXRsZW1lbnRzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQTJCaEcsTUFBTSxzQkFBc0IsR0FBRyxrREFBa0QsQ0FBQztJQUNsRixNQUFNLHdCQUF3QixHQUFHLDZDQUE2QyxDQUFDO0lBYy9FLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFPaEQsWUFDcUIsY0FBbUQsRUFDcEQsZ0JBQW9ELEVBQy9DLHFCQUE4RCxFQUNyRSxjQUFnRCxFQUNoRCxjQUFnRCxFQUNwQywwQkFBd0UsRUFDbkYsZUFBa0QsRUFDakQsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUNsRSxjQUFnRDtZQUNqRSxLQUFLLEVBQUUsQ0FBQztZQVY2QixtQkFBYyxHQUFkLGNBQWMsQ0FBb0I7WUFDbkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUM5QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3BELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNsRSxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQWYxRCxrQkFBYSxHQUFHLEtBQUssQ0FBQztZQUN0QixnQ0FBMkIsR0FBRyxJ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