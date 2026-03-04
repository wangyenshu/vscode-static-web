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
define(["require", "exports", "vs/base/parts/request/browser/request", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/request/common/request"], function (require, exports, request_1, configuration_1, log_1, request_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestService = void 0;
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService extends request_2.AbstractRequestService {
        constructor(configurationService, loggerService) {
            super(loggerService);
            this.configurationService = configurationService;
        }
        async request(options, token) {
            if (!options.proxyAuthorization) {
                options.proxyAuthorization = this.configurationService.getValue('http.proxyAuthorization');
            }
            return this.logAndRequest('browser', options, () => (0, request_1.request)(options, token));
        }
        async resolveProxy(url) {
            return undefined; // not implemented in the web
        }
        async loadCertificates() {
            return []; // not implemented in the web
        }
    };
    exports.RequestService = RequestService;
    exports.RequestService = RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILoggerService)
    ], RequestService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZXF1ZXN0L2Jyb3dzZXIvcmVxdWVzdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU2hHOzs7T0FHRztJQUNJLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxnQ0FBc0I7UUFJekQsWUFDeUMsb0JBQTJDLEVBQ25FLGFBQTZCO1lBRTdDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUhtQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBSXBGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQXdCLEVBQUUsS0FBd0I7WUFDL0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBUyx5QkFBeUIsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLGlCQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBVztZQUM3QixPQUFPLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QjtRQUNoRCxDQUFDO1FBRUQsS0FBSyxDQUFDLGdCQUFnQjtZQUNyQixPQUFPLEVBQUUsQ0FBQyxDQUFDLDZCQUE2QjtRQUN6QyxDQUFDO0tBQ0QsQ0FBQTtJQXpCWSx3Q0FBYzs2QkFBZCxjQUFjO1FBS3hCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxvQkFBYyxDQUFBO09BTkosY0FBYyxDQXlCMUIifQ==