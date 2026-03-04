/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/resources", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, resources_1, nls_1, actions_1, dialogs_1, files_1, chatActions_1, chat_1, chatEditorInput_1, chatContextKeys_1, chatModel_1, chatService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatExportActions = registerChatExportActions;
    const defaultFileName = 'chat.json';
    const filters = [{ name: (0, nls_1.localize)('chat.file.label', "Chat Session"), extensions: ['json'] }];
    function registerChatExportActions() {
        (0, actions_1.registerAction2)(class ExportChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.export',
                    category: chatActions_1.CHAT_CATEGORY,
                    title: (0, nls_1.localize2)('chat.export.label', "Export Chat..."),
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                const fileService = accessor.get(files_1.IFileService);
                const chatService = accessor.get(chatService_1.IChatService);
                const widget = widgetService.lastFocusedWidget;
                if (!widget || !widget.viewModel) {
                    return;
                }
                const defaultUri = (0, resources_1.joinPath)(await fileDialogService.defaultFilePath(), defaultFileName);
                const result = await fileDialogService.showSaveDialog({
                    defaultUri,
                    filters
                });
                if (!result) {
                    return;
                }
                const model = chatService.getSession(widget.viewModel.sessionId);
                if (!model) {
                    return;
                }
                // Using toJSON on the model
                const content = buffer_1.VSBuffer.fromString(JSON.stringify(model.toExport(), undefined, 2));
                await fileService.writeFile(result, content);
            }
        });
        (0, actions_1.registerAction2)(class ImportChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.import',
                    title: (0, nls_1.localize2)('chat.import.label', "Import Chat..."),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                const fileService = accessor.get(files_1.IFileService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const defaultUri = (0, resources_1.joinPath)(await fileDialogService.defaultFilePath(), defaultFileName);
                const result = await fileDialogService.showOpenDialog({
                    defaultUri,
                    canSelectFiles: true,
                    filters
                });
                if (!result) {
                    return;
                }
                const content = await fileService.readFile(result[0]);
                try {
                    const data = JSON.parse(content.value.toString());
                    if (!(0, chatModel_1.isExportableSessionData)(data)) {
                        throw new Error('Invalid chat session data');
                    }
                    await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { data }, pinned: true } });
                }
                catch (err) {
                    throw err;
                }
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEltcG9ydEV4cG9ydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9hY3Rpb25zL2NoYXRJbXBvcnRFeHBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLDhEQWdGQztJQW5GRCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUM7SUFDcEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFOUYsU0FBZ0IseUJBQXlCO1FBQ3hDLElBQUEseUJBQWUsRUFBQyxNQUFNLGdCQUFpQixTQUFRLGlCQUFPO1lBQ3JEO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsOEJBQThCO29CQUNsQyxRQUFRLEVBQUUsMkJBQWE7b0JBQ3ZCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQztvQkFDdkQsWUFBWSxFQUFFLHNDQUFvQjtvQkFDbEMsRUFBRSxFQUFFLElBQUk7aUJBQ1IsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQ25ELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWtCLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFrQixDQUFDLENBQUM7Z0JBQzNELE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLFdB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