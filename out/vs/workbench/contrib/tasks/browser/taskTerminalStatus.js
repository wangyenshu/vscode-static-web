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
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/markers/common/markers", "vs/platform/theme/common/iconRegistry", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, nls, codicons_1, lifecycle_1, severity_1, problemCollectors_1, taskService_1, markers_1, iconRegistry_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskTerminalStatus = exports.FAILED_TASK_STATUS = exports.SUCCEEDED_TASK_STATUS = exports.ACTIVE_TASK_STATUS = void 0;
    const TASK_TERMINAL_STATUS_ID = 'task_terminal_status';
    exports.ACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: iconRegistry_1.spinningLoading, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.active', "Task is running") };
    exports.SUCCEEDED_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.check, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.succeeded', "Task succeeded") };
    const SUCCEEDED_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.check, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.succeededInactive', "Task succeeded and waiting...") };
    exports.FAILED_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.error, severity: severity_1.default.Error, tooltip: nls.localize('taskTerminalStatus.errors', "Task has errors") };
    const FAILED_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.error, severity: severity_1.default.Error, tooltip: nls.localize('taskTerminalStatus.errorsInactive', "Task has errors and is waiting...") };
    const WARNING_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.warning, severity: severity_1.default.Warning, tooltip: nls.localize('taskTerminalStatus.warnings', "Task has warnings") };
    const WARNING_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.warning, severity: severity_1.default.Warning, tooltip: nls.localize('taskTerminalStatus.warningsInactive', "Task has warnings and is waiting...") };
    const INFO_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.info, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.infos', "Task has infos") };
    const INFO_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.info, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.infosInactive', "Task has infos and is waiting...") };
    let TaskTerminalStatus = class TaskTerminalStatus extends lifecycle_1.Disposable {
        constructor(taskService, _accessibilitySignalService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this.terminalMap = new Map();
            this._register(taskService.onDidStateChange((event) => {
                switch (event.kind) {
                    case "processStarted" /* TaskEventKind.ProcessStarted */:
                    case "active" /* TaskEventKind.Active */:
                        this.eventActive(event);
                        break;
                    case "inactive" /* TaskEventKind.Inactive */:
                        this.eventInactive(event);
                        break;
                    case "processEnded" /* TaskEventKind.ProcessEnded */:
                        this.eventEnd(event);
                        break;
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const terminalData of this.terminalMap.values()) {
                    terminalData.disposeListener?.dispose();
                }
                this.terminalMap.clear();
            }));
        }
        addTerminal(task, terminal, problemMatcher) {
            const status = { id: TASK_TERMINAL_STATUS_ID, severity: severity_1.default.Info };
            terminal.statusList.add(status);
            this._register(problemMatcher.onDidFindFirstMatch(() => {
                this._marker = terminal.registerMarker();
                if (this._marker) {
                    this._register(this._marker);
                }
            }));
            this._register(problemMatcher.onDidFindErrors(() => {
                if (this._marker) {
                    terminal.addBufferMarker({ marker: this._marker, hoverMessage: nls.localize('task.watchFirstError', "Beginning of detected errors for this run"), disableCommandStorage: true });
                }
            }));
            this._register(problemMatcher.onDidRequestInvalidateLastMarker(() => {
                this._marker?.dispose();
                this._marker = undefined;
            }));
            this.terminalMap.set(terminal.instanceId, { terminal, task, status, problemMatcher, taskRunEnded: false });
        }
        terminalFromEvent(event) {
            if (!('terminalId' in event) || !event.terminalId) {
                return undefined;
            }
            return this.terminalMap.get(event.terminalId);
        }
        eventEnd(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData) {
                return;
            }
            terminalData.taskRunEnded = true;
            terminalData.terminal.statusList.remove(terminalData.status);
            if ((event.exitCode === 0) && (terminalData.problemMatcher.numberOfMatches === 0)) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskCompleted);
                if (terminalData.task.configurationProperties.isBackground) {
                    for (const status of terminalData.terminal.statusList.statuses) {
                        terminalData.terminal.statusList.remove(status);
                    }
                }
                else {
                    terminalData.terminal.statusList.add(exports.SUCCEEDED_TASK_STATUS);
                }
            }
            else if (event.exitCode || terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Error) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskFailed);
                terminalData.terminal.statusList.add(exports.FAILED_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Warning) {
                terminalData.terminal.statusList.add(WARNING_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Info) {
                terminalData.terminal.statusList.add(INFO_TASK_STATUS);
            }
        }
        eventInactive(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData || !terminalData.problemMatcher || terminalData.taskRunEnded) {
                return;
            }
            terminalData.terminal.statusList.remove(terminalData.status);
            if (terminalData.problemMatcher.numberOfMatches === 0) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskCompleted);
                terminalData.terminal.statusList.add(SUCCEEDED_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Error) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskFailed);
                terminalData.terminal.statusList.add(FAILED_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Warning) {
                terminalData.terminal.statusList.add(WARNING_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Info) {
                terminalData.terminal.statusList.add(INFO_INACTIVE_TASK_STATUS);
            }
        }
        eventActive(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData) {
                return;
            }
            if (!terminalData.disposeListener) {
                terminalData.disposeListener = this._register(new lifecycle_1.MutableDisposable());
                terminalData.disposeListener.value = terminalData.terminal.onDisposed(() => {
                    if (!event.terminalId) {
                        return;
                    }
                    this.terminalMap.delete(event.terminalId);
                    terminalData.disposeListener?.dispose();
                });
            }
            terminalData.taskRunEnded = false;
            terminalData.terminal.statusList.remove(terminalData.status);
            // We don't want to show an infinite status for a background task that doesn't have a problem matcher.
            if ((terminalData.problemMatcher instanceof problemCollectors_1.StartStopProblemCollector) || (terminalData.problemMatcher?.problemMatchers.length > 0) || event.runType === "singleRun" /* TaskRunType.SingleRun */) {
                terminalData.terminal.statusList.add(exports.ACTIVE_TASK_STATUS);
            }
        }
    };
    exports.TaskTerminalStatus = TaskTerminalStatus;
    exports.TaskTerminalStatus = TaskTerminalStatus = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, accessibilitySignalService_1.IAccessibilitySignalService)
    ], TaskTerminalStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1Rlcm1pbmFsU3RhdHVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvYnJvd3Nlci90YXNrVGVybWluYWxTdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFNLHVCQUF1QixHQUFHLHNCQUFzQixDQUFDO0lBQzFDLFFBQUEsa0JBQWtCLEdBQW9CLEVBQUUsRUFBRSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSw4QkFBZSxFQUFFLFFBQVEsRUFBRSxrQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFDN0wsUUFBQSxxQkFBcUIsR0FBb0IsRUFBRSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxrQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7SUFDN00sTUFBTSw4QkFBOEIsR0FBb0IsRUFBRSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxrQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSwrQkFBK0IsQ0FBQyxFQUFFLENBQUM7SUFDek4sUUFBQSxrQkFBa0IsR0FBb0IsRUFBRSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxrQkFBUSxDQUFD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