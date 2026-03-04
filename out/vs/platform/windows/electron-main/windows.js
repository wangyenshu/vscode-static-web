/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/window/electron-main/window", "vs/platform/window/common/window", "vs/platform/theme/electron-main/themeMainService", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/base/common/path", "vs/base/common/color"], function (require, exports, electron_1, platform_1, instantiation_1, window_1, window_2, themeMainService_1, productService_1, configuration_1, environmentMainService_1, path_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowStateValidator = exports.OpenContext = exports.IWindowsMainService = void 0;
    exports.defaultBrowserWindowOptions = defaultBrowserWindowOptions;
    exports.getLastFocused = getLastFocused;
    exports.IWindowsMainService = (0, instantiation_1.createDecorator)('windowsMainService');
    var OpenContext;
    (function (OpenContext) {
        // opening when running from the command line
        OpenContext[OpenContext["CLI"] = 0] = "CLI";
        // macOS only: opening from the dock (also when opening files to a running instance from desktop)
        OpenContext[OpenContext["DOCK"] = 1] = "DOCK";
        // opening from the main application window
        OpenContext[OpenContext["MENU"] = 2] = "MENU";
        // opening from a file or folder dialog
        OpenContext[OpenContext["DIALOG"] = 3] = "DIALOG";
        // opening from the OS's UI
        OpenContext[OpenContext["DESKTOP"] = 4] = "DESKTOP";
        // opening through the API
        OpenContext[OpenContext["API"] = 5] = "API";
    })(OpenContext || (exports.OpenContext = OpenContext = {}));
    function defaultBrowserWindowOptions(accessor, windowState, webPreferences) {
        const themeMainService = accessor.get(themeMainService_1.IThemeMainService);
        const productService = accessor.get(productService_1.IProductService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const environmentMainService = accessor.get(environmentMainService_1.IEnvironmentMainService);
        const windowSettings = configurationService.getValue('window');
        const options = {
            backgroundColor: themeMainService.getBackgroundColor(),
            minWidth: window_2.WindowMinimumSize.WIDTH,
            minHeight: window_2.WindowMinimumSize.HEIGHT,
            title: productService.nameLong,
            show: windowState.mode !== 0 /* WindowMode.Maximized */ && windowState.mode !== 3 /* WindowMode.Fullscreen */, // reduce flicker by showing later
            x: windowState.x,
            y: windowState.y,
            width: windowState.width,
            height: windowState.height,
            webPreferences: {
                ...webPreferences,
                enableWebSQL: false,
                spellcheck: false,
                zoomFactor: (0, window_2.zoomLevelToZoomFactor)(windowState.zoomLevel ?? windowSettings?.zoomLevel),
                autoplayPolicy: 'user-gesture-required',
                // Enable experimental css highlight api https://chromestatus.com/feature/5436441440026624
                // Refs https://github.com/microsoft/vscode/issues/140098
                enableBlinkFeatures: 'HighlightAPI',
                sandbox: true
            },
            experimentalDarkMode: true
        };
        if (platform_1.isLinux) {
            options.icon = (0, path_1.join)(environmentMainService.appRoot, 'resources/linux/code.png'); // always on Linux
        }
        else if (platform_1.isWindows && !environmentMainService.isBuilt) {
            options.icon = (0, path_1.join)(environmentMainService.appRoot, 'resources/win32/code_150x150.png'); // only when running out of sources on Windows
        }
        if (platform_1.isMacintosh) {
            options.acceptFirstMouse = true; // enabled by default
            if (windowSettings?.clickThroughInactive === false) {
                options.acceptFirstMouse = false;
            }
        }
        if (platform_1.isMacintosh && !(0, window_2.useNativeFullScreen)(configurationService)) {
            options.fullscreenable = false; // enables simple fullscreen mode
        }
        const useNativeTabs = platform_1.isMacintosh && windowSettings?.nativeTabs === true;
        if (useNativeTabs) {
            options.tabbingIdentifier = productService.nameShort; // this opts in to sierra tabs
        }
        const hideNativeTitleBar = !(0, window_2.hasNativeTitlebar)(configurationService);
        if (hideNativeTitleBar) {
            options.titleBarStyle = 'hidden';
            if (!platform_1.isMacintosh) {
                options.frame = false;
            }
            if ((0, window_2.useWindowControlsOverlay)(configurationService)) {
                // This logic will not perfectly guess the right colors
                // to use on initialization, but prefer to keep things
                // simple as it is temporary and not noticeable
                const titleBarColor = themeMainService.getWindowSplash()?.colorInfo.titleBarBackground ?? themeMainService.getBackgroundColor();
                const symbolColor = color_1.Color.fromHex(titleBarColor).isDarker() ? '#FFFFFF' : '#000000';
                options.titleBarOverlay = {
                    height: 29, // the smallest size of the title bar on windows accounting for the border on windows 11
                    color: titleBarColor,
                    symbolColor
                };
            }
        }
        return options;
    }
    function getLastFocused(windows) {
        let lastFocusedWindow = undefined;
        let maxLastFocusTime = Number.MIN_VALUE;
        for (const window of windows) {
            if (window.lastFocusTime > maxLastFocusTime) {
                maxLastFocusTime = window.lastFocusTime;
                lastFocusedWindow = window;
            }
        }
        return lastFocusedWindow;
    }
    var WindowStateValidator;
    (function (WindowStateValidator) {
        function validateWindowState(logService, state, displays = electron_1.screen.getAllDisplays()) {
            logService.trace(`window#validateWindowState: validating window state on ${displays.length} display(s)`, state);
            if (typeof state.x !== 'number' ||
                typeof state.y !== 'number' ||
                typeof state.width !== 'number' ||
                typeof state.height !== 'number') {
                logService.trace('window#validateWindowState: unexpected type of state values');
                return undefined;
            }
            if (state.width <= 0 || state.height <= 0) {
                logService.trace('window#validateWindowState: unexpected negative values');
                return undefined;
            }
            // Single Monitor: be strict about x/y positioning
            // macOS & Linux: these OS seem to be pretty good in ensuring that a window is never outside of it's bounds.
            // Windows: it is possible to have a window with a size that makes it fall out of the window. our strategy
            //          is to try as much as possible to keep the window in the monitor bounds. we are not as strict as
            //          macOS and Linux and allow the window to exceed the monitor bounds as long as the window is still
            //          some pixels (128) visible on the screen for the user to drag it back.
            if (displays.length === 1) {
                const displayWorkingArea = getWorkingArea(displays[0]);
                logService.trace('window#validateWindowState: single monitor working area', displayWorkingArea);
                if (displayWorkingArea) {
                    function ensureStateInDisplayWorkingArea() {
                        if (!state || typeof state.x !== 'number' || typeof state.y !== 'number' || !displayWorkingArea) {
                            return;
                        }
                        if (state.x < displayWorkingArea.x) {
                            // prevent window from falling out of the screen to the left
                            state.x = displayWorkingArea.x;
                        }
                        if (state.y < displayWorkingArea.y) {
                            // prevent window from falling out of the screen to the top
                            state.y = displayWorkingArea.y;
                        }
                    }
                    // ensure state is not outside display working area (top, left)
                    ensureStateInDisplayWorkingArea();
                    if (state.width > displayWorkingArea.width) {
                        // prevent window from exceeding display bounds width
                        state.width = displayWorkingArea.width;
                    }
                    if (state.height > displayWorkingArea.height) {
                        // prevent window from exceeding display bounds height
                        state.height = displayWorkingArea.height;
                    }
                    if (state.x > (displayWorkingArea.x + displayWorkingArea.width - 128)) {
                        // prevent window from falling out of the screen to the right with
                        // 128px margin by positioning the window to the far right edge of
                        // the screen
                        state.x = displayWorkingArea.x + displayWorkingArea.width - state.width;
                    }
                    if (state.y > (displayWorkingArea.y + displayWorkingArea.height - 128)) {
                        // prevent window from falling out of the screen to the bottom with
                        // 128px margin by positioning the window to the far bottom edge of
                        // the screen
                        state.y = displayWorkingArea.y + displayWorkingArea.height - state.height;
                    }
                    // again ensure state is not outside display working area
                    // (it may have changed from the previous validation step)
                    ensureStateInDisplayWorkingArea();
                }
                return state;
            }
            // Multi Montior (fullscreen): try to find the previously used display
            if (state.display && state.mode === 3 /* WindowMode.Fullscreen */) {
                const display = displays.find(d => d.id === state.display);
                if (display && typeof display.bounds?.x === 'number' && typeof display.bounds?.y === 'number') {
                    logService.trace('window#validateWindowState: restoring fullscreen to previous display');
                    const defaults = (0, window_1.defaultWindowState)(3 /* WindowMode.Fullscreen */); // make sure we have good values when the user restores the window
                    defaults.x = display.bounds.x; // carefull to use displays x/y position so that the window ends up on the correct monitor
                    defaults.y = display.bounds.y;
                    return defaults;
                }
            }
            // Multi Monitor (non-fullscreen): ensure window is within display bounds
            let display;
            let displayWorkingArea;
            try {
                display = electron_1.screen.getDisplayMatching({ x: state.x, y: state.y, width: state.width, height: state.height });
                displayWorkingArea = getWorkingArea(display);
                logService.trace('window#validateWindowState: multi-monitor working area', displayWorkingArea);
            }
            catch (error) {
                // Electron has weird conditions under which it throws errors
                // e.g. https://github.com/microsoft/vscode/issues/100334 when
                // large numbers are passed in
                logService.error('window#validateWindowState: error finding display for window state', error);
            }
            if (display && // we have a display matching the desired bounds
                displayWorkingArea && // we have valid working area bounds
                state.x + state.width > displayWorkingArea.x && // prevent window from falling out of the screen to the left
                state.y + state.height > displayWorkingArea.y && // prevent window from falling out of the screen to the top
                state.x < displayWorkingArea.x + displayWorkingArea.width && // prevent window from falling out of the screen to the right
                state.y < displayWorkingArea.y + displayWorkingArea.height // prevent window from falling out of the screen to the bottom
            ) {
                return state;
            }
            logService.trace('window#validateWindowState: state is outside of the multi-monitor working area');
            return undefined;
        }
        WindowStateValidator.validateWindowState = validateWindowState;
        function getWorkingArea(display) {
            // Prefer the working area of the display to account for taskbars on the
            // desktop being positioned somewhere (https://github.com/microsoft/vscode/issues/50830).
            //
            // Linux X11 sessions sometimes report wrong display bounds, so we validate
            // the reported sizes are positive.
            if (display.workArea.width > 0 && display.workArea.height > 0) {
                return display.workArea;
            }
            if (display.bounds.width > 0 && display.bounds.height > 0) {
                return display.bounds;
            }
            return undefined;
        }
    })(WindowStateValidator || (exports.WindowStateValidator = WindowStateValidator = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dpbmRvd3MvZWxlY3Ryb24tbWFpbi93aW5kb3dzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtIaEcsa0VBZ0ZDO0lBSUQsd0NBWUM7SUEvTFksUUFBQSxtQkFBbUIsR0FBRyxJQUFBLCtCQUFlLEVBQXNCLG9CQUFvQixDQUFDLENBQUM7SUF5QzlGLElBQWtCLFdBbUJqQjtJQW5CRCxXQUFrQixXQUFXO1FBRTVCLDZDQUE2QztRQUM3QywyQ0FBRyxDQUFBO1FBRUgsaUdBQWlHO1FBQ2pHLDZDQUFJLENBQUE7UUFFSiwyQ0FBMkM7UUFDM0MsNkNBQUksQ0FBQTtRQUVKLHVDQUF1QztRQUN2QyxpREFBTSxDQUFBO1FBRU4sMkJBQTJCO1FBQzNCLG1EQUFPLENBQUE7UUFFUCwwQkFBMEI7UUFDMUIsMkNBQUcsQ0FBQTtJQUNKLENBQUMsRUFuQmlCLFdBQVcsMkJBQVgsV0FBVyxRQW1CNUI7SUFtQ0QsU0FBZ0IsMkJBQTJCLENBQUMsUUFBMEIsRUFBRSxXQUF5QixFQUFFLGNBQStCO1FBQ2pJLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQWUsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sc0JBQXNCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnREFBdUIsQ0FBQyxDQUFDO1FBRXJFLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBOEIsUUFBUSxDQUFDLENBQUM7UUFFNUYsTUFB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