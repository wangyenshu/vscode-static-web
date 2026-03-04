/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/themables", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/browser/callStackView", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/browser/debugService", "vs/workbench/contrib/debug/browser/debugSession", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/test/browser/mockDebugModel", "vs/workbench/contrib/debug/test/common/mockDebug"], function (require, exports, assert, sinon, themables_1, uuid_1, utils_1, range_1, testConfigurationService_1, instantiationServiceMock_1, log_1, callStackEditorContribution_1, callStackView_1, debugIcons_1, debugService_1, debugSession_1, debugModel_1, debugSource_1, mockDebugModel_1, mockDebug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTestSession = createTestSession;
    const mockWorkspaceContextService = {
        getWorkspace: () => {
            return {
                folders: []
            };
        }
    };
    function createTestSession(model, name = 'mockSession', options) {
        return new debugSession_1.DebugSession((0, uuid_1.generateUuid)(), { resolved: { name, type: 'node', request: 'launch' }, unresolved: undefined }, undefined, model, options, {
            getViewModel() {
                return {
                    updateViews() {
                        // noop
                    }
                };
            }
        }, undefined, undefined, new testConfigurationService_1.TestConfigurationService({ debug: { console: { collapseIdenticalLines: true } } }), undefined, mockWorkspaceContextService, undefined, undefined, undefined, mockDebugModel_1.mockUriIdentityService, new instantiationServiceMock_1.TestInstantiationService(), undefined, undefined, new log_1.NullLogService());
    }
    function createTwoStackFrames(session) {
        const thread = new class extends debugModel_1.Thread {
            getCallStack() {
                return [firstStackFrame, secondStackFrame];
            }
        }(session, 'mockthread', 1);
        const firstSource = new debugSource_1.Source({
            name: 'internalModule.js',
            path: 'a/b/c/d/internalModule.js',
            sourceReference: 10,
        }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
        const secondSource = new debugSource_1.Source({
            name: 'internalModule.js',
            path: 'z/x/c/d/internalModule.js',
            sourceReference: 11,
        }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
        const firstStackFrame = new debugModel_1.StackFrame(thread, 0, firstSource, 'app.js', 'normal', { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 10 }, 0, true);
        const secondStackFrame = new debugModel_1.StackFrame(thread, 1, secondSource, 'app2.js', 'normal', { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 10 }, 1, true);
        return { firstStackFrame, secondStackFrame };
    }
    suite('Debug - CallStack', () => {
        let model;
        let mockRawSession;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            model = (0, mockDebugModel_1.createMockDebugModel)(disposables);
            mockRawSession = new mockDebug_1.MockRawSession();
        });
        teardown(() => {
            sinon.restore();
        });
        // Threads
        test('threads simple', () => {
            const threadId = 1;
            const threadName = 'firstThread';
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            assert.strictEqual(model.getSessions(true).length, 1);
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId,
                        name: threadName
                    }]
            });
            assert.strictEqual(session.getThread(threadId).name, threadName);
            model.clearThreads(session.getId(), true);
            assert.strictEqual(session.getThread(threadId), undefined);
            assert.strictEqual(model.getSessions(true).length, 1);
        });
        test('threads multiple with allThreadsStopped', async () => {
            const threadId1 = 1;
            const threadName1 = 'firstThread';
            const threadId2 = 2;
            const threadName2 = 'secondThread';
            const stoppedReason = 'breakpoint';
            // Add the threads
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            session['raw'] = mockRawSession;
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }]
            });
            // Stopped event with all threads stopped
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }, {
                        id: threadId2,
                        name: threadName2
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: 1,
                    allThreadsStopped: true
                },
            });
            const thread1 = session.getThread(threadId1);
            const thread2 = session.getThread(threadId2);
            // at the beginning, callstacks are obtainable but not available
            assert.strictEqual(session.getAllThreads().length, 2);
            assert.strictEqual(thread1.name, threadName1);
            assert.strictEqual(thread1.stopped, true);
            assert.strictEqual(thread1.getCallStack().length, 0);
            assert.strictEqual(thread1.stoppedDetails.reason, stoppedReason);
            assert.strictEqual(thread2.name, threadName2);
            assert.strictEqual(thread2.stopped, true);
            assert.strictEqual(thread2.getCallStack().length, 0);
            assert.strictEqual(thread2.stoppedDetails.reason, undefined);
            // after calling getCallStack, the callstack becomes available
            // and results in a request for the callstack in the debug adapter
            await thread1.fetchCallStack();
            assert.notStrictEqual(thread1.getCallStack().length, 0);
            await thread2.fetchCallStack();
            assert.notStrictEqual(thread2.getCallStack().length, 0);
            // calling multiple times getCallStack doesn't result in multiple calls
            // to the debug adapter
            await thread1.fetchCallStack();
            await thread2.fetchCallStack();
            // clearing the callstack results in the callstack not being available
            thread1.clearCallStack();
            assert.strictEqual(thread1.stopped, true);
            assert.strictEqual(thread1.getCallStack().length, 0);
            thread2.clearCallStack();
            assert.strictEqual(thread2.stopped, true);
            assert.strictEqual(thread2.getCallStack().length, 0);
            model.clearThreads(session.getId(), true);
            assert.strictEqual(session.getThread(threadId1), undefined);
            assert.strictEqual(session.getThread(threadId2), undefined);
            assert.strictEqual(session.getAllThreads().length, 0);
        });
        test('allThreadsStopped in multiple events', async () => {
            const threadId1 = 1;
            const threadName1 = 'firstThread';
            const threadId2 = 2;
            const threadName2 = 'secondThread';
            const stoppedReason = 'breakpoint';
            // Add the threads
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            session['raw'] = mockRawSession;
            // Stopped event with all threads stopped
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }, {
                        id: threadId2,
                        name: threadName2
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: threadId1,
                    allThreadsStopped: true
                },
            });
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }, {
                        id: threadId2,
                        name: threadName2
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: threadId2,
                    allThreadsStopped: true
                },
            });
            const thread1 = session.getThread(threadId1);
            const thread2 = session.getThread(threadId2);
            assert.strictEqual(thread1.stoppedDetails?.reason, stoppedReason);
            assert.strictEqual(thread2.stoppedDetails?.reason, stoppedReason);
        });
        test('threads multiple without allThreadsStopped', async () => {
            const sessionStub = sinon.spy(mockRawSession, 'stackTrace');
            const stoppedThreadId = 1;
            const stoppedThreadName = 'stoppedThread';
            const runningThreadId = 2;
            const runningThreadName = 'runningThread';
            const stoppedReason = 'breakpoint';
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            session['raw'] = mockRawSession;
            // Add the threads
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: stoppedThreadId,
                        name: stoppedThreadName
                    }]
            });
            // Stopped event with only one thread stopped
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: 1,
                        name: stoppedThreadName
                    }, {
                        id: runningThreadId,
                        name: runningThreadName
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: 1,
                    allThreadsStopped: false
                }
            });
            const stoppedThread = session.getThread(stoppedThreadId);
            const runningThread = session.getThread(runningThreadId);
            // the callstack for the stopped thread is obtainable but not available
            // the callstack for the running thread is not obtainable nor available
            assert.strictEqual(stoppedThread.name, stoppedThreadName);
            assert.strictEqual(stoppedThread.stopped, true);
            assert.strictEqual(session.getAllThreads().length, 2);
            assert.strictEqual(stoppedThread.getCallStack().length, 0);
            assert.strictEqual(stoppedThread.stoppedDetails.reason, stoppedReason);
            assert.strictEqual(runningThread.name, runningThreadName);
            assert.strictEqual(runningThread.stopped, false);
            assert.strictEqual(runningThread.getCallStack().length, 0);
            assert.strictEqual(runningThread.stoppedDetails, undefined);
            // after calling getCallStack, the callstack becomes available
            // and results in a request for the callstack in the debug adapter
            await stoppedThread.fetchCallStack();
            assert.notStrictEqual(stoppedThread.getCallStack().length, 0);
            assert.strictEqual(runningThread.getCallStack().length, 0);
            assert.strictEqual(sessionStub.callCount, 1);
            // calling getCallStack on the running thread returns empty array
            // and does not return in a request for the callstack in the debug
            // adapter
            await runningThread.fetchCallStack();
            assert.strictEqual(runningThread.getCallStack().length, 0);
            assert.strictEqual(sessionStub.callCount, 1);
            // clearing the callstack results in the callstack not being available
            stoppedThread.clearCallStack();
            assert.strictEqual(stoppedThread.stopped, true);
            assert.strictEqual(stoppedThread.getCallStack().length, 0);
            model.clearThreads(session.getId(), true);
            assert.strictEqual(session.getThread(stoppedThreadId), undefined);
            assert.strictEqual(session.getThread(runningThreadId), undefined);
            assert.strictEqual(session.getAllThreads().length, 0);
        });
        test('stack frame get specific source name', () => {
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            const { firstStackFrame, secondStackFrame } = createTwoStackFrames(session);
            assert.strictEqual((0, callStackView_1.getSpecificSourceName)(firstStackFrame), '.../b/c/d/internalModule.js');
            assert.strictEqual((0, callStackView_1.getSpecificSourceName)(secondStackFrame), '.../x/c/d/internalModule.js');
        });
        test('stack frame toString()', () => {
            const session = createTestSession(model);
            disposables.add(session);
            const thread = new debugModel_1.Thread(session, 'mockthread', 1);
            const firstSource = new debugSource_1.Source({
                name: 'internalModule.js',
                path: 'a/b/c/d/internalModule.js',
                sourceReference: 10,
            }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
            const stackFrame = new debugModel_1.StackFrame(thread, 1, firstSource, 'app', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, 1, true);
            assert.strictEqual(stackFrame.toString(), 'app (internalModule.js:1)');
            const secondSource = new debugSource_1.Source(undefined, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
            const stackFrame2 = new debugModel_1.StackFrame(thread, 2, secondSource, 'module', 'normal', { startLineNumber: undefined, startColumn: undefined, endLineNumber: undefined, endColumn: undefined }, 2, true);
            assert.strictEqual(stackFrame2.toString(), 'module');
        });
        test('debug child sessions are added in correct order', () => {
            const session = disposables.add(createTestSession(model));
            model.addSession(session);
            const secondSession = disposables.add(createTestSession(model, 'mockSession2'));
            model.addSession(secondSession);
            const firstChild = disposables.add(createTestSession(model, 'firstChild', { parentSession: session }));
            model.addSession(firstChild);
            const secondChild = disposables.add(createTestSession(model, 'secondChild', { parentSession: session }));
            model.addSession(secondChild);
            const thirdSession = disposables.add(createTestSession(model, 'mockSession3'));
            model.addSession(thirdSession);
            const anotherChild = disposables.add(createTestSession(model, 'secondChild', { parentSession: secondSession }));
            model.addSession(anotherChild);
            const sessions = model.getSessions();
            assert.strictEqual(sessions[0].getId(), session.getId());
            assert.strictEqual(sessions[1].getId(), firstChild.getId());
            assert.strictEqual(sessions[2].getId(), secondChild.getId());
            assert.strictEqual(sessions[3].getId(), secondSession.getId());
            assert.strictEqual(sessions[4].getId(), anotherChild.getId());
            assert.strictEqual(sessions[5].getId(), thirdSession.getId());
        });
        test('decorations', () => {
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            const { firstStackFrame, secondStackFrame } = createTwoStackFrames(session);
            let decorations = (0, callStackEditorContribution_1.createDecorationsForStackFrame)(firstStackFrame, true, false);
            assert.strictEqual(decorations.length, 3);
            assert.deepStrictEqual(decorations[0].range, new range_1.Range(1, 2, 1, 3));
            assert.strictEqual(decorations[0].options.glyphMarginClassName, themables_1.ThemeIcon.asClassName(debugIcons_1.debugStackframe));
            assert.deepStrictEqual(decorations[1].range, new range_1.Range(1, 2, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */));
            assert.strictEqual(decorations[1].options.className, 'debug-top-stack-frame-line');
            assert.strictEqual(decorations[1].options.isWholeLine, true);
            decorations = (0, callStackEditorContribution_1.createDecorationsForStackFrame)(secondStackFrame, true, false);
            assert.strictEqual(decorations.length, 2);
            assert.deepStrictEqual(decorations[0].range, new range_1.Range(1, 2, 1, 3));
            assert.strictEqual(decorations[0].options.glyphMarginClassName, themables_1.ThemeIcon.asClassName(debugIcons_1.debugStackframeFocused));
            assert.deepStrictEqual(decorations[1].range, new range_1.Range(1, 2, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */));
            assert.strictEqual(decorations[1].options.className, 'debug-focused-stack-frame-line');
            assert.strictEqual(decorations[1].options.isWholeLine, true);
            decorations = (0, callStackEditorContribution_1.createDecorationsForStackFrame)(firstStackFrame, true, false);
            assert.strictEqual(decorations.length, 3);
            assert.deepStrictEqual(decorations[0].range, new range_1.Range(1, 2, 1, 3));
            assert.strictEqual(decorations[0].options.glyphMarginClassName, themables_1.ThemeIcon.asClassName(debugIcons_1.debugStackframe));
            assert.deepStrictEqual(decorations[1].range, new range_1.Range(1, 2, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */));
            assert.strictEqual(decorations[1].options.className, 'debug-top-stack-frame-line');
            assert.strictEqual(decorations[1].options.isWholeLine, true);
            // Inline decoration gets rendered in this case
            assert.strictEqual(decorations[2].options.before?.inlineClassName, 'debug-top-stack-frame-column');
            assert.deepStrictEqual(decorations[2].range, new range_1.Range(1, 2, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */));
        });
        test('contexts', () => {
            const session = createTestSession(model);
            disposables.add(session);
            model.addSession(session);
            const { firstStackFrame, secondStackFrame } = createTwoStackFrames(session);
            let context = (0, callStackView_1.getContext)(firstStackFrame);
            assert.strictEqual(context.sessionId, firstStackFrame.thread.session.getId());
            assert.strictEqual(context.threadId, firstStackFrame.thread.getId());
            assert.strictEqual(context.frameId, firstStackFrame.getId());
            context = (0, callStackView_1.getContext)(secondStackFrame.thread);
            assert.strictEqual(context.sessionId, secondStackFrame.thread.session.getId());
            assert.strictEqual(context.threadId, secondStackFrame.thread.getId());
            assert.strictEqual(context.frameId, undefined);
            context = (0, callStackView_1.getContext)(session);
            assert.strictEqual(context.sessionId, session.getId());
            assert.strictEqual(context.threadId, undefined);
            assert.strictEqual(context.frameId, undefined);
            let contributedContext = (0, callStackView_1.getContextForContributedActions)(firstStackFrame);
            assert.strictEqual(contributedContext, firstStackFrame.source.raw.path);
            contributedContext = (0, callStackView_1.getContextForContributedActions)(firstStackFrame.thread);
            assert.strictEqual(contributedContext, firstStackFrame.thread.threadId);
            contributedContext = (0, callStackView_1.getContextForContributedActions)(session);
            assert.strictEqual(contributedContext, session.getId());
        });
        test('focusStackFrameThreadAndSession', () => {
            const threadId1 = 1;
            const threadName1 = 'firstThread';
            const threadId2 = 2;
            const threadName2 = 'secondThread';
            const stoppedReason = 'breakpoint';
            // Add the threads
            const session = new class extends debugSession_1.DebugSession {
                get state() {
                    return 2 /* State.Stopped */;
                }
            }((0, uuid_1.generateUuid)(), { resolved: { name: 'stoppedSession', type: 'node', request: 'launch' }, unresolved: undefined }, undefined, model, undefined, undefined, undefined, undefined, undefined, undefined, mockWorkspaceContextService, undefined, undefined, undefined, mockDebugModel_1.mockUriIdentityService, new instantiationServiceMock_1.TestInstantiationService(), undefined, undefined, new log_1.NullLogService());
            disposables.add(session);
            const runningSession = createTestSession(model);
            disposables.add(runningSession);
            model.addSession(runningSession);
            model.addSession(session);
            session['raw'] = mockRawSession;
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }]
            });
            // Stopped event with all threads stopped
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }, {
                        id: threadId2,
                        name: threadName2
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: 1,
                    allThreadsStopped: true
                },
            });
            const thread = session.getThread(threadId1);
            const runningThread = session.getThread(threadId2);
            let toFocus = (0, debugService_1.getStackFrameThreadAndSessionToFocus)(model, undefined);
            // Verify stopped session and stopped thread get focused
            assert.deepStrictEqual(toFocus, { stackFrame: undefined, thread: thread, session: session });
            toFocus = (0, debugService_1.getStackFrameThreadAndSessionToFocus)(model, undefined, undefined, runningSession);
            assert.deepStrictEqual(toFocus, { stackFrame: undefined, thread: undefined, session: runningSession });
            toFocus = (0, debugService_1.getStackFrameThreadAndSessionToFocus)(model, undefined, thread);
            assert.deepStrictEqual(toFocus, { stackFrame: undefined, thread: thread, session: session });
            toFocus = (0, debugService_1.getStackFrameThreadAndSessionToFocus)(model, undefined, runningThread);
            assert.deepStrictEqual(toFocus, { stackFrame: undefined, thread: runningThread, session: session });
            const stackFrame = new debugModel_1.StackFrame(thread, 5, undefined, 'stackframename2', undefined, undefined, 1, true);
            toFocus = (0, debugService_1.getStackFrameThreadAndSessionToFocus)(model, stackFrame);
            assert.deepStrictEqual(toFocus, { stackFrame: stackFrame, thread: thread, session: session });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbFN0YWNrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2Jyb3dzZXIvY2FsbFN0YWNrLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUErQmhHLDhDQVVDO0lBbEJELE1BQU0sMkJBQTJCLEdBQUc7UUFDbkMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUNsQixPQUFPO2dCQUNOLE9BQU8sRUFBRSxFQUFFO2FBQ1gsQ0FBQztRQUNILENBQUM7S0FDTSxDQUFDO0lBRVQsU0FBZ0IsaUJBQWlCLENBQUMsS0FBaUIsRUFBRSxJQUFJLEdBQUcsYUFBYSxFQUFFLE9BQThCO1FBQ3hHLE9BQU8sSUFBSSwyQkFBWSxDQUFDLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtZQUNsSixZQUFZO2dCQUNYLE9BQU87b0JBQ04sV0FBVzt3QkFDVixPQUFPO29CQUNSLENBQUM7aUJBQ0QsQ0FBQztZQUNILENBQUM7U0FDZ0IsRUFBRSxTQUFVLEVBQUUsU0FBVSxFQUFFLElBQUksbURBQXdCLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFVLEVBQUUsMkJBQTJCLEVBQUUsU0FBVSxFQUFFLFNBQVUsRUFBRSxTQUFVLEVBQUUsdUNBQXNCLEVBQUUsSUFBSSxtREFBd0IsRUFBRSxFQUFFLFNBQVUsRUFBRSxTQUFVLEVBQUUsSUFB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