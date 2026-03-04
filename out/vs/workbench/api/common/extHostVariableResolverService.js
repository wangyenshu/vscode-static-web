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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/process", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/services/configurationResolver/common/variableResolver", "./extHostConfiguration"], function (require, exports, lazy_1, lifecycle_1, path, process, instantiation_1, extHostDocumentsAndEditors_1, extHostEditorTabs_1, extHostExtensionService_1, extHostTypes_1, extHostWorkspace_1, variableResolver_1, extHostConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostVariableResolverProviderService = exports.IExtHostVariableResolverProvider = void 0;
    exports.IExtHostVariableResolverProvider = (0, instantiation_1.createDecorator)('IExtHostVariableResolverProvider');
    class ExtHostVariableResolverService extends variableResolver_1.AbstractVariableResolverService {
        constructor(extensionService, workspaceService, editorService, editorTabs, configProvider, context, homeDir) {
            function getActiveUri() {
                if (editorService) {
                    const activeEditor = editorService.activeEditor();
                    if (activeEditor) {
                        return activeEditor.document.uri;
                    }
                    const activeTab = editorTabs.tabGroups.all.find(group => group.isActive)?.activeTab;
                    if (activeTab !== undefined) {
                        // Resolve a resource from the tab
                        if (activeTab.input instanceof extHostTypes_1.TextDiffTabInput || activeTab.input instanceof extHostTypes_1.NotebookDiffEditorTabInput) {
                            return activeTab.input.modified;
                        }
                        else if (activeTab.input instanceof extHostTypes_1.TextTabInput || activeTab.input instanceof extHostTypes_1.NotebookEditorTabInput || activeTab.input instanceof extHostTypes_1.CustomEditorTabInput) {
                            return activeTab.input.uri;
                        }
                    }
                }
                return undefined;
            }
            super({
                getFolderUri: (folderName) => {
                    const found = context.folders.filter(f => f.name === folderName);
                    if (found && found.length > 0) {
                        return found[0].uri;
                    }
                    return undefined;
                },
                getWorkspaceFolderCount: () => {
                    return context.folders.length;
                },
                getConfigurationValue: (folderUri, section) => {
                    return configProvider.getConfiguration(undefined, folderUri).get(section);
                },
                getAppRoot: () => {
                    return process.cwd();
                },
                getExecPath: () => {
                    return process.env['VSCODE_EXEC_PATH'];
                },
                getFilePath: () => {
                    const activeUri = getActiveUri();
                    if (activeUri) {
                        return path.normalize(activeUri.fsPath);
                    }
                    return undefined;
                },
                getWorkspaceFolderPathForFile: () => {
                    if (workspaceService) {
                        const activeUri = getActiveUri();
                        if (activeUri) {
                            const ws = workspaceService.getWorkspaceFolder(activeUri);
                            if (ws) {
                                return path.normalize(ws.uri.fsPath);
                            }
                        }
                    }
                    return undefined;
                },
                getSelectedText: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor && !activeEditor.selection.isEmpty) {
                            return activeEditor.document.getText(activeEditor.selection);
                        }
                    }
                    return undefined;
                },
                getLineNumber: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor) {
                            return String(activeEditor.selection.end.line + 1);
                        }
                    }
                    return undefined;
                },
                getExtension: (id) => {
                    return extensionService.getExtension(id);
                },
            }, undefined, homeDir ? Promise.resolve(homeDir) : undefined, Promise.resolve(process.env));
        }
    }
    let ExtHostVariableResolverProviderService = class ExtHostVariableResolverProviderService extends lifecycle_1.Disposable {
        constructor(extensionService, workspaceService, editorService, configurationService, editorTabs) {
            super();
            this.extensionService = extensionService;
            this.workspaceService = workspaceService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.editorTabs = editorTabs;
            this._resolver = new lazy_1.Lazy(async () => {
                const configProvider = await this.configurationService.getConfigProvider();
                const folders = await this.workspaceService.getWorkspaceFolders2() || [];
                const dynamic = { folders };
                this._register(this.workspaceService.onDidChangeWorkspace(async (e) => {
                    dynamic.folders = await this.workspaceService.getWorkspaceFolders2() || [];
                }));
                return new ExtHostVariableResolverService(this.extensionService, this.workspaceService, this.editorService, this.editorTabs, configProvider, dynamic, this.homeDir());
            });
        }
        getResolver() {
            return this._resolver.value;
        }
        homeDir() {
            return undefined;
        }
    };
    exports.ExtHostVariableResolverProviderService = ExtHostVariableResolverProviderService;
    exports.ExtHostVariableResolverProviderService = ExtHostVariableResolverProviderService = __decorate([
        __param(0, extHostExtensionService_1.IExtHostExtensionService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostEditorTabs_1.IExtHostEditorTabs)
    ], ExtHostVariableResolverProviderService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFZhcmlhYmxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFZhcmlhYmxlUmVzb2x2ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCbkYsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFlLEVBQW1DLGtDQUFrQyxDQUFDLENBQUM7SUFNdEksTUFBTSw4QkFBK0IsU0FBUSxrREFBK0I7UUFFM0UsWUFDQyxnQkFBMEMsRUFDMUMsZ0JBQW1DLEVBQ25DLGFBQTBDLEVBQzFDLFVBQThCLEVBQzlCLGNBQXFDLEVBQ3JDLE9BQXVCLEVBQ3ZCLE9BQTJCO1lBRTNCLFNBQVMsWUFBWTtnQkFDcEIsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNsRCxJQUFJLFlBQVksRUFBRSxDQUFDO3dCQUNsQixPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO29CQUNsQyxDQUFDO29CQUNELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUM7b0JBQ3BGLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUM3QixrQ0FBa0M7d0JBQ2xDLElBQUksU0FBUyxDQUFDLEtBQUssWUFBWSwrQkFBZ0IsSUFBSSxTQUFTLENBQUMsS0FBSyxZQUFZLHlDQUEwQixFQUFFLENBQUM7NEJBQzFHLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7d0JBQ2pD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