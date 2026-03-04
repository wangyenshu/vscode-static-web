/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/globalPointerMoveMonitor", "vs/base/browser/mouseEvent", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry"], function (require, exports, dom, globalPointerMoveMonitor_1, mouseEvent_1, async_1, lifecycle_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicCssRules = exports.GlobalEditorPointerMoveMonitor = exports.EditorPointerEventFactory = exports.EditorMouseEventFactory = exports.EditorMouseEvent = exports.CoordinatesRelativeToEditor = exports.EditorPagePosition = exports.ClientCoordinates = exports.PageCoordinates = void 0;
    exports.createEditorPagePosition = createEditorPagePosition;
    exports.createCoordinatesRelativeToEditor = createCoordinatesRelativeToEditor;
    /**
     * Coordinates relative to the whole document (e.g. mouse event's pageX and pageY)
     */
    class PageCoordinates {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this._pageCoordinatesBrand = undefined;
        }
        toClientCoordinates(targetWindow) {
            return new ClientCoordinates(this.x - targetWindow.scrollX, this.y - targetWindow.scrollY);
        }
    }
    exports.PageCoordinates = PageCoordinates;
    /**
     * Coordinates within the application's client area (i.e. origin is document's scroll position).
     *
     * For example, clicking in the top-left corner of the client area will
     * always result in a mouse event with a client.x value of 0, regardless
     * of whether the page is scrolled horizontally.
     */
    class ClientCoordinates {
        constructor(clientX, clientY) {
            this.clientX = clientX;
            this.clientY = clientY;
            this._clientCoordinatesBrand = undefined;
        }
        toPageCoordinates(targetWindow) {
            return new PageCoordinates(this.clientX + targetWindow.scrollX, this.clientY + targetWindow.scrollY);
        }
    }
    exports.ClientCoordinates = ClientCoordinates;
    /**
     * The position of the editor in the page.
     */
    class EditorPagePosition {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this._editorPagePositionBrand = undefined;
        }
    }
    exports.EditorPagePosition = EditorPagePosition;
    /**
     * Coordinates relative to the the (top;left) of the editor that can be used safely with other internal editor metrics.
     * **NOTE**: This position is obtained by taking page coordinates and transforming them relative to the
     * editor's (top;left) position in a way in which scale transformations are taken into account.
     * **NOTE**: These coordinates could be negative if the mouse position is outside the editor.
     */
    class CoordinatesRelativeToEditor {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this._positionRelativeToEditorBrand = undefined;
        }
    }
    exports.CoordinatesRelativeToEditor = CoordinatesRelativeToEditor;
    function createEditorPagePosition(editorViewDomNode) {
        const editorPos = dom.getDomNodePagePosition(editorViewDomNode);
        return new EditorPagePosition(editorPos.left, editorPos.top, editorPos.width, editorPos.height);
    }
    function createCoordinatesRelativeToEditor(editorViewDomNode, editorPagePosition, pos) {
        // The editor's page position is read from the DOM using getBoundingClientRect().
        //
        // getBoundingClientRect() returns the actual dimensions, while offsetWidth and offsetHeight
        // reflect the unscaled size. We can use this difference to detect a transform:scale()
        // and we will apply the transformation in inverse to get mouse coordinates that make sense inside the editor.
        //
        // This could be expanded to cover rotation as well maybe by walking the DOM up from `editorViewDomNode`
        // and computing the effective transformation matrix using getComputedStyle(element).transform.
        //
        const scaleX = editorPagePosition.width / editorViewDomNode.offsetWidth;
        const scaleY = editorPagePosition.height / editorViewDomNode.offsetHeight;
        // Adjust mouse offsets if editor appears to be scaled via transforms
        const relativeX = (pos.x - editorPagePosition.x) / scaleX;
        const relativeY = (pos.y - editorPagePosition.y) / scaleY;
        return new CoordinatesRelativeToEditor(relativeX, relativeY);
    }
    class EditorMouseEvent extends mouseEvent_1.StandardMouseEvent {
        constructor(e, isFromPointerCapture, editorViewDomNode) {
            super(dom.getWindow(editorViewDomNode), e);
            this._editorMouseEventBrand = undefined;
            this.isFromPointerCapture = isFromPointerCapture;
            this.pos = new PageCoordinates(this.posx, this.posy);
            this.editorPos = createEditorPagePosition(editorViewDomNode);
            this.relativePos = createCoordinatesRelativeToEditor(editorViewDomNode, this.editorPos, this.pos);
        }
    }
    exports.EditorMouseEvent = EditorMouseEvent;
    class EditorMouseEventFactory {
        constructor(editorViewDomNode) {
            this._editorViewDomNode = editorViewDomNode;
        }
        _create(e) {
            return new EditorMouseEvent(e, false, this._editorViewDomNode);
        }
        onContextMenu(target, callback) {
            return dom.addDisposableListener(target, 'contextmenu', (e) => {
                callback(this._create(e));
            });
        }
        onMouseUp(target, callback) {
            return dom.addDisposableListener(target, 'mouseup', (e) => {
                callback(this._create(e));
            });
        }
        onMouseDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.MOUSE_DOWN, (e) => {
                callback(this._create(e));
            });
        }
        onPointerDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_DOWN, (e) => {
                callback(this._create(e), e.pointerId);
            });
        }
        onMouseLeave(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.MOUSE_LEAVE, (e) => {
                callback(this._create(e));
            });
        }
        onMouseMove(target, callback) {
            return dom.addDisposableListener(target, 'mousemove', (e) => callback(this._create(e)));
        }
    }
    exports.EditorMouseEventFactory = EditorMouseEventFactory;
    class EditorPointerEventFactory {
        constructor(editorViewDomNode) {
            this._editorViewDomNode = editorViewDomNode;
        }
        _create(e) {
            return new EditorMouseEvent(e, false, this._editorViewDomNode);
        }
        onPointerUp(target, callback) {
            return dom.addDisposableListener(target, 'pointerup', (e) => {
                callback(this._create(e));
            });
        }
        onPointerDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_DOWN, (e) => {
                callback(this._create(e), e.pointerId);
            });
        }
        onPointerLeave(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_LEAVE, (e) => {
                callback(this._create(e));
            });
        }
        onPointerMove(target, callback) {
            return dom.addDisposableListener(target, 'pointermove', (e) => callback(this._create(e)));
        }
    }
    exports.EditorPointerEventFactory = EditorPointerEventFactory;
    class GlobalEditorPointerMoveMonitor extends lifecycle_1.Disposable {
        constructor(editorViewDomNode) {
            super();
            this._editorViewDomNode = editorViewDomNode;
            this._globalPointerMoveMonitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            this._keydownListener = null;
        }
        startMonitoring(initialElement, pointerId, initialButtons, pointerMoveCallback, onStopCallback) {
            // Add a <<capture>> keydown event listener that will cancel the monitoring
            // if something other than a modifier key is pressed
            this._keydownListener = dom.addStandardDisposableListener(initialElement.ownerDocument, 'keydown', (e) => {
                const chord = e.toKeyCodeChord();
                if (chord.isModifierKey()) {
                    // Allow modifier keys
                    return;
                }
                this._globalPointerMoveMonitor.stopMonitoring(true, e.browserEvent);
            }, true);
            this._globalPointerMoveMonitor.startMonitoring(initialElement, pointerId, initialButtons, (e) => {
                pointerMoveCallback(new EditorMouseEvent(e, true, this._editorViewDomNode));
            }, (e) => {
                this._keydownListener.dispose();
                onStopCallback(e);
            });
        }
        stopMonitoring() {
            this._globalPointerMoveMonitor.stopMonitoring(true);
        }
    }
    exports.GlobalEditorPointerMoveMonitor = GlobalEditorPointerMoveMonitor;
    /**
     * A helper to create dynamic css rules, bound to a class name.
     * Rules are reused.
     * Reference counting and delayed garbage collection ensure that no rules leak.
    */
    class DynamicCssRules {
        static { this._idPool = 0; }
        constructor(_editor) {
            this._editor = _editor;
            this._instanceId = ++DynamicCssRules._idPool;
            this._counter = 0;
            this._rules = new Map();
            // We delay garbage collection so that hanging rules can be reused.
            this._garbageCollectionScheduler = new async_1.RunOnceScheduler(() => this.garbageCollect(), 1000);
        }
        createClassNameRef(options) {
            const rule = this.getOrCreateRule(options);
            rule.increaseRefCount();
            return {
                className: rule.className,
                dispose: () => {
                    rule.decreaseRefCount();
                    this._garbageCollectionScheduler.schedule();
                }
            };
        }
        getOrCreateRule(properties) {
            const key = this.computeUniqueKey(properties);
            let existingRule = this._rules.get(key);
            if (!existingRule) {
                const counter = this._counter++;
                existingRule = new RefCountedCssRule(key, `dyn-rule-${this._instanceId}-${counter}`, dom.isInShadowDOM(this._editor.getContainerDomNode())
                    ? this._editor.getContainerDomNode()
                    : undefined, properties);
                this._rules.set(key, existingRule);
            }
            return existingRule;
        }
        computeUniqueKey(properties) {
            return JSON.stringify(properties);
        }
        garbageCollect() {
            for (const rule of this._rules.values()) {
                if (!rule.hasReferences()) {
                    this._rules.delete(rule.key);
                    rule.dispose();
                }
            }
        }
    }
    exports.DynamicCssRules = DynamicCssRules;
    class RefCountedCssRule {
        constructor(key, className, _containerElement, properties) {
            this.key = key;
            this.className = className;
            this.properties = properties;
            this._referenceCount = 0;
            this._styleElementDisposables = new lifecycle_1.DisposableStore();
            this._styleElement = dom.createStyleSheet(_containerElement, undefined, this._styleElementDisposables);
            this._styleElement.textContent = this.getCssText(this.className, this.properties);
        }
        getCssText(className, properties) {
            let str = `.${className} {`;
            for (const prop in properties) {
                const value = properties[prop];
                let cssValue;
                if (typeof value === 'object') {
                    cssValue = (0, colorRegistry_1.asCssVariable)(value.id);
                }
                else {
                    cssValue = value;
                }
                const cssPropName = camelToDashes(prop);
                str += `\n\t${cssPropName}: ${cssValue};`;
            }
            str += `\n}`;
            return str;
        }
        dispose() {
            this._styleElementDisposables.dispose();
            this._styleElement = undefined;
        }
        increaseRefCount() {
            this._referenceCount++;
        }
        decreaseRefCount() {
            this._referenceCount--;
        }
        hasReferences() {
            return this._referenceCount > 0;
        }
    }
    function camelToDashes(str) {
        return str.replace(/(^[A-Z])/, ([first]) => first.toLowerCase())
            .replace(/([A-Z])/g, ([letter]) => `-${letter.toLowerCase()}`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRG9tLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvZWRpdG9yRG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRFaEcsNERBR0M7SUFFRCw4RUFpQkM7SUF2RkQ7O09BRUc7SUFDSCxNQUFhLGVBQWU7UUFHM0IsWUFDaUIsQ0FBUyxFQUNULENBQVM7WUFEVCxNQUFDLEdBQUQsQ0FBQyxDQUFRO1lBQ1QsTUFBQyxHQUFELENBQUMsQ0FBUTtZQUoxQiwwQkFBcUIsR0FBUyxTQUFTLENBQUM7UUFLcEMsQ0FBQztRQUVFLG1CQUFtQixDQUFDLFlBQW9CO1lBQzlDLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUYsQ0FBQztLQUNEO0lBWEQsMENBV0M7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFhLGlCQUFpQjtRQUc3QixZQUNpQixPQUFlLEVBQ2YsT0FBZTtZQURmLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFDZixZQUFPLEdBQVAsT0FBTyxDQUFRO1lBSmhDLDRCQUF1QixHQUFTLFNBQVMsQ0FBQztRQUt0QyxDQUFDO1FBRUUsaUJBQWlCLENBQUMsWUFBb0I7WUFDNUMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEcsQ0FBQztLQUNEO0lBWEQsOENBV0M7SUFFRDs7T0FFRztJQUNILE1BQWEsa0JBQWtCO1FBRzlCLFlBQ2lCLENBQVMsRUFDVCxDQUFTLEVBQ1QsS0FB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