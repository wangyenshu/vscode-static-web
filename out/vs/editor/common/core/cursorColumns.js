/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorColumns = void 0;
    /**
     * A column in a position is the gap between two adjacent characters. The methods here
     * work with a concept called "visible column". A visible column is a very rough approximation
     * of the horizontal screen position of a column. For example, using a tab size of 4:
     * ```txt
     * |<TAB>|<TAB>|T|ext
     * |     |     | \---- column = 4, visible column = 9
     * |     |     \------ column = 3, visible column = 8
     * |     \------------ column = 2, visible column = 4
     * \------------------ column = 1, visible column = 0
     * ```
     *
     * **NOTE**: Visual columns do not work well for RTL text or variable-width fonts or characters.
     *
     * **NOTE**: These methods work and make sense both on the model and on the view model.
     */
    class CursorColumns {
        static _nextVisibleColumn(codePoint, visibleColumn, tabSize) {
            if (codePoint === 9 /* CharCode.Tab */) {
                return CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
            }
            if (strings.isFullWidthCharacter(codePoint) || strings.isEmojiImprecise(codePoint)) {
                return visibleColumn + 2;
            }
            return visibleColumn + 1;
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        static visibleColumnFromColumn(lineContent, column, tabSize) {
            const textLen = Math.min(column - 1, lineContent.length);
            const text = lineContent.substring(0, textLen);
            const iterator = new strings.GraphemeIterator(text);
            let result = 0;
            while (!iterator.eol()) {
                const codePoint = strings.getNextCodePoint(text, textLen, iterator.offset);
                iterator.nextGraphemeLength();
                result = this._nextVisibleColumn(codePoint, result, tabSize);
            }
            return result;
        }
        /**
         * Returns the value to display as "Col" in the status bar.
         * @see {@link CursorColumns}
         */
        static toStatusbarColumn(lineContent, column, tabSize) {
            const text = lineContent.substring(0, Math.min(column - 1, lineContent.length));
            const iterator = new strings.CodePointIterator(text);
            let result = 0;
            while (!iterator.eol()) {
                const codePoint = iterator.nextCodePoint();
                if (codePoint === 9 /* CharCode.Tab */) {
                    result = CursorColumns.nextRenderTabStop(result, tabSize);
                }
                else {
                    result = result + 1;
                }
            }
            return result + 1;
        }
        /**
         * Returns a column from a visible column.
         * @see {@link CursorColumns}
         */
        static columnFromVisibleColumn(lineContent, visibleColumn, tabSize) {
            if (visibleColumn <= 0) {
                return 1;
            }
            const lineContentLength = lineContent.length;
            const iterator = new strings.GraphemeIterator(lineContent);
            let beforeVisibleColumn = 0;
            let beforeColumn = 1;
            while (!iterator.eol()) {
                const codePoint = strings.getNextCodePoint(lineContent, lineContentLength, iterator.offset);
                iterator.nextGraphemeLength();
                const afterVisibleColumn = this._nextVisibleColumn(codePoint, beforeVisibleColumn, tabSize);
                const afterColumn = iterator.offset + 1;
                if (afterVisibleColumn >= visibleColumn) {
                    const beforeDelta = visibleColumn - beforeVisibleColumn;
                    const afterDelta = afterVisibleColumn - visibleColumn;
                    if (afterDelta < beforeDelta) {
                        return afterColumn;
                    }
                    else {
                        return beforeColumn;
                    }
                }
                beforeVisibleColumn = afterVisibleColumn;
                beforeColumn = afterColumn;
            }
            // walked the entire string
            return lineContentLength + 1;
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static nextRenderTabStop(visibleColumn, tabSize) {
            return visibleColumn + tabSize - visibleColumn % tabSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static nextIndentTabStop(visibleColumn, indentSize) {
            return visibleColumn + indentSize - visibleColumn % indentSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static prevRenderTabStop(column, tabSize) {
            return Math.max(0, column - 1 - (column - 1) % tabSize);
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static prevIndentTabStop(column, indentSize) {
            return Math.max(0, column - 1 - (column - 1) % indentSize);
        }
    }
    exports.CursorColumns = CursorColumns;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29sdW1ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS9jdXJzb3JDb2x1bW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRzs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSCxNQUFhLGFBQWE7UUFFakIsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFNBQWlCLEVBQUUsYUFBcUIsRUFBRSxPQUFlO1lBQzFGLElBQUksU0FBUyx5QkFBaUIsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUNELElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNwRixPQUFPLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDMUIsQ0FBQztZQUNELE9BQU8sYUFBYSxHQUFHLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksTUFBTSxDQUFDLHVCQUF1QixDQUFDLFdBQW1CLEVBQUUsTUFBYyxFQUFFLE9BQWU7WUFDekYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQyxNQUFNLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVwRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0UsUUFBUSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBRTlCLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksTUFBTSxDQUFDLGlCQUFpQixDQUFDLFdBQW1CLEVBQUUsTUFBYyxFQUFFLE9BQWU7WUFDbkYsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUUzQyxJQUFJLFNBQVMseUJBQWlCLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzNELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVEOzs7V0FHRztRQUNJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxXQUFtQixFQUFFLGFBQXFCLEVBQUUsT0FBZTtZQUNoRyxJQUFJLGFBQWEsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQzdDLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTNELElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztZQUNyQixPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RixRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFFOUIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM1RixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFFeEMsSUFBSSxrQkFBa0IsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDekMsTUFBTSxXQUFXLEdBQUcsYUFBYSxHQUFHLG1CQUFtQixDQUFDO29CQUN4RCxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsR0FBRyxhQUFhLENBQUM7b0JBQ3RELElBQUksVUFBVSxHQUFHLFdBQVcsRUFBRSxDQUFDO3dCQUM5QixPQUFPLFdBQVcsQ0FBQztvQkFDcEIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sWUFBWSxDQUFDO29CQUNyQixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7Z0JBQ3pDLFlBQVksR0FBRyxXQUFXLENBQUM7WUFDNUIsQ0FBQztZQUVELDJCQUEyQjtZQUMzQixPQUFPLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksTUFBTSxDQUFDLGlCQUFpQixDQUFDLGFBQXFCLEVBQUUsT0FBZTtZQUNyRSxPQUFPLGFBQWEsR0FBRyxPQUFPLEdBQUcsYUFBYSxHQUFHLE9BQU8sQ0FBQztRQUMxRCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksTUFBTSxDQUFDLGlCQUFpQixDQUFDLGFBQXFCLEVBQUUsVUFBa0I7WUFDeEUsT0FBTyxhQUFhLEdBQUcsVUFBVSxHQUFHLGFBQWEsR0FBRyxVQUFVLENBQUM7UUFDaEUsQ0FBQztRQUVEOzs7V0FHRztRQUNJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFjLEVBQUUsT0FBZTtZQUM5RCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVEOzs7V0FHRztRQUNJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFjLEVBQUUsVUFBa0I7WUFDakUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDO1FBQzVELENBQUM7S0FDRDtJQTVIRCxzQ0E0SEMifQ==