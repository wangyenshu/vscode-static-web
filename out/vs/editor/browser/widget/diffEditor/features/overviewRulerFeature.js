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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/scrollbar/scrollbarState", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/position", "vs/editor/common/viewModel/overviewZoneManager", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, fastDomNode_1, scrollbarState_1, lifecycle_1, observable_1, utils_1, position_1, overviewZoneManager_1, colorRegistry_1, themeService_1) {
    "use strict";
    var OverviewRulerFeature_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewRulerFeature = void 0;
    let OverviewRulerFeature = class OverviewRulerFeature extends lifecycle_1.Disposable {
        static { OverviewRulerFeature_1 = this; }
        static { this.ONE_OVERVIEW_WIDTH = 15; }
        static { this.ENTIRE_DIFF_OVERVIEW_WIDTH = OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH * 2; }
        constructor(_editors, _rootElement, _diffModel, _rootWidth, _rootHeight, _modifiedEditorLayoutInfo, _themeService) {
            super();
            this._editors = _editors;
            this._rootElement = _rootElement;
            this._diffModel = _diffModel;
            this._rootWidth = _rootWidth;
            this._rootHeight = _rootHeight;
            this._modifiedEditorLayoutInfo = _modifiedEditorLayoutInfo;
            this._themeService = _themeService;
            this.width = OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH;
            const currentColorTheme = (0, observable_1.observableFromEvent)(this._themeService.onDidColorThemeChange, () => this._themeService.getColorTheme());
            const currentColors = (0, observable_1.derived)(reader => {
                /** @description colors */
                const theme = currentColorTheme.read(reader);
                const insertColor = theme.getColor(colorRegistry_1.diffOverviewRulerInserted) || (theme.getColor(colorRegistry_1.diffInserted) || colorRegistry_1.defaultInsertColor).transparent(2);
                const removeColor = theme.getColor(colorRegistry_1.diffOverviewRulerRemoved) || (theme.getColor(colorRegistry_1.diffRemoved) || colorRegistry_1.defaultRemoveColor).transparent(2);
                return { insertColor, removeColor };
            });
            const viewportDomElement = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewportDomElement.setClassName('diffViewport');
            viewportDomElement.setPosition('absolute');
            const diffOverviewRoot = (0, dom_1.h)('div.diffOverview', {
                style: { position: 'absolute', top: '0px', width: OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH + 'px' }
            }).root;
            this._register((0, utils_1.appendRemoveOnDispose)(diffOverviewRoot, viewportDomElement.domNode));
            this._register((0, dom_1.addStandardDisposableListener)(diffOverviewRoot, dom_1.EventType.POINTER_DOWN, (e) => {
                this._editors.modified.delegateVerticalScrollbarPointerDown(e);
            }));
            this._register((0, dom_1.addDisposableListener)(diffOverviewRoot, dom_1.EventType.MOUSE_WHEEL, (e) => {
                this._editors.modified.delegateScrollFromMouseWheelEvent(e);
            }, { passive: false }));
            this._register((0, utils_1.appendRemoveOnDispose)(this._rootElement, diffOverviewRoot));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description recreate overview rules when model changes */
                const m = this._diffModel.read(reader);
                const originalOverviewRuler = this._editors.original.createOverviewRuler('original diffOverviewRuler');
                if (originalOverviewRuler) {
                    store.add(originalOverviewRuler);
                    store.add((0, utils_1.appendRemoveOnDispose)(diffOverviewRoot, originalOverviewRuler.getDomNode()));
                }
                const modifiedOverviewRuler = this._editors.modified.createOverviewRuler('modified diffOverviewRuler');
                if (modifiedOverviewRuler) {
                    store.add(modifiedOverviewRuler);
                    store.add((0, utils_1.appendRemoveOnDispose)(diffOverviewRoot, modifiedOverviewRuler.getDomNode()));
                }
                if (!originalOverviewRuler || !modifiedOverviewRuler) {
                    // probably no model
                    return;
                }
                const origViewZonesChanged = (0, observable_1.observableSignalFromEvent)('viewZoneChanged', this._editors.original.onDidChangeViewZones);
                const modViewZonesChanged = (0, observable_1.observableSignalFromEvent)('viewZoneChanged', this._editors.modified.onDidChangeViewZones);
                const origHiddenRangesChanged = (0, observable_1.observableSignalFromEvent)('hiddenRangesChanged', this._editors.original.onDidChangeHiddenAreas);
                const modHiddenRangesChanged = (0, observable_1.observableSignalFromEvent)('hiddenRangesChanged', this._editors.modified.onDidChangeHiddenAreas);
                store.add((0, observable_1.autorun)(reader => {
                    /** @description set overview ruler zones */
                    origViewZonesChanged.read(reader);
                    modViewZonesChanged.read(reader);
                    origHiddenRangesChanged.read(reader);
                    modHiddenRangesChanged.read(reader);
                    const colors = currentColors.read(reader);
                    const diff = m?.diff.read(reader)?.mappings;
                    function createZones(ranges, color, editor) {
                        const vm = editor._getViewModel();
                        if (!vm) {
                            return [];
                        }
                        return ranges
                            .filter(d => d.length > 0)
                            .map(r => {
                            const start = vm.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(r.startLineNumber, 1));
                            const end = vm.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(r.endLineNumberExclusive, 1));
                            // By computing the lineCount, we won't ask the view model later for the bottom vertical position.
                            // (The view model will take into account the alignment viewzones, which will give
                            // modifications and deletetions always the same height.)
                            const lineCount = end.lineNumber - start.lineNumber;
                            return new overviewZoneManager_1.OverviewRulerZone(start.lineNumber, end.lineNumber, lineCount, color.toString());
                        });
                    }
                    const originalZones = createZones((diff || []).map(d => d.lineRangeMapping.original), colors.removeColor, this._editors.original);
                    const modifiedZones = createZones((diff || []).map(d => d.lineRangeMapping.modified), colors.insertColor, this._editors.modified);
                    originalOverviewRuler?.setZones(originalZones);
                    modifiedOverviewRuler?.setZones(modifiedZones);
                }));
                store.add((0, observable_1.autorun)(reader => {
                    /** @description layout overview ruler */
                    const height = this._rootHeight.read(reader);
                    const width = this._rootWidth.read(reader);
                    const layoutInfo = this._modifiedEditorLayoutInfo.read(reader);
                    if (layoutInfo) {
                        const freeSpace = OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH - 2 * OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH;
                        originalOverviewRuler.setLayout({
                            top: 0,
                            height: height,
                            right: freeSpace + OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH,
                            width: OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH,
                        });
                        modifiedOverviewRuler.setLayout({
                            top: 0,
                            height: height,
                            right: 0,
                            width: OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH,
                        });
                        const scrollTop = this._editors.modifiedScrollTop.read(reader);
                        const scrollHeight = this._editors.modifiedScrollHeight.read(reader);
                        const scrollBarOptions = this._editors.modified.getOption(103 /* EditorOption.scrollbar */);
                        const state = new scrollbarState_1.ScrollbarState(scrollBarOptions.verticalHasArrows ? scrollBarOptions.arrowSize : 0, scrollBarOptions.verticalScrollbarSize, 0, layoutInfo.height, scrollHeight, scrollTop);
                        viewportDomElement.setTop(state.getSliderPosition());
                        viewportDomElement.setHeight(state.getSliderSize());
                    }
                    else {
                        viewportDomElement.setTop(0);
                        viewportDomElement.setHeight(0);
                    }
                    diffOverviewRoot.style.height = height + 'px';
                    diffOverviewRoot.style.left = (width - OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH) + 'px';
                    viewportDomElement.setWidth(OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH);
                }));
            }));
        }
    };
    exports.OverviewRulerFeature = OverviewRulerFeature;
    exports.OverviewRulerFeature = OverviewRulerFeature = OverviewRulerFeature_1 = __decorate([
        __param(6, themeService_1.IThemeService)
    ], OverviewRulerFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdSdWxlckZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9mZWF0dXJlcy9vdmVydmlld1J1bGVyRmVhdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVOztpQkFDM0IsdUJBQWtCLEdBQUcsRUFBRSxBQUFMLENBQU07aUJBQ3pCLCtCQUEwQixHQUFHLHNCQUFvQixDQUFDLGtCQUFrQixHQUFHLENBQUMsQUFBOUMsQ0FBK0M7UUFHaEcsWUFDa0IsUUFBMkIsRUFDM0IsWUFBeUIsRUFDekIsVUFBd0QsRUFDeEQsVUFBK0IsRUFDL0IsV0FBZ0MsRUFDaEMseUJBQStELEVBQ2pFLGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBUlMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsaUJBQVksR0FBWixZQUFZLENBQWE7WUFDekIsZUFBVSxHQUFWLFVBQVUsQ0FBOEM7WUFDeEQsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7WUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBQ2hDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBc0M7WUFDaEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFUN0MsVUFBSyxHQUFHLHNCQUFvQixDQUFDLDBCQUEwQixDQUFDO1lBYXZFLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUVsSSxNQUFNLGFBQWEsR0FBRyxJQUFBLG9C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