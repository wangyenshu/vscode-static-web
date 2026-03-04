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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "./snippets", "./snippetsService", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/common/editorContextKeys", "./snippetCompletionProvider", "vs/platform/clipboard/common/clipboardService", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/common/services/languageFeatures"], function (require, exports, contextkey_1, snippets_1, snippetsService_1, range_1, editorExtensions_1, snippetController2_1, suggest_1, editorContextKeys_1, snippetCompletionProvider_1, clipboardService_1, editorState_1, languageFeatures_1) {
    "use strict";
    var TabCompletionController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabCompletionController = void 0;
    let TabCompletionController = class TabCompletionController {
        static { TabCompletionController_1 = this; }
        static { this.ID = 'editor.tabCompletionController'; }
        static { this.ContextKey = new contextkey_1.RawContextKey('hasSnippetCompletions', undefined); }
        static get(editor) {
            return editor.getContribution(TabCompletionController_1.ID);
        }
        constructor(_editor, _snippetService, _clipboardService, _languageFeaturesService, contextKeyService) {
            this._editor = _editor;
            this._snippetService = _snippetService;
            this._clipboardService = _clipboardService;
            this._languageFeaturesService = _languageFeaturesService;
            this._activeSnippets = [];
            this._hasSnippets = TabCompletionController_1.ContextKey.bindTo(contextKeyService);
            this._configListener = this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(123 /* EditorOption.tabCompletion */)) {
                    this._update();
                }
            });
            this._update();
        }
        dispose() {
            this._configListener.dispose();
            this._selectionListener?.dispose();
        }
        _update() {
            const enabled = this._editor.getOption(123 /* EditorOption.tabCompletion */) === 'onlySnippets';
            if (this._enabled !== enabled) {
                this._enabled = enabled;
                if (!this._enabled) {
                    this._selectionListener?.dispose();
                }
                else {
                    this._selectionListener = this._editor.onDidChangeCursorSelection(e => this._updateSnippets());
                    if (this._editor.getModel()) {
                        this._updateSnippets();
                    }
                }
            }
        }
        _updateSnippets() {
            // reset first
            this._activeSnippets = [];
            this._completionProvider?.dispose();
            if (!this._editor.hasModel()) {
                return;
            }
            // lots of dance for getting the
            const selection = this._editor.getSelection();
            const model = this._editor.getModel();
            model.tokenization.tokenizeIfCheap(selection.positionLineNumber);
            const id = model.getLanguageIdAtPosition(selection.positionLineNumber, selection.positionColumn);
            const snippets = this._snippetService.getSnippetsSync(id);
            if (!snippets) {
                // nothing for this language
                this._hasSnippets.set(false);
                return;
            }
            if (range_1.Range.isEmpty(selection)) {
                // empty selection -> real text (no whitespace) left of cursor
                const prefix = (0, snippetsService_1.getNonWhitespacePrefix)(model, selection.getPosition());
                if (prefix) {
                    for (const snippet of snippets) {
                        if (prefix.endsWith(snippet.prefix)) {
                            this._activeSnippets.push(snippet);
                        }
                    }
                }
            }
            else if (!range_1.Range.spansMultipleLines(selection) && model.getValueLengthInRange(selection) <= 100) {
                // actual selection -> snippet must be a full match
                const selected = model.getValueInRange(selection);
                if (selected) {
                    for (const snippet of snippets) {
                        if (selected === snippet.prefix) {
                            this._activeSnippets.push(snippet);
                        }
                    }
                }
            }
            const len = this._activeSnippets.length;
            if (len === 0) {
                this._hasSnippets.set(false);
            }
            else if (len === 1) {
                this._hasSnippets.set(true);
            }
            else {
                this._hasSnippets.set(true);
                this._completionProvider = {
                    _debugDisplayName: 'tabCompletion',
                    dispose: () => {
                        registration.dispose();
                    },
                    provideCompletionItems: (_model, position) => {
                        if (_model !== model || !selection.containsPosition(position)) {
                            return;
                        }
                        const suggestions = this._activeSnippets.map(snippet => {
                            const range = range_1.Range.fromPositions(position.delta(0, -snippet.prefix.length), position);
                            return new snippetCompletionProvider_1.SnippetCompletion(snippet, range);
                        });
                        return { suggestions };
                    }
                };
                const registration = this._languageFeaturesService.completionProvider.register({ language: model.getLanguageId(), pattern: model.uri.fsPath, scheme: model.uri.scheme }, this._completionProvider);
            }
        }
        async performSnippetCompletions() {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._activeSnippets.length === 1) {
                // one -> just insert
                const [snippet] = this._activeSnippets;
                // async clipboard access might be required and in that case
                // we need to check if the editor has changed in flight and then
                // bail out (or be smarter than that)
                let clipboardText;
                if (snippet.needsClipboard) {
                    const state = new editorState_1.EditorState(this._editor, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */);
                    clipboardText = await this._clipboardService.readText();
                    if (!state.validate(this._editor)) {
                        return;
                    }
                }
                snippetController2_1.SnippetController2.get(this._editor)?.insert(snippet.codeSnippet, {
                    overwriteBefore: snippet.prefix.length, overwriteAfter: 0,
                    clipboardText
                });
            }
            else if (this._activeSnippets.length > 1) {
                // two or more -> show IntelliSense box
                if (this._completionProvider) {
                    (0, suggest_1.showSimpleSuggestions)(this._editor, this._completionProvider);
                }
            }
        }
    };
    exports.TabCompletionController = TabCompletionController;
    exports.TabCompletionController = TabCompletionController = TabCompletionController_1 = __decorate([
        __param(1, snippets_1.ISnippetsService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, contextkey_1.IContextKeyService)
    ], TabCompletionController);
    (0, editorExtensions_1.registerEditorContribution)(TabCompletionController.ID, TabCompletionController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to define a context key
    const TabCompletionCommand = editorExtensions_1.EditorCommand.bindToContribution(TabCompletionController.get);
    (0, editorExtensions_1.registerEditorCommand)(new TabCompletionCommand({
        id: 'insertSnippet',
        precondition: TabCompletionController.ContextKey,
        handler: x => x.performSnippetCompletions(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus, snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
            primary: 2 /* KeyCode.Tab */
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiQ29tcGxldGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvdGFiQ29tcGxldGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1Qjs7aUJBRW5CLE9BQUUsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7aUJBRXRDLGVBQVUsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLEFBQWpFLENBQWtFO1FBRTVGLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDN0IsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUEwQix5QkFBdUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBVUQsWUFDa0IsT0FBb0IsRUFDbkIsZUFBa0QsRUFDakQsaUJBQXFELEVBQzlDLHdCQUFtRSxFQUN6RSxpQkFBcUM7WUFKeEMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNGLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNoQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQzdCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFQdEYsb0JBQWUsR0FBYyxFQUFFLENBQUM7WUFVdkMsSUFBSSxDQUFDLFlBQVksR0FBRyx5QkFBdUIsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsQ0FBQyxVQUFVLHNDQUE0QixFQUFFLENBQUM7b0JBQzlDLElBQUksQ0FBQyxP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