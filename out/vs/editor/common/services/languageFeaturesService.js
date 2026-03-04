/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languageFeatureRegistry", "vs/editor/common/services/languageFeatures", "vs/platform/instantiation/common/extensions"], function (require, exports, languageFeatureRegistry_1, languageFeatures_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageFeaturesService = void 0;
    class LanguageFeaturesService {
        constructor() {
            this.referenceProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.renameProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.newSymbolNamesProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.codeActionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.definitionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.typeDefinitionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.declarationProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.implementationProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentSymbolProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlayHintsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.colorProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.codeLensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentRangeFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.onTypeFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.signatureHelpProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.hoverProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentHighlightProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.multiDocumentHighlightProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.selectionRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.foldingRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.linkProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineCompletionsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.completionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.linkedEditingRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineValuesProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.evaluatableExpressionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentRangeSemanticTokensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentSemanticTokensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentDropEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentPasteEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.mappedEditsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
        }
        setNotebookTypeResolver(resolver) {
            this._notebookTypeResolver = resolver;
        }
        _score(uri) {
            return this._notebookTypeResolver?.(uri);
        }
    }
    exports.LanguageFeaturesService = LanguageFeaturesService;
    (0, extensions_1.registerSingleton)(languageFeatures_1.ILanguageFeaturesService, LanguageFeaturesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VGZWF0dXJlc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2xhbmd1YWdlRmVhdHVyZXNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLHVCQUF1QjtRQUFwQztZQUlVLHNCQUFpQixHQUFHLElBQUksaURBQXVCLENBQW9CLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0YsbUJBQWMsR0FBRyxJQUFJLGlEQUF1QixDQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLDJCQUFzQixHQUFHLElBQUksaURBQXVCLENBQXlCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckcsdUJBQWtCLEdBQUcsSUFBSSxpREFBdUIsQ0FBcUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3Rix1QkFBa0IsR0FBRyxJQUFJLGlEQUF1QixDQUFxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdGLDJCQUFzQixHQUFHLElBQUksaURBQXVCLENBQXlCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckcsd0JBQW1CLEdBQUcsSUFBSSxpREFBdUIsQ0FBc0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvRiwyQkFBc0IsR0FBRyxJQUFJLGlEQUF1QixDQUF5QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLDJCQUFzQixHQUFHLElBQUksaURBQXVCLENBQXlCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckcsdUJBQWtCLEdBQUcsSUFBSSxpREFBdUIsQ0FBcUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3RixrQkFBYSxHQUFHLElBQUksaURBQXVCLENBQXdCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0YscUJBQWdCLEdBQUcsSUFBSSxpREFBdUIsQ0FBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN6RixtQ0FBOEIsR0FBRyxJQUFJLGlEQUF1QixDQUFpQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JILHdDQUFtQyxHQUFHLElBQUksaURBQXVCLENBQXNDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDL0gsaUNBQTRCLEdBQUcsSUFBSSxpREFBdUIsQ0FBK0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqSCwwQkFBcUIsR0FBRyxJQUFJLGlEQUF1QixDQUF3QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25HLGtCQUFhLEdBQUcsSUFBSSxpREFBdUIsQ0FBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNuRiw4QkFBeUIsR0FBRyxJQUFJLGlEQUF1QixDQUE0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNHLG1DQUE4QixHQUFHLElBQUksaURBQXVCLENBQWlDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckgsMkJBQXNCLEdBQUcsSUFBSSxpREFBdUIsQ0FBeUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRyx5QkFBb0IsR0FBRyxJQUFJLGlEQUF1QixDQUF1QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLGlCQUFZLEdBQUcsSUFBSSxpREFBdUIsQ0FBZSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLDhCQUF5QixHQUFHLElBQUksaURBQXVCLENBQTRCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0csdUJBQWtCLEdBQUcsSUFBSSxpREFBdUIsQ0FBcUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3Rix1QkFBa0IsR0FBRyxJQUFJLGlEQUF1QixDQUF5QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLCtCQUEwQixHQUFHLElBQUksaURBQXVCLENBQTZCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0cseUJBQW9CLEdBQUcsSUFBSSxpREFBdUIsQ0FBdUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRyxrQ0FBNkIsR0FBRyxJQUFJLGlEQUF1QixDQUFnQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25ILHdDQUFtQyxHQUFHLElBQUksaURBQXVCLENBQXNDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDL0gsbUNBQThCLEdBQUcsSUFBSSxpREFBdUIsQ0FBaUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNySCw2QkFBd0IsR0FBRyxJQUFJLGlEQUF1QixDQUEyQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLDhCQUF5QixHQUFHLElBQUksaURBQXVCLENBQTRCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0csd0JBQW1CLEdBQWlELElBQUksaURBQXVCLENBQXNCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFZdkosQ0FBQztRQVJBLHVCQUF1QixDQUFDLFFBQTBDO1lBQ2pFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxRQUFRLENBQUM7UUFDdkMsQ0FBQztRQUVPLE1BQU0sQ0FBQyxHQUFRO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUVEO0lBaERELDBEQWdEQztJQUVELElBQUEsOEJBQWlCLEVBQUMsMkNBQXdCLEVBQUUsdUJBQXVCLG9DQUE0QixDQUFDIn0=