/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing"], function (require, exports, assert_1, utils_1, terminalLinkParsing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const operatingSystems = [
        3 /* OperatingSystem.Linux */,
        2 /* OperatingSystem.Macintosh */,
        1 /* OperatingSystem.Windows */
    ];
    const osTestPath = {
        [3 /* OperatingSystem.Linux */]: '/test/path/linux',
        [2 /* OperatingSystem.Macintosh */]: '/test/path/macintosh',
        [1 /* OperatingSystem.Windows */]: 'C:\\test\\path\\windows'
    };
    const osLabel = {
        [3 /* OperatingSystem.Linux */]: '[Linux]',
        [2 /* OperatingSystem.Macintosh */]: '[macOS]',
        [1 /* OperatingSystem.Windows */]: '[Windows]'
    };
    const testRow = 339;
    const testCol = 12;
    const testRowEnd = 341;
    const testColEnd = 789;
    const testLinks = [
        // Simple
        { link: 'foo', prefix: undefined, suffix: undefined, hasRow: false, hasCol: false },
        { link: 'foo:339', prefix: undefined, suffix: ':339', hasRow: true, hasCol: false },
        { link: 'foo:339:12', prefix: undefined, suffix: ':339:12', hasRow: true, hasCol: true },
        { link: 'foo:339:12-789', prefix: undefined, suffix: ':339:12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo:339.12', prefix: undefined, suffix: ':339.12', hasRow: true, hasCol: true },
        { link: 'foo:339.12-789', prefix: undefined, suffix: ':339.12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo:339.12-341.789', prefix: undefined, suffix: ':339.12-341.789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        { link: 'foo#339', prefix: undefined, suffix: '#339', hasRow: true, hasCol: false },
        { link: 'foo#339:12', prefix: undefined, suffix: '#339:12', hasRow: true, hasCol: true },
        { link: 'foo#339:12-789', prefix: undefined, suffix: '#339:12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo#339.12', prefix: undefined, suffix: '#339.12', hasRow: true, hasCol: true },
        { link: 'foo#339.12-789', prefix: undefined, suffix: '#339.12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo#339.12-341.789', prefix: undefined, suffix: '#339.12-341.789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        { link: 'foo 339', prefix: undefined, suffix: ' 339', hasRow: true, hasCol: false },
        { link: 'foo 339:12', prefix: undefined, suffix: ' 339:12', hasRow: true, hasCol: true },
        { link: 'foo 339:12-789', prefix: undefined, suffix: ' 339:12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo 339.12', prefix: undefined, suffix: ' 339.12', hasRow: true, hasCol: true },
        { link: 'foo 339.12-789', prefix: undefined, suffix: ' 339.12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo 339.12-341.789', prefix: undefined, suffix: ' 339.12-341.789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        // Double quotes
        { link: '"foo",339', prefix: '"', suffix: '",339', hasRow: true, hasCol: false },
        { link: '"foo",339:12', prefix: '"', suffix: '",339:12', hasRow: true, hasCol: true },
        { link: '"foo",339.12', prefix: '"', suffix: '",339.12', hasRow: true, hasCol: true },
        { link: '"foo", line 339', prefix: '"', suffix: '", line 339', hasRow: true, hasCol: false },
        { link: '"foo", line 339, col 12', prefix: '"', suffix: '", line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo", line 339, column 12', prefix: '"', suffix: '", line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo":line 339', prefix: '"', suffix: '":line 339', hasRow: true, hasCol: false },
        { link: '"foo":line 339, col 12', prefix: '"', suffix: '":line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo":line 339, column 12', prefix: '"', suffix: '":line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo": line 339', prefix: '"', suffix: '": line 339', hasRow: true, hasCol: false },
        { link: '"foo": line 339, col 12', prefix: '"', suffix: '": line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo": line 339, column 12', prefix: '"', suffix: '": line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo" on line 339', prefix: '"', suffix: '" on line 339', hasRow: true, hasCol: false },
        { link: '"foo" on line 339, col 12', prefix: '"', suffix: '" on line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo" on line 339, column 12', prefix: '"', suffix: '" on line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo" line 339', prefix: '"', suffix: '" line 339', hasRow: true, hasCol: false },
        { link: '"foo" line 339 column 12', prefix: '"', suffix: '" line 339 column 12', hasRow: true, hasCol: true },
        // Single quotes
        { link: '\'foo\',339', prefix: '\'', suffix: '\',339', hasRow: true, hasCol: false },
        { link: '\'foo\',339:12', prefix: '\'', suffix: '\',339:12', hasRow: true, hasCol: true },
        { link: '\'foo\',339.12', prefix: '\'', suffix: '\',339.12', hasRow: true, hasCol: true },
        { link: '\'foo\', line 339', prefix: '\'', suffix: '\', line 339', hasRow: true, hasCol: false },
        { link: '\'foo\', line 339, col 12', prefix: '\'', suffix: '\', line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\', line 339, column 12', prefix: '\'', suffix: '\', line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\':line 339', prefix: '\'', suffix: '\':line 339', hasRow: true, hasCol: false },
        { link: '\'foo\':line 339, col 12', prefix: '\'', suffix: '\':line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\':line 339, column 12', prefix: '\'', suffix: '\':line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\': line 339', prefix: '\'', suffix: '\': line 339', hasRow: true, hasCol: false },
        { link: '\'foo\': line 339, col 12', prefix: '\'', suffix: '\': line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\': line 339, column 12', prefix: '\'', suffix: '\': line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\' on line 339', prefix: '\'', suffix: '\' on line 339', hasRow: true, hasCol: false },
        { link: '\'foo\' on line 339, col 12', prefix: '\'', suffix: '\' on line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\' on line 339, column 12', prefix: '\'', suffix: '\' on line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\' line 339', prefix: '\'', suffix: '\' line 339', hasRow: true, hasCol: false },
        { link: '\'foo\' line 339 column 12', prefix: '\'', suffix: '\' line 339 column 12', hasRow: true, hasCol: true },
        // No quotes
        { link: 'foo, line 339', prefix: undefined, suffix: ', line 339', hasRow: true, hasCol: false },
        { link: 'foo, line 339, col 12', prefix: undefined, suffix: ', line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo, line 339, column 12', prefix: undefined, suffix: ', line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo:line 339', prefix: undefined, suffix: ':line 339', hasRow: true, hasCol: false },
        { link: 'foo:line 339, col 12', prefix: undefined, suffix: ':line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo:line 339, column 12', prefix: undefined, suffix: ':line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo: line 339', prefix: undefined, suffix: ': line 339', hasRow: true, hasCol: false },
        { link: 'foo: line 339, col 12', prefix: undefined, suffix: ': line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo: line 339, column 12', prefix: undefined, suffix: ': line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo on line 339', prefix: undefined, suffix: ' on line 339', hasRow: true, hasCol: false },
        { link: 'foo on line 339, col 12', prefix: undefined, suffix: ' on line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo on line 339, column 12', prefix: undefined, suffix: ' on line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo line 339', prefix: undefined, suffix: ' line 339', hasRow: true, hasCol: false },
        { link: 'foo line 339 column 12', prefix: undefined, suffix: ' line 339 column 12', hasRow: true, hasCol: true },
        // Parentheses
        { link: 'foo(339)', prefix: undefined, suffix: '(339)', hasRow: true, hasCol: false },
        { link: 'foo(339,12)', prefix: undefined, suffix: '(339,12)', hasRow: true, hasCol: true },
        { link: 'foo(339, 12)', prefix: undefined, suffix: '(339, 12)', hasRow: true, hasCol: true },
        { link: 'foo (339)', prefix: undefined, suffix: ' (339)', hasRow: true, hasCol: false },
        { link: 'foo (339,12)', prefix: undefined, suffix: ' (339,12)', hasRow: true, hasCol: true },
        { link: 'foo (339, 12)', prefix: undefined, suffix: ' (339, 12)', hasRow: true, hasCol: true },
        { link: 'foo: (339)', prefix: undefined, suffix: ': (339)', hasRow: true, hasCol: false },
        { link: 'foo: (339,12)', prefix: undefined, suffix: ': (339,12)', hasRow: true, hasCol: true },
        { link: 'foo: (339, 12)', prefix: undefined, suffix: ': (339, 12)', hasRow: true, hasCol: true },
        // Square brackets
        { link: 'foo[339]', prefix: undefined, suffix: '[339]', hasRow: true, hasCol: false },
        { link: 'foo[339,12]', prefix: undefined, suffix: '[339,12]', hasRow: true, hasCol: true },
        { link: 'foo[339, 12]', prefix: undefined, suffix: '[339, 12]', hasRow: true, hasCol: true },
        { link: 'foo [339]', prefix: undefined, suffix: ' [339]', hasRow: true, hasCol: false },
        { link: 'foo [339,12]', prefix: undefined, suffix: ' [339,12]', hasRow: true, hasCol: true },
        { link: 'foo [339, 12]', prefix: undefined, suffix: ' [339, 12]', hasRow: true, hasCol: true },
        { link: 'foo: [339]', prefix: undefined, suffix: ': [339]', hasRow: true, hasCol: false },
        { link: 'foo: [339,12]', prefix: undefined, suffix: ': [339,12]', hasRow: true, hasCol: true },
        { link: 'foo: [339, 12]', prefix: undefined, suffix: ': [339, 12]', hasRow: true, hasCol: true },
        // OCaml-style
        { link: '"foo", line 339, character 12', prefix: '"', suffix: '", line 339, character 12', hasRow: true, hasCol: true },
        { link: '"foo", line 339, characters 12-789', prefix: '"', suffix: '", line 339, characters 12-789', hasRow: true, hasCol: true, hasColEnd: true },
        { link: '"foo", lines 339-341', prefix: '"', suffix: '", lines 339-341', hasRow: true, hasCol: false, hasRowEnd: true },
        { link: '"foo", lines 339-341, characters 12-789', prefix: '"', suffix: '", lines 339-341, characters 12-789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        // Non-breaking space
        { link: 'foo\u00A0339:12', prefix: undefined, suffix: '\u00A0339:12', hasRow: true, hasCol: true },
        { link: '"foo" on line 339,\u00A0column 12', prefix: '"', suffix: '" on line 339,\u00A0column 12', hasRow: true, hasCol: true },
        { link: '\'foo\' on line\u00A0339, column 12', prefix: '\'', suffix: '\' on line\u00A0339, column 12', hasRow: true, hasCol: true },
        { link: 'foo (339,\u00A012)', prefix: undefined, suffix: ' (339,\u00A012)', hasRow: true, hasCol: true },
        { link: 'foo\u00A0[339, 12]', prefix: undefined, suffix: '\u00A0[339, 12]', hasRow: true, hasCol: true },
    ];
    const testLinksWithSuffix = testLinks.filter(e => !!e.suffix);
    suite('TerminalLinkParsing', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('removeLinkSuffix', () => {
            for (const testLink of testLinks) {
                test('`' + testLink.link + '`', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.removeLinkSuffix)(testLink.link), testLink.suffix === undefined ? testLink.link : testLink.link.replace(testLink.suffix, ''));
                });
            }
        });
        suite('getLinkSuffix', () => {
            for (const testLink of testLinks) {
                test('`' + testLink.link + '`', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.getLinkSuffix)(testLink.link), testLink.suffix === undefined ? null : {
                        row: testLink.hasRow ? testRow : undefined,
                        col: testLink.hasCol ? testCol : undefined,
                        rowEnd: testLink.hasRowEnd ? testRowEnd : undefined,
                        colEnd: testLink.hasColEnd ? testColEnd : undefined,
                        suffix: {
                            index: testLink.link.length - testLink.suffix.length,
                            text: testLink.suffix
                        }
                    });
                });
            }
        });
        suite('detectLinkSuffixes', () => {
            for (const testLink of testLinks) {
                test('`' + testLink.link + '`', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinkSuffixes)(testLink.link), testLink.suffix === undefined ? [] : [{
                            row: testLink.hasRow ? testRow : undefined,
                            col: testLink.hasCol ? testCol : undefined,
                            rowEnd: testLink.hasRowEnd ? testRowEnd : undefined,
                            colEnd: testLink.hasColEnd ? testColEnd : undefined,
                            suffix: {
                                index: testLink.link.length - testLink.suffix.length,
                                text: testLink.suffix
                            }
                        }]);
                });
            }
            test('foo(1, 2) bar[3, 4] baz on line 5', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinkSuffixes)('foo(1, 2) bar[3, 4] baz on line 5'), [
                    {
                        col: 2,
                        row: 1,
                        rowEnd: undefined,
                        colEnd: undefined,
                        suffix: {
                            index: 3,
                            text: '(1, 2)'
                        }
                    },
                    {
                        col: 4,
                        row: 3,
                        rowEnd: undefined,
                        colEnd: undefined,
                        suffix: {
                            index: 13,
                            text: '[3, 4]'
                        }
                    },
                    {
                        col: undefined,
                        row: 5,
                        rowEnd: undefined,
                        colEnd: undefined,
                        suffix: {
                            index: 23,
                            text: ' on line 5'
                        }
                    }
                ]);
            });
        });
        suite('removeLinkQueryString', () => {
            test('should remove any query string from the link', () => {
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('?a=b'), '');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('foo?a=b'), 'foo');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('./foo?a=b'), './foo');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('/foo/bar?a=b'), '/foo/bar');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('foo?a=b?'), 'foo');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('foo?a=b&c=d'), 'foo');
            });
            test('should respect ? in UNC paths', () => {
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('\\\\?\\foo?a=b'), '\\\\?\\foo');
            });
        });
        suite('detectLinks', () => {
            test('foo(1, 2) bar[3, 4] "baz" on line 5', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('foo(1, 2) bar[3, 4] "baz" on line 5', 3 /* OperatingSystem.Linux */), [
                    {
                        path: {
                            index: 0,
                            text: 'foo'
                        },
                        prefix: undefined,
                        suffix: {
                            col: 2,
                            row: 1,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 3,
                                text: '(1, 2)'
                            }
                        }
                    },
                    {
                        path: {
                            index: 10,
                            text: 'bar'
                        },
                        prefix: undefined,
                        suffix: {
                            col: 4,
                            row: 3,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 13,
                                text: '[3, 4]'
                            }
                        }
                    },
                    {
                        path: {
                            index: 21,
                            text: 'baz'
                        },
                        prefix: {
                            index: 20,
                            text: '"'
                        },
                        suffix: {
                            col: undefined,
                            row: 5,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 24,
                                text: '" on line 5'
                            }
                        }
                    }
                ]);
            });
            test('should extract the link prefix', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('"foo", line 5, col 6', 3 /* OperatingSystem.Linux */), [
                    {
                        path: {
                            index: 1,
                            text: 'foo'
                        },
                        prefix: {
                            index: 0,
                            text: '"',
                        },
                        suffix: {
                            row: 5,
                            col: 6,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 4,
                                text: '", line 5, col 6'
                            }
                        }
                    },
                ]);
            });
            test('should be smart about determining the link prefix when multiple prefix characters exist', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('echo \'"foo", line 5, col 6\'', 3 /* OperatingSystem.Linux */), [
                    {
                        path: {
                            index: 7,
                            text: 'foo'
                        },
                        prefix: {
                            index: 6,
                            text: '"',
                        },
                        suffix: {
                            row: 5,
                            col: 6,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 10,
                                text: '", line 5, col 6'
                            }
                        }
                    },
                ], 'The outer single quotes should be excluded from the link prefix and suffix');
            });
            test('should detect both suffix and non-suffix links on a single line', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('PS C:\\Github\\microsoft\\vscode> echo \'"foo", line 5, col 6\'', 1 /* OperatingSystem.Windows */), [
                    {
                        path: {
                            index: 3,
                            text: 'C:\\Github\\microsoft\\vscode'
                        },
                        prefix: undefined,
                        suffix: undefined
                    },
                    {
                        path: {
                            index: 38,
                            text: 'foo'
                        },
                        prefix: {
                            index: 37,
                            text: '"',
                        },
                        suffix: {
                            row: 5,
                            col: 6,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 41,
                                text: '", line 5, col 6'
                            }
                        }
                    }
                ]);
            });
            suite('"|"', () => {
                test('should exclude pipe characters from link paths', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('|C:\\Github\\microsoft\\vscode|', 1 /* OperatingSystem.Windows */), [
                        {
                            path: {
                                index: 1,
                                text: 'C:\\Github\\microsoft\\vscode'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
                test('should exclude pipe characters from link paths with suffixes', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('|C:\\Github\\microsoft\\vscode:400|', 1 /* OperatingSystem.Windows */), [
                        {
                            path: {
                                index: 1,
                                text: 'C:\\Github\\microsoft\\vscode'
                            },
                            prefix: undefined,
                            suffix: {
                                col: undefined,
                                row: 400,
                                rowEnd: undefined,
                                colEnd: undefined,
                                suffix: {
                                    index: 27,
                                    text: ':400'
                                }
                            }
                        }
                    ]);
                });
            });
            suite('"<>"', () => {
                for (const os of operatingSystems) {
                    test(`should exclude bracket characters from link paths ${osLabel[os]}`, () => {
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`<${osTestPath[os]}<`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`>${osTestPath[os]}>`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                    });
                    test(`should exclude bracket characters from link paths with suffixes ${osLabel[os]}`, () => {
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`<${osTestPath[os]}:400<`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: {
                                    col: undefined,
                                    row: 400,
                                    rowEnd: undefined,
                                    colEnd: undefined,
                                    suffix: {
                                        index: 1 + osTestPath[os].length,
                                        text: ':400'
                                    }
                                }
                            }
                        ]);
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`>${osTestPath[os]}:400>`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: {
                                    col: undefined,
                                    row: 400,
                                    rowEnd: undefined,
                                    colEnd: undefined,
                                    suffix: {
                                        index: 1 + osTestPath[os].length,
                                        text: ':400'
                                    }
                                }
                            }
                        ]);
                    });
                }
            });
            suite('query strings', () => {
                for (const os of operatingSystems) {
                    test(`should exclude query strings from link paths ${osLabel[os]}`, () => {
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`${osTestPath[os]}?a=b`, os), [
                            {
                                path: {
                                    index: 0,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`${osTestPath[os]}?a=b&c=d`, os), [
                            {
                                path: {
                                    index: 0,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                    });
                    test('should not detect links starting with ? within query strings that contain posix-style paths (#204195)', () => {
                        // ? appended to the cwd will exist since it's just the cwd
                        (0, assert_1.strictEqual)((0, terminalLinkParsing_1.detectLinks)(`http://foo.com/?bar=/a/b&baz=c`, os).some(e => e.path.text.startsWith('?')), false);
                    });
                    test('should not detect links starting with ? within query strings that contain Windows-style paths (#204195)', () => {
                        // ? appended to the cwd will exist since it's just the cwd
                        (0, assert_1.strictEqual)((0, terminalLinkParsing_1.detectLinks)(`http://foo.com/?bar=a:\\b&baz=c`, os).some(e => e.path.text.startsWith('?')), false);
                    });
                }
            });
            suite('should detect file names in git diffs', () => {
                test('--- a/foo/bar', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('--- a/foo/bar', 3 /* OperatingSystem.Linux */), [
                        {
                            path: {
                                index: 6,
                                text: 'foo/bar'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
                test('+++ b/foo/bar', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('+++ b/foo/bar', 3 /* OperatingSystem.Linux */), [
                        {
                            path: {
                                index: 6,
                                text: 'foo/bar'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
                test('diff --git a/foo/bar b/foo/baz', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('diff --git a/foo/bar b/foo/baz', 3 /* OperatingSystem.Linux */), [
                        {
                            path: {
                                index: 13,
                                text: 'foo/bar'
                            },
                            prefix: undefined,
                            suffix: undefined
                        },
                        {
                            path: {
                                index: 23,
                                text: 'foo/baz'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
            });
            suite('should detect 3 suffix links on a single line', () => {
                for (let i = 0; i < testLinksWithSuffix.length - 2; i++) {
                    const link1 = testLinksWithSuffix[i];
                    const link2 = testLinksWithSuffix[i + 1];
                    const link3 = testLinksWithSuffix[i + 2];
                    const line = ` ${link1.link} ${link2.link} ${link3.link} `;
                    test('`' + line.replaceAll('\u00A0', '<nbsp>') + '`', () => {
                        (0, assert_1.strictEqual)((0, terminalLinkParsing_1.detectLinks)(line, 3 /* OperatingSystem.Linux */).length, 3);
                        (0, assert_1.ok)(link1.suffix);
                        (0, assert_1.ok)(link2.suffix);
                        (0, assert_1.ok)(link3.suffix);
                        const detectedLink1 = {
                            prefix: link1.prefix ? {
                                index: 1,
                                text: link1.prefix
                            } : undefined,
                            path: {
                                index: 1 + (link1.prefix?.length ?? 0),
                                text: link1.link.replace(link1.suffix, '').replace(link1.prefix || '', '')
                            },
                            suffix: {
                                row: link1.hasRow ? testRow : undefined,
                                col: link1.hasCol ? testCol : undefined,
                                rowEnd: link1.hasRowEnd ? testRowEnd : undefined,
                                colEnd: link1.hasColEnd ? testColEnd : undefined,
                                suffix: {
                                    index: 1 + (link1.link.length - link1.suffix.length),
                                    text: link1.suffix
                                }
                            }
                        };
                        const detectedLink2 = {
                            prefix: link2.prefix ? {
                                index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1,
                                text: link2.prefix
                            } : undefined,
                            path: {
                                index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1 + (link2.prefix ?? '').length,
                                text: link2.link.replace(link2.suffix, '').replace(link2.prefix ?? '', '')
                            },
                            suffix: {
                                row: link2.hasRow ? testRow : undefined,
                                col: link2.hasCol ? testCol : undefined,
                                rowEnd: link2.hasRowEnd ? testRowEnd : undefined,
                                colEnd: link2.hasColEnd ? testColEnd : undefined,
                                suffix: {
                                    index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1 + (link2.link.length - link2.suffix.length),
                                    text: link2.suffix
                                }
                            }
                        };
                        const detectedLink3 = {
                            prefix: link3.prefix ? {
                                index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1,
                                text: link3.prefix
                            } : undefined,
                            path: {
                                index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1 + (link3.prefix ?? '').length,
                                text: link3.link.replace(link3.suffix, '').replace(link3.prefix ?? '', '')
                            },
                            suffix: {
                                row: link3.hasRow ? testRow : undefined,
                                col: link3.hasCol ? testCol : undefined,
                                rowEnd: link3.hasRowEnd ? testRowEnd : undefined,
                                colEnd: link3.hasColEnd ? testColEnd : undefined,
                                suffix: {
                                    index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1 + (link3.link.length - link3.suffix.length),
                                    text: link3.suffix
                                }
                            }
                        };
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(line, 3 /* OperatingSystem.Linux */), [detectedLink1, detectedLink2, detectedLink3]);
                    });
                }
            });
            suite('should ignore links with suffixes when the path itself is the empty string', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('""",1', 3 /* OperatingSystem.Linux */), []);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUGFyc2luZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbExpbmtQYXJzaW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLE1BQU0sZ0JBQWdCLEdBQW1DOzs7O0tBSXhELENBQUM7SUFDRixNQUFNLFVBQVUsR0FBZ0Q7UUFDL0QsK0JBQXVCLEVBQUUsa0JBQWtCO1FBQzNDLG1DQUEyQixFQUFFLHNCQUFzQjtRQUNuRCxpQ0FBeUIsRUFBRSx5QkFBeUI7S0FDcEQsQ0FBQztJQUNGLE1BQU0sT0FBTyxHQUFnRDtRQUM1RCwrQkFBdUIsRUFBRSxTQUFTO1FBQ2xDLG1DQUEyQixFQUFFLFNBQVM7UUFDdEMsaUNBQXlCLEVBQUUsV0FBVztLQUN0QyxDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ3BCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFDdkIsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDO0lBQ3ZCLE1BQU0sU0FBUyxHQUFnQjtRQUM5QixTQUFTO1FBQ1QsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7UUFDbkYsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7UUFDbkYsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDeEYsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDbkksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDeEYsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDbkksRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUMxSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUNuRixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUN4RixF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RTtRQUM1RixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUN2RixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM1RixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM5RixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUN6RixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM5RixFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBRWhHLGtCQUFrQjtRQUNsQixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUNyRixFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUMxRixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM1RixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUN2RixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM1RixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM5RixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUN6RixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUM5RixFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBRWhHLGNBQWM7UUFDZCxFQUFFLElBQUksRUFBRSwrQkFBK0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSwyQkFBMkIsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDdkgsRUFBRSxJQUFJLEVBQUUsb0NBQW9DLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsZ0NBQWdDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDbEosRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDdkgsRUFBRSxJQUFJLEVBQUUseUNBQXlDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUscUNBQXFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUU3SyxxQkFBcUI7UUFDckIsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUNsRyxFQUFFLElBQUksRUFBRSxtQ0FBbUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSwrQkFBK0IsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDL0gsRUFBRSxJQUFJLEVBQUUscUNBQXFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsZ0NBQWdDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQ25JLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUN4RyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7S0FDeEcsQ0FBQztJQUNGLE1BQU0sbUJBQW1CLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUQsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNqQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM5QixLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRTtvQkFDcEMsSUFBQSx3QkFBZSxFQUNkLElBQUEsc0NBQWdCLEVBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUMvQixRQUFRLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FDMUYsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQzNCLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFO29CQUNwQyxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxtQ0FBYSxFQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDNUIsUUFBUSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ3RDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7d0JBQzFDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7d0JBQzFDLE1BQU0sRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7d0JBQ25ELE1BQU0sRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7d0JBQ25ELE1BQU0sRUFBRTs0QkFDUCxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNOzRCQUNwRCxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU07eUJBQ3JCO3FCQUNtQyxDQUNyQyxDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUNoQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRTtvQkFDcEMsSUFBQSx3QkFBZSxFQUNkLElBQUEsd0NBQWtCLEVBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNqQyxRQUFRLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNyQyxHQUFHLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUMxQyxHQUFHLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUMxQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUNuRCxNQUFNLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUNuRCxNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTTtnQ0FDcEQsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNOzZCQUNyQjt5QkFDbUMsQ0FBQyxDQUN0QyxDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7Z0JBQzlDLElBQUEsd0JBQWUsRUFDZCxJQUFBLHdDQUFrQixFQUFDLG1DQUFtQyxDQUFDLEVBQ3ZEO29CQUNDO3dCQUNDLEdBQUcsRUFBRSxDQUFDO3dCQUNOLEdBQUcsRUFBRSxDQUFDO3dCQUNOLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUUsU0FBUzt3QkFDakIsTUFBTSxFQUFFOzRCQUNQLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSxRQUFRO3lCQUNkO3FCQUNEO29CQUNEO3dCQUNDLEdBQUcsRUFBRSxDQUFDO3dCQUNOLEdBQUcsRUFBRSxDQUFDO3dCQUNOLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUUsU0FBUzt3QkFDakIsTUFBTSxFQUFFOzRCQUNQLEtBQUssRUFBRSxFQUFFOzRCQUNULElBQUksRUFBRSxRQUFRO3lCQUNkO3FCQUNEO29CQUNEO3dCQUNDLEdBQUcsRUFBRSxTQUFTO3dCQUNkLEdBQUcsRUFBRSxDQUFDO3dCQUNOLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUUsU0FBUzt3QkFDakIsTUFBTSxFQUFFOzRCQUNQLEtBQUssRUFBRSxFQUFFOzRCQUNULElBQUksRUFBRSxZQUFZO3lCQUNsQjtxQkFDRDtpQkFDRCxDQUNELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNuQyxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO2dCQUN6RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSwyQ0FBcUIsRUFBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDL0MsSUFBQSxvQkFBVyxFQUFDLElBQUEsMkNBQXFCLEVBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JELElBQUEsb0JBQVcsRUFBQyxJQUFBLDJDQUFxQixFQUFDLFdBQVcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSwyQ0FBcUIsRUFBQyxjQUFjLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDL0QsSUFBQSxvQkFBVyxFQUFDLElBQUEsMkNBQXFCLEVBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3RELElBQUEsb0JBQVcsRUFBQyxJQUFBLDJDQUFxQixFQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtnQkFDMUMsSUFBQSxvQkFBVyxFQUFDLElBQUEsMkNBQXFCLEVBQUMsZ0JBQWdCLENBQUMsRUFBRSxZQUFZLENBQUUsQ0FBQztZQUNyRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDekIsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtnQkFDaEQsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxxQ0FBcUMsZ0NBQXdCLEVBQ3pFO29CQUNDO3dCQUNDLElBQUksRUFBRTs0QkFDTCxLQUFLLEVBQUUsQ0FBQzs0QkFDUixJQUFJLEVBQUUsS0FBSzt5QkFDWDt3QkFDRCxNQUFNLEVBQUUsU0FBUzt3QkFDakIsTUFBTSxFQUFFOzRCQUNQLEdBQUcsRUFBRSxDQUFDOzRCQUNOLEdBQUcsRUFBRSxDQUFDOzRCQUNOLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFO2dDQUNQLEtBQUssRUFBRSxDQUFDO2dDQUNSLElBQUksRUFBRSxRQUFROzZCQUNkO3lCQUNEO3FCQUNEO29CQUNEO3dCQUNDLElBQUksRUFBRTs0QkFDTCxLQUFLLEVBQUUsRUFBRTs0QkFDVCxJQUFJLEVBQUUsS0FBSzt5QkFDWDt3QkFDRCxNQUFNLEVBQUUsU0FBUzt3QkFDakIsTUFBTSxFQUFFOzRCQUNQLEdBQUcsRUFBRSxDQUFDOzRCQUNOLEdBQUcsRUFBRSxDQUFDOzRCQUNOLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFO2dDQUNQLEtBQUssRUFBRSxFQUFFO2dDQUNULElBQUksRUFBRSxRQUFROzZCQUNkO3lCQUNEO3FCQUNEO29CQUNEO3dCQUNDLElBQUksRUFBRTs0QkFDTCxLQUFLLEVBQUUsRUFBRTs0QkFDVCxJQUFJLEVBQUUsS0FBSzt5QkFDWDt3QkFDRCxNQUFNLEVBQUU7NEJBQ1AsS0FBSyxFQUFFLEVBQUU7NEJBQ1QsSUFBSSxFQUFFLEdBQUc7eUJBQ1Q7d0JBQ0QsTUFBTSxFQUFFOzRCQUNQLEdBQUcsRUFBRSxTQUFTOzRCQUNkLEdBQUcsRUFBRSxDQUFDOzRCQUNOLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFO2dDQUNQLEtBQUssRUFBRSxFQUFFO2dDQUNULElBQUksRUFBRSxhQUFhOzZCQUNuQjt5QkFDRDtxQkFDRDtpQkFDZ0IsQ0FDbEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtnQkFDM0MsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxzQkFBc0IsZ0NBQXdCLEVBQzFEO29CQUNDO3dCQUNDLElBQUksRUFBRTs0QkFDTCxLQUFLLEVBQUUsQ0FBQzs0QkFDUixJQUFJLEVBQUUsS0FBSzt5QkFDWDt3QkFDRCxNQUFNLEVBQUU7NEJBQ1AsS0FBSyxFQUFFLENBQUM7NEJBQ1IsSUFBSSxFQUFFLEdBQUc7eUJBQ1Q7d0JBQ0QsTUFBTSxFQUFFOzRCQUNQLEdBQUcsRUFBRSxDQUFDOzRCQUNOLEdBQUcsRUFBRSxDQUFDOzRCQUNOLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFO2dDQUNQLEtBQUssRUFBRSxDQUFDO2dDQUNSLElBQUksRUFBRSxrQkFBa0I7NkJBQ3hCO3lCQUNEO3FCQUNEO2lCQUNnQixDQUNsQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMseUZBQXlGLEVBQUUsR0FBRyxFQUFFO2dCQUNwRyxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLCtCQUErQixnQ0FBd0IsRUFDbkU7b0JBQ0M7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSxLQUFLO3lCQUNYO3dCQUNELE1BQU0sRUFBRTs0QkFDUCxLQUFLLEVBQUUsQ0FBQzs0QkFDUixJQUFJLEVBQUUsR0FBRzt5QkFDVDt3QkFDRCxNQUFNLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLEVBQUU7Z0NBQ1QsSUFBSSxFQUFFLGtCQUFrQjs2QkFDeEI7eUJBQ0Q7cUJBQ0Q7aUJBQ2dCLEVBQ2xCLDRFQUE0RSxDQUM1RSxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO2dCQUM1RSxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLGlFQUFpRSxrQ0FBMEIsRUFDdkc7b0JBQ0M7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSwrQkFBK0I7eUJBQ3JDO3dCQUNELE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUUsU0FBUztxQkFDakI7b0JBQ0Q7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxFQUFFOzRCQUNULElBQUksRUFBRSxLQUFLO3lCQUNYO3dCQUNELE1BQU0sRUFBRTs0QkFDUCxLQUFLLEVBQUUsRUFBRTs0QkFDVCxJQUFJLEVBQUUsR0FBRzt5QkFDVDt3QkFDRCxNQUFNLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLEVBQUU7Z0NBQ1QsSUFBSSxFQUFFLGtCQUFrQjs2QkFDeEI7eUJBQ0Q7cUJBQ0Q7aUJBQ2dCLENBQ2xCLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUNqQixJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO29CQUMzRCxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLGlDQUFpQyxrQ0FBMEIsRUFDdkU7d0JBQ0M7NEJBQ0MsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxDQUFDO2dDQUNSLElBQUksRUFBRSwrQkFBK0I7NkJBQ3JDOzRCQUNELE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzt5QkFDakI7cUJBQ2dCLENBQ2xCLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLDhEQUE4RCxFQUFFLEdBQUcsRUFBRTtvQkFDekUsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxxQ0FBcUMsa0NBQTBCLEVBQzNFO3dCQUNDOzRCQUNDLElBQUksRUFBRTtnQ0FDTCxLQUFLLEVBQUUsQ0FBQztnQ0FDUixJQUFJLEVBQUUsK0JBQStCOzZCQUNyQzs0QkFDRCxNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFO2dDQUNQLEdBQUcsRUFBRSxTQUFTO2dDQUNkLEdBQUcsRUFBRSxHQUFHO2dDQUNSLE1BQU0sRUFBRSxTQUFTO2dDQUNqQixNQUFNLEVBQUUsU0FBUztnQ0FDakIsTUFBTSxFQUFFO29DQUNQLEtBQUssRUFBRSxFQUFFO29DQUNULElBQUksRUFBRSxNQUFNO2lDQUNaOzZCQUNEO3lCQUNEO3FCQUNnQixDQUNsQixDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtnQkFDbEIsS0FBSyxNQUFNLEVBQUUsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUNuQyxJQUFJLENBQUMscURBQXFELE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTt3QkFDN0UsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUN0Qzs0QkFDQztnQ0FDQyxJQUFJLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLENBQUM7b0NBQ1IsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7aUNBQ3BCO2dDQUNELE1BQU0sRUFBRSxTQUFTO2dDQUNqQixNQUFNLEVBQUUsU0FBUzs2QkFDakI7eUJBQ2dCLENBQ2xCLENBQUM7d0JBQ0YsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUN0Qzs0QkFDQztnQ0FDQyxJQUFJLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLENBQUM7b0NBQ1IsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7aUNBQ3BCO2dDQUNELE1BQU0sRUFBRSxTQUFTO2dDQUNqQixNQUFNLEVBQUUsU0FBUzs2QkFDakI7eUJBQ2dCLENBQ2xCLENBQUM7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLG1FQUFtRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7d0JBQzNGLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFDMUM7NEJBQ0M7Z0NBQ0MsSUFBSSxFQUFFO29DQUNMLEtBQUssRUFBRSxDQUFDO29DQUNSLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2lDQUNwQjtnQ0FDRCxNQUFNLEVBQUUsU0FBUztnQ0FDakIsTUFBTSxFQUFFO29DQUNQLEdBQUcsRUFBRSxTQUFTO29DQUNkLEdBQUcsRUFBRSxHQUFHO29DQUNSLE1BQU0sRUFBRSxTQUFTO29DQUNqQixNQUFNLEVBQUUsU0FBUztvQ0FDakIsTUFBTSxFQUFFO3dDQUNQLEtBQUssRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU07d0NBQ2hDLElBQUksRUFBRSxNQUFNO3FDQUNaO2lDQUNEOzZCQUNEO3lCQUNnQixDQUNsQixDQUFDO3dCQUNGLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFDMUM7NEJBQ0M7Z0NBQ0MsSUFBSSxFQUFFO29DQUNMLEtBQUssRUFBRSxDQUFDO29DQUNSLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2lDQUNwQjtnQ0FDRCxNQUFNLEVBQUUsU0FBUztnQ0FDakIsTUFBTSxFQUFFO29DQUNQLEdBQUcsRUFBRSxTQUFTO29DQUNkLEdBQUcsRUFBRSxHQUFHO29DQUNSLE1BQU0sRUFBRSxTQUFTO29DQUNqQixNQUFNLEVBQUUsU0FBUztvQ0FDakIsTUFBTSxFQUFFO3dDQUNQLEtBQUssRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU07d0NBQ2hDLElBQUksRUFBRSxNQUFNO3FDQUNaO2lDQUNEOzZCQUNEO3lCQUNnQixDQUNsQixDQUFDO29CQUNILENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO2dCQUMzQixLQUFLLE1BQU0sRUFBRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ25DLElBQUksQ0FBQyxnREFBZ0QsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFO3dCQUN4RSxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQ3hDOzRCQUNDO2dDQUNDLElBQUksRUFBRTtvQ0FDTCxLQUFLLEVBQUUsQ0FBQztvQ0FDUixJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztpQ0FDcEI7Z0NBQ0QsTUFBTSxFQUFFLFNBQVM7Z0NBQ2pCLE1BQU0sRUFBRSxTQUFTOzZCQUNqQjt5QkFDZ0IsQ0FDbEIsQ0FBQzt3QkFDRixJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQzVDOzRCQUNDO2dDQUNDLElBQUksRUFBRTtvQ0FDTCxLQUFLLEVBQUUsQ0FBQztvQ0FDUixJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztpQ0FDcEI7Z0NBQ0QsTUFBTSxFQUFFLFNBQVM7Z0NBQ2pCLE1BQU0sRUFBRSxTQUFTOzZCQUNqQjt5QkFDZ0IsQ0FDbEIsQ0FBQztvQkFDSCxDQUFDLENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsdUdBQXVHLEVBQUUsR0FBRyxFQUFFO3dCQUNsSCwyREFBMkQ7d0JBQzNELElBQUEsb0JBQVcsRUFBQyxJQUFBLGlDQUFXLEVBQUMsZ0NBQWdDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQzlHLENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyx5R0FBeUcsRUFBRSxHQUFHLEVBQUU7d0JBQ3BILDJEQUEyRDt3QkFDM0QsSUFBQSxvQkFBVyxFQUFDLElBQUEsaUNBQVcsRUFBQyxpQ0FBaUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDL0csQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtnQkFDbkQsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7b0JBQzFCLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsZUFBZSxnQ0FBd0IsRUFDbkQ7d0JBQ0M7NEJBQ0MsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxDQUFDO2dDQUNSLElBQUksRUFBRSxTQUFTOzZCQUNmOzRCQUNELE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzt5QkFDakI7cUJBQ2dCLENBQ2xCLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7b0JBQzFCLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsZUFBZSxnQ0FBd0IsRUFDbkQ7d0JBQ0M7NEJBQ0MsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxDQUFDO2dDQUNSLElBQUksRUFBRSxTQUFTOzZCQUNmOzRCQUNELE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzt5QkFDakI7cUJBQ2dCLENBQ2xCLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtvQkFDM0MsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxnQ0FBZ0MsZ0NBQXdCLEVBQ3BFO3dCQUNDOzRCQUNDLElBQUksRUFBRTtnQ0FDTCxLQUFLLEVBQUUsRUFBRTtnQ0FDVCxJQUFJLEVBQUUsU0FBUzs2QkFDZjs0QkFDRCxNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFLFNBQVM7eUJBQ2pCO3dCQUNEOzRCQUNDLElBQUksRUFBRTtnQ0FDTCxLQUFLLEVBQUUsRUFBRTtnQ0FDVCxJQUFJLEVBQUUsU0FBUzs2QkFDZjs0QkFDRCxNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFLFNBQVM7eUJBQ2pCO3FCQUNnQixDQUNsQixDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxLQUFLLENBQUMsK0NBQStDLEVBQUUsR0FBRyxFQUFFO2dCQUMzRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUN6RCxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckMsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN6QyxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3pDLE1BQU0sSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQztvQkFDM0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFO3dCQUMxRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxpQ0FBVyxFQUFDLElBQUksZ0NBQXdCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNoRSxJQUFBLFdBQUUsRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ2pCLElBQUEsV0FBRSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDakIsSUFBQSxXQUFFLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNqQixNQUFNLGFBQWEsR0FBZ0I7NEJBQ2xDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQ0FDdEIsS0FBSyxFQUFFLENBQUM7Z0NBQ1IsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNOzZCQUNsQixDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUNiLElBQUksRUFBRTtnQ0FDTCxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDO2dDQUN0QyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDOzZCQUMxRTs0QkFDRCxNQUFNLEVBQUU7Z0NBQ1AsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztnQ0FDdkMsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztnQ0FDdkMsTUFBTSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUztnQ0FDaEQsTUFBTSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUztnQ0FDaEQsTUFBTSxFQUFFO29DQUNQLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztvQ0FDcEQsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNO2lDQUNsQjs2QkFDRDt5QkFDRCxDQUFDO3dCQUNGLE1BQU0sYUFBYSxHQUFnQjs0QkFDbEMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dDQUN0QixLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7Z0NBQ3hGLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTTs2QkFDbEIsQ0FBQyxDQUFDLENBQUMsU0FBUzs0QkFDYixJQUFJLEVBQUU7Z0NBQ0wsS0FBSyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU07Z0NBQ3RILElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7NkJBQzFFOzRCQUNELE1BQU0sRUFBRTtnQ0FDUCxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUN2QyxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUN2QyxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUNoRCxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUNoRCxNQUFNLEVBQUU7b0NBQ1AsS0FBSyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztvQ0FDcEksSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNO2lDQUNsQjs2QkFDRDt5QkFDRCxDQUFDO3dCQUNGLE1BQU0sYUFBYSxHQUFnQjs0QkFDbEMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dDQUN0QixLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7Z0NBQ3hGLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTTs2QkFDbEIsQ0FBQyxDQUFDLENBQUMsU0FBUzs0QkFDYixJQUFJLEVBQUU7Z0NBQ0wsS0FBSyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU07Z0NBQ3RILElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7NkJBQzFFOzRCQUNELE1BQU0sRUFBRTtnQ0FDUCxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUN2QyxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUN2QyxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUNoRCxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUNoRCxNQUFNLEVBQUU7b0NBQ1AsS0FBSyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztvQ0FDcEksSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNO2lDQUNsQjs2QkFDRDt5QkFDRCxDQUFDO3dCQUNGLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsSUFBSSxnQ0FBd0IsRUFDeEMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUM3QyxDQUFDO29CQUNILENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyw0RUFBNEUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3hGLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsT0FBTyxnQ0FBd0IsRUFDM0MsRUFBbUIsQ0FDbkIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9