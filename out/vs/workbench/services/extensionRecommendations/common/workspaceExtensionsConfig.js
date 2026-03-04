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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/workbench/services/configuration/common/jsonEditing", "vs/base/common/map"], function (require, exports, arrays_1, event_1, json_1, lifecycle_1, getIconClasses_1, files_1, extensions_1, instantiation_1, workspace_1, quickInput_1, model_1, language_1, nls_1, jsonEditing_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceExtensionsConfigService = exports.IWorkspaceExtensionsConfigService = exports.EXTENSIONS_CONFIG = void 0;
    exports.EXTENSIONS_CONFIG = '.vscode/extensions.json';
    exports.IWorkspaceExtensionsConfigService = (0, instantiation_1.createDecorator)('IWorkspaceExtensionsConfigService');
    let WorkspaceExtensionsConfigService = class WorkspaceExtensionsConfigService extends lifecycle_1.Disposable {
        constructor(workspaceContextService, fileService, quickInputService, modelService, languageService, jsonEditingService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.jsonEditingService = jsonEditingService;
            this._onDidChangeExtensionsConfigs = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsConfigs = this._onDidChangeExtensionsConfigs.event;
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(e => this._onDidChangeExtensionsConfigs.fire()));
            this._register(fileService.onDidFilesChange(e => {
                const workspace = workspaceContextService.getWorkspace();
                if ((workspace.configuration && e.affects(workspace.configuration))
                    || workspace.folders.some(folder => e.affects(folder.toResource(exports.EXTENSIONS_CONFIG)))) {
                    this._onDidChangeExtensionsConfigs.fire();
                }
            }));
        }
        async getExtensionsConfigs() {
            const workspace = this.workspaceContextService.getWorkspace();
            const result = [];
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            if (workspaceExtensionsConfigContent) {
                result.push(workspaceExtensionsConfigContent);
            }
            result.push(...await Promise.all(workspace.folders.map(workspaceFolder => this.resolveWorkspaceFolderExtensionConfig(workspaceFolder))));
            return result;
        }
        async getRecommendations() {
            const configs = await this.getExtensionsConfigs();
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(configs.map(c => c.recommendations ? c.recommendations.map(c => c.toLowerCase()) : [])));
        }
        async getUnwantedRecommendations() {
            const configs = await this.getExtensionsConfigs();
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(configs.map(c => c.unwantedRecommendations ? c.unwantedRecommendations.map(c => c.toLowerCase()) : [])));
        }
        async toggleRecommendation(extensionId) {
            extensionId = extensionId.toLowerCase();
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            const workspaceFolderExtensionsConfigContents = new map_1.ResourceMap();
            await Promise.all(workspace.folders.map(async (workspaceFolder) => {
                const extensionsConfigContent = await this.resolveWorkspaceFolderExtensionConfig(workspaceFolder);
                workspaceFolderExtensionsConfigContents.set(workspaceFolder.uri, extensionsConfigContent);
            }));
            const isWorkspaceRecommended = workspaceExtensionsConfigContent && workspaceExtensionsConfigContent.recommendations?.some(r => r.toLowerCase() === extensionId);
            const recommendedWorksapceFolders = workspace.folders.filter(workspaceFolder => workspaceFolderExtensionsConfigContents.get(workspaceFolder.uri)?.recommendations?.some(r => r.toLowerCase() === extensionId));
            const isRecommended = isWorkspaceRecommended || recommendedWorksapceFolders.length > 0;
            const workspaceOrFolders = isRecommended
                ? await this.pickWorkspaceOrFolders(recommendedWorksapceFolders, isWorkspaceRecommended ? workspace : undefined, (0, nls_1.localize)('select for remove', "Remove extension recommendation from"))
                : await this.pickWorkspaceOrFolders(workspace.folders, workspace.configuration ? workspace : undefined, (0, nls_1.localize)('select for add', "Add extension recommendation to"));
            for (const workspaceOrWorkspaceFolder of workspaceOrFolders) {
                if ((0, workspace_1.isWorkspace)(workspaceOrWorkspaceFolder)) {
                    await this.addOrRemoveWorkspaceRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceExtensionsConfigContent, !isRecommended);
                }
                else {
                    await this.addOrRemoveWorkspaceFolderRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceFolderExtensionsConfigContents.get(workspaceOrWorkspaceFolder.uri), !isRecommended);
                }
            }
        }
        async toggleUnwantedRecommendation(extensionId) {
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            const workspaceFolderExtensionsConfigContents = new map_1.ResourceMap();
            await Promise.all(workspace.folders.map(async (workspaceFolder) => {
                const extensionsConfigContent = await this.resolveWorkspaceFolderExtensionConfig(workspaceFolder);
                workspaceFolderExtensionsConfigContents.set(workspaceFolder.uri, extensionsConfigContent);
            }));
            const isWorkspaceUnwanted = workspaceExtensionsConfigContent && workspaceExtensionsConfigContent.unwantedRecommendations?.some(r => r === extensionId);
            const unWantedWorksapceFolders = workspace.folders.filter(workspaceFolder => workspaceFolderExtensionsConfigContents.get(workspaceFolder.uri)?.unwantedRecommendations?.some(r => r === extensionId));
            const isUnwanted = isWorkspaceUnwanted || unWantedWorksapceFolders.length > 0;
            const workspaceOrFolders = isUnwanted
                ? await this.pickWorkspaceOrFolders(unWantedWorksapceFolders, isWorkspaceUnwanted ? workspace : undefined, (0, nls_1.localize)('select for remove', "Remove extension recommendation from"))
                : await this.pickWorkspaceOrFolders(workspace.folders, workspace.configuration ? workspace : undefined, (0, nls_1.localize)('select for add', "Add extension recommendation to"));
            for (const workspaceOrWorkspaceFolder of workspaceOrFolders) {
                if ((0, workspace_1.isWorkspace)(workspaceOrWorkspaceFolder)) {
                    await this.addOrRemoveWorkspaceUnwantedRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceExtensionsConfigContent, !isUnwanted);
                }
                else {
                    await this.addOrRemoveWorkspaceFolderUnwantedRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceFolderExtensionsConfigContents.get(workspaceOrWorkspaceFolder.uri), !isUnwanted);
                }
            }
        }
        async addOrRemoveWorkspaceFolderRecommendation(extensionId, workspaceFolder, extensionsConfigContent, add) {
            const values = [];
            if (add) {
                if (Array.isArray(extensionsConfigContent.recommendations)) {
                    values.push({ path: ['recommendations', -1], value: extensionId });
                }
                else {
                    values.push({ path: ['recommendations'], value: [extensionId] });
                }
                const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                if (unwantedRecommendationEdit) {
                    values.push(unwantedRecommendationEdit);
                }
            }
            else if (extensionsConfigContent.recommendations) {
                const recommendationEdit = this.getEditToRemoveValueFromArray(['recommendations'], extensionsConfigContent.recommendations, extensionId);
                if (recommendationEdit) {
                    values.push(recommendationEdit);
                }
            }
            if (values.length) {
                return this.jsonEditingService.write(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG), values, true);
            }
        }
        async addOrRemoveWorkspaceRecommendation(extensionId, workspace, extensionsConfigContent, add) {
            const values = [];
            if (extensionsConfigContent) {
                if (add) {
                    const path = ['extensions', 'recommendations'];
                    if (Array.isArray(extensionsConfigContent.recommendations)) {
                        values.push({ path: [...path, -1], value: extensionId });
                    }
                    else {
                        values.push({ path, value: [extensionId] });
                    }
                    const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                    if (unwantedRecommendationEdit) {
                        values.push(unwantedRecommendationEdit);
                    }
                }
                else if (extensionsConfigContent.recommendations) {
                    const recommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'recommendations'], extensionsConfigContent.recommendations, extensionId);
                    if (recommendationEdit) {
                        values.push(recommendationEdit);
                    }
                }
            }
            else if (add) {
                values.push({ path: ['extensions'], value: { recommendations: [extensionId] } });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspace.configuration, values, true);
            }
        }
        async addOrRemoveWorkspaceFolderUnwantedRecommendation(extensionId, workspaceFolder, extensionsConfigContent, add) {
            const values = [];
            if (add) {
                const path = ['unwantedRecommendations'];
                if (Array.isArray(extensionsConfigContent.unwantedRecommendations)) {
                    values.push({ path: [...path, -1], value: extensionId });
                }
                else {
                    values.push({ path, value: [extensionId] });
                }
                const recommendationEdit = this.getEditToRemoveValueFromArray(['recommendations'], extensionsConfigContent.recommendations, extensionId);
                if (recommendationEdit) {
                    values.push(recommendationEdit);
                }
            }
            else if (extensionsConfigContent.unwantedRecommendations) {
                const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                if (unwantedRecommendationEdit) {
                    values.push(unwantedRecommendationEdit);
                }
            }
            if (values.length) {
                return this.jsonEditingService.write(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG), values, true);
            }
        }
        async addOrRemoveWorkspaceUnwantedRecommendation(extensionId, workspace, extensionsConfigContent, add) {
            const values = [];
            if (extensionsConfigContent) {
                if (add) {
                    const path = ['extensions', 'unwantedRecommendations'];
                    if (Array.isArray(extensionsConfigContent.recommendations)) {
                        values.push({ path: [...path, -1], value: extensionId });
                    }
                    else {
                        values.push({ path, value: [extensionId] });
                    }
                    const recommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'recommendations'], extensionsConfigContent.recommendations, extensionId);
                    if (recommendationEdit) {
                        values.push(recommendationEdit);
                    }
                }
                else if (extensionsConfigContent.unwantedRecommendations) {
                    const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                    if (unwantedRecommendationEdit) {
                        values.push(unwantedRecommendationEdit);
                    }
                }
            }
            else if (add) {
                values.push({ path: ['extensions'], value: { unwantedRecommendations: [extensionId] } });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspace.configuration, values, true);
            }
        }
        async pickWorkspaceOrFolders(workspaceFolders, workspace, placeHolder) {
            const workspaceOrFolders = workspace ? [...workspaceFolders, workspace] : [...workspaceFolders];
            if (workspaceOrFolders.length === 1) {
                return workspaceOrFolders;
            }
            const folderPicks = workspaceFolders.map(workspaceFolder => {
                return {
                    label: workspaceFolder.name,
                    description: (0, nls_1.localize)('workspace folder', "Workspace Folder"),
                    workspaceOrFolder: workspaceFolder,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, workspaceFolder.uri, files_1.FileKind.ROOT_FOLDER)
                };
            });
            if (workspace) {
                folderPicks.push({ type: 'separator' });
                folderPicks.push({
                    label: (0, nls_1.localize)('workspace', "Workspace"),
                    workspaceOrFolder: workspace,
                });
            }
            const result = await this.quickInputService.pick(folderPicks, { placeHolder, canPickMany: true }) || [];
            return result.map(r => r.workspaceOrFolder);
        }
        async resolveWorkspaceExtensionConfig(workspaceConfigurationResource) {
            try {
                const content = await this.fileService.readFile(workspaceConfigurationResource);
                const extensionsConfigContent = (0, json_1.parse)(content.value.toString())['extensions'];
                return extensionsConfigContent ? this.parseExtensionConfig(extensionsConfigContent) : undefined;
            }
            catch (e) { /* Ignore */ }
            return undefined;
        }
        async resolveWorkspaceFolderExtensionConfig(workspaceFolder) {
            try {
                const content = await this.fileService.readFile(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG));
                const extensionsConfigContent = (0, json_1.parse)(content.value.toString());
                return this.parseExtensionConfig(extensionsConfigContent);
            }
            catch (e) { /* ignore */ }
            return {};
        }
        parseExtensionConfig(extensionsConfigContent) {
            return {
                recommendations: (0, arrays_1.distinct)((extensionsConfigContent.recommendations || []).map(e => e.toLowerCase())),
                unwantedRecommendations: (0, arrays_1.distinct)((extensionsConfigContent.unwantedRecommendations || []).map(e => e.toLowerCase()))
            };
        }
        getEditToRemoveValueFromArray(path, array, value) {
            const index = array?.indexOf(value);
            if (index !== undefined && index !== -1) {
                return { path: [...path, index], value: undefined };
            }
            return undefined;
        }
    };
    exports.WorkspaceExtensionsConfigService = WorkspaceExtensionsConfigService;
    exports.WorkspaceExtensionsConfigService = WorkspaceExtensionsConfigService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, files_1.IFileService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService),
        __param(5, jsonEditing_1.IJSONEditingService)
    ], WorkspaceExtensionsConfigService);
    (0, extensions_1.registerSingleton)(exports.IWorkspaceExtensionsConfigService, WorkspaceExtensionsConfigService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlRXh0ZW5zaW9uc0NvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnMvY29tbW9uL3dvcmtzcGFjZUV4dGVuc2lvbnNDb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJuRixRQUFBLGlCQUFpQixHQUFHLHlCQUF5QixDQUFDO0lBTzlDLFFBQUEsaUNBQWlDLEdBQUcsSUFBQSwrQkFBZSxFQUFvQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBY2xJLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7UUFPL0QsWUFDMkIsdUJBQWtFLEVBQzlFLFdBQTBDLEVBQ3BDLGlCQUFzRCxFQUMzRCxZQUE0QyxFQUN6QyxlQUFrRCxFQUMvQyxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFQbUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUM3RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzFDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM5Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBVDdELGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzVFLGlDQUE0QixHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLENBQUM7WUFXaEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJ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