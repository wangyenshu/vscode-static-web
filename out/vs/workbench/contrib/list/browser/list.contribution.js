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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions"], function (require, exports, contextkey_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListContext = void 0;
    let ListContext = class ListContext {
        static { this.ID = 'workbench.contrib.listContext'; }
        constructor(contextKeyService) {
            contextKeyService.createKey('listSupportsTypeNavigation', true);
            // @deprecated in favor of listSupportsTypeNavigation
            contextKeyService.createKey('listSupportsKeyboardNavigation', true);
        }
    };
    exports.ListContext = ListContext;
    exports.ListContext = ListContext = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], ListContext);
    (0, contributions_1.registerWorkbenchContribution2)(ListContext.ID, ListContext, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9saXN0L2Jyb3dzZXIvbGlzdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBS3pGLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVc7aUJBRVAsT0FBRSxHQUFHLCtCQUErQixBQUFsQyxDQUFtQztRQUVyRCxZQUNxQixpQkFBcUM7WUFFekQsaUJBQWlCLENBQUMsU0FBUyxDQUFVLDRCQUE0QixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXpFLHFEQUFxRDtZQUNyRCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsZ0NBQWdDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckUsQ0FBQzs7SUFYVyxrQ0FBVzswQkFBWCxXQUFXO1FBS3JCLFdBQUEsK0JBQWtCLENBQUE7T0FMUixXQUFXLENBWXZCO0lBRUQsSUFBQSw4Q0FBOEIsRUFBQyxXQUFXLENBQUMsRUFBRSxFQUFFLFdBQVcsc0NBQThCLENBQUMifQ==