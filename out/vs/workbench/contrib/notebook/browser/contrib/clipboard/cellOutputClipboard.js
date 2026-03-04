/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TEXT_BASED_MIMETYPES = void 0;
    exports.copyCellOutput = copyCellOutput;
    async function copyCellOutput(mimeType, outputViewModel, clipboardService, logService) {
        const cellOutput = outputViewModel.model;
        const output = mimeType && exports.TEXT_BASED_MIMETYPES.includes(mimeType) ?
            cellOutput.outputs.find(output => output.mime === mimeType) :
            cellOutput.outputs.find(output => exports.TEXT_BASED_MIMETYPES.includes(output.mime));
        mimeType = output?.mime;
        if (!mimeType || !output) {
            return;
        }
        const decoder = new TextDecoder();
        let text = decoder.decode(output.data.buffer);
        // append adjacent text streams since they are concatenated in the renderer
        if ((0, notebookCommon_1.isTextStreamMime)(mimeType)) {
            const cellViewModel = outputViewModel.cellViewModel;
            let index = cellViewModel.outputsViewModels.indexOf(outputViewModel) + 1;
            while (index < cellViewModel.model.outputs.length) {
                const nextCellOutput = cellViewModel.model.outputs[index];
                const nextOutput = nextCellOutput.outputs.find(output => (0, notebookCommon_1.isTextStreamMime)(output.mime));
                if (!nextOutput) {
                    break;
                }
                text = text + decoder.decode(nextOutput.data.buffer);
                index = index + 1;
            }
        }
        if (mimeType.endsWith('error')) {
            text = text.replace(/\\u001b\[[0-9;]*m/gi, '').replaceAll('\\n', '\n');
        }
        try {
            await clipboardService.writeText(text);
        }
        catch (e) {
            logService.error(`Failed to copy content: ${e}`);
        }
    }
    exports.TEXT_BASED_MIMETYPES = [
        'text/latex',
        'text/html',
        'application/vnd.code.notebook.error',
        'application/vnd.code.notebook.stdout',
        'application/x.notebook.stdout',
        'application/x.notebook.stream',
        'application/vnd.code.notebook.stderr',
        'application/x.notebook.stderr',
        'text/plain',
        'text/markdown',
        'application/json'
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbE91dHB1dENsaXBib2FyZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9jbGlwYm9hcmQvY2VsbE91dHB1dENsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsd0NBMENDO0lBMUNNLEtBQUssVUFBVSxjQUFjLENBQUMsUUFBNEIsRUFBRSxlQUFxQyxFQUFFLGdCQUFtQyxFQUFFLFVBQXVCO1FBQ3JLLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDekMsTUFBTSxNQUFNLEdBQUcsUUFBUSxJQUFJLDRCQUFvQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ25FLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdELFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsNEJBQW9CLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRS9FLFFBQVEsR0FBRyxNQUFNLEVBQUUsSUFBSSxDQUFDO1FBRXhCLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMxQixPQUFPO1FBQ1IsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7UUFDbEMsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTlDLDJFQUEyRTtRQUMzRSxJQUFJLElBQUEsaUNBQWdCLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNoQyxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsYUFBK0IsQ0FBQztZQUN0RSxJQUFJLEtBQUssR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6RSxPQUFPLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFELE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSxpQ0FBZ0IsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDeEYsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNqQixNQUFNO2dCQUNQLENBQUM7Z0JBRUQsSUFBSSxHQUFHLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDaEMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBR0QsSUFBSSxDQUFDO1lBQ0osTUFBTSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFeEMsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixVQUFVLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7SUFDRixDQUFDO0lBRVksUUFBQSxvQkFBb0IsR0FBRztRQUNuQyxZQUFZO1FBQ1osV0FBVztRQUNYLHFDQUFxQztRQUNyQyxzQ0FBc0M7UUFDdEMsK0JBQStCO1FBQy9CLCtCQUErQjtRQUMvQixzQ0FBc0M7UUFDdEMsK0JBQStCO1FBQy9CLFlBQVk7UUFDWixlQUFlO1FBQ2Ysa0JBQWtCO0tBQ2xCLENBQUMifQ==