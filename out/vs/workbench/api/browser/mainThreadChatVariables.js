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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, marshalling_1, extHost_protocol_1, chatVariables_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadChatVariables = void 0;
    let MainThreadChatVariables = class MainThreadChatVariables {
        constructor(extHostContext, _chatVariablesService) {
            this._chatVariablesService = _chatVariablesService;
            this._variables = new lifecycle_1.DisposableMap();
            this._pendingProgress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChatVariables);
        }
        dispose() {
            this._variables.clearAndDisposeAll();
        }
        $registerVariable(handle, data) {
            const registration = this._chatVariablesService.registerVariable(data, async (messageText, _arg, model, progress, token) => {
                const varRequestId = `${model.sessionId}-${handle}`;
                this._pendingProgress.set(varRequestId, progress);
                const result = (0, marshalling_1.revive)(await this._proxy.$resolveVariable(handle, varRequestId, messageText, token));
                this._pendingProgress.delete(varRequestId);
                return result;
            });
            this._variables.set(handle, registration);
        }
        async $handleProgressChunk(requestId, progress) {
            const revivedProgress = (0, marshalling_1.revive)(progress);
            this._pendingProgress.get(requestId)?.(revivedProgress);
        }
        $unregisterVariable(handle) {
            this._variables.deleteAndDispose(handle);
        }
    };
    exports.MainThreadChatVariables = MainThreadChatVariables;
    exports.MainThreadChatVariables = MainThreadChatVariables = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadChatVariables),
        __param(1, chatVariables_1.IChatVariablesService)
    ], MainThreadChatVariables);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENoYXRWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENoYXRWYXJpYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBTW5DLFlBQ0MsY0FBK0IsRUFDUixxQkFBNkQ7WUFBNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUxwRSxlQUFVLEdBQUcsSUFBSSx5QkFBYSxFQUFVLENBQUM7WUFDekMscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQXlELENBQUM7WUFNcEcsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRUQsaUJBQWlCLENBQUMsTUFBYyxFQUFFLElBQXVCO1lBQ3hELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDMUgsTUFBTSxZQUFZLEdBQUcsR0FBRyxLQUFLLENBQUMsU0FBUyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBTSxFQUE4QixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFakksSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDM0MsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFNBQWlCLEVBQUUsUUFBMEM7WUFDdkYsTUFBTSxlQUFlLEdBQUcsSUFBQSxvQkFBTSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxlQUFnRCxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVELG1CQUFtQixDQUFDLE1BQWM7WUFDakMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQyxDQUFDO0tBQ0QsQ0FBQTtJQXJDWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQURuQyxJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsdUJBQXVCLENBQUM7UUFTdkQsV0FBQSxxQ0FBcUIsQ0FBQTtPQVJYLHVCQUF1QixDQXFDbkMifQ==