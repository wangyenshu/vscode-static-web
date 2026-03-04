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
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/base/common/types", "vs/platform/log/common/log", "vs/platform/utilityProcess/electron-main/utilityProcess"], function (require, exports, electron_1, ipcMain_1, cancellation_1, instantiation_1, windows_1, workspace_1, workspacesManagementMainService_1, types_1, log_1, utilityProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticsMainService = exports.IDiagnosticsMainService = exports.ID = void 0;
    exports.ID = 'diagnosticsMainService';
    exports.IDiagnosticsMainService = (0, instantiation_1.createDecorator)(exports.ID);
    let DiagnosticsMainService = class DiagnosticsMainService {
        constructor(windowsMainService, workspacesManagementMainService, logService) {
            this.windowsMainService = windowsMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.logService = logService;
        }
        async getRemoteDiagnostics(options) {
            const windows = this.windowsMainService.getWindows();
            const diagnostics = await Promise.all(windows.map(async (window) => {
                const remoteAuthority = window.remoteAuthority;
                if (!remoteAuthority) {
                    return undefined;
                }
                const replyChannel = `vscode:getDiagnosticInfoResponse${window.id}`;
                const args = {
                    includeProcesses: options.includeProcesses,
                    folders: options.includeWorkspaceMetadata ? await this.getFolderURIs(window) : undefined
                };
                return new Promise(resolve => {
                    window.sendWhenReady('vscode:getDiagnosticInfo', cancellation_1.CancellationToken.None, { replyChannel, args });
                    ipcMain_1.validatedIpcMain.once(replyChannel, (_, data) => {
                        // No data is returned if getting the connection fails.
                        if (!data) {
                            resolve({ hostName: remoteAuthority, errorMessage: `Unable to resolve connection to '${remoteAuthority}'.` });
                        }
                        resolve(data);
                    });
                    setTimeout(() => {
                        resolve({ hostName: remoteAuthority, errorMessage: `Connection to '${remoteAuthority}' could not be established` });
                    }, 5000);
                });
            }));
            return diagnostics.filter((x) => !!x);
        }
        async getMainDiagnostics() {
            this.logService.trace('Received request for main process info from other instance.');
            const windows = [];
            for (const window of electron_1.BrowserWindow.getAllWindows()) {
                const codeWindow = this.windowsMainService.getWindowById(window.id);
                if (codeWindow) {
                    windows.push(await this.codeWindowToInfo(codeWindow));
                }
                else {
                    windows.push(this.browserWindowToInfo(window));
                }
            }
            const pidToNames = [];
            for (const { pid, name } of utilityProcess_1.UtilityProcess.getAll()) {
                pidToNames.push({ pid, name });
            }
            return {
                mainPID: process.pid,
                mainArguments: process.argv.slice(1),
                windows,
                pidToNames,
                screenReader: !!electron_1.app.accessibilitySupportEnabled,
                gpuFeatureStatus: electron_1.app.getGPUFeatureStatus()
            };
        }
        async codeWindowToInfo(window) {
            const folderURIs = await this.getFolderURIs(window);
            const win = (0, types_1.assertIsDefined)(window.win);
            return this.browserWindowToInfo(win, folderURIs, window.remoteAuthority);
        }
        browserWindowToInfo(window, folderURIs = [], remoteAuthority) {
            return {
                id: window.id,
                pid: window.webContents.getOSProcessId(),
                title: window.getTitle(),
                folderURIs,
                remoteAuthority
            };
        }
        async getFolderURIs(window) {
            const folderURIs = [];
            const workspace = window.openedWorkspace;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                folderURIs.push(workspace.uri);
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                const resolvedWorkspace = await this.workspacesManagementMainService.resolveLocalWorkspace(workspace.configPath); // workspace folders can only be shown for local (resolved) workspaces
                if (resolvedWorkspace) {
                    const rootFolders = resolvedWorkspace.folders;
                    rootFolders.forEach(root => {
                        folderURIs.push(root.uri);
                    });
                }
            }
            return folderURIs;
        }
    };
    exports.DiagnosticsMainService = DiagnosticsMainService;
    exports.DiagnosticsMainService = DiagnosticsMainService = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(2, log_1.ILogService)
    ], DiagnosticsMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3NNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2RpYWdub3N0aWNzL2VsZWN0cm9uLW1haW4vZGlhZ25vc3RpY3NNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQm5GLFFBQUEsRUFBRSxHQUFHLHdCQUF3QixDQUFDO0lBQzlCLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwrQkFBZSxFQUEwQixVQUFFLENBQUMsQ0FBQztJQWE3RSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUlsQyxZQUN1QyxrQkFBdUMsRUFDMUIsK0JBQWlFLEVBQ3RGLFVBQXVCO1lBRmYsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMxQixvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQ3RGLGVBQVUsR0FBVixVQUFVLENBQWE7UUFDbEQsQ0FBQztRQUVMLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUFpQztZQUMzRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDckQsTUFBTSxXQUFXLEdBQWdFLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxNQUFNLEVBQUMsRUFBRTtnQkFDN0gsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUN0QixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxNQUFNLFlBQVksR0FBRyxtQ0FBbUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNwRSxNQUFNLElBQUksR0FBMkI7b0JBQ3BDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxnQkFBZ0I7b0JBQzFDLE9BQU8sRUFBRSxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztpQkFDeEYsQ0FBQztnQkFFRixPQUFPLElBQUksT0FBTyxDQUEyQyxPQUFPLENBQUMsRUFBRTtvQkFDdEUsTUFBTSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFFakcsMEJBQWdCLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQVcsRUFBRSxJQUEyQixFQUFFLEVBQUU7d0JBQ2hGLHVEQUF1RDt3QkFDdkQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUNYLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLG9DQUFvQyxlQUFlLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQy9HLENBQUM7d0JBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNmLENBQUMsQ0FBQyxDQUFDO29CQUVILFVBQVUsQ0FBQyxHQUFHLEVBQUU7d0JBQ2YsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLGVBQWUsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO29CQUNySCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ1YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUF1RCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFRCxLQUFLLENBQUMsa0JBQWtCO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDZEQUE2RCxDQUFDLENBQUM7WUFFckYsTUFBTSxPQUFPLEdBQXlCLEVBQUUsQ0FBQztZQUN6QyxLQUFLLE1BQU0sTUFBTSxJQUFJLHdCQUFhLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQTBCLEVBQUUsQ0FBQztZQUM3QyxLQUFLLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksK0JBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUVELE9BQU87Z0JBQ04sT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHO2dCQUNwQixhQUFhLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxPQUFPO2dCQUNQLFVBQVU7Z0JBQ1YsWUFBWSxFQUFFLENBQUMsQ0FBQyxjQUFHLENBQUMsMkJBQTJCO2dCQUMvQyxnQkFBZ0IsRUFBRSxjQUFHLENBQUMsbUJBQW1CLEVBQUU7YUFDM0MsQ0FBQztRQUNILENBQUM7UUFFTyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBbUI7WUFDakQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELE1BQU0sR0FBRyxHQUFHLElBQUEsdUJBQWUsRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFeEMsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVPLG1CQUFtQixDQUFDLE1BQXFCLEVBQUUsYUFBb0IsRUFBRSxFQUFFLGVBQXdCO1lBQ2xHLE9BQU87Z0JBQ04sRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNiLEdBQUcsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRTtnQkFDeEMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7Z0JBQ3hCLFVBQVU7Z0JBQ1YsZUFBZTthQUNmLENBQUM7UUFDSCxDQUFDO1FBRU8sS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFtQjtZQUM5QyxNQUFNLFVBQVUsR0FBVSxFQUFFLENBQUM7WUFFN0IsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUN6QyxJQUFJLElBQUEsNkNBQWlDLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDbEQsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsQ0FBQztpQkFBTSxJQUFJLElBQUEsaUNBQXFCLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxzRUFBc0U7Z0JBQ3hMLElBQUksaUJBQWlCLEVBQUUsQ0FBQztvQkFDdkIsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDO29CQUM5QyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUMxQixVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO0tBQ0QsQ0FBQTtJQTVHWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQUtoQyxXQUFBLDZCQUFtQixDQUFBO1FBQ25CLFdBQUEsa0VBQWdDLENBQUE7UUFDaEMsV0FBQSxpQkFBVyxDQUFBO09BUEQsc0JBQXNCLENBNEdsQyJ9