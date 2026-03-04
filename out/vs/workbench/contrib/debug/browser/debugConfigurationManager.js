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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/themables", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSchemas", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/history/common/history", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, json, lifecycle_1, objects, resources, themables_1, uri_1, nls, configuration_1, contextkey_1, files_1, instantiation_1, jsonContributionRegistry_1, quickInput_1, platform_1, storage_1, uriIdentity_1, workspace_1, debugIcons_1, debug_1, debugSchemas_1, debugUtils_1, configuration_2, editorService_1, extensions_1, history_1, preferences_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationManager = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
    const DEBUG_SELECTED_CONFIG_NAME_KEY = 'debug.selectedconfigname';
    const DEBUG_SELECTED_ROOT = 'debug.selectedroot';
    // Debug type is only stored if a dynamic configuration is used for better restore
    const DEBUG_SELECTED_TYPE = 'debug.selectedtype';
    const DEBUG_RECENT_DYNAMIC_CONFIGURATIONS = 'debug.recentdynamicconfigurations';
    let ConfigurationManager = class ConfigurationManager {
        constructor(adapterManager, contextService, configurationService, quickInputService, instantiationService, storageService, extensionService, historyService, uriIdentityService, contextKeyService) {
            this.adapterManager = adapterManager;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.historyService = historyService;
            this.uriIdentityService = uriIdentityService;
            this.getSelectedConfig = () => Promise.resolve(undefined);
            this.selectedDynamic = false;
            this._onDidSelectConfigurationName = new event_1.Emitter();
            this._onDidChangeConfigurationProviders = new event_1.Emitter();
            this.onDidChangeConfigurationProviders = this._onDidChangeConfigurationProviders.event;
            this.configProviders = [];
            this.toDispose = [this._onDidChangeConfigurationProviders];
            this.initLaunches();
            this.setCompoundSchemaValues();
            this.registerListeners();
            const previousSelectedRoot = this.storageService.get(DEBUG_SELECTED_ROOT, 1 /* StorageScope.WORKSPACE */);
            const previousSelectedType = this.storageService.get(DEBUG_SELECTED_TYPE, 1 /* StorageScope.WORKSPACE */);
            const previousSelectedLaunch = this.launches.find(l => l.uri.toString() === previousSelectedRoot);
            const previousSelectedName = this.storageService.get(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* StorageScope.WORKSPACE */);
            this.debugConfigurationTypeContext = debug_1.CONTEXT_DEBUG_CONFIGURATION_TYPE.bindTo(contextKeyService);
            const dynamicConfig = previousSelectedType ? { type: previousSelectedType } : undefined;
            if (previousSelectedLaunch && previousSelectedLaunch.getConfigurationNames().length) {
                this.selectConfiguration(previousSelectedLaunch, previousSelectedName, undefined, dynamicConfig);
            }
            else if (this.launches.length > 0) {
                this.selectConfiguration(undefined, previousSelectedName, undefined, dynamicConfig);
            }
        }
        registerDebugConfigurationProvider(debugConfigurationProvider) {
            this.configProviders.push(debugConfigurationProvider);
            this._onDidChangeConfigurationProviders.fire();
            return {
                dispose: () => {
                    this.unregisterDebugConfigurationProvider(debugConfigurationProvider);
                    this._onDidChangeConfigurationProviders.fire();
                }
            };
        }
        unregisterDebugConfigurationProvider(debugConfigurationProvider) {
            const ix = this.configProviders.indexOf(debugConfigurationProvider);
            if (ix >= 0) {
                this.configProviders.splice(ix, 1);
            }
        }
        /**
         * if scope is not specified,a value of DebugConfigurationProvideTrigger.Initial is assumed.
         */
        hasDebugConfigurationProvider(debugType, triggerKind) {
            if (triggerKind === undefined) {
                triggerKind = debug_1.DebugConfigurationProviderTriggerKind.Initial;
            }
            // check if there are providers for the given type that contribute a provideDebugConfigurations method
            const provider = this.configProviders.find(p => p.provideDebugConfigurations && (p.type === debugType) && (p.triggerKind === triggerKind));
            return !!provider;
        }
        async resolveConfigurationByProviders(folderUri, type, config, token) {
            const resolveDebugConfigurationForType = async (type, config) => {
                if (type !== '*') {
                    await this.adapterManager.activateDebuggers('onDebugResolve', type);
                }
                for (const p of this.configProviders) {
                    if (p.type === type && p.resolveDebugConfiguration && config) {
                        config = await p.resolveDebugConfiguration(folderUri, config, token);
                    }
                }
                return config;
            };
            let resolvedType = config.type ?? type;
            let result = config;
            for (let seen = new Set(); result && !seen.has(resolvedType);) {
                seen.add(resolvedType);
                result = await resolveDebugConfigurationForType(resolvedType, result);
                result = await resolveDebugConfigurationForType('*', result);
                resolvedType = result?.type ?? type;
            }
            return result;
        }
        async resolveDebugConfigurationWithSubstitutedVariables(folderUri, type, config, token) {
            // pipe the config through the promises sequentially. Append at the end the '*' types
            const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfigurationWithSubstitutedVariables)
                .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfigurationWithSubstitutedVariables));
            let result = config;
            await (0, async_1.sequence)(providers.map(provider => async () => {
                // If any provider returned undefined or null make sure to respect that and do not pass the result to more resolver
                if (result) {
                    result = await provider.resolveDebugConfigurationWithSubstitutedVariables(folderUri, result, token);
                }
            }));
            return result;
        }
        async provideDebugConfigurations(folderUri, type, token) {
            await this.adapterManager.activateDebuggers('onDebugInitialConfigurations');
            const results = await Promise.all(this.configProviders.filter(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Initial && p.provideDebugConfigurations).map(p => p.provideDebugConfigurations(folderUri, token)));
            return results.reduce((first, second) => first.concat(second), []);
        }
        async getDynamicProviders() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const onDebugDynamicConfigurationsName = 'onDebugDynamicConfigurations';
            const debugDynamicExtensionsTypes = this.extensionService.extensions.reduce((acc, e) => {
                if (!e.activationEvents) {
                    return acc;
                }
                const explicitTypes = [];
                let hasGenericEvent = false;
                for (const event of e.activationEvents) {
                    if (event === onDebugDynamicConfigurationsName) {
                        hasGenericEvent = true;
                    }
                    else if (event.startsWith(`${onDebugDynamicConfigurationsName}:`)) {
                        explicitTypes.push(event.slice(onDebugDynamicConfigurationsName.length + 1));
                    }
                }
                if (explicitTypes.length) {
                    explicitTypes.forEach(t => acc.add(t));
                }
                else if (hasGenericEvent) {
                    const debuggerType = e.contributes?.debuggers?.[0].type;
                    if (debuggerType) {
                        acc.add(debuggerType);
                    }
                }
                return acc;
            }, new Set());
            for (const configProvider of this.configProviders) {
                if (configProvider.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic) {
                    debugDynamicExtensionsTypes.add(configProvider.type);
                }
            }
            return [...debugDynamicExtensionsTypes].map(type => {
                return {
                    label: this.adapterManager.getDebuggerLabel(type),
                    getProvider: async () => {
                        await this.adapterManager.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        return this.configProviders.find(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations);
                    },
                    type,
                    pick: async () => {
                        // Do a late 'onDebugDynamicConfigurationsName' activation so extensions are not activated too early #108578
                        await this.adapterManager.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        const token = new cancellation_1.CancellationTokenSource();
                        const picks = [];
                        const provider = this.configProviders.find(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations);
                        this.getLaunches().forEach(launch => {
                            if (launch.workspace && provider) {
                                picks.push(provider.provideDebugConfigurations(launch.workspace.uri, token.token).then(configurations => configurations.map(config => ({
                                    label: config.name,
                                    description: launch.name,
                                    config,
                                    buttons: [{
                                            iconClass: themables_1.ThemeIcon.asClassName(debugIcons_1.debugConfigure),
                                            tooltip: nls.localize('editLaunchConfig', "Edit Debug Configuration in launch.json")
                                        }],
                                    launch
                                }))));
                            }
                        });
                        const disposables = new lifecycle_1.DisposableStore();
                        const input = disposables.add(this.quickInputService.createQuickPick());
                        input.busy = true;
                        input.placeholder = nls.localize('selectConfiguration', "Select Launch Configuration");
                        const chosenPromise = new Promise(resolve => {
                            disposables.add(input.onDidAccept(() => resolve(input.activeItems[0])));
                            disposables.add(input.onDidTriggerItemButton(async (context) => {
                                resolve(undefined);
                                const { launch, config } = context.item;
                                await launch.openConfigFile({ preserveFocus: false, type: config.type, suppressInitialConfigs: true });
                                // Only Launch have a pin trigger button
                                await launch.writeConfiguration(config);
                                await this.selectConfiguration(launch, config.name);
                                this.removeRecentDynamicConfigurations(config.name, config.type);
                            }));
                            disposables.add(input.onDidHide(() => resolve(undefined)));
                        });
                        const nestedPicks = await Promise.all(picks);
                        const items = (0, arrays_1.flatten)(nestedPicks);
                        input.items = items;
                        input.busy = false;
                        input.show();
                        const chosen = await chosenPromise;
                        disposables.dispose();
                        if (!chosen) {
                            // User canceled quick input we should notify the provider to cancel computing configurations
                            token.cancel();
                            return;
                        }
                        return chosen;
                    }
                };
            });
        }
        getAllConfigurations() {
            const all = [];
            for (const l of this.launches) {
                for (const name of l.getConfigurationNames()) {
                    const config = l.getConfiguration(name) || l.getCompound(name);
                    if (config) {
                        all.push({ launch: l, name, presentation: config.presentation });
                    }
                }
            }
            return (0, debugUtils_1.getVisibleAndSorted)(all);
        }
        removeRecentDynamicConfigurations(name, type) {
            const remaining = this.getRecentDynamicConfigurations().filter(c => c.name !== name || c.type !== type);
            this.storageService.store(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, JSON.stringify(remaining), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            if (this.selectedConfiguration.name === name && this.selectedType === type && this.selectedDynamic) {
                this.selectConfiguration(undefined, undefined);
            }
            else {
                this._onDidSelectConfigurationName.fire();
            }
        }
        getRecentDynamicConfigurations() {
            return JSON.parse(this.storageService.get(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, 1 /* StorageScope.WORKSPACE */, '[]'));
        }
        registerListeners() {
            this.toDispose.push(event_1.Event.any(this.contextService.onDidChangeWorkspaceFolders, this.contextService.onDidChangeWorkbenchState)(() => {
                this.initLaunches();
                this.selectConfiguration(undefined);
                this.setCompoundSchemaValues();
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('launch')) {
                    // A change happen in the launch.json. If there is already a launch configuration selected, do not change the selection.
                    await this.selectConfiguration(undefined);
                    this.setCompoundSchemaValues();
                }
            }));
            this.toDispose.push(this.adapterManager.onDidDebuggersExtPointRead(() => {
                this.setCompoundSchemaValues();
            }));
        }
        initLaunches() {
            this.launches = this.contextService.getWorkspace().folders.map(folder => this.instantiationService.createInstance(Launch, this, this.adapterManager, folder));
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                this.launches.push(this.instantiationService.createInstance(WorkspaceLaunch, this, this.adapterManager));
            }
            this.launches.push(this.instantiationService.createInstance(UserLaunch, this, this.adapterManager));
            if (this.selectedLaunch && this.launches.indexOf(this.selectedLaunch) === -1) {
                this.selectConfiguration(undefined);
            }
        }
        setCompoundSchemaValues() {
            const compoundConfigurationsSchema = debugSchemas_1.launchSchema.properties['compounds'].items.properties['configurations'];
            const launchNames = this.launches.map(l => l.getConfigurationNames(true)).reduce((first, second) => first.concat(second), []);
            compoundConfigurationsSchema.items.oneOf[0].enum = launchNames;
            compoundConfigurationsSchema.items.oneOf[1].properties.name.enum = launchNames;
            const folderNames = this.contextService.getWorkspace().folders.map(f => f.name);
            compoundConfigurationsSchema.items.oneOf[1].properties.folder.enum = folderNames;
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        getLaunches() {
            return this.launches;
        }
        getLaunch(workspaceUri) {
            if (!uri_1.URI.isUri(workspaceUri)) {
                return undefined;
            }
            return this.launches.find(l => l.workspace && this.uriIdentityService.extUri.isEqual(l.workspace.uri, workspaceUri));
        }
        get selectedConfiguration() {
            return {
                launch: this.selectedLaunch,
                name: this.selectedName,
                getConfig: this.getSelectedConfig,
                type: this.selectedType
            };
        }
        get onDidSelectConfiguration() {
            return this._onDidSelectConfigurationName.event;
        }
        getWorkspaceLaunch() {
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                return this.launches[this.launches.length - 1];
            }
            return undefined;
        }
        async selectConfiguration(launch, name, config, dynamicConfig) {
            if (typeof launch === 'undefined') {
                const rootUri = this.historyService.getLastActiveWorkspaceRoot();
                launch = this.getLaunch(rootUri);
                if (!launch || launch.getConfigurationNames().length === 0) {
                    launch = this.launches.find(l => !!(l && l.getConfigurationNames().length)) || launch || this.launches[0];
                }
            }
            const previousLaunch = this.selectedLaunch;
            const previousName = this.selectedName;
            const previousSelectedDynamic = this.selectedDynamic;
            this.selectedLaunch = launch;
            if (this.selectedLaunch) {
                this.storageService.store(DEBUG_SELECTED_ROOT, this.selectedLaunch.uri.toString(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_ROOT, 1 /* StorageScope.WORKSPACE */);
            }
            const names = launch ? launch.getConfigurationNames() : [];
            this.getSelectedConfig = () => {
                const selected = this.selectedName ? launch?.getConfiguration(this.selectedName) : undefined;
                return Promise.resolve(selected || config);
            };
            let type = config?.type;
            if (name && names.indexOf(name) >= 0) {
                this.setSelectedLaunchName(name);
            }
            else if (dynamicConfig && dynamicConfig.type) {
                // We could not find the previously used name and config is not passed. We should get all dynamic configurations from providers
                // And potentially auto select the previously used dynamic configuration #96293
                type = dynamicConfig.type;
                if (!config) {
                    const providers = (await this.getDynamicProviders()).filter(p => p.type === type);
                    this.getSelectedConfig = async () => {
                        const activatedProviders = await Promise.all(providers.map(p => p.getProvider()));
                        const provider = activatedProviders.length > 0 ? activatedProviders[0] : undefined;
                        if (provider && launch && launch.workspace) {
                            const token = new cancellation_1.CancellationTokenSource();
                            const dynamicConfigs = await provider.provideDebugConfigurations(launch.workspace.uri, token.token);
                            const dynamicConfig = dynamicConfigs.find(c => c.name === name);
                            if (dynamicConfig) {
                                return dynamicConfig;
                            }
                        }
                        return undefined;
                    };
                }
                this.setSelectedLaunchName(name);
                let recentDynamicProviders = this.getRecentDynamicConfigurations();
                if (name && dynamicConfig.type) {
                    // We need to store the recently used dynamic configurations to be able to show them in UI #110009
                    recentDynamicProviders.unshift({ name, type: dynamicConfig.type });
                    recentDynamicProviders = (0, arrays_1.distinct)(recentDynamicProviders, t => `${t.name} : ${t.type}`);
                    this.storageService.store(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, JSON.stringify(recentDynamicProviders), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            }
            else if (!this.selectedName || names.indexOf(this.selectedName) === -1) {
                // We could not find the configuration to select, pick the first one, or reset the selection if there is no launch configuration
                const nameToSet = names.length ? names[0] : undefined;
                this.setSelectedLaunchName(nameToSet);
            }
            if (!config && launch && this.selectedName) {
                config = launch.getConfiguration(this.selectedName);
                type = config?.type;
            }
            this.selectedType = dynamicConfig?.type || config?.type;
            this.selectedDynamic = !!dynamicConfig;
            // Only store the selected type if we are having a dynamic configuration. Otherwise restoring this configuration from storage might be misindentified as a dynamic configuration
            this.storageService.store(DEBUG_SELECTED_TYPE, dynamicConfig ? this.selectedType : undefined, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            if (type) {
                this.debugConfigurationTypeContext.set(type);
            }
            else {
                this.debugConfigurationTypeContext.reset();
            }
            if (this.selectedLaunch !== previousLaunch || this.selectedName !== previousName || previousSelectedDynamic !== this.selectedDynamic) {
                this._onDidSelectConfigurationName.fire();
            }
        }
        setSelectedLaunchName(selectedName) {
            this.selectedName = selectedName;
            if (this.selectedName) {
                this.storageService.store(DEBUG_SELECTED_CONFIG_NAME_KEY, this.selectedName, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
        dispose() {
            this.toDispose = (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.ConfigurationManager = ConfigurationManager;
    exports.ConfigurationManager = ConfigurationManager = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService),
        __param(7, history_1.IHistoryService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, contextkey_1.IContextKeyService)
    ], ConfigurationManager);
    class AbstractLaunch {
        constructor(configurationManager, adapterManager) {
            this.configurationManager = configurationManager;
            this.adapterManager = adapterManager;
        }
        getCompound(name) {
            const config = this.getConfig();
            if (!config || !config.compounds) {
                return undefined;
            }
            return config.compounds.find(compound => compound.name === name);
        }
        getConfigurationNames(ignoreCompoundsAndPresentation = false) {
            const config = this.getConfig();
            if (!config || (!Array.isArray(config.configurations) && !Array.isArray(config.compounds))) {
                return [];
            }
            else {
                const configurations = [];
                if (config.configurations) {
                    configurations.push(...config.configurations.filter(cfg => cfg && typeof cfg.name === 'string'));
                }
                if (ignoreCompoundsAndPresentation) {
                    return configurations.map(c => c.name);
                }
                if (config.compounds) {
                    configurations.push(...config.compounds.filter(compound => typeof compound.name === 'string' && compound.configurations && compound.configurations.length));
                }
                return (0, debugUtils_1.getVisibleAndSorted)(configurations).map(c => c.name);
            }
        }
        getConfiguration(name) {
            // We need to clone the configuration in order to be able to make changes to it #42198
            const config = objects.deepClone(this.getConfig());
            if (!config || !config.configurations) {
                return undefined;
            }
            const configuration = config.configurations.find(config => config && config.name === name);
            if (configuration) {
                if (this instanceof UserLaunch) {
                    configuration.__configurationTarget = 2 /* ConfigurationTarget.USER */;
                }
                else if (this instanceof WorkspaceLaunch) {
                    configuration.__configurationTarget = 5 /* ConfigurationTarget.WORKSPACE */;
                }
                else {
                    configuration.__configurationTarget = 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            return configuration;
        }
        async getInitialConfigurationContent(folderUri, type, useInitialConfigs, token) {
            let content = '';
            const adapter = type ? this.adapterManager.getEnabledDebugger(type) : await this.adapterManager.guessDebugger(true);
            if (adapter) {
                const initialConfigs = useInitialConfigs ?
                    await this.configurationManager.provideDebugConfigurations(folderUri, adapter.type, token || cancellation_1.CancellationToken.None) :
                    [];
                content = await adapter.getInitialConfigurationContent(initialConfigs);
            }
            return content;
        }
        get hidden() {
            return false;
        }
    }
    let Launch = class Launch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, workspace, fileService, textFileService, editorService, configurationService) {
            super(configurationManager, adapterManager);
            this.workspace = workspace;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        get uri() {
            return resources.joinPath(this.workspace.uri, '/.vscode/launch.json');
        }
        get name() {
            return this.workspace.name;
        }
        getConfig() {
            return this.configurationService.inspect('launch', { resource: this.workspace.uri }).workspaceFolderValue;
        }
        async openConfigFile({ preserveFocus, type, suppressInitialConfigs }, token) {
            const resource = this.uri;
            let created = false;
            let content = '';
            try {
                const fileContent = await this.fileService.readFile(resource);
                content = fileContent.value.toString();
            }
            catch {
                // launch.json not found: create one by collecting launch configs from debugConfigProviders
                content = await this.getInitialConfigurationContent(this.workspace.uri, type, !suppressInitialConfigs, token);
                if (!content) {
                    // Cancelled
                    return { editor: null, created: false };
                }
                created = true; // pin only if config file is created #8727
                try {
                    await this.textFileService.write(resource, content);
                }
                catch (error) {
                    throw new Error(nls.localize('DebugConfig.failed', "Unable to create 'launch.json' file inside the '.vscode' folder ({0}).", error.message));
                }
            }
            const index = content.indexOf(`"${this.configurationManager.selectedConfiguration.name}"`);
            let startLineNumber = 1;
            for (let i = 0; i < index; i++) {
                if (content.charAt(i) === '\n') {
                    startLineNumber++;
                }
            }
            const selection = startLineNumber > 1 ? { startLineNumber, startColumn: 4 } : undefined;
            const editor = await this.editorService.openEditor({
                resource,
                options: {
                    selection,
                    preserveFocus,
                    pinned: created,
                    revealIfVisible: true
                },
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: editor ?? null,
                created
            });
        }
        async writeConfiguration(configuration) {
            const fullConfig = objects.deepClone(this.getConfig());
            if (!fullConfig.configurations) {
                fullConfig.configurations = [];
            }
            fullConfig.configurations.push(configuration);
            await this.configurationService.updateValue('launch', fullConfig, { resource: this.workspace.uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
        }
    };
    Launch = __decorate([
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService)
    ], Launch);
    let WorkspaceLaunch = class WorkspaceLaunch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, editorService, configurationService, contextService) {
            super(configurationManager, adapterManager);
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.contextService = contextService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.contextService.getWorkspace().configuration;
        }
        get name() {
            return nls.localize('workspace', "workspace");
        }
        getConfig() {
            return this.configurationService.inspect('launch').workspaceValue;
        }
        async openConfigFile({ preserveFocus, type, useInitialConfigs }, token) {
            const launchExistInFile = !!this.getConfig();
            if (!launchExistInFile) {
                // Launch property in workspace config not found: create one by collecting launch configs from debugConfigProviders
                const content = await this.getInitialConfigurationContent(undefined, type, useInitialConfigs, token);
                if (content) {
                    await this.configurationService.updateValue('launch', json.parse(content), 5 /* ConfigurationTarget.WORKSPACE */);
                }
                else {
                    return { editor: null, created: false };
                }
            }
            const editor = await this.editorService.openEditor({
                resource: this.contextService.getWorkspace().configuration,
                options: { preserveFocus }
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: editor ?? null,
                created: false
            });
        }
    };
    WorkspaceLaunch = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], WorkspaceLaunch);
    let UserLaunch = class UserLaunch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, configurationService, preferencesService) {
            super(configurationManager, adapterManager);
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.preferencesService.userSettingsResource;
        }
        get name() {
            return nls.localize('user settings', "user settings");
        }
        get hidden() {
            return true;
        }
        getConfig() {
            return this.configurationService.inspect('launch').userValue;
        }
        async openConfigFile({ preserveFocus, type, useInitialContent }) {
            const editor = await this.preferencesService.openUserSettings({ jsonEditor: true, preserveFocus, revealSetting: { key: 'launch' } });
            return ({
                editor: editor ?? null,
                created: false
            });
        }
    };
    UserLaunch = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, preferences_1.IPreferencesService)
    ], UserLaunch);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb25maWd1cmF0aW9uTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdDb25maWd1cmF0aW9uTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQ2hHLE1BQU0sWUFBWSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUE0QixxQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDN0YsWUFBWSxDQUFDLGNBQWMsQ0FBQyw4QkFBYyxFQUFFLDJCQUFZLENBQUMsQ0FBQztJQUUxRCxNQUFNLDhCQUE4QixHQUFHLDBCQUEwQixDQUFDO0lBQ2xFLE1BQU0sbUJBQW1CLEdBQUcsb0JBQW9CLENBQUM7SUFDakQsa0ZBQWtGO0lBQ2xGLE1BQU0sbUJBQW1CLEdBQUcsb0JBQW9CLENBQUM7SUFDakQsTUFBTSxtQ0FBbUMsR0FBRyxtQ0FBbUMsQ0FBQztJQUl6RSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjtRQWNoQyxZQUNrQixjQUErQixFQUN0QixjQUF5RCxFQUM1RCxvQkFBNEQsRUFDL0QsaUJBQXNELEVBQ25ELG9CQUE0RCxFQUNsRSxjQUFnRCxFQUM5QyxnQkFBb0QsRUFDdEQsY0FBZ0QsRUFDNUMsa0JBQXdELEVBQ3pELGlCQUFxQztZQVR4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDTCxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixn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