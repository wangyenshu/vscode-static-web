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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/splitview/splitview", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/iconLabels", "vs/base/common/iterator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/strings", "vs/base/common/themables", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/editor/browser/widget/diffEditor/embeddedDiffEditorWidget", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/resolverService", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/browser/floatingMenu", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/terminalStrings", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/editor/editorModel", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/detachedTerminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testMessageColorizer", "vs/workbench/contrib/testing/browser/theme", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testingUri", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/views/common/viewsService", "vs/css!./testingOutputPeek"], function (require, exports, dom, actionbar_1, aria_1, iconLabels_1, scrollableElement_1, splitview_1, actions_1, async_1, codicons_1, color_1, event_1, iconLabels_2, iterator_1, lazy_1, lifecycle_1, observable_1, strings_1, themables_1, types_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, embeddedCodeEditorWidget_1, diffEditorWidget_1, embeddedDiffEditorWidget_1, markdownRenderer_1, range_1, editorContextKeys_1, resolverService_1, peekView_1, nls_1, actionCommonCategories_1, floatingMenu_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, hover_1, instantiation_1, serviceCollection_1, keybinding_1, listService_1, notification_1, opener_1, progress_1, storage_1, telemetry_1, terminalCapabilityStore_1, terminalStrings_1, colorRegistry_1, iconRegistry_1, themeService_1, workspace_1, viewPane_1, editorModel_1, theme_1, views_1, detachedTerminal_1, terminal_1, xtermTerminal_1, terminalColorRegistry_1, testItemContextOverlay_1, icons, testMessageColorizer_1, theme_2, configuration_2, observableValue_1, storedValue_1, testCoverageService_1, testExplorerFilterState_1, testProfileService_1, testResult_1, testResultService_1, testService_1, testTypes_1, testingContextKeys_1, testingPeekOpener_1, testingStates_1, testingUri_1, editorService_1, viewsService_1) {
    "use strict";
    var TestingOutputPeekController_1, TestResultsViewContent_1, TestResultsPeek_1, TestRunElementRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleTestingPeekHistory = exports.OpenMessageInEditorAction = exports.GoToPreviousMessageAction = exports.GoToNextMessageAction = exports.CloseTestPeek = exports.TestResultsView = exports.TestingOutputPeekController = exports.TestingPeekOpener = void 0;
    const getMessageArgs = (test, message) => ({
        $mid: 18 /* MarshalledId.TestMessageMenuArgs */,
        test: testTypes_1.InternalTestItem.serialize(test),
        message: testTypes_1.ITestMessage.serialize(message),
    });
    class MessageSubject {
        get isDiffable() {
            return this.message.type === 0 /* TestMessageType.Error */ && isDiffable(this.message);
        }
        get contextValue() {
            return this.message.type === 0 /* TestMessageType.Error */ ? this.message.contextValue : undefined;
        }
        constructor(result, test, taskIndex, messageIndex) {
            this.result = result;
            this.taskIndex = taskIndex;
            this.messageIndex = messageIndex;
            this.test = test.item;
            const messages = test.tasks[taskIndex].messages;
            this.messageIndex = messageIndex;
            const parts = { messageIndex, resultId: result.id, taskIndex, testExtId: test.item.extId };
            this.expectedUri = (0, testingUri_1.buildTestUri)({ ...parts, type: 4 /* TestUriType.ResultExpectedOutput */ });
            this.actualUri = (0, testingUri_1.buildTestUri)({ ...parts, type: 3 /* TestUriType.ResultActualOutput */ });
            this.messageUri = (0, testingUri_1.buildTestUri)({ ...parts, type: 2 /* TestUriType.ResultMessage */ });
            const message = this.message = messages[this.messageIndex];
            this.context = getMessageArgs(test, message);
            this.revealLocation = message.location ?? (test.item.uri && test.item.range ? { uri: test.item.uri, range: range_1.Range.lift(test.item.range) } : undefined);
        }
    }
    class TaskSubject {
        constructor(result, taskIndex) {
            this.result = result;
            this.taskIndex = taskIndex;
            this.outputUri = (0, testingUri_1.buildTestUri)({ resultId: result.id, taskIndex, type: 0 /* TestUriType.TaskOutput */ });
        }
    }
    class TestOutputSubject {
        constructor(result, taskIndex, test) {
            this.result = result;
            this.taskIndex = taskIndex;
            this.test = test;
            this.outputUri = (0, testingUri_1.buildTestUri)({ resultId: this.result.id, taskIndex: this.taskIndex, testExtId: this.test.item.extId, type: 1 /* TestUriType.TestOutput */ });
            this.task = result.tasks[this.taskIndex];
        }
    }
    const equalsSubject = (a, b) => ((a instanceof MessageSubject && b instanceof MessageSubject && a.message === b.message) ||
        (a instanceof TaskSubject && b instanceof TaskSubject && a.result === b.result && a.taskIndex === b.taskIndex) ||
        (a instanceof TestOutputSubject && b instanceof TestOutputSubject && a.test === b.test && a.taskIndex === b.taskIndex));
    /** Iterates through every message in every result */
    function* allMessages(results) {
        for (const result of results) {
            for (const test of result.tests) {
                for (let taskIndex = 0; taskIndex < test.tasks.length; taskIndex++) {
                    for (let messageIndex = 0; messageIndex < test.tasks[taskIndex].messages.length; messageIndex++) {
                        yield { result, test, taskIndex, messageIndex };
                    }
                }
            }
        }
    }
    let TestingPeekOpener = class TestingPeekOpener extends lifecycle_1.Disposable {
        constructor(configuration, editorService, codeEditorService, testResults, testService, storageService, viewsService, commandService, notificationService) {
            super();
            this.configuration = configuration;
            this.editorService = editorService;
            this.codeEditorService = codeEditorService;
            this.testResults = testResults;
            this.testService = testService;
            this.storageService = storageService;
            this.viewsService = viewsService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            /** @inheritdoc */
            this.historyVisible = observableValue_1.MutableObservableValue.stored(this._register(new storedValue_1.StoredValue({
                key: 'testHistoryVisibleInPeek',
                scope: 0 /* StorageScope.PROFILE */,
                target: 0 /* StorageTarget.USER */,
            }, this.storageService)), false);
            this._register(testResults.onTestChanged(this.openPeekOnFailure, this));
        }
        /** @inheritdoc */
        async open() {
            let uri;
            const active = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(active) && active.getModel()?.uri) {
                const modelUri = active.getModel()?.uri;
                if (modelUri) {
                    uri = await this.getFileCandidateMessage(modelUri, active.getPosition());
                }
            }
            if (!uri) {
                uri = this.lastUri;
            }
            if (!uri) {
                uri = this.getAnyCandidateMessage();
            }
            if (!uri) {
                return false;
            }
            return this.showPeekFromUri(uri);
        }
        /** @inheritdoc */
        tryPeekFirstError(result, test, options) {
            const candidate = this.getFailedCandidateMessage(test);
            if (!candidate) {
                return false;
            }
            this.showPeekFromUri({
                type: 2 /* TestUriType.ResultMessage */,
                documentUri: candidate.location.uri,
                taskIndex: candidate.taskId,
                messageIndex: candidate.index,
                resultId: result.id,
                testExtId: test.item.extId,
            }, undefined, { selection: candidate.location.range, selectionRevealType: 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */, ...options });
            return true;
        }
        /** @inheritdoc */
        peekUri(uri, options = {}) {
            const parsed = (0, testingUri_1.parseTestUri)(uri);
            const result = parsed && this.testResults.getResult(parsed.resultId);
            if (!parsed || !result || !('testExtId' in parsed)) {
                return false;
            }
            if (!('messageIndex' in parsed)) {
                return false;
            }
            const message = result.getStateById(parsed.testExtId)?.tasks[parsed.taskIndex].messages[parsed.messageIndex];
            if (!message?.location) {
                return false;
            }
            this.showPeekFromUri({
                type: 2 /* TestUriType.ResultMessage */,
                documentUri: message.location.uri,
                taskIndex: parsed.taskIndex,
                messageIndex: parsed.messageIndex,
                resultId: result.id,
                testExtId: parsed.testExtId,
            }, options.inEditor, { selection: message.location.range, ...options.options });
            return true;
        }
        /** @inheritdoc */
        closeAllPeeks() {
            for (const editor of this.codeEditorService.listCodeEditors()) {
                TestingOutputPeekController.get(editor)?.removePeek();
            }
        }
        openCurrentInEditor() {
            const current = this.getActiveControl();
            if (!current) {
                return;
            }
            const options = { pinned: false, revealIfOpened: true };
            if (current instanceof TaskSubject || current instanceof TestOutputSubject) {
                this.editorService.openEditor({ resource: current.outputUri, options });
                return;
            }
            if (current instanceof TestOutputSubject) {
                this.editorService.openEditor({ resource: current.outputUri, options });
                return;
            }
            const message = current.message;
            if (current.isDiffable) {
                this.editorService.openEditor({
                    original: { resource: current.expectedUri },
                    modified: { resource: current.actualUri },
                    options,
                });
            }
            else if (typeof message.message === 'string') {
                this.editorService.openEditor({ resource: current.messageUri, options });
            }
            else {
                this.commandService.executeCommand('markdown.showPreview', current.messageUri).catch(err => {
                    this.notificationService.error((0, nls_1.localize)('testing.markdownPeekError', 'Could not open markdown preview: {0}.\n\nPlease make sure the markdown extension is enabled.', err.message));
                });
            }
        }
        getActiveControl() {
            const editor = getPeekedEditorFromFocus(this.codeEditorService);
            const controller = editor && TestingOutputPeekController.get(editor);
            return controller?.subject ?? this.viewsService.getActiveViewWithId("workbench.panel.testResults.view" /* Testing.ResultsViewId */)?.subject;
        }
        /** @inheritdoc */
        async showPeekFromUri(uri, editor, options) {
            if ((0, editorBrowser_1.isCodeEditor)(editor)) {
                this.lastUri = uri;
                TestingOutputPeekController.get(editor)?.show((0, testingUri_1.buildTestUri)(this.lastUri));
                return true;
            }
            const pane = await this.editorService.openEditor({
                resource: uri.documentUri,
                options: { revealIfOpened: true, ...options }
            });
            const control = pane?.getControl();
            if (!(0, editorBrowser_1.isCodeEditor)(control)) {
                return false;
            }
            this.lastUri = uri;
            TestingOutputPeekController.get(control)?.show((0, testingUri_1.buildTestUri)(this.lastUri));
            return true;
        }
        /**
         * Opens the peek view on a test failure, based on user preferences.
         */
        openPeekOnFailure(evt) {
            if (evt.reason !== 1 /* TestResultItemChangeReason.OwnStateChange */) {
                return;
            }
            const candidate = this.getFailedCandidateMessage(evt.item);
            if (!candidate) {
                return;
            }
            if (evt.result.request.continuous && !(0, configuration_2.getTestingConfiguration)(this.configuration, "testing.automaticallyOpenPeekViewDuringAutoRun" /* TestingConfigKeys.AutoOpenPeekViewDuringContinuousRun */)) {
                return;
            }
            const editors = this.codeEditorService.listCodeEditors();
            const cfg = (0, configuration_2.getTestingConfiguration)(this.configuration, "testing.automaticallyOpenPeekView" /* TestingConfigKeys.AutoOpenPeekView */);
            // don't show the peek if the user asked to only auto-open peeks for visible tests,
            // and this test is not in any of the editors' models.
            switch (cfg) {
                case "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */: {
                    const editorUris = new Set(editors.map(e => e.getModel()?.uri.toString()));
                    if (!iterator_1.Iterable.some((0, testResult_1.resultItemParents)(evt.result, evt.item), i => i.item.uri && editorUris.has(i.item.uri.toString()))) {
                        return;
                    }
                    break; //continue
                }
                case "failureAnywhere" /* AutoOpenPeekViewWhen.FailureAnywhere */:
                    break; //continue
                default:
                    return; // never show
            }
            const controllers = editors.map(TestingOutputPeekController.get);
            if (controllers.some(c => c?.subject)) {
                return;
            }
            this.tryPeekFirstError(evt.result, evt.item);
        }
        /**
         * Gets the message closest to the given position from a test in the file.
         */
        async getFileCandidateMessage(uri, position) {
            let best;
            let bestDistance = Infinity;
            // Get all tests for the document. In those, find one that has a test
            // message closest to the cursor position.
            const demandedUriStr = uri.toString();
            for (const test of this.testService.collection.all) {
                const result = this.testResults.getStateById(test.item.extId);
                if (!result) {
                    continue;
                }
                mapFindTestMessage(result[1], (_task, message, messageIndex, taskIndex) => {
                    if (message.type !== 0 /* TestMessageType.Error */ || !message.location || message.location.uri.toString() !== demandedUriStr) {
                        return;
                    }
                    const distance = position ? Math.abs(position.lineNumber - message.location.range.startLineNumber) : 0;
                    if (!best || distance <= bestDistance) {
                        bestDistance = distance;
                        best = {
                            type: 2 /* TestUriType.ResultMessage */,
                            testExtId: result[1].item.extId,
                            resultId: result[0].id,
                            taskIndex,
                            messageIndex,
                            documentUri: uri,
                        };
                    }
                });
            }
            return best;
        }
        /**
         * Gets any possible still-relevant message from the results.
         */
        getAnyCandidateMessage() {
            const seen = new Set();
            for (const result of this.testResults.results) {
                for (const test of result.tests) {
                    if (seen.has(test.item.extId)) {
                        continue;
                    }
                    seen.add(test.item.extId);
                    const found = mapFindTestMessage(test, (task, message, messageIndex, taskIndex) => (message.location && {
                        type: 2 /* TestUriType.ResultMessage */,
                        testExtId: test.item.extId,
                        resultId: result.id,
                        taskIndex,
                        messageIndex,
                        documentUri: message.location.uri,
                    }));
                    if (found) {
                        return found;
                    }
                }
            }
            return undefined;
        }
        /**
         * Gets the first failed message that can be displayed from the result.
         */
        getFailedCandidateMessage(test) {
            const fallbackLocation = test.item.uri && test.item.range
                ? { uri: test.item.uri, range: test.item.range }
                : undefined;
            let best;
            mapFindTestMessage(test, (task, message, messageIndex, taskId) => {
                const location = message.location || fallbackLocation;
                if (!(0, testingStates_1.isFailedState)(task.state) || !location) {
                    return;
                }
                if (best && message.type !== 0 /* TestMessageType.Error */) {
                    return;
                }
                best = { taskId, index: messageIndex, message, location };
            });
            return best;
        }
    };
    exports.TestingPeekOpener = TestingPeekOpener;
    exports.TestingPeekOpener = TestingPeekOpener = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, testService_1.ITestService),
        __param(5, storage_1.IStorageService),
        __param(6, viewsService_1.IViewsService),
        __param(7, commands_1.ICommandService),
        __param(8, notification_1.INotificationService)
    ], TestingPeekOpener);
    const mapFindTestMessage = (test, fn) => {
        for (let taskIndex = 0; taskIndex < test.tasks.length; taskIndex++) {
            const task = test.tasks[taskIndex];
            for (let messageIndex = 0; messageIndex < task.messages.length; messageIndex++) {
                const r = fn(task, task.messages[messageIndex], messageIndex, taskIndex);
                if (r !== undefined) {
                    return r;
                }
            }
        }
        return undefined;
    };
    /**
     * Adds output/message peek functionality to code editors.
     */
    let TestingOutputPeekController = TestingOutputPeekController_1 = class TestingOutputPeekController extends lifecycle_1.Disposable {
        /**
         * Gets the controller associated with the given code editor.
         */
        static get(editor) {
            return editor.getContribution("editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */);
        }
        /**
         * Gets the currently display subject. Undefined if the peek is not open.
         */
        get subject() {
            return this.peek.value?.current;
        }
        constructor(editor, codeEditorService, instantiationService, testResults, contextKeyService) {
            super();
            this.editor = editor;
            this.codeEditorService = codeEditorService;
            this.instantiationService = instantiationService;
            this.testResults = testResults;
            /**
             * Currently-shown peek view.
             */
            this.peek = this._register(new lifecycle_1.MutableDisposable());
            this.visible = testingContextKeys_1.TestingContextKeys.isPeekVisible.bindTo(contextKeyService);
            this._register(editor.onDidChangeModel(() => this.peek.clear()));
            this._register(testResults.onResultsChanged(this.closePeekOnCertainResultEvents, this));
            this._register(testResults.onTestChanged(this.closePeekOnTestChange, this));
        }
        /**
         * Toggles peek visibility for the URI.
         */
        toggle(uri) {
            if (this.currentPeekUri?.toString() === uri.toString()) {
                this.peek.clear();
            }
            else {
                this.show(uri);
            }
        }
        /**
         * Shows a peek for the message in the editor.
         */
        async show(uri) {
            const subject = this.retrieveTest(uri);
            if (!subject) {
                return;
            }
            if (!this.peek.value) {
                this.peek.value = this.instantiationService.createInstance(TestResultsPeek, this.editor);
                this.peek.value.onDidClose(() => {
                    this.visible.set(false);
                    this.currentPeekUri = undefined;
                    this.peek.value = undefined;
                });
                this.visible.set(true);
                this.peek.value.create();
            }
            if (subject instanceof MessageSubject) {
                (0, aria_1.alert)((0, testMessageColorizer_1.renderTestMessageAsText)(subject.message.message));
            }
            this.peek.value.setModel(subject);
            this.currentPeekUri = uri;
        }
        async openAndShow(uri) {
            const subject = this.retrieveTest(uri);
            if (!subject) {
                return;
            }
            if (!subject.revealLocation || subject.revealLocation.uri.toString() === this.editor.getModel()?.uri.toString()) {
                return this.show(uri);
            }
            const otherEditor = await this.codeEditorService.openCodeEditor({
                resource: subject.revealLocation.uri,
                options: { pinned: false, revealIfOpened: true }
            }, this.editor);
            if (otherEditor) {
                TestingOutputPeekController_1.get(otherEditor)?.removePeek();
                return TestingOutputPeekController_1.get(otherEditor)?.show(uri);
            }
        }
        /**
         * Disposes the peek view, if any.
         */
        removePeek() {
            this.peek.clear();
        }
        /**
         * Shows the next message in the peek, if possible.
         */
        next() {
            const subject = this.peek.value?.current;
            if (!subject) {
                return;
            }
            let found = false;
            for (const { messageIndex, taskIndex, result, test } of allMessages(this.testResults.results)) {
                if (subject instanceof TaskSubject && result.id === subject.result.id) {
                    found = true; // open the first message found in the current result
                }
                if (found) {
                    this.openAndShow((0, testingUri_1.buildTestUri)({
                        type: 2 /* TestUriType.ResultMessage */,
                        messageIndex,
                        taskIndex,
                        resultId: result.id,
                        testExtId: test.item.extId
                    }));
                    return;
                }
                if (subject instanceof TestOutputSubject && subject.test.item.extId === test.item.extId && subject.taskIndex === taskIndex && subject.result.id === result.id) {
                    found = true;
                }
                if (subject instanceof MessageSubject && subject.test.extId === test.item.extId && subject.messageIndex === messageIndex && subject.taskIndex === taskIndex && subject.result.id === result.id) {
                    found = true;
                }
            }
        }
        /**
         * Shows the previous message in the peek, if possible.
         */
        previous() {
            const subject = this.peek.value?.current;
            if (!subject) {
                return;
            }
            let previous;
            for (const m of allMessages(this.testResults.results)) {
                if (subject instanceof TaskSubject) {
                    if (m.result.id === subject.result.id) {
                        break;
                    }
                    continue;
                }
                if (subject instanceof TestOutputSubject) {
                    if (m.test.item.extId === subject.test.item.extId && m.result.id === subject.result.id && m.taskIndex === subject.taskIndex) {
                        break;
                    }
                    continue;
                }
                if (subject.test.extId === m.test.item.extId && subject.messageIndex === m.messageIndex && subject.taskIndex === m.taskIndex && subject.result.id === m.result.id) {
                    break;
                }
                previous = m;
            }
            if (previous) {
                this.openAndShow((0, testingUri_1.buildTestUri)({
                    type: 2 /* TestUriType.ResultMessage */,
                    messageIndex: previous.messageIndex,
                    taskIndex: previous.taskIndex,
                    resultId: previous.result.id,
                    testExtId: previous.test.item.extId
                }));
            }
        }
        /**
         * Removes the peek view if it's being displayed on the given test ID.
         */
        removeIfPeekingForTest(testId) {
            const c = this.peek.value?.current;
            if (c && c instanceof MessageSubject && c.test.extId === testId) {
                this.peek.clear();
            }
        }
        /**
         * If the test we're currently showing has its state change to something
         * else, then clear the peek.
         */
        closePeekOnTestChange(evt) {
            if (evt.reason !== 1 /* TestResultItemChangeReason.OwnStateChange */ || evt.previousState === evt.item.ownComputedState) {
                return;
            }
            this.removeIfPeekingForTest(evt.item.item.extId);
        }
        closePeekOnCertainResultEvents(evt) {
            if ('started' in evt) {
                this.peek.clear(); // close peek when runs start
            }
            if ('removed' in evt && this.testResults.results.length === 0) {
                this.peek.clear(); // close the peek if results are cleared
            }
        }
        retrieveTest(uri) {
            const parts = (0, testingUri_1.parseTestUri)(uri);
            if (!parts) {
                return undefined;
            }
            const result = this.testResults.results.find(r => r.id === parts.resultId);
            if (!result) {
                return;
            }
            if (parts.type === 0 /* TestUriType.TaskOutput */) {
                return new TaskSubject(result, parts.taskIndex);
            }
            if (parts.type === 1 /* TestUriType.TestOutput */) {
                const test = result.getStateById(parts.testExtId);
                if (!test) {
                    return;
                }
                return new TestOutputSubject(result, parts.taskIndex, test);
            }
            const { testExtId, taskIndex, messageIndex } = parts;
            const test = result?.getStateById(testExtId);
            if (!test || !test.tasks[parts.taskIndex]) {
                return;
            }
            return new MessageSubject(result, test, taskIndex, messageIndex);
        }
    };
    exports.TestingOutputPeekController = TestingOutputPeekController;
    exports.TestingOutputPeekController = TestingOutputPeekController = TestingOutputPeekController_1 = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, contextkey_1.IContextKeyService)
    ], TestingOutputPeekController);
    let TestResultsViewContent = class TestResultsViewContent extends lifecycle_1.Disposable {
        static { TestResultsViewContent_1 = this; }
        constructor(editor, options, instantiationService, modelService, contextKeyService) {
            super();
            this.editor = editor;
            this.options = options;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.contextKeyService = contextKeyService;
            this.didReveal = this._register(new event_1.Emitter());
            this.currentSubjectStore = this._register(new lifecycle_1.DisposableStore());
            this.contentProvidersUpdateLimiter = this._register(new async_1.Limiter(1));
        }
        fillBody(containerElement) {
            const initialSpitWidth = TestResultsViewContent_1.lastSplitWidth;
            this.splitView = new splitview_1.SplitView(containerElement, { orientation: 1 /* Orientation.HORIZONTAL */ });
            const { historyVisible, showRevealLocationOnMessages } = this.options;
            const isInPeekView = this.editor !== undefined;
            const messageContainer = this.messageContainer = dom.append(containerElement, dom.$('.test-output-peek-message-container'));
            this.contentProviders = [
                this._register(this.instantiationService.createInstance(DiffContentProvider, this.editor, messageContainer)),
                this._register(this.instantiationService.createInstance(MarkdownTestMessagePeek, messageContainer)),
                this._register(this.instantiationService.createInstance(TerminalMessagePeek, messageContainer, isInPeekView)),
                this._register(this.instantiationService.createInstance(PlainTextMessagePeek, this.editor, messageContainer)),
            ];
            this.messageContextKeyService = this._register(this.contextKeyService.createScoped(containerElement));
            this.contextKeyTestMessage = testingContextKeys_1.TestingContextKeys.testMessageContext.bindTo(this.messageContextKeyService);
            this.contextKeyResultOutdated = testingContextKeys_1.TestingContextKeys.testResultOutdated.bindTo(this.messageContextKeyService);
            const treeContainer = dom.append(containerElement, dom.$('.test-output-peek-tree'));
            const tree = this._register(this.instantiationService.createInstance(OutputPeekTree, treeContainer, this.didReveal.event, { showRevealLocationOnMessages, locationForProgress: this.options.locationForProgress }));
            this.onDidRequestReveal = tree.onDidRequestReview;
            this.splitView.addView({
                onDidChange: event_1.Event.None,
                element: messageContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: width => {
                    TestResultsViewContent_1.lastSplitWidth = width;
                    if (this.dimension) {
                        for (const provider of this.contentProviders) {
                            provider.layout({ height: this.dimension.height, width });
                        }
                    }
                },
            }, splitview_1.Sizing.Distribute);
            this.splitView.addView({
                onDidChange: event_1.Event.None,
                element: treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: width => {
                    if (this.dimension) {
                        tree.layout(this.dimension.height, width);
                    }
                },
            }, splitview_1.Sizing.Distribute);
            const historyViewIndex = 1;
            this.splitView.setViewVisible(historyViewIndex, historyVisible.value);
            this._register(historyVisible.onDidChange(visible => {
                this.splitView.setViewVisible(historyViewIndex, visible);
            }));
            if (initialSpitWidth) {
                queueMicrotask(() => this.splitView.resizeView(0, initialSpitWidth));
            }
        }
        /**
         * Shows a message in-place without showing or changing the peek location.
         * This is mostly used if peeking a message without a location.
         */
        reveal(opts) {
            this.didReveal.fire(opts);
            if (this.current && equalsSubject(this.current, opts.subject)) {
                return Promise.resolve();
            }
            this.current = opts.subject;
            return this.contentProvidersUpdateLimiter.queue(async () => {
                await Promise.all(this.contentProviders.map(p => p.update(opts.subject)));
                this.currentSubjectStore.clear();
                this.populateFloatingClick(opts.subject);
            });
        }
        populateFloatingClick(subject) {
            if (!(subject instanceof MessageSubject)) {
                return;
            }
            this.currentSubjectStore.add((0, lifecycle_1.toDisposable)(() => {
                this.contextKeyResultOutdated.reset();
                this.contextKeyTestMessage.reset();
            }));
            this.contextKeyTestMessage.set(subject.contextValue || '');
            if (subject.result instanceof testResult_1.LiveTestResult) {
                this.contextKeyResultOutdated.set(subject.result.getStateById(subject.test.extId)?.retired ?? false);
                this.currentSubjectStore.add(subject.result.onChange(ev => {
                    if (ev.item.item.extId === subject.test.extId) {
                        this.contextKeyResultOutdated.set(ev.item.retired ?? false);
                    }
                }));
            }
            else {
                this.contextKeyResultOutdated.set(true);
            }
            this.currentSubjectStore.add(this.instantiationService
                .createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.messageContextKeyService]))
                .createInstance(floatingMenu_1.FloatingClickMenu, {
                container: this.messageContainer,
                menuId: actions_2.MenuId.TestMessageContent,
                getActionArg: () => subject.context,
            }));
        }
        onLayoutBody(height, width) {
            this.dimension = new dom.Dimension(width, height);
            this.splitView.layout(width);
        }
        onWidth(width) {
            this.splitView.layout(width);
        }
    };
    TestResultsViewContent = TestResultsViewContent_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, contextkey_1.IContextKeyService)
    ], TestResultsViewContent);
    let TestResultsPeek = class TestResultsPeek extends peekView_1.PeekViewWidget {
        static { TestResultsPeek_1 = this; }
        constructor(editor, themeService, peekViewService, testingPeek, contextKeyService, menuService, instantiationService, modelService) {
            super(editor, { showFrame: true, frameWidth: 1, showArrow: true, isResizeable: true, isAccessible: true, className: 'test-output-peek' }, instantiationService);
            this.themeService = themeService;
            this.testingPeek = testingPeek;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.modelService = modelService;
            this.visibilityChange = this._disposables.add(new event_1.Emitter());
            this._disposables.add(themeService.onDidColorThemeChange(this.applyTheme, this));
            this._disposables.add(this.onDidClose(() => this.visibilityChange.fire(false)));
            peekViewService.addExclusiveWidget(editor, this);
        }
        applyTheme() {
            const theme = this.themeService.getColorTheme();
            const isError = this.current instanceof MessageSubject && this.current.message.type === 0 /* TestMessageType.Error */;
            const borderColor = (isError ? theme.getColor(theme_2.testingPeekBorder) : theme.getColor(theme_2.testingMessagePeekBorder)) || color_1.Color.transparent;
            const headerBg = (isError ? theme.getColor(theme_2.testingPeekHeaderBackground) : theme.getColor(theme_2.testingPeekMessageHeaderBackground)) || color_1.Color.transparent;
            const editorBg = theme.getColor(colorRegistry_1.editorBackground);
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: editorBg && headerBg ? headerBg.makeOpaque(editorBg) : headerBg,
                primaryHeadingColor: theme.getColor(peekView_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView_1.peekViewTitleInfoForeground)
            });
        }
        _fillContainer(container) {
            if (!this.scopedContextKeyService) {
                this.scopedContextKeyService = this._disposables.add(this.contextKeyService.createScoped(container));
                testingContextKeys_1.TestingContextKeys.isInPeek.bindTo(this.scopedContextKeyService).set(true);
                const instaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
                this.content = this._disposables.add(instaService.createInstance(TestResultsViewContent, this.editor, { historyVisible: this.testingPeek.historyVisible, showRevealLocationOnMessages: false, locationForProgress: "workbench.panel.testResults.view" /* Testing.ResultsViewId */ }));
            }
            super._fillContainer(container);
        }
        _fillHead(container) {
            super._fillHead(container);
            const actions = [];
            const menu = this.menuService.createMenu(actions_2.MenuId.TestPeekTitle, this.contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
            this._actionbarWidget.push(actions, { label: false, icon: true, index: 0 });
            menu.dispose();
        }
        _fillBody(containerElement) {
            this.content.fillBody(containerElement);
            this._disposables.add(this.content.onDidRequestReveal(sub => {
                TestingOutputPeekController.get(this.editor)?.show(sub instanceof MessageSubject
                    ? sub.messageUri
                    : sub.outputUri);
            }));
        }
        /**
         * Updates the test to be shown.
         */
        setModel(subject) {
            if (subject instanceof TaskSubject || subject instanceof TestOutputSubject) {
                this.current = subject;
                return this.showInPlace(subject);
            }
            const message = subject.message;
            const previous = this.current;
            if (!subject.revealLocation && !previous) {
                return Promise.resolve();
            }
            this.current = subject;
            if (!subject.revealLocation) {
                return this.showInPlace(subject);
            }
            this.show(subject.revealLocation.range, TestResultsPeek_1.lastHeightInLines || hintMessagePeekHeight(message));
            const startPosition = subject.revealLocation.range.getStartPosition();
            this.editor.revealRangeNearTopIfOutsideViewport(range_1.Range.fromPositions(startPosition), 0 /* ScrollType.Smooth */);
            return this.showInPlace(subject);
        }
        /**
         * Shows a message in-place without showing or changing the peek location.
         * This is mostly used if peeking a message without a location.
         */
        async showInPlace(subject) {
            if (subject instanceof MessageSubject) {
                const message = subject.message;
                this.setTitle(firstLine((0, testMessageColorizer_1.renderTestMessageAsText)(message.message)), (0, iconLabels_2.stripIcons)(subject.test.label));
            }
            else {
                this.setTitle((0, nls_1.localize)('testOutputTitle', 'Test Output'));
            }
            this.applyTheme();
            await this.content.reveal({ subject: subject, preserveFocus: false });
        }
        _relayout(newHeightInLines) {
            super._relayout(newHeightInLines);
            TestResultsPeek_1.lastHeightInLines = newHeightInLines;
        }
        /** @override */
        _doLayoutBody(height, width) {
            super._doLayoutBody(height, width);
            this.content.onLayoutBody(height, width);
        }
        /** @override */
        _onWidth(width) {
            super._onWidth(width);
            if (this.dimension) {
                this.dimension = new dom.Dimension(width, this.dimension.height);
            }
            this.content.onWidth(width);
        }
    };
    TestResultsPeek = TestResultsPeek_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, peekView_1.IPeekViewService),
        __param(3, testingPeekOpener_1.ITestingPeekOpener),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, actions_2.IMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, resolverService_1.ITextModelService)
    ], TestResultsPeek);
    let TestResultsView = class TestResultsView extends viewPane_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService, resultService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.resultService = resultService;
            this.content = new lazy_1.Lazy(() => this._register(this.instantiationService.createInstance(TestResultsViewContent, undefined, {
                historyVisible: (0, observableValue_1.staticObservableValue)(true),
                showRevealLocationOnMessages: true,
                locationForProgress: "workbench.view.testing" /* Testing.ExplorerViewId */,
            })));
        }
        get subject() {
            return this.content.rawValue?.current;
        }
        showLatestRun(preserveFocus = false) {
            const result = this.resultService.results.find(r => r.tasks.length);
            if (!result) {
                return;
            }
            this.content.rawValue?.reveal({ preserveFocus, subject: new TaskSubject(result, 0) });
        }
        renderBody(container) {
            super.renderBody(container);
            // Avoid rendering into the body until it's attached the DOM, as it can
            // result in rendering issues in the terminal (#194156)
            if (this.isBodyVisible()) {
                this.renderContent(container);
            }
            else {
                this._register(event_1.Event.once(event_1.Event.filter(this.onDidChangeBodyVisibility, Boolean))(() => this.renderContent(container)));
            }
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.content.rawValue?.onLayoutBody(height, width);
        }
        renderContent(container) {
            const content = this.content.value;
            content.fillBody(container);
            content.onDidRequestReveal(subject => content.reveal({ preserveFocus: true, subject }));
            const [lastResult] = this.resultService.results;
            if (lastResult && lastResult.tasks.length) {
                content.reveal({ preserveFocus: true, subject: new TaskSubject(lastResult, 0) });
            }
        }
    };
    exports.TestResultsView = TestResultsView;
    exports.TestResultsView = TestResultsView = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, hover_1.IHoverService),
        __param(11, testResultService_1.ITestResultService)
    ], TestResultsView);
    const commonEditorOptions = {
        scrollBeyondLastLine: false,
        links: true,
        lineNumbers: 'off',
        scrollbar: {
            verticalScrollbarSize: 14,
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            alwaysConsumeMouseWheel: false
        },
        fixedOverflowWidgets: true,
        readOnly: true,
        minimap: {
            enabled: false
        },
        wordWrap: 'on',
    };
    const diffEditorOptions = {
        ...commonEditorOptions,
        enableSplitViewResizing: true,
        isInEmbeddedEditor: true,
        renderOverviewRuler: false,
        ignoreTrimWhitespace: false,
        renderSideBySide: true,
        useInlineViewWhenSpaceIsLimited: false,
        originalAriaLabel: (0, nls_1.localize)('testingOutputExpected', 'Expected result'),
        modifiedAriaLabel: (0, nls_1.localize)('testingOutputActual', 'Actual result'),
        diffAlgorithm: 'advanced',
    };
    const isDiffable = (message) => message.type === 0 /* TestMessageType.Error */ && message.actual !== undefined && message.expected !== undefined;
    let DiffContentProvider = class DiffContentProvider extends lifecycle_1.Disposable {
        constructor(editor, container, instantiationService, modelService) {
            super();
            this.editor = editor;
            this.container = container;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.widget = this._register(new lifecycle_1.MutableDisposable());
            this.model = this._register(new lifecycle_1.MutableDisposable());
        }
        async update(subject) {
            if (!(subject instanceof MessageSubject)) {
                return this.clear();
            }
            const message = subject.message;
            if (!isDiffable(message)) {
                return this.clear();
            }
            const [original, modified] = await Promise.all([
                this.modelService.createModelReference(subject.expectedUri),
                this.modelService.createModelReference(subject.actualUri),
            ]);
            const model = this.model.value = new SimpleDiffEditorModel(original, modified);
            if (!this.widget.value) {
                this.widget.value = this.editor ? this.instantiationService.createInstance(embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget, this.container, diffEditorOptions, {}, this.editor) : this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this.container, diffEditorOptions, {});
                if (this.dimension) {
                    this.widget.value.layout(this.dimension);
                }
            }
            this.widget.value.setModel(model);
            this.widget.value.updateOptions(this.getOptions(isMultiline(message.expected) || isMultiline(message.actual)));
        }
        clear() {
            this.model.clear();
            this.widget.clear();
        }
        layout(dimensions) {
            this.dimension = dimensions;
            this.widget.value?.layout(dimensions);
        }
        getOptions(isMultiline) {
            return isMultiline
                ? { ...diffEditorOptions, lineNumbers: 'on' }
                : { ...diffEditorOptions, lineNumbers: 'off' };
        }
    };
    DiffContentProvider = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, resolverService_1.ITextModelService)
    ], DiffContentProvider);
    class ScrollableMarkdownMessage extends lifecycle_1.Disposable {
        constructor(container, markdown, message) {
            super();
            const rendered = this._register(markdown.render(message, {}));
            rendered.element.style.height = '100%';
            rendered.element.style.userSelect = 'text';
            container.appendChild(rendered.element);
            this.element = rendered.element;
            this.scrollable = this._register(new scrollableElement_1.DomScrollableElement(rendered.element, {
                className: 'preview-text',
            }));
            container.appendChild(this.scrollable.getDomNode());
            this._register((0, lifecycle_1.toDisposable)(() => {
                container.removeChild(this.scrollable.getDomNode());
            }));
            this.scrollable.scanDomNode();
        }
        layout(height, width) {
            // Remove padding of `.monaco-editor .zone-widget.test-output-peek .preview-text`
            this.scrollable.setScrollDimensions({
                width: width - 32,
                height: height - 16,
                scrollWidth: this.element.scrollWidth,
                scrollHeight: this.element.scrollHeight
            });
        }
    }
    let MarkdownTestMessagePeek = class MarkdownTestMessagePeek extends lifecycle_1.Disposable {
        constructor(container, instantiationService) {
            super();
            this.container = container;
            this.instantiationService = instantiationService;
            this.markdown = new lazy_1.Lazy(() => this._register(this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {})));
            this.textPreview = this._register(new lifecycle_1.MutableDisposable());
        }
        update(subject) {
            if (!(subject instanceof MessageSubject)) {
                return this.textPreview.clear();
            }
            const message = subject.message;
            if (isDiffable(message) || typeof message.message === 'string') {
                return this.textPreview.clear();
            }
            this.textPreview.value = new ScrollableMarkdownMessage(this.container, this.markdown.value, message.message);
        }
        layout(dimension) {
            this.textPreview.value?.layout(dimension.height, dimension.width);
        }
    };
    MarkdownTestMessagePeek = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], MarkdownTestMessagePeek);
    let PlainTextMessagePeek = class PlainTextMessagePeek extends lifecycle_1.Disposable {
        constructor(editor, container, instantiationService, modelService) {
            super();
            this.editor = editor;
            this.container = container;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.widgetDecorations = this._register(new lifecycle_1.MutableDisposable());
            this.widget = this._register(new lifecycle_1.MutableDisposable());
            this.model = this._register(new lifecycle_1.MutableDisposable());
        }
        async update(subject) {
            if (!(subject instanceof MessageSubject)) {
                return this.clear();
            }
            const message = subject.message;
            if (isDiffable(message) || message.type === 1 /* TestMessageType.Output */ || typeof message.message !== 'string') {
                return this.clear();
            }
            const modelRef = this.model.value = await this.modelService.createModelReference(subject.messageUri);
            if (!this.widget.value) {
                this.widget.value = this.editor ? this.instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this.container, commonEditorOptions, {}, this.editor) : this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.container, commonEditorOptions, { isSimpleWidget: true });
                if (this.dimension) {
                    this.widget.value.layout(this.dimension);
                }
            }
            this.widget.value.setModel(modelRef.object.textEditorModel);
            this.widget.value.updateOptions(commonEditorOptions);
            this.widgetDecorations.value = (0, testMessageColorizer_1.colorizeTestMessageInEditor)(message.message, this.widget.value);
        }
        clear() {
            this.widgetDecorations.clear();
            this.widget.clear();
            this.model.clear();
        }
        layout(dimensions) {
            this.dimension = dimensions;
            this.widget.value?.layout(dimensions);
        }
    };
    PlainTextMessagePeek = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, resolverService_1.ITextModelService)
    ], PlainTextMessagePeek);
    let TerminalMessagePeek = class TerminalMessagePeek extends lifecycle_1.Disposable {
        constructor(container, isInPeekView, terminalService, viewDescriptorService, workspaceContext) {
            super();
            this.container = container;
            this.isInPeekView = isInPeekView;
            this.terminalService = terminalService;
            this.viewDescriptorService = viewDescriptorService;
            this.workspaceContext = workspaceContext;
            this.terminalCwd = this._register(new observableValue_1.MutableObservableValue(''));
            this.xtermLayoutDelayer = this._register(new async_1.Delayer(50));
            /** Active terminal instance. */
            this.terminal = this._register(new lifecycle_1.MutableDisposable());
            /** Listener for streaming result data */
            this.outputDataListener = this._register(new lifecycle_1.MutableDisposable());
        }
        async makeTerminal() {
            const prev = this.terminal.value;
            if (prev) {
                prev.xterm.clearBuffer();
                prev.xterm.clearSearchDecorations();
                // clearBuffer tries to retain the prompt line, but this doesn't exist for tests.
                // So clear the screen (J) and move to home (H) to ensure previous data is cleaned up.
                prev.xterm.write(`\x1b[2J\x1b[0;0H`);
                return prev;
            }
            const capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            const cwd = this.terminalCwd;
            capabilities.add(0 /* TerminalCapability.CwdDetection */, {
                type: 0 /* TerminalCapability.CwdDetection */,
                get cwds() { return [cwd.value]; },
                onDidChangeCwd: cwd.onDidChange,
                getCwd: () => cwd.value,
                updateCwd: () => { },
            });
            return this.terminal.value = await this.terminalService.createDetachedTerminal({
                rows: 10,
                cols: 80,
                readonly: true,
                capabilities,
                processInfo: new detachedTerminal_1.DetachedProcessInfo({ initialCwd: cwd.value }),
                colorProvider: {
                    getBackgroundColor: theme => {
                        const terminalBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR);
                        if (terminalBackground) {
                            return terminalBackground;
                        }
                        if (this.isInPeekView) {
                            return theme.getColor(peekView_1.peekViewResultsBackground);
                        }
                        const location = this.viewDescriptorService.getViewLocationById("workbench.panel.testResults.view" /* Testing.ResultsViewId */);
                        return location === 1 /* ViewContainerLocation.Panel */
                            ? theme.getColor(theme_1.PANEL_BACKGROUND)
                            : theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
                    },
                }
            });
        }
        async update(subject) {
            this.outputDataListener.clear();
            if (subject instanceof TaskSubject) {
                await this.updateForTaskSubject(subject);
            }
            else if (subject instanceof TestOutputSubject || (subject instanceof MessageSubject && subject.message.type === 1 /* TestMessageType.Output */)) {
                await this.updateForTestSubject(subject);
            }
            else {
                this.clear();
            }
        }
        async updateForTestSubject(subject) {
            const that = this;
            const testItem = subject instanceof TestOutputSubject ? subject.test.item : subject.test;
            const terminal = await this.updateGenerically({
                subject,
                noOutputMessage: (0, nls_1.localize)('caseNoOutput', 'The test case did not report any output.'),
                getTarget: result => result?.tasks[subject.taskIndex].output,
                *doInitialWrite(output, results) {
                    that.updateCwd(testItem.uri);
                    const state = subject instanceof TestOutputSubject ? subject.test : results.getStateById(testItem.extId);
                    if (!state) {
                        return;
                    }
                    for (const message of state.tasks[subject.taskIndex].messages) {
                        if (message.type === 1 /* TestMessageType.Output */) {
                            yield* output.getRangeIter(message.offset, message.length);
                        }
                    }
                },
                doListenForMoreData: (output, result, write) => result.onChange(e => {
                    if (e.reason === 2 /* TestResultItemChangeReason.NewMessage */ && e.item.item.extId === testItem.extId && e.message.type === 1 /* TestMessageType.Output */) {
                        for (const chunk of output.getRangeIter(e.message.offset, e.message.length)) {
                            write(chunk.buffer);
                        }
                    }
                }),
            });
            if (subject instanceof MessageSubject && subject.message.type === 1 /* TestMessageType.Output */ && subject.message.marker !== undefined) {
                terminal?.xterm.selectMarkedRange((0, testTypes_1.getMarkId)(subject.message.marker, true), (0, testTypes_1.getMarkId)(subject.message.marker, false), /* scrollIntoView= */ true);
            }
        }
        updateForTaskSubject(subject) {
            return this.updateGenerically({
                subject,
                noOutputMessage: (0, nls_1.localize)('runNoOutput', 'The test run did not record any output.'),
                getTarget: result => result?.tasks[subject.taskIndex],
                doInitialWrite: (task, result) => {
                    // Update the cwd and use the first test to try to hint at the correct cwd,
                    // but often this will fall back to the first workspace folder.
                    this.updateCwd(iterator_1.Iterable.find(result.tests, t => !!t.item.uri)?.item.uri);
                    return task.output.buffers;
                },
                doListenForMoreData: (task, _result, write) => task.output.onDidWriteData(e => write(e.buffer)),
            });
        }
        async updateGenerically(opts) {
            const result = opts.subject.result;
            const target = opts.getTarget(result);
            if (!target) {
                return this.clear();
            }
            const terminal = await this.makeTerminal();
            let didWriteData = false;
            const pendingWrites = new observableValue_1.MutableObservableValue(0);
            if (result instanceof testResult_1.LiveTestResult) {
                for (const chunk of opts.doInitialWrite(target, result)) {
                    didWriteData ||= chunk.byteLength > 0;
                    pendingWrites.value++;
                    terminal.xterm.write(chunk.buffer, () => pendingWrites.value--);
                }
            }
            else {
                didWriteData = true;
                this.writeNotice(terminal, (0, nls_1.localize)('runNoOutputForPast', 'Test output is only available for new test runs.'));
            }
            this.attachTerminalToDom(terminal);
            this.outputDataListener.clear();
            if (result instanceof testResult_1.LiveTestResult && !result.completedAt) {
                const l1 = result.onComplete(() => {
                    if (!didWriteData) {
                        this.writeNotice(terminal, opts.noOutputMessage);
                    }
                });
                const l2 = opts.doListenForMoreData(target, result, data => {
                    terminal.xterm.write(data);
                    didWriteData ||= data.byteLength > 0;
                });
                this.outputDataListener.value = (0, lifecycle_1.combinedDisposable)(l1, l2);
            }
            if (!this.outputDataListener.value && !didWriteData) {
                this.writeNotice(terminal, opts.noOutputMessage);
            }
            // Ensure pending writes finish, otherwise the selection in `updateForTestSubject`
            // can happen before the markers are processed.
            if (pendingWrites.value > 0) {
                await new Promise(resolve => {
                    const l = pendingWrites.onDidChange(() => {
                        if (pendingWrites.value === 0) {
                            l.dispose();
                            resolve();
                        }
                    });
                });
            }
            return terminal;
        }
        updateCwd(testUri) {
            const wf = (testUri && this.workspaceContext.getWorkspaceFolder(testUri))
                || this.workspaceContext.getWorkspace().folders[0];
            if (wf) {
                this.terminalCwd.value = wf.uri.fsPath;
            }
        }
        writeNotice(terminal, str) {
            terminal.xterm.write((0, terminalStrings_1.formatMessageForTerminal)(str));
        }
        attachTerminalToDom(terminal) {
            terminal.xterm.write('\x1b[?25l'); // hide cursor
            dom.scheduleAtNextAnimationFrame(dom.getWindow(this.container), () => this.layoutTerminal(terminal));
            terminal.attachToElement(this.container, { enableGpu: false });
        }
        clear() {
            this.outputDataListener.clear();
            this.xtermLayoutDelayer.cancel();
            this.terminal.clear();
        }
        layout(dimensions) {
            this.dimensions = dimensions;
            if (this.terminal.value) {
                this.layoutTerminal(this.terminal.value, dimensions.width, dimensions.height);
            }
        }
        layoutTerminal({ xterm }, width = this.dimensions?.width ?? this.container.clientWidth, height = this.dimensions?.height ?? this.container.clientHeight) {
            width -= 10 + 20; // scrollbar width + margin
            this.xtermLayoutDelayer.trigger(() => {
                const scaled = (0, xtermTerminal_1.getXtermScaledDimensions)(dom.getWindow(this.container), xterm.getFont(), width, height);
                if (scaled) {
                    xterm.resize(scaled.cols, scaled.rows);
                }
            });
        }
    };
    TerminalMessagePeek = __decorate([
        __param(2, terminal_1.ITerminalService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], TerminalMessagePeek);
    const hintMessagePeekHeight = (msg) => {
        const msgHeight = isDiffable(msg)
            ? Math.max(hintPeekStrHeight(msg.actual), hintPeekStrHeight(msg.expected))
            : hintPeekStrHeight(typeof msg.message === 'string' ? msg.message : msg.message.value);
        // add 8ish lines for the size of the title and decorations in the peek.
        return msgHeight + 8;
    };
    const firstLine = (str) => {
        const index = str.indexOf('\n');
        return index === -1 ? str : str.slice(0, index);
    };
    const isMultiline = (str) => !!str && str.includes('\n');
    const hintPeekStrHeight = (str) => Math.min((0, strings_1.count)(str, '\n'), 24);
    class SimpleDiffEditorModel extends editorModel_1.EditorModel {
        constructor(_original, _modified) {
            super();
            this._original = _original;
            this._modified = _modified;
            this.original = this._original.object.textEditorModel;
            this.modified = this._modified.object.textEditorModel;
        }
        dispose() {
            super.dispose();
            this._original.dispose();
            this._modified.dispose();
        }
    }
    function getOuterEditorFromDiffEditor(codeEditorService) {
        const diffEditors = codeEditorService.listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.hasTextFocus() && diffEditor instanceof embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget) {
                return diffEditor.getParentEditor();
            }
        }
        return null;
    }
    class CloseTestPeek extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeTestPeek',
                title: (0, nls_1.localize2)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: contextkey_1.ContextKeyExpr.or(testingContextKeys_1.TestingContextKeys.isInPeek, testingContextKeys_1.TestingContextKeys.isPeekVisible),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 101,
                    primary: 9 /* KeyCode.Escape */,
                    when: contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')
                }
            });
        }
        runEditorCommand(accessor, editor) {
            const parent = getPeekedEditorFromFocus(accessor.get(codeEditorService_1.ICodeEditorService));
            TestingOutputPeekController.get(parent ?? editor)?.removePeek();
        }
    }
    exports.CloseTestPeek = CloseTestPeek;
    class TestResultElement {
        get icon() {
            return icons.testingStatesToIcons.get(this.value.completedAt === undefined
                ? 2 /* TestResultState.Running */
                : (0, testResult_1.maxCountPriority)(this.value.counts));
        }
        constructor(value) {
            this.value = value;
            this.changeEmitter = new event_1.Emitter();
            this.onDidChange = this.changeEmitter.event;
            this.type = 'result';
            this.context = this.value.id;
            this.id = this.value.id;
            this.label = this.value.name;
        }
    }
    const openCoverageLabel = (0, nls_1.localize)('openTestCoverage', 'View Test Coverage');
    const closeCoverageLabel = (0, nls_1.localize)('closeTestCoverage', 'Close Test Coverage');
    class CoverageElement {
        get label() {
            return this.isOpen ? closeCoverageLabel : openCoverageLabel;
        }
        get icon() {
            return this.isOpen ? iconRegistry_1.widgetClose : icons.testingCoverageReport;
        }
        get isOpen() {
            return this.coverageService.selected.get()?.fromTaskId === this.task.id;
        }
        constructor(results, task, coverageService) {
            this.results = results;
            this.task = task;
            this.coverageService = coverageService;
            this.type = 'coverage';
            this.id = `coverage-${this.results.id}/${this.task.id}`;
            this.onDidChange = event_1.Event.fromObservableLight(coverageService.selected);
        }
    }
    class TestCaseElement {
        get onDidChange() {
            if (!(this.results instanceof testResult_1.LiveTestResult)) {
                return event_1.Event.None;
            }
            return event_1.Event.filter(this.results.onChange, e => e.item.item.extId === this.test.item.extId);
        }
        get state() {
            return this.test.tasks[this.taskIndex].state;
        }
        get label() {
            return this.test.item.label;
        }
        get labelWithIcons() {
            return (0, iconLabels_1.renderLabelWithIcons)(this.label);
        }
        get icon() {
            return icons.testingStatesToIcons.get(this.state);
        }
        get outputSubject() {
            return new TestOutputSubject(this.results, this.taskIndex, this.test);
        }
        constructor(results, test, taskIndex) {
            this.results = results;
            this.test = test;
            this.taskIndex = taskIndex;
            this.type = 'test';
            this.context = {
                $mid: 16 /* MarshalledId.TestItemContext */,
                tests: [testTypes_1.InternalTestItem.serialize(this.test)],
            };
            this.id = `${this.results.id}/${this.test.item.extId}`;
        }
    }
    class TaskElement {
        get icon() {
            return this.results.tasks[this.index].running ? icons.testingStatesToIcons.get(2 /* TestResultState.Running */) : undefined;
        }
        constructor(results, task, index) {
            this.results = results;
            this.task = task;
            this.index = index;
            this.changeEmitter = new event_1.Emitter();
            this.onDidChange = this.changeEmitter.event;
            this.type = 'task';
            this.itemsCache = new CreationCache();
            this.id = `${results.id}/${index}`;
            this.task = results.tasks[index];
            this.context = String(index);
            this.label = this.task.name ?? (0, nls_1.localize)('testUnnamedTask', 'Unnamed Task');
        }
    }
    class TestMessageElement {
        get onDidChange() {
            if (!(this.result instanceof testResult_1.LiveTestResult)) {
                return event_1.Event.None;
            }
            // rerender when the test case changes so it gets retired events
            return event_1.Event.filter(this.result.onChange, e => e.item.item.extId === this.test.item.extId);
        }
        get context() {
            return getMessageArgs(this.test, this.message);
        }
        get outputSubject() {
            return new TestOutputSubject(this.result, this.taskIndex, this.test);
        }
        constructor(result, test, taskIndex, messageIndex) {
            this.result = result;
            this.test = test;
            this.taskIndex = taskIndex;
            this.messageIndex = messageIndex;
            this.type = 'message';
            const m = this.message = test.tasks[taskIndex].messages[messageIndex];
            this.location = m.location;
            this.contextValue = m.type === 0 /* TestMessageType.Error */ ? m.contextValue : undefined;
            this.uri = (0, testingUri_1.buildTestUri)({
                type: 2 /* TestUriType.ResultMessage */,
                messageIndex,
                resultId: result.id,
                taskIndex,
                testExtId: test.item.extId
            });
            this.id = this.uri.toString();
            const asPlaintext = (0, testMessageColorizer_1.renderTestMessageAsText)(m.message);
            const lines = (0, strings_1.count)(asPlaintext.trimEnd(), '\n');
            this.label = firstLine(asPlaintext);
            if (lines > 0) {
                this.description = lines > 1
                    ? (0, nls_1.localize)('messageMoreLinesN', '+ {0} more lines', lines)
                    : (0, nls_1.localize)('messageMoreLines1', '+ 1 more line');
            }
        }
    }
    let OutputPeekTree = class OutputPeekTree extends lifecycle_1.Disposable {
        constructor(container, onDidReveal, options, contextMenuService, results, instantiationService, explorerFilter, coverageService, progressService) {
            super();
            this.contextMenuService = contextMenuService;
            this.disposed = false;
            this.requestReveal = this._register(new event_1.Emitter());
            this.onDidRequestReview = this.requestReveal.event;
            this.treeActions = instantiationService.createInstance(TreeActionsProvider, options.showRevealLocationOnMessages, this.requestReveal);
            const diffIdentityProvider = {
                getId(e) {
                    return e.id;
                }
            };
            this.tree = this._register(instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'Test Output Peek', container, {
                getHeight: () => 22,
                getTemplateId: () => TestRunElementRenderer.ID,
            }, [instantiationService.createInstance(TestRunElementRenderer, this.treeActions)], {
                compressionEnabled: true,
                hideTwistiesOfChildlessElements: true,
                identityProvider: diffIdentityProvider,
                sorter: {
                    compare(a, b) {
                        if (a instanceof TestCaseElement && b instanceof TestCaseElement) {
                            return (0, testingStates_1.cmpPriority)(a.state, b.state);
                        }
                        return 0;
                    },
                },
                accessibilityProvider: {
                    getAriaLabel(element) {
                        return element.ariaLabel || element.label;
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('testingPeekLabel', 'Test Result Messages');
                    }
                }
            }));
            const cc = new CreationCache();
            const getTaskChildren = (taskElem) => {
                const { results, index, itemsCache, task } = taskElem;
                const tests = iterator_1.Iterable.filter(results.tests, test => test.tasks[index].state >= 2 /* TestResultState.Running */ || test.tasks[index].messages.length > 0);
                let result = iterator_1.Iterable.map(tests, test => ({
                    element: itemsCache.getOrCreate(test, () => new TestCaseElement(results, test, index)),
                    incompressible: true,
                    children: getTestChildren(results, test, index),
                }));
                if (task.coverage.get()) {
                    result = iterator_1.Iterable.concat(iterator_1.Iterable.single({
                        element: new CoverageElement(results, task, coverageService),
                        incompressible: true,
                    }), result);
                }
                return result;
            };
            const getTestChildren = (result, test, taskIndex) => {
                return test.tasks[taskIndex].messages
                    .map((m, messageIndex) => m.type === 0 /* TestMessageType.Error */
                    ? { element: cc.getOrCreate(m, () => new TestMessageElement(result, test, taskIndex, messageIndex)), incompressible: false }
                    : undefined)
                    .filter(types_1.isDefined);
            };
            const getResultChildren = (result) => {
                return result.tasks.map((task, taskIndex) => {
                    const taskElem = cc.getOrCreate(task, () => new TaskElement(result, task, taskIndex));
                    return ({
                        element: taskElem,
                        incompressible: false,
                        children: getTaskChildren(taskElem),
                    });
                });
            };
            const getRootChildren = () => results.results.map(result => {
                const element = cc.getOrCreate(result, () => new TestResultElement(result));
                return {
                    element,
                    incompressible: true,
                    collapsed: this.tree.hasElement(element) ? this.tree.isCollapsed(element) : true,
                    children: getResultChildren(result)
                };
            });
            // Queued result updates to prevent spamming CPU when lots of tests are
            // completing and messaging quickly (#142514)
            const taskChildrenToUpdate = new Set();
            const taskChildrenUpdate = this._register(new async_1.RunOnceScheduler(() => {
                for (const taskNode of taskChildrenToUpdate) {
                    if (this.tree.hasElement(taskNode)) {
                        this.tree.setChildren(taskNode, getTaskChildren(taskNode), { diffIdentityProvider });
                    }
                }
                taskChildrenToUpdate.clear();
            }, 300));
            const queueTaskChildrenUpdate = (taskNode) => {
                taskChildrenToUpdate.add(taskNode);
                if (!taskChildrenUpdate.isScheduled()) {
                    taskChildrenUpdate.schedule();
                }
            };
            const attachToResults = (result) => {
                const resultNode = cc.get(result);
                const disposable = new lifecycle_1.DisposableStore();
                disposable.add(result.onNewTask(i => {
                    if (result.tasks.length === 1) {
                        this.requestReveal.fire(new TaskSubject(result, 0)); // reveal the first task in new runs
                    }
                    if (this.tree.hasElement(resultNode)) {
                        this.tree.setChildren(resultNode, getResultChildren(result), { diffIdentityProvider });
                    }
                    // note: tasks are bounded and their lifetime is equivalent to that of
                    // the test result, so this doesn't leak indefinitely.
                    const task = result.tasks[i];
                    disposable.add((0, observable_1.autorun)(reader => {
                        task.coverage.read(reader); // add it to the autorun
                        queueTaskChildrenUpdate(cc.get(task));
                    }));
                }));
                disposable.add(result.onEndTask(index => {
                    cc.get(result.tasks[index])?.changeEmitter.fire();
                }));
                disposable.add(result.onChange(e => {
                    // try updating the item in each of its tasks
                    for (const [index, task] of result.tasks.entries()) {
                        const taskNode = cc.get(task);
                        if (!this.tree.hasElement(taskNode)) {
                            continue;
                        }
                        const itemNode = taskNode.itemsCache.get(e.item);
                        if (itemNode && this.tree.hasElement(itemNode)) {
                            if (e.reason === 2 /* TestResultItemChangeReason.NewMessage */ && e.message.type === 0 /* TestMessageType.Error */) {
                                this.tree.setChildren(itemNode, getTestChildren(result, e.item, index), { diffIdentityProvider });
                            }
                            return;
                        }
                        queueTaskChildrenUpdate(taskNode);
                    }
                }));
                disposable.add(result.onComplete(() => {
                    resultNode.changeEmitter.fire();
                    disposable.dispose();
                }));
                return resultNode;
            };
            this._register(results.onResultsChanged(e => {
                // little hack here: a result change can cause the peek to be disposed,
                // but this listener will still be queued. Doing stuff with the tree
                // will cause errors.
                if (this.disposed) {
                    return;
                }
                if ('completed' in e) {
                    cc.get(e.completed)?.changeEmitter.fire();
                    return;
                }
                this.tree.setChildren(null, getRootChildren(), { diffIdentityProvider });
                // done after setChildren intentionally so that the ResultElement exists in the cache.
                if ('started' in e) {
                    for (const child of this.tree.getNode(null).children) {
                        this.tree.collapse(child.element, false);
                    }
                    this.tree.expand(attachToResults(e.started), true);
                }
            }));
            const revealItem = (element, preserveFocus) => {
                this.tree.setFocus([element]);
                this.tree.setSelection([element]);
                if (!preserveFocus) {
                    this.tree.domFocus();
                }
            };
            this._register(onDidReveal(async ({ subject, preserveFocus = false }) => {
                if (subject instanceof TaskSubject) {
                    const resultItem = this.tree.getNode(null).children.find(c => {
                        if (c.element instanceof TaskElement) {
                            return c.element.results.id === subject.result.id && c.element.index === subject.taskIndex;
                        }
                        if (c.element instanceof TestResultElement) {
                            return c.element.id === subject.result.id;
                        }
                        return false;
                    });
                    if (resultItem) {
                        revealItem(resultItem.element, preserveFocus);
                    }
                    return;
                }
                const revealElement = subject instanceof TestOutputSubject
                    ? cc.get(subject.task)?.itemsCache.get(subject.test)
                    : cc.get(subject.message);
                if (!revealElement || !this.tree.hasElement(revealElement)) {
                    return;
                }
                const parents = [];
                for (let parent = this.tree.getParentElement(revealElement); parent; parent = this.tree.getParentElement(parent)) {
                    parents.unshift(parent);
                }
                for (const parent of parents) {
                    this.tree.expand(parent);
                }
                if (this.tree.getRelativeTop(revealElement) === null) {
                    this.tree.reveal(revealElement, 0.5);
                }
                revealItem(revealElement, preserveFocus);
            }));
            this._register(this.tree.onDidOpen(async (e) => {
                if (e.element instanceof TestMessageElement) {
                    this.requestReveal.fire(new MessageSubject(e.element.result, e.element.test, e.element.taskIndex, e.element.messageIndex));
                }
                else if (e.element instanceof TestCaseElement) {
                    const t = e.element;
                    const message = mapFindTestMessage(e.element.test, (_t, _m, mesasgeIndex, taskIndex) => new MessageSubject(t.results, t.test, taskIndex, mesasgeIndex));
                    this.requestReveal.fire(message || new TestOutputSubject(t.results, 0, t.test));
                }
                else if (e.element instanceof CoverageElement) {
                    const task = e.element.task;
                    if (e.element.isOpen) {
                        return coverageService.closeCoverage();
                    }
                    progressService.withProgress({ location: options.locationForProgress }, () => coverageService.openCoverage(task, true));
                }
            }));
            this._register(this.tree.onDidChangeSelection(evt => {
                for (const element of evt.elements) {
                    if (element && 'test' in element) {
                        explorerFilter.reveal.value = element.test.item.extId;
                        break;
                    }
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this.tree.setChildren(null, getRootChildren());
            for (const result of results.results) {
                if (!result.completedAt && result instanceof testResult_1.LiveTestResult) {
                    attachToResults(result);
                }
            }
        }
        layout(height, width) {
            this.tree.layout(height, width);
        }
        onContextMenu(evt) {
            if (!evt.element) {
                return;
            }
            const actions = this.treeActions.provideActionBar(evt.element);
            this.contextMenuService.showContextMenu({
                getAnchor: () => evt.anchor,
                getActions: () => actions.secondary.length
                    ? [...actions.primary, new actions_1.Separator(), ...actions.secondary]
                    : actions.primary,
                getActionsContext: () => evt.element?.context
            });
        }
        dispose() {
            super.dispose();
            this.disposed = true;
        }
    };
    OutputPeekTree = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, testResultService_1.ITestResultService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(7, testCoverageService_1.ITestCoverageService),
        __param(8, progress_1.IProgressService)
    ], OutputPeekTree);
    let TestRunElementRenderer = class TestRunElementRenderer {
        static { TestRunElementRenderer_1 = this; }
        static { this.ID = 'testRunElementRenderer'; }
        constructor(treeActions, instantiationService) {
            this.treeActions = treeActions;
            this.instantiationService = instantiationService;
            this.templateId = TestRunElementRenderer_1.ID;
        }
        /** @inheritdoc */
        renderCompressedElements(node, _index, templateData) {
            const chain = node.element.elements;
            const lastElement = chain[chain.length - 1];
            if ((lastElement instanceof TaskElement || lastElement instanceof TestMessageElement) && chain.length >= 2) {
                this.doRender(chain[chain.length - 2], templateData, lastElement);
            }
            else {
                this.doRender(lastElement, templateData);
            }
        }
        /** @inheritdoc */
        renderTemplate(container) {
            const templateDisposable = new lifecycle_1.DisposableStore();
            const wrapper = dom.append(container, dom.$('.test-peek-item'));
            const icon = dom.append(wrapper, dom.$('.state'));
            const label = dom.append(wrapper, dom.$('.name'));
            const actionBar = new actionbar_1.ActionBar(wrapper, {
                actionViewItemProvider: (action, options) => action instanceof actions_2.MenuItemAction
                    ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate })
                    : undefined
            });
            const elementDisposable = new lifecycle_1.DisposableStore();
            templateDisposable.add(elementDisposable);
            templateDisposable.add(actionBar);
            return {
                icon,
                label,
                actionBar,
                elementDisposable,
                templateDisposable,
            };
        }
        /** @inheritdoc */
        renderElement(element, _index, templateData) {
            this.doRender(element.element, templateData);
        }
        /** @inheritdoc */
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
        /** Called to render a new element */
        doRender(element, templateData, subjectElement) {
            templateData.elementDisposable.clear();
            templateData.elementDisposable.add(element.onDidChange(() => this.doRender(element, templateData, subjectElement)));
            this.doRenderInner(element, templateData, subjectElement);
        }
        /** Called, and may be re-called, to render or re-render an element */
        doRenderInner(element, templateData, subjectElement) {
            let { label, labelWithIcons, description } = element;
            if (subjectElement instanceof TestMessageElement) {
                description = subjectElement.label;
            }
            const descriptionElement = description ? dom.$('span.test-label-description', {}, description) : '';
            if (labelWithIcons) {
                dom.reset(templateData.label, ...labelWithIcons, descriptionElement);
            }
            else {
                dom.reset(templateData.label, label, descriptionElement);
            }
            const icon = element.icon;
            templateData.icon.className = `computed-state ${icon ? themables_1.ThemeIcon.asClassName(icon) : ''}`;
            const actions = this.treeActions.provideActionBar(element);
            templateData.actionBar.clear();
            templateData.actionBar.context = element.context;
            templateData.actionBar.push(actions.primary, { icon: true, label: false });
        }
    };
    TestRunElementRenderer = TestRunElementRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], TestRunElementRenderer);
    let TreeActionsProvider = class TreeActionsProvider {
        constructor(showRevealLocationOnMessages, requestReveal, contextKeyService, menuService, commandService, testProfileService, editorService) {
            this.showRevealLocationOnMessages = showRevealLocationOnMessages;
            this.requestReveal = requestReveal;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.commandService = commandService;
            this.testProfileService = testProfileService;
            this.editorService = editorService;
        }
        provideActionBar(element) {
            const test = element instanceof TestCaseElement ? element.test : undefined;
            const capabilities = test ? this.testProfileService.capabilitiesForTest(test) : 0;
            const contextKeys = [
                ['peek', "editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */],
                [testingContextKeys_1.TestingContextKeys.peekItemType.key, element.type],
            ];
            let id = actions_2.MenuId.TestPeekElement;
            const primary = [];
            const secondary = [];
            if (element instanceof TaskElement) {
                primary.push(new actions_1.Action('testing.outputPeek.showResultOutput', (0, nls_1.localize)('testing.showResultOutput', "Show Result Output"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.terminal), undefined, () => this.requestReveal.fire(new TaskSubject(element.results, element.index))));
            }
            if (element instanceof TestResultElement) {
                // only show if there are no collapsed test nodes that have more specific choices
                if (element.value.tasks.length === 1) {
                    primary.push(new actions_1.Action('testing.outputPeek.showResultOutput', (0, nls_1.localize)('testing.showResultOutput', "Show Result Output"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.terminal), undefined, () => this.requestReveal.fire(new TaskSubject(element.value, 0))));
                }
                primary.push(new actions_1.Action('testing.outputPeek.reRunLastRun', (0, nls_1.localize)('testing.reRunLastRun', "Rerun Test Run"), themables_1.ThemeIcon.asClassName(icons.testingRunIcon), undefined, () => this.commandService.executeCommand('testing.reRunLastRun', element.value.id)));
                if (capabilities & 4 /* TestRunProfileBitset.Debug */) {
                    primary.push(new actions_1.Action('testing.outputPeek.debugLastRun', (0, nls_1.localize)('testing.debugLastRun', "Debug Test Run"), themables_1.ThemeIcon.asClassName(icons.testingDebugIcon), undefined, () => this.commandService.executeCommand('testing.debugLastRun', element.value.id)));
                }
            }
            if (element instanceof TestCaseElement || element instanceof TestMessageElement) {
                contextKeys.push([testingContextKeys_1.TestingContextKeys.testResultOutdated.key, element.test.retired], [testingContextKeys_1.TestingContextKeys.testResultState.key, testTypes_1.testResultStateToContextValues[element.test.ownComputedState]], ...(0, testItemContextOverlay_1.getTestItemContextOverlay)(element.test, capabilities));
                const extId = element.test.item.extId;
                if (element.test.tasks[element.taskIndex].messages.some(m => m.type === 1 /* TestMessageType.Output */)) {
                    primary.push(new actions_1.Action('testing.outputPeek.showResultOutput', (0, nls_1.localize)('testing.showResultOutput', "Show Result Output"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.terminal), undefined, () => this.requestReveal.fire(element.outputSubject)));
                }
                secondary.push(new actions_1.Action('testing.outputPeek.revealInExplorer', (0, nls_1.localize)('testing.revealInExplorer', "Reveal in Test Explorer"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.listTree), undefined, () => this.commandService.executeCommand('_revealTestInExplorer', extId)));
                if (capabilities & 2 /* TestRunProfileBitset.Run */) {
                    primary.push(new actions_1.Action('testing.outputPeek.runTest', (0, nls_1.localize)('run test', 'Run Test'), themables_1.ThemeIcon.asClassName(icons.testingRunIcon), undefined, () => this.commandService.executeCommand('vscode.runTestsById', 2 /* TestRunProfileBitset.Run */, extId)));
                }
                if (capabilities & 4 /* TestRunProfileBitset.Debug */) {
                    primary.push(new actions_1.Action('testing.outputPeek.debugTest', (0, nls_1.localize)('debug test', 'Debug Test'), themables_1.ThemeIcon.asClassName(icons.testingDebugIcon), undefined, () => this.commandService.executeCommand('vscode.runTestsById', 4 /* TestRunProfileBitset.Debug */, extId)));
                }
            }
            if (element instanceof TestMessageElement) {
                primary.push(new actions_1.Action('testing.outputPeek.goToFile', (0, nls_1.localize)('testing.goToFile', "Go to Source"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.goToFile), undefined, () => this.commandService.executeCommand('vscode.revealTest', element.test.item.extId)));
            }
            if (element instanceof TestMessageElement) {
                id = actions_2.MenuId.TestMessageContext;
                contextKeys.push([testingContextKeys_1.TestingContextKeys.testMessageContext.key, element.contextValue]);
                if (this.showRevealLocationOnMessages && element.location) {
                    primary.push(new actions_1.Action('testing.outputPeek.goToError', (0, nls_1.localize)('testing.goToError', "Go to Source"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.goToFile), undefined, () => this.editorService.openEditor({
                        resource: element.location.uri,
                        options: {
                            selection: element.location.range,
                            preserveFocus: true,
                        }
                    })));
                }
            }
            const contextOverlay = this.contextKeyService.createOverlay(contextKeys);
            const result = { primary, secondary };
            const menu = this.menuService.createMenu(id, contextOverlay);
            try {
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { arg: element.context }, result, 'inline');
                return result;
            }
            finally {
                menu.dispose();
            }
        }
    };
    TreeActionsProvider = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, actions_2.IMenuService),
        __param(4, commands_1.ICommandService),
        __param(5, testProfileService_1.ITestProfileService),
        __param(6, editorService_1.IEditorService)
    ], TreeActionsProvider);
    const navWhen = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, testingContextKeys_1.TestingContextKeys.isPeekVisible);
    /**
     * Gets the appropriate editor for peeking based on the currently focused editor.
     */
    const getPeekedEditorFromFocus = (codeEditorService) => {
        const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
        return editor && getPeekedEditor(codeEditorService, editor);
    };
    /**
     * Gets the editor where the peek may be shown, bubbling upwards if the given
     * editor is embedded (i.e. inside a peek already).
     */
    const getPeekedEditor = (codeEditorService, editor) => {
        if (TestingOutputPeekController.get(editor)?.subject) {
            return editor;
        }
        if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
            return editor.getParentEditor();
        }
        const outer = getOuterEditorFromDiffEditor(codeEditorService);
        if (outer) {
            return outer;
        }
        return editor;
    };
    class GoToNextMessageAction extends actions_2.Action2 {
        static { this.ID = 'testing.goToNextMessage'; }
        constructor() {
            super({
                id: GoToNextMessageAction.ID,
                f1: true,
                title: (0, nls_1.localize2)('testing.goToNextMessage', 'Go to Next Test Failure'),
                metadata: {
                    description: (0, nls_1.localize2)('testing.goToNextMessage.description', 'Shows the next failure message in your file')
                },
                icon: codicons_1.Codicon.arrowDown,
                category: actionCommonCategories_1.Categories.Test,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    when: navWhen,
                },
                menu: [{
                        id: actions_2.MenuId.TestPeekTitle,
                        group: 'navigation',
                        order: 2,
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: navWhen
                    }],
            });
        }
        run(accessor) {
            const editor = getPeekedEditorFromFocus(accessor.get(codeEditorService_1.ICodeEditorService));
            if (editor) {
                TestingOutputPeekController.get(editor)?.next();
            }
        }
    }
    exports.GoToNextMessageAction = GoToNextMessageAction;
    class GoToPreviousMessageAction extends actions_2.Action2 {
        static { this.ID = 'testing.goToPreviousMessage'; }
        constructor() {
            super({
                id: GoToPreviousMessageAction.ID,
                f1: true,
                title: (0, nls_1.localize2)('testing.goToPreviousMessage', 'Go to Previous Test Failure'),
                metadata: {
                    description: (0, nls_1.localize2)('testing.goToPreviousMessage.description', 'Shows the previous failure message in your file')
                },
                icon: codicons_1.Codicon.arrowUp,
                category: actionCommonCategories_1.Categories.Test,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    when: navWhen
                },
                menu: [{
                        id: actions_2.MenuId.TestPeekTitle,
                        group: 'navigation',
                        order: 1,
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: navWhen
                    }],
            });
        }
        run(accessor) {
            const editor = getPeekedEditorFromFocus(accessor.get(codeEditorService_1.ICodeEditorService));
            if (editor) {
                TestingOutputPeekController.get(editor)?.previous();
            }
        }
    }
    exports.GoToPreviousMessageAction = GoToPreviousMessageAction;
    class OpenMessageInEditorAction extends actions_2.Action2 {
        static { this.ID = 'testing.openMessageInEditor'; }
        constructor() {
            super({
                id: OpenMessageInEditorAction.ID,
                f1: false,
                title: (0, nls_1.localize2)('testing.openMessageInEditor', 'Open in Editor'),
                icon: codicons_1.Codicon.goToFile,
                category: actionCommonCategories_1.Categories.Test,
                menu: [{ id: actions_2.MenuId.TestPeekTitle }],
            });
        }
        run(accessor) {
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).openCurrentInEditor();
        }
    }
    exports.OpenMessageInEditorAction = OpenMessageInEditorAction;
    class ToggleTestingPeekHistory extends actions_2.Action2 {
        static { this.ID = 'testing.toggleTestingPeekHistory'; }
        constructor() {
            super({
                id: ToggleTestingPeekHistory.ID,
                f1: true,
                title: (0, nls_1.localize2)('testing.toggleTestingPeekHistory', 'Toggle Test History in Peek'),
                metadata: {
                    description: (0, nls_1.localize2)('testing.toggleTestingPeekHistory.description', 'Shows or hides the history of test runs in the peek view')
                },
                icon: codicons_1.Codicon.history,
                category: actionCommonCategories_1.Categories.Test,
                menu: [{
                        id: actions_2.MenuId.TestPeekTitle,
                        group: 'navigation',
                        order: 3,
                    }],
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 38 /* KeyCode.KeyH */,
                    when: testingContextKeys_1.TestingContextKeys.isPeekVisible.isEqualTo(true),
                },
            });
        }
        run(accessor) {
            const opener = accessor.get(testingPeekOpener_1.ITestingPeekOpener);
            opener.historyVisible.value = !opener.historyVisible.value;
        }
    }
    exports.ToggleTestingPeekHistory = ToggleTestingPeekHistory;
    class CreationCache {
        constructor() {
            this.v = new WeakMap();
        }
        get(key) {
            return this.v.get(key);
        }
        getOrCreate(ref, factory) {
            const existing = this.v.get(ref);
            if (existing) {
                return existing;
            }
            const fresh = factory();
            this.v.set(ref, fresh);
            return fresh;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ091dHB1dFBlZWsuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdGluZ091dHB1dFBlZWsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlHaEcsTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFvQixFQUFFLE9BQXFCLEVBQXdCLEVBQUUsQ0FBQyxDQUFDO1FBQzlGLElBQUksMkNBQWtDO1FBQ3RDLElBQUksRUFBRSw0QkFBZ0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ3RDLE9BQU8sRUFBRSx3QkFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7S0FDeEMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxjQUFjO1FBU25CLElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxrQ0FBMEIsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxJQUFXLFlBQVk7WUFDdEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksa0NBQTBCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDNUYsQ0FBQztRQUVELFlBQTRCLE1BQW1CLEVBQUUsSUFBb0IsRUFBa0IsU0FBaUIsRUFBa0IsWUFBb0I7WUFBbEgsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUF3QyxjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQWtCLGlCQUFZLEdBQVosWUFBWSxDQUFRO1lBQzdJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUN0QixNQUFNLFFBQVEsR0FBRyxJQUFJLENB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