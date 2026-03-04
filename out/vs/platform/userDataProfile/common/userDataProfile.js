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
define(["require", "exports", "vs/base/common/hash", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/async", "vs/base/common/uuid", "vs/base/common/strings", "vs/base/common/types"], function (require, exports, hash_1, event_1, lifecycle_1, resources_1, uri_1, nls_1, environment_1, files_1, instantiation_1, log_1, workspace_1, map_1, uriIdentity_1, async_1, uuid_1, strings_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryUserDataProfilesService = exports.UserDataProfilesService = exports.IUserDataProfilesService = exports.ProfileResourceType = void 0;
    exports.isUserDataProfile = isUserDataProfile;
    exports.reviveProfile = reviveProfile;
    exports.toUserDataProfile = toUserDataProfile;
    var ProfileResourceType;
    (function (ProfileResourceType) {
        ProfileResourceType["Settings"] = "settings";
        ProfileResourceType["Keybindings"] = "keybindings";
        ProfileResourceType["Snippets"] = "snippets";
        ProfileResourceType["Tasks"] = "tasks";
        ProfileResourceType["Extensions"] = "extensions";
        ProfileResourceType["GlobalState"] = "globalState";
    })(ProfileResourceType || (exports.ProfileResourceType = ProfileResourceType = {}));
    function isUserDataProfile(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && typeof candidate.id === 'string'
            && typeof candidate.isDefault === 'boolean'
            && typeof candidate.name === 'string'
            && uri_1.URI.isUri(candidate.location)
            && uri_1.URI.isUri(candidate.globalStorageHome)
            && uri_1.URI.isUri(candidate.settingsResource)
            && uri_1.URI.isUri(candidate.keybindingsResource)
            && uri_1.URI.isUri(candidate.tasksResource)
            && uri_1.URI.isUri(candidate.snippetsHome)
            && uri_1.URI.isUri(candidate.extensionsResource));
    }
    exports.IUserDataProfilesService = (0, instantiation_1.createDecorator)('IUserDataProfilesService');
    function reviveProfile(profile, scheme) {
        return {
            id: profile.id,
            isDefault: profile.isDefault,
            name: profile.name,
            shortName: profile.shortName,
            icon: profile.icon,
            location: uri_1.URI.revive(profile.location).with({ scheme }),
            globalStorageHome: uri_1.URI.revive(profile.globalStorageHome).with({ scheme }),
            settingsResource: uri_1.URI.revive(profile.settingsResource).with({ scheme }),
            keybindingsResource: uri_1.URI.revive(profile.keybindingsResource).with({ scheme }),
            tasksResource: uri_1.URI.revive(profile.tasksResource).with({ scheme }),
            snippetsHome: uri_1.URI.revive(profile.snippetsHome).with({ scheme }),
            extensionsResource: uri_1.URI.revive(profile.extensionsResource).with({ scheme }),
            cacheHome: uri_1.URI.revive(profile.cacheHome).with({ scheme }),
            useDefaultFlags: profile.useDefaultFlags,
            isTransient: profile.isTransient,
        };
    }
    function toUserDataProfile(id, name, location, profilesCacheHome, options, defaultProfile) {
        return {
            id,
            name,
            location,
            isDefault: false,
            shortName: options?.shortName,
            icon: options?.icon,
            globalStorageHome: defaultProfile && options?.useDefaultFlags?.globalState ? defaultProfile.globalStorageHome : (0, resources_1.joinPath)(location, 'globalStorage'),
            settingsResource: defaultProfile && options?.useDefaultFlags?.settings ? defaultProfile.settingsResource : (0, resources_1.joinPath)(location, 'settings.json'),
            keybindingsResource: defaultProfile && options?.useDefaultFlags?.keybindings ? defaultProfile.keybindingsResource : (0, resources_1.joinPath)(location, 'keybindings.json'),
            tasksResource: defaultProfile && options?.useDefaultFlags?.tasks ? defaultProfile.tasksResource : (0, resources_1.joinPath)(location, 'tasks.json'),
            snippetsHome: defaultProfile && options?.useDefaultFlags?.snippets ? defaultProfile.snippetsHome : (0, resources_1.joinPath)(location, 'snippets'),
            extensionsResource: defaultProfile && options?.useDefaultFlags?.extensions ? defaultProfile.extensionsResource : (0, resources_1.joinPath)(location, 'extensions.json'),
            cacheHome: (0, resources_1.joinPath)(profilesCacheHome, id),
            useDefaultFlags: options?.useDefaultFlags,
            isTransient: options?.transient
        };
    }
    let UserDataProfilesService = class UserDataProfilesService extends lifecycle_1.Disposable {
        static { this.PROFILES_KEY = 'userDataProfiles'; }
        static { this.PROFILE_ASSOCIATIONS_KEY = 'profileAssociations'; }
        get defaultProfile() { return this.profiles[0]; }
        get profiles() { return [...this.profilesObject.profiles, ...this.transientProfilesObject.profiles]; }
        constructor(environmentService, fileService, uriIdentityService, logService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.enabled = true;
            this._onDidChangeProfiles = this._register(new event_1.Emitter());
            this.onDidChangeProfiles = this._onDidChangeProfiles.event;
            this._onWillCreateProfile = this._register(new event_1.Emitter());
            this.onWillCreateProfile = this._onWillCreateProfile.event;
            this._onWillRemoveProfile = this._register(new event_1.Emitter());
            this.onWillRemoveProfile = this._onWillRemoveProfile.event;
            this._onDidResetWorkspaces = this._register(new event_1.Emitter());
            this.onDidResetWorkspaces = this._onDidResetWorkspaces.event;
            this.profileCreationPromises = new Map();
            this.transientProfilesObject = {
                profiles: [],
                workspaces: new map_1.ResourceMap(),
                emptyWindows: new Map()
            };
            this.profilesHome = (0, resources_1.joinPath)(this.environmentService.userRoamingDataHome, 'profiles');
            this.profilesCacheHome = (0, resources_1.joinPath)(this.environmentService.cacheHome, 'CachedProfilesData');
        }
        init() {
            this._profilesObject = undefined;
        }
        setEnablement(enabled) {
            if (this.enabled !== enabled) {
                this._profilesObject = undefined;
                this.enabled = enabled;
            }
        }
        isEnabled() {
            return this.enabled;
        }
        get profilesObject() {
            if (!this._profilesObject) {
                const defaultProfile = this.createDefaultProfile();
                const profiles = [defaultProfile];
                if (this.enabled) {
                    try {
                        for (const storedProfile of this.getStoredProfiles()) {
                            if (!storedProfile.name || !(0, types_1.isString)(storedProfile.name) || !storedProfile.location) {
                                this.logService.warn('Skipping the invalid stored profile', storedProfile.location || storedProfile.name);
                                continue;
                            }
                            profiles.push(toUserDataProfile((0, resources_1.basename)(storedProfile.location), storedProfile.name, storedProfile.location, this.profilesCacheHome, { shortName: storedProfile.shortName, icon: storedProfile.icon, useDefaultFlags: storedProfile.useDefaultFlags }, defaultProfile));
                        }
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
                const workspaces = new map_1.ResourceMap();
                const emptyWindows = new Map();
                if (profiles.length) {
                    try {
                        const profileAssociaitions = this.getStoredProfileAssociations();
                        if (profileAssociaitions.workspaces) {
                            for (const [workspacePath, profileId] of Object.entries(profileAssociaitions.workspaces)) {
                                const workspace = uri_1.URI.parse(workspacePath);
                                const profile = profiles.find(p => p.id === profileId);
                                if (profile) {
                                    workspaces.set(workspace, profile);
                                }
                            }
                        }
                        if (profileAssociaitions.emptyWindows) {
                            for (const [windowId, profileId] of Object.entries(profileAssociaitions.emptyWindows)) {
                                const profile = profiles.find(p => p.id === profileId);
                                if (profile) {
                                    emptyWindows.set(windowId, profile);
                                }
                            }
                        }
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
                this._profilesObject = { profiles, workspaces, emptyWindows };
            }
            return this._profilesObject;
        }
        createDefaultProfile() {
            const defaultProfile = toUserDataProfile('__default__profile__', (0, nls_1.localize)('defaultProfile', "Default"), this.environmentService.userRoamingDataHome, this.profilesCacheHome);
            return { ...defaultProfile, extensionsResource: this.getDefaultProfileExtensionsLocation() ?? defaultProfile.extensionsResource, isDefault: true };
        }
        async createTransientProfile(workspaceIdentifier) {
            const namePrefix = `Temp`;
            const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(namePrefix)}\\s(\\d+)`);
            let nameIndex = 0;
            for (const profile of this.profiles) {
                const matches = nameRegEx.exec(profile.name);
                const index = matches ? parseInt(matches[1]) : 0;
                nameIndex = index > nameIndex ? index : nameIndex;
            }
            const name = `${namePrefix} ${nameIndex + 1}`;
            return this.createProfile((0, hash_1.hash)((0, uuid_1.generateUuid)()).toString(16), name, { transient: true }, workspaceIdentifier);
        }
        async createNamedProfile(name, options, workspaceIdentifier) {
            return this.createProfile((0, hash_1.hash)((0, uuid_1.generateUuid)()).toString(16), name, options, workspaceIdentifier);
        }
        async createProfile(id, name, options, workspaceIdentifier) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            const profile = await this.doCreateProfile(id, name, options);
            if (workspaceIdentifier) {
                await this.setProfileForWorkspace(workspaceIdentifier, profile);
            }
            return profile;
        }
        async doCreateProfile(id, name, options) {
            if (!(0, types_1.isString)(name) || !name) {
                throw new Error('Name of the profile is mandatory and must be of type `string`');
            }
            let profileCreationPromise = this.profileCreationPromises.get(name);
            if (!profileCreationPromise) {
                profileCreationPromise = (async () => {
                    try {
                        const existing = this.profiles.find(p => p.name === name || p.id === id);
                        if (existing) {
                            throw new Error(`Profile with ${name} name already exists`);
                        }
                        const profile = toUserDataProfile(id, name, (0, resources_1.joinPath)(this.profilesHome, id), this.profilesCacheHome, options, this.defaultProfile);
                        await this.fileService.createFolder(profile.location);
                        const joiners = [];
                        this._onWillCreateProfile.fire({
                            profile,
                            join(promise) {
                                joiners.push(promise);
                            }
                        });
                        await async_1.Promises.settled(joiners);
                        this.updateProfiles([profile], [], []);
                        return profile;
                    }
                    finally {
                        this.profileCreationPromises.delete(name);
                    }
                })();
                this.profileCreationPromises.set(name, profileCreationPromise);
            }
            return profileCreationPromise;
        }
        async updateProfile(profileToUpdate, options) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            let profile = this.profiles.find(p => p.id === profileToUpdate.id);
            if (!profile) {
                throw new Error(`Profile '${profileToUpdate.name}' does not exist`);
            }
            profile = toUserDataProfile(profile.id, options.name ?? profile.name, profile.location, this.profilesCacheHome, {
                shortName: options.shortName ?? profile.shortName,
                icon: options.icon === null ? undefined : options.icon ?? profile.icon,
                transient: options.transient ?? profile.isTransient,
                useDefaultFlags: options.useDefaultFlags ?? profile.useDefaultFlags
            }, this.defaultProfile);
            this.updateProfiles([], [], [profile]);
            return profile;
        }
        async removeProfile(profileToRemove) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            if (profileToRemove.isDefault) {
                throw new Error('Cannot remove default profile');
            }
            const profile = this.profiles.find(p => p.id === profileToRemove.id);
            if (!profile) {
                throw new Error(`Profile '${profileToRemove.name}' does not exist`);
            }
            const joiners = [];
            this._onWillRemoveProfile.fire({
                profile,
                join(promise) {
                    joiners.push(promise);
                }
            });
            try {
                await Promise.allSettled(joiners);
            }
            catch (error) {
                this.logService.error(error);
            }
            for (const windowId of [...this.profilesObject.emptyWindows.keys()]) {
                if (profile.id === this.profilesObject.emptyWindows.get(windowId)?.id) {
                    this.profilesObject.emptyWindows.delete(windowId);
                }
            }
            for (const workspace of [...this.profilesObject.workspaces.keys()]) {
                if (profile.id === this.profilesObject.workspaces.get(workspace)?.id) {
                    this.profilesObject.workspaces.delete(workspace);
                }
            }
            this.updateStoredProfileAssociations();
            this.updateProfiles([], [profile], []);
            try {
                await this.fileService.del(profile.cacheHome, { recursive: true });
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        async setProfileForWorkspace(workspaceIdentifier, profileToSet) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            const profile = this.profiles.find(p => p.id === profileToSet.id);
            if (!profile) {
                throw new Error(`Profile '${profileToSet.name}' does not exist`);
            }
            this.updateWorkspaceAssociation(workspaceIdentifier, profile);
        }
        unsetWorkspace(workspaceIdentifier, transient) {
            if (!this.enabled) {
                throw new Error(`Profiles are disabled in the current environment.`);
            }
            this.updateWorkspaceAssociation(workspaceIdentifier, undefined, transient);
        }
        async resetWorkspaces() {
            this.transientProfilesObject.workspaces.clear();
            this.transientProfilesObject.emptyWindows.clear();
            this.profilesObject.workspaces.clear();
            this.profilesObject.emptyWindows.clear();
            this.updateStoredProfileAssociations();
            this._onDidResetWorkspaces.fire();
        }
        async cleanUp() {
            if (!this.enabled) {
                return;
            }
            if (await this.fileService.exists(this.profilesHome)) {
                const stat = await this.fileService.resolve(this.profilesHome);
                await Promise.all((stat.children || [])
                    .filter(child => child.isDirectory && this.profiles.every(p => !this.uriIdentityService.extUri.isEqual(p.location, child.resource)))
                    .map(child => this.fileService.del(child.resource, { recursive: true })));
            }
        }
        async cleanUpTransientProfiles() {
            if (!this.enabled) {
                return;
            }
            const unAssociatedTransientProfiles = this.transientProfilesObject.profiles.filter(p => !this.isProfileAssociatedToWorkspace(p));
            await Promise.allSettled(unAssociatedTransientProfiles.map(p => this.removeProfile(p)));
        }
        getProfileForWorkspace(workspaceIdentifier) {
            const workspace = this.getWorkspace(workspaceIdentifier);
            return uri_1.URI.isUri(workspace) ? this.transientProfilesObject.workspaces.get(workspace) ?? this.profilesObject.workspaces.get(workspace) : this.transientProfilesObject.emptyWindows.get(workspace) ?? this.profilesObject.emptyWindows.get(workspace);
        }
        getWorkspace(workspaceIdentifier) {
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return workspaceIdentifier.uri;
            }
            if ((0, workspace_1.isWorkspaceIdentifier)(workspaceIdentifier)) {
                return workspaceIdentifier.configPath;
            }
            return workspaceIdentifier.id;
        }
        isProfileAssociatedToWorkspace(profile) {
            if ([...this.transientProfilesObject.emptyWindows.values()].some(windowProfile => this.uriIdentityService.extUri.isEqual(windowProfile.location, profile.location))) {
                return true;
            }
            if ([...this.transientProfilesObject.workspaces.values()].some(workspaceProfile => this.uriIdentityService.extUri.isEqual(workspaceProfile.location, profile.location))) {
                return true;
            }
            if ([...this.profilesObject.emptyWindows.values()].some(windowProfile => this.uriIdentityService.extUri.isEqual(windowProfile.location, profile.location))) {
                return true;
            }
            if ([...this.profilesObject.workspaces.values()].some(workspaceProfile => this.uriIdentityService.extUri.isEqual(workspaceProfile.location, profile.location))) {
                return true;
            }
            return false;
        }
        updateProfiles(added, removed, updated) {
            const allProfiles = [...this.profiles, ...added];
            const storedProfiles = [];
            this.transientProfilesObject.profiles = [];
            for (let profile of allProfiles) {
                if (profile.isDefault) {
                    continue;
                }
                if (removed.some(p => profile.id === p.id)) {
                    continue;
                }
                profile = updated.find(p => profile.id === p.id) ?? profile;
                if (profile.isTransient) {
                    this.transientProfilesObject.profiles.push(profile);
                }
                else {
                    storedProfiles.push({ location: profile.location, name: profile.name, shortName: profile.shortName, icon: profile.icon, useDefaultFlags: profile.useDefaultFlags });
                }
            }
            this.saveStoredProfiles(storedProfiles);
            this._profilesObject = undefined;
            this.triggerProfilesChanges(added, removed, updated);
        }
        triggerProfilesChanges(added, removed, updated) {
            this._onDidChangeProfiles.fire({ added, removed, updated, all: this.profiles });
        }
        updateWorkspaceAssociation(workspaceIdentifier, newProfile, transient) {
            // Force transient if the new profile to associate is transient
            transient = newProfile?.isTransient ? true : transient;
            if (!transient) {
                // Unset the transiet workspace association if any
                this.updateWorkspaceAssociation(workspaceIdentifier, undefined, true);
            }
            const workspace = this.getWorkspace(workspaceIdentifier);
            const profilesObject = transient ? this.transientProfilesObject : this.profilesObject;
            // Folder or Multiroot workspace
            if (uri_1.URI.isUri(workspace)) {
                profilesObject.workspaces.delete(workspace);
                if (newProfile) {
                    profilesObject.workspaces.set(workspace, newProfile);
                }
            }
            // Empty Window
            else {
                profilesObject.emptyWindows.delete(workspace);
                if (newProfile) {
                    profilesObject.emptyWindows.set(workspace, newProfile);
                }
            }
            if (!transient) {
                this.updateStoredProfileAssociations();
            }
        }
        updateStoredProfileAssociations() {
            const workspaces = {};
            for (const [workspace, profile] of this.profilesObject.workspaces.entries()) {
                workspaces[workspace.toString()] = profile.id;
            }
            const emptyWindows = {};
            for (const [windowId, profile] of this.profilesObject.emptyWindows.entries()) {
                emptyWindows[windowId.toString()] = profile.id;
            }
            this.saveStoredProfileAssociations({ workspaces, emptyWindows });
            this._profilesObject = undefined;
        }
        // TODO: @sandy081 Remove migration after couple of releases
        migrateStoredProfileAssociations(storedProfileAssociations) {
            const workspaces = {};
            const defaultProfile = this.createDefaultProfile();
            if (storedProfileAssociations.workspaces) {
                for (const [workspace, location] of Object.entries(storedProfileAssociations.workspaces)) {
                    const uri = uri_1.URI.parse(location);
                    workspaces[workspace] = this.uriIdentityService.extUri.isEqual(uri, defaultProfile.location) ? defaultProfile.id : this.uriIdentityService.extUri.basename(uri);
                }
            }
            const emptyWindows = {};
            if (storedProfileAssociations.emptyWindows) {
                for (const [workspace, location] of Object.entries(storedProfileAssociations.emptyWindows)) {
                    const uri = uri_1.URI.parse(location);
                    emptyWindows[workspace] = this.uriIdentityService.extUri.isEqual(uri, defaultProfile.location) ? defaultProfile.id : this.uriIdentityService.extUri.basename(uri);
                }
            }
            return { workspaces, emptyWindows };
        }
        getStoredProfiles() { return []; }
        saveStoredProfiles(storedProfiles) { throw new Error('not implemented'); }
        getStoredProfileAssociations() { return {}; }
        saveStoredProfileAssociations(storedProfileAssociations) { throw new Error('not implemented'); }
        getDefaultProfileExtensionsLocation() { return undefined; }
    };
    exports.UserDataProfilesService = UserDataProfilesService;
    exports.UserDataProfilesService = UserDataProfilesService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], UserDataProfilesService);
    class InMemoryUserDataProfilesService extends UserDataProfilesService {
        constructor() {
            super(...arguments);
            this.storedProfiles = [];
            this.storedProfileAssociations = {};
        }
        getStoredProfiles() { return this.storedProfiles; }
        saveStoredProfiles(storedProfiles) { this.storedProfiles = storedProfiles; }
        getStoredProfileAssociations() { return this.storedProfileAssociations; }
        saveStoredProfileAssociations(storedProfileAssociations) { this.storedProfileAssociations = storedProfileAssociations; }
    }
    exports.InMemoryUserDataProfilesService = InMemoryUserDataProfilesService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFQcm9maWxlL2NvbW1vbi91c2VyRGF0YVByb2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcURoRyw4Q0FlQztJQW9ERCxzQ0FrQkM7SUFFRCw4Q0FrQkM7SUF6SUQsSUFBa0IsbUJBT2pCO0lBUEQsV0FBa0IsbUJBQW1CO1FBQ3BDLDRDQUFxQixDQUFBO1FBQ3JCLGtEQUEyQixDQUFBO1FBQzNCLDRDQUFxQixDQUFBO1FBQ3JCLHNDQUFlLENBQUE7UUFDZixnREFBeUIsQ0FBQTtRQUN6QixrREFBMkIsQ0FBQTtJQUM1QixDQUFDLEVBUGlCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBT3BDO0lBeUJELFNBQWdCLGlCQUFpQixDQUFDLEtBQWM7UUFDL0MsTUFBTSxTQUFTLEdBQUcsS0FBcUMsQ0FBQztRQUV4RCxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRO2VBQ2hELE9BQU8sU0FBUyxDQUFDLEVBQUUsS0FBSyxRQUFRO2VBQ2hDLE9BQU8sU0FBUyxDQUFDLFNBQVMsS0FBSyxTQUFTO2VBQ3hDLE9BQU8sU0FBUyxDQUFDLElBQUksS0FBSyxRQUFRO2VBQ2xDLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztlQUM3QixTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQztlQUN0QyxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztlQUNyQyxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztlQUN4QyxTQUFHLENBQUMsS0FBSyxDQUFD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