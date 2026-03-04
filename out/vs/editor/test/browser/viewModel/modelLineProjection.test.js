/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/common/modelLineProjectionData", "vs/editor/common/viewModel/modelLineProjection", "vs/editor/common/viewModel/monospaceLineBreaksComputer", "vs/editor/common/viewModel/viewModelLines", "vs/editor/test/browser/config/testConfiguration", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, position_1, range_1, languages, nullTokenize_1, modelLineProjectionData_1, modelLineProjection_1, monospaceLineBreaksComputer_1, viewModelLines_1, testConfiguration_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor ViewModel - SplitLinesCollection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('SplitLine', () => {
            let model1 = createModel('My First LineMy Second LineAnd another one');
            let line1 = createSplitLine([13, 14, 15], [13, 13 + 14, 13 + 14 + 15], 0);
            assert.strictEqual(line1.getViewLineCount(), 3);
            assert.strictEqual(line1.getViewLineContent(model1, 1, 0), 'My First Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 1), 'My Second Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 2), 'And another one');
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 0), 14);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 1), 15);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 2), 16);
            for (let col = 1; col <= 14; col++) {
                assert.strictEqual(line1.getModelColumnOfViewPosition(0, col), col, 'getInputColumnOfOutputPosition(0, ' + col + ')');
            }
            for (let col = 1; col <= 15; col++) {
                assert.strictEqual(line1.getModelColumnOfViewPosition(1, col), 13 + col, 'getInputColumnOfOutputPosition(1, ' + col + ')');
            }
            for (let col = 1; col <= 16; col++) {
                assert.strictEqual(line1.getModelColumnOfViewPosition(2, col), 13 + 14 + col, 'getInputColumnOfOutputPosition(2, ' + col + ')');
            }
            for (let col = 1; col <= 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(0, col), 'getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13; col <= 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(1, col - 13), 'getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13 + 14; col <= 15 + 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(2, col - 13 - 14), 'getOutputPositionOfInputPosition(' + col + ')');
            }
            model1 = createModel('My First LineMy Second LineAnd another one');
            line1 = createSplitLine([13, 14, 15], [13, 13 + 14, 13 + 14 + 15], 4);
            assert.strictEqual(line1.getViewLineCount(), 3);
            assert.strictEqual(line1.getViewLineContent(model1, 1, 0), 'My First Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 1), '    My Second Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 2), '    And another one');
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 0), 14);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 1), 19);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 2), 20);
            const actualViewColumnMapping = [];
            for (let lineIndex = 0; lineIndex < line1.getViewLineCount(); lineIndex++) {
                const actualLineViewColumnMapping = [];
                for (let col = 1; col <= line1.getViewLineMaxColumn(model1, 1, lineIndex); col++) {
                    actualLineViewColumnMapping.push(line1.getModelColumnOfViewPosition(lineIndex, col));
                }
                actualViewColumnMapping.push(actualLineViewColumnMapping);
            }
            assert.deepStrictEqual(actualViewColumnMapping, [
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                [14, 14, 14, 14, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
                [28, 28, 28, 28, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
            ]);
            for (let col = 1; col <= 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(0, col), '6.getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13; col <= 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(1, 4 + col - 13), '7.getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13 + 14; col <= 15 + 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(2, 4 + col - 13 - 14), '8.getOutputPositionOfInputPosition(' + col + ')');
            }
        });
        function withSplitLinesCollection(text, callback) {
            const config = new testConfiguration_1.TestConfiguration({});
            const wrappingInfo = config.options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = config.options.get(50 /* EditorOption.fontInfo */);
            const wordWrapBreakAfterCharacters = config.options.get(133 /* EditorOption.wordWrapBreakAfterCharacters */);
            const wordWrapBreakBeforeCharacters = config.options.get(134 /* EditorOption.wordWrapBreakBeforeCharacters */);
            const wrappingIndent = config.options.get(138 /* EditorOption.wrappingIndent */);
            const wordBreak = config.options.get(129 /* EditorOption.wordBreak */);
            const lineBreaksComputerFactory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(wordWrapBreakBeforeCharacters, wordWrapBreakAfterCharacters);
            const model = (0, testTextModel_1.createTextModel)([
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
            ].join('\n'));
            const linesCollection = new viewModelLines_1.ViewModelLinesFromProjectedModel(1, model, lineBreaksComputerFactory, lineBreaksComputerFactory, fontInfo, model.getOptions().tabSize, 'simple', wrappingInfo.wrappingColumn, wrappingIndent, wordBreak);
            callback(model, linesCollection);
            linesCollection.dispose();
            model.dispose();
            config.dispose();
        }
        test('Invalid line numbers', () => {
            const text = [
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
            ].join('\n');
            withSplitLinesCollection(text, (model, linesCollection) => {
                assert.strictEqual(linesCollection.getViewLineCount(), 6);
                // getOutputIndentGuide
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(-1, -1), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(0, 0), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(1, 1), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(2, 2), [1]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(3, 3), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(4, 4), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(5, 5), [1]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(6, 6), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(7, 7), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(0, 7), [0, 1, 0, 0, 1, 0]);
                // getOutputLineContent
                assert.strictEqual(linesCollection.getViewLineContent(-1), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(0), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(1), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(2), '\tprintf("Hello world!");');
                assert.strictEqual(linesCollection.getViewLineContent(3), '}');
                assert.strictEqual(linesCollection.getViewLineContent(4), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(5), '\tprintf("Hello world!");');
                assert.strictEqual(linesCollection.getViewLineContent(6), '}');
                assert.strictEqual(linesCollection.getViewLineContent(7), '}');
                // getOutputLineMinColumn
                assert.strictEqual(linesCollection.getViewLineMinColumn(-1), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(0), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(1), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(2), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(3), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(4), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(5), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(6), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(7), 1);
                // getOutputLineMaxColumn
                assert.strictEqual(linesCollection.getViewLineMaxColumn(-1), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(0), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(1), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(2), 25);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(3), 2);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(4), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(5), 25);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(6), 2);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(7), 2);
                // convertOutputPositionToInputPosition
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(-1, 1), new position_1.Position(1, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(0, 1), new position_1.Position(1, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(1, 1), new position_1.Position(1, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(2, 1), new position_1.Position(2, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(3, 1), new position_1.Position(3, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(4, 1), new position_1.Position(4, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(5, 1), new position_1.Position(5, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(6, 1), new position_1.Position(6, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(7, 1), new position_1.Position(6, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(8, 1), new position_1.Position(6, 1));
            });
        });
        test('issue #3662', () => {
            const text = [
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
            ].join('\n');
            withSplitLinesCollection(text, (model, linesCollection) => {
                linesCollection.setHiddenAreas([
                    new range_1.Range(1, 1, 3, 1),
                    new range_1.Range(5, 1, 6, 1)
                ]);
                const viewLineCount = linesCollection.getViewLineCount();
                assert.strictEqual(viewLineCount, 1, 'getOutputLineCount()');
                const modelLineCount = model.getLineCount();
                for (let lineNumber = 0; lineNumber <= modelLineCount + 1; lineNumber++) {
                    const lineMinColumn = (lineNumber >= 1 && lineNumber <= modelLineCount) ? model.getLineMinColumn(lineNumber) : 1;
                    const lineMaxColumn = (lineNumber >= 1 && lineNumber <= modelLineCount) ? model.getLineMaxColumn(lineNumber) : 1;
                    for (let column = lineMinColumn - 1; column <= lineMaxColumn + 1; column++) {
                        const viewPosition = linesCollection.convertModelPositionToViewPosition(lineNumber, column);
                        // validate view position
                        let viewLineNumber = viewPosition.lineNumber;
                        let viewColumn = viewPosition.column;
                        if (viewLineNumber < 1) {
                            viewLineNumber = 1;
                        }
                        const lineCount = linesCollection.getViewLineCount();
                        if (viewLineNumber > lineCount) {
                            viewLineNumber = lineCount;
                        }
                        const viewMinColumn = linesCollection.getViewLineMinColumn(viewLineNumber);
                        const viewMaxColumn = linesCollection.getViewLineMaxColumn(viewLineNumber);
                        if (viewColumn < viewMinColumn) {
                            viewColumn = viewMinColumn;
                        }
                        if (viewColumn > viewMaxColumn) {
                            viewColumn = viewMaxColumn;
                        }
                        const validViewPosition = new position_1.Position(viewLineNumber, viewColumn);
                        assert.strictEqual(viewPosition.toString(), validViewPosition.toString(), 'model->view for ' + lineNumber + ', ' + column);
                    }
                }
                for (let lineNumber = 0; lineNumber <= viewLineCount + 1; lineNumber++) {
                    const lineMinColumn = linesCollection.getViewLineMinColumn(lineNumber);
                    const lineMaxColumn = linesCollection.getViewLineMaxColumn(lineNumber);
                    for (let column = lineMinColumn - 1; column <= lineMaxColumn + 1; column++) {
                        const modelPosition = linesCollection.convertViewPositionToModelPosition(lineNumber, column);
                        const validModelPosition = model.validatePosition(modelPosition);
                        assert.strictEqual(modelPosition.toString(), validModelPosition.toString(), 'view->model for ' + lineNumber + ', ' + column);
                    }
                }
            });
        });
    });
    suite('SplitLinesCollection', () => {
        const _text = [
            'class Nice {',
            '	function hi() {',
            '		console.log("Hello world");',
            '	}',
            '	function hello() {',
            '		console.log("Hello world, this is a somewhat longer line");',
            '	}',
            '}',
        ];
        const _tokens = [
            [
                { startIndex: 0, value: 1 },
                { startIndex: 5, value: 2 },
                { startIndex: 6, value: 3 },
                { startIndex: 10, value: 4 },
            ],
            [
                { startIndex: 0, value: 5 },
                { startIndex: 1, value: 6 },
                { startIndex: 9, value: 7 },
                { startIndex: 10, value: 8 },
                { startIndex: 12, value: 9 },
            ],
            [
                { startIndex: 0, value: 10 },
                { startIndex: 2, value: 11 },
                { startIndex: 9, value: 12 },
                { startIndex: 10, value: 13 },
                { startIndex: 13, value: 14 },
                { startIndex: 14, value: 15 },
                { startIndex: 27, value: 16 },
            ],
            [
                { startIndex: 0, value: 17 },
            ],
            [
                { startIndex: 0, value: 18 },
                { startIndex: 1, value: 19 },
                { startIndex: 9, value: 20 },
                { startIndex: 10, value: 21 },
                { startIndex: 15, value: 22 },
            ],
            [
                { startIndex: 0, value: 23 },
                { startIndex: 2, value: 24 },
                { startIndex: 9, value: 25 },
                { startIndex: 10, value: 26 },
                { startIndex: 13, value: 27 },
                { startIndex: 14, value: 28 },
                { startIndex: 59, value: 29 },
            ],
            [
                { startIndex: 0, value: 30 },
            ],
            [
                { startIndex: 0, value: 31 },
            ]
        ];
        let model;
        let languageRegistration;
        setup(() => {
            let _lineIndex = 0;
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    const tokens = _tokens[_lineIndex++];
                    const result = new Uint32Array(2 * tokens.length);
                    for (let i = 0; i < tokens.length; i++) {
                        result[2 * i] = tokens[i].startIndex;
                        result[2 * i + 1] = (tokens[i].value << 15 /* MetadataConsts.FOREGROUND_OFFSET */);
                    }
                    return new languages.EncodedTokenizationResult(result, state);
                }
            };
            const LANGUAGE_ID = 'modelModeTest1';
            languageRegistration = languages.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            model = (0, testTextModel_1.createTextModel)(_text.join('\n'), LANGUAGE_ID);
            // force tokenization
            model.tokenization.forceTokenization(model.getLineCount());
        });
        teardown(() => {
            model.dispose();
            languageRegistration.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertViewLineTokens(_actual, expected) {
            const actual = [];
            for (let i = 0, len = _actual.getCount(); i < len; i++) {
                actual[i] = {
                    endIndex: _actual.getEndOffset(i),
                    value: _actual.getForeground(i)
                };
            }
            assert.deepStrictEqual(actual, expected);
        }
        function assertMinimapLineRenderingData(actual, expected) {
            if (actual === null && expected === null) {
                assert.ok(true);
                return;
            }
            if (expected === null) {
                assert.ok(false);
            }
            assert.strictEqual(actual.content, expected.content);
            assert.strictEqual(actual.minColumn, expected.minColumn);
            assert.strictEqual(actual.maxColumn, expected.maxColumn);
            assertViewLineTokens(actual.tokens, expected.tokens);
        }
        function assertMinimapLinesRenderingData(actual, expected) {
            assert.strictEqual(actual.length, expected.length);
            for (let i = 0; i < expected.length; i++) {
                assertMinimapLineRenderingData(actual[i], expected[i]);
            }
        }
        function assertAllMinimapLinesRenderingData(splitLinesCollection, all) {
            const lineCount = all.length;
            for (let line = 1; line <= lineCount; line++) {
                assert.strictEqual(splitLinesCollection.getViewLineData(line).content, splitLinesCollection.getViewLineContent(line));
            }
            for (let start = 1; start <= lineCount; start++) {
                for (let end = start; end <= lineCount; end++) {
                    const count = end - start + 1;
                    for (let desired = Math.pow(2, count) - 1; desired >= 0; desired--) {
                        const needed = [];
                        const expected = [];
                        for (let i = 0; i < count; i++) {
                            needed[i] = (desired & (1 << i)) ? true : false;
                            expected[i] = (needed[i] ? all[start - 1 + i] : null);
                        }
                        const actual = splitLinesCollection.getViewLinesData(start, end, needed);
                        assertMinimapLinesRenderingData(actual, expected);
                        // Comment out next line to test all possible combinations
                        break;
                    }
                }
            }
        }
        test('getViewLinesData - no wrapping', () => {
            withSplitLinesCollection(model, 'off', 0, (splitLinesCollection) => {
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 8);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                const _expected = [
                    {
                        content: 'class Nice {',
                        minColumn: 1,
                        maxColumn: 13,
                        tokens: [
                            { endIndex: 5, value: 1 },
                            { endIndex: 6, value: 2 },
                            { endIndex: 10, value: 3 },
                            { endIndex: 12, value: 4 },
                        ]
                    },
                    {
                        content: '	function hi() {',
                        minColumn: 1,
                        maxColumn: 17,
                        tokens: [
                            { endIndex: 1, value: 5 },
                            { endIndex: 9, value: 6 },
                            { endIndex: 10, value: 7 },
                            { endIndex: 12, value: 8 },
                            { endIndex: 16, value: 9 },
                        ]
                    },
                    {
                        content: '		console.log("Hello world");',
                        minColumn: 1,
                        maxColumn: 30,
                        tokens: [
                            { endIndex: 2, value: 10 },
                            { endIndex: 9, value: 11 },
                            { endIndex: 10, value: 12 },
                            { endIndex: 13, value: 13 },
                            { endIndex: 14, value: 14 },
                            { endIndex: 27, value: 15 },
                            { endIndex: 29, value: 16 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 17 },
                        ]
                    },
                    {
                        content: '	function hello() {',
                        minColumn: 1,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 1, value: 18 },
                            { endIndex: 9, value: 19 },
                            { endIndex: 10, value: 20 },
                            { endIndex: 15, value: 21 },
                            { endIndex: 19, value: 22 },
                        ]
                    },
                    {
                        content: '		console.log("Hello world, this is a somewhat longer line");',
                        minColumn: 1,
                        maxColumn: 62,
                        tokens: [
                            { endIndex: 2, value: 23 },
                            { endIndex: 9, value: 24 },
                            { endIndex: 10, value: 25 },
                            { endIndex: 13, value: 26 },
                            { endIndex: 14, value: 27 },
                            { endIndex: 59, value: 28 },
                            { endIndex: 61, value: 29 },
                        ]
                    },
                    {
                        minColumn: 1,
                        maxColumn: 3,
                        content: '	}',
                        tokens: [
                            { endIndex: 2, value: 30 },
                        ]
                    },
                    {
                        minColumn: 1,
                        maxColumn: 2,
                        content: '}',
                        tokens: [
                            { endIndex: 1, value: 31 },
                        ]
                    }
                ];
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[1],
                    _expected[2],
                    _expected[3],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                ]);
                splitLinesCollection.setHiddenAreas([new range_1.Range(2, 1, 4, 1)]);
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 5);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                ]);
            });
        });
        test('getViewLinesData - with wrapping', () => {
            withSplitLinesCollection(model, 'wordWrapColumn', 30, (splitLinesCollection) => {
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 12);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                const _expected = [
                    {
                        content: 'class Nice {',
                        minColumn: 1,
                        maxColumn: 13,
                        tokens: [
                            { endIndex: 5, value: 1 },
                            { endIndex: 6, value: 2 },
                            { endIndex: 10, value: 3 },
                            { endIndex: 12, value: 4 },
                        ]
                    },
                    {
                        content: '	function hi() {',
                        minColumn: 1,
                        maxColumn: 17,
                        tokens: [
                            { endIndex: 1, value: 5 },
                            { endIndex: 9, value: 6 },
                            { endIndex: 10, value: 7 },
                            { endIndex: 12, value: 8 },
                            { endIndex: 16, value: 9 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 10 },
                            { endIndex: 9, value: 11 },
                            { endIndex: 10, value: 12 },
                            { endIndex: 13, value: 13 },
                            { endIndex: 14, value: 14 },
                            { endIndex: 21, value: 15 },
                        ]
                    },
                    {
                        content: '            world");',
                        minColumn: 13,
                        maxColumn: 21,
                        tokens: [
                            { endIndex: 18, value: 15 },
                            { endIndex: 20, value: 16 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 17 },
                        ]
                    },
                    {
                        content: '	function hello() {',
                        minColumn: 1,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 1, value: 18 },
                            { endIndex: 9, value: 19 },
                            { endIndex: 10, value: 20 },
                            { endIndex: 15, value: 21 },
                            { endIndex: 19, value: 22 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 23 },
                            { endIndex: 9, value: 24 },
                            { endIndex: 10, value: 25 },
                            { endIndex: 13, value: 26 },
                            { endIndex: 14, value: 27 },
                            { endIndex: 21, value: 28 },
                        ]
                    },
                    {
                        content: '            world, this is a ',
                        minColumn: 13,
                        maxColumn: 30,
                        tokens: [
                            { endIndex: 29, value: 28 },
                        ]
                    },
                    {
                        content: '            somewhat longer ',
                        minColumn: 13,
                        maxColumn: 29,
                        tokens: [
                            { endIndex: 28, value: 28 },
                        ]
                    },
                    {
                        content: '            line");',
                        minColumn: 13,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 17, value: 28 },
                            { endIndex: 19, value: 29 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 30 },
                        ]
                    },
                    {
                        content: '}',
                        minColumn: 1,
                        maxColumn: 2,
                        tokens: [
                            { endIndex: 1, value: 31 },
                        ]
                    }
                ];
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[1],
                    _expected[2],
                    _expected[3],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                    _expected[8],
                    _expected[9],
                    _expected[10],
                    _expected[11],
                ]);
                splitLinesCollection.setHiddenAreas([new range_1.Range(2, 1, 4, 1)]);
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 8);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                    _expected[8],
                    _expected[9],
                    _expected[10],
                    _expected[11],
                ]);
            });
        });
        test('getViewLinesData - with wrapping and injected text', () => {
            model.deltaDecorations([], [{
                    range: new range_1.Range(1, 9, 1, 9),
                    options: {
                        description: 'example',
                        after: {
                            content: 'very very long injected text that causes a line break',
                            inlineClassName: 'myClassName'
                        },
                        showIfCollapsed: true,
                    }
                }]);
            withSplitLinesCollection(model, 'wordWrapColumn', 30, (splitLinesCollection) => {
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 14);
                assert.strictEqual(splitLinesCollection.getViewLineMaxColumn(1), 24);
                const _expected = [
                    {
                        content: 'class Nivery very long ',
                        minColumn: 1,
                        maxColumn: 24,
                        tokens: [
                            { endIndex: 5, value: 1 },
                            { endIndex: 6, value: 2 },
                            { endIndex: 8, value: 3 },
                            { endIndex: 23, value: 1 },
                        ]
                    },
                    {
                        content: '    injected text that causes ',
                        minColumn: 5,
                        maxColumn: 31,
                        tokens: [{ endIndex: 30, value: 1 }]
                    },
                    {
                        content: '    a line breakce {',
                        minColumn: 5,
                        maxColumn: 21,
                        tokens: [
                            { endIndex: 16, value: 1 },
                            { endIndex: 18, value: 3 },
                            { endIndex: 20, value: 4 }
                        ]
                    },
                    {
                        content: '	function hi() {',
                        minColumn: 1,
                        maxColumn: 17,
                        tokens: [
                            { endIndex: 1, value: 5 },
                            { endIndex: 9, value: 6 },
                            { endIndex: 10, value: 7 },
                            { endIndex: 12, value: 8 },
                            { endIndex: 16, value: 9 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 10 },
                            { endIndex: 9, value: 11 },
                            { endIndex: 10, value: 12 },
                            { endIndex: 13, value: 13 },
                            { endIndex: 14, value: 14 },
                            { endIndex: 21, value: 15 },
                        ]
                    },
                    {
                        content: '            world");',
                        minColumn: 13,
                        maxColumn: 21,
                        tokens: [
                            { endIndex: 18, value: 15 },
                            { endIndex: 20, value: 16 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 17 },
                        ]
                    },
                    {
                        content: '	function hello() {',
                        minColumn: 1,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 1, value: 18 },
                            { endIndex: 9, value: 19 },
                            { endIndex: 10, value: 20 },
                            { endIndex: 15, value: 21 },
                            { endIndex: 19, value: 22 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 23 },
                            { endIndex: 9, value: 24 },
                            { endIndex: 10, value: 25 },
                            { endIndex: 13, value: 26 },
                            { endIndex: 14, value: 27 },
                            { endIndex: 21, value: 28 },
                        ]
                    },
                    {
                        content: '            world, this is a ',
                        minColumn: 13,
                        maxColumn: 30,
                        tokens: [
                            { endIndex: 29, value: 28 },
                        ]
                    },
                    {
                        content: '            somewhat longer ',
                        minColumn: 13,
                        maxColumn: 29,
                        tokens: [
                            { endIndex: 28, value: 28 },
                        ]
                    },
                    {
                        content: '            line");',
                        minColumn: 13,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 17, value: 28 },
                            { endIndex: 19, value: 29 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 30 },
                        ]
                    },
                    {
                        content: '}',
                        minColumn: 1,
                        maxColumn: 2,
                        tokens: [
                            { endIndex: 1, value: 31 },
                        ]
                    }
                ];
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[1],
                    _expected[2],
                    _expected[3],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                    _expected[8],
                    _expected[9],
                    _expected[10],
                    _expected[11],
                ]);
                const data = splitLinesCollection.getViewLinesData(1, 14, new Array(14).fill(true));
                assert.deepStrictEqual(data.map((d) => ({
                    inlineDecorations: d.inlineDecorations?.map((d) => ({
                        startOffset: d.startOffset,
                        endOffset: d.endOffset,
                    })),
                })), [
                    { inlineDecorations: [{ startOffset: 8, endOffset: 23 }] },
                    { inlineDecorations: [{ startOffset: 4, endOffset: 30 }] },
                    { inlineDecorations: [{ startOffset: 4, endOffset: 16 }] },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                ]);
            });
        });
        function withSplitLinesCollection(model, wordWrap, wordWrapColumn, callback) {
            const configuration = new testConfiguration_1.TestConfiguration({
                wordWrap: wordWrap,
                wordWrapColumn: wordWrapColumn,
                wrappingIndent: 'indent'
            });
            const wrappingInfo = configuration.options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = configuration.options.get(50 /* EditorOption.fontInfo */);
            const wordWrapBreakAfterCharacters = configuration.options.get(133 /* EditorOption.wordWrapBreakAfterCharacters */);
            const wordWrapBreakBeforeCharacters = configuration.options.get(134 /* EditorOption.wordWrapBreakBeforeCharacters */);
            const wrappingIndent = configuration.options.get(138 /* EditorOption.wrappingIndent */);
            const wordBreak = configuration.options.get(129 /* EditorOption.wordBreak */);
            const lineBreaksComputerFactory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(wordWrapBreakBeforeCharacters, wordWrapBreakAfterCharacters);
            const linesCollection = new viewModelLines_1.ViewModelLinesFromProjectedModel(1, model, lineBreaksComputerFactory, lineBreaksComputerFactory, fontInfo, model.getOptions().tabSize, 'simple', wrappingInfo.wrappingColumn, wrappingIndent, wordBreak);
            callback(linesCollection);
            configuration.dispose();
        }
    });
    function pos(lineNumber, column) {
        return new position_1.Position(lineNumber, column);
    }
    function createSplitLine(splitLengths, breakingOffsetsVisibleColumn, wrappedTextIndentWidth, isVisible = true) {
        return (0, modelLineProjection_1.createModelLineProjection)(createLineBreakData(splitLengths, breakingOffsetsVisibleColumn, wrappedTextIndentWidth), isVisible);
    }
    function createLineBreakData(breakingLengths, breakingOffsetsVisibleColumn, wrappedTextIndentWidth) {
        const sums = [];
        for (let i = 0; i < breakingLengths.length; i++) {
            sums[i] = (i > 0 ? sums[i - 1] : 0) + breakingLengths[i];
        }
        return new modelLineProjectionData_1.ModelLineProjectionData(null, null, sums, breakingOffsetsVisibleColumn, wrappedTextIndentWidth);
    }
    function createModel(text) {
        return {
            tokenization: {
                getLineTokens: (lineNumber) => {
                    return null;
                },
            },
            getLineContent: (lineNumber) => {
                return text;
            },
            getLineLength: (lineNumber) => {
                return text.length;
            },
            getLineMinColumn: (lineNumber) => {
                return 1;
            },
            getLineMaxColumn: (lineNumber) => {
                return text.length + 1;
            },
            getValueInRange: (range, eol) => {
                return text.substring(range.startColumn - 1, range.endColumn - 1);
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxMaW5lUHJvamVjdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci92aWV3TW9kZWwvbW9kZWxMaW5lUHJvamVjdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxLQUFLLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1FBRXJELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUN0QixJQUFJLE1BQU0sR0FBRyxXQUFXLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUN2RSxJQUFJLEtBQUssR0FBRyxlQUFlLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsaUJB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QUUsQ0FBQyxDQUFDLENBQUM7Z0JBRS9ELHVDQUF1QztnQkFDdkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsZUFBZSxD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QkFDNUIsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM1QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDN0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzdCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM3QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTthQUM3QjtZQUNEO2dCQUNDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2FBQzVCO1lBQ0Q7Z0JBQ0MsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM1QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzdCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2FBQzdCO1lBQ0Q7Z0JBQ0MsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM1QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzdCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM3QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDN0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7YUFDN0I7WUFDRDtnQkFDQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTthQUM1QjtZQUNEO2dCQUNDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2FBQzVCO1NBQ0QsQ0FBQztRQUVGLElBQUksS0FBZ0IsQ0FBQztRQUNyQixJQUFJLG9CQUFpQyxDQUFDO1FBRXRDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDbkIsTUFBTSxtQkFBbUIsR0FBbUM7Z0JBQzNELGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBUztnQkFDaEMsUUFBUSxFQUFFLFNBQVU7Z0JBQ3BCLGVBQWUsRUFBRSxDQUFDLElBQVksRUFBRSxNQUFlLEVBQUUsS0FBdUIsRUFBdUMsRUFBRTtvQkFDaEgsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7b0JBRXJDLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ2xELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQ3hDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQzt3QkFDckMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FDbkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssNkNBQW9DLENBQ25ELENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxPQUFPLElBQUksU0FBUyxDQUFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0QsQ0FBQzthQUNELENBQUM7WUFDRixNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQztZQUNyQyxvQkFBb0IsR0FBRyxTQUFTLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pHLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN2RCxxQkFBcUI7WUFDckIsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFPMUMsU0FBUyxvQkFBb0IsQ0FBQyxPQUF3QixFQUFFLFFBQThCO1lBQ3JGLE1BQU0sTUFBTSxHQUF5QixFQUFFLENBQUM7WUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRztvQkFDWCxRQUFRLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLEtBQUssRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztpQkFDL0IsQ0FBQztZQUNILENBQUM7WUFDRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBU0QsU0FBUyw4QkFBOEIsQ0FBQyxNQUFvQixFQUFFLFFBQThDO1lBQzNHLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxTQUFTLCtCQUErQixDQUFDLE1BQXNCLEVBQUUsUUFBcUQ7WUFDckgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMxQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztRQUNGLENBQUM7UUFFRCxTQUFTLGtDQUFrQyxDQUFDLG9CQUFzRCxFQUFFLEdBQW9DO1lBQ3ZJLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDN0IsS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2SCxDQUFDO1lBRUQsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxJQUFJLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxLQUFLLElBQUksR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLElBQUksU0FBUyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7b0JBQy9DLE1BQU0sS0FBSyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO29CQUM5QixLQUFLLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUM7d0JBQ3BFLE1BQU0sTUFBTSxHQUFjLEVBQUUsQ0FBQzt3QkFDN0IsTUFBTSxRQUFRLEdBQWdELEVBQUUsQ0FBQzt3QkFDakUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDOzRCQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7NEJBQ2hELFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN2RCxDQUFDO3dCQUNELE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBRXpFLCtCQUErQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDbEQsMERBQTBEO3dCQUMxRCxNQUFNO29CQUNQLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLEVBQUU7Z0JBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUU1RSxNQUFNLFNBQVMsR0FBb0M7b0JBQ2xEO3dCQUNDLE9BQU8sRUFBRSxjQUFjO3dCQUN2QixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQ3pCLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUN6QixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7eUJBQzFCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSxrQkFBa0I7d0JBQzNCLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDekIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQ3pCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7eUJBQzFCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSwrQkFBK0I7d0JBQ3hDLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDM0I7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLElBQUk7d0JBQ2IsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLENBQUM7d0JBQ1osTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMxQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUscUJBQXFCO3dCQUM5QixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMzQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsK0RBQStEO3dCQUN4RSxTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FCQUNEO29CQUNEO3dCQUNDLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxDQUFDO3dCQUNaLE9BQU8sRUFBRSxJQUFJO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDMUI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLENBQUM7d0JBQ1osT0FBTyxFQUFFLEdBQUc7d0JBQ1osTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMxQjtxQkFDRDtpQkFDRCxDQUFDO2dCQUVGLGtDQUFrQyxDQUFDLG9CQUFvQixFQUFFO29CQUN4RCxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7aUJBQ1osQ0FBQyxDQUFDO2dCQUVILG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTVFLGtDQUFrQyxDQUFDLG9CQUFvQixFQUFFO29CQUN4RCxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7aUJBQ1osQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7WUFDN0Msd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixFQUFFLEVBQUU7Z0JBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUU1RSxNQUFNLFNBQVMsR0FBb0M7b0JBQ2xEO3dCQUNDLE9BQU8sRUFBRSxjQUFjO3dCQUN2QixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQ3pCLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUN6QixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7eUJBQzFCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSxrQkFBa0I7d0JBQzNCLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDekIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQ3pCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7eUJBQzFCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSx1QkFBdUI7d0JBQ2hDLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMzQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsc0JBQXNCO3dCQUMvQixTQUFTLEVBQUUsRUFBRTt3QkFDYixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMzQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsSUFBSTt3QkFDYixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsQ0FBQzt3QkFDWixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzFCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSxxQkFBcUI7d0JBQzlCLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSx1QkFBdUI7d0JBQ2hDLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMzQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsK0JBQStCO3dCQUN4QyxTQUFTLEVBQUUsRUFBRTt3QkFDYixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSw4QkFBOEI7d0JBQ3ZDLFNBQVMsRUFBRSxFQUFFO3dCQUNiLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDM0I7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLHFCQUFxQjt3QkFDOUIsU0FBUyxFQUFFLEVBQUU7d0JBQ2IsU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDM0I7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLElBQUk7d0JBQ2IsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLENBQUM7d0JBQ1osTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMxQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsR0FBRzt3QkFDWixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsQ0FBQzt3QkFDWixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzFCO3FCQUNEO2lCQUNELENBQUM7Z0JBRUYsa0NBQWtDLENBQUMsb0JBQW9CLEVBQUU7b0JBQ3hELFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDYixTQUFTLENBQUMsRUFBRSxDQUFDO2lCQUNiLENBQUMsQ0FBQztnQkFFSCxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUU1RSxrQ0FBa0MsQ0FBQyxvQkFBb0IsRUFBRTtvQkFDeEQsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDYixTQUFTLENBQUMsRUFBRSxDQUFDO2lCQUNiLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0RBQW9ELEVBQUUsR0FBRyxFQUFFO1lBQy9ELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDNUIsT0FBTyxFQUFFO3dCQUNSLFdBQVcsRUFBRSxTQUFTO3dCQUN0QixLQUFLLEVBQUU7NEJBQ04sT0FBTyxFQUFFLHVEQUF1RDs0QkFDaEUsZUFBZSxFQUFFLGFBQWE7eUJBQzlCO3dCQUNELGVBQWUsRUFBRSxJQUFJO3FCQUNyQjtpQkFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFO2dCQUM5RSxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRWhFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRXJFLE1BQU0sU0FBUyxHQUFvQztvQkFDbEQ7d0JBQ0MsT0FBTyxFQUFFLHlCQUF5Qjt3QkFDbEMsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUN6QixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDekIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQ3pCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3lCQUMxQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsZ0NBQWdDO3dCQUN6QyxTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO3FCQUNwQztvQkFDRDt3QkFDQyxPQUFPLEVBQUUsc0JBQXNCO3dCQUMvQixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt5QkFDMUI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLGtCQUFrQjt3QkFDM0IsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUN6QixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTs0QkFDekIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7NEJBQzFCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt5QkFDMUI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLHVCQUF1Qjt3QkFDaEMsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSxzQkFBc0I7d0JBQy9CLFNBQVMsRUFBRSxFQUFFO3dCQUNiLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSxJQUFJO3dCQUNiLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxDQUFDO3dCQUNaLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDMUI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLHFCQUFxQjt3QkFDOUIsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDM0I7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLHVCQUF1Qjt3QkFDaEMsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSwrQkFBK0I7d0JBQ3hDLFNBQVMsRUFBRSxFQUFFO3dCQUNiLFNBQVMsRUFBRSxFQUFFO3dCQUNiLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDM0I7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLDhCQUE4Qjt3QkFDdkMsU0FBUyxFQUFFLEVBQUU7d0JBQ2IsU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMzQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUscUJBQXFCO3dCQUM5QixTQUFTLEVBQUUsRUFBRTt3QkFDYixTQUFTLEVBQUUsRUFBRTt3QkFDYixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMzQjtxQkFDRDtvQkFDRDt3QkFDQyxPQUFPLEVBQUUsSUFBSTt3QkFDYixTQUFTLEVBQUUsQ0FBQzt3QkFDWixTQUFTLEVBQUUsQ0FBQzt3QkFDWixNQUFNLEVBQUU7NEJBQ1AsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzFCO3FCQUNEO29CQUNEO3dCQUNDLE9BQU8sRUFBRSxHQUFHO3dCQUNaLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxDQUFDO3dCQUNaLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDMUI7cUJBQ0Q7aUJBQ0QsQ0FBQztnQkFFRixrQ0FBa0MsQ0FBQyxvQkFBb0IsRUFBRTtvQkFDeEQsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDWixTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNiLFNBQVMsQ0FBQyxFQUFFLENBQUM7aUJBQ2IsQ0FBQyxDQUFDO2dCQUVILE1BQU0sSUFBSSxHQUFHLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BGLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ2hCLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ25ELFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVzt3QkFDMUIsU0FBUyxFQUFFLENBQUMsQ0FBQyxTQUFTO3FCQUN0QixDQUFDLENBQUM7aUJBQ0gsQ0FBQyxDQUFDLEVBQ0g7b0JBQ0MsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7b0JBQ2hDLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFO29CQUNoQyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtvQkFDaEMsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7b0JBQ2hDLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFO29CQUNoQyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtvQkFDaEMsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7b0JBQ2hDLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFO29CQUNoQyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtvQkFDaEMsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7b0JBQ2hDLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFO2lCQUNoQyxDQUNELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsU0FBUyx3QkFBd0IsQ0FBQyxLQUFnQixFQUFFLFFBQXFELEVBQUUsY0FBc0IsRUFBRSxRQUEwRTtZQUM1TSxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFpQixDQUFDO2dCQUMzQyxRQUFRLEVBQUUsUUFBUTtnQkFDbEIsY0FBYyxFQUFFLGNBQWM7Z0JBQzlCLGNBQWMsRUFBRSxRQUFRO2FBQ3hCLENBQUMsQ0FBQztZQUNILE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxxQ0FBMkIsQ0FBQztZQUMxRSxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFDbEUsTUFBTSw0QkFBNEIsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcscURBQTJDLENBQUM7WUFDMUcsTUFBTSw2QkFBNkIsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsc0RBQTRDLENBQUM7WUFDNUcsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLHVDQUE2QixDQUFDO1lBQzlFLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxrQ0FBd0IsQ0FBQztZQUVwRSxNQUFNLHlCQUF5QixHQUFHLElBQUksZ0VBQWtDLENBQUMsNkJBQTZCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztZQUV0SSxNQUFNLGVBQWUsR0FBRyxJQUFJLGlEQUFnQyxDQUMzRCxDQUFDLEVBQ0QsS0FBSyxFQUNMLHlCQUF5QixFQUN6Qix5QkFBeUIsRUFDekIsUUFBUSxFQUNSLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLEVBQzFCLFFBQVEsRUFDUixZQUFZLENBQUMsY0FBYyxFQUMzQixjQUFjLEVBQ2QsU0FBUyxDQUNULENBQUM7WUFFRixRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFMUIsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUdILFNBQVMsR0FBRyxDQUFDLFVBQWtCLEVBQUUsTUFBYztRQUM5QyxPQUFPLElBQUksbUJBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFDLFlBQXNCLEVBQUUsNEJBQXNDLEVBQUUsc0JBQThCLEVBQUUsWUFBcUIsSUFBSTtRQUNqSixPQUFPLElBQUEsK0NBQXlCLEVBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLDRCQUE0QixFQUFFLHNCQUFzQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEksQ0FBQztJQUVELFNBQVMsbUJBQW1CLENBQUMsZUFBeUIsRUFBRSw0QkFBc0MsRUFBRSxzQkFBOEI7UUFDN0gsTUFBTSxJQUFJLEdBQWEsRUFBRSxDQUFDO1FBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFDRCxPQUFPLElBQUksaURBQXVCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsNEJBQTRCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUM1RyxDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUMsSUFBWTtRQUNoQyxPQUFPO1lBQ04sWUFBWSxFQUFFO2dCQUNiLGFBQWEsRUFBRSxDQUFDLFVBQWtCLEVBQUUsRUFBRTtvQkFDckMsT0FBTyxJQUFLLENBQUM7Z0JBQ2QsQ0FBQzthQUNEO1lBQ0QsY0FBYyxFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFO2dCQUN0QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxhQUFhLEVBQUUsQ0FBQyxVQUFrQixFQUFFLEVBQUU7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNwQixDQUFDO1lBQ0QsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFrQixFQUFFLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUNELGdCQUFnQixFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFO2dCQUN4QyxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFDRCxlQUFlLEVBQUUsQ0FBQyxLQUFhLEVBQUUsR0FBeUIsRUFBRSxFQUFFO2dCQUM3RCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRSxDQUFDO1NBQ0QsQ0FBQztJQUNILENBQUMifQ==