/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEmptyWindowBackupInfo = isEmptyWindowBackupInfo;
    exports.deserializeWorkspaceInfos = deserializeWorkspaceInfos;
    exports.deserializeFolderInfos = deserializeFolderInfos;
    function isEmptyWindowBackupInfo(obj) {
        const candidate = obj;
        return typeof candidate?.backupFolder === 'string';
    }
    function deserializeWorkspaceInfos(serializedBackupWorkspaces) {
        let workspaceBackupInfos = [];
        try {
            if (Array.isArray(serializedBackupWorkspaces.workspaces)) {
                workspaceBackupInfos = serializedBackupWorkspaces.workspaces.map(workspace => ({
                    workspace: {
                        id: workspace.id,
                        configPath: uri_1.URI.parse(workspace.configURIPath)
                    },
                    remoteAuthority: workspace.remoteAuthority
                }));
            }
        }
        catch (e) {
            // ignore URI parsing exceptions
        }
        return workspaceBackupInfos;
    }
    function deserializeFolderInfos(serializedBackupWorkspaces) {
        let folderBackupInfos = [];
        try {
            if (Array.isArray(serializedBackupWorkspaces.folders)) {
                folderBackupInfos = serializedBackupWorkspaces.folders.map(folder => ({
                    folderUri: uri_1.URI.parse(folder.folderUri),
                    remoteAuthority: folder.remoteAuthority
                }));
            }
        }
        catch (e) {
            // ignore URI parsing exceptions
        }
        return folderBackupInfos;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYmFja3VwL25vZGUvYmFja3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLDBEQUlDO0lBUUQsOERBbUJDO0lBT0Qsd0RBZ0JDO0lBdERELFNBQWdCLHVCQUF1QixDQUFDLEdBQVk7UUFDbkQsTUFBTSxTQUFTLEdBQUcsR0FBeUMsQ0FBQztRQUU1RCxPQUFPLE9BQU8sU0FBUyxFQUFFLFlBQVksS0FBSyxRQUFRLENBQUM7SUFDcEQsQ0FBQztJQVFELFNBQWdCLHlCQUF5QixDQUFDLDBCQUF1RDtRQUNoRyxJQUFJLG9CQUFvQixHQUEyQixFQUFFLENBQUM7UUFDdEQsSUFBSSxDQUFDO1lBQ0osSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzFELG9CQUFvQixHQUFHLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUM3RTtvQkFDQyxTQUFTLEVBQUU7d0JBQ1YsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFO3dCQUNoQixVQUFVLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO3FCQUM5QztvQkFDRCxlQUFlLEVBQUUsU0FBUyxDQUFDLGVBQWU7aUJBQzFDLENBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osZ0NBQWdDO1FBQ2pDLENBQUM7UUFFRCxPQUFPLG9CQUFvQixDQUFDO0lBQzdCLENBQUM7SUFPRCxTQUFnQixzQkFBc0IsQ0FBQywwQkFBdUQ7UUFDN0YsSUFBSSxpQkFBaUIsR0FBd0IsRUFBRSxDQUFDO1FBQ2hELElBQUksQ0FBQztZQUNKLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxpQkFBaUIsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FDcEU7b0JBQ0MsU0FBUyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztvQkFDdEMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlO2lCQUN2QyxDQUNELENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLGdDQUFnQztRQUNqQyxDQUFDO1FBRUQsT0FBTyxpQkFBaUIsQ0FBQztJQUMxQixDQUFDIn0=