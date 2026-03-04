/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chunkInput = chunkInput;
    var Constants;
    (function (Constants) {
        /**
         * Writing large amounts of data can be corrupted for some reason, after looking into this is
         * appears to be a race condition around writing to the FD which may be based on how powerful
         * the hardware is. The workaround for this is to space out when large amounts of data is being
         * written to the terminal. See https://github.com/microsoft/vscode/issues/38137
         */
        Constants[Constants["WriteMaxChunkSize"] = 50] = "WriteMaxChunkSize";
    })(Constants || (Constants = {}));
    /**
     * Splits incoming pty data into chunks to try prevent data corruption that could occur when pasting
     * large amounts of data.
     */
    function chunkInput(data) {
        const chunks = [];
        let nextChunkStartIndex = 0;
        for (let i = 0; i < data.length - 1; i++) {
            if (
            // If the max chunk size is reached
            i - nextChunkStartIndex + 1 >= 50 /* Constants.WriteMaxChunkSize */ ||
                // If the next character is ESC, send the pending data to avoid splitting the escape
                // sequence.
                data[i + 1] === '\x1b') {
                chunks.push(data.substring(nextChunkStartIndex, i + 1));
                nextChunkStartIndex = i + 1;
                // Skip the next character as the chunk would be a single character
                i++;
            }
        }
        // Push final chunk
        if (nextChunkStartIndex !== data.length) {
            chunks.push(data.substring(nextChunkStartIndex));
        }
        return chunks;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsUHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlGaEcsZ0NBc0JDO0lBcENELElBQVcsU0FRVjtJQVJELFdBQVcsU0FBUztRQUNuQjs7Ozs7V0FLRztRQUNILG9FQUFzQixDQUFBO0lBQ3ZCLENBQUMsRUFSVSxTQUFTLEtBQVQsU0FBUyxRQVFuQjtJQUVEOzs7T0FHRztJQUNILFNBQWdCLFVBQVUsQ0FBQyxJQUFZO1FBQ3RDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztRQUM1QixJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQztRQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMxQztZQUNDLG1DQUFtQztZQUNuQyxDQUFDLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyx3Q0FBK0I7Z0JBQzFELG9GQUFvRjtnQkFDcEYsWUFBWTtnQkFDWixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLE1BQU0sRUFDckIsQ0FBQztnQkFDRixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELG1CQUFtQixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLG1FQUFtRTtnQkFDbkUsQ0FBQyxFQUFFLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztRQUNELG1CQUFtQjtRQUNuQixJQUFJLG1CQUFtQixLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMifQ==