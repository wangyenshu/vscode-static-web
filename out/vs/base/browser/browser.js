/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/event"], function (require, exports, window_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAndroid = exports.isElectron = exports.isWebkitWebView = exports.isSafari = exports.isChrome = exports.isWebKit = exports.isFirefox = exports.onDidChangeFullscreen = exports.onDidChangeZoomLevel = void 0;
    exports.addMatchMediaChangeListener = addMatchMediaChangeListener;
    exports.setZoomLevel = setZoomLevel;
    exports.getZoomLevel = getZoomLevel;
    exports.getZoomFactor = getZoomFactor;
    exports.setZoomFactor = setZoomFactor;
    exports.setFullscreen = setFullscreen;
    exports.isFullscreen = isFullscreen;
    exports.isStandalone = isStandalone;
    exports.isWCOEnabled = isWCOEnabled;
    class WindowManager {
        constructor() {
            // --- Zoom Level
            this.mapWindowIdToZoomLevel = new Map();
            this._onDidChangeZoomLevel = new event_1.Emitter();
            this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event;
            // --- Zoom Factor
            this.mapWindowIdToZoomFactor = new Map();
            // --- Fullscreen
            this._onDidChangeFullscreen = new event_1.Emitter();
            this.onDidChangeFullscreen = this._onDidChangeFullscreen.event;
            this.mapWindowIdToFullScreen = new Map();
        }
        static { this.INSTANCE = new WindowManager(); }
        getZoomLevel(targetWindow) {
            return this.mapWindowIdToZoomLevel.get(this.getWindowId(targetWindow)) ?? 0;
        }
        setZoomLevel(zoomLevel, targetWindow) {
            if (this.getZoomLevel(targetWindow) === zoomLevel) {
                return;
            }
            const targetWindowId = this.getWindowId(targetWindow);
            this.mapWindowIdToZoomLevel.set(targetWindowId, zoomLevel);
            this._onDidChangeZoomLevel.fire(targetWindowId);
        }
        getZoomFactor(targetWindow) {
            return this.mapWindowIdToZoomFactor.get(this.getWindowId(targetWindow)) ?? 1;
        }
        setZoomFactor(zoomFactor, targetWindow) {
            this.mapWindowIdToZoomFactor.set(this.getWindowId(targetWindow), zoomFactor);
        }
        setFullscreen(fullscreen, targetWindow) {
            if (this.isFullscreen(targetWindow) === fullscreen) {
                return;
            }
            const windowId = this.getWindowId(targetWindow);
            this.mapWindowIdToFullScreen.set(windowId, fullscreen);
            this._onDidChangeFullscreen.fire(windowId);
        }
        isFullscreen(targetWindow) {
            return !!this.mapWindowIdToFullScreen.get(this.getWindowId(targetWindow));
        }
        getWindowId(targetWindow) {
            return targetWindow.vscodeWindowId;
        }
    }
    function addMatchMediaChangeListener(targetWindow, query, callback) {
        if (typeof query === 'string') {
            query = targetWindow.matchMedia(query);
        }
        query.addEventListener('change', callback);
    }
    /** A zoom index, e.g. 1, 2, 3 */
    function setZoomLevel(zoomLevel, targetWindow) {
        WindowManager.INSTANCE.setZoomLevel(zoomLevel, targetWindow);
    }
    function getZoomLevel(targetWindow) {
        return WindowManager.INSTANCE.getZoomLevel(targetWindow);
    }
    exports.onDidChangeZoomLevel = WindowManager.INSTANCE.onDidChangeZoomLevel;
    /** The zoom scale for an index, e.g. 1, 1.2, 1.4 */
    function getZoomFactor(targetWindow) {
        return WindowManager.INSTANCE.getZoomFactor(targetWindow);
    }
    function setZoomFactor(zoomFactor, targetWindow) {
        WindowManager.INSTANCE.setZoomFactor(zoomFactor, targetWindow);
    }
    function setFullscreen(fullscreen, targetWindow) {
        WindowManager.INSTANCE.setFullscreen(fullscreen, targetWindow);
    }
    function isFullscreen(targetWindow) {
        return WindowManager.INSTANCE.isFullscreen(targetWindow);
    }
    exports.onDidChangeFullscreen = WindowManager.INSTANCE.onDidChangeFullscreen;
    const userAgent = navigator.userAgent;
    exports.isFirefox = (userAgent.indexOf('Firefox') >= 0);
    exports.isWebKit = (userAgent.indexOf('AppleWebKit') >= 0);
    exports.isChrome = (userAgent.indexOf('Chrome') >= 0);
    exports.isSafari = (!exports.isChrome && (userAgent.indexOf('Safari') >= 0));
    exports.isWebkitWebView = (!exports.isChrome && !exports.isSafari && exports.isWebKit);
    exports.isElectron = (userAgent.indexOf('Electron/') >= 0);
    exports.isAndroid = (userAgent.indexOf('Android') >= 0);
    let standalone = false;
    if (typeof window_1.mainWindow.matchMedia === 'function') {
        const standaloneMatchMedia = window_1.mainWindow.matchMedia('(display-mode: standalone) or (display-mode: window-controls-overlay)');
        const fullScreenMatchMedia = window_1.mainWindow.matchMedia('(display-mode: fullscreen)');
        standalone = standaloneMatchMedia.matches;
        addMatchMediaChangeListener(window_1.mainWindow, standaloneMatchMedia, ({ matches }) => {
            // entering fullscreen would change standaloneMatchMedia.matches to false
            // if standalone is true (running as PWA) and entering fullscreen, skip this change
            if (standalone && fullScreenMatchMedia.matches) {
                return;
            }
            // otherwise update standalone (browser to PWA or PWA to browser)
            standalone = matches;
        });
    }
    function isStandalone() {
        return standalone;
    }
    // Visible means that the feature is enabled, not necessarily being rendered
    // e.g. visible is true even in fullscreen mode where the controls are hidden
    // See docs at https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay/visible
    function isWCOEnabled() {
        return navigator?.windowControlsOverlay?.visible;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9icm93c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlFaEcsa0VBS0M7SUFHRCxvQ0FFQztJQUNELG9DQUVDO0lBSUQsc0NBRUM7SUFDRCxzQ0FFQztJQUVELHNDQUVDO0lBQ0Qsb0NBRUM7SUE0QkQsb0NBRUM7SUFLRCxvQ0FFQztJQTlIRCxNQUFNLGFBQWE7UUFBbkI7WUFJQyxpQkFBaUI7WUFFQSwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUVuRCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ3RELHlCQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFlakUsa0JBQWtCO1lBRUQsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFTckUsaUJBQWlCO1lBRUEsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUN2RCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBRWxELDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1FBa0J2RSxDQUFDO2lCQXhEZ0IsYUFBUSxHQUFHLElBQUksYUFBYSxFQUFFLEFBQXRCLENBQXVCO1FBUy9DLFlBQVksQ0FBQyxZQUFvQjtZQUNoQyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBQ0QsWUFBWSxDQUFDLFNBQWlCLEVBQUUsWUFBb0I7WUFDbkQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxL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