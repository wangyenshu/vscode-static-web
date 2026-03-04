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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/features/hideUnchangedRegionsFeature", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, arrays_1, observable_1, hideUnchangedRegionsFeature_1, utils_1, languageFeatures_1, outlineModel_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DiffEditorBreadcrumbsSource = class DiffEditorBreadcrumbsSource extends lifecycle_1.Disposable {
        constructor(_textModel, _languageFeaturesService, _outlineModelService) {
            super();
            this._textModel = _textModel;
            this._languageFeaturesService = _languageFeaturesService;
            this._outlineModelService = _outlineModelService;
            this._currentModel = (0, observable_1.observableValue)(this, undefined);
            const documentSymbolProviderChanged = (0, observable_1.observableSignalFromEvent)('documentSymbolProvider.onDidChange', this._languageFeaturesService.documentSymbolProvider.onDidChange);
            const textModelChanged = (0, observable_1.observableSignalFromEvent)('_textModel.onDidChangeContent', event_1.Event.debounce(e => this._textModel.onDidChangeContent(e), () => undefined, 100));
            this._register((0, observable_1.autorunWithStore)(async (reader, store) => {
                documentSymbolProviderChanged.read(reader);
                textModelChanged.read(reader);
                const src = store.add(new utils_1.DisposableCancellationTokenSource());
                const model = await this._outlineModelService.getOrCreate(this._textModel, src.token);
                if (store.isDisposed) {
                    return;
                }
                this._currentModel.set(model, undefined);
            }));
        }
        getBreadcrumbItems(startRange, reader) {
            const m = this._currentModel.read(reader);
            if (!m) {
                return [];
            }
            const symbols = m.asListOfDocumentSymbols()
                .filter(s => startRange.contains(s.range.startLineNumber) && !startRange.contains(s.range.endLineNumber));
            symbols.sort((0, arrays_1.reverseOrder)((0, arrays_1.compareBy)(s => s.range.endLineNumber - s.range.startLineNumber, arrays_1.numberComparator)));
            return symbols.map(s => ({ name: s.name, kind: s.kind, startLineNumber: s.range.startLineNumber }));
        }
    };
    DiffEditorBreadcrumbsSource = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, outlineModel_1.IOutlineModelService)
    ], DiffEditorBreadcrumbsSource);
    hideUnchangedRegionsFeature_1.HideUnchangedRegionsFeature.setBreadcrumbsSourceFactory((textModel, instantiationService) => {
        return instantiationService.createInstance(DiffEditorBreadcrumbsSource, textModel);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZGlmZkVkaXRvckJyZWFkY3J1bWJzL2Jyb3dzZXIvY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBY2hHLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFHbkQsWUFDa0IsVUFBc0IsRUFDYix3QkFBbUUsRUFDdkUsb0JBQTJEO1lBRWpGLEtBQUssRUFBRSxDQUFDO1lBSlMsZUFBVSxHQUFWLFVBQVUsQ0FBWTtZQUNJLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDdEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUxqRSxrQkFBYSxHQUFHLElBQUEsNEJBQWUsRUFBMkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBUzNGLE1BQU0sNkJBQTZCLEdBQUcsSUFBQSxzQ0FBeUIsRUFDOUQsb0NBQW9DLEVBQ3BDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQ2hFLENBQUM7WUFFRixNQUFNLGdCQUFnQixHQUFHLElBQUEsc0NBQXlCLEVBQ2pELCtCQUErQixFQUMvQixhQUFLLENBQUMsUUFBUSxDQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQ3JGLENBQUM7WUFFRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsNkJBQWdCLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDdkQsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTlCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx5Q0FBaUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEYsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQUMsT0FBTztnQkFBQyxDQUFDO2dCQUVqQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxVQUFxQixFQUFFLE1BQWU7WUFDL0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUFDLE9BQU8sRUFBRSxDQUFDO1lBQUMsQ0FBQztZQUN0QixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsdUJBQXVCLEVBQUU7aUJBQ3pDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzNHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxxQkFBWSxFQUFDLElBQUEsa0JBQVMsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLHlCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlHLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQztLQUNELENBQUE7SUF4Q0ssMkJBQTJCO1FBSzlCLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSxtQ0FBb0IsQ0FBQTtPQU5qQiwyQkFBMkIsQ0F3Q2hDO0lBRUQseURBQTJCLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsRUFBRTtRQUMzRixPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDLENBQUMsQ0FBQyJ9