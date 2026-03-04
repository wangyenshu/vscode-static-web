/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IOpenerService = void 0;
    exports.withSelection = withSelection;
    exports.extractSelection = extractSelection;
    exports.IOpenerService = (0, instantiation_1.createDecorator)('openerService');
    /**
     * Encodes selection into the `URI`.
     *
     * IMPORTANT: you MUST use `extractSelection` to separate the selection
     * again from the original `URI` before passing the `URI` into any
     * component that is not aware of selections.
     */
    function withSelection(uri, selection) {
        return uri.with({ fragment: `${selection.startLineNumber},${selection.startColumn}${selection.endLineNumber ? `-${selection.endLineNumber}${selection.endColumn ? `,${selection.endColumn}` : ''}` : ''}` });
    }
    /**
     * file:///some/file.js#73
     * file:///some/file.js#L73
     * file:///some/file.js#73,84
     * file:///some/file.js#L73,84
     * file:///some/file.js#73-83
     * file:///some/file.js#L73-L83
     * file:///some/file.js#73,84-83,52
     * file:///some/file.js#L73,84-L83,52
     */
    function extractSelection(uri) {
        let selection = undefined;
        const match = /^L?(\d+)(?:,(\d+))?(-L?(\d+)(?:,(\d+))?)?/.exec(uri.fragment);
        if (match) {
            selection = {
                startLineNumber: parseInt(match[1]),
                startColumn: match[2] ? parseInt(match[2]) : 1,
                endLineNumber: match[4] ? parseInt(match[4]) : undefined,
                endColumn: match[4] ? (match[5] ? parseInt(match[5]) : 1) : undefined
            };
            uri = uri.with({ fragment: '' });
        }
        return { selection, uri };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vb3BlbmVyL2NvbW1vbi9vcGVuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEhoRyxzQ0FFQztJQVlELDRDQWFDO0lBN0lZLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZUFBZSxDQUFDLENBQUM7SUEyRy9FOzs7Ozs7T0FNRztJQUNILFNBQWdCLGFBQWEsQ0FBQyxHQUFRLEVBQUUsU0FBK0I7UUFDdEUsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsU0FBUyxDQUFDLGVBQWUsSUFBSSxTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5TSxDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsR0FBUTtRQUN4QyxJQUFJLFNBQVMsR0FBcUMsU0FBUyxDQUFDO1FBQzVELE1BQU0sS0FBSyxHQUFHLDJDQUEyQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0UsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNYLFNBQVMsR0FBRztnQkFDWCxlQUFlLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ3hELFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ3JFLENBQUM7WUFDRixHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFDRCxPQUFPLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQzNCLENBQUMifQ==