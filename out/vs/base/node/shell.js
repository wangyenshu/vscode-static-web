/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/platform", "vs/base/node/powershell", "vs/base/node/processes"], function (require, exports, os_1, platform, powershell_1, processes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSystemShell = getSystemShell;
    /**
     * Gets the detected default shell for the _system_, not to be confused with VS Code's _default_
     * shell that the terminal uses by default.
     * @param os The platform to detect the shell of.
     */
    async function getSystemShell(os, env) {
        if (os === 1 /* platform.OperatingSystem.Windows */) {
            if (platform.isWindows) {
                return getSystemShellWindows();
            }
            // Don't detect Windows shell when not on Windows
            return processes.getWindowsShell(env);
        }
        return getSystemShellUnixLike(os, env);
    }
    let _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = null;
    function getSystemShellUnixLike(os, env) {
        // Only use $SHELL for the current OS
        if (platform.isLinux && os === 2 /* platform.OperatingSystem.Macintosh */ || platform.isMacintosh && os === 3 /* platform.OperatingSystem.Linux */) {
            return '/bin/bash';
        }
        if (!_TERMINAL_DEFAULT_SHELL_UNIX_LIKE) {
            let unixLikeTerminal;
            if (platform.isWindows) {
                unixLikeTerminal = '/bin/bash'; // for WSL
            }
            else {
                unixLikeTerminal = env['SHELL'];
                if (!unixLikeTerminal) {
                    try {
                        // It's possible for $SHELL to be unset, this API reads /etc/passwd. See https://github.com/github/codespaces/issues/1639
                        // Node docs: "Throws a SystemError if a user has no username or homedir."
                        unixLikeTerminal = (0, os_1.userInfo)().shell;
                    }
                    catch (err) { }
                }
                if (!unixLikeTerminal) {
                    unixLikeTerminal = 'sh';
                }
                // Some systems have $SHELL set to /bin/false which breaks the terminal
                if (unixLikeTerminal === '/bin/false') {
                    unixLikeTerminal = '/bin/bash';
                }
            }
            _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = unixLikeTerminal;
        }
        return _TERMINAL_DEFAULT_SHELL_UNIX_LIKE;
    }
    let _TERMINAL_DEFAULT_SHELL_WINDOWS = null;
    async function getSystemShellWindows() {
        if (!_TERMINAL_DEFAULT_SHELL_WINDOWS) {
            _TERMINAL_DEFAULT_SHELL_WINDOWS = (await (0, powershell_1.getFirstAvailablePowerShellInstallation)()).exePath;
        }
        return _TERMINAL_DEFAULT_SHELL_WINDOWS;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvc2hlbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsd0NBVUM7SUFmRDs7OztPQUlHO0lBQ0ksS0FBSyxVQUFVLGNBQWMsQ0FBQyxFQUE0QixFQUFFLEdBQWlDO1FBQ25HLElBQUksRUFBRSw2Q0FBcUMsRUFBRSxDQUFDO1lBQzdDLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixPQUFPLHFCQUFxQixFQUFFLENBQUM7WUFDaEMsQ0FBQztZQUNELGlEQUFpRDtZQUNqRCxPQUFPLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELE9BQU8sc0JBQXNCLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxJQUFJLGlDQUFpQyxHQUFrQixJQUFJLENBQUM7SUFDNUQsU0FBUyxzQkFBc0IsQ0FBQyxFQUE0QixFQUFFLEdBQWlDO1FBQzlGLHFDQUFxQztRQUNyQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLElBQUksRUFBRSwrQ0FBdUMsSUFBSSxRQUFRLENBQUMsV0FBVyxJQUFJLEVBQUUsMkNBQW1DLEVBQUUsQ0FBQztZQUNwSSxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLENBQUM7WUFDeEMsSUFBSSxnQkFBb0MsQ0FBQztZQUN6QyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLENBQUMsVUFBVTtZQUMzQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVoQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDO3dCQUNKLHlIQUF5SDt3QkFDekgsMEVBQTBFO3dCQUMxRSxnQkFBZ0IsR0FBRyxJQUFBLGFBQVEsR0FBRSxDQUFDLEtBQUssQ0FBQztvQkFDckMsQ0FBQztvQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdkIsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixDQUFDO2dCQUVELHVFQUF1RTtnQkFDdkUsSUFBSSxnQkFBZ0IsS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDdkMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztZQUNELGlDQUFpQyxHQUFHLGdCQUFnQixDQUFDO1FBQ3RELENBQUM7UUFDRCxPQUFPLGlDQUFpQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxJQUFJLCtCQUErQixHQUFrQixJQUFJLENBQUM7SUFDMUQsS0FBSyxVQUFVLHFCQUFxQjtRQUNuQyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQztZQUN0QywrQkFBK0IsR0FBRyxDQUFDLE1BQU0sSUFBQSxvREFBdUMsR0FBRSxDQUFFLENBQUMsT0FBTyxDQUFDO1FBQzlGLENBQUM7UUFDRCxPQUFPLCtCQUErQixDQUFDO0lBQ3hDLENBQUMifQ==