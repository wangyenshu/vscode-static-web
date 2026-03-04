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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/performance", "vs/base/common/errors", "vs/editor/browser/controller/mouseTarget", "vs/editor/browser/controller/pointerHandler", "vs/editor/browser/controller/textAreaHandler", "vs/editor/browser/view/renderingContext", "vs/editor/browser/view/viewController", "vs/editor/browser/view/viewOverlays", "vs/editor/browser/view/viewPart", "vs/editor/browser/view/viewUserInputEvents", "vs/editor/browser/viewParts/blockDecorations/blockDecorations", "vs/editor/browser/viewParts/contentWidgets/contentWidgets", "vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight", "vs/editor/browser/viewParts/decorations/decorations", "vs/editor/browser/viewParts/editorScrollbar/editorScrollbar", "vs/editor/browser/viewParts/glyphMargin/glyphMargin", "vs/editor/browser/viewParts/indentGuides/indentGuides", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/lines/viewLines", "vs/editor/browser/viewParts/linesDecorations/linesDecorations", "vs/editor/browser/viewParts/margin/margin", "vs/editor/browser/viewParts/marginDecorations/marginDecorations", "vs/editor/browser/viewParts/minimap/minimap", "vs/editor/browser/viewParts/overlayWidgets/overlayWidgets", "vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler", "vs/editor/browser/viewParts/overviewRuler/overviewRuler", "vs/editor/browser/viewParts/rulers/rulers", "vs/editor/browser/viewParts/scrollDecoration/scrollDecoration", "vs/editor/browser/viewParts/selections/selections", "vs/editor/browser/viewParts/viewCursors/viewCursors", "vs/editor/browser/viewParts/viewZones/viewZones", "vs/editor/browser/viewParts/whitespace/whitespace", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model", "vs/editor/common/viewEventHandler", "vs/editor/common/viewLayout/viewLinesViewportData", "vs/editor/common/viewModel/viewContext", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService"], function (require, exports, dom, fastDomNode_1, performance_1, errors_1, mouseTarget_1, pointerHandler_1, textAreaHandler_1, renderingContext_1, viewController_1, viewOverlays_1, viewPart_1, viewUserInputEvents_1, blockDecorations_1, contentWidgets_1, currentLineHighlight_1, decorations_1, editorScrollbar_1, glyphMargin_1, indentGuides_1, lineNumbers_1, viewLines_1, linesDecorations_1, margin_1, marginDecorations_1, minimap_1, overlayWidgets_1, decorationsOverviewRuler_1, overviewRuler_1, rulers_1, scrollDecoration_1, selections_1, viewCursors_1, viewZones_1, whitespace_1, position_1, range_1, selection_1, model_1, viewEventHandler_1, viewLinesViewportData_1, viewContext_1, instantiation_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    let View = class View extends viewEventHandler_1.ViewEventHandler {
        constructor(commandDelegate, configuration, colorTheme, model, userInputEvents, overflowWidgetsDomNode, _instantiationService) {
            super();
            this._instantiationService = _instantiationService;
            // Actual mutable state
            this._shouldRecomputeGlyphMarginLanes = false;
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            this._renderAnimationFrame = null;
            const viewController = new viewController_1.ViewController(configuration, model, userInputEvents, commandDelegate);
            // The view context is passed on to most classes (basically to reduce param. counts in ctors)
            this._context = new viewContext_1.ViewContext(configuration, colorTheme, model);
            // Ensure the view is the first event handler in order to update the layout
            this._context.addEventHandler(this);
            this._viewParts = [];
            // Keyboard handler
            this._textAreaHandler = this._instantiationService.createInstance(textAreaHandler_1.TextAreaHandler, this._context, viewController, this._createTextAreaHandlerHelper());
            this._viewParts.push(this._textAreaHandler);
            // These two dom nodes must be constructed up front, since references are needed in the layout provider (scrolling & co.)
            this._linesContent = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._linesContent.setClassName('lines-content' + ' monaco-editor-background');
            this._linesContent.setPosition('absolute');
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName(this._getEditorClassName());
            // Set role 'code' for better screen reader support https://github.com/microsoft/vscode/issues/93438
            this.domNode.setAttribute('role', 'code');
            this._overflowGuardContainer = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._overflowGuardContainer, 3 /* PartFingerprint.OverflowGuard */);
            this._overflowGuardContainer.setClassName('overflow-guard');
            this._scrollbar = new editorScrollbar_1.EditorScrollbar(this._context, this._linesContent, this.domNode, this._overflowGuardContainer);
            this._viewParts.push(this._scrollbar);
            // View Lines
            this._viewLines = new viewLines_1.ViewLines(this._context, this._linesContent);
            // View Zones
            this._viewZones = new viewZones_1.ViewZones(this._context);
            this._viewParts.push(this._viewZones);
            // Decorations overview ruler
            const decorationsOverviewRuler = new decorationsOverviewRuler_1.DecorationsOverviewRuler(this._context);
            this._viewParts.push(decorationsOverviewRuler);
            const scrollDecoration = new scrollDecoration_1.ScrollDecorationViewPart(this._context);
            this._viewParts.push(scrollDecoration);
            const contentViewOverlays = new viewOverlays_1.ContentViewOverlays(this._context);
            this._viewParts.push(contentViewOverlays);
            contentViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineHighlightOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new selections_1.SelectionsOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new indentGuides_1.IndentGuidesOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new decorations_1.DecorationsOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new whitespace_1.WhitespaceOverlay(this._context));
            const marginViewOverlays = new viewOverlays_1.MarginViewOverlays(this._context);
            this._viewParts.push(marginViewOverlays);
            marginViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineMarginHighlightOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new marginDecorations_1.MarginViewLineDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new linesDecorations_1.LinesDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new lineNumbers_1.LineNumbersOverlay(this._context));
            // Glyph margin widgets
            this._glyphMarginWidgets = new glyphMargin_1.GlyphMarginWidgets(this._context);
            this._viewParts.push(this._glyphMarginWidgets);
            const margin = new margin_1.Margin(this._context);
            margin.getDomNode().appendChild(this._viewZones.marginDomNode);
            margin.getDomNode().appendChild(marginViewOverlays.getDomNode());
            margin.getDomNode().appendChild(this._glyphMarginWidgets.domNode);
            this._viewParts.push(margin);
            // Content widgets
            this._contentWidgets = new contentWidgets_1.ViewContentWidgets(this._context, this.domNode);
            this._viewParts.push(this._contentWidgets);
            this._viewCursors = new viewCursors_1.ViewCursors(this._context);
            this._viewParts.push(this._viewCursors);
            // Overlay widgets
            this._overlayWidgets = new overlayWidgets_1.ViewOverlayWidgets(this._context, this.domNode);
            this._viewParts.push(this._overlayWidgets);
            const rulers = new rulers_1.Rulers(this._context);
            this._viewParts.push(rulers);
            const blockOutline = new blockDecorations_1.BlockDecorations(this._context);
            this._viewParts.push(blockOutline);
            const minimap = new minimap_1.Minimap(this._context);
            this._viewParts.push(minimap);
            // -------------- Wire dom nodes up
            if (decorationsOverviewRuler) {
                const overviewRulerData = this._scrollbar.getOverviewRulerLayoutInfo();
                overviewRulerData.parent.insertBefore(decorationsOverviewRuler.getDomNode(), overviewRulerData.insertBefore);
            }
            this._linesContent.appendChild(contentViewOverlays.getDomNode());
            this._linesContent.appendChild(rulers.domNode);
            this._linesContent.appendChild(this._viewZones.domNode);
            this._linesContent.appendChild(this._viewLines.getDomNode());
            this._linesContent.appendChild(this._contentWidgets.domNode);
            this._linesContent.appendChild(this._viewCursors.getDomNode());
            this._overflowGuardContainer.appendChild(margin.getDomNode());
            this._overflowGuardContainer.appendChild(this._scrollbar.getDomNode());
            this._overflowGuardContainer.appendChild(scrollDecoration.getDomNode());
            this._overflowGuardContainer.appendChild(this._textAreaHandler.textArea);
            this._overflowGuardContainer.appendChild(this._textAreaHandler.textAreaCover);
            this._overflowGuardContainer.appendChild(this._overlayWidgets.getDomNode());
            this._overflowGuardContainer.appendChild(minimap.getDomNode());
            this._overflowGuardContainer.appendChild(blockOutline.domNode);
            this.domNode.appendChild(this._overflowGuardContainer);
            if (overflowWidgetsDomNode) {
                overflowWidgetsDomNode.appendChild(this._contentWidgets.overflowingContentWidgetsDomNode.domNode);
                overflowWidgetsDomNode.appendChild(this._overlayWidgets.overflowingOverlayWidgetsDomNode.domNode);
            }
            else {
                this.domNode.appendChild(this._contentWidgets.overflowingContentWidgetsDomNode);
                this.domNode.appendChild(this._overlayWidgets.overflowingOverlayWidgetsDomNode);
            }
            this._applyLayout();
            // Pointer handler
            this._pointerHandler = this._register(new pointerHandler_1.PointerHandler(this._context, viewController, this._createPointerHandlerHelper()));
        }
        _computeGlyphMarginLanes() {
            const model = this._context.viewModel.model;
            const laneModel = this._context.viewModel.glyphLanes;
            let glyphs = [];
            let maxLineNumber = 0;
            // Add all margin decorations
            glyphs = glyphs.concat(model.getAllMarginDecorations().map((decoration) => {
                const lane = decoration.options.glyphMargin?.position ?? model_1.GlyphMarginLane.Center;
                maxLineNumber = Math.max(maxLineNumber, decoration.range.endLineNumber);
                return { range: decoration.range, lane, persist: decoration.options.glyphMargin?.persistLane };
            }));
            // Add all glyph margin widgets
            glyphs = glyphs.concat(this._glyphMarginWidgets.getWidgets().map((widget) => {
                const range = model.validateRange(widget.preference.range);
                maxLineNumber = Math.max(maxLineNumber, range.endLineNumber);
                return { range, lane: widget.preference.lane };
            }));
            // Sorted by their start position
            glyphs.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
            laneModel.reset(maxLineNumber);
            for (const glyph of glyphs) {
                laneModel.push(glyph.lane, glyph.range, glyph.persist);
            }
            return laneModel;
        }
        _createPointerHandlerHelper() {
            return {
                viewDomNode: this.domNode.domNode,
                linesContentDomNode: this._linesContent.domNode,
                viewLinesDomNode: this._viewLines.getDomNode().domNode,
                focusTextArea: () => {
                    this.focus();
                },
                dispatchTextAreaEvent: (event) => {
                    this._textAreaHandler.textArea.domNode.dispatchEvent(event);
                },
                getLastRenderData: () => {
                    const lastViewCursorsRenderData = this._viewCursors.getLastRenderData() || [];
                    const lastTextareaPosition = this._textAreaHandler.getLastRenderData();
                    return new mouseTarget_1.PointerHandlerLastRenderData(lastViewCursorsRenderData, lastTextareaPosition);
                },
                renderNow: () => {
                    this.render(true, false);
                },
                shouldSuppressMouseDownOnViewZone: (viewZoneId) => {
                    return this._viewZones.shouldSuppressMouseDownOnViewZone(viewZoneId);
                },
                shouldSuppressMouseDownOnWidget: (widgetId) => {
                    return this._contentWidgets.shouldSuppressMouseDownOnWidget(widgetId);
                },
                getPositionFromDOMInfo: (spanNode, offset) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.getPositionFromDOMInfo(spanNode, offset);
                },
                visibleRangeForPosition: (lineNumber, column) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.visibleRangeForPosition(new position_1.Position(lineNumber, column));
                },
                getLineWidth: (lineNumber) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.getLineWidth(lineNumber);
                }
            };
        }
        _createTextAreaHandlerHelper() {
            return {
                visibleRangeForPosition: (position) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.visibleRangeForPosition(position);
                }
            };
        }
        _applyLayout() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.domNode.setWidth(layoutInfo.width);
            this.domNode.setHeight(layoutInfo.height);
            this._overflowGuardContainer.setWidth(layoutInfo.width);
            this._overflowGuardContainer.setHeight(layoutInfo.height);
            // https://stackoverflow.com/questions/38905916/content-in-google-chrome-larger-than-16777216-px-not-being-rendered
            this._linesContent.setWidth(16777216);
            this._linesContent.setHeight(16777216);
        }
        _getEditorClassName() {
            const focused = this._textAreaHandler.isFocused() ? ' focused' : '';
            return this._context.configuration.options.get(142 /* EditorOption.editorClassName */) + ' ' + (0, themeService_1.getThemeTypeSelector)(this._context.theme.type) + focused;
        }
        // --- begin event handlers
        handleEvents(events) {
            super.handleEvents(events);
            this._scheduleRender();
        }
        onConfigurationChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            this._applyLayout();
            return false;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            return false;
        }
        onDecorationsChanged(e) {
            if (e.affectsGlyphMargin) {
                this._shouldRecomputeGlyphMarginLanes = true;
            }
            return false;
        }
        onFocusChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            return false;
        }
        onThemeChanged(e) {
            this._context.theme.update(e.theme);
            this.domNode.setClassName(this._getEditorClassName());
            return false;
        }
        // --- end event handlers
        dispose() {
            if (this._renderAnimationFrame !== null) {
                this._renderAnimationFrame.dispose();
                this._renderAnimationFrame = null;
            }
            this._contentWidgets.overflowingContentWidgetsDomNode.domNode.remove();
            this._context.removeEventHandler(this);
            this._viewLines.dispose();
            // Destroy view parts
            for (const viewPart of this._viewParts) {
                viewPart.dispose();
            }
            super.dispose();
        }
        _scheduleRender() {
            if (this._store.isDisposed) {
                throw new errors_1.BugIndicatingError();
            }
            if (this._renderAnimationFrame === null) {
                const rendering = this._createCoordinatedRendering();
                this._renderAnimationFrame = EditorRenderingCoordinator.INSTANCE.scheduleCoordinatedRendering({
                    window: dom.getWindow(this.domNode.domNode),
                    prepareRenderText: () => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        try {
                            return rendering.prepareRenderText();
                        }
                        finally {
                            this._renderAnimationFrame = null;
                        }
                    },
                    renderText: () => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        return rendering.renderText();
                    },
                    prepareRender: (viewParts, ctx) => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        return rendering.prepareRender(viewParts, ctx);
                    },
                    render: (viewParts, ctx) => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        return rendering.render(viewParts, ctx);
                    }
                });
            }
        }
        _flushAccumulatedAndRenderNow() {
            const rendering = this._createCoordinatedRendering();
            safeInvokeNoArg(() => rendering.prepareRenderText());
            const data = safeInvokeNoArg(() => rendering.renderText());
            if (data) {
                const [viewParts, ctx] = data;
                safeInvokeNoArg(() => rendering.prepareRender(viewParts, ctx));
                safeInvokeNoArg(() => rendering.render(viewParts, ctx));
            }
        }
        _getViewPartsToRender() {
            const result = [];
            let resultLen = 0;
            for (const viewPart of this._viewParts) {
                if (viewPart.shouldRender()) {
                    result[resultLen++] = viewPart;
                }
            }
            return result;
        }
        _createCoordinatedRendering() {
            return {
                prepareRenderText: () => {
                    if (this._shouldRecomputeGlyphMarginLanes) {
                        this._shouldRecomputeGlyphMarginLanes = false;
                        const model = this._computeGlyphMarginLanes();
                        this._context.configuration.setGlyphMarginDecorationLaneCount(model.requiredLanes);
                    }
                    performance_1.inputLatency.onRenderStart();
                },
                renderText: () => {
                    if (!this.domNode.domNode.isConnected) {
                        return null;
                    }
                    let viewPartsToRender = this._getViewPartsToRender();
                    if (!this._viewLines.shouldRender() && viewPartsToRender.length === 0) {
                        // Nothing to render
                        return null;
                    }
                    const partialViewportData = this._context.viewLayout.getLinesViewportData();
                    this._context.viewModel.setViewport(partialViewportData.startLineNumber, partialViewportData.endLineNumber, partialViewportData.centeredLineNumber);
                    const viewportData = new viewLinesViewportData_1.ViewportData(this._selections, partialViewportData, this._context.viewLayout.getWhitespaceViewportData(), this._context.viewModel);
                    if (this._contentWidgets.shouldRender()) {
                        // Give the content widgets a chance to set their max width before a possible synchronous layout
                        this._contentWidgets.onBeforeRender(viewportData);
                    }
                    if (this._viewLines.shouldRender()) {
                        this._viewLines.renderText(viewportData);
                        this._viewLines.onDidRender();
                        // Rendering of viewLines might cause scroll events to occur, so collect view parts to render again
                        viewPartsToRender = this._getViewPartsToRender();
                    }
                    return [viewPartsToRender, new renderingContext_1.RenderingContext(this._context.viewLayout, viewportData, this._viewLines)];
                },
                prepareRender: (viewPartsToRender, ctx) => {
                    for (const viewPart of viewPartsToRender) {
                        viewPart.prepareRender(ctx);
                    }
                },
                render: (viewPartsToRender, ctx) => {
                    for (const viewPart of viewPartsToRender) {
                        viewPart.render(ctx);
                        viewPart.onDidRender();
                    }
                }
            };
        }
        // --- BEGIN CodeEditor helpers
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this._scrollbar.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            this._scrollbar.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        restoreState(scrollPosition) {
            this._context.viewModel.viewLayout.setScrollPosition({
                scrollTop: scrollPosition.scrollTop,
                scrollLeft: scrollPosition.scrollLeft
            }, 1 /* ScrollType.Immediate */);
            this._context.viewModel.visibleLinesStabilized();
        }
        getOffsetForColumn(modelLineNumber, modelColumn) {
            const modelPosition = this._context.viewModel.model.validatePosition({
                lineNumber: modelLineNumber,
                column: modelColumn
            });
            const viewPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            this._flushAccumulatedAndRenderNow();
            const visibleRange = this._viewLines.visibleRangeForPosition(new position_1.Position(viewPosition.lineNumber, viewPosition.column));
            if (!visibleRange) {
                return -1;
            }
            return visibleRange.left;
        }
        getTargetAtClientPoint(clientX, clientY) {
            const mouseTarget = this._pointerHandler.getTargetAtClientPoint(clientX, clientY);
            if (!mouseTarget) {
                return null;
            }
            return viewUserInputEvents_1.ViewUserInputEvents.convertViewToModelMouseTarget(mouseTarget, this._context.viewModel.coordinatesConverter);
        }
        createOverviewRuler(cssClassName) {
            return new overviewRuler_1.OverviewRuler(this._context, cssClassName);
        }
        change(callback) {
            this._viewZones.changeViewZones(callback);
            this._scheduleRender();
        }
        render(now, everything) {
            if (everything) {
                // Force everything to render...
                this._viewLines.forceShouldRender();
                for (const viewPart of this._viewParts) {
                    viewPart.forceShouldRender();
                }
            }
            if (now) {
                this._flushAccumulatedAndRenderNow();
            }
            else {
                this._scheduleRender();
            }
        }
        writeScreenReaderContent(reason) {
            this._textAreaHandler.writeScreenReaderContent(reason);
        }
        focus() {
            this._textAreaHandler.focusTextArea();
        }
        isFocused() {
            return this._textAreaHandler.isFocused();
        }
        refreshFocusState() {
            this._textAreaHandler.refreshFocusState();
        }
        setAriaOptions(options) {
            this._textAreaHandler.setAriaOptions(options);
        }
        addContentWidget(widgetData) {
            this._contentWidgets.addWidget(widgetData.widget);
            this.layoutContentWidget(widgetData);
            this._scheduleRender();
        }
        layoutContentWidget(widgetData) {
            this._contentWidgets.setWidgetPosition(widgetData.widget, widgetData.position?.position ?? null, widgetData.position?.secondaryPosition ?? null, widgetData.position?.preference ?? null, widgetData.position?.positionAffinity ?? null);
            this._scheduleRender();
        }
        removeContentWidget(widgetData) {
            this._contentWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
        addOverlayWidget(widgetData) {
            this._overlayWidgets.addWidget(widgetData.widget);
            this.layoutOverlayWidget(widgetData);
            this._scheduleRender();
        }
        layoutOverlayWidget(widgetData) {
            const newPreference = widgetData.position ? widgetData.position.preference : null;
            const shouldRender = this._overlayWidgets.setWidgetPosition(widgetData.widget, newPreference);
            if (shouldRender) {
                this._scheduleRender();
            }
        }
        removeOverlayWidget(widgetData) {
            this._overlayWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
        addGlyphMarginWidget(widgetData) {
            this._glyphMarginWidgets.addWidget(widgetData.widget);
            this._shouldRecomputeGlyphMarginLanes = true;
            this._scheduleRender();
        }
        layoutGlyphMarginWidget(widgetData) {
            const newPreference = widgetData.position;
            const shouldRender = this._glyphMarginWidgets.setWidgetPosition(widgetData.widget, newPreference);
            if (shouldRender) {
                this._shouldRecomputeGlyphMarginLanes = true;
                this._scheduleRender();
            }
        }
        removeGlyphMarginWidget(widgetData) {
            this._glyphMarginWidgets.removeWidget(widgetData.widget);
            this._shouldRecomputeGlyphMarginLanes = true;
            this._scheduleRender();
        }
    };
    exports.View = View;
    exports.View = View = __decorate([
        __param(6, instantiation_1.IInstantiationService)
    ], View);
    function safeInvokeNoArg(func) {
        try {
            return func();
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return null;
        }
    }
    class EditorRenderingCoordinator {
        static { this.INSTANCE = new EditorRenderingCoordinator(); }
        constructor() {
            this._coordinatedRenderings = [];
            this._animationFrameRunners = new Map();
        }
        scheduleCoordinatedRendering(rendering) {
            this._coordinatedRenderings.push(rendering);
            this._scheduleRender(rendering.window);
            return {
                dispose: () => {
                    const renderingIndex = this._coordinatedRenderings.indexOf(rendering);
                    if (renderingIndex === -1) {
                        return;
                    }
                    this._coordinatedRenderings.splice(renderingIndex, 1);
                    if (this._coordinatedRenderings.length === 0) {
                        // There are no more renderings to coordinate => cancel animation frames
                        for (const [_, disposable] of this._animationFrameRunners) {
                            disposable.dispose();
                        }
                        this._animationFrameRunners.clear();
                    }
                }
            };
        }
        _scheduleRender(window) {
            if (!this._animationFrameRunners.has(window)) {
                const runner = () => {
                    this._animationFrameRunners.delete(window);
                    this._onRenderScheduled();
                };
                this._animationFrameRunners.set(window, dom.runAtThisOrScheduleAtNextAnimationFrame(window, runner, 100));
            }
        }
        _onRenderScheduled() {
            const coordinatedRenderings = this._coordinatedRenderings.slice(0);
            this._coordinatedRenderings = [];
            for (const rendering of coordinatedRenderings) {
                safeInvokeNoArg(() => rendering.prepareRenderText());
            }
            const datas = [];
            for (let i = 0, len = coordinatedRenderings.length; i < len; i++) {
                const rendering = coordinatedRenderings[i];
                datas[i] = safeInvokeNoArg(() => rendering.renderText());
            }
            for (let i = 0, len = coordinatedRenderings.length; i < len; i++) {
                const rendering = coordinatedRenderings[i];
                const data = datas[i];
                if (!data) {
                    continue;
                }
                const [viewParts, ctx] = data;
                safeInvokeNoArg(() => rendering.prepareRender(viewParts, ctx));
            }
            for (let i = 0, len = coordinatedRenderings.length; i < len; i++) {
                const rendering = coordinatedRenderings[i];
                const data = datas[i];
                if (!data) {
                    continue;
                }
                const [viewParts, ctx] = data;
                safeInvokeNoArg(() => rendering.render(viewParts, ctx));
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0V6RixJQUFNLElBQUksR0FBVixNQUFNLElBQUssU0FBUSxtQ0FBZ0I7UUE2QnpDLFlBQ0MsZUFBaUMsRUFDakMsYUFBbUMsRUFDbkMsVUFBdUIsRUFDdkIsS0FBaUIsRUFDakIsZUFBb0MsRUFDcEMsc0JBQStDLEVBQ3hCLHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUZnQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBWHJGLHVCQUF1QjtZQUNmLHFDQUFnQyxHQUFZLEtBQUssQ0FBQztZQWF6RCxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUVsQyxNQUFNLGNBQWMsR0FBRyxJQUFJLCtCQUFjLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFbEcsNkZBQTZGO1lBQzdGLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSx5QkFBVyxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEUsMkVBQTJFO1lBQzNFLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBDLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1lBRXJCLG1CQUFtQjtZQUNuQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7WUFDdkosSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFNUMseUhBQXlIO1lBQ3pILElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsZUFBZSxHQUFHLDJCQUEyQixDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLCtCQUFpQixFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELG9HQUFvRztZQUNwRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFMUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLDJCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsdUJBQXVCLHdDQUFnQyxDQUFDO1lBQ3BGLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUU1RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksaUNBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNySCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFdEMsYUFBYTtZQUNiLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxxQkFBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRW5FLGFBQWE7WUFDYixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUkscUJBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXRDLDZCQUE2QjtZQUM3QixNQUFNLHdCQUF3QixHQUFHLElBQUksbURBQXdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFHL0MsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDJDQUF3QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXZDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUMxQyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGtEQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDLElBQUksOEJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUUsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsSUFBSSxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM5RSxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGdDQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdFLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDLElBQUksOEJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFNUUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLGlDQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3pDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLElBQUksd0RBQWlDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0Ysa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxvREFBZ0MsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMxRixrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLDBDQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLElBQUksZ0NBQWtCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFNUUsdUJBQXVCO1lBQ3ZCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLGdDQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUUvQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU3QixrQkFBa0I7WUFDbEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLG1DQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUkseUJBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRXhDLGtCQUFrQjtZQUNsQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksbUNBQWtCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU3QixNQUFNLFlBQVksR0FBRyxJQUFJLG1DQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVuQyxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlCLG1DQUFtQztZQUVuQyxJQUFJLHdCQUF3QixFQUFFLENBQUM7Z0JBQzlCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUN2RSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxFQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlHLENBQUM7WUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hELElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBRXZELElBQUksc0JBQXNCLEVBQUUsQ0FBQztnQkFDNUIsc0JBQXNCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xHLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25HLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7Z0JBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztZQUNqRixDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRXBCLGtCQUFrQjtZQUNsQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwrQkFBYyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5SCxDQUFDO1FBRU8sd0JBQXdCO1lBQy9CLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUM1QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFFckQsSUFBSSxNQUFNLEdBQVksRUFBRSxDQUFDO1lBQ3pCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztZQUV0Qiw2QkFBNkI7WUFDN0IsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7Z0JBQ3pFLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLFFBQVEsSUFBSSx1QkFBZSxDQUFDLE1BQU0sQ0FBQztnQkFDaEYsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3hFLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQ2hHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwrQkFBK0I7WUFDL0IsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUMzRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNELGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzdELE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGlDQUFpQztZQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsYUFBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFeEUsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMvQixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTywyQkFBMkI7WUFDbEMsT0FBTztnQkFDTixXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUNqQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU87Z0JBQy9DLGdCQUFnQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBTztnQkFFdEQsYUFBYSxFQUFFLEdBQUcsRUFBRTtvQkFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNkLENBQUM7Z0JBRUQscUJBQXFCLEVBQUUsQ0FBQyxLQUFrQixFQUFFLEVBQUU7b0JBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztnQkFFRCxpQkFBaUIsRUFBRSxHQUFpQyxFQUFFO29CQUNyRCxNQUFNLHlCQUF5QixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUM7b0JBQzlFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQ3ZFLE9BQU8sSUFBSSwwQ0FBNEIsQ0FBQyx5QkFBeUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dCQUMxRixDQUFDO2dCQUNELFNBQVMsRUFBRSxHQUFTLEVBQUU7b0JBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUNELGlDQUFpQyxFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFO29CQUN6RCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsaUNBQWlDLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3RFLENBQUM7Z0JBQ0QsK0JBQStCLEVBQUUsQ0FBQyxRQUFnQixFQUFFLEVBQUU7b0JBQ3JELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztnQkFDRCxzQkFBc0IsRUFBRSxDQUFDLFFBQXFCLEVBQUUsTUFBYyxFQUFFLEVBQUU7b0JBQ2pFLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO29CQUNyQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO2dCQUVELHVCQUF1QixFQUFFLENBQUMsVUFBa0IsRUFBRSxNQUFjLEVBQUUsRUFBRTtvQkFDL0QsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7b0JBQ3JDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2xGLENBQUM7Z0JBRUQsWUFBWSxFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFO29CQUNwQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztvQkFDckMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDakQsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBRU8sNEJBQTRCO1lBQ25DLE9BQU87Z0JBQ04sdUJBQXVCLEVBQUUsQ0FBQyxRQUFrQixFQUFFLEVBQUU7b0JBQy9DLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO29CQUNyQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzFELENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVPLFlBQVk7WUFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBRXhELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFMUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFMUQsbUhBQW1IO1lBQ25ILElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFTyxtQkFBbUI7WUFDMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNwRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLHdDQUE4QixHQUFHLEdBQUcsR0FBRyxJQUFBLG1DQUFvQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUMvSSxDQUFDO1FBRUQsMkJBQTJCO1FBQ1gsWUFBWSxDQUFDLE1BQThCO1lBQzFELEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFDZSxzQkFBc0IsQ0FBQyxDQUEyQztZQUNqRixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDZSxvQkFBb0IsQ0FBQyxDQUF5QztZQUM3RSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDaEMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ2Usb0JBQW9CLENBQUMsQ0FBeUM7WUFDN0UsSUFBSSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLElBQUksQ0FBQztZQUM5QyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ2UsY0FBYyxDQUFDLENBQW1DO1lBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDdEQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ2UsY0FBYyxDQUFDLENBQW1DO1lBQ2pFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztZQUN0RCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCx5QkFBeUI7UUFFVCxPQUFPO1lBQ3RCLElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFDbkMsQ0FBQztZQUVELElBQUksQ0FBQyxlQUFlLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRXZFLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFdkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUUxQixxQkFBcUI7WUFDckIsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixDQUFDO1lBRUQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFTyxlQUFlO1lBQ3RCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxJQUFJLDJCQUFrQixFQUFFLENBQUM7WUFDaEMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN6QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQztvQkFDN0YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7b0JBQzNDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTt3QkFDdkIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDOzRCQUM1QixNQUFNLElBQUksMkJBQWtCLEVBQUUsQ0FBQzt3QkFDaEMsQ0FBQzt3QkFDRCxJQUFJLENBQUM7NEJBQ0osT0FBTyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDdEMsQ0FBQztnQ0FBUyxDQUFDOzRCQUNWLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7d0JBQ25DLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxVQUFVLEVBQUUsR0FBRyxFQUFFO3dCQUNoQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7NEJBQzVCLE1BQU0sSUFBSSwyQkFBa0IsRUFBRSxDQUFDO3dCQUNoQyxDQUFDO3dCQUNELE9BQU8sU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUMvQixDQUFDO29CQUNELGFBQWEsRUFBRSxDQUFDLFNBQXFCLEVBQUUsR0FBcUIsRUFBRSxFQUFFO3dCQUMvRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7NEJBQzVCLE1BQU0sSUFBSSwyQkFBa0IsRUFBRSxDQUFDO3dCQUNoQyxDQUFDO3dCQUNELE9BQU8sU0FBUyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ2hELENBQUM7b0JBQ0QsTUFBTSxFQUFFLENBQUMsU0FBcUIsRUFBRSxHQUErQixFQUFFLEVBQUU7d0JBQ2xFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQzs0QkFDNUIsTUFBTSxJQUFJLDJCQUFrQixFQUFFLENBQUM7d0JBQ2hDLENBQUM7d0JBQ0QsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDekMsQ0FBQztpQkFDRCxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUVPLDZCQUE2QjtZQUNwQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUNyRCxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztZQUNyRCxNQUFNLElBQUksR0FBRyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDM0QsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDOUIsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQy9ELGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCO1lBQzVCLE1BQU0sTUFBTSxHQUFlLEVBQUUsQ0FBQztZQUM5QixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbEIsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7b0JBQzdCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTywyQkFBMkI7WUFDbEMsT0FBTztnQkFDTixpQkFBaUIsRUFBRSxHQUFHLEVBQUU7b0JBQ3ZCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7d0JBQzNDLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxLQUFLLENBQUM7d0JBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO3dCQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ3BGLENBQUM7b0JBQ0QsMEJBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxVQUFVLEVBQUUsR0FBMEMsRUFBRTtvQkFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUN2QyxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkUsb0JBQW9CO3dCQUNwQixPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDNUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztvQkFFcEosTUFBTSxZQUFZLEdBQUcsSUFBSSxvQ0FBWSxDQUNwQyxJQUFJLENBQUMsV0FBVyxFQUNoQixtQkFBbUIsRUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMseUJBQXlCLEVBQUUsRUFDcEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQ3ZCLENBQUM7b0JBRUYsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7d0JBQ3pDLGdHQUFnRzt3QkFDaEcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ25ELENBQUM7b0JBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7d0JBQ3BDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUU5QixtR0FBbUc7d0JBQ25HLGlCQUFpQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUNsRCxDQUFDO29CQUVELE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLG1DQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDM0csQ0FBQztnQkFDRCxhQUFhLEVBQUUsQ0FBQyxpQkFBNkIsRUFBRSxHQUFxQixFQUFFLEVBQUU7b0JBQ3ZFLEtBQUssTUFBTSxRQUFRLElBQUksaUJBQWlCLEVBQUUsQ0FBQzt3QkFDMUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDN0IsQ0FBQztnQkFDRixDQUFDO2dCQUNELE1BQU0sRUFBRSxDQUFDLGlCQUE2QixFQUFFLEdBQStCLEVBQUUsRUFBRTtvQkFDMUUsS0FBSyxNQUFNLFFBQVEsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO3dCQUMxQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNyQixRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3hCLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBRUQsK0JBQStCO1FBRXhCLG9DQUFvQyxDQUFDLFlBQTBCO1lBQ3JFLElBQUksQ0FBQyxVQUFVLENBQUMsb0NBQW9DLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVNLGlDQUFpQyxDQUFDLFlBQThCO1lBQ3RFLElBQUksQ0FBQyxVQUFVLENBQUMsaUNBQWlDLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVNLFlBQVksQ0FBQyxjQUF5RDtZQUM1RSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3BELFNBQVMsRUFBRSxjQUFjLENBQUMsU0FBUztnQkFDbkMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxVQUFVO2FBQ3JDLCtCQUF1QixDQUFDO1lBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDbEQsQ0FBQztRQUVNLGtCQUFrQixDQUFDLGVBQXVCLEVBQUUsV0FBbUI7WUFDckUsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDO2dCQUNwRSxVQUFVLEVBQUUsZUFBZTtnQkFDM0IsTUFBTSxFQUFFLFdBQVc7YUFDbkIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDcEgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFDckMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN6SCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQzFCLENBQUM7UUFFTSxzQkFBc0IsQ0FBQyxPQUFlLEVBQUUsT0FBZTtZQUM3RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8seUNBQW1CLENBQUMsNkJBQTZCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDckgsQ0FBQztRQUVNLG1CQUFtQixDQUFDLFlBQW9CO1lBQzlDLE9BQU8sSUFBSSw2QkFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVNLE1BQU0sQ0FBQyxRQUEwRDtZQUN2RSxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxHQUFZLEVBQUUsVUFBbUI7WUFDOUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsZ0NBQWdDO2dCQUNoQyxJQUFJLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3BDLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUN4QyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDeEIsQ0FBQztRQUNGLENBQUM7UUFFTSx3QkFBd0IsQ0FBQyxNQUFjO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRU0sS0FBSztZQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBRU0sU0FBUztZQUNmLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFFTSxpQkFBaUI7WUFDdkIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDM0MsQ0FBQztRQUVNLGNBQWMsQ0FBQyxPQUEyQjtZQUNoRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxVQUE4QjtZQUNyRCxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN4QixDQUFDO1FBRU0sbUJBQW1CLENBQUMsVUFBOEI7WUFDeEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FDckMsVUFBVSxDQUFDLE1BQU0sRUFDakIsVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLElBQUksSUFBSSxFQUNyQyxVQUFVLENBQUMsUUFBUSxFQUFFLGlCQUFpQixJQUFJLElBQUksRUFDOUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxVQUFVLElBQUksSUFBSSxFQUN2QyxVQUFVLENBQUMsUUFBUSxFQUFFLGdCQUFnQixJQUFJLElBQUksQ0FDN0MsQ0FBQztZQUNGLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN4QixDQUFDO1FBRU0sbUJBQW1CLENBQUMsVUFBOEI7WUFDeEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN4QixDQUFDO1FBRU0sZ0JBQWdCLENBQUMsVUFBOEI7WUFDckQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVNLG1CQUFtQixDQUFDLFVBQThCO1lBQ3hELE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbEYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzlGLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QixDQUFDO1FBQ0YsQ0FBQztRQUVNLG1CQUFtQixDQUFDLFVBQThCO1lBQ3hELElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVNLG9CQUFvQixDQUFDLFVBQWtDO1lBQzdELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxJQUFJLENBQUM7WUFDN0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFTSx1QkFBdUIsQ0FBQyxVQUFrQztZQUNoRSxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQzFDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2xHLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxJQUFJLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QixDQUFDO1FBQ0YsQ0FBQztRQUVNLHVCQUF1QixDQUFDLFVBQWtDO1lBQ2hFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxJQUFJLENBQUM7WUFDN0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7S0FJRCxDQUFBO0lBcGxCWSxvQkFBSTttQkFBSixJQUFJO1FBb0NkLFdBQUEscUNBQXFCLENBQUE7T0FwQ1gsSUFBSSxDQW9sQmhCO0lBRUQsU0FBUyxlQUFlLENBQUksSUFBYTtRQUN4QyxJQUFJLENBQUM7WUFDSixPQUFPLElBQUksRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixJQUFBLDBCQUFpQixFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztJQUNGLENBQUM7SUFVRCxNQUFNLDBCQUEwQjtpQkFFakIsYUFBUSxHQUFHLElBQUksMEJBQTBCLEVBQUUsQUFBbkMsQ0FBb0M7UUFLMUQ7WUFIUSwyQkFBc0IsR0FBNEIsRUFBRSxDQUFDO1lBQ3JELDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1FBRTVDLENBQUM7UUFFekIsNEJBQTRCLENBQUMsU0FBZ0M7WUFDNUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdEUsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0IsT0FBTztvQkFDUixDQUFDO29CQUNELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUV0RCxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQzlDLHdFQUF3RTt3QkFDeEUsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDOzRCQUMzRCxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ3RCLENBQUM7d0JBQ0QsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNyQyxDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVPLGVBQWUsQ0FBQyxNQUFrQjtZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7b0JBQ25CLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzNDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUMzQixDQUFDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzRyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztZQUVqQyxLQUFLLE1BQU0sU0FBUyxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9DLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFFRCxNQUFNLEtBQUssR0FBOEMsRUFBRSxDQUFDO1lBQzVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRSxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xFLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQzlCLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbEUsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDOUIsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekQsQ0FBQztRQUNGLENBQUMifQ==