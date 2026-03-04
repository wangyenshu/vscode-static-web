/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/mock", "assert", "vs/base/common/buffer", "vs/workbench/contrib/notebook/browser/contrib/clipboard/cellOutputClipboard", "vs/base/test/common/utils"], function (require, exports, mock_1, assert, buffer_1, cellOutputClipboard_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Cell Output Clipboard Tests', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class ClipboardService {
            constructor() {
                this._clipboardContent = '';
            }
            get clipboardContent() {
                return this._clipboardContent;
            }
            async writeText(value) {
                this._clipboardContent = value;
            }
        }
        const logService = new class extends (0, mock_1.mock)() {
        };
        function createOutputViewModel(outputs, cellViewModel) {
            const outputViewModel = { model: { outputs: outputs } };
            if (cellViewModel) {
                cellViewModel.outputsViewModels.push(outputViewModel);
                cellViewModel.model.outputs.push(outputViewModel.model);
            }
            else {
                cellViewModel = {
                    outputsViewModels: [outputViewModel],
                    model: { outputs: [outputViewModel.model] }
                };
            }
            outputViewModel.cellViewModel = cellViewModel;
            return outputViewModel;
        }
        test('Copy text/plain output', async () => {
            const mimeType = 'text/plain';
            const clipboard = new ClipboardService();
            const outputDto = { data: buffer_1.VSBuffer.fromString('output content'), mime: 'text/plain' };
            const output = createOutputViewModel([outputDto]);
            await (0, cellOutputClipboard_1.copyCellOutput)(mimeType, output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'output content');
        });
        test('Nothing copied for invalid mimetype', async () => {
            const clipboard = new ClipboardService();
            const outputDtos = [
                { data: buffer_1.VSBuffer.fromString('output content'), mime: 'bad' },
                { data: buffer_1.VSBuffer.fromString('output 2'), mime: 'unknown' }
            ];
            const output = createOutputViewModel(outputDtos);
            await (0, cellOutputClipboard_1.copyCellOutput)('bad', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, '');
        });
        test('Text copied if available instead of invalid mime type', async () => {
            const clipboard = new ClipboardService();
            const outputDtos = [
                { data: buffer_1.VSBuffer.fromString('output content'), mime: 'bad' },
                { data: buffer_1.VSBuffer.fromString('text content'), mime: 'text/plain' }
            ];
            const output = createOutputViewModel(outputDtos);
            await (0, cellOutputClipboard_1.copyCellOutput)('bad', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'text content');
        });
        test('Selected mimetype is preferred', async () => {
            const clipboard = new ClipboardService();
            const outputDtos = [
                { data: buffer_1.VSBuffer.fromString('plain text'), mime: 'text/plain' },
                { data: buffer_1.VSBuffer.fromString('html content'), mime: 'text/html' }
            ];
            const output = createOutputViewModel(outputDtos);
            await (0, cellOutputClipboard_1.copyCellOutput)('text/html', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'html content');
        });
        test('copy subsequent output', async () => {
            const clipboard = new ClipboardService();
            const output = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('first'), mime: 'text/plain' }]);
            const output2 = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('second'), mime: 'text/plain' }], output.cellViewModel);
            const output3 = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('third'), mime: 'text/plain' }], output.cellViewModel);
            await (0, cellOutputClipboard_1.copyCellOutput)('text/plain', output2, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'second');
            await (0, cellOutputClipboard_1.copyCellOutput)('text/plain', output3, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'third');
        });
        test('adjacent stream outputs are concanented', async () => {
            const clipboard = new ClipboardService();
            const output = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('stdout'), mime: 'application/vnd.code.notebook.stdout' }]);
            createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('stderr'), mime: 'application/vnd.code.notebook.stderr' }], output.cellViewModel);
            createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('text content'), mime: 'text/plain' }], output.cellViewModel);
            createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('non-adjacent'), mime: 'application/vnd.code.notebook.stdout' }], output.cellViewModel);
            await (0, cellOutputClipboard_1.copyCellOutput)('application/vnd.code.notebook.stdout', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'stdoutstderr');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Q29weVRlc3RzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvY29udHJpYi9vdXRwdXRDb3B5VGVzdHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQ3pDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLGdCQUFnQjtZQUF0QjtnQkFDUyxzQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFPaEMsQ0FBQztZQU5BLElBQVcsZ0JBQWdCO2dCQUMxQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUMvQixDQUFDO1lBQ00sS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFhO2dCQUNuQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQ2hDLENBQUM7U0FDRDtRQUVELE1BQU0sVUFBVSxHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFlO1NBQUksQ0FBQztRQUU3RCxTQUFTLHFCQUFxQixDQUFDLE9BQXlCLEVBQUUsYUFBOEI7WUFDdkYsTUFBTSxlQUFlLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQTBCLENBQUM7WUFFaEYsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsYUFBYSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDdEQsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsYUFBYSxHQUFHO29CQUNmLGlCQUFp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