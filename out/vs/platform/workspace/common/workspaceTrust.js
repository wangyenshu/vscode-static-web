/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspaceTrustRequestService = exports.WorkspaceTrustUriResponse = exports.IWorkspaceTrustManagementService = exports.IWorkspaceTrustEnablementService = exports.WorkspaceTrustScope = void 0;
    var WorkspaceTrustScope;
    (function (WorkspaceTrustScope) {
        WorkspaceTrustScope[WorkspaceTrustScope["Local"] = 0] = "Local";
        WorkspaceTrustScope[WorkspaceTrustScope["Remote"] = 1] = "Remote";
    })(WorkspaceTrustScope || (exports.WorkspaceTrustScope = WorkspaceTrustScope = {}));
    exports.IWorkspaceTrustEnablementService = (0, instantiation_1.createDecorator)('workspaceTrustEnablementService');
    exports.IWorkspaceTrustManagementService = (0, instantiation_1.createDecorator)('workspaceTrustManagementService');
    var WorkspaceTrustUriResponse;
    (function (WorkspaceTrustUriResponse) {
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["Open"] = 1] = "Open";
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["OpenInNewWindow"] = 2] = "OpenInNewWindow";
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["Cancel"] = 3] = "Cancel";
    })(WorkspaceTrustUriResponse || (exports.WorkspaceTrustUriResponse = WorkspaceTrustUriResponse = {}));
    exports.IWorkspaceTrustRequestService = (0, instantiation_1.createDecorator)('workspaceTrustRequestService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2UvY29tbW9uL3dvcmtzcGFjZVRydXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFZLG1CQUdYO0lBSEQsV0FBWSxtQkFBbUI7UUFDOUIsK0RBQVMsQ0FBQTtRQUNULGlFQUFVLENBQUE7SUFDWCxDQUFDLEVBSFcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFHOUI7SUFZWSxRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsaUNBQWlDLENBQUMsQ0FBQztJQVF4SCxRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsaUNBQWlDLENBQUMsQ0FBQztJQThCckksSUFBa0IseUJBSWpCO0lBSkQsV0FBa0IseUJBQXlCO1FBQzFDLHlFQUFRLENBQUE7UUFDUiwrRkFBbUIsQ0FBQTtRQUNuQiw2RUFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUppQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQUkxQztJQUVZLFFBQUEsNkJBQTZCLEdBQUcsSUFBQSwrQkFBZSxFQUFnQyw4QkFBOEIsQ0FBQyxDQUFDIn0=