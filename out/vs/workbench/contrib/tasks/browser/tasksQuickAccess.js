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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/filters", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/browser/taskQuickPick", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, filters_1, extensions_1, taskService_1, tasks_1, taskQuickPick_1, configuration_1, types_1, notification_1, dialogs_1, themeService_1, storage_1) {
    "use strict";
    var TasksQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TasksQuickAccessProvider = void 0;
    let TasksQuickAccessProvider = class TasksQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { TasksQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'task '; }
        constructor(extensionService, _taskService, _configurationService, _quickInputService, _notificationService, _dialogService, _themeService, _storageService) {
            super(TasksQuickAccessProvider_1.PREFIX, {
                noResultsPick: {
                    label: (0, nls_1.localize)('noTaskResults', "No matching tasks")
                }
            });
            this._taskService = _taskService;
            this._configurationService = _configurationService;
            this._quickInputService = _quickInputService;
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._themeService = _themeService;
            this._storageService = _storageService;
        }
        async _getPicks(filter, disposables, token) {
            if (token.isCancellationRequested) {
                return [];
            }
            const taskQuickPick = new taskQuickPick_1.TaskQuickPick(this._taskService, this._configurationService, this._quickInputService, this._notificationService, this._themeService, this._dialogService, this._storageService);
            const topLevelPicks = await taskQuickPick.getTopLevelEntries();
            const taskPicks = [];
            for (const entry of topLevelPicks.entries) {
                const highlights = (0, filters_1.matchesFuzzy)(filter, entry.label);
                if (!highlights) {
                    continue;
                }
                if (entry.type === 'separator') {
                    taskPicks.push(entry);
                }
                const task = entry.task;
                const quickAccessEntry = entry;
                quickAccessEntry.highlights = { label: highlights };
                quickAccessEntry.trigger = (index) => {
                    if ((index === 1) && (quickAccessEntry.buttons?.length === 2)) {
                        const key = (task && !(0, types_1.isString)(task)) ? task.getKey() : undefined;
                        if (key) {
                            this._taskService.removeRecentlyUsedTask(key);
                        }
                        return pickerQuickAccess_1.TriggerAction.REFRESH_PICKER;
                    }
                    else {
                        if (tasks_1.ContributedTask.is(task)) {
                            this._taskService.customize(task, undefined, true);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            this._taskService.openConfig(task);
                        }
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    }
                };
                quickAccessEntry.accept = async () => {
                    if ((0, types_1.isString)(task)) {
                        // switch to quick pick and show second level
                        const showResult = await taskQuickPick.show((0, nls_1.localize)('TaskService.pickRunTask', 'Select the task to run'), undefined, task);
                        if (showResult) {
                            this._taskService.run(showResult, { attachProblemMatcher: true });
                        }
                    }
                    else {
                        this._taskService.run(await this._toTask(task), { attachProblemMatcher: true });
                    }
                };
                taskPicks.push(quickAccessEntry);
            }
            return taskPicks;
        }
        async _toTask(task) {
            if (!tasks_1.ConfiguringTask.is(task)) {
                return task;
            }
            return this._taskService.tryResolveTask(task);
        }
    };
    exports.TasksQuickAccessProvider = TasksQuickAccessProvider;
    exports.TasksQuickAccessProvider = TasksQuickAccessProvider = TasksQuickAccessProvider_1 = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, taskService_1.ITaskService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, dialogs_1.IDialogService),
        __param(6, themeService_1.IThemeService),
        __param(7, storage_1.IStorageService)
    ], TasksQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza3NRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2Jyb3dzZXIvdGFza3NRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLDZDQUFpRDs7aUJBRXZGLFdBQU0sR0FBRyxPQUFPLEFBQVYsQ0FBVztRQUV4QixZQUNvQixnQkFBbUMsRUFDaEMsWUFBMEIsRUFDakIscUJBQTRDLEVBQy9DLGtCQUFzQyxFQUNwQyxvQkFBMEMsRUFDaEQsY0FBOEIsRUFDL0IsYUFBNEIsRUFDMUIsZUFBZ0M7WUFFekQsS0FBSyxDQUFDLDBCQUF3QixDQUFDLE1BQU0sRUFBRTtnQkFDdEMsYUFBYSxFQUFFO29CQUNkLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsbUJBQW1CLENBQUM7aUJBQ3JEO2FBQ0QsQ0FBQyxDQUFDO1lBWm1CLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ2pCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNwQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMvQixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUMxQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFPMUQsQ0FBQztRQUVTLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBYyxFQUFFLFdBQTRCLEVBQUUsS0FBd0I7WUFDL0YsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQs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