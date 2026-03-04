/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/actions/common/actions"], function (require, exports, editorExtensions_1, nls_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetEditorAction = exports.SnippetsAction = void 0;
    const defaultOptions = {
        category: (0, nls_1.localize2)('snippets', "Snippets"),
    };
    class SnippetsAction extends actions_1.Action2 {
        constructor(desc) {
            super({ ...defaultOptions, ...desc });
        }
    }
    exports.SnippetsAction = SnippetsAction;
    class SnippetEditorAction extends editorExtensions_1.EditorAction2 {
        constructor(desc) {
            super({ ...defaultOptions, ...desc });
        }
    }
    exports.SnippetEditorAction = SnippetEditorAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTbmlwcGV0c0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy9icm93c2VyL2NvbW1hbmRzL2Fic3RyYWN0U25pcHBldHNBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFNLGNBQWMsR0FBRztRQUN0QixRQUFRLEVBQUUsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztLQUNsQyxDQUFDO0lBRVgsTUFBc0IsY0FBZSxTQUFRLGlCQUFPO1FBRW5ELFlBQVksSUFBK0I7WUFDMUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxjQUFjLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQUxELHdDQUtDO0lBRUQsTUFBc0IsbUJBQW9CLFNBQVEsZ0NBQWE7UUFFOUQsWUFBWSxJQUErQjtZQUMxQyxLQUFLLENBQUMsRUFBRSxHQUFHLGNBQWMsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBTEQsa0RBS0MifQ==