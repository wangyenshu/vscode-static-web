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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace"], function (require, exports, dom, actionViewItems_1, actions_1, lifecycle_1, platform_1, editorExtensions_1, editorContextKeys_1, nls, actions_2, contextkey_1, contextView_1, keybinding_1, configuration_1, workspace_1) {
    "use strict";
    var ContextMenuController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuController = void 0;
    let ContextMenuController = class ContextMenuController {
        static { ContextMenuController_1 = this; }
        static { this.ID = 'editor.contrib.contextmenu'; }
        static get(editor) {
            return editor.getContribution(ContextMenuController_1.ID);
        }
        constructor(editor, _contextMenuService, _contextViewService, _contextKeyService, _keybindingService, _menuService, _configurationService, _workspaceContextService) {
            this._contextMenuService = _contextMenuService;
            this._contextViewService = _contextViewService;
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._menuService = _menuService;
            this._configurationService = _configurationService;
            this._workspaceContextService = _workspaceContextService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._contextMenuIsBeingShownCount = 0;
            this._editor = editor;
            this._toDispose.add(this._editor.onContextMenu((e) => this._onContextMenu(e)));
            this._toDispose.add(this._editor.onMouseWheel((e) => {
                if (this._contextMenuIsBeingShownCount > 0) {
                    const view = this._contextViewService.getContextViewElement();
                    const target = e.srcElement;
                    // Event triggers on shadow root host first
                    // Check if the context view is under this host before hiding it #103169
                    if (!(target.shadowRoot && dom.getShadowRoot(view) === target.shadowRoot)) {
                        this._contextViewService.hideContextView();
                    }
                }
            }));
            this._toDispose.add(this._editor.onKeyDown((e) => {
                if (!this._editor.getOption(24 /* EditorOption.contextmenu */)) {
                    return; // Context menu is turned off through configuration
                }
                if (e.keyCode === 58 /* KeyCode.ContextMenu */) {
                    // Chrome is funny like that
                    e.preventDefault();
                    e.stopPropagation();
                    this.showContextMenu();
                }
            }));
        }
        _onContextMenu(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (!this._editor.getOption(24 /* EditorOption.contextmenu */)) {
                this._editor.focus();
                // Ensure the cursor is at the position of the mouse click
                if (e.target.position && !this._editor.getSelection().containsPosition(e.target.position)) {
                    this._editor.setPosition(e.target.position);
                }
                return; // Context menu is turned off through configuration
            }
            if (e.target.type === 12 /* MouseTargetType.OVERLAY_WIDGET */) {
                return; // allow native menu on widgets to support right click on input field for example in find
            }
            if (e.target.type === 6 /* MouseTargetType.CONTENT_TEXT */ && e.target.detail.injectedText) {
                return; // allow native menu on injected text
            }
            e.event.preventDefault();
            e.event.stopPropagation();
            if (e.target.type === 11 /* MouseTargetType.SCROLLBAR */) {
                return this._showScrollbarContextMenu(e.event);
            }
            if (e.target.type !== 6 /* MouseTargetType.CONTENT_TEXT */ && e.target.type !== 7 /* MouseTargetType.CONTENT_EMPTY */ && e.target.type !== 1 /* MouseTargetType.TEXTAREA */) {
                return; // only support mouse click into text or native context menu key for now
            }
            // Ensure the editor gets focus if it hasn't, so the right events are being sent to other contributions
            this._editor.focus();
            // Ensure the cursor is at the position of the mouse click
            if (e.target.position) {
                let hasSelectionAtPosition = false;
                for (const selection of this._editor.getSelections()) {
                    if (selection.containsPosition(e.target.position)) {
                        hasSelectionAtPosition = true;
                        break;
                    }
                }
                if (!hasSelectionAtPosition) {
                    this._editor.setPosition(e.target.position);
                }
            }
            // Unless the user triggerd the context menu through Shift+F10, use the mouse position as menu position
            let anchor = null;
            if (e.target.type !== 1 /* MouseTargetType.TEXTAREA */) {
                anchor = e.event;
            }
            // Show the context menu
            this.showContextMenu(anchor);
        }
        showContextMenu(anchor) {
            if (!this._editor.getOption(24 /* EditorOption.contextmenu */)) {
                return; // Context menu is turned off through configuration
            }
            if (!this._editor.hasModel()) {
                return;
            }
            // Find actions available for menu
            const menuActions = this._getMenuActions(this._editor.getModel(), this._editor.contextMenuId);
            // Show menu if we have actions to show
            if (menuActions.length > 0) {
                this._doShowContextMenu(menuActions, anchor);
            }
        }
        _getMenuActions(model, menuId) {
            const result = [];
            // get menu groups
            const menu = this._menuService.createMenu(menuId, this._contextKeyService);
            const groups = menu.getActions({ arg: model.uri });
            menu.dispose();
            // translate them into other actions
            for (const group of groups) {
                const [, actions] = group;
                let addedItems = 0;
                for (const action of actions) {
                    if (action instanceof actions_2.SubmenuItemAction) {
                        const subActions = this._getMenuActions(model, action.item.submenu);
                        if (subActions.length > 0) {
                            result.push(new actions_1.SubmenuAction(action.id, action.label, subActions));
                            addedItems++;
                        }
                    }
                    else {
                        result.push(action);
                        addedItems++;
                    }
                }
                if (addedItems) {
                    result.push(new actions_1.Separator());
                }
            }
            if (result.length) {
                result.pop(); // remove last separator
            }
            return result;
        }
        _doShowContextMenu(actions, event = null) {
            if (!this._editor.hasModel()) {
                return;
            }
            // Disable hover
            const oldHoverSetting = this._editor.getOption(60 /* EditorOption.hover */);
            this._editor.updateOptions({
                hover: {
                    enabled: false
                }
            });
            let anchor = event;
            if (!anchor) {
                // Ensure selection is visible
                this._editor.revealPosition(this._editor.getPosition(), 1 /* ScrollType.Immediate */);
                this._editor.render();
                const cursorCoords = this._editor.getScrolledVisiblePosition(this._editor.getPosition());
                // Translate to absolute editor position
                const editorCoords = dom.getDomNodePagePosition(this._editor.getDomNode());
                const posx = editorCoords.left + cursorCoords.left;
                const posy = editorCoords.top + cursorCoords.top + cursorCoords.height;
                anchor = { x: posx, y: posy };
            }
            const useShadowDOM = this._editor.getOption(127 /* EditorOption.useShadowDOM */) && !platform_1.isIOS; // Do not use shadow dom on IOS #122035
            // Show menu
            this._contextMenuIsBeingShownCount++;
            this._contextMenuService.showContextMenu({
                domForShadowRoot: useShadowDOM ? this._editor.getDomNode() : undefined,
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this._keybindingFor(action);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel(), isMenu: true });
                    }
                    const customActionViewItem = action;
                    if (typeof customActionViewItem.getActionViewItem === 'function') {
                        return customActionViewItem.getActionViewItem();
                    }
                    return new actionViewItems_1.ActionViewItem(action, action, { icon: true, label: true, isMenu: true });
                },
                getKeyBinding: (action) => {
                    return this._keybindingFor(action);
                },
                onHide: (wasCancelled) => {
                    this._contextMenuIsBeingShownCount--;
                    this._editor.updateOptions({
                        hover: oldHoverSetting
                    });
                }
            });
        }
        _showScrollbarContextMenu(anchor) {
            if (!this._editor.hasModel()) {
                return;
            }
            if ((0, workspace_1.isStandaloneEditorWorkspace)(this._workspaceContextService.getWorkspace())) {
                // can't update the configuration properly in the standalone editor
                return;
            }
            const minimapOptions = this._editor.getOption(73 /* EditorOption.minimap */);
            let lastId = 0;
            const createAction = (opts) => {
                return {
                    id: `menu-action-${++lastId}`,
                    label: opts.label,
                    tooltip: '',
                    class: undefined,
                    enabled: (typeof opts.enabled === 'undefined' ? true : opts.enabled),
                    checked: opts.checked,
                    run: opts.run
                };
            };
            const createSubmenuAction = (label, actions) => {
                return new actions_1.SubmenuAction(`menu-action-${++lastId}`, label, actions, undefined);
            };
            const createEnumAction = (label, enabled, configName, configuredValue, options) => {
                if (!enabled) {
                    return createAction({ label, enabled, run: () => { } });
                }
                const createRunner = (value) => {
                    return () => {
                        this._configurationService.updateValue(configName, value);
                    };
                };
                const actions = [];
                for (const option of options) {
                    actions.push(createAction({
                        label: option.label,
                        checked: configuredValue === option.value,
                        run: createRunner(option.value)
                    }));
                }
                return createSubmenuAction(label, actions);
            };
            const actions = [];
            actions.push(createAction({
                label: nls.localize('context.minimap.minimap', "Minimap"),
                checked: minimapOptions.enabled,
                run: () => {
                    this._configurationService.updateValue(`editor.minimap.enabled`, !minimapOptions.enabled);
                }
            }));
            actions.push(new actions_1.Separator());
            actions.push(createAction({
                label: nls.localize('context.minimap.renderCharacters', "Render Characters"),
                enabled: minimapOptions.enabled,
                checked: minimapOptions.renderCharacters,
                run: () => {
                    this._configurationService.updateValue(`editor.minimap.renderCharacters`, !minimapOptions.renderCharacters);
                }
            }));
            actions.push(createEnumAction(nls.localize('context.minimap.size', "Vertical size"), minimapOptions.enabled, 'editor.minimap.size', minimapOptions.size, [{
                    label: nls.localize('context.minimap.size.proportional', "Proportional"),
                    value: 'proportional'
                }, {
                    label: nls.localize('context.minimap.size.fill', "Fill"),
                    value: 'fill'
                }, {
                    label: nls.localize('context.minimap.size.fit', "Fit"),
                    value: 'fit'
                }]));
            actions.push(createEnumAction(nls.localize('context.minimap.slider', "Slider"), minimapOptions.enabled, 'editor.minimap.showSlider', minimapOptions.showSlider, [{
                    label: nls.localize('context.minimap.slider.mouseover', "Mouse Over"),
                    value: 'mouseover'
                }, {
                    label: nls.localize('context.minimap.slider.always', "Always"),
                    value: 'always'
                }]));
            const useShadowDOM = this._editor.getOption(127 /* EditorOption.useShadowDOM */) && !platform_1.isIOS; // Do not use shadow dom on IOS #122035
            this._contextMenuIsBeingShownCount++;
            this._contextMenuService.showContextMenu({
                domForShadowRoot: useShadowDOM ? this._editor.getDomNode() : undefined,
                getAnchor: () => anchor,
                getActions: () => actions,
                onHide: (wasCancelled) => {
                    this._contextMenuIsBeingShownCount--;
                    this._editor.focus();
                }
            });
        }
        _keybindingFor(action) {
            return this._keybindingService.lookupKeybinding(action.id);
        }
        dispose() {
            if (this._contextMenuIsBeingShownCount > 0) {
                this._contextViewService.hideContextView();
            }
            this._toDispose.dispose();
        }
    };
    exports.ContextMenuController = ContextMenuController;
    exports.ContextMenuController = ContextMenuController = ContextMenuController_1 = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, contextView_1.IContextViewService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, actions_2.IMenuService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], ContextMenuController);
    class ShowContextMenu extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showContextMenu',
                label: nls.localize('action.showContextMenu.label', "Show Editor Context Menu"),
                alias: 'Show Editor Context Menu',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 1024 /* KeyMod.Shift */ | 68 /* KeyCode.F10 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            ContextMenuController.get(editor)?.showContextMenu();
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(ContextMenuController.ID, ContextMenuController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(ShowContextMenu);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb250ZXh0bWVudS9icm93c2VyL2NvbnRleHRtZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCOztpQkFFVixPQUFFLEdBQUcsNEJBQTRCLEFBQS9CLENBQWdDO1FBRWxELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUF3Qix1QkFBcUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBTUQsWUFDQyxNQUFtQixFQUNFLG1CQUF5RCxFQUN6RCxtQkFBeUQsRUFDMUQsa0JBQXVELEVBQ3ZELGtCQUF1RCxFQUM3RCxZQUEyQyxFQUNsQyxxQkFBNkQsRUFDMUQsd0JBQW1FO1lBTnZELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDeEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3RDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDNUMsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDakIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN6Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBWjdFLGVBQVUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUM1QyxrQ0FBNkIsR0FBVyxDQUFDLENBQUM7WUFhakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FB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