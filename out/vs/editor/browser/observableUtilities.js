/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/position"], function (require, exports, lifecycle_1, observable_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.obsCodeEditor = obsCodeEditor;
    /**
     * Returns a facade for the code editor that provides observables for various states/events.
    */
    function obsCodeEditor(editor) {
        return ObservableCodeEditor.get(editor);
    }
    class ObservableCodeEditor {
        static { this._map = new Map(); }
        /**
         * Make sure that editor is not disposed yet!
        */
        static get(editor) {
            let result = ObservableCodeEditor._map.get(editor);
            if (!result) {
                result = new ObservableCodeEditor(editor);
                ObservableCodeEditor._map.set(editor, result);
                const d = editor.onDidDispose(() => {
                    ObservableCodeEditor._map.delete(editor);
                    d.dispose();
                });
            }
            return result;
        }
        constructor(editor) {
            this.editor = editor;
            this.model = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModel, () => this.editor.getModel());
            this.value = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModelContent, () => this.editor.getValue());
            this.valueIsEmpty = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModelContent, () => this.editor.getModel()?.getValueLength() === 0);
            this.selections = (0, observable_1.observableFromEvent)(this.editor.onDidChangeCursorSelection, () => this.editor.getSelections());
            this.cursorPosition = (0, observable_1.derivedOpts)({ owner: this, equalsFn: position_1.Position.equals }, reader => this.selections.read(reader)?.[0]?.getPosition() ?? null);
            this.isFocused = (0, observable_1.observableFromEvent)(e => {
                const d1 = this.editor.onDidFocusEditorWidget(e);
                const d2 = this.editor.onDidBlurEditorWidget(e);
                return {
                    dispose() {
                        d1.dispose();
                        d2.dispose();
                    }
                };
            }, () => this.editor.hasWidgetFocus());
        }
        setDecorations(decorations) {
            const d = new lifecycle_1.DisposableStore();
            const decorationsCollection = this.editor.createDecorationsCollection();
            d.add((0, observable_1.autorunOpts)({ owner: this, debugName: () => `Apply decorations from ${decorations.debugName}` }, reader => {
                const d = decorations.read(reader);
                decorationsCollection.set(d);
            }));
            d.add({
                dispose: () => {
                    decorationsCollection.clear();
                }
            });
            return d;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZVV0aWxpdGllcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL29ic2VydmFibGVVdGlsaXRpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsc0NBRUM7SUFMRDs7TUFFRTtJQUNGLFNBQWdCLGFBQWEsQ0FBQyxNQUFtQjtRQUNoRCxPQUFPLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsTUFBTSxvQkFBb0I7aUJBQ1YsU0FBSSxHQUFHLElBQUksR0FBRyxFQUFxQyxBQUEvQyxDQUFnRDtRQUVuRTs7VUFFRTtRQUNLLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsSUFBSSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxHQUFHLElBQUksb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtvQkFDbEMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDekMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELFlBQW9DLE1BQW1CO1lBQW5CLFdBQU0sR0FBTixNQUFNLENBQWE7WUFHdkMsVUFBSyxHQUFHLElB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