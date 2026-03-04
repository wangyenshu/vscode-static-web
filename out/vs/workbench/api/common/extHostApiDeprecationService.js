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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService"], function (require, exports, instantiation_1, log_1, extHostProtocol, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullApiDeprecationService = exports.ExtHostApiDeprecationService = exports.IExtHostApiDeprecationService = void 0;
    exports.IExtHostApiDeprecationService = (0, instantiation_1.createDecorator)('IExtHostApiDeprecationService');
    let ExtHostApiDeprecationService = class ExtHostApiDeprecationService {
        constructor(rpc, _extHostLogService) {
            this._extHostLogService = _extHostLogService;
            this._reportedUsages = new Set();
            this._telemetryShape = rpc.getProxy(extHostProtocol.MainContext.MainThreadTelemetry);
        }
        report(apiId, extension, migrationSuggestion) {
            const key = this.getUsageKey(apiId, extension);
            if (this._reportedUsages.has(key)) {
                return;
            }
            this._reportedUsages.add(key);
            if (extension.isUnderDevelopment) {
                this._extHostLogService.warn(`[Deprecation Warning] '${apiId}' is deprecated. ${migrationSuggestion}`);
            }
            this._telemetryShape.$publicLog2('extHostDeprecatedApiUsage', {
                extensionId: extension.identifier.value,
                apiId: apiId,
            });
        }
        getUsageKey(apiId, extension) {
            return `${apiId}-${extension.identifier.value}`;
        }
    };
    exports.ExtHostApiDeprecationService = ExtHostApiDeprecationService;
    exports.ExtHostApiDeprecationService = ExtHostApiDeprecationService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostApiDeprecationService);
    exports.NullApiDeprecationService = Object.freeze(new class {
        report(_apiId, _extension, _warningMessage) {
            // noop
        }
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFwaURlcHJlY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RBcGlEZXByZWNhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsNkJBQTZCLEdBQUcsSUFBQSwrQkFBZSxFQUFnQywrQkFBK0IsQ0FBQyxDQUFDO0lBRXRILElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTRCO1FBT3hDLFlBQ3FCLEdBQXVCLEVBQzlCLGtCQUFnRDtZQUEvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQWE7WUFMN0Msb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBT3BELElBQUksQ0FBQyxlQUFlLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUFhLEVBQUUsU0FBZ0MsRUFBRSxtQkFBMkI7WUFDekYsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0MsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTlCLElBQUksU0FBUyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEtBQUssb0JBQW9CLG1CQUFtQixFQUFFLENBQUMsQ0FBQztZQUN4RyxDQUFDO1lBWUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQWlELDJCQUEyQixFQUFFO2dCQUM3RyxXQUFXLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLO2dCQUN2QyxLQUFLLEVBQUUsS0FBSzthQUNaLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxXQUFXLENBQUMsS0FBYSxFQUFFLFNBQWdDO1lBQ2xFLE9BQU8sR0FBRyxLQUFLLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqRCxDQUFDO0tBQ0QsQ0FBQTtJQTVDWSxvRUFBNEI7MkNBQTVCLDRCQUE0QjtRQVF0QyxXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsaUJBQVcsQ0FBQTtPQVRELDRCQUE0QixDQTRDeEM7SUFHWSxRQUFBLHlCQUF5QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSTtRQUduRCxNQUFNLENBQUMsTUFBYyxFQUFFLFVBQWlDLEVBQUUsZUFBdUI7WUFDdkYsT0FBTztRQUNSLENBQUM7S0FDRCxFQUFFLENBQUMsQ0FBQyJ9