/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/htmlContent", "vs/editor/common/model"], function (require, exports, arrays_1, htmlContent_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarginHoverComputer = void 0;
    class MarginHoverComputer {
        get lineNumber() {
            return this._lineNumber;
        }
        set lineNumber(value) {
            this._lineNumber = value;
        }
        get lane() {
            return this._laneOrLine;
        }
        set lane(value) {
            this._laneOrLine = value;
        }
        constructor(_editor) {
            this._editor = _editor;
            this._lineNumber = -1;
            this._laneOrLine = model_1.GlyphMarginLane.Center;
        }
        computeSync() {
            const toHoverMessage = (contents) => {
                return {
                    value: contents
                };
            };
            const lineDecorations = this._editor.getLineDecorations(this._lineNumber);
            const result = [];
            const isLineHover = this._laneOrLine === 'lineNo';
            if (!lineDecorations) {
                return result;
            }
            for (const d of lineDecorations) {
                const lane = d.options.glyphMargin?.position ?? model_1.GlyphMarginLane.Center;
                if (!isLineHover && lane !== this._laneOrLine) {
                    continue;
                }
                const hoverMessage = isLineHover ? d.options.lineNumberHoverMessage : d.options.glyphMarginHoverMessage;
                if (!hoverMessage || (0, htmlContent_1.isEmptyMarkdownString)(hoverMessage)) {
                    continue;
                }
                result.push(...(0, arrays_1.asArray)(hoverMessage).map(toHoverMessage));
            }
            return result;
        }
    }
    exports.MarginHoverComputer = MarginHoverComputer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyZ2luSG92ZXJDb21wdXRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvbWFyZ2luSG92ZXJDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxtQkFBbUI7UUFLL0IsSUFBVyxVQUFVO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBVyxVQUFVLENBQUMsS0FBYTtZQUNsQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFXLElBQUksQ0FBQyxLQUF1QjtZQUN0QyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMxQixDQUFDO1FBRUQsWUFDa0IsT0FBb0I7WUFBcEIsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQXBCOUIsZ0JBQVcsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUN6QixnQkFBVyxHQUFxQix1QkFBZSxDQUFDLE1BQU0sQ0FBQztRQXFCL0QsQ0FBQztRQUVNLFdBQVc7WUFFakIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUF5QixFQUFpQixFQUFFO2dCQUNuRSxPQUFPO29CQUNOLEtBQUssRUFBRSxRQUFRO2lCQUNmLENBQUM7WUFDSCxDQUFDLENBQUM7WUFFRixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUxRSxNQUFNLE1BQU0sR0FBb0IsRUFBRSxDQUFDO1lBQ25DLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssUUFBUSxDQUFDO1lBQ2xELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBRUQsS0FBSyxNQUFNLENBQUMsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxJQUFJLHVCQUFlLENBQUMsTUFBTSxDQUFDO2dCQUN2RSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQy9DLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUM7Z0JBQ3hHLElBQUksQ0FBQyxZQUFZLElBQUksSUFBQSxtQ0FBcUIsRUFBQyxZQUFZLENBQUMsRUFBRSxDQUFDO29CQUMxRCxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUEsZ0JBQU8sRUFBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUExREQsa0RBMERDIn0=