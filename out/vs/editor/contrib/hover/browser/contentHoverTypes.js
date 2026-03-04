/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentHoverVisibleData = exports.FilteredHoverResult = exports.HoverResult = void 0;
    class HoverResult {
        constructor(anchor, messages, isComplete) {
            this.anchor = anchor;
            this.messages = messages;
            this.isComplete = isComplete;
        }
        filter(anchor) {
            const filteredMessages = this.messages.filter((m) => m.isValidForHoverAnchor(anchor));
            if (filteredMessages.length === this.messages.length) {
                return this;
            }
            return new FilteredHoverResult(this, this.anchor, filteredMessages, this.isComplete);
        }
    }
    exports.HoverResult = HoverResult;
    class FilteredHoverResult extends HoverResult {
        constructor(original, anchor, messages, isComplete) {
            super(anchor, messages, isComplete);
            this.original = original;
        }
        filter(anchor) {
            return this.original.filter(anchor);
        }
    }
    exports.FilteredHoverResult = FilteredHoverResult;
    class ContentHoverVisibleData {
        constructor(initialMousePosX, initialMousePosY, colorPicker, showAtPosition, showAtSecondaryPosition, preferAbove, stoleFocus, source, isBeforeContent, disposables) {
            this.initialMousePosX = initialMousePosX;
            this.initialMousePosY = initialMousePosY;
            this.colorPicker = colorPicker;
            this.showAtPosition = showAtPosition;
            this.showAtSecondaryPosition = showAtSecondaryPosition;
            this.preferAbove = preferAbove;
            this.stoleFocus = stoleFocus;
            this.source = source;
            this.isBeforeContent = isBeforeContent;
            this.disposables = disposables;
            this.closestMouseDistance = undefined;
        }
    }
    exports.ContentHoverVisibleData = ContentHoverVisibleData;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyVHlwZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9ob3Zlci9icm93c2VyL2NvbnRlbnRIb3ZlclR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLFdBQVc7UUFFdkIsWUFDaUIsTUFBbUIsRUFDbkIsUUFBc0IsRUFDdEIsVUFBbUI7WUFGbkIsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixhQUFRLEdBQVIsUUFBUSxDQUFjO1lBQ3RCLGVBQVUsR0FBVixVQUFVLENBQVM7UUFDaEMsQ0FBQztRQUVFLE1BQU0sQ0FBQyxNQUFtQjtZQUNoQyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN0RixJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0RCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7S0FDRDtJQWZELGtDQWVDO0lBRUQsTUFBYSxtQkFBb0IsU0FBUSxXQUFXO1FBRW5ELFlBQ2tCLFFBQXFCLEVBQ3RDLE1BQW1CLEVBQ25CLFFBQXNCLEVBQ3RCLFVBQW1CO1lBRW5CLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBTG5CLGFBQVEsR0FBUixRQUFRLENBQWE7UUFNdkMsQ0FBQztRQUVlLE1BQU0sQ0FBQyxNQUFtQjtZQUN6QyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FDRDtJQWRELGtEQWNDO0lBRUQsTUFBYSx1QkFBdUI7UUFJbkMsWUFDUSxnQkFBb0MsRUFDcEMsZ0JBQW9DLEVBQzNCLFdBQWlELEVBQ2pELGNBQXdCLEVBQ3hCLHVCQUFpQyxFQUNqQyxXQUFvQixFQUNwQixVQUFtQixFQUNuQixNQUF3QixFQUN4QixlQUF3QixFQUN4QixXQUE0QjtZQVRyQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW9CO1lBQ3BDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBb0I7WUFDM0IsZ0JBQVcsR0FBWCxXQUFXLENBQXNDO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFVO1lBQ3hCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBVTtZQUNqQyxnQkFBVyxHQUFYLFdBQVcsQ0FBUztZQUNwQixlQUFVLEdBQVYsVUFBVSxDQUFTO1lBQ25CLFdBQU0sR0FBTixNQUFNLENBQWtCO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1lBQ3hCLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtZQVp0Qyx5QkFBb0IsR0FBdUIsU0FBUyxDQUFDO1FBYXhELENBQUM7S0FDTDtJQWhCRCwwREFnQkMifQ==