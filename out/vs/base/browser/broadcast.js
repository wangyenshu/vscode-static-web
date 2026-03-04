/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, window_1, errors_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BroadcastDataChannel = void 0;
    class BroadcastDataChannel extends lifecycle_1.Disposable {
        constructor(channelName) {
            super();
            this.channelName = channelName;
            this._onDidReceiveData = this._register(new event_1.Emitter());
            this.onDidReceiveData = this._onDidReceiveData.event;
            // Use BroadcastChannel
            if ('BroadcastChannel' in window_1.mainWindow) {
                try {
                    this.broadcastChannel = new BroadcastChannel(channelName);
                    const listener = (event) => {
                        this._onDidReceiveData.fire(event.data);
                    };
                    this.broadcastChannel.addEventListener('message', listener);
                    this._register((0, lifecycle_1.toDisposable)(() => {
                        if (this.broadcastChannel) {
                            this.broadcastChannel.removeEventListener('message', listener);
                            this.broadcastChannel.close();
                        }
                    }));
                }
                catch (error) {
                    console.warn('Error while creating broadcast channel. Falling back to localStorage.', (0, errors_1.getErrorMessage)(error));
                }
            }
            // BroadcastChannel is not supported. Use storage.
            if (!this.broadcastChannel) {
                this.channelName = `BroadcastDataChannel.${channelName}`;
                this.createBroadcastChannel();
            }
        }
        createBroadcastChannel() {
            const listener = (event) => {
                if (event.key === this.channelName && event.newValue) {
                    this._onDidReceiveData.fire(JSON.parse(event.newValue));
                }
            };
            window_1.mainWindow.addEventListener('storage', listener);
            this._register((0, lifecycle_1.toDisposable)(() => window_1.mainWindow.removeEventListener('storage', listener)));
        }
        /**
         * Sends the data to other BroadcastChannel objects set up for this channel. Data can be structured objects, e.g. nested objects and arrays.
         * @param data data to broadcast
         */
        postData(data) {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(data);
            }
            else {
                // remove previous changes so that event is triggered even if new changes are same as old changes
                localStorage.removeItem(this.channelName);
                localStorage.setItem(this.channelName, JSON.stringify(data));
            }
        }
    }
    exports.BroadcastDataChannel = BroadcastDataChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvYWRjYXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2Jyb2FkY2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxvQkFBd0IsU0FBUSxzQkFBVTtRQU90RCxZQUE2QixXQUFtQjtZQUMvQyxLQUFLLEVBQUUsQ0FBQztZQURvQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUgvQixzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFLLENBQUMsQ0FBQztZQUM3RCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBS3hELHVCQUF1QjtZQUN2QixJQUFJLGtCQUFrQixJQUFJLG1CQUFVLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDO29CQUNKLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUMxRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQW1CLEVBQUUsRUFBRTt3QkFDeEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pDLENBQUMsQ0FBQztvQkFDRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUM1RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7d0JBQ2hDLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7NEJBQzNCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7NEJBQy9ELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDL0IsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNMLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyx1RUFBdUUsRUFBRSxJQUFBLHdCQUFlLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDL0csQ0FBQztZQUNGLENBQUM7WUFFRCxrREFBa0Q7WUFDbEQsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLHdCQUF3QixXQUFXLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFTyxzQkFBc0I7WUFDN0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFtQixFQUFFLEVBQUU7Z0JBQ3hDLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0YsbUJBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsbUJBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRDs7O1dBR0c7UUFDSCxRQUFRLENBQUMsSUFBTztZQUNmLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGlHQUFpRztnQkFDakcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUQsQ0FBQztRQUNGLENBQUM7S0FDRDtJQTNERCxvREEyREMifQ==