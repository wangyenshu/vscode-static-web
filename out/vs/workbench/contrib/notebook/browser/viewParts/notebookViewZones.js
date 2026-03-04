/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, fastDomNode_1, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookViewZones = void 0;
    const invalidFunc = () => { throw new Error(`Invalid notebook view zone change accessor`); };
    class NotebookViewZones extends lifecycle_1.Disposable {
        constructor(listView, coordinator) {
            super();
            this.listView = listView;
            this.coordinator = coordinator;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName('view-zones');
            this.domNode.setPosition('absolute');
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.domNode.setWidth('100%');
            this._zones = {};
            this.listView.containerDomNode.appendChild(this.domNode.domNode);
        }
        changeViewZones(callback) {
            let zonesHaveChanged = false;
            const changeAccessor = {
                addZone: (zone) => {
                    zonesHaveChanged = true;
                    return this._addZone(zone);
                },
                removeZone: (id) => {
                    zonesHaveChanged = true;
                    // TODO: validate if zones have changed layout
                    this._removeZone(id);
                },
                layoutZone: (id) => {
                    zonesHaveChanged = true;
                    // TODO: validate if zones have changed layout
                    this._layoutZone(id);
                }
            };
            safeInvoke1Arg(callback, changeAccessor);
            // Invalidate changeAccessor
            changeAccessor.addZone = invalidFunc;
            changeAccessor.removeZone = invalidFunc;
            changeAccessor.layoutZone = invalidFunc;
            return zonesHaveChanged;
        }
        onCellsChanged(e) {
            const splices = e.splices.slice().reverse();
            splices.forEach(splice => {
                const [start, deleted, newCells] = splice;
                const fromIndex = start;
                const toIndex = start + deleted;
                // 1, 2, 0
                // delete cell index 1 and 2
                // from index 1, to index 3 (exclusive): [1, 3)
                // if we have whitespace afterModelPosition 3, which is after cell index 2
                for (const id in this._zones) {
                    const zone = this._zones[id].zone;
                    const cellBeforeWhitespaceIndex = zone.afterModelPosition - 1;
                    if (cellBeforeWhitespaceIndex >= fromIndex && cellBeforeWhitespaceIndex < toIndex) {
                        // The cell this whitespace was after has been deleted
                        //  => move whitespace to before first deleted cell
                        zone.afterModelPosition = fromIndex;
                        this._updateWhitespace(this._zones[id]);
                    }
                    else if (cellBeforeWhitespaceIndex >= toIndex) {
                        // adjust afterModelPosition for all other cells
                        const insertLength = newCells.length;
                        const offset = insertLength - deleted;
                        zone.afterModelPosition += offset;
                        this._updateWhitespace(this._zones[id]);
                    }
                }
            });
        }
        onHiddenRangesChange() {
            for (const id in this._zones) {
                this._updateWhitespace(this._zones[id]);
            }
        }
        _updateWhitespace(zone) {
            const whitespaceId = zone.whitespaceId;
            const viewPosition = this.coordinator.convertModelIndexToViewIndex(zone.zone.afterModelPosition);
            const isInHiddenArea = this._isInHiddenRanges(zone.zone);
            zone.isInHiddenArea = isInHiddenArea;
            this.listView.changeOneWhitespace(whitespaceId, viewPosition, isInHiddenArea ? 0 : zone.zone.heightInPx);
        }
        layout() {
            for (const id in this._zones) {
                this._layoutZone(id);
            }
        }
        _addZone(zone) {
            const viewPosition = this.coordinator.convertModelIndexToViewIndex(zone.afterModelPosition);
            const whitespaceId = this.listView.insertWhitespace(viewPosition, zone.heightInPx);
            const isInHiddenArea = this._isInHiddenRanges(zone);
            const myZone = {
                whitespaceId: whitespaceId,
                zone: zone,
                domNode: (0, fastDomNode_1.createFastDomNode)(zone.domNode),
                isInHiddenArea: isInHiddenArea
            };
            this._zones[whitespaceId] = myZone;
            myZone.domNode.setPosition('absolute');
            myZone.domNode.domNode.style.width = '100%';
            myZone.domNode.setDisplay('none');
            myZone.domNode.setAttribute('notebook-view-zone', whitespaceId);
            this.domNode.appendChild(myZone.domNode);
            return whitespaceId;
        }
        _removeZone(id) {
            this.listView.removeWhitespace(id);
            delete this._zones[id];
        }
        _layoutZone(id) {
            const zoneWidget = this._zones[id];
            if (!zoneWidget) {
                return;
            }
            this._updateWhitespace(this._zones[id]);
            const isInHiddenArea = this._isInHiddenRanges(zoneWidget.zone);
            if (isInHiddenArea) {
                zoneWidget.domNode.setDisplay('none');
            }
            else {
                const top = this.listView.getWhitespacePosition(zoneWidget.whitespaceId);
                zoneWidget.domNode.setTop(top);
                zoneWidget.domNode.setDisplay('block');
                zoneWidget.domNode.setHeight(zoneWidget.zone.heightInPx);
            }
        }
        _isInHiddenRanges(zone) {
            // The view zone is between two cells (zone.afterModelPosition - 1, zone.afterModelPosition)
            const afterIndex = zone.afterModelPosition;
            // In notebook, the first cell (markdown cell) in a folding range is always visible, so we need to check the cell after the notebook view zone
            return !this.coordinator.modelIndexIsVisible(afterIndex);
        }
        dispose() {
            super.dispose();
            this._zones = {};
        }
    }
    exports.NotebookViewZones = NotebookViewZones;
    function safeInvoke1Arg(func, arg1) {
        try {
            return func(arg1);
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWaWV3Wm9uZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdQYXJ0cy9ub3RlYm9va1ZpZXdab25lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBTSxXQUFXLEdBQUcsR0FBRyxFQUFFLEdBQUcsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBUzdGLE1BQWEsaUJBQWtCLFNBQVEsc0JBQVU7UUFJaEQsWUFBNkIsUUFBNkMsRUFBbUIsV0FBa0M7WUFDOUgsS0FBSyxFQUFFLENBQUM7WUFEb0IsYUFBUSxHQUFSLFFBQVEsQ0FBcUM7WUFBbUIsZ0JBQVcsR0FBWCxXQUFXLENBQXVCO1lBRTlILElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUVqQixJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFdB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