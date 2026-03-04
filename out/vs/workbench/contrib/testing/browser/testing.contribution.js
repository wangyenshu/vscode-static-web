/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/fileConstants", "vs/workbench/contrib/testing/browser/codeCoverageDecorations", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testCoverageBars", "vs/workbench/contrib/testing/browser/testCoverageView", "vs/workbench/contrib/testing/browser/testingDecorations", "vs/workbench/contrib/testing/browser/testingExplorerView", "vs/workbench/contrib/testing/browser/testingOutputPeek", "vs/workbench/contrib/testing/browser/testingProgressUiService", "vs/workbench/contrib/testing/browser/testingViewPaneContainer", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testResultStorage", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testServiceImpl", "vs/workbench/contrib/testing/common/testingContentProvider", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingContinuousRunService", "vs/workbench/contrib/testing/common/testingDecorations", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/services/views/common/viewsService", "./testExplorerActions", "./testingConfigurationUi"], function (require, exports, editorExtensions_1, nls_1, actions_1, commands_1, configurationRegistry_1, contextkey_1, files_1, descriptors_1, extensions_1, opener_1, progress_1, platform_1, viewPaneContainer_1, contributions_1, views_1, fileConstants_1, codeCoverageDecorations_1, icons_1, testCoverageBars_1, testCoverageView_1, testingDecorations_1, testingExplorerView_1, testingOutputPeek_1, testingProgressUiService_1, testingViewPaneContainer_1, configuration_1, testCoverageService_1, testExplorerFilterState_1, testId_1, testProfileService_1, testResultService_1, testResultStorage_1, testService_1, testServiceImpl_1, testingContentProvider_1, testingContextKeys_1, testingContinuousRunService_1, testingDecorations_2, testingPeekOpener_1, viewsService_1, testExplorerActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(testService_1.ITestService, testServiceImpl_1.TestService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testResultStorage_1.ITestResultStorage, testResultStorage_1.TestResultStorage, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testProfileService_1.ITestProfileService, testProfileService_1.TestProfileService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testCoverageService_1.ITestCoverageService, testCoverageService_1.TestCoverageService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testingContinuousRunService_1.ITestingContinuousRunService, testingContinuousRunService_1.TestingContinuousRunService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testResultService_1.ITestResultService, testResultService_1.TestResultService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testExplorerFilterState_1.ITestExplorerFilterState, testExplorerFilterState_1.TestExplorerFilterState, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testingPeekOpener_1.ITestingPeekOpener, testingOutputPeek_1.TestingPeekOpener, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testingDecorations_2.ITestingDecorationsService, testingDecorations_1.TestingDecorationService, 1 /* InstantiationType.Delayed */);
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: "workbench.view.extension.test" /* Testing.ViewletId */,
        title: (0, nls_1.localize2)('test', 'Testing'),
        ctorDescriptor: new descriptors_1.SyncDescriptor(testingViewPaneContainer_1.TestingViewPaneContainer),
        icon: icons_1.testingViewIcon,
        alwaysUseContainerInfo: true,
        order: 6,
        openCommandActionDescriptor: {
            id: "workbench.view.extension.test" /* Testing.ViewletId */,
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewTesting', comment: ['&& denotes a mnemonic'] }, "T&&esting"),
            // todo: coordinate with joh whether this is available
            // keybindings: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.US_SEMICOLON },
            order: 4,
        },
        hideIfEmpty: true,
    }, 0 /* ViewContainerLocation.Sidebar */);
    const testResultsViewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: "workbench.panel.testResults" /* Testing.ResultsPanelId */,
        title: (0, nls_1.localize2)('testResultsPanelName', "Test Results"),
        icon: icons_1.testingResultsIcon,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, ["workbench.panel.testResults" /* Testing.ResultsPanelId */, { mergeViewWithContainerWhenSingleView: true }]),
        hideIfEmpty: true,
        order: 3,
    }, 1 /* ViewContainerLocation.Panel */, { doNotRegisterOpenCommand: true });
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViews([{
            id: "workbench.panel.testResults.view" /* Testing.ResultsViewId */,
            name: (0, nls_1.localize2)('testResultsPanelName', "Test Results"),
            containerIcon: icons_1.testingResultsIcon,
            canToggleVisibility: false,
            canMoveView: true,
            when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testingOutputPeek_1.TestResultsView),
        }], testResultsViewContainer);
    viewsRegistry.registerViewWelcomeContent("workbench.view.testing" /* Testing.ExplorerViewId */, {
        content: (0, nls_1.localize)('noTestProvidersRegistered', "No tests have been found in this workspace yet."),
    });
    viewsRegistry.registerViewWelcomeContent("workbench.view.testing" /* Testing.ExplorerViewId */, {
        content: '[' + (0, nls_1.localize)('searchForAdditionalTestExtensions', "Install Additional Test Extensions...") + `](command:${"testing.searchForTestExtension" /* TestCommandId.SearchForTestExtension */})`,
        order: 10
    });
    viewsRegistry.registerViews([{
            id: "workbench.view.testing" /* Testing.ExplorerViewId */,
            name: (0, nls_1.localize2)('testExplorer', "Test Explorer"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testingExplorerView_1.TestingExplorerView),
            canToggleVisibility: true,
            canMoveView: true,
            weight: 80,
            order: -999,
            containerIcon: icons_1.testingViewIcon,
            when: contextkey_1.ContextKeyExpr.greater(testingContextKeys_1.TestingContextKeys.providerCount.key, 0),
        }, {
            id: "workbench.view.testCoverage" /* Testing.CoverageViewId */,
            name: (0, nls_1.localize2)('testCoverage', "Test Coverage"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testCoverageView_1.TestCoverageView),
            canToggleVisibility: true,
            canMoveView: true,
            weight: 80,
            order: -998,
            containerIcon: icons_1.testingViewIcon,
            when: testingContextKeys_1.TestingContextKeys.isTestCoverageOpen,
        }], viewContainer);
    testExplorerActions_1.allTestActions.forEach(actions_1.registerAction2);
    (0, actions_1.registerAction2)(testingOutputPeek_1.OpenMessageInEditorAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.GoToPreviousMessageAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.GoToNextMessageAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.CloseTestPeek);
    (0, actions_1.registerAction2)(testingOutputPeek_1.ToggleTestingPeekHistory);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingContentProvider_1.TestingContentProvider, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingOutputPeek_1.TestingPeekOpener, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingProgressUiService_1.TestingProgressTrigger, 4 /* LifecyclePhase.Eventually */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */, testingOutputPeek_1.TestingOutputPeekController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.testingDecorations" /* Testing.DecorationsContributionId */, testingDecorations_1.TestingDecorations, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.coverageDecorations" /* Testing.CoverageDecorationsContributionId */, codeCoverageDecorations_1.CodeCoverageDecorations, 3 /* EditorContributionInstantiation.Eventually */);
    commands_1.CommandsRegistry.registerCommand({
        id: '_revealTestInExplorer',
        handler: async (accessor, testId, focus) => {
            accessor.get(testExplorerFilterState_1.ITestExplorerFilterState).reveal.value = typeof testId === 'string' ? testId : testId.extId;
            accessor.get(viewsService_1.IViewsService).openView("workbench.view.testing" /* Testing.ExplorerViewId */, focus);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.peekTestError',
        handler: async (accessor, extId) => {
            const lookup = accessor.get(testResultService_1.ITestResultService).getStateById(extId);
            if (!lookup) {
                return false;
            }
            const [result, ownState] = lookup;
            const opener = accessor.get(testingPeekOpener_1.ITestingPeekOpener);
            if (opener.tryPeekFirstError(result, ownState)) { // fast path
                return true;
            }
            for (const test of result.tests) {
                if (testId_1.TestId.compare(ownState.item.extId, test.item.extId) === 2 /* TestPosition.IsChild */ && opener.tryPeekFirstError(result, test)) {
                    return true;
                }
            }
            return false;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.revealTest',
        handler: async (accessor, extId) => {
            const test = accessor.get(testService_1.ITestService).collection.getNodeById(extId);
            if (!test) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const fileService = accessor.get(files_1.IFileService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const { range, uri } = test.item;
            if (!uri) {
                return;
            }
            // If an editor has the file open, there are decorations. Try to adjust the
            // revealed range to those decorations (#133441).
            const position = accessor.get(testingDecorations_2.ITestingDecorationsService).getDecoratedTestPosition(uri, extId) || range?.getStartPosition();
            accessor.get(testExplorerFilterState_1.ITestExplorerFilterState).reveal.value = extId;
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).closeAllPeeks();
            let isFile = true;
            try {
                if (!(await fileService.stat(uri)).isFile) {
                    isFile = false;
                }
            }
            catch {
                // ignored
            }
            if (!isFile) {
                await commandService.executeCommand(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, uri);
                return;
            }
            await openerService.open(position
                ? uri.with({ fragment: `L${position.lineNumber}:${position.column}` })
                : uri);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.runTestsById',
        handler: async (accessor, group, ...testIds) => {
            const testService = accessor.get(testService_1.ITestService);
            await (0, testExplorerActions_1.discoverAndRunTests)(accessor.get(testService_1.ITestService).collection, accessor.get(progress_1.IProgressService), testIds, tests => testService.runTests({ group, tests }));
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(configuration_1.testingConfiguration);
    platform_1.Registry.as("workbench.registry.explorer.fileContributions" /* ExplorerExtensions.FileContributionRegistry */).register({
        create(insta, container) {
            return insta.createInstance(testCoverageBars_1.ExplorerTestCoverageBars, { compact: true, container });
        },
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdGluZy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrRGhHLElBQUEsOEJBQWlCLEVBQUMsMEJBQVksRUFBRSw2QkFBVyxvQ0FBNEIsQ0FBQztJQUN4RSxJQUFBLDhCQUFpQixFQUFDLHNDQUFrQixFQUFFLHFDQUFpQixvQ0FBNEIsQ0FBQztJQUNwRixJQUFBLDhCQUFpQixFQUFDLHdDQUFtQixFQUFFLHVDQUFrQixvQ0FBNEIsQ0FBQztJQUN0RixJQUFBLDhCQUFpQixFQUFDLDBDQUFvQixFQUFFLHlDQUFtQixvQ0FBNEIsQ0FBQztJQUN4RixJQUFBLDhCQUFpQixFQUFDLDBEQUE0QixFQUFFLHlEQUEyQixvQ0FBNEIsQ0FBQztJQUN4RyxJQUFBLDhCQUFpQixFQUFDLHNDQUFrQixFQUFFLHFDQUFpQixvQ0FBNEIsQ0FBQztJQUNwRixJQUFBLDhCQUFpQixFQUFDLGtEQUF3QixFQUFFLGlEQUF1QixvQ0FBNEIsQ0FBQztJQUNoRyxJQUFBLDhCQUFpQixFQUFDLHNDQUFrQixFQUFFLHFDQUFpQixvQ0FBNEIsQ0FBQztJQUNwRixJQUFBLDhCQUFpQixFQUFDLCtDQUEwQixFQUFFLDZDQUF3QixvQ0FBNEIsQ0FBQztJQUVuRyxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBMEIsa0JBQXVCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNoSSxFQUFFLHlEQUFtQjtRQUNyQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQztRQUNuQyxjQUFjLEVBQUUsSUFBSSw0QkFB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