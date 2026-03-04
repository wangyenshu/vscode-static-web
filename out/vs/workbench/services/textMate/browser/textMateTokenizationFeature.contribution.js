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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/textMate/browser/textMateTokenizationFeature", "vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl", "vs/workbench/common/contributions"], function (require, exports, extensions_1, textMateTokenizationFeature_1, textMateTokenizationFeatureImpl_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Makes sure the ITextMateTokenizationService is instantiated
     */
    let TextMateTokenizationInstantiator = class TextMateTokenizationInstantiator {
        static { this.ID = 'workbench.contrib.textMateTokenizationInstantiator'; }
        constructor(_textMateTokenizationService) { }
    };
    TextMateTokenizationInstantiator = __decorate([
        __param(0, textMateTokenizationFeature_1.ITextMateTokenizationService)
    ], TextMateTokenizationInstantiator);
    (0, extensions_1.registerSingleton)(textMateTokenizationFeature_1.ITextMateTokenizationService, textMateTokenizationFeatureImpl_1.TextMateTokenizationFeature, 0 /* InstantiationType.Eager */);
    (0, contributions_1.registerWorkbenchContribution2)(TextMateTokenizationInstantiator.ID, TextMateTokenizationInstantiator, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVUb2tlbml6YXRpb25GZWF0dXJlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS9icm93c2VyL3RleHRNYXRlVG9rZW5pemF0aW9uRmVhdHVyZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFPaEc7O09BRUc7SUFDSCxJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFnQztpQkFFckIsT0FBRSxHQUFHLG9EQUFvRCxBQUF2RCxDQUF3RDtRQUUxRSxZQUMrQiw0QkFBMEQsSUFDckYsQ0FBQzs7SUFOQSxnQ0FBZ0M7UUFLbkMsV0FBQSwwREFBNEIsQ0FBQTtPQUx6QixnQ0FBZ0MsQ0FPckM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDBEQUE0QixFQUFFLDZEQUEyQixrQ0FBMEIsQ0FBQztJQUV0RyxJQUFBLDhDQUE4QixFQUFDLGdDQUFnQyxDQUFDLEVBQUUsRUFBRSxnQ0FBZ0Msc0NBQThCLENBQUMifQ==