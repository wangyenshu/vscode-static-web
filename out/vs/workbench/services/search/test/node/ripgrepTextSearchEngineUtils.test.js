/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/workbench/services/search/common/searchExtTypes", "vs/base/test/common/utils"], function (require, exports, assert, resources_1, uri_1, ripgrepTextSearchEngine_1, searchExtTypes_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RipgrepTextSearchEngine', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('unicodeEscapesToPCRE2', async () => {
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u1234'), '\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u1234\\u0001'), '\\x{1234}\\x{0001}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\u1234bar'), 'foo\\x{1234}bar');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\\\\\u1234'), '\\\\\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\\\\\u1234'), 'foo\\\\\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u{1234}'), '\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u{1234}\\u{0001}'), '\\x{1234}\\x{0001}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\u{1234}bar'), 'foo\\x{1234}bar');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('[\\u00A0-\\u00FF]'), '[\\x{00A0}-\\x{00FF}]');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\u{123456}7bar'), 'foo\\u{123456}7bar');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u123'), '\\u123');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo'), 'foo');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)(''), '');
        });
        test('fixRegexNewline - src', () => {
            const ttable = [
                ['foo', 'foo'],
                ['invalid(', 'invalid('],
                ['fo\\no', 'fo\\r?\\no'],
                ['f\\no\\no', 'f\\r?\\no\\r?\\no'],
                ['f[a-z\\n1]', 'f(?:[a-z1]|\\r?\\n)'],
                ['f[\\n-a]', 'f[\\n-a]'],
                ['(?<=\\n)\\w', '(?<=\\n)\\w'],
                ['fo\\n+o', 'fo(?:\\r?\\n)+o'],
                ['fo[^\\n]o', 'fo(?!\\r?\\n)o'],
                ['fo[^\\na-z]o', 'fo(?!\\r?\\n|[a-z])o'],
                ['foo[^\\n]+o', 'foo.+o'],
                ['foo[^\\nzq]+o', 'foo[^zq]+o'],
                ['foo[^\\nzq]+o', 'foo[^zq]+o'],
                // preserves quantifies, #137899
                ['fo[^\\S\\n]*o', 'fo[^\\S]*o'],
                ['fo[^\\S\\n]{3,}o', 'fo[^\\S]{3,}o'],
            ];
            for (const [input, expected] of ttable) {
                assert.strictEqual((0, ripgrepTextSearchEngine_1.fixRegexNewline)(input), expected, `${input} -> ${expected}`);
            }
        });
        test('fixRegexNewline - re', () => {
            function testFixRegexNewline([inputReg, testStr, shouldMatch]) {
                const fixed = (0, ripgrepTextSearchEngine_1.fixRegexNewline)(inputReg);
                const reg = new RegExp(fixed);
                assert.strictEqual(reg.test(testStr), shouldMatch, `${inputReg} => ${reg}, ${testStr}, ${shouldMatch}`);
            }
            [
                ['foo', 'foo', true],
                ['foo\\n', 'foo\r\n', true],
                ['foo\\n\\n', 'foo\n\n', true],
                ['foo\\n\\n', 'foo\r\n\r\n', true],
                ['foo\\n', 'foo\n', true],
                ['foo\\nabc', 'foo\r\nabc', true],
                ['foo\\nabc', 'foo\nabc', true],
                ['foo\\r\\n', 'foo\r\n', true],
                ['foo\\n+abc', 'foo\r\nabc', true],
                ['foo\\n+abc', 'foo\n\n\nabc', true],
                ['foo\\n+abc', 'foo\r\n\r\n\r\nabc', true],
                ['foo[\\n-9]+abc', 'foo1abc', true],
            ].forEach(testFixRegexNewline);
        });
        test('fixNewline - matching', () => {
            function testFixNewline([inputReg, testStr, shouldMatch = true]) {
                const fixed = (0, ripgrepTextSearchEngine_1.fixNewline)(inputReg);
                const reg = new RegExp(fixed);
                assert.strictEqual(reg.test(testStr), shouldMatch, `${inputReg} => ${reg}, ${testStr}, ${shouldMatch}`);
            }
            [
                ['foo', 'foo'],
                ['foo\n', 'foo\r\n'],
                ['foo\n', 'foo\n'],
                ['foo\nabc', 'foo\r\nabc'],
                ['foo\nabc', 'foo\nabc'],
                ['foo\r\n', 'foo\r\n'],
                ['foo\nbarc', 'foobar', false],
                ['foobar', 'foo\nbar', false],
            ].forEach(testFixNewline);
        });
        suite('RipgrepParser', () => {
            const TEST_FOLDER = uri_1.URI.file('/foo/bar');
            function testParser(inputData, expectedResults) {
                const testParser = new ripgrepTextSearchEngine_1.RipgrepParser(1000, TEST_FOLDER);
                const actualResults = [];
                testParser.on('result', r => {
                    actualResults.push(r);
                });
                inputData.forEach(d => testParser.handleData(d));
                testParser.flush();
                assert.deepStrictEqual(actualResults, expectedResults);
            }
            function makeRgMatch(relativePath, text, lineNumber, matchRanges) {
                return JSON.stringify({
                    type: 'match',
                    data: {
                        path: {
                            text: relativePath
                        },
                        lines: {
                            text
                        },
                        line_number: lineNumber,
                        absolute_offset: 0, // unused
                        submatches: matchRanges.map(mr => {
                            return {
                                ...mr,
                                match: { text: text.substring(mr.start, mr.end) }
                            };
                        })
                    }
                }) + '\n';
            }
            test('single result', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, [{ start: 3, end: 6 }])
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('multiple results', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app/file2.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app2/file3.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app/file2.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app2/file3.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('chopped-up input chunks', () => {
                const dataStrs = [
                    makeRgMatch('file1.js', 'foo bar', 4, [{ start: 3, end: 7 }]),
                    makeRgMatch('app/file2.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app2/file3.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                ];
                const dataStr0Space = dataStrs[0].indexOf(' ');
                testParser([
                    dataStrs[0].substring(0, dataStr0Space + 1),
                    dataStrs[0].substring(dataStr0Space + 1),
                    '\n',
                    dataStrs[1].trim(),
                    '\n' + dataStrs[2].substring(0, 25),
                    dataStrs[2].substring(25)
                ], [
                    {
                        preview: {
                            text: 'foo bar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 7)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 7)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app/file2.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app2/file3.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('empty result (#100569)', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, []),
                    makeRgMatch('file1.js', '', 5, []),
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 0, 0, 1)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 0, 3, 1)]
                    },
                    {
                        preview: {
                            text: '',
                            matches: [new searchExtTypes_1.Range(0, 0, 0, 0)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(4, 0, 4, 0)]
                    }
                ]);
            });
            test('multiple submatches without newline in between (#131507)', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobarbazquux', 4, [{ start: 0, end: 4 }, { start: 6, end: 10 }]),
                ], [
                    {
                        preview: {
                            text: 'foobarbazquux',
                            matches: [new searchExtTypes_1.Range(0, 0, 0, 4), new searchExtTypes_1.Range(0, 6, 0, 10)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 0, 3, 4), new searchExtTypes_1.Range(3, 6, 3, 10)]
                    }
                ]);
            });
            test('multiple submatches with newline in between (#131507)', () => {
                testParser([
                    makeRgMatch('file1.js', 'foo\nbar\nbaz\nquux', 4, [{ start: 0, end: 5 }, { start: 8, end: 13 }]),
                ], [
                    {
                        preview: {
                            text: 'foo\nbar\nbaz\nquux',
                            matches: [new searchExtTypes_1.Range(0, 0, 1, 1), new searchExtTypes_1.Range(2, 0, 3, 1)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 0, 4, 1), new searchExtTypes_1.Range(5, 0, 6, 1)]
                    }
                ]);
            });
        });
        suite('getRgArgs', () => {
            test('simple includes', () => {
                // Only testing the args that come from includes.
                function testGetRgArgs(includes, expectedFromIncludes) {
                    const query = {
                        pattern: 'test'
                    };
                    const options = {
                        includes: includes,
                        excludes: [],
                        maxResults: 1000,
                        useIgnoreFiles: false,
                        followSymlinks: false,
                        useGlobalIgnoreFiles: false,
                        useParentIgnoreFiles: false,
                        folder: uri_1.URI.file('/some/folder')
                    };
                    const expected = [
                        '--hidden',
                        '--no-require-git',
                        '--ignore-case',
                        ...expectedFromIncludes,
                        '--no-ignore',
                        '--crlf',
                        '--fixed-strings',
                        '--no-config',
                        '--no-ignore-global',
                        '--json',
                        '--',
                        'test',
                        '.'
                    ];
                    const result = (0, ripgrepTextSearchEngine_1.getRgArgs)(query, options);
                    assert.deepStrictEqual(result, expected);
                }
                ([
                    [['a/*', 'b/*'], ['-g', '!*', '-g', '/a', '-g', '/a/*', '-g', '/b', '-g', '/b/*']],
                    [['**/a/*', 'b/*'], ['-g', '!*', '-g', '/b', '-g', '/b/*', '-g', '**/a/*']],
                    [['**/a/*', '**/b/*'], ['-g', '**/a/*', '-g', '**/b/*']],
                    [['foo/*bar/something/**'], ['-g', '!*', '-g', '/foo', '-g', '/foo/*bar', '-g', '/foo/*bar/something', '-g', '/foo/*bar/something/**']],
                ].forEach(([includes, expectedFromIncludes]) => testGetRgArgs(includes, expectedFromIncludes)));
            });
        });
        test('brace expansion for ripgrep', () => {
            function testBraceExpansion(argGlob, expectedGlob) {
                const result = (0, ripgrepTextSearchEngine_1.performBraceExpansionForRipgrep)(argGlob);
                assert.deepStrictEqual(result, expectedGlob);
            }
            [
                ['eep/{a,b}/test', ['eep/a/test', 'eep/b/test']],
                ['eep/{a,b}/{c,d,e}', ['eep/a/c', 'eep/a/d', 'eep/a/e', 'eep/b/c', 'eep/b/d', 'eep/b/e']],
                ['eep/{a,b}/\\{c,d,e}', ['eep/a/{c,d,e}', 'eep/b/{c,d,e}']],
                ['eep/{a,b\\}/test', ['eep/{a,b}/test']],
                ['eep/{a,b\\\\}/test', ['eep/a/test', 'eep/b\\\\/test']],
                ['eep/{a,b\\\\\\}/test', ['eep/{a,b\\\\}/test']],
                ['e\\{ep/{a,b}/test', ['e{ep/a/test', 'e{ep/b/test']],
                ['eep/{a,\\b}/test', ['eep/a/test', 'eep/\\b/test']],
                ['{a/*.*,b/*.*}', ['a/*.*', 'b/*.*']],
                ['{{}', ['{{}']],
                ['aa{{}', ['aa{{}']],
                ['{b{}', ['{b{}']],
                ['{{}c', ['{{}c']],
                ['{{}}', ['{{}}']],
                ['\\{{}}', ['{}']],
                ['{}foo', ['foo']],
                ['bar{ }foo', ['bar foo']],
                ['{}', ['']],
            ].forEach(([includePattern, expectedPatterns]) => testBraceExpansion(includePattern, expectedPatterns));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcFRleHRTZWFyY2hFbmdpbmVVdGlscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC90ZXN0L25vZGUvcmlwZ3JlcFRleHRTZWFyY2hFbmdpbmVVdGlscy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLCtDQUFxQixFQUFDLGdCQUFnQixDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsZUFBZSxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsYUFBYSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLCtDQUFxQixFQUFDLGdCQUFnQixDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUVoRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLCtDQUFxQixFQUFDLG9CQUFvQixDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZ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