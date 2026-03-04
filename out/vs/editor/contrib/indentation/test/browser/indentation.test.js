/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/testTextModel", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/nullTokenize", "vs/editor/contrib/indentation/browser/indentation", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/browser/testCommand", "vs/editor/test/common/modes/supports/indentationRules", "vs/editor/test/common/modes/supports/onEnterRules", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/test/common/modes/supports/bracketRules", "vs/editor/test/common/modes/supports/autoClosingPairsRules"], function (require, exports, assert, lifecycle_1, utils_1, languageConfigurationRegistry_1, testTextModel_1, range_1, selection_1, languages_1, language_1, nullTokenize_1, indentation_1, testCodeEditor_1, testCommand_1, indentationRules_1, onEnterRules_1, cursorTypeOperations_1, bracketRules_1, autoClosingPairsRules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Language;
    (function (Language) {
        Language["TypeScript"] = "ts-test";
        Language["Ruby"] = "ruby-test";
        Language["PHP"] = "php-test";
        Language["Go"] = "go-test";
        Language["CPP"] = "cpp-test";
        Language["HTML"] = "html-test";
        Language["VB"] = "vb-test";
        Language["Latex"] = "latex-test";
        Language["Lua"] = "lua-test";
    })(Language || (Language = {}));
    function testIndentationToSpacesCommand(lines, selection, tabSize, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new indentation_1.IndentationToSpacesCommand(sel, tabSize), expectedLines, expectedSelection);
    }
    function testIndentationToTabsCommand(lines, selection, tabSize, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new indentation_1.IndentationToTabsCommand(sel, tabSize), expectedLines, expectedSelection);
    }
    function registerLanguage(instantiationService, language) {
        const disposables = new lifecycle_1.DisposableStore();
        const languageService = instantiationService.get(language_1.ILanguageService);
        disposables.add(registerLanguageConfiguration(instantiationService, language));
        disposables.add(languageService.registerLanguage({ id: language }));
        return disposables;
    }
    function registerLanguageConfiguration(instantiationService, language) {
        const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        switch (language) {
            case Language.TypeScript:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.typescriptBracketRules,
                    comments: {
                        lineComment: '//',
                        blockComment: ['/*', '*/']
                    },
                    indentationRules: indentationRules_1.javascriptIndentationRules,
                    onEnterRules: onEnterRules_1.javascriptOnEnterRules
                });
            case Language.Ruby:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.rubyBracketRules,
                    indentationRules: indentationRules_1.rubyIndentationRules,
                });
            case Language.PHP:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.phpBracketRules,
                    indentationRules: indentationRules_1.phpIndentationRules,
                    onEnterRules: onEnterRules_1.phpOnEnterRules
                });
            case Language.Go:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.goBracketRules,
                    indentationRules: indentationRules_1.goIndentationRules
                });
            case Language.CPP:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.cppBracketRules,
                    onEnterRules: onEnterRules_1.cppOnEnterRules
                });
            case Language.HTML:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.htmlBracketRules,
                    indentationRules: indentationRules_1.htmlIndentationRules,
                    onEnterRules: onEnterRules_1.htmlOnEnterRules
                });
            case Language.VB:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.vbBracketRules,
                });
            case Language.Latex:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.latexBracketRules,
                    autoClosingPairs: autoClosingPairsRules_1.latexAutoClosingPairsRules,
                    indentationRules: indentationRules_1.latexIndentationRules
                });
            case Language.Lua:
                return languageConfigurationService.register(language, {
                    brackets: bracketRules_1.luaBracketRules,
                    indentationRules: indentationRules_1.luaIndentationRules
                });
        }
    }
    function registerTokenizationSupport(instantiationService, tokens, languageId) {
        let lineIndex = 0;
        const languageService = instantiationService.get(language_1.ILanguageService);
        const tokenizationSupport = {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: undefined,
            tokenizeEncoded: (line, hasEOL, state) => {
                const tokensOnLine = tokens[lineIndex++];
                const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
                const result = new Uint32Array(2 * tokensOnLine.length);
                for (let i = 0; i < tokensOnLine.length; i++) {
                    result[2 * i] = tokensOnLine[i].startIndex;
                    result[2 * i + 1] =
                        ((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                            | (tokensOnLine[i].standardTokenType << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */));
                }
                return new languages_1.EncodedTokenizationResult(result, state);
            }
        };
        return languages_1.TokenizationRegistry.register(languageId, tokenizationSupport);
    }
    suite('Change Indentation to Spaces - TypeScript/Javascript', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('single tabs only at start of line', function () {
            testIndentationToSpacesCommand([
                'first',
                'second line',
                'third line',
                '\tfourth line',
                '\tfifth'
            ], new selection_1.Selection(2, 3, 2, 3), 4, [
                'first',
                'second line',
                'third line',
                '    fourth line',
                '    fifth'
            ], new selection_1.Selection(2, 3, 2, 3));
        });
        test('multiple tabs at start of line', function () {
            testIndentationToSpacesCommand([
                '\t\tfirst',
                '\tsecond line',
                '\t\t\t third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5), 3, [
                '      first',
                '   second line',
                '          third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 9, 1, 9));
        });
        test('multiple tabs', function () {
            testIndentationToSpacesCommand([
                '\t\tfirst\t',
                '\tsecond  \t line \t',
                '\t\t\t third line',
                ' \tfourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5), 2, [
                '    first\t',
                '  second  \t line \t',
                '       third line',
                '   fourth line',
                'fifth'
            ], new selection_1.Selection(1, 7, 1, 7));
        });
        test('empty lines', function () {
            testIndentationToSpacesCommand([
                '\t\t\t',
                '\t',
                '\t\t'
            ], new selection_1.Selection(1, 4, 1, 4), 2, [
                '      ',
                '  ',
                '    '
            ], new selection_1.Selection(1, 4, 1, 4));
        });
    });
    suite('Change Indentation to Tabs -  TypeScript/Javascript', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('spaces only at start of line', function () {
            testIndentationToTabsCommand([
                '    first',
                'second line',
                '    third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3), 4, [
                '\tfirst',
                'second line',
                '\tthird line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3));
        });
        test('multiple spaces at start of line', function () {
            testIndentationToTabsCommand([
                'first',
                '   second line',
                '          third line',
                'fourth line',
                '     fifth'
            ], new selection_1.Selection(1, 5, 1, 5), 3, [
                'first',
                '\tsecond line',
                '\t\t\t third line',
                'fourth line',
                '\t  fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('multiple spaces', function () {
            testIndentationToTabsCommand([
                '      first   ',
                '  second     line \t',
                '       third line',
                '   fourth line',
                'fifth'
            ], new selection_1.Selection(1, 8, 1, 8), 2, [
                '\t\t\tfirst   ',
                '\tsecond     line \t',
                '\t\t\t third line',
                '\t fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('issue #45996', function () {
            testIndentationToSpacesCommand([
                '\tabc',
            ], new selection_1.Selection(1, 3, 1, 3), 4, [
                '    abc',
            ], new selection_1.Selection(1, 6, 1, 6));
        });
    });
    suite('Indent With Tab - TypeScript/JavaScript', () => {
        const languageId = Language.TypeScript;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #63388: perserve correct indentation on tab 1', () => {
            // https://github.com/microsoft/vscode/issues/63388
            const model = (0, testTextModel_1.createTextModel)([
                '/*',
                ' * Comment',
                ' * /',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 1, 3, 5));
                editor.executeCommands('editor.action.indentLines', cursorTypeOperations_1.TypeOperations.indent(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
                assert.strictEqual(model.getValue(), [
                    '    /*',
                    '     * Comment',
                    '     * /',
                ].join('\n'));
            });
        });
        test.skip('issue #63388: perserve correct indentation on tab 2', () => {
            // https://github.com/microsoft/vscode/issues/63388
            const model = (0, testTextModel_1.createTextModel)([
                'switch (something) {',
                '  case 1:',
                '    whatever();',
                '    break;',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 1, 5, 2));
                editor.executeCommands('editor.action.indentLines', cursorTypeOperations_1.TypeOperations.indent(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
                assert.strictEqual(model.getValue(), [
                    '    switch (something) {',
                    '        case 1:',
                    '            whatever();',
                    '            break;',
                    '    }',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Paste - TypeScript/JavaScript', () => {
        const languageId = Language.TypeScript;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #119225: Do not add extra leading space when pasting JSDoc', () => {
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                const pasteText = [
                    '/**',
                    ' * JSDoc',
                    ' */',
                    'function a() {}'
                ].join('\n');
                const tokens = [
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 3, standardTokenType: 1 /* StandardTokenType.Comment */ },
                    ],
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 2, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 8, standardTokenType: 1 /* StandardTokenType.Comment */ },
                    ],
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 1, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 3, standardTokenType: 0 /* StandardTokenType.Other */ },
                    ],
                    [
                        { startIndex: 0, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 8, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 9, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 10, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 11, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 12, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 13, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 14, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 15, standardTokenType: 0 /* StandardTokenType.Other */ },
                    ]
                ];
                disposables.add(registerLanguage(instantiationService, languageId));
                disposables.add(registerTokenizationSupport(instantiationService, tokens, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(pasteText, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 16));
                assert.strictEqual(model.getValue(), pasteText);
            });
        });
        test('issue #167299: Blank line removes indent', () => {
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                // no need for tokenization because there are no comments
                const pasteText = [
                    '',
                    'export type IncludeReference =',
                    '	| BaseReference',
                    '	| SelfReference',
                    '	| RelativeReference;',
                    '',
                    'export const enum IncludeReferenceKind {',
                    '	Base,',
                    '	Self,',
                    '	RelativeReference,',
                    '}'
                ].join('\n');
                disposables.add(registerLanguage(instantiationService, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(pasteText, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 11, 2));
                assert.strictEqual(model.getValue(), pasteText);
            });
        });
        test('issue #29803: do not indent when pasting text with only one line', () => {
            // https://github.com/microsoft/vscode/issues/29803
            const model = (0, testTextModel_1.createTextModel)([
                'const linkHandler = new Class(a, b, c,',
                '    d)'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
                const text = ', null';
                viewModel.paste(text, true, undefined, 'keyboard');
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                autoIndentOnPasteController.trigger(new range_1.Range(2, 6, 2, 11));
                assert.strictEqual(model.getValue(), [
                    'const linkHandler = new Class(a, b, c,',
                    '    d, null)'
                ].join('\n'));
            });
        });
        test('issue #29753: incorrect indentation after comment', () => {
            // https://github.com/microsoft/vscode/issues/29753
            const model = (0, testTextModel_1.createTextModel)([
                'class A {',
                '    /**',
                '     * used only for debug purposes.',
                '     */',
                '    private _codeInfo: KeyMapping[];',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(5, 24, 5, 34));
                const text = 'IMacLinuxKeyMapping';
                viewModel.paste(text, true, undefined, 'keyboard');
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                autoIndentOnPasteController.trigger(new range_1.Range(5, 24, 5, 43));
                assert.strictEqual(model.getValue(), [
                    'class A {',
                    '    /**',
                    '     * used only for debug purposes.',
                    '     */',
                    '    private _codeInfo: IMacLinuxKeyMapping[];',
                    '}',
                ].join('\n'));
            });
        });
        test('issue #29753: incorrect indentation of header comment', () => {
            // https://github.com/microsoft/vscode/issues/29753
            const model = (0, testTextModel_1.createTextModel)('', languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                const text = [
                    '/*----------------',
                    ' *  Copyright (c) ',
                    ' *  Licensed under ...',
                    ' *-----------------*/',
                ].join('\n');
                viewModel.paste(text, true, undefined, 'keyboard');
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 22));
                assert.strictEqual(model.getValue(), text);
            });
        });
        // Failing tests found in issues...
        test.skip('issue #181065: Incorrect paste of object within comment', () => {
            // https://github.com/microsoft/vscode/issues/181065
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                const text = [
                    '/**',
                    ' * @typedef {',
                    ' * }',
                    ' */'
                ].join('\n');
                const tokens = [
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 3, standardTokenType: 1 /* StandardTokenType.Comment */ },
                    ],
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 2, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 3, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 11, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 12, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 13, standardTokenType: 0 /* StandardTokenType.Other */ },
                    ],
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 2, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 3, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 4, standardTokenType: 0 /* StandardTokenType.Other */ },
                    ],
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 1, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 3, standardTokenType: 0 /* StandardTokenType.Other */ },
                    ]
                ];
                disposables.add(registerLanguage(instantiationService, languageId));
                disposables.add(registerTokenizationSupport(instantiationService, tokens, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 4));
                assert.strictEqual(model.getValue(), text);
            });
        });
        test.skip('issue #86301: preserve cursor at inserted indentation level', () => {
            // https://github.com/microsoft/vscode/issues/86301
            const model = (0, testTextModel_1.createTextModel)([
                '() => {',
                '',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                const text = [
                    '() => {',
                    '',
                    '}',
                    ''
                ].join('\n');
                disposables.add(registerLanguage(instantiationService, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(2, 1, 5, 1));
                // notes:
                // why is line 3 not indented to the same level as line 2?
                // looks like the indentation is inserted correctly at line 5, but the cursor does not appear at the maximum indentation level?
                assert.strictEqual(model.getValue(), [
                    '() => {',
                    '    () => {',
                    '    ', // <- should also be indented
                    '    }',
                    '    ', // <- cursor should be at the end of the indentation
                    '}',
                ].join('\n'));
                const selection = viewModel.getSelection();
                assert.deepStrictEqual(selection, new selection_1.Selection(5, 5, 5, 5));
            });
        });
        test.skip('issue #85781: indent line with extra white space', () => {
            // https://github.com/microsoft/vscode/issues/85781
            // note: still to determine whether this is a bug or not
            const model = (0, testTextModel_1.createTextModel)([
                '() => {',
                '    console.log("a");',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                const text = [
                    '() => {',
                    '    console.log("b")',
                    '}',
                    ' '
                ].join('\n');
                disposables.add(registerLanguage(instantiationService, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                // todo@aiday-mar, make sure range is correct, and make test work as in real life
                autoIndentOnPasteController.trigger(new range_1.Range(2, 5, 5, 6));
                assert.strictEqual(model.getValue(), [
                    '() => {',
                    '    () => {',
                    '        console.log("b")',
                    '    }',
                    '    console.log("a");',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #29589: incorrect indentation of closing brace on paste', () => {
            // https://github.com/microsoft/vscode/issues/29589
            const model = (0, testTextModel_1.createTextModel)('', languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                const text = [
                    'function makeSub(a,b) {',
                    'subsent = sent.substring(a,b);',
                    'return subsent;',
                    '}',
                ].join('\n');
                disposables.add(registerLanguage(instantiationService, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                // todo@aiday-mar, make sure range is correct, and make test work as in real life
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 2));
                assert.strictEqual(model.getValue(), [
                    'function makeSub(a,b) {',
                    'subsent = sent.substring(a,b);',
                    'return subsent;',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #201420: incorrect indentation when first line is comment', () => {
            // https://github.com/microsoft/vscode/issues/201420
            const model = (0, testTextModel_1.createTextModel)([
                'function bar() {',
                '',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                const tokens = [
                    [
                        { startIndex: 0, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 8, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 9, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 12, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 13, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 14, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 15, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 16, standardTokenType: 0 /* StandardTokenType.Other */ }
                    ],
                    [
                        { startIndex: 0, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 2, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 3, standardTokenType: 1 /* StandardTokenType.Comment */ },
                        { startIndex: 10, standardTokenType: 1 /* StandardTokenType.Comment */ }
                    ],
                    [
                        { startIndex: 0, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 5, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 6, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 9, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 10, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 11, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 12, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 14, standardTokenType: 0 /* StandardTokenType.Other */ }
                    ],
                    [
                        { startIndex: 0, standardTokenType: 0 /* StandardTokenType.Other */ },
                        { startIndex: 1, standardTokenType: 0 /* StandardTokenType.Other */ }
                    ]
                ];
                disposables.add(registerLanguage(instantiationService, languageId));
                disposables.add(registerTokenizationSupport(instantiationService, tokens, languageId));
                editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                const text = [
                    '// comment',
                    'const foo = 42',
                ].join('\n');
                disposables.add(registerLanguage(instantiationService, languageId));
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(2, 1, 3, 15));
                assert.strictEqual(model.getValue(), [
                    'function bar() {',
                    '    // comment',
                    '    const foo = 42',
                    '}',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - TypeScript/JavaScript', () => {
        const languageId = Language.TypeScript;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // Failing tests from issues...
        test('issue #208215: indent after arrow function', () => {
            // https://github.com/microsoft/vscode/issues/208215
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                viewModel.type('const add1 = (n) =>');
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const add1 = (n) =>',
                    '    ',
                ].join('\n'));
            });
        });
        test('issue #208215: indent after arrow function 2', () => {
            // https://github.com/microsoft/vscode/issues/208215
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3, 4, 5];',
                'array.map(',
                '    v =>',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(3, 9, 3, 9));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3, 4, 5];',
                    'array.map(',
                    '    v =>',
                    '        '
                ].join('\n'));
            });
        });
        test('issue #116843: indent after arrow function', () => {
            // https://github.com/microsoft/vscode/issues/116843
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                viewModel.type([
                    'const add1 = (n) =>',
                    '    n + 1;',
                ].join('\n'));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const add1 = (n) =>',
                    '    n + 1;',
                    '',
                ].join('\n'));
            });
        });
        test('issue #29755: do not add indentation on enter if indentation is already valid', () => {
            //https://github.com/microsoft/vscode/issues/29755
            const model = (0, testTextModel_1.createTextModel)([
                'function f() {',
                '    const one = 1;',
                '    const two = 2;',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(3, 1, 3, 1));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function f() {',
                    '    const one = 1;',
                    '',
                    '    const two = 2;',
                    '}',
                ].join('\n'));
            });
        });
        test('issue #36090', () => {
            // https://github.com/microsoft/vscode/issues/36090
            const model = (0, testTextModel_1.createTextModel)([
                'class ItemCtrl {',
                '    getPropertiesByItemId(id) {',
                '        return this.fetchItem(id)',
                '            .then(item => {',
                '                return this.getPropertiesOfItem(item);',
                '            });',
                '    }',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'advanced' }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(7, 6, 7, 6));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'class ItemCtrl {',
                    '    getPropertiesByItemId(id) {',
                    '        return this.fetchItem(id)',
                    '            .then(item => {',
                    '                return this.getPropertiesOfItem(item);',
                    '            });',
                    '    }',
                    '    ',
                    '}',
                ].join('\n'));
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(8, 5, 8, 5));
            });
        });
        test('issue #115304: indent block comment onEnter', () => {
            // https://github.com/microsoft/vscode/issues/115304
            const model = (0, testTextModel_1.createTextModel)([
                '/** */',
                'function f() {}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'advanced' }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 4, 1, 4));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '/**',
                    ' * ',
                    ' */',
                    'function f() {}',
                ].join('\n'));
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(2, 4, 2, 4));
            });
        });
        test('issue #43244: indent when lambda arrow function is detected, outdent when end is reached', () => {
            // https://github.com/microsoft/vscode/issues/43244
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3, 4, 5];',
                'array.map(_)'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 12, 2, 12));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3, 4, 5];',
                    'array.map(_',
                    '    ',
                    ')'
                ].join('\n'));
            });
        });
        test('issue #43244: incorrect indentation after if/for/while without braces', () => {
            // https://github.com/microsoft/vscode/issues/43244
            const model = (0, testTextModel_1.createTextModel)([
                'function f() {',
                '    if (condition)',
                '}'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 19, 2, 19));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function f() {',
                    '    if (condition)',
                    '        ',
                    '}',
                ].join('\n'));
                viewModel.type("return;");
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function f() {',
                    '    if (condition)',
                    '        return;',
                    '    ',
                    '}',
                ].join('\n'));
            });
        });
        // Failing tests...
        test.skip('issue #208232: incorrect indentation inside of comments', () => {
            // https://github.com/microsoft/vscode/issues/208232
            const model = (0, testTextModel_1.createTextModel)([
                '/**',
                'indentation done for {',
                '*/'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 23, 2, 23));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '/**',
                    'indentation done for {',
                    '',
                    '*/'
                ].join('\n'));
            });
        });
        test.skip('issue #43244: indent after equal sign is detected', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // issue: Should indent after an equal sign is detected followed by whitespace characters.
            // This should be outdented when a semi-colon is detected indicating the end of the assignment.
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array ='
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 14, 1, 14));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array =',
                    '    '
                ].join('\n'));
            });
        });
        test.skip('issue #43244: indent after dot detected after object/array signifying a method call', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // issue: When a dot is written, we should detect that this is a method call and indent accordingly
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3];',
                'array.'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 7, 2, 7));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3];',
                    'array.',
                    '    '
                ].join('\n'));
            });
        });
        test.skip('issue #43244: indent after dot detected on a subsequent line after object/array signifying a method call', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // issue: When a dot is written, we should detect that this is a method call and indent accordingly
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 7, 2, 7));
                viewModel.type("\n", 'keyboard');
                viewModel.type(".");
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .'
                ].join('\n'));
            });
        });
        test.skip('issue #43244: keep indentation when methods called on object/array', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // Currently passes, but should pass with all the tests above too
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
                '    .filter(() => true)'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 24, 2, 24));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .filter(() => true)',
                    '    '
                ].join('\n'));
            });
        });
        test.skip('issue #43244: keep indentation when chained methods called on object/array', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // When the call chain is not finished yet, and we type a dot, we do not want to change the indentation
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
                '    .filter(() => true)',
                '    '
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(3, 5, 3, 5));
                viewModel.type(".");
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .filter(() => true)',
                    '    .' // here we don't want to increase the indentation because we have chained methods
                ].join('\n'));
            });
        });
        test.skip('issue #43244: outdent when a semi-color is detected indicating the end of the assignment', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
                '    .filter(() => true);'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 25, 2, 25));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .filter(() => true);',
                    ''
                ].join('\n'));
            });
        });
        test.skip('issue #40115: keep indentation when added', () => {
            // https://github.com/microsoft/vscode/issues/40115
            const model = (0, testTextModel_1.createTextModel)('function foo() {}', languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 17, 1, 17));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function foo() {',
                    '    ',
                    '}',
                ].join('\n'));
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function foo() {',
                    '    ',
                    '    ',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #193875: incorrect indentation on enter', () => {
            // https://github.com/microsoft/vscode/issues/193875
            const model = (0, testTextModel_1.createTextModel)([
                '{',
                '    for(;;)',
                '    for(;;) {}',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(3, 14, 3, 14));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '{',
                    '    for(;;)',
                    '    for(;;) {',
                    '        ',
                    '    }',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #67678: indent on typing curly brace', () => {
            // https://github.com/microsoft/vscode/issues/67678
            const model = (0, testTextModel_1.createTextModel)([
                'if (true) {',
                'console.log("a")',
                'console.log("b")',
                '',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(4, 1, 4, 1));
                viewModel.type("}", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'if (true) {',
                    '    console.log("a")',
                    '    console.log("b")',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #46401: outdent when encountering bracket on line - allman style indentation', () => {
            // https://github.com/microsoft/vscode/issues/46401
            const model = (0, testTextModel_1.createTextModel)([
                'if (true)',
                '    ',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                viewModel.type("{}", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'if (true)',
                    '{}',
                ].join('\n'));
                editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'if (true)',
                    '{',
                    '    ',
                    '}'
                ].join('\n'));
            });
        });
        test.skip('issue #125261: typing closing brace does not keep the current indentation', () => {
            // https://github.com/microsoft/vscode/issues/125261
            const model = (0, testTextModel_1.createTextModel)([
                'foo {',
                '    ',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "keep" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                viewModel.type("}", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'foo {',
                    '}',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - Ruby', () => {
        const languageId = Language.Ruby;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #198350: in or when incorrectly match non keywords for Ruby', () => {
            // https://github.com/microsoft/vscode/issues/198350
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                viewModel.type("def foo\n        i");
                viewModel.type("n", 'keyboard');
                assert.strictEqual(model.getValue(), "def foo\n        in");
                viewModel.type(" ", 'keyboard');
                assert.strictEqual(model.getValue(), "def foo\nin ");
                viewModel.model.setValue("");
                viewModel.type("  # in");
                assert.strictEqual(model.getValue(), "  # in");
                viewModel.type(" ", 'keyboard');
                assert.strictEqual(model.getValue(), "  # in ");
            });
        });
        // Failing tests...
        test.skip('issue #199846: in or when incorrectly match non keywords for Ruby', () => {
            // https://github.com/microsoft/vscode/issues/199846
            // explanation: happening because the # is detected probably as a comment
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                viewModel.type("method('#foo') do");
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    "method('#foo') do",
                    "    "
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - PHP', () => {
        const languageId = Language.PHP;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #199050: should not indent after { detected in a string', () => {
            // https://github.com/microsoft/vscode/issues/199050
            const model = (0, testTextModel_1.createTextModel)("$phrase = preg_replace('#(\{1|%s).*#su', '', $phrase);", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 54, 1, 54));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    "$phrase = preg_replace('#(\{1|%s).*#su', '', $phrase);",
                    ""
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Paste - Go', () => {
        const languageId = Language.Go;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #199050: should not indent after { detected in a string', () => {
            // https://github.com/microsoft/vscode/issues/199050
            const model = (0, testTextModel_1.createTextModel)([
                'var s = `',
                'quick  brown',
                'fox',
                '`',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(3, 1, 3, 1));
                const text = '  ';
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(3, 1, 3, 3));
                assert.strictEqual(model.getValue(), [
                    'var s = `',
                    'quick  brown',
                    '  fox',
                    '`',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - CPP', () => {
        const languageId = Language.CPP;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #178334: incorrect outdent of } when signature spans multiple lines', () => {
            // https://github.com/microsoft/vscode/issues/178334
            const model = (0, testTextModel_1.createTextModel)([
                'int WINAPI WinMain(bool instance,',
                '    int nshowcmd) {}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 20, 2, 20));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'int WINAPI WinMain(bool instance,',
                    '    int nshowcmd) {',
                    '    ',
                    '}'
                ].join('\n'));
            });
        });
        test.skip('issue #118929: incorrect indent when // follows curly brace', () => {
            // https://github.com/microsoft/vscode/issues/118929
            const model = (0, testTextModel_1.createTextModel)([
                'if (true) { // jaja',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 20, 1, 20));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'if (true) { // jaja',
                    '    ',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #111265: auto indentation set to "none" still changes the indentation', () => {
            // https://github.com/microsoft/vscode/issues/111265
            const model = (0, testTextModel_1.createTextModel)([
                'int func() {',
                '		',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "none" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 3, 2, 3));
                viewModel.type("}", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'int func() {',
                    '		}',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - HTML', () => {
        const languageId = Language.HTML;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #61510: incorrect indentation after // in html file', () => {
            // https://github.com/microsoft/vscode/issues/178334
            const model = (0, testTextModel_1.createTextModel)([
                '<pre>',
                '  foo //I press <Enter> at the end of this line',
                '</pre>',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 48, 2, 48));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '<pre>',
                    '  foo //I press <Enter> at the end of this line',
                    '  ',
                    '</pre>',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - Visual Basic', () => {
        const languageId = Language.VB;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #118932: no indentation in visual basic files', () => {
            // https://github.com/microsoft/vscode/issues/118932
            const model = (0, testTextModel_1.createTextModel)([
                'if True then',
                '    Some code',
                '    end i',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(3, 10, 3, 10));
                viewModel.type("f", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'if True then',
                    '    Some code',
                    'end if',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - Latex', () => {
        const languageId = Language.Latex;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #178075: no auto closing pair when indentation done', () => {
            // https://github.com/microsoft/vscode/issues/178075
            const model = (0, testTextModel_1.createTextModel)([
                '\\begin{theorem}',
                '    \\end',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(2, 9, 2, 9));
                viewModel.type("{", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '\\begin{theorem}',
                    '\\end{}',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - Lua', () => {
        const languageId = Language.Lua;
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #178075: no auto closing pair when indentation done', () => {
            // https://github.com/microsoft/vscode/issues/178075
            const model = (0, testTextModel_1.createTextModel)([
                'print("asdf function asdf")',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                disposables.add(registerLanguage(instantiationService, languageId));
                editor.setSelection(new selection_1.Selection(1, 28, 1, 28));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'print("asdf function asdf")',
                    ''
                ].join('\n'));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2luZGVudGF0aW9uL3Rlc3QvYnJvd3Nlci9pbmRlbnRhdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBdUJoRyxJQUFLLFFBVUo7SUFWRCxXQUFLLFFBQVE7UUFDWixrQ0FBc0IsQ0FBQTtRQUN0Qiw4QkFBa0IsQ0FBQTtRQUNsQiw0QkFBZ0IsQ0FBQTtRQUNoQiwwQkFBYyxDQUFBO1FBQ2QsNEJBQWdCLENBQUE7UUFDaEIsOEJBQWtCLENBQUE7UUFDbEIsMEJBQWMsQ0FBQTtRQUNkLGdDQUFvQixDQUFBO1FBQ3BCLDRCQUFnQixDQUFBO0lBQ2pCLENBQUMsRUFWSSxRQUFRLEtBQVIsUUFBUSxRQVVaO0lBRUQsU0FBUyw4QkFBOEIsQ0FBQyxLQUFlLEVBQUUsU0FBb0IsRUFBRSxPQUFlLEVBQUUsYUFBdUIsRUFBRSxpQkFBNEI7UUFDcEosSUFBQSx5QkFBVyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSx3Q0FBMEIsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDeEksQ0FBQztJQUVELFNBQVMsNEJBQTRCLENBQUMsS0FBZSxFQUFFLFNBQW9CLEVBQUUsT0FBZSxFQUFFLGFBQXVCLEVBQUUsaUJBQTRCO1FBQ2xKLElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksc0NBQXdCLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUFFLGFB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