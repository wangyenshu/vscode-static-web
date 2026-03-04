/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/jsonFormatter", "vs/base/common/lifecycle", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/workbench/contrib/notebook/browser/diff/diffCellEditorOptions", "vs/workbench/contrib/notebook/browser/diff/eventDispatcher", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, event_1, hash_1, jsonFormatter_1, lifecycle_1, diffEditorWidget_1, diffCellEditorOptions_1, eventDispatcher_1, notebookDiffEditorBrowser_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputComparison = exports.SingleSideDiffElementViewModel = exports.SideBySideDiffElementViewModel = exports.DiffElementViewModelBase = exports.OUTPUT_EDITOR_HEIGHT_MAGIC = exports.PropertyFoldingState = void 0;
    exports.outputEqual = outputEqual;
    exports.getFormattedMetadataJSON = getFormattedMetadataJSON;
    exports.getStreamOutputData = getStreamOutputData;
    exports.getFormattedOutputJSON = getFormattedOutputJSON;
    var PropertyFoldingState;
    (function (PropertyFoldingState) {
        PropertyFoldingState[PropertyFoldingState["Expanded"] = 0] = "Expanded";
        PropertyFoldingState[PropertyFoldingState["Collapsed"] = 1] = "Collapsed";
    })(PropertyFoldingState || (exports.PropertyFoldingState = PropertyFoldingState = {}));
    exports.OUTPUT_EDITOR_HEIGHT_MAGIC = 1440;
    class DiffElementViewModelBase extends lifecycle_1.Disposable {
        set rawOutputHeight(height) {
            this._layout({ rawOutputHeight: Math.min(exports.OUTPUT_EDITOR_HEIGHT_MAGIC, height) });
        }
        get rawOutputHeight() {
            throw new Error('Use Cell.layoutInfo.rawOutputHeight');
        }
        set outputStatusHeight(height) {
            this._layout({ outputStatusHeight: height });
        }
        get outputStatusHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set outputMetadataHeight(height) {
            this._layout({ outputMetadataHeight: height });
        }
        get outputMetadataHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set editorHeight(height) {
            this._layout({ editorHeight: height });
        }
        get editorHeight() {
            throw new Error('Use Cell.layoutInfo.editorHeight');
        }
        set editorMargin(margin) {
            this._layout({ editorMargin: margin });
        }
        get editorMargin() {
            throw new Error('Use Cell.layoutInfo.editorMargin');
        }
        set metadataStatusHeight(height) {
            this._layout({ metadataStatusHeight: height });
        }
        get metadataStatusHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set metadataHeight(height) {
            this._layout({ metadataHeight: height });
        }
        get metadataHeight() {
            throw new Error('Use Cell.layoutInfo.metadataHeight');
        }
        set renderOutput(value) {
            this._renderOutput = value;
            this._layout({ recomputeOutput: true });
            this._stateChangeEmitter.fire({ renderOutput: this._renderOutput });
        }
        get renderOutput() {
            return this._renderOutput;
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        constructor(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super();
            this.mainDocumentTextModel = mainDocumentTextModel;
            this.original = original;
            this.modified = modified;
            this.type = type;
            this.editorEventDispatcher = editorEventDispatcher;
            this.initData = initData;
            this._layoutInfoEmitter = this._register(new event_1.Emitter());
            this.onDidLayoutChange = this._layoutInfoEmitter.event;
            this._stateChangeEmitter = this._register(new event_1.Emitter());
            this.onDidStateChange = this._stateChangeEmitter.event;
            this._renderOutput = true;
            this._sourceEditorViewState = null;
            this._outputEditorViewState = null;
            this._metadataEditorViewState = null;
            const editorHeight = this._estimateEditorHeight(initData.fontInfo);
            this._layoutInfo = {
                width: 0,
                editorHeight: editorHeight,
                editorMargin: 0,
                metadataHeight: 0,
                metadataStatusHeight: 25,
                rawOutputHeight: 0,
                outputTotalHeight: 0,
                outputStatusHeight: 25,
                outputMetadataHeight: 0,
                bodyMargin: 32,
                totalHeight: 82 + editorHeight,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized
            };
            this.metadataFoldingState = PropertyFoldingState.Collapsed;
            this.outputFoldingState = PropertyFoldingState.Collapsed;
            this._register(this.editorEventDispatcher.onDidChangeLayout(e => {
                this._layoutInfoEmitter.fire({ outerWidth: true });
            }));
        }
        layoutChange() {
            this._layout({ recomputeOutput: true });
        }
        _estimateEditorHeight(fontInfo) {
            const lineHeight = fontInfo?.lineHeight ?? 17;
            switch (this.type) {
                case 'unchanged':
                case 'insert':
                    {
                        const lineCount = this.modified.textModel.textBuffer.getLineCount();
                        const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
                        return editorHeight;
                    }
                case 'delete':
                case 'modified':
                    {
                        const lineCount = this.original.textModel.textBuffer.getLineCount();
                        const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
                        return editorHeight;
                    }
            }
        }
        _layout(delta) {
            const width = delta.width !== undefined ? delta.width : this._layoutInfo.width;
            const editorHeight = delta.editorHeight !== undefined ? delta.editorHeight : this._layoutInfo.editorHeight;
            const editorMargin = delta.editorMargin !== undefined ? delta.editorMargin : this._layoutInfo.editorMargin;
            const metadataHeight = delta.metadataHeight !== undefined ? delta.metadataHeight : this._layoutInfo.metadataHeight;
            const metadataStatusHeight = delta.metadataStatusHeight !== undefined ? delta.metadataStatusHeight : this._layoutInfo.metadataStatusHeight;
            const rawOutputHeight = delta.rawOutputHeight !== undefined ? delta.rawOutputHeight : this._layoutInfo.rawOutputHeight;
            const outputStatusHeight = delta.outputStatusHeight !== undefined ? delta.outputStatusHeight : this._layoutInfo.outputStatusHeight;
            const bodyMargin = delta.bodyMargin !== undefined ? delta.bodyMargin : this._layoutInfo.bodyMargin;
            const outputMetadataHeight = delta.outputMetadataHeight !== undefined ? delta.outputMetadataHeight : this._layoutInfo.outputMetadataHeight;
            const outputHeight = (delta.recomputeOutput || delta.rawOutputHeight !== undefined || delta.outputMetadataHeight !== undefined) ? this._getOutputTotalHeight(rawOutputHeight, outputMetadataHeight) : this._layoutInfo.outputTotalHeight;
            const totalHeight = editorHeight
                + editorMargin
                + metadataHeight
                + metadataStatusHeight
                + outputHeight
                + outputStatusHeight
                + bodyMargin;
            const newLayout = {
                width: width,
                editorHeight: editorHeight,
                editorMargin: editorMargin,
                metadataHeight: metadataHeight,
                metadataStatusHeight: metadataStatusHeight,
                outputTotalHeight: outputHeight,
                outputStatusHeight: outputStatusHeight,
                bodyMargin: bodyMargin,
                rawOutputHeight: rawOutputHeight,
                outputMetadataHeight: outputMetadataHeight,
                totalHeight: totalHeight,
                layoutState: notebookBrowser_1.CellLayoutState.Measured
            };
            let somethingChanged = false;
            const changeEvent = {};
            if (newLayout.width !== this._layoutInfo.width) {
                changeEvent.width = true;
                somethingChanged = true;
            }
            if (newLayout.editorHeight !== this._layoutInfo.editorHeight) {
                changeEvent.editorHeight = true;
                somethingChanged = true;
            }
            if (newLayout.editorMargin !== this._layoutInfo.editorMargin) {
                changeEvent.editorMargin = true;
                somethingChanged = true;
            }
            if (newLayout.metadataHeight !== this._layoutInfo.metadataHeight) {
                changeEvent.metadataHeight = true;
                somethingChanged = true;
            }
            if (newLayout.metadataStatusHeight !== this._layoutInfo.metadataStatusHeight) {
                changeEvent.metadataStatusHeight = true;
                somethingChanged = true;
            }
            if (newLayout.outputTotalHeight !== this._layoutInfo.outputTotalHeight) {
                changeEvent.outputTotalHeight = true;
                somethingChanged = true;
            }
            if (newLayout.outputStatusHeight !== this._layoutInfo.outputStatusHeight) {
                changeEvent.outputStatusHeight = true;
                somethingChanged = true;
            }
            if (newLayout.bodyMargin !== this._layoutInfo.bodyMargin) {
                changeEvent.bodyMargin = true;
                somethingChanged = true;
            }
            if (newLayout.outputMetadataHeight !== this._layoutInfo.outputMetadataHeight) {
                changeEvent.outputMetadataHeight = true;
                somethingChanged = true;
            }
            if (newLayout.totalHeight !== this._layoutInfo.totalHeight) {
                changeEvent.totalHeight = true;
                somethingChanged = true;
            }
            if (somethingChanged) {
                this._layoutInfo = newLayout;
                this._fireLayoutChangeEvent(changeEvent);
            }
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                const editorHeight = this.estimateEditorHeight(lineHeight);
                return this._computeTotalHeight(editorHeight);
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        _computeTotalHeight(editorHeight) {
            const totalHeight = editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputTotalHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.outputMetadataHeight
                + this._layoutInfo.bodyMargin;
            return totalHeight;
        }
        estimateEditorHeight(lineHeight = 20) {
            const hasScrolling = false;
            const verticalScrollbarHeight = hasScrolling ? 12 : 0; // take zoom level into account
            // const editorPadding = this.viewContext.notebookOptions.computeEditorPadding(this.internalMetadata);
            const lineCount = Math.max(this.original?.textModel.textBuffer.getLineCount() ?? 1, this.modified?.textModel.textBuffer.getLineCount() ?? 1);
            return lineCount * lineHeight
                + 24 // Top padding
                + 12 // Bottom padding
                + verticalScrollbarHeight;
        }
        _getOutputTotalHeight(rawOutputHeight, metadataHeight) {
            if (this.outputFoldingState === PropertyFoldingState.Collapsed) {
                return 0;
            }
            if (this.renderOutput) {
                if (this.isOutputEmpty()) {
                    // single line;
                    return 24;
                }
                return this.getRichOutputTotalHeight() + metadataHeight;
            }
            else {
                return rawOutputHeight;
            }
        }
        _fireLayoutChangeEvent(state) {
            this._layoutInfoEmitter.fire(state);
            this.editorEventDispatcher.emit([{ type: eventDispatcher_1.NotebookDiffViewEventType.CellLayoutChanged, source: this._layoutInfo }]);
        }
        getComputedCellContainerWidth(layoutInfo, diffEditor, fullWidth) {
            if (fullWidth) {
                return layoutInfo.width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN + (diffEditor ? diffEditorWidget_1.DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0) - 2;
            }
            return (layoutInfo.width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN + (diffEditor ? diffEditorWidget_1.DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0)) / 2 - 18 - 2;
        }
        getOutputEditorViewState() {
            return this._outputEditorViewState;
        }
        saveOutputEditorViewState(viewState) {
            this._outputEditorViewState = viewState;
        }
        getMetadataEditorViewState() {
            return this._metadataEditorViewState;
        }
        saveMetadataEditorViewState(viewState) {
            this._metadataEditorViewState = viewState;
        }
        getSourceEditorViewState() {
            return this._sourceEditorViewState;
        }
        saveSpirceEditorViewState(viewState) {
            this._sourceEditorViewState = viewState;
        }
    }
    exports.DiffElementViewModelBase = DiffElementViewModelBase;
    class SideBySideDiffElementViewModel extends DiffElementViewModelBase {
        get originalDocument() {
            return this.otherDocumentTextModel;
        }
        get modifiedDocument() {
            return this.mainDocumentTextModel;
        }
        constructor(mainDocumentTextModel, otherDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData);
            this.otherDocumentTextModel = otherDocumentTextModel;
            this.original = original;
            this.modified = modified;
            this.type = type;
            this.metadataFoldingState = PropertyFoldingState.Collapsed;
            this.outputFoldingState = PropertyFoldingState.Collapsed;
            if (this.checkMetadataIfModified()) {
                this.metadataFoldingState = PropertyFoldingState.Expanded;
            }
            if (this.checkIfOutputsModified()) {
                this.outputFoldingState = PropertyFoldingState.Expanded;
            }
            this._register(this.original.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
            this._register(this.modified.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
            this._register(this.modified.textModel.onDidChangeContent(() => {
                if (mainDocumentTextModel.transientOptions.cellContentMetadata) {
                    const cellMetadataKeys = [...Object.keys(mainDocumentTextModel.transientOptions.cellContentMetadata)];
                    const modifiedMedataRaw = Object.assign({}, this.modified.metadata);
                    const originalCellMetadata = this.original.metadata;
                    for (const key of cellMetadataKeys) {
                        modifiedMedataRaw[key] = originalCellMetadata[key];
                    }
                    this.modified.textModel.metadata = modifiedMedataRaw;
                }
            }));
        }
        checkIfOutputsModified() {
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return false;
            }
            const ret = outputsEqual(this.original?.outputs ?? [], this.modified?.outputs ?? []);
            if (ret === 0 /* OutputComparison.Unchanged */) {
                return false;
            }
            return {
                reason: ret === 1 /* OutputComparison.Metadata */ ? 'Output metadata is changed' : undefined,
                kind: ret
            };
        }
        checkMetadataIfModified() {
            const modified = (0, hash_1.hash)(getFormattedMetadataJSON(this.mainDocumentTextModel, this.original?.metadata || {}, this.original?.language)) !== (0, hash_1.hash)(getFormattedMetadataJSON(this.mainDocumentTextModel, this.modified?.metadata ?? {}, this.modified?.language));
            if (modified) {
                return { reason: undefined };
            }
            else {
                return false;
            }
        }
        updateOutputHeight(diffSide, index, height) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                this.original.updateOutputHeight(index, height);
            }
            else {
                this.modified.updateOutputHeight(index, height);
            }
        }
        getOutputOffsetInContainer(diffSide, index) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                return this.original.getOutputOffset(index);
            }
            else {
                return this.modified.getOutputOffset(index);
            }
        }
        getOutputOffsetInCell(diffSide, index) {
            const offsetInOutputsContainer = this.getOutputOffsetInContainer(diffSide, index);
            return this._layoutInfo.editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.bodyMargin / 2
                + offsetInOutputsContainer;
        }
        isOutputEmpty() {
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return true;
            }
            if (this.checkIfOutputsModified()) {
                return false;
            }
            // outputs are not changed
            return (this.original?.outputs || []).length === 0;
        }
        getRichOutputTotalHeight() {
            return Math.max(this.original.getOutputTotalHeight(), this.modified.getOutputTotalHeight());
        }
        getNestedCellViewModel(diffSide) {
            return diffSide === notebookDiffEditorBrowser_1.DiffSide.Original ? this.original : this.modified;
        }
        getCellByUri(cellUri) {
            if (cellUri.toString() === this.original.uri.toString()) {
                return this.original;
            }
            else {
                return this.modified;
            }
        }
    }
    exports.SideBySideDiffElementViewModel = SideBySideDiffElementViewModel;
    class SingleSideDiffElementViewModel extends DiffElementViewModelBase {
        get cellViewModel() {
            return this.type === 'insert' ? this.modified : this.original;
        }
        get originalDocument() {
            if (this.type === 'insert') {
                return this.otherDocumentTextModel;
            }
            else {
                return this.mainDocumentTextModel;
            }
        }
        get modifiedDocument() {
            if (this.type === 'insert') {
                return this.mainDocumentTextModel;
            }
            else {
                return this.otherDocumentTextModel;
            }
        }
        constructor(mainDocumentTextModel, otherDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData);
            this.otherDocumentTextModel = otherDocumentTextModel;
            this.type = type;
            this._register(this.cellViewModel.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
        }
        getNestedCellViewModel(diffSide) {
            return this.type === 'insert' ? this.modified : this.original;
        }
        checkIfOutputsModified() {
            return false;
        }
        checkMetadataIfModified() {
            return false;
        }
        updateOutputHeight(diffSide, index, height) {
            this.cellViewModel?.updateOutputHeight(index, height);
        }
        getOutputOffsetInContainer(diffSide, index) {
            return this.cellViewModel.getOutputOffset(index);
        }
        getOutputOffsetInCell(diffSide, index) {
            const offsetInOutputsContainer = this.cellViewModel.getOutputOffset(index);
            return this._layoutInfo.editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.bodyMargin / 2
                + offsetInOutputsContainer;
        }
        isOutputEmpty() {
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return true;
            }
            // outputs are not changed
            return (this.original?.outputs || this.modified?.outputs || []).length === 0;
        }
        getRichOutputTotalHeight() {
            return this.cellViewModel?.getOutputTotalHeight() ?? 0;
        }
        getCellByUri(cellUri) {
            return this.cellViewModel;
        }
    }
    exports.SingleSideDiffElementViewModel = SingleSideDiffElementViewModel;
    var OutputComparison;
    (function (OutputComparison) {
        OutputComparison[OutputComparison["Unchanged"] = 0] = "Unchanged";
        OutputComparison[OutputComparison["Metadata"] = 1] = "Metadata";
        OutputComparison[OutputComparison["Other"] = 2] = "Other";
    })(OutputComparison || (exports.OutputComparison = OutputComparison = {}));
    function outputEqual(a, b) {
        if ((0, hash_1.hash)(a.metadata) === (0, hash_1.hash)(b.metadata)) {
            return 2 /* OutputComparison.Other */;
        }
        // metadata not equal
        for (let j = 0; j < a.outputs.length; j++) {
            const aOutputItem = a.outputs[j];
            const bOutputItem = b.outputs[j];
            if (aOutputItem.mime !== bOutputItem.mime) {
                return 2 /* OutputComparison.Other */;
            }
            if (aOutputItem.data.buffer.length !== bOutputItem.data.buffer.length) {
                return 2 /* OutputComparison.Other */;
            }
            for (let k = 0; k < aOutputItem.data.buffer.length; k++) {
                if (aOutputItem.data.buffer[k] !== bOutputItem.data.buffer[k]) {
                    return 2 /* OutputComparison.Other */;
                }
            }
        }
        return 1 /* OutputComparison.Metadata */;
    }
    function outputsEqual(original, modified) {
        if (original.length !== modified.length) {
            return 2 /* OutputComparison.Other */;
        }
        const len = original.length;
        for (let i = 0; i < len; i++) {
            const a = original[i];
            const b = modified[i];
            if ((0, hash_1.hash)(a.metadata) !== (0, hash_1.hash)(b.metadata)) {
                return 1 /* OutputComparison.Metadata */;
            }
            if (a.outputs.length !== b.outputs.length) {
                return 2 /* OutputComparison.Other */;
            }
            for (let j = 0; j < a.outputs.length; j++) {
                const aOutputItem = a.outputs[j];
                const bOutputItem = b.outputs[j];
                if (aOutputItem.mime !== bOutputItem.mime) {
                    return 2 /* OutputComparison.Other */;
                }
                if (aOutputItem.data.buffer.length !== bOutputItem.data.buffer.length) {
                    return 2 /* OutputComparison.Other */;
                }
                for (let k = 0; k < aOutputItem.data.buffer.length; k++) {
                    if (aOutputItem.data.buffer[k] !== bOutputItem.data.buffer[k]) {
                        return 2 /* OutputComparison.Other */;
                    }
                }
            }
        }
        return 0 /* OutputComparison.Unchanged */;
    }
    function getFormattedMetadataJSON(documentTextModel, metadata, language) {
        let filteredMetadata = {};
        if (documentTextModel) {
            const transientCellMetadata = documentTextModel.transientOptions.transientCellMetadata;
            const keys = new Set([...Object.keys(metadata)]);
            for (const key of keys) {
                if (!(transientCellMetadata[key])) {
                    filteredMetadata[key] = metadata[key];
                }
            }
        }
        else {
            filteredMetadata = metadata;
        }
        const obj = {
            language,
            ...filteredMetadata
        };
        const metadataSource = (0, jsonFormatter_1.toFormattedString)(obj, {});
        return metadataSource;
    }
    function getStreamOutputData(outputs) {
        if (!outputs.length) {
            return null;
        }
        const first = outputs[0];
        const mime = first.mime;
        const sameStream = !outputs.find(op => op.mime !== mime);
        if (sameStream) {
            return outputs.map(opit => opit.data.toString()).join('');
        }
        else {
            return null;
        }
    }
    function getFormattedOutputJSON(outputs) {
        if (outputs.length === 1) {
            const streamOutputData = getStreamOutputData(outputs[0].outputs);
            if (streamOutputData) {
                return streamOutputData;
            }
        }
        return JSON.stringify(outputs.map(output => {
            return ({
                metadata: output.metadata,
                outputItems: output.outputs.map(opit => ({
                    mimeType: opit.mime,
                    data: opit.data.toString()
                }))
            });
        }), undefined, '\t');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVsZW1lbnRWaWV3TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2RpZmYvZGlmZkVsZW1lbnRWaWV3TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcW5CaEcsa0NBMEJDO0lBMkNELDREQXlCQztJQUVELGtEQWNDO0lBRUQsd0RBaUJDO0lBbnVCRCxJQUFZLG9CQUdYO0lBSEQsV0FBWSxvQkFBb0I7UUFDL0IsdUVBQVEsQ0FBQTtRQUNSLHlFQUFTLENBQUE7SUFDVixDQUFDLEVBSFcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFHL0I7SUFFWSxRQUFBLDBCQUEwQixHQUFHLElBQUksQ0FBQztJQVEvQyxNQUFzQix3QkFBeUIsU0FBUSxzQkFBVTtRQVNoRSxJQUFJLGVBQWUsQ0FBQyxNQUFjO1lBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQ0FBMEIsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakYsQ0FBQztRQUVELElBQUksZUFBZTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELElBQUksa0JBQWtCLENBQUMsTUFBYztZQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxrQkFBa0I7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxJQUFJLG9CQUFvQixDQUFDLE1BQWM7WUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFF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