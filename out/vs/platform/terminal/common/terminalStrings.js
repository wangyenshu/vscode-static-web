/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatMessageForTerminal = formatMessageForTerminal;
    /**
     * Formats a message from the product to be written to the terminal.
     */
    function formatMessageForTerminal(message, options = {}) {
        let result = '';
        if (!options.excludeLeadingNewLine) {
            result += '\r\n';
        }
        result += '\x1b[0m\x1b[7m * ';
        if (options.loudFormatting) {
            result += '\x1b[0;104m';
        }
        else {
            result += '\x1b[0m';
        }
        result += ` ${message} \x1b[0m\n\r`;
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdHJpbmdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsU3RyaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsNERBYUM7SUFoQkQ7O09BRUc7SUFDSCxTQUFnQix3QkFBd0IsQ0FBQyxPQUFlLEVBQUUsVUFBeUMsRUFBRTtRQUNwRyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxNQUFNLENBQUM7UUFDbEIsQ0FBQztRQUNELE1BQU0sSUFBSSxtQkFBbUIsQ0FBQztRQUM5QixJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksYUFBYSxDQUFDO1FBQ3pCLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxJQUFJLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBQ0QsTUFBTSxJQUFJLElBQUksT0FBTyxjQUFjLENBQUM7UUFDcEMsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDIn0=