/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/editing", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "../../../../../base/common/controlFlow", "vs/base/common/observable"], function (require, exports, arrays_1, errors_1, lifecycle_1, mapping_1, editing_1, lineRange_1, controlFlow_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelDiffState = exports.TextModelDiffChangeReason = exports.TextModelDiffs = void 0;
    class TextModelDiffs extends lifecycle_1.Disposable {
        get isApplyingChange() {
            return this._barrier.isOccupied;
        }
        constructor(baseTextModel, textModel, diffComputer) {
            super();
            this.baseTextModel = baseTextModel;
            this.textModel = textModel;
            this.diffComputer = diffComputer;
            this._recomputeCount = 0;
            this._state = (0, observable_1.observableValue)(this, 1 /* TextModelDiffState.initializing */);
            this._diffs = (0, observable_1.observableValue)(this, []);
            this._barrier = new controlFlow_1.ReentrancyBarrier();
            this._isDisposed = false;
            this._isInitializing = true;
            const recomputeSignal = (0, observable_1.observableSignal)('recompute');
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update diff state */
                recomputeSignal.read(reader);
                this._recompute(reader);
            }));
            this._register(baseTextModel.onDidChangeContent(this._barrier.makeExclusiveOrSkip(() => {
                recomputeSignal.trigger(undefined);
            })));
            this._register(textModel.onDidChangeContent(this._barrier.makeExclusiveOrSkip(() => {
                recomputeSignal.trigger(undefined);
            })));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._isDisposed = true;
            }));
        }
        get state() {
            return this._state;
        }
        /**
         * Diffs from base to input.
        */
        get diffs() {
            return this._diffs;
        }
        _recompute(reader) {
            this._recomputeCount++;
            const currentRecomputeIdx = this._recomputeCount;
            if (this._state.get() === 1 /* TextModelDiffState.initializing */) {
                this._isInitializing = true;
            }
            (0, observable_1.transaction)(tx => {
                /** @description Starting Diff Computation. */
                this._state.set(this._isInitializing ? 1 /* TextModelDiffState.initializing */ : 3 /* TextModelDiffState.updating */, tx, 0 /* TextModelDiffChangeReason.other */);
            });
            const result = this.diffComputer.computeDiff(this.baseTextModel, this.textModel, reader);
            result.then((result) => {
                if (this._isDisposed) {
                    return;
                }
                if (currentRecomputeIdx !== this._recomputeCount) {
                    // There is a newer recompute call
                    return;
                }
                (0, observable_1.transaction)(tx => {
                    /** @description Completed Diff Computation */
                    if (result.diffs) {
                        this._state.set(2 /* TextModelDiffState.upToDate */, tx, 1 /* TextModelDiffChangeReason.textChange */);
                        this._diffs.set(result.diffs, tx, 1 /* TextModelDiffChangeReason.textChange */);
                    }
                    else {
                        this._state.set(4 /* TextModelDiffState.error */, tx, 1 /* TextModelDiffChangeReason.textChange */);
                    }
                    this._isInitializing = false;
                });
            });
        }
        ensureUpToDate() {
            if (this.state.get() !== 2 /* TextModelDiffState.upToDate */) {
                throw new errors_1.BugIndicatingError('Cannot remove diffs when the model is not up to date');
            }
        }
        removeDiffs(diffToRemoves, transaction, group) {
            this.ensureUpToDate();
            diffToRemoves.sort((0, arrays_1.compareBy)((d) => d.inputRange.startLineNumber, arrays_1.numberComparator));
            diffToRemoves.reverse();
            let diffs = this._diffs.get();
            for (const diffToRemove of diffToRemoves) {
                // TODO improve performance
                const len = diffs.length;
                diffs = diffs.filter((d) => d !== diffToRemove);
                if (len === diffs.length) {
                    throw new errors_1.BugIndicatingError();
                }
                this._barrier.runExclusivelyOrThrow(() => {
                    const edits = diffToRemove.getReverseLineEdit().toEdits(this.textModel.getLineCount());
                    this.textModel.pushEditOperations(null, edits, () => null, group);
                });
                diffs = diffs.map((d) => d.outputRange.isAfter(diffToRemove.outputRange)
                    ? d.addOutputLineDelta(diffToRemove.inputRange.lineCount - diffToRemove.outputRange.lineCount)
                    : d);
            }
            this._diffs.set(diffs, transaction, 0 /* TextModelDiffChangeReason.other */);
        }
        /**
         * Edit must be conflict free.
         */
        applyEditRelativeToOriginal(edit, transaction, group) {
            this.ensureUpToDate();
            const editMapping = new mapping_1.DetailedLineRangeMapping(edit.range, this.baseTextModel, new lineRange_1.LineRange(edit.range.startLineNumber, edit.newLines.length), this.textModel);
            let firstAfter = false;
            let delta = 0;
            const newDiffs = new Array();
            for (const diff of this.diffs.get()) {
                if (diff.inputRange.touches(edit.range)) {
                    throw new errors_1.BugIndicatingError('Edit must be conflict free.');
                }
                else if (diff.inputRange.isAfter(edit.range)) {
                    if (!firstAfter) {
                        firstAfter = true;
                        newDiffs.push(editMapping.addOutputLineDelta(delta));
                    }
                    newDiffs.push(diff.addOutputLineDelta(edit.newLines.length - edit.range.lineCount));
                }
                else {
                    newDiffs.push(diff);
                }
                if (!firstAfter) {
                    delta += diff.outputRange.lineCount - diff.inputRange.lineCount;
                }
            }
            if (!firstAfter) {
                firstAfter = true;
                newDiffs.push(editMapping.addOutputLineDelta(delta));
            }
            this._barrier.runExclusivelyOrThrow(() => {
                const edits = new editing_1.LineRangeEdit(edit.range.delta(delta), edit.newLines).toEdits(this.textModel.getLineCount());
                this.textModel.pushEditOperations(null, edits, () => null, group);
            });
            this._diffs.set(newDiffs, transaction, 0 /* TextModelDiffChangeReason.other */);
        }
        findTouchingDiffs(baseRange) {
            return this.diffs.get().filter(d => d.inputRange.touches(baseRange));
        }
        getResultLine(lineNumber, reader) {
            let offset = 0;
            const diffs = reader ? this.diffs.read(reader) : this.diffs.get();
            for (const diff of diffs) {
                if (diff.inputRange.contains(lineNumber) || diff.inputRange.endLineNumberExclusive === lineNumber) {
                    return diff;
                }
                else if (diff.inputRange.endLineNumberExclusive < lineNumber) {
                    offset = diff.resultingDeltaFromOriginalToModified;
                }
                else {
                    break;
                }
            }
            return lineNumber + offset;
        }
        getResultLineRange(baseRange, reader) {
            let start = this.getResultLine(baseRange.startLineNumber, reader);
            if (typeof start !== 'number') {
                start = start.outputRange.startLineNumber;
            }
            let endExclusive = this.getResultLine(baseRange.endLineNumberExclusive, reader);
            if (typeof endExclusive !== 'number') {
                endExclusive = endExclusive.outputRange.endLineNumberExclusive;
            }
            return lineRange_1.LineRange.fromLineNumbers(start, endExclusive);
        }
    }
    exports.TextModelDiffs = TextModelDiffs;
    var TextModelDiffChangeReason;
    (function (TextModelDiffChangeReason) {
        TextModelDiffChangeReason[TextModelDiffChangeReason["other"] = 0] = "other";
        TextModelDiffChangeReason[TextModelDiffChangeReason["textChange"] = 1] = "textChange";
    })(TextModelDiffChangeReason || (exports.TextModelDiffChangeReason = TextModelDiffChangeReason = {}));
    var TextModelDiffState;
    (function (TextModelDiffState) {
        TextModelDiffState[TextModelDiffState["initializing"] = 1] = "initializing";
        TextModelDiffState[TextModelDiffState["upToDate"] = 2] = "upToDate";
        TextModelDiffState[TextModelDiffState["updating"] = 3] = "updating";
        TextModelDiffState[TextModelDiffState["error"] = 4] = "error";
    })(TextModelDiffState || (exports.TextModelDiffState = TextModelDiffState = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsRGlmZnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21vZGVsL3RleHRNb2RlbERpZmZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLGNBQWUsU0FBUSxzQkFBVTtRQVE3QyxJQUFXLGdCQUFnQjtZQUMxQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQ2pDLENBQUM7UUFFRCxZQUNrQixhQUF5QixFQUN6QixTQUFxQixFQUNyQixZQUFnQztZQUVqRCxLQUFLLEVBQUUsQ0FBQztZQUpTLGtCQUFhLEdBQWIsYUFBYSxDQUFZO1lBQ3pCLGNBQVMsR0FBVCxTQUFTLENBQVk7WUFDckIsaUJBQVksR0FBWixZQUFZLENBQW9CO1lBZDFDLG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsV0FBTSxHQUFHLElBQUEsNEJBQWUsRUFBZ0QsSUFBSSwwQ0FBa0MsQ0FBQztZQUMvRyxXQUFNLEdBQUcsSUFBQSw0QkFBZSxFQUF3RCxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFMUYsYUFBUSxHQUFHLElBQUksK0JBQWlCLEVBQUUsQ0FBQztZQUM1QyxnQkFBVyxHQUFHLEtBQUssQ0FBQztZQW1EcEIsb0JBQWUsR0FBRyxJQUFJLENBQUM7WUF0QzlCLE1BQU0sZUFBZSxHQUFHLElBQUEsNkJBQWdCLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFFdEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFPLEVBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLHFDQUFxQztnQkFDckMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFN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