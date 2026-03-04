/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/codicons", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/node/pfs", "vs/base/node/powershell", "vs/platform/terminal/node/terminalEnvironment", "path"], function (require, exports, cp, codicons_1, path_1, platform_1, types_1, pfs, powershell_1, terminalEnvironment_1, path_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectAvailableProfiles = detectAvailableProfiles;
    var Constants;
    (function (Constants) {
        Constants["UnixShellsPath"] = "/etc/shells";
    })(Constants || (Constants = {}));
    let profileSources;
    let logIfWslNotInstalled = true;
    function detectAvailableProfiles(profiles, defaultProfile, includeDetectedProfiles, configurationService, shellEnv = process.env, fsProvider, logService, variableResolver, testPwshSourcePaths) {
        fsProvider = fsProvider || {
            existsFile: pfs.SymlinkSupport.existsFile,
            readFile: pfs.Promises.readFile
        };
        if (platform_1.isWindows) {
            return detectAvailableWindowsProfiles(includeDetectedProfiles, fsProvider, shellEnv, logService, configurationService.getValue("terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */) !== false, profiles && typeof profiles === 'object' ? { ...profiles } : configurationService.getValue("terminal.integrated.profiles.windows" /* TerminalSettingId.ProfilesWindows */), typeof defaultProfile === 'string' ? defaultProfile : configurationService.getValue("terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */), testPwshSourcePaths, variableResolver);
        }
        return detectAvailableUnixProfiles(fsProvider, logService, includeDetectedProfiles, profiles && typeof profiles === 'object' ? { ...profiles } : configurationService.getValue(platform_1.isLinux ? "terminal.integrated.profiles.linux" /* TerminalSettingId.ProfilesLinux */ : "terminal.integrated.profiles.osx" /* TerminalSettingId.ProfilesMacOs */), typeof defaultProfile === 'string' ? defaultProfile : configurationService.getValue(platform_1.isLinux ? "terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */ : "terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */), testPwshSourcePaths, variableResolver, shellEnv);
    }
    async function detectAvailableWindowsProfiles(includeDetectedProfiles, fsProvider, shellEnv, logService, useWslProfiles, configProfiles, defaultProfileName, testPwshSourcePaths, variableResolver) {
        // Determine the correct System32 path. We want to point to Sysnative
        // when the 32-bit version of VS Code is running on a 64-bit machine.
        // The reason for this is because PowerShell's important PSReadline
        // module doesn't work if this is not the case. See #27915.
        const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
        const system32Path = `${process.env['windir']}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}`;
        let useWSLexe = false;
        if ((0, terminalEnvironment_1.getWindowsBuildNumber)() >= 16299) {
            useWSLexe = true;
        }
        await initializeWindowsProfiles(testPwshSourcePaths);
        const detectedProfiles = new Map();
        // Add auto detected profiles
        if (includeDetectedProfiles) {
            detectedProfiles.set('PowerShell', {
                source: "PowerShell" /* ProfileSource.Pwsh */,
                icon: codicons_1.Codicon.terminalPowershell,
                isAutoDetected: true
            });
            detectedProfiles.set('Windows PowerShell', {
                path: `${system32Path}\\WindowsPowerShell\\v1.0\\powershell.exe`,
                icon: codicons_1.Codicon.terminalPowershell,
                isAutoDetected: true
            });
            detectedProfiles.set('Git Bash', {
                source: "Git Bash" /* ProfileSource.GitBash */,
                isAutoDetected: true
            });
            detectedProfiles.set('Command Prompt', {
                path: `${system32Path}\\cmd.exe`,
                icon: codicons_1.Codicon.terminalCmd,
                isAutoDetected: true
            });
            detectedProfiles.set('Cygwin', {
                path: [
                    { path: `${process.env['HOMEDRIVE']}\\cygwin64\\bin\\bash.exe`, isUnsafe: true },
                    { path: `${process.env['HOMEDRIVE']}\\cygwin\\bin\\bash.exe`, isUnsafe: true }
                ],
                args: ['--login'],
                isAutoDetected: true
            });
            detectedProfiles.set('bash (MSYS2)', {
                path: [
                    { path: `${process.env['HOMEDRIVE']}\\msys64\\usr\\bin\\bash.exe`, isUnsafe: true },
                ],
                args: ['--login', '-i'],
                // CHERE_INVOKING retains current working directory
                env: { CHERE_INVOKING: '1' },
                icon: codicons_1.Codicon.terminalBash,
                isAutoDetected: true
            });
            const cmderPath = `${process.env['CMDER_ROOT'] || `${process.env['HOMEDRIVE']}\\cmder`}\\vendor\\bin\\vscode_init.cmd`;
            detectedProfiles.set('Cmder', {
                path: `${system32Path}\\cmd.exe`,
                args: ['/K', cmderPath],
                // The path is safe if it was derived from CMDER_ROOT
                requiresPath: process.env['CMDER_ROOT'] ? cmderPath : { path: cmderPath, isUnsafe: true },
                isAutoDetected: true
            });
        }
        applyConfigProfilesToMap(configProfiles, detectedProfiles);
        const resultProfiles = await transformToTerminalProfiles(detectedProfiles.entries(), defaultProfileName, fsProvider, shellEnv, logService, variableResolver);
        if (includeDetectedProfiles && useWslProfiles) {
            try {
                const result = await getWslProfiles(`${system32Path}\\${useWSLexe ? 'wsl' : 'bash'}.exe`, defaultProfileName);
                for (const wslProfile of result) {
                    if (!configProfiles || !(wslProfile.profileName in configProfiles)) {
                        resultProfiles.push(wslProfile);
                    }
                }
            }
            catch (e) {
                if (logIfWslNotInstalled) {
                    logService?.trace('WSL is not installed, so could not detect WSL profiles');
                    logIfWslNotInstalled = false;
                }
            }
        }
        return resultProfiles;
    }
    async function transformToTerminalProfiles(entries, defaultProfileName, fsProvider, shellEnv = process.env, logService, variableResolver) {
        const promises = [];
        for (const [profileName, profile] of entries) {
            promises.push(getValidatedProfile(profileName, profile, defaultProfileName, fsProvider, shellEnv, logService, variableResolver));
        }
        return (await Promise.all(promises)).filter(e => !!e);
    }
    async function getValidatedProfile(profileName, profile, defaultProfileName, fsProvider, shellEnv = process.env, logService, variableResolver) {
        if (profile === null) {
            return undefined;
        }
        let originalPaths;
        let args;
        let icon = undefined;
        // use calculated values if path is not specified
        if ('source' in profile && !('path' in profile)) {
            const source = profileSources?.get(profile.source);
            if (!source) {
                return undefined;
            }
            originalPaths = source.paths;
            // if there are configured args, override the default ones
            args = profile.args || source.args;
            if (profile.icon) {
                icon = validateIcon(profile.icon);
            }
            else if (source.icon) {
                icon = source.icon;
            }
        }
        else {
            originalPaths = Array.isArray(profile.path) ? profile.path : [profile.path];
            args = platform_1.isWindows ? profile.args : Array.isArray(profile.args) ? profile.args : undefined;
            icon = validateIcon(profile.icon);
        }
        let paths;
        if (variableResolver) {
            // Convert to string[] for resolve
            const mapped = originalPaths.map(e => typeof e === 'string' ? e : e.path);
            const resolved = await variableResolver(mapped);
            // Convert resolved back to (T | string)[]
            paths = new Array(originalPaths.length);
            for (let i = 0; i < originalPaths.length; i++) {
                if (typeof originalPaths[i] === 'string') {
                    paths[i] = resolved[i];
                }
                else {
                    paths[i] = {
                        path: resolved[i],
                        isUnsafe: true
                    };
                }
            }
        }
        else {
            paths = originalPaths.slice();
        }
        let requiresUnsafePath;
        if (profile.requiresPath) {
            // Validate requiresPath exists
            let actualRequiredPath;
            if ((0, types_1.isString)(profile.requiresPath)) {
                actualRequiredPath = profile.requiresPath;
            }
            else {
                actualRequiredPath = profile.requiresPath.path;
                if (profile.requiresPath.isUnsafe) {
                    requiresUnsafePath = actualRequiredPath;
                }
            }
            const result = await fsProvider.existsFile(actualRequiredPath);
            if (!result) {
                return;
            }
        }
        const validatedProfile = await validateProfilePaths(profileName, defaultProfileName, paths, fsProvider, shellEnv, args, profile.env, profile.overrideName, profile.isAutoDetected, requiresUnsafePath);
        if (!validatedProfile) {
            logService?.debug('Terminal profile not validated', profileName, originalPaths);
            return undefined;
        }
        validatedProfile.isAutoDetected = profile.isAutoDetected;
        validatedProfile.icon = icon;
        validatedProfile.color = profile.color;
        return validatedProfile;
    }
    function validateIcon(icon) {
        if (typeof icon === 'string') {
            return { id: icon };
        }
        return icon;
    }
    async function initializeWindowsProfiles(testPwshSourcePaths) {
        if (profileSources && !testPwshSourcePaths) {
            return;
        }
        const [gitBashPaths, pwshPaths] = await Promise.all([getGitBashPaths(), testPwshSourcePaths || getPowershellPaths()]);
        profileSources = new Map();
        profileSources.set("Git Bash" /* ProfileSource.GitBash */, {
            profileName: 'Git Bash',
            paths: gitBashPaths,
            args: ['--login', '-i']
        });
        profileSources.set("PowerShell" /* ProfileSource.Pwsh */, {
            profileName: 'PowerShell',
            paths: pwshPaths,
            icon: codicons_1.Codicon.terminalPowershell
        });
    }
    async function getGitBashPaths() {
        const gitDirs = new Set();
        // Look for git.exe on the PATH and use that if found. git.exe is located at
        // `<installdir>/cmd/git.exe`. This is not an unsafe location because the git executable is
        // located on the PATH which is only controlled by the user/admin.
        const gitExePath = await (0, terminalEnvironment_1.findExecutable)('git.exe');
        if (gitExePath) {
            const gitExeDir = (0, path_2.dirname)(gitExePath);
            gitDirs.add((0, path_2.resolve)(gitExeDir, '../..'));
        }
        function addTruthy(set, value) {
            if (value) {
                set.add(value);
            }
        }
        // Add common git install locations
        addTruthy(gitDirs, process.env['ProgramW6432']);
        addTruthy(gitDirs, process.env['ProgramFiles']);
        addTruthy(gitDirs, process.env['ProgramFiles(X86)']);
        addTruthy(gitDirs, `${process.env['LocalAppData']}\\Program`);
        const gitBashPaths = [];
        for (const gitDir of gitDirs) {
            gitBashPaths.push(`${gitDir}\\Git\\bin\\bash.exe`, `${gitDir}\\Git\\usr\\bin\\bash.exe`, `${gitDir}\\usr\\bin\\bash.exe` // using Git for Windows SDK
            );
        }
        // Add special installs that don't follow the standard directory structure
        gitBashPaths.push(`${process.env['UserProfile']}\\scoop\\apps\\git\\current\\bin\\bash.exe`);
        gitBashPaths.push(`${process.env['UserProfile']}\\scoop\\apps\\git-with-openssh\\current\\bin\\bash.exe`);
        return gitBashPaths;
    }
    async function getPowershellPaths() {
        const paths = [];
        // Add all of the different kinds of PowerShells
        for await (const pwshExe of (0, powershell_1.enumeratePowerShellInstallations)()) {
            paths.push(pwshExe.exePath);
        }
        return paths;
    }
    async function getWslProfiles(wslPath, defaultProfileName) {
        const profiles = [];
        const distroOutput = await new Promise((resolve, reject) => {
            // wsl.exe output is encoded in utf16le (ie. A -> 0x4100)
            cp.exec('wsl.exe -l -q', { encoding: 'utf16le', timeout: 1000 }, (err, stdout) => {
                if (err) {
                    return reject('Problem occurred when getting wsl distros');
                }
                resolve(stdout);
            });
        });
        if (!distroOutput) {
            return [];
        }
        const regex = new RegExp(/[\r?\n]/);
        const distroNames = distroOutput.split(regex).filter(t => t.trim().length > 0 && t !== '');
        for (const distroName of distroNames) {
            // Skip empty lines
            if (distroName === '') {
                continue;
            }
            // docker-desktop and docker-desktop-data are treated as implementation details of
            // Docker Desktop for Windows and therefore not exposed
            if (distroName.startsWith('docker-desktop')) {
                continue;
            }
            // Create the profile, adding the icon depending on the distro
            const profileName = `${distroName} (WSL)`;
            const profile = {
                profileName,
                path: wslPath,
                args: [`-d`, `${distroName}`],
                isDefault: profileName === defaultProfileName,
                icon: getWslIcon(distroName),
                isAutoDetected: false
            };
            // Add the profile
            profiles.push(profile);
        }
        return profiles;
    }
    function getWslIcon(distroName) {
        if (distroName.includes('Ubuntu')) {
            return codicons_1.Codicon.terminalUbuntu;
        }
        else if (distroName.includes('Debian')) {
            return codicons_1.Codicon.terminalDebian;
        }
        else {
            return codicons_1.Codicon.terminalLinux;
        }
    }
    async function detectAvailableUnixProfiles(fsProvider, logService, includeDetectedProfiles, configProfiles, defaultProfileName, testPaths, variableResolver, shellEnv) {
        const detectedProfiles = new Map();
        // Add non-quick launch profiles
        if (includeDetectedProfiles && await fsProvider.existsFile("/etc/shells" /* Constants.UnixShellsPath */)) {
            const contents = (await fsProvider.readFile("/etc/shells" /* Constants.UnixShellsPath */)).toString();
            const profiles = ((testPaths || contents.split('\n'))
                .map(e => {
                const index = e.indexOf('#');
                return index === -1 ? e : e.substring(0, index);
            })
                .filter(e => e.trim().length > 0));
            const counts = new Map();
            for (const profile of profiles) {
                let profileName = (0, path_1.basename)(profile);
                let count = counts.get(profileName) || 0;
                count++;
                if (count > 1) {
                    profileName = `${profileName} (${count})`;
                }
                counts.set(profileName, count);
                detectedProfiles.set(profileName, { path: profile, isAutoDetected: true });
            }
        }
        applyConfigProfilesToMap(configProfiles, detectedProfiles);
        return await transformToTerminalProfiles(detectedProfiles.entries(), defaultProfileName, fsProvider, shellEnv, logService, variableResolver);
    }
    function applyConfigProfilesToMap(configProfiles, profilesMap) {
        if (!configProfiles) {
            return;
        }
        for (const [profileName, value] of Object.entries(configProfiles)) {
            if (value === null || typeof value !== 'object' || (!('path' in value) && !('source' in value))) {
                profilesMap.delete(profileName);
            }
            else {
                value.icon = value.icon || profilesMap.get(profileName)?.icon;
                profilesMap.set(profileName, value);
            }
        }
    }
    async function validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected, requiresUnsafePath) {
        if (potentialPaths.length === 0) {
            return Promise.resolve(undefined);
        }
        const path = potentialPaths.shift();
        if (path === '') {
            return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected);
        }
        const isUnsafePath = typeof path !== 'string' && path.isUnsafe;
        const actualPath = typeof path === 'string' ? path : path.path;
        const profile = {
            profileName,
            path: actualPath,
            args,
            env,
            overrideName,
            isAutoDetected,
            isDefault: profileName === defaultProfileName,
            isUnsafePath,
            requiresUnsafePath
        };
        // For non-absolute paths, check if it's available on $PATH
        if ((0, path_1.basename)(actualPath) === actualPath) {
            // The executable isn't an absolute path, try find it on the PATH
            const envPaths = shellEnv.PATH ? shellEnv.PATH.split(path_1.delimiter) : undefined;
            const executable = await (0, terminalEnvironment_1.findExecutable)(actualPath, undefined, envPaths, undefined, fsProvider.existsFile);
            if (!executable) {
                return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args);
            }
            profile.path = executable;
            profile.isFromPath = true;
            return profile;
        }
        const result = await fsProvider.existsFile((0, path_1.normalize)(actualPath));
        if (result) {
            return profile;
        }
        return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL25vZGUvdGVybWluYWxQcm9maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdCaEcsMERBc0NDO0lBN0NELElBQVcsU0FFVjtJQUZELFdBQVcsU0FBUztRQUNuQiwyQ0FBOEIsQ0FBQTtJQUMvQixDQUFDLEVBRlUsU0FBUyxLQUFULFNBQVMsUUFFbkI7SUFFRCxJQUFJLGNBQWtFLENBQUM7SUFDdkUsSUFBSSxvQkFBb0IsR0FBWSxJQUFJLENBQUM7SUFFekMsU0FBZ0IsdUJBQXVCLENBQ3RDLFFBQWlCLEVBQ2pCLGNBQXVCLEVBQ3ZCLHVCQUFnQyxFQUNoQyxvQkFBMkMsRUFDM0MsV0FBK0IsT0FBTyxDQUFDLEdBQUcsRUFDMUMsVUFBd0IsRUFDeEIsVUFBd0IsRUFDeEIsZ0JBQXdELEVBQ3hELG1CQUE4QjtRQUU5QixVQUFVLEdBQUcsVUFBVSxJQUFJO1lBQzFCLFVBQVUsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVU7WUFDekMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUTtTQUMvQixDQUFDO1FBQ0YsSUFBSSxvQkFBUyxFQUFFLENBQUM7WUFDZixPQUFPLDhCQUE4QixDQUNwQyx1QkFBdUIsRUFDdkIsVUFBVSxFQUNWLFFBQVEsRUFDUixVQUFVLEVBQ1Ysb0JBQW9CLENBQUMsUUFBUSw2RUFBa0MsS0FBSyxLQUFLLEVBQ3pFLFFBQVEsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsUUFBUSxnRkFBa0YsRUFDNUssT0FBTyxjQUFjLEtBQUssUUFBUSxD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