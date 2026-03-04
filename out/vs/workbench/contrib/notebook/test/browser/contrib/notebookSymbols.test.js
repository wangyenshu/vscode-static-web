/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineEntryFactory"], function (require, exports, assert, cancellation_1, mock_1, utils_1, notebookOutlineEntryFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Symbols', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const symbolsPerTextModel = {};
        function setSymbolsForTextModel(symbols, textmodelId = 'textId') {
            symbolsPerTextModel[textmodelId] = symbols;
        }
        const executionService = new class extends (0, mock_1.mock)() {
            getCellExecution() { return undefined; }
        };
        class OutlineModelStub {
            constructor(textId) {
                this.textId = textId;
            }
            getTopLevelSymbols() {
                return symbolsPerTextModel[this.textId];
            }
        }
        const outlineModelService = new class extends (0, mock_1.mock)() {
            getOrCreate(model, arg1) {
                const outline = new OutlineModelStub(model.id);
                return Promise.resolve(outline);
            }
            getDebounceValue(arg0) {
                return 0;
            }
        };
        function createCellViewModel(version = 1, textmodelId = 'textId') {
            return {
                textBuffer: {
                    getLineCount() { return 0; }
                },
                getText() {
                    return '# code';
                },
                model: {
                    textModel: {
                        id: textmodelId,
                        getVersionId() { return version; }
                    }
                },
                resolveTextModel() {
                    return this.model.textModel;
                },
            };
        }
        test('Cell without symbols cache', function () {
            setSymbolsForTextModel([{ name: 'var', range: {} }]);
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const entries = entryFactory.getOutlineEntries(createCellViewModel(), 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries.length, 1, 'no entries created');
            assert.equal(entries[0].label, '# code', 'entry should fall back to first line of cell');
        });
        test('Cell with simple symbols', async function () {
            setSymbolsForTextModel([{ name: 'var1', range: {} }, { name: 'var2', range: {} }]);
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const cell = createCellViewModel();
            await entryFactory.cacheSymbols(cell, outlineModelService, cancellation_1.CancellationToken.None);
            const entries = entryFactory.getOutlineEntries(cell, 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries.length, 3, 'wrong number of outline entries');
            assert.equal(entries[0].label, '# code');
            assert.equal(entries[1].label, 'var1');
            // 6 levels for markdown, all code symbols are greater than the max markdown level
            assert.equal(entries[1].level, 8);
            assert.equal(entries[1].index, 1);
            assert.equal(entries[2].label, 'var2');
            assert.equal(entries[2].level, 8);
            assert.equal(entries[2].index, 2);
        });
        test('Cell with nested symbols', async function () {
            setSymbolsForTextModel([
                { name: 'root1', range: {}, children: [{ name: 'nested1', range: {} }, { name: 'nested2', range: {} }] },
                { name: 'root2', range: {}, children: [{ name: 'nested1', range: {} }] }
            ]);
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const cell = createCellViewModel();
            await entryFactory.cacheSymbols(cell, outlineModelService, cancellation_1.CancellationToken.None);
            const entries = entryFactory.getOutlineEntries(createCellViewModel(), 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries.length, 6, 'wrong number of outline entries');
            assert.equal(entries[0].label, '# code');
            assert.equal(entries[1].label, 'root1');
            assert.equal(entries[1].level, 8);
            assert.equal(entries[2].label, 'nested1');
            assert.equal(entries[2].level, 9);
            assert.equal(entries[3].label, 'nested2');
            assert.equal(entries[3].level, 9);
            assert.equal(entries[4].label, 'root2');
            assert.equal(entries[4].level, 8);
            assert.equal(entries[5].label, 'nested1');
            assert.equal(entries[5].level, 9);
        });
        test('Multiple Cells with symbols', async function () {
            setSymbolsForTextModel([{ name: 'var1', range: {} }], '$1');
            setSymbolsForTextModel([{ name: 'var2', range: {} }], '$2');
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const cell1 = createCellViewModel(1, '$1');
            const cell2 = createCellViewModel(1, '$2');
            await entryFactory.cacheSymbols(cell1, outlineModelService, cancellation_1.CancellationToken.None);
            await entryFactory.cacheSymbols(cell2, outlineModelService, cancellation_1.CancellationToken.None);
            const entries1 = entryFactory.getOutlineEntries(createCellViewModel(1, '$1'), 4 /* OutlineTarget.QuickPick */, 0);
            const entries2 = entryFactory.getOutlineEntries(createCellViewModel(1, '$2'), 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries1.length, 2, 'wrong number of outline entries');
            assert.equal(entries1[0].label, '# code');
            assert.equal(entries1[1].label, 'var1');
            assert.equal(entries2.length, 2, 'wrong number of outline entries');
            assert.equal(entries2[0].label, '# code');
            assert.equal(entries2[1].label, 'var2');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTeW1ib2xzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvY29udHJpYi9ub3RlYm9va1N5bWJvbHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxLQUFLLENBQUMsa0JBQWtCLEVBQUU7UUFDekIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRzFDLE1BQU0sbUJBQW1CLEdBQWlDLEVBQUUsQ0FBQztRQUM3RCxTQUFTLHNCQUFzQixDQUFDLE9BQXFCLEVBQUUsV0FBVyxHQUFHLFFBQVE7WUFDNUUsbUJBQW1CLENBQUMsV0FBVyxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQzVDLENBQUM7UUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFrQztZQUN2RSxnQkFBZ0IsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7U0FDakQsQ0FBQztRQUVGLE1BQU0sZ0JBQWdCO1lBQ3JCLFlBQW9CLE1BQWM7Z0JBQWQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUFJLENBQUM7WUFFdkMsa0JBQWtCO2dCQUNqQixPQUFPLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QyxDQUFDO1NBQ0Q7UUFDRCxNQUFNLG1CQUFtQixHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUF3QjtZQUNoRSxXQUFXLENBQUMsS0FBaUIsRUFBRSxJQUFTO2dCQUNoRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQTRCLENBQUM7Z0JBQzFFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNq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RSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sWUFBWSxHQUFHLElBQUkseURBQTJCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUV2RSxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNDLE1BQU0sWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEYsTUFBTSxZQUFZLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVwRixNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxtQ0FBMkIsQ0FBQyxDQUFDLENBQUM7WUFDMUcsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsbUNBQTJCLENBQUMsQ0FBQyxDQUFDO1lBRzFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==