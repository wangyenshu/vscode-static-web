/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/menu/menu", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/theme/browser/defaultStyles"], function (require, exports, dom_1, mouseEvent_1, menu_1, actions_1, errors_1, lifecycle_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuHandler = void 0;
    class ContextMenuHandler {
        constructor(contextViewService, telemetryService, notificationService, keybindingService) {
            this.contextViewService = contextViewService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.keybindingService = keybindingService;
            this.focusToReturn = null;
            this.lastContainer = null;
            this.block = null;
            this.blockDisposable = null;
            this.options = { blockMouse: true };
        }
        configure(options) {
            this.options = options;
        }
        showContextMenu(delegate) {
            const actions = delegate.getActions();
            if (!actions.length) {
                return; // Don't render an empty context menu
            }
            this.focusToReturn = (0, dom_1.getActiveElement)();
            let menu;
            const shadowRootElement = delegate.domForShadowRoot instanceof HTMLElement ? delegate.domForShadowRoot : undefined;
            this.contextViewService.showContextView({
                getAnchor: () => delegate.getAnchor(),
                canRelayout: false,
                anchorAlignment: delegate.anchorAlignment,
                anchorAxisAlignment: delegate.anchorAxisAlignment,
                render: (container) => {
                    this.lastContainer = container;
                    const className = delegate.getMenuClassName ? delegate.getMenuClassName() : '';
                    if (className) {
                        container.className += ' ' + className;
                    }
                    // Render invisible div to block mouse interaction in the rest of the UI
                    if (this.options.blockMouse) {
                        this.block = container.appendChild((0, dom_1.$)('.context-view-block'));
                        this.block.style.position = 'fixed';
                        this.block.style.cursor = 'initial';
                        this.block.style.left = '0';
                        this.block.style.top = '0';
                        this.block.style.width = '100%';
                        this.block.style.height = '100%';
                        this.block.style.zIndex = '-1';
                        this.blockDisposable?.dispose();
                        this.blockDisposable = (0, dom_1.addDisposableListener)(this.block, dom_1.EventType.MOUSE_DOWN, e => e.stopPropagation());
                    }
                    const menuDisposables = new lifecycle_1.DisposableStore();
                    const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
                    actionRunner.onWillRun(evt => this.onActionRun(evt, !delegate.skipTelemetry), this, menuDisposables);
                    actionRunner.onDidRun(this.onDidActionRun, this, menuDisposables);
                    menu = new menu_1.Menu(container, actions, {
                        actionViewItemProvider: delegate.getActionViewItem,
                        context: delegate.getActionsContext ? delegate.getActionsContext() : null,
                        actionRunner,
                        getKeyBinding: delegate.getKeyBinding ? delegate.getKeyBinding : action => this.keybindingService.lookupKeybinding(action.id)
                    }, defaultStyles_1.defaultMenuStyles);
                    menu.onDidCancel(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    menu.onDidBlur(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    const targetWindow = (0, dom_1.getWindow)(container);
                    menuDisposables.add((0, dom_1.addDisposableListener)(targetWindow, dom_1.EventType.BLUR, () => this.contextViewService.hideContextView(true)));
                    menuDisposables.add((0, dom_1.addDisposableListener)(targetWindow, dom_1.EventType.MOUSE_DOWN, (e) => {
                        if (e.defaultPrevented) {
                            return;
                        }
                        const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
                        let element = event.target;
                        // Don't do anything as we are likely creating a context menu
                        if (event.rightButton) {
                            return;
                        }
                        while (element) {
                            if (element === container) {
                                return;
                            }
                            element = element.parentElement;
                        }
                        this.contextViewService.hideContextView(true);
                    }));
                    return (0, lifecycle_1.combinedDisposable)(menuDisposables, menu);
                },
                focus: () => {
                    menu?.focus(!!delegate.autoSelectFirstItem);
                },
                onHide: (didCancel) => {
                    delegate.onHide?.(!!didCancel);
                    if (this.block) {
                        this.block.remove();
                        this.block = null;
                    }
                    this.blockDisposable?.dispose();
                    this.blockDisposable = null;
                    if (!!this.lastContainer && ((0, dom_1.getActiveElement)() === this.lastContainer || (0, dom_1.isAncestor)((0, dom_1.getActiveElement)(), this.lastContainer))) {
                        this.focusToReturn?.focus();
                    }
                    this.lastContainer = null;
                }
            }, shadowRootElement, !!shadowRootElement);
        }
        onActionRun(e, logTelemetry) {
            if (logTelemetry) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'contextMenu' });
            }
            this.contextViewService.hideContextView(false);
        }
        onDidActionRun(e) {
            if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                this.notificationService.error(e.error);
            }
        }
    }
    exports.ContextMenuHandler = ContextMenuHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dE1lbnVIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29udGV4dHZpZXcvYnJvd3Nlci9jb250ZXh0TWVudUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxNQUFhLGtCQUFrQjtRQU85QixZQUNTLGtCQUF1QyxFQUN2QyxnQkFBbUMsRUFDbkMsbUJBQXlDLEVBQ3pDLGlCQUFxQztZQUhyQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDbkMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN6QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBVnRDLGtCQUFhLEdBQXVCLElBQUksQ0FBQztZQUN6QyxrQkFBYSxHQUF1QixJQUFJLENBQUM7WUFDekMsVUFBSyxHQUF1QixJQUFJLENBQUM7WUFDakMsb0JBQWUsR0FBdUIsSUFBSSxDQUFDO1lBQzNDLFlBQU8sR0FBK0IsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFPL0QsQ0FBQztRQUVMLFNBQVMsQ0FBQyxPQUFtQztZQUM1QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBRUQsZUFBZSxDQUFDLFFBQThCO1lBQzdDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixPQUFPLENBQUMscUNBQXFDO1lBQzlDLENBQUM7WUFFRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUEsc0JBQWdCLEdBQWlCLENBQUM7WUFFdkQsSUFBSSxJQUFzQixDQUFDO1lBRTNCLE1BQU0saUJBQWlC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