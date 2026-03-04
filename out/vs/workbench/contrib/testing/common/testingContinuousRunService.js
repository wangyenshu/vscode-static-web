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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testService", "vs/base/common/event", "vs/workbench/contrib/testing/common/testId", "vs/base/common/prefixTree", "vs/workbench/contrib/testing/common/testProfileService", "vs/base/common/arrays"], function (require, exports, cancellation_1, lifecycle_1, contextkey_1, instantiation_1, storage_1, storedValue_1, testingContextKeys_1, testService_1, event_1, testId_1, prefixTree_1, testProfileService_1, arrays) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingContinuousRunService = exports.ITestingContinuousRunService = void 0;
    exports.ITestingContinuousRunService = (0, instantiation_1.createDecorator)('testingContinuousRunService');
    let TestingContinuousRunService = class TestingContinuousRunService extends lifecycle_1.Disposable {
        get lastRunProfileIds() {
            return this.lastRun.get(new Set());
        }
        constructor(testService, storageService, contextKeyService, testProfileService) {
            super();
            this.testService = testService;
            this.testProfileService = testProfileService;
            this.changeEmitter = new event_1.Emitter();
            this.running = new prefixTree_1.WellDefinedPrefixTree();
            this.onDidChange = this.changeEmitter.event;
            this.isGloballyOn = testingContextKeys_1.TestingContextKeys.isContinuousModeOn.bindTo(contextKeyService);
            this.lastRun = this._register(new storedValue_1.StoredValue({
                key: 'lastContinuousRunProfileIds',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
                serialization: {
                    deserialize: v => new Set(JSON.parse(v)),
                    serialize: v => JSON.stringify([...v])
                },
            }, storageService));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.globallyRunning?.dispose();
                for (const cts of this.running.values()) {
                    cts.dispose();
                }
            }));
        }
        /** @inheritdoc */
        isSpecificallyEnabledFor(testId) {
            return this.running.size > 0 && this.running.hasKey(testId_1.TestId.fromString(testId).path);
        }
        /** @inheritdoc */
        isEnabledForAParentOf(testId) {
            if (this.globallyRunning) {
                return true;
            }
            return this.running.size > 0 && this.running.hasKeyOrParent(testId_1.TestId.fromString(testId).path);
        }
        /** @inheritdoc */
        isEnabledForAChildOf(testId) {
            return this.running.size > 0 && this.running.hasKeyOrChildren(testId_1.TestId.fromString(testId).path);
        }
        /** @inheritdoc */
        isEnabled() {
            return !!this.globallyRunning || this.running.size > 0;
        }
        /** @inheritdoc */
        start(profiles, testId) {
            const store = new lifecycle_1.DisposableStore();
            const cts = new cancellation_1.CancellationTokenSource();
            store.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            if (testId === undefined) {
                this.isGloballyOn.set(true);
            }
            if (!testId) {
                this.globallyRunning?.dispose();
                this.globallyRunning = store;
            }
            else {
                this.running.mutate(testId_1.TestId.fromString(testId).path, c => {
                    c?.dispose();
                    return store;
                });
            }
            let actualProfiles;
            if (profiles instanceof Array) {
                actualProfiles = profiles;
            }
            else {
                // restart the continuous run when default profiles change, if we were
                // asked to run for a group
                const getRelevant = () => this.testProfileService.getGroupDefaultProfiles(profiles)
                    .filter(p => p.supportsContinuousRun && (!testId || testId_1.TestId.root(testId) === p.controllerId));
                actualProfiles = getRelevant();
                store.add(this.testProfileService.onDidChange(() => {
                    if (!arrays.equals(getRelevant(), actualProfiles)) {
                        this.start(profiles, testId);
                    }
                }));
            }
            this.lastRun.store(new Set(actualProfiles.map(p => p.profileId)));
            if (actualProfiles.length) {
                this.testService.startContinuousRun({
                    continuous: true,
                    targets: actualProfiles.map(p => ({
                        testIds: [testId ?? p.controllerId],
                        controllerId: p.controllerId,
                        profileGroup: p.group,
                        profileId: p.profileId
                    })),
                }, cts.token);
            }
            this.changeEmitter.fire(testId);
        }
        /** @inheritdoc */
        stop(testId) {
            if (!testId) {
                this.globallyRunning?.dispose();
                this.globallyRunning = undefined;
            }
            else {
                const cancellations = [...this.running.deleteRecursive(testId_1.TestId.fromString(testId).path)];
                // deleteRecursive returns a BFS order, reverse it so children are cancelled before parents
                for (let i = cancellations.length - 1; i >= 0; i--) {
                    cancellations[i].dispose();
                }
            }
            if (testId === undefined) {
                this.isGloballyOn.set(false);
            }
            this.changeEmitter.fire(testId);
        }
    };
    exports.TestingContinuousRunService = TestingContinuousRunService;
    exports.TestingContinuousRunService = TestingContinuousRunService = __decorate([
        __param(0, testService_1.ITestService),
        __param(1, storage_1.IStorageService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, testProfileService_1.ITestProfileService)
    ], TestingContinuousRunService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbnRpbnVvdXNSdW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdGluZ0NvbnRpbnVvdXNSdW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCbkYsUUFBQSw0QkFBNEIsR0FBRyxJQUFBLCtCQUFlLEVBQStCLDZCQUE2QixDQUFDLENBQUM7SUFvRGxILElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFXMUQsSUFBVyxpQkFBaUI7WUFDM0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELFlBQ2UsV0FBeUMsRUFDdEMsY0FBK0IsRUFDNUIsaUJBQXFDLEVBQ3BDLGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQUx1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUdqQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBaEI3RCxrQkFBYSxHQUFHLElBQUksZUFBTyxFQUFzQixDQUFDO1lBRWxELFlBQU8sR0FBRyxJQUFJLGtDQUFxQixFQUFlLENBQUM7WUFJcEQsZ0JBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQWF0RCxJQUFJLENBQUMsWUFBWSxHQUFHLHVDQUFrQixDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3BGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLENBQWM7Z0JBQzFELEdBQUcsRUFBRSw2QkFBNkI7Z0JBQ2xDLEtBQUssZ0NBQXdC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