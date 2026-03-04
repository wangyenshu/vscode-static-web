/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/encodedTokenAttributes"], function (require, exports, encodedTokenAttributes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestLineTokenFactory = exports.TestLineTokens = exports.TestLineToken = void 0;
    /**
     * A token on a line.
     */
    class TestLineToken {
        constructor(endIndex, metadata) {
            this.endIndex = endIndex;
            this._metadata = metadata;
        }
        getForeground() {
            return encodedTokenAttributes_1.TokenMetadata.getForeground(this._metadata);
        }
        getType() {
            return encodedTokenAttributes_1.TokenMetadata.getClassNameFromMetadata(this._metadata);
        }
        getInlineStyle(colorMap) {
            return encodedTokenAttributes_1.TokenMetadata.getInlineStyleFromMetadata(this._metadata, colorMap);
        }
        getPresentation() {
            return encodedTokenAttributes_1.TokenMetadata.getPresentationFromMetadata(this._metadata);
        }
        static _equals(a, b) {
            return (a.endIndex === b.endIndex
                && a._metadata === b._metadata);
        }
        static equalsArr(a, b) {
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!this._equals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.TestLineToken = TestLineToken;
    class TestLineTokens {
        constructor(actual) {
            this._actual = actual;
        }
        equals(other) {
            if (other instanceof TestLineTokens) {
                return TestLineToken.equalsArr(this._actual, other._actual);
            }
            return false;
        }
        getCount() {
            return this._actual.length;
        }
        getForeground(tokenIndex) {
            return this._actual[tokenIndex].getForeground();
        }
        getEndOffset(tokenIndex) {
            return this._actual[tokenIndex].endIndex;
        }
        getClassName(tokenIndex) {
            return this._actual[tokenIndex].getType();
        }
        getInlineStyle(tokenIndex, colorMap) {
            return this._actual[tokenIndex].getInlineStyle(colorMap);
        }
        getPresentation(tokenIndex) {
            return this._actual[tokenIndex].getPresentation();
        }
        findTokenIndexAtOffset(offset) {
            throw new Error('Not implemented');
        }
        getLineContent() {
            throw new Error('Not implemented');
        }
        getMetadata(tokenIndex) {
            throw new Error('Method not implemented.');
        }
        getLanguageId(tokenIndex) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestLineTokens = TestLineTokens;
    class TestLineTokenFactory {
        static inflateArr(tokens) {
            const tokensCount = (tokens.length >>> 1);
            const result = new Array(tokensCount);
            for (let i = 0; i < tokensCount; i++) {
                const endOffset = tokens[i << 1];
                const metadata = tokens[(i << 1) + 1];
                result[i] = new TestLineToken(endOffset, metadata);
            }
            return result;
        }
    }
    exports.TestLineTokenFactory = TestLineTokenFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdExpbmVUb2tlbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9jb3JlL3Rlc3RMaW5lVG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHOztPQUVHO0lBQ0gsTUFBYSxhQUFhO1FBUXpCLFlBQVksUUFBZ0IsRUFBRSxRQUFnQjtZQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztZQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMzQixDQUFDO1FBRU0sYUFBYTtZQUNuQixPQUFPLHNDQUFhLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRU0sT0FBTztZQUNiLE9BQU8sc0NBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVNLGNBQWMsQ0FBQyxRQUFrQjtZQUN2QyxPQUFPLHNDQUFhLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRU0sZUFBZTtZQUNyQixPQUFPLHNDQUFhLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFTyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQWdCLEVBQUUsQ0FBZ0I7WUFDeEQsT0FBTyxDQUNOLENBQUMsQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLFFBQVE7bUJBQ3RCLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FDOUIsQ0FBQztRQUNILENBQUM7UUFFTSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQWtCLEVBQUUsQ0FBa0I7WUFDN0QsTUFBTSxJ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