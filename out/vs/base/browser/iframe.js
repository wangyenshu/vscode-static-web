/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IframeUtils = void 0;
    exports.parentOriginHash = parentOriginHash;
    const sameOriginWindowChainCache = new WeakMap();
    function getParentWindowIfSameOrigin(w) {
        if (!w.parent || w.parent === w) {
            return null;
        }
        // Cannot really tell if we have access to the parent window unless we try to access something in it
        try {
            const location = w.location;
            const parentLocation = w.parent.location;
            if (location.origin !== 'null' && parentLocation.origin !== 'null' && location.origin !== parentLocation.origin) {
                return null;
            }
        }
        catch (e) {
            return null;
        }
        return w.parent;
    }
    class IframeUtils {
        /**
         * Returns a chain of embedded windows with the same origin (which can be accessed programmatically).
         * Having a chain of length 1 might mean that the current execution environment is running outside of an iframe or inside an iframe embedded in a window with a different origin.
         */
        static getSameOriginWindowChain(targetWindow) {
            let windowChainCache = sameOriginWindowChainCache.get(targetWindow);
            if (!windowChainCache) {
                windowChainCache = [];
                sameOriginWindowChainCache.set(targetWindow, windowChainCache);
                let w = targetWindow;
                let parent;
                do {
                    parent = getParentWindowIfSameOrigin(w);
                    if (parent) {
                        windowChainCache.push({
                            window: new WeakRef(w),
                            iframeElement: w.frameElement || null
                        });
                    }
                    else {
                        windowChainCache.push({
                            window: new WeakRef(w),
                            iframeElement: null
                        });
                    }
                    w = parent;
                } while (w);
            }
            return windowChainCache.slice(0);
        }
        /**
         * Returns the position of `childWindow` relative to `ancestorWindow`
         */
        static getPositionOfChildWindowRelativeToAncestorWindow(childWindow, ancestorWindow) {
            if (!ancestorWindow || childWindow === ancestorWindow) {
                return {
                    top: 0,
                    left: 0
                };
            }
            let top = 0, left = 0;
            const windowChain = this.getSameOriginWindowChain(childWindow);
            for (const windowChainEl of windowChain) {
                const windowInChain = windowChainEl.window.deref();
                top += windowInChain?.scrollY ?? 0;
                left += windowInChain?.scrollX ?? 0;
                if (windowInChain === ancestorWindow) {
                    break;
                }
                if (!windowChainEl.iframeElement) {
                    break;
                }
                const boundingRect = windowChainEl.iframeElement.getBoundingClientRect();
                top += boundingRect.top;
                left += boundingRect.left;
            }
            return {
                top: top,
                left: left
            };
        }
    }
    exports.IframeUtils = IframeUtils;
    /**
     * Returns a sha-256 composed of `parentOrigin` and `salt` converted to base 32
     */
    async function parentOriginHash(parentOrigin, salt) {
        // This same code is also inlined at `src/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html`
        if (!crypto.subtle) {
            throw new Error(`'crypto.subtle' is not available so webviews will not work. This is likely because the editor is not running in a secure context (https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).`);
        }
        const strData = JSON.stringify({ parentOrigin, salt });
        const encoder = new TextEncoder();
        const arrData = encoder.encode(strData);
        const hash = await crypto.subtle.digest('sha-256', arrData);
        return sha256AsBase32(hash);
    }
    function sha256AsBase32(bytes) {
        const array = Array.from(new Uint8Array(bytes));
        const hexArray = array.map(b => b.toString(16).padStart(2, '0')).join('');
        // sha256 has 256 bits, so we need at most ceil(lg(2^256-1)/lg(32)) = 52 chars to represent it in base 32
        return BigInt(`0x${hexArray}`).toString(32).padStart(52, '0');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWZyYW1lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2lmcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpSGhHLDRDQVdDO0lBNUdELE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxPQUFPLEVBQXdDLENBQUM7SUFFdkYsU0FBUywyQkFBMkIsQ0FBQyxDQUFTO1FBQzdDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDakMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsb0dBQW9HO1FBQ3BHLElBQUksQ0FBQztZQUNKLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDNUIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakgsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDakIsQ0FBQztJQUVELE1BQWEsV0FBVztRQUV2Qjs7O1dBR0c7UUFDSyxNQUFNLENBQUMsd0JBQXdCLENBQUMsWUFBb0I7WUFDM0QsSUFBSSxnQkFBZ0IsR0FBRywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztnQkFDdEIsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUMvRCxJQUFJLENBQUMsR0FBa0IsWUFBWSxDQUFDO2dCQUNwQyxJQUFJLE1BQXFCLENBQUM7Z0JBQzFCLEdBQUcsQ0FBQztvQkFDSCxNQUFNLEdBQUcsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hDLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1osZ0JBQWdCLENBQUMsSUFBSSxDQUFDOzRCQUNyQixNQUFNLEVBQUUsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDOzRCQUN0QixhQUFhLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxJQUFJO3lCQUNyQyxDQUFDLENBQUM7b0JBQ0osQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGdCQUFnQixDQUFDLElBQUksQ0FBQzs0QkFDckIsTUFBTSxFQUFFLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQzs0QkFDdEIsYUFBYSxFQUFFLElBQUk7eUJBQ25CLENBQUMsQ0FBQztvQkFDSixDQUFDO29CQUNELENBQUMsR0FBRyxNQUFNLENBQUM7Z0JBQ1osQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNiLENBQUM7WUFDRCxPQUFPLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNLENBQUMsZ0RBQWdELENBQUMsV0FBbUIsRUFBRSxjQUE2QjtZQUVoSCxJQUFJLENBQUMsY0FBYyxJQUFJLFdBQVcsS0FBSyxjQUFjLEVBQUUsQ0FBQztnQkFDdkQsT0FBTztvQkFDTixHQUFHLEVBQUUsQ0FBQztvQkFDTixJQUFJLEVBQUUsQ0FBQztpQkFDUCxDQUFDO1lBQ0gsQ0FBQztZQUVELElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBRXRCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUvRCxLQUFLLE1BQU0sYUFBYSxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNuRCxHQUFHLElBQUksYUFBYSxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUM7Z0JBQ25DLElBQUksSUFBSSxhQUFhLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztnQkFFcEMsSUFBSSxhQUFhLEtBQUssY0FBYyxFQUFFLENBQUM7b0JBQ3RDLE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNsQyxNQUFNO2dCQUNQLENBQUM7Z0JBRUQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN6RSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQztnQkFDeEIsSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDM0IsQ0FBQztZQUVELE9BQU87Z0JBQ04sR0FBRyxFQUFFLEdBQUc7Z0JBQ1IsSUFBSSxFQUFFLElBQUk7YUFDVixDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBdkVELGtDQXVFQztJQUVEOztPQUVHO0lBQ0ksS0FBSyxVQUFVLGdCQUFnQixDQUFDLFlBQW9CLEVBQUUsSUFBWTtRQUN4RSxvSEFBb0g7UUFDcEgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLDJNQUEyTSxDQUFDLENBQUM7UUFDOU4sQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUQsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLEtBQWtCO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLHlHQUF5RztRQUN6RyxPQUFPLE1BQU0sQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDL0QsQ0FBQyJ9