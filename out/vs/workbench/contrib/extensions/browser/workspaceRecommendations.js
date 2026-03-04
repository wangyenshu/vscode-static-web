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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/notification/common/notification", "vs/nls", "vs/base/common/event", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/platform/workspace/common/workspace", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/files/common/files", "vs/base/common/async", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, extensionManagement_1, arrays_1, extensionRecommendations_1, notification_1, nls_1, event_1, workspaceExtensionsConfig_1, workspace_1, uriIdentity_1, files_1, async_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceRecommendations = void 0;
    const WORKSPACE_EXTENSIONS_FOLDER = '.vscode/extensions';
    let WorkspaceRecommendations = class WorkspaceRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        get ignoredRecommendations() { return this._ignoredRecommendations; }
        constructor(workspaceExtensionsConfigService, contextService, uriIdentityService, fileService, workbenchExtensionManagementService, notificationService) {
            super();
            this.workspaceExtensionsConfigService = workspaceExtensionsConfigService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.workbenchExtensionManagementService = workbenchExtensionManagementService;
            this.notificationService = notificationService;
            this._recommendations = [];
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this._ignoredRecommendations = [];
            this.workspaceExtensions = [];
            this.onDidChangeWorkspaceExtensionsScheduler = this._register(new async_1.RunOnceScheduler(() => this.onDidChangeWorkspaceExtensionsFolders(), 1000));
        }
        async doActivate() {
            this.workspaceExtensions = await this.fetchWorkspaceExtensions();
            await this.fetch();
            this._register(this.workspaceExtensionsConfigService.onDidChangeExtensionsConfigs(() => this.onDidChangeExtensionsConfigs()));
            for (const folder of this.contextService.getWorkspace().folders) {
                this._register(this.fileService.watch(this.uriIdentityService.extUri.joinPath(folder.uri, WORKSPACE_EXTENSIONS_FOLDER)));
            }
            this._register(this.fileService.onDidFilesChange(e => {
                if (this.contextService.getWorkspace().folders.some(folder => e.affects(this.uriIdentityService.extUri.joinPath(folder.uri, WORKSPACE_EXTENSIONS_FOLDER), 1 /* FileChangeType.ADDED */, 2 /* FileChangeType.DELETED */))) {
                    this.onDidChangeWorkspaceExtensionsScheduler.schedule();
                }
            }));
        }
        async onDidChangeWorkspaceExtensionsFolders() {
            const existing = this.workspaceExtensions;
            this.workspaceExtensions = await this.fetchWorkspaceExtensions();
            if (!(0, arrays_1.equals)(existing, this.workspaceExtensions, (a, b) => this.uriIdentityService.extUri.isEqual(a, b))) {
                this.onDidChangeExtensionsConfigs();
            }
        }
        async fetchWorkspaceExtensions() {
            const workspaceExtensions = [];
            for (const workspaceFolder of this.contextService.getWorkspace().folders) {
                const extensionsLocaiton = this.uriIdentityService.extUri.joinPath(workspaceFolder.uri, WORKSPACE_EXTENSIONS_FOLDER);
                try {
                    const stat = await this.fileService.resolve(extensionsLocaiton);
                    for (const extension of stat.children ?? []) {
                        if (!extension.isDirectory) {
                            continue;
                        }
                        workspaceExtensions.push(extension.resource);
                    }
                }
                catch (error) {
                    // ignore
                }
            }
            if (workspaceExtensions.length) {
                const resourceExtensions = await this.workbenchExtensionManagementService.getExtensions(workspaceExtensions);
                return resourceExtensions.map(extension => extension.location);
            }
            return [];
        }
        /**
         * Parse all extensions.json files, fetch workspace recommendations, filter out invalid and unwanted ones
         */
        async fetch() {
            const extensionsConfigs = await this.workspaceExtensionsConfigService.getExtensionsConfigs();
            const { invalidRecommendations, message } = await this.validateExtensions(extensionsConfigs);
            if (invalidRecommendations.length) {
                this.notificationService.warn(`The ${invalidRecommendations.length} extension(s) below, in workspace recommendations have issues:\n${message}`);
            }
            this._recommendations = [];
            this._ignoredRecommendations = [];
            for (const extensionsConfig of extensionsConfigs) {
                if (extensionsConfig.unwantedRecommendations) {
                    for (const unwantedRecommendation of extensionsConfig.unwantedRecommendations) {
                        if (invalidRecommendations.indexOf(unwantedRecommendation) === -1) {
                            this._ignoredRecommendations.push(unwantedRecommendation);
                        }
                    }
                }
                if (extensionsConfig.recommendations) {
                    for (const extensionId of extensionsConfig.recommendations) {
                        if (invalidRecommendations.indexOf(extensionId) === -1) {
                            this._recommendations.push({
                                extension: extensionId,
                                reason: {
                                    reasonId: 0 /* ExtensionRecommendationReason.Workspace */,
                                    reasonText: (0, nls_1.localize)('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
                                }
                            });
                        }
                    }
                }
            }
            for (const extension of this.workspaceExtensions) {
                this._recommendations.push({
                    extension,
                    reason: {
                        reasonId: 0 /* ExtensionRecommendationReason.Workspace */,
                        reasonText: (0, nls_1.localize)('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
                    }
                });
            }
        }
        async validateExtensions(contents) {
            const validExtensions = [];
            const invalidExtensions = [];
            let message = '';
            const allRecommendations = (0, arrays_1.distinct)((0, arrays_1.flatten)(contents.map(({ recommendations }) => recommendations || [])));
            const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
            for (const extensionId of allRecommendations) {
                if (regEx.test(extensionId)) {
                    validExtensions.push(extensionId);
                }
                else {
                    invalidExtensions.push(extensionId);
                    message += `${extensionId} (bad format) Expected: <provider>.<name>\n`;
                }
            }
            return { validRecommendations: validExtensions, invalidRecommendations: invalidExtensions, message };
        }
        async onDidChangeExtensionsConfigs() {
            await this.fetch();
            this._onDidChangeRecommendations.fire();
        }
    };
    exports.WorkspaceRecommendations = WorkspaceRecommendations;
    exports.WorkspaceRecommendations = WorkspaceRecommendations = __decorate([
        __param(0, workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(5, notification_1.INotificationService)
    ], WorkspaceRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL3dvcmtzcGFjZVJlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLE1BQU0sMkJBQTJCLEdBQUcsb0JBQW9CLENBQUM7SUFFbEQsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxtREFBd0I7UUFHckUsSUFBSSxlQUFlLEtBQTZDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQU0vRixJQUFJLHNCQUFzQixLQUE0QixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7UUFLNUYsWUFDb0MsZ0NBQW9GLEVBQzdGLGNBQXlELEVBQzlELGtCQUF3RCxFQUMvRCxXQUEwQyxFQUNsQixtQ0FBMEYsRUFDMUcsbUJBQTBEO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBUDRDLHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBbUM7WUFDNUUsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDRCx3Q0FBbUMsR0FBbkMsbUNBQW1DLENBQXNDO1lBQ3pGLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFsQnpFLHFCQUFnQixHQUE4QixFQUFFLENBQUM7WUFHakQsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDakUsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQUVyRSw0QkFBdUIsR0FBYSxFQUFFLENBQUM7WUFHdkMsd0JBQW1CLEdBQVUsRUFBRSxDQUFDO1lBWXZDLElBQUksQ0FBQyx1Q0FBdUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvSSxDQUFDO1FBRVMsS0FBSyxDQUFDLFVBQVU7WUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDakUsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFbkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsNEJBQTRCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlILEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFILENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQzVELENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSwyQkFBMkIsQ0FBQywrREFBK0MsQ0FBQyxFQUN6SSxDQUFDO29CQUNGLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sS0FBSyxDQUFDLHFDQUFxQztZQUNsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7WUFDMUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDakUsSUFBSSxDQUFDLElBQUEsZUFBTSxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN6RyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyx3QkFBd0I7WUFDckMsTUFBTSxtQkFBbUIsR0FBVSxFQUFFLENBQUM7WUFDdEMsS0FBSyxNQUFNLGVBQWUsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMxRSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztnQkFDckgsSUFBSSxDQUFDO29CQUNKLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztvQkFDaEUsS0FBSyxNQUFNLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsRUFBRSxDQUFDO3dCQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDOzRCQUM1QixTQUFTO3dCQUNWLENBQUM7d0JBQ0QsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUMsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLFNBQVM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoQyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUM3RyxPQUFPLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQ7O1dBRUc7UUFDSyxLQUFLLENBQUMsS0FBSztZQUVsQixNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFFN0YsTUFBTSxFQUFFLHNCQUFzQixFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDN0YsSUFBSSxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLHNCQUFzQixDQUFDLE1BQU0sbUVBQW1FLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDakosQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztZQUVsQyxLQUFLLE1BQU0sZ0JBQWdCLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDbEQsSUFBSSxnQkFBZ0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUM5QyxLQUFLLE1BQU0sc0JBQXNCLElBQUksZ0JBQWdCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzt3QkFDL0UsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUNuRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7d0JBQzNELENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksZ0JBQWdCLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3RDLEtBQUssTUFBTSxXQUFXLElBQUksZ0JBQWdCLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQzVELElBQUksc0JBQXNCLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ3hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7Z0NBQzFCLFNBQVMsRUFBRSxXQUFXO2dDQUN0QixNQUFNLEVBQUU7b0NBQ1AsUUFBUSxpREFBeUM7b0NBQ2pELFVBQVUsRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxrRUFBa0UsQ0FBQztpQ0FDbkg7NkJBQ0QsQ0FBQyxDQUFDO3dCQUNKLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELEtBQUssTUFBTSxTQUFTLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLFNBQVM7b0JBQ1QsTUFBTSxFQUFFO3dCQUNQLFFBQVEsaURBQXlDO3dCQUNqRCxVQUFVLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsa0VBQWtFLENBQUM7cUJBQ25IO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQW9DO1lBRXBFLE1BQU0sZUFBZSxHQUFhLEVBQUUsQ0FBQztZQUNyQyxNQUFNLGlCQUFpQixHQUFhLEVBQUUsQ0FBQztZQUN2QyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFFakIsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLGlCQUFRLEVBQUMsSUFBQSxnQkFBTyxFQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNHLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLGtEQUE0QixDQUFDLENBQUM7WUFDdkQsS0FBSyxNQUFNLFdBQVcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztvQkFDN0IsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDcEMsT0FBTyxJQUFJLEdBQUcsV0FBVyw2Q0FBNkMsQ0FBQztnQkFDeEUsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3RHLENBQUM7UUFFTyxLQUFLLENBQUMsNEJBQTRCO1lBQ3pDLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QyxDQUFDO0tBRUQsQ0FBQTtJQXJKWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQWVsQyxXQUFBLDZEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDBEQUFvQyxDQUFBO1FBQ3BDLFdBQUEsbUNBQW9CLENBQUE7T0FwQlYsd0JBQXdCLENBcUpwQyJ9