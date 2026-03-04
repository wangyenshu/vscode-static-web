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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/base/common/objects", "vs/base/common/async"], function (require, exports, nls_1, configurationRegistry_1, platform_1, workspace_1, configuration_1, lifecycle_1, event_1, remoteAgentService_1, platform_2, objects_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicWorkbenchSecurityConfiguration = exports.ConfigurationMigrationWorkbenchContribution = exports.Extensions = exports.problemsConfigurationNodeBase = exports.securityConfigurationNodeBase = exports.workbenchConfigurationNodeBase = exports.applicationConfigurationNodeBase = void 0;
    exports.applicationConfigurationNodeBase = Object.freeze({
        'id': 'application',
        'order': 100,
        'title': (0, nls_1.localize)('applicationConfigurationTitle', "Application"),
        'type': 'object'
    });
    exports.workbenchConfigurationNodeBase = Object.freeze({
        'id': 'workbench',
        'order': 7,
        'title': (0, nls_1.localize)('workbenchConfigurationTitle', "Workbench"),
        'type': 'object',
    });
    exports.securityConfigurationNodeBase = Object.freeze({
        'id': 'security',
        'scope': 1 /* ConfigurationScope.APPLICATION */,
        'title': (0, nls_1.localize)('securityConfigurationTitle', "Security"),
        'type': 'object',
        'order': 7
    });
    exports.problemsConfigurationNodeBase = Object.freeze({
        'id': 'problems',
        'title': (0, nls_1.localize)('problemsConfigurationTitle', "Problems"),
        'type': 'object',
        'order': 101
    });
    exports.Extensions = {
        ConfigurationMigration: 'base.contributions.configuration.migration'
    };
    class ConfigurationMigrationRegistry {
        constructor() {
            this.migrations = [];
            this._onDidRegisterConfigurationMigrations = new event_1.Emitter();
            this.onDidRegisterConfigurationMigration = this._onDidRegisterConfigurationMigrations.event;
        }
        registerConfigurationMigrations(configurationMigrations) {
            this.migrations.push(...configurationMigrations);
        }
    }
    const configurationMigrationRegistry = new ConfigurationMigrationRegistry();
    platform_1.Registry.add(exports.Extensions.ConfigurationMigration, configurationMigrationRegistry);
    let ConfigurationMigrationWorkbenchContribution = class ConfigurationMigrationWorkbenchContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.configurationMigration'; }
        constructor(configurationService, workspaceService) {
            super();
            this.configurationService = configurationService;
            this.workspaceService = workspaceService;
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(async (e) => {
                for (const folder of e.added) {
                    await this.migrateConfigurationsForFolder(folder, configurationMigrationRegistry.migrations);
                }
            }));
            this.migrateConfigurations(configurationMigrationRegistry.migrations);
            this._register(configurationMigrationRegistry.onDidRegisterConfigurationMigration(migration => this.migrateConfigurations(migration)));
        }
        async migrateConfigurations(migrations) {
            await this.migrateConfigurationsForFolder(undefined, migrations);
            for (const folder of this.workspaceService.getWorkspace().folders) {
                await this.migrateConfigurationsForFolder(folder, migrations);
            }
        }
        async migrateConfigurationsForFolder(folder, migrations) {
            await Promise.all([migrations.map(migration => this.migrateConfigurationsForFolderAndOverride(migration, folder?.uri))]);
        }
        async migrateConfigurationsForFolderAndOverride(migration, resource) {
            const inspectData = this.configurationService.inspect(migration.key, { resource });
            const targetPairs = this.workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? [
                ['user', 2 /* ConfigurationTarget.USER */],
                ['userLocal', 3 /* ConfigurationTarget.USER_LOCAL */],
                ['userRemote', 4 /* ConfigurationTarget.USER_REMOTE */],
                ['workspace', 5 /* ConfigurationTarget.WORKSPACE */],
                ['workspaceFolder', 6 /* ConfigurationTarget.WORKSPACE_FOLDER */],
            ] : [
                ['user', 2 /* ConfigurationTarget.USER */],
                ['userLocal', 3 /* ConfigurationTarget.USER_LOCAL */],
                ['userRemote', 4 /* ConfigurationTarget.USER_REMOTE */],
                ['workspace', 5 /* ConfigurationTarget.WORKSPACE */],
            ];
            for (const [dataKey, target] of targetPairs) {
                const inspectValue = inspectData[dataKey];
                if (!inspectValue) {
                    continue;
                }
                const migrationValues = [];
                if (inspectValue.value !== undefined) {
                    const keyValuePairs = await this.runMigration(migration, dataKey, inspectValue.value, resource, undefined);
                    for (const keyValuePair of keyValuePairs ?? []) {
                        migrationValues.push([keyValuePair, []]);
                    }
                }
                for (const { identifiers, value } of inspectValue.overrides ?? []) {
                    if (value !== undefined) {
                        const keyValuePairs = await this.runMigration(migration, dataKey, value, resource, identifiers);
                        for (const keyValuePair of keyValuePairs ?? []) {
                            migrationValues.push([keyValuePair, identifiers]);
                        }
                    }
                }
                if (migrationValues.length) {
                    // apply migrations
                    await Promise.allSettled(migrationValues.map(async ([[key, value], overrideIdentifiers]) => this.configurationService.updateValue(key, value.value, { resource, overrideIdentifiers }, target)));
                }
            }
        }
        async runMigration(migration, dataKey, value, resource, overrideIdentifiers) {
            const valueAccessor = (key) => {
                const inspectData = this.configurationService.inspect(key, { resource });
                const inspectValue = inspectData[dataKey];
                if (!inspectValue) {
                    return undefined;
                }
                if (!overrideIdentifiers) {
                    return inspectValue.value;
                }
                return inspectValue.overrides?.find(({ identifiers }) => (0, objects_1.equals)(identifiers, overrideIdentifiers))?.value;
            };
            const result = await migration.migrateFn(value, valueAccessor);
            return Array.isArray(result) ? result : [[migration.key, result]];
        }
    };
    exports.ConfigurationMigrationWorkbenchContribution = ConfigurationMigrationWorkbenchContribution;
    exports.ConfigurationMigrationWorkbenchContribution = ConfigurationMigrationWorkbenchContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ConfigurationMigrationWorkbenchContribution);
    let DynamicWorkbenchSecurityConfiguration = class DynamicWorkbenchSecurityConfiguration extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.dynamicWorkbenchSecurityConfiguration'; }
        constructor(remoteAgentService) {
            super();
            this.remoteAgentService = remoteAgentService;
            this._ready = new async_1.DeferredPromise();
            this.ready = this._ready.p;
            this.create();
        }
        async create() {
            try {
                await this.doCreate();
            }
            finally {
                this._ready.complete();
            }
        }
        async doCreate() {
            if (!platform_2.isWindows) {
                const remoteEnvironment = await this.remoteAgentService.getEnvironment();
                if (remoteEnvironment?.os !== 1 /* OperatingSystem.Windows */) {
                    return;
                }
            }
            // Windows: UNC allow list security configuration
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            registry.registerConfiguration({
                ...exports.securityConfigurationNodeBase,
                'properties': {
                    'security.allowedUNCHosts': {
                        'type': 'array',
                        'items': {
                            'type': 'string',
                            'pattern': '^[^\\\\]+$',
                            'patternErrorMessage': (0, nls_1.localize)('security.allowedUNCHosts.patternErrorMessage', 'UNC host names must not contain backslashes.')
                        },
                        'default': [],
                        'markdownDescription': (0, nls_1.localize)('security.allowedUNCHosts', 'A set of UNC host names (without leading or trailing backslash, for example `192.168.0.1` or `my-server`) to allow without user confirmation. If a UNC host is being accessed that is not allowed via this setting or has not been acknowledged via user confirmation, an error will occur and the operation stopped. A restart is required when changing this setting. Find out more about this setting at https://aka.ms/vscode-windows-unc.'),
                        'scope': 2 /* ConfigurationScope.MACHINE */
                    },
                    'security.restrictUNCAccess': {
                        'type': 'boolean',
                        'default': true,
                        'markdownDescription': (0, nls_1.localize)('security.restrictUNCAccess', 'If enabled, only allows access to UNC host names that are allowed by the `#security.allowedUNCHosts#` setting or after user confirmation. Find out more about this setting at https://aka.ms/vscode-windows-unc.'),
                        'scope': 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
        }
    };
    exports.DynamicWorkbenchSecurityConfiguration = DynamicWorkbenchSecurityConfiguration;
    exports.DynamicWorkbenchSecurityConfiguration = DynamicWorkbenchSecurityConfiguration = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], DynamicWorkbenchSecurityConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vY29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQm5GLFFBQUEsZ0NBQWdDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBcUI7UUFDakYsSUFBSSxFQUFFLGFBQWE7UUFDbkIsT0FBTyxFQUFFLEdBQUc7UUFDWixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsYUFBYSxDQUFDO1FBQ2pFLE1BQU0sRUFBRSxRQUFRO0tBQ2hCLENBQUMsQ0FBQztJQUVVLFFBQUEsOEJBQThCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBcUI7UUFDL0UsSUFBSSxFQUFFLFdBQVc7UUFDakIsT0FBTyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsV0FBVyxDQUFDO1FBQzdELE1BQU0sRUFBRSxRQUFRO0tBQ2hCLENBQUMsQ0FBQztJQUVVLFFBQUEsNkJBQTZCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBcUI7UUFDOUUsSUFBSSxFQUFFLFVBQVU7UUFDaEIsT0FBTyx3Q0FBZ0M7UUFDdkMsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLFVBQVUsQ0FBQztRQUMzRCxNQUFNLEVBQUUsUUFBUTtRQUNoQixPQUFPLEVBQUUsQ0FBQztLQUNWLENBQUMsQ0FBQztJQUVVLFFBQUEsNkJBQTZCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBcUI7UUFDOUUsSUFBSSxFQUFFLFVBQVU7UUFDaEIsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLFVBQVUsQ0FBQztRQUMzRCxNQUFNLEVBQUUsUUFBUTtRQUNo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