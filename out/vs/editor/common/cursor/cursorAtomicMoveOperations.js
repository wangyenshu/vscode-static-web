/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/cursorColumns"], function (require, exports, cursorColumns_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AtomicTabMoveOperations = exports.Direction = void 0;
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Nearest"] = 2] = "Nearest";
    })(Direction || (exports.Direction = Direction = {}));
    class AtomicTabMoveOperations {
        /**
         * Get the visible column at the position. If we get to a non-whitespace character first
         * or past the end of string then return -1.
         *
         * **Note** `position` and the return value are 0-based.
         */
        static whitespaceVisibleColumn(lineContent, position, tabSize) {
            const lineLength = lineContent.length;
            let visibleColumn = 0;
            let prevTabStopPosition = -1;
            let prevTabStopVisibleColumn = -1;
            for (let i = 0; i < lineLength; i++) {
                if (i === position) {
                    return [prevTabStopPosition, prevTabStopVisibleColumn, visibleColumn];
                }
                if (visibleColumn % tabSize === 0) {
                    prevTabStopPosition = i;
                    prevTabStopVisibleColumn = visibleColumn;
                }
                const chCode = lineContent.charCodeAt(i);
                switch (chCode) {
                    case 32 /* CharCode.Space */:
                        visibleColumn += 1;
                        break;
                    case 9 /* CharCode.Tab */:
                        // Skip to the next multiple of tabSize.
                        visibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
                        break;
                    default:
                        return [-1, -1, -1];
                }
            }
            if (position === lineLength) {
                return [prevTabStopPosition, prevTabStopVisibleColumn, visibleColumn];
            }
            return [-1, -1, -1];
        }
        /**
         * Return the position that should result from a move left, right or to the
         * nearest tab, if atomic tabs are enabled. Left and right are used for the
         * arrow key movements, nearest is used for mouse selection. It returns
         * -1 if atomic tabs are not relevant and you should fall back to normal
         * behaviour.
         *
         * **Note**: `position` and the return value are 0-based.
         */
        static atomicPosition(lineContent, position, tabSize, direction) {
            const lineLength = lineContent.length;
            // Get the 0-based visible column corresponding to the position, or return
            // -1 if it is not in the initial whitespace.
            const [prevTabStopPosition, prevTabStopVisibleColumn, visibleColumn] = AtomicTabMoveOperations.whitespaceVisibleColumn(lineContent, position, tabSize);
            if (visibleColumn === -1) {
                return -1;
            }
            // Is the output left or right of the current position. The case for nearest
            // where it is the same as the current position is handled in the switch.
            let left;
            switch (direction) {
                case 0 /* Direction.Left */:
                    left = true;
                    break;
                case 1 /* Direction.Right */:
                    left = false;
                    break;
                case 2 /* Direction.Nearest */:
                    // The code below assumes the output position is either left or right
                    // of the input position. If it is the same, return immediately.
                    if (visibleColumn % tabSize === 0) {
                        return position;
                    }
                    // Go to the nearest indentation.
                    left = visibleColumn % tabSize <= (tabSize / 2);
                    break;
            }
            // If going left, we can just use the info about the last tab stop position and
            // last tab stop visible column that we computed in the first walk over the whitespace.
            if (left) {
                if (prevTabStopPosition === -1) {
                    return -1;
                }
                // If the direction is left, we need to keep scanning right to ensure
                // that targetVisibleColumn + tabSize is before non-whitespace.
                // This is so that when we press left at the end of a partial
                // indentation it only goes one character. For example '      foo' with
                // tabSize 4, should jump from position 6 to position 5, not 4.
                let currentVisibleColumn = prevTabStopVisibleColumn;
                for (let i = prevTabStopPosition; i < lineLength; ++i) {
                    if (currentVisibleColumn === prevTabStopVisibleColumn + tabSize) {
                        // It is a full indentation.
                        return prevTabStopPosition;
                    }
                    const chCode = lineContent.charCodeAt(i);
                    switch (chCode) {
                        case 32 /* CharCode.Space */:
                            currentVisibleColumn += 1;
                            break;
                        case 9 /* CharCode.Tab */:
                            currentVisibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(currentVisibleColumn, tabSize);
                            break;
                        default:
                            return -1;
                    }
                }
                if (currentVisibleColumn === prevTabStopVisibleColumn + tabSize) {
                    return prevTabStopPosition;
                }
                // It must have been a partial indentation.
                return -1;
            }
            // We are going right.
            const targetVisibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
            // We can just continue from where whitespaceVisibleColumn got to.
            let currentVisibleColumn = visibleColumn;
            for (let i = position; i < lineLength; i++) {
                if (currentVisibleColumn === targetVisibleColumn) {
                    return i;
                }
                const chCode = lineContent.charCodeAt(i);
                switch (chCode) {
                    case 32 /* CharCode.Space */:
                        currentVisibleColumn += 1;
                        break;
                    case 9 /* CharCode.Tab */:
                        currentVisibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(currentVisibleColumn, tabSize);
                        break;
                    default:
                        return -1;
                }
            }
            // This condition handles when the target column is at the end of the line.
            if (currentVisibleColumn === targetVisibleColumn) {
                return lineLength;
            }
            return -1;
        }
    }
    exports.AtomicTabMoveOperations = AtomicTabMoveOperations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQXRvbWljTW92ZU9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9jdXJzb3JBdG9taWNNb3ZlT3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsSUFBa0IsU0FJakI7SUFKRCxXQUFrQixTQUFTO1FBQzFCLHlDQUFJLENBQUE7UUFDSiwyQ0FBSyxDQUFBO1FBQ0wsK0NBQU8sQ0FBQTtJQUNSLENBQUMsRUFKaUIsU0FBUyx5QkFBVCxTQUFTLFFBSTFCO0lBRUQsTUFBYSx1QkFBdUI7UUFDbkM7Ozs7O1dBS0c7UUFDSSxNQUFNLENBQUMsdUJBQXVCLENBQUMsV0FBbUIsRUFBRSxRQUFnQixFQUFFLE9BQWU7WUFDM0YsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUN0QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdEIsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3BCLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSx3QkFBd0IsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztnQkFDRCxJQUFJLGFBQWEsR0FBRyxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25DLG1CQUFtQixHQUFHLENBQUMsQ0FBQztvQkFDeEIsd0JBQXdCLEdBQUcsYUFBYSxDQUFDO2dCQUMxQyxDQUFDO2dCQUNELE1BQU0s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