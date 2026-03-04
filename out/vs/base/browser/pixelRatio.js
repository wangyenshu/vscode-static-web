/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PixelRatio = void 0;
    /**
     * See https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes
     */
    class DevicePixelRatioMonitor extends lifecycle_1.Disposable {
        constructor(targetWindow) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._listener = () => this._handleChange(targetWindow, true);
            this._mediaQueryList = null;
            this._handleChange(targetWindow, false);
        }
        _handleChange(targetWindow, fireEvent) {
            this._mediaQueryList?.removeEventListener('change', this._listener);
            this._mediaQueryList = targetWindow.matchMedia(`(resolution: ${targetWindow.devicePixelRatio}dppx)`);
            this._mediaQueryList.addEventListener('change', this._listener);
            if (fireEvent) {
                this._onDidChange.fire();
            }
        }
    }
    class PixelRatioMonitorImpl extends lifecycle_1.Disposable {
        get value() {
            return this._value;
        }
        constructor(targetWindow) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._value = this._getPixelRatio(targetWindow);
            const dprMonitor = this._register(new DevicePixelRatioMonitor(targetWindow));
            this._register(dprMonitor.onDidChange(() => {
                this._value = this._getPixelRatio(targetWindow);
                this._onDidChange.fire(this._value);
            }));
        }
        _getPixelRatio(targetWindow) {
            const ctx = document.createElement('canvas').getContext('2d');
            const dpr = targetWindow.devicePixelRatio || 1;
            const bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;
            return dpr / bsr;
        }
    }
    class PixelRatioMonitorFacade {
        constructor() {
            this.mapWindowIdToPixelRatioMonitor = new Map();
        }
        _getOrCreatePixelRatioMonitor(targetWindow) {
            const targetWindowId = (0, dom_1.getWindowId)(targetWindow);
            let pixelRatioMonitor = this.mapWindowIdToPixelRatioMonitor.get(targetWindowId);
            if (!pixelRatioMonitor) {
                pixelRatioMonitor = (0, lifecycle_1.markAsSingleton)(new PixelRatioMonitorImpl(targetWindow));
                this.mapWindowIdToPixelRatioMonitor.set(targetWindowId, pixelRatioMonitor);
                (0, lifecycle_1.markAsSingleton)(event_1.Event.once(dom_1.onDidUnregisterWindow)(({ vscodeWindowId }) => {
                    if (vscodeWindowId === targetWindowId) {
                        pixelRatioMonitor?.dispose();
                        this.mapWindowIdToPixelRatioMonitor.delete(targetWindowId);
                    }
                }));
            }
            return pixelRatioMonitor;
        }
        getInstance(targetWindow) {
            return this._getOrCreatePixelRatioMonitor(targetWindow);
        }
    }
    /**
     * Returns the pixel ratio.
     *
     * This is useful for rendering <canvas> elements at native screen resolution or for being used as
     * a cache key when storing font measurements. Fonts might render differently depending on resolution
     * and any measurements need to be discarded for example when a window is moved from a monitor to another.
     */
    exports.PixelRatio = new PixelRatioMonitorFacade();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGl4ZWxSYXRpby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9waXhlbFJhdGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRzs7T0FFRztJQUNILE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFRL0MsWUFBWSxZQUFvQjtZQUMvQixLQUFLLEVBQUUsQ0FBQztZQVBRLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0QsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQVE5QyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTyxhQUFhLENBQUMsWUFBb0IsRUFBRSxTQUFrQjtZQUM3RCxJQUFJLENBQUMsZUFBZSxFQUFFLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFcEUsSUFBSSxDQUFDLGVBQWUsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLGdCQUFnQixZQUFZLENBQUMsZ0JBQWdCLE9BQU8sQ0FBQyxDQUFDO1lBQ3JHLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVoRSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQU9ELE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFPN0MsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxZQUFZLFlBQW9CO1lBQy9CLEtBQUssRUFBRSxDQUFDO1lBVlEsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUM3RCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBVzlDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUMxQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGNBQWMsQ0FBQyxZQUFvQjtZQUMxQyxNQUFNLEdBQUcsR0FBUSxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRSxNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyw0QkFBNEI7Z0JBQzNDLEdBQUcsQ0FBQyx5QkFBeUI7Z0JBQzdCLEdBQUcsQ0FBQyx3QkFBd0I7Z0JBQzVCLEdBQUcsQ0FBQyx1QkFBdUI7Z0JBQzNCLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLENBQUM7WUFDakMsT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQUVELE1BQU0sdUJBQXVCO1FBQTdCO1lBRWtCLG1DQUE4QixHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1FBc0I1RixDQUFDO1FBcEJRLDZCQUE2QixDQUFDLFlBQW9CO1lBQ3pELE1BQU0sY0FBYyxHQUFHLElBQUEsaUJBQVcsRUFBQyxZQUFZLENBQUMsQ0FBQztZQUNqRCxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3hCLGlCQUFpQixHQUFHLElBQUEsMkJBQWUsRUFBQyxJQUFJLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQzdFLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBRTNFLElBQUEsMkJBQWUsRUFBQyxhQUFLLENBQUMsSUFBSSxDQUFDLDJCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUU7b0JBQ3hFLElBQUksY0FBYyxLQUFLLGNBQWMsRUFBRSxDQUFDO3dCQUN2QyxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDN0IsSUFBSSxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDNUQsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUNELE9BQU8saUJBQWlCLENBQUM7UUFDMUIsQ0FBQztRQUVELFdBQVcsQ0FBQyxZQUFvQjtZQUMvQixPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDO0tBQ0Q7SUFFRDs7Ozs7O09BTUc7SUFDVSxRQUFBLFVBQVUsR0FBRyxJQUFJLHVCQUF1QixFQUFFLENBQUMifQ==