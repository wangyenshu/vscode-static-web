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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/storage/electron-main/storageMain", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network"], function (require, exports, uri_1, event_1, lifecycle_1, environment_1, files_1, instantiation_1, lifecycleMainService_1, log_1, storage_1, storageMain_1, userDataProfile_1, userDataProfile_2, uriIdentity_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationStorageMainService = exports.IApplicationStorageMainService = exports.StorageMainService = exports.IStorageMainService = void 0;
    //#region Storage Main Service (intent: make application, profile and workspace storage accessible to windows from main process)
    exports.IStorageMainService = (0, instantiation_1.createDecorator)('storageMainService');
    let StorageMainService = class StorageMainService extends lifecycle_1.Disposable {
        constructor(logService, environmentService, userDataProfilesService, lifecycleMainService, fileService, uriIdentityService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this.userDataProfilesService = userDataProfilesService;
            this.lifecycleMainService = lifecycleMainService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.shutdownReason = undefined;
            this._onDidChangeProfileStorage = this._register(new event_1.Emitter());
            this.onDidChangeProfileStorage = this._onDidChangeProfileStorage.event;
            //#region Application Storage
            this.applicationStorage = this._register(this.createApplicationStorage());
            //#endregion
            //#region Profile Storage
            this.mapProfileToStorage = new Map();
            //#endregion
            //#region Workspace Storage
            this.mapWorkspaceToStorage = new Map();
            this.registerListeners();
        }
        getStorageOptions() {
            return {
                useInMemoryStorage: !!this.environmentService.extensionTestsLocationURI // no storage during extension tests!
            };
        }
        registerListeners() {
            // Application Storage: Warmup when any window opens
            (async () => {
                await this.lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */);
                this.applicationStorage.init();
            })();
            this._register(this.lifecycleMainService.onWillLoadWindow(e => {
                // Profile Storage: Warmup when related window with profile loads
                if (e.window.profile) {
                    this.profileStorage(e.window.profile).init();
                }
                // Workspace Storage: Warmup when related window with workspace loads
                if (e.workspace) {
                    this.workspaceStorage(e.workspace).init();
                }
            }));
            // All Storage: Close when shutting down
            this._register(this.lifecycleMainService.onWillShutdown(e => {
                this.logService.trace('storageMainService#onWillShutdown()');
                // Remember shutdown reason
                this.shutdownReason = e.reason;
                // Application Storage
                e.join('applicationStorage', this.applicationStorage.close());
                // Profile Storage(s)
                for (const [, profileStorage] of this.mapProfileToStorage) {
                    e.join('profileStorage', profileStorage.close());
                }
                // Workspace Storage(s)
                for (const [, workspaceStorage] of this.mapWorkspaceToStorage) {
                    e.join('workspaceStorage', workspaceStorage.close());
                }
            }));
            // Prepare storage location as needed
            this._register(this.userDataProfilesService.onWillCreateProfile(e => {
                e.join((async () => {
                    if (!(await this.fileService.exists(e.profile.globalStorageHome))) {
                        await this.fileService.createFolder(e.profile.globalStorageHome);
                    }
                })());
            }));
            // Close the storage of the profile that is being removed
            this._register(this.userDataProfilesService.onWillRemoveProfile(e => {
                const storage = this.mapProfileToStorage.get(e.profile.id);
                if (storage) {
                    e.join(storage.close());
                }
            }));
        }
        createApplicationStorage() {
            this.logService.trace(`StorageMainService: creating application storage`);
            const applicationStorage = new storageMain_1.ApplicationStorageMain(this.getStorageOptions(), this.userDataProfilesService, this.logService, this.fileService);
            this._register(event_1.Event.once(applicationStorage.onDidCloseStorage)(() => {
                this.logService.trace(`StorageMainService: closed application storage`);
            }));
            return applicationStorage;
        }
        profileStorage(profile) {
            if ((0, storage_1.isProfileUsingDefaultStorage)(profile)) {
                return this.applicationStorage; // for profiles using default storage, use application storage
            }
            let profileStorage = this.mapProfileToStorage.get(profile.id);
            if (!profileStorage) {
                this.logService.trace(`StorageMainService: creating profile storage (${profile.name})`);
                profileStorage = this._register(this.createProfileStorage(profile));
                this.mapProfileToStorage.set(profile.id, profileStorage);
                const listener = this._register(profileStorage.onDidChangeStorage(e => this._onDidChangeProfileStorage.fire({
                    ...e,
                    storage: profileStorage,
                    profile
                })));
                this._register(event_1.Event.once(profileStorage.onDidCloseStorage)(() => {
                    this.logService.trace(`StorageMainService: closed profile storage (${profile.name})`);
                    this.mapProfileToStorage.delete(profile.id);
                    listener.dispose();
                }));
            }
            return profileStorage;
        }
        createProfileStorage(profile) {
            if (this.shutdownReason === 2 /* ShutdownReason.KILL */) {
                // Workaround for native crashes that we see when
                // SQLite DBs are being created even after shutdown
                // https://github.com/microsoft/vscode/issues/143186
                return new storageMain_1.InMemoryStorageMain(this.logService, this.fileService);
            }
            return new storageMain_1.ProfileStorageMain(profile, this.getStorageOptions(), this.logService, this.fileService);
        }
        workspaceStorage(workspace) {
            let workspaceStorage = this.mapWorkspaceToStorage.get(workspace.id);
            if (!workspaceStorage) {
                this.logService.trace(`StorageMainService: creating workspace storage (${workspace.id})`);
                workspaceStorage = this._register(this.createWorkspaceStorage(workspace));
                this.mapWorkspaceToStorage.set(workspace.id, workspaceStorage);
                this._register(event_1.Event.once(workspaceStorage.onDidCloseStorage)(() => {
                    this.logService.trace(`StorageMainService: closed workspace storage (${workspace.id})`);
                    this.mapWorkspaceToStorage.delete(workspace.id);
                }));
            }
            return workspaceStorage;
        }
        createWorkspaceStorage(workspace) {
            if (this.shutdownReason === 2 /* ShutdownReason.KILL */) {
                // Workaround for native crashes that we see when
                // SQLite DBs are being created even after shutdown
                // https://github.com/microsoft/vscode/issues/143186
                return new storageMain_1.InMemoryStorageMain(this.logService, this.fileService);
            }
            return new storageMain_1.WorkspaceStorageMain(workspace, this.getStorageOptions(), this.logService, this.environmentService, this.fileService);
        }
        //#endregion
        isUsed(path) {
            const pathUri = uri_1.URI.file(path);
            for (const storage of [this.applicationStorage, ...this.mapProfileToStorage.values(), ...this.mapWorkspaceToStorage.values()]) {
                if (!storage.path) {
                    continue;
                }
                if (this.uriIdentityService.extUri.isEqualOrParent(uri_1.URI.file(storage.path), pathUri)) {
                    return true;
                }
            }
            return false;
        }
    };
    exports.StorageMainService = StorageMainService;
    exports.StorageMainService = StorageMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataProfile_2.IUserDataProfilesMainService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, files_1.IFileService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], StorageMainService);
    //#endregion
    //#region Application Main Storage Service (intent: use application storage from main process)
    exports.IApplicationStorageMainService = (0, instantiation_1.createDecorator)('applicationStorageMainService');
    let ApplicationStorageMainService = class ApplicationStorageMainService extends storage_1.AbstractStorageService {
        constructor(userDataProfilesService, storageMainService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.storageMainService = storageMainService;
            this.whenReady = this.storageMainService.applicationStorage.whenInit;
        }
        doInitialize() {
            // application storage is being initialized as part
            // of the first window opening, so we do not trigger
            // it here but can join it
            return this.storageMainService.applicationStorage.whenInit;
        }
        getStorage(scope) {
            if (scope === -1 /* StorageScope.APPLICATION */) {
                return this.storageMainService.applicationStorage.storage;
            }
            return undefined; // any other scope is unsupported from main process
        }
        getLogDetails(scope) {
            if (scope === -1 /* StorageScope.APPLICATION */) {
                return this.userDataProfilesService.defaultProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
            }
            return undefined; // any other scope is unsupported from main process
        }
        shouldFlushWhenIdle() {
            return false; // not needed here, will be triggered from any window that is opened
        }
        switch() {
            throw new Error('Migrating storage is unsupported from main process');
        }
        switchToProfile() {
            throw new Error('Switching storage profile is unsupported from main process');
        }
        switchToWorkspace() {
            throw new Error('Switching storage workspace is unsupported from main process');
        }
        hasScope() {
            throw new Error('Main process is never profile or workspace scoped');
        }
    };
    exports.ApplicationStorageMainService = ApplicationStorageMainService;
    exports.ApplicationStorageMainService = ApplicationStorageMainService = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, exports.IStorageMainService)
    ], ApplicationStorageMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZU1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RvcmFnZS9lbGVjdHJvbi1tYWluL3N0b3JhZ2VNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLGdJQUFnSTtJQUVuSCxRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0Isb0JBQW9CLENBQUMsQ0FBQztJQWtEdkYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQVNqRCxZQUNjLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUMvQyx1QkFBc0UsRUFDN0Usb0JBQTRELEVBQ3JFLFdBQTBDLEVBQ25DLGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQVBzQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5Qiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQThCO1lBQzVELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQVh0RSxtQkFBYyxHQUErQixTQUFTLENBQUM7WUFFOUMsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEIsQ0FBQyxDQUFDO1lBQy9GLDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFrRjNFLDZCQUE2QjtZQUVwQix1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7WUFjOUUsWUFBWTtZQUVaLHlCQUF5QjtZQUVSLHdCQUFt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