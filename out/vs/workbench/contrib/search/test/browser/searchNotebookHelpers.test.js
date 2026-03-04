/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/range", "vs/editor/common/model", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/search/browser/searchModel", "vs/base/common/uri", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/editor/common/services/model", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/base/test/common/utils"], function (require, exports, assert, range_1, model_1, notebookCommon_1, searchNotebookHelpers_1, findModel_1, searchModel_1, uri_1, instantiationServiceMock_1, searchTestCommon_1, model_2, notebookEditorService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('searchNotebookHelpers', () => {
        let instantiationService;
        let mdCellFindMatch;
        let codeCellFindMatch;
        let mdInputCell;
        let codeCell;
        let markdownContentResults;
        let codeContentResults;
        let codeWebviewResults;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let counter = 0;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            store.add(instantiationService);
            const modelService = (0, searchTestCommon_1.stubModelService)(instantiationService, (e) => store.add(e));
            const notebookEditorService = (0, searchTestCommon_1.stubNotebookEditorService)(instantiationService, (e) => store.add(e));
            instantiationService.stub(model_2.IModelService, modelService);
            instantiationService.stub(notebookEditorService_1.INotebookEditorService, notebookEditorService);
            mdInputCell = {
                id: 'mdCell',
                cellKind: notebookCommon_1.CellKind.Markup, textBuffer: {
                    getLineContent(lineNumber) {
                        if (lineNumber === 1) {
                            return '# Hello World Test';
                        }
                        else {
                            return '';
                        }
                    }
                }
            };
            const findMatchMds = [new model_1.FindMatch(new range_1.Range(1, 15, 1, 19), ['Test'])];
            codeCell = {
                id: 'codeCell',
                cellKind: notebookCommon_1.CellKind.Code, textBuffer: {
                    getLineContent(lineNumber) {
                        if (lineNumber === 1) {
                            return 'print("test! testing!!")';
                        }
                        else if (lineNumber === 2) {
                            return 'print("this is a Test")';
                        }
                        else {
                            return '';
                        }
                    }
                }
            };
            const findMatchCodeCells = [new model_1.FindMatch(new range_1.Range(1, 8, 1, 12), ['test']),
                new model_1.FindMatch(new range_1.Range(1, 14, 1, 18), ['test']),
                new model_1.FindMatch(new range_1.Range(2, 18, 2, 22), ['Test'])
            ];
            const webviewMatches = [{
                    index: 0,
                    searchPreviewInfo: {
                        line: 'test! testing!!',
                        range: {
                            start: 1,
                            end: 5
                        }
                    }
                },
                {
                    index: 1,
                    searchPreviewInfo: {
                        line: 'test! testing!!',
                        range: {
                            start: 7,
                            end: 11
                        }
                    }
                },
                {
                    index: 3,
                    searchPreviewInfo: {
                        line: 'this is a Test',
                        range: {
                            start: 11,
                            end: 15
                        }
                    }
                }
            ];
            mdCellFindMatch = new findModel_1.CellFindMatchModel(mdInputCell, 0, findMatchMds, []);
            codeCellFindMatch = new findModel_1.CellFindMatchModel(codeCell, 5, findMatchCodeCells, webviewMatches);
        });
        teardown(() => {
            instantiationService.dispose();
        });
        suite('notebookEditorMatchesToTextSearchResults', () => {
            function assertRangesEqual(actual, expected) {
                if (!Array.isArray(actual)) {
                    actual = [actual];
                }
                assert.strictEqual(actual.length, expected.length);
                actual.forEach((r, i) => {
                    const expectedRange = expected[i];
                    assert.deepStrictEqual({ startLineNumber: r.startLineNumber, startColumn: r.startColumn, endLineNumber: r.endLineNumber, endColumn: r.endColumn }, { startLineNumber: expectedRange.startLineNumber, startColumn: expectedRange.startColumn, endLineNumber: expectedRange.endLineNumber, endColumn: expectedRange.endColumn });
                });
            }
            test('convert CellFindMatchModel to ITextSearchMatch and check results', () => {
                markdownContentResults = (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(mdCellFindMatch.contentMatches, mdInputCell);
                codeContentResults = (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(codeCellFindMatch.contentMatches, codeCell);
                codeWebviewResults = (0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(codeCellFindMatch.webviewMatches);
                assert.strictEqual(markdownContentResults.length, 1);
                assert.strictEqual(markdownContentResults[0].preview.text, '# Hello World Test\n');
                assertRangesEqual(markdownContentResults[0].preview.matches, [new range_1.Range(0, 14, 0, 18)]);
                assertRangesEqual(markdownContentResults[0].ranges, [new range_1.Range(0, 14, 0, 18)]);
                assert.strictEqual(codeContentResults.length, 2);
                assert.strictEqual(codeContentResults[0].preview.text, 'print("test! testing!!")\n');
                assert.strictEqual(codeContentResults[1].preview.text, 'print("this is a Test")\n');
                assertRangesEqual(codeContentResults[0].preview.matches, [new range_1.Range(0, 7, 0, 11), new range_1.Range(0, 13, 0, 17)]);
                assertRangesEqual(codeContentResults[0].ranges, [new range_1.Range(0, 7, 0, 11), new range_1.Range(0, 13, 0, 17)]);
                assert.strictEqual(codeWebviewResults.length, 3);
                assert.strictEqual(codeWebviewResults[0].preview.text, 'test! testing!!');
                assert.strictEqual(codeWebviewResults[1].preview.text, 'test! testing!!');
                assert.strictEqual(codeWebviewResults[2].preview.text, 'this is a Test');
                assertRangesEqual(codeWebviewResults[0].preview.matches, [new range_1.Range(0, 1, 0, 5)]);
                assertRangesEqual(codeWebviewResults[1].preview.matches, [new range_1.Range(0, 7, 0, 11)]);
                assertRangesEqual(codeWebviewResults[2].preview.matches, [new range_1.Range(0, 11, 0, 15)]);
                assertRangesEqual(codeWebviewResults[0].ranges, [new range_1.Range(0, 1, 0, 5)]);
                assertRangesEqual(codeWebviewResults[1].ranges, [new range_1.Range(0, 7, 0, 11)]);
                assertRangesEqual(codeWebviewResults[2].ranges, [new range_1.Range(0, 11, 0, 15)]);
            });
            test('convert ITextSearchMatch to MatchInNotebook', () => {
                const mdCellMatch = new searchModel_1.CellMatch(aFileMatch(), mdInputCell, 0);
                const markdownCellContentMatchObjs = (0, searchModel_1.textSearchMatchesToNotebookMatches)(markdownContentResults, mdCellMatch);
                const codeCellMatch = new searchModel_1.CellMatch(aFileMatch(), codeCell, 0);
                const codeCellContentMatchObjs = (0, searchModel_1.textSearchMatchesToNotebookMatches)(codeContentResults, codeCellMatch);
                const codeWebviewContentMatchObjs = (0, searchModel_1.textSearchMatchesToNotebookMatches)(codeWebviewResults, codeCellMatch);
                assert.strictEqual(markdownCellContentMatchObjs[0].cell?.id, mdCellMatch.id);
                assertRangesEqual(markdownCellContentMatchObjs[0].range(), [new range_1.Range(1, 15, 1, 19)]);
                assert.strictEqual(codeCellContentMatchObjs[0].cell?.id, codeCellMatch.id);
                assert.strictEqual(codeCellContentMatchObjs[1].cell?.id, codeCellMatch.id);
                assertRangesEqual(codeCellContentMatchObjs[0].range(), [new range_1.Range(1, 8, 1, 12)]);
                assertRangesEqual(codeCellContentMatchObjs[1].range(), [new range_1.Range(1, 14, 1, 18)]);
                assertRangesEqual(codeCellContentMatchObjs[2].range(), [new range_1.Range(2, 18, 2, 22)]);
                assert.strictEqual(codeWebviewContentMatchObjs[0].cell?.id, codeCellMatch.id);
                assert.strictEqual(codeWebviewContentMatchObjs[1].cell?.id, codeCellMatch.id);
                assert.strictEqual(codeWebviewContentMatchObjs[2].cell?.id, codeCellMatch.id);
                assertRangesEqual(codeWebviewContentMatchObjs[0].range(), [new range_1.Range(1, 2, 1, 6)]);
                assertRangesEqual(codeWebviewContentMatchObjs[1].range(), [new range_1.Range(1, 8, 1, 12)]);
                assertRangesEqual(codeWebviewContentMatchObjs[2].range(), [new range_1.Range(1, 12, 1, 16)]);
            });
            function aFileMatch() {
                const rawMatch = {
                    resource: uri_1.URI.file('somepath' + ++counter),
                    results: []
                };
                const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
                store.add(searchModel);
                const folderMatch = instantiationService.createInstance(searchModel_1.FolderMatch, uri_1.URI.file('somepath'), '', 0, {
                    type: 2 /* QueryType.Text */, folderQueries: [{ folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)() }], contentPattern: {
                        pattern: ''
                    }
                }, searchModel.searchResult, searchModel.searchResult, null);
                const fileMatch = instantiationService.createInstance(searchModel_1.FileMatch, {
                    pattern: ''
                }, undefined, undefined, folderMatch, rawMatch, null, '');
                fileMatch.createMatches(false);
                store.add(folderMatch);
                store.add(fileMatch);
                return fileMatch;
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTm90ZWJvb2tIZWxwZXJzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvdGVzdC9icm93c2VyL3NlYXJjaE5vdGVib29rSGVscGVycy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBQ25DLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxlQUFtQyxDQUFDO1FBQ3hDLElBQUksaUJBQXFDLENBQUM7UUFDMUMsSUFBSSxXQUEyQixDQUFDO1FBQ2hDLElBQUksUUFBd0IsQ0FBQztRQUU3QixJQUFJLHNCQUEwQyxDQUFDO1FBQy9DLElBQUksa0JBQXNDLENBQUM7UUFDM0MsSUFBSSxrQkFBc0MsQ0FBQztRQUMzQyxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDeEQsSUFBSSxPQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3hCLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFFVixvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDdEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sWUFBWSxHQUFHLElBQUEsbUNBQWdCLEVBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRixNQUFNLHFCQUFxQixHQUFHLElBQUEsNENBQXlCLEVBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRyxvQkFBb0Is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