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
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, extpath_1, network_1, path_1, platform_1, resources_1, uri_1, instantiation_1, virtualWorkspace_1, workspace_1, environmentService_1, remoteAgentService_1) {
    "use strict";
    var AbstractPathService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractPathService = exports.IPathService = void 0;
    exports.IPathService = (0, instantiation_1.createDecorator)('pathService');
    let AbstractPathService = AbstractPathService_1 = class AbstractPathService {
        constructor(localUserHome, remoteAgentService, environmentService, contextService) {
            this.localUserHome = localUserHome;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            // OS
            this.resolveOS = (async () => {
                const env = await this.remoteAgentService.getEnvironment();
                return env?.os || platform_1.OS;
            })();
            // User Home
            this.resolveUserHome = (async () => {
                const env = await this.remoteAgentService.getEnvironment();
                const userHome = this.maybeUnresolvedUserHome = env?.userHome ?? localUserHome;
                return userHome;
            })();
        }
        hasValidBasename(resource, arg2, basename) {
            // async version
            if (typeof arg2 === 'string' || typeof arg2 === 'undefined') {
                return this.resolveOS.then(os => this.doHasValidBasename(resource, os, arg2));
            }
            // sync version
            return this.doHasValidBasename(resource, arg2, basename);
        }
        doHasValidBasename(resource, os, name) {
            // Our `isValidBasename` method only works with our
            // standard schemes for files on disk, either locally
            // or remote.
            if (resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.vscodeRemote) {
                return (0, extpath_1.isValidBasename)(name ?? (0, resources_1.basename)(resource), os === 1 /* OperatingSystem.Windows */);
            }
            return true;
        }
        get defaultUriScheme() {
            return AbstractPathService_1.findDefaultUriScheme(this.environmentService, this.contextService);
        }
        static findDefaultUriScheme(environmentService, contextService) {
            if (environmentService.remoteAuthority) {
                return network_1.Schemas.vscodeRemote;
            }
            const virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceScheme)(contextService.getWorkspace());
            if (virtualWorkspace) {
                return virtualWorkspace;
            }
            const firstFolder = contextService.getWorkspace().folders[0];
            if (firstFolder) {
                return firstFolder.uri.scheme;
            }
            const configuration = contextService.getWorkspace().configuration;
            if (configuration) {
                return configuration.scheme;
            }
            return network_1.Schemas.file;
        }
        userHome(options) {
            return options?.preferLocal ? this.localUserHome : this.resolveUserHome;
        }
        get resolvedUserHome() {
            return this.maybeUnresolvedUserHome;
        }
        get path() {
            return this.resolveOS.then(os => {
                return os === 1 /* OperatingSystem.Windows */ ?
                    path_1.win32 :
                    path_1.posix;
            });
        }
        async fileURI(_path) {
            let authority = '';
            // normalize to fwd-slashes on windows,
            // on other systems bwd-slashes are valid
            // filename character, eg /f\oo/ba\r.txt
            const os = await this.resolveOS;
            if (os === 1 /* OperatingSystem.Windows */) {
                _path = _path.replace(/\\/g, '/');
            }
            // check for authority as used in UNC shares
            // or use the path as given
            if (_path[0] === '/' && _path[1] === '/') {
                const idx = _path.indexOf('/', 2);
                if (idx === -1) {
                    authority = _path.substring(2);
                    _path = '/';
                }
                else {
                    authority = _path.substring(2, idx);
                    _path = _path.substring(idx) || '/';
                }
            }
            return uri_1.URI.from({
                scheme: network_1.Schemas.file,
                authority,
                path: _path,
                query: '',
                fragment: ''
            });
        }
    };
    exports.AbstractPathService = AbstractPathService;
    exports.AbstractPathService = AbstractPathService = AbstractPathService_1 = __decorate([
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], AbstractPathService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcGF0aC9jb21tb24vcGF0aFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWNuRixRQUFBLFlBQVksR0FBRyxJQUFBLCtCQUFlLEVBQWUsYUFBYSxDQUFDLENBQUM7SUErRGxFLElBQWUsbUJBQW1CLDJCQUFsQyxNQUFlLG1CQUFtQjtRQVN4QyxZQUNTLGFBQWtCLEVBQ1ksa0JBQXVDLEVBQzlCLGtCQUFnRCxFQUM3RCxjQUF3QztZQUhsRSxrQkFBYSxHQUFiLGFBQWEsQ0FBSztZQUNZLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDOUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUM3RCxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFHMUUsS0FBSztZQUNMLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDNUIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBRTNELE9BQU8sR0FBRyxFQUFFLEVBQUUsSUFBSSxhQUFFLENBQUM7WUFDdEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUVMLFlBQVk7WUFDWixJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ2xDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUMzRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsR0FBRyxFQUFFLFFBQVEsSUFBSSxhQUFhLENBQUM7Z0JBRS9FLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENB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