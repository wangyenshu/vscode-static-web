/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScopedLineTokens = void 0;
    exports.createScopedLineTokens = createScopedLineTokens;
    exports.ignoreBracketsInToken = ignoreBracketsInToken;
    function createScopedLineTokens(context, offset) {
        const tokenCount = context.getCount();
        const tokenIndex = context.findTokenIndexAtOffset(offset);
        const desiredLanguageId = context.getLanguageId(tokenIndex);
        let lastTokenIndex = tokenIndex;
        while (lastTokenIndex + 1 < tokenCount && context.getLanguageId(lastTokenIndex + 1) === desiredLanguageId) {
            lastTokenIndex++;
        }
        let firstTokenIndex = tokenIndex;
        while (firstTokenIndex > 0 && context.getLanguageId(firstTokenIndex - 1) === desiredLanguageId) {
            firstTokenIndex--;
        }
        return new ScopedLineTokens(context, desiredLanguageId, firstTokenIndex, lastTokenIndex + 1, context.getStartOffset(firstTokenIndex), context.getEndOffset(lastTokenIndex));
    }
    class ScopedLineTokens {
        constructor(actual, languageId, firstTokenIndex, lastTokenIndex, firstCharOffset, lastCharOffset) {
            this._scopedLineTokensBrand = undefined;
            this._actual = actual;
            this.languageId = languageId;
            this._firstTokenIndex = firstTokenIndex;
            this._lastTokenIndex = lastTokenIndex;
            this.firstCharOffset = firstCharOffset;
            this._lastCharOffset = lastCharOffset;
        }
        getLineContent() {
            const actualLineContent = this._actual.getLineContent();
            return actualLineContent.substring(this.firstCharOffset, this._lastCharOffset);
        }
        getActualLineContentBefore(offset) {
            const actualLineContent = this._actual.getLineContent();
            return actualLineContent.substring(0, this.firstCharOffset + offset);
        }
        getTokenCount() {
            return this._lastTokenIndex - this._firstTokenIndex;
        }
        findTokenIndexAtOffset(offset) {
            return this._actual.findTokenIndexAtOffset(offset + this.firstCharOffset) - this._firstTokenIndex;
        }
        getStandardTokenType(tokenIndex) {
            return this._actual.getStandardTokenType(tokenIndex + this._firstTokenIndex);
        }
    }
    exports.ScopedLineTokens = ScopedLineTokens;
    var IgnoreBracketsInTokens;
    (function (IgnoreBracketsInTokens) {
        IgnoreBracketsInTokens[IgnoreBracketsInTokens["value"] = 3] = "value";
    })(IgnoreBracketsInTokens || (IgnoreBracketsInTokens = {}));
    function ignoreBracketsInToken(standardTokenType) {
        return (standardTokenType & 3 /* IgnoreBracketsInTokens.value */) !== 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcG9ydHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9zdXBwb3J0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsd0RBdUJDO0lBdURELHNEQUVDO0lBaEZELFNBQWdCLHNCQUFzQixDQUFDLE9BQW1CLEVBQUUsTUFBYztRQUN6RSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFELE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU1RCxJQUFJLGNBQWMsR0FBRyxVQUFVLENBQUM7UUFDaEMsT0FBTyxjQUFjLEdBQUcsQ0FBQyxHQUFHLFVBQVUsSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsS0FBSyxpQkFBaUIsRUFBRSxDQUFDO1lBQzNHLGNBQWMsRUFBRSxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLGVBQWUsR0FBRyxVQUFVLENBQUM7UUFDakMsT0FBTyxlQUFlLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxLQUFLLGlCQUFpQixFQUFFLENBQUM7WUFDaEcsZUFBZSxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUVELE9BQU8sSUFBSSxnQkFBZ0IsQ0FDMUIsT0FBTyxFQUNQLGlCQUFpQixFQUNqQixlQUFlLEVBQ2YsY0FBYyxHQUFHLENBQUMsRUFDbEIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsRUFDdkMsT0FBTyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FDcEMsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFhLGdCQUFnQjtRQVU1QixZQUNDLE1BQWtCLEVBQ2xCLFVBQWtCLEVBQ2xCLGVBQXVCLEVBQ3ZCLGNBQXNCLEVBQ3RCLGVBQXVCLEVBQ3ZCLGNBQXNCO1lBZnZCLDJCQUFzQixHQUFTLFNBQVMsQ0FBQztZQWlCeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztRQUN2QyxDQUFDO1FBRU0sY0FBYztZQUNwQixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEQsT0FBTyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVNLDBCQUEwQixDQUFDLE1BQWM7WUFDL0MsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3hELE9BQU8saUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFTSxhQUFhO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDckQsQ0FBQztRQUVNLHNCQUFzQixDQUFDLE1BQWM7WUFDM0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQ25HLENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxVQUFrQjtZQUM3QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzlFLENBQUM7S0FDRDtJQS9DRCw0Q0ErQ0M7SUFFRCxJQUFXLHNCQUVWO0lBRkQsV0FBVyxzQkFBc0I7UUFDaEMscUVBQXNGLENBQUE7SUFDdkYsQ0FBQyxFQUZVLHNCQUFzQixLQUF0QixzQkFBc0IsUUFFaEM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxpQkFBb0M7UUFDekUsT0FBTyxDQUFDLGlCQUFpQix1Q0FBK0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRSxDQUFDIn0=