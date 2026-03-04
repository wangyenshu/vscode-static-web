/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/platform/workspace/common/workspace"], function (require, exports, event_1, lifecycle_1, marshalling_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageDatabaseChannel = void 0;
    class StorageDatabaseChannel extends lifecycle_1.Disposable {
        static { this.STORAGE_CHANGE_DEBOUNCE_TIME = 100; }
        constructor(logService, storageMainService) {
            super();
            this.logService = logService;
            this.storageMainService = storageMainService;
            this.onDidChangeApplicationStorageEmitter = this._register(new event_1.Emitter());
            this.mapProfileToOnDidChangeProfileStorageEmitter = new Map();
            this.registerStorageChangeListeners(storageMainService.applicationStorage, this.onDidChangeApplicationStorageEmitter);
        }
        //#region Storage Change Events
        registerStorageChangeListeners(storage, emitter) {
            // Listen for changes in provided storage to send to listeners
            // that are listening. Use a debouncer to reduce IPC traffic.
            this._register(event_1.Event.debounce(storage.onDidChangeStorage, (prev, cur) => {
                if (!prev) {
                    prev = [cur];
                }
                else {
                    prev.push(cur);
                }
                return prev;
            }, StorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
                if (events.length) {
                    emitter.fire(this.serializeStorageChangeEvents(events, storage));
                }
            }));
        }
        serializeStorageChangeEvents(events, storage) {
            const changed = new Map();
            const deleted = new Set();
            events.forEach(event => {
                const existing = storage.get(event.key);
                if (typeof existing === 'string') {
                    changed.set(event.key, existing);
                }
                else {
                    deleted.add(event.key);
                }
            });
            return {
                changed: Array.from(changed.entries()),
                deleted: Array.from(deleted.values())
            };
        }
        listen(_, event, arg) {
            switch (event) {
                case 'onDidChangeStorage': {
                    const profile = arg.profile ? (0, marshalling_1.revive)(arg.profile) : undefined;
                    // Without profile: application scope
                    if (!profile) {
                        return this.onDidChangeApplicationStorageEmitter.event;
                    }
                    // With profile: profile scope for the profile
                    let profileStorageChangeEmitter = this.mapProfileToOnDidChangeProfileStorageEmitter.get(profile.id);
                    if (!profileStorageChangeEmitter) {
                        profileStorageChangeEmitter = this._register(new event_1.Emitter());
                        this.registerStorageChangeListeners(this.storageMainService.profileStorage(profile), profileStorageChangeEmitter);
                        this.mapProfileToOnDidChangeProfileStorageEmitter.set(profile.id, profileStorageChangeEmitter);
                    }
                    return profileStorageChangeEmitter.event;
                }
            }
            throw new Error(`Event not found: ${event}`);
        }
        //#endregion
        async call(_, command, arg) {
            const profile = arg.profile ? (0, marshalling_1.revive)(arg.profile) : undefined;
            const workspace = (0, workspace_1.reviveIdentifier)(arg.workspace);
            // Get storage to be ready
            const storage = await this.withStorageInitialized(profile, workspace);
            // handle call
            switch (command) {
                case 'getItems': {
                    return Array.from(storage.items.entries());
                }
                case 'updateItems': {
                    const items = arg;
                    if (items.insert) {
                        for (const [key, value] of items.insert) {
                            storage.set(key, value);
                        }
                    }
                    items.delete?.forEach(key => storage.delete(key));
                    break;
                }
                case 'optimize': {
                    return storage.optimize();
                }
                case 'isUsed': {
                    const path = arg.payload;
                    if (typeof path === 'string') {
                        return this.storageMainService.isUsed(path);
                    }
                }
                default:
                    throw new Error(`Call not found: ${command}`);
            }
        }
        async withStorageInitialized(profile, workspace) {
            let storage;
            if (workspace) {
                storage = this.storageMainService.workspaceStorage(workspace);
            }
            else if (profile) {
                storage = this.storageMainService.profileStorage(profile);
            }
            else {
                storage = this.storageMainService.applicationStorage;
            }
            try {
                await storage.init();
            }
            catch (error) {
                this.logService.error(`StorageIPC#init: Unable to init ${workspace ? 'workspace' : profile ? 'profile' : 'application'} storage due to ${error}`);
            }
            return storage;
        }
    }
    exports.StorageDatabaseChannel = StorageDatabaseChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3N0b3JhZ2UvZWxlY3Ryb24tbWFpbi9zdG9yYWdlSXBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLHNCQUF1QixTQUFRLHNCQUFVO2lCQUU3QixpQ0FBNEIsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQU0zRCxZQUNrQixVQUF1QixFQUN2QixrQkFBdUM7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFIUyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFOeEMseUNBQW9DLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUMsQ0FBQyxDQUFDO1lBRXBHLGlEQUE0QyxHQUFHLElBQUksR0FBRyxFQUFtRSxDQUFDO1lBUTFJLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsb0NBQW9DLENBQUMsQ0FBQztRQUN2SCxDQUFDO1FBRUQsK0JBQStCO1FBRXZCLDhCQUE4QixDQUFDLE9BQXFCLEVBQUUsT0FBK0M7WUFFNUcsOERBQThEO1lBQzlELDZEQUE2RDtZQUU3RCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBdUMsRUFBRSxHQUF3QixFQUFFLEVBQUU7Z0JBQy9ILElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDZCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEIsQ0FBQztnQkFFRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLDRCQUE0QixDQUFDLE1BQTZCLEVBQUUsT0FBcUI7WUFDeEYsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztZQUN0QyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBTyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3RCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTztnQkFDTixPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUNyQyxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFVLEVBQUUsS0FBYSxFQUFFLEdBQW9DO1lBQ3JFLFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7b0JBQzNCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUEsb0JBQU0sRUFBbUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBRWhGLHFDQUFxQztvQkFDckMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNkLE9BQU8sSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQztvQkFDeEQsQ0FBQztvQkFFRCw4Q0FBOEM7b0JBQzlDLElBQUksMkJBQTJCLEdBQUcsSUFBSSxDQUFDLDRDQUE0QyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BHLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO3dCQUNsQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQyxDQUFDLENBQUM7d0JBQzNGLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7d0JBQ2xILElBQUksQ0FBQyw0Q0FBNEMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO29CQUNoRyxDQUFDO29CQUVELE9BQU8sMkJBQTJCLENBQUMsS0FBSyxDQUFDO2dCQUMxQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELFlBQVk7UUFFWixLQUFLLENBQUMsSUFBSSxDQUFDLENBQVUsRUFBRSxPQUFlLEVBQUUsR0FBb0M7WUFDM0UsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBQSxvQkFBTSxFQUFtQixHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNoRixNQUFNLFNBQVMsR0FBRyxJQUFBLDRCQUFnQixFQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVsRCwwQkFBMEI7WUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXRFLGNBQWM7WUFDZCxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ2pCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQzVDLENBQUM7Z0JBRUQsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO29CQUNwQixNQUFNLEtBQUssR0FBK0IsR0FBRyxDQUFDO29CQUU5QyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDbEIsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3pCLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFFbEQsTUFBTTtnQkFDUCxDQUFDO2dCQUVELEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDakIsT0FBTyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNCLENBQUM7Z0JBRUQsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUNmLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUE2QixDQUFDO29CQUMvQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUM5QixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRDtvQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLE9BQXFDLEVBQUUsU0FBOEM7WUFDekgsSUFBSSxPQUFxQixDQUFDO1lBQzFCLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRCxDQUFDO2lCQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDO1lBQ3RELENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdEIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGFBQWEsbUJBQW1CLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDbkosQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7O0lBaEpGLHdEQWlKQyJ9