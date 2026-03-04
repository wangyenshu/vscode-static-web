/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/common/editor/editorOptions", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/workbench/browser/parts/editor/textEditor"], function (require, exports, nls_1, types_1, editorOptions_1, contextkey_1, resources_1, codeEditorWidget_1, textEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTextCodeEditor = void 0;
    /**
     * A text editor using the code editor widget.
     */
    class AbstractTextCodeEditor extends textEditor_1.AbstractTextEditor {
        constructor() {
            super(...arguments);
            this.editorControl = undefined;
        }
        get scopedContextKeyService() {
            return this.editorControl?.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textEditor', "Text Editor");
        }
        createEditorControl(parent, initialOptions) {
            this.editorControl = this._register(this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, initialOptions, this.getCodeEditorWidgetOptions()));
        }
        getCodeEditorWidgetOptions() {
            return Object.create(null);
        }
        updateEditorControlOptions(options) {
            this.editorControl?.updateOptions(options);
        }
        getMainControl() {
            return this.editorControl;
        }
        getControl() {
            return this.editorControl;
        }
        computeEditorViewState(resource) {
            if (!this.editorControl) {
                return undefined;
            }
            const model = this.editorControl.getModel();
            if (!model) {
                return undefined; // view state always needs a model
            }
            const modelUri = model.uri;
            if (!modelUri) {
                return undefined; // model URI is needed to make sure we save the view state correctly
            }
            if (!(0, resources_1.isEqual)(modelUri, resource)) {
                return undefined; // prevent saving view state for a model that is not the expected one
            }
            return this.editorControl.saveViewState() ?? undefined;
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, (0, types_1.assertIsDefined)(this.editorControl), 0 /* ScrollType.Smooth */);
            }
        }
        focus() {
            super.focus();
            this.editorControl?.focus();
        }
        hasFocus() {
            return this.editorControl?.hasTextFocus() || super.hasFocus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            if (visible) {
                this.editorControl?.onVisible();
            }
            else {
                this.editorControl?.onHide();
            }
        }
        layout(dimension) {
            this.editorControl?.layout(dimension);
        }
    }
    exports.AbstractTextCodeEditor = AbstractTextCodeEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dENvZGVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvdGV4dENvZGVFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRzs7T0FFRztJQUNILE1BQXNCLHNCQUFtRCxTQUFRLCtCQUFxQjtRQUF0Rzs7WUFFVyxrQkFBYSxHQUE0QixTQUFTLENBQUM7UUF1RjlELENBQUM7UUFyRkEsSUFBYSx1QkFBdUI7WUFDbkMsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVRLFFBQVE7WUFDaEIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsT0FBTyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVTLG1CQUFtQixDQUFDLE1BQW1CLEVBQUUsY0FBa0M7WUFDcEYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUNBQWdCLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUosQ0FBQztRQUVTLDBCQUEwQjtZQUNuQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVTLDBCQUEwQixDQUFDLE9BQTJCO1lBQy9ELElBQUksQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFUyxjQUFjO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRVEsVUFBVTtZQUNsQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVrQixzQkFBc0IsQ0FBQyxRQUFhO1lBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzVDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLFNBQVMsQ0FBQyxDQUFDLGtDQUFrQztZQUNyRCxDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztZQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxTQUFTLENBQUMsQ0FBQyxvRUFBb0U7WUFDdkYsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFBLG1CQUFPLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sU0FBUyxDQUFDLENBQUMscUVBQXFFO1lBQ3hGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFrQixJQUFJLFNBQVMsQ0FBQztRQUN4RSxDQUFDO1FBRVEsVUFBVSxDQUFDLE9BQXVDO1lBQzFELEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFMUIsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFBLHNDQUFzQixFQUFDLE9BQU8sRUFBRSxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyw0QkFBb0IsQ0FBQztZQUN6RixDQUFDO1FBQ0YsQ0FBQztRQUVRLEtBQUs7WUFDYixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFZCxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFUSxRQUFRO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0QsQ0FBQztRQUVrQixnQkFBZ0IsQ0FBQyxPQUFnQjtZQUNuRCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFaEMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBRVEsTUFBTSxDQUFDLFNBQW9CO1lBQ25DLElBQUksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQXpGRCx3REF5RkMifQ==