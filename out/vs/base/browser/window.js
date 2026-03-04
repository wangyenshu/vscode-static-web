/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mainWindow = void 0;
    exports.ensureCodeWindow = ensureCodeWindow;
    exports.isAuxiliaryWindow = isAuxiliaryWindow;
    function ensureCodeWindow(targetWindow, fallbackWindowId) {
        const codeWindow = targetWindow;
        if (typeof codeWindow.vscodeWindowId !== 'number') {
            Object.defineProperty(codeWindow, 'vscodeWindowId', {
                get: () => fallbackWindowId
            });
        }
    }
    // eslint-disable-next-line no-restricted-globals
    exports.mainWindow = window;
    function isAuxiliaryWindow(obj) {
        if (obj === exports.mainWindow) {
            return false;
        }
        const candidate = obj;
        return typeof candidate?.vscodeWindowId === 'number';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3dpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsNENBUUM7SUFLRCw4Q0FRQztJQXJCRCxTQUFnQixnQkFBZ0IsQ0FBQyxZQUFvQixFQUFFLGdCQUF3QjtRQUM5RSxNQUFNLFVBQVUsR0FBRyxZQUFtQyxDQUFDO1FBRXZELElBQUksT0FBTyxVQUFVLENBQUMsY0FBYyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLGdCQUFnQixFQUFFO2dCQUNuRCxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsZ0JBQWdCO2FBQzNCLENBQUMsQ0FBQztRQUNKLENBQUM7SUFDRixDQUFDO0lBRUQsaURBQWlEO0lBQ3BDLFFBQUEsVUFBVSxHQUFHLE1BQW9CLENBQUM7SUFFL0MsU0FBZ0IsaUJBQWlCLENBQUMsR0FBVztRQUM1QyxJQUFJLEdBQUcsS0FBSyxrQkFBVSxFQUFFLENBQUM7WUFDeEIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsR0FBNkIsQ0FBQztRQUVoRCxPQUFPLE9BQU8sU0FBUyxFQUFFLGNBQWMsS0FBSyxRQUFRLENBQUM7SUFDdEQsQ0FBQyJ9