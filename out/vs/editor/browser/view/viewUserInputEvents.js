/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position"], function (require, exports, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewUserInputEvents = void 0;
    class ViewUserInputEvents {
        constructor(coordinatesConverter) {
            this.onKeyDown = null;
            this.onKeyUp = null;
            this.onContextMenu = null;
            this.onMouseMove = null;
            this.onMouseLeave = null;
            this.onMouseDown = null;
            this.onMouseUp = null;
            this.onMouseDrag = null;
            this.onMouseDrop = null;
            this.onMouseDropCanceled = null;
            this.onMouseWheel = null;
            this._coordinatesConverter = coordinatesConverter;
        }
        emitKeyDown(e) {
            this.onKeyDown?.(e);
        }
        emitKeyUp(e) {
            this.onKeyUp?.(e);
        }
        emitContextMenu(e) {
            this.onContextMenu?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseMove(e) {
            this.onMouseMove?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseLeave(e) {
            this.onMouseLeave?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDown(e) {
            this.onMouseDown?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseUp(e) {
            this.onMouseUp?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDrag(e) {
            this.onMouseDrag?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDrop(e) {
            this.onMouseDrop?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDropCanceled() {
            this.onMouseDropCanceled?.();
        }
        emitMouseWheel(e) {
            this.onMouseWheel?.(e);
        }
        _convertViewToModelMouseEvent(e) {
            if (e.target) {
                return {
                    event: e.event,
                    target: this._convertViewToModelMouseTarget(e.target)
                };
            }
            return e;
        }
        _convertViewToModelMouseTarget(target) {
            return ViewUserInputEvents.convertViewToModelMouseTarget(target, this._coordinatesConverter);
        }
        static convertViewToModelMouseTarget(target, coordinatesConverter) {
            const result = { ...target };
            if (result.position) {
                result.position = coordinatesConverter.convertViewPositionToModelPosition(result.position);
            }
            if (result.range) {
                result.range = coordinatesConverter.convertViewRangeToModelRange(result.range);
            }
            if (result.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */ || result.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                result.detail = this.convertViewToModelViewZoneData(result.detail, coordinatesConverter);
            }
            return result;
        }
        static convertViewToModelViewZoneData(data, coordinatesConverter) {
            return {
                viewZoneId: data.viewZoneId,
                positionBefore: data.positionBefore ? coordinatesConverter.convertViewPositionToModelPosition(data.positionBefore) : data.positionBefore,
                positionAfter: data.positionAfter ? coordinatesConverter.convertViewPositionToModelPosition(data.positionAfter) : data.positionAfter,
                position: coordinatesConverter.convertViewPositionToModelPosition(data.position),
                afterLineNumber: coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(data.afterLineNumber, 1)).lineNumber,
            };
        }
    }
    exports.ViewUserInputEvents = ViewUserInputEvents;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1VzZXJJbnB1dEV2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXcvdmlld1VzZXJJbnB1dEV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBYSxtQkFBbUI7UUFnQi9CLFlBQVksb0JBQTJDO1lBZGhELGNBQVMsR0FBeUMsSUFBSSxDQUFDO1lBQ3ZELFlBQU8sR0FBeUMsSUFBSSxDQUFDO1lBQ3JELGtCQUFhLEdBQTRDLElBQUksQ0FBQztZQUM5RCxnQkFBVyxHQUE0QyxJQUFJLENBQUM7WUFDNUQsaUJBQVksR0FBbUQsSUFBSSxDQUFDO1lBQ3BFLGdCQUFXLEdBQTRDLElBQUksQ0FBQztZQUM1RCxjQUFTLEdBQTRDLElBQUksQ0FBQztZQUMxRCxnQkFBVyxHQUE0QyxJQUFJLENBQUM7WUFDNUQsZ0JBQVcsR0FBbUQsSUFBSSxDQUFDO1lBQ25FLHdCQUFtQixHQUErQixJQUFJLENBQUM7WUFDdkQsaUJBQVksR0FBMkMsSUFBSSxDQUFDO1lBS2xFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztRQUNuRCxDQUFDO1FBRU0sV0FBVyxDQUFDLENBQWlCO1lBQ25DLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRU0sU0FBUyxDQUFDLENBQWlCO1lBQ2pDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRU0sZUFBZSxDQUFDLENBQW9CO1lBQzFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRU0sYUFBYSxDQUFDLENBQW9CO1lB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