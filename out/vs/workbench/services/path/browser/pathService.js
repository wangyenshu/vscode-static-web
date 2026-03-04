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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/path/common/pathService", "vs/base/common/uri", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/base/common/resources"], function (require, exports, extensions_1, remoteAgentService_1, pathService_1, uri_1, environmentService_1, workspace_1, arrays_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserPathService = void 0;
    let BrowserPathService = class BrowserPathService extends pathService_1.AbstractPathService {
        constructor(remoteAgentService, environmentService, contextService) {
            super(guessLocalUserHome(environmentService, contextService), remoteAgentService, environmentService, contextService);
        }
    };
    exports.BrowserPathService = BrowserPathService;
    exports.BrowserPathService = BrowserPathService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], BrowserPathService);
    function guessLocalUserHome(environmentService, contextService) {
        // In web we do not really have the concept of a "local" user home
        // but we still require it in many places as a fallback. As such,
        // we have to come up with a synthetic location derived from the
        // environment.
        const workspace = contextService.getWorkspace();
        const firstFolder = (0, arrays_1.firstOrDefault)(workspace.folders);
        if (firstFolder) {
            return firstFolder.uri;
        }
        if (workspace.configuration) {
            return (0, resources_1.dirname)(workspace.configuration);
        }
        // This is not ideal because with a user home location of `/`, all paths
        // will potentially appear with `~/...`, but at this point we really do
        // not have any other good alternative.
        return uri_1.URI.from({
            scheme: pathService_1.AbstractPathService.findDefaultUriScheme(environmentService, contextService),
            authority: environmentService.remoteAuthority,
            path: '/'
        });
    }
    (0, extensions_1.registerSingleton)(pathService_1.IPathService, BrowserPathService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcGF0aC9icm93c2VyL3BhdGhTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLGlDQUFtQjtRQUUxRCxZQUNzQixrQkFBdUMsRUFDOUIsa0JBQWdELEVBQ3BELGNBQXdDO1lBRWxFLEtBQUssQ0FDSixrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxjQUFjLENBQUMsRUFDdEQsa0JBQWtCLEVBQ2xCLGtCQUFrQixFQUNsQixjQUFjLENBQ2QsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBZFksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFHNUIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsb0NBQXdCLENBQUE7T0FMZCxrQkFBa0IsQ0FjOUI7SUFFRCxTQUFTLGtCQUFrQixDQUFDLGtCQUFnRCxFQUFFLGNBQXdDO1FBRXJILGtFQUFrRTtRQUNsRSxpRUFBaUU7UUFDakUsZ0VBQWdFO1FBQ2hFLGVBQWU7UUFFZixNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFaEQsTUFBTSxXQUFXLEdBQUcsSUFBQSx1QkFBYyxFQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0RCxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0IsT0FBTyxJQUFBLG1CQUFPLEVBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCx3RUFBd0U7UUFDeEUsdUVBQXVFO1FBQ3ZFLHVDQUF1QztRQUV2QyxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZixNQUFNLEVBQUUsaUNBQW1CLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLEVBQUUsY0FBYyxDQUFDO1lBQ3BGLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxlQUFlO1lBQzdDLElBQUksRUFBRSxHQUFHO1NBQ1QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELElBQUEsOEJBQWlCLEVBQUMsMEJBQVksRUFBRSxrQkFBa0Isb0NBQTRCLENBQUMifQ==