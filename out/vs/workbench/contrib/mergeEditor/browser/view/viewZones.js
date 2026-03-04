/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/conflictActions", "vs/workbench/contrib/mergeEditor/browser/view/lineAlignment"], function (require, exports, dom_1, arrays_1, lineRange_1, utils_1, conflictActions_1, lineAlignment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorViewZone = exports.MergeEditorViewZones = exports.ViewZoneComputer = void 0;
    class ViewZoneComputer {
        constructor(input1Editor, input2Editor, resultEditor) {
            this.input1Editor = input1Editor;
            this.input2Editor = input2Editor;
            this.resultEditor = resultEditor;
            this.conflictActionsFactoryInput1 = new conflictActions_1.ConflictActionsFactory(this.input1Editor);
            this.conflictActionsFactoryInput2 = new conflictActions_1.ConflictActionsFactory(this.input2Editor);
            this.conflictActionsFactoryResult = new conflictActions_1.ConflictActionsFactory(this.resultEditor);
        }
        computeViewZones(reader, viewModel, options) {
            let input1LinesAdded = 0;
            let input2LinesAdded = 0;
            let baseLinesAdded = 0;
            let resultLinesAdded = 0;
            const input1ViewZones = [];
            const input2ViewZones = [];
            const baseViewZones = [];
            const resultViewZones = [];
            const model = viewModel.model;
            const resultDiffs = model.baseResultDiffs.read(reader);
            const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.join)(model.modifiedBaseRanges.read(reader), resultDiffs, (baseRange, diff) => baseRange.baseRange.touches(diff.inputRange)
                ? arrays_1.CompareResult.neitherLessOrGreaterThan
                : lineRange_1.LineRange.compareByStart(baseRange.baseRange, diff.inputRange));
            const shouldShowCodeLenses = options.codeLensesVisible;
            const showNonConflictingChanges = options.showNonConflictingChanges;
            let lastModifiedBaseRange = undefined;
            let lastBaseResultDiff = undefined;
            for (const m of baseRangeWithStoreAndTouchingDiffs) {
                if (shouldShowCodeLenses && m.left && (m.left.isConflicting || showNonConflictingChanges || !model.isHandled(m.left).read(reader))) {
                    const actions = new conflictActions_1.ActionsSource(viewModel, m.left);
                    if (options.shouldAlignResult || !actions.inputIsEmpty.read(reader)) {
                        input1ViewZones.push(new CommandViewZone(this.conflictActionsFactoryInput1, m.left.input1Range.startLineNumber - 1, actions.itemsInput1));
                        input2ViewZones.push(new CommandViewZone(this.conflictActionsFactoryInput2, m.left.input2Range.startLineNumber - 1, actions.itemsInput2));
                        if (options.shouldAlignBase) {
                            baseViewZones.push(new Placeholder(m.left.baseRange.startLineNumber - 1, 16));
                        }
                    }
                    const afterLineNumber = m.left.baseRange.startLineNumber + (lastBaseResultDiff?.resultingDeltaFromOriginalToModified ?? 0) - 1;
                    resultViewZones.push(new CommandViewZone(this.conflictActionsFactoryResult, afterLineNumber, actions.resultItems));
                }
                const lastResultDiff = (0, arrays_1.lastOrDefault)(m.rights);
                if (lastResultDiff) {
                    lastBaseResultDiff = lastResultDiff;
                }
                let alignedLines;
                if (m.left) {
                    alignedLines = (0, lineAlignment_1.getAlignments)(m.left).map(a => ({
                        input1Line: a[0],
                        baseLine: a[1],
                        input2Line: a[2],
                        resultLine: undefined,
                    }));
                    lastModifiedBaseRange = m.left;
                    // This is a total hack.
                    alignedLines[alignedLines.length - 1].resultLine =
                        m.left.baseRange.endLineNumberExclusive
                            + (lastBaseResultDiff ? lastBaseResultDiff.resultingDeltaFromOriginalToModified : 0);
                }
                else {
                    alignedLines = [{
                            baseLine: lastResultDiff.inputRange.endLineNumberExclusive,
                            input1Line: lastResultDiff.inputRange.endLineNumberExclusive + (lastModifiedBaseRange ? (lastModifiedBaseRange.input1Range.endLineNumberExclusive - lastModifiedBaseRange.baseRange.endLineNumberExclusive) : 0),
                            input2Line: lastResultDiff.inputRange.endLineNumberExclusive + (lastModifiedBaseRange ? (lastModifiedBaseRange.input2Range.endLineNumberExclusive - lastModifiedBaseRange.baseRange.endLineNumberExclusive) : 0),
                            resultLine: lastResultDiff.outputRange.endLineNumberExclusive,
                        }];
                }
                for (const { input1Line, baseLine, input2Line, resultLine } of alignedLines) {
                    if (!options.shouldAlignBase && (input1Line === undefined || input2Line === undefined)) {
                        continue;
                    }
                    const input1Line_ = input1Line !== undefined ? input1Line + input1LinesAdded : -1;
                    const input2Line_ = input2Line !== undefined ? input2Line + input2LinesAdded : -1;
                    const baseLine_ = baseLine + baseLinesAdded;
                    const resultLine_ = resultLine !== undefined ? resultLine + resultLinesAdded : -1;
                    const max = Math.max(options.shouldAlignBase ? baseLine_ : 0, input1Line_, input2Line_, options.shouldAlignResult ? resultLine_ : 0);
                    if (input1Line !== undefined) {
                        const diffInput1 = max - input1Line_;
                        if (diffInput1 > 0) {
                            input1ViewZones.push(new Spacer(input1Line - 1, diffInput1));
                            input1LinesAdded += diffInput1;
                        }
                    }
                    if (input2Line !== undefined) {
                        const diffInput2 = max - input2Line_;
                        if (diffInput2 > 0) {
                            input2ViewZones.push(new Spacer(input2Line - 1, diffInput2));
                            input2LinesAdded += diffInput2;
                        }
                    }
                    if (options.shouldAlignBase) {
                        const diffBase = max - baseLine_;
                        if (diffBase > 0) {
                            baseViewZones.push(new Spacer(baseLine - 1, diffBase));
                            baseLinesAdded += diffBase;
                        }
                    }
                    if (options.shouldAlignResult && resultLine !== undefined) {
                        const diffResult = max - resultLine_;
                        if (diffResult > 0) {
                            resultViewZones.push(new Spacer(resultLine - 1, diffResult));
                            resultLinesAdded += diffResult;
                        }
                    }
                }
            }
            return new MergeEditorViewZones(input1ViewZones, input2ViewZones, baseViewZones, resultViewZones);
        }
    }
    exports.ViewZoneComputer = ViewZoneComputer;
    class MergeEditorViewZones {
        constructor(input1ViewZones, input2ViewZones, baseViewZones, resultViewZones) {
            this.input1ViewZones = input1ViewZones;
            this.input2ViewZones = input2ViewZones;
            this.baseViewZones = baseViewZones;
            this.resultViewZones = resultViewZones;
        }
    }
    exports.MergeEditorViewZones = MergeEditorViewZones;
    /**
     * This is an abstract class to create various editor view zones.
    */
    class MergeEditorViewZone {
    }
    exports.MergeEditorViewZone = MergeEditorViewZone;
    class Spacer extends MergeEditorViewZone {
        constructor(afterLineNumber, heightInLines) {
            super();
            this.afterLineNumber = afterLineNumber;
            this.heightInLines = heightInLines;
        }
        create(viewZoneChangeAccessor, viewZoneIdsToCleanUp, disposableStore) {
            viewZoneIdsToCleanUp.push(viewZoneChangeAccessor.addZone({
                afterLineNumber: this.afterLineNumber,
                heightInLines: this.heightInLines,
                domNode: (0, dom_1.$)('div.diagonal-fill'),
            }));
        }
    }
    class Placeholder extends MergeEditorViewZone {
        constructor(afterLineNumber, heightPx) {
            super();
            this.afterLineNumber = afterLineNumber;
            this.heightPx = heightPx;
        }
        create(viewZoneChangeAccessor, viewZoneIdsToCleanUp, disposableStore) {
            viewZoneIdsToCleanUp.push(viewZoneChangeAccessor.addZone({
                afterLineNumber: this.afterLineNumber,
                heightInPx: this.heightPx,
                domNode: (0, dom_1.$)('div.conflict-actions-placeholder'),
            }));
        }
    }
    class CommandViewZone extends MergeEditorViewZone {
        constructor(conflictActionsFactory, lineNumber, items) {
            super();
            this.conflictActionsFactory = conflictActionsFactory;
            this.lineNumber = lineNumber;
            this.items = items;
        }
        create(viewZoneChangeAccessor, viewZoneIdsToCleanUp, disposableStore) {
            disposableStore.add(this.conflictActionsFactory.createWidget(viewZoneChangeAccessor, this.lineNumber, this.items, viewZoneIdsToCleanUp));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1pvbmVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci92aWV3L3ZpZXdab25lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxnQkFBZ0I7UUFLNUIsWUFDa0IsWUFBeUIsRUFDekIsWUFBeUIsRUFDekIsWUFBeUI7WUFGekIsaUJBQVksR0FBWixZQUFZLENBQWE7WUFDekIsaUJBQVksR0FBWixZQUFZLENBQWE7WUFDekIsaUJBQVksR0FBWixZQUFZLENBQWE7WUFQMUIsaUNBQTRCLEdBQUcsSUFBSSx3Q0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDN0UsaUNBQTRCLEdBQUcsSUFBSSx3Q0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDN0UsaUNBQTRCLEdBQUcsSUFBSSx3Q0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFNMUYsQ0FBQztRQUVFLGdCQUFnQixDQUN0QixNQUFlLEVBQ2YsU0FBK0IsRUFDL0IsT0FLQztZQUVELElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztZQUV6QixNQUFNLGVBQWUsR0FBMEIsRUFBRSxDQUFDO1lBQ2xELE1BQU0sZUFBZSxHQUEwQixFQUFFLENBQUM7WUFDbEQsTUFBTSxhQUFhLEdBQTBCLEVBQUUsQ0FBQztZQUNoRCxNQUFNLGVBQWUsR0FBMEIsRUFBRSxDQUFDO1lBRWxELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7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