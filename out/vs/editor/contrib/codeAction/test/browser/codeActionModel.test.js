/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/languageFeatureRegistry", "vs/editor/contrib/codeAction/browser/codeActionModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/markers/common/markerService"], function (require, exports, assert, async_1, lifecycle_1, types_1, uri_1, timeTravelScheduler_1, languageFeatureRegistry_1, codeActionModel_1, testCodeEditor_1, testTextModel_1, mockKeybindingService_1, markerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const testProvider = {
        provideCodeActions() {
            return {
                actions: [
                    { title: 'test', command: { id: 'test-command', title: 'test', arguments: [] } }
                ],
                dispose() { }
            };
        }
    };
    suite('CodeActionModel', () => {
        const languageId = 'foo-lang';
        const uri = uri_1.URI.parse('untitled:path');
        let model;
        let markerService;
        let editor;
        let registry;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.clear();
            markerService = new markerService_1.MarkerService();
            model = (0, testTextModel_1.createTextModel)('foobar  foo bar\nfarboo far boo', languageId, undefined, uri);
            editor = (0, testCodeEditor_1.createTestCodeEditor)(model);
            editor.setPosition({ lineNumber: 1, column: 1 });
            registry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
        });
        teardown(() => {
            disposables.clear();
            editor.dispose();
            model.dispose();
            markerService.dispose();
        });
        test('Oracle -> marker added', async () => {
            const { promise: donePromise, resolve: done } = (0, async_1.promiseWithResolvers)();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, () => {
                const reg = registry.register(languageId, testProvider);
                disposables.add(reg);
                const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, registry, markerService, contextKeys, undefined));
                disposables.add(model.onDidChangeState((e) => {
                    (0, types_1.assertType)(e.type === 1 /* CodeActionsState.Type.Triggered */);
                    assert.strictEqual(e.trigger.type, 2 /* languages.CodeActionTriggerType.Auto */);
                    assert.ok(e.actions);
                    e.actions.then(fixes => {
                        model.dispose();
                        assert.strictEqual(fixes.validActions.length, 1);
                        done();
                    }, done);
                }));
                // start here
                markerService.changeOne('fake', uri, [{
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                        message: 'error',
                        severity: 1,
                        code: '',
                        source: ''
                    }]);
                return donePromise;
            });
        });
        test('Oracle -> position changed', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, () => {
                const reg = registry.register(languageId, testProvider);
                disposables.add(reg);
                markerService.changeOne('fake', uri, [{
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                        message: 'error',
                        severity: 1,
                        code: '',
                        source: ''
                    }]);
                editor.setPosition({ lineNumber: 2, column: 1 });
                return new Promise((resolve, reject) => {
                    const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                    const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, registry, markerService, contextKeys, undefined));
                    disposables.add(model.onDidChangeState((e) => {
                        (0, types_1.assertType)(e.type === 1 /* CodeActionsState.Type.Triggered */);
                        assert.strictEqual(e.trigger.type, 2 /* languages.CodeActionTriggerType.Auto */);
                        assert.ok(e.actions);
                        e.actions.then(fixes => {
                            model.dispose();
                            assert.strictEqual(fixes.validActions.length, 1);
                            resolve(undefined);
                        }, reject);
                    }));
                    // start here
                    editor.setPosition({ lineNumber: 1, column: 1 });
                });
            });
        });
        test('Oracle -> should only auto trigger once for cursor and marker update right after each other', async () => {
            const { promise: donePromise, resolve: done } = (0, async_1.promiseWithResolvers)();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, () => {
                const reg = registry.register(languageId, testProvider);
                disposables.add(reg);
                let triggerCount = 0;
                const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, registry, markerService, contextKeys, undefined));
                disposables.add(model.onDidChangeState((e) => {
                    (0, types_1.assertType)(e.type === 1 /* CodeActionsState.Type.Triggered */);
                    assert.strictEqual(e.trigger.type, 2 /* languages.CodeActionTriggerType.Auto */);
                    ++triggerCount;
                    // give time for second trigger before completing test
                    setTimeout(() => {
                        model.dispose();
                        assert.strictEqual(triggerCount, 1);
                        done();
                    }, 0);
                }, 5 /*delay*/));
                markerService.changeOne('fake', uri, [{
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                        message: 'error',
                        severity: 1,
                        code: '',
                        source: ''
                    }]);
                editor.setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 4, endColumn: 1 });
                return donePromise;
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbk1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL3Rlc3QvYnJvd3Nlci9jb2RlQWN0aW9uTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsTUFBTSxZQUFZLEdBQUc7UUFDcEIsa0JBQWtCO1lBQ2pCLE9BQU87Z0JBQ04sT0FBTyxFQUFFO29CQUNSLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFO2lCQUNoRjtnQkFDRCxPQUFPLEtBQWUsQ0FBQzthQUN2QixDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUM7SUFFRixLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBRTdCLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM5QixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksS0FBZ0IsQ0FBQztRQUNyQixJQUFJLGFBQTRCLENBQUM7UUFDakMsSUFBSSxNQUFtQixDQUFDO1FBQ3hCLElBQUksUUFBK0QsQ0FBQztRQUNwRSxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BCLGFBQWEsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztZQUNwQyxLQUFLLEdBQUcsSUFBQSwrQkFBZSxFQUFDLGlDQUFpQyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7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