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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-sandbox/services", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionTipsService", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/base/common/network"], function (require, exports, extensions_1, services_1, extensionManagement_1, extensionTipsService_1, files_1, productService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeExtensionTipsService = class NativeExtensionTipsService extends extensionTipsService_1.ExtensionTipsService {
        constructor(fileService, productService, sharedProcessService) {
            super(fileService, productService);
            this.channel = sharedProcessService.getChannel('extensionTipsService');
        }
        getConfigBasedTips(folder) {
            if (folder.scheme === network_1.Schemas.file) {
                return this.channel.call('getConfigBasedTips', [folder]);
            }
            return super.getConfigBasedTips(folder);
        }
        getImportantExecutableBasedTips() {
            return this.channel.call('getImportantExecutableBasedTips');
        }
        getOtherExecutableBasedTips() {
            return this.channel.call('getOtherExecutableBasedTips');
        }
    };
    NativeExtensionTipsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, productService_1.IProductService),
        __param(2, services_1.ISharedProcessService)
    ], NativeExtensionTipsService);
    (0, extensions_1.registerSingleton)(extensionManagement_1.IExtensionTipsService, NativeExtensionTipsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVGlwc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9lbGVjdHJvbi1zYW5kYm94L2V4dGVuc2lvblRpcHNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBWWhHLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEsMkNBQW9CO1FBSTVELFlBQ2UsV0FBeUIsRUFDdEIsY0FBK0IsRUFDekIsb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRVEsa0JBQWtCLENBQUMsTUFBVztZQUN0QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBNkIsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRVEsK0JBQStCO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQWlDLGlDQUFpQyxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUVRLDJCQUEyQjtZQUNuQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFpQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7S0FFRCxDQUFBO0lBNUJLLDBCQUEwQjtRQUs3QixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLGdDQUFxQixDQUFBO09BUGxCLDBCQUEwQixDQTRCL0I7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDJDQUFxQixFQUFFLDBCQUEwQixvQ0FBNEIsQ0FBQyJ9