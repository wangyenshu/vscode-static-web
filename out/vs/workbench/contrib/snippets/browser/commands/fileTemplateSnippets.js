/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/services/editor/common/editorService"], function (require, exports, arrays_1, strings_1, editorBrowser_1, language_1, snippetController2_1, nls_1, quickInput_1, abstractSnippetsActions_1, snippets_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplyFileSnippetAction = void 0;
    class ApplyFileSnippetAction extends abstractSnippetsActions_1.SnippetsAction {
        static { this.Id = 'workbench.action.populateFileFromSnippet'; }
        constructor() {
            super({
                id: ApplyFileSnippetAction.Id,
                title: (0, nls_1.localize2)('label', "Fill File with Snippet"),
                f1: true,
            });
        }
        async run(accessor) {
            const snippetService = accessor.get(snippets_1.ISnippetsService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const langService = accessor.get(language_1.ILanguageService);
            const editor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const snippets = await snippetService.getSnippets(undefined, { fileTemplateSnippets: true, noRecencySort: true, includeNoPrefixSnippets: true });
            if (snippets.length === 0) {
                return;
            }
            const selection = await this._pick(quickInputService, langService, snippets);
            if (!selection) {
                return;
            }
            if (editor.hasModel()) {
                // apply snippet edit -> replaces everything
                snippetController2_1.SnippetController2.get(editor)?.apply([{
                        range: editor.getModel().getFullModelRange(),
                        template: selection.snippet.body
                    }]);
                // set language if possible
                editor.getModel().setLanguage(langService.createById(selection.langId), ApplyFileSnippetAction.Id);
                editor.focus();
            }
        }
        async _pick(quickInputService, langService, snippets) {
            const all = [];
            for (const snippet of snippets) {
                if ((0, arrays_1.isFalsyOrEmpty)(snippet.scopes)) {
                    all.push({ langId: '', snippet });
                }
                else {
                    for (const langId of snippet.scopes) {
                        all.push({ langId, snippet });
                    }
                }
            }
            const picks = [];
            const groups = (0, arrays_1.groupBy)(all, (a, b) => (0, strings_1.compare)(a.langId, b.langId));
            for (const group of groups) {
                let first = true;
                for (const item of group) {
                    if (first) {
                        picks.push({
                            type: 'separator',
                            label: langService.getLanguageName(item.langId) ?? item.langId
                        });
                        first = false;
                    }
                    picks.push({
                        snippet: item,
                        label: item.snippet.prefix || item.snippet.name,
                        detail: item.snippet.description
                    });
                }
            }
            const pick = await quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('placeholder', 'Select a snippet'),
                matchOnDetail: true,
            });
            return pick?.snippet;
        }
    }
    exports.ApplyFileSnippetAction = ApplyFileSnippetAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVRlbXBsYXRlU25pcHBldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy9icm93c2VyL2NvbW1hbmRzL2ZpbGVUZW1wbGF0ZVNuaXBwZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLHNCQUF1QixTQUFRLHdDQUFjO2lCQUV6QyxPQUFFLEdBQUcsMENBQTBDLENBQUM7UUFFaEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHNCQUFzQixDQUFDLEVBQUU7Z0JBQzdCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLENBQUM7Z0JBQ25ELEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1lBQ3RELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztZQUVuRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDZCQUFhLEVBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FB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