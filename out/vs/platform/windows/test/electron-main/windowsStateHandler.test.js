/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/windows/electron-main/windowsStateHandler"], function (require, exports, assert, os_1, path_1, uri_1, utils_1, windowsStateHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Windows State Storing', () => {
        function getUIState() {
            return {
                x: 0,
                y: 10,
                width: 100,
                height: 200,
                mode: 0
            };
        }
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
        function assertEqualWindowState(expected, actual, message) {
            if (!expected || !actual) {
                assert.deepStrictEqual(expected, actual, message);
                return;
            }
            assert.strictEqual(expected.backupPath, actual.backupPath, message);
            assertEqualURI(expected.folderUri, actual.folderUri, message);
            assert.strictEqual(expected.remoteAuthority, actual.remoteAuthority, message);
            assertEqualWorkspace(expected.workspace, actual.workspace, message);
            assert.deepStrictEqual(expected.uiState, actual.uiState, message);
        }
        function assertEqualWindowsState(expected, actual, message) {
            assertEqualWindowState(expected.lastPluginDevelopmentHostWindow, actual.lastPluginDevelopmentHostWindow, message);
            assertEqualWindowState(expected.lastActiveWindow, actual.lastActiveWindow, message);
            assert.strictEqual(expected.openedWindows.length, actual.openedWindows.length, message);
            for (let i = 0; i < expected.openedWindows.length; i++) {
                assertEqualWindowState(expected.openedWindows[i], actual.openedWindows[i], message);
            }
        }
        function assertRestoring(state, message) {
            const stored = (0, windowsStateHandler_1.getWindowsStateStoreData)(state);
            const restored = (0, windowsStateHandler_1.restoreWindowsState)(stored);
            assertEqualWindowsState(state, restored, message);
        }
        const testBackupPath1 = (0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'backupFolder1');
        const testBackupPath2 = (0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'backupFolder2');
        const testWSPath = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'test.code-workspace'));
        const testFolderURI = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'testFolder'));
        const testRemoteFolderURI = uri_1.URI.parse('foo://bar/c/d');
        test('storing and restoring', () => {
            let windowState;
            windowState = {
                openedWindows: []
            };
            assertRestoring(windowState, 'no windows');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState() }]
            };
            assertRestoring(windowState, 'empty workspace');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState(), workspace: toWorkspace(testWSPath) }]
            };
            assertRestoring(windowState, 'workspace');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI }]
            };
            assertRestoring(windowState, 'folder');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState(), folderUri: testFolderURI }, { backupPath: testBackupPath1, uiState: getUIState(), folderUri: testRemoteFolderURI, remoteAuthority: 'bar' }]
            };
            assertRestoring(windowState, 'multiple windows');
            windowState = {
                lastActiveWindow: { backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI },
                openedWindows: []
            };
            assertRestoring(windowState, 'lastActiveWindow');
            windowState = {
                lastPluginDevelopmentHostWindow: { backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI },
                openedWindows: []
            };
            assertRestoring(windowState, 'lastPluginDevelopmentHostWindow');
        });
        test('open 1_32', () => {
            const v1_32_workspace = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"workspaceIdentifier": {
					"id": "53b714b46ef1a2d4346568b4f591028c",
					"configURIPath": "file:///home/user/workspaces/testing/custom.code-workspace"
				},
				"backupPath": "/home/user/.config/code-oss-dev/Backups/53b714b46ef1a2d4346568b4f591028c",
				"uiState": {
					"mode": 0,
					"x": 0,
					"y": 27,
					"width": 2560,
					"height": 1364
				}
			}
		}`;
            let windowsState = (0, windowsStateHandler_1.restoreWindowsState)(JSON.parse(v1_32_workspace));
            let expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/53b714b46ef1a2d4346568b4f591028c',
                    uiState: { mode: 0 /* WindowMode.Maximized */, x: 0, y: 27, width: 2560, height: 1364 },
                    workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_workspace');
            const v1_32_folder = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"folder": "file:///home/user/workspaces/testing/folding",
				"backupPath": "/home/user/.config/code-oss-dev/Backups/1daac1621c6c06f9e916ac8062e5a1b5",
				"uiState": {
					"mode": 1,
					"x": 625,
					"y": 263,
					"width": 1718,
					"height": 953
				}
			}
		}`;
            windowsState = (0, windowsStateHandler_1.restoreWindowsState)(JSON.parse(v1_32_folder));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/1daac1621c6c06f9e916ac8062e5a1b5',
                    uiState: { mode: 1 /* WindowMode.Normal */, x: 625, y: 263, width: 1718, height: 953 },
                    folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding')
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_folder');
            const v1_32_empty_window = ` {
			"openedWindows": [
			],
			"lastActiveWindow": {
				"backupPath": "/home/user/.config/code-oss-dev/Backups/1549539668998",
				"uiState": {
					"mode": 1,
					"x": 768,
					"y": 336,
					"width": 1024,
					"height": 768
				}
			}
		}`;
            windowsState = (0, windowsStateHandler_1.restoreWindowsState)(JSON.parse(v1_32_empty_window));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/1549539668998',
                    uiState: { mode: 1 /* WindowMode.Normal */, x: 768, y: 336, width: 1024, height: 768 }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_empty_window');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c1N0YXRlSGFuZGxlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93cy90ZXN0L2VsZWN0cm9uLW1haW4vd2luZG93c1N0YXRlSGFuZGxlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsU0FBUyxVQUFVO1lBQ2xCLE9BQU87Z0JBQ04sQ0FBQyxFQUFFLENBQUM7Z0JBQ0osQ0FBQyxFQUFFLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLENBQUM7YUFDUCxDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFDLEdBQVE7WUFDNUIsT0FBTztnQkFDTixFQUFFLEVBQUUsTUFBTTtnQkFDVixVQUFVLEVBQUUsR0FBRzthQUNmLENBQUM7UUFDSCxDQUFDO1FBQ0QsU0FBUyxjQUFjLENBQUMsRUFBbUIsRUFBRSxFQUFtQixFQUFFLE9BQWdCO1lBQ2pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxTQUFTLG9CQUFvQixDQUFDLEVBQW9DLEVBQUUsRUFBb0MsRUFBRSxPQUFnQjtZQUN6SCxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDcEMsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLENBQUMs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