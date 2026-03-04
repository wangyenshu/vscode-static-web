/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/tokens/lineTokens", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize"], function (require, exports, strings, lineTokens_1, languages_1, nullTokenize_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenizeToStringSync = tokenizeToStringSync;
    exports.tokenizeToString = tokenizeToString;
    exports.tokenizeLineToHTML = tokenizeLineToHTML;
    exports._tokenizeToString = _tokenizeToString;
    const fallback = {
        getInitialState: () => nullTokenize_1.NullState,
        tokenizeEncoded: (buffer, hasEOL, state) => (0, nullTokenize_1.nullTokenizeEncoded)(0 /* LanguageId.Null */, state)
    };
    function tokenizeToStringSync(languageService, text, languageId) {
        return _tokenizeToString(text, languageService.languageIdCodec, languages_1.TokenizationRegistry.get(languageId) || fallback);
    }
    async function tokenizeToString(languageService, text, languageId) {
        if (!languageId) {
            return _tokenizeToString(text, languageService.languageIdCodec, fallback);
        }
        const tokenizationSupport = await languages_1.TokenizationRegistry.getOrCreate(languageId);
        return _tokenizeToString(text, languageService.languageIdCodec, tokenizationSupport || fallback);
    }
    function tokenizeLineToHTML(text, viewLineTokens, colorMap, startOffset, endOffset, tabSize, useNbsp) {
        let result = `<div>`;
        let charIndex = startOffset;
        let tabsCharDelta = 0;
        let prevIsSpace = true;
        for (let tokenIndex = 0, tokenCount = viewLineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
            const tokenEndIndex = viewLineTokens.getEndOffset(tokenIndex);
            if (tokenEndIndex <= startOffset) {
                continue;
            }
            let partContent = '';
            for (; charIndex < tokenEndIndex && charIndex < endOffset; charIndex++) {
                const charCode = text.charCodeAt(charIndex);
                switch (charCode) {
                    case 9 /* CharCode.Tab */: {
                        let insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        while (insertSpacesCount > 0) {
                            if (useNbsp && prevIsSpace) {
                                partContent += '&#160;';
                                prevIsSpace = false;
                            }
                            else {
                                partContent += ' ';
                                prevIsSpace = true;
                            }
                            insertSpacesCount--;
                        }
                        break;
                    }
                    case 60 /* CharCode.LessThan */:
                        partContent += '&lt;';
                        prevIsSpace = false;
                        break;
                    case 62 /* CharCode.GreaterThan */:
                        partContent += '&gt;';
                        prevIsSpace = false;
                        break;
                    case 38 /* CharCode.Ampersand */:
                        partContent += '&amp;';
                        prevIsSpace = false;
                        break;
                    case 0 /* CharCode.Null */:
                        partContent += '&#00;';
                        prevIsSpace = false;
                        break;
                    case 65279 /* CharCode.UTF8_BOM */:
                    case 8232 /* CharCode.LINE_SEPARATOR */:
                    case 8233 /* CharCode.PARAGRAPH_SEPARATOR */:
                    case 133 /* CharCode.NEXT_LINE */:
                        partContent += '\ufffd';
                        prevIsSpace = false;
                        break;
                    case 13 /* CharCode.CarriageReturn */:
                        // zero width space, because carriage return would introduce a line break
                        partContent += '&#8203';
                        prevIsSpace = false;
                        break;
                    case 32 /* CharCode.Space */:
                        if (useNbsp && prevIsSpace) {
                            partContent += '&#160;';
                            prevIsSpace = false;
                        }
                        else {
                            partContent += ' ';
                            prevIsSpace = true;
                        }
                        break;
                    default:
                        partContent += String.fromCharCode(charCode);
                        prevIsSpace = false;
                }
            }
            result += `<span style="${viewLineTokens.getInlineStyle(tokenIndex, colorMap)}">${partContent}</span>`;
            if (tokenEndIndex > endOffset || charIndex >= endOffset) {
                break;
            }
        }
        result += `</div>`;
        return result;
    }
    function _tokenizeToString(text, languageIdCodec, tokenizationSupport) {
        let result = `<div class="monaco-tokenized-source">`;
        const lines = strings.splitLines(text);
        let currentState = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            if (i > 0) {
                result += `<br/>`;
            }
            const tokenizationResult = tokenizationSupport.tokenizeEncoded(line, true, currentState);
            lineTokens_1.LineTokens.convertToEndOffset(tokenizationResult.tokens, line.length);
            const lineTokens = new lineTokens_1.LineTokens(tokenizationResult.tokens, line, languageIdCodec);
            const viewLineTokens = lineTokens.inflate();
            let startOffset = 0;
            for (let j = 0, lenJ = viewLineTokens.getCount(); j < lenJ; j++) {
                const type = viewLineTokens.getClassName(j);
                const endIndex = viewLineTokens.getEndOffset(j);
                result += `<span class="${type}">${strings.escape(line.substring(startOffset, endIndex))}</span>`;
                startOffset = endIndex;
            }
            currentState = tokenizationResult.endState;
        }
        result += `</div>`;
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFRvSHRtbFRva2VuaXplci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3RleHRUb0h0bWxUb2tlbml6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLG9EQUVDO0lBRUQsNENBTUM7SUFFRCxnREE4RkM7SUFFRCw4Q0E2QkM7SUE5SUQsTUFBTSxRQUFRLEdBQWdDO1FBQzdDLGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBUztRQUNoQyxlQUFlLEVBQUUsQ0FBQyxNQUFjLEVBQUUsTUFBZSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBQSxrQ0FBbUIsMkJBQWtCLEtBQUssQ0FBQztLQUNoSCxDQUFDO0lBRUYsU0FBZ0Isb0JBQW9CLENBQUMsZUFBaUMsRUFBRSxJQUFZLEVBQUUsVUFBa0I7UUFDdkcsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLGVBQWUsRUFBRSxnQ0FBb0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7SUFDbkgsQ0FBQztJQUVNLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxlQUFpQyxFQUFFLElBQVksRUFBRSxVQUF5QjtRQUNoSCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakIsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBQ0QsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLGdDQUFvQixDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvRSxPQUFPLGlCQUFpQixDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsZUFBZSxFQUFFLG1CQUFtQixJQUFJLFFBQVEsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7SUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxJQUFZLEVBQUUsY0FBK0IsRUFBRSxRQUFrQixFQUFFLFdBQW1CLEVBQUUsU0FBaUIsRUFBRSxPQUFlLEVBQUUsT0FBZ0I7UUFDOUssSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ3JCLElBQUksU0FBUyxHQUFHLFdBQVcsQ0FBQztRQUM1QixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFFdEIsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBRXZCLEtBQUssSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsR0FBRyxjQUFjLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxHQUFHLFVBQVUsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO1lBQ3hHLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFOUQsSUFBSSxhQUFhLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2xDLFNBQVM7WUFDVixDQUFDO1lBRUQsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBRXJCLE9BQU8sU0FBUyxHQUFHLGFBQWEsSUFBSSxTQUFTLEdBQUcsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ3hFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRTVDLFFBQVEsUUFBUSxFQUFFLENBQUM7b0JBQ2xCLHlCQUFpQixDQUFDLENBQUMsQ0FBQzt3QkFDbkIsSUFBSSxpQkFBaUIsR0FBRyxPQUFPLEdBQUcsQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFDLEdBQUcsT0FBTyxDQUFDO3dCQUN4RSxhQUFhLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO3dCQUN2QyxPQUFPLGlCQUFpQixHQUFHLENBQUMsRUFBRSxDQUFDOzRCQUM5QixJQUFJLE9BQU8sSUFBSSxXQUFXLEVBQUUsQ0FBQztnQ0FDNUIsV0FBVyxJQUFJLFFBQVEsQ0FBQztnQ0FDeEIsV0FBVyxHQUFHLEtBQUssQ0FBQzs0QkFDckIsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLFdBQVcsSUFBSSxHQUFHLENBQUM7Z0NBQ25CLFdBQVcsR0FBRyxJQUFJLENBQUM7NEJBQ3BCLENBQUM7NEJBQ0QsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDckIsQ0FBQzt3QkFDRCxNQUFNO29CQUNQLENBQUM7b0JBQ0Q7d0JBQ0MsV0FBVyxJQUFJLE1BQU0sQ0FBQzt3QkFDdEIsV0FBVyxHQUFHLEtBQUssQ0FBQzt3QkFDcEIsTUFBTTtvQkFFUDt3QkFDQyxXQUFXLElBQUksTUFBTSxDQUFDO3dCQUN0QixXQUFXLEdBQUcsS0FBSyxDQUFDO3dCQUNwQixNQUFNO29CQUVQO3dCQUNDLFdBQVcsSUFBSSxPQUFPLENBQUM7d0JBQ3ZCLFdBQVcsR0FBRyxLQUFLLENBQUM7d0JBQ3BCLE1BQU07b0JBRVA7d0JBQ0MsV0FBVyxJQUFJLE9BQU8sQ0FBQzt3QkFDdkIsV0FBVyxHQUFHLEtBQUssQ0FBQzt3QkFDcEIsTUFBTTtvQkFFUCxtQ0FBdUI7b0JBQ3ZCLHdDQUE2QjtvQkFDN0IsNkNBQWtDO29CQUNsQzt3QkFDQyxXQUFXLElBQUksUUFBUSxDQUFDO3dCQUN4QixXQUFXLEdBQUcsS0FBSyxDQUFDO3dCQUNwQixNQUFNO29CQUVQO3dCQUNDLHlFQUF5RTt3QkFDekUsV0FBVyxJQUFJLFFBQVEsQ0FBQzt3QkFDeEIsV0FBVyxHQUFHLEtBQUssQ0FBQzt3QkFDcEIsTUFBTTtvQkFFUDt3QkFDQyxJQUFJLE9BQU8sSUFBSSxXQUFXLEVBQUUsQ0FBQzs0QkFDNUIsV0FBVyxJQUFJLFFBQVEsQ0FBQzs0QkFDeEIsV0FBVyxHQUFHLEtBQUssQ0FBQzt3QkFDckIsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFdBQVcsSUFBSSxHQUFHLENBQUM7NEJBQ25CLFdBQVcsR0FBRyxJQUFJLENBQUM7d0JBQ3BCLENBQUM7d0JBQ0QsTUFBTTtvQkFFUDt3QkFDQyxXQUFXLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDN0MsV0FBVyxHQUFHLEtBQUssQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLElBQUksZ0JBQWdCLGNBQWMsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxLQUFLLFdBQVcsU0FBUyxDQUFDO1lBRXZHLElBQUksYUFBYSxHQUFHLFNBQVMsSUFBSSxTQUFTLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ3pELE1BQU07WUFDUCxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sSUFBSSxRQUFRLENBQUM7UUFDbkIsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWSxFQUFFLGVBQWlDLEVBQUUsbUJBQWdEO1FBQ2xJLElBQUksTUFBTSxHQUFHLHVDQUF1QyxDQUFDO1FBQ3JELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxZQUFZLEdBQUcsbUJBQW1CLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2xELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDWCxNQUFNLElBQUksT0FBTyxDQUFDO1lBQ25CLENBQUM7WUFFRCxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3pGLHVCQUFVLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RSxNQUFNLFVBQVUsR0FBRyxJQUFJLHVCQUFVLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNwRixNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFNUMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxjQUFjLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRSxNQUFNLElBQUksR0FBRyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLElBQUksZ0JBQWdCLElBQUksS0FBSyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDbEcsV0FBVyxHQUFHLFFBQVEsQ0FBQztZQUN4QixDQUFDO1lBRUQsWUFBWSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztRQUM1QyxDQUFDO1FBRUQsTUFBTSxJQUFJLFFBQVEsQ0FBQztRQUNuQixPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMifQ==