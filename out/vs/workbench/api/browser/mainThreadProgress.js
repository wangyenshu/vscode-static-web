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
define(["require", "exports", "vs/platform/progress/common/progress", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/actions", "vs/platform/commands/common/commands", "vs/nls"], function (require, exports, progress_1, extHost_protocol_1, extHostCustomers_1, actions_1, commands_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadProgress = void 0;
    class ManageExtensionAction extends actions_1.Action {
        constructor(extensionId, label, commandService) {
            super(extensionId, label, undefined, true, () => {
                return commandService.executeCommand('_extensions.manage', extensionId);
            });
        }
    }
    let MainThreadProgress = class MainThreadProgress {
        constructor(extHostContext, progressService, _commandService) {
            this._commandService = _commandService;
            this._progress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostProgress);
            this._progressService = progressService;
        }
        dispose() {
            this._progress.forEach(handle => handle.resolve());
            this._progress.clear();
        }
        async $startProgress(handle, options, extensionId) {
            const task = this._createTask(handle);
            if (options.location === 15 /* ProgressLocation.Notification */ && extensionId) {
                const notificationOptions = {
                    ...options,
                    location: 15 /* ProgressLocation.Notification */,
                    secondaryActions: [new ManageExtensionAction(extensionId, (0, nls_1.localize)('manageExtension', "Manage Extension"), this._commandService)]
                };
                options = notificationOptions;
            }
            this._progressService.withProgress(options, task, () => this._proxy.$acceptProgressCanceled(handle));
        }
        $progressReport(handle, message) {
            const entry = this._progress.get(handle);
            entry?.progress.report(message);
        }
        $progressEnd(handle) {
            const entry = this._progress.get(handle);
            if (entry) {
                entry.resolve();
                this._progress.delete(handle);
            }
        }
        _createTask(handle) {
            return (progress) => {
                return new Promise(resolve => {
                    this._progress.set(handle, { resolve, progress });
                });
            };
        }
    };
    exports.MainThreadProgress = MainThreadProgress;
    exports.MainThreadProgress = MainThreadProgress = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadProgress),
        __param(1, progress_1.IProgressService),
        __param(2, commands_1.ICommandService)
    ], MainThreadProgress);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFByb2dyZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRQcm9ncmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTaEcsTUFBTSxxQkFBc0IsU0FBUSxnQkFBTTtRQUN6QyxZQUFZLFdBQW1CLEVBQUUsS0FBYSxFQUFFLGNBQStCO1lBQzlFLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUMvQyxPQUFPLGNBQWMsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDekUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFHTSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQU05QixZQUNDLGNBQStCLEVBQ2IsZUFBaUMsRUFDbEMsZUFBaUQ7WUFBaEMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBTjNELGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBdUUsQ0FBQztZQVFsRyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQWMsRUFBRSxPQUF5QixFQUFFLFdBQW9CO1lBQ25GLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFdEMsSUFBSSxPQUFPLENBQUMsUUFBUSwyQ0FBa0MsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDdkUsTUFBTSxtQkFBbUIsR0FBaUM7b0JBQ3pELEdBQUcsT0FBTztvQkFDVixRQUFRLHdDQUErQjtvQkFDdkMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDakksQ0FBQztnQkFFRixPQUFPLEdBQUcsbUJBQW1CLENBQUM7WUFDL0IsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELGVBQWUsQ0FBQyxNQUFjLEVBQUUsT0FBc0I7WUFDckQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELFlBQVksQ0FBQyxNQUFjO1lBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVcsQ0FBQyxNQUFjO1lBQ2pDLE9BQU8sQ0FBQyxRQUFrQyxFQUFFLEVBQUU7Z0JBQzdDLE9BQU8sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUU7b0JBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBeERZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBRDlCLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxrQkFBa0IsQ0FBQztRQVNsRCxXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsMEJBQWUsQ0FBQTtPQVRMLGtCQUFrQixDQXdEOUIifQ==