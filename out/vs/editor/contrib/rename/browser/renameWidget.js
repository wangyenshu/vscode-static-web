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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/hover/hoverDelegate2", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/browser/config/domFontInfo", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/nls", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./renameWidget"], function (require, exports, dom, keyboardEvent_1, aria, hoverDelegate2_1, hoverDelegateFactory_1, iconLabels_1, listWidget_1, arrays, async_1, cancellation_1, codicons_1, event_1, lifecycle_1, stopwatch_1, types_1, domFontInfo, position_1, range_1, languages_1, nls, nls_1, contextkey_1, keybinding_1, log_1, defaultStyles_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameWidget = exports.CONTEXT_RENAME_INPUT_FOCUSED = exports.CONTEXT_RENAME_INPUT_VISIBLE = void 0;
    /** for debugging */
    const _sticky = false;
    exports.CONTEXT_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('renameInputVisible', false, (0, nls_1.localize)('renameInputVisible', "Whether the rename input widget is visible"));
    exports.CONTEXT_RENAME_INPUT_FOCUSED = new contextkey_1.RawContextKey('renameInputFocused', false, (0, nls_1.localize)('renameInputFocused', "Whether the rename input widget is focused"));
    let RenameWidget = class RenameWidget {
        constructor(_editor, _acceptKeybindings, _themeService, _keybindingService, contextKeyService, _logService) {
            this._editor = _editor;
            this._acceptKeybindings = _acceptKeybindings;
            this._themeService = _themeService;
            this._keybindingService = _keybindingService;
            this._logService = _logService;
            // implement IContentWidget
            this.allowEditorOverflow = true;
            this._disposables = new lifecycle_1.DisposableStore();
            this._visibleContextKey = exports.CONTEXT_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._isEditingRenameCandidate = false;
            this._nRenameSuggestionsInvocations = 0;
            this._hadAutomaticRenameSuggestionsInvocation = false;
            this._candidates = new Set();
            this._beforeFirstInputFieldEditSW = new stopwatch_1.StopWatch();
            this._inputWithButton = new InputWithButton();
            this._disposables.add(this._inputWithButton);
            this._editor.addContentWidget(this);
            this._disposables.add(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._updateFont();
                }
            }));
            this._disposables.add(_themeService.onDidColorThemeChange(this._updateStyles, this));
        }
        dispose() {
            this._disposables.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return '__renameInputWidget';
        }
        getDomNode() {
            if (!this._domNode) {
                this._domNode = document.createElement('div');
                this._domNode.className = 'monaco-editor rename-box';
                this._domNode.appendChild(this._inputWithButton.domNode);
                this._renameCandidateListView = this._disposables.add(new RenameCandidateListView(this._domNode, {
                    fontInfo: this._editor.getOption(50 /* EditorOption.fontInfo */),
                    onFocusChange: (newSymbolName) => {
                        this._inputWithButton.input.value = newSymbolName;
                        this._isEditingRenameCandidate = false; // @ulugbekna: reset
                    },
                    onSelectionChange: () => {
                        this._isEditingRenameCandidate = false; // @ulugbekna: because user picked a rename suggestion
                        this.acceptInput(false); // we don't allow preview with mouse click for now
                    }
                }));
                this._disposables.add(this._inputWithButton.onDidInputChange(() => {
                    if (this._renameCandidateListView?.focusedCandidate !== undefined) {
                        this._isEditingRenameCandidate = true;
                    }
                    this._timeBeforeFirstInputFieldEdit ??= this._beforeFirstInputFieldEditSW.elapsed();
                    if (this._renameCandidateProvidersCts?.token.isCancellationRequested === false) {
                        this._renameCandidateProvidersCts.cancel();
                    }
                    this._renameCandidateListView?.clearFocus();
                }));
                this._label = document.createElement('div');
                this._label.className = 'rename-label';
                this._domNode.appendChild(this._label);
                this._updateFont();
                this._updateStyles(this._themeService.getColorTheme());
            }
            return this._domNode;
        }
        _updateStyles(theme) {
            if (!this._domNode) {
                return;
            }
            const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
            const widgetBorderColor = theme.getColor(colorRegistry_1.widgetBorder);
            this._domNode.style.backgroundColor = String(theme.getColor(colorRegistry_1.editorWidgetBackground) ?? '');
            this._domNode.style.boxShadow = widgetShadowColor ? ` 0 0 8px 2px ${widgetShadowColor}` : '';
            this._domNode.style.border = widgetBorderColor ? `1px solid ${widgetBorderColor}` : '';
            this._domNode.style.color = String(theme.getColor(colorRegistry_1.inputForeground) ?? '');
            const border = theme.getColor(colorRegistry_1.inputBorder);
            this._inputWithButton.domNode.style.backgroundColor = String(theme.getColor(colorRegistry_1.inputBackground) ?? '');
            this._inputWithButton.input.style.backgroundColor = String(theme.getColor(colorRegistry_1.inputBackground) ?? '');
            this._inputWithButton.domNode.style.borderWidth = border ? '1px' : '0px';
            this._inputWithButton.domNode.style.borderStyle = border ? 'solid' : 'none';
            this._inputWithButton.domNode.style.borderColor = border?.toString() ?? 'none';
        }
        _updateFont() {
            if (this._domNode === undefined) {
                return;
            }
            (0, types_1.assertType)(this._label !== undefined, 'RenameWidget#_updateFont: _label must not be undefined given _domNode is defined');
            this._editor.applyFontInfo(this._inputWithButton.input);
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            this._label.style.fontSize = `${this._computeLabelFontSize(fontInfo.fontSize)}px`;
        }
        _computeLabelFontSize(editorFontSize) {
            return editorFontSize * 0.8;
        }
        getPosition() {
            if (!this._visible) {
                return null;
            }
            if (!this._editor.hasModel() || // @ulugbekna: shouldn't happen
                !this._editor.getDomNode() // @ulugbekna: can happen during tests based on suggestWidget's similar predicate check
            ) {
                return null;
            }
            const bodyBox = dom.getClientArea(this.getDomNode().ownerDocument.body);
            const editorBox = dom.getDomNodePagePosition(this._editor.getDomNode());
            const cursorBoxTop = this._getTopForPosition();
            this._nPxAvailableAbove = cursorBoxTop + editorBox.top;
            this._nPxAvailableBelow = bodyBox.height - this._nPxAvailableAbove;
            const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            const { totalHeight: candidateViewHeight } = RenameCandidateView.getLayoutInfo({ lineHeight });
            const positionPreference = this._nPxAvailableBelow > candidateViewHeight * 6 /* approximate # of candidates to fit in (inclusive of rename input box & rename label) */
                ? [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */]
                : [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */];
            return {
                position: this._position,
                preference: positionPreference,
            };
        }
        beforeRender() {
            const [accept, preview] = this._acceptKeybindings;
            this._label.innerText = (0, nls_1.localize)({ key: 'label', comment: ['placeholders are keybindings, e.g "F2 to Rename, Shift+F2 to Preview"'] }, "{0} to Rename, {1} to Preview", this._keybindingService.lookupKeybinding(accept)?.getLabel(), this._keybindingService.lookupKeybinding(preview)?.getLabel());
            this._domNode.style.minWidth = `200px`; // to prevent from widening when candidates come in
            return null;
        }
        afterRender(position) {
            this._trace('invoking afterRender, position: ', position ? 'not null' : 'null');
            if (position === null) {
                // cancel rename when input widget isn't rendered anymore
                this.cancelInput(true, 'afterRender (because position is null)');
                return;
            }
            if (!this._editor.hasModel() || // shouldn't happen
                !this._editor.getDomNode() // can happen during tests based on suggestWidget's similar predicate check
            ) {
                return;
            }
            (0, types_1.assertType)(this._renameCandidateListView);
            (0, types_1.assertType)(this._nPxAvailableAbove !== undefined);
            (0, types_1.assertType)(this._nPxAvailableBelow !== undefined);
            const inputBoxHeight = dom.getTotalHeight(this._inputWithButton.domNode);
            const labelHeight = dom.getTotalHeight(this._label);
            let totalHeightAvailable;
            if (position === 2 /* ContentWidgetPositionPreference.BELOW */) {
                totalHeightAvailable = this._nPxAvailableBelow;
            }
            else {
                totalHeightAvailable = this._nPxAvailableAbove;
            }
            this._renameCandidateListView.layout({
                height: totalHeightAvailable - labelHeight - inputBoxHeight,
                width: dom.getTotalWidth(this._inputWithButton.domNode),
            });
        }
        acceptInput(wantsPreview) {
            this._trace(`invoking acceptInput`);
            this._currentAcceptInput?.(wantsPreview);
        }
        cancelInput(focusEditor, caller) {
            this._trace(`invoking cancelInput, caller: ${caller}, _currentCancelInput: ${this._currentAcceptInput ? 'not undefined' : 'undefined'}`);
            this._currentCancelInput?.(focusEditor);
        }
        focusNextRenameSuggestion() {
            if (!this._renameCandidateListView?.focusNext()) {
                this._inputWithButton.input.value = this._currentName;
            }
        }
        focusPreviousRenameSuggestion() {
            if (!this._renameCandidateListView?.focusPrevious()) {
                this._inputWithButton.input.value = this._currentName;
            }
        }
        /**
         * @param requestRenameCandidates is `undefined` when there are no rename suggestion providers
         */
        getInput(where, currentName, supportPreview, requestRenameCandidates, cts) {
            const { start: selectionStart, end: selectionEnd } = this._getSelection(where, currentName);
            this._renameCts = cts;
            const disposeOnDone = new lifecycle_1.DisposableStore();
            this._nRenameSuggestionsInvocations = 0;
            this._hadAutomaticRenameSuggestionsInvocation = false;
            if (requestRenameCandidates === undefined) {
                this._inputWithButton.button.style.display = 'none';
            }
            else {
                this._inputWithButton.button.style.display = 'flex';
                this._requestRenameCandidatesOnce = requestRenameCandidates;
                this._requestRenameCandidates(currentName, false);
                disposeOnDone.add(dom.addDisposableListener(this._inputWithButton.button, 'click', () => this._requestRenameCandidates(currentName, true)));
                disposeOnDone.add(dom.addDisposableListener(this._inputWithButton.button, dom.EventType.KEY_DOWN, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (keyEvent.equals(3 /* KeyCode.Enter */) || keyEvent.equals(10 /* KeyCode.Space */)) {
                        keyEvent.stopPropagation();
                        keyEvent.preventDefault();
                        this._requestRenameCandidates(currentName, true);
                    }
                }));
            }
            this._isEditingRenameCandidate = false;
            this._domNode.classList.toggle('preview', supportPreview);
            this._position = new position_1.Position(where.startLineNumber, where.startColumn);
            this._currentName = currentName;
            this._inputWithButton.input.value = currentName;
            this._inputWithButton.input.setAttribute('selectionStart', selectionStart.toString());
            this._inputWithButton.input.setAttribute('selectionEnd', selectionEnd.toString());
            this._inputWithButton.input.size = Math.max((where.endColumn - where.startColumn) * 1.1, 20); // determines width
            this._beforeFirstInputFieldEditSW.reset();
            disposeOnDone.add((0, lifecycle_1.toDisposable)(() => {
                this._renameCts = undefined;
                cts.dispose(true);
            })); // @ulugbekna: this may result in `this.cancelInput` being called twice, but it should be safe since we set it to undefined after 1st call
            disposeOnDone.add((0, lifecycle_1.toDisposable)(() => {
                if (this._renameCandidateProvidersCts !== undefined) {
                    this._renameCandidateProvidersCts.dispose(true);
                    this._renameCandidateProvidersCts = undefined;
                }
            }));
            disposeOnDone.add((0, lifecycle_1.toDisposable)(() => this._candidates.clear()));
            const inputResult = new async_1.DeferredPromise();
            inputResult.p.finally(() => {
                disposeOnDone.dispose();
                this._hide();
            });
            this._currentCancelInput = (focusEditor) => {
                this._trace('invoking _currentCancelInput');
                this._currentAcceptInput = undefined;
                this._currentCancelInput = undefined;
                // fixme session cleanup
                this._renameCandidateListView?.clearCandidates();
                inputResult.complete(focusEditor);
                return true;
            };
            this._currentAcceptInput = (wantsPreview) => {
                this._trace('invoking _currentAcceptInput');
                (0, types_1.assertType)(this._renameCandidateListView !== undefined);
                const nRenameSuggestions = this._renameCandidateListView.nCandidates;
                let newName;
                let source;
                const focusedCandidate = this._renameCandidateListView.focusedCandidate;
                if (focusedCandidate !== undefined) {
                    this._trace('using new name from renameSuggestion');
                    newName = focusedCandidate;
                    source = { k: 'renameSuggestion' };
                }
                else {
                    this._trace('using new name from inputField');
                    newName = this._inputWithButton.input.value;
                    source = this._isEditingRenameCandidate ? { k: 'userEditedRenameSuggestion' } : { k: 'inputField' };
                }
                if (newName === currentName || newName.trim().length === 0 /* is just whitespace */) {
                    this.cancelInput(true, '_currentAcceptInput (because newName === value || newName.trim().length === 0)');
                    return;
                }
                this._currentAcceptInput = undefined;
                this._currentCancelInput = undefined;
                this._renameCandidateListView.clearCandidates();
                // fixme session cleanup
                inputResult.complete({
                    newName,
                    wantsPreview: supportPreview && wantsPreview,
                    stats: {
                        source,
                        nRenameSuggestions,
                        timeBeforeFirstInputFieldEdit: this._timeBeforeFirstInputFieldEdit,
                        nRenameSuggestionsInvocations: this._nRenameSuggestionsInvocations,
                        hadAutomaticRenameSuggestionsInvocation: this._hadAutomaticRenameSuggestionsInvocation,
                    }
                });
            };
            disposeOnDone.add(cts.token.onCancellationRequested(() => this.cancelInput(true, 'cts.token.onCancellationRequested')));
            if (!_sticky) {
                disposeOnDone.add(this._editor.onDidBlurEditorWidget(() => this.cancelInput(!this._domNode?.ownerDocument.hasFocus(), 'editor.onDidBlurEditorWidget')));
            }
            this._show();
            return inputResult.p;
        }
        _requestRenameCandidates(currentName, isManuallyTriggered) {
            if (this._requestRenameCandidatesOnce === undefined) {
                return;
            }
            if (this._renameCandidateProvidersCts !== undefined) {
                this._renameCandidateProvidersCts.dispose(true);
            }
            (0, types_1.assertType)(this._renameCts);
            if (this._inputWithButton.buttonState !== 'stop') {
                this._renameCandidateProvidersCts = new cancellation_1.CancellationTokenSource();
                const triggerKind = isManuallyTriggered ? languages_1.NewSymbolNameTriggerKind.Invoke : languages_1.NewSymbolNameTriggerKind.Automatic;
                const candidates = this._requestRenameCandidatesOnce(triggerKind, this._renameCandidateProvidersCts.token);
                if (candidates.length === 0) {
                    this._inputWithButton.setSparkleButton();
                    return;
                }
                if (!isManuallyTriggered) {
                    this._hadAutomaticRenameSuggestionsInvocation = true;
                }
                this._nRenameSuggestionsInvocations += 1;
                this._inputWithButton.setStopButton();
                this._updateRenameCandidates(candidates, currentName, this._renameCts.token);
            }
        }
        /**
         * This allows selecting only part of the symbol name in the input field based on the selection in the editor
         */
        _getSelection(where, currentName) {
            (0, types_1.assertType)(this._editor.hasModel());
            const selection = this._editor.getSelection();
            let start = 0;
            let end = currentName.length;
            if (!range_1.Range.isEmpty(selection) && !range_1.Range.spansMultipleLines(selection) && range_1.Range.containsRange(where, selection)) {
                start = Math.max(0, selection.startColumn - where.startColumn);
                end = Math.min(where.endColumn, selection.endColumn) - where.startColumn;
            }
            return { start, end };
        }
        _show() {
            this._trace('invoking _show');
            this._editor.revealLineInCenterIfOutsideViewport(this._position.lineNumber, 0 /* ScrollType.Smooth */);
            this._visible = true;
            this._visibleContextKey.set(true);
            this._editor.layoutContentWidget(this);
            // TODO@ulugbekna: could this be simply run in `afterRender`?
            setTimeout(() => {
                this._inputWithButton.input.focus();
                this._inputWithButton.input.setSelectionRange(parseInt(this._inputWithButton.input.getAttribute('selectionStart')), parseInt(this._inputWithButton.input.getAttribute('selectionEnd')));
            }, 100);
        }
        async _updateRenameCandidates(candidates, currentName, token) {
            const trace = (...args) => this._trace('_updateRenameCandidates', ...args);
            trace('start');
            const namesListResults = await (0, async_1.raceCancellation)(Promise.allSettled(candidates), token);
            this._inputWithButton.setSparkleButton();
            if (namesListResults === undefined) {
                trace('returning early - received updateRenameCandidates results - undefined');
                return;
            }
            const newNames = namesListResults.flatMap(namesListResult => namesListResult.status === 'fulfilled' && (0, types_1.isDefined)(namesListResult.value)
                ? namesListResult.value
                : []);
            trace(`received updateRenameCandidates results - total (unfiltered) ${newNames.length} candidates.`);
            // deduplicate and filter out the current value
            const distinctNames = arrays.distinct(newNames, v => v.newSymbolName);
            trace(`distinct candidates - ${distinctNames.length} candidates.`);
            const validDistinctNames = distinctNames.filter(({ newSymbolName }) => newSymbolName.trim().length > 0 && newSymbolName !== this._inputWithButton.input.value && newSymbolName !== currentName && !this._candidates.has(newSymbolName));
            trace(`valid distinct candidates - ${newNames.length} candidates.`);
            validDistinctNames.forEach(n => this._candidates.add(n.newSymbolName));
            if (validDistinctNames.length < 1) {
                trace('returning early - no valid distinct candidates');
                return;
            }
            // show the candidates
            trace('setting candidates');
            this._renameCandidateListView.setCandidates(validDistinctNames);
            // ask editor to re-layout given that the widget is now of a different size after rendering rename candidates
            trace('asking editor to re-layout');
            this._editor.layoutContentWidget(this);
        }
        _hide() {
            this._trace('invoked _hide');
            this._visible = false;
            this._visibleContextKey.reset();
            this._editor.layoutContentWidget(this);
        }
        _getTopForPosition() {
            const visibleRanges = this._editor.getVisibleRanges();
            let firstLineInViewport;
            if (visibleRanges.length > 0) {
                firstLineInViewport = visibleRanges[0].startLineNumber;
            }
            else {
                this._logService.warn('RenameWidget#_getTopForPosition: this should not happen - visibleRanges is empty');
                firstLineInViewport = Math.max(1, this._position.lineNumber - 5); // @ulugbekna: fallback to current line minus 5
            }
            return this._editor.getTopForLineNumber(this._position.lineNumber) - this._editor.getTopForLineNumber(firstLineInViewport);
        }
        _trace(...args) {
            this._logService.trace('RenameWidget', ...args);
        }
    };
    exports.RenameWidget = RenameWidget;
    exports.RenameWidget = RenameWidget = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, log_1.ILogService)
    ], RenameWidget);
    class RenameCandidateListView {
        // FIXME@ulugbekna: rewrite using event emitters
        constructor(parent, opts) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._availableHeight = 0;
            this._minimumWidth = 0;
            this._lineHeight = opts.fontInfo.lineHeight;
            this._typicalHalfwidthCharacterWidth = opts.fontInfo.typicalHalfwidthCharacterWidth;
            this._listContainer = document.createElement('div');
            this._listContainer.className = 'rename-box rename-candidate-list-container';
            parent.appendChild(this._listContainer);
            this._listWidget = RenameCandidateListView._createListWidget(this._listContainer, this._candidateViewHeight, opts.fontInfo);
            this._listWidget.onDidChangeFocus(e => {
                if (e.elements.length === 1) {
                    opts.onFocusChange(e.elements[0].newSymbolName);
                }
            }, this._disposables);
            this._listWidget.onDidChangeSelection(e => {
                if (e.elements.length === 1) {
                    opts.onSelectionChange();
                }
            }, this._disposables);
            this._disposables.add(this._listWidget.onDidBlur(e => {
                this._listWidget.setFocus([]);
            }));
            this._listWidget.style((0, defaultStyles_1.getListStyles)({
                listInactiveFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                listInactiveFocusBackground: colorRegistry_1.quickInputListFocusBackground,
            }));
        }
        dispose() {
            this._listWidget.dispose();
            this._disposables.dispose();
        }
        // height - max height allowed by parent element
        layout({ height, width }) {
            this._availableHeight = height;
            this._minimumWidth = width;
        }
        setCandidates(candidates) {
            // insert candidates into list widget
            this._listWidget.splice(0, 0, candidates);
            // adjust list widget layout
            const height = this._pickListHeight(this._listWidget.length);
            const width = this._pickListWidth(candidates);
            this._listWidget.layout(height, width);
            // adjust list container layout
            this._listContainer.style.height = `${height}px`;
            this._listContainer.style.width = `${width}px`;
            aria.status((0, nls_1.localize)('renameSuggestionsReceivedAria', "Received {0} rename suggestions", candidates.length));
        }
        clearCandidates() {
            this._listContainer.style.height = '0px';
            this._listContainer.style.width = '0px';
            this._listWidget.splice(0, this._listWidget.length, []);
        }
        get nCandidates() {
            return this._listWidget.length;
        }
        get focusedCandidate() {
            if (this._listWidget.length === 0) {
                return;
            }
            const selectedElement = this._listWidget.getSelectedElements()[0];
            if (selectedElement !== undefined) {
                return selectedElement.newSymbolName;
            }
            const focusedElement = this._listWidget.getFocusedElements()[0];
            if (focusedElement !== undefined) {
                return focusedElement.newSymbolName;
            }
            return;
        }
        focusNext() {
            if (this._listWidget.length === 0) {
                return false;
            }
            const focusedIxs = this._listWidget.getFocus();
            if (focusedIxs.length === 0) {
                this._listWidget.focusFirst();
                this._listWidget.reveal(0);
                return true;
            }
            else {
                if (focusedIxs[0] === this._listWidget.length - 1) {
                    this._listWidget.setFocus([]);
                    this._listWidget.reveal(0); // @ulugbekna: without this, it seems like focused element is obstructed
                    return false;
                }
                else {
                    this._listWidget.focusNext();
                    const focused = this._listWidget.getFocus()[0];
                    this._listWidget.reveal(focused);
                    return true;
                }
            }
        }
        /**
         * @returns true if focus is moved to previous element
         */
        focusPrevious() {
            if (this._listWidget.length === 0) {
                return false;
            }
            const focusedIxs = this._listWidget.getFocus();
            if (focusedIxs.length === 0) {
                this._listWidget.focusLast();
                const focused = this._listWidget.getFocus()[0];
                this._listWidget.reveal(focused);
                return true;
            }
            else {
                if (focusedIxs[0] === 0) {
                    this._listWidget.setFocus([]);
                    return false;
                }
                else {
                    this._listWidget.focusPrevious();
                    const focused = this._listWidget.getFocus()[0];
                    this._listWidget.reveal(focused);
                    return true;
                }
            }
        }
        clearFocus() {
            this._listWidget.setFocus([]);
        }
        get _candidateViewHeight() {
            const { totalHeight } = RenameCandidateView.getLayoutInfo({ lineHeight: this._lineHeight });
            return totalHeight;
        }
        _pickListHeight(nCandidates) {
            const heightToFitAllCandidates = this._candidateViewHeight * nCandidates;
            const MAX_N_CANDIDATES = 7; // @ulugbekna: max # of candidates we want to show at once
            const height = Math.min(heightToFitAllCandidates, this._availableHeight, this._candidateViewHeight * MAX_N_CANDIDATES);
            return height;
        }
        _pickListWidth(candidates) {
            const longestCandidateWidth = Math.ceil(Math.max(...candidates.map(c => c.newSymbolName.length)) * this._typicalHalfwidthCharacterWidth);
            const width = Math.max(this._minimumWidth, 4 /* padding */ + 16 /* sparkle icon */ + 5 /* margin-left */ + longestCandidateWidth + 10 /* (possibly visible) scrollbar width */ // TODO@ulugbekna: approximate calc - clean this up
            );
            return width;
        }
        static _createListWidget(container, candidateViewHeight, fontInfo) {
            const virtualDelegate = new class {
                getTemplateId(element) {
                    return 'candidate';
                }
                getHeight(element) {
                    return candidateViewHeight;
                }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'candidate';
                }
                renderTemplate(container) {
                    return new RenameCandidateView(container, fontInfo);
                }
                renderElement(candidate, index, templateData) {
                    templateData.populate(candidate);
                }
                disposeTemplate(templateData) {
                    templateData.dispose();
                }
            };
            return new listWidget_1.List('NewSymbolNameCandidates', container, virtualDelegate, [renderer], {
                keyboardSupport: false, // @ulugbekna: because we handle keyboard events through proper commands & keybinding service, see `rename.ts`
                mouseSupport: true,
                multipleSelectionSupport: false,
            });
        }
    }
    class InputWithButton {
        constructor() {
            this._onDidInputChange = new event_1.Emitter();
            this.onDidInputChange = this._onDidInputChange.event;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        get domNode() {
            if (!this._domNode) {
                this._domNode = document.createElement('div');
                this._domNode.className = 'rename-input-with-button';
                this._domNode.style.display = 'flex';
                this._domNode.style.flexDirection = 'row';
                this._domNode.style.alignItems = 'center';
                this._inputNode = document.createElement('input');
                this._inputNode.className = 'rename-input';
                this._inputNode.type = 'text';
                this._inputNode.style.border = 'none';
                this._inputNode.setAttribute('aria-label', (0, nls_1.localize)('renameAriaLabel', "Rename input. Type new name and press Enter to commit."));
                this._domNode.appendChild(this._inputNode);
                this._buttonNode = document.createElement('div');
                this._buttonNode.className = 'rename-suggestions-button';
                this._buttonNode.setAttribute('tabindex', '0');
                this._buttonGenHoverText = nls.localize('generateRenameSuggestionsButton', "Generate new name suggestions");
                this._buttonCancelHoverText = nls.localize('cancelRenameSuggestionsButton', "Cancel");
                this._buttonHover = (0, hoverDelegate2_1.getBaseLayerHoverDelegate)().setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), this._buttonNode, this._buttonGenHoverText);
                this._disposables.add(this._buttonHover);
                this._domNode.appendChild(this._buttonNode);
                // notify if selection changes to cancel request to rename-suggestion providers
                this._disposables.add(dom.addDisposableListener(this.input, dom.EventType.INPUT, () => this._onDidInputChange.fire()));
                this._disposables.add(dom.addDisposableListener(this.input, dom.EventType.KEY_DOWN, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (keyEvent.keyCode === 15 /* KeyCode.LeftArrow */ || keyEvent.keyCode === 17 /* KeyCode.RightArrow */) {
                        this._onDidInputChange.fire();
                    }
                }));
                this._disposables.add(dom.addDisposableListener(this.input, dom.EventType.CLICK, () => this._onDidInputChange.fire()));
                // focus "container" border instead of input box
                this._disposables.add(dom.addDisposableListener(this.input, dom.EventType.FOCUS, () => {
                    this.domNode.style.outlineWidth = '1px';
                    this.domNode.style.outlineStyle = 'solid';
                    this.domNode.style.outlineOffset = '-1px';
                    this.domNode.style.outlineColor = 'var(--vscode-focusBorder)';
                }));
                this._disposables.add(dom.addDisposableListener(this.input, dom.EventType.BLUR, () => {
                    this.domNode.style.outline = 'none';
                }));
            }
            return this._domNode;
        }
        get input() {
            (0, types_1.assertType)(this._inputNode);
            return this._inputNode;
        }
        get button() {
            (0, types_1.assertType)(this._buttonNode);
            return this._buttonNode;
        }
        get buttonState() {
            return this._buttonState;
        }
        setSparkleButton() {
            this._buttonState = 'sparkle';
            this._sparkleIcon ??= (0, iconLabels_1.renderIcon)(codicons_1.Codicon.sparkle);
            dom.clearNode(this.button);
            this.button.appendChild(this._sparkleIcon);
            this.button.setAttribute('aria-label', 'Generating new name suggestions');
            this._buttonHover?.update(this._buttonGenHoverText);
            this.input.focus();
        }
        setStopButton() {
            this._buttonState = 'stop';
            this._stopIcon ??= (0, iconLabels_1.renderIcon)(codicons_1.Codicon.primitiveSquare);
            dom.clearNode(this.button);
            this.button.appendChild(this._stopIcon);
            this.button.setAttribute('aria-label', 'Cancel generating new name suggestions');
            this._buttonHover?.update(this._buttonCancelHoverText);
            this.input.focus();
        }
        dispose() {
            this._disposables.dispose();
        }
    }
    class RenameCandidateView {
        static { this._PADDING = 2; }
        constructor(parent, fontInfo) {
            this._domNode = document.createElement('div');
            this._domNode.className = 'rename-box rename-candidate';
            this._domNode.style.display = `flex`;
            this._domNode.style.columnGap = `5px`;
            this._domNode.style.alignItems = `center`;
            this._domNode.style.height = `${fontInfo.lineHeight}px`;
            this._domNode.style.padding = `${RenameCandidateView._PADDING}px`;
            // @ulugbekna: needed to keep space when the `icon.style.display` is set to `none`
            const iconContainer = document.createElement('div');
            iconContainer.style.display = `flex`;
            iconContainer.style.alignItems = `center`;
            iconContainer.style.width = iconContainer.style.height = `${fontInfo.lineHeight * 0.8}px`;
            this._domNode.appendChild(iconContainer);
            this._icon = (0, iconLabels_1.renderIcon)(codicons_1.Codicon.sparkle);
            this._icon.style.display = `none`;
            iconContainer.appendChild(this._icon);
            this._label = document.createElement('div');
            domFontInfo.applyFontInfo(this._label, fontInfo);
            this._domNode.appendChild(this._label);
            parent.appendChild(this._domNode);
        }
        populate(value) {
            this._updateIcon(value);
            this._updateLabel(value);
        }
        _updateIcon(value) {
            const isAIGenerated = !!value.tags?.includes(languages_1.NewSymbolNameTag.AIGenerated);
            this._icon.style.display = isAIGenerated ? 'inherit' : 'none';
        }
        _updateLabel(value) {
            this._label.innerText = value.newSymbolName;
        }
        static getLayoutInfo({ lineHeight }) {
            const totalHeight = lineHeight + RenameCandidateView._PADDING * 2 /* top & bottom padding */;
            return { totalHeight };
        }
        dispose() {
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuYW1lV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcmVuYW1lL2Jyb3dzZXIvcmVuYW1lV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdEaEcsb0JBQW9CO0lBQ3BCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FFbkI7SUFHVyxRQUFBLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsNENBQTRDLENBQUMsQ0FBQyxDQUFDO0lBQ3JLLFFBQUEsNEJBQTRCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG9CQUFvQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDLENBQUM7SUFvRDNLLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQVk7UUE2Q3hCLFlBQ2tCLE9BQW9CLEVBQ3BCLGtCQUFvQyxFQUN0QyxhQUE2QyxFQUN4QyxrQkFBdUQsRUFDdkQsaUJBQXFDLEVBQzVDLFdBQXlDO1lBTHJDLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDcEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFrQjtZQUNyQixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUN2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRTdDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBakR2RCwyQkFBMkI7WUFDbEIsd0JBQW1CLEdBQVksSUFBSSxDQUFDO1lBd0M1QixpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBVXJELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxvQ0FBNEIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZ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