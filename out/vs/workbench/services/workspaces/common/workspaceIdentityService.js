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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/editSessions", "vs/platform/workspace/common/workspace"], function (require, exports, buffer_1, resources_1, uri_1, extensions_1, instantiation_1, editSessions_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceIdentityService = exports.IWorkspaceIdentityService = void 0;
    exports.IWorkspaceIdentityService = (0, instantiation_1.createDecorator)('IWorkspaceIdentityService');
    let WorkspaceIdentityService = class WorkspaceIdentityService {
        constructor(workspaceContextService, editSessionIdentityService) {
            this.workspaceContextService = workspaceContextService;
            this.editSessionIdentityService = editSessionIdentityService;
        }
        async getWorkspaceStateFolders(cancellationToken) {
            const workspaceStateFolders = [];
            for (const workspaceFolder of this.workspaceContextService.getWorkspace().folders) {
                const workspaceFolderIdentity = await this.editSessionIdentityService.getEditSessionIdentifier(workspaceFolder, cancellationToken);
                if (!workspaceFolderIdentity) {
                    continue;
                }
                workspaceStateFolders.push({ resourceUri: workspaceFolder.uri.toString(), workspaceFolderIdentity });
            }
            return workspaceStateFolders;
        }
        async matches(incomingWorkspaceFolders, cancellationToken) {
            const incomingToCurrentWorkspaceFolderUris = {};
            const incomingIdentitiesToIncomingWorkspaceFolders = {};
            for (const workspaceFolder of incomingWorkspaceFolders) {
                incomingIdentitiesToIncomingWorkspaceFolders[workspaceFolder.workspaceFolderIdentity] = workspaceFolder.resourceUri;
            }
            // Precompute the identities of the current workspace folders
            const currentWorkspaceFoldersToIdentities = new Map();
            for (const workspaceFolder of this.workspaceContextService.getWorkspace().folders) {
                const workspaceFolderIdentity = await this.editSessionIdentityService.getEditSessionIdentifier(workspaceFolder, cancellationToken);
                if (!workspaceFolderIdentity) {
                    continue;
                }
                currentWorkspaceFoldersToIdentities.set(workspaceFolder, workspaceFolderIdentity);
            }
            // Match the current workspace folders to the incoming workspace folders
            for (const [currentWorkspaceFolder, currentWorkspaceFolderIdentity] of currentWorkspaceFoldersToIdentities.entries()) {
                // Happy case: identities do not need further disambiguation
                const incomingWorkspaceFolder = incomingIdentitiesToIncomingWorkspaceFolders[currentWorkspaceFolderIdentity];
                if (incomingWorkspaceFolder) {
                    // There is an incoming workspace folder with the exact same identity as the current workspace folder
                    incomingToCurrentWorkspaceFolderUris[incomingWorkspaceFolder] = currentWorkspaceFolder.uri.toString();
                    continue;
                }
                // Unhappy case: compare the identity of the current workspace folder to all incoming workspace folder identities
                let hasCompleteMatch = false;
                for (const [incomingIdentity, incomingFolder] of Object.entries(incomingIdentitiesToIncomingWorkspaceFolders)) {
                    if (await this.editSessionIdentityService.provideEditSessionIdentityMatch(currentWorkspaceFolder, currentWorkspaceFolderIdentity, incomingIdentity, cancellationToken) === editSessions_1.EditSessionIdentityMatch.Complete) {
                        incomingToCurrentWorkspaceFolderUris[incomingFolder] = currentWorkspaceFolder.uri.toString();
                        hasCompleteMatch = true;
                        break;
                    }
                }
                if (hasCompleteMatch) {
                    continue;
                }
                return false;
            }
            const convertUri = (uriToConvert) => {
                // Figure out which current folder the incoming URI is a child of
                for (const incomingFolderUriKey of Object.keys(incomingToCurrentWorkspaceFolderUris)) {
                    const incomingFolderUri = uri_1.URI.parse(incomingFolderUriKey);
                    if ((0, resources_1.isEqualOrParent)(incomingFolderUri, uriToConvert)) {
                        const currentWorkspaceFolderUri = incomingToCurrentWorkspaceFolderUris[incomingFolderUriKey];
                        // Compute the relative file path section of the uri to convert relative to the folder it came from
                        const relativeFilePath = (0, resources_1.relativePath)(incomingFolderUri, uriToConvert);
                        // Reparent the relative file path under the current workspace folder it belongs to
                        if (relativeFilePath) {
                            return (0, resources_1.joinPath)(uri_1.URI.parse(currentWorkspaceFolderUri), relativeFilePath);
                        }
                    }
                }
                // No conversion was possible; return the original URI
                return uriToConvert;
            };
            // Recursively look for any URIs in the provided object and
            // replace them with the URIs of the current workspace folders
            const uriReplacer = (obj, depth = 0) => {
                if (!obj || depth > 200) {
                    return obj;
                }
                if (obj instanceof buffer_1.VSBuffer || obj instanceof Uint8Array) {
                    return obj;
                }
                if (uri_1.URI.isUri(obj)) {
                    return convertUri(obj);
                }
                if (Array.isArray(obj)) {
                    for (let i = 0; i < obj.length; ++i) {
                        obj[i] = uriReplacer(obj[i], depth + 1);
                    }
                }
                else {
                    // walk object
                    for (const key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) {
                            obj[key] = uriReplacer(obj[key], depth + 1);
                        }
                    }
                }
                return obj;
            };
            return uriReplacer;
        }
    };
    exports.WorkspaceIdentityService = WorkspaceIdentityService;
    exports.WorkspaceIdentityService = WorkspaceIdentityService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, editSessions_1.IEditSessionIdentityService)
    ], WorkspaceIdentityService);
    (0, extensions_1.registerSingleton)(exports.IWorkspaceIdentityService, WorkspaceIdentityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlSWRlbnRpdHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtzcGFjZXMvY29tbW9uL3dvcmtzcGFjZUlkZW50aXR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZbkYsUUFBQSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDJCQUEyQixDQUFDLENBQUM7SUFPMUcsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBd0I7UUFHcEMsWUFDNEMsdUJBQWlELEVBQzlDLDBCQUF1RDtZQUQxRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7UUFDbEcsQ0FBQztRQUVMLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBb0M7WUFDbEUsTUFBTSxxQkFBcUIsR0FBNEIsRUFBRSxDQUFDO1lBRTFELEtBQUssTUFBTSxlQUFlLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuRixNQUFNLHVCQUF1QixHQUFHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLHdCQUF3QixDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNuSSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFBQyxTQUFTO2dCQUFDLENBQUM7Z0JBQzNDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztZQUN0RyxDQUFDO1lBRUQsT0FBTyxxQkFBcUIsQ0FBQztRQUM5QixDQUFDO1FBRUQs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