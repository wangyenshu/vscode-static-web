/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/tasks/browser/taskTerminalStatus", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/terminal/browser/terminalStatusList"], function (require, exports, assert_1, event_1, lifecycle_1, utils_1, testConfigurationService_1, instantiationServiceMock_1, taskTerminalStatus_1, tasks_1, terminalStatusList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTaskService {
        constructor() {
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        triggerStateChange(event) {
            this._onDidStateChange.fire(event);
        }
    }
    class TestaccessibilitySignalService {
        async playSignal(cue) {
            return;
        }
    }
    class TestTerminal extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.statusList = this._register(new terminalStatusList_1.TerminalStatusList(new testConfigurationService_1.TestConfigurationService()));
        }
        dispose() {
            super.dispose();
        }
    }
    class TestTask extends tasks_1.CommonTask {
        constructor() {
            super('test', undefined, undefined, {}, {}, { kind: '', label: '' });
        }
        getFolderId() {
            throw new Error('Method not implemented.');
        }
        fromObject(object) {
            throw new Error('Method not implemented.');
        }
    }
    class TestProblemCollector extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidFindFirstMatch = new event_1.Emitter();
            this.onDidFindFirstMatch = this._onDidFindFirstMatch.event;
            this._onDidFindErrors = new event_1.Emitter();
            this.onDidFindErrors = this._onDidFindErrors.event;
            this._onDidRequestInvalidateLastMarker = new event_1.Emitter();
            this.onDidRequestInvalidateLastMarker = this._onDidRequestInvalidateLastMarker.event;
        }
    }
    suite('Task Terminal Status', () => {
        let instantiationService;
        let taskService;
        let taskTerminalStatus;
        let testTerminal;
        let testTask;
        let problemCollector;
        let accessibilitySignalService;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            taskService = new TestTaskService();
            accessibilitySignalService = new TestaccessibilitySignalService();
            taskTerminalStatus = store.add(new taskTerminalStatus_1.TaskTerminalStatus(taskService, accessibilitySignalService));
            testTerminal = store.add(instantiationService.createInstance(TestTerminal));
            testTask = instantiationService.createInstance(TestTask);
            problemCollector = store.add(instantiationService.createInstance(TestProblemCollector));
        });
        test('Should add failed status when there is an exit code on task end', async () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "end" /* TaskEventKind.End */ });
            await poll(async () => Promise.resolve(), () => testTerminal?.statusList.primary?.id === taskTerminalStatus_1.FAILED_TASK_STATUS.id, 'terminal status should be updated');
        });
        test('Should add active status when a non-background task is run for a second time in the same terminal', () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "singleRun" /* TaskRunType.SingleRun */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
        });
        test('Should drop status when a background task exits', async () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "background" /* TaskRunType.Background */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processEnded" /* TaskEventKind.ProcessEnded */, exitCode: 0 });
            await poll(async () => Promise.resolve(), () => testTerminal?.statusList.statuses?.includes(taskTerminalStatus_1.SUCCEEDED_TASK_STATUS) === false, 'terminal should have dropped status');
        });
        test('Should add succeeded status when a non-background task exits', () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "singleRun" /* TaskRunType.SingleRun */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processEnded" /* TaskEventKind.ProcessEnded */, exitCode: 0 });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
        });
    });
    function assertStatus(actual, expected) {
        (0, assert_1.ok)(actual.statuses.length === 1, '# of statuses');
        (0, assert_1.ok)(actual.primary?.id === expected.id, 'ID');
        (0, assert_1.ok)(actual.primary?.severity === expected.severity, 'Severity');
    }
    async function poll(fn, acceptFn, timeoutMessage, retryCount = 200, retryInterval = 10 // millis
    ) {
        let trial = 1;
        let lastError = '';
        while (true) {
            if (trial > retryCount) {
                throw new Error(`Timeout: ${timeoutMessage} after ${(retryCount * retryInterval) / 1000} seconds.\r${lastError}`);
            }
            let result;
            try {
                result = await fn();
                if (acceptFn(result)) {
                    return result;
                }
                else {
                    lastError = 'Did not pass accept function';
                }
            }
            catch (e) {
                lastError = Array.isArray(e.stack) ? e.stack.join('\n') : e.stack;
            }
            await new Promise(resolve => setTimeout(resolve, retryInterval));
            trial++;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1Rlcm1pbmFsU3RhdHVzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy90ZXN0L2Jyb3dzZXIvdGFza1Rlcm1pbmFsU3RhdHVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLE1BQU0sZUFBZTtRQUFyQjtZQUNrQixzQkFBaUIsR0FBd0IsSUFBSSxlQUFPLEVBQUUsQ0FBQztRQU96RSxDQUFDO1FBTkEsSUFBVyxnQkFBZ0I7WUFDMUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBQ3JDLENBQUM7UUFDTSxrQkFBa0IsQ0FBQyxLQUEwQjtZQUNuRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQW1CLENBQUMsQ0FBQztRQUNsRCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLDhCQUE4QjtRQUNuQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQXdCO1lBQ3hDLE9BQU87UUFDUixDQUFDO0tBQ0Q7SUFFRCxNQUFNLFlBQWEsU0FBUSxzQkFBVTtRQUVwQztZQUNDLEtBQUssRUFBRSxDQUFDO1lBRlQsZUFBVSxHQUF1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksdUNBQWtCLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUd4RyxDQUFDO1FBQ1EsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFFRCxNQUFNLFFBQVMsU0FBUSxrQkFBVTtRQUVoQztZQUNDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRVMsV0FBVztZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNTLFVBQVUsQ0FBQyxNQUFXO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBQTdDOztZQUNvQix5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3JELHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDNUMscUJBQWdCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNqRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFDcEMsc0NBQWlDLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNsRSxxQ0FBZ0MsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDO1FBQzFGLENBQUM7S0FBQTtJQUVELEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxrQkFBc0MsQ0FBQztRQUMzQyxJQUFJLFlBQStCLENBQUM7UUFDcEMsSUFBSSxRQUFjLENBQUM7UUFDbkIsSUFBSSxnQkFBMEMsQ0FBQztRQUMvQyxJQUFJLDBCQUEwRCxDQUFDO1FBQy9ELE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUN4RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRSxXQUFXLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUNwQywwQkFBMEIsR0FBRyxJQUFJLDhCQUE4QixFQUFFLENBQUM7WUFDbEUsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLFdBQWtCLEVBQUUsMEJBQWlDLENBQUMsQ0FBQyxDQUFDO1lBQzlHLFlBQVksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQVEsQ0FBQyxDQUFDO1lBQ25GLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFvQixDQUFDO1lBQzVFLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFRLENBQUMsQ0FBQztRQUNoRyxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRixrQkFBa0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3pFLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUkscURBQThCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLFlBQVksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLHVDQUFrQixDQUFDLENBQUM7WUFDMUQsV0FBVyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSx5Q0FBd0IsRUFBRSxDQUFDLENBQUM7WUFDakUsWUFBWSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsMENBQXFCLENBQUMsQ0FBQztZQUM3RCxXQUFXLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLCtCQUFtQixFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLElBQUksQ0FBTyxLQUFLLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssdUNBQWtCLENBQUMsRUFBRSxFQUFFLG1DQUFtQyxDQUFDLENBQUM7UUFDNUosQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsbUdBQW1HLEVBQUUsR0FBRyxFQUFFO1lBQzlHLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDekUsV0FBVyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxxREFBOEIsRUFBRSxDQUFDLENBQUM7WUFDdkUsWUFBWSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsdUNBQWtCLENBQUMsQ0FBQztZQUMxRCxXQUFXLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLHlDQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRSxZQUFZLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSwwQ0FBcUIsQ0FBQyxDQUFDO1lBQzdELFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUkscURBQThCLEVBQUUsT0FBTyx5Q0FBdUIsRUFBRSxDQUFDLENBQUM7WUFDdkcsWUFBWSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsdUNBQWtCLENBQUMsQ0FBQztZQUMxRCxXQUFXLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLHlDQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRSxZQUFZLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSwwQ0FBcUIsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xFLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDekUsV0FBVyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxxREFBOEIsRUFBRSxPQUFPLDJDQUF3QixFQUFFLENBQUMsQ0FBQztZQUN4RyxZQUFZLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSx1Q0FBa0IsQ0FBQyxDQUFDO1lBQzFELFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUkseUNBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLFlBQVksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLDBDQUFxQixDQUFDLENBQUM7WUFDN0QsV0FBVyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxpREFBNEIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsRixNQUFNLElBQUksQ0FBTyxLQUFLLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsMENBQXFCLENBQUMsS0FBSyxLQUFLLEVBQUUscUNBQXFDLENBQUMsQ0FBQztRQUM1SyxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyw4REFBOEQsRUFBRSxHQUFHLEVBQUU7WUFDekUsa0JBQWtCLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUN6RSxXQUFXLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLHFEQUE4QixFQUFFLE9BQU8seUNBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZHLFlBQVksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLHVDQUFrQixDQUFDLENBQUM7WUFDMUQsV0FBVyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSx5Q0FBd0IsRUFBRSxDQUFDLENBQUM7WUFDakUsWUFBWSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsMENBQXFCLENBQUMsQ0FBQztZQUM3RCxXQUFXLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLGlEQUE0QixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLFlBQVksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLDBDQUFxQixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsWUFBWSxDQUFDLE1BQTJCLEVBQUUsUUFBeUI7UUFDM0UsSUFBQSxXQUFFLEVBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2xELElBQUEsV0FBRSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBQSxXQUFFLEVBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLEtBQUssUUFBUSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsS0FBSyxVQUFVLElBQUksQ0FDbEIsRUFBcUIsRUFDckIsUUFBZ0MsRUFDaEMsY0FBc0IsRUFDdEIsYUFBcUIsR0FBRyxFQUN4QixnQkFBd0IsRUFBRSxDQUFDLFNBQVM7O1FBRXBDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNkLElBQUksU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUUzQixPQUFPLElBQUksRUFBRSxDQUFDO1lBQ2IsSUFBSSxLQUFLLEdBQUcsVUFBVSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxjQUFjLFVBQVUsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDLEdBQUcsSUFBSSxjQUFjLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDbkgsQ0FBQztZQUVELElBQUksTUFBTSxDQUFDO1lBQ1gsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNwQixJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUN0QixPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsU0FBUyxHQUFHLDhCQUE4QixDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7Z0JBQ2pCLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDbkUsQ0FBQztZQUVELE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDakUsS0FBSyxFQUFFLENBQUM7UUFDVCxDQUFDO0lBQ0YsQ0FBQyJ9