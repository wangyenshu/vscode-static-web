/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/parts/ipc/common/ipc", "vs/platform/window/common/window"], function (require, exports, platform_1, ipc_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowIgnoreMenuShortcutsManager = void 0;
    class WindowIgnoreMenuShortcutsManager {
        constructor(configurationService, mainProcessService, _nativeHostService) {
            this._nativeHostService = _nativeHostService;
            this._isUsingNativeTitleBars = (0, window_1.hasNativeTitlebar)(configurationService);
            this._webviewMainService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('webview'));
        }
        didFocus() {
            this.setIgnoreMenuShortcuts(true);
        }
        didBlur() {
            this.setIgnoreMenuShortcuts(false);
        }
        get _shouldToggleMenuShortcutsEnablement() {
            return platform_1.isMacintosh || this._isUsingNativeTitleBars;
        }
        setIgnoreMenuShortcuts(value) {
            if (this._shouldToggleMenuShortcutsEnablement) {
                this._webviewMainService.setIgnoreMenuShortcuts({ windowId: this._nativeHostService.windowId }, value);
            }
        }
    }
    exports.WindowIgnoreMenuShortcutsManager = WindowIgnoreMenuShortcutsManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93SWdub3JlTWVudVNob3J0Y3V0c01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2VsZWN0cm9uLXNhbmRib3gvd2luZG93SWdub3JlTWVudVNob3J0Y3V0c01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsZ0NBQWdDO1FBTTVDLFlBQ0Msb0JBQTJDLEVBQzNDLGtCQUF1QyxFQUN0QixrQkFBc0M7WUFBdEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUV2RCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBQSwwQkFBaUIsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXZFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBWSxDQUFDLFNBQVMsQ0FBeUIsa0JBQWtCLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUVNLFFBQVE7WUFDZCxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVNLE9BQU87WUFDYixJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQVksb0NBQW9DO1lBQy9DLE9BQU8sc0JBQVcsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUM7UUFDcEQsQ0FBQztRQUVTLHNCQUFzQixDQUFDLEtBQWM7WUFDOUMsSUFBSSxJQUFJLENBQUMsb0NBQW9DLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLHNCQUFzQixDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBakNELDRFQWlDQyJ9