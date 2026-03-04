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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/hover/browser/hover", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/services/hoverService/hoverWidget", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/base/browser/keyboardEvent", "vs/platform/accessibility/common/accessibility", "vs/platform/layout/browser/layoutService", "vs/base/browser/window", "vs/platform/contextview/browser/contextViewService", "vs/editor/browser/services/hoverService/updatableHoverWidget", "vs/base/common/async"], function (require, exports, extensions_1, themeService_1, colorRegistry_1, hover_1, contextView_1, instantiation_1, hoverWidget_1, lifecycle_1, dom_1, keybinding_1, keyboardEvent_1, accessibility_1, layoutService_1, window_1, contextViewService_1, updatableHoverWidget_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverService = void 0;
    let HoverService = class HoverService extends lifecycle_1.Disposable {
        constructor(_instantiationService, contextMenuService, _keybindingService, _layoutService, _accessibilityService) {
            super();
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._layoutService = _layoutService;
            this._accessibilityService = _accessibilityService;
            contextMenuService.onDidShowContextMenu(() => this.hideHover());
            this._contextViewHandler = this._register(new contextViewService_1.ContextViewHandler(this._layoutService));
        }
        showHover(options, focus, skipLastFocusedUpdate) {
            if (getHoverOptionsIdentity(this._currentHoverOptions) === getHoverOptionsIdentity(options)) {
                return undefined;
            }
            if (this._currentHover && this._currentHoverOptions?.persistence?.sticky) {
                return undefined;
            }
            this._currentHoverOptions = options;
            this._lastHoverOptions = options;
            const trapFocus = options.trapFocus || this._accessibilityService.isScreenReaderOptimized();
            const activeElement = (0, dom_1.getActiveElement)();
            // HACK, remove this check when #189076 is fixed
            if (!skipLastFocusedUpdate) {
                if (trapFocus && activeElement) {
                    this._lastFocusedElementBeforeOpen = activeElement;
                }
                else {
                    this._lastFocusedElementBeforeOpen = undefined;
                }
            }
            const hoverDisposables = new lifecycle_1.DisposableStore();
            const hover = this._instantiationService.createInstance(hoverWidget_1.HoverWidget, options);
            if (options.persistence?.sticky) {
                hover.isLocked = true;
            }
            hover.onDispose(() => {
                const hoverWasFocused = this._currentHover?.domNode && (0, dom_1.isAncestorOfActiveElement)(this._currentHover.domNode);
                if (hoverWasFocused) {
                    // Required to handle cases such as closing the hover with the escape key
                    this._lastFocusedElementBeforeOpen?.focus();
                }
                // Only clear the current options if it's the current hover, the current options help
                // reduce flickering when the same hover is shown multiple times
                if (this._currentHoverOptions === options) {
                    this._currentHoverOptions = undefined;
                }
                hoverDisposables.dispose();
            }, undefined, hoverDisposables);
            // Set the container explicitly to enable aux window support
            if (!options.container) {
                const targetElement = options.target instanceof HTMLElement ? options.target : options.target.targetElements[0];
                options.container = this._layoutService.getContainer((0, dom_1.getWindow)(targetElement));
            }
            this._contextViewHandler.showContextView(new HoverContextViewDelegate(hover, focus), options.container);
            hover.onRequestLayout(() => this._contextViewHandler.layout(), undefined, hoverDisposables);
            if (options.persistence?.sticky) {
                hoverDisposables.add((0, dom_1.addDisposableListener)((0, dom_1.getWindow)(options.container).document, dom_1.EventType.MOUSE_DOWN, e => {
                    if (!(0, dom_1.isAncestor)(e.target, hover.domNode)) {
                        this.doHideHover();
                    }
                }));
            }
            else {
                if ('targetElements' in options.target) {
                    for (const element of options.target.targetElements) {
                        hoverDisposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.CLICK, () => this.hideHover()));
                    }
                }
                else {
                    hoverDisposables.add((0, dom_1.addDisposableListener)(options.target, dom_1.EventType.CLICK, () => this.hideHover()));
                }
                const focusedElement = (0, dom_1.getActiveElement)();
                if (focusedElement) {
                    const focusedElementDocument = (0, dom_1.getWindow)(focusedElement).document;
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElement, dom_1.EventType.KEY_DOWN, e => this._keyDown(e, hover, !!options.persistence?.hideOnKeyDown)));
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElementDocument, dom_1.EventType.KEY_DOWN, e => this._keyDown(e, hover, !!options.persistence?.hideOnKeyDown)));
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElement, dom_1.EventType.KEY_UP, e => this._keyUp(e, hover)));
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElementDocument, dom_1.EventType.KEY_UP, e => this._keyUp(e, hover)));
                }
            }
            if ('IntersectionObserver' in window_1.mainWindow) {
                const observer = new IntersectionObserver(e => this._intersectionChange(e, hover), { threshold: 0 });
                const firstTargetElement = 'targetElements' in options.target ? options.target.targetElements[0] : options.target;
                observer.observe(firstTargetElement);
                hoverDisposables.add((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
            }
            this._currentHover = hover;
            return hover;
        }
        hideHover() {
            if (this._currentHover?.isLocked || !this._currentHoverOptions) {
                return;
            }
            this.doHideHover();
        }
        doHideHover() {
            this._currentHover = undefined;
            this._currentHoverOptions = undefined;
            this._contextViewHandler.hideContextView();
        }
        _intersectionChange(entries, hover) {
            const entry = entries[entries.length - 1];
            if (!entry.isIntersecting) {
                hover.dispose();
            }
        }
        showAndFocusLastHover() {
            if (!this._lastHoverOptions) {
                return;
            }
            this.showHover(this._lastHoverOptions, true, true);
        }
        _keyDown(e, hover, hideOnKeyDown) {
            if (e.key === 'Alt') {
                hover.isLocked = true;
                return;
            }
            const event = new keyboardEvent_1.StandardKeyboardEvent(e);
            const keybinding = this._keybindingService.resolveKeyboardEvent(event);
            if (keybinding.getSingleModifierDispatchChords().some(value => !!value) || this._keybindingService.softDispatch(event, event.target).kind !== 0 /* ResultKind.NoMatchingKb */) {
                return;
            }
            if (hideOnKeyDown && (!this._currentHoverOptions?.trapFocus || e.key !== 'Tab')) {
                this.hideHover();
                this._lastFocusedElementBeforeOpen?.focus();
            }
        }
        _keyUp(e, hover) {
            if (e.key === 'Alt') {
                hover.isLocked = false;
                // Hide if alt is released while the mouse is not over hover/target
                if (!hover.isMouseIn) {
                    this.hideHover();
                    this._lastFocusedElementBeforeOpen?.focus();
                }
            }
        }
        // TODO: Investigate performance of this function. There seems to be a lot of content created
        //       and thrown away on start up
        setupUpdatableHover(hoverDelegate, htmlElement, content, options) {
            htmlElement.setAttribute('custom-hover', 'true');
            if (htmlElement.title !== '') {
                console.warn('HTML element already has a title attribute, which will conflict with the custom hover. Please remove the title attribute.');
                console.trace('Stack trace:', htmlElement.title);
                htmlElement.title = '';
            }
            let hoverPreparation;
            let hoverWidget;
            const hideHover = (disposeWidget, disposePreparation) => {
                const hadHover = hoverWidget !== undefined;
                if (disposeWidget) {
                    hoverWidget?.dispose();
                    hoverWidget = undefined;
                }
                if (disposePreparation) {
                    hoverPreparation?.dispose();
                    hoverPreparation = undefined;
                }
                if (hadHover) {
                    hoverDelegate.onDidHideHover?.();
                    hoverWidget = undefined;
                }
            };
            const triggerShowHover = (delay, focus, target) => {
                return new async_1.TimeoutTimer(async () => {
                    if (!hoverWidget || hoverWidget.isDisposed) {
                        hoverWidget = new updatableHoverWidget_1.UpdatableHoverWidget(hoverDelegate, target || htmlElement, delay > 0);
                        await hoverWidget.update(typeof content === 'function' ? content() : content, focus, options);
                    }
                }, delay);
            };
            let isMouseDown = false;
            const mouseDownEmitter = (0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.MOUSE_DOWN, () => {
                isMouseDown = true;
                hideHover(true, true);
            }, true);
            const mouseUpEmitter = (0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.MOUSE_UP, () => {
                isMouseDown = false;
            }, true);
            const mouseLeaveEmitter = (0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.MOUSE_LEAVE, (e) => {
                isMouseDown = false;
                hideHover(false, e.fromElement === htmlElement);
            }, true);
            const onMouseOver = (e) => {
                if (hoverPreparation) {
                    return;
                }
                const toDispose = new lifecycle_1.DisposableStore();
                const target = {
                    targetElements: [htmlElement],
                    dispose: () => { }
                };
                if (hoverDelegate.placement === undefined || hoverDelegate.placement === 'mouse') {
                    // track the mouse position
                    const onMouseMove = (e) => {
                        target.x = e.x + 10;
                        if ((e.target instanceof HTMLElement) && getHoverTargetElement(e.target, htmlElement) !== htmlElement) {
                            hideHover(true, true);
                        }
                    };
                    toDispose.add((0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.MOUSE_MOVE, onMouseMove, true));
                }
                hoverPreparation = toDispose;
                if ((e.target instanceof HTMLElement) && getHoverTargetElement(e.target, htmlElement) !== htmlElement) {
                    return; // Do not show hover when the mouse is over another hover target
                }
                toDispose.add(triggerShowHover(hoverDelegate.delay, false, target));
            };
            const mouseOverDomEmitter = (0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.MOUSE_OVER, onMouseOver, true);
            const onFocus = () => {
                if (isMouseDown || hoverPreparation) {
                    return;
                }
                const target = {
                    targetElements: [htmlElement],
                    dispose: () => { }
                };
                const toDispose = new lifecycle_1.DisposableStore();
                const onBlur = () => hideHover(true, true);
                toDispose.add((0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.BLUR, onBlur, true));
                toDispose.add(triggerShowHover(hoverDelegate.delay, false, target));
                hoverPreparation = toDispose;
            };
            // Do not show hover when focusing an input or textarea
            let focusDomEmitter;
            const tagName = htmlElement.tagName.toLowerCase();
            if (tagName !== 'input' && tagName !== 'textarea') {
                focusDomEmitter = (0, dom_1.addDisposableListener)(htmlElement, dom_1.EventType.FOCUS, onFocus, true);
            }
            const hover = {
                show: focus => {
                    hideHover(false, true); // terminate a ongoing mouse over preparation
                    triggerShowHover(0, focus); // show hover immediately
                },
                hide: () => {
                    hideHover(true, true);
                },
                update: async (newContent, hoverOptions) => {
                    content = newContent;
                    await hoverWidget?.update(content, undefined, hoverOptions);
                },
                dispose: () => {
                    mouseOverDomEmitter.dispose();
                    mouseLeaveEmitter.dispose();
                    mouseDownEmitter.dispose();
                    mouseUpEmitter.dispose();
                    focusDomEmitter?.dispose();
                    hideHover(true, true);
                }
            };
            return hover;
        }
    };
    exports.HoverService = HoverService;
    exports.HoverService = HoverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, accessibility_1.IAccessibilityService)
    ], HoverService);
    function getHoverOptionsIdentity(options) {
        if (options === undefined) {
            return undefined;
        }
        return options?.id ?? options;
    }
    class HoverContextViewDelegate {
        get anchorPosition() {
            return this._hover.anchor;
        }
        constructor(_hover, _focus = false) {
            this._hover = _hover;
            this._focus = _focus;
            // Render over all other context views
            this.layer = 1;
        }
        render(container) {
            this._hover.render(container);
            if (this._focus) {
                this._hover.focus();
            }
            return this._hover;
        }
        getAnchor() {
            return {
                x: this._hover.x,
                y: this._hover.y
            };
        }
        layout() {
            this._hover.layout();
        }
    }
    function getHoverTargetElement(element, stopElement) {
        stopElement = stopElement ?? (0, dom_1.getWindow)(element).document.body;
        while (!element.hasAttribute('custom-hover') && element !== stopElement) {
            element = element.parentElement;
        }
        return element;
    }
    (0, extensions_1.registerSingleton)(hover_1.IHoverService, HoverService, 1 /* InstantiationType.Delayed */);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-workbench .workbench-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvc2VydmljZXMvaG92ZXJTZXJ2aWNlL2hvdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSxzQkFBVTtRQVUzQyxZQUN5QyxxQkFBNEMsRUFDL0Qsa0JBQXVDLEVBQ3ZCLGtCQUFzQyxFQUMxQyxjQUE4QixFQUN2QixxQkFBNEM7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFOZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUUvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzFDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN2QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBSXBGLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksdUNBQWtCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVELFNBQVMsQ0FBQyxPQUFzQixFQUFFLEtBQWUsRUFBRSxxQkFBK0I7WUFDakYsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM3RixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsTUFBTSxF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