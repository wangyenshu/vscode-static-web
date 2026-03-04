/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/cursor/cursorCollection", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorContext", "vs/editor/common/cursor/cursorDeleteOperations", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/textModelEvents", "vs/editor/common/viewEvents", "vs/base/common/lifecycle", "vs/editor/common/viewModelEventDispatcher"], function (require, exports, errors_1, strings, cursorCollection_1, cursorCommon_1, cursorContext_1, cursorDeleteOperations_1, cursorTypeOperations_1, range_1, selection_1, textModelEvents_1, viewEvents_1, lifecycle_1, viewModelEventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorsController = void 0;
    class CursorsController extends lifecycle_1.Disposable {
        constructor(model, viewModel, coordinatesConverter, cursorConfig) {
            super();
            this._model = model;
            this._knownModelVersionId = this._model.getVersionId();
            this._viewModel = viewModel;
            this._coordinatesConverter = coordinatesConverter;
            this.context = new cursorContext_1.CursorContext(this._model, this._viewModel, this._coordinatesConverter, cursorConfig);
            this._cursors = new cursorCollection_1.CursorCollection(this.context);
            this._hasFocus = false;
            this._isHandling = false;
            this._compositionState = null;
            this._columnSelectData = null;
            this._autoClosedActions = [];
            this._prevEditOperationType = 0 /* EditOperationType.Other */;
        }
        dispose() {
            this._cursors.dispose();
            this._autoClosedActions = (0, lifecycle_1.dispose)(this._autoClosedActions);
            super.dispose();
        }
        updateConfiguration(cursorConfig) {
            this.context = new cursorContext_1.CursorContext(this._model, this._viewModel, this._coordinatesConverter, cursorConfig);
            this._cursors.updateContext(this.context);
        }
        onLineMappingChanged(eventsCollector) {
            if (this._knownModelVersionId !== this._model.getVersionId()) {
                // There are model change events that I didn't yet receive.
                //
                // This can happen when editing the model, and the view model receives the change events first,
                // and the view model emits line mapping changed events, all before the cursor gets a chance to
                // recover from markers.
                //
                // The model change listener above will be called soon and we'll ensure a valid cursor state there.
                return;
            }
            // Ensure valid state
            this.setStates(eventsCollector, 'viewModel', 0 /* CursorChangeReason.NotSet */, this.getCursorStates());
        }
        setHasFocus(hasFocus) {
            this._hasFocus = hasFocus;
        }
        _validateAutoClosedActions() {
            if (this._autoClosedActions.length > 0) {
                const selections = this._cursors.getSelections();
                for (let i = 0; i < this._autoClosedActions.length; i++) {
                    const autoClosedAction = this._autoClosedActions[i];
                    if (!autoClosedAction.isValid(selections)) {
                        autoClosedAction.dispose();
                        this._autoClosedActions.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        // ------ some getters/setters
        getPrimaryCursorState() {
            return this._cursors.getPrimaryCursor();
        }
        getLastAddedCursorIndex() {
            return this._cursors.getLastAddedCursorIndex();
        }
        getCursorStates() {
            return this._cursors.getAll();
        }
        setStates(eventsCollector, source, reason, states) {
            let reachedMaxCursorCount = false;
            const multiCursorLimit = this.context.cursorConfig.multiCursorLimit;
            if (states !== null && states.length > multiCursorLimit) {
                states = states.slice(0, multiCursorLimit);
                reachedMaxCursorCount = true;
            }
            const oldState = CursorModelState.from(this._model, this);
            this._cursors.setStates(states);
            this._cursors.normalize();
            this._columnSelectData = null;
            this._validateAutoClosedActions();
            return this._emitStateChangedIfNecessary(eventsCollector, source, reason, oldState, reachedMaxCursorCount);
        }
        setCursorColumnSelectData(columnSelectData) {
            this._columnSelectData = columnSelectData;
        }
        revealAll(eventsCollector, source, minimalReveal, verticalType, revealHorizontal, scrollType) {
            const viewPositions = this._cursors.getViewPositions();
            let revealViewRange = null;
            let revealViewSelections = null;
            if (viewPositions.length > 1) {
                revealViewSelections = this._cursors.getViewSelections();
            }
            else {
                revealViewRange = range_1.Range.fromPositions(viewPositions[0], viewPositions[0]);
            }
            eventsCollector.emitViewEvent(new viewEvents_1.ViewRevealRangeRequestEvent(source, minimalReveal, revealViewRange, revealViewSelections, verticalType, revealHorizontal, scrollType));
        }
        revealPrimary(eventsCollector, source, minimalReveal, verticalType, revealHorizontal, scrollType) {
            const primaryCursor = this._cursors.getPrimaryCursor();
            const revealViewSelections = [primaryCursor.viewState.selection];
            eventsCollector.emitViewEvent(new viewEvents_1.ViewRevealRangeRequestEvent(source, minimalReveal, null, revealViewSelections, verticalType, revealHorizontal, scrollType));
        }
        saveState() {
            const result = [];
            const selections = this._cursors.getSelections();
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                result.push({
                    inSelectionMode: !selection.isEmpty(),
                    selectionStart: {
                        lineNumber: selection.selectionStartLineNumber,
                        column: selection.selectionStartColumn,
                    },
                    position: {
                        lineNumber: selection.positionLineNumber,
                        column: selection.positionColumn,
                    }
                });
            }
            return result;
        }
        restoreState(eventsCollector, states) {
            const desiredSelections = [];
            for (let i = 0, len = states.length; i < len; i++) {
                const state = states[i];
                let positionLineNumber = 1;
                let positionColumn = 1;
                // Avoid missing properties on the literal
                if (state.position && state.position.lineNumber) {
                    positionLineNumber = state.position.lineNumber;
                }
                if (state.position && state.position.column) {
                    positionColumn = state.position.column;
                }
                let selectionStartLineNumber = positionLineNumber;
                let selectionStartColumn = positionColumn;
                // Avoid missing properties on the literal
                if (state.selectionStart && state.selectionStart.lineNumber) {
                    selectionStartLineNumber = state.selectionStart.lineNumber;
                }
                if (state.selectionStart && state.selectionStart.column) {
                    selectionStartColumn = state.selectionStart.column;
                }
                desiredSelections.push({
                    selectionStartLineNumber: selectionStartLineNumber,
                    selectionStartColumn: selectionStartColumn,
                    positionLineNumber: positionLineNumber,
                    positionColumn: positionColumn
                });
            }
            this.setStates(eventsCollector, 'restoreState', 0 /* CursorChangeReason.NotSet */, cursorCommon_1.CursorState.fromModelSelections(desiredSelections));
            this.revealAll(eventsCollector, 'restoreState', false, 0 /* VerticalRevealType.Simple */, true, 1 /* editorCommon.ScrollType.Immediate */);
        }
        onModelContentChanged(eventsCollector, event) {
            if (event instanceof textModelEvents_1.ModelInjectedTextChangedEvent) {
                // If injected texts change, the view positions of all cursors need to be updated.
                if (this._isHandling) {
                    // The view positions will be updated when handling finishes
                    return;
                }
                // setStates might remove markers, which could trigger a decoration change.
                // If there are injected text decorations for that line, `onModelContentChanged` is emitted again
                // and an endless recursion happens.
                // _isHandling prevents that.
                this._isHandling = true;
                try {
                    this.setStates(eventsCollector, 'modelChange', 0 /* CursorChangeReason.NotSet */, this.getCursorStates());
                }
                finally {
                    this._isHandling = false;
                }
            }
            else {
                const e = event.rawContentChangedEvent;
                this._knownModelVersionId = e.versionId;
                if (this._isHandling) {
                    return;
                }
                const hadFlushEvent = e.containsEvent(1 /* RawContentChangedType.Flush */);
                this._prevEditOperationType = 0 /* EditOperationType.Other */;
                if (hadFlushEvent) {
                    // a model.setValue() was called
                    this._cursors.dispose();
                    this._cursors = new cursorCollection_1.CursorCollection(this.context);
                    this._validateAutoClosedActions();
                    this._emitStateChangedIfNecessary(eventsCollector, 'model', 1 /* CursorChangeReason.ContentFlush */, null, false);
                }
                else {
                    if (this._hasFocus && e.resultingSelection && e.resultingSelection.length > 0) {
                        const cursorState = cursorCommon_1.CursorState.fromModelSelections(e.resultingSelection);
                        if (this.setStates(eventsCollector, 'modelChange', e.isUndoing ? 5 /* CursorChangeReason.Undo */ : e.isRedoing ? 6 /* CursorChangeReason.Redo */ : 2 /* CursorChangeReason.RecoverFromMarkers */, cursorState)) {
                            this.revealAll(eventsCollector, 'modelChange', false, 0 /* VerticalRevealType.Simple */, true, 0 /* editorCommon.ScrollType.Smooth */);
                        }
                    }
                    else {
                        const selectionsFromMarkers = this._cursors.readSelectionFromMarkers();
                        this.setStates(eventsCollector, 'modelChange', 2 /* CursorChangeReason.RecoverFromMarkers */, cursorCommon_1.CursorState.fromModelSelections(selectionsFromMarkers));
                    }
                }
            }
        }
        getSelection() {
            return this._cursors.getPrimaryCursor().modelState.selection;
        }
        getTopMostViewPosition() {
            return this._cursors.getTopMostViewPosition();
        }
        getBottomMostViewPosition() {
            return this._cursors.getBottomMostViewPosition();
        }
        getCursorColumnSelectData() {
            if (this._columnSelectData) {
                return this._columnSelectData;
            }
            const primaryCursor = this._cursors.getPrimaryCursor();
            const viewSelectionStart = primaryCursor.viewState.selectionStart.getStartPosition();
            const viewPosition = primaryCursor.viewState.position;
            return {
                isReal: false,
                fromViewLineNumber: viewSelectionStart.lineNumber,
                fromViewVisualColumn: this.context.cursorConfig.visibleColumnFromColumn(this._viewModel, viewSelectionStart),
                toViewLineNumber: viewPosition.lineNumber,
                toViewVisualColumn: this.context.cursorConfig.visibleColumnFromColumn(this._viewModel, viewPosition),
            };
        }
        getSelections() {
            return this._cursors.getSelections();
        }
        getPosition() {
            return this._cursors.getPrimaryCursor().modelState.position;
        }
        setSelections(eventsCollector, source, selections, reason) {
            this.setStates(eventsCollector, source, reason, cursorCommon_1.CursorState.fromModelSelections(selections));
        }
        getPrevEditOperationType() {
            return this._prevEditOperationType;
        }
        setPrevEditOperationType(type) {
            this._prevEditOperationType = type;
        }
        // ------ auxiliary handling logic
        _pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges) {
            const autoClosedCharactersDeltaDecorations = [];
            const autoClosedEnclosingDeltaDecorations = [];
            for (let i = 0, len = autoClosedCharactersRanges.length; i < len; i++) {
                autoClosedCharactersDeltaDecorations.push({
                    range: autoClosedCharactersRanges[i],
                    options: {
                        description: 'auto-closed-character',
                        inlineClassName: 'auto-closed-character',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
                    }
                });
                autoClosedEnclosingDeltaDecorations.push({
                    range: autoClosedEnclosingRanges[i],
                    options: {
                        description: 'auto-closed-enclosing',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
                    }
                });
            }
            const autoClosedCharactersDecorations = this._model.deltaDecorations([], autoClosedCharactersDeltaDecorations);
            const autoClosedEnclosingDecorations = this._model.deltaDecorations([], autoClosedEnclosingDeltaDecorations);
            this._autoClosedActions.push(new AutoClosedAction(this._model, autoClosedCharactersDecorations, autoClosedEnclosingDecorations));
        }
        _executeEditOperation(opResult) {
            if (!opResult) {
                // Nothing to execute
                return;
            }
            if (opResult.shouldPushStackElementBefore) {
                this._model.pushStackElement();
            }
            const result = CommandExecutor.executeCommands(this._model, this._cursors.getSelections(), opResult.commands);
            if (result) {
                // The commands were applied correctly
                this._interpretCommandResult(result);
                // Check for auto-closing closed characters
                const autoClosedCharactersRanges = [];
                const autoClosedEnclosingRanges = [];
                for (let i = 0; i < opResult.commands.length; i++) {
                    const command = opResult.commands[i];
                    if (command instanceof cursorTypeOperations_1.TypeWithAutoClosingCommand && command.enclosingRange && command.closeCharacterRange) {
                        autoClosedCharactersRanges.push(command.closeCharacterRange);
                        autoClosedEnclosingRanges.push(command.enclosingRange);
                    }
                }
                if (autoClosedCharactersRanges.length > 0) {
                    this._pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges);
                }
                this._prevEditOperationType = opResult.type;
            }
            if (opResult.shouldPushStackElementAfter) {
                this._model.pushStackElement();
            }
        }
        _interpretCommandResult(cursorState) {
            if (!cursorState || cursorState.length === 0) {
                cursorState = this._cursors.readSelectionFromMarkers();
            }
            this._columnSelectData = null;
            this._cursors.setSelections(cursorState);
            this._cursors.normalize();
        }
        // -----------------------------------------------------------------------------------------------------------
        // ----- emitting events
        _emitStateChangedIfNecessary(eventsCollector, source, reason, oldState, reachedMaxCursorCount) {
            const newState = CursorModelState.from(this._model, this);
            if (newState.equals(oldState)) {
                return false;
            }
            const selections = this._cursors.getSelections();
            const viewSelections = this._cursors.getViewSelections();
            // Let the view get the event first.
            eventsCollector.emitViewEvent(new viewEvents_1.ViewCursorStateChangedEvent(viewSelections, selections, reason));
            // Only after the view has been notified, let the rest of the world know...
            if (!oldState
                || oldState.cursorState.length !== newState.cursorState.length
                || newState.cursorState.some((newCursorState, i) => !newCursorState.modelState.equals(oldState.cursorState[i].modelState))) {
                const oldSelections = oldState ? oldState.cursorState.map(s => s.modelState.selection) : null;
                const oldModelVersionId = oldState ? oldState.modelVersionId : 0;
                eventsCollector.emitOutgoingEvent(new viewModelEventDispatcher_1.CursorStateChangedEvent(oldSelections, selections, oldModelVersionId, newState.modelVersionId, source || 'keyboard', reason, reachedMaxCursorCount));
            }
            return true;
        }
        // -----------------------------------------------------------------------------------------------------------
        // ----- handlers beyond this point
        _findAutoClosingPairs(edits) {
            if (!edits.length) {
                return null;
            }
            const indices = [];
            for (let i = 0, len = edits.length; i < len; i++) {
                const edit = edits[i];
                if (!edit.text || edit.text.indexOf('\n') >= 0) {
                    return null;
                }
                const m = edit.text.match(/([)\]}>'"`])([^)\]}>'"`]*)$/);
                if (!m) {
                    return null;
                }
                const closeChar = m[1];
                const autoClosingPairsCandidates = this.context.cursorConfig.autoClosingPairs.autoClosingPairsCloseSingleChar.get(closeChar);
                if (!autoClosingPairsCandidates || autoClosingPairsCandidates.length !== 1) {
                    return null;
                }
                const openChar = autoClosingPairsCandidates[0].open;
                const closeCharIndex = edit.text.length - m[2].length - 1;
                const openCharIndex = edit.text.lastIndexOf(openChar, closeCharIndex - 1);
                if (openCharIndex === -1) {
                    return null;
                }
                indices.push([openCharIndex, closeCharIndex]);
            }
            return indices;
        }
        executeEdits(eventsCollector, source, edits, cursorStateComputer) {
            let autoClosingIndices = null;
            if (source === 'snippet') {
                autoClosingIndices = this._findAutoClosingPairs(edits);
            }
            if (autoClosingIndices) {
                edits[0]._isTracked = true;
            }
            const autoClosedCharactersRanges = [];
            const autoClosedEnclosingRanges = [];
            const selections = this._model.pushEditOperations(this.getSelections(), edits, (undoEdits) => {
                if (autoClosingIndices) {
                    for (let i = 0, len = autoClosingIndices.length; i < len; i++) {
                        const [openCharInnerIndex, closeCharInnerIndex] = autoClosingIndices[i];
                        const undoEdit = undoEdits[i];
                        const lineNumber = undoEdit.range.startLineNumber;
                        const openCharIndex = undoEdit.range.startColumn - 1 + openCharInnerIndex;
                        const closeCharIndex = undoEdit.range.startColumn - 1 + closeCharInnerIndex;
                        autoClosedCharactersRanges.push(new range_1.Range(lineNumber, closeCharIndex + 1, lineNumber, closeCharIndex + 2));
                        autoClosedEnclosingRanges.push(new range_1.Range(lineNumber, openCharIndex + 1, lineNumber, closeCharIndex + 2));
                    }
                }
                const selections = cursorStateComputer(undoEdits);
                if (selections) {
                    // Don't recover the selection from markers because
                    // we know what it should be.
                    this._isHandling = true;
                }
                return selections;
            });
            if (selections) {
                this._isHandling = false;
                this.setSelections(eventsCollector, source, selections, 0 /* CursorChangeReason.NotSet */);
            }
            if (autoClosedCharactersRanges.length > 0) {
                this._pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges);
            }
        }
        _executeEdit(callback, eventsCollector, source, cursorChangeReason = 0 /* CursorChangeReason.NotSet */) {
            if (this.context.cursorConfig.readOnly) {
                // we cannot edit when read only...
                return;
            }
            const oldState = CursorModelState.from(this._model, this);
            this._cursors.stopTrackingSelections();
            this._isHandling = true;
            try {
                this._cursors.ensureValidState();
                callback();
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
            this._isHandling = false;
            this._cursors.startTrackingSelections();
            this._validateAutoClosedActions();
            if (this._emitStateChangedIfNecessary(eventsCollector, source, cursorChangeReason, oldState, false)) {
                this.revealAll(eventsCollector, source, false, 0 /* VerticalRevealType.Simple */, true, 0 /* editorCommon.ScrollType.Smooth */);
            }
        }
        getAutoClosedCharacters() {
            return AutoClosedAction.getAllAutoClosedCharacters(this._autoClosedActions);
        }
        startComposition(eventsCollector) {
            this._compositionState = new CompositionState(this._model, this.getSelections());
        }
        endComposition(eventsCollector, source) {
            const compositionOutcome = this._compositionState ? this._compositionState.deduceOutcome(this._model, this.getSelections()) : null;
            this._compositionState = null;
            this._executeEdit(() => {
                if (source === 'keyboard') {
                    // composition finishes, let's check if we need to auto complete if necessary.
                    this._executeEditOperation(cursorTypeOperations_1.TypeOperations.compositionEndWithInterceptors(this._prevEditOperationType, this.context.cursorConfig, this._model, compositionOutcome, this.getSelections(), this.getAutoClosedCharacters()));
                }
            }, eventsCollector, source);
        }
        type(eventsCollector, text, source) {
            this._executeEdit(() => {
                if (source === 'keyboard') {
                    // If this event is coming straight from the keyboard, look for electric characters and enter
                    const len = text.length;
                    let offset = 0;
                    while (offset < len) {
                        const charLength = strings.nextCharLength(text, offset);
                        const chr = text.substr(offset, charLength);
                        // Here we must interpret each typed character individually
                        this._executeEditOperation(cursorTypeOperations_1.TypeOperations.typeWithInterceptors(!!this._compositionState, this._prevEditOperationType, this.context.cursorConfig, this._model, this.getSelections(), this.getAutoClosedCharacters(), chr));
                        offset += charLength;
                    }
                }
                else {
                    this._executeEditOperation(cursorTypeOperations_1.TypeOperations.typeWithoutInterceptors(this._prevEditOperationType, this.context.cursorConfig, this._model, this.getSelections(), text));
                }
            }, eventsCollector, source);
        }
        compositionType(eventsCollector, text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source) {
            if (text.length === 0 && replacePrevCharCnt === 0 && replaceNextCharCnt === 0) {
                // this edit is a no-op
                if (positionDelta !== 0) {
                    // but it still wants to move the cursor
                    const newSelections = this.getSelections().map(selection => {
                        const position = selection.getPosition();
                        return new selection_1.Selection(position.lineNumber, position.column + positionDelta, position.lineNumber, position.column + positionDelta);
                    });
                    this.setSelections(eventsCollector, source, newSelections, 0 /* CursorChangeReason.NotSet */);
                }
                return;
            }
            this._executeEdit(() => {
                this._executeEditOperation(cursorTypeOperations_1.TypeOperations.compositionType(this._prevEditOperationType, this.context.cursorConfig, this._model, this.getSelections(), text, replacePrevCharCnt, replaceNextCharCnt, positionDelta));
            }, eventsCollector, source);
        }
        paste(eventsCollector, text, pasteOnNewLine, multicursorText, source) {
            this._executeEdit(() => {
                this._executeEditOperation(cursorTypeOperations_1.TypeOperations.paste(this.context.cursorConfig, this._model, this.getSelections(), text, pasteOnNewLine, multicursorText || []));
            }, eventsCollector, source, 4 /* CursorChangeReason.Paste */);
        }
        cut(eventsCollector, source) {
            this._executeEdit(() => {
                this._executeEditOperation(cursorDeleteOperations_1.DeleteOperations.cut(this.context.cursorConfig, this._model, this.getSelections()));
            }, eventsCollector, source);
        }
        executeCommand(eventsCollector, command, source) {
            this._executeEdit(() => {
                this._cursors.killSecondaryCursors();
                this._executeEditOperation(new cursorCommon_1.EditOperationResult(0 /* EditOperationType.Other */, [command], {
                    shouldPushStackElementBefore: false,
                    shouldPushStackElementAfter: false
                }));
            }, eventsCollector, source);
        }
        executeCommands(eventsCollector, commands, source) {
            this._executeEdit(() => {
                this._executeEditOperation(new cursorCommon_1.EditOperationResult(0 /* EditOperationType.Other */, commands, {
                    shouldPushStackElementBefore: false,
                    shouldPushStackElementAfter: false
                }));
            }, eventsCollector, source);
        }
    }
    exports.CursorsController = CursorsController;
    /**
     * A snapshot of the cursor and the model state
     */
    class CursorModelState {
        static from(model, cursor) {
            return new CursorModelState(model.getVersionId(), cursor.getCursorStates());
        }
        constructor(modelVersionId, cursorState) {
            this.modelVersionId = modelVersionId;
            this.cursorState = cursorState;
        }
        equals(other) {
            if (!other) {
                return false;
            }
            if (this.modelVersionId !== other.modelVersionId) {
                return false;
            }
            if (this.cursorState.length !== other.cursorState.length) {
                return false;
            }
            for (let i = 0, len = this.cursorState.length; i < len; i++) {
                if (!this.cursorState[i].equals(other.cursorState[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class AutoClosedAction {
        static getAllAutoClosedCharacters(autoClosedActions) {
            let autoClosedCharacters = [];
            for (const autoClosedAction of autoClosedActions) {
                autoClosedCharacters = autoClosedCharacters.concat(autoClosedAction.getAutoClosedCharactersRanges());
            }
            return autoClosedCharacters;
        }
        constructor(model, autoClosedCharactersDecorations, autoClosedEnclosingDecorations) {
            this._model = model;
            this._autoClosedCharactersDecorations = autoClosedCharactersDecorations;
            this._autoClosedEnclosingDecorations = autoClosedEnclosingDecorations;
        }
        dispose() {
            this._autoClosedCharactersDecorations = this._model.deltaDecorations(this._autoClosedCharactersDecorations, []);
            this._autoClosedEnclosingDecorations = this._model.deltaDecorations(this._autoClosedEnclosingDecorations, []);
        }
        getAutoClosedCharactersRanges() {
            const result = [];
            for (let i = 0; i < this._autoClosedCharactersDecorations.length; i++) {
                const decorationRange = this._model.getDecorationRange(this._autoClosedCharactersDecorations[i]);
                if (decorationRange) {
                    result.push(decorationRange);
                }
            }
            return result;
        }
        isValid(selections) {
            const enclosingRanges = [];
            for (let i = 0; i < this._autoClosedEnclosingDecorations.length; i++) {
                const decorationRange = this._model.getDecorationRange(this._autoClosedEnclosingDecorations[i]);
                if (decorationRange) {
                    enclosingRanges.push(decorationRange);
                    if (decorationRange.startLineNumber !== decorationRange.endLineNumber) {
                        // Stop tracking if the range becomes multiline...
                        return false;
                    }
                }
            }
            enclosingRanges.sort(range_1.Range.compareRangesUsingStarts);
            selections.sort(range_1.Range.compareRangesUsingStarts);
            for (let i = 0; i < selections.length; i++) {
                if (i >= enclosingRanges.length) {
                    return false;
                }
                if (!enclosingRanges[i].strictContainsRange(selections[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class CommandExecutor {
        static executeCommands(model, selectionsBefore, commands) {
            const ctx = {
                model: model,
                selectionsBefore: selectionsBefore,
                trackedRanges: [],
                trackedRangesDirection: []
            };
            const result = this._innerExecuteCommands(ctx, commands);
            for (let i = 0, len = ctx.trackedRanges.length; i < len; i++) {
                ctx.model._setTrackedRange(ctx.trackedRanges[i], null, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */);
            }
            return result;
        }
        static _innerExecuteCommands(ctx, commands) {
            if (this._arrayIsEmpty(commands)) {
                return null;
            }
            const commandsData = this._getEditOperations(ctx, commands);
            if (commandsData.operations.length === 0) {
                return null;
            }
            const rawOperations = commandsData.operations;
            const loserCursorsMap = this._getLoserCursorMap(rawOperations);
            if (loserCursorsMap.hasOwnProperty('0')) {
                // These commands are very messed up
                console.warn('Ignoring commands');
                return null;
            }
            // Remove operations belonging to losing cursors
            const filteredOperations = [];
            for (let i = 0, len = rawOperations.length; i < len; i++) {
                if (!loserCursorsMap.hasOwnProperty(rawOperations[i].identifier.major.toString())) {
                    filteredOperations.push(rawOperations[i]);
                }
            }
            // TODO@Alex: find a better way to do this.
            // give the hint that edit operations are tracked to the model
            if (commandsData.hadTrackedEditOperation && filteredOperations.length > 0) {
                filteredOperations[0]._isTracked = true;
            }
            let selectionsAfter = ctx.model.pushEditOperations(ctx.selectionsBefore, filteredOperations, (inverseEditOperations) => {
                const groupedInverseEditOperations = [];
                for (let i = 0; i < ctx.selectionsBefore.length; i++) {
                    groupedInverseEditOperations[i] = [];
                }
                for (const op of inverseEditOperations) {
                    if (!op.identifier) {
                        // perhaps auto whitespace trim edits
                        continue;
                    }
                    groupedInverseEditOperations[op.identifier.major].push(op);
                }
                const minorBasedSorter = (a, b) => {
                    return a.identifier.minor - b.identifier.minor;
                };
                const cursorSelections = [];
                for (let i = 0; i < ctx.selectionsBefore.length; i++) {
                    if (groupedInverseEditOperations[i].length > 0) {
                        groupedInverseEditOperations[i].sort(minorBasedSorter);
                        cursorSelections[i] = commands[i].computeCursorState(ctx.model, {
                            getInverseEditOperations: () => {
                                return groupedInverseEditOperations[i];
                            },
                            getTrackedSelection: (id) => {
                                const idx = parseInt(id, 10);
                                const range = ctx.model._getTrackedRange(ctx.trackedRanges[idx]);
                                if (ctx.trackedRangesDirection[idx] === 0 /* SelectionDirection.LTR */) {
                                    return new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
                                }
                                return new selection_1.Selection(range.endLineNumber, range.endColumn, range.startLineNumber, range.startColumn);
                            }
                        });
                    }
                    else {
                        cursorSelections[i] = ctx.selectionsBefore[i];
                    }
                }
                return cursorSelections;
            });
            if (!selectionsAfter) {
                selectionsAfter = ctx.selectionsBefore;
            }
            // Extract losing cursors
            const losingCursors = [];
            for (const losingCursorIndex in loserCursorsMap) {
                if (loserCursorsMap.hasOwnProperty(losingCursorIndex)) {
                    losingCursors.push(parseInt(losingCursorIndex, 10));
                }
            }
            // Sort losing cursors descending
            losingCursors.sort((a, b) => {
                return b - a;
            });
            // Remove losing cursors
            for (const losingCursor of losingCursors) {
                selectionsAfter.splice(losingCursor, 1);
            }
            return selectionsAfter;
        }
        static _arrayIsEmpty(commands) {
            for (let i = 0, len = commands.length; i < len; i++) {
                if (commands[i]) {
                    return false;
                }
            }
            return true;
        }
        static _getEditOperations(ctx, commands) {
            let operations = [];
            let hadTrackedEditOperation = false;
            for (let i = 0, len = commands.length; i < len; i++) {
                const command = commands[i];
                if (command) {
                    const r = this._getEditOperationsFromCommand(ctx, i, command);
                    operations = operations.concat(r.operations);
                    hadTrackedEditOperation = hadTrackedEditOperation || r.hadTrackedEditOperation;
                }
            }
            return {
                operations: operations,
                hadTrackedEditOperation: hadTrackedEditOperation
            };
        }
        static _getEditOperationsFromCommand(ctx, majorIdentifier, command) {
            // This method acts as a transaction, if the command fails
            // everything it has done is ignored
            const operations = [];
            let operationMinor = 0;
            const addEditOperation = (range, text, forceMoveMarkers = false) => {
                if (range_1.Range.isEmpty(range) && text === '') {
                    // This command wants to add a no-op => no thank you
                    return;
                }
                operations.push({
                    identifier: {
                        major: majorIdentifier,
                        minor: operationMinor++
                    },
                    range: range,
                    text: text,
                    forceMoveMarkers: forceMoveMarkers,
                    isAutoWhitespaceEdit: command.insertsAutoWhitespace
                });
            };
            let hadTrackedEditOperation = false;
            const addTrackedEditOperation = (selection, text, forceMoveMarkers) => {
                hadTrackedEditOperation = true;
                addEditOperation(selection, text, forceMoveMarkers);
            };
            const trackSelection = (_selection, trackPreviousOnEmpty) => {
                const selection = selection_1.Selection.liftSelection(_selection);
                let stickiness;
                if (selection.isEmpty()) {
                    if (typeof trackPreviousOnEmpty === 'boolean') {
                        if (trackPreviousOnEmpty) {
                            stickiness = 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */;
                        }
                        else {
                            stickiness = 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */;
                        }
                    }
                    else {
                        // Try to lock it with surrounding text
                        const maxLineColumn = ctx.model.getLineMaxColumn(selection.startLineNumber);
                        if (selection.startColumn === maxLineColumn) {
                            stickiness = 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */;
                        }
                        else {
                            stickiness = 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */;
                        }
                    }
                }
                else {
                    stickiness = 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
                }
                const l = ctx.trackedRanges.length;
                const id = ctx.model._setTrackedRange(null, selection, stickiness);
                ctx.trackedRanges[l] = id;
                ctx.trackedRangesDirection[l] = selection.getDirection();
                return l.toString();
            };
            const editOperationBuilder = {
                addEditOperation: addEditOperation,
                addTrackedEditOperation: addTrackedEditOperation,
                trackSelection: trackSelection
            };
            try {
                command.getEditOperations(ctx.model, editOperationBuilder);
            }
            catch (e) {
                // TODO@Alex use notification service if this should be user facing
                // e.friendlyMessage = nls.localize('corrupt.commands', "Unexpected exception while executing command.");
                (0, errors_1.onUnexpectedError)(e);
                return {
                    operations: [],
                    hadTrackedEditOperation: false
                };
            }
            return {
                operations: operations,
                hadTrackedEditOperation: hadTrackedEditOperation
            };
        }
        static _getLoserCursorMap(operations) {
            // This is destructive on the array
            operations = operations.slice(0);
            // Sort operations with last one first
            operations.sort((a, b) => {
                // Note the minus!
                return -(range_1.Range.compareRangesUsingEnds(a.range, b.range));
            });
            // Operations can not overlap!
            const loserCursorsMap = {};
            for (let i = 1; i < operations.length; i++) {
                const previousOp = operations[i - 1];
                const currentOp = operations[i];
                if (range_1.Range.getStartPosition(previousOp.range).isBefore(range_1.Range.getEndPosition(currentOp.range))) {
                    let loserMajor;
                    if (previousOp.identifier.major > currentOp.identifier.major) {
                        // previousOp loses the battle
                        loserMajor = previousOp.identifier.major;
                    }
                    else {
                        loserMajor = currentOp.identifier.major;
                    }
                    loserCursorsMap[loserMajor.toString()] = true;
                    for (let j = 0; j < operations.length; j++) {
                        if (operations[j].identifier.major === loserMajor) {
                            operations.splice(j, 1);
                            if (j < i) {
                                i--;
                            }
                            j--;
                        }
                    }
                    if (i > 0) {
                        i--;
                    }
                }
            }
            return loserCursorsMap;
        }
    }
    class CompositionLineState {
        constructor(text, startSelection, endSelection) {
            this.text = text;
            this.startSelection = startSelection;
            this.endSelection = endSelection;
        }
    }
    class CompositionState {
        static _capture(textModel, selections) {
            const result = [];
            for (const selection of selections) {
                if (selection.startLineNumber !== selection.endLineNumber) {
                    return null;
                }
                result.push(new CompositionLineState(textModel.getLineContent(selection.startLineNumber), selection.startColumn - 1, selection.endColumn - 1));
            }
            return result;
        }
        constructor(textModel, selections) {
            this._original = CompositionState._capture(textModel, selections);
        }
        /**
         * Returns the inserted text during this composition.
         * If the composition resulted in existing text being changed (i.e. not a pure insertion) it returns null.
         */
        deduceOutcome(textModel, selections) {
            if (!this._original) {
                return null;
            }
            const current = CompositionState._capture(textModel, selections);
            if (!current) {
                return null;
            }
            if (this._original.length !== current.length) {
                return null;
            }
            const result = [];
            for (let i = 0, len = this._original.length; i < len; i++) {
                result.push(CompositionState._deduceOutcome(this._original[i], current[i]));
            }
            return result;
        }
        static _deduceOutcome(original, current) {
            const commonPrefix = Math.min(original.startSelection, current.startSelection, strings.commonPrefixLength(original.text, current.text));
            const commonSuffix = Math.min(original.text.length - original.endSelection, current.text.length - current.endSelection, strings.commonSuffixLength(original.text, current.text));
            const deletedText = original.text.substring(commonPrefix, original.text.length - commonSuffix);
            const insertedText = current.text.substring(commonPrefix, current.text.length - commonSuffix);
            return new cursorTypeOperations_1.CompositionOutcome(deletedText, original.startSelection - commonPrefix, original.endSelection - commonPrefix, insertedText, current.startSelection - commonPrefix, current.endSelection - commonPrefix);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jdXJzb3IvY3Vyc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsTUFBYSxpQkFBa0IsU0FBUSxzQkFBVTtRQWdCaEQsWUFBWSxLQUFpQixFQUFFLFNBQTZCLEVBQUUsb0JBQTJDLEVBQUUsWUFBaUM7WUFDM0ksS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMscUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLDZCQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN6RyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksbUNBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRW5ELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUM5QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxzQkFBc0Isa0NBQTBCLENBQUM7UUFDdkQsQ0FBQztRQUVlLE9B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