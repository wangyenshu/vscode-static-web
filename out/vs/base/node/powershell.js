/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, os, path, pfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.enumeratePowerShellInstallations = enumeratePowerShellInstallations;
    exports.getFirstAvailablePowerShellInstallation = getFirstAvailablePowerShellInstallation;
    // This is required, since parseInt("7-preview") will return 7.
    const IntRegex = /^\d+$/;
    const PwshMsixRegex = /^Microsoft.PowerShell_.*/;
    const PwshPreviewMsixRegex = /^Microsoft.PowerShellPreview_.*/;
    var Arch;
    (function (Arch) {
        Arch[Arch["x64"] = 0] = "x64";
        Arch[Arch["x86"] = 1] = "x86";
        Arch[Arch["ARM"] = 2] = "ARM";
    })(Arch || (Arch = {}));
    let processArch;
    switch (process.arch) {
        case 'ia32':
            processArch = 1 /* Arch.x86 */;
            break;
        case 'arm':
        case 'arm64':
            processArch = 2 /* Arch.ARM */;
            break;
        default:
            processArch = 0 /* Arch.x64 */;
            break;
    }
    /*
    Currently, here are the values for these environment variables on their respective archs:
    
    On x86 process on x86:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is undefined
    
    On x86 process on x64:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is AMD64
    
    On x64 process on x64:
    PROCESSOR_ARCHITECTURE is AMD64
    PROCESSOR_ARCHITEW6432 is undefined
    
    On ARM process on ARM:
    PROCESSOR_ARCHITECTURE is ARM64
    PROCESSOR_ARCHITEW6432 is undefined
    
    On x86 process on ARM:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is ARM64
    
    On x64 process on ARM:
    PROCESSOR_ARCHITECTURE is ARM64
    PROCESSOR_ARCHITEW6432 is undefined
    */
    let osArch;
    if (process.env['PROCESSOR_ARCHITEW6432']) {
        osArch = process.env['PROCESSOR_ARCHITEW6432'] === 'ARM64'
            ? 2 /* Arch.ARM */
            : 0 /* Arch.x64 */;
    }
    else if (process.env['PROCESSOR_ARCHITECTURE'] === 'ARM64') {
        osArch = 2 /* Arch.ARM */;
    }
    else if (process.env['PROCESSOR_ARCHITECTURE'] === 'X86') {
        osArch = 1 /* Arch.x86 */;
    }
    else {
        osArch = 0 /* Arch.x64 */;
    }
    class PossiblePowerShellExe {
        constructor(exePath, displayName, knownToExist) {
            this.exePath = exePath;
            this.displayName = displayName;
            this.knownToExist = knownToExist;
        }
        async exists() {
            if (this.knownToExist === undefined) {
                this.knownToExist = await pfs.SymlinkSupport.existsFile(this.exePath);
            }
            return this.knownToExist;
        }
    }
    function getProgramFilesPath({ useAlternateBitness = false } = {}) {
        if (!useAlternateBitness) {
            // Just use the native system bitness
            return process.env.ProgramFiles || null;
        }
        // We might be a 64-bit process looking for 32-bit program files
        if (processArch === 0 /* Arch.x64 */) {
            return process.env['ProgramFiles(x86)'] || null;
        }
        // We might be a 32-bit process looking for 64-bit program files
        if (osArch === 0 /* Arch.x64 */) {
            return process.env.ProgramW6432 || null;
        }
        // We're a 32-bit process on 32-bit Windows, there is no other Program Files dir
        return null;
    }
    async function findPSCoreWindowsInstallation({ useAlternateBitness = false, findPreview = false } = {}) {
        const programFilesPath = getProgramFilesPath({ useAlternateBitness });
        if (!programFilesPath) {
            return null;
        }
        const powerShellInstallBaseDir = path.join(programFilesPath, 'PowerShell');
        // Ensure the base directory exists
        if (!await pfs.SymlinkSupport.existsDirectory(powerShellInstallBaseDir)) {
            return null;
        }
        let highestSeenVersion = -1;
        let pwshExePath = null;
        for (const item of await pfs.Promises.readdir(powerShellInstallBaseDir)) {
            let currentVersion = -1;
            if (findPreview) {
                // We are looking for something like "7-preview"
                // Preview dirs all have dashes in them
                const dashIndex = item.indexOf('-');
                if (dashIndex < 0) {
                    continue;
                }
                // Verify that the part before the dash is an integer
                // and that the part after the dash is "preview"
                const intPart = item.substring(0, dashIndex);
                if (!IntRegex.test(intPart) || item.substring(dashIndex + 1) !== 'preview') {
                    continue;
                }
                currentVersion = parseInt(intPart, 10);
            }
            else {
                // Search for a directory like "6" or "7"
                if (!IntRegex.test(item)) {
                    continue;
                }
                currentVersion = parseInt(item, 10);
            }
            // Ensure we haven't already seen a higher version
            if (currentVersion <= highestSeenVersion) {
                continue;
            }
            // Now look for the file
            const exePath = path.join(powerShellInstallBaseDir, item, 'pwsh.exe');
            if (!await pfs.SymlinkSupport.existsFile(exePath)) {
                continue;
            }
            pwshExePath = exePath;
            highestSeenVersion = currentVersion;
        }
        if (!pwshExePath) {
            return null;
        }
        const bitness = programFilesPath.includes('x86') ? ' (x86)' : '';
        const preview = findPreview ? ' Preview' : '';
        return new PossiblePowerShellExe(pwshExePath, `PowerShell${preview}${bitness}`, true);
    }
    async function findPSCoreMsix({ findPreview } = {}) {
        // We can't proceed if there's no LOCALAPPDATA path
        if (!process.env.LOCALAPPDATA) {
            return null;
        }
        // Find the base directory for MSIX application exe shortcuts
        const msixAppDir = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps');
        if (!await pfs.SymlinkSupport.existsDirectory(msixAppDir)) {
            return null;
        }
        // Define whether we're looking for the preview or the stable
        const { pwshMsixDirRegex, pwshMsixName } = findPreview
            ? { pwshMsixDirRegex: PwshPreviewMsixRegex, pwshMsixName: 'PowerShell Preview (Store)' }
            : { pwshMsixDirRegex: PwshMsixRegex, pwshMsixName: 'PowerShell (Store)' };
        // We should find only one such application, so return on the first one
        for (const subdir of await pfs.Promises.readdir(msixAppDir)) {
            if (pwshMsixDirRegex.test(subdir)) {
                const pwshMsixPath = path.join(msixAppDir, subdir, 'pwsh.exe');
                return new PossiblePowerShellExe(pwshMsixPath, pwshMsixName);
            }
        }
        // If we find nothing, return null
        return null;
    }
    function findPSCoreDotnetGlobalTool() {
        const dotnetGlobalToolExePath = path.join(os.homedir(), '.dotnet', 'tools', 'pwsh.exe');
        return new PossiblePowerShellExe(dotnetGlobalToolExePath, '.NET Core PowerShell Global Tool');
    }
    function findWinPS() {
        const winPSPath = path.join(process.env.windir, processArch === 1 /* Arch.x86 */ && osArch !== 1 /* Arch.x86 */ ? 'SysNative' : 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
        return new PossiblePowerShellExe(winPSPath, 'Windows PowerShell', true);
    }
    /**
     * Iterates through all the possible well-known PowerShell installations on a machine.
     * Returned values may not exist, but come with an .exists property
     * which will check whether the executable exists.
     */
    async function* enumerateDefaultPowerShellInstallations() {
        // Find PSCore stable first
        let pwshExe = await findPSCoreWindowsInstallation();
        if (pwshExe) {
            yield pwshExe;
        }
        // Windows may have a 32-bit pwsh.exe
        pwshExe = await findPSCoreWindowsInstallation({ useAlternateBitness: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Also look for the MSIX/UWP installation
        pwshExe = await findPSCoreMsix();
        if (pwshExe) {
            yield pwshExe;
        }
        // Look for the .NET global tool
        // Some older versions of PowerShell have a bug in this where startup will fail,
        // but this is fixed in newer versions
        pwshExe = findPSCoreDotnetGlobalTool();
        if (pwshExe) {
            yield pwshExe;
        }
        // Look for PSCore preview
        pwshExe = await findPSCoreWindowsInstallation({ findPreview: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Find a preview MSIX
        pwshExe = await findPSCoreMsix({ findPreview: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Look for pwsh-preview with the opposite bitness
        pwshExe = await findPSCoreWindowsInstallation({ useAlternateBitness: true, findPreview: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Finally, get Windows PowerShell
        pwshExe = findWinPS();
        if (pwshExe) {
            yield pwshExe;
        }
    }
    /**
     * Iterates through PowerShell installations on the machine according
     * to configuration passed in through the constructor.
     * PowerShell items returned by this object are verified
     * to exist on the filesystem.
     */
    async function* enumeratePowerShellInstallations() {
        // Get the default PowerShell installations first
        for await (const defaultPwsh of enumerateDefaultPowerShellInstallations()) {
            if (await defaultPwsh.exists()) {
                yield defaultPwsh;
            }
        }
    }
    /**
    * Returns the first available PowerShell executable found in the search order.
    */
    async function getFirstAvailablePowerShellInstallation() {
        for await (const pwsh of enumeratePowerShellInstallations()) {
            return pwsh;
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG93ZXJzaGVsbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9wb3dlcnNoZWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeVNoRyw0RUFPQztJQUtELDBGQUtDO0lBcFRELCtEQUErRDtJQUMvRCxNQUFNLFFBQVEsR0FBVyxPQUFPLENBQUM7SUFFakMsTUFBTSxhQUFhLEdBQVcsMEJBQTBCLENBQUM7SUFDekQsTUFBTSxvQkFBb0IsR0FBVyxpQ0FBaUMsQ0FBQztJQUV2RSxJQUFXLElBSVY7SUFKRCxXQUFXLElBQUk7UUFDZCw2QkFBRyxDQUFBO1FBQ0gsNkJBQUcsQ0FBQTtRQUNILDZCQUFHLENBQUE7SUFDSixDQUFDLEVBSlUsSUFBSSxLQUFKLElBQUksUUFJZDtJQUVELElBQUksV0FBaUIsQ0FBQztJQUN0QixRQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QixLQUFLLE1BQU07WUFDVixXQUFXLG1CQUFXLENBQUM7WUFDdkIsTUFBTTtRQUNQLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxPQUFPO1lBQ1gsV0FBVyxtQkFBVyxDQUFDO1lBQ3ZCLE1BQU07UUFDUDtZQUNDLFdBQVcsbUJBQVcsQ0FBQztZQUN2QixNQUFNO0lBQ1IsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQTBCRTtJQUNGLElBQUksTUFBWSxDQUFDO0lBQ2pCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7UUFDM0MsTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsS0FBSyxPQUFPO1lBQ3pELENBQUM7WUFDRCxDQUFDLGlCQUFTLENBQUM7SUFDYixDQUFDO1NBQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEtBQUssT0FBTyxFQUFFLENBQUM7UUFDOUQsTUFBTSxtQkFBVyxDQUFDO0lBQ25CLENBQUM7U0FBTSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQztRQUM1RCxNQUFNLG1CQUFXLENBQUM7SUFDbkIsQ0FBQztTQUFNLENBQUM7UUFDUCxNQUFNLG1CQUFXLENBQUM7SUFDbkIsQ0FBQztJQVdELE1BQU0scUJBQXFCO1FBQzFCLFlBQ2lCLE9BQWUsRUFDZixXQUFtQixFQUMzQixZQUFzQjtZQUZkLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFDZixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUMzQixpQkFBWSxHQUFaLFlBQVksQ0FBVTtRQUFJLENBQUM7UUFFN0IsS0FBSyxDQUFDLE1BQU07WUFDbEIsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztLQUNEO0lBRUQsU0FBUyxtQkFBbUIsQ0FDM0IsRUFBRSxtQkFBbUIsR0FBRyxLQUFLLEtBQXdDLEVBQUU7UUFFdkUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDMUIscUNBQXFDO1lBQ3JDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxnRUFBZ0U7UUFDaEUsSUFBSSxXQUFXLHFCQUFhLEVBQUUsQ0FBQztZQUM5QixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDakQsQ0FBQztRQUVELGdFQUFnRTtRQUNoRSxJQUFJLE1BQU0scUJBQWEsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxnRkFBZ0Y7UUFDaEYsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsS0FBSyxVQUFVLDZCQUE2QixDQUMzQyxFQUFFLG1CQUFtQixHQUFHLEtBQUssRUFBRSxXQUFXLEdBQUcsS0FBSyxLQUNVLEVBQUU7UUFFOUQsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN2QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFM0UsbUNBQW1DO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztZQUN6RSxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFJLGtCQUFrQixHQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksV0FBVyxHQUFrQixJQUFJLENBQUM7UUFDdEMsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztZQUV6RSxJQUFJLGNBQWMsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUNoQyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixnREFBZ0Q7Z0JBRWhELHVDQUF1QztnQkFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ25CLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxxREFBcUQ7Z0JBQ3JELGdEQUFnRDtnQkFDaEQsTUFBTSxPQUFPLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUM1RSxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsY0FBYyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHlDQUF5QztnQkFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsU0FBUztnQkFDVixDQUFDO2dCQUVELGNBQWMsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxrREFBa0Q7WUFDbEQsSUFBSSxjQUFjLElBQUksa0JBQWtCLEVBQUUsQ0FBQztnQkFDMUMsU0FBUztZQUNWLENBQUM7WUFFRCx3QkFBd0I7WUFDeEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsU0FBUztZQUNWLENBQUM7WUFFRCxXQUFXLEdBQUcsT0FBTyxDQUFDO1lBQ3RCLGtCQUFrQixHQUFHLGNBQWMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFXLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDekUsTUFBTSxPQUFPLEdBQVcsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUV0RCxPQUFPLElBQUkscUJBQXFCLENBQUMsV0FBVyxFQUFFLGFBQWEsT0FBTyxHQUFHLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxLQUFLLFVBQVUsY0FBYyxDQUFDLEVBQUUsV0FBVyxLQUFnQyxFQUFFO1FBQzVFLG1EQUFtRDtRQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMvQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCw2REFBNkQ7UUFDN0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFbkYsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUMzRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCw2REFBNkQ7UUFDN0QsTUFBTSxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxHQUFHLFdBQVc7WUFDckQsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLDRCQUE0QixFQUFFO1lBQ3hGLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQztRQUUzRSx1RUFBdUU7UUFDdkUsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDN0QsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLElBQUkscUJBQXFCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzlELENBQUM7UUFDRixDQUFDO1FBRUQsa0NBQWtDO1FBQ2xDLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsMEJBQTBCO1FBQ2xDLE1BQU0sdUJBQXVCLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUVoRyxPQUFPLElBQUkscUJBQXFCLENBQUMsdUJBQXVCLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztJQUMvRixDQUFDO0lBRUQsU0FBUyxTQUFTO1FBQ2pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTyxFQUNuQixXQUFXLHFCQUFhLElBQUksTUFBTSxxQkFBYSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFDMUUsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFaEQsT0FBTyxJQUFJLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssU0FBUyxDQUFDLENBQUMsdUNBQXVDO1FBQ3RELDJCQUEyQjtRQUMzQixJQUFJLE9BQU8sR0FBRyxNQUFNLDZCQUE2QixFQUFFLENBQUM7UUFDcEQsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sT0FBTyxDQUFDO1FBQ2YsQ0FBQztRQUVELHFDQUFxQztRQUNyQyxPQUFPLEdBQUcsTUFBTSw2QkFBNkIsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDN0UsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sT0FBTyxDQUFDO1FBQ2YsQ0FBQztRQUVELDBDQUEwQztRQUMxQyxPQUFPLEdBQUcsTUFBTSxjQUFjLEVBQUUsQ0FBQztRQUNqQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxPQUFPLENBQUM7UUFDZixDQUFDO1FBRUQsZ0NBQWdDO1FBQ2hDLGdGQUFnRjtRQUNoRixzQ0FBc0M7UUFDdEMsT0FBTyxHQUFHLDBCQUEwQixFQUFFLENBQUM7UUFDdkMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sT0FBTyxDQUFDO1FBQ2YsQ0FBQztRQUVELDBCQUEwQjtRQUMxQixPQUFPLEdBQUcsTUFBTSw2QkFBNkIsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLElBQUksT0FBTyxFQUFFLENBQUM7WUFDYixNQUFNLE9BQU8sQ0FBQztRQUNmLENBQUM7UUFFRCxzQkFBc0I7UUFDdEIsT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEQsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sT0FBTyxDQUFDO1FBQ2YsQ0FBQztRQUVELGtEQUFrRDtRQUNsRCxPQUFPLEdBQUcsTUFBTSw2QkFBNkIsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxPQUFPLENBQUM7UUFDZixDQUFDO1FBRUQsa0NBQWtDO1FBQ2xDLE9BQU8sR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUN0QixJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxPQUFPLENBQUM7UUFDZixDQUFDO0lBQ0YsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksS0FBSyxTQUFTLENBQUMsQ0FBQyxnQ0FBZ0M7UUFDdEQsaURBQWlEO1FBQ2pELElBQUksS0FBSyxFQUFFLE1BQU0sV0FBVyxJQUFJLHVDQUF1QyxFQUFFLEVBQUUsQ0FBQztZQUMzRSxJQUFJLE1BQU0sV0FBVyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sV0FBVyxDQUFDO1lBQ25CLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQztJQUVEOztNQUVFO0lBQ0ssS0FBSyxVQUFVLHVDQUF1QztRQUM1RCxJQUFJLEtBQUssRUFBRSxNQUFNLElBQUksSUFBSSxnQ0FBZ0MsRUFBRSxFQUFFLENBQUM7WUFDN0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDIn0=