define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/test/browser/diff/testDiffProviderFactoryService", "vs/editor/browser/widget/diffEditor/diffProviderFactoryService", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/test/browser/testCodeEditor", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/progress/common/progress", "vs/workbench/common/views", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/inlineChat/browser/inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/cancellation", "vs/base/common/types", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/services/editorWorker", "./testWorkerService", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/services/views/common/viewsService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/browser/chatVariables", "vs/platform/commands/common/commands", "vs/editor/test/browser/editorTestServices"], function (require, exports, assert, lifecycle_1, event_1, mock_1, utils_1, testDiffProviderFactoryService_1, diffProviderFactoryService_1, range_1, model_1, testCodeEditor_1, configuration_1, testConfigurationService_1, contextkey_1, descriptors_1, serviceCollection_1, mockKeybindingService_1, progress_1, views_1, accessibleView_1, chat_1, inlineChatSavingService_1, inlineChatSessionService_1, inlineChatSessionServiceImpl_1, inlineChat_1, workbenchTestServices_1, cancellation_1, types_1, inlineChatServiceImpl_1, editOperation_1, position_1, editorWorker_1, testWorkerService_1, extensions_1, log_1, telemetry_1, telemetryUtils_1, workspace_1, chatWidget_1, chatService_1, chatServiceImpl_1, chatSlashCommands_1, chatVariables_1, chatWidgetHistoryService_1, viewsService_1, workbenchTestServices_2, chatAgents_1, chatVariables_2, commands_1, editorTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('InlineChatSession', function () {
        const store = new lifecycle_1.DisposableStore();
        let editor;
        let model;
        let instaService;
        let inlineChatService;
        let inlineChatSessionService;
        setup(function () {
            const contextKeyService = new mockKeybindingService_1.MockContextKeyService();
            const serviceCollection = new serviceCollection_1.ServiceCollection([configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService()], [chatVariables_1.IChatVariablesService, new descriptors_1.SyncDescriptor(chatVariables_2.ChatVariablesService)], [log_1.ILogService, new log_1.NullLogService()], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [extensions_1.IExtensionService, new workbenchTestServices_2.TestExtensionService()], [contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService()], [viewsService_1.IViewsService, new workbenchTestServices_2.TestExtensionService()], [workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService()], [chatWidgetHistoryService_1.IChatWidgetHistoryService, new descriptors_1.SyncDescriptor(chatWidgetHistoryService_1.ChatWidgetHistoryService)], [chat_1.IChatWidgetService, new descriptors_1.SyncDescriptor(chatWidget_1.ChatWidgetService)], [chatSlashCommands_1.IChatSlashCommandService, new descriptors_1.SyncDescriptor(chatSlashCommands_1.ChatSlashCommandService)], [chatService_1.IChatService, new descriptors_1.SyncDescriptor(chatServiceImpl_1.ChatService)], [editorWorker_1.IEditorWorkerService, new descriptors_1.SyncDescriptor(testWorkerService_1.TestWorkerService)], [chatAgents_1.IChatAgentService, new descriptors_1.SyncDescriptor(chatAgents_1.ChatAgentService)], [inlineChat_1.IInlineChatService, new descriptors_1.SyncDescriptor(inlineChatServiceImpl_1.InlineChatServiceImpl)], [contextkey_1.IContextKeyService, contextKeyService], [diffProviderFactoryService_1.IDiffProviderFactoryService, new descriptors_1.SyncDescriptor(testDiffProviderFactoryService_1.TestDiffProviderFactoryService)], [inlineChatSessionService_1.IInlineChatSessionService, new descriptors_1.SyncDescriptor(inlineChatSessionServiceImpl_1.InlineChatSessionServiceImpl)], [commands_1.ICommandService, new descriptors_1.SyncDescriptor(editorTestServices_1.TestCommandService)], [inlineChatSavingService_1.IInlineChatSavingService, new class extends (0, mock_1.mock)() {
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
                }], [configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService()], [views_1.IViewDescriptorService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.onDidChangeLocation = event_1.Event.None;
                    }
                }]);
            instaService = store.add((0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store).createChild(serviceCollection));
            inlineChatService = instaService.get(inlineChat_1.IInlineChatService);
            inlineChatSessionService = store.add(instaService.get(inlineChatSessionService_1.IInlineChatSessionService));
            instaService.get(chatAgents_1.IChatAgentService).registerDynamicAgent({
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
                async invoke() {
                    return {};
                }
            });
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
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
            model = store.add(instaService.get(model_1.IModelService).createModel('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven', null));
            editor = store.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instaService, model));
        });
        teardown(function () {
            store.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function makeEditAsAi(edit) {
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            (0, types_1.assertType)(session);
            session.hunkData.ignoreTextModelNChanges = true;
            try {
                editor.executeEdits('test', Array.isArray(edit) ? edit : [edit]);
            }
            finally {
                session.hunkData.ignoreTextModelNChanges = false;
            }
            await session.hunkData.recompute();
        }
        function makeEdit(edit) {
            editor.executeEdits('test', Array.isArray(edit) ? edit : [edit]);
        }
        test('Create, release', async function () {
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, info', async function () {
            const decorationCountThen = model.getAllDecorations().length;
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            assert.ok(session.textModelN === model);
            await makeEditAsAi(editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI_EDIT\n'));
            assert.strictEqual(session.hunkData.size, 1);
            let [hunk] = session.hunkData.getInfo();
            (0, types_1.assertType)(hunk);
            assert.ok(!session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            assert.strictEqual(hunk.getState(), 0 /* HunkState.Pending */);
            assert.ok(hunk.getRangesN()[0].equalsRange({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 7 }));
            await makeEditAsAi(editOperation_1.EditOperation.insert(new position_1.Position(1, 3), 'foobar'));
            [hunk] = session.hunkData.getInfo();
            assert.ok(hunk.getRangesN()[0].equalsRange({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 13 }));
            inlineChatSessionService.releaseSession(session);
            assert.strictEqual(model.getAllDecorations().length, decorationCountThen); // no leaked decorations!
        });
        test('HunkData, accept', async function () {
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI_EDIT\n'), editOperation_1.EditOperation.insert(new position_1.Position(10, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 2);
            assert.ok(!session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            for (const hunk of session.hunkData.getInfo()) {
                (0, types_1.assertType)(hunk);
                assert.strictEqual(hunk.getState(), 0 /* HunkState.Pending */);
                hunk.acceptChanges();
                assert.strictEqual(hunk.getState(), 1 /* HunkState.Accepted */);
            }
            assert.strictEqual(session.textModel0.getValue(), session.textModelN.getValue());
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, reject', async function () {
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI_EDIT\n'), editOperation_1.EditOperation.insert(new position_1.Position(10, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 2);
            assert.ok(!session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            for (const hunk of session.hunkData.getInfo()) {
                (0, types_1.assertType)(hunk);
                assert.strictEqual(hunk.getState(), 0 /* HunkState.Pending */);
                hunk.discardChanges();
                assert.strictEqual(hunk.getState(), 2 /* HunkState.Rejected */);
            }
            assert.strictEqual(session.textModel0.getValue(), session.textModelN.getValue());
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, N rounds', async function () {
            model.setValue('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven\ntwelwe\nthirteen\nfourteen\nfifteen\nsixteen\nseventeen\neighteen\nnineteen\n');
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            assert.ok(session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            assert.strictEqual(session.hunkData.size, 0);
            // ROUND #1
            await makeEditAsAi([
                editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI1'),
                editOperation_1.EditOperation.insert(new position_1.Position(4, 1), 'AI2'),
                editOperation_1.EditOperation.insert(new position_1.Position(19, 1), 'AI3')
            ]);
            assert.strictEqual(session.hunkData.size, 2); // AI1, AI2 are merged into one hunk, AI3 is a separate hunk
            let [first, second] = session.hunkData.getInfo();
            assert.ok(model.getValueInRange(first.getRangesN()[0]).includes('AI1'));
            assert.ok(model.getValueInRange(first.getRangesN()[0]).includes('AI2'));
            assert.ok(model.getValueInRange(second.getRangesN()[0]).includes('AI3'));
            assert.ok(!session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI1'));
            assert.ok(!session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI2'));
            assert.ok(!session.textModel0.getValueInRange(second.getRangesN()[0]).includes('AI3'));
            first.acceptChanges();
            assert.ok(session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI1'));
            assert.ok(session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI2'));
            assert.ok(!session.textModel0.getValueInRange(second.getRangesN()[0]).includes('AI3'));
            // ROUND #2
            await makeEditAsAi([
                editOperation_1.EditOperation.insert(new position_1.Position(7, 1), 'AI4'),
            ]);
            assert.strictEqual(session.hunkData.size, 2);
            [first, second] = session.hunkData.getInfo();
            assert.ok(model.getValueInRange(first.getRangesN()[0]).includes('AI4')); // the new hunk (in line-order)
            assert.ok(model.getValueInRange(second.getRangesN()[0]).includes('AI3')); // the previous hunk remains
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, (mirror) edit before', async function () {
            const lines = ['one', 'two', 'three'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI WAS HERE\n')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 4), 'ONE')]);
            assert.strictEqual(session.textModelN.getValue(), ['ONE', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['ONE', 'two', 'three'].join('\n'));
        });
        test('HunkData, (mirror) edit after', async function () {
            const lines = ['one', 'two', 'three', 'four', 'five'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 1);
            const [hunk] = session.hunkData.getInfo();
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'USER1')]);
            assert.strictEqual(session.textModelN.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'four', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['USER1one', 'two', 'three', 'four', 'five'].join('\n'));
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(5, 1), 'USER2')]);
            assert.strictEqual(session.textModelN.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'USER2four', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['USER1one', 'two', 'three', 'USER2four', 'five'].join('\n'));
            hunk.acceptChanges();
            assert.strictEqual(session.textModelN.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'USER2four', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'USER2four', 'five'].join('\n'));
        });
        test('HunkData, (mirror) edit inside ', async function () {
            const lines = ['one', 'two', 'three'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI WAS HERE\n')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(3, 4, 3, 7), 'wwaaassss')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI wwaaassss HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three'].join('\n'));
        });
        test('HunkData, (mirror) edit after dicard ', async function () {
            const lines = ['one', 'two', 'three'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI WAS HERE\n')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            assert.strictEqual(session.hunkData.size, 1);
            const [hunk] = session.hunkData.getInfo();
            hunk.discardChanges();
            assert.strictEqual(session.textModelN.getValue(), lines.join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(3, 4, 3, 6), '3333')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'thr3333'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'thr3333'].join('\n'));
        });
        test('HunkData, (mirror) edit after, multi turn', async function () {
            const lines = ['one', 'two', 'three', 'four', 'five'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 1);
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(5, 1), 'FOO')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(2, 4), ' zwei')]);
            assert.strictEqual(session.hunkData.size, 1);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two zwei', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(6, 3, 6, 5), 'vefivefi')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two zwei', 'AI_EDIT', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
        });
        test('HunkData, (mirror) edit after, multi turn 2', async function () {
            const lines = ['one', 'two', 'three', 'four', 'five'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 1);
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(5, 1), 'FOO')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(2, 4), 'zwei')]);
            assert.strictEqual(session.hunkData.size, 1);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'twozwei', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(6, 3, 6, 5), 'vefivefi')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'twozwei', 'AI_EDIT', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
            session.hunkData.getInfo()[0].acceptChanges();
            assert.strictEqual(session.textModelN.getValue(), session.textModel0.getValue());
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 1), 'done')]);
            assert.strictEqual(session.textModelN.getValue(), session.textModel0.getValue());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlc3Npb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvdGVzdC9icm93c2VyL2lubGluZUNoYXRTZXNzaW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBNERBLEtBQUssQ0FBQyxtQkFBbUIsRUFBRTtRQUUxQixNQUFNLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUNwQyxJQUFJLE1BQXlCLENBQUM7UUFDOUIsSUFBSSxLQUFpQixDQUFDO1FBQ3RCLElBQUksWUFBc0MsQ0FBQztRQUMzQyxJQUFJLGlCQUF3QyxDQUFDO1FBRTdDLElBQUksd0JBQW1ELENBQUM7UUFFeEQsS0FBSyxDQUFDO1lBQ0wsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDZDQUFxQixFQUFFLENBQUM7WUFHdEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHFDQUFpQixDQUM5QyxDQUFDLHFDQUFxQixFQUFFLElBQUksbURBQXdCLEVBQUUsQ0FBQyxFQUN2RCxDQUFDLHFDQUFxQixFQUFFLElBQUksNEJBQWMsQ0FBQyxvQ0FBb0IsQ0FBQyxDQUFDLEVBQ2pFLENBQUMsaUJBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxFQUNuQyxDQUFDLDZCQUFpQixFQUFFLHFDQUFvQixDQUFDLEVBQ3pDLENBQUMsOEJBQWlCLEVBQUUsSUFBSSw0Q0FBb0IsRUFBRSxDQUFDLEVBQy9DLENBQUMsK0JBQWtCLEVBQUUsSUFBSSw2Q0FBcUIsRUFBRSxDQUFDLEVBQ2pELENBQUMsNEJBQWEsRUFBRSxJQUFJLDRDQUFvQixFQUFFLENBQUMsRUFDM0MsQ0FBQyxvQ0FBd0IsRUFBRSxJQUFJLDBDQUFrQixFQUFFLENBQUMsRUFDcEQsQ0FBQyxvREFBeUIsRUFBRSxJQUFJLDRC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TSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXpFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXZGLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDckYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxD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