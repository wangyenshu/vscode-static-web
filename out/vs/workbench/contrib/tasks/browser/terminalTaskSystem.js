/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/severity", "vs/base/common/types", "vs/nls", "vs/platform/markers/common/markers", "vs/workbench/contrib/markers/common/markers", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/base/common/codicons", "vs/base/common/network", "vs/base/common/themables", "vs/base/common/uri", "vs/platform/terminal/common/terminalStrings", "vs/workbench/contrib/tasks/browser/taskTerminalStatus", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/workbench/contrib/tasks/common/taskConfiguration", "vs/workbench/contrib/tasks/common/taskSystem", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/terminal/browser/terminalEscapeSequences", "vs/workbench/contrib/terminal/browser/terminalProcessExtHostProxy", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, arrays_1, Async, event_1, extpath_1, lifecycle_1, map_1, Objects, path, Platform, resources, severity_1, Types, nls, markers_1, markers_2, problemMatcher_1, codicons_1, network_1, themables_1, uri_1, terminalStrings_1, taskTerminalStatus_1, problemCollectors_1, taskConfiguration_1, taskSystem_1, tasks_1, terminalEscapeSequences_1, terminalProcessExtHostProxy_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTaskSystem = void 0;
    const ReconnectionType = 'Task';
    class VariableResolver {
        static { this._regex = /\$\{(.*?)\}/g; }
        constructor(workspaceFolder, taskSystemInfo, values, _service) {
            this.workspaceFolder = workspaceFolder;
            this.taskSystemInfo = taskSystemInfo;
            this.values = values;
            this._service = _service;
        }
        async resolve(value) {
            const replacers = [];
            value.replace(VariableResolver._regex, (match, ...args) => {
                replacers.push(this._replacer(match, args));
                return match;
            });
            const resolvedReplacers = await Promise.all(replacers);
            return value.replace(VariableResolver._regex, () => resolvedReplacers.shift());
        }
        async _replacer(match, args) {
            // Strip out the ${} because the map contains them variables without those characters.
            const result = this.values.get(match.substring(2, match.length - 1));
            if ((result !== undefined) && (result !== null)) {
                return result;
            }
            if (this._service) {
                return this._service.resolveAsync(this.workspaceFolder, match);
            }
            return match;
        }
    }
    class VerifiedTask {
        constructor(task, resolver, trigger) {
            this.task = task;
            this.resolver = resolver;
            this.trigger = trigger;
        }
        verify() {
            let verified = false;
            if (this.trigger && this.resolvedVariables && this.workspaceFolder && (this.shellLaunchConfig !== undefined)) {
                verified = true;
            }
            return verified;
        }
        getVerifiedTask() {
            if (this.verify()) {
                return { task: this.task, resolver: this.resolver, trigger: this.trigger, resolvedVariables: this.resolvedVariables, systemInfo: this.systemInfo, workspaceFolder: this.workspaceFolder, shellLaunchConfig: this.shellLaunchConfig };
            }
            else {
                throw new Error('VerifiedTask was not checked. verify must be checked before getVerifiedTask.');
            }
        }
    }
    class TerminalTaskSystem extends lifecycle_1.Disposable {
        static { this.TelemetryEventName = 'taskService'; }
        static { this.ProcessVarName = '__process__'; }
        static { this._shellQuotes = {
            'cmd': {
                strong: '"'
            },
            'powershell': {
                escape: {
                    escapeChar: '`',
                    charsToEscape: ' "\'()'
                },
                strong: '\'',
                weak: '"'
            },
            'bash': {
                escape: {
                    escapeChar: '\\',
                    charsToEscape: ' "\''
                },
                strong: '\'',
                weak: '"'
            },
            'zsh': {
                escape: {
                    escapeChar: '\\',
                    charsToEscape: ' "\''
                },
                strong: '\'',
                weak: '"'
            }
        }; }
        static { this._osShellQuotes = {
            'Linux': TerminalTaskSystem._shellQuotes['bash'],
            'Mac': TerminalTaskSystem._shellQuotes['bash'],
            'Windows': TerminalTaskSystem._shellQuotes['powershell']
        }; }
        taskShellIntegrationStartSequence(cwd) {
            return ((0, terminalEscapeSequences_1.VSCodeSequence)("A" /* VSCodeOscPt.PromptStart */) +
                (0, terminalEscapeSequences_1.VSCodeSequence)("P" /* VSCodeOscPt.Property */, `${"Task" /* VSCodeOscProperty.Task */}=True`) +
                (cwd
                    ? (0, terminalEscapeSequences_1.VSCodeSequence)("P" /* VSCodeOscPt.Property */, `${"Cwd" /* VSCodeOscProperty.Cwd */}=${typeof cwd === 'string' ? cwd : cwd.fsPath}`)
                    : '') +
                (0, terminalEscapeSequences_1.VSCodeSequence)("B" /* VSCodeOscPt.CommandStart */));
        }
        get taskShellIntegrationOutputSequence() {
            return (0, terminalEscapeSequences_1.VSCodeSequence)("C" /* VSCodeOscPt.CommandExecuted */);
        }
        constructor(_terminalService, _terminalGroupService, _outputService, _paneCompositeService, _viewsService, _markerService, _modelService, _configurationResolverService, _contextService, _environmentService, _outputChannelId, _fileService, _terminalProfileResolverService, _pathService, _viewDescriptorService, _logService, _notificationService, instantiationService, taskSystemInfoResolver) {
            super();
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._outputService = _outputService;
            this._paneCompositeService = _paneCompositeService;
            this._viewsService = _viewsService;
            this._markerService = _markerService;
            this._modelService = _modelService;
            this._configurationResolverService = _configurationResolverService;
            this._contextService = _contextService;
            this._environmentService = _environmentService;
            this._outputChannelId = _outputChannelId;
            this._fileService = _fileService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._pathService = _pathService;
            this._viewDescriptorService = _viewDescriptorService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._isRerun = false;
            this._terminalCreationQueue = Promise.resolve();
            this._hasReconnected = false;
            this._activeTasks = Object.create(null);
            this._busyTasks = Object.create(null);
            this._terminals = Object.create(null);
            this._idleTaskTerminals = new map_1.LinkedMap();
            this._sameTaskTerminals = Object.create(null);
            this._onDidStateChange = new event_1.Emitter();
            this._taskSystemInfoResolver = taskSystemInfoResolver;
            this._register(this._terminalStatusManager = instantiationService.createInstance(taskTerminalStatus_1.TaskTerminalStatus));
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        _log(value) {
            this._appendOutput(value + '\n');
        }
        _showOutput() {
            this._outputService.showChannel(this._outputChannelId, true);
        }
        reconnect(task, resolver) {
            this._reconnectToTerminals();
            return this.run(task, resolver, taskSystem_1.Triggers.reconnect);
        }
        run(task, resolver, trigger = taskSystem_1.Triggers.command) {
            task = task.clone(); // A small amount of task state is stored in the task (instance) and tasks passed in to run may have that set already.
            const instances = tasks_1.InMemoryTask.is(task) || this._isTaskEmpty(task) ? [] : this._getInstances(task);
            const validInstance = instances.length < ((task.runOptions && task.runOptions.instanceLimit) ?? 1);
            const instance = instances[0]?.count?.count ?? 0;
            this._currentTask = new VerifiedTask(task, resolver, trigger);
            if (instance > 0) {
                task.instance = instance;
            }
            if (!validInstance) {
                const terminalData = instances[instances.length - 1];
                this._lastTask = this._currentTask;
                return { kind: 2 /* TaskExecuteKind.Active */, task: terminalData.task, active: { same: true, background: task.configurationProperties.isBackground }, promise: terminalData.promise };
            }
            try {
                const executeResult = { kind: 1 /* TaskExecuteKind.Started */, task, started: {}, promise: this._executeTask(task, resolver, trigger, new Set(), new Map(), undefined) };
                executeResult.promise.then(summary => {
                    this._lastTask = this._currentTask;
                });
                return executeResult;
            }
            catch (error) {
                if (error instanceof taskSystem_1.TaskError) {
                    throw error;
                }
                else if (error instanceof Error) {
                    this._log(error.message);
                    throw new taskSystem_1.TaskError(severity_1.default.Error, error.message, 7 /* TaskErrors.UnknownError */);
                }
                else {
                    this._log(error.toString());
                    throw new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TerminalTaskSystem.unknownError', 'A unknown error has occurred while executing a task. See task output log for details.'), 7 /* TaskErrors.UnknownError */);
                }
            }
        }
        rerun() {
            if (this._lastTask && this._lastTask.verify()) {
                if ((this._lastTask.task.runOptions.reevaluateOnRerun !== undefined) && !this._lastTask.task.runOptions.reevaluateOnRerun) {
                    this._isRerun = true;
                }
                const result = this.run(this._lastTask.task, this._lastTask.resolver);
                result.promise.then(summary => {
                    this._isRerun = false;
                });
                return result;
            }
            else {
                return undefined;
            }
        }
        _showTaskLoadErrors(task) {
            if (task.taskLoadMessages && task.taskLoadMessages.length > 0) {
                task.taskLoadMessages.forEach(loadMessage => {
                    this._log(loadMessage + '\n');
                });
                const openOutput = 'Show Output';
                this._notificationService.prompt(severity_1.default.Warning, nls.localize('TerminalTaskSystem.taskLoadReporting', "There are issues with task \"{0}\". See the output for more details.", task._label), [{
                        label: openOutput,
                        run: () => this._showOutput()
                    }]);
            }
        }
        isTaskVisible(task) {
            const terminalData = this._activeTasks[task.getMapKey()];
            if (!terminalData?.terminal) {
                return false;
            }
            const activeTerminalInstance = this._terminalService.activeInstance;
            const isPanelShowingTerminal = !!this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID);
            return isPanelShowingTerminal && (activeTerminalInstance?.instanceId === terminalData.terminal.instanceId);
        }
        revealTask(task) {
            const terminalData = this._activeTasks[task.getMapKey()];
            if (!terminalData?.terminal) {
                return false;
            }
            const isTerminalInPanel = this._viewDescriptorService.getViewLocationById(terminal_1.TERMINAL_VIEW_ID) === 1 /* ViewContainerLocation.Panel */;
            if (isTerminalInPanel && this.isTaskVisible(task)) {
                if (this._previousPanelId) {
                    if (this._previousTerminalInstance) {
                        this._terminalService.setActiveInstance(this._previousTerminalInstance);
                    }
                    this._paneCompositeService.openPaneComposite(this._previousPanelId, 1 /* ViewContainerLocation.Panel */);
                }
                else {
                    this._paneCompositeService.hideActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                }
                this._previousPanelId = undefined;
                this._previousTerminalInstance = undefined;
            }
            else {
                if (isTerminalInPanel) {
                    this._previousPanelId = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)?.getId();
                    if (this._previousPanelId === terminal_1.TERMINAL_VIEW_ID) {
                        this._previousTerminalInstance = this._terminalService.activeInstance ?? undefined;
                    }
                }
                this._terminalService.setActiveInstance(terminalData.terminal);
                if (tasks_1.CustomTask.is(task) || tasks_1.ContributedTask.is(task)) {
                    this._terminalGroupService.showPanel(task.command.presentation.focus);
                }
            }
            return true;
        }
        isActive() {
            return Promise.resolve(this.isActiveSync());
        }
        isActiveSync() {
            return Object.values(this._activeTasks).some(value => !!value.terminal);
        }
        canAutoTerminate() {
            return Object.values(this._activeTasks).every(value => !value.task.configurationProperties.promptOnClose);
        }
        getActiveTasks() {
            return Object.values(this._activeTasks).flatMap(value => value.terminal ? value.task : []);
        }
        getLastInstance(task) {
            const recentKey = task.getKey();
            return Object.values(this._activeTasks).reverse().find((value) => recentKey && recentKey === value.task.getKey())?.task;
        }
        getBusyTasks() {
            return Object.keys(this._busyTasks).map(key => this._busyTasks[key]);
        }
        customExecutionComplete(task, result) {
            const activeTerminal = this._activeTasks[task.getMapKey()];
            if (!activeTerminal?.terminal) {
                return Promise.reject(new Error('Expected to have a terminal for a custom execution task'));
            }
            return new Promise((resolve) => {
                // activeTerminal.terminal.rendererExit(result);
                resolve();
            });
        }
        _getInstances(task) {
            const recentKey = task.getKey();
            return Object.values(this._activeTasks).filter((value) => recentKey && recentKey === value.task.getKey());
        }
        _removeFromActiveTasks(task) {
            const key = typeof task === 'string' ? task : task.getMapKey();
            const taskToRemove = this._activeTasks[key];
            if (!taskToRemove) {
                return;
            }
            delete this._activeTasks[key];
        }
        _fireTaskEvent(event) {
            if (event.kind !== "changed" /* TaskEventKind.Changed */) {
                const activeTask = this._activeTasks[event.__task.getMapKey()];
                if (activeTask) {
                    activeTask.state = event.kind;
                }
            }
            this._onDidStateChange.fire(event);
        }
        terminate(task) {
            const activeTerminal = this._activeTasks[task.getMapKey()];
            const terminal = activeTerminal.terminal;
            if (!terminal) {
                return Promise.resolve({ success: false, task: undefined });
            }
            return new Promise((resolve, reject) => {
                terminal.onDisposed(terminal => {
                    this._fireTaskEvent(tasks_1.TaskEvent.terminated(task, terminal.instanceId, terminal.exitReason));
                });
                const onExit = terminal.onExit(() => {
                    const task = activeTerminal.task;
                    try {
                        onExit.dispose();
                        this._fireTaskEvent(tasks_1.TaskEvent.terminated(task, terminal.instanceId, terminal.exitReason));
                    }
                    catch (error) {
                        // Do nothing.
                    }
                    resolve({ success: true, task: task });
                });
                terminal.dispose();
            });
        }
        terminateAll() {
            const promises = [];
            for (const [key, terminalData] of Object.entries(this._activeTasks)) {
                const terminal = terminalData.terminal;
                if (terminal) {
                    promises.push(new Promise((resolve, reject) => {
                        const onExit = terminal.onExit(() => {
                            const task = terminalData.task;
                            try {
                                onExit.dispose();
                                this._fireTaskEvent(tasks_1.TaskEvent.terminated(task, terminal.instanceId, terminal.exitReason));
                            }
                            catch (error) {
                                // Do nothing.
                            }
                            if (this._activeTasks[key] === terminalData) {
                                delete this._activeTasks[key];
                            }
                            resolve({ success: true, task: terminalData.task });
                        });
                    }));
                    terminal.dispose();
                }
            }
            return Promise.all(promises);
        }
        _showDependencyCycleMessage(task) {
            this._log(nls.localize('dependencyCycle', 'There is a dependency cycle. See task "{0}".', task._label));
            this._showOutput();
        }
        _executeTask(task, resolver, trigger, liveDependencies, encounteredTasks, alreadyResolved) {
            this._showTaskLoadErrors(task);
            const mapKey = task.getMapKey();
            // It's important that we add this task's entry to _activeTasks before
            // any of the code in the then runs (see #180541 and #180578). Wrapping
            // it in Promise.resolve().then() ensures that.
            const promise = Promise.resolve().then(async () => {
                alreadyResolved = alreadyResolved ?? new Map();
                const promises = [];
                if (task.configurationProperties.dependsOn) {
                    const nextLiveDependencies = new Set(liveDependencies).add(task.getCommonTaskId());
                    for (const dependency of task.configurationProperties.dependsOn) {
                        const dependencyTask = await resolver.resolve(dependency.uri, dependency.task);
                        if (dependencyTask) {
                            this._adoptConfigurationForDependencyTask(dependencyTask, task);
                            let taskResult;
                            const commonKey = dependencyTask.getCommonTaskId();
                            if (nextLiveDependencies.has(commonKey)) {
                                this._showDependencyCycleMessage(dependencyTask);
                                taskResult = Promise.resolve({});
                            }
                            else {
                                taskResult = encounteredTasks.get(commonKey);
                                if (!taskResult) {
                                    const activeTask = this._activeTasks[dependencyTask.getMapKey()] ?? this._getInstances(dependencyTask).pop();
                                    taskResult = activeTask && this._getDependencyPromise(activeTask);
                                }
                            }
                            if (!taskResult) {
                                this._fireTaskEvent(tasks_1.TaskEvent.general("dependsOnStarted" /* TaskEventKind.DependsOnStarted */, task));
                                taskResult = this._executeDependencyTask(dependencyTask, resolver, trigger, nextLiveDependencies, encounteredTasks, alreadyResolved);
                            }
                            encounteredTasks.set(commonKey, taskResult);
                            promises.push(taskResult);
                            if (task.configurationProperties.dependsOrder === "sequence" /* DependsOrder.sequence */) {
                                const promiseResult = await taskResult;
                                if (promiseResult.exitCode !== 0) {
                                    break;
                                }
                            }
                        }
                        else {
                            this._log(nls.localize('dependencyFailed', 'Couldn\'t resolve dependent task \'{0}\' in workspace folder \'{1}\'', Types.isString(dependency.task) ? dependency.task : JSON.stringify(dependency.task, undefined, 0), dependency.uri.toString()));
                            this._showOutput();
                        }
                    }
                }
                return Promise.all(promises).then((summaries) => {
                    for (const summary of summaries) {
                        if (summary.exitCode !== 0) {
                            return { exitCode: summary.exitCode };
                        }
                    }
                    if ((tasks_1.ContributedTask.is(task) || tasks_1.CustomTask.is(task)) && (task.command)) {
                        if (this._isRerun) {
                            return this._reexecuteCommand(task, trigger, alreadyResolved);
                        }
                        else {
                            return this._executeCommand(task, trigger, alreadyResolved);
                        }
                    }
                    return { exitCode: 0 };
                });
            }).finally(() => {
                if (this._activeTasks[mapKey] === activeTask) {
                    delete this._activeTasks[mapKey];
                }
            });
            const lastInstance = this._getInstances(task).pop();
            const count = lastInstance?.count ?? { count: 0 };
            count.count++;
            const activeTask = { task, promise, count };
            this._activeTasks[mapKey] = activeTask;
            return promise;
        }
        _createInactiveDependencyPromise(task) {
            return new Promise(resolve => {
                const taskInactiveDisposable = this.onDidStateChange(taskEvent => {
                    if ((taskEvent.kind === "inactive" /* TaskEventKind.Inactive */) && (taskEvent.__task === task)) {
                        taskInactiveDisposable.dispose();
                        resolve({ exitCode: 0 });
                    }
                });
            });
        }
        _adoptConfigurationForDependencyTask(dependencyTask, task) {
            if (dependencyTask.configurationProperties.icon) {
                dependencyTask.configurationProperties.icon.id ||= task.configurationProperties.icon?.id;
                dependencyTask.configurationProperties.icon.color ||= task.configurationProperties.icon?.color;
            }
            else {
                dependencyTask.configurationProperties.icon = task.configurationProperties.icon;
            }
        }
        async _getDependencyPromise(task) {
            if (!task.task.configurationProperties.isBackground) {
                return task.promise;
            }
            if (!task.task.configurationProperties.problemMatchers || task.task.configurationProperties.problemMatchers.length === 0) {
                return task.promise;
            }
            if (task.state === "inactive" /* TaskEventKind.Inactive */) {
                return { exitCode: 0 };
            }
            return this._createInactiveDependencyPromise(task.task);
        }
        async _executeDependencyTask(task, resolver, trigger, liveDependencies, encounteredTasks, alreadyResolved) {
            // If the task is a background task with a watching problem matcher, we don't wait for the whole task to finish,
            // just for the problem matcher to go inactive.
            if (!task.configurationProperties.isBackground) {
                return this._executeTask(task, resolver, trigger, liveDependencies, encounteredTasks, alreadyResolved);
            }
            const inactivePromise = this._createInactiveDependencyPromise(task);
            return Promise.race([inactivePromise, this._executeTask(task, resolver, trigger, liveDependencies, encounteredTasks, alreadyResolved)]);
        }
        async _resolveAndFindExecutable(systemInfo, workspaceFolder, task, cwd, envPath) {
            const command = await this._configurationResolverService.resolveAsync(workspaceFolder, tasks_1.CommandString.value(task.command.name));
            cwd = cwd ? await this._configurationResolverService.resolveAsync(workspaceFolder, cwd) : undefined;
            const paths = envPath ? await Promise.all(envPath.split(path.delimiter).map(p => this._configurationResolverService.resolveAsync(workspaceFolder, p))) : undefined;
            let foundExecutable = await systemInfo?.findExecutable(command, cwd, paths);
            if (!foundExecutable) {
                foundExecutable = path.join(cwd ?? '', command);
            }
            return foundExecutable;
        }
        _findUnresolvedVariables(variables, alreadyResolved) {
            if (alreadyResolved.size === 0) {
                return variables;
            }
            const unresolved = new Set();
            for (const variable of variables) {
                if (!alreadyResolved.has(variable.substring(2, variable.length - 1))) {
                    unresolved.add(variable);
                }
            }
            return unresolved;
        }
        _mergeMaps(mergeInto, mergeFrom) {
            for (const entry of mergeFrom) {
                if (!mergeInto.has(entry[0])) {
                    mergeInto.set(entry[0], entry[1]);
                }
            }
        }
        async _acquireInput(taskSystemInfo, workspaceFolder, task, variables, alreadyResolved) {
            const resolved = await this._resolveVariablesFromSet(taskSystemInfo, workspaceFolder, task, variables, alreadyResolved);
            this._fireTaskEvent(tasks_1.TaskEvent.general("acquiredInput" /* TaskEventKind.AcquiredInput */, task));
            return resolved;
        }
        _resolveVariablesFromSet(taskSystemInfo, workspaceFolder, task, variables, alreadyResolved) {
            const isProcess = task.command && task.command.runtime === tasks_1.RuntimeType.Process;
            const options = task.command && task.command.options ? task.command.options : undefined;
            const cwd = options ? options.cwd : undefined;
            let envPath = undefined;
            if (options && options.env) {
                for (const key of Object.keys(options.env)) {
                    if (key.toLowerCase() === 'path') {
                        if (Types.isString(options.env[key])) {
                            envPath = options.env[key];
                        }
                        break;
                    }
                }
            }
            const unresolved = this._findUnresolvedVariables(variables, alreadyResolved);
            let resolvedVariables;
            if (taskSystemInfo && workspaceFolder) {
                const resolveSet = {
                    variables: unresolved
                };
                if (taskSystemInfo.platform === 3 /* Platform.Platform.Windows */ && isProcess) {
                    resolveSet.process = { name: tasks_1.CommandString.value(task.command.name) };
                    if (cwd) {
                        resolveSet.process.cwd = cwd;
                    }
                    if (envPath) {
                        resolveSet.process.path = envPath;
                    }
                }
                resolvedVariables = taskSystemInfo.resolveVariables(workspaceFolder, resolveSet, tasks_1.TaskSourceKind.toConfigurationTarget(task._source.kind)).then(async (resolved) => {
                    if (!resolved) {
                        return undefined;
                    }
                    this._mergeMaps(alreadyResolved, resolved.variables);
                    resolved.variables = new Map(alreadyResolved);
                    if (isProcess) {
                        let process = tasks_1.CommandString.value(task.command.name);
                        if (taskSystemInfo.platform === 3 /* Platform.Platform.Windows */) {
                            process = await this._resolveAndFindExecutable(taskSystemInfo, workspaceFolder, task, cwd, envPath);
                        }
                        resolved.variables.set(TerminalTaskSystem.ProcessVarName, process);
                    }
                    return resolved;
                });
                return resolvedVariables;
            }
            else {
                const variablesArray = new Array();
                unresolved.forEach(variable => variablesArray.push(variable));
                return new Promise((resolve, reject) => {
                    this._configurationResolverService.resolveWithInteraction(workspaceFolder, variablesArray, 'tasks', undefined, tasks_1.TaskSourceKind.toConfigurationTarget(task._source.kind)).then(async (resolvedVariablesMap) => {
                        if (resolvedVariablesMap) {
                            this._mergeMaps(alreadyResolved, resolvedVariablesMap);
                            resolvedVariablesMap = new Map(alreadyResolved);
                            if (isProcess) {
                                let processVarValue;
                                if (Platform.isWindows) {
                                    processVarValue = await this._resolveAndFindExecutable(taskSystemInfo, workspaceFolder, task, cwd, envPath);
                                }
                                else {
                                    processVarValue = await this._configurationResolverService.resolveAsync(workspaceFolder, tasks_1.CommandString.value(task.command.name));
                                }
                                resolvedVariablesMap.set(TerminalTaskSystem.ProcessVarName, processVarValue);
                            }
                            const resolvedVariablesResult = {
                                variables: resolvedVariablesMap,
                            };
                            resolve(resolvedVariablesResult);
                        }
                        else {
                            resolve(undefined);
                        }
                    }, reason => {
                        reject(reason);
                    });
                });
            }
        }
        _executeCommand(task, trigger, alreadyResolved) {
            const taskWorkspaceFolder = task.getWorkspaceFolder();
            let workspaceFolder;
            if (taskWorkspaceFolder) {
                workspaceFolder = this._currentTask.workspaceFolder = taskWorkspaceFolder;
            }
            else {
                const folders = this._contextService.getWorkspace().folders;
                workspaceFolder = folders.length > 0 ? folders[0] : undefined;
            }
            const systemInfo = this._currentTask.systemInfo = this._taskSystemInfoResolver(workspaceFolder);
            const variables = new Set();
            this._collectTaskVariables(variables, task);
            const resolvedVariables = this._acquireInput(systemInfo, workspaceFolder, task, variables, alreadyResolved);
            return resolvedVariables.then((resolvedVariables) => {
                if (resolvedVariables && !this._isTaskEmpty(task)) {
                    this._currentTask.resolvedVariables = resolvedVariables;
                    return this._executeInTerminal(task, trigger, new VariableResolver(workspaceFolder, systemInfo, resolvedVariables.variables, this._configurationResolverService), workspaceFolder);
                }
                else {
                    // Allows the taskExecutions array to be updated in the extension host
                    this._fireTaskEvent(tasks_1.TaskEvent.general("end" /* TaskEventKind.End */, task));
                    return Promise.resolve({ exitCode: 0 });
                }
            }, reason => {
                return Promise.reject(reason);
            });
        }
        _isTaskEmpty(task) {
            const isCustomExecution = (task.command.runtime === tasks_1.RuntimeType.CustomExecution);
            return !((task.command !== undefined) && task.command.runtime && (isCustomExecution || (task.command.name !== undefined)));
        }
        _reexecuteCommand(task, trigger, alreadyResolved) {
            const lastTask = this._lastTask;
            if (!lastTask) {
                return Promise.reject(new Error('No task previously run'));
            }
            const workspaceFolder = this._currentTask.workspaceFolder = lastTask.workspaceFolder;
            const variables = new Set();
            this._collectTaskVariables(variables, task);
            // Check that the task hasn't changed to include new variables
            let hasAllVariables = true;
            variables.forEach(value => {
                if (value.substring(2, value.length - 1) in lastTask.getVerifiedTask().resolvedVariables) {
                    hasAllVariables = false;
                }
            });
            if (!hasAllVariables) {
                return this._acquireInput(lastTask.getVerifiedTask().systemInfo, lastTask.getVerifiedTask().workspaceFolder, task, variables, alreadyResolved).then((resolvedVariables) => {
                    if (!resolvedVariables) {
                        // Allows the taskExecutions array to be updated in the extension host
                        this._fireTaskEvent(tasks_1.TaskEvent.general("end" /* TaskEventKind.End */, task));
                        return { exitCode: 0 };
                    }
                    this._currentTask.resolvedVariables = resolvedVariables;
                    return this._executeInTerminal(task, trigger, new VariableResolver(lastTask.getVerifiedTask().workspaceFolder, lastTask.getVerifiedTask().systemInfo, resolvedVariables.variables, this._configurationResolverService), workspaceFolder);
                }, reason => {
                    return Promise.reject(reason);
                });
            }
            else {
                this._currentTask.resolvedVariables = lastTask.getVerifiedTask().resolvedVariables;
                return this._executeInTerminal(task, trigger, new VariableResolver(lastTask.getVerifiedTask().workspaceFolder, lastTask.getVerifiedTask().systemInfo, lastTask.getVerifiedTask().resolvedVariables.variables, this._configurationResolverService), workspaceFolder);
            }
        }
        async _executeInTerminal(task, trigger, resolver, workspaceFolder) {
            let terminal = undefined;
            let error = undefined;
            let promise = undefined;
            if (task.configurationProperties.isBackground) {
                const problemMatchers = await this._resolveMatchers(resolver, task.configurationProperties.problemMatchers);
                const watchingProblemMatcher = new problemCollectors_1.WatchingProblemCollector(problemMatchers, this._markerService, this._modelService, this._fileService);
                if ((problemMatchers.length > 0) && !watchingProblemMatcher.isWatching()) {
                    this._appendOutput(nls.localize('TerminalTaskSystem.nonWatchingMatcher', 'Task {0} is a background task but uses a problem matcher without a background pattern', task._label));
                    this._showOutput();
                }
                const toDispose = new lifecycle_1.DisposableStore();
                let eventCounter = 0;
                const mapKey = task.getMapKey();
                toDispose.add(watchingProblemMatcher.onDidStateChange((event) => {
                    if (event.kind === "backgroundProcessingBegins" /* ProblemCollectorEventKind.BackgroundProcessingBegins */) {
                        eventCounter++;
                        this._busyTasks[mapKey] = task;
                        this._fireTaskEvent(tasks_1.TaskEvent.general("active" /* TaskEventKind.Active */, task, terminal?.instanceId));
                    }
                    else if (event.kind === "backgroundProcessingEnds" /* ProblemCollectorEventKind.BackgroundProcessingEnds */) {
                        eventCounter--;
                        if (this._busyTasks[mapKey]) {
                            delete this._busyTasks[mapKey];
                        }
                        this._fireTaskEvent(tasks_1.TaskEvent.general("inactive" /* TaskEventKind.Inactive */, task, terminal?.instanceId));
                        if (eventCounter === 0) {
                            if ((watchingProblemMatcher.numberOfMatches > 0) && watchingProblemMatcher.maxMarkerSeverity &&
                                (watchingProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error)) {
                                const reveal = task.command.presentation.reveal;
                                const revealProblems = task.command.presentation.revealProblems;
                                if (revealProblems === tasks_1.RevealProblemKind.OnProblem) {
                                    this._viewsService.openView(markers_2.Markers.MARKERS_VIEW_ID, true);
                                }
                                else if (reveal === tasks_1.RevealKind.Silent) {
                                    this._terminalService.setActiveInstance(terminal);
                                    this._terminalGroupService.showPanel(false);
                                }
                            }
                        }
                    }
                }));
                watchingProblemMatcher.aboutToStart();
                let delayer = undefined;
                [terminal, error] = await this._createTerminal(task, resolver, workspaceFolder);
                if (error) {
                    return Promise.reject(new Error(error.message));
                }
                if (!terminal) {
                    return Promise.reject(new Error(`Failed to create terminal for task ${task._label}`));
                }
                this._terminalStatusManager.addTerminal(task, terminal, watchingProblemMatcher);
                let processStartedSignaled = false;
                terminal.processReady.then(() => {
                    if (!processStartedSignaled) {
                        this._fireTaskEvent(tasks_1.TaskEvent.processStarted(task, terminal.instanceId, terminal.processId));
                        processStartedSignaled = true;
                    }
                }, (_error) => {
                    this._logService.error('Task terminal process never got ready');
                });
                this._fireTaskEvent(tasks_1.TaskEvent.start(task, terminal.instanceId, resolver.values));
                let onData;
                if (problemMatchers.length) {
                    // prevent https://github.com/microsoft/vscode/issues/174511 from happening
                    onData = terminal.onLineData((line) => {
                        watchingProblemMatcher.processLine(line);
                        if (!delayer) {
                            delayer = new Async.Delayer(3000);
                        }
                        delayer.trigger(() => {
                            watchingProblemMatcher.forceDelivery();
                            delayer = undefined;
                        });
                    });
                }
                promise = new Promise((resolve, reject) => {
                    const onExit = terminal.onExit((terminalLaunchResult) => {
                        const exitCode = typeof terminalLaunchResult === 'number' ? terminalLaunchResult : terminalLaunchResult?.code;
                        onData?.dispose();
                        onExit.dispose();
                        const key = task.getMapKey();
                        if (this._busyTasks[mapKey]) {
                            delete this._busyTasks[mapKey];
                        }
                        this._removeFromActiveTasks(task);
                        this._fireTaskEvent(tasks_1.TaskEvent.changed());
                        if (terminalLaunchResult !== undefined) {
                            // Only keep a reference to the terminal if it is not being disposed.
                            switch (task.command.presentation.panel) {
                                case tasks_1.PanelKind.Dedicated:
                                    this._sameTaskTerminals[key] = terminal.instanceId.toString();
                                    break;
                                case tasks_1.PanelKind.Shared:
                                    this._idleTaskTerminals.set(key, terminal.instanceId.toString(), 1 /* Touch.AsOld */);
                                    break;
                            }
                        }
                        const reveal = task.command.presentation.reveal;
                        if ((reveal === tasks_1.RevealKind.Silent) && ((exitCode !== 0) || (watchingProblemMatcher.numberOfMatches > 0) && watchingProblemMatcher.maxMarkerSeverity &&
                            (watchingProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error))) {
                            try {
                                this._terminalService.setActiveInstance(terminal);
                                this._terminalGroupService.showPanel(false);
                            }
                            catch (e) {
                                // If the terminal has already been disposed, then setting the active instance will fail. #99828
                                // There is nothing else to do here.
                            }
                        }
                        watchingProblemMatcher.done();
                        watchingProblemMatcher.dispose();
                        if (!processStartedSignaled) {
                            this._fireTaskEvent(tasks_1.TaskEvent.processStarted(task, terminal.instanceId, terminal.processId));
                            processStartedSignaled = true;
                        }
                        this._fireTaskEvent(tasks_1.TaskEvent.processEnded(task, terminal.instanceId, exitCode));
                        for (let i = 0; i < eventCounter; i++) {
                            this._fireTaskEvent(tasks_1.TaskEvent.general("inactive" /* TaskEventKind.Inactive */, task, terminal.instanceId));
                        }
                        eventCounter = 0;
                        this._fireTaskEvent(tasks_1.TaskEvent.general("end" /* TaskEventKind.End */, task));
                        toDispose.dispose();
                        resolve({ exitCode: exitCode ?? undefined });
                    });
                });
                if (trigger === taskSystem_1.Triggers.reconnect && !!terminal.xterm) {
                    const bufferLines = [];
                    const bufferReverseIterator = terminal.xterm.getBufferReverseIterator();
                    const startRegex = new RegExp(watchingProblemMatcher.beginPatterns.map(pattern => pattern.source).join('|'));
                    for (const nextLine of bufferReverseIterator) {
                        bufferLines.push(nextLine);
                        if (startRegex.test(nextLine)) {
                            break;
                        }
                    }
                    let delayer = undefined;
                    for (let i = bufferLines.length - 1; i >= 0; i--) {
                        watchingProblemMatcher.processLine(bufferLines[i]);
                        if (!delayer) {
                            delayer = new Async.Delayer(3000);
                        }
                        delayer.trigger(() => {
                            watchingProblemMatcher.forceDelivery();
                            delayer = undefined;
                        });
                    }
                }
            }
            else {
                [terminal, error] = await this._createTerminal(task, resolver, workspaceFolder);
                if (error) {
                    return Promise.reject(new Error(error.message));
                }
                if (!terminal) {
                    return Promise.reject(new Error(`Failed to create terminal for task ${task._label}`));
                }
                this._fireTaskEvent(tasks_1.TaskEvent.start(task, terminal.instanceId, resolver.values));
                const mapKey = task.getMapKey();
                this._busyTasks[mapKey] = task;
                this._fireTaskEvent(tasks_1.TaskEvent.general("active" /* TaskEventKind.Active */, task, terminal.instanceId));
                const problemMatchers = await this._resolveMatchers(resolver, task.configurationProperties.problemMatchers);
                const startStopProblemMatcher = new problemCollectors_1.StartStopProblemCollector(problemMatchers, this._markerService, this._modelService, 0 /* ProblemHandlingStrategy.Clean */, this._fileService);
                this._terminalStatusManager.addTerminal(task, terminal, startStopProblemMatcher);
                let processStartedSignaled = false;
                terminal.processReady.then(() => {
                    if (!processStartedSignaled) {
                        this._fireTaskEvent(tasks_1.TaskEvent.processStarted(task, terminal.instanceId, terminal.processId));
                        processStartedSignaled = true;
                    }
                }, (_error) => {
                    // The process never got ready. Need to think how to handle this.
                });
                const onData = terminal.onLineData((line) => {
                    startStopProblemMatcher.processLine(line);
                });
                promise = new Promise((resolve, reject) => {
                    const onExit = terminal.onExit((terminalLaunchResult) => {
                        const exitCode = typeof terminalLaunchResult === 'number' ? terminalLaunchResult : terminalLaunchResult?.code;
                        onExit.dispose();
                        const key = task.getMapKey();
                        this._removeFromActiveTasks(task);
                        this._fireTaskEvent(tasks_1.TaskEvent.changed());
                        if (terminalLaunchResult !== undefined) {
                            // Only keep a reference to the terminal if it is not being disposed.
                            switch (task.command.presentation.panel) {
                                case tasks_1.PanelKind.Dedicated:
                                    this._sameTaskTerminals[key] = terminal.instanceId.toString();
                                    break;
                                case tasks_1.PanelKind.Shared:
                                    this._idleTaskTerminals.set(key, terminal.instanceId.toString(), 1 /* Touch.AsOld */);
                                    break;
                            }
                        }
                        const reveal = task.command.presentation.reveal;
                        const revealProblems = task.command.presentation.revealProblems;
                        const revealProblemPanel = terminal && (revealProblems === tasks_1.RevealProblemKind.OnProblem) && (startStopProblemMatcher.numberOfMatches > 0);
                        if (revealProblemPanel) {
                            this._viewsService.openView(markers_2.Markers.MARKERS_VIEW_ID);
                        }
                        else if (terminal && (reveal === tasks_1.RevealKind.Silent) && ((exitCode !== 0) || (startStopProblemMatcher.numberOfMatches > 0) && startStopProblemMatcher.maxMarkerSeverity &&
                            (startStopProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error))) {
                            try {
                                this._terminalService.setActiveInstance(terminal);
                                this._terminalGroupService.showPanel(false);
                            }
                            catch (e) {
                                // If the terminal has already been disposed, then setting the active instance will fail. #99828
                                // There is nothing else to do here.
                            }
                        }
                        // Hack to work around #92868 until terminal is fixed.
                        setTimeout(() => {
                            onData.dispose();
                            startStopProblemMatcher.done();
                            startStopProblemMatcher.dispose();
                        }, 100);
                        if (!processStartedSignaled && terminal) {
                            this._fireTaskEvent(tasks_1.TaskEvent.processStarted(task, terminal.instanceId, terminal.processId));
                            processStartedSignaled = true;
                        }
                        this._fireTaskEvent(tasks_1.TaskEvent.processEnded(task, terminal?.instanceId, exitCode ?? undefined));
                        if (this._busyTasks[mapKey]) {
                            delete this._busyTasks[mapKey];
                        }
                        this._fireTaskEvent(tasks_1.TaskEvent.general("inactive" /* TaskEventKind.Inactive */, task, terminal?.instanceId));
                        this._fireTaskEvent(tasks_1.TaskEvent.general("end" /* TaskEventKind.End */, task, terminal?.instanceId));
                        resolve({ exitCode: exitCode ?? undefined });
                    });
                });
            }
            const showProblemPanel = task.command.presentation && (task.command.presentation.revealProblems === tasks_1.RevealProblemKind.Always);
            if (showProblemPanel) {
                this._viewsService.openView(markers_2.Markers.MARKERS_VIEW_ID);
            }
            else if (task.command.presentation && (task.command.presentation.focus || task.command.presentation.reveal === tasks_1.RevealKind.Always)) {
                this._terminalService.setActiveInstance(terminal);
                await this._terminalService.revealActiveTerminal();
                if (task.command.presentation.focus) {
                    this._terminalService.focusActiveInstance();
                }
            }
            this._activeTasks[task.getMapKey()].terminal = terminal;
            this._fireTaskEvent(tasks_1.TaskEvent.changed());
            return promise;
        }
        _createTerminalName(task) {
            const needsFolderQualification = this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
            return needsFolderQualification ? task.getQualifiedLabel() : (task.configurationProperties.name || '');
        }
        async _createShellLaunchConfig(task, workspaceFolder, variableResolver, platform, options, command, args, waitOnExit) {
            let shellLaunchConfig;
            const isShellCommand = task.command.runtime === tasks_1.RuntimeType.Shell;
            const needsFolderQualification = this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
            const terminalName = this._createTerminalName(task);
            const type = ReconnectionType;
            const originalCommand = task.command.name;
            let cwd;
            if (options.cwd) {
                cwd = options.cwd;
                if (!path.isAbsolute(cwd)) {
                    if (workspaceFolder && (workspaceFolder.uri.scheme === network_1.Schemas.file)) {
                        cwd = path.join(workspaceFolder.uri.fsPath, cwd);
                    }
                }
                // This must be normalized to the OS
                cwd = (0, extpath_1.isUNC)(cwd) ? cwd : resources.toLocalResource(uri_1.URI.from({ scheme: network_1.Schemas.file, path: cwd }), this._environmentService.remoteAuthority, this._pathService.defaultUriScheme);
            }
            if (isShellCommand) {
                let os;
                switch (platform) {
                    case 3 /* Platform.Platform.Windows */:
                        os = 1 /* Platform.OperatingSystem.Windows */;
                        break;
                    case 1 /* Platform.Platform.Mac */:
                        os = 2 /* Platform.OperatingSystem.Macintosh */;
                        break;
                    case 2 /* Platform.Platform.Linux */:
                    default:
                        os = 3 /* Platform.OperatingSystem.Linux */;
                        break;
                }
                const defaultProfile = await this._terminalProfileResolverService.getDefaultProfile({
                    allowAutomationShell: true,
                    os,
                    remoteAuthority: this._environmentService.remoteAuthority
                });
                let icon;
                if (task.configurationProperties.icon?.id) {
                    icon = themables_1.ThemeIcon.fromId(task.configurationProperties.icon.id);
                }
                else {
                    const taskGroupKind = task.configurationProperties.group ? taskConfiguration_1.GroupKind.to(task.configurationProperties.group) : undefined;
                    const kindId = typeof taskGroupKind === 'string' ? taskGroupKind : taskGroupKind?.kind;
                    icon = kindId === 'test' ? themables_1.ThemeIcon.fromId(codicons_1.Codicon.beaker.id) : defaultProfile.icon;
                }
                shellLaunchConfig = {
                    name: terminalName,
                    type,
                    executable: defaultProfile.path,
                    args: defaultProfile.args,
                    env: { ...defaultProfile.env },
                    icon,
                    color: task.configurationProperties.icon?.color || undefined,
                    waitOnExit
                };
                let shellSpecified = false;
                const shellOptions = task.command.options && task.command.options.shell;
                if (shellOptions) {
                    if (shellOptions.executable) {
                        // Clear out the args so that we don't end up with mismatched args.
                        if (shellOptions.executable !== shellLaunchConfig.executable) {
                            shellLaunchConfig.args = undefined;
                        }
                        shellLaunchConfig.executable = await this._resolveVariable(variableResolver, shellOptions.executable);
                        shellSpecified = true;
                    }
                    if (shellOptions.args) {
                        shellLaunchConfig.args = await this._resolveVariables(variableResolver, shellOptions.args.slice());
                    }
                }
                if (shellLaunchConfig.args === undefined) {
                    shellLaunchConfig.args = [];
                }
                const shellArgs = Array.isArray(shellLaunchConfig.args) ? shellLaunchConfig.args.slice(0) : [shellLaunchConfig.args];
                const toAdd = [];
                const basename = path.posix.basename((await this._pathService.fileURI(shellLaunchConfig.executable)).path).toLowerCase();
                const commandLine = this._buildShellCommandLine(platform, basename, shellOptions, command, originalCommand, args);
                let windowsShellArgs = false;
                if (platform === 3 /* Platform.Platform.Windows */) {
                    windowsShellArgs = true;
                    // If we don't have a cwd, then the terminal uses the home dir.
                    const userHome = await this._pathService.userHome();
                    if (basename === 'cmd.exe' && ((options.cwd && (0, extpath_1.isUNC)(options.cwd)) || (!options.cwd && (0, extpath_1.isUNC)(userHome.fsPath)))) {
                        return undefined;
                    }
                    if ((basename === 'powershell.exe') || (basename === 'pwsh.exe')) {
                        if (!shellSpecified) {
                            toAdd.push('-Command');
                        }
                    }
                    else if ((basename === 'bash.exe') || (basename === 'zsh.exe')) {
                        windowsShellArgs = false;
                        if (!shellSpecified) {
                            toAdd.push('-c');
                        }
                    }
                    else if (basename === 'wsl.exe') {
                        if (!shellSpecified) {
                            toAdd.push('-e');
                        }
                    }
                    else {
                        if (!shellSpecified) {
                            toAdd.push('/d', '/c');
                        }
                    }
                }
                else {
                    if (!shellSpecified) {
                        // Under Mac remove -l to not start it as a login shell.
                        if (platform === 1 /* Platform.Platform.Mac */) {
                            // Background on -l on osx https://github.com/microsoft/vscode/issues/107563
                            // TODO: Handle by pulling the default terminal profile?
                            // const osxShellArgs = this._configurationService.inspect(TerminalSettingId.ShellArgsMacOs);
                            // if ((osxShellArgs.user === undefined) && (osxShellArgs.userLocal === undefined) && (osxShellArgs.userLocalValue === undefined)
                            // 	&& (osxShellArgs.userRemote === undefined) && (osxShellArgs.userRemoteValue === undefined)
                            // 	&& (osxShellArgs.userValue === undefined) && (osxShellArgs.workspace === undefined)
                            // 	&& (osxShellArgs.workspaceFolder === undefined) && (osxShellArgs.workspaceFolderValue === undefined)
                            // 	&& (osxShellArgs.workspaceValue === undefined)) {
                            // 	const index = shellArgs.indexOf('-l');
                            // 	if (index !== -1) {
                            // 		shellArgs.splice(index, 1);
                            // 	}
                            // }
                        }
                        toAdd.push('-c');
                    }
                }
                const combinedShellArgs = this._addAllArgument(toAdd, shellArgs);
                combinedShellArgs.push(commandLine);
                shellLaunchConfig.args = windowsShellArgs ? combinedShellArgs.join(' ') : combinedShellArgs;
                if (task.command.presentation && task.command.presentation.echo) {
                    if (needsFolderQualification && workspaceFolder) {
                        const folder = cwd && typeof cwd === 'object' && 'path' in cwd ? path.basename(cwd.path) : workspaceFolder.name;
                        shellLaunchConfig.initialText = this.taskShellIntegrationStartSequence(cwd) + (0, terminalStrings_1.formatMessageForTerminal)(nls.localize({
                            key: 'task.executingInFolder',
                            comment: ['The workspace folder the task is running in', 'The task command line or label']
                        }, 'Executing task in folder {0}: {1}', folder, commandLine), { excludeLeadingNewLine: true }) + this.taskShellIntegrationOutputSequence;
                    }
                    else {
                        shellLaunchConfig.initialText = this.taskShellIntegrationStartSequence(cwd) + (0, terminalStrings_1.formatMessageForTerminal)(nls.localize({
                            key: 'task.executing.shellIntegration',
                            comment: ['The task command line or label']
                        }, 'Executing task: {0}', commandLine), { excludeLeadingNewLine: true }) + this.taskShellIntegrationOutputSequence;
                    }
                }
                else {
                    shellLaunchConfig.initialText = {
                        text: this.taskShellIntegrationStartSequence(cwd) + this.taskShellIntegrationOutputSequence,
                        trailingNewLine: false
                    };
                }
            }
            else {
                const commandExecutable = (task.command.runtime !== tasks_1.RuntimeType.CustomExecution) ? tasks_1.CommandString.value(command) : undefined;
                const executable = !isShellCommand
                    ? await this._resolveVariable(variableResolver, await this._resolveVariable(variableResolver, '${' + TerminalTaskSystem.ProcessVarName + '}'))
                    : commandExecutable;
                // When we have a process task there is no need to quote arguments. So we go ahead and take the string value.
                shellLaunchConfig = {
                    name: terminalName,
                    type,
                    icon: task.configurationProperties.icon?.id ? themables_1.ThemeIcon.fromId(task.configurationProperties.icon.id) : undefined,
                    color: task.configurationProperties.icon?.color || undefined,
                    executable: executable,
                    args: args.map(a => Types.isString(a) ? a : a.value),
                    waitOnExit
                };
                if (task.command.presentation && task.command.presentation.echo) {
                    const getArgsToEcho = (args) => {
                        if (!args || args.length === 0) {
                            return '';
                        }
                        if (Types.isString(args)) {
                            return args;
                        }
                        return args.join(' ');
                    };
                    if (needsFolderQualification && workspaceFolder) {
                        shellLaunchConfig.initialText = this.taskShellIntegrationStartSequence(cwd) + (0, terminalStrings_1.formatMessageForTerminal)(nls.localize({
                            key: 'task.executingInFolder',
                            comment: ['The workspace folder the task is running in', 'The task command line or label']
                        }, 'Executing task in folder {0}: {1}', workspaceFolder.name, `${shellLaunchConfig.executable} ${getArgsToEcho(shellLaunchConfig.args)}`), { excludeLeadingNewLine: true }) + this.taskShellIntegrationOutputSequence;
                    }
                    else {
                        shellLaunchConfig.initialText = this.taskShellIntegrationStartSequence(cwd) + (0, terminalStrings_1.formatMessageForTerminal)(nls.localize({
                            key: 'task.executing.shell-integration',
                            comment: ['The task command line or label']
                        }, 'Executing task: {0}', `${shellLaunchConfig.executable} ${getArgsToEcho(shellLaunchConfig.args)}`), { excludeLeadingNewLine: true }) + this.taskShellIntegrationOutputSequence;
                    }
                }
                else {
                    shellLaunchConfig.initialText = {
                        text: this.taskShellIntegrationStartSequence(cwd) + this.taskShellIntegrationOutputSequence,
                        trailingNewLine: false
                    };
                }
            }
            if (cwd) {
                shellLaunchConfig.cwd = cwd;
            }
            if (options.env) {
                if (shellLaunchConfig.env) {
                    shellLaunchConfig.env = { ...shellLaunchConfig.env, ...options.env };
                }
                else {
                    shellLaunchConfig.env = options.env;
                }
            }
            shellLaunchConfig.isFeatureTerminal = true;
            shellLaunchConfig.useShellEnvironment = true;
            return shellLaunchConfig;
        }
        _addAllArgument(shellCommandArgs, configuredShellArgs) {
            const combinedShellArgs = Objects.deepClone(configuredShellArgs);
            shellCommandArgs.forEach(element => {
                const shouldAddShellCommandArg = configuredShellArgs.every((arg, index) => {
                    if ((arg.toLowerCase() === element) && (configuredShellArgs.length > index + 1)) {
                        // We can still add the argument, but only if not all of the following arguments begin with "-".
                        return !configuredShellArgs.slice(index + 1).every(testArg => testArg.startsWith('-'));
                    }
                    else {
                        return arg.toLowerCase() !== element;
                    }
                });
                if (shouldAddShellCommandArg) {
                    combinedShellArgs.push(element);
                }
            });
            return combinedShellArgs;
        }
        async _reconnectToTerminal(task) {
            if (!this._reconnectedTerminals) {
                return;
            }
            for (let i = 0; i < this._reconnectedTerminals.length; i++) {
                const terminal = this._reconnectedTerminals[i];
                if (getReconnectionData(terminal)?.lastTask === task.getCommonTaskId()) {
                    this._reconnectedTerminals.splice(i, 1);
                    return terminal;
                }
            }
            return undefined;
        }
        async _doCreateTerminal(task, group, launchConfigs) {
            const reconnectedTerminal = await this._reconnectToTerminal(task);
            const onDisposed = (terminal) => this._fireTaskEvent(tasks_1.TaskEvent.terminated(task, terminal.instanceId, terminal.exitReason));
            if (reconnectedTerminal) {
                if ('command' in task && task.command.presentation) {
                    reconnectedTerminal.waitOnExit = getWaitOnExitValue(task.command.presentation, task.configurationProperties);
                }
                reconnectedTerminal.onDisposed(onDisposed);
                this._logService.trace('reconnected to task and terminal', task._id);
                return reconnectedTerminal;
            }
            if (group) {
                // Try to find an existing terminal to split.
                // Even if an existing terminal is found, the split can fail if the terminal width is too small.
                for (const terminal of Object.values(this._terminals)) {
                    if (terminal.group === group) {
                        this._logService.trace(`Found terminal to split for group ${group}`);
                        const originalInstance = terminal.terminal;
                        const result = await this._terminalService.createTerminal({ location: { parentTerminal: originalInstance }, config: launchConfigs });
                        result.onDisposed(onDisposed);
                        if (result) {
                            return result;
                        }
                    }
                }
                this._logService.trace(`No terminal found to split for group ${group}`);
            }
            // Either no group is used, no terminal with the group exists or splitting an existing terminal failed.
            const createdTerminal = await this._terminalService.createTerminal({ config: launchConfigs });
            createdTerminal.onDisposed(onDisposed);
            return createdTerminal;
        }
        _reconnectToTerminals() {
            if (this._hasReconnected) {
                this._logService.trace(`Already reconnected, to ${this._reconnectedTerminals?.length} terminals so returning`);
                return;
            }
            this._reconnectedTerminals = this._terminalService.getReconnectedTerminals(ReconnectionType)?.filter(t => !t.isDisposed && getReconnectionData(t)) || [];
            this._logService.trace(`Attempting reconnection of ${this._reconnectedTerminals?.length} terminals`);
            if (!this._reconnectedTerminals?.length) {
                this._logService.trace(`No terminals to reconnect to so returning`);
            }
            else {
                for (const terminal of this._reconnectedTerminals) {
                    const data = getReconnectionData(terminal);
                    if (data) {
                        const terminalData = { lastTask: data.lastTask, group: data.group, terminal };
                        this._terminals[terminal.instanceId] = terminalData;
                        this._logService.trace('Reconnecting to task terminal', terminalData.lastTask, terminal.instanceId);
                    }
                }
            }
            this._hasReconnected = true;
        }
        _deleteTaskAndTerminal(terminal, terminalData) {
            delete this._terminals[terminal.instanceId];
            delete this._sameTaskTerminals[terminalData.lastTask];
            this._idleTaskTerminals.delete(terminalData.lastTask);
            // Delete the task now as a work around for cases when the onExit isn't fired.
            // This can happen if the terminal wasn't shutdown with an "immediate" flag and is expected.
            // For correct terminal re-use, the task needs to be deleted immediately.
            // Note that this shouldn't be a problem anymore since user initiated terminal kills are now immediate.
            const mapKey = terminalData.lastTask;
            this._removeFromActiveTasks(mapKey);
            if (this._busyTasks[mapKey]) {
                delete this._busyTasks[mapKey];
            }
        }
        async _createTerminal(task, resolver, workspaceFolder) {
            const platform = resolver.taskSystemInfo ? resolver.taskSystemInfo.platform : Platform.platform;
            const options = await this._resolveOptions(resolver, task.command.options);
            const presentationOptions = task.command.presentation;
            if (!presentationOptions) {
                throw new Error('Task presentation options should not be undefined here.');
            }
            const waitOnExit = getWaitOnExitValue(presentationOptions, task.configurationProperties);
            let command;
            let args;
            let launchConfigs;
            if (task.command.runtime === tasks_1.RuntimeType.CustomExecution) {
                this._currentTask.shellLaunchConfig = launchConfigs = {
                    customPtyImplementation: (id, cols, rows) => new terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy(id, cols, rows, this._terminalService),
                    waitOnExit,
                    name: this._createTerminalName(task),
                    initialText: task.command.presentation && task.command.presentation.echo ? (0, terminalStrings_1.formatMessageForTerminal)(nls.localize({
                        key: 'task.executing',
                        comment: ['The task command line or label']
                    }, 'Executing task: {0}', task._label), { excludeLeadingNewLine: true }) : undefined,
                    isFeatureTerminal: true,
                    icon: task.configurationProperties.icon?.id ? themables_1.ThemeIcon.fromId(task.configurationProperties.icon.id) : undefined,
                    color: task.configurationProperties.icon?.color || undefined
                };
            }
            else {
                const resolvedResult = await this._resolveCommandAndArgs(resolver, task.command);
                command = resolvedResult.command;
                args = resolvedResult.args;
                this._currentTask.shellLaunchConfig = launchConfigs = await this._createShellLaunchConfig(task, workspaceFolder, resolver, platform, options, command, args, waitOnExit);
                if (launchConfigs === undefined) {
                    return [undefined, new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TerminalTaskSystem', 'Can\'t execute a shell command on an UNC drive using cmd.exe.'), 7 /* TaskErrors.UnknownError */)];
                }
            }
            const prefersSameTerminal = presentationOptions.panel === tasks_1.PanelKind.Dedicated;
            const allowsSharedTerminal = presentationOptions.panel === tasks_1.PanelKind.Shared;
            const group = presentationOptions.group;
            const taskKey = task.getMapKey();
            let terminalToReuse;
            if (prefersSameTerminal) {
                const terminalId = this._sameTaskTerminals[taskKey];
                if (terminalId) {
                    terminalToReuse = this._terminals[terminalId];
                    delete this._sameTaskTerminals[taskKey];
                }
            }
            else if (allowsSharedTerminal) {
                // Always allow to reuse the terminal previously used by the same task.
                let terminalId = this._idleTaskTerminals.remove(taskKey);
                if (!terminalId) {
                    // There is no idle terminal which was used by the same task.
                    // Search for any idle terminal used previously by a task of the same group
                    // (or, if the task has no group, a terminal used by a task without group).
                    for (const taskId of this._idleTaskTerminals.keys()) {
                        const idleTerminalId = this._idleTaskTerminals.get(taskId);
                        if (idleTerminalId && this._terminals[idleTerminalId] && this._terminals[idleTerminalId].group === group) {
                            terminalId = this._idleTaskTerminals.remove(taskId);
                            break;
                        }
                    }
                }
                if (terminalId) {
                    terminalToReuse = this._terminals[terminalId];
                }
            }
            if (terminalToReuse) {
                if (!launchConfigs) {
                    throw new Error('Task shell launch configuration should not be undefined here.');
                }
                terminalToReuse.terminal.scrollToBottom();
                if (task.configurationProperties.isBackground) {
                    launchConfigs.reconnectionProperties = { ownerId: ReconnectionType, data: { lastTask: task.getCommonTaskId(), group, label: task._label, id: task._id } };
                }
                await terminalToReuse.terminal.reuseTerminal(launchConfigs);
                if (task.command.presentation && task.command.presentation.clear) {
                    terminalToReuse.terminal.clearBuffer();
                }
                this._terminals[terminalToReuse.terminal.instanceId.toString()].lastTask = taskKey;
                return [terminalToReuse.terminal, undefined];
            }
            this._terminalCreationQueue = this._terminalCreationQueue.then(() => this._doCreateTerminal(task, group, launchConfigs));
            const terminal = (await this._terminalCreationQueue);
            if (task.configurationProperties.isBackground) {
                terminal.shellLaunchConfig.reconnectionProperties = { ownerId: ReconnectionType, data: { lastTask: task.getCommonTaskId(), group, label: task._label, id: task._id } };
            }
            const terminalKey = terminal.instanceId.toString();
            const terminalData = { terminal: terminal, lastTask: taskKey, group };
            terminal.onDisposed(() => this._deleteTaskAndTerminal(terminal, terminalData));
            this._terminals[terminalKey] = terminalData;
            return [terminal, undefined];
        }
        _buildShellCommandLine(platform, shellExecutable, shellOptions, command, originalCommand, args) {
            const basename = path.parse(shellExecutable).name.toLowerCase();
            const shellQuoteOptions = this._getQuotingOptions(basename, shellOptions, platform);
            function needsQuotes(value) {
                if (value.length >= 2) {
                    const first = value[0] === shellQuoteOptions.strong ? shellQuoteOptions.strong : value[0] === shellQuoteOptions.weak ? shellQuoteOptions.weak : undefined;
                    if (first === value[value.length - 1]) {
                        return false;
                    }
                }
                let quote;
                for (let i = 0; i < value.length; i++) {
                    // We found the end quote.
                    const ch = value[i];
                    if (ch === quote) {
                        quote = undefined;
                    }
                    else if (quote !== undefined) {
                        // skip the character. We are quoted.
                        continue;
                    }
                    else if (ch === shellQuoteOptions.escape) {
                        // Skip the next character
                        i++;
                    }
                    else if (ch === shellQuoteOptions.strong || ch === shellQuoteOptions.weak) {
                        quote = ch;
                    }
                    else if (ch === ' ') {
                        return true;
                    }
                }
                return false;
            }
            function quote(value, kind) {
                if (kind === tasks_1.ShellQuoting.Strong && shellQuoteOptions.strong) {
                    return [shellQuoteOptions.strong + value + shellQuoteOptions.strong, true];
                }
                else if (kind === tasks_1.ShellQuoting.Weak && shellQuoteOptions.weak) {
                    return [shellQuoteOptions.weak + value + shellQuoteOptions.weak, true];
                }
                else if (kind === tasks_1.ShellQuoting.Escape && shellQuoteOptions.escape) {
                    if (Types.isString(shellQuoteOptions.escape)) {
                        return [value.replace(/ /g, shellQuoteOptions.escape + ' '), true];
                    }
                    else {
                        const buffer = [];
                        for (const ch of shellQuoteOptions.escape.charsToEscape) {
                            buffer.push(`\\${ch}`);
                        }
                        const regexp = new RegExp('[' + buffer.join(',') + ']', 'g');
                        const escapeChar = shellQuoteOptions.escape.escapeChar;
                        return [value.replace(regexp, (match) => escapeChar + match), true];
                    }
                }
                return [value, false];
            }
            function quoteIfNecessary(value) {
                if (Types.isString(value)) {
                    if (needsQuotes(value)) {
                        return quote(value, tasks_1.ShellQuoting.Strong);
                    }
                    else {
                        return [value, false];
                    }
                }
                else {
                    return quote(value.value, value.quoting);
                }
            }
            // If we have no args and the command is a string then use the command to stay backwards compatible with the old command line
            // model. To allow variable resolving with spaces we do continue if the resolved value is different than the original one
            // and the resolved one needs quoting.
            if ((!args || args.length === 0) && Types.isString(command) && (command === originalCommand || needsQuotes(originalCommand))) {
                return command;
            }
            const result = [];
            let commandQuoted = false;
            let argQuoted = false;
            let value;
            let quoted;
            [value, quoted] = quoteIfNecessary(command);
            result.push(value);
            commandQuoted = quoted;
            for (const arg of args) {
                [value, quoted] = quoteIfNecessary(arg);
                result.push(value);
                argQuoted = argQuoted || quoted;
            }
            let commandLine = result.join(' ');
            // There are special rules quoted command line in cmd.exe
            if (platform === 3 /* Platform.Platform.Windows */) {
                if (basename === 'cmd' && commandQuoted && argQuoted) {
                    commandLine = '"' + commandLine + '"';
                }
                else if ((basename === 'powershell' || basename === 'pwsh') && commandQuoted) {
                    commandLine = '& ' + commandLine;
                }
            }
            return commandLine;
        }
        _getQuotingOptions(shellBasename, shellOptions, platform) {
            if (shellOptions && shellOptions.quoting) {
                return shellOptions.quoting;
            }
            return TerminalTaskSystem._shellQuotes[shellBasename] || TerminalTaskSystem._osShellQuotes[Platform.PlatformToString(platform)];
        }
        _collectTaskVariables(variables, task) {
            if (task.command && task.command.name) {
                this._collectCommandVariables(variables, task.command, task);
            }
            this._collectMatcherVariables(variables, task.configurationProperties.problemMatchers);
            if (task.command.runtime === tasks_1.RuntimeType.CustomExecution && (tasks_1.CustomTask.is(task) || tasks_1.ContributedTask.is(task))) {
                let definition;
                if (tasks_1.CustomTask.is(task)) {
                    definition = task._source.config.element;
                }
                else {
                    definition = Objects.deepClone(task.defines);
                    delete definition._key;
                    delete definition.type;
                }
                this._collectDefinitionVariables(variables, definition);
            }
        }
        _collectDefinitionVariables(variables, definition) {
            if (Types.isString(definition)) {
                this._collectVariables(variables, definition);
            }
            else if (Array.isArray(definition)) {
                definition.forEach((element) => this._collectDefinitionVariables(variables, element));
            }
            else if (Types.isObject(definition)) {
                for (const key in definition) {
                    this._collectDefinitionVariables(variables, definition[key]);
                }
            }
        }
        _collectCommandVariables(variables, command, task) {
            // The custom execution should have everything it needs already as it provided
            // the callback.
            if (command.runtime === tasks_1.RuntimeType.CustomExecution) {
                return;
            }
            if (command.name === undefined) {
                throw new Error('Command name should never be undefined here.');
            }
            this._collectVariables(variables, command.name);
            command.args?.forEach(arg => this._collectVariables(variables, arg));
            // Try to get a scope.
            const scope = task._source.scope;
            if (scope !== 1 /* TaskScope.Global */) {
                variables.add('${workspaceFolder}');
            }
            if (command.options) {
                const options = command.options;
                if (options.cwd) {
                    this._collectVariables(variables, options.cwd);
                }
                const optionsEnv = options.env;
                if (optionsEnv) {
                    Object.keys(optionsEnv).forEach((key) => {
                        const value = optionsEnv[key];
                        if (Types.isString(value)) {
                            this._collectVariables(variables, value);
                        }
                    });
                }
                if (options.shell) {
                    if (options.shell.executable) {
                        this._collectVariables(variables, options.shell.executable);
                    }
                    options.shell.args?.forEach(arg => this._collectVariables(variables, arg));
                }
            }
        }
        _collectMatcherVariables(variables, values) {
            if (values === undefined || values === null || values.length === 0) {
                return;
            }
            values.forEach((value) => {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (matcher && matcher.filePrefix) {
                    if (Types.isString(matcher.filePrefix)) {
                        this._collectVariables(variables, matcher.filePrefix);
                    }
                    else {
                        for (const fp of [...(0, arrays_1.asArray)(matcher.filePrefix.include || []), ...(0, arrays_1.asArray)(matcher.filePrefix.exclude || [])]) {
                            this._collectVariables(variables, fp);
                        }
                    }
                }
            });
        }
        _collectVariables(variables, value) {
            const string = Types.isString(value) ? value : value.value;
            const r = /\$\{(.*?)\}/g;
            let matches;
            do {
                matches = r.exec(string);
                if (matches) {
                    variables.add(matches[0]);
                }
            } while (matches);
        }
        async _resolveCommandAndArgs(resolver, commandConfig) {
            // First we need to use the command args:
            let args = commandConfig.args ? commandConfig.args.slice() : [];
            args = await this._resolveVariables(resolver, args);
            const command = await this._resolveVariable(resolver, commandConfig.name);
            return { command, args };
        }
        async _resolveVariables(resolver, value) {
            return Promise.all(value.map(s => this._resolveVariable(resolver, s)));
        }
        async _resolveMatchers(resolver, values) {
            if (values === undefined || values === null || values.length === 0) {
                return [];
            }
            const result = [];
            for (const value of values) {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (!matcher) {
                    this._appendOutput(nls.localize('unknownProblemMatcher', 'Problem matcher {0} can\'t be resolved. The matcher will be ignored'));
                    continue;
                }
                const taskSystemInfo = resolver.taskSystemInfo;
                const hasFilePrefix = matcher.filePrefix !== undefined;
                const hasUriProvider = taskSystemInfo !== undefined && taskSystemInfo.uriProvider !== undefined;
                if (!hasFilePrefix && !hasUriProvider) {
                    result.push(matcher);
                }
                else {
                    const copy = Objects.deepClone(matcher);
                    if (hasUriProvider && (taskSystemInfo !== undefined)) {
                        copy.uriProvider = taskSystemInfo.uriProvider;
                    }
                    if (hasFilePrefix) {
                        const filePrefix = copy.filePrefix;
                        if (Types.isString(filePrefix)) {
                            copy.filePrefix = await this._resolveVariable(resolver, filePrefix);
                        }
                        else if (filePrefix !== undefined) {
                            if (filePrefix.include) {
                                filePrefix.include = Array.isArray(filePrefix.include)
                                    ? await Promise.all(filePrefix.include.map(x => this._resolveVariable(resolver, x)))
                                    : await this._resolveVariable(resolver, filePrefix.include);
                            }
                            if (filePrefix.exclude) {
                                filePrefix.exclude = Array.isArray(filePrefix.exclude)
                                    ? await Promise.all(filePrefix.exclude.map(x => this._resolveVariable(resolver, x)))
                                    : await this._resolveVariable(resolver, filePrefix.exclude);
                            }
                        }
                    }
                    result.push(copy);
                }
            }
            return result;
        }
        async _resolveVariable(resolver, value) {
            // TODO@Dirk Task.getWorkspaceFolder should return a WorkspaceFolder that is defined in workspace.ts
            if (Types.isString(value)) {
                return resolver.resolve(value);
            }
            else if (value !== undefined) {
                return {
                    value: await resolver.resolve(value.value),
                    quoting: value.quoting
                };
            }
            else { // This should never happen
                throw new Error('Should never try to resolve undefined.');
            }
        }
        async _resolveOptions(resolver, options) {
            if (options === undefined || options === null) {
                let cwd;
                try {
                    cwd = await this._resolveVariable(resolver, '${workspaceFolder}');
                }
                catch (e) {
                    // No workspace
                }
                return { cwd };
            }
            const result = Types.isString(options.cwd)
                ? { cwd: await this._resolveVariable(resolver, options.cwd) }
                : { cwd: await this._resolveVariable(resolver, '${workspaceFolder}') };
            if (options.env) {
                result.env = Object.create(null);
                for (const key of Object.keys(options.env)) {
                    const value = options.env[key];
                    if (Types.isString(value)) {
                        result.env[key] = await this._resolveVariable(resolver, value);
                    }
                    else {
                        result.env[key] = value.toString();
                    }
                }
            }
            return result;
        }
        static { this.WellKnownCommands = {
            'ant': true,
            'cmake': true,
            'eslint': true,
            'gradle': true,
            'grunt': true,
            'gulp': true,
            'jake': true,
            'jenkins': true,
            'jshint': true,
            'make': true,
            'maven': true,
            'msbuild': true,
            'msc': true,
            'nmake': true,
            'npm': true,
            'rake': true,
            'tsc': true,
            'xbuild': true
        }; }
        getSanitizedCommand(cmd) {
            let result = cmd.toLowerCase();
            const index = result.lastIndexOf(path.sep);
            if (index !== -1) {
                result = result.substring(index + 1);
            }
            if (TerminalTaskSystem.WellKnownCommands[result]) {
                return result;
            }
            return 'other';
        }
        _appendOutput(output) {
            const outputChannel = this._outputService.getChannel(this._outputChannelId);
            outputChannel?.append(output);
        }
    }
    exports.TerminalTaskSystem = TerminalTaskSystem;
    function getWaitOnExitValue(presentationOptions, configurationProperties) {
        if ((presentationOptions.close === undefined) || (presentationOptions.close === false)) {
            if ((presentationOptions.reveal !== tasks_1.RevealKind.Never) || !configurationProperties.isBackground || (presentationOptions.close === false)) {
                if (presentationOptions.panel === tasks_1.PanelKind.New) {
                    return taskShellIntegrationWaitOnExitSequence(nls.localize('closeTerminal', 'Press any key to close the terminal.'));
                }
                else if (presentationOptions.showReuseMessage) {
                    return taskShellIntegrationWaitOnExitSequence(nls.localize('reuseTerminal', 'Terminal will be reused by tasks, press any key to close it.'));
                }
                else {
                    return true;
                }
            }
        }
        return !presentationOptions.close;
    }
    function taskShellIntegrationWaitOnExitSequence(message) {
        return (exitCode) => {
            return `${(0, terminalEscapeSequences_1.VSCodeSequence)("D" /* VSCodeOscPt.CommandFinished */, exitCode.toString())}${message}`;
        };
    }
    function getReconnectionData(terminal) {
        return terminal.shellLaunchConfig.attachPersistentProcess?.reconnectionProperties?.data;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUYXNrU3lzdGVtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvYnJvd3Nlci90ZXJtaW5hbFRhc2tTeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkVoRyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztJQUVoQyxNQUFNLGdCQUFnQjtpQkFDTixXQUFNLEdBQUcsY0FBYyxDQUFDO1FBQ3ZDLFlBQW1CLGVBQTZDLEVBQVMsY0FBMkMsRUFBa0IsTUFBMkIsRUFBVSxRQUFtRDtZQUEzTSxvQkFBZSxHQUFmLGVBQWUsQ0FBOEI7WUFBUyxtQkFBYyxHQUFkLGNBQWMsQ0FBNkI7WUFBa0IsV0FBTSxHQUFOLE1BQU0sQ0FBcUI7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUEyQztRQUM5TixDQUFDO1FBQ0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFhO1lBQzFCLE1BQU0sU0FBUyxHQUFzQixFQUFFLENBQUM7WUFDeEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRTtnQkFDekQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUcsQ0FB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