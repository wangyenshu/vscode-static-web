/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, tasks_1, abstractTaskService_1, taskService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskService = void 0;
    class TaskService extends abstractTaskService_1.AbstractTaskService {
        static { this.ProcessTaskSystemSupportMessage = nls.localize('taskService.processTaskSystem', 'Process task system is not support in the web.'); }
        _getTaskSystem() {
            if (this._taskSystem) {
                return this._taskSystem;
            }
            if (this.executionEngine !== tasks_1.ExecutionEngine.Terminal) {
                throw new Error(TaskService.ProcessTaskSystemSupportMessage);
            }
            this._taskSystem = this._createTerminalTaskSystem();
            this._taskSystemListeners =
                [
                    this._taskSystem.onDidStateChange((event) => {
                        this._taskRunningState.set(this._taskSystem.isActiveSync());
                        this._onDidStateChange.fire(event);
                    }),
                ];
            return this._taskSystem;
        }
        _computeLegacyConfiguration(workspaceFolder) {
            throw new Error(TaskService.ProcessTaskSystemSupportMessage);
        }
        _versionAndEngineCompatible(filter) {
            return this.executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
    }
    exports.TaskService = TaskService;
    (0, extensions_1.registerSingleton)(taskService_1.ITaskService, TaskService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9icm93c2VyL3Rhc2tTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLFdBQVksU0FBUSx5Q0FBbUI7aUJBQzNCLG9DQUErQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztRQUVoSixjQUFjO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDekIsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyx1QkFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ3BELElBQUksQ0FBQyxvQkFBb0I7Z0JBQ3hCO29CQUNDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTt3QkFDM0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBWSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7d0JBQzdELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BDLENBQUMsQ0FBQztpQkFDRixDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFUywyQkFBMkIsQ0FBQyxlQUFpQztZQUN0RSxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFUywyQkFBMkIsQ0FBQyxNQUFvQjtZQUN6RCxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssdUJBQWUsQ0FBQyxRQUFRLENBQUM7UUFDMUQsQ0FBQzs7SUEzQkYsa0NBNEJDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQywwQkFBWSxFQUFFLFdBQVcsb0NBQTRCLENBQUMifQ==