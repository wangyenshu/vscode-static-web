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
define(["require", "exports", "vs/base/browser/window", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/driver/browser/driver", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, window_1, environment_1, files_1, log_1, driver_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerWindowDriver = registerWindowDriver;
    let NativeWindowDriver = class NativeWindowDriver extends driver_1.BrowserWindowDriver {
        constructor(helper, fileService, environmentService, lifecycleService, logService) {
            super(fileService, environmentService, lifecycleService, logService);
            this.helper = helper;
        }
        exitApplication() {
            return this.helper.exitApplication();
        }
    };
    NativeWindowDriver = __decorate([
        __param(1, files_1.IFileService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, log_1.ILogService)
    ], NativeWindowDriver);
    function registerWindowDriver(instantiationService, helper) {
        Object.assign(window_1.mainWindow, { driver: instantiationService.createInstance(NativeWindowDriver, helper) });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJpdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2RyaXZlci9lbGVjdHJvbi1zYW5kYm94L2RyaXZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQStCaEcsb0RBRUM7SUFuQkQsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSw0QkFBbUI7UUFFbkQsWUFDa0IsTUFBaUMsRUFDcEMsV0FBeUIsRUFDbEIsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUN6QyxVQUF1QjtZQUVwQyxLQUFLLENBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBTnBELFdBQU0sR0FBTixNQUFNLENBQTJCO1FBT25ELENBQUM7UUFFUSxlQUFlO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0QyxDQUFDO0tBQ0QsQ0FBQTtJQWZLLGtCQUFrQjtRQUlyQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxpQkFBVyxDQUFBO09BUFIsa0JBQWtCLENBZXZCO0lBRUQsU0FBZ0Isb0JBQW9CLENBQUMsb0JBQTJDLEVBQUUsTUFBaUM7UUFDbEgsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEcsQ0FBQyJ9