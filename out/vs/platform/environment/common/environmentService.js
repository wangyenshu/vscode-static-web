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
define(["require", "exports", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/path", "vs/base/common/process", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, date_1, decorators_1, network_1, path_1, process_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractNativeEnvironmentService = exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX = void 0;
    exports.parseExtensionHostDebugPort = parseExtensionHostDebugPort;
    exports.parseDebugParams = parseDebugParams;
    exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX = /^([^.]+\..+)[:=](.+)$/;
    class AbstractNativeEnvironmentService {
        get appRoot() { return (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath); }
        get userHome() { return uri_1.URI.file(this.paths.homeDir); }
        get userDataPath() { return this.paths.userDataDir; }
        get appSettingsHome() { return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'User')); }
        get tmpDir() { return uri_1.URI.file(this.paths.tmpDir); }
        get cacheHome() { return uri_1.URI.file(this.userDataPath); }
        get stateResource() { return (0, resources_1.joinPath)(this.appSettingsHome, 'globalStorage', 'storage.json'); }
        get userRoamingDataHome() { return this.appSettingsHome.with({ scheme: network_1.Schemas.vscodeUserData }); }
        get userDataSyncHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'sync'); }
        get logsHome() {
            if (!this.args.logsPath) {
                const key = (0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '');
                this.args.logsPath = (0, path_1.join)(this.userDataPath, 'logs', key);
            }
            return uri_1.URI.file(this.args.logsPath);
        }
        get sync() { return this.args.sync; }
        get machineSettingsResource() { return (0, resources_1.joinPath)(uri_1.URI.file((0, path_1.join)(this.userDataPath, 'Machine')), 'settings.json'); }
        get workspaceStorageHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'workspaceStorage'); }
        get localHistoryHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'History'); }
        get keyboardLayoutResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get argvResource() {
            const vscodePortable = process_1.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return uri_1.URI.file((0, path_1.join)(vscodePortable, 'argv.json'));
            }
            return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'argv.json');
        }
        get isExtensionDevelopment() { return !!this.args.extensionDevelopmentPath; }
        get untitledWorkspacesHome() { return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'Workspaces')); }
        get builtinExtensionsPath() {
            const cliBuiltinExtensionsDir = this.args['builtin-extensions-dir'];
            if (cliBuiltinExtensionsDir) {
                return (0, path_1.resolve)(cliBuiltinExtensionsDir);
            }
            return (0, path_1.normalize)((0, path_1.join)(network_1.FileAccess.asFileUri('').fsPath, '..', 'extensions'));
        }
        get extensionsDownloadLocation() {
            const cliExtensionsDownloadDir = this.args['extensions-download-dir'];
            if (cliExtensionsDownloadDir) {
                return uri_1.URI.file((0, path_1.resolve)(cliExtensionsDownloadDir));
            }
            return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'CachedExtensionVSIXs'));
        }
        get extensionsPath() {
            const cliExtensionsDir = this.args['extensions-dir'];
            if (cliExtensionsDir) {
                return (0, path_1.resolve)(cliExtensionsDir);
            }
            const vscodeExtensions = process_1.env['VSCODE_EXTENSIONS'];
            if (vscodeExtensions) {
                return vscodeExtensions;
            }
            const vscodePortable = process_1.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return (0, path_1.join)(vscodePortable, 'extensions');
            }
            return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'extensions').fsPath;
        }
        get extensionDevelopmentLocationURI() {
            const extensionDevelopmentPaths = this.args.extensionDevelopmentPath;
            if (Array.isArray(extensionDevelopmentPaths)) {
                return extensionDevelopmentPaths.map(extensionDevelopmentPath => {
                    if (/^[^:/?#]+?:\/\//.test(extensionDevelopmentPath)) {
                        return uri_1.URI.parse(extensionDevelopmentPath);
                    }
                    return uri_1.URI.file((0, path_1.normalize)(extensionDevelopmentPath));
                });
            }
            return undefined;
        }
        get extensionDevelopmentKind() {
            return this.args.extensionDevelopmentKind?.map(kind => kind === 'ui' || kind === 'workspace' || kind === 'web' ? kind : 'workspace');
        }
        get extensionTestsLocationURI() {
            const extensionTestsPath = this.args.extensionTestsPath;
            if (extensionTestsPath) {
                if (/^[^:/?#]+?:\/\//.test(extensionTestsPath)) {
                    return uri_1.URI.parse(extensionTestsPath);
                }
                return uri_1.URI.file((0, path_1.normalize)(extensionTestsPath));
            }
            return undefined;
        }
        get disableExtensions() {
            if (this.args['disable-extensions']) {
                return true;
            }
            const disableExtensions = this.args['disable-extension'];
            if (disableExtensions) {
                if (typeof disableExtensions === 'string') {
                    return [disableExtensions];
                }
                if (Array.isArray(disableExtensions) && disableExtensions.length > 0) {
                    return disableExtensions;
                }
            }
            return false;
        }
        get debugExtensionHost() { return parseExtensionHostDebugPort(this.args, this.isBuilt); }
        get debugRenderer() { return !!this.args.debugRenderer; }
        get isBuilt() { return !process_1.env['VSCODE_DEV']; }
        get verbose() { return !!this.args.verbose; }
        get logLevel() { return this.args.log?.find(entry => !exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.test(entry)); }
        get extensionLogLevel() {
            const result = [];
            for (const entry of this.args.log || []) {
                const matches = exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.exec(entry);
                if (matches && matches[1] && matches[2]) {
                    result.push([matches[1], matches[2]]);
                }
            }
            return result.length ? result : undefined;
        }
        get serviceMachineIdResource() { return (0, resources_1.joinPath)(uri_1.URI.file(this.userDataPath), 'machineid'); }
        get crashReporterId() { return this.args['crash-reporter-id']; }
        get crashReporterDirectory() { return this.args['crash-reporter-directory']; }
        get disableTelemetry() { return !!this.args['disable-telemetry']; }
        get disableWorkspaceTrust() { return !!this.args['disable-workspace-trust']; }
        get useInMemorySecretStorage() { return !!this.args['use-inmemory-secretstorage']; }
        get policyFile() {
            if (this.args['__enable-file-policy']) {
                const vscodePortable = process_1.env['VSCODE_PORTABLE'];
                if (vscodePortable) {
                    return uri_1.URI.file((0, path_1.join)(vscodePortable, 'policy.json'));
                }
                return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'policy.json');
            }
            return undefined;
        }
        get continueOn() {
            return this.args['continueOn'];
        }
        set continueOn(value) {
            this.args['continueOn'] = value;
        }
        get args() { return this._args; }
        constructor(_args, paths, productService) {
            this._args = _args;
            this.paths = paths;
            this.productService = productService;
            this.editSessionId = this.args['editSessionId'];
        }
    }
    exports.AbstractNativeEnvironmentService = AbstractNativeEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "appRoot", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "appSettingsHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "tmpDir", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "cacheHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "stateResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "machineSettingsResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "localHistoryHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "builtinExtensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionDevelopmentKind", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "logLevel", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionLogLevel", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "disableTelemetry", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "disableWorkspaceTrust", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "useInMemorySecretStorage", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "policyFile", null);
    function parseExtensionHostDebugPort(args, isBuilt) {
        return parseDebugParams(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuilt, args.debugId, args.extensionEnvironment);
    }
    function parseDebugParams(debugArg, debugBrkArg, defaultBuildPort, isBuilt, debugId, environmentString) {
        const portStr = debugBrkArg || debugArg;
        const port = Number(portStr) || (!isBuilt ? defaultBuildPort : null);
        const brk = port ? Boolean(!!debugBrkArg) : false;
        let env;
        if (environmentString) {
            try {
                env = JSON.parse(environmentString);
            }
            catch {
                // ignore
            }
        }
        return { port, break: brk, debugId, env };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW52aXJvbm1lbnQvY29tbW9uL2Vudmlyb25tZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUE4UWhHLGtFQUVDO0lBRUQsNENBY0M7SUFuUlksUUFBQSxtQ0FBbUMsR0FBRyx1QkFBdUIsQ0FBQztJQXlCM0UsTUFBc0IsZ0NBQWdDO1FBS3JELElBQUksT0FBTyxLQUFhLE9BQU8sSUFBQSxjQUFPLEVBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzFFLElBQUksUUFBUSxLQUFVLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUc1RCxJQUFJLFlBQVksS0FBYSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUc3RCxJQUFJLGVBQWUsS0FBVSxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUdoRixJQUFJLE1BQU0sS0FBVSxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHekQsSUFBSSxTQUFTLEtBQVUsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHNUQsSUFBSSxhQUFhLEtBQVUsT0FBTyxJQUFBLG9CQUFRLEVBQUMsSUFB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