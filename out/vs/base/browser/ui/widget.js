/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/common/lifecycle"], function (require, exports, dom, keyboardEvent_1, mouseEvent_1, touch_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Widget = void 0;
    class Widget extends lifecycle_1.Disposable {
        onclick(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.CLICK, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onmousedown(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_DOWN, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onmouseover(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_OVER, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onmouseleave(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_LEAVE, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onkeydown(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => listener(new keyboardEvent_1.StandardKeyboardEvent(e))));
        }
        onkeyup(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e) => listener(new keyboardEvent_1.StandardKeyboardEvent(e))));
        }
        oninput(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.INPUT, listener));
        }
        onblur(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.BLUR, listener));
        }
        onfocus(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.FOCUS, listener));
        }
        onchange(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.CHANGE, listener));
        }
        ignoreGesture(domNode) {
            return touch_1.Gesture.ignoreTarget(domNode);
        }
    }
    exports.Widget = Widget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3dpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBc0IsTUFBTyxTQUFRLHNCQUFVO1FBRXBDLE9BQU8sQ0FBQyxPQUFvQixFQUFFLFFBQWtDO1lBQ3pFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQWEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksK0JBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6SixDQUFDO1FBRVMsV0FBVyxDQUFDLE9BQW9CLEVBQUUsUUFBa0M7WUFDN0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSwrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlKLENBQUM7UUFFUyxXQUFXLENBQUMsT0FBb0IsRUFBRSxRQUFrQztZQUM3RSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLCtCQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUosQ0FBQztRQUVTLFlBQVksQ0FBQyxPQUFvQixFQUFFLFFBQWtDO1lBQzlFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQWEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksK0JBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvSixDQUFDO1FBRVMsU0FBUyxDQUFDLE9BQW9CLEVBQUUsUUFBcUM7WUFDOUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBZ0IsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUksQ0FBQztRQUVTLE9BQU8sQ0FBQyxPQUFvQixFQUFFLFFBQXFDO1lBQzVFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQWdCLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLHFDQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hJLENBQUM7UUFFUyxPQUFPLENBQUMsT0FBb0IsRUFBRSxRQUE0QjtZQUNuRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRVMsTUFBTSxDQUFDLE9BQW9CLEVBQUUsUUFBNEI7WUFDbEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVTLE9BQU8sQ0FBQyxPQUFvQixFQUFFLFFBQTRCO1lBQ25FLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFFUyxRQUFRLENBQUMsT0FBb0IsRUFBRSxRQUE0QjtZQUNwRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRVMsYUFBYSxDQUFDLE9BQW9CO1lBQzNDLE9BQU8sZUFBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxDQUFDO0tBQ0Q7SUE3Q0Qsd0JBNkNDIn0=