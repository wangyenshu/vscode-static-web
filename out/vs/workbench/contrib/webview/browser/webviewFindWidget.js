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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/workbench/contrib/webview/browser/webview"], function (require, exports, contextkey_1, contextView_1, hover_1, keybinding_1, simpleFindWidget_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewFindWidget = void 0;
    let WebviewFindWidget = class WebviewFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        async _getResultCount(dataChanged) {
            return undefined;
        }
        constructor(_delegate, contextViewService, contextKeyService, hoverService, keybindingService) {
            super({
                showCommonFindToggles: false,
                checkImeCompletionState: _delegate.checkImeCompletionState,
                enableSash: true,
            }, contextViewService, contextKeyService, hoverService, keybindingService);
            this._delegate = _delegate;
            this._findWidgetFocused = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED.bindTo(contextKeyService);
            this._register(_delegate.hasFindResult(hasResult => {
                this.updateButtons(hasResult);
                this.focusFindBox();
            }));
            this._register(_delegate.onDidStopFind(() => {
                this.updateButtons(false);
            }));
        }
        find(previous) {
            const val = this.inputValue;
            if (val) {
                this._delegate.find(val, previous);
            }
        }
        hide(animated = true) {
            super.hide(animated);
            this._delegate.stopFind(true);
            this._delegate.focus();
        }
        _onInputChanged() {
            const val = this.inputValue;
            if (val) {
                this._delegate.updateFind(val);
            }
            else {
                this._delegate.stopFind(false);
            }
            return false;
        }
        _onFocusTrackerFocus() {
            this._findWidgetFocused.set(true);
        }
        _onFocusTrackerBlur() {
            this._findWidgetFocused.reset();
        }
        _onFindInputFocusTrackerFocus() { }
        _onFindInputFocusTrackerBlur() { }
        findFirst() { }
    };
    exports.WebviewFindWidget = WebviewFindWidget;
    exports.WebviewFindWidget = WebviewFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, hover_1.IHoverService),
        __param(4, keybinding_1.IKeybindingService)
    ], WebviewFindWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0ZpbmRXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2Jyb3dzZXIvd2Vidmlld0ZpbmRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLG1DQUFnQjtRQUM1QyxLQUFLLENBQUMsZUFBZSxDQUFDLFdBQXFCO1lBQ3BELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFJRCxZQUNrQixTQUE4QixFQUMxQixrQkFBdUMsRUFDeEMsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQ3RCLGlCQUFxQztZQUV6RCxLQUFLLENBQUM7Z0JBQ0wscUJBQXFCLEVBQUUsS0FBSztnQkFDNUIsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLHVCQUF1QjtnQkFDMUQsVUFBVSxFQUFFLElBQUk7YUFDaEIsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQVYxRCxjQUFTLEdBQVQsU0FBUyxDQUFxQjtZQVcvQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsd0RBQThDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFbkcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNsRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM5QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTSxJQUFJLENBQUMsUUFBaUI7WUFDNUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM1QixJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUVlLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSTtZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVTLGVBQWU7WUFDeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM1QixJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRVMsb0JBQW9CO1lBQzdCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVTLG1CQUFtQjtZQUM1QixJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVTLDZCQUE2QixLQUFLLENBQUM7UUFFbkMsNEJBQTRCLEtBQUssQ0FBQztRQUU1QyxTQUFTLEtBQUssQ0FBQztLQUNmLENBQUE7SUFuRVksOENBQWlCO2dDQUFqQixpQkFBaUI7UUFTM0IsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsK0JBQWtCLENBQUE7T0FaUixpQkFBaUIsQ0FtRTdCIn0=