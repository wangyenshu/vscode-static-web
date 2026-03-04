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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/objects", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/nls"], function (require, exports, instantiation_1, event_1, log_1, extHostInitDataService_1, extensionHostProtocol_1, remoteHosts_1, telemetryUtils_1, objects_1, uri_1, lifecycle_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostTelemetry = exports.ExtHostTelemetryLogger = exports.ExtHostTelemetry = void 0;
    exports.isNewAppInstall = isNewAppInstall;
    let ExtHostTelemetry = class ExtHostTelemetry extends lifecycle_1.Disposable {
        constructor(initData, loggerService) {
            super();
            this.initData = initData;
            this.loggerService = loggerService;
            this._onDidChangeTelemetryEnabled = this._register(new event_1.Emitter());
            this.onDidChangeTelemetryEnabled = this._onDidChangeTelemetryEnabled.event;
            this._onDidChangeTelemetryConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeTelemetryConfiguration = this._onDidChangeTelemetryConfiguration.event;
            this._productConfig = { usage: true, error: true };
            this._level = 0 /* TelemetryLevel.NONE */;
            // This holds whether or not we're running with --disable-telemetry, etc. Usings supportsTelemtry() from the main thread
            this._telemetryIsSupported = false;
            this._inLoggingOnlyMode = false;
            this._telemetryLoggers = new Map();
            this.extHostTelemetryLogFile = uri_1.URI.revive(this.initData.environment.extensionTelemetryLogResource);
            this._inLoggingOnlyMode = this.initData.environment.isExtensionTelemetryLoggingOnly;
            this._outputLogger = loggerService.createLogger(this.extHostTelemetryLogFile, { id: telemetryUtils_1.extensionTelemetryLogChannelId, name: (0, nls_1.localize)('extensionTelemetryLog', "Extension Telemetry{0}", this._inLoggingOnlyMode ? ' (Not Sent)' : ''), hidden: true });
            this._register(this._outputLogger);
            this._register(loggerService.onDidChangeLogLevel(arg => {
                if ((0, log_1.isLogLevel)(arg)) {
                    this.updateLoggerVisibility();
                }
            }));
            this._outputLogger.info('Below are logs for extension telemetry events sent to the telemetry output channel API once the log level is set to trace.');
            this._outputLogger.info('===========================================================');
        }
        updateLoggerVisibility() {
            this.loggerService.setVisibility(this.extHostTelemetryLogFile, this._telemetryIsSupported && this.loggerService.getLogLevel() === log_1.LogLevel.Trace);
        }
        getTelemetryConfiguration() {
            return this._level === 3 /* TelemetryLevel.USAGE */;
        }
        getTelemetryDetails() {
            return {
                isCrashEnabled: this._level >= 1 /* TelemetryLevel.CRASH */,
                isErrorsEnabled: this._productConfig.error ? this._level >= 2 /* TelemetryLevel.ERROR */ : false,
                isUsageEnabled: this._productConfig.usage ? this._level >= 3 /* TelemetryLevel.USAGE */ : false
            };
        }
        instantiateLogger(extension, sender, options) {
            const telemetryDetails = this.getTelemetryDetails();
            const logger = new ExtHostTelemetryLogger(sender, options, extension, this._outputLogger, this._inLoggingOnlyMode, this.getBuiltInCommonProperties(extension), { isUsageEnabled: telemetryDetails.isUsageEnabled, isErrorsEnabled: telemetryDetails.isErrorsEnabled });
            const loggers = this._telemetryLoggers.get(extension.identifier.value) ?? [];
            this._telemetryLoggers.set(extension.identifier.value, [...loggers, logger]);
            return logger.apiTelemetryLogger;
        }
        $initializeTelemetryLevel(level, supportsTelemetry, productConfig) {
            this._level = level;
            this._telemetryIsSupported = supportsTelemetry;
            this._productConfig = productConfig ?? { usage: true, error: true };
            this.updateLoggerVisibility();
        }
        getBuiltInCommonProperties(extension) {
            const commonProperties = Object.create(null);
            // TODO @lramos15, does os info like node arch, platform version, etc exist here.
            // Or will first party extensions just mix this in
            commonProperties['common.extname'] = `${extension.publisher}.${extension.name}`;
            commonProperties['common.extversion'] = extension.version;
            commonProperties['common.vscodemachineid'] = this.initData.telemetryInfo.machineId;
            commonProperties['common.vscodesessionid'] = this.initData.telemetryInfo.sessionId;
            commonProperties['common.sqmid'] = this.initData.telemetryInfo.sqmId;
            commonProperties['common.vscodeversion'] = this.initData.version;
            commonProperties['common.isnewappinstall'] = isNewAppInstall(this.initData.telemetryInfo.firstSessionDate);
            commonProperties['common.product'] = this.initData.environment.appHost;
            switch (this.initData.uiKind) {
                case extensionHostProtocol_1.UIKind.Web:
                    commonProperties['common.uikind'] = 'web';
                    break;
                case extensionHostProtocol_1.UIKind.Desktop:
                    commonProperties['common.uikind'] = 'desktop';
                    break;
                default:
                    commonProperties['common.uikind'] = 'unknown';
            }
            commonProperties['common.remotename'] = (0, remoteHosts_1.getRemoteName)((0, telemetryUtils_1.cleanRemoteAuthority)(this.initData.remote.authority));
            return commonProperties;
        }
        $onDidChangeTelemetryLevel(level) {
            this._oldTelemetryEnablement = this.getTelemetryConfiguration();
            this._level = level;
            const telemetryDetails = this.getTelemetryDetails();
            // Remove all disposed loggers
            this._telemetryLoggers.forEach((loggers, key) => {
                const newLoggers = loggers.filter(l => !l.isDisposed);
                if (newLoggers.length === 0) {
                    this._telemetryLoggers.delete(key);
                }
                else {
                    this._telemetryLoggers.set(key, newLoggers);
                }
            });
            // Loop through all loggers and update their level
            this._telemetryLoggers.forEach(loggers => {
                for (const logger of loggers) {
                    logger.updateTelemetryEnablements(telemetryDetails.isUsageEnabled, telemetryDetails.isErrorsEnabled);
                }
            });
            if (this._oldTelemetryEnablement !== this.getTelemetryConfiguration()) {
                this._onDidChangeTelemetryEnabled.fire(this.getTelemetryConfiguration());
            }
            this._onDidChangeTelemetryConfiguration.fire(this.getTelemetryDetails());
            this.updateLoggerVisibility();
        }
        onExtensionError(extension, error) {
            const loggers = this._telemetryLoggers.get(extension.value);
            const nonDisposedLoggers = loggers?.filter(l => !l.isDisposed);
            if (!nonDisposedLoggers) {
                this._telemetryLoggers.delete(extension.value);
                return false;
            }
            let errorEmitted = false;
            for (const logger of nonDisposedLoggers) {
                if (logger.ignoreUnhandledExtHostErrors) {
                    continue;
                }
                logger.logError(error);
                errorEmitted = true;
            }
            return errorEmitted;
        }
    };
    exports.ExtHostTelemetry = ExtHostTelemetry;
    exports.ExtHostTelemetry = ExtHostTelemetry = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, log_1.ILoggerService)
    ], ExtHostTelemetry);
    class ExtHostTelemetryLogger {
        static validateSender(sender) {
            if (typeof sender !== 'object') {
                throw new TypeError('TelemetrySender argument is invalid');
            }
            if (typeof sender.sendEventData !== 'function') {
                throw new TypeError('TelemetrySender.sendEventData must be a function');
            }
            if (typeof sender.sendErrorData !== 'function') {
                throw new TypeError('TelemetrySender.sendErrorData must be a function');
            }
            if (typeof sender.flush !== 'undefined' && typeof sender.flush !== 'function') {
                throw new TypeError('TelemetrySender.flush must be a function or undefined');
            }
        }
        constructor(sender, options, _extension, _logger, _inLoggingOnlyMode, _commonProperties, telemetryEnablements) {
            this._extension = _extension;
            this._logger = _logger;
            this._inLoggingOnlyMode = _inLoggingOnlyMode;
            this._commonProperties = _commonProperties;
            this._onDidChangeEnableStates = new event_1.Emitter();
            this.ignoreUnhandledExtHostErrors = options?.ignoreUnhandledErrors ?? false;
            this._ignoreBuiltinCommonProperties = options?.ignoreBuiltInCommonProperties ?? false;
            this._additionalCommonProperties = options?.additionalCommonProperties;
            this._sender = sender;
            this._telemetryEnablements = { isUsageEnabled: telemetryEnablements.isUsageEnabled, isErrorsEnabled: telemetryEnablements.isErrorsEnabled };
        }
        updateTelemetryEnablements(isUsageEnabled, isErrorsEnabled) {
            if (this._apiObject) {
                this._telemetryEnablements = { isUsageEnabled, isErrorsEnabled };
                this._onDidChangeEnableStates.fire(this._apiObject);
            }
        }
        mixInCommonPropsAndCleanData(data) {
            // Some telemetry modules prefer to break properties and measurmements up
            // We mix common properties into the properties tab.
            let updatedData = 'properties' in data ? (data.properties ?? {}) : data;
            // We don't clean measurements since they are just numbers
            updatedData = (0, telemetryUtils_1.cleanData)(updatedData, []);
            if (this._additionalCommonProperties) {
                updatedData = (0, objects_1.mixin)(updatedData, this._additionalCommonProperties);
            }
            if (!this._ignoreBuiltinCommonProperties) {
                updatedData = (0, objects_1.mixin)(updatedData, this._commonProperties);
            }
            if ('properties' in data) {
                data.properties = updatedData;
            }
            else {
                data = updatedData;
            }
            return data;
        }
        logEvent(eventName, data) {
            // No sender means likely disposed of, we should no-op
            if (!this._sender) {
                return;
            }
            // If it's a built-in extension (vscode publisher) we don't prefix the publisher and only the ext name
            if (this._extension.publisher === 'vscode') {
                eventName = this._extension.name + '/' + eventName;
            }
            else {
                eventName = this._extension.identifier.value + '/' + eventName;
            }
            data = this.mixInCommonPropsAndCleanData(data || {});
            if (!this._inLoggingOnlyMode) {
                this._sender?.sendEventData(eventName, data);
            }
            this._logger.trace(eventName, data);
        }
        logUsage(eventName, data) {
            if (!this._telemetryEnablements.isUsageEnabled) {
                return;
            }
            this.logEvent(eventName, data);
        }
        logError(eventNameOrException, data) {
            if (!this._telemetryEnablements.isErrorsEnabled || !this._sender) {
                return;
            }
            if (typeof eventNameOrException === 'string') {
                this.logEvent(eventNameOrException, data);
            }
            else {
                const errorData = {
                    name: eventNameOrException.name,
                    message: eventNameOrException.message,
                    stack: eventNameOrException.stack,
                    cause: eventNameOrException.cause
                };
                const cleanedErrorData = (0, telemetryUtils_1.cleanData)(errorData, []);
                // Reconstruct the error object with the cleaned data
                const cleanedError = new Error(cleanedErrorData.message, {
                    cause: cleanedErrorData.cause
                });
                cleanedError.stack = cleanedErrorData.stack;
                cleanedError.name = cleanedErrorData.name;
                data = this.mixInCommonPropsAndCleanData(data || {});
                if (!this._inLoggingOnlyMode) {
                    this._sender.sendErrorData(cleanedError, data);
                }
                this._logger.trace('exception', data);
            }
        }
        get apiTelemetryLogger() {
            if (!this._apiObject) {
                const that = this;
                const obj = {
                    logUsage: that.logUsage.bind(that),
                    get isUsageEnabled() {
                        return that._telemetryEnablements.isUsageEnabled;
                    },
                    get isErrorsEnabled() {
                        return that._telemetryEnablements.isErrorsEnabled;
                    },
                    logError: that.logError.bind(that),
                    dispose: that.dispose.bind(that),
                    onDidChangeEnableStates: that._onDidChangeEnableStates.event.bind(that)
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        get isDisposed() {
            return !this._sender;
        }
        dispose() {
            if (this._sender?.flush) {
                let tempSender = this._sender;
                this._sender = undefined;
                Promise.resolve(tempSender.flush()).then(tempSender = undefined);
                this._apiObject = undefined;
            }
            else {
                this._sender = undefined;
            }
        }
    }
    exports.ExtHostTelemetryLogger = ExtHostTelemetryLogger;
    function isNewAppInstall(firstSessionDate) {
        const installAge = Date.now() - new Date(firstSessionDate).getTime();
        return isNaN(installAge) ? false : installAge < 1000 * 60 * 60 * 24; // install age is less than a day
    }
    exports.IExtHostTelemetry = (0, instantiation_1.createDecorator)('IExtHostTelemetry');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlbGVtZXRyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUZWxlbWV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNlVoRywwQ0FHQztJQTlUTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBb0IvQyxZQUMwQixRQUFrRCxFQUMzRCxhQUE4QztZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQUhrQyxhQUFRLEdBQVIsUUFBUSxDQUF5QjtZQUMxQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFsQjlDLGlDQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBQzlFLGdDQUEyQixHQUFtQixJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDO1lBRTlFLHVDQUFrQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWlDLENBQUMsQ0FBQztZQUMxRyxzQ0FBaUMsR0FBeUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEtBQUssQ0FBQztZQUV6SCxtQkFBYyxHQUF1QyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ2xGLFdBQU0sK0JBQXVDO1lBQ3JELHdIQUF3SDtZQUNoSCwwQkFBcUIsR0FBWSxLQUFLLENBQUM7WUFFOUIsdUJBQWtCLEdBQVksS0FBSyxDQUFDO1lBR3BDLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUFvQyxDQUFDO1lBT2hGLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLDZCQUE2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