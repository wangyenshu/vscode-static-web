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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/browser/editorExtensions", "vs/base/browser/fonts", "vs/base/common/history", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/services/languageFeatures", "vs/editor/common/core/wordHelper", "vs/platform/configuration/common/configuration", "vs/css!./suggestEnabledInput"], function (require, exports, dom_1, widget_1, event_1, objects_1, platform_1, uri_1, codeEditorWidget_1, editOperation_1, position_1, range_1, model_1, contextmenu_1, snippetController2_1, suggestController_1, contextkey_1, instantiation_1, colorRegistry_1, themeService_1, menuPreventer_1, simpleEditorOptions_1, selectionClipboard_1, editorExtensions_1, fonts_1, history_1, contextScopedHistoryWidget_1, serviceCollection_1, languageFeatures_1, wordHelper_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedSuggestEnabledInputWithHistory = exports.SuggestEnabledInputWithHistory = exports.SuggestEnabledInput = void 0;
    let SuggestEnabledInput = class SuggestEnabledInput extends widget_1.Widget {
        constructor(id, parent, suggestionProvider, ariaLabel, resourceHandle, options, defaultInstantiationService, modelService, contextKeyService, languageFeaturesService, configurationService) {
            super();
            this._onShouldFocusResults = new event_1.Emitter();
            this.onShouldFocusResults = this._onShouldFocusResults.event;
            this._onInputDidChange = new event_1.Emitter();
            this.onInputDidChange = this._onInputDidChange.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this.stylingContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.suggest-input-container'));
            this.element = parent;
            this.placeholderText = (0, dom_1.append)(this.stylingContainer, (0, dom_1.$)('.suggest-input-placeholder', undefined, options.placeholderText || ''));
            const editorOptions = (0, objects_1.mixin)((0, simpleEditorOptions_1.getSimpleEditorOptions)(configurationService), getSuggestEnabledInputOptions(ariaLabel));
            editorOptions.overflowWidgetsDomNode = options.overflowWidgetsDomNode;
            const scopedContextKeyService = this.getScopedContextKeyService(contextKeyService);
            const instantiationService = scopedContextKeyService
                ? defaultInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]))
                : defaultInstantiationService;
            this.inputWidget = this._register(instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.stylingContainer, editorOptions, {
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    suggestController_1.SuggestController.ID,
                    snippetController2_1.SnippetController2.ID,
                    contextmenu_1.ContextMenuController.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                ]),
                isSimpleWidget: true,
            }));
            this._register(configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.accessibilitySupport') ||
                    e.affectsConfiguration('editor.cursorBlinking')) {
                    const accessibilitySupport = configurationService.getValue('editor.accessibilitySupport');
                    const cursorBlinking = configurationService.getValue('editor.cursorBlinking');
                    this.inputWidget.updateOptions({
                        accessibilitySupport,
                        cursorBlinking
                    });
                }
            }));
            this._register(this.inputWidget.onDidFocusEditorText(() => this._onDidFocus.fire()));
            this._register(this.inputWidget.onDidBlurEditorText(() => this._onDidBlur.fire()));
            const scopeHandle = uri_1.URI.parse(resourceHandle);
            this.inputModel = modelService.createModel('', null, scopeHandle, true);
            this._register(this.inputModel);
            this.inputWidget.setModel(this.inputModel);
            this._register(this.inputWidget.onDidPaste(() => this.setValue(this.getValue()))); // setter cleanses
            this._register((this.inputWidget.onDidFocusEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(true);
                }
                this.stylingContainer.classList.add('synthetic-focus');
            })));
            this._register((this.inputWidget.onDidBlurEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(false);
                }
                this.stylingContainer.classList.remove('synthetic-focus');
            })));
            this._register(event_1.Event.chain(this.inputWidget.onKeyDown, $ => $.filter(e => e.keyCode === 3 /* KeyCode.Enter */))(e => { e.preventDefault(); /** Do nothing. Enter causes new line which is not expected. */ }, this));
            this._register(event_1.Event.chain(this.inputWidget.onKeyDown, $ => $.filter(e => e.keyCode === 18 /* KeyCode.DownArrow */ && (platform_1.isMacintosh ? e.metaKey : e.ctrlKey)))(() => this._onShouldFocusResults.fire(), this));
            let preexistingContent = this.getValue();
            const inputWidgetModel = this.inputWidget.getModel();
            if (inputWidgetModel) {
                this._register(inputWidgetModel.onDidChangeContent(() => {
                    const content = this.getValue();
                    this.placeholderText.style.visibility = content ? 'hidden' : 'visible';
                    if (preexistingContent.trim() === content.trim()) {
                        return;
                    }
                    this._onInputDidChange.fire(undefined);
                    preexistingContent = content;
                }));
            }
            const validatedSuggestProvider = {
                provideResults: suggestionProvider.provideResults,
                sortKey: suggestionProvider.sortKey || (a => a),
                triggerCharacters: suggestionProvider.triggerCharacters || [],
                wordDefinition: suggestionProvider.wordDefinition ? (0, wordHelper_1.ensureValidWordDefinition)(suggestionProvider.wordDefinition) : undefined,
                alwaysShowSuggestions: !!suggestionProvider.alwaysShowSuggestions,
            };
            this.setValue(options.value || '');
            this._register(languageFeaturesService.completionProvider.register({ scheme: scopeHandle.scheme, pattern: '**/' + scopeHandle.path, hasAccessToAllModels: true }, {
                _debugDisplayName: `suggestEnabledInput/${id}`,
                triggerCharacters: validatedSuggestProvider.triggerCharacters,
                provideCompletionItems: (model, position, _context) => {
                    const query = model.getValue();
                    const zeroIndexedColumn = position.column - 1;
                    let alreadyTypedCount = 0, zeroIndexedWordStart = 0;
                    if (validatedSuggestProvider.wordDefinition) {
                        const wordAtText = (0, wordHelper_1.getWordAtText)(position.column, validatedSuggestProvider.wordDefinition, query, 0);
                        alreadyTypedCount = wordAtText?.word.length ?? 0;
                        zeroIndexedWordStart = wordAtText ? wordAtText.startColumn - 1 : 0;
                    }
                    else {
                        zeroIndexedWordStart = query.lastIndexOf(' ', zeroIndexedColumn - 1) + 1;
                        alreadyTypedCount = zeroIndexedColumn - zeroIndexedWordStart;
                    }
                    // dont show suggestions if the user has typed something, but hasn't used the trigger character
                    if (!validatedSuggestProvider.alwaysShowSuggestions && alreadyTypedCount > 0 && validatedSuggestProvider.triggerCharacters?.indexOf(query[zeroIndexedWordStart]) === -1) {
                        return { suggestions: [] };
                    }
                    return {
                        suggestions: suggestionProvider.provideResults(query).map((result) => {
                            let label;
                            let rest;
                            if (typeof result === 'string') {
                                label = result;
                            }
                            else {
                                label = result.label;
                                rest = result;
                            }
                            return {
                                label,
                                insertText: label,
                                range: range_1.Range.fromPositions(position.delta(0, -alreadyTypedCount), position),
                                sortText: validatedSuggestProvider.sortKey(label),
                                kind: 17 /* languages.CompletionItemKind.Keyword */,
                                ...rest
                            };
                        })
                    };
                }
            }));
            this.style(options.styleOverrides || {});
        }
        getScopedContextKeyService(_contextKeyService) {
            return undefined;
        }
        updateAriaLabel(label) {
            this.inputWidget.updateOptions({ ariaLabel: label });
        }
        setValue(val) {
            val = val.replace(/\s/g, ' ');
            const fullRange = this.inputModel.getFullModelRange();
            this.inputWidget.executeEdits('suggestEnabledInput.setValue', [editOperation_1.EditOperation.replace(fullRange, val)]);
            this.inputWidget.setScrollTop(0);
            this.inputWidget.setPosition(new position_1.Position(1, val.length + 1));
        }
        getValue() {
            return this.inputWidget.getValue();
        }
        style(styleOverrides) {
            this.stylingContainer.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputBackground ?? colorRegistry_1.inputBackground);
            this.stylingContainer.style.color = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputForeground ?? colorRegistry_1.inputForeground);
            this.placeholderText.style.color = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputPlaceholderForeground ?? colorRegistry_1.inputPlaceholderForeground);
            this.stylingContainer.style.borderWidth = '1px';
            this.stylingContainer.style.borderStyle = 'solid';
            this.stylingContainer.style.borderColor = (0, colorRegistry_1.asCssVariableWithDefault)(styleOverrides.inputBorder ?? colorRegistry_1.inputBorder, 'transparent');
            const cursor = this.stylingContainer.getElementsByClassName('cursor')[0];
            if (cursor) {
                cursor.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputForeground ?? colorRegistry_1.inputForeground);
            }
        }
        focus(selectAll) {
            this.inputWidget.focus();
            if (selectAll && this.inputWidget.getValue()) {
                this.selectAll();
            }
        }
        onHide() {
            this.inputWidget.onHide();
        }
        layout(dimension) {
            this.inputWidget.layout(dimension);
            this.placeholderText.style.width = `${dimension.width - 2}px`;
        }
        selectAll() {
            this.inputWidget.setSelection(new range_1.Range(1, 1, 1, this.getValue().length + 1));
        }
    };
    exports.SuggestEnabledInput = SuggestEnabledInput;
    exports.SuggestEnabledInput = SuggestEnabledInput = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, model_1.IModelService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, languageFeatures_1.ILanguageFeaturesService),
        __param(10, configuration_1.IConfigurationService)
    ], SuggestEnabledInput);
    let SuggestEnabledInputWithHistory = class SuggestEnabledInputWithHistory extends SuggestEnabledInput {
        constructor({ id, parent, ariaLabel, suggestionProvider, resourceHandle, suggestOptions, history }, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService) {
            super(id, parent, suggestionProvider, ariaLabel, resourceHandle, suggestOptions, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService);
            this.history = new history_1.HistoryNavigator(history, 100);
        }
        addToHistory() {
            const value = this.getValue();
            if (value && value !== this.getCurrentValue()) {
                this.history.add(value);
            }
        }
        getHistory() {
            return this.history.getHistory();
        }
        showNextValue() {
            if (!this.history.has(this.getValue())) {
                this.addToHistory();
            }
            let next = this.getNextValue();
            if (next) {
                next = next === this.getValue() ? this.getNextValue() : next;
            }
            this.setValue(next ?? '');
        }
        showPreviousValue() {
            if (!this.history.has(this.getValue())) {
                this.addToHistory();
            }
            let previous = this.getPreviousValue();
            if (previous) {
                previous = previous === this.getValue() ? this.getPreviousValue() : previous;
            }
            if (previous) {
                this.setValue(previous);
                this.inputWidget.setPosition({ lineNumber: 0, column: 0 });
            }
        }
        clearHistory() {
            this.history.clear();
        }
        getCurrentValue() {
            let currentValue = this.history.current();
            if (!currentValue) {
                currentValue = this.history.last();
                this.history.next();
            }
            return currentValue;
        }
        getPreviousValue() {
            return this.history.previous() || this.history.first();
        }
        getNextValue() {
            return this.history.next();
        }
    };
    exports.SuggestEnabledInputWithHistory = SuggestEnabledInputWithHistory;
    exports.SuggestEnabledInputWithHistory = SuggestEnabledInputWithHistory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, configuration_1.IConfigurationService)
    ], SuggestEnabledInputWithHistory);
    let ContextScopedSuggestEnabledInputWithHistory = class ContextScopedSuggestEnabledInputWithHistory extends SuggestEnabledInputWithHistory {
        constructor(options, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService) {
            super(options, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService);
            const { historyNavigationBackwardsEnablement, historyNavigationForwardsEnablement } = this.historyContext;
            this._register(this.inputWidget.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this.inputWidget._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineLength(lastLineNumber) + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                historyNavigationBackwardsEnablement.set(viewPosition.lineNumber === 1 && viewPosition.column === 1);
                historyNavigationForwardsEnablement.set(viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol);
            }));
        }
        getScopedContextKeyService(contextKeyService) {
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.element));
            this.historyContext = this._register((0, contextScopedHistoryWidget_1.registerAndCreateHistoryNavigationContext)(scopedContextKeyService, this));
            return scopedContextKeyService;
        }
    };
    exports.ContextScopedSuggestEnabledInputWithHistory = ContextScopedSuggestEnabledInputWithHistory;
    exports.ContextScopedSuggestEnabledInputWithHistory = ContextScopedSuggestEnabledInputWithHistory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, configuration_1.IConfigurationService)
    ], ContextScopedSuggestEnabledInputWithHistory);
    // Override styles in selections.ts
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const selectionBackgroundColor = theme.getColor(colorRegistry_1.selectionBackground);
        if (selectionBackgroundColor) {
            // Override inactive selection bg
            const inputBackgroundColor = theme.getColor(colorRegistry_1.inputBackground);
            if (inputBackgroundColor) {
                collector.addRule(`.suggest-input-container .monaco-editor .selected-text { background-color: ${inputBackgroundColor.transparent(0.4)}; }`);
            }
            // Override selected fg
            const inputForegroundColor = theme.getColor(colorRegistry_1.inputForeground);
            if (inputForegroundColor) {
                collector.addRule(`.suggest-input-container .monaco-editor .view-line span.inline-selected-text { color: ${inputForegroundColor}; }`);
            }
            const backgroundColor = theme.getColor(colorRegistry_1.inputBackground);
            if (backgroundColor) {
                collector.addRule(`.suggest-input-container .monaco-editor-background { background-color: ${backgroundColor}; } `);
            }
            collector.addRule(`.suggest-input-container .monaco-editor .focused .selected-text { background-color: ${selectionBackgroundColor}; }`);
        }
        else {
            // Use editor selection color if theme has not set a selection background color
            collector.addRule(`.suggest-input-container .monaco-editor .focused .selected-text { background-color: ${theme.getColor(colorRegistry_1.editorSelectionBackground)}; }`);
        }
    });
    function getSuggestEnabledInputOptions(ariaLabel) {
        return {
            fontSize: 13,
            lineHeight: 20,
            wordWrap: 'off',
            scrollbar: { vertical: 'hidden', },
            roundedSelection: false,
            guides: {
                indentation: false
            },
            cursorWidth: 1,
            fontFamily: fonts_1.DEFAULT_FONT_FAMILY,
            ariaLabel: ariaLabel || '',
            snippetSuggestions: 'none',
            suggest: { filterGraceful: false, showIcons: false },
            autoClosingBrackets: 'never'
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdEVuYWJsZWRJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9zdWdnZXN0RW5hYmxlZElucHV0L3N1Z2dlc3RFbmFibGVkSW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0h6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLGVBQU07UUFvQjlDLFlBQ0MsRUFBVSxFQUNWLE1BQW1CLEVBQ25CLGtCQUEwQyxFQUMxQyxTQUFpQixFQUNqQixjQUFzQixFQUN0QixPQUFtQyxFQUNaLDJCQUFrRCxFQUMxRCxZQUEyQixFQUN0QixpQkFBcUMsRUFDL0IsdUJBQWlELEVBQ3BELG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQS9CUSwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3BELHlCQUFvQixHQUFnQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRTdELHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFzQixDQUFDO1lBQzlELHFCQUFnQixHQUE4QixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRW5FLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDMUQsZUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBRTVCLGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN6RCxjQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUF1QjFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFBLFlBQU0sRUFBQyxNQUFNLEVBQUUsSUFBQSxPQUFDLEVBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBQSxZQUFNLEVBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUEsT0FBQyxFQUFDLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFaEksTUFBTSxhQUFhLEdBQStCLElBQUEsZUFBSyxFQUN0RCxJQUFBLDRDQUFzQixFQUFDLG9CQUFvQixDQUFDLEVBQzVDLDZCQUE2QixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsYUFBYSxDQUFDLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztZQUV0RSxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRW5GLE1BQU0sb0JBQW9CLEdBQUcsdUJBQXVCO2dCQUNuRCxDQUFDLENBQUMsMkJBQTJCLENBQUMsV0FBVyxDQUFDLElBQUkscUNBQWlCLENBQUMsQ0FBQywrQkFBa0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7Z0JBQy9HLENBQUMsQ0FBQywyQkFBMkIsQ0FBQztZQUUvQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFDNUcsYUFBYSxFQUNiO2dCQUNDLGFBQWEsRUFBRSwyQ0FBd0IsQ0FBQywwQkFBMEIsQ0FBQztvQkFDbEUscUNBQWlCLENBQUMsRUFBRTtvQkFDcEIsdUNBQWtCLENBQUMsRUFBRTtvQkFDckIsbUNBQXFCLENBQUMsRUFBRTtvQkFDeEIsNkJBQWEsQ0FBQyxFQUFFO29CQUNoQixxREFBZ0M7aUJBQ2hDLENBQUM7Z0JBQ0YsY0FBYyxFQUFFLElBQUk7YUFDcEIsQ0FBQyxDQUFDLENBQUM7WUFFTCxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2xFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDZCQUE2QixDQUFDO29CQUN4RCxDQUFDLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDO29CQUNsRCxNQUFNLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBd0IsNkJBQTZCLENBQUMsQ0FBQztvQkFDakgsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFvRCx1QkFBdUIsQ0FBQyxDQUFDO29CQUNqSSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQzt3QkFDOUIsb0JBQW9CO3dCQUNwQixjQUFjO3FCQUNkLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbkYsTUFBTSxXQUFXLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTNDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0I7WUFFckcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFO2dCQUMxRCxJQUFJLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRTtnQkFDekQsSUFBSSxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQUMsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFTCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sMEJBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsK0RBQStELENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN00sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLCtCQUFzQixJQUFJLENBQUMsc0JBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVyTSxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN6QyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckQsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRTtvQkFDdkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDdkUsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQzt3QkFBQyxPQUFPO29CQUFDLENBQUM7b0JBQzdELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3ZDLGtCQUFrQixHQUFHLE9BQU8sQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxNQUFNLHdCQUF3QixHQUFHO2dCQUNoQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsY0FBYztnQkFDakQsT0FBTyxFQUFFLGtCQUFrQixDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxpQkFBaUIsSUFBSSxFQUFFO2dCQUM3RCxjQUFjLEVBQUUsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFBLHNDQUF5QixFQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM1SCxxQkFBcUIsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMscUJBQXFCO2FBQ2pFLENBQUM7WUFFRixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7WUFFbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ2pLLGlCQUFpQixFQUFFLHVCQUF1QixFQUFFLEVBQUU7Z0JBQzlDLGlCQUFpQixFQUFFLHdCQUF3QixDQUFDLGlCQUFpQjtnQkFDN0Qsc0JBQXNCLEVBQUUsQ0FBQyxLQUFpQixFQUFFLFFBQWtCLEVBQUUsUUFBcUMsRUFBRSxFQUFFO29CQUN4RyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBRS9CLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQzlDLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxFQUFFLG9CQUFvQixHQUFHLENBQUMsQ0FBQztvQkFFcEQsSUFBSSx3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDN0MsTUFBTSxVQUFVLEdBQUcsSUFBQSwwQkFBYSxFQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsd0JBQXdCLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDckcsaUJBQWlCLEdBQUcsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO3dCQUNqRCxvQkFBb0IsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxvQkFBb0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3pFLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDO29CQUM5RCxDQUFDO29CQUVELCtGQUErRjtvQkFDL0YsSUFBSSxDQUFDLHdCQUF3QixDQUFDLHFCQUFxQixJQUFJLGlCQUFpQixHQUFHLENBQUMsSUFBSSx3QkFBd0IsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN6SyxPQUFPLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDO29CQUM1QixDQUFDO29CQUVELE9BQU87d0JBQ04sV0FBVyxFQUFFLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQTRCLEVBQUU7NEJBQzlGLElBQUksS0FBYSxDQUFDOzRCQUNsQixJQUFJLElBQW1ELENBQUM7NEJBQ3hELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0NBQ2hDLEtBQUssR0FBRyxNQUFNLENBQUM7NEJBQ2hCLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQ0FDckIsSUFBSSxHQUFHLE1BQU0sQ0FBQzs0QkFDZixDQUFDOzRCQUVELE9BQU87Z0NBQ04sS0FBSztnQ0FDTCxVQUFVLEVBQUUsS0FBSztnQ0FDakIsS0FBSyxFQUFFLGFBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFFBQVEsQ0FBQztnQ0FDM0UsUUFBUSxFQUFFLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0NBQ2pELElBQUksK0NBQXNDO2dDQUMxQyxHQUFHLElBQUk7NkJBQ1AsQ0FBQzt3QkFDSCxDQUFDLENBQUM7cUJBQ0YsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVTLDBCQUEwQixDQUFDLGtCQUFzQztZQUMxRSxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU0sZUFBZSxDQUFDLEtBQWE7WUFDbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU0sUUFBUSxDQUFDLEdBQVc7WUFDMUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLDZCQUFhLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVPLEtBQUssQ0FBQyxjQUFrRDtZQUMvRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxJQUFBLDZCQUFhLEVBQUMsY0FBYyxDQUFDLGVBQWUsSUFBSSwrQkFBZSxDQUFDLENBQUM7WUFDL0csSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGNBQWMsQ0FBQyxlQUFlLElBQUksK0JBQWUsQ0FBQyxDQUFDO1lBQ3JHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFBLDZCQUFhLEVBQUMsY0FBYyxDQUFDLDBCQUEwQixJQUFJLDBDQUEwQixDQUFDLENBQUM7WUFDMUgsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ2hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztZQUNsRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFBLHdDQUF3QixFQUFDLGNBQWMsQ0FBQyxXQUFXLElBQUksMkJBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUU3SCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFtQixDQUFDO1lBQzNGLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGNBQWMsQ0FBQyxlQUFlLElBQUksK0JBQWUsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7UUFDRixDQUFDO1FBRU0sS0FBSyxDQUFDLFNBQW1CO1lBQy9CLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFekIsSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFFTSxNQUFNO1lBQ1osSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU0sTUFBTSxDQUFDLFNBQW9CO1lBQ2pDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDL0QsQ0FBQztRQUVPLFNBQVM7WUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUM7S0FDRCxDQUFBO0lBL05ZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBMkI3QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixZQUFBLHFDQUFxQixDQUFBO09BL0JYLG1CQUFtQixDQStOL0I7SUFZTSxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLG1CQUFtQjtRQUd0RSxZQUNDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQWlDLEVBQzlGLG9CQUEyQyxFQUNuRCxZQUEyQixFQUN0QixpQkFBcUMsRUFDL0IsdUJBQWlELEVBQ3BELG9CQUEyQztZQUVsRSxLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsdUJBQXVCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUN2TCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksMEJBQWdCLENBQVMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxZQUFZO1lBQ2xCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM5QixJQUFJLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVNLGFBQWE7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNyQixDQUFDO1lBRUQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQy9CLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxHQUFHLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzlELENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRU0saUJBQWlCO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckIsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3ZDLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsUUFBUSxHQUFHLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDOUUsQ0FBQztZQUVELElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVELENBQUM7UUFDRixDQUFDO1FBRU0sWUFBWTtZQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTyxlQUFlO1lBQ3RCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNuQixZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNyQixDQUFDO1lBQ0QsT0FBTyxZQUFZLENBQUM7UUFDckIsQ0FBQztRQUVPLGdCQUFnQjtZQUN2QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN4RCxDQUFDO1FBRU8sWUFBWTtZQUNuQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztLQUNELENBQUE7SUEzRVksd0VBQThCOzZDQUE5Qiw4QkFBOEI7UUFLeEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVRYLDhCQUE4QixDQTJFMUM7SUFFTSxJQUFNLDJDQUEyQyxHQUFqRCxNQUFNLDJDQUE0QyxTQUFRLDhCQUE4QjtRQUc5RixZQUNDLE9BQXNDLEVBQ2Ysb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ3RCLGlCQUFxQyxFQUMvQix1QkFBaUQsRUFDcEQsb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFLHVCQUF1QixFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFckgsTUFBTSxFQUFFLG9DQUFvQyxFQUFFLG1DQUFtQyxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUMxRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMseUJBQXlCLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7Z0JBQzFFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFHLENBQUM7Z0JBQ3BELE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakcsb0NBQW9DLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLEtBQUssQ0FBQyxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLG1DQUFtQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsVUFBVSxLQUFLLGNBQWMsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLFdBQVcsQ0FBQyxDQUFDO1lBQzVILENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRWtCLDBCQUEwQixDQUFDLGlCQUFxQztZQUNsRixNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzdGLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHNFQUF5QyxFQUM3RSx1QkFBdUIsRUFDdkIsSUFBSSxDQUNKLENBQUMsQ0FBQztZQUVILE9BQU8sdUJBQXVCLENBQUM7UUFDaEMsQ0FBQztLQUNELENBQUE7SUFqQ1ksa0dBQTJDOzBEQUEzQywyQ0FBMkM7UUFLckQsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVRYLDJDQUEyQyxDQWlDdkQ7SUFFRCxtQ0FBbUM7SUFDbkMsSUFBQSx5Q0FBMEIsRUFBQyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtRQUMvQyxNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsbUNBQW1CLENBQUMsQ0FBQztRQUVyRSxJQUFJLHdCQUF3QixFQUFFLENBQUM7WUFDOUIsaUNBQWlDO1lBQ2pDLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQywrQkFBZSxDQUFDLENBQUM7WUFDN0QsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQixTQUFTLENBQUMsT0FBTyxDQUFDLDhFQUE4RSxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdJLENBQUM7WUFFRCx1QkFBdUI7WUFDdkIsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLCtCQUFlLENBQUMsQ0FBQztZQUM3RCxJQUFJLG9CQUFvQixFQUFFLENBQUM7Z0JBQzFCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUZBQXlGLG9CQUFvQixLQUFLLENBQUMsQ0FBQztZQUN2SSxDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQywrQkFBZSxDQUFDLENBQUM7WUFDeEQsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsU0FBUyxDQUFDLE9BQU8sQ0FBQywwRUFBMEUsZUFBZSxNQUFNLENBQUMsQ0FBQztZQUNwSCxDQUFDO1lBQ0QsU0FBUyxDQUFDLE9BQU8sQ0FBQyx1RkFBdUYsd0JBQXdCLEtBQUssQ0FBQyxDQUFDO1FBQ3pJLENBQUM7YUFBTSxDQUFDO1lBQ1AsK0VBQStFO1lBQy9FLFNBQVMsQ0FBQyxPQUFPLENBQUMsdUZBQXVGLEtBQUssQ0FBQyxRQUFRLENBQUMseUNBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUosQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBR0gsU0FBUyw2QkFBNkIsQ0FBQyxTQUFrQjtRQUN4RCxPQUFPO1lBQ04sUUFBUSxFQUFFLEVBQUU7WUFDWixVQUFVLEVBQUUsRUFBRTtZQUNkLFFBQVEsRUFBRSxLQUFLO1lBQ2YsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRztZQUNsQyxnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLE1BQU0sRUFBRTtnQkFDUCxXQUFXLEVBQUUsS0FBSzthQUNsQjtZQUNELFdBQVcsRUFBRSxDQUFDO1lBQ2QsVUFBVSxFQUFFLDJCQUFtQjtZQUMvQixTQUFTLEVBQUUsU0FBUyxJQUFJLEVBQUU7WUFDMUIsa0JBQWtCLEVBQUUsTUFBTTtZQUMxQixPQUFPLEVBQUUsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUU7WUFDcEQsbUJBQW1CLEVBQUUsT0FBTztTQUM1QixDQUFDO0lBQ0gsQ0FBQyJ9