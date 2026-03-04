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
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/extpath", "vs/platform/log/common/log", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/platform/environment/common/environmentService"], function (require, exports, network_1, resources_1, uri_1, environment_1, decorators_1, errors_1, extpath_1, log_1, types_1, instantiation_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkbenchEnvironmentService = exports.IBrowserWorkbenchEnvironmentService = void 0;
    exports.IBrowserWorkbenchEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class BrowserWorkbenchEnvironmentService {
        get remoteAuthority() { return this.options.remoteAuthority; }
        get expectsResolverExtension() {
            return !!this.options.remoteAuthority?.includes('+') && !this.options.webSocketFactory;
        }
        get isBuilt() { return !!this.productService.commit; }
        get logLevel() {
            const logLevelFromPayload = this.payload?.get('logLevel');
            if (logLevelFromPayload) {
                return logLevelFromPayload.split(',').find(entry => !environmentService_1.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.test(entry));
            }
            return this.options.developmentOptions?.logLevel !== undefined ? (0, log_1.LogLevelToString)(this.options.developmentOptions?.logLevel) : undefined;
        }
        get extensionLogLevel() {
            const logLevelFromPayload = this.payload?.get('logLevel');
            if (logLevelFromPayload) {
                const result = [];
                for (const entry of logLevelFromPayload.split(',')) {
                    const matches = environmentService_1.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.exec(entry);
                    if (matches && matches[1] && matches[2]) {
                        result.push([matches[1], matches[2]]);
                    }
                }
                return result.length ? result : undefined;
            }
            return this.options.developmentOptions?.extensionLogLevel !== undefined ? this.options.developmentOptions?.extensionLogLevel.map(([extension, logLevel]) => ([extension, (0, log_1.LogLevelToString)(logLevel)])) : undefined;
        }
        get profDurationMarkers() {
            const profDurationMarkersFromPayload = this.payload?.get('profDurationMarkers');
            if (profDurationMarkersFromPayload) {
                const result = [];
                for (const entry of profDurationMarkersFromPayload.split(',')) {
                    result.push(entry);
                }
                return result.length === 2 ? result : undefined;
            }
            return undefined;
        }
        get windowLogsPath() { return this.logsHome; }
        get logFile() { return (0, resources_1.joinPath)(this.windowLogsPath, 'window.log'); }
        get userRoamingDataHome() { return uri_1.URI.file('/User').with({ scheme: network_1.Schemas.vscodeUserData }); }
        get argvResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'argv.json'); }
        get cacheHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'caches'); }
        get workspaceStorageHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'workspaceStorage'); }
        get localHistoryHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'History'); }
        get stateResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'State', 'storage.json'); }
        /**
         * In Web every workspace can potentially have scoped user-data
         * and/or extensions and if Sync state is shared then it can make
         * Sync error prone - say removing extensions from another workspace.
         * Hence scope Sync state per workspace. Sync scoped to a workspace
         * is capable of handling opening same workspace in multiple windows.
         */
        get userDataSyncHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'sync', this.workspaceId); }
        get sync() { return undefined; }
        get keyboardLayoutResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get untitledWorkspacesHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'Workspaces'); }
        get serviceMachineIdResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'machineid'); }
        get extHostLogsPath() { return (0, resources_1.joinPath)(this.logsHome, 'exthost'); }
        get extHostTelemetryLogFile() {
            return (0, resources_1.joinPath)(this.extHostLogsPath, 'extensionTelemetry.log');
        }
        get debugExtensionHost() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.params;
        }
        get isExtensionDevelopment() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.isExtensionDevelopment;
        }
        get extensionDevelopmentLocationURI() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionDevelopmentLocationURI;
        }
        get extensionDevelopmentLocationKind() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionDevelopmentKind;
        }
        get extensionTestsLocationURI() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionTestsLocationURI;
        }
        get extensionEnabledProposedApi() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionEnabledProposedApi;
        }
        get debugRenderer() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.debugRenderer;
        }
        get enableSmokeTestDriver() { return this.options.developmentOptions?.enableSmokeTestDriver; }
        get disableExtensions() { return this.payload?.get('disableExtensions') === 'true'; }
        get enableExtensions() { return this.options.enabledExtensions; }
        get webviewExternalEndpoint() {
            const endpoint = this.options.webviewEndpoint
                || this.productService.webviewContentExternalBaseUrlTemplate
                || 'https://{{uuid}}.vscode-cdn.net/{{quality}}/{{commit}}/out/vs/workbench/contrib/webview/browser/pre/';
            const webviewExternalEndpointCommit = this.payload?.get('webviewExternalEndpointCommit');
            return endpoint
                .replace('{{commit}}', webviewExternalEndpointCommit ?? this.productService.commit ?? 'ef65ac1ba57f57f2a3961bfe94aa20481caca4c6')
                .replace('{{quality}}', (webviewExternalEndpointCommit ? 'insider' : this.productService.quality) ?? 'insider');
        }
        get extensionTelemetryLogResource() { return (0, resources_1.joinPath)(this.logsHome, 'extensionTelemetry.log'); }
        get disableTelemetry() { return false; }
        get verbose() { return this.payload?.get('verbose') === 'true'; }
        get logExtensionHostCommunication() { return this.payload?.get('logExtensionHostCommunication') === 'true'; }
        get skipReleaseNotes() { return this.payload?.get('skipReleaseNotes') === 'true'; }
        get skipWelcome() { return this.payload?.get('skipWelcome') === 'true'; }
        get disableWorkspaceTrust() { return !this.options.enableWorkspaceTrust; }
        get lastActiveProfile() { return this.payload?.get('lastActiveProfile'); }
        constructor(workspaceId, logsHome, options, productService) {
            this.workspaceId = workspaceId;
            this.logsHome = logsHome;
            this.options = options;
            this.productService = productService;
            this.extensionHostDebugEnvironment = undefined;
            this.editSessionId = this.options.editSessionId;
            if (options.workspaceProvider && Array.isArray(options.workspaceProvider.payload)) {
                try {
                    this.payload = new Map(options.workspaceProvider.payload);
                }
                catch (error) {
                    (0, errors_1.onUnexpectedError)(error); // possible invalid payload for map
                }
            }
        }
        resolveExtensionHostDebugEnvironment() {
            const extensionHostDebugEnvironment = {
                params: {
                    port: null,
                    break: false
                },
                debugRenderer: false,
                isExtensionDevelopment: false,
                extensionDevelopmentLocationURI: undefined,
                extensionDevelopmentKind: undefined
            };
            // Fill in selected extra environmental properties
            if (this.payload) {
                for (const [key, value] of this.payload) {
                    switch (key) {
                        case 'extensionDevelopmentPath':
                            if (!extensionHostDebugEnvironment.extensionDevelopmentLocationURI) {
                                extensionHostDebugEnvironment.extensionDevelopmentLocationURI = [];
                            }
                            extensionHostDebugEnvironment.extensionDevelopmentLocationURI.push(uri_1.URI.parse(value));
                            extensionHostDebugEnvironment.isExtensionDevelopment = true;
                            break;
                        case 'extensionDevelopmentKind':
                            extensionHostDebugEnvironment.extensionDevelopmentKind = [value];
                            break;
                        case 'extensionTestsPath':
                            extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.parse(value);
                            break;
                        case 'debugRenderer':
                            extensionHostDebugEnvironment.debugRenderer = value === 'true';
                            break;
                        case 'debugId':
                            extensionHostDebugEnvironment.params.debugId = value;
                            break;
                        case 'inspect-brk-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            extensionHostDebugEnvironment.params.break = true;
                            break;
                        case 'inspect-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            break;
                        case 'enableProposedApi':
                            extensionHostDebugEnvironment.extensionEnabledProposedApi = [];
                            break;
                    }
                }
            }
            const developmentOptions = this.options.developmentOptions;
            if (developmentOptions && !extensionHostDebugEnvironment.isExtensionDevelopment) {
                if (developmentOptions.extensions?.length) {
                    extensionHostDebugEnvironment.extensionDevelopmentLocationURI = developmentOptions.extensions.map(e => uri_1.URI.revive(e));
                    extensionHostDebugEnvironment.isExtensionDevelopment = true;
                }
                if (developmentOptions.extensionTestsPath) {
                    extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.revive(developmentOptions.extensionTestsPath);
                }
            }
            return extensionHostDebugEnvironment;
        }
        get filesToOpenOrCreate() {
            if (this.payload) {
                const fileToOpen = this.payload.get('openFile');
                if (fileToOpen) {
                    const fileUri = uri_1.URI.parse(fileToOpen);
                    // Support: --goto parameter to open on line/col
                    if (this.payload.has('gotoLineMode')) {
                        const pathColumnAware = (0, extpath_1.parseLineAndColumnAware)(fileUri.path);
                        return [{
                                fileUri: fileUri.with({ path: pathColumnAware.path }),
                                options: {
                                    selection: !(0, types_1.isUndefined)(pathColumnAware.line) ? { startLineNumber: pathColumnAware.line, startColumn: pathColumnAware.column || 1 } : undefined
                                }
                            }];
                    }
                    return [{ fileUri }];
                }
            }
            return undefined;
        }
        get filesToDiff() {
            if (this.payload) {
                const fileToDiffPrimary = this.payload.get('diffFilePrimary');
                const fileToDiffSecondary = this.payload.get('diffFileSecondary');
                if (fileToDiffPrimary && fileToDiffSecondary) {
                    return [
                        { fileUri: uri_1.URI.parse(fileToDiffSecondary) },
                        { fileUri: uri_1.URI.parse(fileToDiffPrimary) }
                    ];
                }
            }
            return undefined;
        }
        get filesToMerge() {
            if (this.payload) {
                const fileToMerge1 = this.payload.get('mergeFile1');
                const fileToMerge2 = this.payload.get('mergeFile2');
                const fileToMergeBase = this.payload.get('mergeFileBase');
                const fileToMergeResult = this.payload.get('mergeFileResult');
                if (fileToMerge1 && fileToMerge2 && fileToMergeBase && fileToMergeResult) {
                    return [
                        { fileUri: uri_1.URI.parse(fileToMerge1) },
                        { fileUri: uri_1.URI.parse(fileToMerge2) },
                        { fileUri: uri_1.URI.parse(fileToMergeBase) },
                        { fileUri: uri_1.URI.parse(fileToMergeResult) }
                    ];
                }
            }
            return undefined;
        }
    }
    exports.BrowserWorkbenchEnvironmentService = BrowserWorkbenchEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "expectsResolverExtension", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isBuilt", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logLevel", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "windowLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "cacheHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "localHistoryHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "stateResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extHostTelemetryLogFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionDevelopmentLocationKind", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionEnabledProposedApi", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "debugRenderer", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableSmokeTestDriver", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableExtensions", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableExtensions", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionTelemetryLogResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableTelemetry", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "verbose", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logExtensionHostCommunication", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "skipWelcome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableWorkspaceTrust", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "lastActiveProfile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToDiff", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToMerge", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2Vudmlyb25tZW50L2Jyb3dzZXIvZW52aXJvbm1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQW1CbkYsUUFBQSxtQ0FBbUMsR0FBRyxJQUFBLHNDQUFzQixFQUEyRCxpQ0FBbUIsQ0FBQyxDQUFDO0lBbUJ6SixNQUFhLGtDQUFrQztRQUs5QyxJQUFJLGVBQWUsS0FBeUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFHbEYsSUFBSSx3QkFBd0I7WUFDM0IsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztRQUN4RixDQUFDO1FBR0QsSUFBSSxPQUFPLEtBQWMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRy9ELElBQUksUUFBUTtZQUNYLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUQsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO2dCQUN6QixPQUFPLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLHdEQUFtQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsUUFB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