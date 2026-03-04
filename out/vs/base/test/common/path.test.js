/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/test/common/utils"], function (require, exports, assert, path, platform_1, process, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Paths (Node Implementation)', () => {
        const __filename = 'path.test.js';
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('join', () => {
            const failures = [];
            const backslashRE = /\\/g;
            const joinTests = [
                [[path.posix.join, path.win32.join],
                    // arguments                     result
                    [[['.', 'x/b', '..', '/b/c.js'], 'x/b/c.js'],
                        [[], '.'],
                        [['/.', 'x/b', '..', '/b/c.js'], '/x/b/c.js'],
                        [['/foo', '../../../bar'], '/bar'],
                        [['foo', '../../../bar'], '../../bar'],
                        [['foo/', '../../../bar'], '../../bar'],
                        [['foo/x', '../../../bar'], '../bar'],
                        [['foo/x', './bar'], 'foo/x/bar'],
                        [['foo/x/', './bar'], 'foo/x/bar'],
                        [['foo/x/', '.', 'bar'], 'foo/x/bar'],
                        [['./'], './'],
                        [['.', './'], './'],
                        [['.', '.', '.'], '.'],
                        [['.', './', '.'], '.'],
                        [['.', '/./', '.'], '.'],
                        [['.', '/////./', '.'], '.'],
                        [['.'], '.'],
                        [['', '.'], '.'],
                        [['', 'foo'], 'foo'],
                        [['foo', '/bar'], 'foo/bar'],
                        [['', '/foo'], '/foo'],
                        [['', '', '/foo'], '/foo'],
                        [['', '', 'foo'], 'foo'],
                        [['foo', ''], 'foo'],
                        [['foo/', ''], 'foo/'],
                        [['foo', '', '/bar'], 'foo/bar'],
                        [['./', '..', '/foo'], '../foo'],
                        [['./', '..', '..', '/foo'], '../../foo'],
                        [['.', '..', '..', '/foo'], '../../foo'],
                        [['', '..', '..', '/foo'], '../../foo'],
                        [['/'], '/'],
                        [['/', '.'], '/'],
                        [['/', '..'], '/'],
                        [['/', '..', '..'], '/'],
                        [[''], '.'],
                        [['', ''], '.'],
                        [[' /foo'], ' /foo'],
                        [[' ', 'foo'], ' /foo'],
                        [[' ', '.'], ' '],
                        [[' ', '/'], ' /'],
                        [[' ', ''], ' '],
                        [['/', 'foo'], '/foo'],
                        [['/', '/foo'], '/foo'],
                        [['/', '//foo'], '/foo'],
                        [['/', '', '/foo'], '/foo'],
                        [['', '/', 'foo'], '/foo'],
                        [['', '/', '/foo'], '/foo']
                    ]
                ]
            ];
            // Windows-specific join tests
            joinTests.push([
                path.win32.join,
                joinTests[0][1].slice(0).concat([
                    // UNC path expected
                    [['//foo/bar'], '\\\\foo\\bar\\'],
                    [['\\/foo/bar'], '\\\\foo\\bar\\'],
                    [['\\\\foo/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - server and share separate
                    [['//foo', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo', '/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - questionable
                    [['//foo', '', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', '', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', '', '/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - even more questionable
                    [['', '//foo', 'bar'], '\\\\foo\\bar\\'],
                    [['', '//foo/', 'bar'], '\\\\foo\\bar\\'],
                    [['', '//foo/', '/bar'], '\\\\foo\\bar\\'],
                    // No UNC path expected (no double slash in first component)
                    [['\\', 'foo/bar'], '\\foo\\bar'],
                    [['\\', '/foo/bar'], '\\foo\\bar'],
                    [['', '/', '/foo/bar'], '\\foo\\bar'],
                    // No UNC path expected (no non-slashes in first component -
                    // questionable)
                    [['//', 'foo/bar'], '\\foo\\bar'],
                    [['//', '/foo/bar'], '\\foo\\bar'],
                    [['\\\\', '/', '/foo/bar'], '\\foo\\bar'],
                    [['//'], '\\'],
                    // No UNC path expected (share name missing - questionable).
                    [['//foo'], '\\foo'],
                    [['//foo/'], '\\foo\\'],
                    [['//foo', '/'], '\\foo\\'],
                    [['//foo', '', '/'], '\\foo\\'],
                    // No UNC path expected (too many leading slashes - questionable)
                    [['///foo/bar'], '\\foo\\bar'],
                    [['////foo', 'bar'], '\\foo\\bar'],
                    [['\\\\\\/foo/bar'], '\\foo\\bar'],
                    // Drive-relative vs drive-absolute paths. This merely describes the
                    // status quo, rather than being obviously right
                    [['c:'], 'c:.'],
                    [['c:.'], 'c:.'],
                    [['c:', ''], 'c:.'],
                    [['', 'c:'], 'c:.'],
                    [['c:.', '/'], 'c:.\\'],
                    [['c:.', 'file'], 'c:file'],
                    [['c:', '/'], 'c:\\'],
                    [['c:', 'file'], 'c:\\file']
                ])
            ]);
            joinTests.forEach((test) => {
                if (!Array.isArray(test[0])) {
                    test[0] = [test[0]];
                }
                test[0].forEach((join) => {
                    test[1].forEach((test) => {
                        const actual = join.apply(null, test[0]);
                        const expected = test[1];
                        // For non-Windows specific tests with the Windows join(), we need to try
                        // replacing the slashes since the non-Windows specific tests' `expected`
                        // use forward slashes
                        let actualAlt;
                        let os;
                        if (join === path.win32.join) {
                            actualAlt = actual.replace(backslashRE, '/');
                            os = 'win32';
                        }
                        else {
                            os = 'posix';
                        }
                        const message = `path.${os}.join(${test[0].map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                        if (actual !== expected && actualAlt !== expected) {
                            failures.push(`\n${message}`);
                        }
                    });
                });
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
        });
        test('dirname', () => {
            assert.strictEqual(path.posix.dirname('/a/b/'), '/a');
            assert.strictEqual(path.posix.dirname('/a/b'), '/a');
            assert.strictEqual(path.posix.dirname('/a'), '/');
            assert.strictEqual(path.posix.dirname(''), '.');
            assert.strictEqual(path.posix.dirname('/'), '/');
            assert.strictEqual(path.posix.dirname('////'), '/');
            assert.strictEqual(path.posix.dirname('//a'), '//');
            assert.strictEqual(path.posix.dirname('foo'), '.');
            assert.strictEqual(path.win32.dirname('c:\\'), 'c:\\');
            assert.strictEqual(path.win32.dirname('c:\\foo'), 'c:\\');
            assert.strictEqual(path.win32.dirname('c:\\foo\\'), 'c:\\');
            assert.strictEqual(path.win32.dirname('c:\\foo\\bar'), 'c:\\foo');
            assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\'), 'c:\\foo');
            assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\baz'), 'c:\\foo\\bar');
            assert.strictEqual(path.win32.dirname('\\'), '\\');
            assert.strictEqual(path.win32.dirname('\\foo'), '\\');
            assert.strictEqual(path.win32.dirname('\\foo\\'), '\\');
            assert.strictEqual(path.win32.dirname('\\foo\\bar'), '\\foo');
            assert.strictEqual(path.win32.dirname('\\foo\\bar\\'), '\\foo');
            assert.strictEqual(path.win32.dirname('\\foo\\bar\\baz'), '\\foo\\bar');
            assert.strictEqual(path.win32.dirname('c:'), 'c:');
            assert.strictEqual(path.win32.dirname('c:foo'), 'c:');
            assert.strictEqual(path.win32.dirname('c:foo\\'), 'c:');
            assert.strictEqual(path.win32.dirname('c:foo\\bar'), 'c:foo');
            assert.strictEqual(path.win32.dirname('c:foo\\bar\\'), 'c:foo');
            assert.strictEqual(path.win32.dirname('c:foo\\bar\\baz'), 'c:foo\\bar');
            assert.strictEqual(path.win32.dirname('file:stream'), '.');
            assert.strictEqual(path.win32.dirname('dir\\file:stream'), 'dir');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share'), '\\\\unc\\share');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo'), '\\\\unc\\share\\');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\'), '\\\\unc\\share\\');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar'), '\\\\unc\\share\\foo');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\'), '\\\\unc\\share\\foo');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\baz'), '\\\\unc\\share\\foo\\bar');
            assert.strictEqual(path.win32.dirname('/a/b/'), '/a');
            assert.strictEqual(path.win32.dirname('/a/b'), '/a');
            assert.strictEqual(path.win32.dirname('/a'), '/');
            assert.strictEqual(path.win32.dirname(''), '.');
            assert.strictEqual(path.win32.dirname('/'), '/');
            assert.strictEqual(path.win32.dirname('////'), '/');
            assert.strictEqual(path.win32.dirname('foo'), '.');
            // Tests from VSCode
            function assertDirname(p, expected, win = false) {
                const actual = win ? path.win32.dirname(p) : path.posix.dirname(p);
                if (actual !== expected) {
                    assert.fail(`${p}: expected: ${expected}, ours: ${actual}`);
                }
            }
            assertDirname('foo/bar', 'foo');
            assertDirname('foo\\bar', 'foo', true);
            assertDirname('/foo/bar', '/foo');
            assertDirname('\\foo\\bar', '\\foo', true);
            assertDirname('/foo', '/');
            assertDirname('\\foo', '\\', true);
            assertDirname('/', '/');
            assertDirname('\\', '\\', true);
            assertDirname('foo', '.');
            assertDirname('f', '.');
            assertDirname('f/', '.');
            assertDirname('/folder/', '/');
            assertDirname('c:\\some\\file.txt', 'c:\\some', true);
            assertDirname('c:\\some', 'c:\\', true);
            assertDirname('c:\\', 'c:\\', true);
            assertDirname('c:', 'c:', true);
            assertDirname('\\\\server\\share\\some\\path', '\\\\server\\share\\some', true);
            assertDirname('\\\\server\\share\\some', '\\\\server\\share\\', true);
            assertDirname('\\\\server\\share\\', '\\\\server\\share\\', true);
        });
        test('extname', () => {
            const failures = [];
            const slashRE = /\//g;
            [
                [__filename, '.js'],
                ['', ''],
                ['/path/to/file', ''],
                ['/path/to/file.ext', '.ext'],
                ['/path.to/file.ext', '.ext'],
                ['/path.to/file', ''],
                ['/path.to/.file', ''],
                ['/path.to/.file.ext', '.ext'],
                ['/path/to/f.ext', '.ext'],
                ['/path/to/..ext', '.ext'],
                ['/path/to/..', ''],
                ['file', ''],
                ['file.ext', '.ext'],
                ['.file', ''],
                ['.file.ext', '.ext'],
                ['/file', ''],
                ['/file.ext', '.ext'],
                ['/.file', ''],
                ['/.file.ext', '.ext'],
                ['.path/file.ext', '.ext'],
                ['file.ext.ext', '.ext'],
                ['file.', '.'],
                ['.', ''],
                ['./', ''],
                ['.file.ext', '.ext'],
                ['.file', ''],
                ['.file.', '.'],
                ['.file..', '.'],
                ['..', ''],
                ['../', ''],
                ['..file.ext', '.ext'],
                ['..file', '.file'],
                ['..file.', '.'],
                ['..file..', '.'],
                ['...', '.'],
                ['...ext', '.ext'],
                ['....', '.'],
                ['file.ext/', '.ext'],
                ['file.ext//', '.ext'],
                ['file/', ''],
                ['file//', ''],
                ['file./', '.'],
                ['file.//', '.'],
            ].forEach((test) => {
                const expected = test[1];
                [path.posix.extname, path.win32.extname].forEach((extname) => {
                    let input = test[0];
                    let os;
                    if (extname === path.win32.extname) {
                        input = input.replace(slashRE, '\\');
                        os = 'win32';
                    }
                    else {
                        os = 'posix';
                    }
                    const actual = extname(input);
                    const message = `path.${os}.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected) {
                        failures.push(`\n${message}`);
                    }
                });
                {
                    const input = `C:${test[0].replace(slashRE, '\\')}`;
                    const actual = path.win32.extname(input);
                    const message = `path.win32.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected) {
                        failures.push(`\n${message}`);
                    }
                }
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
            // On Windows, backslash is a path separator.
            assert.strictEqual(path.win32.extname('.\\'), '');
            assert.strictEqual(path.win32.extname('..\\'), '');
            assert.strictEqual(path.win32.extname('file.ext\\'), '.ext');
            assert.strictEqual(path.win32.extname('file.ext\\\\'), '.ext');
            assert.strictEqual(path.win32.extname('file\\'), '');
            assert.strictEqual(path.win32.extname('file\\\\'), '');
            assert.strictEqual(path.win32.extname('file.\\'), '.');
            assert.strictEqual(path.win32.extname('file.\\\\'), '.');
            // On *nix, backslash is a valid name component like any other character.
            assert.strictEqual(path.posix.extname('.\\'), '');
            assert.strictEqual(path.posix.extname('..\\'), '.\\');
            assert.strictEqual(path.posix.extname('file.ext\\'), '.ext\\');
            assert.strictEqual(path.posix.extname('file.ext\\\\'), '.ext\\\\');
            assert.strictEqual(path.posix.extname('file\\'), '');
            assert.strictEqual(path.posix.extname('file\\\\'), '');
            assert.strictEqual(path.posix.extname('file.\\'), '.\\');
            assert.strictEqual(path.posix.extname('file.\\\\'), '.\\\\');
            // Tests from VSCode
            assert.strictEqual(path.extname('far.boo'), '.boo');
            assert.strictEqual(path.extname('far.b'), '.b');
            assert.strictEqual(path.extname('far.'), '.');
            assert.strictEqual(path.extname('far.boo/boo.far'), '.far');
            assert.strictEqual(path.extname('far.boo/boo'), '');
        });
        test('resolve', () => {
            const failures = [];
            const slashRE = /\//g;
            const backslashRE = /\\/g;
            const resolveTests = [
                [path.win32.resolve,
                    // arguments                               result
                    [[['c:/blah\\blah', 'd:/games', 'c:../a'], 'c:\\blah\\a'],
                        [['c:/ignore', 'd:\\a/b\\c/d', '\\e.exe'], 'd:\\e.exe'],
                        [['c:/ignore', 'c:/some/file'], 'c:\\some\\file'],
                        [['d:/ignore', 'd:some/dir//'], 'd:\\ignore\\some\\dir'],
                        [['//server/share', '..', 'relative\\'], '\\\\server\\share\\relative'],
                        [['c:/', '//'], 'c:\\'],
                        [['c:/', '//dir'], 'c:\\dir'],
                        [['c:/', '//server/share'], '\\\\server\\share\\'],
                        [['c:/', '//server//share'], '\\\\server\\share\\'],
                        [['c:/', '///some//dir'], 'c:\\some\\dir'],
                        [['C:\\foo\\tmp.3\\', '..\\tmp.3\\cycles\\root.js'],
                            'C:\\foo\\tmp.3\\cycles\\root.js']
                    ]
                ],
                [path.posix.resolve,
                    // arguments                    result
                    [[['/var/lib', '../', 'file/'], '/var/file'],
                        [['/var/lib', '/../', 'file/'], '/file'],
                        [['/some/dir', '.', '/absolute/'], '/absolute'],
                        [['/foo/tmp.3/', '../tmp.3/cycles/root.js'], '/foo/tmp.3/cycles/root.js']
                    ]
                ],
                [(platform_1.isWeb ? path.posix.resolve : path.resolve),
                    // arguments						result
                    [[['.'], process.cwd()],
                        [['a/b/c', '../../..'], process.cwd()]
                    ]
                ],
            ];
            resolveTests.forEach((test) => {
                const resolve = test[0];
                //@ts-expect-error
                test[1].forEach((test) => {
                    //@ts-expect-error
                    const actual = resolve.apply(null, test[0]);
                    let actualAlt;
                    const os = resolve === path.win32.resolve ? 'win32' : 'posix';
                    if (resolve === path.win32.resolve && !platform_1.isWindows) {
                        actualAlt = actual.replace(backslashRE, '/');
                    }
                    else if (resolve !== path.win32.resolve && platform_1.isWindows) {
                        actualAlt = actual.replace(slashRE, '\\');
                    }
                    const expected = test[1];
                    const message = `path.${os}.resolve(${test[0].map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected && actualAlt !== expected) {
                        failures.push(`\n${message}`);
                    }
                });
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
            // if (isWindows) {
            // 	// Test resolving the current Windows drive letter from a spawned process.
            // 	// See https://github.com/nodejs/node/issues/7215
            // 	const currentDriveLetter = path.parse(process.cwd()).root.substring(0, 2);
            // 	const resolveFixture = fixtures.path('path-resolve.js');
            // 	const spawnResult = child.spawnSync(
            // 		process.argv[0], [resolveFixture, currentDriveLetter]);
            // 	const resolvedPath = spawnResult.stdout.toString().trim();
            // 	assert.strictEqual(resolvedPath.toLowerCase(), process.cwd().toLowerCase());
            // }
        });
        test('basename', () => {
            assert.strictEqual(path.basename(__filename), 'path.test.js');
            assert.strictEqual(path.basename(__filename, '.js'), 'path.test');
            assert.strictEqual(path.basename('.js', '.js'), '');
            assert.strictEqual(path.basename(''), '');
            assert.strictEqual(path.basename('/dir/basename.ext'), 'basename.ext');
            assert.strictEqual(path.basename('/basename.ext'), 'basename.ext');
            assert.strictEqual(path.basename('basename.ext'), 'basename.ext');
            assert.strictEqual(path.basename('basename.ext/'), 'basename.ext');
            assert.strictEqual(path.basename('basename.ext//'), 'basename.ext');
            assert.strictEqual(path.basename('aaa/bbb', '/bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb', 'a/bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb//', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb', 'bb'), 'b');
            assert.strictEqual(path.basename('aaa/bbb', 'b'), 'bb');
            assert.strictEqual(path.basename('/aaa/bbb', '/bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb', 'a/bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb//', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb', 'bb'), 'b');
            assert.strictEqual(path.basename('/aaa/bbb', 'b'), 'bb');
            assert.strictEqual(path.basename('/aaa/bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/'), 'aaa');
            assert.strictEqual(path.basename('/aaa/b'), 'b');
            assert.strictEqual(path.basename('/a/b'), 'b');
            assert.strictEqual(path.basename('//a'), 'a');
            assert.strictEqual(path.basename('a', 'a'), '');
            // On Windows a backslash acts as a path separator.
            assert.strictEqual(path.win32.basename('\\dir\\basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('\\basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('basename.ext\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('basename.ext\\\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('foo'), 'foo');
            assert.strictEqual(path.win32.basename('aaa\\bbb', '\\bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'a\\bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb\\\\\\\\', 'bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'bb'), 'b');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'b'), 'bb');
            assert.strictEqual(path.win32.basename('C:'), '');
            assert.strictEqual(path.win32.basename('C:.'), '.');
            assert.strictEqual(path.win32.basename('C:\\'), '');
            assert.strictEqual(path.win32.basename('C:\\dir\\base.ext'), 'base.ext');
            assert.strictEqual(path.win32.basename('C:\\basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:basename.ext\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:basename.ext\\\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:foo'), 'foo');
            assert.strictEqual(path.win32.basename('file:stream'), 'file:stream');
            assert.strictEqual(path.win32.basename('a', 'a'), '');
            // On unix a backslash is just treated as any other character.
            assert.strictEqual(path.posix.basename('\\dir\\basename.ext'), '\\dir\\basename.ext');
            assert.strictEqual(path.posix.basename('\\basename.ext'), '\\basename.ext');
            assert.strictEqual(path.posix.basename('basename.ext'), 'basename.ext');
            assert.strictEqual(path.posix.basename('basename.ext\\'), 'basename.ext\\');
            assert.strictEqual(path.posix.basename('basename.ext\\\\'), 'basename.ext\\\\');
            assert.strictEqual(path.posix.basename('foo'), 'foo');
            // POSIX filenames may include control characters
            // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
            const controlCharFilename = `Icon${String.fromCharCode(13)}`;
            assert.strictEqual(path.posix.basename(`/a/b/${controlCharFilename}`), controlCharFilename);
            // Tests from VSCode
            assert.strictEqual(path.basename('foo/bar'), 'bar');
            assert.strictEqual(path.posix.basename('foo\\bar'), 'foo\\bar');
            assert.strictEqual(path.win32.basename('foo\\bar'), 'bar');
            assert.strictEqual(path.basename('/foo/bar'), 'bar');
            assert.strictEqual(path.posix.basename('\\foo\\bar'), '\\foo\\bar');
            assert.strictEqual(path.win32.basename('\\foo\\bar'), 'bar');
            assert.strictEqual(path.basename('./bar'), 'bar');
            assert.strictEqual(path.posix.basename('.\\bar'), '.\\bar');
            assert.strictEqual(path.win32.basename('.\\bar'), 'bar');
            assert.strictEqual(path.basename('/bar'), 'bar');
            assert.strictEqual(path.posix.basename('\\bar'), '\\bar');
            assert.strictEqual(path.win32.basename('\\bar'), 'bar');
            assert.strictEqual(path.basename('bar/'), 'bar');
            assert.strictEqual(path.posix.basename('bar\\'), 'bar\\');
            assert.strictEqual(path.win32.basename('bar\\'), 'bar');
            assert.strictEqual(path.basename('bar'), 'bar');
            assert.strictEqual(path.basename('////////'), '');
            assert.strictEqual(path.posix.basename('\\\\\\\\'), '\\\\\\\\');
            assert.strictEqual(path.win32.basename('\\\\\\\\'), '');
        });
        test('relative', () => {
            const failures = [];
            const relativeTests = [
                [path.win32.relative,
                    // arguments                     result
                    [['c:/blah\\blah', 'd:/games', 'd:\\games'],
                        ['c:/aaaa/bbbb', 'c:/aaaa', '..'],
                        ['c:/aaaa/bbbb', 'c:/cccc', '..\\..\\cccc'],
                        ['c:/aaaa/bbbb', 'c:/aaaa/bbbb', ''],
                        ['c:/aaaa/bbbb', 'c:/aaaa/cccc', '..\\cccc'],
                        ['c:/aaaa/', 'c:/aaaa/cccc', 'cccc'],
                        ['c:/', 'c:\\aaaa\\bbbb', 'aaaa\\bbbb'],
                        ['c:/aaaa/bbbb', 'd:\\', 'd:\\'],
                        ['c:/AaAa/bbbb', 'c:/aaaa/bbbb', ''],
                        ['c:/aaaaa/', 'c:/aaaa/cccc', '..\\aaaa\\cccc'],
                        ['C:\\foo\\bar\\baz\\quux', 'C:\\', '..\\..\\..\\..'],
                        ['C:\\foo\\test', 'C:\\foo\\test\\bar\\package.json', 'bar\\package.json'],
                        ['C:\\foo\\bar\\baz-quux', 'C:\\foo\\bar\\baz', '..\\baz'],
                        ['C:\\foo\\bar\\baz', 'C:\\foo\\bar\\baz-quux', '..\\baz-quux'],
                        ['\\\\foo\\bar', '\\\\foo\\bar\\baz', 'baz'],
                        ['\\\\foo\\bar\\baz', '\\\\foo\\bar', '..'],
                        ['\\\\foo\\bar\\baz-quux', '\\\\foo\\bar\\baz', '..\\baz'],
                        ['\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz-quux', '..\\baz-quux'],
                        ['C:\\baz-quux', 'C:\\baz', '..\\baz'],
                        ['C:\\baz', 'C:\\baz-quux', '..\\baz-quux'],
                        ['\\\\foo\\baz-quux', '\\\\foo\\baz', '..\\baz'],
                        ['\\\\foo\\baz', '\\\\foo\\baz-quux', '..\\baz-quux'],
                        ['C:\\baz', '\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz'],
                        ['\\\\foo\\bar\\baz', 'C:\\baz', 'C:\\baz']
                    ]
                ],
                [path.posix.relative,
                    // arguments          result
                    [['/var/lib', '/var', '..'],
                        ['/var/lib', '/bin', '../../bin'],
                        ['/var/lib', '/var/lib', ''],
                        ['/var/lib', '/var/apache', '../apache'],
                        ['/var/', '/var/lib', 'lib'],
                        ['/', '/var/lib', 'var/lib'],
                        ['/foo/test', '/foo/test/bar/package.json', 'bar/package.json'],
                        ['/Users/a/web/b/test/mails', '/Users/a/web/b', '../..'],
                        ['/foo/bar/baz-quux', '/foo/bar/baz', '../baz'],
                        ['/foo/bar/baz', '/foo/bar/baz-quux', '../baz-quux'],
                        ['/baz-quux', '/baz', '../baz'],
                        ['/baz', '/baz-quux', '../baz-quux']
                    ]
                ]
            ];
            relativeTests.forEach((test) => {
                const relative = test[0];
                //@ts-expect-error
                test[1].forEach((test) => {
                    //@ts-expect-error
                    const actual = relative(test[0], test[1]);
                    const expected = test[2];
                    const os = relative === path.win32.relative ? 'win32' : 'posix';
                    const message = `path.${os}.relative(${test.slice(0, 2).map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected) {
                        failures.push(`\n${message}`);
                    }
                });
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
        });
        test('normalize', () => {
            assert.strictEqual(path.win32.normalize('./fixtures///b/../b/c.js'), 'fixtures\\b\\c.js');
            assert.strictEqual(path.win32.normalize('/foo/../../../bar'), '\\bar');
            assert.strictEqual(path.win32.normalize('a//b//../b'), 'a\\b');
            assert.strictEqual(path.win32.normalize('a//b//./c'), 'a\\b\\c');
            assert.strictEqual(path.win32.normalize('a//b//.'), 'a\\b');
            assert.strictEqual(path.win32.normalize('//server/share/dir/file.ext'), '\\\\server\\share\\dir\\file.ext');
            assert.strictEqual(path.win32.normalize('/a/b/c/../../../x/y/z'), '\\x\\y\\z');
            assert.strictEqual(path.win32.normalize('C:'), 'C:.');
            assert.strictEqual(path.win32.normalize('C:..\\abc'), 'C:..\\abc');
            assert.strictEqual(path.win32.normalize('C:..\\..\\abc\\..\\def'), 'C:..\\..\\def');
            assert.strictEqual(path.win32.normalize('C:\\.'), 'C:\\');
            assert.strictEqual(path.win32.normalize('file:stream'), 'file:stream');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\..\\'), 'bar\\');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\..'), 'bar');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\..\\baz'), 'bar\\baz');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\'), 'bar\\foo..\\');
            assert.strictEqual(path.win32.normalize('bar\\foo..'), 'bar\\foo..');
            assert.strictEqual(path.win32.normalize('..\\foo..\\..\\..\\bar'), '..\\..\\bar');
            assert.strictEqual(path.win32.normalize('..\\...\\..\\.\\...\\..\\..\\bar'), '..\\..\\bar');
            assert.strictEqual(path.win32.normalize('../../../foo/../../../bar'), '..\\..\\..\\..\\..\\bar');
            assert.strictEqual(path.win32.normalize('../../../foo/../../../bar/../../'), '..\\..\\..\\..\\..\\..\\');
            assert.strictEqual(path.win32.normalize('../foobar/barfoo/foo/../../../bar/../../'), '..\\..\\');
            assert.strictEqual(path.win32.normalize('../.../../foobar/../../../bar/../../baz'), '..\\..\\..\\..\\baz');
            assert.strictEqual(path.win32.normalize('foo/bar\\baz'), 'foo\\bar\\baz');
            assert.strictEqual(path.posix.normalize('./fixtures///b/../b/c.js'), 'fixtures/b/c.js');
            assert.strictEqual(path.posix.normalize('/foo/../../../bar'), '/bar');
            assert.strictEqual(path.posix.normalize('a//b//../b'), 'a/b');
            assert.strictEqual(path.posix.normalize('a//b//./c'), 'a/b/c');
            assert.strictEqual(path.posix.normalize('a//b//.'), 'a/b');
            assert.strictEqual(path.posix.normalize('/a/b/c/../../../x/y/z'), '/x/y/z');
            assert.strictEqual(path.posix.normalize('///..//./foo/.//bar'), '/foo/bar');
            assert.strictEqual(path.posix.normalize('bar/foo../../'), 'bar/');
            assert.strictEqual(path.posix.normalize('bar/foo../..'), 'bar');
            assert.strictEqual(path.posix.normalize('bar/foo../../baz'), 'bar/baz');
            assert.strictEqual(path.posix.normalize('bar/foo../'), 'bar/foo../');
            assert.strictEqual(path.posix.normalize('bar/foo..'), 'bar/foo..');
            assert.strictEqual(path.posix.normalize('../foo../../../bar'), '../../bar');
            assert.strictEqual(path.posix.normalize('../.../.././.../../../bar'), '../../bar');
            assert.strictEqual(path.posix.normalize('../../../foo/../../../bar'), '../../../../../bar');
            assert.strictEqual(path.posix.normalize('../../../foo/../../../bar/../../'), '../../../../../../');
            assert.strictEqual(path.posix.normalize('../foobar/barfoo/foo/../../../bar/../../'), '../../');
            assert.strictEqual(path.posix.normalize('../.../../foobar/../../../bar/../../baz'), '../../../../baz');
            assert.strictEqual(path.posix.normalize('foo/bar\\baz'), 'foo/bar\\baz');
        });
        test('isAbsolute', () => {
            assert.strictEqual(path.win32.isAbsolute('/'), true);
            assert.strictEqual(path.win32.isAbsolute('//'), true);
            assert.strictEqual(path.win32.isAbsolute('//server'), true);
            assert.strictEqual(path.win32.isAbsolute('//server/file'), true);
            assert.strictEqual(path.win32.isAbsolute('\\\\server\\file'), true);
            assert.strictEqual(path.win32.isAbsolute('\\\\server'), true);
            assert.strictEqual(path.win32.isAbsolute('\\\\'), true);
            assert.strictEqual(path.win32.isAbsolute('c'), false);
            assert.strictEqual(path.win32.isAbsolute('c:'), false);
            assert.strictEqual(path.win32.isAbsolute('c:\\'), true);
            assert.strictEqual(path.win32.isAbsolute('c:/'), true);
            assert.strictEqual(path.win32.isAbsolute('c://'), true);
            assert.strictEqual(path.win32.isAbsolute('C:/Users/'), true);
            assert.strictEqual(path.win32.isAbsolute('C:\\Users\\'), true);
            assert.strictEqual(path.win32.isAbsolute('C:cwd/another'), false);
            assert.strictEqual(path.win32.isAbsolute('C:cwd\\another'), false);
            assert.strictEqual(path.win32.isAbsolute('directory/directory'), false);
            assert.strictEqual(path.win32.isAbsolute('directory\\directory'), false);
            assert.strictEqual(path.posix.isAbsolute('/home/foo'), true);
            assert.strictEqual(path.posix.isAbsolute('/home/foo/..'), true);
            assert.strictEqual(path.posix.isAbsolute('bar/'), false);
            assert.strictEqual(path.posix.isAbsolute('./baz'), false);
            // Tests from VSCode:
            // Absolute Paths
            [
                'C:/',
                'C:\\',
                'C:/foo',
                'C:\\foo',
                'z:/foo/bar.txt',
                'z:\\foo\\bar.txt',
                '\\\\localhost\\c$\\foo',
                '/',
                '/foo'
            ].forEach(absolutePath => {
                assert.ok(path.win32.isAbsolute(absolutePath), absolutePath);
            });
            [
                '/',
                '/foo',
                '/foo/bar.txt'
            ].forEach(absolutePath => {
                assert.ok(path.posix.isAbsolute(absolutePath), absolutePath);
            });
            // Relative Paths
            [
                '',
                'foo',
                'foo/bar',
                './foo',
                'http://foo.com/bar'
            ].forEach(nonAbsolutePath => {
                assert.ok(!path.win32.isAbsolute(nonAbsolutePath), nonAbsolutePath);
            });
            [
                '',
                'foo',
                'foo/bar',
                './foo',
                'http://foo.com/bar',
                'z:/foo/bar.txt',
            ].forEach(nonAbsolutePath => {
                assert.ok(!path.posix.isAbsolute(nonAbsolutePath), nonAbsolutePath);
            });
        });
        test('path', () => {
            // path.sep tests
            // windows
            assert.strictEqual(path.win32.sep, '\\');
            // posix
            assert.strictEqual(path.posix.sep, '/');
            // path.delimiter tests
            // windows
            assert.strictEqual(path.win32.delimiter, ';');
            // posix
            assert.strictEqual(path.posix.delimiter, ':');
            // if (isWindows) {
            // 	assert.strictEqual(path, path.win32);
            // } else {
            // 	assert.strictEqual(path, path.posix);
            // }
        });
        // test('perf', () => {
        // 	const folderNames = [
        // 		'abc',
        // 		'Users',
        // 		'reallylongfoldername',
        // 		's',
        // 		'reallyreallyreallylongfoldername',
        // 		'home'
        // 	];
        // 	const basePaths = [
        // 		'C:',
        // 		'',
        // 	];
        // 	const separators = [
        // 		'\\',
        // 		'/'
        // 	];
        // 	function randomInt(ciel: number): number {
        // 		return Math.floor(Math.random() * ciel);
        // 	}
        // 	let pathsToNormalize = [];
        // 	let pathsToJoin = [];
        // 	let i;
        // 	for (i = 0; i < 1000000; i++) {
        // 		const basePath = basePaths[randomInt(basePaths.length)];
        // 		let lengthOfPath = randomInt(10) + 2;
        // 		let pathToNormalize = basePath + separators[randomInt(separators.length)];
        // 		while (lengthOfPath-- > 0) {
        // 			pathToNormalize = pathToNormalize + folderNames[randomInt(folderNames.length)] + separators[randomInt(separators.length)];
        // 		}
        // 		pathsToNormalize.push(pathToNormalize);
        // 		let pathToJoin = '';
        // 		lengthOfPath = randomInt(10) + 2;
        // 		while (lengthOfPath-- > 0) {
        // 			pathToJoin = pathToJoin + folderNames[randomInt(folderNames.length)] + separators[randomInt(separators.length)];
        // 		}
        // 		pathsToJoin.push(pathToJoin + '.ts');
        // 	}
        // 	let newTime = 0;
        // 	let j;
        // 	for(j = 0; j < pathsToJoin.length; j++) {
        // 		const path1 = pathsToNormalize[j];
        // 		const path2 = pathsToNormalize[j];
        // 		const newStart = performance.now();
        // 		path.join(path1, path2);
        // 		newTime += performance.now() - newStart;
        // 	}
        // 	assert.ok(false, `Time: ${newTime}ms.`);
        // });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9wYXRoLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQ2hHLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7UUFDekMsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDO1FBQ2xDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNqQixNQUFNLFFBQVEsR0FBRyxFQUFjLENBQUM7WUFDaEMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBRTFCLE1BQU0sU0FBUyxHQUFRO2dCQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ25DLHVDQUF1QztvQkFDdkMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsVUFBVSxDQUFDO3dCQUM1QyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUM7d0JBQ1QsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLFdBQVcsQ0FBQzt3QkFDN0MsQ0FBQyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsRUFBRSxNQUFNLENBQUM7d0JBQ2xDLENBQUMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLEVBQUUsV0FBVyxDQUFDO3dCQUN0QyxDQUFDLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxFQUFFLFdBQVcsQ0FBQzt3QkFDdkMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsRUFBRSxRQUFRLENBQUM7d0JBQ3JD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VUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FB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