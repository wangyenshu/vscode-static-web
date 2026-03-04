/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path"], function (require, exports, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertLinkRangeToBuffer = convertLinkRangeToBuffer;
    exports.convertBufferRangeToViewport = convertBufferRangeToViewport;
    exports.getXtermLineContent = getXtermLineContent;
    exports.getXtermRangesByAttr = getXtermRangesByAttr;
    exports.updateLinkWithRelativeCwd = updateLinkWithRelativeCwd;
    exports.osPathModule = osPathModule;
    /**
     * Converts a possibly wrapped link's range (comprised of string indices) into a buffer range that plays nicely with xterm.js
     *
     * @param lines A single line (not the entire buffer)
     * @param bufferWidth The number of columns in the terminal
     * @param range The link range - string indices
     * @param startLine The absolute y position (on the buffer) of the line
     */
    function convertLinkRangeToBuffer(lines, bufferWidth, range, startLine) {
        const bufferRange = {
            start: {
                x: range.startColumn,
                y: range.startLineNumber + startLine
            },
            end: {
                x: range.endColumn - 1,
                y: range.endLineNumber + startLine
            }
        };
        // Shift start range right for each wide character before the link
        let startOffset = 0;
        const startWrappedLineCount = Math.ceil(range.startColumn / bufferWidth);
        for (let y = 0; y < Math.min(startWrappedLineCount); y++) {
            const lineLength = Math.min(bufferWidth, (range.startColumn - 1) - y * bufferWidth);
            let lineOffset = 0;
            const line = lines[y];
            // Sanity check for line, apparently this can happen but it's not clear under what
            // circumstances this happens. Continue on, skipping the remainder of start offset if this
            // happens to minimize impact.
            if (!line) {
                break;
            }
            for (let x = 0; x < Math.min(bufferWidth, lineLength + lineOffset); x++) {
                const cell = line.getCell(x);
                // This is unexpected but it means the character doesn't exist, so we shouldn't add to
                // the offset
                if (!cell) {
                    break;
                }
                const width = cell.getWidth();
                if (width === 2) {
                    lineOffset++;
                }
                const char = cell.getChars();
                if (char.length > 1) {
                    lineOffset -= char.length - 1;
                }
            }
            startOffset += lineOffset;
        }
        // Shift end range right for each wide character inside the link
        let endOffset = 0;
        const endWrappedLineCount = Math.ceil(range.endColumn / bufferWidth);
        for (let y = Math.max(0, startWrappedLineCount - 1); y < endWrappedLineCount; y++) {
            const start = (y === startWrappedLineCount - 1 ? (range.startColumn - 1 + startOffset) % bufferWidth : 0);
            const lineLength = Math.min(bufferWidth, range.endColumn + startOffset - y * bufferWidth);
            let lineOffset = 0;
            const line = lines[y];
            // Sanity check for line, apparently this can happen but it's not clear under what
            // circumstances this happens. Continue on, skipping the remainder of start offset if this
            // happens to minimize impact.
            if (!line) {
                break;
            }
            for (let x = start; x < Math.min(bufferWidth, lineLength + lineOffset); x++) {
                const cell = line.getCell(x);
                // This is unexpected but it means the character doesn't exist, so we shouldn't add to
                // the offset
                if (!cell) {
                    break;
                }
                const width = cell.getWidth();
                const chars = cell.getChars();
                // Offset for null cells following wide characters
                if (width === 2) {
                    lineOffset++;
                }
                // Offset for early wrapping when the last cell in row is a wide character
                if (x === bufferWidth - 1 && chars === '') {
                    lineOffset++;
                }
                // Offset multi-code characters like emoji
                if (chars.length > 1) {
                    lineOffset -= chars.length - 1;
                }
            }
            endOffset += lineOffset;
        }
        // Apply the width character offsets to the result
        bufferRange.start.x += startOffset;
        bufferRange.end.x += startOffset + endOffset;
        // Convert back to wrapped lines
        while (bufferRange.start.x > bufferWidth) {
            bufferRange.start.x -= bufferWidth;
            bufferRange.start.y++;
        }
        while (bufferRange.end.x > bufferWidth) {
            bufferRange.end.x -= bufferWidth;
            bufferRange.end.y++;
        }
        return bufferRange;
    }
    function convertBufferRangeToViewport(bufferRange, viewportY) {
        return {
            start: {
                x: bufferRange.start.x - 1,
                y: bufferRange.start.y - viewportY - 1
            },
            end: {
                x: bufferRange.end.x - 1,
                y: bufferRange.end.y - viewportY - 1
            }
        };
    }
    function getXtermLineContent(buffer, lineStart, lineEnd, cols) {
        // Cap the maximum number of lines generated to prevent potential performance problems. This is
        // more of a sanity check as the wrapped line should already be trimmed down at this point.
        const maxLineLength = Math.max(2048, cols * 2);
        lineEnd = Math.min(lineEnd, lineStart + maxLineLength);
        let content = '';
        for (let i = lineStart; i <= lineEnd; i++) {
            // Make sure only 0 to cols are considered as resizing when windows mode is enabled will
            // retain buffer data outside of the terminal width as reflow is disabled.
            const line = buffer.getLine(i);
            if (line) {
                content += line.translateToString(true, 0, cols);
            }
        }
        return content;
    }
    function getXtermRangesByAttr(buffer, lineStart, lineEnd, cols) {
        let bufferRangeStart = undefined;
        let lastFgAttr = -1;
        let lastBgAttr = -1;
        const ranges = [];
        for (let y = lineStart; y <= lineEnd; y++) {
            const line = buffer.getLine(y);
            if (!line) {
                continue;
            }
            for (let x = 0; x < cols; x++) {
                const cell = line.getCell(x);
                if (!cell) {
                    break;
                }
                // HACK: Re-construct the attributes from fg and bg, this is hacky as it relies
                // upon the internal buffer bit layout
                const thisFgAttr = (cell.isBold() |
                    cell.isInverse() |
                    cell.isStrikethrough() |
                    cell.isUnderline());
                const thisBgAttr = (cell.isDim() |
                    cell.isItalic());
                if (lastFgAttr === -1 || lastBgAttr === -1) {
                    bufferRangeStart = { x, y };
                }
                else {
                    if (lastFgAttr !== thisFgAttr || lastBgAttr !== thisBgAttr) {
                        // TODO: x overflow
                        const bufferRangeEnd = { x, y };
                        ranges.push({
                            start: bufferRangeStart,
                            end: bufferRangeEnd
                        });
                        bufferRangeStart = { x, y };
                    }
                }
                lastFgAttr = thisFgAttr;
                lastBgAttr = thisBgAttr;
            }
        }
        return ranges;
    }
    // export function positionIsInRange(position: IBufferCellPosition, range: IBufferRange): boolean {
    // 	if (position.y < range.start.y || position.y > range.end.y) {
    // 		return false;
    // 	}
    // 	if (position.y === range.start.y && position.x < range.start.x) {
    // 		return false;
    // 	}
    // 	if (position.y === range.end.y && position.x > range.end.x) {
    // 		return false;
    // 	}
    // 	return true;
    // }
    /**
     * For shells with the CommandDetection capability, the cwd for a command relative to the line of
     * the particular link can be used to narrow down the result for an exact file match.
     */
    function updateLinkWithRelativeCwd(capabilities, y, text, osPath, logService) {
        const cwd = capabilities.get(2 /* TerminalCapability.CommandDetection */)?.getCwdForLine(y);
        logService.trace('terminalLinkHelpers#updateLinkWithRelativeCwd cwd', cwd);
        if (!cwd) {
            return undefined;
        }
        const result = [];
        const sep = osPath.sep;
        if (!text.includes(sep)) {
            result.push(osPath.resolve(cwd + sep + text));
        }
        else {
            let commonDirs = 0;
            let i = 0;
            const cwdPath = cwd.split(sep).reverse();
            const linkPath = text.split(sep);
            // Get all results as candidates, prioritizing the link with the most common directories.
            // For example if in the directory /home/common and the link is common/file, the result
            // should be: `['/home/common/common/file', '/home/common/file']`. The first is the most
            // likely as cwd detection is active.
            while (i < cwdPath.length) {
                result.push(osPath.resolve(cwd + sep + linkPath.slice(commonDirs).join(sep)));
                if (cwdPath[i] === linkPath[i]) {
                    commonDirs++;
                }
                else {
                    break;
                }
                i++;
            }
        }
        return result;
    }
    function osPathModule(os) {
        return os === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rSGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsTGlua0hlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLDREQXVHQztJQUVELG9FQVdDO0lBRUQsa0RBZUM7SUFFRCxvREE2Q0M7SUFvQkQsOERBOEJDO0lBRUQsb0NBRUM7SUFsUEQ7Ozs7Ozs7T0FPRztJQUNILFNBQWdCLHdCQUF3QixDQUN2QyxLQUFvQixFQUNwQixXQUFtQixFQUNuQixLQUFhLEVBQ2IsU0FBaUI7UUFFakIsTUFBTSxXQUFXLEdBQWlCO1lBQ2pDLEtBQUssRUFBRTtnQkFDTixDQUFDLEVBQUUsS0FBSyxDQUFDLFdBQVc7Z0JBQ3BCLENBQUMsRUFBRSxLQUFLLENBQUMsZUFBZSxHQUFHLFNBQVM7YUFDcEM7WUFDRCxHQUFHLEVBQUU7Z0JBQ0osQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQztnQkFDdEIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxhQUFhLEdBQUcsU0FBUzthQUNsQztTQUNELENBQUM7UUFFRixrRUFBa0U7UUFDbEUsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxDQUFDO1FBQ3pFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMxRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdB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