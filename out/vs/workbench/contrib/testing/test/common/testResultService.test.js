/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/test/common/utils", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testResultStorage", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/test/common/testStubs", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, async_1, buffer_1, cancellation_1, utils_1, mockKeybindingService_1, log_1, telemetryUtils_1, testId_1, testProfileService_1, testResult_1, testResultService_1, testResultStorage_1, testingStates_1, testStubs_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Test Results Service', () => {
        const getLabelsIn = (it) => [...it].map(t => t.item.label).sort();
        const getChangeSummary = () => [...changed]
            .map(c => ({ reason: c.reason, label: c.item.item.label }));
        let r;
        let changed = new Set();
        let tests;
        const defaultOpts = (testIds) => ({
            targets: [{
                    profileGroup: 2 /* TestRunProfileBitset.Run */,
                    profileId: 0,
                    controllerId: 'ctrlId',
                    testIds,
                }]
        });
        class TestLiveTestResult extends testResult_1.LiveTestResult {
            constructor(id, persist, request) {
                super(id, persist, request, telemetryUtils_1.NullTelemetryService);
                ds.add(this);
            }
            setAllToStatePublic(state, taskId, when) {
                this.setAllToState(state, taskId, when);
            }
        }
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            changed = new Set();
            r = ds.add(new TestLiveTestResult('foo', true, defaultOpts(['id-a'])));
            ds.add(r.onChange(e => changed.add(e)));
            r.addTask({ id: 't', name: undefined, running: true });
            tests = ds.add(testStubs_1.testStubs.nested());
            const cts = ds.add(new cancellation_1.CancellationTokenSource());
            const ok = await Promise.race([
                Promise.resolve(tests.expand(tests.root.id, Infinity)).then(() => true),
                (0, async_1.timeout)(1000, cts.token).then(() => false),
            ]);
            cts.cancel();
            // todo@connor4312: debug for tests #137853:
            if (!ok) {
                throw new Error('timed out while expanding, diff: ' + JSON.stringify(tests.collectDiff()));
            }
            r.addTestChainToRun('ctrlId', [
                tests.root.toTestItem(),
                tests.root.children.get('id-a').toTestItem(),
                tests.root.children.get('id-a').children.get('id-aa').toTestItem(),
            ]);
            r.addTestChainToRun('ctrlId', [
                tests.root.children.get('id-a').toTestItem(),
                tests.root.children.get('id-a').children.get('id-ab').toTestItem(),
            ]);
        });
        // ensureNoDisposablesAreLeakedInTestSuite(); todo@connor4312
        suite('LiveTestResult', () => {
            test('is empty if no tests are yet present', async () => {
                assert.deepStrictEqual(getLabelsIn(new TestLiveTestResult('foo', false, defaultOpts(['id-a'])).tests), []);
            });
            test('initially queues nothing', () => {
                assert.deepStrictEqual(getChangeSummary(), []);
            });
            test('initializes with the subtree of requested tests', () => {
                assert.deepStrictEqual(getLabelsIn(r.tests), ['a', 'aa', 'ab', 'root']);
            });
            test('initializes with valid counts', () => {
                const c = (0, testingStates_1.makeEmptyCounts)();
                c[0 /* TestResultState.Unset */] = 4;
                assert.deepStrictEqual(r.counts, c);
            });
            test('setAllToState', () => {
                changed.clear();
                r.setAllToStatePublic(1 /* TestResultState.Queued */, 't', (_, t) => t.item.label !== 'root');
                const c = (0, testingStates_1.makeEmptyCounts)();
                c[0 /* TestResultState.Unset */] = 1;
                c[1 /* TestResultState.Queued */] = 3;
                assert.deepStrictEqual(r.counts, c);
                r.setAllToStatePublic(4 /* TestResultState.Failed */, 't', (_, t) => t.item.label !== 'root');
                const c2 = (0, testingStates_1.makeEmptyCounts)();
                c2[0 /* TestResultState.Unset */] = 1;
                c2[4 /* TestResultState.Failed */] = 3;
                assert.deepStrictEqual(r.counts, c2);
                assert.deepStrictEqual(r.getStateById(new testId_1.TestId(['ctrlId', 'id-a']).toString())?.ownComputedState, 4 /* TestResultState.Failed */);
                assert.deepStrictEqual(r.getStateById(new testId_1.TestId(['ctrlId', 'id-a']).toString())?.tasks[0].state, 4 /* TestResultState.Failed */);
                assert.deepStrictEqual(getChangeSummary(), [
                    { label: 'a', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'root', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                    { label: 'aa', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'ab', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'a', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'root', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                    { label: 'aa', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'ab', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                ]);
            });
            test('updateState', () => {
                changed.clear();
                const testId = new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString();
                r.updateState(testId, 't', 2 /* TestResultState.Running */);
                const c = (0, testingStates_1.makeEmptyCounts)();
                c[2 /* TestResultState.Running */] = 1;
                c[0 /* TestResultState.Unset */] = 3;
                assert.deepStrictEqual(r.counts, c);
                assert.deepStrictEqual(r.getStateById(testId)?.ownComputedState, 2 /* TestResultState.Running */);
                // update computed state:
                assert.deepStrictEqual(r.getStateById(tests.root.id)?.computedState, 2 /* TestResultState.Running */);
                assert.deepStrictEqual(getChangeSummary(), [
                    { label: 'aa', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'a', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                    { label: 'root', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                ]);
                r.updateState(testId, 't', 3 /* TestResultState.Passed */);
                assert.deepStrictEqual(r.getStateById(testId)?.ownComputedState, 3 /* TestResultState.Passed */);
                r.updateState(testId, 't', 6 /* TestResultState.Errored */);
                assert.deepStrictEqual(r.getStateById(testId)?.ownComputedState, 6 /* TestResultState.Errored */);
                r.updateState(testId, 't', 3 /* TestResultState.Passed */);
                assert.deepStrictEqual(r.getStateById(testId)?.ownComputedState, 6 /* TestResultState.Errored */);
            });
            test('ignores outside run', () => {
                changed.clear();
                r.updateState(new testId_1.TestId(['ctrlId', 'id-b']).toString(), 't', 2 /* TestResultState.Running */);
                const c = (0, testingStates_1.makeEmptyCounts)();
                c[0 /* TestResultState.Unset */] = 4;
                assert.deepStrictEqual(r.counts, c);
                assert.deepStrictEqual(r.getStateById(new testId_1.TestId(['ctrlId', 'id-b']).toString()), undefined);
            });
            test('markComplete', () => {
                r.setAllToStatePublic(1 /* TestResultState.Queued */, 't', () => true);
                r.updateState(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), 't', 3 /* TestResultState.Passed */);
                changed.clear();
                r.markComplete();
                const c = (0, testingStates_1.makeEmptyCounts)();
                c[0 /* TestResultState.Unset */] = 3;
                c[3 /* TestResultState.Passed */] = 1;
                assert.deepStrictEqual(r.counts, c);
                assert.deepStrictEqual(r.getStateById(tests.root.id)?.ownComputedState, 0 /* TestResultState.Unset */);
                assert.deepStrictEqual(r.getStateById(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString())?.ownComputedState, 3 /* TestResultState.Passed */);
            });
        });
        suite('service', () => {
            let storage;
            let results;
            class TestTestResultService extends testResultService_1.TestResultService {
                constructor() {
                    super(...arguments);
                    this.persistScheduler = { schedule: () => this.persistImmediately() };
                }
            }
            setup(() => {
                storage = ds.add(new testResultStorage_1.InMemoryResultStorage({
                    asCanonicalUri(uri) {
                        return uri;
                    },
                }, ds.add(new workbenchTestServices_1.TestStorageService()), new log_1.NullLogService()));
                results = ds.add(new TestTestResultService(new mockKeybindingService_1.MockContextKeyService(), storage, ds.add(new testProfileService_1.TestProfileService(new mockKeybindingService_1.MockContextKeyService(), ds.add(new workbenchTestServices_1.TestStorageService()))), telemetryUtils_1.NullTelemetryService));
            });
            test('pushes new result', () => {
                results.push(r);
                assert.deepStrictEqual(results.results, [r]);
            });
            test('serializes and re-hydrates', async () => {
                results.push(r);
                r.updateState(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), 't', 3 /* TestResultState.Passed */, 42);
                r.markComplete();
                await (0, async_1.timeout)(10); // allow persistImmediately async to happen
                results = ds.add(new testResultService_1.TestResultService(new mockKeybindingService_1.MockContextKeyService(), storage, ds.add(new testProfileService_1.TestProfileService(new mockKeybindingService_1.MockContextKeyService(), ds.add(new workbenchTestServices_1.TestStorageService()))), telemetryUtils_1.NullTelemetryService));
                assert.strictEqual(0, results.results.length);
                await (0, async_1.timeout)(10); // allow load promise to resolve
                assert.strictEqual(1, results.results.length);
                const [rehydrated, actual] = results.getStateById(tests.root.id);
                const expected = { ...r.getStateById(tests.root.id) };
                expected.item.uri = actual.item.uri;
                expected.item.children = undefined;
                expected.retired = true;
                delete expected.children;
                assert.deepStrictEqual(actual, { ...expected });
                assert.deepStrictEqual(rehydrated.counts, r.counts);
                assert.strictEqual(typeof rehydrated.completedAt, 'number');
            });
            test('clears results but keeps ongoing tests', async () => {
                results.push(r);
                r.markComplete();
                const r2 = results.push(new testResult_1.LiveTestResult('', false, defaultOpts([]), telemetryUtils_1.NullTelemetryService));
                results.clear();
                assert.deepStrictEqual(results.results, [r2]);
            });
            test('keeps ongoing tests on top', async () => {
                results.push(r);
                const r2 = results.push(new testResult_1.LiveTestResult('', false, defaultOpts([]), telemetryUtils_1.NullTelemetryService));
                assert.deepStrictEqual(results.results, [r2, r]);
                r2.markComplete();
                assert.deepStrictEqual(results.results, [r, r2]);
                r.markComplete();
                assert.deepStrictEqual(results.results, [r, r2]);
            });
            const makeHydrated = async (completedAt = 42, state = 3 /* TestResultState.Passed */) => new testResult_1.HydratedTestResult({
                asCanonicalUri(uri) {
                    return uri;
                },
            }, {
                completedAt,
                id: 'some-id',
                tasks: [{ id: 't', name: undefined }],
                name: 'hello world',
                request: defaultOpts([]),
                items: [{
                        ...(await (0, testStubs_1.getInitializedMainTestCollection)()).getNodeById(new testId_1.TestId(['ctrlId', 'id-a']).toString()),
                        tasks: [{ state, duration: 0, messages: [] }],
                        computedState: state,
                        ownComputedState: state,
                    }]
            });
            test('pushes hydrated results', async () => {
                results.push(r);
                const hydrated = await makeHydrated();
                results.push(hydrated);
                assert.deepStrictEqual(results.results, [r, hydrated]);
            });
            test('inserts in correct order', async () => {
                results.push(r);
                const hydrated1 = await makeHydrated();
                results.push(hydrated1);
                assert.deepStrictEqual(results.results, [r, hydrated1]);
            });
            test('inserts in correct order 2', async () => {
                results.push(r);
                const hydrated1 = await makeHydrated();
                results.push(hydrated1);
                const hydrated2 = await makeHydrated(30);
                results.push(hydrated2);
                assert.deepStrictEqual(results.results, [r, hydrated1, hydrated2]);
            });
        });
        test('resultItemParents', function () {
            assert.deepStrictEqual([...(0, testResult_1.resultItemParents)(r, r.getStateById(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString()))], [
                r.getStateById(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString()),
                r.getStateById(new testId_1.TestId(['ctrlId', 'id-a']).toString()),
                r.getStateById(new testId_1.TestId(['ctrlId']).toString()),
            ]);
            assert.deepStrictEqual([...(0, testResult_1.resultItemParents)(r, r.getStateById(tests.root.id))], [
                r.getStateById(tests.root.id),
            ]);
        });
        suite('output controller', () => {
            test('reads live output ranges', async () => {
                const ctrl = new testResult_1.TaskRawOutput();
                ctrl.append(buffer_1.VSBuffer.fromString('12345'));
                ctrl.append(buffer_1.VSBuffer.fromString('67890'));
                ctrl.append(buffer_1.VSBuffer.fromString('12345'));
                ctrl.append(buffer_1.VSBuffer.fromString('67890'));
                assert.deepStrictEqual(ctrl.getRange(0, 5), buffer_1.VSBuffer.fromString('12345'));
                assert.deepStrictEqual(ctrl.getRange(5, 5), buffer_1.VSBuffer.fromString('67890'));
                assert.deepStrictEqual(ctrl.getRange(7, 6), buffer_1.VSBuffer.fromString('890123'));
                assert.deepStrictEqual(ctrl.getRange(15, 5), buffer_1.VSBuffer.fromString('67890'));
                assert.deepStrictEqual(ctrl.getRange(15, 10), buffer_1.VSBuffer.fromString('67890'));
            });
            test('corrects offsets for marked ranges', async () => {
                const ctrl = new testResult_1.TaskRawOutput();
                const a1 = ctrl.append(buffer_1.VSBuffer.fromString('12345'), 1);
                const a2 = ctrl.append(buffer_1.VSBuffer.fromString('67890'), 1234);
                const a3 = ctrl.append(buffer_1.VSBuffer.fromString('with new line\r\n'), 4);
                assert.deepStrictEqual(ctrl.getRange(a1.offset, a1.length), buffer_1.VSBuffer.fromString('\x1b]633;SetMark;Id=s1;Hidden\x0712345\x1b]633;SetMark;Id=e1;Hidden\x07'));
                assert.deepStrictEqual(ctrl.getRange(a2.offset, a2.length), buffer_1.VSBuffer.fromString('\x1b]633;SetMark;Id=s1234;Hidden\x0767890\x1b]633;SetMark;Id=e1234;Hidden\x07'));
                assert.deepStrictEqual(ctrl.getRange(a3.offset, a3.length), buffer_1.VSBuffer.fromString('\x1b]633;SetMark;Id=s4;Hidden\x07with new line\x1b]633;SetMark;Id=e4;Hidden\x07\r\n'));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvdGVzdC9jb21tb24vdGVzdFJlc3VsdFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtRQUM5QyxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQTRCLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVGLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQzthQUN6QyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU3RCxJQUFJLENBQXFCLENBQUM7UUFDMUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7UUFDOUMsSUFBSSxLQUF5QixDQUFDO1FBRTlCLE1BQU0sV0FBVyxHQUFHLENBQUMsT0FBaUIsRUFBMEIsRUFBRSxDQUFDLENBQUM7WUFDbkUsT0FBTyxFQUFFLENBQUM7b0JBQ1QsWUFBWSxrQ0FBMEI7b0JBQ3RDLFNBQVMsRUFBRSxDQUFDO29CQUNaLFlBQVksRUFBRSxRQUFRO29CQUN0QixPQUFPO2lCQUNQLENBQUM7U0FDRixDQUFDLENBQUM7UUFFSCxN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