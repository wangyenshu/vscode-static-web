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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/editor/browser/services/codeEditorService", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/editorOptions", "vs/workbench/contrib/comments/browser/simpleCommentEditor"], function (require, exports, lifecycle_1, network_1, codeEditorService_1, language_1, model_1, resolverService_1, editorOptions_1, simpleCommentEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsInputContentProvider = void 0;
    let CommentsInputContentProvider = class CommentsInputContentProvider extends lifecycle_1.Disposable {
        static { this.ID = 'comments.input.contentProvider'; }
        constructor(textModelService, codeEditorService, _modelService, _languageService) {
            super();
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._register(textModelService.registerTextModelContentProvider(network_1.Schemas.commentsInput, this));
            this._register(codeEditorService.registerCodeEditorOpenHandler(async (input, editor, _sideBySide) => {
                if (!(editor instanceof simpleCommentEditor_1.SimpleCommentEditor)) {
                    return null;
                }
                if (editor.getModel()?.uri.toString() !== input.resource.toString()) {
                    return null;
                }
                if (input.options) {
                    (0, editorOptions_1.applyTextEditorOptions)(input.options, editor, 1 /* ScrollType.Immediate */);
                }
                return editor;
            }));
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            return existing ?? this._modelService.createModel('', this._languageService.createById('markdown'), resource);
        }
    };
    exports.CommentsInputContentProvider = CommentsInputContentProvider;
    exports.CommentsInputContentProvider = CommentsInputContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], CommentsInputContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNJbnB1dENvbnRlbnRQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudHNJbnB1dENvbnRlbnRQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7aUJBRXBDLE9BQUUsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7UUFFN0QsWUFDb0IsZ0JBQW1DLEVBQ2xDLGlCQUFxQyxFQUN6QixhQUE0QixFQUN6QixnQkFBa0M7WUFFckUsS0FBSyxFQUFFLENBQUM7WUFId0Isa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDekIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUdyRSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLGdDQUFnQyxDQUFDLGlCQUFPLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFL0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsS0FBK0IsRUFBRSxNQUEwQixFQUFFLFdBQXFCLEVBQStCLEVBQUU7Z0JBQ3hMLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSx5Q0FBbUIsQ0FBQyxFQUFFLENBQUM7b0JBQzlDLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQkFDckUsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbkIsSUFBQSxzQ0FBc0IsRUFBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sK0JBQXVCLENBQUM7Z0JBQ3JFLENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFhO1lBQ3JDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sUUFBUSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9HLENBQUM7O0lBaENXLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBS3RDLFdBQUEsbUNBQWlCLENBQUE7UUFDakIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDJCQUFnQixDQUFBO09BUk4sNEJBQTRCLENBaUN4QyJ9