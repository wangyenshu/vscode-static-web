/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/cursor/cursorAtomicMoveOperations", "vs/editor/common/cursorCommon"], function (require, exports, strings, cursorColumns_1, position_1, range_1, cursorAtomicMoveOperations_1, cursorCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveOperations = exports.CursorPosition = void 0;
    class CursorPosition {
        constructor(lineNumber, column, leftoverVisibleColumns) {
            this._cursorPositionBrand = undefined;
            this.lineNumber = lineNumber;
            this.column = column;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
        }
    }
    exports.CursorPosition = CursorPosition;
    class MoveOperations {
        static leftPosition(model, position) {
            if (position.column > model.getLineMinColumn(position.lineNumber)) {
                return position.delta(undefined, -strings.prevCharLength(model.getLineContent(position.lineNumber), position.column - 1));
            }
            else if (position.lineNumber > 1) {
                const newLineNumber = position.lineNumber - 1;
                return new position_1.Position(newLineNumber, model.getLineMaxColumn(newLineNumber));
            }
            else {
                return position;
            }
        }
        static leftPositionAtomicSoftTabs(model, position, tabSize) {
            if (position.column <= model.getLineIndentColumn(position.lineNumber)) {
                const minColumn = model.getLineMinColumn(position.lineNumber);
                const lineContent = model.getLineContent(position.lineNumber);
                const newPosition = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(lineContent, position.column - 1, tabSize, 0 /* Direction.Left */);
                if (newPosition !== -1 && newPosition + 1 >= minColumn) {
                    return new position_1.Position(position.lineNumber, newPosition + 1);
                }
            }
            return this.leftPosition(model, position);
        }
        static left(config, model, position) {
            const pos = config.stickyTabStops
                ? MoveOperations.leftPositionAtomicSoftTabs(model, position, config.tabSize)
                : MoveOperations.leftPosition(model, position);
            return new CursorPosition(pos.lineNumber, pos.column, 0);
        }
        /**
         * @param noOfColumns Must be either `1`
         * or `Math.round(viewModel.getLineContent(viewLineNumber).length / 2)` (for half lines).
        */
        static moveLeft(config, model, cursor, inSelectionMode, noOfColumns) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If the user has a selection and does not want to extend it,
                // put the cursor at the beginning of the selection.
                lineNumber = cursor.selection.startLineNumber;
                column = cursor.selection.startColumn;
            }
            else {
                // This has no effect if noOfColumns === 1.
                // It is ok to do so in the half-line scenario.
                const pos = cursor.position.delta(undefined, -(noOfColumns - 1));
                // We clip the position before normalization, as normalization is not defined
                // for possibly negative columns.
                const normalizedPos = model.normalizePosition(MoveOperations.clipPositionColumn(pos, model), 0 /* PositionAffinity.Left */);
                const p = MoveOperations.left(config, model, normalizedPos);
                lineNumber = p.lineNumber;
                column = p.column;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        /**
         * Adjusts the column so that it is within min/max of the line.
        */
        static clipPositionColumn(position, model) {
            return new position_1.Position(position.lineNumber, MoveOperations.clipRange(position.column, model.getLineMinColumn(position.lineNumber), model.getLineMaxColumn(position.lineNumber)));
        }
        static clipRange(value, min, max) {
            if (value < min) {
                return min;
            }
            if (value > max) {
                return max;
            }
            return value;
        }
        static rightPosition(model, lineNumber, column) {
            if (column < model.getLineMaxColumn(lineNumber)) {
                column = column + strings.nextCharLength(model.getLineContent(lineNumber), column - 1);
            }
            else if (lineNumber < model.getLineCount()) {
                lineNumber = lineNumber + 1;
                column = model.getLineMinColumn(lineNumber);
            }
            return new position_1.Position(lineNumber, column);
        }
        static rightPositionAtomicSoftTabs(model, lineNumber, column, tabSize, indentSize) {
            if (column < model.getLineIndentColumn(lineNumber)) {
                const lineContent = model.getLineContent(lineNumber);
                const newPosition = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(lineContent, column - 1, tabSize, 1 /* Direction.Right */);
                if (newPosition !== -1) {
                    return new position_1.Position(lineNumber, newPosition + 1);
                }
            }
            return this.rightPosition(model, lineNumber, column);
        }
        static right(config, model, position) {
            const pos = config.stickyTabStops
                ? MoveOperations.rightPositionAtomicSoftTabs(model, position.lineNumber, position.column, config.tabSize, config.indentSize)
                : MoveOperations.rightPosition(model, position.lineNumber, position.column);
            return new CursorPosition(pos.lineNumber, pos.column, 0);
        }
        static moveRight(config, model, cursor, inSelectionMode, noOfColumns) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move right without selection cancels selection and puts cursor at the end of the selection
                lineNumber = cursor.selection.endLineNumber;
                column = cursor.selection.endColumn;
            }
            else {
                const pos = cursor.position.delta(undefined, noOfColumns - 1);
                const normalizedPos = model.normalizePosition(MoveOperations.clipPositionColumn(pos, model), 1 /* PositionAffinity.Right */);
                const r = MoveOperations.right(config, model, normalizedPos);
                lineNumber = r.lineNumber;
                column = r.column;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static vertical(config, model, lineNumber, column, leftoverVisibleColumns, newLineNumber, allowMoveOnEdgeLine, normalizationAffinity) {
            const currentVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize) + leftoverVisibleColumns;
            const lineCount = model.getLineCount();
            const wasOnFirstPosition = (lineNumber === 1 && column === 1);
            const wasOnLastPosition = (lineNumber === lineCount && column === model.getLineMaxColumn(lineNumber));
            const wasAtEdgePosition = (newLineNumber < lineNumber ? wasOnFirstPosition : wasOnLastPosition);
            lineNumber = newLineNumber;
            if (lineNumber < 1) {
                lineNumber = 1;
                if (allowMoveOnEdgeLine) {
                    column = model.getLineMinColumn(lineNumber);
                }
                else {
                    column = Math.min(model.getLineMaxColumn(lineNumber), column);
                }
            }
            else if (lineNumber > lineCount) {
                lineNumber = lineCount;
                if (allowMoveOnEdgeLine) {
                    column = model.getLineMaxColumn(lineNumber);
                }
                else {
                    column = Math.min(model.getLineMaxColumn(lineNumber), column);
                }
            }
            else {
                column = config.columnFromVisibleColumn(model, lineNumber, currentVisibleColumn);
            }
            if (wasAtEdgePosition) {
                leftoverVisibleColumns = 0;
            }
            else {
                leftoverVisibleColumns = currentVisibleColumn - cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize);
            }
            if (normalizationAffinity !== undefined) {
                const position = new position_1.Position(lineNumber, column);
                const newPosition = model.normalizePosition(position, normalizationAffinity);
                leftoverVisibleColumns = leftoverVisibleColumns + (column - newPosition.column);
                lineNumber = newPosition.lineNumber;
                column = newPosition.column;
            }
            return new CursorPosition(lineNumber, column, leftoverVisibleColumns);
        }
        static down(config, model, lineNumber, column, leftoverVisibleColumns, count, allowMoveOnLastLine) {
            return this.vertical(config, model, lineNumber, column, leftoverVisibleColumns, lineNumber + count, allowMoveOnLastLine, 4 /* PositionAffinity.RightOfInjectedText */);
        }
        static moveDown(config, model, cursor, inSelectionMode, linesCount) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move down acts relative to the end of selection
                lineNumber = cursor.selection.endLineNumber;
                column = cursor.selection.endColumn;
            }
            else {
                lineNumber = cursor.position.lineNumber;
                column = cursor.position.column;
            }
            let i = 0;
            let r;
            do {
                r = MoveOperations.down(config, model, lineNumber + i, column, cursor.leftoverVisibleColumns, linesCount, true);
                const np = model.normalizePosition(new position_1.Position(r.lineNumber, r.column), 2 /* PositionAffinity.None */);
                if (np.lineNumber > lineNumber) {
                    break;
                }
            } while (i++ < 10 && lineNumber + i < model.getLineCount());
            return cursor.move(inSelectionMode, r.lineNumber, r.column, r.leftoverVisibleColumns);
        }
        static translateDown(config, model, cursor) {
            const selection = cursor.selection;
            const selectionStart = MoveOperations.down(config, model, selection.selectionStartLineNumber, selection.selectionStartColumn, cursor.selectionStartLeftoverVisibleColumns, 1, false);
            const position = MoveOperations.down(config, model, selection.positionLineNumber, selection.positionColumn, cursor.leftoverVisibleColumns, 1, false);
            return new cursorCommon_1.SingleCursorState(new range_1.Range(selectionStart.lineNumber, selectionStart.column, selectionStart.lineNumber, selectionStart.column), 0 /* SelectionStartKind.Simple */, selectionStart.leftoverVisibleColumns, new position_1.Position(position.lineNumber, position.column), position.leftoverVisibleColumns);
        }
        static up(config, model, lineNumber, column, leftoverVisibleColumns, count, allowMoveOnFirstLine) {
            return this.vertical(config, model, lineNumber, column, leftoverVisibleColumns, lineNumber - count, allowMoveOnFirstLine, 3 /* PositionAffinity.LeftOfInjectedText */);
        }
        static moveUp(config, model, cursor, inSelectionMode, linesCount) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move up acts relative to the beginning of selection
                lineNumber = cursor.selection.startLineNumber;
                column = cursor.selection.startColumn;
            }
            else {
                lineNumber = cursor.position.lineNumber;
                column = cursor.position.column;
            }
            const r = MoveOperations.up(config, model, lineNumber, column, cursor.leftoverVisibleColumns, linesCount, true);
            return cursor.move(inSelectionMode, r.lineNumber, r.column, r.leftoverVisibleColumns);
        }
        static translateUp(config, model, cursor) {
            const selection = cursor.selection;
            const selectionStart = MoveOperations.up(config, model, selection.selectionStartLineNumber, selection.selectionStartColumn, cursor.selectionStartLeftoverVisibleColumns, 1, false);
            const position = MoveOperations.up(config, model, selection.positionLineNumber, selection.positionColumn, cursor.leftoverVisibleColumns, 1, false);
            return new cursorCommon_1.SingleCursorState(new range_1.Range(selectionStart.lineNumber, selectionStart.column, selectionStart.lineNumber, selectionStart.column), 0 /* SelectionStartKind.Simple */, selectionStart.leftoverVisibleColumns, new position_1.Position(position.lineNumber, position.column), position.leftoverVisibleColumns);
        }
        static _isBlankLine(model, lineNumber) {
            if (model.getLineFirstNonWhitespaceColumn(lineNumber) === 0) {
                // empty or contains only whitespace
                return true;
            }
            return false;
        }
        static moveToPrevBlankLine(config, model, cursor, inSelectionMode) {
            let lineNumber = cursor.position.lineNumber;
            // If our current line is blank, move to the previous non-blank line
            while (lineNumber > 1 && this._isBlankLine(model, lineNumber)) {
                lineNumber--;
            }
            // Find the previous blank line
            while (lineNumber > 1 && !this._isBlankLine(model, lineNumber)) {
                lineNumber--;
            }
            return cursor.move(inSelectionMode, lineNumber, model.getLineMinColumn(lineNumber), 0);
        }
        static moveToNextBlankLine(config, model, cursor, inSelectionMode) {
            const lineCount = model.getLineCount();
            let lineNumber = cursor.position.lineNumber;
            // If our current line is blank, move to the next non-blank line
            while (lineNumber < lineCount && this._isBlankLine(model, lineNumber)) {
                lineNumber++;
            }
            // Find the next blank line
            while (lineNumber < lineCount && !this._isBlankLine(model, lineNumber)) {
                lineNumber++;
            }
            return cursor.move(inSelectionMode, lineNumber, model.getLineMinColumn(lineNumber), 0);
        }
        static moveToBeginningOfLine(config, model, cursor, inSelectionMode) {
            const lineNumber = cursor.position.lineNumber;
            const minColumn = model.getLineMinColumn(lineNumber);
            const firstNonBlankColumn = model.getLineFirstNonWhitespaceColumn(lineNumber) || minColumn;
            let column;
            const relevantColumnNumber = cursor.position.column;
            if (relevantColumnNumber === firstNonBlankColumn) {
                column = minColumn;
            }
            else {
                column = firstNonBlankColumn;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static moveToEndOfLine(config, model, cursor, inSelectionMode, sticky) {
            const lineNumber = cursor.position.lineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            return cursor.move(inSelectionMode, lineNumber, maxColumn, sticky ? 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */ - maxColumn : 0);
        }
        static moveToBeginningOfBuffer(config, model, cursor, inSelectionMode) {
            return cursor.move(inSelectionMode, 1, 1, 0);
        }
        static moveToEndOfBuffer(config, model, cursor, inSelectionMode) {
            const lastLineNumber = model.getLineCount();
            const lastColumn = model.getLineMaxColumn(lastLineNumber);
            return cursor.move(inSelectionMode, lastLineNumber, lastColumn, 0);
        }
    }
    exports.MoveOperations = MoveOperations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yTW92ZU9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9jdXJzb3JNb3ZlT3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxjQUFjO1FBTzFCLFlBQVksVUFBa0IsRUFBRSxNQUFjLEVBQUUsc0JBQThCO1lBTjlFLHlCQUFvQixHQUFTLFNBQVMsQ0FBQztZQU90QyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7UUFDdEQsQ0FBQztLQUNEO0lBWkQsd0NBWUM7SUFFRCxNQUFhLGNBQWM7UUFDbkIsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUF5QixFQUFFLFFBQWtCO1lBQ3ZFLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzSCxDQUFDO2lCQUFNLElBQUksUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sSUFBSSxtQkFBUSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsZ0JB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