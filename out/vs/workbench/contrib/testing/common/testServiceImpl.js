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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExclusions", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/services/editor/common/editorService"], function (require, exports, arrays_1, cancellation_1, event_1, iterator_1, lifecycle_1, types_1, nls_1, configuration_1, contextkey_1, instantiation_1, notification_1, storage_1, uriIdentity_1, workspaceTrust_1, configuration_2, mainThreadTestCollection_1, observableValue_1, storedValue_1, testExclusions_1, testId_1, testingContextKeys_1, testProfileService_1, testResultService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestService = void 0;
    let TestService = class TestService extends lifecycle_1.Disposable {
        constructor(contextKeyService, instantiationService, uriIdentityService, storage, editorService, testProfiles, notificationService, configurationService, testResults, workspaceTrustRequestService) {
            super();
            this.uriIdentityService = uriIdentityService;
            this.storage = storage;
            this.editorService = editorService;
            this.testProfiles = testProfiles;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.testResults = testResults;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.testControllers = new Map();
            this.cancelExtensionTestRunEmitter = new event_1.Emitter();
            this.willProcessDiffEmitter = new event_1.Emitter();
            this.didProcessDiffEmitter = new event_1.Emitter();
            this.testRefreshCancellations = new Set();
            /**
             * Cancellation for runs requested by the user being managed by the UI.
             * Test runs initiated by extensions are not included here.
             */
            this.uiRunningTests = new Map();
            /**
             * @inheritdoc
             */
            this.onWillProcessDiff = this.willProcessDiffEmitter.event;
            /**
             * @inheritdoc
             */
            this.onDidProcessDiff = this.didProcessDiffEmitter.event;
            /**
             * @inheritdoc
             */
            this.onDidCancelTestRun = this.cancelExtensionTestRunEmitter.event;
            /**
             * @inheritdoc
             */
            this.collection = new mainThreadTestCollection_1.MainThreadTestCollection(this.uriIdentityService, this.expandTest.bind(this));
            /**
             * @inheritdoc
             */
            this.showInlineOutput = observableValue_1.MutableObservableValue.stored(this._register(new storedValue_1.StoredValue({
                key: 'inlineTestOutputVisible',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 0 /* StorageTarget.USER */
            }, this.storage)), true);
            this.excluded = instantiationService.createInstance(testExclusions_1.TestExclusions);
            this.providerCount = testingContextKeys_1.TestingContextKeys.providerCount.bindTo(contextKeyService);
            this.canRefreshTests = testingContextKeys_1.TestingContextKeys.canRefreshTests.bindTo(contextKeyService);
            this.isRefreshingTests = testingContextKeys_1.TestingContextKeys.isRefreshingTests.bindTo(contextKeyService);
            this.activeEditorHasTests = testingContextKeys_1.TestingContextKeys.activeEditorHasTests.bindTo(contextKeyService);
            this._register(editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
        }
        /**
         * @inheritdoc
         */
        async expandTest(id, levels) {
            await this.testControllers.get(testId_1.TestId.fromString(id).controllerId)?.expandTest(id, levels);
        }
        /**
         * @inheritdoc
         */
        cancelTestRun(runId) {
            this.cancelExtensionTestRunEmitter.fire({ runId });
            if (runId === undefined) {
                for (const runCts of this.uiRunningTests.values()) {
                    runCts.cancel();
                }
            }
            else {
                this.uiRunningTests.get(runId)?.cancel();
            }
        }
        /**
         * @inheritdoc
         */
        async runTests(req, token = cancellation_1.CancellationToken.None) {
            const resolved = {
                targets: [],
                exclude: req.exclude?.map(t => t.item.extId),
                continuous: req.continuous,
            };
            // First, try to run the tests using the default run profiles...
            for (const profile of this.testProfiles.getGroupDefaultProfiles(req.group)) {
                const testIds = req.tests.filter(t => (0, testProfileService_1.canUseProfileWithTest)(profile, t)).map(t => t.item.extId);
                if (testIds.length) {
                    resolved.targets.push({
                        testIds: testIds,
                        profileGroup: profile.group,
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                    });
                }
            }
            // If no tests are covered by the defaults, just use whatever the defaults
            // for their controller are. This can happen if the user chose specific
            // profiles for the run button, but then asked to run a single test from the
            // explorer or decoration. We shouldn't no-op.
            if (resolved.targets.length === 0) {
                for (const byController of (0, arrays_1.groupBy)(req.tests, (a, b) => a.controllerId === b.controllerId ? 0 : 1)) {
                    const profiles = this.testProfiles.getControllerProfiles(byController[0].controllerId);
                    const withControllers = byController.map(test => ({
                        profile: profiles.find(p => p.group === req.group && (0, testProfileService_1.canUseProfileWithTest)(p, test)),
                        test,
                    }));
                    for (const byProfile of (0, arrays_1.groupBy)(withControllers, (a, b) => a.profile === b.profile ? 0 : 1)) {
                        const profile = byProfile[0].profile;
                        if (profile) {
                            resolved.targets.push({
                                testIds: byProfile.map(t => t.test.item.extId),
                                profileGroup: req.group,
                                profileId: profile.profileId,
                                controllerId: profile.controllerId,
                            });
                        }
                    }
                }
            }
            return this.runResolvedTests(resolved, token);
        }
        /** @inheritdoc */
        async startContinuousRun(req, token) {
            if (!req.exclude) {
                req.exclude = [...this.excluded.all];
            }
            const trust = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                message: (0, nls_1.localize)('testTrust', "Running tests may execute code in your workspace."),
            });
            if (!trust) {
                return;
            }
            const byController = (0, arrays_1.groupBy)(req.targets, (a, b) => a.controllerId.localeCompare(b.controllerId));
            const requests = byController.map(group => this.testControllers.get(group[0].controllerId)?.startContinuousRun(group.map(controlReq => ({
                excludeExtIds: req.exclude.filter(t => !controlReq.testIds.includes(t)),
                profileId: controlReq.profileId,
                controllerId: controlReq.controllerId,
                testIds: controlReq.testIds,
            })), token).then(result => {
                const errs = result.map(r => r.error).filter(types_1.isDefined);
                if (errs.length) {
                    this.notificationService.error((0, nls_1.localize)('testError', 'An error occurred attempting to run tests: {0}', errs.join(' ')));
                }
            }));
            await Promise.all(requests);
        }
        /**
         * @inheritdoc
         */
        async runResolvedTests(req, token = cancellation_1.CancellationToken.None) {
            if (!req.exclude) {
                req.exclude = [...this.excluded.all];
            }
            const result = this.testResults.createLiveResult(req);
            const trust = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                message: (0, nls_1.localize)('testTrust', "Running tests may execute code in your workspace."),
            });
            if (!trust) {
                result.markComplete();
                return result;
            }
            try {
                const cancelSource = new cancellation_1.CancellationTokenSource(token);
                this.uiRunningTests.set(result.id, cancelSource);
                const byController = (0, arrays_1.groupBy)(req.targets, (a, b) => a.controllerId.localeCompare(b.controllerId));
                const requests = byController.map(group => this.testControllers.get(group[0].controllerId)?.runTests(group.map(controlReq => ({
                    runId: result.id,
                    excludeExtIds: req.exclude.filter(t => !controlReq.testIds.includes(t)),
                    profileId: controlReq.profileId,
                    controllerId: controlReq.controllerId,
                    testIds: controlReq.testIds,
                })), cancelSource.token).then(result => {
                    const errs = result.map(r => r.error).filter(types_1.isDefined);
                    if (errs.length) {
                        this.notificationService.error((0, nls_1.localize)('testError', 'An error occurred attempting to run tests: {0}', errs.join(' ')));
                    }
                }));
                await this.saveAllBeforeTest(req);
                await Promise.all(requests);
                return result;
            }
            finally {
                this.uiRunningTests.delete(result.id);
                result.markComplete();
            }
        }
        /**
         * @inheritdoc
         */
        publishDiff(_controllerId, diff) {
            this.willProcessDiffEmitter.fire(diff);
            this.collection.apply(diff);
            this.updateEditorContextKeys();
            this.didProcessDiffEmitter.fire(diff);
        }
        /**
         * @inheritdoc
         */
        getTestController(id) {
            return this.testControllers.get(id);
        }
        /**
         * @inheritdoc
         */
        async syncTests() {
            const cts = new cancellation_1.CancellationTokenSource();
            try {
                await Promise.all([...this.testControllers.values()].map(c => c.syncTests(cts.token)));
            }
            finally {
                cts.dispose(true);
            }
        }
        /**
         * @inheritdoc
         */
        async refreshTests(controllerId) {
            const cts = new cancellation_1.CancellationTokenSource();
            this.testRefreshCancellations.add(cts);
            this.isRefreshingTests.set(true);
            try {
                if (controllerId) {
                    await this.testControllers.get(controllerId)?.refreshTests(cts.token);
                }
                else {
                    await Promise.all([...this.testControllers.values()].map(c => c.refreshTests(cts.token)));
                }
            }
            finally {
                this.testRefreshCancellations.delete(cts);
                this.isRefreshingTests.set(this.testRefreshCancellations.size > 0);
                cts.dispose(true);
            }
        }
        /**
         * @inheritdoc
         */
        cancelRefreshTests() {
            for (const cts of this.testRefreshCancellations) {
                cts.cancel();
            }
            this.testRefreshCancellations.clear();
            this.isRefreshingTests.set(false);
        }
        /**
         * @inheritdoc
         */
        registerTestController(id, controller) {
            this.testControllers.set(id, controller);
            this.providerCount.set(this.testControllers.size);
            this.updateCanRefresh();
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add((0, lifecycle_1.toDisposable)(() => {
                const diff = [];
                for (const root of this.collection.rootItems) {
                    if (root.controllerId === id) {
                        diff.push({ op: 3 /* TestDiffOpType.Remove */, itemId: root.item.extId });
                    }
                }
                this.publishDiff(id, diff);
                if (this.testControllers.delete(id)) {
                    this.providerCount.set(this.testControllers.size);
                    this.updateCanRefresh();
                }
            }));
            disposable.add(controller.canRefresh.onDidChange(this.updateCanRefresh, this));
            return disposable;
        }
        updateEditorContextKeys() {
            const uri = this.editorService.activeEditor?.resource;
            if (uri) {
                this.activeEditorHasTests.set(!iterator_1.Iterable.isEmpty(this.collection.getNodeByUrl(uri)));
            }
            else {
                this.activeEditorHasTests.set(false);
            }
        }
        async saveAllBeforeTest(req, configurationService = this.configurationService, editorService = this.editorService) {
            if (req.preserveFocus === true) {
                return;
            }
            const saveBeforeTest = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */);
            if (saveBeforeTest) {
                await editorService.saveAll();
            }
            return;
        }
        updateCanRefresh() {
            this.canRefreshTests.set(iterator_1.Iterable.some(this.testControllers.values(), t => t.canRefresh.value));
        }
    };
    exports.TestService = TestService;
    exports.TestService = TestService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, storage_1.IStorageService),
        __param(4, editorService_1.IEditorService),
        __param(5, testProfileService_1.ITestProfileService),
        __param(6, notification_1.INotificationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testResultService_1.ITestResultService),
        __param(9, workspaceTrust_1.IWorkspaceTrustRequestService)
    ], TestService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdFNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHNCQUFVO1FBcUQxQyxZQUNxQixpQkFBcUMsRUFDbEMsb0JBQTJDLEVBQzdDLGtCQUF3RCxFQUM1RCxPQUF5QyxFQUMxQyxhQUE4QyxFQUN6QyxZQUFrRCxFQUNqRCxtQkFBMEQsRUFDekQsb0JBQTRELEVBQy9ELFdBQWdELEVBQ3JDLDRCQUE0RTtZQUUzRyxLQUFLLEVBQUUsQ0FBQztZQVQ4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzNDLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBQ3pCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN4QixpQkFBWSxHQUFaLFlBQVksQ0FBcUI7WUFDaEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN4Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFvQjtZQUNwQixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBN0RwRyxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1lBRXRELGtDQUE2QixHQUFHLElBQUksZUFBTyxFQUFpQyxDQUFDO1lBQzdFLDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFhLENBQUM7WUFDbEQsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQWEsQ0FBQztZQUNqRCw2QkFBd0IsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQU0vRTs7O2VBR0c7WUFDYyxtQkFBYyxHQUFHLElBQUks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