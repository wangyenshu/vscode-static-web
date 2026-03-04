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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/editor/contrib/hover/browser/hoverOperation", "vs/editor/contrib/hover/browser/hoverTypes", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/inlayHints/browser/inlayHintsHover", "vs/editor/contrib/hover/browser/contentHoverWidget", "vs/editor/contrib/hover/browser/contentHoverComputer", "vs/editor/contrib/hover/browser/contentHoverTypes", "vs/editor/contrib/hover/browser/contentHoverStatusBar"], function (require, exports, dom, lifecycle_1, position_1, range_1, textModel_1, languages_1, hoverOperation_1, hoverTypes_1, instantiation_1, keybinding_1, markdownHoverParticipant_1, inlayHintsHover_1, contentHoverWidget_1, contentHoverComputer_1, contentHoverTypes_1, contentHoverStatusBar_1) {
    "use strict";
    var ContentHoverController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentHoverController = void 0;
    let ContentHoverController = class ContentHoverController extends lifecycle_1.Disposable {
        static { ContentHoverController_1 = this; }
        constructor(_editor, _instantiationService, _keybindingService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._currentResult = null;
            this._widget = this._register(this._instantiationService.createInstance(contentHoverWidget_1.ContentHoverWidget, this._editor));
            // Instantiate participants and sort them by `hoverOrdinal` which is relevant for rendering order.
            this._participants = [];
            for (const participant of hoverTypes_1.HoverParticipantRegistry.getAll()) {
                const participantInstance = this._instantiationService.createInstance(participant, this._editor);
                if (participantInstance instanceof markdownHoverParticipant_1.MarkdownHoverParticipant && !(participantInstance instanceof inlayHintsHover_1.InlayHintsHover)) {
                    this._markdownHoverParticipant = participantInstance;
                }
                this._participants.push(participantInstance);
            }
            this._participants.sort((p1, p2) => p1.hoverOrdinal - p2.hoverOrdinal);
            this._computer = new contentHoverComputer_1.ContentHoverComputer(this._editor, this._participants);
            this._hoverOperation = this._register(new hoverOperation_1.HoverOperation(this._editor, this._computer));
            this._register(this._hoverOperation.onResult((result) => {
                if (!this._computer.anchor) {
                    // invalid state, ignore result
                    return;
                }
                const messages = (result.hasLoadingMessage ? this._addLoadingMessage(result.value) : result.value);
                this._withResult(new contentHoverTypes_1.HoverResult(this._computer.anchor, messages, result.isComplete));
            }));
            this._register(dom.addStandardDisposableListener(this._widget.getDomNode(), 'keydown', (e) => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                }
            }));
            this._register(languages_1.TokenizationRegistry.onDidChange(() => {
                if (this._widget.position && this._currentResult) {
                    this._setCurrentResult(this._currentResult); // render again
                }
            }));
        }
        /**
         * Returns true if the hover shows now or will show.
         */
        _startShowingOrUpdateHover(anchor, mode, source, focus, mouseEvent) {
            if (!this._widget.position || !this._currentResult) {
                // The hover is not visible
                if (anchor) {
                    this._startHoverOperationIfNecessary(anchor, mode, source, focus, false);
                    return true;
                }
                return false;
            }
            // The hover is currently visible
            const isHoverSticky = this._editor.getOption(60 /* EditorOption.hover */).sticky;
            const isGettingCloser = (isHoverSticky
                && mouseEvent
                && this._widget.isMouseGettingCloser(mouseEvent.event.posx, mouseEvent.event.posy));
            if (isGettingCloser) {
                // The mouse is getting closer to the hover, so we will keep the hover untouched
                // But we will kick off a hover update at the new anchor, insisting on keeping the hover visible.
                if (anchor) {
                    this._startHoverOperationIfNecessary(anchor, mode, source, focus, true);
                }
                return true;
            }
            if (!anchor) {
                this._setCurrentResult(null);
                return false;
            }
            if (anchor && this._currentResult.anchor.equals(anchor)) {
                // The widget is currently showing results for the exact same anchor, so no update is needed
                return true;
            }
            if (!anchor.canAdoptVisibleHover(this._currentResult.anchor, this._widget.position)) {
                // The new anchor is not compatible with the previous anchor
                this._setCurrentResult(null);
                this._startHoverOperationIfNecessary(anchor, mode, source, focus, false);
                return true;
            }
            // We aren't getting any closer to the hover, so we will filter existing results
            // and keep those which also apply to the new anchor.
            this._setCurrentResult(this._currentResult.filter(anchor));
            this._startHoverOperationIfNecessary(anchor, mode, source, focus, false);
            return true;
        }
        _startHoverOperationIfNecessary(anchor, mode, source, focus, insistOnKeepingHoverVisible) {
            if (this._computer.anchor && this._computer.anchor.equals(anchor)) {
                // We have to start a hover operation at the exact same anchor as before, so no work is needed
                return;
            }
            this._hoverOperation.cancel();
            this._computer.anchor = anchor;
            this._computer.shouldFocus = focus;
            this._computer.source = source;
            this._computer.insistOnKeepingHoverVisible = insistOnKeepingHoverVisible;
            this._hoverOperation.start(mode);
        }
        _setCurrentResult(hoverResult) {
            if (this._currentResult === hoverResult) {
                // avoid updating the DOM to avoid resetting the user selection
                return;
            }
            if (hoverResult && hoverResult.messages.length === 0) {
                hoverResult = null;
            }
            this._currentResult = hoverResult;
            if (this._currentResult) {
                this._renderMessages(this._currentResult.anchor, this._currentResult.messages);
            }
            else {
                this._widget.hide();
            }
        }
        _addLoadingMessage(result) {
            if (this._computer.anchor) {
                for (const participant of this._participants) {
                    if (participant.createLoadingMessage) {
                        const loadingMessage = participant.createLoadingMessage(this._computer.anchor);
                        if (loadingMessage) {
                            return result.slice(0).concat([loadingMessage]);
                        }
                    }
                }
            }
            return result;
        }
        _withResult(hoverResult) {
            if (this._widget.position && this._currentResult && this._currentResult.isComplete) {
                // The hover is visible with a previous complete result.
                if (!hoverResult.isComplete) {
                    // Instead of rendering the new partial result, we wait for the result to be complete.
                    return;
                }
                if (this._computer.insistOnKeepingHoverVisible && hoverResult.messages.length === 0) {
                    // The hover would now hide normally, so we'll keep the previous messages
                    return;
                }
            }
            this._setCurrentResult(hoverResult);
        }
        _renderMessages(anchor, messages) {
            const { showAtPosition, showAtSecondaryPosition, highlightRange } = ContentHoverController_1.computeHoverRanges(this._editor, anchor.range, messages);
            const disposables = new lifecycle_1.DisposableStore();
            const statusBar = disposables.add(new contentHoverStatusBar_1.EditorHoverStatusBar(this._keybindingService));
            const fragment = document.createDocumentFragment();
            let colorPicker = null;
            const context = {
                fragment,
                statusBar,
                setColorPicker: (widget) => colorPicker = widget,
                onContentsChanged: () => this._widget.onContentsChanged(),
                setMinimumDimensions: (dimensions) => this._widget.setMinimumDimensions(dimensions),
                hide: () => this.hide()
            };
            for (const participant of this._participants) {
                const hoverParts = messages.filter(msg => msg.owner === participant);
                if (hoverParts.length > 0) {
                    disposables.add(participant.renderHoverParts(context, hoverParts));
                }
            }
            const isBeforeContent = messages.some(m => m.isBeforeContent);
            if (statusBar.hasContent) {
                fragment.appendChild(statusBar.hoverElement);
            }
            if (fragment.hasChildNodes()) {
                if (highlightRange) {
                    const highlightDecoration = this._editor.createDecorationsCollection();
                    highlightDecoration.set([{
                            range: highlightRange,
                            options: ContentHoverController_1._DECORATION_OPTIONS
                        }]);
                    disposables.add((0, lifecycle_1.toDisposable)(() => {
                        highlightDecoration.clear();
                    }));
                }
                this._widget.showAt(fragment, new contentHoverTypes_1.ContentHoverVisibleData(anchor.initialMousePosX, anchor.initialMousePosY, colorPicker, showAtPosition, showAtSecondaryPosition, this._editor.getOption(60 /* EditorOption.hover */).above, this._computer.shouldFocus, this._computer.source, isBeforeContent, disposables));
            }
            else {
                disposables.dispose();
            }
        }
        static { this._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
            description: 'content-hover-highlight',
            className: 'hoverHighlight'
        }); }
        static computeHoverRanges(editor, anchorRange, messages) {
            let startColumnBoundary = 1;
            if (editor.hasModel()) {
                // Ensure the range is on the current view line
                const viewModel = editor._getViewModel();
                const coordinatesConverter = viewModel.coordinatesConverter;
                const anchorViewRange = coordinatesConverter.convertModelRangeToViewRange(anchorRange);
                const anchorViewRangeStart = new position_1.Position(anchorViewRange.startLineNumber, viewModel.getLineMinColumn(anchorViewRange.startLineNumber));
                startColumnBoundary = coordinatesConverter.convertViewPositionToModelPosition(anchorViewRangeStart).column;
            }
            // The anchor range is always on a single line
            const anchorLineNumber = anchorRange.startLineNumber;
            let renderStartColumn = anchorRange.startColumn;
            let highlightRange = messages[0].range;
            let forceShowAtRange = null;
            for (const msg of messages) {
                highlightRange = range_1.Range.plusRange(highlightRange, msg.range);
                if (msg.range.startLineNumber === anchorLineNumber && msg.range.endLineNumber === anchorLineNumber) {
                    // this message has a range that is completely sitting on the line of the anchor
                    renderStartColumn = Math.max(Math.min(renderStartColumn, msg.range.startColumn), startColumnBoundary);
                }
                if (msg.forceShowAtRange) {
                    forceShowAtRange = msg.range;
                }
            }
            const showAtPosition = forceShowAtRange ? forceShowAtRange.getStartPosition() : new position_1.Position(anchorLineNumber, anchorRange.startColumn);
            const showAtSecondaryPosition = forceShowAtRange ? forceShowAtRange.getStartPosition() : new position_1.Position(anchorLineNumber, renderStartColumn);
            return {
                showAtPosition,
                showAtSecondaryPosition,
                highlightRange
            };
        }
        showsOrWillShow(mouseEvent) {
            if (this._widget.isResizing) {
                return true;
            }
            const anchorCandidates = [];
            for (const participant of this._participants) {
                if (participant.suggestHoverAnchor) {
                    const anchor = participant.suggestHoverAnchor(mouseEvent);
                    if (anchor) {
                        anchorCandidates.push(anchor);
                    }
                }
            }
            const target = mouseEvent.target;
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                anchorCandidates.push(new hoverTypes_1.HoverRangeAnchor(0, target.range, mouseEvent.event.posx, mouseEvent.event.posy));
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                const epsilon = this._editor.getOption(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth / 2;
                if (!target.detail.isAfterLines
                    && typeof target.detail.horizontalDistanceToText === 'number'
                    && target.detail.horizontalDistanceToText < epsilon) {
                    // Let hover kick in even when the mouse is technically in the empty area after a line, given the distance is small enough
                    anchorCandidates.push(new hoverTypes_1.HoverRangeAnchor(0, target.range, mouseEvent.event.posx, mouseEvent.event.posy));
                }
            }
            if (anchorCandidates.length === 0) {
                return this._startShowingOrUpdateHover(null, 0 /* HoverStartMode.Delayed */, 0 /* HoverStartSource.Mouse */, false, mouseEvent);
            }
            anchorCandidates.sort((a, b) => b.priority - a.priority);
            return this._startShowingOrUpdateHover(anchorCandidates[0], 0 /* HoverStartMode.Delayed */, 0 /* HoverStartSource.Mouse */, false, mouseEvent);
        }
        startShowingAtRange(range, mode, source, focus) {
            this._startShowingOrUpdateHover(new hoverTypes_1.HoverRangeAnchor(0, range, undefined, undefined), mode, source, focus, null);
        }
        async updateFocusedMarkdownHoverVerbosityLevel(action) {
            this._markdownHoverParticipant?.updateFocusedMarkdownHoverPartVerbosityLevel(action);
        }
        getWidgetContent() {
            const node = this._widget.getDomNode();
            if (!node.textContent) {
                return undefined;
            }
            return node.textContent;
        }
        containsNode(node) {
            return (node ? this._widget.getDomNode().contains(node) : false);
        }
        focus() {
            this._widget.focus();
        }
        scrollUp() {
            this._widget.scrollUp();
        }
        scrollDown() {
            this._widget.scrollDown();
        }
        scrollLeft() {
            this._widget.scrollLeft();
        }
        scrollRight() {
            this._widget.scrollRight();
        }
        pageUp() {
            this._widget.pageUp();
        }
        pageDown() {
            this._widget.pageDown();
        }
        goToTop() {
            this._widget.goToTop();
        }
        goToBottom() {
            this._widget.goToBottom();
        }
        hide() {
            this._computer.anchor = null;
            this._hoverOperation.cancel();
            this._setCurrentResult(null);
        }
        get isColorPickerVisible() {
            return this._widget.isColorPickerVisible;
        }
        get isVisibleFromKeyboard() {
            return this._widget.isVisibleFromKeyboard;
        }
        get isVisible() {
            return this._widget.isVisible;
        }
        get isFocused() {
            return this._widget.isFocused;
        }
        get isResizing() {
            return this._widget.isResizing;
        }
        get widget() {
            return this._widget;
        }
    };
    exports.ContentHoverController = ContentHoverController;
    exports.ContentHoverController = ContentHoverController = ContentHoverController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService)
    ], ContentHoverController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvY29udGVudEhvdmVyQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVOztRQVdyRCxZQUNrQixPQUFvQixFQUNkLHFCQUE2RCxFQUNoRSxrQkFBdUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFKUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0csMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBWnBFLG1CQUFjLEdBQXVCLElBQUksQ0FBQztZQWdCakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsdUNBQWtCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFM0csa0dBQWtHO1lBQ2xHLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLEtBQUssTUFBTSxXQUFXLElBQUkscUNBQXdCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDN0QsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2pHLElBQUksbUJBQW1CLFlBQVksbURBQXdCLElBQUksQ0FBQyxDQUFDLG1CQUFtQixZQUFZLGlDQUFlLENBQUMsRUFBRSxDQUFDO29CQUNsSCxJQUFJLENBQUMseUJBQXlCLEdB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