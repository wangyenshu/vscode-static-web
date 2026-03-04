define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/label/test/common/mockLabelService", "vs/workbench/services/search/common/search", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, languageConfigurationRegistry_1, model_1, testLanguageConfigurationService_1, fileService_1, instantiationServiceMock_1, label_1, log_1, uriIdentity_1, uriIdentityService_1, workspace_1, testWorkspace_1, searchModel_1, mockLabelService_1, search_1, workbenchTestServices_1, notebookEditorService_1, searchTestCommon_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Search - Viewlet', () => {
        let instantiation;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            instantiation = new instantiationServiceMock_1.TestInstantiationService();
            instantiation.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, testLanguageConfigurationService_1.TestLanguageConfigurationService);
            instantiation.stub(model_1.IModelService, (0, searchTestCommon_1.stubModelService)(instantiation, (e) => store.add(e)));
            instantiation.stub(notebookEditorService_1.INotebookEditorService, (0, searchTestCommon_1.stubNotebookEditorService)(instantiation, (e) => store.add(e)));
            instantiation.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace));
            const fileService = new fileService_1.FileService(new log_1.NullLogService());
            store.add(fileService);
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            store.add(uriIdentityService);
            instantiation.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            instantiation.stub(label_1.ILabelService, new mockLabelService_1.MockLabelService());
            instantiation.stub(log_1.ILogService, new log_1.NullLogService());
        });
        teardown(() => {
            instantiation.dispose();
        });
        test('Data Source', function () {
            const result = aSearchResult();
            result.query = {
                type: 2 /* QueryType.Text */,
                contentPattern: { pattern: 'foo' },
                folderQueries: [{
                        folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)()
                    }]
            };
            result.add([{
                    resource: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/foo'),
                    results: [{
                            preview: {
                                text: 'bar',
                                matches: {
                                    startLineNumber: 0,
                                    startColumn: 0,
                                    endLineNumber: 0,
                                    endColumn: 1
                                }
                            },
                            ranges: {
                                startLineNumber: 1,
                                startColumn: 0,
                                endLineNumber: 1,
                                endColumn: 1
                            }
                        }]
                }], '', false);
            const fileMatch = result.matches()[0];
            const lineMatch = fileMatch.matches()[0];
            assert.strictEqual(fileMatch.id(), uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/foo`).toString());
            assert.strictEqual(lineMatch.id(), `${uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/foo`).toString()}>[2,1 -> 2,2]b`);
        });
        test('Comparer', () => {
            const fileMatch1 = aFileMatch('/foo');
            const fileMatch2 = aFileMatch('/with/path');
            const fileMatch3 = aFileMatch('/with/path/foo');
            const lineMatch1 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(0, 1, 1), false);
            const lineMatch2 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1), false);
            const lineMatch3 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1), false);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch2) < 0);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch2, fileMatch1) > 0);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch1) === 0);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch2, fileMatch3) < 0);
            assert((0, searchModel_1.searchMatchComparer)(lineMatch1, lineMatch2) < 0);
            assert((0, searchModel_1.searchMatchComparer)(lineMatch2, lineMatch1) > 0);
            assert((0, searchModel_1.searchMatchComparer)(lineMatch2, lineMatch3) === 0);
        });
        test('Advanced Comparer', () => {
            const fileMatch1 = aFileMatch('/with/path/foo10');
            const fileMatch2 = aFileMatch('/with/path2/foo1');
            const fileMatch3 = aFileMatch('/with/path/bar.a');
            const fileMatch4 = aFileMatch('/with/path/bar.b');
            // By default, path < path2
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch2) < 0);
            // By filenames, foo10 > foo1
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch2, "fileNames" /* SearchSortOrder.FileNames */) > 0);
            // By type, bar.a < bar.b
            assert((0, searchModel_1.searchMatchComparer)(fileMatch3, fileMatch4, "type" /* SearchSortOrder.Type */) < 0);
        });
        test('Cross-type Comparer', () => {
            const searchResult = aSearchResult();
            const folderMatch1 = aFolderMatch('/voo', 0, searchResult);
            const folderMatch2 = aFolderMatch('/with', 1, searchResult);
            const fileMatch1 = aFileMatch('/voo/foo.a', folderMatch1);
            const fileMatch2 = aFileMatch('/with/path.c', folderMatch2);
            const fileMatch3 = aFileMatch('/with/path/bar.b', folderMatch2);
            const lineMatch1 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(0, 1, 1), false);
            const lineMatch2 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1), false);
            const lineMatch3 = new searchModel_1.Match(fileMatch2, ['barfoo'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(0, 1, 1), false);
            const lineMatch4 = new searchModel_1.Match(fileMatch2, ['fooooo'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1), false);
            const lineMatch5 = new searchModel_1.Match(fileMatch3, ['foobar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1), false);
            /***
             * Structure would take the following form:
             *
             *	folderMatch1 (voo)
             *		> fileMatch1 (/foo.a)
             *			>> lineMatch1
             *			>> lineMatch2
             *	folderMatch2 (with)
             *		> fileMatch2 (/path.c)
             *			>> lineMatch4
             *			>> lineMatch5
             *		> fileMatch3 (/path/bar.b)
             *			>> lineMatch3
             *
             */
            // for these, refer to diagram above
            assert((0, searchModel_1.searchComparer)(fileMatch1, fileMatch3) < 0);
            assert((0, searchModel_1.searchComparer)(fileMatch2, fileMatch3) < 0);
            assert((0, searchModel_1.searchComparer)(folderMatch2, fileMatch2) < 0);
            assert((0, searchModel_1.searchComparer)(lineMatch4, lineMatch5) < 0);
            assert((0, searchModel_1.searchComparer)(lineMatch1, lineMatch3) < 0);
            assert((0, searchModel_1.searchComparer)(lineMatch2, folderMatch2) < 0);
            // travel up hierarchy and order of folders take precedence. "voo < with" in indices
            assert((0, searchModel_1.searchComparer)(fileMatch1, fileMatch3, "fileNames" /* SearchSortOrder.FileNames */) < 0);
            // bar.b < path.c
            assert((0, searchModel_1.searchComparer)(fileMatch3, fileMatch2, "fileNames" /* SearchSortOrder.FileNames */) < 0);
            // lineMatch4's parent is fileMatch2, "bar.b < path.c"
            assert((0, searchModel_1.searchComparer)(fileMatch3, lineMatch4, "fileNames" /* SearchSortOrder.FileNames */) < 0);
            // bar.b < path.c
            assert((0, searchModel_1.searchComparer)(fileMatch3, fileMatch2, "type" /* SearchSortOrder.Type */) < 0);
            // lineMatch4's parent is fileMatch2, "bar.b < path.c"
            assert((0, searchModel_1.searchComparer)(fileMatch3, lineMatch4, "type" /* SearchSortOrder.Type */) < 0);
        });
        function aFileMatch(path, parentFolder, ...lineMatches) {
            const rawMatch = {
                resource: uri_1.URI.file('/' + path),
                results: lineMatches
            };
            const fileMatch = instantiation.createInstance(searchModel_1.FileMatch, {
                pattern: ''
            }, undefined, undefined, parentFolder ?? aFolderMatch('', 0), rawMatch, null, '');
            fileMatch.createMatches(false);
            store.add(fileMatch);
            return fileMatch;
        }
        function aFolderMatch(path, index, parent) {
            const searchModel = instantiation.createInstance(searchModel_1.SearchModel);
            store.add(searchModel);
            const folderMatch = instantiation.createInstance(searchModel_1.FolderMatch, (0, searchTestCommon_1.createFileUriFromPathFromRoot)(path), path, index, {
                type: 2 /* QueryType.Text */, folderQueries: [{ folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)() }], contentPattern: {
                    pattern: ''
                }
            }, parent ?? aSearchResult().folderMatches()[0], searchModel.searchResult, null);
            store.add(folderMatch);
            return folderMatch;
        }
        function aSearchResult() {
            const searchModel = instantiation.createInstance(searchModel_1.SearchModel);
            store.add(searchModel);
            searchModel.searchResult.query = {
                type: 2 /* QueryType.Text */, folderQueries: [{ folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)() }], contentPattern: {
                    pattern: ''
                }
            };
            return searchModel.searchResult;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoVmlld2xldC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL3Rlc3QvYnJvd3Nlci9zZWFyY2hWaWV3bGV0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBeUJBLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsSUFBSSxhQUF1QyxDQUFDO1FBQzVDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsYUFBYSxHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUMvQyxhQUFhLENBQUMsSUFBSSxDQUFDLDZEQUE2QixFQUFFLG1FQUFnQyxDQUFDLENBQUM7WUFDcEYsYUFBYSxDQUFDLElBQUksQ0FBQyxxQkFBYSxFQUFFLElBQUEsbUNBQWdCLEVBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RixhQUFhLENBQUMsSUFBSSxDQUFDLDhDQUFzQixFQUFFLElBQUEsNENBQXlCLEVBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxRyxhQUFhLENBQUMsR0FBRyxDQUFDLG9DQUF3QixFQUFFLElBQUksMENBQWtCLENBQUMsNkJBQWEsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxXQUFXLEdBQUcsSUFBSSx5QkFBVyxDQUFDLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFDMUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN2QixN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RSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9HLE1BQU0sVUFBVSxHQUFHLElBQUksbUJBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLHFCQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLHFCQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUvRyxNQUFNLFVBQVUsR0FBRyxJQUFJLG1CQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxxQkFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEgsTUFBTSxVQUFVLEdBQUcsSUFBSSxtQkFBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWxILE1BQU0sVUFBVSxHQUFHLElBQUksbUJBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLHFCQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLHFCQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsSDs7Ozs7Ozs7Ozs7Ozs7ZUFjRztZ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