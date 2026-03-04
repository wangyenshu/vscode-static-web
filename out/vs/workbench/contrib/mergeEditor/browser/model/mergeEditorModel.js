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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/observable", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/nls", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/textModelDiffs", "vs/workbench/contrib/mergeEditor/browser/utils", "./modifiedBaseRange"], function (require, exports, arrays_1, errors_1, observable_1, range_1, language_1, nls_1, undoRedo_1, editorModel_1, lineRange_1, mapping_1, textModelDiffs_1, utils_1, modifiedBaseRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorModelState = exports.MergeEditorModel = void 0;
    let MergeEditorModel = class MergeEditorModel extends editorModel_1.EditorModel {
        constructor(base, input1, input2, resultTextModel, diffComputer, options, telemetry, languageService, undoRedoService) {
            super();
            this.base = base;
            this.input1 = input1;
            this.input2 = input2;
            this.resultTextModel = resultTextModel;
            this.diffComputer = diffComputer;
            this.options = options;
            this.telemetry = telemetry;
            this.languageService = languageService;
            this.undoRedoService = undoRedoService;
            this.input1TextModelDiffs = this._register(new textModelDiffs_1.TextModelDiffs(this.base, this.input1.textModel, this.diffComputer));
            this.input2TextModelDiffs = this._register(new textModelDiffs_1.TextModelDiffs(this.base, this.input2.textModel, this.diffComputer));
            this.resultTextModelDiffs = this._register(new textModelDiffs_1.TextModelDiffs(this.base, this.resultTextModel, this.diffComputer));
            this.modifiedBaseRanges = (0, observable_1.derived)(this, (reader) => {
                const input1Diffs = this.input1TextModelDiffs.diffs.read(reader);
                const input2Diffs = this.input2TextModelDiffs.diffs.read(reader);
                return modifiedBaseRange_1.ModifiedBaseRange.fromDiffs(input1Diffs, input2Diffs, this.base, this.input1.textModel, this.input2.textModel);
            });
            this.modifiedBaseRangeResultStates = (0, observable_1.derived)(this, reader => {
                const map = new Map(this.modifiedBaseRanges.read(reader).map((s) => [
                    s, new ModifiedBaseRangeData(s)
                ]));
                return map;
            });
            this.resultSnapshot = this.resultTextModel.createSnapshot();
            this.baseInput1Diffs = this.input1TextModelDiffs.diffs;
            this.baseInput2Diffs = this.input2TextModelDiffs.diffs;
            this.baseResultDiffs = this.resultTextModelDiffs.diffs;
            this.input1ResultMapping = (0, observable_1.derived)(this, reader => {
                return this.getInputResultMapping(this.baseInput1Diffs.read(reader), this.baseResultDiffs.read(reader), this.input1.textModel.getLineCount());
            });
            this.resultInput1Mapping = (0, observable_1.derived)(this, reader => this.input1ResultMapping.read(reader).reverse());
            this.input2ResultMapping = (0, observable_1.derived)(this, reader => {
                return this.getInputResultMapping(this.baseInput2Diffs.read(reader), this.baseResultDiffs.read(reader), this.input2.textModel.getLineCount());
            });
            this.resultInput2Mapping = (0, observable_1.derived)(this, reader => this.input2ResultMapping.read(reader).reverse());
            this.baseResultMapping = (0, observable_1.derived)(this, reader => {
                const map = new mapping_1.DocumentLineRangeMap(this.baseResultDiffs.read(reader), -1);
                return new mapping_1.DocumentLineRangeMap(map.lineRangeMappings.map((m) => m.inputRange.isEmpty || m.outputRange.isEmpty
                    ? new mapping_1.LineRangeMapping(
                    // We can do this because two adjacent diffs have one line in between.
                    m.inputRange.deltaStart(-1), m.outputRange.deltaStart(-1))
                    : m), map.inputLineCount);
            });
            this.resultBaseMapping = (0, observable_1.derived)(this, reader => this.baseResultMapping.read(reader).reverse());
            this.diffComputingState = (0, observable_1.derived)(this, reader => {
                const states = [
                    this.input1TextModelDiffs,
                    this.input2TextModelDiffs,
                    this.resultTextModelDiffs,
                ].map((s) => s.state.read(reader));
                if (states.some((s) => s === 1 /* TextModelDiffState.initializing */)) {
                    return 1 /* MergeEditorModelState.initializing */;
                }
                if (states.some((s) => s === 3 /* TextModelDiffState.updating */)) {
                    return 3 /* MergeEditorModelState.updating */;
                }
                return 2 /* MergeEditorModelState.upToDate */;
            });
            this.inputDiffComputingState = (0, observable_1.derived)(this, reader => {
                const states = [
                    this.input1TextModelDiffs,
                    this.input2TextModelDiffs,
                ].map((s) => s.state.read(reader));
                if (states.some((s) => s === 1 /* TextModelDiffState.initializing */)) {
                    return 1 /* MergeEditorModelState.initializing */;
                }
                if (states.some((s) => s === 3 /* TextModelDiffState.updating */)) {
                    return 3 /* MergeEditorModelState.updating */;
                }
                return 2 /* MergeEditorModelState.upToDate */;
            });
            this.isUpToDate = (0, observable_1.derived)(this, reader => this.diffComputingState.read(reader) === 2 /* MergeEditorModelState.upToDate */);
            this.onInitialized = (0, observable_1.waitForState)(this.diffComputingState, state => state === 2 /* MergeEditorModelState.upToDate */).then(() => { });
            this.firstRun = true;
            this.unhandledConflictsCount = (0, observable_1.derived)(this, reader => {
                const map = this.modifiedBaseRangeResultStates.read(reader);
                let unhandledCount = 0;
                for (const [_key, value] of map) {
                    if (!value.handled.read(reader)) {
                        unhandledCount++;
                    }
                }
                return unhandledCount;
            });
            this.hasUnhandledConflicts = this.unhandledConflictsCount.map(value => /** @description hasUnhandledConflicts */ value > 0);
            this._register((0, observable_1.keepObserved)(this.modifiedBaseRangeResultStates));
            this._register((0, observable_1.keepObserved)(this.input1ResultMapping));
            this._register((0, observable_1.keepObserved)(this.input2ResultMapping));
            const initializePromise = this.initialize();
            this.onInitialized = this.onInitialized.then(async () => {
                await initializePromise;
            });
            initializePromise.then(() => {
                let shouldRecomputeHandledFromAccepted = true;
                this._register((0, observable_1.autorunHandleChanges)({
                    handleChange: (ctx) => {
                        if (ctx.didChange(this.modifiedBaseRangeResultStates)) {
                            shouldRecomputeHandledFromAccepted = true;
                        }
                        return ctx.didChange(this.resultTextModelDiffs.diffs)
                            // Ignore non-text changes as we update the state directly
                            ? ctx.change === 1 /* TextModelDiffChangeReason.textChange */
                            : true;
                    },
                }, (reader) => {
                    /** @description Merge Editor Model: Recompute State From Result */
                    const states = this.modifiedBaseRangeResultStates.read(reader);
                    if (!this.isUpToDate.read(reader)) {
                        return;
                    }
                    const resultDiffs = this.resultTextModelDiffs.diffs.read(reader);
                    (0, observable_1.transaction)(tx => {
                        /** @description Merge Editor Model: Recompute State */
                        this.updateBaseRangeAcceptedState(resultDiffs, states, tx);
                        if (shouldRecomputeHandledFromAccepted) {
                            shouldRecomputeHandledFromAccepted = false;
                            for (const [_range, observableState] of states) {
                                const state = observableState.accepted.get();
                                const handled = !(state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base || state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized);
                                observableState.handledInput1.set(handled, tx);
                                observableState.handledInput2.set(handled, tx);
                            }
                        }
                    });
                }));
            });
        }
        async initialize() {
            if (this.options.resetResult) {
                await this.reset();
            }
        }
        async reset() {
            await (0, observable_1.waitForState)(this.inputDiffComputingState, state => state === 2 /* MergeEditorModelState.upToDate */);
            const states = this.modifiedBaseRangeResultStates.get();
            (0, observable_1.transaction)(tx => {
                /** @description Set initial state */
                for (const [range, state] of states) {
                    let newState;
                    let handled = false;
                    if (range.input1Diffs.length === 0) {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true);
                        handled = true;
                    }
                    else if (range.input2Diffs.length === 0) {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true);
                        handled = true;
                    }
                    else if (range.isEqualChange) {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true);
                        handled = true;
                    }
                    else {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base;
                        handled = false;
                    }
                    state.accepted.set(newState, tx);
                    state.computedFromDiffing = false;
                    state.previousNonDiffingState = undefined;
                    state.handledInput1.set(handled, tx);
                    state.handledInput2.set(handled, tx);
                }
                this.resultTextModel.pushEditOperations(null, [{
                        range: new range_1.Range(1, 1, Number.MAX_SAFE_INTEGER, 1),
                        text: this.computeAutoMergedResult()
                    }], () => null);
            });
        }
        computeAutoMergedResult() {
            const baseRanges = this.modifiedBaseRanges.get();
            const baseLines = this.base.getLinesContent();
            const input1Lines = this.input1.textModel.getLinesContent();
            const input2Lines = this.input2.textModel.getLinesContent();
            const resultLines = [];
            function appendLinesToResult(source, lineRange) {
                for (let i = lineRange.startLineNumber; i < lineRange.endLineNumberExclusive; i++) {
                    resultLines.push(source[i - 1]);
                }
            }
            let baseStartLineNumber = 1;
            for (const baseRange of baseRanges) {
                appendLinesToResult(baseLines, lineRange_1.LineRange.fromLineNumbers(baseStartLineNumber, baseRange.baseRange.startLineNumber));
                baseStartLineNumber = baseRange.baseRange.endLineNumberExclusive;
                if (baseRange.input1Diffs.length === 0) {
                    appendLinesToResult(input2Lines, baseRange.input2Range);
                }
                else if (baseRange.input2Diffs.length === 0) {
                    appendLinesToResult(input1Lines, baseRange.input1Range);
                }
                else if (baseRange.isEqualChange) {
                    appendLinesToResult(input1Lines, baseRange.input1Range);
                }
                else {
                    appendLinesToResult(baseLines, baseRange.baseRange);
                }
            }
            appendLinesToResult(baseLines, lineRange_1.LineRange.fromLineNumbers(baseStartLineNumber, baseLines.length + 1));
            return resultLines.join(this.resultTextModel.getEOL());
        }
        hasBaseRange(baseRange) {
            return this.modifiedBaseRangeResultStates.get().has(baseRange);
        }
        get isApplyingEditInResult() { return this.resultTextModelDiffs.isApplyingChange; }
        getInputResultMapping(inputLinesDiffs, resultDiffs, inputLineCount) {
            const map = mapping_1.DocumentLineRangeMap.betweenOutputs(inputLinesDiffs, resultDiffs, inputLineCount);
            return new mapping_1.DocumentLineRangeMap(map.lineRangeMappings.map((m) => m.inputRange.isEmpty || m.outputRange.isEmpty
                ? new mapping_1.LineRangeMapping(
                // We can do this because two adjacent diffs have one line in between.
                m.inputRange.deltaStart(-1), m.outputRange.deltaStart(-1))
                : m), map.inputLineCount);
        }
        translateInputRangeToBase(input, range) {
            const baseInputDiffs = input === 1 ? this.baseInput1Diffs.get() : this.baseInput2Diffs.get();
            const map = new mapping_1.DocumentRangeMap(baseInputDiffs.flatMap(d => d.rangeMappings), 0).reverse();
            return map.projectRange(range).outputRange;
        }
        translateBaseRangeToInput(input, range) {
            const baseInputDiffs = input === 1 ? this.baseInput1Diffs.get() : this.baseInput2Diffs.get();
            const map = new mapping_1.DocumentRangeMap(baseInputDiffs.flatMap(d => d.rangeMappings), 0);
            return map.projectRange(range).outputRange;
        }
        getLineRangeInResult(baseRange, reader) {
            return this.resultTextModelDiffs.getResultLineRange(baseRange, reader);
        }
        translateResultRangeToBase(range) {
            const map = new mapping_1.DocumentRangeMap(this.baseResultDiffs.get().flatMap(d => d.rangeMappings), 0).reverse();
            return map.projectRange(range).outputRange;
        }
        translateBaseRangeToResult(range) {
            const map = new mapping_1.DocumentRangeMap(this.baseResultDiffs.get().flatMap(d => d.rangeMappings), 0);
            return map.projectRange(range).outputRange;
        }
        findModifiedBaseRangesInRange(rangeInBase) {
            // TODO use binary search
            return this.modifiedBaseRanges.get().filter(r => r.baseRange.intersects(rangeInBase));
        }
        updateBaseRangeAcceptedState(resultDiffs, states, tx) {
            const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.leftJoin)(states, resultDiffs, (baseRange, diff) => baseRange[0].baseRange.touches(diff.inputRange)
                ? arrays_1.CompareResult.neitherLessOrGreaterThan
                : lineRange_1.LineRange.compareByStart(baseRange[0].baseRange, diff.inputRange));
            for (const row of baseRangeWithStoreAndTouchingDiffs) {
                const newState = this.computeState(row.left[0], row.rights);
                const data = row.left[1];
                const oldState = data.accepted.get();
                if (!oldState.equals(newState)) {
                    if (!this.firstRun && !data.computedFromDiffing) {
                        // Don't set this on the first run - the first run might be used to restore state.
                        data.computedFromDiffing = true;
                        data.previousNonDiffingState = oldState;
                    }
                    data.accepted.set(newState, tx);
                }
            }
            if (this.firstRun) {
                this.firstRun = false;
            }
        }
        computeState(baseRange, conflictingDiffs) {
            if (conflictingDiffs.length === 0) {
                return modifiedBaseRange_1.ModifiedBaseRangeState.base;
            }
            const conflictingEdits = conflictingDiffs.map((d) => d.getLineEdit());
            function editsAgreeWithDiffs(diffs) {
                return (0, arrays_1.equals)(conflictingEdits, diffs.map((d) => d.getLineEdit()), (a, b) => a.equals(b));
            }
            if (editsAgreeWithDiffs(baseRange.input1Diffs)) {
                return modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true);
            }
            if (editsAgreeWithDiffs(baseRange.input2Diffs)) {
                return modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true);
            }
            const states = [
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true).withInputValue(2, true, true),
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true).withInputValue(1, true, true),
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true).withInputValue(2, true, false),
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true).withInputValue(1, true, false),
            ];
            for (const s of states) {
                const { edit } = baseRange.getEditForBase(s);
                if (edit) {
                    const resultRange = this.resultTextModelDiffs.getResultLineRange(baseRange.baseRange);
                    const existingLines = resultRange.getLines(this.resultTextModel);
                    if ((0, arrays_1.equals)(edit.newLines, existingLines, (a, b) => a === b)) {
                        return s;
                    }
                }
            }
            return modifiedBaseRange_1.ModifiedBaseRangeState.unrecognized;
        }
        getState(baseRange) {
            const existingState = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (!existingState) {
                throw new errors_1.BugIndicatingError('object must be from this instance');
            }
            return existingState.accepted;
        }
        setState(baseRange, state, _markInputAsHandled, tx, _pushStackElement = false) {
            if (!this.isUpToDate.get()) {
                throw new errors_1.BugIndicatingError('Cannot set state while updating');
            }
            const existingState = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (!existingState) {
                throw new errors_1.BugIndicatingError('object must be from this instance');
            }
            const conflictingDiffs = this.resultTextModelDiffs.findTouchingDiffs(baseRange.baseRange);
            const group = new undoRedo_1.UndoRedoGroup();
            if (conflictingDiffs) {
                this.resultTextModelDiffs.removeDiffs(conflictingDiffs, tx, group);
            }
            const { edit, effectiveState } = baseRange.getEditForBase(state);
            existingState.accepted.set(effectiveState, tx);
            existingState.previousNonDiffingState = undefined;
            existingState.computedFromDiffing = false;
            const input1Handled = existingState.handledInput1.get();
            const input2Handled = existingState.handledInput2.get();
            if (!input1Handled || !input2Handled) {
                this.undoRedoService.pushElement(new MarkAsHandledUndoRedoElement(this.resultTextModel.uri, new WeakRef(this), new WeakRef(existingState), input1Handled, input2Handled), group);
            }
            if (edit) {
                this.resultTextModel.pushStackElement();
                this.resultTextModelDiffs.applyEditRelativeToOriginal(edit, tx, group);
                this.resultTextModel.pushStackElement();
            }
            // always set conflict as handled
            existingState.handledInput1.set(true, tx);
            existingState.handledInput2.set(true, tx);
        }
        resetDirtyConflictsToBase() {
            (0, observable_1.transaction)(tx => {
                /** @description Reset Unknown Base Range States */
                this.resultTextModel.pushStackElement();
                for (const range of this.modifiedBaseRanges.get()) {
                    if (this.getState(range).get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized) {
                        this.setState(range, modifiedBaseRange_1.ModifiedBaseRangeState.base, false, tx, false);
                    }
                }
                this.resultTextModel.pushStackElement();
            });
        }
        isHandled(baseRange) {
            return this.modifiedBaseRangeResultStates.get().get(baseRange).handled;
        }
        isInputHandled(baseRange, inputNumber) {
            const state = this.modifiedBaseRangeResultStates.get().get(baseRange);
            return inputNumber === 1 ? state.handledInput1 : state.handledInput2;
        }
        setInputHandled(baseRange, inputNumber, handled, tx) {
            const state = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (state.handled.get() === handled) {
                return;
            }
            const dataRef = new WeakRef(ModifiedBaseRangeData);
            const modelRef = new WeakRef(this);
            this.undoRedoService.pushElement({
                type: 0 /* UndoRedoElementType.Resource */,
                resource: this.resultTextModel.uri,
                code: 'setInputHandled',
                label: (0, nls_1.localize)('setInputHandled', "Set Input Handled"),
                redo() {
                    const model = modelRef.deref();
                    const data = dataRef.deref();
                    if (model && !model.isDisposed() && data) {
                        (0, observable_1.transaction)(tx => {
                            if (inputNumber === 1) {
                                state.handledInput1.set(handled, tx);
                            }
                            else {
                                state.handledInput2.set(handled, tx);
                            }
                        });
                    }
                },
                undo() {
                    const model = modelRef.deref();
                    const data = dataRef.deref();
                    if (model && !model.isDisposed() && data) {
                        (0, observable_1.transaction)(tx => {
                            if (inputNumber === 1) {
                                state.handledInput1.set(!handled, tx);
                            }
                            else {
                                state.handledInput2.set(!handled, tx);
                            }
                        });
                    }
                },
            });
            if (inputNumber === 1) {
                state.handledInput1.set(handled, tx);
            }
            else {
                state.handledInput2.set(handled, tx);
            }
        }
        setHandled(baseRange, handled, tx) {
            const state = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (state.handled.get() === handled) {
                return;
            }
            state.handledInput1.set(handled, tx);
            state.handledInput2.set(handled, tx);
        }
        setLanguageId(languageId, source) {
            const language = this.languageService.createById(languageId);
            this.base.setLanguage(language, source);
            this.input1.textModel.setLanguage(language, source);
            this.input2.textModel.setLanguage(language, source);
            this.resultTextModel.setLanguage(language, source);
        }
        getInitialResultValue() {
            const chunks = [];
            while (true) {
                const chunk = this.resultSnapshot.read();
                if (chunk === null) {
                    break;
                }
                chunks.push(chunk);
            }
            return chunks.join();
        }
        async getResultValueWithConflictMarkers() {
            await (0, observable_1.waitForState)(this.diffComputingState, state => state === 2 /* MergeEditorModelState.upToDate */);
            if (this.unhandledConflictsCount.get() === 0) {
                return this.resultTextModel.getValue();
            }
            const resultLines = this.resultTextModel.getLinesContent();
            const input1Lines = this.input1.textModel.getLinesContent();
            const input2Lines = this.input2.textModel.getLinesContent();
            const states = this.modifiedBaseRangeResultStates.get();
            const outputLines = [];
            function appendLinesToResult(source, lineRange) {
                for (let i = lineRange.startLineNumber; i < lineRange.endLineNumberExclusive; i++) {
                    outputLines.push(source[i - 1]);
                }
            }
            let resultStartLineNumber = 1;
            for (const [range, state] of states) {
                if (state.handled.get()) {
                    continue;
                }
                const resultRange = this.resultTextModelDiffs.getResultLineRange(range.baseRange);
                appendLinesToResult(resultLines, lineRange_1.LineRange.fromLineNumbers(resultStartLineNumber, Math.max(resultStartLineNumber, resultRange.startLineNumber)));
                resultStartLineNumber = resultRange.endLineNumberExclusive;
                outputLines.push('<<<<<<<');
                if (state.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized) {
                    // to prevent loss of data, use modified result as "ours"
                    appendLinesToResult(resultLines, resultRange);
                }
                else {
                    appendLinesToResult(input1Lines, range.input1Range);
                }
                outputLines.push('=======');
                appendLinesToResult(input2Lines, range.input2Range);
                outputLines.push('>>>>>>>');
            }
            appendLinesToResult(resultLines, lineRange_1.LineRange.fromLineNumbers(resultStartLineNumber, resultLines.length + 1));
            return outputLines.join('\n');
        }
        get conflictCount() {
            return arrayCount(this.modifiedBaseRanges.get(), r => r.isConflicting);
        }
        get combinableConflictCount() {
            return arrayCount(this.modifiedBaseRanges.get(), r => r.isConflicting && r.canBeCombined);
        }
        get conflictsResolvedWithBase() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base);
        }
        get conflictsResolvedWithInput1() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input1);
        }
        get conflictsResolvedWithInput2() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input2);
        }
        get conflictsResolvedWithSmartCombination() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && state.smartCombination;
            });
        }
        get manuallySolvedConflictCountThatEqualNone() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized);
        }
        get manuallySolvedConflictCountThatEqualSmartCombine() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && s.computedFromDiffing && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && state.smartCombination;
            });
        }
        get manuallySolvedConflictCountThatEqualInput1() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && s.computedFromDiffing && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input1;
            });
        }
        get manuallySolvedConflictCountThatEqualInput2() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && s.computedFromDiffing && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input2;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithBase() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithInput1() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input1;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithInput2() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input2;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithBothNonSmart() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && !s.previousNonDiffingState?.smartCombination;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithBothSmart() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && s.previousNonDiffingState?.smartCombination;
            });
        }
    };
    exports.MergeEditorModel = MergeEditorModel;
    exports.MergeEditorModel = MergeEditorModel = __decorate([
        __param(7, language_1.ILanguageService),
        __param(8, undoRedo_1.IUndoRedoService)
    ], MergeEditorModel);
    function arrayCount(array, predicate) {
        let count = 0;
        for (const value of array) {
            if (predicate(value)) {
                count++;
            }
        }
        return count;
    }
    class ModifiedBaseRangeData {
        constructor(baseRange) {
            this.baseRange = baseRange;
            this.accepted = (0, observable_1.observableValue)(`BaseRangeState${this.baseRange.baseRange}`, modifiedBaseRange_1.ModifiedBaseRangeState.base);
            this.handledInput1 = (0, observable_1.observableValue)(`BaseRangeHandledState${this.baseRange.baseRange}.Input1`, false);
            this.handledInput2 = (0, observable_1.observableValue)(`BaseRangeHandledState${this.baseRange.baseRange}.Input2`, false);
            this.computedFromDiffing = false;
            this.previousNonDiffingState = undefined;
            this.handled = (0, observable_1.derived)(this, reader => this.handledInput1.read(reader) && this.handledInput2.read(reader));
        }
    }
    var MergeEditorModelState;
    (function (MergeEditorModelState) {
        MergeEditorModelState[MergeEditorModelState["initializing"] = 1] = "initializing";
        MergeEditorModelState[MergeEditorModelState["upToDate"] = 2] = "upToDate";
        MergeEditorModelState[MergeEditorModelState["updating"] = 3] = "updating";
    })(MergeEditorModelState || (exports.MergeEditorModelState = MergeEditorModelState = {}));
    class MarkAsHandledUndoRedoElement {
        constructor(resource, mergeEditorModelRef, stateRef, input1Handled, input2Handled) {
            this.resource = resource;
            this.mergeEditorModelRef = mergeEditorModelRef;
            this.stateRef = stateRef;
            this.input1Handled = input1Handled;
            this.input2Handled = input2Handled;
            this.code = 'undoMarkAsHandled';
            this.label = (0, nls_1.localize)('undoMarkAsHandled', 'Undo Mark As Handled');
            this.type = 0 /* UndoRedoElementType.Resource */;
        }
        redo() {
            const mergeEditorModel = this.mergeEditorModelRef.deref();
            if (!mergeEditorModel || mergeEditorModel.isDisposed()) {
                return;
            }
            const state = this.stateRef.deref();
            if (!state) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                state.handledInput1.set(true, tx);
                state.handledInput2.set(true, tx);
            });
        }
        undo() {
            const mergeEditorModel = this.mergeEditorModelRef.deref();
            if (!mergeEditorModel || mergeEditorModel.isDisposed()) {
                return;
            }
            const state = this.stateRef.deref();
            if (!state) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                state.handledInput1.set(this.input1Handled, tx);
                state.handledInput2.set(this.input2Handled, tx);
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvbW9kZWwvbWVyZ2VFZGl0b3JNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEseUJBQVc7UUFxQmhELFlBQ1UsSUFBZ0IsRUFDaEIsTUFBaUIsRUFDakIsTUFBaUIsRUFDakIsZUFBMkIsRUFDbkIsWUFBZ0MsRUFDaEMsT0FBaUMsRUFDbEMsU0FBK0IsRUFDN0IsZUFBa0QsRUFDbEQsZUFBa0Q7WUFFcEUsS0FBSyxFQUFFLENBQUM7WUFWQyxTQUFJLEdBQUosSUFBSSxDQUFZO1lBQ2hCLFdBQU0sR0FBTixNQUFNLENBQVc7WUFDakIsV0FBTSxHQUFOLE1BQU0sQ0FBVztZQUNqQixvQkFBZSxHQUFmLGVBQWUsQ0FBWTtZQUNuQixpQkFBWSxHQUFaLFlBQVksQ0FBb0I7WUFDaEMsWUFBTyxHQUFQLE9BQU8sQ0FBMEI7WUFDbEMsY0FBUyxHQUFULFNBQVMsQ0FBc0I7WUFDWixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDakMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBN0JwRCx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksK0JBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQy9HLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwrQkFBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FB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