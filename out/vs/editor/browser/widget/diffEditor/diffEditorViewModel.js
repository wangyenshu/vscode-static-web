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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/diffProviderFactoryService", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/lineRange", "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer", "vs/editor/common/diff/rangeMapping", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos", "vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations", "vs/base/common/types", "vs/base/common/arrays", "vs/base/common/assert"], function (require, exports, async_1, cancellation_1, lifecycle_1, observable_1, diffProviderFactoryService_1, utils_1, lineRange_1, defaultLinesDiffComputer_1, rangeMapping_1, beforeEditPositionMapper_1, combineTextEditInfos_1, heuristicSequenceOptimizations_1, types_1, arrays_1, assert_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RevealPreference = exports.UnchangedRegion = exports.DiffMapping = exports.DiffState = exports.DiffEditorViewModel = void 0;
    let DiffEditorViewModel = class DiffEditorViewModel extends lifecycle_1.Disposable {
        setActiveMovedText(movedText) {
            this._activeMovedText.set(movedText, undefined);
        }
        setHoveredMovedText(movedText) {
            this._hoveredMovedText.set(movedText, undefined);
        }
        constructor(model, _options, _diffProviderFactoryService) {
            super();
            this.model = model;
            this._options = _options;
            this._diffProviderFactoryService = _diffProviderFactoryService;
            this._isDiffUpToDate = (0, observable_1.observableValue)(this, false);
            this.isDiffUpToDate = this._isDiffUpToDate;
            this._diff = (0, observable_1.observableValue)(this, undefined);
            this.diff = this._diff;
            this._unchangedRegions = (0, observable_1.observableValue)(this, undefined);
            this.unchangedRegions = (0, observable_1.derived)(this, r => {
                if (this._options.hideUnchangedRegions.read(r)) {
                    return this._unchangedRegions.read(r)?.regions ?? [];
                }
                else {
                    // Reset state
                    (0, observable_1.transaction)(tx => {
                        for (const r of this._unchangedRegions.get()?.regions || []) {
                            r.collapseAll(tx);
                        }
                    });
                    return [];
                }
            });
            this.movedTextToCompare = (0, observable_1.observableValue)(this, undefined);
            this._activeMovedText = (0, observable_1.observableValue)(this, undefined);
            this._hoveredMovedText = (0, observable_1.observableValue)(this, undefined);
            this.activeMovedText = (0, observable_1.derived)(this, r => this.movedTextToCompare.read(r) ?? this._hoveredMovedText.read(r) ?? this._activeMovedText.read(r));
            this._cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._diffProvider = (0, observable_1.derived)(this, reader => {
                const diffProvider = this._diffProviderFactoryService.createDiffProvider({
                    diffAlgorithm: this._options.diffAlgorithm.read(reader)
                });
                const onChangeSignal = (0, observable_1.observableSignalFromEvent)('onDidChange', diffProvider.onDidChange);
                return {
                    diffProvider,
                    onChangeSignal,
                };
            });
            this._register((0, lifecycle_1.toDisposable)(() => this._cancellationTokenSource.cancel()));
            const contentChangedSignal = (0, observable_1.observableSignal)('contentChangedSignal');
            const debouncer = this._register(new async_1.RunOnceScheduler(() => contentChangedSignal.trigger(undefined), 200));
            this._register((0, observable_1.autorun)(reader => {
                /** @description collapse touching unchanged ranges */
                const lastUnchangedRegions = this._unchangedRegions.read(reader);
                if (!lastUnchangedRegions || lastUnchangedRegions.regions.some(r => r.isDragged.read(reader))) {
                    return;
                }
                const lastUnchangedRegionsOrigRanges = lastUnchangedRegions.originalDecorationIds
                    .map(id => model.original.getDecorationRange(id))
                    .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                const lastUnchangedRegionsModRanges = lastUnchangedRegions.modifiedDecorationIds
                    .map(id => model.modified.getDecorationRange(id))
                    .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                const updatedLastUnchangedRegions = lastUnchangedRegions.regions.map((r, idx) => (!lastUnchangedRegionsOrigRanges[idx] || !lastUnchangedRegionsModRanges[idx]) ? undefined :
                    new UnchangedRegion(lastUnchangedRegionsOrigRanges[idx].startLineNumber, lastUnchangedRegionsModRanges[idx].startLineNumber, lastUnchangedRegionsOrigRanges[idx].length, r.visibleLineCountTop.read(reader), r.visibleLineCountBottom.read(reader))).filter(types_1.isDefined);
                const newRanges = [];
                let didChange = false;
                for (const touching of (0, arrays_1.groupAdjacentBy)(updatedLastUnchangedRegions, (a, b) => a.getHiddenModifiedRange(reader).endLineNumberExclusive === b.getHiddenModifiedRange(reader).startLineNumber)) {
                    if (touching.length > 1) {
                        didChange = true;
                        const sumLineCount = touching.reduce((sum, r) => sum + r.lineCount, 0);
                        const r = new UnchangedRegion(touching[0].originalLineNumber, touching[0].modifiedLineNumber, sumLineCount, touching[0].visibleLineCountTop.get(), touching[touching.length - 1].visibleLineCountBottom.get());
                        newRanges.push(r);
                    }
                    else {
                        newRanges.push(touching[0]);
                    }
                }
                if (didChange) {
                    const originalDecorationIds = model.original.deltaDecorations(lastUnchangedRegions.originalDecorationIds, newRanges.map(r => ({ range: r.originalUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                    const modifiedDecorationIds = model.modified.deltaDecorations(lastUnchangedRegions.modifiedDecorationIds, newRanges.map(r => ({ range: r.modifiedUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                    (0, observable_1.transaction)(tx => {
                        this._unchangedRegions.set({
                            regions: newRanges,
                            originalDecorationIds,
                            modifiedDecorationIds
                        }, tx);
                    });
                }
            }));
            const updateUnchangedRegions = (result, tx, reader) => {
                const newUnchangedRegions = UnchangedRegion.fromDiffs(result.changes, model.original.getLineCount(), model.modified.getLineCount(), this._options.hideUnchangedRegionsMinimumLineCount.read(reader), this._options.hideUnchangedRegionsContextLineCount.read(reader));
                // Transfer state from cur state
                let visibleRegions = undefined;
                const lastUnchangedRegions = this._unchangedRegions.get();
                if (lastUnchangedRegions) {
                    const lastUnchangedRegionsOrigRanges = lastUnchangedRegions.originalDecorationIds
                        .map(id => model.original.getDecorationRange(id))
                        .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                    const lastUnchangedRegionsModRanges = lastUnchangedRegions.modifiedDecorationIds
                        .map(id => model.modified.getDecorationRange(id))
                        .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                    const updatedLastUnchangedRegions = (0, utils_1.filterWithPrevious)(lastUnchangedRegions.regions
                        .map((r, idx) => {
                        if (!lastUnchangedRegionsOrigRanges[idx] || !lastUnchangedRegionsModRanges[idx]) {
                            return undefined;
                        }
                        const length = lastUnchangedRegionsOrigRanges[idx].length;
                        return new UnchangedRegion(lastUnchangedRegionsOrigRanges[idx].startLineNumber, lastUnchangedRegionsModRanges[idx].startLineNumber, length, 
                        // The visible area can shrink by edits -> we have to account for this
                        Math.min(r.visibleLineCountTop.get(), length), Math.min(r.visibleLineCountBottom.get(), length - r.visibleLineCountTop.get()));
                    }).filter(types_1.isDefined), (cur, prev) => !prev || (cur.modifiedLineNumber >= prev.modifiedLineNumber + prev.lineCount && cur.originalLineNumber >= prev.originalLineNumber + prev.lineCount));
                    let hiddenRegions = updatedLastUnchangedRegions.map(r => new rangeMapping_1.LineRangeMapping(r.getHiddenOriginalRange(reader), r.getHiddenModifiedRange(reader)));
                    hiddenRegions = rangeMapping_1.LineRangeMapping.clip(hiddenRegions, lineRange_1.LineRange.ofLength(1, model.original.getLineCount()), lineRange_1.LineRange.ofLength(1, model.modified.getLineCount()));
                    visibleRegions = rangeMapping_1.LineRangeMapping.inverse(hiddenRegions, model.original.getLineCount(), model.modified.getLineCount());
                }
                const newUnchangedRegions2 = [];
                if (visibleRegions) {
                    for (const r of newUnchangedRegions) {
                        const intersecting = visibleRegions.filter(f => f.original.intersectsStrict(r.originalUnchangedRange) && f.modified.intersectsStrict(r.modifiedUnchangedRange));
                        newUnchangedRegions2.push(...r.setVisibleRanges(intersecting, tx));
                    }
                }
                else {
                    newUnchangedRegions2.push(...newUnchangedRegions);
                }
                const originalDecorationIds = model.original.deltaDecorations(lastUnchangedRegions?.originalDecorationIds || [], newUnchangedRegions2.map(r => ({ range: r.originalUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                const modifiedDecorationIds = model.modified.deltaDecorations(lastUnchangedRegions?.modifiedDecorationIds || [], newUnchangedRegions2.map(r => ({ range: r.modifiedUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                this._unchangedRegions.set({
                    regions: newUnchangedRegions2,
                    originalDecorationIds,
                    modifiedDecorationIds
                }, tx);
            };
            this._register(model.modified.onDidChangeContent((e) => {
                const diff = this._diff.get();
                if (diff) {
                    const textEdits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    const result = applyModifiedEdits(this._lastDiff, textEdits, model.original, model.modified);
                    if (result) {
                        this._lastDiff = result;
                        (0, observable_1.transaction)(tx => {
                            this._diff.set(DiffState.fromDiffResult(this._lastDiff), tx);
                            updateUnchangedRegions(result, tx);
                            const currentSyncedMovedText = this.movedTextToCompare.get();
                            this.movedTextToCompare.set(currentSyncedMovedText ? this._lastDiff.moves.find(m => m.lineRangeMapping.modified.intersect(currentSyncedMovedText.lineRangeMapping.modified)) : undefined, tx);
                        });
                    }
                }
                this._isDiffUpToDate.set(false, undefined);
                debouncer.schedule();
            }));
            this._register(model.original.onDidChangeContent((e) => {
                const diff = this._diff.get();
                if (diff) {
                    const textEdits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    const result = applyOriginalEdits(this._lastDiff, textEdits, model.original, model.modified);
                    if (result) {
                        this._lastDiff = result;
                        (0, observable_1.transaction)(tx => {
                            this._diff.set(DiffState.fromDiffResult(this._lastDiff), tx);
                            updateUnchangedRegions(result, tx);
                            const currentSyncedMovedText = this.movedTextToCompare.get();
                            this.movedTextToCompare.set(currentSyncedMovedText ? this._lastDiff.moves.find(m => m.lineRangeMapping.modified.intersect(currentSyncedMovedText.lineRangeMapping.modified)) : undefined, tx);
                        });
                    }
                }
                this._isDiffUpToDate.set(false, undefined);
                debouncer.schedule();
            }));
            this._register((0, observable_1.autorunWithStore)(async (reader, store) => {
                /** @description compute diff */
                // So that they get recomputed when these settings change
                this._options.hideUnchangedRegionsMinimumLineCount.read(reader);
                this._options.hideUnchangedRegionsContextLineCount.read(reader);
                debouncer.cancel();
                contentChangedSignal.read(reader);
                const documentDiffProvider = this._diffProvider.read(reader);
                documentDiffProvider.onChangeSignal.read(reader);
                (0, utils_1.readHotReloadableExport)(defaultLinesDiffComputer_1.DefaultLinesDiffComputer, reader);
                (0, utils_1.readHotReloadableExport)(heuristicSequenceOptimizations_1.optimizeSequenceDiffs, reader);
                this._isDiffUpToDate.set(false, undefined);
                let originalTextEditInfos = [];
                store.add(model.original.onDidChangeContent((e) => {
                    const edits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    originalTextEditInfos = (0, combineTextEditInfos_1.combineTextEditInfos)(originalTextEditInfos, edits);
                }));
                let modifiedTextEditInfos = [];
                store.add(model.modified.onDidChangeContent((e) => {
                    const edits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    modifiedTextEditInfos = (0, combineTextEditInfos_1.combineTextEditInfos)(modifiedTextEditInfos, edits);
                }));
                let result = await documentDiffProvider.diffProvider.computeDiff(model.original, model.modified, {
                    ignoreTrimWhitespace: this._options.ignoreTrimWhitespace.read(reader),
                    maxComputationTimeMs: this._options.maxComputationTimeMs.read(reader),
                    computeMoves: this._options.showMoves.read(reader),
                }, this._cancellationTokenSource.token);
                if (this._cancellationTokenSource.token.isCancellationRequested) {
                    return;
                }
                if (model.original.isDisposed() || model.modified.isDisposed()) {
                    // TODO@hediet fishy?
                    return;
                }
                result = normalizeDocumentDiff(result, model.original, model.modified);
                result = applyOriginalEdits(result, originalTextEditInfos, model.original, model.modified) ?? result;
                result = applyModifiedEdits(result, modifiedTextEditInfos, model.original, model.modified) ?? result;
                (0, observable_1.transaction)(tx => {
                    /** @description write diff result */
                    updateUnchangedRegions(result, tx);
                    this._lastDiff = result;
                    const state = DiffState.fromDiffResult(result);
                    this._diff.set(state, tx);
                    this._isDiffUpToDate.set(true, tx);
                    const currentSyncedMovedText = this.movedTextToCompare.get();
                    this.movedTextToCompare.set(currentSyncedMovedText ? this._lastDiff.moves.find(m => m.lineRangeMapping.modified.intersect(currentSyncedMovedText.lineRangeMapping.modified)) : undefined, tx);
                });
            }));
        }
        ensureModifiedLineIsVisible(lineNumber, preference, tx) {
            if (this.diff.get()?.mappings.length === 0) {
                return;
            }
            const unchangedRegions = this._unchangedRegions.get()?.regions || [];
            for (const r of unchangedRegions) {
                if (r.getHiddenModifiedRange(undefined).contains(lineNumber)) {
                    r.showModifiedLine(lineNumber, preference, tx);
                    return;
                }
            }
        }
        ensureOriginalLineIsVisible(lineNumber, preference, tx) {
            if (this.diff.get()?.mappings.length === 0) {
                return;
            }
            const unchangedRegions = this._unchangedRegions.get()?.regions || [];
            for (const r of unchangedRegions) {
                if (r.getHiddenOriginalRange(undefined).contains(lineNumber)) {
                    r.showOriginalLine(lineNumber, preference, tx);
                    return;
                }
            }
        }
        async waitForDiff() {
            await (0, observable_1.waitForState)(this.isDiffUpToDate, s => s);
        }
        serializeState() {
            const regions = this._unchangedRegions.get();
            return {
                collapsedRegions: regions?.regions.map(r => ({ range: r.getHiddenModifiedRange(undefined).serialize() }))
            };
        }
        restoreSerializedState(state) {
            const ranges = state.collapsedRegions?.map(r => lineRange_1.LineRange.deserialize(r.range));
            const regions = this._unchangedRegions.get();
            if (!regions || !ranges) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                for (const r of regions.regions) {
                    for (const range of ranges) {
                        if (r.modifiedUnchangedRange.intersect(range)) {
                            r.setHiddenModifiedRange(range, tx);
                            break;
                        }
                    }
                }
            });
        }
    };
    exports.DiffEditorViewModel = DiffEditorViewModel;
    exports.DiffEditorViewModel = DiffEditorViewModel = __decorate([
        __param(2, diffProviderFactoryService_1.IDiffProviderFactoryService)
    ], DiffEditorViewModel);
    function normalizeDocumentDiff(diff, original, modified) {
        return {
            changes: diff.changes.map(c => new rangeMapping_1.DetailedLineRangeMapping(c.original, c.modified, c.innerChanges ? c.innerChanges.map(i => normalizeRangeMapping(i, original, modified)) : undefined)),
            moves: diff.moves,
            identical: diff.identical,
            quitEarly: diff.quitEarly,
        };
    }
    function normalizeRangeMapping(rangeMapping, original, modified) {
        let originalRange = rangeMapping.originalRange;
        let modifiedRange = rangeMapping.modifiedRange;
        if ((originalRange.endColumn !== 1 || modifiedRange.endColumn !== 1) &&
            originalRange.endColumn === original.getLineMaxColumn(originalRange.endLineNumber)
            && modifiedRange.endColumn === modified.getLineMaxColumn(modifiedRange.endLineNumber)
            && originalRange.endLineNumber < original.getLineCount()
            && modifiedRange.endLineNumber < modified.getLineCount()) {
            originalRange = originalRange.setEndPosition(originalRange.endLineNumber + 1, 1);
            modifiedRange = modifiedRange.setEndPosition(modifiedRange.endLineNumber + 1, 1);
        }
        return new rangeMapping_1.RangeMapping(originalRange, modifiedRange);
    }
    class DiffState {
        static fromDiffResult(result) {
            return new DiffState(result.changes.map(c => new DiffMapping(c)), result.moves || [], result.identical, result.quitEarly);
        }
        constructor(mappings, movedTexts, identical, quitEarly) {
            this.mappings = mappings;
            this.movedTexts = movedTexts;
            this.identical = identical;
            this.quitEarly = quitEarly;
        }
    }
    exports.DiffState = DiffState;
    class DiffMapping {
        constructor(lineRangeMapping) {
            this.lineRangeMapping = lineRangeMapping;
            /*
            readonly movedTo: MovedText | undefined,
            readonly movedFrom: MovedText | undefined,
    
            if (movedTo) {
                assertFn(() =>
                    movedTo.lineRangeMapping.modifiedRange.equals(lineRangeMapping.modifiedRange)
                    && lineRangeMapping.originalRange.isEmpty
                    && !movedFrom
                );
            } else if (movedFrom) {
                assertFn(() =>
                    movedFrom.lineRangeMapping.originalRange.equals(lineRangeMapping.originalRange)
                    && lineRangeMapping.modifiedRange.isEmpty
                    && !movedTo
                );
            }
            */
        }
    }
    exports.DiffMapping = DiffMapping;
    class UnchangedRegion {
        static fromDiffs(changes, originalLineCount, modifiedLineCount, minHiddenLineCount, minContext) {
            const inversedMappings = rangeMapping_1.DetailedLineRangeMapping.inverse(changes, originalLineCount, modifiedLineCount);
            const result = [];
            for (const mapping of inversedMappings) {
                let origStart = mapping.original.startLineNumber;
                let modStart = mapping.modified.startLineNumber;
                let length = mapping.original.length;
                const atStart = origStart === 1 && modStart === 1;
                const atEnd = origStart + length === originalLineCount + 1 && modStart + length === modifiedLineCount + 1;
                if ((atStart || atEnd) && length >= minContext + minHiddenLineCount) {
                    if (atStart && !atEnd) {
                        length -= minContext;
                    }
                    if (atEnd && !atStart) {
                        origStart += minContext;
                        modStart += minContext;
                        length -= minContext;
                    }
                    result.push(new UnchangedRegion(origStart, modStart, length, 0, 0));
                }
                else if (length >= minContext * 2 + minHiddenLineCount) {
                    origStart += minContext;
                    modStart += minContext;
                    length -= minContext * 2;
                    result.push(new UnchangedRegion(origStart, modStart, length, 0, 0));
                }
            }
            return result;
        }
        get originalUnchangedRange() {
            return lineRange_1.LineRange.ofLength(this.originalLineNumber, this.lineCount);
        }
        get modifiedUnchangedRange() {
            return lineRange_1.LineRange.ofLength(this.modifiedLineNumber, this.lineCount);
        }
        constructor(originalLineNumber, modifiedLineNumber, lineCount, visibleLineCountTop, visibleLineCountBottom) {
            this.originalLineNumber = originalLineNumber;
            this.modifiedLineNumber = modifiedLineNumber;
            this.lineCount = lineCount;
            this._visibleLineCountTop = (0, observable_1.observableValue)(this, 0);
            this.visibleLineCountTop = this._visibleLineCountTop;
            this._visibleLineCountBottom = (0, observable_1.observableValue)(this, 0);
            this.visibleLineCountBottom = this._visibleLineCountBottom;
            this._shouldHideControls = (0, observable_1.derived)(this, reader => /** @description isVisible */ this.visibleLineCountTop.read(reader) + this.visibleLineCountBottom.read(reader) === this.lineCount && !this.isDragged.read(reader));
            this.isDragged = (0, observable_1.observableValue)(this, undefined);
            const visibleLineCountTop2 = Math.max(Math.min(visibleLineCountTop, this.lineCount), 0);
            const visibleLineCountBottom2 = Math.max(Math.min(visibleLineCountBottom, this.lineCount - visibleLineCountTop), 0);
            (0, assert_1.softAssert)(visibleLineCountTop === visibleLineCountTop2);
            (0, assert_1.softAssert)(visibleLineCountBottom === visibleLineCountBottom2);
            this._visibleLineCountTop.set(visibleLineCountTop2, undefined);
            this._visibleLineCountBottom.set(visibleLineCountBottom2, undefined);
        }
        setVisibleRanges(visibleRanges, tx) {
            const result = [];
            const hiddenModified = new lineRange_1.LineRangeSet(visibleRanges.map(r => r.modified)).subtractFrom(this.modifiedUnchangedRange);
            let originalStartLineNumber = this.originalLineNumber;
            let modifiedStartLineNumber = this.modifiedLineNumber;
            const modifiedEndLineNumberEx = this.modifiedLineNumber + this.lineCount;
            if (hiddenModified.ranges.length === 0) {
                this.showAll(tx);
                result.push(this);
            }
            else {
                let i = 0;
                for (const r of hiddenModified.ranges) {
                    const isLast = i === hiddenModified.ranges.length - 1;
                    i++;
                    const length = (isLast ? modifiedEndLineNumberEx : r.endLineNumberExclusive) - modifiedStartLineNumber;
                    const newR = new UnchangedRegion(originalStartLineNumber, modifiedStartLineNumber, length, 0, 0);
                    newR.setHiddenModifiedRange(r, tx);
                    result.push(newR);
                    originalStartLineNumber = newR.originalUnchangedRange.endLineNumberExclusive;
                    modifiedStartLineNumber = newR.modifiedUnchangedRange.endLineNumberExclusive;
                }
            }
            return result;
        }
        shouldHideControls(reader) {
            return this._shouldHideControls.read(reader);
        }
        getHiddenOriginalRange(reader) {
            return lineRange_1.LineRange.ofLength(this.originalLineNumber + this._visibleLineCountTop.read(reader), this.lineCount - this._visibleLineCountTop.read(reader) - this._visibleLineCountBottom.read(reader));
        }
        getHiddenModifiedRange(reader) {
            return lineRange_1.LineRange.ofLength(this.modifiedLineNumber + this._visibleLineCountTop.read(reader), this.lineCount - this._visibleLineCountTop.read(reader) - this._visibleLineCountBottom.read(reader));
        }
        setHiddenModifiedRange(range, tx) {
            const visibleLineCountTop = range.startLineNumber - this.modifiedLineNumber;
            const visibleLineCountBottom = (this.modifiedLineNumber + this.lineCount) - range.endLineNumberExclusive;
            this.setState(visibleLineCountTop, visibleLineCountBottom, tx);
        }
        getMaxVisibleLineCountTop() {
            return this.lineCount - this._visibleLineCountBottom.get();
        }
        getMaxVisibleLineCountBottom() {
            return this.lineCount - this._visibleLineCountTop.get();
        }
        showMoreAbove(count = 10, tx) {
            const maxVisibleLineCountTop = this.getMaxVisibleLineCountTop();
            this._visibleLineCountTop.set(Math.min(this._visibleLineCountTop.get() + count, maxVisibleLineCountTop), tx);
        }
        showMoreBelow(count = 10, tx) {
            const maxVisibleLineCountBottom = this.lineCount - this._visibleLineCountTop.get();
            this._visibleLineCountBottom.set(Math.min(this._visibleLineCountBottom.get() + count, maxVisibleLineCountBottom), tx);
        }
        showAll(tx) {
            this._visibleLineCountBottom.set(this.lineCount - this._visibleLineCountTop.get(), tx);
        }
        showModifiedLine(lineNumber, preference, tx) {
            const top = lineNumber + 1 - (this.modifiedLineNumber + this._visibleLineCountTop.get());
            const bottom = (this.modifiedLineNumber - this._visibleLineCountBottom.get() + this.lineCount) - lineNumber;
            if (preference === 0 /* RevealPreference.FromCloserSide */ && top < bottom || preference === 1 /* RevealPreference.FromTop */) {
                this._visibleLineCountTop.set(this._visibleLineCountTop.get() + top, tx);
            }
            else {
                this._visibleLineCountBottom.set(this._visibleLineCountBottom.get() + bottom, tx);
            }
        }
        showOriginalLine(lineNumber, preference, tx) {
            const top = lineNumber - this.originalLineNumber;
            const bottom = (this.originalLineNumber + this.lineCount) - lineNumber;
            if (preference === 0 /* RevealPreference.FromCloserSide */ && top < bottom || preference === 1 /* RevealPreference.FromTop */) {
                this._visibleLineCountTop.set(Math.min(this._visibleLineCountTop.get() + bottom - top, this.getMaxVisibleLineCountTop()), tx);
            }
            else {
                this._visibleLineCountBottom.set(Math.min(this._visibleLineCountBottom.get() + top - bottom, this.getMaxVisibleLineCountBottom()), tx);
            }
        }
        collapseAll(tx) {
            this._visibleLineCountTop.set(0, tx);
            this._visibleLineCountBottom.set(0, tx);
        }
        setState(visibleLineCountTop, visibleLineCountBottom, tx) {
            visibleLineCountTop = Math.max(Math.min(visibleLineCountTop, this.lineCount), 0);
            visibleLineCountBottom = Math.max(Math.min(visibleLineCountBottom, this.lineCount - visibleLineCountTop), 0);
            this._visibleLineCountTop.set(visibleLineCountTop, tx);
            this._visibleLineCountBottom.set(visibleLineCountBottom, tx);
        }
    }
    exports.UnchangedRegion = UnchangedRegion;
    var RevealPreference;
    (function (RevealPreference) {
        RevealPreference[RevealPreference["FromCloserSide"] = 0] = "FromCloserSide";
        RevealPreference[RevealPreference["FromTop"] = 1] = "FromTop";
        RevealPreference[RevealPreference["FromBottom"] = 2] = "FromBottom";
    })(RevealPreference || (exports.RevealPreference = RevealPreference = {}));
    function applyOriginalEdits(diff, textEdits, originalTextModel, modifiedTextModel) {
        return undefined;
        /*
        TODO@hediet
        if (textEdits.length === 0) {
            return diff;
        }
    
        const diff2 = flip(diff);
        const diff3 = applyModifiedEdits(diff2, textEdits, modifiedTextModel, originalTextModel);
        if (!diff3) {
            return undefined;
        }
        return flip(diff3);*/
    }
    /*
    function flip(diff: IDocumentDiff): IDocumentDiff {
        return {
            changes: diff.changes.map(c => c.flip()),
            moves: diff.moves.map(m => m.flip()),
            identical: diff.identical,
            quitEarly: diff.quitEarly,
        };
    }
    */
    function applyModifiedEdits(diff, textEdits, originalTextModel, modifiedTextModel) {
        return undefined;
        /*
        TODO@hediet
        if (textEdits.length === 0) {
            return diff;
        }
        if (diff.changes.some(c => !c.innerChanges) || diff.moves.length > 0) {
            // TODO support these cases
            return undefined;
        }
    
        const changes = applyModifiedEditsToLineRangeMappings(diff.changes, textEdits, originalTextModel, modifiedTextModel);
    
        const moves = diff.moves.map(m => {
            const newModifiedRange = applyEditToLineRange(m.lineRangeMapping.modified, textEdits);
            return newModifiedRange ? new MovedText(
                new SimpleLineRangeMapping(m.lineRangeMapping.original, newModifiedRange),
                applyModifiedEditsToLineRangeMappings(m.changes, textEdits, originalTextModel, modifiedTextModel),
            ) : undefined;
        }).filter(isDefined);
    
        return {
            identical: false,
            quitEarly: false,
            changes,
            moves,
        };*/
    }
});
/*
function applyEditToLineRange(range: LineRange, textEdits: TextEditInfo[]): LineRange | undefined {
    let rangeStartLineNumber = range.startLineNumber;
    let rangeEndLineNumberEx = range.endLineNumberExclusive;

    for (let i = textEdits.length - 1; i >= 0; i--) {
        const textEdit = textEdits[i];
        const textEditStartLineNumber = lengthGetLineCount(textEdit.startOffset) + 1;
        const textEditEndLineNumber = lengthGetLineCount(textEdit.endOffset) + 1;
        const newLengthLineCount = lengthGetLineCount(textEdit.newLength);
        const delta = newLengthLineCount - (textEditEndLineNumber - textEditStartLineNumber);

        if (textEditEndLineNumber < rangeStartLineNumber) {
            // the text edit is before us
            rangeStartLineNumber += delta;
            rangeEndLineNumberEx += delta;
        } else if (textEditStartLineNumber > rangeEndLineNumberEx) {
            // the text edit is after us
            // NOOP
        } else if (textEditStartLineNumber < rangeStartLineNumber && rangeEndLineNumberEx < textEditEndLineNumber) {
            // the range is fully contained in the text edit
            return undefined;
        } else if (textEditStartLineNumber < rangeStartLineNumber && textEditEndLineNumber <= rangeEndLineNumberEx) {
            // the text edit ends inside our range
            rangeStartLineNumber = textEditEndLineNumber + 1;
            rangeStartLineNumber += delta;
            rangeEndLineNumberEx += delta;
        } else if (rangeStartLineNumber <= textEditStartLineNumber && textEditEndLineNumber < rangeStartLineNumber) {
            // the text edit starts inside our range
            rangeEndLineNumberEx = textEditStartLineNumber;
        } else {
            rangeEndLineNumberEx += delta;
        }
    }

    return new LineRange(rangeStartLineNumber, rangeEndLineNumberEx);
}

function applyModifiedEditsToLineRangeMappings(changes: readonly LineRangeMapping[], textEdits: TextEditInfo[], originalTextModel: ITextModel, modifiedTextModel: ITextModel): LineRangeMapping[] {
    const diffTextEdits = changes.flatMap(c => c.innerChanges!.map(c => new TextEditInfo(
        positionToLength(c.originalRange.getStartPosition()),
        positionToLength(c.originalRange.getEndPosition()),
        lengthOfRange(c.modifiedRange).toLength(),
    )));

    const combined = combineTextEditInfos(diffTextEdits, textEdits);

    let lastOriginalEndOffset = lengthZero;
    let lastModifiedEndOffset = lengthZero;
    const rangeMappings = combined.map(c => {
        const modifiedStartOffset = lengthAdd(lastModifiedEndOffset, lengthDiffNonNegative(lastOriginalEndOffset, c.startOffset));
        lastOriginalEndOffset = c.endOffset;
        lastModifiedEndOffset = lengthAdd(modifiedStartOffset, c.newLength);

        return new RangeMapping(
            Range.fromPositions(lengthToPosition(c.startOffset), lengthToPosition(c.endOffset)),
            Range.fromPositions(lengthToPosition(modifiedStartOffset), lengthToPosition(lastModifiedEndOffset)),
        );
    });

    const newChanges = lineRangeMappingFromRangeMappings(
        rangeMappings,
        originalTextModel.getLinesContent(),
        modifiedTextModel.getLinesContent(),
    );
    return newChanges;
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvclZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2RpZmZFZGl0b3JWaWV3TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBZ0MzQyxrQkFBa0IsQ0FBQyxTQUFnQztZQUN6RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRU0sbUJBQW1CLENBQUMsU0FBZ0M7WUFDMUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQWVELFlBQ2lCLEtBQXVCLEVBQ3RCLFFBQTJCLEVBQ2YsMkJBQXlFO1lBRXRHLEtBQUssRUFBRSxDQUFDO1lBSlEsVUFBSyxHQUFMLEtBQUssQ0FBa0I7WUFDdEIsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDRSxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBdkR0RixvQkFBZSxHQUFHLElBQUEsNEJBQWUsRUFBVSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekQsbUJBQWMsR0FBeUIsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUczRCxVQUFLLEdBQUcsSUFBQSw0QkFBZSxFQUF3QixJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDakUsU0FBSSxHQUF1QyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBRXJELHNCQUFpQixHQUFHLElBQUEsNEJBQWUsRUFBK0csSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BLLHFCQUFnQixH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