/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/browser/dompurify/dompurify", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/hash", "vs/base/browser/window"], function (require, exports, browser, canIUse_1, keyboardEvent_1, mouseEvent_1, async_1, errors_1, event, dompurify, lifecycle_1, network_1, platform, uri_1, hash_1, window_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragAndDropObserver = exports.ModifierKeyEmitter = exports.basicMarkupHtmlTags = exports.DetectedFullscreenMode = exports.Namespace = exports.EventHelper = exports.EventType = exports.sharedMutationObserver = exports.Dimension = exports.WindowIntervalTimer = exports.scheduleAtNextAnimationFrame = exports.runAtThisOrScheduleAtNextAnimationFrame = exports.WindowIdleValue = exports.addStandardDisposableGenericMouseUpListener = exports.addStandardDisposableGenericMouseDownListener = exports.addStandardDisposableListener = exports.onDidUnregisterWindow = exports.onWillUnregisterWindow = exports.onDidRegisterWindow = exports.hasWindow = exports.getWindowById = exports.getWindowId = exports.getWindowsCount = exports.getWindows = exports.getDocument = exports.getWindow = exports.registerWindow = void 0;
    exports.clearNode = clearNode;
    exports.addDisposableListener = addDisposableListener;
    exports.addDisposableGenericMouseDownListener = addDisposableGenericMouseDownListener;
    exports.addDisposableGenericMouseMoveListener = addDisposableGenericMouseMoveListener;
    exports.addDisposableGenericMouseUpListener = addDisposableGenericMouseUpListener;
    exports.runWhenWindowIdle = runWhenWindowIdle;
    exports.disposableWindowInterval = disposableWindowInterval;
    exports.measure = measure;
    exports.modify = modify;
    exports.addDisposableThrottledListener = addDisposableThrottledListener;
    exports.getComputedStyle = getComputedStyle;
    exports.getClientArea = getClientArea;
    exports.getTopLeftOffset = getTopLeftOffset;
    exports.size = size;
    exports.position = position;
    exports.getDomNodePagePosition = getDomNodePagePosition;
    exports.getDomNodeZoomLevel = getDomNodeZoomLevel;
    exports.getTotalWidth = getTotalWidth;
    exports.getContentWidth = getContentWidth;
    exports.getTotalScrollWidth = getTotalScrollWidth;
    exports.getContentHeight = getContentHeight;
    exports.getTotalHeight = getTotalHeight;
    exports.getLargestChildWidth = getLargestChildWidth;
    exports.isAncestor = isAncestor;
    exports.setParentFlowTo = setParentFlowTo;
    exports.isAncestorUsingFlowTo = isAncestorUsingFlowTo;
    exports.findParentWithClass = findParentWithClass;
    exports.hasParentWithClass = hasParentWithClass;
    exports.isShadowRoot = isShadowRoot;
    exports.isInShadowDOM = isInShadowDOM;
    exports.getShadowRoot = getShadowRoot;
    exports.getActiveElement = getActiveElement;
    exports.isActiveElement = isActiveElement;
    exports.isAncestorOfActiveElement = isAncestorOfActiveElement;
    exports.isActiveDocument = isActiveDocument;
    exports.getActiveDocument = getActiveDocument;
    exports.getActiveWindow = getActiveWindow;
    exports.isGlobalStylesheet = isGlobalStylesheet;
    exports.createStyleSheet2 = createStyleSheet2;
    exports.createStyleSheet = createStyleSheet;
    exports.cloneGlobalStylesheets = cloneGlobalStylesheets;
    exports.createMetaElement = createMetaElement;
    exports.createLinkElement = createLinkElement;
    exports.createCSSRule = createCSSRule;
    exports.removeCSSRulesContainingSelector = removeCSSRulesContainingSelector;
    exports.isMouseEvent = isMouseEvent;
    exports.isKeyboardEvent = isKeyboardEvent;
    exports.isPointerEvent = isPointerEvent;
    exports.isDragEvent = isDragEvent;
    exports.isEventLike = isEventLike;
    exports.saveParentsScrollTop = saveParentsScrollTop;
    exports.restoreParentsScrollTop = restoreParentsScrollTop;
    exports.trackFocus = trackFocus;
    exports.after = after;
    exports.append = append;
    exports.prepend = prepend;
    exports.reset = reset;
    exports.$ = $;
    exports.join = join;
    exports.setVisibility = setVisibility;
    exports.show = show;
    exports.hide = hide;
    exports.removeTabIndexAndUpdateFocus = removeTabIndexAndUpdateFocus;
    exports.finalHandler = finalHandler;
    exports.domContentLoaded = domContentLoaded;
    exports.computeScreenAwareSize = computeScreenAwareSize;
    exports.windowOpenNoOpener = windowOpenNoOpener;
    exports.windowOpenPopup = windowOpenPopup;
    exports.windowOpenWithSuccess = windowOpenWithSuccess;
    exports.animate = animate;
    exports.asCSSUrl = asCSSUrl;
    exports.asCSSPropertyValue = asCSSPropertyValue;
    exports.asCssValueWithDefault = asCssValueWithDefault;
    exports.triggerDownload = triggerDownload;
    exports.triggerUpload = triggerUpload;
    exports.detectFullscreen = detectFullscreen;
    exports.hookDomPurifyHrefAndSrcSanitizer = hookDomPurifyHrefAndSrcSanitizer;
    exports.safeInnerHtml = safeInnerHtml;
    exports.multibyteAwareBtoa = multibyteAwareBtoa;
    exports.getCookieValue = getCookieValue;
    exports.h = h;
    exports.copyAttributes = copyAttributes;
    exports.trackAttributes = trackAttributes;
    //# region Multi-Window Support Utilities
    _a = (function () {
        const windows = new Map();
        (0, window_1.ensureCodeWindow)(window_1.mainWindow, 1);
        const mainWindowRegistration = { window: window_1.mainWindow, disposables: new lifecycle_1.DisposableStore() };
        windows.set(window_1.mainWindow.vscodeWindowId, mainWindowRegistration);
        const onDidRegisterWindow = new event.Emitter();
        const onDidUnregisterWindow = new event.Emitter();
        const onWillUnregisterWindow = new event.Emitter();
        function getWindowById(windowId, fallbackToMain) {
            const window = typeof windowId === 'number' ? windows.get(windowId) : undefined;
            return window ?? (fallbackToMain ? mainWindowRegistration : undefined);
        }
        return {
            onDidRegisterWindow: onDidRegisterWindow.event,
            onWillUnregisterWindow: onWillUnregisterWindow.event,
            onDidUnregisterWindow: onDidUnregisterWindow.event,
            registerWindow(window) {
                if (windows.has(window.vscodeWindowId)) {
                    return lifecycle_1.Disposable.None;
                }
                const disposables = new lifecycle_1.DisposableStore();
                const registeredWindow = {
                    window,
                    disposables: disposables.add(new lifecycle_1.DisposableStore())
                };
                windows.set(window.vscodeWindowId, registeredWindow);
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    windows.delete(window.vscodeWindowId);
                    onDidUnregisterWindow.fire(window);
                }));
                disposables.add(addDisposableListener(window, exports.EventType.BEFORE_UNLOAD, () => {
                    onWillUnregisterWindow.fire(window);
                }));
                onDidRegisterWindow.fire(registeredWindow);
                return disposables;
            },
            getWindows() {
                return windows.values();
            },
            getWindowsCount() {
                return windows.size;
            },
            getWindowId(targetWindow) {
                return targetWindow.vscodeWindowId;
            },
            hasWindow(windowId) {
                return windows.has(windowId);
            },
            getWindowById,
            getWindow(e) {
                const candidateNode = e;
                if (candidateNode?.ownerDocument?.defaultView) {
                    return candidateNode.ownerDocument.defaultView.window;
                }
                const candidateEvent = e;
                if (candidateEvent?.view) {
                    return candidateEvent.view.window;
                }
                return window_1.mainWindow;
            },
            getDocument(e) {
                const candidateNode = e;
                return (0, exports.getWindow)(candidateNode).document;
            }
        };
    })(), exports.registerWindow = _a.registerWindow, exports.getWindow = _a.getWindow, exports.getDocument = _a.getDocument, exports.getWindows = _a.getWindows, exports.getWindowsCount = _a.getWindowsCount, exports.getWindowId = _a.getWindowId, exports.getWindowById = _a.getWindowById, exports.hasWindow = _a.hasWindow, exports.onDidRegisterWindow = _a.onDidRegisterWindow, exports.onWillUnregisterWindow = _a.onWillUnregisterWindow, exports.onDidUnregisterWindow = _a.onDidUnregisterWindow;
    //#endregion
    function clearNode(node) {
        while (node.firstChild) {
            node.firstChild.remove();
        }
    }
    class DomListener {
        constructor(node, type, handler, options) {
            this._node = node;
            this._type = type;
            this._handler = handler;
            this._options = (options || false);
            this._node.addEventListener(this._type, this._handler, this._options);
        }
        dispose() {
            if (!this._handler) {
                // Already disposed
                return;
            }
            this._node.removeEventListener(this._type, this._handler, this._options);
            // Prevent leakers from holding on to the dom or handler func
            this._node = null;
            this._handler = null;
        }
    }
    function addDisposableListener(node, type, handler, useCaptureOrOptions) {
        return new DomListener(node, type, handler, useCaptureOrOptions);
    }
    function _wrapAsStandardMouseEvent(targetWindow, handler) {
        return function (e) {
            return handler(new mouseEvent_1.StandardMouseEvent(targetWindow, e));
        };
    }
    function _wrapAsStandardKeyboardEvent(handler) {
        return function (e) {
            return handler(new keyboardEvent_1.StandardKeyboardEvent(e));
        };
    }
    const addStandardDisposableListener = function addStandardDisposableListener(node, type, handler, useCapture) {
        let wrapHandler = handler;
        if (type === 'click' || type === 'mousedown') {
            wrapHandler = _wrapAsStandardMouseEvent((0, exports.getWindow)(node), handler);
        }
        else if (type === 'keydown' || type === 'keypress' || type === 'keyup') {
            wrapHandler = _wrapAsStandardKeyboardEvent(handler);
        }
        return addDisposableListener(node, type, wrapHandler, useCapture);
    };
    exports.addStandardDisposableListener = addStandardDisposableListener;
    const addStandardDisposableGenericMouseDownListener = function addStandardDisposableListener(node, handler, useCapture) {
        const wrapHandler = _wrapAsStandardMouseEvent((0, exports.getWindow)(node), handler);
        return addDisposableGenericMouseDownListener(node, wrapHandler, useCapture);
    };
    exports.addStandardDisposableGenericMouseDownListener = addStandardDisposableGenericMouseDownListener;
    const addStandardDisposableGenericMouseUpListener = function addStandardDisposableListener(node, handler, useCapture) {
        const wrapHandler = _wrapAsStandardMouseEvent((0, exports.getWindow)(node), handler);
        return addDisposableGenericMouseUpListener(node, wrapHandler, useCapture);
    };
    exports.addStandardDisposableGenericMouseUpListener = addStandardDisposableGenericMouseUpListener;
    function addDisposableGenericMouseDownListener(node, handler, useCapture) {
        return addDisposableListener(node, platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? exports.EventType.POINTER_DOWN : exports.EventType.MOUSE_DOWN, handler, useCapture);
    }
    function addDisposableGenericMouseMoveListener(node, handler, useCapture) {
        return addDisposableListener(node, platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? exports.EventType.POINTER_MOVE : exports.EventType.MOUSE_MOVE, handler, useCapture);
    }
    function addDisposableGenericMouseUpListener(node, handler, useCapture) {
        return addDisposableListener(node, platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? exports.EventType.POINTER_UP : exports.EventType.MOUSE_UP, handler, useCapture);
    }
    /**
     * Execute the callback the next time the browser is idle, returning an
     * {@link IDisposable} that will cancel the callback when disposed. This wraps
     * [requestIdleCallback] so it will fallback to [setTimeout] if the environment
     * doesn't support it.
     *
     * @param targetWindow The window for which to run the idle callback
     * @param callback The callback to run when idle, this includes an
     * [IdleDeadline] that provides the time alloted for the idle callback by the
     * browser. Not respecting this deadline will result in a degraded user
     * experience.
     * @param timeout A timeout at which point to queue no longer wait for an idle
     * callback but queue it on the regular event loop (like setTimeout). Typically
     * this should not be used.
     *
     * [IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
     * [requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
     * [setTimeout]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
     */
    function runWhenWindowIdle(targetWindow, callback, timeout) {
        return (0, async_1._runWhenIdle)(targetWindow, callback, timeout);
    }
    /**
     * An implementation of the "idle-until-urgent"-strategy as introduced
     * here: https://philipwalton.com/articles/idle-until-urgent/
     */
    class WindowIdleValue extends async_1.AbstractIdleValue {
        constructor(targetWindow, executor) {
            super(targetWindow, executor);
        }
    }
    exports.WindowIdleValue = WindowIdleValue;
    function disposableWindowInterval(targetWindow, handler, interval, iterations) {
        let iteration = 0;
        const timer = targetWindow.setInterval(() => {
            iteration++;
            if ((typeof iterations === 'number' && iteration >= iterations) || handler() === true) {
                disposable.dispose();
            }
        }, interval);
        const disposable = (0, lifecycle_1.toDisposable)(() => {
            targetWindow.clearInterval(timer);
        });
        return disposable;
    }
    class WindowIntervalTimer extends async_1.IntervalTimer {
        /**
         *
         * @param node The optional node from which the target window is determined
         */
        constructor(node) {
            super();
            this.defaultTarget = node && (0, exports.getWindow)(node);
        }
        cancelAndSet(runner, interval, targetWindow) {
            return super.cancelAndSet(runner, interval, targetWindow ?? this.defaultTarget);
        }
    }
    exports.WindowIntervalTimer = WindowIntervalTimer;
    class AnimationFrameQueueItem {
        constructor(runner, priority = 0) {
            this._runner = runner;
            this.priority = priority;
            this._canceled = false;
        }
        dispose() {
            this._canceled = true;
        }
        execute() {
            if (this._canceled) {
                return;
            }
            try {
                this._runner();
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        // Sort by priority (largest to lowest)
        static sort(a, b) {
            return b.priority - a.priority;
        }
    }
    (function () {
        /**
         * The runners scheduled at the next animation frame
         */
        const NEXT_QUEUE = new Map();
        /**
         * The runners scheduled at the current animation frame
         */
        const CURRENT_QUEUE = new Map();
        /**
         * A flag to keep track if the native requestAnimationFrame was already called
         */
        const animFrameRequested = new Map();
        /**
         * A flag to indicate if currently handling a native requestAnimationFrame callback
         */
        const inAnimationFrameRunner = new Map();
        const animationFrameRunner = (targetWindowId) => {
            animFrameRequested.set(targetWindowId, false);
            const currentQueue = NEXT_QUEUE.get(targetWindowId) ?? [];
            CURRENT_QUEUE.set(targetWindowId, currentQueue);
            NEXT_QUEUE.set(targetWindowId, []);
            inAnimationFrameRunner.set(targetWindowId, true);
            while (currentQueue.length > 0) {
                currentQueue.sort(AnimationFrameQueueItem.sort);
                const top = currentQueue.shift();
                top.execute();
            }
            inAnimationFrameRunner.set(targetWindowId, false);
        };
        exports.scheduleAtNextAnimationFrame = (targetWindow, runner, priority = 0) => {
            const targetWindowId = (0, exports.getWindowId)(targetWindow);
            const item = new AnimationFrameQueueItem(runner, priority);
            let nextQueue = NEXT_QUEUE.get(targetWindowId);
            if (!nextQueue) {
                nextQueue = [];
                NEXT_QUEUE.set(targetWindowId, nextQueue);
            }
            nextQueue.push(item);
            if (!animFrameRequested.get(targetWindowId)) {
                animFrameRequested.set(targetWindowId, true);
                targetWindow.requestAnimationFrame(() => animationFrameRunner(targetWindowId));
            }
            return item;
        };
        exports.runAtThisOrScheduleAtNextAnimationFrame = (targetWindow, runner, priority) => {
            const targetWindowId = (0, exports.getWindowId)(targetWindow);
            if (inAnimationFrameRunner.get(targetWindowId)) {
                const item = new AnimationFrameQueueItem(runner, priority);
                let currentQueue = CURRENT_QUEUE.get(targetWindowId);
                if (!currentQueue) {
                    currentQueue = [];
                    CURRENT_QUEUE.set(targetWindowId, currentQueue);
                }
                currentQueue.push(item);
                return item;
            }
            else {
                return (0, exports.scheduleAtNextAnimationFrame)(targetWindow, runner, priority);
            }
        };
    })();
    function measure(targetWindow, callback) {
        return (0, exports.scheduleAtNextAnimationFrame)(targetWindow, callback, 10000 /* must be early */);
    }
    function modify(targetWindow, callback) {
        return (0, exports.scheduleAtNextAnimationFrame)(targetWindow, callback, -10000 /* must be late */);
    }
    const MINIMUM_TIME_MS = 8;
    const DEFAULT_EVENT_MERGER = function (lastEvent, currentEvent) {
        return currentEvent;
    };
    class TimeoutThrottledDomListener extends lifecycle_1.Disposable {
        constructor(node, type, handler, eventMerger = DEFAULT_EVENT_MERGER, minimumTimeMs = MINIMUM_TIME_MS) {
            super();
            let lastEvent = null;
            let lastHandlerTime = 0;
            const timeout = this._register(new async_1.TimeoutTimer());
            const invokeHandler = () => {
                lastHandlerTime = (new Date()).getTime();
                handler(lastEvent);
                lastEvent = null;
            };
            this._register(addDisposableListener(node, type, (e) => {
                lastEvent = eventMerger(lastEvent, e);
                const elapsedTime = (new Date()).getTime() - lastHandlerTime;
                if (elapsedTime >= minimumTimeMs) {
                    timeout.cancel();
                    invokeHandler();
                }
                else {
                    timeout.setIfNotSet(invokeHandler, minimumTimeMs - elapsedTime);
                }
            }));
        }
    }
    function addDisposableThrottledListener(node, type, handler, eventMerger, minimumTimeMs) {
        return new TimeoutThrottledDomListener(node, type, handler, eventMerger, minimumTimeMs);
    }
    function getComputedStyle(el) {
        return (0, exports.getWindow)(el).getComputedStyle(el, null);
    }
    function getClientArea(element, fallback) {
        const elWindow = (0, exports.getWindow)(element);
        const elDocument = elWindow.document;
        // Try with DOM clientWidth / clientHeight
        if (element !== elDocument.body) {
            return new Dimension(element.clientWidth, element.clientHeight);
        }
        // If visual view port exits and it's on mobile, it should be used instead of window innerWidth / innerHeight, or document.body.clientWidth / document.body.clientHeight
        if (platform.isIOS && elWindow?.visualViewport) {
            return new Dimension(elWindow.visualViewport.width, elWindow.visualViewport.height);
        }
        // Try innerWidth / innerHeight
        if (elWindow?.innerWidth && elWindow.innerHeight) {
            return new Dimension(elWindow.innerWidth, elWindow.innerHeight);
        }
        // Try with document.body.clientWidth / document.body.clientHeight
        if (elDocument.body && elDocument.body.clientWidth && elDocument.body.clientHeight) {
            return new Dimension(elDocument.body.clientWidth, elDocument.body.clientHeight);
        }
        // Try with document.documentElement.clientWidth / document.documentElement.clientHeight
        if (elDocument.documentElement && elDocument.documentElement.clientWidth && elDocument.documentElement.clientHeight) {
            return new Dimension(elDocument.documentElement.clientWidth, elDocument.documentElement.clientHeight);
        }
        if (fallback) {
            return getClientArea(fallback);
        }
        throw new Error('Unable to figure out browser width and height');
    }
    class SizeUtils {
        // Adapted from WinJS
        // Converts a CSS positioning string for the specified element to pixels.
        static convertToPixels(element, value) {
            return parseFloat(value) || 0;
        }
        static getDimension(element, cssPropertyName, jsPropertyName) {
            const computedStyle = getComputedStyle(element);
            const value = computedStyle ? computedStyle.getPropertyValue(cssPropertyName) : '0';
            return SizeUtils.convertToPixels(element, value);
        }
        static getBorderLeftWidth(element) {
            return SizeUtils.getDimension(element, 'border-left-width', 'borderLeftWidth');
        }
        static getBorderRightWidth(element) {
            return SizeUtils.getDimension(element, 'border-right-width', 'borderRightWidth');
        }
        static getBorderTopWidth(element) {
            return SizeUtils.getDimension(element, 'border-top-width', 'borderTopWidth');
        }
        static getBorderBottomWidth(element) {
            return SizeUtils.getDimension(element, 'border-bottom-width', 'borderBottomWidth');
        }
        static getPaddingLeft(element) {
            return SizeUtils.getDimension(element, 'padding-left', 'paddingLeft');
        }
        static getPaddingRight(element) {
            return SizeUtils.getDimension(element, 'padding-right', 'paddingRight');
        }
        static getPaddingTop(element) {
            return SizeUtils.getDimension(element, 'padding-top', 'paddingTop');
        }
        static getPaddingBottom(element) {
            return SizeUtils.getDimension(element, 'padding-bottom', 'paddingBottom');
        }
        static getMarginLeft(element) {
            return SizeUtils.getDimension(element, 'margin-left', 'marginLeft');
        }
        static getMarginTop(element) {
            return SizeUtils.getDimension(element, 'margin-top', 'marginTop');
        }
        static getMarginRight(element) {
            return SizeUtils.getDimension(element, 'margin-right', 'marginRight');
        }
        static getMarginBottom(element) {
            return SizeUtils.getDimension(element, 'margin-bottom', 'marginBottom');
        }
    }
    class Dimension {
        static { this.None = new Dimension(0, 0); }
        constructor(width, height) {
            this.width = width;
            this.height = height;
        }
        with(width = this.width, height = this.height) {
            if (width !== this.width || height !== this.height) {
                return new Dimension(width, height);
            }
            else {
                return this;
            }
        }
        static is(obj) {
            return typeof obj === 'object' && typeof obj.height === 'number' && typeof obj.width === 'number';
        }
        static lift(obj) {
            if (obj instanceof Dimension) {
                return obj;
            }
            else {
                return new Dimension(obj.width, obj.height);
            }
        }
        static equals(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.width === b.width && a.height === b.height;
        }
    }
    exports.Dimension = Dimension;
    function getTopLeftOffset(element) {
        // Adapted from WinJS.Utilities.getPosition
        // and added borders to the mix
        let offsetParent = element.offsetParent;
        let top = element.offsetTop;
        let left = element.offsetLeft;
        while ((element = element.parentNode) !== null
            && element !== element.ownerDocument.body
            && element !== element.ownerDocument.documentElement) {
            top -= element.scrollTop;
            const c = isShadowRoot(element) ? null : getComputedStyle(element);
            if (c) {
                left -= c.direction !== 'rtl' ? element.scrollLeft : -element.scrollLeft;
            }
            if (element === offsetParent) {
                left += SizeUtils.getBorderLeftWidth(element);
                top += SizeUtils.getBorderTopWidth(element);
                top += element.offsetTop;
                left += element.offsetLeft;
                offsetParent = element.offsetParent;
            }
        }
        return {
            left: left,
            top: top
        };
    }
    function size(element, width, height) {
        if (typeof width === 'number') {
            element.style.width = `${width}px`;
        }
        if (typeof height === 'number') {
            element.style.height = `${height}px`;
        }
    }
    function position(element, top, right, bottom, left, position = 'absolute') {
        if (typeof top === 'number') {
            element.style.top = `${top}px`;
        }
        if (typeof right === 'number') {
            element.style.right = `${right}px`;
        }
        if (typeof bottom === 'number') {
            element.style.bottom = `${bottom}px`;
        }
        if (typeof left === 'number') {
            element.style.left = `${left}px`;
        }
        element.style.position = position;
    }
    /**
     * Returns the position of a dom node relative to the entire page.
     */
    function getDomNodePagePosition(domNode) {
        const bb = domNode.getBoundingClientRect();
        const window = (0, exports.getWindow)(domNode);
        return {
            left: bb.left + window.scrollX,
            top: bb.top + window.scrollY,
            width: bb.width,
            height: bb.height
        };
    }
    /**
     * Returns the effective zoom on a given element before window zoom level is applied
     */
    function getDomNodeZoomLevel(domNode) {
        let testElement = domNode;
        let zoom = 1.0;
        do {
            const elementZoomLevel = getComputedStyle(testElement).zoom;
            if (elementZoomLevel !== null && elementZoomLevel !== undefined && elementZoomLevel !== '1') {
                zoom *= elementZoomLevel;
            }
            testElement = testElement.parentElement;
        } while (testElement !== null && testElement !== testElement.ownerDocument.documentElement);
        return zoom;
    }
    // Adapted from WinJS
    // Gets the width of the element, including margins.
    function getTotalWidth(element) {
        const margin = SizeUtils.getMarginLeft(element) + SizeUtils.getMarginRight(element);
        return element.offsetWidth + margin;
    }
    function getContentWidth(element) {
        const border = SizeUtils.getBorderLeftWidth(element) + SizeUtils.getBorderRightWidth(element);
        const padding = SizeUtils.getPaddingLeft(element) + SizeUtils.getPaddingRight(element);
        return element.offsetWidth - border - padding;
    }
    function getTotalScrollWidth(element) {
        const margin = SizeUtils.getMarginLeft(element) + SizeUtils.getMarginRight(element);
        return element.scrollWidth + margin;
    }
    // Adapted from WinJS
    // Gets the height of the content of the specified element. The content height does not include borders or padding.
    function getContentHeight(element) {
        const border = SizeUtils.getBorderTopWidth(element) + SizeUtils.getBorderBottomWidth(element);
        const padding = SizeUtils.getPaddingTop(element) + SizeUtils.getPaddingBottom(element);
        return element.offsetHeight - border - padding;
    }
    // Adapted from WinJS
    // Gets the height of the element, including its margins.
    function getTotalHeight(element) {
        const margin = SizeUtils.getMarginTop(element) + SizeUtils.getMarginBottom(element);
        return element.offsetHeight + margin;
    }
    // Gets the left coordinate of the specified element relative to the specified parent.
    function getRelativeLeft(element, parent) {
        if (element === null) {
            return 0;
        }
        const elementPosition = getTopLeftOffset(element);
        const parentPosition = getTopLeftOffset(parent);
        return elementPosition.left - parentPosition.left;
    }
    function getLargestChildWidth(parent, children) {
        const childWidths = children.map((child) => {
            return Math.max(getTotalScrollWidth(child), getTotalWidth(child)) + getRelativeLeft(child, parent) || 0;
        });
        const maxWidth = Math.max(...childWidths);
        return maxWidth;
    }
    // ----------------------------------------------------------------------------------------
    function isAncestor(testChild, testAncestor) {
        return Boolean(testAncestor?.contains(testChild));
    }
    const parentFlowToDataKey = 'parentFlowToElementId';
    /**
     * Set an explicit parent to use for nodes that are not part of the
     * regular dom structure.
     */
    function setParentFlowTo(fromChildElement, toParentElement) {
        fromChildElement.dataset[parentFlowToDataKey] = toParentElement.id;
    }
    function getParentFlowToElement(node) {
        const flowToParentId = node.dataset[parentFlowToDataKey];
        if (typeof flowToParentId === 'string') {
            return node.ownerDocument.getElementById(flowToParentId);
        }
        return null;
    }
    /**
     * Check if `testAncestor` is an ancestor of `testChild`, observing the explicit
     * parents set by `setParentFlowTo`.
     */
    function isAncestorUsingFlowTo(testChild, testAncestor) {
        let node = testChild;
        while (node) {
            if (node === testAncestor) {
                return true;
            }
            if (node instanceof HTMLElement) {
                const flowToParentElement = getParentFlowToElement(node);
                if (flowToParentElement) {
                    node = flowToParentElement;
                    continue;
                }
            }
            node = node.parentNode;
        }
        return false;
    }
    function findParentWithClass(node, clazz, stopAtClazzOrNode) {
        while (node && node.nodeType === node.ELEMENT_NODE) {
            if (node.classList.contains(clazz)) {
                return node;
            }
            if (stopAtClazzOrNode) {
                if (typeof stopAtClazzOrNode === 'string') {
                    if (node.classList.contains(stopAtClazzOrNode)) {
                        return null;
                    }
                }
                else {
                    if (node === stopAtClazzOrNode) {
                        return null;
                    }
                }
            }
            node = node.parentNode;
        }
        return null;
    }
    function hasParentWithClass(node, clazz, stopAtClazzOrNode) {
        return !!findParentWithClass(node, clazz, stopAtClazzOrNode);
    }
    function isShadowRoot(node) {
        return (node && !!node.host && !!node.mode);
    }
    function isInShadowDOM(domNode) {
        return !!getShadowRoot(domNode);
    }
    function getShadowRoot(domNode) {
        while (domNode.parentNode) {
            if (domNode === domNode.ownerDocument?.body) {
                // reached the body
                return null;
            }
            domNode = domNode.parentNode;
        }
        return isShadowRoot(domNode) ? domNode : null;
    }
    /**
     * Returns the active element across all child windows
     * based on document focus. Falls back to the main
     * window if no window has focus.
     */
    function getActiveElement() {
        let result = getActiveDocument().activeElement;
        while (result?.shadowRoot) {
            result = result.shadowRoot.activeElement;
        }
        return result;
    }
    /**
     * Returns true if the focused window active element matches
     * the provided element. Falls back to the main window if no
     * window has focus.
     */
    function isActiveElement(element) {
        return getActiveElement() === element;
    }
    /**
     * Returns true if the focused window active element is contained in
     * `ancestor`. Falls back to the main window if no window has focus.
     */
    function isAncestorOfActiveElement(ancestor) {
        return isAncestor(getActiveElement(), ancestor);
    }
    /**
     * Returns whether the element is in the active `document`. The active
     * document has focus or will be the main windows document.
     */
    function isActiveDocument(element) {
        return element.ownerDocument === getActiveDocument();
    }
    /**
     * Returns the active document across main and child windows.
     * Prefers the window with focus, otherwise falls back to
     * the main windows document.
     */
    function getActiveDocument() {
        if ((0, exports.getWindowsCount)() <= 1) {
            return window_1.mainWindow.document;
        }
        const documents = Array.from((0, exports.getWindows)()).map(({ window }) => window.document);
        return documents.find(doc => doc.hasFocus()) ?? window_1.mainWindow.document;
    }
    /**
     * Returns the active window across main and child windows.
     * Prefers the window with focus, otherwise falls back to
     * the main window.
     */
    function getActiveWindow() {
        const document = getActiveDocument();
        return (document.defaultView?.window ?? window_1.mainWindow);
    }
    const globalStylesheets = new Map();
    function isGlobalStylesheet(node) {
        return globalStylesheets.has(node);
    }
    /**
     * A version of createStyleSheet which has a unified API to initialize/set the style content.
     */
    function createStyleSheet2() {
        return new WrappedStyleElement();
    }
    class WrappedStyleElement {
        constructor() {
            this._currentCssStyle = '';
            this._styleSheet = undefined;
        }
        setStyle(cssStyle) {
            if (cssStyle === this._currentCssStyle) {
                return;
            }
            this._currentCssStyle = cssStyle;
            if (!this._styleSheet) {
                this._styleSheet = createStyleSheet(window_1.mainWindow.document.head, (s) => s.innerText = cssStyle);
            }
            else {
                this._styleSheet.innerText = cssStyle;
            }
        }
        dispose() {
            if (this._styleSheet) {
                this._styleSheet.remove();
                this._styleSheet = undefined;
            }
        }
    }
    function createStyleSheet(container = window_1.mainWindow.document.head, beforeAppend, disposableStore) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.media = 'screen';
        beforeAppend?.(style);
        container.appendChild(style);
        if (disposableStore) {
            disposableStore.add((0, lifecycle_1.toDisposable)(() => container.removeChild(style)));
        }
        // With <head> as container, the stylesheet becomes global and is tracked
        // to support auxiliary windows to clone the stylesheet.
        if (container === window_1.mainWindow.document.head) {
            const globalStylesheetClones = new Set();
            globalStylesheets.set(style, globalStylesheetClones);
            for (const { window: targetWindow, disposables } of (0, exports.getWindows)()) {
                if (targetWindow === window_1.mainWindow) {
                    continue; // main window is already tracked
                }
                const cloneDisposable = disposables.add(cloneGlobalStyleSheet(style, globalStylesheetClones, targetWindow));
                disposableStore?.add(cloneDisposable);
            }
        }
        return style;
    }
    function cloneGlobalStylesheets(targetWindow) {
        const disposables = new lifecycle_1.DisposableStore();
        for (const [globalStylesheet, clonedGlobalStylesheets] of globalStylesheets) {
            disposables.add(cloneGlobalStyleSheet(globalStylesheet, clonedGlobalStylesheets, targetWindow));
        }
        return disposables;
    }
    function cloneGlobalStyleSheet(globalStylesheet, globalStylesheetClones, targetWindow) {
        const disposables = new lifecycle_1.DisposableStore();
        const clone = globalStylesheet.cloneNode(true);
        targetWindow.document.head.appendChild(clone);
        disposables.add((0, lifecycle_1.toDisposable)(() => targetWindow.document.head.removeChild(clone)));
        for (const rule of getDynamicStyleSheetRules(globalStylesheet)) {
            clone.sheet?.insertRule(rule.cssText, clone.sheet?.cssRules.length);
        }
        disposables.add(exports.sharedMutationObserver.observe(globalStylesheet, disposables, { childList: true })(() => {
            clone.textContent = globalStylesheet.textContent;
        }));
        globalStylesheetClones.add(clone);
        disposables.add((0, lifecycle_1.toDisposable)(() => globalStylesheetClones.delete(clone)));
        return disposables;
    }
    exports.sharedMutationObserver = new class {
        constructor() {
            this.mutationObservers = new Map();
        }
        observe(target, disposables, options) {
            let mutationObserversPerTarget = this.mutationObservers.get(target);
            if (!mutationObserversPerTarget) {
                mutationObserversPerTarget = new Map();
                this.mutationObservers.set(target, mutationObserversPerTarget);
            }
            const optionsHash = (0, hash_1.hash)(options);
            let mutationObserverPerOptions = mutationObserversPerTarget.get(optionsHash);
            if (!mutationObserverPerOptions) {
                const onDidMutate = new event.Emitter();
                const observer = new MutationObserver(mutations => onDidMutate.fire(mutations));
                observer.observe(target, options);
                const resolvedMutationObserverPerOptions = mutationObserverPerOptions = {
                    users: 1,
                    observer,
                    onDidMutate: onDidMutate.event
                };
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    resolvedMutationObserverPerOptions.users -= 1;
                    if (resolvedMutationObserverPerOptions.users === 0) {
                        onDidMutate.dispose();
                        observer.disconnect();
                        mutationObserversPerTarget?.delete(optionsHash);
                        if (mutationObserversPerTarget?.size === 0) {
                            this.mutationObservers.delete(target);
                        }
                    }
                }));
                mutationObserversPerTarget.set(optionsHash, mutationObserverPerOptions);
            }
            else {
                mutationObserverPerOptions.users += 1;
            }
            return mutationObserverPerOptions.onDidMutate;
        }
    };
    function createMetaElement(container = window_1.mainWindow.document.head) {
        return createHeadElement('meta', container);
    }
    function createLinkElement(container = window_1.mainWindow.document.head) {
        return createHeadElement('link', container);
    }
    function createHeadElement(tagName, container = window_1.mainWindow.document.head) {
        const element = document.createElement(tagName);
        container.appendChild(element);
        return element;
    }
    let _sharedStyleSheet = null;
    function getSharedStyleSheet() {
        if (!_sharedStyleSheet) {
            _sharedStyleSheet = createStyleSheet();
        }
        return _sharedStyleSheet;
    }
    function getDynamicStyleSheetRules(style) {
        if (style?.sheet?.rules) {
            // Chrome, IE
            return style.sheet.rules;
        }
        if (style?.sheet?.cssRules) {
            // FF
            return style.sheet.cssRules;
        }
        return [];
    }
    function createCSSRule(selector, cssText, style = getSharedStyleSheet()) {
        if (!style || !cssText) {
            return;
        }
        style.sheet?.insertRule(`${selector} {${cssText}}`, 0);
        // Apply rule also to all cloned global stylesheets
        for (const clonedGlobalStylesheet of globalStylesheets.get(style) ?? []) {
            createCSSRule(selector, cssText, clonedGlobalStylesheet);
        }
    }
    function removeCSSRulesContainingSelector(ruleName, style = getSharedStyleSheet()) {
        if (!style) {
            return;
        }
        const rules = getDynamicStyleSheetRules(style);
        const toDelete = [];
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (isCSSStyleRule(rule) && rule.selectorText.indexOf(ruleName) !== -1) {
                toDelete.push(i);
            }
        }
        for (let i = toDelete.length - 1; i >= 0; i--) {
            style.sheet?.deleteRule(toDelete[i]);
        }
        // Remove rules also from all cloned global stylesheets
        for (const clonedGlobalStylesheet of globalStylesheets.get(style) ?? []) {
            removeCSSRulesContainingSelector(ruleName, clonedGlobalStylesheet);
        }
    }
    function isCSSStyleRule(rule) {
        return typeof rule.selectorText === 'string';
    }
    function isMouseEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof MouseEvent || e instanceof (0, exports.getWindow)(e).MouseEvent;
    }
    function isKeyboardEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof KeyboardEvent || e instanceof (0, exports.getWindow)(e).KeyboardEvent;
    }
    function isPointerEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof PointerEvent || e instanceof (0, exports.getWindow)(e).PointerEvent;
    }
    function isDragEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof DragEvent || e instanceof (0, exports.getWindow)(e).DragEvent;
    }
    exports.EventType = {
        // Mouse
        CLICK: 'click',
        AUXCLICK: 'auxclick',
        DBLCLICK: 'dblclick',
        MOUSE_UP: 'mouseup',
        MOUSE_DOWN: 'mousedown',
        MOUSE_OVER: 'mouseover',
        MOUSE_MOVE: 'mousemove',
        MOUSE_OUT: 'mouseout',
        MOUSE_ENTER: 'mouseenter',
        MOUSE_LEAVE: 'mouseleave',
        MOUSE_WHEEL: 'wheel',
        POINTER_UP: 'pointerup',
        POINTER_DOWN: 'pointerdown',
        POINTER_MOVE: 'pointermove',
        POINTER_LEAVE: 'pointerleave',
        CONTEXT_MENU: 'contextmenu',
        WHEEL: 'wheel',
        // Keyboard
        KEY_DOWN: 'keydown',
        KEY_PRESS: 'keypress',
        KEY_UP: 'keyup',
        // HTML Document
        LOAD: 'load',
        BEFORE_UNLOAD: 'beforeunload',
        UNLOAD: 'unload',
        PAGE_SHOW: 'pageshow',
        PAGE_HIDE: 'pagehide',
        PASTE: 'paste',
        ABORT: 'abort',
        ERROR: 'error',
        RESIZE: 'resize',
        SCROLL: 'scroll',
        FULLSCREEN_CHANGE: 'fullscreenchange',
        WK_FULLSCREEN_CHANGE: 'webkitfullscreenchange',
        // Form
        SELECT: 'select',
        CHANGE: 'change',
        SUBMIT: 'submit',
        RESET: 'reset',
        FOCUS: 'focus',
        FOCUS_IN: 'focusin',
        FOCUS_OUT: 'focusout',
        BLUR: 'blur',
        INPUT: 'input',
        // Local Storage
        STORAGE: 'storage',
        // Drag
        DRAG_START: 'dragstart',
        DRAG: 'drag',
        DRAG_ENTER: 'dragenter',
        DRAG_LEAVE: 'dragleave',
        DRAG_OVER: 'dragover',
        DROP: 'drop',
        DRAG_END: 'dragend',
        // Animation
        ANIMATION_START: browser.isWebKit ? 'webkitAnimationStart' : 'animationstart',
        ANIMATION_END: browser.isWebKit ? 'webkitAnimationEnd' : 'animationend',
        ANIMATION_ITERATION: browser.isWebKit ? 'webkitAnimationIteration' : 'animationiteration'
    };
    function isEventLike(obj) {
        const candidate = obj;
        return !!(candidate && typeof candidate.preventDefault === 'function' && typeof candidate.stopPropagation === 'function');
    }
    exports.EventHelper = {
        stop: (e, cancelBubble) => {
            e.preventDefault();
            if (cancelBubble) {
                e.stopPropagation();
            }
            return e;
        }
    };
    function saveParentsScrollTop(node) {
        const r = [];
        for (let i = 0; node && node.nodeType === node.ELEMENT_NODE; i++) {
            r[i] = node.scrollTop;
            node = node.parentNode;
        }
        return r;
    }
    function restoreParentsScrollTop(node, state) {
        for (let i = 0; node && node.nodeType === node.ELEMENT_NODE; i++) {
            if (node.scrollTop !== state[i]) {
                node.scrollTop = state[i];
            }
            node = node.parentNode;
        }
    }
    class FocusTracker extends lifecycle_1.Disposable {
        static hasFocusWithin(element) {
            if (element instanceof HTMLElement) {
                const shadowRoot = getShadowRoot(element);
                const activeElement = (shadowRoot ? shadowRoot.activeElement : element.ownerDocument.activeElement);
                return isAncestor(activeElement, element);
            }
            else {
                const window = element;
                return isAncestor(window.document.activeElement, window.document);
            }
        }
        constructor(element) {
            super();
            this._onDidFocus = this._register(new event.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            let hasFocus = FocusTracker.hasFocusWithin(element);
            let loosingFocus = false;
            const onFocus = () => {
                loosingFocus = false;
                if (!hasFocus) {
                    hasFocus = true;
                    this._onDidFocus.fire();
                }
            };
            const onBlur = () => {
                if (hasFocus) {
                    loosingFocus = true;
                    (element instanceof HTMLElement ? (0, exports.getWindow)(element) : element).setTimeout(() => {
                        if (loosingFocus) {
                            loosingFocus = false;
                            hasFocus = false;
                            this._onDidBlur.fire();
                        }
                    }, 0);
                }
            };
            this._refreshStateHandler = () => {
                const currentNodeHasFocus = FocusTracker.hasFocusWithin(element);
                if (currentNodeHasFocus !== hasFocus) {
                    if (hasFocus) {
                        onBlur();
                    }
                    else {
                        onFocus();
                    }
                }
            };
            this._register(addDisposableListener(element, exports.EventType.FOCUS, onFocus, true));
            this._register(addDisposableListener(element, exports.EventType.BLUR, onBlur, true));
            if (element instanceof HTMLElement) {
                this._register(addDisposableListener(element, exports.EventType.FOCUS_IN, () => this._refreshStateHandler()));
                this._register(addDisposableListener(element, exports.EventType.FOCUS_OUT, () => this._refreshStateHandler()));
            }
        }
        refreshState() {
            this._refreshStateHandler();
        }
    }
    /**
     * Creates a new `IFocusTracker` instance that tracks focus changes on the given `element` and its descendants.
     *
     * @param element The `HTMLElement` or `Window` to track focus changes on.
     * @returns An `IFocusTracker` instance.
     */
    function trackFocus(element) {
        return new FocusTracker(element);
    }
    function after(sibling, child) {
        sibling.after(child);
        return child;
    }
    function append(parent, ...children) {
        parent.append(...children);
        if (children.length === 1 && typeof children[0] !== 'string') {
            return children[0];
        }
    }
    function prepend(parent, child) {
        parent.insertBefore(child, parent.firstChild);
        return child;
    }
    /**
     * Removes all children from `parent` and appends `children`
     */
    function reset(parent, ...children) {
        parent.innerText = '';
        append(parent, ...children);
    }
    const SELECTOR_REGEX = /([\w\-]+)?(#([\w\-]+))?((\.([\w\-]+))*)/;
    var Namespace;
    (function (Namespace) {
        Namespace["HTML"] = "http://www.w3.org/1999/xhtml";
        Namespace["SVG"] = "http://www.w3.org/2000/svg";
    })(Namespace || (exports.Namespace = Namespace = {}));
    function _$(namespace, description, attrs, ...children) {
        const match = SELECTOR_REGEX.exec(description);
        if (!match) {
            throw new Error('Bad use of emmet');
        }
        const tagName = match[1] || 'div';
        let result;
        if (namespace !== Namespace.HTML) {
            result = document.createElementNS(namespace, tagName);
        }
        else {
            result = document.createElement(tagName);
        }
        if (match[3]) {
            result.id = match[3];
        }
        if (match[4]) {
            result.className = match[4].replace(/\./g, ' ').trim();
        }
        if (attrs) {
            Object.entries(attrs).forEach(([name, value]) => {
                if (typeof value === 'undefined') {
                    return;
                }
                if (/^on\w+$/.test(name)) {
                    result[name] = value;
                }
                else if (name === 'selected') {
                    if (value) {
                        result.setAttribute(name, 'true');
                    }
                }
                else {
                    result.setAttribute(name, value);
                }
            });
        }
        result.append(...children);
        return result;
    }
    function $(description, attrs, ...children) {
        return _$(Namespace.HTML, description, attrs, ...children);
    }
    $.SVG = function (description, attrs, ...children) {
        return _$(Namespace.SVG, description, attrs, ...children);
    };
    function join(nodes, separator) {
        const result = [];
        nodes.forEach((node, index) => {
            if (index > 0) {
                if (separator instanceof Node) {
                    result.push(separator.cloneNode());
                }
                else {
                    result.push(document.createTextNode(separator));
                }
            }
            result.push(node);
        });
        return result;
    }
    function setVisibility(visible, ...elements) {
        if (visible) {
            show(...elements);
        }
        else {
            hide(...elements);
        }
    }
    function show(...elements) {
        for (const element of elements) {
            element.style.display = '';
            element.removeAttribute('aria-hidden');
        }
    }
    function hide(...elements) {
        for (const element of elements) {
            element.style.display = 'none';
            element.setAttribute('aria-hidden', 'true');
        }
    }
    function findParentWithAttribute(node, attribute) {
        while (node && node.nodeType === node.ELEMENT_NODE) {
            if (node instanceof HTMLElement && node.hasAttribute(attribute)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }
    function removeTabIndexAndUpdateFocus(node) {
        if (!node || !node.hasAttribute('tabIndex')) {
            return;
        }
        // If we are the currently focused element and tabIndex is removed,
        // standard DOM behavior is to move focus to the <body> element. We
        // typically never want that, rather put focus to the closest element
        // in the hierarchy of the parent DOM nodes.
        if (node.ownerDocument.activeElement === node) {
            const parentFocusable = findParentWithAttribute(node.parentElement, 'tabIndex');
            parentFocusable?.focus();
        }
        node.removeAttribute('tabindex');
    }
    function finalHandler(fn) {
        return e => {
            e.preventDefault();
            e.stopPropagation();
            fn(e);
        };
    }
    function domContentLoaded(targetWindow) {
        return new Promise(resolve => {
            const readyState = targetWindow.document.readyState;
            if (readyState === 'complete' || (targetWindow.document && targetWindow.document.body !== null)) {
                resolve(undefined);
            }
            else {
                const listener = () => {
                    targetWindow.window.removeEventListener('DOMContentLoaded', listener, false);
                    resolve();
                };
                targetWindow.window.addEventListener('DOMContentLoaded', listener, false);
            }
        });
    }
    /**
     * Find a value usable for a dom node size such that the likelihood that it would be
     * displayed with constant screen pixels size is as high as possible.
     *
     * e.g. We would desire for the cursors to be 2px (CSS px) wide. Under a devicePixelRatio
     * of 1.25, the cursor will be 2.5 screen pixels wide. Depending on how the dom node aligns/"snaps"
     * with the screen pixels, it will sometimes be rendered with 2 screen pixels, and sometimes with 3 screen pixels.
     */
    function computeScreenAwareSize(window, cssPx) {
        const screenPx = window.devicePixelRatio * cssPx;
        return Math.max(1, Math.floor(screenPx)) / window.devicePixelRatio;
    }
    /**
     * Open safely a new window. This is the best way to do so, but you cannot tell
     * if the window was opened or if it was blocked by the browser's popup blocker.
     * If you want to tell if the browser blocked the new window, use {@link windowOpenWithSuccess}.
     *
     * See https://github.com/microsoft/monaco-editor/issues/601
     * To protect against malicious code in the linked site, particularly phishing attempts,
     * the window.opener should be set to null to prevent the linked site from having access
     * to change the location of the current page.
     * See https://mathiasbynens.github.io/rel-noopener/
     */
    function windowOpenNoOpener(url) {
        // By using 'noopener' in the `windowFeatures` argument, the newly created window will
        // not be able to use `window.opener` to reach back to the current page.
        // See https://stackoverflow.com/a/46958731
        // See https://developer.mozilla.org/en-US/docs/Web/API/Window/open#noopener
        // However, this also doesn't allow us to realize if the browser blocked
        // the creation of the window.
        window_1.mainWindow.open(url, '_blank', 'noopener');
    }
    /**
     * Open a new window in a popup. This is the best way to do so, but you cannot tell
     * if the window was opened or if it was blocked by the browser's popup blocker.
     * If you want to tell if the browser blocked the new window, use {@link windowOpenWithSuccess}.
     *
     * Note: this does not set {@link window.opener} to null. This is to allow the opened popup to
     * be able to use {@link window.close} to close itself. Because of this, you should only use
     * this function on urls that you trust.
     *
     * In otherwords, you should almost always use {@link windowOpenNoOpener} instead of this function.
     */
    const popupWidth = 780, popupHeight = 640;
    function windowOpenPopup(url) {
        const left = Math.floor(window_1.mainWindow.screenLeft + window_1.mainWindow.innerWidth / 2 - popupWidth / 2);
        const top = Math.floor(window_1.mainWindow.screenTop + window_1.mainWindow.innerHeight / 2 - popupHeight / 2);
        window_1.mainWindow.open(url, '_blank', `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
    }
    /**
     * Attempts to open a window and returns whether it succeeded. This technique is
     * not appropriate in certain contexts, like for example when the JS context is
     * executing inside a sandboxed iframe. If it is not necessary to know if the
     * browser blocked the new window, use {@link windowOpenNoOpener}.
     *
     * See https://github.com/microsoft/monaco-editor/issues/601
     * See https://github.com/microsoft/monaco-editor/issues/2474
     * See https://mathiasbynens.github.io/rel-noopener/
     *
     * @param url the url to open
     * @param noOpener whether or not to set the {@link window.opener} to null. You should leave the default
     * (true) unless you trust the url that is being opened.
     * @returns boolean indicating if the {@link window.open} call succeeded
     */
    function windowOpenWithSuccess(url, noOpener = true) {
        const newTab = window_1.mainWindow.open();
        if (newTab) {
            if (noOpener) {
                // see `windowOpenNoOpener` for details on why this is important
                newTab.opener = null;
            }
            newTab.location.href = url;
            return true;
        }
        return false;
    }
    function animate(targetWindow, fn) {
        const step = () => {
            fn();
            stepDisposable = (0, exports.scheduleAtNextAnimationFrame)(targetWindow, step);
        };
        let stepDisposable = (0, exports.scheduleAtNextAnimationFrame)(targetWindow, step);
        return (0, lifecycle_1.toDisposable)(() => stepDisposable.dispose());
    }
    network_1.RemoteAuthorities.setPreferredWebSchema(/^https:/.test(window_1.mainWindow.location.href) ? 'https' : 'http');
    /**
     * returns url('...')
     */
    function asCSSUrl(uri) {
        if (!uri) {
            return `url('')`;
        }
        return `url('${network_1.FileAccess.uriToBrowserUri(uri).toString(true).replace(/'/g, '%27')}')`;
    }
    function asCSSPropertyValue(value) {
        return `'${value.replace(/'/g, '%27')}'`;
    }
    function asCssValueWithDefault(cssPropertyValue, dflt) {
        if (cssPropertyValue !== undefined) {
            const variableMatch = cssPropertyValue.match(/^\s*var\((.+)\)$/);
            if (variableMatch) {
                const varArguments = variableMatch[1].split(',', 2);
                if (varArguments.length === 2) {
                    dflt = asCssValueWithDefault(varArguments[1].trim(), dflt);
                }
                return `var(${varArguments[0]}, ${dflt})`;
            }
            return cssPropertyValue;
        }
        return dflt;
    }
    function triggerDownload(dataOrUri, name) {
        // If the data is provided as Buffer, we create a
        // blob URL out of it to produce a valid link
        let url;
        if (uri_1.URI.isUri(dataOrUri)) {
            url = dataOrUri.toString(true);
        }
        else {
            const blob = new Blob([dataOrUri]);
            url = URL.createObjectURL(blob);
            // Ensure to free the data from DOM eventually
            setTimeout(() => URL.revokeObjectURL(url));
        }
        // In order to download from the browser, the only way seems
        // to be creating a <a> element with download attribute that
        // points to the file to download.
        // See also https://developers.google.com/web/updates/2011/08/Downloading-resources-in-HTML5-a-download
        const activeWindow = getActiveWindow();
        const anchor = document.createElement('a');
        activeWindow.document.body.appendChild(anchor);
        anchor.download = name;
        anchor.href = url;
        anchor.click();
        // Ensure to remove the element from DOM eventually
        setTimeout(() => activeWindow.document.body.removeChild(anchor));
    }
    function triggerUpload() {
        return new Promise(resolve => {
            // In order to upload to the browser, create a
            // input element of type `file` and click it
            // to gather the selected files
            const activeWindow = getActiveWindow();
            const input = document.createElement('input');
            activeWindow.document.body.appendChild(input);
            input.type = 'file';
            input.multiple = true;
            // Resolve once the input event has fired once
            event.Event.once(event.Event.fromDOMEventEmitter(input, 'input'))(() => {
                resolve(input.files ?? undefined);
            });
            input.click();
            // Ensure to remove the element from DOM eventually
            setTimeout(() => activeWindow.document.body.removeChild(input));
        });
    }
    var DetectedFullscreenMode;
    (function (DetectedFullscreenMode) {
        /**
         * The document is fullscreen, e.g. because an element
         * in the document requested to be fullscreen.
         */
        DetectedFullscreenMode[DetectedFullscreenMode["DOCUMENT"] = 1] = "DOCUMENT";
        /**
         * The browser is fullscreen, e.g. because the user enabled
         * native window fullscreen for it.
         */
        DetectedFullscreenMode[DetectedFullscreenMode["BROWSER"] = 2] = "BROWSER";
    })(DetectedFullscreenMode || (exports.DetectedFullscreenMode = DetectedFullscreenMode = {}));
    function detectFullscreen(targetWindow) {
        // Browser fullscreen: use DOM APIs to detect
        if (targetWindow.document.fullscreenElement || targetWindow.document.webkitFullscreenElement || targetWindow.document.webkitIsFullScreen) {
            return { mode: DetectedFullscreenMode.DOCUMENT, guess: false };
        }
        // There is no standard way to figure out if the browser
        // is using native fullscreen. Via checking on screen
        // height and comparing that to window height, we can guess
        // it though.
        if (targetWindow.innerHeight === targetWindow.screen.height) {
            // if the height of the window matches the screen height, we can
            // safely assume that the browser is fullscreen because no browser
            // chrome is taking height away (e.g. like toolbars).
            return { mode: DetectedFullscreenMode.BROWSER, guess: false };
        }
        if (platform.isMacintosh || platform.isLinux) {
            // macOS and Linux do not properly report `innerHeight`, only Windows does
            if (targetWindow.outerHeight === targetWindow.screen.height && targetWindow.outerWidth === targetWindow.screen.width) {
                // if the height of the browser matches the screen height, we can
                // only guess that we are in fullscreen. It is also possible that
                // the user has turned off taskbars in the OS and the browser is
                // simply able to span the entire size of the screen.
                return { mode: DetectedFullscreenMode.BROWSER, guess: true };
            }
        }
        // Not in fullscreen
        return null;
    }
    // -- sanitize and trusted html
    /**
     * Hooks dompurify using `afterSanitizeAttributes` to check that all `href` and `src`
     * attributes are valid.
     */
    function hookDomPurifyHrefAndSrcSanitizer(allowedProtocols, allowDataImages = false) {
        // https://github.com/cure53/DOMPurify/blob/main/demos/hooks-scheme-allowlist.html
        // build an anchor to map URLs to
        const anchor = document.createElement('a');
        dompurify.addHook('afterSanitizeAttributes', (node) => {
            // check all href/src attributes for validity
            for (const attr of ['href', 'src']) {
                if (node.hasAttribute(attr)) {
                    const attrValue = node.getAttribute(attr);
                    if (attr === 'href' && attrValue.startsWith('#')) {
                        // Allow fragment links
                        continue;
                    }
                    anchor.href = attrValue;
                    if (!allowedProtocols.includes(anchor.protocol.replace(/:$/, ''))) {
                        if (allowDataImages && attr === 'src' && anchor.href.startsWith('data:')) {
                            continue;
                        }
                        node.removeAttribute(attr);
                    }
                }
            }
        });
        return (0, lifecycle_1.toDisposable)(() => {
            dompurify.removeHook('afterSanitizeAttributes');
        });
    }
    const defaultSafeProtocols = [
        network_1.Schemas.http,
        network_1.Schemas.https,
        network_1.Schemas.command,
    ];
    /**
     * List of safe, non-input html tags.
     */
    exports.basicMarkupHtmlTags = Object.freeze([
        'a',
        'abbr',
        'b',
        'bdo',
        'blockquote',
        'br',
        'caption',
        'cite',
        'code',
        'col',
        'colgroup',
        'dd',
        'del',
        'details',
        'dfn',
        'div',
        'dl',
        'dt',
        'em',
        'figcaption',
        'figure',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'i',
        'img',
        'input',
        'ins',
        'kbd',
        'label',
        'li',
        'mark',
        'ol',
        'p',
        'pre',
        'q',
        'rp',
        'rt',
        'ruby',
        'samp',
        'small',
        'small',
        'source',
        'span',
        'strike',
        'strong',
        'sub',
        'summary',
        'sup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'time',
        'tr',
        'tt',
        'u',
        'ul',
        'var',
        'video',
        'wbr',
    ]);
    const defaultDomPurifyConfig = Object.freeze({
        ALLOWED_TAGS: ['a', 'button', 'blockquote', 'code', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'input', 'label', 'li', 'p', 'pre', 'select', 'small', 'span', 'strong', 'textarea', 'ul', 'ol'],
        ALLOWED_ATTR: ['href', 'data-href', 'data-command', 'target', 'title', 'name', 'src', 'alt', 'class', 'id', 'role', 'tabindex', 'style', 'data-code', 'width', 'height', 'align', 'x-dispatch', 'required', 'checked', 'placeholder', 'type', 'start'],
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: true
    });
    /**
     * Sanitizes the given `value` and reset the given `node` with it.
     */
    function safeInnerHtml(node, value) {
        const hook = hookDomPurifyHrefAndSrcSanitizer(defaultSafeProtocols);
        try {
            const html = dompurify.sanitize(value, defaultDomPurifyConfig);
            node.innerHTML = html;
        }
        finally {
            hook.dispose();
        }
    }
    /**
     * Convert a Unicode string to a string in which each 16-bit unit occupies only one byte
     *
     * From https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
     */
    function toBinary(str) {
        const codeUnits = new Uint16Array(str.length);
        for (let i = 0; i < codeUnits.length; i++) {
            codeUnits[i] = str.charCodeAt(i);
        }
        let binary = '';
        const uint8array = new Uint8Array(codeUnits.buffer);
        for (let i = 0; i < uint8array.length; i++) {
            binary += String.fromCharCode(uint8array[i]);
        }
        return binary;
    }
    /**
     * Version of the global `btoa` function that handles multi-byte characters instead
     * of throwing an exception.
     */
    function multibyteAwareBtoa(str) {
        return btoa(toBinary(str));
    }
    class ModifierKeyEmitter extends event.Emitter {
        constructor() {
            super();
            this._subscriptions = new lifecycle_1.DisposableStore();
            this._keyStatus = {
                altKey: false,
                shiftKey: false,
                ctrlKey: false,
                metaKey: false
            };
            this._subscriptions.add(event.Event.runAndSubscribe(exports.onDidRegisterWindow, ({ window, disposables }) => this.registerListeners(window, disposables), { window: window_1.mainWindow, disposables: this._subscriptions }));
        }
        registerListeners(window, disposables) {
            disposables.add(addDisposableListener(window, 'keydown', e => {
                if (e.defaultPrevented) {
                    return;
                }
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                // If Alt-key keydown event is repeated, ignore it #112347
                // Only known to be necessary for Alt-Key at the moment #115810
                if (event.keyCode === 6 /* KeyCode.Alt */ && e.repeat) {
                    return;
                }
                if (e.altKey && !this._keyStatus.altKey) {
                    this._keyStatus.lastKeyPressed = 'alt';
                }
                else if (e.ctrlKey && !this._keyStatus.ctrlKey) {
                    this._keyStatus.lastKeyPressed = 'ctrl';
                }
                else if (e.metaKey && !this._keyStatus.metaKey) {
                    this._keyStatus.lastKeyPressed = 'meta';
                }
                else if (e.shiftKey && !this._keyStatus.shiftKey) {
                    this._keyStatus.lastKeyPressed = 'shift';
                }
                else if (event.keyCode !== 6 /* KeyCode.Alt */) {
                    this._keyStatus.lastKeyPressed = undefined;
                }
                else {
                    return;
                }
                this._keyStatus.altKey = e.altKey;
                this._keyStatus.ctrlKey = e.ctrlKey;
                this._keyStatus.metaKey = e.metaKey;
                this._keyStatus.shiftKey = e.shiftKey;
                if (this._keyStatus.lastKeyPressed) {
                    this._keyStatus.event = e;
                    this.fire(this._keyStatus);
                }
            }, true));
            disposables.add(addDisposableListener(window, 'keyup', e => {
                if (e.defaultPrevented) {
                    return;
                }
                if (!e.altKey && this._keyStatus.altKey) {
                    this._keyStatus.lastKeyReleased = 'alt';
                }
                else if (!e.ctrlKey && this._keyStatus.ctrlKey) {
                    this._keyStatus.lastKeyReleased = 'ctrl';
                }
                else if (!e.metaKey && this._keyStatus.metaKey) {
                    this._keyStatus.lastKeyReleased = 'meta';
                }
                else if (!e.shiftKey && this._keyStatus.shiftKey) {
                    this._keyStatus.lastKeyReleased = 'shift';
                }
                else {
                    this._keyStatus.lastKeyReleased = undefined;
                }
                if (this._keyStatus.lastKeyPressed !== this._keyStatus.lastKeyReleased) {
                    this._keyStatus.lastKeyPressed = undefined;
                }
                this._keyStatus.altKey = e.altKey;
                this._keyStatus.ctrlKey = e.ctrlKey;
                this._keyStatus.metaKey = e.metaKey;
                this._keyStatus.shiftKey = e.shiftKey;
                if (this._keyStatus.lastKeyReleased) {
                    this._keyStatus.event = e;
                    this.fire(this._keyStatus);
                }
            }, true));
            disposables.add(addDisposableListener(window.document.body, 'mousedown', () => {
                this._keyStatus.lastKeyPressed = undefined;
            }, true));
            disposables.add(addDisposableListener(window.document.body, 'mouseup', () => {
                this._keyStatus.lastKeyPressed = undefined;
            }, true));
            disposables.add(addDisposableListener(window.document.body, 'mousemove', e => {
                if (e.buttons) {
                    this._keyStatus.lastKeyPressed = undefined;
                }
            }, true));
            disposables.add(addDisposableListener(window, 'blur', () => {
                this.resetKeyStatus();
            }));
        }
        get keyStatus() {
            return this._keyStatus;
        }
        get isModifierPressed() {
            return this._keyStatus.altKey || this._keyStatus.ctrlKey || this._keyStatus.metaKey || this._keyStatus.shiftKey;
        }
        /**
         * Allows to explicitly reset the key status based on more knowledge (#109062)
         */
        resetKeyStatus() {
            this.doResetKeyStatus();
            this.fire(this._keyStatus);
        }
        doResetKeyStatus() {
            this._keyStatus = {
                altKey: false,
                shiftKey: false,
                ctrlKey: false,
                metaKey: false
            };
        }
        static getInstance() {
            if (!ModifierKeyEmitter.instance) {
                ModifierKeyEmitter.instance = new ModifierKeyEmitter();
            }
            return ModifierKeyEmitter.instance;
        }
        dispose() {
            super.dispose();
            this._subscriptions.dispose();
        }
    }
    exports.ModifierKeyEmitter = ModifierKeyEmitter;
    function getCookieValue(name) {
        const match = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)'); // See https://stackoverflow.com/a/25490531
        return match ? match.pop() : undefined;
    }
    class DragAndDropObserver extends lifecycle_1.Disposable {
        constructor(element, callbacks) {
            super();
            this.element = element;
            this.callbacks = callbacks;
            // A helper to fix issues with repeated DRAG_ENTER / DRAG_LEAVE
            // calls see https://github.com/microsoft/vscode/issues/14470
            // when the element has child elements where the events are fired
            // repeadedly.
            this.counter = 0;
            // Allows to measure the duration of the drag operation.
            this.dragStartTime = 0;
            this.registerListeners();
        }
        registerListeners() {
            if (this.callbacks.onDragStart) {
                this._register(addDisposableListener(this.element, exports.EventType.DRAG_START, (e) => {
                    this.callbacks.onDragStart?.(e);
                }));
            }
            if (this.callbacks.onDrag) {
                this._register(addDisposableListener(this.element, exports.EventType.DRAG, (e) => {
                    this.callbacks.onDrag?.(e);
                }));
            }
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_ENTER, (e) => {
                this.counter++;
                this.dragStartTime = e.timeStamp;
                this.callbacks.onDragEnter?.(e);
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_OVER, (e) => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                this.callbacks.onDragOver?.(e, e.timeStamp - this.dragStartTime);
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_LEAVE, (e) => {
                this.counter--;
                if (this.counter === 0) {
                    this.dragStartTime = 0;
                    this.callbacks.onDragLeave?.(e);
                }
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_END, (e) => {
                this.counter = 0;
                this.dragStartTime = 0;
                this.callbacks.onDragEnd?.(e);
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DROP, (e) => {
                this.counter = 0;
                this.dragStartTime = 0;
                this.callbacks.onDrop?.(e);
            }));
        }
    }
    exports.DragAndDropObserver = DragAndDropObserver;
    const H_REGEX = /(?<tag>[\w\-]+)?(?:#(?<id>[\w\-]+))?(?<class>(?:\.(?:[\w\-]+))*)(?:@(?<name>(?:[\w\_])+))?/;
    function h(tag, ...args) {
        let attributes;
        let children;
        if (Array.isArray(args[0])) {
            attributes = {};
            children = args[0];
        }
        else {
            attributes = args[0] || {};
            children = args[1];
        }
        const match = H_REGEX.exec(tag);
        if (!match || !match.groups) {
            throw new Error('Bad use of h');
        }
        const tagName = match.groups['tag'] || 'div';
        const el = document.createElement(tagName);
        if (match.groups['id']) {
            el.id = match.groups['id'];
        }
        const classNames = [];
        if (match.groups['class']) {
            for (const className of match.groups['class'].split('.')) {
                if (className !== '') {
                    classNames.push(className);
                }
            }
        }
        if (attributes.className !== undefined) {
            for (const className of attributes.className.split('.')) {
                if (className !== '') {
                    classNames.push(className);
                }
            }
        }
        if (classNames.length > 0) {
            el.className = classNames.join(' ');
        }
        const result = {};
        if (match.groups['name']) {
            result[match.groups['name']] = el;
        }
        if (children) {
            for (const c of children) {
                if (c instanceof HTMLElement) {
                    el.appendChild(c);
                }
                else if (typeof c === 'string') {
                    el.append(c);
                }
                else if ('root' in c) {
                    Object.assign(result, c);
                    el.appendChild(c.root);
                }
            }
        }
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                continue;
            }
            else if (key === 'style') {
                for (const [cssKey, cssValue] of Object.entries(value)) {
                    el.style.setProperty(camelCaseToHyphenCase(cssKey), typeof cssValue === 'number' ? cssValue + 'px' : '' + cssValue);
                }
            }
            else if (key === 'tabIndex') {
                el.tabIndex = value;
            }
            else {
                el.setAttribute(camelCaseToHyphenCase(key), value.toString());
            }
        }
        result['root'] = el;
        return result;
    }
    function camelCaseToHyphenCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function copyAttributes(from, to, filter) {
        for (const { name, value } of from.attributes) {
            if (!filter || filter.includes(name)) {
                to.setAttribute(name, value);
            }
        }
    }
    function copyAttribute(from, to, name) {
        const value = from.getAttribute(name);
        if (value) {
            to.setAttribute(name, value);
        }
        else {
            to.removeAttribute(name);
        }
    }
    function trackAttributes(from, to, filter) {
        copyAttributes(from, to, filter);
        const disposables = new lifecycle_1.DisposableStore();
        disposables.add(exports.sharedMutationObserver.observe(from, disposables, { attributes: true, attributeFilter: filter })(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName) {
                    copyAttribute(from, to, mutation.attributeName);
                }
            }
        }));
        return disposables;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7O0lBeUhoRyw4QkFJQztJQWtDRCxzREFFQztJQThDRCxzRkFFQztJQUVELHNGQUVDO0lBRUQsa0ZBRUM7SUFxQkQsOENBRUM7SUEyQkQsNERBWUM7SUE0SEQsMEJBRUM7SUFFRCx3QkFFQztJQTRDRCx3RUFFQztJQUVELDRDQUVDO0lBRUQsc0NBa0NDO0lBNEdELDRDQWdDQztJQVNELG9CQVFDO0lBRUQsNEJBa0JDO0lBS0Qsd0RBU0M7SUFLRCxrREFhQztJQUtELHNDQUdDO0lBRUQsMENBSUM7SUFFRCxrREFHQztJQUlELDRDQUlDO0lBSUQsd0NBR0M7SUFhRCxvREFNQztJQUlELGdDQUVDO0lBUUQsMENBRUM7SUFjRCxzREFrQkM7SUFFRCxrREFzQkM7SUFFRCxnREFFQztJQUVELG9DQUlDO0lBRUQsc0NBRUM7SUFFRCxzQ0FTQztJQU9ELDRDQVFDO0lBT0QsMENBRUM7SUFNRCw4REFFQztJQU1ELDRDQUVDO0lBT0QsOENBT0M7SUFPRCwwQ0FHQztJQUlELGdEQUVDO0lBS0QsOENBRUM7SUEyQkQsNENBNEJDO0lBRUQsd0RBUUM7SUE0RUQsOENBRUM7SUFFRCw4Q0FFQztJQTRCRCxzQ0FXQztJQUVELDRFQXNCQztJQU1ELG9DQUdDO0lBRUQsMENBR0M7SUFFRCx3Q0FHQztJQUVELGtDQUdDO0lBcUVELGtDQUlDO0lBa0JELG9EQU9DO0lBRUQsMERBT0M7SUFnRkQsZ0NBRUM7SUFFRCxzQkFHQztJQUlELHdCQUtDO0lBRUQsMEJBR0M7SUFLRCxzQkFHQztJQXdERCxjQUVDO0lBTUQsb0JBZ0JDO0lBRUQsc0NBTUM7SUFFRCxvQkFLQztJQUVELG9CQUtDO0lBY0Qsb0VBZUM7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