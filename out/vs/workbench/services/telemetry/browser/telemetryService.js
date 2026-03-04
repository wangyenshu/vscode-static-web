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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/browser/1dsAppender", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/telemetry/browser/workbenchCommonProperties"], function (require, exports, lifecycle_1, configuration_1, extensions_1, log_1, productService_1, storage_1, _1dsAppender_1, telemetry_1, telemetryLogAppender_1, telemetryService_1, telemetryUtils_1, environmentService_1, remoteAgentService_1, workbenchCommonProperties_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        get sessionId() { return this.impl.sessionId; }
        get machineId() { return this.impl.machineId; }
        get sqmId() { return this.impl.sqmId; }
        get firstSessionDate() { return this.impl.firstSessionDate; }
        get msftInternal() { return this.impl.msftInternal; }
        constructor(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService) {
            super();
            this.impl = telemetryUtils_1.NullTelemetryService;
            this.sendErrorTelemetry = true;
            this.impl = this.initializeService(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService);
            // When the level changes it could change from off to on and we want to make sure telemetry is properly intialized
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID)) {
                    this.impl = this.initializeService(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService);
                }
            }));
        }
        /**
         * Initializes the telemetry service to be a full fledged service.
         * This is only done once and only when telemetry is enabled as this will also ping the endpoint to
         * ensure its not adblocked and we can send telemetry
         */
        initializeService(environmentService, logService, loggerService, configurationService, storageService, productService, remoteAgentService) {
            const telemetrySupported = (0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && productService.aiConfig?.ariaKey;
            if (telemetrySupported && (0, telemetryUtils_1.getTelemetryLevel)(configurationService) !== 0 /* TelemetryLevel.NONE */ && this.impl === telemetryUtils_1.NullTelemetryService) {
                // If remote server is present send telemetry through that, else use the client side appender
                const appenders = [];
                const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
                if (!(0, telemetryUtils_1.isLoggingOnly)(productService, environmentService)) {
                    if (remoteAgentService.getConnection() !== null) {
                        const remoteTelemetryProvider = {
                            log: remoteAgentService.logTelemetry.bind(remoteAgentService),
                            flush: remoteAgentService.flushTelemetry.bind(remoteAgentService)
                        };
                        appenders.push(remoteTelemetryProvider);
                    }
                    else {
                        appenders.push(new _1dsAppender_1.OneDataSystemWebAppender(isInternal, 'monacoworkbench', null, productService.aiConfig?.ariaKey));
                    }
                }
                appenders.push(new telemetryLogAppender_1.TelemetryLogAppender(logService, loggerService, environmentService, productService));
                const config = {
                    appenders,
                    commonProperties: (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(storageService, productService.commit, productService.version, isInternal, environmentService.remoteAuthority, productService.embedderIdentifier, productService.removeTelemetryMachineId, environmentService.options && environmentService.options.resolveCommonTelemetryProperties),
                    sendErrorTelemetry: this.sendErrorTelemetry,
                };
                return this._register(new telemetryService_1.TelemetryService(config, configurationService, productService));
            }
            return this.impl;
        }
        setExperimentProperty(name, value) {
            return this.impl.setExperimentProperty(name, value);
        }
        get telemetryLevel() {
            return this.impl.telemetryLevel;
        }
        publicLog(eventName, data) {
            this.impl.publicLog(eventName, data);
        }
        publicLog2(eventName, data) {
            this.publicLog(eventName, data);
        }
        publicLogError(errorEventName, data) {
            this.impl.publicLog(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            this.publicLogError(eventName, data);
        }
    };
    exports.TelemetryService = TelemetryService;
    exports.TelemetryService = TelemetryService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, log_1.ILoggerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, productService_1.IProductService),
        __param(6, remoteAgentService_1.IRemoteAgentService)
    ], TelemetryService);
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, TelemetryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZWxlbWV0cnkvYnJvd3Nlci90ZWxlbWV0cnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQU8vQyxJQUFJLFNBQVMsS0FBYSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN2RCxJQUFJLFNBQVMsS0FBYSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN2RCxJQUFJLEtBQUssS0FBYSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLGdCQUFnQixLQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDckUsSUFBSSxZQUFZLEtBQTBCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBRTFFLFlBQ3NDLGtCQUF1RCxFQUMvRSxVQUF1QixFQUNwQixhQUE2QixFQUN0QixvQkFBMkMsRUFDakQsY0FBK0IsRUFDL0IsY0FBK0IsRUFDM0Isa0JBQXVDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBbEJELFNBQUksR0FBc0IscUNBQW9CLENBQUM7WUFDdkMsdUJBQWtCLEdBQUcsSUFBSSxDQUFDO1lBbUJ6QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxj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