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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "./contextMenuHandler", "./contextView"], function (require, exports, dom_1, actions_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, contextkey_1, keybinding_1, notification_1, telemetry_1, contextMenuHandler_1, contextView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuMenuDelegate = exports.ContextMenuService = void 0;
    let ContextMenuService = class ContextMenuService extends lifecycle_1.Disposable {
        get contextMenuHandler() {
            if (!this._contextMenuHandler) {
                this._contextMenuHandler = new contextMenuHandler_1.ContextMenuHandler(this.contextViewService, this.telemetryService, this.notificationService, this.keybindingService);
            }
            return this._contextMenuHandler;
        }
        constructor(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService) {
            super();
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.contextViewService = contextViewService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._contextMenuHandler = undefined;
            this._onDidShowContextMenu = this._store.add(new event_1.Emitter());
            this.onDidShowContextMenu = this._onDidShowContextMenu.event;
            this._onDidHideContextMenu = this._store.add(new event_1.Emitter());
            this.onDidHideContextMenu = this._onDidHideContextMenu.event;
        }
        configure(options) {
            this.contextMenuHandler.configure(options);
        }
        // ContextMenu
        showContextMenu(delegate) {
            delegate = ContextMenuMenuDelegate.transform(delegate, this.menuService, this.contextKeyService);
            this.contextMenuHandler.showContextMenu({
                ...delegate,
                onHide: (didCancel) => {
                    delegate.onHide?.(didCancel);
                    this._onDidHideContextMenu.fire();
                }
            });
            dom_1.ModifierKeyEmitter.getInstance().resetKeyStatus();
            this._onDidShowContextMenu.fire();
        }
    };
    exports.ContextMenuService = ContextMenuService;
    exports.ContextMenuService = ContextMenuService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], ContextMenuService);
    var ContextMenuMenuDelegate;
    (function (ContextMenuMenuDelegate) {
        function is(thing) {
            return thing && thing.menuId instanceof actions_2.MenuId;
        }
        function transform(delegate, menuService, globalContextKeyService) {
            if (!is(delegate)) {
                return delegate;
            }
            const { menuId, menuActionOptions, contextKeyService } = delegate;
            return {
                ...delegate,
                getActions: () => {
                    const target = [];
                    if (menuId) {
                        const menu = menuService.createMenu(menuId, contextKeyService ?? globalContextKeyService);
                        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, menuActionOptions, target);
                        menu.dispose();
                    }
                    if (!delegate.getActions) {
                        return target;
                    }
                    else {
                        return actions_1.Separator.join(delegate.getActions(), target);
                    }
                }
            };
        }
        ContextMenuMenuDelegate.transform = transform;
    })(ContextMenuMenuDelegate || (exports.ContextMenuMenuDelegate = ContextMenuMenuDelegate = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dE1lbnVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29udGV4dHZpZXcvYnJvd3Nlci9jb250ZXh0TWVudVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBS2pELElBQVksa0JBQWtCO1lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksdUNBQWtCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDckosQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7UUFRRCxZQUNvQixnQkFBb0QsRUFDakQsbUJBQTBELEVBQzNELGtCQUF3RCxFQUN6RCxpQkFBc0QsRUFDNUQsV0FBMEMsRUFDcEMsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBUDRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDaEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUMxQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDM0MsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQXJCbkUsd0JBQW1CLEdBQW1DLFNBQVMsQ0FBQztZQVN2RCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdB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