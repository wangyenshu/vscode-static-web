/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageService", "vs/editor/common/services/modelService", "vs/editor/common/services/semanticTokensStylingService", "vs/editor/contrib/semanticTokens/browser/documentSemanticTokens", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/log/common/log", "vs/platform/notification/test/common/testNotificationService", "vs/platform/theme/common/theme", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedoService"], function (require, exports, assert, async_1, cancellation_1, event_1, lifecycle_1, mock_1, timeTravelScheduler_1, utils_1, range_1, languageFeatureDebounce_1, languageFeaturesService_1, languageService_1, modelService_1, semanticTokensStylingService_1, documentSemanticTokens_1, getSemanticTokens_1, testLanguageConfigurationService_1, testTextResourcePropertiesService_1, testConfigurationService_1, testDialogService_1, log_1, testNotificationService_1, theme_1, testThemeService_1, undoRedoService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ModelSemanticColoring', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let modelService;
        let languageService;
        let languageFeaturesService;
        setup(() => {
            const configService = new testConfigurationService_1.TestConfigurationService({ editor: { semanticHighlighting: true } });
            const themeService = new testThemeService_1.TestThemeService();
            themeService.setTheme(new testThemeService_1.TestColorTheme({}, theme_1.ColorScheme.DARK, true));
            const logService = new log_1.NullLogService();
            languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
            languageService = disposables.add(new languageService_1.LanguageService(false));
            const semanticTokensStylingService = disposables.add(new semanticTokensStylingService_1.SemanticTokensStylingService(themeService, logService, languageService));
            modelService = disposables.add(new modelService_1.ModelService(configService, new testTextResourcePropertiesService_1.TestTextResourcePropertiesService(configService), new undoRedoService_1.UndoRedoService(new testDialogService_1.TestDialogService(), new testNotificationService_1.TestNotificationService()), languageService, new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const envService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.isBuilt = true;
                    this.isExtensionDevelopment = false;
                }
            };
            disposables.add(new documentSemanticTokens_1.DocumentSemanticTokensFeature(semanticTokensStylingService, modelService, themeService, configService, new languageFeatureDebounce_1.LanguageFeatureDebounceService(logService, envService), languageFeaturesService));
        });
        teardown(() => {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('DocumentSemanticTokens should be fetched when the result is empty if there are pending changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                const inFirstCall = new async_1.Barrier();
                const delayFirstResult = new async_1.Barrier();
                const secondResultProvided = new async_1.Barrier();
                let callCount = 0;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        if (callCount === 1) {
                            assert.ok('called once');
                            inFirstCall.open();
                            await delayFirstResult.wait();
                            await (0, async_1.timeout)(0); // wait for the simple scheduler to fire to check that we do actually get rescheduled
                            return null;
                        }
                        if (callCount === 2) {
                            assert.ok('called twice');
                            secondResultProvided.open();
                            return null;
                        }
                        assert.fail('Unexpected call');
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('Hello world', languageService.createById('testMode')));
                // pretend the text model is attached to an editor (so that semantic tokens are computed)
                textModel.onBeforeAttached();
                // wait for the provider to be called
                await inFirstCall.wait();
                // the provider is now in the provide call
                // change the text buffer while the provider is running
                textModel.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: 'x' }]);
                // let the provider finish its first result
                delayFirstResult.open();
                // we need to check that the provider is called again, even if it returns null
                await secondResultProvided.wait();
                // assert that it got called twice
                assert.strictEqual(callCount, 2);
            });
        });
        test('issue #149412: VS Code hangs when bad semantic token data is received', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                let lastResult = null;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        if (!lastResultId) {
                            // this is the first call
                            lastResult = {
                                resultId: '1',
                                data: new Uint32Array([4294967293, 0, 7, 16, 0, 1, 4, 3, 11, 1])
                            };
                        }
                        else {
                            // this is the second call
                            lastResult = {
                                resultId: '2',
                                edits: [{
                                        start: 4294967276,
                                        deleteCount: 0,
                                        data: new Uint32Array([2, 0, 3, 11, 0])
                                    }]
                            };
                        }
                        return lastResult;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('', languageService.createById('testMode')));
                // pretend the text model is attached to an editor (so that semantic tokens are computed)
                textModel.onBeforeAttached();
                // wait for the semantic tokens to be fetched
                await event_1.Event.toPromise(textModel.onDidChangeTokens);
                assert.strictEqual(lastResult.resultId, '1');
                // edit the text
                textModel.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: 'foo' }]);
                // wait for the semantic tokens to be fetched again
                await event_1.Event.toPromise(textModel.onDidChangeTokens);
                assert.strictEqual(lastResult.resultId, '2');
            });
        });
        test('issue #161573: onDidChangeSemanticTokens doesn\'t consistently trigger provideDocumentSemanticTokens', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                const emitter = new event_1.Emitter();
                let requestCount = 0;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    constructor() {
                        this.onDidChange = emitter.event;
                    }
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        requestCount++;
                        if (requestCount === 1) {
                            await (0, async_1.timeout)(1000);
                            // send a change event
                            emitter.fire();
                            await (0, async_1.timeout)(1000);
                            return null;
                        }
                        return null;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('', languageService.createById('testMode')));
                // pretend the text model is attached to an editor (so that semantic tokens are computed)
                textModel.onBeforeAttached();
                await (0, async_1.timeout)(5000);
                assert.deepStrictEqual(requestCount, 2);
            });
        });
        test('DocumentSemanticTokens should be pick the token provider with actual items', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                let callCount = 0;
                disposables.add(languageService.registerLanguage({ id: 'testMode2' }));
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode2', new class {
                    getLegend() {
                        return { tokenTypes: ['class1'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        // For a secondary request return a different value
                        if (lastResultId) {
                            return {
                                data: new Uint32Array([2, 1, 1, 1, 1, 0, 2, 1, 1, 1])
                            };
                        }
                        return {
                            resultId: '1',
                            data: new Uint32Array([0, 1, 1, 1, 1, 0, 2, 1, 1, 1])
                        };
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode2', new class {
                    getLegend() {
                        return { tokenTypes: ['class2'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        return null;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                function toArr(arr) {
                    const result = [];
                    for (let i = 0; i < arr.length; i++) {
                        result[i] = arr[i];
                    }
                    return result;
                }
                const textModel = modelService.createModel('Hello world 2', languageService.createById('testMode2'));
                try {
                    let result = await (0, getSemanticTokens_1.getDocumentSemanticTokens)(languageFeaturesService.documentSemanticTokensProvider, textModel, null, null, cancellation_1.CancellationToken.None);
                    assert.ok(result, `We should have tokens (1)`);
                    assert.ok(result.tokens, `Tokens are found from multiple providers (1)`);
                    assert.ok((0, getSemanticTokens_1.isSemanticTokens)(result.tokens), `Tokens are full (1)`);
                    assert.ok(result.tokens.resultId, `Token result id found from multiple providers (1)`);
                    assert.deepStrictEqual(toArr(result.tokens.data), [0, 1, 1, 1, 1, 0, 2, 1, 1, 1], `Token data returned for multiple providers (1)`);
                    assert.deepStrictEqual(callCount, 2, `Called both token providers (1)`);
                    assert.deepStrictEqual(result.provider.getLegend(), { tokenTypes: ['class1'], tokenModifiers: [] }, `Legend matches the tokens (1)`);
                    // Make a second request. Make sure we get the secondary value
                    result = await (0, getSemanticTokens_1.getDocumentSemanticTokens)(languageFeaturesService.documentSemanticTokensProvider, textModel, result.provider, result.tokens.resultId, cancellation_1.CancellationToken.None);
                    assert.ok(result, `We should have tokens (2)`);
                    assert.ok(result.tokens, `Tokens are found from multiple providers (2)`);
                    assert.ok((0, getSemanticTokens_1.isSemanticTokens)(result.tokens), `Tokens are full (2)`);
                    assert.ok(!result.tokens.resultId, `Token result id found from multiple providers (2)`);
                    assert.deepStrictEqual(toArr(result.tokens.data), [2, 1, 1, 1, 1, 0, 2, 1, 1, 1], `Token data returned for multiple providers (2)`);
                    assert.deepStrictEqual(callCount, 4, `Called both token providers (2)`);
                    assert.deepStrictEqual(result.provider.getLegend(), { tokenTypes: ['class1'], tokenModifiers: [] }, `Legend matches the tokens (2)`);
                }
                finally {
                    disposables.clear();
                    // Wait for scheduler to finish
                    await (0, async_1.timeout)(0);
                    // Now dispose the text model
                    textModel.dispose();
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTZW1hbnRpY1Rva2Vucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc2VtYW50aWNUb2tlbnMvdGVzdC9icm93c2VyL2RvY3VtZW50U2VtYW50aWNUb2tlbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtDaEcsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUVuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLFlBQTJCLENBQUM7UUFDaEMsSUFBSSxlQUFpQyxDQUFDO1FBQ3RDLElBQUksdUJBQWlELENBQUM7UUFFdEQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sYUFBYSxHQUFHLElBQUksbURBQXdCLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDL0YsTUFBTSxZQUFZLEdBQUcsSUFBSSxtQ0FBZ0IsRUFBRSxDQUFDO1lBQzVDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxpQ0FBYyxDQUFDLEVBQUUsRUFBRSxtQkFBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO1lBQ3hDLHVCQUF1QixHQUFHLElBQUksaURBQXVCLEVBQUUsQ0FBQztZQUN4RCxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlDQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM5RCxNQUFNLDRCQUE0QixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwyREFBNEIsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGVB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