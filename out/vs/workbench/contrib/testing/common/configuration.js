/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/observable", "vs/nls"], function (require, exports, observable_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.observeTestingConfiguration = exports.getTestingConfiguration = exports.testingConfiguration = exports.TestingDisplayedCoveragePercent = exports.TestingCountBadge = exports.DefaultGutterClickAction = exports.AutoOpenPeekViewWhen = exports.AutoOpenTesting = exports.TestingConfigKeys = void 0;
    var TestingConfigKeys;
    (function (TestingConfigKeys) {
        TestingConfigKeys["AutoRunDelay"] = "testing.autoRun.delay";
        TestingConfigKeys["AutoOpenPeekView"] = "testing.automaticallyOpenPeekView";
        TestingConfigKeys["AutoOpenPeekViewDuringContinuousRun"] = "testing.automaticallyOpenPeekViewDuringAutoRun";
        TestingConfigKeys["OpenTesting"] = "testing.openTesting";
        TestingConfigKeys["FollowRunningTest"] = "testing.followRunningTest";
        TestingConfigKeys["DefaultGutterClickAction"] = "testing.defaultGutterClickAction";
        TestingConfigKeys["GutterEnabled"] = "testing.gutterEnabled";
        TestingConfigKeys["SaveBeforeTest"] = "testing.saveBeforeTest";
        TestingConfigKeys["AlwaysRevealTestOnStateChange"] = "testing.alwaysRevealTestOnStateChange";
        TestingConfigKeys["CountBadge"] = "testing.countBadge";
        TestingConfigKeys["ShowAllMessages"] = "testing.showAllMessages";
        TestingConfigKeys["CoveragePercent"] = "testing.displayedCoveragePercent";
        TestingConfigKeys["ShowCoverageInExplorer"] = "testing.showCoverageInExplorer";
        TestingConfigKeys["CoverageBarThresholds"] = "testing.coverageBarThresholds";
    })(TestingConfigKeys || (exports.TestingConfigKeys = TestingConfigKeys = {}));
    var AutoOpenTesting;
    (function (AutoOpenTesting) {
        AutoOpenTesting["NeverOpen"] = "neverOpen";
        AutoOpenTesting["OpenOnTestStart"] = "openOnTestStart";
        AutoOpenTesting["OpenOnTestFailure"] = "openOnTestFailure";
        AutoOpenTesting["OpenExplorerOnTestStart"] = "openExplorerOnTestStart";
    })(AutoOpenTesting || (exports.AutoOpenTesting = AutoOpenTesting = {}));
    var AutoOpenPeekViewWhen;
    (function (AutoOpenPeekViewWhen) {
        AutoOpenPeekViewWhen["FailureVisible"] = "failureInVisibleDocument";
        AutoOpenPeekViewWhen["FailureAnywhere"] = "failureAnywhere";
        AutoOpenPeekViewWhen["Never"] = "never";
    })(AutoOpenPeekViewWhen || (exports.AutoOpenPeekViewWhen = AutoOpenPeekViewWhen = {}));
    var DefaultGutterClickAction;
    (function (DefaultGutterClickAction) {
        DefaultGutterClickAction["Run"] = "run";
        DefaultGutterClickAction["Debug"] = "debug";
        DefaultGutterClickAction["Coverage"] = "runWithCoverage";
        DefaultGutterClickAction["ContextMenu"] = "contextMenu";
    })(DefaultGutterClickAction || (exports.DefaultGutterClickAction = DefaultGutterClickAction = {}));
    var TestingCountBadge;
    (function (TestingCountBadge) {
        TestingCountBadge["Failed"] = "failed";
        TestingCountBadge["Off"] = "off";
        TestingCountBadge["Passed"] = "passed";
        TestingCountBadge["Skipped"] = "skipped";
    })(TestingCountBadge || (exports.TestingCountBadge = TestingCountBadge = {}));
    var TestingDisplayedCoveragePercent;
    (function (TestingDisplayedCoveragePercent) {
        TestingDisplayedCoveragePercent["TotalCoverage"] = "totalCoverage";
        TestingDisplayedCoveragePercent["Statement"] = "statement";
        TestingDisplayedCoveragePercent["Minimum"] = "minimum";
    })(TestingDisplayedCoveragePercent || (exports.TestingDisplayedCoveragePercent = TestingDisplayedCoveragePercent = {}));
    exports.testingConfiguration = {
        id: 'testing',
        order: 21,
        title: (0, nls_1.localize)('testConfigurationTitle', "Testing"),
        type: 'object',
        properties: {
            ["testing.autoRun.delay" /* TestingConfigKeys.AutoRunDelay */]: {
                type: 'integer',
                minimum: 0,
                description: (0, nls_1.localize)('testing.autoRun.delay', "How long to wait, in milliseconds, after a test is marked as outdated and starting a new run."),
                default: 1000,
            },
            ["testing.automaticallyOpenPeekView" /* TestingConfigKeys.AutoOpenPeekView */]: {
                description: (0, nls_1.localize)('testing.automaticallyOpenPeekView', "Configures when the error Peek view is automatically opened."),
                enum: [
                    "failureAnywhere" /* AutoOpenPeekViewWhen.FailureAnywhere */,
                    "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */,
                    "never" /* AutoOpenPeekViewWhen.Never */,
                ],
                default: "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */,
                enumDescriptions: [
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.failureAnywhere', "Open automatically no matter where the failure is."),
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.failureInVisibleDocument', "Open automatically when a test fails in a visible document."),
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.never', "Never automatically open."),
                ],
            },
            ["testing.showAllMessages" /* TestingConfigKeys.ShowAllMessages */]: {
                description: (0, nls_1.localize)('testing.showAllMessages', "Controls whether to show messages from all test runs."),
                type: 'boolean',
                default: false,
            },
            ["testing.automaticallyOpenPeekViewDuringAutoRun" /* TestingConfigKeys.AutoOpenPeekViewDuringContinuousRun */]: {
                description: (0, nls_1.localize)('testing.automaticallyOpenPeekViewDuringContinuousRun', "Controls whether to automatically open the Peek view during continuous run mode."),
                type: 'boolean',
                default: false,
            },
            ["testing.countBadge" /* TestingConfigKeys.CountBadge */]: {
                description: (0, nls_1.localize)('testing.countBadge', 'Controls the count badge on the Testing icon on the Activity Bar.'),
                enum: [
                    "failed" /* TestingCountBadge.Failed */,
                    "off" /* TestingCountBadge.Off */,
                    "passed" /* TestingCountBadge.Passed */,
                    "skipped" /* TestingCountBadge.Skipped */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.countBadge.failed', 'Show the number of failed tests'),
                    (0, nls_1.localize)('testing.countBadge.off', 'Disable the testing count badge'),
                    (0, nls_1.localize)('testing.countBadge.passed', 'Show the number of passed tests'),
                    (0, nls_1.localize)('testing.countBadge.skipped', 'Show the number of skipped tests'),
                ],
                default: "failed" /* TestingCountBadge.Failed */,
            },
            ["testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */]: {
                description: (0, nls_1.localize)('testing.followRunningTest', 'Controls whether the running test should be followed in the Test Explorer view.'),
                type: 'boolean',
                default: true,
            },
            ["testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */]: {
                description: (0, nls_1.localize)('testing.defaultGutterClickAction', 'Controls the action to take when left-clicking on a test decoration in the gutter.'),
                enum: [
                    "run" /* DefaultGutterClickAction.Run */,
                    "debug" /* DefaultGutterClickAction.Debug */,
                    "runWithCoverage" /* DefaultGutterClickAction.Coverage */,
                    "contextMenu" /* DefaultGutterClickAction.ContextMenu */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.defaultGutterClickAction.run', 'Run the test.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.debug', 'Debug the test.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.coverage', 'Run the test with coverage.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.contextMenu', 'Open the context menu for more options.'),
                ],
                default: "run" /* DefaultGutterClickAction.Run */,
            },
            ["testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */]: {
                description: (0, nls_1.localize)('testing.gutterEnabled', 'Controls whether test decorations are shown in the editor gutter.'),
                type: 'boolean',
                default: true,
            },
            ["testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */]: {
                description: (0, nls_1.localize)('testing.saveBeforeTest', 'Control whether save all dirty editors before running a test.'),
                type: 'boolean',
                default: true,
            },
            ["testing.openTesting" /* TestingConfigKeys.OpenTesting */]: {
                enum: [
                    "neverOpen" /* AutoOpenTesting.NeverOpen */,
                    "openOnTestStart" /* AutoOpenTesting.OpenOnTestStart */,
                    "openOnTestFailure" /* AutoOpenTesting.OpenOnTestFailure */,
                    "openExplorerOnTestStart" /* AutoOpenTesting.OpenExplorerOnTestStart */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.openTesting.neverOpen', 'Never automatically open the testing views'),
                    (0, nls_1.localize)('testing.openTesting.openOnTestStart', 'Open the test results view when tests start'),
                    (0, nls_1.localize)('testing.openTesting.openOnTestFailure', 'Open the test result view on any test failure'),
                    (0, nls_1.localize)('testing.openTesting.openExplorerOnTestStart', 'Open the test explorer when tests start'),
                ],
                default: 'openOnTestStart',
                description: (0, nls_1.localize)('testing.openTesting', "Controls when the testing view should open.")
            },
            ["testing.alwaysRevealTestOnStateChange" /* TestingConfigKeys.AlwaysRevealTestOnStateChange */]: {
                markdownDescription: (0, nls_1.localize)('testing.alwaysRevealTestOnStateChange', "Always reveal the executed test when `#testing.followRunningTest#` is on. If this setting is turned off, only failed tests will be revealed."),
                type: 'boolean',
                default: false,
            },
            ["testing.showCoverageInExplorer" /* TestingConfigKeys.ShowCoverageInExplorer */]: {
                description: (0, nls_1.localize)('testing.ShowCoverageInExplorer', "Whether test coverage should be down in the File Explorer view."),
                type: 'boolean',
                default: true,
            },
            ["testing.displayedCoveragePercent" /* TestingConfigKeys.CoveragePercent */]: {
                markdownDescription: (0, nls_1.localize)('testing.displayedCoveragePercent', "Configures what percentage is displayed by default for test coverage."),
                default: "totalCoverage" /* TestingDisplayedCoveragePercent.TotalCoverage */,
                enum: [
                    "totalCoverage" /* TestingDisplayedCoveragePercent.TotalCoverage */,
                    "statement" /* TestingDisplayedCoveragePercent.Statement */,
                    "minimum" /* TestingDisplayedCoveragePercent.Minimum */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.displayedCoveragePercent.totalCoverage', 'A calculation of the combined statement, function, and branch coverage.'),
                    (0, nls_1.localize)('testing.displayedCoveragePercent.statement', 'The statement coverage.'),
                    (0, nls_1.localize)('testing.displayedCoveragePercent.minimum', 'The minimum of statement, function, and branch coverage.'),
                ],
            },
            ["testing.coverageBarThresholds" /* TestingConfigKeys.CoverageBarThresholds */]: {
                markdownDescription: (0, nls_1.localize)('testing.coverageBarThresholds', "Configures the colors used for percentages in test coverage bars."),
                default: { red: 0, yellow: 60, green: 90 },
                properties: {
                    red: { type: 'number', minimum: 0, maximum: 100, default: 0 },
                    yellow: { type: 'number', minimum: 0, maximum: 100, default: 60 },
                    green: { type: 'number', minimum: 0, maximum: 100, default: 90 },
                },
            },
        }
    };
    const getTestingConfiguration = (config, key) => config.getValue(key);
    exports.getTestingConfiguration = getTestingConfiguration;
    const observeTestingConfiguration = (config, key) => (0, observable_1.observableFromEvent)(config.onDidChangeConfiguration, () => (0, exports.getTestingConfiguration)(config, key));
    exports.observeTestingConfiguration = observeTestingConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL2NvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLElBQWtCLGlCQWVqQjtJQWZELFdBQWtCLGlCQUFpQjtRQUNsQywyREFBc0MsQ0FBQTtRQUN0QywyRUFBc0QsQ0FBQTtRQUN0RCwyR0FBc0YsQ0FBQTtRQUN0Rix3REFBbUMsQ0FBQTtRQUNuQyxvRUFBK0MsQ0FBQTtRQUMvQyxrRkFBNkQsQ0FBQTtRQUM3RCw0REFBdUMsQ0FBQTtRQUN2Qyw4REFBeUMsQ0FBQTtRQUN6Qyw0RkFBdUUsQ0FBQTtRQUN2RSxzREFBaUMsQ0FBQTtRQUNqQyxnRUFBMkMsQ0FBQTtRQUMzQyx5RUFBb0QsQ0FBQTtRQUNwRCw4RUFBeUQsQ0FBQTtRQUN6RCw0RUFBdUQsQ0FBQTtJQUN4RCxDQUFDLEVBZmlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBZWxDO0lBRUQsSUFBa0IsZUFLakI7SUFMRCxXQUFrQixlQUFlO1FBQ2hDLDBDQUF1QixDQUFBO1FBQ3ZCLHNEQUFtQyxDQUFBO1FBQ25DLDBEQUF1QyxDQUFBO1FBQ3ZDLHNFQUFtRCxDQUFBO0lBQ3BELENBQUMsRUFMaUIsZUFBZSwrQkFBZixlQUFlLFFBS2hDO0lBRUQsSUFBa0Isb0JBSWpCO0lBSkQsV0FBa0Isb0JBQW9CO1FBQ3JDLG1FQUEyQyxDQUFBO1FBQzNDLDJEQUFtQyxDQUFBO1FBQ25DLHVDQUFlLENBQUE7SUFDaEIsQ0FBQyxFQUppQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQUlyQztJQUVELElBQWtCLHdCQUtqQjtJQUxELFdBQWtCLHdCQUF3QjtRQUN6Qyx1Q0FBVyxDQUFBO1FBQ1gsMkNBQWUsQ0FB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