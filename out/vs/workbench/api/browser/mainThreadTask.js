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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/base/common/errors"], function (require, exports, nls, uri_1, uuid_1, Types, Platform, lifecycle_1, workspace_1, tasks_1, taskService_1, extHostCustomers_1, extHost_protocol_1, configurationResolver_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTask = void 0;
    var TaskExecutionDTO;
    (function (TaskExecutionDTO) {
        function from(value) {
            return {
                id: value.id,
                task: TaskDTO.from(value.task)
            };
        }
        TaskExecutionDTO.from = from;
    })(TaskExecutionDTO || (TaskExecutionDTO = {}));
    var TaskProcessStartedDTO;
    (function (TaskProcessStartedDTO) {
        function from(value, processId) {
            return {
                id: value.id,
                processId
            };
        }
        TaskProcessStartedDTO.from = from;
    })(TaskProcessStartedDTO || (TaskProcessStartedDTO = {}));
    var TaskProcessEndedDTO;
    (function (TaskProcessEndedDTO) {
        function from(value, exitCode) {
            return {
                id: value.id,
                exitCode
            };
        }
        TaskProcessEndedDTO.from = from;
    })(TaskProcessEndedDTO || (TaskProcessEndedDTO = {}));
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            const result = Object.assign(Object.create(null), value);
            delete result._key;
            return result;
        }
        TaskDefinitionDTO.from = from;
        function to(value, executeOnly) {
            let result = tasks_1.TaskDefinition.createTaskIdentifier(value, console);
            if (result === undefined && executeOnly) {
                result = {
                    _key: (0, uuid_1.generateUuid)(),
                    type: '$executeOnly'
                };
            }
            return result;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO || (TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return Object.assign(Object.create(null), value);
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.PresentationOptions.defaults;
            }
            return Object.assign(Object.create(null), tasks_1.PresentationOptions.defaults, value);
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO || (TaskPresentationOptionsDTO = {}));
    var RunOptionsDTO;
    (function (RunOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return Object.assign(Object.create(null), value);
        }
        RunOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.RunOptions.defaults;
            }
            return Object.assign(Object.create(null), tasks_1.RunOptions.defaults, value);
        }
        RunOptionsDTO.to = to;
    })(RunOptionsDTO || (RunOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return {
                cwd: value.cwd,
                env: value.env
            };
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.CommandOptions.defaults;
            }
            return {
                cwd: value.cwd || tasks_1.CommandOptions.defaults.cwd,
                env: value.env
            };
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO || (ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && !!candidate.process;
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            const process = Types.isString(value.name) ? value.name : value.name.value;
            const args = value.args ? value.args.map(value => Types.isString(value) ? value : value.value) : [];
            const result = {
                process: process,
                args: args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            const result = {
                runtime: tasks_1.RuntimeType.Process,
                name: value.process,
                args: value.args,
                presentation: undefined
            };
            result.options = ProcessExecutionOptionsDTO.to(value.options);
            return result;
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO || (ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                cwd: value.cwd || tasks_1.CommandOptions.defaults.cwd,
                env: value.env
            };
            if (value.shell) {
                result.executable = value.shell.executable;
                result.shellArgs = value.shell.args;
                result.shellQuoting = value.shell.quoting;
            }
            return result;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                cwd: value.cwd,
                env: value.env
            };
            if (value.executable) {
                result.shell = {
                    executable: value.executable
                };
                if (value.shellArgs) {
                    result.shell.args = value.shellArgs;
                }
                if (value.shellQuoting) {
                    result.shell.quoting = value.shellQuoting;
                }
            }
            return result;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO || (ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && (!!candidate.commandLine || !!candidate.command);
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            const result = {};
            if (value.name && Types.isString(value.name) && (value.args === undefined || value.args === null || value.args.length === 0)) {
                result.commandLine = value.name;
            }
            else {
                result.command = value.name;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            const result = {
                runtime: tasks_1.RuntimeType.Shell,
                name: value.commandLine ? value.commandLine : value.command,
                args: value.args,
                presentation: undefined
            };
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.to(value.options);
            }
            return result;
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO || (ShellExecutionDTO = {}));
    var CustomExecutionDTO;
    (function (CustomExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && candidate.customExecution === 'customExecution';
        }
        CustomExecutionDTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution'
            };
        }
        CustomExecutionDTO.from = from;
        function to(value) {
            return {
                runtime: tasks_1.RuntimeType.CustomExecution,
                presentation: undefined
            };
        }
        CustomExecutionDTO.to = to;
    })(CustomExecutionDTO || (CustomExecutionDTO = {}));
    var TaskSourceDTO;
    (function (TaskSourceDTO) {
        function from(value) {
            const result = {
                label: value.label
            };
            if (value.kind === tasks_1.TaskSourceKind.Extension) {
                result.extensionId = value.extension;
                if (value.workspaceFolder) {
                    result.scope = value.workspaceFolder.uri;
                }
                else {
                    result.scope = value.scope;
                }
            }
            else if (value.kind === tasks_1.TaskSourceKind.Workspace) {
                result.extensionId = '$core';
                result.scope = value.config.workspaceFolder ? value.config.workspaceFolder.uri : 1 /* TaskScope.Global */;
            }
            return result;
        }
        TaskSourceDTO.from = from;
        function to(value, workspace) {
            let scope;
            let workspaceFolder;
            if ((value.scope === undefined) || ((typeof value.scope === 'number') && (value.scope !== 1 /* TaskScope.Global */))) {
                if (workspace.getWorkspace().folders.length === 0) {
                    scope = 1 /* TaskScope.Global */;
                    workspaceFolder = undefined;
                }
                else {
                    scope = 3 /* TaskScope.Folder */;
                    workspaceFolder = workspace.getWorkspace().folders[0];
                }
            }
            else if (typeof value.scope === 'number') {
                scope = value.scope;
            }
            else {
                scope = 3 /* TaskScope.Folder */;
                workspaceFolder = workspace.getWorkspaceFolder(uri_1.URI.revive(value.scope)) ?? undefined;
            }
            const result = {
                kind: tasks_1.TaskSourceKind.Extension,
                label: value.label,
                extension: value.extensionId,
                scope,
                workspaceFolder
            };
            return result;
        }
        TaskSourceDTO.to = to;
    })(TaskSourceDTO || (TaskSourceDTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function is(value) {
            const candidate = value;
            return candidate && Types.isString(candidate.id) && !!candidate.workspaceFolder;
        }
        TaskHandleDTO.is = is;
    })(TaskHandleDTO || (TaskHandleDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function from(task) {
            if (task === undefined || task === null || (!tasks_1.CustomTask.is(task) && !tasks_1.ContributedTask.is(task) && !tasks_1.ConfiguringTask.is(task))) {
                return undefined;
            }
            const result = {
                _id: task._id,
                name: task.configurationProperties.name,
                definition: TaskDefinitionDTO.from(task.getDefinition(true)),
                source: TaskSourceDTO.from(task._source),
                execution: undefined,
                presentationOptions: !tasks_1.ConfiguringTask.is(task) && task.command ? TaskPresentationOptionsDTO.from(task.command.presentation) : undefined,
                isBackground: task.configurationProperties.isBackground,
                problemMatchers: [],
                hasDefinedMatchers: tasks_1.ContributedTask.is(task) ? task.hasDefinedMatchers : false,
                runOptions: RunOptionsDTO.from(task.runOptions),
            };
            result.group = TaskGroupDTO.from(task.configurationProperties.group);
            if (task.configurationProperties.detail) {
                result.detail = task.configurationProperties.detail;
            }
            if (!tasks_1.ConfiguringTask.is(task) && task.command) {
                switch (task.command.runtime) {
                    case tasks_1.RuntimeType.Process:
                        result.execution = ProcessExecutionDTO.from(task.command);
                        break;
                    case tasks_1.RuntimeType.Shell:
                        result.execution = ShellExecutionDTO.from(task.command);
                        break;
                    case tasks_1.RuntimeType.CustomExecution:
                        result.execution = CustomExecutionDTO.from(task.command);
                        break;
                }
            }
            if (task.configurationProperties.problemMatchers) {
                for (const matcher of task.configurationProperties.problemMatchers) {
                    if (Types.isString(matcher)) {
                        result.problemMatchers.push(matcher);
                    }
                }
            }
            return result;
        }
        TaskDTO.from = from;
        function to(task, workspace, executeOnly, icon, hide) {
            if (!task || (typeof task.name !== 'string')) {
                return undefined;
            }
            let command;
            if (task.execution) {
                if (ShellExecutionDTO.is(task.execution)) {
                    command = ShellExecutionDTO.to(task.execution);
                }
                else if (ProcessExecutionDTO.is(task.execution)) {
                    command = ProcessExecutionDTO.to(task.execution);
                }
                else if (CustomExecutionDTO.is(task.execution)) {
                    command = CustomExecutionDTO.to(task.execution);
                }
            }
            if (!command) {
                return undefined;
            }
            command.presentation = TaskPresentationOptionsDTO.to(task.presentationOptions);
            const source = TaskSourceDTO.to(task.source, workspace);
            const label = nls.localize('task.label', '{0}: {1}', source.label, task.name);
            const definition = TaskDefinitionDTO.to(task.definition, executeOnly);
            const id = (CustomExecutionDTO.is(task.execution) && task._id) ? task._id : `${task.source.extensionId}.${definition._key}`;
            const result = new tasks_1.ContributedTask(id, // uuidMap.getUUID(identifier)
            source, label, definition.type, definition, command, task.hasDefinedMatchers, RunOptionsDTO.to(task.runOptions), {
                name: task.name,
                identifier: label,
                group: task.group,
                isBackground: !!task.isBackground,
                problemMatchers: task.problemMatchers.slice(),
                detail: task.detail,
                icon,
                hide
            });
            return result;
        }
        TaskDTO.to = to;
    })(TaskDTO || (TaskDTO = {}));
    var TaskGroupDTO;
    (function (TaskGroupDTO) {
        function from(value) {
            if (value === undefined) {
                return undefined;
            }
            return {
                _id: (typeof value === 'string') ? value : value._id,
                isDefault: (typeof value === 'string') ? false : ((typeof value.isDefault === 'string') ? false : value.isDefault)
            };
        }
        TaskGroupDTO.from = from;
    })(TaskGroupDTO || (TaskGroupDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            return value;
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO || (TaskFilterDTO = {}));
    let MainThreadTask = class MainThreadTask extends lifecycle_1.Disposable {
        constructor(extHostContext, _taskService, _workspaceContextServer, _configurationResolverService) {
            super();
            this._taskService = _taskService;
            this._workspaceContextServer = _workspaceContextServer;
            this._configurationResolverService = _configurationResolverService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTask);
            this._providers = new Map();
            this._register(this._taskService.onDidStateChange(async (event) => {
                if (event.kind === "changed" /* TaskEventKind.Changed */) {
                    return;
                }
                const task = event.__task;
                if (event.kind === "start" /* TaskEventKind.Start */) {
                    const execution = TaskExecutionDTO.from(task.getTaskExecution());
                    let resolvedDefinition = execution.task.definition;
                    if (execution.task?.execution && CustomExecutionDTO.is(execution.task.execution) && event.resolvedVariables) {
                        const dictionary = {};
                        for (const [key, value] of event.resolvedVariables.entries()) {
                            dictionary[key] = value;
                        }
                        resolvedDefinition = await this._configurationResolverService.resolveAnyAsync(task.getWorkspaceFolder(), execution.task.definition, dictionary);
                    }
                    this._proxy.$onDidStartTask(execution, event.terminalId, resolvedDefinition);
                }
                else if (event.kind === "processStarted" /* TaskEventKind.ProcessStarted */) {
                    this._proxy.$onDidStartTaskProcess(TaskProcessStartedDTO.from(task.getTaskExecution(), event.processId));
                }
                else if (event.kind === "processEnded" /* TaskEventKind.ProcessEnded */) {
                    this._proxy.$onDidEndTaskProcess(TaskProcessEndedDTO.from(task.getTaskExecution(), event.exitCode));
                }
                else if (event.kind === "end" /* TaskEventKind.End */) {
                    this._proxy.$OnDidEndTask(TaskExecutionDTO.from(task.getTaskExecution()));
                }
            }));
        }
        dispose() {
            for (const value of this._providers.values()) {
                value.disposable.dispose();
            }
            this._providers.clear();
            super.dispose();
        }
        $createTaskId(taskDTO) {
            return new Promise((resolve, reject) => {
                const task = TaskDTO.to(taskDTO, this._workspaceContextServer, true);
                if (task) {
                    resolve(task._id);
                }
                else {
                    reject(new Error('Task could not be created from DTO'));
                }
            });
        }
        $registerTaskProvider(handle, type) {
            const provider = {
                provideTasks: (validTypes) => {
                    return Promise.resolve(this._proxy.$provideTasks(handle, validTypes)).then((value) => {
                        const tasks = [];
                        for (const dto of value.tasks) {
                            const task = TaskDTO.to(dto, this._workspaceContextServer, true);
                            if (task) {
                                tasks.push(task);
                            }
                            else {
                                console.error(`Task System: can not convert task: ${JSON.stringify(dto.definition, undefined, 0)}. Task will be dropped`);
                            }
                        }
                        return {
                            tasks,
                            extension: value.extension
                        };
                    });
                },
                resolveTask: (task) => {
                    const dto = TaskDTO.from(task);
                    if (dto) {
                        dto.name = ((dto.name === undefined) ? '' : dto.name); // Using an empty name causes the name to default to the one given by the provider.
                        return Promise.resolve(this._proxy.$resolveTask(handle, dto)).then(resolvedTask => {
                            if (resolvedTask) {
                                return TaskDTO.to(resolvedTask, this._workspaceContextServer, true, task.configurationProperties.icon, task.configurationProperties.hide);
                            }
                            return undefined;
                        });
                    }
                    return Promise.resolve(undefined);
                }
            };
            const disposable = this._taskService.registerTaskProvider(provider, type);
            this._providers.set(handle, { disposable, provider });
            return Promise.resolve(undefined);
        }
        $unregisterTaskProvider(handle) {
            const provider = this._providers.get(handle);
            if (provider) {
                provider.disposable.dispose();
                this._providers.delete(handle);
            }
            return Promise.resolve(undefined);
        }
        $fetchTasks(filter) {
            return this._taskService.tasks(TaskFilterDTO.to(filter)).then((tasks) => {
                const result = [];
                for (const task of tasks) {
                    const item = TaskDTO.from(task);
                    if (item) {
                        result.push(item);
                    }
                }
                return result;
            });
        }
        getWorkspace(value) {
            let workspace;
            if (typeof value === 'string') {
                workspace = value;
            }
            else {
                const workspaceObject = this._workspaceContextServer.getWorkspace();
                const uri = uri_1.URI.revive(value);
                if (workspaceObject.configuration?.toString() === uri.toString()) {
                    workspace = workspaceObject;
                }
                else {
                    workspace = this._workspaceContextServer.getWorkspaceFolder(uri);
                }
            }
            return workspace;
        }
        async $getTaskExecution(value) {
            if (TaskHandleDTO.is(value)) {
                const workspace = this.getWorkspace(value.workspaceFolder);
                if (workspace) {
                    const task = await this._taskService.getTask(workspace, value.id, true);
                    if (task) {
                        return {
                            id: task._id,
                            task: TaskDTO.from(task)
                        };
                    }
                    throw new Error('Task not found');
                }
                else {
                    throw new Error('No workspace folder');
                }
            }
            else {
                const task = TaskDTO.to(value, this._workspaceContextServer, true);
                return {
                    id: task._id,
                    task: TaskDTO.from(task)
                };
            }
        }
        // Passing in a TaskHandleDTO will cause the task to get re-resolved, which is important for tasks are coming from the core,
        // such as those gotten from a fetchTasks, since they can have missing configuration properties.
        $executeTask(value) {
            return new Promise((resolve, reject) => {
                if (TaskHandleDTO.is(value)) {
                    const workspace = this.getWorkspace(value.workspaceFolder);
                    if (workspace) {
                        this._taskService.getTask(workspace, value.id, true).then((task) => {
                            if (!task) {
                                reject(new Error('Task not found'));
                            }
                            else {
                                const result = {
                                    id: value.id,
                                    task: TaskDTO.from(task)
                                };
                                this._taskService.run(task).then(summary => {
                                    // Ensure that the task execution gets cleaned up if the exit code is undefined
                                    // This can happen when the task has dependent tasks and one of them failed
                                    if ((summary?.exitCode === undefined) || (summary.exitCode !== 0)) {
                                        this._proxy.$OnDidEndTask(result);
                                    }
                                }, reason => {
                                    // eat the error, it has already been surfaced to the user and we don't care about it here
                                });
                                resolve(result);
                            }
                        }, (_error) => {
                            reject(new Error('Task not found'));
                        });
                    }
                    else {
                        reject(new Error('No workspace folder'));
                    }
                }
                else {
                    const task = TaskDTO.to(value, this._workspaceContextServer, true);
                    this._taskService.run(task).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                    const result = {
                        id: task._id,
                        task: TaskDTO.from(task)
                    };
                    resolve(result);
                }
            });
        }
        $customExecutionComplete(id, result) {
            return new Promise((resolve, reject) => {
                this._taskService.getActiveTasks().then((tasks) => {
                    for (const task of tasks) {
                        if (id === task._id) {
                            this._taskService.extensionCallbackTaskComplete(task, result).then((value) => {
                                resolve(undefined);
                            }, (error) => {
                                reject(error);
                            });
                            return;
                        }
                    }
                    reject(new Error('Task to mark as complete not found'));
                });
            });
        }
        $terminateTask(id) {
            return new Promise((resolve, reject) => {
                this._taskService.getActiveTasks().then((tasks) => {
                    for (const task of tasks) {
                        if (id === task._id) {
                            this._taskService.terminate(task).then((value) => {
                                resolve(undefined);
                            }, (error) => {
                                reject(undefined);
                            });
                            return;
                        }
                    }
                    reject(new errors_1.ErrorNoTelemetry('Task to terminate not found'));
                });
            });
        }
        $registerTaskSystem(key, info) {
            let platform;
            switch (info.platform) {
                case 'Web':
                    platform = 0 /* Platform.Platform.Web */;
                    break;
                case 'win32':
                    platform = 3 /* Platform.Platform.Windows */;
                    break;
                case 'darwin':
                    platform = 1 /* Platform.Platform.Mac */;
                    break;
                case 'linux':
                    platform = 2 /* Platform.Platform.Linux */;
                    break;
                default:
                    platform = Platform.platform;
            }
            this._taskService.registerTaskSystem(key, {
                platform: platform,
                uriProvider: (path) => {
                    return uri_1.URI.from({ scheme: info.scheme, authority: info.authority, path });
                },
                context: this._extHostContext,
                resolveVariables: (workspaceFolder, toResolve, target) => {
                    const vars = [];
                    toResolve.variables.forEach(item => vars.push(item));
                    return Promise.resolve(this._proxy.$resolveVariables(workspaceFolder.uri, { process: toResolve.process, variables: vars })).then(values => {
                        const partiallyResolvedVars = Array.from(Object.values(values.variables));
                        return new Promise((resolve, reject) => {
                            this._configurationResolverService.resolveWithInteraction(workspaceFolder, partiallyResolvedVars, 'tasks', undefined, target).then(resolvedVars => {
                                if (!resolvedVars) {
                                    resolve(undefined);
                                }
                                const result = {
                                    process: undefined,
                                    variables: new Map()
                                };
                                for (let i = 0; i < partiallyResolvedVars.length; i++) {
                                    const variableName = vars[i].substring(2, vars[i].length - 1);
                                    if (resolvedVars && values.variables[vars[i]] === vars[i]) {
                                        const resolved = resolvedVars.get(variableName);
                                        if (typeof resolved === 'string') {
                                            result.variables.set(variableName, resolved);
                                        }
                                    }
                                    else {
                                        result.variables.set(variableName, partiallyResolvedVars[i]);
                                    }
                                }
                                if (Types.isString(values.process)) {
                                    result.process = values.process;
                                }
                                resolve(result);
                            }, reason => {
                                reject(reason);
                            });
                        });
                    });
                },
                findExecutable: (command, cwd, paths) => {
                    return this._proxy.$findExecutable(command, cwd, paths);
                }
            });
        }
        async $registerSupportedExecutions(custom, shell, process) {
            return this._taskService.registerSupportedExecutions(custom, shell, process);
        }
    };
    exports.MainThreadTask = MainThreadTask;
    exports.MainThreadTask = MainThreadTask = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTask),
        __param(1, taskService_1.ITaskService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configurationResolver_1.IConfigurationResolverService)
    ], MainThreadTask);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRhc2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxJQUFVLGdCQUFnQixDQU96QjtJQVBELFdBQVUsZ0JBQWdCO1FBQ3pCLFNBQWdCLElBQUksQ0FBQyxLQUFxQjtZQUN6QyxPQUFPO2dCQUNOLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDWixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQzlCLENBQUM7UUFDSCxDQUFDO1FBTGUscUJBQUksT0FLbkIsQ0FBQTtJQUNGLENBQUMsRUFQUyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBT3pCO0lBRUQsSUFBVSxxQkFBcUIsQ0FPOUI7SUFQRCxXQUFVLHFCQUFxQjtRQUM5QixTQUFnQixJQUFJLENBQUMsS0FBcUIsRUFBRSxTQUFpQjtZQUM1RCxPQUFPO2dCQUNOLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDWixTQUFTO2FBQ1QsQ0FBQztRQUNILENBQUM7UUFMZSwwQkFBSSxPQUtuQixDQUFBO0lBQ0YsQ0FBQyxFQVBTLHFCQUFxQixLQUFyQixxQkFBcUIsUUFPOUI7SUFFRCxJQUFVLG1CQUFtQixDQU81QjtJQVBELFdBQVUsbUJBQW1CO1FBQzVCLFNBQWdCLElBQUksQ0FBQyxLQUFxQixFQUFFLFFBQTRCO1lBQ3ZFLE9BQU87Z0JBQ04sRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUNaLFFBQVE7YUFDUixDQUFDO1FBQ0gsQ0FBQztRQUxlLHdCQUFJLE9BS25CLENBQUE7SUFDRixDQUFDLEVBUFMsbUJBQW1CLEtBQW5CLG1CQUFtQixR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