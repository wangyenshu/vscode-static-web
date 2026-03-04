/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "net", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings", "vs/base/node/pfs", "vs/nls", "../common/abstractDebugAdapter"], function (require, exports, cp, net, objects, path, platform, strings, pfs_1, nls, abstractDebugAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExecutableDebugAdapter = exports.NamedPipeDebugAdapter = exports.SocketDebugAdapter = exports.NetworkDebugAdapter = exports.StreamDebugAdapter = void 0;
    /**
     * An implementation that communicates via two streams with the debug adapter.
     */
    class StreamDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        static { this.TWO_CRLF = '\r\n\r\n'; }
        static { this.HEADER_LINESEPARATOR = /\r?\n/; } // allow for non-RFC 2822 conforming line separators
        static { this.HEADER_FIELDSEPARATOR = /: */; }
        constructor() {
            super();
            this.rawData = Buffer.allocUnsafe(0);
            this.contentLength = -1;
        }
        connect(readable, writable) {
            this.outputStream = writable;
            this.rawData = Buffer.allocUnsafe(0);
            this.contentLength = -1;
            readable.on('data', (data) => this.handleData(data));
        }
        sendMessage(message) {
            if (this.outputStream) {
                const json = JSON.stringify(message);
                this.outputStream.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}${StreamDebugAdapter.TWO_CRLF}${json}`, 'utf8');
            }
        }
        handleData(data) {
            this.rawData = Buffer.concat([this.rawData, data]);
            while (true) {
                if (this.contentLength >= 0) {
                    if (this.rawData.length >= this.contentLength) {
                        const message = this.rawData.toString('utf8', 0, this.contentLength);
                        this.rawData = this.rawData.slice(this.contentLength);
                        this.contentLength = -1;
                        if (message.length > 0) {
                            try {
                                this.acceptMessage(JSON.parse(message));
                            }
                            catch (e) {
                                this._onError.fire(new Error((e.message || e) + '\n' + message));
                            }
                        }
                        continue; // there may be more complete messages to process
                    }
                }
                else {
                    const idx = this.rawData.indexOf(StreamDebugAdapter.TWO_CRLF);
                    if (idx !== -1) {
                        const header = this.rawData.toString('utf8', 0, idx);
                        const lines = header.split(StreamDebugAdapter.HEADER_LINESEPARATOR);
                        for (const h of lines) {
                            const kvPair = h.split(StreamDebugAdapter.HEADER_FIELDSEPARATOR);
                            if (kvPair[0] === 'Content-Length') {
                                this.contentLength = Number(kvPair[1]);
                            }
                        }
                        this.rawData = this.rawData.slice(idx + StreamDebugAdapter.TWO_CRLF.length);
                        continue;
                    }
                }
                break;
            }
        }
    }
    exports.StreamDebugAdapter = StreamDebugAdapter;
    class NetworkDebugAdapter extends StreamDebugAdapter {
        startSession() {
            return new Promise((resolve, reject) => {
                let connected = false;
                this.socket = this.createConnection(() => {
                    this.connect(this.socket, this.socket);
                    resolve();
                    connected = true;
                });
                this.socket.on('close', () => {
                    if (connected) {
                        this._onError.fire(new Error('connection closed'));
                    }
                    else {
                        reject(new Error('connection closed'));
                    }
                });
                this.socket.on('error', error => {
                    if (connected) {
                        this._onError.fire(error);
                    }
                    else {
                        reject(error);
                    }
                });
            });
        }
        async stopSession() {
            await this.cancelPendingRequests();
            if (this.socket) {
                this.socket.end();
                this.socket = undefined;
            }
        }
    }
    exports.NetworkDebugAdapter = NetworkDebugAdapter;
    /**
     * An implementation that connects to a debug adapter via a socket.
    */
    class SocketDebugAdapter extends NetworkDebugAdapter {
        constructor(adapterServer) {
            super();
            this.adapterServer = adapterServer;
        }
        createConnection(connectionListener) {
            return net.createConnection(this.adapterServer.port, this.adapterServer.host || '127.0.0.1', connectionListener);
        }
    }
    exports.SocketDebugAdapter = SocketDebugAdapter;
    /**
     * An implementation that connects to a debug adapter via a NamedPipe (on Windows)/UNIX Domain Socket (on non-Windows).
     */
    class NamedPipeDebugAdapter extends NetworkDebugAdapter {
        constructor(adapterServer) {
            super();
            this.adapterServer = adapterServer;
        }
        createConnection(connectionListener) {
            return net.createConnection(this.adapterServer.path, connectionListener);
        }
    }
    exports.NamedPipeDebugAdapter = NamedPipeDebugAdapter;
    /**
     * An implementation that launches the debug adapter as a separate process and communicates via stdin/stdout.
    */
    class ExecutableDebugAdapter extends StreamDebugAdapter {
        constructor(adapterExecutable, debugType) {
            super();
            this.adapterExecutable = adapterExecutable;
            this.debugType = debugType;
        }
        async startSession() {
            const command = this.adapterExecutable.command;
            const args = this.adapterExecutable.args;
            const options = this.adapterExecutable.options || {};
            try {
                // verify executables asynchronously
                if (command) {
                    if (path.isAbsolute(command)) {
                        const commandExists = await pfs_1.Promises.exists(command);
                        if (!commandExists) {
                            throw new Error(nls.localize('debugAdapterBinNotFound', "Debug adapter executable '{0}' does not exist.", command));
                        }
                    }
                    else {
                        // relative path
                        if (command.indexOf('/') < 0 && command.indexOf('\\') < 0) {
                            // no separators: command looks like a runtime name like 'node' or 'mono'
                            // TODO: check that the runtime is available on PATH
                        }
                    }
                }
                else {
                    throw new Error(nls.localize({ key: 'debugAdapterCannotDetermineExecutable', comment: ['Adapter executable file not found'] }, "Cannot determine executable for debug adapter '{0}'.", this.debugType));
                }
                let env = process.env;
                if (options.env && Object.keys(options.env).length > 0) {
                    env = objects.mixin(objects.deepClone(process.env), options.env);
                }
                if (command === 'node') {
                    if (Array.isArray(args) && args.length > 0) {
                        const isElectron = !!process.env['ELECTRON_RUN_AS_NODE'] || !!process.versions['electron'];
                        const forkOptions = {
                            env: env,
                            execArgv: isElectron ? ['-e', 'delete process.env.ELECTRON_RUN_AS_NODE;require(process.argv[1])'] : [],
                            silent: true
                        };
                        if (options.cwd) {
                            forkOptions.cwd = options.cwd;
                        }
                        const child = cp.fork(args[0], args.slice(1), forkOptions);
                        if (!child.pid) {
                            throw new Error(nls.localize('unableToLaunchDebugAdapter', "Unable to launch debug adapter from '{0}'.", args[0]));
                        }
                        this.serverProcess = child;
                    }
                    else {
                        throw new Error(nls.localize('unableToLaunchDebugAdapterNoArgs', "Unable to launch debug adapter."));
                    }
                }
                else {
                    const spawnOptions = {
                        env: env
                    };
                    if (options.cwd) {
                        spawnOptions.cwd = options.cwd;
                    }
                    this.serverProcess = cp.spawn(command, args, spawnOptions);
                }
                this.serverProcess.on('error', err => {
                    this._onError.fire(err);
                });
                this.serverProcess.on('exit', (code, signal) => {
                    this._onExit.fire(code);
                });
                this.serverProcess.stdout.on('close', () => {
                    this._onError.fire(new Error('read error'));
                });
                this.serverProcess.stdout.on('error', error => {
                    this._onError.fire(error);
                });
                this.serverProcess.stdin.on('error', error => {
                    this._onError.fire(error);
                });
                this.serverProcess.stderr.resume();
                // finally connect to the DA
                this.connect(this.serverProcess.stdout, this.serverProcess.stdin);
            }
            catch (err) {
                this._onError.fire(err);
            }
        }
        async stopSession() {
            if (!this.serverProcess) {
                return Promise.resolve(undefined);
            }
            // when killing a process in windows its child
            // processes are *not* killed but become root
            // processes. Therefore we use TASKKILL.EXE
            await this.cancelPendingRequests();
            if (platform.isWindows) {
                return new Promise((c, e) => {
                    const killer = cp.exec(`taskkill /F /T /PID ${this.serverProcess.pid}`, function (err, stdout, stderr) {
                        if (err) {
                            return e(err);
                        }
                    });
                    killer.on('exit', c);
                    killer.on('error', e);
                });
            }
            else {
                this.serverProcess.kill('SIGTERM');
                return Promise.resolve(undefined);
            }
        }
        static extract(platformContribution, extensionFolderPath) {
            if (!platformContribution) {
                return undefined;
            }
            const result = Object.create(null);
            if (platformContribution.runtime) {
                if (platformContribution.runtime.indexOf('./') === 0) { // TODO
                    result.runtime = path.join(extensionFolderPath, platformContribution.runtime);
                }
                else {
                    result.runtime = platformContribution.runtime;
                }
            }
            if (platformContribution.runtimeArgs) {
                result.runtimeArgs = platformContribution.runtimeArgs;
            }
            if (platformContribution.program) {
                if (!path.isAbsolute(platformContribution.program)) {
                    result.program = path.join(extensionFolderPath, platformContribution.program);
                }
                else {
                    result.program = platformContribution.program;
                }
            }
            if (platformContribution.args) {
                result.args = platformContribution.args;
            }
            const contribution = platformContribution;
            if (contribution.win) {
                result.win = ExecutableDebugAdapter.extract(contribution.win, extensionFolderPath);
            }
            if (contribution.winx86) {
                result.winx86 = ExecutableDebugAdapter.extract(contribution.winx86, extensionFolderPath);
            }
            if (contribution.windows) {
                result.windows = ExecutableDebugAdapter.extract(contribution.windows, extensionFolderPath);
            }
            if (contribution.osx) {
                result.osx = ExecutableDebugAdapter.extract(contribution.osx, extensionFolderPath);
            }
            if (contribution.linux) {
                result.linux = ExecutableDebugAdapter.extract(contribution.linux, extensionFolderPath);
            }
            return result;
        }
        static platformAdapterExecutable(extensionDescriptions, debugType) {
            let result = Object.create(null);
            debugType = debugType.toLowerCase();
            // merge all contributions into one
            for (const ed of extensionDescriptions) {
                if (ed.contributes) {
                    const debuggers = ed.contributes['debuggers'];
                    if (debuggers && debuggers.length > 0) {
                        debuggers.filter(dbg => typeof dbg.type === 'string' && strings.equalsIgnoreCase(dbg.type, debugType)).forEach(dbg => {
                            // extract relevant attributes and make them absolute where needed
                            const extractedDbg = ExecutableDebugAdapter.extract(dbg, ed.extensionLocation.fsPath);
                            // merge
                            result = objects.mixin(result, extractedDbg, ed.isBuiltin);
                        });
                    }
                }
            }
            // select the right platform
            let platformInfo;
            if (platform.isWindows && !process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
                platformInfo = result.winx86 || result.win || result.windows;
            }
            else if (platform.isWindows) {
                platformInfo = result.win || result.windows;
            }
            else if (platform.isMacintosh) {
                platformInfo = result.osx;
            }
            else if (platform.isLinux) {
                platformInfo = result.linux;
            }
            platformInfo = platformInfo || result;
            // these are the relevant attributes
            const program = platformInfo.program || result.program;
            const args = platformInfo.args || result.args;
            const runtime = platformInfo.runtime || result.runtime;
            const runtimeArgs = platformInfo.runtimeArgs || result.runtimeArgs;
            if (runtime) {
                return {
                    type: 'executable',
                    command: runtime,
                    args: (runtimeArgs || []).concat(typeof program === 'string' ? [program] : []).concat(args || [])
                };
            }
            else if (program) {
                return {
                    type: 'executable',
                    command: program,
                    args: args || []
                };
            }
            // nothing found
            return undefined;
        }
    }
    exports.ExecutableDebugAdapter = ExecutableDebugAdapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdBZGFwdGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvbm9kZS9kZWJ1Z0FkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHOztPQUVHO0lBQ0gsTUFBc0Isa0JBQW1CLFNBQVEsMkNBQW9CO2lCQUU1QyxhQUFRLEdBQUcsVUFBVSxBQUFiLENBQWM7aUJBQ3RCLHlCQUFvQixHQUFHLE9BQU8sQUFBVixDQUFXLEdBQUMsb0RBQW9EO2lCQUNwRiwwQkFBcUIsR0FBRyxLQUFLLEFBQVIsQ0FBUztRQU10RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBSkQsWUFBTyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsa0JBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUkzQixDQUFDO1FBRVMsT0FBTyxDQUFDLFFBQXlCLEVBQUUsUUFBeUI7WUFFckUsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7WUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFeEIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsV0FBVyxDQUFDLE9BQXNDO1lBRWpELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENB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