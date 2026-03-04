/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/services/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, event_1, uri_1, mock_1, utils_1, testConfigurationService_1, notebookServiceImpl_1, notebookProvider_1, editorResolverService_1, editorResolverService_2, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookProviderInfoStore', function () {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Can\'t open untitled notebooks in test #119363', function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const store = new notebookServiceImpl_1.NotebookProviderInfoStore(new class extends (0, mock_1.mock)() {
                get() { return ''; }
                store() { }
                getObject() { return {}; }
            }, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidRegisterExtensions = event_1.Event.None;
                }
            }, disposables.add(instantiationService.createInstance(editorResolverService_1.EditorResolverService)), new testConfigurationService_1.TestConfigurationService(), new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidChangeScreenReaderOptimized = event_1.Event.None;
                }
            }, instantiationService, new class extends (0, mock_1.mock)() {
                hasProvider() { return true; }
            }, new class extends (0, mock_1.mock)() {
            }, new class extends (0, mock_1.mock)() {
            });
            disposables.add(store);
            const fooInfo = new notebookProvider_1.NotebookProviderInfo({
                extension: extensions_1.nullExtensionDescription.identifier,
                id: 'foo',
                displayName: 'foo',
                selectors: [{ filenamePattern: '*.foo' }],
                priority: editorResolverService_2.RegisteredEditorPriority.default,
                exclusive: false,
                providerDisplayName: 'foo',
            });
            const barInfo = new notebookProvider_1.NotebookProviderInfo({
                extension: extensions_1.nullExtensionDescription.identifier,
                id: 'bar',
                displayName: 'bar',
                selectors: [{ filenamePattern: '*.bar' }],
                priority: editorResolverService_2.RegisteredEditorPriority.default,
                exclusive: false,
                providerDisplayName: 'bar',
            });
            store.add(fooInfo);
            store.add(barInfo);
            assert.ok(store.get('foo'));
            assert.ok(store.get('bar'));
            assert.ok(!store.get('barfoo'));
            let providers = store.getContributedNotebook(uri_1.URI.parse('file:///test/nb.foo'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === fooInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('file:///test/nb.bar'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === barInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('untitled:///Untitled-1'));
            assert.strictEqual(providers.length, 2);
            assert.strictEqual(providers[0] === fooInfo, true);
            assert.strictEqual(providers[1] === barInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('untitled:///test/nb.bar'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === barInfo, true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZXJ2aWNlSW1wbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rU2VydmljZUltcGwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsS0FBSyxDQUFDLDJCQUEyQixFQUFFO1FBQ2xDLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQWtDLENBQUM7UUFFOUYsSUFBSSxDQUFDLGdEQUFnRCxFQUFFO1lBQ3RELE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbkYsTUFBTSxLQUFLLEdBQUcsSUFBSSwrQ0FBeUIsQ0FDMUMsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQW1CO2dCQUMvQixHQUFHLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixLQUFLLEtBQUssQ0FBQztnQkFDWCxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ25DLEVBQ0QsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXFCO2dCQUF2Qzs7b0JBQ00sNEJBQXVCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztnQkFDL0MsQ0FBQzthQUFBLEVBQ0QsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQyxFQUMzRSxJQUFJLG1EQUF3QixFQUFFLEVBQzlCLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUF5QjtnQkFBM0M7O29CQUNNLHFDQUFnQyxHQUFnQixhQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNyRSxDQUFDO2FBQUEsRUFDRCxvQkFBb0IsRUFD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