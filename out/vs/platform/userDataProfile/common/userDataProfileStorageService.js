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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/platform/storage/common/storageIpc", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, lifecycle_1, storage_1, instantiation_1, storage_2, event_1, storageIpc_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteUserDataProfileStorageService = exports.AbstractUserDataProfileStorageService = exports.IUserDataProfileStorageService = void 0;
    exports.IUserDataProfileStorageService = (0, instantiation_1.createDecorator)('IUserDataProfileStorageService');
    let AbstractUserDataProfileStorageService = class AbstractUserDataProfileStorageService extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
        }
        async readStorageData(profile) {
            return this.withProfileScopedStorageService(profile, async (storageService) => this.getItems(storageService));
        }
        async updateStorageData(profile, data, target) {
            return this.withProfileScopedStorageService(profile, async (storageService) => this.writeItems(storageService, data, target));
        }
        async withProfileScopedStorageService(profile, fn) {
            if (this.storageService.hasScope(profile)) {
                return fn(this.storageService);
            }
            const storageDatabase = await this.createStorageDatabase(profile);
            const storageService = new StorageService(storageDatabase);
            try {
                await storageService.initialize();
                const result = await fn(storageService);
                await storageService.flush();
                return result;
            }
            finally {
                storageService.dispose();
                await this.closeAndDispose(storageDatabase);
            }
        }
        getItems(storageService) {
            const result = new Map();
            const populate = (target) => {
                for (const key of storageService.keys(0 /* StorageScope.PROFILE */, target)) {
                    result.set(key, { value: storageService.get(key, 0 /* StorageScope.PROFILE */), target });
                }
            };
            populate(0 /* StorageTarget.USER */);
            populate(1 /* StorageTarget.MACHINE */);
            return result;
        }
        writeItems(storageService, items, target) {
            storageService.storeAll(Array.from(items.entries()).map(([key, value]) => ({ key, value, scope: 0 /* StorageScope.PROFILE */, target })), true);
        }
        async closeAndDispose(storageDatabase) {
            try {
                await storageDatabase.close();
            }
            finally {
                if ((0, lifecycle_1.isDisposable)(storageDatabase)) {
                    storageDatabase.dispose();
                }
            }
        }
    };
    exports.AbstractUserDataProfileStorageService = AbstractUserDataProfileStorageService;
    exports.AbstractUserDataProfileStorageService = AbstractUserDataProfileStorageService = __decorate([
        __param(0, storage_2.IStorageService)
    ], AbstractUserDataProfileStorageService);
    class RemoteUserDataProfileStorageService extends AbstractUserDataProfileStorageService {
        constructor(remoteService, userDataProfilesService, storageService, logService) {
            super(storageService);
            this.remoteService = remoteService;
            const channel = remoteService.getChannel('profileStorageListener');
            const disposable = this._register(new lifecycle_1.MutableDisposable());
            this._onDidChange = this._register(new event_1.Emitter({
                // Start listening to profile storage changes only when someone is listening
                onWillAddFirstListener: () => {
                    disposable.value = channel.listen('onDidChange')(e => {
                        logService.trace('profile storage changes', e);
                        this._onDidChange.fire({
                            targetChanges: e.targetChanges.map(profile => (0, userDataProfile_1.reviveProfile)(profile, userDataProfilesService.profilesHome.scheme)),
                            valueChanges: e.valueChanges.map(e => ({ ...e, profile: (0, userDataProfile_1.reviveProfile)(e.profile, userDataProfilesService.profilesHome.scheme) }))
                        });
                    });
                },
                // Stop listening to profile storage changes when no one is listening
                onDidRemoveLastListener: () => disposable.value = undefined
            }));
            this.onDidChange = this._onDidChange.event;
        }
        async createStorageDatabase(profile) {
            const storageChannel = this.remoteService.getChannel('storage');
            return (0, storage_2.isProfileUsingDefaultStorage)(profile) ? new storageIpc_1.ApplicationStorageDatabaseClient(storageChannel) : new storageIpc_1.ProfileStorageDatabaseClient(storageChannel, profile);
        }
    }
    exports.RemoteUserDataProfileStorageService = RemoteUserDataProfileStorageService;
    class StorageService extends storage_2.AbstractStorageService {
        constructor(profileStorageDatabase) {
            super({ flushInterval: 100 });
            this.profileStorage = this._register(new storage_1.Storage(profileStorageDatabase));
        }
        doInitialize() {
            return this.profileStorage.init();
        }
        getStorage(scope) {
            return scope === 0 /* StorageScope.PROFILE */ ? this.profileStorage : undefined;
        }
        getLogDetails() { return undefined; }
        async switchToProfile() { }
        async switchToWorkspace() { }
        hasScope() { return false; }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvY29tbW9uL3VzZXJEYXRhUHJvZmlsZVN0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCbkYsUUFBQSw4QkFBOEIsR0FBRyxJQUFBLCtCQUFlLEVBQWlDLGdDQUFnQyxDQUFDLENBQUM7SUE2QnpILElBQWUscUNBQXFDLEdBQXBELE1BQWUscUNBQXNDLFNBQVEsc0JBQVU7UUFNN0UsWUFDcUMsY0FBK0I7WUFFbkUsS0FBSyxFQUFFLENBQUM7WUFGNEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBR3BFLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQXlCO1lBQzlDLE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsY0FBYyxFQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDN0csQ0FBQztRQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUF5QixFQUFFLElBQTRDLEVBQUUsTUFBcUI7WUFDckgsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxjQUFjLEVBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFFRCxLQUFLLENBQUMsK0JBQStCLENBQUksT0FBeUIsRUFBRSxFQUFtRDtZQUN0SCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFF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