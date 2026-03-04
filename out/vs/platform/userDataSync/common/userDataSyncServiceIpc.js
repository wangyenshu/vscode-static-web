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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, uri_1, userDataProfile_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncServiceChannelClient = exports.UserDataSyncServiceChannel = void 0;
    function reviewSyncResource(syncResource, userDataProfilesService) {
        return { ...syncResource, profile: (0, userDataProfile_1.reviveProfile)(syncResource.profile, userDataProfilesService.profilesHome.scheme) };
    }
    function reviewSyncResourceHandle(syncResourceHandle) {
        return { created: syncResourceHandle.created, uri: uri_1.URI.revive(syncResourceHandle.uri) };
    }
    class UserDataSyncServiceChannel {
        constructor(service, userDataProfilesService, logService) {
            this.service = service;
            this.userDataProfilesService = userDataProfilesService;
            this.logService = logService;
            this.manualSyncTasks = new Map();
            this.onManualSynchronizeResources = new event_1.Emitter();
        }
        listen(_, event) {
            switch (event) {
                // sync
                case 'onDidChangeStatus': return this.service.onDidChangeStatus;
                case 'onDidChangeConflicts': return this.service.onDidChangeConflicts;
                case 'onDidChangeLocal': return this.service.onDidChangeLocal;
                case 'onDidChangeLastSyncTime': return this.service.onDidChangeLastSyncTime;
                case 'onSyncErrors': return this.service.onSyncErrors;
                case 'onDidResetLocal': return this.service.onDidResetLocal;
                case 'onDidResetRemote': return this.service.onDidResetRemote;
                // manual sync
                case 'manualSync/onSynchronizeResources': return this.onManualSynchronizeResources.event;
            }
            throw new Error(`[UserDataSyncServiceChannel] Event not found: ${event}`);
        }
        async call(context, command, args) {
            try {
                const result = await this._call(context, command, args);
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        async _call(context, command, args) {
            switch (command) {
                // sync
                case '_getInitialData': return Promise.resolve([this.service.status, this.service.conflicts, this.service.lastSyncTime]);
                case 'reset': return this.service.reset();
                case 'resetRemote': return this.service.resetRemote();
                case 'resetLocal': return this.service.resetLocal();
                case 'hasPreviouslySynced': return this.service.hasPreviouslySynced();
                case 'hasLocalData': return this.service.hasLocalData();
                case 'resolveContent': return this.service.resolveContent(uri_1.URI.revive(args[0]));
                case 'accept': return this.service.accept(reviewSyncResource(args[0], this.userDataProfilesService), uri_1.URI.revive(args[1]), args[2], args[3]);
                case 'replace': return this.service.replace(reviewSyncResourceHandle(args[0]));
                case 'cleanUpRemoteData': return this.service.cleanUpRemoteData();
                case 'getRemoteActivityData': return this.service.saveRemoteActivityData(uri_1.URI.revive(args[0]));
                case 'extractActivityData': return this.service.extractActivityData(uri_1.URI.revive(args[0]), uri_1.URI.revive(args[1]));
                case 'createManualSyncTask': return this.createManualSyncTask();
            }
            // manual sync
            if (command.startsWith('manualSync/')) {
                const manualSyncTaskCommand = command.substring('manualSync/'.length);
                const manualSyncTaskId = args[0];
                const manualSyncTask = this.getManualSyncTask(manualSyncTaskId);
                args = args.slice(1);
                switch (manualSyncTaskCommand) {
                    case 'merge': return manualSyncTask.merge();
                    case 'apply': return manualSyncTask.apply().then(() => this.manualSyncTasks.delete(this.createKey(manualSyncTask.id)));
                    case 'stop': return manualSyncTask.stop().finally(() => this.manualSyncTasks.delete(this.createKey(manualSyncTask.id)));
                }
            }
            throw new Error('Invalid call');
        }
        getManualSyncTask(manualSyncTaskId) {
            const manualSyncTask = this.manualSyncTasks.get(this.createKey(manualSyncTaskId));
            if (!manualSyncTask) {
                throw new Error(`Manual sync taks not found: ${manualSyncTaskId}`);
            }
            return manualSyncTask;
        }
        async createManualSyncTask() {
            const manualSyncTask = await this.service.createManualSyncTask();
            this.manualSyncTasks.set(this.createKey(manualSyncTask.id), manualSyncTask);
            return manualSyncTask.id;
        }
        createKey(manualSyncTaskId) { return `manualSyncTask-${manualSyncTaskId}`; }
    }
    exports.UserDataSyncServiceChannel = UserDataSyncServiceChannel;
    let UserDataSyncServiceChannelClient = class UserDataSyncServiceChannelClient extends lifecycle_1.Disposable {
        get status() { return this._status; }
        get onDidChangeLocal() { return this.channel.listen('onDidChangeLocal'); }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        get onDidResetLocal() { return this.channel.listen('onDidResetLocal'); }
        get onDidResetRemote() { return this.channel.listen('onDidResetRemote'); }
        constructor(userDataSyncChannel, userDataProfilesService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this._status = "uninitialized" /* SyncStatus.Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this.channel = {
                call(command, arg, cancellationToken) {
                    return userDataSyncChannel.call(command, arg, cancellationToken)
                        .then(null, error => { throw userDataSync_1.UserDataSyncError.toUserDataSyncError(error); });
                },
                listen(event, arg) {
                    return userDataSyncChannel.listen(event, arg);
                }
            };
            this.channel.call('_getInitialData').then(([status, conflicts, lastSyncTime]) => {
                this.updateStatus(status);
                this.updateConflicts(conflicts);
                if (lastSyncTime) {
                    this.updateLastSyncTime(lastSyncTime);
                }
                this._register(this.channel.listen('onDidChangeStatus')(status => this.updateStatus(status)));
                this._register(this.channel.listen('onDidChangeLastSyncTime')(lastSyncTime => this.updateLastSyncTime(lastSyncTime)));
            });
            this._register(this.channel.listen('onDidChangeConflicts')(conflicts => this.updateConflicts(conflicts)));
            this._register(this.channel.listen('onSyncErrors')(errors => this._onSyncErrors.fire(errors.map(syncError => ({ ...syncError, error: userDataSync_1.UserDataSyncError.toUserDataSyncError(syncError.error) })))));
        }
        createSyncTask() {
            throw new Error('not supported');
        }
        async createManualSyncTask() {
            const id = await this.channel.call('createManualSyncTask');
            const that = this;
            const manualSyncTaskChannelClient = new ManualSyncTaskChannelClient(id, {
                async call(command, arg, cancellationToken) {
                    return that.channel.call(`manualSync/${command}`, [id, ...(Array.isArray(arg) ? arg : [arg])], cancellationToken);
                },
                listen() {
                    throw new Error('not supported');
                }
            });
            return manualSyncTaskChannelClient;
        }
        reset() {
            return this.channel.call('reset');
        }
        resetRemote() {
            return this.channel.call('resetRemote');
        }
        resetLocal() {
            return this.channel.call('resetLocal');
        }
        hasPreviouslySynced() {
            return this.channel.call('hasPreviouslySynced');
        }
        hasLocalData() {
            return this.channel.call('hasLocalData');
        }
        accept(syncResource, resource, content, apply) {
            return this.channel.call('accept', [syncResource, resource, content, apply]);
        }
        resolveContent(resource) {
            return this.channel.call('resolveContent', [resource]);
        }
        cleanUpRemoteData() {
            return this.channel.call('cleanUpRemoteData');
        }
        replace(syncResourceHandle) {
            return this.channel.call('replace', [syncResourceHandle]);
        }
        saveRemoteActivityData(location) {
            return this.channel.call('getRemoteActivityData', [location]);
        }
        extractActivityData(activityDataResource, location) {
            return this.channel.call('extractActivityData', [activityDataResource, location]);
        }
        async updateStatus(status) {
            this._status = status;
            this._onDidChangeStatus.fire(status);
        }
        async updateConflicts(conflicts) {
            // Revive URIs
            this._conflicts = conflicts.map(syncConflict => ({
                syncResource: syncConflict.syncResource,
                profile: (0, userDataProfile_1.reviveProfile)(syncConflict.profile, this.userDataProfilesService.profilesHome.scheme),
                conflicts: syncConflict.conflicts.map(r => ({
                    ...r,
                    baseResource: uri_1.URI.revive(r.baseResource),
                    localResource: uri_1.URI.revive(r.localResource),
                    remoteResource: uri_1.URI.revive(r.remoteResource),
                    previewResource: uri_1.URI.revive(r.previewResource),
                }))
            }));
            this._onDidChangeConflicts.fire(this._conflicts);
        }
        updateLastSyncTime(lastSyncTime) {
            if (this._lastSyncTime !== lastSyncTime) {
                this._lastSyncTime = lastSyncTime;
                this._onDidChangeLastSyncTime.fire(lastSyncTime);
            }
        }
    };
    exports.UserDataSyncServiceChannelClient = UserDataSyncServiceChannelClient;
    exports.UserDataSyncServiceChannelClient = UserDataSyncServiceChannelClient = __decorate([
        __param(1, userDataProfile_1.IUserDataProfilesService)
    ], UserDataSyncServiceChannelClient);
    class ManualSyncTaskChannelClient extends lifecycle_1.Disposable {
        constructor(id, channel) {
            super();
            this.id = id;
            this.channel = channel;
        }
        async merge() {
            return this.channel.call('merge');
        }
        async apply() {
            return this.channel.call('apply');
        }
        stop() {
            return this.channel.call('stop');
        }
        dispose() {
            this.channel.call('dispose');
            super.dispose();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU2VydmljZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jU2VydmljZUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLFNBQVMsa0JBQWtCLENBQUMsWUFBbUMsRUFBRSx1QkFBaUQ7UUFDakgsT0FBTyxFQUFFLEdBQUcsWUFBWSxFQUFFLE9BQU8sRUFBRSxJQUFBLCtCQUFhLEVBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUN2SCxDQUFDO0lBRUQsU0FBUyx3QkFBd0IsQ0FBQyxrQkFBdUM7UUFDeEUsT0FBTyxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztJQUN6RixDQUFDO0lBRUQsTUFBYSwwQkFBMEI7UUFLdEMsWUFDa0IsT0FBNkIsRUFDN0IsdUJBQWlELEVBQ2pELFVBQXVCO1lBRnZCLFlBQU8sR0FBUCxPQUFPLENBQXNCO1lBQzdCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDakQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQU54QixvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBQzdELGlDQUE0QixHQUFHLElBQUksZUFBTyxFQUFnRCxDQUFDO1FBTXhHLENBQUM7UUFFTCxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWE7WUFDL0IsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixPQUFPO2dCQUNQLEtBQUssbUJBQW1CLENBQUMsQ0FBQyxPQUFP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