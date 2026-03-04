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
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/ipc/common/mainProcessService"], function (require, exports, ipc_1, descriptors_1, extensions_1, instantiation_1, mainProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISharedProcessService = void 0;
    exports.registerMainProcessRemoteService = registerMainProcessRemoteService;
    exports.registerSharedProcessRemoteService = registerSharedProcessRemoteService;
    class RemoteServiceStub {
        constructor(channelName, options, remote, instantiationService) {
            const channel = remote.getChannel(channelName);
            if (isRemoteServiceWithChannelClientOptions(options)) {
                return instantiationService.createInstance(new descriptors_1.SyncDescriptor(options.channelClientCtor, [channel]));
            }
            return ipc_1.ProxyChannel.toService(channel, options?.proxyOptions);
        }
    }
    function isRemoteServiceWithChannelClientOptions(obj) {
        const candidate = obj;
        return !!candidate?.channelClientCtor;
    }
    //#region Main Process
    let MainProcessRemoteServiceStub = class MainProcessRemoteServiceStub extends RemoteServiceStub {
        constructor(channelName, options, ipcService, instantiationService) {
            super(channelName, options, ipcService, instantiationService);
        }
    };
    MainProcessRemoteServiceStub = __decorate([
        __param(2, mainProcessService_1.IMainProcessService),
        __param(3, instantiation_1.IInstantiationService)
    ], MainProcessRemoteServiceStub);
    function registerMainProcessRemoteService(id, channelName, options) {
        (0, extensions_1.registerSingleton)(id, new descriptors_1.SyncDescriptor(MainProcessRemoteServiceStub, [channelName, options], true));
    }
    //#endregion
    //#region Shared Process
    exports.ISharedProcessService = (0, instantiation_1.createDecorator)('sharedProcessService');
    let SharedProcessRemoteServiceStub = class SharedProcessRemoteServiceStub extends RemoteServiceStub {
        constructor(channelName, options, ipcService, instantiationService) {
            super(channelName, options, ipcService, instantiationService);
        }
    };
    SharedProcessRemoteServiceStub = __decorate([
        __param(2, exports.ISharedProcessService),
        __param(3, instantiation_1.IInstantiationService)
    ], SharedProcessRemoteServiceStub);
    function registerSharedProcessRemoteService(id, channelName, options) {
        (0, extensions_1.registerSingleton)(id, new descriptors_1.SyncDescriptor(SharedProcessRemoteServiceStub, [channelName, options], true));
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9pcGMvZWxlY3Ryb24tc2FuZGJveC9zZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtRGhHLDRFQUVDO0lBZ0NELGdGQUVDO0lBM0VELE1BQWUsaUJBQWlCO1FBQy9CLFlBQ0MsV0FBbUIsRUFDbkIsT0FBK0YsRUFDL0YsTUFBYyxFQUNkLG9CQUEyQztZQUUzQyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRS9DLElBQUksdUNBQXVDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsSUFBSSw0QkFBYyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RyxDQUFDO1lBRUQsT0FBTyxrQkFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQy9ELENBQUM7S0FDRDtJQVVELFNBQVMsdUNBQXVDLENBQUksR0FBWTtRQUMvRCxNQUFNLFNBQVMsR0FBRyxHQUE0RCxDQUFDO1FBRS9FLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQztJQUN2QyxDQUFDO0lBRUQsc0JBQXNCO0lBRXRCLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQStDLFNBQVEsaUJBQW9CO1FBQ2hGLFlBQVksV0FBbUIsRUFBRSxPQUErRixFQUF1QixVQUErQixFQUF5QixvQkFBMkM7WUFDelAsS0FBSyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDL0QsQ0FBQztLQUNELENBQUE7SUFKSyw0QkFBNEI7UUFDa0csV0FBQSx3Q0FBbUIsQ0FBQTtRQUFtQyxXQUFBLHFDQUFxQixDQUFBO09BRHpNLDRCQUE0QixDQUlqQztJQUVELFNBQWdCLGdDQUFnQyxDQUFJLEVBQXdCLEVBQUUsV0FBbUIsRUFBRSxPQUFvRjtRQUN0TCxJQUFBLDhCQUFpQixFQUFDLEVBQUUsRUFBRSxJQUFJLDRCQUFjLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN2RyxDQUFDO0lBRUQsWUFBWTtJQUVaLHdCQUF3QjtJQUVYLFFBQUEscUJBQXFCLEdBQUcsSUFBQSwrQkFBZSxFQUF3QixzQkFBc0IsQ0FBQyxDQUFDO0lBb0JwRyxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUFpRCxTQUFRLGlCQUFvQjtRQUNsRixZQUFZLFdBQW1CLEVBQUUsT0FBK0YsRUFBeUIsVUFBaUMsRUFBeUIsb0JBQTJDO1lBQzdQLEtBQUssQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQy9ELENBQUM7S0FDRCxDQUFBO0lBSkssOEJBQThCO1FBQ2dHLFdBQUEsNkJBQXFCLENBQUE7UUFBcUMsV0FBQSxxQ0FBcUIsQ0FBQTtPQUQ3TSw4QkFBOEIsQ0FJbkM7SUFFRCxTQUFnQixrQ0FBa0MsQ0FBSSxFQUF3QixFQUFFLFdBQW1CLEVBQUUsT0FBb0Y7UUFDeEwsSUFBQSw4QkFBaUIsRUFBQyxFQUFFLEVBQUUsSUFBSSw0QkFBYyxDQUFDLDhCQUE4QixFQUFFLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekcsQ0FBQzs7QUFFRCxZQUFZIn0=