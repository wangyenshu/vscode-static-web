/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/abstractDebugAdapter", "vs/workbench/contrib/debug/common/debugStorage"], function (require, exports, async_1, log_1, abstractDebugAdapter_1, debugStorage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockDebugStorage = exports.MockDebugAdapter = exports.MockRawSession = exports.MockSession = exports.MockDebugService = void 0;
    class MockDebugService {
        get state() {
            throw new Error('not implemented');
        }
        get onWillNewSession() {
            throw new Error('not implemented');
        }
        get onDidNewSession() {
            throw new Error('not implemented');
        }
        get onDidEndSession() {
            throw new Error('not implemented');
        }
        get onDidChangeState() {
            throw new Error('not implemented');
        }
        getConfigurationManager() {
            throw new Error('not implemented');
        }
        getAdapterManager() {
            throw new Error('Method not implemented.');
        }
        canSetBreakpointsIn(model) {
            throw new Error('Method not implemented.');
        }
        focusStackFrame(focusedStackFrame) {
            throw new Error('not implemented');
        }
        sendAllBreakpoints(session) {
            throw new Error('not implemented');
        }
        sendBreakpoints(modelUri, sourceModified, session) {
            throw new Error('not implemented');
        }
        addBreakpoints(uri, rawBreakpoints) {
            throw new Error('not implemented');
        }
        updateBreakpoints(uri, data, sendOnResourceSaved) {
            throw new Error('not implemented');
        }
        enableOrDisableBreakpoints(enabled) {
            throw new Error('not implemented');
        }
        setBreakpointsActivated() {
            throw new Error('not implemented');
        }
        removeBreakpoints() {
            throw new Error('not implemented');
        }
        addInstructionBreakpoint(opts) {
            throw new Error('Method not implemented.');
        }
        removeInstructionBreakpoints(address) {
            throw new Error('Method not implemented.');
        }
        setExceptionBreakpointCondition(breakpoint, condition) {
            throw new Error('Method not implemented.');
        }
        setExceptionBreakpointsForSession(session, data) {
            throw new Error('Method not implemented.');
        }
        addFunctionBreakpoint() { }
        moveWatchExpression(id, position) { }
        updateFunctionBreakpoint(id, update) {
            throw new Error('not implemented');
        }
        removeFunctionBreakpoints(id) {
            throw new Error('not implemented');
        }
        addDataBreakpoint() {
            throw new Error('Method not implemented.');
        }
        updateDataBreakpoint(id, update) {
            throw new Error('not implemented');
        }
        removeDataBreakpoints(id) {
            throw new Error('Method not implemented.');
        }
        addReplExpression(name) {
            throw new Error('not implemented');
        }
        removeReplExpressions() { }
        addWatchExpression(name) {
            throw new Error('not implemented');
        }
        renameWatchExpression(id, newName) {
            throw new Error('not implemented');
        }
        removeWatchExpressions(id) { }
        startDebugging(launch, configOrName, options) {
            return Promise.resolve(true);
        }
        restartSession() {
            throw new Error('not implemented');
        }
        stopSession() {
            throw new Error('not implemented');
        }
        getModel() {
            throw new Error('not implemented');
        }
        getViewModel() {
            throw new Error('not implemented');
        }
        sourceIsNotAvailable(uri) { }
        tryToAutoFocusStackFrame(thread) {
            throw new Error('not implemented');
        }
        runTo(uri, lineNumber, column) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockDebugService = MockDebugService;
    class MockSession {
        constructor() {
            this.suppressDebugToolbar = false;
            this.suppressDebugStatusbar = false;
            this.suppressDebugView = false;
            this.autoExpandLazyVariables = false;
            this.configuration = { type: 'mock', name: 'mock', request: 'launch' };
            this.unresolvedConfiguration = { type: 'mock', name: 'mock', request: 'launch' };
            this.state = 2 /* State.Stopped */;
            this.capabilities = {};
        }
        getMemory(memoryReference) {
            throw new Error('Method not implemented.');
        }
        get onDidInvalidateMemory() {
            throw new Error('Not implemented');
        }
        readMemory(memoryReference, offset, count) {
            throw new Error('Method not implemented.');
        }
        writeMemory(memoryReference, offset, data, allowPartial) {
            throw new Error('Method not implemented.');
        }
        get compoundRoot() {
            return undefined;
        }
        get saveBeforeRestart() {
            return true;
        }
        get isSimpleUI() {
            return false;
        }
        get lifecycleManagedByParent() {
            return false;
        }
        stepInTargets(frameId) {
            throw new Error('Method not implemented.');
        }
        cancel(_progressId) {
            throw new Error('Method not implemented.');
        }
        breakpointsLocations(uri, lineNumber) {
            throw new Error('Method not implemented.');
        }
        dataBytesBreakpointInfo(address, bytes) {
            throw new Error('Method not implemented.');
        }
        dataBreakpointInfo(name, variablesReference) {
            throw new Error('Method not implemented.');
        }
        sendDataBreakpoints(dbps) {
            throw new Error('Method not implemented.');
        }
        get compact() {
            return false;
        }
        setSubId(subId) {
            throw new Error('Method not implemented.');
        }
        get parentSession() {
            return undefined;
        }
        getReplElements() {
            return [];
        }
        hasSeparateRepl() {
            return true;
        }
        removeReplExpressions() { }
        get onDidChangeReplElements() {
            throw new Error('not implemented');
        }
        addReplExpression(stackFrame, name) {
            return Promise.resolve(undefined);
        }
        appendToRepl(data) { }
        getId() {
            return 'mock';
        }
        getLabel() {
            return 'mockname';
        }
        get name() {
            return 'mockname';
        }
        setName(name) {
            throw new Error('not implemented');
        }
        getSourceForUri(modelUri) {
            throw new Error('not implemented');
        }
        getThread(threadId) {
            throw new Error('not implemented');
        }
        getStoppedDetails() {
            throw new Error('not implemented');
        }
        get onDidCustomEvent() {
            throw new Error('not implemented');
        }
        get onDidLoadedSource() {
            throw new Error('not implemented');
        }
        get onDidChangeState() {
            throw new Error('not implemented');
        }
        get onDidEndAdapter() {
            throw new Error('not implemented');
        }
        get onDidChangeName() {
            throw new Error('not implemented');
        }
        get onDidProgressStart() {
            throw new Error('not implemented');
        }
        get onDidProgressUpdate() {
            throw new Error('not implemented');
        }
        get onDidProgressEnd() {
            throw new Error('not implemented');
        }
        setConfiguration(configuration) { }
        getAllThreads() {
            return [];
        }
        getSource(raw) {
            throw new Error('not implemented');
        }
        getLoadedSources() {
            return Promise.resolve([]);
        }
        completions(frameId, threadId, text, position, overwriteBefore) {
            throw new Error('not implemented');
        }
        clearThreads(removeThreads, reference) { }
        rawUpdate(data) { }
        initialize(dbgr) {
            throw new Error('Method not implemented.');
        }
        launchOrAttach(config) {
            throw new Error('Method not implemented.');
        }
        restart() {
            throw new Error('Method not implemented.');
        }
        sendBreakpoints(modelUri, bpts, sourceModified) {
            throw new Error('Method not implemented.');
        }
        sendFunctionBreakpoints(fbps) {
            throw new Error('Method not implemented.');
        }
        sendExceptionBreakpoints(exbpts) {
            throw new Error('Method not implemented.');
        }
        sendInstructionBreakpoints(dbps) {
            throw new Error('Method not implemented.');
        }
        getDebugProtocolBreakpoint(breakpointId) {
            throw new Error('Method not implemented.');
        }
        customRequest(request, args) {
            throw new Error('Method not implemented.');
        }
        stackTrace(threadId, startFrame, levels, token) {
            throw new Error('Method not implemented.');
        }
        exceptionInfo(threadId) {
            throw new Error('Method not implemented.');
        }
        scopes(frameId) {
            throw new Error('Method not implemented.');
        }
        variables(variablesReference, threadId, filter, start, count) {
            throw new Error('Method not implemented.');
        }
        evaluate(expression, frameId, context) {
            throw new Error('Method not implemented.');
        }
        restartFrame(frameId, threadId) {
            throw new Error('Method not implemented.');
        }
        next(threadId, granularity) {
            throw new Error('Method not implemented.');
        }
        stepIn(threadId, targetId, granularity) {
            throw new Error('Method not implemented.');
        }
        stepOut(threadId, granularity) {
            throw new Error('Method not implemented.');
        }
        stepBack(threadId, granularity) {
            throw new Error('Method not implemented.');
        }
        continue(threadId) {
            throw new Error('Method not implemented.');
        }
        reverseContinue(threadId) {
            throw new Error('Method not implemented.');
        }
        pause(threadId) {
            throw new Error('Method not implemented.');
        }
        terminateThreads(threadIds) {
            throw new Error('Method not implemented.');
        }
        setVariable(variablesReference, name, value) {
            throw new Error('Method not implemented.');
        }
        setExpression(frameId, expression, value) {
            throw new Error('Method not implemented.');
        }
        loadSource(resource) {
            throw new Error('Method not implemented.');
        }
        disassemble(memoryReference, offset, instructionOffset, instructionCount) {
            throw new Error('Method not implemented.');
        }
        terminate(restart = false) {
            throw new Error('Method not implemented.');
        }
        disconnect(restart = false) {
            throw new Error('Method not implemented.');
        }
        gotoTargets(source, line, column) {
            throw new Error('Method not implemented.');
        }
        goto(threadId, targetId) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockSession = MockSession;
    class MockRawSession {
        constructor() {
            this.capabilities = {};
            this.disconnected = false;
            this.sessionLengthInSeconds = 0;
            this.readyForBreakpoints = true;
            this.emittedStopped = true;
            this.onDidStop = null;
        }
        getLengthInSeconds() {
            return 100;
        }
        stackTrace(args) {
            return Promise.resolve({
                seq: 1,
                type: 'response',
                request_seq: 1,
                success: true,
                command: 'stackTrace',
                body: {
                    stackFrames: [{
                            id: 1,
                            name: 'mock',
                            line: 5,
                            column: 6
                        }]
                }
            });
        }
        exceptionInfo(args) {
            throw new Error('not implemented');
        }
        launchOrAttach(args) {
            throw new Error('not implemented');
        }
        scopes(args) {
            throw new Error('not implemented');
        }
        variables(args) {
            throw new Error('not implemented');
        }
        evaluate(args) {
            return Promise.resolve(null);
        }
        custom(request, args) {
            throw new Error('not implemented');
        }
        terminate(restart = false) {
            throw new Error('not implemented');
        }
        disconnect(restart) {
            throw new Error('not implemented');
        }
        threads() {
            throw new Error('not implemented');
        }
        stepIn(args) {
            throw new Error('not implemented');
        }
        stepOut(args) {
            throw new Error('not implemented');
        }
        stepBack(args) {
            throw new Error('not implemented');
        }
        continue(args) {
            throw new Error('not implemented');
        }
        reverseContinue(args) {
            throw new Error('not implemented');
        }
        pause(args) {
            throw new Error('not implemented');
        }
        terminateThreads(args) {
            throw new Error('not implemented');
        }
        setVariable(args) {
            throw new Error('not implemented');
        }
        restartFrame(args) {
            throw new Error('not implemented');
        }
        completions(args) {
            throw new Error('not implemented');
        }
        next(args) {
            throw new Error('not implemented');
        }
        source(args) {
            throw new Error('not implemented');
        }
        loadedSources(args) {
            throw new Error('not implemented');
        }
        setBreakpoints(args) {
            throw new Error('not implemented');
        }
        setFunctionBreakpoints(args) {
            throw new Error('not implemented');
        }
        setExceptionBreakpoints(args) {
            throw new Error('not implemented');
        }
    }
    exports.MockRawSession = MockRawSession;
    class MockDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        constructor() {
            super(...arguments);
            this.seq = 0;
            this.pendingResponses = new Map();
        }
        startSession() {
            return Promise.resolve();
        }
        stopSession() {
            return Promise.resolve();
        }
        sendMessage(message) {
            if (message.type === 'request') {
                setTimeout(() => {
                    const request = message;
                    switch (request.command) {
                        case 'evaluate':
                            this.evaluate(request, request.arguments);
                            return;
                    }
                    this.sendResponseBody(request, {});
                    return;
                }, 0);
            }
            else if (message.type === 'response') {
                const response = message;
                if (this.pendingResponses.has(response.command)) {
                    this.pendingResponses.get(response.command).complete(response);
                }
            }
        }
        sendResponseBody(request, body) {
            const response = {
                seq: ++this.seq,
                type: 'response',
                request_seq: request.seq,
                command: request.command,
                success: true,
                body
            };
            this.acceptMessage(response);
        }
        sendEventBody(event, body) {
            const response = {
                seq: ++this.seq,
                type: 'event',
                event,
                body
            };
            this.acceptMessage(response);
        }
        waitForResponseFromClient(command) {
            const deferred = new async_1.DeferredPromise();
            if (this.pendingResponses.has(command)) {
                return this.pendingResponses.get(command).p;
            }
            this.pendingResponses.set(command, deferred);
            return deferred.p;
        }
        sendRequestBody(command, args) {
            const response = {
                seq: ++this.seq,
                type: 'request',
                command,
                arguments: args
            };
            this.acceptMessage(response);
        }
        evaluate(request, args) {
            if (args.expression.indexOf('before.') === 0) {
                this.sendEventBody('output', { output: args.expression });
            }
            this.sendResponseBody(request, {
                result: '=' + args.expression,
                variablesReference: 0
            });
            if (args.expression.indexOf('after.') === 0) {
                this.sendEventBody('output', { output: args.expression });
            }
        }
    }
    exports.MockDebugAdapter = MockDebugAdapter;
    class MockDebugStorage extends debugStorage_1.DebugStorage {
        constructor(storageService) {
            super(storageService, undefined, undefined, new log_1.NullLogService());
        }
    }
    exports.MockDebugStorage = MockDebugStorage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0RlYnVnLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9jb21tb24vbW9ja0RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSxnQkFBZ0I7UUFHNUIsSUFBSSxLQUFLO1lBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFJLGdCQUFnQjtZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksZUFBZTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksZUFBZTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsdUJBQXVCO1lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsaUJBQWlCO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsbUJBQW1CLENBQUMsS0FBaUI7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxlQUFlLENBQUMsaUJBQThCO1lBQzdDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsa0JBQWtCLENBQUMsT0FBdUI7WUFDekMs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