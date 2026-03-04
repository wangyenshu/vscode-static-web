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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSyncStoreService"], function (require, exports, event_1, lifecycle_1, uri_1, configuration_1, productService_1, storage_1, userDataSyncStoreService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncStoreManagementServiceChannelClient = exports.UserDataSyncStoreManagementServiceChannel = exports.UserDataSyncAccountServiceChannelClient = exports.UserDataSyncAccountServiceChannel = void 0;
    class UserDataSyncAccountServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeAccount': return this.service.onDidChangeAccount;
                case 'onTokenFailed': return this.service.onTokenFailed;
            }
            throw new Error(`[UserDataSyncAccountServiceChannel] Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case '_getInitialData': return Promise.resolve(this.service.account);
                case 'updateAccount': return this.service.updateAccount(args);
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncAccountServiceChannel = UserDataSyncAccountServiceChannel;
    class UserDataSyncAccountServiceChannelClient extends lifecycle_1.Disposable {
        get account() { return this._account; }
        get onTokenFailed() { return this.channel.listen('onTokenFailed'); }
        constructor(channel) {
            super();
            this.channel = channel;
            this._onDidChangeAccount = this._register(new event_1.Emitter());
            this.onDidChangeAccount = this._onDidChangeAccount.event;
            this.channel.call('_getInitialData').then(account => {
                this._account = account;
                this._register(this.channel.listen('onDidChangeAccount')(account => {
                    this._account = account;
                    this._onDidChangeAccount.fire(account);
                }));
            });
        }
        updateAccount(account) {
            return this.channel.call('updateAccount', account);
        }
    }
    exports.UserDataSyncAccountServiceChannelClient = UserDataSyncAccountServiceChannelClient;
    class UserDataSyncStoreManagementServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeUserDataSyncStore': return this.service.onDidChangeUserDataSyncStore;
            }
            throw new Error(`[UserDataSyncStoreManagementServiceChannel] Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'switch': return this.service.switch(args[0]);
                case 'getPreviousUserDataSyncStore': return this.service.getPreviousUserDataSyncStore();
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncStoreManagementServiceChannel = UserDataSyncStoreManagementServiceChannel;
    let UserDataSyncStoreManagementServiceChannelClient = class UserDataSyncStoreManagementServiceChannelClient extends userDataSyncStoreService_1.AbstractUserDataSyncStoreManagementService {
        constructor(channel, productService, configurationService, storageService) {
            super(productService, configurationService, storageService);
            this.channel = channel;
            this._register(this.channel.listen('onDidChangeUserDataSyncStore')(() => this.updateUserDataSyncStore()));
        }
        async switch(type) {
            return this.channel.call('switch', [type]);
        }
        async getPreviousUserDataSyncStore() {
            const userDataSyncStore = await this.channel.call('getPreviousUserDataSyncStore');
            return this.revive(userDataSyncStore);
        }
        revive(userDataSyncStore) {
            return {
                url: uri_1.URI.revive(userDataSyncStore.url),
                type: userDataSyncStore.type,
                defaultUrl: uri_1.URI.revive(userDataSyncStore.defaultUrl),
                insidersUrl: uri_1.URI.revive(userDataSyncStore.insidersUrl),
                stableUrl: uri_1.URI.revive(userDataSyncStore.stableUrl),
                canSwitch: userDataSyncStore.canSwitch,
                authenticationProviders: userDataSyncStore.authenticationProviders,
            };
        }
    };
    exports.UserDataSyncStoreManagementServiceChannelClient = UserDataSyncStoreManagementServiceChannelClient;
    exports.UserDataSyncStoreManagementServiceChannelClient = UserDataSyncStoreManagementServiceChannelClient = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService)
    ], UserDataSyncStoreManagementServiceChannelClient);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmNJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQWEsaUNBQWlDO1FBQzdDLFlBQTZCLE9BQW9DO1lBQXBDLFlBQU8sR0FBUCxPQUFPLENBQTZCO1FBQUksQ0FBQztRQUV0RSxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWE7WUFDL0IsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLG9CQUFvQixDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDO2dCQUNsRSxLQUFLLGVBQWUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDekQsQ0FBQztZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELEtBQUssRUFBRSxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFZLEVBQUUsT0FBZSxFQUFFLElBQVU7WUFDN0MsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNyRSxLQUFLLGVBQWUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBbEJELDhFQWtCQztJQUVELE1BQWEsdUNBQXdDLFNBQVEsc0JB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