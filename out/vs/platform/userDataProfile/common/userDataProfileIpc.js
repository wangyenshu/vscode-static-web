/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/userDataProfile/common/userDataProfile", "vs/base/common/uriIpc"], function (require, exports, event_1, lifecycle_1, userDataProfile_1, uriIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesService = exports.RemoteUserDataProfilesServiceChannel = void 0;
    class RemoteUserDataProfilesServiceChannel {
        constructor(service, getUriTransformer) {
            this.service = service;
            this.getUriTransformer = getUriTransformer;
        }
        listen(context, event) {
            const uriTransformer = this.getUriTransformer(context);
            switch (event) {
                case 'onDidChangeProfiles': return event_1.Event.map(this.service.onDidChangeProfiles, e => {
                    return {
                        all: e.all.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer)),
                        added: e.added.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer)),
                        removed: e.removed.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer)),
                        updated: e.updated.map(p => (0, uriIpc_1.transformOutgoingURIs)({ ...p }, uriTransformer))
                    };
                });
            }
            throw new Error(`Invalid listen ${event}`);
        }
        async call(context, command, args) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'createProfile': {
                    const profile = await this.service.createProfile(args[0], args[1], args[2]);
                    return (0, uriIpc_1.transformOutgoingURIs)({ ...profile }, uriTransformer);
                }
                case 'updateProfile': {
                    let profile = (0, userDataProfile_1.reviveProfile)((0, uriIpc_1.transformIncomingURIs)(args[0], uriTransformer), this.service.profilesHome.scheme);
                    profile = await this.service.updateProfile(profile, args[1]);
                    return (0, uriIpc_1.transformOutgoingURIs)({ ...profile }, uriTransformer);
                }
                case 'removeProfile': {
                    const profile = (0, userDataProfile_1.reviveProfile)((0, uriIpc_1.transformIncomingURIs)(args[0], uriTransformer), this.service.profilesHome.scheme);
                    return this.service.removeProfile(profile);
                }
            }
            throw new Error(`Invalid call ${command}`);
        }
    }
    exports.RemoteUserDataProfilesServiceChannel = RemoteUserDataProfilesServiceChannel;
    class UserDataProfilesService extends lifecycle_1.Disposable {
        get defaultProfile() { return this.profiles[0]; }
        get profiles() { return this._profiles; }
        constructor(profiles, profilesHome, channel) {
            super();
            this.profilesHome = profilesHome;
            this.channel = channel;
            this._profiles = [];
            this._onDidChangeProfiles = this._register(new event_1.Emitter());
            this.onDidChangeProfiles = this._onDidChangeProfiles.event;
            this.enabled = true;
            this._profiles = profiles.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
            this._register(this.channel.listen('onDidChangeProfiles')(e => {
                const added = e.added.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                const removed = e.removed.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                const updated = e.updated.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                this._profiles = e.all.map(profile => (0, userDataProfile_1.reviveProfile)(profile, this.profilesHome.scheme));
                this._onDidChangeProfiles.fire({ added, removed, updated, all: this.profiles });
            }));
            this.onDidResetWorkspaces = this.channel.listen('onDidResetWorkspaces');
        }
        setEnablement(enabled) {
            this.enabled = enabled;
        }
        isEnabled() {
            return this.enabled;
        }
        async createNamedProfile(name, options, workspaceIdentifier) {
            const result = await this.channel.call('createNamedProfile', [name, options, workspaceIdentifier]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        async createProfile(id, name, options, workspaceIdentifier) {
            const result = await this.channel.call('createProfile', [id, name, options, workspaceIdentifier]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        async createTransientProfile(workspaceIdentifier) {
            const result = await this.channel.call('createTransientProfile', [workspaceIdentifier]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        async setProfileForWorkspace(workspaceIdentifier, profile) {
            await this.channel.call('setProfileForWorkspace', [workspaceIdentifier, profile]);
        }
        removeProfile(profile) {
            return this.channel.call('removeProfile', [profile]);
        }
        async updateProfile(profile, updateOptions) {
            const result = await this.channel.call('updateProfile', [profile, updateOptions]);
            return (0, userDataProfile_1.reviveProfile)(result, this.profilesHome.scheme);
        }
        resetWorkspaces() {
            return this.channel.call('resetWorkspaces');
        }
        cleanUp() {
            return this.channel.call('cleanUp');
        }
        cleanUpTransientProfiles() {
            return this.channel.call('cleanUpTransientProfiles');
        }
    }
    exports.UserDataProfilesService = UserDataProfilesService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFQcm9maWxlL2NvbW1vbi91c2VyRGF0YVByb2ZpbGVJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsb0NBQW9DO1FBRWhELFlBQ2tCLE9BQWlDLEVBQ2pDLGlCQUEyRDtZQUQzRCxZQUFPLEdBQVAsT0FBTyxDQUEwQjtZQUNqQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQTBDO1FBQ3pFLENBQUM7UUFFTCxNQUFNLENBQUMsT0FBWSxFQUFFLEtBQWE7WUFDakMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxxQkFBcUIsQ0FBQyxDQUFDLE9BQU8sYUFBSyxDQUFDLEdBQUcsQ0FBaUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDbEksT0FBTzt3QkFDTixHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFxQixFQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQzt3QkFDcEUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBQSw4QkFBcUIsRUFBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7d0JBQ3hFLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsOEJB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