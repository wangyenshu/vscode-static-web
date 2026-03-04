/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/window", "vs/base/common/platform"], function (require, exports, browser, window_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserFeatures = exports.KeyboardSupport = void 0;
    var KeyboardSupport;
    (function (KeyboardSupport) {
        KeyboardSupport[KeyboardSupport["Always"] = 0] = "Always";
        KeyboardSupport[KeyboardSupport["FullScreen"] = 1] = "FullScreen";
        KeyboardSupport[KeyboardSupport["None"] = 2] = "None";
    })(KeyboardSupport || (exports.KeyboardSupport = KeyboardSupport = {}));
    /**
     * Browser feature we can support in current platform, browser and environment.
     */
    exports.BrowserFeatures = {
        clipboard: {
            writeText: (platform.isNative
                || (document.queryCommandSupported && document.queryCommandSupported('copy'))
                || !!(navigator && navigator.clipboard && navigator.clipboard.writeText)),
            readText: (platform.isNative
                || !!(navigator && navigator.clipboard && navigator.clipboard.readText))
        },
        keyboard: (() => {
            if (platform.isNative || browser.isStandalone()) {
                return 0 /* KeyboardSupport.Always */;
            }
            if (navigator.keyboard || browser.isSafari) {
                return 1 /* KeyboardSupport.FullScreen */;
            }
            return 2 /* KeyboardSupport.None */;
        })(),
        // 'ontouchstart' in window always evaluates to true with typescript's modern typings. This causes `window` to be
        // `never` later in `window.navigator`. That's why we need the explicit `window as Window` cast
        touch: 'ontouchstart' in window_1.mainWindow || navigator.maxTouchPoints > 0,
        pointerEvents: window_1.mainWindow.PointerEvent && ('ontouchstart' in window_1.mainWindow || navigator.maxTouchPoints > 0)
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuSVVzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9jYW5JVXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxJQUFrQixlQUlqQjtJQUpELFdBQWtCLGVBQWU7UUFDaEMseURBQU0sQ0FBQTtRQUNOLGlFQUFVLENBQUE7UUFDVixxREFBSSxDQUFBO0lBQ0wsQ0FBQyxFQUppQixlQUFlLCtCQUFmLGVBQWUsUUFJaEM7SUFFRDs7T0FFRztJQUNVLFFBQUEsZUFBZSxHQUFHO1FBQzlCLFNBQVMsRUFBRTtZQUNWLFNBQVMsRUFBRSxDQUNWLFFBQVEsQ0FBQyxRQUFRO21CQUNkLENBQUMsUUFBUSxDQUFDLHFCQUFxQixJQUFJLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQzttQkFDMUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FDeEU7WUFDRCxRQUFRLEVBQUUsQ0FDVCxRQUFRLENBQUMsUUFBUTttQkFDZCxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUN2RTtTQUNEO1FBQ0QsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFO1lBQ2YsSUFBSSxRQUFRLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxzQ0FBOEI7WUFDL0IsQ0FBQztZQUVELElBQVUsU0FBVSxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25ELDBDQUFrQztZQUNuQyxDQUFDO1lBRUQsb0NBQTRCO1FBQzdCLENBQUMsQ0FBQyxFQUFFO1FBRUosaUhBQWlIO1FBQ2pILCtGQUErRjtRQUMvRixLQUFLLEVBQUUsY0FBYyxJQUFJLG1CQUFVLElBQUksU0FBUyxDQUFDLGNBQWMsR0FBRyxDQUFDO1FBQ25FLGFBQWEsRUFBRSxtQkFBVSxDQUFDLFlBQVksSUFBSSxDQUFDLGNBQWMsSUFBSSxtQkFBVSxJQUFJLFNBQVMsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO0tBQ3hHLENBQUMifQ==