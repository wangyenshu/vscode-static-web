/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/controller/mouseTarget", "vs/editor/browser/editorDom", "vs/editor/common/config/editorZoom", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/viewEventHandler", "vs/base/browser/ui/scrollbar/scrollableElement"], function (require, exports, dom, mouseEvent_1, lifecycle_1, platform, mouseTarget_1, editorDom_1, editorZoom_1, position_1, selection_1, viewEventHandler_1, scrollableElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MouseHandler = void 0;
    class MouseHandler extends viewEventHandler_1.ViewEventHandler {
        constructor(context, viewController, viewHelper) {
            super();
            this._mouseLeaveMonitor = null;
            this._context = context;
            this.viewController = viewController;
            this.viewHelper = viewHelper;
            this.mouseTargetFactory = new mouseTarget_1.MouseTargetFactory(this._context, viewHelper);
            this._mouseDownOperation = this._register(new MouseDownOperation(this._context, this.viewController, this.viewHelper, this.mouseTargetFactory, (e, testEventTarget) => this._createMouseTarget(e, testEventTarget), (e) => this._getMouseColumn(e)));
            this.lastMouseLeaveTime = -1;
            this._height = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).height;
            const mouseEvents = new editorDom_1.EditorMouseEventFactory(this.viewHelper.viewDomNode);
            this._register(mouseEvents.onContextMenu(this.viewHelper.viewDomNode, (e) => this._onContextMenu(e, true)));
            this._register(mouseEvents.onMouseMove(this.viewHelper.viewDomNode, (e) => {
                this._onMouseMove(e);
                // See https://github.com/microsoft/vscode/issues/138789
                // When moving the mouse really quickly, the browser sometimes forgets to
                // send us a `mouseleave` or `mouseout` event. We therefore install here
                // a global `mousemove` listener to manually recover if the mouse goes outside
                // the editor. As soon as the mouse leaves outside of the editor, we
                // remove this listener
                if (!this._mouseLeaveMonitor) {
                    this._mouseLeaveMonitor = dom.addDisposableListener(this.viewHelper.viewDomNode.ownerDocument, 'mousemove', (e) => {
                        if (!this.viewHelper.viewDomNode.contains(e.target)) {
                            // went outside the editor!
                            this._onMouseLeave(new editorDom_1.EditorMouseEvent(e, false, this.viewHelper.viewDomNode));
                        }
                    });
                }
            }));
            this._register(mouseEvents.onMouseUp(this.viewHelper.viewDomNode, (e) => this._onMouseUp(e)));
            this._register(mouseEvents.onMouseLeave(this.viewHelper.viewDomNode, (e) => this._onMouseLeave(e)));
            // `pointerdown` events can't be used to determine if there's a double click, or triple click
            // because their `e.detail` is always 0.
            // We will therefore save the pointer id for the mouse and then reuse it in the `mousedown` event
            // for `element.setPointerCapture`.
            let capturePointerId = 0;
            this._register(mouseEvents.onPointerDown(this.viewHelper.viewDomNode, (e, pointerId) => {
                capturePointerId = pointerId;
            }));
            // The `pointerup` listener registered by `GlobalEditorPointerMoveMonitor` does not get invoked 100% of the times.
            // I speculate that this is because the `pointerup` listener is only registered during the `mousedown` event, and perhaps
            // the `pointerup` event is already queued for dispatching, which makes it that the new listener doesn't get fired.
            // See https://github.com/microsoft/vscode/issues/146486 for repro steps.
            // To compensate for that, we simply register here a `pointerup` listener and just communicate it.
            this._register(dom.addDisposableListener(this.viewHelper.viewDomNode, dom.EventType.POINTER_UP, (e) => {
                this._mouseDownOperation.onPointerUp();
            }));
            this._register(mouseEvents.onMouseDown(this.viewHelper.viewDomNode, (e) => this._onMouseDown(e, capturePointerId)));
            this._setupMouseWheelZoomListener();
            this._context.addEventHandler(this);
        }
        _setupMouseWheelZoomListener() {
            const classifier = scrollableElement_1.MouseWheelClassifier.INSTANCE;
            let prevMouseWheelTime = 0;
            let gestureStartZoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
            let gestureHasZoomModifiers = false;
            let gestureAccumulatedDelta = 0;
            const onMouseWheel = (browserEvent) => {
                this.viewController.emitMouseWheel(browserEvent);
                if (!this._context.configuration.options.get(76 /* EditorOption.mouseWheelZoom */)) {
                    return;
                }
                const e = new mouseEvent_1.StandardWheelEvent(browserEvent);
                classifier.acceptStandardWheelEvent(e);
                if (classifier.isPhysicalMouseWheel()) {
                    if (hasMouseWheelZoomModifiers(browserEvent)) {
                        const zoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
                        const delta = e.deltaY > 0 ? 1 : -1;
                        editorZoom_1.EditorZoom.setZoomLevel(zoomLevel + delta);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
                else {
                    // we consider mousewheel events that occur within 50ms of each other to be part of the same gesture
                    // we don't want to consider mouse wheel events where ctrl/cmd is pressed during the inertia phase
                    // we also want to accumulate deltaY values from the same gesture and use that to set the zoom level
                    if (Date.now() - prevMouseWheelTime > 50) {
                        // reset if more than 50ms have passed
                        gestureStartZoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
                        gestureHasZoomModifiers = hasMouseWheelZoomModifiers(browserEvent);
                        gestureAccumulatedDelta = 0;
                    }
                    prevMouseWheelTime = Date.now();
                    gestureAccumulatedDelta += e.deltaY;
                    if (gestureHasZoomModifiers) {
                        editorZoom_1.EditorZoom.setZoomLevel(gestureStartZoomLevel + gestureAccumulatedDelta / 5);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            };
            this._register(dom.addDisposableListener(this.viewHelper.viewDomNode, dom.EventType.MOUSE_WHEEL, onMouseWheel, { capture: true, passive: false }));
            function hasMouseWheelZoomModifiers(browserEvent) {
                return (platform.isMacintosh
                    // on macOS we support cmd + two fingers scroll (`metaKey` set)
                    // and also the two fingers pinch gesture (`ctrKey` set)
                    ? ((browserEvent.metaKey || browserEvent.ctrlKey) && !browserEvent.shiftKey && !browserEvent.altKey)
                    : (browserEvent.ctrlKey && !browserEvent.metaKey && !browserEvent.shiftKey && !browserEvent.altKey));
            }
        }
        dispose() {
            this._context.removeEventHandler(this);
            if (this._mouseLeaveMonitor) {
                this._mouseLeaveMonitor.dispose();
                this._mouseLeaveMonitor = null;
            }
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                // layout change
                const height = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).height;
                if (this._height !== height) {
                    this._height = height;
                    this._mouseDownOperation.onHeightChanged();
                }
            }
            return false;
        }
        onCursorStateChanged(e) {
            this._mouseDownOperation.onCursorStateChanged(e);
            return false;
        }
        onFocusChanged(e) {
            return false;
        }
        // --- end event handlers
        getTargetAtClientPoint(clientX, clientY) {
            const clientPos = new editorDom_1.ClientCoordinates(clientX, clientY);
            const pos = clientPos.toPageCoordinates(dom.getWindow(this.viewHelper.viewDomNode));
            const editorPos = (0, editorDom_1.createEditorPagePosition)(this.viewHelper.viewDomNode);
            if (pos.y < editorPos.y || pos.y > editorPos.y + editorPos.height || pos.x < editorPos.x || pos.x > editorPos.x + editorPos.width) {
                return null;
            }
            const relativePos = (0, editorDom_1.createCoordinatesRelativeToEditor)(this.viewHelper.viewDomNode, editorPos, pos);
            return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), editorPos, pos, relativePos, null);
        }
        _createMouseTarget(e, testEventTarget) {
            let target = e.target;
            if (!this.viewHelper.viewDomNode.contains(target)) {
                const shadowRoot = dom.getShadowRoot(this.viewHelper.viewDomNode);
                if (shadowRoot) {
                    target = shadowRoot.elementsFromPoint(e.posx, e.posy).find((el) => this.viewHelper.viewDomNode.contains(el));
                }
            }
            return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, e.relativePos, testEventTarget ? target : null);
        }
        _getMouseColumn(e) {
            return this.mouseTargetFactory.getMouseColumn(e.relativePos);
        }
        _onContextMenu(e, testEventTarget) {
            this.viewController.emitContextMenu({
                event: e,
                target: this._createMouseTarget(e, testEventTarget)
            });
        }
        _onMouseMove(e) {
            const targetIsWidget = this.mouseTargetFactory.mouseTargetIsWidget(e);
            if (!targetIsWidget) {
                e.preventDefault();
            }
            if (this._mouseDownOperation.isActive()) {
                // In selection/drag operation
                return;
            }
            const actualMouseMoveTime = e.timestamp;
            if (actualMouseMoveTime < this.lastMouseLeaveTime) {
                // Due to throttling, this event occurred before the mouse left the editor, therefore ignore it.
                return;
            }
            this.viewController.emitMouseMove({
                event: e,
                target: this._createMouseTarget(e, true)
            });
        }
        _onMouseLeave(e) {
            if (this._mouseLeaveMonitor) {
                this._mouseLeaveMonitor.dispose();
                this._mouseLeaveMonitor = null;
            }
            this.lastMouseLeaveTime = (new Date()).getTime();
            this.viewController.emitMouseLeave({
                event: e,
                target: null
            });
        }
        _onMouseUp(e) {
            this.viewController.emitMouseUp({
                event: e,
                target: this._createMouseTarget(e, true)
            });
        }
        _onMouseDown(e, pointerId) {
            const t = this._createMouseTarget(e, true);
            const targetIsContent = (t.type === 6 /* MouseTargetType.CONTENT_TEXT */ || t.type === 7 /* MouseTargetType.CONTENT_EMPTY */);
            const targetIsGutter = (t.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ || t.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ || t.type === 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */);
            const targetIsLineNumbers = (t.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */);
            const selectOnLineNumbers = this._context.configuration.options.get(109 /* EditorOption.selectOnLineNumbers */);
            const targetIsViewZone = (t.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || t.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */);
            const targetIsWidget = (t.type === 9 /* MouseTargetType.CONTENT_WIDGET */);
            let shouldHandle = e.leftButton || e.middleButton;
            if (platform.isMacintosh && e.leftButton && e.ctrlKey) {
                shouldHandle = false;
            }
            const focus = () => {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            };
            if (shouldHandle && (targetIsContent || (targetIsLineNumbers && selectOnLineNumbers))) {
                focus();
                this._mouseDownOperation.start(t.type, e, pointerId);
            }
            else if (targetIsGutter) {
                // Do not steal focus
                e.preventDefault();
            }
            else if (targetIsViewZone) {
                const viewZoneData = t.detail;
                if (shouldHandle && this.viewHelper.shouldSuppressMouseDownOnViewZone(viewZoneData.viewZoneId)) {
                    focus();
                    this._mouseDownOperation.start(t.type, e, pointerId);
                    e.preventDefault();
                }
            }
            else if (targetIsWidget && this.viewHelper.shouldSuppressMouseDownOnWidget(t.detail)) {
                focus();
                e.preventDefault();
            }
            this.viewController.emitMouseDown({
                event: e,
                target: t
            });
        }
        _onMouseWheel(e) {
            this.viewController.emitMouseWheel(e);
        }
    }
    exports.MouseHandler = MouseHandler;
    class MouseDownOperation extends lifecycle_1.Disposable {
        constructor(_context, _viewController, _viewHelper, _mouseTargetFactory, createMouseTarget, getMouseColumn) {
            super();
            this._context = _context;
            this._viewController = _viewController;
            this._viewHelper = _viewHelper;
            this._mouseTargetFactory = _mouseTargetFactory;
            this._createMouseTarget = createMouseTarget;
            this._getMouseColumn = getMouseColumn;
            this._mouseMoveMonitor = this._register(new editorDom_1.GlobalEditorPointerMoveMonitor(this._viewHelper.viewDomNode));
            this._topBottomDragScrolling = this._register(new TopBottomDragScrolling(this._context, this._viewHelper, this._mouseTargetFactory, (position, inSelectionMode, revealType) => this._dispatchMouse(position, inSelectionMode, revealType)));
            this._mouseState = new MouseDownState();
            this._currentSelection = new selection_1.Selection(1, 1, 1, 1);
            this._isActive = false;
            this._lastMouseEvent = null;
        }
        dispose() {
            super.dispose();
        }
        isActive() {
            return this._isActive;
        }
        _onMouseDownThenMove(e) {
            this._lastMouseEvent = e;
            this._mouseState.setModifiers(e);
            const position = this._findMousePosition(e, false);
            if (!position) {
                // Ignoring because position is unknown
                return;
            }
            if (this._mouseState.isDragAndDrop) {
                this._viewController.emitMouseDrag({
                    event: e,
                    target: position
                });
            }
            else {
                if (position.type === 13 /* MouseTargetType.OUTSIDE_EDITOR */ && (position.outsidePosition === 'above' || position.outsidePosition === 'below')) {
                    this._topBottomDragScrolling.start(position, e);
                }
                else {
                    this._topBottomDragScrolling.stop();
                    this._dispatchMouse(position, true, 1 /* NavigationCommandRevealType.Minimal */);
                }
            }
        }
        start(targetType, e, pointerId) {
            this._lastMouseEvent = e;
            this._mouseState.setStartedOnLineNumbers(targetType === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */);
            this._mouseState.setStartButtons(e);
            this._mouseState.setModifiers(e);
            const position = this._findMousePosition(e, true);
            if (!position || !position.position) {
                // Ignoring because position is unknown
                return;
            }
            this._mouseState.trySetCount(e.detail, position.position);
            // Overwrite the detail of the MouseEvent, as it will be sent out in an event and contributions might rely on it.
            e.detail = this._mouseState.count;
            const options = this._context.configuration.options;
            if (!options.get(91 /* EditorOption.readOnly */)
                && options.get(35 /* EditorOption.dragAndDrop */)
                && !options.get(22 /* EditorOption.columnSelection */)
                && !this._mouseState.altKey // we don't support multiple mouse
                && e.detail < 2 // only single click on a selection can work
                && !this._isActive // the mouse is not down yet
                && !this._currentSelection.isEmpty() // we don't drag single cursor
                && (position.type === 6 /* MouseTargetType.CONTENT_TEXT */) // single click on text
                && position.position && this._currentSelection.containsPosition(position.position) // single click on a selection
            ) {
                this._mouseState.isDragAndDrop = true;
                this._isActive = true;
                this._mouseMoveMonitor.startMonitoring(this._viewHelper.viewLinesDomNode, pointerId, e.buttons, (e) => this._onMouseDownThenMove(e), (browserEvent) => {
                    const position = this._findMousePosition(this._lastMouseEvent, false);
                    if (dom.isKeyboardEvent(browserEvent)) {
                        // cancel
                        this._viewController.emitMouseDropCanceled();
                    }
                    else {
                        this._viewController.emitMouseDrop({
                            event: this._lastMouseEvent,
                            target: (position ? this._createMouseTarget(this._lastMouseEvent, true) : null) // Ignoring because position is unknown, e.g., Content View Zone
                        });
                    }
                    this._stop();
                });
                return;
            }
            this._mouseState.isDragAndDrop = false;
            this._dispatchMouse(position, e.shiftKey, 1 /* NavigationCommandRevealType.Minimal */);
            if (!this._isActive) {
                this._isActive = true;
                this._mouseMoveMonitor.startMonitoring(this._viewHelper.viewLinesDomNode, pointerId, e.buttons, (e) => this._onMouseDownThenMove(e), () => this._stop());
            }
        }
        _stop() {
            this._isActive = false;
            this._topBottomDragScrolling.stop();
        }
        onHeightChanged() {
            this._mouseMoveMonitor.stopMonitoring();
        }
        onPointerUp() {
            this._mouseMoveMonitor.stopMonitoring();
        }
        onCursorStateChanged(e) {
            this._currentSelection = e.selections[0];
        }
        _getPositionOutsideEditor(e) {
            const editorContent = e.editorPos;
            const model = this._context.viewModel;
            const viewLayout = this._context.viewLayout;
            const mouseColumn = this._getMouseColumn(e);
            if (e.posy < editorContent.y) {
                const outsideDistance = editorContent.y - e.posy;
                const verticalOffset = Math.max(viewLayout.getCurrentScrollTop() - outsideDistance, 0);
                const viewZoneData = mouseTarget_1.HitTestContext.getZoneAtCoord(this._context, verticalOffset);
                if (viewZoneData) {
                    const newPosition = this._helpPositionJumpOverViewZone(viewZoneData);
                    if (newPosition) {
                        return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, newPosition, 'above', outsideDistance);
                    }
                }
                const aboveLineNumber = viewLayout.getLineNumberAtVerticalOffset(verticalOffset);
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(aboveLineNumber, 1), 'above', outsideDistance);
            }
            if (e.posy > editorContent.y + editorContent.height) {
                const outsideDistance = e.posy - editorContent.y - editorContent.height;
                const verticalOffset = viewLayout.getCurrentScrollTop() + e.relativePos.y;
                const viewZoneData = mouseTarget_1.HitTestContext.getZoneAtCoord(this._context, verticalOffset);
                if (viewZoneData) {
                    const newPosition = this._helpPositionJumpOverViewZone(viewZoneData);
                    if (newPosition) {
                        return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, newPosition, 'below', outsideDistance);
                    }
                }
                const belowLineNumber = viewLayout.getLineNumberAtVerticalOffset(verticalOffset);
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(belowLineNumber, model.getLineMaxColumn(belowLineNumber)), 'below', outsideDistance);
            }
            const possibleLineNumber = viewLayout.getLineNumberAtVerticalOffset(viewLayout.getCurrentScrollTop() + e.relativePos.y);
            if (e.posx < editorContent.x) {
                const outsideDistance = editorContent.x - e.posx;
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(possibleLineNumber, 1), 'left', outsideDistance);
            }
            if (e.posx > editorContent.x + editorContent.width) {
                const outsideDistance = e.posx - editorContent.x - editorContent.width;
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(possibleLineNumber, model.getLineMaxColumn(possibleLineNumber)), 'right', outsideDistance);
            }
            return null;
        }
        _findMousePosition(e, testEventTarget) {
            const positionOutsideEditor = this._getPositionOutsideEditor(e);
            if (positionOutsideEditor) {
                return positionOutsideEditor;
            }
            const t = this._createMouseTarget(e, testEventTarget);
            const hintedPosition = t.position;
            if (!hintedPosition) {
                return null;
            }
            if (t.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || t.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) {
                const newPosition = this._helpPositionJumpOverViewZone(t.detail);
                if (newPosition) {
                    return mouseTarget_1.MouseTarget.createViewZone(t.type, t.element, t.mouseColumn, newPosition, t.detail);
                }
            }
            return t;
        }
        _helpPositionJumpOverViewZone(viewZoneData) {
            // Force position on view zones to go above or below depending on where selection started from
            const selectionStart = new position_1.Position(this._currentSelection.selectionStartLineNumber, this._currentSelection.selectionStartColumn);
            const positionBefore = viewZoneData.positionBefore;
            const positionAfter = viewZoneData.positionAfter;
            if (positionBefore && positionAfter) {
                if (positionBefore.isBefore(selectionStart)) {
                    return positionBefore;
                }
                else {
                    return positionAfter;
                }
            }
            return null;
        }
        _dispatchMouse(position, inSelectionMode, revealType) {
            if (!position.position) {
                return;
            }
            this._viewController.dispatchMouse({
                position: position.position,
                mouseColumn: position.mouseColumn,
                startedOnLineNumbers: this._mouseState.startedOnLineNumbers,
                revealType,
                inSelectionMode: inSelectionMode,
                mouseDownCount: this._mouseState.count,
                altKey: this._mouseState.altKey,
                ctrlKey: this._mouseState.ctrlKey,
                metaKey: this._mouseState.metaKey,
                shiftKey: this._mouseState.shiftKey,
                leftButton: this._mouseState.leftButton,
                middleButton: this._mouseState.middleButton,
                onInjectedText: position.type === 6 /* MouseTargetType.CONTENT_TEXT */ && position.detail.injectedText !== null
            });
        }
    }
    class TopBottomDragScrolling extends lifecycle_1.Disposable {
        constructor(_context, _viewHelper, _mouseTargetFactory, _dispatchMouse) {
            super();
            this._context = _context;
            this._viewHelper = _viewHelper;
            this._mouseTargetFactory = _mouseTargetFactory;
            this._dispatchMouse = _dispatchMouse;
            this._operation = null;
        }
        dispose() {
            super.dispose();
            this.stop();
        }
        start(position, mouseEvent) {
            if (this._operation) {
                this._operation.setPosition(position, mouseEvent);
            }
            else {
                this._operation = new TopBottomDragScrollingOperation(this._context, this._viewHelper, this._mouseTargetFactory, this._dispatchMouse, position, mouseEvent);
            }
        }
        stop() {
            if (this._operation) {
                this._operation.dispose();
                this._operation = null;
            }
        }
    }
    class TopBottomDragScrollingOperation extends lifecycle_1.Disposable {
        constructor(_context, _viewHelper, _mouseTargetFactory, _dispatchMouse, position, mouseEvent) {
            super();
            this._context = _context;
            this._viewHelper = _viewHelper;
            this._mouseTargetFactory = _mouseTargetFactory;
            this._dispatchMouse = _dispatchMouse;
            this._position = position;
            this._mouseEvent = mouseEvent;
            this._lastTime = Date.now();
            this._animationFrameDisposable = dom.scheduleAtNextAnimationFrame(dom.getWindow(mouseEvent.browserEvent), () => this._execute());
        }
        dispose() {
            this._animationFrameDisposable.dispose();
            super.dispose();
        }
        setPosition(position, mouseEvent) {
            this._position = position;
            this._mouseEvent = mouseEvent;
        }
        /**
         * update internal state and return elapsed ms since last time
         */
        _tick() {
            const now = Date.now();
            const elapsed = now - this._lastTime;
            this._lastTime = now;
            return elapsed;
        }
        /**
         * get the number of lines per second to auto-scroll
         */
        _getScrollSpeed() {
            const lineHeight = this._context.configuration.options.get(67 /* EditorOption.lineHeight */);
            const viewportInLines = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).height / lineHeight;
            const outsideDistanceInLines = this._position.outsideDistance / lineHeight;
            if (outsideDistanceInLines <= 1.5) {
                return Math.max(30, viewportInLines * (1 + outsideDistanceInLines));
            }
            if (outsideDistanceInLines <= 3) {
                return Math.max(60, viewportInLines * (2 + outsideDistanceInLines));
            }
            return Math.max(200, viewportInLines * (7 + outsideDistanceInLines));
        }
        _execute() {
            const lineHeight = this._context.configuration.options.get(67 /* EditorOption.lineHeight */);
            const scrollSpeedInLines = this._getScrollSpeed();
            const elapsed = this._tick();
            const scrollInPixels = scrollSpeedInLines * (elapsed / 1000) * lineHeight;
            const scrollValue = (this._position.outsidePosition === 'above' ? -scrollInPixels : scrollInPixels);
            this._context.viewModel.viewLayout.deltaScrollNow(0, scrollValue);
            this._viewHelper.renderNow();
            const viewportData = this._context.viewLayout.getLinesViewportData();
            const edgeLineNumber = (this._position.outsidePosition === 'above' ? viewportData.startLineNumber : viewportData.endLineNumber);
            // First, try to find a position that matches the horizontal position of the mouse
            let mouseTarget;
            {
                const editorPos = (0, editorDom_1.createEditorPagePosition)(this._viewHelper.viewDomNode);
                const horizontalScrollbarHeight = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).horizontalScrollbarHeight;
                const pos = new editorDom_1.PageCoordinates(this._mouseEvent.pos.x, editorPos.y + editorPos.height - horizontalScrollbarHeight - 0.1);
                const relativePos = (0, editorDom_1.createCoordinatesRelativeToEditor)(this._viewHelper.viewDomNode, editorPos, pos);
                mouseTarget = this._mouseTargetFactory.createMouseTarget(this._viewHelper.getLastRenderData(), editorPos, pos, relativePos, null);
            }
            if (!mouseTarget.position || mouseTarget.position.lineNumber !== edgeLineNumber) {
                if (this._position.outsidePosition === 'above') {
                    mouseTarget = mouseTarget_1.MouseTarget.createOutsideEditor(this._position.mouseColumn, new position_1.Position(edgeLineNumber, 1), 'above', this._position.outsideDistance);
                }
                else {
                    mouseTarget = mouseTarget_1.MouseTarget.createOutsideEditor(this._position.mouseColumn, new position_1.Position(edgeLineNumber, this._context.viewModel.getLineMaxColumn(edgeLineNumber)), 'below', this._position.outsideDistance);
                }
            }
            this._dispatchMouse(mouseTarget, true, 2 /* NavigationCommandRevealType.None */);
            this._animationFrameDisposable = dom.scheduleAtNextAnimationFrame(dom.getWindow(mouseTarget.element), () => this._execute());
        }
    }
    class MouseDownState {
        static { this.CLEAR_MOUSE_DOWN_COUNT_TIME = 400; } // ms
        get altKey() { return this._altKey; }
        get ctrlKey() { return this._ctrlKey; }
        get metaKey() { return this._metaKey; }
        get shiftKey() { return this._shiftKey; }
        get leftButton() { return this._leftButton; }
        get middleButton() { return this._middleButton; }
        get startedOnLineNumbers() { return this._startedOnLineNumbers; }
        constructor() {
            this._altKey = false;
            this._ctrlKey = false;
            this._metaKey = false;
            this._shiftKey = false;
            this._leftButton = false;
            this._middleButton = false;
            this._startedOnLineNumbers = false;
            this._lastMouseDownPosition = null;
            this._lastMouseDownPositionEqualCount = 0;
            this._lastMouseDownCount = 0;
            this._lastSetMouseDownCountTime = 0;
            this.isDragAndDrop = false;
        }
        get count() {
            return this._lastMouseDownCount;
        }
        setModifiers(source) {
            this._altKey = source.altKey;
            this._ctrlKey = source.ctrlKey;
            this._metaKey = source.metaKey;
            this._shiftKey = source.shiftKey;
        }
        setStartButtons(source) {
            this._leftButton = source.leftButton;
            this._middleButton = source.middleButton;
        }
        setStartedOnLineNumbers(startedOnLineNumbers) {
            this._startedOnLineNumbers = startedOnLineNumbers;
        }
        trySetCount(setMouseDownCount, newMouseDownPosition) {
            // a. Invalidate multiple clicking if too much time has passed (will be hit by IE because the detail field of mouse events contains garbage in IE10)
            const currentTime = (new Date()).getTime();
            if (currentTime - this._lastSetMouseDownCountTime > MouseDownState.CLEAR_MOUSE_DOWN_COUNT_TIME) {
                setMouseDownCount = 1;
            }
            this._lastSetMouseDownCountTime = currentTime;
            // b. Ensure that we don't jump from single click to triple click in one go (will be hit by IE because the detail field of mouse events contains garbage in IE10)
            if (setMouseDownCount > this._lastMouseDownCount + 1) {
                setMouseDownCount = this._lastMouseDownCount + 1;
            }
            // c. Invalidate multiple clicking if the logical position is different
            if (this._lastMouseDownPosition && this._lastMouseDownPosition.equals(newMouseDownPosition)) {
                this._lastMouseDownPositionEqualCount++;
            }
            else {
                this._lastMouseDownPositionEqualCount = 1;
            }
            this._lastMouseDownPosition = newMouseDownPosition;
            // Finally set the lastMouseDownCount
            this._lastMouseDownCount = Math.min(setMouseDownCount, this._lastMouseDownPositionEqualCount);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW91c2VIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29udHJvbGxlci9tb3VzZUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbURoRyxNQUFhLFlBQWEsU0FBUSxtQ0FBZ0I7UUFXakQsWUFBWSxPQUFvQixFQUFFLGNBQThCLEVBQUUsVUFBaUM7WUFDbEcsS0FBSyxFQUFFLENBQUM7WUFIRCx1QkFBa0IsR0FBdUIsSUFBSSxDQUFDO1lBS3JELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLGdDQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFNUUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBa0IsQ0FDL0QsSUFBSSxDQUFDLFFBQVEsRUFDYixJQUFJLENBQUMsY0FBYyxFQUNuQixJQUFJLENBQUMsVUFBVSxFQUNmLElBQUksQ0FBQyxrQkFBa0IsRUFDdkIsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxFQUNuRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FDOUIsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsbUNBQXlCLENBQUMsTUFBTSxDQUFDO1lBRXZGLE1BQU0sV0FBVyxHQUFHLElBQUksbUNBQXVCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU3RSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU1RyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDekUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckIsd0RBQXdEO2dCQUN4RCx5RUFBeUU7Z0JBQ3pFLHdFQUF3RTtnQkFDeEUsOEVBQThFO2dCQUM5RSxvRUFBb0U7Z0JBQ3BFLHVCQUF1QjtnQkFFdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTt3QkFDakgsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBcUIsQ0FBQyxFQUFFLENBQUM7NEJBQ3BFLDJCQUEyQjs0QkFDM0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLDRCQUFnQixDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO3dCQUNqRixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU5RixJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXBHLDZGQUE2RjtZQUM3Rix3Q0FBd0M7WUFDeEMsaUdBQWlHO1lBQ2pHLG1DQUFtQztZQUNuQyxJQUFJLGdCQUFnQixHQUFXLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3RGLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osa0hBQWtIO1lBQ2xILHlIQUF5SDtZQUN6SCxtSEFBbUg7WUFDbkgseUVBQXlFO1lBQ3pFLGtHQUFrRztZQUNsRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQWUsRUFBRSxFQUFFO2dCQUNuSCxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEgsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFFcEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVPLDRCQUE0QjtZQUVuQyxNQUFNLFVBQVUsR0FBRyx3Q0FBb0IsQ0FBQyxRQUFRLENBQUM7WUFFakQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7WUFDM0IsSUFBSSxxQkFBcUIsR0FBRyx1QkFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RELElBQUksdUJBQXVCLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLElBQUksdUJBQXVCLEdBQUcsQ0FBQyxDQUFDO1lBRWhDLE1BQU0sWUFBWSxHQUFHLENBQUMsWUFBOEIsRUFBRSxFQUFFO2dCQUN2RCxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFakQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLHNDQUE2QixFQUFFLENBQUM7b0JBQzNFLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLENBQUMsR0FBRyxJQUFJLCtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMvQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZDLElBQUksVUFBVSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSwwQkFBMEIsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO3dCQUM5QyxNQUFNLFNBQVMsR0FBVyx1QkFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNwRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDcEMsdUJBQVUsQ0FBQyxZQUFZLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDO3dCQUMzQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDckIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1Asb0dBQW9HO29CQUNwRyxrR0FBa0c7b0JBQ2xHLG9HQUFvRztvQkFDcEcsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsa0JBQWtCLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQzFDLHNDQUFzQzt3QkFDdEMscUJBQXFCLEdBQUcsdUJBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDbEQsdUJBQXVCLEdBQUcsMEJBQTBCLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ25FLHVCQUF1QixHQUFHLENBQUMsQ0FBQztvQkFDN0IsQ0FBQztvQkFFRCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2hDLHVCQUF1QixJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7b0JBRXBDLElBQUksdUJBQXVCLEVBQUUsQ0FBQzt3QkFDN0IsdUJBQVUsQ0FBQyxZQUFZLENBQUMscUJBQXFCLEdBQUcsdUJBQXVCLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQzdFLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUNyQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbkosU0FBUywwQkFBMEIsQ0FBQyxZQUE4QjtnQkFDakUsT0FBTyxDQUNOLFFBQVEsQ0FBQyxXQUFXO29CQUNuQiwrREFBK0Q7b0JBQy9ELHdEQUF3RDtvQkFDeEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO29CQUNwRyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQ3BHLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDaEMsQ0FBQztZQUNELEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRUQsMkJBQTJCO1FBQ1gsc0JBQXNCLENBQUMsQ0FBMkM7WUFDakYsSUFBSSxDQUFDLENBQUMsVUFBVSxtQ0FBeUIsRUFBRSxDQUFDO2dCQUMzQyxnQkFBZ0I7Z0JBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDLE1BQU0sQ0FBQztnQkFDdkYsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztvQkFDdEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNlLG9CQUFvQixDQUFDLENBQXlDO1lBQzdFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDZSxjQUFjLENBQUMsQ0FBbUM7WUFDakUsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QseUJBQXlCO1FBRWxCLHNCQUFzQixDQUFDLE9BQWUsRUFBRSxPQUFlO1lBQzdELE1BQU0sU0FBUyxHQUFHLElBQUksNkJBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNwRixNQUFNLFNBQVMsR0FBRyxJQUFBLG9DQUF3QixFQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFeEUsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25JLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sV0FBVyxHQUFHLElBQUEsNkNBQWlDLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ25HLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxSCxDQUFDO1FBRVMsa0JBQWtCLENBQUMsQ0FBbUIsRUFBRSxlQUF3QjtZQUN6RSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixNQUFNLEdBQVMsVUFBVyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDaEUsQ0FBQyxFQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FDekQsQ0FBQztnQkFDSCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0osQ0FBQztRQUVPLGVBQWUsQ0FBQyxDQUFtQjtZQUMxQyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFUyxjQUFjLENBQUMsQ0FBbUIsRUFBRSxlQUF3QjtZQUNyRSxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztnQkFDbkMsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDO2FBQ25ELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxZQUFZLENBQUMsQ0FBbUI7WUFDekMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDckIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN6Qyw4QkFBOEI7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3hDLElBQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ25ELGdHQUFnRztnQkFDaEcsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQztnQkFDakMsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDO2FBQ3hDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxhQUFhLENBQUMsQ0FBbUI7WUFDMUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLENBQUM7WUFDRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUM7Z0JBQ2xDLEtBQUssRUFBRSxDQUFDO2dCQUNSLE1BQU0sRUFBRSxJQUFJO2FBQ1osQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVTLFVBQVUsQ0FBQyxDQUFtQjtZQUN2QyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQztnQkFDL0IsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDO2FBQ3hDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxZQUFZLENBQUMsQ0FBbUIsRUFBRSxTQUFpQjtZQUM1RCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTNDLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUkseUNBQWlDLElBQUksQ0FBQyxDQUFDLElBQUksMENBQWtDLENBQUMsQ0FBQztZQUM5RyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLGdEQUF3QyxJQUFJLENBQUMsQ0FBQyxJQUFJLGdEQUF3QyxJQUFJLENBQUMsQ0FBQyxJQUFJLG9EQUE0QyxDQUFDLENBQUM7WUFDaEwsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLGdEQUF3QyxDQUFDLENBQUM7WUFDN0UsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyw0Q0FBa0MsQ0FBQztZQUN0RyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksOENBQXNDLElBQUksQ0FBQyxDQUFDLElBQUksNkNBQXFDLENBQUMsQ0FBQztZQUN2SCxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLDJDQUFtQyxDQUFDLENBQUM7WUFFbkUsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQ2xELElBQUksUUFBUSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkQsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUN0QixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxFQUFFO2dCQUNsQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDakMsQ0FBQyxDQUFDO1lBRUYsSUFBSSxZQUFZLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDdkYsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV0RCxDQUFDO2lCQUFNLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQzNCLHFCQUFxQjtnQkFDckIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLENBQUM7aUJBQU0sSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM3QixNQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUM5QixJQUFJLFlBQVksSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLGlDQUFpQyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO29CQUNoRyxLQUFLLEVBQUUsQ0FBQztvQkFDUixJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNyRCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksY0FBYyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsK0JBQStCLENBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2hHLEtBQUssRUFBRSxDQUFDO2dCQUNSLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUM7Z0JBQ2pDLEtBQUssRUFBRSxDQUFDO2dCQUNSLE1BQU0sRUFBRSxDQUFDO2FBQ1QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVTLGFBQWEsQ0FBQyxDQUFtQjtZQUMxQyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQ0Q7SUExU0Qsb0NBMFNDO0lBRUQsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQWExQyxZQUNrQixRQUFxQixFQUNyQixlQUErQixFQUMvQixXQUFrQyxFQUNsQyxtQkFBdUMsRUFDeEQsaUJBQWtGLEVBQ2xGLGNBQStDO1lBRS9DLEtBQUssRUFBRSxDQUFDO1lBUFMsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7WUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQXVCO1lBQ2xDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBb0I7WUFLeEQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1lBQzVDLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1lBRXRDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMENBQThCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzFHLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksc0JBQXNCLENBQ3ZFLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLFdBQVcsRUFDaEIsSUFBSSxDQUFDLG1CQUFtQixFQUN4QixDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQ3JHLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUV4QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFFZSxPQUFPO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU0sUUFBUTtZQUNkLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN2QixDQUFDO1FBRU8sb0JBQW9CLENBQUMsQ0FBbUI7WUFDL0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsdUNBQXVDO2dCQUN2QyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUM7b0JBQ2xDLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxRQUFRO2lCQUNoQixDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxRQUFRLENBQUMsSUFBSSw0Q0FBbUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEtBQUssT0FBTyxJQUFJLFFBQVEsQ0FBQyxlQUFlLEtBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDeEksSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksOENBQXNDLENBQUM7Z0JBQzFFLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVNLEtBQUssQ0FBQyxVQUEyQixFQUFFLENBQW1CLEVBQUUsU0FBaUI7WUFDL0UsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFFekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLGdEQUF3QyxDQUFDLENBQUM7WUFDN0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyQyx1Q0FBdUM7Z0JBQ3ZDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFMUQsaUhBQWlIO1lBQ2pILENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBRXBELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxnQ0FBdUI7bUJBQ25DLE9BQU8sQ0FBQyxHQUFHLG1DQUEwQjttQkFDckMsQ0FBQyxPQUFPLENBQUMsR0FBRyx1Q0FBOEI7bUJBQzFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDO21CQUMzRCxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyw0Q0FBNEM7bUJBQ3pELENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0QkFBNEI7bUJBQzVDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDLDhCQUE4QjttQkFDaEUsQ0FBQyxRQUFRLENBQUMsSUFBSSx5Q0FBaUMsQ0FBQyxDQUFDLHVCQUF1QjttQkFDeEUsUUFBUSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLDhCQUE4QjtjQUNoSCxDQUFDO2dCQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBRXRCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQ2pDLFNBQVMsRUFDVCxDQUFDLENBQUMsT0FBTyxFQUNULENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQ25DLENBQUMsWUFBeUMsRUFBRSxFQUFFO29CQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGVBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRXZFLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO3dCQUN2QyxTQUFTO3dCQUNULElBQUksQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDOUMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDOzRCQUNsQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGVBQWdCOzRCQUM1QixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsZUFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsZ0VBQWdFO3lCQUNqSixDQUFDLENBQUM7b0JBQ0osQ0FBQztvQkFFRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUNELENBQUM7Z0JBRUYsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDdkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsOENBQXNDLENBQUM7WUFFL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQ2pDLFNBQVMsRUFDVCxDQUFDLENBQUMsT0FBTyxFQUNULENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQ25DLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FDbEIsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSztZQUNaLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRU0sZUFBZTtZQUNyQixJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVNLFdBQVc7WUFDakIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3pDLENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxDQUF5QztZQUNwRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU8seUJBQXlCLENBQUMsQ0FBbUI7WUFDcEQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNsQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUN0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUU1QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVDLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sZUFBZSxHQUFHLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDakQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZGLE1BQU0sWUFBWSxHQUFHLDRCQUFjLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBQ2xGLElBQUksWUFBWSxFQUFFLENBQUM7b0JBQ2xCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDckUsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsT0FBTyx5QkFBVyxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO29CQUM1RixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLDZCQUE2QixDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNqRixPQUFPLHlCQUFXLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksbUJBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ2pILENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO2dCQUN4RSxNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxZQUFZLEdBQUcsNEJBQWMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDbEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNyRSxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUNqQixPQUFPLHlCQUFXLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQzVGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsNkJBQTZCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2pGLE9BQU8seUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxtQkFBUSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDdkosQ0FBQztZQUVELE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEgsSUFBSSxDQUFDLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxlQUFlLEdBQUcsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNqRCxPQUFPLHlCQUFXLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksbUJBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDbkgsQ0FBQztZQUVELElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZFLE9BQU8seUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxtQkFBUSxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdKLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxDQUFtQixFQUFFLGVBQXdCO1lBQ3ZFLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxxQkFBcUIsQ0FBQztZQUM5QixDQUFDO1lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN0RCxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMsSUFBSSw4Q0FBc0MsSUFBSSxDQUFDLENBQUMsSUFBSSw2Q0FBcUMsRUFBRSxDQUFDO2dCQUNqRyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUNqQixPQUFPLHlCQUFXLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBRU8sNkJBQTZCLENBQUMsWUFBc0M7WUFDM0UsOEZBQThGO1lBQzlGLE1BQU0sY0FBYyxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDbEksTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQztZQUNuRCxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDO1lBRWpELElBQUksY0FBYyxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztvQkFDN0MsT0FBTyxjQUFjLENBQUM7Z0JBQ3ZCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxjQUFjLENBQUMsUUFBc0IsRUFBRSxlQUF3QixFQUFFLFVBQXVDO1lBQy9HLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUM7Z0JBQ2xDLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTtnQkFDM0IsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2dCQUNqQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLG9CQUFvQjtnQkFDM0QsVUFBVTtnQkFFVixlQUFlLEVBQUUsZUFBZTtnQkFDaEMsY0FBYyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSztnQkFDdEMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTTtnQkFDL0IsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTztnQkFDakMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTztnQkFDakMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUTtnQkFFbkMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVTtnQkFDdkMsWUFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWTtnQkFFM0MsY0FBYyxFQUFFLFFBQVEsQ0FBQyxJQUFJLHlDQUFpQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsWUFBWSxLQUFLLElBQUk7YUFDdkcsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRUQsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQUk5QyxZQUNrQixRQUFxQixFQUNyQixXQUFrQyxFQUNsQyxtQkFBdUMsRUFDdkMsY0FBbUg7WUFFcEksS0FBSyxFQUFFLENBQUM7WUFMUyxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGdCQUFXLEdBQVgsV0FBVyxDQUF1QjtZQUNsQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9CO1lBQ3ZDLG1CQUFjLEdBQWQsY0FBYyxDQUFxRztZQUdwSSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRWUsT0FBTztZQUN0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVNLEtBQUssQ0FBQyxRQUFtQyxFQUFFLFVBQTRCO1lBQzdFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbkQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSwrQkFBK0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdKLENBQUM7UUFDRixDQUFDO1FBRU0sSUFBSTtZQUNWLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN4QixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtRQU92RCxZQUNrQixRQUFxQixFQUNyQixXQUFrQyxFQUNsQyxtQkFBdUMsRUFDdkMsY0FBbUgsRUFDcEksUUFBbUMsRUFDbkMsVUFBNEI7WUFFNUIsS0FBSyxFQUFFLENBQUM7WUFQUyxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGdCQUFXLEdBQVgsV0FBVyxDQUF1QjtZQUNsQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9CO1lBQ3ZDLG1CQUFjLEdBQWQsY0FBYyxDQUFxRztZQUtwSSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMseUJBQXlCLEdBQUcsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2xJLENBQUM7UUFFZSxPQUFPO1lBQ3RCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN6QyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVNLFdBQVcsQ0FBQyxRQUFtQyxFQUFFLFVBQTRCO1lBQ25GLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQy9CLENBQUM7UUFFRDs7V0FFRztRQUNLLEtBQUs7WUFDWixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkIsTUFBTSxPQUFPLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7WUFDckIsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVEOztXQUVHO1FBQ0ssZUFBZTtZQUN0QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxrQ0FBeUIsQ0FBQztZQUNwRixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO1lBQzdHLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDO1lBRTNFLElBQUksc0JBQXNCLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsZUFBZSxHQUFHLENBQUMsQ0FBQyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBQ0QsSUFBSSxzQkFBc0IsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLGVBQWUsR0FBRyxDQUFDLENBQUMsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVPLFFBQVE7WUFDZixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxrQ0FBeUIsQ0FBQztZQUNwRixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNsRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxjQUFjLEdBQUcsa0JBQWtCLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDO1lBQzFFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFcEcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUU3QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ3JFLE1BQU0sY0FBYyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFaEksa0ZBQWtGO1lBQ2xGLElBQUksV0FBeUIsQ0FBQztZQUM5QixDQUFDO2dCQUNBLE1BQU0sU0FBUyxHQUFHLElBQUEsb0NBQXdCLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekUsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQyx5QkFBeUIsQ0FBQztnQkFDN0gsTUFBTSxHQUFHLEdBQUcsSUFBSSwyQkFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcseUJBQXlCLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQzFILE1BQU0sV0FBVyxHQUFHLElBQUEsNkNBQWlDLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNwRyxXQUFXLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQ2pGLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQ2hELFdBQVcsR0FBRyx5QkFBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksbUJBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3JKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLEdBQUcseUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLG1CQUFRLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzVNLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsSUFBSSwyQ0FBbUMsQ0FBQztZQUN6RSxJQUFJLENBQUMseUJBQXlCLEdBQUcsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlILENBQUM7S0FDRDtJQUVELE1BQU0sY0FBYztpQkFFSyxnQ0FBMkIsR0FBRyxHQUFHLENBQUMsR0FBQyxLQUFLO1FBR2hFLElBQVcsTUFBTSxLQUFjLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFHckQsSUFBVyxPQUFPLEtBQWMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUd2RCxJQUFXLE9BQU8sS0FBYyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBR3ZELElBQVcsUUFBUSxLQUFjLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFHekQsSUFBVyxVQUFVLEtBQWMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUc3RCxJQUFXLFlBQVksS0FBYyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBR2pFLElBQVcsb0JBQW9CLEtBQWMsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBUWpGO1lBQ0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDM0IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUNuQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQ25DLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsMEJBQTBCLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBRU0sWUFBWSxDQUFDLE1BQXdCO1lBQzNDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQy9CLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNsQyxDQUFDO1FBRU0sZUFBZSxDQUFDLE1BQXdCO1lBQzlDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNyQyxJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDMUMsQ0FBQztRQUVNLHVCQUF1QixDQUFDLG9CQUE2QjtZQUMzRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7UUFDbkQsQ0FBQztRQUVNLFdBQVcsQ0FBQyxpQkFBeUIsRUFBRSxvQkFBOEI7WUFDM0Usb0pBQW9KO1lBQ3BKLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQywwQkFBMEIsR0FBRyxjQUFjLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztnQkFDaEcsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxJQUFJLENBQUMsMEJBQTBCLEdBQUcsV0FBVyxDQUFDO1lBRTlDLGlLQUFpSztZQUNqSyxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdEQsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBRUQsdUVBQXVFO1lBQ3ZFLElBQUksSUFBSSxDQUFDLHNCQUFzQixJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO2dCQUM3RixJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztZQUN6QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLG9CQUFvQixDQUFDO1lBRW5ELHFDQUFxQztZQUNyQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUMvRixDQUFDIn0=