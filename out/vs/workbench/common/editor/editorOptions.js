/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor"], function (require, exports, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyTextEditorOptions = applyTextEditorOptions;
    function applyTextEditorOptions(options, editor, scrollType) {
        let applied = false;
        // Restore view state if any
        const viewState = massageEditorViewState(options);
        if ((0, editor_1.isTextEditorViewState)(viewState)) {
            editor.restoreViewState(viewState);
            applied = true;
        }
        // Restore selection if any
        if (options.selection) {
            const range = {
                startLineNumber: options.selection.startLineNumber,
                startColumn: options.selection.startColumn,
                endLineNumber: options.selection.endLineNumber ?? options.selection.startLineNumber,
                endColumn: options.selection.endColumn ?? options.selection.startColumn
            };
            // Apply selection with a source so that listeners can
            // distinguish this selection change from others.
            // If no source is provided, set a default source to
            // signal this navigation.
            editor.setSelection(range, options.selectionSource ?? "code.navigation" /* TextEditorSelectionSource.NAVIGATION */);
            // Reveal selection
            if (options.selectionRevealType === 2 /* TextEditorSelectionRevealType.NearTop */) {
                editor.revealRangeNearTop(range, scrollType);
            }
            else if (options.selectionRevealType === 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */) {
                editor.revealRangeNearTopIfOutsideViewport(range, scrollType);
            }
            else if (options.selectionRevealType === 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */) {
                editor.revealRangeInCenterIfOutsideViewport(range, scrollType);
            }
            else {
                editor.revealRangeInCenter(range, scrollType);
            }
            applied = true;
        }
        return applied;
    }
    function massageEditorViewState(options) {
        // Without a selection or view state, just return immediately
        if (!options.selection || !options.viewState) {
            return options.viewState;
        }
        // Diff editor: since we have an explicit selection, clear the
        // cursor state from the modified side where the selection
        // applies. This avoids a redundant selection change event.
        const candidateDiffViewState = options.viewState;
        if (candidateDiffViewState.modified) {
            candidateDiffViewState.modified.cursorState = [];
            return candidateDiffViewState;
        }
        // Code editor: since we have an explicit selection, clear the
        // cursor state. This avoids a redundant selection change event.
        const candidateEditorViewState = options.viewState;
        if (candidateEditorViewState.cursorState) {
            candidateEditorViewState.cursorState = [];
        }
        return candidateEditorViewState;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL2VkaXRvck9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsd0RBeUNDO0lBekNELFNBQWdCLHNCQUFzQixDQUFDLE9BQTJCLEVBQUUsTUFBZSxFQUFFLFVBQXNCO1FBQzFHLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVwQiw0QkFBNEI7UUFDNUIsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEQsSUFBSSxJQUFBLDhCQUFxQixFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDdEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRW5DLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDJCQUEyQjtRQUMzQixJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN2QixNQUFNLEtBQUssR0FBVztnQkFDckIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsZUFBZTtnQkFDbEQsV0FBVyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVztnQkFDMUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBYSxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsZUFBZTtnQkFDbkYsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVzthQUN2RSxDQUFDO1lBRUYsc0RBQXNEO1lBQ3RELGlEQUFpRDtZQUNqRCxvREFBb0Q7WUFDcEQsMEJBQTBCO1lBQzFCLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxlQUFlLGdFQUF3QyxDQUFDLENBQUM7WUFFNUYsbUJBQW1CO1lBQ25CLElBQUksT0FBTyxDQUFDLG1CQUFtQixrREFBMEMsRUFBRSxDQUFDO2dCQUMzRSxNQUFNLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzlDLENBQUM7aUJBQU0sSUFBSSxPQUFPLENBQUMsbUJBQW1CLG1FQUEyRCxFQUFFLENBQUM7Z0JBQ25HLE1BQU0sQ0FBQyxtQ0FBbUMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDL0QsQ0FBQztpQkFBTSxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsa0VBQTBELEVBQUUsQ0FBQztnQkFDbEcsTUFBTSxDQUFDLG9DQUFvQyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUMsT0FBMkI7UUFFMUQsNkRBQTZEO1FBQzdELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzlDLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUMxQixDQUFDO1FBRUQsOERBQThEO1FBQzlELDBEQUEwRDtRQUMxRCwyREFBMkQ7UUFDM0QsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsU0FBaUMsQ0FBQztRQUN6RSxJQUFJLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBRWpELE9BQU8sc0JBQXNCLENBQUM7UUFDL0IsQ0FBQztRQUVELDhEQUE4RDtRQUM5RCxnRUFBZ0U7UUFDaEUsTUFBTSx3QkFBd0IsR0FBRyxPQUFPLENBQUMsU0FBaUMsQ0FBQztRQUMzRSxJQUFJLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFDLHdCQUF3QixDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDM0MsQ0FBQztRQUVELE9BQU8sd0JBQXdCLENBQUM7SUFDakMsQ0FBQyJ9