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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/base/common/platform", "vs/base/common/themables", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/services/model", "vs/editor/common/standaloneStrings", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/layout/browser/layoutService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions"], function (require, exports, dom_1, keyboardEvent_1, aria_1, codicons_1, lifecycle_1, marked_1, platform_1, themables_1, uri_1, editorExtensions_1, codeEditorWidget_1, position_1, model_1, standaloneStrings_1, codeActionController_1, nls_1, accessibility_1, menuEntryActionViewItem_1, toolbar_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, layoutService_1, opener_1, quickInput_1, storage_1, accessibilityConfiguration_1, chat_1, simpleEditorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleViewService = exports.AccessibleView = exports.NavigationType = exports.AccessibleViewType = exports.IAccessibleViewService = exports.ExtensionContentProvider = exports.AdvancedContentProvider = void 0;
    var DIMENSIONS;
    (function (DIMENSIONS) {
        DIMENSIONS[DIMENSIONS["MAX_WIDTH"] = 600] = "MAX_WIDTH";
    })(DIMENSIONS || (DIMENSIONS = {}));
    class AdvancedContentProvider {
        constructor(id, options, provideContent, onClose, verbositySettingKey, actions, next, previous, onKeyDown, getSymbols, onDidRequestClearLastProvider) {
            this.id = id;
            this.options = options;
            this.provideContent = provideContent;
            this.onClose = onClose;
            this.verbositySettingKey = verbositySettingKey;
            this.actions = actions;
            this.next = next;
            this.previous = previous;
            this.onKeyDown = onKeyDown;
            this.getSymbols = getSymbols;
            this.onDidRequestClearLastProvider = onDidRequestClearLastProvider;
        }
    }
    exports.AdvancedContentProvider = AdvancedContentProvider;
    class ExtensionContentProvider {
        constructor(id, options, provideContent, onClose, next, previous, actions) {
            this.id = id;
            this.options = options;
            this.provideContent = provideContent;
            this.onClose = onClose;
            this.next = next;
            this.previous = previous;
            this.actions = actions;
        }
    }
    exports.ExtensionContentProvider = ExtensionContentProvider;
    exports.IAccessibleViewService = (0, instantiation_1.createDecorator)('accessibleViewService');
    var AccessibleViewType;
    (function (AccessibleViewType) {
        AccessibleViewType["Help"] = "help";
        AccessibleViewType["View"] = "view";
    })(AccessibleViewType || (exports.AccessibleViewType = AccessibleViewType = {}));
    var NavigationType;
    (function (NavigationType) {
        NavigationType["Previous"] = "previous";
        NavigationType["Next"] = "next";
    })(NavigationType || (exports.NavigationType = NavigationType = {}));
    let AccessibleView = class AccessibleView extends lifecycle_1.Disposable {
        get editorWidget() { return this._editorWidget; }
        constructor(_openerService, _instantiationService, _configurationService, _modelService, _contextViewService, _contextKeyService, _accessibilityService, _keybindingService, _layoutService, _menuService, _commandService, _codeBlockContextProviderService, _storageService) {
            super();
            this._openerService = _openerService;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._modelService = _modelService;
            this._contextViewService = _contextViewService;
            this._contextKeyService = _contextKeyService;
            this._accessibilityService = _accessibilityService;
            this._keybindingService = _keybindingService;
            this._layoutService = _layoutService;
            this._menuService = _menuService;
            this._commandService = _commandService;
            this._codeBlockContextProviderService = _codeBlockContextProviderService;
            this._storageService = _storageService;
            this._accessiblityHelpIsShown = accessibilityConfiguration_1.accessibilityHelpIsShown.bindTo(this._contextKeyService);
            this._accessibleViewIsShown = accessibilityConfiguration_1.accessibleViewIsShown.bindTo(this._contextKeyService);
            this._accessibleViewSupportsNavigation = accessibilityConfiguration_1.accessibleViewSupportsNavigation.bindTo(this._contextKeyService);
            this._accessibleViewVerbosityEnabled = accessibilityConfiguration_1.accessibleViewVerbosityEnabled.bindTo(this._contextKeyService);
            this._accessibleViewGoToSymbolSupported = accessibilityConfiguration_1.accessibleViewGoToSymbolSupported.bindTo(this._contextKeyService);
            this._accessibleViewCurrentProviderId = accessibilityConfiguration_1.accessibleViewCurrentProviderId.bindTo(this._contextKeyService);
            this._accessibleViewInCodeBlock = accessibilityConfiguration_1.accessibleViewInCodeBlock.bindTo(this._contextKeyService);
            this._accessibleViewContainsCodeBlocks = accessibilityConfiguration_1.accessibleViewContainsCodeBlocks.bindTo(this._contextKeyService);
            this._onLastLine = accessibilityConfiguration_1.accessibleViewOnLastLine.bindTo(this._contextKeyService);
            this._container = document.createElement('div');
            this._container.classList.add('accessible-view');
            if (this._configurationService.getValue("accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */)) {
                this._container.classList.add('hide');
            }
            const codeEditorWidgetOptions = {
                contributions: editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => c.id !== codeActionController_1.CodeActionController.ID)
            };
            const titleBar = document.createElement('div');
            titleBar.classList.add('accessible-view-title-bar');
            this._title = document.createElement('div');
            this._title.classList.add('accessible-view-title');
            titleBar.appendChild(this._title);
            const actionBar = document.createElement('div');
            actionBar.classList.add('accessible-view-action-bar');
            titleBar.appendChild(actionBar);
            this._container.appendChild(titleBar);
            this._toolbar = this._register(_instantiationService.createInstance(toolbar_1.WorkbenchToolBar, actionBar, { orientation: 0 /* ActionsOrientation.HORIZONTAL */ }));
            this._toolbar.context = { viewId: 'accessibleView' };
            const toolbarElt = this._toolbar.getElement();
            toolbarElt.tabIndex = 0;
            const editorOptions = {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this._configurationService),
                lineDecorationsWidth: 6,
                dragAndDrop: false,
                cursorWidth: 1,
                wrappingStrategy: 'advanced',
                wrappingIndent: 'none',
                padding: { top: 2, bottom: 2 },
                quickSuggestions: false,
                renderWhitespace: 'none',
                dropIntoEditor: { enabled: false },
                readOnly: true,
                fontFamily: 'var(--monaco-monospace-font)'
            };
            this._editorWidget = this._register(this._instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._container, editorOptions, codeEditorWidgetOptions));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                if (this._currentProvider && this._accessiblityHelpIsShown.get()) {
                    this.show(this._currentProvider);
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (this._currentProvider instanceof AdvancedContentProvider && e.affectsConfiguration(this._currentProvider.verbositySettingKey)) {
                    if (this._accessiblityHelpIsShown.get()) {
                        this.show(this._currentProvider);
                    }
                    this._accessibleViewVerbosityEnabled.set(this._configurationService.getValue(this._currentProvider.verbositySettingKey));
                    this._updateToolbar(this._currentProvider.actions, this._currentProvider.options.type);
                }
                if (e.affectsConfiguration("accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */)) {
                    this._container.classList.toggle('hide', this._configurationService.getValue("accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */));
                }
            }));
            this._register(this._editorWidget.onDidDispose(() => this._resetContextKeys()));
            this._register(this._editorWidget.onDidChangeCursorPosition(() => {
                this._onLastLine.set(this._editorWidget.getPosition()?.lineNumber === this._editorWidget.getModel()?.getLineCount());
            }));
            this._register(this._editorWidget.onDidChangeCursorPosition(() => {
                const cursorPosition = this._editorWidget.getPosition()?.lineNumber;
                if (this._codeBlocks && cursorPosition !== undefined) {
                    const inCodeBlock = this._codeBlocks.find(c => c.startLine <= cursorPosition && c.endLine >= cursorPosition) !== undefined;
                    this._accessibleViewInCodeBlock.set(inCodeBlock);
                }
            }));
        }
        _resetContextKeys() {
            this._accessiblityHelpIsShown.reset();
            this._accessibleViewIsShown.reset();
            this._accessibleViewSupportsNavigation.reset();
            this._accessibleViewVerbosityEnabled.reset();
            this._accessibleViewGoToSymbolSupported.reset();
            this._accessibleViewCurrentProviderId.reset();
        }
        getPosition(id) {
            if (!id || !this._lastProvider || this._lastProvider.id !== id) {
                return undefined;
            }
            return this._editorWidget.getPosition() || undefined;
        }
        setPosition(position, reveal) {
            this._editorWidget.setPosition(position);
            if (reveal) {
                this._editorWidget.revealPosition(position);
            }
        }
        getCodeBlockContext() {
            const position = this._editorWidget.getPosition();
            if (!this._codeBlocks?.length || !position) {
                return;
            }
            const codeBlockIndex = this._codeBlocks?.findIndex(c => c.startLine <= position?.lineNumber && c.endLine >= position?.lineNumber);
            const codeBlock = codeBlockIndex !== undefined && codeBlockIndex > -1 ? this._codeBlocks[codeBlockIndex] : undefined;
            if (!codeBlock || codeBlockIndex === undefined) {
                return;
            }
            return { code: codeBlock.code, languageId: codeBlock.languageId, codeBlockIndex, element: undefined };
        }
        navigateToCodeBlock(type) {
            const position = this._editorWidget.getPosition();
            if (!this._codeBlocks?.length || !position) {
                return;
            }
            let codeBlock;
            const codeBlocks = this._codeBlocks.slice();
            if (type === 'previous') {
                codeBlock = codeBlocks.reverse().find(c => c.endLine < position.lineNumber);
            }
            else {
                codeBlock = codeBlocks.find(c => c.startLine > position.lineNumber);
            }
            if (!codeBlock) {
                return;
            }
            this.setPosition(new position_1.Position(codeBlock.startLine, 1), true);
        }
        showLastProvider(id) {
            if (!this._lastProvider || this._lastProvider.options.id !== id) {
                return;
            }
            this.show(this._lastProvider);
        }
        show(provider, symbol, showAccessibleViewHelp, position) {
            provider = provider ?? this._currentProvider;
            if (!provider) {
                return;
            }
            const delegate = {
                getAnchor: () => { return { x: ((0, dom_1.getActiveWindow)().innerWidth / 2) - ((Math.min(this._layoutService.activeContainerDimension.width * 0.62 /* golden cut */, 600 /* DIMENSIONS.MAX_WIDTH */)) / 2), y: this._layoutService.activeContainerOffset.quickPickTop }; },
                render: (container) => {
                    container.classList.add('accessible-view-container');
                    return this._render(provider, container, showAccessibleViewHelp);
                },
                onHide: () => {
                    if (!showAccessibleViewHelp) {
                        this._updateLastProvider();
                        this._currentProvider = undefined;
                        this._resetContextKeys();
                    }
                }
            };
            this._contextViewService.showContextView(delegate);
            if (position) {
                // Context view takes time to show up, so we need to wait for it to show up before we can set the position
                queueMicrotask(() => {
                    this._editorWidget.revealLine(position.lineNumber);
                    this._editorWidget.setSelection({ startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column });
                });
            }
            if (symbol && this._currentProvider) {
                this.showSymbol(this._currentProvider, symbol);
            }
            if (provider instanceof AdvancedContentProvider && provider.onDidRequestClearLastProvider) {
                this._register(provider.onDidRequestClearLastProvider((id) => {
                    if (this._lastProvider?.options.id === id) {
                        this._lastProvider = undefined;
                    }
                }));
            }
            if (provider.options.id) {
                // only cache a provider with an ID so that it will eventually be cleared.
                this._lastProvider = provider;
            }
            if (provider.id === "panelChat" /* AccessibleViewProviderId.Chat */) {
                this._register(this._codeBlockContextProviderService.registerProvider({ getCodeBlockContext: () => this.getCodeBlockContext() }, 'accessibleView'));
            }
            if (provider instanceof ExtensionContentProvider) {
                this._storageService.store(`${accessibility_1.ACCESSIBLE_VIEW_SHOWN_STORAGE_PREFIX}${provider.id}`, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            }
        }
        previous() {
            this._currentProvider?.previous?.();
        }
        next() {
            this._currentProvider?.next?.();
        }
        _verbosityEnabled() {
            if (!this._currentProvider) {
                return false;
            }
            return this._currentProvider instanceof AdvancedContentProvider ? this._configurationService.getValue(this._currentProvider.verbositySettingKey) === true : this._storageService.getBoolean(`${accessibility_1.ACCESSIBLE_VIEW_SHOWN_STORAGE_PREFIX}${this._currentProvider.id}`, -1 /* StorageScope.APPLICATION */, false);
        }
        goToSymbol() {
            if (!this._currentProvider) {
                return;
            }
            this._instantiationService.createInstance(AccessibleViewSymbolQuickPick, this).show(this._currentProvider);
        }
        calculateCodeBlocks(markdown) {
            if (this._currentProvider?.id !== "panelChat" /* AccessibleViewProviderId.Chat */) {
                return;
            }
            if (this._currentProvider.options.language && this._currentProvider.options.language !== 'markdown') {
                // Symbols haven't been provided and we cannot parse this language
                return;
            }
            const lines = markdown.split('\n');
            this._codeBlocks = [];
            let inBlock = false;
            let startLine = 0;
            let languageId;
            lines.forEach((line, i) => {
                if (!inBlock && line.startsWith('```')) {
                    inBlock = true;
                    startLine = i + 1;
                    languageId = line.substring(3).trim();
                }
                else if (inBlock && line.startsWith('```')) {
                    inBlock = false;
                    const endLine = i;
                    const code = lines.slice(startLine, endLine).join('\n');
                    this._codeBlocks?.push({ startLine, endLine, code, languageId });
                }
            });
            this._accessibleViewContainsCodeBlocks.set(this._codeBlocks.length > 0);
        }
        getSymbols() {
            const provider = this._currentProvider instanceof AdvancedContentProvider ? this._currentProvider : undefined;
            if (!this._currentContent || !provider) {
                return;
            }
            const symbols = provider.getSymbols?.() || [];
            if (symbols?.length) {
                return symbols;
            }
            if (provider.options.language && provider.options.language !== 'markdown') {
                // Symbols haven't been provided and we cannot parse this language
                return;
            }
            const markdownTokens = marked_1.marked.lexer(this._currentContent);
            if (!markdownTokens) {
                return;
            }
            this._convertTokensToSymbols(markdownTokens, symbols);
            return symbols.length ? symbols : undefined;
        }
        _convertTokensToSymbols(tokens, symbols) {
            let firstListItem;
            for (const token of tokens) {
                let label = undefined;
                if ('type' in token) {
                    switch (token.type) {
                        case 'heading':
                        case 'paragraph':
                        case 'code':
                            label = token.text;
                            break;
                        case 'list': {
                            const firstItem = token.items?.[0];
                            if (!firstItem) {
                                break;
                            }
                            firstListItem = `- ${firstItem.text}`;
                            label = token.items?.map(i => i.text).join(', ');
                            break;
                        }
                    }
                }
                if (label) {
                    symbols.push({ markdownToParse: label, label: (0, nls_1.localize)('symbolLabel', "({0}) {1}", token.type, label), ariaLabel: (0, nls_1.localize)('symbolLabelAria', "({0}) {1}", token.type, label), firstListItem });
                    firstListItem = undefined;
                }
            }
        }
        showSymbol(provider, symbol) {
            if (!this._currentContent) {
                return;
            }
            let lineNumber = symbol.lineNumber;
            const markdownToParse = symbol.markdownToParse;
            if (lineNumber === undefined && markdownToParse === undefined) {
                // No symbols provided and we cannot parse this language
                return;
            }
            if (lineNumber === undefined && markdownToParse) {
                // Note that this scales poorly, thus isn't used for worst case scenarios like the terminal, for which a line number will always be provided.
                // Parse the markdown to find the line number
                const index = this._currentContent.split('\n').findIndex(line => line.includes(markdownToParse.split('\n')[0]) || (symbol.firstListItem && line.includes(symbol.firstListItem))) ?? -1;
                if (index >= 0) {
                    lineNumber = index + 1;
                }
            }
            if (lineNumber === undefined) {
                return;
            }
            this.show(provider, undefined, undefined, { lineNumber, column: 1 });
            this._updateContextKeys(provider, true);
        }
        disableHint() {
            if (!(this._currentProvider instanceof AdvancedContentProvider)) {
                return;
            }
            this._configurationService.updateValue(this._currentProvider?.verbositySettingKey, false);
            (0, aria_1.alert)((0, nls_1.localize)('disableAccessibilityHelp', '{0} accessibility verbosity is now disabled', this._currentProvider.verbositySettingKey));
        }
        _updateContextKeys(provider, shown) {
            if (provider.options.type === "help" /* AccessibleViewType.Help */) {
                this._accessiblityHelpIsShown.set(shown);
                this._accessibleViewIsShown.reset();
            }
            else {
                this._accessibleViewIsShown.set(shown);
                this._accessiblityHelpIsShown.reset();
            }
            this._accessibleViewSupportsNavigation.set(provider.next !== undefined || provider.previous !== undefined);
            this._accessibleViewVerbosityEnabled.set(this._verbosityEnabled());
            this._accessibleViewGoToSymbolSupported.set(this._goToSymbolsSupported() ? this.getSymbols()?.length > 0 : false);
        }
        _render(provider, container, showAccessibleViewHelp) {
            this._currentProvider = provider;
            this._accessibleViewCurrentProviderId.set(provider.id);
            const verbose = this._verbosityEnabled();
            const readMoreLink = provider.options.readMoreUrl ? (0, nls_1.localize)("openDoc", "\n\nOpen a browser window with more information related to accessibility (H).") : '';
            let disableHelpHint = '';
            if (provider instanceof AdvancedContentProvider && provider.options.type === "help" /* AccessibleViewType.Help */ && verbose) {
                disableHelpHint = this._getDisableVerbosityHint(provider.verbositySettingKey);
            }
            const accessibilitySupport = this._accessibilityService.isScreenReaderOptimized();
            let message = '';
            if (provider.options.type === "help" /* AccessibleViewType.Help */) {
                const turnOnMessage = (platform_1.isMacintosh
                    ? standaloneStrings_1.AccessibilityHelpNLS.changeConfigToOnMac
                    : standaloneStrings_1.AccessibilityHelpNLS.changeConfigToOnWinLinux);
                if (accessibilitySupport && provider instanceof AdvancedContentProvider && provider.verbositySettingKey === "accessibility.verbosity.editor" /* AccessibilityVerbositySettingId.Editor */) {
                    message = standaloneStrings_1.AccessibilityHelpNLS.auto_on;
                    message += '\n';
                }
                else if (!accessibilitySupport) {
                    message = standaloneStrings_1.AccessibilityHelpNLS.auto_off + '\n' + turnOnMessage;
                    message += '\n';
                }
            }
            const exitThisDialogHint = verbose && !provider.options.position ? (0, nls_1.localize)('exit', '\n\nExit this dialog (Escape).') : '';
            const newContent = message + provider.provideContent() + readMoreLink + disableHelpHint + exitThisDialogHint;
            this.calculateCodeBlocks(newContent);
            this._currentContent = newContent;
            this._updateContextKeys(provider, true);
            const widgetIsFocused = this._editorWidget.hasTextFocus() || this._editorWidget.hasWidgetFocus();
            this._getTextModel(uri_1.URI.from({ path: `accessible-view-${provider.id}`, scheme: 'accessible-view', fragment: this._currentContent })).then((model) => {
                if (!model) {
                    return;
                }
                this._editorWidget.setModel(model);
                const domNode = this._editorWidget.getDomNode();
                if (!domNode) {
                    return;
                }
                model.setLanguage(provider.options.language ?? 'markdown');
                container.appendChild(this._container);
                let actionsHint = '';
                const hasActions = this._accessibleViewSupportsNavigation.get() || this._accessibleViewVerbosityEnabled.get() || this._accessibleViewGoToSymbolSupported.get() || provider.actions?.length;
                if (verbose && !showAccessibleViewHelp && hasActions) {
                    actionsHint = provider.options.position ? (0, nls_1.localize)('ariaAccessibleViewActionsBottom', 'Explore actions such as disabling this hint (Shift+Tab), use Escape to exit this dialog.') : (0, nls_1.localize)('ariaAccessibleViewActions', 'Explore actions such as disabling this hint (Shift+Tab).');
                }
                let ariaLabel = provider.options.type === "help" /* AccessibleViewType.Help */ ? (0, nls_1.localize)('accessibility-help', "Accessibility Help") : (0, nls_1.localize)('accessible-view', "Accessible View");
                this._title.textContent = ariaLabel;
                if (actionsHint && provider.options.type === "view" /* AccessibleViewType.View */) {
                    ariaLabel = (0, nls_1.localize)('accessible-view-hint', "Accessible View, {0}", actionsHint);
                }
                else if (actionsHint) {
                    ariaLabel = (0, nls_1.localize)('accessibility-help-hint', "Accessibility Help, {0}", actionsHint);
                }
                if (platform_1.isWindows && widgetIsFocused) {
                    // prevent the screen reader on windows from reading
                    // the aria label again when it's refocused
                    ariaLabel = '';
                }
                this._editorWidget.updateOptions({ ariaLabel });
                this._editorWidget.focus();
                if (this._currentProvider?.options.position) {
                    const position = this._editorWidget.getPosition();
                    const isDefaultPosition = position?.lineNumber === 1 && position.column === 1;
                    if (this._currentProvider.options.position === 'bottom' || this._currentProvider.options.position === 'initial-bottom' && isDefaultPosition) {
                        const lastLine = this.editorWidget.getModel()?.getLineCount();
                        const position = lastLine !== undefined && lastLine > 0 ? new position_1.Position(lastLine, 1) : undefined;
                        if (position) {
                            this._editorWidget.setPosition(position);
                            this._editorWidget.revealLine(position.lineNumber);
                        }
                    }
                }
            });
            this._updateToolbar(this._currentProvider.actions, provider.options.type);
            const hide = (e) => {
                provider.onClose();
                e.stopPropagation();
                this._contextViewService.hideContextView();
                this._updateContextKeys(provider, false);
                this._lastProvider = undefined;
                this._currentContent = undefined;
            };
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(this._editorWidget.onKeyDown((e) => {
                if (e.keyCode === 3 /* KeyCode.Enter */) {
                    this._commandService.executeCommand('editor.action.openLink');
                }
                else if (e.keyCode === 9 /* KeyCode.Escape */ || shouldHide(e.browserEvent, this._keybindingService, this._configurationService)) {
                    hide(e);
                }
                else if (e.keyCode === 38 /* KeyCode.KeyH */ && provider.options.readMoreUrl) {
                    const url = provider.options.readMoreUrl;
                    (0, aria_1.alert)(standaloneStrings_1.AccessibilityHelpNLS.openingDocs);
                    this._openerService.open(uri_1.URI.parse(url));
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (provider instanceof AdvancedContentProvider) {
                    provider.onKeyDown?.(e);
                }
            }));
            disposableStore.add((0, dom_1.addDisposableListener)(this._toolbar.getElement(), dom_1.EventType.KEY_DOWN, (e) => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (keyboardEvent.equals(9 /* KeyCode.Escape */)) {
                    hide(e);
                }
            }));
            disposableStore.add(this._editorWidget.onDidBlurEditorWidget(() => {
                if (!(0, dom_1.isActiveElement)(this._toolbar.getElement())) {
                    this._contextViewService.hideContextView();
                }
            }));
            disposableStore.add(this._editorWidget.onDidContentSizeChange(() => this._layout()));
            disposableStore.add(this._layoutService.onDidLayoutActiveContainer(() => this._layout()));
            return disposableStore;
        }
        _updateToolbar(providedActions, type) {
            this._toolbar.setAriaLabel(type === "help" /* AccessibleViewType.Help */ ? (0, nls_1.localize)('accessibleHelpToolbar', 'Accessibility Help') : (0, nls_1.localize)('accessibleViewToolbar', "Accessible View"));
            const menuActions = [];
            const toolbarMenu = this._register(this._menuService.createMenu(actions_1.MenuId.AccessibleView, this._contextKeyService));
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(toolbarMenu, {}, menuActions);
            if (providedActions) {
                for (const providedAction of providedActions) {
                    providedAction.class = providedAction.class || themables_1.ThemeIcon.asClassName(codicons_1.Codicon.primitiveSquare);
                    providedAction.checked = undefined;
                }
                this._toolbar.setActions([...providedActions, ...menuActions]);
            }
            else {
                this._toolbar.setActions(menuActions);
            }
        }
        _layout() {
            const dimension = this._layoutService.activeContainerDimension;
            const maxHeight = dimension.height && dimension.height * .4;
            const height = Math.min(maxHeight, this._editorWidget.getContentHeight());
            const width = Math.min(dimension.width * 0.62 /* golden cut */, 600 /* DIMENSIONS.MAX_WIDTH */);
            this._editorWidget.layout({ width, height });
        }
        async _getTextModel(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, null, resource, false);
        }
        _goToSymbolsSupported() {
            if (!this._currentProvider) {
                return false;
            }
            return this._currentProvider.options.type === "help" /* AccessibleViewType.Help */ || this._currentProvider.options.language === 'markdown' || this._currentProvider.options.language === undefined || (this._currentProvider instanceof AdvancedContentProvider && !!this._currentProvider.getSymbols?.());
        }
        _updateLastProvider() {
            const provider = this._currentProvider;
            if (!provider) {
                return;
            }
            const lastProvider = provider instanceof AdvancedContentProvider ? new AdvancedContentProvider(provider.id, provider.options, provider.provideContent.bind(provider), provider.onClose, provider.verbositySettingKey, provider.actions, provider.next, provider.previous, provider.onKeyDown, provider.getSymbols) : new ExtensionContentProvider(provider.id, provider.options, provider.provideContent.bind(provider), provider.onClose, provider.next, provider.previous, provider.actions);
            return lastProvider;
        }
        showAccessibleViewHelp() {
            const lastProvider = this._updateLastProvider();
            if (!lastProvider) {
                return;
            }
            const accessibleViewHelpProvider = {
                id: lastProvider.id,
                provideContent: () => lastProvider.options.customHelp ? lastProvider?.options.customHelp() : this._getAccessibleViewHelpDialogContent(this._goToSymbolsSupported()),
                onClose: () => {
                    this._contextViewService.hideContextView();
                    // HACK: Delay to allow the context view to hide #207638
                    queueMicrotask(() => this.show(lastProvider));
                },
                options: { type: "help" /* AccessibleViewType.Help */ },
                verbositySettingKey: lastProvider instanceof AdvancedContentProvider ? lastProvider.verbositySettingKey : undefined
            };
            this._contextViewService.hideContextView();
            // HACK: Delay to allow the context view to hide #186514
            queueMicrotask(() => this.show(accessibleViewHelpProvider, undefined, true));
        }
        _getAccessibleViewHelpDialogContent(providerHasSymbols) {
            const navigationHint = this._getNavigationHint();
            const goToSymbolHint = this._getGoToSymbolHint(providerHasSymbols);
            const toolbarHint = (0, nls_1.localize)('toolbar', "Navigate to the toolbar (Shift+Tab).");
            const chatHints = this._getChatHints();
            let hint = (0, nls_1.localize)('intro', "In the accessible view, you can:\n");
            if (navigationHint) {
                hint += ' - ' + navigationHint + '\n';
            }
            if (goToSymbolHint) {
                hint += ' - ' + goToSymbolHint + '\n';
            }
            if (toolbarHint) {
                hint += ' - ' + toolbarHint + '\n';
            }
            if (chatHints) {
                hint += chatHints;
            }
            return hint;
        }
        _getChatHints() {
            if (this._currentProvider?.id !== "panelChat" /* AccessibleViewProviderId.Chat */) {
                return;
            }
            let hint = '';
            const insertAtCursorKb = this._keybindingService.lookupKeybinding('workbench.action.chat.insertCodeBlock')?.getAriaLabel();
            const insertIntoNewFileKb = this._keybindingService.lookupKeybinding('workbench.action.chat.insertIntoNewFile')?.getAriaLabel();
            const runInTerminalKb = this._keybindingService.lookupKeybinding('workbench.action.chat.runInTerminal')?.getAriaLabel();
            if (insertAtCursorKb) {
                hint += (0, nls_1.localize)('insertAtCursor', " - Insert the code block at the cursor ({0}).\n", insertAtCursorKb);
            }
            else {
                hint += (0, nls_1.localize)('insertAtCursorNoKb', " - Insert the code block at the cursor by configuring a keybinding for the Chat: Insert Code Block command.\n");
            }
            if (insertIntoNewFileKb) {
                hint += (0, nls_1.localize)('insertIntoNewFile', " - Insert the code block into a new file ({0}).\n", insertIntoNewFileKb);
            }
            else {
                hint += (0, nls_1.localize)('insertIntoNewFileNoKb', " - Insert the code block into a new file by configuring a keybinding for the Chat: Insert into New File command.\n");
            }
            if (runInTerminalKb) {
                hint += (0, nls_1.localize)('runInTerminal', " - Run the code block in the terminal ({0}).\n", runInTerminalKb);
            }
            else {
                hint += (0, nls_1.localize)('runInTerminalNoKb', " - Run the coe block in the terminal by configuring a keybinding for the Chat: Insert into Terminal command.\n");
            }
            return hint;
        }
        _getNavigationHint() {
            let hint = '';
            const nextKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleViewNext" /* AccessibilityCommandId.ShowNext */)?.getAriaLabel();
            const previousKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleViewPrevious" /* AccessibilityCommandId.ShowPrevious */)?.getAriaLabel();
            if (nextKeybinding && previousKeybinding) {
                hint = (0, nls_1.localize)('accessibleViewNextPreviousHint', "Show the next ({0}) or previous ({1}) item.", nextKeybinding, previousKeybinding);
            }
            else {
                hint = (0, nls_1.localize)('chatAccessibleViewNextPreviousHintNoKb', "Show the next or previous item by configuring keybindings for the Show Next & Previous in Accessible View commands.");
            }
            return hint;
        }
        _getDisableVerbosityHint(verbositySettingKey) {
            if (!this._configurationService.getValue(verbositySettingKey)) {
                return '';
            }
            let hint = '';
            const disableKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleViewDisableHint" /* AccessibilityCommandId.DisableVerbosityHint */, this._contextKeyService)?.getAriaLabel();
            if (disableKeybinding) {
                hint = (0, nls_1.localize)('acessibleViewDisableHint', "\n\nDisable accessibility verbosity for this feature ({0}).", disableKeybinding);
            }
            else {
                hint = (0, nls_1.localize)('accessibleViewDisableHintNoKb', "\n\nAdd a keybinding for the command Disable Accessible View Hint, which disables accessibility verbosity for this feature.s");
            }
            return hint;
        }
        _getGoToSymbolHint(providerHasSymbols) {
            const goToSymbolKb = this._keybindingService.lookupKeybinding("editor.action.accessibleViewGoToSymbol" /* AccessibilityCommandId.GoToSymbol */)?.getAriaLabel();
            let goToSymbolHint = '';
            if (providerHasSymbols) {
                if (goToSymbolKb) {
                    goToSymbolHint = (0, nls_1.localize)('goToSymbolHint', 'Go to a symbol ({0}).', goToSymbolKb);
                }
                else {
                    goToSymbolHint = (0, nls_1.localize)('goToSymbolHintNoKb', 'To go to a symbol, configure a keybinding for the command Go To Symbol in Accessible View');
                }
            }
            return goToSymbolHint;
        }
    };
    exports.AccessibleView = AccessibleView;
    exports.AccessibleView = AccessibleView = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, model_1.IModelService),
        __param(4, contextView_1.IContextViewService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, layoutService_1.ILayoutService),
        __param(9, actions_1.IMenuService),
        __param(10, commands_1.ICommandService),
        __param(11, chat_1.IChatCodeBlockContextProviderService),
        __param(12, storage_1.IStorageService)
    ], AccessibleView);
    let AccessibleViewService = class AccessibleViewService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _configurationService, _keybindingService) {
            super();
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._keybindingService = _keybindingService;
        }
        show(provider, position) {
            if (!this._accessibleView) {
                this._accessibleView = this._register(this._instantiationService.createInstance(AccessibleView));
            }
            this._accessibleView.show(provider, undefined, undefined, position);
        }
        showLastProvider(id) {
            this._accessibleView?.showLastProvider(id);
        }
        next() {
            this._accessibleView?.next();
        }
        previous() {
            this._accessibleView?.previous();
        }
        goToSymbol() {
            this._accessibleView?.goToSymbol();
        }
        getOpenAriaHint(verbositySettingKey) {
            if (!this._configurationService.getValue(verbositySettingKey)) {
                return null;
            }
            const keybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleView" /* AccessibilityCommandId.OpenAccessibleView */)?.getAriaLabel();
            let hint = null;
            if (keybinding) {
                hint = (0, nls_1.localize)('acessibleViewHint', "Inspect this in the accessible view with {0}", keybinding);
            }
            else {
                hint = (0, nls_1.localize)('acessibleViewHintNoKbEither', "Inspect this in the accessible view via the command Open Accessible View which is currently not triggerable via keybinding.");
            }
            return hint;
        }
        disableHint() {
            this._accessibleView?.disableHint();
        }
        showAccessibleViewHelp() {
            this._accessibleView?.showAccessibleViewHelp();
        }
        getPosition(id) {
            return this._accessibleView?.getPosition(id) ?? undefined;
        }
        getLastPosition() {
            const lastLine = this._accessibleView?.editorWidget.getModel()?.getLineCount();
            return lastLine !== undefined && lastLine > 0 ? new position_1.Position(lastLine, 1) : undefined;
        }
        setPosition(position, reveal) {
            const editorWidget = this._accessibleView?.editorWidget;
            editorWidget?.setPosition(position);
            if (reveal) {
                editorWidget?.revealLine(position.lineNumber);
            }
        }
        getCodeBlockContext() {
            return this._accessibleView?.getCodeBlockContext();
        }
        navigateToCodeBlock(type) {
            this._accessibleView?.navigateToCodeBlock(type);
        }
    };
    exports.AccessibleViewService = AccessibleViewService;
    exports.AccessibleViewService = AccessibleViewService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, keybinding_1.IKeybindingService)
    ], AccessibleViewService);
    let AccessibleViewSymbolQuickPick = class AccessibleViewSymbolQuickPick {
        constructor(_accessibleView, _quickInputService) {
            this._accessibleView = _accessibleView;
            this._quickInputService = _quickInputService;
        }
        show(provider) {
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.placeholder = (0, nls_1.localize)('accessibleViewSymbolQuickPickPlaceholder', "Type to search symbols");
            quickPick.title = (0, nls_1.localize)('accessibleViewSymbolQuickPickTitle', "Go to Symbol Accessible View");
            const picks = [];
            const symbols = this._accessibleView.getSymbols();
            if (!symbols) {
                return;
            }
            for (const symbol of symbols) {
                picks.push({
                    label: symbol.label,
                    ariaLabel: symbol.ariaLabel
                });
            }
            quickPick.canSelectMany = false;
            quickPick.items = symbols;
            quickPick.show();
            quickPick.onDidAccept(() => {
                this._accessibleView.showSymbol(provider, quickPick.selectedItems[0]);
                quickPick.hide();
            });
            quickPick.onDidHide(() => {
                if (quickPick.selectedItems.length === 0) {
                    // this was escaped, so refocus the accessible view
                    this._accessibleView.show(provider);
                }
            });
        }
    };
    AccessibleViewSymbolQuickPick = __decorate([
        __param(1, quickInput_1.IQuickInputService)
    ], AccessibleViewSymbolQuickPick);
    function shouldHide(event, keybindingService, configurationService) {
        if (!configurationService.getValue("accessibility.accessibleView.closeOnKeyPress" /* AccessibilityWorkbenchSettingId.AccessibleViewCloseOnKeyPress */)) {
            return false;
        }
        const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(event);
        const resolveResult = keybindingService.softDispatch(standardKeyboardEvent, standardKeyboardEvent.target);
        const isValidChord = resolveResult.kind === 1 /* ResultKind.MoreChordsNeeded */;
        if (keybindingService.inChordMode || isValidChord) {
            return false;
        }
        return shouldHandleKey(event) && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    }
    function shouldHandleKey(event) {
        return !!event.code.match(/^(Key[A-Z]|Digit[0-9]|Equal|Comma|Period|Slash|Quote|Backquote|Backslash|Minus|Semicolon|Space|Enter)$/);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZVZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvYWNjZXNzaWJsZVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOENoRyxJQUFXLFVBRVY7SUFGRCxXQUFXLFVBQVU7UUFDcEIsdURBQWUsQ0FBQTtJQUNoQixDQUFDLEVBRlUsVUFBVSxLQUFWLFVBQVUsUUFFcEI7SUFJRCxNQUFhLHVCQUF1QjtRQUVuQyxZQUNRLEVBQTRCLEVBQzVCLE9BQStCLEVBQy9CLGNBQTRCLEVBQzVCLE9BQW1CLEVBQ25CLG1CQUFvRCxFQUNwRCxPQUFtQixFQUNuQixJQUFpQixFQUNqQixRQUFxQixFQUNyQixTQUF1QyxFQUN2QyxVQUEwQyxFQUMxQyw2QkFBK0Q7WUFWL0QsT0FBRSxHQUFGLEVBQUUsQ0FBMEI7WUFDNUIsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWM7WUFDNUIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtZQUNuQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQWlDO1lBQ3BELFlBQU8sR0FBUCxPQUFPLENBQVk7WUFDbkIsU0FBSSxHQUFKLElBQUksQ0FBYTtZQUNqQixhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGNBQVMsR0FBVCxTQUFTLENBQThCO1lBQ3ZDLGVBQVUsR0FBVixVQUFVLENBQWdDO1lBQzFDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBa0M7UUFDbkUsQ0FBQztLQUNMO0lBZkQsMERBZUM7SUFFRCxNQUFhLHdCQUF3QjtRQUVwQyxZQUNpQixFQUFVLEVBQ25CLE9BQStCLEVBQy9CLGNBQTRCLEVBQzVCLE9BQW1CLEVBQ25CLElBQWlCLEVBQ2pC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