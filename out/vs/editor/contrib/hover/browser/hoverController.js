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
define(["require", "exports", "vs/editor/contrib/hover/browser/hoverActionIds", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget", "vs/platform/keybinding/common/keybinding", "vs/base/common/async", "vs/editor/contrib/hover/browser/contentHoverWidget", "vs/editor/contrib/hover/browser/contentHoverController", "vs/editor/contrib/hover/browser/marginHoverWidget", "vs/css!./hover"], function (require, exports, hoverActionIds_1, lifecycle_1, instantiation_1, inlineCompletionsHintsWidget_1, keybinding_1, async_1, contentHoverWidget_1, contentHoverController_1, marginHoverWidget_1) {
    "use strict";
    var HoverController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverController = void 0;
    // sticky hover widget which doesn't disappear on focus out and such
    const _sticky = false;
    var HoverWidgetType;
    (function (HoverWidgetType) {
        HoverWidgetType[HoverWidgetType["Content"] = 0] = "Content";
        HoverWidgetType[HoverWidgetType["Glyph"] = 1] = "Glyph";
    })(HoverWidgetType || (HoverWidgetType = {}));
    let HoverController = class HoverController extends lifecycle_1.Disposable {
        static { HoverController_1 = this; }
        static { this.ID = 'editor.contrib.hover'; }
        constructor(_editor, _instantiationService, _keybindingService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._listenersStore = new lifecycle_1.DisposableStore();
            this._hoverState = {
                mouseDown: false,
                activatedByDecoratorClick: false
            };
            this._reactToEditorMouseMoveRunner = this._register(new async_1.RunOnceScheduler(() => this._reactToEditorMouseMove(this._mouseMoveEvent), 0));
            this._hookListeners();
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(60 /* EditorOption.hover */)) {
                    this._unhookListeners();
                    this._hookListeners();
                }
            }));
        }
        static get(editor) {
            return editor.getContribution(HoverController_1.ID);
        }
        _hookListeners() {
            const hoverOpts = this._editor.getOption(60 /* EditorOption.hover */);
            this._hoverSettings = {
                enabled: hoverOpts.enabled,
                sticky: hoverOpts.sticky,
                hidingDelay: hoverOpts.delay
            };
            if (hoverOpts.enabled) {
                this._listenersStore.add(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
                this._listenersStore.add(this._editor.onMouseUp(() => this._onEditorMouseUp()));
                this._listenersStore.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._listenersStore.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
            }
            else {
                this._listenersStore.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._listenersStore.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
            }
            this._listenersStore.add(this._editor.onMouseLeave((e) => this._onEditorMouseLeave(e)));
            this._listenersStore.add(this._editor.onDidChangeModel(() => {
                this._cancelScheduler();
                this._hideWidgets();
            }));
            this._listenersStore.add(this._editor.onDidChangeModelContent(() => this._cancelScheduler()));
            this._listenersStore.add(this._editor.onDidScrollChange((e) => this._onEditorScrollChanged(e)));
        }
        _unhookListeners() {
            this._listenersStore.clear();
        }
        _cancelScheduler() {
            this._mouseMoveEvent = undefined;
            this._reactToEditorMouseMoveRunner.cancel();
        }
        _onEditorScrollChanged(e) {
            if (e.scrollTopChanged || e.scrollLeftChanged) {
                this._hideWidgets();
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._hoverState.mouseDown = true;
            const shouldNotHideCurrentHoverWidget = this._shouldNotHideCurrentHoverWidget(mouseEvent);
            if (shouldNotHideCurrentHoverWidget) {
                return;
            }
            this._hideWidgets();
        }
        _shouldNotHideCurrentHoverWidget(mouseEvent) {
            if (this._isMouseOnContentHoverWidget(mouseEvent)
                || this._isMouseOnMarginHoverWidget(mouseEvent)
                || this._isContentWidgetResizing()) {
                return true;
            }
            return false;
        }
        _isMouseOnMarginHoverWidget(mouseEvent) {
            const target = mouseEvent.target;
            if (!target) {
                return false;
            }
            return target.type === 12 /* MouseTargetType.OVERLAY_WIDGET */ && target.detail === marginHoverWidget_1.MarginHoverWidget.ID;
        }
        _isMouseOnContentHoverWidget(mouseEvent) {
            const target = mouseEvent.target;
            if (!target) {
                return false;
            }
            return target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && target.detail === contentHoverWidget_1.ContentHoverWidget.ID;
        }
        _onEditorMouseUp() {
            this._hoverState.mouseDown = false;
        }
        _onEditorMouseLeave(mouseEvent) {
            this._cancelScheduler();
            const shouldNotHideCurrentHoverWidget = this._shouldNotHideCurrentHoverWidget(mouseEvent);
            if (shouldNotHideCurrentHoverWidget) {
                return;
            }
            if (_sticky) {
                return;
            }
            this._hideWidgets();
        }
        _shouldNotRecomputeCurrentHoverWidget(mouseEvent) {
            const isHoverSticky = this._hoverSettings.sticky;
            const isMouseOnStickyMarginHoverWidget = (mouseEvent, isHoverSticky) => {
                const isMouseOnMarginHoverWidget = this._isMouseOnMarginHoverWidget(mouseEvent);
                return isHoverSticky && isMouseOnMarginHoverWidget;
            };
            const isMouseOnStickyContentHoverWidget = (mouseEvent, isHoverSticky) => {
                const isMouseOnContentHoverWidget = this._isMouseOnContentHoverWidget(mouseEvent);
                return isHoverSticky && isMouseOnContentHoverWidget;
            };
            const isMouseOnColorPicker = (mouseEvent) => {
                const isMouseOnContentHoverWidget = this._isMouseOnContentHoverWidget(mouseEvent);
                const isColorPickerVisible = this._contentWidget?.isColorPickerVisible;
                return isMouseOnContentHoverWidget && isColorPickerVisible;
            };
            // TODO@aiday-mar verify if the following is necessary code
            const isTextSelectedWithinContentHoverWidget = (mouseEvent, sticky) => {
                return sticky
                    && this._contentWidget?.containsNode(mouseEvent.event.browserEvent.view?.document.activeElement)
                    && !mouseEvent.event.browserEvent.view?.getSelection()?.isCollapsed;
            };
            if (isMouseOnStickyMarginHoverWidget(mouseEvent, isHoverSticky)
                || isMouseOnStickyContentHoverWidget(mouseEvent, isHoverSticky)
                || isMouseOnColorPicker(mouseEvent)
                || isTextSelectedWithinContentHoverWidget(mouseEvent, isHoverSticky)) {
                return true;
            }
            return false;
        }
        _onEditorMouseMove(mouseEvent) {
            this._mouseMoveEvent = mouseEvent;
            if (this._contentWidget?.isFocused || this._contentWidget?.isResizing) {
                return;
            }
            const sticky = this._hoverSettings.sticky;
            if (sticky && this._contentWidget?.isVisibleFromKeyboard) {
                // Sticky mode is on and the hover has been shown via keyboard
                // so moving the mouse has no effect
                return;
            }
            const shouldNotRecomputeCurrentHoverWidget = this._shouldNotRecomputeCurrentHoverWidget(mouseEvent);
            if (shouldNotRecomputeCurrentHoverWidget) {
                this._reactToEditorMouseMoveRunner.cancel();
                return;
            }
            const hidingDelay = this._hoverSettings.hidingDelay;
            const isContentHoverWidgetVisible = this._contentWidget?.isVisible;
            // If the mouse is not over the widget, and if sticky is on,
            // then give it a grace period before reacting to the mouse event
            const shouldRescheduleHoverComputation = isContentHoverWidgetVisible && sticky && hidingDelay > 0;
            if (shouldRescheduleHoverComputation) {
                if (!this._reactToEditorMouseMoveRunner.isScheduled()) {
                    this._reactToEditorMouseMoveRunner.schedule(hidingDelay);
                }
                return;
            }
            this._reactToEditorMouseMove(mouseEvent);
        }
        _reactToEditorMouseMove(mouseEvent) {
            if (!mouseEvent) {
                return;
            }
            const target = mouseEvent.target;
            const mouseOnDecorator = target.element?.classList.contains('colorpicker-color-decoration');
            const decoratorActivatedOn = this._editor.getOption(148 /* EditorOption.colorDecoratorsActivatedOn */);
            const enabled = this._hoverSettings.enabled;
            const activatedByDecoratorClick = this._hoverState.activatedByDecoratorClick;
            if ((mouseOnDecorator && ((decoratorActivatedOn === 'click' && !activatedByDecoratorClick) ||
                (decoratorActivatedOn === 'hover' && !enabled && !_sticky) ||
                (decoratorActivatedOn === 'clickAndHover' && !enabled && !activatedByDecoratorClick))) || (!mouseOnDecorator && !enabled && !activatedByDecoratorClick)) {
                this._hideWidgets();
                return;
            }
            const contentHoverShowsOrWillShow = this._tryShowHoverWidget(mouseEvent, 0 /* HoverWidgetType.Content */);
            if (contentHoverShowsOrWillShow) {
                return;
            }
            const glyphWidgetShowsOrWillShow = this._tryShowHoverWidget(mouseEvent, 1 /* HoverWidgetType.Glyph */);
            if (glyphWidgetShowsOrWillShow) {
                return;
            }
            if (_sticky) {
                return;
            }
            this._hideWidgets();
        }
        _tryShowHoverWidget(mouseEvent, hoverWidgetType) {
            const contentWidget = this._getOrCreateContentWidget();
            const glyphWidget = this._getOrCreateGlyphWidget();
            let currentWidget;
            let otherWidget;
            switch (hoverWidgetType) {
                case 0 /* HoverWidgetType.Content */:
                    currentWidget = contentWidget;
                    otherWidget = glyphWidget;
                    break;
                case 1 /* HoverWidgetType.Glyph */:
                    currentWidget = glyphWidget;
                    otherWidget = contentWidget;
                    break;
                default:
                    throw new Error(`HoverWidgetType ${hoverWidgetType} is unrecognized`);
            }
            const showsOrWillShow = currentWidget.showsOrWillShow(mouseEvent);
            if (showsOrWillShow) {
                otherWidget.hide();
            }
            return showsOrWillShow;
        }
        _onKeyDown(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            const resolvedKeyboardEvent = this._keybindingService.softDispatch(e, this._editor.getDomNode());
            // If the beginning of a multi-chord keybinding is pressed,
            // or the command aims to focus the hover,
            // set the variable to true, otherwise false
            const shouldKeepHoverVisible = (resolvedKeyboardEvent.kind === 1 /* ResultKind.MoreChordsNeeded */ ||
                (resolvedKeyboardEvent.kind === 2 /* ResultKind.KbFound */
                    && (resolvedKeyboardEvent.commandId === hoverActionIds_1.SHOW_OR_FOCUS_HOVER_ACTION_ID
                        || resolvedKeyboardEvent.commandId === hoverActionIds_1.INCREASE_HOVER_VERBOSITY_ACTION_ID
                        || resolvedKeyboardEvent.commandId === hoverActionIds_1.DECREASE_HOVER_VERBOSITY_ACTION_ID)
                    && this._contentWidget?.isVisible));
            if (e.keyCode === 5 /* KeyCode.Ctrl */
                || e.keyCode === 6 /* KeyCode.Alt */
                || e.keyCode === 57 /* KeyCode.Meta */
                || e.keyCode === 4 /* KeyCode.Shift */
                || shouldKeepHoverVisible) {
                // Do not hide hover when a modifier key is pressed
                return;
            }
            this._hideWidgets();
        }
        _hideWidgets() {
            if (_sticky) {
                return;
            }
            if ((this._hoverState.mouseDown
                && this._contentWidget?.isColorPickerVisible) || inlineCompletionsHintsWidget_1.InlineSuggestionHintsContentWidget.dropDownVisible) {
                return;
            }
            this._hoverState.activatedByDecoratorClick = false;
            this._glyphWidget?.hide();
            this._contentWidget?.hide();
        }
        _getOrCreateContentWidget() {
            if (!this._contentWidget) {
                this._contentWidget = this._instantiationService.createInstance(contentHoverController_1.ContentHoverController, this._editor);
            }
            return this._contentWidget;
        }
        _getOrCreateGlyphWidget() {
            if (!this._glyphWidget) {
                this._glyphWidget = this._instantiationService.createInstance(marginHoverWidget_1.MarginHoverWidget, this._editor);
            }
            return this._glyphWidget;
        }
        hideContentHover() {
            this._hideWidgets();
        }
        showContentHover(range, mode, source, focus, activatedByColorDecoratorClick = false) {
            this._hoverState.activatedByDecoratorClick = activatedByColorDecoratorClick;
            this._getOrCreateContentWidget().startShowingAtRange(range, mode, source, focus);
        }
        _isContentWidgetResizing() {
            return this._contentWidget?.widget.isResizing || false;
        }
        updateFocusedMarkdownHoverVerbosityLevel(action) {
            this._getOrCreateContentWidget().updateFocusedMarkdownHoverVerbosityLevel(action);
        }
        focus() {
            this._contentWidget?.focus();
        }
        scrollUp() {
            this._contentWidget?.scrollUp();
        }
        scrollDown() {
            this._contentWidget?.scrollDown();
        }
        scrollLeft() {
            this._contentWidget?.scrollLeft();
        }
        scrollRight() {
            this._contentWidget?.scrollRight();
        }
        pageUp() {
            this._contentWidget?.pageUp();
        }
        pageDown() {
            this._contentWidget?.pageDown();
        }
        goToTop() {
            this._contentWidget?.goToTop();
        }
        goToBottom() {
            this._contentWidget?.goToBottom();
        }
        getWidgetContent() {
            return this._contentWidget?.getWidgetContent();
        }
        get isColorPickerVisible() {
            return this._contentWidget?.isColorPickerVisible;
        }
        get isHoverVisible() {
            return this._contentWidget?.isVisible;
        }
        dispose() {
            super.dispose();
            this._unhookListeners();
            this._listenersStore.dispose();
            this._glyphWidget?.dispose();
            this._contentWidget?.dispose();
        }
    };
    exports.HoverController = HoverController;
    exports.HoverController = HoverController = HoverController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService)
    ], HoverController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9ob3ZlckNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVCaEcsb0VBQW9FO0lBQ3BFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FFbkI7SUFhRixJQUFXLGVBR1Y7SUFIRCxXQUFXLGVBQWU7UUFDekIsMkRBQU8sQ0FBQTtRQUNQLHVEQUFLLENBQUE7SUFDTixDQUFDLEVBSFUsZUFBZSxLQUFmLGVBQWUsUUFHekI7SUFFTSxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVOztpQkFFdkIsT0FBRSxHQUFHLHNCQUFzQixBQUF6QixDQUEwQjtRQWdCbkQsWUFDa0IsT0FBb0IsRUFDZCxxQkFBNkQsRUFDaEUsa0JBQXVEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBSlMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNHLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQWpCM0Qsb0JBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVNqRCxnQkFBVyxHQUFnQjtnQkFDbEMsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLHlCQUF5QixFQUFFLEtBQUs7YUFDaEMsQ0FBQztZQVFELElBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUNsRCxJQUFJLHdCQUFnQixDQUNuQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FDM0QsQ0FDRCxDQUFDO1lBQ0YsSUFBSSxDQUFDLGNBQWMsRUFBRSxD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