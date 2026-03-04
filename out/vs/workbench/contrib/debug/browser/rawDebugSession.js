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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/debug/common/extensionHostDebug", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/base/common/network"], function (require, exports, nls, event_1, objects, actions_1, errors, errorMessage_1, debugUtils_1, extensionHostDebug_1, uri_1, opener_1, lifecycle_1, notification_1, dialogs_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RawDebugSession = void 0;
    /**
     * Encapsulates the DebugAdapter lifecycle and some idiosyncrasies of the Debug Adapter Protocol.
     */
    let RawDebugSession = class RawDebugSession {
        constructor(debugAdapter, dbgr, sessionId, name, extensionHostDebugService, openerService, notificationService, dialogSerivce) {
            this.dbgr = dbgr;
            this.sessionId = sessionId;
            this.name = name;
            this.extensionHostDebugService = extensionHostDebugService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.dialogSerivce = dialogSerivce;
            this.allThreadsContinued = true;
            this._readyForBreakpoints = false;
            // shutdown
            this.debugAdapterStopped = false;
            this.inShutdown = false;
            this.terminated = false;
            this.firedAdapterExitEvent = false;
            // telemetry
            this.startTime = 0;
            this.didReceiveStoppedEvent = false;
            // DAP events
            this._onDidInitialize = new event_1.Emitter();
            this._onDidStop = new event_1.Emitter();
            this._onDidContinued = new event_1.Emitter();
            this._onDidTerminateDebugee = new event_1.Emitter();
            this._onDidExitDebugee = new event_1.Emitter();
            this._onDidThread = new event_1.Emitter();
            this._onDidOutput = new event_1.Emitter();
            this._onDidBreakpoint = new event_1.Emitter();
            this._onDidLoadedSource = new event_1.Emitter();
            this._onDidProgressStart = new event_1.Emitter();
            this._onDidProgressUpdate = new event_1.Emitter();
            this._onDidProgressEnd = new event_1.Emitter();
            this._onDidInvalidated = new event_1.Emitter();
            this._onDidInvalidateMemory = new event_1.Emitter();
            this._onDidCustomEvent = new event_1.Emitter();
            this._onDidEvent = new event_1.Emitter();
            // DA events
            this._onDidExitAdapter = new event_1.Emitter();
            this.stoppedSinceLastStep = false;
            this.toDispose = [];
            this.debugAdapter = debugAdapter;
            this._capabilities = Object.create(null);
            this.toDispose.push(this.debugAdapter.onError(err => {
                this.shutdown(err);
            }));
            this.toDispose.push(this.debugAdapter.onExit(code => {
                if (code !== 0) {
                    this.shutdown(new Error(`exit code: ${code}`));
                }
                else {
                    // normal exit
                    this.shutdown();
                }
            }));
            this.debugAdapter.onEvent(event => {
                switch (event.event) {
                    case 'initialized':
                        this._readyForBreakpoints = true;
                        this._onDidInitialize.fire(event);
                        break;
                    case 'loadedSource':
                        this._onDidLoadedSource.fire(event);
                        break;
                    case 'capabilities':
                        if (event.body) {
                            const capabilities = event.body.capabilities;
                            this.mergeCapabilities(capabilities);
                        }
                        break;
                    case 'stopped':
                        this.didReceiveStoppedEvent = true; // telemetry: remember that debugger stopped successfully
                        this.stoppedSinceLastStep = true;
                        this._onDidStop.fire(event);
                        break;
                    case 'continued':
                        this.allThreadsContinued = event.body.allThreadsContinued === false ? false : true;
                        this._onDidContinued.fire(event);
                        break;
                    case 'thread':
                        this._onDidThread.fire(event);
                        break;
                    case 'output':
                        this._onDidOutput.fire(event);
                        break;
                    case 'breakpoint':
                        this._onDidBreakpoint.fire(event);
                        break;
                    case 'terminated':
                        this._onDidTerminateDebugee.fire(event);
                        break;
                    case 'exited':
                        this._onDidExitDebugee.fire(event);
                        break;
                    case 'progressStart':
                        this._onDidProgressStart.fire(event);
                        break;
                    case 'progressUpdate':
                        this._onDidProgressUpdate.fire(event);
                        break;
                    case 'progressEnd':
                        this._onDidProgressEnd.fire(event);
                        break;
                    case 'invalidated':
                        this._onDidInvalidated.fire(event);
                        break;
                    case 'memory':
                        this._onDidInvalidateMemory.fire(event);
                        break;
                    case 'process':
                        break;
                    case 'module':
                        break;
                    default:
                        this._onDidCustomEvent.fire(event);
                        break;
                }
                this._onDidEvent.fire(event);
            });
            this.debugAdapter.onRequest(request => this.dispatchRequest(request));
        }
        get isInShutdown() {
            return this.inShutdown;
        }
        get onDidExitAdapter() {
            return this._onDidExitAdapter.event;
        }
        get capabilities() {
            return this._capabilities;
        }
        /**
         * DA is ready to accepts setBreakpoint requests.
         * Becomes true after "initialized" events has been received.
         */
        get readyForBreakpoints() {
            return this._readyForBreakpoints;
        }
        //---- DAP events
        get onDidInitialize() {
            return this._onDidInitialize.event;
        }
        get onDidStop() {
            return this._onDidStop.event;
        }
        get onDidContinued() {
            return this._onDidContinued.event;
        }
        get onDidTerminateDebugee() {
            return this._onDidTerminateDebugee.event;
        }
        get onDidExitDebugee() {
            return this._onDidExitDebugee.event;
        }
        get onDidThread() {
            return this._onDidThread.event;
        }
        get onDidOutput() {
            return this._onDidOutput.event;
        }
        get onDidBreakpoint() {
            return this._onDidBreakpoint.event;
        }
        get onDidLoadedSource() {
            return this._onDidLoadedSource.event;
        }
        get onDidCustomEvent() {
            return this._onDidCustomEvent.event;
        }
        get onDidProgressStart() {
            return this._onDidProgressStart.event;
        }
        get onDidProgressUpdate() {
            return this._onDidProgressUpdate.event;
        }
        get onDidProgressEnd() {
            return this._onDidProgressEnd.event;
        }
        get onDidInvalidated() {
            return this._onDidInvalidated.event;
        }
        get onDidInvalidateMemory() {
            return this._onDidInvalidateMemory.event;
        }
        get onDidEvent() {
            return this._onDidEvent.event;
        }
        //---- DebugAdapter lifecycle
        /**
         * Starts the underlying debug adapter and tracks the session time for telemetry.
         */
        async start() {
            if (!this.debugAdapter) {
                return Promise.reject(new Error(nls.localize('noDebugAdapterStart', "No debug adapter, can not start debug session.")));
            }
            await this.debugAdapter.startSession();
            this.startTime = new Date().getTime();
        }
        /**
         * Send client capabilities to the debug adapter and receive DA capabilities in return.
         */
        async initialize(args) {
            const response = await this.send('initialize', args, undefined, undefined, false);
            if (response) {
                this.mergeCapabilities(response.body);
            }
            return response;
        }
        /**
         * Terminate the debuggee and shutdown the adapter
         */
        disconnect(args) {
            const terminateDebuggee = this.capabilities.supportTerminateDebuggee ? args.terminateDebuggee : undefined;
            const suspendDebuggee = this.capabilities.supportTerminateDebuggee && this.capabilities.supportSuspendDebuggee ? args.suspendDebuggee : undefined;
            return this.shutdown(undefined, args.restart, terminateDebuggee, suspendDebuggee);
        }
        //---- DAP requests
        async launchOrAttach(config) {
            const response = await this.send(config.request, config, undefined, undefined, false);
            if (response) {
                this.mergeCapabilities(response.body);
            }
            return response;
        }
        /**
         * Try killing the debuggee softly...
         */
        terminate(restart = false) {
            if (this.capabilities.supportsTerminateRequest) {
                if (!this.terminated) {
                    this.terminated = true;
                    return this.send('terminate', { restart }, undefined);
                }
                return this.disconnect({ terminateDebuggee: true, restart });
            }
            return Promise.reject(new Error('terminated not supported'));
        }
        restart(args) {
            if (this.capabilities.supportsRestartRequest) {
                return this.send('restart', args);
            }
            return Promise.reject(new Error('restart not supported'));
        }
        async next(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('next', args);
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId);
            }
            return response;
        }
        async stepIn(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('stepIn', args);
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId);
            }
            return response;
        }
        async stepOut(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('stepOut', args);
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId);
            }
            return response;
        }
        async continue(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('continue', args);
            if (response && response.body && response.body.allThreadsContinued !== undefined) {
                this.allThreadsContinued = response.body.allThreadsContinued;
            }
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId, this.allThreadsContinued);
            }
            return response;
        }
        pause(args) {
            return this.send('pause', args);
        }
        terminateThreads(args) {
            if (this.capabilities.supportsTerminateThreadsRequest) {
                return this.send('terminateThreads', args);
            }
            return Promise.reject(new Error('terminateThreads not supported'));
        }
        setVariable(args) {
            if (this.capabilities.supportsSetVariable) {
                return this.send('setVariable', args);
            }
            return Promise.reject(new Error('setVariable not supported'));
        }
        setExpression(args) {
            if (this.capabilities.supportsSetExpression) {
                return this.send('setExpression', args);
            }
            return Promise.reject(new Error('setExpression not supported'));
        }
        async restartFrame(args, threadId) {
            if (this.capabilities.supportsRestartFrame) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('restartFrame', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(threadId);
                }
                return response;
            }
            return Promise.reject(new Error('restartFrame not supported'));
        }
        stepInTargets(args) {
            if (this.capabilities.supportsStepInTargetsRequest) {
                return this.send('stepInTargets', args);
            }
            return Promise.reject(new Error('stepInTargets not supported'));
        }
        completions(args, token) {
            if (this.capabilities.supportsCompletionsRequest) {
                return this.send('completions', args, token);
            }
            return Promise.reject(new Error('completions not supported'));
        }
        setBreakpoints(args) {
            return this.send('setBreakpoints', args);
        }
        setFunctionBreakpoints(args) {
            if (this.capabilities.supportsFunctionBreakpoints) {
                return this.send('setFunctionBreakpoints', args);
            }
            return Promise.reject(new Error('setFunctionBreakpoints not supported'));
        }
        dataBreakpointInfo(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('dataBreakpointInfo', args);
            }
            return Promise.reject(new Error('dataBreakpointInfo not supported'));
        }
        setDataBreakpoints(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('setDataBreakpoints', args);
            }
            return Promise.reject(new Error('setDataBreakpoints not supported'));
        }
        setExceptionBreakpoints(args) {
            return this.send('setExceptionBreakpoints', args);
        }
        breakpointLocations(args) {
            if (this.capabilities.supportsBreakpointLocationsRequest) {
                return this.send('breakpointLocations', args);
            }
            return Promise.reject(new Error('breakpointLocations is not supported'));
        }
        configurationDone() {
            if (this.capabilities.supportsConfigurationDoneRequest) {
                return this.send('configurationDone', null);
            }
            return Promise.reject(new Error('configurationDone not supported'));
        }
        stackTrace(args, token) {
            return this.send('stackTrace', args, token);
        }
        exceptionInfo(args) {
            if (this.capabilities.supportsExceptionInfoRequest) {
                return this.send('exceptionInfo', args);
            }
            return Promise.reject(new Error('exceptionInfo not supported'));
        }
        scopes(args, token) {
            return this.send('scopes', args, token);
        }
        variables(args, token) {
            return this.send('variables', args, token);
        }
        source(args) {
            return this.send('source', args);
        }
        loadedSources(args) {
            if (this.capabilities.supportsLoadedSourcesRequest) {
                return this.send('loadedSources', args);
            }
            return Promise.reject(new Error('loadedSources not supported'));
        }
        threads() {
            return this.send('threads', null);
        }
        evaluate(args) {
            return this.send('evaluate', args);
        }
        async stepBack(args) {
            if (this.capabilities.supportsStepBack) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('stepBack', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(args.threadId);
                }
                return response;
            }
            return Promise.reject(new Error('stepBack not supported'));
        }
        async reverseContinue(args) {
            if (this.capabilities.supportsStepBack) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('reverseContinue', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(args.threadId);
                }
                return response;
            }
            return Promise.reject(new Error('reverseContinue not supported'));
        }
        gotoTargets(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                return this.send('gotoTargets', args);
            }
            return Promise.reject(new Error('gotoTargets is not supported'));
        }
        async goto(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('goto', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(args.threadId);
                }
                return response;
            }
            return Promise.reject(new Error('goto is not supported'));
        }
        async setInstructionBreakpoints(args) {
            if (this.capabilities.supportsInstructionBreakpoints) {
                return await this.send('setInstructionBreakpoints', args);
            }
            return Promise.reject(new Error('setInstructionBreakpoints is not supported'));
        }
        async disassemble(args) {
            if (this.capabilities.supportsDisassembleRequest) {
                return await this.send('disassemble', args);
            }
            return Promise.reject(new Error('disassemble is not supported'));
        }
        async readMemory(args) {
            if (this.capabilities.supportsReadMemoryRequest) {
                return await this.send('readMemory', args);
            }
            return Promise.reject(new Error('readMemory is not supported'));
        }
        async writeMemory(args) {
            if (this.capabilities.supportsWriteMemoryRequest) {
                return await this.send('writeMemory', args);
            }
            return Promise.reject(new Error('writeMemory is not supported'));
        }
        cancel(args) {
            return this.send('cancel', args);
        }
        custom(request, args) {
            return this.send(request, args);
        }
        //---- private
        async shutdown(error, restart = false, terminateDebuggee = undefined, suspendDebuggee = undefined) {
            if (!this.inShutdown) {
                this.inShutdown = true;
                if (this.debugAdapter) {
                    try {
                        const args = { restart };
                        if (typeof terminateDebuggee === 'boolean') {
                            args.terminateDebuggee = terminateDebuggee;
                        }
                        if (typeof suspendDebuggee === 'boolean') {
                            args.suspendDebuggee = suspendDebuggee;
                        }
                        // if there's an error, the DA is probably already gone, so give it a much shorter timeout.
                        await this.send('disconnect', args, undefined, error ? 200 : 2000);
                    }
                    catch (e) {
                        // Catch the potential 'disconnect' error - no need to show it to the user since the adapter is shutting down
                    }
                    finally {
                        await this.stopAdapter(error);
                    }
                }
                else {
                    return this.stopAdapter(error);
                }
            }
        }
        async stopAdapter(error) {
            try {
                if (this.debugAdapter) {
                    const da = this.debugAdapter;
                    this.debugAdapter = null;
                    await da.stopSession();
                    this.debugAdapterStopped = true;
                }
            }
            finally {
                this.fireAdapterExitEvent(error);
            }
        }
        fireAdapterExitEvent(error) {
            if (!this.firedAdapterExitEvent) {
                this.firedAdapterExitEvent = true;
                const e = {
                    emittedStopped: this.didReceiveStoppedEvent,
                    sessionLengthInSeconds: (new Date().getTime() - this.startTime) / 1000
                };
                if (error && !this.debugAdapterStopped) {
                    e.error = error;
                }
                this._onDidExitAdapter.fire(e);
            }
        }
        async dispatchRequest(request) {
            const response = {
                type: 'response',
                seq: 0,
                command: request.command,
                request_seq: request.seq,
                success: true
            };
            const safeSendResponse = (response) => this.debugAdapter && this.debugAdapter.sendResponse(response);
            if (request.command === 'launchVSCode') {
                try {
                    let result = await this.launchVsCode(request.arguments);
                    if (!result.success) {
                        const { confirmed } = await this.dialogSerivce.confirm({
                            type: notification_1.Severity.Warning,
                            message: nls.localize('canNotStart', "The debugger needs to open a new tab or window for the debuggee but the browser prevented this. You must give permission to continue."),
                            primaryButton: nls.localize({ key: 'continue', comment: ['&& denotes a mnemonic'] }, "&&Continue")
                        });
                        if (confirmed) {
                            result = await this.launchVsCode(request.arguments);
                        }
                        else {
                            response.success = false;
                            safeSendResponse(response);
                            await this.shutdown();
                        }
                    }
                    response.body = {
                        rendererDebugPort: result.rendererDebugPort,
                    };
                    safeSendResponse(response);
                }
                catch (err) {
                    response.success = false;
                    response.message = err.message;
                    safeSendResponse(response);
                }
            }
            else if (request.command === 'runInTerminal') {
                try {
                    const shellProcessId = await this.dbgr.runInTerminal(request.arguments, this.sessionId);
                    const resp = response;
                    resp.body = {};
                    if (typeof shellProcessId === 'number') {
                        resp.body.shellProcessId = shellProcessId;
                    }
                    safeSendResponse(resp);
                }
                catch (err) {
                    response.success = false;
                    response.message = err.message;
                    safeSendResponse(response);
                }
            }
            else if (request.command === 'startDebugging') {
                try {
                    const args = request.arguments;
                    const config = {
                        ...args.configuration,
                        ...{
                            request: args.request,
                            type: this.dbgr.type,
                            name: args.configuration.name || this.name
                        }
                    };
                    const success = await this.dbgr.startDebugging(config, this.sessionId);
                    if (success) {
                        safeSendResponse(response);
                    }
                    else {
                        response.success = false;
                        response.message = 'Failed to start debugging';
                        safeSendResponse(response);
                    }
                }
                catch (err) {
                    response.success = false;
                    response.message = err.message;
                    safeSendResponse(response);
                }
            }
            else {
                response.success = false;
                response.message = `unknown request '${request.command}'`;
                safeSendResponse(response);
            }
        }
        launchVsCode(vscodeArgs) {
            const args = [];
            for (const arg of vscodeArgs.args) {
                const a2 = (arg.prefix || '') + (arg.path || '');
                const match = /^--(.+)=(.+)$/.exec(a2);
                if (match && match.length === 3) {
                    const key = match[1];
                    let value = match[2];
                    if ((key === 'file-uri' || key === 'folder-uri') && !(0, debugUtils_1.isUri)(arg.path)) {
                        value = (0, debugUtils_1.isUri)(value) ? value : uri_1.URI.file(value).toString();
                    }
                    args.push(`--${key}=${value}`);
                }
                else {
                    args.push(a2);
                }
            }
            if (vscodeArgs.env) {
                args.push(`--extensionEnvironment=${JSON.stringify(vscodeArgs.env)}`);
            }
            return this.extensionHostDebugService.openExtensionDevelopmentHostWindow(args, !!vscodeArgs.debugRenderer);
        }
        send(command, args, token, timeout, showErrors = true) {
            return new Promise((completeDispatch, errorDispatch) => {
                if (!this.debugAdapter) {
                    if (this.inShutdown) {
                        // We are in shutdown silently complete
                        completeDispatch(undefined);
                    }
                    else {
                        errorDispatch(new Error(nls.localize('noDebugAdapter', "No debugger available found. Can not send '{0}'.", command)));
                    }
                    return;
                }
                let cancelationListener;
                const requestId = this.debugAdapter.sendRequest(command, args, (response) => {
                    cancelationListener?.dispose();
                    if (response.success) {
                        completeDispatch(response);
                    }
                    else {
                        errorDispatch(response);
                    }
                }, timeout);
                if (token) {
                    cancelationListener = token.onCancellationRequested(() => {
                        cancelationListener.dispose();
                        if (this.capabilities.supportsCancelRequest) {
                            this.cancel({ requestId });
                        }
                    });
                }
            }).then(undefined, err => Promise.reject(this.handleErrorResponse(err, showErrors)));
        }
        handleErrorResponse(errorResponse, showErrors) {
            if (errorResponse.command === 'canceled' && errorResponse.message === 'canceled') {
                return new errors.CancellationError();
            }
            const error = errorResponse?.body?.error;
            const errorMessage = errorResponse?.message || '';
            const userMessage = error ? (0, debugUtils_1.formatPII)(error.format, false, error.variables) : errorMessage;
            const url = error?.url;
            if (error && url) {
                const label = error.urlLabel ? error.urlLabel : nls.localize('moreInfo', "More Info");
                const uri = uri_1.URI.parse(url);
                // Use a suffixed id if uri invokes a command, so default 'Open launch.json' command is suppressed on dialog
                const actionId = uri.scheme === network_1.Schemas.command ? 'debug.moreInfo.command' : 'debug.moreInfo';
                return (0, errorMessage_1.createErrorWithActions)(userMessage, [(0, actions_1.toAction)({ id: actionId, label, run: () => this.openerService.open(uri, { allowCommands: true }) })]);
            }
            if (showErrors && error && error.format && error.showUser) {
                this.notificationService.error(userMessage);
            }
            const result = new errors.ErrorNoTelemetry(userMessage);
            result.showUser = error?.showUser;
            return result;
        }
        mergeCapabilities(capabilities) {
            if (capabilities) {
                this._capabilities = objects.mixin(this._capabilities, capabilities);
            }
        }
        fireSimulatedContinuedEvent(threadId, allThreadsContinued = false) {
            this._onDidContinued.fire({
                type: 'event',
                event: 'continued',
                body: {
                    threadId,
                    allThreadsContinued
                },
                seq: undefined
            });
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.RawDebugSession = RawDebugSession;
    exports.RawDebugSession = RawDebugSession = __decorate([
        __param(4, extensionHostDebug_1.IExtensionHostDebugService),
        __param(5, opener_1.IOpenerService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService)
    ], RawDebugSession);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3RGVidWdTZXNzaW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9yYXdEZWJ1Z1Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUNoRzs7T0FFRztJQUNJLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7UUF5QzNCLFlBQ0MsWUFBMkIsRUFDWCxJQUFlLEVBQ2QsU0FBaUIsRUFDakIsSUFBWSxFQUNELHlCQUFzRSxFQUNsRixhQUE4QyxFQUN4QyxtQkFBMEQsRUFDaEUsYUFBOEM7WUFOOUMsU0FBSSxHQUFKLElBQUksQ0FBVztZQUNkLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNnQiw4QkFBeUIsR0FBekIseUJBQXlCLENBQTRCO1lBQ2pFLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN2Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQy9DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQS9DdkQsd0JBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQzNCLHlCQUFvQixHQUFHLEtBQUssQ0FBQztZQUdyQyxXQUFXO1lBQ0gsd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQzVCLGVBQVUsR0FBRyxLQUFLLENBQUM7WUFDbkIsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNuQiwwQkFBcUIsR0FBRyxLQUFLLENBQUM7WUFFdEMsWUFBWTtZQUNKLGNBQVMsR0FBRyxDQUFDLENBQUM7WUFDZCwyQkFBc0IsR0FBRyxLQUFLLENBQUM7WUFFdkMsYUFBYTtZQUNJLHFCQUFnQixHQUFHLElBQUksZUFBTyxFQUFrQyxDQUFDO1lBQ2pFLGVBQVUsR0FBRyxJQUFJLGVBQU8sRUFBOEIsQ0FBQztZQUN2RCxvQkFBZSxHQUFHLElBQUksZUFBTyxFQUFnQyxDQUFDO1lBQzlELDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFpQyxDQUFDO1lBQ3RFLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUE2QixDQUFDO1lBQzdELGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQTZCLENBQUM7WUFDeEQsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBNkIsQ0FBQztZQUN4RCxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBaUMsQ0FBQztZQUNoRSx1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBbUMsQ0FBQztZQUNwRSx3QkFBbUIsR0FBRyxJQUFJLGVBQU8sRUFBb0MsQ0FBQztZQUN0RSx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBcUMsQ0FBQztZQUN4RSxzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBa0MsQ0FBQztZQUNsRSxzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBa0MsQ0FBQztZQUNsRSwyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBNkIsQ0FBQztZQUNsRSxzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBdUIsQ0FBQztZQUN2RCxnQkFBVyxHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1lBRWxFLFlBQVk7WUFDSyxzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBbUIsQ0FBQztZQUU1RCx5QkFBb0IsR0FBRyxLQUFLLENBQUM7WUFFN0IsY0FBUyxHQUFrQixFQUFFLENBQUM7WUFZckMsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7WUFDakMsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXpDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkQsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxjQUFjO29CQUNkLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakMsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3JCLEtBQUssYUFBYTt3QkFDakIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQzt3QkFDakMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbEMsTUFBTTtvQkFDUCxLQUFLLGNBQWM7d0JBQ2xCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQWtDLEtBQUssQ0FBQyxDQUFDO3dCQUNyRSxNQUFNO29CQUNQLEtBQUssY0FBYzt3QkFDbEIsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQ2hCLE1BQU0sWUFBWSxHQUFxQyxLQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQzs0QkFDaEYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN0QyxDQUFDO3dCQUNELE1BQU07b0JBQ1AsS0FBSyxTQUFTO3dCQUNiLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsQ0FBRSx5REFBeUQ7d0JBQzlGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7d0JBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUE2QixLQUFLLENBQUMsQ0FBQzt3QkFDeEQsTUFBTTtvQkFDUCxLQUFLLFdBQVc7d0JBQ2YsSUFBSSxDQUFDLG1CQUFtQixHQUFrQyxLQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQ25ILElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUErQixLQUFLLENBQUMsQ0FBQzt3QkFDL0QsTUFBTTtvQkFDUCxLQUFLLFFBQVE7d0JBQ1osSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQTRCLEtBQUssQ0FBQyxDQUFDO3dCQUN6RCxNQUFNO29CQUNQLEtBQUssUUFBUTt3QkFDWixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBNEIsS0FBSyxDQUFDLENBQUM7d0JBQ3pELE1BQU07b0JBQ1AsS0FBSyxZQUFZO3dCQUNoQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFnQyxLQUFLLENBQUMsQ0FBQzt3QkFDakUsTUFBTTtvQkFDUCxLQUFLLFlBQVk7d0JBQ2hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQWdDLEtBQUssQ0FBQyxDQUFDO3dCQUN2RSxNQUFNO29CQUNQLEtBQUssUUFBUTt3QkFDWixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUE0QixLQUFLLENBQUMsQ0FBQzt3QkFDOUQsTUFBTTtvQkFDUCxLQUFLLGVBQWU7d0JBQ25CLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBeUMsQ0FBQyxDQUFDO3dCQUN6RSxNQUFNO29CQUNQLEtBQUssZ0JBQWdCO3dCQUNwQixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQTBDLENBQUMsQ0FBQzt3QkFDM0UsTUFBTTtvQkFDUCxLQUFLLGFBQWE7d0JBQ2pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBdUMsQ0FBQyxDQUFDO3dCQUNyRSxNQUFNO29CQUNQLEtBQUssYUFBYTt3QkFDakIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUF1QyxDQUFDLENBQUM7d0JBQ3JFLE1BQU07b0JBQ1AsS0FBSyxRQUFRO3dCQUNaLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsS0FBa0MsQ0FBQyxDQUFDO3dCQUNyRSxNQUFNO29CQUNQLEtBQUssU0FBUzt3QkFDYixNQUFNO29CQUNQLEtBQUssUUFBUTt3QkFDWixNQUFNO29CQUNQO3dCQUNDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ25DLE1BQU07Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxZQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRDs7O1dBR0c7UUFDSCxJQUFJLG1CQUFtQjtZQUN0QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO1FBRUQsaUJBQWlCO1FBRWpCLElBQUksZUFBZTtZQUNsQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFDOUIsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLHFCQUFxQjtZQUN4QixPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7UUFDMUMsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxpQkFBaUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFJLGdCQUFnQjtZQUNuQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxtQkFBbUI7WUFDdEIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxJQUFJLGdCQUFnQjtZQUNuQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxxQkFBcUI7WUFDeEIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1FBQzFDLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1FBQy9CLENBQUM7UUFFRCw2QkFBNkI7UUFFN0I7O1dBRUc7UUFDSCxLQUFLLENBQUMsS0FBSztZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLGdEQUFnRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pILENBQUM7WUFFRCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZDLENBQUM7UUFFRDs7V0FFRztRQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBOEM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRixJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUVELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRDs7V0FFRztRQUNILFVBQVUsQ0FBQyxJQUF1QztZQUNqRCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQzFHLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ2xKLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRUQsbUJBQW1CO1FBRW5CLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBZTtZQUNuQyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RixJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUVELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRDs7V0FFRztRQUNILFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSztZQUN4QixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsT0FBTyxDQUFDLElBQW9DO1lBQzNDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUM5QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQWlDO1lBQzNDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQW1DO1lBQy9DLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQW9DO1lBQ2pELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLElBQXFDO1lBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFpQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkYsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNsRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBRUQsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFrQztZQUN2QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxJQUE2QztZQUM3RCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFRCxXQUFXLENBQUMsSUFBd0M7WUFDbkQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzNDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBb0MsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxhQUFhLENBQUMsSUFBMEM7WUFDdkQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzdDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBc0MsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLElBQXlDLEVBQUUsUUFBZ0I7WUFDN0UsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7Z0JBQ2xDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO2dCQUNELE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBMEM7WUFDdkQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3BELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELFdBQVcsQ0FBQyxJQUF3QyxFQUFFLEtBQXdCO1lBQzdFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQW9DLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELGNBQWMsQ0FBQyxJQUEyQztZQUN6RCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQXVDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxJQUFtRDtZQUN6RSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUErQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRyxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBRUQsa0JBQWtCLENBQUMsSUFBK0M7WUFDakUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBMkMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEYsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELGtCQUFrQixDQUFDLElBQStDO1lBQ2pFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUMvQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQTJDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hGLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxJQUFvRDtZQUMzRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQWdELHlCQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xHLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxJQUFnRDtZQUNuRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsa0NBQWtDLEVBQUUsQ0FBQztnQkFDMUQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsVUFBVSxDQUFDLElBQXVDLEVBQUUsS0FBd0I7WUFDM0UsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFtQyxZQUFZLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBMEM7WUFDdkQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3BELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBc0MsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBbUMsRUFBRSxLQUF3QjtZQUNuRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQStCLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELFNBQVMsQ0FBQyxJQUFzQyxFQUFFLEtBQXlCO1lBQzFFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBa0MsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQW1DO1lBQ3pDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBK0IsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBMEM7WUFDdkQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3BELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBc0MsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxPQUFPO1lBQ04sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFnQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFxQztZQUM3QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQWlDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFxQztZQUNuRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztnQkFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO2dCQUNELE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLElBQTRDO1lBQ2pFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO2dCQUNsQyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakQsQ0FBQztnQkFDRCxPQUFPLFFBQVEsQ0FBQztZQUNqQixDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsV0FBVyxDQUFDLElBQXdDO1lBQ25ELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQWlDO1lBQzNDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO2dCQUNsQyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBQ2hDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pELENBQUM7Z0JBQ0QsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxJQUFzRDtZQUNyRixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsOEJBQThCLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBd0M7WUFDekQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2xELE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUF1QztZQUN2RCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDakQsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLElBQXdDO1lBQ3pELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFtQztZQUN6QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBZSxFQUFFLElBQVM7WUFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsY0FBYztRQUVOLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBYSxFQUFFLE9BQU8sR0FBRyxLQUFLLEVBQUUsb0JBQXlDLFNBQVMsRUFBRSxrQkFBdUMsU0FBUztZQUMxSixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDdkIsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3ZCLElBQUksQ0FBQzt3QkFDSixNQUFNLElBQUksR0FBc0MsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDNUQsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFNBQVMsRUFBRSxDQUFDOzRCQUM1QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7d0JBQzVDLENBQUM7d0JBRUQsSUFBSSxPQUFPLGVBQWUsS0FBSyxTQUFTLEVBQUUsQ0FBQzs0QkFDMUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7d0JBQ3hDLENBQUM7d0JBRUQsMkZBQTJGO3dCQUMzRixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNwRSxDQUFDO29CQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ1osNkdBQTZHO29CQUM5RyxDQUFDOzRCQUFTLENBQUM7d0JBQ1YsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMvQixDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBYTtZQUN0QyxJQUFJLENBQUM7Z0JBQ0osSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3ZCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7b0JBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUN6QixNQUFNLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxLQUFhO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztnQkFFbEMsTUFBTSxDQUFDLEdBQW9CO29CQUMxQixjQUFjLEVBQUUsSUFBSSxDQUFDLHNCQUFzQjtvQkFDM0Msc0JBQXNCLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJO2lCQUN0RSxDQUFDO2dCQUNGLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQ3hDLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNqQixDQUFDO2dCQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQThCO1lBRTNELE1BQU0sUUFBUSxHQUEyQjtnQkFDeEMsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLEdBQUcsRUFBRSxDQUFDO2dCQUNOLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztnQkFDeEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHO2dCQUN4QixPQUFPLEVBQUUsSUFBSTthQUNiLENBQUM7WUFFRixNQUFNLGdCQUFnQixHQUFHLENBQUMsUUFBZ0MsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU3SCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQztvQkFDSixJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQXlCLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDaEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDckIsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7NEJBQ3RELElBQUksRUFBRSx1QkFBUSxDQUFDLE9BQU87NEJBQ3RCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSx1SUFBdUksQ0FBQzs0QkFDN0ssYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUM7eUJBQ2xHLENBQUMsQ0FBQzt3QkFDSCxJQUFJLFNBQVMsRUFBRSxDQUFDOzRCQUNmLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQXlCLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDN0UsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDOzRCQUN6QixnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQzs0QkFDM0IsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ3ZCLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxRQUFRLENBQUMsSUFBSSxHQUFHO3dCQUNmLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7cUJBQzNDLENBQUM7b0JBQ0YsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxRQUFRLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztvQkFDekIsUUFBUSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO29CQUMvQixnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLGVBQWUsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUM7b0JBQ0osTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBd0QsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3ZJLE1BQU0sSUFBSSxHQUFHLFFBQStDLENBQUM7b0JBQzdELElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNmLElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztvQkFDM0MsQ0FBQztvQkFDRCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNkLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUN6QixRQUFRLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7b0JBQy9CLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDO29CQUNKLE1BQU0sSUFBSSxHQUFJLE9BQU8sQ0FBQyxTQUEwRCxDQUFDO29CQUNqRixNQUFNLE1BQU0sR0FBWTt3QkFDdkIsR0FBRyxJQUFJLENBQUMsYUFBYTt3QkFDckIsR0FBRzs0QkFDRixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87NEJBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7NEJBQ3BCLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSTt5QkFDMUM7cUJBQ0QsQ0FBQztvQkFDRixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3ZFLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQ2IsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzVCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxRQUFRLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzt3QkFDekIsUUFBUSxDQUFDLE9BQU8sR0FBRywyQkFBMkIsQ0FBQzt3QkFDL0MsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzVCLENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNkLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUN6QixRQUFRLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7b0JBQy9CLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixRQUFRLENBQUMsT0FBTyxHQUFHLG9CQUFvQixPQUFPLENBQUMsT0FBTyxHQUFHLENBQUM7Z0JBQzFELGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLFVBQWtDO1lBRXRELE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUUxQixLQUFLLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDakQsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDakMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXJCLElBQUksQ0FBQyxHQUFHLEtBQUssVUFBVSxJQUFJLEdBQUcsS0FBSyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUEsa0JBQUssRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEUsS0FBSyxHQUFHLElBQUEsa0JBQUssRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUMzRCxDQUFDO29CQUNELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxrQ0FBa0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM1RyxDQUFDO1FBRU8sSUFBSSxDQUFtQyxPQUFlLEVBQUUsSUFBUyxFQUFFLEtBQXlCLEVBQUUsT0FBZ0IsRUFBRSxVQUFVLEdBQUcsSUFBSTtZQUN4SSxPQUFPLElBQUksT0FBTyxDQUFxQyxDQUFDLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxFQUFFO2dCQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUN4QixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDckIsdUNBQXVDO3dCQUN2QyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDN0IsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLGtEQUFrRCxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkgsQ0FBQztvQkFDRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxtQkFBZ0MsQ0FBQztnQkFDckMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQWdDLEVBQUUsRUFBRTtvQkFDbkcsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBRS9CLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN0QixnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDNUIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDekIsQ0FBQztnQkFDRixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRVosSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxtQkFBbUIsR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFO3dCQUN4RCxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDOUIsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixFQUFFLENBQUM7NEJBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO3dCQUM1QixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRU8sbUJBQW1CLENBQUMsYUFBcUMsRUFBRSxVQUFtQjtZQUVyRixJQUFJLGFBQWEsQ0FBQyxPQUFPLEtBQUssVUFBVSxJQUFJLGFBQWEsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ2xGLE9BQU8sSUFBSSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN2QyxDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQXNDLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO1lBQzVFLE1BQU0sWUFBWSxHQUFHLGFBQWEsRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDO1lBRWxELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBQSxzQkFBUyxFQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQzNGLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLENBQUM7WUFDdkIsSUFBSSxLQUFLLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN0RixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQiw0R0FBNEc7Z0JBQzVHLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDOUYsT0FBTyxJQUFBLHFDQUFzQixFQUFDLFdBQVcsRUFBRSxDQUFDLElBQUEsa0JBQVEsRUFBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25KLENBQUM7WUFDRCxJQUFJLFVBQVUsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2xELE1BQU8sQ0FBQyxRQUFRLEdBQUcsS0FBSyxFQUFFLFFBQVEsQ0FBQztZQUV6QyxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxZQUFvRDtZQUM3RSxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RSxDQUFDO1FBQ0YsQ0FBQztRQUVPLDJCQUEyQixDQUFDLFFBQWdCLEVBQUUsbUJBQW1CLEdBQUcsS0FBSztZQUNoRixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQztnQkFDekIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLElBQUksRUFBRTtvQkFDTCxRQUFRO29CQUNSLG1CQUFtQjtpQkFDbkI7Z0JBQ0QsR0FBRyxFQUFFLFNBQVU7YUFDZixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekIsQ0FBQztLQUNELENBQUE7SUF6eEJZLDBDQUFlOzhCQUFmLGVBQWU7UUE4Q3pCLFdBQUEsK0NBQTBCLENBQUE7UUFDMUIsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHdCQUFjLENBQUE7T0FqREosZUFBZSxDQXl4QjNCIn0=