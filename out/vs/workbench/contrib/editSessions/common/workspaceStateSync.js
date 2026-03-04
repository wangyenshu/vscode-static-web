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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/marshalling", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/workbench/contrib/editSessions/common/editSessions", "vs/workbench/services/workspaces/common/workspaceIdentityService"], function (require, exports, cancellation_1, event_1, marshalling_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, editSessions_1, workspaceIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceStateSynchroniser = void 0;
    class NullBackupStoreService {
        async writeResource() {
            return;
        }
        async getAllResourceRefs() {
            return [];
        }
        async resolveResourceContent() {
            return null;
        }
    }
    class NullEnablementService {
        constructor() {
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._onDidChangeResourceEnablement = new event_1.Emitter();
            this.onDidChangeResourceEnablement = this._onDidChangeResourceEnablement.event;
        }
        isEnabled() { return true; }
        canToggleEnablement() { return true; }
        setEnablement(_enabled) { }
        isResourceEnabled(_resource) { return true; }
        setResourceEnablement(_resource, _enabled) { }
        getResourceSyncStateVersion(_resource) { return undefined; }
    }
    let WorkspaceStateSynchroniser = class WorkspaceStateSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(profile, collection, userDataSyncStoreService, logService, fileService, environmentService, telemetryService, configurationService, storageService, uriIdentityService, workspaceIdentityService, editSessionsStorageService) {
            const userDataSyncLocalStoreService = new NullBackupStoreService();
            const userDataSyncEnablementService = new NullEnablementService();
            super({ syncResource: "workspaceState" /* SyncResource.WorkspaceState */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.workspaceIdentityService = workspaceIdentityService;
            this.editSessionsStorageService = editSessionsStorageService;
            this.version = 1;
        }
        async sync() {
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const folders = await this.workspaceIdentityService.getWorkspaceStateFolders(cancellationTokenSource.token);
            if (!folders.length) {
                return;
            }
            // Ensure we have latest state by sending out onWillSaveState event
            await this.storageService.flush();
            const keys = this.storageService.keys(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            if (!keys.length) {
                return;
            }
            const contributedData = {};
            keys.forEach((key) => {
                const data = this.storageService.get(key, 1 /* StorageScope.WORKSPACE */);
                if (data) {
                    contributedData[key] = data;
                }
            });
            const content = { folders, storage: contributedData, version: this.version };
            await this.editSessionsStorageService.write('workspaceState', (0, marshalling_1.stringify)(content));
        }
        async apply() {
            const payload = this.editSessionsStorageService.lastReadResources.get('editSessions')?.content;
            const workspaceStateId = payload ? JSON.parse(payload).workspaceStateId : undefined;
            const resource = await this.editSessionsStorageService.read('workspaceState', workspaceStateId);
            if (!resource) {
                return null;
            }
            const remoteWorkspaceState = (0, marshalling_1.parse)(resource.content);
            if (!remoteWorkspaceState) {
                this.logService.info('Skipping initializing workspace state because remote workspace state does not exist.');
                return null;
            }
            // Evaluate whether storage is applicable for current workspace
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const replaceUris = await this.workspaceIdentityService.matches(remoteWorkspaceState.folders, cancellationTokenSource.token);
            if (!replaceUris) {
                this.logService.info('Skipping initializing workspace state because remote workspace state does not match current workspace.');
                return null;
            }
            const storage = {};
            for (const key of Object.keys(remoteWorkspaceState.storage)) {
                storage[key] = remoteWorkspaceState.storage[key];
            }
            if (Object.keys(storage).length) {
                // Initialize storage with remote storage
                const storageEntries = [];
                for (const key of Object.keys(storage)) {
                    // Deserialize the stored state
                    try {
                        const value = (0, marshalling_1.parse)(storage[key]);
                        // Run URI conversion on the stored state
                        replaceUris(value);
                        storageEntries.push({ key, value, scope: 1 /* StorageScope.WORKSPACE */, target: 0 /* StorageTarget.USER */ });
                    }
                    catch {
                        storageEntries.push({ key, value: storage[key], scope: 1 /* StorageScope.WORKSPACE */, target: 0 /* StorageTarget.USER */ });
                    }
                }
                this.storageService.storeAll(storageEntries, true);
            }
            this.editSessionsStorageService.delete('workspaceState', resource.ref);
            return null;
        }
        // TODO@joyceerhl implement AbstractSynchronizer in full
        applyResult(remoteUserData, lastSyncUserData, result, force) {
            throw new Error('Method not implemented.');
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration, token) {
            return [];
        }
        getMergeResult(resourcePreview, token) {
            throw new Error('Method not implemented.');
        }
        getAcceptResult(resourcePreview, resource, content, token) {
            throw new Error('Method not implemented.');
        }
        async hasRemoteChanged(lastSyncUserData) {
            return true;
        }
        async hasLocalData() {
            return false;
        }
        async resolveContent(uri) {
            return null;
        }
    };
    exports.WorkspaceStateSynchroniser = WorkspaceStateSynchroniser;
    exports.WorkspaceStateSynchroniser = WorkspaceStateSynchroniser = __decorate([
        __param(4, files_1.IFileService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, storage_1.IStorageService),
        __param(9, uriIdentity_1.IUriIdentityService),
        __param(10, workspaceIdentityService_1.IWorkspaceIdentityService),
        __param(11, editSessions_1.IEditSessionsStorageService)
    ], WorkspaceStateSynchroniser);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlU3RhdGVTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZWRpdFNlc3Npb25zL2NvbW1vbi93b3Jrc3BhY2VTdGF0ZVN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxNQUFNLHNCQUFzQjtRQUUzQixLQUFLLENBQUMsYUFBYTtZQUNsQixPQUFPO1FBQ1IsQ0FBQztRQUNELEtBQUssQ0FBQyxrQkFBa0I7WUFDdkIsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBQ0QsS0FBSyxDQUFDLHNCQUFzQjtZQUMzQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FFRDtJQUVELE1BQU0scUJBQXFCO1FBQTNCO1lBR1MsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQVcsQ0FBQztZQUMvQywwQkFBcUIsR0FBbUIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUUzRSxtQ0FBOEIsR0FBRyxJQUFJLGVBQU8sRUFBMkIsQ0FBQztZQUN2RSxrQ0FBNkIsR0FBbUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQztRQVNwSCxDQUFDO1FBUEEsU0FBUyxLQUFjLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNyQyxtQkFBbUIsS0FBYyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0MsYUFBYSxDQUFDLFFBQWlCLElBQVUsQ0FBQztRQUMxQyxpQkFBaUIsQ0FBQyxTQUF1QixJQUFhLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwRSxxQkFBcUIsQ0FBQyxTQUF1QixFQUFFLFFBQWlCLElBQVUsQ0FBQztRQUMzRSwyQkFBMkIsQ0FBQyxTQUF1QixJQUF3QixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7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