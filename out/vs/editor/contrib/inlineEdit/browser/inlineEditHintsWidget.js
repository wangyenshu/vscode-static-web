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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/platform", "vs/editor/common/core/position", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry", "vs/css!./inlineEditHintsWidget"], function (require, exports, dom_1, keybindingLabel_1, actions_1, arrays_1, lifecycle_1, observable_1, platform_1, position_1, menuEntryActionViewItem_1, toolbar_1, actions_2, commands_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, telemetry_1) {
    "use strict";
    var InlineEditHintsContentWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomizedMenuWorkbenchToolBar = exports.InlineEditHintsContentWidget = exports.InlineEditHintsWidget = void 0;
    let InlineEditHintsWidget = class InlineEditHintsWidget extends lifecycle_1.Disposable {
        constructor(editor, model, instantiationService) {
            super();
            this.editor = editor;
            this.model = model;
            this.instantiationService = instantiationService;
            this.alwaysShowToolbar = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).showToolbar === 'always');
            this.sessionPosition = undefined;
            this.position = (0, observable_1.derived)(this, reader => {
                const ghostText = this.model.read(reader)?.widget.model.ghostText.read(reader);
                if (!this.alwaysShowToolbar.read(reader) || !ghostText || ghostText.parts.length === 0) {
                    this.sessionPosition = undefined;
                    return null;
                }
                const firstColumn = ghostText.parts[0].column;
                if (this.sessionPosition && this.sessionPosition.lineNumber !== ghostText.lineNumber) {
                    this.sessionPosition = undefined;
                }
                const position = new position_1.Position(ghostText.lineNumber, Math.min(firstColumn, this.sessionPosition?.column ?? Number.MAX_SAFE_INTEGER));
                this.sessionPosition = position;
                return position;
            });
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description setup content widget */
                const model = this.model.read(reader);
                if (!model || !this.alwaysShowToolbar.read(reader)) {
                    return;
                }
                const contentWidget = store.add(this.instantiationService.createInstance(InlineEditHintsContentWidget, this.editor, true, this.position));
                editor.addContentWidget(contentWidget);
                store.add((0, lifecycle_1.toDisposable)(() => editor.removeContentWidget(contentWidget)));
            }));
        }
    };
    exports.InlineEditHintsWidget = InlineEditHintsWidget;
    exports.InlineEditHintsWidget = InlineEditHintsWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], InlineEditHintsWidget);
    let InlineEditHintsContentWidget = class InlineEditHintsContentWidget extends lifecycle_1.Disposable {
        static { InlineEditHintsContentWidget_1 = this; }
        static { this._dropDownVisible = false; }
        static get dropDownVisible() { return this._dropDownVisible; }
        static { this.id = 0; }
        constructor(editor, withBorder, _position, instantiationService, _contextKeyService, _menuService) {
            super();
            this.editor = editor;
            this.withBorder = withBorder;
            this._position = _position;
            this._contextKeyService = _contextKeyService;
            this._menuService = _menuService;
            this.id = `InlineEditHintsContentWidget${InlineEditHintsContentWidget_1.id++}`;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this.nodes = (0, dom_1.h)('div.inlineEditHints', { className: this.withBorder ? '.withBorder' : '' }, [
                (0, dom_1.h)('div@toolBar'),
            ]);
            this.inlineCompletionsActionsMenus = this._register(this._menuService.createMenu(actions_2.MenuId.InlineEditActions, this._contextKeyService));
            this.toolBar = this._register(instantiationService.createInstance(CustomizedMenuWorkbenchToolBar, this.nodes.toolBar, this.editor, actions_2.MenuId.InlineEditToolbar, {
                menuOptions: { renderShortTitle: true },
                toolbarOptions: { primaryGroup: g => g.startsWith('primary') },
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_2.MenuItemAction) {
                        return instantiationService.createInstance(StatusBarViewItem, action, undefined);
                    }
                    return undefined;
                },
                telemetrySource: 'InlineEditToolbar',
            }));
            this._register(this.toolBar.onDidChangeDropdownVisibility(e => {
                InlineEditHintsContentWidget_1._dropDownVisible = e;
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update position */
                this._position.read(reader);
                this.editor.layoutContentWidget(this);
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description actions menu */
                const extraActions = [];
                for (const [_, group] of this.inlineCompletionsActionsMenus.getActions()) {
                    for (const action of group) {
                        if (action instanceof actions_2.MenuItemAction) {
                            extraActions.push(action);
                        }
                    }
                }
                if (extraActions.length > 0) {
                    extraActions.unshift(new actions_1.Separator());
                }
                this.toolBar.setAdditionalSecondaryActions(extraActions);
            }));
        }
        getId() { return this.id; }
        getDomNode() {
            return this.nodes.root;
        }
        getPosition() {
            return {
                position: this._position.get(),
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */],
                positionAffinity: 3 /* PositionAffinity.LeftOfInjectedText */,
            };
        }
    };
    exports.InlineEditHintsContentWidget = InlineEditHintsContentWidget;
    exports.InlineEditHintsContentWidget = InlineEditHintsContentWidget = InlineEditHintsContentWidget_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, actions_2.IMenuService)
    ], InlineEditHintsContentWidget);
    class StatusBarViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        updateLabel() {
            const kb = this._keybindingService.lookupKeybinding(this._action.id, this._contextKeyService);
            if (!kb) {
                return super.updateLabel();
            }
            if (this.label) {
                const div = (0, dom_1.h)('div.keybinding').root;
                const k = this._register(new keybindingLabel_1.KeybindingLabel(div, platform_1.OS, { disableTitle: true, ...keybindingLabel_1.unthemedKeybindingLabelOptions }));
                k.set(kb);
                this.label.textContent = this._action.label;
                this.label.appendChild(div);
                this.label.classList.add('inlineEditStatusBarItemLabel');
            }
        }
        updateTooltip() {
            // NOOP, disable tooltip
        }
    }
    let CustomizedMenuWorkbenchToolBar = class CustomizedMenuWorkbenchToolBar extends toolbar_1.WorkbenchToolBar {
        constructor(container, editor, menuId, options2, menuService, contextKeyService, contextMenuService, keybindingService, commandService, telemetryService) {
            super(container, { resetMenu: menuId, ...options2 }, menuService, contextKeyService, contextMenuService, keybindingService, commandService, telemetryService);
            this.editor = editor;
            this.menuId = menuId;
            this.options2 = options2;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.menu = this._store.add(this.menuService.createMenu(this.menuId, this.contextKeyService, { emitEventsForSubmenuChanges: true }));
            this.additionalActions = [];
            this.prependedPrimaryActions = [];
            this._store.add(this.menu.onDidChange(() => this.updateToolbar()));
            this._store.add(this.editor.onDidChangeCursorPosition(() => this.updateToolbar()));
            this.updateToolbar();
        }
        updateToolbar() {
            const primary = [];
            const secondary = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, this.options2?.menuOptions, { primary, secondary }, this.options2?.toolbarOptions?.primaryGroup, this.options2?.toolbarOptions?.shouldInlineSubmenu, this.options2?.toolbarOptions?.useSeparatorsInPrimaryActions);
            secondary.push(...this.additionalActions);
            primary.unshift(...this.prependedPrimaryActions);
            this.setActions(primary, secondary);
        }
        setPrependedPrimaryActions(actions) {
            if ((0, arrays_1.equals)(this.prependedPrimaryActions, actions, (a, b) => a === b)) {
                return;
            }
            this.prependedPrimaryActions = actions;
            this.updateToolbar();
        }
        setAdditionalSecondaryActions(actions) {
            if ((0, arrays_1.equals)(this.additionalActions, actions, (a, b) => a === b)) {
                return;
            }
            this.additionalActions = actions;
            this.updateToolbar();
        }
    };
    exports.CustomizedMenuWorkbenchToolBar = CustomizedMenuWorkbenchToolBar;
    exports.CustomizedMenuWorkbenchToolBar = CustomizedMenuWorkbenchToolBar = __decorate([
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, commands_1.ICommandService),
        __param(9, telemetry_1.ITelemetryService)
    ], CustomizedMenuWorkbenchToolBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRWRpdEhpbnRzV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lRWRpdC9icm93c2VyL2lubGluZUVkaXRIaW50c1dpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJ6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBdUJwRCxZQUNrQixNQUFtQixFQUNuQixLQUFnRCxFQUMxQyxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFKUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ25CLFVBQUssR0FBTCxLQUFLLENBQTJDO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUF6Qm5FLHNCQUFpQixHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsa0NBQXlCLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBRXRLLG9CQUFlLEdBQXlCLFNBQVMsQ0FBQztZQUV6QyxhQUFRLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDbEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUUvRSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLE1B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