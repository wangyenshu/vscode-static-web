/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/codicons", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "vs/base/common/hash"], function (require, exports, buffer_1, codicons_1, nls_1, contextkey_1, instantiation_1, iconRegistry_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editSessionsLogId = exports.EDIT_SESSIONS_SCHEME = exports.EDIT_SESSIONS_SHOW_VIEW = exports.EDIT_SESSIONS_VIEW_ICON = exports.EDIT_SESSIONS_TITLE = exports.EDIT_SESSIONS_DATA_VIEW_ID = exports.EDIT_SESSIONS_CONTAINER_ID = exports.EDIT_SESSIONS_PENDING = exports.EDIT_SESSIONS_PENDING_KEY = exports.EDIT_SESSIONS_SIGNED_IN = exports.EDIT_SESSIONS_SIGNED_IN_KEY = exports.EditSessionSchemaVersion = exports.FileType = exports.ChangeType = exports.IEditSessionsLogService = exports.IEditSessionsStorageService = exports.EDIT_SESSION_SYNC_CATEGORY = void 0;
    exports.decodeEditSessionFileContent = decodeEditSessionFileContent;
    exports.hashedEditSessionId = hashedEditSessionId;
    exports.EDIT_SESSION_SYNC_CATEGORY = (0, nls_1.localize2)('cloud changes', 'Cloud Changes');
    exports.IEditSessionsStorageService = (0, instantiation_1.createDecorator)('IEditSessionsStorageService');
    exports.IEditSessionsLogService = (0, instantiation_1.createDecorator)('IEditSessionsLogService');
    var ChangeType;
    (function (ChangeType) {
        ChangeType[ChangeType["Addition"] = 1] = "Addition";
        ChangeType[ChangeType["Deletion"] = 2] = "Deletion";
    })(ChangeType || (exports.ChangeType = ChangeType = {}));
    var FileType;
    (function (FileType) {
        FileType[FileType["File"] = 1] = "File";
    })(FileType || (exports.FileType = FileType = {}));
    exports.EditSessionSchemaVersion = 3;
    exports.EDIT_SESSIONS_SIGNED_IN_KEY = 'editSessionsSignedIn';
    exports.EDIT_SESSIONS_SIGNED_IN = new contextkey_1.RawContextKey(exports.EDIT_SESSIONS_SIGNED_IN_KEY, false);
    exports.EDIT_SESSIONS_PENDING_KEY = 'editSessionsPending';
    exports.EDIT_SESSIONS_PENDING = new contextkey_1.RawContextKey(exports.EDIT_SESSIONS_PENDING_KEY, false);
    exports.EDIT_SESSIONS_CONTAINER_ID = 'workbench.view.editSessions';
    exports.EDIT_SESSIONS_DATA_VIEW_ID = 'workbench.views.editSessions.data';
    exports.EDIT_SESSIONS_TITLE = (0, nls_1.localize2)('cloud changes', 'Cloud Changes');
    exports.EDIT_SESSIONS_VIEW_ICON = (0, iconRegistry_1.registerIcon)('edit-sessions-view-icon', codicons_1.Codicon.cloudDownload, (0, nls_1.localize)('editSessionViewIcon', 'View icon of the cloud changes view.'));
    exports.EDIT_SESSIONS_SHOW_VIEW = new contextkey_1.RawContextKey('editSessionsShowView', false);
    exports.EDIT_SESSIONS_SCHEME = 'vscode-edit-sessions';
    function decodeEditSessionFileContent(version, content) {
        switch (version) {
            case 1:
                return buffer_1.VSBuffer.fromString(content);
            case 2:
                return (0, buffer_1.decodeBase64)(content);
            default:
                throw new Error('Upgrade to a newer version to decode this content.');
        }
    }
    function hashedEditSessionId(editSessionId) {
        const sha1 = new hash_1.StringSHA1();
        sha1.update(editSessionId);
        return sha1.digest();
    }
    exports.editSessionsLogId = 'editSessions';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZWRpdFNlc3Npb25zL2NvbW1vbi9lZGl0U2Vzc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0doRyxvRUFTQztJQUVELGtEQUlDO0lBdEdZLFFBQUEsMEJBQTBCLEdBQUcsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBSXpFLFFBQUEsMkJBQTJCLEdBQUcsSUFBQSwrQkFBZSxFQUE4Qiw2QkFBNkIsQ0FBQyxDQUFDO0lBdUIxRyxRQUFBLHVCQUF1QixHQUFHLElBQUEsK0JBQWUsRUFBMEIseUJBQXlCLENBQUMsQ0FBQztJQUczRyxJQUFZLFVBR1g7SUFIRCxXQUFZLFVBQVU7UUFDckIsbURBQVksQ0FBQTtRQUNaLG1EQUFZLENBQUE7SUFDYixDQUFDLEVBSFcsVUFBVSwwQkFBVixVQUFVLFFBR3JCO0lBRUQsSUFBWSxRQUVYO0lBRkQsV0FBWSxRQUFRO1FBQ25CLHVDQUFRLENBQUE7SUFDVCxDQUFDLEVBRlcsUUFBUSx3QkFBUixRQUFRLFFBRW5CO0lBeUJZLFFBQUEsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO0lBUzdCLFFBQUEsMkJBQTJCLEdBQUcsc0JBQXNCLENBQUM7SUFDckQsUUFBQSx1QkFBdUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUNBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFekYsUUFBQSx5QkFBeUIsR0FBRyxxQkFBcUIsQ0FBQztJQUNsRCxRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSxpQ0FBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRixRQUFBLDBCQUEwQixHQUFHLDZCQUE2QixDQUFDO0lBQzNELFFBQUEsMEJBQTBCLEdBQUcsbUNBQW1DLENBQUM7SUFDakUsUUFBQSxtQkFBbUIsR0FBcUIsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXBGLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHlCQUF5QixFQUFFLGtCQUFPLENBQUMsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLHNDQUFzQyxDQUFDLENBQUMsQ0FBQztJQUVsSyxRQUFBLHVCQUF1QixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBc0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVwRixRQUFBLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDO0lBRTNELFNBQWdCLDRCQUE0QixDQUFDLE9BQWUsRUFBRSxPQUFlO1FBQzVFLFFBQVEsT0FBTyxFQUFFLENBQUM7WUFDakIsS0FBSyxDQUFDO2dCQUNMLE9BQU8saUJBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckMsS0FBSyxDQUFDO2dCQUNMLE9BQU8sSUFBQSxxQkFBWSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlCO2dCQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUN4RSxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLG1CQUFtQixDQUFDLGFBQXFCO1FBQ3hELE1BQU0sSUFBSSxHQUFHLElBQUksaUJBQVUsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0IsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVZLFFBQUEsaUJBQWlCLEdBQUcsY0FBYyxDQUFDIn0=