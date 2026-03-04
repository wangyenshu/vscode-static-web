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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol"], function (require, exports, lifecycle_1, configuration_1, environment_1, productService_1, telemetry_1, telemetryUtils_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    var MainThreadTelemetry_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTelemetry = void 0;
    let MainThreadTelemetry = class MainThreadTelemetry extends lifecycle_1.Disposable {
        static { MainThreadTelemetry_1 = this; }
        static { this._name = 'pluginHostTelemetry'; }
        constructor(extHostContext, _telemetryService, _configurationService, _environmentService, _productService) {
            super();
            this._telemetryService = _telemetryService;
            this._configurationService = _configurationService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTelemetry);
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService)) {
                this._register(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID) || e.affectsConfiguration(telemetry_1.TELEMETRY_OLD_SETTING_ID)) {
                        this._proxy.$onDidChangeTelemetryLevel(this.telemetryLevel);
                    }
                }));
            }
            this._proxy.$initializeTelemetryLevel(this.telemetryLevel, (0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService), this._productService.enabledTelemetryLevels);
        }
        get telemetryLevel() {
            if (!(0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService)) {
                return 0 /* TelemetryLevel.NONE */;
            }
            return this._telemetryService.telemetryLevel;
        }
        $publicLog(eventName, data = Object.create(null)) {
            // __GDPR__COMMON__ "pluginHostTelemetry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            data[MainThreadTelemetry_1._name] = true;
            this._telemetryService.publicLog(eventName, data);
        }
        $publicLog2(eventName, data) {
            this.$publicLog(eventName, data);
        }
    };
    exports.MainThreadTelemetry = MainThreadTelemetry;
    exports.MainThreadTelemetry = MainThreadTelemetry = MainThreadTelemetry_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTelemetry),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, productService_1.IProductService)
    ], MainThreadTelemetry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlbGVtZXRyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVGVsZW1ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTs7aUJBRzFCLFVBQUssR0FBRyxxQkFBcUIsQUFBeEIsQ0FBeUI7UUFFdEQsWUFDQyxjQUErQixFQUNLLGlCQUFvQyxFQUNoQyxxQkFBNEMsRUFDOUMsbUJBQXdDLEVBQzVDLGVBQWdDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBTDRCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQzVDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUlsRSxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXZFLElBQUksSUFBQSxrQ0FBaUIsRUFBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUN0RSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxnQ0FBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxvQ0FBd0IsQ0FBQyxFQUFFLENBQUM7d0JBQ3RHLElBQUksQ0FBQyxNQUFNLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUM3RCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUEsa0NBQWlCLEVBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDNUssQ0FBQztRQUVELElBQVksY0FBYztZQUN6QixJQUFJLENBQUMsSUFBQSxrQ0FBaUIsRUFBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hFLG1DQUEyQjtZQUM1QixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDO1FBQzlDLENBQUM7UUFFRCxVQUFVLENBQUMsU0FBaUIsRUFBRSxPQUFZLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQzVELHNJQUFzSTtZQUN0SSxJQUFJLENBQUMscUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxXQUFXLENBQXNGLFNBQWlCLEVBQUUsSUFBZ0M7WUFDbkosSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsSUFBVyxDQUFDLENBQUM7UUFDekMsQ0FBQzs7SUExQ1csa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFEL0IsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDO1FBUW5ELFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsZ0NBQWUsQ0FBQTtPQVZMLG1CQUFtQixDQTJDL0IifQ==