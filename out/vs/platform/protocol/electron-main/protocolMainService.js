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
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/parts/ipc/electron-main/ipcMain", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, electron_1, lifecycle_1, network_1, path_1, platform_1, ternarySearchTree_1, uri_1, uuid_1, ipcMain_1, environment_1, log_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProtocolMainService = void 0;
    let ProtocolMainService = class ProtocolMainService extends lifecycle_1.Disposable {
        constructor(environmentService, userDataProfilesService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.validRoots = ternarySearchTree_1.TernarySearchTree.forPaths(!platform_1.isLinux);
            this.validExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.mp4']); // https://github.com/microsoft/vscode/issues/119384
            // Define an initial set of roots we allow loading from
            // - appRoot	: all files installed as part of the app
            // - extensions : all files shipped from extensions
            // - storage    : all files in global and workspace storage (https://github.com/microsoft/vscode/issues/116735)
            this.addValidFileRoot(environmentService.appRoot);
            this.addValidFileRoot(environmentService.extensionsPath);
            this.addValidFileRoot(userDataProfilesService.defaultProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath);
            this.addValidFileRoot(environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath);
            // Handle protocols
            this.handleProtocols();
        }
        handleProtocols() {
            const { defaultSession } = electron_1.session;
            // Register vscode-file:// handler
            defaultSession.protocol.registerFileProtocol(network_1.Schemas.vscodeFileResource, (request, callback) => this.handleResourceRequest(request, callback));
            // Block any file:// access
            defaultSession.protocol.interceptFileProtocol(network_1.Schemas.file, (request, callback) => this.handleFileRequest(request, callback));
            // Cleanup
            this._register((0, lifecycle_1.toDisposable)(() => {
                defaultSession.protocol.unregisterProtocol(network_1.Schemas.vscodeFileResource);
                defaultSession.protocol.uninterceptProtocol(network_1.Schemas.file);
            }));
        }
        addValidFileRoot(root) {
            // Pass to `normalize` because we later also do the
            // same for all paths to check against.
            const normalizedRoot = (0, path_1.normalize)(root);
            if (!this.validRoots.get(normalizedRoot)) {
                this.validRoots.set(normalizedRoot, true);
                return (0, lifecycle_1.toDisposable)(() => this.validRoots.delete(normalizedRoot));
            }
            return lifecycle_1.Disposable.None;
        }
        //#region file://
        handleFileRequest(request, callback) {
            const uri = uri_1.URI.parse(request.url);
            this.logService.error(`Refused to load resource ${uri.fsPath} from ${network_1.Schemas.file}: protocol (original URL: ${request.url})`);
            return callback({ error: -3 /* ABORTED */ });
        }
        //#endregion
        //#region vscode-file://
        handleResourceRequest(request, callback) {
            const path = this.requestToNormalizedFilePath(request);
            let headers;
            if (this.environmentService.crossOriginIsolated) {
                if ((0, path_1.basename)(path) === 'workbench.html' || (0, path_1.basename)(path) === 'workbench-dev.html') {
                    headers = network_1.COI.CoopAndCoep;
                }
                else {
                    headers = network_1.COI.getHeadersFromQuery(request.url);
                }
            }
            // first check by validRoots
            if (this.validRoots.findSubstr(path)) {
                return callback({ path, headers });
            }
            // then check by validExtensions
            if (this.validExtensions.has((0, path_1.extname)(path).toLowerCase())) {
                return callback({ path });
            }
            // finally block to load the resource
            this.logService.error(`${network_1.Schemas.vscodeFileResource}: Refused to load resource ${path} from ${network_1.Schemas.vscodeFileResource}: protocol (original URL: ${request.url})`);
            return callback({ error: -3 /* ABORTED */ });
        }
        requestToNormalizedFilePath(request) {
            // 1.) Use `URI.parse()` util from us to convert the raw
            //     URL into our URI.
            const requestUri = uri_1.URI.parse(request.url);
            // 2.) Use `FileAccess.asFileUri` to convert back from a
            //     `vscode-file:` URI to a `file:` URI.
            const unnormalizedFileUri = network_1.FileAccess.uriToFileUri(requestUri);
            // 3.) Strip anything from the URI that could result in
            //     relative paths (such as "..") by using `normalize`
            return (0, path_1.normalize)(unnormalizedFileUri.fsPath);
        }
        //#endregion
        //#region IPC Object URLs
        createIPCObjectUrl() {
            let obj = undefined;
            // Create unique URI
            const resource = uri_1.URI.from({
                scheme: 'vscode', // used for all our IPC communication (vscode:<channel>)
                path: (0, uuid_1.generateUuid)()
            });
            // Install IPC handler
            const channel = resource.toString();
            const handler = async () => obj;
            ipcMain_1.validatedIpcMain.handle(channel, handler);
            this.logService.trace(`IPC Object URL: Registered new channel ${channel}.`);
            return {
                resource,
                update: updatedObj => obj = updatedObj,
                dispose: () => {
                    this.logService.trace(`IPC Object URL: Removed channel ${channel}.`);
                    ipcMain_1.validatedIpcMain.removeHandler(channel);
                }
            };
        }
    };
    exports.ProtocolMainService = ProtocolMainService;
    exports.ProtocolMainService = ProtocolMainService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, log_1.ILogService)
    ], ProtocolMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG9jb2xNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb3RvY29sL2VsZWN0cm9uLW1haW4vcHJvdG9jb2xNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFPbEQsWUFDNEIsa0JBQThELEVBQy9ELHVCQUFpRCxFQUM5RCxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUpvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTJCO1lBRTNELGVBQVUsR0FBVixVQUFVLENBQWE7WUFOckMsZUFBVSxHQUFHLHFDQUFpQixDQUFDLFFBQVEsQ0FBVSxDQUFDLGtCQUFPLENBQUMsQ0FBQztZQUMzRCxvQkFBZSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxvREFBb0Q7WUFTbkssdURBQXVEO1lBQ3ZELHFEQUFxRDtZQUNyRCxtREFBbUQ7WUFDbkQsK0dBQStHO1lBQy9HLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJHLG1CQUFtQjtZQUNuQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVPLGVBQWU7WUFDdEIsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLGtCQUFPLENBQUM7WUFFbkMsa0NBQWtDO1lBQ2xDLGNBQWMsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUUvSSwyQkFBMkI7WUFDM0IsY0FBYyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUU5SCxVQUFVO1lBQ1YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUNoQyxjQUFjLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDdkUsY0FBYyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsZ0JBQWdCLENBQUMsSUFBWTtZQUU1QixtREFBbUQ7WUFDbkQsdUNBQXVDO1lBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUEsZ0JBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUV2QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUxQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxpQkFBaUI7UUFFVCxpQkFBaUIsQ0FBQyxPQUFpQyxFQUFFLFFBQTBCO1lBQ3RGLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRW5DLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDRCQUE0QixHQUFHLENBQUMsTUFBTSxTQUFTLGlCQUFPLENBQUMsSUFBSSw2QkFBNkIsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFFOUgsT0FBTyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsWUFBWTtRQUVaLHdCQUF3QjtRQUVoQixxQkFBcUIsQ0FBQyxPQUFpQyxFQUFFLFFBQTBCO1lBQzFGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV2RCxJQUFJLE9BQTJDLENBQUM7WUFDaEQsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsS0FBSyxnQkFBZ0IsSUFBSSxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsS0FBSyxvQkFBb0IsRUFBRSxDQUFDO29CQUNwRixPQUFPLEdBQUcsYUFBRyxDQUFDLFdBQVcsQ0FBQztnQkFDM0IsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sR0FBRyxhQUFHLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO1lBQ0YsQ0FBQztZQUVELDRCQUE0QjtZQUM1QixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sUUFBUSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELGdDQUFnQztZQUNoQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDM0QsT0FBTyxRQUFRLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxxQ0FBcUM7WUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxpQkFBTyxDQUFDLGtCQUFrQiw4QkFBOEIsSUFBSSxTQUFTLGlCQUFPLENBQUMsa0JBQWtCLDZCQUE2QixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUVySyxPQUFPLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTywyQkFBMkIsQ0FBQyxPQUFpQztZQUVwRSx3REFBd0Q7WUFDeEQsd0JBQXdCO1lBQ3hCLE1BQU0sVUFBVSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTFDLHdEQUF3RDtZQUN4RCwyQ0FBMkM7WUFDM0MsTUFBTSxtQkFBbUIsR0FBRyxvQkFBVSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVoRSx1REFBdUQ7WUFDdkQseURBQXlEO1lBQ3pELE9BQU8sSUFBQSxnQkFBUyxFQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxZQUFZO1FBRVoseUJBQXlCO1FBRXpCLGtCQUFrQjtZQUNqQixJQUFJLEdBQUcsR0FBa0IsU0FBUyxDQUFDO1lBRW5DLG9CQUFvQjtZQUNwQixNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDO2dCQUN6QixNQUFNLEVBQUUsUUFBUSxFQUFFLHdEQUF3RDtnQkFDMUUsSUFBSSxFQUFFLElBQUEsbUJBQVksR0FBRTthQUNwQixDQUFDLENBQUM7WUFFSCxzQkFBc0I7WUFDdEIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLEtBQUssSUFBNEIsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUN4RCwwQkFBZ0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBRTVFLE9BQU87Z0JBQ04sUUFBUTtnQkFDUixNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsVUFBVTtnQkFDdEMsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsT0FBTyxHQUFHLENBQUMsQ0FBQztvQkFFckUsMEJBQWdCLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QyxDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7S0FHRCxDQUFBO0lBbkpZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBUTdCLFdBQUEsdUNBQXlCLENBQUE7UUFDekIsV0FBQSwwQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLGlCQUFXLENBQUE7T0FWRCxtQkFBbUIsQ0FtSi9CIn0=