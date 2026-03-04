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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "./snippetSession"], function (require, exports, lifecycle_1, types_1, editorExtensions_1, position_1, editorContextKeys_1, languageConfigurationRegistry_1, languageFeatures_1, suggest_1, nls_1, contextkey_1, log_1, snippetSession_1) {
    "use strict";
    var SnippetController2_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetController2 = void 0;
    const _defaultOptions = {
        overwriteBefore: 0,
        overwriteAfter: 0,
        undoStopBefore: true,
        undoStopAfter: true,
        adjustWhitespace: true,
        clipboardText: undefined,
        overtypingCapturer: undefined
    };
    let SnippetController2 = class SnippetController2 {
        static { SnippetController2_1 = this; }
        static { this.ID = 'snippetController2'; }
        static get(editor) {
            return editor.getContribution(SnippetController2_1.ID);
        }
        static { this.InSnippetMode = new contextkey_1.RawContextKey('inSnippetMode', false, (0, nls_1.localize)('inSnippetMode', "Whether the editor in current in snippet mode")); }
        static { this.HasNextTabstop = new contextkey_1.RawContextKey('hasNextTabstop', false, (0, nls_1.localize)('hasNextTabstop', "Whether there is a next tab stop when in snippet mode")); }
        static { this.HasPrevTabstop = new contextkey_1.RawContextKey('hasPrevTabstop', false, (0, nls_1.localize)('hasPrevTabstop', "Whether there is a previous tab stop when in snippet mode")); }
        constructor(_editor, _logService, _languageFeaturesService, contextKeyService, _languageConfigurationService) {
            this._editor = _editor;
            this._logService = _logService;
            this._languageFeaturesService = _languageFeaturesService;
            this._languageConfigurationService = _languageConfigurationService;
            this._snippetListener = new lifecycle_1.DisposableStore();
            this._modelVersionId = -1;
            this._inSnippet = SnippetController2_1.InSnippetMode.bindTo(contextKeyService);
            this._hasNextTabstop = SnippetController2_1.HasNextTabstop.bindTo(contextKeyService);
            this._hasPrevTabstop = SnippetController2_1.HasPrevTabstop.bindTo(contextKeyService);
        }
        dispose() {
            this._inSnippet.reset();
            this._hasPrevTabstop.reset();
            this._hasNextTabstop.reset();
            this._session?.dispose();
            this._snippetListener.dispose();
        }
        apply(edits, opts) {
            try {
                this._doInsert(edits, typeof opts === 'undefined' ? _defaultOptions : { ..._defaultOptions, ...opts });
            }
            catch (e) {
                this.cancel();
                this._logService.error(e);
                this._logService.error('snippet_error');
                this._logService.error('insert_edits=', edits);
                this._logService.error('existing_template=', this._session ? this._session._logInfo() : '<no_session>');
            }
        }
        insert(template, opts) {
            // this is here to find out more about the yet-not-understood
            // error that sometimes happens when we fail to inserted a nested
            // snippet
            try {
                this._doInsert(template, typeof opts === 'undefined' ? _defaultOptions : { ..._defaultOptions, ...opts });
            }
            catch (e) {
                this.cancel();
                this._logService.error(e);
                this._logService.error('snippet_error');
                this._logService.error('insert_template=', template);
                this._logService.error('existing_template=', this._session ? this._session._logInfo() : '<no_session>');
            }
        }
        _doInsert(template, opts) {
            if (!this._editor.hasModel()) {
                return;
            }
            // don't listen while inserting the snippet
            // as that is the inflight state causing cancelation
            this._snippetListener.clear();
            if (opts.undoStopBefore) {
                this._editor.getModel().pushStackElement();
            }
            // don't merge
            if (this._session && typeof template !== 'string') {
                this.cancel();
            }
            if (!this._session) {
                this._modelVersionId = this._editor.getModel().getAlternativeVersionId();
                this._session = new snippetSession_1.SnippetSession(this._editor, template, opts, this._languageConfigurationService);
                this._session.insert();
            }
            else {
                (0, types_1.assertType)(typeof template === 'string');
                this._session.merge(template, opts);
            }
            if (opts.undoStopAfter) {
                this._editor.getModel().pushStackElement();
            }
            // regster completion item provider when there is any choice element
            if (this._session?.hasChoice) {
                const provider = {
                    _debugDisplayName: 'snippetChoiceCompletions',
                    provideCompletionItems: (model, position) => {
                        if (!this._session || model !== this._editor.getModel() || !position_1.Position.equals(this._editor.getPosition(), position)) {
                            return undefined;
                        }
                        const { activeChoice } = this._session;
                        if (!activeChoice || activeChoice.choice.options.length === 0) {
                            return undefined;
                        }
                        const word = model.getValueInRange(activeChoice.range);
                        const isAnyOfOptions = Boolean(activeChoice.choice.options.find(o => o.value === word));
                        const suggestions = [];
                        for (let i = 0; i < activeChoice.choice.options.length; i++) {
                            const option = activeChoice.choice.options[i];
                            suggestions.push({
                                kind: 13 /* CompletionItemKind.Value */,
                                label: option.value,
                                insertText: option.value,
                                sortText: 'a'.repeat(i + 1),
                                range: activeChoice.range,
                                filterText: isAnyOfOptions ? `${word}_${option.value}` : undefined,
                                command: { id: 'jumpToNextSnippetPlaceholder', title: (0, nls_1.localize)('next', 'Go to next placeholder...') }
                            });
                        }
                        return { suggestions };
                    }
                };
                const model = this._editor.getModel();
                let registration;
                let isRegistered = false;
                const disable = () => {
                    registration?.dispose();
                    isRegistered = false;
                };
                const enable = () => {
                    if (!isRegistered) {
                        registration = this._languageFeaturesService.completionProvider.register({
                            language: model.getLanguageId(),
                            pattern: model.uri.fsPath,
                            scheme: model.uri.scheme,
                            exclusive: true
                        }, provider);
                        this._snippetListener.add(registration);
                        isRegistered = true;
                    }
                };
                this._choiceCompletions = { provider, enable, disable };
            }
            this._updateState();
            this._snippetListener.add(this._editor.onDidChangeModelContent(e => e.isFlush && this.cancel()));
            this._snippetListener.add(this._editor.onDidChangeModel(() => this.cancel()));
            this._snippetListener.add(this._editor.onDidChangeCursorSelection(() => this._updateState()));
        }
        _updateState() {
            if (!this._session || !this._editor.hasModel()) {
                // canceled in the meanwhile
                return;
            }
            if (this._modelVersionId === this._editor.getModel().getAlternativeVersionId()) {
                // undo until the 'before' state happened
                // and makes use cancel snippet mode
                return this.cancel();
            }
            if (!this._session.hasPlaceholder) {
                // don't listen for selection changes and don't
                // update context keys when the snippet is plain text
                return this.cancel();
            }
            if (this._session.isAtLastPlaceholder || !this._session.isSelectionWithinPlaceholders()) {
                this._editor.getModel().pushStackElement();
                return this.cancel();
            }
            this._inSnippet.set(true);
            this._hasPrevTabstop.set(!this._session.isAtFirstPlaceholder);
            this._hasNextTabstop.set(!this._session.isAtLastPlaceholder);
            this._handleChoice();
        }
        _handleChoice() {
            if (!this._session || !this._editor.hasModel()) {
                this._currentChoice = undefined;
                return;
            }
            const { activeChoice } = this._session;
            if (!activeChoice || !this._choiceCompletions) {
                this._choiceCompletions?.disable();
                this._currentChoice = undefined;
                return;
            }
            if (this._currentChoice !== activeChoice.choice) {
                this._currentChoice = activeChoice.choice;
                this._choiceCompletions.enable();
                // trigger suggest with the special choice completion provider
                queueMicrotask(() => {
                    (0, suggest_1.showSimpleSuggestions)(this._editor, this._choiceCompletions.provider);
                });
            }
        }
        finish() {
            while (this._inSnippet.get()) {
                this.next();
            }
        }
        cancel(resetSelection = false) {
            this._inSnippet.reset();
            this._hasPrevTabstop.reset();
            this._hasNextTabstop.reset();
            this._snippetListener.clear();
            this._currentChoice = undefined;
            this._session?.dispose();
            this._session = undefined;
            this._modelVersionId = -1;
            if (resetSelection) {
                // reset selection to the primary cursor when being asked
                // for. this happens when explicitly cancelling snippet mode,
                // e.g. when pressing ESC
                this._editor.setSelections([this._editor.getSelection()]);
            }
        }
        prev() {
            this._session?.prev();
            this._updateState();
        }
        next() {
            this._session?.next();
            this._updateState();
        }
        isInSnippet() {
            return Boolean(this._inSnippet.get());
        }
        getSessionEnclosingRange() {
            if (this._session) {
                return this._session.getEnclosingRange();
            }
            return undefined;
        }
    };
    exports.SnippetController2 = SnippetController2;
    exports.SnippetController2 = SnippetController2 = SnippetController2_1 = __decorate([
        __param(1, log_1.ILogService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetController2);
    (0, editorExtensions_1.registerEditorContribution)(SnippetController2.ID, SnippetController2, 4 /* EditorContributionInstantiation.Lazy */);
    const CommandCtor = editorExtensions_1.EditorCommand.bindToContribution(SnippetController2.get);
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'jumpToNextSnippetPlaceholder',
        precondition: contextkey_1.ContextKeyExpr.and(SnippetController2.InSnippetMode, SnippetController2.HasNextTabstop),
        handler: ctrl => ctrl.next(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'jumpToPrevSnippetPlaceholder',
        precondition: contextkey_1.ContextKeyExpr.and(SnippetController2.InSnippetMode, SnippetController2.HasPrevTabstop),
        handler: ctrl => ctrl.prev(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'leaveSnippet',
        precondition: SnippetController2.InSnippetMode,
        handler: ctrl => ctrl.cancel(true),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'acceptSnippet',
        precondition: SnippetController2.InSnippetMode,
        handler: ctrl => ctrl.finish(),
        // kbOpts: {
        // 	weight: KeybindingWeight.EditorContrib + 30,
        // 	kbExpr: EditorContextKeys.textFocus,
        // 	primary: KeyCode.Enter,
        // }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldENvbnRyb2xsZXIyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc25pcHBldC9icm93c2VyL3NuaXBwZXRDb250cm9sbGVyMi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxNQUFNLGVBQWUsR0FBMEI7UUFDOUMsZUFBZSxFQUFFLENBQUM7UUFDbEIsY0FBYyxFQUFFLENBQUM7UUFDakIsY0FBYyxFQUFFLElBQUk7UUFDcEIsYUFBYSxFQUFFLElBQUk7UUFDbkIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixhQUFhLEVBQUUsU0FBUztRQUN4QixrQkFBa0IsRUFBRSxTQUFTO0tBQzdCLENBQUM7SUFFSyxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjs7aUJBRVAsT0FBRSxHQUFHLG9CQUFvQixBQUF2QixDQUF3QjtRQUVqRCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBcUIsb0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUUsQ0FBQztpQkFFZSxrQkFBYSxHQUFHLElBQUksMEJBQWEsQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDLEFBQXhILENBQXlIO2lCQUN0SSxtQkFBYyxHQUFHLElBQUksMEJBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsdURBQXVELENBQUMsQ0FBQyxBQUFsSSxDQUFtSTtpQkFDakosbUJBQWMsR0FBRyxJQUFJLDBCQUFhLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFF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