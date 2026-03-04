/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/node/uriTransformer", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/path", "vs/platform/files/node/diskFileSystemProviderServer"], function (require, exports, uri_1, uriTransformer_1, diskFileSystemProvider_1, path_1, diskFileSystemProviderServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentFileSystemProviderChannel = void 0;
    class RemoteAgentFileSystemProviderChannel extends diskFileSystemProviderServer_1.AbstractDiskFileSystemProviderChannel {
        constructor(logService, environmentService) {
            super(new diskFileSystemProvider_1.DiskFileSystemProvider(logService), logService);
            this.environmentService = environmentService;
            this.uriTransformerCache = new Map();
            this._register(this.provider);
        }
        getUriTransformer(ctx) {
            let transformer = this.uriTransformerCache.get(ctx.remoteAuthority);
            if (!transformer) {
                transformer = (0, uriTransformer_1.createURITransformer)(ctx.remoteAuthority);
                this.uriTransformerCache.set(ctx.remoteAuthority, transformer);
            }
            return transformer;
        }
        transformIncoming(uriTransformer, _resource, supportVSCodeResource = false) {
            if (supportVSCodeResource && _resource.path === '/vscode-resource' && _resource.query) {
                const requestResourcePath = JSON.parse(_resource.query).requestResourcePath;
                return uri_1.URI.from({ scheme: 'file', path: requestResourcePath });
            }
            return uri_1.URI.revive(uriTransformer.transformIncoming(_resource));
        }
        //#region File Watching
        createSessionFileWatcher(uriTransformer, emitter) {
            return new SessionFileWatcher(uriTransformer, emitter, this.logService, this.environmentService);
        }
    }
    exports.RemoteAgentFileSystemProviderChannel = RemoteAgentFileSystemProviderChannel;
    class SessionFileWatcher extends diskFileSystemProviderServer_1.AbstractSessionFileWatcher {
        constructor(uriTransformer, sessionEmitter, logService, environmentService) {
            super(uriTransformer, sessionEmitter, logService, environmentService);
        }
        getRecursiveWatcherOptions(environmentService) {
            const fileWatcherPolling = environmentService.args['file-watcher-polling'];
            if (fileWatcherPolling) {
                const segments = fileWatcherPolling.split(path_1.delimiter);
                const pollingInterval = Number(segments[0]);
                if (pollingInterval > 0) {
                    const usePolling = segments.length > 1 ? segments.slice(1) : true;
                    return { usePolling, pollingInterval };
                }
            }
            return undefined;
        }
        getExtraExcludes(environmentService) {
            if (environmentService.extensionsPath) {
                // when opening the $HOME folder, we end up watching the extension folder
                // so simply exclude watching the extensions folder
                return [path_1.posix.join(environmentService.extensionsPath, '**')];
            }
            return undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRmlsZVN5c3RlbVByb3ZpZGVyU2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvcmVtb3RlRmlsZVN5c3RlbVByb3ZpZGVyU2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLG9DQUFxQyxTQUFRLG9FQUFtRTtRQUk1SCxZQUNDLFVBQXVCLEVBQ04sa0JBQTZDO1lBRTlELEtBQUssQ0FBQyxJQUFJLCtDQUFzQixDQUFDLFVBQVUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRnpDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMkI7WUFKOUMsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7WUFRekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVrQixpQkFBaUIsQ0FBQyxHQUFpQztZQUNyRSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLFdBQVcsR0FBRyxJQUFBLHFDQUFvQixFQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFFRCxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBRWtCLGlCQUFpQixDQUFDLGNBQStCLEVBQUUsU0FBd0IsRUFBRSxxQkFBcUIsR0FBRyxLQUFLO1lBQzVILElBQUkscUJBQXFCLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxrQkFBa0IsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsbUJBQW1CLENBQUM7Z0JBRTVFLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBRUQsT0FBTyxTQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCx1QkFBdUI7UUFFYix3QkFBd0IsQ0FBQyxjQUErQixFQUFFLE9BQXdDO1lBQzNHLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDbEcsQ0FBQztLQUdEO0lBeENELG9GQXdDQztJQUVELE1BQU0sa0JBQW1CLFNBQVEseURBQTBCO1FBRTFELFlBQ0MsY0FBK0IsRUFDL0IsY0FBK0MsRUFDL0MsVUFBdUIsRUFDdkIsa0JBQTZDO1lBRTdDLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFa0IsMEJBQTBCLENBQUMsa0JBQTZDO1lBQzFGLE1BQU0sa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDM0UsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsZ0JBQVMsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLElBQUksZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN6QixNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNsRSxPQUFPLEVBQUUsVUFBVSxFQUFFLGVBQWUsRUFBRSxDQUFDO2dCQUN4QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFa0IsZ0JBQWdCLENBQUMsa0JBQTZDO1lBQ2hGLElBQUksa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3ZDLHlFQUF5RTtnQkFDekUsbURBQW1EO2dCQUNuRCxPQUFPLENBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNEIn0=