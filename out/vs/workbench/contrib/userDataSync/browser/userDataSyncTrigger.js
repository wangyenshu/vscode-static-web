/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferencesEditorInput"], function (require, exports, event_1, lifecycle_1, platform_1, resources_1, userDataProfile_1, userDataSync_1, viewsService_1, extensions_1, editorService_1, host_1, keybindingsEditorInput_1, preferencesEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncTrigger = void 0;
    let UserDataSyncTrigger = class UserDataSyncTrigger extends lifecycle_1.Disposable {
        constructor(editorService, userDataProfilesService, viewsService, userDataAutoSyncService, hostService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            const event = event_1.Event.filter(event_1.Event.any(event_1.Event.map(editorService.onDidActiveEditorChange, () => this.getUserDataEditorInputSource(editorService.activeEditor)), event_1.Event.map(event_1.Event.filter(viewsService.onDidChangeViewContainerVisibility, e => e.id === extensions_1.VIEWLET_ID && e.visible), e => e.id)), source => source !== undefined);
            if (platform_1.isWeb) {
                this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.map(hostService.onDidChangeFocus, () => 'windowFocus'), event_1.Event.map(event, source => source)), (last, source) => last ? [...last, source] : [source], 1000)(sources => userDataAutoSyncService.triggerSync(sources, true, false)));
            }
            else {
                this._register(event(source => userDataAutoSyncService.triggerSync([source], true, false)));
            }
        }
        getUserDataEditorInputSource(editorInput) {
            if (!editorInput) {
                return undefined;
            }
            if (editorInput instanceof preferencesEditorInput_1.SettingsEditor2Input) {
                return 'settingsEditor';
            }
            if (editorInput instanceof keybindingsEditorInput_1.KeybindingsEditorInput) {
                return 'keybindingsEditor';
            }
            const resource = editorInput.resource;
            if ((0, resources_1.isEqual)(resource, this.userDataProfilesService.defaultProfile.settingsResource)) {
                return 'settingsEditor';
            }
            if ((0, resources_1.isEqual)(resource, this.userDataProfilesService.defaultProfile.keybindingsResource)) {
                return 'keybindingsEditor';
            }
            return undefined;
        }
    };
    exports.UserDataSyncTrigger = UserDataSyncTrigger;
    exports.UserDataSyncTrigger = UserDataSyncTrigger = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, viewsService_1.IViewsService),
        __param(3, userDataSync_1.IUserDataAutoSyncService),
        __param(4, host_1.IHostService)
    ], UserDataSyncTrigger);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jVHJpZ2dlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VzZXJEYXRhU3luYy9icm93c2VyL3VzZXJEYXRhU3luY1RyaWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBRWxELFlBQ2lCLGFBQTZCLEVBQ0YsdUJBQWlELEVBQzdFLFlBQTJCLEVBQ2hCLHVCQUFpRCxFQUM3RCxXQUF5QjtZQUV2QyxLQUFLLEVBQUUsQ0FBQztZQUxtQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBTTVGLE1BQU0sS0FBSyxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQ3pCLGFBQUssQ0FBQyxHQUFHLENBQ1IsYUFBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUNySCxhQUFLLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLGtDQUFrQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyx1QkFBVSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDMUgsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQztZQUNwQyxJQUFJLGdCQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQzVCLGFBQUssQ0FBQyxHQUFHLENBQ1IsYUFBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQzVELGFBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTyxDQUFDLENBQ25DLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQzlELE9BQU8sQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNGLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxXQUFvQztZQUN4RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxJQUFJLFdBQVcsWUFBWSw2Q0FBb0IsRUFBRSxDQUFDO2dCQUNqRCxPQUFPLGdCQUFnQixDQUFDO1lBQ3pCLENBQUM7WUFDRCxJQUFJLFdBQVcsWUFBWSwrQ0FBc0IsRUFBRSxDQUFDO2dCQUNuRCxPQUFPLG1CQUFtQixDQUFDO1lBQzVCLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO1lBQ3RDLElBQUksSUFBQSxtQkFBTyxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDckYsT0FBTyxnQkFBZ0IsQ0FBQztZQUN6QixDQUFDO1lBQ0QsSUFBSSxJQUFBLG1CQUFPLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO2dCQUN4RixPQUFPLG1CQUFtQixDQUFDO1lBQzVCLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0QsQ0FBQTtJQTlDWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQUc3QixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEsdUNBQXdCLENBQUE7UUFDeEIsV0FBQSxtQkFBWSxDQUFBO09BUEYsbUJBQW1CLENBOEMvQiJ9