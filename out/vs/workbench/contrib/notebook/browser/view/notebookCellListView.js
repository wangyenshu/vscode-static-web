/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/list/listView", "vs/editor/common/model/prefixSumComputer"], function (require, exports, listView_1, prefixSumComputer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellListView = exports.NotebookCellsLayout = void 0;
    class NotebookCellsLayout {
        get paddingTop() {
            return this._paddingTop;
        }
        set paddingTop(paddingTop) {
            this._size = this._size + paddingTop - this._paddingTop;
            this._paddingTop = paddingTop;
        }
        get count() {
            return this._items.length;
        }
        /**
         * Returns the sum of the sizes of all items in the range map.
         */
        get size() {
            return this._size;
        }
        constructor(topPadding) {
            this._items = [];
            this._whitespace = [];
            this._prefixSumComputer = new prefixSumComputer_1.ConstantTimePrefixSumComputer([]);
            this._size = 0;
            this._paddingTop = 0;
            this._paddingTop = topPadding ?? 0;
            this._size = this._paddingTop;
        }
        getWhitespaces() {
            return this._whitespace;
        }
        restoreWhitespace(items) {
            this._whitespace = items;
            this._size = this._paddingTop + this._items.reduce((total, item) => total + item.size, 0) + this._whitespace.reduce((total, ws) => total + ws.size, 0);
        }
        /**
         */
        splice(index, deleteCount, items) {
            const inserts = items ?? [];
            // Perform the splice operation on the items array.
            this._items.splice(index, deleteCount, ...inserts);
            this._size = this._paddingTop + this._items.reduce((total, item) => total + item.size, 0) + this._whitespace.reduce((total, ws) => total + ws.size, 0);
            this._prefixSumComputer.removeValues(index, deleteCount);
            // inserts should also include whitespaces
            const newSizes = [];
            for (let i = 0; i < inserts.length; i++) {
                const insertIndex = i + index;
                const existingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === insertIndex + 1);
                if (existingWhitespaces.length > 0) {
                    newSizes.push(inserts[i].size + existingWhitespaces.reduce((acc, ws) => acc + ws.size, 0));
                }
                else {
                    newSizes.push(inserts[i].size);
                }
            }
            this._prefixSumComputer.insertValues(index, newSizes);
            // Now that the items array has been updated, and the whitespaces are updated elsewhere, if an item is removed/inserted, the accumlated size of the items are all updated.
            // Loop through all items from the index where the splice started, to the end
            for (let i = index; i < this._items.length; i++) {
                const existingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === i + 1);
                if (existingWhitespaces.length > 0) {
                    this._prefixSumComputer.setValue(i, this._items[i].size + existingWhitespaces.reduce((acc, ws) => acc + ws.size, 0));
                }
                else {
                    this._prefixSumComputer.setValue(i, this._items[i].size);
                }
            }
        }
        insertWhitespace(id, afterPosition, size) {
            let priority = 0;
            const existingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === afterPosition);
            if (existingWhitespaces.length > 0) {
                priority = Math.max(...existingWhitespaces.map(ws => ws.priority)) + 1;
            }
            this._whitespace.push({ id, afterPosition: afterPosition, size, priority });
            this._size += size; // Update the total size to include the whitespace
            this._whitespace.sort((a, b) => {
                if (a.afterPosition === b.afterPosition) {
                    return a.priority - b.priority;
                }
                return a.afterPosition - b.afterPosition;
            });
            // find item size of index
            if (afterPosition > 0) {
                const index = afterPosition - 1;
                const itemSize = this._items[index].size;
                const accSize = itemSize + size;
                this._prefixSumComputer.setValue(index, accSize);
            }
        }
        changeOneWhitespace(id, afterPosition, size) {
            const whitespaceIndex = this._whitespace.findIndex(ws => ws.id === id);
            if (whitespaceIndex !== -1) {
                const whitespace = this._whitespace[whitespaceIndex];
                const oldAfterPosition = whitespace.afterPosition;
                whitespace.afterPosition = afterPosition;
                const oldSize = whitespace.size;
                const delta = size - oldSize;
                whitespace.size = size;
                this._size += delta;
                if (oldAfterPosition > 0 && oldAfterPosition <= this._items.length) {
                    const index = oldAfterPosition - 1;
                    const itemSize = this._items[index].size;
                    const accSize = itemSize;
                    this._prefixSumComputer.setValue(index, accSize);
                }
                if (afterPosition > 0 && afterPosition <= this._items.length) {
                    const index = afterPosition - 1;
                    const itemSize = this._items[index].size;
                    const accSize = itemSize + size;
                    this._prefixSumComputer.setValue(index, accSize);
                }
            }
        }
        removeWhitespace(id) {
            const whitespaceIndex = this._whitespace.findIndex(ws => ws.id === id);
            if (whitespaceIndex !== -1) {
                const whitespace = this._whitespace[whitespaceIndex];
                this._whitespace.splice(whitespaceIndex, 1);
                this._size -= whitespace.size; // Reduce the total size by the size of the removed whitespace
                if (whitespace.afterPosition > 0) {
                    const index = whitespace.afterPosition - 1;
                    const itemSize = this._items[index].size;
                    const remainingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === whitespace.afterPosition);
                    const accSize = itemSize + remainingWhitespaces.reduce((acc, ws) => acc + ws.size, 0);
                    this._prefixSumComputer.setValue(index, accSize);
                }
            }
        }
        /**
         * find position of whitespace
         * @param id: id of the whitespace
         * @returns: position in the list view
         */
        getWhitespacePosition(id) {
            const whitespace = this._whitespace.find(ws => ws.id === id);
            if (!whitespace) {
                throw new Error('Whitespace not found');
            }
            const afterPosition = whitespace.afterPosition;
            if (afterPosition === 0) {
                // find all whitespaces at the same position but with higher priority (smaller number)
                const whitespaces = this._whitespace.filter(ws => ws.afterPosition === afterPosition && ws.priority < whitespace.priority);
                return whitespaces.reduce((acc, ws) => acc + ws.size, 0) + this.paddingTop;
            }
            const whitespaceBeforeFirstItem = this._whitespace.filter(ws => ws.afterPosition === 0).reduce((acc, ws) => acc + ws.size, 0);
            // previous item index
            const index = afterPosition - 1;
            const previousItemPosition = this._prefixSumComputer.getPrefixSum(index);
            const previousItemSize = this._items[index].size;
            const previousWhitespace = this._whitespace.filter(ws => ws.afterPosition === afterPosition - 1);
            const whitespaceBefore = previousWhitespace.reduce((acc, ws) => acc + ws.size, 0);
            return previousItemPosition + previousItemSize + whitespaceBeforeFirstItem + this.paddingTop + whitespaceBefore;
        }
        indexAt(position) {
            if (position < 0) {
                return -1;
            }
            const whitespaceBeforeFirstItem = this._whitespace.filter(ws => ws.afterPosition === 0).reduce((acc, ws) => acc + ws.size, 0);
            const offset = position - (this._paddingTop + whitespaceBeforeFirstItem);
            if (offset <= 0) {
                return 0;
            }
            if (offset >= (this._size - this._paddingTop - whitespaceBeforeFirstItem)) {
                return this.count;
            }
            return this._prefixSumComputer.getIndexOf(offset).index;
        }
        indexAfter(position) {
            const index = this.indexAt(position);
            return Math.min(index + 1, this._items.length);
        }
        positionAt(index) {
            if (index < 0) {
                return -1;
            }
            if (this.count === 0) {
                return -1;
            }
            // index is zero based, if index+1 > this.count, then it points to the fictitious element after the last element of this array.
            if (index >= this.count) {
                return -1;
            }
            const whitespaceBeforeFirstItem = this._whitespace.filter(ws => ws.afterPosition === 0).reduce((acc, ws) => acc + ws.size, 0);
            return this._prefixSumComputer.getPrefixSum(index /** count */) + this._paddingTop + whitespaceBeforeFirstItem;
        }
    }
    exports.NotebookCellsLayout = NotebookCellsLayout;
    class NotebookCellListView extends listView_1.ListView {
        constructor() {
            super(...arguments);
            this._lastWhitespaceId = 0;
            this._renderingStack = 0;
        }
        get inRenderingTransaction() {
            return this._renderingStack > 0;
        }
        get notebookRangeMap() {
            return this.rangeMap;
        }
        render(previousRenderRange, renderTop, renderHeight, renderLeft, scrollWidth, updateItemsInDOM) {
            this._renderingStack++;
            super.render(previousRenderRange, renderTop, renderHeight, renderLeft, scrollWidth, updateItemsInDOM);
            this._renderingStack--;
        }
        _rerender(renderTop, renderHeight, inSmoothScrolling) {
            this._renderingStack++;
            super._rerender(renderTop, renderHeight, inSmoothScrolling);
            this._renderingStack--;
        }
        createRangeMap(paddingTop) {
            const existingMap = this.rangeMap;
            if (existingMap) {
                const layout = new NotebookCellsLayout(paddingTop);
                layout.restoreWhitespace(existingMap.getWhitespaces());
                return layout;
            }
            else {
                return new NotebookCellsLayout(paddingTop);
            }
        }
        insertWhitespace(afterPosition, size) {
            const scrollTop = this.scrollTop;
            const id = `${++this._lastWhitespaceId}`;
            const previousRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            const elementPosition = this.elementTop(afterPosition);
            const aboveScrollTop = scrollTop > elementPosition;
            this.notebookRangeMap.insertWhitespace(id, afterPosition, size);
            const newScrolltop = aboveScrollTop ? scrollTop + size : scrollTop;
            this.render(previousRenderRange, newScrolltop, this.lastRenderHeight, undefined, undefined, false);
            this._rerender(newScrolltop, this.renderHeight, false);
            this.eventuallyUpdateScrollDimensions();
            return id;
        }
        changeOneWhitespace(id, newAfterPosition, newSize) {
            this.notebookRangeMap.changeOneWhitespace(id, newAfterPosition, newSize);
            this.eventuallyUpdateScrollDimensions();
        }
        removeWhitespace(id) {
            const scrollTop = this.scrollTop;
            const previousRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            const currentPosition = this.notebookRangeMap.getWhitespacePosition(id);
            if (currentPosition > scrollTop) {
                this.notebookRangeMap.removeWhitespace(id);
                this.render(previousRenderRange, scrollTop, this.lastRenderHeight, undefined, undefined, false);
                this._rerender(scrollTop, this.renderHeight, false);
                this.eventuallyUpdateScrollDimensions();
            }
            else {
                this.notebookRangeMap.removeWhitespace(id);
                this.eventuallyUpdateScrollDimensions();
            }
        }
        getWhitespacePosition(id) {
            return this.notebookRangeMap.getWhitespacePosition(id);
        }
    }
    exports.NotebookCellListView = NotebookCellListView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsTGlzdFZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvbm90ZWJvb2tDZWxsTGlzdFZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFhLG1CQUFtQjtRQU8vQixJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLFVBQWtCO1lBQ2hDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUN4RCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFJLElBQUk7WUFDUCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELFlBQVksVUFBbUI7WUExQnZCLFdBQU0sR0FBWSxFQUFFLENBQUM7WUFDckIsZ0JBQVcsR0FBa0IsRUFBRSxDQUFDO1lBQzlCLHVCQUFrQixHQUFrQyxJQUFJLGlEQUE2QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVGLFVBQUssR0FBRyxDQUFDLENBQUM7WUFDVixnQkFBVyxHQUFHLENBQUMsQ0FBQztZQXVCdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLElBQUksQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUMvQixDQUFDO1FBRUQsY0FBYztZQUNiLE9BQU8s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