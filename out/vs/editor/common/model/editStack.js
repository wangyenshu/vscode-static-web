/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/editor/common/core/selection", "vs/base/common/uri", "vs/editor/common/core/textChange", "vs/base/common/buffer", "vs/base/common/resources"], function (require, exports, nls, errors_1, selection_1, uri_1, textChange_1, buffer, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditStack = exports.MultiModelEditStackElement = exports.SingleModelEditStackElement = exports.SingleModelEditStackData = void 0;
    exports.isEditStackElement = isEditStackElement;
    function uriGetComparisonKey(resource) {
        return resource.toString();
    }
    class SingleModelEditStackData {
        static create(model, beforeCursorState) {
            const alternativeVersionId = model.getAlternativeVersionId();
            const eol = getModelEOL(model);
            return new SingleModelEditStackData(alternativeVersionId, alternativeVersionId, eol, eol, beforeCursorState, beforeCursorState, []);
        }
        constructor(beforeVersionId, afterVersionId, beforeEOL, afterEOL, beforeCursorState, afterCursorState, changes) {
            this.beforeVersionId = beforeVersionId;
            this.afterVersionId = afterVersionId;
            this.beforeEOL = beforeEOL;
            this.afterEOL = afterEOL;
            this.beforeCursorState = beforeCursorState;
            this.afterCursorState = afterCursorState;
            this.changes = changes;
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            if (textChanges.length > 0) {
                this.changes = (0, textChange_1.compressConsecutiveTextChanges)(this.changes, textChanges);
            }
            this.afterEOL = afterEOL;
            this.afterVersionId = afterVersionId;
            this.afterCursorState = afterCursorState;
        }
        static _writeSelectionsSize(selections) {
            return 4 + 4 * 4 * (selections ? selections.length : 0);
        }
        static _writeSelections(b, selections, offset) {
            buffer.writeUInt32BE(b, (selections ? selections.length : 0), offset);
            offset += 4;
            if (selections) {
                for (const selection of selections) {
                    buffer.writeUInt32BE(b, selection.selectionStartLineNumber, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.selectionStartColumn, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.positionLineNumber, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.positionColumn, offset);
                    offset += 4;
                }
            }
            return offset;
        }
        static _readSelections(b, offset, dest) {
            const count = buffer.readUInt32BE(b, offset);
            offset += 4;
            for (let i = 0; i < count; i++) {
                const selectionStartLineNumber = buffer.readUInt32BE(b, offset);
                offset += 4;
                const selectionStartColumn = buffer.readUInt32BE(b, offset);
                offset += 4;
                const positionLineNumber = buffer.readUInt32BE(b, offset);
                offset += 4;
                const positionColumn = buffer.readUInt32BE(b, offset);
                offset += 4;
                dest.push(new selection_1.Selection(selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn));
            }
            return offset;
        }
        serialize() {
            let necessarySize = (+4 // beforeVersionId
                + 4 // afterVersionId
                + 1 // beforeEOL
                + 1 // afterEOL
                + SingleModelEditStackData._writeSelectionsSize(this.beforeCursorState)
                + SingleModelEditStackData._writeSelectionsSize(this.afterCursorState)
                + 4 // change count
            );
            for (const change of this.changes) {
                necessarySize += change.writeSize();
            }
            const b = new Uint8Array(necessarySize);
            let offset = 0;
            buffer.writeUInt32BE(b, this.beforeVersionId, offset);
            offset += 4;
            buffer.writeUInt32BE(b, this.afterVersionId, offset);
            offset += 4;
            buffer.writeUInt8(b, this.beforeEOL, offset);
            offset += 1;
            buffer.writeUInt8(b, this.afterEOL, offset);
            offset += 1;
            offset = SingleModelEditStackData._writeSelections(b, this.beforeCursorState, offset);
            offset = SingleModelEditStackData._writeSelections(b, this.afterCursorState, offset);
            buffer.writeUInt32BE(b, this.changes.length, offset);
            offset += 4;
            for (const change of this.changes) {
                offset = change.write(b, offset);
            }
            return b.buffer;
        }
        static deserialize(source) {
            const b = new Uint8Array(source);
            let offset = 0;
            const beforeVersionId = buffer.readUInt32BE(b, offset);
            offset += 4;
            const afterVersionId = buffer.readUInt32BE(b, offset);
            offset += 4;
            const beforeEOL = buffer.readUInt8(b, offset);
            offset += 1;
            const afterEOL = buffer.readUInt8(b, offset);
            offset += 1;
            const beforeCursorState = [];
            offset = SingleModelEditStackData._readSelections(b, offset, beforeCursorState);
            const afterCursorState = [];
            offset = SingleModelEditStackData._readSelections(b, offset, afterCursorState);
            const changeCount = buffer.readUInt32BE(b, offset);
            offset += 4;
            const changes = [];
            for (let i = 0; i < changeCount; i++) {
                offset = textChange_1.TextChange.read(b, offset, changes);
            }
            return new SingleModelEditStackData(beforeVersionId, afterVersionId, beforeEOL, afterEOL, beforeCursorState, afterCursorState, changes);
        }
    }
    exports.SingleModelEditStackData = SingleModelEditStackData;
    class SingleModelEditStackElement {
        get type() {
            return 0 /* UndoRedoElementType.Resource */;
        }
        get resource() {
            if (uri_1.URI.isUri(this.model)) {
                return this.model;
            }
            return this.model.uri;
        }
        constructor(label, code, model, beforeCursorState) {
            this.label = label;
            this.code = code;
            this.model = model;
            this._data = SingleModelEditStackData.create(model, beforeCursorState);
        }
        toString() {
            const data = (this._data instanceof SingleModelEditStackData ? this._data : SingleModelEditStackData.deserialize(this._data));
            return data.changes.map(change => change.toString()).join(', ');
        }
        matchesResource(resource) {
            const uri = (uri_1.URI.isUri(this.model) ? this.model : this.model.uri);
            return (uri.toString() === resource.toString());
        }
        setModel(model) {
            this.model = model;
        }
        canAppend(model) {
            return (this.model === model && this._data instanceof SingleModelEditStackData);
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            if (this._data instanceof SingleModelEditStackData) {
                this._data.append(model, textChanges, afterEOL, afterVersionId, afterCursorState);
            }
        }
        close() {
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
        }
        open() {
            if (!(this._data instanceof SingleModelEditStackData)) {
                this._data = SingleModelEditStackData.deserialize(this._data);
            }
        }
        undo() {
            if (uri_1.URI.isUri(this.model)) {
                // don't have a model
                throw new Error(`Invalid SingleModelEditStackElement`);
            }
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            const data = SingleModelEditStackData.deserialize(this._data);
            this.model._applyUndo(data.changes, data.beforeEOL, data.beforeVersionId, data.beforeCursorState);
        }
        redo() {
            if (uri_1.URI.isUri(this.model)) {
                // don't have a model
                throw new Error(`Invalid SingleModelEditStackElement`);
            }
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            const data = SingleModelEditStackData.deserialize(this._data);
            this.model._applyRedo(data.changes, data.afterEOL, data.afterVersionId, data.afterCursorState);
        }
        heapSize() {
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            return this._data.byteLength + 168 /*heap overhead*/;
        }
    }
    exports.SingleModelEditStackElement = SingleModelEditStackElement;
    class MultiModelEditStackElement {
        get resources() {
            return this._editStackElementsArr.map(editStackElement => editStackElement.resource);
        }
        constructor(label, code, editStackElements) {
            this.label = label;
            this.code = code;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this._isOpen = true;
            this._editStackElementsArr = editStackElements.slice(0);
            this._editStackElementsMap = new Map();
            for (const editStackElement of this._editStackElementsArr) {
                const key = uriGetComparisonKey(editStackElement.resource);
                this._editStackElementsMap.set(key, editStackElement);
            }
            this._delegate = null;
        }
        setDelegate(delegate) {
            this._delegate = delegate;
        }
        prepareUndoRedo() {
            if (this._delegate) {
                return this._delegate.prepareUndoRedo(this);
            }
        }
        getMissingModels() {
            const result = [];
            for (const editStackElement of this._editStackElementsArr) {
                if (uri_1.URI.isUri(editStackElement.model)) {
                    result.push(editStackElement.model);
                }
            }
            return result;
        }
        matchesResource(resource) {
            const key = uriGetComparisonKey(resource);
            return (this._editStackElementsMap.has(key));
        }
        setModel(model) {
            const key = uriGetComparisonKey(uri_1.URI.isUri(model) ? model : model.uri);
            if (this._editStackElementsMap.has(key)) {
                this._editStackElementsMap.get(key).setModel(model);
            }
        }
        canAppend(model) {
            if (!this._isOpen) {
                return false;
            }
            const key = uriGetComparisonKey(model.uri);
            if (this._editStackElementsMap.has(key)) {
                const editStackElement = this._editStackElementsMap.get(key);
                return editStackElement.canAppend(model);
            }
            return false;
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            const key = uriGetComparisonKey(model.uri);
            const editStackElement = this._editStackElementsMap.get(key);
            editStackElement.append(model, textChanges, afterEOL, afterVersionId, afterCursorState);
        }
        close() {
            this._isOpen = false;
        }
        open() {
            // cannot reopen
        }
        undo() {
            this._isOpen = false;
            for (const editStackElement of this._editStackElementsArr) {
                editStackElement.undo();
            }
        }
        redo() {
            for (const editStackElement of this._editStackElementsArr) {
                editStackElement.redo();
            }
        }
        heapSize(resource) {
            const key = uriGetComparisonKey(resource);
            if (this._editStackElementsMap.has(key)) {
                const editStackElement = this._editStackElementsMap.get(key);
                return editStackElement.heapSize();
            }
            return 0;
        }
        split() {
            return this._editStackElementsArr;
        }
        toString() {
            const result = [];
            for (const editStackElement of this._editStackElementsArr) {
                result.push(`${(0, resources_1.basename)(editStackElement.resource)}: ${editStackElement}`);
            }
            return `{${result.join(', ')}}`;
        }
    }
    exports.MultiModelEditStackElement = MultiModelEditStackElement;
    function getModelEOL(model) {
        const eol = model.getEOL();
        if (eol === '\n') {
            return 0 /* EndOfLineSequence.LF */;
        }
        else {
            return 1 /* EndOfLineSequence.CRLF */;
        }
    }
    function isEditStackElement(element) {
        if (!element) {
            return false;
        }
        return ((element instanceof SingleModelEditStackElement) || (element instanceof MultiModelEditStackElement));
    }
    class EditStack {
        constructor(model, undoRedoService) {
            this._model = model;
            this._undoRedoService = undoRedoService;
        }
        pushStackElement() {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isEditStackElement(lastElement)) {
                lastElement.close();
            }
        }
        popStackElement() {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isEditStackElement(lastElement)) {
                lastElement.open();
            }
        }
        clear() {
            this._undoRedoService.removeElements(this._model.uri);
        }
        _getOrCreateEditStackElement(beforeCursorState, group) {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isEditStackElement(lastElement) && lastElement.canAppend(this._model)) {
                return lastElement;
            }
            const newElement = new SingleModelEditStackElement(nls.localize('edit', "Typing"), 'undoredo.textBufferEdit', this._model, beforeCursorState);
            this._undoRedoService.pushElement(newElement, group);
            return newElement;
        }
        pushEOL(eol) {
            const editStackElement = this._getOrCreateEditStackElement(null, undefined);
            this._model.setEOL(eol);
            editStackElement.append(this._model, [], getModelEOL(this._model), this._model.getAlternativeVersionId(), null);
        }
        pushEditOperation(beforeCursorState, editOperations, cursorStateComputer, group) {
            const editStackElement = this._getOrCreateEditStackElement(beforeCursorState, group);
            const inverseEditOperations = this._model.applyEdits(editOperations, true);
            const afterCursorState = EditStack._computeCursorState(cursorStateComputer, inverseEditOperations);
            const textChanges = inverseEditOperations.map((op, index) => ({ index: index, textChange: op.textChange }));
            textChanges.sort((a, b) => {
                if (a.textChange.oldPosition === b.textChange.oldPosition) {
                    return a.index - b.index;
                }
                return a.textChange.oldPosition - b.textChange.oldPosition;
            });
            editStackElement.append(this._model, textChanges.map(op => op.textChange), getModelEOL(this._model), this._model.getAlternativeVersionId(), afterCursorState);
            return afterCursorState;
        }
        static _computeCursorState(cursorStateComputer, inverseEditOperations) {
            try {
                return cursorStateComputer ? cursorStateComputer(inverseEditOperations) : null;
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                return null;
            }
        }
    }
    exports.EditStack = EditStack;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFN0YWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9lZGl0U3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb1hoRyxnREFLQztJQTFXRCxTQUFTLG1CQUFtQixDQUFDLFFBQWE7UUFDekMsT0FBTyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELE1BQWEsd0JBQXdCO1FBRTdCLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBaUIsRUFBRSxpQkFBcUM7WUFDNUUsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUM3RCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsT0FBTyxJQUFJLHdCQUF3QixDQUNsQyxvQkFBb0IsRUFDcEIsb0JBQW9CLEVBQ3BCLEdBQUcsRUFDSCxHQUFHLEVBQ0gsaUJBQWlCLEVBQ2pCLGlCQUFpQixFQUNqQixFQUFFLENBQ0YsQ0FBQztRQUNILENBQUM7UUFFRCxZQUNpQixlQUF1QixFQUNoQyxjQUFzQixFQUNiLFNBQTRCLEVBQ3JDLFFBQTJCLEVBQ2xCLGlCQUFxQyxFQUM5QyxnQkFBb0MsRUFDcEMsT0FBcUI7WUFOWixvQkFBZSxHQUFmLGVBQWUsQ0FBUTtZQUNoQyxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQUNiLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBQ3JDLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQ2xCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDOUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFvQjtZQUNwQyxZQUFPLEdBQVAsT0FBTyxDQUFjO1FBQ3pCLENBQUM7UUFFRSxNQUFNLENBQUMsS0FBaUIsRUFBRSxXQUF5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