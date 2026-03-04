/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "fs", "vs/base/common/network", "vs/server/node/remoteExtensionHostAgentCli", "vs/server/node/remoteExtensionHostAgentServer", "vs/platform/environment/node/argv", "vs/base/common/path", "perf_hooks", "vs/server/node/serverEnvironmentService", "vs/platform/product/common/product", "vs/base/common/performance"], function (require, exports, os, fs, network_1, remoteExtensionHostAgentCli_1, remoteExtensionHostAgentServer_1, argv_1, path_1, perf_hooks_1, serverEnvironmentService_1, product_1, perf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spawnCli = spawnCli;
    exports.createServer = createServer;
    perf.mark('code/server/codeLoaded');
    global.vscodeServerCodeLoadedTime = perf_hooks_1.performance.now();
    const errorReporter = {
        onMultipleValues: (id, usedValue) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    };
    const args = (0, argv_1.parseArgs)(process.argv.slice(2), serverEnvironmentService_1.serverOptions, errorReporter);
    const REMOTE_DATA_FOLDER = args['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || (0, path_1.join)(os.homedir(), product_1.default.serverDataFolderName || '.vscode-remote');
    const USER_DATA_PATH = (0, path_1.join)(REMOTE_DATA_FOLDER, 'data');
    const APP_SETTINGS_HOME = (0, path_1.join)(USER_DATA_PATH, 'User');
    const GLOBAL_STORAGE_HOME = (0, path_1.join)(APP_SETTINGS_HOME, 'globalStorage');
    const LOCAL_HISTORY_HOME = (0, path_1.join)(APP_SETTINGS_HOME, 'History');
    const MACHINE_SETTINGS_HOME = (0, path_1.join)(USER_DATA_PATH, 'Machine');
    args['user-data-dir'] = USER_DATA_PATH;
    const APP_ROOT = (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath);
    const BUILTIN_EXTENSIONS_FOLDER_PATH = (0, path_1.join)(APP_ROOT, 'extensions');
    args['builtin-extensions-dir'] = BUILTIN_EXTENSIONS_FOLDER_PATH;
    args['extensions-dir'] = args['extensions-dir'] || (0, path_1.join)(REMOTE_DATA_FOLDER, 'extensions');
    [REMOTE_DATA_FOLDER, args['extensions-dir'], USER_DATA_PATH, APP_SETTINGS_HOME, MACHINE_SETTINGS_HOME, GLOBAL_STORAGE_HOME, LOCAL_HISTORY_HOME].forEach(f => {
        try {
            if (!fs.existsSync(f)) {
                fs.mkdirSync(f, { mode: 0o700 });
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    /**
     * invoked by server-main.js
     */
    function spawnCli() {
        (0, remoteExtensionHostAgentCli_1.run)(args, REMOTE_DATA_FOLDER, serverEnvironmentService_1.serverOptions);
    }
    /**
     * invoked by server-main.js
     */
    function createServer(address) {
        return (0, remoteExtensionHostAgentServer_1.createServer)(address, args, REMOTE_DATA_FOLDER);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLm1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9zZXJ2ZXIubWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTBEaEcsNEJBRUM7SUFLRCxvQ0FFQztJQXBERCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDOUIsTUFBTyxDQUFDLDBCQUEwQixHQUFHLHdCQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFN0QsTUFBTSxhQUFhLEdBQWtCO1FBQ3BDLGdCQUFnQixFQUFFLENBQUMsRUFBVSxFQUFFLFNBQWlCLEVBQUUsRUFBRTtZQUNuRCxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSwyQ0FBMkMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBQ0QsWUFBWSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFDRCxlQUFlLEVBQUUsQ0FBQyxFQUFVLEVBQUUsRUFBRTtZQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLDhCQUE4QixDQUFDLENBQUM7UUFDckUsQ0FBQztRQUNELGtCQUFrQixFQUFFLENBQUMsZ0JBQXdCLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDekQsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLGdCQUFnQixvQkFBb0IsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN4RSxDQUFDO0tBQ0QsQ0FBQztJQUVGLE1BQU0sSUFBSSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSx3Q0FBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTVFLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLElBQUEsV0FBSSxFQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxpQkFBTyxDQUFDLG9CQUFvQixJQUFJLGdCQUFnQixDQUFDLENBQUM7SUFDakssTUFBTSxjQUFjLEdBQUcsSUFBQSxXQUFJLEVBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDeEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkQsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLFdBQUksRUFBQyxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUNyRSxNQUFNLGtCQUFrQixHQUFHLElBQUEsV0FBSSxFQUFDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELE1BQU0scUJBQXFCLEdBQUcsSUFBQSxXQUFJLEVBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxjQUFjLENBQUM7SUFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBQSxjQUFPLEVBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUQsTUFBTSw4QkFBOEIsR0FBRyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDcEUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsOEJBQThCLENBQUM7SUFDaEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksSUFBQSxXQUFJLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFMUYsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDM0osSUFBSSxDQUFDO1lBQ0osSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0YsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQUMsQ0FBQztJQUN0QyxDQUFDLENBQUMsQ0FBQztJQUVIOztPQUVHO0lBQ0gsU0FBZ0IsUUFBUTtRQUN2QixJQUFBLGlDQUFNLEVBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLHdDQUFhLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixZQUFZLENBQUMsT0FBd0M7UUFDcEUsT0FBTyxJQUFBLDZDQUFjLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQzFELENBQUMifQ==