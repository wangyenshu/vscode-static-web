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
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/node/shell", "vs/platform/log/common/log", "vs/platform/terminal/common/requestStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalDataBuffering", "vs/platform/terminal/common/terminalEnvironment", "@xterm/headless", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/terminal/node/terminalProcess", "vs/nls", "vs/platform/terminal/node/childProcessMonitor", "vs/platform/terminal/common/terminalAutoResponder", "vs/base/common/errors", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/terminal/common/terminalStrings", "path", "vs/base/common/decorators", "vs/base/common/performance"], function (require, exports, child_process_1, async_1, event_1, lifecycle_1, platform_1, shell_1, log_1, requestStore_1, terminal_1, terminalDataBuffering_1, terminalEnvironment_1, headless_1, terminalEnvironment_2, terminalProcess_1, nls_1, childProcessMonitor_1, terminalAutoResponder_1, errors_1, shellIntegrationAddon_1, terminalStrings_1, path_1, decorators_1, performance) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PtyService = void 0;
    exports.traceRpc = traceRpc;
    function traceRpc(_target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('not supported');
        }
        const fnKey = 'value';
        const fn = descriptor.value;
        descriptor[fnKey] = async function (...args) {
            if (this.traceRpcArgs.logService.getLevel() === log_1.LogLevel.Trace) {
                this.traceRpcArgs.logService.trace(`[RPC Request] PtyService#${fn.name}(${args.map(e => JSON.stringify(e)).join(', ')})`);
            }
            if (this.traceRpcArgs.simulatedLatency) {
                await (0, async_1.timeout)(this.traceRpcArgs.simulatedLatency);
            }
            let result;
            try {
                result = await fn.apply(this, args);
            }
            catch (e) {
                this.traceRpcArgs.logService.error(`[RPC Response] PtyService#${fn.name}`, e);
                throw e;
            }
            if (this.traceRpcArgs.logService.getLevel() === log_1.LogLevel.Trace) {
                this.traceRpcArgs.logService.trace(`[RPC Response] PtyService#${fn.name}`, result);
            }
            return result;
        };
    }
    let SerializeAddon;
    let Unicode11Addon;
    class PtyService extends lifecycle_1.Disposable {
        _traceEvent(name, event) {
            event(e => {
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`[RPC Event] PtyService#${name}.fire(${JSON.stringify(e)})`);
                }
            });
            return event;
        }
        get traceRpcArgs() {
            return {
                logService: this._logService,
                simulatedLatency: this._simulatedLatency
            };
        }
        constructor(_logService, _productService, _reconnectConstants, _simulatedLatency) {
            super();
            this._logService = _logService;
            this._productService = _productService;
            this._reconnectConstants = _reconnectConstants;
            this._simulatedLatency = _simulatedLatency;
            this._ptys = new Map();
            this._workspaceLayoutInfos = new Map();
            this._revivedPtyIdMap = new Map();
            this._autoReplies = new Map();
            this._lastPtyId = 0;
            this._onHeartbeat = this._register(new event_1.Emitter());
            this.onHeartbeat = this._traceEvent('_onHeartbeat', this._onHeartbeat.event);
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._traceEvent('_onProcessData', this._onProcessData.event);
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._traceEvent('_onProcessReplay', this._onProcessReplay.event);
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._traceEvent('_onProcessReady', this._onProcessReady.event);
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._traceEvent('_onProcessExit', this._onProcessExit.event);
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._traceEvent('_onProcessOrphanQuestion', this._onProcessOrphanQuestion.event);
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._traceEvent('_onDidRequestDetach', this._onDidRequestDetach.event);
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._traceEvent('_onDidChangeProperty', this._onDidChangeProperty.event);
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const pty of this._ptys.values()) {
                    pty.shutdown(true);
                }
                this._ptys.clear();
            }));
            this._detachInstanceRequestStore = this._register(new requestStore_1.RequestStore(undefined, this._logService));
            this._detachInstanceRequestStore.onCreateRequest(this._onDidRequestDetach.fire, this._onDidRequestDetach);
        }
        async refreshIgnoreProcessNames(names) {
            childProcessMonitor_1.ignoreProcessNames.length = 0;
            childProcessMonitor_1.ignoreProcessNames.push(...names);
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._detachInstanceRequestStore.createRequest({ workspaceId, instanceId });
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            let processDetails = undefined;
            const pty = this._ptys.get(persistentProcessId);
            if (pty) {
                processDetails = await this._buildProcessDetails(persistentProcessId, pty);
            }
            this._detachInstanceRequestStore.acceptReply(requestId, processDetails);
        }
        async freePortKillProcess(port) {
            const stdout = await new Promise((resolve, reject) => {
                (0, child_process_1.exec)(platform_1.isWindows ? `netstat -ano | findstr "${port}"` : `lsof -nP -iTCP -sTCP:LISTEN | grep ${port}`, {}, (err, stdout) => {
                    if (err) {
                        return reject('Problem occurred when listing active processes');
                    }
                    resolve(stdout);
                });
            });
            const processesForPort = stdout.split(/\r?\n/).filter(s => !!s.trim());
            if (processesForPort.length >= 1) {
                const capturePid = /\s+(\d+)(?:\s+|$)/;
                const processId = processesForPort[0].match(capturePid)?.[1];
                if (processId) {
                    try {
                        process.kill(Number.parseInt(processId));
                    }
                    catch { }
                }
                else {
                    throw new Error(`Processes for port ${port} were not found`);
                }
                return { port, processId };
            }
            throw new Error(`Could not kill process with port ${port}`);
        }
        async serializeTerminalState(ids) {
            const promises = [];
            for (const [persistentProcessId, persistentProcess] of this._ptys.entries()) {
                // Only serialize persistent processes that have had data written or performed a replay
                if (persistentProcess.hasWrittenData && ids.indexOf(persistentProcessId) !== -1) {
                    promises.push(async_1.Promises.withAsyncBody(async (r) => {
                        r({
                            id: persistentProcessId,
                            shellLaunchConfig: persistentProcess.shellLaunchConfig,
                            processDetails: await this._buildProcessDetails(persistentProcessId, persistentProcess),
                            processLaunchConfig: persistentProcess.processLaunchOptions,
                            unicodeVersion: persistentProcess.unicodeVersion,
                            replayEvent: await persistentProcess.serializeNormalBuffer(),
                            timestamp: Date.now()
                        });
                    }));
                }
            }
            const serialized = {
                version: 1,
                state: await Promise.all(promises)
            };
            return JSON.stringify(serialized);
        }
        async reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocale) {
            const promises = [];
            for (const terminal of state) {
                promises.push(this._reviveTerminalProcess(workspaceId, terminal));
            }
            await Promise.all(promises);
        }
        async _reviveTerminalProcess(workspaceId, terminal) {
            const restoreMessage = (0, nls_1.localize)('terminal-history-restored', "History restored");
            // TODO: We may at some point want to show date information in a hover via a custom sequence:
            //   new Date(terminal.timestamp).toLocaleDateString(dateTimeFormatLocale)
            //   new Date(terminal.timestamp).toLocaleTimeString(dateTimeFormatLocale)
            const newId = await this.createProcess({
                ...terminal.shellLaunchConfig,
                cwd: terminal.processDetails.cwd,
                color: terminal.processDetails.color,
                icon: terminal.processDetails.icon,
                name: terminal.processDetails.titleSource === terminal_1.TitleEventSource.Api ? terminal.processDetails.title : undefined,
                initialText: terminal.replayEvent.events[0].data + (0, terminalStrings_1.formatMessageForTerminal)(restoreMessage, { loudFormatting: true })
            }, terminal.processDetails.cwd, terminal.replayEvent.events[0].cols, terminal.replayEvent.events[0].rows, terminal.unicodeVersion, terminal.processLaunchConfig.env, terminal.processLaunchConfig.executableEnv, terminal.processLaunchConfig.options, true, terminal.processDetails.workspaceId, terminal.processDetails.workspaceName, true, terminal.replayEvent.events[0].data);
            // Don't start the process here as there's no terminal to answer CPR
            const oldId = this._getRevivingProcessId(workspaceId, terminal.id);
            this._revivedPtyIdMap.set(oldId, { newId, state: terminal });
            this._logService.info(`Revived process, old id ${oldId} -> new id ${newId}`);
        }
        async shutdownAll() {
            this.dispose();
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName, isReviving, rawReviveBuffer) {
            if (shellLaunchConfig.attachPersistentProcess) {
                throw new Error('Attempt to create a process when attach object was provided');
            }
            const id = ++this._lastPtyId;
            const process = new terminalProcess_1.TerminalProcess(shellLaunchConfig, cwd, cols, rows, env, executableEnv, options, this._logService, this._productService);
            const processLaunchOptions = {
                env,
                executableEnv,
                options
            };
            const persistentProcess = new PersistentTerminalProcess(id, process, workspaceId, workspaceName, shouldPersist, cols, rows, processLaunchOptions, unicodeVersion, this._reconnectConstants, this._logService, isReviving && typeof shellLaunchConfig.initialText === 'string' ? shellLaunchConfig.initialText : undefined, rawReviveBuffer, shellLaunchConfig.icon, shellLaunchConfig.color, shellLaunchConfig.name, shellLaunchConfig.fixedDimensions);
            process.onProcessExit(event => {
                persistentProcess.dispose();
                this._ptys.delete(id);
                this._onProcessExit.fire({ id, event });
            });
            persistentProcess.onProcessData(event => this._onProcessData.fire({ id, event }));
            persistentProcess.onProcessReplay(event => this._onProcessReplay.fire({ id, event }));
            persistentProcess.onProcessReady(event => this._onProcessReady.fire({ id, event }));
            persistentProcess.onProcessOrphanQuestion(() => this._onProcessOrphanQuestion.fire({ id }));
            persistentProcess.onDidChangeProperty(property => this._onDidChangeProperty.fire({ id, property }));
            persistentProcess.onPersistentProcessReady(() => {
                for (const e of this._autoReplies.entries()) {
                    persistentProcess.installAutoReply(e[0], e[1]);
                }
            });
            this._ptys.set(id, persistentProcess);
            return id;
        }
        async attachToProcess(id) {
            try {
                await this._throwIfNoPty(id).attach();
                this._logService.info(`Persistent process reconnection "${id}"`);
            }
            catch (e) {
                this._logService.warn(`Persistent process reconnection "${id}" failed`, e.message);
                throw e;
            }
        }
        async updateTitle(id, title, titleSource) {
            this._throwIfNoPty(id).setTitle(title, titleSource);
        }
        async updateIcon(id, userInitiated, icon, color) {
            this._throwIfNoPty(id).setIcon(userInitiated, icon, color);
        }
        async clearBuffer(id) {
            this._throwIfNoPty(id).clearBuffer();
        }
        async refreshProperty(id, type) {
            return this._throwIfNoPty(id).refreshProperty(type);
        }
        async updateProperty(id, type, value) {
            return this._throwIfNoPty(id).updateProperty(type, value);
        }
        async detachFromProcess(id, forcePersist) {
            return this._throwIfNoPty(id).detach(forcePersist);
        }
        async reduceConnectionGraceTime() {
            for (const pty of this._ptys.values()) {
                pty.reduceGraceTime();
            }
        }
        async listProcesses() {
            const persistentProcesses = Array.from(this._ptys.entries()).filter(([_, pty]) => pty.shouldPersistTerminal);
            this._logService.info(`Listing ${persistentProcesses.length} persistent terminals, ${this._ptys.size} total terminals`);
            const promises = persistentProcesses.map(async ([id, terminalProcessData]) => this._buildProcessDetails(id, terminalProcessData));
            const allTerminals = await Promise.all(promises);
            return allTerminals.filter(entry => entry.isOrphan);
        }
        async getPerformanceMarks() {
            return performance.getMarks();
        }
        async start(id) {
            const pty = this._ptys.get(id);
            return pty ? pty.start() : { message: `Could not find pty with id "${id}"` };
        }
        async shutdown(id, immediate) {
            // Don't throw if the pty is already shutdown
            return this._ptys.get(id)?.shutdown(immediate);
        }
        async input(id, data) {
            return this._throwIfNoPty(id).input(data);
        }
        async processBinary(id, data) {
            return this._throwIfNoPty(id).writeBinary(data);
        }
        async resize(id, cols, rows) {
            return this._throwIfNoPty(id).resize(cols, rows);
        }
        async getInitialCwd(id) {
            return this._throwIfNoPty(id).getInitialCwd();
        }
        async getCwd(id) {
            return this._throwIfNoPty(id).getCwd();
        }
        async acknowledgeDataEvent(id, charCount) {
            return this._throwIfNoPty(id).acknowledgeDataEvent(charCount);
        }
        async setUnicodeVersion(id, version) {
            return this._throwIfNoPty(id).setUnicodeVersion(version);
        }
        async getLatency() {
            return [];
        }
        async orphanQuestionReply(id) {
            return this._throwIfNoPty(id).orphanQuestionReply();
        }
        async installAutoReply(match, reply) {
            this._autoReplies.set(match, reply);
            // If the auto reply exists on any existing terminals it will be overridden
            for (const p of this._ptys.values()) {
                p.installAutoReply(match, reply);
            }
        }
        async uninstallAllAutoReplies() {
            for (const match of this._autoReplies.keys()) {
                for (const p of this._ptys.values()) {
                    p.uninstallAutoReply(match);
                }
            }
        }
        async uninstallAutoReply(match) {
            for (const p of this._ptys.values()) {
                p.uninstallAutoReply(match);
            }
        }
        async getDefaultSystemShell(osOverride = platform_1.OS) {
            return (0, shell_1.getSystemShell)(osOverride, process.env);
        }
        async getEnvironment() {
            return { ...process.env };
        }
        async getWslPath(original, direction) {
            if (direction === 'win-to-unix') {
                if (!platform_1.isWindows) {
                    return original;
                }
                if ((0, terminalEnvironment_2.getWindowsBuildNumber)() < 17063) {
                    return original.replace(/\\/g, '/');
                }
                const wslExecutable = this._getWSLExecutablePath();
                if (!wslExecutable) {
                    return original;
                }
                return new Promise(c => {
                    const proc = (0, child_process_1.execFile)(wslExecutable, ['-e', 'wslpath', original], {}, (error, stdout, stderr) => {
                        c(error ? original : (0, terminalEnvironment_1.escapeNonWindowsPath)(stdout.trim()));
                    });
                    proc.stdin.end();
                });
            }
            if (direction === 'unix-to-win') {
                // The backend is Windows, for example a local Windows workspace with a wsl session in
                // the terminal.
                if (platform_1.isWindows) {
                    if ((0, terminalEnvironment_2.getWindowsBuildNumber)() < 17063) {
                        return original;
                    }
                    const wslExecutable = this._getWSLExecutablePath();
                    if (!wslExecutable) {
                        return original;
                    }
                    return new Promise(c => {
                        const proc = (0, child_process_1.execFile)(wslExecutable, ['-e', 'wslpath', '-w', original], {}, (error, stdout, stderr) => {
                            c(error ? original : stdout.trim());
                        });
                        proc.stdin.end();
                    });
                }
            }
            // Fallback just in case
            return original;
        }
        _getWSLExecutablePath() {
            const useWSLexe = (0, terminalEnvironment_2.getWindowsBuildNumber)() >= 16299;
            const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            const systemRoot = process.env['SystemRoot'];
            if (systemRoot) {
                return (0, path_1.join)(systemRoot, is32ProcessOn64Windows ? 'Sysnative' : 'System32', useWSLexe ? 'wsl.exe' : 'bash.exe');
            }
            return undefined;
        }
        async getRevivedPtyNewId(workspaceId, id) {
            try {
                return this._revivedPtyIdMap.get(this._getRevivingProcessId(workspaceId, id))?.newId;
            }
            catch (e) {
                this._logService.warn(`Couldn't find terminal ID ${workspaceId}-${id}`, e.message);
            }
            return undefined;
        }
        async setTerminalLayoutInfo(args) {
            this._workspaceLayoutInfos.set(args.workspaceId, args);
        }
        async getTerminalLayoutInfo(args) {
            performance.mark('code/willGetTerminalLayoutInfo');
            const layout = this._workspaceLayoutInfos.get(args.workspaceId);
            if (layout) {
                const doneSet = new Set();
                const expandedTabs = await Promise.all(layout.tabs.map(async (tab) => this._expandTerminalTab(args.workspaceId, tab, doneSet)));
                const tabs = expandedTabs.filter(t => t.terminals.length > 0);
                performance.mark('code/didGetTerminalLayoutInfo');
                return { tabs };
            }
            performance.mark('code/didGetTerminalLayoutInfo');
            return undefined;
        }
        async _expandTerminalTab(workspaceId, tab, doneSet) {
            const expandedTerminals = (await Promise.all(tab.terminals.map(t => this._expandTerminalInstance(workspaceId, t, doneSet))));
            const filtered = expandedTerminals.filter(term => term.terminal !== null);
            return {
                isActive: tab.isActive,
                activePersistentProcessId: tab.activePersistentProcessId,
                terminals: filtered
            };
        }
        async _expandTerminalInstance(workspaceId, t, doneSet) {
            try {
                const oldId = this._getRevivingProcessId(workspaceId, t.terminal);
                const revivedPtyId = this._revivedPtyIdMap.get(oldId)?.newId;
                this._logService.info(`Expanding terminal instance, old id ${oldId} -> new id ${revivedPtyId}`);
                this._revivedPtyIdMap.delete(oldId);
                const persistentProcessId = revivedPtyId ?? t.terminal;
                if (doneSet.has(persistentProcessId)) {
                    throw new Error(`Terminal ${persistentProcessId} has already been expanded`);
                }
                doneSet.add(persistentProcessId);
                const persistentProcess = this._throwIfNoPty(persistentProcessId);
                const processDetails = persistentProcess && await this._buildProcessDetails(t.terminal, persistentProcess, revivedPtyId !== undefined);
                return {
                    terminal: { ...processDetails, id: persistentProcessId },
                    relativeSize: t.relativeSize
                };
            }
            catch (e) {
                this._logService.warn(`Couldn't get layout info, a terminal was probably disconnected`, e.message);
                this._logService.debug('Reattach to wrong terminal debug info - layout info by id', t);
                this._logService.debug('Reattach to wrong terminal debug info - _revivePtyIdMap', Array.from(this._revivedPtyIdMap.values()));
                this._logService.debug('Reattach to wrong terminal debug info - _ptys ids', Array.from(this._ptys.keys()));
                // this will be filtered out and not reconnected
                return {
                    terminal: null,
                    relativeSize: t.relativeSize
                };
            }
        }
        _getRevivingProcessId(workspaceId, ptyId) {
            return `${workspaceId}-${ptyId}`;
        }
        async _buildProcessDetails(id, persistentProcess, wasRevived = false) {
            performance.mark(`code/willBuildProcessDetails/${id}`);
            // If the process was just revived, don't do the orphan check as it will
            // take some time
            const [cwd, isOrphan] = await Promise.all([persistentProcess.getCwd(), wasRevived ? true : persistentProcess.isOrphaned()]);
            const result = {
                id,
                title: persistentProcess.title,
                titleSource: persistentProcess.titleSource,
                pid: persistentProcess.pid,
                workspaceId: persistentProcess.workspaceId,
                workspaceName: persistentProcess.workspaceName,
                cwd,
                isOrphan,
                icon: persistentProcess.icon,
                color: persistentProcess.color,
                fixedDimensions: persistentProcess.fixedDimensions,
                environmentVariableCollections: persistentProcess.processLaunchOptions.options.environmentVariableCollections,
                reconnectionProperties: persistentProcess.shellLaunchConfig.reconnectionProperties,
                waitOnExit: persistentProcess.shellLaunchConfig.waitOnExit,
                hideFromUser: persistentProcess.shellLaunchConfig.hideFromUser,
                isFeatureTerminal: persistentProcess.shellLaunchConfig.isFeatureTerminal,
                type: persistentProcess.shellLaunchConfig.type,
                hasChildProcesses: persistentProcess.hasChildProcesses,
                shellIntegrationNonce: persistentProcess.processLaunchOptions.options.shellIntegration.nonce
            };
            performance.mark(`code/didBuildProcessDetails/${id}`);
            return result;
        }
        _throwIfNoPty(id) {
            const pty = this._ptys.get(id);
            if (!pty) {
                throw new errors_1.ErrorNoTelemetry(`Could not find pty on pty host`);
            }
            return pty;
        }
    }
    exports.PtyService = PtyService;
    __decorate([
        decorators_1.memoize
    ], PtyService.prototype, "traceRpcArgs", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "refreshIgnoreProcessNames", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "requestDetachInstance", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "acceptDetachInstanceReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "freePortKillProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "serializeTerminalState", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "reviveTerminalProcesses", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "shutdownAll", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "createProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "attachToProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "updateTitle", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "updateIcon", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "clearBuffer", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "refreshProperty", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "updateProperty", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "detachFromProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "reduceConnectionGraceTime", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "listProcesses", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getPerformanceMarks", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "start", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "shutdown", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "input", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "processBinary", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "resize", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getInitialCwd", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getCwd", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "acknowledgeDataEvent", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "setUnicodeVersion", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getLatency", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "orphanQuestionReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "installAutoReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "uninstallAllAutoReplies", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "uninstallAutoReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getDefaultSystemShell", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getEnvironment", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getWslPath", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getRevivedPtyNewId", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "setTerminalLayoutInfo", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getTerminalLayoutInfo", null);
    var InteractionState;
    (function (InteractionState) {
        /** The terminal has not been interacted with. */
        InteractionState["None"] = "None";
        /** The terminal has only been interacted with by the replay mechanism. */
        InteractionState["ReplayOnly"] = "ReplayOnly";
        /** The terminal has been directly interacted with this session. */
        InteractionState["Session"] = "Session";
    })(InteractionState || (InteractionState = {}));
    class PersistentTerminalProcess extends lifecycle_1.Disposable {
        get pid() { return this._pid; }
        get shellLaunchConfig() { return this._terminalProcess.shellLaunchConfig; }
        get hasWrittenData() { return this._interactionState.value !== "None" /* InteractionState.None */; }
        get title() { return this._title || this._terminalProcess.currentTitle; }
        get titleSource() { return this._titleSource; }
        get icon() { return this._icon; }
        get color() { return this._color; }
        get fixedDimensions() { return this._fixedDimensions; }
        get hasChildProcesses() { return this._terminalProcess.hasChildProcesses; }
        setTitle(title, titleSource) {
            if (titleSource === terminal_1.TitleEventSource.Api) {
                this._interactionState.setValue("Session" /* InteractionState.Session */, 'setTitle');
                this._serializer.freeRawReviveBuffer();
            }
            this._title = title;
            this._titleSource = titleSource;
        }
        setIcon(userInitiated, icon, color) {
            if (!this._icon || 'id' in icon && 'id' in this._icon && icon.id !== this._icon.id ||
                !this.color || color !== this._color) {
                this._serializer.freeRawReviveBuffer();
                if (userInitiated) {
                    this._interactionState.setValue("Session" /* InteractionState.Session */, 'setIcon');
                }
            }
            this._icon = icon;
            this._color = color;
        }
        _setFixedDimensions(fixedDimensions) {
            this._fixedDimensions = fixedDimensions;
        }
        constructor(_persistentProcessId, _terminalProcess, workspaceId, workspaceName, shouldPersistTerminal, cols, rows, processLaunchOptions, unicodeVersion, reconnectConstants, _logService, reviveBuffer, rawReviveBuffer, _icon, _color, name, fixedDimensions) {
            super();
            this._persistentProcessId = _persistentProcessId;
            this._terminalProcess = _terminalProcess;
            this.workspaceId = workspaceId;
            this.workspaceName = workspaceName;
            this.shouldPersistTerminal = shouldPersistTerminal;
            this.processLaunchOptions = processLaunchOptions;
            this.unicodeVersion = unicodeVersion;
            this._logService = _logService;
            this._icon = _icon;
            this._color = _color;
            this._autoReplies = new Map();
            this._pendingCommands = new Map();
            this._isStarted = false;
            this._orphanRequestQueue = new async_1.Queue();
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onPersistentProcessReady = this._register(new event_1.Emitter());
            /** Fired when the persistent process has a ready process and has finished its replay. */
            this.onPersistentProcessReady = this._onPersistentProcessReady.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._inReplay = false;
            this._pid = -1;
            this._cwd = '';
            this._titleSource = terminal_1.TitleEventSource.Process;
            this._interactionState = new MutationLogger(`Persistent process "${this._persistentProcessId}" interaction state`, "None" /* InteractionState.None */, this._logService);
            this._wasRevived = reviveBuffer !== undefined;
            this._serializer = new XtermSerializer(cols, rows, reconnectConstants.scrollback, unicodeVersion, reviveBuffer, processLaunchOptions.options.shellIntegration.nonce, shouldPersistTerminal ? rawReviveBuffer : undefined, this._logService);
            if (name) {
                this.setTitle(name, terminal_1.TitleEventSource.Api);
            }
            this._fixedDimensions = fixedDimensions;
            this._orphanQuestionBarrier = null;
            this._orphanQuestionReplyTime = 0;
            this._disconnectRunner1 = this._register(new async_1.ProcessTimeRunOnceScheduler(() => {
                this._logService.info(`Persistent process "${this._persistentProcessId}": The reconnection grace time of ${printTime(reconnectConstants.graceTime)} has expired, shutting down pid "${this._pid}"`);
                this.shutdown(true);
            }, reconnectConstants.graceTime));
            this._disconnectRunner2 = this._register(new async_1.ProcessTimeRunOnceScheduler(() => {
                this._logService.info(`Persistent process "${this._persistentProcessId}": The short reconnection grace time of ${printTime(reconnectConstants.shortGraceTime)} has expired, shutting down pid ${this._pid}`);
                this.shutdown(true);
            }, reconnectConstants.shortGraceTime));
            this._register(this._terminalProcess.onProcessExit(() => this._bufferer.stopBuffering(this._persistentProcessId)));
            this._register(this._terminalProcess.onProcessReady(e => {
                this._pid = e.pid;
                this._cwd = e.cwd;
                this._onProcessReady.fire(e);
            }));
            this._register(this._terminalProcess.onDidChangeProperty(e => {
                this._onDidChangeProperty.fire(e);
            }));
            // Data buffering to reduce the amount of messages going to the renderer
            this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer((_, data) => this._onProcessData.fire(data));
            this._register(this._bufferer.startBuffering(this._persistentProcessId, this._terminalProcess.onProcessData));
            // Data recording for reconnect
            this._register(this.onProcessData(e => this._serializer.handleData(e)));
            // Clean up other disposables
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const e of this._autoReplies.values()) {
                    e.dispose();
                }
                this._autoReplies.clear();
            }));
        }
        async attach() {
            if (!this._disconnectRunner1.isScheduled() && !this._disconnectRunner2.isScheduled()) {
                this._logService.warn(`Persistent process "${this._persistentProcessId}": Process had no disconnect runners but was an orphan`);
            }
            this._disconnectRunner1.cancel();
            this._disconnectRunner2.cancel();
        }
        async detach(forcePersist) {
            // Keep the process around if it was indicated to persist and it has had some iteraction or
            // was replayed
            if (this.shouldPersistTerminal && (this._interactionState.value !== "None" /* InteractionState.None */ || forcePersist)) {
                this._disconnectRunner1.schedule();
            }
            else {
                this.shutdown(true);
            }
        }
        serializeNormalBuffer() {
            return this._serializer.generateReplayEvent(true, this._interactionState.value !== "Session" /* InteractionState.Session */);
        }
        async refreshProperty(type) {
            return this._terminalProcess.refreshProperty(type);
        }
        async updateProperty(type, value) {
            if (type === "fixedDimensions" /* ProcessPropertyType.FixedDimensions */) {
                return this._setFixedDimensions(value);
            }
        }
        async start() {
            if (!this._isStarted) {
                const result = await this._terminalProcess.start();
                if (result && 'message' in result) {
                    // it's a terminal launch error
                    return result;
                }
                this._isStarted = true;
                // If the process was revived, trigger a replay on first start. An alternative approach
                // could be to start it on the pty host before attaching but this fails on Windows as
                // conpty's inherit cursor option which is required, ends up sending DSR CPR which
                // causes conhost to hang when no response is received from the terminal (which wouldn't
                // be attached yet). https://github.com/microsoft/terminal/issues/11213
                if (this._wasRevived) {
                    this.triggerReplay();
                }
                else {
                    this._onPersistentProcessReady.fire();
                }
                return result;
            }
            this._onProcessReady.fire({ pid: this._pid, cwd: this._cwd, windowsPty: this._terminalProcess.getWindowsPty() });
            this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: this._terminalProcess.currentTitle });
            this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: this._terminalProcess.shellType });
            this.triggerReplay();
            return undefined;
        }
        shutdown(immediate) {
            return this._terminalProcess.shutdown(immediate);
        }
        input(data) {
            this._interactionState.setValue("Session" /* InteractionState.Session */, 'input');
            this._serializer.freeRawReviveBuffer();
            if (this._inReplay) {
                return;
            }
            for (const listener of this._autoReplies.values()) {
                listener.handleInput();
            }
            return this._terminalProcess.input(data);
        }
        writeBinary(data) {
            return this._terminalProcess.processBinary(data);
        }
        resize(cols, rows) {
            if (this._inReplay) {
                return;
            }
            this._serializer.handleResize(cols, rows);
            // Buffered events should flush when a resize occurs
            this._bufferer.flushBuffer(this._persistentProcessId);
            for (const listener of this._autoReplies.values()) {
                listener.handleResize();
            }
            return this._terminalProcess.resize(cols, rows);
        }
        async clearBuffer() {
            this._serializer.clearBuffer();
            this._terminalProcess.clearBuffer();
        }
        setUnicodeVersion(version) {
            this.unicodeVersion = version;
            this._serializer.setUnicodeVersion?.(version);
            // TODO: Pass in unicode version in ctor
        }
        acknowledgeDataEvent(charCount) {
            if (this._inReplay) {
                return;
            }
            return this._terminalProcess.acknowledgeDataEvent(charCount);
        }
        getInitialCwd() {
            return this._terminalProcess.getInitialCwd();
        }
        getCwd() {
            return this._terminalProcess.getCwd();
        }
        async triggerReplay() {
            if (this._interactionState.value === "None" /* InteractionState.None */) {
                this._interactionState.setValue("ReplayOnly" /* InteractionState.ReplayOnly */, 'triggerReplay');
            }
            const ev = await this._serializer.generateReplayEvent();
            let dataLength = 0;
            for (const e of ev.events) {
                dataLength += e.data.length;
            }
            this._logService.info(`Persistent process "${this._persistentProcessId}": Replaying ${dataLength} chars and ${ev.events.length} size events`);
            this._onProcessReplay.fire(ev);
            this._terminalProcess.clearUnacknowledgedChars();
            this._onPersistentProcessReady.fire();
        }
        installAutoReply(match, reply) {
            this._autoReplies.get(match)?.dispose();
            this._autoReplies.set(match, new terminalAutoResponder_1.TerminalAutoResponder(this._terminalProcess, match, reply, this._logService));
        }
        uninstallAutoReply(match) {
            const autoReply = this._autoReplies.get(match);
            autoReply?.dispose();
            this._autoReplies.delete(match);
        }
        sendCommandResult(reqId, isError, serializedPayload) {
            const data = this._pendingCommands.get(reqId);
            if (!data) {
                return;
            }
            this._pendingCommands.delete(reqId);
        }
        orphanQuestionReply() {
            this._orphanQuestionReplyTime = Date.now();
            if (this._orphanQuestionBarrier) {
                const barrier = this._orphanQuestionBarrier;
                this._orphanQuestionBarrier = null;
                barrier.open();
            }
        }
        reduceGraceTime() {
            if (this._disconnectRunner2.isScheduled()) {
                // we are disconnected and already running the short reconnection timer
                return;
            }
            if (this._disconnectRunner1.isScheduled()) {
                // we are disconnected and running the long reconnection timer
                this._disconnectRunner2.schedule();
            }
        }
        async isOrphaned() {
            return await this._orphanRequestQueue.queue(async () => this._isOrphaned());
        }
        async _isOrphaned() {
            // The process is already known to be orphaned
            if (this._disconnectRunner1.isScheduled() || this._disconnectRunner2.isScheduled()) {
                return true;
            }
            // Ask whether the renderer(s) whether the process is orphaned and await the reply
            if (!this._orphanQuestionBarrier) {
                // the barrier opens after 4 seconds with or without a reply
                this._orphanQuestionBarrier = new async_1.AutoOpenBarrier(4000);
                this._orphanQuestionReplyTime = 0;
                this._onProcessOrphanQuestion.fire();
            }
            await this._orphanQuestionBarrier.wait();
            return (Date.now() - this._orphanQuestionReplyTime > 500);
        }
    }
    class MutationLogger {
        get value() { return this._value; }
        setValue(value, reason) {
            if (this._value !== value) {
                this._value = value;
                this._log(reason);
            }
        }
        constructor(_name, _value, _logService) {
            this._name = _name;
            this._value = _value;
            this._logService = _logService;
            this._log('initialized');
        }
        _log(reason) {
            this._logService.debug(`MutationLogger "${this._name}" set to "${this._value}", reason: ${reason}`);
        }
    }
    class XtermSerializer {
        constructor(cols, rows, scrollback, unicodeVersion, reviveBufferWithRestoreMessage, shellIntegrationNonce, _rawReviveBuffer, logService) {
            this._rawReviveBuffer = _rawReviveBuffer;
            this._xterm = new headless_1.Terminal({
                cols,
                rows,
                scrollback,
                allowProposedApi: true
            });
            if (reviveBufferWithRestoreMessage) {
                this._xterm.writeln(reviveBufferWithRestoreMessage);
            }
            this.setUnicodeVersion(unicodeVersion);
            this._shellIntegrationAddon = new shellIntegrationAddon_1.ShellIntegrationAddon(shellIntegrationNonce, true, undefined, logService);
            this._xterm.loadAddon(this._shellIntegrationAddon);
        }
        freeRawReviveBuffer() {
            // Free the memory of the terminal if it will need to be re-serialized
            this._rawReviveBuffer = undefined;
        }
        handleData(data) {
            this._xterm.write(data);
        }
        handleResize(cols, rows) {
            this._xterm.resize(cols, rows);
        }
        clearBuffer() {
            this._xterm.clear();
        }
        async generateReplayEvent(normalBufferOnly, restoreToLastReviveBuffer) {
            const serialize = new (await this._getSerializeConstructor());
            this._xterm.loadAddon(serialize);
            const options = {
                scrollback: this._xterm.options.scrollback
            };
            if (normalBufferOnly) {
                options.excludeAltBuffer = true;
                options.excludeModes = true;
            }
            let serialized;
            if (restoreToLastReviveBuffer && this._rawReviveBuffer) {
                serialized = this._rawReviveBuffer;
            }
            else {
                serialized = serialize.serialize(options);
            }
            return {
                events: [
                    {
                        cols: this._xterm.cols,
                        rows: this._xterm.rows,
                        data: serialized
                    }
                ],
                commands: this._shellIntegrationAddon.serialize()
            };
        }
        async setUnicodeVersion(version) {
            if (this._xterm.unicode.activeVersion === version) {
                return;
            }
            if (version === '11') {
                this._unicodeAddon = new (await this._getUnicode11Constructor());
                this._xterm.loadAddon(this._unicodeAddon);
            }
            else {
                this._unicodeAddon?.dispose();
                this._unicodeAddon = undefined;
            }
            this._xterm.unicode.activeVersion = version;
        }
        async _getUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await new Promise((resolve_1, reject_1) => { require(['@xterm/addon-unicode11'], resolve_1, reject_1); })).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async _getSerializeConstructor() {
            if (!SerializeAddon) {
                SerializeAddon = (await new Promise((resolve_2, reject_2) => { require(['@xterm/addon-serialize'], resolve_2, reject_2); })).SerializeAddon;
            }
            return SerializeAddon;
        }
    }
    function printTime(ms) {
        let h = 0;
        let m = 0;
        let s = 0;
        if (ms >= 1000) {
            s = Math.floor(ms / 1000);
            ms -= s * 1000;
        }
        if (s >= 60) {
            m = Math.floor(s / 60);
            s -= m * 60;
        }
        if (m >= 60) {
            h = Math.floor(m / 60);
            m -= h * 60;
        }
        const _h = h ? `${h}h` : ``;
        const _m = m ? `${m}m` : ``;
        const _s = s ? `${s}s` : ``;
        const _ms = ms ? `${ms}ms` : ``;
        return `${_h}${_m}${_s}${_ms}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL25vZGUvcHR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFnQ2hHLDRCQXlCQztJQXpCRCxTQUFnQixRQUFRLENBQUMsT0FBWSxFQUFFLEdBQVcsRUFBRSxVQUFlO1FBQ2xFLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQztRQUN0QixNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQzVCLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLFdBQVcsR0FBRyxJQUFXO1lBQ2pELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssY0FBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNILENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDbkQsQ0FB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QztZQUN2QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUNiLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN2QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFDRCxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM1QixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM1QixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM1QixNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNoQyxPQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDaEMsQ0FBQyJ9