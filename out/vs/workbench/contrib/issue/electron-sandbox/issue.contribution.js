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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/services/issue/common/issue", "vs/platform/commands/common/commands", "vs/workbench/contrib/issue/common/issue.contribution", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/action/common/actionCommonCategories", "vs/platform/environment/common/environment", "vs/platform/dialogs/common/dialogs", "vs/platform/native/common/native", "vs/platform/progress/common/progress", "vs/platform/issue/common/issue", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/issue/browser/issueQuickAccess"], function (require, exports, nls_1, actions_1, issue_1, commands_1, issue_contribution_1, productService_1, platform_1, contributions_1, actionCommonCategories_1, environment_1, dialogs_1, native_1, progress_1, issue_2, configuration_1, quickAccess_1, issueQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Issue Contribution
    let NativeIssueContribution = class NativeIssueContribution extends issue_contribution_1.BaseIssueContribution {
        constructor(productService, configurationService) {
            super(productService, configurationService);
            if (productService.reportIssueUrl) {
                this._register((0, actions_1.registerAction2)(ReportPerformanceIssueUsingReporterAction));
            }
            let disposable;
            const registerQuickAccessProvider = () => {
                disposable = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
                    ctor: issueQuickAccess_1.IssueQuickAccess,
                    prefix: issueQuickAccess_1.IssueQuickAccess.PREFIX,
                    contextKey: 'inReportIssuePicker',
                    placeholder: (0, nls_1.localize)('tasksQuickAccessPlaceholder', "Type the name of an extension to report on."),
                    helpEntries: [{
                            description: (0, nls_1.localize)('openIssueReporter', "Open Issue Reporter"),
                            commandId: 'workbench.action.openIssueReporter'
                        }]
                });
            };
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (!configurationService.getValue('extensions.experimental.issueQuickAccess') && disposable) {
                    disposable.dispose();
                    disposable = undefined;
                }
                else if (!disposable) {
                    registerQuickAccessProvider();
                }
            }));
            if (configurationService.getValue('extensions.experimental.issueQuickAccess')) {
                registerQuickAccessProvider();
            }
        }
    };
    NativeIssueContribution = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService)
    ], NativeIssueContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NativeIssueContribution, 3 /* LifecyclePhase.Restored */);
    class ReportPerformanceIssueUsingReporterAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.reportPerformanceIssueUsingReporter'; }
        constructor() {
            super({
                id: ReportPerformanceIssueUsingReporterAction.ID,
                title: (0, nls_1.localize2)({ key: 'reportPerformanceIssue', comment: [`Here, 'issue' means problem or bug`] }, "Report Performance Issue..."),
                category: actionCommonCategories_1.Categories.Help,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            return issueService.openReporter({ issueType: 1 /* IssueType.PerformanceIssue */ });
        }
    }
    //#endregion
    //#region Commands
    class OpenProcessExplorer extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openProcessExplorer'; }
        constructor() {
            super({
                id: OpenProcessExplorer.ID,
                title: (0, nls_1.localize2)('openProcessExplorer', 'Open Process Explorer'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            return issueService.openProcessExplorer();
        }
    }
    (0, actions_1.registerAction2)(OpenProcessExplorer);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
        group: '5_tools',
        command: {
            id: OpenProcessExplorer.ID,
            title: (0, nls_1.localize)({ key: 'miOpenProcessExplorerer', comment: ['&& denotes a mnemonic'] }, "Open &&Process Explorer")
        },
        order: 2
    });
    class StopTracing extends actions_1.Action2 {
        static { this.ID = 'workbench.action.stopTracing'; }
        constructor() {
            super({
                id: StopTracing.ID,
                title: (0, nls_1.localize2)('stopTracing', 'Stop Tracing'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_2.IIssueMainService);
            const environmentService = accessor.get(environment_1.INativeEnvironmentService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const progressService = accessor.get(progress_1.IProgressService);
            if (!environmentService.args.trace) {
                const { confirmed } = await dialogService.confirm({
                    message: (0, nls_1.localize)('stopTracing.message', "Tracing requires to launch with a '--trace' argument"),
                    primaryButton: (0, nls_1.localize)({ key: 'stopTracing.button', comment: ['&& denotes a mnemonic'] }, "&&Relaunch and Enable Tracing"),
                });
                if (confirmed) {
                    return nativeHostService.relaunch({ addArgs: ['--trace'] });
                }
            }
            await progressService.withProgress({
                location: 20 /* ProgressLocation.Dialog */,
                title: (0, nls_1.localize)('stopTracing.title', "Creating trace file..."),
                cancellable: false,
                detail: (0, nls_1.localize)('stopTracing.detail', "This can take up to one minute to complete.")
            }, () => issueService.stopTracing());
        }
    }
    (0, actions_1.registerAction2)(StopTracing);
    commands_1.CommandsRegistry.registerCommand('_issues.getSystemStatus', (accessor) => {
        return accessor.get(issue_2.IIssueMainService).getSystemStatus();
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaXNzdWUvZWxlY3Ryb24tc2FuZGJveC9pc3N1ZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLDRCQUE0QjtJQUU1QixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLDBDQUFxQjtRQUUxRCxZQUNrQixjQUErQixFQUN6QixvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRTVDLElBQUksY0FBYyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQWUsRUFBQyx5Q0FBeUMsQ0FBQyxDQUFDLENBQUM7WUFDNUUsQ0FBQztZQUVELElBQUksVUFBbUMsQ0FBQztZQUV4QyxNQUFNLDJCQUEyQixHQUFHLEdBQUcsRUFBRTtnQkFDeEMsVUFBVSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF1Qix3QkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQywyQkFBMkIsQ0FBQztvQkFDN0csSUFBSSxFQUFFLG1DQUFnQjtvQkFDdEIsTUFBTSxFQUFFLG1DQUFnQixDQUFDLE1BQU07b0JBQy9CLFVBQVUsRUFBRSxxQkFBcUI7b0JBQ2pDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSw2Q0FBNkMsQ0FBQztvQkFDbkcsV0FBVyxFQUFFLENBQUM7NEJBQ2IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLHFCQUFxQixDQUFDOzRCQUNqRSxTQUFTLEVBQUUsb0NBQW9DO3lCQUMvQyxDQUFDO2lCQUNGLENBQUMsQ0FBQztZQUNK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