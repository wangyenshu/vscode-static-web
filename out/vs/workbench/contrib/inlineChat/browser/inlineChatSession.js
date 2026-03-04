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
define(["require", "exports", "vs/base/common/event", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/editor/common/core/editOperation", "vs/editor/common/diff/rangeMapping", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/language", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "./inlineChatSessionService", "vs/editor/common/core/lineRange", "vs/editor/common/services/editorWorker", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/platform/extensions/common/extensions"], function (require, exports, event_1, bulkEditService_1, inlineChat_1, range_1, textModel_1, errorMessage_1, errors_1, editOperation_1, rangeMapping_1, textfiles_1, language_1, map_1, network_1, resources_1, inlineChatSessionService_1, lineRange_1, editorWorker_1, arrays_1, iterator_1, lifecycle_1, contextkey_1, log_1, extensions_1) {
    "use strict";
    var HunkData_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HunkState = exports.HunkData = exports.StashedSession = exports.ReplyResponse = exports.ErrorResponse = exports.EmptyResponse = exports.SessionExchange = exports.SessionPrompt = exports.Session = exports.SessionWholeRange = void 0;
    class SessionWholeRange {
        static { this._options = textModel_1.ModelDecorationOptions.register({ description: 'inlineChat/session/wholeRange' }); }
        constructor(_textModel, wholeRange) {
            this._textModel = _textModel;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._decorationIds = [];
            this._decorationIds = _textModel.deltaDecorations([], [{ range: wholeRange, options: SessionWholeRange._options }]);
        }
        dispose() {
            this._onDidChange.dispose();
            if (!this._textModel.isDisposed()) {
                this._textModel.deltaDecorations(this._decorationIds, []);
            }
        }
        trackEdits(edits) {
            const newDeco = [];
            for (const edit of edits) {
                newDeco.push({ range: edit.range, options: SessionWholeRange._options });
            }
            this._decorationIds.push(...this._textModel.deltaDecorations([], newDeco));
            this._onDidChange.fire(this);
        }
        fixup(changes) {
            const newDeco = [];
            for (const { modified } of changes) {
                const modifiedRange = modified.isEmpty
                    ? new range_1.Range(modified.startLineNumber, 1, modified.startLineNumber, this._textModel.getLineLength(modified.startLineNumber))
                    : new range_1.Range(modified.startLineNumber, 1, modified.endLineNumberExclusive - 1, this._textModel.getLineLength(modified.endLineNumberExclusive - 1));
                newDeco.push({ range: modifiedRange, options: SessionWholeRange._options });
            }
            const [first, ...rest] = this._decorationIds; // first is the original whole range
            const newIds = this._textModel.deltaDecorations(rest, newDeco);
            this._decorationIds = [first].concat(newIds);
            this._onDidChange.fire(this);
        }
        get trackedInitialRange() {
            const [first] = this._decorationIds;
            return this._textModel.getDecorationRange(first) ?? new range_1.Range(1, 1, 1, 1);
        }
        get value() {
            let result;
            for (const id of this._decorationIds) {
                const range = this._textModel.getDecorationRange(id);
                if (range) {
                    if (!result) {
                        result = range;
                    }
                    else {
                        result = range_1.Range.plusRange(result, range);
                    }
                }
            }
            return result;
        }
    }
    exports.SessionWholeRange = SessionWholeRange;
    class Session {
        constructor(editMode, 
        /**
         * The URI of the document which is being EditorEdit
         */
        targetUri, 
        /**
         * A copy of the document at the time the session was started
         */
        textModel0, 
        /**
         * The document into which AI edits went, when live this is `targetUri` otherwise it is a temporary document
         */
        textModelN, provider, session, wholeRange, hunkData, chatModel) {
            this.editMode = editMode;
            this.targetUri = targetUri;
            this.textModel0 = textModel0;
            this.textModelN = textModelN;
            this.provider = provider;
            this.session = session;
            this.wholeRange = wholeRange;
            this.hunkData = hunkData;
            this.chatModel = chatModel;
            this._isUnstashed = false;
            this._exchange = [];
            this._startTime = new Date();
            this.textModelNAltVersion = textModelN.getAlternativeVersionId();
            this._teldata = {
                extension: extensions_1.ExtensionIdentifier.toKey(provider.extensionId),
                startTime: this._startTime.toISOString(),
                endTime: this._startTime.toISOString(),
                edits: 0,
                finishedByEdit: false,
                rounds: '',
                undos: '',
                editMode,
                unstashed: 0,
                acceptedHunks: 0,
                discardedHunks: 0,
                responseTypes: ''
            };
        }
        addInput(input) {
            this._lastInput = input;
        }
        get lastInput() {
            return this._lastInput;
        }
        get isUnstashed() {
            return this._isUnstashed;
        }
        markUnstashed() {
            this._teldata.unstashed += 1;
            this._isUnstashed = true;
        }
        get textModelNSnapshotAltVersion() {
            return this._textModelNSnapshotAltVersion;
        }
        createSnapshot() {
            this._textModelNSnapshotAltVersion = this.textModelN.getAlternativeVersionId();
        }
        addExchange(exchange) {
            this._isUnstashed = false;
            const newLen = this._exchange.push(exchange);
            this._teldata.rounds += `${newLen}|`;
            // this._teldata.responseTypes += `${exchange.response instanceof ReplyResponse ? exchange.response.responseType : InlineChatResponseTypes.Empty}|`;
        }
        get lastExchange() {
            return this._exchange[this._exchange.length - 1];
        }
        get hasChangedText() {
            return !this.textModel0.equalsTextBuffer(this.textModelN.getTextBuffer());
        }
        asChangedText(changes) {
            if (changes.length === 0) {
                return undefined;
            }
            let startLine = Number.MAX_VALUE;
            let endLine = Number.MIN_VALUE;
            for (const change of changes) {
                startLine = Math.min(startLine, change.modified.startLineNumber);
                endLine = Math.max(endLine, change.modified.endLineNumberExclusive);
            }
            return this.textModelN.getValueInRange(new range_1.Range(startLine, 1, endLine, Number.MAX_VALUE));
        }
        recordExternalEditOccurred(didFinish) {
            this._teldata.edits += 1;
            this._teldata.finishedByEdit = didFinish;
        }
        asTelemetryData() {
            for (const item of this.hunkData.getInfo()) {
                switch (item.getState()) {
                    case 1 /* HunkState.Accepted */:
                        this._teldata.acceptedHunks += 1;
                        break;
                    case 2 /* HunkState.Rejected */:
                        this._teldata.discardedHunks += 1;
                        break;
                }
            }
            this._teldata.endTime = new Date().toISOString();
            return this._teldata;
        }
        asRecording() {
            const result = {
                session: this.session,
                when: this._startTime,
                exchanges: []
            };
            for (const exchange of this._exchange) {
                const response = exchange.response;
                if (response instanceof ReplyResponse) {
                    result.exchanges.push({ prompt: exchange.prompt.value, res: response.raw });
                }
            }
            return result;
        }
    }
    exports.Session = Session;
    class SessionPrompt {
        constructor(value) {
            this.value = value;
        }
    }
    exports.SessionPrompt = SessionPrompt;
    class SessionExchange {
        constructor(prompt, response) {
            this.prompt = prompt;
            this.response = response;
        }
    }
    exports.SessionExchange = SessionExchange;
    class EmptyResponse {
    }
    exports.EmptyResponse = EmptyResponse;
    class ErrorResponse {
        constructor(error) {
            this.error = error;
            this.message = (0, errorMessage_1.toErrorMessage)(error, false);
            this.isCancellation = (0, errors_1.isCancellationError)(error);
        }
    }
    exports.ErrorResponse = ErrorResponse;
    let ReplyResponse = class ReplyResponse {
        constructor(raw, mdContent, localUri, modelAltVersionId, progressEdits, requestId, chatResponse, _textFileService, _languageService) {
            this.raw = raw;
            this.mdContent = mdContent;
            this.modelAltVersionId = modelAltVersionId;
            this.requestId = requestId;
            this.chatResponse = chatResponse;
            this._textFileService = _textFileService;
            this._languageService = _languageService;
            this.allLocalEdits = [];
            const editsMap = new map_1.ResourceMap();
            editsMap.set(localUri, [...progressEdits]);
            if (raw.type === "editorEdit" /* InlineChatResponseType.EditorEdit */) {
                //
                editsMap.get(localUri).push(raw.edits);
            }
            else if (raw.type === "bulkEdit" /* InlineChatResponseType.BulkEdit */) {
                //
                const edits = bulkEditService_1.ResourceEdit.convert(raw.edits);
                for (const edit of edits) {
                    if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                        if (edit.newResource && !edit.oldResource) {
                            editsMap.set(edit.newResource, []);
                            if (edit.options.contents) {
                                console.warn('CONTENT not supported');
                            }
                        }
                    }
                    else if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                        //
                        const array = editsMap.get(edit.resource);
                        if (array) {
                            array.push([edit.textEdit]);
                        }
                        else {
                            editsMap.set(edit.resource, [[edit.textEdit]]);
                        }
                    }
                }
            }
            let needsWorkspaceEdit = false;
            for (const [uri, edits] of editsMap) {
                const flatEdits = edits.flat();
                if (flatEdits.length === 0) {
                    editsMap.delete(uri);
                    continue;
                }
                const isLocalUri = (0, resources_1.isEqual)(uri, localUri);
                needsWorkspaceEdit = needsWorkspaceEdit || (uri.scheme !== network_1.Schemas.untitled && !isLocalUri);
                if (uri.scheme === network_1.Schemas.untitled && !isLocalUri && !this.untitledTextModel) { //TODO@jrieken the first untitled model WINS
                    const langSelection = this._languageService.createByFilepathOrFirstLine(uri, undefined);
                    const untitledTextModel = this._textFileService.untitled.create({
                        associatedResource: uri,
                        languageId: langSelection.languageId
                    });
                    this.untitledTextModel = untitledTextModel;
                    untitledTextModel.resolve();
                }
            }
            this.allLocalEdits = editsMap.get(localUri) ?? [];
            if (needsWorkspaceEdit) {
                const workspaceEdits = [];
                for (const [uri, edits] of editsMap) {
                    for (const edit of edits.flat()) {
                        workspaceEdits.push({ resource: uri, textEdit: edit, versionId: undefined });
                    }
                }
                this.workspaceEdit = { edits: workspaceEdits };
            }
        }
    };
    exports.ReplyResponse = ReplyResponse;
    exports.ReplyResponse = ReplyResponse = __decorate([
        __param(7, textfiles_1.ITextFileService),
        __param(8, language_1.ILanguageService)
    ], ReplyResponse);
    let StashedSession = class StashedSession {
        constructor(editor, session, _undoCancelEdits, contextKeyService, _sessionService, _logService) {
            this._undoCancelEdits = _undoCancelEdits;
            this._sessionService = _sessionService;
            this._logService = _logService;
            this._ctxHasStashedSession = inlineChat_1.CTX_INLINE_CHAT_HAS_STASHED_SESSION.bindTo(contextKeyService);
            // keep session for a little bit, only release when user continues to work (type, move cursor, etc.)
            this._session = session;
            this._ctxHasStashedSession.set(true);
            this._listener = event_1.Event.once(event_1.Event.any(editor.onDidChangeCursorSelection, editor.onDidChangeModelContent, editor.onDidChangeModel))(() => {
                this._session = undefined;
                this._sessionService.releaseSession(session);
                this._ctxHasStashedSession.reset();
            });
        }
        dispose() {
            this._listener.dispose();
            this._ctxHasStashedSession.reset();
            if (this._session) {
                this._sessionService.releaseSession(this._session);
            }
        }
        unstash() {
            if (!this._session) {
                return undefined;
            }
            this._listener.dispose();
            const result = this._session;
            result.markUnstashed();
            result.hunkData.ignoreTextModelNChanges = true;
            result.textModelN.pushEditOperations(null, this._undoCancelEdits, () => null);
            result.hunkData.ignoreTextModelNChanges = false;
            this._session = undefined;
            this._logService.debug('[IE] Unstashed session');
            return result;
        }
    };
    exports.StashedSession = StashedSession;
    exports.StashedSession = StashedSession = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, inlineChatSessionService_1.IInlineChatSessionService),
        __param(5, log_1.ILogService)
    ], StashedSession);
    // ---
    let HunkData = class HunkData {
        static { HunkData_1 = this; }
        static { this._HUNK_TRACKED_RANGE = textModel_1.ModelDecorationOptions.register({
            description: 'inline-chat-hunk-tracked-range',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */
        }); }
        static { this._HUNK_THRESHOLD = 8; }
        constructor(_editorWorkerService, _textModel0, _textModelN) {
            this._editorWorkerService = _editorWorkerService;
            this._textModel0 = _textModel0;
            this._textModelN = _textModelN;
            this._store = new lifecycle_1.DisposableStore();
            this._data = new Map();
            this._ignoreChanges = false;
            this._store.add(_textModelN.onDidChangeContent(e => {
                if (!this._ignoreChanges) {
                    this._mirrorChanges(e);
                }
            }));
        }
        dispose() {
            if (!this._textModelN.isDisposed()) {
                this._textModelN.changeDecorations(accessor => {
                    for (const { textModelNDecorations } of this._data.values()) {
                        textModelNDecorations.forEach(accessor.removeDecoration, accessor);
                    }
                });
            }
            if (!this._textModel0.isDisposed()) {
                this._textModel0.changeDecorations(accessor => {
                    for (const { textModel0Decorations } of this._data.values()) {
                        textModel0Decorations.forEach(accessor.removeDecoration, accessor);
                    }
                });
            }
            this._data.clear();
            this._store.dispose();
        }
        set ignoreTextModelNChanges(value) {
            this._ignoreChanges = value;
        }
        get ignoreTextModelNChanges() {
            return this._ignoreChanges;
        }
        _mirrorChanges(event) {
            // mirror textModelN changes to textModel0 execept for those that
            // overlap with a hunk
            const hunkRanges = [];
            const ranges0 = [];
            for (const { textModelNDecorations, textModel0Decorations, state } of this._data.values()) {
                if (state === 0 /* HunkState.Pending */) {
                    // pending means the hunk's changes aren't "sync'd" yet
                    for (let i = 1; i < textModelNDecorations.length; i++) {
                        const rangeN = this._textModelN.getDecorationRange(textModelNDecorations[i]);
                        const range0 = this._textModel0.getDecorationRange(textModel0Decorations[i]);
                        if (rangeN && range0) {
                            hunkRanges.push({ rangeN, range0 });
                        }
                    }
                }
                else if (state === 1 /* HunkState.Accepted */) {
                    // accepted means the hunk's changes are also in textModel0
                    for (let i = 1; i < textModel0Decorations.length; i++) {
                        const range = this._textModel0.getDecorationRange(textModel0Decorations[i]);
                        if (range) {
                            ranges0.push(range);
                        }
                    }
                }
            }
            hunkRanges.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.rangeN, b.rangeN));
            ranges0.sort(range_1.Range.compareRangesUsingStarts);
            const edits = [];
            for (const change of event.changes) {
                let isOverlapping = false;
                let pendingChangesLen = 0;
                for (const { rangeN, range0 } of hunkRanges) {
                    if (rangeN.getEndPosition().isBefore(range_1.Range.getStartPosition(change.range))) {
                        // pending hunk _before_ this change. When projecting into textModel0 we need to
                        // subtract that. Because diffing is relaxed it might include changes that are not
                        // actual insertions/deletions. Therefore we need to take the length of the original
                        // range into account.
                        pendingChangesLen += this._textModelN.getValueLengthInRange(rangeN);
                        pendingChangesLen -= this._textModel0.getValueLengthInRange(range0);
                    }
                    else if (range_1.Range.areIntersectingOrTouching(rangeN, change.range)) {
                        isOverlapping = true;
                        break;
                    }
                    else {
                        // hunks past this change aren't relevant
                        break;
                    }
                }
                if (isOverlapping) {
                    // hunk overlaps, it grew
                    continue;
                }
                const offset0 = change.rangeOffset - pendingChangesLen;
                const start0 = this._textModel0.getPositionAt(offset0);
                let acceptedChangesLen = 0;
                for (const range of ranges0) {
                    if (range.getEndPosition().isBefore(start0)) {
                        // accepted hunk _before_ this projected change. When projecting into textModel0
                        // we need to add that
                        acceptedChangesLen += this._textModel0.getValueLengthInRange(range);
                    }
                }
                const start = this._textModel0.getPositionAt(offset0 + acceptedChangesLen);
                const end = this._textModel0.getPositionAt(offset0 + acceptedChangesLen + change.rangeLength);
                edits.push(editOperation_1.EditOperation.replace(range_1.Range.fromPositions(start, end), change.text));
            }
            this._textModel0.pushEditOperations(null, edits, () => null);
        }
        async recompute() {
            const diff = await this._editorWorkerService.computeDiff(this._textModel0.uri, this._textModelN.uri, { ignoreTrimWhitespace: false, maxComputationTimeMs: Number.MAX_SAFE_INTEGER, computeMoves: false }, 'advanced');
            if (!diff || diff.changes.length === 0) {
                // return new HunkData([], session);
                return;
            }
            // merge changes neighboring changes
            const mergedChanges = [diff.changes[0]];
            for (let i = 1; i < diff.changes.length; i++) {
                const lastChange = mergedChanges[mergedChanges.length - 1];
                const thisChange = diff.changes[i];
                if (thisChange.modified.startLineNumber - lastChange.modified.endLineNumberExclusive <= HunkData_1._HUNK_THRESHOLD) {
                    mergedChanges[mergedChanges.length - 1] = new rangeMapping_1.DetailedLineRangeMapping(lastChange.original.join(thisChange.original), lastChange.modified.join(thisChange.modified), (lastChange.innerChanges ?? []).concat(thisChange.innerChanges ?? []));
                }
                else {
                    mergedChanges.push(thisChange);
                }
            }
            const hunks = mergedChanges.map(change => new RawHunk(change.original, change.modified, change.innerChanges ?? []));
            this._textModelN.changeDecorations(accessorN => {
                this._textModel0.changeDecorations(accessor0 => {
                    // clean up old decorations
                    for (const { textModelNDecorations, textModel0Decorations } of this._data.values()) {
                        textModelNDecorations.forEach(accessorN.removeDecoration, accessorN);
                        textModel0Decorations.forEach(accessor0.removeDecoration, accessor0);
                    }
                    this._data.clear();
                    // add new decorations
                    for (const hunk of hunks) {
                        const textModelNDecorations = [];
                        const textModel0Decorations = [];
                        textModelNDecorations.push(accessorN.addDecoration(lineRange_1.LineRange.asRange(hunk.modified, this._textModelN), HunkData_1._HUNK_TRACKED_RANGE));
                        textModel0Decorations.push(accessor0.addDecoration(lineRange_1.LineRange.asRange(hunk.original, this._textModel0), HunkData_1._HUNK_TRACKED_RANGE));
                        for (const change of hunk.changes) {
                            textModelNDecorations.push(accessorN.addDecoration(change.modifiedRange, HunkData_1._HUNK_TRACKED_RANGE));
                            textModel0Decorations.push(accessor0.addDecoration(change.originalRange, HunkData_1._HUNK_TRACKED_RANGE));
                        }
                        this._data.set(hunk, {
                            textModelNDecorations,
                            textModel0Decorations,
                            state: 0 /* HunkState.Pending */
                        });
                    }
                });
            });
        }
        get size() {
            return this._data.size;
        }
        get pending() {
            return iterator_1.Iterable.reduce(this._data.values(), (r, { state }) => r + (state === 0 /* HunkState.Pending */ ? 1 : 0), 0);
        }
        _discardEdits(item) {
            const edits = [];
            const rangesN = item.getRangesN();
            const ranges0 = item.getRanges0();
            for (let i = 1; i < rangesN.length; i++) {
                const modifiedRange = rangesN[i];
                const originalValue = this._textModel0.getValueInRange(ranges0[i]);
                edits.push(editOperation_1.EditOperation.replace(modifiedRange, originalValue));
            }
            return edits;
        }
        discardAll() {
            const edits = [];
            for (const item of this.getInfo()) {
                if (item.getState() !== 2 /* HunkState.Rejected */) {
                    edits.push(this._discardEdits(item));
                }
            }
            const undoEdits = [];
            this._textModelN.pushEditOperations(null, edits.flat(), (_undoEdits) => {
                undoEdits.push(_undoEdits);
                return null;
            });
            return undoEdits.flat();
        }
        getInfo() {
            const result = [];
            for (const [hunk, data] of this._data.entries()) {
                const item = {
                    getState: () => {
                        return data.state;
                    },
                    isInsertion: () => {
                        return hunk.original.isEmpty;
                    },
                    getRangesN: () => {
                        const ranges = data.textModelNDecorations.map(id => this._textModelN.getDecorationRange(id));
                        (0, arrays_1.coalesceInPlace)(ranges);
                        return ranges;
                    },
                    getRanges0: () => {
                        const ranges = data.textModel0Decorations.map(id => this._textModel0.getDecorationRange(id));
                        (0, arrays_1.coalesceInPlace)(ranges);
                        return ranges;
                    },
                    discardChanges: () => {
                        // DISCARD: replace modified range with original value. The modified range is retrieved from a decoration
                        // which was created above so that typing in the editor keeps discard working.
                        if (data.state === 0 /* HunkState.Pending */) {
                            const edits = this._discardEdits(item);
                            this._textModelN.pushEditOperations(null, edits, () => null);
                            data.state = 2 /* HunkState.Rejected */;
                        }
                    },
                    acceptChanges: () => {
                        // ACCEPT: replace original range with modified value. The modified value is retrieved from the model via
                        // its decoration and the original range is retrieved from the hunk.
                        if (data.state === 0 /* HunkState.Pending */) {
                            const edits = [];
                            const rangesN = item.getRangesN();
                            const ranges0 = item.getRanges0();
                            for (let i = 1; i < ranges0.length; i++) {
                                const originalRange = ranges0[i];
                                const modifiedValue = this._textModelN.getValueInRange(rangesN[i]);
                                edits.push(editOperation_1.EditOperation.replace(originalRange, modifiedValue));
                            }
                            this._textModel0.pushEditOperations(null, edits, () => null);
                            data.state = 1 /* HunkState.Accepted */;
                        }
                    }
                };
                result.push(item);
            }
            return result;
        }
    };
    exports.HunkData = HunkData;
    exports.HunkData = HunkData = HunkData_1 = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService)
    ], HunkData);
    class RawHunk {
        constructor(original, modified, changes) {
            this.original = original;
            this.modified = modified;
            this.changes = changes;
        }
    }
    var HunkState;
    (function (HunkState) {
        HunkState[HunkState["Pending"] = 0] = "Pending";
        HunkState[HunkState["Accepted"] = 1] = "Accepted";
        HunkState[HunkState["Rejected"] = 2] = "Rejected";
    })(HunkState || (exports.HunkState = HunkState = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlc3Npb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdFNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9FaEcsTUFBYSxpQkFBaUI7aUJBRUwsYUFBUSxHQUE0QixrQ0FBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxXQUFXLEVBQUUsK0JBQStCLEVBQUUsQ0FBQyxBQUE3RyxDQUE4RztRQU85SSxZQUE2QixVQUFzQixFQUFFLFVBQWtCO1lBQTFDLGVBQVUsR0FBVixVQUFVLENBQVk7WUFMbEMsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzNDLGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRXBELG1CQUFjLEdBQWEsRUFBRSxDQUFDO1lBR3JDLElBQUksQ0FBQyxjQUFjLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JILENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0QsQ0FBQztRQUNGLENBQUM7UUFFRCxVQUFVLENBQUMsS0FBNkI7WUFDdkMsTUFBTSxPQUFPLEdB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