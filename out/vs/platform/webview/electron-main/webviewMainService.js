/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/webview/electron-main/webviewProtocolProvider", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, event_1, lifecycle_1, webviewProtocolProvider_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewMainService = void 0;
    let WebviewMainService = class WebviewMainService extends lifecycle_1.Disposable {
        constructor(windowsMainService) {
            super();
            this.windowsMainService = windowsMainService;
            this._onFoundInFrame = this._register(new event_1.Emitter());
            this.onFoundInFrame = this._onFoundInFrame.event;
            this._register(new webviewProtocolProvider_1.WebviewProtocolProvider());
        }
        async setIgnoreMenuShortcuts(id, enabled) {
            let contents;
            if (typeof id.windowId === 'number') {
                const { windowId } = id;
                const window = this.windowsMainService.getWindowById(windowId);
                if (!window?.win) {
                    throw new Error(`Invalid windowId: ${windowId}`);
                }
                contents = window.win.webContents;
            }
            else {
                const { webContentsId } = id;
                contents = electron_1.webContents.fromId(webContentsId);
                if (!contents) {
                    throw new Error(`Invalid webContentsId: ${webContentsId}`);
                }
            }
            if (!contents.isDestroyed()) {
                contents.setIgnoreMenuShortcuts(enabled);
            }
        }
        async findInFrame(windowId, frameName, text, options) {
            const initialFrame = this.getFrameByName(windowId, frameName);
            const frame = initialFrame;
            if (typeof frame.findInFrame === 'function') {
                frame.findInFrame(text, {
                    findNext: options.findNext,
                    forward: options.forward,
                });
                const foundInFrameHandler = (_, result) => {
                    if (result.finalUpdate) {
                        this._onFoundInFrame.fire(result);
                        frame.removeListener('found-in-frame', foundInFrameHandler);
                    }
                };
                frame.on('found-in-frame', foundInFrameHandler);
            }
        }
        async stopFindInFrame(windowId, frameName, options) {
            const initialFrame = this.getFrameByName(windowId, frameName);
            const frame = initialFrame;
            if (typeof frame.stopFindInFrame === 'function') {
                frame.stopFindInFrame(options.keepSelection ? 'keepSelection' : 'clearSelection');
            }
        }
        getFrameByName(windowId, frameName) {
            const window = this.windowsMainService.getWindowById(windowId.windowId);
            if (!window?.win) {
                throw new Error(`Invalid windowId: ${windowId}`);
            }
            const frame = window.win.webContents.mainFrame.framesInSubtree.find(frame => {
                return frame.name === frameName;
            });
            if (!frame) {
                throw new Error(`Unknown frame: ${frameName}`);
            }
            return frame;
        }
    };
    exports.WebviewMainService = WebviewMainService;
    exports.WebviewMainService = WebviewMainService = __decorate([
        __param(0, windows_1.IWindowsMainService)
    ], WebviewMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2Vidmlldy9lbGVjdHJvbi1tYWluL3dlYnZpZXdNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQU9qRCxZQUNzQixrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFGOEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUo3RCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUM5RSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBTWxELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpREFBdUIsRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVNLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxFQUEwQyxFQUFFLE9BQWdCO1lBQy9GLElBQUksUUFBaUMsQ0FBQztZQUV0QyxJQUFJLE9BQVEsRUFBc0IsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzFELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBSSxFQUFzQixDQUFDO2dCQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvRCxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO29CQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztZQUNuQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxFQUFFLGFBQWEsRUFBRSxHQUFJLEVBQTJCLENBQUM7Z0JBQ3ZELFFBQVEsR0FBRyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLGFBQWEsRUFBRSxDQUFDLENBQUM7Z0JBQzVELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUM3QixRQUFRLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNGLENBQUM7UUFFTSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQXlCLEVBQUUsU0FBaUIsRUFBRSxJQUFZLEVBQUUsT0FBa0Q7WUFDdEksTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFPOUQsTUFBTSxLQUFLLEdBQUcsWUFBc0QsQ0FBQztZQUNyRSxJQUFJLE9BQU8sS0FBSyxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDN0MsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUU7b0JBQ3ZCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtvQkFDMUIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2lCQUN4QixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQVUsRUFBRSxNQUEwQixFQUFFLEVBQUU7b0JBQ3RFLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUN4QixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDbEMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO29CQUM3RCxDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFDRixLQUFLLENBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDakQsQ0FBQztRQUNGLENBQUM7UUFFTSxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQXlCLEVBQUUsU0FBaUIsRUFBRSxPQUFvQztZQUM5RyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQU05RCxNQUFNLEtBQUssR0FBRyxZQUFzRCxDQUFDO1lBQ3JFLElBQUksT0FBTyxLQUFLLENBQUMsZUFBZSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNqRCxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNuRixDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxRQUF5QixFQUFFLFNBQWlCO1lBQ2xFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMzRSxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNELENBQUE7SUF2RlksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFRNUIsV0FBQSw2QkFBbUIsQ0FBQTtPQVJULGtCQUFrQixDQXVGOUIifQ==