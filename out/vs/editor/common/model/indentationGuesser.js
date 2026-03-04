/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.guessIndentation = guessIndentation;
    class SpacesDiffResult {
        constructor() {
            this.spacesDiff = 0;
            this.looksLikeAlignment = false;
        }
    }
    /**
     * Compute the diff in spaces between two line's indentation.
     */
    function spacesDiff(a, aLength, b, bLength, result) {
        result.spacesDiff = 0;
        result.looksLikeAlignment = false;
        // This can go both ways (e.g.):
        //  - a: "\t"
        //  - b: "\t    "
        //  => This should count 1 tab and 4 spaces
        let i;
        for (i = 0; i < aLength && i < bLength; i++) {
            const aCharCode = a.charCodeAt(i);
            const bCharCode = b.charCodeAt(i);
            if (aCharCode !== bCharCode) {
                break;
            }
        }
        let aSpacesCnt = 0, aTabsCount = 0;
        for (let j = i; j < aLength; j++) {
            const aCharCode = a.charCodeAt(j);
            if (aCharCode === 32 /* CharCode.Space */) {
                aSpacesCnt++;
            }
            else {
                aTabsCount++;
            }
        }
        let bSpacesCnt = 0, bTabsCount = 0;
        for (let j = i; j < bLength; j++) {
            const bCharCode = b.charCodeAt(j);
            if (bCharCode === 32 /* CharCode.Space */) {
                bSpacesCnt++;
            }
            else {
                bTabsCount++;
            }
        }
        if (aSpacesCnt > 0 && aTabsCount > 0) {
            return;
        }
        if (bSpacesCnt > 0 && bTabsCount > 0) {
            return;
        }
        const tabsDiff = Math.abs(aTabsCount - bTabsCount);
        const spacesDiff = Math.abs(aSpacesCnt - bSpacesCnt);
        if (tabsDiff === 0) {
            // check if the indentation difference might be caused by alignment reasons
            // sometime folks like to align their code, but this should not be used as a hint
            result.spacesDiff = spacesDiff;
            if (spacesDiff > 0 && 0 <= bSpacesCnt - 1 && bSpacesCnt - 1 < a.length && bSpacesCnt < b.length) {
                if (b.charCodeAt(bSpacesCnt) !== 32 /* CharCode.Space */ && a.charCodeAt(bSpacesCnt - 1) === 32 /* CharCode.Space */) {
                    if (a.charCodeAt(a.length - 1) === 44 /* CharCode.Comma */) {
                        // This looks like an alignment desire: e.g.
                        // const a = b + c,
                        //       d = b - c;
                        result.looksLikeAlignment = true;
                    }
                }
            }
            return;
        }
        if (spacesDiff % tabsDiff === 0) {
            result.spacesDiff = spacesDiff / tabsDiff;
            return;
        }
    }
    function guessIndentation(source, defaultTabSize, defaultInsertSpaces) {
        // Look at most at the first 10k lines
        const linesCount = Math.min(source.getLineCount(), 10000);
        let linesIndentedWithTabsCount = 0; // number of lines that contain at least one tab in indentation
        let linesIndentedWithSpacesCount = 0; // number of lines that contain only spaces in indentation
        let previousLineText = ''; // content of latest line that contained non-whitespace chars
        let previousLineIndentation = 0; // index at which latest line contained the first non-whitespace char
        const ALLOWED_TAB_SIZE_GUESSES = [2, 4, 6, 8, 3, 5, 7]; // prefer even guesses for `tabSize`, limit to [2, 8].
        const MAX_ALLOWED_TAB_SIZE_GUESS = 8; // max(ALLOWED_TAB_SIZE_GUESSES) = 8
        const spacesDiffCount = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // `tabSize` scores
        const tmp = new SpacesDiffResult();
        for (let lineNumber = 1; lineNumber <= linesCount; lineNumber++) {
            const currentLineLength = source.getLineLength(lineNumber);
            const currentLineText = source.getLineContent(lineNumber);
            // if the text buffer is chunk based, so long lines are cons-string, v8 will flattern the string when we check charCode.
            // checking charCode on chunks directly is cheaper.
            const useCurrentLineText = (currentLineLength <= 65536);
            let currentLineHasContent = false; // does `currentLineText` contain non-whitespace chars
            let currentLineIndentation = 0; // index at which `currentLineText` contains the first non-whitespace char
            let currentLineSpacesCount = 0; // count of spaces found in `currentLineText` indentation
            let currentLineTabsCount = 0; // count of tabs found in `currentLineText` indentation
            for (let j = 0, lenJ = currentLineLength; j < lenJ; j++) {
                const charCode = (useCurrentLineText ? currentLineText.charCodeAt(j) : source.getLineCharCode(lineNumber, j));
                if (charCode === 9 /* CharCode.Tab */) {
                    currentLineTabsCount++;
                }
                else if (charCode === 32 /* CharCode.Space */) {
                    currentLineSpacesCount++;
                }
                else {
                    // Hit non whitespace character on this line
                    currentLineHasContent = true;
                    currentLineIndentation = j;
                    break;
                }
            }
            // Ignore empty or only whitespace lines
            if (!currentLineHasContent) {
                continue;
            }
            if (currentLineTabsCount > 0) {
                linesIndentedWithTabsCount++;
            }
            else if (currentLineSpacesCount > 1) {
                linesIndentedWithSpacesCount++;
            }
            spacesDiff(previousLineText, previousLineIndentation, currentLineText, currentLineIndentation, tmp);
            if (tmp.looksLikeAlignment) {
                // if defaultInsertSpaces === true && the spaces count == tabSize, we may want to count it as valid indentation
                //
                // - item1
                //   - item2
                //
                // otherwise skip this line entirely
                //
                // const a = 1,
                //       b = 2;
                if (!(defaultInsertSpaces && defaultTabSize === tmp.spacesDiff)) {
                    continue;
                }
            }
            const currentSpacesDiff = tmp.spacesDiff;
            if (currentSpacesDiff <= MAX_ALLOWED_TAB_SIZE_GUESS) {
                spacesDiffCount[currentSpacesDiff]++;
            }
            previousLineText = currentLineText;
            previousLineIndentation = currentLineIndentation;
        }
        let insertSpaces = defaultInsertSpaces;
        if (linesIndentedWithTabsCount !== linesIndentedWithSpacesCount) {
            insertSpaces = (linesIndentedWithTabsCount < linesIndentedWithSpacesCount);
        }
        let tabSize = defaultTabSize;
        // Guess tabSize only if inserting spaces...
        if (insertSpaces) {
            let tabSizeScore = (insertSpaces ? 0 : 0.1 * linesCount);
            // console.log("score threshold: " + tabSizeScore);
            ALLOWED_TAB_SIZE_GUESSES.forEach((possibleTabSize) => {
                const possibleTabSizeScore = spacesDiffCount[possibleTabSize];
                if (possibleTabSizeScore > tabSizeScore) {
                    tabSizeScore = possibleTabSizeScore;
                    tabSize = possibleTabSize;
                }
            });
            // Let a tabSize of 2 win even if it is not the maximum
            // (only in case 4 was guessed)
            if (tabSize === 4 && spacesDiffCount[4] > 0 && spacesDiffCount[2] > 0 && spacesDiffCount[2] >= spacesDiffCount[4] / 2) {
                tabSize = 2;
            }
        }
        // console.log('--------------------------');
        // console.log('linesIndentedWithTabsCount: ' + linesIndentedWithTabsCount + ', linesIndentedWithSpacesCount: ' + linesIndentedWithSpacesCount);
        // console.log('spacesDiffCount: ' + spacesDiffCount);
        // console.log('tabSize: ' + tabSize + ', tabSizeScore: ' + tabSizeScore);
        return {
            insertSpaces: insertSpaces,
            tabSize: tabSize
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb25HdWVzc2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9pbmRlbnRhdGlvbkd1ZXNzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxR2hHLDRDQXVIQztJQXZORCxNQUFNLGdCQUFnQjtRQUF0QjtZQUNRLGVBQVUsR0FBVyxDQUFDLENBQUM7WUFDdkIsdUJBQWtCLEdBQVksS0FBSyxDQUFDO1FBQzVDLENBQUM7S0FBQTtJQUVEOztPQUVHO0lBQ0gsU0FBUyxVQUFVLENBQUMsQ0FBUyxFQUFFLE9BQWUsRUFBRSxDQUFTLEVBQUUsT0FBZSxFQUFFLE1BQXdCO1FBRW5HLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7UUFFbEMsZ0NBQWdDO1FBQ2hDLGFBQWE7UUFDYixpQkFBaUI7UUFDakIsMkNBQTJDO1FBRTNDLElBQUksQ0FBUyxDQUFDO1FBRWQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLElBQUksQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzdDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVsQyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsTUFBTTtZQUNQLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDbkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxTQUFTLDRCQUFtQixFQUFFLENBQUM7Z0JBQ2xDLFVBQVUsRUFBRSxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFVBQVUsRUFBRSxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDbEMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLFNBQVMsNEJBQW1CLEVBQUUsQ0FBQztnQkFDbEMsVUFBVSxFQUFFLENBQUM7WUFDZCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVSxFQUFFLENBQUM7WUFDZCxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdEMsT0FBTztRQUNSLENBQUM7UUFDRCxJQUFJLFVBQVUsR0FBRyxDQUFDLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3RDLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUM7UUFDbkQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUM7UUFFckQsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDcEIsMkVBQTJFO1lBQzNFLGlGQUFpRjtZQUNqRixNQUFNLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUUvQixJQUFJLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLElBQUksVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pHLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsNEJBQW1CLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLDRCQUFtQixFQUFFLENBQUM7b0JBQ3BHLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyw0QkFBbUIsRUFBRSxDQUFDO3dCQUNuRCw0Q0FBNEM7d0JBQzVDLG1CQUFtQjt3QkFDbkIsbUJBQW1CO3dCQUNuQixNQUFNLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO29CQUNsQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTztRQUNSLENBQUM7UUFDRCxJQUFJLFVBQVUsR0FBRyxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDakMsTUFBTSxDQUFDLFVBQVUsR0FBRyxVQUFVLEdBQUcsUUFBUSxDQUFDO1lBQzFDLE9BQU87UUFDUixDQUFDO0lBQ0YsQ0FBQztJQWdCRCxTQUFnQixnQkFBZ0IsQ0FBQyxNQUFtQixFQUFFLGNBQXNCLEVBQUUsbUJBQTRCO1FBQ3pHLHNDQUFzQztRQUN0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUxRCxJQUFJLDBCQUEwQixHQUFHLENBQUMsQ0FBQyxDQUFJLCtEQUErRDtRQUN0RyxJQUFJLDRCQUE0QixHQUFHLENBQUMsQ0FBQyxDQUFHLDBEQUEwRDtRQUVsRyxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQyxDQUFNLDZEQUE2RDtRQUM3RixJQUFJLHVCQUF1QixHQUFHLENBQUMsQ0FBQyxDQUFJLHFFQUFxRTtRQUV6RyxNQUFNLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzREFBc0Q7UUFDOUcsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLENBQUMsQ0FBRyxvQ0FBb0M7UUFFNUUsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsbUJBQW1CO1FBQ3pFLE1BQU0sR0FBRyxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztRQUVuQyxLQUFLLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxVQUFVLElBQUksVUFBVSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDakUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFMUQsd0hBQXdIO1lBQ3hILG1EQUFtRDtZQUNuRCxNQUFNLGtCQUFrQixHQUFHLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDLENBQUM7WUFFeEQsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUMsQ0FBRyxzREFBc0Q7WUFDM0YsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBSSwwRUFBMEU7WUFDN0csSUFBSSxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBSSx5REFBeUQ7WUFDNUYsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsQ0FBSSx1REFBdUQ7WUFDeEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLGlCQUFpQixFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFOUcsSUFBSSxRQUFRLHlCQUFpQixFQUFFLENBQUM7b0JBQy9CLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3hCLENBQUM7cUJBQU0sSUFBSSxRQUFRLDRCQUFtQixFQUFFLENBQUM7b0JBQ3hDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzFCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCw0Q0FBNEM7b0JBQzVDLHFCQUFxQixHQUFHLElBQUksQ0FBQztvQkFDN0Isc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO29CQUMzQixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM1QixTQUFTO1lBQ1YsQ0FBQztZQUVELElBQUksb0JBQW9CLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLDBCQUEwQixFQUFFLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxJQUFJLHNCQUFzQixHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN2Qyw0QkFBNEIsRUFBRSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsdUJBQXVCLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXBHLElBQUksR0FBRyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzVCLCtHQUErRztnQkFDL0csRUFBRTtnQkFDRixVQUFVO2dCQUNWLFlBQVk7Z0JBQ1osRUFBRTtnQkFDRixvQ0FBb0M7Z0JBQ3BDLEVBQUU7Z0JBQ0YsZUFBZTtnQkFDZixlQUFlO2dCQUVmLElBQUksQ0FBQyxDQUFDLG1CQUFtQixJQUFJLGNBQWMsS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztvQkFDakUsU0FBUztnQkFDVixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQztZQUN6QyxJQUFJLGlCQUFpQixJQUFJLDBCQUEwQixFQUFFLENBQUM7Z0JBQ3JELGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUVELGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUNuQyx1QkFBdUIsR0FBRyxzQkFBc0IsQ0FBQztRQUNsRCxDQUFDO1FBRUQsSUFBSSxZQUFZLEdBQUcsbUJBQW1CLENBQUM7UUFDdkMsSUFBSSwwQkFBMEIsS0FBSyw0QkFBNEIsRUFBRSxDQUFDO1lBQ2pFLFlBQVksR0FBRyxDQUFDLDBCQUEwQixHQUFHLDRCQUE0QixDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVELElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQztRQUU3Qiw0Q0FBNEM7UUFDNUMsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNsQixJQUFJLFlBQVksR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFFekQsbURBQW1EO1lBRW5ELHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsRUFBRSxFQUFFO2dCQUNwRCxNQUFNLG9CQUFvQixHQUFHLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxvQkFBb0IsR0FBRyxZQUFZLEVBQUUsQ0FBQztvQkFDekMsWUFBWSxHQUFHLG9CQUFvQixDQUFDO29CQUNwQyxPQUFPLEdBQUcsZUFBZSxDQUFDO2dCQUMzQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCx1REFBdUQ7WUFDdkQsK0JBQStCO1lBQy9CLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdkgsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBR0QsNkNBQTZDO1FBQzdDLGdKQUFnSjtRQUNoSixzREFBc0Q7UUFDdEQsMEVBQTBFO1FBRTFFLE9BQU87WUFDTixZQUFZLEVBQUUsWUFBWTtZQUMxQixPQUFPLEVBQUUsT0FBTztTQUNoQixDQUFDO0lBQ0gsQ0FBQyJ9