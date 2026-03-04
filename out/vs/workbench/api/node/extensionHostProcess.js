/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "minimist", "vs/base/common/performance", "vs/base/common/errors", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/product/common/product", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/api/common/extensionHostMain", "vs/base/common/buffer", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/common/async", "vs/editor/common/config/editorOptions", "vs/workbench/api/node/uriTransformer", "vs/workbench/services/extensions/common/extensionHostEnv", "vs/workbench/api/common/extHost.common.services", "vs/workbench/api/node/extHost.node.services"], function (require, exports, net, minimist, performance, errors_1, ipc_net_1, ipc_net_2, product_1, extensionHostProtocol_1, extensionHostMain_1, buffer_1, pfs_1, extpath_1, async_1, editorOptions_1, uriTransformer_1, extensionHostEnv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // workaround for https://github.com/microsoft/vscode/issues/85490
    // remove --inspect-port=0 after start so that it doesn't trigger LSP debugging
    (function removeInspectPort() {
        for (let i = 0; i < process.execArgv.length; i++) {
            if (process.execArgv[i] === '--inspect-port=0') {
                process.execArgv.splice(i, 1);
                i--;
            }
        }
    })();
    const args = minimist(process.argv.slice(2), {
        boolean: [
            'transformURIs',
            'skipWorkspaceStorageLock'
        ],
        string: [
            'useHostProxy' // 'true' | 'false' | undefined
        ]
    });
    // With Electron 2.x and node.js 8.x the "natives" module
    // can cause a native crash (see https://github.com/nodejs/node/issues/19891 and
    // https://github.com/electron/electron/issues/10905). To prevent this from
    // happening we essentially blocklist this module from getting loaded in any
    // extension by patching the node require() function.
    (function () {
        const Module = globalThis._VSCODE_NODE_MODULES.module;
        const originalLoad = Module._load;
        Module._load = function (request) {
            if (request === 'natives') {
                throw new Error('Either the extension or an NPM dependency is using the [unsupported "natives" node module](https://go.microsoft.com/fwlink/?linkid=871887).');
            }
            return originalLoad.apply(this, arguments);
        };
    })();
    // custom process.exit logic...
    const nativeExit = process.exit.bind(process);
    const nativeOn = process.on.bind(process);
    function patchProcess(allowExit) {
        process.exit = function (code) {
            if (allowExit) {
                nativeExit(code);
            }
            else {
                const err = new Error('An extension called process.exit() and this was prevented.');
                console.warn(err.stack);
            }
        };
        // override Electron's process.crash() method
        process.crash = function () {
            const err = new Error('An extension called process.crash() and this was prevented.');
            console.warn(err.stack);
        };
        // Set ELECTRON_RUN_AS_NODE environment variable for extensions that use
        // child_process.spawn with process.execPath and expect to run as node process
        // on the desktop.
        // Refs https://github.com/microsoft/vscode/issues/151012#issuecomment-1156593228
        process.env['ELECTRON_RUN_AS_NODE'] = '1';
        process.on = function (event, listener) {
            if (event === 'uncaughtException') {
                listener = function () {
                    try {
                        return listener.call(undefined, arguments);
                    }
                    catch {
                        // DO NOT HANDLE NOR PRINT the error here because this can and will lead to
                        // more errors which will cause error handling to be reentrant and eventually
                        // overflowing the stack. Do not be sad, we do handle and annotate uncaught
                        // errors properly in 'extensionHostMain'
                    }
                };
            }
            nativeOn(event, listener);
        };
    }
    // This calls exit directly in case the initialization is not finished and we need to exit
    // Otherwise, if initialization completed we go to extensionHostMain.terminate()
    let onTerminate = function (reason) {
        nativeExit();
    };
    function _createExtHostProtocol() {
        const extHostConnection = (0, extensionHostEnv_1.readExtHostConnection)(process.env);
        if (extHostConnection.type === 3 /* ExtHostConnectionType.MessagePort */) {
            return new Promise((resolve, reject) => {
                const withPorts = (ports) => {
                    const port = ports[0];
                    const onMessage = new ipc_net_1.BufferedEmitter();
                    port.on('message', (e) => onMessage.fire(buffer_1.VSBuffer.wrap(e.data)));
                    port.on('close', () => {
                        onTerminate('renderer closed the MessagePort');
                    });
                    port.start();
                    resolve({
                        onMessage: onMessage.event,
                        send: message => port.postMessage(message.buffer)
                    });
                };
                process.parentPort.on('message', (e) => withPorts(e.ports));
            });
        }
        else if (extHostConnection.type === 2 /* ExtHostConnectionType.Socket */) {
            return new Promise((resolve, reject) => {
                let protocol = null;
                const timer = setTimeout(() => {
                    onTerminate('VSCODE_EXTHOST_IPC_SOCKET timeout');
                }, 60000);
                const reconnectionGraceTime = 10800000 /* ProtocolConstants.ReconnectionGraceTime */;
                const reconnectionShortGraceTime = 300000 /* ProtocolConstants.ReconnectionShortGraceTime */;
                const disconnectRunner1 = new async_1.ProcessTimeRunOnceScheduler(() => onTerminate('renderer disconnected for too long (1)'), reconnectionGraceTime);
                const disconnectRunner2 = new async_1.ProcessTimeRunOnceScheduler(() => onTerminate('renderer disconnected for too long (2)'), reconnectionShortGraceTime);
                process.on('message', (msg, handle) => {
                    if (msg && msg.type === 'VSCODE_EXTHOST_IPC_SOCKET') {
                        // Disable Nagle's algorithm. We also do this on the server process,
                        // but nodejs doesn't document if this option is transferred with the socket
                        handle.setNoDelay(true);
                        const initialDataChunk = buffer_1.VSBuffer.wrap(Buffer.from(msg.initialDataChunk, 'base64'));
                        let socket;
                        if (msg.skipWebSocketFrames) {
                            socket = new ipc_net_2.NodeSocket(handle, 'extHost-socket');
                        }
                        else {
                            const inflateBytes = buffer_1.VSBuffer.wrap(Buffer.from(msg.inflateBytes, 'base64'));
                            socket = new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(handle, 'extHost-socket'), msg.permessageDeflate, inflateBytes, false);
                        }
                        if (protocol) {
                            // reconnection case
                            disconnectRunner1.cancel();
                            disconnectRunner2.cancel();
                            protocol.beginAcceptReconnection(socket, initialDataChunk);
                            protocol.endAcceptReconnection();
                            protocol.sendResume();
                        }
                        else {
                            clearTimeout(timer);
                            protocol = new ipc_net_1.PersistentProtocol({ socket, initialChunk: initialDataChunk });
                            protocol.sendResume();
                            protocol.onDidDispose(() => onTerminate('renderer disconnected'));
                            resolve(protocol);
                            // Wait for rich client to reconnect
                            protocol.onSocketClose(() => {
                                // The socket has closed, let's give the renderer a certain amount of time to reconnect
                                disconnectRunner1.schedule();
                            });
                        }
                    }
                    if (msg && msg.type === 'VSCODE_EXTHOST_IPC_REDUCE_GRACE_TIME') {
                        if (disconnectRunner2.isScheduled()) {
                            // we are disconnected and already running the short reconnection timer
                            return;
                        }
                        if (disconnectRunner1.isScheduled()) {
                            // we are disconnected and running the long reconnection timer
                            disconnectRunner2.schedule();
                        }
                    }
                });
                // Now that we have managed to install a message listener, ask the other side to send us the socket
                const req = { type: 'VSCODE_EXTHOST_IPC_READY' };
                process.send?.(req);
            });
        }
        else {
            const pipeName = extHostConnection.pipeName;
            return new Promise((resolve, reject) => {
                const socket = net.createConnection(pipeName, () => {
                    socket.removeListener('error', reject);
                    const protocol = new ipc_net_1.PersistentProtocol({ socket: new ipc_net_2.NodeSocket(socket, 'extHost-renderer') });
                    protocol.sendResume();
                    resolve(protocol);
                });
                socket.once('error', reject);
                socket.on('close', () => {
                    onTerminate('renderer closed the socket');
                });
            });
        }
    }
    async function createExtHostProtocol() {
        const protocol = await _createExtHostProtocol();
        return new class {
            constructor() {
                this._onMessage = new ipc_net_1.BufferedEmitter();
                this.onMessage = this._onMessage.event;
                this._terminating = false;
                protocol.onMessage((msg) => {
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 2 /* MessageType.Terminate */)) {
                        this._terminating = true;
                        onTerminate('received terminate message from renderer');
                    }
                    else {
                        this._onMessage.fire(msg);
                    }
                });
            }
            send(msg) {
                if (!this._terminating) {
                    protocol.send(msg);
                }
            }
            async drain() {
                if (protocol.drain) {
                    return protocol.drain();
                }
            }
        };
    }
    function connectToRenderer(protocol) {
        return new Promise((c) => {
            // Listen init data message
            const first = protocol.onMessage(raw => {
                first.dispose();
                const initData = JSON.parse(raw.toString());
                const rendererCommit = initData.commit;
                const myCommit = product_1.default.commit;
                if (rendererCommit && myCommit) {
                    // Running in the built version where commits are defined
                    if (rendererCommit !== myCommit) {
                        nativeExit(55 /* ExtensionHostExitCode.VersionMismatch */);
                    }
                }
                if (initData.parentPid) {
                    // Kill oneself if one's parent dies. Much drama.
                    let epermErrors = 0;
                    setInterval(function () {
                        try {
                            process.kill(initData.parentPid, 0); // throws an exception if the main process doesn't exist anymore.
                            epermErrors = 0;
                        }
                        catch (e) {
                            if (e && e.code === 'EPERM') {
                                // Even if the parent process is still alive,
                                // some antivirus software can lead to an EPERM error to be thrown here.
                                // Let's terminate only if we get 3 consecutive EPERM errors.
                                epermErrors++;
                                if (epermErrors >= 3) {
                                    onTerminate(`parent process ${initData.parentPid} does not exist anymore (3 x EPERM): ${e.message} (code: ${e.code}) (errno: ${e.errno})`);
                                }
                            }
                            else {
                                onTerminate(`parent process ${initData.parentPid} does not exist anymore: ${e.message} (code: ${e.code}) (errno: ${e.errno})`);
                            }
                        }
                    }, 1000);
                    // In certain cases, the event loop can become busy and never yield
                    // e.g. while-true or process.nextTick endless loops
                    // So also use the native node module to do it from a separate thread
                    let watchdog;
                    try {
                        watchdog = globalThis._VSCODE_NODE_MODULES['native-watchdog'];
                        watchdog.start(initData.parentPid);
                    }
                    catch (err) {
                        // no problem...
                        (0, errors_1.onUnexpectedError)(err);
                    }
                }
                // Tell the outside that we are initialized
                protocol.send((0, extensionHostProtocol_1.createMessageOfType)(0 /* MessageType.Initialized */));
                c({ protocol, initData });
            });
            // Tell the outside that we are ready to receive messages
            protocol.send((0, extensionHostProtocol_1.createMessageOfType)(1 /* MessageType.Ready */));
        });
    }
    async function startExtensionHostProcess() {
        // Print a console message when rejection isn't handled within N seconds. For details:
        // see https://nodejs.org/api/process.html#process_event_unhandledrejection
        // and https://nodejs.org/api/process.html#process_event_rejectionhandled
        const unhandledPromises = [];
        process.on('unhandledRejection', (reason, promise) => {
            unhandledPromises.push(promise);
            setTimeout(() => {
                const idx = unhandledPromises.indexOf(promise);
                if (idx >= 0) {
                    promise.catch(e => {
                        unhandledPromises.splice(idx, 1);
                        if (!(0, errors_1.isCancellationError)(e)) {
                            console.warn(`rejected promise not handled within 1 second: ${e}`);
                            if (e && e.stack) {
                                console.warn(`stack trace: ${e.stack}`);
                            }
                            if (reason) {
                                (0, errors_1.onUnexpectedError)(reason);
                            }
                        }
                    });
                }
            }, 1000);
        });
        process.on('rejectionHandled', (promise) => {
            const idx = unhandledPromises.indexOf(promise);
            if (idx >= 0) {
                unhandledPromises.splice(idx, 1);
            }
        });
        // Print a console message when an exception isn't handled.
        process.on('uncaughtException', function (err) {
            if (!(0, errors_1.isSigPipeError)(err)) {
                (0, errors_1.onUnexpectedError)(err);
            }
        });
        performance.mark(`code/extHost/willConnectToRenderer`);
        const protocol = await createExtHostProtocol();
        performance.mark(`code/extHost/didConnectToRenderer`);
        const renderer = await connectToRenderer(protocol);
        performance.mark(`code/extHost/didWaitForInitData`);
        const { initData } = renderer;
        // setup things
        patchProcess(!!initData.environment.extensionTestsLocationURI); // to support other test frameworks like Jasmin that use process.exit (https://github.com/microsoft/vscode/issues/37708)
        initData.environment.useHostProxy = args.useHostProxy !== undefined ? args.useHostProxy !== 'false' : undefined;
        initData.environment.skipWorkspaceStorageLock = (0, editorOptions_1.boolean)(args.skipWorkspaceStorageLock, false);
        // host abstraction
        const hostUtils = new class NodeHost {
            constructor() {
                this.pid = process.pid;
            }
            exit(code) { nativeExit(code); }
            fsExists(path) { return pfs_1.Promises.exists(path); }
            fsRealpath(path) { return (0, extpath_1.realpath)(path); }
        };
        // Attempt to load uri transformer
        let uriTransformer = null;
        if (initData.remote.authority && args.transformURIs) {
            uriTransformer = (0, uriTransformer_1.createURITransformer)(initData.remote.authority);
        }
        const extensionHostMain = new extensionHostMain_1.ExtensionHostMain(renderer.protocol, initData, hostUtils, uriTransformer);
        // rewrite onTerminate-function to be a proper shutdown
        onTerminate = (reason) => extensionHostMain.terminate(reason);
    }
    startExtensionHostProcess().catch((err) => console.log(err));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL25vZGUvZXh0ZW5zaW9uSG9zdFByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQ2hHLGtFQUFrRTtJQUNsRSwrRUFBK0U7SUFDL0UsQ0FBQyxTQUFTLGlCQUFpQjtRQUMxQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNsRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztnQkFDaEQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixDQUFDLEVBQUUsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUVMLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUM1QyxPQUFPLEVBQUU7WUFDUixlQUFlO1lBQ2YsMEJBQTBCO1NBQzFCO1FBQ0QsTUFBTSxFQUFFO1lBQ1AsY0FBYyxDQUFDLCtCQUErQjtTQUM5QztLQUNELENBQXNCLENBQUM7SUFFeEIseURBQXlEO0lBQ3pELGdGQUFnRjtJQUNoRiwyRUFBMkU7SUFDM0UsNEVBQTRFO0lBQzVFLHFEQUFxRDtJQUNyRCxDQUFDO1FBQ0EsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLG9CQUFvQixDQUFDLE1BQWEsQ0FBQztRQUM3RCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsS0FB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