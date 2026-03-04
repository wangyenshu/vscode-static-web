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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/accessibility/common/accessibility"], function (require, exports, textEditorModel_1, language_1, model_1, languageDetectionWorkerService_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditorModel = void 0;
    /**
     * An editor model for in-memory, readonly text content that
     * is backed by an existing editor model.
     */
    let TextResourceEditorModel = class TextResourceEditorModel extends textEditorModel_1.BaseTextEditorModel {
        constructor(resource, languageService, modelService, languageDetectionService, accessibilityService) {
            super(modelService, languageService, languageDetectionService, accessibilityService, resource);
        }
        dispose() {
            // force this class to dispose the underlying model
            if (this.textEditorModelHandle) {
                this.modelService.destroyModel(this.textEditorModelHandle);
            }
            super.dispose();
        }
    };
    exports.TextResourceEditorModel = TextResourceEditorModel;
    exports.TextResourceEditorModel = TextResourceEditorModel = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(4, accessibility_1.IAccessibilityService)
    ], TextResourceEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlRWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci90ZXh0UmVzb3VyY2VFZGl0b3JNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTaEc7OztPQUdHO0lBQ0ksSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxxQ0FBbUI7UUFFL0QsWUFDQyxRQUFhLEVBQ0ssZUFBaUMsRUFDcEMsWUFBMkIsRUFDZix3QkFBbUQsRUFDdkQsb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxZQUFZLEVBQUUsZUFBZSxFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFFUSxPQUFPO1lBRWYsbURBQW1EO1lBQ25ELElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFFRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUNELENBQUE7SUFyQlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFJakMsV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDBEQUF5QixDQUFBO1FBQ3pCLFdBQUEscUNBQXFCLENBQUE7T0FQWCx1QkFBdUIsQ0FxQm5DIn0=