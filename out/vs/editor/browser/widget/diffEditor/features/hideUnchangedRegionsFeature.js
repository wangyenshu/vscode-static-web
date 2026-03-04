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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/codicons", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/derived", "vs/base/common/themables", "vs/base/common/types", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom_1, iconLabels_1, codicons_1, htmlContent_1, lifecycle_1, observable_1, derived_1, themables_1, types_1, utils_1, lineRange_1, position_1, range_1, languages_1, nls_1, instantiation_1) {
    "use strict";
    var HideUnchangedRegionsFeature_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HideUnchangedRegionsFeature = void 0;
    /**
     * Make sure to add the view zones to the editor!
     */
    let HideUnchangedRegionsFeature = class HideUnchangedRegionsFeature extends lifecycle_1.Disposable {
        static { HideUnchangedRegionsFeature_1 = this; }
        static { this._breadcrumbsSourceFactory = (0, observable_1.observableValue)('breadcrumbsSourceFactory', undefined); }
        static setBreadcrumbsSourceFactory(factory) {
            this._breadcrumbsSourceFactory.set(factory, undefined);
        }
        get isUpdatingHiddenAreas() { return this._isUpdatingHiddenAreas; }
        constructor(_editors, _diffModel, _options, _instantiationService) {
            super();
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._instantiationService = _instantiationService;
            this._modifiedOutlineSource = (0, derived_1.derivedDisposable)(this, (reader) => {
                const m = this._editors.modifiedModel.read(reader);
                const factory = HideUnchangedRegionsFeature_1._breadcrumbsSourceFactory.read(reader);
                return (!m || !factory) ? undefined : factory(m, this._instantiationService);
            });
            this._isUpdatingHiddenAreas = false;
            this._register(this._editors.original.onDidChangeCursorPosition(e => {
                if (e.reason === 1 /* CursorChangeReason.ContentFlush */) {
                    return;
                }
                const m = this._diffModel.get();
                (0, observable_1.transaction)(tx => {
                    for (const s of this._editors.original.getSelections() || []) {
                        m?.ensureOriginalLineIsVisible(s.getStartPosition().lineNumber, 0 /* RevealPreference.FromCloserSide */, tx);
                        m?.ensureOriginalLineIsVisible(s.getEndPosition().lineNumber, 0 /* RevealPreference.FromCloserSide */, tx);
                    }
                });
            }));
            this._register(this._editors.modified.onDidChangeCursorPosition(e => {
                if (e.reason === 1 /* CursorChangeReason.ContentFlush */) {
                    return;
                }
                const m = this._diffModel.get();
                (0, observable_1.transaction)(tx => {
                    for (const s of this._editors.modified.getSelections() || []) {
                        m?.ensureModifiedLineIsVisible(s.getStartPosition().lineNumber, 0 /* RevealPreference.FromCloserSide */, tx);
                        m?.ensureModifiedLineIsVisible(s.getEndPosition().lineNumber, 0 /* RevealPreference.FromCloserSide */, tx);
                    }
                });
            }));
            const unchangedRegions = this._diffModel.map((m, reader) => {
                const regions = m?.unchangedRegions.read(reader) ?? [];
                if (regions.length === 1 && regions[0].modifiedLineNumber === 1 && regions[0].lineCount === this._editors.modifiedModel.read(reader)?.getLineCount()) {
                    return [];
                }
                return regions;
            });
            this.viewZones = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                /** @description view Zones */
                const modifiedOutlineSource = this._modifiedOutlineSource.read(reader);
                if (!modifiedOutlineSource) {
                    return { origViewZones: [], modViewZones: [] };
                }
                const origViewZones = [];
                const modViewZones = [];
                const sideBySide = this._options.renderSideBySide.read(reader);
                const curUnchangedRegions = unchangedRegions.read(reader);
                for (const r of curUnchangedRegions) {
                    if (r.shouldHideControls(reader)) {
                        continue;
                    }
                    {
                        const d = (0, observable_1.derived)(this, reader => /** @description hiddenOriginalRangeStart */ r.getHiddenOriginalRange(reader).startLineNumber - 1);
                        const origVz = new utils_1.PlaceholderViewZone(d, 24);
                        origViewZones.push(origVz);
                        store.add(new CollapsedCodeOverlayWidget(this._editors.original, origVz, r, r.originalUnchangedRange, !sideBySide, modifiedOutlineSource, l => this._diffModel.get().ensureModifiedLineIsVisible(l, 2 /* RevealPreference.FromBottom */, undefined), this._options));
                    }
                    {
                        const d = (0, observable_1.derived)(this, reader => /** @description hiddenModifiedRangeStart */ r.getHiddenModifiedRange(reader).startLineNumber - 1);
                        const modViewZone = new utils_1.PlaceholderViewZone(d, 24);
                        modViewZones.push(modViewZone);
                        store.add(new CollapsedCodeOverlayWidget(this._editors.modified, modViewZone, r, r.modifiedUnchangedRange, false, modifiedOutlineSource, l => this._diffModel.get().ensureModifiedLineIsVisible(l, 2 /* RevealPreference.FromBottom */, undefined), this._options));
                    }
                }
                return { origViewZones, modViewZones, };
            });
            const unchangedLinesDecoration = {
                description: 'unchanged lines',
                className: 'diff-unchanged-lines',
                isWholeLine: true,
            };
            const unchangedLinesDecorationShow = {
                description: 'Fold Unchanged',
                glyphMarginHoverMessage: new htmlContent_1.MarkdownString(undefined, { isTrusted: true, supportThemeIcons: true })
                    .appendMarkdown((0, nls_1.localize)('foldUnchanged', 'Fold Unchanged Region')),
                glyphMarginClassName: 'fold-unchanged ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.fold),
                zIndex: 10001,
            };
            this._register((0, utils_1.applyObservableDecorations)(this._editors.original, (0, observable_1.derived)(this, reader => {
                /** @description decorations */
                const curUnchangedRegions = unchangedRegions.read(reader);
                const result = curUnchangedRegions.map(r => ({
                    range: r.originalUnchangedRange.toInclusiveRange(),
                    options: unchangedLinesDecoration,
                }));
                for (const r of curUnchangedRegions) {
                    if (r.shouldHideControls(reader)) {
                        result.push({
                            range: range_1.Range.fromPositions(new position_1.Position(r.originalLineNumber, 1)),
                            options: unchangedLinesDecorationShow,
                        });
                    }
                }
                return result;
            })));
            this._register((0, utils_1.applyObservableDecorations)(this._editors.modified, (0, observable_1.derived)(this, reader => {
                /** @description decorations */
                const curUnchangedRegions = unchangedRegions.read(reader);
                const result = curUnchangedRegions.map(r => ({
                    range: r.modifiedUnchangedRange.toInclusiveRange(),
                    options: unchangedLinesDecoration,
                }));
                for (const r of curUnchangedRegions) {
                    if (r.shouldHideControls(reader)) {
                        result.push({
                            range: lineRange_1.LineRange.ofLength(r.modifiedLineNumber, 1).toInclusiveRange(),
                            options: unchangedLinesDecorationShow,
                        });
                    }
                }
                return result;
            })));
            this._register((0, observable_1.autorun)((reader) => {
                /** @description update folded unchanged regions */
                const curUnchangedRegions = unchangedRegions.read(reader);
                this._isUpdatingHiddenAreas = true;
                try {
                    this._editors.original.setHiddenAreas(curUnchangedRegions.map(r => r.getHiddenOriginalRange(reader).toInclusiveRange()).filter(types_1.isDefined));
                    this._editors.modified.setHiddenAreas(curUnchangedRegions.map(r => r.getHiddenModifiedRange(reader).toInclusiveRange()).filter(types_1.isDefined));
                }
                finally {
                    this._isUpdatingHiddenAreas = false;
                }
            }));
            this._register(this._editors.modified.onMouseUp(event => {
                if (!event.event.rightButton && event.target.position && event.target.element?.className.includes('fold-unchanged')) {
                    const lineNumber = event.target.position.lineNumber;
                    const model = this._diffModel.get();
                    if (!model) {
                        return;
                    }
                    const region = model.unchangedRegions.get().find(r => r.modifiedUnchangedRange.includes(lineNumber));
                    if (!region) {
                        return;
                    }
                    region.collapseAll(undefined);
                    event.event.stopPropagation();
                    event.event.preventDefault();
                }
            }));
            this._register(this._editors.original.onMouseUp(event => {
                if (!event.event.rightButton && event.target.position && event.target.element?.className.includes('fold-unchanged')) {
                    const lineNumber = event.target.position.lineNumber;
                    const model = this._diffModel.get();
                    if (!model) {
                        return;
                    }
                    const region = model.unchangedRegions.get().find(r => r.originalUnchangedRange.includes(lineNumber));
                    if (!region) {
                        return;
                    }
                    region.collapseAll(undefined);
                    event.event.stopPropagation();
                    event.event.preventDefault();
                }
            }));
        }
    };
    exports.HideUnchangedRegionsFeature = HideUnchangedRegionsFeature;
    exports.HideUnchangedRegionsFeature = HideUnchangedRegionsFeature = HideUnchangedRegionsFeature_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], HideUnchangedRegionsFeature);
    class CollapsedCodeOverlayWidget extends utils_1.ViewZoneOverlayWidget {
        constructor(_editor, _viewZone, _unchangedRegion, _unchangedRegionRange, _hide, _modifiedOutlineSource, _revealModifiedHiddenLine, _options) {
            const root = (0, dom_1.h)('div.diff-hidden-lines-widget');
            super(_editor, _viewZone, root.root);
            this._editor = _editor;
            this._unchangedRegion = _unchangedRegion;
            this._unchangedRegionRange = _unchangedRegionRange;
            this._hide = _hide;
            this._modifiedOutlineSource = _modifiedOutlineSource;
            this._revealModifiedHiddenLine = _revealModifiedHiddenLine;
            this._options = _options;
            this._nodes = (0, dom_1.h)('div.diff-hidden-lines', [
                (0, dom_1.h)('div.top@top', { title: (0, nls_1.localize)('diff.hiddenLines.top', 'Click or drag to show more above') }),
                (0, dom_1.h)('div.center@content', { style: { display: 'flex' } }, [
                    (0, dom_1.h)('div@first', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: '0' } }, [(0, dom_1.$)('a', { title: (0, nls_1.localize)('showUnchangedRegion', 'Show Unchanged Region'), role: 'button', onclick: () => { this._unchangedRegion.showAll(undefined); } }, ...(0, iconLabels_1.renderLabelWithIcons)('$(unfold)'))]),
                    (0, dom_1.h)('div@others', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }),
                ]),
                (0, dom_1.h)('div.bottom@bottom', { title: (0, nls_1.localize)('diff.bottom', 'Click or drag to show more below'), role: 'button' }),
            ]);
            root.root.appendChild(this._nodes.root);
            const layoutInfo = (0, observable_1.observableFromEvent)(this._editor.onDidLayoutChange, () => this._editor.getLayoutInfo());
            if (!this._hide) {
                this._register((0, utils_1.applyStyle)(this._nodes.first, { width: layoutInfo.map((l) => l.contentLeft) }));
            }
            else {
                (0, dom_1.reset)(this._nodes.first);
            }
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update CollapsedCodeOverlayWidget canMove* css classes */
                const isFullyRevealed = this._unchangedRegion.visibleLineCountTop.read(reader) + this._unchangedRegion.visibleLineCountBottom.read(reader) === this._unchangedRegion.lineCount;
                this._nodes.bottom.classList.toggle('canMoveTop', !isFullyRevealed);
                this._nodes.bottom.classList.toggle('canMoveBottom', this._unchangedRegion.visibleLineCountBottom.read(reader) > 0);
                this._nodes.top.classList.toggle('canMoveTop', this._unchangedRegion.visibleLineCountTop.read(reader) > 0);
                this._nodes.top.classList.toggle('canMoveBottom', !isFullyRevealed);
                const isDragged = this._unchangedRegion.isDragged.read(reader);
                const domNode = this._editor.getDomNode();
                if (domNode) {
                    domNode.classList.toggle('draggingUnchangedRegion', !!isDragged);
                    if (isDragged === 'top') {
                        domNode.classList.toggle('canMoveTop', this._unchangedRegion.visibleLineCountTop.read(reader) > 0);
                        domNode.classList.toggle('canMoveBottom', !isFullyRevealed);
                    }
                    else if (isDragged === 'bottom') {
                        domNode.classList.toggle('canMoveTop', !isFullyRevealed);
                        domNode.classList.toggle('canMoveBottom', this._unchangedRegion.visibleLineCountBottom.read(reader) > 0);
                    }
                    else {
                        domNode.classList.toggle('canMoveTop', false);
                        domNode.classList.toggle('canMoveBottom', false);
                    }
                }
            }));
            const editor = this._editor;
            this._register((0, dom_1.addDisposableListener)(this._nodes.top, 'mousedown', e => {
                if (e.button !== 0) {
                    return;
                }
                this._nodes.top.classList.toggle('dragging', true);
                this._nodes.root.classList.toggle('dragging', true);
                e.preventDefault();
                const startTop = e.clientY;
                let didMove = false;
                const cur = this._unchangedRegion.visibleLineCountTop.get();
                this._unchangedRegion.isDragged.set('top', undefined);
                const window = (0, dom_1.getWindow)(this._nodes.top);
                const mouseMoveListener = (0, dom_1.addDisposableListener)(window, 'mousemove', e => {
                    const currentTop = e.clientY;
                    const delta = currentTop - startTop;
                    didMove = didMove || Math.abs(delta) > 2;
                    const lineDelta = Math.round(delta / editor.getOption(67 /* EditorOption.lineHeight */));
                    const newVal = Math.max(0, Math.min(cur + lineDelta, this._unchangedRegion.getMaxVisibleLineCountTop()));
                    this._unchangedRegion.visibleLineCountTop.set(newVal, undefined);
                });
                const mouseUpListener = (0, dom_1.addDisposableListener)(window, 'mouseup', e => {
                    if (!didMove) {
                        this._unchangedRegion.showMoreAbove(this._options.hideUnchangedRegionsRevealLineCount.get(), undefined);
                    }
                    this._nodes.top.classList.toggle('dragging', false);
                    this._nodes.root.classList.toggle('dragging', false);
                    this._unchangedRegion.isDragged.set(undefined, undefined);
                    mouseMoveListener.dispose();
                    mouseUpListener.dispose();
                });
            }));
            this._register((0, dom_1.addDisposableListener)(this._nodes.bottom, 'mousedown', e => {
                if (e.button !== 0) {
                    return;
                }
                this._nodes.bottom.classList.toggle('dragging', true);
                this._nodes.root.classList.toggle('dragging', true);
                e.preventDefault();
                const startTop = e.clientY;
                let didMove = false;
                const cur = this._unchangedRegion.visibleLineCountBottom.get();
                this._unchangedRegion.isDragged.set('bottom', undefined);
                const window = (0, dom_1.getWindow)(this._nodes.bottom);
                const mouseMoveListener = (0, dom_1.addDisposableListener)(window, 'mousemove', e => {
                    const currentTop = e.clientY;
                    const delta = currentTop - startTop;
                    didMove = didMove || Math.abs(delta) > 2;
                    const lineDelta = Math.round(delta / editor.getOption(67 /* EditorOption.lineHeight */));
                    const newVal = Math.max(0, Math.min(cur - lineDelta, this._unchangedRegion.getMaxVisibleLineCountBottom()));
                    const top = this._unchangedRegionRange.endLineNumberExclusive > editor.getModel().getLineCount()
                        ? editor.getContentHeight()
                        : editor.getTopForLineNumber(this._unchangedRegionRange.endLineNumberExclusive);
                    this._unchangedRegion.visibleLineCountBottom.set(newVal, undefined);
                    const top2 = this._unchangedRegionRange.endLineNumberExclusive > editor.getModel().getLineCount()
                        ? editor.getContentHeight()
                        : editor.getTopForLineNumber(this._unchangedRegionRange.endLineNumberExclusive);
                    editor.setScrollTop(editor.getScrollTop() + (top2 - top));
                });
                const mouseUpListener = (0, dom_1.addDisposableListener)(window, 'mouseup', e => {
                    this._unchangedRegion.isDragged.set(undefined, undefined);
                    if (!didMove) {
                        const top = editor.getTopForLineNumber(this._unchangedRegionRange.endLineNumberExclusive);
                        this._unchangedRegion.showMoreBelow(this._options.hideUnchangedRegionsRevealLineCount.get(), undefined);
                        const top2 = editor.getTopForLineNumber(this._unchangedRegionRange.endLineNumberExclusive);
                        editor.setScrollTop(editor.getScrollTop() + (top2 - top));
                    }
                    this._nodes.bottom.classList.toggle('dragging', false);
                    this._nodes.root.classList.toggle('dragging', false);
                    mouseMoveListener.dispose();
                    mouseUpListener.dispose();
                });
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update labels */
                const children = [];
                if (!this._hide) {
                    const lineCount = _unchangedRegion.getHiddenModifiedRange(reader).length;
                    const linesHiddenText = (0, nls_1.localize)('hiddenLines', '{0} hidden lines', lineCount);
                    const span = (0, dom_1.$)('span', { title: (0, nls_1.localize)('diff.hiddenLines.expandAll', 'Double click to unfold') }, linesHiddenText);
                    span.addEventListener('dblclick', e => {
                        if (e.button !== 0) {
                            return;
                        }
                        e.preventDefault();
                        this._unchangedRegion.showAll(undefined);
                    });
                    children.push(span);
                    const range = this._unchangedRegion.getHiddenModifiedRange(reader);
                    const items = this._modifiedOutlineSource.getBreadcrumbItems(range, reader);
                    if (items.length > 0) {
                        children.push((0, dom_1.$)('span', undefined, '\u00a0\u00a0|\u00a0\u00a0'));
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            const icon = languages_1.SymbolKinds.toIcon(item.kind);
                            const divItem = (0, dom_1.h)('div.breadcrumb-item', {
                                style: { display: 'flex', alignItems: 'center' },
                            }, [
                                (0, iconLabels_1.renderIcon)(icon),
                                '\u00a0',
                                item.name,
                                ...(i === items.length - 1
                                    ? []
                                    : [(0, iconLabels_1.renderIcon)(codicons_1.Codicon.chevronRight)])
                            ]).root;
                            children.push(divItem);
                            divItem.onclick = () => {
                                this._revealModifiedHiddenLine(item.startLineNumber);
                            };
                        }
                    }
                }
                (0, dom_1.reset)(this._nodes.others, ...children);
            }));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlkZVVuY2hhbmdlZFJlZ2lvbnNGZWF0dXJlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2RpZmZFZGl0b3IvZmVhdHVyZXMvaGlkZVVuY2hhbmdlZFJlZ2lvbnNGZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHOztPQUVHO0lBQ0ksSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTs7aUJBQ2xDLDhCQUF5QixHQUFHLElBQUEsNEJBQWUsRUFBcUgsMEJBQTBCLEVBQUUsU0FBUyxDQUFDLEFBQTdLLENBQThLO1FBQ3hOLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxPQUE2RztZQUN0SixJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBY0QsSUFBVyxxQkFBcUIsS0FBSyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7UUFFMUUsWUFDa0IsUUFBMkIsRUFDM0IsVUFBd0QsRUFDeEQsUUFBMkIsRUFDckIscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBTFMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsZUFBVSxHQUFWLFVBQVUsQ0FBOEM7WUFDeEQsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDSiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBbEJwRSwyQkFBc0IsR0FBRyxJQUFBLDJCQUFpQixFQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUM1RSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JB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