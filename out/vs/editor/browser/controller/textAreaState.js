/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, strings, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PagedScreenReaderStrategy = exports.TextAreaState = exports._debugComposition = void 0;
    exports._debugComposition = false;
    class TextAreaState {
        static { this.EMPTY = new TextAreaState('', 0, 0, null, undefined); }
        constructor(value, 
        /** the offset where selection starts inside `value` */
        selectionStart, 
        /** the offset where selection ends inside `value` */
        selectionEnd, 
        /** the editor range in the view coordinate system that matches the selection inside `value` */
        selection, 
        /** the visible line count (wrapped, not necessarily matching \n characters) for the text in `value` before `selectionStart` */
        newlineCountBeforeSelection) {
            this.value = value;
            this.selectionStart = selectionStart;
            this.selectionEnd = selectionEnd;
            this.selection = selection;
            this.newlineCountBeforeSelection = newlineCountBeforeSelection;
        }
        toString() {
            return `[ <${this.value}>, selectionStart: ${this.selectionStart}, selectionEnd: ${this.selectionEnd}]`;
        }
        static readFromTextArea(textArea, previousState) {
            const value = textArea.getValue();
            const selectionStart = textArea.getSelectionStart();
            const selectionEnd = textArea.getSelectionEnd();
            let newlineCountBeforeSelection = undefined;
            if (previousState) {
                const valueBeforeSelectionStart = value.substring(0, selectionStart);
                const previousValueBeforeSelectionStart = previousState.value.substring(0, previousState.selectionStart);
                if (valueBeforeSelectionStart === previousValueBeforeSelectionStart) {
                    newlineCountBeforeSelection = previousState.newlineCountBeforeSelection;
                }
            }
            return new TextAreaState(value, selectionStart, selectionEnd, null, newlineCountBeforeSelection);
        }
        collapseSelection() {
            if (this.selectionStart === this.value.length) {
                return this;
            }
            return new TextAreaState(this.value, this.value.length, this.value.length, null, undefined);
        }
        writeToTextArea(reason, textArea, select) {
            if (exports._debugComposition) {
                console.log(`writeToTextArea ${reason}: ${this.toString()}`);
            }
            textArea.setValue(reason, this.value);
            if (select) {
                textArea.setSelectionRange(reason, this.selectionStart, this.selectionEnd);
            }
        }
        deduceEditorPosition(offset) {
            if (offset <= this.selectionStart) {
                const str = this.value.substring(offset, this.selectionStart);
                return this._finishDeduceEditorPosition(this.selection?.getStartPosition() ?? null, str, -1);
            }
            if (offset >= this.selectionEnd) {
                const str = this.value.substring(this.selectionEnd, offset);
                return this._finishDeduceEditorPosition(this.selection?.getEndPosition() ?? null, str, 1);
            }
            const str1 = this.value.substring(this.selectionStart, offset);
            if (str1.indexOf(String.fromCharCode(8230)) === -1) {
                return this._finishDeduceEditorPosition(this.selection?.getStartPosition() ?? null, str1, 1);
            }
            const str2 = this.value.substring(offset, this.selectionEnd);
            return this._finishDeduceEditorPosition(this.selection?.getEndPosition() ?? null, str2, -1);
        }
        _finishDeduceEditorPosition(anchor, deltaText, signum) {
            let lineFeedCnt = 0;
            let lastLineFeedIndex = -1;
            while ((lastLineFeedIndex = deltaText.indexOf('\n', lastLineFeedIndex + 1)) !== -1) {
                lineFeedCnt++;
            }
            return [anchor, signum * deltaText.length, lineFeedCnt];
        }
        static deduceInput(previousState, currentState, couldBeEmojiInput) {
            if (!previousState) {
                // This is the EMPTY state
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            if (exports._debugComposition) {
                console.log('------------------------deduceInput');
                console.log(`PREVIOUS STATE: ${previousState.toString()}`);
                console.log(`CURRENT STATE: ${currentState.toString()}`);
            }
            const prefixLength = Math.min(strings.commonPrefixLength(previousState.value, currentState.value), previousState.selectionStart, currentState.selectionStart);
            const suffixLength = Math.min(strings.commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd, currentState.value.length - currentState.selectionEnd);
            const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
            const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
            const previousSelectionStart = previousState.selectionStart - prefixLength;
            const previousSelectionEnd = previousState.selectionEnd - prefixLength;
            const currentSelectionStart = currentState.selectionStart - prefixLength;
            const currentSelectionEnd = currentState.selectionEnd - prefixLength;
            if (exports._debugComposition) {
                console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
                console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
            }
            if (currentSelectionStart === currentSelectionEnd) {
                // no current selection
                const replacePreviousCharacters = (previousState.selectionStart - prefixLength);
                if (exports._debugComposition) {
                    console.log(`REMOVE PREVIOUS: ${replacePreviousCharacters} chars`);
                }
                return {
                    text: currentValue,
                    replacePrevCharCnt: replacePreviousCharacters,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            // there is a current selection => composition case
            const replacePreviousCharacters = previousSelectionEnd - previousSelectionStart;
            return {
                text: currentValue,
                replacePrevCharCnt: replacePreviousCharacters,
                replaceNextCharCnt: 0,
                positionDelta: 0
            };
        }
        static deduceAndroidCompositionInput(previousState, currentState) {
            if (!previousState) {
                // This is the EMPTY state
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            if (exports._debugComposition) {
                console.log('------------------------deduceAndroidCompositionInput');
                console.log(`PREVIOUS STATE: ${previousState.toString()}`);
                console.log(`CURRENT STATE: ${currentState.toString()}`);
            }
            if (previousState.value === currentState.value) {
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: currentState.selectionEnd - previousState.selectionEnd
                };
            }
            const prefixLength = Math.min(strings.commonPrefixLength(previousState.value, currentState.value), previousState.selectionEnd);
            const suffixLength = Math.min(strings.commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd);
            const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
            const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
            const previousSelectionStart = previousState.selectionStart - prefixLength;
            const previousSelectionEnd = previousState.selectionEnd - prefixLength;
            const currentSelectionStart = currentState.selectionStart - prefixLength;
            const currentSelectionEnd = currentState.selectionEnd - prefixLength;
            if (exports._debugComposition) {
                console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
                console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
            }
            return {
                text: currentValue,
                replacePrevCharCnt: previousSelectionEnd,
                replaceNextCharCnt: previousValue.length - previousSelectionEnd,
                positionDelta: currentSelectionEnd - currentValue.length
            };
        }
    }
    exports.TextAreaState = TextAreaState;
    class PagedScreenReaderStrategy {
        static _getPageOfLine(lineNumber, linesPerPage) {
            return Math.floor((lineNumber - 1) / linesPerPage);
        }
        static _getRangeForPage(page, linesPerPage) {
            const offset = page * linesPerPage;
            const startLineNumber = offset + 1;
            const endLineNumber = offset + linesPerPage;
            return new range_1.Range(startLineNumber, 1, endLineNumber + 1, 1);
        }
        static fromEditorSelection(model, selection, linesPerPage, trimLongText) {
            // Chromium handles very poorly text even of a few thousand chars
            // Cut text to avoid stalling the entire UI
            const LIMIT_CHARS = 500;
            const selectionStartPage = PagedScreenReaderStrategy._getPageOfLine(selection.startLineNumber, linesPerPage);
            const selectionStartPageRange = PagedScreenReaderStrategy._getRangeForPage(selectionStartPage, linesPerPage);
            const selectionEndPage = PagedScreenReaderStrategy._getPageOfLine(selection.endLineNumber, linesPerPage);
            const selectionEndPageRange = PagedScreenReaderStrategy._getRangeForPage(selectionEndPage, linesPerPage);
            let pretextRange = selectionStartPageRange.intersectRanges(new range_1.Range(1, 1, selection.startLineNumber, selection.startColumn));
            if (trimLongText && model.getValueLengthInRange(pretextRange, 1 /* EndOfLinePreference.LF */) > LIMIT_CHARS) {
                const pretextStart = model.modifyPosition(pretextRange.getEndPosition(), -LIMIT_CHARS);
                pretextRange = range_1.Range.fromPositions(pretextStart, pretextRange.getEndPosition());
            }
            const pretext = model.getValueInRange(pretextRange, 1 /* EndOfLinePreference.LF */);
            const lastLine = model.getLineCount();
            const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
            let posttextRange = selectionEndPageRange.intersectRanges(new range_1.Range(selection.endLineNumber, selection.endColumn, lastLine, lastLineMaxColumn));
            if (trimLongText && model.getValueLengthInRange(posttextRange, 1 /* EndOfLinePreference.LF */) > LIMIT_CHARS) {
                const posttextEnd = model.modifyPosition(posttextRange.getStartPosition(), LIMIT_CHARS);
                posttextRange = range_1.Range.fromPositions(posttextRange.getStartPosition(), posttextEnd);
            }
            const posttext = model.getValueInRange(posttextRange, 1 /* EndOfLinePreference.LF */);
            let text;
            if (selectionStartPage === selectionEndPage || selectionStartPage + 1 === selectionEndPage) {
                // take full selection
                text = model.getValueInRange(selection, 1 /* EndOfLinePreference.LF */);
            }
            else {
                const selectionRange1 = selectionStartPageRange.intersectRanges(selection);
                const selectionRange2 = selectionEndPageRange.intersectRanges(selection);
                text = (model.getValueInRange(selectionRange1, 1 /* EndOfLinePreference.LF */)
                    + String.fromCharCode(8230)
                    + model.getValueInRange(selectionRange2, 1 /* EndOfLinePreference.LF */));
            }
            if (trimLongText && text.length > 2 * LIMIT_CHARS) {
                text = text.substring(0, LIMIT_CHARS) + String.fromCharCode(8230) + text.substring(text.length - LIMIT_CHARS, text.length);
            }
            return new TextAreaState(pretext + text + posttext, pretext.length, pretext.length + text.length, selection, pretextRange.endLineNumber - pretextRange.startLineNumber);
        }
    }
    exports.PagedScreenReaderStrategy = PagedScreenReaderStrategy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbnRyb2xsZXIvdGV4dEFyZWFTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPbkYsUUFBQSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUEwQnZDLE1BQWEsYUFBYTtpQkFFRixVQUFLLEdBQUcsSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRTVFLFlBQ2lCLEtBQWE7UUFDN0IsdURBQXVEO1FBQ3ZDLGNBQXNCO1FBQ3RDLHFEQUFxRDtRQUNyQyxZQUFvQjtRQUNwQywrRkFBK0Y7UUFDL0UsU0FBdUI7UUFDdkMsK0hBQStIO1FBQy9HLDJCQUErQztZQVIvQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBRWIsbUJBQWMsR0FBZCxjQUFjLENBQVE7WUFFdEIsaUJBQVksR0FBWixZQUFZLENBQVE7WUFFcEIsY0FBUyxHQUFULFNBQVMsQ0FBYztZQUV2QixnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQW9CO1FBQzVELENBQUM7UUFFRSxRQUFRO1lBQ2QsT0FBTyxNQUFNLElBQUksQ0FBQyxLQUFLLHNCQUFzQixJQUFJLENBQUMsY0FBYyxtQkFBbUIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDO1FBQ3pHLENBQUM7UUFFTSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBMEIsRUFBRSxhQUFtQztZQUM3RixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDcEQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGVBQWUsRUFB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