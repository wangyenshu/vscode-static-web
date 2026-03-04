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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/themeService", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/theme/common/colorRegistry"], function (require, exports, nls, actions_1, contextView_1, actionViewItems_1, defaultStyles_1, themeService_1, peekView_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwitchQuickDiffBaseAction = exports.SwitchQuickDiffViewItem = void 0;
    let SwitchQuickDiffViewItem = class SwitchQuickDiffViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, providers, selected, contextViewService, themeService) {
            const items = providers.map(provider => ({ provider, text: provider }));
            let startingSelection = providers.indexOf(selected);
            if (startingSelection === -1) {
                startingSelection = 0;
            }
            const styles = { ...defaultStyles_1.defaultSelectBoxStyles };
            const theme = themeService.getColorTheme();
            const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
            const peekTitleColor = theme.getColor(peekView_1.peekViewTitleBackground);
            const opaqueTitleColor = peekTitleColor?.makeOpaque(editorBackgroundColor) ?? editorBackgroundColor;
            styles.selectBackground = opaqueTitleColor.lighten(.6).toString();
            super(null, action, items, startingSelection, contextViewService, styles, { ariaLabel: nls.localize('remotes', 'Switch quick diff base') });
            this.optionsItems = items;
        }
        setSelection(provider) {
            const index = this.optionsItems.findIndex(item => item.provider === provider);
            this.select(index);
        }
        getActionContext(_, index) {
            return this.optionsItems[index];
        }
        render(container) {
            super.render(container);
            this.setFocusable(true);
        }
    };
    exports.SwitchQuickDiffViewItem = SwitchQuickDiffViewItem;
    exports.SwitchQuickDiffViewItem = SwitchQuickDiffViewItem = __decorate([
        __param(3, contextView_1.IContextViewService),
        __param(4, themeService_1.IThemeService)
    ], SwitchQuickDiffViewItem);
    class SwitchQuickDiffBaseAction extends actions_1.Action {
        static { this.ID = 'quickDiff.base.switch'; }
        static { this.LABEL = nls.localize('quickDiff.base.switch', "Switch Quick Diff Base"); }
        constructor(callback) {
            super(SwitchQuickDiffBaseAction.ID, SwitchQuickDiffBaseAction.LABEL, undefined, undefined);
            this.callback = callback;
        }
        async run(event) {
            return this.callback(event);
        }
    }
    exports.SwitchQuickDiffBaseAction = SwitchQuickDiffBaseAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlydHlEaWZmU3dpdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9kaXJ0eURpZmZTd2l0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0NBQTBDO1FBR3RGLFlBQ0MsTUFBZSxFQUNmLFNBQW1CLEVBQ25CLFFBQWdCLEVBQ0ssa0JBQXVDLEVBQzdDLFlBQTJCO1lBRTFDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEUsSUFBSSxpQkFBaUIsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BELElBQUksaUJBQWlCLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxFQUFFLEdBQUcsc0NBQXNCLEVBQUUsQ0FBQztZQUM3QyxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0MsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLGdDQUFnQixDQUFDLENBQUM7WUFDL0QsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQ0FBdUIsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxFQUFFLFVBQVUsQ0FBQyxxQkFBc0IsQ0FBQyxJQUFJLHFCQUFzQixDQUFDO1lBQ3RHLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEUsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1SSxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUMzQixDQUFDO1FBRU0sWUFBWSxDQUFDLFFBQWdCO1lBQ25DLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFa0IsZ0JBQWdCLENBQUMsQ0FBUyxFQUFFLEtBQWE7WUFDM0QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFUSxNQUFNLENBQUMsU0FBc0I7WUFDckMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7S0FDRCxDQUFBO0lBdENZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBT2pDLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw0QkFBYSxDQUFBO09BUkgsdUJBQXVCLENBc0NuQztJQUVELE1BQWEseUJBQTBCLFNBQVEsZ0JBQU07aUJBRTdCLE9BQUUsR0FBRyx1QkFBdUIsQ0FBQztpQkFDN0IsVUFBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUUvRixZQUE2QixRQUFnRDtZQUM1RSxLQUFLLENBQUMseUJBQXlCLENBQUMsRUFBRSxFQUFFLHlCQUF5QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFEL0QsYUFBUSxHQUFSLFFBQVEsQ0FBd0M7UUFFN0UsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBNEI7WUFDOUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdCLENBQUM7O0lBWEYsOERBWUMifQ==