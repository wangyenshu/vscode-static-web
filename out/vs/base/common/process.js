/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.arch = exports.platform = exports.env = exports.cwd = void 0;
    let safeProcess;
    // Native sandbox environment
    const vscodeGlobal = globalThis.vscode;
    if (typeof vscodeGlobal !== 'undefined' && typeof vscodeGlobal.process !== 'undefined') {
        const sandboxProcess = vscodeGlobal.process;
        safeProcess = {
            get platform() { return sandboxProcess.platform; },
            get arch() { return sandboxProcess.arch; },
            get env() { return sandboxProcess.env; },
            cwd() { return sandboxProcess.cwd(); }
        };
    }
    // Native node.js environment
    else if (typeof process !== 'undefined') {
        safeProcess = {
            get platform() { return process.platform; },
            get arch() { return process.arch; },
            get env() { return process.env; },
            cwd() { return process.env['VSCODE_CWD'] || process.cwd(); }
        };
    }
    // Web environment
    else {
        safeProcess = {
            // Supported
            get platform() { return platform_1.isWindows ? 'win32' : platform_1.isMacintosh ? 'darwin' : 'linux'; },
            get arch() { return undefined; /* arch is undefined in web */ },
            // Unsupported
            get env() { return {}; },
            cwd() { return '/'; }
        };
    }
    /**
     * Provides safe access to the `cwd` property in node.js, sandboxed or web
     * environments.
     *
     * Note: in web, this property is hardcoded to be `/`.
     *
     * @skipMangle
     */
    exports.cwd = safeProcess.cwd;
    /**
     * Provides safe access to the `env` property in node.js, sandboxed or web
     * environments.
     *
     * Note: in web, this property is hardcoded to be `{}`.
     */
    exports.env = safeProcess.env;
    /**
     * Provides safe access to the `platform` property in node.js, sandboxed or web
     * environments.
     */
    exports.platform = safeProcess.platform;
    /**
     * Provides safe access to the `arch` method in node.js, sandboxed or web
     * environments.
     * Note: `arch` is `undefined` in web
     */
    exports.arch = safeProcess.arch;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3Byb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLElBQUksV0FBc0UsQ0FBQztJQUczRSw2QkFBNkI7SUFDN0IsTUFBTSxZQUFZLEdBQUksVUFBa0IsQ0FBQyxNQUFNLENBQUM7SUFDaEQsSUFBSSxPQUFPLFlBQVksS0FBSyxXQUFXLElBQUksT0FBTyxZQUFZLENBQUMsT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQ3hGLE1BQU0sY0FBYyxHQUFpQixZQUFZLENBQUMsT0FBTyxDQUFDO1FBQzFELFdBQVcsR0FBRztZQUNiLElBQUksUUFBUSxLQUFLLE9BQU8sY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEQsSUFBSSxJQUFJLEtBQUssT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMxQyxJQUFJLEdBQUcsS0FBSyxPQUFPLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLEdBQUcsS0FBSyxPQUFPLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDdEMsQ0FBQztJQUNILENBQUM7SUFFRCw2QkFBNkI7U0FDeEIsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUUsQ0FBQztRQUN6QyxXQUFXLEdBQUc7WUFDYixJQUFJLFFBQVEsS0FBSyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzNDLElBQUksSUFBSSxLQUFLLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkMsSUFBSSxHQUFHLEtBQUssT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqQyxHQUFHLEtBQUssT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDNUQsQ0FBQztJQUNILENBQUM7SUFFRCxrQkFBa0I7U0FDYixDQUFDO1FBQ0wsV0FBVyxHQUFHO1lBRWIsWUFBWTtZQUNaLElBQUksUUFBUSxLQUFLLE9BQU8sb0JBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxzQkFBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDakYsSUFBSSxJQUFJLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBRS9ELGNBQWM7WUFDZCxJQUFJLEdBQUcsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxLQUFLLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDVSxRQUFBLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDO0lBRW5DOzs7OztPQUtHO0lBQ1UsUUFBQSxHQUFHLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQztJQUVuQzs7O09BR0c7SUFDVSxRQUFBLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO0lBRTdDOzs7O09BSUc7SUFDVSxRQUFBLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDIn0=