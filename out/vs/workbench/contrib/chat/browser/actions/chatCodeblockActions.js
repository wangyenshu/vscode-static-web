/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/clipboard/browser/clipboard", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/codeBlockPart", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, cancellation_1, codicons_1, editorBrowser_1, bulkEditService_1, codeEditorService_1, range_1, editorContextKeys_1, language_1, languageFeatures_1, clipboard_1, nls_1, actions_1, clipboardService_1, contextkey_1, instantiation_1, terminal_1, accessibilityConfiguration_1, chatActions_1, chat_1, codeBlockPart_1, chatContextKeys_1, chatService_1, chatViewModel_1, cellOperations_1, notebookCommon_1, terminal_2, editorService_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCodeBlockActionContext = isCodeBlockActionContext;
    exports.isCodeCompareBlockActionContext = isCodeCompareBlockActionContext;
    exports.registerChatCodeBlockActions = registerChatCodeBlockActions;
    exports.registerChatCodeCompareBlockActions = registerChatCodeCompareBlockActions;
    function isCodeBlockActionContext(thing) {
        return typeof thing === 'object' && thing !== null && 'code' in thing && 'element' in thing;
    }
    function isCodeCompareBlockActionContext(thing) {
        return typeof thing === 'object' && thing !== null && 'element' in thing;
    }
    function isResponseFiltered(context) {
        return (0, chatViewModel_1.isResponseVM)(context.element) && context.element.errorDetails?.responseIsFiltered;
    }
    function getUsedDocuments(context) {
        return (0, chatViewModel_1.isResponseVM)(context.element) ? context.element.usedContext?.documents : undefined;
    }
    class ChatCodeBlockAction extends actions_1.Action2 {
        run(accessor, ...args) {
            let context = args[0];
            if (!isCodeBlockActionContext(context)) {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
                if (!editor) {
                    return;
                }
                context = getContextFromEditor(editor, accessor);
                if (!isCodeBlockActionContext(context)) {
                    return;
                }
            }
            return this.runWithContext(accessor, context);
        }
    }
    function registerChatCodeBlockActions() {
        (0, actions_1.registerAction2)(class CopyCodeBlockAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.copyCodeBlock',
                    title: (0, nls_1.localize2)('interactive.copyCodeBlock.label', "Copy"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.copy,
                    menu: {
                        id: actions_1.MenuId.ChatCodeBlock,
                        group: 'navigation'
                    }
                });
            }
            run(accessor, ...args) {
                const context = args[0];
                if (!isCodeBlockActionContext(context) || isResponseFiltered(context)) {
                    return;
                }
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                clipboardService.writeText(context.code);
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    const chatService = accessor.get(chatService_1.IChatService);
                    chatService.notifyUserAction({
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'copy',
                            codeBlockIndex: context.codeBlockIndex,
                            copyKind: chatService_1.ChatCopyKind.Toolbar,
                            copiedCharacters: context.code.length,
                            totalCharacters: context.code.length,
                            copiedText: context.code,
                        }
                    });
                }
            }
        });
        clipboard_1.CopyAction?.addImplementation(50000, 'chat-codeblock', (accessor) => {
            // get active code editor
            const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (!editor) {
                return false;
            }
            const editorModel = editor.getModel();
            if (!editorModel) {
                return false;
            }
            const context = getContextFromEditor(editor, accessor);
            if (!context) {
                return false;
            }
            const noSelection = editor.getSelections()?.length === 1 && editor.getSelection()?.isEmpty();
            const copiedText = noSelection ?
                editorModel.getValue() :
                editor.getSelections()?.reduce((acc, selection) => acc + editorModel.getValueInRange(selection), '') ?? '';
            const totalCharacters = editorModel.getValueLength();
            // Report copy to extensions
            const chatService = accessor.get(chatService_1.IChatService);
            const element = context.element;
            if (element) {
                chatService.notifyUserAction({
                    agentId: element.agent?.id,
                    sessionId: element.sessionId,
                    requestId: element.requestId,
                    result: element.result,
                    action: {
                        kind: 'copy',
                        codeBlockIndex: context.codeBlockIndex,
                        copyKind: chatService_1.ChatCopyKind.Action,
                        copiedText,
                        copiedCharacters: copiedText.length,
                        totalCharacters,
                    }
                });
            }
            // Copy full cell if no selection, otherwise fall back on normal editor implementation
            if (noSelection) {
                accessor.get(clipboardService_1.IClipboardService).writeText(context.code);
                return true;
            }
            return false;
        });
        (0, actions_1.registerAction2)(class InsertCodeBlockAction extends ChatCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.insertCodeBlock',
                    title: (0, nls_1.localize2)('interactive.insertCodeBlock.label', "Insert at Cursor"),
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.insert,
                    menu: {
                        id: actions_1.MenuId.ChatCodeBlock,
                        group: 'navigation',
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION
                    },
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.negate()), accessibilityConfiguration_1.accessibleViewInCodeBlock),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */ },
                        weight: 400 /* KeybindingWeight.ExternalExtension */ + 1
                    },
                });
            }
            async runWithContext(accessor, context) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const textFileService = accessor.get(textfiles_1.ITextFileService);
                if (isResponseFiltered(context)) {
                    // When run from command palette
                    return;
                }
                if (editorService.activeEditorPane?.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
                    return this.handleNotebookEditor(accessor, editorService.activeEditorPane.getControl(), context);
                }
                let activeEditorControl = editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isDiffEditor)(activeEditorControl)) {
                    activeEditorControl = activeEditorControl.getOriginalEditor().hasTextFocus() ? activeEditorControl.getOriginalEditor() : activeEditorControl.getModifiedEditor();
                }
                if (!(0, editorBrowser_1.isCodeEditor)(activeEditorControl)) {
                    return;
                }
                const activeModel = activeEditorControl.getModel();
                if (!activeModel) {
                    return;
                }
                // Check if model is editable, currently only support untitled and text file
                const activeTextModel = textFileService.files.get(activeModel.uri) ?? textFileService.untitled.get(activeModel.uri);
                if (!activeTextModel || activeTextModel.isReadonly()) {
                    return;
                }
                await this.handleTextEditor(accessor, activeEditorControl, activeModel, context);
            }
            async handleNotebookEditor(accessor, notebookEditor, context) {
                if (!notebookEditor.hasModel()) {
                    return;
                }
                if (notebookEditor.isReadOnly) {
                    return;
                }
                if (notebookEditor.activeCodeEditor?.hasTextFocus()) {
                    const codeEditor = notebookEditor.activeCodeEditor;
                    const textModel = codeEditor.getModel();
                    if (textModel) {
                        return this.handleTextEditor(accessor, codeEditor, textModel, context);
                    }
                }
                const languageService = accessor.get(language_1.ILanguageService);
                const focusRange = notebookEditor.getFocus();
                const next = Math.max(focusRange.end - 1, 0);
                (0, cellOperations_1.insertCell)(languageService, notebookEditor, next, notebookCommon_1.CellKind.Code, 'below', context.code, true);
                this.notifyUserAction(accessor, context);
            }
            async handleTextEditor(accessor, codeEditor, activeModel, codeBlockActionContext) {
                this.notifyUserAction(accessor, codeBlockActionContext);
                const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const mappedEditsProviders = accessor.get(languageFeatures_1.ILanguageFeaturesService).mappedEditsProvider.ordered(activeModel);
                // try applying workspace edit that was returned by a MappedEditsProvider, else simply insert at selection
                let mappedEdits = null;
                if (mappedEditsProviders.length > 0) {
                    const mostRelevantProvider = mappedEditsProviders[0]; // TODO@ulugbekna: should we try all providers?
                    // 0th sub-array - editor selections array if there are any selections
                    // 1st sub-array - array with documents used to get the chat reply
                    const docRefs = [];
                    if (codeEditor.hasModel()) {
                        const model = codeEditor.getModel();
                        const currentDocUri = model.uri;
                        const currentDocVersion = model.getVersionId();
                        const selections = codeEditor.getSelections();
                        if (selections.length > 0) {
                            docRefs.push([
                                {
                                    uri: currentDocUri,
                                    version: currentDocVersion,
                                    ranges: selections,
                                }
                            ]);
                        }
                    }
                    const usedDocuments = getUsedDocuments(codeBlockActionContext);
                    if (usedDocuments) {
                        docRefs.push(usedDocuments);
                    }
                    const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                    mappedEdits = await mostRelevantProvider.provideMappedEdits(activeModel, [codeBlockActionContext.code], { documents: docRefs }, cancellationTokenSource.token);
                }
                if (mappedEdits) {
                    await bulkEditService.apply(mappedEdits);
                }
                else {
                    const activeSelection = codeEditor.getSelection() ?? new range_1.Range(activeModel.getLineCount(), 1, activeModel.getLineCount(), 1);
                    await bulkEditService.apply([
                        new bulkEditService_1.ResourceTextEdit(activeModel.uri, {
                            range: activeSelection,
                            text: codeBlockActionContext.code,
                        }),
                    ]);
                }
                codeEditorService.listCodeEditors().find(editor => editor.getModel()?.uri.toString() === activeModel.uri.toString())?.focus();
            }
            notifyUserAction(accessor, context) {
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    const chatService = accessor.get(chatService_1.IChatService);
                    chatService.notifyUserAction({
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'insert',
                            codeBlockIndex: context.codeBlockIndex,
                            totalCharacters: context.code.length,
                        }
                    });
                }
            }
        });
        (0, actions_1.registerAction2)(class InsertIntoNewFileAction extends ChatCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.insertIntoNewFile',
                    title: (0, nls_1.localize2)('interactive.insertIntoNewFile.label', "Insert into New File"),
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.newFile,
                    menu: {
                        id: actions_1.MenuId.ChatCodeBlock,
                        group: 'navigation',
                        isHiddenByDefault: true
                    }
                });
            }
            async runWithContext(accessor, context) {
                if (isResponseFiltered(context)) {
                    // When run from command palette
                    return;
                }
                const editorService = accessor.get(editorService_1.IEditorService);
                const chatService = accessor.get(chatService_1.IChatService);
                editorService.openEditor({ contents: context.code, languageId: context.languageId, resource: undefined });
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    chatService.notifyUserAction({
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'insert',
                            codeBlockIndex: context.codeBlockIndex,
                            totalCharacters: context.code.length,
                            newFile: true
                        }
                    });
                }
            }
        });
        const shellLangIds = [
            'fish',
            'ps1',
            'pwsh',
            'powershell',
            'sh',
            'shellscript',
            'zsh'
        ];
        (0, actions_1.registerAction2)(class RunInTerminalAction extends ChatCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.runInTerminal',
                    title: (0, nls_1.localize2)('interactive.runInTerminal.label', "Insert into Terminal"),
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.terminal,
                    menu: [{
                            id: actions_1.MenuId.ChatCodeBlock,
                            group: 'navigation',
                            when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, contextkey_1.ContextKeyExpr.or(...shellLangIds.map(e => contextkey_1.ContextKeyExpr.equals(editorContextKeys_1.EditorContextKeys.languageId.key, e)))),
                        },
                        {
                            id: actions_1.MenuId.ChatCodeBlock,
                            group: 'navigation',
                            isHiddenByDefault: true,
                            when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, ...shellLangIds.map(e => contextkey_1.ContextKeyExpr.notEquals(editorContextKeys_1.EditorContextKeys.languageId.key, e)))
                        }],
                    keybinding: [{
                            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                            mac: {
                                primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                            },
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: contextkey_1.ContextKeyExpr.or(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, accessibilityConfiguration_1.accessibleViewInCodeBlock),
                        }]
                });
            }
            async runWithContext(accessor, context) {
                if (isResponseFiltered(context)) {
                    // When run from command palette
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const terminalEditorService = accessor.get(terminal_2.ITerminalEditorService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                let terminal = await terminalService.getActiveOrCreateInstance();
                // isFeatureTerminal = debug terminal or task terminal
                const unusableTerminal = terminal.xterm?.isStdinDisabled || terminal.shellLaunchConfig.isFeatureTerminal;
                terminal = unusableTerminal ? await terminalService.createTerminal() : terminal;
                terminalService.setActiveInstance(terminal);
                await terminal.focusWhenReady(true);
                if (terminal.target === terminal_1.TerminalLocation.Editor) {
                    const existingEditors = editorService.findEditors(terminal.resource);
                    terminalEditorService.openEditor(terminal, { viewColumn: existingEditors?.[0].groupId });
                }
                else {
                    terminalGroupService.showPanel(true);
                }
                terminal.runCommand(context.code, false);
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    chatService.notifyUserAction({
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'runInTerminal',
                            codeBlockIndex: context.codeBlockIndex,
                            languageId: context.languageId,
                        }
                    });
                }
            }
        });
        function navigateCodeBlocks(accessor, reverse) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = chatWidgetService.lastFocusedWidget;
            if (!widget) {
                return;
            }
            const editor = codeEditorService.getFocusedCodeEditor();
            const editorUri = editor?.getModel()?.uri;
            const curCodeBlockInfo = editorUri ? widget.getCodeBlockInfoForEditor(editorUri) : undefined;
            const focused = !widget.inputEditor.hasWidgetFocus() && widget.getFocus();
            const focusedResponse = (0, chatViewModel_1.isResponseVM)(focused) ? focused : undefined;
            const currentResponse = curCodeBlockInfo ?
                curCodeBlockInfo.element :
                (focusedResponse ?? widget.viewModel?.getItems().reverse().find((item) => (0, chatViewModel_1.isResponseVM)(item)));
            if (!currentResponse) {
                return;
            }
            widget.reveal(currentResponse);
            const responseCodeblocks = widget.getCodeBlockInfosForResponse(currentResponse);
            const focusIdx = curCodeBlockInfo ?
                (curCodeBlockInfo.codeBlockIndex + (reverse ? -1 : 1) + responseCodeblocks.length) % responseCodeblocks.length :
                reverse ? responseCodeblocks.length - 1 : 0;
            responseCodeblocks[focusIdx]?.focus();
        }
        (0, actions_1.registerAction2)(class NextCodeBlockAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.nextCodeBlock',
                    title: (0, nls_1.localize2)('interactive.nextCodeBlock.label', "Next Code Block"),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION,
                    },
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                });
            }
            run(accessor, ...args) {
                navigateCodeBlocks(accessor);
            }
        });
        (0, actions_1.registerAction2)(class PreviousCodeBlockAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.previousCodeBlock',
                    title: (0, nls_1.localize2)('interactive.previousCodeBlock.label', "Previous Code Block"),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION,
                    },
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                });
            }
            run(accessor, ...args) {
                navigateCodeBlocks(accessor, true);
            }
        });
    }
    function getContextFromEditor(editor, accessor) {
        const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
        const chatCodeBlockContextProviderService = accessor.get(chat_1.IChatCodeBlockContextProviderService);
        const model = editor.getModel();
        if (!model) {
            return;
        }
        const widget = chatWidgetService.lastFocusedWidget;
        const codeBlockInfo = widget?.getCodeBlockInfoForEditor(model.uri);
        if (!codeBlockInfo) {
            for (const provider of chatCodeBlockContextProviderService.providers) {
                const context = provider.getCodeBlockContext(editor);
                if (context) {
                    return context;
                }
            }
            return;
        }
        return {
            element: codeBlockInfo.element,
            codeBlockIndex: codeBlockInfo.codeBlockIndex,
            code: editor.getValue(),
            languageId: editor.getModel().getLanguageId(),
        };
    }
    function registerChatCodeCompareBlockActions() {
        class ChatCompareCodeBlockAction extends actions_1.Action2 {
            run(accessor, ...args) {
                const context = args[0];
                if (!isCodeCompareBlockActionContext(context)) {
                    return;
                    // TODO@jrieken derive context
                }
                return this.runWithContext(accessor, context);
            }
        }
        (0, actions_1.registerAction2)(class ApplyEditsCompareBlockAction extends ChatCompareCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.applyCompareEdits',
                    title: (0, nls_1.localize2)('interactive.compare.apply', "Apply Edits"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.check,
                    precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasChanges, chatContextKeys_1.CONTEXT_CHAT_EDIT_APPLIED.negate()),
                    menu: {
                        id: actions_1.MenuId.ChatCompareBlock,
                        group: 'navigation'
                    }
                });
            }
            async runWithContext(accessor, context) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const instaService = accessor.get(instantiation_1.IInstantiationService);
                const editor = instaService.createInstance(codeBlockPart_1.DefaultChatTextEditor);
                await editor.apply(context.element, context.edit);
                await editorService.openEditor({
                    resource: context.edit.uri,
                    options: { revealIfVisible: true },
                });
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENvZGVibG9ja0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0Q29kZWJsb2NrQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTBDaEcsNERBRUM7SUFFRCwwRUFFQztJQWdDRCxvRUF3ZEM7SUE4QkQsa0ZBOENDO0lBMWtCRCxTQUFnQix3QkFBd0IsQ0FBQyxLQUFjO1FBQ3RELE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksTUFBTSxJQUFJLEtBQUssSUFBSSxTQUFTLElBQUksS0FBSyxDQUFDO0lBQzdGLENBQUM7SUFFRCxTQUFnQiwrQkFBK0IsQ0FBQyxLQUFjO1FBQzdELE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQztJQUMxRSxDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxPQUFnQztRQUMzRCxPQUFPLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUM7SUFDMUYsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBZ0M7UUFDekQsT0FBTyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUMzRixDQUFDO0lBRUQsTUFBZSxtQkFBb0IsU0FBUSxpQkFBTztRQUNqRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElB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