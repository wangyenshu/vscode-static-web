/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFolderBackupInfo = isFolderBackupInfo;
    exports.isWorkspaceBackupInfo = isWorkspaceBackupInfo;
    function isFolderBackupInfo(curr) {
        return curr && curr.hasOwnProperty('folderUri');
    }
    function isWorkspaceBackupInfo(curr) {
        return curr && curr.hasOwnProperty('workspace');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYmFja3VwL2NvbW1vbi9iYWNrdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLGdEQUVDO0lBRUQsc0RBRUM7SUFORCxTQUFnQixrQkFBa0IsQ0FBQyxJQUE4QztRQUNoRixPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxJQUE4QztRQUNuRixPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUMifQ==