/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform", "vs/workbench/electron-sandbox/actions/developerActions", "vs/workbench/electron-sandbox/actions/windowActions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkeys", "vs/platform/native/common/native", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/electron-sandbox/actions/installActions", "vs/workbench/common/contextkeys", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/workbench/electron-sandbox/window", "vs/base/browser/dom", "vs/workbench/common/configuration", "vs/platform/window/electron-sandbox/window"], function (require, exports, platform_1, nls_1, actions_1, configurationRegistry_1, platform_2, developerActions_1, windowActions_1, contextkey_1, keybindingsRegistry_1, commands_1, contextkeys_1, native_1, jsonContributionRegistry_1, installActions_1, contextkeys_2, telemetry_1, configuration_1, window_1, dom_1, configuration_2, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Actions
    (function registerActions() {
        // Actions: Zoom
        (0, actions_1.registerAction2)(windowActions_1.ZoomInAction);
        (0, actions_1.registerAction2)(windowActions_1.ZoomOutAction);
        (0, actions_1.registerAction2)(windowActions_1.ZoomResetAction);
        // Actions: Window
        (0, actions_1.registerAction2)(windowActions_1.SwitchWindowAction);
        (0, actions_1.registerAction2)(windowActions_1.QuickSwitchWindowAction);
        (0, actions_1.registerAction2)(windowActions_1.CloseWindowAction);
        if (platform_2.isMacintosh) {
            // macOS: behave like other native apps that have documents
            // but can run without a document opened and allow to close
            // the window when the last document is closed
            // (https://github.com/microsoft/vscode/issues/126042)
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: windowActions_1.CloseWindowAction.ID,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.EditorsVisibleContext.toNegated(), contextkeys_2.SingleEditorGroupsContext),
                primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */
            });
        }
        // Actions: Install Shell Script (macOS only)
        if (platform_2.isMacintosh) {
            (0, actions_1.registerAction2)(installActions_1.InstallShellScriptAction);
            (0, actions_1.registerAction2)(installActions_1.UninstallShellScriptAction);
        }
        // Quit
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'workbench.action.quit',
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            async handler(accessor) {
                const nativeHostService = accessor.get(native_1.INativeHostService);
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
                if (confirmBeforeClose === 'always' || (confirmBeforeClose === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed)) {
                    const confirmed = await window_1.NativeWindow.confirmOnShutdown(accessor, 2 /* ShutdownReason.QUIT */);
                    if (!confirmed) {
                        return; // quit prevented by user
                    }
                }
                nativeHostService.quit();
            },
            when: undefined,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */ },
            linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */ }
        });
        // Actions: macOS Native Tabs
        if (platform_2.isMacintosh) {
            for (const command of [
                { handler: windowActions_1.NewWindowTabHandler, id: 'workbench.action.newWindowTab', title: (0, nls_1.localize2)('newTab', 'New Window Tab') },
                { handler: windowActions_1.ShowPreviousWindowTabHandler, id: 'workbench.action.showPreviousWindowTab', title: (0, nls_1.localize2)('showPreviousTab', 'Show Previous Window Tab') },
                { handler: windowActions_1.ShowNextWindowTabHandler, id: 'workbench.action.showNextWindowTab', title: (0, nls_1.localize2)('showNextWindowTab', 'Show Next Window Tab') },
                { handler: windowActions_1.MoveWindowTabToNewWindowHandler, id: 'workbench.action.moveWindowTabToNewWindow', title: (0, nls_1.localize2)('moveWindowTabToNewWindow', 'Move Window Tab to New Window') },
                { handler: windowActions_1.MergeWindowTabsHandlerHandler, id: 'workbench.action.mergeAllWindowTabs', title: (0, nls_1.localize2)('mergeAllWindowTabs', 'Merge All Windows') },
                { handler: windowActions_1.ToggleWindowTabsBarHandler, id: 'workbench.action.toggleWindowTabsBar', title: (0, nls_1.localize2)('toggleWindowTabsBar', 'Toggle Window Tabs Bar') }
            ]) {
                commands_1.CommandsRegistry.registerCommand(command.id, command.handler);
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                    command,
                    when: contextkey_1.ContextKeyExpr.equals('config.window.nativeTabs', true)
                });
            }
        }
        // Actions: Developer
        (0, actions_1.registerAction2)(developerActions_1.ReloadWindowWithExtensionsDisabledAction);
        (0, actions_1.registerAction2)(developerActions_1.ConfigureRuntimeArgumentsAction);
        (0, actions_1.registerAction2)(developerActions_1.ToggleDevToolsAction);
        (0, actions_1.registerAction2)(developerActions_1.OpenUserDataFolderAction);
    })();
    // Menu
    (function registerMenu() {
        // Quit
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
            group: 'z_Exit',
            command: {
                id: 'workbench.action.quit',
                title: (0, nls_1.localize)({ key: 'miExit', comment: ['&& denotes a mnemonic'] }, "E&&xit")
            },
            order: 1,
            when: contextkeys_1.IsMacContext.toNegated()
        });
    })();
    // Configuration
    (function registerConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        // Application
        registry.registerConfiguration({
            ...configuration_2.applicationConfigurationNodeBase,
            'properties': {
                'application.shellEnvironmentResolutionTimeout': {
                    'type': 'number',
                    'default': 10,
                    'minimum': 1,
                    'maximum': 120,
                    'included': !platform_2.isWindows,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('application.shellEnvironmentResolutionTimeout', "Controls the timeout in seconds before giving up resolving the shell environment when the application is not already launched from a terminal. See our [documentation](https://go.microsoft.com/fwlink/?linkid=2149667) for more information.")
                }
            }
        });
        // Window
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': (0, nls_1.localize)('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.confirmSaveUntitledWorkspace': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('confirmSaveUntitledWorkspace', "Controls whether a confirmation dialog shows asking to save or discard an opened untitled workspace in the window when switching to another workspace. Disabling the confirmation dialog will always discard the untitled workspace."),
                },
                'window.openWithoutArgumentsInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openWithoutArgumentsInNewWindow.on', "Open a new empty window."),
                        (0, nls_1.localize)('window.openWithoutArgumentsInNewWindow.off', "Focus the last active running instance.")
                    ],
                    'default': platform_2.isMacintosh ? 'off' : 'on',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('openWithoutArgumentsInNewWindow', "Controls whether a new empty window should open when starting a second instance without arguments or if the last running instance should get focus.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.restoreWindows': {
                    'type': 'string',
                    'enum': ['preserve', 'all', 'folders', 'one', 'none'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.reopenFolders.preserve', "Always reopen all windows. If a folder or workspace is opened (e.g. from the command line) it opens as a new window unless it was opened before. If files are opened they will open in one of the restored windows."),
                        (0, nls_1.localize)('window.reopenFolders.all', "Reopen all windows unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.folders', "Reopen all windows that had folders or workspaces opened unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.one', "Reopen the last active window unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.none', "Never reopen a window. Unless a folder or workspace is opened (e.g. from the command line), an empty window will appear.")
                    ],
                    'default': 'all',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('restoreWindows', "Controls how windows are being reopened after starting for the first time. This setting has no effect when the application is already running.")
                },
                'window.restoreFullscreen': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('restoreFullscreen', "Controls whether a window should restore to full screen mode if it was exited in full screen mode.")
                },
                'window.zoomLevel': {
                    'type': 'number',
                    'default': 0,
                    'minimum': window_2.MIN_ZOOM_LEVEL,
                    'maximum': window_2.MAX_ZOOM_LEVEL,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'zoomLevel' }, "Adjust the default zoom level for all windows. Each increment above `0` (e.g. `1`) or below (e.g. `-1`) represents zooming `20%` larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity. See {0} for configuring if the 'Zoom In' and 'Zoom Out' commands apply the zoom level to all windows or only the active window.", '`#window.zoomPerWindow#`'),
                    ignoreSync: true,
                    tags: ['accessibility']
                },
                'window.zoomPerWindow': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'zoomPerWindow' }, "Controls if the 'Zoom In' and 'Zoom Out' commands apply the zoom level to all windows or only the active window. See {0} for configuring a default zoom level for all windows.", '`#window.zoomLevel#`'),
                    tags: ['accessibility']
                },
                'window.newWindowDimensions': {
                    'type': 'string',
                    'enum': ['default', 'inherit', 'offset', 'maximized', 'fullscreen'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.newWindowDimensions.default', "Open new windows in the center of the screen."),
                        (0, nls_1.localize)('window.newWindowDimensions.inherit', "Open new windows with same dimension as last active one."),
                        (0, nls_1.localize)('window.newWindowDimensions.offset', "Open new windows with same dimension as last active one with an offset position."),
                        (0, nls_1.localize)('window.newWindowDimensions.maximized', "Open new windows maximized."),
                        (0, nls_1.localize)('window.newWindowDimensions.fullscreen', "Open new windows in full screen mode.")
                    ],
                    'default': 'default',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('newWindowDimensions', "Controls the dimensions of opening a new window when at least one window is already opened. Note that this setting does not have an impact on the first window that is opened. The first window will always restore the size and location as you left it before closing.")
                },
                'window.closeWhenEmpty': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('closeWhenEmpty', "Controls whether closing the last editor should also close the window. This setting only applies for windows that do not show folders.")
                },
                'window.doubleClickIconToClose': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('window.doubleClickIconToClose', "If enabled, this setting will close the window when the application icon in the title bar is double-clicked. The window will not be able to be dragged by the icon. This setting is effective only if `#window.titleBarStyle#` is set to `custom`.")
                },
                'window.titleBarStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': platform_2.isLinux ? 'native' : 'custom',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('titleBarStyle', "Adjust the appearance of the window title bar to be native by the OS or custom. On Linux and Windows, this setting also affects the application and context menu appearances. Changes require a full restart to apply."),
                },
                'window.customTitleBarVisibility': {
                    'type': 'string',
                    'enum': ['auto', 'windowed', 'never'],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)(`window.customTitleBarVisibility.auto`, "Automatically changes custom title bar visibility."),
                        (0, nls_1.localize)(`window.customTitleBarVisibility.windowed`, "Hide custom titlebar in full screen. When not in full screen, automatically change custom title bar visibility."),
                        (0, nls_1.localize)(`window.customTitleBarVisibility.never`, "Hide custom titlebar when `#window.titleBarStyle#` is set to `native`."),
                    ],
                    'default': platform_2.isLinux ? 'never' : 'auto',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('window.customTitleBarVisibility', "Adjust when the custom title bar should be shown. The custom title bar can be hidden when in full screen mode with `windowed`. The custom title bar can only be hidden in none full screen mode with `never` when `#window.titleBarStyle#` is set to `native`."),
                },
                'window.dialogStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': 'native',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('dialogStyle', "Adjust the appearance of dialog windows.")
                },
                'window.nativeTabs': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('window.nativeTabs', "Enables macOS Sierra window tabs. Note that changes require a full restart to apply and that native tabs will disable a custom title bar style if configured."),
                    'included': platform_2.isMacintosh,
                },
                'window.nativeFullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('window.nativeFullScreen', "Controls if native full-screen should be used on macOS. Disable this option to prevent macOS from creating a new space when going full-screen."),
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'included': platform_2.isMacintosh
                },
                'window.clickThroughInactive': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('window.clickThroughInactive', "If enabled, clicking on an inactive window will both activate the window and trigger the element under the mouse if it is clickable. If disabled, clicking anywhere on an inactive window will activate it only and a second click is required on the element."),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Telemetry
        registry.registerConfiguration({
            'id': 'telemetry',
            'order': 110,
            title: (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
            'type': 'object',
            'properties': {
                'telemetry.enableCrashReporter': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('telemetry.enableCrashReporting', "Enable crash reports to be collected. This helps us improve stability. \nThis option requires restart to take effect."),
                    'default': true,
                    'tags': ['usesOnlineServices', 'telemetry'],
                    'markdownDeprecationMessage': (0, nls_1.localize)('enableCrashReporterDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated due to being combined into the {0} setting.", `\`#${telemetry_1.TELEMETRY_SETTING_ID}#\``),
                }
            }
        });
        // Keybinding
        registry.registerConfiguration({
            'id': 'keyboard',
            'order': 15,
            'type': 'object',
            'title': (0, nls_1.localize)('keyboardConfigurationTitle', "Keyboard"),
            'properties': {
                'keyboard.touchbar.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('touchbar.enabled', "Enables the macOS touchbar buttons on the keyboard if available."),
                    'included': platform_2.isMacintosh
                },
                'keyboard.touchbar.ignored': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'default': [],
                    'markdownDescription': (0, nls_1.localize)('touchbar.ignored', 'A set of identifiers for entries in the touchbar that should not show up (for example `workbench.action.navigateBack`).'),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Security
        registry.registerConfiguration({
            ...configuration_2.securityConfigurationNodeBase,
            'properties': {
                'security.promptForLocalFileProtocolHandling': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)('security.promptForLocalFileProtocolHandling', 'If enabled, a dialog will ask for confirmation whenever a local file or workspace is about to open through a protocol handler.'),
                    'scope': 1 /* ConfigurationScope.APPLICATION */
                },
                'security.promptForRemoteFileProtocolHandling': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)('security.promptForRemoteFileProtocolHandling', 'If enabled, a dialog will ask for confirmation whenever a remote file or workspace is about to open through a protocol handler.'),
                    'scope': 1 /* ConfigurationScope.APPLICATION */
                }
            }
        });
    })();
    // JSON Schemas
    (function registerJSONSchemas() {
        const argvDefinitionFileSchemaId = 'vscode://schemas/argv';
        const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        const schema = {
            id: argvDefinitionFileSchemaId,
            allowComments: true,
            allowTrailingCommas: true,
            description: 'VSCode static command line definition file',
            type: 'object',
            additionalProperties: false,
            properties: {
                locale: {
                    type: 'string',
                    description: (0, nls_1.localize)('argv.locale', 'The display Language to use. Picking a different language requires the associated language pack to be installed.')
                },
                'disable-hardware-acceleration': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.disableHardwareAcceleration', 'Disables hardware acceleration. ONLY change this option if you encounter graphic issues.')
                },
                'force-color-profile': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('argv.forceColorProfile', 'Allows to override the color profile to use. If you experience colors appear badly, try to set this to `srgb` and restart.')
                },
                'enable-crash-reporter': {
                    type: 'boolean',
                    markdownDescription: (0, nls_1.localize)('argv.enableCrashReporter', 'Allows to disable crash reporting, should restart the app if the value is changed.')
                },
                'crash-reporter-id': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('argv.crashReporterId', 'Unique id used for correlating crash reports sent from this app instance.')
                },
                'enable-proposed-api': {
                    type: 'array',
                    description: (0, nls_1.localize)('argv.enebleProposedApi', "Enable proposed APIs for a list of extension ids (such as \`vscode.git\`). Proposed APIs are unstable and subject to breaking without warning at any time. This should only be set for extension development and testing purposes."),
                    items: {
                        type: 'string'
                    }
                },
                'log-level': {
                    type: ['string', 'array'],
                    description: (0, nls_1.localize)('argv.logLevel', "Log level to use. Default is 'info'. Allowed values are 'error', 'warn', 'info', 'debug', 'trace', 'off'.")
                },
                'disable-chromium-sandbox': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.disableChromiumSandbox', "Disables the Chromium sandbox. This is useful when running VS Code as elevated on Linux and running under Applocker on Windows.")
                },
                'use-inmemory-secretstorage': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.useInMemorySecretStorage', "Ensures that an in-memory store will be used for secret storage instead of using the OS's credential store. This is often used when running VS Code extension tests or when you're experiencing difficulties with the credential store.")
                }
            }
        };
        if (platform_2.isLinux) {
            schema.properties['force-renderer-accessibility'] = {
                type: 'boolean',
                description: (0, nls_1.localize)('argv.force-renderer-accessibility', 'Forces the renderer to be accessible. ONLY change this if you are using a screen reader on Linux. On other platforms the renderer will automatically be accessible. This flag is automatically set if you have editor.accessibilitySupport: on.'),
            };
            schema.properties['password-store'] = {
                type: 'string',
                description: (0, nls_1.localize)('argv.passwordStore', "Configures the backend used to store secrets on Linux. This argument is ignored on Windows & macOS.")
            };
        }
        jsonRegistry.registerSchema(argvDefinitionFileSchemaId, schema);
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVza3RvcC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvZWxlY3Ryb24tc2FuZGJveC9kZXNrdG9wLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTRCaEcsVUFBVTtJQUNWLENBQUMsU0FBUyxlQUFlO1FBRXhCLGdCQUFnQjtRQUNoQixJQUFBLHlCQUFlLEVBQUMsNEJBQVksQ0FBQyxDQUFDO1FBQzlCLElBQUEseUJBQWUsRUFBQyw2QkFBYSxDQUFDLENBQUM7UUFDL0IsSUFBQSx5QkFBZSxFQUFDLCtCQUFlLENBQUMsQ0FBQztRQUVqQyxrQkFBa0I7UUFDbEIsSUFBQSx5QkFBZSxFQUFDLGtDQUFrQixDQUFDLENBQUM7UUFDcEMsSUFBQSx5QkFBZSxFQUFDLHVDQUF1QixDQUFDLENBQUM7UUFDekMsSUFBQSx5QkFBZSxFQUFDLGlDQUFpQixDQUFDLENBQUM7UUFFbkMsSUFBSSxzQkFBVyxFQUFFLENBQUM7WUFDakIsMkRBQTJEO1lBQzNELDJEQUEyRDtZQUMzRCw4Q0FBOEM7WUFDOUMsc0RBQXNEO1lBQ3RELHlDQUFtQixDQUFDLHNCQUFzQixDQUFDO2dCQUMxQyxFQUFFLEVBQUUsaUNBQWlCLENBQUMsRUFBRTtnQkFDeEIsTUFBTSw2Q0FBbUM7Z0JBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxtQ0FBcUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSx1Q0FBeUIsQ0FBQztnQkFDdEYsT0FBTyxFQUFFLGlEQUE2QjthQUN0QyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsNkNBQTZDO1FBQzdDLElBQUksc0JBQVcsRUFBRSxDQUFDO1lBQ2pCLElBQUEseUJBQWUsRUFBQyx5Q0FBd0IsQ0FBQyxDQUFDO1lBQzFDLElBQUEseUJB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