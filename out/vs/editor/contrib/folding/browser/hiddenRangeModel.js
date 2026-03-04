/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/event", "vs/editor/common/core/range", "vs/editor/common/core/eolCounter"], function (require, exports, arraysFind_1, event_1, range_1, eolCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HiddenRangeModel = void 0;
    class HiddenRangeModel {
        get onDidChange() { return this._updateEventEmitter.event; }
        get hiddenRanges() { return this._hiddenRanges; }
        constructor(model) {
            this._updateEventEmitter = new event_1.Emitter();
            this._hasLineChanges = false;
            this._foldingModel = model;
            this._foldingModelListener = model.onDidChange(_ => this.updateHiddenRanges());
            this._hiddenRanges = [];
            if (model.regions.length) {
                this.updateHiddenRanges();
            }
        }
        notifyChangeModelContent(e) {
            if (this._hiddenRanges.length && !this._hasLineChanges) {
                this._hasLineChanges = e.changes.some(change => {
                    return change.range.endLineNumber !== change.range.startLineNumber || (0, eolCounter_1.countEOL)(change.text)[0] !== 0;
                });
            }
        }
        updateHiddenRanges() {
            let updateHiddenAreas = false;
            const newHiddenAreas = [];
            let i = 0; // index into hidden
            let k = 0;
            let lastCollapsedStart = Number.MAX_VALUE;
            let lastCollapsedEnd = -1;
            const ranges = this._foldingModel.regions;
            for (; i < ranges.length; i++) {
                if (!ranges.isCollapsed(i)) {
                    continue;
                }
                const startLineNumber = ranges.getStartLineNumber(i) + 1; // the first line is not hidden
                const endLineNumber = ranges.getEndLineNumber(i);
                if (lastCollapsedStart <= startLineNumber && endLineNumber <= lastCollapsedEnd) {
                    // ignore ranges contained in collapsed regions
                    continue;
                }
                if (!updateHiddenAreas && k < this._hiddenRanges.length && this._hiddenRanges[k].startLineNumber === startLineNumber && this._hiddenRanges[k].endLineNumber === endLineNumber) {
                    // reuse the old ranges
                    newHiddenAreas.push(this._hiddenRanges[k]);
                    k++;
                }
                else {
                    updateHiddenAreas = true;
                    newHiddenAreas.push(new range_1.Range(startLineNumber, 1, endLineNumber, 1));
                }
                lastCollapsedStart = startLineNumber;
                lastCollapsedEnd = endLineNumber;
            }
            if (this._hasLineChanges || updateHiddenAreas || k < this._hiddenRanges.length) {
                this.applyHiddenRanges(newHiddenAreas);
            }
        }
        applyHiddenRanges(newHiddenAreas) {
            this._hiddenRanges = newHiddenAreas;
            this._hasLineChanges = false;
            this._updateEventEmitter.fire(newHiddenAreas);
        }
        hasRanges() {
            return this._hiddenRanges.length > 0;
        }
        isHidden(line) {
            return findRange(this._hiddenRanges, line) !== null;
        }
        adjustSelections(selections) {
            let hasChanges = false;
            const editorModel = this._foldingModel.textModel;
            let lastRange = null;
            const adjustLine = (line) => {
                if (!lastRange || !isInside(line, lastRange)) {
                    lastRange = findRange(this._hiddenRanges, line);
                }
                if (lastRange) {
                    return lastRange.startLineNumber - 1;
                }
                return null;
            };
            for (let i = 0, len = selections.length; i < len; i++) {
                let selection = selections[i];
                const adjustedStartLine = adjustLine(selection.startLineNumber);
                if (adjustedStartLine) {
                    selection = selection.setStartPosition(adjustedStartLine, editorModel.getLineMaxColumn(adjustedStartLine));
                    hasChanges = true;
                }
                const adjustedEndLine = adjustLine(selection.endLineNumber);
                if (adjustedEndLine) {
                    selection = selection.setEndPosition(adjustedEndLine, editorModel.getLineMaxColumn(adjustedEndLine));
                    hasChanges = true;
                }
                selections[i] = selection;
            }
            return hasChanges;
        }
        dispose() {
            if (this.hiddenRanges.length > 0) {
                this._hiddenRanges = [];
                this._updateEventEmitter.fire(this._hiddenRanges);
            }
            if (this._foldingModelListener) {
                this._foldingModelListener.dispose();
                this._foldingModelListener = null;
            }
        }
    }
    exports.HiddenRangeModel = HiddenRangeModel;
    function isInside(line, range) {
        return line >= range.startLineNumber && line <= range.endLineNumber;
    }
    function findRange(ranges, line) {
        const i = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(ranges, r => line < r.startLineNumber) - 1;
        if (i >= 0 && ranges[i].endLineNumber >= line) {
            return ranges[i];
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlkZGVuUmFuZ2VNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZvbGRpbmcvYnJvd3Nlci9oaWRkZW5SYW5nZU1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLGdCQUFnQjtRQVE1QixJQUFXLFdBQVcsS0FBc0IsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwRixJQUFXLFlBQVksS0FBSyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBRXhELFlBQW1CLEtBQW1CO1lBTnJCLHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUFZLENBQUM7WUFDdkQsb0JBQWUsR0FBWSxLQUFLLENBQUM7WUFNeEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDM0IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFTSx3QkFBd0IsQ0FBQyxDQUE0QjtZQUMzRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN4RCxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUM5QyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxJQUFJLElBQUEscUJBQVEsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN0RyxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQzlCLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7WUFDL0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRVYsSUFBSSxrQkFBa0IsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1lBQzFDLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDMUMsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUM1QixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLCtCQUErQjtnQkFDekYsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLGtCQUFrQixJQUFJLGVBQWUsSUFBSSxhQUFhLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDaEYsK0NBQStDO29CQUMvQyxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsS0FBSyxlQUFlLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLEtBQUssYUFBYSxFQUFFLENBQUM7b0JBQy9LLHVCQUF1QjtvQkFDdkIsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLENBQUMsRUFBRSxDQUFDO2dCQUNMLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxpQkFBaUIsR0FBRyxJQUFJLENBQUM7b0JBQ3pCLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztnQkFDRCxrQkFBa0IsR0FBRyxlQUFlLENBQUM7Z0JBQ3JDLGdCQUFnQixHQUFHLGFBQWEsQ0FBQztZQUNsQyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLGlCQUFpQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoRixJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDeEMsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxjQUF3QjtZQUNqRCxJQUFJLENBQUMsYUFBYSxHQUFHLGNBQWMsQ0FBQztZQUNwQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztZQUM3QixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFTSxTQUFTO1lBQ2YsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVNLFFBQVEsQ0FBQyxJQUFZO1lBQzNCLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDO1FBQ3JELENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxVQUF1QjtZQUM5QyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUM7WUFDakQsSUFBSSxTQUFTLEdBQWtCLElBQUksQ0FBQztZQUVwQyxNQUFNLFVBQVUsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUNuQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUM5QyxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2pELENBQUM7Z0JBQ0QsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixPQUFPLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDO1lBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLE1BQU0saUJBQWlCLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUN2QixTQUFTLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQzNHLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ25CLENBQUM7Z0JBQ0QsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDckIsU0FBUyxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO29CQUNyRyxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUNuQixDQUFDO2dCQUNELFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFHTSxPQUFPO1lBQ2IsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFDbkMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQTFIRCw0Q0EwSEM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFZLEVBQUUsS0FBYTtRQUM1QyxPQUFPLElBQUksSUFBSSxLQUFLLENBQUMsZUFBZSxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDO0lBQ3JFLENBQUM7SUFDRCxTQUFTLFNBQVMsQ0FBQyxNQUFnQixFQUFFLElBQVk7UUFDaEQsTUFBTSxDQUFDLEdBQUcsSUFBQSwyQ0FBOEIsRUFBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUMvQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDIn0=