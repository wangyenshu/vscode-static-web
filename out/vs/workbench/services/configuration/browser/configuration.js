/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/files/common/files", "vs/platform/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/objects", "vs/base/common/hash", "vs/base/common/resources", "vs/platform/registry/common/platform", "vs/base/common/types", "vs/platform/configuration/common/configurations"], function (require, exports, event_1, errors, lifecycle_1, async_1, files_1, configurationModels_1, configurationModels_2, configuration_1, configurationRegistry_1, objects_1, hash_1, resources_1, platform_1, types_1, configurations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FolderConfiguration = exports.WorkspaceConfiguration = exports.RemoteUserConfiguration = exports.UserConfiguration = exports.ApplicationConfiguration = exports.DefaultConfiguration = void 0;
    class DefaultConfiguration extends configurations_1.DefaultConfiguration {
        static { this.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY = 'DefaultOverridesCacheExists'; }
        constructor(configurationCache, environmentService, logService) {
            super(logService);
            this.configurationCache = configurationCache;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.cachedConfigurationDefaultsOverrides = {};
            this.cacheKey = { type: 'defaults', key: 'configurationDefaultsOverrides' };
            this.updateCache = false;
            if (environmentService.options?.configurationDefaults) {
                this.configurationRegistry.registerDefaultConfigurations([{ overrides: environmentService.options.configurationDefaults }]);
            }
        }
        getConfigurationDefaultOverrides() {
            return this.cachedConfigurationDefaultsOverrides;
        }
        async initialize() {
            await this.initializeCachedConfigurationDefaultsOverrides();
            return super.initialize();
        }
        reload() {
            this.updateCache = true;
            this.cachedConfigurationDefaultsOverrides = {};
            this.updateCachedConfigurationDefaultsOverrides();
            return super.reload();
        }
        hasCachedConfigurationDefaultsOverrides() {
            return !(0, types_1.isEmptyObject)(this.cachedConfigurationDefaultsOverrides);
        }
        initializeCachedConfigurationDefaultsOverrides() {
            if (!this.initiaizeCachedConfigurationDefaultsOverridesPromise) {
                this.initiaizeCachedConfigurationDefaultsOverridesPromise = (async () => {
                    try {
                        // Read only when the cache exists
                        if (localStorage.getItem(DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY)) {
                            const content = await this.configurationCache.read(this.cacheKey);
                            if (content) {
                                this.cachedConfigurationDefaultsOverrides = JSON.parse(content);
                            }
                        }
                    }
                    catch (error) { /* ignore */ }
                    this.cachedConfigurationDefaultsOverrides = (0, types_1.isObject)(this.cachedConfigurationDefaultsOverrides) ? this.cachedConfigurationDefaultsOverrides : {};
                })();
            }
            return this.initiaizeCachedConfigurationDefaultsOverridesPromise;
        }
        onDidUpdateConfiguration(properties, defaultsOverrides) {
            super.onDidUpdateConfiguration(properties, defaultsOverrides);
            if (defaultsOverrides) {
                this.updateCachedConfigurationDefaultsOverrides();
            }
        }
        async updateCachedConfigurationDefaultsOverrides() {
            if (!this.updateCache) {
                return;
            }
            const cachedConfigurationDefaultsOverrides = {};
            const configurationDefaultsOverrides = this.configurationRegistry.getConfigurationDefaultsOverrides();
            for (const [key, value] of configurationDefaultsOverrides) {
                if (!configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) && value.value !== undefined) {
                    cachedConfigurationDefaultsOverrides[key] = value.value;
                }
            }
            try {
                if (Object.keys(cachedConfigurationDefaultsOverrides).length) {
                    localStorage.setItem(DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
                    await this.configurationCache.write(this.cacheKey, JSON.stringify(cachedConfigurationDefaultsOverrides));
                }
                else {
                    localStorage.removeItem(DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY);
                    await this.configurationCache.remove(this.cacheKey);
                }
            }
            catch (error) { /* Ignore error */ }
        }
    }
    exports.DefaultConfiguration = DefaultConfiguration;
    class ApplicationConfiguration extends configurationModels_1.UserSettings {
        constructor(userDataProfilesService, fileService, uriIdentityService, logService) {
            super(userDataProfilesService.defaultProfile.settingsResource, { scopes: [1 /* ConfigurationScope.APPLICATION */] }, uriIdentityService.extUri, fileService, logService);
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._register(this.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.loadConfiguration().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
        }
        async initialize() {
            return this.loadConfiguration();
        }
        async loadConfiguration() {
            const model = await super.loadConfiguration();
            const value = model.getValue(configuration_1.APPLY_ALL_PROFILES_SETTING);
            const allProfilesSettings = Array.isArray(value) ? value : [];
            return this.parseOptions.include || allProfilesSettings.length
                ? this.reparse({ ...this.parseOptions, include: allProfilesSettings })
                : model;
        }
    }
    exports.ApplicationConfiguration = ApplicationConfiguration;
    class UserConfiguration extends lifecycle_1.Disposable {
        get hasTasksLoaded() { return this.userConfiguration.value instanceof FileServiceBasedConfiguration; }
        constructor(settingsResource, tasksResource, configurationParseOptions, fileService, uriIdentityService, logService) {
            super();
            this.settingsResource = settingsResource;
            this.tasksResource = tasksResource;
            this.configurationParseOptions = configurationParseOptions;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.userConfiguration = this._register(new lifecycle_1.MutableDisposable());
            this.userConfigurationChangeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.userConfiguration.value = new configurationModels_1.UserSettings(settingsResource, this.configurationParseOptions, uriIdentityService.extUri, this.fileService, logService);
            this.userConfigurationChangeDisposable.value = this.userConfiguration.value.onDidChange(() => this.reloadConfigurationScheduler.schedule());
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.userConfiguration.value.loadConfiguration().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
        }
        async reset(settingsResource, tasksResource, configurationParseOptions) {
            this.settingsResource = settingsResource;
            this.tasksResource = tasksResource;
            this.configurationParseOptions = configurationParseOptions;
            return this.doReset();
        }
        async doReset(settingsConfiguration) {
            const folder = this.uriIdentityService.extUri.dirname(this.settingsResource);
            const standAloneConfigurationResources = this.tasksResource ? [[configuration_1.TASKS_CONFIGURATION_KEY, this.tasksResource]] : [];
            const fileServiceBasedConfiguration = new FileServiceBasedConfiguration(folder.toString(), this.settingsResource, standAloneConfigurationResources, this.configurationParseOptions, this.fileService, this.uriIdentityService, this.logService);
            const configurationModel = await fileServiceBasedConfiguration.loadConfiguration(settingsConfiguration);
            this.userConfiguration.value = fileServiceBasedConfiguration;
            // Check for value because userConfiguration might have been disposed.
            if (this.userConfigurationChangeDisposable.value) {
                this.userConfigurationChangeDisposable.value = this.userConfiguration.value.onDidChange(() => this.reloadConfigurationScheduler.schedule());
            }
            return configurationModel;
        }
        async initialize() {
            return this.userConfiguration.value.loadConfiguration();
        }
        async reload(settingsConfiguration) {
            if (this.hasTasksLoaded) {
                return this.userConfiguration.value.loadConfiguration();
            }
            return this.doReset(settingsConfiguration);
        }
        reparse(parseOptions) {
            this.configurationParseOptions = { ...this.configurationParseOptions, ...parseOptions };
            return this.userConfiguration.value.reparse(this.configurationParseOptions);
        }
        getRestrictedSettings() {
            return this.userConfiguration.value.getRestrictedSettings();
        }
    }
    exports.UserConfiguration = UserConfiguration;
    class FileServiceBasedConfiguration extends lifecycle_1.Disposable {
        constructor(name, settingsResource, standAloneConfigurationResources, configurationParseOptions, fileService, uriIdentityService, logService) {
            super();
            this.settingsResource = settingsResource;
            this.standAloneConfigurationResources = standAloneConfigurationResources;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.allResources = [this.settingsResource, ...this.standAloneConfigurationResources.map(([, resource]) => resource)];
            this._register((0, lifecycle_1.combinedDisposable)(...this.allResources.map(resource => (0, lifecycle_1.combinedDisposable)(this.fileService.watch(uriIdentityService.extUri.dirname(resource)), 
            // Also listen to the resource incase the resource is a symlink - https://github.com/microsoft/vscode/issues/118134
            this.fileService.watch(resource)))));
            this._folderSettingsModelParser = new configurationModels_1.ConfigurationModelParser(name, logService);
            this._folderSettingsParseOptions = configurationParseOptions;
            this._standAloneConfigurations = [];
            this._cache = configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(this.fileService.onDidFilesChange, e => this.handleFileChangesEvent(e)), event_1.Event.filter(this.fileService.onDidRunOperation, e => this.handleFileOperationEvent(e))), () => undefined, 100)(() => this._onDidChange.fire()));
        }
        async resolveContents(donotResolveSettings) {
            const resolveContents = async (resources) => {
                return Promise.all(resources.map(async (resource) => {
                    try {
                        const content = await this.fileService.readFile(resource, { atomic: true });
                        return content.value.toString();
                    }
                    catch (error) {
                        this.logService.trace(`Error while resolving configuration file '${resource.toString()}': ${errors.getErrorMessage(error)}`);
                        if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */
                            && error.fileOperationResult !== 9 /* FileOperationResult.FILE_NOT_DIRECTORY */) {
                            this.logService.error(error);
                        }
                    }
                    return '{}';
                }));
            };
            const [[settingsContent], standAloneConfigurationContents] = await Promise.all([
                donotResolveSettings ? Promise.resolve([undefined]) : resolveContents([this.settingsResource]),
                resolveContents(this.standAloneConfigurationResources.map(([, resource]) => resource)),
            ]);
            return [settingsContent, standAloneConfigurationContents.map((content, index) => ([this.standAloneConfigurationResources[index][0], content]))];
        }
        async loadConfiguration(settingsConfiguration) {
            const [settingsContent, standAloneConfigurationContents] = await this.resolveContents(!!settingsConfiguration);
            // reset
            this._standAloneConfigurations = [];
            this._folderSettingsModelParser.parse('', this._folderSettingsParseOptions);
            // parse
            if (settingsContent !== undefined) {
                this._folderSettingsModelParser.parse(settingsContent, this._folderSettingsParseOptions);
            }
            for (let index = 0; index < standAloneConfigurationContents.length; index++) {
                const contents = standAloneConfigurationContents[index][1];
                if (contents !== undefined) {
                    const standAloneConfigurationModelParser = new configurationModels_2.StandaloneConfigurationModelParser(this.standAloneConfigurationResources[index][1].toString(), this.standAloneConfigurationResources[index][0], this.logService);
                    standAloneConfigurationModelParser.parse(contents);
                    this._standAloneConfigurations.push(standAloneConfigurationModelParser.configurationModel);
                }
            }
            // Consolidate (support *.json files in the workspace settings folder)
            this.consolidate(settingsConfiguration);
            return this._cache;
        }
        getRestrictedSettings() {
            return this._folderSettingsModelParser.restrictedConfigurations;
        }
        reparse(configurationParseOptions) {
            const oldContents = this._folderSettingsModelParser.configurationModel.contents;
            this._folderSettingsParseOptions = configurationParseOptions;
            this._folderSettingsModelParser.reparse(this._folderSettingsParseOptions);
            if (!(0, objects_1.equals)(oldContents, this._folderSettingsModelParser.configurationModel.contents)) {
                this.consolidate();
            }
            return this._cache;
        }
        consolidate(settingsConfiguration) {
            this._cache = (settingsConfiguration ?? this._folderSettingsModelParser.configurationModel).merge(...this._standAloneConfigurations);
        }
        handleFileChangesEvent(event) {
            // One of the resources has changed
            if (this.allResources.some(resource => event.contains(resource))) {
                return true;
            }
            // One of the resource's parent got deleted
            if (this.allResources.some(resource => event.contains(this.uriIdentityService.extUri.dirname(resource), 2 /* FileChangeType.DELETED */))) {
                return true;
            }
            return false;
        }
        handleFileOperationEvent(event) {
            // One of the resources has changed
            if ((event.isOperation(0 /* FileOperation.CREATE */) || event.isOperation(3 /* FileOperation.COPY */) || event.isOperation(1 /* FileOperation.DELETE */) || event.isOperation(4 /* FileOperation.WRITE */))
                && this.allResources.some(resource => this.uriIdentityService.extUri.isEqual(event.resource, resource))) {
                return true;
            }
            // One of the resource's parent got deleted
            if (event.isOperation(1 /* FileOperation.DELETE */) && this.allResources.some(resource => this.uriIdentityService.extUri.isEqual(event.resource, this.uriIdentityService.extUri.dirname(resource)))) {
                return true;
            }
            return false;
        }
    }
    class RemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(remoteAuthority, configurationCache, fileService, uriIdentityService, remoteAgentService, logService) {
            super();
            this._userConfigurationInitializationPromise = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onDidInitialize = this._register(new event_1.Emitter());
            this.onDidInitialize = this._onDidInitialize.event;
            this._fileService = fileService;
            this._userConfiguration = this._cachedConfiguration = new CachedRemoteUserConfiguration(remoteAuthority, configurationCache, { scopes: configuration_1.REMOTE_MACHINE_SCOPES }, logService);
            remoteAgentService.getEnvironment().then(async (environment) => {
                if (environment) {
                    const userConfiguration = this._register(new FileServiceBasedRemoteUserConfiguration(environment.settingsPath, { scopes: configuration_1.REMOTE_MACHINE_SCOPES }, this._fileService, uriIdentityService, logService));
                    this._register(userConfiguration.onDidChangeConfiguration(configurationModel => this.onDidUserConfigurationChange(configurationModel)));
                    this._userConfigurationInitializationPromise = userConfiguration.initialize();
                    const configurationModel = await this._userConfigurationInitializationPromise;
                    this._userConfiguration.dispose();
                    this._userConfiguration = userConfiguration;
                    this.onDidUserConfigurationChange(configurationModel);
                    this._onDidInitialize.fire(configurationModel);
                }
            });
        }
        async initialize() {
            if (this._userConfiguration instanceof FileServiceBasedRemoteUserConfiguration) {
                return this._userConfiguration.initialize();
            }
            // Initialize cached configuration
            let configurationModel = await this._userConfiguration.initialize();
            if (this._userConfigurationInitializationPromise) {
                // Use user configuration
                configurationModel = await this._userConfigurationInitializationPromise;
                this._userConfigurationInitializationPromise = null;
            }
            return configurationModel;
        }
        reload() {
            return this._userConfiguration.reload();
        }
        reparse() {
            return this._userConfiguration.reparse({ scopes: configuration_1.REMOTE_MACHINE_SCOPES });
        }
        getRestrictedSettings() {
            return this._userConfiguration.getRestrictedSettings();
        }
        onDidUserConfigurationChange(configurationModel) {
            this.updateCache();
            this._onDidChangeConfiguration.fire(configurationModel);
        }
        async updateCache() {
            if (this._userConfiguration instanceof FileServiceBasedRemoteUserConfiguration) {
                let content;
                try {
                    content = await this._userConfiguration.resolveContent();
                }
                catch (error) {
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        return;
                    }
                }
                await this._cachedConfiguration.updateConfiguration(content);
            }
        }
    }
    exports.RemoteUserConfiguration = RemoteUserConfiguration;
    class FileServiceBasedRemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(configurationResource, configurationParseOptions, fileService, uriIdentityService, logService) {
            super();
            this.configurationResource = configurationResource;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.fileWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.directoryWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.parser = new configurationModels_1.ConfigurationModelParser(this.configurationResource.toString(), logService);
            this.parseOptions = configurationParseOptions;
            this._register(fileService.onDidFilesChange(e => this.handleFileChangesEvent(e)));
            this._register(fileService.onDidRunOperation(e => this.handleFileOperationEvent(e)));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.stopWatchingResource();
                this.stopWatchingDirectory();
            }));
        }
        watchResource() {
            this.fileWatcherDisposable.value = this.fileService.watch(this.configurationResource);
        }
        stopWatchingResource() {
            this.fileWatcherDisposable.value = undefined;
        }
        watchDirectory() {
            const directory = this.uriIdentityService.extUri.dirname(this.configurationResource);
            this.directoryWatcherDisposable.value = this.fileService.watch(directory);
        }
        stopWatchingDirectory() {
            this.directoryWatcherDisposable.value = undefined;
        }
        async initialize() {
            const exists = await this.fileService.exists(this.configurationResource);
            this.onResourceExists(exists);
            return this.reload();
        }
        async resolveContent() {
            const content = await this.fileService.readFile(this.configurationResource, { atomic: true });
            return content.value.toString();
        }
        async reload() {
            try {
                const content = await this.resolveContent();
                this.parser.parse(content, this.parseOptions);
                return this.parser.configurationModel;
            }
            catch (e) {
                return configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
            }
        }
        reparse(configurationParseOptions) {
            this.parseOptions = configurationParseOptions;
            this.parser.reparse(this.parseOptions);
            return this.parser.configurationModel;
        }
        getRestrictedSettings() {
            return this.parser.restrictedConfigurations;
        }
        handleFileChangesEvent(event) {
            // Find changes that affect the resource
            let affectedByChanges = event.contains(this.configurationResource, 0 /* FileChangeType.UPDATED */);
            if (event.contains(this.configurationResource, 1 /* FileChangeType.ADDED */)) {
                affectedByChanges = true;
                this.onResourceExists(true);
            }
            else if (event.contains(this.configurationResource, 2 /* FileChangeType.DELETED */)) {
                affectedByChanges = true;
                this.onResourceExists(false);
            }
            if (affectedByChanges) {
                this.reloadConfigurationScheduler.schedule();
            }
        }
        handleFileOperationEvent(event) {
            if ((event.isOperation(0 /* FileOperation.CREATE */) || event.isOperation(3 /* FileOperation.COPY */) || event.isOperation(1 /* FileOperation.DELETE */) || event.isOperation(4 /* FileOperation.WRITE */))
                && this.uriIdentityService.extUri.isEqual(event.resource, this.configurationResource)) {
                this.reloadConfigurationScheduler.schedule();
            }
        }
        onResourceExists(exists) {
            if (exists) {
                this.stopWatchingDirectory();
                this.watchResource();
            }
            else {
                this.stopWatchingResource();
                this.watchDirectory();
            }
        }
    }
    class CachedRemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(remoteAuthority, configurationCache, configurationParseOptions, logService) {
            super();
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.key = { type: 'user', key: remoteAuthority };
            this.parser = new configurationModels_1.ConfigurationModelParser('CachedRemoteUserConfiguration', logService);
            this.parseOptions = configurationParseOptions;
            this.configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(logService);
        }
        getConfigurationModel() {
            return this.configurationModel;
        }
        initialize() {
            return this.reload();
        }
        reparse(configurationParseOptions) {
            this.parseOptions = configurationParseOptions;
            this.parser.reparse(this.parseOptions);
            this.configurationModel = this.parser.configurationModel;
            return this.configurationModel;
        }
        getRestrictedSettings() {
            return this.parser.restrictedConfigurations;
        }
        async reload() {
            try {
                const content = await this.configurationCache.read(this.key);
                const parsed = JSON.parse(content);
                if (parsed.content) {
                    this.parser.parse(parsed.content, this.parseOptions);
                    this.configurationModel = this.parser.configurationModel;
                }
            }
            catch (e) { /* Ignore error */ }
            return this.configurationModel;
        }
        async updateConfiguration(content) {
            if (content) {
                return this.configurationCache.write(this.key, JSON.stringify({ content }));
            }
            else {
                return this.configurationCache.remove(this.key);
            }
        }
    }
    class WorkspaceConfiguration extends lifecycle_1.Disposable {
        get initialized() { return this._initialized; }
        constructor(configurationCache, fileService, uriIdentityService, logService) {
            super();
            this.configurationCache = configurationCache;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._workspaceConfigurationDisposables = this._register(new lifecycle_1.DisposableStore());
            this._workspaceIdentifier = null;
            this._isWorkspaceTrusted = false;
            this._onDidUpdateConfiguration = this._register(new event_1.Emitter());
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this._initialized = false;
            this.fileService = fileService;
            this._workspaceConfiguration = this._cachedConfiguration = new CachedWorkspaceConfiguration(configurationCache, logService);
        }
        async initialize(workspaceIdentifier, workspaceTrusted) {
            this._workspaceIdentifier = workspaceIdentifier;
            this._isWorkspaceTrusted = workspaceTrusted;
            if (!this._initialized) {
                if (this.configurationCache.needsCaching(this._workspaceIdentifier.configPath)) {
                    this._workspaceConfiguration = this._cachedConfiguration;
                    this.waitAndInitialize(this._workspaceIdentifier);
                }
                else {
                    this.doInitialize(new FileServiceBasedWorkspaceConfiguration(this.fileService, this.uriIdentityService, this.logService));
                }
            }
            await this.reload();
        }
        async reload() {
            if (this._workspaceIdentifier) {
                await this._workspaceConfiguration.load(this._workspaceIdentifier, { scopes: configuration_1.WORKSPACE_SCOPES, skipRestricted: this.isUntrusted() });
            }
        }
        getFolders() {
            return this._workspaceConfiguration.getFolders();
        }
        setFolders(folders, jsonEditingService) {
            if (this._workspaceIdentifier) {
                return jsonEditingService.write(this._workspaceIdentifier.configPath, [{ path: ['folders'], value: folders }], true)
                    .then(() => this.reload());
            }
            return Promise.resolve();
        }
        isTransient() {
            return this._workspaceConfiguration.isTransient();
        }
        getConfiguration() {
            return this._workspaceConfiguration.getWorkspaceSettings();
        }
        updateWorkspaceTrust(trusted) {
            this._isWorkspaceTrusted = trusted;
            return this.reparseWorkspaceSettings();
        }
        reparseWorkspaceSettings() {
            this._workspaceConfiguration.reparseWorkspaceSettings({ scopes: configuration_1.WORKSPACE_SCOPES, skipRestricted: this.isUntrusted() });
            return this.getConfiguration();
        }
        getRestrictedSettings() {
            return this._workspaceConfiguration.getRestrictedSettings();
        }
        async waitAndInitialize(workspaceIdentifier) {
            await (0, files_1.whenProviderRegistered)(workspaceIdentifier.configPath, this.fileService);
            if (!(this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration)) {
                const fileServiceBasedWorkspaceConfiguration = this._register(new FileServiceBasedWorkspaceConfiguration(this.fileService, this.uriIdentityService, this.logService));
                await fileServiceBasedWorkspaceConfiguration.load(workspaceIdentifier, { scopes: configuration_1.WORKSPACE_SCOPES, skipRestricted: this.isUntrusted() });
                this.doInitialize(fileServiceBasedWorkspaceConfiguration);
                this.onDidWorkspaceConfigurationChange(false, true);
            }
        }
        doInitialize(fileServiceBasedWorkspaceConfiguration) {
            this._workspaceConfigurationDisposables.clear();
            this._workspaceConfiguration = this._workspaceConfigurationDisposables.add(fileServiceBasedWorkspaceConfiguration);
            this._workspaceConfigurationDisposables.add(this._workspaceConfiguration.onDidChange(e => this.onDidWorkspaceConfigurationChange(true, false)));
            this._initialized = true;
        }
        isUntrusted() {
            return !this._isWorkspaceTrusted;
        }
        async onDidWorkspaceConfigurationChange(reload, fromCache) {
            if (reload) {
                await this.reload();
            }
            this.updateCache();
            this._onDidUpdateConfiguration.fire(fromCache);
        }
        async updateCache() {
            if (this._workspaceIdentifier && this.configurationCache.needsCaching(this._workspaceIdentifier.configPath) && this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration) {
                const content = await this._workspaceConfiguration.resolveContent(this._workspaceIdentifier);
                await this._cachedConfiguration.updateWorkspace(this._workspaceIdentifier, content);
            }
        }
    }
    exports.WorkspaceConfiguration = WorkspaceConfiguration;
    class FileServiceBasedWorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(fileService, uriIdentityService, logService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this._workspaceIdentifier = null;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('', logService);
            this.workspaceSettings = configurationModels_1.ConfigurationModel.createEmptyModel(logService);
            this._register(event_1.Event.any(event_1.Event.filter(this.fileService.onDidFilesChange, e => !!this._workspaceIdentifier && e.contains(this._workspaceIdentifier.configPath)), event_1.Event.filter(this.fileService.onDidRunOperation, e => !!this._workspaceIdentifier && (e.isOperation(0 /* FileOperation.CREATE */) || e.isOperation(3 /* FileOperation.COPY */) || e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(4 /* FileOperation.WRITE */)) && uriIdentityService.extUri.isEqual(e.resource, this._workspaceIdentifier.configPath)))(() => this.reloadConfigurationScheduler.schedule()));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChange.fire(), 50));
            this.workspaceConfigWatcher = this._register(this.watchWorkspaceConfigurationFile());
        }
        get workspaceIdentifier() {
            return this._workspaceIdentifier;
        }
        async resolveContent(workspaceIdentifier) {
            const content = await this.fileService.readFile(workspaceIdentifier.configPath, { atomic: true });
            return content.value.toString();
        }
        async load(workspaceIdentifier, configurationParseOptions) {
            if (!this._workspaceIdentifier || this._workspaceIdentifier.id !== workspaceIdentifier.id) {
                this._workspaceIdentifier = workspaceIdentifier;
                this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(this._workspaceIdentifier.id, this.logService);
                (0, lifecycle_1.dispose)(this.workspaceConfigWatcher);
                this.workspaceConfigWatcher = this._register(this.watchWorkspaceConfigurationFile());
            }
            let contents = '';
            try {
                contents = await this.resolveContent(this._workspaceIdentifier);
            }
            catch (error) {
                const exists = await this.fileService.exists(this._workspaceIdentifier.configPath);
                if (exists) {
                    this.logService.error(error);
                }
            }
            this.workspaceConfigurationModelParser.parse(contents, configurationParseOptions);
            this.consolidate();
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        isTransient() {
            return this.workspaceConfigurationModelParser.transient;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reparseWorkspaceSettings(configurationParseOptions) {
            this.workspaceConfigurationModelParser.reparseWorkspaceSettings(configurationParseOptions);
            this.consolidate();
            return this.getWorkspaceSettings();
        }
        getRestrictedSettings() {
            return this.workspaceConfigurationModelParser.getRestrictedWorkspaceSettings();
        }
        consolidate() {
            this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel, this.workspaceConfigurationModelParser.tasksModel);
        }
        watchWorkspaceConfigurationFile() {
            return this._workspaceIdentifier ? this.fileService.watch(this._workspaceIdentifier.configPath) : lifecycle_1.Disposable.None;
        }
    }
    class CachedWorkspaceConfiguration {
        constructor(configurationCache, logService) {
            this.configurationCache = configurationCache;
            this.logService = logService;
            this.onDidChange = event_1.Event.None;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('', logService);
            this.workspaceSettings = configurationModels_1.ConfigurationModel.createEmptyModel(logService);
        }
        async load(workspaceIdentifier, configurationParseOptions) {
            try {
                const key = this.getKey(workspaceIdentifier);
                const contents = await this.configurationCache.read(key);
                const parsed = JSON.parse(contents);
                if (parsed.content) {
                    this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(key.key, this.logService);
                    this.workspaceConfigurationModelParser.parse(parsed.content, configurationParseOptions);
                    this.consolidate();
                }
            }
            catch (e) {
            }
        }
        get workspaceIdentifier() {
            return null;
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        isTransient() {
            return this.workspaceConfigurationModelParser.transient;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reparseWorkspaceSettings(configurationParseOptions) {
            this.workspaceConfigurationModelParser.reparseWorkspaceSettings(configurationParseOptions);
            this.consolidate();
            return this.getWorkspaceSettings();
        }
        getRestrictedSettings() {
            return this.workspaceConfigurationModelParser.getRestrictedWorkspaceSettings();
        }
        consolidate() {
            this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel, this.workspaceConfigurationModelParser.tasksModel);
        }
        async updateWorkspace(workspaceIdentifier, content) {
            try {
                const key = this.getKey(workspaceIdentifier);
                if (content) {
                    await this.configurationCache.write(key, JSON.stringify({ content }));
                }
                else {
                    await this.configurationCache.remove(key);
                }
            }
            catch (error) {
            }
        }
        getKey(workspaceIdentifier) {
            return {
                type: 'workspaces',
                key: workspaceIdentifier.id
            };
        }
    }
    class CachedFolderConfiguration {
        constructor(folder, configFolderRelativePath, configurationParseOptions, configurationCache, logService) {
            this.configurationCache = configurationCache;
            this.logService = logService;
            this.onDidChange = event_1.Event.None;
            this.key = { type: 'folder', key: (0, hash_1.hash)((0, resources_1.joinPath)(folder, configFolderRelativePath).toString()).toString(16) };
            this._folderSettingsModelParser = new configurationModels_1.ConfigurationModelParser('CachedFolderConfiguration', logService);
            this._folderSettingsParseOptions = configurationParseOptions;
            this._standAloneConfigurations = [];
            this.configurationModel = configurationModels_1.ConfigurationModel.createEmptyModel(logService);
        }
        async loadConfiguration() {
            try {
                const contents = await this.configurationCache.read(this.key);
                const { content: configurationContents } = JSON.parse(contents.toString());
                if (configurationContents) {
                    for (const key of Object.keys(configurationContents)) {
                        if (key === configuration_1.FOLDER_SETTINGS_NAME) {
                            this._folderSettingsModelParser.parse(configurationContents[key], this._folderSettingsParseOptions);
                        }
                        else {
                            const standAloneConfigurationModelParser = new configurationModels_2.StandaloneConfigurationModelParser(key, key, this.logService);
                            standAloneConfigurationModelParser.parse(configurationContents[key]);
                            this._standAloneConfigurations.push(standAloneConfigurationModelParser.configurationModel);
                        }
                    }
                }
                this.consolidate();
            }
            catch (e) {
            }
            return this.configurationModel;
        }
        async updateConfiguration(settingsContent, standAloneConfigurationContents) {
            const content = {};
            if (settingsContent) {
                content[configuration_1.FOLDER_SETTINGS_NAME] = settingsContent;
            }
            standAloneConfigurationContents.forEach(([key, contents]) => {
                if (contents) {
                    content[key] = contents;
                }
            });
            if (Object.keys(content).length) {
                await this.configurationCache.write(this.key, JSON.stringify({ content }));
            }
            else {
                await this.configurationCache.remove(this.key);
            }
        }
        getRestrictedSettings() {
            return this._folderSettingsModelParser.restrictedConfigurations;
        }
        reparse(configurationParseOptions) {
            this._folderSettingsParseOptions = configurationParseOptions;
            this._folderSettingsModelParser.reparse(this._folderSettingsParseOptions);
            this.consolidate();
            return this.configurationModel;
        }
        consolidate() {
            this.configurationModel = this._folderSettingsModelParser.configurationModel.merge(...this._standAloneConfigurations);
        }
        getUnsupportedKeys() {
            return [];
        }
    }
    class FolderConfiguration extends lifecycle_1.Disposable {
        constructor(useCache, workspaceFolder, configFolderRelativePath, workbenchState, workspaceTrusted, fileService, uriIdentityService, logService, configurationCache) {
            super();
            this.workspaceFolder = workspaceFolder;
            this.workbenchState = workbenchState;
            this.workspaceTrusted = workspaceTrusted;
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.scopes = 3 /* WorkbenchState.WORKSPACE */ === this.workbenchState ? configuration_1.FOLDER_SCOPES : configuration_1.WORKSPACE_SCOPES;
            this.configurationFolder = uriIdentityService.extUri.joinPath(workspaceFolder.uri, configFolderRelativePath);
            this.cachedFolderConfiguration = new CachedFolderConfiguration(workspaceFolder.uri, configFolderRelativePath, { scopes: this.scopes, skipRestricted: this.isUntrusted() }, configurationCache, logService);
            if (useCache && this.configurationCache.needsCaching(workspaceFolder.uri)) {
                this.folderConfiguration = this.cachedFolderConfiguration;
                (0, files_1.whenProviderRegistered)(workspaceFolder.uri, fileService)
                    .then(() => {
                    this.folderConfiguration = this._register(this.createFileServiceBasedConfiguration(fileService, uriIdentityService, logService));
                    this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
                    this.onDidFolderConfigurationChange();
                });
            }
            else {
                this.folderConfiguration = this._register(this.createFileServiceBasedConfiguration(fileService, uriIdentityService, logService));
                this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
            }
        }
        loadConfiguration() {
            return this.folderConfiguration.loadConfiguration();
        }
        updateWorkspaceTrust(trusted) {
            this.workspaceTrusted = trusted;
            return this.reparse();
        }
        reparse() {
            const configurationModel = this.folderConfiguration.reparse({ scopes: this.scopes, skipRestricted: this.isUntrusted() });
            this.updateCache();
            return configurationModel;
        }
        getRestrictedSettings() {
            return this.folderConfiguration.getRestrictedSettings();
        }
        isUntrusted() {
            return !this.workspaceTrusted;
        }
        onDidFolderConfigurationChange() {
            this.updateCache();
            this._onDidChange.fire();
        }
        createFileServiceBasedConfiguration(fileService, uriIdentityService, logService) {
            const settingsResource = uriIdentityService.extUri.joinPath(this.configurationFolder, `${configuration_1.FOLDER_SETTINGS_NAME}.json`);
            const standAloneConfigurationResources = [configuration_1.TASKS_CONFIGURATION_KEY, configuration_1.LAUNCH_CONFIGURATION_KEY].map(name => ([name, uriIdentityService.extUri.joinPath(this.configurationFolder, `${name}.json`)]));
            return new FileServiceBasedConfiguration(this.configurationFolder.toString(), settingsResource, standAloneConfigurationResources, { scopes: this.scopes, skipRestricted: this.isUntrusted() }, fileService, uriIdentityService, logService);
        }
        async updateCache() {
            if (this.configurationCache.needsCaching(this.configurationFolder) && this.folderConfiguration instanceof FileServiceBasedConfiguration) {
                const [settingsContent, standAloneConfigurationContents] = await this.folderConfiguration.resolveContents();
                this.cachedFolderConfiguration.updateConfiguration(settingsContent, standAloneConfigurationContents);
            }
        }
    }
    exports.FolderConfiguration = FolderConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uL2Jyb3dzZXIvY29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0QmhHLE1BQWEsb0JBQXFCLFNBQVEscUNBQXdCO2lCQUVqRCx1Q0FBa0MsR0FBRyw2QkFBNkIsQUFBaEMsQ0FBaUM7UUFRbkYsWUFDa0Isa0JBQXVDLEVBQ3hELGtCQUF1RCxFQUN2RCxVQUF1QjtZQUV2QixLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFKRCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBUHhDLDBCQUFxQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9GLHlDQUFvQyxHQUEyQixFQUFFLENBQUM7WUFDekQsYUFBUSxHQUFxQixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLGdDQUFnQyxFQUFFLENBQUM7WUFFbEcsZ0JBQVcsR0FBWSxLQUFLLENBQUM7WUFRcEMsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdILENBQUM7UUFDRixDQUFDO1FBRWtCLGdDQUFnQztZQUNsRCxPQUFPLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQztRQUNsRCxDQUFDO1FBRVEsS0FBSyxDQUFDLFVBQVU7WUFDeEIsTUFBTSxJQUFJLENBQUMsOENBQThDLEVBQUUsQ0FBQztZQUM1RCxPQUFPLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRVEsTUFBTTtZQUNkLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxvQ0FBb0MsR0FBRyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLENBQUM7WUFDbEQsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVELHVDQUF1QztZQUN0QyxPQUFPLENBQUMsSUFBQSxxQkFBYSxFQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFHTyw4Q0FBOEM7WUFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxvREFBb0QsRUFBRSxDQUFDO2dCQUNoRSxJQUFJLENBQUMsb0RBQW9ELEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDdkUsSUFBSSxDQUFDO3dCQUNKLGtDQUFrQzt3QkFDbEMsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLEVBQUUsQ0FBQzs0QkFDbkYsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzs0QkFDbEUsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQ0FDYixJQUFJLENBQUMsb0NBQW9DLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs0QkFDakUsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7b0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNoQyxJQUFJLENBQUMsb0NBQW9DLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbEosQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNOLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxvREFBb0QsQ0FBQztRQUNsRSxDQUFDO1FBRWtCLHdCQUF3QixDQUFDLFVBQW9CLEVBQUUsaUJBQTJCO1lBQzVGLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM5RCxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQywwQ0FBMEMsRUFBRSxDQUFDO1lBQ25ELENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLDBDQUEwQztZQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN2QixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sb0NBQW9DLEdBQTJCLEVBQUUsQ0FBQztZQUN4RSxNQUFNLDhCQUE4QixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDO1lBQ3RHLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSw4QkFBOEIsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsK0NBQXVCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3JFLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7Z0JBQ3pELENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUNKLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM5RCxZQUFZLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNyRixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztnQkFDMUcsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsQ0FBQztvQkFDakYsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDckQsQ0FBQztZQUNGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUEsa0JBQWtCLENBQUMsQ0FBQztRQUN0QyxDQUFDOztJQXZGRixvREF5RkM7SUFFRCxNQUFhLHdCQUF5QixTQUFRLGtDQUFZO1FBT3pELFlBQ0MsdUJBQWlELEVBQ2pELFdBQXlCLEVBQ3pCLGtCQUF1QyxFQUN2QyxVQUF1QjtZQUV2QixLQUFLLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsTUFBTSxFQUFFLHdDQUFnQyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQVhqSiw4QkFBeUIsR0FBZ0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQ25ILDZCQUF3QixHQUE4QixJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDO1lBV25HLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xNLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVTtZQUNmLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVRLEtBQUssQ0FBQyxpQkFBaUI7WUFDL0IsTUFBTSxLQUFLLEdBQUcsTUFBTSxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUM5QyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFXLDBDQUEwQixDQUFDLENBQUM7WUFDbkUsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUM5RCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxJQUFJLG1CQUFtQixDQUFDLE1BQU07Z0JBQzdELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDO2dCQUN0RSxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ1YsQ0FBQztLQUNEO0lBOUJELDREQThCQztJQUVELE1BQWEsaUJBQWtCLFNBQVEsc0JBQVU7UUFTaEQsSUFBSSxjQUFjLEtBQWMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxZQUFZLDZCQUE2QixDQUFDLENBQUMsQ0FBQztRQUUvRyxZQUNTLGdCQUFxQixFQUNyQixhQUE4QixFQUM5Qix5QkFBb0QsRUFDM0MsV0FBeUIsRUFDekIsa0JBQXVDLEVBQ3ZDLFVBQXVCO1lBRXhDLEtBQUssRUFBRSxDQUFDO1lBUEEscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFLO1lBQ3JCLGtCQUFhLEdBQWIsYUFBYSxDQUFpQjtZQUM5Qiw4QkFBeUIsR0FBekIseUJBQXlCLENBQTJCO1lBQzNDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3pCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQWZ4Qiw4QkFBeUIsR0FBZ0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQ25ILDZCQUF3QixHQUE4QixJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDO1lBRW5GLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBZ0QsQ0FBQyxDQUFDO1lBQzFHLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBZSxDQUFDLENBQUM7WUFjekcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRyxJQUFJLGtDQUFZLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzNKLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDNUksSUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBTSxDQUFDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNOLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLGdCQUFxQixFQUFFLGFBQThCLEVBQUUseUJBQW9EO1lBQ3RILElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztZQUN6QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxJQUFJLENBQUMseUJBQXlCLEdBQUcseUJBQXlCLENBQUM7WUFDM0QsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPLENBQUMscUJBQTBDO1lBQy9ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sZ0NBQWdDLEdBQW9CLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyx1Q0FBdUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3BJLE1BQU0sNkJBQTZCLEdBQUcsSUFBSSw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGdDQUFnQyxFQUFFLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaFAsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLDZCQUE2QixDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDeEcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRyw2QkFBNkIsQ0FBQztZQUU3RCxzRUFBc0U7WUFDdEUsSUFBSSxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDN0ksQ0FBQztZQUVELE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUQsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUMscUJBQTBDO1lBQ3RELElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN6QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMxRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELE9BQU8sQ0FBQyxZQUFpRDtZQUN4RCxJQUFJLENBQUMseUJBQXlCLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLFlBQVksRUFBRSxDQUFDO1lBQ3hGLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELHFCQUFxQjtZQUNwQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM5RCxDQUFDO0tBQ0Q7SUFsRUQsOENBa0VDO0lBRUQsTUFBTSw2QkFBOEIsU0FBUSxzQkFBVTtRQVdyRCxZQUNDLElBQVksRUFDSyxnQkFBcUIsRUFDckIsZ0NBQWlELEVBQ2xFLHlCQUFvRCxFQUNuQyxXQUF5QixFQUN6QixrQkFBdUMsRUFDdkMsVUFBdUI7WUFFeEMsS0FBSyxFQUFFLENBQUM7WUFQUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQUs7WUFDckIscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFpQjtZQUVqRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN6Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFWeEIsaUJBQVksR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDMUUsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFZM0QsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDhCQUFrQixFQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFrQixFQUN4RixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25FLG1IQUFtSDtZQUNuSCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVMLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLDhDQUF3QixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsMkJBQTJCLEdBQUcseUJBQXlCLENBQUM7WUFDN0QsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLHdDQUFrQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVuRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQzVCLGFBQUssQ0FBQyxHQUFHLENBQ1IsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3BGLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUN2RixFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGVBQWUsQ0FBQyxvQkFBOEI7WUFFbkQsTUFBTSxlQUFlLEdBQUcsS0FBSyxFQUFFLFNBQWdCLEVBQW1DLEVBQUU7Z0JBQ25GLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRTtvQkFDakQsSUFBSSxDQUFDO3dCQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQzVFLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDakMsQ0FBQztvQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO3dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw2Q0FBNkMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM3SCxJQUF5QixLQUFNLENBQUMsbUJBQW1CLCtDQUF1QzsrQkFDakUsS0FBTSxDQUFDLG1CQUFtQixtREFBMkMsRUFBRSxDQUFDOzRCQUNoRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDOUIsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUM7WUFFRixNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsRUFBRSwrQkFBK0IsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDOUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDOUYsZUFBZSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ3RGLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxlQUFlLEVBQUUsK0JBQStCLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqSixDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLHFCQUEwQztZQUVqRSxNQUFNLENBQUMsZUFBZSxFQUFFLCtCQUErQixDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRS9HLFFBQVE7WUFDUixJQUFJLENBQUMseUJBQXlCLEdBQUcsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBRTVFLFFBQVE7WUFDUixJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDMUYsQ0FBQztZQUNELEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRywrQkFBK0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDN0UsTUFBTSxRQUFRLEdBQUcsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUM1QixNQUFNLGtDQUFrQyxHQUFHLElBQUksd0RBQWtDLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ2hOLGtDQUFrQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUM1RixDQUFDO1lBQ0YsQ0FBQztZQUVELHNFQUFzRTtZQUN0RSxJQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFFeEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsd0JBQXdCLENBQUM7UUFDakUsQ0FBQztRQUVELE9BQU8sQ0FBQyx5QkFBb0Q7WUFDM0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztZQUNoRixJQUFJLENBQUMsMkJBQTJCLEdBQUcseUJBQXlCLENBQUM7WUFDN0QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsSUFBQSxnQkFBTSxFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsMEJBQTBCLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDdkYsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVPLFdBQVcsQ0FBQyxxQkFBMEM7WUFDN0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLHFCQUFxQixJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3RJLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxLQUF1QjtZQUNyRCxtQ0FBbUM7WUFDbkMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNsRSxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCwyQ0FBMkM7WUFDM0MsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUF5QixDQUFDLEVBQUUsQ0FBQztnQkFDbEksT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sd0JBQXdCLENBQUMsS0FBeUI7WUFDekQsbUNBQW1DO1lBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyw4QkFBc0IsSUFBSSxLQUFLLENBQUMsV0FBVyw0QkFBb0IsSUFBSSxLQUFLLENBQUMsV0FBVyw4QkFBc0IsSUFBSSxLQUFLLENBQUMsV0FBVyw2QkFBcUIsQ0FBQzttQkFDdkssSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUcsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsMkNBQTJDO1lBQzNDLElBQUksS0FBSyxDQUFDLFdBQVcsOEJBQXNCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3TCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FFRDtJQUVELE1BQWEsdUJBQXdCLFNBQVEsc0JBQVU7UUFhdEQsWUFDQyxlQUF1QixFQUN2QixrQkFBdUMsRUFDdkMsV0FBeUIsRUFDekIsa0JBQXVDLEVBQ3ZDLGtCQUF1QyxFQUN2QyxVQUF1QjtZQUV2QixLQUFLLEVBQUUsQ0FBQztZQWhCRCw0Q0FBdUMsR0FBdUMsSUFBSSxDQUFDO1lBRTFFLDhCQUF5QixHQUFnQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDNUcsNkJBQXdCLEdBQThCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7WUFFMUYscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQ3RFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQVc3RCxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksNkJBQTZCLENBQUMsZUFBZSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsTUFBTSxFQUFFLHFDQUFxQixFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDNUssa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQyxXQUFXLEVBQUMsRUFBRTtnQkFDNUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksdUNBQXVDLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxxQ0FBcUIsRUFBRSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDdE0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBd0IsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN4SSxJQUFJLENBQUMsdUNBQXVDLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzlFLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxJQUFJLENBQUMsdUNBQXVDLENBQUM7b0JBQzlFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO29CQUM1QyxJQUFJLENBQUMsNEJBQTRCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVU7WUFDZixJQUFJLElBQUksQ0FBQyxrQkFBa0IsWUFBWSx1Q0FBdUMsRUFBRSxDQUFDO2dCQUNoRixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUM3QyxDQUFDO1lBRUQsa0NBQWtDO1lBQ2xDLElBQUksa0JBQWtCLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEUsSUFBSSxJQUFJLENBQUMsdUNBQXVDLEVBQUUsQ0FBQztnQkFDbEQseUJBQXlCO2dCQUN6QixrQkFBa0IsR0FBRyxNQUFNLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQztnQkFDeEUsSUFBSSxDQUFDLHVDQUF1QyxHQUFHLElBQUksQ0FBQztZQUNyRCxDQUFDO1lBRUQsT0FBTyxrQkFBa0IsQ0FBQztRQUMzQixDQUFDO1FBRUQsTUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxPQUFPO1lBQ04sT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLHFDQUFxQixFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDeEQsQ0FBQztRQUVPLDRCQUE0QixDQUFDLGtCQUFzQztZQUMxRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVztZQUN4QixJQUFJLElBQUksQ0FBQyxrQkFBa0IsWUFBWSx1Q0FBdUMsRUFBRSxDQUFDO2dCQUNoRixJQUFJLE9BQTJCLENBQUM7Z0JBQ2hDLElBQUksQ0FBQztvQkFDSixPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzFELENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBeUIsS0FBTSxDQUFDLG1CQUFtQiwrQ0FBdUMsRUFBRSxDQUFDO3dCQUM1RixPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0YsQ0FBQztLQUVEO0lBckZELDBEQXFGQztJQUVELE1BQU0sdUNBQXdDLFNBQVEsc0JBQVU7UUFXL0QsWUFDa0IscUJBQTBCLEVBQzNDLHlCQUFvRCxFQUNuQyxXQUF5QixFQUN6QixrQkFBdUMsRUFDdkMsVUFBdUI7WUFFeEMsS0FBSyxFQUFFLENBQUM7WUFOUywwQkFBcUIsR0FBckIscUJBQXFCLENBQUs7WUFFMUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDekIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN2QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBWHRCLDhCQUF5QixHQUFnQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDckgsNkJBQXdCLEdBQThCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7WUFFbkYsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUNoRSwrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBV3JGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSw4Q0FBd0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFlBQVksR0FBRyx5QkFBeUIsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0TCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGFBQWE7WUFDcEIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRU8sb0JBQW9CO1lBQzNCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1FBQzlDLENBQUM7UUFFTyxjQUFjO1lBQ3JCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVU7WUFDZixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWM7WUFDbkIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM5RixPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNO1lBQ1gsSUFBSSxDQUFDO2dCQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM5QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUM7WUFDdkMsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osT0FBTyx3Q0FBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0QsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMseUJBQW9EO1lBQzNELElBQUksQ0FBQyxZQUFZLEdBQUcseUJBQXlCLENBQUM7WUFDOUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztRQUN2QyxDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQztRQUM3QyxDQUFDO1FBRU8sc0JBQXNCLENBQUMsS0FBdUI7WUFFckQsd0NBQXdDO1lBQ3hDLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMscUJBQXFCLGlDQUF5QixDQUFDO1lBQzNGLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMscUJBQXFCLCtCQUF1QixFQUFFLENBQUM7Z0JBQ3RFLGlCQUFpQixHQUFHLElBQUksQ0FBQztnQkFDekIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdCLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsaUNBQXlCLEVBQUUsQ0FBQztnQkFDL0UsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlDLENBQUM7UUFDRixDQUFDO1FBRU8sd0JBQXdCLENBQUMsS0FBeUI7WUFDekQsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLDhCQUFzQixJQUFJLEtBQUssQ0FBQyxXQUFXLDRCQUFvQixJQUFJLEtBQUssQ0FBQyxXQUFXLDhCQUFzQixJQUFJLEtBQUssQ0FBQyxXQUFXLDZCQUFxQixDQUFDO21CQUN2SyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hGLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGdCQUFnQixDQUFDLE1BQWU7WUFDdkMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFRCxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO1FBVXJELFlBQ0MsZUFBdUIsRUFDTixrQkFBdUMsRUFDeEQseUJBQW9ELEVBQ3BELFVBQXVCO1lBRXZCLEtBQUssRUFBRSxDQUFDO1lBSlMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQVZ4QyxpQkFBWSxHQUFnQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDdEcsZ0JBQVcsR0FBOEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFjekUsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxDQUFDO1lBQ2xELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSw4Q0FBd0IsQ0FBQywrQkFBK0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN4RixJQUFJLENBQUMsWUFBWSxHQUFHLHlCQUF5QixDQUFDO1lBQzlDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyx3Q0FBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVELE9BQU8sQ0FBQyx5QkFBb0Q7WUFDM0QsSUFBSSxDQUFDLFlBQVksR0FBRyx5QkFBeUIsQ0FBQztZQUM5QyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUM7WUFDekQsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDaEMsQ0FBQztRQUVELHFCQUFxQjtZQUNwQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUM7UUFDN0MsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNO1lBQ1gsSUFBSSxDQUFDO2dCQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzdELE1BQU0sTUFBTSxHQUF3QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ3JELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO2dCQUMxRCxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFRCxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBMkI7WUFDcEQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFRCxNQUFhLHNCQUF1QixTQUFRLHNCQUFVO1FBWXJELElBQUksV0FBVyxLQUFjLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDeEQsWUFDa0Isa0JBQXVDLEVBQ3ZDLFdBQXlCLEVBQ3pCLGtCQUF1QyxFQUN2QyxVQUF1QjtZQUV4QyxLQUFLLEVBQUUsQ0FBQztZQUxTLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDekIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN2QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBYnhCLHVDQUFrQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUNwRix5QkFBb0IsR0FBZ0MsSUFBSSxDQUFDO1lBQ3pELHdCQUFtQixHQUFZLEtBQUssQ0FBQztZQUU1Qiw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFXLENBQUMsQ0FBQztZQUNwRSw2QkFBd0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDO1lBRXhFLGlCQUFZLEdBQVksS0FBSyxDQUFDO1lBU3JDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSw0QkFBNEIsQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM3SCxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxtQkFBeUMsRUFBRSxnQkFBeUI7WUFDcEYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO1lBQ2hELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxnQkFBZ0IsQ0FBQztZQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQ2hGLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUM7b0JBQ3pELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxzQ0FBc0MsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDM0gsQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU07WUFDWCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUMvQixNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsTUFBTSxFQUFFLGdDQUFnQixFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RJLENBQUM7UUFDRixDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xELENBQUM7UUFFRCxVQUFVLENBQUMsT0FBaUMsRUFBRSxrQkFBdUM7WUFDcEYsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO3FCQUNsSCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkQsQ0FBQztRQUVELGdCQUFnQjtZQUNmLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDNUQsQ0FBQztRQUVELG9CQUFvQixDQUFDLE9BQWdCO1lBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUM7WUFDbkMsT0FBTyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUN4QyxDQUFDO1FBRUQsd0JBQXdCO1lBQ3ZCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxnQ0FBZ0IsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4SCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM3RCxDQUFDO1FBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLG1CQUF5QztZQUN4RSxNQUFNLElBQUEsOEJBQXNCLEVBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLFlBQVksc0NBQXNDLENBQUMsRUFBRSxDQUFDO2dCQUN2RixNQUFNLHNDQUFzQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxzQ0FBc0MsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDdEssTUFBTSxzQ0FBc0MsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxNQUFNLEVBQUUsZ0NBQWdCLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3pJLElBQUksQ0FBQyxZQUFZLENBQUMsc0NBQXNDLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxDQUFDO1FBQ0YsQ0FBQztRQUVPLFlBQVksQ0FBQyxzQ0FBOEU7WUFDbEcsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDbkgsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEosSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDMUIsQ0FBQztRQUVPLFdBQVc7WUFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNsQyxDQUFDO1FBRU8sS0FBSyxDQUFDLGlDQUFpQyxDQUFDLE1BQWUsRUFBRSxTQUFrQjtZQUNsRixJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3JCLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRU8sS0FBSyxDQUFDLFdBQVc7WUFDeEIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLHVCQUF1QixZQUFZLHNDQUFzQyxFQUFFLENBQUM7Z0JBQy9MLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDN0YsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBakhELHdEQWlIQztJQUVELE1BQU0sc0NBQXVDLFNBQVEsc0JBQVU7UUFXOUQsWUFDa0IsV0FBeUIsRUFDMUMsa0JBQXVDLEVBQ3RCLFVBQXVCO1lBRXhDLEtBQUssRUFBRSxDQUFDO1lBSlMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFFekIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQVZqQyx5QkFBb0IsR0FBZ0MsSUFBSSxDQUFDO1lBSTlDLGlCQUFZLEdBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzVFLGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBUzNELElBQUksQ0FBQyxpQ0FBaUMsR0FBRyxJQUFJLHVEQUFpQyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsaUJBQWlCLEdBQUcsd0NBQWtCLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUN2QixhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQ3JJLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyw4QkFBc0IsSUFBSSxDQUFDLENBQUMsV0FBVyw0QkFBb0IsSUFBSSxDQUFDLENBQUMsV0FBVyw4QkFBc0IsSUFBSSxDQUFDLENBQUMsV0FBVyw2QkFBcUIsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FDcFUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVELElBQUksbUJBQW1CO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO1FBQ2xDLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLG1CQUF5QztZQUM3RCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xHLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxtQkFBeUMsRUFBRSx5QkFBb0Q7WUFDekcsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxLQUFLLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMzRixJQUFJLENBQUMsb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxpQ0FBaUMsR0FBRyxJQUFJLHVEQUFpQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM5SCxJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUM7WUFDdEYsQ0FBQztZQUNELElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUM7Z0JBQ0osUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ25GLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUseUJBQXlCLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVELHFCQUFxQjtZQUNwQixPQUFPLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxrQkFBa0IsQ0FBQztRQUNsRSxDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQztRQUN2RCxDQUFDO1FBRUQsV0FBVztZQUNWLE9BQU8sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLFNBQVMsQ0FBQztRQUN6RCxDQUFDO1FBRUQsb0JBQW9CO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7UUFFRCx3QkFBd0IsQ0FBQyx5QkFBb0Q7WUFDNUUsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLHdCQUF3QixDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDM0YsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELHFCQUFxQjtZQUNwQixPQUFPLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1FBQ2hGLENBQUM7UUFFTyxXQUFXO1lBQ2xCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1TCxDQUFDO1FBRU8sK0JBQStCO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ25ILENBQUM7S0FFRDtJQUVELE1BQU0sNEJBQTRCO1FBT2pDLFlBQ2tCLGtCQUF1QyxFQUN2QyxVQUF1QjtZQUR2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFQaEMsZ0JBQVcsR0FBZ0IsYUFBSyxDQUFDLElBQUksQ0FBQztZQVM5QyxJQUFJLENBQUMsaUNBQWlDLEdBQUcsSUFBSSx1REFBaUMsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLGlCQUFpQixHQUFHLHdDQUFrQixDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUF5QyxFQUFFLHlCQUFvRDtZQUN6RyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sTUFBTSxHQUF3QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxDQUFDLGlDQUFpQyxHQUFHLElBQUksdURBQWlDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3pHLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO29CQUN4RixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxtQkFBbUI7WUFDdEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLGtCQUFrQixDQUFDO1FBQ2xFLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsaUNBQWlDLENBQUMsT0FBTyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsaUNBQWlDLENBQUMsU0FBUyxDQUFDO1FBQ3pELENBQUM7UUFFRCxvQkFBb0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUVELHdCQUF3QixDQUFDLHlCQUFvRDtZQUM1RSxJQUFJLENBQUMsaUNBQWlDLENBQUMsd0JBQXdCLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUMzRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLDhCQUE4QixFQUFFLENBQUM7UUFDaEYsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVMLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLG1CQUF5QyxFQUFFLE9BQTJCO1lBQzNGLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQzdDLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDakIsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNLENBQUMsbUJBQXlDO1lBQ3ZELE9BQU87Z0JBQ04sSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFO2FBQzNCLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLHlCQUF5QjtRQVU5QixZQUNDLE1BQVcsRUFDWCx3QkFBZ0MsRUFDaEMseUJBQW9ELEVBQ25DLGtCQUF1QyxFQUN2QyxVQUF1QjtZQUR2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFiaEMsZ0JBQVcsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBZWpDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFBLFdBQUksRUFBQyxJQUFBLG9CQUFRLEVBQUMsTUFBTSxFQUFFLHdCQUF3QixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUM3RyxJQUFJLENBQUMsMEJBQTBCLEdBQUcsSUFBSSw4Q0FBd0IsQ0FBQywyQkFBMkIsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsMkJBQTJCLEdBQUcseUJBQXlCLENBQUM7WUFDN0QsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsd0NBQWtCLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELEtBQUssQ0FBQyxpQkFBaUI7WUFDdEIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sRUFBRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsR0FBMkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDbkgsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO29CQUMzQixLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDO3dCQUN0RCxJQUFJLEdBQUcsS0FBSyxvQ0FBb0IsRUFBRSxDQUFDOzRCQUNsQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO3dCQUNyRyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLHdEQUFrQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUM3RyxrQ0FBa0MsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs0QkFDckUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUM1RixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEIsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDaEMsQ0FBQztRQUVELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxlQUFtQyxFQUFFLCtCQUErRDtZQUM3SCxNQUFNLE9BQU8sR0FBUSxFQUFFLENBQUM7WUFDeEIsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxDQUFDLG9DQUFvQixDQUFDLEdBQUcsZUFBZSxDQUFDO1lBQ2pELENBQUM7WUFDRCwrQkFBK0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFO2dCQUMzRCxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7Z0JBQ3pCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztRQUVELHFCQUFxQjtZQUNwQixPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyx3QkFBd0IsQ0FBQztRQUNqRSxDQUFDO1FBRUQsT0FBTyxDQUFDLHlCQUFvRDtZQUMzRCxJQUFJLENBQUMsMkJBQTJCLEdBQUcseUJBQXlCLENBQUM7WUFDN0QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDaEMsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUN2SCxDQUFDO1FBRUQsa0JBQWtCO1lBQ2pCLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztLQUNEO0lBRUQsTUFBYSxtQkFBb0IsU0FBUSxzQkFBVTtRQVVsRCxZQUNDLFFBQWlCLEVBQ1IsZUFBaUMsRUFDMUMsd0JBQWdDLEVBQ2YsY0FBOEIsRUFDdkMsZ0JBQXlCLEVBQ2pDLFdBQXlCLEVBQ3pCLGtCQUF1QyxFQUN2QyxVQUF1QixFQUNOLGtCQUF1QztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQVRDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUV6QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDdkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFTO1lBSWhCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFqQnRDLGlCQUFZLEdBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzVFLGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBb0IzRCxJQUFJLENBQUMsTUFBTSxHQUFHLHFDQUE2QixJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyw2QkFBYSxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0IsQ0FBQztZQUNsRyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDN0csSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUkseUJBQXlCLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSx3QkFBd0IsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMzTSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMzRSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDO2dCQUMxRCxJQUFBLDhCQUFzQixFQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDO3FCQUN0RCxJQUFJLENBQUMsR0FBRyxFQUFFO29CQUNWLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDakksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNqRyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztnQkFDdkMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNqSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEcsQ0FBQztRQUNGLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNyRCxDQUFDO1FBRUQsb0JBQW9CLENBQUMsT0FBZ0I7WUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRUQsT0FBTztZQUNOLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pILElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixPQUFPLGtCQUFrQixDQUFDO1FBQzNCLENBQUM7UUFFRCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUN6RCxDQUFDO1FBRU8sV0FBVztZQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQy9CLENBQUM7UUFFTyw4QkFBOEI7WUFDckMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLG1DQUFtQyxDQUFDLFdBQXlCLEVBQUUsa0JBQXVDLEVBQUUsVUFBdUI7WUFDdEksTUFBTSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLG9DQUFvQixPQUFPLENBQUMsQ0FBQztZQUN0SCxNQUFNLGdDQUFnQyxHQUFvQixDQUFDLHVDQUF1QixFQUFFLHdDQUF3QixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbE4sT0FBTyxJQUFJLDZCQUE2QixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxnQ0FBZ0MsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN08sQ0FBQztRQUVPLEtBQUssQ0FBQyxXQUFXO1lBQ3hCLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLFlBQVksNkJBQTZCLEVBQUUsQ0FBQztnQkFDekksTUFBTSxDQUFDLGVBQWUsRUFBRSwrQkFBK0IsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM1RyxJQUFJLENBQUMseUJBQXlCLENBQUMsbUJBQW1CLENBQUMsZUFBZSxFQUFFLCtCQUErQixDQUFDLENBQUM7WUFDdEcsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWhGRCxrREFnRkMifQ==