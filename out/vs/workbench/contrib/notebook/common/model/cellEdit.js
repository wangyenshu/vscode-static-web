/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellMetadataEdit = exports.SpliceCellsEdit = exports.MoveCellEdit = void 0;
    class MoveCellEdit {
        get label() {
            return this.length === 1 ? 'Move Cell' : 'Move Cells';
        }
        constructor(resource, fromIndex, length, toIndex, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.fromIndex = fromIndex;
            this.length = length;
            this.toIndex = toIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.code = 'undoredo.textBufferEdit';
        }
        undo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.toIndex, this.length, this.fromIndex, this.endSelections, this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.fromIndex, this.length, this.toIndex, this.beforedSelections, this.endSelections);
        }
    }
    exports.MoveCellEdit = MoveCellEdit;
    class SpliceCellsEdit {
        get label() {
            // Compute the most appropriate labels
            if (this.diffs.length === 1 && this.diffs[0][1].length === 0) {
                return this.diffs[0][2].length > 1 ? 'Insert Cells' : 'Insert Cell';
            }
            if (this.diffs.length === 1 && this.diffs[0][2].length === 0) {
                return this.diffs[0][1].length > 1 ? 'Delete Cells' : 'Delete Cell';
            }
            // Default to Insert Cell
            return 'Insert Cell';
        }
        constructor(resource, diffs, editingDelegate, beforeHandles, endHandles) {
            this.resource = resource;
            this.diffs = diffs;
            this.editingDelegate = editingDelegate;
            this.beforeHandles = beforeHandles;
            this.endHandles = endHandles;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.code = 'undoredo.textBufferEdit';
        }
        undo() {
            if (!this.editingDelegate.replaceCell) {
                throw new Error('Notebook Replace Cell not implemented for Undo/Redo');
            }
            this.diffs.forEach(diff => {
                this.editingDelegate.replaceCell(diff[0], diff[2].length, diff[1], this.beforeHandles);
            });
        }
        redo() {
            if (!this.editingDelegate.replaceCell) {
                throw new Error('Notebook Replace Cell not implemented for Undo/Redo');
            }
            this.diffs.reverse().forEach(diff => {
                this.editingDelegate.replaceCell(diff[0], diff[1].length, diff[2], this.endHandles);
            });
        }
    }
    exports.SpliceCellsEdit = SpliceCellsEdit;
    class CellMetadataEdit {
        constructor(resource, index, oldMetadata, newMetadata, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.oldMetadata = oldMetadata;
            this.newMetadata = newMetadata;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Update Cell Metadata';
            this.code = 'undoredo.textBufferEdit';
        }
        undo() {
            if (!this.editingDelegate.updateCellMetadata) {
                return;
            }
            this.editingDelegate.updateCellMetadata(this.index, this.oldMetadata);
        }
        redo() {
            if (!this.editingDelegate.updateCellMetadata) {
                return;
            }
            this.editingDelegate.updateCellMetadata(this.index, this.newMetadata);
        }
    }
    exports.CellMetadataEdit = CellMetadataEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbW9kZWwvY2VsbEVkaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLFlBQVk7UUFFeEIsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDdkQsQ0FBQztRQUdELFlBQ1EsUUFBYSxFQUNaLFNBQWlCLEVBQ2pCLE1BQWMsRUFDZCxPQUFlLEVBQ2YsZUFBeUMsRUFDekMsaUJBQThDLEVBQzlDLGFBQTBDO1lBTjNDLGFBQVEsR0FBUixRQUFRLENBQUs7WUFDWixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2Ysb0JBQWUsR0FBZixlQUFlLENBQTBCO1lBQ3pDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBNkI7WUFDOUMsa0JBQWEsR0FBYixhQUFhLENBQTZCO1lBYm5ELFNBQUksd0NBQThEO1lBSWxFLFNBQUksR0FBVyx5QkFBeUIsQ0FBQztRQVd6QyxDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7WUFDckUsQ0FBQztZQUVELElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLEVB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