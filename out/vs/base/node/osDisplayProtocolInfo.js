/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "fs/promises", "vs/base/common/path", "vs/base/common/process"], function (require, exports, fs_1, promises_1, path_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDisplayProtocol = getDisplayProtocol;
    exports.getCodeDisplayProtocol = getCodeDisplayProtocol;
    const XDG_SESSION_TYPE = 'XDG_SESSION_TYPE';
    const WAYLAND_DISPLAY = 'WAYLAND_DISPLAY';
    const XDG_RUNTIME_DIR = 'XDG_RUNTIME_DIR';
    var DisplayProtocolType;
    (function (DisplayProtocolType) {
        DisplayProtocolType["Wayland"] = "wayland";
        DisplayProtocolType["XWayland"] = "xwayland";
        DisplayProtocolType["X11"] = "x11";
        DisplayProtocolType["Unknown"] = "unknown";
    })(DisplayProtocolType || (DisplayProtocolType = {}));
    async function getDisplayProtocol(errorLogger) {
        const xdgSessionType = process_1.env[XDG_SESSION_TYPE];
        if (xdgSessionType) {
            // If XDG_SESSION_TYPE is set, return its value if it's either 'wayland' or 'x11'.
            // We assume that any value other than 'wayland' or 'x11' is an error or unexpected,
            // hence 'unknown' is returned.
            return xdgSessionType === "wayland" /* DisplayProtocolType.Wayland */ || xdgSessionType === "x11" /* DisplayProtocolType.X11 */ ? xdgSessionType : "unknown" /* DisplayProtocolType.Unknown */;
        }
        else {
            const waylandDisplay = process_1.env[WAYLAND_DISPLAY];
            if (!waylandDisplay) {
                // If WAYLAND_DISPLAY is empty, then the session is x11.
                return "x11" /* DisplayProtocolType.X11 */;
            }
            else {
                const xdgRuntimeDir = process_1.env[XDG_RUNTIME_DIR];
                if (!xdgRuntimeDir) {
                    // If XDG_RUNTIME_DIR is empty, then the session can only be guessed.
                    return "unknown" /* DisplayProtocolType.Unknown */;
                }
                else {
                    // Check for the presence of the file $XDG_RUNTIME_DIR/wayland-0.
                    const waylandServerPipe = (0, path_1.join)(xdgRuntimeDir, 'wayland-0');
                    try {
                        await (0, promises_1.access)(waylandServerPipe, fs_1.constants.R_OK);
                        // If the file exists, then the session is wayland.
                        return "wayland" /* DisplayProtocolType.Wayland */;
                    }
                    catch (err) {
                        // If the file does not exist or an error occurs, we guess 'unknown'
                        // since WAYLAND_DISPLAY was set but no wayland-0 pipe could be confirmed.
                        errorLogger(err);
                        return "unknown" /* DisplayProtocolType.Unknown */;
                    }
                }
            }
        }
    }
    function getCodeDisplayProtocol(displayProtocol, ozonePlatform) {
        if (!ozonePlatform) {
            return displayProtocol === "wayland" /* DisplayProtocolType.Wayland */ ? "xwayland" /* DisplayProtocolType.XWayland */ : "x11" /* DisplayProtocolType.X11 */;
        }
        else {
            switch (ozonePlatform) {
                case 'auto':
                    return displayProtocol;
                case 'x11':
                    return displayProtocol === "wayland" /* DisplayProtocolType.Wayland */ ? "xwayland" /* DisplayProtocolType.XWayland */ : "x11" /* DisplayProtocolType.X11 */;
                case 'wayland':
                    return "wayland" /* DisplayProtocolType.Wayland */;
                default:
                    return "unknown" /* DisplayProtocolType.Unknown */;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3NEaXNwbGF5UHJvdG9jb2xJbmZvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL29zRGlzcGxheVByb3RvY29sSW5mby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsZ0RBc0NDO0lBR0Qsd0RBZUM7SUFuRUQsTUFBTSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQztJQUM1QyxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztJQUMxQyxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztJQUUxQyxJQUFXLG1CQUtWO0lBTEQsV0FBVyxtQkFBbUI7UUFDN0IsMENBQW1CLENBQUE7UUFDbkIsNENBQXFCLENBQUE7UUFDckIsa0NBQVcsQ0FBQTtRQUNYLDBDQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFMVSxtQkFBbUIsS0FBbkIsbUJBQW1CLFFBSzdCO0lBRU0sS0FBSyxVQUFVLGtCQUFrQixDQUFDLFdBQWlDO1FBQ3pFLE1BQU0sY0FBYyxHQUFHLGFBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTdDLElBQUksY0FBYyxFQUFFLENBQUM7WUFDcEIsa0ZBQWtGO1lBQ2xGLG9GQUFvRjtZQUNwRiwrQkFBK0I7WUFDL0IsT0FBTyxjQUFjLGdEQUFnQyxJQUFJLGNBQWMsd0NBQTRCLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLDRDQUE0QixDQUFDO1FBQ3BKLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxjQUFjLEdBQUcsYUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTVDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDckIsd0RBQXdEO2dCQUN4RCwyQ0FBK0I7WUFDaEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sYUFBYSxHQUFHLGFBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFFM0MsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNwQixxRUFBcUU7b0JBQ3JFLG1EQUFtQztnQkFDcEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGlFQUFpRTtvQkFDakUsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLFdBQUksRUFBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBRTNELElBQUksQ0FBQzt3QkFDSixNQUFNLElBQUEsaUJBQU0sRUFBQyxpQkFBaUIsRUFBRSxjQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBRWxELG1EQUFtRDt3QkFDbkQsbURBQW1DO29CQUNwQyxDQUFDO29CQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7d0JBQ2Qsb0VBQW9FO3dCQUNwRSwwRUFBMEU7d0JBQzFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDakIsbURBQW1DO29CQUNwQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFHRCxTQUFnQixzQkFBc0IsQ0FBQyxlQUFvQyxFQUFFLGFBQWlDO1FBQzdHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNwQixPQUFPLGVBQWUsZ0RBQWdDLENBQUMsQ0FBQywrQ0FBOEIsQ0FBQyxvQ0FBd0IsQ0FBQztRQUNqSCxDQUFDO2FBQU0sQ0FBQztZQUNQLFFBQVEsYUFBYSxFQUFFLENBQUM7Z0JBQ3ZCLEtBQUssTUFBTTtvQkFDVixPQUFPLGVBQWUsQ0FBQztnQkFDeEIsS0FBSyxLQUFLO29CQUNULE9BQU8sZUFBZSxnREFBZ0MsQ0FBQyxDQUFDLCtDQUE4QixDQUFDLG9DQUF3QixDQUFDO2dCQUNqSCxLQUFLLFNBQVM7b0JBQ2IsbURBQW1DO2dCQUNwQztvQkFDQyxtREFBbUM7WUFDckMsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDIn0=