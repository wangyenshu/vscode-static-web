/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTitleBarVisibility = exports.TitlebarStyle = exports.TitleBarSetting = exports.WindowMinimumSize = void 0;
    exports.isOpenedAuxiliaryWindow = isOpenedAuxiliaryWindow;
    exports.isWorkspaceToOpen = isWorkspaceToOpen;
    exports.isFolderToOpen = isFolderToOpen;
    exports.isFileToOpen = isFileToOpen;
    exports.getMenuBarVisibility = getMenuBarVisibility;
    exports.hasCustomTitlebar = hasCustomTitlebar;
    exports.hasNativeTitlebar = hasNativeTitlebar;
    exports.getTitleBarStyle = getTitleBarStyle;
    exports.useWindowControlsOverlay = useWindowControlsOverlay;
    exports.useNativeFullScreen = useNativeFullScreen;
    exports.zoomLevelToZoomFactor = zoomLevelToZoomFactor;
    exports.WindowMinimumSize = {
        WIDTH: 400,
        WIDTH_WITH_VERTICAL_PANEL: 600,
        HEIGHT: 270
    };
    function isOpenedAuxiliaryWindow(candidate) {
        return typeof candidate.parentId === 'number';
    }
    function isWorkspaceToOpen(uriToOpen) {
        return !!uriToOpen.workspaceUri;
    }
    function isFolderToOpen(uriToOpen) {
        return !!uriToOpen.folderUri;
    }
    function isFileToOpen(uriToOpen) {
        return !!uriToOpen.fileUri;
    }
    function getMenuBarVisibility(configurationService) {
        const nativeTitleBarEnabled = hasNativeTitlebar(configurationService);
        const menuBarVisibility = configurationService.getValue('window.menuBarVisibility');
        if (menuBarVisibility === 'default' || (nativeTitleBarEnabled && menuBarVisibility === 'compact') || (platform_1.isMacintosh && platform_1.isNative)) {
            return 'classic';
        }
        else {
            return menuBarVisibility;
        }
    }
    var TitleBarSetting;
    (function (TitleBarSetting) {
        TitleBarSetting["TITLE_BAR_STYLE"] = "window.titleBarStyle";
        TitleBarSetting["CUSTOM_TITLE_BAR_VISIBILITY"] = "window.customTitleBarVisibility";
    })(TitleBarSetting || (exports.TitleBarSetting = TitleBarSetting = {}));
    var TitlebarStyle;
    (function (TitlebarStyle) {
        TitlebarStyle["NATIVE"] = "native";
        TitlebarStyle["CUSTOM"] = "custom";
    })(TitlebarStyle || (exports.TitlebarStyle = TitlebarStyle = {}));
    var CustomTitleBarVisibility;
    (function (CustomTitleBarVisibility) {
        CustomTitleBarVisibility["AUTO"] = "auto";
        CustomTitleBarVisibility["WINDOWED"] = "windowed";
        CustomTitleBarVisibility["NEVER"] = "never";
    })(CustomTitleBarVisibility || (exports.CustomTitleBarVisibility = CustomTitleBarVisibility = {}));
    function hasCustomTitlebar(configurationService, titleBarStyle) {
        // Returns if it possible to have a custom title bar in the curren session
        // Does not imply that the title bar is visible
        return true;
    }
    function hasNativeTitlebar(configurationService, titleBarStyle) {
        if (!titleBarStyle) {
            titleBarStyle = getTitleBarStyle(configurationService);
        }
        return titleBarStyle === "native" /* TitlebarStyle.NATIVE */;
    }
    function getTitleBarStyle(configurationService) {
        if (platform_1.isWeb) {
            return "custom" /* TitlebarStyle.CUSTOM */;
        }
        const configuration = configurationService.getValue('window');
        if (configuration) {
            const useNativeTabs = platform_1.isMacintosh && configuration.nativeTabs === true;
            if (useNativeTabs) {
                return "native" /* TitlebarStyle.NATIVE */; // native tabs on sierra do not work with custom title style
            }
            const useSimpleFullScreen = platform_1.isMacintosh && configuration.nativeFullScreen === false;
            if (useSimpleFullScreen) {
                return "native" /* TitlebarStyle.NATIVE */; // simple fullscreen does not work well with custom title style (https://github.com/microsoft/vscode/issues/63291)
            }
            const style = configuration.titleBarStyle;
            if (style === "native" /* TitlebarStyle.NATIVE */ || style === "custom" /* TitlebarStyle.CUSTOM */) {
                return style;
            }
        }
        return platform_1.isLinux ? "native" /* TitlebarStyle.NATIVE */ : "custom" /* TitlebarStyle.CUSTOM */; // default to custom on all macOS and Windows
    }
    function useWindowControlsOverlay(configurationService) {
        if (!platform_1.isWindows || platform_1.isWeb) {
            return false; // only supported on a desktop Windows instance
        }
        if (hasNativeTitlebar(configurationService)) {
            return false; // only supported when title bar is custom
        }
        // Default to true.
        return true;
    }
    function useNativeFullScreen(configurationService) {
        const windowConfig = configurationService.getValue('window');
        if (!windowConfig || typeof windowConfig.nativeFullScreen !== 'boolean') {
            return true; // default
        }
        if (windowConfig.nativeTabs) {
            return true; // https://github.com/electron/electron/issues/16142
        }
        return windowConfig.nativeFullScreen !== false;
    }
    /**
     * According to Electron docs: `scale := 1.2 ^ level`.
     * https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentssetzoomlevellevel
     */
    function zoomLevelToZoomFactor(zoomLevel = 0) {
        return Math.pow(1.2, zoomLevel);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93L2NvbW1vbi93aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUZoRywwREFFQztJQXNCRCw4Q0FFQztJQUVELHdDQUVDO0lBRUQsb0NBRUM7SUFJRCxvREFTQztJQThDRCw4Q0FLQztJQUVELDhDQUtDO0lBRUQsNENBd0JDO0lBRUQsNERBV0M7SUFFRCxrREFXQztJQWtKRCxzREFFQztJQXZYWSxRQUFBLGlCQUFpQixHQUFHO1FBQ2hDLEtBQUssRUFBRSxHQUFHO1FBQ1YseUJBQXlCLEVBQUUsR0FBRztRQUM5QixNQUFNLEVBQUUsR0FBRztLQUNYLENBQUM7SUFrRUYsU0FBZ0IsdUJBQXVCLENBQUMsU0FBcUQ7UUFDNUYsT0FBTyxPQUFRLFNBQW9DLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQztJQUMzRSxDQUFDO0lBc0JELFNBQWdCLGlCQUFpQixDQUFDLFNBQTBCO1FBQzNELE9BQU8sQ0FBQyxDQUFFLFNBQThCLENBQUMsWUFBWSxDQUFDO0lBQ3ZELENBQUM7SUFFRCxTQUFnQixjQUFjLENBQUMsU0FBMEI7UUFDeEQsT0FBTyxDQUFDLENBQUUsU0FBMkIsQ0FBQyxTQUFTLENBQUM7SUFDakQsQ0FBQztJQUVELFNBQWdCLFlBQVksQ0FBQyxTQUEwQjtRQUN0RCxPQUFPLENBQUMsQ0FBRSxTQUF5QixDQUFDLE9BQU8sQ0FBQztJQUM3QyxDQUFDO0lBSUQsU0FBZ0Isb0JBQW9CLENBQUMsb0JBQTJDO1FBQy9FLE1BQU0scUJBQXFCLEdBQUcsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN0RSxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBZ0MsMEJBQTBCLENBQUMsQ0FBQztR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