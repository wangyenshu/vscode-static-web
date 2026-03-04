/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/contributions", "vs/workbench/contrib/localHistory/browser/localHistoryTimeline", "vs/workbench/contrib/localHistory/browser/localHistoryCommands"], function (require, exports, contributions_1, localHistoryTimeline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Local History Timeline
    (0, contributions_1.registerWorkbenchContribution2)(localHistoryTimeline_1.LocalHistoryTimeline.ID, localHistoryTimeline_1.LocalHistoryTimeline, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvY2FsSGlzdG9yeS9icm93c2VyL2xvY2FsSGlzdG9yeS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsa0NBQWtDO0lBQ2xDLElBQUEsOENBQThCLEVBQUMsMkNBQW9CLENBQUMsRUFBRSxFQUFFLDJDQUFvQixzQ0FBdUQsQ0FBQyJ9