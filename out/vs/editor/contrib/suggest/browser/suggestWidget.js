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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/strings", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/contrib/suggest/browser/suggestWidgetStatus", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/base/browser/ui/resizable/resizable", "./suggest", "./suggestWidgetDetails", "./suggestWidgetRenderer", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/codicons/codiconStyles", "vs/css!./media/suggest", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, dom, listWidget_1, async_1, errors_1, event_1, lifecycle_1, numbers_1, strings, embeddedCodeEditorWidget_1, suggestWidgetStatus_1, nls, contextkey_1, instantiation_1, storage_1, colorRegistry_1, theme_1, themeService_1, resizable_1, suggest_1, suggestWidgetDetails_1, suggestWidgetRenderer_1, defaultStyles_1, aria_1) {
    "use strict";
    var SuggestWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestContentWidget = exports.SuggestWidget = exports.editorSuggestWidgetSelectedBackground = void 0;
    /**
     * Suggest widget colors
     */
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.background', { dark: colorRegistry_1.editorWidgetBackground, light: colorRegistry_1.editorWidgetBackground, hcDark: colorRegistry_1.editorWidgetBackground, hcLight: colorRegistry_1.editorWidgetBackground }, nls.localize('editorSuggestWidgetBackground', 'Background color of the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.border', { dark: colorRegistry_1.editorWidgetBorder, light: colorRegistry_1.editorWidgetBorder, hcDark: colorRegistry_1.editorWidgetBorder, hcLight: colorRegistry_1.editorWidgetBorder }, nls.localize('editorSuggestWidgetBorder', 'Border color of the suggest widget.'));
    const editorSuggestWidgetForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.foreground', { dark: colorRegistry_1.editorForeground, light: colorRegistry_1.editorForeground, hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, nls.localize('editorSuggestWidgetForeground', 'Foreground color of the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedForeground', { dark: colorRegistry_1.quickInputListFocusForeground, light: colorRegistry_1.quickInputListFocusForeground, hcDark: colorRegistry_1.quickInputListFocusForeground, hcLight: colorRegistry_1.quickInputListFocusForeground }, nls.localize('editorSuggestWidgetSelectedForeground', 'Foreground color of the selected entry in the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedIconForeground', { dark: colorRegistry_1.quickInputListFocusIconForeground, light: colorRegistry_1.quickInputListFocusIconForeground, hcDark: colorRegistry_1.quickInputListFocusIconForeground, hcLight: colorRegistry_1.quickInputListFocusIconForeground }, nls.localize('editorSuggestWidgetSelectedIconForeground', 'Icon foreground color of the selected entry in the suggest widget.'));
    exports.editorSuggestWidgetSelectedBackground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedBackground', { dark: colorRegistry_1.quickInputListFocusBackground, light: colorRegistry_1.quickInputListFocusBackground, hcDark: colorRegistry_1.quickInputListFocusBackground, hcLight: colorRegistry_1.quickInputListFocusBackground }, nls.localize('editorSuggestWidgetSelectedBackground', 'Background color of the selected entry in the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.highlightForeground', { dark: colorRegistry_1.listHighlightForeground, light: colorRegistry_1.listHighlightForeground, hcDark: colorRegistry_1.listHighlightForeground, hcLight: colorRegistry_1.listHighlightForeground }, nls.localize('editorSuggestWidgetHighlightForeground', 'Color of the match highlights in the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.focusHighlightForeground', { dark: colorRegistry_1.listFocusHighlightForeground, light: colorRegistry_1.listFocusHighlightForeground, hcDark: colorRegistry_1.listFocusHighlightForeground, hcLight: colorRegistry_1.listFocusHighlightForeground }, nls.localize('editorSuggestWidgetFocusHighlightForeground', 'Color of the match highlights in the suggest widget when an item is focused.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidgetStatus.foreground', { dark: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5), light: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5), hcDark: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5), hcLight: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5) }, nls.localize('editorSuggestWidgetStatusForeground', 'Foreground color of the suggest widget status.'));
    var State;
    (function (State) {
        State[State["Hidden"] = 0] = "Hidden";
        State[State["Loading"] = 1] = "Loading";
        State[State["Empty"] = 2] = "Empty";
        State[State["Open"] = 3] = "Open";
        State[State["Frozen"] = 4] = "Frozen";
        State[State["Details"] = 5] = "Details";
    })(State || (State = {}));
    class PersistedWidgetSize {
        constructor(_service, editor) {
            this._service = _service;
            this._key = `suggestWidget.size/${editor.getEditorType()}/${editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget}`;
        }
        restore() {
            const raw = this._service.get(this._key, 0 /* StorageScope.PROFILE */) ?? '';
            try {
                const obj = JSON.parse(raw);
                if (dom.Dimension.is(obj)) {
                    return dom.Dimension.lift(obj);
                }
            }
            catch {
                // ignore
            }
            return undefined;
        }
        store(size) {
            this._service.store(this._key, JSON.stringify(size), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        reset() {
            this._service.remove(this._key, 0 /* StorageScope.PROFILE */);
        }
    }
    let SuggestWidget = class SuggestWidget {
        static { SuggestWidget_1 = this; }
        static { this.LOADING_MESSAGE = nls.localize('suggestWidget.loading', "Loading..."); }
        static { this.NO_SUGGESTIONS_MESSAGE = nls.localize('suggestWidget.noSuggestions', "No suggestions."); }
        constructor(editor, _storageService, _contextKeyService, _themeService, instantiationService) {
            this.editor = editor;
            this._storageService = _storageService;
            this._state = 0 /* State.Hidden */;
            this._isAuto = false;
            this._pendingLayout = new lifecycle_1.MutableDisposable();
            this._pendingShowDetails = new lifecycle_1.MutableDisposable();
            this._ignoreFocusEvents = false;
            this._forceRenderingAbove = false;
            this._explainMode = false;
            this._showTimeout = new async_1.TimeoutTimer();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidSelect = new event_1.PauseableEmitter();
            this._onDidFocus = new event_1.PauseableEmitter();
            this._onDidHide = new event_1.Emitter();
            this._onDidShow = new event_1.Emitter();
            this.onDidSelect = this._onDidSelect.event;
            this.onDidFocus = this._onDidFocus.event;
            this.onDidHide = this._onDidHide.event;
            this.onDidShow = this._onDidShow.event;
            this._onDetailsKeydown = new event_1.Emitter();
            this.onDetailsKeyDown = this._onDetailsKeydown.event;
            this.element = new resizable_1.ResizableHTMLElement();
            this.element.domNode.classList.add('editor-widget', 'suggest-widget');
            this._contentWidget = new SuggestContentWidget(this, editor);
            this._persistedSize = new PersistedWidgetSize(_storageService, editor);
            class ResizeState {
                constructor(persistedSize, currentSize, persistHeight = false, persistWidth = false) {
                    this.persistedSize = persistedSize;
                    this.currentSize = currentSize;
                    this.persistHeight = persistHeight;
                    this.persistWidth = persistWidth;
                }
            }
            let state;
            this._disposables.add(this.element.onDidWillResize(() => {
                this._contentWidget.lockPreference();
                state = new ResizeState(this._persistedSize.restore(), this.element.size);
            }));
            this._disposables.add(this.element.onDidResize(e => {
                this._resize(e.dimension.width, e.dimension.height);
                if (state) {
                    state.persistHeight = state.persistHeight || !!e.north || !!e.south;
                    state.persistWidth = state.persistWidth || !!e.east || !!e.west;
                }
                if (!e.done) {
                    return;
                }
                if (state) {
                    // only store width or height value that have changed and also
                    // only store changes that are above a certain threshold
                    const { itemHeight, defaultSize } = this.getLayoutInfo();
                    const threshold = Math.round(itemHeight / 2);
                    let { width, height } = this.element.size;
                    if (!state.persistHeight || Math.abs(state.currentSize.height - height) <= threshold) {
                        height = state.persistedSize?.height ?? defaultSize.height;
                    }
                    if (!state.persistWidth || Math.abs(state.currentSize.width - width) <= threshold) {
                        width = state.persistedSize?.width ?? defaultSize.width;
                    }
                    this._persistedSize.store(new dom.Dimension(width, height));
                }
                // reset working state
                this._contentWidget.unlockPreference();
                state = undefined;
            }));
            this._messageElement = dom.append(this.element.domNode, dom.$('.message'));
            this._listElement = dom.append(this.element.domNode, dom.$('.tree'));
            const details = this._disposables.add(instantiationService.createInstance(suggestWidgetDetails_1.SuggestDetailsWidget, this.editor));
            details.onDidClose(this.toggleDetails, this, this._disposables);
            this._details = new suggestWidgetDetails_1.SuggestDetailsOverlay(details, this.editor);
            const applyIconStyle = () => this.element.domNode.classList.toggle('no-icons', !this.editor.getOption(118 /* EditorOption.suggest */).showIcons);
            applyIconStyle();
            const renderer = instantiationService.createInstance(suggestWidgetRenderer_1.ItemRenderer, this.editor);
            this._disposables.add(renderer);
            this._disposables.add(renderer.onDidToggleDetails(() => this.toggleDetails()));
            this._list = new listWidget_1.List('SuggestWidget', this._listElement, {
                getHeight: (_element) => this.getLayoutInfo().itemHeight,
                getTemplateId: (_element) => 'suggestion'
            }, [renderer], {
                alwaysConsumeMouseWheel: true,
                useShadows: false,
                mouseSupport: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getRole: () => 'option',
                    getWidgetAriaLabel: () => nls.localize('suggest', "Suggest"),
                    getWidgetRole: () => 'listbox',
                    getAriaLabel: (item) => {
                        let label = item.textLabel;
                        if (typeof item.completion.label !== 'string') {
                            const { detail, description } = item.completion.label;
                            if (detail && description) {
                                label = nls.localize('label.full', '{0} {1}, {2}', label, detail, description);
                            }
                            else if (detail) {
                                label = nls.localize('label.detail', '{0} {1}', label, detail);
                            }
                            else if (description) {
                                label = nls.localize('label.desc', '{0}, {1}', label, description);
                            }
                        }
                        if (!item.isResolved || !this._isDetailsVisible()) {
                            return label;
                        }
                        const { documentation, detail } = item.completion;
                        const docs = strings.format('{0}{1}', detail || '', documentation ? (typeof documentation === 'string' ? documentation : documentation.value) : '');
                        return nls.localize('ariaCurrenttSuggestionReadDetails', "{0}, docs: {1}", label, docs);
                    },
                }
            });
            this._list.style((0, defaultStyles_1.getListStyles)({
                listInactiveFocusBackground: exports.editorSuggestWidgetSelectedBackground,
                listInactiveFocusOutline: colorRegistry_1.activeContrastBorder
            }));
            this._status = instantiationService.createInstance(suggestWidgetStatus_1.SuggestWidgetStatus, this.element.domNode, suggest_1.suggestWidgetStatusbarMenu);
            const applyStatusBarStyle = () => this.element.domNode.classList.toggle('with-status-bar', this.editor.getOption(118 /* EditorOption.suggest */).showStatusBar);
            applyStatusBarStyle();
            this._disposables.add(_themeService.onDidColorThemeChange(t => this._onThemeChange(t)));
            this._onThemeChange(_themeService.getColorTheme());
            this._disposables.add(this._list.onMouseDown(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onTap(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onDidChangeSelection(e => this._onListSelection(e)));
            this._disposables.add(this._list.onDidChangeFocus(e => this._onListFocus(e)));
            this._disposables.add(this.editor.onDidChangeCursorSelection(() => this._onCursorSelectionChanged()));
            this._disposables.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(118 /* EditorOption.suggest */)) {
                    applyStatusBarStyle();
                    applyIconStyle();
                }
                if (this._completionModel && (e.hasChanged(50 /* EditorOption.fontInfo */) || e.hasChanged(119 /* EditorOption.suggestFontSize */) || e.hasChanged(120 /* EditorOption.suggestLineHeight */))) {
                    this._list.splice(0, this._list.length, this._completionModel.items);
                }
            }));
            this._ctxSuggestWidgetVisible = suggest_1.Context.Visible.bindTo(_contextKeyService);
            this._ctxSuggestWidgetDetailsVisible = suggest_1.Context.DetailsVisible.bindTo(_contextKeyService);
            this._ctxSuggestWidgetMultipleSuggestions = suggest_1.Context.MultipleSuggestions.bindTo(_contextKeyService);
            this._ctxSuggestWidgetHasFocusedSuggestion = suggest_1.Context.HasFocusedSuggestion.bindTo(_contextKeyService);
            this._disposables.add(dom.addStandardDisposableListener(this._details.widget.domNode, 'keydown', e => {
                this._onDetailsKeydown.fire(e);
            }));
            this._disposables.add(this.editor.onMouseDown((e) => this._onEditorMouseDown(e)));
        }
        dispose() {
            this._details.widget.dispose();
            this._details.dispose();
            this._list.dispose();
            this._status.dispose();
            this._disposables.dispose();
            this._loadingTimeout?.dispose();
            this._pendingLayout.dispose();
            this._pendingShowDetails.dispose();
            this._showTimeout.dispose();
            this._contentWidget.dispose();
            this.element.dispose();
        }
        _onEditorMouseDown(mouseEvent) {
            if (this._details.widget.domNode.contains(mouseEvent.target.element)) {
                // Clicking inside details
                this._details.widget.domNode.focus();
            }
            else {
                // Clicking outside details and inside suggest
                if (this.element.domNode.contains(mouseEvent.target.element)) {
                    this.editor.focus();
                }
            }
        }
        _onCursorSelectionChanged() {
            if (this._state !== 0 /* State.Hidden */) {
                this._contentWidget.layout();
            }
        }
        _onListMouseDownOrTap(e) {
            if (typeof e.element === 'undefined' || typeof e.index === 'undefined') {
                return;
            }
            // prevent stealing browser focus from the editor
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this._select(e.element, e.index);
        }
        _onListSelection(e) {
            if (e.elements.length) {
                this._select(e.elements[0], e.indexes[0]);
            }
        }
        _select(item, index) {
            const completionModel = this._completionModel;
            if (completionModel) {
                this._onDidSelect.fire({ item, index, model: completionModel });
                this.editor.focus();
            }
        }
        _onThemeChange(theme) {
            this._details.widget.borderWidth = (0, theme_1.isHighContrast)(theme.type) ? 2 : 1;
        }
        _onListFocus(e) {
            if (this._ignoreFocusEvents) {
                return;
            }
            if (!e.elements.length) {
                if (this._currentSuggestionDetails) {
                    this._currentSuggestionDetails.cancel();
                    this._currentSuggestionDetails = undefined;
                    this._focusedItem = undefined;
                }
                this.editor.setAriaOptions({ activeDescendant: undefined });
                this._ctxSuggestWidgetHasFocusedSuggestion.set(false);
                return;
            }
            if (!this._completionModel) {
                return;
            }
            this._ctxSuggestWidgetHasFocusedSuggestion.set(true);
            const item = e.elements[0];
            const index = e.indexes[0];
            if (item !== this._focusedItem) {
                this._currentSuggestionDetails?.cancel();
                this._currentSuggestionDetails = undefined;
                this._focusedItem = item;
                this._list.reveal(index);
                this._currentSuggestionDetails = (0, async_1.createCancelablePromise)(async (token) => {
                    const loading = (0, async_1.disposableTimeout)(() => {
                        if (this._isDetailsVisible()) {
                            this.showDetails(true);
                        }
                    }, 250);
                    const sub = token.onCancellationRequested(() => loading.dispose());
                    try {
                        return await item.resolve(token);
                    }
                    finally {
                        loading.dispose();
                        sub.dispose();
                    }
                });
                this._currentSuggestionDetails.then(() => {
                    if (index >= this._list.length || item !== this._list.element(index)) {
                        return;
                    }
                    // item can have extra information, so re-render
                    this._ignoreFocusEvents = true;
                    this._list.splice(index, 1, [item]);
                    this._list.setFocus([index]);
                    this._ignoreFocusEvents = false;
                    if (this._isDetailsVisible()) {
                        this.showDetails(false);
                    }
                    else {
                        this.element.domNode.classList.remove('docs-side');
                    }
                    this.editor.setAriaOptions({ activeDescendant: (0, suggestWidgetRenderer_1.getAriaId)(index) });
                }).catch(errors_1.onUnexpectedError);
            }
            // emit an event
            this._onDidFocus.fire({ item, index, model: this._completionModel });
        }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            this._state = state;
            this.element.domNode.classList.toggle('frozen', state === 4 /* State.Frozen */);
            this.element.domNode.classList.remove('message');
            switch (state) {
                case 0 /* State.Hidden */:
                    dom.hide(this._messageElement, this._listElement, this._status.element);
                    this._details.hide(true);
                    this._status.hide();
                    this._contentWidget.hide();
                    this._ctxSuggestWidgetVisible.reset();
                    this._ctxSuggestWidgetMultipleSuggestions.reset();
                    this._ctxSuggestWidgetHasFocusedSuggestion.reset();
                    this._showTimeout.cancel();
                    this.element.domNode.classList.remove('visible');
                    this._list.splice(0, this._list.length);
                    this._focusedItem = undefined;
                    this._cappedHeight = undefined;
                    this._explainMode = false;
                    break;
                case 1 /* State.Loading */:
                    this.element.domNode.classList.add('message');
                    this._messageElement.textContent = SuggestWidget_1.LOADING_MESSAGE;
                    dom.hide(this._listElement, this._status.element);
                    dom.show(this._messageElement);
                    this._details.hide();
                    this._show();
                    this._focusedItem = undefined;
                    (0, aria_1.status)(SuggestWidget_1.LOADING_MESSAGE);
                    break;
                case 2 /* State.Empty */:
                    this.element.domNode.classList.add('message');
                    this._messageElement.textContent = SuggestWidget_1.NO_SUGGESTIONS_MESSAGE;
                    dom.hide(this._listElement, this._status.element);
                    dom.show(this._messageElement);
                    this._details.hide();
                    this._show();
                    this._focusedItem = undefined;
                    (0, aria_1.status)(SuggestWidget_1.NO_SUGGESTIONS_MESSAGE);
                    break;
                case 3 /* State.Open */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._show();
                    break;
                case 4 /* State.Frozen */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._show();
                    break;
                case 5 /* State.Details */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._details.show();
                    this._show();
                    break;
            }
        }
        _show() {
            this._status.show();
            this._contentWidget.show();
            this._layout(this._persistedSize.restore());
            this._ctxSuggestWidgetVisible.set(true);
            this._showTimeout.cancelAndSet(() => {
                this.element.domNode.classList.add('visible');
                this._onDidShow.fire(this);
            }, 100);
        }
        showTriggered(auto, delay) {
            if (this._state !== 0 /* State.Hidden */) {
                return;
            }
            this._contentWidget.setPosition(this.editor.getPosition());
            this._isAuto = !!auto;
            if (!this._isAuto) {
                this._loadingTimeout = (0, async_1.disposableTimeout)(() => this._setState(1 /* State.Loading */), delay);
            }
        }
        showSuggestions(completionModel, selectionIndex, isFrozen, isAuto, noFocus) {
            this._contentWidget.setPosition(this.editor.getPosition());
            this._loadingTimeout?.dispose();
            this._currentSuggestionDetails?.cancel();
            this._currentSuggestionDetails = undefined;
            if (this._completionModel !== completionModel) {
                this._completionModel = completionModel;
            }
            if (isFrozen && this._state !== 2 /* State.Empty */ && this._state !== 0 /* State.Hidden */) {
                this._setState(4 /* State.Frozen */);
                return;
            }
            const visibleCount = this._completionModel.items.length;
            const isEmpty = visibleCount === 0;
            this._ctxSuggestWidgetMultipleSuggestions.set(visibleCount > 1);
            if (isEmpty) {
                this._setState(isAuto ? 0 /* State.Hidden */ : 2 /* State.Empty */);
                this._completionModel = undefined;
                return;
            }
            this._focusedItem = undefined;
            // calling list.splice triggers focus event which this widget forwards. That can lead to
            // suggestions being cancelled and the widget being cleared (and hidden). All this happens
            // before revealing and focusing is done which means revealing and focusing will fail when
            // they get run.
            this._onDidFocus.pause();
            this._onDidSelect.pause();
            try {
                this._list.splice(0, this._list.length, this._completionModel.items);
                this._setState(isFrozen ? 4 /* State.Frozen */ : 3 /* State.Open */);
                this._list.reveal(selectionIndex, 0);
                this._list.setFocus(noFocus ? [] : [selectionIndex]);
            }
            finally {
                this._onDidFocus.resume();
                this._onDidSelect.resume();
            }
            this._pendingLayout.value = dom.runAtThisOrScheduleAtNextAnimationFrame(dom.getWindow(this.element.domNode), () => {
                this._pendingLayout.clear();
                this._layout(this.element.size);
                // Reset focus border
                this._details.widget.domNode.classList.remove('focused');
            });
        }
        focusSelected() {
            if (this._list.length > 0) {
                this._list.setFocus([0]);
            }
        }
        selectNextPage() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.pageDown();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusNextPage();
                    return true;
            }
        }
        selectNext() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusNext(1, true);
                    return true;
            }
        }
        selectLast() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.scrollBottom();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusLast();
                    return true;
            }
        }
        selectPreviousPage() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.pageUp();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusPreviousPage();
                    return true;
            }
        }
        selectPrevious() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusPrevious(1, true);
                    return false;
            }
        }
        selectFirst() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.scrollTop();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusFirst();
                    return true;
            }
        }
        getFocusedItem() {
            if (this._state !== 0 /* State.Hidden */
                && this._state !== 2 /* State.Empty */
                && this._state !== 1 /* State.Loading */
                && this._completionModel
                && this._list.getFocus().length > 0) {
                return {
                    item: this._list.getFocusedElements()[0],
                    index: this._list.getFocus()[0],
                    model: this._completionModel
                };
            }
            return undefined;
        }
        toggleDetailsFocus() {
            if (this._state === 5 /* State.Details */) {
                this._setState(3 /* State.Open */);
                this._details.widget.domNode.classList.remove('focused');
            }
            else if (this._state === 3 /* State.Open */ && this._isDetailsVisible()) {
                this._setState(5 /* State.Details */);
                this._details.widget.domNode.classList.add('focused');
            }
        }
        toggleDetails() {
            if (this._isDetailsVisible()) {
                // hide details widget
                this._pendingShowDetails.clear();
                this._ctxSuggestWidgetDetailsVisible.set(false);
                this._setDetailsVisible(false);
                this._details.hide();
                this.element.domNode.classList.remove('shows-details');
            }
            else if (((0, suggestWidgetDetails_1.canExpandCompletionItem)(this._list.getFocusedElements()[0]) || this._explainMode) && (this._state === 3 /* State.Open */ || this._state === 5 /* State.Details */ || this._state === 4 /* State.Frozen */)) {
                // show details widget (iff possible)
                this._ctxSuggestWidgetDetailsVisible.set(true);
                this._setDetailsVisible(true);
                this.showDetails(false);
            }
        }
        showDetails(loading) {
            this._pendingShowDetails.value = dom.runAtThisOrScheduleAtNextAnimationFrame(dom.getWindow(this.element.domNode), () => {
                this._pendingShowDetails.clear();
                this._details.show();
                if (loading) {
                    this._details.widget.renderLoading();
                }
                else {
                    this._details.widget.renderItem(this._list.getFocusedElements()[0], this._explainMode);
                }
                if (!this._details.widget.isEmpty) {
                    this._positionDetails();
                    this.element.domNode.classList.add('shows-details');
                }
                else {
                    this._details.hide();
                }
                this.editor.focus();
            });
        }
        toggleExplainMode() {
            if (this._list.getFocusedElements()[0]) {
                this._explainMode = !this._explainMode;
                if (!this._isDetailsVisible()) {
                    this.toggleDetails();
                }
                else {
                    this.showDetails(false);
                }
            }
        }
        resetPersistedSize() {
            this._persistedSize.reset();
        }
        hideWidget() {
            this._pendingLayout.clear();
            this._pendingShowDetails.clear();
            this._loadingTimeout?.dispose();
            this._setState(0 /* State.Hidden */);
            this._onDidHide.fire(this);
            this.element.clearSashHoverState();
            // ensure that a reasonable widget height is persisted so that
            // accidential "resize-to-single-items" cases aren't happening
            const dim = this._persistedSize.restore();
            const minPersistedHeight = Math.ceil(this.getLayoutInfo().itemHeight * 4.3);
            if (dim && dim.height < minPersistedHeight) {
                this._persistedSize.store(dim.with(undefined, minPersistedHeight));
            }
        }
        isFrozen() {
            return this._state === 4 /* State.Frozen */;
        }
        _afterRender(position) {
            if (position === null) {
                if (this._isDetailsVisible()) {
                    this._details.hide(); //todo@jrieken soft-hide
                }
                return;
            }
            if (this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */) {
                // no special positioning when widget isn't showing list
                return;
            }
            if (this._isDetailsVisible() && !this._details.widget.isEmpty) {
                this._details.show();
            }
            this._positionDetails();
        }
        _layout(size) {
            if (!this.editor.hasModel()) {
                return;
            }
            if (!this.editor.getDomNode()) {
                // happens when running tests
                return;
            }
            const bodyBox = dom.getClientArea(this.element.domNode.ownerDocument.body);
            const info = this.getLayoutInfo();
            if (!size) {
                size = info.defaultSize;
            }
            let height = size.height;
            let width = size.width;
            // status bar
            this._status.element.style.height = `${info.itemHeight}px`;
            if (this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */) {
                // showing a message only
                height = info.itemHeight + info.borderHeight;
                width = info.defaultSize.width / 2;
                this.element.enableSashes(false, false, false, false);
                this.element.minSize = this.element.maxSize = new dom.Dimension(width, height);
                this._contentWidget.setPreference(2 /* ContentWidgetPositionPreference.BELOW */);
            }
            else {
                // showing items
                // width math
                const maxWidth = bodyBox.width - info.borderHeight - 2 * info.horizontalPadding;
                if (width > maxWidth) {
                    width = maxWidth;
                }
                const preferredWidth = this._completionModel ? this._completionModel.stats.pLabelLen * info.typicalHalfwidthCharacterWidth : width;
                // height math
                const fullHeight = info.statusBarHeight + this._list.contentHeight + info.borderHeight;
                const minHeight = info.itemHeight + info.statusBarHeight;
                const editorBox = dom.getDomNodePagePosition(this.editor.getDomNode());
                const cursorBox = this.editor.getScrolledVisiblePosition(this.editor.getPosition());
                const cursorBottom = editorBox.top + cursorBox.top + cursorBox.height;
                const maxHeightBelow = Math.min(bodyBox.height - cursorBottom - info.verticalPadding, fullHeight);
                const availableSpaceAbove = editorBox.top + cursorBox.top - info.verticalPadding;
                const maxHeightAbove = Math.min(availableSpaceAbove, fullHeight);
                let maxHeight = Math.min(Math.max(maxHeightAbove, maxHeightBelow) + info.borderHeight, fullHeight);
                if (height === this._cappedHeight?.capped) {
                    // Restore the old (wanted) height when the current
                    // height is capped to fit
                    height = this._cappedHeight.wanted;
                }
                if (height < minHeight) {
                    height = minHeight;
                }
                if (height > maxHeight) {
                    height = maxHeight;
                }
                const forceRenderingAboveRequiredSpace = 150;
                if (height > maxHeightBelow || (this._forceRenderingAbove && availableSpaceAbove > forceRenderingAboveRequiredSpace)) {
                    this._contentWidget.setPreference(1 /* ContentWidgetPositionPreference.ABOVE */);
                    this.element.enableSashes(true, true, false, false);
                    maxHeight = maxHeightAbove;
                }
                else {
                    this._contentWidget.setPreference(2 /* ContentWidgetPositionPreference.BELOW */);
                    this.element.enableSashes(false, true, true, false);
                    maxHeight = maxHeightBelow;
                }
                this.element.preferredSize = new dom.Dimension(preferredWidth, info.defaultSize.height);
                this.element.maxSize = new dom.Dimension(maxWidth, maxHeight);
                this.element.minSize = new dom.Dimension(220, minHeight);
                // Know when the height was capped to fit and remember
                // the wanted height for later. This is required when going
                // left to widen suggestions.
                this._cappedHeight = height === fullHeight
                    ? { wanted: this._cappedHeight?.wanted ?? size.height, capped: height }
                    : undefined;
            }
            this._resize(width, height);
        }
        _resize(width, height) {
            const { width: maxWidth, height: maxHeight } = this.element.maxSize;
            width = Math.min(maxWidth, width);
            height = Math.min(maxHeight, height);
            const { statusBarHeight } = this.getLayoutInfo();
            this._list.layout(height - statusBarHeight, width);
            this._listElement.style.height = `${height - statusBarHeight}px`;
            this.element.layout(height, width);
            this._contentWidget.layout();
            this._positionDetails();
        }
        _positionDetails() {
            if (this._isDetailsVisible()) {
                this._details.placeAtAnchor(this.element.domNode, this._contentWidget.getPosition()?.preference[0] === 2 /* ContentWidgetPositionPreference.BELOW */);
            }
        }
        getLayoutInfo() {
            const fontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            const itemHeight = (0, numbers_1.clamp)(this.editor.getOption(120 /* EditorOption.suggestLineHeight */) || fontInfo.lineHeight, 8, 1000);
            const statusBarHeight = !this.editor.getOption(118 /* EditorOption.suggest */).showStatusBar || this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */ ? 0 : itemHeight;
            const borderWidth = this._details.widget.borderWidth;
            const borderHeight = 2 * borderWidth;
            return {
                itemHeight,
                statusBarHeight,
                borderWidth,
                borderHeight,
                typicalHalfwidthCharacterWidth: fontInfo.typicalHalfwidthCharacterWidth,
                verticalPadding: 22,
                horizontalPadding: 14,
                defaultSize: new dom.Dimension(430, statusBarHeight + 12 * itemHeight + borderHeight)
            };
        }
        _isDetailsVisible() {
            return this._storageService.getBoolean('expandSuggestionDocs', 0 /* StorageScope.PROFILE */, false);
        }
        _setDetailsVisible(value) {
            this._storageService.store('expandSuggestionDocs', value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        forceRenderingAbove() {
            if (!this._forceRenderingAbove) {
                this._forceRenderingAbove = true;
                this._layout(this._persistedSize.restore());
            }
        }
        stopForceRenderingAbove() {
            this._forceRenderingAbove = false;
        }
    };
    exports.SuggestWidget = SuggestWidget;
    exports.SuggestWidget = SuggestWidget = SuggestWidget_1 = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService)
    ], SuggestWidget);
    class SuggestContentWidget {
        constructor(_widget, _editor) {
            this._widget = _widget;
            this._editor = _editor;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._preferenceLocked = false;
            this._added = false;
            this._hidden = false;
        }
        dispose() {
            if (this._added) {
                this._added = false;
                this._editor.removeContentWidget(this);
            }
        }
        getId() {
            return 'editor.widget.suggestWidget';
        }
        getDomNode() {
            return this._widget.element.domNode;
        }
        show() {
            this._hidden = false;
            if (!this._added) {
                this._added = true;
                this._editor.addContentWidget(this);
            }
        }
        hide() {
            if (!this._hidden) {
                this._hidden = true;
                this.layout();
            }
        }
        layout() {
            this._editor.layoutContentWidget(this);
        }
        getPosition() {
            if (this._hidden || !this._position || !this._preference) {
                return null;
            }
            return {
                position: this._position,
                preference: [this._preference]
            };
        }
        beforeRender() {
            const { height, width } = this._widget.element.size;
            const { borderWidth, horizontalPadding } = this._widget.getLayoutInfo();
            return new dom.Dimension(width + 2 * borderWidth + horizontalPadding, height + 2 * borderWidth);
        }
        afterRender(position) {
            this._widget._afterRender(position);
        }
        setPreference(preference) {
            if (!this._preferenceLocked) {
                this._preference = preference;
            }
        }
        lockPreference() {
            this._preferenceLocked = true;
        }
        unlockPreference() {
            this._preferenceLocked = false;
        }
        setPosition(position) {
            this._position = position;
        }
    }
    exports.SuggestContentWidget = SuggestContentWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci9zdWdnZXN0V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtQ2hHOztPQUVHO0lBQ0gsSUFBQSw2QkFBYSxFQUFDLGdDQUFnQyxFQUFFLEVBQUUsSUFBSSxFQUFFLHNDQUFzQixFQUFFLEtBQUssRUFBRSxzQ0FBc0IsRUFBRSxNQUFNLEVBQUUsc0NBQXNCLEVBQUUsT0FBTyxFQUFFLHNDQUFzQixFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDLENBQUM7SUFDNVEsSUFBQSw2QkFBYSxFQUFDLDRCQUE0QixFQUFFLEVBQUUsSUFBSSxFQUFFLGtDQUFrQixFQUFFLEtBQUssRUFBRSxrQ0FBa0IsRUFBRSxNQUFNLEVBQUUsa0NBQWtCLEVBQUUsT0FBTyxFQUFFLGtDQUFrQixFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDLENBQUM7SUFDaFAsTUFBTSw2QkFBNkIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsZ0NBQWdDLEVBQUUsRUFBRSxJQUFJLEVBQUUsZ0NBQWdCLEVBQUUsS0FBSyxFQUFFLGdDQUFnQixFQUFFLE1BQU0sRUFBRSxnQ0FBZ0IsRUFBRSxPQUFPLEVBQUUsZ0NBQWdCLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLCtCQUErQixFQUFFLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztJQUMxUixJQUFBLDZCQUFhLEVBQUMsd0NBQXdDLEVBQUUsRUFBRSxJQUFJLEVBQUUsNkNBQTZCLEVBQUUsS0FBSyxFQUFFLDZDQUE2QixFQUFF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