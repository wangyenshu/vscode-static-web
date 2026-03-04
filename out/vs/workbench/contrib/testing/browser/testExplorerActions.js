/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/iterator", "vs/base/common/keyCodes", "vs/base/common/types", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/iconRegistry", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/contextkeys", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingContinuousRunService", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/views/common/viewsService"], function (require, exports, arrays_1, codicons_1, iterator_1, keyCodes_1, types_1, codeEditorService_1, embeddedCodeEditorWidget_1, position_1, range_1, editorContextKeys_1, messageController_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, notification_1, progress_1, quickInput_1, iconRegistry_1, uriIdentity_1, viewPane_1, contextkeys_1, extensions_1, index_1, icons, configuration_2, constants_1, testCoverageService_1, testId_1, testProfileService_1, testResultService_1, testService_1, testingContextKeys_1, testingContinuousRunService_1, testingPeekOpener_1, testingStates_1, editorService_1, panecomposite_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.allTestActions = exports.OpenCoverage = exports.CleareCoverage = exports.CancelTestRefreshAction = exports.RefreshTestsAction = exports.ToggleInlineTestOutput = exports.OpenOutputPeek = exports.SearchForTestExtension = exports.CoverageLastRun = exports.DebugLastRun = exports.ReRunLastRun = exports.DebugFailedTests = exports.ReRunFailedTests = exports.discoverAndRunTests = exports.CoverageCurrentFile = exports.DebugCurrentFile = exports.RunCurrentFile = exports.CoverageAtCursor = exports.DebugAtCursor = exports.RunAtCursor = exports.GoToTest = exports.ClearTestResultsAction = exports.CollapseAllAction = exports.ShowMostRecentOutputAction = exports.TestingSortByDurationAction = exports.TestingSortByLocationAction = exports.TestingSortByStatusAction = exports.TestingViewAsTreeAction = exports.TestingViewAsListAction = exports.CancelTestRunAction = exports.CoverageAllAction = exports.DebugAllAction = exports.RunAllAction = exports.CoverageSelectedAction = exports.DebugSelectedAction = exports.RunSelectedAction = exports.GetExplorerSelection = exports.GetSelectedProfiles = exports.ConfigureTestProfilesAction = exports.ContinuousRunUsingProfileTestAction = exports.ContinuousRunTestAction = exports.SelectDefaultTestProfiles = exports.RunAction = exports.RunUsingProfileAction = exports.CoverageAction = exports.DebugAction = exports.UnhideAllTestsAction = exports.UnhideTestAction = exports.HideTestAction = void 0;
    const category = actionCommonCategories_1.Categories.Test;
    var ActionOrder;
    (function (ActionOrder) {
        // Navigation:
        ActionOrder[ActionOrder["Refresh"] = 10] = "Refresh";
        ActionOrder[ActionOrder["Run"] = 11] = "Run";
        ActionOrder[ActionOrder["Debug"] = 12] = "Debug";
        ActionOrder[ActionOrder["Coverage"] = 13] = "Coverage";
        ActionOrder[ActionOrder["RunContinuous"] = 14] = "RunContinuous";
        ActionOrder[ActionOrder["RunUsing"] = 15] = "RunUsing";
        // Submenu:
        ActionOrder[ActionOrder["Collapse"] = 16] = "Collapse";
        ActionOrder[ActionOrder["ClearResults"] = 17] = "ClearResults";
        ActionOrder[ActionOrder["DisplayMode"] = 18] = "DisplayMode";
        ActionOrder[ActionOrder["Sort"] = 19] = "Sort";
        ActionOrder[ActionOrder["GoToTest"] = 20] = "GoToTest";
        ActionOrder[ActionOrder["HideTest"] = 21] = "HideTest";
        ActionOrder[ActionOrder["ContinuousRunTest"] = 2147483647] = "ContinuousRunTest";
    })(ActionOrder || (ActionOrder = {}));
    const hasAnyTestProvider = contextkey_1.ContextKeyGreaterExpr.create(testingContextKeys_1.TestingContextKeys.providerCount.key, 0);
    const LABEL_RUN_TESTS = (0, nls_1.localize2)('runSelectedTests', "Run Tests");
    const LABEL_DEBUG_TESTS = (0, nls_1.localize2)('debugSelectedTests', "Debug Tests");
    const LABEL_COVERAGE_TESTS = (0, nls_1.localize2)('coverageSelectedTests', "Run Tests with Coverage");
    class HideTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.hideTest" /* TestCommandId.HideTestAction */,
                title: (0, nls_1.localize2)('hideTest', 'Hide Test'),
                menu: {
                    id: actions_1.MenuId.TestItem,
                    group: 'builtin@2',
                    when: testingContextKeys_1.TestingContextKeys.testItemIsHidden.isEqualTo(false)
                },
            });
        }
        run(accessor, ...elements) {
            const service = accessor.get(testService_1.ITestService);
            for (const element of elements) {
                service.excluded.toggle(element.test, true);
            }
            return Promise.resolve();
        }
    }
    exports.HideTestAction = HideTestAction;
    class UnhideTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.unhideTest" /* TestCommandId.UnhideTestAction */,
                title: (0, nls_1.localize2)('unhideTest', 'Unhide Test'),
                menu: {
                    id: actions_1.MenuId.TestItem,
                    order: 21 /* ActionOrder.HideTest */,
                    when: testingContextKeys_1.TestingContextKeys.testItemIsHidden.isEqualTo(true)
                },
            });
        }
        run(accessor, ...elements) {
            const service = accessor.get(testService_1.ITestService);
            for (const element of elements) {
                if (element instanceof index_1.TestItemTreeElement) {
                    service.excluded.toggle(element.test, false);
                }
            }
            return Promise.resolve();
        }
    }
    exports.UnhideTestAction = UnhideTestAction;
    class UnhideAllTestsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.unhideAllTests" /* TestCommandId.UnhideAllTestsAction */,
                title: (0, nls_1.localize2)('unhideAllTests', 'Unhide All Tests'),
            });
        }
        run(accessor) {
            const service = accessor.get(testService_1.ITestService);
            service.excluded.clear();
            return Promise.resolve();
        }
    }
    exports.UnhideAllTestsAction = UnhideAllTestsAction;
    const testItemInlineAndInContext = (order, when) => [
        {
            id: actions_1.MenuId.TestItem,
            group: 'inline',
            order,
            when,
        }, {
            id: actions_1.MenuId.TestItem,
            group: 'builtin@1',
            order,
            when,
        }
    ];
    class RunVisibleAction extends viewPane_1.ViewAction {
        constructor(bitset, desc) {
            super({
                ...desc,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
            });
            this.bitset = bitset;
        }
        /**
         * @override
         */
        runInView(accessor, view, ...elements) {
            const { include, exclude } = view.getTreeIncludeExclude(elements.map(e => e.test));
            return accessor.get(testService_1.ITestService).runTests({
                tests: include,
                exclude,
                group: this.bitset,
            });
        }
    }
    class DebugAction extends RunVisibleAction {
        constructor() {
            super(4 /* TestRunProfileBitset.Debug */, {
                id: "testing.debug" /* TestCommandId.DebugAction */,
                title: (0, nls_1.localize2)('debug test', 'Debug Test'),
                icon: icons.testingDebugIcon,
                menu: testItemInlineAndInContext(12 /* ActionOrder.Debug */, testingContextKeys_1.TestingContextKeys.hasDebuggableTests.isEqualTo(true)),
            });
        }
    }
    exports.DebugAction = DebugAction;
    class CoverageAction extends RunVisibleAction {
        constructor() {
            super(8 /* TestRunProfileBitset.Coverage */, {
                id: "testing.coverage" /* TestCommandId.RunWithCoverageAction */,
                title: (0, nls_1.localize2)('run with cover test', 'Run Test with Coverage'),
                icon: icons.testingCoverageIcon,
                menu: testItemInlineAndInContext(13 /* ActionOrder.Coverage */, testingContextKeys_1.TestingContextKeys.hasCoverableTests.isEqualTo(true)),
            });
        }
    }
    exports.CoverageAction = CoverageAction;
    class RunUsingProfileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.runUsing" /* TestCommandId.RunUsingProfileAction */,
                title: (0, nls_1.localize2)('testing.runUsing', 'Execute Using Profile...'),
                icon: icons.testingDebugIcon,
                menu: {
                    id: actions_1.MenuId.TestItem,
                    order: 15 /* ActionOrder.RunUsing */,
                    group: 'builtin@2',
                    when: testingContextKeys_1.TestingContextKeys.hasNonDefaultProfile.isEqualTo(true),
                },
            });
        }
        async run(acessor, ...elements) {
            const commandService = acessor.get(commands_1.ICommandService);
            const testService = acessor.get(testService_1.ITestService);
            const profile = await commandService.executeCommand('vscode.pickTestProfile', {
                onlyForTest: elements[0].test,
            });
            if (!profile) {
                return;
            }
            testService.runResolvedTests({
                targets: [{
                        profileGroup: profile.group,
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                        testIds: elements.filter(t => (0, testProfileService_1.canUseProfileWithTest)(profile, t.test)).map(t => t.test.item.extId)
                    }]
            });
        }
    }
    exports.RunUsingProfileAction = RunUsingProfileAction;
    class RunAction extends RunVisibleAction {
        constructor() {
            super(2 /* TestRunProfileBitset.Run */, {
                id: "testing.run" /* TestCommandId.RunAction */,
                title: (0, nls_1.localize2)('run test', 'Run Test'),
                icon: icons.testingRunIcon,
                menu: testItemInlineAndInContext(11 /* ActionOrder.Run */, testingContextKeys_1.TestingContextKeys.hasRunnableTests.isEqualTo(true)),
            });
        }
    }
    exports.RunAction = RunAction;
    class SelectDefaultTestProfiles extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.selectDefaultTestProfiles" /* TestCommandId.SelectDefaultTestProfiles */,
                title: (0, nls_1.localize2)('testing.selectDefaultTestProfiles', 'Select Default Profile'),
                icon: icons.testingUpdateProfiles,
                category,
            });
        }
        async run(acessor, onlyGroup) {
            const commands = acessor.get(commands_1.ICommandService);
            const testProfileService = acessor.get(testProfileService_1.ITestProfileService);
            const profiles = await commands.executeCommand('vscode.pickMultipleTestProfiles', {
                showConfigureButtons: false,
                selected: testProfileService.getGroupDefaultProfiles(onlyGroup),
                onlyGroup,
            });
            if (profiles?.length) {
                testProfileService.setGroupDefaultProfiles(onlyGroup, profiles);
            }
        }
    }
    exports.SelectDefaultTestProfiles = SelectDefaultTestProfiles;
    class ContinuousRunTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.toggleContinuousRunForTest" /* TestCommandId.ToggleContinousRunForTest */,
                title: (0, nls_1.localize2)('testing.toggleContinuousRunOn', 'Turn on Continuous Run'),
                icon: icons.testingTurnContinuousRunOn,
                precondition: contextkey_1.ContextKeyExpr.or(testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isParentRunningContinuously.isEqualTo(false)),
                toggled: {
                    condition: testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(true),
                    icon: icons.testingContinuousIsOn,
                    title: (0, nls_1.localize)('testing.toggleContinuousRunOff', 'Turn off Continuous Run'),
                },
                menu: testItemInlineAndInContext(2147483647 /* ActionOrder.ContinuousRunTest */, testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true)),
            });
        }
        async run(accessor, ...elements) {
            const crService = accessor.get(testingContinuousRunService_1.ITestingContinuousRunService);
            for (const element of elements) {
                const id = element.test.item.extId;
                if (crService.isSpecificallyEnabledFor(id)) {
                    crService.stop(id);
                    continue;
                }
                crService.start(2 /* TestRunProfileBitset.Run */, id);
            }
        }
    }
    exports.ContinuousRunTestAction = ContinuousRunTestAction;
    class ContinuousRunUsingProfileTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.continuousRunUsingForTest" /* TestCommandId.ContinousRunUsingForTest */,
                title: (0, nls_1.localize2)('testing.startContinuousRunUsing', 'Start Continous Run Using...'),
                icon: icons.testingDebugIcon,
                menu: [
                    {
                        id: actions_1.MenuId.TestItem,
                        order: 14 /* ActionOrder.RunContinuous */,
                        group: 'builtin@2',
                        when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(false))
                    }
                ],
            });
        }
        async run(accessor, ...elements) {
            const crService = accessor.get(testingContinuousRunService_1.ITestingContinuousRunService);
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            for (const element of elements) {
                const selected = await selectContinuousRunProfiles(crService, notificationService, quickInputService, [{ profiles: profileService.getControllerProfiles(element.test.controllerId) }]);
                if (selected.length) {
                    crService.start(selected, element.test.item.extId);
                }
            }
        }
    }
    exports.ContinuousRunUsingProfileTestAction = ContinuousRunUsingProfileTestAction;
    class ConfigureTestProfilesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.configureProfile" /* TestCommandId.ConfigureTestProfilesAction */,
                title: (0, nls_1.localize2)('testing.configureProfile', "Configure Test Profiles"),
                icon: icons.testingUpdateProfiles,
                f1: true,
                category,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasConfigurableProfile.isEqualTo(true),
                },
            });
        }
        async run(acessor, onlyGroup) {
            const commands = acessor.get(commands_1.ICommandService);
            const testProfileService = acessor.get(testProfileService_1.ITestProfileService);
            const profile = await commands.executeCommand('vscode.pickTestProfile', {
                placeholder: (0, nls_1.localize)('configureProfile', 'Select a profile to update'),
                showConfigureButtons: false,
                onlyConfigurable: true,
                onlyGroup,
            });
            if (profile) {
                testProfileService.configure(profile.controllerId, profile.profileId);
            }
        }
    }
    exports.ConfigureTestProfilesAction = ConfigureTestProfilesAction;
    const continuousMenus = (whenIsContinuousOn) => [
        {
            id: actions_1.MenuId.ViewTitle,
            group: 'navigation',
            order: 15 /* ActionOrder.RunUsing */,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(whenIsContinuousOn)),
        },
        {
            id: actions_1.MenuId.CommandPalette,
            when: testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true),
        },
    ];
    class StopContinuousRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.stopContinuousRun" /* TestCommandId.StopContinousRun */,
                title: (0, nls_1.localize2)('testing.stopContinuous', 'Stop Continuous Run'),
                category,
                icon: icons.testingTurnContinuousRunOff,
                menu: continuousMenus(true),
            });
        }
        run(accessor) {
            accessor.get(testingContinuousRunService_1.ITestingContinuousRunService).stop();
        }
    }
    function selectContinuousRunProfiles(crs, notificationService, quickInputService, profilesToPickFrom) {
        const items = [];
        for (const { controller, profiles } of profilesToPickFrom) {
            for (const profile of profiles) {
                if (profile.supportsContinuousRun) {
                    items.push({
                        label: profile.label || controller?.label.value || '',
                        description: controller?.label.value,
                        profile,
                    });
                }
            }
        }
        if (items.length === 0) {
            notificationService.info((0, nls_1.localize)('testing.noProfiles', 'No test continuous run-enabled profiles were found'));
            return Promise.resolve([]);
        }
        // special case: don't bother to quick a pickpick if there's only a single profile
        if (items.length === 1) {
            return Promise.resolve([items[0].profile]);
        }
        const qpItems = [];
        const selectedItems = [];
        const lastRun = crs.lastRunProfileIds;
        items.sort((a, b) => a.profile.group - b.profile.group
            || a.profile.controllerId.localeCompare(b.profile.controllerId)
            || a.label.localeCompare(b.label));
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (i === 0 || items[i - 1].profile.group !== item.profile.group) {
                qpItems.push({ type: 'separator', label: constants_1.testConfigurationGroupNames[item.profile.group] });
            }
            qpItems.push(item);
            if (lastRun.has(item.profile.profileId)) {
                selectedItems.push(item);
            }
        }
        const quickpick = quickInputService.createQuickPick();
        quickpick.title = (0, nls_1.localize)('testing.selectContinuousProfiles', 'Select profiles to run when files change:');
        quickpick.canSelectMany = true;
        quickpick.items = qpItems;
        quickpick.selectedItems = selectedItems;
        quickpick.show();
        return new Promise((resolve, reject) => {
            quickpick.onDidAccept(() => {
                resolve(quickpick.selectedItems.map(i => i.profile));
                quickpick.dispose();
            });
            quickpick.onDidHide(() => {
                resolve([]);
                quickpick.dispose();
            });
        });
    }
    class StartContinuousRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.startContinuousRun" /* TestCommandId.StartContinousRun */,
                title: (0, nls_1.localize2)('testing.startContinuous', "Start Continuous Run"),
                category,
                icon: icons.testingTurnContinuousRunOn,
                menu: continuousMenus(false),
            });
        }
        async run(accessor, ...args) {
            const crs = accessor.get(testingContinuousRunService_1.ITestingContinuousRunService);
            const selected = await selectContinuousRunProfiles(crs, accessor.get(notification_1.INotificationService), accessor.get(quickInput_1.IQuickInputService), accessor.get(testProfileService_1.ITestProfileService).all());
            if (selected.length) {
                crs.start(selected);
            }
        }
    }
    class ExecuteSelectedAction extends viewPane_1.ViewAction {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        order: group === 2 /* TestRunProfileBitset.Run */
                            ? 11 /* ActionOrder.Run */
                            : group === 4 /* TestRunProfileBitset.Debug */
                                ? 12 /* ActionOrder.Debug */
                                : 13 /* ActionOrder.Coverage */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.isRunning.isEqualTo(false), testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true))
                    }],
                category,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
            });
            this.group = group;
        }
        /**
         * @override
         */
        runInView(accessor, view) {
            const { include, exclude } = view.getTreeIncludeExclude();
            return accessor.get(testService_1.ITestService).runTests({ tests: include, exclude, group: this.group });
        }
    }
    class GetSelectedProfiles extends actions_1.Action2 {
        constructor() {
            super({ id: "testing.getSelectedProfiles" /* TestCommandId.GetSelectedProfiles */, title: (0, nls_1.localize2)('getSelectedProfiles', 'Get Selected Profiles') });
        }
        /**
         * @override
         */
        run(accessor) {
            const profiles = accessor.get(testProfileService_1.ITestProfileService);
            return [
                ...profiles.getGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */),
                ...profiles.getGroupDefaultProfiles(4 /* TestRunProfileBitset.Debug */),
                ...profiles.getGroupDefaultProfiles(8 /* TestRunProfileBitset.Coverage */),
            ].map(p => ({
                controllerId: p.controllerId,
                label: p.label,
                kind: p.group & 8 /* TestRunProfileBitset.Coverage */
                    ? 3 /* ExtTestRunProfileKind.Coverage */
                    : p.group & 4 /* TestRunProfileBitset.Debug */
                        ? 2 /* ExtTestRunProfileKind.Debug */
                        : 1 /* ExtTestRunProfileKind.Run */,
            }));
        }
    }
    exports.GetSelectedProfiles = GetSelectedProfiles;
    class GetExplorerSelection extends viewPane_1.ViewAction {
        constructor() {
            super({ id: "_testing.getExplorerSelection" /* TestCommandId.GetExplorerSelection */, title: (0, nls_1.localize2)('getExplorerSelection', 'Get Explorer Selection'), viewId: "workbench.view.testing" /* Testing.ExplorerViewId */ });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            const { include, exclude } = view.getTreeIncludeExclude(undefined, undefined, 'selected');
            const mapper = (i) => i.item.extId;
            return { include: include.map(mapper), exclude: exclude.map(mapper) };
        }
    }
    exports.GetExplorerSelection = GetExplorerSelection;
    class RunSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.runSelected" /* TestCommandId.RunSelectedAction */,
                title: LABEL_RUN_TESTS,
                icon: icons.testingRunAllIcon,
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunSelectedAction = RunSelectedAction;
    class DebugSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.debugSelected" /* TestCommandId.DebugSelectedAction */,
                title: LABEL_DEBUG_TESTS,
                icon: icons.testingDebugAllIcon,
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugSelectedAction = DebugSelectedAction;
    class CoverageSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.coverageSelected" /* TestCommandId.CoverageSelectedAction */,
                title: LABEL_COVERAGE_TESTS,
                icon: icons.testingCoverageAllIcon,
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    exports.CoverageSelectedAction = CoverageSelectedAction;
    const showDiscoveringWhile = (progress, task) => {
        return progress.withProgress({
            location: 10 /* ProgressLocation.Window */,
            title: (0, nls_1.localize)('discoveringTests', 'Discovering Tests'),
        }, () => task);
    };
    class RunOrDebugAllTestsAction extends actions_1.Action2 {
        constructor(options, group, noTestsFoundError) {
            super({
                ...options,
                category,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                    }]
            });
            this.group = group;
            this.noTestsFoundError = noTestsFoundError;
        }
        async run(accessor) {
            const testService = accessor.get(testService_1.ITestService);
            const notifications = accessor.get(notification_1.INotificationService);
            const roots = [...testService.collection.rootItems];
            if (!roots.length) {
                notifications.info(this.noTestsFoundError);
                return;
            }
            await testService.runTests({ tests: roots, group: this.group });
        }
    }
    class RunAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.runAll" /* TestCommandId.RunAllAction */,
                title: (0, nls_1.localize2)('runAllTests', 'Run All Tests'),
                icon: icons.testingRunAllIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 31 /* KeyCode.KeyA */),
                },
            }, 2 /* TestRunProfileBitset.Run */, (0, nls_1.localize)('noTestProvider', 'No tests found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.RunAllAction = RunAllAction;
    class DebugAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.debugAll" /* TestCommandId.DebugAllAction */,
                title: (0, nls_1.localize2)('debugAllTests', 'Debug All Tests'),
                icon: icons.testingDebugIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */),
                },
            }, 4 /* TestRunProfileBitset.Debug */, (0, nls_1.localize)('noDebugTestProvider', 'No debuggable tests found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.DebugAllAction = DebugAllAction;
    class CoverageAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.coverageAll" /* TestCommandId.RunAllWithCoverageAction */,
                title: (0, nls_1.localize2)('runAllWithCoverage', 'Run All Tests with Coverage'),
                icon: icons.testingCoverageIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */),
                },
            }, 8 /* TestRunProfileBitset.Coverage */, (0, nls_1.localize)('noCoverageTestProvider', 'No tests with coverage runners found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.CoverageAllAction = CoverageAllAction;
    class CancelTestRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.cancelRun" /* TestCommandId.CancelTestRunAction */,
                title: (0, nls_1.localize2)('testing.cancelRun', 'Cancel Test Run'),
                icon: icons.testingCancelIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */),
                },
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 11 /* ActionOrder.Run */,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), contextkey_1.ContextKeyExpr.equals(testingContextKeys_1.TestingContextKeys.isRunning.serialize(), true))
                }
            });
        }
        /**
         * @override
         */
        async run(accessor) {
            const resultService = accessor.get(testResultService_1.ITestResultService);
            const testService = accessor.get(testService_1.ITestService);
            for (const run of resultService.results) {
                if (!run.completedAt) {
                    testService.cancelTestRun(run.id);
                }
            }
        }
    }
    exports.CancelTestRunAction = CancelTestRunAction;
    class TestingViewAsListAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.viewAsList" /* TestCommandId.TestingViewAsListAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.viewAsList', 'View as List'),
                toggled: testingContextKeys_1.TestingContextKeys.viewMode.isEqualTo("list" /* TestExplorerViewMode.List */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 18 /* ActionOrder.DisplayMode */,
                    group: 'viewAs',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewMode = "list" /* TestExplorerViewMode.List */;
        }
    }
    exports.TestingViewAsListAction = TestingViewAsListAction;
    class TestingViewAsTreeAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.viewAsTree" /* TestCommandId.TestingViewAsTreeAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.viewAsTree', 'View as Tree'),
                toggled: testingContextKeys_1.TestingContextKeys.viewMode.isEqualTo("true" /* TestExplorerViewMode.Tree */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 18 /* ActionOrder.DisplayMode */,
                    group: 'viewAs',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewMode = "true" /* TestExplorerViewMode.Tree */;
        }
    }
    exports.TestingViewAsTreeAction = TestingViewAsTreeAction;
    class TestingSortByStatusAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByStatus" /* TestCommandId.TestingSortByStatusAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.sortByStatus', 'Sort by Status'),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("status" /* TestExplorerViewSorting.ByStatus */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "status" /* TestExplorerViewSorting.ByStatus */;
        }
    }
    exports.TestingSortByStatusAction = TestingSortByStatusAction;
    class TestingSortByLocationAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByLocation" /* TestCommandId.TestingSortByLocationAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.sortByLocation', 'Sort by Location'),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("location" /* TestExplorerViewSorting.ByLocation */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "location" /* TestExplorerViewSorting.ByLocation */;
        }
    }
    exports.TestingSortByLocationAction = TestingSortByLocationAction;
    class TestingSortByDurationAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByDuration" /* TestCommandId.TestingSortByDurationAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.sortByDuration', 'Sort by Duration'),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("duration" /* TestExplorerViewSorting.ByDuration */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "duration" /* TestExplorerViewSorting.ByDuration */;
        }
    }
    exports.TestingSortByDurationAction = TestingSortByDurationAction;
    class ShowMostRecentOutputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.showMostRecentOutput" /* TestCommandId.ShowMostRecentOutputAction */,
                title: (0, nls_1.localize2)('testing.showMostRecentOutput', 'Show Output'),
                category,
                icon: codicons_1.Codicon.terminal,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */),
                },
                precondition: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        order: 16 /* ActionOrder.Collapse */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */),
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true)
                    }]
            });
        }
        async run(accessor) {
            const viewService = accessor.get(viewsService_1.IViewsService);
            const testView = await viewService.openView("workbench.panel.testResults.view" /* Testing.ResultsViewId */, true);
            testView?.showLatestRun();
        }
    }
    exports.ShowMostRecentOutputAction = ShowMostRecentOutputAction;
    class CollapseAllAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.collapseAll" /* TestCommandId.CollapseAllAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.collapseAll', 'Collapse All Tests'),
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 16 /* ActionOrder.Collapse */,
                    group: 'displayAction',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.collapseAll();
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
    class ClearTestResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.clearTestResults" /* TestCommandId.ClearTestResultsAction */,
                title: (0, nls_1.localize2)('testing.clearResults', 'Clear All Results'),
                category,
                icon: codicons_1.Codicon.clearAll,
                menu: [{
                        id: actions_1.MenuId.TestPeekTitle,
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        order: 17 /* ActionOrder.ClearResults */,
                        group: 'displayAction',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        order: 17 /* ActionOrder.ClearResults */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.panel.testResults.view" /* Testing.ResultsViewId */)
                    }],
            });
        }
        /**
         * @override
         */
        run(accessor) {
            accessor.get(testResultService_1.ITestResultService).clear();
        }
    }
    exports.ClearTestResultsAction = ClearTestResultsAction;
    class GoToTest extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.editFocusedTest" /* TestCommandId.GoToTest */,
                title: (0, nls_1.localize2)('testing.editFocusedTest', 'Go to Test'),
                icon: codicons_1.Codicon.goToFile,
                menu: testItemInlineAndInContext(20 /* ActionOrder.GoToTest */, testingContextKeys_1.TestingContextKeys.testItemHasUri.isEqualTo(true)),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
                    when: contextkeys_1.FocusedViewContext.isEqualTo("workbench.view.testing" /* Testing.ExplorerViewId */),
                    primary: 3 /* KeyCode.Enter */ | 512 /* KeyMod.Alt */,
                },
            });
        }
        async run(accessor, element, preserveFocus) {
            if (!element) {
                const view = accessor.get(viewsService_1.IViewsService).getActiveViewWithId("workbench.view.testing" /* Testing.ExplorerViewId */);
                element = view?.focusedTreeElements[0];
            }
            if (element && element instanceof index_1.TestItemTreeElement) {
                accessor.get(commands_1.ICommandService).executeCommand('vscode.revealTest', element.test.item.extId, preserveFocus);
            }
        }
    }
    exports.GoToTest = GoToTest;
    class ExecuteTestAtCursor extends actions_1.Action2 {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: hasAnyTestProvider,
                    }, {
                        id: actions_1.MenuId.EditorContext,
                        group: 'testing',
                        order: group === 2 /* TestRunProfileBitset.Run */ ? 11 /* ActionOrder.Run */ : 12 /* ActionOrder.Debug */,
                        when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.activeEditorHasTests, testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group]),
                    }]
            });
            this.group = group;
        }
        /**
         * @override
         */
        async run(accessor) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            let editor = codeEditorService.getActiveCodeEditor();
            if (!activeEditorPane || !editor) {
                return;
            }
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                editor = editor.getParentEditor();
            }
            const position = editor?.getPosition();
            const model = editor?.getModel();
            if (!position || !model || !('uri' in model)) {
                return;
            }
            const testService = accessor.get(testService_1.ITestService);
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            const progressService = accessor.get(progress_1.IProgressService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            let bestNodes = [];
            let bestRange;
            let bestNodesBefore = [];
            let bestRangeBefore;
            const saveBeforeTest = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */);
            if (saveBeforeTest) {
                await editorService.save({ editor: activeEditorPane.input, groupId: activeEditorPane.group.id });
                await testService.syncTests();
            }
            // testsInFile will descend in the test tree. We assume that as we go
            // deeper, ranges get more specific. We'll want to run all tests whose
            // range is equal to the most specific range we find (see #133519)
            //
            // If we don't find any test whose range contains the position, we pick
            // the closest one before the position. Again, if we find several tests
            // whose range is equal to the closest one, we run them all.
            await showDiscoveringWhile(progressService, (async () => {
                for await (const test of (0, testService_1.testsInFile)(testService, uriIdentityService, model.uri)) {
                    if (!test.item.range || !(profileService.capabilitiesForTest(test) & this.group)) {
                        continue;
                    }
                    const irange = range_1.Range.lift(test.item.range);
                    if (irange.containsPosition(position)) {
                        if (bestRange && range_1.Range.equalsRange(test.item.range, bestRange)) {
                            // check that a parent isn't already included (#180760)
                            if (!bestNodes.some(b => testId_1.TestId.isChild(b.item.extId, test.item.extId))) {
                                bestNodes.push(test);
                            }
                        }
                        else {
                            bestRange = irange;
                            bestNodes = [test];
                        }
                    }
                    else if (position_1.Position.isBefore(irange.getStartPosition(), position)) {
                        if (!bestRangeBefore || bestRangeBefore.getStartPosition().isBefore(irange.getStartPosition())) {
                            bestRangeBefore = irange;
                            bestNodesBefore = [test];
                        }
                        else if (irange.equalsRange(bestRangeBefore) && !bestNodesBefore.some(b => testId_1.TestId.isChild(b.item.extId, test.item.extId))) {
                            bestNodesBefore.push(test);
                        }
                    }
                }
            })());
            const testsToRun = bestNodes.length ? bestNodes : bestNodesBefore;
            if (testsToRun.length) {
                await testService.runTests({
                    group: this.group,
                    tests: bestNodes.length ? bestNodes : bestNodesBefore,
                });
            }
            else if (editor) {
                messageController_1.MessageController.get(editor)?.showMessage((0, nls_1.localize)('noTestsAtCursor', "No tests found here"), position);
            }
        }
    }
    class RunAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.runAtCursor" /* TestCommandId.RunAtCursor */,
                title: (0, nls_1.localize2)('testing.runAtCursor', 'Run Test at Cursor'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 33 /* KeyCode.KeyC */),
                },
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunAtCursor = RunAtCursor;
    class DebugAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.debugAtCursor" /* TestCommandId.DebugAtCursor */,
                title: (0, nls_1.localize2)('testing.debugAtCursor', 'Debug Test at Cursor'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                },
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugAtCursor = DebugAtCursor;
    class CoverageAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.coverageAtCursor" /* TestCommandId.CoverageAtCursor */,
                title: (0, nls_1.localize2)('testing.coverageAtCursor', 'Run Test at Cursor with Coverage'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */),
                },
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    exports.CoverageAtCursor = CoverageAtCursor;
    class ExecuteTestsUnderUriAction extends actions_1.Action2 {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.ExplorerContext,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                        group: '6.5_testing',
                        order: (group === 2 /* TestRunProfileBitset.Run */ ? 11 /* ActionOrder.Run */ : 12 /* ActionOrder.Debug */) + 0.1,
                    }],
            });
            this.group = group;
        }
        async run(accessor, uri) {
            const testService = accessor.get(testService_1.ITestService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const tests = await iterator_1.Iterable.asyncToArray((0, testService_1.testsUnderUri)(testService, accessor.get(uriIdentity_1.IUriIdentityService), uri));
            if (!tests.length) {
                notificationService.notify({ message: (0, nls_1.localize)('noTests', 'No tests found in the selected file or folder'), severity: notification_1.Severity.Info });
                return;
            }
            return testService.runTests({ tests, group: this.group });
        }
    }
    class RunTestsUnderUri extends ExecuteTestsUnderUriAction {
        constructor() {
            super({
                id: "testing.run.uri" /* TestCommandId.RunByUri */,
                title: LABEL_RUN_TESTS,
                category,
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    class DebugTestsUnderUri extends ExecuteTestsUnderUriAction {
        constructor() {
            super({
                id: "testing.debug.uri" /* TestCommandId.DebugByUri */,
                title: LABEL_DEBUG_TESTS,
                category,
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    class CoverageTestsUnderUri extends ExecuteTestsUnderUriAction {
        constructor() {
            super({
                id: "testing.coverage.uri" /* TestCommandId.CoverageByUri */,
                title: LABEL_COVERAGE_TESTS,
                category,
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    class ExecuteTestsInCurrentFile extends actions_1.Action2 {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                    }, {
                        id: actions_1.MenuId.EditorContext,
                        group: 'testing',
                        // add 0.1 to be after the "at cursor" commands
                        order: (group === 2 /* TestRunProfileBitset.Run */ ? 11 /* ActionOrder.Run */ : 12 /* ActionOrder.Debug */) + 0.1,
                        when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.activeEditorHasTests, testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group]),
                    }],
            });
            this.group = group;
        }
        /**
         * @override
         */
        run(accessor) {
            let editor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor();
            if (!editor) {
                return;
            }
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                editor = editor.getParentEditor();
            }
            const position = editor?.getPosition();
            const model = editor?.getModel();
            if (!position || !model || !('uri' in model)) {
                return;
            }
            const testService = accessor.get(testService_1.ITestService);
            const demandedUri = model.uri.toString();
            // Iterate through the entire collection and run any tests that are in the
            // uri. See #138007.
            const queue = [testService.collection.rootIds];
            const discovered = [];
            while (queue.length) {
                for (const id of queue.pop()) {
                    const node = testService.collection.getNodeById(id);
                    if (node.item.uri?.toString() === demandedUri) {
                        discovered.push(node);
                    }
                    else {
                        queue.push(node.children);
                    }
                }
            }
            if (discovered.length) {
                return testService.runTests({
                    tests: discovered,
                    group: this.group,
                });
            }
            if (editor) {
                messageController_1.MessageController.get(editor)?.showMessage((0, nls_1.localize)('noTestsInFile', "No tests found in this file"), position);
            }
            return undefined;
        }
    }
    class RunCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.runCurrentFile" /* TestCommandId.RunCurrentFile */,
                title: (0, nls_1.localize2)('testing.runCurrentFile', 'Run Tests in Current File'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 36 /* KeyCode.KeyF */),
                },
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunCurrentFile = RunCurrentFile;
    class DebugCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.debugCurrentFile" /* TestCommandId.DebugCurrentFile */,
                title: (0, nls_1.localize2)('testing.debugCurrentFile', 'Debug Tests in Current File'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */),
                },
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugCurrentFile = DebugCurrentFile;
    class CoverageCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.coverageCurrentFile" /* TestCommandId.CoverageCurrentFile */,
                title: (0, nls_1.localize2)('testing.coverageCurrentFile', 'Run Tests with Coverage in Current File'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */),
                },
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    exports.CoverageCurrentFile = CoverageCurrentFile;
    const discoverAndRunTests = async (collection, progress, ids, runTests) => {
        const todo = Promise.all(ids.map(p => (0, testService_1.expandAndGetTestById)(collection, p)));
        const tests = (await showDiscoveringWhile(progress, todo)).filter(types_1.isDefined);
        return tests.length ? await runTests(tests) : undefined;
    };
    exports.discoverAndRunTests = discoverAndRunTests;
    class RunOrDebugExtsByPath extends actions_1.Action2 {
        /**
         * @override
         */
        async run(accessor, ...args) {
            const testService = accessor.get(testService_1.ITestService);
            await (0, exports.discoverAndRunTests)(accessor.get(testService_1.ITestService).collection, accessor.get(progress_1.IProgressService), [...this.getTestExtIdsToRun(accessor, ...args)], tests => this.runTest(testService, tests));
        }
    }
    class RunOrDebugFailedTests extends RunOrDebugExtsByPath {
        constructor(options) {
            super({
                ...options,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: hasAnyTestProvider,
                },
            });
        }
        /**
         * @inheritdoc
         */
        getTestExtIdsToRun(accessor) {
            const { results } = accessor.get(testResultService_1.ITestResultService);
            const ids = new Set();
            for (let i = results.length - 1; i >= 0; i--) {
                const resultSet = results[i];
                for (const test of resultSet.tests) {
                    if ((0, testingStates_1.isFailedState)(test.ownComputedState)) {
                        ids.add(test.item.extId);
                    }
                    else {
                        ids.delete(test.item.extId);
                    }
                }
            }
            return ids;
        }
    }
    class RunOrDebugLastRun extends RunOrDebugExtsByPath {
        constructor(options) {
            super({
                ...options,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(hasAnyTestProvider, testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true)),
                },
            });
        }
        /**
         * @inheritdoc
         */
        *getTestExtIdsToRun(accessor, runId) {
            const resultService = accessor.get(testResultService_1.ITestResultService);
            const lastResult = runId ? resultService.results.find(r => r.id === runId) : resultService.results[0];
            if (!lastResult) {
                return;
            }
            for (const test of lastResult.request.targets) {
                for (const testId of test.testIds) {
                    yield testId;
                }
            }
        }
    }
    class ReRunFailedTests extends RunOrDebugFailedTests {
        constructor() {
            super({
                id: "testing.reRunFailTests" /* TestCommandId.ReRunFailedTests */,
                title: (0, nls_1.localize2)('testing.reRunFailTests', 'Rerun Failed Tests'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 35 /* KeyCode.KeyE */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 2 /* TestRunProfileBitset.Run */,
                tests: internalTests,
            });
        }
    }
    exports.ReRunFailedTests = ReRunFailedTests;
    class DebugFailedTests extends RunOrDebugFailedTests {
        constructor() {
            super({
                id: "testing.debugFailTests" /* TestCommandId.DebugFailedTests */,
                title: (0, nls_1.localize2)('testing.debugFailTests', 'Debug Failed Tests'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 4 /* TestRunProfileBitset.Debug */,
                tests: internalTests,
            });
        }
    }
    exports.DebugFailedTests = DebugFailedTests;
    class ReRunLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.reRunLastRun" /* TestCommandId.ReRunLastRun */,
                title: (0, nls_1.localize2)('testing.reRunLastRun', 'Rerun Last Run'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 2 /* TestRunProfileBitset.Run */,
                tests: internalTests,
            });
        }
    }
    exports.ReRunLastRun = ReRunLastRun;
    class DebugLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.debugLastRun" /* TestCommandId.DebugLastRun */,
                title: (0, nls_1.localize2)('testing.debugLastRun', 'Debug Last Run'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 4 /* TestRunProfileBitset.Debug */,
                tests: internalTests,
            });
        }
    }
    exports.DebugLastRun = DebugLastRun;
    class CoverageLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.coverageLastRun" /* TestCommandId.CoverageLastRun */,
                title: (0, nls_1.localize2)('testing.coverageLastRun', 'Rerun Last Run with Coverage'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 8 /* TestRunProfileBitset.Coverage */,
                tests: internalTests,
            });
        }
    }
    exports.CoverageLastRun = CoverageLastRun;
    class SearchForTestExtension extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.searchForTestExtension" /* TestCommandId.SearchForTestExtension */,
                title: (0, nls_1.localize2)('testing.searchForTestExtension', 'Search for Test Extension'),
            });
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = (await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))?.getViewPaneContainer();
            viewlet.search('@category:"testing"');
            viewlet.focus();
        }
    }
    exports.SearchForTestExtension = SearchForTestExtension;
    class OpenOutputPeek extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.openOutputPeek" /* TestCommandId.OpenOutputPeek */,
                title: (0, nls_1.localize2)('testing.openOutputPeek', 'Peek Output'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */),
                },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                },
            });
        }
        async run(accessor) {
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).open();
        }
    }
    exports.OpenOutputPeek = OpenOutputPeek;
    class ToggleInlineTestOutput extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.toggleInlineTestOutput" /* TestCommandId.ToggleInlineTestOutput */,
                title: (0, nls_1.localize2)('testing.toggleInlineTestOutput', 'Toggle Inline Test Output'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                },
            });
        }
        async run(accessor) {
            const testService = accessor.get(testService_1.ITestService);
            testService.showInlineOutput.value = !testService.showInlineOutput.value;
        }
    }
    exports.ToggleInlineTestOutput = ToggleInlineTestOutput;
    const refreshMenus = (whenIsRefreshing) => [
        {
            id: actions_1.MenuId.TestItem,
            group: 'inline',
            order: 10 /* ActionOrder.Refresh */,
            when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isRefreshingTests.isEqualTo(whenIsRefreshing)),
        },
        {
            id: actions_1.MenuId.ViewTitle,
            group: 'navigation',
            order: 10 /* ActionOrder.Refresh */,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isRefreshingTests.isEqualTo(whenIsRefreshing)),
        },
        {
            id: actions_1.MenuId.CommandPalette,
            when: testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true),
        },
    ];
    class RefreshTestsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.refreshTests" /* TestCommandId.RefreshTestsAction */,
                title: (0, nls_1.localize2)('testing.refreshTests', 'Refresh Tests'),
                category,
                icon: icons.testingRefreshTests,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */),
                    when: testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true),
                },
                menu: refreshMenus(false),
            });
        }
        async run(accessor, ...elements) {
            const testService = accessor.get(testService_1.ITestService);
            const progressService = accessor.get(progress_1.IProgressService);
            const controllerIds = (0, arrays_1.distinct)(elements.filter(types_1.isDefined).map(e => e.test.controllerId));
            return progressService.withProgress({ location: "workbench.view.extension.test" /* Testing.ViewletId */ }, async () => {
                if (controllerIds.length) {
                    await Promise.all(controllerIds.map(id => testService.refreshTests(id)));
                }
                else {
                    await testService.refreshTests();
                }
            });
        }
    }
    exports.RefreshTestsAction = RefreshTestsAction;
    class CancelTestRefreshAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.cancelTestRefresh" /* TestCommandId.CancelTestRefreshAction */,
                title: (0, nls_1.localize2)('testing.cancelTestRefresh', 'Cancel Test Refresh'),
                category,
                icon: icons.testingCancelRefreshTests,
                menu: refreshMenus(true),
            });
        }
        async run(accessor) {
            accessor.get(testService_1.ITestService).cancelRefreshTests();
        }
    }
    exports.CancelTestRefreshAction = CancelTestRefreshAction;
    class CleareCoverage extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.coverage.close" /* TestCommandId.CoverageClear */,
                title: (0, nls_1.localize2)('testing.clearCoverage', 'Clear Coverage'),
                icon: iconRegistry_1.widgetClose,
                category,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 10 /* ActionOrder.Refresh */,
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testCoverage" /* Testing.CoverageViewId */)
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.isTestCoverageOpen.isEqualTo(true),
                    }]
            });
        }
        run(accessor) {
            accessor.get(testCoverageService_1.ITestCoverageService).closeCoverage();
        }
    }
    exports.CleareCoverage = CleareCoverage;
    class OpenCoverage extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.openCoverage" /* TestCommandId.OpenCoverage */,
                title: (0, nls_1.localize2)('testing.openCoverage', 'Open Coverage'),
                category,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                    }]
            });
        }
        run(accessor) {
            const results = accessor.get(testResultService_1.ITestResultService).results;
            const task = results.length && results[0].tasks.find(r => r.coverage);
            if (!task) {
                const notificationService = accessor.get(notification_1.INotificationService);
                notificationService.info((0, nls_1.localize)('testing.noCoverage', 'No coverage information available on the last test run.'));
                return;
            }
            accessor.get(testCoverageService_1.ITestCoverageService).openCoverage(task, true);
        }
    }
    exports.OpenCoverage = OpenCoverage;
    exports.allTestActions = [
        CancelTestRefreshAction,
        CancelTestRunAction,
        ClearTestResultsAction,
        CleareCoverage,
        CollapseAllAction,
        ConfigureTestProfilesAction,
        ContinuousRunTestAction,
        ContinuousRunUsingProfileTestAction,
        CoverageAction,
        CoverageAllAction,
        CoverageAtCursor,
        CoverageCurrentFile,
        CoverageLastRun,
        CoverageSelectedAction,
        CoverageTestsUnderUri,
        DebugAction,
        DebugAllAction,
        DebugAtCursor,
        DebugCurrentFile,
        DebugFailedTests,
        DebugLastRun,
        DebugSelectedAction,
        DebugTestsUnderUri,
        GetExplorerSelection,
        GetSelectedProfiles,
        GoToTest,
        HideTestAction,
        OpenCoverage,
        OpenOutputPeek,
        RefreshTestsAction,
        ReRunFailedTests,
        ReRunLastRun,
        RunAction,
        RunAllAction,
        RunAtCursor,
        RunCurrentFile,
        RunSelectedAction,
        RunTestsUnderUri,
        RunUsingProfileAction,
        SearchForTestExtension,
        SelectDefaultTestProfiles,
        ShowMostRecentOutputAction,
        StartContinuousRunAction,
        StopContinuousRunAction,
        TestingSortByDurationAction,
        TestingSortByLocationAction,
        TestingSortByStatusAction,
        TestingViewAsListAction,
        TestingViewAsTreeAction,
        ToggleInlineTestOutput,
        UnhideAllTestsAction,
        UnhideTestAction,
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4cGxvcmVyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90ZXN0RXhwbG9yZXJBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9EaEcsTUFBTSxRQUFRLEdBQUcsbUNBQVUsQ0FBQyxJQUFJLENBQUM7SUFFakMsSUFBVyxXQWlCVjtJQWpCRCxXQUFXLFdBQVc7UUFDckIsY0FBYztRQUNkLG9EQUFZLENBQUE7UUFDWiw0Q0FBRyxDQUFBO1FBQ0gsZ0RBQUssQ0FBQTtRQUNMLHNEQUFRLENBQUE7UUFDUixnRUFBYSxDQUFBO1FBQ2Isc0RBQVEsQ0FBQTtRQUVSLFdBQVc7UUFDWCxzREFBUSxDQUFBO1FBQ1IsOERBQVksQ0FBQTtRQUNaLDREQUFXLENBQUE7UUFDWCw4Q0FBSSxDQUFBO1FBQ0osc0RBQVEsQ0FBQTtRQUNSLHNEQUFRLENBQUE7UUFDUixnRkFBNEIsQ0FBQTtJQUM3QixDQUFDLEVBakJVLFdBQVcsS0FBWCxXQUFXLFFBaUJyQjtJQUVELE1BQU0sa0JBQWtCLEdBQUcsa0NBQXFCLENBQUMsTUFBTSxDQUFDLHVDQUFrQixDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFakcsTUFBTSxlQUFlLEdBQUcsSUFBQSxlQUFTLEVBQUMsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDbkUsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN6RSxNQUFNLG9CQUFvQixHQUFHLElBQUEsZUFBUyxFQUFDLHVCQUF1QixFQUFFLHlCQUF5QixDQUFDLENBQUM7SUFFM0YsTUFBYSxjQUFlLFNBQVEsaUJBQU87UUFDMUM7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