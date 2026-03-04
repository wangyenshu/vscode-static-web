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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/workbench/services/configuration/common/jsonEditing", "vs/base/common/types", "vs/platform/environment/common/environmentService", "vs/platform/instantiation/common/extensions", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, log_1, instantiation_1, environmentService_1, files_1, jsonEditing_1, types_1, environmentService_2, extensions_1, json_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IDefaultLogLevelsService = void 0;
    exports.IDefaultLogLevelsService = (0, instantiation_1.createDecorator)('IDefaultLogLevelsService');
    let DefaultLogLevelsService = class DefaultLogLevelsService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, jsonEditingService, logService, loggerService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.jsonEditingService = jsonEditingService;
            this.logService = logService;
            this.loggerService = loggerService;
            this._onDidChangeDefaultLogLevels = this._register(new event_1.Emitter);
            this.onDidChangeDefaultLogLevels = this._onDidChangeDefaultLogLevels.event;
        }
        async getDefaultLogLevels() {
            const argvLogLevel = await this._parseLogLevelsFromArgv();
            return {
                default: argvLogLevel?.default ?? this._getDefaultLogLevelFromEnv(),
                extensions: argvLogLevel?.extensions ?? this._getExtensionsDefaultLogLevelsFromEnv()
            };
        }
        async getDefaultLogLevel(extensionId) {
            const argvLogLevel = await this._parseLogLevelsFromArgv() ?? {};
            if (extensionId) {
                extensionId = extensionId.toLowerCase();
                return this._getDefaultLogLevel(argvLogLevel, extensionId);
            }
            else {
                return this._getDefaultLogLevel(argvLogLevel);
            }
        }
        async setDefaultLogLevel(defaultLogLevel, extensionId) {
            const argvLogLevel = await this._parseLogLevelsFromArgv() ?? {};
            if (extensionId) {
                extensionId = extensionId.toLowerCase();
                const currentDefaultLogLevel = this._getDefaultLogLevel(argvLogLevel, extensionId);
                argvLogLevel.extensions = argvLogLevel.extensions ?? [];
                const extension = argvLogLevel.extensions.find(([extension]) => extension === extensionId);
                if (extension) {
                    extension[1] = defaultLogLevel;
                }
                else {
                    argvLogLevel.extensions.push([extensionId, defaultLogLevel]);
                }
                await this._writeLogLevelsToArgv(argvLogLevel);
                const extensionLoggers = [...this.loggerService.getRegisteredLoggers()].filter(logger => logger.extensionId && logger.extensionId.toLowerCase() === extensionId);
                for (const { resource } of extensionLoggers) {
                    if (this.loggerService.getLogLevel(resource) === currentDefaultLogLevel) {
                        this.loggerService.setLogLevel(resource, defaultLogLevel);
                    }
                }
            }
            else {
                const currentLogLevel = this._getDefaultLogLevel(argvLogLevel);
                argvLogLevel.default = defaultLogLevel;
                await this._writeLogLevelsToArgv(argvLogLevel);
                if (this.loggerService.getLogLevel() === currentLogLevel) {
                    this.loggerService.setLogLevel(defaultLogLevel);
                }
            }
            this._onDidChangeDefaultLogLevels.fire();
        }
        _getDefaultLogLevel(argvLogLevels, extension) {
            if (extension) {
                const extensionLogLevel = argvLogLevels.extensions?.find(([extensionId]) => extensionId === extension);
                if (extensionLogLevel) {
                    return extensionLogLevel[1];
                }
            }
            return argvLogLevels.default ?? (0, log_1.getLogLevel)(this.environmentService);
        }
        async _writeLogLevelsToArgv(logLevels) {
            const logLevelsValue = [];
            if (!(0, types_1.isUndefined)(logLevels.default)) {
                logLevelsValue.push((0, log_1.LogLevelToString)(logLevels.default));
            }
            for (const [extension, logLevel] of logLevels.extensions ?? []) {
                logLevelsValue.push(`${extension}=${(0, log_1.LogLevelToString)(logLevel)}`);
            }
            await this.jsonEditingService.write(this.environmentService.argvResource, [{ path: ['log-level'], value: logLevelsValue.length ? logLevelsValue : undefined }], true);
        }
        async _parseLogLevelsFromArgv() {
            const result = { extensions: [] };
            const logLevels = await this._readLogLevelsFromArgv();
            for (const extensionLogLevel of logLevels) {
                const matches = environmentService_2.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.exec(extensionLogLevel);
                if (matches && matches[1] && matches[2]) {
                    const logLevel = (0, log_1.parseLogLevel)(matches[2]);
                    if (!(0, types_1.isUndefined)(logLevel)) {
                        result.extensions?.push([matches[1].toLowerCase(), logLevel]);
                    }
                }
                else {
                    const logLevel = (0, log_1.parseLogLevel)(extensionLogLevel);
                    if (!(0, types_1.isUndefined)(logLevel)) {
                        result.default = logLevel;
                    }
                }
            }
            return !(0, types_1.isUndefined)(result.default) || result.extensions?.length ? result : undefined;
        }
        async migrateLogLevels() {
            const logLevels = await this._readLogLevelsFromArgv();
            const regex = /^([^.]+\..+):(.+)$/;
            if (logLevels.some(extensionLogLevel => regex.test(extensionLogLevel))) {
                const argvLogLevel = await this._parseLogLevelsFromArgv();
                if (argvLogLevel) {
                    await this._writeLogLevelsToArgv(argvLogLevel);
                }
            }
        }
        async _readLogLevelsFromArgv() {
            try {
                const content = await this.fileService.readFile(this.environmentService.argvResource);
                const argv = (0, json_1.parse)(content.value.toString());
                return (0, types_1.isString)(argv['log-level']) ? [argv['log-level']] : Array.isArray(argv['log-level']) ? argv['log-level'] : [];
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
            return [];
        }
        _getDefaultLogLevelFromEnv() {
            return (0, log_1.getLogLevel)(this.environmentService);
        }
        _getExtensionsDefaultLogLevelsFromEnv() {
            const result = [];
            for (const [extension, logLevelValue] of this.environmentService.extensionLogLevel ?? []) {
                const logLevel = (0, log_1.parseLogLevel)(logLevelValue);
                if (!(0, types_1.isUndefined)(logLevel)) {
                    result.push([extension, logLevel]);
                }
            }
            return result;
        }
    };
    DefaultLogLevelsService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, jsonEditing_1.IJSONEditingService),
        __param(3, log_1.ILogService),
        __param(4, log_1.ILoggerService)
    ], DefaultLogLevelsService);
    (0, extensions_1.registerSingleton)(exports.IDefaultLogLevelsService, DefaultLogLevelsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdExvZ0xldmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvZ3MvY29tbW9uL2RlZmF1bHRMb2dMZXZlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJuRixRQUFBLHdCQUF3QixHQUFHLElBQUEsK0JBQWUsRUFBMkIsMEJBQTBCLENBQUMsQ0FBQztJQW9COUcsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQU8vQyxZQUMrQixrQkFBaUUsRUFDakYsV0FBMEMsRUFDbkMsa0JBQXdELEVBQ2hFLFVBQXdDLEVBQ3JDLGFBQThDO1lBRTlELEtBQUssRUFBRSxDQUFDO1lBTnVDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDaEUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQVJ2RCxpQ0FBNEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBYSxDQUFDLENBQUM7WUFDaEUsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQztRQVUvRSxDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQjtZQUN4QixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzFELE9BQU87Z0JBQ04sT0FBTyxFQUFFLFlBQVksRUFBRSxPQUFPLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFO2dCQUNuRSxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsSUFBSSxJQUFJLENBQUMscUNBQXFDLEVBQUU7YUFD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