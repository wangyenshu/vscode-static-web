/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages", "vs/editor/common/services/languageService", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/monarch/monarchCompile", "vs/editor/standalone/common/monarch/monarchLexer", "vs/platform/log/common/log"], function (require, exports, assert, lifecycle_1, utils_1, languages_1, languageService_1, standaloneServices_1, monarchCompile_1, monarchLexer_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Monarch', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createMonarchTokenizer(languageService, languageId, language, configurationService) {
            return new monarchLexer_1.MonarchTokenizer(languageService, null, languageId, (0, monarchCompile_1.compile)(languageId, language), configurationService);
        }
        function getTokens(tokenizer, lines) {
            const actualTokens = [];
            let state = tokenizer.getInitialState();
            for (const line of lines) {
                const result = tokenizer.tokenize(line, true, state);
                actualTokens.push(result.tokens);
                state = result.endState;
            }
            return actualTokens;
        }
        test('Ensure @rematch and nextEmbedded can be used together in Monarch grammar', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const languageService = disposables.add(new languageService_1.LanguageService());
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            disposables.add(languageService.registerLanguage({ id: 'sql' }));
            disposables.add(languages_1.TokenizationRegistry.register('sql', disposables.add(createMonarchTokenizer(languageService, 'sql', {
                tokenizer: {
                    root: [
                        [/./, 'token']
                    ]
                }
            }, configurationService))));
            const SQL_QUERY_START = '(SELECT|INSERT|UPDATE|DELETE|CREATE|REPLACE|ALTER|WITH)';
            const tokenizer = disposables.add(createMonarchTokenizer(languageService, 'test1', {
                tokenizer: {
                    root: [
                        [`(\"\"\")${SQL_QUERY_START}`, [{ 'token': 'string.quote', }, { token: '@rematch', next: '@endStringWithSQL', nextEmbedded: 'sql', },]],
                        [/(""")$/, [{ token: 'string.quote', next: '@maybeStringIsSQL', },]],
                    ],
                    maybeStringIsSQL: [
                        [/(.*)/, {
                                cases: {
                                    [`${SQL_QUERY_START}\\b.*`]: { token: '@rematch', next: '@endStringWithSQL', nextEmbedded: 'sql', },
                                    '@default': { token: '@rematch', switchTo: '@endDblDocString', },
                                }
                            }],
                    ],
                    endDblDocString: [
                        ['[^\']+', 'string'],
                        ['\\\\\'', 'string'],
                        ['\'\'\'', 'string', '@popall'],
                        ['\'', 'string']
                    ],
                    endStringWithSQL: [[/"""/, { token: 'string.quote', next: '@popall', nextEmbedded: '@pop', },]],
                }
            }, configurationService));
            const lines = [
                `mysql_query("""SELECT * FROM table_name WHERE ds = '<DATEID>'""")`,
                `mysql_query("""`,
                `SELECT *`,
                `FROM table_name`,
                `WHERE ds = '<DATEID>'`,
                `""")`,
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'source.test1', 'test1'),
                    new languages_1.Token(12, 'string.quote.test1', 'test1'),
                    new languages_1.Token(15, 'token.sql', 'sql'),
                    new languages_1.Token(61, 'string.quote.test1', 'test1'),
                    new languages_1.Token(64, 'source.test1', 'test1')
                ],
                [
                    new languages_1.Token(0, 'source.test1', 'test1'),
                    new languages_1.Token(12, 'string.quote.test1', 'test1')
                ],
                [
                    new languages_1.Token(0, 'token.sql', 'sql')
                ],
                [
                    new languages_1.Token(0, 'token.sql', 'sql')
                ],
                [
                    new languages_1.Token(0, 'token.sql', 'sql')
                ],
                [
                    new languages_1.Token(0, 'string.quote.test1', 'test1'),
                    new languages_1.Token(3, 'source.test1', 'test1')
                ]
            ]);
            disposables.dispose();
        });
        test('microsoft/monaco-editor#1235: Empty Line Handling', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            const languageService = disposables.add(new languageService_1.LanguageService());
            const tokenizer = disposables.add(createMonarchTokenizer(languageService, 'test', {
                tokenizer: {
                    root: [
                        { include: '@comments' },
                    ],
                    comments: [
                        [/\/\/$/, 'comment'], // empty single-line comment
                        [/\/\//, 'comment', '@comment_cpp'],
                    ],
                    comment_cpp: [
                        [/(?:[^\\]|(?:\\.))+$/, 'comment', '@pop'],
                        [/.+$/, 'comment'],
                        [/$/, 'comment', '@pop']
                        // No possible rule to detect an empty line and @pop?
                    ],
                },
            }, configurationService));
            const lines = [
                `// This comment \\`,
                `   continues on the following line`,
                ``,
                `// This comment does NOT continue \\\\`,
                `   because the escape char was itself escaped`,
                ``,
                `// This comment DOES continue because \\\\\\`,
                `   the 1st '\\' escapes the 2nd; the 3rd escapes EOL`,
                ``,
                `// This comment continues to the following line \\`,
                ``,
                `But the line was empty. This line should not be commented.`,
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [new languages_1.Token(0, 'comment.test', 'test')],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [new languages_1.Token(0, 'source.test', 'test')],
                [],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [],
                [new languages_1.Token(0, 'comment.test', 'test')],
                [],
                [new languages_1.Token(0, 'source.test', 'test')]
            ]);
            disposables.dispose();
        });
        test('microsoft/monaco-editor#2265: Exit a state at end of line', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            const languageService = disposables.add(new languageService_1.LanguageService());
            const tokenizer = disposables.add(createMonarchTokenizer(languageService, 'test', {
                includeLF: true,
                tokenizer: {
                    root: [
                        [/^\*/, '', '@inner'],
                        [/\:\*/, '', '@inner'],
                        [/[^*:]+/, 'string'],
                        [/[*:]/, 'string']
                    ],
                    inner: [
                        [/\n/, '', '@pop'],
                        [/\d+/, 'number'],
                        [/[^\d]+/, '']
                    ]
                }
            }, configurationService));
            const lines = [
                `PRINT 10 * 20`,
                `*FX200, 3`,
                `PRINT 2*3:*FX200, 3`
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'string.test', 'test'),
                ],
                [
                    new languages_1.Token(0, '', 'test'),
                    new languages_1.Token(3, 'number.test', 'test'),
                    new languages_1.Token(6, '', 'test'),
                    new languages_1.Token(8, 'number.test', 'test'),
                ],
                [
                    new languages_1.Token(0, 'string.test', 'test'),
                    new languages_1.Token(9, '', 'test'),
                    new languages_1.Token(13, 'number.test', 'test'),
                    new languages_1.Token(16, '', 'test'),
                    new languages_1.Token(18, 'number.test', 'test'),
                ]
            ]);
            disposables.dispose();
        });
        test('issue #115662: monarchCompile function need an extra option which can control replacement', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            const languageService = disposables.add(new languageService_1.LanguageService());
            const tokenizer1 = disposables.add(createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                uselessReplaceKey1: '@uselessReplaceKey2',
                uselessReplaceKey2: '@uselessReplaceKey3',
                uselessReplaceKey3: '@uselessReplaceKey4',
                uselessReplaceKey4: '@uselessReplaceKey5',
                uselessReplaceKey5: '@ham' || '',
                tokenizer: {
                    root: [
                        {
                            regex: /@\w+/.test('@ham')
                                ? new RegExp(`^${'@uselessReplaceKey1'}$`)
                                : new RegExp(`^${'@ham'}$`),
                            action: { token: 'ham' }
                        },
                    ],
                },
            }, configurationService));
            const tokenizer2 = disposables.add(createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                tokenizer: {
                    root: [
                        {
                            regex: /@@ham/,
                            action: { token: 'ham' }
                        },
                    ],
                },
            }, configurationService));
            const lines = [
                `@ham`
            ];
            const actualTokens1 = getTokens(tokenizer1, lines);
            assert.deepStrictEqual(actualTokens1, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ]
            ]);
            const actualTokens2 = getTokens(tokenizer2, lines);
            assert.deepStrictEqual(actualTokens2, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ]
            ]);
            disposables.dispose();
        });
        test('microsoft/monaco-editor#2424: Allow to target @@', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            const languageService = disposables.add(new languageService_1.LanguageService());
            const tokenizer = disposables.add(createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                tokenizer: {
                    root: [
                        {
                            regex: /@@@@/,
                            action: { token: 'ham' }
                        },
                    ],
                },
            }, configurationService));
            const lines = [
                `@@`
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ]
            ]);
            disposables.dispose();
        });
        test('microsoft/monaco-editor#3025: Check maxTokenizationLineLength before tokenizing', async () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            const languageService = disposables.add(new languageService_1.LanguageService());
            // Set maxTokenizationLineLength to 4 so that "ham" works but "hamham" would fail
            await configurationService.updateValue('editor.maxTokenizationLineLength', 4);
            const tokenizer = disposables.add(createMonarchTokenizer(languageService, 'test', {
                tokenizer: {
                    root: [
                        {
                            regex: /ham/,
                            action: { token: 'ham' }
                        },
                    ],
                },
            }, configurationService));
            const lines = [
                'ham', // length 3, should be tokenized
                'hamham' // length 6, should NOT be tokenized
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [
                    new languages_1.Token(0, 'ham.test', 'test'),
                ], [
                    new languages_1.Token(0, '', 'test')
                ]
            ]);
            disposables.dispose();
        });
        test('microsoft/monaco-editor#3128: allow state access within rules', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new standaloneServices_1.StandaloneConfigurationService(new log_1.NullLogService());
            const languageService = disposables.add(new languageService_1.LanguageService());
            const tokenizer = disposables.add(createMonarchTokenizer(languageService, 'test', {
                ignoreCase: false,
                encoding: /u|u8|U|L/,
                tokenizer: {
                    root: [
                        // C++ 11 Raw String
                        [/@encoding?R\"(?:([^ ()\\\t]*))\(/, { token: 'string.raw.begin', next: '@raw.$1' }],
                    ],
                    raw: [
                        [/.*\)$S2\"/, 'string.raw', '@pop'],
                        [/.*/, 'string.raw']
                    ],
                },
            }, configurationService));
            const lines = [
                `int main(){`,
                ``,
                `	auto s = R""""(`,
                `	Hello World`,
                `	)"""";`,
                ``,
                `	std::cout << "hello";`,
                ``,
                `}`,
            ];
            const actualTokens = getTokens(tokenizer, lines);
            assert.deepStrictEqual(actualTokens, [
                [new languages_1.Token(0, 'source.test', 'test')],
                [],
                [new languages_1.Token(0, 'source.test', 'test'), new languages_1.Token(10, 'string.raw.begin.test', 'test')],
                [new languages_1.Token(0, 'string.raw.test', 'test')],
                [new languages_1.Token(0, 'string.raw.test', 'test'), new languages_1.Token(6, 'source.test', 'test')],
                [],
                [new languages_1.Token(0, 'source.test', 'test')],
                [],
                [new languages_1.Token(0, 'source.test', 'test')],
            ]);
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYXJjaC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvdGVzdC9icm93c2VyL21vbmFyY2gudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUVyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxzQkFBc0IsQ0FBQyxlQUFpQyxFQUFFLFVBQWtCLEVBQUUsUUFBMEIsRUFBRSxvQkFBMkM7WUFDN0osT0FBTyxJQUFJLCtCQUFnQixDQUFDLGVBQWUsRUFBRSxJQUFLLEVBQUUsVUFBVSxFQUFFLElBQUEsd0JBQU8sRUFBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUN0SCxDQUFDO1FBRUQsU0FBUyxTQUFTLENBQUMsU0FBMkIsRUFBRSxLQUFlO1lBQzlELE1BQU0sWUFBWSxHQUFjLEVBQUUsQ0FBQztZQUNuQyxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNyRCxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDekIsQ0FBQztZQUNELE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxJQUFJLENBQUMsMEVBQTBFLEVBQUUsR0FBRyxFQUFFO1lBQ3JGLE1BQU0sV0FBVyxHQUFHLElBQUksMkJB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