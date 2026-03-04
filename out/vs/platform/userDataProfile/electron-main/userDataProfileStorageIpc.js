/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/storage/common/storage"], function (require, exports, event_1, lifecycle_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProfileStorageChangesListenerChannel = void 0;
    class ProfileStorageChangesListenerChannel extends lifecycle_1.Disposable {
        constructor(storageMainService, userDataProfilesService, logService) {
            super();
            this.storageMainService = storageMainService;
            this.userDataProfilesService = userDataProfilesService;
            this.logService = logService;
            const disposable = this._register(new lifecycle_1.MutableDisposable());
            this._onDidChange = this._register(new event_1.Emitter({
                // Start listening to profile storage changes only when someone is listening
                onWillAddFirstListener: () => disposable.value = this.registerStorageChangeListeners(),
                // Stop listening to profile storage changes when no one is listening
                onDidRemoveLastListener: () => disposable.value = undefined
            }));
        }
        registerStorageChangeListeners() {
            this.logService.debug('ProfileStorageChangesListenerChannel#registerStorageChangeListeners');
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(event_1.Event.debounce(this.storageMainService.applicationStorage.onDidChangeStorage, (keys, e) => {
                if (keys) {
                    keys.push(e.key);
                }
                else {
                    keys = [e.key];
                }
                return keys;
            }, 100)(keys => this.onDidChangeApplicationStorage(keys)));
            disposables.add(event_1.Event.debounce(this.storageMainService.onDidChangeProfileStorage, (changes, e) => {
                if (!changes) {
                    changes = new Map();
                }
                let profileChanges = changes.get(e.profile.id);
                if (!profileChanges) {
                    changes.set(e.profile.id, profileChanges = { profile: e.profile, keys: [], storage: e.storage });
                }
                profileChanges.keys.push(e.key);
                return changes;
            }, 100)(keys => this.onDidChangeProfileStorage(keys)));
            return disposables;
        }
        onDidChangeApplicationStorage(keys) {
            const targetChangedProfiles = keys.includes(storage_1.TARGET_KEY) ? [this.userDataProfilesService.defaultProfile] : [];
            const profileStorageValueChanges = [];
            keys = keys.filter(key => key !== storage_1.TARGET_KEY);
            if (keys.length) {
                const keyTargets = (0, storage_1.loadKeyTargets)(this.storageMainService.applicationStorage.storage);
                profileStorageValueChanges.push({ profile: this.userDataProfilesService.defaultProfile, changes: keys.map(key => ({ key, scope: 0 /* StorageScope.PROFILE */, target: keyTargets[key] })) });
            }
            this.triggerEvents(targetChangedProfiles, profileStorageValueChanges);
        }
        onDidChangeProfileStorage(changes) {
            const targetChangedProfiles = [];
            const profileStorageValueChanges = new Map();
            for (const [profileId, profileChanges] of changes.entries()) {
                if (profileChanges.keys.includes(storage_1.TARGET_KEY)) {
                    targetChangedProfiles.push(profileChanges.profile);
                }
                const keys = profileChanges.keys.filter(key => key !== storage_1.TARGET_KEY);
                if (keys.length) {
                    const keyTargets = (0, storage_1.loadKeyTargets)(profileChanges.storage.storage);
                    profileStorageValueChanges.set(profileId, { profile: profileChanges.profile, changes: keys.map(key => ({ key, scope: 0 /* StorageScope.PROFILE */, target: keyTargets[key] })) });
                }
            }
            this.triggerEvents(targetChangedProfiles, [...profileStorageValueChanges.values()]);
        }
        triggerEvents(targetChanges, valueChanges) {
            if (targetChanges.length || valueChanges.length) {
                this._onDidChange.fire({ valueChanges, targetChanges });
            }
        }
        listen(_, event, arg) {
            switch (event) {
                case 'onDidChange': return this._onDidChange.event;
            }
            throw new Error(`[ProfileStorageChangesListenerChannel] Event not found: ${event}`);
        }
        async call(_, command) {
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.ProfileStorageChangesListenerChannel = ProfileStorageChangesListenerChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhUHJvZmlsZS9lbGVjdHJvbi1tYWluL3VzZXJEYXRhUHJvZmlsZVN0b3JhZ2VJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsb0NBQXFDLFNBQVEsc0JBQVU7UUFJbkUsWUFDa0Isa0JBQXVDLEVBQ3ZDLHVCQUFpRCxFQUNqRCxVQUF1QjtZQUV4QyxLQUFLLEVBQUUsQ0FBQztZQUpTLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNqRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBR3hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBZSxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxDQUM3QztnQkFDQyw0RUFBNEU7Z0JBQzVFLHNCQUFzQixFQUFFLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixFQUFFO2dCQUN0RixxRUFBcUU7Z0JBQ3JFLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsU0FBUzthQUMzRCxDQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyw4QkFBOEI7WUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMscUVBQXFFLENBQUMsQ0FBQztZQUM3RixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FB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