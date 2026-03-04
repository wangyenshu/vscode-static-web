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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurations", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/configuration/common/configurationEditing", "vs/workbench/services/configuration/browser/configuration", "vs/base/common/performance", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/errorMessage", "vs/platform/workspace/common/workspaceTrust", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/types", "vs/nls", "vs/platform/policy/common/policy", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/common/configuration", "vs/base/browser/window", "vs/base/browser/dom"], function (require, exports, uri_1, event_1, map_1, objects_1, lifecycle_1, async_1, jsonContributionRegistry_1, workspace_1, configurationModels_1, configuration_1, configurations_1, configurationModels_2, configuration_2, platform_1, configurationRegistry_1, workspaces_1, configurationEditing_1, configuration_3, performance_1, environmentService_1, contributions_1, lifecycle_2, errorMessage_1, workspaceTrust_1, arrays_1, extensions_1, assignmentService_1, types_1, nls_1, policy_1, jsonEditing_1, configuration_4, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceService = void 0;
    function getLocalUserConfigurationScopes(userDataProfile, hasRemote) {
        return (userDataProfile.isDefault || userDataProfile.useDefaultFlags?.settings)
            ? hasRemote ? configuration_2.LOCAL_MACHINE_SCOPES : undefined
            : hasRemote ? configuration_2.LOCAL_MACHINE_PROFILE_SCOPES : configuration_2.PROFILE_SCOPES;
    }
    class Workspace extends workspace_1.Workspace {
        constructor() {
            super(...arguments);
            this.initialized = false;
        }
    }
    class WorkspaceService extends lifecycle_1.Disposable {
        get restrictedSettings() { return this._restrictedSettings; }
        constructor({ remoteAuthority, configurationCache }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, policyService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.fileService = fileService;
            this.remoteAgentService = remoteAgentService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.initialized = false;
            this.applicationConfiguration = null;
            this.remoteUserConfiguration = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onWillChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onWillChangeWorkspaceFolders = this._onWillChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceName = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onDidChangeWorkbenchState = this._register(new event_1.Emitter());
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            this.isWorkspaceTrusted = true;
            this._restrictedSettings = { default: [] };
            this._onDidChangeRestrictedSettings = this._register(new event_1.Emitter());
            this.onDidChangeRestrictedSettings = this._onDidChangeRestrictedSettings.event;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.initRemoteUserConfigurationBarrier = new async_1.Barrier();
            this.completeWorkspaceBarrier = new async_1.Barrier();
            this.defaultConfiguration = this._register(new configuration_3.DefaultConfiguration(configurationCache, environmentService, logService));
            this.policyConfiguration = policyService instanceof policy_1.NullPolicyService ? new configurations_1.NullPolicyConfiguration() : this._register(new configurations_1.PolicyConfiguration(this.defaultConfiguration, policyService, logService));
            this.configurationCache = configurationCache;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration.configurationModel, this.policyConfiguration.configurationModel, configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), new map_1.ResourceMap(), configurationModels_1.ConfigurationModel.createEmptyModel(logService), new map_1.ResourceMap(), this.workspace, logService);
            this.applicationConfigurationDisposables = this._register(new lifecycle_1.DisposableStore());
            this.createApplicationConfiguration();
            this.localUserConfiguration = this._register(new configuration_3.UserConfiguration(userDataProfileService.currentProfile.settingsResource, userDataProfileService.currentProfile.tasksResource, { scopes: getLocalUserConfigurationScopes(userDataProfileService.currentProfile, !!remoteAuthority) }, fileService, uriIdentityService, logService));
            this.cachedFolderConfigs = new map_1.ResourceMap();
            this._register(this.localUserConfiguration.onDidChangeConfiguration(userConfiguration => this.onLocalUserConfigurationChanged(userConfiguration)));
            if (remoteAuthority) {
                const remoteUserConfiguration = this.remoteUserConfiguration = this._register(new configuration_3.RemoteUserConfiguration(remoteAuthority, configurationCache, fileService, uriIdentityService, remoteAgentService, logService));
                this._register(remoteUserConfiguration.onDidInitialize(remoteUserConfigurationModel => {
                    this._register(remoteUserConfiguration.onDidChangeConfiguration(remoteUserConfigurationModel => this.onRemoteUserConfigurationChanged(remoteUserConfigurationModel)));
                    this.onRemoteUserConfigurationChanged(remoteUserConfigurationModel);
                    this.initRemoteUserConfigurationBarrier.open();
                }));
            }
            else {
                this.initRemoteUserConfigurationBarrier.open();
            }
            this.workspaceConfiguration = this._register(new configuration_3.WorkspaceConfiguration(configurationCache, fileService, uriIdentityService, logService));
            this._register(this.workspaceConfiguration.onDidUpdateConfiguration(fromCache => {
                this.onWorkspaceConfigurationChanged(fromCache).then(() => {
                    this.workspace.initialized = this.workspaceConfiguration.initialized;
                    this.checkAndMarkWorkspaceComplete(fromCache);
                });
            }));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(({ properties, defaults }) => this.onDefaultConfigurationChanged(defaults, properties)));
            this._register(this.policyConfiguration.onDidChangeConfiguration(configurationModel => this.onPolicyConfigurationChanged(configurationModel)));
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => this.onUserDataProfileChanged(e)));
            this.workspaceEditingQueue = new async_1.Queue();
        }
        createApplicationConfiguration() {
            this.applicationConfigurationDisposables.clear();
            if (this.userDataProfileService.currentProfile.isDefault || this.userDataProfileService.currentProfile.useDefaultFlags?.settings) {
                this.applicationConfiguration = null;
            }
            else {
                this.applicationConfiguration = this.applicationConfigurationDisposables.add(this._register(new configuration_3.ApplicationConfiguration(this.userDataProfilesService, this.fileService, this.uriIdentityService, this.logService)));
                this.applicationConfigurationDisposables.add(this.applicationConfiguration.onDidChangeConfiguration(configurationModel => this.onApplicationConfigurationChanged(configurationModel)));
            }
        }
        // Workspace Context Service Impl
        async getCompleteWorkspace() {
            await this.completeWorkspaceBarrier.wait();
            return this.getWorkspace();
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            // Workspace has configuration file
            if (this.workspace.configuration) {
                return 3 /* WorkbenchState.WORKSPACE */;
            }
            // Folder has single root
            if (this.workspace.folders.length === 1) {
                return 2 /* WorkbenchState.FOLDER */;
            }
            // Empty
            return 1 /* WorkbenchState.EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        addFolders(foldersToAdd, index) {
            return this.updateFolders(foldersToAdd, [], index);
        }
        removeFolders(foldersToRemove) {
            return this.updateFolders([], foldersToRemove);
        }
        async updateFolders(foldersToAdd, foldersToRemove, index) {
            return this.workspaceEditingQueue.queue(() => this.doUpdateFolders(foldersToAdd, foldersToRemove, index));
        }
        isInsideWorkspace(resource) {
            return !!this.getWorkspaceFolder(resource);
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            switch (this.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */: {
                    let folderUri = undefined;
                    if (uri_1.URI.isUri(workspaceIdOrFolder)) {
                        folderUri = workspaceIdOrFolder;
                    }
                    else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdOrFolder)) {
                        folderUri = workspaceIdOrFolder.uri;
                    }
                    return uri_1.URI.isUri(folderUri) && this.uriIdentityService.extUri.isEqual(folderUri, this.workspace.folders[0].uri);
                }
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, workspace_1.isWorkspaceIdentifier)(workspaceIdOrFolder) && this.workspace.id === workspaceIdOrFolder.id;
            }
            return false;
        }
        async doUpdateFolders(foldersToAdd, foldersToRemove, index) {
            if (this.getWorkbenchState() !== 3 /* WorkbenchState.WORKSPACE */) {
                return Promise.resolve(undefined); // we need a workspace to begin with
            }
            if (foldersToAdd.length + foldersToRemove.length === 0) {
                return Promise.resolve(undefined); // nothing to do
            }
            let foldersHaveChanged = false;
            // Remove first (if any)
            let currentWorkspaceFolders = this.getWorkspace().folders;
            let newStoredFolders = currentWorkspaceFolders.map(f => f.raw).filter((folder, index) => {
                if (!(0, workspaces_1.isStoredWorkspaceFolder)(folder)) {
                    return true; // keep entries which are unrelated
                }
                return !this.contains(foldersToRemove, currentWorkspaceFolders[index].uri); // keep entries which are unrelated
            });
            foldersHaveChanged = currentWorkspaceFolders.length !== newStoredFolders.length;
            // Add afterwards (if any)
            if (foldersToAdd.length) {
                // Recompute current workspace folders if we have folders to add
                const workspaceConfigPath = this.getWorkspace().configuration;
                const workspaceConfigFolder = this.uriIdentityService.extUri.dirname(workspaceConfigPath);
                currentWorkspaceFolders = (0, workspaces_1.toWorkspaceFolders)(newStoredFolders, workspaceConfigPath, this.uriIdentityService.extUri);
                const currentWorkspaceFolderUris = currentWorkspaceFolders.map(folder => folder.uri);
                const storedFoldersToAdd = [];
                for (const folderToAdd of foldersToAdd) {
                    const folderURI = folderToAdd.uri;
                    if (this.contains(currentWorkspaceFolderUris, folderURI)) {
                        continue; // already existing
                    }
                    try {
                        const result = await this.fileService.stat(folderURI);
                        if (!result.isDirectory) {
                            continue;
                        }
                    }
                    catch (e) { /* Ignore */ }
                    storedFoldersToAdd.push((0, workspaces_1.getStoredWorkspaceFolder)(folderURI, false, folderToAdd.name, workspaceConfigFolder, this.uriIdentityService.extUri));
                }
                // Apply to array of newStoredFolders
                if (storedFoldersToAdd.length > 0) {
                    foldersHaveChanged = true;
                    if (typeof index === 'number' && index >= 0 && index < newStoredFolders.length) {
                        newStoredFolders = newStoredFolders.slice(0);
                        newStoredFolders.splice(index, 0, ...storedFoldersToAdd);
                    }
                    else {
                        newStoredFolders = [...newStoredFolders, ...storedFoldersToAdd];
                    }
                }
            }
            // Set folders if we recorded a change
            if (foldersHaveChanged) {
                return this.setFolders(newStoredFolders);
            }
            return Promise.resolve(undefined);
        }
        async setFolders(folders) {
            if (!this.instantiationService) {
                throw new Error('Cannot update workspace folders because workspace service is not yet ready to accept writes.');
            }
            await this.instantiationService.invokeFunction(accessor => this.workspaceConfiguration.setFolders(folders, accessor.get(jsonEditing_1.IJSONEditingService)));
            return this.onWorkspaceConfigurationChanged(false);
        }
        contains(resources, toCheck) {
            return resources.some(resource => this.uriIdentityService.extUri.isEqual(resource, toCheck));
        }
        // Workspace Configuration Service Impl
        getConfigurationData() {
            return this._configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : undefined;
            return this._configuration.getValue(section, overrides);
        }
        async updateValue(key, value, arg3, arg4, options) {
            const overrides = (0, configuration_1.isConfigurationUpdateOverrides)(arg3) ? arg3
                : (0, configuration_1.isConfigurationOverrides)(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier ? [arg3.overrideIdentifier] : undefined } : undefined;
            const target = overrides ? arg4 : arg3;
            const targets = target ? [target] : [];
            if (overrides?.overrideIdentifiers) {
                overrides.overrideIdentifiers = (0, arrays_1.distinct)(overrides.overrideIdentifiers);
                overrides.overrideIdentifiers = overrides.overrideIdentifiers.length ? overrides.overrideIdentifiers : undefined;
            }
            if (!targets.length) {
                if (overrides?.overrideIdentifiers && overrides.overrideIdentifiers.length > 1) {
                    throw new Error('Configuration Target is required while updating the value for multiple override identifiers');
                }
                const inspect = this.inspect(key, { resource: overrides?.resource, overrideIdentifier: overrides?.overrideIdentifiers ? overrides.overrideIdentifiers[0] : undefined });
                targets.push(...this.deriveConfigurationTargets(key, value, inspect));
                // Remove the setting, if the value is same as default value and is updated only in user target
                if ((0, objects_1.equals)(value, inspect.defaultValue) && targets.length === 1 && (targets[0] === 2 /* ConfigurationTarget.USER */ || targets[0] === 3 /* ConfigurationTarget.USER_LOCAL */)) {
                    value = undefined;
                }
            }
            await async_1.Promises.settled(targets.map(target => this.writeConfigurationValue(key, value, target, overrides, options)));
        }
        async reloadConfiguration(target) {
            if (target === undefined) {
                this.reloadDefaultConfiguration();
                const application = await this.reloadApplicationConfiguration(true);
                const { local, remote } = await this.reloadUserConfiguration();
                await this.reloadWorkspaceConfiguration();
                await this.loadConfiguration(application, local, remote, true);
                return;
            }
            if ((0, workspace_1.isWorkspaceFolder)(target)) {
                await this.reloadWorkspaceFolderConfiguration(target);
                return;
            }
            switch (target) {
                case 7 /* ConfigurationTarget.DEFAULT */:
                    this.reloadDefaultConfiguration();
                    return;
                case 2 /* ConfigurationTarget.USER */: {
                    const { local, remote } = await this.reloadUserConfiguration();
                    await this.loadConfiguration(this._configuration.applicationConfiguration, local, remote, true);
                    return;
                }
                case 3 /* ConfigurationTarget.USER_LOCAL */:
                    await this.reloadLocalUserConfiguration();
                    return;
                case 4 /* ConfigurationTarget.USER_REMOTE */:
                    await this.reloadRemoteUserConfiguration();
                    return;
                case 5 /* ConfigurationTarget.WORKSPACE */:
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    await this.reloadWorkspaceConfiguration();
                    return;
            }
        }
        hasCachedConfigurationDefaultsOverrides() {
            return this.defaultConfiguration.hasCachedConfigurationDefaultsOverrides();
        }
        inspect(key, overrides) {
            return this._configuration.inspect(key, overrides);
        }
        keys() {
            return this._configuration.keys();
        }
        async whenRemoteConfigurationLoaded() {
            await this.initRemoteUserConfigurationBarrier.wait();
        }
        /**
         * At present, all workspaces (empty, single-folder, multi-root) in local and remote
         * can be initialized without requiring extension host except following case:
         *
         * A multi root workspace with .code-workspace file that has to be resolved by an extension.
         * Because of readonly `rootPath` property in extension API we have to resolve multi root workspace
         * before extension host starts so that `rootPath` can be set to first folder.
         *
         * This restriction is lifted partially for web in `MainThreadWorkspace`.
         * In web, we start extension host with empty `rootPath` in this case.
         *
         * Related root path issue discussion is being tracked here - https://github.com/microsoft/vscode/issues/69335
         */
        async initialize(arg) {
            (0, performance_1.mark)('code/willInitWorkspaceService');
            const trigger = this.initialized;
            this.initialized = false;
            const workspace = await this.createWorkspace(arg);
            await this.updateWorkspaceAndInitializeConfiguration(workspace, trigger);
            this.checkAndMarkWorkspaceComplete(false);
            (0, performance_1.mark)('code/didInitWorkspaceService');
        }
        updateWorkspaceTrust(trusted) {
            if (this.isWorkspaceTrusted !== trusted) {
                this.isWorkspaceTrusted = trusted;
                const data = this._configuration.toData();
                const folderConfigurationModels = [];
                for (const folder of this.workspace.folders) {
                    const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    let configurationModel;
                    if (folderConfiguration) {
                        configurationModel = folderConfiguration.updateWorkspaceTrust(this.isWorkspaceTrusted);
                        this._configuration.updateFolderConfiguration(folder.uri, configurationModel);
                    }
                    folderConfigurationModels.push(configurationModel);
                }
                if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    if (folderConfigurationModels[0]) {
                        this._configuration.updateWorkspaceConfiguration(folderConfigurationModels[0]);
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.updateWorkspaceTrust(this.isWorkspaceTrusted));
                }
                this.updateRestrictedSettings();
                let keys = [];
                if (this.restrictedSettings.userLocal) {
                    keys.push(...this.restrictedSettings.userLocal);
                }
                if (this.restrictedSettings.userRemote) {
                    keys.push(...this.restrictedSettings.userRemote);
                }
                if (this.restrictedSettings.workspace) {
                    keys.push(...this.restrictedSettings.workspace);
                }
                this.restrictedSettings.workspaceFolder?.forEach((value) => keys.push(...value));
                keys = (0, arrays_1.distinct)(keys);
                if (keys.length) {
                    this.triggerConfigurationChange({ keys, overrides: [] }, { data, workspace: this.workspace }, 5 /* ConfigurationTarget.WORKSPACE */);
                }
            }
        }
        acquireInstantiationService(instantiationService) {
            this.instantiationService = instantiationService;
        }
        isSettingAppliedForAllProfiles(key) {
            if (this.configurationRegistry.getConfigurationProperties()[key]?.scope === 1 /* ConfigurationScope.APPLICATION */) {
                return true;
            }
            const allProfilesSettings = this.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            return Array.isArray(allProfilesSettings) && allProfilesSettings.includes(key);
        }
        async createWorkspace(arg) {
            if ((0, workspace_1.isWorkspaceIdentifier)(arg)) {
                return this.createMultiFolderWorkspace(arg);
            }
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(arg)) {
                return this.createSingleFolderWorkspace(arg);
            }
            return this.createEmptyWorkspace(arg);
        }
        async createMultiFolderWorkspace(workspaceIdentifier) {
            await this.workspaceConfiguration.initialize({ id: workspaceIdentifier.id, configPath: workspaceIdentifier.configPath }, this.isWorkspaceTrusted);
            const workspaceConfigPath = workspaceIdentifier.configPath;
            const workspaceFolders = (0, workspaces_1.toWorkspaceFolders)(this.workspaceConfiguration.getFolders(), workspaceConfigPath, this.uriIdentityService.extUri);
            const workspaceId = workspaceIdentifier.id;
            const workspace = new Workspace(workspaceId, workspaceFolders, this.workspaceConfiguration.isTransient(), workspaceConfigPath, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = this.workspaceConfiguration.initialized;
            return workspace;
        }
        createSingleFolderWorkspace(singleFolderWorkspaceIdentifier) {
            const workspace = new Workspace(singleFolderWorkspaceIdentifier.id, [(0, workspace_1.toWorkspaceFolder)(singleFolderWorkspaceIdentifier.uri)], false, null, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = true;
            return workspace;
        }
        createEmptyWorkspace(emptyWorkspaceIdentifier) {
            const workspace = new Workspace(emptyWorkspaceIdentifier.id, [], false, null, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = true;
            return Promise.resolve(workspace);
        }
        checkAndMarkWorkspaceComplete(fromCache) {
            if (!this.completeWorkspaceBarrier.isOpen() && this.workspace.initialized) {
                this.completeWorkspaceBarrier.open();
                this.validateWorkspaceFoldersAndReload(fromCache);
            }
        }
        async updateWorkspaceAndInitializeConfiguration(workspace, trigger) {
            const hasWorkspaceBefore = !!this.workspace;
            let previousState;
            let previousWorkspacePath;
            let previousFolders = [];
            if (hasWorkspaceBefore) {
                previousState = this.getWorkbenchState();
                previousWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                previousFolders = this.workspace.folders;
                this.workspace.update(workspace);
            }
            else {
                this.workspace = workspace;
            }
            await this.initializeConfiguration(trigger);
            // Trigger changes after configuration initialization so that configuration is up to date.
            if (hasWorkspaceBefore) {
                const newState = this.getWorkbenchState();
                if (previousState && newState !== previousState) {
                    this._onDidChangeWorkbenchState.fire(newState);
                }
                const newWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                if (previousWorkspacePath && newWorkspacePath !== previousWorkspacePath || newState !== previousState) {
                    this._onDidChangeWorkspaceName.fire();
                }
                const folderChanges = this.compareFolders(previousFolders, this.workspace.folders);
                if (folderChanges && (folderChanges.added.length || folderChanges.removed.length || folderChanges.changed.length)) {
                    await this.handleWillChangeWorkspaceFolders(folderChanges, false);
                    this._onDidChangeWorkspaceFolders.fire(folderChanges);
                }
            }
            if (!this.localUserConfiguration.hasTasksLoaded) {
                // Reload local user configuration again to load user tasks
                this._register((0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => this.reloadLocalUserConfiguration(false, this._configuration.localUserConfiguration)));
            }
        }
        compareFolders(currentFolders, newFolders) {
            const result = { added: [], removed: [], changed: [] };
            result.added = newFolders.filter(newFolder => !currentFolders.some(currentFolder => newFolder.uri.toString() === currentFolder.uri.toString()));
            for (let currentIndex = 0; currentIndex < currentFolders.length; currentIndex++) {
                const currentFolder = currentFolders[currentIndex];
                let newIndex = 0;
                for (newIndex = 0; newIndex < newFolders.length && currentFolder.uri.toString() !== newFolders[newIndex].uri.toString(); newIndex++) { }
                if (newIndex < newFolders.length) {
                    if (currentIndex !== newIndex || currentFolder.name !== newFolders[newIndex].name) {
                        result.changed.push(currentFolder);
                    }
                }
                else {
                    result.removed.push(currentFolder);
                }
            }
            return result;
        }
        async initializeConfiguration(trigger) {
            await this.defaultConfiguration.initialize();
            const initPolicyConfigurationPromise = this.policyConfiguration.initialize();
            const initApplicationConfigurationPromise = this.applicationConfiguration ? this.applicationConfiguration.initialize() : Promise.resolve(configurationModels_1.ConfigurationModel.createEmptyModel(this.logService));
            const initUserConfiguration = async () => {
                (0, performance_1.mark)('code/willInitUserConfiguration');
                const result = await Promise.all([this.localUserConfiguration.initialize(), this.remoteUserConfiguration ? this.remoteUserConfiguration.initialize() : Promise.resolve(configurationModels_1.ConfigurationModel.createEmptyModel(this.logService))]);
                if (this.applicationConfiguration) {
                    const applicationConfigurationModel = await initApplicationConfigurationPromise;
                    result[0] = this.localUserConfiguration.reparse({ exclude: applicationConfigurationModel.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) });
                }
                (0, performance_1.mark)('code/didInitUserConfiguration');
                return result;
            };
            const [, application, [local, remote]] = await Promise.all([
                initPolicyConfigurationPromise,
                initApplicationConfigurationPromise,
                initUserConfiguration()
            ]);
            (0, performance_1.mark)('code/willInitWorkspaceConfiguration');
            await this.loadConfiguration(application, local, remote, trigger);
            (0, performance_1.mark)('code/didInitWorkspaceConfiguration');
        }
        reloadDefaultConfiguration() {
            this.onDefaultConfigurationChanged(this.defaultConfiguration.reload());
        }
        async reloadApplicationConfiguration(donotTrigger) {
            if (!this.applicationConfiguration) {
                return configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
            }
            const model = await this.applicationConfiguration.loadConfiguration();
            if (!donotTrigger) {
                this.onApplicationConfigurationChanged(model);
            }
            return model;
        }
        async reloadUserConfiguration() {
            const [local, remote] = await Promise.all([this.reloadLocalUserConfiguration(true), this.reloadRemoteUserConfiguration(true)]);
            return { local, remote };
        }
        async reloadLocalUserConfiguration(donotTrigger, settingsConfiguration) {
            const model = await this.localUserConfiguration.reload(settingsConfiguration);
            if (!donotTrigger) {
                this.onLocalUserConfigurationChanged(model);
            }
            return model;
        }
        async reloadRemoteUserConfiguration(donotTrigger) {
            if (this.remoteUserConfiguration) {
                const model = await this.remoteUserConfiguration.reload();
                if (!donotTrigger) {
                    this.onRemoteUserConfigurationChanged(model);
                }
                return model;
            }
            return configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
        }
        async reloadWorkspaceConfiguration() {
            const workbenchState = this.getWorkbenchState();
            if (workbenchState === 2 /* WorkbenchState.FOLDER */) {
                return this.onWorkspaceFolderConfigurationChanged(this.workspace.folders[0]);
            }
            if (workbenchState === 3 /* WorkbenchState.WORKSPACE */) {
                return this.workspaceConfiguration.reload().then(() => this.onWorkspaceConfigurationChanged(false));
            }
        }
        reloadWorkspaceFolderConfiguration(folder) {
            return this.onWorkspaceFolderConfigurationChanged(folder);
        }
        async loadConfiguration(applicationConfigurationModel, userConfigurationModel, remoteUserConfigurationModel, trigger) {
            // reset caches
            this.cachedFolderConfigs = new map_1.ResourceMap();
            const folders = this.workspace.folders;
            const folderConfigurations = await this.loadFolderConfigurations(folders);
            const workspaceConfiguration = this.getWorkspaceConfigurationModel(folderConfigurations);
            const folderConfigurationModels = new map_1.ResourceMap();
            folderConfigurations.forEach((folderConfiguration, index) => folderConfigurationModels.set(folders[index].uri, folderConfiguration));
            const currentConfiguration = this._configuration;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration.configurationModel, this.policyConfiguration.configurationModel, applicationConfigurationModel, userConfigurationModel, remoteUserConfigurationModel, workspaceConfiguration, folderConfigurationModels, configurationModels_1.ConfigurationModel.createEmptyModel(this.logService), new map_1.ResourceMap(), this.workspace, this.logService);
            this.initialized = true;
            if (trigger) {
                const change = this._configuration.compare(currentConfiguration);
                this.triggerConfigurationChange(change, { data: currentConfiguration.toData(), workspace: this.workspace }, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            this.updateRestrictedSettings();
        }
        getWorkspaceConfigurationModel(folderConfigurations) {
            switch (this.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    return folderConfigurations[0];
                case 3 /* WorkbenchState.WORKSPACE */:
                    return this.workspaceConfiguration.getConfiguration();
                default:
                    return configurationModels_1.ConfigurationModel.createEmptyModel(this.logService);
            }
        }
        onUserDataProfileChanged(e) {
            e.join((async () => {
                const promises = [];
                promises.push(this.localUserConfiguration.reset(e.profile.settingsResource, e.profile.tasksResource, { scopes: getLocalUserConfigurationScopes(e.profile, !!this.remoteUserConfiguration) }));
                if (e.previous.isDefault !== e.profile.isDefault
                    || !!e.previous.useDefaultFlags?.settings !== !!e.profile.useDefaultFlags?.settings) {
                    this.createApplicationConfiguration();
                    if (this.applicationConfiguration) {
                        promises.push(this.reloadApplicationConfiguration(true));
                    }
                }
                let [localUser, application] = await Promise.all(promises);
                application = application ?? this._configuration.applicationConfiguration;
                if (this.applicationConfiguration) {
                    localUser = this.localUserConfiguration.reparse({ exclude: application.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) });
                }
                await this.loadConfiguration(application, localUser, this._configuration.remoteUserConfiguration, true);
            })());
        }
        onDefaultConfigurationChanged(configurationModel, properties) {
            if (this.workspace) {
                const previousData = this._configuration.toData();
                const change = this._configuration.compareAndUpdateDefaultConfiguration(configurationModel, properties);
                if (this.applicationConfiguration) {
                    this._configuration.updateApplicationConfiguration(this.applicationConfiguration.reparse());
                }
                if (this.remoteUserConfiguration) {
                    this._configuration.updateLocalUserConfiguration(this.localUserConfiguration.reparse());
                    this._configuration.updateRemoteUserConfiguration(this.remoteUserConfiguration.reparse());
                }
                if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    const folderConfiguration = this.cachedFolderConfigs.get(this.workspace.folders[0].uri);
                    if (folderConfiguration) {
                        this._configuration.updateWorkspaceConfiguration(folderConfiguration.reparse());
                        this._configuration.updateFolderConfiguration(this.workspace.folders[0].uri, folderConfiguration.reparse());
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.reparseWorkspaceSettings());
                    for (const folder of this.workspace.folders) {
                        const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                        if (folderConfiguration) {
                            this._configuration.updateFolderConfiguration(folder.uri, folderConfiguration.reparse());
                        }
                    }
                }
                this.triggerConfigurationChange(change, { data: previousData, workspace: this.workspace }, 7 /* ConfigurationTarget.DEFAULT */);
                this.updateRestrictedSettings();
            }
        }
        onPolicyConfigurationChanged(policyConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdatePolicyConfiguration(policyConfiguration);
            this.triggerConfigurationChange(change, previous, 7 /* ConfigurationTarget.DEFAULT */);
        }
        onApplicationConfigurationChanged(applicationConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const previousAllProfilesSettings = this._configuration.applicationConfiguration.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            const change = this._configuration.compareAndUpdateApplicationConfiguration(applicationConfiguration);
            const currentAllProfilesSettings = this.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            const configurationProperties = this.configurationRegistry.getConfigurationProperties();
            const changedKeys = [];
            for (const changedKey of change.keys) {
                if (configurationProperties[changedKey]?.scope === 1 /* ConfigurationScope.APPLICATION */) {
                    changedKeys.push(changedKey);
                    if (changedKey === configuration_2.APPLY_ALL_PROFILES_SETTING) {
                        for (const previousAllProfileSetting of previousAllProfilesSettings) {
                            if (!currentAllProfilesSettings.includes(previousAllProfileSetting)) {
                                changedKeys.push(previousAllProfileSetting);
                            }
                        }
                        for (const currentAllProfileSetting of currentAllProfilesSettings) {
                            if (!previousAllProfilesSettings.includes(currentAllProfileSetting)) {
                                changedKeys.push(currentAllProfileSetting);
                            }
                        }
                    }
                }
                else if (currentAllProfilesSettings.includes(changedKey)) {
                    changedKeys.push(changedKey);
                }
            }
            change.keys = changedKeys;
            if (change.keys.includes(configuration_2.APPLY_ALL_PROFILES_SETTING)) {
                this._configuration.updateLocalUserConfiguration(this.localUserConfiguration.reparse({ exclude: currentAllProfilesSettings }));
            }
            this.triggerConfigurationChange(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        onLocalUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateLocalUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        onRemoteUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateRemoteUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        async onWorkspaceConfigurationChanged(fromCache) {
            if (this.workspace && this.workspace.configuration) {
                let newFolders = (0, workspaces_1.toWorkspaceFolders)(this.workspaceConfiguration.getFolders(), this.workspace.configuration, this.uriIdentityService.extUri);
                // Validate only if workspace is initialized
                if (this.workspace.initialized) {
                    const { added, removed, changed } = this.compareFolders(this.workspace.folders, newFolders);
                    /* If changed validate new folders */
                    if (added.length || removed.length || changed.length) {
                        newFolders = await this.toValidWorkspaceFolders(newFolders);
                    }
                    /* Otherwise use existing */
                    else {
                        newFolders = this.workspace.folders;
                    }
                }
                await this.updateWorkspaceConfiguration(newFolders, this.workspaceConfiguration.getConfiguration(), fromCache);
            }
        }
        updateRestrictedSettings() {
            const changed = [];
            const allProperties = this.configurationRegistry.getConfigurationProperties();
            const defaultRestrictedSettings = Object.keys(allProperties).filter(key => allProperties[key].restricted).sort((a, b) => a.localeCompare(b));
            const defaultDelta = (0, arrays_1.delta)(defaultRestrictedSettings, this._restrictedSettings.default, (a, b) => a.localeCompare(b));
            changed.push(...defaultDelta.added, ...defaultDelta.removed);
            const application = (this.applicationConfiguration?.getRestrictedSettings() || []).sort((a, b) => a.localeCompare(b));
            const applicationDelta = (0, arrays_1.delta)(application, this._restrictedSettings.application || [], (a, b) => a.localeCompare(b));
            changed.push(...applicationDelta.added, ...applicationDelta.removed);
            const userLocal = this.localUserConfiguration.getRestrictedSettings().sort((a, b) => a.localeCompare(b));
            const userLocalDelta = (0, arrays_1.delta)(userLocal, this._restrictedSettings.userLocal || [], (a, b) => a.localeCompare(b));
            changed.push(...userLocalDelta.added, ...userLocalDelta.removed);
            const userRemote = (this.remoteUserConfiguration?.getRestrictedSettings() || []).sort((a, b) => a.localeCompare(b));
            const userRemoteDelta = (0, arrays_1.delta)(userRemote, this._restrictedSettings.userRemote || [], (a, b) => a.localeCompare(b));
            changed.push(...userRemoteDelta.added, ...userRemoteDelta.removed);
            const workspaceFolderMap = new map_1.ResourceMap();
            for (const workspaceFolder of this.workspace.folders) {
                const cachedFolderConfig = this.cachedFolderConfigs.get(workspaceFolder.uri);
                const folderRestrictedSettings = (cachedFolderConfig?.getRestrictedSettings() || []).sort((a, b) => a.localeCompare(b));
                if (folderRestrictedSettings.length) {
                    workspaceFolderMap.set(workspaceFolder.uri, folderRestrictedSettings);
                }
                const previous = this._restrictedSettings.workspaceFolder?.get(workspaceFolder.uri) || [];
                const workspaceFolderDelta = (0, arrays_1.delta)(folderRestrictedSettings, previous, (a, b) => a.localeCompare(b));
                changed.push(...workspaceFolderDelta.added, ...workspaceFolderDelta.removed);
            }
            const workspace = this.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? this.workspaceConfiguration.getRestrictedSettings().sort((a, b) => a.localeCompare(b))
                : this.workspace.folders[0] ? (workspaceFolderMap.get(this.workspace.folders[0].uri) || []) : [];
            const workspaceDelta = (0, arrays_1.delta)(workspace, this._restrictedSettings.workspace || [], (a, b) => a.localeCompare(b));
            changed.push(...workspaceDelta.added, ...workspaceDelta.removed);
            if (changed.length) {
                this._restrictedSettings = {
                    default: defaultRestrictedSettings,
                    application: application.length ? application : undefined,
                    userLocal: userLocal.length ? userLocal : undefined,
                    userRemote: userRemote.length ? userRemote : undefined,
                    workspace: workspace.length ? workspace : undefined,
                    workspaceFolder: workspaceFolderMap.size ? workspaceFolderMap : undefined,
                };
                this._onDidChangeRestrictedSettings.fire(this.restrictedSettings);
            }
        }
        async updateWorkspaceConfiguration(workspaceFolders, configuration, fromCache) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateWorkspaceConfiguration(configuration);
            const changes = this.compareFolders(this.workspace.folders, workspaceFolders);
            if (changes.added.length || changes.removed.length || changes.changed.length) {
                this.workspace.folders = workspaceFolders;
                const change = await this.onFoldersChanged();
                await this.handleWillChangeWorkspaceFolders(changes, fromCache);
                this.triggerConfigurationChange(change, previous, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
                this._onDidChangeWorkspaceFolders.fire(changes);
            }
            else {
                this.triggerConfigurationChange(change, previous, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            this.updateRestrictedSettings();
        }
        async handleWillChangeWorkspaceFolders(changes, fromCache) {
            const joiners = [];
            this._onWillChangeWorkspaceFolders.fire({
                join(updateWorkspaceTrustStatePromise) {
                    joiners.push(updateWorkspaceTrustStatePromise);
                },
                changes,
                fromCache
            });
            try {
                await async_1.Promises.settled(joiners);
            }
            catch (error) { /* Ignore */ }
        }
        async onWorkspaceFolderConfigurationChanged(folder) {
            const [folderConfiguration] = await this.loadFolderConfigurations([folder]);
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const folderConfigurationChange = this._configuration.compareAndUpdateFolderConfiguration(folder.uri, folderConfiguration);
            if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceConfigurationChange = this._configuration.compareAndUpdateWorkspaceConfiguration(folderConfiguration);
                this.triggerConfigurationChange((0, configurationModels_1.mergeChanges)(folderConfigurationChange, workspaceConfigurationChange), previous, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            else {
                this.triggerConfigurationChange(folderConfigurationChange, previous, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
            this.updateRestrictedSettings();
        }
        async onFoldersChanged() {
            const changes = [];
            // Remove the configurations of deleted folders
            for (const key of this.cachedFolderConfigs.keys()) {
                if (!this.workspace.folders.filter(folder => folder.uri.toString() === key.toString())[0]) {
                    const folderConfiguration = this.cachedFolderConfigs.get(key);
                    folderConfiguration.dispose();
                    this.cachedFolderConfigs.delete(key);
                    changes.push(this._configuration.compareAndDeleteFolderConfiguration(key));
                }
            }
            const toInitialize = this.workspace.folders.filter(folder => !this.cachedFolderConfigs.has(folder.uri));
            if (toInitialize.length) {
                const folderConfigurations = await this.loadFolderConfigurations(toInitialize);
                folderConfigurations.forEach((folderConfiguration, index) => {
                    changes.push(this._configuration.compareAndUpdateFolderConfiguration(toInitialize[index].uri, folderConfiguration));
                });
            }
            return (0, configurationModels_1.mergeChanges)(...changes);
        }
        loadFolderConfigurations(folders) {
            return Promise.all([...folders.map(folder => {
                    let folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    if (!folderConfiguration) {
                        folderConfiguration = new configuration_3.FolderConfiguration(!this.initialized, folder, configuration_2.FOLDER_CONFIG_FOLDER_NAME, this.getWorkbenchState(), this.isWorkspaceTrusted, this.fileService, this.uriIdentityService, this.logService, this.configurationCache);
                        this._register(folderConfiguration.onDidChange(() => this.onWorkspaceFolderConfigurationChanged(folder)));
                        this.cachedFolderConfigs.set(folder.uri, this._register(folderConfiguration));
                    }
                    return folderConfiguration.loadConfiguration();
                })]);
        }
        async validateWorkspaceFoldersAndReload(fromCache) {
            const validWorkspaceFolders = await this.toValidWorkspaceFolders(this.workspace.folders);
            const { removed } = this.compareFolders(this.workspace.folders, validWorkspaceFolders);
            if (removed.length) {
                await this.updateWorkspaceConfiguration(validWorkspaceFolders, this.workspaceConfiguration.getConfiguration(), fromCache);
            }
        }
        // Filter out workspace folders which are files (not directories)
        // Workspace folders those cannot be resolved are not filtered because they are handled by the Explorer.
        async toValidWorkspaceFolders(workspaceFolders) {
            const validWorkspaceFolders = [];
            for (const workspaceFolder of workspaceFolders) {
                try {
                    const result = await this.fileService.stat(workspaceFolder.uri);
                    if (!result.isDirectory) {
                        continue;
                    }
                }
                catch (e) {
                    this.logService.warn(`Ignoring the error while validating workspace folder ${workspaceFolder.uri.toString()} - ${(0, errorMessage_1.toErrorMessage)(e)}`);
                }
                validWorkspaceFolders.push(workspaceFolder);
            }
            return validWorkspaceFolders;
        }
        async writeConfigurationValue(key, value, target, overrides, options) {
            if (!this.instantiationService) {
                throw new Error('Cannot write configuration because the configuration service is not yet ready to accept writes.');
            }
            if (target === 7 /* ConfigurationTarget.DEFAULT */) {
                throw new Error('Invalid configuration target');
            }
            if (target === 8 /* ConfigurationTarget.MEMORY */) {
                const previous = { data: this._configuration.toData(), workspace: this.workspace };
                this._configuration.updateValue(key, value, overrides);
                this.triggerConfigurationChange({ keys: overrides?.overrideIdentifiers?.length ? [(0, configurationRegistry_1.keyFromOverrideIdentifiers)(overrides.overrideIdentifiers), key] : [key], overrides: overrides?.overrideIdentifiers?.length ? overrides.overrideIdentifiers.map(overrideIdentifier => ([overrideIdentifier, [key]])) : [] }, previous, target);
                return;
            }
            const editableConfigurationTarget = this.toEditableConfigurationTarget(target, key);
            if (!editableConfigurationTarget) {
                throw new Error('Invalid configuration target');
            }
            if (editableConfigurationTarget === 2 /* EditableConfigurationTarget.USER_REMOTE */ && !this.remoteUserConfiguration) {
                throw new Error('Invalid configuration target');
            }
            if (overrides?.overrideIdentifiers?.length && overrides.overrideIdentifiers.length > 1) {
                const configurationModel = this.getConfigurationModelForEditableConfigurationTarget(editableConfigurationTarget, overrides.resource);
                if (configurationModel) {
                    const overrideIdentifiers = overrides.overrideIdentifiers.sort();
                    const existingOverrides = configurationModel.overrides.find(override => (0, arrays_1.equals)([...override.identifiers].sort(), overrideIdentifiers));
                    if (existingOverrides) {
                        overrides.overrideIdentifiers = existingOverrides.identifiers;
                    }
                }
            }
            // Use same instance of ConfigurationEditing to make sure all writes go through the same queue
            this.configurationEditing = this.configurationEditing ?? this.createConfigurationEditingService(this.instantiationService);
            await (await this.configurationEditing).writeConfiguration(editableConfigurationTarget, { key, value }, { scopes: overrides, ...options });
            switch (editableConfigurationTarget) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                    if (this.applicationConfiguration && this.isSettingAppliedForAllProfiles(key)) {
                        await this.reloadApplicationConfiguration();
                    }
                    else {
                        await this.reloadLocalUserConfiguration();
                    }
                    return;
                case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                    return this.reloadRemoteUserConfiguration().then(() => undefined);
                case 3 /* EditableConfigurationTarget.WORKSPACE */:
                    return this.reloadWorkspaceConfiguration();
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: {
                    const workspaceFolder = overrides && overrides.resource ? this.workspace.getFolder(overrides.resource) : null;
                    if (workspaceFolder) {
                        return this.reloadWorkspaceFolderConfiguration(workspaceFolder);
                    }
                }
            }
        }
        async createConfigurationEditingService(instantiationService) {
            const remoteSettingsResource = (await this.remoteAgentService.getEnvironment())?.settingsPath ?? null;
            return instantiationService.createInstance(configurationEditing_1.ConfigurationEditing, remoteSettingsResource);
        }
        getConfigurationModelForEditableConfigurationTarget(target, resource) {
            switch (target) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */: return this._configuration.localUserConfiguration;
                case 2 /* EditableConfigurationTarget.USER_REMOTE */: return this._configuration.remoteUserConfiguration;
                case 3 /* EditableConfigurationTarget.WORKSPACE */: return this._configuration.workspaceConfiguration;
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: return resource ? this._configuration.folderConfigurations.get(resource) : undefined;
            }
        }
        getConfigurationModel(target, resource) {
            switch (target) {
                case 3 /* ConfigurationTarget.USER_LOCAL */: return this._configuration.localUserConfiguration;
                case 4 /* ConfigurationTarget.USER_REMOTE */: return this._configuration.remoteUserConfiguration;
                case 5 /* ConfigurationTarget.WORKSPACE */: return this._configuration.workspaceConfiguration;
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */: return resource ? this._configuration.folderConfigurations.get(resource) : undefined;
                default: return undefined;
            }
        }
        deriveConfigurationTargets(key, value, inspect) {
            if ((0, objects_1.equals)(value, inspect.value)) {
                return [];
            }
            const definedTargets = [];
            if (inspect.workspaceFolderValue !== undefined) {
                definedTargets.push(6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
            if (inspect.workspaceValue !== undefined) {
                definedTargets.push(5 /* ConfigurationTarget.WORKSPACE */);
            }
            if (inspect.userRemoteValue !== undefined) {
                definedTargets.push(4 /* ConfigurationTarget.USER_REMOTE */);
            }
            if (inspect.userLocalValue !== undefined) {
                definedTargets.push(3 /* ConfigurationTarget.USER_LOCAL */);
            }
            if (value === undefined) {
                // Remove the setting in all defined targets
                return definedTargets;
            }
            return [definedTargets[0] || 2 /* ConfigurationTarget.USER */];
        }
        triggerConfigurationChange(change, previous, target) {
            if (change.keys.length) {
                if (target !== 7 /* ConfigurationTarget.DEFAULT */) {
                    this.logService.debug(`Configuration keys changed in ${(0, configuration_1.ConfigurationTargetToString)(target)} target`, ...change.keys);
                }
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this.workspace, this.logService);
                configurationChangeEvent.source = target;
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
        }
        toEditableConfigurationTarget(target, key) {
            if (target === 2 /* ConfigurationTarget.USER */) {
                if (this.remoteUserConfiguration) {
                    const scope = this.configurationRegistry.getConfigurationProperties()[key]?.scope;
                    if (scope === 2 /* ConfigurationScope.MACHINE */ || scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */) {
                        return 2 /* EditableConfigurationTarget.USER_REMOTE */;
                    }
                    if (this.inspect(key).userRemoteValue !== undefined) {
                        return 2 /* EditableConfigurationTarget.USER_REMOTE */;
                    }
                }
                return 1 /* EditableConfigurationTarget.USER_LOCAL */;
            }
            if (target === 3 /* ConfigurationTarget.USER_LOCAL */) {
                return 1 /* EditableConfigurationTarget.USER_LOCAL */;
            }
            if (target === 4 /* ConfigurationTarget.USER_REMOTE */) {
                return 2 /* EditableConfigurationTarget.USER_REMOTE */;
            }
            if (target === 5 /* ConfigurationTarget.WORKSPACE */) {
                return 3 /* EditableConfigurationTarget.WORKSPACE */;
            }
            if (target === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                return 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */;
            }
            return null;
        }
    }
    exports.WorkspaceService = WorkspaceService;
    let RegisterConfigurationSchemasContribution = class RegisterConfigurationSchemasContribution extends lifecycle_1.Disposable {
        constructor(workspaceContextService, environmentService, workspaceTrustManagementService, extensionService, lifecycleService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.environmentService = environmentService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.registerConfigurationSchemas();
                const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
                const delayer = this._register(new async_1.Delayer(50));
                this._register(event_1.Event.any(configurationRegistry.onDidUpdateConfiguration, configurationRegistry.onDidSchemaChange, workspaceTrustManagementService.onDidChangeTrust)(() => delayer.trigger(() => this.registerConfigurationSchemas(), lifecycleService.phase === 4 /* LifecyclePhase.Eventually */ ? undefined : 2500 /* delay longer in early phases */)));
            });
        }
        registerConfigurationSchemas() {
            const allSettingsSchema = {
                properties: configurationRegistry_1.allSettings.properties,
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const userSettingsSchema = this.environmentService.remoteAuthority ?
                {
                    properties: Object.assign({}, configurationRegistry_1.applicationSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                    patternProperties: configurationRegistry_1.allSettings.patternProperties,
                    additionalProperties: true,
                    allowTrailingCommas: true,
                    allowComments: true
                }
                : allSettingsSchema;
            const profileSettingsSchema = {
                properties: Object.assign({}, configurationRegistry_1.machineSettings.properties, configurationRegistry_1.machineOverridableSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const machineSettingsSchema = {
                properties: Object.assign({}, configurationRegistry_1.machineSettings.properties, configurationRegistry_1.machineOverridableSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const workspaceSettingsSchema = {
                properties: Object.assign({}, this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.machineOverridableSettings.properties), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.windowSettings.properties), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.resourceSettings.properties)),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const defaultSettingsSchema = {
                properties: Object.keys(configurationRegistry_1.allSettings.properties).reduce((result, key) => {
                    result[key] = Object.assign({ deprecationMessage: undefined }, configurationRegistry_1.allSettings.properties[key]);
                    return result;
                }, {}),
                patternProperties: Object.keys(configurationRegistry_1.allSettings.patternProperties).reduce((result, key) => {
                    result[key] = Object.assign({ deprecationMessage: undefined }, configurationRegistry_1.allSettings.patternProperties[key]);
                    return result;
                }, {}),
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const folderSettingsSchema = 3 /* WorkbenchState.WORKSPACE */ === this.workspaceContextService.getWorkbenchState() ?
                {
                    properties: Object.assign({}, this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.machineOverridableSettings.properties), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.resourceSettings.properties)),
                    patternProperties: configurationRegistry_1.allSettings.patternProperties,
                    additionalProperties: true,
                    allowTrailingCommas: true,
                    allowComments: true
                } : workspaceSettingsSchema;
            const configDefaultsSchema = {
                type: 'object',
                description: (0, nls_1.localize)('configurationDefaults.description', 'Contribute defaults for configurations'),
                properties: Object.assign({}, configurationRegistry_1.machineOverridableSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                patternProperties: {
                    [configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN]: {
                        type: 'object',
                        default: {},
                        $ref: configurationRegistry_1.resourceLanguageSettingsSchemaId,
                    }
                },
                additionalProperties: false
            };
            this.registerSchemas({
                defaultSettingsSchema,
                userSettingsSchema,
                profileSettingsSchema,
                machineSettingsSchema,
                workspaceSettingsSchema,
                folderSettingsSchema,
                configDefaultsSchema,
            });
        }
        registerSchemas(schemas) {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            jsonRegistry.registerSchema(configuration_2.defaultSettingsSchemaId, schemas.defaultSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.userSettingsSchemaId, schemas.userSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.profileSettingsSchemaId, schemas.profileSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.machineSettingsSchemaId, schemas.machineSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, schemas.workspaceSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, schemas.folderSettingsSchema);
            jsonRegistry.registerSchema(configurationRegistry_1.configurationDefaultsSchemaId, schemas.configDefaultsSchema);
        }
        checkAndFilterPropertiesRequiringTrust(properties) {
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return properties;
            }
            const result = {};
            Object.entries(properties).forEach(([key, value]) => {
                if (!value.restricted) {
                    result[key] = value;
                }
            });
            return result;
        }
    };
    RegisterConfigurationSchemasContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, extensions_1.IExtensionService),
        __param(4, lifecycle_2.ILifecycleService)
    ], RegisterConfigurationSchemasContribution);
    let ResetConfigurationDefaultsOverridesCache = class ResetConfigurationDefaultsOverridesCache extends lifecycle_1.Disposable {
        constructor(configurationService, extensionService) {
            super();
            if (configurationService.hasCachedConfigurationDefaultsOverrides()) {
                extensionService.whenInstalledExtensionsRegistered().then(() => configurationService.reloadConfiguration(7 /* ConfigurationTarget.DEFAULT */));
            }
        }
    };
    ResetConfigurationDefaultsOverridesCache = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionService)
    ], ResetConfigurationDefaultsOverridesCache);
    let UpdateExperimentalSettingsDefaults = class UpdateExperimentalSettingsDefaults extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.updateExperimentalSettingsDefaults'; }
        constructor(workbenchAssignmentService) {
            super();
            this.workbenchAssignmentService = workbenchAssignmentService;
            this.processedExperimentalSettings = new Set();
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.processExperimentalSettings(Object.keys(this.configurationRegistry.getConfigurationProperties()));
            this._register(this.configurationRegistry.onDidUpdateConfiguration(({ properties }) => this.processExperimentalSettings(properties)));
        }
        async processExperimentalSettings(properties) {
            const overrides = {};
            const allProperties = this.configurationRegistry.getConfigurationProperties();
            for (const property of properties) {
                const schema = allProperties[property];
                if (!schema?.tags?.includes('experimental')) {
                    continue;
                }
                if (this.processedExperimentalSettings.has(property)) {
                    continue;
                }
                this.processedExperimentalSettings.add(property);
                try {
                    const value = await this.workbenchAssignmentService.getTreatment(`config.${property}`);
                    if (!(0, types_1.isUndefined)(value) && !(0, objects_1.equals)(value, schema.default)) {
                        overrides[property] = value;
                    }
                }
                catch (error) { /*ignore */ }
            }
            if (Object.keys(overrides).length) {
                this.configurationRegistry.registerDefaultConfigurations([{ overrides, source: (0, nls_1.localize)('experimental', "Experiments") }]);
            }
        }
    };
    UpdateExperimentalSettingsDefaults = __decorate([
        __param(0, assignmentService_1.IWorkbenchAssignmentService)
    ], UpdateExperimentalSettingsDefaults);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RegisterConfigurationSchemasContribution, 3 /* LifecyclePhase.Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ResetConfigurationDefaultsOverridesCache, 4 /* LifecyclePhase.Eventually */);
    (0, contributions_1.registerWorkbenchContribution2)(UpdateExperimentalSettingsDefaults.ID, UpdateExperimentalSettingsDefaults, 2 /* WorkbenchPhase.BlockRestore */);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_4.workbenchConfigurationNodeBase,
        properties: {
            [configuration_2.APPLY_ALL_PROFILES_SETTING]: {
                'type': 'array',
                description: (0, nls_1.localize)('setting description', "Configure settings to be applied for all profiles."),
                'default': [],
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                additionalProperties: true,
                uniqueItems: true,
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvbi9icm93c2VyL2NvbmZpZ3VyYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStDaEcsU0FBUywrQkFBK0IsQ0FBQyxlQUFpQyxFQUFFLFNBQWtCO1FBQzdGLE9BQU8sQ0FBQyxlQUFlLENBQUMsU0FBUyxJQUFJLGVBQWUsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDO1lBQzlFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLG9DQUFvQixDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzlDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLDRDQUE0QixDQUFDLENBQUMsQ0FBQyw4QkFBYyxDQUFDO0lBQzlELENBQUM7SUFFRCxNQUFNLFNBQVUsU0FBUSxxQkFBYTtRQUFyQzs7WUFDQyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUM5QixDQUFDO0tBQUE7SUFFRCxNQUFhLGdCQUFpQixTQUFRLHNCQUFVO1FBc0MvQyxJQUFJLGtCQUFrQixLQUFLLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQVM3RCxZQUNDLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUF5RSxFQUM5RyxrQkFBdUQsRUFDdEMsc0JBQStDLEVBQy9DLHVCQUFpRCxFQUNqRCxXQUF5QixFQUN6QixrQkFBdUMsRUFDdkMsa0JBQXVDLEVBQ3ZDLFVBQXVCLEVBQ3hDLGFBQTZCO1lBRTdCLEtBQUssRUFBRSxDQUFDO1lBUlMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMvQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2pELGdC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