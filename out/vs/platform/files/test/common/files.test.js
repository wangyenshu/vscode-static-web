/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/files/common/files"], function (require, exports, assert, extpath_1, platform_1, uri_1, utils_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files', () => {
        test('FileChangesEvent - basics', function () {
            const changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */ },
                { resource: utils_1.toResource.call(this, '/bar/deleted.txt'), type: 2 /* FileChangeType.DELETED */ },
                { resource: utils_1.toResource.call(this, '/bar/folder'), type: 2 /* FileChangeType.DELETED */ },
                { resource: utils_1.toResource.call(this, '/BAR/FOLDER'), type: 2 /* FileChangeType.DELETED */ }
            ];
            for (const ignorePathCasing of [false, true]) {
                const event = new files_1.FileChangesEvent(changes, ignorePathCasing);
                assert(!event.contains(utils_1.toResource.call(this, '/foo'), 0 /* FileChangeType.UPDATED */));
                assert(event.affects(utils_1.toResource.call(this, '/foo'), 0 /* FileChangeType.UPDATED */));
                assert(event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */));
                assert(event.affects(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */));
                assert(event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */));
                assert(event.affects(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */));
                assert(event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */, 2 /* FileChangeType.DELETED */));
                assert(!event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 1 /* FileChangeType.ADDED */, 2 /* FileChangeType.DELETED */));
                assert(!event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 1 /* FileChangeType.ADDED */));
                assert(!event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 2 /* FileChangeType.DELETED */));
                assert(!event.affects(utils_1.toResource.call(this, '/foo/updated.txt'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/bar/folder'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/BAR/FOLDER'), 2 /* FileChangeType.DELETED */));
                assert(event.affects(utils_1.toResource.call(this, '/BAR'), 2 /* FileChangeType.DELETED */));
                if (ignorePathCasing) {
                    assert(event.contains(utils_1.toResource.call(this, '/BAR/folder'), 2 /* FileChangeType.DELETED */));
                    assert(event.affects(utils_1.toResource.call(this, '/bar'), 2 /* FileChangeType.DELETED */));
                }
                else {
                    assert(!event.contains(utils_1.toResource.call(this, '/BAR/folder'), 2 /* FileChangeType.DELETED */));
                    assert(event.affects(utils_1.toResource.call(this, '/bar'), 2 /* FileChangeType.DELETED */));
                }
                assert(event.contains(utils_1.toResource.call(this, '/bar/folder/somefile'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/bar/folder/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/BAR/FOLDER/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                if (ignorePathCasing) {
                    assert(event.contains(utils_1.toResource.call(this, '/BAR/folder/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                }
                else {
                    assert(!event.contains(utils_1.toResource.call(this, '/BAR/folder/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                }
                assert(!event.contains(utils_1.toResource.call(this, '/bar/folder2/somefile'), 2 /* FileChangeType.DELETED */));
                assert.strictEqual(1, event.rawAdded.length);
                assert.strictEqual(2, event.rawUpdated.length);
                assert.strictEqual(3, event.rawDeleted.length);
                assert.strictEqual(true, event.gotAdded());
                assert.strictEqual(true, event.gotUpdated());
                assert.strictEqual(true, event.gotDeleted());
            }
        });
        test('FileChangesEvent - supports multiple changes on file tree', function () {
            for (const type of [1 /* FileChangeType.ADDED */, 0 /* FileChangeType.UPDATED */, 2 /* FileChangeType.DELETED */]) {
                const changes = [
                    { resource: utils_1.toResource.call(this, '/foo/bar/updated.txt'), type },
                    { resource: utils_1.toResource.call(this, '/foo/bar/otherupdated.txt'), type },
                    { resource: utils_1.toResource.call(this, '/foo/bar'), type },
                    { resource: utils_1.toResource.call(this, '/foo'), type },
                    { resource: utils_1.toResource.call(this, '/bar'), type },
                    { resource: utils_1.toResource.call(this, '/bar/foo'), type },
                    { resource: utils_1.toResource.call(this, '/bar/foo/updated.txt'), type },
                    { resource: utils_1.toResource.call(this, '/bar/foo/otherupdated.txt'), type }
                ];
                for (const ignorePathCasing of [false, true]) {
                    const event = new files_1.FileChangesEvent(changes, ignorePathCasing);
                    for (const change of changes) {
                        assert(event.contains(change.resource, type));
                        assert(event.affects(change.resource, type));
                    }
                    assert(event.affects(utils_1.toResource.call(this, '/foo'), type));
                    assert(event.affects(utils_1.toResource.call(this, '/bar'), type));
                    assert(event.affects(utils_1.toResource.call(this, '/'), type));
                    assert(!event.affects(utils_1.toResource.call(this, '/foobar'), type));
                    assert(!event.contains(utils_1.toResource.call(this, '/some/foo/bar'), type));
                    assert(!event.affects(utils_1.toResource.call(this, '/some/foo/bar'), type));
                    assert(!event.contains(utils_1.toResource.call(this, '/some/bar'), type));
                    assert(!event.affects(utils_1.toResource.call(this, '/some/bar'), type));
                    switch (type) {
                        case 1 /* FileChangeType.ADDED */:
                            assert.strictEqual(8, event.rawAdded.length);
                            break;
                        case 2 /* FileChangeType.DELETED */:
                            assert.strictEqual(8, event.rawDeleted.length);
                            break;
                    }
                }
            }
        });
        test('FileChangesEvent - correlation', function () {
            let changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */ },
            ];
            let event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), false);
            assert.strictEqual(event.correlates(100), false);
            changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */, cId: 100 },
            ];
            event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), true);
            assert.strictEqual(event.correlates(100), true);
            assert.strictEqual(event.correlates(120), false);
            changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */, cId: 100 },
            ];
            event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), false);
            assert.strictEqual(event.correlates(100), false);
            assert.strictEqual(event.correlates(120), false);
            changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 120 },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */, cId: 100 },
            ];
            event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), false);
            assert.strictEqual(event.correlates(100), false);
            assert.strictEqual(event.correlates(120), false);
        });
        function testIsEqual(testMethod) {
            // corner cases
            assert(testMethod('', '', true));
            assert(!testMethod(null, '', true));
            assert(!testMethod(undefined, '', true));
            // basics (string)
            assert(testMethod('/', '/', true));
            assert(testMethod('/some', '/some', true));
            assert(testMethod('/some/path', '/some/path', true));
            assert(testMethod('c:\\', 'c:\\', true));
            assert(testMethod('c:\\some', 'c:\\some', true));
            assert(testMethod('c:\\some\\path', 'c:\\some\\path', true));
            assert(testMethod('/someöäü/path', '/someöäü/path', true));
            assert(testMethod('c:\\someöäü\\path', 'c:\\someöäü\\path', true));
            assert(!testMethod('/some/path', '/some/other/path', true));
            assert(!testMethod('c:\\some\\path', 'c:\\some\\other\\path', true));
            assert(!testMethod('c:\\some\\path', 'd:\\some\\path', true));
            assert(testMethod('/some/path', '/some/PATH', true));
            assert(testMethod('/someöäü/path', '/someÖÄÜ/PATH', true));
            assert(testMethod('c:\\some\\path', 'c:\\some\\PATH', true));
            assert(testMethod('c:\\someöäü\\path', 'c:\\someÖÄÜ\\PATH', true));
            assert(testMethod('c:\\some\\path', 'C:\\some\\PATH', true));
        }
        test('isEqual (ignoreCase)', function () {
            testIsEqual(extpath_1.isEqual);
            // basics (uris)
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/some/path').fsPath, uri_1.URI.file('/some/path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('c:\\some\\path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/someöäü/path').fsPath, uri_1.URI.file('/someöäü/path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\someöäü\\path').fsPath, uri_1.URI.file('c:\\someöäü\\path').fsPath, true));
            assert(!(0, extpath_1.isEqual)(uri_1.URI.file('/some/path').fsPath, uri_1.URI.file('/some/other/path').fsPath, true));
            assert(!(0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('c:\\some\\other\\path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/some/path').fsPath, uri_1.URI.file('/some/PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/someöäü/path').fsPath, uri_1.URI.file('/someÖÄÜ/PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('c:\\some\\PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\someöäü\\path').fsPath, uri_1.URI.file('c:\\someÖÄÜ\\PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('C:\\some\\PATH').fsPath, true));
        });
        test('isParent (ignorecase)', function () {
            if (platform_1.isWindows) {
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\some', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\some\\', true));
                assert((0, files_1.isParent)('c:\\someöäü\\path', 'c:\\someöäü', true));
                assert((0, files_1.isParent)('c:\\someöäü\\path', 'c:\\someöäü\\', true));
                assert((0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar', true));
                assert((0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'C:\\', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\SOME', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\SOME\\', true));
                assert(!(0, files_1.isParent)('c:\\some\\path', 'd:\\', true));
                assert(!(0, files_1.isParent)('c:\\some\\path', 'c:\\some\\path', true));
                assert(!(0, files_1.isParent)('c:\\some\\path', 'd:\\some\\path', true));
                assert(!(0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\barr', true));
                assert(!(0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test', true));
            }
            if (platform_1.isMacintosh || platform_1.isLinux) {
                assert((0, files_1.isParent)('/some/path', '/', true));
                assert((0, files_1.isParent)('/some/path', '/some', true));
                assert((0, files_1.isParent)('/some/path', '/some/', true));
                assert((0, files_1.isParent)('/someöäü/path', '/someöäü', true));
                assert((0, files_1.isParent)('/someöäü/path', '/someöäü/', true));
                assert((0, files_1.isParent)('/foo/bar/test.ts', '/foo/bar', true));
                assert((0, files_1.isParent)('/foo/bar/test.ts', '/foo/bar/', true));
                assert((0, files_1.isParent)('/some/path', '/SOME', true));
                assert((0, files_1.isParent)('/some/path', '/SOME/', true));
                assert((0, files_1.isParent)('/someöäü/path', '/SOMEÖÄÜ', true));
                assert((0, files_1.isParent)('/someöäü/path', '/SOMEÖÄÜ/', true));
                assert(!(0, files_1.isParent)('/some/path', '/some/path', true));
                assert(!(0, files_1.isParent)('/foo/bar/test.ts', '/foo/barr', true));
                assert(!(0, files_1.isParent)('/foo/bar/test.ts', '/foo/bar/test', true));
            }
        });
        test('isEqualOrParent (ignorecase)', function () {
            // same assertions apply as with isEqual()
            testIsEqual(extpath_1.isEqualOrParent); //
            if (platform_1.isWindows) {
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\some', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\some\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\someöäü\\path', 'c:\\someöäü', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\someöäü\\path', 'c:\\someöäü\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\some\\path', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test.ts', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'C:\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\SOME', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\SOME\\', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\some\\path', 'd:\\', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\some\\path', 'd:\\some\\path', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\barr', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test.', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\BAR\\test.', true));
            }
            if (platform_1.isMacintosh || platform_1.isLinux) {
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/some', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/some/', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/someöäü', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/someöäü/', true));
                assert((0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/bar', true));
                assert((0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/bar/', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/some/path', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/SOME', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/SOME/', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/SOMEÖÄÜ', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/SOMEÖÄÜ/', true));
                assert(!(0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/barr', true));
                assert(!(0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/bar/test', true));
                assert(!(0, extpath_1.isEqualOrParent)('foo/bar/test.ts', 'foo/bar/test.', true));
                assert(!(0, extpath_1.isEqualOrParent)('foo/bar/test.ts', 'foo/BAR/test.', true));
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL3Rlc3QvY29tbW9uL2ZpbGVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7UUFFbkIsSUFBSSxDQUFDLDJCQUEyQixFQUFFO1lBQ2pDLE1BQU0sT0FBTyxHQUFHO2dCQUNmLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUU7Z0JBQ3JGLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUU7Z0JBQzFGLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRSxJQUFJLDhCQUFzQixFQUFFO2dCQUM3RSxFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxJQUFJLGdDQUF3QixFQUFFO2dCQUNyRixFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRTtnQkFDaEYsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUU7YUFDaEYsQ0FBQztZQUVGLEtBQUssTUFBTSxnQkFBZ0IsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLEtBQUss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