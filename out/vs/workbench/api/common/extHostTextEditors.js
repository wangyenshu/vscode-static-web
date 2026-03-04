/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTextEditor", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, arrays, event_1, extHost_protocol_1, extHostTextEditor_1, TypeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditors = void 0;
    class ExtHostEditors {
        constructor(mainContext, _extHostDocumentsAndEditors) {
            this._extHostDocumentsAndEditors = _extHostDocumentsAndEditors;
            this._onDidChangeTextEditorSelection = new event_1.Emitter();
            this._onDidChangeTextEditorOptions = new event_1.Emitter();
            this._onDidChangeTextEditorVisibleRanges = new event_1.Emitter();
            this._onDidChangeTextEditorViewColumn = new event_1.Emitter();
            this._onDidChangeActiveTextEditor = new event_1.Emitter();
            this._onDidChangeVisibleTextEditors = new event_1.Emitter();
            this.onDidChangeTextEditorSelection = this._onDidChangeTextEditorSelection.event;
            this.onDidChangeTextEditorOptions = this._onDidChangeTextEditorOptions.event;
            this.onDidChangeTextEditorVisibleRanges = this._onDidChangeTextEditorVisibleRanges.event;
            this.onDidChangeTextEditorViewColumn = this._onDidChangeTextEditorViewColumn.event;
            this.onDidChangeActiveTextEditor = this._onDidChangeActiveTextEditor.event;
            this.onDidChangeVisibleTextEditors = this._onDidChangeVisibleTextEditors.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors);
            this._extHostDocumentsAndEditors.onDidChangeVisibleTextEditors(e => this._onDidChangeVisibleTextEditors.fire(e));
            this._extHostDocumentsAndEditors.onDidChangeActiveTextEditor(e => this._onDidChangeActiveTextEditor.fire(e));
        }
        getActiveTextEditor() {
            return this._extHostDocumentsAndEditors.activeEditor();
        }
        getVisibleTextEditors(internal) {
            const editors = this._extHostDocumentsAndEditors.allEditors();
            return internal
                ? editors
                : editors.map(editor => editor.value);
        }
        async showTextDocument(document, columnOrOptions, preserveFocus) {
            let options;
            if (typeof columnOrOptions === 'number') {
                options = {
                    position: TypeConverters.ViewColumn.from(columnOrOptions),
                    preserveFocus
                };
            }
            else if (typeof columnOrOptions === 'object') {
                options = {
                    position: TypeConverters.ViewColumn.from(columnOrOptions.viewColumn),
                    preserveFocus: columnOrOptions.preserveFocus,
                    selection: typeof columnOrOptions.selection === 'object' ? TypeConverters.Range.from(columnOrOptions.selection) : undefined,
                    pinned: typeof columnOrOptions.preview === 'boolean' ? !columnOrOptions.preview : undefined
                };
            }
            else {
                options = {
                    preserveFocus: false
                };
            }
            const editorId = await this._proxy.$tryShowTextDocument(document.uri, options);
            const editor = editorId && this._extHostDocumentsAndEditors.getEditor(editorId);
            if (editor) {
                return editor.value;
            }
            // we have no editor... having an id means that we had an editor
            // on the main side and that it isn't the current editor anymore...
            if (editorId) {
                throw new Error(`Could NOT open editor for "${document.uri.toString()}" because another editor opened in the meantime.`);
            }
            else {
                throw new Error(`Could NOT open editor for "${document.uri.toString()}".`);
            }
        }
        createTextEditorDecorationType(extension, options) {
            return new extHostTextEditor_1.TextEditorDecorationType(this._proxy, extension, options).value;
        }
        // --- called from main thread
        $acceptEditorPropertiesChanged(id, data) {
            const textEditor = this._extHostDocumentsAndEditors.getEditor(id);
            if (!textEditor) {
                throw new Error('unknown text editor');
            }
            // (1) set all properties
            if (data.options) {
                textEditor._acceptOptions(data.options);
            }
            if (data.selections) {
                const selections = data.selections.selections.map(TypeConverters.Selection.to);
                textEditor._acceptSelections(selections);
            }
            if (data.visibleRanges) {
                const visibleRanges = arrays.coalesce(data.visibleRanges.map(TypeConverters.Range.to));
                textEditor._acceptVisibleRanges(visibleRanges);
            }
            // (2) fire change events
            if (data.options) {
                this._onDidChangeTextEditorOptions.fire({
                    textEditor: textEditor.value,
                    options: { ...data.options, lineNumbers: TypeConverters.TextEditorLineNumbersStyle.to(data.options.lineNumbers) }
                });
            }
            if (data.selections) {
                const kind = extHostTypes_1.TextEditorSelectionChangeKind.fromValue(data.selections.source);
                const selections = data.selections.selections.map(TypeConverters.Selection.to);
                this._onDidChangeTextEditorSelection.fire({
                    textEditor: textEditor.value,
                    selections,
                    kind
                });
            }
            if (data.visibleRanges) {
                const visibleRanges = arrays.coalesce(data.visibleRanges.map(TypeConverters.Range.to));
                this._onDidChangeTextEditorVisibleRanges.fire({
                    textEditor: textEditor.value,
                    visibleRanges
                });
            }
        }
        $acceptEditorPositionData(data) {
            for (const id in data) {
                const textEditor = this._extHostDocumentsAndEditors.getEditor(id);
                if (!textEditor) {
                    throw new Error('Unknown text editor');
                }
                const viewColumn = TypeConverters.ViewColumn.to(data[id]);
                if (textEditor.value.viewColumn !== viewColumn) {
                    textEditor._acceptViewColumn(viewColumn);
                    this._onDidChangeTextEditorViewColumn.fire({ textEditor: textEditor.value, viewColumn });
                }
            }
        }
        getDiffInformation(id) {
            return Promise.resolve(this._proxy.$getDiffInformation(id));
        }
    }
    exports.ExtHostEditors = ExtHostEditors;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRleHRFZGl0b3JzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRleHRFZGl0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLGNBQWM7UUFrQjFCLFlBQ0MsV0FBeUIsRUFDUiwyQkFBdUQ7WUFBdkQsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE0QjtZQWxCeEQsb0NBQStCLEdBQUcsSUFBSSxlQUFPLEVBQXlDLENBQUM7WUFDdkYsa0NBQTZCLEdBQUcsSUFBSSxlQUFPLEVBQXVDLENBQUM7WUFDbkYsd0NBQW1DLEdBQUcsSUFBSSxlQUFPLEVBQTZDLENBQUM7WUFDL0YscUNBQWdDLEdBQUcsSUFBSSxlQUFPLEVBQTBDLENBQUM7WUFDekYsaUNBQTRCLEdBQUcsSUFBSSxlQUFPLEVBQWlDLENBQUM7WUFDNUUsbUNBQThCLEdBQUcsSUFBSSxlQUFPLEVBQWdDLENBQUM7WUFFckYsbUNBQThCLEdBQWlELElBQUksQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUM7WUFDMUgsaUNBQTRCLEdBQStDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLENBQUM7WUFDcEgsdUNBQWtDLEdBQXFELElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxLQUFLLENBQUM7WUFDdEksb0NBQStCLEdBQWtELElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUM7WUFDN0gsZ0NBQTJCLEdBQXlDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUM7WUFDNUcsa0NBQTZCLEdBQXdDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLENBQUM7WUFRdkgsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMscUJB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