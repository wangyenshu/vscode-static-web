/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, DOM, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellPartsCollection = exports.CellOverlayPart = exports.CellContentPart = void 0;
    /**
     * A content part is a non-floating element that is rendered inside a cell.
     * The rendering of the content part is synchronous to avoid flickering.
     */
    class CellContentPart extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.cellDisposables = new lifecycle_1.DisposableStore();
        }
        /**
         * Prepare model for cell part rendering
         * No DOM operations recommended within this operation
         */
        prepareRenderCell(element) { }
        /**
         * Update the DOM for the cell `element`
         */
        renderCell(element) {
            this.currentCell = element;
            safeInvokeNoArg(() => this.didRenderCell(element));
        }
        didRenderCell(element) { }
        /**
         * Dispose any disposables generated from `didRenderCell`
         */
        unrenderCell(element) {
            this.currentCell = undefined;
            this.cellDisposables.clear();
        }
        /**
         * Perform DOM read operations to prepare for the list/cell layout update.
         */
        prepareLayout() { }
        /**
         * Update internal DOM (top positions) per cell layout info change
         * Note that a cell part doesn't need to call `DOM.scheduleNextFrame`,
         * the list view will ensure that layout call is invoked in the right frame
         */
        updateInternalLayoutNow(element) { }
        /**
         * Update per cell state change
         */
        updateState(element, e) { }
        /**
         * Update per execution state change.
         */
        updateForExecutionState(element, e) { }
    }
    exports.CellContentPart = CellContentPart;
    /**
     * An overlay part renders on top of other components.
     * The rendering of the overlay part might be postponed to the next animation frame to avoid forced reflow.
     */
    class CellOverlayPart extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.cellDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        /**
         * Prepare model for cell part rendering
         * No DOM operations recommended within this operation
         */
        prepareRenderCell(element) { }
        /**
         * Update the DOM for the cell `element`
         */
        renderCell(element) {
            this.currentCell = element;
            this.didRenderCell(element);
        }
        didRenderCell(element) { }
        /**
         * Dispose any disposables generated from `didRenderCell`
         */
        unrenderCell(element) {
            this.currentCell = undefined;
            this.cellDisposables.clear();
        }
        /**
         * Update internal DOM (top positions) per cell layout info change
         * Note that a cell part doesn't need to call `DOM.scheduleNextFrame`,
         * the list view will ensure that layout call is invoked in the right frame
         */
        updateInternalLayoutNow(element) { }
        /**
         * Update per cell state change
         */
        updateState(element, e) { }
        /**
         * Update per execution state change.
         */
        updateForExecutionState(element, e) { }
    }
    exports.CellOverlayPart = CellOverlayPart;
    function safeInvokeNoArg(func) {
        try {
            return func();
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return null;
        }
    }
    class CellPartsCollection extends lifecycle_1.Disposable {
        constructor(targetWindow, contentParts, overlayParts) {
            super();
            this.targetWindow = targetWindow;
            this.contentParts = contentParts;
            this.overlayParts = overlayParts;
            this._scheduledOverlayRendering = this._register(new lifecycle_1.MutableDisposable());
            this._scheduledOverlayUpdateState = this._register(new lifecycle_1.MutableDisposable());
            this._scheduledOverlayUpdateExecutionState = this._register(new lifecycle_1.MutableDisposable());
        }
        concatContentPart(other, targetWindow) {
            return new CellPartsCollection(targetWindow, this.contentParts.concat(other), this.overlayParts);
        }
        concatOverlayPart(other, targetWindow) {
            return new CellPartsCollection(targetWindow, this.contentParts, this.overlayParts.concat(other));
        }
        scheduleRenderCell(element) {
            // prepare model
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.prepareRenderCell(element));
            }
            for (const part of this.overlayParts) {
                safeInvokeNoArg(() => part.prepareRenderCell(element));
            }
            // render content parts
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.renderCell(element));
            }
            this._scheduledOverlayRendering.value = DOM.modify(this.targetWindow, () => {
                for (const part of this.overlayParts) {
                    safeInvokeNoArg(() => part.renderCell(element));
                }
            });
        }
        unrenderCell(element) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.unrenderCell(element));
            }
            this._scheduledOverlayRendering.value = undefined;
            this._scheduledOverlayUpdateState.value = undefined;
            this._scheduledOverlayUpdateExecutionState.value = undefined;
            for (const part of this.overlayParts) {
                safeInvokeNoArg(() => part.unrenderCell(element));
            }
        }
        updateInternalLayoutNow(viewCell) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.updateInternalLayoutNow(viewCell));
            }
            for (const part of this.overlayParts) {
                safeInvokeNoArg(() => part.updateInternalLayoutNow(viewCell));
            }
        }
        prepareLayout() {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.prepareLayout());
            }
        }
        updateState(viewCell, e) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.updateState(viewCell, e));
            }
            this._scheduledOverlayUpdateState.value = DOM.modify(this.targetWindow, () => {
                for (const part of this.overlayParts) {
                    safeInvokeNoArg(() => part.updateState(viewCell, e));
                }
            });
        }
        updateForExecutionState(viewCell, e) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.updateForExecutionState(viewCell, e));
            }
            this._scheduledOverlayUpdateExecutionState.value = DOM.modify(this.targetWindow, () => {
                for (const part of this.overlayParts) {
                    safeInvokeNoArg(() => part.updateForExecutionState(viewCell, e));
                }
            });
        }
    }
    exports.CellPartsCollection = CellPartsCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFBhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHOzs7T0FHRztJQUNILE1BQXNCLGVBQWdCLFNBQVEsc0JBQVU7UUFJdkQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUhVLG9CQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFJM0QsQ0FBQztRQUVEOzs7V0FHRztRQUNILGlCQUFpQixDQUFDLE9BQXVCLElBQVUsQ0FBQztRQUVwRDs7V0FFRztRQUNILFVBQVUsQ0FBQyxPQUF1QjtZQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztZQUMzQixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxhQUFhLENBQUMsT0FBdUIsSUFBVSxDQUFDO1FBRWhEOztXQUVHO1FBQ0gsWUFBWSxDQUFDLE9BQXVCO1lBQ25DLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDOUIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsYUFBYSxLQUFXLENBQUM7UUFFekI7Ozs7V0FJRztRQUNILHVCQUF1QixDQUFDLE9BQXVCLElBQVUsQ0FBQztRQUUxRDs7V0FFRztRQUNILFdBQVcsQ0FBQyxPQUF1QixFQUFFLENBQWdDLElBQVUsQ0FBQztRQUVoRjs7V0FFRztRQUNILHVCQUF1QixDQUFDLE9BQXVCLEVBQUUsQ0FBa0MsSUFBVSxDQUFDO0tBQzlGO0lBckRELDBDQXFEQztJQUVEOzs7T0FHRztJQUNILE1BQXNCLGVBQWdCLFNBQVEsc0JBQVU7UUFJdkQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUhVLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1FBSTNFLENBQUM7UUFFRDs7O1dBR0c7UUFDSCxpQkFBaUIsQ0FBQyxPQUF1QixJQUFVLENBQUM7UUFFcEQ7O1dBRUc7UUFDSCxVQUFVLENBQUMsT0FBdUI7WUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUM7WUFDM0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQXVCLElBQVUsQ0FBQztRQUVoRDs7V0FFRztRQUNILFlBQVksQ0FBQyxPQUF1QjtZQUNuQyxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztZQUM3QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFRDs7OztXQUlHO1FBQ0gsdUJBQXVCLENBQUMsT0FBdUIsSUFBVSxDQUFDO1FBRTFEOztXQUVHO1FBQ0gsV0FBVyxDQUFDLE9BQXVCLEVBQUUsQ0FBZ0MsSUFBVSxDQUFDO1FBRWhGOztXQUVHO1FBQ0gsdUJBQXVCLENBQUMsT0FBdUIsRUFBRSxDQUFrQyxJQUFVLENBQUM7S0FDOUY7SUFoREQsMENBZ0RDO0lBRUQsU0FBUyxlQUFlLENBQUksSUFBYTtRQUN4QyxJQUFJLENBQUM7WUFDSixPQUFPLElBQUksRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixJQUFBLDBCQUFpQixFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFhLG1CQUFvQixTQUFRLHNCQUFVO1FBS2xELFlBQ2tCLFlBQW9CLEVBQ3BCLFlBQXdDLEVBQ3hDLFlBQXdDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBSlMsaUJBQVksR0FBWixZQUFZLENBQVE7WUFDcEIsaUJBQVksR0FBWixZQUFZLENBQTRCO1lBQ3hDLGlCQUFZLEdBQVosWUFBWSxDQUE0QjtZQVB6QywrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLGlDQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDdkUsMENBQXFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztRQVFqRyxDQUFDO1FBRUQsaUJBQWlCLENBQUMsS0FBaUMsRUFBRSxZQUFvQjtZQUN4RSxPQUFPLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRUQsaUJBQWlCLENBQUMsS0FBaUMsRUFBRSxZQUFvQjtZQUN4RSxPQUFPLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRUQsa0JBQWtCLENBQUMsT0FBdUI7WUFDekMsZ0JBQWdCO1lBQ2hCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBRUQsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUMxRSxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDakQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELFlBQVksQ0FBQyxPQUF1QjtZQUNuQyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBRUQsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDbEQsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDcEQsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFFN0QsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3RDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNGLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxRQUF3QjtZQUMvQyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUM7UUFDRixDQUFDO1FBRUQsYUFBYTtZQUNaLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFFRCxXQUFXLENBQUMsUUFBd0IsRUFBRSxDQUFnQztZQUNyRSxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUVELElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtnQkFDNUUsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3RDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsdUJBQXVCLENBQUMsUUFBd0IsRUFBRSxDQUFrQztZQUNuRixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBRUQsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUNyRixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDdEMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBaEdELGtEQWdHQyJ9