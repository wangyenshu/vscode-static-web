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
define(["require", "exports", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspace/common/workspace", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment"], function (require, exports, uri_1, platform_1, configurationRegistry_1, workspace_1, extHost_protocol_1, extHostCustomers_1, configuration_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadConfiguration = void 0;
    let MainThreadConfiguration = class MainThreadConfiguration {
        constructor(extHostContext, _workspaceContextService, configurationService, _environmentService) {
            this._workspaceContextService = _workspaceContextService;
            this.configurationService = configurationService;
            this._environmentService = _environmentService;
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostConfiguration);
            proxy.$initializeConfiguration(this._getConfigurationData());
            this._configurationListener = configurationService.onDidChangeConfiguration(e => {
                proxy.$acceptConfigurationChanged(this._getConfigurationData(), e.change);
            });
        }
        _getConfigurationData() {
            const configurationData = { ...(this.configurationService.getConfigurationData()), configurationScopes: [] };
            // Send configurations scopes only in development mode.
            if (!this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment) {
                configurationData.configurationScopes = (0, configurationRegistry_1.getScopes)();
            }
            return configurationData;
        }
        dispose() {
            this._configurationListener.dispose();
        }
        $updateConfigurationOption(target, key, value, overrides, scopeToLanguage) {
            overrides = { resource: overrides?.resource ? uri_1.URI.revive(overrides.resource) : undefined, overrideIdentifier: overrides?.overrideIdentifier };
            return this.writeConfiguration(target, key, value, overrides, scopeToLanguage);
        }
        $removeConfigurationOption(target, key, overrides, scopeToLanguage) {
            overrides = { resource: overrides?.resource ? uri_1.URI.revive(overrides.resource) : undefined, overrideIdentifier: overrides?.overrideIdentifier };
            return this.writeConfiguration(target, key, undefined, overrides, scopeToLanguage);
        }
        writeConfiguration(target, key, value, overrides, scopeToLanguage) {
            target = target !== null && target !== undefined ? target : this.deriveConfigurationTarget(key, overrides);
            const configurationValue = this.configurationService.inspect(key, overrides);
            switch (target) {
                case 8 /* ConfigurationTarget.MEMORY */:
                    return this._updateValue(key, value, target, configurationValue?.memory?.override, overrides, scopeToLanguage);
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    return this._updateValue(key, value, target, configurationValue?.workspaceFolder?.override, overrides, scopeToLanguage);
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return this._updateValue(key, value, target, configurationValue?.workspace?.override, overrides, scopeToLanguage);
                case 4 /* ConfigurationTarget.USER_REMOTE */:
                    return this._updateValue(key, value, target, configurationValue?.userRemote?.override, overrides, scopeToLanguage);
                default:
                    return this._updateValue(key, value, target, configurationValue?.userLocal?.override, overrides, scopeToLanguage);
            }
        }
        _updateValue(key, value, configurationTarget, overriddenValue, overrides, scopeToLanguage) {
            overrides = scopeToLanguage === true ? overrides
                : scopeToLanguage === false ? { resource: overrides.resource }
                    : overrides.overrideIdentifier && overriddenValue !== undefined ? overrides
                        : { resource: overrides.resource };
            return this.configurationService.updateValue(key, value, overrides, configurationTarget, { donotNotifyError: true });
        }
        deriveConfigurationTarget(key, overrides) {
            if (overrides.resource && this._workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                if (configurationProperties[key] && (configurationProperties[key].scope === 4 /* ConfigurationScope.RESOURCE */ || configurationProperties[key].scope === 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */)) {
                    return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            return 5 /* ConfigurationTarget.WORKSPACE */;
        }
    };
    exports.MainThreadConfiguration = MainThreadConfiguration;
    exports.MainThreadConfiguration = MainThreadConfiguration = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadConfiguration),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService)
    ], MainThreadConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBSW5DLFlBQ0MsY0FBK0IsRUFDWSx3QkFBa0QsRUFDckQsb0JBQTJDLEVBQzdDLG1CQUF3QztZQUZuQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3JELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDN0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUU5RSxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUUzRSxLQUFLLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9FLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8scUJBQXFCO1lBQzVCLE1BQU0saUJBQWlCLEdBQTJCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsRUFBRyxDQUFDLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDdEksdURBQXVEO1lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsbUJB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