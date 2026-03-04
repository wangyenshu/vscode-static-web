define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/path/common/pathService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/platform/environment/common/environment", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/resources", "vs/base/test/common/utils"], function (require, exports, assert, path_1, platform_1, uri_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, workspace_1, workspaces_1, queryBuilder_1, pathService_1, workbenchTestServices_1, workbenchTestServices_2, environment_1, testWorkspace_1, resources_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertEqualQueries = assertEqualQueries;
    exports.assertEqualSearchPathResults = assertEqualSearchPathResults;
    exports.cleanUndefinedQueryValues = cleanUndefinedQueryValues;
    exports.globalGlob = globalGlob;
    exports.patternsToIExpression = patternsToIExpression;
    exports.getUri = getUri;
    exports.fixPath = fixPath;
    exports.normalizeExpression = normalizeExpression;
    const DEFAULT_EDITOR_CONFIG = {};
    const DEFAULT_USER_CONFIG = { useRipgrep: true, useIgnoreFiles: true, useGlobalIgnoreFiles: true, useParentIgnoreFiles: true };
    const DEFAULT_QUERY_PROPS = {};
    const DEFAULT_TEXT_QUERY_PROPS = { usePCRE2: false };
    suite('QueryBuilder', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const PATTERN_INFO = { pattern: 'a' };
        const ROOT_1 = fixPath('/foo/root1');
        const ROOT_1_URI = getUri(ROOT_1);
        const ROOT_1_NAMED_FOLDER = (0, workspace_1.toWorkspaceFolder)(ROOT_1_URI);
        const WS_CONFIG_PATH = getUri('/bar/test.code-workspace'); // location of the workspace file (not important except that it is a file URI)
        let instantiationService;
        let queryBuilder;
        let mockConfigService;
        let mockContextService;
        let mockWorkspace;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            mockConfigService = new testConfigurationService_1.TestConfigurationService();
            mockConfigService.setUserConfiguration('search', DEFAULT_USER_CONFIG);
            mockConfigService.setUserConfiguration('editor', DEFAULT_EDITOR_CONFIG);
            instantiationService.stub(configuration_1.IConfigurationService, mockConfigService);
            mockContextService = new workbenchTestServices_2.TestContextService();
            mockWorkspace = new testWorkspace_1.Workspace('workspace', [(0, workspace_1.toWorkspaceFolder)(ROOT_1_URI)]);
            mockContextService.setWorkspace(mockWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, mockContextService);
            instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            instantiationService.stub(pathService_1.IPathService, new workbenchTestServices_1.TestPathService());
            queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        });
        teardown(() => {
            instantiationService.dispose();
        });
        test('simple text pattern', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO), {
                folderQueries: [],
                contentPattern: PATTERN_INFO,
                type: 2 /* QueryType.Text */
            });
        });
        test('normalize literal newlines', () => {
            assertEqualTextQueries(queryBuilder.text({ pattern: 'foo\nbar', isRegExp: true }), {
                folderQueries: [],
                contentPattern: {
                    pattern: 'foo\\nbar',
                    isRegExp: true,
                    isMultiline: true
                },
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text({ pattern: 'foo\nbar', isRegExp: false }), {
                folderQueries: [],
                contentPattern: {
                    pattern: 'foo\nbar',
                    isRegExp: false,
                    isMultiline: true
                },
                type: 2 /* QueryType.Text */
            });
        });
        test('splits include pattern when expandPatterns enabled', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: '**/foo, **/bar', expandPatterns: true }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo': true,
                    '**/foo/**': true,
                    '**/bar': true,
                    '**/bar/**': true,
                }
            });
        });
        test('does not split include pattern when expandPatterns disabled', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: '**/foo, **/bar' }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo, **/bar': true
                }
            });
        });
        test('includePattern array', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: ['**/foo', '**/bar'] }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo': true,
                    '**/bar': true
                }
            });
        });
        test('includePattern array with expandPatterns', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: ['**/foo', '**/bar'], expandPatterns: true }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo': true,
                    '**/foo/**': true,
                    '**/bar': true,
                    '**/bar/**': true,
                }
            });
        });
        test('folderResources', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI]), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{ folder: ROOT_1_URI }],
                type: 2 /* QueryType.Text */
            });
        });
        test('simple exclude setting', () => {
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: {
                    'bar/**': true,
                    'foo/**': {
                        'when': '$(basename).ts'
                    }
                }
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                expandPatterns: true // verify that this doesn't affect patterns from configuration
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: {
                            'bar/**': true,
                            'foo/**': {
                                'when': '$(basename).ts'
                            }
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('simple include', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: 'bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: {
                    '**/bar': true,
                    '**/bar/**': true
                },
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: 'bar'
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: {
                    'bar': true
                },
                type: 2 /* QueryType.Text */
            });
        });
        test('simple include with ./ syntax', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: './bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'bar': true,
                            'bar/**': true
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: '.\\bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'bar': true,
                            'bar/**': true
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('exclude setting and searchPath', () => {
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: {
                    'foo/**/*.js': true,
                    'bar/**': {
                        'when': '$(basename).ts'
                    }
                }
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: './foo',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'foo': true,
                            'foo/**': true
                        },
                        excludePattern: {
                            'foo/**/*.js': true,
                            'bar/**': {
                                'when': '$(basename).ts'
                            }
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('multiroot exclude settings', () => {
            const ROOT_2 = fixPath('/project/root2');
            const ROOT_2_URI = getUri(ROOT_2);
            const ROOT_3 = fixPath('/project/root3');
            const ROOT_3_URI = getUri(ROOT_3);
            mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath }, { path: ROOT_2_URI.fsPath }, { path: ROOT_3_URI.fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
            mockWorkspace.configuration = uri_1.URI.file(fixPath('/config'));
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: { 'foo/**/*.js': true }
            }, ROOT_1_URI);
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: { 'bar': true }
            }, ROOT_2_URI);
            // There are 3 roots, the first two have search.exclude settings, test that the correct basic query is returned
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI, ROOT_2_URI, ROOT_3_URI]), {
                contentPattern: PATTERN_INFO,
                folderQueries: [
                    { folder: ROOT_1_URI, excludePattern: patternsToIExpression('foo/**/*.js') },
                    { folder: ROOT_2_URI, excludePattern: patternsToIExpression('bar') },
                    { folder: ROOT_3_URI }
                ],
                type: 2 /* QueryType.Text */
            });
            // Now test that it merges the root excludes when an 'include' is used
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI, ROOT_2_URI, ROOT_3_URI], {
                includePattern: './root2/src',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [
                    {
                        folder: ROOT_2_URI,
                        includePattern: {
                            'src': true,
                            'src/**': true
                        },
                        excludePattern: {
                            'bar': true
                        },
                    }
                ],
                type: 2 /* QueryType.Text */
            });
        });
        test('simple exclude input pattern', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: 'foo',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 2 /* QueryType.Text */,
                excludePattern: patternsToIExpression(...globalGlob('foo'))
            });
        });
        test('file pattern trimming', () => {
            const content = 'content';
            assertEqualQueries(queryBuilder.file([], { filePattern: ` ${content} ` }), {
                folderQueries: [],
                filePattern: content,
                type: 1 /* QueryType.File */
            });
        });
        test('exclude ./ syntax', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: './bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar', 'bar/**'),
                    }],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: './bar/**/*.ts',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar/**/*.ts', 'bar/**/*.ts/**'),
                    }],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: '.\\bar\\**\\*.ts',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar/**/*.ts', 'bar/**/*.ts/**'),
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('extraFileResources', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], { extraFileResources: [getUri('/foo/bar.js')] }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                extraFileResources: [getUri('/foo/bar.js')],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                extraFileResources: [getUri('/foo/bar.js')],
                excludePattern: '*.js',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                excludePattern: patternsToIExpression(...globalGlob('*.js')),
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                extraFileResources: [getUri('/foo/bar.js')],
                includePattern: '*.txt',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: patternsToIExpression(...globalGlob('*.txt')),
                type: 2 /* QueryType.Text */
            });
        });
        suite('parseSearchPaths 1', () => {
            test('simple includes', () => {
                function testSimpleIncludes(includePattern, expectedPatterns) {
                    const result = queryBuilder.parseSearchPaths(includePattern);
                    assert.deepStrictEqual({ ...result.pattern }, patternsToIExpression(...expectedPatterns), includePattern);
                    assert.strictEqual(result.searchPaths, undefined);
                }
                [
                    ['a', ['**/a/**', '**/a']],
                    ['a/b', ['**/a/b', '**/a/b/**']],
                    ['a/b,  c', ['**/a/b', '**/c', '**/a/b/**', '**/c/**']],
                    ['a,.txt', ['**/a', '**/a/**', '**/*.txt', '**/*.txt/**']],
                    ['a,,,b', ['**/a', '**/a/**', '**/b', '**/b/**']],
                    ['**/a,b/**', ['**/a', '**/a/**', '**/b/**']]
                ].forEach(([includePattern, expectedPatterns]) => testSimpleIncludes(includePattern, expectedPatterns));
            });
            function testIncludes(includePattern, expectedResult) {
                let actual;
                try {
                    actual = queryBuilder.parseSearchPaths(includePattern);
                }
                catch (_) {
                    actual = { searchPaths: [] };
                }
                assertEqualSearchPathResults(actual, expectedResult, includePattern);
            }
            function testIncludesDataItem([includePattern, expectedResult]) {
                testIncludes(includePattern, expectedResult);
            }
            test('absolute includes', () => {
                const cases = [
                    [
                        fixPath('/foo/bar'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }]
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + 'a',
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }],
                            pattern: patternsToIExpression(...globalGlob('a'))
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + fixPath('/1/2'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }, { searchPath: getUri('/1/2') }]
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + fixPath('/foo/../foo/bar/fooar/..'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/bar/**/*.ts'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar'),
                                    pattern: patternsToIExpression('**/*.ts', '**/*.ts/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/bar/*a/b/c'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar'),
                                    pattern: patternsToIExpression('*a/b/c', '*a/b/c/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/*a/b/c'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/'),
                                    pattern: patternsToIExpression('*a/b/c', '*a/b/c/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/{b,c}ar'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo'),
                                    pattern: patternsToIExpression('{b,c}ar', '{b,c}ar/**')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/single root folder', () => {
                const cases = [
                    [
                        './a',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a', 'a/**')
                                }]
                        }
                    ],
                    [
                        './a/',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a', 'a/**')
                                }]
                        }
                    ],
                    [
                        './a/*b/c',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/*b/c', 'a/*b/c/**')
                                }]
                        }
                    ],
                    [
                        './a/*b/c, ' + fixPath('/project/foo'),
                        {
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/*b/c', 'a/*b/c/**')
                                },
                                {
                                    searchPath: getUri('/project/foo')
                                }
                            ]
                        }
                    ],
                    [
                        './a/b/,./c/d',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/b', 'a/b/**', 'c/d', 'c/d/**')
                                }]
                        }
                    ],
                    [
                        '../',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo')
                                }]
                        }
                    ],
                    [
                        '..',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo')
                                }]
                        }
                    ],
                    [
                        '..\\bar',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/two root folders', () => {
                const ROOT_2 = '/project/root2';
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath }, { path: getUri(ROOT_2).fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './root1',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './root2',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_2),
                                }]
                        }
                    ],
                    [
                        './root1/a/**/b, ./root2/**/*.txt',
                        {
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**')
                                },
                                {
                                    searchPath: getUri(ROOT_2),
                                    pattern: patternsToIExpression('**/*.txt', '**/*.txt/**')
                                }
                            ]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('include ./foldername', () => {
                const ROOT_2 = '/project/root2';
                const ROOT_1_FOLDERNAME = 'foldername';
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath, name: ROOT_1_FOLDERNAME }, { path: getUri(ROOT_2).fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './foldername',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI
                                }]
                        }
                    ],
                    [
                        './foldername/foo',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('foo', 'foo/**')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('folder with slash in the name', () => {
                const ROOT_2 = '/project/root2';
                const ROOT_2_URI = getUri(ROOT_2);
                const ROOT_1_FOLDERNAME = 'folder/one';
                const ROOT_2_FOLDERNAME = 'folder/two+'; // And another regex character, #126003
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath, name: ROOT_1_FOLDERNAME }, { path: ROOT_2_URI.fsPath, name: ROOT_2_FOLDERNAME }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './folder/one',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI
                                }]
                        }
                    ],
                    [
                        './folder/two+/foo/',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_2_URI,
                                    pattern: patternsToIExpression('foo', 'foo/**')
                                }]
                        }
                    ],
                    [
                        './folder/onesomethingelse',
                        { searchPaths: [] }
                    ],
                    [
                        './folder/onesomethingelse/foo',
                        { searchPaths: [] }
                    ],
                    [
                        './folder',
                        { searchPaths: [] }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/multiple ambiguous root folders', () => {
                const ROOT_2 = '/project/rootB';
                const ROOT_3 = '/otherproject/rootB';
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath }, { path: getUri(ROOT_2).fsPath }, { path: getUri(ROOT_3).fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('/config'));
                const cases = [
                    [
                        '',
                        {
                            searchPaths: undefined
                        }
                    ],
                    [
                        './',
                        {
                            searchPaths: undefined
                        }
                    ],
                    [
                        './root1',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './root1,./',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './rootB',
                        {
                            searchPaths: [
                                {
                                    searchPath: getUri(ROOT_2),
                                },
                                {
                                    searchPath: getUri(ROOT_3),
                                }
                            ]
                        }
                    ],
                    [
                        './rootB/a/**/b, ./rootB/b/**/*.txt',
                        {
                            searchPaths: [
                                {
                                    searchPath: getUri(ROOT_2),
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**', 'b/**/*.txt', 'b/**/*.txt/**')
                                },
                                {
                                    searchPath: getUri(ROOT_3),
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**', 'b/**/*.txt', 'b/**/*.txt/**')
                                }
                            ]
                        }
                    ],
                    [
                        './root1/**/foo/, bar/',
                        {
                            pattern: patternsToIExpression('**/bar', '**/bar/**'),
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('**/foo', '**/foo/**')
                                }
                            ]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
        });
        suite('parseSearchPaths 2', () => {
            function testIncludes(includePattern, expectedResult) {
                assertEqualSearchPathResults(queryBuilder.parseSearchPaths(includePattern), expectedResult, includePattern);
            }
            function testIncludesDataItem([includePattern, expectedResult]) {
                testIncludes(includePattern, expectedResult);
            }
            (platform_1.isWindows ? test.skip : test)('includes with tilde', () => {
                const userHome = uri_1.URI.file('/');
                const cases = [
                    [
                        '~/foo/bar',
                        {
                            searchPaths: [{ searchPath: getUri(userHome.fsPath, '/foo/bar') }]
                        }
                    ],
                    [
                        '~/foo/bar, a',
                        {
                            searchPaths: [{ searchPath: getUri(userHome.fsPath, '/foo/bar') }],
                            pattern: patternsToIExpression(...globalGlob('a'))
                        }
                    ],
                    [
                        fixPath('/foo/~/bar'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/~/bar') }]
                        }
                    ],
                ];
                cases.forEach(testIncludesDataItem);
            });
        });
        suite('smartCase', () => {
            test('no flags -> no change', () => {
                const query = queryBuilder.text({
                    pattern: 'a'
                }, []);
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('maintains isCaseSensitive when smartCase not set', () => {
                const query = queryBuilder.text({
                    pattern: 'a',
                    isCaseSensitive: true
                }, []);
                assert(query.contentPattern.isCaseSensitive);
            });
            test('maintains isCaseSensitive when smartCase set', () => {
                const query = queryBuilder.text({
                    pattern: 'a',
                    isCaseSensitive: true
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines not case sensitive', () => {
                const query = queryBuilder.text({
                    pattern: 'abcd'
                }, [], {
                    isSmartCase: true
                });
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines case sensitive', () => {
                const query = queryBuilder.text({
                    pattern: 'abCd'
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines not case sensitive (regex)', () => {
                const query = queryBuilder.text({
                    pattern: 'ab\\Sd',
                    isRegExp: true
                }, [], {
                    isSmartCase: true
                });
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines case sensitive (regex)', () => {
                const query = queryBuilder.text({
                    pattern: 'ab[A-Z]d',
                    isRegExp: true
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
        });
        suite('file', () => {
            test('simple file query', () => {
                const cacheKey = 'asdf';
                const query = queryBuilder.file([ROOT_1_NAMED_FOLDER], {
                    cacheKey,
                    sortByScore: true
                });
                assert.strictEqual(query.folderQueries.length, 1);
                assert.strictEqual(query.cacheKey, cacheKey);
                assert(query.sortByScore);
            });
        });
    });
    function assertEqualTextQueries(actual, expected) {
        expected = {
            ...DEFAULT_TEXT_QUERY_PROPS,
            ...expected
        };
        return assertEqualQueries(actual, expected);
    }
    function assertEqualQueries(actual, expected) {
        expected = {
            ...DEFAULT_QUERY_PROPS,
            ...expected
        };
        const folderQueryToCompareObject = (fq) => {
            return {
                path: fq.folder.fsPath,
                excludePattern: normalizeExpression(fq.excludePattern),
                includePattern: normalizeExpression(fq.includePattern),
                fileEncoding: fq.fileEncoding
            };
        };
        // Avoid comparing URI objects, not a good idea
        if (expected.folderQueries) {
            assert.deepStrictEqual(actual.folderQueries.map(folderQueryToCompareObject), expected.folderQueries.map(folderQueryToCompareObject));
            actual.folderQueries = [];
            expected.folderQueries = [];
        }
        if (expected.extraFileResources) {
            assert.deepStrictEqual(actual.extraFileResources.map(extraFile => extraFile.fsPath), expected.extraFileResources.map(extraFile => extraFile.fsPath));
            delete expected.extraFileResources;
            delete actual.extraFileResources;
        }
        delete actual.usingSearchPaths;
        actual.includePattern = normalizeExpression(actual.includePattern);
        actual.excludePattern = normalizeExpression(actual.excludePattern);
        cleanUndefinedQueryValues(actual);
        assert.deepStrictEqual(actual, expected);
    }
    function assertEqualSearchPathResults(actual, expected, message) {
        cleanUndefinedQueryValues(actual);
        assert.deepStrictEqual({ ...actual.pattern }, { ...expected.pattern }, message);
        assert.strictEqual(actual.searchPaths && actual.searchPaths.length, expected.searchPaths && expected.searchPaths.length);
        if (actual.searchPaths) {
            actual.searchPaths.forEach((searchPath, i) => {
                const expectedSearchPath = expected.searchPaths[i];
                assert.deepStrictEqual(searchPath.pattern && { ...searchPath.pattern }, expectedSearchPath.pattern);
                assert.strictEqual(searchPath.searchPath.toString(), expectedSearchPath.searchPath.toString());
            });
        }
    }
    /**
     * Recursively delete all undefined property values from the search query, to make it easier to
     * assert.deepStrictEqual with some expected object.
     */
    function cleanUndefinedQueryValues(q) {
        for (const key in q) {
            if (q[key] === undefined) {
                delete q[key];
            }
            else if (typeof q[key] === 'object') {
                cleanUndefinedQueryValues(q[key]);
            }
        }
        return q;
    }
    function globalGlob(pattern) {
        return [
            `**/${pattern}/**`,
            `**/${pattern}`
        ];
    }
    function patternsToIExpression(...patterns) {
        return patterns.length ?
            patterns.reduce((glob, cur) => { glob[cur] = true; return glob; }, {}) :
            undefined;
    }
    function getUri(...slashPathParts) {
        return uri_1.URI.file(fixPath(...slashPathParts));
    }
    function fixPath(...slashPathParts) {
        if (platform_1.isWindows && slashPathParts.length && !slashPathParts[0].match(/^c:/i)) {
            slashPathParts.unshift('c:');
        }
        return (0, path_1.join)(...slashPathParts);
    }
    function normalizeExpression(expression) {
        if (!expression) {
            return expression;
        }
        const normalized = {};
        Object.keys(expression).forEach(key => {
            normalized[key.replace(/\\/g, '/')] = expression[key];
        });
        return normalized;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCdWlsZGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL3Rlc3QvYnJvd3Nlci9xdWVyeUJ1aWxkZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFta0NBLGdEQWtDQztJQUVELG9FQVlDO0lBTUQsOERBVUM7SUFFRCxnQ0FLQztJQUVELHNEQUlDO0lBRUQsd0JBRUM7SUFFRCwwQkFNQztJQUVELGtEQVdDO0lBanBDRCxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztJQUNqQyxNQUFNLG1CQUFtQixHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUMvSCxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztJQUMvQixNQUFNLHdCQUF3QixHQUFHLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBRXJELEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBQzFCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUMxQyxNQUFNLFlBQVksR0FBaUIsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDcEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxNQUFNLG1CQUFtQixHQUFHLElBQUEsNkJBQWlCLEVBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUQsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyw4RUFBOEU7UUFFekksSUFBSSxvQkFBOEMsQ0FBQztRQUNu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