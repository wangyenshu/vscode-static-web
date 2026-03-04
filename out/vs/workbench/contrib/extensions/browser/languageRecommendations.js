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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/product/common/productService"], function (require, exports, extensionRecommendations_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageRecommendations = void 0;
    let LanguageRecommendations = class LanguageRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        constructor(productService) {
            super();
            this.productService = productService;
            this._recommendations = [];
        }
        async doActivate() {
            if (this.productService.languageExtensionTips) {
                this._recommendations = this.productService.languageExtensionTips.map(extensionId => ({
                    extension: extensionId.toLowerCase(),
                    reason: {
                        reasonId: 6 /* ExtensionRecommendationReason.Application */,
                        reasonText: ''
                    }
                }));
            }
        }
    };
    exports.LanguageRecommendations = LanguageRecommendations;
    exports.LanguageRecommendations = LanguageRecommendations = __decorate([
        __param(0, productService_1.IProductService)
    ], LanguageRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VSZWNvbW1lbmRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvbGFuZ3VhZ2VSZWNvbW1lbmRhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBTXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsbURBQXdCO1FBR3BFLElBQUksZUFBZSxLQUE2QyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFFL0YsWUFDa0IsY0FBZ0Q7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFGMEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBSjFELHFCQUFnQixHQUE4QixFQUFFLENBQUM7UUFPekQsQ0FBQztRQUVTLEtBQUssQ0FBQyxVQUFVO1lBQ3pCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUEwQjtvQkFDOUcsU0FBUyxFQUFFLFdBQVcsQ0FBQyxXQUFXLEVBQUU7b0JBQ3BDLE1BQU0sRUFBRTt3QkFDUCxRQUFRLG1EQUEyQzt3QkFDbkQsVUFBVSxFQUFFLEVBQUU7cUJBQ2Q7aUJBQ0EsQ0FBQSxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztLQUVELENBQUE7SUF2QlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFNakMsV0FBQSxnQ0FBZSxDQUFBO09BTkwsdUJBQXVCLENBdUJuQyJ9