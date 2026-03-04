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
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/pfs", "vs/nls", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/terminal/node/childProcessMonitor", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/terminal/node/windowsShellHelper", "node-pty", "vs/platform/terminal/common/terminalProcess"], function (require, exports, child_process_1, async_1, event_1, lifecycle_1, path, platform_1, uri_1, pfs_1, nls_1, log_1, productService_1, childProcessMonitor_1, terminalEnvironment_1, windowsShellHelper_1, node_pty_1, terminalProcess_1) {
    "use strict";
    var TerminalProcess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProcess = void 0;
    var ShutdownConstants;
    (function (ShutdownConstants) {
        /**
         * The amount of ms that must pass between data events after exit is queued before the actual
         * kill call is triggered. This data flush mechanism works around an [issue in node-pty][1]
         * where not all data is flushed which causes problems for task problem matchers. Additionally
         * on Windows under conpty, killing a process while data is being output will cause the [conhost
         * flush to hang the pty host][2] because [conhost should be hosted on another thread][3].
         *
         * [1]: https://github.com/Tyriar/node-pty/issues/72
         * [2]: https://github.com/microsoft/vscode/issues/71966
         * [3]: https://github.com/microsoft/node-pty/pull/415
         */
        ShutdownConstants[ShutdownConstants["DataFlushTimeout"] = 250] = "DataFlushTimeout";
        /**
         * The maximum ms to allow after dispose is called because forcefully killing the process.
         */
        ShutdownConstants[ShutdownConstants["MaximumShutdownTime"] = 5000] = "MaximumShutdownTime";
    })(ShutdownConstants || (ShutdownConstants = {}));
    var Constants;
    (function (Constants) {
        /**
         * The minimum duration between kill and spawn calls on Windows/conpty as a mitigation for a
         * hang issue. See:
         * - https://github.com/microsoft/vscode/issues/71966
         * - https://github.com/microsoft/vscode/issues/117956
         * - https://github.com/microsoft/vscode/issues/121336
         */
        Constants[Constants["KillSpawnThrottleInterval"] = 250] = "KillSpawnThrottleInterval";
        /**
         * The amount of time to wait when a call is throttles beyond the exact amount, this is used to
         * try prevent early timeouts causing a kill/spawn call to happen at double the regular
         * interval.
         */
        Constants[Constants["KillSpawnSpacingDuration"] = 50] = "KillSpawnSpacingDuration";
        /**
         * How long to wait between chunk writes.
         */
        Constants[Constants["WriteInterval"] = 5] = "WriteInterval";
    })(Constants || (Constants = {}));
    const posixShellTypeMap = new Map([
        ['bash', "bash" /* PosixShellType.Bash */],
        ['csh', "csh" /* PosixShellType.Csh */],
        ['fish', "fish" /* PosixShellType.Fish */],
        ['ksh', "ksh" /* PosixShellType.Ksh */],
        ['sh', "sh" /* PosixShellType.Sh */],
        ['pwsh', "pwsh" /* PosixShellType.PowerShell */],
        ['python', "python" /* PosixShellType.Python */],
        ['zsh', "zsh" /* PosixShellType.Zsh */]
    ]);
    let TerminalProcess = class TerminalProcess extends lifecycle_1.Disposable {
        static { TerminalProcess_1 = this; }
        static { this._lastKillOrStart = 0; }
        get exitMessage() { return this._exitMessage; }
        get currentTitle() { return this._windowsShellHelper?.shellTitle || this._currentTitle; }
        get shellType() { return platform_1.isWindows ? this._windowsShellHelper?.shellType : posixShellTypeMap.get(this._currentTitle); }
        get hasChildProcesses() { return this._childProcessMonitor?.hasChildProcesses || false; }
        constructor(shellLaunchConfig, cwd, cols, rows, env, 
        /**
         * environment used for `findExecutable`
         */
        _executableEnv, _options, _logService, _productService) {
            super();
            this.shellLaunchConfig = shellLaunchConfig;
            this._executableEnv = _executableEnv;
            this._options = _options;
            this._logService = _logService;
            this._productService = _productService;
            this.id = 0;
            this.shouldPersist = false;
            this._properties = {
                cwd: '',
                initialCwd: '',
                fixedDimensions: { cols: undefined, rows: undefined },
                title: '',
                shellType: undefined,
                hasChildProcesses: true,
                resolvedShellLaunchConfig: {},
                overrideDimensions: undefined,
                failedShellIntegrationActivation: false,
                usedShellIntegrationInjection: undefined
            };
            this._currentTitle = '';
            this._titleInterval = null;
            this._writeQueue = [];
            this._isPtyPaused = false;
            this._unacknowledgedCharCount = 0;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            let name;
            if (platform_1.isWindows) {
                name = path.basename(this.shellLaunchConfig.executable || '');
            }
            else {
                // Using 'xterm-256color' here helps ensure that the majority of Linux distributions will use a
                // color prompt as defined in the default ~/.bashrc file.
                name = 'xterm-256color';
            }
            this._initialCwd = cwd;
            this._properties["initialCwd" /* ProcessPropertyType.InitialCwd */] = this._initialCwd;
            this._properties["cwd" /* ProcessPropertyType.Cwd */] = this._initialCwd;
            const useConpty = this._options.windowsEnableConpty && process.platform === 'win32' && (0, terminalEnvironment_1.getWindowsBuildNumber)() >= 18309;
            this._ptyOptions = {
                name,
                cwd,
                // TODO: When node-pty is updated this cast can be removed
                env: env,
                cols,
                rows,
                useConpty,
                // This option will force conpty to not redraw the whole viewport on launch
                conptyInheritCursor: useConpty && !!shellLaunchConfig.initialText
            };
            // Delay resizes to avoid conpty not respecting very early resize calls
            if (platform_1.isWindows) {
                if (useConpty && cols === 0 && rows === 0 && this.shellLaunchConfig.executable?.endsWith('Git\\bin\\bash.exe')) {
                    this._delayedResizer = new DelayedResizer();
                    this._register(this._delayedResizer.onTrigger(dimensions => {
                        this._delayedResizer?.dispose();
                        this._delayedResizer = undefined;
                        if (dimensions.cols && dimensions.rows) {
                            this.resize(dimensions.cols, dimensions.rows);
                        }
                    }));
                }
                // WindowsShellHelper is used to fetch the process title and shell type
                this.onProcessReady(e => {
                    this._windowsShellHelper = this._register(new windowsShellHelper_1.WindowsShellHelper(e.pid));
                    this._register(this._windowsShellHelper.onShellTypeChanged(e => this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: e })));
                    this._register(this._windowsShellHelper.onShellNameChanged(e => this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: e })));
                });
            }
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this._titleInterval) {
                    clearInterval(this._titleInterval);
                    this._titleInterval = null;
                }
            }));
        }
        async start() {
            const results = await Promise.all([this._validateCwd(), this._validateExecutable()]);
            const firstError = results.find(r => r !== undefined);
            if (firstError) {
                return firstError;
            }
            let injection;
            if (this._options.shellIntegration.enabled) {
                injection = (0, terminalEnvironment_1.getShellIntegrationInjection)(this.shellLaunchConfig, this._options, this._ptyOptions.env, this._logService, this._productService);
                if (injection) {
                    this._onDidChangeProperty.fire({ type: "usedShellIntegrationInjection" /* ProcessPropertyType.UsedShellIntegrationInjection */, value: true });
                    if (injection.envMixin) {
                        for (const [key, value] of Object.entries(injection.envMixin)) {
                            this._ptyOptions.env ||= {};
                            this._ptyOptions.env[key] = value;
                        }
                    }
                    if (injection.filesToCopy) {
                        for (const f of injection.filesToCopy) {
                            await pfs_1.Promises.mkdir(path.dirname(f.dest), { recursive: true });
                            try {
                                await pfs_1.Promises.copyFile(f.source, f.dest);
                            }
                            catch {
                                // Swallow error, this should only happen when multiple users are on the same
                                // machine. Since the shell integration scripts rarely change, plus the other user
                                // should be using the same version of the server in this case, assume the script is
                                // fine if copy fails and swallow the error.
                            }
                        }
                    }
                }
                else {
                    this._onDidChangeProperty.fire({ type: "failedShellIntegrationActivation" /* ProcessPropertyType.FailedShellIntegrationActivation */, value: true });
                }
            }
            try {
                await this.setupPtyProcess(this.shellLaunchConfig, this._ptyOptions, injection);
                if (injection?.newArgs) {
                    return { injectedArgs: injection.newArgs };
                }
                return undefined;
            }
            catch (err) {
                this._logService.trace('node-pty.node-pty.IPty#spawn native exception', err);
                return { message: `A native exception occurred during launch (${err.message})` };
            }
        }
        async _validateCwd() {
            try {
                const result = await pfs_1.Promises.stat(this._initialCwd);
                if (!result.isDirectory()) {
                    return { message: (0, nls_1.localize)('launchFail.cwdNotDirectory', "Starting directory (cwd) \"{0}\" is not a directory", this._initialCwd.toString()) };
                }
            }
            catch (err) {
                if (err?.code === 'ENOENT') {
                    return { message: (0, nls_1.localize)('launchFail.cwdDoesNotExist', "Starting directory (cwd) \"{0}\" does not exist", this._initialCwd.toString()) };
                }
            }
            this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._initialCwd });
            return undefined;
        }
        async _validateExecutable() {
            const slc = this.shellLaunchConfig;
            if (!slc.executable) {
                throw new Error('IShellLaunchConfig.executable not set');
            }
            const cwd = slc.cwd instanceof uri_1.URI ? slc.cwd.path : slc.cwd;
            const envPaths = (slc.env && slc.env.PATH) ? slc.env.PATH.split(path.delimiter) : undefined;
            const executable = await (0, terminalEnvironment_1.findExecutable)(slc.executable, cwd, envPaths, this._executableEnv);
            if (!executable) {
                return { message: (0, nls_1.localize)('launchFail.executableDoesNotExist', "Path to shell executable \"{0}\" does not exist", slc.executable) };
            }
            try {
                const result = await pfs_1.Promises.stat(executable);
                if (!result.isFile() && !result.isSymbolicLink()) {
                    return { message: (0, nls_1.localize)('launchFail.executableIsNotFileOrSymlink', "Path to shell executable \"{0}\" is not a file or a symlink", slc.executable) };
                }
                // Set the executable explicitly here so that node-pty doesn't need to search the
                // $PATH too.
                slc.executable = executable;
            }
            catch (err) {
                if (err?.code === 'EACCES') {
                    // Swallow
                }
                else {
                    throw err;
                }
            }
            return undefined;
        }
        async setupPtyProcess(shellLaunchConfig, options, shellIntegrationInjection) {
            const args = shellIntegrationInjection?.newArgs || shellLaunchConfig.args || [];
            await this._throttleKillSpawn();
            this._logService.trace('node-pty.IPty#spawn', shellLaunchConfig.executable, args, options);
            const ptyProcess = (0, node_pty_1.spawn)(shellLaunchConfig.executable, args, options);
            this._ptyProcess = ptyProcess;
            this._childProcessMonitor = this._register(new childProcessMonitor_1.ChildProcessMonitor(ptyProcess.pid, this._logService));
            this._childProcessMonitor.onDidChangeHasChildProcesses(value => this._onDidChangeProperty.fire({ type: "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */, value }));
            this._processStartupComplete = new Promise(c => {
                this.onProcessReady(() => c());
            });
            ptyProcess.onData(data => {
                // Handle flow control
                this._unacknowledgedCharCount += data.length;
                if (!this._isPtyPaused && this._unacknowledgedCharCount > 100000 /* FlowControlConstants.HighWatermarkChars */) {
                    this._logService.trace(`Flow control: Pause (${this._unacknowledgedCharCount} > ${100000 /* FlowControlConstants.HighWatermarkChars */})`);
                    this._isPtyPaused = true;
                    ptyProcess.pause();
                }
                // Refire the data event
                this._logService.trace('node-pty.IPty#onData', data);
                this._onProcessData.fire(data);
                if (this._closeTimeout) {
                    this._queueProcessExit();
                }
                this._windowsShellHelper?.checkShell();
                this._childProcessMonitor?.handleOutput();
            });
            ptyProcess.onExit(e => {
                this._exitCode = e.exitCode;
                this._queueProcessExit();
            });
            this._sendProcessId(ptyProcess.pid);
            this._setupTitlePolling(ptyProcess);
        }
        _setupTitlePolling(ptyProcess) {
            // Send initial timeout async to give event listeners a chance to init
            setTimeout(() => this._sendProcessTitle(ptyProcess));
            // Setup polling for non-Windows, for Windows `process` doesn't change
            if (!platform_1.isWindows) {
                this._titleInterval = setInterval(() => {
                    if (this._currentTitle !== ptyProcess.process) {
                        this._sendProcessTitle(ptyProcess);
                    }
                }, 200);
            }
        }
        // Allow any trailing data events to be sent before the exit event is sent.
        // See https://github.com/Tyriar/node-pty/issues/72
        _queueProcessExit() {
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace('TerminalProcess#_queueProcessExit', new Error().stack?.replace(/^Error/, ''));
            }
            if (this._closeTimeout) {
                clearTimeout(this._closeTimeout);
            }
            this._closeTimeout = setTimeout(() => {
                this._closeTimeout = undefined;
                this._kill();
            }, 250 /* ShutdownConstants.DataFlushTimeout */);
        }
        async _kill() {
            // Wait to kill to process until the start up code has run. This prevents us from firing a process exit before a
            // process start.
            await this._processStartupComplete;
            if (this._store.isDisposed) {
                return;
            }
            // Attempt to kill the pty, it may have already been killed at this
            // point but we want to make sure
            try {
                if (this._ptyProcess) {
                    await this._throttleKillSpawn();
                    this._logService.trace('node-pty.IPty#kill');
                    this._ptyProcess.kill();
                }
            }
            catch (ex) {
                // Swallow, the pty has already been killed
            }
            this._onProcessExit.fire(this._exitCode || 0);
            this.dispose();
        }
        async _throttleKillSpawn() {
            // Only throttle on Windows/conpty
            if (!platform_1.isWindows || !('useConpty' in this._ptyOptions) || !this._ptyOptions.useConpty) {
                return;
            }
            // Use a loop to ensure multiple calls in a single interval space out
            while (Date.now() - TerminalProcess_1._lastKillOrStart < 250 /* Constants.KillSpawnThrottleInterval */) {
                this._logService.trace('Throttling kill/spawn call');
                await (0, async_1.timeout)(250 /* Constants.KillSpawnThrottleInterval */ - (Date.now() - TerminalProcess_1._lastKillOrStart) + 50 /* Constants.KillSpawnSpacingDuration */);
            }
            TerminalProcess_1._lastKillOrStart = Date.now();
        }
        _sendProcessId(pid) {
            this._onProcessReady.fire({
                pid,
                cwd: this._initialCwd,
                windowsPty: this.getWindowsPty()
            });
        }
        _sendProcessTitle(ptyProcess) {
            if (this._store.isDisposed) {
                return;
            }
            this._currentTitle = ptyProcess.process;
            this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: this._currentTitle });
            // If fig is installed it may change the title of the process
            const sanitizedTitle = this.currentTitle.replace(/ \(figterm\)$/g, '');
            if (sanitizedTitle.toLowerCase().startsWith('python')) {
                this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: "python" /* PosixShellType.Python */ });
            }
            else {
                this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: posixShellTypeMap.get(sanitizedTitle) });
            }
        }
        shutdown(immediate) {
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace('TerminalProcess#shutdown', new Error().stack?.replace(/^Error/, ''));
            }
            // don't force immediate disposal of the terminal processes on Windows as an additional
            // mitigation for https://github.com/microsoft/vscode/issues/71966 which causes the pty host
            // to become unresponsive, disconnecting all terminals across all windows.
            if (immediate && !platform_1.isWindows) {
                this._kill();
            }
            else {
                if (!this._closeTimeout && !this._store.isDisposed) {
                    this._queueProcessExit();
                    // Allow a maximum amount of time for the process to exit, otherwise force kill it
                    setTimeout(() => {
                        if (this._closeTimeout && !this._store.isDisposed) {
                            this._closeTimeout = undefined;
                            this._kill();
                        }
                    }, 5000 /* ShutdownConstants.MaximumShutdownTime */);
                }
            }
        }
        input(data, isBinary = false) {
            if (this._store.isDisposed || !this._ptyProcess) {
                return;
            }
            this._writeQueue.push(...(0, terminalProcess_1.chunkInput)(data).map(e => {
                return { isBinary, data: e };
            }));
            this._startWrite();
        }
        async processBinary(data) {
            this.input(data, true);
        }
        async refreshProperty(type) {
            switch (type) {
                case "cwd" /* ProcessPropertyType.Cwd */: {
                    const newCwd = await this.getCwd();
                    if (newCwd !== this._properties.cwd) {
                        this._properties.cwd = newCwd;
                        this._onDidChangeProperty.fire({ type: "cwd" /* ProcessPropertyType.Cwd */, value: this._properties.cwd });
                    }
                    return newCwd;
                }
                case "initialCwd" /* ProcessPropertyType.InitialCwd */: {
                    const initialCwd = await this.getInitialCwd();
                    if (initialCwd !== this._properties.initialCwd) {
                        this._properties.initialCwd = initialCwd;
                        this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._properties.initialCwd });
                    }
                    return initialCwd;
                }
                case "title" /* ProcessPropertyType.Title */:
                    return this.currentTitle;
                default:
                    return this.shellType;
            }
        }
        async updateProperty(type, value) {
            if (type === "fixedDimensions" /* ProcessPropertyType.FixedDimensions */) {
                this._properties.fixedDimensions = value;
            }
        }
        _startWrite() {
            // Don't write if it's already queued of is there is nothing to write
            if (this._writeTimeout !== undefined || this._writeQueue.length === 0) {
                return;
            }
            this._doWrite();
            // Don't queue more writes if the queue is empty
            if (this._writeQueue.length === 0) {
                this._writeTimeout = undefined;
                return;
            }
            // Queue the next write
            this._writeTimeout = setTimeout(() => {
                this._writeTimeout = undefined;
                this._startWrite();
            }, 5 /* Constants.WriteInterval */);
        }
        _doWrite() {
            const object = this._writeQueue.shift();
            this._logService.trace('node-pty.IPty#write', object.data);
            if (object.isBinary) {
                this._ptyProcess.write(Buffer.from(object.data, 'binary'));
            }
            else {
                this._ptyProcess.write(object.data);
            }
            this._childProcessMonitor?.handleInput();
        }
        resize(cols, rows) {
            if (this._store.isDisposed) {
                return;
            }
            if (typeof cols !== 'number' || typeof rows !== 'number' || isNaN(cols) || isNaN(rows)) {
                return;
            }
            // Ensure that cols and rows are always >= 1, this prevents a native
            // exception in winpty.
            if (this._ptyProcess) {
                cols = Math.max(cols, 1);
                rows = Math.max(rows, 1);
                // Delay resize if needed
                if (this._delayedResizer) {
                    this._delayedResizer.cols = cols;
                    this._delayedResizer.rows = rows;
                    return;
                }
                this._logService.trace('node-pty.IPty#resize', cols, rows);
                try {
                    this._ptyProcess.resize(cols, rows);
                }
                catch (e) {
                    // Swallow error if the pty has already exited
                    this._logService.trace('node-pty.IPty#resize exception ' + e.message);
                    if (this._exitCode !== undefined &&
                        e.message !== 'ioctl(2) failed, EBADF' &&
                        e.message !== 'Cannot resize a pty that has already exited') {
                        throw e;
                    }
                }
            }
        }
        clearBuffer() {
            this._ptyProcess?.clear();
        }
        acknowledgeDataEvent(charCount) {
            // Prevent lower than 0 to heal from errors
            this._unacknowledgedCharCount = Math.max(this._unacknowledgedCharCount - charCount, 0);
            this._logService.trace(`Flow control: Ack ${charCount} chars (unacknowledged: ${this._unacknowledgedCharCount})`);
            if (this._isPtyPaused && this._unacknowledgedCharCount < 5000 /* FlowControlConstants.LowWatermarkChars */) {
                this._logService.trace(`Flow control: Resume (${this._unacknowledgedCharCount} < ${5000 /* FlowControlConstants.LowWatermarkChars */})`);
                this._ptyProcess?.resume();
                this._isPtyPaused = false;
            }
        }
        clearUnacknowledgedChars() {
            this._unacknowledgedCharCount = 0;
            this._logService.trace(`Flow control: Cleared all unacknowledged chars, forcing resume`);
            if (this._isPtyPaused) {
                this._ptyProcess?.resume();
                this._isPtyPaused = false;
            }
        }
        async setUnicodeVersion(version) {
            // No-op
        }
        getInitialCwd() {
            return Promise.resolve(this._initialCwd);
        }
        async getCwd() {
            if (platform_1.isMacintosh) {
                // From Big Sur (darwin v20) there is a spawn blocking thread issue on Electron,
                // this is fixed in VS Code's internal Electron.
                // https://github.com/Microsoft/vscode/issues/105446
                return new Promise(resolve => {
                    if (!this._ptyProcess) {
                        resolve(this._initialCwd);
                        return;
                    }
                    this._logService.trace('node-pty.IPty#pid');
                    (0, child_process_1.exec)('lsof -OPln -p ' + this._ptyProcess.pid + ' | grep cwd', { env: { ...process.env, LANG: 'en_US.UTF-8' } }, (error, stdout, stderr) => {
                        if (!error && stdout !== '') {
                            resolve(stdout.substring(stdout.indexOf('/'), stdout.length - 1));
                        }
                        else {
                            this._logService.error('lsof did not run successfully, it may not be on the $PATH?', error, stdout, stderr);
                            resolve(this._initialCwd);
                        }
                    });
                });
            }
            if (platform_1.isLinux) {
                if (!this._ptyProcess) {
                    return this._initialCwd;
                }
                this._logService.trace('node-pty.IPty#pid');
                try {
                    return await pfs_1.Promises.readlink(`/proc/${this._ptyProcess.pid}/cwd`);
                }
                catch (error) {
                    return this._initialCwd;
                }
            }
            return this._initialCwd;
        }
        getWindowsPty() {
            return platform_1.isWindows ? {
                backend: 'useConpty' in this._ptyOptions && this._ptyOptions.useConpty ? 'conpty' : 'winpty',
                buildNumber: (0, terminalEnvironment_1.getWindowsBuildNumber)()
            } : undefined;
        }
    };
    exports.TerminalProcess = TerminalProcess;
    exports.TerminalProcess = TerminalProcess = TerminalProcess_1 = __decorate([
        __param(7, log_1.ILogService),
        __param(8, productService_1.IProductService)
    ], TerminalProcess);
    /**
     * Tracks the latest resize event to be trigger at a later point.
     */
    class DelayedResizer extends lifecycle_1.Disposable {
        get onTrigger() { return this._onTrigger.event; }
        constructor() {
            super();
            this._onTrigger = this._register(new event_1.Emitter());
            this._timeout = setTimeout(() => {
                this._onTrigger.fire({ rows: this.rows, cols: this.cols });
            }, 1000);
            this._register((0, lifecycle_1.toDisposable)(() => clearTimeout(this._timeout)));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvbm9kZS90ZXJtaW5hbFByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9CaEcsSUFBVyxpQkFpQlY7SUFqQkQsV0FBVyxpQkFBaUI7UUFDM0I7Ozs7Ozs7Ozs7V0FVRztRQUNILG1GQUFzQixDQUFBO1FBQ3RCOztXQUVHO1FBQ0gsMEZBQTBCLENBQUE7SUFDM0IsQ0FBQyxFQWpCVSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBaUIzQjtJQUVELElBQVcsU0FtQlY7SUFuQkQsV0FBVyxTQUFTO1FBQ25COzs7Ozs7V0FNRztRQUNILHFGQUErQixDQUFBO1FBQy9COzs7O1dBSUc7UUFDSCxrRkFBNkIsQ0FBQTtRQUM3Qjs7V0FFRztRQUNILDJEQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFuQlUsU0FBUyxLQUFULFNBQVMsUUFtQm5CO0lBT0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBeUI7UUFDekQsQ0FBQyxNQUFNLG1DQUFzQjtRQUM3QixDQUFDLEtBQUssaUNBQXFCO1FBQzNCLENBQUMsTUFBTSxtQ0FBc0I7UUFDN0IsQ0FBQyxLQUFLLGlDQUFxQjtRQUMzQixDQUFDLElBQUksK0JBQW9CO1FBQ3pCLENBQUMsTUFBTSx5Q0FBNEI7UUFDbkMsQ0FBQyxRQUFRLHVDQUF3QjtRQUNqQyxDQUFDLEtBQUssaUNBQXFCO0tBQzNCLENBQUMsQ0FBQztJQUVJLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7O2lCQWdCL0IscUJBQWdCLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFrQnBDLElBQUksV0FBVyxLQUF5QixPQUFPLElBQUksQ0FBQyxZQUFZLENB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