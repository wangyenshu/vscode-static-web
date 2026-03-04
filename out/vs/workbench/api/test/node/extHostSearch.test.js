/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/node/extHostSearch", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, assert, arrays_1, async_1, cancellation_1, errors_1, marshalling_1, resources_1, uri_1, mock_1, utils_1, log_1, extHost_protocol_1, extHostTypes_1, extHostUriTransformerService_1, extHostSearch_1, testRPCProtocol_1, search_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let rpcProtocol;
    let extHostSearch;
    let mockMainThreadSearch;
    class MockMainThreadSearch {
        constructor() {
            this.results = [];
        }
        $registerFileSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $registerTextSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $registerAITextSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $unregisterProvider(handle) {
        }
        $handleFileMatch(handle, session, data) {
            this.results.push(...data);
        }
        $handleTextMatch(handle, session, data) {
            this.results.push(...data);
        }
        $handleTelemetry(eventName, data) {
        }
        dispose() {
        }
    }
    let mockPFS;
    function extensionResultIsMatch(data) {
        return !!data.preview;
    }
    suite('ExtHostSearch', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function registerTestTextSearchProvider(provider, scheme = 'file') {
            disposables.add(extHostSearch.registerTextSearchProvider(scheme, provider));
            await rpcProtocol.sync();
        }
        async function registerTestFileSearchProvider(provider, scheme = 'file') {
            disposables.add(extHostSearch.registerFileSearchProvider(scheme, provider));
            await rpcProtocol.sync();
        }
        async function runFileSearch(query, cancel = false) {
            let stats;
            try {
                const cancellation = new cancellation_1.CancellationTokenSource();
                const p = extHostSearch.$provideFileSearchResults(mockMainThreadSearch.lastHandle, 0, query, cancellation.token);
                if (cancel) {
                    await (0, async_1.timeout)(0);
                    cancellation.cancel();
                }
                stats = await p;
            }
            catch (err) {
                if (!(0, errors_1.isCancellationError)(err)) {
                    await rpcProtocol.sync();
                    throw err;
                }
            }
            await rpcProtocol.sync();
            return {
                results: mockMainThreadSearch.results.map(r => uri_1.URI.revive(r)),
                stats: stats
            };
        }
        async function runTextSearch(query) {
            let stats;
            try {
                const cancellation = new cancellation_1.CancellationTokenSource();
                const p = extHostSearch.$provideTextSearchResults(mockMainThreadSearch.lastHandle, 0, query, cancellation.token);
                stats = await p;
            }
            catch (err) {
                if (!(0, errors_1.isCancellationError)(err)) {
                    await rpcProtocol.sync();
                    throw err;
                }
            }
            await rpcProtocol.sync();
            const results = (0, marshalling_1.revive)(mockMainThreadSearch.results);
            return { results, stats: stats };
        }
        setup(() => {
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            mockMainThreadSearch = new MockMainThreadSearch();
            const logService = new log_1.NullLogService();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadSearch, mockMainThreadSearch);
            mockPFS = {};
            extHostSearch = disposables.add(new class extends extHostSearch_1.NativeExtHostSearch {
                constructor() {
                    super(rpcProtocol, new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.remote = { isRemote: false, authority: undefined, connectionData: null };
                        }
                    }, new extHostUriTransformerService_1.URITransformerService(null), logService);
                    this._pfs = mockPFS;
                }
                createTextSearchManager(query, provider) {
                    return new textSearchManager_1.NativeTextSearchManager(query, provider, this._pfs);
                }
            });
        });
        teardown(() => {
            return rpcProtocol.sync();
        });
        const rootFolderA = uri_1.URI.file('/foo/bar1');
        const rootFolderB = uri_1.URI.file('/foo/bar2');
        const fancyScheme = 'fancy';
        const fancySchemeFolderA = uri_1.URI.from({ scheme: fancyScheme, path: '/project/folder1' });
        suite('File:', () => {
            function getSimpleQuery(filePattern = '') {
                return {
                    type: 1 /* QueryType.File */,
                    filePattern,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
            }
            function compareURIs(actual, expected) {
                const sortAndStringify = (arr) => arr.sort().map(u => u.toString());
                assert.deepStrictEqual(sortAndStringify(actual), sortAndStringify(expected));
            }
            test('no results', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = await runFileSearch(getSimpleQuery());
                assert(!stats.limitHit);
                assert(!results.length);
            });
            test('simple results', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'subfolder/file3.ts')
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults);
                    }
                });
                const { results, stats } = await runFileSearch(getSimpleQuery());
                assert(!stats.limitHit);
                assert.strictEqual(results.length, 3);
                compareURIs(results, reportedResults);
            });
            test('Search canceled', async () => {
                let cancelRequested = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return new Promise((resolve, reject) => {
                            function onCancel() {
                                cancelRequested = true;
                                resolve([(0, resources_1.joinPath)(options.folder, 'file1.ts')]); // or reject or nothing?
                            }
                            if (token.isCancellationRequested) {
                                onCancel();
                            }
                            else {
                                disposables.add(token.onCancellationRequested(() => onCancel()));
                            }
                        });
                    }
                });
                const { results } = await runFileSearch(getSimpleQuery(), true);
                assert(cancelRequested);
                assert(!results.length);
            });
            test('provider returns null', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return null;
                    }
                });
                try {
                    await runFileSearch(getSimpleQuery());
                    assert(false, 'Expected to fail');
                }
                catch {
                    // Expected to throw
                }
            });
            test('all provider calls get global include/excludes', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        assert(options.excludes.length === 2 && options.includes.length === 2, 'Missing global include/excludes');
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: {
                        'foo': true,
                        'bar': true
                    },
                    excludePattern: {
                        'something': true,
                        'else': true
                    },
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                await runFileSearch(query);
            });
            test('global/local include/excludes combined', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        if (options.folder.toString() === rootFolderA.toString()) {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts', 'foo']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js', 'bar']);
                        }
                        else {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js']);
                        }
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                'foo': true
                            },
                            excludePattern: {
                                'bar': true
                            }
                        },
                        { folder: rootFolderB }
                    ]
                };
                await runFileSearch(query);
            });
            test('include/excludes resolved correctly', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        assert.deepStrictEqual(options.includes.sort(), ['*.jsx', '*.ts']);
                        assert.deepStrictEqual(options.excludes.sort(), []);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: {
                        '*.ts': true,
                        '*.jsx': false
                    },
                    excludePattern: {
                        '*.js': true,
                        '*.tsx': false
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                '*.jsx': true
                            },
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                await runFileSearch(query);
            });
            test('basic sibling exclude clause', async () => {
                const reportedResults = [
                    'file1.ts',
                    'file1.js',
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults
                            .map(relativePath => (0, resources_1.joinPath)(options.folder, relativePath)));
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts')
                ]);
            });
            // https://github.com/microsoft/vscode-remotehub/issues/255
            test('include, sibling exclude, and subfolder', async () => {
                const reportedResults = [
                    'foo/file1.ts',
                    'foo/file1.js',
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults
                            .map(relativePath => (0, resources_1.joinPath)(options.folder, relativePath)));
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    includePattern: { '**/*.ts': true },
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, [
                    (0, resources_1.joinPath)(rootFolderA, 'foo/file1.ts')
                ]);
            });
            test('multiroot sibling exclude clause', async () => {
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        let reportedResults;
                        if (options.folder.fsPath === rootFolderA.fsPath) {
                            reportedResults = [
                                'folder/fileA.scss',
                                'folder/fileA.css',
                                'folder/file2.css'
                            ].map(relativePath => (0, resources_1.joinPath)(rootFolderA, relativePath));
                        }
                        else {
                            reportedResults = [
                                'fileB.ts',
                                'fileB.js',
                                'file3.js'
                            ].map(relativePath => (0, resources_1.joinPath)(rootFolderB, relativePath));
                        }
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        },
                        '*.css': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            excludePattern: {
                                'folder/*.css': {
                                    when: '$(basename).scss'
                                }
                            }
                        },
                        {
                            folder: rootFolderB,
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, [
                    (0, resources_1.joinPath)(rootFolderA, 'folder/fileA.scss'),
                    (0, resources_1.joinPath)(rootFolderA, 'folder/file2.css'),
                    (0, resources_1.joinPath)(rootFolderB, 'fileB.ts'),
                    (0, resources_1.joinPath)(rootFolderB, 'fileB.js'),
                    (0, resources_1.joinPath)(rootFolderB, 'file3.js'),
                ]);
            });
            test('max results = 1', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file3.ts'),
                ];
                let wasCanceled = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        disposables.add(token.onCancellationRequested(() => wasCanceled = true));
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 1,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = await runFileSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assert.strictEqual(results.length, 1);
                compareURIs(results, reportedResults.slice(0, 1));
                assert(wasCanceled, 'Expected to be canceled when hitting limit');
            });
            test('max results = 2', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file3.ts'),
                ];
                let wasCanceled = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        disposables.add(token.onCancellationRequested(() => wasCanceled = true));
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = await runFileSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assert.strictEqual(results.length, 2);
                compareURIs(results, reportedResults.slice(0, 2));
                assert(wasCanceled, 'Expected to be canceled when hitting limit');
            });
            test('provider returns maxResults exactly', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(rootFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(rootFolderA, 'file2.ts'),
                ];
                let wasCanceled = false;
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        disposables.add(token.onCancellationRequested(() => wasCanceled = true));
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = await runFileSearch(query);
                assert(!stats.limitHit, 'Expected not to return limitHit');
                assert.strictEqual(results.length, 2);
                compareURIs(results, reportedResults);
                assert(!wasCanceled, 'Expected not to be canceled when just reaching limit');
            });
            test('multiroot max results', async () => {
                let cancels = 0;
                await registerTestFileSearchProvider({
                    async provideFileSearchResults(query, options, token) {
                        disposables.add(token.onCancellationRequested(() => cancels++));
                        // Provice results async so it has a chance to invoke every provider
                        await new Promise(r => process.nextTick(r));
                        return [
                            'file1.ts',
                            'file2.ts',
                            'file3.ts',
                        ].map(relativePath => (0, resources_1.joinPath)(options.folder, relativePath));
                    }
                });
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        },
                        {
                            folder: rootFolderB
                        }
                    ]
                };
                const { results } = await runFileSearch(query);
                assert.strictEqual(results.length, 2); // Don't care which 2 we got
                assert.strictEqual(cancels, 2, 'Expected all invocations to be canceled when hitting limit');
            });
            test('works with non-file schemes', async () => {
                const reportedResults = [
                    (0, resources_1.joinPath)(fancySchemeFolderA, 'file1.ts'),
                    (0, resources_1.joinPath)(fancySchemeFolderA, 'file2.ts'),
                    (0, resources_1.joinPath)(fancySchemeFolderA, 'subfolder/file3.ts'),
                ];
                await registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults);
                    }
                }, fancyScheme);
                const query = {
                    type: 1 /* QueryType.File */,
                    filePattern: '',
                    folderQueries: [
                        {
                            folder: fancySchemeFolderA
                        }
                    ]
                };
                const { results } = await runFileSearch(query);
                compareURIs(results, reportedResults);
            });
        });
        suite('Text:', () => {
            function makePreview(text) {
                return {
                    matches: [new extHostTypes_1.Range(0, 0, 0, text.length)],
                    text
                };
            }
            function makeTextResult(baseFolder, relativePath) {
                return {
                    preview: makePreview('foo'),
                    ranges: [new extHostTypes_1.Range(0, 0, 0, 3)],
                    uri: (0, resources_1.joinPath)(baseFolder, relativePath)
                };
            }
            function getSimpleQuery(queryText) {
                return {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern(queryText),
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
            }
            function getPattern(queryText) {
                return {
                    pattern: queryText
                };
            }
            function assertResults(actual, expected) {
                const actualTextSearchResults = [];
                for (const fileMatch of actual) {
                    // Make relative
                    for (const lineResult of fileMatch.results) {
                        if ((0, search_1.resultIsMatch)(lineResult)) {
                            actualTextSearchResults.push({
                                preview: {
                                    text: lineResult.preview.text,
                                    matches: (0, arrays_1.mapArrayOrNot)(lineResult.preview.matches, m => new extHostTypes_1.Range(m.startLineNumber, m.startColumn, m.endLineNumber, m.endColumn))
                                },
                                ranges: (0, arrays_1.mapArrayOrNot)(lineResult.ranges, r => new extHostTypes_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn)),
                                uri: fileMatch.resource
                            });
                        }
                        else {
                            actualTextSearchResults.push({
                                text: lineResult.text,
                                lineNumber: lineResult.lineNumber,
                                uri: fileMatch.resource
                            });
                        }
                    }
                }
                const rangeToString = (r) => `(${r.start.line}, ${r.start.character}), (${r.end.line}, ${r.end.character})`;
                const makeComparable = (results) => results
                    .sort((a, b) => {
                    const compareKeyA = a.uri.toString() + ': ' + (extensionResultIsMatch(a) ? a.preview.text : a.text);
                    const compareKeyB = b.uri.toString() + ': ' + (extensionResultIsMatch(b) ? b.preview.text : b.text);
                    return compareKeyB.localeCompare(compareKeyA);
                })
                    .map(r => extensionResultIsMatch(r) ? {
                    uri: r.uri.toString(),
                    range: (0, arrays_1.mapArrayOrNot)(r.ranges, rangeToString),
                    preview: {
                        text: r.preview.text,
                        match: null // Don't care about this right now
                    }
                } : {
                    uri: r.uri.toString(),
                    text: r.text,
                    lineNumber: r.lineNumber
                });
                return assert.deepStrictEqual(makeComparable(actualTextSearchResults), makeComparable(expected));
            }
            test('no results', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = await runTextSearch(getSimpleQuery('foo'));
                assert(!stats.limitHit);
                assert(!results.length);
            });
            test('basic results', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = await runTextSearch(getSimpleQuery('foo'));
                assert(!stats.limitHit);
                assertResults(results, providedResults);
            });
            test('all provider calls get global include/excludes', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        assert.strictEqual(options.includes.length, 1);
                        assert.strictEqual(options.excludes.length, 1);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                await runTextSearch(query);
            });
            test('global/local include/excludes combined', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        if (options.folder.toString() === rootFolderA.toString()) {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts', 'foo']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js', 'bar']);
                        }
                        else {
                            assert.deepStrictEqual(options.includes.sort(), ['*.ts']);
                            assert.deepStrictEqual(options.excludes.sort(), ['*.js']);
                        }
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                'foo': true
                            },
                            excludePattern: {
                                'bar': true
                            }
                        },
                        { folder: rootFolderB }
                    ]
                };
                await runTextSearch(query);
            });
            test('include/excludes resolved correctly', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        assert.deepStrictEqual(options.includes.sort(), ['*.jsx', '*.ts']);
                        assert.deepStrictEqual(options.excludes.sort(), []);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true,
                        '*.jsx': false
                    },
                    excludePattern: {
                        '*.js': true,
                        '*.tsx': false
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                '*.jsx': true
                            },
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                await runTextSearch(query);
            });
            test('provider fail', async () => {
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        throw new Error('Provider fail');
                    }
                });
                try {
                    await runTextSearch(getSimpleQuery('foo'));
                    assert(false, 'Expected to fail');
                }
                catch {
                    // expected to fail
                }
            });
            test('basic sibling clause', async () => {
                mockPFS.Promises = {
                    readdir: (_path) => {
                        if (_path === rootFolderA.fsPath) {
                            return Promise.resolve([
                                'file1.js',
                                'file1.ts'
                            ]);
                        }
                        else {
                            return Promise.reject(new Error('Wrong path'));
                        }
                    }
                };
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.js'),
                    makeTextResult(rootFolderA, 'file1.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, providedResults.slice(1));
            });
            test('multiroot sibling clause', async () => {
                mockPFS.Promises = {
                    readdir: (_path) => {
                        if (_path === (0, resources_1.joinPath)(rootFolderA, 'folder').fsPath) {
                            return Promise.resolve([
                                'fileA.scss',
                                'fileA.css',
                                'file2.css'
                            ]);
                        }
                        else if (_path === rootFolderB.fsPath) {
                            return Promise.resolve([
                                'fileB.ts',
                                'fileB.js',
                                'file3.js'
                            ]);
                        }
                        else {
                            return Promise.reject(new Error('Wrong path'));
                        }
                    }
                };
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        let reportedResults;
                        if (options.folder.fsPath === rootFolderA.fsPath) {
                            reportedResults = [
                                makeTextResult(rootFolderA, 'folder/fileA.scss'),
                                makeTextResult(rootFolderA, 'folder/fileA.css'),
                                makeTextResult(rootFolderA, 'folder/file2.css')
                            ];
                        }
                        else {
                            reportedResults = [
                                makeTextResult(rootFolderB, 'fileB.ts'),
                                makeTextResult(rootFolderB, 'fileB.js'),
                                makeTextResult(rootFolderB, 'file3.js')
                            ];
                        }
                        reportedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        },
                        '*.css': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            excludePattern: {
                                'folder/*.css': {
                                    when: '$(basename).scss'
                                }
                            }
                        },
                        {
                            folder: rootFolderB,
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, [
                    makeTextResult(rootFolderA, 'folder/fileA.scss'),
                    makeTextResult(rootFolderA, 'folder/file2.css'),
                    makeTextResult(rootFolderB, 'fileB.ts'),
                    makeTextResult(rootFolderB, 'fileB.js'),
                    makeTextResult(rootFolderB, 'file3.js')
                ]);
            });
            test('include pattern applied', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.js'),
                    makeTextResult(rootFolderA, 'file1.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, providedResults.slice(1));
            });
            test('max results = 1', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                let wasCanceled = false;
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        disposables.add(token.onCancellationRequested(() => wasCanceled = true));
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 1,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults.slice(0, 1));
                assert(wasCanceled, 'Expected to be canceled');
            });
            test('max results = 2', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts'),
                    makeTextResult(rootFolderA, 'file3.ts')
                ];
                let wasCanceled = false;
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        disposables.add(token.onCancellationRequested(() => wasCanceled = true));
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults.slice(0, 2));
                assert(wasCanceled, 'Expected to be canceled');
            });
            test('provider returns maxResults exactly', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                let wasCanceled = false;
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        disposables.add(token.onCancellationRequested(() => wasCanceled = true));
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(!stats.limitHit, 'Expected not to return limitHit');
                assertResults(results, providedResults);
                assert(!wasCanceled, 'Expected not to be canceled');
            });
            test('provider returns early with limitHit', async () => {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts'),
                    makeTextResult(rootFolderA, 'file3.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve({ limitHit: true });
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 1000,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = await runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults);
            });
            test('multiroot max results', async () => {
                let cancels = 0;
                await registerTestTextSearchProvider({
                    async provideTextSearchResults(query, options, progress, token) {
                        disposables.add(token.onCancellationRequested(() => cancels++));
                        await new Promise(r => process.nextTick(r));
                        [
                            'file1.ts',
                            'file2.ts',
                            'file3.ts',
                        ].forEach(f => progress.report(makeTextResult(options.folder, f)));
                        return null;
                    }
                });
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                const { results } = await runTextSearch(query);
                assert.strictEqual(results.length, 2);
                assert.strictEqual(cancels, 2);
            });
            test('works with non-file schemes', async () => {
                const providedResults = [
                    makeTextResult(fancySchemeFolderA, 'file1.ts'),
                    makeTextResult(fancySchemeFolderA, 'file2.ts'),
                    makeTextResult(fancySchemeFolderA, 'file3.ts')
                ];
                await registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                }, fancyScheme);
                const query = {
                    type: 2 /* QueryType.Text */,
                    contentPattern: getPattern('foo'),
                    folderQueries: [
                        { folder: fancySchemeFolderA }
                    ]
                };
                const { results } = await runTextSearch(query);
                assertResults(results, providedResults);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNlYXJjaC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L25vZGUvZXh0SG9zdFNlYXJjaC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeUJoRyxJQUFJLFdBQTRCLENBQUM7SUFDakMsSUFBSSxhQUFrQyxDQUFDO0lBRXZDLElBQUksb0JBQTBDLENBQUM7SUFDL0MsTUFBTSxvQkFBb0I7UUFBMUI7WUFHQyxZQUFPLEdBQTBDLEVBQUUsQ0FBQztRQThCckQsQ0FBQztRQTVCQSwyQkFBMkIsQ0FBQyxNQUFjLEVBQUUsTUFBYztZQUN6RCxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztRQUMxQixDQUFDO1FBRUQsMkJBQTJCLENBQUMsTUFBYyxFQUFFLE1BQWM7WUFDekQsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFDMUIsQ0FBQztRQUVELDZCQUE2QixDQUFDLE1BQWMsRUFBRSxNQUFjO1lBQzNELElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO1FBQzFCLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxNQUFjO1FBQ2xDLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsT0FBZSxFQUFFLElBQXFCO1lBQ3RFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELGdCQUFnQixDQUFDLE1BQWMsRUFBRSxPQUFlLEVBQUUsSUFBc0I7WUFDdkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsU0FBaUIsRUFBRSxJQUFTO1FBQzdDLENBQUM7UUFFRCxPQUFPO1FB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