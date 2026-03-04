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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/url/common/urlService", "vs/workbench/services/environment/browser/environmentService", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/product/common/productService"], function (require, exports, url_1, uri_1, extensions_1, urlService_1, environmentService_1, opener_1, network_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserURLService = void 0;
    class BrowserURLOpener {
        constructor(urlService, productService) {
            this.urlService = urlService;
            this.productService = productService;
        }
        async open(resource, options) {
            if (options?.openExternal) {
                return false;
            }
            if (!(0, network_1.matchesScheme)(resource, this.productService.urlProtocol)) {
                return false;
            }
            if (typeof resource === 'string') {
                resource = uri_1.URI.parse(resource);
            }
            return this.urlService.open(resource, { trusted: true });
        }
    }
    let BrowserURLService = class BrowserURLService extends urlService_1.AbstractURLService {
        constructor(environmentService, openerService, productService) {
            super();
            this.provider = environmentService.options?.urlCallbackProvider;
            if (this.provider) {
                this._register(this.provider.onCallback(uri => this.open(uri, { trusted: true })));
            }
            this._register(openerService.registerOpener(new BrowserURLOpener(this, productService)));
        }
        create(options) {
            if (this.provider) {
                return this.provider.create(options);
            }
            return uri_1.URI.parse('unsupported://');
        }
    };
    exports.BrowserURLService = BrowserURLService;
    exports.BrowserURLService = BrowserURLService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], BrowserURLService);
    (0, extensions_1.registerSingleton)(url_1.IURLService, BrowserURLService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91cmwvYnJvd3Nlci91cmxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNDaEcsTUFBTSxnQkFBZ0I7UUFFckIsWUFDUyxVQUF1QixFQUN2QixjQUErQjtZQUQvQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3ZCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUNwQyxDQUFDO1FBRUwsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFzQixFQUFFLE9BQW1EO1lBQ3JGLElBQUssT0FBMkMsRUFBRSxZQUFZLEVBQUUsQ0FBQztnQkFDaEUsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUEsdUJBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUMvRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNsQyxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQ0Q7SUFFTSxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLCtCQUFrQjtRQUl4RCxZQUNzQyxrQkFBdUQsRUFDNUUsYUFBNkIsRUFDNUIsY0FBK0I7WUFFaEQsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsUUFBUSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQztZQUVoRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBZ0M7WUFDdEMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUVELE9BQU8sU0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7S0FDRCxDQUFBO0lBM0JZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBSzNCLFdBQUEsd0RBQW1DLENBQUE7UUFDbkMsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSxnQ0FBZSxDQUFBO09BUEwsaUJBQWlCLENBMkI3QjtJQUVELElBQUEsOEJBQWlCLEVBQUMsaUJBQVcsRUFBRSxpQkFBaUIsb0NBQTRCLENBQUMifQ==