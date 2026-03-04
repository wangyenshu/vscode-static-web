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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/editor/common/config/editorOptions", "vs/base/browser/ui/hover/hoverWidget", "vs/base/browser/ui/widget", "vs/platform/opener/common/opener", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/base/common/htmlContent", "vs/nls", "vs/base/common/platform", "vs/platform/accessibility/common/accessibility", "vs/base/browser/ui/aria/aria", "vs/css!./hover"], function (require, exports, lifecycle_1, event_1, dom, keybinding_1, configuration_1, editorOptions_1, hoverWidget_1, widget_1, opener_1, instantiation_1, markdownRenderer_1, htmlContent_1, nls_1, platform_1, accessibility_1, aria_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverWidget = void 0;
    const $ = dom.$;
    var Constants;
    (function (Constants) {
        Constants[Constants["PointerSize"] = 3] = "PointerSize";
        Constants[Constants["HoverBorderWidth"] = 2] = "HoverBorderWidth";
        Constants[Constants["HoverWindowEdgeMargin"] = 2] = "HoverWindowEdgeMargin";
    })(Constants || (Constants = {}));
    let HoverWidget = class HoverWidget extends widget_1.Widget {
        get _targetWindow() {
            return dom.getWindow(this._target.targetElements[0]);
        }
        get _targetDocumentElement() {
            return dom.getWindow(this._target.targetElements[0]).document.documentElement;
        }
        get isDisposed() { return this._isDisposed; }
        get isMouseIn() { return this._lockMouseTracker.isMouseIn; }
        get domNode() { return this._hover.containerDomNode; }
        get onDispose() { return this._onDispose.event; }
        get onRequestLayout() { return this._onRequestLayout.event; }
        get anchor() { return this._hoverPosition === 2 /* HoverPosition.BELOW */ ? 0 /* AnchorPosition.BELOW */ : 1 /* AnchorPosition.ABOVE */; }
        get x() { return this._x; }
        get y() { return this._y; }
        /**
         * Whether the hover is "locked" by holding the alt/option key. When locked, the hover will not
         * hide and can be hovered regardless of whether the `hideOnHover` hover option is set.
         */
        get isLocked() { return this._isLocked; }
        set isLocked(value) {
            if (this._isLocked === value) {
                return;
            }
            this._isLocked = value;
            this._hoverContainer.classList.toggle('locked', this._isLocked);
        }
        constructor(options, _keybindingService, _configurationService, _openerService, _instantiationService, _accessibilityService) {
            super();
            this._keybindingService = _keybindingService;
            this._configurationService = _configurationService;
            this._openerService = _openerService;
            this._instantiationService = _instantiationService;
            this._accessibilityService = _accessibilityService;
            this._messageListeners = new lifecycle_1.DisposableStore();
            this._isDisposed = false;
            this._forcePosition = false;
            this._x = 0;
            this._y = 0;
            this._isLocked = false;
            this._enableFocusTraps = false;
            this._addedFocusTrap = false;
            this._onDispose = this._register(new event_1.Emitter());
            this._onRequestLayout = this._register(new event_1.Emitter());
            this._linkHandler = options.linkHandler || (url => {
                return (0, markdownRenderer_1.openLinkFromMarkdown)(this._openerService, url, (0, htmlContent_1.isMarkdownString)(options.content) ? options.content.isTrusted : undefined);
            });
            this._target = 'targetElements' in options.target ? options.target : new ElementHoverTarget(options.target);
            this._hoverPointer = options.appearance?.showPointer ? $('div.workbench-hover-pointer') : undefined;
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._hover.containerDomNode.classList.add('workbench-hover', 'fadeIn');
            if (options.appearance?.compact) {
                this._hover.containerDomNode.classList.add('workbench-hover', 'compact');
            }
            if (options.appearance?.skipFadeInAnimation) {
                this._hover.containerDomNode.classList.add('skip-fade-in');
            }
            if (options.additionalClasses) {
                this._hover.containerDomNode.classList.add(...options.additionalClasses);
            }
            if (options.position?.forcePosition) {
                this._forcePosition = true;
            }
            if (options.trapFocus) {
                this._enableFocusTraps = true;
            }
            this._hoverPosition = options.position?.hoverPosition ?? 3 /* HoverPosition.ABOVE */;
            // Don't allow mousedown out of the widget, otherwise preventDefault will call and text will
            // not be selected.
            this.onmousedown(this._hover.containerDomNode, e => e.stopPropagation());
            // Hide hover on escape
            this.onkeydown(this._hover.containerDomNode, e => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.dispose();
                }
            });
            // Hide when the window loses focus
            this._register(dom.addDisposableListener(this._targetWindow, 'blur', () => this.dispose()));
            const rowElement = $('div.hover-row.markdown-hover');
            const contentsElement = $('div.hover-contents');
            if (typeof options.content === 'string') {
                contentsElement.textContent = options.content;
                contentsElement.style.whiteSpace = 'pre-wrap';
            }
            else if (options.content instanceof HTMLElement) {
                contentsElement.appendChild(options.content);
                contentsElement.classList.add('html-hover-contents');
            }
            else {
                const markdown = options.content;
                const mdRenderer = this._instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, { codeBlockFontFamily: this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily });
                const { element } = mdRenderer.render(markdown, {
                    actionHandler: {
                        callback: (content) => this._linkHandler(content),
                        disposables: this._messageListeners
                    },
                    asyncRenderCallback: () => {
                        contentsElement.classList.add('code-hover-contents');
                        this.layout();
                        // This changes the dimensions of the hover so trigger a layout
                        this._onRequestLayout.fire();
                    }
                });
                contentsElement.appendChild(element);
            }
            rowElement.appendChild(contentsElement);
            this._hover.contentsDomNode.appendChild(rowElement);
            if (options.actions && options.actions.length > 0) {
                const statusBarElement = $('div.hover-row.status-bar');
                const actionsElement = $('div.actions');
                options.actions.forEach(action => {
                    const keybinding = this._keybindingService.lookupKeybinding(action.commandId);
                    const keybindingLabel = keybinding ? keybinding.getLabel() : null;
                    hoverWidget_1.HoverAction.render(actionsElement, {
                        label: action.label,
                        commandId: action.commandId,
                        run: e => {
                            action.run(e);
                            this.dispose();
                        },
                        iconClass: action.iconClass
                    }, keybindingLabel);
                });
                statusBarElement.appendChild(actionsElement);
                this._hover.containerDomNode.appendChild(statusBarElement);
            }
            this._hoverContainer = $('div.workbench-hover-container');
            if (this._hoverPointer) {
                this._hoverContainer.appendChild(this._hoverPointer);
            }
            this._hoverContainer.appendChild(this._hover.containerDomNode);
            // Determine whether to hide on hover
            let hideOnHover;
            if (options.actions && options.actions.length > 0) {
                // If there are actions, require hover so they can be accessed
                hideOnHover = false;
            }
            else {
                if (options.persistence?.hideOnHover === undefined) {
                    // When unset, will default to true when it's a string or when it's markdown that
                    // appears to have a link using a naive check for '](' and '</a>'
                    hideOnHover = typeof options.content === 'string' ||
                        (0, htmlContent_1.isMarkdownString)(options.content) && !options.content.value.includes('](') && !options.content.value.includes('</a>');
                }
                else {
                    // It's set explicitly
                    hideOnHover = options.persistence.hideOnHover;
                }
            }
            // Show the hover hint if needed
            if (hideOnHover && options.appearance?.showHoverHint) {
                const statusBarElement = $('div.hover-row.status-bar');
                const infoElement = $('div.info');
                infoElement.textContent = (0, nls_1.localize)('hoverhint', 'Hold {0} key to mouse over', platform_1.isMacintosh ? 'Option' : 'Alt');
                statusBarElement.appendChild(infoElement);
                this._hover.containerDomNode.appendChild(statusBarElement);
            }
            const mouseTrackerTargets = [...this._target.targetElements];
            if (!hideOnHover) {
                mouseTrackerTargets.push(this._hoverContainer);
            }
            const mouseTracker = this._register(new CompositeMouseTracker(mouseTrackerTargets));
            this._register(mouseTracker.onMouseOut(() => {
                if (!this._isLocked) {
                    this.dispose();
                }
            }));
            // Setup another mouse tracker when hideOnHover is set in order to track the hover as well
            // when it is locked. This ensures the hover will hide on mouseout after alt has been
            // released to unlock the element.
            if (hideOnHover) {
                const mouseTracker2Targets = [...this._target.targetElements, this._hoverContainer];
                this._lockMouseTracker = this._register(new CompositeMouseTracker(mouseTracker2Targets));
                this._register(this._lockMouseTracker.onMouseOut(() => {
                    if (!this._isLocked) {
                        this.dispose();
                    }
                }));
            }
            else {
                this._lockMouseTracker = mouseTracker;
            }
        }
        addFocusTrap() {
            if (!this._enableFocusTraps || this._addedFocusTrap) {
                return;
            }
            this._addedFocusTrap = true;
            // Add a hover tab loop if the hover has at least one element with a valid tabIndex
            const firstContainerFocusElement = this._hover.containerDomNode;
            const lastContainerFocusElement = this.findLastFocusableChild(this._hover.containerDomNode);
            if (lastContainerFocusElement) {
                const beforeContainerFocusElement = dom.prepend(this._hoverContainer, $('div'));
                const afterContainerFocusElement = dom.append(this._hoverContainer, $('div'));
                beforeContainerFocusElement.tabIndex = 0;
                afterContainerFocusElement.tabIndex = 0;
                this._register(dom.addDisposableListener(afterContainerFocusElement, 'focus', (e) => {
                    firstContainerFocusElement.focus();
                    e.preventDefault();
                }));
                this._register(dom.addDisposableListener(beforeContainerFocusElement, 'focus', (e) => {
                    lastContainerFocusElement.focus();
                    e.preventDefault();
                }));
            }
        }
        findLastFocusableChild(root) {
            if (root.hasChildNodes()) {
                for (let i = 0; i < root.childNodes.length; i++) {
                    const node = root.childNodes.item(root.childNodes.length - i - 1);
                    if (node.nodeType === node.ELEMENT_NODE) {
                        const parsedNode = node;
                        if (typeof parsedNode.tabIndex === 'number' && parsedNode.tabIndex >= 0) {
                            return parsedNode;
                        }
                    }
                    const recursivelyFoundElement = this.findLastFocusableChild(node);
                    if (recursivelyFoundElement) {
                        return recursivelyFoundElement;
                    }
                }
            }
            return undefined;
        }
        render(container) {
            container.appendChild(this._hoverContainer);
            const hoverFocused = this._hoverContainer.contains(this._hoverContainer.ownerDocument.activeElement);
            const accessibleViewHint = hoverFocused && (0, hoverWidget_1.getHoverAccessibleViewHint)(this._configurationService.getValue('accessibility.verbosity.hover') === true && this._accessibilityService.isScreenReaderOptimized(), this._keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel());
            if (accessibleViewHint) {
                (0, aria_1.status)(accessibleViewHint);
            }
            this.layout();
            this.addFocusTrap();
        }
        layout() {
            this._hover.containerDomNode.classList.remove('right-aligned');
            this._hover.contentsDomNode.style.maxHeight = '';
            const getZoomAccountedBoundingClientRect = (e) => {
                const zoom = dom.getDomNodeZoomLevel(e);
                const boundingRect = e.getBoundingClientRect();
                return {
                    top: boundingRect.top * zoom,
                    bottom: boundingRect.bottom * zoom,
                    right: boundingRect.right * zoom,
                    left: boundingRect.left * zoom,
                };
            };
            const targetBounds = this._target.targetElements.map(e => getZoomAccountedBoundingClientRect(e));
            const { top, right, bottom, left } = targetBounds[0];
            const width = right - left;
            const height = bottom - top;
            const targetRect = {
                top, right, bottom, left, width, height,
                center: {
                    x: left + (width / 2),
                    y: top + (height / 2)
                }
            };
            // These calls adjust the position depending on spacing.
            this.adjustHorizontalHoverPosition(targetRect);
            this.adjustVerticalHoverPosition(targetRect);
            // This call limits the maximum height of the hover.
            this.adjustHoverMaxHeight(targetRect);
            // Offset the hover position if there is a pointer so it aligns with the target element
            this._hoverContainer.style.padding = '';
            this._hoverContainer.style.margin = '';
            if (this._hoverPointer) {
                switch (this._hoverPosition) {
                    case 1 /* HoverPosition.RIGHT */:
                        targetRect.left += 3 /* Constants.PointerSize */;
                        targetRect.right += 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingLeft = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginLeft = `${-3 /* Constants.PointerSize */}px`;
                        break;
                    case 0 /* HoverPosition.LEFT */:
                        targetRect.left -= 3 /* Constants.PointerSize */;
                        targetRect.right -= 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingRight = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginRight = `${-3 /* Constants.PointerSize */}px`;
                        break;
                    case 2 /* HoverPosition.BELOW */:
                        targetRect.top += 3 /* Constants.PointerSize */;
                        targetRect.bottom += 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingTop = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginTop = `${-3 /* Constants.PointerSize */}px`;
                        break;
                    case 3 /* HoverPosition.ABOVE */:
                        targetRect.top -= 3 /* Constants.PointerSize */;
                        targetRect.bottom -= 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingBottom = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginBottom = `${-3 /* Constants.PointerSize */}px`;
                        break;
                }
                targetRect.center.x = targetRect.left + (width / 2);
                targetRect.center.y = targetRect.top + (height / 2);
            }
            this.computeXCordinate(targetRect);
            this.computeYCordinate(targetRect);
            if (this._hoverPointer) {
                // reset
                this._hoverPointer.classList.remove('top');
                this._hoverPointer.classList.remove('left');
                this._hoverPointer.classList.remove('right');
                this._hoverPointer.classList.remove('bottom');
                this.setHoverPointerPosition(targetRect);
            }
            this._hover.onContentsChanged();
        }
        computeXCordinate(target) {
            const hoverWidth = this._hover.containerDomNode.clientWidth + 2 /* Constants.HoverBorderWidth */;
            if (this._target.x !== undefined) {
                this._x = this._target.x;
            }
            else if (this._hoverPosition === 1 /* HoverPosition.RIGHT */) {
                this._x = target.right;
            }
            else if (this._hoverPosition === 0 /* HoverPosition.LEFT */) {
                this._x = target.left - hoverWidth;
            }
            else {
                if (this._hoverPointer) {
                    this._x = target.center.x - (this._hover.containerDomNode.clientWidth / 2);
                }
                else {
                    this._x = target.left;
                }
                // Hover is going beyond window towards right end
                if (this._x + hoverWidth >= this._targetDocumentElement.clientWidth) {
                    this._hover.containerDomNode.classList.add('right-aligned');
                    this._x = Math.max(this._targetDocumentElement.clientWidth - hoverWidth - 2 /* Constants.HoverWindowEdgeMargin */, this._targetDocumentElement.clientLeft);
                }
            }
            // Hover is going beyond window towards left end
            if (this._x < this._targetDocumentElement.clientLeft) {
                this._x = target.left + 2 /* Constants.HoverWindowEdgeMargin */;
            }
        }
        computeYCordinate(target) {
            if (this._target.y !== undefined) {
                this._y = this._target.y;
            }
            else if (this._hoverPosition === 3 /* HoverPosition.ABOVE */) {
                this._y = target.top;
            }
            else if (this._hoverPosition === 2 /* HoverPosition.BELOW */) {
                this._y = target.bottom - 2;
            }
            else {
                if (this._hoverPointer) {
                    this._y = target.center.y + (this._hover.containerDomNode.clientHeight / 2);
                }
                else {
                    this._y = target.bottom;
                }
            }
            // Hover on bottom is going beyond window
            if (this._y > this._targetWindow.innerHeight) {
                this._y = target.bottom;
            }
        }
        adjustHorizontalHoverPosition(target) {
            // Do not adjust horizontal hover position if x cordiante is provided
            if (this._target.x !== undefined) {
                return;
            }
            const hoverPointerOffset = (this._hoverPointer ? 3 /* Constants.PointerSize */ : 0);
            // When force position is enabled, restrict max width
            if (this._forcePosition) {
                const padding = hoverPointerOffset + 2 /* Constants.HoverBorderWidth */;
                if (this._hoverPosition === 1 /* HoverPosition.RIGHT */) {
                    this._hover.containerDomNode.style.maxWidth = `${this._targetDocumentElement.clientWidth - target.right - padding}px`;
                }
                else if (this._hoverPosition === 0 /* HoverPosition.LEFT */) {
                    this._hover.containerDomNode.style.maxWidth = `${target.left - padding}px`;
                }
                return;
            }
            // Position hover on right to target
            if (this._hoverPosition === 1 /* HoverPosition.RIGHT */) {
                const roomOnRight = this._targetDocumentElement.clientWidth - target.right;
                // Hover on the right is going beyond window.
                if (roomOnRight < this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                    const roomOnLeft = target.left;
                    // There's enough room on the left, flip the hover position
                    if (roomOnLeft >= this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                        this._hoverPosition = 0 /* HoverPosition.LEFT */;
                    }
                    // Hover on the left would go beyond window too
                    else {
                        this._hoverPosition = 2 /* HoverPosition.BELOW */;
                    }
                }
            }
            // Position hover on left to target
            else if (this._hoverPosition === 0 /* HoverPosition.LEFT */) {
                const roomOnLeft = target.left;
                // Hover on the left is going beyond window.
                if (roomOnLeft < this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                    const roomOnRight = this._targetDocumentElement.clientWidth - target.right;
                    // There's enough room on the right, flip the hover position
                    if (roomOnRight >= this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                        this._hoverPosition = 1 /* HoverPosition.RIGHT */;
                    }
                    // Hover on the right would go beyond window too
                    else {
                        this._hoverPosition = 2 /* HoverPosition.BELOW */;
                    }
                }
                // Hover on the left is going beyond window.
                if (target.left - this._hover.containerDomNode.clientWidth - hoverPointerOffset <= this._targetDocumentElement.clientLeft) {
                    this._hoverPosition = 1 /* HoverPosition.RIGHT */;
                }
            }
        }
        adjustVerticalHoverPosition(target) {
            // Do not adjust vertical hover position if the y coordinate is provided
            // or the position is forced
            if (this._target.y !== undefined || this._forcePosition) {
                return;
            }
            const hoverPointerOffset = (this._hoverPointer ? 3 /* Constants.PointerSize */ : 0);
            // Position hover on top of the target
            if (this._hoverPosition === 3 /* HoverPosition.ABOVE */) {
                // Hover on top is going beyond window
                if (target.top - this._hover.containerDomNode.clientHeight - hoverPointerOffset < 0) {
                    this._hoverPosition = 2 /* HoverPosition.BELOW */;
                }
            }
            // Position hover below the target
            else if (this._hoverPosition === 2 /* HoverPosition.BELOW */) {
                // Hover on bottom is going beyond window
                if (target.bottom + this._hover.containerDomNode.clientHeight + hoverPointerOffset > this._targetWindow.innerHeight) {
                    this._hoverPosition = 3 /* HoverPosition.ABOVE */;
                }
            }
        }
        adjustHoverMaxHeight(target) {
            let maxHeight = this._targetWindow.innerHeight / 2;
            // When force position is enabled, restrict max height
            if (this._forcePosition) {
                const padding = (this._hoverPointer ? 3 /* Constants.PointerSize */ : 0) + 2 /* Constants.HoverBorderWidth */;
                if (this._hoverPosition === 3 /* HoverPosition.ABOVE */) {
                    maxHeight = Math.min(maxHeight, target.top - padding);
                }
                else if (this._hoverPosition === 2 /* HoverPosition.BELOW */) {
                    maxHeight = Math.min(maxHeight, this._targetWindow.innerHeight - target.bottom - padding);
                }
            }
            this._hover.containerDomNode.style.maxHeight = `${maxHeight}px`;
            if (this._hover.contentsDomNode.clientHeight < this._hover.contentsDomNode.scrollHeight) {
                // Add padding for a vertical scrollbar
                const extraRightPadding = `${this._hover.scrollbar.options.verticalScrollbarSize}px`;
                if (this._hover.contentsDomNode.style.paddingRight !== extraRightPadding) {
                    this._hover.contentsDomNode.style.paddingRight = extraRightPadding;
                }
            }
        }
        setHoverPointerPosition(target) {
            if (!this._hoverPointer) {
                return;
            }
            switch (this._hoverPosition) {
                case 0 /* HoverPosition.LEFT */:
                case 1 /* HoverPosition.RIGHT */: {
                    this._hoverPointer.classList.add(this._hoverPosition === 0 /* HoverPosition.LEFT */ ? 'right' : 'left');
                    const hoverHeight = this._hover.containerDomNode.clientHeight;
                    // If hover is taller than target, then show the pointer at the center of target
                    if (hoverHeight > target.height) {
                        this._hoverPointer.style.top = `${target.center.y - (this._y - hoverHeight) - 3 /* Constants.PointerSize */}px`;
                    }
                    // Otherwise show the pointer at the center of hover
                    else {
                        this._hoverPointer.style.top = `${Math.round((hoverHeight / 2)) - 3 /* Constants.PointerSize */}px`;
                    }
                    break;
                }
                case 3 /* HoverPosition.ABOVE */:
                case 2 /* HoverPosition.BELOW */: {
                    this._hoverPointer.classList.add(this._hoverPosition === 3 /* HoverPosition.ABOVE */ ? 'bottom' : 'top');
                    const hoverWidth = this._hover.containerDomNode.clientWidth;
                    // Position pointer at the center of the hover
                    let pointerLeftPosition = Math.round((hoverWidth / 2)) - 3 /* Constants.PointerSize */;
                    // If pointer goes beyond target then position it at the center of the target
                    const pointerX = this._x + pointerLeftPosition;
                    if (pointerX < target.left || pointerX > target.right) {
                        pointerLeftPosition = target.center.x - this._x - 3 /* Constants.PointerSize */;
                    }
                    this._hoverPointer.style.left = `${pointerLeftPosition}px`;
                    break;
                }
            }
        }
        focus() {
            this._hover.containerDomNode.focus();
        }
        hide() {
            this.dispose();
        }
        dispose() {
            if (!this._isDisposed) {
                this._onDispose.fire();
                this._hoverContainer.remove();
                this._messageListeners.dispose();
                this._target.dispose();
                super.dispose();
            }
            this._isDisposed = true;
        }
    };
    exports.HoverWidget = HoverWidget;
    exports.HoverWidget = HoverWidget = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, opener_1.IOpenerService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, accessibility_1.IAccessibilityService)
    ], HoverWidget);
    class CompositeMouseTracker extends widget_1.Widget {
        get onMouseOut() { return this._onMouseOut.event; }
        get isMouseIn() { return this._isMouseIn; }
        constructor(_elements) {
            super();
            this._elements = _elements;
            this._isMouseIn = true;
            this._onMouseOut = this._register(new event_1.Emitter());
            this._elements.forEach(n => this.onmouseover(n, () => this._onTargetMouseOver(n)));
            this._elements.forEach(n => this.onmouseleave(n, () => this._onTargetMouseLeave(n)));
        }
        _onTargetMouseOver(target) {
            this._isMouseIn = true;
            this._clearEvaluateMouseStateTimeout(target);
        }
        _onTargetMouseLeave(target) {
            this._isMouseIn = false;
            this._evaluateMouseState(target);
        }
        _evaluateMouseState(target) {
            this._clearEvaluateMouseStateTimeout(target);
            // Evaluate whether the mouse is still outside asynchronously such that other mouse targets
            // have the opportunity to first their mouse in event.
            this._mouseTimeout = dom.getWindow(target).setTimeout(() => this._fireIfMouseOutside(), 0);
        }
        _clearEvaluateMouseStateTimeout(target) {
            if (this._mouseTimeout) {
                dom.getWindow(target).clearTimeout(this._mouseTimeout);
                this._mouseTimeout = undefined;
            }
        }
        _fireIfMouseOutside() {
            if (!this._isMouseIn) {
                this._onMouseOut.fire();
            }
        }
    }
    class ElementHoverTarget {
        constructor(_element) {
            this._element = _element;
            this.targetElements = [this._element];
        }
        dispose() {
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9zZXJ2aWNlcy9ob3ZlclNlcnZpY2UvaG92ZXJXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBV2hCLElBQVcsU0FJVjtJQUpELFdBQVcsU0FBUztRQUNuQix1REFBZSxDQUFBO1FBQ2YsaUVBQW9CLENBQUE7UUFDcEIsMkVBQXlCLENBQUE7SUFDMUIsQ0FBQyxFQUpVLFNBQVMsS0FBVCxTQUFTLFFBSW5CO0lBRU0sSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLGVBQU07UUFtQnRDLElBQVksYUFBYTtZQUN4QixPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBQ0QsSUFBWSxzQkFBc0I7WUFDakMsT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQztRQUMvRSxDQUFDO1FBRUQsSUFBSSxVQUFVLEtBQWMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLFNBQVMsS0FBYyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksT0FBTyxLQUFrQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBR25FLElBQUksU0FBUyxLQUFrQixPQUFPLElBQUksQ0FB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