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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/browser/mouseEvent", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/base/common/themables", "vs/editor/contrib/folding/browser/foldingDecorations", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProviderFactory"], function (require, exports, DOM, touch_1, mouseEvent_1, event_1, lifecycle_1, actions_1, contextView_1, notebookCommon_1, async_1, themables_1, foldingDecorations_1, foldingController_1, instantiation_1, notebookOutlineProviderFactory_1) {
    "use strict";
    var NotebookStickyScroll_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookStickyScroll = exports.NotebookStickyLine = void 0;
    exports.computeContent = computeContent;
    class NotebookStickyLine extends lifecycle_1.Disposable {
        constructor(element, foldingIcon, header, entry, notebookEditor) {
            super();
            this.element = element;
            this.foldingIcon = foldingIcon;
            this.header = header;
            this.entry = entry;
            this.notebookEditor = notebookEditor;
            // click the header to focus the cell
            this._register(DOM.addDisposableListener(this.header, DOM.EventType.CLICK || touch_1.EventType.Tap, () => {
                this.focusCell();
            }));
            // click the folding icon to fold the range covered by the header
            this._register(DOM.addDisposableListener(this.foldingIcon.domNode, DOM.EventType.CLICK || touch_1.EventType.Tap, () => {
                if (this.entry.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    const currentFoldingState = this.entry.cell.foldingState;
                    this.toggleFoldRange(currentFoldingState);
                }
            }));
        }
        toggleFoldRange(currentState) {
            const foldingController = this.notebookEditor.getContribution(foldingController_1.FoldingController.id);
            const index = this.entry.index;
            const headerLevel = this.entry.level;
            const newFoldingState = (currentState === 2 /* CellFoldingState.Collapsed */) ? 1 /* CellFoldingState.Expanded */ : 2 /* CellFoldingState.Collapsed */;
            foldingController.setFoldingStateDown(index, newFoldingState, headerLevel);
            this.focusCell();
        }
        focusCell() {
            this.notebookEditor.focusNotebookCell(this.entry.cell, 'container');
            const cellScrollTop = this.notebookEditor.getAbsoluteTopOfElement(this.entry.cell);
            const parentCount = NotebookStickyLine.getParentCount(this.entry);
            // 1.1 addresses visible cell padding, to make sure we don't focus md cell and also render its sticky line
            this.notebookEditor.setScrollTop(cellScrollTop - (parentCount + 1.1) * 22);
        }
        static getParentCount(entry) {
            let count = 0;
            while (entry.parent) {
                count++;
                entry = entry.parent;
            }
            return count;
        }
    }
    exports.NotebookStickyLine = NotebookStickyLine;
    class StickyFoldingIcon {
        constructor(isCollapsed, dimension) {
            this.isCollapsed = isCollapsed;
            this.dimension = dimension;
            this.domNode = document.createElement('div');
            this.domNode.style.width = `${dimension}px`;
            this.domNode.style.height = `${dimension}px`;
            this.domNode.className = themables_1.ThemeIcon.asClassName(isCollapsed ? foldingDecorations_1.foldingCollapsedIcon : foldingDecorations_1.foldingExpandedIcon);
        }
        setVisible(visible) {
            this.domNode.style.cursor = visible ? 'pointer' : 'default';
            this.domNode.style.opacity = visible ? '1' : '0';
        }
    }
    let NotebookStickyScroll = NotebookStickyScroll_1 = class NotebookStickyScroll extends lifecycle_1.Disposable {
        getDomNode() {
            return this.domNode;
        }
        getCurrentStickyHeight() {
            let height = 0;
            this.currentStickyLines.forEach((value) => {
                if (value.rendered) {
                    height += 22;
                }
            });
            return height;
        }
        setCurrentStickyLines(newStickyLines) {
            this.currentStickyLines = newStickyLines;
        }
        compareStickyLineMaps(mapA, mapB) {
            if (mapA.size !== mapB.size) {
                return false;
            }
            for (const [key, value] of mapA) {
                const otherValue = mapB.get(key);
                if (!otherValue || value.rendered !== otherValue.rendered) {
                    return false;
                }
            }
            return true;
        }
        constructor(domNode, notebookEditor, notebookCellList, _contextMenuService, instantiationService) {
            super();
            this.domNode = domNode;
            this.notebookEditor = notebookEditor;
            this.notebookCellList = notebookCellList;
            this._contextMenuService = _contextMenuService;
            this.instantiationService = instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this.currentStickyLines = new Map();
            this._onDidChangeNotebookStickyScroll = this._register(new event_1.Emitter());
            this.onDidChangeNotebookStickyScroll = this._onDidChangeNotebookStickyScroll.event;
            if (this.notebookEditor.notebookOptions.getDisplayOptions().stickyScrollEnabled) {
                this.init();
            }
            this._register(this.notebookEditor.notebookOptions.onDidChangeOptions((e) => {
                if (e.stickyScrollEnabled || e.stickyScrollMode) {
                    this.updateConfig(e);
                }
            }));
            this._register(DOM.addDisposableListener(this.domNode, DOM.EventType.CONTEXT_MENU, async (event) => {
                this.onContextMenu(event);
            }));
        }
        onContextMenu(e) {
            const event = new mouseEvent_1.StandardMouseEvent(DOM.getWindow(this.domNode), e);
            const selectedElement = event.target.parentElement;
            const selectedOutlineEntry = Array.from(this.currentStickyLines.values()).find(entry => entry.line.element.contains(selectedElement))?.line.entry;
            if (!selectedOutlineEntry) {
                return;
            }
            const args = {
                outlineEntry: selectedOutlineEntry,
                notebookEditor: this.notebookEditor,
            };
            this._contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.NotebookStickyScrollContext,
                getAnchor: () => event,
                menuActionOptions: { shouldForwardArgs: true, arg: args },
            });
        }
        updateConfig(e) {
            if (e.stickyScrollEnabled) {
                if (this.notebookEditor.notebookOptions.getDisplayOptions().stickyScrollEnabled) {
                    this.init();
                }
                else {
                    this._disposables.clear();
                    this.notebookOutlineReference?.dispose();
                    this.disposeCurrentStickyLines();
                    DOM.clearNode(this.domNode);
                    this.updateDisplay();
                }
            }
            else if (e.stickyScrollMode && this.notebookEditor.notebookOptions.getDisplayOptions().stickyScrollEnabled && this.notebookOutlineReference?.object) {
                this.updateContent(computeContent(this.notebookEditor, this.notebookCellList, this.notebookOutlineReference?.object?.entries, this.getCurrentStickyHeight()));
            }
        }
        init() {
            const { object: notebookOutlineReference } = this.notebookOutlineReference = this.instantiationService.invokeFunction((accessor) => accessor.get(notebookOutlineProviderFactory_1.INotebookCellOutlineProviderFactory).getOrCreate(this.notebookEditor, 1 /* OutlineTarget.OutlinePane */));
            this._register(this.notebookOutlineReference);
            this.updateContent(computeContent(this.notebookEditor, this.notebookCellList, notebookOutlineReference.entries, this.getCurrentStickyHeight()));
            this._disposables.add(notebookOutlineReference.onDidChange(() => {
                const recompute = computeContent(this.notebookEditor, this.notebookCellList, notebookOutlineReference.entries, this.getCurrentStickyHeight());
                if (!this.compareStickyLineMaps(recompute, this.currentStickyLines)) {
                    this.updateContent(recompute);
                }
            }));
            this._disposables.add(this.notebookEditor.onDidAttachViewModel(() => {
                this.updateContent(computeContent(this.notebookEditor, this.notebookCellList, notebookOutlineReference.entries, this.getCurrentStickyHeight()));
            }));
            this._disposables.add(this.notebookEditor.onDidScroll(() => {
                const d = new async_1.Delayer(100);
                d.trigger(() => {
                    d.dispose();
                    const recompute = computeContent(this.notebookEditor, this.notebookCellList, notebookOutlineReference.entries, this.getCurrentStickyHeight());
                    if (!this.compareStickyLineMaps(recompute, this.currentStickyLines)) {
                        this.updateContent(recompute);
                    }
                });
            }));
        }
        // take in an cell index, and get the corresponding outline entry
        static getVisibleOutlineEntry(visibleIndex, notebookOutlineEntries) {
            let left = 0;
            let right = notebookOutlineEntries.length - 1;
            let bucket = -1;
            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                if (notebookOutlineEntries[mid].index === visibleIndex) {
                    bucket = mid;
                    break;
                }
                else if (notebookOutlineEntries[mid].index < visibleIndex) {
                    bucket = mid;
                    left = mid + 1;
                }
                else {
                    right = mid - 1;
                }
            }
            if (bucket !== -1) {
                const rootEntry = notebookOutlineEntries[bucket];
                const flatList = [];
                rootEntry.asFlatList(flatList);
                return flatList.find(entry => entry.index === visibleIndex);
            }
            return undefined;
        }
        updateContent(newMap) {
            DOM.clearNode(this.domNode);
            this.disposeCurrentStickyLines();
            this.renderStickyLines(newMap, this.domNode);
            const oldStickyHeight = this.getCurrentStickyHeight();
            this.setCurrentStickyLines(newMap);
            // (+) = sticky height increased
            // (-) = sticky height decreased
            const sizeDelta = this.getCurrentStickyHeight() - oldStickyHeight;
            if (sizeDelta !== 0) {
                this._onDidChangeNotebookStickyScroll.fire(sizeDelta);
            }
            this.updateDisplay();
        }
        updateDisplay() {
            const hasSticky = this.getCurrentStickyHeight() > 0;
            if (!hasSticky) {
                this.domNode.style.display = 'none';
            }
            else {
                this.domNode.style.display = 'block';
            }
        }
        static computeStickyHeight(entry) {
            let height = 0;
            if (entry.cell.cellKind === notebookCommon_1.CellKind.Markup && entry.level < 7) {
                height += 22;
            }
            while (entry.parent) {
                height += 22;
                entry = entry.parent;
            }
            return height;
        }
        static checkCollapsedStickyLines(entry, numLinesToRender, notebookEditor) {
            let currentEntry = entry;
            const newMap = new Map();
            const elementsToRender = [];
            while (currentEntry) {
                if (currentEntry.level >= 7) {
                    // level 7+ represents a non-header entry, which we don't want to render
                    currentEntry = currentEntry.parent;
                    continue;
                }
                const lineToRender = NotebookStickyScroll_1.createStickyElement(currentEntry, notebookEditor);
                newMap.set(currentEntry, { line: lineToRender, rendered: false });
                elementsToRender.unshift(lineToRender);
                currentEntry = currentEntry.parent;
            }
            // iterate over elements to render, and append to container
            // break when we reach numLinesToRender
            for (let i = 0; i < elementsToRender.length; i++) {
                if (i >= numLinesToRender) {
                    break;
                }
                newMap.set(elementsToRender[i].entry, { line: elementsToRender[i], rendered: true });
            }
            return newMap;
        }
        renderStickyLines(stickyMap, containerElement) {
            const reversedEntries = Array.from(stickyMap.entries()).reverse();
            for (const [, value] of reversedEntries) {
                if (!value.rendered) {
                    continue;
                }
                containerElement.append(value.line.element);
            }
        }
        static createStickyElement(entry, notebookEditor) {
            const stickyElement = document.createElement('div');
            stickyElement.classList.add('notebook-sticky-scroll-element');
            const indentMode = notebookEditor.notebookOptions.getLayoutConfiguration().stickyScrollMode;
            if (indentMode === 'indented') {
                stickyElement.style.paddingLeft = NotebookStickyLine.getParentCount(entry) * 10 + 'px';
            }
            let isCollapsed = false;
            if (entry.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                isCollapsed = entry.cell.foldingState === 2 /* CellFoldingState.Collapsed */;
            }
            const stickyFoldingIcon = new StickyFoldingIcon(isCollapsed, 16);
            stickyFoldingIcon.domNode.classList.add('notebook-sticky-scroll-folding-icon');
            stickyFoldingIcon.setVisible(true);
            const stickyHeader = document.createElement('div');
            stickyHeader.classList.add('notebook-sticky-scroll-header');
            stickyHeader.innerText = entry.label;
            stickyElement.append(stickyFoldingIcon.domNode, stickyHeader);
            return new NotebookStickyLine(stickyElement, stickyFoldingIcon, stickyHeader, entry, notebookEditor);
        }
        disposeCurrentStickyLines() {
            this.currentStickyLines.forEach((value) => {
                value.line.dispose();
            });
        }
        dispose() {
            this._disposables.dispose();
            this.disposeCurrentStickyLines();
            this.notebookOutlineReference?.dispose();
            super.dispose();
        }
    };
    exports.NotebookStickyScroll = NotebookStickyScroll;
    exports.NotebookStickyScroll = NotebookStickyScroll = NotebookStickyScroll_1 = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService)
    ], NotebookStickyScroll);
    function computeContent(notebookEditor, notebookCellList, notebookOutlineEntries, renderedStickyHeight) {
        // get data about the cell list within viewport ----------------------------------------------------------------------------------------
        const editorScrollTop = notebookEditor.scrollTop - renderedStickyHeight;
        const visibleRange = notebookEditor.visibleRanges[0];
        if (!visibleRange) {
            return new Map();
        }
        // edge case for cell 0 in the notebook is a header ------------------------------------------------------------------------------------
        if (visibleRange.start === 0) {
            const firstCell = notebookEditor.cellAt(0);
            const firstCellEntry = NotebookStickyScroll.getVisibleOutlineEntry(0, notebookOutlineEntries);
            if (firstCell && firstCellEntry && firstCell.cellKind === notebookCommon_1.CellKind.Markup && firstCellEntry.level < 7) {
                if (notebookEditor.scrollTop > 22) {
                    const newMap = NotebookStickyScroll.checkCollapsedStickyLines(firstCellEntry, 100, notebookEditor);
                    return newMap;
                }
            }
        }
        // iterate over cells in viewport ------------------------------------------------------------------------------------------------------
        let cell;
        let cellEntry;
        const startIndex = visibleRange.start - 1; // -1 to account for cells hidden "under" sticky lines.
        for (let currentIndex = startIndex; currentIndex < visibleRange.end; currentIndex++) {
            // store data for current cell, and next cell
            cell = notebookEditor.cellAt(currentIndex);
            if (!cell) {
                return new Map();
            }
            cellEntry = NotebookStickyScroll.getVisibleOutlineEntry(currentIndex, notebookOutlineEntries);
            if (!cellEntry) {
                continue;
            }
            const nextCell = notebookEditor.cellAt(currentIndex + 1);
            if (!nextCell) {
                const sectionBottom = notebookEditor.getLayoutInfo().scrollHeight;
                const linesToRender = Math.floor((sectionBottom) / 22);
                const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
                return newMap;
            }
            const nextCellEntry = NotebookStickyScroll.getVisibleOutlineEntry(currentIndex + 1, notebookOutlineEntries);
            if (!nextCellEntry) {
                continue;
            }
            // check next cell, if markdown with non level 7 entry, that means this is the end of the section (new header) ---------------------
            if (nextCell.cellKind === notebookCommon_1.CellKind.Markup && nextCellEntry.level < 7) {
                const sectionBottom = notebookCellList.getCellViewScrollTop(nextCell);
                const currentSectionStickyHeight = NotebookStickyScroll.computeStickyHeight(cellEntry);
                const nextSectionStickyHeight = NotebookStickyScroll.computeStickyHeight(nextCellEntry);
                // case: we can render the all sticky lines for the current section ------------------------------------------------------------
                if (editorScrollTop + currentSectionStickyHeight < sectionBottom) {
                    const linesToRender = Math.floor((sectionBottom - editorScrollTop) / 22);
                    const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
                    return newMap;
                }
                // case: next section is the same size or bigger, render next entry -----------------------------------------------------------
                else if (nextSectionStickyHeight >= currentSectionStickyHeight) {
                    const newMap = NotebookStickyScroll.checkCollapsedStickyLines(nextCellEntry, 100, notebookEditor);
                    return newMap;
                }
                // case: next section is the smaller, shrink until next section height is greater than the available space ---------------------
                else if (nextSectionStickyHeight < currentSectionStickyHeight) {
                    const availableSpace = sectionBottom - editorScrollTop;
                    if (availableSpace >= nextSectionStickyHeight) {
                        const linesToRender = Math.floor((availableSpace) / 22);
                        const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
                        return newMap;
                    }
                    else {
                        const newMap = NotebookStickyScroll.checkCollapsedStickyLines(nextCellEntry, 100, notebookEditor);
                        return newMap;
                    }
                }
            }
        } // visible range loop close
        // case: all visible cells were non-header cells, so render any headers relevant to their section --------------------------------------
        const sectionBottom = notebookEditor.getLayoutInfo().scrollHeight;
        const linesToRender = Math.floor((sectionBottom - editorScrollTop) / 22);
        const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
        return newMap;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JTdGlja3lTY3JvbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdQYXJ0cy9ub3RlYm9va0VkaXRvclN0aWNreVNjcm9sbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcVhoRyx3Q0FzRkM7SUFsYkQsTUFBYSxrQkFBbUIsU0FBUSxzQkFBVTtRQUNqRCxZQUNpQixPQUFvQixFQUNwQixXQUE4QixFQUM5QixNQUFtQixFQUNuQixLQUFtQixFQUNuQixjQUErQjtZQUUvQyxLQUFLLEVBQUUsQ0FBQztZQU5RLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDcEIsZ0JBQVcsR0FBWCxXQUFXLENBQW1CO1lBQzlCLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsVUFBSyxHQUFMLEtBQUssQ0FBYztZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFHL0MscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksaUJBQWMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO2dCQUNyRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGlFQUFpRTtZQUNqRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxpQkFBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2xILElBQUksSUFB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