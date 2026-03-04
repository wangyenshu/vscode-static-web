/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/diff/rangeMapping", "vs/editor/common/model", "vs/nls"], function (require, exports, dom_1, iconLabels_1, codicons_1, lifecycle_1, observable_1, lineRange_1, range_1, rangeMapping_1, model_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RevertButton = exports.RevertButtonsFeature = void 0;
    const emptyArr = [];
    class RevertButtonsFeature extends lifecycle_1.Disposable {
        constructor(_editors, _diffModel, _options, _widget) {
            super();
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._widget = _widget;
            this._selectedDiffs = (0, observable_1.derived)(this, (reader) => {
                /** @description selectedDiffs */
                const model = this._diffModel.read(reader);
                const diff = model?.diff.read(reader);
                // Return `emptyArr` because it is a constant. [] is always a new array and would trigger a change.
                if (!diff) {
                    return emptyArr;
                }
                const selections = this._editors.modifiedSelections.read(reader);
                if (selections.every(s => s.isEmpty())) {
                    return emptyArr;
                }
                const selectedLineNumbers = new lineRange_1.LineRangeSet(selections.map(s => lineRange_1.LineRange.fromRangeInclusive(s)));
                const selectedMappings = diff.mappings.filter(m => m.lineRangeMapping.innerChanges && selectedLineNumbers.intersects(m.lineRangeMapping.modified));
                const result = selectedMappings.map(mapping => ({
                    mapping,
                    rangeMappings: mapping.lineRangeMapping.innerChanges.filter(c => selections.some(s => range_1.Range.areIntersecting(c.modifiedRange, s)))
                }));
                if (result.length === 0 || result.every(r => r.rangeMappings.length === 0)) {
                    return emptyArr;
                }
                return result;
            });
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                if (!this._options.shouldRenderOldRevertArrows.read(reader)) {
                    return;
                }
                const model = this._diffModel.read(reader);
                const diff = model?.diff.read(reader);
                if (!model || !diff) {
                    return;
                }
                if (model.movedTextToCompare.read(reader)) {
                    return;
                }
                const glyphWidgetsModified = [];
                const selectedDiffs = this._selectedDiffs.read(reader);
                const selectedDiffsSet = new Set(selectedDiffs.map(d => d.mapping));
                if (selectedDiffs.length > 0) {
                    // The button to revert the selection
                    const selections = this._editors.modifiedSelections.read(reader);
                    const btn = store.add(new RevertButton(selections[selections.length - 1].positionLineNumber, this._widget, selectedDiffs.flatMap(d => d.rangeMappings), true));
                    this._editors.modified.addGlyphMarginWidget(btn);
                    glyphWidgetsModified.push(btn);
                }
                for (const m of diff.mappings) {
                    if (selectedDiffsSet.has(m)) {
                        continue;
                    }
                    if (!m.lineRangeMapping.modified.isEmpty && m.lineRangeMapping.innerChanges) {
                        const btn = store.add(new RevertButton(m.lineRangeMapping.modified.startLineNumber, this._widget, m.lineRangeMapping, false));
                        this._editors.modified.addGlyphMarginWidget(btn);
                        glyphWidgetsModified.push(btn);
                    }
                }
                store.add((0, lifecycle_1.toDisposable)(() => {
                    for (const w of glyphWidgetsModified) {
                        this._editors.modified.removeGlyphMarginWidget(w);
                    }
                }));
            }));
        }
    }
    exports.RevertButtonsFeature = RevertButtonsFeature;
    class RevertButton extends lifecycle_1.Disposable {
        static { this.counter = 0; }
        getId() { return this._id; }
        constructor(_lineNumber, _widget, _diffs, _revertSelection) {
            super();
            this._lineNumber = _lineNumber;
            this._widget = _widget;
            this._diffs = _diffs;
            this._revertSelection = _revertSelection;
            this._id = `revertButton${RevertButton.counter++}`;
            this._domNode = (0, dom_1.h)('div.revertButton', {
                title: this._revertSelection
                    ? (0, nls_1.localize)('revertSelectedChanges', 'Revert Selected Changes')
                    : (0, nls_1.localize)('revertChange', 'Revert Change')
            }, [(0, iconLabels_1.renderIcon)(codicons_1.Codicon.arrowRight)]).root;
            this._register((0, dom_1.addDisposableListener)(this._domNode, dom_1.EventType.MOUSE_DOWN, e => {
                // don't prevent context menu from showing up
                if (e.button !== 2) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this._domNode, dom_1.EventType.MOUSE_UP, e => {
                e.stopPropagation();
                e.preventDefault();
            }));
            this._register((0, dom_1.addDisposableListener)(this._domNode, dom_1.EventType.CLICK, (e) => {
                if (this._diffs instanceof rangeMapping_1.LineRangeMapping) {
                    this._widget.revert(this._diffs);
                }
                else {
                    this._widget.revertRangeMappings(this._diffs);
                }
                e.stopPropagation();
                e.preventDefault();
            }));
        }
        /**
         * Get the dom node of the glyph widget.
         */
        getDomNode() {
            return this._domNode;
        }
        /**
         * Get the placement of the glyph widget.
         */
        getPosition() {
            return {
                lane: model_1.GlyphMarginLane.Right,
                range: {
                    startColumn: 1,
                    startLineNumber: this._lineNumber,
                    endColumn: 1,
                    endLineNumber: this._lineNumber,
                },
                zIndex: 10001,
            };
        }
    }
    exports.RevertButton = RevertButton;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV2ZXJ0QnV0dG9uc0ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9mZWF0dXJlcy9yZXZlcnRCdXR0b25zRmVhdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQU0sUUFBUSxHQUFZLEVBQUUsQ0FBQztJQUU3QixNQUFhLG9CQUFxQixTQUFRLHNCQUFVO1FBQ25ELFlBQ2tCLFFBQTJCLEVBQzNCLFVBQXdELEVBQ3hELFFBQTJCLEVBQzNCLE9BQXlCO1lBRTFDLEtBQUssRUFBRSxDQUFDO1lBTFMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsZUFBVSxHQUFWLFVBQVUsQ0FBOEM7WUFDeEQsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsWUFBTyxHQUFQLE9BQU8sQ0FBa0I7WUFvRDFCLG1CQUFjLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUMxRCxpQ0FBaUM7Z0JBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsbUdBQW1HO2dCQUNuRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQUMsT0FBTyxRQUFRLENBQUM7Z0JBQUMsQ0FBQztnQkFFL0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pFLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMs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