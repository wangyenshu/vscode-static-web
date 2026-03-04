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
define(["require", "exports", "vs/nls", "vs/platform/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/platform/instantiation/common/instantiation", "vs/platform/environment/common/environment", "vs/base/common/decorators"], function (require, exports, nls, environmentService_1, argv_1, instantiation_1, environment_1, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServerEnvironmentService = exports.IServerEnvironmentService = exports.serverOptions = void 0;
    exports.serverOptions = {
        /* ----- server setup ----- */
        'host': { type: 'string', cat: 'o', args: 'ip-address', description: nls.localize('host', "The host name or IP address the server should listen to. If not set, defaults to 'localhost'.") },
        'port': { type: 'string', cat: 'o', args: 'port | port range', description: nls.localize('port', "The port the server should listen to. If 0 is passed a random free port is picked. If a range in the format num-num is passed, a free port from the range (end inclusive) is selected.") },
        'socket-path': { type: 'string', cat: 'o', args: 'path', description: nls.localize('socket-path', "The path to a socket file for the server to listen to.") },
        'server-base-path': { type: 'string', cat: 'o', args: 'path', description: nls.localize('server-base-path', "The path under which the web UI and the code server is provided. Defaults to '/'.`") },
        'connection-token': { type: 'string', cat: 'o', args: 'token', deprecates: ['connectionToken'], description: nls.localize('connection-token', "A secret that must be included with all requests.") },
        'connection-token-file': { type: 'string', cat: 'o', args: 'path', deprecates: ['connection-secret', 'connectionTokenFile'], description: nls.localize('connection-token-file', "Path to a file that contains the connection token.") },
        'without-connection-token': { type: 'boolean', cat: 'o', description: nls.localize('without-connection-token', "Run without a connection token. Only use this if the connection is secured by other means.") },
        'disable-websocket-compression': { type: 'boolean' },
        'print-startup-performance': { type: 'boolean' },
        'print-ip-address': { type: 'boolean' },
        'accept-server-license-terms': { type: 'boolean', cat: 'o', description: nls.localize('acceptLicenseTerms', "If set, the user accepts the server license terms and the server will be started without a user prompt.") },
        'server-data-dir': { type: 'string', cat: 'o', description: nls.localize('serverDataDir', "Specifies the directory that server data is kept in.") },
        'telemetry-level': { type: 'string', cat: 'o', args: 'level', description: nls.localize('telemetry-level', "Sets the initial telemetry level. Valid levels are: 'off', 'crash', 'error' and 'all'. If not specified, the server will send telemetry until a client connects, it will then use the clients telemetry setting. Setting this to 'off' is equivalent to --disable-telemetry") },
        /* ----- vs code options ---	-- */
        'user-data-dir': argv_1.OPTIONS['user-data-dir'],
        'enable-smoke-test-driver': argv_1.OPTIONS['enable-smoke-test-driver'],
        'disable-telemetry': argv_1.OPTIONS['disable-telemetry'],
        'disable-workspace-trust': argv_1.OPTIONS['disable-workspace-trust'],
        'file-watcher-polling': { type: 'string', deprecates: ['fileWatcherPolling'] },
        'log': argv_1.OPTIONS['log'],
        'logsPath': argv_1.OPTIONS['logsPath'],
        'force-disable-user-env': argv_1.OPTIONS['force-disable-user-env'],
        /* ----- vs code web options ----- */
        'folder': { type: 'string', deprecationMessage: 'No longer supported. Folder needs to be provided in the browser URL or with `default-folder`.' },
        'workspace': { type: 'string', deprecationMessage: 'No longer supported. Workspace needs to be provided in the browser URL or with `default-workspace`.' },
        'default-folder': { type: 'string', description: nls.localize('default-folder', 'The workspace folder to open when no input is specified in the browser URL. A relative or absolute path resolved against the current working directory.') },
        'default-workspace': { type: 'string', description: nls.localize('default-workspace', 'The workspace to open when no input is specified in the browser URL. A relative or absolute path resolved against the current working directory.') },
        'enable-sync': { type: 'boolean' },
        'github-auth': { type: 'string' },
        'use-test-resolver': { type: 'boolean' },
        /* ----- extension management ----- */
        'extensions-dir': argv_1.OPTIONS['extensions-dir'],
        'extensions-download-dir': argv_1.OPTIONS['extensions-download-dir'],
        'builtin-extensions-dir': argv_1.OPTIONS['builtin-extensions-dir'],
        'install-extension': argv_1.OPTIONS['install-extension'],
        'install-builtin-extension': argv_1.OPTIONS['install-builtin-extension'],
        'update-extensions': argv_1.OPTIONS['update-extensions'],
        'uninstall-extension': argv_1.OPTIONS['uninstall-extension'],
        'list-extensions': argv_1.OPTIONS['list-extensions'],
        'locate-extension': argv_1.OPTIONS['locate-extension'],
        'show-versions': argv_1.OPTIONS['show-versions'],
        'category': argv_1.OPTIONS['category'],
        'force': argv_1.OPTIONS['force'],
        'do-not-sync': argv_1.OPTIONS['do-not-sync'],
        'pre-release': argv_1.OPTIONS['pre-release'],
        'start-server': { type: 'boolean', cat: 'e', description: nls.localize('start-server', "Start the server when installing or uninstalling extensions. To be used in combination with 'install-extension', 'install-builtin-extension' and 'uninstall-extension'.") },
        /* ----- remote development options ----- */
        'enable-remote-auto-shutdown': { type: 'boolean' },
        'remote-auto-shutdown-without-delay': { type: 'boolean' },
        'use-host-proxy': { type: 'boolean' },
        'without-browser-env-var': { type: 'boolean' },
        /* ----- server cli ----- */
        'help': argv_1.OPTIONS['help'],
        'version': argv_1.OPTIONS['version'],
        'locate-shell-integration-path': argv_1.OPTIONS['locate-shell-integration-path'],
        'compatibility': { type: 'string' },
        _: argv_1.OPTIONS['_']
    };
    exports.IServerEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class ServerEnvironmentService extends environmentService_1.NativeEnvironmentService {
        get userRoamingDataHome() { return this.appSettingsHome; }
        get args() { return super.args; }
    }
    exports.ServerEnvironmentService = ServerEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], ServerEnvironmentService.prototype, "userRoamingDataHome", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyRW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvc2VydmVyRW52aXJvbm1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQVduRixRQUFBLGFBQWEsR0FBbUQ7UUFFNUUsOEJBQThCO1FBRTlCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSwrRkFBK0YsQ0FBQyxFQUFFO1FBQzVMLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLHdMQUF3TCxDQUFDLEVBQUU7UUFDNVIsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLHdEQUF3RCxDQUFDLEVBQUU7UUFDN0osa0JBQWtCLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxvRkFBb0YsQ0FBQyxFQUFFO1FBQ25NLGtCQUFrQixFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFP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