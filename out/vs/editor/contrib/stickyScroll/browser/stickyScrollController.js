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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "./stickyScrollWidget", "./stickyScrollProvider", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/common/core/range", "vs/editor/contrib/gotoSymbol/browser/goToSymbol", "vs/editor/contrib/inlayHints/browser/inlayHintsLocations", "vs/editor/common/core/position", "vs/base/common/cancellation", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/base/browser/dom", "vs/editor/contrib/stickyScroll/browser/stickyScrollElement", "vs/base/browser/mouseEvent", "vs/editor/contrib/folding/browser/folding", "vs/editor/contrib/folding/browser/foldingModel"], function (require, exports, lifecycle_1, languageFeatures_1, stickyScrollWidget_1, stickyScrollProvider_1, instantiation_1, contextView_1, actions_1, contextkey_1, editorContextKeys_1, clickLinkGesture_1, range_1, goToSymbol_1, inlayHintsLocations_1, position_1, cancellation_1, languageConfigurationRegistry_1, languageFeatureDebounce_1, dom, stickyScrollElement_1, mouseEvent_1, folding_1, foldingModel_1) {
    "use strict";
    var StickyScrollController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyScrollController = void 0;
    let StickyScrollController = class StickyScrollController extends lifecycle_1.Disposable {
        static { StickyScrollController_1 = this; }
        static { this.ID = 'store.contrib.stickyScrollController'; }
        constructor(_editor, _contextMenuService, _languageFeaturesService, _instaService, _languageConfigurationService, _languageFeatureDebounceService, _contextKeyService) {
            super();
            this._editor = _editor;
            this._contextMenuService = _contextMenuService;
            this._languageFeaturesService = _languageFeaturesService;
            this._instaService = _instaService;
            this._contextKeyService = _contextKeyService;
            this._sessionStore = new lifecycle_1.DisposableStore();
            this._foldingModel = null;
            this._maxStickyLines = Number.MAX_SAFE_INTEGER;
            this._candidateDefinitionsLength = -1;
            this._focusedStickyElementIndex = -1;
            this._enabled = false;
            this._focused = false;
            this._positionRevealed = false;
            this._onMouseDown = false;
            this._endLineNumbers = [];
            this._showEndForLine = null;
            this._stickyScrollWidget = new stickyScrollWidget_1.StickyScrollWidget(this._editor);
            this._stickyLineCandidateProvider = new stickyScrollProvider_1.StickyLineCandidateProvider(this._editor, _languageFeaturesService, _languageConfigurationService);
            this._register(this._stickyScrollWidget);
            this._register(this._stickyLineCandidateProvider);
            this._widgetState = new stickyScrollWidget_1.StickyScrollWidgetState([], [], 0);
            this._onDidResize();
            this._readConfiguration();
            const stickyScrollDomNode = this._stickyScrollWidget.getDomNode();
            this._register(this._editor.onDidChangeConfiguration(e => {
                this._readConfigurationChange(e);
            }));
            this._register(dom.addDisposableListener(stickyScrollDomNode, dom.EventType.CONTEXT_MENU, async (event) => {
                this._onContextMenu(dom.getWindow(stickyScrollDomNode), event);
            }));
            this._stickyScrollFocusedContextKey = editorContextKeys_1.EditorContextKeys.stickyScrollFocused.bindTo(this._contextKeyService);
            this._stickyScrollVisibleContextKey = editorContextKeys_1.EditorContextKeys.stickyScrollVisible.bindTo(this._contextKeyService);
            const focusTracker = this._register(dom.trackFocus(stickyScrollDomNode));
            this._register(focusTracker.onDidBlur(_ => {
                // Suppose that the blurring is caused by scrolling, then keep the focus on the sticky scroll
                // This is determined by the fact that the height of the widget has become zero and there has been no position revealing
                if (this._positionRevealed === false && stickyScrollDomNode.clientHeight === 0) {
                    this._focusedStickyElementIndex = -1;
                    this.focus();
                }
                // In all other casees, dispose the focus on the sticky scroll
                else {
                    this._disposeFocusStickyScrollStore();
                }
            }));
            this._register(focusTracker.onDidFocus(_ => {
                this.focus();
            }));
            this._registerMouseListeners();
            // Suppose that mouse down on the sticky scroll, then do not focus on the sticky scroll because this will be followed by the revealing of a position
            this._register(dom.addDisposableListener(stickyScrollDomNode, dom.EventType.MOUSE_DOWN, (e) => {
                this._onMouseDown = true;
            }));
        }
        get stickyScrollCandidateProvider() {
            return this._stickyLineCandidateProvider;
        }
        get stickyScrollWidgetState() {
            return this._widgetState;
        }
        static get(editor) {
            return editor.getContribution(StickyScrollController_1.ID);
        }
        _disposeFocusStickyScrollStore() {
            this._stickyScrollFocusedContextKey.set(false);
            this._focusDisposableStore?.dispose();
            this._focused = false;
            this._positionRevealed = false;
            this._onMouseDown = false;
        }
        focus() {
            // If the mouse is down, do not focus on the sticky scroll
            if (this._onMouseDown) {
                this._onMouseDown = false;
                this._editor.focus();
                return;
            }
            const focusState = this._stickyScrollFocusedContextKey.get();
            if (focusState === true) {
                return;
            }
            this._focused = true;
            this._focusDisposableStore = new lifecycle_1.DisposableStore();
            this._stickyScrollFocusedContextKey.set(true);
            this._focusedStickyElementIndex = this._stickyScrollWidget.lineNumbers.length - 1;
            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
        }
        focusNext() {
            if (this._focusedStickyElementIndex < this._stickyScrollWidget.lineNumberCount - 1) {
                this._focusNav(true);
            }
        }
        focusPrevious() {
            if (this._focusedStickyElementIndex > 0) {
                this._focusNav(false);
            }
        }
        selectEditor() {
            this._editor.focus();
        }
        // True is next, false is previous
        _focusNav(direction) {
            this._focusedStickyElementIndex = direction ? this._focusedStickyElementIndex + 1 : this._focusedStickyElementIndex - 1;
            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
        }
        goToFocused() {
            const lineNumbers = this._stickyScrollWidget.lineNumbers;
            this._disposeFocusStickyScrollStore();
            this._revealPosition({ lineNumber: lineNumbers[this._focusedStickyElementIndex], column: 1 });
        }
        _revealPosition(position) {
            this._reveaInEditor(position, () => this._editor.revealPosition(position));
        }
        _revealLineInCenterIfOutsideViewport(position) {
            this._reveaInEditor(position, () => this._editor.revealLineInCenterIfOutsideViewport(position.lineNumber, 0 /* ScrollType.Smooth */));
        }
        _reveaInEditor(position, revealFunction) {
            if (this._focused) {
                this._disposeFocusStickyScrollStore();
            }
            this._positionRevealed = true;
            revealFunction();
            this._editor.setSelection(range_1.Range.fromPositions(position));
            this._editor.focus();
        }
        _registerMouseListeners() {
            const sessionStore = this._register(new lifecycle_1.DisposableStore());
            const gesture = this._register(new clickLinkGesture_1.ClickLinkGesture(this._editor, {
                extractLineNumberFromMouseEvent: (e) => {
                    const position = this._stickyScrollWidget.getEditorPositionFromNode(e.target.element);
                    return position ? position.lineNumber : 0;
                }
            }));
            const getMouseEventTarget = (mouseEvent) => {
                if (!this._editor.hasModel()) {
                    return null;
                }
                if (mouseEvent.target.type !== 12 /* MouseTargetType.OVERLAY_WIDGET */ || mouseEvent.target.detail !== this._stickyScrollWidget.getId()) {
                    // not hovering over our widget
                    return null;
                }
                const mouseTargetElement = mouseEvent.target.element;
                if (!mouseTargetElement || mouseTargetElement.innerText !== mouseTargetElement.innerHTML) {
                    // not on a span element rendering text
                    return null;
                }
                const position = this._stickyScrollWidget.getEditorPositionFromNode(mouseTargetElement);
                if (!position) {
                    // not hovering a sticky scroll line
                    return null;
                }
                return {
                    range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + mouseTargetElement.innerText.length),
                    textElement: mouseTargetElement
                };
            };
            const stickyScrollWidgetDomNode = this._stickyScrollWidget.getDomNode();
            this._register(dom.addStandardDisposableListener(stickyScrollWidgetDomNode, dom.EventType.CLICK, (mouseEvent) => {
                if (mouseEvent.ctrlKey || mouseEvent.altKey || mouseEvent.metaKey) {
                    // modifier pressed
                    return;
                }
                if (!mouseEvent.leftButton) {
                    // not left click
                    return;
                }
                if (mouseEvent.shiftKey) {
                    // shift click
                    const lineIndex = this._stickyScrollWidget.getLineIndexFromChildDomNode(mouseEvent.target);
                    if (lineIndex === null) {
                        return;
                    }
                    const position = new position_1.Position(this._endLineNumbers[lineIndex], 1);
                    this._revealLineInCenterIfOutsideViewport(position);
                    return;
                }
                const isInFoldingIconDomNode = this._stickyScrollWidget.isInFoldingIconDomNode(mouseEvent.target);
                if (isInFoldingIconDomNode) {
                    // clicked on folding icon
                    const lineNumber = this._stickyScrollWidget.getLineNumberFromChildDomNode(mouseEvent.target);
                    this._toggleFoldingRegionForLine(lineNumber);
                    return;
                }
                const isInStickyLine = this._stickyScrollWidget.isInStickyLine(mouseEvent.target);
                if (!isInStickyLine) {
                    return;
                }
                // normal click
                let position = this._stickyScrollWidget.getEditorPositionFromNode(mouseEvent.target);
                if (!position) {
                    const lineNumber = this._stickyScrollWidget.getLineNumberFromChildDomNode(mouseEvent.target);
                    if (lineNumber === null) {
                        // not hovering a sticky scroll line
                        return;
                    }
                    position = new position_1.Position(lineNumber, 1);
                }
                this._revealPosition(position);
            }));
            this._register(dom.addStandardDisposableListener(stickyScrollWidgetDomNode, dom.EventType.MOUSE_MOVE, (mouseEvent) => {
                if (mouseEvent.shiftKey) {
                    const currentEndForLineIndex = this._stickyScrollWidget.getLineIndexFromChildDomNode(mouseEvent.target);
                    if (currentEndForLineIndex === null || this._showEndForLine !== null && this._showEndForLine === currentEndForLineIndex) {
                        return;
                    }
                    this._showEndForLine = currentEndForLineIndex;
                    this._renderStickyScroll();
                    return;
                }
                if (this._showEndForLine !== null) {
                    this._showEndForLine = null;
                    this._renderStickyScroll();
                }
            }));
            this._register(dom.addDisposableListener(stickyScrollWidgetDomNode, dom.EventType.MOUSE_LEAVE, (e) => {
                if (this._showEndForLine !== null) {
                    this._showEndForLine = null;
                    this._renderStickyScroll();
                }
            }));
            this._register(gesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, _keyboardEvent]) => {
                const mouseTarget = getMouseEventTarget(mouseEvent);
                if (!mouseTarget || !mouseEvent.hasTriggerModifier || !this._editor.hasModel()) {
                    sessionStore.clear();
                    return;
                }
                const { range, textElement } = mouseTarget;
                if (!range.equalsRange(this._stickyRangeProjectedOnEditor)) {
                    this._stickyRangeProjectedOnEditor = range;
                    sessionStore.clear();
                }
                else if (textElement.style.textDecoration === 'underline') {
                    return;
                }
                const cancellationToken = new cancellation_1.CancellationTokenSource();
                sessionStore.add((0, lifecycle_1.toDisposable)(() => cancellationToken.dispose(true)));
                let currentHTMLChild;
                (0, goToSymbol_1.getDefinitionsAtPosition)(this._languageFeaturesService.definitionProvider, this._editor.getModel(), new position_1.Position(range.startLineNumber, range.startColumn + 1), cancellationToken.token).then((candidateDefinitions => {
                    if (cancellationToken.token.isCancellationRequested) {
                        return;
                    }
                    if (candidateDefinitions.length !== 0) {
                        this._candidateDefinitionsLength = candidateDefinitions.length;
                        const childHTML = textElement;
                        if (currentHTMLChild !== childHTML) {
                            sessionStore.clear();
                            currentHTMLChild = childHTML;
                            currentHTMLChild.style.textDecoration = 'underline';
                            sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                                currentHTMLChild.style.textDecoration = 'none';
                            }));
                        }
                        else if (!currentHTMLChild) {
                            currentHTMLChild = childHTML;
                            currentHTMLChild.style.textDecoration = 'underline';
                            sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                                currentHTMLChild.style.textDecoration = 'none';
                            }));
                        }
                    }
                    else {
                        sessionStore.clear();
                    }
                }));
            }));
            this._register(gesture.onCancel(() => {
                sessionStore.clear();
            }));
            this._register(gesture.onExecute(async (e) => {
                if (e.target.type !== 12 /* MouseTargetType.OVERLAY_WIDGET */ || e.target.detail !== this._stickyScrollWidget.getId()) {
                    // not hovering over our widget
                    return;
                }
                const position = this._stickyScrollWidget.getEditorPositionFromNode(e.target.element);
                if (!position) {
                    // not hovering a sticky scroll line
                    return;
                }
                if (!this._editor.hasModel() || !this._stickyRangeProjectedOnEditor) {
                    return;
                }
                if (this._candidateDefinitionsLength > 1) {
                    if (this._focused) {
                        this._disposeFocusStickyScrollStore();
                    }
                    this._revealPosition({ lineNumber: position.lineNumber, column: 1 });
                }
                this._instaService.invokeFunction(inlayHintsLocations_1.goToDefinitionWithLocation, e, this._editor, { uri: this._editor.getModel().uri, range: this._stickyRangeProjectedOnEditor });
            }));
        }
        _onContextMenu(targetWindow, e) {
            const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
            this._contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.StickyScrollContext,
                getAnchor: () => event,
            });
        }
        _toggleFoldingRegionForLine(line) {
            if (!this._foldingModel || line === null) {
                return;
            }
            const stickyLine = this._stickyScrollWidget.getRenderedStickyLine(line);
            const foldingIcon = stickyLine?.foldingIcon;
            if (!foldingIcon) {
                return;
            }
            (0, foldingModel_1.toggleCollapseState)(this._foldingModel, Number.MAX_VALUE, [line]);
            foldingIcon.isCollapsed = !foldingIcon.isCollapsed;
            const scrollTop = (foldingIcon.isCollapsed ?
                this._editor.getTopForLineNumber(foldingIcon.foldingEndLine)
                : this._editor.getTopForLineNumber(foldingIcon.foldingStartLine))
                - this._editor.getOption(67 /* EditorOption.lineHeight */) * stickyLine.index + 1;
            this._editor.setScrollTop(scrollTop);
            this._renderStickyScroll(line);
        }
        _readConfiguration() {
            const options = this._editor.getOption(115 /* EditorOption.stickyScroll */);
            if (options.enabled === false) {
                this._editor.removeOverlayWidget(this._stickyScrollWidget);
                this._sessionStore.clear();
                this._enabled = false;
                return;
            }
            else if (options.enabled && !this._enabled) {
                // When sticky scroll was just enabled, add the listeners on the sticky scroll
                this._editor.addOverlayWidget(this._stickyScrollWidget);
                this._sessionStore.add(this._editor.onDidScrollChange((e) => {
                    if (e.scrollTopChanged) {
                        this._showEndForLine = null;
                        this._renderStickyScroll();
                    }
                }));
                this._sessionStore.add(this._editor.onDidLayoutChange(() => this._onDidResize()));
                this._sessionStore.add(this._editor.onDidChangeModelTokens((e) => this._onTokensChange(e)));
                this._sessionStore.add(this._stickyLineCandidateProvider.onDidChangeStickyScroll(() => {
                    this._showEndForLine = null;
                    this._renderStickyScroll();
                }));
                this._enabled = true;
            }
            const lineNumberOption = this._editor.getOption(68 /* EditorOption.lineNumbers */);
            if (lineNumberOption.renderType === 2 /* RenderLineNumbersType.Relative */) {
                this._sessionStore.add(this._editor.onDidChangeCursorPosition(() => {
                    this._showEndForLine = null;
                    this._renderStickyScroll(0);
                }));
            }
        }
        _readConfigurationChange(event) {
            if (event.hasChanged(115 /* EditorOption.stickyScroll */)
                || event.hasChanged(73 /* EditorOption.minimap */)
                || event.hasChanged(67 /* EditorOption.lineHeight */)
                || event.hasChanged(110 /* EditorOption.showFoldingControls */)
                || event.hasChanged(68 /* EditorOption.lineNumbers */)) {
                this._readConfiguration();
            }
            if (event.hasChanged(68 /* EditorOption.lineNumbers */)) {
                this._renderStickyScroll(0);
            }
        }
        _needsUpdate(event) {
            const stickyLineNumbers = this._stickyScrollWidget.getCurrentLines();
            for (const stickyLineNumber of stickyLineNumbers) {
                for (const range of event.ranges) {
                    if (stickyLineNumber >= range.fromLineNumber && stickyLineNumber <= range.toLineNumber) {
                        return true;
                    }
                }
            }
            return false;
        }
        _onTokensChange(event) {
            if (this._needsUpdate(event)) {
                // Rebuilding the whole widget from line 0
                this._renderStickyScroll(0);
            }
        }
        _onDidResize() {
            const layoutInfo = this._editor.getLayoutInfo();
            // Make sure sticky scroll doesn't take up more than 25% of the editor
            const theoreticalLines = layoutInfo.height / this._editor.getOption(67 /* EditorOption.lineHeight */);
            this._maxStickyLines = Math.round(theoreticalLines * .25);
        }
        async _renderStickyScroll(rebuildFromLine) {
            const model = this._editor.getModel();
            if (!model || model.isTooLargeForTokenization()) {
                this._foldingModel = null;
                this._stickyScrollWidget.setState(undefined, null);
                return;
            }
            const stickyLineVersion = this._stickyLineCandidateProvider.getVersionId();
            if (stickyLineVersion === undefined || stickyLineVersion === model.getVersionId()) {
                this._foldingModel = await folding_1.FoldingController.get(this._editor)?.getFoldingModel() ?? null;
                this._widgetState = this.findScrollWidgetState();
                this._stickyScrollVisibleContextKey.set(!(this._widgetState.startLineNumbers.length === 0));
                if (!this._focused) {
                    this._stickyScrollWidget.setState(this._widgetState, this._foldingModel, rebuildFromLine);
                }
                else {
                    // Suppose that previously the sticky scroll widget had height 0, then if there are visible lines, set the last line as focused
                    if (this._focusedStickyElementIndex === -1) {
                        this._stickyScrollWidget.setState(this._widgetState, this._foldingModel, rebuildFromLine);
                        this._focusedStickyElementIndex = this._stickyScrollWidget.lineNumberCount - 1;
                        if (this._focusedStickyElementIndex !== -1) {
                            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
                        }
                    }
                    else {
                        const focusedStickyElementLineNumber = this._stickyScrollWidget.lineNumbers[this._focusedStickyElementIndex];
                        this._stickyScrollWidget.setState(this._widgetState, this._foldingModel, rebuildFromLine);
                        // Suppose that after setting the state, there are no sticky lines, set the focused index to -1
                        if (this._stickyScrollWidget.lineNumberCount === 0) {
                            this._focusedStickyElementIndex = -1;
                        }
                        else {
                            const previousFocusedLineNumberExists = this._stickyScrollWidget.lineNumbers.includes(focusedStickyElementLineNumber);
                            // If the line number is still there, do not change anything
                            // If the line number is not there, set the new focused line to be the last line
                            if (!previousFocusedLineNumberExists) {
                                this._focusedStickyElementIndex = this._stickyScrollWidget.lineNumberCount - 1;
                            }
                            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
                        }
                    }
                }
            }
        }
        findScrollWidgetState() {
            const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            const maxNumberStickyLines = Math.min(this._maxStickyLines, this._editor.getOption(115 /* EditorOption.stickyScroll */).maxLineCount);
            const scrollTop = this._editor.getScrollTop();
            let lastLineRelativePosition = 0;
            const startLineNumbers = [];
            const endLineNumbers = [];
            const arrayVisibleRanges = this._editor.getVisibleRanges();
            if (arrayVisibleRanges.length !== 0) {
                const fullVisibleRange = new stickyScrollElement_1.StickyRange(arrayVisibleRanges[0].startLineNumber, arrayVisibleRanges[arrayVisibleRanges.length - 1].endLineNumber);
                const candidateRanges = this._stickyLineCandidateProvider.getCandidateStickyLinesIntersecting(fullVisibleRange);
                for (const range of candidateRanges) {
                    const start = range.startLineNumber;
                    const end = range.endLineNumber;
                    const depth = range.nestingDepth;
                    if (end - start > 0) {
                        const topOfElementAtDepth = (depth - 1) * lineHeight;
                        const bottomOfElementAtDepth = depth * lineHeight;
                        const bottomOfBeginningLine = this._editor.getBottomForLineNumber(start) - scrollTop;
                        const topOfEndLine = this._editor.getTopForLineNumber(end) - scrollTop;
                        const bottomOfEndLine = this._editor.getBottomForLineNumber(end) - scrollTop;
                        if (topOfElementAtDepth > topOfEndLine && topOfElementAtDepth <= bottomOfEndLine) {
                            startLineNumbers.push(start);
                            endLineNumbers.push(end + 1);
                            lastLineRelativePosition = bottomOfEndLine - bottomOfElementAtDepth;
                            break;
                        }
                        else if (bottomOfElementAtDepth > bottomOfBeginningLine && bottomOfElementAtDepth <= bottomOfEndLine) {
                            startLineNumbers.push(start);
                            endLineNumbers.push(end + 1);
                        }
                        if (startLineNumbers.length === maxNumberStickyLines) {
                            break;
                        }
                    }
                }
            }
            this._endLineNumbers = endLineNumbers;
            return new stickyScrollWidget_1.StickyScrollWidgetState(startLineNumbers, endLineNumbers, lastLineRelativePosition, this._showEndForLine);
        }
        dispose() {
            super.dispose();
            this._sessionStore.dispose();
        }
    };
    exports.StickyScrollController = StickyScrollController;
    exports.StickyScrollController = StickyScrollController = StickyScrollController_1 = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(5, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(6, contextkey_1.IContextKeyService)
    ], StickyScrollController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N0aWNreVNjcm9sbC9icm93c2VyL3N0aWNreVNjcm9sbENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlDekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTs7aUJBRXJDLE9BQUUsR0FBRyxzQ0FBc0MsQUFBekMsQ0FBMEM7UUF5QjVELFlBQ2tCLE9BQW9CLEVBQ2hCLG1CQUF5RCxFQUNwRCx3QkFBbUUsRUFDdEUsYUFBcUQsRUFDN0MsNkJBQTRELEVBQzFELCtCQUFnRSxFQUM3RSxrQkFBdUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFSUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUNuQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3JELGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUd2Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBNUIzRCxrQkFBYSxHQUFvQixJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUdoRSxrQkFBYSxHQUF3QixJQUFJLENBQUM7WUFDMUMsb0JBQWUsR0FBVyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFHbEQsZ0NBQTJCLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFNekMsK0JBQTBCLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsYUFBUSxHQUFHLEtBQUssQ0FBQztZQUNqQixhQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztZQUMxQixpQkFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQixvQkFBZSxHQUFh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