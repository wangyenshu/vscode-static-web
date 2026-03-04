/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, cancellation_1, uri_1, mock_1, utils_1, undoRedo_1, bulkCellEdits_1, notebookCommon_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BulkCellEdits', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function runTest(inputUri, resolveUri) {
            const progress = { report: _ => { } };
            const editorService = store.add(new workbenchTestServices_1.TestEditorService());
            const notebook = (0, mock_1.mockObject)()();
            notebook.uri.returns(uri_1.URI.file('/project/notebook.ipynb'));
            const notebookEditorModel = (0, mock_1.mockObject)()({ notebook: notebook });
            notebookEditorModel.isReadonly.returns(false);
            const notebookService = (0, mock_1.mockObject)()();
            notebookService.resolve.returns({ object: notebookEditorModel, dispose: () => { } });
            const edits = [
                new bulkCellEdits_1.ResourceNotebookCellEdit(inputUri, { index: 0, count: 1, editType: 1 /* CellEditType.Replace */, cells: [] })
            ];
            const bce = new bulkCellEdits_1.BulkCellEdits(new undoRedo_1.UndoRedoGroup(), new undoRedo_1.UndoRedoSource(), progress, cancellation_1.CancellationToken.None, edits, editorService, notebookService);
            await bce.apply();
            const resolveArgs = notebookService.resolve.args[0];
            assert.strictEqual(resolveArgs[0].toString(), resolveUri.toString());
        }
        const notebookUri = uri_1.URI.file('/foo/bar.ipynb');
        test('works with notebook URI', async () => {
            await runTest(notebookUri, notebookUri);
        });
        test('maps cell URI to notebook URI', async () => {
            await runTest(notebookCommon_1.CellUri.generate(notebookUri, 5), notebookUri);
        });
        test('throws for invalid cell URI', async () => {
            const badCellUri = notebookCommon_1.CellUri.generate(notebookUri, 5).with({ fragment: '' });
            await assert.rejects(async () => await runTest(badCellUri, notebookUri));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0NlbGxFZGl0cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvdGVzdC9icm93c2VyL2J1bGtDZWxsRWRpdHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxLQUFLLENBQUMsZUFBZSxFQUFFO1FBQ3RCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxLQUFLLFVBQVUsT0FBTyxDQUFDLFFBQWEsRUFBRSxVQUFlO1lBQ3BELE1BQU0sUUFBUSxHQUFvQixFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3ZELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx5Q0FBaUIsRUFBRSxDQUFDLENBQUM7WUFFekQsTUFBTSxRQUFRLEdBQUcsSUFBQSxpQkFBVSxHQUFxQixFQUFFLENBQUM7WUFDbkQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7WUFFMUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLGlCQUFVLEdBQWdDLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBZSxFQUFFLENBQUMsQ0FBQztZQUN0RyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTlDLE1BQU0sZUFBZSxHQUFHLElBQUEsaUJBQVUsR0FBdUMsRUFBRSxDQUFDO1lBQzVFLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXJGLE1BQU0sS0FBSyxHQUFHO2dCQUNiLElBQUksd0NBQXdCLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ3pHLENBQUM7WUFDRixNQUFNLEdBQUcsR0FBRyxJQUFJLDZCQUFhLENBQUMsSUFBSSx3QkFBYSxFQUFFLEVBQUUsSUFBSSx5QkFBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLGdDQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLGVBQXNCLENBQUMsQ0FBQztZQUN6SixNQUFNLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVsQixNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsTUFBTSxXQUFXLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxQyxNQUFNLE9BQU8sQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEQsTUFBTSxPQUFPLENBQUMsd0JBQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlDLE1BQU0sVUFBVSxHQUFHLHdCQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=