/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/glob", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, glob, path_1, platform_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Glob', () => {
        // test('perf', () => {
        // 	let patterns = [
        // 		'{**/*.cs,**/*.json,**/*.csproj,**/*.sln}',
        // 		'{**/*.cs,**/*.csproj,**/*.sln}',
        // 		'{**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.es6,**/*.mjs,**/*.cjs}',
        // 		'**/*.go',
        // 		'{**/*.ps,**/*.ps1}',
        // 		'{**/*.c,**/*.cpp,**/*.h}',
        // 		'{**/*.fsx,**/*.fsi,**/*.fs,**/*.ml,**/*.mli}',
        // 		'{**/*.js,**/*.jsx,**/*.es6,**/*.mjs,**/*.cjs}',
        // 		'{**/*.ts,**/*.tsx}',
        // 		'{**/*.php}',
        // 		'{**/*.php}',
        // 		'{**/*.php}',
        // 		'{**/*.php}',
        // 		'{**/*.py}',
        // 		'{**/*.py}',
        // 		'{**/*.py}',
        // 		'{**/*.rs,**/*.rslib}',
        // 		'{**/*.cpp,**/*.cc,**/*.h}',
        // 		'{**/*.md}',
        // 		'{**/*.md}',
        // 		'{**/*.md}'
        // 	];
        // 	let paths = [
        // 		'/DNXConsoleApp/Program.cs',
        // 		'C:\\DNXConsoleApp\\foo\\Program.cs',
        // 		'test/qunit',
        // 		'test/test.txt',
        // 		'test/node_modules',
        // 		'.hidden.txt',
        // 		'/node_module/test/foo.js'
        // 	];
        // 	let results = 0;
        // 	let c = 1000;
        // 	console.profile('glob.match');
        // 	while (c-- > 0) {
        // 		for (let path of paths) {
        // 			for (let pattern of patterns) {
        // 				let r = glob.match(pattern, path);
        // 				if (r) {
        // 					results += 42;
        // 				}
        // 			}
        // 		}
        // 	}
        // 	console.profileEnd();
        // });
        function assertGlobMatch(pattern, input) {
            assert(glob.match(pattern, input), `${JSON.stringify(pattern)} should match ${input}`);
            assert(glob.match(pattern, nativeSep(input)), `${pattern} should match ${nativeSep(input)}`);
        }
        function assertNoGlobMatch(pattern, input) {
            assert(!glob.match(pattern, input), `${pattern} should not match ${input}`);
            assert(!glob.match(pattern, nativeSep(input)), `${pattern} should not match ${nativeSep(input)}`);
        }
        test('simple', () => {
            let p = 'node_modules';
            assertGlobMatch(p, 'node_modules');
            assertNoGlobMatch(p, 'node_module');
            assertNoGlobMatch(p, '/node_modules');
            assertNoGlobMatch(p, 'test/node_modules');
            p = 'test.txt';
            assertGlobMatch(p, 'test.txt');
            assertNoGlobMatch(p, 'test?txt');
            assertNoGlobMatch(p, '/text.txt');
            assertNoGlobMatch(p, 'test/test.txt');
            p = 'test(.txt';
            assertGlobMatch(p, 'test(.txt');
            assertNoGlobMatch(p, 'test?txt');
            p = 'qunit';
            assertGlobMatch(p, 'qunit');
            assertNoGlobMatch(p, 'qunit.css');
            assertNoGlobMatch(p, 'test/qunit');
            // Absolute
            p = '/DNXConsoleApp/**/*.cs';
            assertGlobMatch(p, '/DNXConsoleApp/Program.cs');
            assertGlobMatch(p, '/DNXConsoleApp/foo/Program.cs');
            p = 'C:/DNXConsoleApp/**/*.cs';
            assertGlobMatch(p, 'C:\\DNXConsoleApp\\Program.cs');
            assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.cs');
            p = '*';
            assertGlobMatch(p, '');
        });
        test('dot hidden', function () {
            let p = '.*';
            assertGlobMatch(p, '.git');
            assertGlobMatch(p, '.hidden.txt');
            assertNoGlobMatch(p, 'git');
            assertNoGlobMatch(p, 'hidden.txt');
            assertNoGlobMatch(p, 'path/.git');
            assertNoGlobMatch(p, 'path/.hidden.txt');
            p = '**/.*';
            assertGlobMatch(p, '.git');
            assertGlobMatch(p, '/.git');
            assertGlobMatch(p, '.hidden.txt');
            assertNoGlobMatch(p, 'git');
            assertNoGlobMatch(p, 'hidden.txt');
            assertGlobMatch(p, 'path/.git');
            assertGlobMatch(p, 'path/.hidden.txt');
            assertGlobMatch(p, '/path/.git');
            assertGlobMatch(p, '/path/.hidden.txt');
            assertNoGlobMatch(p, 'path/git');
            assertNoGlobMatch(p, 'pat.h/hidden.txt');
            p = '._*';
            assertGlobMatch(p, '._git');
            assertGlobMatch(p, '._hidden.txt');
            assertNoGlobMatch(p, 'git');
            assertNoGlobMatch(p, 'hidden.txt');
            assertNoGlobMatch(p, 'path/._git');
            assertNoGlobMatch(p, 'path/._hidden.txt');
            p = '**/._*';
            assertGlobMatch(p, '._git');
            assertGlobMatch(p, '._hidden.txt');
            assertNoGlobMatch(p, 'git');
            assertNoGlobMatch(p, 'hidden._txt');
            assertGlobMatch(p, 'path/._git');
            assertGlobMatch(p, 'path/._hidden.txt');
            assertGlobMatch(p, '/path/._git');
            assertGlobMatch(p, '/path/._hidden.txt');
            assertNoGlobMatch(p, 'path/git');
            assertNoGlobMatch(p, 'pat.h/hidden._txt');
        });
        test('file pattern', function () {
            let p = '*.js';
            assertGlobMatch(p, 'foo.js');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_modules/foo.js');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
            p = 'html.*';
            assertGlobMatch(p, 'html.js');
            assertGlobMatch(p, 'html.txt');
            assertNoGlobMatch(p, 'htm.txt');
            p = '*.*';
            assertGlobMatch(p, 'html.js');
            assertGlobMatch(p, 'html.txt');
            assertGlobMatch(p, 'htm.txt');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_modules/foo.js');
            p = 'node_modules/test/*.js';
            assertGlobMatch(p, 'node_modules/test/foo.js');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_module/test/foo.js');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
        });
        test('star', () => {
            let p = 'node*modules';
            assertGlobMatch(p, 'node_modules');
            assertGlobMatch(p, 'node_super_modules');
            assertNoGlobMatch(p, 'node_module');
            assertNoGlobMatch(p, '/node_modules');
            assertNoGlobMatch(p, 'test/node_modules');
            p = '*';
            assertGlobMatch(p, 'html.js');
            assertGlobMatch(p, 'html.txt');
            assertGlobMatch(p, 'htm.txt');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_modules/foo.js');
        });
        test('file / folder match', function () {
            const p = '**/node_modules/**';
            assertGlobMatch(p, 'node_modules');
            assertGlobMatch(p, 'node_modules/');
            assertGlobMatch(p, 'a/node_modules');
            assertGlobMatch(p, 'a/node_modules/');
            assertGlobMatch(p, 'node_modules/foo');
            assertGlobMatch(p, 'foo/node_modules/foo/bar');
            assertGlobMatch(p, '/node_modules');
            assertGlobMatch(p, '/node_modules/');
            assertGlobMatch(p, '/a/node_modules');
            assertGlobMatch(p, '/a/node_modules/');
            assertGlobMatch(p, '/node_modules/foo');
            assertGlobMatch(p, '/foo/node_modules/foo/bar');
        });
        test('questionmark', () => {
            let p = 'node?modules';
            assertGlobMatch(p, 'node_modules');
            assertNoGlobMatch(p, 'node_super_modules');
            assertNoGlobMatch(p, 'node_module');
            assertNoGlobMatch(p, '/node_modules');
            assertNoGlobMatch(p, 'test/node_modules');
            p = '?';
            assertGlobMatch(p, 'h');
            assertNoGlobMatch(p, 'html.txt');
            assertNoGlobMatch(p, 'htm.txt');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_modules/foo.js');
        });
        test('globstar', () => {
            let p = '**/*.js';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, '/foo.js');
            assertGlobMatch(p, 'folder/foo.js');
            assertGlobMatch(p, '/node_modules/foo.js');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
            assertNoGlobMatch(p, '/some.js/test');
            assertNoGlobMatch(p, '\\some.js\\test');
            p = '**/project.json';
            assertGlobMatch(p, 'project.json');
            assertGlobMatch(p, '/project.json');
            assertGlobMatch(p, 'some/folder/project.json');
            assertGlobMatch(p, '/some/folder/project.json');
            assertNoGlobMatch(p, 'some/folder/file_project.json');
            assertNoGlobMatch(p, 'some/folder/fileproject.json');
            assertNoGlobMatch(p, 'some/rrproject.json');
            assertNoGlobMatch(p, 'some\\rrproject.json');
            p = 'test/**';
            assertGlobMatch(p, 'test');
            assertGlobMatch(p, 'test/foo');
            assertGlobMatch(p, 'test/foo/');
            assertGlobMatch(p, 'test/foo.js');
            assertGlobMatch(p, 'test/other/foo.js');
            assertNoGlobMatch(p, 'est/other/foo.js');
            p = '**';
            assertGlobMatch(p, '/');
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, 'folder/foo.js');
            assertGlobMatch(p, 'folder/foo/');
            assertGlobMatch(p, '/node_modules/foo.js');
            assertGlobMatch(p, 'foo.jss');
            assertGlobMatch(p, 'some.js/test');
            p = 'test/**/*.js';
            assertGlobMatch(p, 'test/foo.js');
            assertGlobMatch(p, 'test/other/foo.js');
            assertGlobMatch(p, 'test/other/more/foo.js');
            assertNoGlobMatch(p, 'test/foo.ts');
            assertNoGlobMatch(p, 'test/other/foo.ts');
            assertNoGlobMatch(p, 'test/other/more/foo.ts');
            p = '**/**/*.js';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, '/foo.js');
            assertGlobMatch(p, 'folder/foo.js');
            assertGlobMatch(p, '/node_modules/foo.js');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
            p = '**/node_modules/**/*.js';
            assertNoGlobMatch(p, 'foo.js');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertGlobMatch(p, 'node_modules/foo.js');
            assertGlobMatch(p, '/node_modules/foo.js');
            assertGlobMatch(p, 'node_modules/some/folder/foo.js');
            assertGlobMatch(p, '/node_modules/some/folder/foo.js');
            assertNoGlobMatch(p, 'node_modules/some/folder/foo.ts');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
            p = '{**/node_modules/**,**/.git/**,**/bower_components/**}';
            assertGlobMatch(p, 'node_modules');
            assertGlobMatch(p, '/node_modules');
            assertGlobMatch(p, '/node_modules/more');
            assertGlobMatch(p, 'some/test/node_modules');
            assertGlobMatch(p, 'some\\test\\node_modules');
            assertGlobMatch(p, '/some/test/node_modules');
            assertGlobMatch(p, '\\some\\test\\node_modules');
            assertGlobMatch(p, 'C:\\\\some\\test\\node_modules');
            assertGlobMatch(p, 'C:\\\\some\\test\\node_modules\\more');
            assertGlobMatch(p, 'bower_components');
            assertGlobMatch(p, 'bower_components/more');
            assertGlobMatch(p, '/bower_components');
            assertGlobMatch(p, 'some/test/bower_components');
            assertGlobMatch(p, 'some\\test\\bower_components');
            assertGlobMatch(p, '/some/test/bower_components');
            assertGlobMatch(p, '\\some\\test\\bower_components');
            assertGlobMatch(p, 'C:\\\\some\\test\\bower_components');
            assertGlobMatch(p, 'C:\\\\some\\test\\bower_components\\more');
            assertGlobMatch(p, '.git');
            assertGlobMatch(p, '/.git');
            assertGlobMatch(p, 'some/test/.git');
            assertGlobMatch(p, 'some\\test\\.git');
            assertGlobMatch(p, '/some/test/.git');
            assertGlobMatch(p, '\\some\\test\\.git');
            assertGlobMatch(p, 'C:\\\\some\\test\\.git');
            assertNoGlobMatch(p, 'tempting');
            assertNoGlobMatch(p, '/tempting');
            assertNoGlobMatch(p, 'some/test/tempting');
            assertNoGlobMatch(p, 'some\\test\\tempting');
            assertNoGlobMatch(p, '/some/test/tempting');
            assertNoGlobMatch(p, '\\some\\test\\tempting');
            assertNoGlobMatch(p, 'C:\\\\some\\test\\tempting');
            p = '{**/package.json,**/project.json}';
            assertGlobMatch(p, 'package.json');
            assertGlobMatch(p, '/package.json');
            assertNoGlobMatch(p, 'xpackage.json');
            assertNoGlobMatch(p, '/xpackage.json');
        });
        test('issue 41724', function () {
            let p = 'some/**/*.js';
            assertGlobMatch(p, 'some/foo.js');
            assertGlobMatch(p, 'some/folder/foo.js');
            assertNoGlobMatch(p, 'something/foo.js');
            assertNoGlobMatch(p, 'something/folder/foo.js');
            p = 'some/**/*';
            assertGlobMatch(p, 'some/foo.js');
            assertGlobMatch(p, 'some/folder/foo.js');
            assertNoGlobMatch(p, 'something/foo.js');
            assertNoGlobMatch(p, 'something/folder/foo.js');
        });
        test('brace expansion', function () {
            let p = '*.{html,js}';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, 'foo.html');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_modules/foo.js');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
            p = '*.{html}';
            assertGlobMatch(p, 'foo.html');
            assertNoGlobMatch(p, 'foo.js');
            assertNoGlobMatch(p, 'folder/foo.js');
            assertNoGlobMatch(p, '/node_modules/foo.js');
            assertNoGlobMatch(p, 'foo.jss');
            assertNoGlobMatch(p, 'some.js/test');
            p = '{node_modules,testing}';
            assertGlobMatch(p, 'node_modules');
            assertGlobMatch(p, 'testing');
            assertNoGlobMatch(p, 'node_module');
            assertNoGlobMatch(p, 'dtesting');
            p = '**/{foo,bar}';
            assertGlobMatch(p, 'foo');
            assertGlobMatch(p, 'bar');
            assertGlobMatch(p, 'test/foo');
            assertGlobMatch(p, 'test/bar');
            assertGlobMatch(p, 'other/more/foo');
            assertGlobMatch(p, 'other/more/bar');
            assertGlobMatch(p, '/foo');
            assertGlobMatch(p, '/bar');
            assertGlobMatch(p, '/test/foo');
            assertGlobMatch(p, '/test/bar');
            assertGlobMatch(p, '/other/more/foo');
            assertGlobMatch(p, '/other/more/bar');
            p = '{foo,bar}/**';
            assertGlobMatch(p, 'foo');
            assertGlobMatch(p, 'bar');
            assertGlobMatch(p, 'bar/');
            assertGlobMatch(p, 'foo/test');
            assertGlobMatch(p, 'bar/test');
            assertGlobMatch(p, 'bar/test/');
            assertGlobMatch(p, 'foo/other/more');
            assertGlobMatch(p, 'bar/other/more');
            assertGlobMatch(p, 'bar/other/more/');
            p = '{**/*.d.ts,**/*.js}';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, 'testing/foo.js');
            assertGlobMatch(p, 'testing\\foo.js');
            assertGlobMatch(p, '/testing/foo.js');
            assertGlobMatch(p, '\\testing\\foo.js');
            assertGlobMatch(p, 'C:\\testing\\foo.js');
            assertGlobMatch(p, 'foo.d.ts');
            assertGlobMatch(p, 'testing/foo.d.ts');
            assertGlobMatch(p, 'testing\\foo.d.ts');
            assertGlobMatch(p, '/testing/foo.d.ts');
            assertGlobMatch(p, '\\testing\\foo.d.ts');
            assertGlobMatch(p, 'C:\\testing\\foo.d.ts');
            assertNoGlobMatch(p, 'foo.d');
            assertNoGlobMatch(p, 'testing/foo.d');
            assertNoGlobMatch(p, 'testing\\foo.d');
            assertNoGlobMatch(p, '/testing/foo.d');
            assertNoGlobMatch(p, '\\testing\\foo.d');
            assertNoGlobMatch(p, 'C:\\testing\\foo.d');
            p = '{**/*.d.ts,**/*.js,path/simple.jgs}';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, 'testing/foo.js');
            assertGlobMatch(p, 'testing\\foo.js');
            assertGlobMatch(p, '/testing/foo.js');
            assertGlobMatch(p, 'path/simple.jgs');
            assertNoGlobMatch(p, '/path/simple.jgs');
            assertGlobMatch(p, '\\testing\\foo.js');
            assertGlobMatch(p, 'C:\\testing\\foo.js');
            p = '{**/*.d.ts,**/*.js,foo.[0-9]}';
            assertGlobMatch(p, 'foo.5');
            assertGlobMatch(p, 'foo.8');
            assertNoGlobMatch(p, 'bar.5');
            assertNoGlobMatch(p, 'foo.f');
            assertGlobMatch(p, 'foo.js');
            p = 'prefix/{**/*.d.ts,**/*.js,foo.[0-9]}';
            assertGlobMatch(p, 'prefix/foo.5');
            assertGlobMatch(p, 'prefix/foo.8');
            assertNoGlobMatch(p, 'prefix/bar.5');
            assertNoGlobMatch(p, 'prefix/foo.f');
            assertGlobMatch(p, 'prefix/foo.js');
        });
        test('expression support (single)', function () {
            const siblings = ['test.html', 'test.txt', 'test.ts', 'test.js'];
            const hasSibling = (name) => siblings.indexOf(name) !== -1;
            // { "**/*.js": { "when": "$(basename).ts" } }
            let expression = {
                '**/*.js': {
                    when: '$(basename).ts'
                }
            };
            assert.strictEqual('**/*.js', glob.match(expression, 'test.js', hasSibling));
            assert.strictEqual(glob.match(expression, 'test.js', () => false), null);
            assert.strictEqual(glob.match(expression, 'test.js', name => name === 'te.ts'), null);
            assert.strictEqual(glob.match(expression, 'test.js'), null);
            expression = {
                '**/*.js': {
                    when: ''
                }
            };
            assert.strictEqual(glob.match(expression, 'test.js', hasSibling), null);
            expression = {
                '**/*.js': {}
            };
            assert.strictEqual('**/*.js', glob.match(expression, 'test.js', hasSibling));
            expression = {};
            assert.strictEqual(glob.match(expression, 'test.js', hasSibling), null);
        });
        test('expression support (multiple)', function () {
            const siblings = ['test.html', 'test.txt', 'test.ts', 'test.js'];
            const hasSibling = (name) => siblings.indexOf(name) !== -1;
            // { "**/*.js": { "when": "$(basename).ts" } }
            const expression = {
                '**/*.js': { when: '$(basename).ts' },
                '**/*.as': true,
                '**/*.foo': false,
                '**/*.bananas': { bananas: true }
            };
            assert.strictEqual('**/*.js', glob.match(expression, 'test.js', hasSibling));
            assert.strictEqual('**/*.as', glob.match(expression, 'test.as', hasSibling));
            assert.strictEqual('**/*.bananas', glob.match(expression, 'test.bananas', hasSibling));
            assert.strictEqual('**/*.bananas', glob.match(expression, 'test.bananas'));
            assert.strictEqual(glob.match(expression, 'test.foo', hasSibling), null);
        });
        test('brackets', () => {
            let p = 'foo.[0-9]';
            assertGlobMatch(p, 'foo.5');
            assertGlobMatch(p, 'foo.8');
            assertNoGlobMatch(p, 'bar.5');
            assertNoGlobMatch(p, 'foo.f');
            p = 'foo.[^0-9]';
            assertNoGlobMatch(p, 'foo.5');
            assertNoGlobMatch(p, 'foo.8');
            assertNoGlobMatch(p, 'bar.5');
            assertGlobMatch(p, 'foo.f');
            p = 'foo.[!0-9]';
            assertNoGlobMatch(p, 'foo.5');
            assertNoGlobMatch(p, 'foo.8');
            assertNoGlobMatch(p, 'bar.5');
            assertGlobMatch(p, 'foo.f');
            p = 'foo.[0!^*?]';
            assertNoGlobMatch(p, 'foo.5');
            assertNoGlobMatch(p, 'foo.8');
            assertGlobMatch(p, 'foo.0');
            assertGlobMatch(p, 'foo.!');
            assertGlobMatch(p, 'foo.^');
            assertGlobMatch(p, 'foo.*');
            assertGlobMatch(p, 'foo.?');
            p = 'foo[/]bar';
            assertNoGlobMatch(p, 'foo/bar');
            p = 'foo.[[]';
            assertGlobMatch(p, 'foo.[');
            p = 'foo.[]]';
            assertGlobMatch(p, 'foo.]');
            p = 'foo.[][!]';
            assertGlobMatch(p, 'foo.]');
            assertGlobMatch(p, 'foo.[');
            assertGlobMatch(p, 'foo.!');
            p = 'foo.[]-]';
            assertGlobMatch(p, 'foo.]');
            assertGlobMatch(p, 'foo.-');
        });
        test('full path', function () {
            assertGlobMatch('testing/this/foo.txt', 'testing/this/foo.txt');
        });
        test('ending path', function () {
            assertGlobMatch('**/testing/this/foo.txt', 'some/path/testing/this/foo.txt');
        });
        test('prefix agnostic', function () {
            let p = '**/*.js';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, '/foo.js');
            assertGlobMatch(p, '\\foo.js');
            assertGlobMatch(p, 'testing/foo.js');
            assertGlobMatch(p, 'testing\\foo.js');
            assertGlobMatch(p, '/testing/foo.js');
            assertGlobMatch(p, '\\testing\\foo.js');
            assertGlobMatch(p, 'C:\\testing\\foo.js');
            assertNoGlobMatch(p, 'foo.ts');
            assertNoGlobMatch(p, 'testing/foo.ts');
            assertNoGlobMatch(p, 'testing\\foo.ts');
            assertNoGlobMatch(p, '/testing/foo.ts');
            assertNoGlobMatch(p, '\\testing\\foo.ts');
            assertNoGlobMatch(p, 'C:\\testing\\foo.ts');
            assertNoGlobMatch(p, 'foo.js.txt');
            assertNoGlobMatch(p, 'testing/foo.js.txt');
            assertNoGlobMatch(p, 'testing\\foo.js.txt');
            assertNoGlobMatch(p, '/testing/foo.js.txt');
            assertNoGlobMatch(p, '\\testing\\foo.js.txt');
            assertNoGlobMatch(p, 'C:\\testing\\foo.js.txt');
            assertNoGlobMatch(p, 'testing.js/foo');
            assertNoGlobMatch(p, 'testing.js\\foo');
            assertNoGlobMatch(p, '/testing.js/foo');
            assertNoGlobMatch(p, '\\testing.js\\foo');
            assertNoGlobMatch(p, 'C:\\testing.js\\foo');
            p = '**/foo.js';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, '/foo.js');
            assertGlobMatch(p, '\\foo.js');
            assertGlobMatch(p, 'testing/foo.js');
            assertGlobMatch(p, 'testing\\foo.js');
            assertGlobMatch(p, '/testing/foo.js');
            assertGlobMatch(p, '\\testing\\foo.js');
            assertGlobMatch(p, 'C:\\testing\\foo.js');
        });
        test('cached properly', function () {
            const p = '**/*.js';
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, 'testing/foo.js');
            assertGlobMatch(p, 'testing\\foo.js');
            assertGlobMatch(p, '/testing/foo.js');
            assertGlobMatch(p, '\\testing\\foo.js');
            assertGlobMatch(p, 'C:\\testing\\foo.js');
            assertNoGlobMatch(p, 'foo.ts');
            assertNoGlobMatch(p, 'testing/foo.ts');
            assertNoGlobMatch(p, 'testing\\foo.ts');
            assertNoGlobMatch(p, '/testing/foo.ts');
            assertNoGlobMatch(p, '\\testing\\foo.ts');
            assertNoGlobMatch(p, 'C:\\testing\\foo.ts');
            assertNoGlobMatch(p, 'foo.js.txt');
            assertNoGlobMatch(p, 'testing/foo.js.txt');
            assertNoGlobMatch(p, 'testing\\foo.js.txt');
            assertNoGlobMatch(p, '/testing/foo.js.txt');
            assertNoGlobMatch(p, '\\testing\\foo.js.txt');
            assertNoGlobMatch(p, 'C:\\testing\\foo.js.txt');
            assertNoGlobMatch(p, 'testing.js/foo');
            assertNoGlobMatch(p, 'testing.js\\foo');
            assertNoGlobMatch(p, '/testing.js/foo');
            assertNoGlobMatch(p, '\\testing.js\\foo');
            assertNoGlobMatch(p, 'C:\\testing.js\\foo');
            // Run again and make sure the regex are properly reused
            assertGlobMatch(p, 'foo.js');
            assertGlobMatch(p, 'testing/foo.js');
            assertGlobMatch(p, 'testing\\foo.js');
            assertGlobMatch(p, '/testing/foo.js');
            assertGlobMatch(p, '\\testing\\foo.js');
            assertGlobMatch(p, 'C:\\testing\\foo.js');
            assertNoGlobMatch(p, 'foo.ts');
            assertNoGlobMatch(p, 'testing/foo.ts');
            assertNoGlobMatch(p, 'testing\\foo.ts');
            assertNoGlobMatch(p, '/testing/foo.ts');
            assertNoGlobMatch(p, '\\testing\\foo.ts');
            assertNoGlobMatch(p, 'C:\\testing\\foo.ts');
            assertNoGlobMatch(p, 'foo.js.txt');
            assertNoGlobMatch(p, 'testing/foo.js.txt');
            assertNoGlobMatch(p, 'testing\\foo.js.txt');
            assertNoGlobMatch(p, '/testing/foo.js.txt');
            assertNoGlobMatch(p, '\\testing\\foo.js.txt');
            assertNoGlobMatch(p, 'C:\\testing\\foo.js.txt');
            assertNoGlobMatch(p, 'testing.js/foo');
            assertNoGlobMatch(p, 'testing.js\\foo');
            assertNoGlobMatch(p, '/testing.js/foo');
            assertNoGlobMatch(p, '\\testing.js\\foo');
            assertNoGlobMatch(p, 'C:\\testing.js\\foo');
        });
        test('invalid glob', function () {
            const p = '**/*(.js';
            assertNoGlobMatch(p, 'foo.js');
        });
        test('split glob aware', function () {
            assert.deepStrictEqual(glob.splitGlobAware('foo,bar', ','), ['foo', 'bar']);
            assert.deepStrictEqual(glob.splitGlobAware('foo', ','), ['foo']);
            assert.deepStrictEqual(glob.splitGlobAware('{foo,bar}', ','), ['{foo,bar}']);
            assert.deepStrictEqual(glob.splitGlobAware('foo,bar,{foo,bar}', ','), ['foo', 'bar', '{foo,bar}']);
            assert.deepStrictEqual(glob.splitGlobAware('{foo,bar},foo,bar,{foo,bar}', ','), ['{foo,bar}', 'foo', 'bar', '{foo,bar}']);
            assert.deepStrictEqual(glob.splitGlobAware('[foo,bar]', ','), ['[foo,bar]']);
            assert.deepStrictEqual(glob.splitGlobAware('foo,bar,[foo,bar]', ','), ['foo', 'bar', '[foo,bar]']);
            assert.deepStrictEqual(glob.splitGlobAware('[foo,bar],foo,bar,[foo,bar]', ','), ['[foo,bar]', 'foo', 'bar', '[foo,bar]']);
        });
        test('expression with disabled glob', function () {
            const expr = { '**/*.js': false };
            assert.strictEqual(glob.match(expr, 'foo.js'), null);
        });
        test('expression with two non-trivia globs', function () {
            const expr = {
                '**/*.j?': true,
                '**/*.t?': true
            };
            assert.strictEqual(glob.match(expr, 'foo.js'), '**/*.j?');
            assert.strictEqual(glob.match(expr, 'foo.as'), null);
        });
        test('expression with non-trivia glob (issue 144458)', function () {
            const pattern = '**/p*';
            assert.strictEqual(glob.match(pattern, 'foo/barp'), false);
            assert.strictEqual(glob.match(pattern, 'foo/bar/ap'), false);
            assert.strictEqual(glob.match(pattern, 'ap'), false);
            assert.strictEqual(glob.match(pattern, 'foo/barp1'), false);
            assert.strictEqual(glob.match(pattern, 'foo/bar/ap1'), false);
            assert.strictEqual(glob.match(pattern, 'ap1'), false);
            assert.strictEqual(glob.match(pattern, '/foo/barp'), false);
            assert.strictEqual(glob.match(pattern, '/foo/bar/ap'), false);
            assert.strictEqual(glob.match(pattern, '/ap'), false);
            assert.strictEqual(glob.match(pattern, '/foo/barp1'), false);
            assert.strictEqual(glob.match(pattern, '/foo/bar/ap1'), false);
            assert.strictEqual(glob.match(pattern, '/ap1'), false);
            assert.strictEqual(glob.match(pattern, 'foo/pbar'), true);
            assert.strictEqual(glob.match(pattern, '/foo/pbar'), true);
            assert.strictEqual(glob.match(pattern, 'foo/bar/pa'), true);
            assert.strictEqual(glob.match(pattern, '/p'), true);
        });
        test('expression with empty glob', function () {
            const expr = { '': true };
            assert.strictEqual(glob.match(expr, 'foo.js'), null);
        });
        test('expression with other falsy value', function () {
            const expr = { '**/*.js': 0 };
            assert.strictEqual(glob.match(expr, 'foo.js'), '**/*.js');
        });
        test('expression with two basename globs', function () {
            const expr = {
                '**/bar': true,
                '**/baz': true
            };
            assert.strictEqual(glob.match(expr, 'bar'), '**/bar');
            assert.strictEqual(glob.match(expr, 'foo'), null);
            assert.strictEqual(glob.match(expr, 'foo/bar'), '**/bar');
            assert.strictEqual(glob.match(expr, 'foo\\bar'), '**/bar');
            assert.strictEqual(glob.match(expr, 'foo/foo'), null);
        });
        test('expression with two basename globs and a siblings expression', function () {
            const expr = {
                '**/bar': true,
                '**/baz': true,
                '**/*.js': { when: '$(basename).ts' }
            };
            const siblings = ['foo.ts', 'foo.js', 'foo', 'bar'];
            const hasSibling = (name) => siblings.indexOf(name) !== -1;
            assert.strictEqual(glob.match(expr, 'bar', hasSibling), '**/bar');
            assert.strictEqual(glob.match(expr, 'foo', hasSibling), null);
            assert.strictEqual(glob.match(expr, 'foo/bar', hasSibling), '**/bar');
            if (platform_1.isWindows) {
                // backslash is a valid file name character on posix
                assert.strictEqual(glob.match(expr, 'foo\\bar', hasSibling), '**/bar');
            }
            assert.strictEqual(glob.match(expr, 'foo/foo', hasSibling), null);
            assert.strictEqual(glob.match(expr, 'foo.js', hasSibling), '**/*.js');
            assert.strictEqual(glob.match(expr, 'bar.js', hasSibling), null);
        });
        test('expression with multipe basename globs', function () {
            const expr = {
                '**/bar': true,
                '{**/baz,**/foo}': true
            };
            assert.strictEqual(glob.match(expr, 'bar'), '**/bar');
            assert.strictEqual(glob.match(expr, 'foo'), '{**/baz,**/foo}');
            assert.strictEqual(glob.match(expr, 'baz'), '{**/baz,**/foo}');
            assert.strictEqual(glob.match(expr, 'abc'), null);
        });
        test('falsy expression/pattern', function () {
            assert.strictEqual(glob.match(null, 'foo'), false);
            assert.strictEqual(glob.match('', 'foo'), false);
            assert.strictEqual(glob.parse(null)('foo'), false);
            assert.strictEqual(glob.parse('')('foo'), false);
        });
        test('falsy path', function () {
            assert.strictEqual(glob.parse('foo')(null), false);
            assert.strictEqual(glob.parse('foo')(''), false);
            assert.strictEqual(glob.parse('**/*.j?')(null), false);
            assert.strictEqual(glob.parse('**/*.j?')(''), false);
            assert.strictEqual(glob.parse('**/*.foo')(null), false);
            assert.strictEqual(glob.parse('**/*.foo')(''), false);
            assert.strictEqual(glob.parse('**/foo')(null), false);
            assert.strictEqual(glob.parse('**/foo')(''), false);
            assert.strictEqual(glob.parse('{**/baz,**/foo}')(null), false);
            assert.strictEqual(glob.parse('{**/baz,**/foo}')(''), false);
            assert.strictEqual(glob.parse('{**/*.baz,**/*.foo}')(null), false);
            assert.strictEqual(glob.parse('{**/*.baz,**/*.foo}')(''), false);
        });
        test('expression/pattern basename', function () {
            assert.strictEqual(glob.parse('**/foo')('bar/baz', 'baz'), false);
            assert.strictEqual(glob.parse('**/foo')('bar/foo', 'foo'), true);
            assert.strictEqual(glob.parse('{**/baz,**/foo}')('baz/bar', 'bar'), false);
            assert.strictEqual(glob.parse('{**/baz,**/foo}')('baz/foo', 'foo'), true);
            const expr = { '**/*.js': { when: '$(basename).ts' } };
            const siblings = ['foo.ts', 'foo.js'];
            const hasSibling = (name) => siblings.indexOf(name) !== -1;
            assert.strictEqual(glob.parse(expr)('bar/baz.js', 'baz.js', hasSibling), null);
            assert.strictEqual(glob.parse(expr)('bar/foo.js', 'foo.js', hasSibling), '**/*.js');
        });
        test('expression/pattern basename terms', function () {
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('**/*.foo')), []);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('**/foo')), ['foo']);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('**/foo/')), ['foo']);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('{**/baz,**/foo}')), ['baz', 'foo']);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('{**/baz/,**/foo/}')), ['baz', 'foo']);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse({
                '**/foo': true,
                '{**/bar,**/baz}': true,
                '{**/bar2/,**/baz2/}': true,
                '**/bulb': false
            })), ['foo', 'bar', 'baz', 'bar2', 'baz2']);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse({
                '**/foo': { when: '$(basename).zip' },
                '**/bar': true
            })), ['bar']);
        });
        test('expression/pattern optimization for basenames', function () {
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('**/foo/**')), []);
            assert.deepStrictEqual(glob.getBasenameTerms(glob.parse('**/foo/**', { trimForExclusions: true })), ['foo']);
            testOptimizationForBasenames('**/*.foo/**', [], [['baz/bar.foo/bar/baz', true]]);
            testOptimizationForBasenames('**/foo/**', ['foo'], [['bar/foo', true], ['bar/foo/baz', false]]);
            testOptimizationForBasenames('{**/baz/**,**/foo/**}', ['baz', 'foo'], [['bar/baz', true], ['bar/foo', true]]);
            testOptimizationForBasenames({
                '**/foo/**': true,
                '{**/bar/**,**/baz/**}': true,
                '**/bulb/**': false
            }, ['foo', 'bar', 'baz'], [
                ['bar/foo', '**/foo/**'],
                ['foo/bar', '{**/bar/**,**/baz/**}'],
                ['bar/nope', null]
            ]);
            const siblings = ['baz', 'baz.zip', 'nope'];
            const hasSibling = (name) => siblings.indexOf(name) !== -1;
            testOptimizationForBasenames({
                '**/foo/**': { when: '$(basename).zip' },
                '**/bar/**': true
            }, ['bar'], [
                ['bar/foo', null],
                ['bar/foo/baz', null],
                ['bar/foo/nope', null],
                ['foo/bar', '**/bar/**'],
            ], [
                null,
                hasSibling,
                hasSibling
            ]);
        });
        function testOptimizationForBasenames(pattern, basenameTerms, matches, siblingsFns = []) {
            const parsed = glob.parse(pattern, { trimForExclusions: true });
            assert.deepStrictEqual(glob.getBasenameTerms(parsed), basenameTerms);
            matches.forEach(([text, result], i) => {
                assert.strictEqual(parsed(text, null, siblingsFns[i]), result);
            });
        }
        test('trailing slash', function () {
            // Testing existing (more or less intuitive) behavior
            assert.strictEqual(glob.parse('**/foo/')('bar/baz', 'baz'), false);
            assert.strictEqual(glob.parse('**/foo/')('bar/foo', 'foo'), true);
            assert.strictEqual(glob.parse('**/*.foo/')('bar/file.baz', 'file.baz'), false);
            assert.strictEqual(glob.parse('**/*.foo/')('bar/file.foo', 'file.foo'), true);
            assert.strictEqual(glob.parse('{**/foo/,**/abc/}')('bar/baz', 'baz'), false);
            assert.strictEqual(glob.parse('{**/foo/,**/abc/}')('bar/foo', 'foo'), true);
            assert.strictEqual(glob.parse('{**/foo/,**/abc/}')('bar/abc', 'abc'), true);
            assert.strictEqual(glob.parse('{**/foo/,**/abc/}', { trimForExclusions: true })('bar/baz', 'baz'), false);
            assert.strictEqual(glob.parse('{**/foo/,**/abc/}', { trimForExclusions: true })('bar/foo', 'foo'), true);
            assert.strictEqual(glob.parse('{**/foo/,**/abc/}', { trimForExclusions: true })('bar/abc', 'abc'), true);
        });
        test('expression/pattern path', function () {
            assert.strictEqual(glob.parse('**/foo/bar')(nativeSep('foo/baz'), 'baz'), false);
            assert.strictEqual(glob.parse('**/foo/bar')(nativeSep('foo/bar'), 'bar'), true);
            assert.strictEqual(glob.parse('**/foo/bar')(nativeSep('bar/foo/bar'), 'bar'), true);
            assert.strictEqual(glob.parse('**/foo/bar/**')(nativeSep('bar/foo/bar'), 'bar'), true);
            assert.strictEqual(glob.parse('**/foo/bar/**')(nativeSep('bar/foo/bar/baz'), 'baz'), true);
            assert.strictEqual(glob.parse('**/foo/bar/**', { trimForExclusions: true })(nativeSep('bar/foo/bar'), 'bar'), true);
            assert.strictEqual(glob.parse('**/foo/bar/**', { trimForExclusions: true })(nativeSep('bar/foo/bar/baz'), 'baz'), false);
            assert.strictEqual(glob.parse('foo/bar')(nativeSep('foo/baz'), 'baz'), false);
            assert.strictEqual(glob.parse('foo/bar')(nativeSep('foo/bar'), 'bar'), true);
            assert.strictEqual(glob.parse('foo/bar/baz')(nativeSep('foo/bar/baz'), 'baz'), true); // #15424
            assert.strictEqual(glob.parse('foo/bar')(nativeSep('bar/foo/bar'), 'bar'), false);
            assert.strictEqual(glob.parse('foo/bar/**')(nativeSep('foo/bar/baz'), 'baz'), true);
            assert.strictEqual(glob.parse('foo/bar/**', { trimForExclusions: true })(nativeSep('foo/bar'), 'bar'), true);
            assert.strictEqual(glob.parse('foo/bar/**', { trimForExclusions: true })(nativeSep('foo/bar/baz'), 'baz'), false);
        });
        test('expression/pattern paths', function () {
            assert.deepStrictEqual(glob.getPathTerms(glob.parse('**/*.foo')), []);
            assert.deepStrictEqual(glob.getPathTerms(glob.parse('**/foo')), []);
            assert.deepStrictEqual(glob.getPathTerms(glob.parse('**/foo/bar')), ['*/foo/bar']);
            assert.deepStrictEqual(glob.getPathTerms(glob.parse('**/foo/bar/')), ['*/foo/bar']);
            // Not supported
            // assert.deepStrictEqual(glob.getPathTerms(glob.parse('{**/baz/bar,**/foo/bar,**/bar}')), ['*/baz/bar', '*/foo/bar']);
            // assert.deepStrictEqual(glob.getPathTerms(glob.parse('{**/baz/bar/,**/foo/bar/,**/bar/}')), ['*/baz/bar', '*/foo/bar']);
            const parsed = glob.parse({
                '**/foo/bar': true,
                '**/foo2/bar2': true,
                // Not supported
                // '{**/bar/foo,**/baz/foo}': true,
                // '{**/bar2/foo/,**/baz2/foo/}': true,
                '**/bulb': true,
                '**/bulb2': true,
                '**/bulb/foo': false
            });
            assert.deepStrictEqual(glob.getPathTerms(parsed), ['*/foo/bar', '*/foo2/bar2']);
            assert.deepStrictEqual(glob.getBasenameTerms(parsed), ['bulb', 'bulb2']);
            assert.deepStrictEqual(glob.getPathTerms(glob.parse({
                '**/foo/bar': { when: '$(basename).zip' },
                '**/bar/foo': true,
                '**/bar2/foo2': true
            })), ['*/bar/foo', '*/bar2/foo2']);
        });
        test('expression/pattern optimization for paths', function () {
            assert.deepStrictEqual(glob.getPathTerms(glob.parse('**/foo/bar/**')), []);
            assert.deepStrictEqual(glob.getPathTerms(glob.parse('**/foo/bar/**', { trimForExclusions: true })), ['*/foo/bar']);
            testOptimizationForPaths('**/*.foo/bar/**', [], [[nativeSep('baz/bar.foo/bar/baz'), true]]);
            testOptimizationForPaths('**/foo/bar/**', ['*/foo/bar'], [[nativeSep('bar/foo/bar'), true], [nativeSep('bar/foo/bar/baz'), false]]);
            // Not supported
            // testOptimizationForPaths('{**/baz/bar/**,**/foo/bar/**}', ['*/baz/bar', '*/foo/bar'], [[nativeSep('bar/baz/bar'), true], [nativeSep('bar/foo/bar'), true]]);
            testOptimizationForPaths({
                '**/foo/bar/**': true,
                // Not supported
                // '{**/bar/bar/**,**/baz/bar/**}': true,
                '**/bulb/bar/**': false
            }, ['*/foo/bar'], [
                [nativeSep('bar/foo/bar'), '**/foo/bar/**'],
                // Not supported
                // [nativeSep('foo/bar/bar'), '{**/bar/bar/**,**/baz/bar/**}'],
                [nativeSep('/foo/bar/nope'), null]
            ]);
            const siblings = ['baz', 'baz.zip', 'nope'];
            const hasSibling = (name) => siblings.indexOf(name) !== -1;
            testOptimizationForPaths({
                '**/foo/123/**': { when: '$(basename).zip' },
                '**/bar/123/**': true
            }, ['*/bar/123'], [
                [nativeSep('bar/foo/123'), null],
                [nativeSep('bar/foo/123/baz'), null],
                [nativeSep('bar/foo/123/nope'), null],
                [nativeSep('foo/bar/123'), '**/bar/123/**'],
            ], [
                null,
                hasSibling,
                hasSibling
            ]);
        });
        function testOptimizationForPaths(pattern, pathTerms, matches, siblingsFns = []) {
            const parsed = glob.parse(pattern, { trimForExclusions: true });
            assert.deepStrictEqual(glob.getPathTerms(parsed), pathTerms);
            matches.forEach(([text, result], i) => {
                assert.strictEqual(parsed(text, null, siblingsFns[i]), result);
            });
        }
        function nativeSep(slashPath) {
            return slashPath.replace(/\//g, path_1.sep);
        }
        test('relative pattern - glob star', function () {
            if (platform_1.isWindows) {
                const p = { base: 'C:\\DNXConsoleApp\\foo', pattern: '**/*.cs' };
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.cs');
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\bar\\Program.cs');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.ts');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\Program.cs');
                assertNoGlobMatch(p, 'C:\\other\\DNXConsoleApp\\foo\\Program.ts');
            }
            else {
                const p = { base: '/DNXConsoleApp/foo', pattern: '**/*.cs' };
                assertGlobMatch(p, '/DNXConsoleApp/foo/Program.cs');
                assertGlobMatch(p, '/DNXConsoleApp/foo/bar/Program.cs');
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/Program.ts');
                assertNoGlobMatch(p, '/DNXConsoleApp/Program.cs');
                assertNoGlobMatch(p, '/other/DNXConsoleApp/foo/Program.ts');
            }
        });
        test('relative pattern - single star', function () {
            if (platform_1.isWindows) {
                const p = { base: 'C:\\DNXConsoleApp\\foo', pattern: '*.cs' };
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.cs');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\bar\\Program.cs');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.ts');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\Program.cs');
                assertNoGlobMatch(p, 'C:\\other\\DNXConsoleApp\\foo\\Program.ts');
            }
            else {
                const p = { base: '/DNXConsoleApp/foo', pattern: '*.cs' };
                assertGlobMatch(p, '/DNXConsoleApp/foo/Program.cs');
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/bar/Program.cs');
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/Program.ts');
                assertNoGlobMatch(p, '/DNXConsoleApp/Program.cs');
                assertNoGlobMatch(p, '/other/DNXConsoleApp/foo/Program.ts');
            }
        });
        test('relative pattern - single star with path', function () {
            if (platform_1.isWindows) {
                const p = { base: 'C:\\DNXConsoleApp\\foo', pattern: 'something/*.cs' };
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\something\\Program.cs');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.cs');
            }
            else {
                const p = { base: '/DNXConsoleApp/foo', pattern: 'something/*.cs' };
                assertGlobMatch(p, '/DNXConsoleApp/foo/something/Program.cs');
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/Program.cs');
            }
        });
        test('relative pattern - single star alone', function () {
            if (platform_1.isWindows) {
                const p = { base: 'C:\\DNXConsoleApp\\foo\\something\\Program.cs', pattern: '*' };
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\something\\Program.cs');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.cs');
            }
            else {
                const p = { base: '/DNXConsoleApp/foo/something/Program.cs', pattern: '*' };
                assertGlobMatch(p, '/DNXConsoleApp/foo/something/Program.cs');
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/Program.cs');
            }
        });
        test('relative pattern - ignores case on macOS/Windows', function () {
            if (platform_1.isWindows) {
                const p = { base: 'C:\\DNXConsoleApp\\foo', pattern: 'something/*.cs' };
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\something\\Program.cs'.toLowerCase());
            }
            else if (platform_1.isMacintosh) {
                const p = { base: '/DNXConsoleApp/foo', pattern: 'something/*.cs' };
                assertGlobMatch(p, '/DNXConsoleApp/foo/something/Program.cs'.toLowerCase());
            }
            else if (platform_1.isLinux) {
                const p = { base: '/DNXConsoleApp/foo', pattern: 'something/*.cs' };
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/something/Program.cs'.toLowerCase());
            }
        });
        test('relative pattern - trailing slash / backslash (#162498)', function () {
            if (platform_1.isWindows) {
                let p = { base: 'C:\\', pattern: 'foo.cs' };
                assertGlobMatch(p, 'C:\\foo.cs');
                p = { base: 'C:\\bar\\', pattern: 'foo.cs' };
                assertGlobMatch(p, 'C:\\bar\\foo.cs');
            }
            else {
                let p = { base: '/', pattern: 'foo.cs' };
                assertGlobMatch(p, '/foo.cs');
                p = { base: '/bar/', pattern: 'foo.cs' };
                assertGlobMatch(p, '/bar/foo.cs');
            }
        });
        test('pattern with "base" does not explode - #36081', function () {
            assert.ok(glob.match({ 'base': true }, 'base'));
        });
        test('relative pattern - #57475', function () {
            if (platform_1.isWindows) {
                const p = { base: 'C:\\DNXConsoleApp\\foo', pattern: 'styles/style.css' };
                assertGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\styles\\style.css');
                assertNoGlobMatch(p, 'C:\\DNXConsoleApp\\foo\\Program.cs');
            }
            else {
                const p = { base: '/DNXConsoleApp/foo', pattern: 'styles/style.css' };
                assertGlobMatch(p, '/DNXConsoleApp/foo/styles/style.css');
                assertNoGlobMatch(p, '/DNXConsoleApp/foo/Program.cs');
            }
        });
        test('URI match', () => {
            const p = 'scheme:/**/*.md';
            assertGlobMatch(p, uri_1.URI.file('super/duper/long/some/file.md').with({ scheme: 'scheme' }).toString());
        });
        test('expression fails when siblings use promises (https://github.com/microsoft/vscode/issues/146294)', async function () {
            const siblings = ['test.html', 'test.txt', 'test.ts'];
            const hasSibling = (name) => Promise.resolve(siblings.indexOf(name) !== -1);
            // { "**/*.js": { "when": "$(basename).ts" } }
            const expression = {
                '**/test.js': { when: '$(basename).js' },
                '**/*.js': { when: '$(basename).ts' }
            };
            const parsedExpression = glob.parse(expression);
            assert.strictEqual('**/*.js', await parsedExpression('test.js', undefined, hasSibling));
        });
        test('patternsEquals', () => {
            assert.ok(glob.patternsEquals(['a'], ['a']));
            assert.ok(!glob.patternsEquals(['a'], ['b']));
            assert.ok(glob.patternsEquals(['a', 'b', 'c'], ['a', 'b', 'c']));
            assert.ok(!glob.patternsEquals(['1', '2'], ['1', '3']));
            assert.ok(glob.patternsEquals([{ base: 'a', pattern: '*' }, 'b', 'c'], [{ base: 'a', pattern: '*' }, 'b', 'c']));
            assert.ok(glob.patternsEquals(undefined, undefined));
            assert.ok(!glob.patternsEquals(undefined, ['b']));
            assert.ok(!glob.patternsEquals(['a'], undefined));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9nbG9iLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFFbEIsdUJBQXVCO1FBRXZCLG9CQUFvQjtRQUNwQixnREFBZ0Q7UUFDaEQsc0NBQXNDO1FBQ3RDLHNFQUFzRTtRQUN0RSxlQUFlO1FBQ2YsMEJBQTBCO1FBQzFCLGdDQUFnQztRQUNoQyxvREFBb0Q7UUFDcEQscURBQXFEO1FBQ3JELDBCQUEwQjtRQUMxQixrQkFBa0I7UUFDbEIsa0JBQWtCO1FBQ2xCLGtCQUFrQjtRQUNsQixrQkFBa0I7UUFDbEIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQixpQkFBaUI7UUFDakIsNEJBQTRCO1FBQzVCLGlDQUFpQztRQUNqQyxpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLGdCQUFnQjtRQUNoQixNQUFNO1FBRU4saUJBQWlCO1FBQ2pCLGlDQUFpQztRQUNqQywwQ0FBMEM7UUFDMUMsa0JBQWtCO1FBQ2xCLHFCQUFxQjtRQUNyQix5QkFBeUI7UUFDekIsbUJBQW1CO1FBQ25CLCtCQUErQjtRQUMvQixNQUFNO1FBRU4sb0JBQW9CO1FBQ3BCLGlCQUFpQjtRQUNqQixrQ0FBa0M7UUFDbEMscUJBQXFCO1FBQ3JCLDhCQUE4QjtRQUM5QixxQ0FBcUM7UUFDckMseUNBQXlDO1FBQ3pDLGVBQWU7UUFDZixzQkFBc0I7UUFDdEIsUUFBUTtRQUNSLE9BQU87UUFDUCxNQUFNO1FBQ04sS0FBSztRQUNMLHlCQUF5QjtRQUN6QixNQUFNO1FBRU4sU0FBUyxlQUFlLENBQUMsT0FBdUMsRUFBRSxLQUFhO1lBQzlFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxD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QUFLLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxD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Q0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxJQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRTtZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xF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