/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/editor/browser/widget/diffEditor/diffProviderFactoryService", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/common/services/model", "vs/editor/test/browser/diff/testDiffProviderFactoryService", "vs/editor/test/browser/testCodeEditor", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/progress/common/progress", "vs/workbench/common/views", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl", "vs/workbench/test/browser/workbenchTestServices", "../../browser/inlineChatSavingService", "../../browser/inlineChatSessionService", "../../browser/inlineChatSessionServiceImpl", "./testWorkerService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatVariables", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/test/common/workbenchTestServices", "vs/platform/workspace/common/workspace", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/platform/hover/browser/hover", "vs/platform/hover/test/browser/nullHoverService", "vs/workbench/contrib/chat/browser/chatVariables", "vs/platform/commands/common/commands", "vs/editor/test/browser/editorTestServices"], function (require, exports, assert, arrays_1, async_1, event_1, lifecycle_1, mock_1, timeTravelScheduler_1, diffProviderFactoryService_1, editOperation_1, range_1, editorWorker_1, model_1, testDiffProviderFactoryService_1, testCodeEditor_1, configuration_1, testConfigurationService_1, contextkey_1, descriptors_1, serviceCollection_1, mockKeybindingService_1, progress_1, views_1, accessibleView_1, chat_1, chatAgents_1, inlineChatController_1, inlineChat_1, inlineChatServiceImpl_1, workbenchTestServices_1, inlineChatSavingService_1, inlineChatSessionService_1, inlineChatSessionServiceImpl_1, testWorkerService_1, extensions_1, chatService_1, chatServiceImpl_1, chatVariables_1, log_1, telemetry_1, telemetryUtils_1, workbenchTestServices_2, workspace_1, viewsService_1, chatSlashCommands_1, chatWidget_1, chatWidgetHistoryService_1, hover_1, nullHoverService_1, chatVariables_2, commands_1, editorTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('InteractiveChatController', function () {
        class TestController extends inlineChatController_1.InlineChatController {
            constructor() {
                super(...arguments);
                this._onDidChangeState = new event_1.Emitter();
                this.onDidChangeState = this._onDidChangeState.event;
                this.states = [];
            }
            static { this.INIT_SEQUENCE = ["CREATE_SESSION" /* State.CREATE_SESSION */, "INIT_UI" /* State.INIT_UI */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]; }
            static { this.INIT_SEQUENCE_AUTO_SEND = [...this.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]; }
            waitFor(states) {
                const actual = [];
                return new Promise((resolve, reject) => {
                    const d = this.onDidChangeState(state => {
                        actual.push(state);
                        if ((0, arrays_1.equals)(states, actual)) {
                            d.dispose();
                            resolve();
                        }
                    });
                    setTimeout(() => {
                        d.dispose();
                        reject(new Error(`timeout, \nEXPECTED: ${states.join('>')}, \nACTUAL  : ${actual.join('>')}`));
                    }, 1000);
                });
            }
            async _nextState(state, options) {
                let nextState = state;
                while (nextState) {
                    this._onDidChangeState.fire(nextState);
                    this.states.push(nextState);
                    nextState = await this[nextState](options);
                }
            }
            dispose() {
                super.dispose();
                this._onDidChangeState.dispose();
            }
        }
        const store = new lifecycle_1.DisposableStore();
        let configurationService;
        let editor;
        let model;
        let ctrl;
        let contextKeyService;
        let inlineChatService;
        let inlineChatSessionService;
        let instaService;
        setup(function () {
            const serviceCollection = new serviceCollection_1.ServiceCollection([configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService()], [chatVariables_1.IChatVariablesService, new descriptors_1.SyncDescriptor(chatVariables_2.ChatVariablesService)], [log_1.ILogService, new log_1.NullLogService()], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [hover_1.IHoverService, nullHoverService_1.NullHoverService], [extensions_1.IExtensionService, new workbenchTestServices_2.TestExtensionService()], [contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService()], [viewsService_1.IViewsService, new workbenchTestServices_2.TestExtensionService()], [workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService()], [chatWidgetHistoryService_1.IChatWidgetHistoryService, new descriptors_1.SyncDescriptor(chatWidgetHistoryService_1.ChatWidgetHistoryService)], [chat_1.IChatWidgetService, new descriptors_1.SyncDescriptor(chatWidget_1.ChatWidgetService)], [chatSlashCommands_1.IChatSlashCommandService, new descriptors_1.SyncDescriptor(chatSlashCommands_1.ChatSlashCommandService)], [chatService_1.IChatService, new descriptors_1.SyncDescriptor(chatServiceImpl_1.ChatService)], [editorWorker_1.IEditorWorkerService, new descriptors_1.SyncDescriptor(testWorkerService_1.TestWorkerService)], [contextkey_1.IContextKeyService, contextKeyService], [chatAgents_1.IChatAgentService, new descriptors_1.SyncDescriptor(chatAgents_1.ChatAgentService)], [inlineChat_1.IInlineChatService, new descriptors_1.SyncDescriptor(inlineChatServiceImpl_1.InlineChatServiceImpl)], [diffProviderFactoryService_1.IDiffProviderFactoryService, new descriptors_1.SyncDescriptor(testDiffProviderFactoryService_1.TestDiffProviderFactoryService)], [inlineChatSessionService_1.IInlineChatSessionService, new descriptors_1.SyncDescriptor(inlineChatSessionServiceImpl_1.InlineChatSessionServiceImpl)], [commands_1.ICommandService, new descriptors_1.SyncDescriptor(editorTestServices_1.TestCommandService)], [inlineChatSavingService_1.IInlineChatSavingService, new class extends (0, mock_1.mock)() {
                    markChanged(session) {
                        // noop
                    }
                }], [progress_1.IEditorProgressService, new class extends (0, mock_1.mock)() {
                    show(total, delay) {
                        return {
                            total() { },
                            worked(value) { },
                            done() { },
                        };
                    }
                }], [chat_1.IChatAccessibilityService, new class extends (0, mock_1.mock)() {
                    acceptResponse(response, requestId) { }
                    acceptRequest() { return -1; }
                }], [accessibleView_1.IAccessibleViewService, new class extends (0, mock_1.mock)() {
                    getOpenAriaHint(verbositySettingKey) {
                        return null;
                    }
                }], [configuration_1.IConfigurationService, configurationService], [views_1.IViewDescriptorService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.onDidChangeLocation = event_1.Event.None;
                    }
                }]);
            instaService = store.add((store.add((0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store))).createChild(serviceCollection));
            configurationService = instaService.get(configuration_1.IConfigurationService);
            configurationService.setUserConfiguration('chat', { editor: { fontSize: 14, fontFamily: 'default' } });
            configurationService.setUserConfiguration('inlineChat', { mode: 'livePreview' });
            configurationService.setUserConfiguration('editor', {});
            contextKeyService = instaService.get(contextkey_1.IContextKeyService);
            inlineChatService = instaService.get(inlineChat_1.IInlineChatService);
            const chatAgentService = instaService.get(chatAgents_1.IChatAgentService);
            store.add(chatAgentService.registerDynamicAgent({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                extensionPublisherDisplayName: '',
                extensionDisplayName: '',
                extensionPublisherId: '',
                id: 'testAgent',
                name: 'testAgent',
                isDefault: true,
                locations: [chatAgents_1.ChatAgentLocation.Panel],
                metadata: {},
                slashCommands: []
            }, {
                async invoke(request, progress, history, token) {
                    return {};
                },
            }));
            inlineChatSessionService = store.add(instaService.get(inlineChatSessionService_1.IInlineChatSessionService));
            model = store.add(instaService.get(model_1.IModelService).createModel('Hello\nWorld\nHello Again\nHello World\n', null));
            editor = store.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instaService, model));
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test Default',
                prepareInlineChatSession() {
                    return {
                        id: Math.random()
                    };
                },
                provideResponse(session, request) {
                    return {
                        type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                        id: Math.random(),
                        edits: [{
                                range: new range_1.Range(1, 1, 1, 1),
                                text: request.prompt
                            }]
                    };
                }
            }));
        });
        teardown(function () {
            store.clear();
            ctrl?.dispose();
        });
        // TODO@jrieken re-enable, looks like List/ChatWidget is leaking
        // ensureNoDisposablesAreLeakedInTestSuite();
        test('creation, not showing anything', function () {
            ctrl = instaService.createInstance(TestController, editor);
            assert.ok(ctrl);
            assert.strictEqual(ctrl.getWidgetPosition(), undefined);
        });
        test('run (show/hide)', async function () {
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor(TestController.INIT_SEQUENCE_AUTO_SEND);
            const run = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            assert.ok(ctrl.getWidgetPosition() !== undefined);
            await ctrl.cancelSession();
            await run;
            assert.ok(ctrl.getWidgetPosition() === undefined);
        });
        test('wholeRange does not expand to whole lines, editor selection default', async function () {
            editor.setSelection(new range_1.Range(1, 1, 1, 3));
            ctrl = instaService.createInstance(TestController, editor);
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random()
                    };
                },
                provideResponse(session, request) {
                    throw new Error();
                }
            }));
            ctrl.run({});
            await event_1.Event.toPromise(event_1.Event.filter(ctrl.onDidChangeState, e => e === "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */));
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 1, 3));
            await ctrl.cancelSession();
        });
        test('wholeRange expands to whole lines, session provided', async function () {
            editor.setSelection(new range_1.Range(1, 1, 1, 1));
            ctrl = instaService.createInstance(TestController, editor);
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(1, 1, 1, 3)
                    };
                },
                provideResponse(session, request) {
                    throw new Error();
                }
            }));
            ctrl.run({});
            await event_1.Event.toPromise(event_1.Event.filter(ctrl.onDidChangeState, e => e === "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */));
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 1, 3));
            await ctrl.cancelSession();
        });
        test('typing outside of wholeRange finishes session', async function () {
            configurationService.setUserConfiguration("inlineChat.finishOnType" /* InlineChatConfigKeys.FinishOnType */, true);
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor(TestController.INIT_SEQUENCE_AUTO_SEND);
            const r = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 1, 10 /* line length */));
            editor.setSelection(new range_1.Range(2, 1, 2, 1));
            editor.trigger('test', 'type', { text: 'a' });
            await ctrl.waitFor(["DONE" /* State.ACCEPT */]);
            await r;
        });
        test('\'whole range\' isn\'t updated for edits outside whole range #4346', async function () {
            editor.setSelection(new range_1.Range(3, 1, 3, 1));
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(3, 1, 3, 3)
                    };
                },
                provideResponse(session, request) {
                    return {
                        type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                        id: Math.random(),
                        edits: [{
                                range: new range_1.Range(1, 1, 1, 1), // EDIT happens outside of whole range
                                text: `${request.prompt}\n${request.prompt}`
                            }]
                    };
                }
            }));
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor(TestController.INIT_SEQUENCE);
            const r = ctrl.run({ message: 'GENGEN', autoSend: false });
            await p;
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(3, 1, 3, 3)); // initial
            ctrl.acceptInput();
            await ctrl.waitFor(["SHOW_REQUEST" /* State.SHOW_REQUEST */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 4, 3));
            await ctrl.cancelSession();
            await r;
        });
        test('Stuck inline chat widget #211', async function () {
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(3, 1, 3, 3)
                    };
                },
                provideResponse(session, request) {
                    return new Promise(() => { });
                }
            }));
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */]);
            const r = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            ctrl.acceptSession();
            await r;
            assert.strictEqual(ctrl.getWidgetPosition(), undefined);
        });
        test('[Bug] Inline Chat\'s streaming pushed broken iterations to the undo stack #2403', async function () {
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(3, 1, 3, 3)
                    };
                },
                async provideResponse(session, request, progress) {
                    progress.report({ edits: [{ range: new range_1.Range(1, 1, 1, 1), text: 'hEllo1\n' }] });
                    progress.report({ edits: [{ range: new range_1.Range(2, 1, 2, 1), text: 'hEllo2\n' }] });
                    return {
                        id: Math.random(),
                        type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                        edits: [{ range: new range_1.Range(1, 1, 1000, 1), text: 'Hello1\nHello2\n' }]
                    };
                }
            }));
            const valueThen = editor.getModel().getValue();
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            const r = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            ctrl.acceptSession();
            await r;
            assert.strictEqual(editor.getModel().getValue(), 'Hello1\nHello2\n');
            editor.getModel().undo();
            assert.strictEqual(editor.getModel().getValue(), valueThen);
        });
        test.skip('UI is streaming edits minutes after the response is finished #3345', async function () {
            configurationService.setUserConfiguration("inlineChat.mode" /* InlineChatConfigKeys.Mode */, "live" /* EditMode.Live */);
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ maxTaskCount: Number.MAX_SAFE_INTEGER }, async () => {
                store.add(inlineChatService.addProvider({
                    extensionId: extensions_1.nullExtensionDescription.identifier,
                    label: 'Unit Test',
                    prepareInlineChatSession() {
                        return {
                            id: Math.random(),
                        };
                    },
                    async provideResponse(session, request, progress) {
                        const text = '${CSI}#a\n${CSI}#b\n${CSI}#c\n';
                        await (0, async_1.timeout)(10);
                        progress.report({ edits: [{ range: new range_1.Range(1, 1, 1, 1), text: text }] });
                        await (0, async_1.timeout)(10);
                        progress.report({ edits: [{ range: new range_1.Range(1, 1, 1, 1), text: text.repeat(1000) + 'DONE' }] });
                        throw new Error('Too long');
                    }
                }));
                // let modelChangeCounter = 0;
                // store.add(editor.getModel().onDidChangeContent(() => { modelChangeCounter++; }));
                ctrl = instaService.createInstance(TestController, editor);
                const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
                const r = ctrl.run({ message: 'Hello', autoSend: true });
                await p;
                // assert.ok(modelChangeCounter > 0, modelChangeCounter.toString()); // some changes have been made
                // const modelChangeCounterNow = modelChangeCounter;
                assert.ok(!editor.getModel().getValue().includes('DONE'));
                await (0, async_1.timeout)(10);
                // assert.strictEqual(modelChangeCounterNow, modelChangeCounter);
                assert.ok(!editor.getModel().getValue().includes('DONE'));
                await ctrl.cancelSession();
                await r;
            });
        });
        test('escape doesn\'t remove code added from inline editor chat #3523 1/2', async function () {
            // NO manual edits -> cancel
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            const r = ctrl.run({ message: 'GENERATED', autoSend: true });
            await p;
            assert.ok(model.getValue().includes('GENERATED'));
            assert.strictEqual(contextKeyService.getContextKeyValue(inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.key), undefined);
            ctrl.cancelSession();
            await r;
            assert.ok(!model.getValue().includes('GENERATED'));
        });
        test('escape doesn\'t remove code added from inline editor chat #3523, 2/2', async function () {
            // manual edits -> finish
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            const r = ctrl.run({ message: 'GENERATED', autoSend: true });
            await p;
            assert.ok(model.getValue().includes('GENERATED'));
            editor.executeEdits('test', [editOperation_1.EditOperation.insert(model.getFullModelRange().getEndPosition(), 'MANUAL')]);
            assert.strictEqual(contextKeyService.getContextKeyValue(inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.key), true);
            ctrl.finishExistingSession();
            await r;
            assert.ok(model.getValue().includes('GENERATED'));
            assert.ok(model.getValue().includes('MANUAL'));
        });
        test('context has correct preview document', async function () {
            const requests = [];
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random()
                    };
                },
                provideResponse(_session, request) {
                    requests.push(request);
                    return undefined;
                }
            }));
            async function makeRequest() {
                const p = ctrl.waitFor(TestController.INIT_SEQUENCE_AUTO_SEND);
                const r = ctrl.run({ message: 'Hello', autoSend: true });
                await p;
                await ctrl.cancelSession();
                await r;
            }
            // manual edits -> finish
            ctrl = instaService.createInstance(TestController, editor);
            configurationService.setUserConfiguration('inlineChat', { mode: "live" /* EditMode.Live */ });
            await makeRequest();
            configurationService.setUserConfiguration('inlineChat', { mode: "preview" /* EditMode.Preview */ });
            await makeRequest();
            assert.strictEqual(requests.length, 2);
            assert.strictEqual(requests[0].previewDocument.toString(), model.uri.toString()); // live
            assert.strictEqual(requests[1].previewDocument.toString(), model.uri.toString()); // preview (both use the same but edits aren't applied like that)
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdENvbnRyb2xsZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvdGVzdC9icm93c2VyL2lubGluZUNoYXRDb250cm9sbGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0RGhHLEtBQUssQ0FBQywyQkFBMkIsRUFBRTtRQUNsQyxNQUFNLGNBQWUsU0FBUSwyQ0FBb0I7WUFBakQ7O2dCQUtrQixzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBUyxDQUFDO2dCQUNqRCxxQkFBZ0IsR0FBaUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztnQkFFOUQsV0FBTSxHQUFxQixFQUFFLENBQUM7WUFrQ3hDLENBQUM7cUJBeENPLGtCQUFhLEdBQXFCLHlIQUEyRCxBQUFoRixDQUFpRjtxQkFDOUYsNEJBQXVCLEdBQXFCLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxrSUFBZ0UsQUFBM0csQ0FBNEc7WUFPMUksT0FBTyxDQUFDLE1BQXdCO2dCQUMvQixNQUFNLE1BQU0sR0FBWSxFQUFFLENBQUM7Z0JBRTNCLE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQzVDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkIsSUFBSSxJQUFBLGVBQU0sRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQzs0QkFDNUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUNaLE9BQU8sRUFBRSxDQUFDO3dCQUNYLENBQUM7b0JBQ0YsQ0FBQyxDQUFD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