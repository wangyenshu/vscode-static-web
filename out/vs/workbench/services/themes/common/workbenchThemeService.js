/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/types"], function (require, exports, instantiation_1, themeService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionData = exports.COLOR_THEME_LIGHT_INITIAL_COLORS = exports.COLOR_THEME_DARK_INITIAL_COLORS = exports.ThemeSettingDefaults = exports.ThemeSettings = exports.themeScopeRegex = exports.THEME_SCOPE_WILDCARD = exports.THEME_SCOPE_CLOSE_PAREN = exports.THEME_SCOPE_OPEN_PAREN = exports.VS_HC_LIGHT_THEME = exports.VS_HC_THEME = exports.VS_DARK_THEME = exports.VS_LIGHT_THEME = exports.IWorkbenchThemeService = void 0;
    exports.IWorkbenchThemeService = (0, instantiation_1.refineServiceDecorator)(themeService_1.IThemeService);
    exports.VS_LIGHT_THEME = 'vs';
    exports.VS_DARK_THEME = 'vs-dark';
    exports.VS_HC_THEME = 'hc-black';
    exports.VS_HC_LIGHT_THEME = 'hc-light';
    exports.THEME_SCOPE_OPEN_PAREN = '[';
    exports.THEME_SCOPE_CLOSE_PAREN = ']';
    exports.THEME_SCOPE_WILDCARD = '*';
    exports.themeScopeRegex = /\[(.+?)\]/g;
    var ThemeSettings;
    (function (ThemeSettings) {
        ThemeSettings["COLOR_THEME"] = "workbench.colorTheme";
        ThemeSettings["FILE_ICON_THEME"] = "workbench.iconTheme";
        ThemeSettings["PRODUCT_ICON_THEME"] = "workbench.productIconTheme";
        ThemeSettings["COLOR_CUSTOMIZATIONS"] = "workbench.colorCustomizations";
        ThemeSettings["TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.tokenColorCustomizations";
        ThemeSettings["SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.semanticTokenColorCustomizations";
        ThemeSettings["PREFERRED_DARK_THEME"] = "workbench.preferredDarkColorTheme";
        ThemeSettings["PREFERRED_LIGHT_THEME"] = "workbench.preferredLightColorTheme";
        ThemeSettings["PREFERRED_HC_DARK_THEME"] = "workbench.preferredHighContrastColorTheme";
        ThemeSettings["PREFERRED_HC_LIGHT_THEME"] = "workbench.preferredHighContrastLightColorTheme";
        ThemeSettings["DETECT_COLOR_SCHEME"] = "window.autoDetectColorScheme";
        ThemeSettings["DETECT_HC"] = "window.autoDetectHighContrast";
        ThemeSettings["SYSTEM_COLOR_THEME"] = "window.systemColorTheme";
    })(ThemeSettings || (exports.ThemeSettings = ThemeSettings = {}));
    var ThemeSettingDefaults;
    (function (ThemeSettingDefaults) {
        ThemeSettingDefaults["COLOR_THEME_DARK"] = "Default Dark Modern";
        ThemeSettingDefaults["COLOR_THEME_LIGHT"] = "Default Light Modern";
        ThemeSettingDefaults["COLOR_THEME_HC_DARK"] = "Default High Contrast";
        ThemeSettingDefaults["COLOR_THEME_HC_LIGHT"] = "Default High Contrast Light";
        ThemeSettingDefaults["COLOR_THEME_DARK_OLD"] = "Default Dark+";
        ThemeSettingDefaults["COLOR_THEME_LIGHT_OLD"] = "Default Light+";
        ThemeSettingDefaults["FILE_ICON_THEME"] = "vs-seti";
        ThemeSettingDefaults["PRODUCT_ICON_THEME"] = "Default";
    })(ThemeSettingDefaults || (exports.ThemeSettingDefaults = ThemeSettingDefaults = {}));
    exports.COLOR_THEME_DARK_INITIAL_COLORS = {
        'activityBar.background': '#181818',
        'statusBar.background': '#181818',
        'statusBar.noFolderBackground': '#1f1f1f',
    };
    exports.COLOR_THEME_LIGHT_INITIAL_COLORS = {
        'activityBar.background': '#f8f8f8',
        'statusBar.background': '#f8f8f8',
        'statusBar.noFolderBackground': '#f8f8f8'
    };
    var ExtensionData;
    (function (ExtensionData) {
        function toJSONObject(d) {
            return d && { _extensionId: d.extensionId, _extensionIsBuiltin: d.extensionIsBuiltin, _extensionName: d.extensionName, _extensionPublisher: d.extensionPublisher };
        }
        ExtensionData.toJSONObject = toJSONObject;
        function fromJSONObject(o) {
            if (o && (0, types_1.isString)(o._extensionId) && (0, types_1.isBoolean)(o._extensionIsBuiltin) && (0, types_1.isString)(o._extensionName) && (0, types_1.isString)(o._extensionPublisher)) {
                return { extensionId: o._extensionId, extensionIsBuiltin: o._extensionIsBuiltin, extensionName: o._extensionName, extensionPublisher: o._extensionPublisher };
            }
            return undefined;
        }
        ExtensionData.fromJSONObject = fromJSONObject;
        function fromName(publisher, name, isBuiltin = false) {
            return { extensionPublisher: publisher, extensionId: `${publisher}.${name}`, extensionName: name, extensionIsBuiltin: isBuiltin };
        }
        ExtensionData.fromName = fromName;
    })(ExtensionData || (exports.ExtensionData = ExtensionData = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGhlbWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9jb21tb24vd29ya2JlbmNoVGhlbWVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVduRixRQUFBLHNCQUFzQixHQUFHLElBQUEsc0NBQXNCLEVBQXdDLDRCQUFhLENBQUMsQ0FBQztJQUV0RyxRQUFBLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDdEIsUUFBQSxhQUFhLEdBQUcsU0FBUyxDQUFDO0lBQzFCLFFBQUEsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUN6QixRQUFBLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztJQUUvQixRQUFBLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztJQUM3QixRQUFBLHVCQUF1QixHQUFHLEdBQUcsQ0FBQztJQUM5QixRQUFBLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztJQUUzQixRQUFBLGVBQWUsR0FBRyxZQUFZLENBQUM7SUFFNUMsSUFBWSxhQWdCWDtJQWhCRCxXQUFZLGFBQWE7UUFDeEIscURBQW9DLENBQUE7UUFDcEMsd0RBQXVDLENBQUE7UUFDdkMsa0VBQWlELENBQUE7UUFDakQsdUVBQXNELENBQUE7UUFDdEQsK0VBQThELENBQUE7UUFDOUQsZ0dBQStFLENBQUE7UUFFL0UsMkVBQTBELENBQUE7UUFDMUQsNkVBQTRELENBQUE7UUFDNUQsc0ZBQXFFLENBQUE7UUFDckUsNEZBQTJFLENBQUE7UUFDM0UscUVBQW9ELENBQUE7UUFDcEQsNERBQTJDLENBQUE7UUFFM0MsK0RBQThDLENBQUE7SUFDL0MsQ0FBQyxFQWhCVyxhQUFhLDZCQUFiLGFBQWEsUUFnQnhCO0lBRUQsSUFBWSxvQkFXWDtJQVhELFdBQVksb0JBQW9CO1FBQy9CLGdFQUF3QyxDQUFBO1FBQ3hDLGtFQUEwQyxDQUFBO1FBQzFDLHFFQUE2QyxDQUFBO1FBQzdDLDRFQUFvRCxDQUFBO1FBRXBELDhEQUFzQyxDQUFBO1FBQ3RDLGdFQUF3QyxDQUFBO1FBRXhDLG1EQUEyQixDQUFBO1FBQzNCLHNEQUE4QixDQUFBO0lBQy9CLENBQUMsRUFYVyxvQkFBb0Isb0NBQXBCLG9CQUFvQixRQVcvQjtJQUVZLFFBQUEsK0JBQStCLEdBQUc7UUFDOUMsd0JBQXdCLEVBQUUsU0FBUztRQUNuQyxzQkFBc0IsRUFBRSxTQUFTO1FBQ2pDLDhCQUE4QixFQUFFLFNBQVM7S0FDekMsQ0FBQztJQUVXLFFBQUEsZ0NBQWdDLEdBQUc7UUFDL0Msd0JBQXdCLEVBQUUsU0FBUztRQUNuQyxzQkFBc0IsRUFBRSxTQUFTO1FBQ2pDLDhCQUE4QixFQUFFLFNBQVM7S0FDekMsQ0FBQztJQXlKRixJQUFpQixhQUFhLENBYTdCO0lBYkQsV0FBaUIsYUFBYTtRQUM3QixTQUFnQixZQUFZLENBQUMsQ0FBNEI7WUFDeEQsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDcEssQ0FBQztRQUZlLDBCQUFZLGVBRTNCLENBQUE7UUFDRCxTQUFnQixjQUFjLENBQUMsQ0FBTTtZQUNwQyxJQUFJLENBQUMsSUFBSSxJQUFBLGdCQUFRLEVBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUEsaUJBQVMsRUFBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxJQUFBLGdCQUFRLEVBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLElBQUEsZ0JBQVEsRUFBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO2dCQUN4SSxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsY0FBYyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQy9KLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBTGUsNEJBQWMsaUJBSzdCLENBQUE7UUFDRCxTQUFnQixRQUFRLENBQUMsU0FBaUIsRUFBRSxJQUFZLEVBQUUsU0FBUyxHQUFHLEtBQUs7WUFDMUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxTQUFTLElBQUksSUFBSSxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUNuSSxDQUFDO1FBRmUsc0JBQVEsV0FFdkIsQ0FBQTtJQUNGLENBQUMsRUFiZ0IsYUFBYSw2QkFBYixhQUFhLFFBYTdCIn0=