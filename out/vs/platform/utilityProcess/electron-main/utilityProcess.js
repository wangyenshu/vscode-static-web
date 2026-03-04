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
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/log/common/log", "string_decoder", "vs/base/common/async", "vs/base/common/network", "vs/platform/windows/electron-main/windows", "vs/base/common/severity", "vs/platform/telemetry/common/telemetry", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/processes", "vs/base/common/objects", "vs/base/common/platform", "vs/base/node/unc"], function (require, exports, electron_1, lifecycle_1, event_1, log_1, string_decoder_1, async_1, network_1, windows_1, severity_1, telemetry_1, lifecycleMainService_1, processes_1, objects_1, platform_1, unc_1) {
    "use strict";
    var UtilityProcess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowUtilityProcess = exports.UtilityProcess = void 0;
    function isWindowUtilityProcessConfiguration(config) {
        const candidate = config;
        return typeof candidate.responseWindowId === 'number';
    }
    let UtilityProcess = class UtilityProcess extends lifecycle_1.Disposable {
        static { UtilityProcess_1 = this; }
        static { this.ID_COUNTER = 0; }
        static { this.all = new Map(); }
        static getAll() {
            return Array.from(UtilityProcess_1.all.values());
        }
        constructor(logService, telemetryService, lifecycleMainService) {
            super();
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.lifecycleMainService = lifecycleMainService;
            this.id = String(++UtilityProcess_1.ID_COUNTER);
            this._onStdout = this._register(new event_1.Emitter());
            this.onStdout = this._onStdout.event;
            this._onStderr = this._register(new event_1.Emitter());
            this.onStderr = this._onStderr.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onSpawn = this._register(new event_1.Emitter());
            this.onSpawn = this._onSpawn.event;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this._onCrash = this._register(new event_1.Emitter());
            this.onCrash = this._onCrash.event;
            this.process = undefined;
            this.processPid = undefined;
            this.configuration = undefined;
            this.killed = false;
        }
        log(msg, severity) {
            let logMsg;
            if (this.configuration?.correlationId) {
                logMsg = `[UtilityProcess id: ${this.configuration?.correlationId}, type: ${this.configuration?.type}, pid: ${this.processPid ?? '<none>'}]: ${msg}`;
            }
            else {
                logMsg = `[UtilityProcess type: ${this.configuration?.type}, pid: ${this.processPid ?? '<none>'}]: ${msg}`;
            }
            switch (severity) {
                case severity_1.default.Error:
                    this.logService.error(logMsg);
                    break;
                case severity_1.default.Warning:
                    this.logService.warn(logMsg);
                    break;
                case severity_1.default.Info:
                    this.logService.trace(logMsg);
                    break;
            }
        }
        validateCanStart() {
            if (this.process) {
                this.log('Cannot start utility process because it is already running...', severity_1.default.Error);
                return false;
            }
            return true;
        }
        start(configuration) {
            const started = this.doStart(configuration);
            if (started && configuration.payload) {
                const posted = this.postMessage(configuration.payload);
                if (posted) {
                    this.log('payload sent via postMessage()', severity_1.default.Info);
                }
            }
            return started;
        }
        doStart(configuration) {
            if (!this.validateCanStart()) {
                return false;
            }
            this.configuration = configuration;
            const serviceName = `${this.configuration.type}-${this.id}`;
            const modulePath = network_1.FileAccess.asFileUri('bootstrap-fork.js').fsPath;
            const args = this.configuration.args ?? [];
            const execArgv = this.configuration.execArgv ?? [];
            const allowLoadingUnsignedLibraries = this.configuration.allowLoadingUnsignedLibraries;
            const forceAllocationsToV8Sandbox = this.configuration.forceAllocationsToV8Sandbox;
            const stdio = 'pipe';
            const env = this.createEnv(configuration);
            this.log('creating new...', severity_1.default.Info);
            // Fork utility process
            this.process = electron_1.utilityProcess.fork(modulePath, args, {
                serviceName,
                env,
                execArgv,
                allowLoadingUnsignedLibraries,
                forceAllocationsToV8Sandbox,
                stdio
            });
            // Register to events
            this.registerListeners(this.process, this.configuration, serviceName);
            return true;
        }
        createEnv(configuration) {
            const env = configuration.env ? { ...configuration.env } : { ...(0, objects_1.deepClone)(process.env) };
            // Apply supported environment variables from config
            env['VSCODE_AMD_ENTRYPOINT'] = configuration.entryPoint;
            if (typeof configuration.parentLifecycleBound === 'number') {
                env['VSCODE_PARENT_PID'] = String(configuration.parentLifecycleBound);
            }
            env['VSCODE_CRASH_REPORTER_PROCESS_TYPE'] = configuration.type;
            if (platform_1.isWindows) {
                if ((0, unc_1.isUNCAccessRestrictionsDisabled)()) {
                    env['NODE_DISABLE_UNC_ACCESS_CHECKS'] = '1';
                }
                else {
                    env['NODE_UNC_HOST_ALLOWLIST'] = (0, unc_1.getUNCHostAllowlist)().join('\\');
                }
            }
            // Remove any environment variables that are not allowed
            (0, processes_1.removeDangerousEnvVariables)(env);
            // Ensure all values are strings, otherwise the process will not start
            for (const key of Object.keys(env)) {
                env[key] = String(env[key]);
            }
            return env;
        }
        registerListeners(process, configuration, serviceName) {
            // Stdout
            if (process.stdout) {
                const stdoutDecoder = new string_decoder_1.StringDecoder('utf-8');
                this._register(event_1.Event.fromNodeEventEmitter(process.stdout, 'data')(chunk => this._onStdout.fire(typeof chunk === 'string' ? chunk : stdoutDecoder.write(chunk))));
            }
            // Stderr
            if (process.stderr) {
                const stderrDecoder = new string_decoder_1.StringDecoder('utf-8');
                this._register(event_1.Event.fromNodeEventEmitter(process.stderr, 'data')(chunk => this._onStderr.fire(typeof chunk === 'string' ? chunk : stderrDecoder.write(chunk))));
            }
            // Messages
            this._register(event_1.Event.fromNodeEventEmitter(process, 'message')(msg => this._onMessage.fire(msg)));
            // Spawn
            this._register(event_1.Event.fromNodeEventEmitter(process, 'spawn')(() => {
                this.processPid = process.pid;
                if (typeof process.pid === 'number') {
                    UtilityProcess_1.all.set(process.pid, { pid: process.pid, name: isWindowUtilityProcessConfiguration(configuration) ? `${configuration.type} [${configuration.responseWindowId}]` : configuration.type });
                }
                this.log('successfully created', severity_1.default.Info);
                this._onSpawn.fire(process.pid);
            }));
            // Exit
            this._register(event_1.Event.fromNodeEventEmitter(process, 'exit')(code => {
                const normalizedCode = this.isNormalExit(code) ? 0 : code;
                this.log(`received exit event with code ${normalizedCode}`, severity_1.default.Info);
                // Event
                this._onExit.fire({ pid: this.processPid, code: normalizedCode, signal: 'unknown' });
                // Cleanup
                this.onDidExitOrCrashOrKill();
            }));
            // Child process gone
            this._register(event_1.Event.fromNodeEventEmitter(electron_1.app, 'child-process-gone', (event, details) => ({ event, details }))(({ details }) => {
                if (details.type === 'Utility' && details.name === serviceName && !this.isNormalExit(details.exitCode)) {
                    this.log(`crashed with code ${details.exitCode} and reason '${details.reason}'`, severity_1.default.Error);
                    this.telemetryService.publicLog2('utilityprocesscrash', {
                        type: configuration.type,
                        reason: details.reason,
                        code: details.exitCode
                    });
                    // Event
                    this._onCrash.fire({ pid: this.processPid, code: details.exitCode, reason: details.reason });
                    // Cleanup
                    this.onDidExitOrCrashOrKill();
                }
            }));
        }
        once(message, callback) {
            const disposable = this._register(this._onMessage.event(msg => {
                if (msg === message) {
                    disposable.dispose();
                    callback();
                }
            }));
        }
        postMessage(message, transfer) {
            if (!this.process) {
                return false; // already killed, crashed or never started
            }
            this.process.postMessage(message, transfer);
            return true;
        }
        connect(payload) {
            const { port1: outPort, port2: utilityProcessPort } = new electron_1.MessageChannelMain();
            this.postMessage(payload, [utilityProcessPort]);
            return outPort;
        }
        enableInspectPort() {
            if (!this.process || typeof this.processPid !== 'number') {
                return false;
            }
            this.log('enabling inspect port', severity_1.default.Info);
            // use (undocumented) _debugProcess feature of node if available
            const processExt = process;
            if (typeof processExt._debugProcess === 'function') {
                processExt._debugProcess(this.processPid);
                return true;
            }
            // not supported...
            return false;
        }
        kill() {
            if (!this.process) {
                return; // already killed, crashed or never started
            }
            this.log('attempting to kill the process...', severity_1.default.Info);
            const killed = this.process.kill();
            if (killed) {
                this.log('successfully killed the process', severity_1.default.Info);
                this.killed = true;
                this.onDidExitOrCrashOrKill();
            }
            else {
                this.log('unable to kill the process', severity_1.default.Warning);
            }
        }
        isNormalExit(exitCode) {
            if (exitCode === 0) {
                return true;
            }
            // Treat an exit code of 15 (SIGTERM) as a normal exit
            // if we triggered the termination from process.kill()
            return this.killed && exitCode === 15 /* SIGTERM */;
        }
        onDidExitOrCrashOrKill() {
            if (typeof this.processPid === 'number') {
                UtilityProcess_1.all.delete(this.processPid);
            }
            this.process = undefined;
        }
        async waitForExit(maxWaitTimeMs) {
            if (!this.process) {
                return; // already killed, crashed or never started
            }
            this.log('waiting to exit...', severity_1.default.Info);
            await Promise.race([event_1.Event.toPromise(this.onExit), (0, async_1.timeout)(maxWaitTimeMs)]);
            if (this.process) {
                this.log(`did not exit within ${maxWaitTimeMs}ms, will kill it now...`, severity_1.default.Info);
                this.kill();
            }
        }
    };
    exports.UtilityProcess = UtilityProcess;
    exports.UtilityProcess = UtilityProcess = UtilityProcess_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, lifecycleMainService_1.ILifecycleMainService)
    ], UtilityProcess);
    let WindowUtilityProcess = class WindowUtilityProcess extends UtilityProcess {
        constructor(logService, windowsMainService, telemetryService, lifecycleMainService) {
            super(logService, telemetryService, lifecycleMainService);
            this.windowsMainService = windowsMainService;
        }
        start(configuration) {
            const responseWindow = this.windowsMainService.getWindowById(configuration.responseWindowId);
            if (!responseWindow?.win || responseWindow.win.isDestroyed() || responseWindow.win.webContents.isDestroyed()) {
                this.log('Refusing to start utility process because requesting window cannot be found or is destroyed...', severity_1.default.Error);
                return true;
            }
            // Start utility process
            const started = super.doStart(configuration);
            if (!started) {
                return false;
            }
            // Register to window events
            this.registerWindowListeners(responseWindow.win, configuration);
            // Establish & exchange message ports
            const windowPort = this.connect(configuration.payload);
            responseWindow.win.webContents.postMessage(configuration.responseChannel, configuration.responseNonce, [windowPort]);
            return true;
        }
        registerWindowListeners(window, configuration) {
            // If the lifecycle of the utility process is bound to the window,
            // we kill the process if the window closes or changes
            if (configuration.windowLifecycleBound) {
                this._register(event_1.Event.filter(this.lifecycleMainService.onWillLoadWindow, e => e.window.win === window)(() => this.kill()));
                this._register(event_1.Event.fromNodeEventEmitter(window, 'closed')(() => this.kill()));
            }
        }
    };
    exports.WindowUtilityProcess = WindowUtilityProcess;
    exports.WindowUtilityProcess = WindowUtilityProcess = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, lifecycleMainService_1.ILifecycleMainService)
    ], WindowUtilityProcess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eVByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91dGlsaXR5UHJvY2Vzcy9lbGVjdHJvbi1tYWluL3V0aWxpdHlQcm9jZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4RmhHLFNBQVMsbUNBQW1DLENBQUMsTUFBb0M7UUFDaEYsTUFBTSxTQUFTLEdBQUcsTUFBNEMsQ0FBQztRQUUvRCxPQUFPLE9BQU8sU0FBUyxDQUFDLGdCQUFnQixLQUFLLFFBQVEsQ0FBQztJQUN2RCxDQUFDO0lBcUNNLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTs7aUJBRTlCLGVBQVUsR0FBRyxDQUFDLEFBQUosQ0FBSztpQkFFTixRQUFHLEdBQUcsSUFBSSxHQUFHLEVBQStCLEFBQXpDLENBQTBDO1FBQ3JFLE1BQU0sQ0FBQyxNQUFNO1lBQ1osT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQTJCRCxZQUNjLFVBQXdDLEVBQ2xDLGdCQUFvRCxFQUNoRCxvQkFBOEQ7WUFFckYsS0FBSyxFQUFFLENBQUM7WUFKc0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNqQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQzdCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUE1QnJFLE9BQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxnQkFBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXpDLGNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUMxRCxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENB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