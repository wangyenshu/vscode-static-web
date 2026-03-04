/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCM_CHANGES_EDITOR_ID = exports.ISCMViewService = exports.ISCMRepositorySortKey = exports.SCMInputChangeReason = exports.InputValidationType = exports.ISCMService = exports.REPOSITORIES_VIEW_PANE_ID = exports.VIEW_PANE_ID = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.scm';
    exports.VIEW_PANE_ID = 'workbench.scm';
    exports.REPOSITORIES_VIEW_PANE_ID = 'workbench.scm.repositories';
    exports.ISCMService = (0, instantiation_1.createDecorator)('scm');
    var InputValidationType;
    (function (InputValidationType) {
        InputValidationType[InputValidationType["Error"] = 0] = "Error";
        InputValidationType[InputValidationType["Warning"] = 1] = "Warning";
        InputValidationType[InputValidationType["Information"] = 2] = "Information";
    })(InputValidationType || (exports.InputValidationType = InputValidationType = {}));
    var SCMInputChangeReason;
    (function (SCMInputChangeReason) {
        SCMInputChangeReason[SCMInputChangeReason["HistoryPrevious"] = 0] = "HistoryPrevious";
        SCMInputChangeReason[SCMInputChangeReason["HistoryNext"] = 1] = "HistoryNext";
    })(SCMInputChangeReason || (exports.SCMInputChangeReason = SCMInputChangeReason = {}));
    var ISCMRepositorySortKey;
    (function (ISCMRepositorySortKey) {
        ISCMRepositorySortKey["DiscoveryTime"] = "discoveryTime";
        ISCMRepositorySortKey["Name"] = "name";
        ISCMRepositorySortKey["Path"] = "path";
    })(ISCMRepositorySortKey || (exports.ISCMRepositorySortKey = ISCMRepositorySortKey = {}));
    exports.ISCMViewService = (0, instantiation_1.createDecorator)('scmView');
    exports.SCM_CHANGES_EDITOR_ID = 'workbench.editor.scmChangesEditor';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2NtL2NvbW1vbi9zY20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY25GLFFBQUEsVUFBVSxHQUFHLG9CQUFvQixDQUFDO0lBQ2xDLFFBQUEsWUFBWSxHQUFHLGVBQWUsQ0FBQztJQUMvQixRQUFBLHlCQUF5QixHQUFHLDRCQUE0QixDQUFDO0lBTXpELFFBQUEsV0FBVyxHQUFHLElBQUEsK0JBQWUsRUFBYyxLQUFLLENBQUMsQ0FBQztJQW1FL0QsSUFBa0IsbUJBSWpCO0lBSkQsV0FBa0IsbUJBQW1CO1FBQ3BDLCtEQUFTLENBQUE7UUFDVCxtRUFBVyxDQUFBO1FBQ1gsMkVBQWUsQ0FBQTtJQUNoQixDQUFDLEVBSmlCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBSXBDO0lBV0QsSUFBWSxvQkFHWDtJQUhELFdBQVksb0JBQW9CO1FBQy9CLHFGQUFlLENBQUE7UUFDZiw2RUFBVyxDQUFBO0lBQ1osQ0FBQyxFQUhXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBRy9CO0lBd0ZELElBQWtCLHFCQUlqQjtJQUpELFdBQWtCLHFCQUFxQjtRQUN0Qyx3REFBK0IsQ0FBQTtRQUMvQixzQ0FBYSxDQUFBO1FBQ2Isc0NBQWEsQ0FBQTtJQUNkLENBQUMsRUFKaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFJdEM7SUFFWSxRQUFBLGVBQWUsR0FBRyxJQUFBLCtCQUFlLEVBQWtCLFNBQVMsQ0FBQyxDQUFDO0lBNEI5RCxRQUFBLHFCQUFxQixHQUFHLG1DQUFtQyxDQUFDIn0=