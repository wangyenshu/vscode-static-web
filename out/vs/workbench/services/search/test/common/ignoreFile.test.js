/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/search/common/ignoreFile"], function (require, exports, assert, utils_1, ignoreFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function runAssert(input, ignoreFile, ignoreFileLocation, shouldMatch, traverse) {
        return (prefix) => {
            const isDir = input.endsWith('/');
            const rawInput = isDir ? input.slice(0, input.length - 1) : input;
            const matcher = new ignoreFile_1.IgnoreFile(ignoreFile, prefix + ignoreFileLocation);
            if (traverse) {
                const traverses = matcher.isPathIncludedInTraversal(prefix + rawInput, isDir);
                if (shouldMatch) {
                    assert(traverses, `${ignoreFileLocation}: ${ignoreFile} should traverse ${isDir ? 'dir' : 'file'} ${prefix}${rawInput}`);
                }
                else {
                    assert(!traverses, `${ignoreFileLocation}: ${ignoreFile} should not traverse ${isDir ? 'dir' : 'file'} ${prefix}${rawInput}`);
                }
            }
            else {
                const ignores = matcher.isArbitraryPathIgnored(prefix + rawInput, isDir);
                if (shouldMatch) {
                    assert(ignores, `${ignoreFileLocation}: ${ignoreFile} should ignore ${isDir ? 'dir' : 'file'} ${prefix}${rawInput}`);
                }
                else {
                    assert(!ignores, `${ignoreFileLocation}: ${ignoreFile} should not ignore ${isDir ? 'dir' : 'file'} ${prefix}${rawInput}`);
                }
            }
        };
    }
    function assertNoTraverses(ignoreFile, ignoreFileLocation, input) {
        const runWithPrefix = runAssert(input, ignoreFile, ignoreFileLocation, false, true);
        runWithPrefix('');
        runWithPrefix('/someFolder');
    }
    function assertTraverses(ignoreFile, ignoreFileLocation, input) {
        const runWithPrefix = runAssert(input, ignoreFile, ignoreFileLocation, true, true);
        runWithPrefix('');
        runWithPrefix('/someFolder');
    }
    function assertIgnoreMatch(ignoreFile, ignoreFileLocation, input) {
        const runWithPrefix = runAssert(input, ignoreFile, ignoreFileLocation, true, false);
        runWithPrefix('');
        runWithPrefix('/someFolder');
    }
    function assertNoIgnoreMatch(ignoreFile, ignoreFileLocation, input) {
        const runWithPrefix = runAssert(input, ignoreFile, ignoreFileLocation, false, false);
        runWithPrefix('');
        runWithPrefix('/someFolder');
    }
    suite('Parsing .gitignore files', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('paths with trailing slashes do not match files', () => {
            const i = 'node_modules/\n';
            assertNoIgnoreMatch(i, '/', '/node_modules');
            assertIgnoreMatch(i, '/', '/node_modules/');
            assertNoIgnoreMatch(i, '/', '/inner/node_modules');
            assertIgnoreMatch(i, '/', '/inner/node_modules/');
        });
        test('parsing simple gitignore files', () => {
            let i = 'node_modules\nout\n';
            assertIgnoreMatch(i, '/', '/node_modules');
            assertNoTraverses(i, '/', '/node_modules');
            assertIgnoreMatch(i, '/', '/node_modules/file');
            assertIgnoreMatch(i, '/', '/dir/node_modules');
            assertIgnoreMatch(i, '/', '/dir/node_modules/file');
            assertIgnoreMatch(i, '/', '/out');
            assertNoTraverses(i, '/', '/out');
            assertIgnoreMatch(i, '/', '/out/file');
            assertIgnoreMatch(i, '/', '/dir/out');
            assertIgnoreMatch(i, '/', '/dir/out/file');
            i = '/node_modules\n/out\n';
            assertIgnoreMatch(i, '/', '/node_modules');
            assertIgnoreMatch(i, '/', '/node_modules/file');
            assertNoIgnoreMatch(i, '/', '/dir/node_modules');
            assertNoIgnoreMatch(i, '/', '/dir/node_modules/file');
            assertIgnoreMatch(i, '/', '/out');
            assertIgnoreMatch(i, '/', '/out/file');
            assertNoIgnoreMatch(i, '/', '/dir/out');
            assertNoIgnoreMatch(i, '/', '/dir/out/file');
            i = 'node_modules/\nout/\n';
            assertNoIgnoreMatch(i, '/', '/node_modules');
            assertIgnoreMatch(i, '/', '/node_modules/');
            assertIgnoreMatch(i, '/', '/node_modules/file');
            assertIgnoreMatch(i, '/', '/dir/node_modules/');
            assertNoIgnoreMatch(i, '/', '/dir/node_modules');
            assertIgnoreMatch(i, '/', '/dir/node_modules/file');
            assertIgnoreMatch(i, '/', '/out/');
            assertNoIgnoreMatch(i, '/', '/out');
            assertIgnoreMatch(i, '/', '/out/file');
            assertNoIgnoreMatch(i, '/', '/dir/out');
            assertIgnoreMatch(i, '/', '/dir/out/');
            assertIgnoreMatch(i, '/', '/dir/out/file');
        });
        test('parsing files-in-folder exclude', () => {
            let i = 'node_modules/*\n';
            assertNoIgnoreMatch(i, '/', '/node_modules');
            assertNoIgnoreMatch(i, '/', '/node_modules/');
            assertTraverses(i, '/', '/node_modules');
            assertTraverses(i, '/', '/node_modules/');
            assertIgnoreMatch(i, '/', '/node_modules/something');
            assertNoTraverses(i, '/', '/node_modules/something');
            assertIgnoreMatch(i, '/', '/node_modules/something/else');
            assertIgnoreMatch(i, '/', '/node_modules/@types');
            assertNoTraverses(i, '/', '/node_modules/@types');
            i = 'node_modules/**/*\n';
            assertNoIgnoreMatch(i, '/', '/node_modules');
            assertNoIgnoreMatch(i, '/', '/node_modules/');
            assertIgnoreMatch(i, '/', '/node_modules/something');
            assertIgnoreMatch(i, '/', '/node_modules/something/else');
            assertIgnoreMatch(i, '/', '/node_modules/@types');
        });
        test('parsing simple negations', () => {
            let i = 'node_modules/*\n!node_modules/@types\n';
            assertNoIgnoreMatch(i, '/', '/node_modules');
            assertTraverses(i, '/', '/node_modules');
            assertIgnoreMatch(i, '/', '/node_modules/something');
            assertNoTraverses(i, '/', '/node_modules/something');
            assertIgnoreMatch(i, '/', '/node_modules/something/else');
            assertNoIgnoreMatch(i, '/', '/node_modules/@types');
            assertTraverses(i, '/', '/node_modules/@types');
            assertTraverses(i, '/', '/node_modules/@types/boop');
            i = '*.log\n!important.log\n';
            assertIgnoreMatch(i, '/', '/test.log');
            assertIgnoreMatch(i, '/', '/inner/test.log');
            assertNoIgnoreMatch(i, '/', '/important.log');
            assertNoIgnoreMatch(i, '/', '/inner/important.log');
            assertNoTraverses(i, '/', '/test.log');
            assertNoTraverses(i, '/', '/inner/test.log');
            assertTraverses(i, '/', '/important.log');
            assertTraverses(i, '/', '/inner/important.log');
        });
        test('nested .gitignores', () => {
            let i = 'node_modules\nout\n';
            assertIgnoreMatch(i, '/inner/', '/inner/node_modules');
            assertIgnoreMatch(i, '/inner/', '/inner/more/node_modules');
            i = '/node_modules\n/out\n';
            assertIgnoreMatch(i, '/inner/', '/inner/node_modules');
            assertNoIgnoreMatch(i, '/inner/', '/inner/more/node_modules');
            assertNoIgnoreMatch(i, '/inner/', '/node_modules');
            i = 'node_modules/\nout/\n';
            assertNoIgnoreMatch(i, '/inner/', '/inner/node_modules');
            assertIgnoreMatch(i, '/inner/', '/inner/node_modules/');
            assertNoIgnoreMatch(i, '/inner/', '/inner/more/node_modules');
            assertIgnoreMatch(i, '/inner/', '/inner/more/node_modules/');
            assertNoIgnoreMatch(i, '/inner/', '/node_modules');
        });
        test('file extension matches', () => {
            let i = '*.js\n';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/myFile.js');
            i = '/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.js');
            i = '**/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/more/myFile.js');
            i = 'inner/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.js');
            i = '/inner/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.js');
            i = '**/inner/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.js');
            i = '**/inner/**/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/more/myFile.js');
            i = '**/more/*.js';
            assertNoIgnoreMatch(i, '/', '/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.ts');
            assertNoIgnoreMatch(i, '/', '/inner/myFile.js');
            assertNoIgnoreMatch(i, '/', '/inner/more/myFile.ts');
            assertIgnoreMatch(i, '/', '/inner/more/myFile.js');
        });
        test('real world example: vscode-js-debug', () => {
            const i = `.cache/
			.profile/
			.cdp-profile/
			.headless-profile/
			.vscode-test/
			.DS_Store
			node_modules/
			out/
			dist
			/coverage
			/.nyc_output
			demos/web-worker/vscode-pwa-dap.log
			demos/web-worker/vscode-pwa-cdp.log
			.dynamic-testWorkspace
			**/test/**/*.actual
			/testWorkspace/web/tmp
			/testWorkspace/**/debug.log
			/testWorkspace/webview/win/true/
			*.cpuprofile`;
            const included = [
                '/distro',
                '/inner/coverage',
                '/inner/.nyc_output',
                '/inner/demos/web-worker/vscode-pwa-dap.log',
                '/inner/demos/web-worker/vscode-pwa-cdp.log',
                '/testWorkspace/webview/win/true',
                '/a/best/b/c.actual',
                '/best/b/c.actual',
            ];
            const excluded = [
                '/.profile/',
                '/inner/.profile/',
                '/.DS_Store',
                '/inner/.DS_Store',
                '/coverage',
                '/.nyc_output',
                '/demos/web-worker/vscode-pwa-dap.log',
                '/demos/web-worker/vscode-pwa-cdp.log',
                '/.dynamic-testWorkspace',
                '/inner/.dynamic-testWorkspace',
                '/test/.actual',
                '/test/hello.actual',
                '/a/test/.actual',
                '/a/test/b.actual',
                '/a/test/b/.actual',
                '/a/test/b/c.actual',
                '/a/b/test/.actual',
                '/a/b/test/f/c.actual',
                '/testWorkspace/web/tmp',
                '/testWorkspace/debug.log',
                '/testWorkspace/a/debug.log',
                '/testWorkspace/a/b/debug.log',
                '/testWorkspace/webview/win/true/',
                '/.cpuprofile',
                '/a.cpuprofile',
                '/aa/a.cpuprofile',
                '/aaa/aa/a.cpuprofile',
            ];
            for (const include of included) {
                assertNoIgnoreMatch(i, '/', include);
            }
            for (const exclude of excluded) {
                assertIgnoreMatch(i, '/', exclude);
            }
        });
        test('real world example: vscode', () => {
            const i = `.DS_Store
			.cache
			npm-debug.log
			Thumbs.db
			node_modules/
			.build/
			extensions/**/dist/
			/out*/
			/extensions/**/out/
			src/vs/server
			resources/server
			build/node_modules
			coverage/
			test_data/
			test-results/
			yarn-error.log
			vscode.lsif
			vscode.db
			/.profile-oss`;
            const included = [
                '/inner/extensions/dist',
                '/inner/extensions/boop/dist/test',
                '/inner/extensions/boop/doop/dist',
                '/inner/extensions/boop/doop/dist/test',
                '/inner/extensions/boop/doop/dist/test',
                '/inner/extensions/out/test',
                '/inner/extensions/boop/out',
                '/inner/extensions/boop/out/test',
                '/inner/out/',
                '/inner/out/test',
                '/inner/out1/',
                '/inner/out1/test',
                '/inner/out2/',
                '/inner/out2/test',
                '/inner/.profile-oss',
                // Files.
                '/extensions/dist',
                '/extensions/boop/doop/dist',
                '/extensions/boop/out',
            ];
            const excluded = [
                '/extensions/dist/',
                '/extensions/boop/dist/test',
                '/extensions/boop/doop/dist/',
                '/extensions/boop/doop/dist/test',
                '/extensions/boop/doop/dist/test',
                '/extensions/out/test',
                '/extensions/boop/out/',
                '/extensions/boop/out/test',
                '/out/',
                '/out/test',
                '/out1/',
                '/out1/test',
                '/out2/',
                '/out2/test',
                '/.profile-oss',
            ];
            for (const include of included) {
                assertNoIgnoreMatch(i, '/', include);
            }
            for (const exclude of excluded) {
                assertIgnoreMatch(i, '/', exclude);
            }
        });
        test('various advanced constructs found in popular repos', () => {
            const runTest = ({ pattern, included, excluded }) => {
                for (const include of included) {
                    assertNoIgnoreMatch(pattern, '/', include);
                }
                for (const exclude of excluded) {
                    assertIgnoreMatch(pattern, '/', exclude);
                }
            };
            runTest({
                pattern: `**/node_modules
			/packages/*/dist`,
                excluded: [
                    '/node_modules',
                    '/test/node_modules',
                    '/node_modules/test',
                    '/test/node_modules/test',
                    '/packages/a/dist',
                    '/packages/abc/dist',
                    '/packages/abc/dist/test',
                ],
                included: [
                    '/inner/packages/a/dist',
                    '/inner/packages/abc/dist',
                    '/inner/packages/abc/dist/test',
                    '/packages/dist',
                    '/packages/dist/test',
                    '/packages/a/b/dist',
                    '/packages/a/b/dist/test',
                ],
            });
            runTest({
                pattern: `.yarn/*
			# !.yarn/cache
			!.yarn/patches
			!.yarn/plugins
			!.yarn/releases
			!.yarn/sdks
			!.yarn/versions`,
                excluded: [
                    '/.yarn/test',
                    '/.yarn/cache',
                ],
                included: [
                    '/inner/.yarn/test',
                    '/inner/.yarn/cache',
                    '/.yarn/patches',
                    '/.yarn/plugins',
                    '/.yarn/releases',
                    '/.yarn/sdks',
                    '/.yarn/versions',
                ],
            });
            runTest({
                pattern: `[._]*s[a-w][a-z]
			[._]s[a-w][a-z]
			*.un~
			*~`,
                excluded: [
                    '/~',
                    '/abc~',
                    '/inner/~',
                    '/inner/abc~',
                    '/.un~',
                    '/a.un~',
                    '/test/.un~',
                    '/test/a.un~',
                    '/.saa',
                    '/....saa',
                    '/._._sby',
                    '/inner/._._sby',
                    '/_swz',
                ],
                included: [
                    '/.jaa',
                ],
            });
            // TODO: the rest of these :)
            runTest({
                pattern: `*.pbxuser
			!default.pbxuser
			*.mode1v3
			!default.mode1v3
			*.mode2v3
			!default.mode2v3
			*.perspectivev3
			!default.perspectivev3`,
                excluded: [],
                included: [],
            });
            runTest({
                pattern: `[Dd]ebug/
			[Dd]ebugPublic/
			[Rr]elease/
			[Rr]eleases/
			*.[Mm]etrics.xml
			[Tt]est[Rr]esult*/
			[Bb]uild[Ll]og.*
			bld/
			[Bb]in/
			[Oo]bj/
			[Ll]og/`,
                excluded: [],
                included: [],
            });
            runTest({
                pattern: `Dockerfile*
			!/tests/bud/*/Dockerfile*
			!/tests/conformance/**/Dockerfile*`,
                excluded: [],
                included: [],
            });
            runTest({
                pattern: `*.pdf
			*.html
			!author_bio.html
			!colo.html
			!copyright.html
			!cover.html
			!ix.html
			!titlepage.html
			!toc.html`,
                excluded: [],
                included: [],
            });
            runTest({
                pattern: `/log/*
			/tmp/*
			!/log/.keep
			!/tmp/.keep`,
                excluded: [],
                included: [],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWdub3JlRmlsZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC90ZXN0L2NvbW1vbi9pZ25vcmVGaWxlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsU0FBUyxTQUFTLENBQUMsS0FBYSxFQUFFLFVBQWtCLEVBQUUsa0JBQTBCLEVBQUUsV0FBb0IsRUFBRSxRQUFpQjtRQUN4SCxPQUFPLENBQUMsTUFBYyxFQUFFLEVBQUU7WUFDekIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUVsRSxNQUFNLE9BQU8sR0FBRyxJQUFJLHVCQUFVLENBQUMsVUFBVSxFQUFFLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hFLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLE1BQU0sR0FBRyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTlFLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxrQkFBa0IsS0FBSyxVQUFVLG9CQUFvQixLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLE1BQU0sR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUMxSCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxDQUFDLENBQUMs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