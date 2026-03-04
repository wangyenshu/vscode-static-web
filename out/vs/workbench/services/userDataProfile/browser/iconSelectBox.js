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
define(["require", "exports", "vs/base/browser/ui/icons/iconSelectBox", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, iconSelectBox_1, dom, contextkey_1, keybindingsRegistry_1) {
    "use strict";
    var WorkbenchIconSelectBox_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchIconSelectBox = exports.WorkbenchIconSelectBoxInputEmptyContextKey = exports.WorkbenchIconSelectBoxInputFocusContextKey = exports.WorkbenchIconSelectBoxFocusContextKey = void 0;
    exports.WorkbenchIconSelectBoxFocusContextKey = new contextkey_1.RawContextKey('iconSelectBoxFocus', true);
    exports.WorkbenchIconSelectBoxInputFocusContextKey = new contextkey_1.RawContextKey('iconSelectBoxInputFocus', true);
    exports.WorkbenchIconSelectBoxInputEmptyContextKey = new contextkey_1.RawContextKey('iconSelectBoxInputEmpty', true);
    let WorkbenchIconSelectBox = class WorkbenchIconSelectBox extends iconSelectBox_1.IconSelectBox {
        static { WorkbenchIconSelectBox_1 = this; }
        static getFocusedWidget() {
            return WorkbenchIconSelectBox_1.focusedWidget;
        }
        constructor(options, contextKeyService) {
            super(options);
            this.contextKeyService = this._register(contextKeyService.createScoped(this.domNode));
            exports.WorkbenchIconSelectBoxFocusContextKey.bindTo(this.contextKeyService);
            this.inputFocusContextKey = exports.WorkbenchIconSelectBoxInputFocusContextKey.bindTo(this.contextKeyService);
            this.inputEmptyContextKey = exports.WorkbenchIconSelectBoxInputEmptyContextKey.bindTo(this.contextKeyService);
            if (this.inputBox) {
                const focusTracker = this._register(dom.trackFocus(this.inputBox.inputElement));
                this._register(focusTracker.onDidFocus(() => this.inputFocusContextKey.set(true)));
                this._register(focusTracker.onDidBlur(() => this.inputFocusContextKey.set(false)));
                this._register(this.inputBox.onDidChange(() => this.inputEmptyContextKey.set(this.inputBox?.value.length === 0)));
            }
        }
        focus() {
            super.focus();
            WorkbenchIconSelectBox_1.focusedWidget = this;
        }
    };
    exports.WorkbenchIconSelectBox = WorkbenchIconSelectBox;
    exports.WorkbenchIconSelectBox = WorkbenchIconSelectBox = WorkbenchIconSelectBox_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], WorkbenchIconSelectBox);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: exports.WorkbenchIconSelectBoxFocusContextKey,
        primary: 16 /* KeyCode.UpArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusPreviousRow();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: exports.WorkbenchIconSelectBoxFocusContextKey,
        primary: 18 /* KeyCode.DownArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusNextRow();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(exports.WorkbenchIconSelectBoxFocusContextKey, contextkey_1.ContextKeyExpr.or(exports.WorkbenchIconSelectBoxInputEmptyContextKey, exports.WorkbenchIconSelectBoxInputFocusContextKey.toNegated())),
        primary: 17 /* KeyCode.RightArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusNext();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(exports.WorkbenchIconSelectBoxFocusContextKey, contextkey_1.ContextKeyExpr.or(exports.WorkbenchIconSelectBoxInputEmptyContextKey, exports.WorkbenchIconSelectBoxInputFocusContextKey.toNegated())),
        primary: 15 /* KeyCode.LeftArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusPrevious();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.selectFocused',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: exports.WorkbenchIconSelectBoxFocusContextKey,
        primary: 3 /* KeyCode.Enter */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.setSelection(selectBox.getFocus()[0]);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvblNlbGVjdEJveC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci9pY29uU2VsZWN0Qm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFRbkYsUUFBQSxxQ0FBcUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0YsUUFBQSwwQ0FBMEMsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekcsUUFBQSwwQ0FBMEMsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFL0csSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSw2QkFBYTs7UUFHeEQsTUFBTSxDQUFDLGdCQUFnQjtZQUN0QixPQUFPLHdCQUFzQixDQUFDLGFBQWEsQ0FBQztRQUM3QyxDQUFDO1FBTUQsWUFDQyxPQUE4QixFQUNWLGlCQUFxQztZQUV6RCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDdEYsNkNBQXFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxrREFBMEMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDdEcsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGtEQUEwQyxDQUFDLE1BQU0sQ0FBQyxJQUFJ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