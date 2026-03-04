/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/log/common/log", "vs/base/test/common/utils", "vs/workbench/api/common/extHostDocumentContentProviders", "vs/base/common/event", "vs/base/common/async", "vs/base/test/common/timeTravelScheduler"], function (require, exports, assert, uri_1, extHostDocumentsAndEditors_1, testRPCProtocol_1, log_1, utils_1, extHostDocumentContentProviders_1, event_1, async_1, timeTravelScheduler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentContentProvider', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const resource = uri_1.URI.parse('foo:bar');
        let documentContentProvider;
        let mainThreadContentProvider;
        const changes = [];
        setup(() => {
            changes.length = 0;
            mainThreadContentProvider = new class {
                $registerTextContentProvider(handle, scheme) {
                }
                $unregisterTextContentProvider(handle) {
                }
                async $onVirtualDocumentChange(uri, value) {
                    await (0, async_1.timeout)(10);
                    changes.push([uri, value]);
                }
                dispose() {
                    throw new Error('Method not implemented.');
                }
            };
            const ehContext = (0, testRPCProtocol_1.SingleProxyRPCProtocol)(mainThreadContentProvider);
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(ehContext, new log_1.NullLogService());
            documentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        languageId: 'foo',
                        uri: resource,
                        versionId: 1,
                        lines: ['foo'],
                        EOL: '\n',
                    }]
            });
            documentContentProvider = new extHostDocumentContentProviders_1.ExtHostDocumentContentProvider(ehContext, documentsAndEditors, new log_1.NullLogService());
        });
        test('TextDocumentContentProvider drops onDidChange events when they happen quickly #179711', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const emitter = new event_1.Emitter();
                const contents = ['X', 'Y'];
                let counter = 0;
                let stack = 0;
                const d = documentContentProvider.registerTextDocumentContentProvider(resource.scheme, {
                    onDidChange: emitter.event,
                    async provideTextDocumentContent(_uri) {
                        assert.strictEqual(stack, 0);
                        stack++;
                        try {
                            await (0, async_1.timeout)(0);
                            return contents[counter++ % contents.length];
                        }
                        finally {
                            stack--;
                        }
                    }
                });
                emitter.fire(resource);
                emitter.fire(resource);
                await (0, async_1.timeout)(100);
                assert.strictEqual(changes.length, 2);
                assert.strictEqual(changes[0][1], 'X');
                assert.strictEqual(changes[1][1], 'Y');
                d.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50Q29udGVudFByb3ZpZGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0RG9jdW1lbnRDb250ZW50UHJvdmlkZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1FBRTVDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLElBQUksdUJBQXVELENBQUM7UUFDNUQsSUFBSSx5QkFBa0UsQ0FBQztRQUN2RSxNQUFNLE9BQU8sR0FBMEMsRUFBRSxDQUFDO1FBRTFELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFFVixPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUVuQix5QkFBeUIsR0FBRyxJQUFJO2dCQUMvQiw0QkFBNEIsQ0FBQyxNQUFjLEVBQUUsTUFBYztnQkFFM0QsQ0FBQztnQkFDRCw4QkFBOEIsQ0FBQyxNQUFjO2dCQUU3QyxDQUFDO2dCQUNELEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxHQUFrQixFQUFFLEtBQWE7b0JBQy9ELE1BQU0sSUFBQSxlQUFPLEVBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztnQkFDRCxPQUFPO29CQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztnQkFDNUMsQ0FBQzthQUNELENBQUM7WUFFRixNQUFNLFNBQVMsR0FBRyxJQUFBLHdDQUFzQixFQUFDLHlC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