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
define(["require", "exports", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/product/common/productService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/nls", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, commands_1, arrays, instantiation_1, editorService_1, errors_1, workspace_1, configuration_1, workingCopyBackup_1, lifecycle_1, files_1, resources_1, layoutService_1, gettingStartedInput_1, environmentService_1, storage_1, telemetryUtils_1, productService_1, log_1, notification_1, nls_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupPageRunnerContribution = exports.StartupPageEditorResolverContribution = exports.restoreWalkthroughsConfigurationKey = void 0;
    exports.restoreWalkthroughsConfigurationKey = 'workbench.welcomePage.restorableWalkthroughs';
    const configurationKey = 'workbench.startupEditor';
    const oldConfigurationKey = 'workbench.welcome.enabled';
    const telemetryOptOutStorageKey = 'workbench.telemetryOptOutShown';
    let StartupPageEditorResolverContribution = class StartupPageEditorResolverContribution {
        static { this.ID = 'workbench.contrib.startupPageEditorResolver'; }
        constructor(instantiationService, editorResolverService) {
            this.instantiationService = instantiationService;
            editorResolverService.registerEditor(`${gettingStartedInput_1.GettingStartedInput.RESOURCE.scheme}:/**`, {
                id: gettingStartedInput_1.GettingStartedInput.ID,
                label: (0, nls_1.localize)('welcome.displayName', "Welcome Page"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin,
            }, {
                singlePerResource: false,
                canSupportResource: uri => uri.scheme === gettingStartedInput_1.GettingStartedInput.RESOURCE.scheme,
            }, {
                createEditorInput: ({ resource, options }) => {
                    return {
                        editor: this.instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, options),
                        options: {
                            ...options,
                            pinned: false
                        }
                    };
                }
            });
        }
    };
    exports.StartupPageEditorResolverContribution = StartupPageEditorResolverContribution;
    exports.StartupPageEditorResolverContribution = StartupPageEditorResolverContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorResolverService_1.IEditorResolverService)
    ], StartupPageEditorResolverContribution);
    let StartupPageRunnerContribution = class StartupPageRunnerContribution {
        static { this.ID = 'workbench.contrib.startupPageRunner'; }
        constructor(configurationService, editorService, workingCopyBackupService, fileService, contextService, lifecycleService, layoutService, productService, commandService, environmentService, storageService, logService, notificationService) {
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.lifecycleService = lifecycleService;
            this.layoutService = layoutService;
            this.productService = productService;
            this.commandService = commandService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.logService = logService;
            this.notificationService = notificationService;
            this.run().then(undefined, errors_1.onUnexpectedError);
        }
        async run() {
            // Wait for resolving startup editor until we are restored to reduce startup pressure
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Always open Welcome page for first-launch, no matter what is open or which startupEditor is set.
            if (this.productService.enableTelemetry
                && this.productService.showTelemetryOptOut
                && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) !== 0 /* TelemetryLevel.NONE */
                && !this.environmentService.skipWelcome
                && !this.storageService.get(telemetryOptOutStorageKey, 0 /* StorageScope.PROFILE */)) {
                this.storageService.store(telemetryOptOutStorageKey, true, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                await this.openGettingStarted(true);
                return;
            }
            if (this.tryOpenWalkthroughForFolder()) {
                return;
            }
            const enabled = isStartupPageEnabled(this.configurationService, this.contextService, this.environmentService);
            if (enabled && this.lifecycleService.startupKind !== 3 /* StartupKind.ReloadedWindow */) {
                const hasBackups = await this.workingCopyBackupService.hasBackups();
                if (hasBackups) {
                    return;
                }
                // Open the welcome even if we opened a set of default editors
                if (!this.editorService.activeEditor || this.layoutService.openedDefaultEditors) {
                    const startupEditorSetting = this.configurationService.inspect(configurationKey);
                    const isStartupEditorReadme = startupEditorSetting.value === 'readme';
                    const isStartupEditorUserReadme = startupEditorSetting.userValue === 'readme';
                    const isStartupEditorDefaultReadme = startupEditorSetting.defaultValue === 'readme';
                    // 'readme' should not be set in workspace settings to prevent tracking,
                    // but it can be set as a default (as in codespaces or from configurationDefaults) or a user setting
                    if (isStartupEditorReadme && (!isStartupEditorUserReadme || !isStartupEditorDefaultReadme)) {
                        this.logService.warn(`Warning: 'workbench.startupEditor: readme' setting ignored due to being set somewhere other than user or default settings (user=${startupEditorSetting.userValue}, default=${startupEditorSetting.defaultValue})`);
                    }
                    const openWithReadme = isStartupEditorReadme && (isStartupEditorUserReadme || isStartupEditorDefaultReadme);
                    if (openWithReadme) {
                        await this.openReadme();
                    }
                    else if (startupEditorSetting.value === 'welcomePage' || startupEditorSetting.value === 'welcomePageInEmptyWorkbench') {
                        await this.openGettingStarted();
                    }
                    else if (startupEditorSetting.value === 'terminal') {
                        this.commandService.executeCommand("workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */);
                    }
                }
            }
        }
        tryOpenWalkthroughForFolder() {
            const toRestore = this.storageService.get(exports.restoreWalkthroughsConfigurationKey, 0 /* StorageScope.PROFILE */);
            if (!toRestore) {
                return false;
            }
            else {
                const restoreData = JSON.parse(toRestore);
                const currentWorkspace = this.contextService.getWorkspace();
                if (restoreData.folder === workspace_1.UNKNOWN_EMPTY_WINDOW_WORKSPACE.id || restoreData.folder === currentWorkspace.folders[0].uri.toString()) {
                    this.editorService.openEditor({
                        resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                        options: { selectedCategory: restoreData.category, selectedStep: restoreData.step, pinned: false },
                    });
                    this.storageService.remove(exports.restoreWalkthroughsConfigurationKey, 0 /* StorageScope.PROFILE */);
                    return true;
                }
            }
            return false;
        }
        async openReadme() {
            const readmes = arrays.coalesce(await Promise.all(this.contextService.getWorkspace().folders.map(async (folder) => {
                const folderUri = folder.uri;
                const folderStat = await this.fileService.resolve(folderUri).catch(errors_1.onUnexpectedError);
                const files = folderStat?.children ? folderStat.children.map(child => child.name).sort() : [];
                const file = files.find(file => file.toLowerCase() === 'readme.md') || files.find(file => file.toLowerCase().startsWith('readme'));
                if (file) {
                    return (0, resources_1.joinPath)(folderUri, file);
                }
                else {
                    return undefined;
                }
            })));
            if (!this.editorService.activeEditor) {
                if (readmes.length) {
                    const isMarkDown = (readme) => readme.path.toLowerCase().endsWith('.md');
                    await Promise.all([
                        this.commandService.executeCommand('markdown.showPreview', null, readmes.filter(isMarkDown), { locked: true }).catch(error => {
                            this.notificationService.error((0, nls_1.localize)('startupPage.markdownPreviewError', 'Could not open markdown preview: {0}.\n\nPlease make sure the markdown extension is enabled.', error.message));
                        }),
                        this.editorService.openEditors(readmes.filter(readme => !isMarkDown(readme)).map(readme => ({ resource: readme }))),
                    ]);
                }
                else {
                    // If no readme is found, default to showing the welcome page.
                    await this.openGettingStarted();
                }
            }
        }
        async openGettingStarted(showTelemetryNotice) {
            const startupEditorTypeID = gettingStartedInput_1.gettingStartedInputTypeId;
            const editor = this.editorService.activeEditor;
            // Ensure that the welcome editor won't get opened more than once
            if (editor?.typeId === startupEditorTypeID || this.editorService.editors.some(e => e.typeId === startupEditorTypeID)) {
                return;
            }
            const options = editor ? { pinned: false, index: 0 } : { pinned: false };
            if (startupEditorTypeID === gettingStartedInput_1.gettingStartedInputTypeId) {
                this.editorService.openEditor({
                    resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                    options: { showTelemetryNotice, ...options },
                });
            }
        }
    };
    exports.StartupPageRunnerContribution = StartupPageRunnerContribution;
    exports.StartupPageRunnerContribution = StartupPageRunnerContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(3, files_1.IFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, lifecycle_1.ILifecycleService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, productService_1.IProductService),
        __param(8, commands_1.ICommandService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, storage_1.IStorageService),
        __param(11, log_1.ILogService),
        __param(12, notification_1.INotificationService)
    ], StartupPageRunnerContribution);
    function isStartupPageEnabled(configurationService, contextService, environmentService) {
        if (environmentService.skipWelcome) {
            return false;
        }
        const startupEditor = configurationService.inspect(configurationKey);
        if (!startupEditor.userValue && !startupEditor.workspaceValue) {
            const welcomeEnabled = configurationService.inspect(oldConfigurationKey);
            if (welcomeEnabled.value !== undefined && welcomeEnabled.value !== null) {
                return welcomeEnabled.value;
            }
        }
        return startupEditor.value === 'welcomePage'
            || startupEditor.value === 'readme' && (startupEditor.userValue === 'readme' || startupEditor.defaultValue === 'readme')
            || (contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && startupEditor.value === 'welcomePageInEmptyWorkbench')
            || startupEditor.value === 'terminal';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFBhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvYnJvd3Nlci9zdGFydHVwUGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2Qm5GLFFBQUEsbUNBQW1DLEdBQUcsOENBQThDLENBQUM7SUFHbEcsTUFBTSxnQkFBZ0IsR0FBRyx5QkFBeUIsQ0FBQztJQUNuRCxNQUFNLG1CQUFtQixHQUFHLDJCQUEyQixDQUFDO0lBQ3hELE1BQU0seUJBQXlCLEdBQUcsZ0NBQWdDLENBQUM7SUFFNUQsSUFBTSxxQ0FBcUMsR0FBM0MsTUFBTSxxQ0FBcUM7aUJBRWpDLE9BQUUsR0FBRyw2Q0FBNkMsQUFBaEQsQ0FBaUQ7UUFFbkUsWUFDeUMsb0JBQTJDLEVBQzNELHFCQUE2QztZQUQ3Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBR25GLHFCQUFxQixDQUFDLGNBQWMsQ0FDbkMsR0FBRyx5Q0FBbUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxNQUFNLEVBQzVDO2dCQUNDLEVBQUUsRUFBRSx5Q0FBbUIsQ0FBQyxFQUFFO2dCQUMxQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsY0FBYyxDQUFDO2dCQUN0RCxRQUFRLEVBQUUsZ0RBQXdCLENBQUMsT0FBTzthQUMxQyxFQUNEO2dCQUNDLGlCQUFpQixFQUFFLEtBQUs7Z0JBQ3hCLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyx5Q0FBbUIsQ0FBQyxRQUFRLENBQUMsTUFBTTthQUM3RSxFQUNEO2dCQUNDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDNUMsT0FBTzt3QkFDTixNQUFNLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5Q0FBbUIsRUFBRSxPQUFzQyxDQUFDO3dCQUM3RyxPQUFPLEVBQUU7NEJBQ1IsR0FBRyxPQUFPOzRCQUNWLE1BQU0sRUFBRSxLQUFLO3lCQUNiO3FCQUNELENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQ0QsQ0FBQztRQUNILENBQUM7O0lBL0JXLHNGQUFxQztvREFBckMscUNBQXFDO1FBSy9DLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4Q0FBc0IsQ0FBQTtPQU5aLHFDQUFxQyxDQWdDakQ7SUFFTSxJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE2QjtpQkFFekIsT0FBRSxHQUFHLHFDQUFxQyxBQUF4QyxDQUF5QztRQUUzRCxZQUN5QyxvQkFBMkMsRUFDbEQsYUFBNkIsRUFDbEIsd0JBQW1ELEVBQ2hFLFdBQXlCLEVBQ2IsY0FBd0MsRUFDL0MsZ0JBQW1DLEVBQzdCLGFBQXNDLEVBQzlDLGNBQStCLEVBQy9CLGNBQStCLEVBQ2xCLGtCQUFnRCxFQUM3RCxjQUErQixFQUNuQyxVQUF1QixFQUNkLG1CQUF5QztZQVp4Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNsQiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ2hFLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2IsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDN0Isa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQzlDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUM3RCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNkLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFFaEYsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMEJBQWlCLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU8sS0FBSyxDQUFDLEdBQUc7WUFFaEIscUZBQXFGO1lBQ3JGLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksaUNBQXlCLENBQUM7WUFFMUQsbUdBQW1HO1lBQ25HLElBQ0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlO21CQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQjttQkFDdkMsSUFBQSxrQ0FBaUIsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsZ0NBQXdCO21CQUNwRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXO21CQUNwQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLHlCQUF5QiwrQkFBdUIsRUFDM0UsQ0FBQztnQkFDRixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLDJEQUEyQyxDQUFDO2dCQUNyRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRSxFQUFFLENBQUM7Z0JBQ3hDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDOUcsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsdUNBQStCLEVBQUUsQ0FBQztnQkFDakYsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3BFLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQUMsT0FBTztnQkFBQyxDQUFDO2dCQUUzQiw4REFBOEQ7Z0JBQzlELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBQ2pGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBUyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUd6RixNQUFNLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDLEtBQUssS0FBSyxRQUFRLENBQUM7b0JBQ3RFLE1BQU0seUJBQXlCLEdBQUcsb0JBQW9CLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQztvQkFDOUUsTUFBTSw0QkFBNEIsR0FBRyxvQkFBb0IsQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDO29CQUVwRix3RUFBd0U7b0JBQ3hFLG9HQUFvRztvQkFDcEcsSUFBSSxxQkFBcUIsSUFBSSxDQUFDLENBQUMseUJBQXlCLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUM7d0JBQzVGLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLG1JQUFtSSxvQkFBb0IsQ0FBQyxTQUFTLGFBQWEsb0JBQW9CLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztvQkFDMU8sQ0FBQztvQkFFRCxNQUFNLGNBQWMsR0FBRyxxQkFBcUIsSUFBSSxDQUFDLHlCQUF5QixJQUFJLDRCQUE0QixDQUFDLENBQUM7b0JBQzVHLElBQUksY0FBYyxFQUFFLENBQUM7d0JBQ3BCLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUN6QixDQUFDO3lCQUFNLElBQUksb0JBQW9CLENBQUMsS0FBSyxLQUFLLGFBQWEsSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLEtBQUssNkJBQTZCLEVBQUUsQ0FBQzt3QkFDekgsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDakMsQ0FBQzt5QkFBTSxJQUFJLG9CQUFvQixDQUFDLEtBQUssS0FBSyxVQUFVLEVBQUUsQ0FBQzt3QkFDdEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLHNGQUF3QyxDQUFDO29CQUM1RSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLDJCQUEyQjtZQUNsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQywyQ0FBbUMsK0JBQXVCLENBQUM7WUFDckcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7aUJBQ0ksQ0FBQztnQkFDTCxNQUFNLFdBQVcsR0FBMEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDakYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUM1RCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssMENBQThCLENBQUMsRUFBRSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUNuSSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQzt3QkFDN0IsUUFBUSxFQUFFLHlDQUFtQixDQUFDLFFBQVE7d0JBQ3RDLE9BQU8sRUFBK0IsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7cUJBQy9ILENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQywyQ0FBbUMsK0JBQXVCLENBQUM7b0JBQ3RGLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sS0FBSyxDQUFDLFVBQVU7WUFDdkIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FDOUIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDL0QsS0FBSyxFQUFDLE1BQU0sRUFBQyxFQUFFO2dCQUNkLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUM7Z0JBQzdCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLDBCQUFpQixDQUFDLENBQUM7Z0JBQ3RGLE1BQU0sS0FBSyxHQUFHLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzlGLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssV0FBVyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbkksSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFBQyxPQUFPLElBQUEsb0JBQVEsRUFBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQUMsQ0FBQztxQkFDMUMsQ0FBQztvQkFBQyxPQUFPLFNBQVMsQ0FBQztnQkFBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVQLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDcEIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFXLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM5RSxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7d0JBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFOzRCQUM1SCxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLDhGQUE4RixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO3dCQUM3TCxDQUFDLENBQUM7d0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ25ILENBQUMsQ0FBQztnQkFDSixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsOERBQThEO29CQUM5RCxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUNqQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsbUJBQTZCO1lBQzdELE1BQU0sbUJBQW1CLEdBQUcsK0NBQXlCLENBQUM7WUFDdEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUM7WUFFL0MsaUVBQWlFO1lBQ2pFLElBQUksTUFBTSxFQUFFLE1BQU0sS0FBSyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztnQkFDdEgsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBbUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUN6RixJQUFJLG1CQUFtQixLQUFLLCtDQUF5QixFQUFFLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO29CQUM3QixRQUFRLEVBQUUseUNBQW1CLENBQUMsUUFBUTtvQkFDdEMsT0FBTyxFQUErQixFQUFFLG1CQUFtQixFQUFFLEdBQUcsT0FBTyxFQUFFO2lCQUN6RSxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQzs7SUE1SVcsc0VBQTZCOzRDQUE3Qiw2QkFBNkI7UUFLdkMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLDZDQUF5QixDQUFBO1FBQ3pCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHVDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsWUFBQSx5QkFBZSxDQUFBO1FBQ2YsWUFBQSxpQkFBVyxDQUFBO1FBQ1gsWUFBQSxtQ0FBb0IsQ0FBQTtPQWpCViw2QkFBNkIsQ0E2SXpDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxvQkFBMkMsRUFBRSxjQUF3QyxFQUFFLGtCQUFnRDtRQUNwSyxJQUFJLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBUyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQy9ELE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3pFLElBQUksY0FBYyxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDekUsT0FBTyxjQUFjLENBQUMsS0FBSyxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxhQUFhLENBQUMsS0FBSyxLQUFLLGFBQWE7ZUFDeEMsYUFBYSxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxLQUFLLFFBQVEsSUFBSSxhQUFhLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQztlQUNySCxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxpQ0FBeUIsSUFBSSxhQUFhLENBQUMsS0FBSyxLQUFLLDZCQUE2QixDQUFDO2VBQ3RILGFBQWEsQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDO0lBQ3hDLENBQUMifQ==