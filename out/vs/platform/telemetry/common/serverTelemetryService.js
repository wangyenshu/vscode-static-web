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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, configuration_1, instantiation_1, productService_1, telemetry_1, telemetryService_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IServerTelemetryService = exports.ServerNullTelemetryService = exports.ServerTelemetryService = void 0;
    let ServerTelemetryService = class ServerTelemetryService extends telemetryService_1.TelemetryService {
        constructor(config, injectedTelemetryLevel, _configurationService, _productService) {
            super(config, _configurationService, _productService);
            this._injectedTelemetryLevel = injectedTelemetryLevel;
        }
        publicLog(eventName, data) {
            if (this._injectedTelemetryLevel < 3 /* TelemetryLevel.USAGE */) {
                return;
            }
            return super.publicLog(eventName, data);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError(errorEventName, data) {
            if (this._injectedTelemetryLevel < 2 /* TelemetryLevel.ERROR */) {
                return Promise.resolve(undefined);
            }
            return super.publicLogError(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        async updateInjectedTelemetryLevel(telemetryLevel) {
            if (telemetryLevel === undefined) {
                this._injectedTelemetryLevel = 0 /* TelemetryLevel.NONE */;
                throw new Error('Telemetry level cannot be undefined. This will cause infinite looping!');
            }
            // We always take the most restrictive level because we don't want multiple clients to connect and send data when one client does not consent
            this._injectedTelemetryLevel = this._injectedTelemetryLevel ? Math.min(this._injectedTelemetryLevel, telemetryLevel) : telemetryLevel;
            if (this._injectedTelemetryLevel === 0 /* TelemetryLevel.NONE */) {
                this.dispose();
            }
        }
    };
    exports.ServerTelemetryService = ServerTelemetryService;
    exports.ServerTelemetryService = ServerTelemetryService = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, productService_1.IProductService)
    ], ServerTelemetryService);
    exports.ServerNullTelemetryService = new class extends telemetryUtils_1.NullTelemetryServiceShape {
        async updateInjectedTelemetryLevel() { return; } // No-op, telemetry is already disabled
    };
    exports.IServerTelemetryService = (0, instantiation_1.refineServiceDecorator)(telemetry_1.ITelemetryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyVGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vc2VydmVyVGVsZW1ldHJ5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxtQ0FBZ0I7UUFLM0QsWUFDQyxNQUErQixFQUMvQixzQkFBc0MsRUFDZixxQkFBNEMsRUFDbEQsZUFBZ0M7WUFFakQsS0FBSyxDQUFDLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsc0JBQXNCLENBQUM7UUFDdkQsQ0FBQztRQUVRLFNBQVMsQ0FBQyxTQUFpQixFQUFFLElBQXFCO1lBQzFELElBQUksSUFBSSxDQUFDLHVCQUF1QiwrQkFBdUIsRUFBRSxDQUFDO2dCQUN6RCxPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVRLFVBQVUsQ0FBc0YsU0FBaUIsRUFBRSxJQUFnQztZQUMzSixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLElBQWtDLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRVEsY0FBYyxDQUFDLGNBQXNCLEVBQUUsSUFBcUI7WUFDcEUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLCtCQUF1QixFQUFFLENBQUM7Z0JBQ3pELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRVEsZUFBZSxDQUFzRixTQUFpQixFQUFFLElBQWdDO1lBQ2hLLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsSUFBa0MsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxLQUFLLENBQUMsNEJBQTRCLENBQUMsY0FBOEI7WUFDaEUsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyx1QkFBdUIsOEJBQXNCLENBQUM7Z0JBQ25ELE1BQU0sSUFBSSxLQUFLLENBQUMsd0VBQXdFLENBQUMsQ0FBQztZQUMzRixDQUFDO1lBQ0QsNklBQTZJO1lBQzdJLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUM7WUFDdEksSUFBSSxJQUFJLENBQUMsdUJBQXVCLGdDQUF3QixFQUFFLENBQUM7Z0JBQzFELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFoRFksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFRaEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGdDQUFlLENBQUE7T0FUTCxzQkFBc0IsQ0FnRGxDO0lBRVksUUFBQSwwQkFBMEIsR0FBRyxJQUFJLEtBQU0sU0FBUSwwQ0FBeUI7UUFDcEYsS0FBSyxDQUFDLDRCQUE0QixLQUFvQixPQUFPLENBQUMsQ0FBQyxDQUFDLHVDQUF1QztLQUN2RyxDQUFDO0lBRVcsUUFBQSx1QkFBdUIsR0FBRyxJQUFBLHNDQUFzQixFQUE2Qyw2QkFBaUIsQ0FBQyxDQUFDIn0=