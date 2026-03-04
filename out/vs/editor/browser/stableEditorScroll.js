/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StableEditorBottomScrollState = exports.StableEditorScrollState = void 0;
    class StableEditorScrollState {
        static capture(editor) {
            if (editor.getScrollTop() === 0 || editor.hasPendingScrollAnimation()) {
                // Never mess with the scroll top if the editor is at the top of the file or if there is a pending scroll animation
                return new StableEditorScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0, null);
            }
            let visiblePosition = null;
            let visiblePositionScrollDelta = 0;
            const visibleRanges = editor.getVisibleRanges();
            if (visibleRanges.length > 0) {
                visiblePosition = visibleRanges[0].getStartPosition();
                const visiblePositionScrollTop = editor.getTopForPosition(visiblePosition.lineNumber, visiblePosition.column);
                visiblePositionScrollDelta = editor.getScrollTop() - visiblePositionScrollTop;
            }
            return new StableEditorScrollState(editor.getScrollTop(), editor.getContentHeight(), visiblePosition, visiblePositionScrollDelta, editor.getPosition());
        }
        constructor(_initialScrollTop, _initialContentHeight, _visiblePosition, _visiblePositionScrollDelta, _cursorPosition) {
            this._initialScrollTop = _initialScrollTop;
            this._initialContentHeight = _initialContentHeight;
            this._visiblePosition = _visiblePosition;
            this._visiblePositionScrollDelta = _visiblePositionScrollDelta;
            this._cursorPosition = _cursorPosition;
        }
        restore(editor) {
            if (this._initialContentHeight === editor.getContentHeight() && this._initialScrollTop === editor.getScrollTop()) {
                // The editor's content height and scroll top haven't changed, so we don't need to do anything
                return;
            }
            if (this._visiblePosition) {
                const visiblePositionScrollTop = editor.getTopForPosition(this._visiblePosition.lineNumber, this._visiblePosition.column);
                editor.setScrollTop(visiblePositionScrollTop + this._visiblePositionScrollDelta);
            }
        }
        restoreRelativeVerticalPositionOfCursor(editor) {
            if (this._initialContentHeight === editor.getContentHeight() && this._initialScrollTop === editor.getScrollTop()) {
                // The editor's content height and scroll top haven't changed, so we don't need to do anything
                return;
            }
            const currentCursorPosition = editor.getPosition();
            if (!this._cursorPosition || !currentCursorPosition) {
                return;
            }
            const offset = editor.getTopForLineNumber(currentCursorPosition.lineNumber) - editor.getTopForLineNumber(this._cursorPosition.lineNumber);
            editor.setScrollTop(editor.getScrollTop() + offset);
        }
    }
    exports.StableEditorScrollState = StableEditorScrollState;
    class StableEditorBottomScrollState {
        static capture(editor) {
            if (editor.hasPendingScrollAnimation()) {
                // Never mess with the scroll if there is a pending scroll animation
                return new StableEditorBottomScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0);
            }
            let visiblePosition = null;
            let visiblePositionScrollDelta = 0;
            const visibleRanges = editor.getVisibleRanges();
            if (visibleRanges.length > 0) {
                visiblePosition = visibleRanges.at(-1).getEndPosition();
                const visiblePositionScrollBottom = editor.getBottomForLineNumber(visiblePosition.lineNumber);
                visiblePositionScrollDelta = (editor.getScrollTop() + editor.getLayoutInfo().height) - visiblePositionScrollBottom;
            }
            return new StableEditorBottomScrollState(editor.getScrollTop(), editor.getContentHeight(), visiblePosition, visiblePositionScrollDelta);
        }
        constructor(_initialScrollTop, _initialContentHeight, _visiblePosition, _visiblePositionScrollDelta) {
            this._initialScrollTop = _initialScrollTop;
            this._initialContentHeight = _initialContentHeight;
            this._visiblePosition = _visiblePosition;
            this._visiblePositionScrollDelta = _visiblePositionScrollDelta;
        }
        restore(editor) {
            if (this._initialContentHeight === editor.getContentHeight() && this._initialScrollTop === editor.getScrollTop()) {
                // The editor's content height and scroll top haven't changed, so we don't need to do anything
                return;
            }
            if (this._visiblePosition) {
                const visiblePositionScrollBottom = editor.getBottomForLineNumber(this._visiblePosition.lineNumber);
                editor.setScrollTop(visiblePositionScrollBottom - (this._visiblePositionScrollDelta + editor.getLayoutInfo().height));
            }
        }
    }
    exports.StableEditorBottomScrollState = StableEditorBottomScrollState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhYmxlRWRpdG9yU2Nyb2xsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvc3RhYmxlRWRpdG9yU2Nyb2xsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLHVCQUF1QjtRQUU1QixNQUFNLENBQUMsT0FBTyxDQUFDLE1BQW1CO1lBQ3hDLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMseUJBQXlCLEVBQUUsRUFBRSxDQUFDO2dCQUN2RSxtSEFBbUg7Z0JBQ25ILE9BQU8sSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRyxDQUFDO1lBRUQsSUFBSSxlQUFlLEdBQW9CLElBQUksQ0FBQztZQUM1QyxJQUFJLDBCQUEwQixHQUFHLENBQUMsQ0FBQztZQUNuQyxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNoRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLGVBQWUsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEQsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlHLDBCQUEwQixHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsR0FBRyx3QkFBd0IsQ0FBQztZQUMvRSxDQUFDO1lBQ0QsT0FBTyxJQUFJLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxZQUFZ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