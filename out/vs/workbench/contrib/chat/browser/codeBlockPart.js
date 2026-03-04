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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/bracketMatching/browser/bracketMatching", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition", "vs/editor/contrib/semanticTokens/browser/viewportSemanticTokens", "vs/editor/contrib/smartSelect/browser/smartSelect", "vs/editor/contrib/wordHighlighter/browser/wordHighlighter", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/toolbar", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/editor/browser/config/tabFocus", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/editor/contrib/hover/browser/hoverController", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/platform/label/common/label", "vs/base/browser/formattedTextRenderer", "vs/platform/opener/common/opener", "vs/editor/common/languages", "vs/editor/browser/services/codeEditorService", "vs/base/common/resources", "vs/editor/common/services/modelService", "vs/platform/dialogs/common/dialogs", "vs/editor/common/model/textModelText", "vs/css!./codeBlockPart"], function (require, exports, dom, button_1, codicons_1, event_1, lifecycle_1, network_1, uri_1, editorExtensions_1, codeEditorWidget_1, editorOptions_1, range_1, model_1, resolverService_1, bracketMatching_1, contextmenu_1, goToDefinitionAtPosition_1, viewportSemanticTokens_1, smartSelect_1, wordHighlighter_1, nls_1, accessibility_1, toolbar_1, configuration_1, contextkey_1, instantiation_1, serviceCollection_1, chatViewModel_1, menuPreventer_1, selectionClipboard_1, simpleEditorOptions_1, tabFocus_1, diffEditorWidget_1, hoverController_1, chatContextKeys_1, label_1, formattedTextRenderer_1, opener_1, languages_1, codeEditorService_1, resources_1, modelService_1, dialogs_1, textModelText_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultChatTextEditor = exports.CodeCompareBlockPart = exports.ChatCodeBlockContentProvider = exports.CodeBlockPart = exports.localFileLanguageId = void 0;
    exports.parseLocalFileData = parseLocalFileData;
    const $ = dom.$;
    /**
     * Special markdown code block language id used to render a local file.
     *
     * The text of the code path should be a {@link LocalFileCodeBlockData} json object.
     */
    exports.localFileLanguageId = 'vscode-local-file';
    function parseLocalFileData(text) {
        let data;
        try {
            data = JSON.parse(text);
        }
        catch (e) {
            throw new Error('Could not parse code block local file data');
        }
        let uri;
        try {
            uri = uri_1.URI.revive(data?.uri);
        }
        catch (e) {
            throw new Error('Invalid code block local file data URI');
        }
        let range;
        if (data.range) {
            // Note that since this is coming from extensions, position are actually zero based and must be converted.
            range = new range_1.Range(data.range.startLineNumber + 1, data.range.startColumn + 1, data.range.endLineNumber + 1, data.range.endColumn + 1);
        }
        return { uri, range };
    }
    const defaultCodeblockPadding = 10;
    let CodeBlockPart = class CodeBlockPart extends lifecycle_1.Disposable {
        constructor(options, menuId, delegate, overflowWidgetsDomNode, instantiationService, contextKeyService, modelService, configurationService, accessibilityService) {
            super();
            this.options = options;
            this.menuId = menuId;
            this.modelService = modelService;
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this._onDidChangeContentHeight = this._register(new event_1.Emitter());
            this.onDidChangeContentHeight = this._onDidChangeContentHeight.event;
            this.currentScrollWidth = 0;
            this.disposableStore = this._register(new lifecycle_1.DisposableStore());
            this.element = $('.interactive-result-code-block');
            this.contextKeyService = this._register(contextKeyService.createScoped(this.element));
            const scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            const editorElement = dom.append(this.element, $('.interactive-result-editor'));
            this.editor = this.createEditor(scopedInstantiationService, editorElement, {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService),
                readOnly: true,
                lineNumbers: 'off',
                selectOnLineNumbers: true,
                scrollBeyondLastLine: false,
                lineDecorationsWidth: 8,
                dragAndDrop: false,
                padding: { top: defaultCodeblockPadding, bottom: defaultCodeblockPadding },
                mouseWheelZoom: false,
                scrollbar: {
                    vertical: 'hidden',
                    alwaysConsumeMouseWheel: false
                },
                definitionLinkOpensInPeek: false,
                gotoLocation: {
                    multiple: 'goto',
                    multipleDeclarations: 'goto',
                    multipleDefinitions: 'goto',
                    multipleImplementations: 'goto',
                },
                ariaLabel: (0, nls_1.localize)('chat.codeBlockHelp', 'Code block'),
                overflowWidgetsDomNode,
                ...this.getEditorOptionsFromConfig(),
            });
            const toolbarElement = dom.append(this.element, $('.interactive-result-code-block-toolbar'));
            const editorScopedService = this.editor.contextKeyService.createScoped(toolbarElement);
            const editorScopedInstantiationService = scopedInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorScopedService]));
            this.toolbar = this._register(editorScopedInstantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, toolbarElement, menuId, {
                menuOptions: {
                    shouldForwardArgs: true
                }
            }));
            const vulnsContainer = dom.append(this.element, $('.interactive-result-vulns'));
            const vulnsHeaderElement = dom.append(vulnsContainer, $('.interactive-result-vulns-header', undefined));
            this.vulnsButton = this._register(new button_1.Button(vulnsHeaderElement, {
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined,
                buttonSecondaryBackground: undefined,
                buttonSecondaryForeground: undefined,
                buttonSecondaryHoverBackground: undefined,
                buttonSeparator: undefined,
                supportIcons: true
            }));
            this.vulnsListElement = dom.append(vulnsContainer, $('ul.interactive-result-vulns-list'));
            this._register(this.vulnsButton.onDidClick(() => {
                const element = this.currentCodeBlockData.element;
                element.vulnerabilitiesListExpanded = !element.vulnerabilitiesListExpanded;
                this.vulnsButton.label = this.getVulnerabilitiesLabel();
                this.element.classList.toggle('chat-vulnerabilities-collapsed', !element.vulnerabilitiesListExpanded);
                this._onDidChangeContentHeight.fire();
                // this.updateAriaLabel(collapseButton.element, referencesLabel, element.usedReferencesExpanded);
            }));
            this._register(this.toolbar.onDidChangeDropdownVisibility(e => {
                toolbarElement.classList.toggle('force-visibility', e);
            }));
            this._configureForScreenReader();
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => this._configureForScreenReader()));
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectedKeys.has("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */)) {
                    this._configureForScreenReader();
                }
            }));
            this._register(this.options.onDidChange(() => {
                this.editor.updateOptions(this.getEditorOptionsFromConfig());
            }));
            this._register(this.editor.onDidScrollChange(e => {
                this.currentScrollWidth = e.scrollWidth;
            }));
            this._register(this.editor.onDidContentSizeChange(e => {
                if (e.contentHeightChanged) {
                    this._onDidChangeContentHeight.fire();
                }
            }));
            this._register(this.editor.onDidBlurEditorWidget(() => {
                this.element.classList.remove('focused');
                wordHighlighter_1.WordHighlighterContribution.get(this.editor)?.stopHighlighting();
                this.clearWidgets();
            }));
            this._register(this.editor.onDidFocusEditorWidget(() => {
                this.element.classList.add('focused');
                wordHighlighter_1.WordHighlighterContribution.get(this.editor)?.restoreViewState(true);
            }));
            // Parent list scrolled
            if (delegate.onDidScroll) {
                this._register(delegate.onDidScroll(e => {
                    this.clearWidgets();
                }));
            }
        }
        get uri() {
            return this.editor.getModel()?.uri;
        }
        createEditor(instantiationService, parent, options) {
            return this._register(instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, options, {
                isSimpleWidget: false,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    wordHighlighter_1.WordHighlighterContribution.ID,
                    viewportSemanticTokens_1.ViewportSemanticTokensContribution.ID,
                    bracketMatching_1.BracketMatchingController.ID,
                    smartSelect_1.SmartSelectController.ID,
                    hoverController_1.HoverController.ID,
                    goToDefinitionAtPosition_1.GotoDefinitionAtPositionEditorContribution.ID,
                ])
            }));
        }
        focus() {
            this.editor.focus();
        }
        updatePaddingForLayout() {
            // scrollWidth = "the width of the content that needs to be scrolled"
            // contentWidth = "the width of the area where content is displayed"
            const horizontalScrollbarVisible = this.currentScrollWidth > this.editor.getLayoutInfo().contentWidth;
            const scrollbarHeight = this.editor.getLayoutInfo().horizontalScrollbarHeight;
            const bottomPadding = horizontalScrollbarVisible ?
                Math.max(defaultCodeblockPadding - scrollbarHeight, 2) :
                defaultCodeblockPadding;
            this.editor.updateOptions({ padding: { top: defaultCodeblockPadding, bottom: bottomPadding } });
        }
        _configureForScreenReader() {
            const toolbarElt = this.toolbar.getElement();
            if (this.accessibilityService.isScreenReaderOptimized()) {
                toolbarElt.style.display = 'block';
                toolbarElt.ariaLabel = this.configurationService.getValue("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */) ? (0, nls_1.localize)('chat.codeBlock.toolbarVerbose', 'Toolbar for code block which can be reached via tab') : (0, nls_1.localize)('chat.codeBlock.toolbar', 'Code block toolbar');
            }
            else {
                toolbarElt.style.display = '';
            }
        }
        getEditorOptionsFromConfig() {
            return {
                wordWrap: this.options.configuration.resultEditor.wordWrap,
                fontLigatures: this.options.configuration.resultEditor.fontLigatures,
                bracketPairColorization: this.options.configuration.resultEditor.bracketPairColorization,
                fontFamily: this.options.configuration.resultEditor.fontFamily === 'default' ?
                    editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily :
                    this.options.configuration.resultEditor.fontFamily,
                fontSize: this.options.configuration.resultEditor.fontSize,
                fontWeight: this.options.configuration.resultEditor.fontWeight,
                lineHeight: this.options.configuration.resultEditor.lineHeight,
            };
        }
        layout(width) {
            const contentHeight = this.getContentHeight();
            const editorBorder = 2;
            this.editor.layout({ width: width - editorBorder, height: contentHeight });
            this.updatePaddingForLayout();
        }
        getContentHeight() {
            if (this.currentCodeBlockData?.range) {
                const lineCount = this.currentCodeBlockData.range.endLineNumber - this.currentCodeBlockData.range.startLineNumber + 1;
                const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
                return lineCount * lineHeight;
            }
            return this.editor.getContentHeight();
        }
        async render(data, width, editable) {
            this.currentCodeBlockData = data;
            if (data.parentContextKeyService) {
                this.contextKeyService.updateParent(data.parentContextKeyService);
            }
            if (this.options.configuration.resultEditor.wordWrap === 'on') {
                // Initialize the editor with the new proper width so that getContentHeight
                // will be computed correctly in the next call to layout()
                this.layout(width);
            }
            await this.updateEditor(data);
            this.layout(width);
            if (editable) {
                this.disposableStore.clear();
                this.disposableStore.add(this.editor.onDidFocusEditorWidget(() => tabFocus_1.TabFocus.setTabFocusMode(true)));
                this.disposableStore.add(this.editor.onDidBlurEditorWidget(() => tabFocus_1.TabFocus.setTabFocusMode(false)));
            }
            this.editor.updateOptions({ ariaLabel: (0, nls_1.localize)('chat.codeBlockLabel', "Code block {0}", data.codeBlockIndex + 1), readOnly: !editable });
            if (data.hideToolbar) {
                dom.hide(this.toolbar.getElement());
            }
            else {
                dom.show(this.toolbar.getElement());
            }
            if (data.vulns?.length && (0, chatViewModel_1.isResponseVM)(data.element)) {
                dom.clearNode(this.vulnsListElement);
                this.element.classList.remove('no-vulns');
                this.element.classList.toggle('chat-vulnerabilities-collapsed', !data.element.vulnerabilitiesListExpanded);
                dom.append(this.vulnsListElement, ...data.vulns.map(v => $('li', undefined, $('span.chat-vuln-title', undefined, v.title), ' ' + v.description)));
                this.vulnsButton.label = this.getVulnerabilitiesLabel();
            }
            else {
                this.element.classList.add('no-vulns');
            }
        }
        reset() {
            this.clearWidgets();
        }
        clearWidgets() {
            hoverController_1.HoverController.get(this.editor)?.hideContentHover();
        }
        async updateEditor(data) {
            const textModel = (await data.textModel).textEditorModel;
            this.editor.setModel(textModel);
            if (data.range) {
                this.editor.setSelection(data.range);
                this.editor.revealRangeInCenter(data.range, 1 /* ScrollType.Immediate */);
            }
            this.toolbar.context = {
                code: textModel.getTextBuffer().getValueInRange(data.range ?? textModel.getFullModelRange(), 0 /* EndOfLinePreference.TextDefined */),
                codeBlockIndex: data.codeBlockIndex,
                element: data.element,
                languageId: textModel.getLanguageId()
            };
        }
        getVulnerabilitiesLabel() {
            if (!this.currentCodeBlockData || !this.currentCodeBlockData.vulns) {
                return '';
            }
            const referencesLabel = this.currentCodeBlockData.vulns.length > 1 ?
                (0, nls_1.localize)('vulnerabilitiesPlural', "{0} vulnerabilities", this.currentCodeBlockData.vulns.length) :
                (0, nls_1.localize)('vulnerabilitiesSingular', "{0} vulnerability", 1);
            const icon = (element) => element.vulnerabilitiesListExpanded ? codicons_1.Codicon.chevronDown : codicons_1.Codicon.chevronRight;
            return `${referencesLabel} $(${icon(this.currentCodeBlockData.element).id})`;
        }
    };
    exports.CodeBlockPart = CodeBlockPart;
    exports.CodeBlockPart = CodeBlockPart = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, model_1.IModelService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, accessibility_1.IAccessibilityService)
    ], CodeBlockPart);
    let ChatCodeBlockContentProvider = class ChatCodeBlockContentProvider extends lifecycle_1.Disposable {
        constructor(textModelService, _modelService) {
            super();
            this._modelService = _modelService;
            this._register(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeChatCodeBlock, this));
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            return this._modelService.createModel('', null, resource);
        }
    };
    exports.ChatCodeBlockContentProvider = ChatCodeBlockContentProvider;
    exports.ChatCodeBlockContentProvider = ChatCodeBlockContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], ChatCodeBlockContentProvider);
    let CodeCompareBlockPart = class CodeCompareBlockPart extends lifecycle_1.Disposable {
        constructor(options, menuId, delegate, overflowWidgetsDomNode, instantiationService, contextKeyService, modelService, configurationService, accessibilityService, labelService, openerService) {
            super();
            this.options = options;
            this.menuId = menuId;
            this.modelService = modelService;
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.labelService = labelService;
            this.openerService = openerService;
            this._onDidChangeContentHeight = this._register(new event_1.Emitter());
            this.onDidChangeContentHeight = this._onDidChangeContentHeight.event;
            this._lastDiffEditorViewModel = this._store.add(new lifecycle_1.MutableDisposable());
            this.currentScrollWidth = 0;
            this.element = $('.interactive-result-code-block');
            this.element.classList.add('compare');
            this.messageElement = dom.append(this.element, $('.message'));
            this.messageElement.setAttribute('role', 'status');
            this.messageElement.tabIndex = 0;
            this.contextKeyService = this._register(contextKeyService.createScoped(this.element));
            const scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            const editorElement = dom.append(this.element, $('.interactive-result-editor'));
            this.diffEditor = this.createDiffEditor(scopedInstantiationService, editorElement, {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService),
                lineNumbers: 'on',
                selectOnLineNumbers: true,
                scrollBeyondLastLine: false,
                lineDecorationsWidth: 12,
                dragAndDrop: false,
                padding: { top: defaultCodeblockPadding, bottom: defaultCodeblockPadding },
                mouseWheelZoom: false,
                scrollbar: {
                    vertical: 'hidden',
                    alwaysConsumeMouseWheel: false
                },
                definitionLinkOpensInPeek: false,
                gotoLocation: {
                    multiple: 'goto',
                    multipleDeclarations: 'goto',
                    multipleDefinitions: 'goto',
                    multipleImplementations: 'goto',
                },
                ariaLabel: (0, nls_1.localize)('chat.codeBlockHelp', 'Code block'),
                overflowWidgetsDomNode,
                ...this.getEditorOptionsFromConfig(),
            });
            const toolbarElement = dom.append(this.element, $('.interactive-result-code-block-toolbar'));
            const editorScopedService = this.diffEditor.getModifiedEditor().contextKeyService.createScoped(toolbarElement);
            const editorScopedInstantiationService = scopedInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorScopedService]));
            this.toolbar = this._register(editorScopedInstantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, toolbarElement, menuId, {
                menuOptions: {
                    shouldForwardArgs: true
                }
            }));
            this._register(this.toolbar.onDidChangeDropdownVisibility(e => {
                toolbarElement.classList.toggle('force-visibility', e);
            }));
            this._configureForScreenReader();
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => this._configureForScreenReader()));
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectedKeys.has("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */)) {
                    this._configureForScreenReader();
                }
            }));
            this._register(this.options.onDidChange(() => {
                this.diffEditor.updateOptions(this.getEditorOptionsFromConfig());
            }));
            this._register(this.diffEditor.getModifiedEditor().onDidScrollChange(e => {
                this.currentScrollWidth = e.scrollWidth;
            }));
            this._register(this.diffEditor.onDidContentSizeChange(e => {
                if (e.contentHeightChanged) {
                    this._onDidChangeContentHeight.fire();
                }
            }));
            this._register(this.diffEditor.getModifiedEditor().onDidBlurEditorWidget(() => {
                this.element.classList.remove('focused');
                wordHighlighter_1.WordHighlighterContribution.get(this.diffEditor.getModifiedEditor())?.stopHighlighting();
                this.clearWidgets();
            }));
            this._register(this.diffEditor.getModifiedEditor().onDidFocusEditorWidget(() => {
                this.element.classList.add('focused');
                wordHighlighter_1.WordHighlighterContribution.get(this.diffEditor.getModifiedEditor())?.restoreViewState(true);
            }));
            // Parent list scrolled
            if (delegate.onDidScroll) {
                this._register(delegate.onDidScroll(e => {
                    this.clearWidgets();
                }));
            }
        }
        get uri() {
            return this.diffEditor.getModifiedEditor().getModel()?.uri;
        }
        createDiffEditor(instantiationService, parent, options) {
            const widgetOptions = {
                isSimpleWidget: false,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    wordHighlighter_1.WordHighlighterContribution.ID,
                    viewportSemanticTokens_1.ViewportSemanticTokensContribution.ID,
                    bracketMatching_1.BracketMatchingController.ID,
                    smartSelect_1.SmartSelectController.ID,
                    hoverController_1.HoverController.ID,
                    goToDefinitionAtPosition_1.GotoDefinitionAtPositionEditorContribution.ID,
                ])
            };
            return this._register(instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, parent, {
                scrollbar: { useShadows: false, alwaysConsumeMouseWheel: false, ignoreHorizontalScrollbarInContentHeight: true, },
                renderMarginRevertIcon: false,
                diffCodeLens: false,
                scrollBeyondLastLine: false,
                stickyScroll: { enabled: false },
                originalAriaLabel: (0, nls_1.localize)('original', 'Original'),
                modifiedAriaLabel: (0, nls_1.localize)('modified', 'Modified'),
                diffAlgorithm: 'advanced',
                readOnly: false,
                isInEmbeddedEditor: true,
                useInlineViewWhenSpaceIsLimited: false,
                hideUnchangedRegions: { enabled: true, contextLineCount: 1 },
                ...options
            }, { originalEditor: widgetOptions, modifiedEditor: widgetOptions }));
        }
        focus() {
            this.diffEditor.focus();
        }
        updatePaddingForLayout() {
            // scrollWidth = "the width of the content that needs to be scrolled"
            // contentWidth = "the width of the area where content is displayed"
            const horizontalScrollbarVisible = this.currentScrollWidth > this.diffEditor.getModifiedEditor().getLayoutInfo().contentWidth;
            const scrollbarHeight = this.diffEditor.getModifiedEditor().getLayoutInfo().horizontalScrollbarHeight;
            const bottomPadding = horizontalScrollbarVisible ?
                Math.max(defaultCodeblockPadding - scrollbarHeight, 2) :
                defaultCodeblockPadding;
            this.diffEditor.updateOptions({ padding: { top: defaultCodeblockPadding, bottom: bottomPadding } });
        }
        _configureForScreenReader() {
            const toolbarElt = this.toolbar.getElement();
            if (this.accessibilityService.isScreenReaderOptimized()) {
                toolbarElt.style.display = 'block';
                toolbarElt.ariaLabel = this.configurationService.getValue("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */) ? (0, nls_1.localize)('chat.codeBlock.toolbarVerbose', 'Toolbar for code block which can be reached via tab') : (0, nls_1.localize)('chat.codeBlock.toolbar', 'Code block toolbar');
            }
            else {
                toolbarElt.style.display = '';
            }
        }
        getEditorOptionsFromConfig() {
            return {
                wordWrap: this.options.configuration.resultEditor.wordWrap,
                fontLigatures: this.options.configuration.resultEditor.fontLigatures,
                bracketPairColorization: this.options.configuration.resultEditor.bracketPairColorization,
                fontFamily: this.options.configuration.resultEditor.fontFamily === 'default' ?
                    editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily :
                    this.options.configuration.resultEditor.fontFamily,
                fontSize: this.options.configuration.resultEditor.fontSize,
                fontWeight: this.options.configuration.resultEditor.fontWeight,
                lineHeight: this.options.configuration.resultEditor.lineHeight,
            };
        }
        layout(width) {
            const contentHeight = this.getContentHeight();
            const editorBorder = 2;
            const dimension = { width: width - editorBorder, height: contentHeight };
            this.element.style.height = `${dimension.height}px`;
            this.element.style.width = `${dimension.width}px`;
            this.diffEditor.layout(dimension);
            this.updatePaddingForLayout();
        }
        getContentHeight() {
            return this.diffEditor.getContentHeight();
        }
        async render(data, width, token) {
            if (data.parentContextKeyService) {
                this.contextKeyService.updateParent(data.parentContextKeyService);
            }
            if (this.options.configuration.resultEditor.wordWrap === 'on') {
                // Initialize the editor with the new proper width so that getContentHeight
                // will be computed correctly in the next call to layout()
                this.layout(width);
            }
            await this.updateEditor(data, token);
            this.layout(width);
            this.diffEditor.updateOptions({ ariaLabel: (0, nls_1.localize)('chat.compareCodeBlockLabel', "Code Edits") });
            if (data.hideToolbar) {
                dom.hide(this.toolbar.getElement());
            }
            else {
                dom.show(this.toolbar.getElement());
            }
        }
        reset() {
            this.clearWidgets();
        }
        clearWidgets() {
            hoverController_1.HoverController.get(this.diffEditor.getOriginalEditor())?.hideContentHover();
            hoverController_1.HoverController.get(this.diffEditor.getModifiedEditor())?.hideContentHover();
        }
        async updateEditor(data, token) {
            if (!(0, chatViewModel_1.isResponseVM)(data.element)) {
                return;
            }
            const isEditApplied = Boolean(data.edit.state?.applied ?? 0);
            chatContextKeys_1.CONTEXT_CHAT_EDIT_APPLIED.bindTo(this.contextKeyService).set(isEditApplied);
            this.element.classList.toggle('no-diff', isEditApplied);
            if (data.edit.state?.applied) {
                const uriLabel = this.labelService.getUriLabel(data.edit.uri, { relative: true, noPrefix: true });
                const template = data.edit.state.applied > 1
                    ? (0, nls_1.localize)('chat.edits.N', "Made {0} changes in [[{1}]]", data.edit.state.applied, uriLabel)
                    : (0, nls_1.localize)('chat.edits.1', "Made 1 change in [[{0}]]", uriLabel);
                const message = (0, formattedTextRenderer_1.renderFormattedText)(template, {
                    actionHandler: {
                        callback: () => {
                            this.openerService.open(data.edit.uri, { fromUserGesture: true, allowCommands: false });
                        },
                        disposables: this._store,
                    }
                });
                dom.reset(this.messageElement, message);
            }
            const diffData = await data.diffData;
            if (!diffData) {
                return;
            }
            if (!isEditApplied) {
                const viewModel = this.diffEditor.createViewModel({
                    original: diffData.original,
                    modified: diffData.modified
                });
                await viewModel.waitForDiff();
                if (token.isCancellationRequested) {
                    return;
                }
                this.diffEditor.setModel(viewModel);
                this._lastDiffEditorViewModel.value = viewModel;
            }
            else {
                this.diffEditor.setModel(null);
                this._lastDiffEditorViewModel.value = undefined;
            }
            this.toolbar.context = {
                edit: data.edit,
                element: data.element,
                diffEditor: this.diffEditor,
            };
        }
    };
    exports.CodeCompareBlockPart = CodeCompareBlockPart;
    exports.CodeCompareBlockPart = CodeCompareBlockPart = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, model_1.IModelService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, accessibility_1.IAccessibilityService),
        __param(9, label_1.ILabelService),
        __param(10, opener_1.IOpenerService)
    ], CodeCompareBlockPart);
    let DefaultChatTextEditor = class DefaultChatTextEditor {
        constructor(modelService, editorService, dialogService) {
            this.modelService = modelService;
            this.editorService = editorService;
            this.dialogService = dialogService;
            this._sha1 = new modelService_1.DefaultModelSHA1Computer();
        }
        async apply(response, item) {
            if (!response.response.value.includes(item)) {
                // bogous item
                return;
            }
            if (item.state?.applied) {
                // already applied
                return;
            }
            let diffEditor;
            for (const candidate of this.editorService.listDiffEditors()) {
                if (!candidate.getContainerDomNode().isConnected) {
                    continue;
                }
                const model = candidate.getModel();
                if (!model || !(0, resources_1.isEqual)(model.original.uri, item.uri) || model.modified.uri.scheme !== network_1.Schemas.vscodeChatCodeCompreBlock) {
                    diffEditor = candidate;
                    break;
                }
            }
            const edits = diffEditor
                ? await this._applyWithDiffEditor(diffEditor, item)
                : await this._apply(item);
            response.setEditApplied(item, edits);
        }
        async _applyWithDiffEditor(diffEditor, item) {
            const model = diffEditor.getModel();
            if (!model) {
                return 0;
            }
            const diff = diffEditor.getDiffComputationResult();
            if (!diff || diff.identical) {
                return 0;
            }
            if (!await this._checkSha1(model.original, item)) {
                return 0;
            }
            const modified = new textModelText_1.TextModelText(model.modified);
            const edits = diff.changes2.map(i => i.toRangeMapping().toTextEdit(modified).toSingleEditOperation());
            model.original.pushStackElement();
            model.original.pushEditOperations(null, edits, () => null);
            model.original.pushStackElement();
            return edits.length;
        }
        async _apply(item) {
            const ref = await this.modelService.createModelReference(item.uri);
            try {
                if (!await this._checkSha1(ref.object.textEditorModel, item)) {
                    return 0;
                }
                ref.object.textEditorModel.pushStackElement();
                let total = 0;
                for (const group of item.edits) {
                    const edits = group.map(languages_1.TextEdit.asEditOperation);
                    ref.object.textEditorModel.pushEditOperations(null, edits, () => null);
                    total += edits.length;
                }
                ref.object.textEditorModel.pushStackElement();
                return total;
            }
            finally {
                ref.dispose();
            }
        }
        async _checkSha1(model, item) {
            if (item.state?.sha1 && this._sha1.computeSHA1(model) && this._sha1.computeSHA1(model) !== item.state.sha1) {
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('interactive.compare.apply.confirm', "The original file has been modified."),
                    detail: (0, nls_1.localize)('interactive.compare.apply.confirm.detail', "Do you want to apply the changes anyway?"),
                });
                if (!result.confirmed) {
                    return false;
                }
            }
            return true;
        }
    };
    exports.DefaultChatTextEditor = DefaultChatTextEditor;
    exports.DefaultChatTextEditor = DefaultChatTextEditor = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, dialogs_1.IDialogService)
    ], DefaultChatTextEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUJsb2NrUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jb2RlQmxvY2tQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9GaEcsZ0RBNEJDO0lBcERELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFnQmhCOzs7O09BSUc7SUFDVSxRQUFBLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO0lBR3ZELFNBQWdCLGtCQUFrQixDQUFDLElBQVk7UUFPOUMsSUFBSSxJQUErQixDQUFDO1FBQ3BDLElBQUksQ0FBQztZQUNKLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxJQUFJLEdBQVEsQ0FBQztRQUNiLElBQUksQ0FBQztZQUNKLEdBQUcsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsSUFBSSxLQUF5QixDQUFDO1FBQzlCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hCLDBHQUEwRztZQUMxRyxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMs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