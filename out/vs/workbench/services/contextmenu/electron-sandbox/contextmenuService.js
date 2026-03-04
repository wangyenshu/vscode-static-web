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
define(["require", "exports", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/base/browser/browser", "vs/base/common/labels", "vs/platform/notification/common/notification", "vs/base/common/functional", "vs/base/parts/contextmenu/electron-sandbox/contextmenu", "vs/platform/window/common/window", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextMenuService", "vs/platform/instantiation/common/extensions", "vs/base/common/iconLabels", "vs/base/common/arrays", "vs/base/common/event", "vs/base/browser/ui/contextview/contextview", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle"], function (require, exports, actions_1, dom, contextView_1, telemetry_1, keybinding_1, browser_1, labels_1, notification_1, functional_1, contextmenu_1, window_1, platform_1, configuration_1, contextMenuService_1, extensions_1, iconLabels_1, arrays_1, event_1, contextview_1, actions_2, contextkey_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuService = void 0;
    let ContextMenuService = class ContextMenuService {
        get onDidShowContextMenu() { return this.impl.onDidShowContextMenu; }
        get onDidHideContextMenu() { return this.impl.onDidHideContextMenu; }
        constructor(notificationService, telemetryService, keybindingService, configurationService, contextViewService, menuService, contextKeyService) {
            // Custom context menu: Linux/Windows if custom title is enabled
            if (!platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(configurationService)) {
                this.impl = new contextMenuService_1.ContextMenuService(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService);
            }
            // Native context menu: otherwise
            else {
                this.impl = new NativeContextMenuService(notificationService, telemetryService, keybindingService, menuService, contextKeyService);
            }
        }
        dispose() {
            this.impl.dispose();
        }
        showContextMenu(delegate) {
            this.impl.showContextMenu(delegate);
        }
    };
    exports.ContextMenuService = ContextMenuService;
    exports.ContextMenuService = ContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, actions_2.IMenuService),
        __param(6, contextkey_1.IContextKeyService)
    ], ContextMenuService);
    let NativeContextMenuService = class NativeContextMenuService extends lifecycle_1.Disposable {
        constructor(notificationService, telemetryService, keybindingService, menuService, contextKeyService) {
            super();
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._onDidShowContextMenu = this._store.add(new event_1.Emitter());
            this.onDidShowContextMenu = this._onDidShowContextMenu.event;
            this._onDidHideContextMenu = this._store.add(new event_1.Emitter());
            this.onDidHideContextMenu = this._onDidHideContextMenu.event;
        }
        showContextMenu(delegate) {
            delegate = contextMenuService_1.ContextMenuMenuDelegate.transform(delegate, this.menuService, this.contextKeyService);
            const actions = delegate.getActions();
            if (actions.length) {
                const onHide = (0, functional_1.createSingleCallFunction)(() => {
                    delegate.onHide?.(false);
                    dom.ModifierKeyEmitter.getInstance().resetKeyStatus();
                    this._onDidHideContextMenu.fire();
                });
                const menu = this.createMenu(delegate, actions, onHide);
                const anchor = delegate.getAnchor();
                let x;
                let y;
                let zoom = (0, browser_1.getZoomFactor)(anchor instanceof HTMLElement ? dom.getWindow(anchor) : dom.getActiveWindow());
                if (anchor instanceof HTMLElement) {
                    const elementPosition = dom.getDomNodePagePosition(anchor);
                    // When drawing context menus, we adjust the pixel position for native menus using zoom level
                    // In areas where zoom is applied to the element or its ancestors, we need to adjust accordingly
                    // e.g. The title bar has counter zoom behavior meaning it applies the inverse of zoom level.
                    // Window Zoom Level: 1.5, Title Bar Zoom: 1/1.5, Coordinate Multiplier: 1.5 * 1.0 / 1.5 = 1.0
                    zoom *= dom.getDomNodeZoomLevel(anchor);
                    // Position according to the axis alignment and the anchor alignment:
                    // `HORIZONTAL` aligns at the top left or right of the anchor and
                    //  `VERTICAL` aligns at the bottom left of the anchor.
                    if (delegate.anchorAxisAlignment === 1 /* AnchorAxisAlignment.HORIZONTAL */) {
                        if (delegate.anchorAlignment === 0 /* AnchorAlignment.LEFT */) {
                            x = elementPosition.left;
                            y = elementPosition.top;
                        }
                        else {
                            x = elementPosition.left + elementPosition.width;
                            y = elementPosition.top;
                        }
                        if (!platform_1.isMacintosh) {
                            const window = dom.getWindow(anchor);
                            const availableHeightForMenu = window.screen.height - y;
                            if (availableHeightForMenu < actions.length * (platform_1.isWindows ? 45 : 32) /* guess of 1 menu item height */) {
                                // this is a guess to detect whether the context menu would
                                // open to the bottom from this point or to the top. If the
                                // menu opens to the top, make sure to align it to the bottom
                                // of the anchor and not to the top.
                                // this seems to be only necessary for Windows and Linux.
                                y += elementPosition.height;
                            }
                        }
                    }
                    else {
                        if (delegate.anchorAlignment === 0 /* AnchorAlignment.LEFT */) {
                            x = elementPosition.left;
                            y = elementPosition.top + elementPosition.height;
                        }
                        else {
                            x = elementPosition.left + elementPosition.width;
                            y = elementPosition.top + elementPosition.height;
                        }
                    }
                    // Shift macOS menus by a few pixels below elements
                    // to account for extra padding on top of native menu
                    // https://github.com/microsoft/vscode/issues/84231
                    if (platform_1.isMacintosh) {
                        y += 4 / zoom;
                    }
                }
                else if ((0, contextview_1.isAnchor)(anchor)) {
                    x = anchor.x;
                    y = anchor.y;
                }
                else {
                    // We leave x/y undefined in this case which will result in
                    // Electron taking care of opening the menu at the cursor position.
                }
                if (typeof x === 'number') {
                    x = Math.floor(x * zoom);
                }
                if (typeof y === 'number') {
                    y = Math.floor(y * zoom);
                }
                (0, contextmenu_1.popup)(menu, { x, y, positioningItem: delegate.autoSelectFirstItem ? 0 : undefined, }, () => onHide());
                this._onDidShowContextMenu.fire();
            }
        }
        createMenu(delegate, entries, onHide, submenuIds = new Set()) {
            const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
            return (0, arrays_1.coalesce)(entries.map(entry => this.createMenuItem(delegate, entry, actionRunner, onHide, submenuIds)));
        }
        createMenuItem(delegate, entry, actionRunner, onHide, submenuIds) {
            // Separator
            if (entry instanceof actions_1.Separator) {
                return { type: 'separator' };
            }
            // Submenu
            if (entry instanceof actions_1.SubmenuAction) {
                if (submenuIds.has(entry.id)) {
                    console.warn(`Found submenu cycle: ${entry.id}`);
                    return undefined;
                }
                return {
                    label: (0, labels_1.unmnemonicLabel)((0, iconLabels_1.stripIcons)(entry.label)).trim(),
                    submenu: this.createMenu(delegate, entry.actions, onHide, new Set([...submenuIds, entry.id]))
                };
            }
            // Normal Menu Item
            else {
                let type = undefined;
                if (!!entry.checked) {
                    if (typeof delegate.getCheckedActionsRepresentation === 'function') {
                        type = delegate.getCheckedActionsRepresentation(entry);
                    }
                    else {
                        type = 'checkbox';
                    }
                }
                const item = {
                    label: (0, labels_1.unmnemonicLabel)((0, iconLabels_1.stripIcons)(entry.label)).trim(),
                    checked: !!entry.checked,
                    type,
                    enabled: !!entry.enabled,
                    click: event => {
                        // To preserve pre-electron-2.x behaviour, we first trigger
                        // the onHide callback and then the action.
                        // Fixes https://github.com/microsoft/vscode/issues/45601
                        onHide();
                        // Run action which will close the menu
                        this.runAction(actionRunner, entry, delegate, event);
                    }
                };
                const keybinding = !!delegate.getKeyBinding ? delegate.getKeyBinding(entry) : this.keybindingService.lookupKeybinding(entry.id);
                if (keybinding) {
                    const electronAccelerator = keybinding.getElectronAccelerator();
                    if (electronAccelerator) {
                        item.accelerator = electronAccelerator;
                    }
                    else {
                        const label = keybinding.getLabel();
                        if (label) {
                            item.label = `${item.label} [${label}]`;
                        }
                    }
                }
                return item;
            }
        }
        async runAction(actionRunner, actionToRun, delegate, event) {
            if (!delegate.skipTelemetry) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: actionToRun.id, from: 'contextMenu' });
            }
            const context = delegate.getActionsContext ? delegate.getActionsContext(event) : undefined;
            const runnable = actionRunner.run(actionToRun, context);
            try {
                await runnable;
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
    };
    NativeContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService)
    ], NativeContextMenuService);
    (0, extensions_1.registerSingleton)(contextView_1.IContextMenuService, ContextMenuService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbnRleHRtZW51L2VsZWN0cm9uLXNhbmRib3gvY29udGV4dG1lbnVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFNOUIsSUFBSSxvQkFBb0IsS0FBa0IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUNsRixJQUFJLG9CQUFvQixLQUFrQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBRWxGLFlBQ3VCLG1CQUF5QyxFQUM1QyxnQkFBbUMsRUFDbEMsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDOUMsV0FBeUIsRUFDbkIsaUJBQXFDO1lBR3pELGdFQUFnRTtZQUNoRSxJQUFJLENBQUMsc0JBQVcsSUFBSSxDQUFDLElBQUEsMEJBQWlCLEVBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO2dCQUM5RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksdUNBQXNCLENBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDdEosQ0FBQztZQUVELGlDQUFpQztpQkFDNUIsQ0FBQztnQkFDTCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksd0JBQXdCLENBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDcEksQ0FBQztRQUNGLENBQUM7UUFF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