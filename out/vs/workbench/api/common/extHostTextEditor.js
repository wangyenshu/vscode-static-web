/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/base/common/idGenerator", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, assert_1, errors_1, idGenerator_1, TypeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTextEditor = exports.ExtHostTextEditorOptions = exports.TextEditorDecorationType = void 0;
    class TextEditorDecorationType {
        static { this._Keys = new idGenerator_1.IdGenerator('TextEditorDecorationType'); }
        constructor(proxy, extension, options) {
            const key = TextEditorDecorationType._Keys.nextId();
            proxy.$registerTextEditorDecorationType(extension.identifier, key, TypeConverters.DecorationRenderOptions.from(options));
            this.value = Object.freeze({
                key,
                dispose() {
                    proxy.$removeTextEditorDecorationType(key);
                }
            });
        }
    }
    exports.TextEditorDecorationType = TextEditorDecorationType;
    class TextEditorEdit {
        constructor(document, options) {
            this._collectedEdits = [];
            this._setEndOfLine = undefined;
            this._finalized = false;
            this._document = document;
            this._documentVersionId = document.version;
            this._undoStopBefore = options.undoStopBefore;
            this._undoStopAfter = options.undoStopAfter;
        }
        finalize() {
            this._finalized = true;
            return {
                documentVersionId: this._documentVersionId,
                edits: this._collectedEdits,
                setEndOfLine: this._setEndOfLine,
                undoStopBefore: this._undoStopBefore,
                undoStopAfter: this._undoStopAfter
            };
        }
        _throwIfFinalized() {
            if (this._finalized) {
                throw new Error('Edit is only valid while callback runs');
            }
        }
        replace(location, value) {
            this._throwIfFinalized();
            let range = null;
            if (location instanceof extHostTypes_1.Position) {
                range = new extHostTypes_1.Range(location, location);
            }
            else if (location instanceof extHostTypes_1.Range) {
                range = location;
            }
            else {
                throw new Error('Unrecognized location');
            }
            this._pushEdit(range, value, false);
        }
        insert(location, value) {
            this._throwIfFinalized();
            this._pushEdit(new extHostTypes_1.Range(location, location), value, true);
        }
        delete(location) {
            this._throwIfFinalized();
            let range = null;
            if (location instanceof extHostTypes_1.Range) {
                range = location;
            }
            else {
                throw new Error('Unrecognized location');
            }
            this._pushEdit(range, null, true);
        }
        _pushEdit(range, text, forceMoveMarkers) {
            const validRange = this._document.validateRange(range);
            this._collectedEdits.push({
                range: validRange,
                text: text,
                forceMoveMarkers: forceMoveMarkers
            });
        }
        setEndOfLine(endOfLine) {
            this._throwIfFinalized();
            if (endOfLine !== extHostTypes_1.EndOfLine.LF && endOfLine !== extHostTypes_1.EndOfLine.CRLF) {
                throw (0, errors_1.illegalArgument)('endOfLine');
            }
            this._setEndOfLine = endOfLine;
        }
    }
    class ExtHostTextEditorOptions {
        constructor(proxy, id, source, logService) {
            this._proxy = proxy;
            this._id = id;
            this._accept(source);
            this._logService = logService;
            const that = this;
            this.value = {
                get tabSize() {
                    return that._tabSize;
                },
                set tabSize(value) {
                    that._setTabSize(value);
                },
                get indentSize() {
                    return that._indentSize;
                },
                set indentSize(value) {
                    that._setIndentSize(value);
                },
                get insertSpaces() {
                    return that._insertSpaces;
                },
                set insertSpaces(value) {
                    that._setInsertSpaces(value);
                },
                get cursorStyle() {
                    return that._cursorStyle;
                },
                set cursorStyle(value) {
                    that._setCursorStyle(value);
                },
                get lineNumbers() {
                    return that._lineNumbers;
                },
                set lineNumbers(value) {
                    that._setLineNumbers(value);
                }
            };
        }
        _accept(source) {
            this._tabSize = source.tabSize;
            this._indentSize = source.indentSize;
            this._originalIndentSize = source.originalIndentSize;
            this._insertSpaces = source.insertSpaces;
            this._cursorStyle = source.cursorStyle;
            this._lineNumbers = TypeConverters.TextEditorLineNumbersStyle.to(source.lineNumbers);
        }
        // --- internal: tabSize
        _validateTabSize(value) {
            if (value === 'auto') {
                return 'auto';
            }
            if (typeof value === 'number') {
                const r = Math.floor(value);
                return (r > 0 ? r : null);
            }
            if (typeof value === 'string') {
                const r = parseInt(value, 10);
                if (isNaN(r)) {
                    return null;
                }
                return (r > 0 ? r : null);
            }
            return null;
        }
        _setTabSize(value) {
            const tabSize = this._validateTabSize(value);
            if (tabSize === null) {
                // ignore invalid call
                return;
            }
            if (typeof tabSize === 'number') {
                if (this._tabSize === tabSize) {
                    // nothing to do
                    return;
                }
                // reflect the new tabSize value immediately
                this._tabSize = tabSize;
            }
            this._warnOnError('setTabSize', this._proxy.$trySetOptions(this._id, {
                tabSize: tabSize
            }));
        }
        // --- internal: indentSize
        _validateIndentSize(value) {
            if (value === 'tabSize') {
                return 'tabSize';
            }
            if (typeof value === 'number') {
                const r = Math.floor(value);
                return (r > 0 ? r : null);
            }
            if (typeof value === 'string') {
                const r = parseInt(value, 10);
                if (isNaN(r)) {
                    return null;
                }
                return (r > 0 ? r : null);
            }
            return null;
        }
        _setIndentSize(value) {
            const indentSize = this._validateIndentSize(value);
            if (indentSize === null) {
                // ignore invalid call
                return;
            }
            if (typeof indentSize === 'number') {
                if (this._originalIndentSize === indentSize) {
                    // nothing to do
                    return;
                }
                // reflect the new indentSize value immediately
                this._indentSize = indentSize;
                this._originalIndentSize = indentSize;
            }
            this._warnOnError('setIndentSize', this._proxy.$trySetOptions(this._id, {
                indentSize: indentSize
            }));
        }
        // --- internal: insert spaces
        _validateInsertSpaces(value) {
            if (value === 'auto') {
                return 'auto';
            }
            return (value === 'false' ? false : Boolean(value));
        }
        _setInsertSpaces(value) {
            const insertSpaces = this._validateInsertSpaces(value);
            if (typeof insertSpaces === 'boolean') {
                if (this._insertSpaces === insertSpaces) {
                    // nothing to do
                    return;
                }
                // reflect the new insertSpaces value immediately
                this._insertSpaces = insertSpaces;
            }
            this._warnOnError('setInsertSpaces', this._proxy.$trySetOptions(this._id, {
                insertSpaces: insertSpaces
            }));
        }
        // --- internal: cursor style
        _setCursorStyle(value) {
            if (this._cursorStyle === value) {
                // nothing to do
                return;
            }
            this._cursorStyle = value;
            this._warnOnError('setCursorStyle', this._proxy.$trySetOptions(this._id, {
                cursorStyle: value
            }));
        }
        // --- internal: line number
        _setLineNumbers(value) {
            if (this._lineNumbers === value) {
                // nothing to do
                return;
            }
            this._lineNumbers = value;
            this._warnOnError('setLineNumbers', this._proxy.$trySetOptions(this._id, {
                lineNumbers: TypeConverters.TextEditorLineNumbersStyle.from(value)
            }));
        }
        assign(newOptions) {
            const bulkConfigurationUpdate = {};
            let hasUpdate = false;
            if (typeof newOptions.tabSize !== 'undefined') {
                const tabSize = this._validateTabSize(newOptions.tabSize);
                if (tabSize === 'auto') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.tabSize = tabSize;
                }
                else if (typeof tabSize === 'number' && this._tabSize !== tabSize) {
                    // reflect the new tabSize value immediately
                    this._tabSize = tabSize;
                    hasUpdate = true;
                    bulkConfigurationUpdate.tabSize = tabSize;
                }
            }
            if (typeof newOptions.indentSize !== 'undefined') {
                const indentSize = this._validateIndentSize(newOptions.indentSize);
                if (indentSize === 'tabSize') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.indentSize = indentSize;
                }
                else if (typeof indentSize === 'number' && this._originalIndentSize !== indentSize) {
                    // reflect the new indentSize value immediately
                    this._indentSize = indentSize;
                    this._originalIndentSize = indentSize;
                    hasUpdate = true;
                    bulkConfigurationUpdate.indentSize = indentSize;
                }
            }
            if (typeof newOptions.insertSpaces !== 'undefined') {
                const insertSpaces = this._validateInsertSpaces(newOptions.insertSpaces);
                if (insertSpaces === 'auto') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.insertSpaces = insertSpaces;
                }
                else if (this._insertSpaces !== insertSpaces) {
                    // reflect the new insertSpaces value immediately
                    this._insertSpaces = insertSpaces;
                    hasUpdate = true;
                    bulkConfigurationUpdate.insertSpaces = insertSpaces;
                }
            }
            if (typeof newOptions.cursorStyle !== 'undefined') {
                if (this._cursorStyle !== newOptions.cursorStyle) {
                    this._cursorStyle = newOptions.cursorStyle;
                    hasUpdate = true;
                    bulkConfigurationUpdate.cursorStyle = newOptions.cursorStyle;
                }
            }
            if (typeof newOptions.lineNumbers !== 'undefined') {
                if (this._lineNumbers !== newOptions.lineNumbers) {
                    this._lineNumbers = newOptions.lineNumbers;
                    hasUpdate = true;
                    bulkConfigurationUpdate.lineNumbers = TypeConverters.TextEditorLineNumbersStyle.from(newOptions.lineNumbers);
                }
            }
            if (hasUpdate) {
                this._warnOnError('setOptions', this._proxy.$trySetOptions(this._id, bulkConfigurationUpdate));
            }
        }
        _warnOnError(action, promise) {
            promise.catch(err => {
                this._logService.warn(`ExtHostTextEditorOptions '${action}' failed:'`);
                this._logService.warn(err);
            });
        }
    }
    exports.ExtHostTextEditorOptions = ExtHostTextEditorOptions;
    class ExtHostTextEditor {
        constructor(id, _proxy, _logService, document, selections, options, visibleRanges, viewColumn) {
            this.id = id;
            this._proxy = _proxy;
            this._logService = _logService;
            this._disposed = false;
            this._hasDecorationsForKey = new Set();
            this._selections = selections;
            this._options = new ExtHostTextEditorOptions(this._proxy, this.id, options, _logService);
            this._visibleRanges = visibleRanges;
            this._viewColumn = viewColumn;
            const that = this;
            this.value = Object.freeze({
                get document() {
                    return document.value;
                },
                set document(_value) {
                    throw new errors_1.ReadonlyError('document');
                },
                // --- selection
                get selection() {
                    return that._selections && that._selections[0];
                },
                set selection(value) {
                    if (!(value instanceof extHostTypes_1.Selection)) {
                        throw (0, errors_1.illegalArgument)('selection');
                    }
                    that._selections = [value];
                    that._trySetSelection();
                },
                get selections() {
                    return that._selections;
                },
                set selections(value) {
                    if (!Array.isArray(value) || value.some(a => !(a instanceof extHostTypes_1.Selection))) {
                        throw (0, errors_1.illegalArgument)('selections');
                    }
                    that._selections = value;
                    that._trySetSelection();
                },
                // --- visible ranges
                get visibleRanges() {
                    return that._visibleRanges;
                },
                set visibleRanges(_value) {
                    throw new errors_1.ReadonlyError('visibleRanges');
                },
                // --- options
                get options() {
                    return that._options.value;
                },
                set options(value) {
                    if (!that._disposed) {
                        that._options.assign(value);
                    }
                },
                // --- view column
                get viewColumn() {
                    return that._viewColumn;
                },
                set viewColumn(_value) {
                    throw new errors_1.ReadonlyError('viewColumn');
                },
                // --- edit
                edit(callback, options = { undoStopBefore: true, undoStopAfter: true }) {
                    if (that._disposed) {
                        return Promise.reject(new Error('TextEditor#edit not possible on closed editors'));
                    }
                    const edit = new TextEditorEdit(document.value, options);
                    callback(edit);
                    return that._applyEdit(edit);
                },
                // --- snippet edit
                insertSnippet(snippet, where, options = { undoStopBefore: true, undoStopAfter: true }) {
                    if (that._disposed) {
                        return Promise.reject(new Error('TextEditor#insertSnippet not possible on closed editors'));
                    }
                    let ranges;
                    if (!where || (Array.isArray(where) && where.length === 0)) {
                        ranges = that._selections.map(range => TypeConverters.Range.from(range));
                    }
                    else if (where instanceof extHostTypes_1.Position) {
                        const { lineNumber, column } = TypeConverters.Position.from(where);
                        ranges = [{ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column }];
                    }
                    else if (where instanceof extHostTypes_1.Range) {
                        ranges = [TypeConverters.Range.from(where)];
                    }
                    else {
                        ranges = [];
                        for (const posOrRange of where) {
                            if (posOrRange instanceof extHostTypes_1.Range) {
                                ranges.push(TypeConverters.Range.from(posOrRange));
                            }
                            else {
                                const { lineNumber, column } = TypeConverters.Position.from(posOrRange);
                                ranges.push({ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column });
                            }
                        }
                    }
                    return _proxy.$tryInsertSnippet(id, document.value.version, snippet.value, ranges, options);
                },
                setDecorations(decorationType, ranges) {
                    const willBeEmpty = (ranges.length === 0);
                    if (willBeEmpty && !that._hasDecorationsForKey.has(decorationType.key)) {
                        // avoid no-op call to the renderer
                        return;
                    }
                    if (willBeEmpty) {
                        that._hasDecorationsForKey.delete(decorationType.key);
                    }
                    else {
                        that._hasDecorationsForKey.add(decorationType.key);
                    }
                    that._runOnProxy(() => {
                        if (TypeConverters.isDecorationOptionsArr(ranges)) {
                            return _proxy.$trySetDecorations(id, decorationType.key, TypeConverters.fromRangeOrRangeWithMessage(ranges));
                        }
                        else {
                            const _ranges = new Array(4 * ranges.length);
                            for (let i = 0, len = ranges.length; i < len; i++) {
                                const range = ranges[i];
                                _ranges[4 * i] = range.start.line + 1;
                                _ranges[4 * i + 1] = range.start.character + 1;
                                _ranges[4 * i + 2] = range.end.line + 1;
                                _ranges[4 * i + 3] = range.end.character + 1;
                            }
                            return _proxy.$trySetDecorationsFast(id, decorationType.key, _ranges);
                        }
                    });
                },
                revealRange(range, revealType) {
                    that._runOnProxy(() => _proxy.$tryRevealRange(id, TypeConverters.Range.from(range), (revealType || extHostTypes_1.TextEditorRevealType.Default)));
                },
                show(column) {
                    _proxy.$tryShowEditor(id, TypeConverters.ViewColumn.from(column));
                },
                hide() {
                    _proxy.$tryHideEditor(id);
                }
            });
        }
        dispose() {
            (0, assert_1.ok)(!this._disposed);
            this._disposed = true;
        }
        // --- incoming: extension host MUST accept what the renderer says
        _acceptOptions(options) {
            (0, assert_1.ok)(!this._disposed);
            this._options._accept(options);
        }
        _acceptVisibleRanges(value) {
            (0, assert_1.ok)(!this._disposed);
            this._visibleRanges = value;
        }
        _acceptViewColumn(value) {
            (0, assert_1.ok)(!this._disposed);
            this._viewColumn = value;
        }
        _acceptSelections(selections) {
            (0, assert_1.ok)(!this._disposed);
            this._selections = selections;
        }
        async _trySetSelection() {
            const selection = this._selections.map(TypeConverters.Selection.from);
            await this._runOnProxy(() => this._proxy.$trySetSelections(this.id, selection));
            return this.value;
        }
        _applyEdit(editBuilder) {
            const editData = editBuilder.finalize();
            // return when there is nothing to do
            if (editData.edits.length === 0 && !editData.setEndOfLine) {
                return Promise.resolve(true);
            }
            // check that the edits are not overlapping (i.e. illegal)
            const editRanges = editData.edits.map(edit => edit.range);
            // sort ascending (by end and then by start)
            editRanges.sort((a, b) => {
                if (a.end.line === b.end.line) {
                    if (a.end.character === b.end.character) {
                        if (a.start.line === b.start.line) {
                            return a.start.character - b.start.character;
                        }
                        return a.start.line - b.start.line;
                    }
                    return a.end.character - b.end.character;
                }
                return a.end.line - b.end.line;
            });
            // check that no edits are overlapping
            for (let i = 0, count = editRanges.length - 1; i < count; i++) {
                const rangeEnd = editRanges[i].end;
                const nextRangeStart = editRanges[i + 1].start;
                if (nextRangeStart.isBefore(rangeEnd)) {
                    // overlapping ranges
                    return Promise.reject(new Error('Overlapping ranges are not allowed!'));
                }
            }
            // prepare data for serialization
            const edits = editData.edits.map((edit) => {
                return {
                    range: TypeConverters.Range.from(edit.range),
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers
                };
            });
            return this._proxy.$tryApplyEdits(this.id, editData.documentVersionId, edits, {
                setEndOfLine: typeof editData.setEndOfLine === 'number' ? TypeConverters.EndOfLine.from(editData.setEndOfLine) : undefined,
                undoStopBefore: editData.undoStopBefore,
                undoStopAfter: editData.undoStopAfter
            });
        }
        _runOnProxy(callback) {
            if (this._disposed) {
                this._logService.warn('TextEditor is closed/disposed');
                return Promise.resolve(undefined);
            }
            return callback().then(() => this, err => {
                if (!(err instanceof Error && err.name === 'DISPOSED')) {
                    this._logService.warn(err);
                }
                return null;
            });
        }
    }
    exports.ExtHostTextEditor = ExtHostTextEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRleHRFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGV4dEVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQWEsd0JBQXdCO2lCQUVaLFVBQUssR0FBRyxJQUFJLHlCQUFXLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUk1RSxZQUFZLEtBQWlDLEVBQUUsU0FBZ0MsRUFBRSxPQUF1QztZQUN2SCxNQUFNLEdBQUcsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEQsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN6SCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQzFCLEdBQUc7Z0JBQ0gsT0FBTztvQkFDTixLQUFLLENBQUMsK0JBQStCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDOztJQWZGLDREQWlCQztJQWdCRCxNQUFNLGNBQWM7UUFVbkIsWUFBWSxRQUE2QixFQUFFLE9BQTREO1lBSi9GLG9CQUFlLEdBQXlCLEVBQUUsQ0FBQztZQUMzQyxrQkFBYSxHQUEwQixTQUFTLENBQUM7WUFDakQsZUFBVSxHQUFZLEtBQUssQ0FBQztZQUduQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FB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