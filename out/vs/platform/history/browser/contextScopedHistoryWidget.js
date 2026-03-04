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
define(["require", "exports", "vs/base/browser/ui/findinput/findInput", "vs/base/browser/ui/findinput/replaceInput", "vs/base/browser/ui/inputbox/inputBox", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom"], function (require, exports, findInput_1, replaceInput_1, inputBox_1, contextkey_1, keybindingsRegistry_1, nls_1, lifecycle_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedReplaceInput = exports.ContextScopedFindInput = exports.ContextScopedHistoryInputBox = exports.historyNavigationVisible = void 0;
    exports.registerAndCreateHistoryNavigationContext = registerAndCreateHistoryNavigationContext;
    exports.historyNavigationVisible = new contextkey_1.RawContextKey('suggestWidgetVisible', false, (0, nls_1.localize)('suggestWidgetVisible', "Whether suggestion are visible"));
    const HistoryNavigationWidgetFocusContext = 'historyNavigationWidgetFocus';
    const HistoryNavigationForwardsEnablementContext = 'historyNavigationForwardsEnabled';
    const HistoryNavigationBackwardsEnablementContext = 'historyNavigationBackwardsEnabled';
    let lastFocusedWidget = undefined;
    const widgets = [];
    function registerAndCreateHistoryNavigationContext(scopedContextKeyService, widget) {
        if (widgets.includes(widget)) {
            throw new Error('Cannot register the same widget multiple times');
        }
        widgets.push(widget);
        const disposableStore = new lifecycle_1.DisposableStore();
        const historyNavigationWidgetFocus = new contextkey_1.RawContextKey(HistoryNavigationWidgetFocusContext, false).bindTo(scopedContextKeyService);
        const historyNavigationForwardsEnablement = new contextkey_1.RawContextKey(HistoryNavigationForwardsEnablementContext, true).bindTo(scopedContextKeyService);
        const historyNavigationBackwardsEnablement = new contextkey_1.RawContextKey(HistoryNavigationBackwardsEnablementContext, true).bindTo(scopedContextKeyService);
        const onDidFocus = () => {
            historyNavigationWidgetFocus.set(true);
            lastFocusedWidget = widget;
        };
        const onDidBlur = () => {
            historyNavigationWidgetFocus.set(false);
            if (lastFocusedWidget === widget) {
                lastFocusedWidget = undefined;
            }
        };
        // Check for currently being focused
        if ((0, dom_1.isActiveElement)(widget.element)) {
            onDidFocus();
        }
        disposableStore.add(widget.onDidFocus(() => onDidFocus()));
        disposableStore.add(widget.onDidBlur(() => onDidBlur()));
        disposableStore.add((0, lifecycle_1.toDisposable)(() => {
            widgets.splice(widgets.indexOf(widget), 1);
            onDidBlur();
        }));
        return {
            historyNavigationForwardsEnablement,
            historyNavigationBackwardsEnablement,
            dispose() {
                disposableStore.dispose();
            }
        };
    }
    let ContextScopedHistoryInputBox = class ContextScopedHistoryInputBox extends inputBox_1.HistoryInputBox {
        constructor(container, contextViewProvider, options, contextKeyService) {
            super(container, contextViewProvider, options);
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.element));
            this._register(registerAndCreateHistoryNavigationContext(scopedContextKeyService, this));
        }
    };
    exports.ContextScopedHistoryInputBox = ContextScopedHistoryInputBox;
    exports.ContextScopedHistoryInputBox = ContextScopedHistoryInputBox = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedHistoryInputBox);
    let ContextScopedFindInput = class ContextScopedFindInput extends findInput_1.FindInput {
        constructor(container, contextViewProvider, options, contextKeyService) {
            super(container, contextViewProvider, options);
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.inputBox.element));
            this._register(registerAndCreateHistoryNavigationContext(scopedContextKeyService, this.inputBox));
        }
    };
    exports.ContextScopedFindInput = ContextScopedFindInput;
    exports.ContextScopedFindInput = ContextScopedFindInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedFindInput);
    let ContextScopedReplaceInput = class ContextScopedReplaceInput extends replaceInput_1.ReplaceInput {
        constructor(container, contextViewProvider, options, contextKeyService, showReplaceOptions = false) {
            super(container, contextViewProvider, showReplaceOptions, options);
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.inputBox.element));
            this._register(registerAndCreateHistoryNavigationContext(scopedContextKeyService, this.inputBox));
        }
    };
    exports.ContextScopedReplaceInput = ContextScopedReplaceInput;
    exports.ContextScopedReplaceInput = ContextScopedReplaceInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedReplaceInput);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(HistoryNavigationWidgetFocusContext), contextkey_1.ContextKeyExpr.equals(HistoryNavigationBackwardsEnablementContext, true), contextkey_1.ContextKeyExpr.not('isComposing'), exports.historyNavigationVisible.isEqualTo(false)),
        primary: 16 /* KeyCode.UpArrow */,
        secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
        handler: (accessor) => {
            lastFocusedWidget?.showPreviousValue();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(HistoryNavigationWidgetFocusContext), contextkey_1.ContextKeyExpr.equals(HistoryNavigationForwardsEnablementContext, true), contextkey_1.ContextKeyExpr.not('isComposing'), exports.historyNavigationVisible.isEqualTo(false)),
        primary: 18 /* KeyCode.DownArrow */,
        secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
        handler: (accessor) => {
            lastFocusedWidget?.showNextValue();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dFNjb3BlZEhpc3RvcnlXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9oaXN0b3J5L2Jyb3dzZXIvY29udGV4dFNjb3BlZEhpc3RvcnlXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEJoRyw4RkEwQ0M7SUF4RFksUUFBQSx3QkFBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztJQUV0SyxNQUFNLG1DQUFtQyxHQUFHLDhCQUE4QixDQUFDO0lBQzNFLE1BQU0sMENBQTBDLEdBQUcsa0NBQWtDLENBQUM7SUFDdEYsTUFBTSwyQ0FBMkMsR0FBRyxtQ0FBbUMsQ0FBQztJQU94RixJQUFJLGlCQUFpQixHQUF5QyxTQUFTLENBQUM7SUFDeEUsTUFBTSxPQUFPLEdBQStCLEVBQUUsQ0FBQztJQUUvQyxTQUFnQix5Q0FBeUMsQ0FBQyx1QkFBMkMsRUFBRSxNQUFnQztRQUN0SSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckIsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDOUMsTUFBTSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUNBQW1DLEVBQUUsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDNUksTUFBTSxtQ0FBbUMsR0FBRyxJQUFJLDBCQUFh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