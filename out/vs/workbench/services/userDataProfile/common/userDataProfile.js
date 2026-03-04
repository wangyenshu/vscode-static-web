/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons"], function (require, exports, types_1, nls_1, actions_1, instantiation_1, contextkey_1, uri_1, iconRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT = exports.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT = exports.HAS_PROFILES_CONTEXT = exports.IS_CURRENT_PROFILE_TRANSIENT_CONTEXT = exports.CURRENT_PROFILE_CONTEXT = exports.PROFILES_ENABLEMENT_CONTEXT = exports.PROFILE_FILTER = exports.PROFILE_EXTENSION = exports.PROFILES_CATEGORY = exports.PROFILES_TITLE = exports.MANAGE_PROFILES_ACTION_ID = exports.ProfilesMenu = exports.defaultUserDataProfileIcon = exports.IUserDataProfileImportExportService = exports.PROFILE_URL_AUTHORITY = exports.IUserDataProfileManagementService = exports.IUserDataProfileService = void 0;
    exports.isUserDataProfileTemplate = isUserDataProfileTemplate;
    exports.toUserDataProfileUri = toUserDataProfileUri;
    exports.IUserDataProfileService = (0, instantiation_1.createDecorator)('IUserDataProfileService');
    exports.IUserDataProfileManagementService = (0, instantiation_1.createDecorator)('IUserDataProfileManagementService');
    function isUserDataProfileTemplate(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && ((0, types_1.isUndefined)(candidate.settings) || typeof candidate.settings === 'string')
            && ((0, types_1.isUndefined)(candidate.globalState) || typeof candidate.globalState === 'string')
            && ((0, types_1.isUndefined)(candidate.extensions) || typeof candidate.extensions === 'string'));
    }
    exports.PROFILE_URL_AUTHORITY = 'profile';
    function toUserDataProfileUri(path, productService) {
        return uri_1.URI.from({
            scheme: productService.urlProtocol,
            authority: exports.PROFILE_URL_AUTHORITY,
            path: path.startsWith('/') ? path : `/${path}`
        });
    }
    exports.IUserDataProfileImportExportService = (0, instantiation_1.createDecorator)('IUserDataProfileImportExportService');
    exports.defaultUserDataProfileIcon = (0, iconRegistry_1.registerIcon)('defaultProfile-icon', codicons_1.Codicon.settings, (0, nls_1.localize)('defaultProfileIcon', 'Icon for Default Profile.'));
    exports.ProfilesMenu = new actions_1.MenuId('Profiles');
    exports.MANAGE_PROFILES_ACTION_ID = 'workbench.profiles.actions.manage';
    exports.PROFILES_TITLE = (0, nls_1.localize2)('profiles', 'Profiles');
    exports.PROFILES_CATEGORY = { ...exports.PROFILES_TITLE };
    exports.PROFILE_EXTENSION = 'code-profile';
    exports.PROFILE_FILTER = [{ name: (0, nls_1.localize)('profile', "Profile"), extensions: [exports.PROFILE_EXTENSION] }];
    exports.PROFILES_ENABLEMENT_CONTEXT = new contextkey_1.RawContextKey('profiles.enabled', true);
    exports.CURRENT_PROFILE_CONTEXT = new contextkey_1.RawContextKey('currentProfile', '');
    exports.IS_CURRENT_PROFILE_TRANSIENT_CONTEXT = new contextkey_1.RawContextKey('isCurrentProfileTransient', false);
    exports.HAS_PROFILES_CONTEXT = new contextkey_1.RawContextKey('hasProfiles', false);
    exports.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT = new contextkey_1.RawContextKey('isProfileExportInProgress', false);
    exports.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT = new contextkey_1.RawContextKey('isProfileImportInProgress', false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9jb21tb24vdXNlckRhdGFQcm9maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJEaEcsOERBT0M7SUFHRCxvREFNQztJQXBEWSxRQUFBLHVCQUF1QixHQUFHLElBQUEsK0JBQWUsRUFBMEIseUJBQXlCLENBQUMsQ0FBQztJQWM5RixRQUFBLGlDQUFpQyxHQUFHLElBQUEsK0JBQWUsRUFBb0MsbUNBQW1DLENBQUMsQ0FBQztJQXNCekksU0FBZ0IseUJBQXlCLENBQUMsS0FBYztRQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUE2QyxDQUFDO1FBRWhFLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVE7ZUFDaEQsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUM7ZUFDM0UsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUM7ZUFDakYsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLFVBQVUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFWSxRQUFBLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztJQUMvQyxTQUFnQixvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsY0FBK0I7UUFDakYsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2YsTUFBTSxFQUFFLGNBQWMsQ0FBQyxXQUFXO1lBQ2xDLFNBQVMsRUFBRSw2QkFBcUI7WUFDaEMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7U0FDOUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQVFZLFFBQUEsbUNBQW1DLEdBQUcsSUFBQSwrQkFBZSxFQUFzQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBa0RsSSxRQUFBLDBCQUEwQixHQUFHLElBQUEsMkJBQVksRUFBQyxxQkFBcUIsRUFBRSxrQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUM7SUFFaEosUUFBQSxZQUFZLEdBQUcsSUFBSSxnQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLFFBQUEseUJBQXlCLEdBQUcsbUNBQW1DLENBQUM7SUFDaEUsUUFBQSxjQUFjLEdBQUcsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ25ELFFBQUEsaUJBQWlCLEdBQUcsRUFBRSxHQUFHLHNCQUFjLEVBQUUsQ0FBQztJQUMxQyxRQUFBLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztJQUNuQyxRQUFBLGNBQWMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyx5QkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3RixRQUFBLDJCQUEyQixHQUFHLElBQUksMEJBQWEsQ0FBVSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRixRQUFBLHVCQUF1QixHQUFHLElBQUksMEJBQWEsQ0FBUyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMxRSxRQUFBLG9DQUFvQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0RyxRQUFBLG9CQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBVSxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEUsUUFBQSxxQ0FBcUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkcsUUFBQSxxQ0FBcUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUMifQ==