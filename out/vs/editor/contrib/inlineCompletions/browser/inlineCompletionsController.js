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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/equals", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/base/common/observableInternal/utils", "vs/base/common/types", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/inlineCompletions/browser/commandIds", "vs/editor/contrib/inlineCompletions/browser/ghostTextWidget", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsModel", "vs/editor/contrib/inlineCompletions/browser/suggestWidgetInlineCompletionProvider", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding"], function (require, exports, dom_1, aria_1, async_1, cancellation_1, equals_1, lifecycle_1, observable_1, base_1, utils_1, types_1, coreCommands_1, position_1, languageFeatureDebounce_1, languageFeatures_1, commandIds_1, ghostTextWidget_1, inlineCompletionContextKeys_1, inlineCompletionsHintsWidget_1, inlineCompletionsModel_1, suggestWidgetInlineCompletionProvider_1, nls_1, accessibility_1, accessibilitySignalService_1, commands_1, configuration_1, contextkey_1, instantiation_1, keybinding_1) {
    "use strict";
    var InlineCompletionsController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsController = void 0;
    let InlineCompletionsController = class InlineCompletionsController extends lifecycle_1.Disposable {
        static { InlineCompletionsController_1 = this; }
        static { this.ID = 'editor.contrib.inlineCompletionsController'; }
        static get(editor) {
            return editor.getContribution(InlineCompletionsController_1.ID);
        }
        constructor(editor, _instantiationService, _contextKeyService, _configurationService, _commandService, _debounceService, _languageFeaturesService, _accessibilitySignalService, _keybindingService, _accessibilityService) {
            super();
            this.editor = editor;
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._commandService = _commandService;
            this._debounceService = _debounceService;
            this._languageFeaturesService = _languageFeaturesService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._keybindingService = _keybindingService;
            this._accessibilityService = _accessibilityService;
            this.model = this._register((0, observable_1.disposableObservableValue)('inlineCompletionModel', undefined));
            this._textModelVersionId = (0, observable_1.observableValue)(this, -1);
            this._positions = (0, base_1.observableValueOpts)({ owner: this, equalsFn: (0, equals_1.itemsEquals)((0, equals_1.itemEquals)()) }, [new position_1.Position(1, 1)]);
            this._suggestWidgetAdaptor = this._register(new suggestWidgetInlineCompletionProvider_1.SuggestWidgetAdaptor(this.editor, () => this.model.get()?.selectedInlineCompletion.get()?.toSingleTextEdit(undefined), (tx) => this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other), (item) => {
                (0, observable_1.transaction)(tx => {
                    /** @description InlineCompletionsController.handleSuggestAccepted */
                    this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                    this.model.get()?.handleSuggestAccepted(item);
                });
            }));
            this._enabledInConfig = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(62 /* EditorOption.inlineSuggest */).enabled);
            this._isScreenReaderEnabled = (0, observable_1.observableFromEvent)(this._accessibilityService.onDidChangeScreenReaderOptimized, () => this._accessibilityService.isScreenReaderOptimized());
            this._editorDictationInProgress = (0, observable_1.observableFromEvent)(this._contextKeyService.onDidChangeContext, () => this._contextKeyService.getContext(this.editor.getDomNode()).getValue('editorDictation.inProgress') === true);
            this._enabled = (0, observable_1.derived)(this, reader => this._enabledInConfig.read(reader) && (!this._isScreenReaderEnabled.read(reader) || !this._editorDictationInProgress.read(reader)));
            this._fontFamily = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(62 /* EditorOption.inlineSuggest */).fontFamily);
            this._ghostTexts = (0, observable_1.derived)(this, (reader) => {
                const model = this.model.read(reader);
                return model?.ghostTexts.read(reader) ?? [];
            });
            this._stablizedGhostTexts = convertItemsToStableObservables(this._ghostTexts, this._store);
            this._ghostTextWidgets = (0, utils_1.mapObservableArrayCached)(this, this._stablizedGhostTexts, (ghostText, store) => {
                return store.add(this._instantiationService.createInstance(ghostTextWidget_1.GhostTextWidget, this.editor, {
                    ghostText: ghostText,
                    minReservedLineCount: (0, observable_1.constObservable)(0),
                    targetTextModel: this.model.map(v => v?.textModel),
                }));
            }).recomputeInitiallyAndOnChange(this._store);
            this._debounceValue = this._debounceService.for(this._languageFeaturesService.inlineCompletionsProvider, 'InlineCompletionsDebounce', { min: 50, max: 50 });
            this._playAccessibilitySignal = (0, observable_1.observableSignal)(this);
            this._isReadonly = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(91 /* EditorOption.readOnly */));
            this._textModel = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModel, () => this.editor.getModel());
            this._textModelIfWritable = (0, observable_1.derived)(reader => this._isReadonly.read(reader) ? undefined : this._textModel.read(reader));
            this._register(new inlineCompletionContextKeys_1.InlineCompletionContextKeys(this._contextKeyService, this.model));
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineCompletionsController.update model */
                const textModel = this._textModelIfWritable.read(reader);
                (0, observable_1.transaction)(tx => {
                    /** @description InlineCompletionsController.onDidChangeModel/readonly */
                    this.model.set(undefined, tx);
                    this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                    if (textModel) {
                        const model = _instantiationService.createInstance(inlineCompletionsModel_1.InlineCompletionsModel, textModel, this._suggestWidgetAdaptor.selectedItem, this._textModelVersionId, this._positions, this._debounceValue, (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, () => editor.getOption(118 /* EditorOption.suggest */).preview), (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, () => editor.getOption(118 /* EditorOption.suggest */).previewMode), (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, () => editor.getOption(62 /* EditorOption.inlineSuggest */).mode), this._enabled);
                        this.model.set(model, tx);
                    }
                });
            }));
            const styleElement = this._register((0, dom_1.createStyleSheet2)());
            this._register((0, observable_1.autorun)(reader => {
                const fontFamily = this._fontFamily.read(reader);
                styleElement.setStyle(fontFamily === '' || fontFamily === 'default' ? `` : `
.monaco-editor .ghost-text-decoration,
.monaco-editor .ghost-text-decoration-preview,
.monaco-editor .ghost-text {
	font-family: ${fontFamily};
}`);
            }));
            const getReason = (e) => {
                if (e.isUndoing) {
                    return inlineCompletionsModel_1.VersionIdChangeReason.Undo;
                }
                if (e.isRedoing) {
                    return inlineCompletionsModel_1.VersionIdChangeReason.Redo;
                }
                if (this.model.get()?.isAcceptingPartially) {
                    return inlineCompletionsModel_1.VersionIdChangeReason.AcceptWord;
                }
                return inlineCompletionsModel_1.VersionIdChangeReason.Other;
            };
            this._register(editor.onDidChangeModelContent((e) => (0, observable_1.transaction)(tx => 
            /** @description InlineCompletionsController.onDidChangeModelContent */
            this.updateObservables(tx, getReason(e)))));
            this._register(editor.onDidChangeCursorPosition(e => (0, observable_1.transaction)(tx => {
                /** @description InlineCompletionsController.onDidChangeCursorPosition */
                this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                if (e.reason === 3 /* CursorChangeReason.Explicit */ || e.source === 'api') {
                    this.model.get()?.stop(tx);
                }
            })));
            this._register(editor.onDidType(() => (0, observable_1.transaction)(tx => {
                /** @description InlineCompletionsController.onDidType */
                this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                if (this._enabled.get()) {
                    this.model.get()?.trigger(tx);
                }
            })));
            this._register(this._commandService.onDidExecuteCommand((e) => {
                // These commands don't trigger onDidType.
                const commands = new Set([
                    coreCommands_1.CoreEditingCommands.Tab.id,
                    coreCommands_1.CoreEditingCommands.DeleteLeft.id,
                    coreCommands_1.CoreEditingCommands.DeleteRight.id,
                    commandIds_1.inlineSuggestCommitId,
                    'acceptSelectedSuggestion',
                ]);
                if (commands.has(e.commandId) && editor.hasTextFocus() && this._enabled.get()) {
                    (0, observable_1.transaction)(tx => {
                        /** @description onDidExecuteCommand */
                        this.model.get()?.trigger(tx);
                    });
                }
            }));
            this._register(this.editor.onDidBlurEditorWidget(() => {
                // This is a hidden setting very useful for debugging
                if (this._contextKeyService.getContextKeyValue('accessibleViewIsShown') || this._configurationService.getValue('editor.inlineSuggest.keepOnBlur') ||
                    editor.getOption(62 /* EditorOption.inlineSuggest */).keepOnBlur) {
                    return;
                }
                if (inlineCompletionsHintsWidget_1.InlineSuggestionHintsContentWidget.dropDownVisible) {
                    return;
                }
                (0, observable_1.transaction)(tx => {
                    /** @description InlineCompletionsController.onDidBlurEditorWidget */
                    this.model.get()?.stop(tx);
                });
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineCompletionsController.forceRenderingAbove */
                const state = this.model.read(reader)?.state.read(reader);
                if (state?.suggestItem) {
                    if (state.primaryGhostText.lineCount >= 2) {
                        this._suggestWidgetAdaptor.forceRenderingAbove();
                    }
                }
                else {
                    this._suggestWidgetAdaptor.stopForceRenderingAbove();
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._suggestWidgetAdaptor.stopForceRenderingAbove();
            }));
            const cancellationStore = this._register(new lifecycle_1.DisposableStore());
            let lastInlineCompletionId = undefined;
            this._register((0, observable_1.autorunHandleChanges)({
                handleChange: (context, changeSummary) => {
                    if (context.didChange(this._playAccessibilitySignal)) {
                        lastInlineCompletionId = undefined;
                    }
                    return true;
                },
            }, async (reader, _) => {
                /** @description InlineCompletionsController.playAccessibilitySignalAndReadSuggestion */
                this._playAccessibilitySignal.read(reader);
                const model = this.model.read(reader);
                const state = model?.state.read(reader);
                if (!model || !state || !state.inlineCompletion) {
                    lastInlineCompletionId = undefined;
                    return;
                }
                if (state.inlineCompletion.semanticId !== lastInlineCompletionId) {
                    cancellationStore.clear();
                    lastInlineCompletionId = state.inlineCompletion.semanticId;
                    const lineText = model.textModel.getLineContent(state.primaryGhostText.lineNumber);
                    await (0, async_1.timeout)(50, (0, cancellation_1.cancelOnDispose)(cancellationStore));
                    await (0, observable_1.waitForState)(this._suggestWidgetAdaptor.selectedItem, types_1.isUndefined, () => false, (0, cancellation_1.cancelOnDispose)(cancellationStore));
                    await this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.inlineSuggestion);
                    if (this.editor.getOption(8 /* EditorOption.screenReaderAnnounceInlineSuggestion */)) {
                        this.provideScreenReaderUpdate(state.primaryGhostText.renderForScreenReader(lineText));
                    }
                }
            }));
            this._register(new inlineCompletionsHintsWidget_1.InlineCompletionsHintsWidget(this.editor, this.model, this._instantiationService));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('accessibility.verbosity.inlineCompletions')) {
                    this.editor.updateOptions({ inlineCompletionsAccessibilityVerbose: this._configurationService.getValue('accessibility.verbosity.inlineCompletions') });
                }
            }));
            this.editor.updateOptions({ inlineCompletionsAccessibilityVerbose: this._configurationService.getValue('accessibility.verbosity.inlineCompletions') });
        }
        playAccessibilitySignal(tx) {
            this._playAccessibilitySignal.trigger(tx);
        }
        provideScreenReaderUpdate(content) {
            const accessibleViewShowing = this._contextKeyService.getContextKeyValue('accessibleViewIsShown');
            const accessibleViewKeybinding = this._keybindingService.lookupKeybinding('editor.action.accessibleView');
            let hint;
            if (!accessibleViewShowing && accessibleViewKeybinding && this.editor.getOption(149 /* EditorOption.inlineCompletionsAccessibilityVerbose */)) {
                hint = (0, nls_1.localize)('showAccessibleViewHint', "Inspect this in the accessible view ({0})", accessibleViewKeybinding.getAriaLabel());
            }
            hint ? (0, aria_1.alert)(content + ', ' + hint) : (0, aria_1.alert)(content);
        }
        /**
         * Copies over the relevant state from the text model to observables.
         * This solves all kind of eventing issues, as we make sure we always operate on the latest state,
         * regardless of who calls into us.
         */
        updateObservables(tx, changeReason) {
            const newModel = this.editor.getModel();
            this._textModelVersionId.set(newModel?.getVersionId() ?? -1, tx, changeReason);
            this._positions.set(this.editor.getSelections()?.map(selection => selection.getPosition()) ?? [new position_1.Position(1, 1)], tx);
        }
        shouldShowHoverAt(range) {
            const ghostText = this.model.get()?.primaryGhostText.get();
            if (ghostText) {
                return ghostText.parts.some(p => range.containsPosition(new position_1.Position(ghostText.lineNumber, p.column)));
            }
            return false;
        }
        shouldShowHoverAtViewZone(viewZoneId) {
            return this._ghostTextWidgets.get()[0]?.ownsViewZone(viewZoneId) ?? false;
        }
        hide() {
            (0, observable_1.transaction)(tx => {
                this.model.get()?.stop(tx);
            });
        }
    };
    exports.InlineCompletionsController = InlineCompletionsController;
    exports.InlineCompletionsController = InlineCompletionsController = InlineCompletionsController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, commands_1.ICommandService),
        __param(5, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(6, languageFeatures_1.ILanguageFeaturesService),
        __param(7, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, accessibility_1.IAccessibilityService)
    ], InlineCompletionsController);
    function convertItemsToStableObservables(items, store) {
        const result = (0, observable_1.observableValue)('result', []);
        const innerObservables = [];
        store.add((0, observable_1.autorun)(reader => {
            const itemsValue = items.read(reader);
            (0, observable_1.transaction)(tx => {
                if (itemsValue.length !== innerObservables.length) {
                    innerObservables.length = itemsValue.length;
                    for (let i = 0; i < innerObservables.length; i++) {
                        if (!innerObservables[i]) {
                            innerObservables[i] = (0, observable_1.observableValue)('item', itemsValue[i]);
                        }
                    }
                    result.set([...innerObservables], tx);
                }
                innerObservables.forEach((o, i) => o.set(itemsValue[i], tx));
            });
        }));
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9pbmxpbmVDb21wbGV0aW9uc0NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9DekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTs7aUJBQ25ELE9BQUUsR0FBRyw0Q0FBNEMsQUFBL0MsQ0FBZ0Q7UUFFbEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQThCLDZCQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFtREQsWUFDaUIsTUFBbUIsRUFDWixxQkFBNkQsRUFDaEUsa0JBQXVELEVBQ3BELHFCQUE2RCxFQUNuRSxlQUFpRCxFQUNqQyxnQkFBa0UsRUFDekUsd0JBQW1FLEVBQ2hFLDJCQUF5RSxFQUNsRixrQkFBdUQsRUFDcEQscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBWFEsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNLLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNuQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlDO1lBQ3hELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDL0MsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUNqRSx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ25DLDBCQUFxQixH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