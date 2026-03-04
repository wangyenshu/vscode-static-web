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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/button/button", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/debug/common/debug", "vs/css!./media/breakpointWidget"], function (require, exports, dom, keyboardEvent_1, button_1, selectBox_1, errors_1, lifecycle, uri_1, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, position_1, range_1, editorContextKeys_1, modesRegistry_1, languageFeatures_1, model_1, resolverService_1, suggest_1, zoneWidget_1, nls, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, keybinding_1, label_1, defaultStyles_1, colorRegistry_1, themeService_1, simpleEditorOptions_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakpointWidget = void 0;
    const $ = dom.$;
    const IPrivateBreakpointWidgetService = (0, instantiation_1.createDecorator)('privateBreakpointWidgetService');
    const DECORATION_KEY = 'breakpointwidgetdecoration';
    function isPositionInCurlyBracketBlock(input) {
        const model = input.getModel();
        const bracketPairs = model.bracketPairs.getBracketPairsInRange(range_1.Range.fromPositions(input.getPosition()));
        return bracketPairs.some(p => p.openingBracketInfo.bracketText === '{');
    }
    function createDecorations(theme, placeHolder) {
        const transparentForeground = theme.getColor(colorRegistry_1.editorForeground)?.transparent(0.4);
        return [{
                range: {
                    startLineNumber: 0,
                    endLineNumber: 0,
                    startColumn: 0,
                    endColumn: 1
                },
                renderOptions: {
                    after: {
                        contentText: placeHolder,
                        color: transparentForeground ? transparentForeground.toString() : undefined
                    }
                }
            }];
    }
    let BreakpointWidget = class BreakpointWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, lineNumber, column, context, contextViewService, debugService, themeService, contextKeyService, instantiationService, modelService, codeEditorService, _configurationService, languageFeaturesService, keybindingService, labelService, textModelService) {
            super(editor, { showFrame: true, showArrow: false, frameWidth: 1, isAccessible: true });
            this.lineNumber = lineNumber;
            this.column = column;
            this.contextViewService = contextViewService;
            this.debugService = debugService;
            this.themeService = themeService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.codeEditorService = codeEditorService;
            this._configurationService = _configurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.keybindingService = keybindingService;
            this.labelService = labelService;
            this.textModelService = textModelService;
            this.conditionInput = '';
            this.hitCountInput = '';
            this.logMessageInput = '';
            this.toDispose = [];
            const model = this.editor.getModel();
            if (model) {
                const uri = model.uri;
                const breakpoints = this.debugService.getModel().getBreakpoints({ lineNumber: this.lineNumber, column: this.column, uri });
                this.breakpoint = breakpoints.length ? breakpoints[0] : undefined;
            }
            if (context === undefined) {
                if (this.breakpoint && !this.breakpoint.condition && !this.breakpoint.hitCondition && this.breakpoint.logMessage) {
                    this.context = 2 /* Context.LOG_MESSAGE */;
                }
                else if (this.breakpoint && !this.breakpoint.condition && this.breakpoint.hitCondition) {
                    this.context = 1 /* Context.HIT_COUNT */;
                }
                else if (this.breakpoint && this.breakpoint.triggeredBy) {
                    this.context = 3 /* Context.TRIGGER_POINT */;
                }
                else {
                    this.context = 0 /* Context.CONDITION */;
                }
            }
            else {
                this.context = context;
            }
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(e => {
                if (this.breakpoint && e && e.removed && e.removed.indexOf(this.breakpoint) >= 0) {
                    this.dispose();
                }
            }));
            this.codeEditorService.registerDecorationType('breakpoint-widget', DECORATION_KEY, {});
            this.create();
        }
        get placeholder() {
            const acceptString = this.keybindingService.lookupKeybinding(AcceptBreakpointWidgetInputAction.ID)?.getLabel() || 'Enter';
            const closeString = this.keybindingService.lookupKeybinding(CloseBreakpointWidgetCommand.ID)?.getLabel() || 'Escape';
            switch (this.context) {
                case 2 /* Context.LOG_MESSAGE */:
                    return nls.localize('breakpointWidgetLogMessagePlaceholder', "Message to log when breakpoint is hit. Expressions within {} are interpolated. '{0}' to accept, '{1}' to cancel.", acceptString, closeString);
                case 1 /* Context.HIT_COUNT */:
                    return nls.localize('breakpointWidgetHitCountPlaceholder', "Break when hit count condition is met. '{0}' to accept, '{1}' to cancel.", acceptString, closeString);
                default:
                    return nls.localize('breakpointWidgetExpressionPlaceholder', "Break when expression evaluates to true. '{0}' to accept, '{1}' to cancel.", acceptString, closeString);
            }
        }
        getInputValue(breakpoint) {
            switch (this.context) {
                case 2 /* Context.LOG_MESSAGE */:
                    return breakpoint && breakpoint.logMessage ? breakpoint.logMessage : this.logMessageInput;
                case 1 /* Context.HIT_COUNT */:
                    return breakpoint && breakpoint.hitCondition ? breakpoint.hitCondition : this.hitCountInput;
                default:
                    return breakpoint && breakpoint.condition ? breakpoint.condition : this.conditionInput;
            }
        }
        rememberInput() {
            if (this.context !== 3 /* Context.TRIGGER_POINT */) {
                const value = this.input.getModel().getValue();
                switch (this.context) {
                    case 2 /* Context.LOG_MESSAGE */:
                        this.logMessageInput = value;
                        break;
                    case 1 /* Context.HIT_COUNT */:
                        this.hitCountInput = value;
                        break;
                    default:
                        this.conditionInput = value;
                }
            }
        }
        setInputMode() {
            if (this.editor.hasModel()) {
                // Use plaintext language for log messages, otherwise respect underlying editor language #125619
                const languageId = this.context === 2 /* Context.LOG_MESSAGE */ ? modesRegistry_1.PLAINTEXT_LANGUAGE_ID : this.editor.getModel().getLanguageId();
                this.input.getModel().setLanguage(languageId);
            }
        }
        show(rangeOrPos) {
            const lineNum = this.input.getModel().getLineCount();
            super.show(rangeOrPos, lineNum + 1);
        }
        fitHeightToContent() {
            const lineNum = this.input.getModel().getLineCount();
            this._relayout(lineNum + 1);
        }
        _fillContainer(container) {
            this.setCssClass('breakpoint-widget');
            const selectBox = new selectBox_1.SelectBox([
                { text: nls.localize('expression', "Expression") },
                { text: nls.localize('hitCount', "Hit Count") },
                { text: nls.localize('logMessage', "Log Message") },
                { text: nls.localize('triggeredBy', "Wait for Breakpoint") },
            ], this.context, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: nls.localize('breakpointType', 'Breakpoint Type') });
            this.selectContainer = $('.breakpoint-select-container');
            selectBox.render(dom.append(container, this.selectContainer));
            selectBox.onDidSelect(e => {
                this.rememberInput();
                this.context = e.index;
                this.updateContextInput();
            });
            this.createModesInput(container);
            this.inputContainer = $('.inputContainer');
            this.createBreakpointInput(dom.append(container, this.inputContainer));
            this.input.getModel().setValue(this.getInputValue(this.breakpoint));
            this.toDispose.push(this.input.getModel().onDidChangeContent(() => {
                this.fitHeightToContent();
            }));
            this.input.setPosition({ lineNumber: 1, column: this.input.getModel().getLineMaxColumn(1) });
            this.createTriggerBreakpointInput(container);
            this.updateContextInput();
            // Due to an electron bug we have to do the timeout, otherwise we do not get focus
            setTimeout(() => this.focusInput(), 150);
        }
        createModesInput(container) {
            const modes = this.debugService.getModel().getBreakpointModes('source');
            if (modes.length <= 1) {
                return;
            }
            const sb = this.selectModeBox = new selectBox_1.SelectBox([
                { text: nls.localize('bpMode', 'Mode'), isDisabled: true },
                ...modes.map(mode => ({ text: mode.label, description: mode.description })),
            ], modes.findIndex(m => m.mode === this.breakpoint?.mode) + 1, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles);
            this.toDispose.push(sb);
            this.toDispose.push(sb.onDidSelect(e => {
                this.modeInput = modes[e.index - 1];
            }));
            const modeWrapper = $('.select-mode-container');
            const selectionWrapper = $('.select-box-container');
            dom.append(modeWrapper, selectionWrapper);
            sb.render(selectionWrapper);
            dom.append(container, modeWrapper);
        }
        createTriggerBreakpointInput(container) {
            const breakpoints = this.debugService.getModel().getBreakpoints().filter(bp => bp !== this.breakpoint);
            const breakpointOptions = [
                { text: nls.localize('noTriggerByBreakpoint', 'None'), isDisabled: true },
                ...breakpoints.map(bp => ({
                    text: `${this.labelService.getUriLabel(bp.uri, { relative: true })}: ${bp.lineNumber}`,
                    description: nls.localize('triggerByLoading', 'Loading...')
                })),
            ];
            const index = breakpoints.findIndex((bp) => this.breakpoint?.triggeredBy === bp.getId());
            for (const [i, bp] of breakpoints.entries()) {
                this.textModelService.createModelReference(bp.uri).then(ref => {
                    try {
                        breakpointOptions[i + 1].description = ref.object.textEditorModel.getLineContent(bp.lineNumber).trim();
                    }
                    finally {
                        ref.dispose();
                    }
                }).catch(() => {
                    breakpointOptions[i + 1].description = nls.localize('noBpSource', 'Could not load source.');
                });
            }
            const selectBreakpointBox = this.selectBreakpointBox = new selectBox_1.SelectBox(breakpointOptions, index + 1, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: nls.localize('selectBreakpoint', 'Select breakpoint') });
            selectBreakpointBox.onDidSelect(e => {
                if (e.index === 0) {
                    this.triggeredByBreakpointInput = undefined;
                }
                else {
                    this.triggeredByBreakpointInput = breakpoints[e.index - 1];
                }
            });
            this.toDispose.push(selectBreakpointBox);
            this.selectBreakpointContainer = $('.select-breakpoint-container');
            this.toDispose.push(dom.addDisposableListener(this.selectBreakpointContainer, dom.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(9 /* KeyCode.Escape */)) {
                    this.close(false);
                }
            }));
            const selectionWrapper = $('.select-box-container');
            dom.append(this.selectBreakpointContainer, selectionWrapper);
            selectBreakpointBox.render(selectionWrapper);
            dom.append(container, this.selectBreakpointContainer);
            const closeButton = new button_1.Button(this.selectBreakpointContainer, defaultStyles_1.defaultButtonStyles);
            closeButton.label = nls.localize('ok', "Ok");
            this.toDispose.push(closeButton.onDidClick(() => this.close(true)));
            this.toDispose.push(closeButton);
        }
        updateContextInput() {
            if (this.context === 3 /* Context.TRIGGER_POINT */) {
                this.inputContainer.hidden = true;
                this.selectBreakpointContainer.hidden = false;
            }
            else {
                this.inputContainer.hidden = false;
                this.selectBreakpointContainer.hidden = true;
                this.setInputMode();
                const value = this.getInputValue(this.breakpoint);
                this.input.getModel().setValue(value);
                this.focusInput();
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            this.heightInPx = heightInPixel;
            this.input.layout({ height: heightInPixel, width: widthInPixel - 113 });
            this.centerInputVertically();
        }
        _onWidth(widthInPixel) {
            if (typeof this.heightInPx === 'number') {
                this._doLayout(this.heightInPx, widthInPixel);
            }
        }
        createBreakpointInput(container) {
            const scopedContextKeyService = this.contextKeyService.createScoped(container);
            this.toDispose.push(scopedContextKeyService);
            const scopedInstatiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService], [IPrivateBreakpointWidgetService, this]));
            const options = this.createEditorOptions();
            const codeEditorWidgetOptions = (0, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions)();
            this.input = scopedInstatiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, options, codeEditorWidgetOptions);
            debug_1.CONTEXT_IN_BREAKPOINT_WIDGET.bindTo(scopedContextKeyService).set(true);
            const model = this.modelService.createModel('', null, uri_1.URI.parse(`${debug_1.DEBUG_SCHEME}:${this.editor.getId()}:breakpointinput`), true);
            if (this.editor.hasModel()) {
                model.setLanguage(this.editor.getModel().getLanguageId());
            }
            this.input.setModel(model);
            this.setInputMode();
            this.toDispose.push(model);
            const setDecorations = () => {
                const value = this.input.getModel().getValue();
                const decorations = !!value ? [] : createDecorations(this.themeService.getColorTheme(), this.placeholder);
                this.input.setDecorationsByType('breakpoint-widget', DECORATION_KEY, decorations);
            };
            this.input.getModel().onDidChangeContent(() => setDecorations());
            this.themeService.onDidColorThemeChange(() => setDecorations());
            this.toDispose.push(this.languageFeaturesService.completionProvider.register({ scheme: debug_1.DEBUG_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'breakpointWidget',
                provideCompletionItems: (model, position, _context, token) => {
                    let suggestionsPromise;
                    const underlyingModel = this.editor.getModel();
                    if (underlyingModel && (this.context === 0 /* Context.CONDITION */ || (this.context === 2 /* Context.LOG_MESSAGE */ && isPositionInCurlyBracketBlock(this.input)))) {
                        suggestionsPromise = (0, suggest_1.provideSuggestionItems)(this.languageFeaturesService.completionProvider, underlyingModel, new position_1.Position(this.lineNumber, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* CompletionItemKind.Snippet */)), _context, token).then(suggestions => {
                            let overwriteBefore = 0;
                            if (this.context === 0 /* Context.CONDITION */) {
                                overwriteBefore = position.column - 1;
                            }
                            else {
                                // Inside the currly brackets, need to count how many useful characters are behind the position so they would all be taken into account
                                const value = this.input.getModel().getValue();
                                while ((position.column - 2 - overwriteBefore >= 0) && value[position.column - 2 - overwriteBefore] !== '{' && value[position.column - 2 - overwriteBefore] !== ' ') {
                                    overwriteBefore++;
                                }
                            }
                            return {
                                suggestions: suggestions.items.map(s => {
                                    s.completion.range = range_1.Range.fromPositions(position.delta(0, -overwriteBefore), position);
                                    return s.completion;
                                })
                            };
                        });
                    }
                    else {
                        suggestionsPromise = Promise.resolve({ suggestions: [] });
                    }
                    return suggestionsPromise;
                }
            }));
            this.toDispose.push(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.fontSize') || e.affectsConfiguration('editor.lineHeight')) {
                    this.input.updateOptions(this.createEditorOptions());
                    this.centerInputVertically();
                }
            }));
        }
        createEditorOptions() {
            const editorConfig = this._configurationService.getValue('editor');
            const options = (0, simpleEditorOptions_1.getSimpleEditorOptions)(this._configurationService);
            options.fontSize = editorConfig.fontSize;
            options.fontFamily = editorConfig.fontFamily;
            options.lineHeight = editorConfig.lineHeight;
            options.fontLigatures = editorConfig.fontLigatures;
            options.ariaLabel = this.placeholder;
            return options;
        }
        centerInputVertically() {
            if (this.container && typeof this.heightInPx === 'number') {
                const lineHeight = this.input.getOption(67 /* EditorOption.lineHeight */);
                const lineNum = this.input.getModel().getLineCount();
                const newTopMargin = (this.heightInPx - lineNum * lineHeight) / 2;
                this.inputContainer.style.marginTop = newTopMargin + 'px';
            }
        }
        close(success) {
            if (success) {
                // if there is already a breakpoint on this location - remove it.
                let condition = this.breakpoint?.condition;
                let hitCondition = this.breakpoint?.hitCondition;
                let logMessage = this.breakpoint?.logMessage;
                let triggeredBy = this.breakpoint?.triggeredBy;
                let mode = this.breakpoint?.mode;
                let modeLabel = this.breakpoint?.modeLabel;
                this.rememberInput();
                if (this.conditionInput || this.context === 0 /* Context.CONDITION */) {
                    condition = this.conditionInput;
                }
                if (this.hitCountInput || this.context === 1 /* Context.HIT_COUNT */) {
                    hitCondition = this.hitCountInput;
                }
                if (this.logMessageInput || this.context === 2 /* Context.LOG_MESSAGE */) {
                    logMessage = this.logMessageInput;
                }
                if (this.selectModeBox) {
                    mode = this.modeInput?.mode;
                    modeLabel = this.modeInput?.label;
                }
                if (this.context === 3 /* Context.TRIGGER_POINT */) {
                    // currently, trigger points don't support additional conditions:
                    condition = undefined;
                    hitCondition = undefined;
                    logMessage = undefined;
                    triggeredBy = this.triggeredByBreakpointInput?.getId();
                }
                if (this.breakpoint) {
                    const data = new Map();
                    data.set(this.breakpoint.getId(), {
                        condition,
                        hitCondition,
                        logMessage,
                        triggeredBy,
                        mode,
                        modeLabel,
                    });
                    this.debugService.updateBreakpoints(this.breakpoint.originalUri, data, false).then(undefined, errors_1.onUnexpectedError);
                }
                else {
                    const model = this.editor.getModel();
                    if (model) {
                        this.debugService.addBreakpoints(model.uri, [{
                                lineNumber: this.lineNumber,
                                column: this.column,
                                enabled: true,
                                condition,
                                hitCondition,
                                logMessage,
                                triggeredBy,
                                mode,
                                modeLabel,
                            }]);
                    }
                }
            }
            this.dispose();
        }
        focusInput() {
            if (this.context === 3 /* Context.TRIGGER_POINT */) {
                this.selectBreakpointBox.focus();
            }
            else {
                this.input.focus();
            }
        }
        dispose() {
            super.dispose();
            this.input.dispose();
            lifecycle.dispose(this.toDispose);
            setTimeout(() => this.editor.focus(), 0);
        }
    };
    exports.BreakpointWidget = BreakpointWidget;
    exports.BreakpointWidget = BreakpointWidget = __decorate([
        __param(4, contextView_1.IContextViewService),
        __param(5, debug_1.IDebugService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, model_1.IModelService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, languageFeatures_1.ILanguageFeaturesService),
        __param(13, keybinding_1.IKeybindingService),
        __param(14, label_1.ILabelService),
        __param(15, resolverService_1.ITextModelService)
    ], BreakpointWidget);
    class AcceptBreakpointWidgetInputAction extends editorExtensions_1.EditorCommand {
        static { this.ID = 'breakpointWidget.action.acceptInput'; }
        constructor() {
            super({
                id: AcceptBreakpointWidgetInputAction.ID,
                precondition: debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE,
                kbOpts: {
                    kbExpr: debug_1.CONTEXT_IN_BREAKPOINT_WIDGET,
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            accessor.get(IPrivateBreakpointWidgetService).close(true);
        }
    }
    class CloseBreakpointWidgetCommand extends editorExtensions_1.EditorCommand {
        static { this.ID = 'closeBreakpointWidget'; }
        constructor() {
            super({
                id: CloseBreakpointWidgetCommand.ID,
                precondition: debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 9 /* KeyCode.Escape */,
                    secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor, args) {
            const debugContribution = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID);
            if (debugContribution) {
                // if focus is in outer editor we need to use the debug contribution to close
                return debugContribution.closeBreakpointWidget();
            }
            accessor.get(IPrivateBreakpointWidgetService).close(false);
        }
    }
    (0, editorExtensions_1.registerEditorCommand)(new AcceptBreakpointWidgetInputAction());
    (0, editorExtensions_1.registerEditorCommand)(new CloseBreakpointWidgetCommand());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvYnJlYWtwb2ludFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0Q2hHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDaEIsTUFBTSwrQkFBK0IsR0FBRyxJQUFBLCtCQUFlLEVBQWtDLGdDQUFnQyxDQUFDLENBQUM7SUFLM0gsTUFBTSxjQUFjLEdBQUcsNEJBQTRCLENBQUM7SUFFcEQsU0FBUyw2QkFBNkIsQ0FBQyxLQUF3QjtRQUM5RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0IsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxhQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekcsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLFdBQVcsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFrQixFQUFFLFdBQW1CO1FBQ2pFLE1BQU0scUJBQXFCLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxnQ0FBZ0IsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRixPQUFPLENBQUM7Z0JBQ1AsS0FBSyxFQUFFO29CQUNOLGVBQWUsRUFBRSxDQUFDO29CQUNsQixhQUFhLEVBQUUsQ0FBQztvQkFDaEIsV0FBVyxFQUFFLENBQUM7b0JBQ2QsU0FBUyxFQUFFLENBQUM7aUJBQ1o7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLEtBQUssRUFBRTt3QkFDTixXQUFXLEVBQUUsV0FBVzt3QkFDeEIsS0FBSyxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUztxQkFDM0U7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7SUFDSixDQUFDO0lBRU0sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSx1QkFBVTtRQW1CL0MsWUFBWSxNQUFtQixFQUFVLFVBQWtCLEVBQVUsTUFBMEIsRUFBRSxPQUE0QixFQUN2RyxrQkFBd0QsRUFDOUQsWUFBNEMsRUFDNUMsWUFBNEMsRUFDdkMsaUJBQXNELEVBQ25ELG9CQUE0RCxFQUNwRSxZQUE0QyxFQUN2QyxpQkFBc0QsRUFDbkQscUJBQTZELEVBQzFELHVCQUFrRSxFQUN4RSxpQkFBc0QsRUFDM0QsWUFBNEMsRUFDeEMsZ0JBQW9EO1lBRXZFLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQWRoRCxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBb0I7WUFDeEQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM3QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMzQixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN0QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDdEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNsQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3pDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDdkQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMxQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN2QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBckJoRSxtQkFBYyxHQUFHLEVBQUUsQ0FBQztZQUNwQixrQkFBYSxHQUFHLEVBQUUsQ0FBQztZQUNuQixvQkFBZSxHQUFHLEVBQUUsQ0FBQztZQXVCNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDcEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7Z0JBQ3RCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDM0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNuRSxDQUFDO1lBRUQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzNCLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDbEgsSUFBSSxDQUFDLE9BQU8sOEJBQXNCLENBQUM7Z0JBQ3BDLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDMUYsSUFBSSxDQUFDLE9BQU8sNEJBQW9CLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzNELElBQUksQ0FBQyxPQUFPLGdDQUF3QixDQUFDO2dCQUN0QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLE9BQU8sNEJBQW9CLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDeEIsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzNFLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ2xGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFZLFdBQVc7WUFDdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLGlDQUFpQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLE9BQU8sQ0FBQztZQUMxSCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsNEJBQTRCLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksUUFBUSxDQUFDO1lBQ3JILFFBQVEsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QjtvQkFDQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsa0hBQWtILEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM3TTtvQkFDQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMscUNBQXFDLEVBQUUsMEVBQTBFLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNuSztvQkFDQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsNEVBQTRFLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3hLLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYSxDQUFDLFVBQW1DO1lBQ3hELFFBQVEsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QjtvQkFDQyxPQUFPLFVBQVUsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUMzRjtvQkFDQyxPQUFPLFVBQVUsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUM3RjtvQkFDQyxPQUFPLFVBQVUsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQ3pGLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYTtZQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLGtDQUEwQixFQUFFLENBQUM7Z0JBQzVDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQy9DLFFBQVEsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN0Qjt3QkFDQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQzt3QkFDN0IsTUFBTTtvQkFDUDt3QkFDQyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQzt3QkFDM0IsTUFBTTtvQkFDUDt3QkFDQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWTtZQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDNUIsZ0dBQWdHO2dCQUNoRyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxnQ0FBd0IsQ0FBQyxDQUFDLENBQUMscUNBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pILElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDRixDQUFDO1FBRVEsSUFBSSxDQUFDLFVBQThCO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckQsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxrQkFBa0I7WUFDakIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRVMsY0FBYyxDQUFDLFNBQXNCO1lBQzlDLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQXNCO2dCQUNwRCxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsRUFBRTtnQkFDbEQsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEVBQUU7Z0JBQy9DLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxFQUFFO2dCQUNuRCxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFO2FBQzVELEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsc0NBQXNCLEVBQUUsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNwSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3pELFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDekIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWpDLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBRXZFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTdGLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU3QyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMxQixrRkFBa0Y7WUFDbEYsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsU0FBc0I7WUFDOUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RSxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLHFCQUFTLENBQzVDO2dCQUNDLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7Z0JBQzFELEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7YUFDM0UsRUFDRCxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFDMUQsSUFBSSxDQUFDLGtCQUFrQixFQUN2QixzQ0FBc0IsQ0FDdEIsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDcEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMxQyxFQUFFLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDNUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVPLDRCQUE0QixDQUFDLFNBQXNCO1lBQzFELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2RyxNQUFNLGlCQUFpQixHQUF3QjtnQkFDOUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO2dCQUN6RSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN6QixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRTtvQkFDdEYsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsWUFBWSxDQUFDO2lCQUMzRCxDQUFDLENBQUM7YUFDSCxDQUFDO1lBRUYsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLEtBQUssRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDekYsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDN0QsSUFBSSxDQUFDO3dCQUNKLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDeEcsQ0FBQzs0QkFBUyxDQUFDO3dCQUNWLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7b0JBQ2IsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO2dCQUM3RixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLHFCQUFTLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsc0NBQXNCLEVBQUUsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxTixtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25DLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLDBCQUEwQixHQUFHLFNBQVMsQ0FBQztnQkFDN0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQywwQkFBMEIsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDekcsTUFBTSxLQUFLLEdBQUcsSUFBSSxxQ0FBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxLQUFLLENBQUMsTUFBTSx3QkFBZ0IsRUFBRSxDQUFDO29CQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDcEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM3RCxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUU3QyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUV0RCxNQUFNLFdBQVcsR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsbUNBQW1CLENBQUMsQ0FBQztZQUNwRixXQUFXLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixJQUFJLElBQUksQ0FBQyxPQUFPLGtDQUEwQixFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDL0MsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDbkMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFFa0IsU0FBUyxDQUFDLGFBQXFCLEVBQUUsWUFBb0I7WUFDdkUsSUFBSSxDQUFDLFVBQVUsR0FBRyxhQUFhLENBQUM7WUFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxZQUFZLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRWtCLFFBQVEsQ0FBQyxZQUFvQjtZQUMvQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCLENBQUMsU0FBc0I7WUFDbkQsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFFN0MsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLElBQUkscUNBQWlCLENBQzVGLENBQUMsK0JBQWtCLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQyxNQUFNLHVCQUF1QixHQUFHLElBQUEsc0RBQWdDLEdBQUUsQ0FBQztZQUNuRSxJQUFJLENBQUMsS0FBSyxHQUFzQix5QkFBeUIsQ0FBQyxjQUFjLENBQUMsbUNBQWdCLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3hJLG9DQUE0QixDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxvQkFBWSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO2dCQUMzQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMxRyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNuRixDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBRWhFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsb0JBQVksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDbEksaUJBQWlCLEVBQUUsa0JBQWtCO2dCQUNyQyxzQkFBc0IsRUFBRSxDQUFDLEtBQWlCLEVBQUUsUUFBa0IsRUFBRSxRQUEyQixFQUFFLEtBQXdCLEVBQTJCLEVBQUU7b0JBQ2pKLElBQUksa0JBQTJDLENBQUM7b0JBQ2hELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQy9DLElBQUksZUFBZSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sOEJBQXNCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxnQ0FBd0IsSUFBSSw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3BKLGtCQUFrQixHQUFHLElBQUEsZ0NBQXNCLEVBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxJQUFJLG1CQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLDJCQUFpQixDQUFDLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBc0IsQ0FBQyxHQUFHLHFDQUE0QixDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFFcFIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDOzRCQUN4QixJQUFJLElBQUksQ0FBQyxPQUFPLDhCQUFzQixFQUFFLENBQUM7Z0NBQ3hDLGVBQWUsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQzs0QkFDdkMsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLHVJQUF1STtnQ0FDdkksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQ0FDL0MsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLGVBQWUsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsZUFBZSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxlQUFlLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztvQ0FDckssZUFBZSxFQUFFLENBQUM7Z0NBQ25CLENBQUM7NEJBQ0YsQ0FBQzs0QkFFRCxPQUFPO2dDQUNOLFdBQVcsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQ0FDdEMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsYUFBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29DQUN4RixPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0NBQ3JCLENBQUMsQ0FBQzs2QkFDRixDQUFDO3dCQUNILENBQUMsQ0FBQyxDQUFDO29CQUNKLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxrQkFBa0IsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzNELENBQUM7b0JBRUQsT0FBTyxrQkFBa0IsQ0FBQztnQkFDM0IsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztvQkFDOUYsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztvQkFDckQsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFpQixRQUFRLENBQUMsQ0FBQztZQUNuRixNQUFNLE9BQU8sR0FBRyxJQUFBLDRDQUFzQixFQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztZQUN6QyxPQUFPLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUM7WUFDN0MsT0FBTyxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQztZQUNuRCxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDckMsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMzRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsa0NBQXlCLENBQUM7Z0JBQ2pFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQztZQUMzRCxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFnQjtZQUNyQixJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLGlFQUFpRTtnQkFFakUsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUM7Z0JBQzNDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDO2dCQUNqRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztnQkFDN0MsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUM7Z0JBQy9DLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDO2dCQUNqQyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQztnQkFFM0MsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUVyQixJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLE9BQU8sOEJBQXNCLEVBQUUsQ0FBQztvQkFDL0QsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7Z0JBQ2pDLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxPQUFPLDhCQUFzQixFQUFFLENBQUM7b0JBQzlELFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUNuQyxDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsT0FBTyxnQ0FBd0IsRUFBRSxDQUFDO29CQUNsRSxVQUFVLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDbkMsQ0FBQztnQkFDRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDeEIsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO29CQUM1QixTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUM7Z0JBQ25DLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxrQ0FBMEIsRUFBRSxDQUFDO29CQUM1QyxpRUFBaUU7b0JBQ2pFLFNBQVMsR0FBRyxTQUFTLENBQUM7b0JBQ3RCLFlBQVksR0FBRyxTQUFTLENBQUM7b0JBQ3pCLFVBQVUsR0FBRyxTQUFTLENBQUM7b0JBQ3ZCLFdBQVcsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQ3hELENBQUM7Z0JBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO29CQUN0RCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUU7d0JBQ2pDLFNBQVM7d0JBQ1QsWUFBWTt3QkFDWixVQUFVO3dCQUNWLFdBQVc7d0JBQ1gsSUFBSTt3QkFDSixTQUFTO3FCQUNULENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDBCQUFpQixDQUFDLENBQUM7Z0JBQ2xILENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNyQyxJQUFJLEtBQUssRUFBRSxDQUFDO3dCQUNYLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQ0FDNUMsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2dDQUMzQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0NBQ25CLE9BQU8sRUFBRSxJQUFJO2dDQUNiLFNBQVM7Z0NBQ1QsWUFBWTtnQ0FDWixVQUFVO2dDQUNWLFdBQVc7Z0NBQ1gsSUFBSTtnQ0FDSixTQUFTOzZCQUNULENBQUMsQ0FBQyxDQUFDO29CQUNMLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVPLFVBQVU7WUFDakIsSUFBSSxJQUFJLENBQUMsT0FBTyxrQ0FBMEIsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNELENBQUE7SUFoYlksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFvQjFCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFlBQUEsc0NBQWtCLENBQUE7UUFDbEIsWUFBQSxxQ0FBcUIsQ0FBQTtRQUNyQixZQUFBLDJDQUF3QixDQUFBO1FBQ3hCLFlBQUEsK0JBQWtCLENBQUE7UUFDbEIsWUFBQSxxQkFBYSxDQUFBO1FBQ2IsWUFBQSxtQ0FBaUIsQ0FBQTtPQS9CUCxnQkFBZ0IsQ0FnYjVCO0lBRUQsTUFBTSxpQ0FBa0MsU0FBUSxnQ0FBYTtpQkFDckQsT0FBRSxHQUFHLHFDQUFxQyxDQUFDO1FBQ2xEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFO2dCQUN4QyxZQUFZLEVBQUUseUNBQWlDO2dCQUMvQyxNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLG9DQUE0QjtvQkFDcEMsT0FBTyx1QkFBZTtvQkFDdEIsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGdCQUFnQixDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDL0QsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRCxDQUFDOztJQUdGLE1BQU0sNEJBQTZCLFNBQVEsZ0NBQWE7aUJBQ2hELE9BQUUsR0FBRyx1QkFBdUIsQ0FBQztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNEJBQTRCLENBQUMsRUFBRTtnQkFDbkMsWUFBWSxFQUFFLHlDQUFpQztnQkFDL0MsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxjQUFjO29CQUN4QyxPQUFPLHdCQUFnQjtvQkFDdkIsU0FBUyxFQUFFLENBQUMsZ0RBQTZCLENBQUM7b0JBQzFDLE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxRQUEwQixFQUFFLE1BQW1CLEVBQUUsSUFBUztZQUMxRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQWdDLHlDQUFpQyxDQUFDLENBQUM7WUFDbkgsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUN2Qiw2RUFBNkU7Z0JBQzdFLE9BQU8saUJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUNsRCxDQUFDO1lBRUQsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1RCxDQUFDOztJQUdGLElBQUEsd0NBQXFCLEVBQUMsSUFBSSxpQ0FBaUMsRUFBRSxDQUFDLENBQUM7SUFDL0QsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLDRCQUE0QixFQUFFLENBQUMsQ0FBQyJ9