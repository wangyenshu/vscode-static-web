/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/offsetRange", "vs/nls"], function (require, exports, dom_1, actionbar_1, actions_1, arrays_1, arraysFind_1, codicons_1, lifecycle_1, observable_1, themables_1, utils_1, offsetRange_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MovedBlocksLinesFeature = void 0;
    class MovedBlocksLinesFeature extends lifecycle_1.Disposable {
        static { this.movedCodeBlockPadding = 4; }
        constructor(_rootElement, _diffModel, _originalEditorLayoutInfo, _modifiedEditorLayoutInfo, _editors) {
            super();
            this._rootElement = _rootElement;
            this._diffModel = _diffModel;
            this._originalEditorLayoutInfo = _originalEditorLayoutInfo;
            this._modifiedEditorLayoutInfo = _modifiedEditorLayoutInfo;
            this._editors = _editors;
            this._originalScrollTop = (0, observable_1.observableFromEvent)(this._editors.original.onDidScrollChange, () => this._editors.original.getScrollTop());
            this._modifiedScrollTop = (0, observable_1.observableFromEvent)(this._editors.modified.onDidScrollChange, () => this._editors.modified.getScrollTop());
            this._viewZonesChanged = (0, observable_1.observableSignalFromEvent)('onDidChangeViewZones', this._editors.modified.onDidChangeViewZones);
            this.width = (0, observable_1.observableValue)(this, 0);
            this._modifiedViewZonesChangedSignal = (0, observable_1.observableSignalFromEvent)('modified.onDidChangeViewZones', this._editors.modified.onDidChangeViewZones);
            this._originalViewZonesChangedSignal = (0, observable_1.observableSignalFromEvent)('original.onDidChangeViewZones', this._editors.original.onDidChangeViewZones);
            this._state = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                /** @description state */
                this._element.replaceChildren();
                const model = this._diffModel.read(reader);
                const moves = model?.diff.read(reader)?.movedTexts;
                if (!moves || moves.length === 0) {
                    this.width.set(0, undefined);
                    return;
                }
                this._viewZonesChanged.read(reader);
                const infoOrig = this._originalEditorLayoutInfo.read(reader);
                const infoMod = this._modifiedEditorLayoutInfo.read(reader);
                if (!infoOrig || !infoMod) {
                    this.width.set(0, undefined);
                    return;
                }
                this._modifiedViewZonesChangedSignal.read(reader);
                this._originalViewZonesChangedSignal.read(reader);
                const lines = moves.map((move) => {
                    function computeLineStart(range, editor) {
                        const t1 = editor.getTopForLineNumber(range.startLineNumber, true);
                        const t2 = editor.getTopForLineNumber(range.endLineNumberExclusive, true);
                        return (t1 + t2) / 2;
                    }
                    const start = computeLineStart(move.lineRangeMapping.original, this._editors.original);
                    const startOffset = this._originalScrollTop.read(reader);
                    const end = computeLineStart(move.lineRangeMapping.modified, this._editors.modified);
                    const endOffset = this._modifiedScrollTop.read(reader);
                    const from = start - startOffset;
                    const to = end - endOffset;
                    const top = Math.min(start, end);
                    const bottom = Math.max(start, end);
                    return { range: new offsetRange_1.OffsetRange(top, bottom), from, to, fromWithoutScroll: start, toWithoutScroll: end, move };
                });
                lines.sort((0, arrays_1.tieBreakComparators)((0, arrays_1.compareBy)(l => l.fromWithoutScroll > l.toWithoutScroll, arrays_1.booleanComparator), (0, arrays_1.compareBy)(l => l.fromWithoutScroll > l.toWithoutScroll ? l.fromWithoutScroll : -l.toWithoutScroll, arrays_1.numberComparator)));
                const layout = LinesLayout.compute(lines.map(l => l.range));
                const padding = 10;
                const lineAreaLeft = infoOrig.verticalScrollbarWidth;
                const lineAreaWidth = (layout.getTrackCount() - 1) * 10 + padding * 2;
                const width = lineAreaLeft + lineAreaWidth + (infoMod.contentLeft - MovedBlocksLinesFeature.movedCodeBlockPadding);
                let idx = 0;
                for (const line of lines) {
                    const track = layout.getTrack(idx);
                    const verticalY = lineAreaLeft + padding + track * 10;
                    const arrowHeight = 15;
                    const arrowWidth = 15;
                    const right = width;
                    const rectWidth = infoMod.glyphMarginWidth + infoMod.lineNumbersWidth;
                    const rectHeight = 18;
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.classList.add('arrow-rectangle');
                    rect.setAttribute('x', `${right - rectWidth}`);
                    rect.setAttribute('y', `${line.to - rectHeight / 2}`);
                    rect.setAttribute('width', `${rectWidth}`);
                    rect.setAttribute('height', `${rectHeight}`);
                    this._element.appendChild(rect);
                    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', `M ${0} ${line.from} L ${verticalY} ${line.from} L ${verticalY} ${line.to} L ${right - arrowWidth} ${line.to}`);
                    path.setAttribute('fill', 'none');
                    g.appendChild(path);
                    const arrowRight = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    arrowRight.classList.add('arrow');
                    store.add((0, observable_1.autorun)(reader => {
                        path.classList.toggle('currentMove', line.move === model.activeMovedText.read(reader));
                        arrowRight.classList.toggle('currentMove', line.move === model.activeMovedText.read(reader));
                    }));
                    arrowRight.setAttribute('points', `${right - arrowWidth},${line.to - arrowHeight / 2} ${right},${line.to} ${right - arrowWidth},${line.to + arrowHeight / 2}`);
                    g.appendChild(arrowRight);
                    this._element.appendChild(g);
                    /*
                    TODO@hediet
                    path.addEventListener('mouseenter', () => {
                        model.setHoveredMovedText(line.move);
                    });
                    path.addEventListener('mouseleave', () => {
                        model.setHoveredMovedText(undefined);
                    });*/
                    idx++;
                }
                this.width.set(lineAreaWidth, undefined);
            });
            this._element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this._element.setAttribute('class', 'moved-blocks-lines');
            this._rootElement.appendChild(this._element);
            this._register((0, lifecycle_1.toDisposable)(() => this._element.remove()));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update moved blocks lines positioning */
                const info = this._originalEditorLayoutInfo.read(reader);
                const info2 = this._modifiedEditorLayoutInfo.read(reader);
                if (!info || !info2) {
                    return;
                }
                this._element.style.left = `${info.width - info.verticalScrollbarWidth}px`;
                this._element.style.height = `${info.height}px`;
                this._element.style.width = `${info.verticalScrollbarWidth + info.contentLeft - MovedBlocksLinesFeature.movedCodeBlockPadding + this.width.read(reader)}px`;
            }));
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._state));
            const movedBlockViewZones = (0, observable_1.derived)(reader => {
                const model = this._diffModel.read(reader);
                const d = model?.diff.read(reader);
                if (!d) {
                    return [];
                }
                return d.movedTexts.map(move => ({
                    move,
                    original: new utils_1.PlaceholderViewZone((0, observable_1.constObservable)(move.lineRangeMapping.original.startLineNumber - 1), 18),
                    modified: new utils_1.PlaceholderViewZone((0, observable_1.constObservable)(move.lineRangeMapping.modified.startLineNumber - 1), 18),
                }));
            });
            this._register((0, utils_1.applyViewZones)(this._editors.original, movedBlockViewZones.map(zones => /** @description movedBlockViewZones.original */ zones.map(z => z.original))));
            this._register((0, utils_1.applyViewZones)(this._editors.modified, movedBlockViewZones.map(zones => /** @description movedBlockViewZones.modified */ zones.map(z => z.modified))));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                const blocks = movedBlockViewZones.read(reader);
                for (const b of blocks) {
                    store.add(new MovedBlockOverlayWidget(this._editors.original, b.original, b.move, 'original', this._diffModel.get()));
                    store.add(new MovedBlockOverlayWidget(this._editors.modified, b.modified, b.move, 'modified', this._diffModel.get()));
                }
            }));
            const originalHasFocus = (0, observable_1.observableSignalFromEvent)('original.onDidFocusEditorWidget', e => this._editors.original.onDidFocusEditorWidget(() => setTimeout(() => e(undefined), 0)));
            const modifiedHasFocus = (0, observable_1.observableSignalFromEvent)('modified.onDidFocusEditorWidget', e => this._editors.modified.onDidFocusEditorWidget(() => setTimeout(() => e(undefined), 0)));
            let lastChangedEditor = 'modified';
            this._register((0, observable_1.autorunHandleChanges)({
                createEmptyChangeSummary: () => undefined,
                handleChange: (ctx, summary) => {
                    if (ctx.didChange(originalHasFocus)) {
                        lastChangedEditor = 'original';
                    }
                    if (ctx.didChange(modifiedHasFocus)) {
                        lastChangedEditor = 'modified';
                    }
                    return true;
                }
            }, reader => {
                /** @description MovedBlocksLines.setActiveMovedTextFromCursor */
                originalHasFocus.read(reader);
                modifiedHasFocus.read(reader);
                const m = this._diffModel.read(reader);
                if (!m) {
                    return;
                }
                const diff = m.diff.read(reader);
                let movedText = undefined;
                if (diff && lastChangedEditor === 'original') {
                    const originalPos = this._editors.originalCursor.read(reader);
                    if (originalPos) {
                        movedText = diff.movedTexts.find(m => m.lineRangeMapping.original.contains(originalPos.lineNumber));
                    }
                }
                if (diff && lastChangedEditor === 'modified') {
                    const modifiedPos = this._editors.modifiedCursor.read(reader);
                    if (modifiedPos) {
                        movedText = diff.movedTexts.find(m => m.lineRangeMapping.modified.contains(modifiedPos.lineNumber));
                    }
                }
                if (movedText !== m.movedTextToCompare.get()) {
                    m.movedTextToCompare.set(undefined, undefined);
                }
                m.setActiveMovedText(movedText);
            }));
        }
    }
    exports.MovedBlocksLinesFeature = MovedBlocksLinesFeature;
    class LinesLayout {
        static compute(lines) {
            const setsPerTrack = [];
            const trackPerLineIdx = [];
            for (const line of lines) {
                let trackIdx = setsPerTrack.findIndex(set => !set.intersectsStrict(line));
                if (trackIdx === -1) {
                    const maxTrackCount = 6;
                    if (setsPerTrack.length >= maxTrackCount) {
                        trackIdx = (0, arraysFind_1.findMaxIdx)(setsPerTrack, (0, arrays_1.compareBy)(set => set.intersectWithRangeLength(line), arrays_1.numberComparator));
                    }
                    else {
                        trackIdx = setsPerTrack.length;
                        setsPerTrack.push(new offsetRange_1.OffsetRangeSet());
                    }
                }
                setsPerTrack[trackIdx].addRange(line);
                trackPerLineIdx.push(trackIdx);
            }
            return new LinesLayout(setsPerTrack.length, trackPerLineIdx);
        }
        constructor(_trackCount, trackPerLineIdx) {
            this._trackCount = _trackCount;
            this.trackPerLineIdx = trackPerLineIdx;
        }
        getTrack(lineIdx) {
            return this.trackPerLineIdx[lineIdx];
        }
        getTrackCount() {
            return this._trackCount;
        }
    }
    class MovedBlockOverlayWidget extends utils_1.ViewZoneOverlayWidget {
        constructor(_editor, _viewZone, _move, _kind, _diffModel) {
            const root = (0, dom_1.h)('div.diff-hidden-lines-widget');
            super(_editor, _viewZone, root.root);
            this._editor = _editor;
            this._move = _move;
            this._kind = _kind;
            this._diffModel = _diffModel;
            this._nodes = (0, dom_1.h)('div.diff-moved-code-block', { style: { marginRight: '4px' } }, [
                (0, dom_1.h)('div.text-content@textContent'),
                (0, dom_1.h)('div.action-bar@actionBar'),
            ]);
            root.root.appendChild(this._nodes.root);
            const editorLayout = (0, observable_1.observableFromEvent)(this._editor.onDidLayoutChange, () => this._editor.getLayoutInfo());
            this._register((0, utils_1.applyStyle)(this._nodes.root, {
                paddingRight: editorLayout.map(l => l.verticalScrollbarWidth)
            }));
            let text;
            if (_move.changes.length > 0) {
                text = this._kind === 'original' ? (0, nls_1.localize)('codeMovedToWithChanges', 'Code moved with changes to line {0}-{1}', this._move.lineRangeMapping.modified.startLineNumber, this._move.lineRangeMapping.modified.endLineNumberExclusive - 1) : (0, nls_1.localize)('codeMovedFromWithChanges', 'Code moved with changes from line {0}-{1}', this._move.lineRangeMapping.original.startLineNumber, this._move.lineRangeMapping.original.endLineNumberExclusive - 1);
            }
            else {
                text = this._kind === 'original' ? (0, nls_1.localize)('codeMovedTo', 'Code moved to line {0}-{1}', this._move.lineRangeMapping.modified.startLineNumber, this._move.lineRangeMapping.modified.endLineNumberExclusive - 1) : (0, nls_1.localize)('codeMovedFrom', 'Code moved from line {0}-{1}', this._move.lineRangeMapping.original.startLineNumber, this._move.lineRangeMapping.original.endLineNumberExclusive - 1);
            }
            const actionBar = this._register(new actionbar_1.ActionBar(this._nodes.actionBar, {
                highlightToggledItems: true,
            }));
            const caption = new actions_1.Action('', text, '', false);
            actionBar.push(caption, { icon: false, label: true });
            const actionCompare = new actions_1.Action('', 'Compare', themables_1.ThemeIcon.asClassName(codicons_1.Codicon.compareChanges), true, () => {
                this._editor.focus();
                this._diffModel.movedTextToCompare.set(this._diffModel.movedTextToCompare.get() === _move ? undefined : this._move, undefined);
            });
            this._register((0, observable_1.autorun)(reader => {
                const isActive = this._diffModel.movedTextToCompare.read(reader) === _move;
                actionCompare.checked = isActive;
            }));
            actionBar.push(actionCompare, { icon: false, label: true });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWRCbG9ja3NMaW5lc0ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9mZWF0dXJlcy9tb3ZlZEJsb2Nrc0xpbmVzRmVhdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQmhHLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVU7aUJBQy9CLDBCQUFxQixHQUFHLENBQUMsQUFBSixDQUFLO1FBU2pELFlBQ2tCLFlBQXlCLEVBQ3pCLFVBQXdELEVBQ3hELHlCQUErRCxFQUMvRCx5QkFBK0QsRUFDL0QsUUFBMkI7WUFFNUMsS0FBSyxFQUFFLENBQUM7WUFOUyxpQkFBWSxHQUFaLFlBQVksQ0FBYTtZQUN6QixlQUFVLEdBQVYsVUFBVSxDQUE4QztZQUN4RCw4QkFBeUIsR0FBekIseUJBQXlCLENBQXNDO1lBQy9ELDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBc0M7WUFDL0QsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFYNUIsdUJBQWtCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLHVCQUFrQixHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNoSSxzQkFBaUIsR0FBRyxJQUFBLHNDQUF5QixFQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMs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