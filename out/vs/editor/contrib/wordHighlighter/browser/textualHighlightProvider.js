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
define(["require", "exports", "vs/editor/common/core/wordHelper", "vs/editor/common/services/languageFeatures", "vs/editor/common/languages", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, wordHelper_1, languageFeatures_1, languages_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextualMultiDocumentHighlightFeature = void 0;
    class TextualDocumentHighlightProvider {
        constructor() {
            this.selector = { language: '*' };
        }
        provideMultiDocumentHighlights(primaryModel, position, otherModels, token) {
            const result = new map_1.ResourceMap();
            const word = primaryModel.getWordAtPosition({
                lineNumber: position.lineNumber,
                column: position.column
            });
            if (!word) {
                return Promise.resolve(result);
            }
            for (const model of [primaryModel, ...otherModels]) {
                if (model.isDisposed()) {
                    continue;
                }
                const matches = model.findMatches(word.word, true, false, true, wordHelper_1.USUAL_WORD_SEPARATORS, false);
                const highlights = matches.map(m => ({
                    range: m.range,
                    kind: languages_1.DocumentHighlightKind.Text
                }));
                if (highlights) {
                    result.set(model.uri, highlights);
                }
            }
            return result;
        }
    }
    let TextualMultiDocumentHighlightFeature = class TextualMultiDocumentHighlightFeature extends lifecycle_1.Disposable {
        constructor(languageFeaturesService) {
            super();
            this._register(languageFeaturesService.multiDocumentHighlightProvider.register('*', new TextualDocumentHighlightProvider()));
        }
    };
    exports.TextualMultiDocumentHighlightFeature = TextualMultiDocumentHighlightFeature;
    exports.TextualMultiDocumentHighlightFeature = TextualMultiDocumentHighlightFeature = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService)
    ], TextualMultiDocumentHighlightFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dHVhbEhpZ2hsaWdodFByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvd29yZEhpZ2hsaWdodGVyL2Jyb3dzZXIvdGV4dHVhbEhpZ2hsaWdodFByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFNLGdDQUFnQztRQUF0QztZQUVDLGFBQVEsR0FBbUIsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFrQzlDLENBQUM7UUFoQ0EsOEJBQThCLENBQUMsWUFBd0IsRUFBRSxRQUFrQixFQUFFLFdBQXlCLEVBQUUsS0FBd0I7WUFFL0gsTUFBTSxNQUFNLEdBQUcsSUFBSSxpQkFBVyxFQUF1QixDQUFDO1lBRXRELE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDM0MsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO2dCQUMvQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07YUFDdkIsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBR0QsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7b0JBQ3hCLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsa0NBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzlGLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNwQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7b0JBQ2QsSUFBSSxFQUFFLGlDQUFxQixDQUFDLElBQUk7aUJBQ2hDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7S0FFRDtJQUVNLElBQU0sb0NBQW9DLEdBQTFDLE1BQU0sb0NBQXFDLFNBQVEsc0JBQVU7UUFDbkUsWUFDMkIsdUJBQWlEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyw4QkFBOEIsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksZ0NBQWdDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUgsQ0FBQztLQUNELENBQUE7SUFSWSxvRkFBb0M7bURBQXBDLG9DQUFvQztRQUU5QyxXQUFBLDJDQUF3QixDQUFBO09BRmQsb0NBQW9DLENBUWhEIn0=