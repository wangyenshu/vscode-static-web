/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedListVirtualDelegate = exports.ListError = exports.ListDragOverReactions = exports.ListDragOverEffectPosition = exports.ListDragOverEffectType = void 0;
    var ListDragOverEffectType;
    (function (ListDragOverEffectType) {
        ListDragOverEffectType[ListDragOverEffectType["Copy"] = 0] = "Copy";
        ListDragOverEffectType[ListDragOverEffectType["Move"] = 1] = "Move";
    })(ListDragOverEffectType || (exports.ListDragOverEffectType = ListDragOverEffectType = {}));
    var ListDragOverEffectPosition;
    (function (ListDragOverEffectPosition) {
        ListDragOverEffectPosition["Over"] = "drop-target";
        ListDragOverEffectPosition["Before"] = "drop-target-before";
        ListDragOverEffectPosition["After"] = "drop-target-after";
    })(ListDragOverEffectPosition || (exports.ListDragOverEffectPosition = ListDragOverEffectPosition = {}));
    exports.ListDragOverReactions = {
        reject() { return { accept: false }; },
        accept() { return { accept: true }; },
    };
    class ListError extends Error {
        constructor(user, message) {
            super(`ListError [${user}] ${message}`);
        }
    }
    exports.ListError = ListError;
    class CachedListVirtualDelegate {
        constructor() {
            this.cache = new WeakMap();
        }
        getHeight(element) {
            return this.cache.get(element) ?? this.estimateHeight(element);
        }
        setDynamicHeight(element, height) {
            if (height > 0) {
                this.cache.set(element, height);
            }
        }
    }
    exports.CachedListVirtualDelegate = CachedListVirtualDelegate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9saXN0L2xpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUZoRyxJQUFrQixzQkFHakI7SUFIRCxXQUFrQixzQkFBc0I7UUFDdkMsbUVBQUksQ0FBQTtRQUNKLG1FQUFJLENBQUE7SUFDTCxDQUFDLEVBSGlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBR3ZDO0lBRUQsSUFBa0IsMEJBSWpCO0lBSkQsV0FBa0IsMEJBQTBCO1FBQzNDLGtEQUFvQixDQUFBO1FBQ3BCLDJEQUE2QixDQUFBO1FBQzdCLHlEQUEyQixDQUFBO0lBQzVCLENBQUMsRUFKaUIsMEJBQTBCLDBDQUExQiwwQkFBMEIsUUFJM0M7SUFhWSxRQUFBLHFCQUFxQixHQUFHO1FBQ3BDLE1BQU0sS0FBNEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxLQUE0QixPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM1RCxDQUFDO0lBZ0JGLE1BQWEsU0FBVSxTQUFRLEtBQUs7UUFFbkMsWUFBWSxJQUFZLEVBQUUsT0FBZTtZQUN4QyxLQUFLLENBQUMsY0FBYyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBQ0Q7SUFMRCw4QkFLQztJQUVELE1BQXNCLHlCQUF5QjtRQUEvQztZQUVTLFVBQUssR0FBRyxJQUFJLE9BQU8sRUFBYSxDQUFDO1FBYzFDLENBQUM7UUFaQSxTQUFTLENBQUMsT0FBVTtZQUNuQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUtELGdCQUFnQixDQUFDLE9BQVUsRUFBRSxNQUFjO1lBQzFDLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWhCRCw4REFnQkMifQ==