/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkOpeners", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchService", "vs/platform/terminal/common/terminal", "vs/amdX", "vs/base/test/common/utils", "vs/platform/terminal/common/capabilities/commandDetection/terminalCommand"], function (require, exports, assert_1, network_1, uri_1, files_1, fileService_1, instantiationServiceMock_1, log_1, quickInput_1, workspace_1, commandDetectionCapability_1, terminalLinkOpeners_1, terminalCapabilityStore_1, editorService_1, environmentService_1, workbenchTestServices_1, search_1, searchService_1, terminal_1, amdX_1, utils_1, terminalCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestCommandDetectionCapability extends commandDetectionCapability_1.CommandDetectionCapability {
        setCommands(commands) {
            this._commands = commands;
        }
    }
    class TestFileService extends fileService_1.FileService {
        constructor() {
            super(...arguments);
            this._files = '*';
        }
        async stat(resource) {
            if (this._files === '*' || this._files.some(e => e.toString() === resource.toString())) {
                return { isFile: true, isDirectory: false, isSymbolicLink: false };
            }
            throw new Error('ENOENT');
        }
        setFiles(files) {
            this._files = files;
        }
    }
    class TestSearchService extends searchService_1.SearchService {
        async fileSearch(query) {
            return this._searchResult;
        }
        setSearchResult(result) {
            this._searchResult = result;
        }
    }
    class TestTerminalSearchLinkOpener extends terminalLinkOpeners_1.TerminalSearchLinkOpener {
        setFileQueryBuilder(value) {
            this._fileQueryBuilder = value;
        }
    }
    suite('Workbench - TerminalLinkOpeners', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let fileService;
        let searchService;
        let activationResult;
        let xterm;
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            fileService = store.add(new TestFileService(new log_1.NullLogService()));
            searchService = store.add(new TestSearchService(null, null, null, null, null, null, null));
            instantiationService.set(files_1.IFileService, fileService);
            instantiationService.set(log_1.ILogService, new log_1.NullLogService());
            instantiationService.set(search_1.ISearchService, searchService);
            instantiationService.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(terminal_1.ITerminalLogService, new log_1.NullLogService());
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, {
                remoteAuthority: undefined
            });
            // Allow intercepting link activations
            activationResult = undefined;
            instantiationService.stub(quickInput_1.IQuickInputService, {
                quickAccess: {
                    show(link) {
                        activationResult = { link, source: 'search' };
                    }
                }
            });
            instantiationService.stub(editorService_1.IEditorService, {
                async openEditor(editor) {
                    activationResult = {
                        source: 'editor',
                        link: editor.resource?.toString()
                    };
                    // Only assert on selection if it's not the default value
                    if (editor.options?.selection && (editor.options.selection.startColumn !== 1 || editor.options.selection.startLineNumber !== 1)) {
                        activationResult.selection = editor.options.selection;
                    }
                }
            });
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true }));
        });
        suite('TerminalSearchLinkOpener', () => {
            let opener;
            let capabilities;
            let commandDetection;
            let localFileOpener;
            setup(() => {
                capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
                commandDetection = store.add(instantiationService.createInstance(TestCommandDetectionCapability, xterm));
                capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            });
            test('should open single exact match against cwd when searching if it exists when command detection cwd is available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                // Set a fake detected command starting as line 0 to establish the cwd
                commandDetection.setCommands([new terminalCommand_1.TerminalCommand(xterm, {
                        command: '',
                        commandLineConfidence: 'low',
                        exitCode: 0,
                        commandStartLineContent: '',
                        markProperties: {},
                        isTrusted: true,
                        cwd: '/initial/cwd',
                        timestamp: 0,
                        duration: 0,
                        executedX: undefined,
                        startX: undefined,
                        marker: {
                            line: 0
                        },
                    })]);
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.txt' })
                ]);
                await opener.open({
                    text: 'foo/bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should open single exact match against cwd for paths containing a separator when searching if it exists, even when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.txt' })
                ]);
                await opener.open({
                    text: 'foo/bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should open single exact match against any folder for paths not containing a separator when there is a single search result, even when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                capabilities.remove(2 /* TerminalCapability.CommandDetection */);
                opener.setFileQueryBuilder({ file: () => null });
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/baz.txt' })
                ]);
                searchService.setSearchResult({
                    messages: [],
                    results: [
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }) }
                    ]
                });
                await opener.open({
                    text: 'bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should open single exact match against any folder for paths not containing a separator when there are multiple search results, even when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                capabilities.remove(2 /* TerminalCapability.CommandDetection */);
                opener.setFileQueryBuilder({ file: () => null });
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.test.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.test.txt' })
                ]);
                searchService.setSearchResult({
                    messages: [],
                    results: [
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }) },
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.test.txt' }) },
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.test.txt' }) }
                    ]
                });
                await opener.open({
                    text: 'bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should not open single exact match for paths not containing a when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.txt' })
                ]);
                await opener.open({
                    text: 'bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'bar.txt',
                    source: 'search'
                });
            });
            suite('macOS/Linux', () => {
                setup(() => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                });
                test('should apply the cwd to the link only when the file exists and cwdDetection is enabled', async () => {
                    const cwd = '/Users/home/folder';
                    const absoluteFile = '/Users/home/folder/file.txt';
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: absoluteFile }),
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/Users/home/folder/other/file.txt' })
                    ]);
                    // Set a fake detected command starting as line 0 to establish the cwd
                    commandDetection.setCommands([new terminalCommand_1.TerminalCommand(xterm, {
                            command: '',
                            commandLineConfidence: 'low',
                            isTrusted: true,
                            cwd,
                            timestamp: 0,
                            duration: 0,
                            executedX: undefined,
                            startX: undefined,
                            marker: {
                                line: 0
                            },
                            exitCode: 0,
                            commandStartLineContent: '',
                            markProperties: {}
                        })]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///Users/home/folder/file.txt',
                        source: 'editor'
                    });
                    // Clear detected commands and ensure the same request results in a search since there are 2 matches
                    commandDetection.setCommands([]);
                    opener.setFileQueryBuilder({ file: () => null });
                    searchService.setSearchResult({
                        messages: [],
                        results: [
                            { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'file:///Users/home/folder/file.txt' }) },
                            { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'file:///Users/home/folder/other/file.txt' }) }
                        ]
                    });
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file.txt',
                        source: 'search'
                    });
                });
                test('should extract column and/or line numbers from links in a workspace containing spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/space folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/space folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove trailing periods', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:5.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove grepped lines', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                // Test for https://github.com/microsoft/vscode/pull/200919#discussion_r1428124196
                test('should extract column and/or line numbers from links and remove grepped lines incl singular spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract line numbers from links and remove ruby stack traces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.rb' })
                    ]);
                    await opener.open({
                        text: './foo/bar.rb:30:in `<main>`',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.rb',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 30,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
            });
            suite('Windows', () => {
                setup(() => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                });
                test('should apply the cwd to the link only when the file exists and cwdDetection is enabled', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:\\Users', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    const cwd = 'c:\\Users\\home\\folder';
                    const absoluteFile = 'c:\\Users\\home\\folder\\file.txt';
                    fileService.setFiles([
                        uri_1.URI.file('/c:/Users/home/folder/file.txt')
                    ]);
                    // Set a fake detected command starting as line 0 to establish the cwd
                    commandDetection.setCommands([new terminalCommand_1.TerminalCommand(xterm, {
                            exitCode: 0,
                            commandStartLineContent: '',
                            markProperties: {},
                            command: '',
                            commandLineConfidence: 'low',
                            isTrusted: true,
                            cwd,
                            executedX: undefined,
                            startX: undefined,
                            timestamp: 0,
                            duration: 0,
                            marker: {
                                line: 0
                            },
                        })]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/Users/home/folder/file.txt',
                        source: 'editor'
                    });
                    // Clear detected commands and ensure the same request results in a search
                    commandDetection.setCommands([]);
                    opener.setFileQueryBuilder({ file: () => null });
                    searchService.setSearchResult({
                        messages: [],
                        results: [
                            { resource: uri_1.URI.file(absoluteFile) },
                            { resource: uri_1.URI.file('/c:/Users/home/folder/other/file.txt') }
                        ]
                    });
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file.txt',
                        source: 'search'
                    });
                });
                test('should extract column and/or line numbers from links in a workspace containing spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/space folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/space folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:5',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove trailing periods', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:5.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:2:5.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 2,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:2.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 2,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove grepped lines', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:5:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                // Test for https://github.com/microsoft/vscode/pull/200919#discussion_r1428124196
                test('should extract column and/or line numbers from links and remove grepped lines incl singular spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:5: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract line numbers from links and remove ruby stack traces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.rb' })
                    ]);
                    await opener.open({
                        text: './foo/bar.rb:30:in `<main>`',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.rb',
                        source: 'editor',
                        selection: {
                            startColumn: 1, // Since Ruby doesn't appear to put columns in stack traces, this should be 1
                            startLineNumber: 30,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.rb:30:in `<main>`',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.rb',
                        source: 'editor',
                        selection: {
                            startColumn: 1, // Since Ruby doesn't appear to put columns in stack traces, this should be 1
                            startLineNumber: 30,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rT3BlbmVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbExpbmtPcGVuZXJzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQ2hHLE1BQU0sOEJBQStCLFNBQVEsdURBQTBCO1FBQ3RFLFdBQVcsQ0FBQyxRQUEyQjtZQUN0QyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMzQixDQUFDO0tBQ0Q7SUFFRCxNQUFNLGVBQWdCLFNBQVEseUJBQVc7UUFBekM7O1lBQ1MsV0FBTSxHQUFnQixHQUFHLENBQUM7UUFVbkMsQ0FBQztRQVRTLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBYTtZQUNoQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hGLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBa0MsQ0FBQztZQUNwRyxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsUUFBUSxDQUFDLEtBQWtCO1lBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7S0FDRDtJQUVELE1BQU0saUJBQWtCLFNBQVEsNkJBQWE7UUFFbkMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFpQjtZ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