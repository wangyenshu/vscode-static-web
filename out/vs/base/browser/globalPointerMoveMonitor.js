/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, dom, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalPointerMoveMonitor = void 0;
    class GlobalPointerMoveMonitor {
        constructor() {
            this._hooks = new lifecycle_1.DisposableStore();
            this._pointerMoveCallback = null;
            this._onStopCallback = null;
        }
        dispose() {
            this.stopMonitoring(false);
            this._hooks.dispose();
        }
        stopMonitoring(invokeStopCallback, browserEvent) {
            if (!this.isMonitoring()) {
                // Not monitoring
                return;
            }
            // Unhook
            this._hooks.clear();
            this._pointerMoveCallback = null;
            const onStopCallback = this._onStopCallback;
            this._onStopCallback = null;
            if (invokeStopCallback && onStopCallback) {
                onStopCallback(browserEvent);
            }
        }
        isMonitoring() {
            return !!this._pointerMoveCallback;
        }
        startMonitoring(initialElement, pointerId, initialButtons, pointerMoveCallback, onStopCallback) {
            if (this.isMonitoring()) {
                this.stopMonitoring(false);
            }
            this._pointerMoveCallback = pointerMoveCallback;
            this._onStopCallback = onStopCallback;
            let eventSource = initialElement;
            try {
                initialElement.setPointerCapture(pointerId);
                this._hooks.add((0, lifecycle_1.toDisposable)(() => {
                    try {
                        initialElement.releasePointerCapture(pointerId);
                    }
                    catch (err) {
                        // See https://github.com/microsoft/vscode/issues/161731
                        //
                        // `releasePointerCapture` sometimes fails when being invoked with the exception:
                        //     DOMException: Failed to execute 'releasePointerCapture' on 'Element':
                        //     No active pointer with the given id is found.
                        //
                        // There's no need to do anything in case of failure
                    }
                }));
            }
            catch (err) {
                // See https://github.com/microsoft/vscode/issues/144584
                // See https://github.com/microsoft/vscode/issues/146947
                // `setPointerCapture` sometimes fails when being invoked
                // from a `mousedown` listener on macOS and Windows
                // and it always fails on Linux with the exception:
                //     DOMException: Failed to execute 'setPointerCapture' on 'Element':
                //     No active pointer with the given id is found.
                // In case of failure, we bind the listeners on the window
                eventSource = dom.getWindow(initialElement);
            }
            this._hooks.add(dom.addDisposableListener(eventSource, dom.EventType.POINTER_MOVE, (e) => {
                if (e.buttons !== initialButtons) {
                    // Buttons state has changed in the meantime
                    this.stopMonitoring(true);
                    return;
                }
                e.preventDefault();
                this._pointerMoveCallback(e);
            }));
            this._hooks.add(dom.addDisposableListener(eventSource, dom.EventType.POINTER_UP, (e) => this.stopMonitoring(true)));
        }
    }
    exports.GlobalPointerMoveMonitor = GlobalPointerMoveMonitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsUG9pbnRlck1vdmVNb25pdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2dsb2JhbFBvaW50ZXJNb3ZlTW9uaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSx3QkFBd0I7UUFBckM7WUFFa0IsV0FBTSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3hDLHlCQUFvQixHQUFnQyxJQUFJLENBQUM7WUFDekQsb0JBQWUsR0FBMkIsSUFBSSxDQUFDO1FBMkZ4RCxDQUFDO1FBekZPLE9BQU87WUFDYixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVNLGNBQWMsQ0FBQyxrQkFBMkIsRUFBRSxZQUEyQztZQUM3RixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQzFCLGlCQUFpQjtnQkFDakIsT0FBTztZQUNSLENBQUM7WUFFRCxTQUFTO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDNUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFFNUIsSUFBSSxrQkFBa0IsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDMUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBRU0sWUFBWTtZQUNsQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDcEMsQ0FBQztRQUVNLGVBQWUsQ0FDckIsY0FBdUIsRUFDdkIsU0FBaUIsRUFDakIsY0FBc0IsRUFDdEIsbUJBQXlDLEVBQ3pDLGNBQStCO1lBRS9CLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQztZQUNoRCxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUV0QyxJQUFJLFdBQVcsR0FBcUIsY0FBYyxDQUFDO1lBRW5ELElBQUksQ0FBQztnQkFDSixjQUFjLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7b0JBQ2pDLElBQUksQ0FBQzt3QkFDSixjQUFjLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ2pELENBQUM7b0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzt3QkFDZCx3REFBd0Q7d0JBQ3hELEVBQUU7d0JBQ0YsaUZBQWlGO3dCQUNqRiw0RUFBNEU7d0JBQzVFLG9EQUFvRDt3QkFDcEQsRUFBRTt3QkFDRixvREFBb0Q7b0JBQ3JELENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLHdEQUF3RDtnQkFDeEQsd0RBQXdEO2dCQUN4RCx5REFBeUQ7Z0JBQ3pELG1EQUFtRDtnQkFDbkQsbURBQW1EO2dCQUNuRCx3RUFBd0U7Z0JBQ3hFLG9EQUFvRDtnQkFDcEQsMERBQTBEO2dCQUMxRCxXQUFXLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUN4QyxXQUFXLEVBQ1gsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQzFCLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ0wsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLGNBQWMsRUFBRSxDQUFDO29CQUNsQyw0Q0FBNEM7b0JBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzFCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxvQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQ0QsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUN4QyxXQUFXLEVBQ1gsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQ3hCLENBQUMsQ0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUM5QyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUEvRkQsNERBK0ZDIn0=