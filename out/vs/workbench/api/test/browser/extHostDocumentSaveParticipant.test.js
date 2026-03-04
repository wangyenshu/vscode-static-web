define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostDocumentSaveParticipant", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostTypes_1, extHostDocumentSaveParticipant_1, testRPCProtocol_1, mock_1, log_1, extensions_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function timeout(n) {
        return new Promise(resolve => setTimeout(resolve, n));
    }
    suite('ExtHostDocumentSaveParticipant', () => {
        const resource = uri_1.URI.parse('foo:bar');
        const mainThreadBulkEdits = new class extends (0, mock_1.mock)() {
        };
        let documents;
        const nullLogService = new log_1.NullLogService();
        setup(() => {
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), new log_1.NullLogService());
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
            documents = new extHostDocuments_1.ExtHostDocuments((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), documentsAndEditors);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('no listeners, no problem', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => assert.ok(true));
        });
        test('event delivery', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let event;
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.ok(event);
                assert.strictEqual(event.reason, extHostTypes_1.TextDocumentSaveReason.Manual);
                assert.strictEqual(typeof event.waitUntil, 'function');
            });
        });
        test('event delivery, immutable', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let event;
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.ok(event);
                assert.throws(() => { event.document = null; });
            });
        });
        test('event delivery, bad listener', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('💀');
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                const [first] = values;
                assert.strictEqual(first, false);
            });
        });
        test('event delivery, bad listener doesn\'t prevent more events', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('💀');
            });
            let event;
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub1.dispose();
                sub2.dispose();
                assert.ok(event);
            });
        });
        test('event delivery, in subscriber order', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let counter = 0;
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                assert.strictEqual(counter++, 0);
            });
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                assert.strictEqual(counter++, 1);
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub1.dispose();
                sub2.dispose();
            });
        });
        test('event delivery, ignore bad listeners', async () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 5, errors: 1 });
            let callCount = 0;
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                callCount += 1;
                throw new Error('boom');
            });
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            sub.dispose();
            assert.strictEqual(callCount, 2);
        });
        test('event delivery, overall timeout', async function () {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 20, errors: 5 });
            // let callCount = 0;
            const calls = [];
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(1);
            });
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(2);
                event.waitUntil(timeout(100));
            });
            const sub3 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(3);
            });
            const values = await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            sub1.dispose();
            sub2.dispose();
            sub3.dispose();
            assert.deepStrictEqual(calls, [1, 2]);
            assert.strictEqual(values.length, 2);
        });
        test('event delivery, waitUntil', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(timeout(10));
                event.waitUntil(timeout(10));
                event.waitUntil(timeout(10));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
            });
        });
        test('event delivery, waitUntil must be called sync', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            assert.throws(() => event.waitUntil(timeout(10)));
                            resolve(undefined);
                        }
                        catch (e) {
                            reject(e);
                        }
                    }, 10);
                }));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
            });
        });
        test('event delivery, waitUntil will timeout', function () {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 5, errors: 3 });
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(timeout(100));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                const [first] = values;
                assert.strictEqual(first, false);
            });
        });
        test('event delivery, waitUntil failure handling', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                e.waitUntil(Promise.reject(new Error('dddd')));
            });
            let event;
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                assert.ok(event);
                sub1.dispose();
                sub2.dispose();
            });
        });
        test('event delivery, pushEdits sync', () => {
            let dto;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_edits) {
                    dto = _edits.value;
                    return Promise.resolve(true);
                }
            });
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.setEndOfLine(extHostTypes_1.EndOfLine.CRLF)]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.strictEqual(dto.edits.length, 2);
                assert.ok(dto.edits[0].textEdit);
                assert.ok(dto.edits[1].textEdit);
            });
        });
        test('event delivery, concurrent change', () => {
            let edits;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_edits) {
                    edits = _edits.value;
                    return Promise.resolve(true);
                }
            });
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // concurrent change from somewhere
                documents.$acceptModelChanged(resource, {
                    changes: [{
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                            rangeOffset: undefined,
                            rangeLength: undefined,
                            text: 'bar'
                        }],
                    eol: undefined,
                    versionId: 2,
                    isRedoing: false,
                    isUndoing: false,
                }, true);
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                assert.strictEqual(edits, undefined);
                assert.strictEqual(values[0], false);
            });
        });
        test('event delivery, two listeners -> two document states', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(dto) {
                    for (const edit of dto.value.edits) {
                        const uri = uri_1.URI.revive(edit.resource);
                        const { text, range } = edit.textEdit;
                        documents.$acceptModelChanged(uri, {
                            changes: [{
                                    range,
                                    text,
                                    rangeOffset: undefined,
                                    rangeLength: undefined,
                                }],
                            eol: undefined,
                            versionId: documents.getDocumentData(uri).version + 1,
                            isRedoing: false,
                            isUndoing: false,
                        }, true);
                        // }
                    }
                    return Promise.resolve(true);
                }
            });
            const document = documents.getDocument(resource);
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // the document state we started with
                assert.strictEqual(document.version, 1);
                assert.strictEqual(document.getText(), 'foo');
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // the document state AFTER the first listener kicked in
                assert.strictEqual(document.version, 2);
                assert.strictEqual(document.getText(), 'barfoo');
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub1.dispose();
                sub2.dispose();
                // the document state AFTER eventing is done
                assert.strictEqual(document.version, 3);
                assert.strictEqual(document.getText(), 'barbarfoo');
            });
        });
        test('Log failing listener', function () {
            let didLogSomething = false;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(new class extends log_1.NullLogService {
                error(message, ...args) {
                    didLogSomething = true;
                }
            }, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('boom');
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.strictEqual(didLogSomething, true);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50U2F2ZVBhcnRpY2lwYW50LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0RG9jdW1lbnRTYXZlUGFydGljaXBhbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFvQkEsU0FBUyxPQUFPLENBQUMsQ0FBUztRQUN6QixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1FBRTVDLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBNEI7U0FBSSxDQUFDO1FBQ25GLElBQUksU0FBMkIsQ0FBQztRQUNoQyxNQUFNLGNBQWMsR0FBRyxJQUFJLG9CQUFjLEVBQUUsQ0FBQztRQUU1QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHVEQUEwQixDQUFDLElBQUEsd0NBQXNCLEVBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQztZQUMvRyxtQkFBbUIsQ0FBQywrQkFBK0IsQ0FBQztnQkFDbkQsY0FBYyxFQUFFLENBQUM7d0JBQ2hCLE9BQU8sRUFBRSxLQUFLO3dCQUNkLFVBQVUsRUFBRSxLQUFLO3dCQUNqQixHQUFHLEVBQUUsUUFBUTt3QkFDYixTQUFTLEVBQUUsQ0FBQzt3QkFDWixLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUM7d0JBQ2QsR0FBRyxFQUFFLElBQUk7cUJBQ1QsQ0FBQzthQUNGLENBQUMsQ0FBQztZQUNILFNBQVMsR0FBRyxJQUFJLG1DQUFnQixDQUFDLElBQUEsd0NBQXNCLEVBQUMsSUFBSSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3ZHLE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkcsSUFBSSxLQUF1QyxDQUFDO1lBQzVDLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDM0YsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUM5RSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN4RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RyxJQUFJLEtBQXVDLENBQUM7WUFDNUMsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUMzRixLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZCxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFJLEtBQUssQ0FBQyxRQUFnQixHQUFHLElBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDM0YsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNsRixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWQsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQztnQkFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyREFBMkQsRUFBRSxHQUFHLEVBQUU7WUFDdEUsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkcsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUM1RixNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxLQUF1QyxDQUFDO1lBQzVDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDNUYsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUM5RSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVmLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7WUFDaEQsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDOUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbEksSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFDL0YsU0FBUyxJQUFJLENBQUMsQ0FBQztnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQztZQUNwRSxNQUFNLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDO1lBQ3BFLE1BQU0sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUM7WUFDcEUsTUFBTSxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQztZQUVwRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLO1lBQzVDLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbkkscUJBQXFCO1lBQ3JCLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztZQUMzQixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLEtBQUs7Z0JBQ2hHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFDaEcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDZCxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxLQUFLO2dCQUNoRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDO1lBQ25GLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RyxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLEtBQUs7Z0JBRS9GLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUosQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0NBQStDLEVBQUUsR0FBRyxFQUFFO1lBQzFELE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFFL0YsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBWSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDMUQsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDZixJQUFJLENBQUM7NEJBQ0osTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ2xELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDcEIsQ0FBQzt3QkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDOzRCQUNaLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDWCxDQUFDO29CQUVGLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDUixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUU7WUFFOUMsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVsSSxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLEtBQUs7Z0JBQy9GLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDbEYsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVkLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDNUYsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksS0FBdUMsQ0FBQztZQUM1QyxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzVGLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDOUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUUzQyxJQUFJLEdBQXNCLENBQUM7WUFDM0IsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUE4QjtnQkFDckksc0JBQXNCLENBQUMsTUFBd0Q7b0JBQzlFLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO29CQUNuQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7YUFDRCxDQUFDLENBQUM7WUFFSCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzNGLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHVCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksdUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHVCQUFRLENBQUMsWUFBWSxDQUFDLHdCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkUsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsRUFBRSxDQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsRUFBRSxDQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBRTlDLElBQUksS0FBd0IsQ0FBQztZQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQThCO2dCQUNySSxzQkFBc0IsQ0FBQyxNQUF3RDtvQkFDOUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQ3JCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFFM0YsbUNBQW1DO2dCQUNuQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFO29CQUN2QyxPQUFPLEVBQUUsQ0FBQzs0QkFDVCxLQUFLLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFOzRCQUM3RSxXQUFXLEVBQUUsU0FBVTs0QkFDdkIsV0FBVyxFQUFFLFNBQVU7NEJBQ3ZCLElBQUksRUFBRSxLQUFLO3lCQUNYLENBQUM7b0JBQ0YsR0FBRyxFQUFFLFNBQVU7b0JBQ2YsU0FBUyxFQUFFLENBQUM7b0JBQ1osU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2lCQUNoQixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVULENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHVCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksdUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUUsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDbEYsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVkLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUVqRSxNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQThCO2dCQUNySSxzQkFBc0IsQ0FBQyxHQUFxRDtvQkFFM0UsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUVwQyxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUF5QixJQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQy9ELE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQTJCLElBQUssQ0FBQyxRQUFRLENBQUM7d0JBQy9ELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7NEJBQ2xDLE9BQU8sRUFBRSxDQUFDO29DQUNULEtBQUs7b0NBQ0wsSUFBSTtvQ0FDSixXQUFXLEVBQUUsU0FBVTtvQ0FDdkIsV0FBVyxFQUFFLFNBQVU7aUNBQ3ZCLENBQUM7NEJBQ0YsR0FBRyxFQUFFLFNBQVU7NEJBQ2YsU0FBUyxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFFLENBQUMsT0FBTyxHQUFHLENBQUM7NEJBQ3RELFNBQVMsRUFBRSxLQUFLOzRCQUNoQixTQUFTLEVBQUUsS0FBSzt5QkFDaEIsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDVCxJQUFJO29CQUNMLENBQUM7b0JBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVqRCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzVGLHFDQUFxQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFOUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSx1QkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RSxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDNUYsd0RBQXdEO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUVqRCxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyx1QkFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLHVCQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVFLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2xGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWYsNENBQTRDO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUosQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDNUIsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQzVCLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsSUFBSSxLQUFNLFNBQVEsb0JBQWM7Z0JBQzdFLEtBQUssQ0FBQyxPQUF1QixFQUFFLEdBQUcsSUFBVztvQkFDckQsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDeEIsQ0FBQzthQUNELEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFHbkMsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUMzRixNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUM5RSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=