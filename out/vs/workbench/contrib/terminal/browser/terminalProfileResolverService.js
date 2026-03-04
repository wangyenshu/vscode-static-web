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
define(["require", "exports", "vs/base/common/network", "vs/base/common/process", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/base/common/platform", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/path", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/decorators", "vs/base/common/themables", "vs/base/common/uri", "vs/base/common/objects", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, network_1, process_1, configuration_1, workspace_1, configurationResolver_1, history_1, platform_1, terminal_1, terminal_2, path, codicons_1, iconRegistry_1, remoteAgentService_1, decorators_1, themables_1, uri_1, objects_1, terminalProfiles_1, terminal_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserTerminalProfileResolverService = exports.BaseTerminalProfileResolverService = void 0;
    const generatedProfileName = 'Generated';
    /*
     * Resolves terminal shell launch config and terminal profiles for the given operating system,
     * environment, and user configuration.
     */
    class BaseTerminalProfileResolverService {
        get defaultProfileName() { return this._defaultProfileName; }
        constructor(_context, _configurationService, _configurationResolverService, _historyService, _logService, _terminalProfileService, _workspaceContextService, _remoteAgentService) {
            this._context = _context;
            this._configurationService = _configurationService;
            this._configurationResolverService = _configurationResolverService;
            this._historyService = _historyService;
            this._logService = _logService;
            this._terminalProfileService = _terminalProfileService;
            this._workspaceContextService = _workspaceContextService;
            this._remoteAgentService = _remoteAgentService;
            this._iconRegistry = (0, iconRegistry_1.getIconRegistry)();
            if (this._remoteAgentService.getConnection()) {
                this._remoteAgentService.getEnvironment().then(env => this._primaryBackendOs = env?.os || platform_1.OS);
            }
            else {
                this._primaryBackendOs = platform_1.OS;
            }
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */)) {
                    this._refreshDefaultProfileName();
                }
            });
            this._terminalProfileService.onDidChangeAvailableProfiles(() => this._refreshDefaultProfileName());
        }
        async _refreshDefaultProfileName() {
            if (this._primaryBackendOs) {
                this._defaultProfileName = (await this.getDefaultProfile({
                    remoteAuthority: this._remoteAgentService.getConnection()?.remoteAuthority,
                    os: this._primaryBackendOs
                }))?.profileName;
            }
        }
        resolveIcon(shellLaunchConfig, os) {
            if (shellLaunchConfig.icon) {
                shellLaunchConfig.icon = this._getCustomIcon(shellLaunchConfig.icon) || this.getDefaultIcon();
                return;
            }
            if (shellLaunchConfig.customPtyImplementation) {
                shellLaunchConfig.icon = this.getDefaultIcon();
                return;
            }
            if (shellLaunchConfig.executable) {
                return;
            }
            const defaultProfile = this._getUnresolvedRealDefaultProfile(os);
            if (defaultProfile) {
                shellLaunchConfig.icon = defaultProfile.icon;
            }
            if (!shellLaunchConfig.icon) {
                shellLaunchConfig.icon = this.getDefaultIcon();
            }
        }
        getDefaultIcon(resource) {
            return this._iconRegistry.getIcon(this._configurationService.getValue("terminal.integrated.tabs.defaultIcon" /* TerminalSettingId.TabsDefaultIcon */, { resource })) || codicons_1.Codicon.terminal;
        }
        async resolveShellLaunchConfig(shellLaunchConfig, options) {
            // Resolve the shell and shell args
            let resolvedProfile;
            if (shellLaunchConfig.executable) {
                resolvedProfile = await this._resolveProfile({
                    path: shellLaunchConfig.executable,
                    args: shellLaunchConfig.args,
                    profileName: generatedProfileName,
                    isDefault: false
                }, options);
            }
            else {
                resolvedProfile = await this.getDefaultProfile(options);
            }
            shellLaunchConfig.executable = resolvedProfile.path;
            shellLaunchConfig.args = resolvedProfile.args;
            if (resolvedProfile.env) {
                if (shellLaunchConfig.env) {
                    shellLaunchConfig.env = { ...shellLaunchConfig.env, ...resolvedProfile.env };
                }
                else {
                    shellLaunchConfig.env = resolvedProfile.env;
                }
            }
            // Verify the icon is valid, and fallback correctly to the generic terminal id if there is
            // an issue
            const resource = shellLaunchConfig === undefined || typeof shellLaunchConfig.cwd === 'string' ? undefined : shellLaunchConfig.cwd;
            shellLaunchConfig.icon = this._getCustomIcon(shellLaunchConfig.icon)
                || this._getCustomIcon(resolvedProfile.icon)
                || this.getDefaultIcon(resource);
            // Override the name if specified
            if (resolvedProfile.overrideName) {
                shellLaunchConfig.name = resolvedProfile.profileName;
            }
            // Apply the color
            shellLaunchConfig.color = shellLaunchConfig.color
                || resolvedProfile.color
                || this._configurationService.getValue("terminal.integrated.tabs.defaultColor" /* TerminalSettingId.TabsDefaultColor */, { resource });
            // Resolve useShellEnvironment based on the setting if it's not set
            if (shellLaunchConfig.useShellEnvironment === undefined) {
                shellLaunchConfig.useShellEnvironment = this._configurationService.getValue("terminal.integrated.inheritEnv" /* TerminalSettingId.InheritEnv */);
            }
        }
        async getDefaultShell(options) {
            return (await this.getDefaultProfile(options)).path;
        }
        async getDefaultShellArgs(options) {
            return (await this.getDefaultProfile(options)).args || [];
        }
        async getDefaultProfile(options) {
            return this._resolveProfile(await this._getUnresolvedDefaultProfile(options), options);
        }
        getEnvironment(remoteAuthority) {
            return this._context.getEnvironment(remoteAuthority);
        }
        _getCustomIcon(icon) {
            if (!icon) {
                return undefined;
            }
            if (typeof icon === 'string') {
                return themables_1.ThemeIcon.fromId(icon);
            }
            if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                return icon;
            }
            if (uri_1.URI.isUri(icon) || (0, terminalProfiles_1.isUriComponents)(icon)) {
                return uri_1.URI.revive(icon);
            }
            if (typeof icon === 'object' && 'light' in icon && 'dark' in icon) {
                const castedIcon = icon;
                if ((uri_1.URI.isUri(castedIcon.light) || (0, terminalProfiles_1.isUriComponents)(castedIcon.light)) && (uri_1.URI.isUri(castedIcon.dark) || (0, terminalProfiles_1.isUriComponents)(castedIcon.dark))) {
                    return { light: uri_1.URI.revive(castedIcon.light), dark: uri_1.URI.revive(castedIcon.dark) };
                }
            }
            return undefined;
        }
        async _getUnresolvedDefaultProfile(options) {
            // If automation shell is allowed, prefer that
            if (options.allowAutomationShell) {
                const automationShellProfile = this._getUnresolvedAutomationShellProfile(options);
                if (automationShellProfile) {
                    return automationShellProfile;
                }
            }
            // Return the real default profile if it exists and is valid, wait for profiles to be ready
            // if the window just opened
            await this._terminalProfileService.profilesReady;
            const defaultProfile = this._getUnresolvedRealDefaultProfile(options.os);
            if (defaultProfile) {
                return this._setIconForAutomation(options, defaultProfile);
            }
            // If there is no real default profile, create a fallback default profile based on the shell
            // and shellArgs settings in addition to the current environment.
            return this._setIconForAutomation(options, await this._getUnresolvedFallbackDefaultProfile(options));
        }
        _setIconForAutomation(options, profile) {
            if (options.allowAutomationShell) {
                const profileClone = (0, objects_1.deepClone)(profile);
                profileClone.icon = codicons_1.Codicon.tools;
                return profileClone;
            }
            return profile;
        }
        _getUnresolvedRealDefaultProfile(os) {
            return this._terminalProfileService.getDefaultProfile(os);
        }
        async _getUnresolvedFallbackDefaultProfile(options) {
            const executable = await this._context.getDefaultSystemShell(options.remoteAuthority, options.os);
            // Try select an existing profile to fallback to, based on the default system shell, only do
            // this when it is NOT a local terminal in a remote window where the front and back end OS
            // differs (eg. Windows -> WSL, Mac -> Linux)
            if (options.os === platform_1.OS) {
                let existingProfile = this._terminalProfileService.availableProfiles.find(e => path.parse(e.path).name === path.parse(executable).name);
                if (existingProfile) {
                    if (options.allowAutomationShell) {
                        existingProfile = (0, objects_1.deepClone)(existingProfile);
                        existingProfile.icon = codicons_1.Codicon.tools;
                    }
                    return existingProfile;
                }
            }
            // Finally fallback to a generated profile
            let args;
            if (options.os === 2 /* OperatingSystem.Macintosh */ && path.parse(executable).name.match(/(zsh|bash)/)) {
                // macOS should launch a login shell by default
                args = ['--login'];
            }
            else {
                // Resolve undefined to []
                args = [];
            }
            const icon = this._guessProfileIcon(executable);
            return {
                profileName: generatedProfileName,
                path: executable,
                args,
                icon,
                isDefault: false
            };
        }
        _getUnresolvedAutomationShellProfile(options) {
            const automationProfile = this._configurationService.getValue(`terminal.integrated.automationProfile.${this._getOsKey(options.os)}`);
            if (this._isValidAutomationProfile(automationProfile, options.os)) {
                automationProfile.icon = this._getCustomIcon(automationProfile.icon) || codicons_1.Codicon.tools;
                return automationProfile;
            }
            return undefined;
        }
        async _resolveProfile(profile, options) {
            const env = await this._context.getEnvironment(options.remoteAuthority);
            if (options.os === 1 /* OperatingSystem.Windows */) {
                // Change Sysnative to System32 if the OS is Windows but NOT WoW64. It's
                // safe to assume that this was used by accident as Sysnative does not
                // exist and will break the terminal in non-WoW64 environments.
                const isWoW64 = !!env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
                const windir = env.windir;
                if (!isWoW64 && windir) {
                    const sysnativePath = path.join(windir, 'Sysnative').replace(/\//g, '\\').toLowerCase();
                    if (profile.path && profile.path.toLowerCase().indexOf(sysnativePath) === 0) {
                        profile.path = path.join(windir, 'System32', profile.path.substr(sysnativePath.length + 1));
                    }
                }
                // Convert / to \ on Windows for convenience
                if (profile.path) {
                    profile.path = profile.path.replace(/\//g, '\\');
                }
            }
            // Resolve path variables
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(options.remoteAuthority ? network_1.Schemas.vscodeRemote : network_1.Schemas.file);
            const lastActiveWorkspace = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            profile.path = await this._resolveVariables(profile.path, env, lastActiveWorkspace);
            // Resolve args variables
            if (profile.args) {
                if (typeof profile.args === 'string') {
                    profile.args = await this._resolveVariables(profile.args, env, lastActiveWorkspace);
                }
                else {
                    profile.args = await Promise.all(profile.args.map(arg => this._resolveVariables(arg, env, lastActiveWorkspace)));
                }
            }
            return profile;
        }
        async _resolveVariables(value, env, lastActiveWorkspace) {
            try {
                value = await this._configurationResolverService.resolveWithEnvironment(env, lastActiveWorkspace, value);
            }
            catch (e) {
                this._logService.error(`Could not resolve shell`, e);
            }
            return value;
        }
        _getOsKey(os) {
            switch (os) {
                case 3 /* OperatingSystem.Linux */: return 'linux';
                case 2 /* OperatingSystem.Macintosh */: return 'osx';
                case 1 /* OperatingSystem.Windows */: return 'windows';
            }
        }
        _guessProfileIcon(shell) {
            const file = path.parse(shell).name;
            switch (file) {
                case 'bash':
                    return codicons_1.Codicon.terminalBash;
                case 'pwsh':
                case 'powershell':
                    return codicons_1.Codicon.terminalPowershell;
                case 'tmux':
                    return codicons_1.Codicon.terminalTmux;
                case 'cmd':
                    return codicons_1.Codicon.terminalCmd;
                default:
                    return undefined;
            }
        }
        _isValidAutomationProfile(profile, os) {
            if (profile === null || profile === undefined || typeof profile !== 'object') {
                return false;
            }
            if ('path' in profile && typeof profile.path === 'string') {
                return true;
            }
            return false;
        }
    }
    exports.BaseTerminalProfileResolverService = BaseTerminalProfileResolverService;
    __decorate([
        (0, decorators_1.debounce)(200)
    ], BaseTerminalProfileResolverService.prototype, "_refreshDefaultProfileName", null);
    let BrowserTerminalProfileResolverService = class BrowserTerminalProfileResolverService extends BaseTerminalProfileResolverService {
        constructor(configurationResolverService, configurationService, historyService, logService, terminalInstanceService, terminalProfileService, workspaceContextService, remoteAgentService) {
            super({
                getDefaultSystemShell: async (remoteAuthority, os) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!remoteAuthority || !backend) {
                        // Just return basic values, this is only for serverless web and wouldn't be used
                        return os === 1 /* OperatingSystem.Windows */ ? 'pwsh' : 'bash';
                    }
                    return backend.getDefaultSystemShell(os);
                },
                getEnvironment: async (remoteAuthority) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!remoteAuthority || !backend) {
                        return process_1.env;
                    }
                    return backend.getEnvironment();
                }
            }, configurationService, configurationResolverService, historyService, logService, terminalProfileService, workspaceContextService, remoteAgentService);
        }
    };
    exports.BrowserTerminalProfileResolverService = BrowserTerminalProfileResolverService;
    exports.BrowserTerminalProfileResolverService = BrowserTerminalProfileResolverService = __decorate([
        __param(0, configurationResolver_1.IConfigurationResolverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, history_1.IHistoryService),
        __param(3, terminal_1.ITerminalLogService),
        __param(4, terminal_3.ITerminalInstanceService),
        __param(5, terminal_2.ITerminalProfileService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, remoteAgentService_1.IRemoteAgentService)
    ], BrowserTerminalProfileResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFByb2ZpbGVSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJoRyxNQUFNLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztJQUV6Qzs7O09BR0c7SUFDSCxNQUFzQixrQ0FBa0M7UUFRdkQsSUFBSSxrQkFBa0IsS0FBeUIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBRWpGLFlBQ2tCLFFBQWlDLEVBQ2pDLHFCQUE0QyxFQUM1Qyw2QkFBNEQsRUFDNUQsZUFBZ0MsRUFDaEMsV0FBZ0MsRUFDaEMsdUJBQWdELEVBQ2hELHdCQUFrRCxFQUNsRCxtQkFBd0M7WUFQeEMsYUFBUSxHQUFSLFFBQVEsQ0FBeUI7WUFDakMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBQzVELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQyxnQkFBVyxHQUFYLFdBQVcsQ0FBcUI7WUFDaEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUNoRCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ2xELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFiekMsa0JBQWEsR0FBa0IsSUFBQSw4QkFBZSxHQUFFLENBQUM7WUFlakUsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMs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