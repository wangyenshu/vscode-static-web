define(["require", "exports", "assert", "sinon", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetVariables", "vs/editor/test/common/testTextModel", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/workspaces/common/workspaces"], function (require, exports, assert, sinon, lifecycle_1, path_1, platform_1, resources_1, uri_1, mock_1, utils_1, selection_1, snippetParser_1, snippetVariables_1, testTextModel_1, workspace_1, testWorkspace_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Snippet Variables Resolver', function () {
        const labelService = new class extends (0, mock_1.mock)() {
            getUriLabel(uri) {
                return uri.fsPath;
            }
        };
        let model;
        let resolver;
        setup(function () {
            model = (0, testTextModel_1.createTextModel)([
                'this is line one',
                'this is line two',
                '    this is line three'
            ].join('\n'), undefined, undefined, uri_1.URI.parse('file:///foo/files/text.txt'));
            resolver = new snippetVariables_1.CompositeSnippetVariableResolver([
                new snippetVariables_1.ModelBasedVariableResolver(labelService, model),
                new snippetVariables_1.SelectionBasedVariableResolver(model, new selection_1.Selection(1, 1, 1, 1), 0, undefined),
            ]);
        });
        teardown(function () {
            model.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertVariableResolve(resolver, varName, expected) {
            const snippet = new snippetParser_1.SnippetParser().parse(`$${varName}`);
            const variable = snippet.children[0];
            variable.resolve(resolver);
            if (variable.children.length === 0) {
                assert.strictEqual(undefined, expected);
            }
            else {
                assert.strictEqual(variable.toString(), expected);
            }
        }
        test('editor variables, basics', function () {
            assertVariableResolve(resolver, 'TM_FILENAME', 'text.txt');
            assertVariableResolve(resolver, 'something', undefined);
        });
        test('editor variables, file/dir', function () {
            const disposables = new lifecycle_1.DisposableStore();
            assertVariableResolve(resolver, 'TM_FILENAME', 'text.txt');
            if (!platform_1.isWindows) {
                assertVariableResolve(resolver, 'TM_DIRECTORY', '/foo/files');
                assertVariableResolve(resolver, 'TM_FILEPATH', '/foo/files/text.txt');
            }
            resolver = new snippetVariables_1.ModelBasedVariableResolver(labelService, disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.parse('http://www.pb.o/abc/def/ghi'))));
            assertVariableResolve(resolver, 'TM_FILENAME', 'ghi');
            if (!platform_1.isWindows) {
                assertVariableResolve(resolver, 'TM_DIRECTORY', '/abc/def');
                assertVariableResolve(resolver, 'TM_FILEPATH', '/abc/def/ghi');
            }
            resolver = new snippetVariables_1.ModelBasedVariableResolver(labelService, disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.parse('mem:fff.ts'))));
            assertVariableResolve(resolver, 'TM_DIRECTORY', '');
            assertVariableResolve(resolver, 'TM_FILEPATH', 'fff.ts');
            disposables.dispose();
        });
        test('Path delimiters in code snippet variables aren\'t specific to remote OS #76840', function () {
            const labelService = new class extends (0, mock_1.mock)() {
                getUriLabel(uri) {
                    return uri.fsPath.replace(/\/|\\/g, '|');
                }
            };
            const model = (0, testTextModel_1.createTextModel)([].join('\n'), undefined, undefined, uri_1.URI.parse('foo:///foo/files/text.txt'));
            const resolver = new snippetVariables_1.CompositeSnippetVariableResolver([new snippetVariables_1.ModelBasedVariableResolver(labelService, model)]);
            assertVariableResolve(resolver, 'TM_FILEPATH', '|foo|files|text.txt');
            model.dispose();
        });
        test('editor variables, selection', function () {
            resolver = new snippetVariables_1.SelectionBasedVariableResolver(model, new selection_1.Selection(1, 2, 2, 3), 0, undefined);
            assertVariableResolve(resolver, 'TM_SELECTED_TEXT', 'his is line one\nth');
            assertVariableResolve(resolver, 'TM_CURRENT_LINE', 'this is line two');
            assertVariableResolve(resolver, 'TM_LINE_INDEX', '1');
            assertVariableResolve(resolver, 'TM_LINE_NUMBER', '2');
            assertVariableResolve(resolver, 'CURSOR_INDEX', '0');
            assertVariableResolve(resolver, 'CURSOR_NUMBER', '1');
            resolver = new snippetVariables_1.SelectionBasedVariableResolver(model, new selection_1.Selection(1, 2, 2, 3), 4, undefined);
            assertVariableResolve(resolver, 'CURSOR_INDEX', '4');
            assertVariableResolve(resolver, 'CURSOR_NUMBER', '5');
            resolver = new snippetVariables_1.SelectionBasedVariableResolver(model, new selection_1.Selection(2, 3, 1, 2), 0, undefined);
            assertVariableResolve(resolver, 'TM_SELECTED_TEXT', 'his is line one\nth');
            assertVariableResolve(resolver, 'TM_CURRENT_LINE', 'this is line one');
            assertVariableResolve(resolver, 'TM_LINE_INDEX', '0');
            assertVariableResolve(resolver, 'TM_LINE_NUMBER', '1');
            resolver = new snippetVariables_1.SelectionBasedVariableResolver(model, new selection_1.Selection(1, 2, 1, 2), 0, undefined);
            assertVariableResolve(resolver, 'TM_SELECTED_TEXT', undefined);
            assertVariableResolve(resolver, 'TM_CURRENT_WORD', 'this');
            resolver = new snippetVariables_1.SelectionBasedVariableResolver(model, new selection_1.Selection(3, 1, 3, 1), 0, undefined);
            assertVariableResolve(resolver, 'TM_CURRENT_WORD', undefined);
        });
        test('TextmateSnippet, resolve variable', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('"$TM_CURRENT_WORD"', true);
            assert.strictEqual(snippet.toString(), '""');
            snippet.resolveVariables(resolver);
            assert.strictEqual(snippet.toString(), '"this"');
        });
        test('TextmateSnippet, resolve variable with default', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('"${TM_CURRENT_WORD:foo}"', true);
            assert.strictEqual(snippet.toString(), '"foo"');
            snippet.resolveVariables(resolver);
            assert.strictEqual(snippet.toString(), '"this"');
        });
        test('More useful environment variables for snippets, #32737', function () {
            const disposables = new lifecycle_1.DisposableStore();
            assertVariableResolve(resolver, 'TM_FILENAME_BASE', 'text');
            resolver = new snippetVariables_1.ModelBasedVariableResolver(labelService, disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.parse('http://www.pb.o/abc/def/ghi'))));
            assertVariableResolve(resolver, 'TM_FILENAME_BASE', 'ghi');
            resolver = new snippetVariables_1.ModelBasedVariableResolver(labelService, disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.parse('mem:.git'))));
            assertVariableResolve(resolver, 'TM_FILENAME_BASE', '.git');
            resolver = new snippetVariables_1.ModelBasedVariableResolver(labelService, disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.parse('mem:foo.'))));
            assertVariableResolve(resolver, 'TM_FILENAME_BASE', 'foo');
            disposables.dispose();
        });
        function assertVariableResolve2(input, expected, varValue) {
            const snippet = new snippetParser_1.SnippetParser().parse(input)
                .resolveVariables({ resolve(variable) { return varValue || variable.name; } });
            const actual = snippet.toString();
            assert.strictEqual(actual, expected);
        }
        test('Variable Snippet Transform', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('name=${TM_FILENAME/(.*)\\..+$/$1/}', true);
            snippet.resolveVariables(resolver);
            assert.strictEqual(snippet.toString(), 'name=text');
            assertVariableResolve2('${ThisIsAVar/([A-Z]).*(Var)/$2/}', 'Var');
            assertVariableResolve2('${ThisIsAVar/([A-Z]).*(Var)/$2-${1:/downcase}/}', 'Var-t');
            assertVariableResolve2('${Foo/(.*)/${1:+Bar}/img}', 'Bar');
            //https://github.com/microsoft/vscode/issues/33162
            assertVariableResolve2('export default class ${TM_FILENAME/(\\w+)\\.js/$1/g}', 'export default class FooFile', 'FooFile.js');
            assertVariableResolve2('${foobarfoobar/(foo)/${1:+FAR}/g}', 'FARbarFARbar'); // global
            assertVariableResolve2('${foobarfoobar/(foo)/${1:+FAR}/}', 'FARbarfoobar'); // first match
            assertVariableResolve2('${foobarfoobar/(bazz)/${1:+FAR}/g}', 'foobarfoobar'); // no match, no else
            // assertVariableResolve2('${foobarfoobar/(bazz)/${1:+FAR}/g}', ''); // no match
            assertVariableResolve2('${foobarfoobar/(foo)/${2:+FAR}/g}', 'barbar'); // bad group reference
        });
        test('Snippet transforms do not handle regex with alternatives or optional matches, #36089', function () {
            assertVariableResolve2('${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}${2:/upcase}/g}', 'MyClass', 'my-class.js');
            // no hyphens
            assertVariableResolve2('${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}${2:/upcase}/g}', 'Myclass', 'myclass.js');
            // none matching suffix
            assertVariableResolve2('${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}${2:/upcase}/g}', 'Myclass.foo', 'myclass.foo');
            // more than one hyphen
            assertVariableResolve2('${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}${2:/upcase}/g}', 'ThisIsAFile', 'this-is-a-file.js');
            // KEBAB CASE
            assertVariableResolve2('${TM_FILENAME_BASE/([A-Z][a-z]+)([A-Z][a-z]+$)?/${1:/downcase}-${2:/downcase}/g}', 'capital-case', 'CapitalCase');
            assertVariableResolve2('${TM_FILENAME_BASE/([A-Z][a-z]+)([A-Z][a-z]+$)?/${1:/downcase}-${2:/downcase}/g}', 'capital-case-more', 'CapitalCaseMore');
        });
        test('Add variable to insert value from clipboard to a snippet #40153', function () {
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => undefined, 1, 0, true), 'CLIPBOARD', undefined);
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => null, 1, 0, true), 'CLIPBOARD', undefined);
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => '', 1, 0, true), 'CLIPBOARD', undefined);
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'foo', 1, 0, true), 'CLIPBOARD', 'foo');
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'foo', 1, 0, true), 'foo', undefined);
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'foo', 1, 0, true), 'cLIPBOARD', undefined);
        });
        test('Add variable to insert value from clipboard to a snippet #40153, 2', function () {
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'line1', 1, 2, true), 'CLIPBOARD', 'line1');
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'line1\nline2\nline3', 1, 2, true), 'CLIPBOARD', 'line1\nline2\nline3');
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'line1\nline2', 1, 2, true), 'CLIPBOARD', 'line2');
            resolver = new snippetVariables_1.ClipboardBasedVariableResolver(() => 'line1\nline2', 0, 2, true);
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'line1\nline2', 0, 2, true), 'CLIPBOARD', 'line1');
            assertVariableResolve(new snippetVariables_1.ClipboardBasedVariableResolver(() => 'line1\nline2', 0, 2, false), 'CLIPBOARD', 'line1\nline2');
        });
        function assertVariableResolve3(resolver, varName) {
            const snippet = new snippetParser_1.SnippetParser().parse(`$${varName}`);
            const variable = snippet.children[0];
            assert.strictEqual(variable.resolve(resolver), true, `${varName} failed to resolve`);
        }
        test('Add time variables for snippets #41631, #43140', function () {
            const resolver = new snippetVariables_1.TimeBasedVariableResolver;
            assertVariableResolve3(resolver, 'CURRENT_YEAR');
            assertVariableResolve3(resolver, 'CURRENT_YEAR_SHORT');
            assertVariableResolve3(resolver, 'CURRENT_MONTH');
            assertVariableResolve3(resolver, 'CURRENT_DATE');
            assertVariableResolve3(resolver, 'CURRENT_HOUR');
            assertVariableResolve3(resolver, 'CURRENT_MINUTE');
            assertVariableResolve3(resolver, 'CURRENT_SECOND');
            assertVariableResolve3(resolver, 'CURRENT_DAY_NAME');
            assertVariableResolve3(resolver, 'CURRENT_DAY_NAME_SHORT');
            assertVariableResolve3(resolver, 'CURRENT_MONTH_NAME');
            assertVariableResolve3(resolver, 'CURRENT_MONTH_NAME_SHORT');
            assertVariableResolve3(resolver, 'CURRENT_SECONDS_UNIX');
            assertVariableResolve3(resolver, 'CURRENT_TIMEZONE_OFFSET');
        });
        test('Time-based snippet variables resolve to the same values even as time progresses', async function () {
            const snippetText = `
			$CURRENT_YEAR
			$CURRENT_YEAR_SHORT
			$CURRENT_MONTH
			$CURRENT_DATE
			$CURRENT_HOUR
			$CURRENT_MINUTE
			$CURRENT_SECOND
			$CURRENT_DAY_NAME
			$CURRENT_DAY_NAME_SHORT
			$CURRENT_MONTH_NAME
			$CURRENT_MONTH_NAME_SHORT
			$CURRENT_SECONDS_UNIX
			$CURRENT_TIMEZONE_OFFSET
		`;
            const clock = sinon.useFakeTimers();
            try {
                const resolver = new snippetVariables_1.TimeBasedVariableResolver;
                const firstResolve = new snippetParser_1.SnippetParser().parse(snippetText).resolveVariables(resolver);
                clock.tick((365 * 24 * 3600 * 1000) + (24 * 3600 * 1000) + (3661 * 1000)); // 1 year + 1 day + 1 hour + 1 minute + 1 second
                const secondResolve = new snippetParser_1.SnippetParser().parse(snippetText).resolveVariables(resolver);
                assert.strictEqual(firstResolve.toString(), secondResolve.toString(), `Time-based snippet variables resolved differently`);
            }
            finally {
                clock.restore();
            }
        });
        test('creating snippet - format-condition doesn\'t work #53617', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${TM_LINE_NUMBER/(10)/${1:?It is:It is not}/} line 10', true);
            snippet.resolveVariables({ resolve() { return '10'; } });
            assert.strictEqual(snippet.toString(), 'It is line 10');
            snippet.resolveVariables({ resolve() { return '11'; } });
            assert.strictEqual(snippet.toString(), 'It is not line 10');
        });
        test('Add workspace name and folder variables for snippets #68261', function () {
            let workspace;
            const workspaceService = new class {
                constructor() {
                    this._throw = () => { throw new Error(); };
                    this.onDidChangeWorkbenchState = this._throw;
                    this.onDidChangeWorkspaceName = this._throw;
                    this.onWillChangeWorkspaceFolders = this._throw;
                    this.onDidChangeWorkspaceFolders = this._throw;
                    this.getCompleteWorkspace = this._throw;
                    this.getWorkbenchState = this._throw;
                    this.getWorkspaceFolder = this._throw;
                    this.isCurrentWorkspace = this._throw;
                    this.isInsideWorkspace = this._throw;
                }
                getWorkspace() { return workspace; }
            };
            const resolver = new snippetVariables_1.WorkspaceBasedVariableResolver(workspaceService);
            // empty workspace
            workspace = new testWorkspace_1.Workspace('');
            assertVariableResolve(resolver, 'WORKSPACE_NAME', undefined);
            assertVariableResolve(resolver, 'WORKSPACE_FOLDER', undefined);
            // single folder workspace without config
            workspace = new testWorkspace_1.Workspace('', [(0, workspace_1.toWorkspaceFolder)(uri_1.URI.file('/folderName'))]);
            assertVariableResolve(resolver, 'WORKSPACE_NAME', 'folderName');
            if (!platform_1.isWindows) {
                assertVariableResolve(resolver, 'WORKSPACE_FOLDER', '/folderName');
            }
            // workspace with config
            const workspaceConfigPath = uri_1.URI.file('testWorkspace.code-workspace');
            workspace = new testWorkspace_1.Workspace('', (0, workspaces_1.toWorkspaceFolders)([{ path: 'folderName' }], workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase), workspaceConfigPath);
            assertVariableResolve(resolver, 'WORKSPACE_NAME', 'testWorkspace');
            if (!platform_1.isWindows) {
                assertVariableResolve(resolver, 'WORKSPACE_FOLDER', '/');
            }
        });
        test('Add RELATIVE_FILEPATH snippet variable #114208', function () {
            let resolver;
            // Mock a label service (only coded for file uris)
            const workspaceLabelService = ((rootPath) => {
                const labelService = new class extends (0, mock_1.mock)() {
                    getUriLabel(uri, options = {}) {
                        const rootFsPath = uri_1.URI.file(rootPath).fsPath + path_1.sep;
                        const fsPath = uri.fsPath;
                        if (options.relative && rootPath && fsPath.startsWith(rootFsPath)) {
                            return fsPath.substring(rootFsPath.length);
                        }
                        return fsPath;
                    }
                };
                return labelService;
            });
            const model = (0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.parse('file:///foo/files/text.txt'));
            // empty workspace
            resolver = new snippetVariables_1.ModelBasedVariableResolver(workspaceLabelService(''), model);
            if (!platform_1.isWindows) {
                assertVariableResolve(resolver, 'RELATIVE_FILEPATH', '/foo/files/text.txt');
            }
            else {
                assertVariableResolve(resolver, 'RELATIVE_FILEPATH', '\\foo\\files\\text.txt');
            }
            // single folder workspace
            resolver = new snippetVariables_1.ModelBasedVariableResolver(workspaceLabelService('/foo'), model);
            if (!platform_1.isWindows) {
                assertVariableResolve(resolver, 'RELATIVE_FILEPATH', 'files/text.txt');
            }
            else {
                assertVariableResolve(resolver, 'RELATIVE_FILEPATH', 'files\\text.txt');
            }
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFZhcmlhYmxlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc25pcHBldC90ZXN0L2Jyb3dzZXIvc25pcHBldFZhcmlhYmxlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQXVCQSxLQUFLLENBQUMsNEJBQTRCLEVBQUU7UUFHbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWlCO1lBQ2xELFdBQVcsQ0FBQyxHQUFRO2dCQUM1QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDbkIsQ0FBQztTQUNELENBQUM7UUFFRixJQUFJLEtBQWdCLENBQUM7UUFDckIsSUFBSSxRQUEwQixDQUFDO1FBRS9CLEtBQUssQ0FBQztZQUNMLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQUM7Z0JBQ3ZCLGtCQUFrQjtnQkFDbEIsa0JBQWtCO2dCQUNsQix3QkFBd0I7YUFDeEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQztZQUU3RSxRQUFRLEdBQUcsSUFBSSxtREFBZ0MsQ0FBQztnQkFDL0MsSUFBSSw2Q0FBMEIsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDO2dCQUNuRCxJQUFJLGlEQUE4QixDQUFDLEtBQUssRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQzthQUNsRixDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQztZQUNSLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUMs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