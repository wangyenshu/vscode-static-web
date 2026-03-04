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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/progress/common/progress", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/output/common/output", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/common/contributions", "vs/workbench/contrib/tasks/browser/runAutomaticTasks", "vs/platform/keybinding/common/keybindingsRegistry", "../common/jsonSchema_v1", "../common/jsonSchema_v2", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/workbench/services/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/contextkeys", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/tasks/browser/tasksQuickAccess", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/base/common/types", "vs/base/common/async"], function (require, exports, nls, lifecycle_1, platform_1, actions_1, problemMatcher_1, progress_1, jsonContributionRegistry, statusbar_1, output_1, tasks_1, taskService_1, contributions_1, runAutomaticTasks_1, keybindingsRegistry_1, jsonSchema_v1_1, jsonSchema_v2_1, abstractTaskService_1, configuration_1, configurationRegistry_1, contextkeys_1, quickAccess_1, tasksQuickAccess_1, contextkey_1, taskDefinitionRegistry_1, types_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskStatusBarContributions = void 0;
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(runAutomaticTasks_1.RunAutomaticTasks, 4 /* LifecyclePhase.Eventually */);
    (0, actions_1.registerAction2)(runAutomaticTasks_1.ManageAutomaticTaskRunning);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: runAutomaticTasks_1.ManageAutomaticTaskRunning.ID,
            title: runAutomaticTasks_1.ManageAutomaticTaskRunning.LABEL,
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    let TaskStatusBarContributions = class TaskStatusBarContributions extends lifecycle_1.Disposable {
        constructor(_taskService, _statusbarService, _progressService) {
            super();
            this._taskService = _taskService;
            this._statusbarService = _statusbarService;
            this._progressService = _progressService;
            this._activeTasksCount = 0;
            this._registerListeners();
        }
        _registerListeners() {
            let promise = undefined;
            let resolve;
            this._register(this._taskService.onDidStateChange(event => {
                if (event.kind === "changed" /* TaskEventKind.Changed */) {
                    this._updateRunningTasksStatus();
                }
                if (!this._ignoreEventForUpdateRunningTasksCount(event)) {
                    switch (event.kind) {
                        case "active" /* TaskEventKind.Active */:
                            this._activeTasksCount++;
                            if (this._activeTasksCount === 1) {
                                if (!promise) {
                                    ({ promise, resolve } = (0, async_1.promiseWithResolvers)());
                                }
                            }
                            break;
                        case "inactive" /* TaskEventKind.Inactive */:
                            // Since the exiting of the sub process is communicated async we can't order inactive and terminate events.
                            // So try to treat them accordingly.
                            if (this._activeTasksCount > 0) {
                                this._activeTasksCount--;
                                if (this._activeTasksCount === 0) {
                                    if (promise && resolve) {
                                        resolve();
                                    }
                                }
                            }
                            break;
                        case "terminated" /* TaskEventKind.Terminated */:
                            if (this._activeTasksCount !== 0) {
                                this._activeTasksCount = 0;
                                if (promise && resolve) {
                                    resolve();
                                }
                            }
                            break;
                    }
                }
                if (promise && (event.kind === "active" /* TaskEventKind.Active */) && (this._activeTasksCount === 1)) {
                    this._progressService.withProgress({ location: 10 /* ProgressLocation.Window */, command: 'workbench.action.tasks.showTasks', type: 'loading' }, progress => {
                        progress.report({ message: nls.localize('building', 'Building...') });
                        return promise;
                    }).then(() => {
                        promise = undefined;
                    });
                }
            }));
        }
        async _updateRunningTasksStatus() {
            const tasks = await this._taskService.getActiveTasks();
            if (tasks.length === 0) {
                if (this._runningTasksStatusItem) {
                    this._runningTasksStatusItem.dispose();
                    this._runningTasksStatusItem = undefined;
                }
            }
            else {
                const itemProps = {
                    name: nls.localize('status.runningTasks', "Running Tasks"),
                    text: `$(tools) ${tasks.length}`,
                    ariaLabel: nls.localize('numberOfRunningTasks', "{0} running tasks", tasks.length),
                    tooltip: nls.localize('runningTasks', "Show Running Tasks"),
                    command: 'workbench.action.tasks.showTasks',
                };
                if (!this._runningTasksStatusItem) {
                    this._runningTasksStatusItem = this._statusbarService.addEntry(itemProps, 'status.runningTasks', 0 /* StatusbarAlignment.LEFT */, 49 /* Medium Priority, next to Markers */);
                }
                else {
                    this._runningTasksStatusItem.update(itemProps);
                }
            }
        }
        _ignoreEventForUpdateRunningTasksCount(event) {
            if (!this._taskService.inTerminal() || event.kind === "changed" /* TaskEventKind.Changed */) {
                return false;
            }
            if (((0, types_1.isString)(event.group) ? event.group : event.group?._id) !== tasks_1.TaskGroup.Build._id) {
                return true;
            }
            return event.__task.configurationProperties.problemMatchers === undefined || event.__task.configurationProperties.problemMatchers.length === 0;
        }
    };
    exports.TaskStatusBarContributions = TaskStatusBarContributions;
    exports.TaskStatusBarContributions = TaskStatusBarContributions = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, progress_1.IProgressService)
    ], TaskStatusBarContributions);
    workbenchRegistry.registerWorkbenchContribution(TaskStatusBarContributions, 3 /* LifecyclePhase.Restored */);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "3_run" /* TerminalMenuBarGroup.Run */,
        command: {
            id: 'workbench.action.tasks.runTask',
            title: nls.localize({ key: 'miRunTask', comment: ['&& denotes a mnemonic'] }, "&&Run Task...")
        },
        order: 1,
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "3_run" /* TerminalMenuBarGroup.Run */,
        command: {
            id: 'workbench.action.tasks.build',
            title: nls.localize({ key: 'miBuildTask', comment: ['&& denotes a mnemonic'] }, "Run &&Build Task...")
        },
        order: 2,
        when: taskService_1.TaskExecutionSupportedContext
    });
    // Manage Tasks
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "5_manage" /* TerminalMenuBarGroup.Manage */,
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.showTasks',
            title: nls.localize({ key: 'miRunningTask', comment: ['&& denotes a mnemonic'] }, "Show Runnin&&g Tasks...")
        },
        order: 1,
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "5_manage" /* TerminalMenuBarGroup.Manage */,
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.restartTask',
            title: nls.localize({ key: 'miRestartTask', comment: ['&& denotes a mnemonic'] }, "R&&estart Running Task...")
        },
        order: 2,
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "5_manage" /* TerminalMenuBarGroup.Manage */,
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.terminate',
            title: nls.localize({ key: 'miTerminateTask', comment: ['&& denotes a mnemonic'] }, "&&Terminate Task...")
        },
        order: 3,
        when: taskService_1.TaskExecutionSupportedContext
    });
    // Configure Tasks
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "7_configure" /* TerminalMenuBarGroup.Configure */,
        command: {
            id: 'workbench.action.tasks.configureTaskRunner',
            title: nls.localize({ key: 'miConfigureTask', comment: ['&& denotes a mnemonic'] }, "&&Configure Tasks...")
        },
        order: 1,
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
        group: "7_configure" /* TerminalMenuBarGroup.Configure */,
        command: {
            id: 'workbench.action.tasks.configureDefaultBuildTask',
            title: nls.localize({ key: 'miConfigureBuildTask', comment: ['&& denotes a mnemonic'] }, "Configure De&&fault Build Task...")
        },
        order: 2,
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.openWorkspaceFileTasks',
            title: nls.localize2('workbench.action.tasks.openWorkspaceFileTasks', "Open Workspace Tasks"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), taskService_1.TaskExecutionSupportedContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: abstractTaskService_1.ConfigureTaskAction.ID,
            title: abstractTaskService_1.ConfigureTaskAction.TEXT,
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.showLog',
            title: nls.localize2('ShowLogAction.label', "Show Task Log"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.runTask',
            title: nls.localize2('RunTaskAction.label', "Run Task"),
            category: tasks_1.TASKS_CATEGORY
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.reRunTask',
            title: nls.localize2('ReRunTaskAction.label', "Rerun Last Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.restartTask',
            title: nls.localize2('RestartTaskAction.label', "Restart Running Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.showTasks',
            title: nls.localize2('ShowTasksAction.label', "Show Running Tasks"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.terminate',
            title: nls.localize2('TerminateAction.label', "Terminate Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.build',
            title: nls.localize2('BuildAction.label', "Run Build Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.test',
            title: nls.localize2('TestAction.label', "Run Test Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.configureDefaultBuildTask',
            title: nls.localize2('ConfigureDefaultBuildTask.label', "Configure Default Build Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.configureDefaultTestTask',
            title: nls.localize2('ConfigureDefaultTestTask.label', "Configure Default Test Task"),
            category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'workbench.action.tasks.openUserTasks',
            title: nls.localize2('workbench.action.tasks.openUserTasks', "Open User Tasks"), category: tasks_1.TASKS_CATEGORY
        },
        when: taskService_1.TaskExecutionSupportedContext
    });
    class UserTasksGlobalActionContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.registerActions();
        }
        registerActions() {
            const id = 'workbench.action.tasks.openUserTasks';
            const title = nls.localize('userTasks', "User Tasks");
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                command: {
                    id,
                    title
                },
                when: taskService_1.TaskExecutionSupportedContext,
                group: '2_configuration',
                order: 6
            }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
                command: {
                    id,
                    title
                },
                when: taskService_1.TaskExecutionSupportedContext,
                group: '2_configuration',
                order: 6
            }));
        }
    }
    workbenchRegistry.registerWorkbenchContribution(UserTasksGlobalActionContribution, 3 /* LifecyclePhase.Restored */);
    // MenuRegistry.addCommand( { id: 'workbench.action.tasks.rebuild', title: nls.localize('RebuildAction.label', 'Run Rebuild Task'), category: tasksCategory });
    // MenuRegistry.addCommand( { id: 'workbench.action.tasks.clean', title: nls.localize('CleanAction.label', 'Run Clean Task'), category: tasksCategory });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'workbench.action.tasks.build',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: taskService_1.TaskCommandsRegistered,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 32 /* KeyCode.KeyB */
    });
    // Tasks Output channel. Register it before using it in Task Service.
    const outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
    outputChannelRegistry.registerChannel({ id: abstractTaskService_1.AbstractTaskService.OutputChannelId, label: abstractTaskService_1.AbstractTaskService.OutputChannelLabel, log: false });
    // Register Quick Access
    const quickAccessRegistry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
    const tasksPickerContextKey = 'inTasksPicker';
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: tasksQuickAccess_1.TasksQuickAccessProvider,
        prefix: tasksQuickAccess_1.TasksQuickAccessProvider.PREFIX,
        contextKey: tasksPickerContextKey,
        placeholder: nls.localize('tasksQuickAccessPlaceholder', "Type the name of a task to run."),
        helpEntries: [{ description: nls.localize('tasksQuickAccessHelp', "Run Task"), commandCenterOrder: 60 }]
    });
    // tasks.json validation
    const schema = {
        id: configuration_1.tasksSchemaId,
        description: 'Task definition file',
        type: 'object',
        allowTrailingCommas: true,
        allowComments: true,
        default: {
            version: '2.0.0',
            tasks: [
                {
                    label: 'My Task',
                    command: 'echo hello',
                    type: 'shell',
                    args: [],
                    problemMatcher: ['$tsc'],
                    presentation: {
                        reveal: 'always'
                    },
                    group: 'build'
                }
            ]
        }
    };
    schema.definitions = {
        ...jsonSchema_v1_1.default.definitions,
        ...jsonSchema_v2_1.default.definitions,
    };
    schema.oneOf = [...(jsonSchema_v2_1.default.oneOf || []), ...(jsonSchema_v1_1.default.oneOf || [])];
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(configuration_1.tasksSchemaId, schema);
    problemMatcher_1.ProblemMatcherRegistry.onMatcherChanged(() => {
        (0, jsonSchema_v2_1.updateProblemMatchers)();
        jsonRegistry.notifySchemaChanged(configuration_1.tasksSchemaId);
    });
    taskDefinitionRegistry_1.TaskDefinitionRegistry.onDefinitionsChanged(() => {
        (0, jsonSchema_v2_1.updateTaskDefinitions)();
        jsonRegistry.notifySchemaChanged(configuration_1.tasksSchemaId);
    });
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'task',
        order: 100,
        title: nls.localize('tasksConfigurationTitle', "Tasks"),
        type: 'object',
        properties: {
            ["task.problemMatchers.neverPrompt" /* TaskSettingId.ProblemMatchersNeverPrompt */]: {
                markdownDescription: nls.localize('task.problemMatchers.neverPrompt', "Configures whether to show the problem matcher prompt when running a task. Set to `true` to never prompt, or use a dictionary of task types to turn off prompting only for specific task types."),
                'oneOf': [
                    {
                        type: 'boolean',
                        markdownDescription: nls.localize('task.problemMatchers.neverPrompt.boolean', 'Sets problem matcher prompting behavior for all tasks.')
                    },
                    {
                        type: 'object',
                        patternProperties: {
                            '.*': {
                                type: 'boolean'
                            }
                        },
                        markdownDescription: nls.localize('task.problemMatchers.neverPrompt.array', 'An object containing task type-boolean pairs to never prompt for problem matchers on.'),
                        default: {
                            'shell': true
                        }
                    }
                ],
                default: false
            },
            ["task.autoDetect" /* TaskSettingId.AutoDetect */]: {
                markdownDescription: nls.localize('task.autoDetect', "Controls enablement of `provideTasks` for all task provider extension. If the Tasks: Run Task command is slow, disabling auto detect for task providers may help. Individual extensions may also provide settings that disable auto detection."),
                type: 'string',
                enum: ['on', 'off'],
                default: 'on'
            },
            ["task.slowProviderWarning" /* TaskSettingId.SlowProviderWarning */]: {
                markdownDescription: nls.localize('task.slowProviderWarning', "Configures whether a warning is shown when a provider is slow"),
                'oneOf': [
                    {
                        type: 'boolean',
                        markdownDescription: nls.localize('task.slowProviderWarning.boolean', 'Sets the slow provider warning for all tasks.')
                    },
                    {
                        type: 'array',
                        items: {
                            type: 'string',
                            markdownDescription: nls.localize('task.slowProviderWarning.array', 'An array of task types to never show the slow provider warning.')
                        }
                    }
                ],
                default: true
            },
            ["task.quickOpen.history" /* TaskSettingId.QuickOpenHistory */]: {
                markdownDescription: nls.localize('task.quickOpen.history', "Controls the number of recent items tracked in task quick open dialog."),
                type: 'number',
                default: 30, minimum: 0, maximum: 30
            },
            ["task.quickOpen.detail" /* TaskSettingId.QuickOpenDetail */]: {
                markdownDescription: nls.localize('task.quickOpen.detail', "Controls whether to show the task detail for tasks that have a detail in task quick picks, such as Run Task."),
                type: 'boolean',
                default: true
            },
            ["task.quickOpen.skip" /* TaskSettingId.QuickOpenSkip */]: {
                type: 'boolean',
                description: nls.localize('task.quickOpen.skip', "Controls whether the task quick pick is skipped when there is only one task to pick from."),
                default: false
            },
            ["task.quickOpen.showAll" /* TaskSettingId.QuickOpenShowAll */]: {
                type: 'boolean',
                description: nls.localize('task.quickOpen.showAll', "Causes the Tasks: Run Task command to use the slower \"show all\" behavior instead of the faster two level picker where tasks are grouped by provider."),
                default: false
            },
            ["task.allowAutomaticTasks" /* TaskSettingId.AllowAutomaticTasks */]: {
                type: 'string',
                enum: ['on', 'off'],
                enumDescriptions: [
                    nls.localize('task.allowAutomaticTasks.on', "Always"),
                    nls.localize('task.allowAutomaticTasks.off', "Never"),
                ],
                description: nls.localize('task.allowAutomaticTasks', "Enable automatic tasks - note that tasks won't run in an untrusted workspace."),
                default: 'on',
                restricted: true
            },
            ["task.reconnection" /* TaskSettingId.Reconnection */]: {
                type: 'boolean',
                description: nls.localize('task.reconnection', "On window reload, reconnect to tasks that have problem matchers."),
                default: true
            },
            ["task.saveBeforeRun" /* TaskSettingId.SaveBeforeRun */]: {
                markdownDescription: nls.localize('task.saveBeforeRun', 'Save all dirty editors before running a task.'),
                type: 'string',
                enum: ['always', 'never', 'prompt'],
                enumDescriptions: [
                    nls.localize('task.saveBeforeRun.always', 'Always saves all editors before running.'),
                    nls.localize('task.saveBeforeRun.never', 'Never saves editors before running.'),
                    nls.localize('task.SaveBeforeRun.prompt', 'Prompts whether to save editors before running.'),
                ],
                default: 'always',
            },
            ["task.verboseLogging" /* TaskSettingId.VerboseLogging */]: {
                type: 'boolean',
                description: nls.localize('task.verboseLogging', "Enable verbose logging for tasks."),
                default: false
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9icm93c2VyL3Rhc2suY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdDaEcsTUFBTSxpQkFBaUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEcsaUJBQWlCLENBQUMsNkJBQTZCLENBQUMscUNBQWlCLG9DQUE0QixDQUFDO0lBRTlGLElBQUEseUJBQWUsRUFBQyw4Q0FBMEIsQ0FBQyxDQUFDO0lBQzVDLHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1FBQ2xELE9BQU8sRUFBRTtZQUNSLEVBQUUsRUFBRSw4Q0FBMEIsQ0FBQyxFQUFFO1lBQ2pDLEtBQUssRUFBRSw4Q0FBMEIsQ0FBQyxLQUFLO1lBQ3ZDLFFBQVEsRUFBRSxzQkFBYztTQUN4QjtRQUNELElBQUksRUFBRSwyQ0FBNkI7S0FDbkMsQ0FBQyxDQUFDO0lBRUksSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxzQkFBVTtRQUl6RCxZQUNlLFlBQTJDLEVBQ3RDLGlCQUFxRCxFQUN0RCxnQkFBbUQ7WUFFckUsS0FBSyxFQUFFLENBQUM7WUFKdUIsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDckIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNyQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBTDlELHNCQUFpQixHQUFXLENBQUMsQ0FBQztZQVFyQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLElBQUksT0FBTyxHQUE4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