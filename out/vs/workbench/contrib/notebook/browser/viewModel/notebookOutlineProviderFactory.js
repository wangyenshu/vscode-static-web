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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProvider"], function (require, exports, lifecycle_1, instantiation_1, notebookOutlineProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellOutlineProviderFactory = exports.INotebookCellOutlineProviderFactory = void 0;
    let NotebookCellOutlineProviderReferenceCollection = class NotebookCellOutlineProviderReferenceCollection extends lifecycle_1.ReferenceCollection {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
        }
        createReferencedObject(_key, editor, target) {
            return this.instantiationService.createInstance(notebookOutlineProvider_1.NotebookCellOutlineProvider, editor, target);
        }
        destroyReferencedObject(_key, object) {
            object.dispose();
        }
    };
    NotebookCellOutlineProviderReferenceCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], NotebookCellOutlineProviderReferenceCollection);
    exports.INotebookCellOutlineProviderFactory = (0, instantiation_1.createDecorator)('INotebookCellOutlineProviderFactory');
    let NotebookCellOutlineProviderFactory = class NotebookCellOutlineProviderFactory {
        constructor(instantiationService) {
            this._data = instantiationService.createInstance(NotebookCellOutlineProviderReferenceCollection);
        }
        getOrCreate(editor, target) {
            return this._data.acquire(editor.getId(), editor, target);
        }
    };
    exports.NotebookCellOutlineProviderFactory = NotebookCellOutlineProviderFactory;
    exports.NotebookCellOutlineProviderFactory = NotebookCellOutlineProviderFactory = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], NotebookCellOutlineProviderFactory);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lUHJvdmlkZXJGYWN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3TW9kZWwvbm90ZWJvb2tPdXRsaW5lUHJvdmlkZXJGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVFoRyxJQUFNLDhDQUE4QyxHQUFwRCxNQUFNLDhDQUErQyxTQUFRLCtCQUFnRDtRQUM1RyxZQUFvRCxvQkFBMkM7WUFDOUYsS0FBSyxFQUFFLENBQUM7WUFEMkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtRQUUvRixDQUFDO1FBQ2tCLHNCQUFzQixDQUFDLElBQVksRUFBRSxNQUF1QixFQUFFLE1BQXFCO1lBQ3JHLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxREFBMkIsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUNrQix1QkFBdUIsQ0FBQyxJQUFZLEVBQUUsTUFBbUM7WUFDM0YsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xCLENBQUM7S0FDRCxDQUFBO0lBVkssOENBQThDO1FBQ3RDLFdBQUEscUNBQXFCLENBQUE7T0FEN0IsOENBQThDLENBVW5EO0lBRVksUUFBQSxtQ0FBbUMsR0FBRyxJQUFBLCtCQUFlLEVBQXNDLHFDQUFxQyxDQUFDLENBQUM7SUFNeEksSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBa0M7UUFFOUMsWUFBbUMsb0JBQTJDO1lBQzdFLElBQUksQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUVELFdBQVcsQ0FBQyxNQUF1QixFQUFFLE1BQXFCO1lBQ3pELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMzRCxDQUFDO0tBQ0QsQ0FBQTtJQVRZLGdGQUFrQztpREFBbEMsa0NBQWtDO1FBRWpDLFdBQUEscUNBQXFCLENBQUE7T0FGdEIsa0NBQWtDLENBUzlDIn0=