/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WeakMapper = exports.TreeError = exports.TreeDragOverReactions = exports.TreeDragOverBubble = exports.TreeMouseEventTarget = exports.ObjectTreeElementCollapseState = exports.TreeVisibility = void 0;
    var TreeVisibility;
    (function (TreeVisibility) {
        /**
         * The tree node should be hidden.
         */
        TreeVisibility[TreeVisibility["Hidden"] = 0] = "Hidden";
        /**
         * The tree node should be visible.
         */
        TreeVisibility[TreeVisibility["Visible"] = 1] = "Visible";
        /**
         * The tree node should be visible if any of its descendants is visible.
         */
        TreeVisibility[TreeVisibility["Recurse"] = 2] = "Recurse";
    })(TreeVisibility || (exports.TreeVisibility = TreeVisibility = {}));
    var ObjectTreeElementCollapseState;
    (function (ObjectTreeElementCollapseState) {
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["Expanded"] = 0] = "Expanded";
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["Collapsed"] = 1] = "Collapsed";
        /**
         * If the element is already in the tree, preserve its current state. Else, expand it.
         */
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["PreserveOrExpanded"] = 2] = "PreserveOrExpanded";
        /**
         * If the element is already in the tree, preserve its current state. Else, collapse it.
         */
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["PreserveOrCollapsed"] = 3] = "PreserveOrCollapsed";
    })(ObjectTreeElementCollapseState || (exports.ObjectTreeElementCollapseState = ObjectTreeElementCollapseState = {}));
    var TreeMouseEventTarget;
    (function (TreeMouseEventTarget) {
        TreeMouseEventTarget[TreeMouseEventTarget["Unknown"] = 0] = "Unknown";
        TreeMouseEventTarget[TreeMouseEventTarget["Twistie"] = 1] = "Twistie";
        TreeMouseEventTarget[TreeMouseEventTarget["Element"] = 2] = "Element";
        TreeMouseEventTarget[TreeMouseEventTarget["Filter"] = 3] = "Filter";
    })(TreeMouseEventTarget || (exports.TreeMouseEventTarget = TreeMouseEventTarget = {}));
    var TreeDragOverBubble;
    (function (TreeDragOverBubble) {
        TreeDragOverBubble[TreeDragOverBubble["Down"] = 0] = "Down";
        TreeDragOverBubble[TreeDragOverBubble["Up"] = 1] = "Up";
    })(TreeDragOverBubble || (exports.TreeDragOverBubble = TreeDragOverBubble = {}));
    exports.TreeDragOverReactions = {
        acceptBubbleUp() { return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */ }; },
        acceptBubbleDown(autoExpand = false) { return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, autoExpand }; },
        acceptCopyBubbleUp() { return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */, effect: { type: 0 /* ListDragOverEffectType.Copy */, position: "drop-target" /* ListDragOverEffectPosition.Over */ } }; },
        acceptCopyBubbleDown(autoExpand = false) { return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect: { type: 0 /* ListDragOverEffectType.Copy */, position: "drop-target" /* ListDragOverEffectPosition.Over */ }, autoExpand }; }
    };
    class TreeError extends Error {
        constructor(user, message) {
            super(`TreeError [${user}] ${message}`);
        }
    }
    exports.TreeError = TreeError;
    class WeakMapper {
        constructor(fn) {
            this.fn = fn;
            this._map = new WeakMap();
        }
        map(key) {
            let result = this._map.get(key);
            if (!result) {
                result = this.fn(key);
                this._map.set(key, result);
            }
            return result;
        }
    }
    exports.WeakMapper = WeakMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS90cmVlL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLElBQWtCLGNBZ0JqQjtJQWhCRCxXQUFrQixjQUFjO1FBRS9COztXQUVHO1FBQ0gsdURBQU0sQ0FBQTtRQUVOOztXQUVHO1FBQ0gseURBQU8sQ0FBQTtRQUVQOztXQUVHO1FBQ0gseURBQU8sQ0FBQTtJQUNSLENBQUMsRUFoQmlCLGNBQWMsOEJBQWQsY0FBYyxRQWdCL0I7SUF1REQsSUFBWSw4QkFhWDtJQWJELFdBQVksOEJBQThCO1FBQ3pDLDJGQUFRLENBQUE7UUFDUiw2RkFBUyxDQUFBO1FBRVQ7O1dBRUc7UUFDSCwrR0FBa0IsQ0FBQTtRQUVsQjs7V0FFRztRQUNILGlIQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFiVyw4QkFBOEIsOENBQTlCLDhCQUE4QixRQWF6QztJQXFFRCxJQUFZLG9CQUtYO0lBTEQsV0FBWSxvQkFBb0I7UUFDL0IscUVBQU8sQ0FBQTtRQUNQLHFFQUFPLENBQUE7UUFDUCxxRUFBTyxDQUFBO1FBQ1AsbUVBQU0sQ0FBQTtJQUNQLENBQUMsRUFMVyxvQkFBb0Isb0NBQXBCLG9CQUFvQixRQUsvQjtJQWtDRCxJQUFrQixrQkFHakI7SUFIRCxXQUFrQixrQkFBa0I7UUFDbkMsMkRBQUksQ0FBQTtRQUNKLHVEQUFFLENBQUE7SUFDSCxDQUFDLEVBSGlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBR25DO0lBT1ksUUFBQSxxQkFBcUIsR0FBRztRQUNwQyxjQUFjLEtBQTRCLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sK0JBQXVCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkcsZ0JBQWdCLENBQUMsVUFBVSxHQUFHLEtBQUssSUFBMkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxpQ0FBeUIsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckksa0JBQWtCLEtBQTRCLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sK0JBQXVCLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxxQ0FBNkIsRUFBRSxRQUFRLHFEQUFpQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDak0sb0JBQW9CLENBQUMsVUFBVSxHQUFHLEtBQUssSUFBMkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxpQ0FBeUIsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLHFDQUE2QixFQUFFLFFBQVEscURBQWlDLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDbk8sQ0FBQztJQU1GLE1BQWEsU0FBVSxTQUFRLEtBQUs7UUFFbkMsWUFBWSxJQUFZLEVBQUUsT0FBZTtZQUN4QyxLQUFLLENBQUMsY0FBYyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBQ0Q7SUFMRCw4QkFLQztJQUVELE1BQWEsVUFBVTtRQUV0QixZQUFvQixFQUFlO1lBQWYsT0FBRSxHQUFGLEVBQUUsQ0FBYTtZQUUzQixTQUFJLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUZJLENBQUM7UUFJeEMsR0FBRyxDQUFDLEdBQU07WUFDVCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVoQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUFoQkQsZ0NBZ0JDIn0=