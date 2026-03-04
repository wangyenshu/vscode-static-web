/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/api/common/extHost.protocol", "vs/base/common/arrays", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, event_1, lifecycle_1, editorOptions_1, range_1, selection_1, snippetController2_1, extHost_protocol_1, arrays_1, editorState_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTextEditor = exports.MainThreadTextEditorProperties = void 0;
    class MainThreadTextEditorProperties {
        static readFromEditor(previousProperties, model, codeEditor) {
            const selections = MainThreadTextEditorProperties._readSelectionsFromCodeEditor(previousProperties, codeEditor);
            const options = MainThreadTextEditorProperties._readOptionsFromCodeEditor(previousProperties, model, codeEditor);
            const visibleRanges = MainThreadTextEditorProperties._readVisibleRangesFromCodeEditor(previousProperties, codeEditor);
            return new MainThreadTextEditorProperties(selections, options, visibleRanges);
        }
        static _readSelectionsFromCodeEditor(previousProperties, codeEditor) {
            let result = null;
            if (codeEditor) {
                result = codeEditor.getSelections();
            }
            if (!result && previousProperties) {
                result = previousProperties.selections;
            }
            if (!result) {
                result = [new selection_1.Selection(1, 1, 1, 1)];
            }
            return result;
        }
        static _readOptionsFromCodeEditor(previousProperties, model, codeEditor) {
            if (model.isDisposed()) {
                if (previousProperties) {
                    // shutdown time
                    return previousProperties.options;
                }
                else {
                    throw new Error('No valid properties');
                }
            }
            let cursorStyle;
            let lineNumbers;
            if (codeEditor) {
                const options = codeEditor.getOptions();
                const lineNumbersOpts = options.get(68 /* EditorOption.lineNumbers */);
                cursorStyle = options.get(28 /* EditorOption.cursorStyle */);
                lineNumbers = lineNumbersOpts.renderType;
            }
            else if (previousProperties) {
                cursorStyle = previousProperties.options.cursorStyle;
                lineNumbers = previousProperties.options.lineNumbers;
            }
            else {
                cursorStyle = editorOptions_1.TextEditorCursorStyle.Line;
                lineNumbers = 1 /* RenderLineNumbersType.On */;
            }
            const modelOptions = model.getOptions();
            return {
                insertSpaces: modelOptions.insertSpaces,
                tabSize: modelOptions.tabSize,
                indentSize: modelOptions.indentSize,
                originalIndentSize: modelOptions.originalIndentSize,
                cursorStyle: cursorStyle,
                lineNumbers: lineNumbers
            };
        }
        static _readVisibleRangesFromCodeEditor(previousProperties, codeEditor) {
            if (codeEditor) {
                return codeEditor.getVisibleRanges();
            }
            return [];
        }
        constructor(selections, options, visibleRanges) {
            this.selections = selections;
            this.options = options;
            this.visibleRanges = visibleRanges;
        }
        generateDelta(oldProps, selectionChangeSource) {
            const delta = {
                options: null,
                selections: null,
                visibleRanges: null
            };
            if (!oldProps || !MainThreadTextEditorProperties._selectionsEqual(oldProps.selections, this.selections)) {
                delta.selections = {
                    selections: this.selections,
                    source: selectionChangeSource ?? undefined,
                };
            }
            if (!oldProps || !MainThreadTextEditorProperties._optionsEqual(oldProps.options, this.options)) {
                delta.options = this.options;
            }
            if (!oldProps || !MainThreadTextEditorProperties._rangesEqual(oldProps.visibleRanges, this.visibleRanges)) {
                delta.visibleRanges = this.visibleRanges;
            }
            if (delta.selections || delta.options || delta.visibleRanges) {
                // something changed
                return delta;
            }
            // nothing changed
            return null;
        }
        static _selectionsEqual(a, b) {
            return (0, arrays_1.equals)(a, b, (aValue, bValue) => aValue.equalsSelection(bValue));
        }
        static _rangesEqual(a, b) {
            return (0, arrays_1.equals)(a, b, (aValue, bValue) => aValue.equalsRange(bValue));
        }
        static _optionsEqual(a, b) {
            if (a && !b || !a && b) {
                return false;
            }
            if (!a && !b) {
                return true;
            }
            return (a.tabSize === b.tabSize
                && a.indentSize === b.indentSize
                && a.insertSpaces === b.insertSpaces
                && a.cursorStyle === b.cursorStyle
                && a.lineNumbers === b.lineNumbers);
        }
    }
    exports.MainThreadTextEditorProperties = MainThreadTextEditorProperties;
    /**
     * Text Editor that is permanently bound to the same model.
     * It can be bound or not to a CodeEditor.
     */
    class MainThreadTextEditor {
        constructor(id, model, codeEditor, focusTracker, mainThreadDocuments, modelService, clipboardService) {
            this._modelListeners = new lifecycle_1.DisposableStore();
            this._codeEditorListeners = new lifecycle_1.DisposableStore();
            this._id = id;
            this._model = model;
            this._codeEditor = null;
            this._properties = null;
            this._focusTracker = focusTracker;
            this._mainThreadDocuments = mainThreadDocuments;
            this._modelService = modelService;
            this._clipboardService = clipboardService;
            this._onPropertiesChanged = new event_1.Emitter();
            this._modelListeners.add(this._model.onDidChangeOptions((e) => {
                this._updatePropertiesNow(null);
            }));
            this.setCodeEditor(codeEditor);
            this._updatePropertiesNow(null);
        }
        dispose() {
            this._modelListeners.dispose();
            this._codeEditor = null;
            this._codeEditorListeners.dispose();
        }
        _updatePropertiesNow(selectionChangeSource) {
            this._setProperties(MainThreadTextEditorProperties.readFromEditor(this._properties, this._model, this._codeEditor), selectionChangeSource);
        }
        _setProperties(newProperties, selectionChangeSource) {
            const delta = newProperties.generateDelta(this._properties, selectionChangeSource);
            this._properties = newProperties;
            if (delta) {
                this._onPropertiesChanged.fire(delta);
            }
        }
        getId() {
            return this._id;
        }
        getModel() {
            return this._model;
        }
        getCodeEditor() {
            return this._codeEditor;
        }
        hasCodeEditor(codeEditor) {
            return (this._codeEditor === codeEditor);
        }
        setCodeEditor(codeEditor) {
            if (this.hasCodeEditor(codeEditor)) {
                // Nothing to do...
                return;
            }
            this._codeEditorListeners.clear();
            this._codeEditor = codeEditor;
            if (this._codeEditor) {
                // Catch early the case that this code editor gets a different model set and disassociate from this model
                this._codeEditorListeners.add(this._codeEditor.onDidChangeModel(() => {
                    this.setCodeEditor(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidFocusEditorWidget(() => {
                    this._focusTracker.onGainedFocus();
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidBlurEditorWidget(() => {
                    this._focusTracker.onLostFocus();
                }));
                let nextSelectionChangeSource = null;
                this._codeEditorListeners.add(this._mainThreadDocuments.onIsCaughtUpWithContentChanges((uri) => {
                    if (uri.toString() === this._model.uri.toString()) {
                        const selectionChangeSource = nextSelectionChangeSource;
                        nextSelectionChangeSource = null;
                        this._updatePropertiesNow(selectionChangeSource);
                    }
                }));
                const isValidCodeEditor = () => {
                    // Due to event timings, it is possible that there is a model change event not yet delivered to us.
                    // > e.g. a model change event is emitted to a listener which then decides to update editor options
                    // > In this case the editor configuration change event reaches us first.
                    // So simply check that the model is still attached to this code editor
                    return (this._codeEditor && this._codeEditor.getModel() === this._model);
                };
                const updateProperties = (selectionChangeSource) => {
                    // Some editor events get delivered faster than model content changes. This is
                    // problematic, as this leads to editor properties reaching the extension host
                    // too soon, before the model content change that was the root cause.
                    //
                    // If this case is identified, then let's update editor properties on the next model
                    // content change instead.
                    if (this._mainThreadDocuments.isCaughtUpWithContentChanges(this._model.uri)) {
                        nextSelectionChangeSource = null;
                        this._updatePropertiesNow(selectionChangeSource);
                    }
                    else {
                        // update editor properties on the next model content change
                        nextSelectionChangeSource = selectionChangeSource;
                    }
                };
                this._codeEditorListeners.add(this._codeEditor.onDidChangeCursorSelection((e) => {
                    // selection
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(e.source);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidChangeConfiguration((e) => {
                    // options
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidLayoutChange(() => {
                    // visibleRanges
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidScrollChange(() => {
                    // visibleRanges
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(null);
                }));
                this._updatePropertiesNow(null);
            }
        }
        isVisible() {
            return !!this._codeEditor;
        }
        getProperties() {
            return this._properties;
        }
        get onPropertiesChanged() {
            return this._onPropertiesChanged.event;
        }
        setSelections(selections) {
            if (this._codeEditor) {
                this._codeEditor.setSelections(selections);
                return;
            }
            const newSelections = selections.map(selection_1.Selection.liftSelection);
            this._setProperties(new MainThreadTextEditorProperties(newSelections, this._properties.options, this._properties.visibleRanges), null);
        }
        _setIndentConfiguration(newConfiguration) {
            const creationOpts = this._modelService.getCreationOptions(this._model.getLanguageId(), this._model.uri, this._model.isForSimpleWidget);
            if (newConfiguration.tabSize === 'auto' || newConfiguration.insertSpaces === 'auto') {
                // one of the options was set to 'auto' => detect indentation
                let insertSpaces = creationOpts.insertSpaces;
                let tabSize = creationOpts.tabSize;
                if (newConfiguration.insertSpaces !== 'auto' && typeof newConfiguration.insertSpaces !== 'undefined') {
                    insertSpaces = newConfiguration.insertSpaces;
                }
                if (newConfiguration.tabSize !== 'auto' && typeof newConfiguration.tabSize !== 'undefined') {
                    tabSize = newConfiguration.tabSize;
                }
                this._model.detectIndentation(insertSpaces, tabSize);
                return;
            }
            const newOpts = {};
            if (typeof newConfiguration.insertSpaces !== 'undefined') {
                newOpts.insertSpaces = newConfiguration.insertSpaces;
            }
            if (typeof newConfiguration.tabSize !== 'undefined') {
                newOpts.tabSize = newConfiguration.tabSize;
            }
            if (typeof newConfiguration.indentSize !== 'undefined') {
                newOpts.indentSize = newConfiguration.indentSize;
            }
            this._model.updateOptions(newOpts);
        }
        setConfiguration(newConfiguration) {
            this._setIndentConfiguration(newConfiguration);
            if (!this._codeEditor) {
                return;
            }
            if (newConfiguration.cursorStyle) {
                const newCursorStyle = (0, editorOptions_1.cursorStyleToString)(newConfiguration.cursorStyle);
                this._codeEditor.updateOptions({
                    cursorStyle: newCursorStyle
                });
            }
            if (typeof newConfiguration.lineNumbers !== 'undefined') {
                let lineNumbers;
                switch (newConfiguration.lineNumbers) {
                    case 1 /* RenderLineNumbersType.On */:
                        lineNumbers = 'on';
                        break;
                    case 2 /* RenderLineNumbersType.Relative */:
                        lineNumbers = 'relative';
                        break;
                    case 3 /* RenderLineNumbersType.Interval */:
                        lineNumbers = 'interval';
                        break;
                    default:
                        lineNumbers = 'off';
                }
                this._codeEditor.updateOptions({
                    lineNumbers: lineNumbers
                });
            }
        }
        setDecorations(key, ranges) {
            if (!this._codeEditor) {
                return;
            }
            this._codeEditor.setDecorationsByType('exthost-api', key, ranges);
        }
        setDecorationsFast(key, _ranges) {
            if (!this._codeEditor) {
                return;
            }
            const ranges = [];
            for (let i = 0, len = Math.floor(_ranges.length / 4); i < len; i++) {
                ranges[i] = new range_1.Range(_ranges[4 * i], _ranges[4 * i + 1], _ranges[4 * i + 2], _ranges[4 * i + 3]);
            }
            this._codeEditor.setDecorationsByTypeFast(key, ranges);
        }
        revealRange(range, revealType) {
            if (!this._codeEditor) {
                return;
            }
            switch (revealType) {
                case extHost_protocol_1.TextEditorRevealType.Default:
                    this._codeEditor.revealRange(range, 0 /* ScrollType.Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.InCenter:
                    this._codeEditor.revealRangeInCenter(range, 0 /* ScrollType.Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.InCenterIfOutsideViewport:
                    this._codeEditor.revealRangeInCenterIfOutsideViewport(range, 0 /* ScrollType.Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.AtTop:
                    this._codeEditor.revealRangeAtTop(range, 0 /* ScrollType.Smooth */);
                    break;
                default:
                    console.warn(`Unknown revealType: ${revealType}`);
                    break;
            }
        }
        isFocused() {
            if (this._codeEditor) {
                return this._codeEditor.hasTextFocus();
            }
            return false;
        }
        matches(editor) {
            if (!editor) {
                return false;
            }
            return editor.getControl() === this._codeEditor;
        }
        applyEdits(versionIdCheck, edits, opts) {
            if (this._model.getVersionId() !== versionIdCheck) {
                // throw new Error('Model has changed in the meantime!');
                // model changed in the meantime
                return false;
            }
            if (!this._codeEditor) {
                // console.warn('applyEdits on invisible editor');
                return false;
            }
            if (typeof opts.setEndOfLine !== 'undefined') {
                this._model.pushEOL(opts.setEndOfLine);
            }
            const transformedEdits = edits.map((edit) => {
                return {
                    range: range_1.Range.lift(edit.range),
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers
                };
            });
            if (opts.undoStopBefore) {
                this._codeEditor.pushUndoStop();
            }
            this._codeEditor.executeEdits('MainThreadTextEditor', transformedEdits);
            if (opts.undoStopAfter) {
                this._codeEditor.pushUndoStop();
            }
            return true;
        }
        async insertSnippet(modelVersionId, template, ranges, opts) {
            if (!this._codeEditor || !this._codeEditor.hasModel()) {
                return false;
            }
            // check if clipboard is required and only iff read it (async)
            let clipboardText;
            const needsTemplate = snippetParser_1.SnippetParser.guessNeedsClipboard(template);
            if (needsTemplate) {
                const state = new editorState_1.EditorState(this._codeEditor, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */);
                clipboardText = await this._clipboardService.readText();
                if (!state.validate(this._codeEditor)) {
                    return false;
                }
            }
            if (this._codeEditor.getModel().getVersionId() !== modelVersionId) {
                return false;
            }
            const snippetController = snippetController2_1.SnippetController2.get(this._codeEditor);
            if (!snippetController) {
                return false;
            }
            this._codeEditor.focus();
            // make modifications as snippet edit
            const edits = ranges.map(range => ({ range: range_1.Range.lift(range), template }));
            snippetController.apply(edits, {
                overwriteBefore: 0, overwriteAfter: 0,
                undoStopBefore: opts.undoStopBefore, undoStopAfter: opts.undoStopAfter,
                clipboardText
            });
            return true;
        }
    }
    exports.MainThreadTextEditor = MainThreadTextEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJCaEcsTUFBYSw4QkFBOEI7UUFFbkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxrQkFBeUQsRUFBRSxLQUFpQixFQUFFLFVBQThCO1lBQ3hJLE1BQU0sVUFBVSxHQUFHLDhCQUE4QixDQUFDLDZCQUE2QixDQUFDLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hILE1BQU0sT0FBTyxHQUFHLDhCQUE4QixDQUFDLDBCQUEwQixDQUFDLGtCQUFrQixFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqSCxNQUFNLGFBQWEsR0FBRyw4QkFBOEIsQ0FBQyxnQ0FBZ0MsQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN0SCxPQUFPLElBQUksOEJBQThCLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRU8sTUFBTSxDQUFDLDZCQUE2QixDQUFDLGtCQUF5RCxFQUFFLFVBQThCO1lBQ3JJLElBQUksTUFBTSxHQUF1QixJQUFJLENBQUM7WUFDdEMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsVUFBVSxDQUFDO1lBQ3hDLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxHQUFHLENBQUMsSUFBSSxxQkFB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