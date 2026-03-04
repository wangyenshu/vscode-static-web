/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingContextKeys = void 0;
    var TestingContextKeys;
    (function (TestingContextKeys) {
        TestingContextKeys.providerCount = new contextkey_1.RawContextKey('testing.providerCount', 0);
        TestingContextKeys.canRefreshTests = new contextkey_1.RawContextKey('testing.canRefresh', false, { type: 'boolean', description: (0, nls_1.localize)('testing.canRefresh', 'Indicates whether any test controller has an attached refresh handler.') });
        TestingContextKeys.isRefreshingTests = new contextkey_1.RawContextKey('testing.isRefreshing', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isRefreshing', 'Indicates whether any test controller is currently refreshing tests.') });
        TestingContextKeys.isContinuousModeOn = new contextkey_1.RawContextKey('testing.isContinuousModeOn', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isContinuousModeOn', 'Indicates whether continuous test mode is on.') });
        TestingContextKeys.hasDebuggableTests = new contextkey_1.RawContextKey('testing.hasDebuggableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasDebuggableTests', 'Indicates whether any test controller has registered a debug configuration') });
        TestingContextKeys.hasRunnableTests = new contextkey_1.RawContextKey('testing.hasRunnableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasRunnableTests', 'Indicates whether any test controller has registered a run configuration') });
        TestingContextKeys.hasCoverableTests = new contextkey_1.RawContextKey('testing.hasCoverableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasCoverableTests', 'Indicates whether any test controller has registered a coverage configuration') });
        TestingContextKeys.hasNonDefaultProfile = new contextkey_1.RawContextKey('testing.hasNonDefaultProfile', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasNonDefaultConfig', 'Indicates whether any test controller has registered a non-default configuration') });
        TestingContextKeys.hasConfigurableProfile = new contextkey_1.RawContextKey('testing.hasConfigurableProfile', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasConfigurableConfig', 'Indicates whether any test configuration can be configured') });
        TestingContextKeys.supportsContinuousRun = new contextkey_1.RawContextKey('testing.supportsContinuousRun', false, { type: 'boolean', description: (0, nls_1.localize)('testing.supportsContinuousRun', 'Indicates whether continous test running is supported') });
        TestingContextKeys.isParentRunningContinuously = new contextkey_1.RawContextKey('testing.isParentRunningContinuously', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isParentRunningContinuously', 'Indicates whether the parent of a test is continuously running, set in the menu context of test items') });
        TestingContextKeys.activeEditorHasTests = new contextkey_1.RawContextKey('testing.activeEditorHasTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.activeEditorHasTests', 'Indicates whether any tests are present in the current editor') });
        TestingContextKeys.isTestCoverageOpen = new contextkey_1.RawContextKey('testing.isTestCoverageOpen', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isTestCoverageOpen', 'Indicates whether a test coverage report is open') });
        TestingContextKeys.capabilityToContextKey = {
            [2 /* TestRunProfileBitset.Run */]: TestingContextKeys.hasRunnableTests,
            [8 /* TestRunProfileBitset.Coverage */]: TestingContextKeys.hasCoverableTests,
            [4 /* TestRunProfileBitset.Debug */]: TestingContextKeys.hasDebuggableTests,
            [16 /* TestRunProfileBitset.HasNonDefaultProfile */]: TestingContextKeys.hasNonDefaultProfile,
            [32 /* TestRunProfileBitset.HasConfigurable */]: TestingContextKeys.hasConfigurableProfile,
            [64 /* TestRunProfileBitset.SupportsContinuousRun */]: TestingContextKeys.supportsContinuousRun,
        };
        TestingContextKeys.hasAnyResults = new contextkey_1.RawContextKey('testing.hasAnyResults', false);
        TestingContextKeys.viewMode = new contextkey_1.RawContextKey('testing.explorerViewMode', "list" /* TestExplorerViewMode.List */);
        TestingContextKeys.viewSorting = new contextkey_1.RawContextKey('testing.explorerViewSorting', "location" /* TestExplorerViewSorting.ByLocation */);
        TestingContextKeys.isRunning = new contextkey_1.RawContextKey('testing.isRunning', false);
        TestingContextKeys.isInPeek = new contextkey_1.RawContextKey('testing.isInPeek', false);
        TestingContextKeys.isPeekVisible = new contextkey_1.RawContextKey('testing.isPeekVisible', false);
        TestingContextKeys.peekItemType = new contextkey_1.RawContextKey('peekItemType', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.peekItemType', 'Type of the item in the output peek view. Either a "test", "message", "task", or "result".'),
        });
        TestingContextKeys.controllerId = new contextkey_1.RawContextKey('controllerId', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.controllerId', 'Controller ID of the current test item')
        });
        TestingContextKeys.testItemExtId = new contextkey_1.RawContextKey('testId', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testId', 'ID of the current test item, set when creating or opening menus on test items')
        });
        TestingContextKeys.testItemHasUri = new contextkey_1.RawContextKey('testing.testItemHasUri', false, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testItemHasUri', 'Boolean indicating whether the test item has a URI defined')
        });
        TestingContextKeys.testItemIsHidden = new contextkey_1.RawContextKey('testing.testItemIsHidden', false, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testItemIsHidden', 'Boolean indicating whether the test item is hidden')
        });
        TestingContextKeys.testMessageContext = new contextkey_1.RawContextKey('testMessage', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testMessage', 'Value set in `testMessage.contextValue`, available in editor/content and testing/message/context')
        });
        TestingContextKeys.testResultOutdated = new contextkey_1.RawContextKey('testResultOutdated', undefined, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testResultOutdated', 'Value available in editor/content and testing/message/context when the result is outdated')
        });
        TestingContextKeys.testResultState = new contextkey_1.RawContextKey('testResultState', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testResultState', 'Value available testing/item/result indicating the state of the item.')
        });
    })(TestingContextKeys || (exports.TestingContextKeys = TestingContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbnRleHRLZXlzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdGluZ0NvbnRleHRLZXlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFpQixrQkFBa0IsQ0ErRGxDO0lBL0RELFdBQWlCLGtCQUFrQjtRQUNyQixnQ0FBYSxHQUFHLElBQUksMEJBQWEsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RCxrQ0FBZSxHQUFHLElBQUksMEJBQWEsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSx3RUFBd0UsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3TSxvQ0FBaUIsR0FBRyxJQUFJLDBCQUFhLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsc0VBQXNFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDak4scUNBQWtCLEdBQUcsSUFBSSwwQkFBYSxDQUFDLDRCQUE0QixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLCtDQUErQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZNLHFDQUFrQixHQUFHLElBQUksMEJBQWEsQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSw0RUFBNEUsQ0FB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