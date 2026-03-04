/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/platform", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminalProfiles"], function (require, exports, codicons_1, platform_1, nls_1, configurationRegistry_1, platform_2, terminalProfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalIconSchema = exports.terminalColorSchema = void 0;
    exports.registerTerminalPlatformConfiguration = registerTerminalPlatformConfiguration;
    exports.registerTerminalDefaultProfileConfiguration = registerTerminalDefaultProfileConfiguration;
    exports.terminalColorSchema = {
        type: ['string', 'null'],
        enum: [
            'terminal.ansiBlack',
            'terminal.ansiRed',
            'terminal.ansiGreen',
            'terminal.ansiYellow',
            'terminal.ansiBlue',
            'terminal.ansiMagenta',
            'terminal.ansiCyan',
            'terminal.ansiWhite'
        ],
        default: null
    };
    exports.terminalIconSchema = {
        type: 'string',
        enum: Array.from((0, codicons_1.getAllCodicons)(), icon => icon.id),
        markdownEnumDescriptions: Array.from((0, codicons_1.getAllCodicons)(), icon => `$(${icon.id})`),
    };
    const terminalProfileBaseProperties = {
        args: {
            description: (0, nls_1.localize)('terminalProfile.args', 'An optional set of arguments to run the shell executable with.'),
            type: 'array',
            items: {
                type: 'string'
            }
        },
        overrideName: {
            description: (0, nls_1.localize)('terminalProfile.overrideName', 'Whether or not to replace the dynamic terminal title that detects what program is running with the static profile name.'),
            type: 'boolean'
        },
        icon: {
            description: (0, nls_1.localize)('terminalProfile.icon', 'A codicon ID to associate with the terminal icon.'),
            ...exports.terminalIconSchema
        },
        color: {
            description: (0, nls_1.localize)('terminalProfile.color', 'A theme color ID to associate with the terminal icon.'),
            ...exports.terminalColorSchema
        },
        env: {
            markdownDescription: (0, nls_1.localize)('terminalProfile.env', "An object with environment variables that will be added to the terminal profile process. Set to `null` to delete environment variables from the base environment."),
            type: 'object',
            additionalProperties: {
                type: ['string', 'null']
            },
            default: {}
        }
    };
    const terminalProfileSchema = {
        type: 'object',
        required: ['path'],
        properties: {
            path: {
                description: (0, nls_1.localize)('terminalProfile.path', 'A single path to a shell executable or an array of paths that will be used as fallbacks when one fails.'),
                type: ['string', 'array'],
                items: {
                    type: 'string'
                }
            },
            ...terminalProfileBaseProperties
        }
    };
    const terminalAutomationProfileSchema = {
        type: 'object',
        required: ['path'],
        properties: {
            path: {
                description: (0, nls_1.localize)('terminalAutomationProfile.path', 'A single path to a shell executable.'),
                type: ['string'],
                items: {
                    type: 'string'
                }
            },
            ...terminalProfileBaseProperties
        }
    };
    function createTerminalProfileMarkdownDescription(platform) {
        const key = platform === 2 /* Platform.Linux */ ? 'linux' : platform === 1 /* Platform.Mac */ ? 'osx' : 'windows';
        return (0, nls_1.localize)({
            key: 'terminal.integrated.profile',
            comment: ['{0} is the platform, {1} is a code block, {2} and {3} are a link start and end']
        }, "A set of terminal profile customizations for {0} which allows adding, removing or changing how terminals are launched. Profiles are made up of a mandatory path, optional arguments and other presentation options.\n\nTo override an existing profile use its profile name as the key, for example:\n\n{1}\n\n{2}Read more about configuring profiles{3}.", (0, platform_1.PlatformToString)(platform), '```json\n"terminal.integrated.profile.' + key + '": {\n  "bash": null\n}\n```', '[', '](https://code.visualstudio.com/docs/terminal/profiles)');
    }
    const terminalPlatformConfiguration = {
        id: 'terminal',
        order: 100,
        title: (0, nls_1.localize)('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            ["terminal.integrated.automationProfile.linux" /* TerminalSettingId.AutomationProfileLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.automationProfile.linux', "The terminal profile to use on Linux for automation-related terminal usage like tasks and debug."),
                type: ['object', 'null'],
                default: null,
                'anyOf': [
                    { type: 'null' },
                    terminalAutomationProfileSchema
                ],
                defaultSnippets: [
                    {
                        body: {
                            path: '${1}',
                            icon: '${2}'
                        }
                    }
                ]
            },
            ["terminal.integrated.automationProfile.osx" /* TerminalSettingId.AutomationProfileMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.automationProfile.osx', "The terminal profile to use on macOS for automation-related terminal usage like tasks and debug."),
                type: ['object', 'null'],
                default: null,
                'anyOf': [
                    { type: 'null' },
                    terminalAutomationProfileSchema
                ],
                defaultSnippets: [
                    {
                        body: {
                            path: '${1}',
                            icon: '${2}'
                        }
                    }
                ]
            },
            ["terminal.integrated.automationProfile.windows" /* TerminalSettingId.AutomationProfileWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.automationProfile.windows', "The terminal profile to use for automation-related terminal usage like tasks and debug. This setting will currently be ignored if {0} (now deprecated) is set.", '`terminal.integrated.automationShell.windows`'),
                type: ['object', 'null'],
                default: null,
                'anyOf': [
                    { type: 'null' },
                    terminalAutomationProfileSchema
                ],
                defaultSnippets: [
                    {
                        body: {
                            path: '${1}',
                            icon: '${2}'
                        }
                    }
                ]
            },
            ["terminal.integrated.profiles.windows" /* TerminalSettingId.ProfilesWindows */]: {
                restricted: true,
                markdownDescription: createTerminalProfileMarkdownDescription(3 /* Platform.Windows */),
                type: 'object',
                default: {
                    'PowerShell': {
                        source: 'PowerShell',
                        icon: 'terminal-powershell'
                    },
                    'Command Prompt': {
                        path: [
                            '${env:windir}\\Sysnative\\cmd.exe',
                            '${env:windir}\\System32\\cmd.exe'
                        ],
                        args: [],
                        icon: 'terminal-cmd'
                    },
                    'Git Bash': {
                        source: 'Git Bash'
                    }
                },
                additionalProperties: {
                    'anyOf': [
                        {
                            type: 'object',
                            required: ['source'],
                            properties: {
                                source: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsSource', 'A profile source that will auto detect the paths to the shell. Note that non-standard executable locations are not supported and must be created manually in a new profile.'),
                                    enum: ['PowerShell', 'Git Bash']
                                },
                                ...terminalProfileBaseProperties
                            }
                        },
                        {
                            type: 'object',
                            required: ['extensionIdentifier', 'id', 'title'],
                            properties: {
                                extensionIdentifier: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsExtensionIdentifier', 'The extension that contributed this profile.'),
                                    type: 'string'
                                },
                                id: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsExtensionId', 'The id of the extension terminal'),
                                    type: 'string'
                                },
                                title: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsExtensionTitle', 'The name of the extension terminal'),
                                    type: 'string'
                                },
                                ...terminalProfileBaseProperties
                            }
                        },
                        { type: 'null' },
                        terminalProfileSchema
                    ]
                }
            },
            ["terminal.integrated.profiles.osx" /* TerminalSettingId.ProfilesMacOs */]: {
                restricted: true,
                markdownDescription: createTerminalProfileMarkdownDescription(1 /* Platform.Mac */),
                type: 'object',
                default: {
                    'bash': {
                        path: 'bash',
                        args: ['-l'],
                        icon: 'terminal-bash'
                    },
                    'zsh': {
                        path: 'zsh',
                        args: ['-l']
                    },
                    'fish': {
                        path: 'fish',
                        args: ['-l']
                    },
                    'tmux': {
                        path: 'tmux',
                        icon: 'terminal-tmux'
                    },
                    'pwsh': {
                        path: 'pwsh',
                        icon: 'terminal-powershell'
                    }
                },
                additionalProperties: {
                    'anyOf': [
                        {
                            type: 'object',
                            required: ['extensionIdentifier', 'id', 'title'],
                            properties: {
                                extensionIdentifier: {
                                    description: (0, nls_1.localize)('terminalProfile.osxExtensionIdentifier', 'The extension that contributed this profile.'),
                                    type: 'string'
                                },
                                id: {
                                    description: (0, nls_1.localize)('terminalProfile.osxExtensionId', 'The id of the extension terminal'),
                                    type: 'string'
                                },
                                title: {
                                    description: (0, nls_1.localize)('terminalProfile.osxExtensionTitle', 'The name of the extension terminal'),
                                    type: 'string'
                                },
                                ...terminalProfileBaseProperties
                            }
                        },
                        { type: 'null' },
                        terminalProfileSchema
                    ]
                }
            },
            ["terminal.integrated.profiles.linux" /* TerminalSettingId.ProfilesLinux */]: {
                restricted: true,
                markdownDescription: createTerminalProfileMarkdownDescription(2 /* Platform.Linux */),
                type: 'object',
                default: {
                    'bash': {
                        path: 'bash',
                        icon: 'terminal-bash'
                    },
                    'zsh': {
                        path: 'zsh'
                    },
                    'fish': {
                        path: 'fish'
                    },
                    'tmux': {
                        path: 'tmux',
                        icon: 'terminal-tmux'
                    },
                    'pwsh': {
                        path: 'pwsh',
                        icon: 'terminal-powershell'
                    }
                },
                additionalProperties: {
                    'anyOf': [
                        {
                            type: 'object',
                            required: ['extensionIdentifier', 'id', 'title'],
                            properties: {
                                extensionIdentifier: {
                                    description: (0, nls_1.localize)('terminalProfile.linuxExtensionIdentifier', 'The extension that contributed this profile.'),
                                    type: 'string'
                                },
                                id: {
                                    description: (0, nls_1.localize)('terminalProfile.linuxExtensionId', 'The id of the extension terminal'),
                                    type: 'string'
                                },
                                title: {
                                    description: (0, nls_1.localize)('terminalProfile.linuxExtensionTitle', 'The name of the extension terminal'),
                                    type: 'string'
                                },
                                ...terminalProfileBaseProperties
                            }
                        },
                        { type: 'null' },
                        terminalProfileSchema
                    ]
                }
            },
            ["terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */]: {
                description: (0, nls_1.localize)('terminal.integrated.useWslProfiles', 'Controls whether or not WSL distros are shown in the terminal dropdown'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.inheritEnv" /* TerminalSettingId.InheritEnv */]: {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('terminal.integrated.inheritEnv', "Whether new shells should inherit their environment from VS Code, which may source a login shell to ensure $PATH and other development variables are initialized. This has no effect on Windows."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */]: {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.persistentSessionScrollback', "Controls the maximum amount of lines that will be restored when reconnecting to a persistent terminal session. Increasing this will restore more lines of scrollback at the cost of more memory and increase the time it takes to connect to terminals on start up. This setting requires a restart to take effect and should be set to a value less than or equal to `#terminal.integrated.scrollback#`."),
                type: 'number',
                default: 100
            },
            ["terminal.integrated.showLinkHover" /* TerminalSettingId.ShowLinkHover */]: {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('terminal.integrated.showLinkHover', "Whether to show hovers for links in the terminal output."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.confirmIgnoreProcesses', "A set of process names to ignore when using the {0} setting.", '`#terminal.integrated.confirmOnKill#`'),
                type: 'array',
                items: {
                    type: 'string',
                    uniqueItems: true
                },
                default: [
                    // Popular prompt programs, these should not count as child processes
                    'starship',
                    'oh-my-posh',
                    // Git bash may runs a subprocess of itself (bin\bash.exe -> usr\bin\bash.exe)
                    'bash',
                    'zsh',
                ]
            }
        }
    };
    /**
     * Registers terminal configurations required by shared process and remote server.
     */
    function registerTerminalPlatformConfiguration() {
        platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(terminalPlatformConfiguration);
        registerTerminalDefaultProfileConfiguration();
    }
    let defaultProfilesConfiguration;
    function registerTerminalDefaultProfileConfiguration(detectedProfiles, extensionContributedProfiles) {
        const registry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
        let profileEnum;
        if (detectedProfiles) {
            profileEnum = (0, terminalProfiles_1.createProfileSchemaEnums)(detectedProfiles?.profiles, extensionContributedProfiles);
        }
        const oldDefaultProfilesConfiguration = defaultProfilesConfiguration;
        defaultProfilesConfiguration = {
            id: 'terminal',
            order: 100,
            title: (0, nls_1.localize)('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
            type: 'object',
            properties: {
                ["terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */]: {
                    restricted: true,
                    markdownDescription: (0, nls_1.localize)('terminal.integrated.defaultProfile.linux', "The default terminal profile on Linux."),
                    type: ['string', 'null'],
                    default: null,
                    enum: detectedProfiles?.os === 3 /* OperatingSystem.Linux */ ? profileEnum?.values : undefined,
                    markdownEnumDescriptions: detectedProfiles?.os === 3 /* OperatingSystem.Linux */ ? profileEnum?.markdownDescriptions : undefined
                },
                ["terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */]: {
                    restricted: true,
                    markdownDescription: (0, nls_1.localize)('terminal.integrated.defaultProfile.osx', "The default terminal profile on macOS."),
                    type: ['string', 'null'],
                    default: null,
                    enum: detectedProfiles?.os === 2 /* OperatingSystem.Macintosh */ ? profileEnum?.values : undefined,
                    markdownEnumDescriptions: detectedProfiles?.os === 2 /* OperatingSystem.Macintosh */ ? profileEnum?.markdownDescriptions : undefined
                },
                ["terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */]: {
                    restricted: true,
                    markdownDescription: (0, nls_1.localize)('terminal.integrated.defaultProfile.windows', "The default terminal profile on Windows."),
                    type: ['string', 'null'],
                    default: null,
                    enum: detectedProfiles?.os === 1 /* OperatingSystem.Windows */ ? profileEnum?.values : undefined,
                    markdownEnumDescriptions: detectedProfiles?.os === 1 /* OperatingSystem.Windows */ ? profileEnum?.markdownDescriptions : undefined
                },
            }
        };
        registry.updateConfigurations({ add: [defaultProfilesConfiguration], remove: oldDefaultProfilesConfiguration ? [oldDefaultProfilesConfiguration] : [] });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQbGF0Zm9ybUNvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vdGVybWluYWxQbGF0Zm9ybUNvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcVhoRyxzRkFHQztJQUdELGtHQXdDQztJQXhaWSxRQUFBLG1CQUFtQixHQUFnQjtRQUMvQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1FBQ3hCLElBQUksRUFBRTtZQUNMLG9CQUFvQjtZQUNwQixrQkFBa0I7WUFDbEIsb0JBQW9CO1lBQ3BCLHFCQUFxQjtZQUNyQixtQkFBbUI7WUFDbkIsc0JBQXNCO1lBQ3RCLG1CQUFtQjtZQUNuQixvQkFBb0I7U0FDcEI7UUFDRCxPQUFPLEVBQUUsSUFBSTtLQUNiLENBQUM7SUFFVyxRQUFBLGtCQUFrQixHQUFnQjtRQUM5QyxJQUFJLEVBQUUsUUFBUTtRQUNkLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEseUJBQWMsR0FBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNuRCx3QkFBd0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEseUJBQWMsR0FBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUM7S0FDL0UsQ0FBQztJQUVGLE1BQU0sNkJBQTZCLEdBQW1CO1FBQ3JELElBQUksRUFBRTtZQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxnRUFBZ0UsQ0FBQztZQUMvRyxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFB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