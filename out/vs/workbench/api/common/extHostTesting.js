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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/functional", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uuid", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTestItem", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, async_1, buffer_1, cancellation_1, event_1, functional_1, hash_1, lifecycle_1, types_1, uuid_1, log_1, extHost_protocol_1, extHostRpcService_1, extHostTestItem_1, Convert, extHostTypes_1, testId_1, testItemCollection_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestRunProfileImpl = exports.TestRunDto = exports.TestRunCoordinator = exports.ExtHostTesting = void 0;
    let ExtHostTesting = class ExtHostTesting extends lifecycle_1.Disposable {
        constructor(rpc, logService, commands, editors) {
            super();
            this.editors = editors;
            this.resultsChangedEmitter = this._register(new event_1.Emitter());
            this.controllers = new Map();
            this.defaultProfilesChangedEmitter = this._register(new event_1.Emitter());
            this.onResultsChanged = this.resultsChangedEmitter.event;
            this.results = [];
            this.proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadTesting);
            this.observer = new TestObservers(this.proxy);
            this.runTracker = new TestRunCoordinator(this.proxy, logService);
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    switch (arg?.$mid) {
                        case 16 /* MarshalledId.TestItemContext */: {
                            const cast = arg;
                            const targetTest = cast.tests[cast.tests.length - 1].item.extId;
                            const controller = this.controllers.get(testId_1.TestId.root(targetTest));
                            return controller?.collection.tree.get(targetTest)?.actual ?? (0, extHostTestItem_1.toItemFromContext)(arg);
                        }
                        case 18 /* MarshalledId.TestMessageMenuArgs */: {
                            const { test, message } = arg;
                            const extId = test.item.extId;
                            return {
                                test: this.controllers.get(testId_1.TestId.root(extId))?.collection.tree.get(extId)?.actual
                                    ?? (0, extHostTestItem_1.toItemFromContext)({ $mid: 16 /* MarshalledId.TestItemContext */, tests: [test] }),
                                message: Convert.TestMessage.to(message),
                            };
                        }
                        default: return arg;
                    }
                }
            });
            commands.registerCommand(false, 'testing.getExplorerSelection', async () => {
                const inner = await commands.executeCommand("_testing.getExplorerSelection" /* TestCommandId.GetExplorerSelection */);
                const lookup = (i) => {
                    const controller = this.controllers.get(testId_1.TestId.root(i));
                    if (!controller) {
                        return undefined;
                    }
                    return testId_1.TestId.isRoot(i) ? controller.controller : controller.collection.tree.get(i)?.actual;
                };
                return {
                    include: inner?.include.map(lookup).filter(types_1.isDefined) || [],
                    exclude: inner?.exclude.map(lookup).filter(types_1.isDefined) || [],
                };
            });
        }
        /**
         * Implements vscode.test.registerTestProvider
         */
        createTestController(extension, controllerId, label, refreshHandler) {
            if (this.controllers.has(controllerId)) {
                throw new Error(`Attempt to insert a duplicate controller with ID "${controllerId}"`);
            }
            const disposable = new lifecycle_1.DisposableStore();
            const collection = disposable.add(new extHostTestItem_1.ExtHostTestItemCollection(controllerId, label, this.editors));
            collection.root.label = label;
            const profiles = new Map();
            const activeProfiles = new Set();
            const proxy = this.proxy;
            const controller = {
                items: collection.root.children,
                get label() {
                    return label;
                },
                set label(value) {
                    label = value;
                    collection.root.label = value;
                    proxy.$updateController(controllerId, { label });
                },
                get refreshHandler() {
                    return refreshHandler;
                },
                set refreshHandler(value) {
                    refreshHandler = value;
                    proxy.$updateController(controllerId, { canRefresh: !!value });
                },
                get id() {
                    return controllerId;
                },
                createRunProfile: (label, group, runHandler, isDefault, tag, supportsContinuousRun) => {
                    // Derive the profile ID from a hash so that the same profile will tend
                    // to have the same hashes, allowing re-run requests to work across reloads.
                    let profileId = (0, hash_1.hash)(label);
                    while (profiles.has(profileId)) {
                        profileId++;
                    }
                    return new TestRunProfileImpl(this.proxy, profiles, activeProfiles, this.defaultProfilesChangedEmitter.event, controllerId, profileId, label, group, runHandler, isDefault, tag, supportsContinuousRun);
                },
                createTestItem(id, label, uri) {
                    return new extHostTestItem_1.TestItemImpl(controllerId, id, label, uri);
                },
                createTestRun: (request, name, persist = true) => {
                    return this.runTracker.createTestRun(controllerId, collection, request, name, persist);
                },
                invalidateTestResults: items => {
                    if (items === undefined) {
                        this.proxy.$markTestRetired(undefined);
                    }
                    else {
                        const itemsArr = items instanceof Array ? items : [items];
                        this.proxy.$markTestRetired(itemsArr.map(i => testId_1.TestId.fromExtHostTestItem(i, controllerId).toString()));
                    }
                },
                set resolveHandler(fn) {
                    collection.resolveHandler = fn;
                },
                get resolveHandler() {
                    return collection.resolveHandler;
                },
                dispose: () => {
                    disposable.dispose();
                },
            };
            proxy.$registerTestController(controllerId, label, !!refreshHandler);
            disposable.add((0, lifecycle_1.toDisposable)(() => proxy.$unregisterTestController(controllerId)));
            const info = { controller, collection, profiles, extension, activeProfiles };
            this.controllers.set(controllerId, info);
            disposable.add((0, lifecycle_1.toDisposable)(() => this.controllers.delete(controllerId)));
            disposable.add(collection.onDidGenerateDiff(diff => proxy.$publishDiff(controllerId, diff.map(testTypes_1.TestsDiffOp.serialize))));
            return controller;
        }
        /**
         * Implements vscode.test.createTestObserver
         */
        createTestObserver() {
            return this.observer.checkout();
        }
        /**
         * Implements vscode.test.runTests
         */
        async runTests(req, token = cancellation_1.CancellationToken.None) {
            const profile = tryGetProfileFromTestRunReq(req);
            if (!profile) {
                throw new Error('The request passed to `vscode.test.runTests` must include a profile');
            }
            const controller = this.controllers.get(profile.controllerId);
            if (!controller) {
                throw new Error('Controller not found');
            }
            await this.proxy.$runTests({
                preserveFocus: req.preserveFocus ?? true,
                targets: [{
                        testIds: req.include?.map(t => testId_1.TestId.fromExtHostTestItem(t, controller.collection.root.id).toString()) ?? [controller.collection.root.id],
                        profileGroup: profileGroupToBitset[profile.kind],
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                    }],
                exclude: req.exclude?.map(t => t.id),
            }, token);
        }
        /**
         * @inheritdoc
         */
        $syncTests() {
            for (const { collection } of this.controllers.values()) {
                collection.flushDiff();
            }
            return Promise.resolve();
        }
        /**
         * @inheritdoc
         */
        async $getCoverageDetails(coverageId, token) {
            const details = await this.runTracker.getCoverageDetails(coverageId, token);
            return details?.map(Convert.TestCoverage.fromDetails);
        }
        /**
         * @inheritdoc
         */
        async $disposeRun(runId) {
            this.runTracker.disposeTestRun(runId);
        }
        /** @inheritdoc */
        $configureRunProfile(controllerId, profileId) {
            this.controllers.get(controllerId)?.profiles.get(profileId)?.configureHandler?.();
        }
        /** @inheritdoc */
        $setDefaultRunProfiles(profiles) {
            const evt = new Map();
            for (const [controllerId, profileIds] of Object.entries(profiles)) {
                const ctrl = this.controllers.get(controllerId);
                if (!ctrl) {
                    continue;
                }
                const changes = new Map();
                const added = profileIds.filter(id => !ctrl.activeProfiles.has(id));
                const removed = [...ctrl.activeProfiles].filter(id => !profileIds.includes(id));
                for (const id of added) {
                    changes.set(id, true);
                    ctrl.activeProfiles.add(id);
                }
                for (const id of removed) {
                    changes.set(id, false);
                    ctrl.activeProfiles.delete(id);
                }
                if (changes.size) {
                    evt.set(controllerId, changes);
                }
            }
            this.defaultProfilesChangedEmitter.fire(evt);
        }
        /** @inheritdoc */
        async $refreshTests(controllerId, token) {
            await this.controllers.get(controllerId)?.controller.refreshHandler?.(token);
        }
        /**
         * Updates test results shown to extensions.
         * @override
         */
        $publishTestResults(results) {
            this.results = Object.freeze(results
                .map(Convert.TestResults.to)
                .concat(this.results)
                .sort((a, b) => b.completedAt - a.completedAt)
                .slice(0, 32));
            this.resultsChangedEmitter.fire();
        }
        /**
         * Expands the nodes in the test tree. If levels is less than zero, it will
         * be treated as infinite.
         */
        async $expandTest(testId, levels) {
            const collection = this.controllers.get(testId_1.TestId.fromString(testId).controllerId)?.collection;
            if (collection) {
                await collection.expand(testId, levels < 0 ? Infinity : levels);
                collection.flushDiff();
            }
        }
        /**
         * Receives a test update from the main thread. Called (eventually) whenever
         * tests change.
         */
        $acceptDiff(diff) {
            this.observer.applyDiff(diff.map(d => testTypes_1.TestsDiffOp.deserialize({ asCanonicalUri: u => u }, d)));
        }
        /**
         * Runs tests with the given set of IDs. Allows for test from multiple
         * providers to be run.
         * @inheritdoc
         */
        async $runControllerTests(reqs, token) {
            return Promise.all(reqs.map(req => this.runControllerTestRequest(req, false, token)));
        }
        /**
         * Starts continuous test runs with the given set of IDs. Allows for test from
         * multiple providers to be run.
         * @inheritdoc
         */
        async $startContinuousRun(reqs, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            const res = await Promise.all(reqs.map(req => this.runControllerTestRequest(req, true, cts.token)));
            // avoid returning until cancellation is requested, otherwise ipc disposes of the token
            if (!token.isCancellationRequested && !res.some(r => r.error)) {
                await new Promise(r => token.onCancellationRequested(r));
            }
            cts.dispose(true);
            return res;
        }
        async runControllerTestRequest(req, isContinuous, token) {
            const lookup = this.controllers.get(req.controllerId);
            if (!lookup) {
                return {};
            }
            const { collection, profiles } = lookup;
            const profile = profiles.get(req.profileId);
            if (!profile) {
                return {};
            }
            const includeTests = req.testIds
                .map((testId) => collection.tree.get(testId))
                .filter(types_1.isDefined);
            const excludeTests = req.excludeExtIds
                .map(id => lookup.collection.tree.get(id))
                .filter(types_1.isDefined)
                .filter(exclude => includeTests.some(include => include.fullId.compare(exclude.fullId) === 2 /* TestPosition.IsChild */));
            if (!includeTests.length) {
                return {};
            }
            const publicReq = new extHostTypes_1.TestRunRequest(includeTests.some(i => i.actual instanceof extHostTestItem_1.TestItemRootImpl) ? undefined : includeTests.map(t => t.actual), excludeTests.map(t => t.actual), profile, isContinuous);
            const tracker = (0, testTypes_1.isStartControllerTests)(req) && this.runTracker.prepareForMainThreadTestRun(publicReq, TestRunDto.fromInternal(req, lookup.collection), profile, token);
            try {
                await profile.runHandler(publicReq, token);
                return {};
            }
            catch (e) {
                return { error: String(e) };
            }
            finally {
                if (tracker) {
                    if (tracker.hasRunningTasks && !token.isCancellationRequested) {
                        await event_1.Event.toPromise(tracker.onEnd);
                    }
                }
            }
        }
        /**
         * Cancels an ongoing test run.
         */
        $cancelExtensionTestRun(runId) {
            if (runId === undefined) {
                this.runTracker.cancelAllRuns();
            }
            else {
                this.runTracker.cancelRunById(runId);
            }
        }
    };
    exports.ExtHostTesting = ExtHostTesting;
    exports.ExtHostTesting = ExtHostTesting = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostTesting);
    // Deadline after being requested by a user that a test run is forcibly cancelled.
    const RUN_CANCEL_DEADLINE = 10_000;
    var TestRunTrackerState;
    (function (TestRunTrackerState) {
        // Default state
        TestRunTrackerState[TestRunTrackerState["Running"] = 0] = "Running";
        // Cancellation is requested, but the run is still going.
        TestRunTrackerState[TestRunTrackerState["Cancelling"] = 1] = "Cancelling";
        // All tasks have ended
        TestRunTrackerState[TestRunTrackerState["Ended"] = 2] = "Ended";
    })(TestRunTrackerState || (TestRunTrackerState = {}));
    class TestRunTracker extends lifecycle_1.Disposable {
        /**
         * Gets whether there are any tests running.
         */
        get hasRunningTasks() {
            return this.running > 0;
        }
        /**
         * Gets the run ID.
         */
        get id() {
            return this.dto.id;
        }
        constructor(dto, proxy, logService, profile, parentToken) {
            super();
            this.dto = dto;
            this.proxy = proxy;
            this.logService = logService;
            this.profile = profile;
            this.state = 0 /* TestRunTrackerState.Running */;
            this.running = 0;
            this.tasks = new Map();
            this.sharedTestIds = new Set();
            this.endEmitter = this._register(new event_1.Emitter());
            this.publishedCoverage = new Map();
            /**
             * Fires when a test ends, and no more tests are left running.
             */
            this.onEnd = this.endEmitter.event;
            this.cts = this._register(new cancellation_1.CancellationTokenSource(parentToken));
            const forciblyEnd = this._register(new async_1.RunOnceScheduler(() => this.forciblyEndTasks(), RUN_CANCEL_DEADLINE));
            this._register(this.cts.token.onCancellationRequested(() => forciblyEnd.schedule()));
            const didDisposeEmitter = new event_1.Emitter();
            this.onDidDispose = didDisposeEmitter.event;
            this._register((0, lifecycle_1.toDisposable)(() => {
                didDisposeEmitter.fire();
                didDisposeEmitter.dispose();
            }));
        }
        /** Requests cancellation of the run. On the second call, forces cancellation. */
        cancel() {
            if (this.state === 0 /* TestRunTrackerState.Running */) {
                this.cts.cancel();
                this.state = 1 /* TestRunTrackerState.Cancelling */;
            }
            else if (this.state === 1 /* TestRunTrackerState.Cancelling */) {
                this.forciblyEndTasks();
            }
        }
        /** Gets details for a previously-emitted coverage object. */
        getCoverageDetails(id, token) {
            const [, taskId, covId] = testId_1.TestId.fromString(id).path; /** runId, taskId, URI */
            const coverage = this.publishedCoverage.get(covId);
            if (!coverage) {
                return [];
            }
            const task = this.tasks.get(taskId);
            if (!task) {
                throw new Error('unreachable: run task was not found');
            }
            return this.profile?.loadDetailedCoverage?.(task.run, coverage, token) ?? [];
        }
        /** Creates the public test run interface to give to extensions. */
        createRun(name) {
            const runId = this.dto.id;
            const ctrlId = this.dto.controllerId;
            const taskId = (0, uuid_1.generateUuid)();
            const guardTestMutation = (fn) => (test, ...args) => {
                if (ended) {
                    this.logService.warn(`Setting the state of test "${test.id}" is a no-op after the run ends.`);
                    return;
                }
                if (!this.dto.isIncluded(test)) {
                    return;
                }
                this.ensureTestIsKnown(test);
                fn(test, ...args);
            };
            const appendMessages = (test, messages) => {
                const converted = messages instanceof Array
                    ? messages.map(Convert.TestMessage.from)
                    : [Convert.TestMessage.from(messages)];
                if (test.uri && test.range) {
                    const defaultLocation = { range: Convert.Range.from(test.range), uri: test.uri };
                    for (const message of converted) {
                        message.location = message.location || defaultLocation;
                    }
                }
                this.proxy.$appendTestMessagesInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), converted);
            };
            let ended = false;
            const run = {
                isPersisted: this.dto.isPersisted,
                token: this.cts.token,
                name,
                onDidDispose: this.onDidDispose,
                addCoverage: coverage => {
                    const uriStr = coverage.uri.toString();
                    const id = new testId_1.TestId([runId, taskId, uriStr]).toString();
                    this.publishedCoverage.set(uriStr, coverage);
                    this.proxy.$appendCoverage(runId, taskId, Convert.TestCoverage.fromFile(id, coverage));
                },
                //#region state mutation
                enqueued: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 1 /* TestResultState.Queued */);
                }),
                skipped: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 5 /* TestResultState.Skipped */);
                }),
                started: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 2 /* TestResultState.Running */);
                }),
                errored: guardTestMutation((test, messages, duration) => {
                    appendMessages(test, messages);
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 6 /* TestResultState.Errored */, duration);
                }),
                failed: guardTestMutation((test, messages, duration) => {
                    appendMessages(test, messages);
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 4 /* TestResultState.Failed */, duration);
                }),
                passed: guardTestMutation((test, duration) => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, this.dto.controllerId).toString(), 3 /* TestResultState.Passed */, duration);
                }),
                //#endregion
                appendOutput: (output, location, test) => {
                    if (ended) {
                        return;
                    }
                    if (test) {
                        if (this.dto.isIncluded(test)) {
                            this.ensureTestIsKnown(test);
                        }
                        else {
                            test = undefined;
                        }
                    }
                    this.proxy.$appendOutputToRun(runId, taskId, buffer_1.VSBuffer.fromString(output), location && Convert.location.from(location), test && testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString());
                },
                end: () => {
                    if (ended) {
                        return;
                    }
                    ended = true;
                    this.proxy.$finishedTestRunTask(runId, taskId);
                    if (!--this.running) {
                        this.markEnded();
                    }
                }
            };
            this.running++;
            this.tasks.set(taskId, { run });
            this.proxy.$startedTestRunTask(runId, { id: taskId, name, running: true });
            return run;
        }
        forciblyEndTasks() {
            for (const { run } of this.tasks.values()) {
                run.end();
            }
        }
        markEnded() {
            if (this.state !== 2 /* TestRunTrackerState.Ended */) {
                this.state = 2 /* TestRunTrackerState.Ended */;
                this.endEmitter.fire();
            }
        }
        ensureTestIsKnown(test) {
            if (!(test instanceof extHostTestItem_1.TestItemImpl)) {
                throw new testItemCollection_1.InvalidTestItemError(test.id);
            }
            if (this.sharedTestIds.has(testId_1.TestId.fromExtHostTestItem(test, this.dto.controllerId).toString())) {
                return;
            }
            const chain = [];
            const root = this.dto.colllection.root;
            while (true) {
                const converted = Convert.TestItem.from(test);
                chain.unshift(converted);
                if (this.sharedTestIds.has(converted.extId)) {
                    break;
                }
                this.sharedTestIds.add(converted.extId);
                if (test === root) {
                    break;
                }
                test = test.parent || root;
            }
            this.proxy.$addTestsToRun(this.dto.controllerId, this.dto.id, chain);
        }
        dispose() {
            this.markEnded();
            super.dispose();
        }
    }
    /**
     * Queues runs for a single extension and provides the currently-executing
     * run so that `createTestRun` can be properly correlated.
     */
    class TestRunCoordinator {
        get trackers() {
            return this.tracked.values();
        }
        constructor(proxy, logService) {
            this.proxy = proxy;
            this.logService = logService;
            this.tracked = new Map();
            this.trackedById = new Map();
        }
        /**
         * Gets a coverage report for a given run and task ID.
         */
        getCoverageDetails(id, token) {
            const runId = testId_1.TestId.root(id);
            return this.trackedById.get(runId)?.getCoverageDetails(id, token) || [];
        }
        /**
         * Disposes the test run, called when the main thread is no longer interested
         * in associated data.
         */
        disposeTestRun(runId) {
            this.trackedById.get(runId)?.dispose();
            this.trackedById.delete(runId);
            for (const [req, { id }] of this.tracked) {
                if (id === runId) {
                    this.tracked.delete(req);
                }
            }
        }
        /**
         * Registers a request as being invoked by the main thread, so
         * `$startedExtensionTestRun` is not invoked. The run must eventually
         * be cancelled manually.
         */
        prepareForMainThreadTestRun(req, dto, profile, token) {
            return this.getTracker(req, dto, profile, token);
        }
        /**
         * Cancels an existing test run via its cancellation token.
         */
        cancelRunById(runId) {
            this.trackedById.get(runId)?.cancel();
        }
        /**
         * Cancels an existing test run via its cancellation token.
         */
        cancelAllRuns() {
            for (const tracker of this.tracked.values()) {
                tracker.cancel();
            }
        }
        /**
         * Implements the public `createTestRun` API.
         */
        createTestRun(controllerId, collection, request, name, persist) {
            const existing = this.tracked.get(request);
            if (existing) {
                return existing.createRun(name);
            }
            // If there is not an existing tracked extension for the request, start
            // a new, detached session.
            const dto = TestRunDto.fromPublic(controllerId, collection, request, persist);
            const profile = tryGetProfileFromTestRunReq(request);
            this.proxy.$startedExtensionTestRun({
                controllerId,
                continuous: !!request.continuous,
                profile: profile && { group: profileGroupToBitset[profile.kind], id: profile.profileId },
                exclude: request.exclude?.map(t => testId_1.TestId.fromExtHostTestItem(t, collection.root.id).toString()) ?? [],
                id: dto.id,
                include: request.include?.map(t => testId_1.TestId.fromExtHostTestItem(t, collection.root.id).toString()) ?? [collection.root.id],
                preserveFocus: request.preserveFocus ?? true,
                persist
            });
            const tracker = this.getTracker(request, dto, request.profile);
            event_1.Event.once(tracker.onEnd)(() => {
                this.proxy.$finishedExtensionTestRun(dto.id);
            });
            return tracker.createRun(name);
        }
        getTracker(req, dto, profile, token) {
            const tracker = new TestRunTracker(dto, this.proxy, this.logService, profile, token);
            this.tracked.set(req, tracker);
            this.trackedById.set(tracker.id, tracker);
            return tracker;
        }
    }
    exports.TestRunCoordinator = TestRunCoordinator;
    const tryGetProfileFromTestRunReq = (request) => {
        if (!request.profile) {
            return undefined;
        }
        if (!(request.profile instanceof TestRunProfileImpl)) {
            throw new Error(`TestRunRequest.profile is not an instance created from TestController.createRunProfile`);
        }
        return request.profile;
    };
    class TestRunDto {
        static fromPublic(controllerId, collection, request, persist) {
            return new TestRunDto(controllerId, (0, uuid_1.generateUuid)(), request.include?.map(t => testId_1.TestId.fromExtHostTestItem(t, controllerId).toString()) ?? [controllerId], request.exclude?.map(t => testId_1.TestId.fromExtHostTestItem(t, controllerId).toString()) ?? [], persist, collection);
        }
        static fromInternal(request, collection) {
            return new TestRunDto(request.controllerId, request.runId, request.testIds, request.excludeExtIds, true, collection);
        }
        constructor(controllerId, id, include, exclude, isPersisted, colllection) {
            this.controllerId = controllerId;
            this.id = id;
            this.isPersisted = isPersisted;
            this.colllection = colllection;
            this.includePrefix = include.map(id => id + "\0" /* TestIdPathParts.Delimiter */);
            this.excludePrefix = exclude.map(id => id + "\0" /* TestIdPathParts.Delimiter */);
        }
        isIncluded(test) {
            const id = testId_1.TestId.fromExtHostTestItem(test, this.controllerId).toString() + "\0" /* TestIdPathParts.Delimiter */;
            for (const prefix of this.excludePrefix) {
                if (id === prefix || id.startsWith(prefix)) {
                    return false;
                }
            }
            for (const prefix of this.includePrefix) {
                if (id === prefix || id.startsWith(prefix)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.TestRunDto = TestRunDto;
    class MirroredChangeCollector {
        get isEmpty() {
            return this.added.size === 0 && this.removed.size === 0 && this.updated.size === 0;
        }
        constructor(emitter) {
            this.emitter = emitter;
            this.added = new Set();
            this.updated = new Set();
            this.removed = new Set();
            this.alreadyRemoved = new Set();
        }
        /**
         * @inheritdoc
         */
        add(node) {
            this.added.add(node);
        }
        /**
         * @inheritdoc
         */
        update(node) {
            Object.assign(node.revived, Convert.TestItem.toPlain(node.item));
            if (!this.added.has(node)) {
                this.updated.add(node);
            }
        }
        /**
         * @inheritdoc
         */
        remove(node) {
            if (this.added.has(node)) {
                this.added.delete(node);
                return;
            }
            this.updated.delete(node);
            const parentId = testId_1.TestId.parentId(node.item.extId);
            if (parentId && this.alreadyRemoved.has(parentId.toString())) {
                this.alreadyRemoved.add(node.item.extId);
                return;
            }
            this.removed.add(node);
        }
        /**
         * @inheritdoc
         */
        getChangeEvent() {
            const { added, updated, removed } = this;
            return {
                get added() { return [...added].map(n => n.revived); },
                get updated() { return [...updated].map(n => n.revived); },
                get removed() { return [...removed].map(n => n.revived); },
            };
        }
        complete() {
            if (!this.isEmpty) {
                this.emitter.fire(this.getChangeEvent());
            }
        }
    }
    /**
     * Maintains tests in this extension host sent from the main thread.
     * @private
     */
    class MirroredTestCollection extends testTypes_1.AbstractIncrementalTestCollection {
        constructor() {
            super(...arguments);
            this.changeEmitter = new event_1.Emitter();
            /**
             * Change emitter that fires with the same semantics as `TestObserver.onDidChangeTests`.
             */
            this.onDidChangeTests = this.changeEmitter.event;
        }
        /**
         * Gets a list of root test items.
         */
        get rootTests() {
            return this.roots;
        }
        /**
         *
         * If the test ID exists, returns its underlying ID.
         */
        getMirroredTestDataById(itemId) {
            return this.items.get(itemId);
        }
        /**
         * If the test item is a mirrored test item, returns its underlying ID.
         */
        getMirroredTestDataByReference(item) {
            return this.items.get(item.id);
        }
        /**
         * @override
         */
        createItem(item, parent) {
            return {
                ...item,
                // todo@connor4312: make this work well again with children
                revived: Convert.TestItem.toPlain(item.item),
                depth: parent ? parent.depth + 1 : 0,
                children: new Set(),
            };
        }
        /**
         * @override
         */
        createChangeCollector() {
            return new MirroredChangeCollector(this.changeEmitter);
        }
    }
    class TestObservers {
        constructor(proxy) {
            this.proxy = proxy;
        }
        checkout() {
            if (!this.current) {
                this.current = this.createObserverData();
            }
            const current = this.current;
            current.observers++;
            return {
                onDidChangeTest: current.tests.onDidChangeTests,
                get tests() { return [...current.tests.rootTests].map(t => t.revived); },
                dispose: (0, functional_1.createSingleCallFunction)(() => {
                    if (--current.observers === 0) {
                        this.proxy.$unsubscribeFromDiffs();
                        this.current = undefined;
                    }
                }),
            };
        }
        /**
         * Gets the internal test data by its reference.
         */
        getMirroredTestDataByReference(ref) {
            return this.current?.tests.getMirroredTestDataByReference(ref);
        }
        /**
         * Applies test diffs to the current set of observed tests.
         */
        applyDiff(diff) {
            this.current?.tests.apply(diff);
        }
        createObserverData() {
            const tests = new MirroredTestCollection({ asCanonicalUri: u => u });
            this.proxy.$subscribeToDiffs();
            return { observers: 0, tests, };
        }
    }
    const updateProfile = (impl, proxy, initial, update) => {
        if (initial) {
            Object.assign(initial, update);
        }
        else {
            proxy.$updateTestRunConfig(impl.controllerId, impl.profileId, update);
        }
    };
    class TestRunProfileImpl {
        #proxy;
        #activeProfiles;
        #onDidChangeDefaultProfiles;
        #initialPublish;
        #profiles;
        get label() {
            return this._label;
        }
        set label(label) {
            if (label !== this._label) {
                this._label = label;
                updateProfile(this, this.#proxy, this.#initialPublish, { label });
            }
        }
        get supportsContinuousRun() {
            return this._supportsContinuousRun;
        }
        set supportsContinuousRun(supports) {
            if (supports !== this._supportsContinuousRun) {
                this._supportsContinuousRun = supports;
                updateProfile(this, this.#proxy, this.#initialPublish, { supportsContinuousRun: supports });
            }
        }
        get isDefault() {
            return this.#activeProfiles.has(this.profileId);
        }
        set isDefault(isDefault) {
            if (isDefault !== this.isDefault) {
                // #activeProfiles is synced from the main thread, so we can make
                // provisional changes here that will get confirmed momentarily
                if (isDefault) {
                    this.#activeProfiles.add(this.profileId);
                }
                else {
                    this.#activeProfiles.delete(this.profileId);
                }
                updateProfile(this, this.#proxy, this.#initialPublish, { isDefault });
            }
        }
        get tag() {
            return this._tag;
        }
        set tag(tag) {
            if (tag?.id !== this._tag?.id) {
                this._tag = tag;
                updateProfile(this, this.#proxy, this.#initialPublish, {
                    tag: tag ? Convert.TestTag.namespace(this.controllerId, tag.id) : null,
                });
            }
        }
        get configureHandler() {
            return this._configureHandler;
        }
        set configureHandler(handler) {
            if (handler !== this._configureHandler) {
                this._configureHandler = handler;
                updateProfile(this, this.#proxy, this.#initialPublish, { hasConfigurationHandler: !!handler });
            }
        }
        get onDidChangeDefault() {
            return event_1.Event.chain(this.#onDidChangeDefaultProfiles, $ => $
                .map(ev => ev.get(this.controllerId)?.get(this.profileId))
                .filter(types_1.isDefined));
        }
        constructor(proxy, profiles, activeProfiles, onDidChangeActiveProfiles, controllerId, profileId, _label, kind, runHandler, _isDefault = false, _tag = undefined, _supportsContinuousRun = false) {
            this.controllerId = controllerId;
            this.profileId = profileId;
            this._label = _label;
            this.kind = kind;
            this.runHandler = runHandler;
            this._tag = _tag;
            this._supportsContinuousRun = _supportsContinuousRun;
            this.#proxy = proxy;
            this.#profiles = profiles;
            this.#activeProfiles = activeProfiles;
            this.#onDidChangeDefaultProfiles = onDidChangeActiveProfiles;
            profiles.set(profileId, this);
            const groupBitset = profileGroupToBitset[kind];
            if (typeof groupBitset !== 'number') {
                throw new Error(`Unknown TestRunProfile.group ${kind}`);
            }
            if (_isDefault) {
                activeProfiles.add(profileId);
            }
            this.#initialPublish = {
                profileId: profileId,
                controllerId,
                tag: _tag ? Convert.TestTag.namespace(this.controllerId, _tag.id) : null,
                label: _label,
                group: groupBitset,
                isDefault: _isDefault,
                hasConfigurationHandler: false,
                supportsContinuousRun: _supportsContinuousRun,
            };
            // we send the initial profile publish out on the next microtask so that
            // initially setting the isDefault value doesn't overwrite a user-configured value
            queueMicrotask(() => {
                if (this.#initialPublish) {
                    this.#proxy.$publishTestRunProfile(this.#initialPublish);
                    this.#initialPublish = undefined;
                }
            });
        }
        dispose() {
            if (this.#profiles?.delete(this.profileId)) {
                this.#profiles = undefined;
                this.#proxy.$removeTestProfile(this.controllerId, this.profileId);
            }
            this.#initialPublish = undefined;
        }
    }
    exports.TestRunProfileImpl = TestRunProfileImpl;
    const profileGroupToBitset = {
        [extHostTypes_1.TestRunProfileKind.Coverage]: 8 /* TestRunProfileBitset.Coverage */,
        [extHostTypes_1.TestRunProfileKind.Debug]: 4 /* TestRunProfileBitset.Debug */,
        [extHostTypes_1.TestRunProfileKind.Run]: 2 /* TestRunProfileBitset.Run */,
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlc3RpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGVzdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1Q3pGLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQVc3QyxZQUNxQixHQUF1QixFQUM5QixVQUF1QixFQUNwQyxRQUF5QixFQUNSLE9BQW1DO1lBRXBELEtBQUssRUFBRSxDQUFDO1lBRlMsWUFBTyxHQUFQLE9BQU8sQ0FBNEI7WUFkcEMsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDMUQsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBOEMsQ0FBQztZQUl0RSxrQ0FBNkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE2QixDQUFDLENBQUM7WUFFbkcscUJBQWdCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUNwRCxZQUFPLEdBQXdDLEVBQUUsQ0FBQztZQVN4RCxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRWpFLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQztnQkFDbEMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxFQUFFO29CQUN0QixRQUFRLEdB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