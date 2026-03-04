/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/contrib/mergeEditor/browser/model/editing", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, arrays_1, errors_1, strings_1, position_1, range_1, editing_1, mapping_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputState = exports.ModifiedBaseRangeState = exports.ModifiedBaseRangeStateUnrecognized = exports.ModifiedBaseRangeStateBoth = exports.ModifiedBaseRangeStateInput2 = exports.ModifiedBaseRangeStateInput1 = exports.ModifiedBaseRangeStateBase = exports.AbstractModifiedBaseRangeState = exports.ModifiedBaseRangeStateKind = exports.ModifiedBaseRange = void 0;
    exports.getOtherInputNumber = getOtherInputNumber;
    /**
     * Describes modifications in input 1 and input 2 for a specific range in base.
     *
     * The UI offers a mechanism to either apply all changes from input 1 or input 2 or both.
     *
     * Immutable.
    */
    class ModifiedBaseRange {
        static fromDiffs(diffs1, diffs2, baseTextModel, input1TextModel, input2TextModel) {
            const alignments = mapping_1.MappingAlignment.compute(diffs1, diffs2);
            return alignments.map((a) => new ModifiedBaseRange(a.inputRange, baseTextModel, a.output1Range, input1TextModel, a.output1LineMappings, a.output2Range, input2TextModel, a.output2LineMappings));
        }
        constructor(baseRange, baseTextModel, input1Range, input1TextModel, 
        /**
         * From base to input1
        */
        input1Diffs, input2Range, input2TextModel, 
        /**
         * From base to input2
        */
        input2Diffs) {
            this.baseRange = baseRange;
            this.baseTextModel = baseTextModel;
            this.input1Range = input1Range;
            this.input1TextModel = input1TextModel;
            this.input1Diffs = input1Diffs;
            this.input2Range = input2Range;
            this.input2TextModel = input2TextModel;
            this.input2Diffs = input2Diffs;
            this.input1CombinedDiff = mapping_1.DetailedLineRangeMapping.join(this.input1Diffs);
            this.input2CombinedDiff = mapping_1.DetailedLineRangeMapping.join(this.input2Diffs);
            this.isEqualChange = (0, arrays_1.equals)(this.input1Diffs, this.input2Diffs, (a, b) => a.getLineEdit().equals(b.getLineEdit()));
            this.smartInput1LineRangeEdit = null;
            this.smartInput2LineRangeEdit = null;
            this.dumbInput1LineRangeEdit = null;
            this.dumbInput2LineRangeEdit = null;
            if (this.input1Diffs.length === 0 && this.input2Diffs.length === 0) {
                throw new errors_1.BugIndicatingError('must have at least one diff');
            }
        }
        getInputRange(inputNumber) {
            return inputNumber === 1 ? this.input1Range : this.input2Range;
        }
        getInputCombinedDiff(inputNumber) {
            return inputNumber === 1 ? this.input1CombinedDiff : this.input2CombinedDiff;
        }
        getInputDiffs(inputNumber) {
            return inputNumber === 1 ? this.input1Diffs : this.input2Diffs;
        }
        get isConflicting() {
            return this.input1Diffs.length > 0 && this.input2Diffs.length > 0;
        }
        get canBeCombined() {
            return this.smartCombineInputs(1) !== undefined;
        }
        get isOrderRelevant() {
            const input1 = this.smartCombineInputs(1);
            const input2 = this.smartCombineInputs(2);
            if (!input1 || !input2) {
                return false;
            }
            return !input1.equals(input2);
        }
        getEditForBase(state) {
            const diffs = [];
            if (state.includesInput1 && this.input1CombinedDiff) {
                diffs.push({ diff: this.input1CombinedDiff, inputNumber: 1 });
            }
            if (state.includesInput2 && this.input2CombinedDiff) {
                diffs.push({ diff: this.input2CombinedDiff, inputNumber: 2 });
            }
            if (diffs.length === 0) {
                return { edit: undefined, effectiveState: ModifiedBaseRangeState.base };
            }
            if (diffs.length === 1) {
                return { edit: diffs[0].diff.getLineEdit(), effectiveState: ModifiedBaseRangeState.base.withInputValue(diffs[0].inputNumber, true, false) };
            }
            if (state.kind !== ModifiedBaseRangeStateKind.both) {
                throw new errors_1.BugIndicatingError();
            }
            const smartCombinedEdit = state.smartCombination ? this.smartCombineInputs(state.firstInput) : this.dumbCombineInputs(state.firstInput);
            if (smartCombinedEdit) {
                return { edit: smartCombinedEdit, effectiveState: state };
            }
            return {
                edit: diffs[getOtherInputNumber(state.firstInput) - 1].diff.getLineEdit(),
                effectiveState: ModifiedBaseRangeState.base.withInputValue(getOtherInputNumber(state.firstInput), true, false),
            };
        }
        smartCombineInputs(firstInput) {
            if (firstInput === 1 && this.smartInput1LineRangeEdit !== null) {
                return this.smartInput1LineRangeEdit;
            }
            else if (firstInput === 2 && this.smartInput2LineRangeEdit !== null) {
                return this.smartInput2LineRangeEdit;
            }
            const combinedDiffs = (0, utils_1.concatArrays)(this.input1Diffs.flatMap((diffs) => diffs.rangeMappings.map((diff) => ({ diff, input: 1 }))), this.input2Diffs.flatMap((diffs) => diffs.rangeMappings.map((diff) => ({ diff, input: 2 })))).sort((0, arrays_1.tieBreakComparators)((0, arrays_1.compareBy)((d) => d.diff.inputRange, range_1.Range.compareRangesUsingStarts), (0, arrays_1.compareBy)((d) => (d.input === firstInput ? 1 : 2), arrays_1.numberComparator)));
            const sortedEdits = combinedDiffs.map(d => {
                const sourceTextModel = d.input === 1 ? this.input1TextModel : this.input2TextModel;
                return new editing_1.RangeEdit(d.diff.inputRange, sourceTextModel.getValueInRange(d.diff.outputRange));
            });
            const result = editsToLineRangeEdit(this.baseRange, sortedEdits, this.baseTextModel);
            if (firstInput === 1) {
                this.smartInput1LineRangeEdit = result;
            }
            else {
                this.smartInput2LineRangeEdit = result;
            }
            return result;
        }
        dumbCombineInputs(firstInput) {
            if (firstInput === 1 && this.dumbInput1LineRangeEdit !== null) {
                return this.dumbInput1LineRangeEdit;
            }
            else if (firstInput === 2 && this.dumbInput2LineRangeEdit !== null) {
                return this.dumbInput2LineRangeEdit;
            }
            let input1Lines = this.input1Range.getLines(this.input1TextModel);
            let input2Lines = this.input2Range.getLines(this.input2TextModel);
            if (firstInput === 2) {
                [input1Lines, input2Lines] = [input2Lines, input1Lines];
            }
            const result = new editing_1.LineRangeEdit(this.baseRange, input1Lines.concat(input2Lines));
            if (firstInput === 1) {
                this.dumbInput1LineRangeEdit = result;
            }
            else {
                this.dumbInput2LineRangeEdit = result;
            }
            return result;
        }
    }
    exports.ModifiedBaseRange = ModifiedBaseRange;
    function editsToLineRangeEdit(range, sortedEdits, textModel) {
        let text = '';
        const startsLineBefore = range.startLineNumber > 1;
        let currentPosition = startsLineBefore
            ? new position_1.Position(range.startLineNumber - 1, textModel.getLineMaxColumn(range.startLineNumber - 1))
            : new position_1.Position(range.startLineNumber, 1);
        for (const edit of sortedEdits) {
            const diffStart = edit.range.getStartPosition();
            if (!currentPosition.isBeforeOrEqual(diffStart)) {
                return undefined;
            }
            let originalText = textModel.getValueInRange(range_1.Range.fromPositions(currentPosition, diffStart));
            if (diffStart.lineNumber > textModel.getLineCount()) {
                // assert diffStart.lineNumber === textModel.getLineCount() + 1
                // getValueInRange doesn't include this virtual line break, as the document ends the line before.
                // endsLineAfter will be false.
                originalText += '\n';
            }
            text += originalText;
            text += edit.newText;
            currentPosition = edit.range.getEndPosition();
        }
        const endsLineAfter = range.endLineNumberExclusive <= textModel.getLineCount();
        const end = endsLineAfter ? new position_1.Position(range.endLineNumberExclusive, 1) : new position_1.Position(range.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        const originalText = textModel.getValueInRange(range_1.Range.fromPositions(currentPosition, end));
        text += originalText;
        const lines = (0, strings_1.splitLines)(text);
        if (startsLineBefore) {
            if (lines[0] !== '') {
                return undefined;
            }
            lines.shift();
        }
        if (endsLineAfter) {
            if (lines[lines.length - 1] !== '') {
                return undefined;
            }
            lines.pop();
        }
        return new editing_1.LineRangeEdit(range, lines);
    }
    var ModifiedBaseRangeStateKind;
    (function (ModifiedBaseRangeStateKind) {
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["base"] = 0] = "base";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["input1"] = 1] = "input1";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["input2"] = 2] = "input2";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["both"] = 3] = "both";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["unrecognized"] = 4] = "unrecognized";
    })(ModifiedBaseRangeStateKind || (exports.ModifiedBaseRangeStateKind = ModifiedBaseRangeStateKind = {}));
    function getOtherInputNumber(inputNumber) {
        return inputNumber === 1 ? 2 : 1;
    }
    class AbstractModifiedBaseRangeState {
        constructor() { }
        get includesInput1() { return false; }
        get includesInput2() { return false; }
        includesInput(inputNumber) {
            return inputNumber === 1 ? this.includesInput1 : this.includesInput2;
        }
        isInputIncluded(inputNumber) {
            return inputNumber === 1 ? this.includesInput1 : this.includesInput2;
        }
        toggle(inputNumber) {
            return this.withInputValue(inputNumber, !this.includesInput(inputNumber), true);
        }
        getInput(inputNumber) {
            if (!this.isInputIncluded(inputNumber)) {
                return 0 /* InputState.excluded */;
            }
            return 1 /* InputState.first */;
        }
    }
    exports.AbstractModifiedBaseRangeState = AbstractModifiedBaseRangeState;
    class ModifiedBaseRangeStateBase extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.base; }
        toString() { return 'base'; }
        swap() { return this; }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (inputNumber === 1) {
                return value ? new ModifiedBaseRangeStateInput1() : this;
            }
            else {
                return value ? new ModifiedBaseRangeStateInput2() : this;
            }
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.base;
        }
    }
    exports.ModifiedBaseRangeStateBase = ModifiedBaseRangeStateBase;
    class ModifiedBaseRangeStateInput1 extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.input1; }
        get includesInput1() { return true; }
        toString() { return '1✓'; }
        swap() { return new ModifiedBaseRangeStateInput2(); }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (inputNumber === 1) {
                return value ? this : new ModifiedBaseRangeStateBase();
            }
            else {
                return value ? new ModifiedBaseRangeStateBoth(1, smartCombination) : new ModifiedBaseRangeStateInput2();
            }
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.input1;
        }
    }
    exports.ModifiedBaseRangeStateInput1 = ModifiedBaseRangeStateInput1;
    class ModifiedBaseRangeStateInput2 extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.input2; }
        get includesInput2() { return true; }
        toString() { return '2✓'; }
        swap() { return new ModifiedBaseRangeStateInput1(); }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (inputNumber === 2) {
                return value ? this : new ModifiedBaseRangeStateBase();
            }
            else {
                return value ? new ModifiedBaseRangeStateBoth(2, smartCombination) : new ModifiedBaseRangeStateInput2();
            }
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.input2;
        }
    }
    exports.ModifiedBaseRangeStateInput2 = ModifiedBaseRangeStateInput2;
    class ModifiedBaseRangeStateBoth extends AbstractModifiedBaseRangeState {
        constructor(firstInput, smartCombination) {
            super();
            this.firstInput = firstInput;
            this.smartCombination = smartCombination;
        }
        get kind() { return ModifiedBaseRangeStateKind.both; }
        get includesInput1() { return true; }
        get includesInput2() { return true; }
        toString() {
            return '2✓';
        }
        swap() { return new ModifiedBaseRangeStateBoth(getOtherInputNumber(this.firstInput), this.smartCombination); }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (value) {
                return this;
            }
            return inputNumber === 1 ? new ModifiedBaseRangeStateInput2() : new ModifiedBaseRangeStateInput1();
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.both && this.firstInput === other.firstInput && this.smartCombination === other.smartCombination;
        }
        getInput(inputNumber) {
            return inputNumber === this.firstInput ? 1 /* InputState.first */ : 2 /* InputState.second */;
        }
    }
    exports.ModifiedBaseRangeStateBoth = ModifiedBaseRangeStateBoth;
    class ModifiedBaseRangeStateUnrecognized extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.unrecognized; }
        toString() { return 'unrecognized'; }
        swap() { return this; }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (!value) {
                return this;
            }
            return inputNumber === 1 ? new ModifiedBaseRangeStateInput1() : new ModifiedBaseRangeStateInput2();
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.unrecognized;
        }
    }
    exports.ModifiedBaseRangeStateUnrecognized = ModifiedBaseRangeStateUnrecognized;
    var ModifiedBaseRangeState;
    (function (ModifiedBaseRangeState) {
        ModifiedBaseRangeState.base = new ModifiedBaseRangeStateBase();
        ModifiedBaseRangeState.unrecognized = new ModifiedBaseRangeStateUnrecognized();
    })(ModifiedBaseRangeState || (exports.ModifiedBaseRangeState = ModifiedBaseRangeState = {}));
    var InputState;
    (function (InputState) {
        InputState[InputState["excluded"] = 0] = "excluded";
        InputState[InputState["first"] = 1] = "first";
        InputState[InputState["second"] = 2] = "second";
        InputState[InputState["unrecognized"] = 3] = "unrecognized";
    })(InputState || (exports.InputState = InputState = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZpZWRCYXNlUmFuZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21vZGVsL21vZGlmaWVkQmFzZVJhbmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVRaEcsa0RBRUM7SUEzUEQ7Ozs7OztNQU1FO0lBQ0YsTUFBYSxpQkFBaUI7UUFDdEIsTUFBTSxDQUFDLFNBQVMsQ0FDdEIsTUFBMkMsRUFDM0MsTUFBMkMsRUFDM0MsYUFBeUIsRUFDekIsZUFBMkIsRUFDM0IsZUFBMkI7WUFFM0IsTUFBTSxVQUFVLEdBQUcsMEJBQWdCLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1RCxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQ3BCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLGlCQUFpQixDQUMzQixDQUFDLENBQUMsVUFBVSxFQUNaLGFBQWEsRUFDYixDQUFDLENBQUMsWUFBWSxFQUNkLGVBQWUsRUFDZixDQUFDLENBQUMsbUJBQW1CLEVBQ3JCLENBQUMsQ0FBQyxZQUFZLEVBQ2QsZUFBZSxFQUNmLENBQUMsQ0FBQyxtQkFBbUIsQ0FDckIsQ0FDRCxDQUFDO1FBQ0gsQ0FBQztRQU1ELFlBQ2lCLFNBQW9CLEVBQ3BCLGFBQXlCLEVBQ3pCLFdBQXNCLEVBQ3RCLGVBQTJCO1FBRTNDOztVQUVFO1FBQ2MsV0FBZ0QsRUFDaEQsV0FBc0IsRUFDdEIsZUFBMkI7UUFFM0M7O1VBRUU7UUFDYyxXQUFnRDtZQWZoRCxjQUFTLEdBQVQsU0FBUyxDQUFXO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUFZO1lBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFXO1lBQ3RCLG9CQUFlLEdBQWYsZUFBZSxDQUFZO1lB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