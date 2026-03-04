/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageClient = exports.WorkspaceStorageDatabaseClient = exports.ProfileStorageDatabaseClient = exports.ApplicationStorageDatabaseClient = void 0;
    class BaseStorageDatabaseClient extends lifecycle_1.Disposable {
        constructor(channel, profile, workspace) {
            super();
            this.channel = channel;
            this.profile = profile;
            this.workspace = workspace;
        }
        async getItems() {
            const serializableRequest = { profile: this.profile, workspace: this.workspace };
            const items = await this.channel.call('getItems', serializableRequest);
            return new Map(items);
        }
        updateItems(request) {
            const serializableRequest = { profile: this.profile, workspace: this.workspace };
            if (request.insert) {
                serializableRequest.insert = Array.from(request.insert.entries());
            }
            if (request.delete) {
                serializableRequest.delete = Array.from(request.delete.values());
            }
            return this.channel.call('updateItems', serializableRequest);
        }
        optimize() {
            const serializableRequest = { profile: this.profile, workspace: this.workspace };
            return this.channel.call('optimize', serializableRequest);
        }
    }
    class BaseProfileAwareStorageDatabaseClient extends BaseStorageDatabaseClient {
        constructor(channel, profile) {
            super(channel, profile, undefined);
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.channel.listen('onDidChangeStorage', { profile: this.profile })((e) => this.onDidChangeStorage(e)));
        }
        onDidChangeStorage(e) {
            if (Array.isArray(e.changed) || Array.isArray(e.deleted)) {
                this._onDidChangeItemsExternal.fire({
                    changed: e.changed ? new Map(e.changed) : undefined,
                    deleted: e.deleted ? new Set(e.deleted) : undefined
                });
            }
        }
    }
    class ApplicationStorageDatabaseClient extends BaseProfileAwareStorageDatabaseClient {
        constructor(channel) {
            super(channel, undefined);
        }
        async close() {
            // The application storage database is shared across all instances so
            // we do not close it from the window. However we dispose the
            // listener for external changes because we no longer interested in it.
            this.dispose();
        }
    }
    exports.ApplicationStorageDatabaseClient = ApplicationStorageDatabaseClient;
    class ProfileStorageDatabaseClient extends BaseProfileAwareStorageDatabaseClient {
        constructor(channel, profile) {
            super(channel, profile);
        }
        async close() {
            // The profile storage database is shared across all instances of
            // the same profile so we do not close it from the window.
            // However we dispose the listener for external changes because
            // we no longer interested in it.
            this.dispose();
        }
    }
    exports.ProfileStorageDatabaseClient = ProfileStorageDatabaseClient;
    class WorkspaceStorageDatabaseClient extends BaseStorageDatabaseClient {
        constructor(channel, workspace) {
            super(channel, undefined, workspace);
            this.onDidChangeItemsExternal = event_1.Event.None; // unsupported for workspace storage because we only ever write from one window
        }
        async close() {
            // The workspace storage database is only used in this instance
            // but we do not need to close it from here, the main process
            // can take care of that.
            this.dispose();
        }
    }
    exports.WorkspaceStorageDatabaseClient = WorkspaceStorageDatabaseClient;
    class StorageClient {
        constructor(channel) {
            this.channel = channel;
        }
        isUsed(path) {
            const serializableRequest = { payload: path, profile: undefined, workspace: undefined };
            return this.channel.call('isUsed', serializableRequest);
        }
    }
    exports.StorageClient = StorageClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3N0b3JhZ2UvY29tbW9uL3N0b3JhZ2VJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkNoRyxNQUFlLHlCQUEwQixTQUFRLHNCQUFVO1FBSTFELFlBQ1csT0FBaUIsRUFDakIsT0FBNkMsRUFDN0MsU0FBOEM7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFKRSxZQUFPLEdBQVAsT0FBTyxDQUFVO1lBQ2pCLFlBQU8sR0FBUCxPQUFPLENBQXNDO1lBQzdDLGNBQVMsR0FBVCxTQUFTLENBQXFDO1FBR3pELENBQUM7UUFFRCxLQUFLLENBQUMsUUFBUTtZQUNiLE1BQU0sbUJBQW1CLEdBQW9DLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNsSCxNQUFNLEtBQUssR0FBVyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRS9FLE9BQU8sSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUF1QjtZQUNsQyxNQUFNLG1CQUFtQixHQUErQixFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFFN0csSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BCLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBRUQsSUFBSSxP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