/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/workspace/common/workspace"], function (require, exports, platform_1, uri_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkspace = exports.Workspace = void 0;
    exports.testWorkspace = testWorkspace;
    class Workspace extends workspace_1.Workspace {
        constructor(id, folders = [], configuration = null, ignorePathCasing = () => !platform_1.isLinux) {
            super(id, folders, false, configuration, ignorePathCasing);
        }
    }
    exports.Workspace = Workspace;
    const wsUri = uri_1.URI.file(platform_1.isWindows ? 'C:\\testWorkspace' : '/testWorkspace');
    exports.TestWorkspace = testWorkspace(wsUri);
    function testWorkspace(resource) {
        return new Workspace(resource.toString(), [(0, workspace_1.toWorkspaceFolder)(resource)]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFdvcmtzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZS90ZXN0L2NvbW1vbi90ZXN0V29ya3NwYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsc0NBRUM7SUFoQkQsTUFBYSxTQUFVLFNBQVEscUJBQWE7UUFDM0MsWUFDQyxFQUFVLEVBQ1YsVUFBNkIsRUFBRSxFQUMvQixnQkFBNEIsSUFBSSxFQUNoQyxtQkFBMEMsR0FBRyxFQUFFLENBQUMsQ0FBQyxrQkFBTztZQUV4RCxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDNUQsQ0FBQztLQUNEO0lBVEQsOEJBU0M7SUFFRCxNQUFNLEtBQUssR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFTLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzlELFFBQUEsYUFBYSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVsRCxTQUFnQixhQUFhLENBQUMsUUFBYTtRQUMxQyxPQUFPLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUEsNkJBQWlCLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUMifQ==