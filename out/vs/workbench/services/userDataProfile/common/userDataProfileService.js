/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/themables", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, async_1, event_1, lifecycle_1, objects_1, themables_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileService = void 0;
    class UserDataProfileService extends lifecycle_1.Disposable {
        get currentProfile() { return this._currentProfile; }
        constructor(currentProfile) {
            super();
            this._onDidChangeCurrentProfile = this._register(new event_1.Emitter());
            this.onDidChangeCurrentProfile = this._onDidChangeCurrentProfile.event;
            this._currentProfile = currentProfile;
        }
        async updateCurrentProfile(userDataProfile) {
            if ((0, objects_1.equals)(this._currentProfile, userDataProfile)) {
                return;
            }
            const previous = this._currentProfile;
            this._currentProfile = userDataProfile;
            const joiners = [];
            this._onDidChangeCurrentProfile.fire({
                previous,
                profile: userDataProfile,
                join(promise) {
                    joiners.push(promise);
                }
            });
            await async_1.Promises.settled(joiners);
        }
        getShortName(profile) {
            if (!profile.isDefault && profile.shortName && themables_1.ThemeIcon.fromId(profile.shortName)) {
                return profile.shortName;
            }
            return `$(${userDataProfile_1.defaultUserDataProfileIcon.id})`;
        }
    }
    exports.UserDataProfileService = UserDataProfileService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvY29tbW9uL3VzZXJEYXRhUHJvZmlsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsc0JBQXVCLFNBQVEsc0JBQVU7UUFRckQsSUFBSSxjQUFjLEtBQXVCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFFdkUsWUFDQyxjQUFnQztZQUVoQyxLQUFLLEVBQUUsQ0FBQztZQVRRLCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWlDLENBQUMsQ0FBQztZQUNsRyw4QkFBeUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBUzFFLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsZUFBaUM7WUFDM0QsSUFBSSxJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDdEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDdkMsTUFBTSxPQUFPLEdBQW9CLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDO2dCQUNwQyxRQUFRO2dCQUNSLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixJQUFJLENBQUMsT0FBTztvQkFDWCxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsWUFBWSxDQUFDLE9BQXlCO1lBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUkscUJBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BGLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUMxQixDQUFDO1lBQ0QsT0FBTyxLQUFLLDRDQUEwQixDQUFDLEVBQUUsR0FBRyxDQUFDO1FBQzlDLENBQUM7S0FFRDtJQXpDRCx3REF5Q0MifQ==