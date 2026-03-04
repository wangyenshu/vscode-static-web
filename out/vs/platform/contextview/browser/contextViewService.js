/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/ui/contextview/contextview", "vs/base/common/lifecycle", "vs/platform/layout/browser/layoutService", "vs/base/browser/dom"], function (require, exports, contextview_1, lifecycle_1, layoutService_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextViewService = exports.ContextViewHandler = void 0;
    let ContextViewHandler = class ContextViewHandler extends lifecycle_1.Disposable {
        constructor(layoutService) {
            super();
            this.layoutService = layoutService;
            this.contextView = this._register(new contextview_1.ContextView(this.layoutService.mainContainer, 1 /* ContextViewDOMPosition.ABSOLUTE */));
            this.layout();
            this._register(layoutService.onDidLayoutContainer(() => this.layout()));
        }
        // ContextView
        showContextView(delegate, container, shadowRoot) {
            let domPosition;
            if (container) {
                if (container === this.layoutService.getContainer((0, dom_1.getWindow)(container))) {
                    domPosition = 1 /* ContextViewDOMPosition.ABSOLUTE */;
                }
                else if (shadowRoot) {
                    domPosition = 3 /* ContextViewDOMPosition.FIXED_SHADOW */;
                }
                else {
                    domPosition = 2 /* ContextViewDOMPosition.FIXED */;
                }
            }
            else {
                domPosition = 1 /* ContextViewDOMPosition.ABSOLUTE */;
            }
            this.contextView.setContainer(container ?? this.layoutService.activeContainer, domPosition);
            this.contextView.show(delegate);
            const openContextView = {
                close: () => {
                    if (this.openContextView === openContextView) {
                        this.hideContextView();
                    }
                }
            };
            this.openContextView = openContextView;
            return openContextView;
        }
        layout() {
            this.contextView.layout();
        }
        hideContextView(data) {
            this.contextView.hide(data);
            this.openContextView = undefined;
        }
    };
    exports.ContextViewHandler = ContextViewHandler;
    exports.ContextViewHandler = ContextViewHandler = __decorate([
        __param(0, layoutService_1.ILayoutService)
    ], ContextViewHandler);
    class ContextViewService extends ContextViewHandler {
        getContextViewElement() {
            return this.contextView.getViewElement();
        }
    }
    exports.ContextViewService = ContextViewService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dFZpZXdTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29udGV4dHZpZXcvYnJvd3Nlci9jb250ZXh0Vmlld1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUFLakQsWUFDaUIsYUFBOEM7WUFFOUQsS0FBSyxFQUFFLENBQUM7WUFGeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBSDVDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLDBDQUFrQyxDQUFDLENBQUM7WUFPbkksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsY0FBYztRQUVkLGVBQWUsQ0FBQyxRQUE4QixFQUFFLFNBQXVCLEVBQUUsVUFBb0I7WUFDNUYsSUFBSSxXQUFtQyxDQUFDO1lBQ3hDLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxTQUFTLEtBQUssSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBQSxlQUFTLEVBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN6RSxXQUFXLDBDQUFrQyxDQUFDO2dCQUMvQyxDQUFDO3FCQUFNLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ3ZCLFdBQVcsOENBQXNDLENBQUM7Z0JBQ25ELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLHVDQUErQixDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFdBQVcsMENBQWtDLENBQUM7WUFDL0MsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUU1RixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVoQyxNQUFNLGVBQWUsR0FBcUI7Z0JBQ3pDLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ1gsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLGVBQWUsRUFBRSxDQUFDO3dCQUM5QyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3hCLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUM7WUFFRixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztZQUN2QyxPQUFPLGVBQWUsQ0FBQztRQUN4QixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELGVBQWUsQ0FBQyxJQUFVO1lBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1FBQ2xDLENBQUM7S0FDRCxDQUFBO0lBdERZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBTTVCLFdBQUEsOEJBQWMsQ0FBQTtPQU5KLGtCQUFrQixDQXNEOUI7SUFFRCxNQUFhLGtCQUFtQixTQUFRLGtCQUFrQjtRQUl6RCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzFDLENBQUM7S0FDRDtJQVBELGdEQU9DIn0=