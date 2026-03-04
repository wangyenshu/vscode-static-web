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
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataProfilesManifestSync", "vs/base/common/jsonFormatter", "vs/base/common/strings"], function (require, exports, uri_1, nls_1, environment_1, files_1, serviceMachineId_1, storage_1, uriIdentity_1, userDataSync_1, userDataProfile_1, abstractSynchronizer_1, snippetsSync_1, settingsSync_1, keybindingsSync_1, configuration_1, tasksSync_1, extensionsSync_1, globalStateSync_1, instantiation_1, userDataProfilesManifestSync_1, jsonFormatter_1, strings_1) {
    "use strict";
    var UserDataSyncResourceProviderService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncResourceProviderService = void 0;
    let UserDataSyncResourceProviderService = class UserDataSyncResourceProviderService {
        static { UserDataSyncResourceProviderService_1 = this; }
        static { this.NOT_EXISTING_RESOURCE = 'not-existing-resource'; }
        static { this.REMOTE_BACKUP_AUTHORITY = 'remote-backup'; }
        static { this.LOCAL_BACKUP_AUTHORITY = 'local-backup'; }
        constructor(userDataSyncStoreService, userDataSyncLocalStoreService, logService, uriIdentityService, environmentService, storageService, fileService, userDataProfilesService, configurationService, instantiationService) {
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncLocalStoreService = userDataSyncLocalStoreService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.fileService = fileService;
            this.userDataProfilesService = userDataProfilesService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.extUri = uriIdentityService.extUri;
        }
        async getRemoteSyncedProfiles() {
            const userData = await this.userDataSyncStoreService.readResource("profiles" /* SyncResource.Profiles */, null, undefined);
            if (userData.content) {
                const syncData = this.parseSyncData(userData.content, "profiles" /* SyncResource.Profiles */);
                return (0, userDataProfilesManifestSync_1.parseUserDataProfilesManifest)(syncData);
            }
            return [];
        }
        async getLocalSyncedProfiles(location) {
            const refs = await this.userDataSyncLocalStoreService.getAllResourceRefs("profiles" /* SyncResource.Profiles */, undefined, location);
            if (refs.length) {
                const content = await this.userDataSyncLocalStoreService.resolveResourceContent("profiles" /* SyncResource.Profiles */, refs[0].ref, undefined, location);
                if (content) {
                    const syncData = this.parseSyncData(content, "profiles" /* SyncResource.Profiles */);
                    return (0, userDataProfilesManifestSync_1.parseUserDataProfilesManifest)(syncData);
                }
            }
            return [];
        }
        async getLocalSyncedMachines(location) {
            const refs = await this.userDataSyncLocalStoreService.getAllResourceRefs('machines', undefined, location);
            if (refs.length) {
                const content = await this.userDataSyncLocalStoreService.resolveResourceContent('machines', refs[0].ref, undefined, location);
                if (content) {
                    const machinesData = JSON.parse(content);
                    return machinesData.machines.map(m => ({ ...m, isCurrent: false }));
                }
            }
            return [];
        }
        async getRemoteSyncResourceHandles(syncResource, profile) {
            const handles = await this.userDataSyncStoreService.getAllResourceRefs(syncResource, profile?.collection);
            return handles.map(({ created, ref }) => ({
                created,
                uri: this.toUri({
                    remote: true,
                    syncResource,
                    profile: profile?.id ?? this.userDataProfilesService.defaultProfile.id,
                    location: undefined,
                    collection: profile?.collection,
                    ref,
                    node: undefined,
                })
            }));
        }
        async getLocalSyncResourceHandles(syncResource, profile, location) {
            const handles = await this.userDataSyncLocalStoreService.getAllResourceRefs(syncResource, profile?.collection, location);
            return handles.map(({ created, ref }) => ({
                created,
                uri: this.toUri({
                    remote: false,
                    syncResource,
                    profile: profile?.id ?? this.userDataProfilesService.defaultProfile.id,
                    collection: profile?.collection,
                    ref,
                    node: undefined,
                    location,
                })
            }));
        }
        resolveUserDataSyncResource({ uri }) {
            const resolved = this.resolveUri(uri);
            const profile = resolved ? this.userDataProfilesService.profiles.find(p => p.id === resolved.profile) : undefined;
            return resolved && profile ? { profile, syncResource: resolved?.syncResource } : undefined;
        }
        async getAssociatedResources({ uri }) {
            const resolved = this.resolveUri(uri);
            if (!resolved) {
                return [];
            }
            const profile = this.userDataProfilesService.profiles.find(p => p.id === resolved.profile);
            switch (resolved.syncResource) {
                case "settings" /* SyncResource.Settings */: return this.getSettingsAssociatedResources(uri, profile);
                case "keybindings" /* SyncResource.Keybindings */: return this.getKeybindingsAssociatedResources(uri, profile);
                case "tasks" /* SyncResource.Tasks */: return this.getTasksAssociatedResources(uri, profile);
                case "snippets" /* SyncResource.Snippets */: return this.getSnippetsAssociatedResources(uri, profile);
                case "globalState" /* SyncResource.GlobalState */: return this.getGlobalStateAssociatedResources(uri, profile);
                case "extensions" /* SyncResource.Extensions */: return this.getExtensionsAssociatedResources(uri, profile);
                case "profiles" /* SyncResource.Profiles */: return this.getProfilesAssociatedResources(uri, profile);
                case "workspaceState" /* SyncResource.WorkspaceState */: return [];
            }
        }
        async getMachineId({ uri }) {
            const resolved = this.resolveUri(uri);
            if (!resolved) {
                return undefined;
            }
            if (resolved.remote) {
                if (resolved.ref) {
                    const { content } = await this.getUserData(resolved.syncResource, resolved.ref, resolved.collection);
                    if (content) {
                        const syncData = this.parseSyncData(content, resolved.syncResource);
                        return syncData?.machineId;
                    }
                }
                return undefined;
            }
            if (resolved.location) {
                if (resolved.ref) {
                    const content = await this.userDataSyncLocalStoreService.resolveResourceContent(resolved.syncResource, resolved.ref, resolved.collection, resolved.location);
                    if (content) {
                        const syncData = this.parseSyncData(content, resolved.syncResource);
                        return syncData?.machineId;
                    }
                }
                return undefined;
            }
            return (0, serviceMachineId_1.getServiceMachineId)(this.environmentService, this.fileService, this.storageService);
        }
        async resolveContent(uri) {
            const resolved = this.resolveUri(uri);
            if (!resolved) {
                return null;
            }
            if (resolved.node === UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE) {
                return null;
            }
            if (resolved.ref) {
                const content = await this.getContentFromStore(resolved.remote, resolved.syncResource, resolved.collection, resolved.ref, resolved.location);
                if (resolved.node && content) {
                    return this.resolveNodeContent(resolved.syncResource, content, resolved.node);
                }
                return content;
            }
            if (!resolved.remote && !resolved.node) {
                return this.resolveLatestContent(resolved.syncResource, resolved.profile);
            }
            return null;
        }
        async getContentFromStore(remote, syncResource, collection, ref, location) {
            if (remote) {
                const { content } = await this.getUserData(syncResource, ref, collection);
                return content;
            }
            return this.userDataSyncLocalStoreService.resolveResourceContent(syncResource, ref, collection, location);
        }
        resolveNodeContent(syncResource, content, node) {
            const syncData = this.parseSyncData(content, syncResource);
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return this.resolveSettingsNodeContent(syncData, node);
                case "keybindings" /* SyncResource.Keybindings */: return this.resolveKeybindingsNodeContent(syncData, node);
                case "tasks" /* SyncResource.Tasks */: return this.resolveTasksNodeContent(syncData, node);
                case "snippets" /* SyncResource.Snippets */: return this.resolveSnippetsNodeContent(syncData, node);
                case "globalState" /* SyncResource.GlobalState */: return this.resolveGlobalStateNodeContent(syncData, node);
                case "extensions" /* SyncResource.Extensions */: return this.resolveExtensionsNodeContent(syncData, node);
                case "profiles" /* SyncResource.Profiles */: return this.resolveProfileNodeContent(syncData, node);
                case "workspaceState" /* SyncResource.WorkspaceState */: return null;
            }
        }
        async resolveLatestContent(syncResource, profileId) {
            const profile = this.userDataProfilesService.profiles.find(p => p.id === profileId);
            if (!profile) {
                return null;
            }
            switch (syncResource) {
                case "globalState" /* SyncResource.GlobalState */: return this.resolveLatestGlobalStateContent(profile);
                case "extensions" /* SyncResource.Extensions */: return this.resolveLatestExtensionsContent(profile);
                case "profiles" /* SyncResource.Profiles */: return this.resolveLatestProfilesContent(profile);
                case "settings" /* SyncResource.Settings */: return null;
                case "keybindings" /* SyncResource.Keybindings */: return null;
                case "tasks" /* SyncResource.Tasks */: return null;
                case "snippets" /* SyncResource.Snippets */: return null;
                case "workspaceState" /* SyncResource.WorkspaceState */: return null;
            }
        }
        getSettingsAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'settings.json');
            const comparableResource = profile ? profile.settingsResource : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveSettingsNodeContent(syncData, node) {
            switch (node) {
                case 'settings.json':
                    return (0, settingsSync_1.parseSettingsSyncContent)(syncData.content).settings;
            }
            return null;
        }
        getKeybindingsAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'keybindings.json');
            const comparableResource = profile ? profile.keybindingsResource : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveKeybindingsNodeContent(syncData, node) {
            switch (node) {
                case 'keybindings.json':
                    return (0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(syncData.content, !!this.configurationService.getValue(userDataSync_1.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM), this.logService);
            }
            return null;
        }
        getTasksAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'tasks.json');
            const comparableResource = profile ? profile.tasksResource : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveTasksNodeContent(syncData, node) {
            switch (node) {
                case 'tasks.json':
                    return (0, tasksSync_1.getTasksContentFromSyncContent)(syncData.content, this.logService);
            }
            return null;
        }
        async getSnippetsAssociatedResources(uri, profile) {
            const content = await this.resolveContent(uri);
            if (content) {
                const syncData = this.parseSyncData(content, "snippets" /* SyncResource.Snippets */);
                if (syncData) {
                    const snippets = (0, snippetsSync_1.parseSnippets)(syncData);
                    const result = [];
                    for (const snippet of Object.keys(snippets)) {
                        const resource = this.extUri.joinPath(uri, snippet);
                        const comparableResource = profile ? this.extUri.joinPath(profile.snippetsHome, snippet) : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
                        result.push({ resource, comparableResource });
                    }
                    return result;
                }
            }
            return [];
        }
        resolveSnippetsNodeContent(syncData, node) {
            return (0, snippetsSync_1.parseSnippets)(syncData)[node] || null;
        }
        getExtensionsAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'extensions.json');
            const comparableResource = profile
                ? this.toUri({
                    remote: false,
                    syncResource: "extensions" /* SyncResource.Extensions */,
                    profile: profile.id,
                    location: undefined,
                    collection: undefined,
                    ref: undefined,
                    node: undefined,
                })
                : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveExtensionsNodeContent(syncData, node) {
            switch (node) {
                case 'extensions.json':
                    return (0, extensionsSync_1.stringify)((0, extensionsSync_1.parseExtensions)(syncData), true);
            }
            return null;
        }
        async resolveLatestExtensionsContent(profile) {
            const { localExtensions } = await this.instantiationService.createInstance(extensionsSync_1.LocalExtensionsProvider).getLocalExtensions(profile);
            return (0, extensionsSync_1.stringify)(localExtensions, true);
        }
        getGlobalStateAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'globalState.json');
            const comparableResource = profile
                ? this.toUri({
                    remote: false,
                    syncResource: "globalState" /* SyncResource.GlobalState */,
                    profile: profile.id,
                    location: undefined,
                    collection: undefined,
                    ref: undefined,
                    node: undefined,
                })
                : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveGlobalStateNodeContent(syncData, node) {
            switch (node) {
                case 'globalState.json':
                    return (0, globalStateSync_1.stringify)(JSON.parse(syncData.content), true);
            }
            return null;
        }
        async resolveLatestGlobalStateContent(profile) {
            const localGlobalState = await this.instantiationService.createInstance(globalStateSync_1.LocalGlobalStateProvider).getLocalGlobalState(profile);
            return (0, globalStateSync_1.stringify)(localGlobalState, true);
        }
        getProfilesAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'profiles.json');
            const comparableResource = this.toUri({
                remote: false,
                syncResource: "profiles" /* SyncResource.Profiles */,
                profile: this.userDataProfilesService.defaultProfile.id,
                location: undefined,
                collection: undefined,
                ref: undefined,
                node: undefined,
            });
            return [{ resource, comparableResource }];
        }
        resolveProfileNodeContent(syncData, node) {
            switch (node) {
                case 'profiles.json':
                    return (0, jsonFormatter_1.toFormattedString)(JSON.parse(syncData.content), {});
            }
            return null;
        }
        async resolveLatestProfilesContent(profile) {
            return (0, userDataProfilesManifestSync_1.stringifyLocalProfiles)(this.userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient), true);
        }
        toUri(syncResourceUriInfo) {
            const authority = syncResourceUriInfo.remote ? UserDataSyncResourceProviderService_1.REMOTE_BACKUP_AUTHORITY : UserDataSyncResourceProviderService_1.LOCAL_BACKUP_AUTHORITY;
            const paths = [];
            if (syncResourceUriInfo.location) {
                paths.push(`scheme:${syncResourceUriInfo.location.scheme}`);
                paths.push(`authority:${syncResourceUriInfo.location.authority}`);
                paths.push((0, strings_1.trim)(syncResourceUriInfo.location.path, '/'));
            }
            paths.push(`syncResource:${syncResourceUriInfo.syncResource}`);
            paths.push(`profile:${syncResourceUriInfo.profile}`);
            if (syncResourceUriInfo.collection) {
                paths.push(`collection:${syncResourceUriInfo.collection}`);
            }
            if (syncResourceUriInfo.ref) {
                paths.push(`ref:${syncResourceUriInfo.ref}`);
            }
            if (syncResourceUriInfo.node) {
                paths.push(syncResourceUriInfo.node);
            }
            return this.extUri.joinPath(uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority, path: `/`, query: syncResourceUriInfo.location?.query, fragment: syncResourceUriInfo.location?.fragment }), ...paths);
        }
        resolveUri(uri) {
            if (uri.scheme !== userDataSync_1.USER_DATA_SYNC_SCHEME) {
                return undefined;
            }
            const paths = [];
            while (uri.path !== '/') {
                paths.unshift(this.extUri.basename(uri));
                uri = this.extUri.dirname(uri);
            }
            if (paths.length < 2) {
                return undefined;
            }
            const remote = uri.authority === UserDataSyncResourceProviderService_1.REMOTE_BACKUP_AUTHORITY;
            let scheme;
            let authority;
            const locationPaths = [];
            let syncResource;
            let profile;
            let collection;
            let ref;
            let node;
            while (paths.length) {
                const path = paths.shift();
                if (path.startsWith('scheme:')) {
                    scheme = path.substring('scheme:'.length);
                }
                else if (path.startsWith('authority:')) {
                    authority = path.substring('authority:'.length);
                }
                else if (path.startsWith('syncResource:')) {
                    syncResource = path.substring('syncResource:'.length);
                }
                else if (path.startsWith('profile:')) {
                    profile = path.substring('profile:'.length);
                }
                else if (path.startsWith('collection:')) {
                    collection = path.substring('collection:'.length);
                }
                else if (path.startsWith('ref:')) {
                    ref = path.substring('ref:'.length);
                }
                else if (!syncResource) {
                    locationPaths.push(path);
                }
                else {
                    node = path;
                }
            }
            return {
                remote,
                syncResource: syncResource,
                profile: profile,
                collection,
                ref,
                node,
                location: scheme && authority !== undefined ? this.extUri.joinPath(uri_1.URI.from({ scheme, authority, query: uri.query, fragment: uri.fragment, path: '/' }), ...locationPaths) : undefined
            };
        }
        parseSyncData(content, syncResource) {
            try {
                const syncData = JSON.parse(content);
                if ((0, abstractSynchronizer_1.isSyncData)(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('incompatible sync data', "Cannot parse sync data as it is not compatible with the current version."), "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */, syncResource);
        }
        async getUserData(syncResource, ref, collection) {
            const content = await this.userDataSyncStoreService.resolveResourceContent(syncResource, ref, collection);
            return { ref, content };
        }
    };
    exports.UserDataSyncResourceProviderService = UserDataSyncResourceProviderService;
    exports.UserDataSyncResourceProviderService = UserDataSyncResourceProviderService = UserDataSyncResourceProviderService_1 = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, files_1.IFileService),
        __param(7, userDataProfile_1.IUserDataProfilesService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, instantiation_1.IInstantiationService)
    ], UserDataSyncResourceProviderService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jUmVzb3VyY2VQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jUmVzb3VyY2VQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0N6RixJQUFNLG1DQUFtQyxHQUF6QyxNQUFNLG1DQUFtQzs7aUJBSXZCLDBCQUFxQixHQUFHLHVCQUF1QixBQUExQixDQUEyQjtpQkFDaEQsNEJBQXVCLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtpQkFDMUMsMkJBQXNCLEdBQUcsY0FBYyxBQUFqQixDQUFrQjtRQUloRSxZQUM2Qyx3QkFBbUQsRUFDOUMsNkJBQTZELEVBQ2xFLFVBQW1DLEVBQzFELGtCQUF1QyxFQUN0QixrQkFBdUMsRUFDM0MsY0FBK0IsRUFDbEMsV0FBeUIsRUFDYix1QkFBaUQsRUFDcEQsb0JBQTJDLEVBQzNDLG9CQUEyQztZQVR2Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQzlDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDbEUsZUFBVSxHQUFWLFVBQVUsQ0FBeUI7WUFFekMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbEMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDYiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3BELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVuRixJQUFJLENBQUMsTUFBTSxHQUFHLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztRQUN6QyxDQUFDO1FBRUQsS0FBSyxDQUFDLHVCQUF1QjtZQUM1QixN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