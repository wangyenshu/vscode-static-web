/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContext = void 0;
    class ViewContext {
        constructor(notebookOptions, eventDispatcher, getBaseCellEditorOptions) {
            this.notebookOptions = notebookOptions;
            this.eventDispatcher = eventDispatcher;
            this.getBaseCellEditorOptions = getBaseCellEditorOptions;
        }
    }
    exports.ViewContext = ViewContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0NvbnRleHQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdNb2RlbC92aWV3Q29udGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxXQUFXO1FBQ3ZCLFlBQ1UsZUFBZ0MsRUFDaEMsZUFBd0MsRUFDeEMsd0JBQXNFO1lBRnRFLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBeUI7WUFDeEMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUE4QztRQUVoRixDQUFDO0tBQ0Q7SUFQRCxrQ0FPQyJ9