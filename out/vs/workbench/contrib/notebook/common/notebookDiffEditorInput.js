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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/editorModel", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, editor_1, editorModel_1, diffEditorInput_1, notebookEditorInput_1, editorService_1) {
    "use strict";
    var NotebookDiffEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDiffEditorInput = void 0;
    class NotebookDiffEditorModel extends editorModel_1.EditorModel {
        constructor(original, modified) {
            super();
            this.original = original;
            this.modified = modified;
        }
    }
    let NotebookDiffEditorInput = class NotebookDiffEditorInput extends diffEditorInput_1.DiffEditorInput {
        static { NotebookDiffEditorInput_1 = this; }
        static create(instantiationService, resource, name, description, originalResource, viewType) {
            const original = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, originalResource, undefined, viewType);
            const modified = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, undefined, viewType);
            return instantiationService.createInstance(NotebookDiffEditorInput_1, name, description, original, modified, viewType);
        }
        static { this.ID = 'workbench.input.diffNotebookInput'; }
        get resource() {
            return this.modified.resource;
        }
        get editorId() {
            return this.viewType;
        }
        constructor(name, description, original, modified, viewType, editorService) {
            super(name, description, original, modified, undefined, editorService);
            this.original = original;
            this.modified = modified;
            this.viewType = viewType;
            this._modifiedTextModel = null;
            this._originalTextModel = null;
            this._cachedModel = undefined;
        }
        get typeId() {
            return NotebookDiffEditorInput_1.ID;
        }
        async resolve() {
            const [originalEditorModel, modifiedEditorModel] = await Promise.all([
                this.original.resolve(),
                this.modified.resolve(),
            ]);
            this._cachedModel?.dispose();
            // TODO@rebornix check how we restore the editor in text diff editor
            if (!modifiedEditorModel) {
                throw new Error(`Fail to resolve modified editor model for resource ${this.modified.resource} with notebookType ${this.viewType}`);
            }
            if (!originalEditorModel) {
                throw new Error(`Fail to resolve original editor model for resource ${this.original.resource} with notebookType ${this.viewType}`);
            }
            this._originalTextModel = originalEditorModel;
            this._modifiedTextModel = modifiedEditorModel;
            this._cachedModel = new NotebookDiffEditorModel(this._originalTextModel, this._modifiedTextModel);
            return this._cachedModel;
        }
        toUntyped() {
            const original = { resource: this.original.resource };
            const modified = { resource: this.resource };
            return {
                original,
                modified,
                primary: modified,
                secondary: original,
                options: {
                    override: this.viewType
                }
            };
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof NotebookDiffEditorInput_1) {
                return this.modified.matches(otherInput.modified)
                    && this.original.matches(otherInput.original)
                    && this.viewType === otherInput.viewType;
            }
            if ((0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return this.modified.matches(otherInput.modified)
                    && this.original.matches(otherInput.original)
                    && this.editorId !== undefined
                    && (this.editorId === otherInput.options?.override || otherInput.options?.override === undefined);
            }
            return false;
        }
        dispose() {
            super.dispose();
            this._cachedModel?.dispose();
            this._cachedModel = undefined;
            this.original.dispose();
            this.modified.dispose();
            this._originalTextModel = null;
            this._modifiedTextModel = null;
        }
    };
    exports.NotebookDiffEditorInput = NotebookDiffEditorInput;
    exports.NotebookDiffEditorInput = NotebookDiffEditorInput = NotebookDiffEditorInput_1 = __decorate([
        __param(5, editorService_1.IEditorService)
    ], NotebookDiffEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbm90ZWJvb2tEaWZmRWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVloRyxNQUFNLHVCQUF3QixTQUFRLHlCQUFXO1FBQ2hELFlBQ1UsUUFBc0MsRUFDdEMsUUFBc0M7WUFFL0MsS0FBSyxFQUFFLENBQUM7WUFIQyxhQUFRLEdBQVIsUUFBUSxDQUE4QjtZQUN0QyxhQUFRLEdBQVIsUUFBUSxDQUE4QjtRQUdoRCxDQUFDO0tBQ0Q7SUFFTSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLGlDQUFlOztRQUMzRCxNQUFNLENBQUMsTUFBTSxDQUFDLG9CQUEyQyxFQUFFLFFBQWEsRUFBRSxJQUF3QixFQUFFLFdBQStCLEVBQUUsZ0JBQXFCLEVBQUUsUUFBZ0I7WUFDM0ssTUFBTSxRQUFRLEdBQUcseUNBQW1CLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM5RyxNQUFNLFFBQVEsR0FBRyx5Q0FBbUIsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0RyxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBdUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEgsQ0FBQztpQkFFd0IsT0FBRSxHQUFXLG1DQUFtQyxBQUE5QyxDQUErQztRQUsxRSxJQUFhLFFBQVE7WUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBYSxRQUFRO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBSUQsWUFDQyxJQUF3QixFQUN4QixXQUErQixFQUNiLFFBQTZCLEVBQzdCLFFBQTZCLEVBQy9CLFFBQWdCLEVBQ2hCLGFBQTZCO1lBRTdDLEtBQUssQ0FDSixJQUFJLEVBQ0osV0FBVyxFQUNYLFFBQVEsRUFDUixRQUFRLEVBQ1IsU0FBUyxFQUNULGFBQWEsQ0FDYixDQUFDO1lBWmdCLGFBQVEsR0FBUixRQUFRLENBQXFCO1lBQzdCLGFBQVEsR0FBUixRQUFRLENBQXFCO1lBQy9CLGFBQVEsR0FBUixRQUFRLENBQVE7WUFsQnpCLHVCQUFrQixHQUF3QyxJQUFJLENBQUM7WUFDL0QsdUJBQWtCLEdBQXdDLElBQUksQ0FBQztZQVUvRCxpQkFBWSxHQUF3QyxTQUFTLENBQUM7UUFrQnRFLENBQUM7UUFFRCxJQUFhLE1BQU07WUFDbEIsT0FBTyx5QkFBdUIsQ0FBQyxFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVRLEtBQUssQ0FBQyxPQUFPO1lBQ3JCLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3ZCLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFFN0Isb0VBQW9FO1lBQ3BFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsc0JBQXNCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BJLENBQUM7WUFFRCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLHNCQUFzQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwSSxDQUFDO1lBRUQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO1lBQzlDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztZQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksdUJBQXVCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2xHLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRVEsU0FBUztZQUNqQixNQUFNLFFBQVEsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RELE1BQU0sUUFBUSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QyxPQUFPO2dCQUNOLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixPQUFPLEVBQUUsUUFBUTtnQkFDakIsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLE9BQU8sRUFBRTtvQkFDUixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7aUJBQ3ZCO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFUSxPQUFPLENBQUMsVUFBNkM7WUFDN0QsSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksVUFBVSxZQUFZLHlCQUF1QixFQUFFLENBQUM7Z0JBQ25ELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQzt1QkFDN0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQzt1QkFDMUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLElBQUEsa0NBQXlCLEVBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO3VCQUM3QyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO3VCQUMxQyxJQUFJLENBQUMsUUFBUSxLQUFLLFNBQVM7dUJBQzNCLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUMsT0FBTyxFQUFFLFFBQVEsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQztZQUNwRyxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQy9CLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDaEMsQ0FBQzs7SUE5R1csMERBQXVCO3NDQUF2Qix1QkFBdUI7UUE0QmpDLFdBQUEsOEJBQWMsQ0FBQTtPQTVCSix1QkFBdUIsQ0ErR25DIn0=