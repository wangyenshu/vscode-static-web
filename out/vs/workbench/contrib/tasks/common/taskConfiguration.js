/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/uuid", "vs/workbench/contrib/tasks/common/problemMatcher", "./tasks", "./taskDefinitionRegistry", "vs/workbench/contrib/tasks/common/taskService"], function (require, exports, nls, Objects, Types, UUID, problemMatcher_1, Tasks, taskDefinitionRegistry_1, taskService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskConfigSource = exports.UUIDMap = exports.JsonSchemaVersion = exports.ExecutionEngine = exports.TaskParser = exports.GroupKind = exports.ProblemMatcherConverter = exports.RunOptions = exports.RunOnOptions = exports.CommandString = exports.ITaskIdentifier = exports.ShellQuoting = void 0;
    exports.parse = parse;
    exports.createCustomTask = createCustomTask;
    var ShellQuoting;
    (function (ShellQuoting) {
        /**
         * Default is character escaping.
         */
        ShellQuoting[ShellQuoting["escape"] = 1] = "escape";
        /**
         * Default is strong quoting
         */
        ShellQuoting[ShellQuoting["strong"] = 2] = "strong";
        /**
         * Default is weak quoting.
         */
        ShellQuoting[ShellQuoting["weak"] = 3] = "weak";
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    var ITaskIdentifier;
    (function (ITaskIdentifier) {
        function is(value) {
            const candidate = value;
            return candidate !== undefined && Types.isString(value.type);
        }
        ITaskIdentifier.is = is;
    })(ITaskIdentifier || (exports.ITaskIdentifier = ITaskIdentifier = {}));
    var CommandString;
    (function (CommandString) {
        function value(value) {
            if (Types.isString(value)) {
                return value;
            }
            else if (Types.isStringArray(value)) {
                return value.join(' ');
            }
            else {
                if (Types.isString(value.value)) {
                    return value.value;
                }
                else {
                    return value.value.join(' ');
                }
            }
        }
        CommandString.value = value;
    })(CommandString || (exports.CommandString = CommandString = {}));
    var ProblemMatcherKind;
    (function (ProblemMatcherKind) {
        ProblemMatcherKind[ProblemMatcherKind["Unknown"] = 0] = "Unknown";
        ProblemMatcherKind[ProblemMatcherKind["String"] = 1] = "String";
        ProblemMatcherKind[ProblemMatcherKind["ProblemMatcher"] = 2] = "ProblemMatcher";
        ProblemMatcherKind[ProblemMatcherKind["Array"] = 3] = "Array";
    })(ProblemMatcherKind || (ProblemMatcherKind = {}));
    const EMPTY_ARRAY = [];
    Object.freeze(EMPTY_ARRAY);
    function assignProperty(target, source, key) {
        const sourceAtKey = source[key];
        if (sourceAtKey !== undefined) {
            target[key] = sourceAtKey;
        }
    }
    function fillProperty(target, source, key) {
        const sourceAtKey = source[key];
        if (target[key] === undefined && sourceAtKey !== undefined) {
            target[key] = sourceAtKey;
        }
    }
    function _isEmpty(value, properties, allowEmptyArray = false) {
        if (value === undefined || value === null || properties === undefined) {
            return true;
        }
        for (const meta of properties) {
            const property = value[meta.property];
            if (property !== undefined && property !== null) {
                if (meta.type !== undefined && !meta.type.isEmpty(property)) {
                    return false;
                }
                else if (!Array.isArray(property) || (property.length > 0) || allowEmptyArray) {
                    return false;
                }
            }
        }
        return true;
    }
    function _assignProperties(target, source, properties) {
        if (!source || _isEmpty(source, properties)) {
            return target;
        }
        if (!target || _isEmpty(target, properties)) {
            return source;
        }
        for (const meta of properties) {
            const property = meta.property;
            let value;
            if (meta.type !== undefined) {
                value = meta.type.assignProperties(target[property], source[property]);
            }
            else {
                value = source[property];
            }
            if (value !== undefined && value !== null) {
                target[property] = value;
            }
        }
        return target;
    }
    function _fillProperties(target, source, properties, allowEmptyArray = false) {
        if (!source || _isEmpty(source, properties)) {
            return target;
        }
        if (!target || _isEmpty(target, properties, allowEmptyArray)) {
            return source;
        }
        for (const meta of properties) {
            const property = meta.property;
            let value;
            if (meta.type) {
                value = meta.type.fillProperties(target[property], source[property]);
            }
            else if (target[property] === undefined) {
                value = source[property];
            }
            if (value !== undefined && value !== null) {
                target[property] = value;
            }
        }
        return target;
    }
    function _fillDefaults(target, defaults, properties, context) {
        if (target && Object.isFrozen(target)) {
            return target;
        }
        if (target === undefined || target === null || defaults === undefined || defaults === null) {
            if (defaults !== undefined && defaults !== null) {
                return Objects.deepClone(defaults);
            }
            else {
                return undefined;
            }
        }
        for (const meta of properties) {
            const property = meta.property;
            if (target[property] !== undefined) {
                continue;
            }
            let value;
            if (meta.type) {
                value = meta.type.fillDefaults(target[property], context);
            }
            else {
                value = defaults[property];
            }
            if (value !== undefined && value !== null) {
                target[property] = value;
            }
        }
        return target;
    }
    function _freeze(target, properties) {
        if (target === undefined || target === null) {
            return undefined;
        }
        if (Object.isFrozen(target)) {
            return target;
        }
        for (const meta of properties) {
            if (meta.type) {
                const value = target[meta.property];
                if (value) {
                    meta.type.freeze(value);
                }
            }
        }
        Object.freeze(target);
        return target;
    }
    var RunOnOptions;
    (function (RunOnOptions) {
        function fromString(value) {
            if (!value) {
                return Tasks.RunOnOptions.default;
            }
            switch (value.toLowerCase()) {
                case 'folderopen':
                    return Tasks.RunOnOptions.folderOpen;
                case 'default':
                default:
                    return Tasks.RunOnOptions.default;
            }
        }
        RunOnOptions.fromString = fromString;
    })(RunOnOptions || (exports.RunOnOptions = RunOnOptions = {}));
    var RunOptions;
    (function (RunOptions) {
        const properties = [{ property: 'reevaluateOnRerun' }, { property: 'runOn' }, { property: 'instanceLimit' }];
        function fromConfiguration(value) {
            return {
                reevaluateOnRerun: value ? value.reevaluateOnRerun : true,
                runOn: value ? RunOnOptions.fromString(value.runOn) : Tasks.RunOnOptions.default,
                instanceLimit: value ? value.instanceLimit : 1
            };
        }
        RunOptions.fromConfiguration = fromConfiguration;
        function assignProperties(target, source) {
            return _assignProperties(target, source, properties);
        }
        RunOptions.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties);
        }
        RunOptions.fillProperties = fillProperties;
    })(RunOptions || (exports.RunOptions = RunOptions = {}));
    var ShellConfiguration;
    (function (ShellConfiguration) {
        const properties = [{ property: 'executable' }, { property: 'args' }, { property: 'quoting' }];
        function is(value) {
            const candidate = value;
            return candidate && (Types.isString(candidate.executable) || Types.isStringArray(candidate.args));
        }
        ShellConfiguration.is = is;
        function from(config, context) {
            if (!is(config)) {
                return undefined;
            }
            const result = {};
            if (config.executable !== undefined) {
                result.executable = config.executable;
            }
            if (config.args !== undefined) {
                result.args = config.args.slice();
            }
            if (config.quoting !== undefined) {
                result.quoting = Objects.deepClone(config.quoting);
            }
            return result;
        }
        ShellConfiguration.from = from;
        function isEmpty(value) {
            return _isEmpty(value, properties, true);
        }
        ShellConfiguration.isEmpty = isEmpty;
        function assignProperties(target, source) {
            return _assignProperties(target, source, properties);
        }
        ShellConfiguration.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties, true);
        }
        ShellConfiguration.fillProperties = fillProperties;
        function fillDefaults(value, context) {
            return value;
        }
        ShellConfiguration.fillDefaults = fillDefaults;
        function freeze(value) {
            if (!value) {
                return undefined;
            }
            return Object.freeze(value);
        }
        ShellConfiguration.freeze = freeze;
    })(ShellConfiguration || (ShellConfiguration = {}));
    var CommandOptions;
    (function (CommandOptions) {
        const properties = [{ property: 'cwd' }, { property: 'env' }, { property: 'shell', type: ShellConfiguration }];
        const defaults = { cwd: '${workspaceFolder}' };
        function from(options, context) {
            const result = {};
            if (options.cwd !== undefined) {
                if (Types.isString(options.cwd)) {
                    result.cwd = options.cwd;
                }
                else {
                    context.taskLoadIssues.push(nls.localize('ConfigurationParser.invalidCWD', 'Warning: options.cwd must be of type string. Ignoring value {0}\n', options.cwd));
                }
            }
            if (options.env !== undefined) {
                result.env = Objects.deepClone(options.env);
            }
            result.shell = ShellConfiguration.from(options.shell, context);
            return isEmpty(result) ? undefined : result;
        }
        CommandOptions.from = from;
        function isEmpty(value) {
            return _isEmpty(value, properties);
        }
        CommandOptions.isEmpty = isEmpty;
        function assignProperties(target, source) {
            if ((source === undefined) || isEmpty(source)) {
                return target;
            }
            if ((target === undefined) || isEmpty(target)) {
                return source;
            }
            assignProperty(target, source, 'cwd');
            if (target.env === undefined) {
                target.env = source.env;
            }
            else if (source.env !== undefined) {
                const env = Object.create(null);
                if (target.env !== undefined) {
                    Object.keys(target.env).forEach(key => env[key] = target.env[key]);
                }
                if (source.env !== undefined) {
                    Object.keys(source.env).forEach(key => env[key] = source.env[key]);
                }
                target.env = env;
            }
            target.shell = ShellConfiguration.assignProperties(target.shell, source.shell);
            return target;
        }
        CommandOptions.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties);
        }
        CommandOptions.fillProperties = fillProperties;
        function fillDefaults(value, context) {
            return _fillDefaults(value, defaults, properties, context);
        }
        CommandOptions.fillDefaults = fillDefaults;
        function freeze(value) {
            return _freeze(value, properties);
        }
        CommandOptions.freeze = freeze;
    })(CommandOptions || (CommandOptions = {}));
    var CommandConfiguration;
    (function (CommandConfiguration) {
        let PresentationOptions;
        (function (PresentationOptions) {
            const properties = [{ property: 'echo' }, { property: 'reveal' }, { property: 'revealProblems' }, { property: 'focus' }, { property: 'panel' }, { property: 'showReuseMessage' }, { property: 'clear' }, { property: 'group' }, { property: 'close' }];
            function from(config, context) {
                let echo;
                let reveal;
                let revealProblems;
                let focus;
                let panel;
                let showReuseMessage;
                let clear;
                let group;
                let close;
                let hasProps = false;
                if (Types.isBoolean(config.echoCommand)) {
                    echo = config.echoCommand;
                    hasProps = true;
                }
                if (Types.isString(config.showOutput)) {
                    reveal = Tasks.RevealKind.fromString(config.showOutput);
                    hasProps = true;
                }
                const presentation = config.presentation || config.terminal;
                if (presentation) {
                    if (Types.isBoolean(presentation.echo)) {
                        echo = presentation.echo;
                    }
                    if (Types.isString(presentation.reveal)) {
                        reveal = Tasks.RevealKind.fromString(presentation.reveal);
                    }
                    if (Types.isString(presentation.revealProblems)) {
                        revealProblems = Tasks.RevealProblemKind.fromString(presentation.revealProblems);
                    }
                    if (Types.isBoolean(presentation.focus)) {
                        focus = presentation.focus;
                    }
                    if (Types.isString(presentation.panel)) {
                        panel = Tasks.PanelKind.fromString(presentation.panel);
                    }
                    if (Types.isBoolean(presentation.showReuseMessage)) {
                        showReuseMessage = presentation.showReuseMessage;
                    }
                    if (Types.isBoolean(presentation.clear)) {
                        clear = presentation.clear;
                    }
                    if (Types.isString(presentation.group)) {
                        group = presentation.group;
                    }
                    if (Types.isBoolean(presentation.close)) {
                        close = presentation.close;
                    }
                    hasProps = true;
                }
                if (!hasProps) {
                    return undefined;
                }
                return { echo: echo, reveal: reveal, revealProblems: revealProblems, focus: focus, panel: panel, showReuseMessage: showReuseMessage, clear: clear, group, close: close };
            }
            PresentationOptions.from = from;
            function assignProperties(target, source) {
                return _assignProperties(target, source, properties);
            }
            PresentationOptions.assignProperties = assignProperties;
            function fillProperties(target, source) {
                return _fillProperties(target, source, properties);
            }
            PresentationOptions.fillProperties = fillProperties;
            function fillDefaults(value, context) {
                const defaultEcho = context.engine === Tasks.ExecutionEngine.Terminal ? true : false;
                return _fillDefaults(value, { echo: defaultEcho, reveal: Tasks.RevealKind.Always, revealProblems: Tasks.RevealProblemKind.Never, focus: false, panel: Tasks.PanelKind.Shared, showReuseMessage: true, clear: false }, properties, context);
            }
            PresentationOptions.fillDefaults = fillDefaults;
            function freeze(value) {
                return _freeze(value, properties);
            }
            PresentationOptions.freeze = freeze;
            function isEmpty(value) {
                return _isEmpty(value, properties);
            }
            PresentationOptions.isEmpty = isEmpty;
        })(PresentationOptions = CommandConfiguration.PresentationOptions || (CommandConfiguration.PresentationOptions = {}));
        let ShellString;
        (function (ShellString) {
            function from(value) {
                if (value === undefined || value === null) {
                    return undefined;
                }
                if (Types.isString(value)) {
                    return value;
                }
                else if (Types.isStringArray(value)) {
                    return value.join(' ');
                }
                else {
                    const quoting = Tasks.ShellQuoting.from(value.quoting);
                    const result = Types.isString(value.value) ? value.value : Types.isStringArray(value.value) ? value.value.join(' ') : undefined;
                    if (result) {
                        return {
                            value: result,
                            quoting: quoting
                        };
                    }
                    else {
                        return undefined;
                    }
                }
            }
            ShellString.from = from;
        })(ShellString || (ShellString = {}));
        const properties = [
            { property: 'runtime' }, { property: 'name' }, { property: 'options', type: CommandOptions },
            { property: 'args' }, { property: 'taskSelector' }, { property: 'suppressTaskName' },
            { property: 'presentation', type: PresentationOptions }
        ];
        function from(config, context) {
            let result = fromBase(config, context);
            let osConfig = undefined;
            if (config.windows && context.platform === 3 /* Platform.Windows */) {
                osConfig = fromBase(config.windows, context);
            }
            else if (config.osx && context.platform === 1 /* Platform.Mac */) {
                osConfig = fromBase(config.osx, context);
            }
            else if (config.linux && context.platform === 2 /* Platform.Linux */) {
                osConfig = fromBase(config.linux, context);
            }
            if (osConfig) {
                result = assignProperties(result, osConfig, context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */);
            }
            return isEmpty(result) ? undefined : result;
        }
        CommandConfiguration.from = from;
        function fromBase(config, context) {
            const name = ShellString.from(config.command);
            let runtime;
            if (Types.isString(config.type)) {
                if (config.type === 'shell' || config.type === 'process') {
                    runtime = Tasks.RuntimeType.fromString(config.type);
                }
            }
            const isShellConfiguration = ShellConfiguration.is(config.isShellCommand);
            if (Types.isBoolean(config.isShellCommand) || isShellConfiguration) {
                runtime = Tasks.RuntimeType.Shell;
            }
            else if (config.isShellCommand !== undefined) {
                runtime = !!config.isShellCommand ? Tasks.RuntimeType.Shell : Tasks.RuntimeType.Process;
            }
            const result = {
                name: name,
                runtime: runtime,
                presentation: PresentationOptions.from(config, context)
            };
            if (config.args !== undefined) {
                result.args = [];
                for (const arg of config.args) {
                    const converted = ShellString.from(arg);
                    if (converted !== undefined) {
                        result.args.push(converted);
                    }
                    else {
                        context.taskLoadIssues.push(nls.localize('ConfigurationParser.inValidArg', 'Error: command argument must either be a string or a quoted string. Provided value is:\n{0}', arg ? JSON.stringify(arg, undefined, 4) : 'undefined'));
                    }
                }
            }
            if (config.options !== undefined) {
                result.options = CommandOptions.from(config.options, context);
                if (result.options && result.options.shell === undefined && isShellConfiguration) {
                    result.options.shell = ShellConfiguration.from(config.isShellCommand, context);
                    if (context.engine !== Tasks.ExecutionEngine.Terminal) {
                        context.taskLoadIssues.push(nls.localize('ConfigurationParser.noShell', 'Warning: shell configuration is only supported when executing tasks in the terminal.'));
                    }
                }
            }
            if (Types.isString(config.taskSelector)) {
                result.taskSelector = config.taskSelector;
            }
            if (Types.isBoolean(config.suppressTaskName)) {
                result.suppressTaskName = config.suppressTaskName;
            }
            return isEmpty(result) ? undefined : result;
        }
        function hasCommand(value) {
            return value && !!value.name;
        }
        CommandConfiguration.hasCommand = hasCommand;
        function isEmpty(value) {
            return _isEmpty(value, properties);
        }
        CommandConfiguration.isEmpty = isEmpty;
        function assignProperties(target, source, overwriteArgs) {
            if (isEmpty(source)) {
                return target;
            }
            if (isEmpty(target)) {
                return source;
            }
            assignProperty(target, source, 'name');
            assignProperty(target, source, 'runtime');
            assignProperty(target, source, 'taskSelector');
            assignProperty(target, source, 'suppressTaskName');
            if (source.args !== undefined) {
                if (target.args === undefined || overwriteArgs) {
                    target.args = source.args;
                }
                else {
                    target.args = target.args.concat(source.args);
                }
            }
            target.presentation = PresentationOptions.assignProperties(target.presentation, source.presentation);
            target.options = CommandOptions.assignProperties(target.options, source.options);
            return target;
        }
        CommandConfiguration.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties);
        }
        CommandConfiguration.fillProperties = fillProperties;
        function fillGlobals(target, source, taskName) {
            if ((source === undefined) || isEmpty(source)) {
                return target;
            }
            target = target || {
                name: undefined,
                runtime: undefined,
                presentation: undefined
            };
            if (target.name === undefined) {
                fillProperty(target, source, 'name');
                fillProperty(target, source, 'taskSelector');
                fillProperty(target, source, 'suppressTaskName');
                let args = source.args ? source.args.slice() : [];
                if (!target.suppressTaskName && taskName) {
                    if (target.taskSelector !== undefined) {
                        args.push(target.taskSelector + taskName);
                    }
                    else {
                        args.push(taskName);
                    }
                }
                if (target.args) {
                    args = args.concat(target.args);
                }
                target.args = args;
            }
            fillProperty(target, source, 'runtime');
            target.presentation = PresentationOptions.fillProperties(target.presentation, source.presentation);
            target.options = CommandOptions.fillProperties(target.options, source.options);
            return target;
        }
        CommandConfiguration.fillGlobals = fillGlobals;
        function fillDefaults(value, context) {
            if (!value || Object.isFrozen(value)) {
                return;
            }
            if (value.name !== undefined && value.runtime === undefined) {
                value.runtime = Tasks.RuntimeType.Process;
            }
            value.presentation = PresentationOptions.fillDefaults(value.presentation, context);
            if (!isEmpty(value)) {
                value.options = CommandOptions.fillDefaults(value.options, context);
            }
            if (value.args === undefined) {
                value.args = EMPTY_ARRAY;
            }
            if (value.suppressTaskName === undefined) {
                value.suppressTaskName = (context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */);
            }
        }
        CommandConfiguration.fillDefaults = fillDefaults;
        function freeze(value) {
            return _freeze(value, properties);
        }
        CommandConfiguration.freeze = freeze;
    })(CommandConfiguration || (CommandConfiguration = {}));
    var ProblemMatcherConverter;
    (function (ProblemMatcherConverter) {
        function namedFrom(declares, context) {
            const result = Object.create(null);
            if (!Array.isArray(declares)) {
                return result;
            }
            declares.forEach((value) => {
                const namedProblemMatcher = (new problemMatcher_1.ProblemMatcherParser(context.problemReporter)).parse(value);
                if ((0, problemMatcher_1.isNamedProblemMatcher)(namedProblemMatcher)) {
                    result[namedProblemMatcher.name] = namedProblemMatcher;
                }
                else {
                    context.problemReporter.error(nls.localize('ConfigurationParser.noName', 'Error: Problem Matcher in declare scope must have a name:\n{0}\n', JSON.stringify(value, undefined, 4)));
                }
            });
            return result;
        }
        ProblemMatcherConverter.namedFrom = namedFrom;
        function fromWithOsConfig(external, context) {
            let result = {};
            if (external.windows && external.windows.problemMatcher && context.platform === 3 /* Platform.Windows */) {
                result = from(external.windows.problemMatcher, context);
            }
            else if (external.osx && external.osx.problemMatcher && context.platform === 1 /* Platform.Mac */) {
                result = from(external.osx.problemMatcher, context);
            }
            else if (external.linux && external.linux.problemMatcher && context.platform === 2 /* Platform.Linux */) {
                result = from(external.linux.problemMatcher, context);
            }
            else if (external.problemMatcher) {
                result = from(external.problemMatcher, context);
            }
            return result;
        }
        ProblemMatcherConverter.fromWithOsConfig = fromWithOsConfig;
        function from(config, context) {
            const result = [];
            if (config === undefined) {
                return { value: result };
            }
            const errors = [];
            function addResult(matcher) {
                if (matcher.value) {
                    result.push(matcher.value);
                }
                if (matcher.errors) {
                    errors.push(...matcher.errors);
                }
            }
            const kind = getProblemMatcherKind(config);
            if (kind === ProblemMatcherKind.Unknown) {
                const error = nls.localize('ConfigurationParser.unknownMatcherKind', 'Warning: the defined problem matcher is unknown. Supported types are string | ProblemMatcher | Array<string | ProblemMatcher>.\n{0}\n', JSON.stringify(config, null, 4));
                context.problemReporter.warn(error);
            }
            else if (kind === ProblemMatcherKind.String || kind === ProblemMatcherKind.ProblemMatcher) {
                addResult(resolveProblemMatcher(config, context));
            }
            else if (kind === ProblemMatcherKind.Array) {
                const problemMatchers = config;
                problemMatchers.forEach(problemMatcher => {
                    addResult(resolveProblemMatcher(problemMatcher, context));
                });
            }
            return { value: result, errors };
        }
        ProblemMatcherConverter.from = from;
        function getProblemMatcherKind(value) {
            if (Types.isString(value)) {
                return ProblemMatcherKind.String;
            }
            else if (Array.isArray(value)) {
                return ProblemMatcherKind.Array;
            }
            else if (!Types.isUndefined(value)) {
                return ProblemMatcherKind.ProblemMatcher;
            }
            else {
                return ProblemMatcherKind.Unknown;
            }
        }
        function resolveProblemMatcher(value, context) {
            if (Types.isString(value)) {
                let variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    variableName = variableName.substring(1);
                    const global = problemMatcher_1.ProblemMatcherRegistry.get(variableName);
                    if (global) {
                        return { value: Objects.deepClone(global) };
                    }
                    let localProblemMatcher = context.namedProblemMatchers[variableName];
                    if (localProblemMatcher) {
                        localProblemMatcher = Objects.deepClone(localProblemMatcher);
                        // remove the name
                        delete localProblemMatcher.name;
                        return { value: localProblemMatcher };
                    }
                }
                return { errors: [nls.localize('ConfigurationParser.invalidVariableReference', 'Error: Invalid problemMatcher reference: {0}\n', value)] };
            }
            else {
                const json = value;
                return { value: new problemMatcher_1.ProblemMatcherParser(context.problemReporter).parse(json) };
            }
        }
    })(ProblemMatcherConverter || (exports.ProblemMatcherConverter = ProblemMatcherConverter = {}));
    const partialSource = {
        label: 'Workspace',
        config: undefined
    };
    var GroupKind;
    (function (GroupKind) {
        function from(external) {
            if (external === undefined) {
                return undefined;
            }
            else if (Types.isString(external) && Tasks.TaskGroup.is(external)) {
                return { _id: external, isDefault: false };
            }
            else if (Types.isString(external.kind) && Tasks.TaskGroup.is(external.kind)) {
                const group = external.kind;
                const isDefault = Types.isUndefined(external.isDefault) ? false : external.isDefault;
                return { _id: group, isDefault };
            }
            return undefined;
        }
        GroupKind.from = from;
        function to(group) {
            if (Types.isString(group)) {
                return group;
            }
            else if (!group.isDefault) {
                return group._id;
            }
            return {
                kind: group._id,
                isDefault: group.isDefault,
            };
        }
        GroupKind.to = to;
    })(GroupKind || (exports.GroupKind = GroupKind = {}));
    var TaskDependency;
    (function (TaskDependency) {
        function uriFromSource(context, source) {
            switch (source) {
                case TaskConfigSource.User: return Tasks.USER_TASKS_GROUP_KEY;
                case TaskConfigSource.TasksJson: return context.workspaceFolder.uri;
                default: return context.workspace && context.workspace.configuration ? context.workspace.configuration : context.workspaceFolder.uri;
            }
        }
        function from(external, context, source) {
            if (Types.isString(external)) {
                return { uri: uriFromSource(context, source), task: external };
            }
            else if (ITaskIdentifier.is(external)) {
                return {
                    uri: uriFromSource(context, source),
                    task: Tasks.TaskDefinition.createTaskIdentifier(external, context.problemReporter)
                };
            }
            else {
                return undefined;
            }
        }
        TaskDependency.from = from;
    })(TaskDependency || (TaskDependency = {}));
    var DependsOrder;
    (function (DependsOrder) {
        function from(order) {
            switch (order) {
                case "sequence" /* Tasks.DependsOrder.sequence */:
                    return "sequence" /* Tasks.DependsOrder.sequence */;
                case "parallel" /* Tasks.DependsOrder.parallel */:
                default:
                    return "parallel" /* Tasks.DependsOrder.parallel */;
            }
        }
        DependsOrder.from = from;
    })(DependsOrder || (DependsOrder = {}));
    var ConfigurationProperties;
    (function (ConfigurationProperties) {
        const properties = [
            { property: 'name' },
            { property: 'identifier' },
            { property: 'group' },
            { property: 'isBackground' },
            { property: 'promptOnClose' },
            { property: 'dependsOn' },
            { property: 'presentation', type: CommandConfiguration.PresentationOptions },
            { property: 'problemMatchers' },
            { property: 'options' },
            { property: 'icon' },
            { property: 'hide' }
        ];
        function from(external, context, includeCommandOptions, source, properties) {
            if (!external) {
                return {};
            }
            const result = {};
            if (properties) {
                for (const propertyName of Object.keys(properties)) {
                    if (external[propertyName] !== undefined) {
                        result[propertyName] = Objects.deepClone(external[propertyName]);
                    }
                }
            }
            if (Types.isString(external.taskName)) {
                result.name = external.taskName;
            }
            if (Types.isString(external.label) && context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */) {
                result.name = external.label;
            }
            if (Types.isString(external.identifier)) {
                result.identifier = external.identifier;
            }
            result.icon = external.icon;
            result.hide = external.hide;
            if (external.isBackground !== undefined) {
                result.isBackground = !!external.isBackground;
            }
            if (external.promptOnClose !== undefined) {
                result.promptOnClose = !!external.promptOnClose;
            }
            result.group = GroupKind.from(external.group);
            if (external.dependsOn !== undefined) {
                if (Array.isArray(external.dependsOn)) {
                    result.dependsOn = external.dependsOn.reduce((dependencies, item) => {
                        const dependency = TaskDependency.from(item, context, source);
                        if (dependency) {
                            dependencies.push(dependency);
                        }
                        return dependencies;
                    }, []);
                }
                else {
                    const dependsOnValue = TaskDependency.from(external.dependsOn, context, source);
                    result.dependsOn = dependsOnValue ? [dependsOnValue] : undefined;
                }
            }
            result.dependsOrder = DependsOrder.from(external.dependsOrder);
            if (includeCommandOptions && (external.presentation !== undefined || external.terminal !== undefined)) {
                result.presentation = CommandConfiguration.PresentationOptions.from(external, context);
            }
            if (includeCommandOptions && (external.options !== undefined)) {
                result.options = CommandOptions.from(external.options, context);
            }
            const configProblemMatcher = ProblemMatcherConverter.fromWithOsConfig(external, context);
            if (configProblemMatcher.value !== undefined) {
                result.problemMatchers = configProblemMatcher.value;
            }
            if (external.detail) {
                result.detail = external.detail;
            }
            return isEmpty(result) ? {} : { value: result, errors: configProblemMatcher.errors };
        }
        ConfigurationProperties.from = from;
        function isEmpty(value) {
            return _isEmpty(value, properties);
        }
        ConfigurationProperties.isEmpty = isEmpty;
    })(ConfigurationProperties || (ConfigurationProperties = {}));
    var ConfiguringTask;
    (function (ConfiguringTask) {
        const grunt = 'grunt.';
        const jake = 'jake.';
        const gulp = 'gulp.';
        const npm = 'vscode.npm.';
        const typescript = 'vscode.typescript.';
        function from(external, context, index, source, registry) {
            if (!external) {
                return undefined;
            }
            const type = external.type;
            const customize = external.customize;
            if (!type && !customize) {
                context.problemReporter.error(nls.localize('ConfigurationParser.noTaskType', 'Error: tasks configuration must have a type property. The configuration will be ignored.\n{0}\n', JSON.stringify(external, null, 4)));
                return undefined;
            }
            const typeDeclaration = type ? registry?.get?.(type) || taskDefinitionRegistry_1.TaskDefinitionRegistry.get(type) : undefined;
            if (!typeDeclaration) {
                const message = nls.localize('ConfigurationParser.noTypeDefinition', 'Error: there is no registered task type \'{0}\'. Did you miss installing an extension that provides a corresponding task provider?', type);
                context.problemReporter.error(message);
                return undefined;
            }
            let identifier;
            if (Types.isString(customize)) {
                if (customize.indexOf(grunt) === 0) {
                    identifier = { type: 'grunt', task: customize.substring(grunt.length) };
                }
                else if (customize.indexOf(jake) === 0) {
                    identifier = { type: 'jake', task: customize.substring(jake.length) };
                }
                else if (customize.indexOf(gulp) === 0) {
                    identifier = { type: 'gulp', task: customize.substring(gulp.length) };
                }
                else if (customize.indexOf(npm) === 0) {
                    identifier = { type: 'npm', script: customize.substring(npm.length + 4) };
                }
                else if (customize.indexOf(typescript) === 0) {
                    identifier = { type: 'typescript', tsconfig: customize.substring(typescript.length + 6) };
                }
            }
            else {
                if (Types.isString(external.type)) {
                    identifier = external;
                }
            }
            if (identifier === undefined) {
                context.problemReporter.error(nls.localize('ConfigurationParser.missingType', 'Error: the task configuration \'{0}\' is missing the required property \'type\'. The task configuration will be ignored.', JSON.stringify(external, undefined, 0)));
                return undefined;
            }
            const taskIdentifier = Tasks.TaskDefinition.createTaskIdentifier(identifier, context.problemReporter);
            if (taskIdentifier === undefined) {
                context.problemReporter.error(nls.localize('ConfigurationParser.incorrectType', 'Error: the task configuration \'{0}\' is using an unknown type. The task configuration will be ignored.', JSON.stringify(external, undefined, 0)));
                return undefined;
            }
            const configElement = {
                workspaceFolder: context.workspaceFolder,
                file: '.vscode/tasks.json',
                index,
                element: external
            };
            let taskSource;
            switch (source) {
                case TaskConfigSource.User: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.User, config: configElement });
                    break;
                }
                case TaskConfigSource.WorkspaceFile: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.WorkspaceFile, config: configElement });
                    break;
                }
                default: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.Workspace, config: configElement });
                    break;
                }
            }
            const result = new Tasks.ConfiguringTask(`${typeDeclaration.extensionId}.${taskIdentifier._key}`, taskSource, undefined, type, taskIdentifier, RunOptions.fromConfiguration(external.runOptions), { hide: external.hide });
            const configuration = ConfigurationProperties.from(external, context, true, source, typeDeclaration.properties);
            result.addTaskLoadMessages(configuration.errors);
            if (configuration.value) {
                result.configurationProperties = Object.assign(result.configurationProperties, configuration.value);
                if (result.configurationProperties.name) {
                    result._label = result.configurationProperties.name;
                }
                else {
                    let label = result.configures.type;
                    if (typeDeclaration.required && typeDeclaration.required.length > 0) {
                        for (const required of typeDeclaration.required) {
                            const value = result.configures[required];
                            if (value) {
                                label = label + ': ' + value;
                                break;
                            }
                        }
                    }
                    result._label = label;
                }
                if (!result.configurationProperties.identifier) {
                    result.configurationProperties.identifier = taskIdentifier._key;
                }
            }
            return result;
        }
        ConfiguringTask.from = from;
    })(ConfiguringTask || (ConfiguringTask = {}));
    var CustomTask;
    (function (CustomTask) {
        function from(external, context, index, source) {
            if (!external) {
                return undefined;
            }
            let type = external.type;
            if (type === undefined || type === null) {
                type = Tasks.CUSTOMIZED_TASK_TYPE;
            }
            if (type !== Tasks.CUSTOMIZED_TASK_TYPE && type !== 'shell' && type !== 'process') {
                context.problemReporter.error(nls.localize('ConfigurationParser.notCustom', 'Error: tasks is not declared as a custom task. The configuration will be ignored.\n{0}\n', JSON.stringify(external, null, 4)));
                return undefined;
            }
            let taskName = external.taskName;
            if (Types.isString(external.label) && context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */) {
                taskName = external.label;
            }
            if (!taskName) {
                context.problemReporter.error(nls.localize('ConfigurationParser.noTaskName', 'Error: a task must provide a label property. The task will be ignored.\n{0}\n', JSON.stringify(external, null, 4)));
                return undefined;
            }
            let taskSource;
            switch (source) {
                case TaskConfigSource.User: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.User, config: { index, element: external, file: '.vscode/tasks.json', workspaceFolder: context.workspaceFolder } });
                    break;
                }
                case TaskConfigSource.WorkspaceFile: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.WorkspaceFile, config: { index, element: external, file: '.vscode/tasks.json', workspaceFolder: context.workspaceFolder, workspace: context.workspace } });
                    break;
                }
                default: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.Workspace, config: { index, element: external, file: '.vscode/tasks.json', workspaceFolder: context.workspaceFolder } });
                    break;
                }
            }
            const result = new Tasks.CustomTask(context.uuidMap.getUUID(taskName), taskSource, taskName, Tasks.CUSTOMIZED_TASK_TYPE, undefined, false, RunOptions.fromConfiguration(external.runOptions), {
                name: taskName,
                identifier: taskName,
            });
            const configuration = ConfigurationProperties.from(external, context, false, source);
            result.addTaskLoadMessages(configuration.errors);
            if (configuration.value) {
                result.configurationProperties = Object.assign(result.configurationProperties, configuration.value);
            }
            const supportLegacy = true; //context.schemaVersion === Tasks.JsonSchemaVersion.V2_0_0;
            if (supportLegacy) {
                const legacy = external;
                if (result.configurationProperties.isBackground === undefined && legacy.isWatching !== undefined) {
                    result.configurationProperties.isBackground = !!legacy.isWatching;
                }
                if (result.configurationProperties.group === undefined) {
                    if (legacy.isBuildCommand === true) {
                        result.configurationProperties.group = Tasks.TaskGroup.Build;
                    }
                    else if (legacy.isTestCommand === true) {
                        result.configurationProperties.group = Tasks.TaskGroup.Test;
                    }
                }
            }
            const command = CommandConfiguration.from(external, context);
            if (command) {
                result.command = command;
            }
            if (external.command !== undefined) {
                // if the task has its own command then we suppress the
                // task name by default.
                command.suppressTaskName = true;
            }
            return result;
        }
        CustomTask.from = from;
        function fillGlobals(task, globals) {
            // We only merge a command from a global definition if there is no dependsOn
            // or there is a dependsOn and a defined command.
            if (CommandConfiguration.hasCommand(task.command) || task.configurationProperties.dependsOn === undefined) {
                task.command = CommandConfiguration.fillGlobals(task.command, globals.command, task.configurationProperties.name);
            }
            if (task.configurationProperties.problemMatchers === undefined && globals.problemMatcher !== undefined) {
                task.configurationProperties.problemMatchers = Objects.deepClone(globals.problemMatcher);
                task.hasDefinedMatchers = true;
            }
            // promptOnClose is inferred from isBackground if available
            if (task.configurationProperties.promptOnClose === undefined && task.configurationProperties.isBackground === undefined && globals.promptOnClose !== undefined) {
                task.configurationProperties.promptOnClose = globals.promptOnClose;
            }
        }
        CustomTask.fillGlobals = fillGlobals;
        function fillDefaults(task, context) {
            CommandConfiguration.fillDefaults(task.command, context);
            if (task.configurationProperties.promptOnClose === undefined) {
                task.configurationProperties.promptOnClose = task.configurationProperties.isBackground !== undefined ? !task.configurationProperties.isBackground : true;
            }
            if (task.configurationProperties.isBackground === undefined) {
                task.configurationProperties.isBackground = false;
            }
            if (task.configurationProperties.problemMatchers === undefined) {
                task.configurationProperties.problemMatchers = EMPTY_ARRAY;
            }
        }
        CustomTask.fillDefaults = fillDefaults;
        function createCustomTask(contributedTask, configuredProps) {
            const result = new Tasks.CustomTask(configuredProps._id, Object.assign({}, configuredProps._source, { customizes: contributedTask.defines }), configuredProps.configurationProperties.name || contributedTask._label, Tasks.CUSTOMIZED_TASK_TYPE, contributedTask.command, false, contributedTask.runOptions, {
                name: configuredProps.configurationProperties.name || contributedTask.configurationProperties.name,
                identifier: configuredProps.configurationProperties.identifier || contributedTask.configurationProperties.identifier,
                icon: configuredProps.configurationProperties.icon,
                hide: configuredProps.configurationProperties.hide
            });
            result.addTaskLoadMessages(configuredProps.taskLoadMessages);
            const resultConfigProps = result.configurationProperties;
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'group');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'isBackground');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'dependsOn');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'problemMatchers');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'promptOnClose');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'detail');
            result.command.presentation = CommandConfiguration.PresentationOptions.assignProperties(result.command.presentation, configuredProps.configurationProperties.presentation);
            result.command.options = CommandOptions.assignProperties(result.command.options, configuredProps.configurationProperties.options);
            result.runOptions = RunOptions.assignProperties(result.runOptions, configuredProps.runOptions);
            const contributedConfigProps = contributedTask.configurationProperties;
            fillProperty(resultConfigProps, contributedConfigProps, 'group');
            fillProperty(resultConfigProps, contributedConfigProps, 'isBackground');
            fillProperty(resultConfigProps, contributedConfigProps, 'dependsOn');
            fillProperty(resultConfigProps, contributedConfigProps, 'problemMatchers');
            fillProperty(resultConfigProps, contributedConfigProps, 'promptOnClose');
            fillProperty(resultConfigProps, contributedConfigProps, 'detail');
            result.command.presentation = CommandConfiguration.PresentationOptions.fillProperties(result.command.presentation, contributedConfigProps.presentation);
            result.command.options = CommandOptions.fillProperties(result.command.options, contributedConfigProps.options);
            result.runOptions = RunOptions.fillProperties(result.runOptions, contributedTask.runOptions);
            if (contributedTask.hasDefinedMatchers === true) {
                result.hasDefinedMatchers = true;
            }
            return result;
        }
        CustomTask.createCustomTask = createCustomTask;
    })(CustomTask || (CustomTask = {}));
    var TaskParser;
    (function (TaskParser) {
        function isCustomTask(value) {
            const type = value.type;
            const customize = value.customize;
            return customize === undefined && (type === undefined || type === null || type === Tasks.CUSTOMIZED_TASK_TYPE || type === 'shell' || type === 'process');
        }
        const builtinTypeContextMap = {
            shell: taskService_1.ShellExecutionSupportedContext,
            process: taskService_1.ProcessExecutionSupportedContext
        };
        function from(externals, globals, context, source, registry) {
            const result = { custom: [], configured: [] };
            if (!externals) {
                return result;
            }
            const defaultBuildTask = { task: undefined, rank: -1 };
            const defaultTestTask = { task: undefined, rank: -1 };
            const schema2_0_0 = context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */;
            const baseLoadIssues = Objects.deepClone(context.taskLoadIssues);
            for (let index = 0; index < externals.length; index++) {
                const external = externals[index];
                const definition = external.type ? registry?.get?.(external.type) || taskDefinitionRegistry_1.TaskDefinitionRegistry.get(external.type) : undefined;
                let typeNotSupported = false;
                if (definition && definition.when && !context.contextKeyService.contextMatchesRules(definition.when)) {
                    typeNotSupported = true;
                }
                else if (!definition && external.type) {
                    for (const key of Object.keys(builtinTypeContextMap)) {
                        if (external.type === key) {
                            typeNotSupported = !taskService_1.ShellExecutionSupportedContext.evaluate(context.contextKeyService.getContext(null));
                            break;
                        }
                    }
                }
                if (typeNotSupported) {
                    context.problemReporter.info(nls.localize('taskConfiguration.providerUnavailable', 'Warning: {0} tasks are unavailable in the current environment.\n', external.type));
                    continue;
                }
                if (isCustomTask(external)) {
                    const customTask = CustomTask.from(external, context, index, source);
                    if (customTask) {
                        CustomTask.fillGlobals(customTask, globals);
                        CustomTask.fillDefaults(customTask, context);
                        if (schema2_0_0) {
                            if ((customTask.command === undefined || customTask.command.name === undefined) && (customTask.configurationProperties.dependsOn === undefined || customTask.configurationProperties.dependsOn.length === 0)) {
                                context.problemReporter.error(nls.localize('taskConfiguration.noCommandOrDependsOn', 'Error: the task \'{0}\' neither specifies a command nor a dependsOn property. The task will be ignored. Its definition is:\n{1}', customTask.configurationProperties.name, JSON.stringify(external, undefined, 4)));
                                continue;
                            }
                        }
                        else {
                            if (customTask.command === undefined || customTask.command.name === undefined) {
                                context.problemReporter.warn(nls.localize('taskConfiguration.noCommand', 'Error: the task \'{0}\' doesn\'t define a command. The task will be ignored. Its definition is:\n{1}', customTask.configurationProperties.name, JSON.stringify(external, undefined, 4)));
                                continue;
                            }
                        }
                        if (customTask.configurationProperties.group === Tasks.TaskGroup.Build && defaultBuildTask.rank < 2) {
                            defaultBuildTask.task = customTask;
                            defaultBuildTask.rank = 2;
                        }
                        else if (customTask.configurationProperties.group === Tasks.TaskGroup.Test && defaultTestTask.rank < 2) {
                            defaultTestTask.task = customTask;
                            defaultTestTask.rank = 2;
                        }
                        else if (customTask.configurationProperties.name === 'build' && defaultBuildTask.rank < 1) {
                            defaultBuildTask.task = customTask;
                            defaultBuildTask.rank = 1;
                        }
                        else if (customTask.configurationProperties.name === 'test' && defaultTestTask.rank < 1) {
                            defaultTestTask.task = customTask;
                            defaultTestTask.rank = 1;
                        }
                        customTask.addTaskLoadMessages(context.taskLoadIssues);
                        result.custom.push(customTask);
                    }
                }
                else {
                    const configuredTask = ConfiguringTask.from(external, context, index, source, registry);
                    if (configuredTask) {
                        configuredTask.addTaskLoadMessages(context.taskLoadIssues);
                        result.configured.push(configuredTask);
                    }
                }
                context.taskLoadIssues = Objects.deepClone(baseLoadIssues);
            }
            // There is some special logic for tasks with the labels "build" and "test".
            // Even if they are not marked as a task group Build or Test, we automagically group them as such.
            // However, if they are already grouped as Build or Test, we don't need to add this grouping.
            const defaultBuildGroupName = Types.isString(defaultBuildTask.task?.configurationProperties.group) ? defaultBuildTask.task?.configurationProperties.group : defaultBuildTask.task?.configurationProperties.group?._id;
            const defaultTestTaskGroupName = Types.isString(defaultTestTask.task?.configurationProperties.group) ? defaultTestTask.task?.configurationProperties.group : defaultTestTask.task?.configurationProperties.group?._id;
            if ((defaultBuildGroupName !== Tasks.TaskGroup.Build._id) && (defaultBuildTask.rank > -1) && (defaultBuildTask.rank < 2) && defaultBuildTask.task) {
                defaultBuildTask.task.configurationProperties.group = Tasks.TaskGroup.Build;
            }
            else if ((defaultTestTaskGroupName !== Tasks.TaskGroup.Test._id) && (defaultTestTask.rank > -1) && (defaultTestTask.rank < 2) && defaultTestTask.task) {
                defaultTestTask.task.configurationProperties.group = Tasks.TaskGroup.Test;
            }
            return result;
        }
        TaskParser.from = from;
        function assignTasks(target, source) {
            if (source === undefined || source.length === 0) {
                return target;
            }
            if (target === undefined || target.length === 0) {
                return source;
            }
            if (source) {
                // Tasks are keyed by ID but we need to merge by name
                const map = Object.create(null);
                target.forEach((task) => {
                    map[task.configurationProperties.name] = task;
                });
                source.forEach((task) => {
                    map[task.configurationProperties.name] = task;
                });
                const newTarget = [];
                target.forEach(task => {
                    newTarget.push(map[task.configurationProperties.name]);
                    delete map[task.configurationProperties.name];
                });
                Object.keys(map).forEach(key => newTarget.push(map[key]));
                target = newTarget;
            }
            return target;
        }
        TaskParser.assignTasks = assignTasks;
    })(TaskParser || (exports.TaskParser = TaskParser = {}));
    var Globals;
    (function (Globals) {
        function from(config, context) {
            let result = fromBase(config, context);
            let osGlobals = undefined;
            if (config.windows && context.platform === 3 /* Platform.Windows */) {
                osGlobals = fromBase(config.windows, context);
            }
            else if (config.osx && context.platform === 1 /* Platform.Mac */) {
                osGlobals = fromBase(config.osx, context);
            }
            else if (config.linux && context.platform === 2 /* Platform.Linux */) {
                osGlobals = fromBase(config.linux, context);
            }
            if (osGlobals) {
                result = Globals.assignProperties(result, osGlobals);
            }
            const command = CommandConfiguration.from(config, context);
            if (command) {
                result.command = command;
            }
            Globals.fillDefaults(result, context);
            Globals.freeze(result);
            return result;
        }
        Globals.from = from;
        function fromBase(config, context) {
            const result = {};
            if (config.suppressTaskName !== undefined) {
                result.suppressTaskName = !!config.suppressTaskName;
            }
            if (config.promptOnClose !== undefined) {
                result.promptOnClose = !!config.promptOnClose;
            }
            if (config.problemMatcher) {
                result.problemMatcher = ProblemMatcherConverter.from(config.problemMatcher, context).value;
            }
            return result;
        }
        Globals.fromBase = fromBase;
        function isEmpty(value) {
            return !value || value.command === undefined && value.promptOnClose === undefined && value.suppressTaskName === undefined;
        }
        Globals.isEmpty = isEmpty;
        function assignProperties(target, source) {
            if (isEmpty(source)) {
                return target;
            }
            if (isEmpty(target)) {
                return source;
            }
            assignProperty(target, source, 'promptOnClose');
            assignProperty(target, source, 'suppressTaskName');
            return target;
        }
        Globals.assignProperties = assignProperties;
        function fillDefaults(value, context) {
            if (!value) {
                return;
            }
            CommandConfiguration.fillDefaults(value.command, context);
            if (value.suppressTaskName === undefined) {
                value.suppressTaskName = (context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */);
            }
            if (value.promptOnClose === undefined) {
                value.promptOnClose = true;
            }
        }
        Globals.fillDefaults = fillDefaults;
        function freeze(value) {
            Object.freeze(value);
            if (value.command) {
                CommandConfiguration.freeze(value.command);
            }
        }
        Globals.freeze = freeze;
    })(Globals || (Globals = {}));
    var ExecutionEngine;
    (function (ExecutionEngine) {
        function from(config) {
            const runner = config.runner || config._runner;
            let result;
            if (runner) {
                switch (runner) {
                    case 'terminal':
                        result = Tasks.ExecutionEngine.Terminal;
                        break;
                    case 'process':
                        result = Tasks.ExecutionEngine.Process;
                        break;
                }
            }
            const schemaVersion = JsonSchemaVersion.from(config);
            if (schemaVersion === 1 /* Tasks.JsonSchemaVersion.V0_1_0 */) {
                return result || Tasks.ExecutionEngine.Process;
            }
            else if (schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */) {
                return Tasks.ExecutionEngine.Terminal;
            }
            else {
                throw new Error('Shouldn\'t happen.');
            }
        }
        ExecutionEngine.from = from;
    })(ExecutionEngine || (exports.ExecutionEngine = ExecutionEngine = {}));
    var JsonSchemaVersion;
    (function (JsonSchemaVersion) {
        const _default = 2 /* Tasks.JsonSchemaVersion.V2_0_0 */;
        function from(config) {
            const version = config.version;
            if (!version) {
                return _default;
            }
            switch (version) {
                case '0.1.0':
                    return 1 /* Tasks.JsonSchemaVersion.V0_1_0 */;
                case '2.0.0':
                    return 2 /* Tasks.JsonSchemaVersion.V2_0_0 */;
                default:
                    return _default;
            }
        }
        JsonSchemaVersion.from = from;
    })(JsonSchemaVersion || (exports.JsonSchemaVersion = JsonSchemaVersion = {}));
    class UUIDMap {
        constructor(other) {
            this.current = Object.create(null);
            if (other) {
                for (const key of Object.keys(other.current)) {
                    const value = other.current[key];
                    if (Array.isArray(value)) {
                        this.current[key] = value.slice();
                    }
                    else {
                        this.current[key] = value;
                    }
                }
            }
        }
        start() {
            this.last = this.current;
            this.current = Object.create(null);
        }
        getUUID(identifier) {
            const lastValue = this.last ? this.last[identifier] : undefined;
            let result = undefined;
            if (lastValue !== undefined) {
                if (Array.isArray(lastValue)) {
                    result = lastValue.shift();
                    if (lastValue.length === 0) {
                        delete this.last[identifier];
                    }
                }
                else {
                    result = lastValue;
                    delete this.last[identifier];
                }
            }
            if (result === undefined) {
                result = UUID.generateUuid();
            }
            const currentValue = this.current[identifier];
            if (currentValue === undefined) {
                this.current[identifier] = result;
            }
            else {
                if (Array.isArray(currentValue)) {
                    currentValue.push(result);
                }
                else {
                    const arrayValue = [currentValue];
                    arrayValue.push(result);
                    this.current[identifier] = arrayValue;
                }
            }
            return result;
        }
        finish() {
            this.last = undefined;
        }
    }
    exports.UUIDMap = UUIDMap;
    var TaskConfigSource;
    (function (TaskConfigSource) {
        TaskConfigSource[TaskConfigSource["TasksJson"] = 0] = "TasksJson";
        TaskConfigSource[TaskConfigSource["WorkspaceFile"] = 1] = "WorkspaceFile";
        TaskConfigSource[TaskConfigSource["User"] = 2] = "User";
    })(TaskConfigSource || (exports.TaskConfigSource = TaskConfigSource = {}));
    class ConfigurationParser {
        constructor(workspaceFolder, workspace, platform, problemReporter, uuidMap) {
            this.workspaceFolder = workspaceFolder;
            this.workspace = workspace;
            this.platform = platform;
            this.problemReporter = problemReporter;
            this.uuidMap = uuidMap;
        }
        run(fileConfig, source, contextKeyService) {
            const engine = ExecutionEngine.from(fileConfig);
            const schemaVersion = JsonSchemaVersion.from(fileConfig);
            const context = {
                workspaceFolder: this.workspaceFolder,
                workspace: this.workspace,
                problemReporter: this.problemReporter,
                uuidMap: this.uuidMap,
                namedProblemMatchers: {},
                engine,
                schemaVersion,
                platform: this.platform,
                taskLoadIssues: [],
                contextKeyService
            };
            const taskParseResult = this.createTaskRunnerConfiguration(fileConfig, context, source);
            return {
                validationStatus: this.problemReporter.status,
                custom: taskParseResult.custom,
                configured: taskParseResult.configured,
                engine
            };
        }
        createTaskRunnerConfiguration(fileConfig, context, source) {
            const globals = Globals.from(fileConfig, context);
            if (this.problemReporter.status.isFatal()) {
                return { custom: [], configured: [] };
            }
            context.namedProblemMatchers = ProblemMatcherConverter.namedFrom(fileConfig.declares, context);
            let globalTasks = undefined;
            let externalGlobalTasks = undefined;
            if (fileConfig.windows && context.platform === 3 /* Platform.Windows */) {
                globalTasks = TaskParser.from(fileConfig.windows.tasks, globals, context, source).custom;
                externalGlobalTasks = fileConfig.windows.tasks;
            }
            else if (fileConfig.osx && context.platform === 1 /* Platform.Mac */) {
                globalTasks = TaskParser.from(fileConfig.osx.tasks, globals, context, source).custom;
                externalGlobalTasks = fileConfig.osx.tasks;
            }
            else if (fileConfig.linux && context.platform === 2 /* Platform.Linux */) {
                globalTasks = TaskParser.from(fileConfig.linux.tasks, globals, context, source).custom;
                externalGlobalTasks = fileConfig.linux.tasks;
            }
            if (context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */ && globalTasks && globalTasks.length > 0 && externalGlobalTasks && externalGlobalTasks.length > 0) {
                const taskContent = [];
                for (const task of externalGlobalTasks) {
                    taskContent.push(JSON.stringify(task, null, 4));
                }
                context.problemReporter.error(nls.localize({ key: 'TaskParse.noOsSpecificGlobalTasks', comment: ['\"Task version 2.0.0\" refers to the 2.0.0 version of the task system. The \"version 2.0.0\" is not localizable as it is a json key and value.'] }, 'Task version 2.0.0 doesn\'t support global OS specific tasks. Convert them to a task with a OS specific command. Affected tasks are:\n{0}', taskContent.join('\n')));
            }
            let result = { custom: [], configured: [] };
            if (fileConfig.tasks) {
                result = TaskParser.from(fileConfig.tasks, globals, context, source);
            }
            if (globalTasks) {
                result.custom = TaskParser.assignTasks(result.custom, globalTasks);
            }
            if ((!result.custom || result.custom.length === 0) && (globals.command && globals.command.name)) {
                const matchers = ProblemMatcherConverter.from(fileConfig.problemMatcher, context).value ?? [];
                const isBackground = fileConfig.isBackground ? !!fileConfig.isBackground : fileConfig.isWatching ? !!fileConfig.isWatching : undefined;
                const name = Tasks.CommandString.value(globals.command.name);
                const task = new Tasks.CustomTask(context.uuidMap.getUUID(name), Object.assign({}, source, { config: { index: -1, element: fileConfig, workspaceFolder: context.workspaceFolder } }), name, Tasks.CUSTOMIZED_TASK_TYPE, {
                    name: undefined,
                    runtime: undefined,
                    presentation: undefined,
                    suppressTaskName: true
                }, false, { reevaluateOnRerun: true }, {
                    name: name,
                    identifier: name,
                    group: Tasks.TaskGroup.Build,
                    isBackground: isBackground,
                    problemMatchers: matchers
                });
                const taskGroupKind = GroupKind.from(fileConfig.group);
                if (taskGroupKind !== undefined) {
                    task.configurationProperties.group = taskGroupKind;
                }
                else if (fileConfig.group === 'none') {
                    task.configurationProperties.group = undefined;
                }
                CustomTask.fillGlobals(task, globals);
                CustomTask.fillDefaults(task, context);
                result.custom = [task];
            }
            result.custom = result.custom || [];
            result.configured = result.configured || [];
            return result;
        }
    }
    const uuidMaps = new Map();
    const recentUuidMaps = new Map();
    function parse(workspaceFolder, workspace, platform, configuration, logger, source, contextKeyService, isRecents = false) {
        const recentOrOtherMaps = isRecents ? recentUuidMaps : uuidMaps;
        let selectedUuidMaps = recentOrOtherMaps.get(source);
        if (!selectedUuidMaps) {
            recentOrOtherMaps.set(source, new Map());
            selectedUuidMaps = recentOrOtherMaps.get(source);
        }
        let uuidMap = selectedUuidMaps.get(workspaceFolder.uri.toString());
        if (!uuidMap) {
            uuidMap = new UUIDMap();
            selectedUuidMaps.set(workspaceFolder.uri.toString(), uuidMap);
        }
        try {
            uuidMap.start();
            return (new ConfigurationParser(workspaceFolder, workspace, platform, logger, uuidMap)).run(configuration, source, contextKeyService);
        }
        finally {
            uuidMap.finish();
        }
    }
    function createCustomTask(contributedTask, configuredProps) {
        return CustomTask.createCustomTask(contributedTask, configuredProps);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza0NvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9jb21tb24vdGFza0NvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa21FaEcsc0JBa0JDO0lBSUQsNENBRUM7SUFqbUVELElBQWtCLFlBZWpCO0lBZkQsV0FBa0IsWUFBWTtRQUM3Qjs7V0FFRztRQUNILG1EQUFVLENBQUE7UUFFVjs7V0FFRztRQUNILG1EQUFVLENBQUE7UUFFVjs7V0FFRztRQUNILCtDQUFRLENBQUE7SUFDVCxDQUFDLEVBZmlCLFlBQVksNEJBQVosWUFBWSxRQWU3QjtJQTJHRCxJQUFpQixlQUFlLENBSy9CO0lBTEQsV0FBaUIsZUFBZTtRQUMvQixTQUFnQixFQUFFLENBQUMsS0FBVTtZQUM1QixNQUFNLFNBQVMsR0FBb0IsS0FBSyxDQUFDO1lBQ3pDLE9BQU8sU0FBUyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBSGUsa0JBQUUsS0FHakIsQ0FBQTtJQUNGLENBQUMsRUFMZ0IsZUFBZSwrQkFBZixlQUFlLFFBSy9CO0lBd0VELElBQWlCLGFBQWEsQ0FjN0I7SUFkRCxXQUFpQixhQUFhO1FBQzdCLFNBQWdCLEtBQUssQ0FBQyxLQUFvQjtZQUN6QyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENB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