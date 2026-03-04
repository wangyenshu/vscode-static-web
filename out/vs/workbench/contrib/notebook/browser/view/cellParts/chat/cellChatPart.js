/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellChatPart = void 0;
    class CellChatPart extends cellPart_1.CellContentPart {
        // private _controller: NotebookCellChatController | undefined;
        get activeCell() {
            return this.currentCell;
        }
        constructor(_notebookEditor, _partContainer) {
            super();
        }
        didRenderCell(element) {
            super.didRenderCell(element);
        }
        unrenderCell(element) {
            super.unrenderCell(element);
        }
        updateInternalLayoutNow(element) {
        }
        dispose() {
            super.dispose();
        }
    }
    exports.CellChatPart = CellChatPart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENoYXRQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jaGF0L2NlbGxDaGF0UGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSxZQUFhLFNBQVEsMEJBQWU7UUFDaEQsK0RBQStEO1FBRS9ELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsWUFDQyxlQUF3QyxFQUN4QyxjQUEyQjtZQUUzQixLQUFLLEVBQUUsQ0FBQztRQUNULENBQUM7UUFFUSxhQUFhLENBQUMsT0FBdUI7WUFDN0MsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRVEsWUFBWSxDQUFDLE9BQXVCO1lBQzVDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVRLHVCQUF1QixDQUFDLE9BQXVCO1FBQ3hELENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQTVCRCxvQ0E0QkMifQ==