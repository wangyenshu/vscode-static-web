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
define(["require", "exports", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/instantiation", "vs/platform/environment/common/environmentService", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/resources"], function (require, exports, environment_1, instantiation_1, environmentService_1, decorators_1, network_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkbenchEnvironmentService = exports.INativeWorkbenchEnvironmentService = void 0;
    exports.INativeWorkbenchEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class NativeWorkbenchEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        get mainPid() { return this.configuration.mainPid; }
        get machineId() { return this.configuration.machineId; }
        get sqmId() { return this.configuration.sqmId; }
        get remoteAuthority() { return this.configuration.remoteAuthority; }
        get expectsResolverExtension() { return !!this.configuration.remoteAuthority?.includes('+'); }
        get execPath() { return this.configuration.execPath; }
        get backupPath() { return this.configuration.backupPath; }
        get window() {
            return {
                id: this.configuration.windowId,
                colorScheme: this.configuration.colorScheme,
                maximized: this.configuration.maximized,
                accessibilitySupport: this.configuration.accessibilitySupport,
                perfMarks: this.configuration.perfMarks,
                isInitialStartup: this.configuration.isInitialStartup,
                isCodeCaching: typeof this.configuration.codeCachePath === 'string'
            };
        }
        get windowLogsPath() { return (0, resources_1.joinPath)(this.logsHome, `window${this.configuration.windowId}`); }
        get logFile() { return (0, resources_1.joinPath)(this.windowLogsPath, `renderer.log`); }
        get extHostLogsPath() { return (0, resources_1.joinPath)(this.windowLogsPath, 'exthost'); }
        get extHostTelemetryLogFile() {
            return (0, resources_1.joinPath)(this.extHostLogsPath, 'extensionTelemetry.log');
        }
        get webviewExternalEndpoint() { return `${network_1.Schemas.vscodeWebview}://{{uuid}}`; }
        get skipReleaseNotes() { return !!this.args['skip-release-notes']; }
        get skipWelcome() { return !!this.args['skip-welcome']; }
        get logExtensionHostCommunication() { return !!this.args.logExtensionHostCommunication; }
        get enableSmokeTestDriver() { return !!this.args['enable-smoke-test-driver']; }
        get extensionEnabledProposedApi() {
            if (Array.isArray(this.args['enable-proposed-api'])) {
                return this.args['enable-proposed-api'];
            }
            if ('enable-proposed-api' in this.args) {
                return [];
            }
            return undefined;
        }
        get os() { return this.configuration.os; }
        get filesToOpenOrCreate() { return this.configuration.filesToOpenOrCreate; }
        get filesToDiff() { return this.configuration.filesToDiff; }
        get filesToMerge() { return this.configuration.filesToMerge; }
        get filesToWait() { return this.configuration.filesToWait; }
        constructor(configuration, productService) {
            super(configuration, { homeDir: configuration.homeDir, tmpDir: configuration.tmpDir, userDataDir: configuration.userDataDir }, productService);
            this.configuration = configuration;
        }
    }
    exports.NativeWorkbenchEnvironmentService = NativeWorkbenchEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "mainPid", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "machineId", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "sqmId", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "expectsResolverExtension", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "execPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "backupPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "window", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "windowLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extHostTelemetryLogFile", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "skipWelcome", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "logExtensionHostCommunication", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "enableSmokeTestDriver", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extensionEnabledProposedApi", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "os", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToDiff", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToMerge", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToWait", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2Vudmlyb25tZW50L2VsZWN0cm9uLXNhbmRib3gvZW52aXJvbm1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQWNuRixRQUFBLGtDQUFrQyxHQUFHLElBQUEsc0NBQXNCLEVBQTBELGlDQUFtQixDQUFDLENBQUM7SUFxQ3ZKLE1BQWEsaUNBQWtDLFNBQVEscURBQWdDO1FBR3RGLElBQUksT0FBTyxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBR3BELElBQUksU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBR3hELElBQUksS0FBSyxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBR2hELElBQUksZUFBZSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBR3BFLElBQUksd0JBQXdCLEtBQUssT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUc5RixJQUFJLFFBQVEsS0FBSyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUd0RCxJQUFJLFVBQVUsS0FBSyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUcxRCxJQUFJLE1BQU07WUFDVCxPQUFPO2dCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxD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