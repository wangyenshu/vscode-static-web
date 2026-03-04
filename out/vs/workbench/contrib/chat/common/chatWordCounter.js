/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNWords = getNWords;
    exports.countWords = countWords;
    const wordSeparatorCharPattern = /[\s\|\-]/;
    function getNWords(str, numWordsToCount) {
        let wordCount = numWordsToCount;
        let i = 0;
        while (i < str.length && wordCount > 0) {
            // Consume word separator chars
            while (i < str.length && str[i].match(wordSeparatorCharPattern)) {
                i++;
            }
            // Consume word chars
            while (i < str.length && !str[i].match(wordSeparatorCharPattern)) {
                i++;
            }
            wordCount--;
        }
        const value = str.substring(0, i);
        return {
            value,
            actualWordCount: numWordsToCount - wordCount,
            isFullString: i >= str.length
        };
    }
    function countWords(str) {
        const result = getNWords(str, Number.MAX_SAFE_INTEGER);
        return result.actualWordCount;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFdvcmRDb3VudGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY2hhdFdvcmRDb3VudGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLDhCQXVCQztJQUVELGdDQUdDO0lBcENELE1BQU0sd0JBQXdCLEdBQUcsVUFBVSxDQUFDO0lBUTVDLFNBQWdCLFNBQVMsQ0FBQyxHQUFXLEVBQUUsZUFBdUI7UUFDN0QsSUFBSSxTQUFTLEdBQUcsZUFBZSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3hDLCtCQUErQjtZQUMvQixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDO2dCQUNqRSxDQUFDLEVBQUUsQ0FBQztZQUNMLENBQUM7WUFFRCxxQkFBcUI7WUFDckIsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDO2dCQUNsRSxDQUFDLEVBQUUsQ0FBQztZQUNMLENBQUM7WUFFRCxTQUFTLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxPQUFPO1lBQ04sS0FBSztZQUNMLGVBQWUsRUFBRSxlQUFlLEdBQUcsU0FBUztZQUM1QyxZQUFZLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNO1NBQzdCLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0IsVUFBVSxDQUFDLEdBQVc7UUFDckMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN2RCxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQUM7SUFDL0IsQ0FBQyJ9