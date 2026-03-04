/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/ternarySearchTree", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, event_1, ternarySearchTree_1, configuration_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestConfigurationService = void 0;
    class TestConfigurationService {
        constructor(configuration) {
            this.onDidChangeConfigurationEmitter = new event_1.Emitter();
            this.onDidChangeConfiguration = this.onDidChangeConfigurationEmitter.event;
            this.configurationByRoot = ternarySearchTree_1.TernarySearchTree.forPaths();
            this.overrideIdentifiers = new Map();
            this.configuration = configuration || Object.create(null);
        }
        reloadConfiguration() {
            return Promise.resolve(this.getValue());
        }
        getValue(arg1, arg2) {
            let configuration;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : undefined;
            if (overrides) {
                if (overrides.resource) {
                    configuration = this.configurationByRoot.findSubstr(overrides.resource.fsPath);
                }
            }
            configuration = configuration ? configuration : this.configuration;
            if (arg1 && typeof arg1 === 'string') {
                return configuration[arg1] ?? (0, configuration_1.getConfigurationValue)(configuration, arg1);
            }
            return configuration;
        }
        updateValue(key, value) {
            return Promise.resolve(undefined);
        }
        setUserConfiguration(key, value, root) {
            if (root) {
                const configForRoot = this.configurationByRoot.get(root.fsPath) || Object.create(null);
                configForRoot[key] = value;
                this.configurationByRoot.set(root.fsPath, configForRoot);
            }
            else {
                this.configuration[key] = value;
            }
            return Promise.resolve(undefined);
        }
        setOverrideIdentifiers(key, identifiers) {
            this.overrideIdentifiers.set(key, identifiers);
        }
        inspect(key, overrides) {
            const config = this.getValue(undefined, overrides);
            return {
                value: (0, configuration_1.getConfigurationValue)(config, key),
                defaultValue: (0, configuration_1.getConfigurationValue)(config, key),
                userValue: (0, configuration_1.getConfigurationValue)(config, key),
                overrideIdentifiers: this.overrideIdentifiers.get(key)
            };
        }
        keys() {
            return {
                default: Object.keys(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()),
                user: Object.keys(this.configuration),
                workspace: [],
                workspaceFolder: []
            };
        }
        getConfigurationData() {
            return null;
        }
    }
    exports.TestConfigurationService = TestConfigurationService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvbmZpZ3VyYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29uZmlndXJhdGlvbi90ZXN0L2NvbW1vbi90ZXN0Q29uZmlndXJhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsd0JBQXdCO1FBT3BDLFlBQVksYUFBbUI7WUFIdEIsb0NBQStCLEdBQUcsSUFBSSxlQUFPLEVBQTZCLENBQUM7WUFDM0UsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLCtCQUErQixDQUFDLEtBQUssQ0FBQztZQU12RSx3QkFBbUIsR0FBbUMscUNBQWlCLENBQUMsUUFBUSxFQUFPLENBQUM7WUFxQ3hGLHdCQUFtQixHQUEwQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBeEM5RCxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFJTSxtQkFBbUI7WUFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxRQUFRLENBQUMsSUFBVSxFQUFFLElBQVU7WUFDckMsSUFBSSxhQUFhLENBQUM7WUFDbEIsTUFBTSxTQUFTLEdBQUcsSUFBQSx3Q0FBd0IsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLHdDQUF3QixFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUM1RyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN4Qixh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