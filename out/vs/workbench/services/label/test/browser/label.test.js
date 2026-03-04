/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "assert", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/uri", "vs/workbench/services/label/common/labelService", "vs/workbench/test/common/workbenchTestServices", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/platform", "vs/workbench/common/memento", "vs/base/common/path", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, resources, assert, workbenchTestServices_1, uri_1, labelService_1, workbenchTestServices_2, workspace_1, testWorkspace_1, platform_1, memento_1, path_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI Label', () => {
        let labelService;
        let storageService;
        setup(() => {
            storageService = new workbenchTestServices_2.TestStorageService();
            labelService = new labelService_1.LabelService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_2.TestContextService(), new workbenchTestServices_1.TestPathService(uri_1.URI.file('/foobar')), new workbenchTestServices_1.TestRemoteAgentService(), storageService, new workbenchTestServices_1.TestLifecycleService());
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('custom scheme', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL/${path}/${authority}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABEL//1/2/3/4/5/microsoft.com/END');
            assert.strictEqual(labelService.getUriBasenameLabel(uri1), 'END');
        });
        test('file scheme', function () {
            labelService.registerFormatter({
                scheme: 'file',
                formatting: {
                    label: '${path}',
                    separator: path_1.sep,
                    tildify: !platform_1.isWindows,
                    normalizeDriveLetter: platform_1.isWindows
                }
            });
            const uri1 = testWorkspace_1.TestWorkspace.folders[0].uri.with({ path: testWorkspace_1.TestWorkspace.folders[0].uri.path.concat('/a/b/c/d') });
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: true }), platform_1.isWindows ? 'a\\b\\c\\d' : 'a/b/c/d');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), platform_1.isWindows ? 'C:\\testWorkspace\\a\\b\\c\\d' : '/testWorkspace/a/b/c/d');
            assert.strictEqual(labelService.getUriBasenameLabel(uri1), 'd');
            const uri2 = uri_1.URI.file('c:\\1/2/3');
            assert.strictEqual(labelService.getUriLabel(uri2, { relative: false }), platform_1.isWindows ? 'C:\\1\\2\\3' : '/c:\\1/2/3');
            assert.strictEqual(labelService.getUriBasenameLabel(uri2), '3');
        });
        test('separator', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL\\${path}\\${authority}\\END',
                    separator: '\\',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABEL\\\\1\\2\\3\\4\\5\\microsoft.com\\END');
            assert.strictEqual(labelService.getUriBasenameLabel(uri1), 'END');
        });
        test('custom authority', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'micro*',
                formatting: {
                    label: 'LABEL/${path}/${authority}/END',
                    separator: '/'
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABEL//1/2/3/4/5/microsoft.com/END');
            assert.strictEqual(labelService.getUriBasenameLabel(uri1), 'END');
        });
        test('mulitple authority', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'not_matching_but_long',
                formatting: {
                    label: 'first',
                    separator: '/'
                }
            });
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'microsof*',
                formatting: {
                    label: 'second',
                    separator: '/'
                }
            });
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'mi*',
                formatting: {
                    label: 'third',
                    separator: '/'
                }
            });
            // Make sure the most specific authority is picked
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'second');
            assert.strictEqual(labelService.getUriBasenameLabel(uri1), 'second');
        });
        test('custom query', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse(`vscode://microsoft.com/1/2/3/4/5?${encodeURIComponent(JSON.stringify({ prefix: 'prefix', path: 'path' }))}`);
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABELprefix: path/END');
        });
        test('custom query without value', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse(`vscode://microsoft.com/1/2/3/4/5?${encodeURIComponent(JSON.stringify({ path: 'path' }))}`);
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABEL: path/END');
        });
        test('custom query without query json', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5?path=foo');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABEL: /END');
        });
        test('custom query without query', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), 'LABEL: /END');
        });
        test('label caching', () => {
            const m = new memento_1.Memento('cachedResourceLabelFormatters2', storageService).getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            const makeFormatter = (scheme) => ({ formatting: { label: `\${path} (${scheme})`, separator: '/' }, scheme });
            assert.deepStrictEqual(m, {});
            // registers a new formatter:
            labelService.registerCachedFormatter(makeFormatter('a'));
            assert.deepStrictEqual(m, { formatters: [makeFormatter('a')] });
            // registers a 2nd formatter:
            labelService.registerCachedFormatter(makeFormatter('b'));
            assert.deepStrictEqual(m, { formatters: [makeFormatter('b'), makeFormatter('a')] });
            // promotes a formatter on re-register:
            labelService.registerCachedFormatter(makeFormatter('a'));
            assert.deepStrictEqual(m, { formatters: [makeFormatter('a'), makeFormatter('b')] });
            // no-ops if already in first place:
            labelService.registerCachedFormatter(makeFormatter('a'));
            assert.deepStrictEqual(m, { formatters: [makeFormatter('a'), makeFormatter('b')] });
            // limits the cache:
            for (let i = 0; i < 100; i++) {
                labelService.registerCachedFormatter(makeFormatter(`i${i}`));
            }
            const expected = [];
            for (let i = 50; i < 100; i++) {
                expected.unshift(makeFormatter(`i${i}`));
            }
            assert.deepStrictEqual(m, { formatters: expected });
            delete m.formatters;
        });
    });
    suite('multi-root workspace', () => {
        let labelService;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            const sources = uri_1.URI.file('folder1/src');
            const tests = uri_1.URI.file('folder1/test');
            const other = uri_1.URI.file('folder2');
            labelService = disposables.add(new labelService_1.LabelService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_2.TestContextService(new testWorkspace_1.Workspace('test-workspace', [
                new workspace_1.WorkspaceFolder({ uri: sources, index: 0, name: 'Sources' }),
                new workspace_1.WorkspaceFolder({ uri: tests, index: 1, name: 'Tests' }),
                new workspace_1.WorkspaceFolder({ uri: other, index: 2, name: resources.basename(other) }),
            ])), new workbenchTestServices_1.TestPathService(), new workbenchTestServices_1.TestRemoteAgentService(), disposables.add(new workbenchTestServices_2.TestStorageService()), disposables.add(new workbenchTestServices_1.TestLifecycleService())));
        });
        teardown(() => {
            disposables.clear();
        });
        test('labels of files in multiroot workspaces are the foldername followed by offset from the folder', () => {
            labelService.registerFormatter({
                scheme: 'file',
                formatting: {
                    label: '${authority}${path}',
                    separator: '/',
                    tildify: false,
                    normalizeDriveLetter: false,
                    authorityPrefix: '//',
                    workspaceSuffix: ''
                }
            });
            const tests = {
                'folder1/src/file': 'Sources • file',
                'folder1/src/folder/file': 'Sources • folder/file',
                'folder1/src': 'Sources',
                'folder1/other': '/folder1/other',
                'folder2/other': 'folder2 • other',
            };
            Object.entries(tests).forEach(([path, label]) => {
                const generated = labelService.getUriLabel(uri_1.URI.file(path), { relative: true });
                assert.strictEqual(generated, label);
            });
        });
        test('labels with context after path', () => {
            labelService.registerFormatter({
                scheme: 'file',
                formatting: {
                    label: '${path} (${scheme})',
                    separator: '/',
                }
            });
            const tests = {
                'folder1/src/file': 'Sources • file (file)',
                'folder1/src/folder/file': 'Sources • folder/file (file)',
                'folder1/src': 'Sources',
                'folder1/other': '/folder1/other (file)',
                'folder2/other': 'folder2 • other (file)',
            };
            Object.entries(tests).forEach(([path, label]) => {
                const generated = labelService.getUriLabel(uri_1.URI.file(path), { relative: true });
                assert.strictEqual(generated, label, path);
            });
        });
        test('stripPathStartingSeparator', () => {
            labelService.registerFormatter({
                scheme: 'file',
                formatting: {
                    label: '${path}',
                    separator: '/',
                    stripPathStartingSeparator: true
                }
            });
            const tests = {
                'folder1/src/file': 'Sources • file',
                'other/blah': 'other/blah',
            };
            Object.entries(tests).forEach(([path, label]) => {
                const generated = labelService.getUriLabel(uri_1.URI.file(path), { relative: true });
                assert.strictEqual(generated, label, path);
            });
        });
        test('relative label without formatter', () => {
            const rootFolder = uri_1.URI.parse('myscheme://myauthority/');
            labelService = disposables.add(new labelService_1.LabelService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_2.TestContextService(new testWorkspace_1.Workspace('test-workspace', [
                new workspace_1.WorkspaceFolder({ uri: rootFolder, index: 0, name: 'FSProotFolder' }),
            ])), new workbenchTestServices_1.TestPathService(undefined, rootFolder.scheme), new workbenchTestServices_1.TestRemoteAgentService(), disposables.add(new workbenchTestServices_2.TestStorageService()), disposables.add(new workbenchTestServices_1.TestLifecycleService())));
            const generated = labelService.getUriLabel(uri_1.URI.parse('myscheme://myauthority/some/folder/test.txt'), { relative: true });
            if (platform_1.isWindows) {
                assert.strictEqual(generated, 'some\\folder\\test.txt');
            }
            else {
                assert.strictEqual(generated, 'some/folder/test.txt');
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('workspace at FSP root', () => {
        let labelService;
        setup(() => {
            const rootFolder = uri_1.URI.parse('myscheme://myauthority/');
            labelService = new labelService_1.LabelService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_2.TestContextService(new testWorkspace_1.Workspace('test-workspace', [
                new workspace_1.WorkspaceFolder({ uri: rootFolder, index: 0, name: 'FSProotFolder' }),
            ])), new workbenchTestServices_1.TestPathService(), new workbenchTestServices_1.TestRemoteAgentService(), new workbenchTestServices_2.TestStorageService(), new workbenchTestServices_1.TestLifecycleService());
            labelService.registerFormatter({
                scheme: 'myscheme',
                formatting: {
                    label: '${scheme}://${authority}${path}',
                    separator: '/',
                    tildify: false,
                    normalizeDriveLetter: false,
                    workspaceSuffix: '',
                    authorityPrefix: '',
                    stripPathStartingSeparator: false
                }
            });
        });
        test('non-relative label', () => {
            const tests = {
                'myscheme://myauthority/myFile1.txt': 'myscheme://myauthority/myFile1.txt',
                'myscheme://myauthority/folder/myFile2.txt': 'myscheme://myauthority/folder/myFile2.txt',
            };
            Object.entries(tests).forEach(([uriString, label]) => {
                const generated = labelService.getUriLabel(uri_1.URI.parse(uriString), { relative: false });
                assert.strictEqual(generated, label);
            });
        });
        test('relative label', () => {
            const tests = {
                'myscheme://myauthority/myFile1.txt': 'myFile1.txt',
                'myscheme://myauthority/folder/myFile2.txt': 'folder/myFile2.txt',
            };
            Object.entries(tests).forEach(([uriString, label]) => {
                const generated = labelService.getUriLabel(uri_1.URI.parse(uriString), { relative: true });
                assert.strictEqual(generated, label);
            });
        });
        test('relative label with explicit path separator', () => {
            let generated = labelService.getUriLabel(uri_1.URI.parse('myscheme://myauthority/some/folder/test.txt'), { relative: true, separator: '/' });
            assert.strictEqual(generated, 'some/folder/test.txt');
            generated = labelService.getUriLabel(uri_1.URI.parse('myscheme://myauthority/some/folder/test.txt'), { relative: true, separator: '\\' });
            assert.strictEqual(generated, 'some\\folder\\test.txt');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9sYWJlbC90ZXN0L2Jyb3dzZXIvbGFiZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDdkIsSUFBSSxZQUEwQixDQUFDO1FBQy9CLElBQUksY0FBa0MsQ0FBQztRQUV2QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsY0FBYyxHQUFHLElBQUksMENBQWtCLEVBQUUsQ0FBQztZQUMxQyxZQUFZLEdBQUcsSUFBSSwyQkFBWSxDQUFDLDhDQUFzQixFQUFFLElBQUksMENBQWtCLEVBQUUsRUFBRSxJQUFJLHVDQUFlLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksOENBQXNCLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSw0Q0FBb0IsRUFBRSxDQUFDLENBQUM7UUFDdk0sQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUNyQixZQUFZLENBQUMsaUJBQWlCLENBQUM7Z0JBQzlCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLGdDQUFnQztvQkFDdkMsU0FBUyxFQUFFLEdBQUc7b0JBQ2QsT0FBTyxFQUFFLElBQUk7b0JBQ2Isb0JBQW9CLEVBQUUsSUFBSTtpQkFDMUI7YUFDRCxDQUFDLENBQUM7WUFFSCxNQUFNLElBQUksR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFD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