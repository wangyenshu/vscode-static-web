/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, arrays, strings, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewRulerDecorationsGroup = exports.ViewModelDecoration = exports.SingleLineInlineDecoration = exports.InlineDecoration = exports.InlineDecorationType = exports.ViewLineRenderingData = exports.ViewLineData = exports.MinimapLinesRenderingData = exports.Viewport = void 0;
    class Viewport {
        constructor(top, left, width, height) {
            this._viewportBrand = undefined;
            this.top = top | 0;
            this.left = left | 0;
            this.width = width | 0;
            this.height = height | 0;
        }
    }
    exports.Viewport = Viewport;
    class MinimapLinesRenderingData {
        constructor(tabSize, data) {
            this.tabSize = tabSize;
            this.data = data;
        }
    }
    exports.MinimapLinesRenderingData = MinimapLinesRenderingData;
    class ViewLineData {
        constructor(content, continuesWithWrappedLine, minColumn, maxColumn, startVisibleColumn, tokens, inlineDecorations) {
            this._viewLineDataBrand = undefined;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.startVisibleColumn = startVisibleColumn;
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
        }
    }
    exports.ViewLineData = ViewLineData;
    class ViewLineRenderingData {
        constructor(minColumn, maxColumn, content, continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, tokens, inlineDecorations, tabSize, startVisibleColumn) {
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.isBasicASCII = ViewLineRenderingData.isBasicASCII(content, mightContainNonBasicASCII);
            this.containsRTL = ViewLineRenderingData.containsRTL(content, this.isBasicASCII, mightContainRTL);
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
        }
        static isBasicASCII(lineContent, mightContainNonBasicASCII) {
            if (mightContainNonBasicASCII) {
                return strings.isBasicASCII(lineContent);
            }
            return true;
        }
        static containsRTL(lineContent, isBasicASCII, mightContainRTL) {
            if (!isBasicASCII && mightContainRTL) {
                return strings.containsRTL(lineContent);
            }
            return false;
        }
    }
    exports.ViewLineRenderingData = ViewLineRenderingData;
    var InlineDecorationType;
    (function (InlineDecorationType) {
        InlineDecorationType[InlineDecorationType["Regular"] = 0] = "Regular";
        InlineDecorationType[InlineDecorationType["Before"] = 1] = "Before";
        InlineDecorationType[InlineDecorationType["After"] = 2] = "After";
        InlineDecorationType[InlineDecorationType["RegularAffectingLetterSpacing"] = 3] = "RegularAffectingLetterSpacing";
    })(InlineDecorationType || (exports.InlineDecorationType = InlineDecorationType = {}));
    class InlineDecoration {
        constructor(range, inlineClassName, type) {
            this.range = range;
            this.inlineClassName = inlineClassName;
            this.type = type;
        }
    }
    exports.InlineDecoration = InlineDecoration;
    class SingleLineInlineDecoration {
        constructor(startOffset, endOffset, inlineClassName, inlineClassNameAffectsLetterSpacing) {
            this.startOffset = startOffset;
            this.endOffset = endOffset;
            this.inlineClassName = inlineClassName;
            this.inlineClassNameAffectsLetterSpacing = inlineClassNameAffectsLetterSpacing;
        }
        toInlineDecoration(lineNumber) {
            return new InlineDecoration(new range_1.Range(lineNumber, this.startOffset + 1, lineNumber, this.endOffset + 1), this.inlineClassName, this.inlineClassNameAffectsLetterSpacing ? 3 /* InlineDecorationType.RegularAffectingLetterSpacing */ : 0 /* InlineDecorationType.Regular */);
        }
    }
    exports.SingleLineInlineDecoration = SingleLineInlineDecoration;
    class ViewModelDecoration {
        constructor(range, options) {
            this._viewModelDecorationBrand = undefined;
            this.range = range;
            this.options = options;
        }
    }
    exports.ViewModelDecoration = ViewModelDecoration;
    class OverviewRulerDecorationsGroup {
        constructor(color, zIndex, 
        /**
         * Decorations are encoded in a number array using the following scheme:
         *  - 3*i = lane
         *  - 3*i+1 = startLineNumber
         *  - 3*i+2 = endLineNumber
         */
        data) {
            this.color = color;
            this.zIndex = zIndex;
            this.data = data;
        }
        static compareByRenderingProps(a, b) {
            if (a.zIndex === b.zIndex) {
                if (a.color < b.color) {
                    return -1;
                }
                if (a.color > b.color) {
                    return 1;
                }
                return 0;
            }
            return a.zIndex - b.zIndex;
        }
        static equals(a, b) {
            return (a.color === b.color
                && a.zIndex === b.zIndex
                && arrays.equals(a.data, b.data));
        }
        static equalsArr(a, b) {
            return arrays.equals(a, b, OverviewRulerDecorationsGroup.equals);
        }
    }
    exports.OverviewRulerDecorationsGroup = OverviewRulerDecorationsGroup;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcU1oRyxNQUFhLFFBQVE7UUFRcEIsWUFBWSxHQUFXLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxNQUFjO1lBUDNELG1CQUFjLEdBQVMsU0FBUyxDQUFDO1lBUXpDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMxQixDQUFDO0tBQ0Q7SUFkRCw0QkFjQztJQXdCRCxNQUFhLHlCQUF5QjtRQUlyQyxZQUNDLE9BQWUsRUFDZixJQUFnQztZQUVoQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFYRCw4REFXQztJQUVELE1BQWEsWUFBWTtRQWlDeEIsWUFDQyxPQUFlLEVBQ2Ysd0JBQWlDLEVBQ2pDLFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLGtCQUEwQixFQUMxQixNQUF1QixFQUN2QixpQkFBK0Q7WUF2Q2hFLHVCQUFrQixHQUFTLFNBQVMsQ0FBQztZQXlDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLHdCQUF3QixDQUFDO1lBQ3pELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztZQUM3QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7UUFDNUMsQ0FBQztLQUNEO0lBbERELG9DQWtEQztJQUVELE1BQWEscUJBQXFCO1FBMENqQyxZQUNDLFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLE9BQWUsRUFDZix3QkFBaUMsRUFDakMsZUFBd0IsRUFDeEIseUJBQWtDLEVBQ2xDLE1BQXVCLEVBQ3ZCLGlCQUFxQyxFQUNyQyxPQUFlLEVBQ2Ysa0JBQTBCO1lBRTFCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx3QkFBd0IsQ0FBQztZQUV6RCxJQUFJLENBQUMsWUFBWSxHQUFHLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUseUJBQXlCLENBQUMsQ0FBQztZQUMzRixJQUFJLENBQUMsV0FBVyxHQUFHLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztZQUVsRyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7WUFDM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO1FBQzlDLENBQUM7UUFFTSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQW1CLEVBQUUseUJBQWtDO1lBQ2pGLElBQUkseUJBQXlCLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQW1CLEVBQUUsWUFBcUIsRUFBRSxlQUF3QjtZQUM3RixJQUFJLENBQUMsWUFBWSxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNEO0lBakZELHNEQWlGQztJQUVELElBQWtCLG9CQUtqQjtJQUxELFdBQWtCLG9CQUFvQjtRQUNyQyxxRUFBVyxDQUFBO1FBQ1gsbUVBQVUsQ0FBQTtRQUNWLGlFQUFTLENBQUE7UUFDVCxpSEFBaUMsQ0FBQTtJQUNsQyxDQUFDLEVBTGlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBS3JDO0lBRUQsTUFBYSxnQkFBZ0I7UUFDNUIsWUFDaUIsS0FBWSxFQUNaLGVBQXVCLEVBQ3ZCLElBQTBCO1lBRjFCLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixvQkFBZSxHQUFmLGVBQWUsQ0FBUTtZQUN2QixTQUFJLEdBQUosSUFBSSxDQUFzQjtRQUUzQyxDQUFDO0tBQ0Q7SUFQRCw0Q0FPQztJQUVELE1BQWEsMEJBQTBCO1FBQ3RDLFlBQ2lCLFdBQW1CLEVBQ25CLFNBQWlCLEVBQ2pCLGVBQXVCLEVBQ3ZCLG1DQUE0QztZQUg1QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ3ZCLHdDQUFtQyxHQUFuQyxtQ0FBbUMsQ0FBUztRQUU3RCxDQUFDO1FBRUQsa0JBQWtCLENBQUMsVUFBa0I7WUFDcEMsT0FBTyxJQUFJLGdCQUFnQixDQUMxQixJQUFJLGFBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQzNFLElBQUksQ0FBQyxlQUFlLEVBQ3BCLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLDREQUFvRCxDQUFDLHFDQUE2QixDQUM1SCxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBaEJELGdFQWdCQztJQUVELE1BQWEsbUJBQW1CO1FBTS9CLFlBQVksS0FBWSxFQUFFLE9BQWdDO1lBTDFELDhCQUF5QixHQUFTLFNBQVMsQ0FBQztZQU0zQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUFWRCxrREFVQztJQUVELE1BQWEsNkJBQTZCO1FBRXpDLFlBQ2lCLEtBQWEsRUFDYixNQUFjO1FBQzlCOzs7OztXQUtHO1FBQ2EsSUFBYztZQVJkLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixXQUFNLEdBQU4sTUFBTSxDQUFRO1lBT2QsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUMzQixDQUFDO1FBRUUsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQWdDLEVBQUUsQ0FBZ0M7WUFDdkcsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDO2dCQUNELElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sQ0FBQyxDQUFDO2dCQUNWLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBZ0MsRUFBRSxDQUFnQztZQUN0RixPQUFPLENBQ04sQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsS0FBSzttQkFDaEIsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsTUFBTTttQkFDckIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDaEMsQ0FBQztRQUNILENBQUM7UUFFTSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQWtDLEVBQUUsQ0FBa0M7WUFDN0YsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsNkJBQTZCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNEO0lBdENELHNFQXNDQyJ9