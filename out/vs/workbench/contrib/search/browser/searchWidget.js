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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/widget", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/editor/contrib/find/browser/findModel", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/themables", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/workbench/contrib/search/common/constants", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/base/browser/ui/toggle/toggle", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/searchEditor/browser/constants", "vs/platform/history/browser/historyWidgetKeybindingHint", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/notebook/browser/contrib/find/findFilters", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/search/browser/searchFindInput", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/common/lifecycle"], function (require, exports, dom, actionbar_1, button_1, inputBox_1, widget_1, actions_1, async_1, event_1, findModel_1, nls, clipboardService_1, configuration_1, contextkey_1, contextView_1, keybinding_1, keybindingsRegistry_1, themables_1, contextScopedHistoryWidget_1, searchActionsBase_1, Constants, accessibility_1, platform_1, toggle_1, viewsService_1, searchIcons_1, constants_1, historyWidgetKeybindingHint_1, defaultStyles_1, findFilters_1, instantiation_1, editorService_1, notebookEditorInput_1, searchFindInput_1, hoverDelegateFactory_1, lifecycle_1) {
    "use strict";
    var SearchWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchWidget = void 0;
    exports.registerContributions = registerContributions;
    /** Specified in searchview.css */
    const SingleLineInputHeight = 26;
    class ReplaceAllAction extends actions_1.Action {
        static { this.ID = 'search.action.replaceAll'; }
        constructor(_searchWidget) {
            super(ReplaceAllAction.ID, '', themables_1.ThemeIcon.asClassName(searchIcons_1.searchReplaceAllIcon), false);
            this._searchWidget = _searchWidget;
        }
        set searchWidget(searchWidget) {
            this._searchWidget = searchWidget;
        }
        run() {
            if (this._searchWidget) {
                return this._searchWidget.triggerReplaceAll();
            }
            return Promise.resolve(null);
        }
    }
    const ctrlKeyMod = (platform_1.isMacintosh ? 256 /* KeyMod.WinCtrl */ : 2048 /* KeyMod.CtrlCmd */);
    function stopPropagationForMultiLineUpwards(event, value, textarea) {
        const isMultiline = !!value.match(/\n/);
        if (textarea && (isMultiline || textarea.clientHeight > SingleLineInputHeight) && textarea.selectionStart > 0) {
            event.stopPropagation();
            return;
        }
    }
    function stopPropagationForMultiLineDownwards(event, value, textarea) {
        const isMultiline = !!value.match(/\n/);
        if (textarea && (isMultiline || textarea.clientHeight > SingleLineInputHeight) && textarea.selectionEnd < textarea.value.length) {
            event.stopPropagation();
            return;
        }
    }
    let SearchWidget = class SearchWidget extends widget_1.Widget {
        static { SearchWidget_1 = this; }
        static { this.INPUT_MAX_HEIGHT = 134; }
        static { this.REPLACE_ALL_DISABLED_LABEL = nls.localize('search.action.replaceAll.disabled.label', "Replace All (Submit Search to Enable)"); }
        static { this.REPLACE_ALL_ENABLED_LABEL = (keyBindingService2) => {
            const kb = keyBindingService2.lookupKeybinding(ReplaceAllAction.ID);
            return (0, searchActionsBase_1.appendKeyBindingLabel)(nls.localize('search.action.replaceAll.enabled.label', "Replace All"), kb);
        }; }
        constructor(container, options, contextViewService, contextKeyService, keybindingService, clipboardServce, configurationService, accessibilityService, contextMenuService, instantiationService, editorService) {
            super();
            this.contextViewService = contextViewService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.clipboardServce = clipboardServce;
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.ignoreGlobalFindBufferOnNextFocus = false;
            this.previousGlobalFindBufferValue = null;
            this._onSearchSubmit = this._register(new event_1.Emitter());
            this.onSearchSubmit = this._onSearchSubmit.event;
            this._onSearchCancel = this._register(new event_1.Emitter());
            this.onSearchCancel = this._onSearchCancel.event;
            this._onReplaceToggled = this._register(new event_1.Emitter());
            this.onReplaceToggled = this._onReplaceToggled.event;
            this._onReplaceStateChange = this._register(new event_1.Emitter());
            this.onReplaceStateChange = this._onReplaceStateChange.event;
            this._onPreserveCaseChange = this._register(new event_1.Emitter());
            this.onPreserveCaseChange = this._onPreserveCaseChange.event;
            this._onReplaceValueChanged = this._register(new event_1.Emitter());
            this.onReplaceValueChanged = this._onReplaceValueChanged.event;
            this._onReplaceAll = this._register(new event_1.Emitter());
            this.onReplaceAll = this._onReplaceAll.event;
            this._onBlur = this._register(new event_1.Emitter());
            this.onBlur = this._onBlur.event;
            this._onDidHeightChange = this._register(new event_1.Emitter());
            this.onDidHeightChange = this._onDidHeightChange.event;
            this._onDidToggleContext = new event_1.Emitter();
            this.onDidToggleContext = this._onDidToggleContext.event;
            this.replaceActive = Constants.SearchContext.ReplaceActiveKey.bindTo(this.contextKeyService);
            this.searchInputBoxFocused = Constants.SearchContext.SearchInputBoxFocusedKey.bindTo(this.contextKeyService);
            this.replaceInputBoxFocused = Constants.SearchContext.ReplaceInputBoxFocusedKey.bindTo(this.contextKeyService);
            const notebookOptions = options.notebookOptions ??
                {
                    isInNotebookMarkdownInput: true,
                    isInNotebookMarkdownPreview: true,
                    isInNotebookCellInput: true,
                    isInNotebookCellOutput: true
                };
            this._notebookFilters = this._register(new findFilters_1.NotebookFindFilters(notebookOptions.isInNotebookMarkdownInput, notebookOptions.isInNotebookMarkdownPreview, notebookOptions.isInNotebookCellInput, notebookOptions.isInNotebookCellOutput));
            this._register(this._notebookFilters.onDidChange(() => {
                if (this.searchInput) {
                    this.searchInput.updateFilterStyles();
                }
            }));
            this._register(this.editorService.onDidEditorsChange((e) => {
                if (this.searchInput &&
                    e.event.editor instanceof notebookEditorInput_1.NotebookEditorInput &&
                    (e.event.kind === 4 /* GroupModelChangeKind.EDITOR_OPEN */ || e.event.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */)) {
                    this.searchInput.filterVisible = this._hasNotebookOpen();
                }
            }));
            this._replaceHistoryDelayer = new async_1.Delayer(500);
            this._toggleReplaceButtonListener = this._register(new lifecycle_1.MutableDisposable());
            this.render(container, options);
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this.updateAccessibilitySupport();
                }
            });
            this.accessibilityService.onDidChangeScreenReaderOptimized(() => this.updateAccessibilitySupport());
            this.updateAccessibilitySupport();
        }
        _hasNotebookOpen() {
            const editors = this.editorService.editors;
            return editors.some(editor => editor instanceof notebookEditorInput_1.NotebookEditorInput);
        }
        getNotebookFilters() {
            return this._notebookFilters;
        }
        focus(select = true, focusReplace = false, suppressGlobalSearchBuffer = false) {
            this.ignoreGlobalFindBufferOnNextFocus = suppressGlobalSearchBuffer;
            if (focusReplace && this.isReplaceShown()) {
                if (this.replaceInput) {
                    this.replaceInput.focus();
                    if (select) {
                        this.replaceInput.select();
                    }
                }
            }
            else {
                if (this.searchInput) {
                    this.searchInput.focus();
                    if (select) {
                        this.searchInput.select();
                    }
                }
            }
        }
        setWidth(width) {
            this.searchInput?.inputBox.layout();
            if (this.replaceInput) {
                this.replaceInput.width = width - 28;
                this.replaceInput.inputBox.layout();
            }
        }
        clear() {
            this.searchInput?.clear();
            this.replaceInput?.setValue('');
            this.setReplaceAllActionState(false);
        }
        isReplaceShown() {
            return this.replaceContainer ? !this.replaceContainer.classList.contains('disabled') : false;
        }
        isReplaceActive() {
            return !!this.replaceActive.get();
        }
        getReplaceValue() {
            return this.replaceInput?.getValue() ?? '';
        }
        toggleReplace(show) {
            if (show === undefined || show !== this.isReplaceShown()) {
                this.onToggleReplaceButton();
            }
        }
        getSearchHistory() {
            return this.searchInput?.inputBox.getHistory() ?? [];
        }
        getReplaceHistory() {
            return this.replaceInput?.inputBox.getHistory() ?? [];
        }
        prependSearchHistory(history) {
            this.searchInput?.inputBox.prependHistory(history);
        }
        prependReplaceHistory(history) {
            this.replaceInput?.inputBox.prependHistory(history);
        }
        clearHistory() {
            this.searchInput?.inputBox.clearHistory();
            this.replaceInput?.inputBox.clearHistory();
        }
        showNextSearchTerm() {
            this.searchInput?.inputBox.showNextValue();
        }
        showPreviousSearchTerm() {
            this.searchInput?.inputBox.showPreviousValue();
        }
        showNextReplaceTerm() {
            this.replaceInput?.inputBox.showNextValue();
        }
        showPreviousReplaceTerm() {
            this.replaceInput?.inputBox.showPreviousValue();
        }
        searchInputHasFocus() {
            return !!this.searchInputBoxFocused.get();
        }
        replaceInputHasFocus() {
            return !!this.replaceInput?.inputBox.hasFocus();
        }
        focusReplaceAllAction() {
            this.replaceActionBar?.focus(true);
        }
        focusRegexAction() {
            this.searchInput?.focusOnRegex();
        }
        render(container, options) {
            this.domNode = dom.append(container, dom.$('.search-widget'));
            this.domNode.style.position = 'relative';
            if (!options._hideReplaceToggle) {
                this.renderToggleReplaceButton(this.domNode);
            }
            this.renderSearchInput(this.domNode, options);
            this.renderReplaceInput(this.domNode, options);
        }
        updateAccessibilitySupport() {
            this.searchInput?.setFocusInputOnOptionClick(!this.accessibilityService.isScreenReaderOptimized());
        }
        renderToggleReplaceButton(parent) {
            const opts = {
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined,
                buttonSecondaryBackground: undefined,
                buttonSecondaryForeground: undefined,
                buttonSecondaryHoverBackground: undefined,
                buttonSeparator: undefined,
                title: nls.localize('search.replace.toggle.button.title', "Toggle Replace"),
                hoverDelegate: (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
            };
            this.toggleReplaceButton = this._register(new button_1.Button(parent, opts));
            this.toggleReplaceButton.element.setAttribute('aria-expanded', 'false');
            this.toggleReplaceButton.element.classList.add('toggle-replace-button');
            this.toggleReplaceButton.icon = searchIcons_1.searchHideReplaceIcon;
            this._toggleReplaceButtonListener.value = this.toggleReplaceButton.onDidClick(() => this.onToggleReplaceButton());
        }
        renderSearchInput(parent, options) {
            const inputOptions = {
                label: nls.localize('label.Search', 'Search: Type Search Term and press Enter to search'),
                validation: (value) => this.validateSearchInput(value),
                placeholder: nls.localize('search.placeHolder', "Search"),
                appendCaseSensitiveLabel: (0, searchActionsBase_1.appendKeyBindingLabel)('', this.keybindingService.lookupKeybinding("toggleSearchCaseSensitive" /* Constants.SearchCommandIds.ToggleCaseSensitiveCommandId */)),
                appendWholeWordsLabel: (0, searchActionsBase_1.appendKeyBindingLabel)('', this.keybindingService.lookupKeybinding("toggleSearchWholeWord" /* Constants.SearchCommandIds.ToggleWholeWordCommandId */)),
                appendRegexLabel: (0, searchActionsBase_1.appendKeyBindingLabel)('', this.keybindingService.lookupKeybinding("toggleSearchRegex" /* Constants.SearchCommandIds.ToggleRegexCommandId */)),
                history: options.searchHistory,
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this.keybindingService),
                flexibleHeight: true,
                flexibleMaxHeight: SearchWidget_1.INPUT_MAX_HEIGHT,
                showCommonFindToggles: true,
                inputBoxStyles: options.inputBoxStyles,
                toggleStyles: options.toggleStyles
            };
            const searchInputContainer = dom.append(parent, dom.$('.search-container.input-box'));
            this.searchInput = this._register(new searchFindInput_1.SearchFindInput(searchInputContainer, this.contextViewService, inputOptions, this.contextKeyService, this.contextMenuService, this.instantiationService, this._notebookFilters, options.initialAIButtonVisibility ?? false, this._hasNotebookOpen()));
            this.searchInput.onKeyDown((keyboardEvent) => this.onSearchInputKeyDown(keyboardEvent));
            this.searchInput.setValue(options.value || '');
            this.searchInput.setRegex(!!options.isRegex);
            this.searchInput.setCaseSensitive(!!options.isCaseSensitive);
            this.searchInput.setWholeWords(!!options.isWholeWords);
            this._register(this.searchInput.onCaseSensitiveKeyDown((keyboardEvent) => this.onCaseSensitiveKeyDown(keyboardEvent)));
            this._register(this.searchInput.onRegexKeyDown((keyboardEvent) => this.onRegexKeyDown(keyboardEvent)));
            this._register(this.searchInput.inputBox.onDidChange(() => this.onSearchInputChanged()));
            this._register(this.searchInput.inputBox.onDidHeightChange(() => this._onDidHeightChange.fire()));
            this._register(this.onReplaceValueChanged(() => {
                this._replaceHistoryDelayer.trigger(() => this.replaceInput?.inputBox.addToHistory());
            }));
            this.searchInputFocusTracker = this._register(dom.trackFocus(this.searchInput.inputBox.inputElement));
            this._register(this.searchInputFocusTracker.onDidFocus(async () => {
                this.searchInputBoxFocused.set(true);
                const useGlobalFindBuffer = this.searchConfiguration.globalFindClipboard;
                if (!this.ignoreGlobalFindBufferOnNextFocus && useGlobalFindBuffer) {
                    const globalBufferText = await this.clipboardServce.readFindText();
                    if (globalBufferText && this.previousGlobalFindBufferValue !== globalBufferText) {
                        this.searchInput?.inputBox.addToHistory();
                        this.searchInput?.setValue(globalBufferText);
                        this.searchInput?.select();
                    }
                    this.previousGlobalFindBufferValue = globalBufferText;
                }
                this.ignoreGlobalFindBufferOnNextFocus = false;
            }));
            this._register(this.searchInputFocusTracker.onDidBlur(() => this.searchInputBoxFocused.set(false)));
            this.showContextToggle = new toggle_1.Toggle({
                isChecked: false,
                title: (0, searchActionsBase_1.appendKeyBindingLabel)(nls.localize('showContext', "Toggle Context Lines"), this.keybindingService.lookupKeybinding(constants_1.ToggleSearchEditorContextLinesCommandId)),
                icon: searchIcons_1.searchShowContextIcon,
                hoverDelegate: (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                ...defaultStyles_1.defaultToggleStyles
            });
            this._register(this.showContextToggle.onChange(() => this.onContextLinesChanged()));
            if (options.showContextToggle) {
                this.contextLinesInput = new inputBox_1.InputBox(searchInputContainer, this.contextViewService, { type: 'number', inputBoxStyles: defaultStyles_1.defaultInputBoxStyles });
                this.contextLinesInput.element.classList.add('context-lines-input');
                this.contextLinesInput.value = '' + (this.configurationService.getValue('search').searchEditor.defaultNumberOfContextLines ?? 1);
                this._register(this.contextLinesInput.onDidChange((value) => {
                    if (value !== '0') {
                        this.showContextToggle.checked = true;
                    }
                    this.onContextLinesChanged();
                }));
                dom.append(searchInputContainer, this.showContextToggle.domNode);
            }
        }
        onContextLinesChanged() {
            this._onDidToggleContext.fire();
            if (this.contextLinesInput.value.includes('-')) {
                this.contextLinesInput.value = '0';
            }
            this._onDidToggleContext.fire();
        }
        setContextLines(lines) {
            if (!this.contextLinesInput) {
                return;
            }
            if (lines === 0) {
                this.showContextToggle.checked = false;
            }
            else {
                this.showContextToggle.checked = true;
                this.contextLinesInput.value = '' + lines;
            }
        }
        renderReplaceInput(parent, options) {
            this.replaceContainer = dom.append(parent, dom.$('.replace-container.disabled'));
            const replaceBox = dom.append(this.replaceContainer, dom.$('.replace-input'));
            this.replaceInput = this._register(new contextScopedHistoryWidget_1.ContextScopedReplaceInput(replaceBox, this.contextViewService, {
                label: nls.localize('label.Replace', 'Replace: Type replace term and press Enter to preview'),
                placeholder: nls.localize('search.replace.placeHolder', "Replace"),
                appendPreserveCaseLabel: (0, searchActionsBase_1.appendKeyBindingLabel)('', this.keybindingService.lookupKeybinding("toggleSearchPreserveCase" /* Constants.SearchCommandIds.TogglePreserveCaseId */)),
                history: options.replaceHistory,
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this.keybindingService),
                flexibleHeight: true,
                flexibleMaxHeight: SearchWidget_1.INPUT_MAX_HEIGHT,
                inputBoxStyles: options.inputBoxStyles,
                toggleStyles: options.toggleStyles
            }, this.contextKeyService, true));
            this._register(this.replaceInput.onDidOptionChange(viaKeyboard => {
                if (!viaKeyboard) {
                    if (this.replaceInput) {
                        this._onPreserveCaseChange.fire(this.replaceInput.getPreserveCase());
                    }
                }
            }));
            this.replaceInput.onKeyDown((keyboardEvent) => this.onReplaceInputKeyDown(keyboardEvent));
            this.replaceInput.setValue(options.replaceValue || '');
            this._register(this.replaceInput.inputBox.onDidChange(() => this._onReplaceValueChanged.fire()));
            this._register(this.replaceInput.inputBox.onDidHeightChange(() => this._onDidHeightChange.fire()));
            this.replaceAllAction = new ReplaceAllAction(this);
            this.replaceAllAction.label = SearchWidget_1.REPLACE_ALL_DISABLED_LABEL;
            this.replaceActionBar = this._register(new actionbar_1.ActionBar(this.replaceContainer));
            this.replaceActionBar.push([this.replaceAllAction], { icon: true, label: false });
            this.onkeydown(this.replaceActionBar.domNode, (keyboardEvent) => this.onReplaceActionbarKeyDown(keyboardEvent));
            this.replaceInputFocusTracker = this._register(dom.trackFocus(this.replaceInput.inputBox.inputElement));
            this._register(this.replaceInputFocusTracker.onDidFocus(() => this.replaceInputBoxFocused.set(true)));
            this._register(this.replaceInputFocusTracker.onDidBlur(() => this.replaceInputBoxFocused.set(false)));
            this._register(this.replaceInput.onPreserveCaseKeyDown((keyboardEvent) => this.onPreserveCaseKeyDown(keyboardEvent)));
        }
        triggerReplaceAll() {
            this._onReplaceAll.fire();
            return Promise.resolve(null);
        }
        onToggleReplaceButton() {
            this.replaceContainer?.classList.toggle('disabled');
            if (this.isReplaceShown()) {
                this.toggleReplaceButton?.element.classList.remove(...themables_1.ThemeIcon.asClassNameArray(searchIcons_1.searchHideReplaceIcon));
                this.toggleReplaceButton?.element.classList.add(...themables_1.ThemeIcon.asClassNameArray(searchIcons_1.searchShowReplaceIcon));
            }
            else {
                this.toggleReplaceButton?.element.classList.remove(...themables_1.ThemeIcon.asClassNameArray(searchIcons_1.searchShowReplaceIcon));
                this.toggleReplaceButton?.element.classList.add(...themables_1.ThemeIcon.asClassNameArray(searchIcons_1.searchHideReplaceIcon));
            }
            this.toggleReplaceButton?.element.setAttribute('aria-expanded', this.isReplaceShown() ? 'true' : 'false');
            this.updateReplaceActiveState();
            this._onReplaceToggled.fire();
        }
        setValue(value) {
            this.searchInput?.setValue(value);
        }
        setReplaceAllActionState(enabled) {
            if (this.replaceAllAction && (this.replaceAllAction.enabled !== enabled)) {
                this.replaceAllAction.enabled = enabled;
                this.replaceAllAction.label = enabled ? SearchWidget_1.REPLACE_ALL_ENABLED_LABEL(this.keybindingService) : SearchWidget_1.REPLACE_ALL_DISABLED_LABEL;
                this.updateReplaceActiveState();
            }
        }
        updateReplaceActiveState() {
            const currentState = this.isReplaceActive();
            const newState = this.isReplaceShown() && !!this.replaceAllAction?.enabled;
            if (currentState !== newState) {
                this.replaceActive.set(newState);
                this._onReplaceStateChange.fire(newState);
                this.replaceInput?.inputBox.layout();
            }
        }
        validateSearchInput(value) {
            if (value.length === 0) {
                return null;
            }
            if (!(this.searchInput?.getRegex())) {
                return null;
            }
            try {
                new RegExp(value, 'u');
            }
            catch (e) {
                return { content: e.message };
            }
            return null;
        }
        onSearchInputChanged() {
            this.searchInput?.clearMessage();
            this.setReplaceAllActionState(false);
            if (this.searchConfiguration.searchOnType) {
                const delayMultiplierFromAISearch = (this.searchInput && this.searchInput.isAIEnabled) ? 5 : 1; // expand debounce period to multiple by 5 if AI is enabled
                if (this.searchInput?.getRegex()) {
                    try {
                        const regex = new RegExp(this.searchInput.getValue(), 'ug');
                        const matchienessHeuristic = `
								~!@#$%^&*()_+
								\`1234567890-=
								qwertyuiop[]\\
								QWERTYUIOP{}|
								asdfghjkl;'
								ASDFGHJKL:"
								zxcvbnm,./
								ZXCVBNM<>? `.match(regex)?.length ?? 0;
                        const delayMultiplier = matchienessHeuristic < 50 ? 1 :
                            matchienessHeuristic < 100 ? 5 : // expressions like `.` or `\w`
                                10; // only things matching empty string
                        this.submitSearch(true, this.searchConfiguration.searchOnTypeDebouncePeriod * delayMultiplier * delayMultiplierFromAISearch);
                    }
                    catch {
                        // pass
                    }
                }
                else {
                    this.submitSearch(true, this.searchConfiguration.searchOnTypeDebouncePeriod * delayMultiplierFromAISearch);
                }
            }
        }
        onSearchInputKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(ctrlKeyMod | 3 /* KeyCode.Enter */)) {
                this.searchInput?.inputBox.insertAtCursor('\n');
                keyboardEvent.preventDefault();
            }
            if (keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                this.searchInput?.onSearchSubmit();
                this.submitSearch();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(9 /* KeyCode.Escape */)) {
                this._onSearchCancel.fire({ focus: true });
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(2 /* KeyCode.Tab */)) {
                if (this.isReplaceShown()) {
                    this.replaceInput?.focus();
                }
                else {
                    this.searchInput?.focusOnCaseSensitive();
                }
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(16 /* KeyCode.UpArrow */)) {
                stopPropagationForMultiLineUpwards(keyboardEvent, this.searchInput?.getValue() ?? '', this.searchInput?.domNode.querySelector('textarea') ?? null);
            }
            else if (keyboardEvent.equals(18 /* KeyCode.DownArrow */)) {
                stopPropagationForMultiLineDownwards(keyboardEvent, this.searchInput?.getValue() ?? '', this.searchInput?.domNode.querySelector('textarea') ?? null);
            }
        }
        onCaseSensitiveKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                if (this.isReplaceShown()) {
                    this.replaceInput?.focus();
                    keyboardEvent.preventDefault();
                }
            }
        }
        onRegexKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(2 /* KeyCode.Tab */)) {
                if (this.isReplaceShown()) {
                    this.replaceInput?.focusOnPreserve();
                    keyboardEvent.preventDefault();
                }
            }
        }
        onPreserveCaseKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(2 /* KeyCode.Tab */)) {
                if (this.isReplaceActive()) {
                    this.focusReplaceAllAction();
                }
                else {
                    this._onBlur.fire();
                }
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                this.focusRegexAction();
                keyboardEvent.preventDefault();
            }
        }
        onReplaceInputKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(ctrlKeyMod | 3 /* KeyCode.Enter */)) {
                this.replaceInput?.inputBox.insertAtCursor('\n');
                keyboardEvent.preventDefault();
            }
            if (keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                this.submitSearch();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(2 /* KeyCode.Tab */)) {
                this.searchInput?.focusOnCaseSensitive();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                this.searchInput?.focus();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(16 /* KeyCode.UpArrow */)) {
                stopPropagationForMultiLineUpwards(keyboardEvent, this.replaceInput?.getValue() ?? '', this.replaceInput?.domNode.querySelector('textarea') ?? null);
            }
            else if (keyboardEvent.equals(18 /* KeyCode.DownArrow */)) {
                stopPropagationForMultiLineDownwards(keyboardEvent, this.replaceInput?.getValue() ?? '', this.replaceInput?.domNode.querySelector('textarea') ?? null);
            }
        }
        onReplaceActionbarKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                this.focusRegexAction();
                keyboardEvent.preventDefault();
            }
        }
        async submitSearch(triggeredOnType = false, delay = 0) {
            this.searchInput?.validate();
            if (!this.searchInput?.inputBox.isInputValid()) {
                return;
            }
            const value = this.searchInput.getValue();
            const useGlobalFindBuffer = this.searchConfiguration.globalFindClipboard;
            if (value && useGlobalFindBuffer) {
                await this.clipboardServce.writeFindText(value);
            }
            this._onSearchSubmit.fire({ triggeredOnType, delay });
        }
        getContextLines() {
            return this.showContextToggle.checked ? +this.contextLinesInput.value : 0;
        }
        modifyContextLines(increase) {
            const current = +this.contextLinesInput.value;
            const modified = current + (increase ? 1 : -1);
            this.showContextToggle.checked = modified !== 0;
            this.contextLinesInput.value = '' + modified;
        }
        toggleContextLines() {
            this.showContextToggle.checked = !this.showContextToggle.checked;
            this.onContextLinesChanged();
        }
        dispose() {
            this.setReplaceAllActionState(false);
            super.dispose();
        }
        get searchConfiguration() {
            return this.configurationService.getValue('search');
        }
    };
    exports.SearchWidget = SearchWidget;
    exports.SearchWidget = SearchWidget = SearchWidget_1 = __decorate([
        __param(2, contextView_1.IContextViewService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, clipboardService_1.IClipboardService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, accessibility_1.IAccessibilityService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, editorService_1.IEditorService)
    ], SearchWidget);
    function registerContributions() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: ReplaceAllAction.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, findModel_1.CONTEXT_FIND_WIDGET_NOT_VISIBLE),
            primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
            handler: accessor => {
                const viewsService = accessor.get(viewsService_1.IViewsService);
                if ((0, searchActionsBase_1.isSearchViewFocused)(viewsService)) {
                    const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
                    if (searchView) {
                        new ReplaceAllAction(searchView.searchAndReplaceWidget).run();
                    }
                }
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzd0JoRyxzREFnQkM7SUExdUJELGtDQUFrQztJQUNsQyxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztJQTBCakMsTUFBTSxnQkFBaUIsU0FBUSxnQkFBTTtpQkFFcEIsT0FBRSxHQUFXLDBCQUEwQixDQUFDO1FBRXhELFlBQW9CLGFBQTJCO1lBQzlDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtDQUFvQixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFEaEUsa0JBQWEsR0FBYixhQUFhLENBQWM7UUFFL0MsQ0FBQztRQUVELElBQUksWUFBWSxDQUFDLFlBQTBCO1lBQzFDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1FBQ25DLENBQUM7UUFFUSxHQUFHO1lBQ1gsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQy9DLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQzs7SUFHRixNQUFNLFVBQVUsR0FBRyxDQUFDLHNCQUFXLENBQUMsQ0FBQywwQkFBZ0IsQ0FBQywwQkFBZSxDQUFDLENBQUM7SUFFbkUsU0FBUyxrQ0FBa0MsQ0FBQyxLQUFxQixFQUFFLEtBQWEsRUFBRSxRQUFvQztRQUNySCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxD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