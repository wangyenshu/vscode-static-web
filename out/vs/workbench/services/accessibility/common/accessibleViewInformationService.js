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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, lifecycle_1, accessibility_1, instantiation_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleViewInformationService = exports.IAccessibleViewInformationService = void 0;
    exports.IAccessibleViewInformationService = (0, instantiation_1.createDecorator)('accessibleViewInformationService');
    let AccessibleViewInformationService = class AccessibleViewInformationService extends lifecycle_1.Disposable {
        constructor(_storageService) {
            super();
            this._storageService = _storageService;
        }
        hasShownAccessibleView(viewId) {
            return this._storageService.getBoolean(`${accessibility_1.ACCESSIBLE_VIEW_SHOWN_STORAGE_PREFIX}${viewId}`, -1 /* StorageScope.APPLICATION */, false) === true;
        }
    };
    exports.AccessibleViewInformationService = AccessibleViewInformationService;
    exports.AccessibleViewInformationService = AccessibleViewInformationService = __decorate([
        __param(0, storage_1.IStorageService)
    ], AccessibleViewInformationService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZVZpZXdJbmZvcm1hdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYWNjZXNzaWJpbGl0eS9jb21tb24vYWNjZXNzaWJsZVZpZXdJbmZvcm1hdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWW5GLFFBQUEsaUNBQWlDLEdBQUcsSUFBQSwrQkFBZSxFQUFvQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBRWpJLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7UUFFL0QsWUFBOEMsZUFBZ0M7WUFDN0UsS0FBSyxFQUFFLENBQUM7WUFEcUMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBRTlFLENBQUM7UUFDRCxzQkFBc0IsQ0FBQyxNQUFjO1lBQ3BDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsR0FBRyxvREFBb0MsR0FBRyxNQUFNLEVBQUUscUNBQTRCLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQztRQUN0SSxDQUFDO0tBQ0QsQ0FBQTtJQVJZLDRFQUFnQzsrQ0FBaEMsZ0NBQWdDO1FBRS9CLFdBQUEseUJBQWUsQ0FBQTtPQUZoQixnQ0FBZ0MsQ0FRNUMifQ==