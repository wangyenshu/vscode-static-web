/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookExecutionService"], function (require, exports, notebookExecutionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDto = void 0;
    var NotebookDto;
    (function (NotebookDto) {
        function toNotebookOutputItemDto(item) {
            return {
                mime: item.mime,
                valueBytes: item.data
            };
        }
        NotebookDto.toNotebookOutputItemDto = toNotebookOutputItemDto;
        function toNotebookOutputDto(output) {
            return {
                outputId: output.outputId,
                metadata: output.metadata,
                items: output.outputs.map(toNotebookOutputItemDto)
            };
        }
        NotebookDto.toNotebookOutputDto = toNotebookOutputDto;
        function toNotebookCellDataDto(cell) {
            return {
                cellKind: cell.cellKind,
                language: cell.language,
                mime: cell.mime,
                source: cell.source,
                internalMetadata: cell.internalMetadata,
                metadata: cell.metadata,
                outputs: cell.outputs.map(toNotebookOutputDto)
            };
        }
        NotebookDto.toNotebookCellDataDto = toNotebookCellDataDto;
        function toNotebookDataDto(data) {
            return {
                metadata: data.metadata,
                cells: data.cells.map(toNotebookCellDataDto)
            };
        }
        NotebookDto.toNotebookDataDto = toNotebookDataDto;
        function fromNotebookOutputItemDto(item) {
            return {
                mime: item.mime,
                data: item.valueBytes
            };
        }
        NotebookDto.fromNotebookOutputItemDto = fromNotebookOutputItemDto;
        function fromNotebookOutputDto(output) {
            return {
                outputId: output.outputId,
                metadata: output.metadata,
                outputs: output.items.map(fromNotebookOutputItemDto)
            };
        }
        NotebookDto.fromNotebookOutputDto = fromNotebookOutputDto;
        function fromNotebookCellDataDto(cell) {
            return {
                cellKind: cell.cellKind,
                language: cell.language,
                mime: cell.mime,
                source: cell.source,
                outputs: cell.outputs.map(fromNotebookOutputDto),
                metadata: cell.metadata,
                internalMetadata: cell.internalMetadata
            };
        }
        NotebookDto.fromNotebookCellDataDto = fromNotebookCellDataDto;
        function fromNotebookDataDto(data) {
            return {
                metadata: data.metadata,
                cells: data.cells.map(fromNotebookCellDataDto)
            };
        }
        NotebookDto.fromNotebookDataDto = fromNotebookDataDto;
        function toNotebookCellDto(cell) {
            return {
                handle: cell.handle,
                uri: cell.uri,
                source: cell.textBuffer.getLinesContent(),
                eol: cell.textBuffer.getEOL(),
                language: cell.language,
                cellKind: cell.cellKind,
                outputs: cell.outputs.map(toNotebookOutputDto),
                metadata: cell.metadata,
                internalMetadata: cell.internalMetadata,
            };
        }
        NotebookDto.toNotebookCellDto = toNotebookCellDto;
        function fromCellExecuteUpdateDto(data) {
            if (data.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
                return {
                    editType: data.editType,
                    cellHandle: data.cellHandle,
                    append: data.append,
                    outputs: data.outputs.map(fromNotebookOutputDto)
                };
            }
            else if (data.editType === notebookExecutionService_1.CellExecutionUpdateType.OutputItems) {
                return {
                    editType: data.editType,
                    append: data.append,
                    outputId: data.outputId,
                    items: data.items.map(fromNotebookOutputItemDto)
                };
            }
            else {
                return data;
            }
        }
        NotebookDto.fromCellExecuteUpdateDto = fromCellExecuteUpdateDto;
        function fromCellExecuteCompleteDto(data) {
            return data;
        }
        NotebookDto.fromCellExecuteCompleteDto = fromCellExecuteCompleteDto;
        function fromCellEditOperationDto(edit) {
            if (edit.editType === 1 /* notebookCommon.CellEditType.Replace */) {
                return {
                    editType: edit.editType,
                    index: edit.index,
                    count: edit.count,
                    cells: edit.cells.map(fromNotebookCellDataDto)
                };
            }
            else {
                return edit;
            }
        }
        NotebookDto.fromCellEditOperationDto = fromCellEditOperationDto;
    })(NotebookDto || (exports.NotebookDto = NotebookDto = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rRHRvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWROb3RlYm9va0R0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsSUFBaUIsV0FBVyxDQXdIM0I7SUF4SEQsV0FBaUIsV0FBVztRQUUzQixTQUFnQix1QkFBdUIsQ0FBQyxJQUFtQztZQUMxRSxPQUFPO2dCQUNOLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUk7YUFDckIsQ0FBQztRQUNILENBQUM7UUFMZSxtQ0FBdUIsMEJBS3RDLENBQUE7UUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxNQUFpQztZQUNwRSxPQUFPO2dCQUNOLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtnQkFDekIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO2dCQUN6QixLQUFLLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUM7YUFDbEQsQ0FBQztRQUNILENBQUM7UUFOZSwrQkFBbUIsc0JBTWxDLENBQUE7UUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxJQUE4QjtZQUNuRSxPQUFPO2dCQUNOLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtnQkFDdkIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO2dCQUN2QyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcs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