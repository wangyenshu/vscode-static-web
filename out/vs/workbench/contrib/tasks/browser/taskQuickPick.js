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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/workbench/contrib/tasks/common/tasks", "vs/base/common/types", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/quickinput/common/quickInput", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/notification/common/notification", "vs/base/common/codicons", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/iconRegistry", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/platform/quickinput/browser/quickPickPin", "vs/platform/storage/common/storage"], function (require, exports, nls, Objects, tasks_1, Types, taskService_1, quickInput_1, configuration_1, lifecycle_1, event_1, notification_1, codicons_1, themeService_1, themables_1, iconRegistry_1, dialogs_1, terminalIcon_1, quickPickPin_1, storage_1) {
    "use strict";
    var TaskQuickPick_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskQuickPick = exports.configureTaskIcon = exports.QUICKOPEN_SKIP_CONFIG = exports.QUICKOPEN_DETAIL_CONFIG = void 0;
    exports.isWorkspaceFolder = isWorkspaceFolder;
    exports.QUICKOPEN_DETAIL_CONFIG = 'task.quickOpen.detail';
    exports.QUICKOPEN_SKIP_CONFIG = 'task.quickOpen.skip';
    function isWorkspaceFolder(folder) {
        return 'uri' in folder;
    }
    const SHOW_ALL = nls.localize('taskQuickPick.showAll', "Show All Tasks...");
    exports.configureTaskIcon = (0, iconRegistry_1.registerIcon)('tasks-list-configure', codicons_1.Codicon.gear, nls.localize('configureTaskIcon', 'Configuration icon in the tasks selection list.'));
    const removeTaskIcon = (0, iconRegistry_1.registerIcon)('tasks-remove', codicons_1.Codicon.close, nls.localize('removeTaskIcon', 'Icon for remove in the tasks selection list.'));
    const runTaskStorageKey = 'runTaskStorageKey';
    let TaskQuickPick = TaskQuickPick_1 = class TaskQuickPick extends lifecycle_1.Disposable {
        constructor(_taskService, _configurationService, _quickInputService, _notificationService, _themeService, _dialogService, _storageService) {
            super();
            this._taskService = _taskService;
            this._configurationService = _configurationService;
            this._quickInputService = _quickInputService;
            this._notificationService = _notificationService;
            this._themeService = _themeService;
            this._dialogService = _dialogService;
            this._storageService = _storageService;
            this._sorter = this._taskService.createSorter();
        }
        _showDetail() {
            // Ensure invalid values get converted into boolean values
            return !!this._configurationService.getValue(exports.QUICKOPEN_DETAIL_CONFIG);
        }
        _guessTaskLabel(task) {
            if (task._label) {
                return task._label;
            }
            if (tasks_1.ConfiguringTask.is(task)) {
                let label = task.configures.type;
                const configures = Objects.deepClone(task.configures);
                delete configures['_key'];
                delete configures['type'];
                Object.keys(configures).forEach(key => label += `: ${configures[key]}`);
                return label;
            }
            return '';
        }
        static getTaskLabelWithIcon(task, labelGuess) {
            const label = labelGuess || task._label;
            const icon = task.configurationProperties.icon;
            if (!icon) {
                return `${label}`;
            }
            return icon.id ? `$(${icon.id}) ${label}` : `$(${codicons_1.Codicon.tools.id}) ${label}`;
        }
        static applyColorStyles(task, entry, themeService) {
            if (task.configurationProperties.icon?.color) {
                const colorTheme = themeService.getColorTheme();
                const disposable = (0, terminalIcon_1.createColorStyleElement)(colorTheme);
                entry.iconClasses = [(0, terminalIcon_1.getColorClass)(task.configurationProperties.icon.color)];
                return disposable;
            }
            return;
        }
        _createTaskEntry(task, extraButtons = []) {
            const buttons = [
                { iconClass: themables_1.ThemeIcon.asClassName(exports.configureTaskIcon), tooltip: nls.localize('configureTask', "Configure Task") },
                ...extraButtons
            ];
            const entry = { label: TaskQuickPick_1.getTaskLabelWithIcon(task, this._guessTaskLabel(task)), description: this._taskService.getTaskDescription(task), task, detail: this._showDetail() ? task.configurationProperties.detail : undefined, buttons };
            const disposable = TaskQuickPick_1.applyColorStyles(task, entry, this._themeService);
            if (disposable) {
                this._register(disposable);
            }
            return entry;
        }
        _createEntriesForGroup(entries, tasks, groupLabel, extraButtons = []) {
            entries.push({ type: 'separator', label: groupLabel });
            tasks.forEach(task => {
                if (!task.configurationProperties.hide) {
                    entries.push(this._createTaskEntry(task, extraButtons));
                }
            });
        }
        _createTypeEntries(entries, types) {
            entries.push({ type: 'separator', label: nls.localize('contributedTasks', "contributed") });
            types.forEach(type => {
                entries.push({ label: `$(folder) ${type}`, task: type, ariaLabel: nls.localize('taskType', "All {0} tasks", type) });
            });
            entries.push({ label: SHOW_ALL, task: SHOW_ALL, alwaysShow: true });
        }
        _handleFolderTaskResult(result) {
            const tasks = [];
            Array.from(result).forEach(([key, folderTasks]) => {
                if (folderTasks.set) {
                    tasks.push(...folderTasks.set.tasks);
                }
                if (folderTasks.configurations) {
                    for (const configuration in folderTasks.configurations.byIdentifier) {
                        tasks.push(folderTasks.configurations.byIdentifier[configuration]);
                    }
                }
            });
            return tasks;
        }
        _dedupeConfiguredAndRecent(recentTasks, configuredTasks) {
            let dedupedConfiguredTasks = [];
            const foundRecentTasks = Array(recentTasks.length).fill(false);
            for (let j = 0; j < configuredTasks.length; j++) {
                const workspaceFolder = configuredTasks[j].getWorkspaceFolder()?.uri.toString();
                const definition = configuredTasks[j].getDefinition()?._key;
                const type = configuredTasks[j].type;
                const label = configuredTasks[j]._label;
                const recentKey = configuredTasks[j].getKey();
                const findIndex = recentTasks.findIndex((value) => {
                    return (workspaceFolder && definition && value.getWorkspaceFolder()?.uri.toString() === workspaceFolder
                        && ((value.getDefinition()?._key === definition) || (value.type === type && value._label === label)))
                        || (recentKey && value.getKey() === recentKey);
                });
                if (findIndex === -1) {
                    dedupedConfiguredTasks.push(configuredTasks[j]);
                }
                else {
                    recentTasks[findIndex] = configuredTasks[j];
                    foundRecentTasks[findIndex] = true;
                }
            }
            dedupedConfiguredTasks = dedupedConfiguredTasks.sort((a, b) => this._sorter.compare(a, b));
            const prunedRecentTasks = [];
            for (let i = 0; i < recentTasks.length; i++) {
                if (foundRecentTasks[i] || tasks_1.ConfiguringTask.is(recentTasks[i])) {
                    prunedRecentTasks.push(recentTasks[i]);
                }
            }
            return { configuredTasks: dedupedConfiguredTasks, recentTasks: prunedRecentTasks };
        }
        async getTopLevelEntries(defaultEntry) {
            if (this._topLevelEntries !== undefined) {
                return { entries: this._topLevelEntries };
            }
            let recentTasks = (await this._taskService.getSavedTasks('historical')).reverse();
            const configuredTasks = this._handleFolderTaskResult(await this._taskService.getWorkspaceTasks());
            const extensionTaskTypes = this._taskService.taskTypes();
            this._topLevelEntries = [];
            // Dedupe will update recent tasks if they've changed in tasks.json.
            const dedupeAndPrune = this._dedupeConfiguredAndRecent(recentTasks, configuredTasks);
            const dedupedConfiguredTasks = dedupeAndPrune.configuredTasks;
            recentTasks = dedupeAndPrune.recentTasks;
            if (recentTasks.length > 0) {
                const removeRecentButton = {
                    iconClass: themables_1.ThemeIcon.asClassName(removeTaskIcon),
                    tooltip: nls.localize('removeRecent', 'Remove Recently Used Task')
                };
                this._createEntriesForGroup(this._topLevelEntries, recentTasks, nls.localize('recentlyUsed', 'recently used'), [removeRecentButton]);
            }
            if (configuredTasks.length > 0) {
                if (dedupedConfiguredTasks.length > 0) {
                    this._createEntriesForGroup(this._topLevelEntries, dedupedConfiguredTasks, nls.localize('configured', 'configured'));
                }
            }
            if (defaultEntry && (configuredTasks.length === 0)) {
                this._topLevelEntries.push({ type: 'separator', label: nls.localize('configured', 'configured') });
                this._topLevelEntries.push(defaultEntry);
            }
            if (extensionTaskTypes.length > 0) {
                this._createTypeEntries(this._topLevelEntries, extensionTaskTypes);
            }
            return { entries: this._topLevelEntries, isSingleConfigured: configuredTasks.length === 1 ? configuredTasks[0] : undefined };
        }
        async handleSettingOption(selectedType) {
            const { confirmed } = await this._dialogService.confirm({
                type: notification_1.Severity.Warning,
                message: nls.localize('TaskQuickPick.changeSettingDetails', "Task detection for {0} tasks causes files in any workspace you open to be run as code. Enabling {0} task detection is a user setting and will apply to any workspace you open. \n\n Do you want to enable {0} task detection for all workspaces?", selectedType),
                cancelButton: nls.localize('TaskQuickPick.changeSettingNo', "No")
            });
            if (confirmed) {
                await this._configurationService.updateValue(`${selectedType}.autoDetect`, 'on');
                await new Promise(resolve => setTimeout(() => resolve(), 100));
                return this.show(nls.localize('TaskService.pickRunTask', 'Select the task to run'), undefined, selectedType);
            }
            return undefined;
        }
        async show(placeHolder, defaultEntry, startAtType, name) {
            const picker = this._quickInputService.createQuickPick();
            picker.placeholder = placeHolder;
            picker.matchOnDescription = true;
            picker.ignoreFocusOut = false;
            picker.onDidTriggerItemButton(async (context) => {
                const task = context.item.task;
                if (context.button.iconClass === themables_1.ThemeIcon.asClassName(removeTaskIcon)) {
                    const key = (task && !Types.isString(task)) ? task.getKey() : undefined;
                    if (key) {
                        this._taskService.removeRecentlyUsedTask(key);
                    }
                    const indexToRemove = picker.items.indexOf(context.item);
                    if (indexToRemove >= 0) {
                        picker.items = [...picker.items.slice(0, indexToRemove), ...picker.items.slice(indexToRemove + 1)];
                    }
                }
                else if (context.button.iconClass === themables_1.ThemeIcon.asClassName(exports.configureTaskIcon)) {
                    this._quickInputService.cancel();
                    if (tasks_1.ContributedTask.is(task)) {
                        this._taskService.customize(task, undefined, true);
                    }
                    else if (tasks_1.CustomTask.is(task) || tasks_1.ConfiguringTask.is(task)) {
                        let canOpenConfig = false;
                        try {
                            canOpenConfig = await this._taskService.openConfig(task);
                        }
                        catch (e) {
                            // do nothing.
                        }
                        if (!canOpenConfig) {
                            this._taskService.customize(task, undefined, true);
                        }
                    }
                }
            });
            if (name) {
                picker.value = name;
            }
            let firstLevelTask = startAtType;
            if (!firstLevelTask) {
                // First show recent tasks configured tasks. Other tasks will be available at a second level
                const topLevelEntriesResult = await this.getTopLevelEntries(defaultEntry);
                if (topLevelEntriesResult.isSingleConfigured && this._configurationService.getValue(exports.QUICKOPEN_SKIP_CONFIG)) {
                    picker.dispose();
                    return this._toTask(topLevelEntriesResult.isSingleConfigured);
                }
                const taskQuickPickEntries = topLevelEntriesResult.entries;
                firstLevelTask = await this._doPickerFirstLevel(picker, taskQuickPickEntries);
            }
            do {
                if (Types.isString(firstLevelTask)) {
                    if (name) {
                        await this._doPickerFirstLevel(picker, (await this.getTopLevelEntries(defaultEntry)).entries);
                        picker.dispose();
                        return undefined;
                    }
                    const selectedEntry = await this.doPickerSecondLevel(picker, firstLevelTask);
                    // Proceed to second level of quick pick
                    if (selectedEntry && !selectedEntry.settingType && selectedEntry.task === null) {
                        // The user has chosen to go back to the first level
                        picker.value = '';
                        firstLevelTask = await this._doPickerFirstLevel(picker, (await this.getTopLevelEntries(defaultEntry)).entries);
                    }
                    else if (selectedEntry && Types.isString(selectedEntry.settingType)) {
                        picker.dispose();
                        return this.handleSettingOption(selectedEntry.settingType);
                    }
                    else {
                        picker.dispose();
                        return (selectedEntry?.task && !Types.isString(selectedEntry?.task)) ? this._toTask(selectedEntry?.task) : undefined;
                    }
                }
                else if (firstLevelTask) {
                    picker.dispose();
                    return this._toTask(firstLevelTask);
                }
                else {
                    picker.dispose();
                    return firstLevelTask;
                }
            } while (1);
            return;
        }
        async _doPickerFirstLevel(picker, taskQuickPickEntries) {
            picker.items = taskQuickPickEntries;
            (0, quickPickPin_1.showWithPinnedItems)(this._storageService, runTaskStorageKey, picker, true);
            const firstLevelPickerResult = await new Promise(resolve => {
                event_1.Event.once(picker.onDidAccept)(async () => {
                    resolve(picker.selectedItems ? picker.selectedItems[0] : undefined);
                });
            });
            return firstLevelPickerResult?.task;
        }
        async doPickerSecondLevel(picker, type, name) {
            picker.busy = true;
            if (type === SHOW_ALL) {
                const items = (await this._taskService.tasks()).filter(t => !t.configurationProperties.hide).sort((a, b) => this._sorter.compare(a, b)).map(task => this._createTaskEntry(task));
                items.push(...TaskQuickPick_1.allSettingEntries(this._configurationService));
                picker.items = items;
            }
            else {
                picker.value = name || '';
                picker.items = await this._getEntriesForProvider(type);
            }
            await picker.show();
            picker.busy = false;
            const secondLevelPickerResult = await new Promise(resolve => {
                event_1.Event.once(picker.onDidAccept)(async () => {
                    resolve(picker.selectedItems ? picker.selectedItems[0] : undefined);
                });
            });
            return secondLevelPickerResult;
        }
        static allSettingEntries(configurationService) {
            const entries = [];
            const gruntEntry = TaskQuickPick_1.getSettingEntry(configurationService, 'grunt');
            if (gruntEntry) {
                entries.push(gruntEntry);
            }
            const gulpEntry = TaskQuickPick_1.getSettingEntry(configurationService, 'gulp');
            if (gulpEntry) {
                entries.push(gulpEntry);
            }
            const jakeEntry = TaskQuickPick_1.getSettingEntry(configurationService, 'jake');
            if (jakeEntry) {
                entries.push(jakeEntry);
            }
            return entries;
        }
        static getSettingEntry(configurationService, type) {
            if (configurationService.getValue(`${type}.autoDetect`) === 'off') {
                return {
                    label: nls.localize('TaskQuickPick.changeSettingsOptions', "$(gear) {0} task detection is turned off. Enable {1} task detection...", type[0].toUpperCase() + type.slice(1), type),
                    task: null,
                    settingType: type,
                    alwaysShow: true
                };
            }
            return undefined;
        }
        async _getEntriesForProvider(type) {
            const tasks = (await this._taskService.tasks({ type })).sort((a, b) => this._sorter.compare(a, b));
            let taskQuickPickEntries = [];
            if (tasks.length > 0) {
                for (const task of tasks) {
                    if (!task.configurationProperties.hide) {
                        taskQuickPickEntries.push(this._createTaskEntry(task));
                    }
                }
                taskQuickPickEntries.push({
                    type: 'separator'
                }, {
                    label: nls.localize('TaskQuickPick.goBack', 'Go back ↩'),
                    task: null,
                    alwaysShow: true
                });
            }
            else {
                taskQuickPickEntries = [{
                        label: nls.localize('TaskQuickPick.noTasksForType', 'No {0} tasks found. Go back ↩', type),
                        task: null,
                        alwaysShow: true
                    }];
            }
            const settingEntry = TaskQuickPick_1.getSettingEntry(this._configurationService, type);
            if (settingEntry) {
                taskQuickPickEntries.push(settingEntry);
            }
            return taskQuickPickEntries;
        }
        async _toTask(task) {
            if (!tasks_1.ConfiguringTask.is(task)) {
                return task;
            }
            const resolvedTask = await this._taskService.tryResolveTask(task);
            if (!resolvedTask) {
                this._notificationService.error(nls.localize('noProviderForTask', "There is no task provider registered for tasks of type \"{0}\".", task.type));
            }
            return resolvedTask;
        }
    };
    exports.TaskQuickPick = TaskQuickPick;
    exports.TaskQuickPick = TaskQuickPick = TaskQuickPick_1 = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, themeService_1.IThemeService),
        __param(5, dialogs_1.IDialogService),
        __param(6, storage_1.IStorageService)
    ], TaskQuickPick);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1F1aWNrUGljay5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2Jyb3dzZXIvdGFza1F1aWNrUGljay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyw4Q0FFQztJQUpZLFFBQUEsdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7SUFDbEQsUUFBQSxxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQztJQUMzRCxTQUFnQixpQkFBaUIsQ0FBQyxNQUFxQztRQUN0RSxPQUFPLEtBQUssSUFBSSxNQUFNLENBQUM7SUFDeEIsQ0FBQztJQVdELE1BQU0sUUFBUSxHQUFXLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUV2RSxRQUFBLGlCQUFpQixHQUFHLElBQUEsMkJBQVksRUFBQyxzQkFBc0IsRUFBRSxrQkFBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLGlEQUFpRCxDQUFDLENBQUMsQ0FBQztJQUMxSyxNQUFNLGNBQWMsR0FBRyxJQUFBLDJCQUFZLEVBQUMsY0FBYyxFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsOENBQThDLENBQUMsQ0FBQyxDQUFDO0lBRW5KLE1BQU0saUJBQWlCLEdBQUcsbUJBQW1CLENBQUM7SUFFdkMsSUFBTSxhQUFhLHFCQUFuQixNQUFNLGFBQWMsU0FBUSxzQkFBVTtRQUc1QyxZQUN1QixZQUEwQixFQUNqQixxQkFBNEMsRUFDL0Msa0JBQXNDLEVBQ3BDLG9CQUEwQyxFQUNqRCxhQUE0QixFQUMzQixjQUE4QixFQUM3QixlQUFnQztZQUN6RCxLQUFLLEVBQUUsQ0FBQztZQVBj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