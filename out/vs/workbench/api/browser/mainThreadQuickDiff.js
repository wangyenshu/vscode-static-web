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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/scm/common/quickDiff", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, cancellation_1, lifecycle_1, uri_1, extHost_protocol_1, quickDiff_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadQuickDiff = void 0;
    let MainThreadQuickDiff = class MainThreadQuickDiff {
        constructor(extHostContext, quickDiffService) {
            this.quickDiffService = quickDiffService;
            this.providerDisposables = new lifecycle_1.DisposableMap();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostQuickDiff);
        }
        async $registerQuickDiffProvider(handle, selector, label, rootUri) {
            const provider = {
                label,
                rootUri: uri_1.URI.revive(rootUri),
                selector,
                isSCM: false,
                getOriginalResource: async (uri) => {
                    return uri_1.URI.revive(await this.proxy.$provideOriginalResource(handle, uri, cancellation_1.CancellationToken.None));
                }
            };
            const disposable = this.quickDiffService.addQuickDiffProvider(provider);
            this.providerDisposables.set(handle, disposable);
        }
        async $unregisterQuickDiffProvider(handle) {
            if (this.providerDisposables.has(handle)) {
                this.providerDisposables.deleteAndDispose(handle);
            }
        }
        dispose() {
            this.providerDisposables.dispose();
        }
    };
    exports.MainThreadQuickDiff = MainThreadQuickDiff;
    exports.MainThreadQuickDiff = MainThreadQuickDiff = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadQuickDiff),
        __param(1, quickDiff_1.IQuickDiffService)
    ], MainThreadQuickDiff);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFF1aWNrRGlmZi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkUXVpY2tEaWZmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjtRQUsvQixZQUNDLGNBQStCLEVBQ1osZ0JBQW9EO1lBQW5DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFKaEUsd0JBQW1CLEdBQUcsSUFBSSx5QkFBYSxFQUF1QixDQUFDO1lBTXRFLElBQUksQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxNQUFjLEVBQUUsUUFBOEIsRUFBRSxLQUFhLEVBQUUsT0FBa0M7WUFDakksTUFBTSxRQUFRLEdBQXNCO2dCQUNuQyxLQUFLO2dCQUNMLE9BQU8sRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztnQkFDNUIsUUFBUTtnQkFDUixLQUFLLEVBQUUsS0FBSztnQkFDWixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsR0FBUSxFQUFFLEVBQUU7b0JBQ3ZDLE9BQU8sU0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNuRyxDQUFDO2FBQ0QsQ0FBQztZQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsS0FBSyxDQUFDLDRCQUE0QixDQUFDLE1BQWM7WUFDaEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsQ0FBQztLQUNELENBQUE7SUFuQ1ksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFEL0IsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDO1FBUW5ELFdBQUEsNkJBQWlCLENBQUE7T0FQUCxtQkFBbUIsQ0FtQy9CIn0=