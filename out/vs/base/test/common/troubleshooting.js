/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beginTrackingDisposables = beginTrackingDisposables;
    exports.endTrackingDisposables = endTrackingDisposables;
    exports.beginLoggingFS = beginLoggingFS;
    exports.endLoggingFS = endLoggingFS;
    class DisposableTracker {
        constructor() {
            this.allDisposables = [];
        }
        trackDisposable(x) {
            this.allDisposables.push([x, new Error().stack]);
        }
        setParent(child, parent) {
            for (let idx = 0; idx < this.allDisposables.length; idx++) {
                if (this.allDisposables[idx][0] === child) {
                    this.allDisposables.splice(idx, 1);
                    return;
                }
            }
        }
        markAsDisposed(x) {
            for (let idx = 0; idx < this.allDisposables.length; idx++) {
                if (this.allDisposables[idx][0] === x) {
                    this.allDisposables.splice(idx, 1);
                    return;
                }
            }
        }
        markAsSingleton(disposable) {
            // noop
        }
    }
    let currentTracker = null;
    function beginTrackingDisposables() {
        currentTracker = new DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(currentTracker);
    }
    function endTrackingDisposables() {
        if (currentTracker) {
            (0, lifecycle_1.setDisposableTracker)(null);
            console.log(currentTracker.allDisposables.map(e => `${e[0]}\n${e[1]}`).join('\n\n'));
            currentTracker = null;
        }
    }
    function beginLoggingFS(withStacks = false) {
        self.beginLoggingFS?.(withStacks);
    }
    function endLoggingFS() {
        self.endLoggingFS?.();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJvdWJsZXNob290aW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi90cm91Ymxlc2hvb3RpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQ2hHLDREQUdDO0lBRUQsd0RBTUM7SUFFRCx3Q0FFQztJQUVELG9DQUVDO0lBL0NELE1BQU0saUJBQWlCO1FBQXZCO1lBQ0MsbUJBQWMsR0FBNEIsRUFBRSxDQUFDO1FBdUI5QyxDQUFDO1FBdEJBLGVBQWUsQ0FBQyxDQUFjO1lBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxFQUFFLENBQUMsS0FBTSxDQUFDLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBQ0QsU0FBUyxDQUFDLEtBQWtCLEVBQUUsTUFBbUI7WUFDaEQsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQzNELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELGNBQWMsQ0FBQyxDQUFjO1lBQzVCLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDbkMsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFDRCxlQUFlLENBQUMsVUFBdUI7WUFDdEMsT0FBTztRQUNSLENBQUM7S0FDRDtJQUVELElBQUksY0FBYyxHQUE2QixJQUFJLENBQUM7SUFFcEQsU0FBZ0Isd0JBQXdCO1FBQ3ZDLGNBQWMsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7UUFDekMsSUFBQSxnQ0FBb0IsRUFBQyxjQUFjLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBZ0Isc0JBQXNCO1FBQ3JDLElBQUksY0FBYyxFQUFFLENBQUM7WUFDcEIsSUFBQSxnQ0FBb0IsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNyRixjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLGFBQXNCLEtBQUs7UUFDbkQsSUFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxTQUFnQixZQUFZO1FBQ3JCLElBQUssQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO0lBQzlCLENBQUMifQ==