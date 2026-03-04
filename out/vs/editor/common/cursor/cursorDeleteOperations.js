/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/commands/replaceCommand", "vs/editor/common/cursorCommon", "vs/editor/common/core/cursorColumns", "vs/editor/common/cursor/cursorMoveOperations", "vs/editor/common/core/range", "vs/editor/common/core/position"], function (require, exports, strings, replaceCommand_1, cursorCommon_1, cursorColumns_1, cursorMoveOperations_1, range_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeleteOperations = void 0;
    class DeleteOperations {
        static deleteRight(prevEditOperationType, config, model, selections) {
            const commands = [];
            let shouldPushStackElementBefore = (prevEditOperationType !== 3 /* EditOperationType.DeletingRight */);
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                let deleteSelection = selection;
                if (deleteSelection.isEmpty()) {
                    const position = selection.getPosition();
                    const rightOfPosition = cursorMoveOperations_1.MoveOperations.right(config, model, position);
                    deleteSelection = new range_1.Range(rightOfPosition.lineNumber, rightOfPosition.column, position.lineNumber, position.column);
                }
                if (deleteSelection.isEmpty()) {
                    // Probably at end of file => ignore
                    commands[i] = null;
                    continue;
                }
                if (deleteSelection.startLineNumber !== deleteSelection.endLineNumber) {
                    shouldPushStackElementBefore = true;
                }
                commands[i] = new replaceCommand_1.ReplaceCommand(deleteSelection, '');
            }
            return [shouldPushStackElementBefore, commands];
        }
        static isAutoClosingPairDelete(autoClosingDelete, autoClosingBrackets, autoClosingQuotes, autoClosingPairsOpen, model, selections, autoClosedCharacters) {
            if (autoClosingBrackets === 'never' && autoClosingQuotes === 'never') {
                return false;
            }
            if (autoClosingDelete === 'never') {
                return false;
            }
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                const position = selection.getPosition();
                if (!selection.isEmpty()) {
                    return false;
                }
                const lineText = model.getLineContent(position.lineNumber);
                if (position.column < 2 || position.column >= lineText.length + 1) {
                    return false;
                }
                const character = lineText.charAt(position.column - 2);
                const autoClosingPairCandidates = autoClosingPairsOpen.get(character);
                if (!autoClosingPairCandidates) {
                    return false;
                }
                if ((0, cursorCommon_1.isQuote)(character)) {
                    if (autoClosingQuotes === 'never') {
                        return false;
                    }
                }
                else {
                    if (autoClosingBrackets === 'never') {
                        return false;
                    }
                }
                const afterCharacter = lineText.charAt(position.column - 1);
                let foundAutoClosingPair = false;
                for (const autoClosingPairCandidate of autoClosingPairCandidates) {
                    if (autoClosingPairCandidate.open === character && autoClosingPairCandidate.close === afterCharacter) {
                        foundAutoClosingPair = true;
                    }
                }
                if (!foundAutoClosingPair) {
                    return false;
                }
                // Must delete the pair only if it was automatically inserted by the editor
                if (autoClosingDelete === 'auto') {
                    let found = false;
                    for (let j = 0, lenJ = autoClosedCharacters.length; j < lenJ; j++) {
                        const autoClosedCharacter = autoClosedCharacters[j];
                        if (position.lineNumber === autoClosedCharacter.startLineNumber && position.column === autoClosedCharacter.startColumn) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        return false;
                    }
                }
            }
            return true;
        }
        static _runAutoClosingPairDelete(config, model, selections) {
            const commands = [];
            for (let i = 0, len = selections.length; i < len; i++) {
                const position = selections[i].getPosition();
                const deleteSelection = new range_1.Range(position.lineNumber, position.column - 1, position.lineNumber, position.column + 1);
                commands[i] = new replaceCommand_1.ReplaceCommand(deleteSelection, '');
            }
            return [true, commands];
        }
        static deleteLeft(prevEditOperationType, config, model, selections, autoClosedCharacters) {
            if (this.isAutoClosingPairDelete(config.autoClosingDelete, config.autoClosingBrackets, config.autoClosingQuotes, config.autoClosingPairs.autoClosingPairsOpenByEnd, model, selections, autoClosedCharacters)) {
                return this._runAutoClosingPairDelete(config, model, selections);
            }
            const commands = [];
            let shouldPushStackElementBefore = (prevEditOperationType !== 2 /* EditOperationType.DeletingLeft */);
            for (let i = 0, len = selections.length; i < len; i++) {
                const deleteRange = DeleteOperations.getDeleteRange(selections[i], model, config);
                // Ignore empty delete ranges, as they have no effect
                // They happen if the cursor is at the beginning of the file.
                if (deleteRange.isEmpty()) {
                    commands[i] = null;
                    continue;
                }
                if (deleteRange.startLineNumber !== deleteRange.endLineNumber) {
                    shouldPushStackElementBefore = true;
                }
                commands[i] = new replaceCommand_1.ReplaceCommand(deleteRange, '');
            }
            return [shouldPushStackElementBefore, commands];
        }
        static getDeleteRange(selection, model, config) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const position = selection.getPosition();
            // Unintend when using tab stops and cursor is within indentation
            if (config.useTabStops && position.column > 1) {
                const lineContent = model.getLineContent(position.lineNumber);
                const firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                const lastIndentationColumn = (firstNonWhitespaceIndex === -1
                    ? /* entire string is whitespace */ lineContent.length + 1
                    : firstNonWhitespaceIndex + 1);
                if (position.column <= lastIndentationColumn) {
                    const fromVisibleColumn = config.visibleColumnFromColumn(model, position);
                    const toVisibleColumn = cursorColumns_1.CursorColumns.prevIndentTabStop(fromVisibleColumn, config.indentSize);
                    const toColumn = config.columnFromVisibleColumn(model, position.lineNumber, toVisibleColumn);
                    return new range_1.Range(position.lineNumber, toColumn, position.lineNumber, position.column);
                }
            }
            return range_1.Range.fromPositions(DeleteOperations.getPositionAfterDeleteLeft(position, model), position);
        }
        static getPositionAfterDeleteLeft(position, model) {
            if (position.column > 1) {
                // Convert 1-based columns to 0-based offsets and back.
                const idx = strings.getLeftDeleteOffset(position.column - 1, model.getLineContent(position.lineNumber));
                return position.with(undefined, idx + 1);
            }
            else if (position.lineNumber > 1) {
                const newLine = position.lineNumber - 1;
                return new position_1.Position(newLine, model.getLineMaxColumn(newLine));
            }
            else {
                return position;
            }
        }
        static cut(config, model, selections) {
            const commands = [];
            let lastCutRange = null;
            selections.sort((a, b) => position_1.Position.compare(a.getStartPosition(), b.getEndPosition()));
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                if (selection.isEmpty()) {
                    if (config.emptySelectionClipboard) {
                        // This is a full line cut
                        const position = selection.getPosition();
                        let startLineNumber, startColumn, endLineNumber, endColumn;
                        if (position.lineNumber < model.getLineCount()) {
                            // Cutting a line in the middle of the model
                            startLineNumber = position.lineNumber;
                            startColumn = 1;
                            endLineNumber = position.lineNumber + 1;
                            endColumn = 1;
                        }
                        else if (position.lineNumber > 1 && lastCutRange?.endLineNumber !== position.lineNumber) {
                            // Cutting the last line & there are more than 1 lines in the model & a previous cut operation does not touch the current cut operation
                            startLineNumber = position.lineNumber - 1;
                            startColumn = model.getLineMaxColumn(position.lineNumber - 1);
                            endLineNumber = position.lineNumber;
                            endColumn = model.getLineMaxColumn(position.lineNumber);
                        }
                        else {
                            // Cutting the single line that the model contains
                            startLineNumber = position.lineNumber;
                            startColumn = 1;
                            endLineNumber = position.lineNumber;
                            endColumn = model.getLineMaxColumn(position.lineNumber);
                        }
                        const deleteSelection = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                        lastCutRange = deleteSelection;
                        if (!deleteSelection.isEmpty()) {
                            commands[i] = new replaceCommand_1.ReplaceCommand(deleteSelection, '');
                        }
                        else {
                            commands[i] = null;
                        }
                    }
                    else {
                        // Cannot cut empty selection
                        commands[i] = null;
                    }
                }
                else {
                    commands[i] = new replaceCommand_1.ReplaceCommand(selection, '');
                }
            }
            return new cursorCommon_1.EditOperationResult(0 /* EditOperationType.Other */, commands, {
                shouldPushStackElementBefore: true,
                shouldPushStackElementAfter: true
            });
        }
    }
    exports.DeleteOperations = DeleteOperations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yRGVsZXRlT3BlcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY3Vyc29yL2N1cnNvckRlbGV0ZU9wZXJhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsZ0JBQWdCO1FBRXJCLE1BQU0sQ0FBQyxXQUFXLENBQUMscUJBQXdDLEVBQUUsTUFBMkIsRUFBRSxLQUF5QixFQUFFLFVBQXVCO1lBQ2xKLE1BQU0sUUFBUSxHQUEyQixFQUFFLENBQUM7WUFDNUMsSUFBSSw0QkFBNEIsR0FBRyxDQUFDLHFCQUFxQiw0Q0FBb0MsQ0FBQyxDQUFDO1lBQy9GLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVoQyxJQUFJLGVBQWUsR0FBVSxTQUFTLENBQUM7Z0JBRXZDLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7b0JBQy9CLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDekMsTUFBTSxlQUFlLEdBQUcscUNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDdEUsZUFBZSxHQUFHLElBQUksYUFBSyxDQUMxQixlQUFlLENBQUMsVUFBVSxFQUMxQixlQUFlLENBQUMsTUFBTSxFQUN0QixRQUFRLENBQUMsVUFBVSxFQUNuQixRQUFRLENBQUMsTUFBTSxDQUNmLENBQUM7Z0JBQ0gsQ0FBQztnQkFFRCxJQUFJLGVBQWUsQ0FB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