/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/nls", "vs/workbench/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, glob, network_1, path_1, resources_1, nls_1, configuration_1, configurationRegistry_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvedStatus = exports.RegisteredEditorPriority = exports.editorsAssociationsSettingId = exports.IEditorResolverService = void 0;
    exports.priorityToRank = priorityToRank;
    exports.globMatchesResource = globMatchesResource;
    exports.IEditorResolverService = (0, instantiation_1.createDecorator)('editorResolverService');
    exports.editorsAssociationsSettingId = 'workbench.editorAssociations';
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const editorAssociationsConfigurationNode = {
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.editorAssociations': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('editor.editorAssociations', "Configure [glob patterns](https://aka.ms/vscode-glob-patterns) to editors (for example `\"*.hex\": \"hexEditor.hexedit\"`). These have precedence over the default behavior."),
                additionalProperties: {
                    type: 'string'
                }
            }
        }
    };
    configurationRegistry.registerConfiguration(editorAssociationsConfigurationNode);
    //#endregion
    //#region EditorResolverService types
    var RegisteredEditorPriority;
    (function (RegisteredEditorPriority) {
        RegisteredEditorPriority["builtin"] = "builtin";
        RegisteredEditorPriority["option"] = "option";
        RegisteredEditorPriority["exclusive"] = "exclusive";
        RegisteredEditorPriority["default"] = "default";
    })(RegisteredEditorPriority || (exports.RegisteredEditorPriority = RegisteredEditorPriority = {}));
    /**
     * If we didn't resolve an editor dictates what to do with the opening state
     * ABORT = Do not continue with opening the editor
     * NONE = Continue as if the resolution has been disabled as the service could not resolve one
     */
    var ResolvedStatus;
    (function (ResolvedStatus) {
        ResolvedStatus[ResolvedStatus["ABORT"] = 1] = "ABORT";
        ResolvedStatus[ResolvedStatus["NONE"] = 2] = "NONE";
    })(ResolvedStatus || (exports.ResolvedStatus = ResolvedStatus = {}));
    //#endregion
    //#region Util functions
    function priorityToRank(priority) {
        switch (priority) {
            case RegisteredEditorPriority.exclusive:
                return 5;
            case RegisteredEditorPriority.default:
                return 4;
            case RegisteredEditorPriority.builtin:
                return 3;
            // Text editor is priority 2
            case RegisteredEditorPriority.option:
            default:
                return 1;
        }
    }
    function globMatchesResource(globPattern, resource) {
        const excludedSchemes = new Set([
            network_1.Schemas.extension,
            network_1.Schemas.webviewPanel,
            network_1.Schemas.vscodeWorkspaceTrust,
            network_1.Schemas.vscodeSettings
        ]);
        // We want to say that the above schemes match no glob patterns
        if (excludedSchemes.has(resource.scheme)) {
            return false;
        }
        const matchOnPath = typeof globPattern === 'string' && globPattern.indexOf(path_1.posix.sep) >= 0;
        const target = matchOnPath ? `${resource.scheme}:${resource.path}` : (0, resources_1.basename)(resource);
        return glob.match(typeof globPattern === 'string' ? globPattern.toLowerCase() : globPattern, target.toLowerCase());
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci9jb21tb24vZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStMaEcsd0NBYUM7SUFFRCxrREFjQztJQXhNWSxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsdUJBQXVCLENBQUMsQ0FBQztJQWExRixRQUFBLDRCQUE0QixHQUFHLDhCQUE4QixDQUFDO0lBRTNFLE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXpHLE1BQU0sbUNBQW1DLEdBQXVCO1FBQy9ELEdBQUcsOENBQThCO1FBQ2pDLFVBQVUsRUFBRTtZQUNYLDhCQUE4QixFQUFFO2dCQUMvQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxtQkFBbUIsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSw4S0FBOEssQ0FBQztnQkFDMU8sb0JBQW9CLEVBQUU7b0JBQ3JCLElBQUksRUFBRSxRQUFRO2lCQUNkO2FBQ0Q7U0FDRDtLQUNELENBQUM7SUFRRixxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBQ2pGLFlBQVk7SUFFWixxQ0FBcUM7SUFDckMsSUFBWSx3QkFLWDtJQUxELFdBQVksd0JBQXdCO1FBQ25DLCtDQUFtQixDQUFBO1FBQ25CLDZDQUFpQixDQUFBO1FBQ2pCLG1EQUF1QixDQUFBO1FBQ3ZCLCtDQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFMVyx3QkFBd0Isd0NBQXhCLHdCQUF3QixRQUtuQztJQUVEOzs7O09BSUc7SUFDSCxJQUFrQixjQUdqQjtJQUhELFdBQWtCLGNBQWM7UUFDL0IscURBQVMsQ0FBQTtRQUNULG1EQUFRLENBQUE7SUFDVCxDQUFDLEVBSGlCLGNBQWMsOEJBQWQsY0FBYyxRQUcvQjtJQWlIRCxZQUFZO0lBRVosd0JBQXdCO0lBQ3hCLFNBQWdCLGNBQWMsQ0FBQyxRQUFrQztRQUNoRSxRQUFRLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLEtBQUssd0JBQXdCLENBQUMsU0FBUztnQkFDdEMsT0FBTyxDQUFDLENBQUM7WUFDVixLQUFLLHdCQUF3QixDQUFDLE9BQU87Z0JBQ3BDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsS0FBSyx3QkFBd0IsQ0FBQyxPQUFPO2dCQUNwQyxPQUFPLENBQUMsQ0FBQztZQUNWLDRCQUE0QjtZQUM1QixLQUFLLHdCQUF3QixDQUFDLE1BQU0sQ0FBQztZQUNyQztnQkFDQyxPQUFPLENBQUMsQ0FBQztRQUNYLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUMsV0FBMkMsRUFBRSxRQUFhO1FBQzdGLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDO1lBQy9CLGlCQUFPLENBQUMsU0FBUztZQUNqQixpQkFBTyxDQUFDLFlBQVk7WUFDcEIsaUJBQU8sQ0FBQyxvQkFBb0I7WUFDNUIsaUJBQU8sQ0FBQyxjQUFjO1NBQ3RCLENBQUMsQ0FBQztRQUNILCtEQUErRDtRQUMvRCxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDMUMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsTUFBTSxXQUFXLEdBQUcsT0FBTyxXQUFXLEtBQUssUUFBUSxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsWUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQztRQUN4RixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUNwSCxDQUFDOztBQUNELFlBQVkifQ==