/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/common/explorerModel", "vs/base/test/common/utils", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, platform_1, uri_1, path_1, fileActions_1, explorerModel_1, utils_1, workbenchTestServices_1, testConfigurationService_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - View Model', function () {
        const fileService = new workbenchTestServices_1.TestFileService();
        const configService = new testConfigurationService_1.TestConfigurationService();
        function createStat(path, name, isFolder, hasChildren, size, mtime) {
            return new explorerModel_1.ExplorerItem(utils_1.toResource.call(this, path), fileService, configService, workbenchTestServices_2.NullFilesConfigurationService, undefined, isFolder, false, false, false, name, mtime);
        }
        const pathService = new workbenchTestServices_1.TestPathService();
        test('Properties', function () {
            const d = new Date().getTime();
            let s = createStat.call(this, '/path/to/stat', 'sName', true, true, 8096, d);
            assert.strictEqual(s.isDirectoryResolved, false);
            assert.strictEqual(s.resource.fsPath, utils_1.toResource.call(this, '/path/to/stat').fsPath);
            assert.strictEqual(s.name, 'sName');
            assert.strictEqual(s.isDirectory, true);
            assert.strictEqual(s.mtime, new Date(d).getTime());
            s = createStat.call(this, '/path/to/stat', 'sName', false, false, 8096, d);
        });
        test('Add and Remove Child, check for hasChild', function () {
            const d = new Date().getTime();
            const s = createStat.call(this, '/path/to/stat', 'sName', true, false, 8096, d);
            const child1 = createStat.call(this, '/path/to/stat/foo', 'foo', true, false, 8096, d);
            const child4 = createStat.call(this, '/otherpath/to/other/otherbar.html', 'otherbar.html', false, false, 8096, d);
            s.addChild(child1);
            assert(!!s.getChild(child1.name));
            s.removeChild(child1);
            s.addChild(child1);
            assert(!!s.getChild(child1.name));
            s.removeChild(child1);
            assert(!s.getChild(child1.name));
            // Assert that adding a child updates its path properly
            s.addChild(child4);
            assert.strictEqual(child4.resource.fsPath, utils_1.toResource.call(this, '/path/to/stat/' + child4.name).fsPath);
        });
        test('Move', function () {
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/', '/', true, false, 8096, d);
            const s2 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s4 = createStat.call(this, '/path/to/stat', 'stat', false, false, 8096, d);
            s1.addChild(s2);
            s2.addChild(s3);
            s3.addChild(s4);
            s4.move(s1);
            // Assert the new path of the moved element
            assert.strictEqual(s4.resource.fsPath, utils_1.toResource.call(this, '/' + s4.name).fsPath);
            // Move a subtree with children
            const leaf = createStat.call(this, '/leaf', 'leaf', true, false, 8096, d);
            const leafC1 = createStat.call(this, '/leaf/folder', 'folder', true, false, 8096, d);
            const leafCC2 = createStat.call(this, '/leaf/folder/index.html', 'index.html', true, false, 8096, d);
            leaf.addChild(leafC1);
            leafC1.addChild(leafCC2);
            s1.addChild(leaf);
            leafC1.move(s3);
            assert.strictEqual(leafC1.resource.fsPath, uri_1.URI.file(s3.resource.fsPath + '/' + leafC1.name).fsPath);
            assert.strictEqual(leafCC2.resource.fsPath, uri_1.URI.file(leafC1.resource.fsPath + '/' + leafCC2.name).fsPath);
        });
        test('Rename', function () {
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/', '/', true, false, 8096, d);
            const s2 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s4 = createStat.call(this, '/path/to/stat', 'stat', true, false, 8096, d);
            s1.addChild(s2);
            s2.addChild(s3);
            s3.addChild(s4);
            assert.strictEqual(s1.getChild(s2.name), s2);
            const s2renamed = createStat.call(this, '/otherpath', 'otherpath', true, true, 8096, d);
            s2.rename(s2renamed);
            assert.strictEqual(s1.getChild(s2.name), s2);
            // Verify the paths have changed including children
            assert.strictEqual(s2.name, s2renamed.name);
            assert.strictEqual(s2.resource.fsPath, s2renamed.resource.fsPath);
            assert.strictEqual(s3.resource.fsPath, utils_1.toResource.call(this, '/otherpath/to').fsPath);
            assert.strictEqual(s4.resource.fsPath, utils_1.toResource.call(this, '/otherpath/to/stat').fsPath);
            const s4renamed = createStat.call(this, '/otherpath/to/statother.js', 'statother.js', true, false, 8096, d);
            s4.rename(s4renamed);
            assert.strictEqual(s3.getChild(s4.name), s4);
            assert.strictEqual(s4.name, s4renamed.name);
            assert.strictEqual(s4.resource.fsPath, s4renamed.resource.fsPath);
        });
        test('Find', function () {
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/', '/', true, false, 8096, d);
            const s2 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s4 = createStat.call(this, '/path/to/stat', 'stat', true, false, 8096, d);
            const s4Upper = createStat.call(this, '/path/to/STAT', 'stat', true, false, 8096, d);
            const child1 = createStat.call(this, '/path/to/stat/foo', 'foo', true, false, 8096, d);
            const child2 = createStat.call(this, '/path/to/stat/foo/bar.html', 'bar.html', false, false, 8096, d);
            s1.addChild(s2);
            s2.addChild(s3);
            s3.addChild(s4);
            s4.addChild(child1);
            child1.addChild(child2);
            assert.strictEqual(s1.find(child2.resource), child2);
            assert.strictEqual(s1.find(child1.resource), child1);
            assert.strictEqual(s1.find(s4.resource), s4);
            assert.strictEqual(s1.find(s3.resource), s3);
            assert.strictEqual(s1.find(s2.resource), s2);
            if (platform_1.isLinux) {
                assert.ok(!s1.find(s4Upper.resource));
            }
            else {
                assert.strictEqual(s1.find(s4Upper.resource), s4);
            }
            assert.strictEqual(s1.find(utils_1.toResource.call(this, 'foobar')), null);
            assert.strictEqual(s1.find(utils_1.toResource.call(this, '/')), s1);
        });
        test('Find with mixed case', function () {
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/', '/', true, false, 8096, d);
            const s2 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s4 = createStat.call(this, '/path/to/stat', 'stat', true, false, 8096, d);
            const child1 = createStat.call(this, '/path/to/stat/foo', 'foo', true, false, 8096, d);
            const child2 = createStat.call(this, '/path/to/stat/foo/bar.html', 'bar.html', false, false, 8096, d);
            s1.addChild(s2);
            s2.addChild(s3);
            s3.addChild(s4);
            s4.addChild(child1);
            child1.addChild(child2);
            if (platform_1.isLinux) { // linux is case sensitive
                assert.ok(!s1.find(utils_1.toResource.call(this, '/path/to/stat/Foo')));
                assert.ok(!s1.find(utils_1.toResource.call(this, '/Path/to/stat/foo/bar.html')));
            }
            else {
                assert.ok(s1.find(utils_1.toResource.call(this, '/path/to/stat/Foo')));
                assert.ok(s1.find(utils_1.toResource.call(this, '/Path/to/stat/foo/bar.html')));
            }
        });
        test('Validate File Name (For Create)', function () {
            const d = new Date().getTime();
            const s = createStat.call(this, '/path/to/stat', 'sName', true, true, 8096, d);
            const sChild = createStat.call(this, '/path/to/stat/alles.klar', 'alles.klar', true, true, 8096, d);
            s.addChild(sChild);
            assert((0, fileActions_1.validateFileName)(pathService, s, null, platform_1.OS) !== null);
            assert((0, fileActions_1.validateFileName)(pathService, s, '', platform_1.OS) !== null);
            assert((0, fileActions_1.validateFileName)(pathService, s, '  ', platform_1.OS) !== null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'Read Me', platform_1.OS) === null, 'name containing space');
            if (platform_1.isWindows) {
                assert((0, fileActions_1.validateFileName)(pathService, s, 'foo:bar', platform_1.OS) !== null);
                assert((0, fileActions_1.validateFileName)(pathService, s, 'foo*bar', platform_1.OS) !== null);
                assert((0, fileActions_1.validateFileName)(pathService, s, 'foo?bar', platform_1.OS) !== null);
                assert((0, fileActions_1.validateFileName)(pathService, s, 'foo<bar', platform_1.OS) !== null);
                assert((0, fileActions_1.validateFileName)(pathService, s, 'foo>bar', platform_1.OS) !== null);
                assert((0, fileActions_1.validateFileName)(pathService, s, 'foo|bar', platform_1.OS) !== null);
            }
            assert((0, fileActions_1.validateFileName)(pathService, s, 'alles.klar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, '.foo', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'foo.bar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'foo', platform_1.OS) === null);
        });
        test('Validate File Name (For Rename)', function () {
            const d = new Date().getTime();
            const s = createStat.call(this, '/path/to/stat', 'sName', true, true, 8096, d);
            const sChild = createStat.call(this, '/path/to/stat/alles.klar', 'alles.klar', true, true, 8096, d);
            s.addChild(sChild);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'alles.klar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'Alles.klar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'Alles.Klar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, '.foo', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'foo.bar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, s, 'foo', platform_1.OS) === null);
        });
        test('Validate Multi-Path File Names', function () {
            const d = new Date().getTime();
            const wsFolder = createStat.call(this, '/', 'workspaceFolder', true, false, 8096, d);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, 'foo/bar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, 'foo\\bar', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, 'all/slashes/are/same', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, 'theres/one/different\\slash', platform_1.OS) === null);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, '/slashAtBeginning', platform_1.OS) !== null);
            // attempting to add a child to a deeply nested file
            const s1 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s2 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to/stat', 'stat', true, false, 8096, d);
            wsFolder.addChild(s1);
            s1.addChild(s2);
            s2.addChild(s3);
            const fileDeeplyNested = createStat.call(this, '/path/to/stat/fileNested', 'fileNested', false, false, 8096, d);
            s3.addChild(fileDeeplyNested);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, '/path/to/stat/fileNested/aChild', platform_1.OS) !== null);
            // detect if path already exists
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, '/path/to/stat/fileNested', platform_1.OS) !== null);
            assert((0, fileActions_1.validateFileName)(pathService, wsFolder, '/path/to/stat/', platform_1.OS) !== null);
        });
        test('Merge Local with Disk', function () {
            const merge1 = new explorerModel_1.ExplorerItem(uri_1.URI.file((0, path_1.join)('C:\\', '/path/to')), fileService, configService, workbenchTestServices_2.NullFilesConfigurationService, undefined, true, false, false, false, 'to', Date.now());
            const merge2 = new explorerModel_1.ExplorerItem(uri_1.URI.file((0, path_1.join)('C:\\', '/path/to')), fileService, configService, workbenchTestServices_2.NullFilesConfigurationService, undefined, true, false, false, false, 'to', Date.now());
            // Merge Properties
            explorerModel_1.ExplorerItem.mergeLocalWithDisk(merge2, merge1);
            assert.strictEqual(merge1.mtime, merge2.mtime);
            // Merge Child when isDirectoryResolved=false is a no-op
            merge2.addChild(new explorerModel_1.ExplorerItem(uri_1.URI.file((0, path_1.join)('C:\\', '/path/to/foo.html')), fileService, configService, workbenchTestServices_2.NullFilesConfigurationService, undefined, true, false, false, false, 'foo.html', Date.now()));
            explorerModel_1.ExplorerItem.mergeLocalWithDisk(merge2, merge1);
            // Merge Child with isDirectoryResolved=true
            const child = new explorerModel_1.ExplorerItem(uri_1.URI.file((0, path_1.join)('C:\\', '/path/to/foo.html')), fileService, configService, workbenchTestServices_2.NullFilesConfigurationService, undefined, true, false, false, false, 'foo.html', Date.now());
            merge2.removeChild(child);
            merge2.addChild(child);
            merge2._isDirectoryResolved = true;
            explorerModel_1.ExplorerItem.mergeLocalWithDisk(merge2, merge1);
            assert.strictEqual(merge1.getChild('foo.html').name, 'foo.html');
            assert.deepStrictEqual(merge1.getChild('foo.html').parent, merge1, 'Check parent');
            // Verify that merge does not replace existing children, but updates properties in that case
            const existingChild = merge1.getChild('foo.html');
            explorerModel_1.ExplorerItem.mergeLocalWithDisk(merge2, merge1);
            assert.ok(existingChild === merge1.getChild(existingChild.name));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvdGVzdC9icm93c2VyL2V4cGxvcmVyTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUU7UUFFM0IsTUFBTSxXQUFXLEdBQUcsSUFBSSx1Q0FBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1FBRXJELFNBQVMsVUFBVSxDQUFZLElBQVksRUFBRSxJQUFZLEVBQUUsUUFBaUIsRUFBRSxXQUFvQixFQUFFLElBQVksRUFBRSxLQUFhO1lBQzlILE9BQU8sSUFBSSw0QkFBWSxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLHFEQUE2QixFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hLLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLHVDQUFlLEVBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ2xCLE1BQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU3RSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIs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