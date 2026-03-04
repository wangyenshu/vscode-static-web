/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/themes/common/themeConfiguration", "vs/base/common/platform"], function (require, exports, nls_1, platform_1, configurationRegistry_1, workbenchThemeService_1, themeConfiguration_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        properties: {
            [workbenchThemeService_1.ThemeSettings.SYSTEM_COLOR_THEME]: {
                type: 'string',
                enum: ['default', 'auto', 'light', 'dark'],
                enumDescriptions: [
                    (0, nls_1.localize)('window.systemColorTheme.default', "Native widget colors match the system colors."),
                    (0, nls_1.localize)('window.systemColorTheme.auto', "Use light native widget colors for light color themes and dark for dark color themes."),
                    (0, nls_1.localize)('window.systemColorTheme.light', "Use light native widget colors."),
                    (0, nls_1.localize)('window.systemColorTheme.dark', "Use dark native widget colors."),
                ],
                markdownDescription: (0, nls_1.localize)({ key: 'window.systemColorTheme', comment: ['{0} and {1} will become links to other settings.'] }, "Set the color mode for native UI elements such as native dialogs, menus and title bar. Even if your OS is configured in light color mode, you can select a dark system color theme for the window. You can also configure to automatically adjust based on the {0} setting.\n\nNote: This setting is ignored when {1} is enabled.", (0, themeConfiguration_1.formatSettingAsLink)(workbenchThemeService_1.ThemeSettings.COLOR_THEME), (0, themeConfiguration_1.formatSettingAsLink)(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)),
                default: 'default',
                included: !platform_2.isLinux,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                tags: [themeConfiguration_1.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvZWxlY3Ryb24tc2FuZGJveC90aGVtZXMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3pHLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDO1FBQzNDLFVBQVUsRUFBRTtZQUNYLENBQUMscUNBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO2dCQUNuQyxJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7Z0JBQzFDLGdCQUFnQixFQUFFO29CQUNqQixJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSwrQ0FBK0MsQ0FBQztvQkFDNUYsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsdUZBQXVGLENBQUM7b0JBQ2pJLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLGlDQUFpQyxDQUFDO29CQUM1RSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxnQ0FBZ0MsQ0FBQztpQkFDMUU7Z0JBQ0QsbUJBQW1CLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUseUJBQXlCLEVBQUUsT0FBTyxFQUFFLENBQUMsa0RBQWtELENBQUMsRUFBRSxFQUFFLG1VQUFtVSxFQUFFLElBQUEsd0NBQW1CLEVBQUMscUNBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFBLHdDQUFtQixFQUFDLHFDQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDN2lCLE9BQU8sRUFBRSxTQUFTO2dCQUNsQixRQUFRLEVBQUUsQ0FBQyxrQkFBTztnQkFDbEIsS0FBSyx3Q0FBZ0M7Z0JBQ3JDLElBQUksRUFBRSxDQUFDLDJEQUFzQyxDQUFDO2FBQzlDO1NBQ0Q7S0FDRCxDQUFDLENBQUMifQ==