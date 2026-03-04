/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isVirtualResource = isVirtualResource;
    exports.getVirtualWorkspaceLocation = getVirtualWorkspaceLocation;
    exports.getVirtualWorkspaceScheme = getVirtualWorkspaceScheme;
    exports.getVirtualWorkspaceAuthority = getVirtualWorkspaceAuthority;
    exports.isVirtualWorkspace = isVirtualWorkspace;
    function isVirtualResource(resource) {
        return resource.scheme !== network_1.Schemas.file && resource.scheme !== network_1.Schemas.vscodeRemote;
    }
    function getVirtualWorkspaceLocation(workspace) {
        if (workspace.folders.length) {
            return workspace.folders.every(f => isVirtualResource(f.uri)) ? workspace.folders[0].uri : undefined;
        }
        else if (workspace.configuration && isVirtualResource(workspace.configuration)) {
            return workspace.configuration;
        }
        return undefined;
    }
    function getVirtualWorkspaceScheme(workspace) {
        return getVirtualWorkspaceLocation(workspace)?.scheme;
    }
    function getVirtualWorkspaceAuthority(workspace) {
        return getVirtualWorkspaceLocation(workspace)?.authority;
    }
    function isVirtualWorkspace(workspace) {
        return getVirtualWorkspaceLocation(workspace) !== undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbFdvcmtzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZS9jb21tb24vdmlydHVhbFdvcmtzcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyw4Q0FFQztJQUVELGtFQU9DO0lBRUQsOERBRUM7SUFFRCxvRUFFQztJQUVELGdEQUVDO0lBdkJELFNBQWdCLGlCQUFpQixDQUFDLFFBQWE7UUFDOUMsT0FBTyxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLENBQUM7SUFDckYsQ0FBQztJQUVELFNBQWdCLDJCQUEyQixDQUFDLFNBQXFCO1FBQ2hFLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5QixPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdEcsQ0FBQzthQUFNLElBQUksU0FBUyxDQUFDLGFBQWEsSUFBSSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUNsRixPQUFPLFNBQVMsQ0FBQyxhQUFhLENBQUM7UUFDaEMsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFnQix5QkFBeUIsQ0FBQyxTQUFxQjtRQUM5RCxPQUFPLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sQ0FBQztJQUN2RCxDQUFDO0lBRUQsU0FBZ0IsNEJBQTRCLENBQUMsU0FBcUI7UUFDakUsT0FBTywyQkFBMkIsQ0FBQyxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUM7SUFDMUQsQ0FBQztJQUVELFNBQWdCLGtCQUFrQixDQUFDLFNBQXFCO1FBQ3ZELE9BQU8sMkJBQTJCLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDO0lBQzdELENBQUMifQ==