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
define(["require", "exports", "electron", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/configuration/common/configuration", "vs/platform/environment/node/argvHelper", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/url/common/url", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, arrays_1, platform_1, uri_1, pfs_1, configuration_1, argvHelper_1, instantiation_1, log_1, url_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LaunchMainService = exports.ILaunchMainService = exports.ID = void 0;
    exports.ID = 'launchMainService';
    exports.ILaunchMainService = (0, instantiation_1.createDecorator)(exports.ID);
    let LaunchMainService = class LaunchMainService {
        constructor(logService, windowsMainService, urlService, configurationService) {
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.urlService = urlService;
            this.configurationService = configurationService;
        }
        async start(args, userEnv) {
            this.logService.trace('Received data from other instance: ', args, userEnv);
            // macOS: Electron > 7.x changed its behaviour to not
            // bring the application to the foreground when a window
            // is focused programmatically. Only via `app.focus` and
            // the option `steal: true` can you get the previous
            // behaviour back. The only reason to use this option is
            // when a window is getting focused while the application
            // is not in the foreground and since we got instructed
            // to open a new window from another instance, we ensure
            // that the app has focus.
            if (platform_1.isMacintosh) {
                electron_1.app.focus({ steal: true });
            }
            // Check early for open-url which is handled in URL service
            const urlsToOpen = this.parseOpenUrl(args);
            if (urlsToOpen.length) {
                let whenWindowReady = Promise.resolve();
                // Create a window if there is none
                if (this.windowsMainService.getWindowCount() === 0) {
                    const window = (0, arrays_1.firstOrDefault)(await this.windowsMainService.openEmptyWindow({ context: 4 /* OpenContext.DESKTOP */ }));
                    if (window) {
                        whenWindowReady = window.ready();
                    }
                }
                // Make sure a window is open, ready to receive the url event
                whenWindowReady.then(() => {
                    for (const { uri, originalUrl } of urlsToOpen) {
                        this.urlService.open(uri, { originalUrl });
                    }
                });
            }
            // Otherwise handle in windows service
            else {
                return this.startOpenWindow(args, userEnv);
            }
        }
        parseOpenUrl(args) {
            if (args['open-url'] && args._urls && args._urls.length > 0) {
                // --open-url must contain -- followed by the url(s)
                // process.argv is used over args._ as args._ are resolved to file paths at this point
                return (0, arrays_1.coalesce)(args._urls
                    .map(url => {
                    try {
                        return { uri: uri_1.URI.parse(url), originalUrl: url };
                    }
                    catch (err) {
                        return null;
                    }
                }));
            }
            return [];
        }
        async startOpenWindow(args, userEnv) {
            const context = (0, argvHelper_1.isLaunchedFromCli)(userEnv) ? 0 /* OpenContext.CLI */ : 4 /* OpenContext.DESKTOP */;
            let usedWindows = [];
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            const remoteAuthority = args.remote || undefined;
            const baseConfig = {
                context,
                cli: args,
                /**
                 * When opening a new window from a second instance that sent args and env
                 * over to this instance, we want to preserve the environment only if that second
                 * instance was spawned from the CLI or used the `--preserve-env` flag (example:
                 * when using `open -n "VSCode.app" --args --preserve-env WORKSPACE_FOLDER`).
                 *
                 * This is done to ensure that the second window gets treated exactly the same
                 * as the first window, for example, it gets the same resolved user shell environment.
                 *
                 * https://github.com/microsoft/vscode/issues/194736
                 */
                userEnv: (args['preserve-env'] || context === 0 /* OpenContext.CLI */) ? userEnv : undefined,
                waitMarkerFileURI,
                remoteAuthority,
                forceProfile: args.profile,
                forceTempProfile: args['profile-temp']
            };
            // Special case extension development
            if (!!args.extensionDevelopmentPath) {
                await this.windowsMainService.openExtensionDevelopmentHostWindow(args.extensionDevelopmentPath, baseConfig);
            }
            // Start without file/folder arguments
            else if (!args._.length && !args['folder-uri'] && !args['file-uri']) {
                let openNewWindow = false;
                // Force new window
                if (args['new-window'] || baseConfig.forceProfile || baseConfig.forceTempProfile) {
                    openNewWindow = true;
                }
                // Force reuse window
                else if (args['reuse-window']) {
                    openNewWindow = false;
                }
                // Otherwise check for settings
                else {
                    const windowConfig = this.configurationService.getValue('window');
                    const openWithoutArgumentsInNewWindowConfig = windowConfig?.openWithoutArgumentsInNewWindow || 'default' /* default */;
                    switch (openWithoutArgumentsInNewWindowConfig) {
                        case 'on':
                            openNewWindow = true;
                            break;
                        case 'off':
                            openNewWindow = false;
                            break;
                        default:
                            openNewWindow = !platform_1.isMacintosh; // prefer to restore running instance on macOS
                    }
                }
                // Open new Window
                if (openNewWindow) {
                    usedWindows = await this.windowsMainService.open({
                        ...baseConfig,
                        forceNewWindow: true,
                        forceEmpty: true
                    });
                }
                // Focus existing window or open if none opened
                else {
                    const lastActive = this.windowsMainService.getLastActiveWindow();
                    if (lastActive) {
                        this.windowsMainService.openExistingWindow(lastActive, baseConfig);
                        usedWindows = [lastActive];
                    }
                    else {
                        usedWindows = await this.windowsMainService.open({
                            ...baseConfig,
                            forceEmpty: true
                        });
                    }
                }
            }
            // Start with file/folder arguments
            else {
                usedWindows = await this.windowsMainService.open({
                    ...baseConfig,
                    forceNewWindow: args['new-window'],
                    preferNewWindow: !args['reuse-window'] && !args.wait,
                    forceReuseWindow: args['reuse-window'],
                    diffMode: args.diff,
                    mergeMode: args.merge,
                    addMode: args.add,
                    noRecentEntry: !!args['skip-add-to-recently-opened'],
                    gotoLineMode: args.goto
                });
            }
            // If the other instance is waiting to be killed, we hook up a window listener if one window
            // is being used and only then resolve the startup promise which will kill this second instance.
            // In addition, we poll for the wait marker file to be deleted to return.
            if (waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                return Promise.race([
                    usedWindows[0].whenClosedOrLoaded,
                    (0, pfs_1.whenDeleted)(waitMarkerFileURI.fsPath)
                ]).then(() => undefined, () => undefined);
            }
        }
        async getMainProcessId() {
            this.logService.trace('Received request for process ID from other instance.');
            return process.pid;
        }
    };
    exports.LaunchMainService = LaunchMainService;
    exports.LaunchMainService = LaunchMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, url_1.IURLService),
        __param(3, configuration_1.IConfigurationService)
    ], LaunchMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF1bmNoTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sYXVuY2gvZWxlY3Ryb24tbWFpbi9sYXVuY2hNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQm5GLFFBQUEsRUFBRSxHQUFHLG1CQUFtQixDQUFDO0lBQ3pCLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSwrQkFBZSxFQUFxQixVQUFFLENBQUMsQ0FBQztJQWdCbkUsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFJN0IsWUFDK0IsVUFBdUIsRUFDZixrQkFBdUMsRUFDL0MsVUFBdUIsRUFDYixvQkFBMkM7WUFIckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDL0MsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNiLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFDaEYsQ0FBQztRQUVMLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBc0IsRUFBRSxPQUE0QjtZQUMvRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFNUUscURBQXFEO1lBQ3JELHdEQUF3RDtZQUN4RCx3REFBd0Q7WUFDeEQsb0RBQW9EO1lBQ3BELHdEQUF3RDtZQUN4RCx5REFBeUQ7WUFDekQsdURBQXVEO1lBQ3ZELHdEQUF3RDtZQUN4RCwwQkFBMEI7WUFDMUIsSUFBSSxzQkFBVyxFQUFFLENBQUM7Z0JBQ2pCLGNBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBRUQsMkRBQTJEO1lBQzNELE1BQU0sVUFB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