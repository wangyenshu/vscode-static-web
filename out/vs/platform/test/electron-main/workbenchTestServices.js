/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event"], function (require, exports, async_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryTestStateMainService = exports.TestLifecycleMainService = void 0;
    class TestLifecycleMainService {
        constructor() {
            this.onBeforeShutdown = event_1.Event.None;
            this._onWillShutdown = new event_1.Emitter();
            this.onWillShutdown = this._onWillShutdown.event;
            this.onWillLoadWindow = event_1.Event.None;
            this.onBeforeCloseWindow = event_1.Event.None;
            this.wasRestarted = false;
            this.quitRequested = false;
            this.phase = 2 /* LifecycleMainPhase.Ready */;
        }
        async fireOnWillShutdown() {
            const joiners = [];
            this._onWillShutdown.fire({
                reason: 1 /* ShutdownReason.QUIT */,
                join(id, promise) {
                    joiners.push(promise);
                }
            });
            await async_1.Promises.settled(joiners);
        }
        registerWindow(window) { }
        registerAuxWindow(auxWindow) { }
        async reload(window, cli) { }
        async unload(window, reason) { return true; }
        setRelaunchHandler(handler) { }
        async relaunch(options) { }
        async quit(willRestart) { return true; }
        async kill(code) { }
        async when(phase) { }
    }
    exports.TestLifecycleMainService = TestLifecycleMainService;
    class InMemoryTestStateMainService {
        constructor() {
            this.data = new Map();
        }
        setItem(key, data) {
            this.data.set(key, data);
        }
        setItems(items) {
            for (const { key, data } of items) {
                this.data.set(key, data);
            }
        }
        getItem(key) {
            return this.data.get(key);
        }
        removeItem(key) {
            this.data.delete(key);
        }
        async close() { }
    }
    exports.InMemoryTestStateMainService = InMemoryTestStateMainService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVzdC9lbGVjdHJvbi1tYWluL3dvcmtiZW5jaFRlc3RTZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSx3QkFBd0I7UUFBckM7WUFJQyxxQkFBZ0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBRWIsb0JBQWUsR0FBRyxJQUFJLGVBQU8sRUFBaUIsQ0FBQztZQUN2RCxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBZXJELHFCQUFnQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDOUIsd0JBQW1CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUVqQyxpQkFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQixrQkFBYSxHQUFHLEtBQUssQ0FBQztZQUV0QixVQUFLLG9DQUE0QjtRQVdsQyxDQUFDO1FBOUJBLEtBQUssQ0FBQyxrQkFBa0I7WUFDdkIsTUFBTSxPQUFPLEdBQW9CLEVBQUUsQ0FBQztZQUVwQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQztnQkFDekIsTUFBTSw2QkFBcUI7Z0JBQzNCLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTztvQkFDZixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBVUQsY0FBYyxDQUFDLE1BQW1CLElBQVUsQ0FBQztRQUM3QyxpQkFBaUIsQ0FBQyxTQUEyQixJQUFVLENBQUM7UUFDeEQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFtQixFQUFFLEdBQXNCLElBQW1CLENBQUM7UUFDNUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFtQixFQUFFLE1BQW9CLElBQXNCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRixrQkFBa0IsQ0FBQyxPQUF5QixJQUFVLENBQUM7UUFDdkQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUErRSxJQUFtQixDQUFDO1FBQ2xILEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBcUIsSUFBc0IsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBYSxJQUFtQixDQUFDO1FBQzVDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBeUIsSUFBbUIsQ0FBQztLQUN4RDtJQXZDRCw0REF1Q0M7SUFFRCxNQUFhLDRCQUE0QjtRQUF6QztZQUlrQixTQUFJLEdBQUcsSUFBSSxHQUFHLEVBQWlFLENBQUM7UUFxQmxHLENBQUM7UUFuQkEsT0FBTyxDQUFDLEdBQVcsRUFBRSxJQUE0RDtZQUNoRixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELFFBQVEsQ0FBQyxLQUErRjtZQUN2RyxLQUFLLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sQ0FBSSxHQUFXO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFrQixDQUFDO1FBQzVDLENBQUM7UUFFRCxVQUFVLENBQUMsR0FBVztZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUssS0FBb0IsQ0FBQztLQUNoQztJQXpCRCxvRUF5QkMifQ==