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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/authentication/browser/actions/signOutOfAccountAction", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensions/common/extensionsRegistry", "./actions/manageTrustedExtensionsForAccountAction"], function (require, exports, lifecycle_1, strings_1, nls_1, actions_1, commands_1, contextkey_1, descriptors_1, platform_1, contributions_1, signOutOfAccountAction_1, authentication_1, environmentService_1, extensionFeatures_1, extensionsRegistry_1, manageTrustedExtensionsForAccountAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationContribution = void 0;
    const codeExchangeProxyCommand = commands_1.CommandsRegistry.registerCommand('workbench.getCodeExchangeProxyEndpoints', function (accessor, _) {
        const environmentService = accessor.get(environmentService_1.IBrowserWorkbenchEnvironmentService);
        return environmentService.options?.codeExchangeProxyEndpoints;
    });
    const authenticationDefinitionSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {
            id: {
                type: 'string',
                description: (0, nls_1.localize)('authentication.id', 'The id of the authentication provider.')
            },
            label: {
                type: 'string',
                description: (0, nls_1.localize)('authentication.label', 'The human readable name of the authentication provider.'),
            }
        }
    };
    const authenticationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'authentication',
        jsonSchema: {
            description: (0, nls_1.localize)({ key: 'authenticationExtensionPoint', comment: [`'Contributes' means adds here`] }, 'Contributes authentication'),
            type: 'array',
            items: authenticationDefinitionSchema
        },
        activationEventsGenerator: (authenticationProviders, result) => {
            for (const authenticationProvider of authenticationProviders) {
                if (authenticationProvider.id) {
                    result.push(`onAuthenticationRequest:${authenticationProvider.id}`);
                }
            }
        }
    });
    class AuthenticationDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.authentication;
        }
        render(manifest) {
            const authentication = manifest.contributes?.authentication || [];
            if (!authentication.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('authenticationlabel', "Label"),
                (0, nls_1.localize)('authenticationid', "ID"),
            ];
            const rows = authentication
                .sort((a, b) => a.label.localeCompare(b.label))
                .map(auth => {
                return [
                    auth.label,
                    auth.id,
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    const extensionFeature = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'authentication',
        label: (0, nls_1.localize)('authentication', "Authentication"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(AuthenticationDataRenderer),
    });
    let AuthenticationContribution = class AuthenticationContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.authentication'; }
        constructor(_authenticationService, _environmentService) {
            super();
            this._authenticationService = _authenticationService;
            this._environmentService = _environmentService;
            this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                command: {
                    id: 'noAuthenticationProviders',
                    title: (0, nls_1.localize)('authentication.Placeholder', "No accounts requested yet..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
            });
            this._register(codeExchangeProxyCommand);
            this._register(extensionFeature);
            this._registerHandlers();
            this._registerAuthenticationExtentionPointHandler();
            this._registerEnvContributedAuthenticationProviders();
            this._registerActions();
        }
        _registerAuthenticationExtentionPointHandler() {
            authenticationExtPoint.setHandler((extensions, { added, removed }) => {
                added.forEach(point => {
                    for (const provider of point.value) {
                        if ((0, strings_1.isFalsyOrWhitespace)(provider.id)) {
                            point.collector.error((0, nls_1.localize)('authentication.missingId', 'An authentication contribution must specify an id.'));
                            continue;
                        }
                        if ((0, strings_1.isFalsyOrWhitespace)(provider.label)) {
                            point.collector.error((0, nls_1.localize)('authentication.missingLabel', 'An authentication contribution must specify a label.'));
                            continue;
                        }
                        if (!this._authenticationService.declaredProviders.some(p => p.id === provider.id)) {
                            this._authenticationService.registerDeclaredAuthenticationProvider(provider);
                        }
                        else {
                            point.collector.error((0, nls_1.localize)('authentication.idConflict', "This authentication id '{0}' has already been registered", provider.id));
                        }
                    }
                });
                const removedExtPoints = removed.flatMap(r => r.value);
                removedExtPoints.forEach(point => {
                    const provider = this._authenticationService.declaredProviders.find(provider => provider.id === point.id);
                    if (provider) {
                        this._authenticationService.unregisterDeclaredAuthenticationProvider(provider.id);
                    }
                });
            });
        }
        _registerEnvContributedAuthenticationProviders() {
            if (!this._environmentService.options?.authenticationProviders?.length) {
                return;
            }
            for (const provider of this._environmentService.options.authenticationProviders) {
                this._authenticationService.registerAuthenticationProvider(provider.id, provider);
            }
        }
        _registerHandlers() {
            this._register(this._authenticationService.onDidRegisterAuthenticationProvider(_e => {
                this._placeholderMenuItem?.dispose();
                this._placeholderMenuItem = undefined;
            }));
            this._register(this._authenticationService.onDidUnregisterAuthenticationProvider(_e => {
                if (!this._authenticationService.getProviderIds().length) {
                    this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                        command: {
                            id: 'noAuthenticationProviders',
                            title: (0, nls_1.localize)('loading', "Loading..."),
                            precondition: contextkey_1.ContextKeyExpr.false()
                        }
                    });
                }
            }));
        }
        _registerActions() {
            this._register((0, actions_1.registerAction2)(signOutOfAccountAction_1.SignOutOfAccountAction));
            this._register((0, actions_1.registerAction2)(manageTrustedExtensionsForAccountAction_1.ManageTrustedExtensionsForAccountAction));
        }
    };
    exports.AuthenticationContribution = AuthenticationContribution;
    exports.AuthenticationContribution = AuthenticationContribution = __decorate([
        __param(0, authentication_1.IAuthenticationService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], AuthenticationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(AuthenticationContribution.ID, AuthenticationContribution, 3 /* WorkbenchPhase.AfterRestored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYXV0aGVudGljYXRpb24vYnJvd3Nlci9hdXRoZW50aWNhdGlvbi5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxNQUFNLHdCQUF3QixHQUFHLDJCQUFnQixDQUFDLGVBQWUsQ0FBQyx5Q0FBeUMsRUFBRSxVQUFVLFFBQVEsRUFBRSxDQUFDO1FBQ2pJLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3REFBbUMsQ0FBQyxDQUFDO1FBQzdFLE9BQU8sa0JBQWtCLENBQUMsT0FBTyxFQUFFLDBCQUEwQixDQUFDO0lBQy9ELENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSw4QkFBOEIsR0FBZ0I7UUFDbkQsSUFBSSxFQUFFLFFBQVE7UUFDZCxvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLFVBQVUsRUFBRTtZQUNYLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsd0NBQXdDLENBQUM7YUFDcEY7WUFDRCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHlEQUF5RCxDQUFDO2FBQ3hHO1NBQ0Q7S0FDRCxDQUFDO0lBRUYsTUFBTSxzQkFBc0IsR0FBRyx1Q0FBa0IsQ0FBQyxzQkFBc0IsQ0FBc0M7UUFDN0csY0FBYyxFQUFFLGdCQUFnQjtRQUNoQyxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsOEJBQThC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