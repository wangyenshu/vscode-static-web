/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/nls"], function (require, exports, dom_1, lifecycle_1, observable_1, lineRange_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeMarkersController = exports.conflictMarkers = void 0;
    exports.conflictMarkers = {
        start: '<<<<<<<',
        end: '>>>>>>>',
    };
    class MergeMarkersController extends lifecycle_1.Disposable {
        constructor(editor, mergeEditorViewModel) {
            super();
            this.editor = editor;
            this.mergeEditorViewModel = mergeEditorViewModel;
            this.viewZoneIds = [];
            this.disposableStore = new lifecycle_1.DisposableStore();
            this._register(editor.onDidChangeModelContent(e => {
                this.updateDecorations();
            }));
            this._register(editor.onDidChangeModel(e => {
                this.updateDecorations();
            }));
            this.updateDecorations();
        }
        updateDecorations() {
            const model = this.editor.getModel();
            const blocks = model ? getBlocks(model, { blockToRemoveStartLinePrefix: exports.conflictMarkers.start, blockToRemoveEndLinePrefix: exports.conflictMarkers.end }) : { blocks: [] };
            this.editor.setHiddenAreas(blocks.blocks.map(b => b.lineRange.deltaEnd(-1).toRange()), this);
            this.editor.changeViewZones(c => {
                this.disposableStore.clear();
                for (const id of this.viewZoneIds) {
                    c.removeZone(id);
                }
                this.viewZoneIds.length = 0;
                for (const b of blocks.blocks) {
                    const startLine = model.getLineContent(b.lineRange.startLineNumber).substring(0, 20);
                    const endLine = model.getLineContent(b.lineRange.endLineNumberExclusive - 1).substring(0, 20);
                    const conflictingLinesCount = b.lineRange.lineCount - 2;
                    const domNode = (0, dom_1.h)('div', [
                        (0, dom_1.h)('div.conflict-zone-root', [
                            (0, dom_1.h)('pre', [startLine]),
                            (0, dom_1.h)('span.dots', ['...']),
                            (0, dom_1.h)('pre', [endLine]),
                            (0, dom_1.h)('span.text', [
                                conflictingLinesCount === 1
                                    ? nls.localize('conflictingLine', "1 Conflicting Line")
                                    : nls.localize('conflictingLines', "{0} Conflicting Lines", conflictingLinesCount)
                            ]),
                        ]),
                    ]).root;
                    this.viewZoneIds.push(c.addZone({
                        afterLineNumber: b.lineRange.endLineNumberExclusive - 1,
                        domNode,
                        heightInLines: 1.5,
                    }));
                    const updateWidth = () => {
                        const layoutInfo = this.editor.getLayoutInfo();
                        domNode.style.width = `${layoutInfo.contentWidth - layoutInfo.verticalScrollbarWidth}px`;
                    };
                    this.disposableStore.add(this.editor.onDidLayoutChange(() => {
                        updateWidth();
                    }));
                    updateWidth();
                    this.disposableStore.add((0, observable_1.autorun)(reader => {
                        /** @description update classname */
                        const vm = this.mergeEditorViewModel.read(reader);
                        if (!vm) {
                            return;
                        }
                        const activeRange = vm.activeModifiedBaseRange.read(reader);
                        const classNames = [];
                        classNames.push('conflict-zone');
                        if (activeRange) {
                            const activeRangeInResult = vm.model.getLineRangeInResult(activeRange.baseRange, reader);
                            if (activeRangeInResult.intersects(b.lineRange)) {
                                classNames.push('focused');
                            }
                        }
                        domNode.className = classNames.join(' ');
                    }));
                }
            });
        }
    }
    exports.MergeMarkersController = MergeMarkersController;
    function getBlocks(document, configuration) {
        const blocks = [];
        const transformedContent = [];
        let inBlock = false;
        let startLineNumber = -1;
        let curLine = 0;
        for (const line of document.getLinesContent()) {
            curLine++;
            if (!inBlock) {
                if (line.startsWith(configuration.blockToRemoveStartLinePrefix)) {
                    inBlock = true;
                    startLineNumber = curLine;
                }
                else {
                    transformedContent.push(line);
                }
            }
            else {
                if (line.startsWith(configuration.blockToRemoveEndLinePrefix)) {
                    inBlock = false;
                    blocks.push(new Block(new lineRange_1.LineRange(startLineNumber, curLine - startLineNumber + 1)));
                    transformedContent.push('');
                }
            }
        }
        return {
            blocks,
            transformedContent: transformedContent.join('\n')
        };
    }
    class Block {
        constructor(lineRange) {
            this.lineRange = lineRange;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VNYXJrZXJzQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvbWVyZ2VNYXJrZXJzL21lcmdlTWFya2Vyc0NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV25GLFFBQUEsZUFBZSxHQUFHO1FBQzlCLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQztJQUVGLE1BQWEsc0JBQXVCLFNBQVEsc0JBQVU7UUFJckQsWUFDaUIsTUFBbUIsRUFDbkIsb0JBQW1FO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSFEsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQStDO1lBTG5FLGdCQUFXLEdBQWEsRUFBRSxDQUFDO1lBQzNCLG9CQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFReEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDMUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxNQUFN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