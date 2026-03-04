/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/workspaces/common/workspaces"], function (require, exports, assert, os_1, path_1, uri_1, utils_1, log_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('History Storage', () => {
        function toWorkspace(uri) {
            return {
                id: '1234',
                configPath: uri
            };
        }
        function assertEqualURI(u1, u2, message) {
            assert.strictEqual(u1 && u1.toString(), u2 && u2.toString(), message);
        }
        function assertEqualWorkspace(w1, w2, message) {
            if (!w1 || !w2) {
                assert.strictEqual(w1, w2, message);
                return;
            }
            assert.strictEqual(w1.id, w2.id, message);
            assertEqualURI(w1.configPath, w2.configPath, message);
        }
        function assertEqualRecentlyOpened(actual, expected, message) {
            assert.strictEqual(actual.files.length, expected.files.length, message);
            for (let i = 0; i < actual.files.length; i++) {
                assertEqualURI(actual.files[i].fileUri, expected.files[i].fileUri, message);
                assert.strictEqual(actual.files[i].label, expected.files[i].label);
                assert.strictEqual(actual.files[i].remoteAuthority, expected.files[i].remoteAuthority);
            }
            assert.strictEqual(actual.workspaces.length, expected.workspaces.length, message);
            for (let i = 0; i < actual.workspaces.length; i++) {
                const expectedRecent = expected.workspaces[i];
                const actualRecent = actual.workspaces[i];
                if ((0, workspaces_1.isRecentFolder)(actualRecent)) {
                    assertEqualURI(actualRecent.folderUri, expectedRecent.folderUri, message);
                }
                else {
                    assertEqualWorkspace(actualRecent.workspace, expectedRecent.workspace, message);
                }
                assert.strictEqual(actualRecent.label, expectedRecent.label);
                assert.strictEqual(actualRecent.remoteAuthority, actualRecent.remoteAuthority);
            }
        }
        function assertRestoring(state, message) {
            const stored = (0, workspaces_1.toStoreData)(state);
            const restored = (0, workspaces_1.restoreRecentlyOpened)(stored, new log_1.NullLogService());
            assertEqualRecentlyOpened(state, restored, message);
        }
        const testWSPath = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'test.code-workspace'));
        const testFileURI = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'testFile.txt'));
        const testFolderURI = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'testFolder'));
        const testRemoteFolderURI = uri_1.URI.parse('foo://bar/c/e');
        const testRemoteFileURI = uri_1.URI.parse('foo://bar/c/d.txt');
        const testRemoteWSURI = uri_1.URI.parse('foo://bar/c/test.code-workspace');
        test('storing and restoring', () => {
            let ro;
            ro = {
                files: [],
                workspaces: []
            };
            assertRestoring(ro, 'empty');
            ro = {
                files: [{ fileUri: testFileURI }],
                workspaces: []
            };
            assertRestoring(ro, 'file');
            ro = {
                files: [],
                workspaces: [{ folderUri: testFolderURI }]
            };
            assertRestoring(ro, 'folder');
            ro = {
                files: [],
                workspaces: [{ workspace: toWorkspace(testWSPath) }, { folderUri: testFolderURI }]
            };
            assertRestoring(ro, 'workspaces and folders');
            ro = {
                files: [{ fileUri: testRemoteFileURI }],
                workspaces: [{ workspace: toWorkspace(testRemoteWSURI) }, { folderUri: testRemoteFolderURI }]
            };
            assertRestoring(ro, 'remote workspaces and folders');
            ro = {
                files: [{ label: 'abc', fileUri: testFileURI }],
                workspaces: [{ label: 'def', workspace: toWorkspace(testWSPath) }, { folderUri: testRemoteFolderURI }]
            };
            assertRestoring(ro, 'labels');
            ro = {
                files: [{ label: 'abc', remoteAuthority: 'test', fileUri: testRemoteFileURI }],
                workspaces: [{ label: 'def', remoteAuthority: 'test', workspace: toWorkspace(testWSPath) }, { folderUri: testRemoteFolderURI, remoteAuthority: 'test' }]
            };
            assertRestoring(ro, 'authority');
        });
        test('open 1_55', () => {
            const v1_55 = `{
			"entries": [
				{
					"folderUri": "foo://bar/23/43",
					"remoteAuthority": "test+test"
				},
				{
					"workspace": {
						"id": "53b714b46ef1a2d4346568b4f591028c",
						"configPath": "file:///home/user/workspaces/testing/custom.code-workspace"
					}
				},
				{
					"folderUri": "file:///home/user/workspaces/testing/folding",
					"label": "abc"
				},
				{
					"fileUri": "file:///home/user/.config/code-oss-dev/storage.json",
					"label": "def"
				}
			]
		}`;
            const windowsState = (0, workspaces_1.restoreRecentlyOpened)(JSON.parse(v1_55), new log_1.NullLogService());
            const expected = {
                files: [{ label: 'def', fileUri: uri_1.URI.parse('file:///home/user/.config/code-oss-dev/storage.json') }],
                workspaces: [
                    { folderUri: uri_1.URI.parse('foo://bar/23/43'), remoteAuthority: 'test+test' },
                    { workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') } },
                    { label: 'abc', folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding') }
                ]
            };
            assertEqualRecentlyOpened(windowsState, expected, 'v1_33');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc0hpc3RvcnlTdG9yYWdlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2VzL3Rlc3QvZWxlY3Ryb24tbWFpbi93b3Jrc3BhY2VzSGlzdG9yeVN0b3JhZ2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBRTdCLFNBQVMsV0FBVyxDQUFDLEdBQVE7WUFDNUIsT0FBTztnQkFDTixFQUFFLEVBQUUsTUFBTTtnQkFDVixVQUFVLEVBQUUsR0FBRzthQUNmLENBQUM7UUFDSCxDQUFDO1FBQ0QsU0FBUyxjQUFjLENBQUMsRUFBbUIsRUFBRSxFQUFtQixFQUFFLE9BQWdCO1lBQ2pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxTQUFTLG9CQUFvQixDQUFDLEVBQW9DLEVBQUUsRUFBb0MsRUFBRSxPQUFnQjtZQUN6SCxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDcEMsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxjQUFjLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FB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