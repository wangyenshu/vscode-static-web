/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/layout/browser/layoutService", "vs/base/common/platform", "vs/base/browser/window", "vs/platform/window/common/window", "vs/base/browser/browser"], function (require, exports, instantiation_1, layoutService_1, platform_1, window_1, window_2, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelOpensMaximizedOptions = exports.Position = exports.EditorActionsLocation = exports.EditorTabsMode = exports.ActivityBarPosition = exports.LayoutSettings = exports.ZenModeSettings = exports.Parts = exports.IWorkbenchLayoutService = void 0;
    exports.positionToString = positionToString;
    exports.positionFromString = positionFromString;
    exports.panelOpensMaximizedFromString = panelOpensMaximizedFromString;
    exports.shouldShowCustomTitleBar = shouldShowCustomTitleBar;
    exports.IWorkbenchLayoutService = (0, instantiation_1.refineServiceDecorator)(layoutService_1.ILayoutService);
    var Parts;
    (function (Parts) {
        Parts["TITLEBAR_PART"] = "workbench.parts.titlebar";
        Parts["BANNER_PART"] = "workbench.parts.banner";
        Parts["ACTIVITYBAR_PART"] = "workbench.parts.activitybar";
        Parts["SIDEBAR_PART"] = "workbench.parts.sidebar";
        Parts["PANEL_PART"] = "workbench.parts.panel";
        Parts["AUXILIARYBAR_PART"] = "workbench.parts.auxiliarybar";
        Parts["EDITOR_PART"] = "workbench.parts.editor";
        Parts["STATUSBAR_PART"] = "workbench.parts.statusbar";
    })(Parts || (exports.Parts = Parts = {}));
    var ZenModeSettings;
    (function (ZenModeSettings) {
        ZenModeSettings["SHOW_TABS"] = "zenMode.showTabs";
        ZenModeSettings["HIDE_LINENUMBERS"] = "zenMode.hideLineNumbers";
        ZenModeSettings["HIDE_STATUSBAR"] = "zenMode.hideStatusBar";
        ZenModeSettings["HIDE_ACTIVITYBAR"] = "zenMode.hideActivityBar";
        ZenModeSettings["CENTER_LAYOUT"] = "zenMode.centerLayout";
        ZenModeSettings["FULLSCREEN"] = "zenMode.fullScreen";
        ZenModeSettings["RESTORE"] = "zenMode.restore";
        ZenModeSettings["SILENT_NOTIFICATIONS"] = "zenMode.silentNotifications";
    })(ZenModeSettings || (exports.ZenModeSettings = ZenModeSettings = {}));
    var LayoutSettings;
    (function (LayoutSettings) {
        LayoutSettings["ACTIVITY_BAR_LOCATION"] = "workbench.activityBar.location";
        LayoutSettings["EDITOR_TABS_MODE"] = "workbench.editor.showTabs";
        LayoutSettings["EDITOR_ACTIONS_LOCATION"] = "workbench.editor.editorActionsLocation";
        LayoutSettings["COMMAND_CENTER"] = "window.commandCenter";
        LayoutSettings["LAYOUT_ACTIONS"] = "workbench.layoutControl.enabled";
    })(LayoutSettings || (exports.LayoutSettings = LayoutSettings = {}));
    var ActivityBarPosition;
    (function (ActivityBarPosition) {
        ActivityBarPosition["DEFAULT"] = "default";
        ActivityBarPosition["TOP"] = "top";
        ActivityBarPosition["BOTTOM"] = "bottom";
        ActivityBarPosition["HIDDEN"] = "hidden";
    })(ActivityBarPosition || (exports.ActivityBarPosition = ActivityBarPosition = {}));
    var EditorTabsMode;
    (function (EditorTabsMode) {
        EditorTabsMode["MULTIPLE"] = "multiple";
        EditorTabsMode["SINGLE"] = "single";
        EditorTabsMode["NONE"] = "none";
    })(EditorTabsMode || (exports.EditorTabsMode = EditorTabsMode = {}));
    var EditorActionsLocation;
    (function (EditorActionsLocation) {
        EditorActionsLocation["DEFAULT"] = "default";
        EditorActionsLocation["TITLEBAR"] = "titleBar";
        EditorActionsLocation["HIDDEN"] = "hidden";
    })(EditorActionsLocation || (exports.EditorActionsLocation = EditorActionsLocation = {}));
    var Position;
    (function (Position) {
        Position[Position["LEFT"] = 0] = "LEFT";
        Position[Position["RIGHT"] = 1] = "RIGHT";
        Position[Position["BOTTOM"] = 2] = "BOTTOM";
    })(Position || (exports.Position = Position = {}));
    var PanelOpensMaximizedOptions;
    (function (PanelOpensMaximizedOptions) {
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["ALWAYS"] = 0] = "ALWAYS";
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["NEVER"] = 1] = "NEVER";
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["REMEMBER_LAST"] = 2] = "REMEMBER_LAST";
    })(PanelOpensMaximizedOptions || (exports.PanelOpensMaximizedOptions = PanelOpensMaximizedOptions = {}));
    function positionToString(position) {
        switch (position) {
            case 0 /* Position.LEFT */: return 'left';
            case 1 /* Position.RIGHT */: return 'right';
            case 2 /* Position.BOTTOM */: return 'bottom';
            default: return 'bottom';
        }
    }
    const positionsByString = {
        [positionToString(0 /* Position.LEFT */)]: 0 /* Position.LEFT */,
        [positionToString(1 /* Position.RIGHT */)]: 1 /* Position.RIGHT */,
        [positionToString(2 /* Position.BOTTOM */)]: 2 /* Position.BOTTOM */
    };
    function positionFromString(str) {
        return positionsByString[str];
    }
    function panelOpensMaximizedSettingToString(setting) {
        switch (setting) {
            case 0 /* PanelOpensMaximizedOptions.ALWAYS */: return 'always';
            case 1 /* PanelOpensMaximizedOptions.NEVER */: return 'never';
            case 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */: return 'preserve';
            default: return 'preserve';
        }
    }
    const panelOpensMaximizedByString = {
        [panelOpensMaximizedSettingToString(0 /* PanelOpensMaximizedOptions.ALWAYS */)]: 0 /* PanelOpensMaximizedOptions.ALWAYS */,
        [panelOpensMaximizedSettingToString(1 /* PanelOpensMaximizedOptions.NEVER */)]: 1 /* PanelOpensMaximizedOptions.NEVER */,
        [panelOpensMaximizedSettingToString(2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */)]: 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */
    };
    function panelOpensMaximizedFromString(str) {
        return panelOpensMaximizedByString[str];
    }
    function shouldShowCustomTitleBar(configurationService, window, menuBarToggled) {
        if (!(0, window_2.hasCustomTitlebar)(configurationService)) {
            return false;
        }
        const inFullscreen = (0, browser_1.isFullscreen)(window);
        const nativeTitleBarEnabled = (0, window_2.hasNativeTitlebar)(configurationService);
        if (!platform_1.isWeb) {
            const showCustomTitleBar = configurationService.getValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */);
            if (showCustomTitleBar === "never" /* CustomTitleBarVisibility.NEVER */ && nativeTitleBarEnabled || showCustomTitleBar === "windowed" /* CustomTitleBarVisibility.WINDOWED */ && inFullscreen) {
                return false;
            }
        }
        if (!isTitleBarEmpty(configurationService)) {
            return true;
        }
        // Hide custom title bar when native title bar enabled and custom title bar is empty
        if (nativeTitleBarEnabled) {
            return false;
        }
        // macOS desktop does not need a title bar when full screen
        if (platform_1.isMacintosh && platform_1.isNative) {
            return !inFullscreen;
        }
        // non-fullscreen native must show the title bar
        if (platform_1.isNative && !inFullscreen) {
            return true;
        }
        // if WCO is visible, we have to show the title bar
        if ((0, browser_1.isWCOEnabled)() && !inFullscreen) {
            return true;
        }
        // remaining behavior is based on menubar visibility
        const menuBarVisibility = !(0, window_1.isAuxiliaryWindow)(window) ? (0, window_2.getMenuBarVisibility)(configurationService) : 'hidden';
        switch (menuBarVisibility) {
            case 'classic':
                return !inFullscreen || !!menuBarToggled;
            case 'compact':
            case 'hidden':
                return false;
            case 'toggle':
                return !!menuBarToggled;
            case 'visible':
                return true;
            default:
                return platform_1.isWeb ? false : !inFullscreen || !!menuBarToggled;
        }
    }
    function isTitleBarEmpty(configurationService) {
        // with the command center enabled, we should always show
        if (configurationService.getValue("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */)) {
            return false;
        }
        // with the activity bar on top, we should always show
        const activityBarPosition = configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
        if (activityBarPosition === "top" /* ActivityBarPosition.TOP */ || activityBarPosition === "bottom" /* ActivityBarPosition.BOTTOM */) {
            return false;
        }
        // with the editor actions on top, we should always show
        const editorActionsLocation = configurationService.getValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */);
        const editorTabsMode = configurationService.getValue("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */);
        if (editorActionsLocation === "titleBar" /* EditorActionsLocation.TITLEBAR */ || editorActionsLocation === "default" /* EditorActionsLocation.DEFAULT */ && editorTabsMode === "none" /* EditorTabsMode.NONE */) {
            return false;
        }
        // with the layout actions on top, we should always show
        if (configurationService.getValue("workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */)) {
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9sYXlvdXQvYnJvd3Nlci9sYXlvdXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdGaEcsNENBT0M7SUFRRCxnREFFQztJQWlCRCxzRUFFQztJQWtNRCw0REF1REM7SUE5VlksUUFBQSx1QkFBdUIsR0FBRyxJQUFBLHNDQUFzQixFQUEwQyw4QkFBYyxDQUFDLENBQUM7SUFFdkgsSUFBa0IsS0FTakI7SUFURCxXQUFrQixLQUFLO1FBQ3RCLG1EQUEwQyxDQUFBO1FBQzFDLCtDQUFzQyxDQUFBO1FBQ3RDLHlEQUFnRCxDQUFBO1FBQ2hELGlEQUF3QyxDQUFBO1FBQ3hDLDZDQUFvQyxDQUFBO1FBQ3BDLDJEQUFrRCxDQUFBO1FBQ2xELCtDQUFzQyxDQUFBO1FBQ3RDLHFEQUE0QyxDQUFBO0lBQzdDLENBQUMsRUFUaUIsS0FBSyxxQkFBTCxLQUFLLFFBU3RCO0lBRUQsSUFBa0IsZUFTakI7SUFURCxXQUFrQixlQUFlO1FBQ2hDLGlEQUE4QixDQUFBO1FBQzlCLCtEQUE0QyxDQUFBO1FBQzVDLDJEQUF3QyxDQUFBO1FBQ3hDLCtEQUE0QyxDQUFBO1FBQzVDLHlEQUFzQyxDQUFBO1FBQ3RDLG9EQUFpQyxDQUFBO1FBQ2pDLDhDQUEyQixDQUFBO1FBQzNCLHVFQUFvRCxDQUFBO0lBQ3JELENBQUMsRUFUaUIsZUFBZSwrQkFBZixlQUFlLFFBU2hDO0lBRUQsSUFBa0IsY0FNakI7SUFORCxXQUFrQixjQUFjO1FBQy9CLDBFQUF3RCxDQUFBO1FBQ3hELGdFQUE4QyxDQUFBO1FBQzlDLG9GQUFrRSxDQUFBO1FBQ2xFLHlEQUF1QyxDQUFBO1FBQ3ZDLG9FQUFrRCxDQUFBO0lBQ25ELENBQUMsRUFO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