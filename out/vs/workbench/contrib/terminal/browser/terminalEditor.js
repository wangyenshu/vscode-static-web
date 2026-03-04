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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/platform", "vs/base/browser/canIUse", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/lifecycle"], function (require, exports, dom, actions_1, dropdownWithPrimaryActionViewItem_1, actions_2, contextkey_1, contextView_1, instantiation_1, storage_1, telemetry_1, themeService_1, editorPane_1, terminal_1, terminalMenus_1, terminal_2, platform_1, canIUse_1, notification_1, terminalContextMenu_1, editorService_1, layoutService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditor = void 0;
    let TerminalEditor = class TerminalEditor extends editorPane_1.EditorPane {
        constructor(group, telemetryService, themeService, storageService, _terminalEditorService, _terminalProfileResolverService, _terminalService, _terminalConfigurationService, contextKeyService, menuService, _instantiationService, _contextMenuService, _notificationService, _terminalProfileService, _workbenchLayoutService) {
            super(terminal_1.terminalEditorId, group, telemetryService, themeService, storageService);
            this._terminalEditorService = _terminalEditorService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._terminalService = _terminalService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._instantiationService = _instantiationService;
            this._contextMenuService = _contextMenuService;
            this._notificationService = _notificationService;
            this._terminalProfileService = _terminalProfileService;
            this._workbenchLayoutService = _workbenchLayoutService;
            this._editorInput = undefined;
            this._cancelContextMenu = false;
            this._disposableStore = this._register(new lifecycle_1.DisposableStore());
            this._dropdownMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalNewDropdownContext, contextKeyService));
            this._instanceMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalInstanceContext, contextKeyService));
        }
        async setInput(newInput, options, context, token) {
            this._editorInput?.terminalInstance?.detachFromElement();
            this._editorInput = newInput;
            await super.setInput(newInput, options, context, token);
            this._editorInput.terminalInstance?.attachToElement(this._overflowGuardElement);
            if (this._lastDimension) {
                this.layout(this._lastDimension);
            }
            this._editorInput.terminalInstance?.setVisible(this.isVisible() && this._workbenchLayoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, this.window));
            if (this._editorInput.terminalInstance) {
                // since the editor does not monitor focus changes, for ex. between the terminal
                // panel and the editors, this is needed so that the active instance gets set
                // when focus changes between them.
                this._register(this._editorInput.terminalInstance.onDidFocus(() => this._setActiveInstance()));
                this._editorInput.setCopyLaunchConfig(this._editorInput.terminalInstance.shellLaunchConfig);
            }
        }
        clearInput() {
            super.clearInput();
            if (this._overflowGuardElement && this._editorInput?.terminalInstance?.domElement.parentElement === this._overflowGuardElement) {
                this._editorInput.terminalInstance?.detachFromElement();
            }
            this._editorInput = undefined;
        }
        _setActiveInstance() {
            if (!this._editorInput?.terminalInstance) {
                return;
            }
            this._terminalEditorService.setActiveInstance(this._editorInput.terminalInstance);
        }
        focus() {
            super.focus();
            this._editorInput?.terminalInstance?.focus(true);
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        createEditor(parent) {
            this._editorInstanceElement = parent;
            this._overflowGuardElement = dom.$('.terminal-overflow-guard.terminal-editor');
            this._editorInstanceElement.appendChild(this._overflowGuardElement);
            this._registerListeners();
        }
        _registerListeners() {
            if (!this._editorInstanceElement) {
                return;
            }
            this._register(dom.addDisposableListener(this._editorInstanceElement, 'mousedown', async (event) => {
                const terminal = this._terminalEditorService.activeInstance;
                if (this._terminalEditorService.instances.length === 0 || !terminal) {
                    return;
                }
                if (event.which === 2) {
                    switch (this._terminalConfigurationService.config.middleClickBehavior) {
                        case 'paste':
                            terminal.paste();
                            break;
                        case 'default':
                        default:
                            // Drop selection and focus terminal on Linux to enable middle button paste
                            // when click occurs on the selection itself.
                            terminal.focus();
                            break;
                    }
                }
                else if (event.which === 3) {
                    const rightClickBehavior = this._terminalConfigurationService.config.rightClickBehavior;
                    if (rightClickBehavior === 'nothing') {
                        if (!event.shiftKey) {
                            this._cancelContextMenu = true;
                        }
                        return;
                    }
                    else if (rightClickBehavior === 'copyPaste' || rightClickBehavior === 'paste') {
                        // copyPaste: Shift+right click should open context menu
                        if (rightClickBehavior === 'copyPaste' && event.shiftKey) {
                            (0, terminalContextMenu_1.openContextMenu)(this.window, event, this._editorInput?.terminalInstance, this._instanceMenu, this._contextMenuService);
                            return;
                        }
                        if (rightClickBehavior === 'copyPaste' && terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            if (canIUse_1.BrowserFeatures.clipboard.readText) {
                                terminal.paste();
                            }
                            else {
                                this._notificationService.info(`This browser doesn't support the clipboard.readText API needed to trigger a paste, try ${platform_1.isMacintosh ? '⌘' : 'Ctrl'}+V instead.`);
                            }
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform_1.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(this._editorInstanceElement, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalConfigurationService.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this._cancelContextMenu = false;
                    return;
                }
                else if (!this._cancelContextMenu && rightClickBehavior !== 'copyPaste' && rightClickBehavior !== 'paste') {
                    if (!this._cancelContextMenu) {
                        (0, terminalContextMenu_1.openContextMenu)(this.window, event, this._editorInput?.terminalInstance, this._instanceMenu, this._contextMenuService);
                    }
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this._cancelContextMenu = false;
                }
            }));
        }
        layout(dimension) {
            const instance = this._editorInput?.terminalInstance;
            if (instance) {
                instance.attachToElement(this._overflowGuardElement);
                instance.layout(dimension);
            }
            this._lastDimension = dimension;
        }
        setVisible(visible) {
            super.setVisible(visible);
            this._editorInput?.terminalInstance?.setVisible(visible && this._workbenchLayoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, this.window));
        }
        getActionViewItem(action, options) {
            switch (action.id) {
                case "workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */: {
                    if (action instanceof actions_2.MenuItemAction) {
                        const location = { viewColumn: editorService_1.ACTIVE_GROUP };
                        const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(location, this._terminalProfileService.availableProfiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._terminalService, this._dropdownMenu);
                        this._registerDisposableActions(actions.dropdownAction, actions.dropdownMenuActions);
                        const button = this._instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, action, actions.dropdownAction, actions.dropdownMenuActions, actions.className, this._contextMenuService, { hoverDelegate: options.hoverDelegate });
                        return button;
                    }
                }
            }
            return super.getActionViewItem(action, options);
        }
        /**
         * Actions might be of type Action (disposable) or Separator or SubmenuAction, which don't extend Disposable
         */
        _registerDisposableActions(dropdownAction, dropdownMenuActions) {
            this._disposableStore.clear();
            if (dropdownAction instanceof actions_1.Action) {
                this._disposableStore.add(dropdownAction);
            }
            dropdownMenuActions.filter(a => a instanceof actions_1.Action).forEach(a => this._disposableStore.add(a));
        }
        _getDefaultProfileName() {
            let defaultProfileName;
            try {
                defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            }
            catch (e) {
                defaultProfileName = this._terminalProfileResolverService.defaultProfileName;
            }
            return defaultProfileName;
        }
    };
    exports.TerminalEditor = TerminalEditor;
    exports.TerminalEditor = TerminalEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, terminal_1.ITerminalEditorService),
        __param(5, terminal_2.ITerminalProfileResolverService),
        __param(6, terminal_1.ITerminalService),
        __param(7, terminal_1.ITerminalConfigurationService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, actions_2.IMenuService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, notification_1.INotificationService),
        __param(13, terminal_2.ITerminalProfileService),
        __param(14, layoutService_1.IWorkbenchLayoutService)
    ], TerminalEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStCekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHVCQUFVO1FBaUI3QyxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3pCLGNBQStCLEVBQ3hCLHNCQUErRCxFQUN0RCwrQkFBaUYsRUFDaEcsZ0JBQW1ELEVBQ3RDLDZCQUE2RSxFQUN4RixpQkFBcUMsRUFDM0MsV0FBeUIsRUFDaEIscUJBQTZELEVBQy9ELG1CQUF5RCxFQUN4RCxvQkFBMkQsRUFDeEQsdUJBQWlFLEVBQ2pFLHVCQUFpRTtZQUUxRixLQUFLLENBQUMsMkJBQWdCLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQVp0QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ3JDLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBaUM7WUFDL0UscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNyQixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBR3BFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDOUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN2Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ3ZDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBeUI7WUFDaEQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQTNCbkYsaUJBQVksR0FBeUIsU0FBUyxDQUFDO1lBUS9DLHVCQUFrQixHQUFZLEtBQUssQ0FBQztZQUUz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