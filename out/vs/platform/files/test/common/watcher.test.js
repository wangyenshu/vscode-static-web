/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/platform/files/common/watcher"], function (require, exports, assert, event_1, lifecycle_1, platform_1, resources_1, uri_1, utils_1, files_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestFileWatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidFilesChange = this._register(new event_1.Emitter());
        }
        get onDidFilesChange() {
            return this._onDidFilesChange.event;
        }
        report(changes) {
            this.onRawFileEvents(changes);
        }
        onRawFileEvents(events) {
            // Coalesce
            const coalescedEvents = (0, watcher_1.coalesceEvents)(events);
            // Emit through event emitter
            if (coalescedEvents.length > 0) {
                this._onDidFilesChange.fire({ raw: (0, watcher_1.reviveFileChanges)(coalescedEvents), event: this.toFileChangesEvent(coalescedEvents) });
            }
        }
        toFileChangesEvent(changes) {
            return new files_1.FileChangesEvent((0, watcher_1.reviveFileChanges)(changes), !platform_1.isLinux);
        }
    }
    var Path;
    (function (Path) {
        Path[Path["UNIX"] = 0] = "UNIX";
        Path[Path["WINDOWS"] = 1] = "WINDOWS";
        Path[Path["UNC"] = 2] = "UNC";
    })(Path || (Path = {}));
    suite('Watcher', () => {
        (platform_1.isWindows ? test.skip : test)('parseWatcherPatterns - posix', () => {
            const path = '/users/data/src';
            let parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), true);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['/users/data/src/*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), true);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['/users/data/src/bar/*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), false);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), true);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['**/*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), true);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), true);
        });
        (!platform_1.isWindows ? test.skip : test)('parseWatcherPatterns - windows', () => {
            const path = 'c:\\users\\data\\src';
            let parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), true);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar/foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['c:\\users\\data\\src\\*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), true);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar\\foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['c:\\users\\data\\src\\bar/*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar\\foo.js'), true);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['**/*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), true);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar\\foo.js'), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('Watcher Events Normalizer', () => {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        test('simple add/update/delete', done => {
            const watch = disposables.add(new TestFileWatcher());
            const added = uri_1.URI.file('/users/data/src/added.txt');
            const updated = uri_1.URI.file('/users/data/src/updated.txt');
            const deleted = uri_1.URI.file('/users/data/src/deleted.txt');
            const raw = [
                { resource: added, type: 1 /* FileChangeType.ADDED */ },
                { resource: updated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: deleted, type: 2 /* FileChangeType.DELETED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 3);
                assert.ok(event.contains(added, 1 /* FileChangeType.ADDED */));
                assert.ok(event.contains(updated, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(deleted, 2 /* FileChangeType.DELETED */));
                done();
            }));
            watch.report(raw);
        });
        (platform_1.isWindows ? [Path.WINDOWS, Path.UNC] : [Path.UNIX]).forEach(path => {
            test(`delete only reported for top level folder (${path})`, done => {
                const watch = disposables.add(new TestFileWatcher());
                const deletedFolderA = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete1' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete1' : '\\\\localhost\\users\\data\\src\\todelete1');
                const deletedFolderB = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2' : '\\\\localhost\\users\\data\\src\\todelete2');
                const deletedFolderBF1 = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2/file.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\file.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\file.txt');
                const deletedFolderBF2 = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2/more/test.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\more\\test.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\more\\test.txt');
                const deletedFolderBF3 = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2/super/bar/foo.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\super\\bar\\foo.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\super\\bar\\foo.txt');
                const deletedFileA = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/deleteme.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\deleteme.txt' : '\\\\localhost\\users\\data\\src\\deleteme.txt');
                const addedFile = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/added.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\added.txt' : '\\\\localhost\\users\\data\\src\\added.txt');
                const updatedFile = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/updated.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\updated.txt' : '\\\\localhost\\users\\data\\src\\updated.txt');
                const raw = [
                    { resource: deletedFolderA, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderB, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderBF1, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderBF2, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderBF3, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFileA, type: 2 /* FileChangeType.DELETED */ },
                    { resource: addedFile, type: 1 /* FileChangeType.ADDED */ },
                    { resource: updatedFile, type: 0 /* FileChangeType.UPDATED */ }
                ];
                disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                    assert.ok(event);
                    assert.strictEqual(raw.length, 5);
                    assert.ok(event.contains(deletedFolderA, 2 /* FileChangeType.DELETED */));
                    assert.ok(event.contains(deletedFolderB, 2 /* FileChangeType.DELETED */));
                    assert.ok(event.contains(deletedFileA, 2 /* FileChangeType.DELETED */));
                    assert.ok(event.contains(addedFile, 1 /* FileChangeType.ADDED */));
                    assert.ok(event.contains(updatedFile, 0 /* FileChangeType.UPDATED */));
                    done();
                }));
                watch.report(raw);
            });
        });
        test('event coalescer: ignore CREATE followed by DELETE', done => {
            const watch = disposables.add(new TestFileWatcher());
            const created = uri_1.URI.file('/users/data/src/related');
            const deleted = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: created, type: 1 /* FileChangeType.ADDED */ },
                { resource: deleted, type: 2 /* FileChangeType.DELETED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 1);
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: flatten DELETE followed by CREATE into CHANGE', done => {
            const watch = disposables.add(new TestFileWatcher());
            const deleted = uri_1.URI.file('/users/data/src/related');
            const created = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: deleted, type: 2 /* FileChangeType.DELETED */ },
                { resource: created, type: 1 /* FileChangeType.ADDED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                assert.ok(event.contains(deleted, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: ignore UPDATE when CREATE received', done => {
            const watch = disposables.add(new TestFileWatcher());
            const created = uri_1.URI.file('/users/data/src/related');
            const updated = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: created, type: 1 /* FileChangeType.ADDED */ },
                { resource: updated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                assert.ok(event.contains(created, 1 /* FileChangeType.ADDED */));
                assert.ok(!event.contains(created, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: apply DELETE', done => {
            const watch = disposables.add(new TestFileWatcher());
            const updated = uri_1.URI.file('/users/data/src/related');
            const updated2 = uri_1.URI.file('/users/data/src/related');
            const deleted = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: updated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: updated2, type: 0 /* FileChangeType.UPDATED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: updated, type: 2 /* FileChangeType.DELETED */ }
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                assert.ok(event.contains(deleted, 2 /* FileChangeType.DELETED */));
                assert.ok(!event.contains(updated, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: track case renames', done => {
            const watch = disposables.add(new TestFileWatcher());
            const oldPath = uri_1.URI.file('/users/data/src/added');
            const newPath = uri_1.URI.file('/users/data/src/ADDED');
            const raw = [
                { resource: newPath, type: 1 /* FileChangeType.ADDED */ },
                { resource: oldPath, type: 2 /* FileChangeType.DELETED */ }
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                for (const r of raw) {
                    if ((0, resources_1.isEqual)(r.resource, oldPath)) {
                        assert.strictEqual(r.type, 2 /* FileChangeType.DELETED */);
                    }
                    else if ((0, resources_1.isEqual)(r.resource, newPath)) {
                        assert.strictEqual(r.type, 1 /* FileChangeType.ADDED */);
                    }
                    else {
                        assert.fail();
                    }
                }
                done();
            }));
            watch.report(raw);
        });
        test('event type filter', () => {
            const resource = uri_1.URI.file('/users/data/src/related');
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 1 /* FileChangeType.ADDED */ }, undefined), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 0 /* FileChangeType.UPDATED */ }, undefined), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 2 /* FileChangeType.DELETED */ }, undefined), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 1 /* FileChangeType.ADDED */ }, 2 /* FileChangeFilter.UPDATED */), true);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 1 /* FileChangeType.ADDED */ }, 2 /* FileChangeFilter.UPDATED */ | 8 /* FileChangeFilter.DELETED */), true);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 1 /* FileChangeType.ADDED */ }, 4 /* FileChangeFilter.ADDED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 1 /* FileChangeType.ADDED */ }, 4 /* FileChangeFilter.ADDED */ | 2 /* FileChangeFilter.UPDATED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 1 /* FileChangeType.ADDED */ }, 4 /* FileChangeFilter.ADDED */ | 2 /* FileChangeFilter.UPDATED */ | 8 /* FileChangeFilter.DELETED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 2 /* FileChangeType.DELETED */ }, 2 /* FileChangeFilter.UPDATED */), true);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 2 /* FileChangeType.DELETED */ }, 2 /* FileChangeFilter.UPDATED */ | 4 /* FileChangeFilter.ADDED */), true);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 2 /* FileChangeType.DELETED */ }, 8 /* FileChangeFilter.DELETED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 2 /* FileChangeType.DELETED */ }, 8 /* FileChangeFilter.DELETED */ | 2 /* FileChangeFilter.UPDATED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 2 /* FileChangeType.DELETED */ }, 4 /* FileChangeFilter.ADDED */ | 8 /* FileChangeFilter.DELETED */ | 2 /* FileChangeFilter.UPDATED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 0 /* FileChangeType.UPDATED */ }, 4 /* FileChangeFilter.ADDED */), true);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 0 /* FileChangeType.UPDATED */ }, 8 /* FileChangeFilter.DELETED */ | 4 /* FileChangeFilter.ADDED */), true);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 0 /* FileChangeType.UPDATED */ }, 2 /* FileChangeFilter.UPDATED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 0 /* FileChangeType.UPDATED */ }, 8 /* FileChangeFilter.DELETED */ | 2 /* FileChangeFilter.UPDATED */), false);
            assert.strictEqual((0, watcher_1.isFiltered)({ resource, type: 0 /* FileChangeType.UPDATED */ }, 4 /* FileChangeFilter.ADDED */ | 8 /* FileChangeFilter.DELETED */ | 2 /* FileChangeFilter.UPDATED */), false);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvdGVzdC9jb21tb24vd2F0Y2hlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTtRQUd2QztZQUNDLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1ELENBQUMsQ0FBQztRQUN6RyxDQUFDO1FBRUQsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBc0I7WUFDNUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU8sZUFBZSxDQUFDLE1BQXFCO1lBRTVDLFdBQVc7WUFDWCxNQUFNLGVBQWUsR0FBRyxJQUFBLHdCQUFjLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFFL0MsNkJBQTZCO1lBQzdCLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFBLDJCQUFpQixFQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzNILENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCLENBQUMsT0FBc0I7WUFDaEQsT0FBTyxJQUFJLHdCQUFnQixDQUFDLElBQUEsMkJBQWlCLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxrQkFBTyxDQUFD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