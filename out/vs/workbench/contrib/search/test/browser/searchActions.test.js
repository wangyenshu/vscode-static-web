/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/workbench/contrib/search/browser/searchActionsRemoveReplace", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/search/test/browser/mockSearchTree", "vs/platform/label/common/label", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/base/test/common/utils"], function (require, exports, assert, platform_1, uri_1, model_1, instantiationServiceMock_1, keybinding_1, usLayoutResolvedKeybinding_1, searchActionsRemoveReplace_1, searchModel_1, mockSearchTree_1, label_1, notebookEditorService_1, searchTestCommon_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Search Actions', () => {
        let instantiationService;
        let counter;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(model_1.IModelService, (0, searchTestCommon_1.stubModelService)(instantiationService, (e) => store.add(e)));
            instantiationService.stub(notebookEditorService_1.INotebookEditorService, (0, searchTestCommon_1.stubNotebookEditorService)(instantiationService, (e) => store.add(e)));
            instantiationService.stub(keybinding_1.IKeybindingService, {});
            instantiationService.stub(label_1.ILabelService, { getUriBasenameLabel: (uri) => '' });
            instantiationService.stub(keybinding_1.IKeybindingService, 'resolveKeybinding', (keybinding) => usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS));
            instantiationService.stub(keybinding_1.IKeybindingService, 'lookupKeybinding', (id) => null);
            instantiationService.stub(keybinding_1.IKeybindingService, 'lookupKeybinding', (id) => null);
            counter = 0;
        });
        teardown(() => {
            instantiationService.dispose();
        });
        test('get next element to focus after removing a match when it has next sibling file', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), aMatch(fileMatch2)];
            const tree = aTree(data);
            const target = data[2];
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, [target]);
            assert.strictEqual(data[4], actual);
        });
        test('get next element to focus after removing a match when it is the only match', function () {
            const fileMatch1 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1)];
            const tree = aTree(data);
            const target = data[1];
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, [target]);
            assert.strictEqual(undefined, actual);
        });
        test('get next element to focus after removing a file match when it has next sibling', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const target = data[2];
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, []);
            assert.strictEqual(data[4], actual);
        });
        test('Find last FileMatch in Tree', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const actual = (0, searchActionsRemoveReplace_1.getLastNodeFromSameType)(tree, fileMatch1);
            assert.strictEqual(fileMatch3, actual);
        });
        test('Find last Match in Tree', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const actual = (0, searchActionsRemoveReplace_1.getLastNodeFromSameType)(tree, aMatch(fileMatch1));
            assert.strictEqual(data[5], actual);
        });
        test('get next element to focus after removing a file match when it is only match', function () {
            const fileMatch1 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1)];
            const tree = aTree(data);
            const target = data[0];
            // const testObject: ReplaceAction = instantiationService.createInstance(ReplaceAction, tree, target, null);
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, []);
            assert.strictEqual(undefined, actual);
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
            store.add(folderMatch);
            const fileMatch = instantiationService.createInstance(searchModel_1.FileMatch, {
                pattern: ''
            }, undefined, undefined, folderMatch, rawMatch, null, '');
            fileMatch.createMatches(false);
            store.add(fileMatch);
            return fileMatch;
        }
        function aMatch(fileMatch) {
            const line = ++counter;
            const match = new searchModel_1.Match(fileMatch, ['some match'], {
                startLineNumber: 0,
                startColumn: 0,
                endLineNumber: 0,
                endColumn: 2
            }, {
                startLineNumber: line,
                startColumn: 0,
                endLineNumber: line,
                endColumn: 2
            }, false);
            fileMatch.add(match);
            return match;
        }
        function aTree(elements) {
            return new mockSearchTree_1.MockObjectTree(elements);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL3Rlc3QvYnJvd3Nlci9zZWFyY2hBY3Rpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFFNUIsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLE9BQWUsQ0FBQztRQUNwQixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUN0RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUJBQWEsRUFBRSxJQUFBLG1DQUFnQixFQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOENBQXNCLEVBQUUsSUFBQSw0Q0FBeUIsRUFBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBYSxFQUFFLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxHQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFF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