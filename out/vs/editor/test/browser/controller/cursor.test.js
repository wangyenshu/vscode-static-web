/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/model/textModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, coreCommands_1, editOperation_1, position_1, range_1, selection_1, languages_1, language_1, languageConfiguration_1, languageConfigurationRegistry_1, nullTokenize_1, textModel_1, testCodeEditor_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- utils
    function moveTo(editor, viewModel, lineNumber, column, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.MoveToSelect.runCoreEditorCommand(viewModel, {
                position: new position_1.Position(lineNumber, column)
            });
        }
        else {
            coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, {
                position: new position_1.Position(lineNumber, column)
            });
        }
    }
    function moveLeft(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorLeftSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorLeft.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveRight(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorRightSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorRight.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveDown(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorDownSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorDown.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveUp(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorUpSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorUp.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToBeginningOfLine(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorHomeSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorHome.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToEndOfLine(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorEndSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorEnd.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToBeginningOfBuffer(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorTopSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorTop.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToEndOfBuffer(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorBottomSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorBottom.runCoreEditorCommand(viewModel, {});
        }
    }
    function assertCursor(viewModel, what) {
        let selections;
        if (what instanceof position_1.Position) {
            selections = [new selection_1.Selection(what.lineNumber, what.column, what.lineNumber, what.column)];
        }
        else if (what instanceof selection_1.Selection) {
            selections = [what];
        }
        else {
            selections = what;
        }
        const actual = viewModel.getSelections().map(s => s.toString());
        const expected = selections.map(s => s.toString());
        assert.deepStrictEqual(actual, expected);
    }
    suite('Editor Controller - Cursor', () => {
        const LINE1 = '    \tMy First Line\t ';
        const LINE2 = '\tMy Second Line';
        const LINE3 = '    Third Line🐶';
        const LINE4 = '';
        const LINE5 = '1';
        const TEXT = LINE1 + '\r\n' +
            LINE2 + '\n' +
            LINE3 + '\n' +
            LINE4 + '\r\n' +
            LINE5;
        function runTest(callback) {
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                callback(editor, viewModel);
            });
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('cursor initialized', () => {
            runTest((editor, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        // --------- absolute move
        test('no move', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2);
                assertCursor(viewModel, new position_1.Position(1, 2));
            });
        });
        test('move in selection mode', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 1, 2));
            });
        });
        test('move beyond line end', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 25);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move empty line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 4, 20);
                assertCursor(viewModel, new position_1.Position(4, 1));
            });
        });
        test('move one char line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 20);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        test('selection down', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
            });
        });
        test('move and then select', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 3);
                assertCursor(viewModel, new position_1.Position(2, 3));
                moveTo(editor, viewModel, 2, 15, true);
                assertCursor(viewModel, new selection_1.Selection(2, 3, 2, 15));
                moveTo(editor, viewModel, 1, 2, true);
                assertCursor(viewModel, new selection_1.Selection(2, 3, 1, 2));
            });
        });
        // --------- move left
        test('move left on top left position', () => {
            runTest((editor, viewModel) => {
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move left', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                assertCursor(viewModel, new position_1.Position(1, 3));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 2));
            });
        });
        test('move left with surrogate pair', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 17);
                assertCursor(viewModel, new position_1.Position(3, 17));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 15));
            });
        });
        test('move left goes to previous row', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                assertCursor(viewModel, new position_1.Position(2, 1));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 21));
            });
        });
        test('move left selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                assertCursor(viewModel, new position_1.Position(2, 1));
                moveLeft(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(2, 1, 1, 21));
            });
        });
        // --------- move right
        test('move right on bottom right position', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 2);
                assertCursor(viewModel, new position_1.Position(5, 2));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        test('move right', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                assertCursor(viewModel, new position_1.Position(1, 3));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 4));
            });
        });
        test('move right with surrogate pair', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 15);
                assertCursor(viewModel, new position_1.Position(3, 15));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 17));
            });
        });
        test('move right goes to next row', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 21);
                assertCursor(viewModel, new position_1.Position(1, 21));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
            });
        });
        test('move right selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 21);
                assertCursor(viewModel, new position_1.Position(1, 21));
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 21, 2, 1));
            });
        });
        // --------- move down
        test('move down', () => {
            runTest((editor, viewModel) => {
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        test('move down with selection', () => {
            runTest((editor, viewModel) => {
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 3, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 4, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 5, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 5, 2));
            });
        });
        test('move down with tabs', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                assertCursor(viewModel, new position_1.Position(1, 5));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        // --------- move up
        test('move up', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 5);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 5));
            });
        });
        test('move up with selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 5);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveUp(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 2, 2));
                moveUp(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 1, 5));
            });
        });
        test('move up and down with tabs', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                assertCursor(viewModel, new position_1.Position(1, 5));
                moveDown(editor, viewModel);
                moveDown(editor, viewModel);
                moveDown(editor, viewModel);
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 5));
            });
        });
        test('move up and down with end of lines starting from a long one', () => {
            runTest((editor, viewModel) => {
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, LINE2.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, LINE3.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, LINE4.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
                moveUp(editor, viewModel);
                moveUp(editor, viewModel);
                moveUp(editor, viewModel);
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('issue #44465: cursor position not correct when move', () => {
            runTest((editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                // going once up on the first line remembers the offset visual columns
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 5));
                // going twice up on the first line discards the offset visual columns
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
            });
        });
        test('issue #144041: Cursor up/down works', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'Word1 Word2 Word3 Word4',
                'Word5 Word6 Word7 Word8',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, { wrappingIndent: 'indent', wordWrap: 'wordWrapColumn', wordWrapColumn: 20 }, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                const cursorPositions = [];
                function reportCursorPosition() {
                    cursorPositions.push(viewModel.getCursorStates()[0].viewState.position.toString());
                }
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                assert.deepStrictEqual(cursorPositions, [
                    '(1,1)',
                    '(2,5)',
                    '(3,1)',
                    '(4,5)',
                    '(4,10)',
                    '(3,1)',
                    '(2,5)',
                    '(1,1)',
                    '(1,1)',
                ]);
            });
            model.dispose();
        });
        test('issue #140195: Cursor up/down makes progress', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'Word1 Word2 Word3 Word4',
                'Word5 Word6 Word7 Word8',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, { wrappingIndent: 'indent', wordWrap: 'wordWrapColumn', wordWrapColumn: 20 }, (editor, viewModel) => {
                editor.changeDecorations((changeAccessor) => {
                    changeAccessor.deltaDecorations([], [
                        {
                            range: new range_1.Range(1, 22, 1, 22),
                            options: {
                                showIfCollapsed: true,
                                description: 'test',
                                after: {
                                    content: 'some very very very very very very very very long text',
                                }
                            }
                        }
                    ]);
                });
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                const cursorPositions = [];
                function reportCursorPosition() {
                    cursorPositions.push(viewModel.getCursorStates()[0].viewState.position.toString());
                }
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                assert.deepStrictEqual(cursorPositions, [
                    '(1,1)',
                    '(2,5)',
                    '(5,19)',
                    '(6,1)',
                    '(7,5)',
                    '(6,1)',
                    '(2,8)',
                    '(1,1)',
                    '(1,1)',
                ]);
            });
            model.dispose();
        });
        // --------- move to beginning of line
        test('move to beginning of line', () => {
            runTest((editor, viewModel) => {
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 6));
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of line from within line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 6));
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of line from whitespace at beginning of line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2);
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 6));
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of line from within line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveToBeginningOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 6));
                moveToBeginningOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 1));
            });
        });
        test('move to beginning of line with selection multiline forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('move to beginning of line with selection multiline backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 1, 8, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
            });
        });
        test('move to beginning of line with selection single line forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 2);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('move to beginning of line with selection single line backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 3, 2, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('issue #15401: "End" key is behaving weird when text is selected part 1', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('issue #17011: Shift+home/end now go to the end of the selection start\'s line, not the selection\'s end', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 3, 5));
            });
        });
        // --------- move to end of line
        test('move to end of line', () => {
            runTest((editor, viewModel) => {
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move to end of line from within line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 6);
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move to end of line from whitespace at end of line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 20);
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move to end of line from within line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 6);
                moveToEndOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, LINE1.length + 1));
            });
        });
        test('move to end of line with selection multiline forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1);
                moveTo(editor, viewModel, 3, 9, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        test('move to end of line with selection multiline backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 1, 1, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(1, 21, 1, 21));
            });
        });
        test('move to end of line with selection single line forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 1);
                moveTo(editor, viewModel, 3, 9, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        test('move to end of line with selection single line backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 3, 1, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        test('issue #15401: "End" key is behaving weird when text is selected part 2', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1);
                moveTo(editor, viewModel, 3, 9, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        // --------- move to beginning of buffer
        test('move to beginning of buffer', () => {
            runTest((editor, viewModel) => {
                moveToBeginningOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of buffer from within first line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                moveToBeginningOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of buffer from within another line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToBeginningOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of buffer from within first line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                moveToBeginningOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 1));
            });
        });
        test('move to beginning of buffer from within another line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToBeginningOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 1, 1));
            });
        });
        // --------- move to end of buffer
        test('move to end of buffer', () => {
            runTest((editor, viewModel) => {
                moveToEndOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within last line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 1);
                moveToEndOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within another line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToEndOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within last line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 1);
                moveToEndOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within another line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToEndOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 5, LINE5.length + 1));
            });
        });
        // --------- misc
        test('select all', () => {
            runTest((editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.SelectAll.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, new selection_1.Selection(1, 1, 5, LINE5.length + 1));
            });
        });
        // --------- eventing
        test('no move doesn\'t trigger event', () => {
            runTest((editor, viewModel) => {
                const disposable = viewModel.onEvent((e) => {
                    assert.ok(false, 'was not expecting event');
                });
                moveTo(editor, viewModel, 1, 1);
                disposable.dispose();
            });
        });
        test('move eventing', () => {
            runTest((editor, viewModel) => {
                let events = 0;
                const disposable = viewModel.onEvent((e) => {
                    if (e.kind === 6 /* OutgoingViewModelEventKind.CursorStateChanged */) {
                        events++;
                        assert.deepStrictEqual(e.selections, [new selection_1.Selection(1, 2, 1, 2)]);
                    }
                });
                moveTo(editor, viewModel, 1, 2);
                assert.strictEqual(events, 1, 'receives 1 event');
                disposable.dispose();
            });
        });
        test('move in selection mode eventing', () => {
            runTest((editor, viewModel) => {
                let events = 0;
                const disposable = viewModel.onEvent((e) => {
                    if (e.kind === 6 /* OutgoingViewModelEventKind.CursorStateChanged */) {
                        events++;
                        assert.deepStrictEqual(e.selections, [new selection_1.Selection(1, 1, 1, 2)]);
                    }
                });
                moveTo(editor, viewModel, 1, 2, true);
                assert.strictEqual(events, 1, 'receives 1 event');
                disposable.dispose();
            });
        });
        // --------- state save & restore
        test('saveState & restoreState', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
                const savedState = JSON.stringify(viewModel.saveCursorState());
                moveTo(editor, viewModel, 1, 1, false);
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.restoreCursorState(JSON.parse(savedState));
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
            });
        });
        // --------- updating cursor
        test('Independent model edit 1', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 16, true);
                editor.getModel().applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(2, 1, 2, 2))]);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 15));
            });
        });
        test('column select 1', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '\tprivate compute(a:number): boolean {',
                '\t\tif (a + 3 === 0 || a + 5 === 0) {',
                '\t\t\treturn false;',
                '\t\t}',
                '\t}'
            ], {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new position_1.Position(1, 7));
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(4, 4),
                    viewPosition: new position_1.Position(4, 4),
                    mouseColumn: 15,
                    doColumnSelect: true
                });
                const expectedSelections = [
                    new selection_1.Selection(1, 7, 1, 12),
                    new selection_1.Selection(2, 4, 2, 9),
                    new selection_1.Selection(3, 3, 3, 6),
                    new selection_1.Selection(4, 4, 4, 4),
                ];
                assertCursor(viewModel, expectedSelections);
            });
        });
        test('grapheme breaking', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'abcabc',
                'ãããããã',
                '辻󠄀辻󠄀辻󠄀',
                'பு',
            ], {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 1, 2, 1)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 3));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
                viewModel.setSelections('test', [new selection_1.Selection(3, 1, 3, 1)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 4));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 1));
                viewModel.setSelections('test', [new selection_1.Selection(4, 1, 4, 1)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 3));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 5));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 4));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 5));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 3));
            });
        });
        test('issue #4905 - column select is biased to the right', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'var gulp = require("gulp");',
                'var path = require("path");',
                'var rimraf = require("rimraf");',
                'var isarray = require("isarray");',
                'var merge = require("merge-stream");',
                'var concat = require("gulp-concat");',
                'var newer = require("gulp-newer");',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 4, false);
                assertCursor(viewModel, new position_1.Position(1, 4));
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(4, 1),
                    viewPosition: new position_1.Position(4, 1),
                    mouseColumn: 1,
                    doColumnSelect: true
                });
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 1),
                    new selection_1.Selection(2, 4, 2, 1),
                    new selection_1.Selection(3, 4, 3, 1),
                    new selection_1.Selection(4, 4, 4, 1),
                ]);
            });
        });
        test('issue #20087: column select with mouse', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" Key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SoMEKEy" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" valuE="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="00X"/>',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 10, 10, false);
                assertCursor(viewModel, new position_1.Position(10, 10));
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(1, 1),
                    viewPosition: new position_1.Position(1, 1),
                    mouseColumn: 1,
                    doColumnSelect: true
                });
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 1),
                    new selection_1.Selection(9, 10, 9, 1),
                    new selection_1.Selection(8, 10, 8, 1),
                    new selection_1.Selection(7, 10, 7, 1),
                    new selection_1.Selection(6, 10, 6, 1),
                    new selection_1.Selection(5, 10, 5, 1),
                    new selection_1.Selection(4, 10, 4, 1),
                    new selection_1.Selection(3, 10, 3, 1),
                    new selection_1.Selection(2, 10, 2, 1),
                    new selection_1.Selection(1, 10, 1, 1),
                ]);
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(1, 1),
                    viewPosition: new position_1.Position(1, 1),
                    mouseColumn: 1,
                    doColumnSelect: true
                });
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 1),
                    new selection_1.Selection(9, 10, 9, 1),
                    new selection_1.Selection(8, 10, 8, 1),
                    new selection_1.Selection(7, 10, 7, 1),
                    new selection_1.Selection(6, 10, 6, 1),
                    new selection_1.Selection(5, 10, 5, 1),
                    new selection_1.Selection(4, 10, 4, 1),
                    new selection_1.Selection(3, 10, 3, 1),
                    new selection_1.Selection(2, 10, 2, 1),
                    new selection_1.Selection(1, 10, 1, 1),
                ]);
            });
        });
        test('issue #20087: column select with keyboard', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" Key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SoMEKEy" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" valuE="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="00X"/>',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 10, 10, false);
                assertCursor(viewModel, new position_1.Position(10, 10));
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 8)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectUp.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9),
                    new selection_1.Selection(9, 10, 9, 9),
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9)
                ]);
            });
        });
        test('issue #118062: Column selection cannot select first position of a line', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'hello world',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2, false);
                assertCursor(viewModel, new position_1.Position(1, 2));
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 2, 1, 1)
                ]);
            });
        });
        test('column select with keyboard', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'var gulp = require("gulp");',
                'var path = require("path");',
                'var rimraf = require("rimraf");',
                'var isarray = require("isarray");',
                'var merge = require("merge-stream");',
                'var concat = require("gulp-concat");',
                'var newer = require("gulp-newer");',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 4, false);
                assertCursor(viewModel, new position_1.Position(1, 4));
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5),
                    new selection_1.Selection(2, 4, 2, 5)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5),
                    new selection_1.Selection(2, 4, 2, 5),
                    new selection_1.Selection(3, 4, 3, 5),
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5),
                    new selection_1.Selection(2, 4, 2, 5),
                    new selection_1.Selection(3, 4, 3, 5),
                    new selection_1.Selection(4, 4, 4, 5),
                    new selection_1.Selection(5, 4, 5, 5),
                    new selection_1.Selection(6, 4, 6, 5),
                    new selection_1.Selection(7, 4, 7, 5),
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 6),
                    new selection_1.Selection(2, 4, 2, 6),
                    new selection_1.Selection(3, 4, 3, 6),
                    new selection_1.Selection(4, 4, 4, 6),
                    new selection_1.Selection(5, 4, 5, 6),
                    new selection_1.Selection(6, 4, 6, 6),
                    new selection_1.Selection(7, 4, 7, 6),
                ]);
                // 10 times
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 16),
                    new selection_1.Selection(2, 4, 2, 16),
                    new selection_1.Selection(3, 4, 3, 16),
                    new selection_1.Selection(4, 4, 4, 16),
                    new selection_1.Selection(5, 4, 5, 16),
                    new selection_1.Selection(6, 4, 6, 16),
                    new selection_1.Selection(7, 4, 7, 16),
                ]);
                // 10 times
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 26),
                    new selection_1.Selection(2, 4, 2, 26),
                    new selection_1.Selection(3, 4, 3, 26),
                    new selection_1.Selection(4, 4, 4, 26),
                    new selection_1.Selection(5, 4, 5, 26),
                    new selection_1.Selection(6, 4, 6, 26),
                    new selection_1.Selection(7, 4, 7, 26),
                ]);
                // 2 times => reaching the ending of lines 1 and 2
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 28),
                    new selection_1.Selection(4, 4, 4, 28),
                    new selection_1.Selection(5, 4, 5, 28),
                    new selection_1.Selection(6, 4, 6, 28),
                    new selection_1.Selection(7, 4, 7, 28),
                ]);
                // 4 times => reaching the ending of line 3
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 32),
                    new selection_1.Selection(5, 4, 5, 32),
                    new selection_1.Selection(6, 4, 6, 32),
                    new selection_1.Selection(7, 4, 7, 32),
                ]);
                // 2 times => reaching the ending of line 4
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 34),
                    new selection_1.Selection(6, 4, 6, 34),
                    new selection_1.Selection(7, 4, 7, 34),
                ]);
                // 1 time => reaching the ending of line 7
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 35),
                    new selection_1.Selection(6, 4, 6, 35),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // 3 times => reaching the ending of lines 5 & 6
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 37),
                    new selection_1.Selection(6, 4, 6, 37),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // cannot go anywhere anymore
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 37),
                    new selection_1.Selection(6, 4, 6, 37),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // cannot go anywhere anymore even if we insist
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 37),
                    new selection_1.Selection(6, 4, 6, 37),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // can easily go back
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 36),
                    new selection_1.Selection(6, 4, 6, 36),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
            });
        });
        test('setSelection / setPosition with source', () => {
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    return new languages_1.EncodedTokenizationResult(new Uint32Array(0), state);
                }
            };
            const LANGUAGE_ID = 'modelModeTest1';
            const languageRegistration = languages_1.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            const model = (0, testTextModel_1.createTextModel)('Just text', LANGUAGE_ID);
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor1, cursor1) => {
                let event = undefined;
                const disposable = editor1.onDidChangeCursorPosition(e => {
                    event = e;
                });
                editor1.setSelection(new range_1.Range(1, 2, 1, 3), 'navigation');
                assert.strictEqual(event.source, 'navigation');
                event = undefined;
                editor1.setPosition(new position_1.Position(1, 2), 'navigation');
                assert.strictEqual(event.source, 'navigation');
                disposable.dispose();
            });
            languageRegistration.dispose();
            model.dispose();
        });
    });
    suite('Editor Controller', () => {
        const surroundingLanguageId = 'surroundingLanguage';
        const indentRulesLanguageId = 'indentRulesLanguage';
        const electricCharLanguageId = 'electricCharLanguage';
        const autoClosingLanguageId = 'autoClosingLanguage';
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: surroundingLanguageId }));
            disposables.add(languageConfigurationService.register(surroundingLanguageId, {
                autoClosingPairs: [{ open: '(', close: ')' }]
            }));
            setupIndentRulesLanguage(indentRulesLanguageId, {
                decreaseIndentPattern: /^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
                increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
                indentNextLinePattern: /^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$)/,
                unIndentedLinePattern: /^(?!.*([;{}]|\S:)\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!.*(\{[^}"']*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$))/
            });
            disposables.add(languageService.registerLanguage({ id: electricCharLanguageId }));
            disposables.add(languageConfigurationService.register(electricCharLanguageId, {
                __electricCharacterSupport: {
                    docComment: { open: '/**', close: ' */' }
                },
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ]
            }));
            setupAutoClosingLanguage();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function setupOnEnterLanguage(indentAction) {
            const onEnterLanguageId = 'onEnterMode';
            disposables.add(languageService.registerLanguage({ id: onEnterLanguageId }));
            disposables.add(languageConfigurationService.register(onEnterLanguageId, {
                onEnterRules: [{
                        beforeText: /.*/,
                        action: {
                            indentAction: indentAction
                        }
                    }]
            }));
            return onEnterLanguageId;
        }
        function setupIndentRulesLanguage(languageId, indentationRules) {
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                indentationRules: indentationRules
            }));
            return languageId;
        }
        function setupAutoClosingLanguage() {
            disposables.add(languageService.registerLanguage({ id: autoClosingLanguageId }));
            disposables.add(languageConfigurationService.register(autoClosingLanguageId, {
                comments: {
                    blockComment: ['/*', '*/']
                },
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: '`', close: '`', notIn: ['string', 'comment'] },
                    { open: '/**', close: ' */', notIn: ['string'] },
                    { open: 'begin', close: 'end', notIn: ['string'] }
                ],
                __electricCharacterSupport: {
                    docComment: { open: '/**', close: ' */' }
                }
            }));
        }
        function setupAutoClosingLanguageTokenization() {
            class BaseState {
                constructor(parent = null) {
                    this.parent = parent;
                }
                clone() { return this; }
                equals(other) {
                    if (!(other instanceof BaseState)) {
                        return false;
                    }
                    if (!this.parent && !other.parent) {
                        return true;
                    }
                    if (!this.parent || !other.parent) {
                        return false;
                    }
                    return this.parent.equals(other.parent);
                }
            }
            class StringState {
                constructor(char, parentState) {
                    this.char = char;
                    this.parentState = parentState;
                }
                clone() { return this; }
                equals(other) { return other instanceof StringState && this.char === other.char && this.parentState.equals(other.parentState); }
            }
            class BlockCommentState {
                constructor(parentState) {
                    this.parentState = parentState;
                }
                clone() { return this; }
                equals(other) { return other instanceof StringState && this.parentState.equals(other.parentState); }
            }
            const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(autoClosingLanguageId);
            disposables.add(languages_1.TokenizationRegistry.register(autoClosingLanguageId, {
                getInitialState: () => new BaseState(),
                tokenize: undefined,
                tokenizeEncoded: function (line, hasEOL, _state) {
                    let state = _state;
                    const tokens = [];
                    const generateToken = (length, type, newState) => {
                        if (tokens.length > 0 && tokens[tokens.length - 1].type === type) {
                            // grow last tokens
                            tokens[tokens.length - 1].length += length;
                        }
                        else {
                            tokens.push({ length, type });
                        }
                        line = line.substring(length);
                        if (newState) {
                            state = newState;
                        }
                    };
                    while (line.length > 0) {
                        advance();
                    }
                    const result = new Uint32Array(tokens.length * 2);
                    let startIndex = 0;
                    for (let i = 0; i < tokens.length; i++) {
                        result[2 * i] = startIndex;
                        result[2 * i + 1] = ((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                            | (tokens[i].type << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */));
                        startIndex += tokens[i].length;
                    }
                    return new languages_1.EncodedTokenizationResult(result, state);
                    function advance() {
                        if (state instanceof BaseState) {
                            const m1 = line.match(/^[^'"`{}/]+/g);
                            if (m1) {
                                return generateToken(m1[0].length, 0 /* StandardTokenType.Other */);
                            }
                            if (/^['"`]/.test(line)) {
                                return generateToken(1, 2 /* StandardTokenType.String */, new StringState(line.charAt(0), state));
                            }
                            if (/^{/.test(line)) {
                                return generateToken(1, 0 /* StandardTokenType.Other */, new BaseState(state));
                            }
                            if (/^}/.test(line)) {
                                return generateToken(1, 0 /* StandardTokenType.Other */, state.parent || new BaseState());
                            }
                            if (/^\/\//.test(line)) {
                                return generateToken(line.length, 1 /* StandardTokenType.Comment */, state);
                            }
                            if (/^\/\*/.test(line)) {
                                return generateToken(2, 1 /* StandardTokenType.Comment */, new BlockCommentState(state));
                            }
                            return generateToken(1, 0 /* StandardTokenType.Other */, state);
                        }
                        else if (state instanceof StringState) {
                            const m1 = line.match(/^[^\\'"`\$]+/g);
                            if (m1) {
                                return generateToken(m1[0].length, 2 /* StandardTokenType.String */);
                            }
                            if (/^\\/.test(line)) {
                                return generateToken(2, 2 /* StandardTokenType.String */);
                            }
                            if (line.charAt(0) === state.char) {
                                return generateToken(1, 2 /* StandardTokenType.String */, state.parentState);
                            }
                            if (/^\$\{/.test(line)) {
                                return generateToken(2, 0 /* StandardTokenType.Other */, new BaseState(state));
                            }
                            return generateToken(1, 0 /* StandardTokenType.Other */, state);
                        }
                        else if (state instanceof BlockCommentState) {
                            const m1 = line.match(/^[^*]+/g);
                            if (m1) {
                                return generateToken(m1[0].length, 2 /* StandardTokenType.String */);
                            }
                            if (/^\*\//.test(line)) {
                                return generateToken(2, 1 /* StandardTokenType.Comment */, state.parentState);
                            }
                            return generateToken(1, 0 /* StandardTokenType.Other */, state);
                        }
                        else {
                            throw new Error(`unknown state`);
                        }
                    }
                }
            }));
        }
        function setAutoClosingLanguageEnabledSet(chars) {
            disposables.add(languageConfigurationService.register(autoClosingLanguageId, {
                autoCloseBefore: chars,
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: '`', close: '`', notIn: ['string', 'comment'] },
                    { open: '/**', close: ' */', notIn: ['string'] }
                ],
            }));
        }
        function createTextModel(text, languageId = null, options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, uri = null) {
            return disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId, options, uri));
        }
        function withTestCodeEditor(text, options, callback) {
            let model;
            if (typeof text === 'string') {
                model = createTextModel(text);
            }
            else if (Array.isArray(text)) {
                model = createTextModel(text.join('\n'));
            }
            else {
                model = text;
            }
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model, options));
            const viewModel = editor.getViewModel();
            viewModel.setHasFocus(true);
            callback(editor, viewModel);
        }
        function usingCursor(opts, callback) {
            const model = createTextModel(opts.text.join('\n'), opts.languageId, opts.modelOpts);
            const editorOptions = opts.editorOpts || {};
            withTestCodeEditor(model, editorOptions, (editor, viewModel) => {
                callback(editor, model, viewModel);
            });
        }
        let AutoClosingColumnType;
        (function (AutoClosingColumnType) {
            AutoClosingColumnType[AutoClosingColumnType["Normal"] = 0] = "Normal";
            AutoClosingColumnType[AutoClosingColumnType["Special1"] = 1] = "Special1";
            AutoClosingColumnType[AutoClosingColumnType["Special2"] = 2] = "Special2";
        })(AutoClosingColumnType || (AutoClosingColumnType = {}));
        function extractAutoClosingSpecialColumns(maxColumn, annotatedLine) {
            const result = [];
            for (let j = 1; j <= maxColumn; j++) {
                result[j] = 0 /* AutoClosingColumnType.Normal */;
            }
            let column = 1;
            for (let j = 0; j < annotatedLine.length; j++) {
                if (annotatedLine.charAt(j) === '|') {
                    result[column] = 1 /* AutoClosingColumnType.Special1 */;
                }
                else if (annotatedLine.charAt(j) === '!') {
                    result[column] = 2 /* AutoClosingColumnType.Special2 */;
                }
                else {
                    column++;
                }
            }
            return result;
        }
        function assertType(editor, model, viewModel, lineNumber, column, chr, expectedInsert, message) {
            const lineContent = model.getLineContent(lineNumber);
            const expected = lineContent.substr(0, column - 1) + expectedInsert + lineContent.substr(column - 1);
            moveTo(editor, viewModel, lineNumber, column);
            viewModel.type(chr, 'keyboard');
            assert.deepStrictEqual(model.getLineContent(lineNumber), expected, message);
            model.undo();
        }
        test('issue microsoft/monaco-editor#443: Indentation of a single row deletes selected text in some cases', () => {
            const model = createTextModel([
                'Hello world!',
                'another line'
            ].join('\n'), undefined, {
                insertSpaces: false
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 13)]);
                // Check that indenting maintains the selection start at column 1
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 1, 1, 14));
            });
        });
        test('Bug 9121: Auto indent + undo + redo is funky', () => {
            const model = createTextModel([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
                trimAutoWhitespace: false
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n', 'assert1');
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t', 'assert2');
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\t', 'assert3');
                viewModel.type('x');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\tx', 'assert4');
                coreCommands_1.CoreNavigationCommands.CursorLeft.runCoreEditorCommand(viewModel, {});
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\tx', 'assert5');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\nx', 'assert6');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\tx', 'assert7');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert8');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert9');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert10');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\nx', 'assert11');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\tx', 'assert12');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\nx', 'assert13');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert14');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert15');
            });
        });
        test('issue #23539: Setting model EOL isn\'t undoable', () => {
            withTestCodeEditor([
                'Hello',
                'world'
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                assertCursor(viewModel, new position_1.Position(1, 1));
                model.setEOL(0 /* EndOfLineSequence.LF */);
                assert.strictEqual(model.getValue(), 'Hello\nworld');
                model.pushEOL(1 /* EndOfLineSequence.CRLF */);
                assert.strictEqual(model.getValue(), 'Hello\r\nworld');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'Hello\nworld');
            });
        });
        test('issue #47733: Undo mangles unicode characters', () => {
            const languageId = 'myMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                surroundingPairs: [{ open: '%', close: '%' }]
            }));
            const model = createTextModel('\'👁\'', languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelection(new selection_1.Selection(1, 1, 1, 2));
                viewModel.type('%', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '%\'%👁\'', 'assert1');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\'👁\'', 'assert2');
            });
        });
        test('issue #46208: Allow empty selections in the undo/redo stack', () => {
            const model = createTextModel('');
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.type('Hello', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type('world', 'keyboard');
                viewModel.type(' ', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'Hello world ');
                assertCursor(viewModel, new position_1.Position(1, 13));
                moveLeft(editor, viewModel);
                moveRight(editor, viewModel);
                model.pushEditOperations([], [editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 12, 1, 13), '')], () => []);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world ');
                assertCursor(viewModel, new selection_1.Selection(1, 13, 1, 13));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello');
                assertCursor(viewModel, new position_1.Position(1, 6));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '');
                assertCursor(viewModel, new position_1.Position(1, 1));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello');
                assertCursor(viewModel, new position_1.Position(1, 6));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world ');
                assertCursor(viewModel, new position_1.Position(1, 13));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
            });
        });
        test('bug #16815:Shift+Tab doesn\'t go back to tabstop', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.IndentOutdent);
            const model = createTextModel([
                '     function baz() {'
            ].join('\n'), languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 6, false);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
                coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    function baz() {');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
            });
        });
        test('Bug #18293:[regression][editor] Can\'t outdent whitespace line', () => {
            const model = createTextModel([
                '      '
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    ');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
            });
        });
        test('issue #95591: Unindenting moves cursor to beginning of line', () => {
            const model = createTextModel([
                '        '
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 9, false);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    ');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
            });
        });
        test('Bug #16657: [editor] Tab on empty line of zero indentation moves cursor to position (1,1)', () => {
            const model = createTextModel([
                'function baz() {',
                '\tfunction hello() { // something here',
                '\t',
                '',
                '\t}',
                '}',
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 7, 1, false);
                assertCursor(viewModel, new selection_1.Selection(7, 1, 7, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(7), '\t');
                assertCursor(viewModel, new selection_1.Selection(7, 2, 7, 2));
            });
        });
        test('bug #16740: [editor] Cut line doesn\'t quite cut the last line', () => {
            // Part 1 => there is text on the last line
            withTestCodeEditor([
                'asdasd',
                'qwerty'
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                moveTo(editor, viewModel, 2, 1, false);
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), 'asdasd');
            });
            // Part 2 => there is no text on the last line
            withTestCodeEditor([
                'asdasd',
                ''
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                moveTo(editor, viewModel, 2, 1, false);
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), 'asdasd');
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), '');
            });
        });
        test('issue #128602: When cutting multiple lines (ctrl x), the last line will not be erased', () => {
            withTestCodeEditor([
                'a1',
                'a2',
                'a3'
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 1),
                    new selection_1.Selection(2, 1, 2, 1),
                    new selection_1.Selection(3, 1, 3, 1),
                ]);
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), '');
            });
        });
        test('Bug #11476: Double bracket surrounding + undo is broken', () => {
            usingCursor({
                text: [
                    'hello'
                ],
                languageId: surroundingLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 3, false);
                moveTo(editor, viewModel, 1, 5, true);
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 5));
                viewModel.type('(', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(1, 4, 1, 6));
                viewModel.type('(', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 7));
            });
        });
        test('issue #1140: Backspace stops prematurely', () => {
            const model = createTextModel([
                'function baz() {',
                '  return 1;',
                '};'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                moveTo(editor, viewModel, 1, 14, true);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 1, 14));
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assertCursor(viewModel, new selection_1.Selection(1, 14, 1, 14));
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), 'function baz(;');
            });
        });
        test('issue #10212: Pasting entire line does not replace selection', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2'
                ],
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1, false);
                moveTo(editor, viewModel, 2, 6, true);
                viewModel.paste('line1\n', true);
                assert.strictEqual(model.getLineContent(1), 'line1');
                assert.strictEqual(model.getLineContent(2), 'line1');
                assert.strictEqual(model.getLineContent(3), '');
            });
        });
        test('issue #74722: Pasting whole line does not replace selection', () => {
            usingCursor({
                text: [
                    'line1',
                    'line sel 2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 6, 2, 9)]);
                viewModel.paste('line1\n', true);
                assert.strictEqual(model.getLineContent(1), 'line1');
                assert.strictEqual(model.getLineContent(2), 'line line1');
                assert.strictEqual(model.getLineContent(3), ' 2');
                assert.strictEqual(model.getLineContent(4), 'line3');
            });
        });
        test('issue #4996: Multiple cursor paste pastes contents of all cursors', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1)]);
                viewModel.paste('a\nb\nc\nd', false, [
                    'a\nb',
                    'c\nd'
                ]);
                assert.strictEqual(model.getValue(), [
                    'a',
                    'bline1',
                    'c',
                    'dline2',
                    'line3'
                ].join('\n'));
            });
        });
        test('issue #16155: Paste into multiple cursors has edge case when number of lines equals number of cursors - 1', () => {
            usingCursor({
                text: [
                    'test',
                    'test',
                    'test',
                    'test'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                ]);
                viewModel.paste('aaa\nbbb\nccc\n', false, null);
                assert.strictEqual(model.getValue(), [
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                ].join('\n'));
            });
        });
        test('issue #43722: Multiline paste doesn\'t work anymore', () => {
            usingCursor({
                text: [
                    'test',
                    'test',
                    'test',
                    'test'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                ]);
                viewModel.paste('aaa\r\nbbb\r\nccc\r\nddd\r\n', false, null);
                assert.strictEqual(model.getValue(), [
                    'aaa',
                    'bbb',
                    'ccc',
                    'ddd',
                ].join('\n'));
            });
        });
        test('issue #46440: (1) Pasting a multi-line selection pastes entire selection into every insertion point', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1), new selection_1.Selection(3, 1, 3, 1)]);
                viewModel.paste('a\nb\nc', false, null);
                assert.strictEqual(model.getValue(), [
                    'aline1',
                    'bline2',
                    'cline3'
                ].join('\n'));
            });
        });
        test('issue #46440: (2) Pasting a multi-line selection pastes entire selection into every insertion point', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1), new selection_1.Selection(3, 1, 3, 1)]);
                viewModel.paste('a\nb\nc\n', false, null);
                assert.strictEqual(model.getValue(), [
                    'aline1',
                    'bline2',
                    'cline3'
                ].join('\n'));
            });
        });
        test('issue #3071: Investigate why undo stack gets corrupted', () => {
            const model = createTextModel([
                'some lines',
                'and more lines',
                'just some text',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1, false);
                moveTo(editor, viewModel, 3, 4, true);
                let isFirst = true;
                const disposable = model.onDidChangeContent(() => {
                    if (isFirst) {
                        isFirst = false;
                        viewModel.type('\t', 'keyboard');
                    }
                });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    '\t just some text'
                ].join('\n'), '001');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    '    some lines',
                    '    and more lines',
                    '    just some text',
                ].join('\n'), '002');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    'some lines',
                    'and more lines',
                    'just some text',
                ].join('\n'), '003');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    'some lines',
                    'and more lines',
                    'just some text',
                ].join('\n'), '004');
                disposable.dispose();
            });
        });
        test('issue #12950: Cannot Double Click To Insert Emoji Using OSX Emoji Panel', () => {
            usingCursor({
                text: [
                    'some lines',
                    'and more lines',
                    'just some text',
                ],
                languageId: null
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 1, false);
                viewModel.type('😍', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'some lines',
                    'and more lines',
                    '😍just some text',
                ].join('\n'));
            });
        });
        test('issue #3463: pressing tab adds spaces, but not as many as for a tab', () => {
            const model = createTextModel([
                'function a() {',
                '\tvar a = {',
                '\t\tx: 3',
                '\t};',
                '}',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(3), '\t    \tx: 3');
            });
        });
        test('issue #4312: trying to type a tab character over a sequence of spaces results in unexpected behaviour', () => {
            const model = createTextModel([
                'var foo = 123;       // this is a comment',
                'var bar = 4;       // another comment'
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 15, false);
                moveTo(editor, viewModel, 1, 22, true);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'var foo = 123;\t// this is a comment');
            });
        });
        test('issue #832: word right', () => {
            usingCursor({
                text: [
                    '   /* Just some   more   text a+= 3 +5-3 + 7 */  '
                ],
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 1, false);
                function assertWordRight(col, expectedCol) {
                    const args = {
                        position: {
                            lineNumber: 1,
                            column: col
                        }
                    };
                    if (col === 1) {
                        coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(viewModel, args);
                    }
                    else {
                        coreCommands_1.CoreNavigationCommands.WordSelectDrag.runCoreEditorCommand(viewModel, args);
                    }
                    assert.strictEqual(viewModel.getSelection().startColumn, 1, 'TEST FOR ' + col);
                    assert.strictEqual(viewModel.getSelection().endColumn, expectedCol, 'TEST FOR ' + col);
                }
                assertWordRight(1, '   '.length + 1);
                assertWordRight(2, '   '.length + 1);
                assertWordRight(3, '   '.length + 1);
                assertWordRight(4, '   '.length + 1);
                assertWordRight(5, '   /'.length + 1);
                assertWordRight(6, '   /*'.length + 1);
                assertWordRight(7, '   /* '.length + 1);
                assertWordRight(8, '   /* Just'.length + 1);
                assertWordRight(9, '   /* Just'.length + 1);
                assertWordRight(10, '   /* Just'.length + 1);
                assertWordRight(11, '   /* Just'.length + 1);
                assertWordRight(12, '   /* Just '.length + 1);
                assertWordRight(13, '   /* Just some'.length + 1);
                assertWordRight(14, '   /* Just some'.length + 1);
                assertWordRight(15, '   /* Just some'.length + 1);
                assertWordRight(16, '   /* Just some'.length + 1);
                assertWordRight(17, '   /* Just some '.length + 1);
                assertWordRight(18, '   /* Just some  '.length + 1);
                assertWordRight(19, '   /* Just some   '.length + 1);
                assertWordRight(20, '   /* Just some   more'.length + 1);
                assertWordRight(21, '   /* Just some   more'.length + 1);
                assertWordRight(22, '   /* Just some   more'.length + 1);
                assertWordRight(23, '   /* Just some   more'.length + 1);
                assertWordRight(24, '   /* Just some   more '.length + 1);
                assertWordRight(25, '   /* Just some   more  '.length + 1);
                assertWordRight(26, '   /* Just some   more   '.length + 1);
                assertWordRight(27, '   /* Just some   more   text'.length + 1);
                assertWordRight(28, '   /* Just some   more   text'.length + 1);
                assertWordRight(29, '   /* Just some   more   text'.length + 1);
                assertWordRight(30, '   /* Just some   more   text'.length + 1);
                assertWordRight(31, '   /* Just some   more   text '.length + 1);
                assertWordRight(32, '   /* Just some   more   text a'.length + 1);
                assertWordRight(33, '   /* Just some   more   text a+'.length + 1);
                assertWordRight(34, '   /* Just some   more   text a+='.length + 1);
                assertWordRight(35, '   /* Just some   more   text a+= '.length + 1);
                assertWordRight(36, '   /* Just some   more   text a+= 3'.length + 1);
                assertWordRight(37, '   /* Just some   more   text a+= 3 '.length + 1);
                assertWordRight(38, '   /* Just some   more   text a+= 3 +'.length + 1);
                assertWordRight(39, '   /* Just some   more   text a+= 3 +5'.length + 1);
                assertWordRight(40, '   /* Just some   more   text a+= 3 +5-'.length + 1);
                assertWordRight(41, '   /* Just some   more   text a+= 3 +5-3'.length + 1);
                assertWordRight(42, '   /* Just some   more   text a+= 3 +5-3 '.length + 1);
                assertWordRight(43, '   /* Just some   more   text a+= 3 +5-3 +'.length + 1);
                assertWordRight(44, '   /* Just some   more   text a+= 3 +5-3 + '.length + 1);
                assertWordRight(45, '   /* Just some   more   text a+= 3 +5-3 + 7'.length + 1);
                assertWordRight(46, '   /* Just some   more   text a+= 3 +5-3 + 7 '.length + 1);
                assertWordRight(47, '   /* Just some   more   text a+= 3 +5-3 + 7 *'.length + 1);
                assertWordRight(48, '   /* Just some   more   text a+= 3 +5-3 + 7 */'.length + 1);
                assertWordRight(49, '   /* Just some   more   text a+= 3 +5-3 + 7 */ '.length + 1);
                assertWordRight(50, '   /* Just some   more   text a+= 3 +5-3 + 7 */  '.length + 1);
            });
        });
        test('issue #33788: Wrong cursor position when double click to select a word', () => {
            const model = createTextModel([
                'Just some text'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 8) });
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 6, 1, 10));
                coreCommands_1.CoreNavigationCommands.WordSelectDrag.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 8) });
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 6, 1, 10));
            });
        });
        test('issue #12887: Double-click highlighting separating white space', () => {
            const model = createTextModel([
                'abc def'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 5) });
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 5, 1, 8));
            });
        });
        test('issue #9675: Undo/Redo adds a stop in between CHN Characters', () => {
            withTestCodeEditor([], {}, (editor, viewModel) => {
                const model = editor.getModel();
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Typing sennsei in Japanese - Hiragana
                viewModel.type('ｓ', 'keyboard');
                viewModel.compositionType('せ', 1, 0, 0);
                viewModel.compositionType('せｎ', 1, 0, 0);
                viewModel.compositionType('せん', 2, 0, 0);
                viewModel.compositionType('せんｓ', 2, 0, 0);
                viewModel.compositionType('せんせ', 3, 0, 0);
                viewModel.compositionType('せんせ', 3, 0, 0);
                viewModel.compositionType('せんせい', 3, 0, 0);
                viewModel.compositionType('せんせい', 4, 0, 0);
                viewModel.compositionType('せんせい', 4, 0, 0);
                viewModel.compositionType('せんせい', 4, 0, 0);
                assert.strictEqual(model.getLineContent(1), 'せんせい');
                assertCursor(viewModel, new position_1.Position(1, 5));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '');
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('issue #23983: Calling model.setEOL does not reset cursor position', () => {
            usingCursor({
                text: [
                    'first line',
                    'second line'
                ]
            }, (editor, model, viewModel) => {
                model.setEOL(1 /* EndOfLineSequence.CRLF */);
                viewModel.setSelections('test', [new selection_1.Selection(2, 2, 2, 2)]);
                model.setEOL(0 /* EndOfLineSequence.LF */);
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
            });
        });
        test('issue #23983: Calling model.setValue() resets cursor position', () => {
            usingCursor({
                text: [
                    'first line',
                    'second line'
                ]
            }, (editor, model, viewModel) => {
                model.setEOL(1 /* EndOfLineSequence.CRLF */);
                viewModel.setSelections('test', [new selection_1.Selection(2, 2, 2, 2)]);
                model.setValue([
                    'different first line',
                    'different second line',
                    'new third line'
                ].join('\n'));
                assertCursor(viewModel, new selection_1.Selection(1, 1, 1, 1));
            });
        });
        test('issue #36740: wordwrap creates an extra step / character at the wrapping point', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    'Lorem ipsum ',
                    'dolor sit amet ',
                    'consectetur ',
                    'adipiscing elit',
                ].join('')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 16 }, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 7, 1, 7)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 10, 1, 10));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 11, 1, 11));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 13, 1, 13));
                // moving to view line 2
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 14, 1, 14));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 13, 1, 13));
                // moving back to view line 1
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
            });
        });
        test('issue #110376: multiple selections with wordwrap behave differently', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    'just a sentence. just a ',
                    'sentence. just a sentence.',
                ].join('')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 25 }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 16),
                    new selection_1.Selection(1, 18, 1, 33),
                    new selection_1.Selection(1, 35, 1, 50),
                ]);
                moveLeft(editor, viewModel);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                    new selection_1.Selection(1, 18, 1, 18),
                    new selection_1.Selection(1, 35, 1, 35),
                ]);
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 16),
                    new selection_1.Selection(1, 18, 1, 33),
                    new selection_1.Selection(1, 35, 1, 50),
                ]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 16, 1, 16),
                    new selection_1.Selection(1, 33, 1, 33),
                    new selection_1.Selection(1, 50, 1, 50),
                ]);
            });
        });
        test('issue #98320: Multi-Cursor, Wrap lines and cursorSelectRight ==> cursors out of sync', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    'lorem_ipsum-1993x11x13',
                    'dolor_sit_amet-1998x04x27',
                    'consectetur-2007x10x08',
                    'adipiscing-2012x07x27',
                    'elit-2015x02x27',
                ].join('\n')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 16 }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 13, 1, 13),
                    new selection_1.Selection(2, 16, 2, 16),
                    new selection_1.Selection(3, 13, 3, 13),
                    new selection_1.Selection(4, 12, 4, 12),
                    new selection_1.Selection(5, 6, 5, 6),
                ]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 13),
                    new selection_1.Selection(2, 16, 2, 16),
                    new selection_1.Selection(3, 13, 3, 13),
                    new selection_1.Selection(4, 12, 4, 12),
                    new selection_1.Selection(5, 6, 5, 6),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 14),
                    new selection_1.Selection(2, 16, 2, 17),
                    new selection_1.Selection(3, 13, 3, 14),
                    new selection_1.Selection(4, 12, 4, 13),
                    new selection_1.Selection(5, 6, 5, 7),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 15),
                    new selection_1.Selection(2, 16, 2, 18),
                    new selection_1.Selection(3, 13, 3, 15),
                    new selection_1.Selection(4, 12, 4, 14),
                    new selection_1.Selection(5, 6, 5, 8),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 16),
                    new selection_1.Selection(2, 16, 2, 19),
                    new selection_1.Selection(3, 13, 3, 16),
                    new selection_1.Selection(4, 12, 4, 15),
                    new selection_1.Selection(5, 6, 5, 9),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 17),
                    new selection_1.Selection(2, 16, 2, 20),
                    new selection_1.Selection(3, 13, 3, 17),
                    new selection_1.Selection(4, 12, 4, 16),
                    new selection_1.Selection(5, 6, 5, 10),
                ]);
            });
        });
        test('issue #41573 - delete across multiple lines does not shrink the selection when word wraps', () => {
            withTestCodeEditor([
                'Authorization: \'Bearer pHKRfCTFSnGxs6akKlb9ddIXcca0sIUSZJutPHYqz7vEeHdMTMh0SGN0IGU3a0n59DXjTLRsj5EJ2u33qLNIFi9fk5XF8pK39PndLYUZhPt4QvHGLScgSkK0L4gwzkzMloTQPpKhqiikiIOvyNNSpd2o8j29NnOmdTUOKi9DVt74PD2ohKxyOrWZ6oZprTkb3eKajcpnS0LABKfaw2rmv4\','
            ].join('\n'), { wordWrap: 'wordWrapColumn', wordWrapColumn: 100 }, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 43, false);
                moveTo(editor, viewModel, 1, 147, true);
                assertCursor(viewModel, new selection_1.Selection(1, 43, 1, 147));
                editor.getModel().applyEdits([{
                        range: new range_1.Range(1, 1, 1, 43),
                        text: ''
                    }]);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 1, 105));
            });
        });
        test('issue #22717: Moving text cursor cause an incorrect position in Chinese', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    '一二三四五六七八九十',
                    '12345678901234567890',
                ].join('\n')
            ], {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                moveDown(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(2, 10, 2, 10));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(2, 11, 2, 11));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
            });
        });
        test('issue #112301: new stickyTabStops feature interferes with word wrap', () => {
            withTestCodeEditor([
                [
                    'function hello() {',
                    '        console.log(`this is a long console message`)',
                    '}',
                ].join('\n')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 32, stickyTabStops: true }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(2, 31, 2, 31)
                ]);
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 32));
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 33));
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 34));
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 33));
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 32));
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 31));
            });
        });
        test('issue #44805: Should not be able to undo in readonly editor', () => {
            const model = createTextModel([
                ''
            ].join('\n'));
            withTestCodeEditor(model, { readOnly: true }, (editor, viewModel) => {
                model.pushEditOperations([new selection_1.Selection(1, 1, 1, 1)], [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: 'Hello world!'
                    }], () => [new selection_1.Selection(1, 1, 1, 1)]);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'Hello world!');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'Hello world!');
            });
        });
        test('issue #46314: ViewModel is out of sync with Model!', () => {
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    return new languages_1.EncodedTokenizationResult(new Uint32Array(0), state);
                }
            };
            const LANGUAGE_ID = 'modelModeTest1';
            const languageRegistration = languages_1.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            const model = createTextModel('Just text', LANGUAGE_ID);
            withTestCodeEditor(model, {}, (editor1, cursor1) => {
                withTestCodeEditor(model, {}, (editor2, cursor2) => {
                    const disposable = editor1.onDidChangeCursorPosition(() => {
                        model.tokenization.tokenizeIfCheap(1);
                    });
                    model.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: '-' }]);
                    disposable.dispose();
                });
            });
            languageRegistration.dispose();
            model.dispose();
        });
        test('issue #37967: problem replacing consecutive characters', () => {
            const model = createTextModel([
                'const a = "foo";',
                'const b = ""'
            ].join('\n'));
            withTestCodeEditor(model, { multiCursorMergeOverlapping: false }, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 12, 1, 12),
                    new selection_1.Selection(1, 16, 1, 16),
                    new selection_1.Selection(2, 12, 2, 12),
                    new selection_1.Selection(2, 13, 2, 13),
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 11, 1, 11),
                    new selection_1.Selection(1, 14, 1, 14),
                    new selection_1.Selection(2, 11, 2, 11),
                    new selection_1.Selection(2, 11, 2, 11),
                ]);
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'const a = \'foo\';');
                assert.strictEqual(model.getLineContent(2), 'const b = \'\'');
            });
        });
        test('issue #15761: Cursor doesn\'t move in a redo operation', () => {
            const model = createTextModel([
                'hello'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 4, 1, 4)
                ]);
                editor.executeEdits('test', [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: '*',
                        forceMoveMarkers: true
                    }]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 5, 1, 5),
                ]);
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 4),
                ]);
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 5, 1, 5),
                ]);
            });
        });
        test('issue #42783: API Calls with Undo Leave Cursor in Wrong Position', () => {
            const model = createTextModel([
                'ab'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 1, 1, 1)
                ]);
                editor.executeEdits('test', [{
                        range: new range_1.Range(1, 1, 1, 3),
                        text: ''
                    }]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                ]);
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                ]);
                editor.executeEdits('test', [{
                        range: new range_1.Range(1, 1, 1, 2),
                        text: ''
                    }]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                ]);
            });
        });
        test('issue #85712: Paste line moves cursor to start of current line rather than start of next line', () => {
            const model = createTextModel([
                'abc123',
                ''
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(2, 1, 2, 1)
                ]);
                viewModel.paste('something\n', true);
                assert.strictEqual(model.getValue(), [
                    'abc123',
                    'something',
                    ''
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(3, 1));
            });
        });
        test('issue #84897: Left delete behavior in some languages is changed', () => {
            const model = createTextModel([
                'สวัสดี'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 7, 1, 7)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัสด');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวั');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สว');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #122914: Left delete behavior in some languages is changed (useTabStops: false)', () => {
            const model = createTextModel([
                'สวัสดี'
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 7, 1, 7)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัสด');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวั');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สว');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #99629: Emoji modifiers in text treated separately when using backspace', () => {
            const model = createTextModel([
                '👶🏾'
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                const len = model.getValueLength();
                editor.setSelections([
                    new selection_1.Selection(1, 1 + len, 1, 1 + len)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #99629: Emoji modifiers in text treated separately when using backspace (ZWJ sequence)', () => {
            const model = createTextModel([
                '👨‍👩🏽‍👧‍👦'
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                const len = model.getValueLength();
                editor.setSelections([
                    new selection_1.Selection(1, 1 + len, 1, 1 + len)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '👨‍👩🏽‍👧');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '👨‍👩🏽');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '👨');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #105730: move left behaves differently for multiple cursors', () => {
            const model = createTextModel('asdfghjkl, asdfghjkl, asdfghjkl, ');
            withTestCodeEditor(model, {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 24
            }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 10, 1, 12),
                    new selection_1.Selection(1, 21, 1, 23),
                    new selection_1.Selection(1, 32, 1, 34)
                ]);
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 10, 1, 10),
                    new selection_1.Selection(1, 21, 1, 21),
                    new selection_1.Selection(1, 32, 1, 32)
                ]);
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 10, 1, 12),
                    new selection_1.Selection(1, 21, 1, 23),
                    new selection_1.Selection(1, 32, 1, 34)
                ]);
                moveLeft(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 10, 1, 11),
                    new selection_1.Selection(1, 21, 1, 22),
                    new selection_1.Selection(1, 32, 1, 33)
                ]);
            });
        });
        test('issue #105730: move right should always skip wrap point', () => {
            const model = createTextModel('asdfghjkl, asdfghjkl, asdfghjkl, \nasdfghjkl,');
            withTestCodeEditor(model, {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 24
            }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 22, 1, 22)
                ]);
                moveRight(editor, viewModel, false);
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 24, 1, 24),
                ]);
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 22, 1, 22)
                ]);
                moveRight(editor, viewModel, true);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 22, 1, 24),
                ]);
            });
        });
        test('issue #123178: sticky tab in consecutive wrapped lines', () => {
            const model = createTextModel('    aaaa        aaaa', undefined, { tabSize: 4 });
            withTestCodeEditor(model, {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 8,
                stickyTabStops: true,
            }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 9, 1, 9)
                ]);
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 10, 1, 10),
                ]);
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 9, 1, 9),
                ]);
            });
        });
        test('Cursor honors insertSpaces configuration on new line', () => {
            usingCursor({
                text: [
                    '    \tMy First Line\t ',
                    '\tMy Second Line',
                    '    Third Line',
                    '',
                    '1'
                ]
            }, (editor, model, viewModel) => {
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 21), source: 'keyboard' });
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    \tMy First Line\t ');
                assert.strictEqual(model.getLineContent(2), '        ');
            });
        });
        test('Cursor honors insertSpaces configuration on tab', () => {
            const model = createTextModel([
                '    \tMy First Line\t ',
                'My Second Line123',
                '    Third Line',
                '',
                '1'
            ].join('\n'), undefined, {
                tabSize: 13,
                indentSize: 13,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                // Tab on column 1
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 1) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '             My Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 2
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 2) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'M            y Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 3
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 3) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My            Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 4
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 4) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My           Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 5
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 5) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My S         econd Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 5
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 5) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My S         econd Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 13
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 13) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My Second Li ne123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 14
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 14) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My Second Lin             e123');
            });
        });
        test('Enter auto-indents with insertSpaces setting 1', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.Indent);
            usingCursor({
                text: [
                    '\thello'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(2 /* EndOfLinePreference.CRLF */), '\thello\r\n        ');
            });
        });
        test('Enter auto-indents with insertSpaces setting 2', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.None);
            usingCursor({
                text: [
                    '\thello'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(2 /* EndOfLinePreference.CRLF */), '\thello\r\n    ');
            });
        });
        test('Enter auto-indents with insertSpaces setting 3', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.IndentOutdent);
            usingCursor({
                text: [
                    '\thell()'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(2 /* EndOfLinePreference.CRLF */), '\thell(\r\n        \r\n    )');
            });
        });
        test('issue #148256: Pressing Enter creates line with bad indent with insertSpaces: true', () => {
            usingCursor({
                text: [
                    '  \t'
                ],
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 4, false);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), '  \t\n    ');
            });
        });
        test('issue #148256: Pressing Enter creates line with bad indent with insertSpaces: false', () => {
            usingCursor({
                text: [
                    '  \t'
                ]
            }, (editor, model, viewModel) => {
                model.updateOptions({
                    insertSpaces: false
                });
                moveTo(editor, viewModel, 1, 4, false);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), '  \t\n\t');
            });
        });
        test('removeAutoWhitespace off', () => {
            usingCursor({
                text: [
                    '    some  line abc  '
                ],
                modelOpts: {
                    trimAutoWhitespace: false
                }
            }, (editor, model, viewModel) => {
                // Move cursor to the end, verify that we do not trim whitespaces if line has values
                moveTo(editor, viewModel, 1, model.getLineContent(1).length + 1);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '    ');
                // Try to enter again, we should trimmed previous line
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '    ');
            });
        });
        test('removeAutoWhitespace on: removes only whitespace the cursor added 1', () => {
            usingCursor({
                text: [
                    '    '
                ]
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, model.getLineContent(1).length + 1);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '    ');
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '    ');
            });
        });
        test('issue #115033: indent and appendText', () => {
            const languageId = 'onEnterMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                onEnterRules: [{
                        beforeText: /.*/,
                        action: {
                            indentAction: languageConfiguration_1.IndentAction.Indent,
                            appendText: 'x'
                        }
                    }]
            }));
            usingCursor({
                text: [
                    'text'
                ],
                languageId: languageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'text');
                assert.strictEqual(model.getLineContent(2), '    x');
                assertCursor(viewModel, new position_1.Position(2, 6));
            });
        });
        test('issue #6862: Editor removes auto inserted indentation when formatting on type', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.IndentOutdent);
            usingCursor({
                text: [
                    'function foo (params: string) {}'
                ],
                languageId: languageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 32);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'function foo (params: string) {');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '}');
                class TestCommand {
                    constructor() {
                        this._selectionId = null;
                    }
                    getEditOperations(model, builder) {
                        builder.addEditOperation(new range_1.Range(1, 13, 1, 14), '');
                        this._selectionId = builder.trackSelection(viewModel.getSelection());
                    }
                    computeCursorState(model, helper) {
                        return helper.getTrackedSelection(this._selectionId);
                    }
                }
                viewModel.executeCommand(new TestCommand(), 'autoFormat');
                assert.strictEqual(model.getLineContent(1), 'function foo(params: string) {');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '}');
            });
        });
        test('removeAutoWhitespace on: removes only whitespace the cursor added 2', () => {
            const languageId = 'testLang';
            const registration = languageService.registerLanguage({ id: languageId });
            const model = createTextModel([
                '    if (a) {',
                '        ',
                '',
                '',
                '    }'
            ].join('\n'), languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 1);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '    ');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '    }');
                moveTo(editor, viewModel, 4, 1);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '    ');
                assert.strictEqual(model.getLineContent(5), '    }');
                moveTo(editor, viewModel, 5, model.getLineMaxColumn(5));
                viewModel.type('something', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '    }something');
            });
            registration.dispose();
        });
        test('removeAutoWhitespace on: test 1', () => {
            const model = createTextModel([
                '    some  line abc  '
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                // Move cursor to the end, verify that we do not trim whitespaces if line has values
                moveTo(editor, viewModel, 1, model.getLineContent(1).length + 1);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '    ');
                // Try to enter again, we should trimmed previous line
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '    ');
                // More whitespaces
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '        ');
                // Enter and verify that trimmed again
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '        ');
                // Trimmed if we will keep only text
                moveTo(editor, viewModel, 1, 5);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '');
                // Trimmed if we will keep only text by selection
                moveTo(editor, viewModel, 2, 5);
                moveTo(editor, viewModel, 3, 1, true);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '    ');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '');
            });
        });
        test('issue #15118: remove auto whitespace when pasting entire line', () => {
            const model = createTextModel([
                '    function f() {',
                '        // I\'m gonna copy this line',
                '        return 3;',
                '    }',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, model.getLineMaxColumn(3));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '    function f() {',
                    '        // I\'m gonna copy this line',
                    '        return 3;',
                    '        ',
                    '    }',
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(4, model.getLineMaxColumn(4)));
                viewModel.paste('        // I\'m gonna copy this line\n', true);
                assert.strictEqual(model.getValue(), [
                    '    function f() {',
                    '        // I\'m gonna copy this line',
                    '        return 3;',
                    '        // I\'m gonna copy this line',
                    '',
                    '    }',
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(5, 1));
            });
        });
        test('issue #40695: maintain cursor position when copying lines using ctrl+c, ctrl+v', () => {
            const model = createTextModel([
                '    function f() {',
                '        // I\'m gonna copy this line',
                '        // Another line',
                '        return 3;',
                '    }',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([new selection_1.Selection(4, 10, 4, 10)]);
                viewModel.paste('        // I\'m gonna copy this line\n', true);
                assert.strictEqual(model.getValue(), [
                    '    function f() {',
                    '        // I\'m gonna copy this line',
                    '        // Another line',
                    '        // I\'m gonna copy this line',
                    '        return 3;',
                    '    }',
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(5, 10));
            });
        });
        test('UseTabStops is off', () => {
            const model = createTextModel([
                '    x',
                '        a    ',
                '    '
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                // DeleteLeft removes just one whitespace
                moveTo(editor, viewModel, 2, 9);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '       a    ');
            });
        });
        test('Backspace removes whitespaces with tab size', () => {
            const model = createTextModel([
                ' \t \t     x',
                '        a    ',
                '    '
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: true }, (editor, viewModel) => {
                // DeleteLeft does not remove tab size, because some text exists before
                moveTo(editor, viewModel, 2, model.getLineContent(2).length + 1);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '        a   ');
                // DeleteLeft removes tab size = 4
                moveTo(editor, viewModel, 2, 9);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '    a   ');
                // DeleteLeft removes tab size = 4
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'a   ');
                // Undo DeleteLeft - get us back to original indentation
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '        a   ');
                // Nothing is broken when cursor is in (1,1)
                moveTo(editor, viewModel, 1, 1);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \t \t     x');
                // DeleteLeft stops at tab stops even in mixed whitespace case
                moveTo(editor, viewModel, 1, 10);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \t \t    x');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \t \tx');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \tx');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'x');
                // DeleteLeft on last line
                moveTo(editor, viewModel, 3, model.getLineContent(3).length + 1);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(3), '');
                // DeleteLeft with removing new line symbol
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x\n        a   ');
                // In case of selection DeleteLeft only deletes selected text
                moveTo(editor, viewModel, 2, 3);
                moveTo(editor, viewModel, 2, 4, true);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '       a   ');
            });
        });
        test('PR #5423: Auto indent + undo + redo is funky', () => {
            const model = createTextModel([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n', 'assert1');
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t', 'assert2');
                viewModel.type('y', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty', 'assert2');
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\t', 'assert3');
                viewModel.type('x');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\tx', 'assert4');
                coreCommands_1.CoreNavigationCommands.CursorLeft.runCoreEditorCommand(viewModel, {});
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\tx', 'assert5');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\nx', 'assert6');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\tyx', 'assert7');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\tx', 'assert8');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert9');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert10');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert11');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\nx', 'assert12');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\tx', 'assert13');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\nx', 'assert14');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert15');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert16');
            });
        });
        test('issue #90973: Undo brings back model alternative version', () => {
            const model = createTextModel([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                const beforeVersion = model.getVersionId();
                const beforeAltVersion = model.getAlternativeVersionId();
                viewModel.type('Hello', 'keyboard');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                const afterVersion = model.getVersionId();
                const afterAltVersion = model.getAlternativeVersionId();
                assert.notStrictEqual(beforeVersion, afterVersion);
                assert.strictEqual(beforeAltVersion, afterAltVersion);
            });
        });
        test('Enter honors increaseIndentPattern', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                moveTo(editor, viewModel, 3, 13, false);
                assertCursor(viewModel, new selection_1.Selection(3, 13, 3, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
            });
        });
        test('Type honors decreaseIndentPattern', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\t'
                ],
                languageId: indentRulesLanguageId,
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 2, false);
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                viewModel.type('}', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                assert.strictEqual(model.getLineContent(2), '}', '001');
            });
        });
        test('Enter honors unIndentedLinePattern', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\t\t\treturn true'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 15, false);
                assertCursor(viewModel, new selection_1.Selection(2, 15, 2, 15));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
            });
        });
        test('Enter honors indentNextLinePattern', () => {
            usingCursor({
                text: [
                    'if (true)',
                    '\treturn true;',
                    'if (true)',
                    '\t\t\t\treturn true'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 14, false);
                assertCursor(viewModel, new selection_1.Selection(2, 14, 2, 14));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(3, 1, 3, 1));
                moveTo(editor, viewModel, 5, 16, false);
                assertCursor(viewModel, new selection_1.Selection(5, 16, 5, 16));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(6, 2, 6, 2));
            });
        });
        test('Enter honors indentNextLinePattern 2', () => {
            const model = createTextModel([
                'if (true)',
                '\tif (true)'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 2, 11, false);
                assertCursor(viewModel, new selection_1.Selection(2, 11, 2, 11));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('console.log();', 'keyboard');
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
            });
        });
        test('Enter honors intential indent', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    'return true;',
                    '}}'
                ],
                languageId: indentRulesLanguageId,
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 13, false);
                assertCursor(viewModel, new selection_1.Selection(3, 13, 3, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                assert.strictEqual(model.getLineContent(3), 'return true;', '001');
            });
        });
        test('Enter supports selection 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 4, 3, false);
                moveTo(editor, viewModel, 4, 4, true);
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 4));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, 1));
                assert.strictEqual(model.getLineContent(4), '\t}', '001');
            });
        });
        test('Enter supports selection 2', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 12, false);
                moveTo(editor, viewModel, 2, 13, true);
                assertCursor(viewModel, new selection_1.Selection(2, 12, 2, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
            });
        });
        test('Enter honors tabSize and insertSpaces 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {'
                ],
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(2, 5, 2, 5));
                model.tokenization.forceTokenization(model.getLineCount());
                moveTo(editor, viewModel, 3, 13, false);
                assertCursor(viewModel, new selection_1.Selection(3, 13, 3, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 9, 4, 9));
            });
        });
        test('Enter honors tabSize and insertSpaces 2', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '    if (true) {'
                ],
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 5, 2, 5));
                moveTo(editor, viewModel, 3, 16, false);
                assertCursor(viewModel, new selection_1.Selection(3, 16, 3, 16));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '    if (true) {');
                assertCursor(viewModel, new selection_1.Selection(4, 9, 4, 9));
            });
        });
        test('Enter honors tabSize and insertSpaces 3', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '    if (true) {'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                moveTo(editor, viewModel, 3, 16, false);
                assertCursor(viewModel, new selection_1.Selection(3, 16, 3, 16));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '    if (true) {');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
            });
        });
        test('Enter supports intentional indentation', () => {
            usingCursor({
                text: [
                    '\tif (true) {',
                    '\t\tswitch(true) {',
                    '\t\t\tcase true:',
                    '\t\t\t\tbreak;',
                    '\t\t}',
                    '\t}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 5, 4, false);
                assertCursor(viewModel, new selection_1.Selection(5, 4, 5, 4));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(5), '\t\t}');
                assertCursor(viewModel, new selection_1.Selection(6, 3, 6, 3));
            });
        });
        test('Enter should not adjust cursor position when press enter in the middle of a line 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 9, false);
                assertCursor(viewModel, new selection_1.Selection(3, 9, 3, 9));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '\t\t true;', '001');
            });
        });
        test('Enter should not adjust cursor position when press enter in the middle of a line 2', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3, false);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '\t\treturn true;', '001');
            });
        });
        test('Enter should not adjust cursor position when press enter in the middle of a line 3', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '    return true;',
                    '  }a}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 11, false);
                assertCursor(viewModel, new selection_1.Selection(3, 11, 3, 11));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 5, 4, 5));
                assert.strictEqual(model.getLineContent(4), '     true;', '001');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                assert.strictEqual(model.getLineContent(4), '\t\treturn true;', '001');
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, 1));
                assert.strictEqual(model.getLineContent(5), '\t\treturn true;', '002');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 2', () => {
            usingCursor({
                text: [
                    '\tif (true) {',
                    '\t\tif (true) {',
                    '\t    \treturn true;',
                    '\t\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 4, false);
                assertCursor(viewModel, new selection_1.Selection(3, 4, 3, 4));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '\t\t\treturn true;', '001');
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, 1));
                assert.strictEqual(model.getLineContent(5), '\t\t\treturn true;', '002');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 3', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '    return true;',
                    '}a}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                assert.strictEqual(model.getLineContent(4), '    return true;', '001');
                moveTo(editor, viewModel, 4, 3, false);
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 3, 5, 3));
                assert.strictEqual(model.getLineContent(5), '    return true;', '002');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 4', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '\t  return true;',
                    '}a}',
                    '',
                    'if (true) {',
                    '  if (true) {',
                    '\t  return true;',
                    '}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: {
                    tabSize: 2,
                    indentSize: 2
                }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3, false);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 4, 4, 4));
                assert.strictEqual(model.getLineContent(4), '    return true;', '001');
                moveTo(editor, viewModel, 9, 4, false);
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(10, 5, 10, 5));
                assert.strictEqual(model.getLineContent(10), '    return true;', '001');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 5', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '    return true;',
                    '    return true;',
                    ''
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { tabSize: 2 }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 5, false);
                moveTo(editor, viewModel, 4, 3, true);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 4, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '    return true;', '001');
            });
        });
        test('issue microsoft/monaco-editor#108 part 1/2: Auto indentation on Enter with selection is half broken', () => {
            usingCursor({
                text: [
                    'function baz() {',
                    '\tvar x = 1;',
                    '\t\t\t\t\t\t\treturn x;',
                    '}'
                ],
                modelOpts: {
                    insertSpaces: false,
                },
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 8, false);
                moveTo(editor, viewModel, 2, 12, true);
                assertCursor(viewModel, new selection_1.Selection(3, 8, 2, 12));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '\treturn x;');
                assertCursor(viewModel, new position_1.Position(3, 2));
            });
        });
        test('issue microsoft/monaco-editor#108 part 2/2: Auto indentation on Enter with selection is half broken', () => {
            usingCursor({
                text: [
                    'function baz() {',
                    '\tvar x = 1;',
                    '\t\t\t\t\t\t\treturn x;',
                    '}'
                ],
                modelOpts: {
                    insertSpaces: false,
                },
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 12, false);
                moveTo(editor, viewModel, 3, 8, true);
                assertCursor(viewModel, new selection_1.Selection(2, 12, 3, 8));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '\treturn x;');
                assertCursor(viewModel, new position_1.Position(3, 2));
            });
        });
        test('onEnter works if there are no indentation rules', () => {
            usingCursor({
                text: [
                    '<?',
                    '\tif (true) {',
                    '\t\techo $hi;',
                    '\t\techo $bye;',
                    '\t}',
                    '?>'
                ],
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 5, 3, false);
                assertCursor(viewModel, new selection_1.Selection(5, 3, 5, 3));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(6), '\t');
                assertCursor(viewModel, new selection_1.Selection(6, 2, 6, 2));
                assert.strictEqual(model.getLineContent(5), '\t}');
            });
        });
        test('onEnter works if there are no indentation rules 2', () => {
            usingCursor({
                text: [
                    '	if (5)',
                    '		return 5;',
                    '	'
                ],
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                assert.strictEqual(model.getLineContent(4), '\t');
            });
        });
        test('bug #16543: Tab should indent to correct indentation spot immediately', () => {
            const model = createTextModel([
                'function baz() {',
                '\tfunction hello() { // something here',
                '\t',
                '',
                '\t}',
                '}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t');
            });
        });
        test('bug #2938 (1): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '\t',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 2, false);
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t');
            });
        });
        test('bug #2938 (2): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '    ',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t');
            });
        });
        test('bug #2938 (3): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '\t\t\t',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 3, false);
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t\t');
            });
        });
        test('bug #2938 (4): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '\t\t\t\t',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 4, false);
                assertCursor(viewModel, new selection_1.Selection(4, 4, 4, 4));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t\t\t');
            });
        });
        test('bug #31015: When pressing Tab on lines and Enter rules are avail, indent straight to the right spotTab', () => {
            const onEnterLanguageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.Indent);
            const model = createTextModel([
                '    if (a) {',
                '        ',
                '',
                '',
                '    }'
            ].join('\n'), onEnterLanguageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 1);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '        ');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '    }');
            });
        });
        test('type honors indentation rules: ruby keywords', () => {
            const rubyLanguageId = setupIndentRulesLanguage('ruby', {
                increaseIndentPattern: /^\s*((begin|class|def|else|elsif|ensure|for|if|module|rescue|unless|until|when|while)|(.*\sdo\b))\b[^\{;]*$/,
                decreaseIndentPattern: /^\s*([}\]]([,)]?\s*(#|$)|\.[a-zA-Z_]\w*\b)|(end|rescue|ensure|else|elsif|when)\b)/
            });
            const model = createTextModel([
                'class Greeter',
                '  def initialize(name)',
                '    @name = name',
                '    en'
            ].join('\n'), rubyLanguageId);
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 7, false);
                assertCursor(viewModel, new selection_1.Selection(4, 7, 4, 7));
                viewModel.type('d', 'keyboard');
                assert.strictEqual(model.getLineContent(4), '  end');
            });
        });
        test('Auto indent on type: increaseIndentPattern has higher priority than decreaseIndent when inheriting', () => {
            usingCursor({
                text: [
                    '\tif (true) {',
                    '\t\tconsole.log();',
                    '\t} else if {',
                    '\t\tconsole.log()',
                    '\t}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 5, 3, false);
                assertCursor(viewModel, new selection_1.Selection(5, 3, 5, 3));
                viewModel.type('e', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 4, 5, 4));
                assert.strictEqual(model.getLineContent(5), '\t}e', 'This line should not decrease indent');
            });
        });
        test('type honors users indentation adjustment', () => {
            usingCursor({
                text: [
                    '\tif (true ||',
                    '\t ) {',
                    '\t}',
                    'if (true ||',
                    ') {',
                    '}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 3, false);
                assertCursor(viewModel, new selection_1.Selection(2, 3, 2, 3));
                viewModel.type(' ', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(2, 4, 2, 4));
                assert.strictEqual(model.getLineContent(2), '\t  ) {', 'This line should not decrease indent');
            });
        });
        test('bug 29972: if a line is line comment, open bracket should not indent next line', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\t// {',
                    '\t\t'
                ],
                languageId: indentRulesLanguageId,
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3, false);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('}', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                assert.strictEqual(model.getLineContent(3), '}');
            });
        });
        test('issue #38261: TAB key results in bizarre indentation in C++ mode ', () => {
            const languageId = 'indentRulesMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
                indentationRules: {
                    increaseIndentPattern: new RegExp("(^.*\\{[^}]*$)"),
                    decreaseIndentPattern: new RegExp("^\\s*\\}")
                }
            }));
            const model = createTextModel([
                'int main() {',
                '  return 0;',
                '}',
                '',
                'bool Foo::bar(const string &a,',
                '              const string &b) {',
                '  foo();',
                '',
                ')',
            ].join('\n'), languageId, {
                tabSize: 2,
                indentSize: 2
            });
            withTestCodeEditor(model, { autoIndent: 'advanced' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 8, 1, false);
                assertCursor(viewModel, new selection_1.Selection(8, 1, 8, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    'int main() {',
                    '  return 0;',
                    '}',
                    '',
                    'bool Foo::bar(const string &a,',
                    '              const string &b) {',
                    '  foo();',
                    '  ',
                    ')',
                ].join('\n'));
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(8, 3, 8, 3));
            });
        });
        test('issue #57197: indent rules regex should be stateless', () => {
            const languageId = setupIndentRulesLanguage('lang', {
                decreaseIndentPattern: /^\s*}$/gm,
                increaseIndentPattern: /^(?![^\S\n]*(?!--|––|——)(?:[-❍❑■⬜□☐▪▫–—≡→›✘xX✔✓☑+]|\[[ xX+-]?\])\s[^\n]*)[^\S\n]*(.+:)[^\S\n]*(?:(?=@[^\s*~(]+(?::\/\/[^\s*~(:]+)?(?:\([^)]*\))?)|$)/gm,
            });
            usingCursor({
                text: [
                    'Project:',
                ],
                languageId: languageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 9, false);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                moveTo(editor, viewModel, 1, 9, false);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
            });
        });
        test('typing in json', () => {
            const languageId = 'indentRulesMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
                indentationRules: {
                    increaseIndentPattern: new RegExp("({+(?=([^\"]*\"[^\"]*\")*[^\"}]*$))|(\\[+(?=([^\"]*\"[^\"]*\")*[^\"\\]]*$))"),
                    decreaseIndentPattern: new RegExp("^\\s*[}\\]],?\\s*$")
                }
            }));
            const model = createTextModel([
                '{',
                '  "scripts: {"',
                '    "watch": "a {"',
                '    "build{": "b"',
                '    "tasks": []',
                '    "tasks": ["a"]',
                '  "}"',
                '"}"'
            ].join('\n'), languageId, {
                tabSize: 2,
                indentSize: 2
            });
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 19, false);
                assertCursor(viewModel, new selection_1.Selection(3, 19, 3, 19));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(4), '    ');
                moveTo(editor, viewModel, 5, 18, false);
                assertCursor(viewModel, new selection_1.Selection(5, 18, 5, 18));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(6), '    ');
                moveTo(editor, viewModel, 7, 15, false);
                assertCursor(viewModel, new selection_1.Selection(7, 15, 7, 15));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(8), '      ');
                assert.deepStrictEqual(model.getLineContent(9), '    ]');
                moveTo(editor, viewModel, 10, 18, false);
                assertCursor(viewModel, new selection_1.Selection(10, 18, 10, 18));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(11), '    ]');
            });
        });
        test('issue #111128: Multicursor `Enter` issue with indentation', () => {
            const model = createTextModel('    let a, b, c;', indentRulesLanguageId, { detectIndentation: false, insertSpaces: false, tabSize: 4 });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 11, 1, 11),
                    new selection_1.Selection(1, 14, 1, 14),
                ]);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), '    let a,\n\t b,\n\t c;');
            });
        });
        test('issue #122714: tabSize=1 prevent typing a string matching decreaseIndentPattern in an empty file', () => {
            const latextLanguageId = setupIndentRulesLanguage('latex', {
                increaseIndentPattern: new RegExp('\\\\begin{(?!document)([^}]*)}(?!.*\\\\end{\\1})'),
                decreaseIndentPattern: new RegExp('^\\s*\\\\end{(?!document)')
            });
            const model = createTextModel('\\end', latextLanguageId, { tabSize: 1 });
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 5, false);
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
                viewModel.type('{', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '\\end{}');
            });
        });
        test('ElectricCharacter - does nothing if no electric char', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    ''
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '*');
            });
        });
        test('ElectricCharacter - indents in order to match bracket', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    ''
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }');
            });
        });
        test('ElectricCharacter - unindents in order to match bracket', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '    '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 5);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }');
            });
        });
        test('ElectricCharacter - matches with correct bracket', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '    if (b) {',
                    '    }',
                    '    '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 4, 1);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(4), '  }    ');
            });
        });
        test('ElectricCharacter - does nothing if bracket does not match', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '    if (b) {',
                    '    }',
                    '  }  '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 4, 6);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(4), '  }  }');
            });
        });
        test('ElectricCharacter - matches bracket even in line with content', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '// hello'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }// hello');
            });
        });
        test('ElectricCharacter - is no-op if bracket is lined up', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '  '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 3);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }');
            });
        });
        test('ElectricCharacter - is no-op if there is non-whitespace text before', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    'a'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 2);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), 'a}');
            });
        });
        test('ElectricCharacter - is no-op if pairs are all matched before', () => {
            usingCursor({
                text: [
                    'foo(() => {',
                    '  ( 1 + 2 ) ',
                    '})'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 13);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  ( 1 + 2 ) *');
            });
        });
        test('ElectricCharacter - is no-op if matching bracket is on the same line', () => {
            usingCursor({
                text: [
                    '(div',
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                let changeText = null;
                const disposable = model.onDidChangeContent(e => {
                    changeText = e.changes[0].text;
                });
                viewModel.type(')', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(1), '(div)');
                assert.deepStrictEqual(changeText, ')');
                disposable.dispose();
            });
        });
        test('ElectricCharacter - is no-op if the line has other content', () => {
            usingCursor({
                text: [
                    'Math.max(',
                    '\t2',
                    '\t3'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                viewModel.type(')', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(3), '\t3)');
            });
        });
        test('ElectricCharacter - appends text', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '/*'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 3);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '/** */');
            });
        });
        test('ElectricCharacter - appends text 2', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '  /*'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 5);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  /** */');
            });
        });
        test('ElectricCharacter - issue #23711: Replacing selected text with )]} fails to delete old text with backwards-dragged selection', () => {
            usingCursor({
                text: [
                    '{',
                    'word'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 5);
                moveTo(editor, viewModel, 2, 1, true);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '}');
            });
        });
        test('issue #61070: backtick (`) should auto-close after a word character', () => {
            usingCursor({
                text: ['const markup = highlight'],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                model.tokenization.forceTokenization(1);
                assertType(editor, model, viewModel, 1, 25, '`', '``', `auto closes \` @ (1, 25)`);
            });
        });
        test('issue #132912: quotes should not auto-close if they are closing a string', () => {
            setupAutoClosingLanguageTokenization();
            const model = createTextModel('const t2 = `something ${t1}', autoClosingLanguageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                const model = viewModel.model;
                model.tokenization.forceTokenization(1);
                assertType(editor, model, viewModel, 1, 28, '`', '`', `does not auto close \` @ (1, 28)`);
            });
        });
        test('autoClosingPairs - open parens: default', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var| a| |=| [|]|;|',
                    'var| b| |=| |`asd|`|;|',
                    'var| c| |=| |\'asd|\'|;|',
                    'var| d| |=| |"asd|"|;|',
                    'var| e| |=| /*3*/|	3|;|',
                    'var| f| |=| /**| 3| */3|;|',
                    'var| g| |=| (3+5|)|;|',
                    'var| h| |=| {| a|:| |\'value|\'| |}|;|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - open parens: whitespace', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'beforeWhitespace'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var| a| =| [|];|',
                    'var| b| =| `asd`;|',
                    'var| c| =| \'asd\';|',
                    'var| d| =| "asd";|',
                    'var| e| =| /*3*/|	3;|',
                    'var| f| =| /**| 3| */3;|',
                    'var| g| =| (3+5|);|',
                    'var| h| =| {| a:| \'value\'| |};|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - open parens disabled/enabled open quotes enabled/disabled', () => {
            usingCursor({
                text: [
                    'var a = [];',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'beforeWhitespace',
                    autoClosingQuotes: 'never'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var| a| =| [|];|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                        assertType(editor, model, viewModel, lineNumber, column, '\'', '\'', `does not auto close @ (${lineNumber}, ${column})`);
                    }
                }
            });
            usingCursor({
                text: [
                    'var b = [];',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'never',
                    autoClosingQuotes: 'beforeWhitespace'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var b =| [|];|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'\'', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                        assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                    }
                }
            });
        });
        test('autoClosingPairs - configurable open parens', () => {
            setAutoClosingLanguageEnabledSet('abc');
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'languageDefined'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'v|ar |a = [|];|',
                    'v|ar |b = `|asd`;|',
                    'v|ar |c = \'|asd\';|',
                    'v|ar d = "|asd";|',
                    'v|ar e = /*3*/	3;|',
                    'v|ar f = /** 3| */3;|',
                    'v|ar g = (3+5|);|',
                    'v|ar h = { |a: \'v|alue\' |};|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - auto-pairing can be disabled', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'never',
                    autoClosingQuotes: 'never'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                            assertType(editor, model, viewModel, lineNumber, column, '"', '""', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                            assertType(editor, model, viewModel, lineNumber, column, '"', '"', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - auto wrapping is configurable', () => {
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(1, 9, 1, 12),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '`var` a = `asd`');
                // type a (
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '`(var)` a = `(asd)`');
            });
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoSurround: 'never'
                }
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '` a = asd');
            });
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoSurround: 'quotes'
                }
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '`var` a = asd');
                // type a (
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '`(` a = asd');
            });
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoSurround: 'brackets'
                }
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                // type a (
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '(var) a = asd');
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '(`) a = asd');
            });
        });
        test('autoClosingPairs - quote', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var a |=| [|]|;|',
                    'var b |=| `asd`|;|',
                    'var c |=| \'asd\'|;|',
                    'var d |=| "asd"|;|',
                    'var e |=| /*3*/|	3;|',
                    'var f |=| /**| 3 */3;|',
                    'var g |=| (3+5)|;|',
                    'var h |=| {| a:| \'value\'| |}|;|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'\'', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else if (autoCloseColumns[column] === 2 /* AutoClosingColumnType.Special2 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '', `over types @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - multi-character autoclose', () => {
            usingCursor({
                text: [
                    '',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                model.setValue('begi');
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                viewModel.type('n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'beginend');
                model.setValue('/*');
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '/** */');
            });
        });
        test('autoClosingPairs - doc comments can be turned off', () => {
            usingCursor({
                text: [
                    '',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingComments: 'never'
                }
            }, (editor, model, viewModel) => {
                model.setValue('/*');
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '/**');
            });
        });
        test('issue #72177: multi-character autoclose with conflicting patterns', () => {
            const languageId = 'autoClosingModeMultiChar';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '(', close: ')' },
                    { open: '(*', close: '*)' },
                    { open: '<@', close: '@>' },
                    { open: '<@@', close: '@@>' },
                ],
            }));
            usingCursor({
                text: [
                    '',
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '()');
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '(**)', `doesn't add entire close when already closed substring is there`);
                model.setValue('(');
                viewModel.setSelections('test', [new selection_1.Selection(1, 2, 1, 2)]);
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '(**)', `does add entire close if not already there`);
                model.setValue('');
                viewModel.type('<@', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<@@>');
                viewModel.type('@', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<@@@@>', `autocloses when before multi-character closing brace`);
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<@@()@@>', `autocloses when before multi-character closing brace`);
            });
        });
        test('issue #55314: Do not auto-close when ending with open', () => {
            const languageId = 'myElectricMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: 'B\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: '`', close: '`', notIn: ['string', 'comment'] },
                    { open: '/**', close: ' */', notIn: ['string'] }
                ],
            }));
            usingCursor({
                text: [
                    'little goat',
                    'little LAMB',
                    'little sheep',
                    'Big LAMB'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 1, 4, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 2, 4, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 3, 4, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 4, 2, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 4, 3, '"', '"', `does not double quote when ending with open`);
            });
        });
        test('issue #27937: Trying to add an item to the front of a list is cumbersome', () => {
            usingCursor({
                text: [
                    'var arr = ["b", "c"];'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertType(editor, model, viewModel, 1, 12, '"', '"', `does not over type and will not auto close`);
            });
        });
        test('issue #25658 - Do not auto-close single/double quotes after word characters', () => {
            usingCursor({
                text: [
                    '',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                function typeCharacters(viewModel, chars) {
                    for (let i = 0, len = chars.length; i < len; i++) {
                        viewModel.type(chars[i], 'keyboard');
                    }
                }
                // First gif
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste1 = teste\' ok');
                assert.strictEqual(model.getLineContent(1), 'teste1 = teste\' ok');
                viewModel.setSelections('test', [new selection_1.Selection(1, 1000, 1, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste2 = teste \'ok');
                assert.strictEqual(model.getLineContent(2), 'teste2 = teste \'ok\'');
                viewModel.setSelections('test', [new selection_1.Selection(2, 1000, 2, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste3 = teste" ok');
                assert.strictEqual(model.getLineContent(3), 'teste3 = teste" ok');
                viewModel.setSelections('test', [new selection_1.Selection(3, 1000, 3, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste4 = teste "ok');
                assert.strictEqual(model.getLineContent(4), 'teste4 = teste "ok"');
                // Second gif
                viewModel.setSelections('test', [new selection_1.Selection(4, 1000, 4, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste \'');
                assert.strictEqual(model.getLineContent(5), 'teste \'\'');
                viewModel.setSelections('test', [new selection_1.Selection(5, 1000, 5, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste "');
                assert.strictEqual(model.getLineContent(6), 'teste ""');
                viewModel.setSelections('test', [new selection_1.Selection(6, 1000, 6, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste\'');
                assert.strictEqual(model.getLineContent(7), 'teste\'');
                viewModel.setSelections('test', [new selection_1.Selection(7, 1000, 7, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste"');
                assert.strictEqual(model.getLineContent(8), 'teste"');
            });
        });
        test('issue #37315 - overtypes only those characters that it inserted', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type('asd', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(asd)');
                // overtype!
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(asd)');
                // do not overtype!
                viewModel.setSelections('test', [new selection_1.Selection(2, 4, 2, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'y=());');
            });
        });
        test('issue #37315 - stops overtyping once cursor leaves area', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=())');
            });
        });
        test('issue #37315 - it overtypes only once', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(1, 4, 1, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=())');
            });
        });
        test('issue #37315 - it can remember multiple auto-closed instances', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(())');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(())');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(())');
            });
        });
        test('issue #118270 - auto closing deletes only those characters that it inserted', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type('asd', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(asd)');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'x=()');
                // delete closing char!
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'x=');
                // do not delete closing char!
                viewModel.setSelections('test', [new selection_1.Selection(2, 4, 2, 4)]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'y=);');
            });
        });
        test('issue #78527 - does not close quote on odd count', () => {
            usingCursor({
                text: [
                    'std::cout << \'"\' << entryMap'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 29, 1, 29)]);
                viewModel.type('[', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap[]');
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap[""]');
                viewModel.type('a', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap["a"]');
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap["a"]');
                viewModel.type(']', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap["a"]');
            });
        });
        test('issue #85983 - editor.autoClosingBrackets: beforeWhitespace is incorrect for Python', () => {
            const languageId = 'pythonMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: 'r\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'R\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'u\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'U\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'f\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'F\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'b\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'B\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'r\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'R\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'u\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'U\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'f\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'F\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'b\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'B\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '`', close: '`', notIn: ['string'] }
                ],
            }));
            usingCursor({
                text: [
                    'foo\'hello\''
                ],
                editorOpts: {
                    autoClosingBrackets: 'beforeWhitespace'
                },
                languageId: languageId
            }, (editor, model, viewModel) => {
                assertType(editor, model, viewModel, 1, 4, '(', '(', `does not auto close @ (1, 4)`);
            });
        });
        test('issue #78975 - Parentheses swallowing does not work when parentheses are inserted by autocomplete', () => {
            usingCursor({
                text: [
                    '<div id'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 8, 1, 8)]);
                viewModel.executeEdits('snippet', [{ range: new range_1.Range(1, 6, 1, 8), text: 'id=""' }], () => [new selection_1.Selection(1, 10, 1, 10)]);
                assert.strictEqual(model.getLineContent(1), '<div id=""');
                viewModel.type('a', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<div id="a"');
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<div id="a"');
            });
        });
        test('issue #78833 - Add config to use old brackets/quotes overtyping', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingOvertype: 'always'
                }
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(1, 4, 1, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(2, 4, 2, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'y=();');
            });
        });
        test('issue #15825: accents on mac US intl keyboard', () => {
            usingCursor({
                text: [],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Typing ` + e on the mac US intl kb layout
                viewModel.startComposition();
                viewModel.type('`', 'keyboard');
                viewModel.compositionType('è', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), 'è');
            });
        });
        test('issue #90016: allow accents on mac US intl keyboard to surround selection', () => {
            usingCursor({
                text: [
                    'test'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 5)]);
                // Typing ` + e on the mac US intl kb layout
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'test\'');
            });
        });
        test('issue #53357: Over typing ignores characters after backslash', () => {
            usingCursor({
                text: [
                    'console.log();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 13, 1, 13)]);
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'\');');
                viewModel.type('it', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'it\');');
                viewModel.type('\\', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'it\\\');');
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'it\\\'\');');
            });
        });
        test('issue #84998: Overtyping Brackets doesn\'t work after backslash', () => {
            usingCursor({
                text: [
                    ''
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                viewModel.type('\\', 'keyboard');
                assert.strictEqual(model.getValue(), '\\');
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '\\()');
                viewModel.type('abc', 'keyboard');
                assert.strictEqual(model.getValue(), '\\(abc)');
                viewModel.type('\\', 'keyboard');
                assert.strictEqual(model.getValue(), '\\(abc\\)');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getValue(), '\\(abc\\)');
            });
        });
        test('issue #2773: Accents (´`¨^, others?) are inserted in the wrong position (Mac)', () => {
            usingCursor({
                text: [
                    'hello',
                    'world'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Typing ` and pressing shift+down on the mac US intl kb layout
                // Here we're just replaying what the cursor gets
                viewModel.startComposition();
                viewModel.type('`', 'keyboard');
                moveDown(editor, viewModel, true);
                viewModel.compositionType('`', 1, 0, 0, 'keyboard');
                viewModel.compositionType('`', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '`hello\nworld');
                assertCursor(viewModel, new selection_1.Selection(1, 2, 2, 2));
            });
        });
        test('issue #26820: auto close quotes when not used as accents', () => {
            usingCursor({
                text: [
                    ''
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // on the mac US intl kb layout
                // Typing ' + space
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'\'');
                // Typing one more ' + space
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'\'');
                // Typing ' as a closing tag
                model.setValue('\'abc');
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'abc\'');
                // quotes before the newly added character are all paired.
                model.setValue('\'abc\'def ');
                viewModel.setSelections('test', [new selection_1.Selection(1, 10, 1, 10)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'abc\'def \'\'');
                // No auto closing if there is non-whitespace character after the cursor
                model.setValue('abc');
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                // No auto closing if it's after a word.
                model.setValue('abc');
                viewModel.setSelections('test', [new selection_1.Selection(1, 4, 1, 4)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), 'abc\'');
            });
        });
        test('issue #144690: Quotes do not overtype when using US Intl PC keyboard layout', () => {
            usingCursor({
                text: [
                    ''
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Pressing ' + ' + ;
                viewModel.startComposition();
                viewModel.type(`'`, 'keyboard');
                viewModel.compositionType(`'`, 1, 0, 0, 'keyboard');
                viewModel.compositionType(`'`, 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                viewModel.startComposition();
                viewModel.type(`'`, 'keyboard');
                viewModel.compositionType(`';`, 1, 0, 0, 'keyboard');
                viewModel.compositionType(`';`, 2, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), `'';`);
            });
        });
        test('issue #144693: Typing a quote using US Intl PC keyboard layout always surrounds words', () => {
            usingCursor({
                text: [
                    'const hello = 3;'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 7, 1, 12)]);
                // Pressing ' + e
                viewModel.startComposition();
                viewModel.type(`'`, 'keyboard');
                viewModel.compositionType(`é`, 1, 0, 0, 'keyboard');
                viewModel.compositionType(`é`, 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), `const é = 3;`);
            });
        });
        test('issue #82701: auto close does not execute when IME is canceled via backspace', () => {
            usingCursor({
                text: [
                    '{}'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 2, 1, 2)]);
                // Typing a + backspace
                viewModel.startComposition();
                viewModel.type('a', 'keyboard');
                viewModel.compositionType('', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '{}');
            });
        });
        test('issue #20891: All cursors should do the same thing', () => {
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 9, 1, 9),
                    new selection_1.Selection(1, 12, 1, 12),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), 'var a = `asd`');
            });
        });
        test('issue #41825: Special handling of quotes in surrounding pairs', () => {
            const languageId = 'myMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                surroundingPairs: [
                    { open: '"', close: '"' },
                    { open: '\'', close: '\'' },
                ]
            }));
            const model = createTextModel('var x = \'hi\';', languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 9, 1, 10),
                    new selection_1.Selection(1, 12, 1, 13)
                ]);
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'var x = "hi";', 'assert1');
                editor.setSelections([
                    new selection_1.Selection(1, 9, 1, 10),
                    new selection_1.Selection(1, 12, 1, 13)
                ]);
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'var x = \'hi\';', 'assert2');
            });
        });
        test('All cursors should do the same thing when deleting left', () => {
            const model = createTextModel([
                'var a = ()'
            ].join('\n'), autoClosingLanguageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 4, 1, 4),
                    new selection_1.Selection(1, 10, 1, 10),
                ]);
                // delete left
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'va a = )');
            });
        });
        test('issue #7100: Mouse word selection is strange when non-word character is at the end of line', () => {
            const model = createTextModel([
                'before.a',
                'before',
                'hello:',
                'there:',
                'this is strange:',
                'here',
                'it',
                'is',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runEditorCommand(null, editor, {
                    position: new position_1.Position(3, 7)
                });
                assertCursor(viewModel, new selection_1.Selection(3, 7, 3, 7));
                coreCommands_1.CoreNavigationCommands.WordSelectDrag.runEditorCommand(null, editor, {
                    position: new position_1.Position(4, 7)
                });
                assertCursor(viewModel, new selection_1.Selection(3, 7, 4, 7));
            });
        });
        test('issue #112039: shift-continuing a double/triple-click and drag selection does not remember its starting mode', () => {
            const model = createTextModel([
                'just some text',
                'and another line',
                'and another one',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runEditorCommand(null, editor, {
                    position: new position_1.Position(2, 6)
                });
                coreCommands_1.CoreNavigationCommands.MoveToSelect.runEditorCommand(null, editor, {
                    position: new position_1.Position(1, 8),
                });
                assertCursor(viewModel, new selection_1.Selection(2, 12, 1, 6));
            });
        });
        test('issue #158236: Shift click selection does not work on line number indicator', () => {
            const model = createTextModel([
                'just some text',
                'and another line',
                'and another one',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.MoveTo.runEditorCommand(null, editor, {
                    position: new position_1.Position(3, 5)
                });
                coreCommands_1.CoreNavigationCommands.LineSelectDrag.runEditorCommand(null, editor, {
                    position: new position_1.Position(2, 1)
                });
                assertCursor(viewModel, new selection_1.Selection(3, 5, 2, 1));
            });
        });
        test('issue #111513: Text gets automatically selected when typing at the same location in another editor', () => {
            const model = createTextModel([
                'just',
                '',
                'some text',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor1, viewModel1) => {
                editor1.setSelections([
                    new selection_1.Selection(2, 1, 2, 1)
                ]);
                withTestCodeEditor(model, {}, (editor2, viewModel2) => {
                    editor2.setSelections([
                        new selection_1.Selection(2, 1, 2, 1)
                    ]);
                    viewModel2.type('e', 'keyboard');
                    assertCursor(viewModel2, new position_1.Position(2, 2));
                    assertCursor(viewModel1, new position_1.Position(2, 2));
                });
            });
        });
    });
    suite('Undo stops', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('there is an undo stop between typing and deleting left', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A fir line');
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A  line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('there is an undo stop between typing and deleting right', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A firstine');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A  line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting left and typing', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 8, 2, 8)]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                viewModel.type('Second', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'Second line');
                assertCursor(viewModel, new selection_1.Selection(2, 7, 2, 7));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 8, 2, 8));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting left and deleting right', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 8, 2, 8)]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 8, 2, 8));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting right and typing', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 9, 2, 9)]);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                viewModel.type('text', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'Another text');
                assertCursor(viewModel, new selection_1.Selection(2, 13, 2, 13));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting right and deleting left', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 9, 2, 9)]);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'An');
                assertCursor(viewModel, new selection_1.Selection(2, 3, 2, 3));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
            });
            model.dispose();
        });
        test('inserts undo stop when typing space', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first and interesting', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'A first and interesting line');
                assertCursor(viewModel, new selection_1.Selection(1, 24, 1, 24));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first and line');
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A  line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('can undo typing and EOL change in one undo stop', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first', 'keyboard');
                assert.strictEqual(model.getValue(), 'A first line\nAnother line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                model.pushEOL(1 /* EndOfLineSequence.CRLF */);
                assert.strictEqual(model.getValue(), 'A first line\r\nAnother line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'A  line\nAnother line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('issue #93585: Undo multi cursor edit corrupts document', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'hello world',
                'hello world',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(2, 7, 2, 12),
                    new selection_1.Selection(1, 7, 1, 12),
                ]);
                viewModel.type('no', 'keyboard');
                assert.strictEqual(model.getValue(), 'hello no\nhello no');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'hello world\nhello world');
            });
            model.dispose();
        });
        test('there is a single undo stop for consecutive whitespaces', () => {
            const model = (0, testTextModel_1.createTextModel)([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.type('a', 'keyboard');
                viewModel.type('b', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type('c', 'keyboard');
                viewModel.type('d', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab  cd', 'assert1');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab  ', 'assert2');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab', 'assert3');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '', 'assert4');
            });
            model.dispose();
        });
        test('there is no undo stop after a single whitespace', () => {
            const model = (0, testTextModel_1.createTextModel)([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.type('a', 'keyboard');
                viewModel.type('b', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type('c', 'keyboard');
                viewModel.type('d', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab cd', 'assert1');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab', 'assert3');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '', 'assert4');
            });
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2NvbnRyb2xsZXIvY3Vyc29yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0QmhHLGtCQUFrQjtJQUVsQixTQUFTLE1BQU0sQ0FBQyxNQUF1QixFQUFFLFNBQW9CLEVBQUUsVUFBa0IsRUFBRSxNQUFjLEVBQUUsa0JBQTJCLEtBQUs7UUFDbEksSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUNyQixxQ0FBc0IsQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFO2dCQUNuRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7YUFDMUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDUCxxQ0FBc0IsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFO2dCQUM3RCxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7YUFDMUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxNQUF1QixFQUFFLFNBQW9CLEVBQUUsa0JBQTJCLEtBQUs7UUFDaEcsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUNyQixxQ0FBc0IsQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0UsQ0FBQzthQUFNLENBQUM7WUFDUCxxQ0FBc0IsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUMsTUFBdUIsRUFBRSxTQUFvQixF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RTtZQUN2QyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQzdCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzFCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZEQUE2RCxFQUFFLEdBQUcsRUFBRTtZQUN4RSxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQzdCLGVBQWUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELGVBQWUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENB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QUMsQ0FBQyxDQUFDO2dCQUNuRCxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUsR0FBRyxFQUFFO1lBQ3ZFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3hFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO1lBQ3pFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO1lBQzFFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFD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Q0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDN0IsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1QyxTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM1QixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzFCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxD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USxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUU5QyxxQ0FBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xGLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7aUJBQzVCLENBQUMsQ0FBQztnQkFFSCxxQ0FBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xGLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7aUJBQzVCLENBQUMsQ0FBQztnQkFFSCxxQ0FBc0IsQ0FBQyx1QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ25GLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7aUJBQzVCLENBQUMsQ0FBQztnQkFFSCxxQ0FBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hGLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzVCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQzFCLENBQUMsQ0FBQztnQkFFSCxxQ0FBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xGLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElB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QUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRTNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElB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QUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCx3QkFBd0I7Z0JBQ3hCLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzdCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELDZCQUE2QjtnQkFDN0IsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFFQUFxRSxFQUFFLEdBQUcsRUFBRTtZQUNoRixzQ0FBc0M7WUFDdEMsa0JBQWtCLENBQUM7Z0JBQ2xCO29CQUNDLDBCQUEwQjtvQkFDMUIsNEJBQTRCO2lCQUM1QixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7YUFDVixFQUFFLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDNUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzFCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzNCLENBQUMsQ0FBQztnQkFFSCxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM1QixZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN6QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzFCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzNCLENBQUMsQ0FBQztnQkFFSCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNGQUFzRixFQUFFLEdBQUcsRUFBRTtZQUNqRyxzQ0FBc0M7WUFDdEMsa0JBQWtCLENBQUM7Z0JBQ2xCO29CQUNDLHdCQUF3QjtvQkFDeEIsMkJBQTJCO29CQUMzQix3QkFBd0I7b0JBQ3hCLHVCQUF1QjtvQkFDdkIsaUJBQWlCO2lCQUNqQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDWixFQUFFLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDNUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFDSCxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUN6QixDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkMsWUFBWSxDQUFDLFNBQVMsRUFBRTtvQkFDdkIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUN6QixDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzFCLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkZBQTJGLEVBQUUsR0FBRyxFQUFFO1lBQ3RHLGtCQUFrQixDQUFDO2dCQUNsQixtUEFBbVA7YUFDblAsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUN4RixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUV0RCxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQzdCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQzdCLElBQUksRUFBRSxFQUFFO3FCQUNSLENBQUMsQ0FBQyxDQUFDO2dCQUVKLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5RUFBeUUsRUFBRSxHQUFHLEVBQUU7WUFDcEYsc0NBQXNDO1lBQ3RDLGtCQUFrQixDQUFDO2dCQUNsQjtvQkFDQyxZQUFZO29CQUNaLHNCQUFzQjtpQkFDdEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ1osRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQzVCLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFN0QsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDN0IsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDN0IsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFFQUFxRSxFQUFFLEdBQUcsRUFBRTtZQUNoRixrQkFBa0IsQ0FBQztnQkFDbEI7b0JBQ0Msb0JBQW9CO29CQUNwQix1REFBdUQ7b0JBQ3ZELEdBQUc7aUJBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ1osRUFBRSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsRUFBRSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDbEcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzNCLENBQUMsQ0FBQztnQkFDSCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDcEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRTdDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFN0MsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3BDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUU3QyxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRTdDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNuQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFN0MsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3hFLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsRUFBRTthQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ25FLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3RELEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzVCLElBQUksRUFBRSxjQUFjO3FCQUNwQixDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUUzRSxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM1RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsRUFBRTtZQUUvRCxNQUFNLG1CQUFtQixHQUF5QjtnQkFDakQsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLHdCQUFTO2dCQUNoQyxRQUFRLEVBQUUsU0FBVTtnQkFDcEIsZUFBZSxFQUFFLENBQUMsSUFBWSxFQUFFLE1BQWUsRUFBRSxLQUFhLEVBQTZCLEVBQUU7b0JBQzVGLE9BQU8sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDakUsQ0FBQzthQUNELENBQUM7WUFFRixNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQztZQUNyQyxNQUFNLG9CQUFvQixHQUFHLGdDQUFvQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUM3RixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRXhELGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUU7Z0JBQ2xELGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUU7b0JBRWxELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLEVBQUU7d0JBQ3pELEtBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2QyxDQUFDLENBQUMsQ0FBQztvQkFFSCxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFFaEUsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBRUgsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtZQUNuRSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLGtCQUFrQjtnQkFDbEIsY0FBYzthQUNkLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSwyQkFBMkIsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDdkYsTUFBTSxDQUFDLGFBQWEsQ0FBQztvQkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztpQkFDM0IsQ0FBQyxDQUFDO2dCQUVILGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVwRSxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRWpDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtZQUNuRSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLE9BQU87YUFDUCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQztvQkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzVCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzVCLElBQUksRUFBRSxHQUFHO3dCQUNULGdCQUFnQixFQUFFLElBQUk7cUJBQ3RCLENBQUMsQ0FBQyxDQUFDO2dCQUNKLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUQsWUFBWSxDQUFDLFNBQVMsRUFBRTtvQkFDdkIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUN6QixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtFQUFrRSxFQUFFLEdBQUcsRUFBRTtZQUM3RSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLElBQUk7YUFDSixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQztvQkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzVCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzVCLElBQUksRUFBRSxFQUFFO3FCQUNSLENBQUMsQ0FBQyxDQUFDO2dCQUNKLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUQsWUFBWSxDQUFDLFNBQVMsRUFBRTtvQkFDdkIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzVCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzVCLElBQUksRUFBRSxFQUFFO3FCQUNSLENBQUMsQ0FBQyxDQUFDO2dCQUNKLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0ZBQStGLEVBQUUsR0FBRyxFQUFFO1lBQzFHLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsUUFBUTtnQkFDUixFQUFFO2FBQ0YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ1osQ0FBQztZQUVGLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ25ELE1BQU0sQ0FBQyxhQUFhLENBQUM7b0JBQ3BCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFDSCxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQ3BDLFFBQVE7b0JBQ1IsV0FBVztvQkFDWCxFQUFFO2lCQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2QsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7WUFDNUUsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxRQUFRO2FBQ1IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ1osQ0FBQztZQUVGLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ25ELE1BQU0sQ0FBQyxhQUFhLENBQUM7b0JBQ3BCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFcEUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRW5FLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVsRSxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFakUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRWhFLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUZBQXVGLEVBQUUsR0FBRyxFQUFFO1lBQ2xHLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsUUFBUTthQUNSLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3ZFLE1BQU0sQ0FBQyxhQUFhLENBQUM7b0JBQ3BCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFcEUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRW5FLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVsRSxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFakUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRWhFLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0VBQStFLEVBQUUsR0FBRyxFQUFFO1lBQzFGLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsTUFBTTthQUNOLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3ZFLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLGFBQWEsQ0FBQztvQkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDO2lCQUNyQyxDQUFDLENBQUM7Z0JBRUgsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RkFBOEYsRUFBRSxHQUFHLEVBQUU7WUFDekcsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxlQUFlO2FBQ2YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ1osQ0FBQztZQUVGLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDdkUsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLENBQUMsYUFBYSxDQUFDO29CQUNwQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7aUJBQ3JDLENBQUMsQ0FBQztnQkFFSCxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFekUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRXRFLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVqRSxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1FQUFtRSxFQUFFLEdBQUcsRUFBRTtZQUM5RSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUVuRSxrQkFBa0IsQ0FDakIsS0FBSyxFQUNMO2dCQUNDLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLGNBQWMsRUFBRSxFQUFFO2FBQ2xCLEVBQ0QsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3JCLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUMvQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7Z0JBQ0gsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzNCLENBQUMsQ0FBQztnQkFFSCxTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztpQkFDM0IsQ0FBQyxDQUFDO2dCQUNILFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsQyxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtZQUNwRSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUUvRSxrQkFBa0IsQ0FDakIsS0FBSyxFQUNMO2dCQUNDLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLGNBQWMsRUFBRSxFQUFFO2FBQ2xCLEVBQ0QsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3JCLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUMvQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7Z0JBQ0gsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzNCLENBQUMsQ0FBQztnQkFDSCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkMsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7aUJBQzNCLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1lBQ25FLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVqRixrQkFBa0IsQ0FDakIsS0FBSyxFQUNMO2dCQUNDLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLGNBQWMsRUFBRSxDQUFDO2dCQUNqQixjQUFjLEVBQUUsSUFBSTthQUNwQixFQUNELENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNyQixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUNILFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUN2QixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUMzQixDQUFDLENBQUM7Z0JBRUgsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQ2pFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsd0JBQXdCO29CQUN4QixrQkFBa0I7b0JBQ2xCLGdCQUFnQjtvQkFDaEIsRUFBRTtvQkFDRixHQUFHO2lCQUNIO2FBQ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDckgsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDekQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpREFBaUQsRUFBRSxHQUFHLEVBQUU7WUFDNUQsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyx3QkFBd0I7Z0JBQ3hCLG1CQUFtQjtnQkFDbkIsZ0JBQWdCO2dCQUNoQixFQUFFO2dCQUNGLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixTQUFTLEVBQ1Q7Z0JBQ0MsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLEVBQUU7YUFDZCxDQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNuRCxrQkFBa0I7Z0JBQ2xCLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztnQkFDOUUsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsK0JBQStCLENBQUMsQ0FBQztnQkFDN0Usa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztnQkFDNUUsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztnQkFDM0Usa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztnQkFDMUUsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztnQkFDMUUsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELG1CQUFtQjtnQkFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDbEUsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELG1CQUFtQjtnQkFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pHLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxvQ0FBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdELFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsU0FBUztpQkFDVDtnQkFDRCxVQUFVLEVBQUUsVUFBVTthQUN0QixFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsa0NBQTBCLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUNyRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxvQ0FBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNELFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsU0FBUztpQkFDVDtnQkFDRCxVQUFVLEVBQUUsVUFBVTthQUN0QixFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsa0NBQTBCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNqRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxvQ0FBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3BFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsVUFBVTtpQkFDVjtnQkFDRCxVQUFVLEVBQUUsVUFBVTthQUN0QixFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsa0NBQTBCLEVBQUUsOEJBQThCLENBQUMsQ0FBQztZQUM5RixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9GQUFvRixFQUFFLEdBQUcsRUFBRTtZQUMvRixXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLE1BQU07aUJBQ047YUFDRCxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUZBQXFGLEVBQUUsR0FBRyxFQUFFO1lBQ2hHLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsTUFBTTtpQkFDTjthQUNELEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixLQUFLLENBQUMsYUFBYSxDQUFDO29CQUNuQixZQUFZLEVBQUUsS0FBSztpQkFDbkIsQ0FBQyxDQUFDO2dCQUNILE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtZQUNyQyxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLHNCQUFzQjtpQkFDdEI7Z0JBQ0QsU0FBUyxFQUFFO29CQUNWLGtCQUFrQixFQUFFLEtBQUs7aUJBQ3pCO2FBQ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBRS9CLG9GQUFvRjtnQkFDcEYsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFcEQsc0RBQXNEO2dCQUN0RCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1lBQ2hGLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsTUFBTTtpQkFDTjthQUNELEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFcEQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7WUFDakQsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDO1lBRWpDLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxXQUFXLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ2pFLFlBQVksRUFBRSxDQUFDO3dCQUNkLFVBQVUsRUFBRSxJQUFJO3dCQUNoQixNQUFNLEVBQUU7NEJBQ1AsWUFBWSxFQUFFLG9DQUFZLENBQUMsTUFBTTs0QkFDakMsVUFBVSxFQUFFLEdBQUc7eUJBQ2Y7cUJBQ0QsQ0FBQzthQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxNQUFNO2lCQUNOO2dCQUNELFVBQVUsRUFBRSxVQUFVO2FBQ3RCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDckQsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrRUFBK0UsRUFBRSxHQUFHLEVBQUU7WUFDMUYsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLENBQUMsb0NBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNwRSxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGtDQUFrQztpQkFDbEM7Z0JBQ0QsVUFBVSxFQUFFLFVBQVU7YUFDdEIsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBRS9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO2dCQUMvRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFakQsTUFBTSxXQUFXO29CQUFqQjt3QkFFUyxpQkFBWSxHQUFrQixJQUFJLENBQUM7b0JBVzVDLENBQUM7b0JBVE8saUJBQWlCLENBQUMsS0FBaUIsRUFBRSxPQUE4Qjt3QkFDekUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7b0JBQ3RFLENBQUM7b0JBRU0sa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxNQUFnQzt3QkFDNUUsT0FBTyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQWEsQ0FBQyxDQUFDO29CQUN2RCxDQUFDO2lCQUVEO2dCQUVELFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxXQUFXLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1lBQ2hGLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM5QixNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUMxRSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLGNBQWM7Z0JBQ2QsVUFBVTtnQkFDVixFQUFFO2dCQUNGLEVBQUU7Z0JBQ0YsT0FBTzthQUNQLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLFVBQVUsQ0FDVixDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFFbkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxrQ0FBbUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRXJELE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsa0NBQW1CLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVyRCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQyxDQUFDO1lBRUgsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLHNCQUFzQjthQUN0QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFFbkQsb0ZBQW9GO2dCQUNwRixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVwRCxzREFBc0Q7Z0JBQ3RELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXBELG1CQUFtQjtnQkFDbkIsa0NBQW1CLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFeEQsc0NBQXNDO2dCQUN0QyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhELG9DQUFvQztnQkFDcEMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFFaEQsaURBQWlEO2dCQUNqRCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNqRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtEQUErRCxFQUFFLEdBQUcsRUFBRTtZQUMxRSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLG9CQUFvQjtnQkFDcEIsc0NBQXNDO2dCQUN0QyxtQkFBbUI7Z0JBQ25CLE9BQU87YUFDUCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFFbkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQ3BDLG9CQUFvQjtvQkFDcEIsc0NBQXNDO29CQUN0QyxtQkFBbUI7b0JBQ25CLFVBQVU7b0JBQ1YsT0FBTztpQkFDUCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNkLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwRSxTQUFTLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRTtvQkFDcEMsb0JBQW9CO29CQUNwQixzQ0FBc0M7b0JBQ3RDLG1CQUFtQjtvQkFDbkIsc0NBQXNDO29CQUN0QyxFQUFFO29CQUNGLE9BQU87aUJBQ1AsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDZCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdGQUFnRixFQUFFLEdBQUcsRUFBRTtZQUMzRixNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLG9CQUFvQjtnQkFDcEIsc0NBQXNDO2dCQUN0Qyx5QkFBeUI7Z0JBQ3pCLG1CQUFtQjtnQkFDbkIsT0FBTzthQUNQLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUVuRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEQsU0FBUyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQ3BDLG9CQUFvQjtvQkFDcEIsc0NBQXNDO29CQUN0Qyx5QkFBeUI7b0JBQ3pCLHNDQUFzQztvQkFDdEMsbUJBQW1CO29CQUNuQixPQUFPO2lCQUNQLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2QsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDL0IsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxPQUFPO2dCQUNQLGVBQWU7Z0JBQ2YsTUFBTTthQUNOLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3ZFLHlDQUF5QztnQkFDekMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzdELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1lBQ3hELE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsY0FBYztnQkFDZCxlQUFlO2dCQUNmLE1BQU07YUFDTixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUN0RSx1RUFBdUU7Z0JBQ3ZFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDakUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFFNUQsa0NBQWtDO2dCQUNsQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhELGtDQUFrQztnQkFDbEMsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFcEQsd0RBQXdEO2dCQUN4RCxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUU1RCw0Q0FBNEM7Z0JBQzVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFFNUQsOERBQThEO2dCQUM5RCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRTNELGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRXZELGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXBELGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRWpELDBCQUEwQjtnQkFDMUIsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUVoRCwyQ0FBMkM7Z0JBQzNDLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBRTlFLDZEQUE2RDtnQkFDN0QsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsRUFBRTthQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLFNBQVMsRUFDVDtnQkFDQyxZQUFZLEVBQUUsS0FBSzthQUNuQixDQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRTVFLGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFOUUsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUUvRSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRW5GLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUVwRixxQ0FBc0IsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFcEYsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUVsRixrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRWhGLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFL0Usa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUU3RSxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRTVFLGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFOUUsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUVuRixrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXJGLGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLGdDQUF3QixFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFbkYsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUU5RSxrQ0FBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDN0UsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwREFBMEQsRUFBRSxHQUFHLEVBQUU7WUFDckUsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxFQUFFO2FBQ0YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1osU0FBUyxFQUNUO2dCQUNDLFlBQVksRUFBRSxLQUFLO2FBQ25CLENBQ0QsQ0FBQztZQUVGLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ25ELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDekQsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3BDLGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUV4RCxNQUFNLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZUFBZTtpQkFDZjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxTQUFTLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFO2dCQUNsQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7WUFDOUMsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLElBQUk7aUJBQ0o7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRTthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDL0MsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLG1CQUFtQjtpQkFDbkI7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUyxFQUFFLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRTtnQkFDbEMsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRTthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDL0MsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxXQUFXO29CQUNYLGdCQUFnQjtvQkFDaEIsV0FBVztvQkFDWCxxQkFBcUI7aUJBQ3JCO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7Z0JBQ2xDLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLFdBQVc7Z0JBQ1gsYUFBYTthQUNiLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLHFCQUFxQixFQUNyQjtnQkFDQyxZQUFZLEVBQUUsS0FBSzthQUNuQixDQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3ZFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUM3QyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUMxQyxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZUFBZTtvQkFDZixjQUFjO29CQUNkLElBQUk7aUJBQ0o7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRTthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7WUFDdkMsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGVBQWU7b0JBQ2Ysa0JBQWtCO29CQUNsQixPQUFPO2lCQUNQO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtvQkFDYixlQUFlO2lCQUNmO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZUFBZTtpQkFDZjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7WUFDcEQsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGlCQUFpQjtpQkFDakI7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjthQUNqQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNELFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFDL0QsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsaUJBQWlCO2lCQUNqQjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxTQUFTLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMvRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQ25ELFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsZUFBZTtvQkFDZixvQkFBb0I7b0JBQ3BCLGtCQUFrQjtvQkFDbEIsZ0JBQWdCO29CQUNoQixPQUFPO29CQUNQLEtBQUs7aUJBQ0w7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUyxFQUFFLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRTtnQkFDbEMsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRTthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDckQsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9GQUFvRixFQUFFLEdBQUcsRUFBRTtZQUMvRixXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZUFBZTtvQkFDZixrQkFBa0I7b0JBQ2xCLE9BQU87aUJBQ1A7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUyxFQUFFLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRTthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvRkFBb0YsRUFBRSxHQUFHLEVBQUU7WUFDL0YsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGVBQWU7b0JBQ2Ysa0JBQWtCO29CQUNsQixPQUFPO2lCQUNQO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvRkFBb0YsRUFBRSxHQUFHLEVBQUU7WUFDL0YsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGVBQWU7b0JBQ2Ysa0JBQWtCO29CQUNsQixPQUFPO2lCQUNQO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7YUFDakMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkZBQTZGLEVBQUUsR0FBRyxFQUFFO1lBQ3hHLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtvQkFDYixlQUFlO29CQUNmLGtCQUFrQjtvQkFDbEIsT0FBTztpQkFDUDtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxTQUFTLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUV2RSxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkZBQTZGLEVBQUUsR0FBRyxFQUFFO1lBQ3hHLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsZUFBZTtvQkFDZixpQkFBaUI7b0JBQ2pCLHNCQUFzQjtvQkFDdEIsU0FBUztpQkFDVDtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxTQUFTLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUV6RSxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkZBQTZGLEVBQUUsR0FBRyxFQUFFO1lBQ3hHLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtvQkFDYixlQUFlO29CQUNmLGtCQUFrQjtvQkFDbEIsS0FBSztpQkFDTDtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUV2RSxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkZBQTZGLEVBQUUsR0FBRyxFQUFFO1lBQ3hHLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtvQkFDYixlQUFlO29CQUNmLGtCQUFrQjtvQkFDbEIsS0FBSztvQkFDTCxFQUFFO29CQUNGLGFBQWE7b0JBQ2IsZUFBZTtvQkFDZixrQkFBa0I7b0JBQ2xCLEtBQUs7aUJBQ0w7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUyxFQUFFO29CQUNWLE9BQU8sRUFBRSxDQUFDO29CQUNWLFVBQVUsRUFBRSxDQUFDO2lCQUNiO2FBQ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRXZFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2RkFBNkYsRUFBRSxHQUFHLEVBQUU7WUFDeEcsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGVBQWU7b0JBQ2Ysa0JBQWtCO29CQUNsQixrQkFBa0I7b0JBQ2xCLEVBQUU7aUJBQ0Y7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRTthQUN6QixFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFHQUFxRyxFQUFFLEdBQUcsRUFBRTtZQUNoSCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGtCQUFrQjtvQkFDbEIsY0FBYztvQkFDZCx5QkFBeUI7b0JBQ3pCLEdBQUc7aUJBQ0g7Z0JBQ0QsU0FBUyxFQUFFO29CQUNWLFlBQVksRUFBRSxLQUFLO2lCQUNuQjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVwRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUMzRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFHQUFxRyxFQUFFLEdBQUcsRUFBRTtZQUNoSCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGtCQUFrQjtvQkFDbEIsY0FBYztvQkFDZCx5QkFBeUI7b0JBQ3pCLEdBQUc7aUJBQ0g7Z0JBQ0QsU0FBUyxFQUFFO29CQUNWLFlBQVksRUFBRSxLQUFLO2lCQUNuQjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUMzRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtZQUM1RCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLElBQUk7b0JBQ0osZUFBZTtvQkFDZixlQUFlO29CQUNmLGdCQUFnQjtvQkFDaEIsS0FBSztvQkFDTCxJQUFJO2lCQUNKO2dCQUNELFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLFNBQVM7b0JBQ1QsYUFBYTtvQkFDYixHQUFHO2lCQUNIO2dCQUNELFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1RUFBdUUsRUFBRSxHQUFHLEVBQUU7WUFDbEYsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxrQkFBa0I7Z0JBQ2xCLHdDQUF3QztnQkFDeEMsSUFBSTtnQkFDSixFQUFFO2dCQUNGLEtBQUs7Z0JBQ0wsR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLHFCQUFxQixFQUNyQjtnQkFDQyxZQUFZLEVBQUUsS0FBSzthQUNuQixDQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNuRCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxrQ0FBbUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsd0hBQXdILEVBQUUsR0FBRyxFQUFFO1lBQ25JLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0Msb0JBQW9CO2dCQUNwQiwwQ0FBMEM7Z0JBQzFDLE1BQU07Z0JBQ04sSUFBSTtnQkFDSixPQUFPO2dCQUNQLEtBQUs7YUFDTCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixxQkFBcUIsRUFDckI7Z0JBQ0MsWUFBWSxFQUFFLEtBQUs7YUFDbkIsQ0FDRCxDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDbkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsa0NBQW1CLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLHdIQUF3SCxFQUFFLEdBQUcsRUFBRTtZQUNuSSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQzVCO2dCQUNDLG9CQUFvQjtnQkFDcEIsMENBQTBDO2dCQUMxQyxNQUFNO2dCQUNOLE1BQU07Z0JBQ04sT0FBTztnQkFDUCxLQUFLO2FBQ0wsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1oscUJBQXFCLEVBQ3JCO2dCQUNDLFlBQVksRUFBRSxLQUFLO2FBQ25CLENBQ0QsQ0FBQztZQUVGLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ25ELE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3SEFBd0gsRUFBRSxHQUFHLEVBQUU7WUFDbkksTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxvQkFBb0I7Z0JBQ3BCLDBDQUEwQztnQkFDMUMsTUFBTTtnQkFDTixRQUFRO2dCQUNSLE9BQU87Z0JBQ1AsS0FBSzthQUNMLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLHFCQUFxQixFQUNyQjtnQkFDQyxZQUFZLEVBQUUsS0FBSzthQUNuQixDQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNuRCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxrQ0FBbUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0hBQXdILEVBQUUsR0FBRyxFQUFFO1lBQ25JLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0Msb0JBQW9CO2dCQUNwQiwwQ0FBMEM7Z0JBQzFDLE1BQU07Z0JBQ04sVUFBVTtnQkFDVixPQUFPO2dCQUNQLEtBQUs7YUFDTCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixxQkFBcUIsRUFDckI7Z0JBQ0MsWUFBWSxFQUFFLEtBQUs7YUFDbkIsQ0FDRCxDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDbkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsa0NBQW1CLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMzRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdHQUF3RyxFQUFFLEdBQUcsRUFBRTtZQUNuSCxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLG9DQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEUsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxjQUFjO2dCQUNkLFVBQVU7Z0JBQ1YsRUFBRTtnQkFDRixFQUFFO2dCQUNGLE9BQU87YUFDUCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixpQkFBaUIsQ0FDakIsQ0FBQztZQUVGLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBRW5ELE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsa0NBQW1CLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELE1BQU0sY0FBYyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sRUFBRTtnQkFDdkQscUJBQXFCLEVBQUUsNkdBQTZHO2dCQUNwSSxxQkFBcUIsRUFBRSxtRkFBbUY7YUFDMUcsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QjtnQkFDQyxlQUFlO2dCQUNmLHdCQUF3QjtnQkFDeEIsa0JBQWtCO2dCQUNsQixRQUFRO2FBQ1IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1osY0FBYyxDQUNkLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3ZFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvR0FBb0csRUFBRSxHQUFHLEVBQUU7WUFDL0csV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxlQUFlO29CQUNmLG9CQUFvQjtvQkFDcEIsZUFBZTtvQkFDZixtQkFBbUI7b0JBQ25CLEtBQUs7aUJBQ0w7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjthQUNqQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztZQUM3RixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGVBQWU7b0JBQ2YsUUFBUTtvQkFDUixLQUFLO29CQUNMLGFBQWE7b0JBQ2IsS0FBSztvQkFDTCxHQUFHO2lCQUNIO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7YUFDakMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLHNDQUFzQyxDQUFDLENBQUM7WUFDaEcsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnRkFBZ0YsRUFBRSxHQUFHLEVBQUU7WUFDM0YsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLFFBQVE7b0JBQ1IsTUFBTTtpQkFDTjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsbUVBQW1FLEVBQUUsR0FBRyxFQUFFO1lBQzlFLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDO1lBRXJDLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxXQUFXLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ2pFLFFBQVEsRUFBRTtvQkFDVCxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztpQkFDVjtnQkFDRCxnQkFBZ0IsRUFBRTtvQkFDakIscUJBQXFCLEVBQUUsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7b0JBQ25ELHFCQUFxQixFQUFFLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQztpQkFDN0M7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsY0FBYztnQkFDZCxhQUFhO2dCQUNiLEdBQUc7Z0JBQ0gsRUFBRTtnQkFDRixnQ0FBZ0M7Z0JBQ2hDLGtDQUFrQztnQkFDbEMsVUFBVTtnQkFDVixFQUFFO2dCQUNGLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixVQUFVLEVBQ1Y7Z0JBQ0MsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsVUFBVSxFQUFFLENBQUM7YUFDYixDQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQzNFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELGtDQUFtQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFDbEM7b0JBQ0MsY0FBYztvQkFDZCxhQUFhO29CQUNiLEdBQUc7b0JBQ0gsRUFBRTtvQkFDRixnQ0FBZ0M7b0JBQ2hDLGtDQUFrQztvQkFDbEMsVUFBVTtvQkFDVixJQUFJO29CQUNKLEdBQUc7aUJBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ1osQ0FBQztnQkFDRixNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUNqRSxNQUFNLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQ25ELHFCQUFxQixFQUFFLFVBQVU7Z0JBQ2pDLHFCQUFxQixFQUFFLHdKQUF3SjthQUMvSyxDQUFDLENBQUM7WUFDSCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLFVBQVU7aUJBQ1Y7Z0JBQ0QsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7Z0JBQ2xDLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUU7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQixNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztZQUVyQyxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUNqRSxRQUFRLEVBQUU7b0JBQ1QsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7aUJBQ1Y7Z0JBQ0QsZ0JBQWdCLEVBQUU7b0JBQ2pCLHFCQUFxQixFQUFFLElBQUksTUFBTSxDQUFDLDZFQUE2RSxDQUFDO29CQUNoSCxxQkFBcUIsRUFBRSxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztpQkFDdkQ7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FDNUI7Z0JBQ0MsR0FBRztnQkFDSCxnQkFBZ0I7Z0JBQ2hCLG9CQUFvQjtnQkFDcEIsbUJBQW1CO2dCQUNuQixpQkFBaUI7Z0JBQ2pCLG9CQUFvQjtnQkFDcEIsT0FBTztnQkFDUCxLQUFLO2FBQ0wsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1osVUFBVSxFQUNWO2dCQUNDLE9BQU8sRUFBRSxDQUFDO2dCQUNWLFVBQVUsRUFBRSxDQUFDO2FBQ2IsQ0FDRCxDQUFDO1lBRUYsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUN2RSxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUV4RCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUV4RCxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRXpELE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3pDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXZELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyREFBMkQsRUFBRSxHQUFHLEVBQUU7WUFDdEUsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixFQUFFLHFCQUFxQixFQUFFLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEksa0JBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQztvQkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztpQkFDM0IsQ0FBQyxDQUFDO2dCQUNILFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1lBQ2xFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0dBQWtHLEVBQUUsR0FBRyxFQUFFO1lBQzdHLE1BQU0sZ0JBQWdCLEdBQUcsd0JBQXdCLENBQUMsT0FBTyxFQUFFO2dCQUMxRCxxQkFBcUIsRUFBRSxJQUFJLE1BQU0sQ0FBQyxrREFBa0QsQ0FBQztnQkFDckYscUJBQXFCLEVBQUUsSUFBSSxNQUFNLENBQUMsMkJBQTJCLENBQUM7YUFDOUQsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUM1QixPQUFPLEVBQ1AsZ0JBQWdCLEVBQ2hCLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUNkLENBQUM7WUFFRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3ZFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzREFBc0QsRUFBRSxHQUFHLEVBQUU7WUFDakUsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxZQUFZO29CQUNaLEVBQUU7aUJBQ0Y7Z0JBQ0QsVUFBVSxFQUFFLHNCQUFzQjthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdURBQXVELEVBQUUsR0FBRyxFQUFFO1lBQ2xFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsWUFBWTtvQkFDWixFQUFFO2lCQUNGO2dCQUNELFVBQVUsRUFBRSxzQkFBc0I7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtZQUNwRSxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLFlBQVk7b0JBQ1osTUFBTTtpQkFDTjtnQkFDRCxVQUFVLEVBQUUsc0JBQXNCO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrREFBa0QsRUFBRSxHQUFHLEVBQUU7WUFDN0QsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxZQUFZO29CQUNaLGNBQWM7b0JBQ2QsT0FBTztvQkFDUCxNQUFNO2lCQUNOO2dCQUNELFVBQVUsRUFBRSxzQkFBc0I7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDREQUE0RCxFQUFFLEdBQUcsRUFBRTtZQUN2RSxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLFlBQVk7b0JBQ1osY0FBYztvQkFDZCxPQUFPO29CQUNQLE9BQU87aUJBQ1A7Z0JBQ0QsVUFBVSxFQUFFLHNCQUFzQjthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO1lBQzFFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsWUFBWTtvQkFDWixVQUFVO2lCQUNWO2dCQUNELFVBQVUsRUFBRSxzQkFBc0I7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNoRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFEQUFxRCxFQUFFLEdBQUcsRUFBRTtZQUNoRSxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLFlBQVk7b0JBQ1osSUFBSTtpQkFDSjtnQkFDRCxVQUFVLEVBQUUsc0JBQXNCO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxRUFBcUUsRUFBRSxHQUFHLEVBQUU7WUFDaEYsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxZQUFZO29CQUNaLEdBQUc7aUJBQ0g7Z0JBQ0QsVUFBVSxFQUFFLHNCQUFzQjthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO1lBQ3pFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtvQkFDYixjQUFjO29CQUNkLElBQUk7aUJBQ0o7Z0JBQ0QsVUFBVSxFQUFFLHNCQUFzQjthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ2xFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0VBQXNFLEVBQUUsR0FBRyxFQUFFO1lBQ2pGLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsTUFBTTtpQkFDTjtnQkFDRCxVQUFVLEVBQUUsc0JBQXNCO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksVUFBVSxHQUFrQixJQUFJLENBQUM7Z0JBQ3JDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDL0MsVUFBVSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsQ0FBQztnQkFDSCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDeEMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUsR0FBRyxFQUFFO1lBQ3ZFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsV0FBVztvQkFDWCxLQUFLO29CQUNMLEtBQUs7aUJBQ0w7Z0JBQ0QsVUFBVSxFQUFFLHNCQUFzQjthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzdDLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsWUFBWTtvQkFDWixJQUFJO2lCQUNKO2dCQUNELFVBQVUsRUFBRSxzQkFBc0I7YUFDbEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLFlBQVk7b0JBQ1osTUFBTTtpQkFDTjtnQkFDRCxVQUFVLEVBQUUsc0JBQXNCO2FBQ2xDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4SEFBOEgsRUFBRSxHQUFHLEVBQUU7WUFDekksV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxHQUFHO29CQUNILE1BQU07aUJBQ047Z0JBQ0QsVUFBVSxFQUFFLHNCQUFzQjthQUNsQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1lBQ2hGLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQztnQkFDbEMsVUFBVSxFQUFFLHFCQUFxQjthQUNqQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1lBQ3BGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEVBQTBFLEVBQUUsR0FBRyxFQUFFO1lBQ3JGLG9DQUFvQyxFQUFFLENBQUM7WUFDdkMsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLDZCQUE2QixFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDcEYsa0JBQWtCLENBQ2pCLEtBQUssRUFDTCxFQUFFLEVBQ0YsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ3JCLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7Z0JBQzlCLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztZQUMzRixDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZ0JBQWdCO29CQUNoQixrQkFBa0I7b0JBQ2xCLGdCQUFnQjtvQkFDaEIsa0JBQWtCO29CQUNsQixvQkFBb0I7b0JBQ3BCLGdCQUFnQjtvQkFDaEIsMkJBQTJCO2lCQUMzQjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixNQUFNLGtCQUFrQixHQUFHO29CQUMxQixvQkFBb0I7b0JBQ3BCLHdCQUF3QjtvQkFDeEIsMEJBQTBCO29CQUMxQix3QkFBd0I7b0JBQ3hCLHlCQUF5QjtvQkFDekIsNEJBQTRCO29CQUM1Qix1QkFBdUI7b0JBQ3ZCLHdDQUF3QztpQkFDeEMsQ0FBQztnQkFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDL0QsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDekIsTUFBTSxnQkFBZ0IsR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFckgsS0FBSyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDO3dCQUNqRSxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQywyQ0FBbUMsRUFBRSxDQUFDOzRCQUNqRSxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDakgsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsMEJBQTBCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUN4SCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO1lBQ3ZELFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtvQkFDYixnQkFBZ0I7b0JBQ2hCLGtCQUFrQjtvQkFDbEIsZ0JBQWdCO29CQUNoQixrQkFBa0I7b0JBQ2xCLG9CQUFvQjtvQkFDcEIsZ0JBQWdCO29CQUNoQiwyQkFBMkI7aUJBQzNCO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFVBQVUsRUFBRTtvQkFDWCxtQkFBbUIsRUFBRSxrQkFBa0I7aUJBQ3ZDO2FBQ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBRS9CLE1BQU0sa0JBQWtCLEdBQUc7b0JBQzFCLGtCQUFrQjtvQkFDbEIsb0JBQW9CO29CQUNwQixzQkFBc0I7b0JBQ3RCLG9CQUFvQjtvQkFDcEIsdUJBQXVCO29CQUN2QiwwQkFBMEI7b0JBQzFCLHFCQUFxQjtvQkFDckIsbUNBQW1DO2lCQUNuQyxDQUFDO2dCQUNGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMvRCxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN6QixNQUFNLGdCQUFnQixHQUFHLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVySCxLQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7d0JBQ2pFLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ2pELElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLDJDQUFtQyxFQUFFLENBQUM7NEJBQ2pFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUNqSCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSwwQkFBMEIsVUFBVSxLQUFLLE1BQU0sR0FBRyxDQUFDLENBQUM7d0JBQ3hILENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRSxHQUFHLEVBQUU7WUFDekYsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO2lCQUNiO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFVBQVUsRUFBRTtvQkFDWCxtQkFBbUIsRUFBRSxrQkFBa0I7b0JBQ3ZDLGlCQUFpQixFQUFFLE9BQU87aUJBQzFCO2FBQ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBRS9CLE1BQU0sa0JBQWtCLEdBQUc7b0JBQzFCLGtCQUFrQjtpQkFDbEIsQ0FBQztnQkFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDL0QsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDekIsTUFBTSxnQkFBZ0IsR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFckgsS0FBSyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDO3dCQUNqRSxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQywyQ0FBbUMsRUFBRSxDQUFDOzRCQUNqRSxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDakgsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsMEJBQTBCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUN4SCxDQUFDO3dCQUNELFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsMEJBQTBCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUMxSCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtpQkFDYjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxVQUFVLEVBQUU7b0JBQ1gsbUJBQW1CLEVBQUUsT0FBTztvQkFDNUIsaUJBQWlCLEVBQUUsa0JBQWtCO2lCQUNyQzthQUNELEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixNQUFNLGtCQUFrQixHQUFHO29CQUMxQixnQkFBZ0I7aUJBQ2hCLENBQUM7Z0JBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQy9ELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3pCLE1BQU0sZ0JBQWdCLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXJILEtBQUssSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQzt3QkFDakUsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDakQsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsMkNBQW1DLEVBQUUsQ0FBQzs0QkFDakUsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsVUFBVSxLQUFLLE1BQU0sR0FBRyxDQUFDLENBQUM7d0JBQ3BILENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDMUgsQ0FBQzt3QkFDRCxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLDBCQUEwQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDeEgsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGdCQUFnQjtvQkFDaEIsa0JBQWtCO29CQUNsQixnQkFBZ0I7b0JBQ2hCLGtCQUFrQjtvQkFDbEIsb0JBQW9CO29CQUNwQixnQkFBZ0I7b0JBQ2hCLDJCQUEyQjtpQkFDM0I7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsVUFBVSxFQUFFO29CQUNYLG1CQUFtQixFQUFFLGlCQUFpQjtpQkFDdEM7YUFDRCxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFFL0IsTUFBTSxrQkFBa0IsR0FBRztvQkFDMUIsaUJBQWlCO29CQUNqQixvQkFBb0I7b0JBQ3BCLHNCQUFzQjtvQkFDdEIsbUJBQW1CO29CQUNuQixvQkFBb0I7b0JBQ3BCLHVCQUF1QjtvQkFDdkIsbUJBQW1CO29CQUNuQixnQ0FBZ0M7aUJBQ2hDLENBQUM7Z0JBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQy9ELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3pCLE1BQU0sZ0JBQWdCLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXJILEtBQUssSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQzt3QkFDakUsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDakQsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsMkNBQW1DLEVBQUUsQ0FBQzs0QkFDakUsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxrQkFBa0IsVUFBVSxLQUFLLE1BQU0sR0FBRyxDQUFDLENBQUM7d0JBQ2pILENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLDBCQUEwQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDeEgsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtZQUM1RCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZ0JBQWdCO29CQUNoQixrQkFBa0I7b0JBQ2xCLGdCQUFnQjtvQkFDaEIsa0JBQWtCO29CQUNsQixvQkFBb0I7b0JBQ3BCLGdCQUFnQjtvQkFDaEIsMkJBQTJCO2lCQUMzQjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxVQUFVLEVBQUU7b0JBQ1gsbUJBQW1CLEVBQUUsT0FBTztvQkFDNUIsaUJBQWlCLEVBQUUsT0FBTztpQkFDMUI7YUFDRCxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFFL0IsTUFBTSxrQkFBa0IsR0FBRztvQkFDMUIsYUFBYTtvQkFDYixnQkFBZ0I7b0JBQ2hCLGtCQUFrQjtvQkFDbEIsZ0JBQWdCO29CQUNoQixrQkFBa0I7b0JBQ2xCLG9CQUFvQjtvQkFDcEIsZ0JBQWdCO29CQUNoQiwyQkFBMkI7aUJBQzNCLENBQUM7Z0JBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQy9ELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3pCLE1BQU0sZ0JBQWdCLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXJILEtBQUssSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQzt3QkFDakUsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDakQsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsMkNBQW1DLEVBQUUsQ0FBQzs0QkFDakUsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxrQkFBa0IsVUFBVSxLQUFLLE1BQU0sR0FBRyxDQUFDLENBQUM7NEJBQ2hILFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUNqSCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSwwQkFBMEIsVUFBVSxLQUFLLE1BQU0sR0FBRyxDQUFDLENBQUM7NEJBQ3ZILFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsMEJBQTBCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUN4SCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzdELFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsYUFBYTtpQkFDYjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDekIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztpQkFDMUIsQ0FBQyxDQUFDO2dCQUVILFdBQVc7Z0JBQ1gsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRWhDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBRXhELFdBQVc7Z0JBQ1gsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRWhDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7WUFFSCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7aUJBQ2I7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsVUFBVSxFQUFFO29CQUNYLFlBQVksRUFBRSxPQUFPO2lCQUNyQjthQUNELEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILFdBQVc7Z0JBQ1gsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRWhDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQyxDQUFDO1lBRUgsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO2lCQUNiO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7Z0JBQ2pDLFVBQVUsRUFBRTtvQkFDWCxZQUFZLEVBQUUsUUFBUTtpQkFDdEI7YUFDRCxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFFL0IsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxXQUFXO2dCQUNYLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztnQkFFdEQsV0FBVztnQkFDWCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7WUFFSCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7aUJBQ2I7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsVUFBVSxFQUFFO29CQUNYLFlBQVksRUFBRSxVQUFVO2lCQUN4QjthQUNELEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUVILFdBQVc7Z0JBQ1gsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUV0RCxXQUFXO2dCQUNYLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtZQUNyQyxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLGFBQWE7b0JBQ2IsZ0JBQWdCO29CQUNoQixrQkFBa0I7b0JBQ2xCLGdCQUFnQjtvQkFDaEIsa0JBQWtCO29CQUNsQixvQkFBb0I7b0JBQ3BCLGdCQUFnQjtvQkFDaEIsMkJBQTJCO2lCQUMzQjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixNQUFNLGtCQUFrQixHQUFHO29CQUMxQixrQkFBa0I7b0JBQ2xCLG9CQUFvQjtvQkFDcEIsc0JBQXNCO29CQUN0QixvQkFBb0I7b0JBQ3BCLHNCQUFzQjtvQkFDdEIsd0JBQXdCO29CQUN4QixvQkFBb0I7b0JBQ3BCLG1DQUFtQztpQkFDbkMsQ0FBQztnQkFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDL0QsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDekIsTUFBTSxnQkFBZ0IsR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFckgsS0FBSyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDO3dCQUNqRSxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQywyQ0FBbUMsRUFBRSxDQUFDOzRCQUNqRSxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDcEgsQ0FBQzs2QkFBTSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQywyQ0FBbUMsRUFBRSxDQUFDOzRCQUN4RSxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixVQUFVLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDL0csQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsMEJBQTBCLFVBQVUsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUMxSCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsRUFBRTtpQkFDRjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhELEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JCLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLEVBQUU7aUJBQ0Y7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsVUFBVSxFQUFFO29CQUNYLG1CQUFtQixFQUFFLE9BQU87aUJBQzVCO2FBQ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBRS9CLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JCLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1FQUFtRSxFQUFFLEdBQUcsRUFBRTtZQUM5RSxNQUFNLFVBQVUsR0FBRywwQkFBMEIsQ0FBQztZQUU5QyxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUNqRSxnQkFBZ0IsRUFBRTtvQkFDakIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ3pCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO29CQUMzQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtvQkFDM0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7aUJBQzdCO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLEVBQUU7aUJBQ0Y7Z0JBQ0QsVUFBVSxFQUFFLFVBQVU7YUFDdEIsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLGlFQUFpRSxDQUFDLENBQUM7Z0JBRXZILEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsNENBQTRDLENBQUMsQ0FBQztnQkFFbEcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbkIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDcEQsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsc0RBQXNELENBQUMsQ0FBQztnQkFDOUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsc0RBQXNELENBQUMsQ0FBQztZQUNqSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVEQUF1RCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztZQUVwQyxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUNqRSxnQkFBZ0IsRUFBRTtvQkFDakIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ3pCLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO29CQUN6QixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDekIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUN6RCxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDOUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQ3ZELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2lCQUNoRDthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxhQUFhO29CQUNiLGFBQWE7b0JBQ2IsY0FBYztvQkFDZCxVQUFVO2lCQUNWO2dCQUNELFVBQVUsRUFBRSxVQUFVO2FBQ3RCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLDZDQUE2QyxDQUFDLENBQUM7Z0JBQ3BHLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNELFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsNkNBQTZDLENBQUMsQ0FBQztnQkFDcEcsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDO2dCQUNwRyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLDZDQUE2QyxDQUFDLENBQUM7Z0JBQ3BHLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNELFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsNkNBQTZDLENBQUMsQ0FBQztZQUNyRyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBFQUEwRSxFQUFFLEdBQUcsRUFBRTtZQUNyRixXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLHVCQUF1QjtpQkFDdkI7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjthQUNqQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO1lBQ3JHLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkVBQTZFLEVBQUUsR0FBRyxFQUFFO1lBQ3hGLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsRUFBRTtpQkFDRjtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUUvQixTQUFTLGNBQWMsQ0FBQyxTQUFvQixFQUFFLEtBQWE7b0JBQzFELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDbEQsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3RDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxZQUFZO2dCQUNaLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNELGNBQWMsQ0FBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsQ0FBQztnQkFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7Z0JBRW5FLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkUsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsY0FBYyxDQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztnQkFFckUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxjQUFjLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxjQUFjLENBQUMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dCQUVsRSxTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLGNBQWMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNELGNBQWMsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7Z0JBRW5FLGFBQWE7Z0JBQ2IsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxjQUFjLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxjQUFjLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBRTFELFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkUsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsY0FBYyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUV4RCxTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLGNBQWMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNELGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFdkQsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxjQUFjLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxjQUFjLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7WUFDNUUsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxFQUFFO29CQUNGLE9BQU87aUJBQ1A7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjthQUNqQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXBELFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRXZELFlBQVk7Z0JBQ1osU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFdkQsbUJBQW1CO2dCQUNuQixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdkQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7WUFDcEUsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxFQUFFO29CQUNGLE9BQU87aUJBQ1A7Z0JBQ0QsVUFBVSxFQUFFLHFCQUFxQjthQUNqQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXBELFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUNsRCxXQUFXLENBQUM7Z0JBQ1gsSUFBSSxFQUFFO29CQUNMLEVBQUU7b0JBQ0YsT0FBTztpQkFDUDtnQkFDRCxVQUFVLEVBQUUscUJBQXFCO2FBQ2pDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMvQixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFNUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFcEQsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFcEQsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO1lBQzFFLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsRUFBRTtvQkFDRixPQUFPO2lCQUNQO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7YUFDakMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1QyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVwRCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUV0RCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUV0RCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkVBQTZFLEVBQUUsR0FBRyxFQUFFO1lBQ3hGLFdBQVcsQ0FBQztnQkFDWCxJQUFJLEVBQUU7b0JBQ0wsRUFBRTtvQkFDRixPQUFPO2lCQUNQO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7YUFDakMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1QyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVwRCxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUV2RCxrQ0FBbUIsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXBELHVCQUF1QjtnQkFDdkIsa0NBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbEQsOEJBQThCO2dCQUM5QixTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELGtDQUFtQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFckQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrREFBa0QsRUFBRSxHQUFHLEVBQUU7WUFDN0QsV0FBVyxDQUFDO2dCQUNYLElBQUksRUFBRTtvQkFDTCxnQ0FBZ0M7aUJBQ2hDO2dCQUNELFVBQVUsRUFBRSxxQkFBcUI7YUFDakMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFL0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO2dCQUVoRixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7Z0JBRWxGLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUscUNBQXFDLENBQUMsQ0FBQztnQkFFbkYsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDO2dCQUVuRixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHFDQUFxQyxDQUFDLENBQUM7WUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxRkFBcUYsRUFBRSxHQUFHLEVBQUU7WUFDaEcsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDO1lBRWhDLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxXQUFXLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ2pFLGdCQUFnQixFQUFFO29CQUNqQixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDekIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ3pCLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO29CQUN6QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDOUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDekQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FB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QUksQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3JELFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQzNELFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3JELFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ELGtDQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBQzVELFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFD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