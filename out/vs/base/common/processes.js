/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminateResponseCode = exports.Source = void 0;
    exports.sanitizeProcessEnvironment = sanitizeProcessEnvironment;
    exports.removeDangerousEnvVariables = removeDangerousEnvVariables;
    var Source;
    (function (Source) {
        Source[Source["stdout"] = 0] = "stdout";
        Source[Source["stderr"] = 1] = "stderr";
    })(Source || (exports.Source = Source = {}));
    var TerminateResponseCode;
    (function (TerminateResponseCode) {
        TerminateResponseCode[TerminateResponseCode["Success"] = 0] = "Success";
        TerminateResponseCode[TerminateResponseCode["Unknown"] = 1] = "Unknown";
        TerminateResponseCode[TerminateResponseCode["AccessDenied"] = 2] = "AccessDenied";
        TerminateResponseCode[TerminateResponseCode["ProcessNotFound"] = 3] = "ProcessNotFound";
    })(TerminateResponseCode || (exports.TerminateResponseCode = TerminateResponseCode = {}));
    /**
     * Sanitizes a VS Code process environment by removing all Electron/VS Code-related values.
     */
    function sanitizeProcessEnvironment(env, ...preserve) {
        const set = preserve.reduce((set, key) => {
            set[key] = true;
            return set;
        }, {});
        const keysToRemove = [
            /^ELECTRON_.+$/,
            /^VSCODE_(?!(PORTABLE|SHELL_LOGIN|ENV_REPLACE|ENV_APPEND|ENV_PREPEND)).+$/,
            /^SNAP(|_.*)$/,
            /^GDK_PIXBUF_.+$/,
        ];
        const envKeys = Object.keys(env);
        envKeys
            .filter(key => !set[key])
            .forEach(envKey => {
            for (let i = 0; i < keysToRemove.length; i++) {
                if (envKey.search(keysToRemove[i]) !== -1) {
                    delete env[envKey];
                    break;
                }
            }
        });
    }
    /**
     * Remove dangerous environment variables that have caused crashes
     * in forked processes (i.e. in ELECTRON_RUN_AS_NODE processes)
     *
     * @param env The env object to change
     */
    function removeDangerousEnvVariables(env) {
        if (!env) {
            return;
        }
        // Unset `DEBUG`, as an invalid value might lead to process crashes
        // See https://github.com/microsoft/vscode/issues/130072
        delete env['DEBUG'];
        if (platform_1.isMacintosh) {
            // Unset `DYLD_LIBRARY_PATH`, as it leads to process crashes
            // See https://github.com/microsoft/vscode/issues/104525
            // See https://github.com/microsoft/vscode/issues/105848
            delete env['DYLD_LIBRARY_PATH'];
        }
        if (platform_1.isLinux) {
            // Unset `LD_PRELOAD`, as it might lead to process crashes
            // See https://github.com/microsoft/vscode/issues/134177
            delete env['LD_PRELOAD'];
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vcHJvY2Vzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9HaEcsZ0VBc0JDO0lBUUQsa0VBcUJDO0lBdEdELElBQWtCLE1BR2pCO0lBSEQsV0FBa0IsTUFBTTtRQUN2Qix1Q0FBTSxDQUFBO1FBQ04sdUNBQU0sQ0FBQTtJQUNQLENBQUMsRUFIaUIsTUFBTSxzQkFBTixNQUFNLFFBR3ZCO0lBMkJELElBQWtCLHFCQUtqQjtJQUxELFdBQWtCLHFCQUFxQjtRQUN0Qyx1RUFBVyxDQUFBO1FBQ1gsdUVBQVcsQ0FBQTtRQUNYLGlGQUFnQixDQUFBO1FBQ2hCLHVGQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFMaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFLdEM7SUFhRDs7T0FFRztJQUNILFNBQWdCLDBCQUEwQixDQUFDLEdBQXdCLEVBQUUsR0FBRyxRQUFrQjtRQUN6RixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ3hDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDaEIsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLEVBQUUsRUFBNkIsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sWUFBWSxHQUFHO1lBQ3BCLGVBQWU7WUFDZiwwRUFBMEU7WUFDMUUsY0FBYztZQUNkLGlCQUFpQjtTQUNqQixDQUFDO1FBQ0YsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxPQUFPO2FBQ0wsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDeEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUMzQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDbkIsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQUMsR0FBb0M7UUFDL0UsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1YsT0FBTztRQUNSLENBQUM7UUFFRCxtRUFBbUU7UUFDbkUsd0RBQXdEO1FBQ3hELE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXBCLElBQUksc0JBQVcsRUFBRSxDQUFDO1lBQ2pCLDREQUE0RDtZQUM1RCx3REFBd0Q7WUFDeEQsd0RBQXdEO1lBQ3hELE9BQU8sR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksa0JBQU8sRUFBRSxDQUFDO1lBQ2IsMERBQTBEO1lBQzFELHdEQUF3RDtZQUN4RCxPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxQixDQUFDO0lBQ0YsQ0FBQyJ9