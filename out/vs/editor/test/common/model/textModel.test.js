/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/modesRegistry", "vs/editor/common/model/textModel", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, strings_1, utils_1, position_1, range_1, modesRegistry_1, textModel_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testGuessIndentation(defaultInsertSpaces, defaultTabSize, expectedInsertSpaces, expectedTabSize, text, msg) {
        const m = (0, testTextModel_1.createTextModel)(text.join('\n'), undefined, {
            tabSize: defaultTabSize,
            insertSpaces: defaultInsertSpaces,
            detectIndentation: true
        });
        const r = m.getOptions();
        m.dispose();
        assert.strictEqual(r.insertSpaces, expectedInsertSpaces, msg);
        assert.strictEqual(r.tabSize, expectedTabSize, msg);
    }
    function assertGuess(expectedInsertSpaces, expectedTabSize, text, msg) {
        if (typeof expectedInsertSpaces === 'undefined') {
            // cannot guess insertSpaces
            if (typeof expectedTabSize === 'undefined') {
                // cannot guess tabSize
                testGuessIndentation(true, 13370, true, 13370, text, msg);
                testGuessIndentation(false, 13371, false, 13371, text, msg);
            }
            else if (typeof expectedTabSize === 'number') {
                // can guess tabSize
                testGuessIndentation(true, 13370, true, expectedTabSize, text, msg);
                testGuessIndentation(false, 13371, false, expectedTabSize, text, msg);
            }
            else {
                // can only guess tabSize when insertSpaces is true
                testGuessIndentation(true, 13370, true, expectedTabSize[0], text, msg);
                testGuessIndentation(false, 13371, false, 13371, text, msg);
            }
        }
        else {
            // can guess insertSpaces
            if (typeof expectedTabSize === 'undefined') {
                // cannot guess tabSize
                testGuessIndentation(true, 13370, expectedInsertSpaces, 13370, text, msg);
                testGuessIndentation(false, 13371, expectedInsertSpaces, 13371, text, msg);
            }
            else if (typeof expectedTabSize === 'number') {
                // can guess tabSize
                testGuessIndentation(true, 13370, expectedInsertSpaces, expectedTabSize, text, msg);
                testGuessIndentation(false, 13371, expectedInsertSpaces, expectedTabSize, text, msg);
            }
            else {
                // can only guess tabSize when insertSpaces is true
                if (expectedInsertSpaces === true) {
                    testGuessIndentation(true, 13370, expectedInsertSpaces, expectedTabSize[0], text, msg);
                    testGuessIndentation(false, 13371, expectedInsertSpaces, expectedTabSize[0], text, msg);
                }
                else {
                    testGuessIndentation(true, 13370, expectedInsertSpaces, 13370, text, msg);
                    testGuessIndentation(false, 13371, expectedInsertSpaces, 13371, text, msg);
                }
            }
        }
    }
    suite('TextModelData.fromString', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testTextModelDataFromString(text, expected) {
            const { textBuffer, disposable } = (0, textModel_1.createTextBuffer)(text, textModel_1.TextModel.DEFAULT_CREATION_OPTIONS.defaultEOL);
            const actual = {
                EOL: textBuffer.getEOL(),
                lines: textBuffer.getLinesContent(),
                containsRTL: textBuffer.mightContainRTL(),
                isBasicASCII: !textBuffer.mightContainNonBasicASCII()
            };
            assert.deepStrictEqual(actual, expected);
            disposable.dispose();
        }
        test('one line text', () => {
            testTextModelDataFromString('Hello world!', {
                EOL: '\n',
                lines: [
                    'Hello world!'
                ],
                containsRTL: false,
                isBasicASCII: true
            });
        });
        test('multiline text', () => {
            testTextModelDataFromString('Hello,\r\ndear friend\nHow\rare\r\nyou?', {
                EOL: '\r\n',
                lines: [
                    'Hello,',
                    'dear friend',
                    'How',
                    'are',
                    'you?'
                ],
                containsRTL: false,
                isBasicASCII: true
            });
        });
        test('Non Basic ASCII 1', () => {
            testTextModelDataFromString('Hello,\nZürich', {
                EOL: '\n',
                lines: [
                    'Hello,',
                    'Zürich'
                ],
                containsRTL: false,
                isBasicASCII: false
            });
        });
        test('containsRTL 1', () => {
            testTextModelDataFromString('Hello,\nזוהי עובדה מבוססת שדעתו', {
                EOL: '\n',
                lines: [
                    'Hello,',
                    'זוהי עובדה מבוססת שדעתו'
                ],
                containsRTL: true,
                isBasicASCII: false
            });
        });
        test('containsRTL 2', () => {
            testTextModelDataFromString('Hello,\nهناك حقيقة مثبتة منذ زمن طويل', {
                EOL: '\n',
                lines: [
                    'Hello,',
                    'هناك حقيقة مثبتة منذ زمن طويل'
                ],
                containsRTL: true,
                isBasicASCII: false
            });
        });
    });
    suite('Editor Model - TextModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('TextModel does not use events internally', () => {
            // Make sure that all model parts receive text model events explicitly
            // to avoid that by any chance an outside listener receives events before
            // the parts and thus are able to access the text model in an inconsistent state.
            //
            // We simply check that there are no listeners attached to text model
            // after instantiation
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const textModel = disposables.add(instantiationService.createInstance(textModel_1.TextModel, '', modesRegistry_1.PLAINTEXT_LANGUAGE_ID, textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, null));
            assert.strictEqual(textModel._hasListeners(), false);
            disposables.dispose();
        });
        test('getValueLengthInRange', () => {
            let m = (0, testTextModel_1.createTextModel)('My First Line\r\nMy Second Line\r\nMy Third Line');
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1, 1)), ''.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1, 2)), 'M'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 1, 3)), 'y'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1, 14)), 'My First Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1)), 'My First Line\r\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 2, 1)), 'y First Line\r\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 2, 2)), 'y First Line\r\nM'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 2, 1000)), 'y First Line\r\nMy Second Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 3, 1)), 'y First Line\r\nMy Second Line\r\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 3, 1000)), 'y First Line\r\nMy Second Line\r\nMy Third Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000)), 'My First Line\r\nMy Second Line\r\nMy Third Line'.length);
            m.dispose();
            m = (0, testTextModel_1.createTextModel)('My First Line\nMy Second Line\nMy Third Line');
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1, 1)), ''.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1, 2)), 'M'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 1, 3)), 'y'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1, 14)), 'My First Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1)), 'My First Line\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 2, 1)), 'y First Line\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 2, 2)), 'y First Line\nM'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 2, 1000)), 'y First Line\nMy Second Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 3, 1)), 'y First Line\nMy Second Line\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 2, 3, 1000)), 'y First Line\nMy Second Line\nMy Third Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000)), 'My First Line\nMy Second Line\nMy Third Line'.length);
            m.dispose();
        });
        test('getValueLengthInRange different EOL', () => {
            let m = (0, testTextModel_1.createTextModel)('My First Line\r\nMy Second Line\r\nMy Third Line');
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1), 0 /* EndOfLinePreference.TextDefined */), 'My First Line\r\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1), 2 /* EndOfLinePreference.CRLF */), 'My First Line\r\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1), 1 /* EndOfLinePreference.LF */), 'My First Line\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000), 0 /* EndOfLinePreference.TextDefined */), 'My First Line\r\nMy Second Line\r\nMy Third Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000), 2 /* EndOfLinePreference.CRLF */), 'My First Line\r\nMy Second Line\r\nMy Third Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000), 1 /* EndOfLinePreference.LF */), 'My First Line\nMy Second Line\nMy Third Line'.length);
            m.dispose();
            m = (0, testTextModel_1.createTextModel)('My First Line\nMy Second Line\nMy Third Line');
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1), 0 /* EndOfLinePreference.TextDefined */), 'My First Line\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1), 1 /* EndOfLinePreference.LF */), 'My First Line\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 2, 1), 2 /* EndOfLinePreference.CRLF */), 'My First Line\r\n'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000), 0 /* EndOfLinePreference.TextDefined */), 'My First Line\nMy Second Line\nMy Third Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000), 1 /* EndOfLinePreference.LF */), 'My First Line\nMy Second Line\nMy Third Line'.length);
            assert.strictEqual(m.getValueLengthInRange(new range_1.Range(1, 1, 1000, 1000), 2 /* EndOfLinePreference.CRLF */), 'My First Line\r\nMy Second Line\r\nMy Third Line'.length);
            m.dispose();
        });
        test('guess indentation 1', () => {
            assertGuess(undefined, undefined, [
                'x',
                'x',
                'x',
                'x',
                'x',
                'x',
                'x'
            ], 'no clues');
            assertGuess(false, undefined, [
                '\tx',
                'x',
                'x',
                'x',
                'x',
                'x',
                'x'
            ], 'no spaces, 1xTAB');
            assertGuess(true, 2, [
                '  x',
                'x',
                'x',
                'x',
                'x',
                'x',
                'x'
            ], '1x2');
            assertGuess(false, undefined, [
                '\tx',
                '\tx',
                '\tx',
                '\tx',
                '\tx',
                '\tx',
                '\tx'
            ], '7xTAB');
            assertGuess(undefined, [2], [
                '\tx',
                '  x',
                '\tx',
                '  x',
                '\tx',
                '  x',
                '\tx',
                '  x',
            ], '4x2, 4xTAB');
            assertGuess(false, undefined, [
                '\tx',
                ' x',
                '\tx',
                ' x',
                '\tx',
                ' x',
                '\tx',
                ' x'
            ], '4x1, 4xTAB');
            assertGuess(false, undefined, [
                '\tx',
                '\tx',
                '  x',
                '\tx',
                '  x',
                '\tx',
                '  x',
                '\tx',
                '  x',
            ], '4x2, 5xTAB');
            assertGuess(false, undefined, [
                '\tx',
                '\tx',
                'x',
                '\tx',
                'x',
                '\tx',
                'x',
                '\tx',
                '  x',
            ], '1x2, 5xTAB');
            assertGuess(false, undefined, [
                '\tx',
                '\tx',
                'x',
                '\tx',
                'x',
                '\tx',
                'x',
                '\tx',
                '    x',
            ], '1x4, 5xTAB');
            assertGuess(false, undefined, [
                '\tx',
                '\tx',
                'x',
                '\tx',
                'x',
                '\tx',
                '  x',
                '\tx',
                '    x',
            ], '1x2, 1x4, 5xTAB');
            assertGuess(undefined, undefined, [
                'x',
                ' x',
                ' x',
                ' x',
                ' x',
                ' x',
                ' x',
                ' x'
            ], '7x1 - 1 space is never guessed as an indentation');
            assertGuess(true, undefined, [
                'x',
                '          x',
                ' x',
                ' x',
                ' x',
                ' x',
                ' x',
                ' x'
            ], '1x10, 6x1');
            assertGuess(undefined, undefined, [
                '',
                '  ',
                '    ',
                '      ',
                '        ',
                '          ',
                '            ',
                '              ',
            ], 'whitespace lines don\'t count');
            assertGuess(true, 3, [
                'x',
                '   x',
                '   x',
                '    x',
                'x',
                '   x',
                '   x',
                '    x',
                'x',
                '   x',
                '   x',
                '    x',
            ], '6x3, 3x4');
            assertGuess(true, 5, [
                'x',
                '     x',
                '     x',
                '    x',
                'x',
                '     x',
                '     x',
                '    x',
                'x',
                '     x',
                '     x',
                '    x',
            ], '6x5, 3x4');
            assertGuess(true, 7, [
                'x',
                '       x',
                '       x',
                '     x',
                'x',
                '       x',
                '       x',
                '    x',
                'x',
                '       x',
                '       x',
                '    x',
            ], '6x7, 1x5, 2x4');
            assertGuess(true, 2, [
                'x',
                '  x',
                '  x',
                '  x',
                '  x',
                'x',
                '  x',
                '  x',
                '  x',
                '  x',
            ], '8x2');
            assertGuess(true, 2, [
                'x',
                '  x',
                '  x',
                'x',
                '  x',
                '  x',
                'x',
                '  x',
                '  x',
                'x',
                '  x',
                '  x',
            ], '8x2');
            assertGuess(true, 2, [
                'x',
                '  x',
                '    x',
                'x',
                '  x',
                '    x',
                'x',
                '  x',
                '    x',
                'x',
                '  x',
                '    x',
            ], '4x2, 4x4');
            assertGuess(true, 2, [
                'x',
                '  x',
                '  x',
                '    x',
                'x',
                '  x',
                '  x',
                '    x',
                'x',
                '  x',
                '  x',
                '    x',
            ], '6x2, 3x4');
            assertGuess(true, 2, [
                'x',
                '  x',
                '  x',
                '    x',
                '    x',
                'x',
                '  x',
                '  x',
                '    x',
                '    x',
            ], '4x2, 4x4');
            assertGuess(true, 2, [
                'x',
                '  x',
                '    x',
                '    x',
                'x',
                '  x',
                '    x',
                '    x',
            ], '2x2, 4x4');
            assertGuess(true, 4, [
                'x',
                '    x',
                '    x',
                'x',
                '    x',
                '    x',
                'x',
                '    x',
                '    x',
                'x',
                '    x',
                '    x',
            ], '8x4');
            assertGuess(true, 2, [
                'x',
                '  x',
                '    x',
                '    x',
                '      x',
                'x',
                '  x',
                '    x',
                '    x',
                '      x',
            ], '2x2, 4x4, 2x6');
            assertGuess(true, 2, [
                'x',
                '  x',
                '    x',
                '    x',
                '      x',
                '      x',
                '        x',
            ], '1x2, 2x4, 2x6, 1x8');
            assertGuess(true, 4, [
                'x',
                '    x',
                '    x',
                '    x',
                '     x',
                '        x',
                'x',
                '    x',
                '    x',
                '    x',
                '     x',
                '        x',
            ], '6x4, 2x5, 2x8');
            assertGuess(true, 4, [
                'x',
                '    x',
                '    x',
                '    x',
                '     x',
                '        x',
                '        x',
            ], '3x4, 1x5, 2x8');
            assertGuess(true, 4, [
                'x',
                'x',
                '    x',
                '    x',
                '     x',
                '        x',
                '        x',
                'x',
                'x',
                '    x',
                '    x',
                '     x',
                '        x',
                '        x',
            ], '6x4, 2x5, 4x8');
            assertGuess(true, 3, [
                'x',
                ' x',
                ' x',
                ' x',
                ' x',
                ' x',
                'x',
                '   x',
                '    x',
                '    x',
            ], '5x1, 2x0, 1x3, 2x4');
            assertGuess(false, undefined, [
                '\t x',
                ' \t x',
                '\tx'
            ], 'mixed whitespace 1');
            assertGuess(false, undefined, [
                '\tx',
                '\t    x'
            ], 'mixed whitespace 2');
        });
        test('issue #44991: Wrong indentation size auto-detection', () => {
            assertGuess(true, 4, [
                'a = 10             # 0 space indent',
                'b = 5              # 0 space indent',
                'if a > 10:         # 0 space indent',
                '    a += 1         # 4 space indent      delta 4 spaces',
                '    if b > 5:      # 4 space indent',
                '        b += 1     # 8 space indent      delta 4 spaces',
                '        b += 1     # 8 space indent',
                '        b += 1     # 8 space indent',
                '# comment line 1   # 0 space indent      delta 8 spaces',
                '# comment line 2   # 0 space indent',
                '# comment line 3   # 0 space indent',
                '        b += 1     # 8 space indent      delta 8 spaces',
                '        b += 1     # 8 space indent',
                '        b += 1     # 8 space indent',
            ]);
        });
        test('issue #55818: Broken indentation detection', () => {
            assertGuess(true, 2, [
                '',
                '/* REQUIRE */',
                '',
                'const foo = require ( \'foo\' ),',
                '      bar = require ( \'bar\' );',
                '',
                '/* MY FN */',
                '',
                'function myFn () {',
                '',
                '  const asd = 1,',
                '        dsa = 2;',
                '',
                '  return bar ( foo ( asd ) );',
                '',
                '}',
                '',
                '/* EXPORT */',
                '',
                'module.exports = myFn;',
                '',
            ]);
        });
        test('issue #70832: Broken indentation detection', () => {
            assertGuess(false, undefined, [
                'x',
                'x',
                'x',
                'x',
                '	x',
                '		x',
                '    x',
                '		x',
                '	x',
                '		x',
                '	x',
                '	x',
                '	x',
                '	x',
                'x',
            ]);
        });
        test('issue #62143: Broken indentation detection', () => {
            // works before the fix
            assertGuess(true, 2, [
                'x',
                'x',
                '  x',
                '  x'
            ]);
            // works before the fix
            assertGuess(true, 2, [
                'x',
                '  - item2',
                '  - item3'
            ]);
            // works before the fix
            testGuessIndentation(true, 2, true, 2, [
                'x x',
                '  x',
                '  x',
            ]);
            // fails before the fix
            // empty space inline breaks the indentation guess
            testGuessIndentation(true, 2, true, 2, [
                'x x',
                '  x',
                '  x',
                '    x'
            ]);
            testGuessIndentation(true, 2, true, 2, [
                '<!--test1.md -->',
                '- item1',
                '  - item2',
                '    - item3'
            ]);
        });
        test('issue #84217: Broken indentation detection', () => {
            assertGuess(true, 4, [
                'def main():',
                '    print(\'hello\')',
            ]);
            assertGuess(true, 4, [
                'def main():',
                '    with open(\'foo\') as fp:',
                '        print(fp.read())',
            ]);
        });
        test('validatePosition', () => {
            const m = (0, testTextModel_1.createTextModel)('line one\nline two');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(0, 0)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(0, 1)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 1)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 2)), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 30)), new position_1.Position(1, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 0)), new position_1.Position(2, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 1)), new position_1.Position(2, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 2)), new position_1.Position(2, 2));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 30)), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(3, 0)), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(3, 1)), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(3, 30)), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(30, 30)), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(-123.123, -0.5)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(Number.MIN_VALUE, Number.MIN_VALUE)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(Number.MAX_VALUE, Number.MAX_VALUE)), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(123.23, 47.5)), new position_1.Position(2, 9));
            m.dispose();
        });
        test('validatePosition around high-low surrogate pairs 1', () => {
            const m = (0, testTextModel_1.createTextModel)('a📚b');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(0, 0)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(0, 1)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(0, 7)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 1)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 2)), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 3)), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 4)), new position_1.Position(1, 4));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 5)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 30)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 0)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 1)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 2)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 30)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(-123.123, -0.5)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(Number.MIN_VALUE, Number.MIN_VALUE)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(Number.MAX_VALUE, Number.MAX_VALUE)), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(123.23, 47.5)), new position_1.Position(1, 5));
            m.dispose();
        });
        test('validatePosition around high-low surrogate pairs 2', () => {
            const m = (0, testTextModel_1.createTextModel)('a📚📚b');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 1)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 2)), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 3)), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 4)), new position_1.Position(1, 4));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 5)), new position_1.Position(1, 4));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 6)), new position_1.Position(1, 6));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 7)), new position_1.Position(1, 7));
            m.dispose();
        });
        test('validatePosition handle NaN.', () => {
            const m = (0, testTextModel_1.createTextModel)('line one\nline two');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(NaN, 1)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, NaN)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(NaN, NaN)), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, NaN)), new position_1.Position(2, 1));
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(NaN, 3)), new position_1.Position(1, 3));
            m.dispose();
        });
        test('issue #71480: validatePosition handle floats', () => {
            const m = (0, testTextModel_1.createTextModel)('line one\nline two');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(0.2, 1)), new position_1.Position(1, 1), 'a');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1.2, 1)), new position_1.Position(1, 1), 'b');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1.5, 2)), new position_1.Position(1, 2), 'c');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1.8, 3)), new position_1.Position(1, 3), 'd');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 0.3)), new position_1.Position(1, 1), 'e');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 0.8)), new position_1.Position(2, 1), 'f');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(1, 1.2)), new position_1.Position(1, 1), 'g');
            assert.deepStrictEqual(m.validatePosition(new position_1.Position(2, 1.5)), new position_1.Position(2, 1), 'h');
            m.dispose();
        });
        test('issue #71480: validateRange handle floats', () => {
            const m = (0, testTextModel_1.createTextModel)('line one\nline two');
            assert.deepStrictEqual(m.validateRange(new range_1.Range(0.2, 1.5, 0.8, 2.5)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1.2, 1.7, 1.8, 2.2)), new range_1.Range(1, 1, 1, 2));
            m.dispose();
        });
        test('validateRange around high-low surrogate pairs 1', () => {
            const m = (0, testTextModel_1.createTextModel)('a📚b');
            assert.deepStrictEqual(m.validateRange(new range_1.Range(0, 0, 0, 1)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(0, 0, 0, 7)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 1)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 2)), new range_1.Range(1, 1, 1, 2));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 3)), new range_1.Range(1, 1, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 4)), new range_1.Range(1, 1, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 5)), new range_1.Range(1, 1, 1, 5));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 2)), new range_1.Range(1, 2, 1, 2));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 3)), new range_1.Range(1, 2, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 4)), new range_1.Range(1, 2, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 5)), new range_1.Range(1, 2, 1, 5));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 3)), new range_1.Range(1, 2, 1, 2));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 4)), new range_1.Range(1, 2, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 5)), new range_1.Range(1, 2, 1, 5));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 4, 1, 4)), new range_1.Range(1, 4, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 4, 1, 5)), new range_1.Range(1, 4, 1, 5));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 5, 1, 5)), new range_1.Range(1, 5, 1, 5));
            m.dispose();
        });
        test('validateRange around high-low surrogate pairs 2', () => {
            const m = (0, testTextModel_1.createTextModel)('a📚📚b');
            assert.deepStrictEqual(m.validateRange(new range_1.Range(0, 0, 0, 1)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(0, 0, 0, 7)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 1)), new range_1.Range(1, 1, 1, 1));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 2)), new range_1.Range(1, 1, 1, 2));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 3)), new range_1.Range(1, 1, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 4)), new range_1.Range(1, 1, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 5)), new range_1.Range(1, 1, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 6)), new range_1.Range(1, 1, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 1, 1, 7)), new range_1.Range(1, 1, 1, 7));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 2)), new range_1.Range(1, 2, 1, 2));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 3)), new range_1.Range(1, 2, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 4)), new range_1.Range(1, 2, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 5)), new range_1.Range(1, 2, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 6)), new range_1.Range(1, 2, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 2, 1, 7)), new range_1.Range(1, 2, 1, 7));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 3)), new range_1.Range(1, 2, 1, 2));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 4)), new range_1.Range(1, 2, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 5)), new range_1.Range(1, 2, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 6)), new range_1.Range(1, 2, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 3, 1, 7)), new range_1.Range(1, 2, 1, 7));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 4, 1, 4)), new range_1.Range(1, 4, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 4, 1, 5)), new range_1.Range(1, 4, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 4, 1, 6)), new range_1.Range(1, 4, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 4, 1, 7)), new range_1.Range(1, 4, 1, 7));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 5, 1, 5)), new range_1.Range(1, 4, 1, 4));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 5, 1, 6)), new range_1.Range(1, 4, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 5, 1, 7)), new range_1.Range(1, 4, 1, 7));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 6, 1, 6)), new range_1.Range(1, 6, 1, 6));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 6, 1, 7)), new range_1.Range(1, 6, 1, 7));
            assert.deepStrictEqual(m.validateRange(new range_1.Range(1, 7, 1, 7)), new range_1.Range(1, 7, 1, 7));
            m.dispose();
        });
        test('modifyPosition', () => {
            const m = (0, testTextModel_1.createTextModel)('line one\nline two');
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 1), 0), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(0, 0), 0), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(30, 1), 0), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 1), 17), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 1), 1), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 1), 3), new position_1.Position(1, 4));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), 10), new position_1.Position(2, 3));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 5), 13), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), 16), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(2, 9), -17), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), -1), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 4), -3), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(2, 3), -10), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(2, 9), -13), new position_1.Position(1, 5));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(2, 9), -16), new position_1.Position(1, 2));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), 17), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), 100), new position_1.Position(2, 9));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), -2), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(1, 2), -100), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(2, 2), -100), new position_1.Position(1, 1));
            assert.deepStrictEqual(m.modifyPosition(new position_1.Position(2, 9), -18), new position_1.Position(1, 1));
            m.dispose();
        });
        test('normalizeIndentation 1', () => {
            const model = (0, testTextModel_1.createTextModel)('', undefined, {
                insertSpaces: false
            });
            assert.strictEqual(model.normalizeIndentation('\t'), '\t');
            assert.strictEqual(model.normalizeIndentation('    '), '\t');
            assert.strictEqual(model.normalizeIndentation('   '), '   ');
            assert.strictEqual(model.normalizeIndentation('  '), '  ');
            assert.strictEqual(model.normalizeIndentation(' '), ' ');
            assert.strictEqual(model.normalizeIndentation(''), '');
            assert.strictEqual(model.normalizeIndentation(' \t    '), '\t\t');
            assert.strictEqual(model.normalizeIndentation(' \t   '), '\t   ');
            assert.strictEqual(model.normalizeIndentation(' \t  '), '\t  ');
            assert.strictEqual(model.normalizeIndentation(' \t '), '\t ');
            assert.strictEqual(model.normalizeIndentation(' \t'), '\t');
            assert.strictEqual(model.normalizeIndentation('\ta'), '\ta');
            assert.strictEqual(model.normalizeIndentation('    a'), '\ta');
            assert.strictEqual(model.normalizeIndentation('   a'), '   a');
            assert.strictEqual(model.normalizeIndentation('  a'), '  a');
            assert.strictEqual(model.normalizeIndentation(' a'), ' a');
            assert.strictEqual(model.normalizeIndentation('a'), 'a');
            assert.strictEqual(model.normalizeIndentation(' \t    a'), '\t\ta');
            assert.strictEqual(model.normalizeIndentation(' \t   a'), '\t   a');
            assert.strictEqual(model.normalizeIndentation(' \t  a'), '\t  a');
            assert.strictEqual(model.normalizeIndentation(' \t a'), '\t a');
            assert.strictEqual(model.normalizeIndentation(' \ta'), '\ta');
            model.dispose();
        });
        test('normalizeIndentation 2', () => {
            const model = (0, testTextModel_1.createTextModel)('');
            assert.strictEqual(model.normalizeIndentation('\ta'), '    a');
            assert.strictEqual(model.normalizeIndentation('    a'), '    a');
            assert.strictEqual(model.normalizeIndentation('   a'), '   a');
            assert.strictEqual(model.normalizeIndentation('  a'), '  a');
            assert.strictEqual(model.normalizeIndentation(' a'), ' a');
            assert.strictEqual(model.normalizeIndentation('a'), 'a');
            assert.strictEqual(model.normalizeIndentation(' \t    a'), '        a');
            assert.strictEqual(model.normalizeIndentation(' \t   a'), '       a');
            assert.strictEqual(model.normalizeIndentation(' \t  a'), '      a');
            assert.strictEqual(model.normalizeIndentation(' \t a'), '     a');
            assert.strictEqual(model.normalizeIndentation(' \ta'), '    a');
            model.dispose();
        });
        test('getLineFirstNonWhitespaceColumn', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'asd',
                ' asd',
                '\tasd',
                '  asd',
                '\t\tasd',
                ' ',
                '  ',
                '\t',
                '\t\t',
                '  \tasd',
                '',
                ''
            ].join('\n'));
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(1), 1, '1');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(2), 2, '2');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(3), 2, '3');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(4), 3, '4');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(5), 3, '5');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(6), 0, '6');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(7), 0, '7');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(8), 0, '8');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(9), 0, '9');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(10), 4, '10');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(11), 0, '11');
            assert.strictEqual(model.getLineFirstNonWhitespaceColumn(12), 0, '12');
            model.dispose();
        });
        test('getLineLastNonWhitespaceColumn', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'asd',
                'asd ',
                'asd\t',
                'asd  ',
                'asd\t\t',
                ' ',
                '  ',
                '\t',
                '\t\t',
                'asd  \t',
                '',
                ''
            ].join('\n'));
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(1), 4, '1');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(2), 4, '2');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(3), 4, '3');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(4), 4, '4');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(5), 4, '5');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(6), 0, '6');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(7), 0, '7');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(8), 0, '8');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(9), 0, '9');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(10), 4, '10');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(11), 0, '11');
            assert.strictEqual(model.getLineLastNonWhitespaceColumn(12), 0, '12');
            model.dispose();
        });
        test('#50471. getValueInRange with invalid range', () => {
            const m = (0, testTextModel_1.createTextModel)('My First Line\r\nMy Second Line\r\nMy Third Line');
            assert.strictEqual(m.getValueInRange(new range_1.Range(1, NaN, 1, 3)), 'My');
            assert.strictEqual(m.getValueInRange(new range_1.Range(NaN, NaN, NaN, NaN)), '');
            m.dispose();
        });
        test('issue #168836: updating tabSize should also update indentSize when indentSize is set to "tabSize"', () => {
            const m = (0, testTextModel_1.createTextModel)('some text', null, {
                tabSize: 2,
                indentSize: 'tabSize'
            });
            assert.strictEqual(m.getOptions().tabSize, 2);
            assert.strictEqual(m.getOptions().indentSize, 2);
            assert.strictEqual(m.getOptions().originalIndentSize, 'tabSize');
            m.updateOptions({
                tabSize: 4
            });
            assert.strictEqual(m.getOptions().tabSize, 4);
            assert.strictEqual(m.getOptions().indentSize, 4);
            assert.strictEqual(m.getOptions().originalIndentSize, 'tabSize');
            m.dispose();
        });
    });
    suite('TextModel.mightContainRTL', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('nope', () => {
            const model = (0, testTextModel_1.createTextModel)('hello world!');
            assert.strictEqual(model.mightContainRTL(), false);
            model.dispose();
        });
        test('yes', () => {
            const model = (0, testTextModel_1.createTextModel)('Hello,\nזוהי עובדה מבוססת שדעתו');
            assert.strictEqual(model.mightContainRTL(), true);
            model.dispose();
        });
        test('setValue resets 1', () => {
            const model = (0, testTextModel_1.createTextModel)('hello world!');
            assert.strictEqual(model.mightContainRTL(), false);
            model.setValue('Hello,\nזוהי עובדה מבוססת שדעתו');
            assert.strictEqual(model.mightContainRTL(), true);
            model.dispose();
        });
        test('setValue resets 2', () => {
            const model = (0, testTextModel_1.createTextModel)('Hello,\nهناك حقيقة مثبتة منذ زمن طويل');
            assert.strictEqual(model.mightContainRTL(), true);
            model.setValue('hello world!');
            assert.strictEqual(model.mightContainRTL(), false);
            model.dispose();
        });
    });
    suite('TextModel.createSnapshot', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('empty file', () => {
            const model = (0, testTextModel_1.createTextModel)('');
            const snapshot = model.createSnapshot();
            assert.strictEqual(snapshot.read(), null);
            model.dispose();
        });
        test('file with BOM', () => {
            const model = (0, testTextModel_1.createTextModel)(strings_1.UTF8_BOM_CHARACTER + 'Hello');
            assert.strictEqual(model.getLineContent(1), 'Hello');
            const snapshot = model.createSnapshot(true);
            assert.strictEqual(snapshot.read(), strings_1.UTF8_BOM_CHARACTER + 'Hello');
            assert.strictEqual(snapshot.read(), null);
            model.dispose();
        });
        test('regular file', () => {
            const model = (0, testTextModel_1.createTextModel)('My First Line\n\t\tMy Second Line\n    Third Line\n\n1');
            const snapshot = model.createSnapshot();
            assert.strictEqual(snapshot.read(), 'My First Line\n\t\tMy Second Line\n    Third Line\n\n1');
            assert.strictEqual(snapshot.read(), null);
            model.dispose();
        });
        test('large file', () => {
            const lines = [];
            for (let i = 0; i < 1000; i++) {
                lines[i] = 'Just some text that is a bit long such that it can consume some memory';
            }
            const text = lines.join('\n');
            const model = (0, testTextModel_1.createTextModel)(text);
            const snapshot = model.createSnapshot();
            let actual = '';
            // 70999 length => at most 2 read calls are necessary
            const tmp1 = snapshot.read();
            assert.ok(tmp1);
            actual += tmp1;
            const tmp2 = snapshot.read();
            if (tmp2 === null) {
                // all good
            }
            else {
                actual += tmp2;
                assert.strictEqual(snapshot.read(), null);
            }
            assert.strictEqual(actual, text);
            model.dispose();
        });
        test('issue #119632: invalid range', () => {
            const model = (0, testTextModel_1.createTextModel)('hello world!');
            const actual = model._validateRangeRelaxedNoAllocations(new range_1.Range(undefined, 0, undefined, 1));
            assert.deepStrictEqual(actual, new range_1.Range(1, 1, 1, 1));
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvdGV4dE1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsU0FBUyxvQkFBb0IsQ0FBQyxtQkFBNEIsRUFBRSxjQUFzQixFQUFFLG9CQUE2QixFQUFFLGVBQXVCLEVBQUUsSUFBYyxFQUFFLEdBQVk7UUFDdkssTUFBTSxDQUFDLEdBQUcsSUFBQSwrQkFBZSxFQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNmLFNBQVMsRUFDVDtZQUNDLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLFlBQVksRUFBRSxtQkFBbUI7WUFDakMsaUJBQWlCLEVBQUUsSUFBSTtTQUN2QixDQUNELENBQUM7UUFDRixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDekIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRVosTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFDLG9CQUF5QyxFQUFFLGVBQThDLEVBQUUsSUFBYyxFQUFFLEdBQVk7UUFDM0ksSUFBSSxPQUFPLG9CQUFvQixLQUFLLFdBQVcsRUFBRSxDQUFDO1lBQ2pELDRCQUE0QjtZQUM1QixJQUFJLE9BQU8sZUFBZSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUM1Qyx1QkFBdUI7Z0JBQ3ZCLG9CQUFvQixDQUFDLElBQUksRUFBRSxLQUFLLEVB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Q0FBQztZQUVuRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXBGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXBGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpILE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqSCxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNGLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsRUFBRTtZQUUvRCxNQUFNLENBQUMsR0FBRyxJQUFBLCtCQUFlLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFFbEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFcEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENB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QUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRTFGLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtZQUN0RCxNQUFNLENBQUMsR0FBRyxJQUFBLCtCQUFlLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUVoRCxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFOUYsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1lBRTVELE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBQyxNQUFNLENBQUMsQ0FBQztZQUVsQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1lBRTVELE1BQU0sQ0FBQyxHQUFHLElBQUEsK0JBQWUsRUFBQyxRQUFRLENBQUMsQ0FBQztZQUVwQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7WUFFM0IsTUFBTSxDQUFDLEdBQUcsSUFBQSwrQkFBZSxFQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7WUFDbkMsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQkFBZSxFQUFDLEVBQUUsRUFDL0IsU0FBUyxFQUNUO2dCQUNDLFlBQVksRUFBRSxLQUFLO2FBQ25CLENBQ0QsQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTVELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FB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