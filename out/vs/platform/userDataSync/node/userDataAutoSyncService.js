var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataAutoSyncService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, event_1, native_1, productService_1, storage_1, telemetry_1, userDataAutoSyncService_1, userDataSync_1, userDataSyncAccount_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    let UserDataAutoSyncService = class UserDataAutoSyncService extends userDataAutoSyncService_1.UserDataAutoSyncService {
        constructor(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, nativeHostService, logService, authTokenService, telemetryService, userDataSyncMachinesService, storageService) {
            super(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, logService, authTokenService, telemetryService, userDataSyncMachinesService, storageService);
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.map(nativeHostService.onDidFocusMainWindow, () => 'windowFocus'), event_1.Event.map(nativeHostService.onDidOpenMainWindow, () => 'windowOpen')), (last, source) => last ? [...last, source] : [source], 1000)(sources => this.triggerSync(sources, true, false)));
        }
    };
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    exports.UserDataAutoSyncService = UserDataAutoSyncService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, userDataSync_1.IUserDataSyncService),
        __param(5, native_1.INativeHostService),
        __param(6, userDataSync_1.IUserDataSyncLogService),
        __param(7, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(10, storage_1.IStorageService)
    ], UserDataAutoSyncService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFBdXRvU3luY1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvbm9kZS91c2VyRGF0YUF1dG9TeW5jU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBZU8sSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxpREFBMkI7UUFFdkUsWUFDa0IsY0FBK0IsRUFDWCxrQ0FBdUUsRUFDakYsd0JBQW1ELEVBQzlDLDZCQUE2RCxFQUN2RSxtQkFBeUMsRUFDM0MsaUJBQXFDLEVBQ2hDLFVBQW1DLEVBQy9CLGdCQUE2QyxFQUN2RCxnQkFBbUMsRUFDeEIsMkJBQXlELEVBQ3RFLGNBQStCO1lBRWhELEtBQUssQ0FBQyxjQUFjLEVBQUUsa0NBQWtDLEVBQUUsd0JBQXdCLEVBQUUsNkJBQTZCLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLDJCQUEyQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXJPLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLFFBQVEsQ0FBbUIsYUFBSyxDQUFDLEdBQUcsQ0FDeEQsYUFBSyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFDdEUsYUFBSyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FDcEUsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckgsQ0FBQztLQUVELENBQUE7SUF2QlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFHakMsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSxrREFBbUMsQ0FBQTtRQUNuQyxXQUFBLHdDQUF5QixDQUFBO1FBQ3pCLFdBQUEsNkNBQThCLENBQUE7UUFDOUIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLDJCQUFrQixDQUFBO1FBQ2xCLFdBQUEsc0NBQXVCLENBQUE7UUFDdkIsV0FBQSxpREFBMkIsQ0FBQTtRQUMzQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsbURBQTRCLENBQUE7UUFDNUIsWUFBQSx5QkFBZSxDQUFBO09BYkwsdUJBQXVCLENBdUJuQyJ9