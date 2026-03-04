/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry"], function (require, exports, nls, Types, resources, Objects, contextkey_1, taskDefinitionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskDefinition = exports.TasksSchemaProperties = exports.TaskSettingId = exports.KeyedTaskIdentifier = exports.TaskEvent = exports.TaskRunSource = exports.TaskRunType = exports.TaskEventKind = exports.TaskSorter = exports.JsonSchemaVersion = exports.ExecutionEngine = exports.InMemoryTask = exports.ContributedTask = exports.ConfiguringTask = exports.CustomTask = exports.CommonTask = exports.RunOptions = exports.RunOnOptions = exports.DependsOrder = exports.TaskSourceKind = exports.TaskScope = exports.TaskGroup = exports.CommandString = exports.RuntimeType = exports.PresentationOptions = exports.PanelKind = exports.RevealProblemKind = exports.RevealKind = exports.CommandOptions = exports.CUSTOMIZED_TASK_TYPE = exports.ShellQuoting = exports.TASKS_CATEGORY = exports.TASK_RUNNING_STATE = exports.USER_TASKS_GROUP_KEY = void 0;
    exports.USER_TASKS_GROUP_KEY = 'settings';
    exports.TASK_RUNNING_STATE = new contextkey_1.RawContextKey('taskRunning', false, nls.localize('tasks.taskRunningContext', "Whether a task is currently running."));
    exports.TASKS_CATEGORY = nls.localize2('tasksCategory', "Tasks");
    var ShellQuoting;
    (function (ShellQuoting) {
        /**
         * Use character escaping.
         */
        ShellQuoting[ShellQuoting["Escape"] = 1] = "Escape";
        /**
         * Use strong quoting
         */
        ShellQuoting[ShellQuoting["Strong"] = 2] = "Strong";
        /**
         * Use weak quoting.
         */
        ShellQuoting[ShellQuoting["Weak"] = 3] = "Weak";
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    exports.CUSTOMIZED_TASK_TYPE = '$customized';
    (function (ShellQuoting) {
        function from(value) {
            if (!value) {
                return ShellQuoting.Strong;
            }
            switch (value.toLowerCase()) {
                case 'escape':
                    return ShellQuoting.Escape;
                case 'strong':
                    return ShellQuoting.Strong;
                case 'weak':
                    return ShellQuoting.Weak;
                default:
                    return ShellQuoting.Strong;
            }
        }
        ShellQuoting.from = from;
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    var CommandOptions;
    (function (CommandOptions) {
        CommandOptions.defaults = { cwd: '${workspaceFolder}' };
    })(CommandOptions || (exports.CommandOptions = CommandOptions = {}));
    var RevealKind;
    (function (RevealKind) {
        /**
         * Always brings the terminal to front if the task is executed.
         */
        RevealKind[RevealKind["Always"] = 1] = "Always";
        /**
         * Only brings the terminal to front if a problem is detected executing the task
         * e.g. the task couldn't be started,
         * the task ended with an exit code other than zero,
         * or the problem matcher found an error.
         */
        RevealKind[RevealKind["Silent"] = 2] = "Silent";
        /**
         * The terminal never comes to front when the task is executed.
         */
        RevealKind[RevealKind["Never"] = 3] = "Never";
    })(RevealKind || (exports.RevealKind = RevealKind = {}));
    (function (RevealKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'always':
                    return RevealKind.Always;
                case 'silent':
                    return RevealKind.Silent;
                case 'never':
                    return RevealKind.Never;
                default:
                    return RevealKind.Always;
            }
        }
        RevealKind.fromString = fromString;
    })(RevealKind || (exports.RevealKind = RevealKind = {}));
    var RevealProblemKind;
    (function (RevealProblemKind) {
        /**
         * Never reveals the problems panel when this task is executed.
         */
        RevealProblemKind[RevealProblemKind["Never"] = 1] = "Never";
        /**
         * Only reveals the problems panel if a problem is found.
         */
        RevealProblemKind[RevealProblemKind["OnProblem"] = 2] = "OnProblem";
        /**
         * Never reveals the problems panel when this task is executed.
         */
        RevealProblemKind[RevealProblemKind["Always"] = 3] = "Always";
    })(RevealProblemKind || (exports.RevealProblemKind = RevealProblemKind = {}));
    (function (RevealProblemKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'always':
                    return RevealProblemKind.Always;
                case 'never':
                    return RevealProblemKind.Never;
                case 'onproblem':
                    return RevealProblemKind.OnProblem;
                default:
                    return RevealProblemKind.OnProblem;
            }
        }
        RevealProblemKind.fromString = fromString;
    })(RevealProblemKind || (exports.RevealProblemKind = RevealProblemKind = {}));
    var PanelKind;
    (function (PanelKind) {
        /**
         * Shares a panel with other tasks. This is the default.
         */
        PanelKind[PanelKind["Shared"] = 1] = "Shared";
        /**
         * Uses a dedicated panel for this tasks. The panel is not
         * shared with other tasks.
         */
        PanelKind[PanelKind["Dedicated"] = 2] = "Dedicated";
        /**
         * Creates a new panel whenever this task is executed.
         */
        PanelKind[PanelKind["New"] = 3] = "New";
    })(PanelKind || (exports.PanelKind = PanelKind = {}));
    (function (PanelKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'shared':
                    return PanelKind.Shared;
                case 'dedicated':
                    return PanelKind.Dedicated;
                case 'new':
                    return PanelKind.New;
                default:
                    return PanelKind.Shared;
            }
        }
        PanelKind.fromString = fromString;
    })(PanelKind || (exports.PanelKind = PanelKind = {}));
    var PresentationOptions;
    (function (PresentationOptions) {
        PresentationOptions.defaults = {
            echo: true, reveal: RevealKind.Always, revealProblems: RevealProblemKind.Never, focus: false, panel: PanelKind.Shared, showReuseMessage: true, clear: false
        };
    })(PresentationOptions || (exports.PresentationOptions = PresentationOptions = {}));
    var RuntimeType;
    (function (RuntimeType) {
        RuntimeType[RuntimeType["Shell"] = 1] = "Shell";
        RuntimeType[RuntimeType["Process"] = 2] = "Process";
        RuntimeType[RuntimeType["CustomExecution"] = 3] = "CustomExecution";
    })(RuntimeType || (exports.RuntimeType = RuntimeType = {}));
    (function (RuntimeType) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'shell':
                    return RuntimeType.Shell;
                case 'process':
                    return RuntimeType.Process;
                case 'customExecution':
                    return RuntimeType.CustomExecution;
                default:
                    return RuntimeType.Process;
            }
        }
        RuntimeType.fromString = fromString;
        function toString(value) {
            switch (value) {
                case RuntimeType.Shell: return 'shell';
                case RuntimeType.Process: return 'process';
                case RuntimeType.CustomExecution: return 'customExecution';
                default: return 'process';
            }
        }
        RuntimeType.toString = toString;
    })(RuntimeType || (exports.RuntimeType = RuntimeType = {}));
    var CommandString;
    (function (CommandString) {
        function value(value) {
            if (Types.isString(value)) {
                return value;
            }
            else {
                return value.value;
            }
        }
        CommandString.value = value;
    })(CommandString || (exports.CommandString = CommandString = {}));
    var TaskGroup;
    (function (TaskGroup) {
        TaskGroup.Clean = { _id: 'clean', isDefault: false };
        TaskGroup.Build = { _id: 'build', isDefault: false };
        TaskGroup.Rebuild = { _id: 'rebuild', isDefault: false };
        TaskGroup.Test = { _id: 'test', isDefault: false };
        function is(value) {
            return value === TaskGroup.Clean._id || value === TaskGroup.Build._id || value === TaskGroup.Rebuild._id || value === TaskGroup.Test._id;
        }
        TaskGroup.is = is;
        function from(value) {
            if (value === undefined) {
                return undefined;
            }
            else if (Types.isString(value)) {
                if (is(value)) {
                    return { _id: value, isDefault: false };
                }
                return undefined;
            }
            else {
                return value;
            }
        }
        TaskGroup.from = from;
    })(TaskGroup || (exports.TaskGroup = TaskGroup = {}));
    var TaskScope;
    (function (TaskScope) {
        TaskScope[TaskScope["Global"] = 1] = "Global";
        TaskScope[TaskScope["Workspace"] = 2] = "Workspace";
        TaskScope[TaskScope["Folder"] = 3] = "Folder";
    })(TaskScope || (exports.TaskScope = TaskScope = {}));
    var TaskSourceKind;
    (function (TaskSourceKind) {
        TaskSourceKind.Workspace = 'workspace';
        TaskSourceKind.Extension = 'extension';
        TaskSourceKind.InMemory = 'inMemory';
        TaskSourceKind.WorkspaceFile = 'workspaceFile';
        TaskSourceKind.User = 'user';
        function toConfigurationTarget(kind) {
            switch (kind) {
                case TaskSourceKind.User: return 2 /* ConfigurationTarget.USER */;
                case TaskSourceKind.WorkspaceFile: return 5 /* ConfigurationTarget.WORKSPACE */;
                default: return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
        }
        TaskSourceKind.toConfigurationTarget = toConfigurationTarget;
    })(TaskSourceKind || (exports.TaskSourceKind = TaskSourceKind = {}));
    var DependsOrder;
    (function (DependsOrder) {
        DependsOrder["parallel"] = "parallel";
        DependsOrder["sequence"] = "sequence";
    })(DependsOrder || (exports.DependsOrder = DependsOrder = {}));
    var RunOnOptions;
    (function (RunOnOptions) {
        RunOnOptions[RunOnOptions["default"] = 1] = "default";
        RunOnOptions[RunOnOptions["folderOpen"] = 2] = "folderOpen";
    })(RunOnOptions || (exports.RunOnOptions = RunOnOptions = {}));
    var RunOptions;
    (function (RunOptions) {
        RunOptions.defaults = { reevaluateOnRerun: true, runOn: RunOnOptions.default, instanceLimit: 1 };
    })(RunOptions || (exports.RunOptions = RunOptions = {}));
    class CommonTask {
        constructor(id, label, type, runOptions, configurationProperties, source) {
            /**
             * The cached label.
             */
            this._label = '';
            this._id = id;
            if (label) {
                this._label = label;
            }
            if (type) {
                this.type = type;
            }
            this.runOptions = runOptions;
            this.configurationProperties = configurationProperties;
            this._source = source;
        }
        getDefinition(useSource) {
            return undefined;
        }
        getMapKey() {
            return this._id;
        }
        getKey() {
            return undefined;
        }
        getCommonTaskId() {
            const key = { folder: this.getFolderId(), id: this._id };
            return JSON.stringify(key);
        }
        clone() {
            return this.fromObject(Object.assign({}, this));
        }
        getWorkspaceFolder() {
            return undefined;
        }
        getWorkspaceFileName() {
            return undefined;
        }
        getTelemetryKind() {
            return 'unknown';
        }
        matches(key, compareId = false) {
            if (key === undefined) {
                return false;
            }
            if (Types.isString(key)) {
                return key === this._label || key === this.configurationProperties.identifier || (compareId && key === this._id);
            }
            const identifier = this.getDefinition(true);
            return identifier !== undefined && identifier._key === key._key;
        }
        getQualifiedLabel() {
            const workspaceFolder = this.getWorkspaceFolder();
            if (workspaceFolder) {
                return `${this._label} (${workspaceFolder.name})`;
            }
            else {
                return this._label;
            }
        }
        getTaskExecution() {
            const result = {
                id: this._id,
                task: this
            };
            return result;
        }
        addTaskLoadMessages(messages) {
            if (this._taskLoadMessages === undefined) {
                this._taskLoadMessages = [];
            }
            if (messages) {
                this._taskLoadMessages = this._taskLoadMessages.concat(messages);
            }
        }
        get taskLoadMessages() {
            return this._taskLoadMessages;
        }
    }
    exports.CommonTask = CommonTask;
    /**
     * For tasks of type shell or process, this is created upon parse
     * of the tasks.json or workspace file.
     * For ContributedTasks of all other types, this is the result of
     * resolving a ConfiguringTask.
     */
    class CustomTask extends CommonTask {
        constructor(id, source, label, type, command, hasDefinedMatchers, runOptions, configurationProperties) {
            super(id, label, undefined, runOptions, configurationProperties, source);
            /**
             * The command configuration
             */
            this.command = {};
            this._source = source;
            this.hasDefinedMatchers = hasDefinedMatchers;
            if (command) {
                this.command = command;
            }
        }
        clone() {
            return new CustomTask(this._id, this._source, this._label, this.type, this.command, this.hasDefinedMatchers, this.runOptions, this.configurationProperties);
        }
        customizes() {
            if (this._source && this._source.customizes) {
                return this._source.customizes;
            }
            return undefined;
        }
        getDefinition(useSource = false) {
            if (useSource && this._source.customizes !== undefined) {
                return this._source.customizes;
            }
            else {
                let type;
                const commandRuntime = this.command ? this.command.runtime : undefined;
                switch (commandRuntime) {
                    case RuntimeType.Shell:
                        type = 'shell';
                        break;
                    case RuntimeType.Process:
                        type = 'process';
                        break;
                    case RuntimeType.CustomExecution:
                        type = 'customExecution';
                        break;
                    case undefined:
                        type = '$composite';
                        break;
                    default:
                        throw new Error('Unexpected task runtime');
                }
                const result = {
                    type,
                    _key: this._id,
                    id: this._id
                };
                return result;
            }
        }
        static is(value) {
            return value instanceof CustomTask;
        }
        getMapKey() {
            const workspaceFolder = this._source.config.workspaceFolder;
            return workspaceFolder ? `${workspaceFolder.uri.toString()}|${this._id}|${this.instance}` : `${this._id}|${this.instance}`;
        }
        getFolderId() {
            return this._source.kind === TaskSourceKind.User ? exports.USER_TASKS_GROUP_KEY : this._source.config.workspaceFolder?.uri.toString();
        }
        getCommonTaskId() {
            return this._source.customizes ? super.getCommonTaskId() : (this.getKey() ?? super.getCommonTaskId());
        }
        /**
         * @returns A key representing the task
         */
        getKey() {
            const workspaceFolder = this.getFolderId();
            if (!workspaceFolder) {
                return undefined;
            }
            let id = this.configurationProperties.identifier;
            if (this._source.kind !== TaskSourceKind.Workspace) {
                id += this._source.kind;
            }
            const key = { type: exports.CUSTOMIZED_TASK_TYPE, folder: workspaceFolder, id };
            return JSON.stringify(key);
        }
        getWorkspaceFolder() {
            return this._source.config.workspaceFolder;
        }
        getWorkspaceFileName() {
            return (this._source.config.workspace && this._source.config.workspace.configuration) ? resources.basename(this._source.config.workspace.configuration) : undefined;
        }
        getTelemetryKind() {
            if (this._source.customizes) {
                return 'workspace>extension';
            }
            else {
                return 'workspace';
            }
        }
        fromObject(object) {
            return new CustomTask(object._id, object._source, object._label, object.type, object.command, object.hasDefinedMatchers, object.runOptions, object.configurationProperties);
        }
    }
    exports.CustomTask = CustomTask;
    /**
     * After a contributed task has been parsed, but before
     * the task has been resolved via the extension, its properties
     * are stored in this
     */
    class ConfiguringTask extends CommonTask {
        constructor(id, source, label, type, configures, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this._source = source;
            this.configures = configures;
        }
        static is(value) {
            return value instanceof ConfiguringTask;
        }
        fromObject(object) {
            return object;
        }
        getDefinition() {
            return this.configures;
        }
        getWorkspaceFileName() {
            return (this._source.config.workspace && this._source.config.workspace.configuration) ? resources.basename(this._source.config.workspace.configuration) : undefined;
        }
        getWorkspaceFolder() {
            return this._source.config.workspaceFolder;
        }
        getFolderId() {
            return this._source.kind === TaskSourceKind.User ? exports.USER_TASKS_GROUP_KEY : this._source.config.workspaceFolder?.uri.toString();
        }
        getKey() {
            const workspaceFolder = this.getFolderId();
            if (!workspaceFolder) {
                return undefined;
            }
            let id = this.configurationProperties.identifier;
            if (this._source.kind !== TaskSourceKind.Workspace) {
                id += this._source.kind;
            }
            const key = { type: exports.CUSTOMIZED_TASK_TYPE, folder: workspaceFolder, id };
            return JSON.stringify(key);
        }
    }
    exports.ConfiguringTask = ConfiguringTask;
    /**
     * A task from an extension created via resolveTask or provideTask
     */
    class ContributedTask extends CommonTask {
        constructor(id, source, label, type, defines, command, hasDefinedMatchers, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this.defines = defines;
            this.hasDefinedMatchers = hasDefinedMatchers;
            this.command = command;
            this.icon = configurationProperties.icon;
            this.hide = configurationProperties.hide;
        }
        clone() {
            return new ContributedTask(this._id, this._source, this._label, this.type, this.defines, this.command, this.hasDefinedMatchers, this.runOptions, this.configurationProperties);
        }
        getDefinition() {
            return this.defines;
        }
        static is(value) {
            return value instanceof ContributedTask;
        }
        getMapKey() {
            const workspaceFolder = this._source.workspaceFolder;
            return workspaceFolder
                ? `${this._source.scope.toString()}|${workspaceFolder.uri.toString()}|${this._id}|${this.instance}`
                : `${this._source.scope.toString()}|${this._id}|${this.instance}`;
        }
        getFolderId() {
            if (this._source.scope === 3 /* TaskScope.Folder */ && this._source.workspaceFolder) {
                return this._source.workspaceFolder.uri.toString();
            }
            return undefined;
        }
        getKey() {
            const key = { type: 'contributed', scope: this._source.scope, id: this._id };
            key.folder = this.getFolderId();
            return JSON.stringify(key);
        }
        getWorkspaceFolder() {
            return this._source.workspaceFolder;
        }
        getTelemetryKind() {
            return 'extension';
        }
        fromObject(object) {
            return new ContributedTask(object._id, object._source, object._label, object.type, object.defines, object.command, object.hasDefinedMatchers, object.runOptions, object.configurationProperties);
        }
    }
    exports.ContributedTask = ContributedTask;
    class InMemoryTask extends CommonTask {
        constructor(id, source, label, type, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this._source = source;
        }
        clone() {
            return new InMemoryTask(this._id, this._source, this._label, this.type, this.runOptions, this.configurationProperties);
        }
        static is(value) {
            return value instanceof InMemoryTask;
        }
        getTelemetryKind() {
            return 'composite';
        }
        getMapKey() {
            return `${this._id}|${this.instance}`;
        }
        getFolderId() {
            return undefined;
        }
        fromObject(object) {
            return new InMemoryTask(object._id, object._source, object._label, object.type, object.runOptions, object.configurationProperties);
        }
    }
    exports.InMemoryTask = InMemoryTask;
    var ExecutionEngine;
    (function (ExecutionEngine) {
        ExecutionEngine[ExecutionEngine["Process"] = 1] = "Process";
        ExecutionEngine[ExecutionEngine["Terminal"] = 2] = "Terminal";
    })(ExecutionEngine || (exports.ExecutionEngine = ExecutionEngine = {}));
    (function (ExecutionEngine) {
        ExecutionEngine._default = ExecutionEngine.Terminal;
    })(ExecutionEngine || (exports.ExecutionEngine = ExecutionEngine = {}));
    var JsonSchemaVersion;
    (function (JsonSchemaVersion) {
        JsonSchemaVersion[JsonSchemaVersion["V0_1_0"] = 1] = "V0_1_0";
        JsonSchemaVersion[JsonSchemaVersion["V2_0_0"] = 2] = "V2_0_0";
    })(JsonSchemaVersion || (exports.JsonSchemaVersion = JsonSchemaVersion = {}));
    class TaskSorter {
        constructor(workspaceFolders) {
            this._order = new Map();
            for (let i = 0; i < workspaceFolders.length; i++) {
                this._order.set(workspaceFolders[i].uri.toString(), i);
            }
        }
        compare(a, b) {
            const aw = a.getWorkspaceFolder();
            const bw = b.getWorkspaceFolder();
            if (aw && bw) {
                let ai = this._order.get(aw.uri.toString());
                ai = ai === undefined ? 0 : ai + 1;
                let bi = this._order.get(bw.uri.toString());
                bi = bi === undefined ? 0 : bi + 1;
                if (ai === bi) {
                    return a._label.localeCompare(b._label);
                }
                else {
                    return ai - bi;
                }
            }
            else if (!aw && bw) {
                return -1;
            }
            else if (aw && !bw) {
                return +1;
            }
            else {
                return 0;
            }
        }
    }
    exports.TaskSorter = TaskSorter;
    var TaskEventKind;
    (function (TaskEventKind) {
        TaskEventKind["DependsOnStarted"] = "dependsOnStarted";
        TaskEventKind["AcquiredInput"] = "acquiredInput";
        TaskEventKind["Start"] = "start";
        TaskEventKind["ProcessStarted"] = "processStarted";
        TaskEventKind["Active"] = "active";
        TaskEventKind["Inactive"] = "inactive";
        TaskEventKind["Changed"] = "changed";
        TaskEventKind["Terminated"] = "terminated";
        TaskEventKind["ProcessEnded"] = "processEnded";
        TaskEventKind["End"] = "end";
    })(TaskEventKind || (exports.TaskEventKind = TaskEventKind = {}));
    var TaskRunType;
    (function (TaskRunType) {
        TaskRunType["SingleRun"] = "singleRun";
        TaskRunType["Background"] = "background";
    })(TaskRunType || (exports.TaskRunType = TaskRunType = {}));
    var TaskRunSource;
    (function (TaskRunSource) {
        TaskRunSource[TaskRunSource["System"] = 0] = "System";
        TaskRunSource[TaskRunSource["User"] = 1] = "User";
        TaskRunSource[TaskRunSource["FolderOpen"] = 2] = "FolderOpen";
        TaskRunSource[TaskRunSource["ConfigurationChange"] = 3] = "ConfigurationChange";
        TaskRunSource[TaskRunSource["Reconnect"] = 4] = "Reconnect";
    })(TaskRunSource || (exports.TaskRunSource = TaskRunSource = {}));
    var TaskEvent;
    (function (TaskEvent) {
        function common(task) {
            return {
                taskId: task._id,
                taskName: task.configurationProperties.name,
                runType: task.configurationProperties.isBackground ? "background" /* TaskRunType.Background */ : "singleRun" /* TaskRunType.SingleRun */,
                group: task.configurationProperties.group,
                __task: task,
            };
        }
        function start(task, terminalId, resolvedVariables) {
            return {
                ...common(task),
                kind: "start" /* TaskEventKind.Start */,
                terminalId,
                resolvedVariables,
            };
        }
        TaskEvent.start = start;
        function processStarted(task, terminalId, processId) {
            return {
                ...common(task),
                kind: "processStarted" /* TaskEventKind.ProcessStarted */,
                terminalId,
                processId,
            };
        }
        TaskEvent.processStarted = processStarted;
        function processEnded(task, terminalId, exitCode) {
            return {
                ...common(task),
                kind: "processEnded" /* TaskEventKind.ProcessEnded */,
                terminalId,
                exitCode,
            };
        }
        TaskEvent.processEnded = processEnded;
        function terminated(task, terminalId, exitReason) {
            return {
                ...common(task),
                kind: "terminated" /* TaskEventKind.Terminated */,
                exitReason,
                terminalId,
            };
        }
        TaskEvent.terminated = terminated;
        function general(kind, task, terminalId) {
            return {
                ...common(task),
                kind,
                terminalId,
            };
        }
        TaskEvent.general = general;
        function changed() {
            return { kind: "changed" /* TaskEventKind.Changed */ };
        }
        TaskEvent.changed = changed;
    })(TaskEvent || (exports.TaskEvent = TaskEvent = {}));
    var KeyedTaskIdentifier;
    (function (KeyedTaskIdentifier) {
        function sortedStringify(literal) {
            const keys = Object.keys(literal).sort();
            let result = '';
            for (const key of keys) {
                let stringified = literal[key];
                if (stringified instanceof Object) {
                    stringified = sortedStringify(stringified);
                }
                else if (typeof stringified === 'string') {
                    stringified = stringified.replace(/,/g, ',,');
                }
                result += key + ',' + stringified + ',';
            }
            return result;
        }
        function create(value) {
            const resultKey = sortedStringify(value);
            const result = { _key: resultKey, type: value.taskType };
            Object.assign(result, value);
            return result;
        }
        KeyedTaskIdentifier.create = create;
    })(KeyedTaskIdentifier || (exports.KeyedTaskIdentifier = KeyedTaskIdentifier = {}));
    var TaskSettingId;
    (function (TaskSettingId) {
        TaskSettingId["AutoDetect"] = "task.autoDetect";
        TaskSettingId["SaveBeforeRun"] = "task.saveBeforeRun";
        TaskSettingId["ShowDecorations"] = "task.showDecorations";
        TaskSettingId["ProblemMatchersNeverPrompt"] = "task.problemMatchers.neverPrompt";
        TaskSettingId["SlowProviderWarning"] = "task.slowProviderWarning";
        TaskSettingId["QuickOpenHistory"] = "task.quickOpen.history";
        TaskSettingId["QuickOpenDetail"] = "task.quickOpen.detail";
        TaskSettingId["QuickOpenSkip"] = "task.quickOpen.skip";
        TaskSettingId["QuickOpenShowAll"] = "task.quickOpen.showAll";
        TaskSettingId["AllowAutomaticTasks"] = "task.allowAutomaticTasks";
        TaskSettingId["Reconnection"] = "task.reconnection";
        TaskSettingId["VerboseLogging"] = "task.verboseLogging";
    })(TaskSettingId || (exports.TaskSettingId = TaskSettingId = {}));
    var TasksSchemaProperties;
    (function (TasksSchemaProperties) {
        TasksSchemaProperties["Tasks"] = "tasks";
        TasksSchemaProperties["SuppressTaskName"] = "tasks.suppressTaskName";
        TasksSchemaProperties["Windows"] = "tasks.windows";
        TasksSchemaProperties["Osx"] = "tasks.osx";
        TasksSchemaProperties["Linux"] = "tasks.linux";
        TasksSchemaProperties["ShowOutput"] = "tasks.showOutput";
        TasksSchemaProperties["IsShellCommand"] = "tasks.isShellCommand";
        TasksSchemaProperties["ServiceTestSetting"] = "tasks.service.testSetting";
    })(TasksSchemaProperties || (exports.TasksSchemaProperties = TasksSchemaProperties = {}));
    var TaskDefinition;
    (function (TaskDefinition) {
        function createTaskIdentifier(external, reporter) {
            const definition = taskDefinitionRegistry_1.TaskDefinitionRegistry.get(external.type);
            if (definition === undefined) {
                // We have no task definition so we can't sanitize the literal. Take it as is
                const copy = Objects.deepClone(external);
                delete copy._key;
                return KeyedTaskIdentifier.create(copy);
            }
            const literal = Object.create(null);
            literal.type = definition.taskType;
            const required = new Set();
            definition.required.forEach(element => required.add(element));
            const properties = definition.properties;
            for (const property of Object.keys(properties)) {
                const value = external[property];
                if (value !== undefined && value !== null) {
                    literal[property] = value;
                }
                else if (required.has(property)) {
                    const schema = properties[property];
                    if (schema.default !== undefined) {
                        literal[property] = Objects.deepClone(schema.default);
                    }
                    else {
                        switch (schema.type) {
                            case 'boolean':
                                literal[property] = false;
                                break;
                            case 'number':
                            case 'integer':
                                literal[property] = 0;
                                break;
                            case 'string':
                                literal[property] = '';
                                break;
                            default:
                                reporter.error(nls.localize('TaskDefinition.missingRequiredProperty', 'Error: the task identifier \'{0}\' is missing the required property \'{1}\'. The task identifier will be ignored.', JSON.stringify(external, undefined, 0), property));
                                return undefined;
                        }
                    }
                }
            }
            return KeyedTaskIdentifier.create(literal);
        }
        TaskDefinition.createTaskIdentifier = createTaskIdentifier;
    })(TaskDefinition || (exports.TaskDefinition = TaskDefinition = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9jb21tb24vdGFza3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJuRixRQUFBLG9CQUFvQixHQUFHLFVBQVUsQ0FBQztJQUVsQyxRQUFBLGtCQUFrQixHQUFHLElBQUksMEJBQWEsQ0FBVSxhQUFhLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO0lBQ3hKLFFBQUEsY0FBYyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLElBQVksWUFlWDtJQWZELFdBQVksWUFBWTtRQUN2Qjs7V0FFRztRQUNILG1EQUFVLENBQUE7UUFFVjs7V0FFRztRQUNILG1EQUFVLENBQUE7UUFFVjs7V0FFRztRQUNILCtDQUFRLENBQUE7SUFDVCxDQUFDLEVBZlcsWUFBWSw0QkFBWixZQUFZLFFBZXZCO0lBRVksUUFBQSxvQkFBb0IsR0FBRyxhQUFhLENBQUM7SUFFbEQsV0FBaUIsWUFBWTtRQUM1QixTQUFnQixJQUFJLENBQWEsS0FBYTtZQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDO1lBQzVCLENBQUM7WUFDRCxRQUFRLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUM3QixLQUFLLFFBQVE7b0JBQ1osT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDO2dCQUM1QixLQUFLLFFBQVE7b0JBQ1osT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDO2dCQUM1QixLQUFLLE1BQU07b0JBQ1YsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFD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