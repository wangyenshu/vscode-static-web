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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/event", "vs/workbench/api/common/extHostWorkspace", "./extHost.protocol", "./extHostTypes", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/log/common/log", "vs/base/common/uri"], function (require, exports, objects_1, event_1, extHostWorkspace_1, extHost_protocol_1, extHostTypes_1, configurationModels_1, configurationRegistry_1, types_1, async_1, instantiation_1, extHostRpcService_1, log_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostConfiguration = exports.ExtHostConfigProvider = exports.ExtHostConfiguration = void 0;
    function lookUp(tree, key) {
        if (key) {
            const parts = key.split('.');
            let node = tree;
            for (let i = 0; node && i < parts.length; i++) {
                node = node[parts[i]];
            }
            return node;
        }
    }
    function isUri(thing) {
        return thing instanceof uri_1.URI;
    }
    function isResourceLanguage(thing) {
        return thing
            && thing.uri instanceof uri_1.URI
            && (thing.languageId && typeof thing.languageId === 'string');
    }
    function isLanguage(thing) {
        return thing
            && !thing.uri
            && (thing.languageId && typeof thing.languageId === 'string');
    }
    function isWorkspaceFolder(thing) {
        return thing
            && thing.uri instanceof uri_1.URI
            && (!thing.name || typeof thing.name === 'string')
            && (!thing.index || typeof thing.index === 'number');
    }
    function scopeToOverrides(scope) {
        if (isUri(scope)) {
            return { resource: scope };
        }
        if (isResourceLanguage(scope)) {
            return { resource: scope.uri, overrideIdentifier: scope.languageId };
        }
        if (isLanguage(scope)) {
            return { overrideIdentifier: scope.languageId };
        }
        if (isWorkspaceFolder(scope)) {
            return { resource: scope.uri };
        }
        if (scope === null) {
            return { resource: null };
        }
        return undefined;
    }
    let ExtHostConfiguration = class ExtHostConfiguration {
        constructor(extHostRpc, extHostWorkspace, logService) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadConfiguration);
            this._extHostWorkspace = extHostWorkspace;
            this._logService = logService;
            this._barrier = new async_1.Barrier();
            this._actual = null;
        }
        getConfigProvider() {
            return this._barrier.wait().then(_ => this._actual);
        }
        $initializeConfiguration(data) {
            this._actual = new ExtHostConfigProvider(this._proxy, this._extHostWorkspace, data, this._logService);
            this._barrier.open();
        }
        $acceptConfigurationChanged(data, change) {
            this.getConfigProvider().then(provider => provider.$acceptConfigurationChanged(data, change));
        }
    };
    exports.ExtHostConfiguration = ExtHostConfiguration;
    exports.ExtHostConfiguration = ExtHostConfiguration = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, log_1.ILogService)
    ], ExtHostConfiguration);
    class ExtHostConfigProvider {
        constructor(proxy, extHostWorkspace, data, logService) {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this._proxy = proxy;
            this._logService = logService;
            this._extHostWorkspace = extHostWorkspace;
            this._configuration = configurationModels_1.Configuration.parse(data, logService);
            this._configurationScopes = this._toMap(data.configurationScopes);
        }
        get onDidChangeConfiguration() {
            return this._onDidChangeConfiguration && this._onDidChangeConfiguration.event;
        }
        $acceptConfigurationChanged(data, change) {
            const previous = { data: this._configuration.toData(), workspace: this._extHostWorkspace.workspace };
            this._configuration = configurationModels_1.Configuration.parse(data, this._logService);
            this._configurationScopes = this._toMap(data.configurationScopes);
            this._onDidChangeConfiguration.fire(this._toConfigurationChangeEvent(change, previous));
        }
        getConfiguration(section, scope, extensionDescription) {
            const overrides = scopeToOverrides(scope) || {};
            const config = this._toReadonlyValue(section
                ? lookUp(this._configuration.getValue(undefined, overrides, this._extHostWorkspace.workspace), section)
                : this._configuration.getValue(undefined, overrides, this._extHostWorkspace.workspace));
            if (section) {
                this._validateConfigurationAccess(section, overrides, extensionDescription?.identifier);
            }
            function parseConfigurationTarget(arg) {
                if (arg === undefined || arg === null) {
                    return null;
                }
                if (typeof arg === 'boolean') {
                    return arg ? 2 /* ConfigurationTarget.USER */ : 5 /* ConfigurationTarget.WORKSPACE */;
                }
                switch (arg) {
                    case extHostTypes_1.ConfigurationTarget.Global: return 2 /* ConfigurationTarget.USER */;
                    case extHostTypes_1.ConfigurationTarget.Workspace: return 5 /* ConfigurationTarget.WORKSPACE */;
                    case extHostTypes_1.ConfigurationTarget.WorkspaceFolder: return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            const result = {
                has(key) {
                    return typeof lookUp(config, key) !== 'undefined';
                },
                get: (key, defaultValue) => {
                    this._validateConfigurationAccess(section ? `${section}.${key}` : key, overrides, extensionDescription?.identifier);
                    let result = lookUp(config, key);
                    if (typeof result === 'undefined') {
                        result = defaultValue;
                    }
                    else {
                        let clonedConfig = undefined;
                        const cloneOnWriteProxy = (target, accessor) => {
                            if ((0, types_1.isObject)(target)) {
                                let clonedTarget = undefined;
                                const cloneTarget = () => {
                                    clonedConfig = clonedConfig ? clonedConfig : (0, objects_1.deepClone)(config);
                                    clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                                };
                                return new Proxy(target, {
                                    get: (target, property) => {
                                        if (typeof property === 'string' && property.toLowerCase() === 'tojson') {
                                            cloneTarget();
                                            return () => clonedTarget;
                                        }
                                        if (clonedConfig) {
                                            clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                                            return clonedTarget[property];
                                        }
                                        const result = target[property];
                                        if (typeof property === 'string') {
                                            return cloneOnWriteProxy(result, `${accessor}.${property}`);
                                        }
                                        return result;
                                    },
                                    set: (_target, property, value) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            clonedTarget[property] = value;
                                        }
                                        return true;
                                    },
                                    deleteProperty: (_target, property) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            delete clonedTarget[property];
                                        }
                                        return true;
                                    },
                                    defineProperty: (_target, property, descriptor) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            Object.defineProperty(clonedTarget, property, descriptor);
                                        }
                                        return true;
                                    }
                                });
                            }
                            if (Array.isArray(target)) {
                                return (0, objects_1.deepClone)(target);
                            }
                            return target;
                        };
                        result = cloneOnWriteProxy(result, key);
                    }
                    return result;
                },
                update: (key, value, extHostConfigurationTarget, scopeToLanguage) => {
                    key = section ? `${section}.${key}` : key;
                    const target = parseConfigurationTarget(extHostConfigurationTarget);
                    if (value !== undefined) {
                        return this._proxy.$updateConfigurationOption(target, key, value, overrides, scopeToLanguage);
                    }
                    else {
                        return this._proxy.$removeConfigurationOption(target, key, overrides, scopeToLanguage);
                    }
                },
                inspect: (key) => {
                    key = section ? `${section}.${key}` : key;
                    const config = this._configuration.inspect(key, overrides, this._extHostWorkspace.workspace);
                    if (config) {
                        return {
                            key,
                            defaultValue: (0, objects_1.deepClone)(config.policy?.value ?? config.default?.value),
                            globalValue: (0, objects_1.deepClone)(config.user?.value ?? config.application?.value),
                            workspaceValue: (0, objects_1.deepClone)(config.workspace?.value),
                            workspaceFolderValue: (0, objects_1.deepClone)(config.workspaceFolder?.value),
                            defaultLanguageValue: (0, objects_1.deepClone)(config.default?.override),
                            globalLanguageValue: (0, objects_1.deepClone)(config.user?.override ?? config.application?.override),
                            workspaceLanguageValue: (0, objects_1.deepClone)(config.workspace?.override),
                            workspaceFolderLanguageValue: (0, objects_1.deepClone)(config.workspaceFolder?.override),
                            languageIds: (0, objects_1.deepClone)(config.overrideIdentifiers)
                        };
                    }
                    return undefined;
                }
            };
            if (typeof config === 'object') {
                (0, objects_1.mixin)(result, config, false);
            }
            return Object.freeze(result);
        }
        _toReadonlyValue(result) {
            const readonlyProxy = (target) => {
                return (0, types_1.isObject)(target) ?
                    new Proxy(target, {
                        get: (target, property) => readonlyProxy(target[property]),
                        set: (_target, property, _value) => { throw new Error(`TypeError: Cannot assign to read only property '${String(property)}' of object`); },
                        deleteProperty: (_target, property) => { throw new Error(`TypeError: Cannot delete read only property '${String(property)}' of object`); },
                        defineProperty: (_target, property) => { throw new Error(`TypeError: Cannot define property '${String(property)}' for a readonly object`); },
                        setPrototypeOf: (_target) => { throw new Error(`TypeError: Cannot set prototype for a readonly object`); },
                        isExtensible: () => false,
                        preventExtensions: () => true
                    }) : target;
            };
            return readonlyProxy(result);
        }
        _validateConfigurationAccess(key, overrides, extensionId) {
            const scope = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) ? 4 /* ConfigurationScope.RESOURCE */ : this._configurationScopes.get(key);
            const extensionIdText = extensionId ? `[${extensionId.value}] ` : '';
            if (4 /* ConfigurationScope.RESOURCE */ === scope) {
                if (typeof overrides?.resource === 'undefined') {
                    this._logService.warn(`${extensionIdText}Accessing a resource scoped configuration without providing a resource is not expected. To get the effective value for '${key}', provide the URI of a resource or 'null' for any resource.`);
                }
                return;
            }
            if (3 /* ConfigurationScope.WINDOW */ === scope) {
                if (overrides?.resource) {
                    this._logService.warn(`${extensionIdText}Accessing a window scoped configuration for a resource is not expected. To associate '${key}' to a resource, define its scope to 'resource' in configuration contributions in 'package.json'.`);
                }
                return;
            }
        }
        _toConfigurationChangeEvent(change, previous) {
            const event = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this._extHostWorkspace.workspace, this._logService);
            return Object.freeze({
                affectsConfiguration: (section, scope) => event.affectsConfiguration(section, scopeToOverrides(scope))
            });
        }
        _toMap(scopes) {
            return scopes.reduce((result, scope) => { result.set(scope[0], scope[1]); return result; }, new Map());
        }
    }
    exports.ExtHostConfigProvider = ExtHostConfigProvider;
    exports.IExtHostConfiguration = (0, instantiation_1.createDecorator)('IExtHostConfiguration');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLFNBQVMsTUFBTSxDQUFDLElBQVMsRUFBRSxHQUFXO1FBQ3JDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDVCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztZQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0lBQ0YsQ0FBQztJQWtCRCxTQUFTLEtBQUssQ0FBQyxLQUFVO1FBQ3hCLE9BQU8sS0FBSyxZQUFZLFNBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxLQUFVO1FBQ3JDLE9BQU8sS0FBSztlQUNSLEtBQUssQ0FBQyxHQUFHLFlBQVksU0FBRztlQUN4QixDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksT0FBTyxLQUFLLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBQyxLQUFVO1FBQzdCLE9BQU8sS0FBSztlQUNSLENBQUMsS0FBSyxDQUFDLEdBQUc7ZUFDVixDQUFDLEtBQUssQ0FBQyxVQUFV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