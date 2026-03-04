/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeNonWindowsPath = escapeNonWindowsPath;
    exports.collapseTildePath = collapseTildePath;
    exports.sanitizeCwd = sanitizeCwd;
    exports.shouldUseEnvironmentVariableCollection = shouldUseEnvironmentVariableCollection;
    /**
     * Aggressively escape non-windows paths to prepare for being sent to a shell. This will do some
     * escaping inaccurately to be careful about possible script injection via the file path. For
     * example, we're trying to prevent this sort of attack: `/foo/file$(echo evil)`.
     */
    function escapeNonWindowsPath(path) {
        let newPath = path;
        if (newPath.includes('\\')) {
            newPath = newPath.replace(/\\/g, '\\\\');
        }
        const bannedChars = /[\`\$\|\&\>\~\#\!\^\*\;\<\"\']/g;
        newPath = newPath.replace(bannedChars, '');
        return `'${newPath}'`;
    }
    /**
     * Collapses the user's home directory into `~` if it exists within the path, this gives a shorter
     * path that is more suitable within the context of a terminal.
     */
    function collapseTildePath(path, userHome, separator) {
        if (!path) {
            return '';
        }
        if (!userHome) {
            return path;
        }
        // Trim the trailing separator from the end if it exists
        if (userHome.match(/[\/\\]$/)) {
            userHome = userHome.slice(0, userHome.length - 1);
        }
        const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
        const normalizedUserHome = userHome.replace(/\\/g, '/').toLowerCase();
        if (!normalizedPath.includes(normalizedUserHome)) {
            return path;
        }
        return `~${separator}${path.slice(userHome.length + 1)}`;
    }
    /**
     * Sanitizes a cwd string, removing any wrapping quotes and making the Windows drive letter
     * uppercase.
     * @param cwd The directory to sanitize.
     */
    function sanitizeCwd(cwd) {
        // Sanity check that the cwd is not wrapped in quotes (see #160109)
        if (cwd.match(/^['"].*['"]$/)) {
            cwd = cwd.substring(1, cwd.length - 1);
        }
        // Make the drive letter uppercase on Windows (see #9448)
        if (platform_1.OS === 1 /* OperatingSystem.Windows */ && cwd && cwd[1] === ':') {
            return cwd[0].toUpperCase() + cwd.substring(1);
        }
        return cwd;
    }
    /**
     * Determines whether the given shell launch config should use the environment variable collection.
     * @param slc The shell launch config to check.
     */
    function shouldUseEnvironmentVariableCollection(slc) {
        return !slc.strictEnv;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi90ZXJtaW5hbEVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLG9EQVFDO0lBTUQsOENBaUJDO0lBT0Qsa0NBVUM7SUFNRCx3RkFFQztJQTdERDs7OztPQUlHO0lBQ0gsU0FBZ0Isb0JBQW9CLENBQUMsSUFBWTtRQUNoRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDbkIsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDNUIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFDRCxNQUFNLFdBQVcsR0FBRyxpQ0FBaUMsQ0FBQztRQUN0RCxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0MsT0FBTyxJQUFJLE9BQU8sR0FBRyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxJQUF3QixFQUFFLFFBQTRCLEVBQUUsU0FBaUI7UUFDMUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0Qsd0RBQXdEO1FBQ3hELElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQy9CLFFBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM5RCxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RFLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztZQUNsRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxPQUFPLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzFELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBZ0IsV0FBVyxDQUFDLEdBQVc7UUFDdEMsbUVBQW1FO1FBQ25FLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1lBQy9CLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFDRCx5REFBeUQ7UUFDekQsSUFBSSxhQUFFLG9DQUE0QixJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDN0QsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0Isc0NBQXNDLENBQUMsR0FBdUI7UUFDN0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7SUFDdkIsQ0FBQyJ9