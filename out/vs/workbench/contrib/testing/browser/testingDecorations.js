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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/platform", "vs/base/common/themables", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/model", "vs/editor/common/services/model", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/codeEditor/browser/editorLineNumberMenu", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testMessageColorizer", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testingDecorations", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testingUri"], function (require, exports, dom, actions_1, arrays_1, async_1, event_1, htmlContent_1, iconLabels_1, iterator_1, lifecycle_1, map_1, platform_1, themables_1, uuid_1, codeEditorService_1, editorColorRegistry_1, model_1, model_2, nls_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, quickInput_1, themeService_1, uriIdentity_1, editorLineNumberMenu_1, testItemContextOverlay_1, icons_1, testMessageColorizer_1, configuration_2, constants_1, testId_1, testProfileService_1, testResult_1, testResultService_1, testService_1, testingDecorations_1, testingPeekOpener_1, testingStates_1, testingUri_1) {
    "use strict";
    var TestMessageDecoration_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingDecorations = exports.TestingDecorationService = void 0;
    const MAX_INLINE_MESSAGE_LENGTH = 128;
    const MAX_TESTS_IN_SUBMENU = 30;
    const GLYPH_MARGIN_LANE = model_1.GlyphMarginLane.Center;
    function isOriginalInDiffEditor(codeEditorService, codeEditor) {
        const diffEditors = codeEditorService.listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.getOriginalEditor() === codeEditor) {
                return true;
            }
        }
        return false;
    }
    /** Value for saved decorations, providing fast accessors for the hot 'syncDecorations' path */
    class CachedDecorations {
        constructor() {
            this.runByIdKey = new Map();
            this.messages = new Map();
        }
        get size() {
            return this.runByIdKey.size + this.messages.size;
        }
        /** Gets a test run decoration that contains exactly the given test IDs */
        getForExactTests(testIds) {
            const key = testIds.sort().join('\0\0');
            return this.runByIdKey.get(key);
        }
        /** Gets the decoration that corresponds to the given test message */
        getMessage(message) {
            return this.messages.get(message);
        }
        /** Removes the decoration for the given test messsage */
        removeMessage(message) {
            this.messages.delete(message);
        }
        /** Adds a new test message decoration */
        addMessage(d) {
            this.messages.set(d.testMessage, d);
        }
        /** Adds a new test run decroation */
        addTest(d) {
            const key = d.testIds.sort().join('\0\0');
            this.runByIdKey.set(key, d);
        }
        /** Finds an extension by VS Code event ID */
        getById(decorationId) {
            for (const d of this.runByIdKey.values()) {
                if (d.id === decorationId) {
                    return d;
                }
            }
            for (const d of this.messages.values()) {
                if (d.id === decorationId) {
                    return d;
                }
            }
            return undefined;
        }
        /** Iterate over all decorations */
        *[Symbol.iterator]() {
            for (const d of this.runByIdKey.values()) {
                yield d;
            }
            for (const d of this.messages.values()) {
                yield d;
            }
        }
    }
    let TestingDecorationService = class TestingDecorationService extends lifecycle_1.Disposable {
        constructor(codeEditorService, configurationService, testService, results, instantiationService, modelService) {
            super();
            this.configurationService = configurationService;
            this.testService = testService;
            this.results = results;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.generation = 0;
            this.changeEmitter = new event_1.Emitter();
            this.decorationCache = new map_1.ResourceMap();
            /**
             * List of messages that should be hidden because an editor changed their
             * underlying ranges. I think this is good enough, because:
             *  - Message decorations are never shown across reloads; this does not
             *    need to persist
             *  - Message instances are stable for any completed test results for
             *    the duration of the session.
             */
            this.invalidatedMessages = new WeakSet();
            /** @inheritdoc */
            this.onDidChange = this.changeEmitter.event;
            codeEditorService.registerDecorationType('test-message-decoration', TestMessageDecoration.decorationId, {}, undefined);
            this._register(modelService.onModelRemoved(e => this.decorationCache.delete(e.uri)));
            const debounceInvalidate = this._register(new async_1.RunOnceScheduler(() => this.invalidate(), 100));
            // If ranges were updated in the document, mark that we should explicitly
            // sync decorations to the published lines, since we assume that everything
            // is up to date. This prevents issues, as in #138632, #138835, #138922.
            this._register(this.testService.onWillProcessDiff(diff => {
                for (const entry of diff) {
                    if (entry.op !== 2 /* TestDiffOpType.DocumentSynced */) {
                        continue;
                    }
                    const rec = this.decorationCache.get(entry.uri);
                    if (rec) {
                        rec.rangeUpdateVersionId = entry.docv;
                    }
                }
                if (!debounceInvalidate.isScheduled()) {
                    debounceInvalidate.schedule();
                }
            }));
            this._register(event_1.Event.any(this.results.onResultsChanged, this.results.onTestChanged, this.testService.excluded.onTestExclusionsChanged, this.testService.showInlineOutput.onDidChange, event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration("testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */)))(() => {
                if (!debounceInvalidate.isScheduled()) {
                    debounceInvalidate.schedule();
                }
            }));
            this._register(editorLineNumberMenu_1.GutterActionsRegistry.registerGutterActionsGenerator((context, result) => {
                const model = context.editor.getModel();
                const testingDecorations = TestingDecorations.get(context.editor);
                if (!model || !testingDecorations?.currentUri) {
                    return;
                }
                const currentDecorations = this.syncDecorations(testingDecorations.currentUri);
                if (!currentDecorations.size) {
                    return;
                }
                const modelDecorations = model.getLinesDecorations(context.lineNumber, context.lineNumber);
                for (const { id } of modelDecorations) {
                    const decoration = currentDecorations.getById(id);
                    if (decoration) {
                        const { object: actions } = decoration.getContextMenuActions();
                        for (const action of actions) {
                            result.push(action, '1_testing');
                        }
                    }
                }
            }));
        }
        /** @inheritdoc */
        invalidateResultMessage(message) {
            this.invalidatedMessages.add(message);
            this.invalidate();
        }
        /** @inheritdoc */
        syncDecorations(resource) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return new CachedDecorations();
            }
            const cached = this.decorationCache.get(resource);
            if (cached && cached.generation === this.generation && (cached.rangeUpdateVersionId === undefined || cached.rangeUpdateVersionId !== model.getVersionId())) {
                return cached.value;
            }
            return this.applyDecorations(model);
        }
        /** @inheritdoc */
        getDecoratedTestPosition(resource, testId) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return undefined;
            }
            const decoration = iterator_1.Iterable.find(this.syncDecorations(resource), v => v instanceof RunTestDecoration && v.isForTest(testId));
            if (!decoration) {
                return undefined;
            }
            // decoration is collapsed, so the range is meaningless; only position matters.
            return model.getDecorationRange(decoration.id)?.getStartPosition();
        }
        invalidate() {
            this.generation++;
            this.changeEmitter.fire();
        }
        /**
         * Applies the current set of test decorations to the given text model.
         */
        applyDecorations(model) {
            const gutterEnabled = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */);
            const uriStr = model.uri.toString();
            const cached = this.decorationCache.get(model.uri);
            const testRangesUpdated = cached?.rangeUpdateVersionId === model.getVersionId();
            const lastDecorations = cached?.value ?? new CachedDecorations();
            const newDecorations = model.changeDecorations(accessor => {
                const newDecorations = new CachedDecorations();
                const runDecorations = new testingDecorations_1.TestDecorations();
                for (const test of this.testService.collection.getNodeByUrl(model.uri)) {
                    if (!test.item.range) {
                        continue;
                    }
                    const stateLookup = this.results.getStateById(test.item.extId);
                    const line = test.item.range.startLineNumber;
                    runDecorations.push({ line, id: '', test, resultItem: stateLookup?.[1] });
                }
                for (const [line, tests] of runDecorations.lines()) {
                    const multi = tests.length > 1;
                    let existing = lastDecorations.getForExactTests(tests.map(t => t.test.item.extId));
                    // see comment in the constructor for what's going on here
                    if (existing && testRangesUpdated && model.getDecorationRange(existing.id)?.startLineNumber !== line) {
                        existing = undefined;
                    }
                    if (existing) {
                        if (existing.replaceOptions(tests, gutterEnabled)) {
                            accessor.changeDecorationOptions(existing.id, existing.editorDecoration.options);
                        }
                        newDecorations.addTest(existing);
                    }
                    else {
                        newDecorations.addTest(multi
                            ? this.instantiationService.createInstance(MultiRunTestDecoration, tests, gutterEnabled, model)
                            : this.instantiationService.createInstance(RunSingleTestDecoration, tests[0].test, tests[0].resultItem, model, gutterEnabled));
                    }
                }
                const messageLines = new Set();
                if ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.showAllMessages" /* TestingConfigKeys.ShowAllMessages */)) {
                    this.results.results.forEach(lastResult => this.applyDecorationsFromResult(lastResult, messageLines, uriStr, lastDecorations, model, newDecorations));
                }
                else {
                    this.applyDecorationsFromResult(this.results.results[0], messageLines, uriStr, lastDecorations, model, newDecorations);
                }
                const saveFromRemoval = new Set();
                for (const decoration of newDecorations) {
                    if (decoration.id === '') {
                        decoration.id = accessor.addDecoration(decoration.editorDecoration.range, decoration.editorDecoration.options);
                    }
                    else {
                        saveFromRemoval.add(decoration.id);
                    }
                }
                for (const decoration of lastDecorations) {
                    if (!saveFromRemoval.has(decoration.id)) {
                        accessor.removeDecoration(decoration.id);
                    }
                }
                this.decorationCache.set(model.uri, {
                    generation: this.generation,
                    rangeUpdateVersionId: cached?.rangeUpdateVersionId,
                    value: newDecorations,
                });
                return newDecorations;
            });
            return newDecorations || lastDecorations;
        }
        applyDecorationsFromResult(lastResult, messageLines, uriStr, lastDecorations, model, newDecorations) {
            if (this.testService.showInlineOutput.value && lastResult instanceof testResult_1.LiveTestResult) {
                for (const task of lastResult.tasks) {
                    for (const m of task.otherMessages) {
                        if (!this.invalidatedMessages.has(m) && m.location?.uri.toString() === uriStr) {
                            const decoration = lastDecorations.getMessage(m) || this.instantiationService.createInstance(TestMessageDecoration, m, undefined, model);
                            newDecorations.addMessage(decoration);
                        }
                    }
                }
                for (const test of lastResult.tests) {
                    for (let taskId = 0; taskId < test.tasks.length; taskId++) {
                        const state = test.tasks[taskId];
                        // push error decorations first so they take precedence over normal output
                        for (const kind of [0 /* TestMessageType.Error */, 1 /* TestMessageType.Output */]) {
                            for (let i = 0; i < state.messages.length; i++) {
                                const m = state.messages[i];
                                if (m.type !== kind || this.invalidatedMessages.has(m) || m.location?.uri.toString() !== uriStr) {
                                    continue;
                                }
                                // Only add one message per line number. Overlapping messages
                                // don't appear well, and the peek will show all of them (#134129)
                                const line = m.location.range.startLineNumber;
                                if (!messageLines.has(line)) {
                                    const decoration = lastDecorations.getMessage(m) || this.instantiationService.createInstance(TestMessageDecoration, m, (0, testingUri_1.buildTestUri)({
                                        type: 3 /* TestUriType.ResultActualOutput */,
                                        messageIndex: i,
                                        taskIndex: taskId,
                                        resultId: lastResult.id,
                                        testExtId: test.item.extId,
                                    }), model);
                                    newDecorations.addMessage(decoration);
                                    messageLines.add(line);
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    exports.TestingDecorationService = TestingDecorationService;
    exports.TestingDecorationService = TestingDecorationService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, testService_1.ITestService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, model_2.IModelService)
    ], TestingDecorationService);
    let TestingDecorations = class TestingDecorations extends lifecycle_1.Disposable {
        /**
         * Gets the decorations associated with the given code editor.
         */
        static get(editor) {
            return editor.getContribution("editor.contrib.testingDecorations" /* Testing.DecorationsContributionId */);
        }
        get currentUri() { return this._currentUri; }
        constructor(editor, codeEditorService, testService, decorations, uriIdentityService) {
            super();
            this.editor = editor;
            this.codeEditorService = codeEditorService;
            this.testService = testService;
            this.decorations = decorations;
            this.uriIdentityService = uriIdentityService;
            this.expectedWidget = new lifecycle_1.MutableDisposable();
            this.actualWidget = new lifecycle_1.MutableDisposable();
            codeEditorService.registerDecorationType('test-message-decoration', TestMessageDecoration.decorationId, {}, undefined, editor);
            this.attachModel(editor.getModel()?.uri);
            this._register(decorations.onDidChange(() => {
                if (this._currentUri) {
                    decorations.syncDecorations(this._currentUri);
                }
            }));
            this._register(this.editor.onDidChangeModel(e => this.attachModel(e.newModelUrl || undefined)));
            this._register(this.editor.onMouseDown(e => {
                if (e.target.position && this.currentUri) {
                    const modelDecorations = editor.getModel()?.getLineDecorations(e.target.position.lineNumber) ?? [];
                    if (!modelDecorations.length) {
                        return;
                    }
                    const cache = decorations.syncDecorations(this.currentUri);
                    for (const { id } of modelDecorations) {
                        if (cache.getById(id)?.click(e)) {
                            e.event.stopPropagation();
                            return;
                        }
                    }
                }
            }));
            this._register(event_1.Event.accumulate(this.editor.onDidChangeModelContent, 0, this._store)(evts => {
                const model = editor.getModel();
                if (!this._currentUri || !model) {
                    return;
                }
                const currentDecorations = decorations.syncDecorations(this._currentUri);
                if (!currentDecorations.size) {
                    return;
                }
                for (const e of evts) {
                    for (const change of e.changes) {
                        const modelDecorations = model.getLinesDecorations(change.range.startLineNumber, change.range.endLineNumber);
                        for (const { id } of modelDecorations) {
                            const decoration = currentDecorations.getById(id);
                            if (decoration instanceof TestMessageDecoration) {
                                decorations.invalidateResultMessage(decoration.testMessage);
                            }
                        }
                    }
                }
            }));
            const updateFontFamilyVar = () => {
                this.editor.getContainerDomNode().style.setProperty('--testMessageDecorationFontFamily', editor.getOption(49 /* EditorOption.fontFamily */));
                this.editor.getContainerDomNode().style.setProperty('--testMessageDecorationFontSize', `${editor.getOption(52 /* EditorOption.fontSize */)}px`);
            };
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(49 /* EditorOption.fontFamily */)) {
                    updateFontFamilyVar();
                }
            }));
            updateFontFamilyVar();
        }
        attachModel(uri) {
            switch (uri && (0, testingUri_1.parseTestUri)(uri)?.type) {
                case 4 /* TestUriType.ResultExpectedOutput */:
                    this.expectedWidget.value = new ExpectedLensContentWidget(this.editor);
                    this.actualWidget.clear();
                    break;
                case 3 /* TestUriType.ResultActualOutput */:
                    this.expectedWidget.clear();
                    this.actualWidget.value = new ActualLensContentWidget(this.editor);
                    break;
                default:
                    this.expectedWidget.clear();
                    this.actualWidget.clear();
            }
            if (isOriginalInDiffEditor(this.codeEditorService, this.editor)) {
                uri = undefined;
            }
            this._currentUri = uri;
            if (!uri) {
                return;
            }
            this.decorations.syncDecorations(uri);
            (async () => {
                for await (const _test of (0, testService_1.testsInFile)(this.testService, this.uriIdentityService, uri, false)) {
                    // consume the iterator so that all tests in the file get expanded. Or
                    // at least until the URI changes. If new items are requested, changes
                    // will be trigged in the `onDidProcessDiff` callback.
                    if (this._currentUri !== uri) {
                        break;
                    }
                }
            })();
        }
    };
    exports.TestingDecorations = TestingDecorations;
    exports.TestingDecorations = TestingDecorations = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, testService_1.ITestService),
        __param(3, testingDecorations_1.ITestingDecorationsService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TestingDecorations);
    const collapseRange = (originalRange) => ({
        startLineNumber: originalRange.startLineNumber,
        endLineNumber: originalRange.startLineNumber,
        startColumn: originalRange.startColumn,
        endColumn: originalRange.startColumn,
    });
    const createRunTestDecoration = (tests, states, visible) => {
        const range = tests[0]?.item.range;
        if (!range) {
            throw new Error('Test decorations can only be created for tests with a range');
        }
        if (!visible) {
            return { range: collapseRange(range), options: { isWholeLine: true, description: 'run-test-decoration' } };
        }
        let computedState = 0 /* TestResultState.Unset */;
        const hoverMessageParts = [];
        let testIdWithMessages;
        let retired = false;
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const resultItem = states[i];
            const state = resultItem?.computedState ?? 0 /* TestResultState.Unset */;
            if (hoverMessageParts.length < 10) {
                hoverMessageParts.push((0, constants_1.labelForTestInState)(test.item.label, state));
            }
            computedState = (0, testingStates_1.maxPriority)(computedState, state);
            retired = retired || !!resultItem?.retired;
            if (!testIdWithMessages && resultItem?.tasks.some(t => t.messages.length)) {
                testIdWithMessages = test.item.extId;
            }
        }
        const hasMultipleTests = tests.length > 1 || tests[0].children.size > 0;
        const icon = computedState === 0 /* TestResultState.Unset */
            ? (hasMultipleTests ? icons_1.testingRunAllIcon : icons_1.testingRunIcon)
            : icons_1.testingStatesToIcons.get(computedState);
        let hoverMessage;
        let glyphMarginClassName = themables_1.ThemeIcon.asClassName(icon) + ' testing-run-glyph';
        if (retired) {
            glyphMarginClassName += ' retired';
        }
        return {
            range: collapseRange(range),
            options: {
                description: 'run-test-decoration',
                showIfCollapsed: true,
                get hoverMessage() {
                    if (!hoverMessage) {
                        const building = hoverMessage = new htmlContent_1.MarkdownString('', true).appendText(hoverMessageParts.join(', ') + '.');
                        if (testIdWithMessages) {
                            const args = encodeURIComponent(JSON.stringify([testIdWithMessages]));
                            building.appendMarkdown(` [${(0, nls_1.localize)('peekTestOutout', 'Peek Test Output')}](command:vscode.peekTestError?${args})`);
                        }
                    }
                    return hoverMessage;
                },
                glyphMargin: { position: GLYPH_MARGIN_LANE },
                glyphMarginClassName,
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                zIndex: 10000,
            }
        };
    };
    var LensContentWidgetVars;
    (function (LensContentWidgetVars) {
        LensContentWidgetVars["FontFamily"] = "testingDiffLensFontFamily";
        LensContentWidgetVars["FontFeatures"] = "testingDiffLensFontFeatures";
    })(LensContentWidgetVars || (LensContentWidgetVars = {}));
    class TitleLensContentWidget {
        constructor(editor) {
            this.editor = editor;
            /** @inheritdoc */
            this.allowEditorOverflow = false;
            /** @inheritdoc */
            this.suppressMouseDown = true;
            this._domNode = dom.$('span');
            queueMicrotask(() => {
                this.applyStyling();
                this.editor.addContentWidget(this);
            });
        }
        applyStyling() {
            let fontSize = this.editor.getOption(19 /* EditorOption.codeLensFontSize */);
            let height;
            if (!fontSize || fontSize < 5) {
                fontSize = (this.editor.getOption(52 /* EditorOption.fontSize */) * .9) | 0;
                height = this.editor.getOption(67 /* EditorOption.lineHeight */);
            }
            else {
                height = (fontSize * Math.max(1.3, this.editor.getOption(67 /* EditorOption.lineHeight */) / this.editor.getOption(52 /* EditorOption.fontSize */))) | 0;
            }
            const editorFontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            const node = this._domNode;
            node.classList.add('testing-diff-lens-widget');
            node.textContent = this.getText();
            node.style.lineHeight = `${height}px`;
            node.style.fontSize = `${fontSize}px`;
            node.style.fontFamily = `var(--${"testingDiffLensFontFamily" /* LensContentWidgetVars.FontFamily */})`;
            node.style.fontFeatureSettings = `var(--${"testingDiffLensFontFeatures" /* LensContentWidgetVars.FontFeatures */})`;
            const containerStyle = this.editor.getContainerDomNode().style;
            containerStyle.setProperty("testingDiffLensFontFamily" /* LensContentWidgetVars.FontFamily */, this.editor.getOption(18 /* EditorOption.codeLensFontFamily */) ?? 'inherit');
            containerStyle.setProperty("testingDiffLensFontFeatures" /* LensContentWidgetVars.FontFeatures */, editorFontInfo.fontFeatureSettings);
            this.editor.changeViewZones(accessor => {
                if (this.viewZoneId) {
                    accessor.removeZone(this.viewZoneId);
                }
                this.viewZoneId = accessor.addZone({
                    afterLineNumber: 0,
                    afterColumn: 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                    domNode: document.createElement('div'),
                    heightInPx: 20,
                });
            });
        }
        /** @inheritdoc */
        getDomNode() {
            return this._domNode;
        }
        /** @inheritdoc */
        dispose() {
            this.editor.changeViewZones(accessor => {
                if (this.viewZoneId) {
                    accessor.removeZone(this.viewZoneId);
                }
            });
            this.editor.removeContentWidget(this);
        }
        /** @inheritdoc */
        getPosition() {
            return {
                position: { column: 0, lineNumber: 0 },
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */],
            };
        }
    }
    class ExpectedLensContentWidget extends TitleLensContentWidget {
        getId() {
            return 'expectedTestingLens';
        }
        getText() {
            return (0, nls_1.localize)('expected.title', 'Expected');
        }
    }
    class ActualLensContentWidget extends TitleLensContentWidget {
        getId() {
            return 'actualTestingLens';
        }
        getText() {
            return (0, nls_1.localize)('actual.title', 'Actual');
        }
    }
    let RunTestDecoration = class RunTestDecoration {
        get line() {
            return this.editorDecoration.range.startLineNumber;
        }
        get testIds() {
            return this.tests.map(t => t.test.item.extId);
        }
        constructor(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService) {
            this.tests = tests;
            this.visible = visible;
            this.model = model;
            this.codeEditorService = codeEditorService;
            this.testService = testService;
            this.contextMenuService = contextMenuService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.testProfileService = testProfileService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            /** @inheritdoc */
            this.id = '';
            this.displayedStates = tests.map(t => t.resultItem?.computedState);
            this.editorDecoration = createRunTestDecoration(tests.map(t => t.test), tests.map(t => t.resultItem), visible);
            this.editorDecoration.options.glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(this.getGutterLabel());
        }
        /** @inheritdoc */
        click(e) {
            if (e.target.type !== 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */
                || e.target.detail.glyphMarginLane !== GLYPH_MARGIN_LANE
                // handled by editor gutter context menu
                || e.event.rightButton
                || platform_1.isMacintosh && e.event.leftButton && e.event.ctrlKey) {
                return false;
            }
            const alternateAction = e.event.altKey;
            switch ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */)) {
                case "contextMenu" /* DefaultGutterClickAction.ContextMenu */:
                    this.showContextMenu(e);
                    break;
                case "debug" /* DefaultGutterClickAction.Debug */:
                    this.runWith(alternateAction ? 2 /* TestRunProfileBitset.Run */ : 4 /* TestRunProfileBitset.Debug */);
                    break;
                case "runWithCoverage" /* DefaultGutterClickAction.Coverage */:
                    this.runWith(alternateAction ? 4 /* TestRunProfileBitset.Debug */ : 8 /* TestRunProfileBitset.Coverage */);
                    break;
                case "run" /* DefaultGutterClickAction.Run */:
                default:
                    this.runWith(alternateAction ? 4 /* TestRunProfileBitset.Debug */ : 2 /* TestRunProfileBitset.Run */);
                    break;
            }
            return true;
        }
        /**
         * Updates the decoration to match the new set of tests.
         * @returns true if options were changed, false otherwise
         */
        replaceOptions(newTests, visible) {
            const displayedStates = newTests.map(t => t.resultItem?.computedState);
            if (visible === this.visible && (0, arrays_1.equals)(this.displayedStates, displayedStates)) {
                return false;
            }
            this.tests = newTests;
            this.displayedStates = displayedStates;
            this.visible = visible;
            this.editorDecoration.options = createRunTestDecoration(newTests.map(t => t.test), newTests.map(t => t.resultItem), visible).options;
            this.editorDecoration.options.glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(this.getGutterLabel());
            return true;
        }
        /**
         * Gets whether this decoration serves as the run button for the given test ID.
         */
        isForTest(testId) {
            return this.tests.some(t => t.test.item.extId === testId);
        }
        runWith(profile) {
            return this.testService.runTests({
                tests: this.tests.map(({ test }) => test),
                group: profile,
            });
        }
        showContextMenu(e) {
            const editor = this.codeEditorService.listCodeEditors().find(e => e.getModel() === this.model);
            editor?.getContribution(editorLineNumberMenu_1.EditorLineNumberContextMenu.ID)?.show(e);
        }
        getGutterLabel() {
            switch ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */)) {
                case "contextMenu" /* DefaultGutterClickAction.ContextMenu */:
                    return (0, nls_1.localize)('testing.gutterMsg.contextMenu', 'Click for test options');
                case "debug" /* DefaultGutterClickAction.Debug */:
                    return (0, nls_1.localize)('testing.gutterMsg.debug', 'Click to debug tests, right click for more options');
                case "runWithCoverage" /* DefaultGutterClickAction.Coverage */:
                    return (0, nls_1.localize)('testing.gutterMsg.coverage', 'Click to run tests with coverage, right click for more options');
                case "run" /* DefaultGutterClickAction.Run */:
                default:
                    return (0, nls_1.localize)('testing.gutterMsg.run', 'Click to run tests, right click for more options');
            }
        }
        /**
         * Gets context menu actions relevant for a singel test.
         */
        getTestContextMenuActions(test, resultItem) {
            const testActions = [];
            const capabilities = this.testProfileService.capabilitiesForTest(test);
            [
                { bitset: 2 /* TestRunProfileBitset.Run */, label: (0, nls_1.localize)('run test', 'Run Test') },
                { bitset: 4 /* TestRunProfileBitset.Debug */, label: (0, nls_1.localize)('debug test', 'Debug Test') },
                { bitset: 8 /* TestRunProfileBitset.Coverage */, label: (0, nls_1.localize)('coverage test', 'Run with Coverage') },
            ].forEach(({ bitset, label }) => {
                if (capabilities & bitset) {
                    testActions.push(new actions_1.Action(`testing.gutter.${bitset}`, label, undefined, undefined, () => this.testService.runTests({ group: bitset, tests: [test] })));
                }
            });
            if (capabilities & 16 /* TestRunProfileBitset.HasNonDefaultProfile */) {
                testActions.push(new actions_1.Action('testing.runUsing', (0, nls_1.localize)('testing.runUsing', 'Execute Using Profile...'), undefined, undefined, async () => {
                    const profile = await this.commandService.executeCommand('vscode.pickTestProfile', { onlyForTest: test });
                    if (!profile) {
                        return;
                    }
                    this.testService.runResolvedTests({
                        targets: [{
                                profileGroup: profile.group,
                                profileId: profile.profileId,
                                controllerId: profile.controllerId,
                                testIds: [test.item.extId]
                            }]
                    });
                }));
            }
            if (resultItem && (0, testingStates_1.isFailedState)(resultItem.computedState)) {
                testActions.push(new actions_1.Action('testing.gutter.peekFailure', (0, nls_1.localize)('peek failure', 'Peek Error'), undefined, undefined, () => this.commandService.executeCommand('vscode.peekTestError', test.item.extId)));
            }
            testActions.push(new actions_1.Action('testing.gutter.reveal', (0, nls_1.localize)('reveal test', 'Reveal in Test Explorer'), undefined, undefined, () => this.commandService.executeCommand('_revealTestInExplorer', test.item.extId)));
            const contributed = this.getContributedTestActions(test, capabilities);
            return { object: actions_1.Separator.join(testActions, contributed), dispose() { } };
        }
        getContributedTestActions(test, capabilities) {
            const contextOverlay = this.contextKeyService.createOverlay((0, testItemContextOverlay_1.getTestItemContextOverlay)(test, capabilities));
            const menu = this.menuService.createMenu(actions_2.MenuId.TestItemGutter, contextOverlay);
            try {
                const target = [];
                const arg = (0, testService_1.getContextForTestItem)(this.testService.collection, test.item.extId);
                (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true, arg }, target);
                return target;
            }
            finally {
                menu.dispose();
            }
        }
    };
    RunTestDecoration = __decorate([
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, testService_1.ITestService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testProfileService_1.ITestProfileService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService)
    ], RunTestDecoration);
    let MultiRunTestDecoration = class MultiRunTestDecoration extends RunTestDecoration {
        constructor(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService, quickInputService) {
            super(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService);
            this.quickInputService = quickInputService;
        }
        getContextMenuActions() {
            const allActions = [];
            [
                { bitset: 2 /* TestRunProfileBitset.Run */, label: (0, nls_1.localize)('run all test', 'Run All Tests') },
                { bitset: 8 /* TestRunProfileBitset.Coverage */, label: (0, nls_1.localize)('run all test with coverage', 'Run All Tests with Coverage') },
                { bitset: 4 /* TestRunProfileBitset.Debug */, label: (0, nls_1.localize)('debug all test', 'Debug All Tests') },
            ].forEach(({ bitset, label }, i) => {
                const canRun = this.tests.some(({ test }) => this.testProfileService.capabilitiesForTest(test) & bitset);
                if (canRun) {
                    allActions.push(new actions_1.Action(`testing.gutter.run${i}`, label, undefined, undefined, () => this.runWith(bitset)));
                }
            });
            const testItems = this.tests.map((testItem) => ({
                currentLabel: testItem.test.item.label,
                testItem,
                parent: testId_1.TestId.fromString(testItem.test.item.extId).parentId,
            }));
            const getLabelConflicts = (tests) => {
                const labelCount = new Map();
                for (const test of tests) {
                    labelCount.set(test.currentLabel, (labelCount.get(test.currentLabel) || 0) + 1);
                }
                return tests.filter(e => labelCount.get(e.currentLabel) > 1);
            };
            let conflicts, hasParent = true;
            while ((conflicts = getLabelConflicts(testItems)).length && hasParent) {
                for (const conflict of conflicts) {
                    if (conflict.parent) {
                        const parent = this.testService.collection.getNodeById(conflict.parent.toString());
                        conflict.currentLabel = parent?.item.label + ' > ' + conflict.currentLabel;
                        conflict.parent = conflict.parent.parentId;
                    }
                    else {
                        hasParent = false;
                    }
                }
            }
            testItems.sort((a, b) => {
                const ai = a.testItem.test.item;
                const bi = b.testItem.test.item;
                return (ai.sortText || ai.label).localeCompare(bi.sortText || bi.label);
            });
            const disposable = new lifecycle_1.DisposableStore();
            let testSubmenus = testItems.map(({ currentLabel, testItem }) => {
                const actions = this.getTestContextMenuActions(testItem.test, testItem.resultItem);
                disposable.add(actions);
                let label = (0, iconLabels_1.stripIcons)(currentLabel);
                const lf = label.indexOf('\n');
                if (lf !== -1) {
                    label = label.slice(0, lf);
                }
                return new actions_1.SubmenuAction(testItem.test.item.extId, label, actions.object);
            });
            const overflow = testSubmenus.length - MAX_TESTS_IN_SUBMENU;
            if (overflow > 0) {
                testSubmenus = testSubmenus.slice(0, MAX_TESTS_IN_SUBMENU);
                testSubmenus.push(new actions_1.Action('testing.gutter.overflow', (0, nls_1.localize)('testOverflowItems', '{0} more tests...', overflow), undefined, undefined, () => this.pickAndRun(testItems)));
            }
            return { object: actions_1.Separator.join(allActions, testSubmenus), dispose: () => disposable.dispose() };
        }
        async pickAndRun(testItems) {
            const doPick = (items, title) => new Promise(resolve => {
                const pick = this.quickInputService.createQuickPick();
                pick.placeholder = title;
                pick.items = items;
                pick.onDidHide(() => {
                    resolve(undefined);
                    pick.dispose();
                });
                pick.onDidAccept(() => {
                    resolve(pick.selectedItems[0]);
                    pick.dispose();
                });
                pick.show();
            });
            const item = await doPick(testItems.map(({ currentLabel, testItem }) => ({ label: currentLabel, test: testItem.test, result: testItem.resultItem })), (0, nls_1.localize)('selectTestToRun', 'Select a test to run'));
            if (!item) {
                return;
            }
            const actions = this.getTestContextMenuActions(item.test, item.result);
            try {
                (await doPick(actions.object, item.label))?.run();
            }
            finally {
                actions.dispose();
            }
        }
    };
    MultiRunTestDecoration = __decorate([
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, testService_1.ITestService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testProfileService_1.ITestProfileService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService),
        __param(11, quickInput_1.IQuickInputService)
    ], MultiRunTestDecoration);
    let RunSingleTestDecoration = class RunSingleTestDecoration extends RunTestDecoration {
        constructor(test, resultItem, model, visible, codeEditorService, testService, commandService, contextMenuService, configurationService, testProfiles, contextKeyService, menuService) {
            super([{ test, resultItem }], visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfiles, contextKeyService, menuService);
        }
        getContextMenuActions() {
            return this.getTestContextMenuActions(this.tests[0].test, this.tests[0].resultItem);
        }
    };
    RunSingleTestDecoration = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, testService_1.ITestService),
        __param(6, commands_1.ICommandService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, testProfileService_1.ITestProfileService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, actions_2.IMenuService)
    ], RunSingleTestDecoration);
    const lineBreakRe = /\r?\n\s*/g;
    let TestMessageDecoration = class TestMessageDecoration {
        static { TestMessageDecoration_1 = this; }
        static { this.inlineClassName = 'test-message-inline-content'; }
        static { this.decorationId = `testmessage-${(0, uuid_1.generateUuid)()}`; }
        constructor(testMessage, messageUri, textModel, peekOpener, editorService) {
            this.testMessage = testMessage;
            this.messageUri = messageUri;
            this.peekOpener = peekOpener;
            this.id = '';
            this.contentIdClass = `test-message-inline-content-id${(0, uuid_1.generateUuid)()}`;
            this.location = testMessage.location;
            this.line = this.location.range.startLineNumber;
            const severity = testMessage.type;
            const message = testMessage.message;
            const options = editorService.resolveDecorationOptions(TestMessageDecoration_1.decorationId, true);
            options.hoverMessage = typeof message === 'string' ? new htmlContent_1.MarkdownString().appendText(message) : message;
            options.zIndex = 10; // todo: in spite of the z-index, this appears behind gitlens
            options.className = `testing-inline-message-severity-${severity}`;
            options.isWholeLine = true;
            options.stickiness = 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
            options.collapseOnReplaceEdit = true;
            let inlineText = (0, testMessageColorizer_1.renderTestMessageAsText)(message).replace(lineBreakRe, ' ');
            if (inlineText.length > MAX_INLINE_MESSAGE_LENGTH) {
                inlineText = inlineText.slice(0, MAX_INLINE_MESSAGE_LENGTH - 1) + '…';
            }
            options.after = {
                content: ' '.repeat(4) + inlineText,
                inlineClassName: `test-message-inline-content test-message-inline-content-s${severity} ${this.contentIdClass} ${messageUri ? 'test-message-inline-content-clickable' : ''}`
            };
            options.showIfCollapsed = true;
            const rulerColor = severity === 0 /* TestMessageType.Error */
                ? editorColorRegistry_1.overviewRulerError
                : editorColorRegistry_1.overviewRulerInfo;
            if (rulerColor) {
                options.overviewRuler = { color: (0, themeService_1.themeColorFromId)(rulerColor), position: model_1.OverviewRulerLane.Right };
            }
            const lineLength = textModel.getLineLength(this.location.range.startLineNumber);
            const column = lineLength ? (lineLength + 1) : this.location.range.endColumn;
            this.editorDecoration = {
                options,
                range: {
                    startLineNumber: this.location.range.startLineNumber,
                    startColumn: column,
                    endColumn: column,
                    endLineNumber: this.location.range.startLineNumber,
                }
            };
        }
        click(e) {
            if (e.event.rightButton) {
                return false;
            }
            if (!this.messageUri) {
                return false;
            }
            if (e.target.element?.className.includes(this.contentIdClass)) {
                this.peekOpener.peekUri(this.messageUri);
            }
            return false;
        }
        getContextMenuActions() {
            return { object: [], dispose: () => { } };
        }
    };
    TestMessageDecoration = TestMessageDecoration_1 = __decorate([
        __param(3, testingPeekOpener_1.ITestingPeekOpener),
        __param(4, codeEditorService_1.ICodeEditorService)
    ], TestMessageDecoration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0RlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9icm93c2VyL3Rlc3RpbmdEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcURoRyxNQUFNLHlCQUF5QixHQUFHLEdBQUcsQ0FBQztJQUN0QyxNQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUNoQyxNQUFNLGlCQUFpQixHQUFHLHVCQUFlLENBQUMsTUFBTSxDQUFDO0lBRWpELFNBQVMsc0JBQXNCLENBQUMsaUJBQXFDLEVBQUUsVUFBdUI7UUFDN0YsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFeEQsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUN0QyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNuRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBT0QsK0ZBQStGO0lBQy9GLE1BQU0saUJBQWlCO1FBQXZCO1lBQ2tCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztZQUNsRCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXVDLENBQUM7UUF5RDVFLENBQUM7UUF2REEsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUNsRCxDQUFDO1FBRUQsMEVBQTBFO1FBQ25FLGdCQUFnQixDQUFDLE9BQWlCO1lBQ3hDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJ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