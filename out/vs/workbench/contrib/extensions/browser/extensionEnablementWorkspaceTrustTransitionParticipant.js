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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/host/browser/host"], function (require, exports, nls_1, lifecycle_1, workspaceTrust_1, environmentService_1, extensionManagement_1, extensions_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEnablementWorkspaceTrustTransitionParticipant = void 0;
    let ExtensionEnablementWorkspaceTrustTransitionParticipant = class ExtensionEnablementWorkspaceTrustTransitionParticipant extends lifecycle_1.Disposable {
        constructor(extensionService, hostService, environmentService, extensionEnablementService, workspaceTrustEnablementService, workspaceTrustManagementService) {
            super();
            if (workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                // The extension enablement participant will be registered only after the
                // workspace trust state has been initialized. There is no need to execute
                // the participant as part of the initialization process, as the workspace
                // trust state is initialized before starting the extension host.
                workspaceTrustManagementService.workspaceTrustInitialized.then(() => {
                    const workspaceTrustTransitionParticipant = new class {
                        async participate(trusted) {
                            if (trusted) {
                                // Untrusted -> Trusted
                                await extensionEnablementService.updateExtensionsEnablementsWhenWorkspaceTrustChanges();
                            }
                            else {
                                // Trusted -> Untrusted
                                if (environmentService.remoteAuthority) {
                                    hostService.reload();
                                }
                                else {
                                    const stopped = await extensionService.stopExtensionHosts((0, nls_1.localize)('restartExtensionHost.reason', "Restarting extension host due to workspace trust change."));
                                    await extensionEnablementService.updateExtensionsEnablementsWhenWorkspaceTrustChanges();
                                    if (stopped) {
                                        extensionService.startExtensionHosts();
                                    }
                                }
                            }
                        }
                    };
                    // Execute BEFORE the workspace trust transition completes
                    this._register(workspaceTrustManagementService.addWorkspaceTrustTransitionParticipant(workspaceTrustTransitionParticipant));
                });
            }
        }
    };
    exports.ExtensionEnablementWorkspaceTrustTransitionParticipant = ExtensionEnablementWorkspaceTrustTransitionParticipant;
    exports.ExtensionEnablementWorkspaceTrustTransitionParticipant = ExtensionEnablementWorkspaceTrustTransitionParticipant = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, host_1.IHostService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], ExtensionEnablementWorkspaceTrustTransitionParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRW5hYmxlbWVudFdvcmtzcGFjZVRydXN0VHJhbnNpdGlvblBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2V4dGVuc2lvbkVuYWJsZW1lbnRXb3Jrc3BhY2VUcnVzdFRyYW5zaXRpb25QYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSxzREFBc0QsR0FBNUQsTUFBTSxzREFBdUQsU0FBUSxzQkFBVTtRQUNyRixZQUNvQixnQkFBbUMsRUFDeEMsV0FBeUIsRUFDVCxrQkFBZ0QsRUFDeEMsMEJBQWdFLEVBQ3BFLCtCQUFpRSxFQUNqRSwrQkFBaUU7WUFFbkcsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLCtCQUErQixDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztnQkFDL0QseUVBQXlFO2dCQUN6RSwwRUFBMEU7Z0JBQzFFLDBFQUEwRTtnQkFDMUUsaUVBQWlFO2dCQUNqRSwrQkFBK0IsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO29CQUNuRSxNQUFNLG1DQUFtQyxHQUFHLElBQUk7d0JBQy9DLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBZ0I7NEJBQ2pDLElBQUksT0FBTyxFQUFFLENBQUM7Z0NBQ2IsdUJBQXVCO2dDQUN2QixNQUFNLDBCQUEwQixDQUFDLG9EQUFvRCxFQUFFLENBQUM7NEJBQ3pGLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCx1QkFBdUI7Z0NBQ3ZCLElBQUksa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7b0NBQ3hDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQ0FDdEIsQ0FBQztxQ0FBTSxDQUFDO29DQUNQLE1BQU0sT0FBTyxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsMERBQTBELENBQUMsQ0FBQyxDQUFDO29DQUMvSixNQUFNLDBCQUEwQixDQUFDLG9EQUFvRCxFQUFFLENBQUM7b0NBQ3hGLElBQUksT0FBTyxFQUFFLENBQUM7d0NBQ2IsZ0JBQWdCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztvQ0FDeEMsQ0FBQztnQ0FDRixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQztxQkFDRCxDQUFDO29CQUVGLDBEQUEwRDtvQkFDMUQsSUFBSSxDQUFDLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxzQ0FBc0MsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBMUNZLHdIQUFzRDtxRUFBdEQsc0RBQXNEO1FBRWhFLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSxtQkFBWSxDQUFBO1FBQ1osV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLDBEQUFvQyxDQUFBO1FBQ3BDLFdBQUEsaURBQWdDLENBQUE7UUFDaEMsV0FBQSxpREFBZ0MsQ0FBQTtPQVB0QixzREFBc0QsQ0EwQ2xFIn0=