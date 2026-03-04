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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testingContextKeys"], function (require, exports, event_1, lifecycle_1, objects_1, contextkey_1, instantiation_1, storage_1, storedValue_1, testId_1, testTypes_1, testingContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestProfileService = exports.capabilityContextKeys = exports.canUseProfileWithTest = exports.ITestProfileService = void 0;
    exports.ITestProfileService = (0, instantiation_1.createDecorator)('testProfileService');
    /**
     * Gets whether the given profile can be used to run the test.
     */
    const canUseProfileWithTest = (profile, test) => profile.controllerId === test.controllerId && (testId_1.TestId.isRoot(test.item.extId) || !profile.tag || test.item.tags.includes(profile.tag));
    exports.canUseProfileWithTest = canUseProfileWithTest;
    const sorter = (a, b) => {
        if (a.isDefault !== b.isDefault) {
            return a.isDefault ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
    };
    /**
     * Given a capabilities bitset, returns a map of context keys representing
     * them.
     */
    const capabilityContextKeys = (capabilities) => [
        [testingContextKeys_1.TestingContextKeys.hasRunnableTests.key, (capabilities & 2 /* TestRunProfileBitset.Run */) !== 0],
        [testingContextKeys_1.TestingContextKeys.hasDebuggableTests.key, (capabilities & 4 /* TestRunProfileBitset.Debug */) !== 0],
        [testingContextKeys_1.TestingContextKeys.hasCoverableTests.key, (capabilities & 8 /* TestRunProfileBitset.Coverage */) !== 0],
    ];
    exports.capabilityContextKeys = capabilityContextKeys;
    let TestProfileService = class TestProfileService extends lifecycle_1.Disposable {
        constructor(contextKeyService, storageService) {
            super();
            this.changeEmitter = this._register(new event_1.Emitter());
            this.controllerProfiles = new Map();
            /** @inheritdoc */
            this.onDidChange = this.changeEmitter.event;
            storageService.remove('testingPreferredProfiles', 1 /* StorageScope.WORKSPACE */); // cleanup old format
            this.userDefaults = this._register(new storedValue_1.StoredValue({
                key: 'testingPreferredProfiles2',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
            }, storageService));
            this.capabilitiesContexts = {
                [2 /* TestRunProfileBitset.Run */]: testingContextKeys_1.TestingContextKeys.hasRunnableTests.bindTo(contextKeyService),
                [4 /* TestRunProfileBitset.Debug */]: testingContextKeys_1.TestingContextKeys.hasDebuggableTests.bindTo(contextKeyService),
                [8 /* TestRunProfileBitset.Coverage */]: testingContextKeys_1.TestingContextKeys.hasCoverableTests.bindTo(contextKeyService),
                [16 /* TestRunProfileBitset.HasNonDefaultProfile */]: testingContextKeys_1.TestingContextKeys.hasNonDefaultProfile.bindTo(contextKeyService),
                [32 /* TestRunProfileBitset.HasConfigurable */]: testingContextKeys_1.TestingContextKeys.hasConfigurableProfile.bindTo(contextKeyService),
                [64 /* TestRunProfileBitset.SupportsContinuousRun */]: testingContextKeys_1.TestingContextKeys.supportsContinuousRun.bindTo(contextKeyService),
            };
            this.refreshContextKeys();
        }
        /** @inheritdoc */
        addProfile(controller, profile) {
            const previousExplicitDefaultValue = this.userDefaults.get()?.[controller.id]?.[profile.profileId];
            const extended = {
                ...profile,
                isDefault: previousExplicitDefaultValue ?? profile.isDefault,
                wasInitiallyDefault: profile.isDefault,
            };
            let record = this.controllerProfiles.get(profile.controllerId);
            if (record) {
                record.profiles.push(extended);
                record.profiles.sort(sorter);
            }
            else {
                record = {
                    profiles: [extended],
                    controller,
                };
                this.controllerProfiles.set(profile.controllerId, record);
            }
            this.refreshContextKeys();
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        updateProfile(controllerId, profileId, update) {
            const ctrl = this.controllerProfiles.get(controllerId);
            if (!ctrl) {
                return;
            }
            const profile = ctrl.profiles.find(c => c.controllerId === controllerId && c.profileId === profileId);
            if (!profile) {
                return;
            }
            Object.assign(profile, update);
            ctrl.profiles.sort(sorter);
            // store updates is isDefault as if the user changed it (which they might
            // have through some extension-contributed UI)
            if (update.isDefault !== undefined) {
                const map = (0, objects_1.deepClone)(this.userDefaults.get({}));
                setIsDefault(map, profile, update.isDefault);
                this.userDefaults.store(map);
            }
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        configure(controllerId, profileId) {
            this.controllerProfiles.get(controllerId)?.controller.configureRunProfile(profileId);
        }
        /** @inheritdoc */
        removeProfile(controllerId, profileId) {
            const ctrl = this.controllerProfiles.get(controllerId);
            if (!ctrl) {
                return;
            }
            if (!profileId) {
                this.controllerProfiles.delete(controllerId);
                this.changeEmitter.fire();
                return;
            }
            const index = ctrl.profiles.findIndex(c => c.profileId === profileId);
            if (index === -1) {
                return;
            }
            ctrl.profiles.splice(index, 1);
            this.refreshContextKeys();
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        capabilitiesForTest(test) {
            const ctrl = this.controllerProfiles.get(test.controllerId);
            if (!ctrl) {
                return 0;
            }
            let capabilities = 0;
            for (const profile of ctrl.profiles) {
                if (!profile.tag || test.item.tags.includes(profile.tag)) {
                    capabilities |= capabilities & profile.group ? 16 /* TestRunProfileBitset.HasNonDefaultProfile */ : profile.group;
                }
            }
            return capabilities;
        }
        /** @inheritdoc */
        all() {
            return this.controllerProfiles.values();
        }
        /** @inheritdoc */
        getControllerProfiles(profileId) {
            return this.controllerProfiles.get(profileId)?.profiles ?? [];
        }
        /** @inheritdoc */
        getGroupDefaultProfiles(group) {
            let defaults = [];
            for (const { profiles } of this.controllerProfiles.values()) {
                defaults = defaults.concat(profiles.filter(c => c.group === group && c.isDefault));
            }
            // have *some* default profile to run if none are set otherwise
            if (defaults.length === 0) {
                for (const { profiles } of this.controllerProfiles.values()) {
                    const first = profiles.find(p => p.group === group);
                    if (first) {
                        defaults.push(first);
                        break;
                    }
                }
            }
            return defaults;
        }
        /** @inheritdoc */
        setGroupDefaultProfiles(group, profiles) {
            const next = {};
            for (const ctrl of this.controllerProfiles.values()) {
                next[ctrl.controller.id] = {};
                for (const profile of ctrl.profiles) {
                    if (profile.group !== group) {
                        continue;
                    }
                    setIsDefault(next, profile, profiles.some(p => p.profileId === profile.profileId));
                }
                // When switching a profile, if the controller has a same-named profile in
                // other groups, update those to match the enablement state as well.
                for (const profile of ctrl.profiles) {
                    if (profile.group === group) {
                        continue;
                    }
                    const matching = ctrl.profiles.find(p => p.group === group && p.label === profile.label);
                    if (matching) {
                        setIsDefault(next, profile, matching.isDefault);
                    }
                }
                ctrl.profiles.sort(sorter);
            }
            this.userDefaults.store(next);
            this.changeEmitter.fire();
        }
        refreshContextKeys() {
            let allCapabilities = 0;
            for (const { profiles } of this.controllerProfiles.values()) {
                for (const profile of profiles) {
                    allCapabilities |= allCapabilities & profile.group ? 16 /* TestRunProfileBitset.HasNonDefaultProfile */ : profile.group;
                    allCapabilities |= profile.supportsContinuousRun ? 64 /* TestRunProfileBitset.SupportsContinuousRun */ : 0;
                }
            }
            for (const group of testTypes_1.testRunProfileBitsetList) {
                this.capabilitiesContexts[group].set((allCapabilities & group) !== 0);
            }
        }
    };
    exports.TestProfileService = TestProfileService;
    exports.TestProfileService = TestProfileService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, storage_1.IStorageService)
    ], TestProfileService);
    const setIsDefault = (map, profile, isDefault) => {
        profile.isDefault = isDefault;
        map[profile.controllerId] ??= {};
        if (profile.isDefault !== profile.wasInitiallyDefault) {
            map[profile.controllerId][profile.profileId] = profile.isDefault;
        }
        else {
            delete map[profile.controllerId][profile.profileId];
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFByb2ZpbGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdFByb2ZpbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNuRixRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0Isb0JBQW9CLENBQUMsQ0FBQztJQThEOUY7O09BRUc7SUFDSSxNQUFNLHFCQUFxQixHQUFHLENBQUMsT0FBd0IsRUFBRSxJQUFzQixFQUFFLEVBQUUsQ0FDekYsT0FBTyxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFEM0gsUUFBQSxxQkFBcUIseUJBQ3NHO0lBRXhJLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBa0IsRUFBRSxDQUFrQixFQUFFLEVBQUU7UUFDekQsSUFBSSxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQztJQU1GOzs7T0FHRztJQUNJLE1BQU0scUJBQXFCLEdB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