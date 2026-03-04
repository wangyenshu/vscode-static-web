/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/nls", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/path", "vs/platform/files/node/diskFileSystemProviderServer", "vs/base/common/uriIpc", "vs/base/common/errorMessage"], function (require, exports, electron_1, nls_1, platform_1, uri_1, files_1, path_1, diskFileSystemProviderServer_1, uriIpc_1, errorMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProviderChannel = void 0;
    class DiskFileSystemProviderChannel extends diskFileSystemProviderServer_1.AbstractDiskFileSystemProviderChannel {
        constructor(provider, logService, environmentService) {
            super(provider, logService);
            this.environmentService = environmentService;
        }
        getUriTransformer(ctx) {
            return uriIpc_1.DefaultURITransformer;
        }
        transformIncoming(uriTransformer, _resource) {
            return uri_1.URI.revive(_resource);
        }
        //#region Delete: override to support Electron's trash support
        async delete(uriTransformer, _resource, opts) {
            if (!opts.useTrash) {
                return super.delete(uriTransformer, _resource, opts);
            }
            const resource = this.transformIncoming(uriTransformer, _resource);
            const filePath = (0, path_1.normalize)(resource.fsPath);
            try {
                await electron_1.shell.trashItem(filePath);
            }
            catch (error) {
                throw (0, files_1.createFileSystemProviderError)(platform_1.isWindows ? (0, nls_1.localize)('binFailed', "Failed to move '{0}' to the recycle bin ({1})", (0, path_1.basename)(filePath), (0, errorMessage_1.toErrorMessage)(error)) : (0, nls_1.localize)('trashFailed', "Failed to move '{0}' to the trash ({1})", (0, path_1.basename)(filePath), (0, errorMessage_1.toErrorMessage)(error)), files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        //#endregion
        //#region File Watching
        createSessionFileWatcher(uriTransformer, emitter) {
            return new SessionFileWatcher(uriTransformer, emitter, this.logService, this.environmentService);
        }
    }
    exports.DiskFileSystemProviderChannel = DiskFileSystemProviderChannel;
    class SessionFileWatcher extends diskFileSystemProviderServer_1.AbstractSessionFileWatcher {
        watch(req, resource, opts) {
            if (opts.recursive) {
                throw (0, files_1.createFileSystemProviderError)('Recursive file watching is not supported from main process for performance reasons.', files_1.FileSystemProviderErrorCode.Unavailable);
            }
            return super.watch(req, resource, opts);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlclNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2VsZWN0cm9uLW1haW4vZGlza0ZpbGVTeXN0ZW1Qcm92aWRlclNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsNkJBQThCLFNBQVEsb0VBQThDO1FBRWhHLFlBQ0MsUUFBZ0MsRUFDaEMsVUFBdUIsRUFDTixrQkFBdUM7WUFFeEQsS0FBSyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUZYLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7UUFHekQsQ0FBQztRQUVrQixpQkFBaUIsQ0FBQyxHQUFZO1lBQ2hELE9BQU8sOEJBQXFCLENBQUM7UUFDOUIsQ0FBQztRQUVrQixpQkFBaUIsQ0FBQyxjQUErQixFQUFFLFNBQXdCO1lBQzdGLE9BQU8sU0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsOERBQThEO1FBRTNDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBK0IsRUFBRSxTQUF3QixFQUFFLElBQXdCO1lBQ2xILElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sUUFBUSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sZ0JBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsK0NBQStDLEVBQUUsSUFBQSxlQUFRLEVBQUMsUUFBUSxDQUFDLEVBQUUsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSx5Q0FBeUMsRUFBRSxJQUFBLGVBQVEsRUFBQyxRQUFRLENBQUMsRUFBRSxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxtQ0FBMkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6VCxDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQVk7UUFFWix1QkFBdUI7UUFFYix3QkFBd0IsQ0FBQyxjQUErQixFQUFFLE9BQXdDO1lBQzNHLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDbEcsQ0FBQztLQUlEO0lBNUNELHNFQTRDQztJQUVELE1BQU0sa0JBQW1CLFNBQVEseURBQTBCO1FBRWpELEtBQUssQ0FBQyxHQUFXLEVBQUUsUUFBYSxFQUFFLElBQW1CO1lBQzdELElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixNQUFNLElBQUEscUNBQTZCLEVBQUMscUZBQXFGLEVBQUUsbUNBQTJCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDckssQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRCJ9