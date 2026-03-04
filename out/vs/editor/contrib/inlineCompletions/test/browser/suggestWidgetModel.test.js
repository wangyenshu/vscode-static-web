/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/contrib/inlineCompletions/test/browser/utils", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/test/browser/testCodeEditor", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "assert", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/base/common/observable", "vs/base/common/errors", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/base/test/common/utils"], function (require, exports, async_1, event_1, lifecycle_1, mock_1, timeTravelScheduler_1, range_1, editorWorker_1, utils_1, snippetController2_1, suggestController_1, suggestMemory_1, testCodeEditor_1, actions_1, serviceCollection_1, keybinding_1, mockKeybindingService_1, log_1, storage_1, telemetry_1, telemetryUtils_1, assert, label_1, workspace_1, languageFeaturesService_1, languageFeatures_1, inlineCompletionsController_1, observable_1, errors_1, accessibilitySignalService_1, utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Suggest Widget Model', () => {
        (0, utils_2.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            (0, errors_1.setUnexpectedErrorHandler)(function (err) {
                throw err;
            });
        });
        // This test is skipped because the fix for this causes https://github.com/microsoft/vscode/issues/166023
        test.skip('Active', async () => {
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, }, async ({ editor, editorViewModel, context, model }) => {
                let last = undefined;
                const history = new Array();
                const d = (0, observable_1.autorun)(reader => {
                    /** @description debug */
                    const selectedSuggestItem = !!model.selectedSuggestItem.read(reader);
                    if (last !== selectedSuggestItem) {
                        last = selectedSuggestItem;
                        history.push(last);
                    }
                });
                context.keyboardType('h');
                const suggestController = editor.getContribution(suggestController_1.SuggestController.ID);
                suggestController.triggerSuggest();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(history.splice(0), [false, true]);
                context.keyboardType('.');
                await (0, async_1.timeout)(1000);
                // No flicker here
                assert.deepStrictEqual(history.splice(0), []);
                suggestController.cancelSuggestWidget();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(history.splice(0), [false]);
                d.dispose();
            });
        });
        test('Ghost Text', async () => {
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, suggest: { preview: true } }, async ({ editor, editorViewModel, context, model }) => {
                context.keyboardType('h');
                const suggestController = editor.getContribution(suggestController_1.SuggestController.ID);
                suggestController.triggerSuggest();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'h[ello]']);
                context.keyboardType('.');
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['h', 'hello.[hello]']);
                suggestController.cancelSuggestWidget();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['hello.']);
            });
        });
    });
    const provider = {
        _debugDisplayName: 'test',
        triggerCharacters: ['.'],
        async provideCompletionItems(model, pos) {
            const word = model.getWordAtPosition(pos);
            const range = word
                ? { startLineNumber: 1, startColumn: word.startColumn, endLineNumber: 1, endColumn: word.endColumn }
                : range_1.Range.fromPositions(pos);
            return {
                suggestions: [{
                        insertText: 'hello',
                        kind: 18 /* CompletionItemKind.Text */,
                        label: 'hello',
                        range,
                        commitCharacters: ['.'],
                    }]
            };
        },
    };
    async function withAsyncTestCodeEditorAndInlineCompletionsModel(text, options, callback) {
        await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: options.fakeClock }, async () => {
            const disposableStore = new lifecycle_1.DisposableStore();
            try {
                const serviceCollection = new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [log_1.ILogService, new log_1.NullLogService()], [storage_1.IStorageService, disposableStore.add(new storage_1.InMemoryStorageService())], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
                        computeWordRanges() {
                            return Promise.resolve({});
                        }
                    }], [suggestMemory_1.ISuggestMemoryService, new class extends (0, mock_1.mock)() {
                        memorize() { }
                        select() { return 0; }
                    }], [actions_1.IMenuService, new class extends (0, mock_1.mock)() {
                        createMenu() {
                            return new class extends (0, mock_1.mock)() {
                                constructor() {
                                    super(...arguments);
                                    this.onDidChange = event_1.Event.None;
                                }
                                dispose() { }
                            };
                        }
                    }], [label_1.ILabelService, new class extends (0, mock_1.mock)() {
                    }], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                    }], [accessibilitySignalService_1.IAccessibilitySignalService, {
                        playSignal: async () => { },
                        isSoundEnabled(signal) { return false; },
                    }]);
                if (options.provider) {
                    const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
                    serviceCollection.set(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService);
                    disposableStore.add(languageFeaturesService.completionProvider.register({ pattern: '**' }, options.provider));
                }
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(text, { ...options, serviceCollection }, async (editor, editorViewModel, instantiationService) => {
                    editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
                    editor.registerAndInstantiateContribution(suggestController_1.SuggestController.ID, suggestController_1.SuggestController);
                    editor.registerAndInstantiateContribution(inlineCompletionsController_1.InlineCompletionsController.ID, inlineCompletionsController_1.InlineCompletionsController);
                    const model = inlineCompletionsController_1.InlineCompletionsController.get(editor)?.model.get();
                    const context = new utils_1.GhostTextContext(model, editor);
                    await callback({ editor, editorViewModel, model, context });
                    context.dispose();
                });
            }
            finally {
                disposableStore.dispose();
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy90ZXN0L2Jyb3dzZXIvc3VnZ2VzdFdpZGdldE1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQ2hHLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFBLGtDQUF5QixFQUFDLFVBQVUsR0FBRztnQkFDdEMsTUFBTSxHQUFHLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgseUdBQXlHO1FBQ3pHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlCLE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxHQUFHLEVBQzlCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELElBQUksSUFBSSxHQUF3QixTQUFTLENBQUM7Z0JBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksS0FBSyxFQUFXLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxHQUFHLElBQUEsb0JBQU8sRUFBQyxNQUFNLENBQUMsRUFBRTtvQkFDMUIseUJBQXlCO29CQUN6QixNQUFNLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNyRSxJQUFJLElBQUksS0FBSyxtQkFBbUIsRUFB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