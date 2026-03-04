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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls, actions_1, extHost_protocol_1, extHostCustomers_1, dialogs_1, notification_1, event_1, commands_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadMessageService = void 0;
    let MainThreadMessageService = class MainThreadMessageService {
        constructor(extHostContext, _notificationService, _commandService, _dialogService, extensionService) {
            this._notificationService = _notificationService;
            this._commandService = _commandService;
            this._dialogService = _dialogService;
            this.extensionsListener = extensionService.onDidChangeExtensions(e => {
                for (const extension of e.removed) {
                    this._notificationService.removeFilter(extension.identifier.value);
                }
            });
        }
        dispose() {
            this.extensionsListener.dispose();
        }
        $showMessage(severity, message, options, commands) {
            if (options.modal) {
                return this._showModalMessage(severity, message, options.detail, commands, options.useCustom);
            }
            else {
                return this._showMessage(severity, message, commands, options);
            }
        }
        _showMessage(severity, message, commands, options) {
            return new Promise(resolve => {
                const primaryActions = commands.map(command => (0, actions_1.toAction)({
                    id: `_extension_message_handle_${command.handle}`,
                    label: command.title,
                    enabled: true,
                    run: () => {
                        resolve(command.handle);
                        return Promise.resolve();
                    }
                }));
                let source;
                if (options.source) {
                    source = {
                        label: options.source.label,
                        id: options.source.identifier.value
                    };
                }
                if (!source) {
                    source = nls.localize('defaultSource', "Extension");
                }
                const secondaryActions = [];
                if (options.source) {
                    secondaryActions.push((0, actions_1.toAction)({
                        id: options.source.identifier.value,
                        label: nls.localize('manageExtension', "Manage Extension"),
                        run: () => {
                            return this._commandService.executeCommand('_extensions.manage', options.source.identifier.value);
                        }
                    }));
                }
                const messageHandle = this._notificationService.notify({
                    severity,
                    message,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    source
                });
                // if promise has not been resolved yet, now is the time to ensure a return value
                // otherwise if already resolved it means the user clicked one of the buttons
                event_1.Event.once(messageHandle.onDidClose)(() => {
                    resolve(undefined);
                });
            });
        }
        async _showModalMessage(severity, message, detail, commands, useCustom) {
            const buttons = [];
            let cancelButton = undefined;
            for (const command of commands) {
                const button = {
                    label: command.title,
                    run: () => command.handle
                };
                if (command.isCloseAffordance) {
                    cancelButton = button;
                }
                else {
                    buttons.push(button);
                }
            }
            if (!cancelButton) {
                if (buttons.length > 0) {
                    cancelButton = {
                        label: nls.localize('cancel', "Cancel"),
                        run: () => undefined
                    };
                }
                else {
                    cancelButton = {
                        label: nls.localize({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                        run: () => undefined
                    };
                }
            }
            const { result } = await this._dialogService.prompt({
                type: severity,
                message,
                detail,
                buttons,
                cancelButton,
                custom: useCustom
            });
            return result;
        }
    };
    exports.MainThreadMessageService = MainThreadMessageService;
    exports.MainThreadMessageService = MainThreadMessageService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadMessageService),
        __param(1, notification_1.INotificationService),
        __param(2, commands_1.ICommandService),
        __param(3, dialogs_1.IDialogService),
        __param(4, extensions_1.IExtensionService)
    ], MainThreadMessageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE1lc3NhZ2VTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRNZXNzYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBd0I7UUFJcEMsWUFDQyxjQUErQixFQUNRLG9CQUEwQyxFQUMvQyxlQUFnQyxFQUNqQyxjQUE4QixFQUM1QyxnQkFBbUM7WUFIZix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQy9DLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNqQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFHL0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNwRSxLQUFLLE1BQU0sU0FBUyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwRSxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRUQsWUFBWSxDQUFDLFFBQWtCLEVBQUUsT0FBZSxFQUFFLE9BQWlDLEVBQUUsUUFBeUU7WUFDN0osSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVB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