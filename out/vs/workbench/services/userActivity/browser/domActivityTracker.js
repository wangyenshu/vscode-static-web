/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom, window_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DomActivityTracker = void 0;
    /**
     * This uses a time interval and checks whether there's any activity in that
     * interval. A naive approach might be to use a debounce whenever an event
     * happens, but this has some scheduling overhead. Instead, the tracker counts
     * how many intervals have elapsed since any activity happened.
     *
     * If there's more than `MIN_INTERVALS_WITHOUT_ACTIVITY`, then say the user is
     * inactive. Therefore the maximum time before an inactive user is detected
     * is `CHECK_INTERVAL * (MIN_INTERVALS_WITHOUT_ACTIVITY + 1)`.
     */
    const CHECK_INTERVAL = 30_000;
    /** See {@link CHECK_INTERVAL} */
    const MIN_INTERVALS_WITHOUT_ACTIVITY = 2;
    const eventListenerOptions = {
        passive: true, /** does not preventDefault() */
        capture: true, /** should dispatch first (before anyone stopPropagation()) */
    };
    class DomActivityTracker extends lifecycle_1.Disposable {
        constructor(userActivityService) {
            super();
            let intervalsWithoutActivity = MIN_INTERVALS_WITHOUT_ACTIVITY;
            const intervalTimer = this._register(new dom.WindowIntervalTimer());
            const activeMutex = this._register(new lifecycle_1.MutableDisposable());
            activeMutex.value = userActivityService.markActive();
            const onInterval = () => {
                if (++intervalsWithoutActivity === MIN_INTERVALS_WITHOUT_ACTIVITY) {
                    activeMutex.clear();
                    intervalTimer.cancel();
                }
            };
            const onActivity = (targetWindow) => {
                // if was inactive, they've now returned
                if (intervalsWithoutActivity === MIN_INTERVALS_WITHOUT_ACTIVITY) {
                    activeMutex.value = userActivityService.markActive();
                    intervalTimer.cancelAndSet(onInterval, CHECK_INTERVAL, targetWindow);
                }
                intervalsWithoutActivity = 0;
            };
            this._register(event_1.Event.runAndSubscribe(dom.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add(dom.addDisposableListener(window.document, 'touchstart', () => onActivity(window), eventListenerOptions));
                disposables.add(dom.addDisposableListener(window.document, 'mousedown', () => onActivity(window), eventListenerOptions));
                disposables.add(dom.addDisposableListener(window.document, 'keydown', () => onActivity(window), eventListenerOptions));
            }, { window: window_1.mainWindow, disposables: this._store }));
            onActivity(window_1.mainWindow);
        }
    }
    exports.DomActivityTracker = DomActivityTracker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tQWN0aXZpdHlUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJBY3Rpdml0eS9icm93c2VyL2RvbUFjdGl2aXR5VHJhY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEc7Ozs7Ozs7OztPQVNHO0lBQ0gsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0lBRTlCLGlDQUFpQztJQUNqQyxNQUFNLDhCQUE4QixHQUFHLENBQUMsQ0FBQztJQUV6QyxNQUFNLG9CQUFvQixHQUE0QjtRQUNyRCxPQUFPLEVBQUUsSUFBSSxFQUFFLGdDQUFnQztRQUMvQyxPQUFPLEVBQUUsSUFBSSxFQUFFLDhEQUE4RDtLQUM3RSxDQUFDO0lBRUYsTUFBYSxrQkFBbUIsU0FBUSxzQkFBVTtRQUNqRCxZQUFZLG1CQUF5QztZQUNwRCxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksd0JBQXdCLEdBQUcsOEJBQThCLENBQUM7WUFDOUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUM1RCxXQUFXLENBQUMsS0FBSyxHQUFHLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXJELE1BQU0sVUFBVSxHQUFHLEdBQUcsRUFBRTtnQkFDdkIsSUFBSSxFQUFFLHdCQUF3QixLQUFLLDhCQUE4QixFQUFFLENBQUM7b0JBQ25FLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDcEIsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQUcsQ0FBQyxZQUF3QyxFQUFFLEVBQUU7Z0JBQy9ELHdDQUF3QztnQkFDeEMsSUFBSSx3QkFBd0IsS0FBSyw4QkFBOEIsRUFBRSxDQUFDO29CQUNqRSxXQUFXLENBQUMsS0FBSyxHQUFHLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNyRCxhQUFhLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3RFLENBQUM7Z0JBRUQsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO2dCQUN6RixXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUMxSCxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUN6SCxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3hILENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxtQkFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRELFVBQVUsQ0FBQyxtQkFBVSxDQUFDLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBbENELGdEQWtDQyJ9