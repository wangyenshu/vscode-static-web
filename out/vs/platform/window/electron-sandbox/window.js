/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/window/common/window"], function (require, exports, browser_1, dom_1, window_1, globals_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MIN_ZOOM_LEVEL = exports.MAX_ZOOM_LEVEL = exports.ApplyZoomTarget = void 0;
    exports.applyZoom = applyZoom;
    exports.zoomIn = zoomIn;
    exports.zoomOut = zoomOut;
    var ApplyZoomTarget;
    (function (ApplyZoomTarget) {
        ApplyZoomTarget[ApplyZoomTarget["ACTIVE_WINDOW"] = 1] = "ACTIVE_WINDOW";
        ApplyZoomTarget[ApplyZoomTarget["ALL_WINDOWS"] = 2] = "ALL_WINDOWS";
    })(ApplyZoomTarget || (exports.ApplyZoomTarget = ApplyZoomTarget = {}));
    exports.MAX_ZOOM_LEVEL = 8;
    exports.MIN_ZOOM_LEVEL = -8;
    /**
     * Apply a zoom level to the window. Also sets it in our in-memory
     * browser helper so that it can be accessed in non-electron layers.
     */
    function applyZoom(zoomLevel, target) {
        zoomLevel = Math.min(Math.max(zoomLevel, exports.MIN_ZOOM_LEVEL), exports.MAX_ZOOM_LEVEL); // cap zoom levels between -8 and 8
        const targetWindows = [];
        if (target === ApplyZoomTarget.ACTIVE_WINDOW) {
            targetWindows.push((0, dom_1.getActiveWindow)());
        }
        else if (target === ApplyZoomTarget.ALL_WINDOWS) {
            targetWindows.push(...Array.from((0, dom_1.getWindows)()).map(({ window }) => window));
        }
        else {
            targetWindows.push(target);
        }
        for (const targetWindow of targetWindows) {
            getGlobals(targetWindow)?.webFrame?.setZoomLevel(zoomLevel);
            (0, browser_1.setZoomFactor)((0, window_2.zoomLevelToZoomFactor)(zoomLevel), targetWindow);
            (0, browser_1.setZoomLevel)(zoomLevel, targetWindow);
        }
    }
    function getGlobals(win) {
        if (win === window_1.mainWindow) {
            // main window
            return { ipcRenderer: globals_1.ipcRenderer, webFrame: globals_1.webFrame };
        }
        else {
            // auxiliary window
            const auxiliaryWindow = win;
            if (auxiliaryWindow?.vscode?.ipcRenderer && auxiliaryWindow?.vscode?.webFrame) {
                return auxiliaryWindow.vscode;
            }
        }
        return undefined;
    }
    function zoomIn(target) {
        applyZoom((0, browser_1.getZoomLevel)(typeof target === 'number' ? (0, dom_1.getActiveWindow)() : target) + 1, target);
    }
    function zoomOut(target) {
        applyZoom((0, browser_1.getZoomLevel)(typeof target === 'number' ? (0, dom_1.getActiveWindow)() : target) - 1, target);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93L2VsZWN0cm9uLXNhbmRib3gvd2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsOEJBaUJDO0lBaUJELHdCQUVDO0lBRUQsMEJBRUM7SUFwREQsSUFBWSxlQUdYO0lBSEQsV0FBWSxlQUFlO1FBQzFCLHVFQUFpQixDQUFBO1FBQ2pCLG1FQUFXLENBQUE7SUFDWixDQUFDLEVBSFcsZUFBZSwrQkFBZixlQUFlLFFBRzFCO0lBRVksUUFBQSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLFFBQUEsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWpDOzs7T0FHRztJQUNILFNBQWdCLFNBQVMsQ0FBQyxTQUFpQixFQUFFLE1BQWdDO1FBQzVFLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLHNCQUFjLENBQUMsRUFBRSxzQkFBYyxDQUFDLENBQUMsQ0FBQyxtQ0FBbUM7UUFFOUcsTUFBTSxhQUFhLEdBQWEsRUFBRSxDQUFDO1FBQ25DLElBQUksTUFBTSxLQUFLLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM5QyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQzthQUFNLElBQUksTUFBTSxLQUFLLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuRCxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFVLEdBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDN0UsQ0FBQzthQUFNLENBQUM7WUFDUCxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQzFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVELElBQUEsdUJBQWEsRUFBQyxJQUFBLDhCQUFxQixFQUFDLFNBQVMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzlELElBQUEsc0JBQVksRUFBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBQyxHQUFXO1FBQzlCLElBQUksR0FBRyxLQUFLLG1CQUFVLEVBQUUsQ0FBQztZQUN4QixjQUFjO1lBQ2QsT0FBTyxFQUFFLFdBQVcsRUFBWCxxQkFBVyxFQUFFLFFBQVEsRUFBUixrQkFBUSxFQUFFLENBQUM7UUFDbEMsQ0FBQzthQUFNLENBQUM7WUFDUCxtQkFBbUI7WUFDbkIsTUFBTSxlQUFlLEdBQUcsR0FBNkMsQ0FBQztZQUN0RSxJQUFJLGVBQWUsRUFBRSxNQUFNLEVBQUUsV0FBVyxJQUFJLGVBQWUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQy9FLE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFnQixNQUFNLENBQUMsTUFBZ0M7UUFDdEQsU0FBUyxDQUFDLElBQUEsc0JBQVksRUFBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVELFNBQWdCLE9BQU8sQ0FBQyxNQUFnQztRQUN2RCxTQUFTLENBQUMsSUFBQSxzQkFBWSxFQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSxxQkFBZSxHQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5RixDQUFDIn0=