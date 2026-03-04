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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/host/browser/host", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, cancellation_1, errors_1, lifecycle_1, objects_1, nls_1, dialogs_1, extensions_1, log_1, productService_1, request_1, telemetry_1, userDataProfile_1, workspace_1, environmentService_1, extensions_2, host_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileManagementService = void 0;
    let UserDataProfileManagementService = class UserDataProfileManagementService extends lifecycle_1.Disposable {
        constructor(userDataProfilesService, userDataProfileService, hostService, dialogService, workspaceContextService, extensionService, environmentService, telemetryService, productService, requestService, logService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
            this.hostService = hostService;
            this.dialogService = dialogService;
            this.workspaceContextService = workspaceContextService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.requestService = requestService;
            this.logService = logService;
            this._register(userDataProfilesService.onDidChangeProfiles(e => this.onDidChangeProfiles(e)));
            this._register(userDataProfilesService.onDidResetWorkspaces(() => this.onDidResetWorkspaces()));
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => this.onDidChangeCurrentProfile(e)));
            this._register(userDataProfilesService.onDidChangeProfiles(e => {
                const updatedCurrentProfile = e.updated.find(p => this.userDataProfileService.currentProfile.id === p.id);
                if (updatedCurrentProfile) {
                    this.changeCurrentProfile(updatedCurrentProfile, (0, nls_1.localize)('reload message when updated', "The current profile has been updated. Please reload to switch back to the updated profile"));
                }
            }));
        }
        onDidChangeProfiles(e) {
            if (e.removed.some(profile => profile.id === this.userDataProfileService.currentProfile.id)) {
                this.changeCurrentProfile(this.userDataProfilesService.defaultProfile, (0, nls_1.localize)('reload message when removed', "The current profile has been removed. Please reload to switch back to default profile"));
                return;
            }
        }
        onDidResetWorkspaces() {
            if (!this.userDataProfileService.currentProfile.isDefault) {
                this.changeCurrentProfile(this.userDataProfilesService.defaultProfile, (0, nls_1.localize)('reload message when removed', "The current profile has been removed. Please reload to switch back to default profile"));
                return;
            }
        }
        async onDidChangeCurrentProfile(e) {
            if (e.previous.isTransient) {
                await this.userDataProfilesService.cleanUpTransientProfiles();
            }
        }
        async createAndEnterProfile(name, options) {
            const profile = await this.userDataProfilesService.createNamedProfile(name, options, (0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
            await this.changeCurrentProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'createAndEnterProfile' });
            return profile;
        }
        async createAndEnterTransientProfile() {
            const profile = await this.userDataProfilesService.createTransientProfile((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
            await this.changeCurrentProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'createAndEnterTransientProfile' });
            return profile;
        }
        async updateProfile(profile, updateOptions) {
            if (!this.userDataProfilesService.profiles.some(p => p.id === profile.id)) {
                throw new Error(`Profile ${profile.name} does not exist`);
            }
            if (profile.isDefault) {
                throw new Error((0, nls_1.localize)('cannotRenameDefaultProfile', "Cannot rename the default profile"));
            }
            await this.userDataProfilesService.updateProfile(profile, updateOptions);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'updateProfile' });
        }
        async removeProfile(profile) {
            if (!this.userDataProfilesService.profiles.some(p => p.id === profile.id)) {
                throw new Error(`Profile ${profile.name} does not exist`);
            }
            if (profile.isDefault) {
                throw new Error((0, nls_1.localize)('cannotDeleteDefaultProfile', "Cannot delete the default profile"));
            }
            await this.userDataProfilesService.removeProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'removeProfile' });
        }
        async switchProfile(profile) {
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace());
            if (!this.userDataProfilesService.profiles.some(p => p.id === profile.id)) {
                throw new Error(`Profile ${profile.name} does not exist`);
            }
            if (this.userDataProfileService.currentProfile.id === profile.id) {
                return;
            }
            await this.userDataProfilesService.setProfileForWorkspace(workspaceIdentifier, profile);
            await this.changeCurrentProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'switchProfile' });
        }
        async getBuiltinProfileTemplates() {
            if (this.productService.profileTemplatesUrl) {
                try {
                    const context = await this.requestService.request({ type: 'GET', url: this.productService.profileTemplatesUrl }, cancellation_1.CancellationToken.None);
                    if (context.res.statusCode === 200) {
                        return (await (0, request_1.asJson)(context)) || [];
                    }
                    else {
                        this.logService.error('Could not get profile templates.', context.res.statusCode);
                    }
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            return [];
        }
        async changeCurrentProfile(profile, reloadMessage) {
            const isRemoteWindow = !!this.environmentService.remoteAuthority;
            const shouldRestartExtensionHosts = this.userDataProfileService.currentProfile.id !== profile.id || !(0, objects_1.equals)(this.userDataProfileService.currentProfile.useDefaultFlags, profile.useDefaultFlags);
            if (shouldRestartExtensionHosts) {
                if (!isRemoteWindow) {
                    if (!(await this.extensionService.stopExtensionHosts((0, nls_1.localize)('switch profile', "Switching to a profile.")))) {
                        // If extension host did not stop, do not switch profile
                        if (this.userDataProfilesService.profiles.some(p => p.id === this.userDataProfileService.currentProfile.id)) {
                            await this.userDataProfilesService.setProfileForWorkspace((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()), this.userDataProfileService.currentProfile);
                        }
                        throw new errors_1.CancellationError();
                    }
                }
            }
            // In a remote window update current profile before reloading so that data is preserved from current profile if asked to preserve
            await this.userDataProfileService.updateCurrentProfile(profile);
            if (shouldRestartExtensionHosts) {
                if (isRemoteWindow) {
                    const { confirmed } = await this.dialogService.confirm({
                        message: reloadMessage ?? (0, nls_1.localize)('reload message', "Switching a profile requires reloading VS Code."),
                        primaryButton: (0, nls_1.localize)('reload button', "&&Reload"),
                    });
                    if (confirmed) {
                        await this.hostService.reload();
                    }
                }
                else {
                    await this.extensionService.startExtensionHosts();
                }
            }
        }
    };
    exports.UserDataProfileManagementService = UserDataProfileManagementService;
    exports.UserDataProfileManagementService = UserDataProfileManagementService = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, userDataProfile_2.IUserDataProfileService),
        __param(2, host_1.IHostService),
        __param(3, dialogs_1.IDialogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, extensions_2.IExtensionService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, productService_1.IProductService),
        __param(9, request_1.IRequestService),
        __param(10, log_1.ILogService)
    ], UserDataProfileManagementService);
    (0, extensions_1.registerSingleton)(userDataProfile_2.IUserDataProfileManagementService, UserDataProfileManagementService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlTWFuYWdlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci91c2VyRGF0YVByb2ZpbGVNYW5hZ2VtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtRQUcvRCxZQUM0Qyx1QkFBaUQsRUFDbEQsc0JBQStDLEVBQzFELFdBQXlCLEVBQ3ZCLGFBQTZCLEVBQ25CLHVCQUFpRCxFQUN4RCxnQkFBbUMsRUFDeEIsa0JBQWdELEVBQzNELGdCQUFtQyxFQUNyQyxjQUErQixFQUMvQixjQUErQixFQUNuQyxVQUF1QjtZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQVptQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2xELDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDMUQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdkIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ25CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDeEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQzNELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBR3JELElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMs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