/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, DOM, async_1, lifecycle_1, platform, notebookBrowser_1, cellPart_1, notebookCellTextModel_1, notebookCommon_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDragAndDropController = exports.CellDragAndDropPart = void 0;
    exports.performCellDropEdits = performCellDropEdits;
    const $ = DOM.$;
    const DRAGGING_CLASS = 'cell-dragging';
    const GLOBAL_DRAG_CLASS = 'global-drag-active';
    class CellDragAndDropPart extends cellPart_1.CellContentPart {
        constructor(container) {
            super();
            this.container = container;
        }
        didRenderCell(element) {
            this.update(element);
        }
        updateState(element, e) {
            if (e.dragStateChanged) {
                this.update(element);
            }
        }
        update(element) {
            this.container.classList.toggle(DRAGGING_CLASS, element.dragging);
        }
    }
    exports.CellDragAndDropPart = CellDragAndDropPart;
    class CellDragAndDropController extends lifecycle_1.Disposable {
        constructor(notebookEditor, notebookListContainer) {
            super();
            this.notebookEditor = notebookEditor;
            this.notebookListContainer = notebookListContainer;
            this.draggedCells = [];
            this.isScrolling = false;
            this.listOnWillScrollListener = this._register(new lifecycle_1.MutableDisposable());
            this.listInsertionIndicator = DOM.append(notebookListContainer, $('.cell-list-insertion-indicator'));
            this._register(DOM.addDisposableListener(notebookListContainer.ownerDocument.body, DOM.EventType.DRAG_START, this.onGlobalDragStart.bind(this), true));
            this._register(DOM.addDisposableListener(notebookListContainer.ownerDocument.body, DOM.EventType.DRAG_END, this.onGlobalDragEnd.bind(this), true));
            const addCellDragListener = (eventType, handler, useCapture = false) => {
                this._register(DOM.addDisposableListener(notebookEditor.getDomNode(), eventType, e => {
                    const cellDragEvent = this.toCellDragEvent(e);
                    if (cellDragEvent) {
                        handler(cellDragEvent);
                    }
                }, useCapture));
            };
            addCellDragListener(DOM.EventType.DRAG_OVER, event => {
                if (!this.currentDraggedCell) {
                    return;
                }
                event.browserEvent.preventDefault();
                this.onCellDragover(event);
            }, true);
            addCellDragListener(DOM.EventType.DROP, event => {
                if (!this.currentDraggedCell) {
                    return;
                }
                event.browserEvent.preventDefault();
                this.onCellDrop(event);
            });
            addCellDragListener(DOM.EventType.DRAG_LEAVE, event => {
                event.browserEvent.preventDefault();
                this.onCellDragLeave(event);
            });
            this.scrollingDelayer = this._register(new async_1.Delayer(200));
        }
        setList(value) {
            this.list = value;
            this.listOnWillScrollListener.value = this.list.onWillScroll(e => {
                if (!e.scrollTopChanged) {
                    return;
                }
                this.setInsertIndicatorVisibility(false);
                this.isScrolling = true;
                this.scrollingDelayer.trigger(() => {
                    this.isScrolling = false;
                });
            });
        }
        setInsertIndicatorVisibility(visible) {
            this.listInsertionIndicator.style.opacity = visible ? '1' : '0';
        }
        toCellDragEvent(event) {
            const targetTop = this.notebookListContainer.getBoundingClientRect().top;
            const dragOffset = this.list.scrollTop + event.clientY - targetTop;
            const draggedOverCell = this.list.elementAt(dragOffset);
            if (!draggedOverCell) {
                return undefined;
            }
            const cellTop = this.list.getCellViewScrollTop(draggedOverCell);
            const cellHeight = this.list.elementHeight(draggedOverCell);
            const dragPosInElement = dragOffset - cellTop;
            const dragPosRatio = dragPosInElement / cellHeight;
            return {
                browserEvent: event,
                draggedOverCell,
                cellTop,
                cellHeight,
                dragPosRatio
            };
        }
        clearGlobalDragState() {
            this.notebookEditor.getDomNode().classList.remove(GLOBAL_DRAG_CLASS);
        }
        onGlobalDragStart() {
            this.notebookEditor.getDomNode().classList.add(GLOBAL_DRAG_CLASS);
        }
        onGlobalDragEnd() {
            this.notebookEditor.getDomNode().classList.remove(GLOBAL_DRAG_CLASS);
        }
        onCellDragover(event) {
            if (!event.browserEvent.dataTransfer) {
                return;
            }
            if (!this.currentDraggedCell) {
                event.browserEvent.dataTransfer.dropEffect = 'none';
                return;
            }
            if (this.isScrolling || this.currentDraggedCell === event.draggedOverCell) {
                this.setInsertIndicatorVisibility(false);
                return;
            }
            const dropDirection = this.getDropInsertDirection(event.dragPosRatio);
            const insertionIndicatorAbsolutePos = dropDirection === 'above' ? event.cellTop : event.cellTop + event.cellHeight;
            this.updateInsertIndicator(dropDirection, insertionIndicatorAbsolutePos);
        }
        updateInsertIndicator(dropDirection, insertionIndicatorAbsolutePos) {
            const { bottomToolbarGap } = this.notebookEditor.notebookOptions.computeBottomToolbarDimensions(this.notebookEditor.textModel?.viewType);
            const insertionIndicatorTop = insertionIndicatorAbsolutePos - this.list.scrollTop + bottomToolbarGap / 2;
            if (insertionIndicatorTop >= 0) {
                this.listInsertionIndicator.style.top = `${insertionIndicatorTop}px`;
                this.setInsertIndicatorVisibility(true);
            }
            else {
                this.setInsertIndicatorVisibility(false);
            }
        }
        getDropInsertDirection(dragPosRatio) {
            return dragPosRatio < 0.5 ? 'above' : 'below';
        }
        onCellDrop(event) {
            const draggedCell = this.currentDraggedCell;
            if (this.isScrolling || this.currentDraggedCell === event.draggedOverCell) {
                return;
            }
            this.dragCleanup();
            const dropDirection = this.getDropInsertDirection(event.dragPosRatio);
            this._dropImpl(draggedCell, dropDirection, event.browserEvent, event.draggedOverCell);
        }
        getCellRangeAroundDragTarget(draggedCellIndex) {
            const selections = this.notebookEditor.getSelections();
            const modelRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(this.notebookEditor, selections);
            const nearestRange = modelRanges.find(range => range.start <= draggedCellIndex && draggedCellIndex < range.end);
            if (nearestRange) {
                return nearestRange;
            }
            else {
                return { start: draggedCellIndex, end: draggedCellIndex + 1 };
            }
        }
        _dropImpl(draggedCell, dropDirection, ctx, draggedOverCell) {
            const cellTop = this.list.getCellViewScrollTop(draggedOverCell);
            const cellHeight = this.list.elementHeight(draggedOverCell);
            const insertionIndicatorAbsolutePos = dropDirection === 'above' ? cellTop : cellTop + cellHeight;
            const { bottomToolbarGap } = this.notebookEditor.notebookOptions.computeBottomToolbarDimensions(this.notebookEditor.textModel?.viewType);
            const insertionIndicatorTop = insertionIndicatorAbsolutePos - this.list.scrollTop + bottomToolbarGap / 2;
            const editorHeight = this.notebookEditor.getDomNode().getBoundingClientRect().height;
            if (insertionIndicatorTop < 0 || insertionIndicatorTop > editorHeight) {
                // Ignore drop, insertion point is off-screen
                return;
            }
            const isCopy = (ctx.ctrlKey && !platform.isMacintosh) || (ctx.altKey && platform.isMacintosh);
            if (!this.notebookEditor.hasModel()) {
                return;
            }
            const textModel = this.notebookEditor.textModel;
            if (isCopy) {
                const draggedCellIndex = this.notebookEditor.getCellIndex(draggedCell);
                const range = this.getCellRangeAroundDragTarget(draggedCellIndex);
                let originalToIdx = this.notebookEditor.getCellIndex(draggedOverCell);
                if (dropDirection === 'below') {
                    const relativeToIndex = this.notebookEditor.getCellIndex(draggedOverCell);
                    const newIdx = this.notebookEditor.getNextVisibleCellIndex(relativeToIndex);
                    originalToIdx = newIdx;
                }
                let finalSelection;
                let finalFocus;
                if (originalToIdx <= range.start) {
                    finalSelection = { start: originalToIdx, end: originalToIdx + range.end - range.start };
                    finalFocus = { start: originalToIdx + draggedCellIndex - range.start, end: originalToIdx + draggedCellIndex - range.start + 1 };
                }
                else {
                    const delta = (originalToIdx - range.start);
                    finalSelection = { start: range.start + delta, end: range.end + delta };
                    finalFocus = { start: draggedCellIndex + delta, end: draggedCellIndex + delta + 1 };
                }
                textModel.applyEdits([
                    {
                        editType: 1 /* CellEditType.Replace */,
                        index: originalToIdx,
                        count: 0,
                        cells: (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(this.notebookEditor.cellAt(index).model))
                    }
                ], true, { kind: notebookCommon_1.SelectionStateType.Index, focus: this.notebookEditor.getFocus(), selections: this.notebookEditor.getSelections() }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: finalFocus, selections: [finalSelection] }), undefined, true);
                this.notebookEditor.revealCellRangeInView(finalSelection);
            }
            else {
                performCellDropEdits(this.notebookEditor, draggedCell, dropDirection, draggedOverCell);
            }
        }
        onCellDragLeave(event) {
            if (!event.browserEvent.relatedTarget || !DOM.isAncestor(event.browserEvent.relatedTarget, this.notebookEditor.getDomNode())) {
                this.setInsertIndicatorVisibility(false);
            }
        }
        dragCleanup() {
            if (this.currentDraggedCell) {
                this.draggedCells.forEach(cell => cell.dragging = false);
                this.currentDraggedCell = undefined;
                this.draggedCells = [];
            }
            this.setInsertIndicatorVisibility(false);
        }
        registerDragHandle(templateData, cellRoot, dragHandles, dragImageProvider) {
            const container = templateData.container;
            for (const dragHandle of dragHandles) {
                dragHandle.setAttribute('draggable', 'true');
            }
            const onDragEnd = () => {
                if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                    return;
                }
                // Note, templateData may have a different element rendered into it by now
                container.classList.remove(DRAGGING_CLASS);
                this.dragCleanup();
            };
            for (const dragHandle of dragHandles) {
                templateData.templateDisposables.add(DOM.addDisposableListener(dragHandle, DOM.EventType.DRAG_END, onDragEnd));
            }
            const onDragStart = (event) => {
                if (!event.dataTransfer) {
                    return;
                }
                if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                    return;
                }
                this.currentDraggedCell = templateData.currentRenderedCell;
                this.draggedCells = this.notebookEditor.getSelections().map(range => this.notebookEditor.getCellsInRange(range)).flat();
                this.draggedCells.forEach(cell => cell.dragging = true);
                const dragImage = dragImageProvider();
                cellRoot.parentElement.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => cellRoot.parentElement.removeChild(dragImage), 0); // Comment this out to debug drag image layout
            };
            for (const dragHandle of dragHandles) {
                templateData.templateDisposables.add(DOM.addDisposableListener(dragHandle, DOM.EventType.DRAG_START, onDragStart));
            }
        }
        startExplicitDrag(cell, _dragOffsetY) {
            if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                return;
            }
            this.currentDraggedCell = cell;
            this.setInsertIndicatorVisibility(true);
        }
        explicitDrag(cell, dragOffsetY) {
            if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                return;
            }
            const target = this.list.elementAt(dragOffsetY);
            if (target && target !== cell) {
                const cellTop = this.list.getCellViewScrollTop(target);
                const cellHeight = this.list.elementHeight(target);
                const dropDirection = this.getExplicitDragDropDirection(dragOffsetY, cellTop, cellHeight);
                const insertionIndicatorAbsolutePos = dropDirection === 'above' ? cellTop : cellTop + cellHeight;
                this.updateInsertIndicator(dropDirection, insertionIndicatorAbsolutePos);
            }
            // Try scrolling list if needed
            if (this.currentDraggedCell !== cell) {
                return;
            }
            const notebookViewRect = this.notebookEditor.getDomNode().getBoundingClientRect();
            const eventPositionInView = dragOffsetY - this.list.scrollTop;
            // Percentage from the top/bottom of the screen where we start scrolling while dragging
            const notebookViewScrollMargins = 0.2;
            const maxScrollDeltaPerFrame = 20;
            const eventPositionRatio = eventPositionInView / notebookViewRect.height;
            if (eventPositionRatio < notebookViewScrollMargins) {
                this.list.scrollTop -= maxScrollDeltaPerFrame * (1 - eventPositionRatio / notebookViewScrollMargins);
            }
            else if (eventPositionRatio > 1 - notebookViewScrollMargins) {
                this.list.scrollTop += maxScrollDeltaPerFrame * (1 - ((1 - eventPositionRatio) / notebookViewScrollMargins));
            }
        }
        endExplicitDrag(_cell) {
            this.setInsertIndicatorVisibility(false);
        }
        explicitDrop(cell, ctx) {
            this.currentDraggedCell = undefined;
            this.setInsertIndicatorVisibility(false);
            const target = this.list.elementAt(ctx.dragOffsetY);
            if (!target || target === cell) {
                return;
            }
            const cellTop = this.list.getCellViewScrollTop(target);
            const cellHeight = this.list.elementHeight(target);
            const dropDirection = this.getExplicitDragDropDirection(ctx.dragOffsetY, cellTop, cellHeight);
            this._dropImpl(cell, dropDirection, ctx, target);
        }
        getExplicitDragDropDirection(clientY, cellTop, cellHeight) {
            const dragPosInElement = clientY - cellTop;
            const dragPosRatio = dragPosInElement / cellHeight;
            return this.getDropInsertDirection(dragPosRatio);
        }
        dispose() {
            this.notebookEditor = null;
            super.dispose();
        }
    }
    exports.CellDragAndDropController = CellDragAndDropController;
    function performCellDropEdits(editor, draggedCell, dropDirection, draggedOverCell) {
        const draggedCellIndex = editor.getCellIndex(draggedCell);
        let originalToIdx = editor.getCellIndex(draggedOverCell);
        if (typeof draggedCellIndex !== 'number' || typeof originalToIdx !== 'number') {
            return;
        }
        // If dropped on a folded markdown range, insert after the folding range
        if (dropDirection === 'below') {
            const newIdx = editor.getNextVisibleCellIndex(originalToIdx) ?? originalToIdx;
            originalToIdx = newIdx;
        }
        let selections = editor.getSelections();
        if (!selections.length) {
            selections = [editor.getFocus()];
        }
        let originalFocusIdx = editor.getFocus().start;
        // If the dragged cell is not focused/selected, ignore the current focus/selection and use the dragged idx
        if (!selections.some(s => s.start <= draggedCellIndex && s.end > draggedCellIndex)) {
            selections = [{ start: draggedCellIndex, end: draggedCellIndex + 1 }];
            originalFocusIdx = draggedCellIndex;
        }
        const droppedInSelection = selections.find(range => range.start <= originalToIdx && range.end > originalToIdx);
        if (droppedInSelection) {
            originalToIdx = droppedInSelection.start;
        }
        let numCells = 0;
        let focusNewIdx = originalToIdx;
        let newInsertionIdx = originalToIdx;
        // Compute a set of edits which will be applied in reverse order by the notebook text model.
        // `index`: the starting index of the range, after previous edits have been applied
        // `newIdx`: the destination index, after this edit's range has been removed
        selections.sort((a, b) => b.start - a.start);
        const edits = selections.map(range => {
            const length = range.end - range.start;
            // If this range is before the insertion point, subtract the cells in this range from the "to" index
            let toIndexDelta = 0;
            if (range.end <= newInsertionIdx) {
                toIndexDelta = -length;
            }
            const newIdx = newInsertionIdx + toIndexDelta;
            // If this range contains the focused cell, set the new focus index to the new index of the cell
            if (originalFocusIdx >= range.start && originalFocusIdx <= range.end) {
                const offset = originalFocusIdx - range.start;
                focusNewIdx = newIdx + offset;
            }
            // If below the insertion point, the original index will have been shifted down
            const fromIndexDelta = range.start >= originalToIdx ? numCells : 0;
            const edit = {
                editType: 6 /* CellEditType.Move */,
                index: range.start + fromIndexDelta,
                length,
                newIdx
            };
            numCells += length;
            // If a range was moved down, the insertion index needs to be adjusted
            if (range.end < newInsertionIdx) {
                newInsertionIdx -= length;
            }
            return edit;
        });
        const lastEdit = edits[edits.length - 1];
        const finalSelection = { start: lastEdit.newIdx, end: lastEdit.newIdx + numCells };
        const finalFocus = { start: focusNewIdx, end: focusNewIdx + 1 };
        editor.textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: finalFocus, selections: [finalSelection] }), undefined, true);
        editor.revealCellRangeInView(finalSelection);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY2VsbERuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrYWhHLG9EQXdGQztJQTVlRCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQztJQUN2QyxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDO0lBWS9DLE1BQWEsbUJBQW9CLFNBQVEsMEJBQWU7UUFDdkQsWUFDa0IsU0FBc0I7WUFFdkMsS0FBSyxFQUFFLENBQUM7WUFGUyxjQUFTLEdBQVQsU0FBUyxDQUFhO1FBR3hDLENBQUM7UUFFUSxhQUFhLENBQUMsT0FBdUI7WUFDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRVEsV0FBVyxDQUFDLE9BQXVCLEVBQUUsQ0FBZ0M7WUFDN0UsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVPLE1BQU0sQ0FBQyxPQUF1QjtZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuRSxDQUFDO0tBQ0Q7SUFwQkQsa0RBb0JDO0lBRUQsTUFBYSx5QkFBMEIsU0FBUSxzQkFBVTtRQWV4RCxZQUNTLGNBQXVDLEVBQzlCLHFCQUFrQztZQUVuRCxLQUFLLEVBQUUsQ0FBQztZQUhBLG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUM5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