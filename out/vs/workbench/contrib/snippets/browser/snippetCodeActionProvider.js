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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/selection", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/snippets/browser/commands/fileTemplateSnippets", "vs/workbench/contrib/snippets/browser/commands/surroundWithSnippet", "./snippets"], function (require, exports, lifecycle_1, selection_1, languageFeatures_1, types_1, nls_1, configuration_1, instantiation_1, fileTemplateSnippets_1, surroundWithSnippet_1, snippets_1) {
    "use strict";
    var SurroundWithSnippetCodeActionProvider_1, FileTemplateCodeActionProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetCodeActions = void 0;
    let SurroundWithSnippetCodeActionProvider = class SurroundWithSnippetCodeActionProvider {
        static { SurroundWithSnippetCodeActionProvider_1 = this; }
        static { this._MAX_CODE_ACTIONS = 4; }
        static { this._overflowCommandCodeAction = {
            kind: types_1.CodeActionKind.SurroundWith.value,
            title: (0, nls_1.localize)('more', "More..."),
            command: {
                id: surroundWithSnippet_1.SurroundWithSnippetEditorAction.options.id,
                title: surroundWithSnippet_1.SurroundWithSnippetEditorAction.options.title.value,
            },
        }; }
        constructor(_snippetService) {
            this._snippetService = _snippetService;
        }
        async provideCodeActions(model, range) {
            if (range.isEmpty()) {
                return undefined;
            }
            const position = selection_1.Selection.isISelection(range) ? range.getPosition() : range.getStartPosition();
            const snippets = await (0, surroundWithSnippet_1.getSurroundableSnippets)(this._snippetService, model, position, false);
            if (!snippets.length) {
                return undefined;
            }
            const actions = [];
            for (const snippet of snippets) {
                if (actions.length >= SurroundWithSnippetCodeActionProvider_1._MAX_CODE_ACTIONS) {
                    actions.push(SurroundWithSnippetCodeActionProvider_1._overflowCommandCodeAction);
                    break;
                }
                actions.push({
                    title: (0, nls_1.localize)('codeAction', "{0}", snippet.name),
                    kind: types_1.CodeActionKind.SurroundWith.value,
                    edit: asWorkspaceEdit(model, range, snippet)
                });
            }
            return {
                actions,
                dispose() { }
            };
        }
    };
    SurroundWithSnippetCodeActionProvider = SurroundWithSnippetCodeActionProvider_1 = __decorate([
        __param(0, snippets_1.ISnippetsService)
    ], SurroundWithSnippetCodeActionProvider);
    let FileTemplateCodeActionProvider = class FileTemplateCodeActionProvider {
        static { FileTemplateCodeActionProvider_1 = this; }
        static { this._MAX_CODE_ACTIONS = 4; }
        static { this._overflowCommandCodeAction = {
            title: (0, nls_1.localize)('overflow.start.title', 'Start with Snippet'),
            kind: types_1.CodeActionKind.SurroundWith.value,
            command: {
                id: fileTemplateSnippets_1.ApplyFileSnippetAction.Id,
                title: ''
            }
        }; }
        constructor(_snippetService) {
            this._snippetService = _snippetService;
            this.providedCodeActionKinds = [types_1.CodeActionKind.SurroundWith.value];
        }
        async provideCodeActions(model) {
            if (model.getValueLength() !== 0) {
                return undefined;
            }
            const snippets = await this._snippetService.getSnippets(model.getLanguageId(), { fileTemplateSnippets: true, includeNoPrefixSnippets: true });
            const actions = [];
            for (const snippet of snippets) {
                if (actions.length >= FileTemplateCodeActionProvider_1._MAX_CODE_ACTIONS) {
                    actions.push(FileTemplateCodeActionProvider_1._overflowCommandCodeAction);
                    break;
                }
                actions.push({
                    title: (0, nls_1.localize)('title', 'Start with: {0}', snippet.name),
                    kind: types_1.CodeActionKind.SurroundWith.value,
                    edit: asWorkspaceEdit(model, model.getFullModelRange(), snippet)
                });
            }
            return {
                actions,
                dispose() { }
            };
        }
    };
    FileTemplateCodeActionProvider = FileTemplateCodeActionProvider_1 = __decorate([
        __param(0, snippets_1.ISnippetsService)
    ], FileTemplateCodeActionProvider);
    function asWorkspaceEdit(model, range, snippet) {
        return {
            edits: [{
                    versionId: model.getVersionId(),
                    resource: model.uri,
                    textEdit: {
                        range,
                        text: snippet.body,
                        insertAsSnippet: true,
                    }
                }]
        };
    }
    let SnippetCodeActions = class SnippetCodeActions {
        constructor(instantiationService, languageFeaturesService, configService) {
            this._store = new lifecycle_1.DisposableStore();
            const setting = 'editor.snippets.codeActions.enabled';
            const sessionStore = new lifecycle_1.DisposableStore();
            const update = () => {
                sessionStore.clear();
                if (configService.getValue(setting)) {
                    sessionStore.add(languageFeaturesService.codeActionProvider.register('*', instantiationService.createInstance(SurroundWithSnippetCodeActionProvider)));
                    sessionStore.add(languageFeaturesService.codeActionProvider.register('*', instantiationService.createInstance(FileTemplateCodeActionProvider)));
                }
            };
            update();
            this._store.add(configService.onDidChangeConfiguration(e => e.affectsConfiguration(setting) && update()));
            this._store.add(sessionStore);
        }
        dispose() {
            this._store.dispose();
        }
    };
    exports.SnippetCodeActions = SnippetCodeActions;
    exports.SnippetCodeActions = SnippetCodeActions = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, configuration_1.IConfigurationService)
    ], SnippetCodeActions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldENvZGVBY3Rpb25Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvc25pcHBldENvZGVBY3Rpb25Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRyxJQUFNLHFDQUFxQyxHQUEzQyxNQUFNLHFDQUFxQzs7aUJBRWxCLHNCQUFpQixHQUFHLENBQUMsQUFBSixDQUFLO2lCQUV0QiwrQkFBMEIsR0FBZTtZQUNoRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSztZQUN2QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQztZQUNsQyxPQUFPLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLHFEQUErQixDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUM5QyxLQUFLLEVBQUUscURBQStCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLO2FBQzFEO1NBQ0QsQUFQaUQsQ0FPaEQ7UUFFRixZQUErQyxlQUFpQztZQUFqQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7UUFBSSxDQUFDO1FBRXJGLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFpQixFQUFFLEtBQXdCO1lBRW5FLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxxQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNoRyxNQUFNLFFBQVEsR0FB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