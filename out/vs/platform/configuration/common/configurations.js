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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/types", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/platform/policy/common/policy", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, event_1, lifecycle_1, objects_1, types_1, configurationModels_1, configurationRegistry_1, log_1, policy_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PolicyConfiguration = exports.NullPolicyConfiguration = exports.DefaultConfiguration = void 0;
    class DefaultConfiguration extends lifecycle_1.Disposable {
        get configurationModel() {
            return this._configurationModel;
        }
        constructor(logService) {
            super();
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
        }
        async initialize() {
            this.resetConfigurationModel();
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(({ properties, defaultsOverrides }) => this.onDidUpdateConfiguration(Array.from(properties), defaultsOverrides)));
            return this.configurationModel;
        }
        reload() {
            this.resetConfigurationModel();
            return this.configurationModel;
        }
        onDidUpdateConfiguration(properties, defaultsOverrides) {
            this.updateConfigurationModel(properties, platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties());
            this._onDidChangeConfiguration.fire({ defaults: this.configurationModel, properties });
        }
        getConfigurationDefaultOverrides() {
            return {};
        }
        resetConfigurationModel() {
            this._configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
            const properties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            this.updateConfigurationModel(Object.keys(properties), properties);
        }
        updateConfigurationModel(properties, configurationProperties) {
            const configurationDefaultsOverrides = this.getConfigurationDefaultOverrides();
            for (const key of properties) {
                const defaultOverrideValue = configurationDefaultsOverrides[key];
                const propertySchema = configurationProperties[key];
                if (defaultOverrideValue !== undefined) {
                    this._configurationModel.addValue(key, defaultOverrideValue);
                }
                else if (propertySchema) {
                    this._configurationModel.addValue(key, propertySchema.default);
                }
                else {
                    this._configurationModel.removeValue(key);
                }
            }
        }
    }
    exports.DefaultConfiguration = DefaultConfiguration;
    class NullPolicyConfiguration {
        constructor() {
            this.onDidChangeConfiguration = event_1.Event.None;
            this.configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService());
        }
        async initialize() { return this.configurationModel; }
    }
    exports.NullPolicyConfiguration = NullPolicyConfiguration;
    let PolicyConfiguration = class PolicyConfiguration extends lifecycle_1.Disposable {
        get configurationModel() { return this._configurationModel; }
        constructor(defaultConfiguration, policyService, logService) {
            super();
            this.defaultConfiguration = defaultConfiguration;
            this.policyService = policyService;
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
        }
        async initialize() {
            this.logService.trace('PolicyConfiguration#initialize');
            this.update(await this.updatePolicyDefinitions(this.defaultConfiguration.configurationModel.keys), false);
            this._register(this.policyService.onDidChange(policyNames => this.onDidChangePolicies(policyNames)));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(async ({ properties }) => this.update(await this.updatePolicyDefinitions(properties), true)));
            return this._configurationModel;
        }
        async updatePolicyDefinitions(properties) {
            this.logService.trace('PolicyConfiguration#updatePolicyDefinitions', properties);
            const policyDefinitions = {};
            const keys = [];
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const key of properties) {
                const config = configurationProperties[key];
                if (!config) {
                    // Config is removed. So add it to the list if in case it was registered as policy before
                    keys.push(key);
                    continue;
                }
                if (config.policy) {
                    if (config.type !== 'string' && config.type !== 'number') {
                        this.logService.warn(`Policy ${config.policy.name} has unsupported type ${config.type}`);
                        continue;
                    }
                    keys.push(key);
                    policyDefinitions[config.policy.name] = { type: config.type };
                }
            }
            if (!(0, types_1.isEmptyObject)(policyDefinitions)) {
                await this.policyService.updatePolicyDefinitions(policyDefinitions);
            }
            return keys;
        }
        onDidChangePolicies(policyNames) {
            this.logService.trace('PolicyConfiguration#onDidChangePolicies', policyNames);
            const policyConfigurations = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getPolicyConfigurations();
            const keys = (0, arrays_1.coalesce)(policyNames.map(policyName => policyConfigurations.get(policyName)));
            this.update(keys, true);
        }
        update(keys, trigger) {
            this.logService.trace('PolicyConfiguration#update', keys);
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const changed = [];
            const wasEmpty = this._configurationModel.isEmpty();
            for (const key of keys) {
                const policyName = configurationProperties[key]?.policy?.name;
                if (policyName) {
                    const policyValue = this.policyService.getPolicyValue(policyName);
                    if (wasEmpty ? policyValue !== undefined : !(0, objects_1.equals)(this._configurationModel.getValue(key), policyValue)) {
                        changed.push([key, policyValue]);
                    }
                }
                else {
                    if (this._configurationModel.getValue(key) !== undefined) {
                        changed.push([key, undefined]);
                    }
                }
            }
            if (changed.length) {
                this.logService.trace('PolicyConfiguration#changed', changed);
                const old = this._configurationModel;
                this._configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
                for (const key of old.keys) {
                    this._configurationModel.setValue(key, old.getValue(key));
                }
                for (const [key, policyValue] of changed) {
                    if (policyValue === undefined) {
                        this._configurationModel.removeValue(key);
                    }
                    else {
                        this._configurationModel.setValue(key, policyValue);
                    }
                }
                if (trigger) {
                    this._onDidChangeConfiguration.fire(this._configurationModel);
                }
            }
        }
    };
    exports.PolicyConfiguration = PolicyConfiguration;
    exports.PolicyConfiguration = PolicyConfiguration = __decorate([
        __param(1, policy_1.IPolicyService),
        __param(2, log_1.ILogService)
    ], PolicyConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb25maWd1cmF0aW9uL2NvbW1vbi9jb25maWd1cmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsTUFBYSxvQkFBcUIsU0FBUSxzQkFBVTtRQU1uRCxJQUFJLGtCQUFrQjtZQUNyQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBRUQsWUFBNkIsVUFBdUI7WUFDbkQsS0FBSyxFQUFFLENBQUM7WUFEb0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQVJuQyw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwRCxDQUFDLENBQUM7WUFDMUgsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztZQUVqRSx3QkFBbUIsR0FBRyx3Q0FBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFPbkYsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hOLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFRCxNQUFN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