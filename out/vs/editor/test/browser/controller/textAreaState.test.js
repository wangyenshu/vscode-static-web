/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/browser/controller/textAreaState", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, textAreaState_1, range_1, selection_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockTextAreaWrapper extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._value = '';
            this._selectionStart = 0;
            this._selectionEnd = 0;
        }
        getValue() {
            return this._value;
        }
        setValue(reason, value) {
            this._value = value;
            this._selectionStart = this._value.length;
            this._selectionEnd = this._value.length;
        }
        getSelectionStart() {
            return this._selectionStart;
        }
        getSelectionEnd() {
            return this._selectionEnd;
        }
        setSelectionRange(reason, selectionStart, selectionEnd) {
            if (selectionStart < 0) {
                selectionStart = 0;
            }
            if (selectionStart > this._value.length) {
                selectionStart = this._value.length;
            }
            if (selectionEnd < 0) {
                selectionEnd = 0;
            }
            if (selectionEnd > this._value.length) {
                selectionEnd = this._value.length;
            }
            this._selectionStart = selectionStart;
            this._selectionEnd = selectionEnd;
        }
    }
    function equalsTextAreaState(a, b) {
        return (a.value === b.value
            && a.selectionStart === b.selectionStart
            && a.selectionEnd === b.selectionEnd
            && range_1.Range.equalsRange(a.selection, b.selection)
            && a.newlineCountBeforeSelection === b.newlineCountBeforeSelection);
    }
    suite('TextAreaState', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertTextAreaState(actual, value, selectionStart, selectionEnd) {
            const desired = new textAreaState_1.TextAreaState(value, selectionStart, selectionEnd, null, undefined);
            assert.ok(equalsTextAreaState(desired, actual), desired.toString() + ' == ' + actual.toString());
        }
        test('fromTextArea', () => {
            const textArea = new MockTextAreaWrapper();
            textArea._value = 'Hello world!';
            textArea._selectionStart = 1;
            textArea._selectionEnd = 12;
            let actual = textAreaState_1.TextAreaState.readFromTextArea(textArea, null);
            assertTextAreaState(actual, 'Hello world!', 1, 12);
            assert.strictEqual(actual.value, 'Hello world!');
            assert.strictEqual(actual.selectionStart, 1);
            actual = actual.collapseSelection();
            assertTextAreaState(actual, 'Hello world!', 12, 12);
            textArea.dispose();
        });
        test('applyToTextArea', () => {
            const textArea = new MockTextAreaWrapper();
            textArea._value = 'Hello world!';
            textArea._selectionStart = 1;
            textArea._selectionEnd = 12;
            let state = new textAreaState_1.TextAreaState('Hi world!', 2, 2, null, undefined);
            state.writeToTextArea('test', textArea, false);
            assert.strictEqual(textArea._value, 'Hi world!');
            assert.strictEqual(textArea._selectionStart, 9);
            assert.strictEqual(textArea._selectionEnd, 9);
            state = new textAreaState_1.TextAreaState('Hi world!', 3, 3, null, undefined);
            state.writeToTextArea('test', textArea, false);
            assert.strictEqual(textArea._value, 'Hi world!');
            assert.strictEqual(textArea._selectionStart, 9);
            assert.strictEqual(textArea._selectionEnd, 9);
            state = new textAreaState_1.TextAreaState('Hi world!', 0, 2, null, undefined);
            state.writeToTextArea('test', textArea, true);
            assert.strictEqual(textArea._value, 'Hi world!');
            assert.strictEqual(textArea._selectionStart, 0);
            assert.strictEqual(textArea._selectionEnd, 2);
            textArea.dispose();
        });
        function testDeduceInput(prevState, value, selectionStart, selectionEnd, couldBeEmojiInput, expected, expectedCharReplaceCnt) {
            prevState = prevState || textAreaState_1.TextAreaState.EMPTY;
            const textArea = new MockTextAreaWrapper();
            textArea._value = value;
            textArea._selectionStart = selectionStart;
            textArea._selectionEnd = selectionEnd;
            const newState = textAreaState_1.TextAreaState.readFromTextArea(textArea, null);
            const actual = textAreaState_1.TextAreaState.deduceInput(prevState, newState, couldBeEmojiInput);
            assert.deepStrictEqual(actual, {
                text: expected,
                replacePrevCharCnt: expectedCharReplaceCnt,
                replaceNextCharCnt: 0,
                positionDelta: 0,
            });
            textArea.dispose();
        }
        test('extractNewText - no previous state with selection', () => {
            testDeduceInput(null, 'a', 0, 1, true, 'a', 0);
        });
        test('issue #2586: Replacing selected end-of-line with newline locks up the document', () => {
            testDeduceInput(new textAreaState_1.TextAreaState(']\n', 1, 2, null, undefined), ']\n', 2, 2, true, '\n', 0);
        });
        test('extractNewText - no previous state without selection', () => {
            testDeduceInput(null, 'a', 1, 1, true, 'a', 0);
        });
        test('extractNewText - typing does not cause a selection', () => {
            testDeduceInput(textAreaState_1.TextAreaState.EMPTY, 'a', 0, 1, true, 'a', 0);
        });
        test('extractNewText - had the textarea empty', () => {
            testDeduceInput(textAreaState_1.TextAreaState.EMPTY, 'a', 1, 1, true, 'a', 0);
        });
        test('extractNewText - had the entire line selected', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 0, 12, null, undefined), 'H', 1, 1, true, 'H', 0);
        });
        test('extractNewText - had previous text 1', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 12, 12, null, undefined), 'Hello world!a', 13, 13, true, 'a', 0);
        });
        test('extractNewText - had previous text 2', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 0, 0, null, undefined), 'aHello world!', 1, 1, true, 'a', 0);
        });
        test('extractNewText - had previous text 3', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 6, 11, null, undefined), 'Hello other!', 11, 11, true, 'other', 0);
        });
        test('extractNewText - IME', () => {
            testDeduceInput(textAreaState_1.TextAreaState.EMPTY, 'これは', 3, 3, true, 'これは', 0);
        });
        test('extractNewText - isInOverwriteMode', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 0, 0, null, undefined), 'Aello world!', 1, 1, true, 'A', 0);
        });
        test('extractMacReplacedText - does nothing if there is selection', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, undefined), 'Hellö world!', 4, 5, true, 'ö', 0);
        });
        test('extractMacReplacedText - does nothing if there is more than one extra char', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, undefined), 'Hellöö world!', 5, 5, true, 'öö', 1);
        });
        test('extractMacReplacedText - does nothing if there is more than one changed char', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, undefined), 'Helöö world!', 5, 5, true, 'öö', 2);
        });
        test('extractMacReplacedText', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, undefined), 'Hellö world!', 5, 5, true, 'ö', 1);
        });
        test('issue #25101 - First key press ignored', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('a', 0, 1, null, undefined), 'a', 1, 1, true, 'a', 0);
        });
        test('issue #16520 - Cmd-d of single character followed by typing same character as has no effect', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('x x', 0, 1, null, undefined), 'x x', 1, 1, true, 'x', 0);
        });
        function testDeduceAndroidCompositionInput(prevState, value, selectionStart, selectionEnd, expected, expectedReplacePrevCharCnt, expectedReplaceNextCharCnt, expectedPositionDelta) {
            prevState = prevState || textAreaState_1.TextAreaState.EMPTY;
            const textArea = new MockTextAreaWrapper();
            textArea._value = value;
            textArea._selectionStart = selectionStart;
            textArea._selectionEnd = selectionEnd;
            const newState = textAreaState_1.TextAreaState.readFromTextArea(textArea, null);
            const actual = textAreaState_1.TextAreaState.deduceAndroidCompositionInput(prevState, newState);
            assert.deepStrictEqual(actual, {
                text: expected,
                replacePrevCharCnt: expectedReplacePrevCharCnt,
                replaceNextCharCnt: expectedReplaceNextCharCnt,
                positionDelta: expectedPositionDelta,
            });
            textArea.dispose();
        }
        test('Android composition input 1', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('Microsoft', 4, 4, null, undefined), 'Microsoft', 4, 4, '', 0, 0, 0);
        });
        test('Android composition input 2', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('Microsoft', 4, 4, null, undefined), 'Microsoft', 0, 9, '', 0, 0, 5);
        });
        test('Android composition input 3', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('Microsoft', 0, 9, null, undefined), 'Microsoft\'s', 11, 11, '\'s', 0, 0, 0);
        });
        test('Android backspace', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('undefinedVariable', 2, 2, null, undefined), 'udefinedVariable', 1, 1, '', 1, 0, 0);
        });
        suite('PagedScreenReaderStrategy', () => {
            function testPagedScreenReaderStrategy(lines, selection, expected) {
                const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
                const actual = textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(model, selection, 10, true);
                assert.ok(equalsTextAreaState(actual, expected));
                model.dispose();
            }
            test('simple', () => {
                testPagedScreenReaderStrategy([
                    'Hello world!'
                ], new selection_1.Selection(1, 13, 1, 13), new textAreaState_1.TextAreaState('Hello world!', 12, 12, new range_1.Range(1, 13, 1, 13), 0));
                testPagedScreenReaderStrategy([
                    'Hello world!'
                ], new selection_1.Selection(1, 1, 1, 1), new textAreaState_1.TextAreaState('Hello world!', 0, 0, new range_1.Range(1, 1, 1, 1), 0));
                testPagedScreenReaderStrategy([
                    'Hello world!'
                ], new selection_1.Selection(1, 1, 1, 6), new textAreaState_1.TextAreaState('Hello world!', 0, 5, new range_1.Range(1, 1, 1, 6), 0));
            });
            test('multiline', () => {
                testPagedScreenReaderStrategy([
                    'Hello world!',
                    'How are you?'
                ], new selection_1.Selection(1, 1, 1, 1), new textAreaState_1.TextAreaState('Hello world!\nHow are you?', 0, 0, new range_1.Range(1, 1, 1, 1), 0));
                testPagedScreenReaderStrategy([
                    'Hello world!',
                    'How are you?'
                ], new selection_1.Selection(2, 1, 2, 1), new textAreaState_1.TextAreaState('Hello world!\nHow are you?', 13, 13, new range_1.Range(2, 1, 2, 1), 1));
            });
            test('page', () => {
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(1, 1, 1, 1), new textAreaState_1.TextAreaState('L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\n', 0, 0, new range_1.Range(1, 1, 1, 1), 0));
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(11, 1, 11, 1), new textAreaState_1.TextAreaState('L11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\n', 0, 0, new range_1.Range(11, 1, 11, 1), 0));
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(12, 1, 12, 1), new textAreaState_1.TextAreaState('L11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\n', 4, 4, new range_1.Range(12, 1, 12, 1), 1));
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(21, 1, 21, 1), new textAreaState_1.TextAreaState('L21', 0, 0, new range_1.Range(21, 1, 21, 1), 0));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFTdGF0ZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9jb250cm9sbGVyL3RleHRBcmVhU3RhdGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBTTNDO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRU0sUUFBUTtZQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRU0sUUFBUSxDQUFDLE1BQWMsRUFBRSxLQUFhO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUN6QyxDQUFDO1FBRU0saUJBQWlCO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRU0sZUFBZTtZQUNyQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVNLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxjQUFzQixFQUFFLFlBQW9CO1lBQ3BGLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN4QixjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFB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