/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, arrays_1, htmlContent_1, lifecycle_1, resources_1, uri_1, range_1, resolverService_1, nls_1, actions_1, commands_1, label_1, log_1, quickInput_1, chatWidget_1, chatVariables_1) {
    "use strict";
    var ChatDynamicVariableModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AddDynamicVariableAction = exports.SelectAndInsertFileAction = exports.ChatDynamicVariableModel = exports.dynamicVariableDecorationType = void 0;
    exports.dynamicVariableDecorationType = 'chat-dynamic-variable';
    let ChatDynamicVariableModel = class ChatDynamicVariableModel extends lifecycle_1.Disposable {
        static { ChatDynamicVariableModel_1 = this; }
        static { this.ID = 'chatDynamicVariableModel'; }
        get variables() {
            return [...this._variables];
        }
        get id() {
            return ChatDynamicVariableModel_1.ID;
        }
        constructor(widget, labelService, logService) {
            super();
            this.widget = widget;
            this.labelService = labelService;
            this.logService = logService;
            this._variables = [];
            this._register(widget.inputEditor.onDidChangeModelContent(e => {
                e.changes.forEach(c => {
                    // Don't mutate entries in _variables, since they will be returned from the getter
                    this._variables = (0, arrays_1.coalesce)(this._variables.map(ref => {
                        const intersection = range_1.Range.intersectRanges(ref.range, c.range);
                        if (intersection && !intersection.isEmpty()) {
                            // The reference text was changed, it's broken
                            const rangeToDelete = new range_1.Range(ref.range.startLineNumber, ref.range.startColumn, ref.range.endLineNumber, ref.range.endColumn - 1);
                            this.widget.inputEditor.executeEdits(this.id, [{
                                    range: rangeToDelete,
                                    text: '',
                                }]);
                            return null;
                        }
                        else if (range_1.Range.compareRangesUsingStarts(ref.range, c.range) > 0) {
                            const delta = c.text.length - c.rangeLength;
                            return {
                                ...ref,
                                range: {
                                    startLineNumber: ref.range.startLineNumber,
                                    startColumn: ref.range.startColumn + delta,
                                    endLineNumber: ref.range.endLineNumber,
                                    endColumn: ref.range.endColumn + delta
                                }
                            };
                        }
                        return ref;
                    }));
                });
                this.updateDecorations();
            }));
        }
        getInputState() {
            return this.variables;
        }
        setInputState(s) {
            if (!Array.isArray(s)) {
                // Something went wrong
                this.logService.warn('ChatDynamicVariableModel.setInputState called with invalid state: ' + JSON.stringify(s));
                return;
            }
            this._variables = s;
            this.updateDecorations();
        }
        addReference(ref) {
            this._variables.push(ref);
            this.updateDecorations();
        }
        updateDecorations() {
            this.widget.inputEditor.setDecorationsByType('chat', exports.dynamicVariableDecorationType, this._variables.map(r => ({
                range: r.range,
                hoverMessage: this.getHoverForReference(r)
            })));
        }
        getHoverForReference(ref) {
            const value = ref.data[0];
            if (uri_1.URI.isUri(value.value)) {
                return new htmlContent_1.MarkdownString(this.labelService.getUriLabel(value.value, { relative: true }));
            }
            else {
                return value.value.toString();
            }
        }
    };
    exports.ChatDynamicVariableModel = ChatDynamicVariableModel;
    exports.ChatDynamicVariableModel = ChatDynamicVariableModel = ChatDynamicVariableModel_1 = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, log_1.ILogService)
    ], ChatDynamicVariableModel);
    chatWidget_1.ChatWidget.CONTRIBS.push(ChatDynamicVariableModel);
    function isSelectAndInsertFileActionContext(context) {
        return 'widget' in context && 'range' in context;
    }
    class SelectAndInsertFileAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.selectAndInsertFile'; }
        constructor() {
            super({
                id: SelectAndInsertFileAction.ID,
                title: '' // not displayed
            });
        }
        async run(accessor, ...args) {
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const logService = accessor.get(log_1.ILogService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const chatVariablesService = accessor.get(chatVariables_1.IChatVariablesService);
            const context = args[0];
            if (!isSelectAndInsertFileActionContext(context)) {
                return;
            }
            const doCleanup = () => {
                // Failed, remove the dangling `file`
                context.widget.inputEditor.executeEdits('chatInsertFile', [{ range: context.range, text: `` }]);
            };
            let options;
            const filesVariableName = 'files';
            const filesItem = {
                label: (0, nls_1.localize)('allFiles', 'All Files'),
                description: (0, nls_1.localize)('allFilesDescription', 'Search for relevant files in the workspace and provide context from them'),
            };
            // If we have a `files` variable, add an option to select all files in the picker.
            // This of course assumes that the `files` variable has the behavior that it searches
            // through files in the workspace.
            if (chatVariablesService.hasVariable(filesVariableName)) {
                options = {
                    providerOptions: {
                        additionPicks: [filesItem, { type: 'separator' }]
                    },
                };
            }
            // TODO: have dedicated UX for this instead of using the quick access picker
            const picks = await quickInputService.quickAccess.pick('', options);
            if (!picks?.length) {
                logService.trace('SelectAndInsertFileAction: no file selected');
                doCleanup();
                return;
            }
            const editor = context.widget.inputEditor;
            const range = context.range;
            // Handle the special case of selecting all files
            if (picks[0] === filesItem) {
                const text = `#${filesVariableName}`;
                const success = editor.executeEdits('chatInsertFile', [{ range, text: text + ' ' }]);
                if (!success) {
                    logService.trace(`SelectAndInsertFileAction: failed to insert "${text}"`);
                    doCleanup();
                }
                return;
            }
            // Handle the case of selecting a specific file
            const resource = picks[0].resource;
            if (!textModelService.canHandleResource(resource)) {
                logService.trace('SelectAndInsertFileAction: non-text resource selected');
                doCleanup();
                return;
            }
            const fileName = (0, resources_1.basename)(resource);
            const text = `#file:${fileName}`;
            const success = editor.executeEdits('chatInsertFile', [{ range, text: text + ' ' }]);
            if (!success) {
                logService.trace(`SelectAndInsertFileAction: failed to insert "${text}"`);
                doCleanup();
                return;
            }
            context.widget.getContrib(ChatDynamicVariableModel.ID)?.addReference({
                range: { startLineNumber: range.startLineNumber, startColumn: range.startColumn, endLineNumber: range.endLineNumber, endColumn: range.startColumn + text.length },
                data: [{ level: 'full', value: resource }]
            });
        }
    }
    exports.SelectAndInsertFileAction = SelectAndInsertFileAction;
    (0, actions_1.registerAction2)(SelectAndInsertFileAction);
    function isAddDynamicVariableContext(context) {
        return 'widget' in context &&
            'range' in context &&
            'variableData' in context;
    }
    class AddDynamicVariableAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.addDynamicVariable'; }
        constructor() {
            super({
                id: AddDynamicVariableAction.ID,
                title: '' // not displayed
            });
        }
        async run(accessor, ...args) {
            const context = args[0];
            if (!isAddDynamicVariableContext(context)) {
                return;
            }
            let range = context.range;
            const variableData = context.variableData;
            const doCleanup = () => {
                // Failed, remove the dangling variable prefix
                context.widget.inputEditor.executeEdits('chatInsertDynamicVariableWithArguments', [{ range: context.range, text: `` }]);
            };
            // If this completion item has no command, return it directly
            if (context.command) {
                // Invoke the command on this completion item along with its args and return the result
                const commandService = accessor.get(commands_1.ICommandService);
                const selection = await commandService.executeCommand(context.command.id, ...(context.command.arguments ?? []));
                if (!selection) {
                    doCleanup();
                    return;
                }
                // Compute new range and variableData
                const insertText = ':' + selection;
                const insertRange = new range_1.Range(range.startLineNumber, range.endColumn, range.endLineNumber, range.endColumn + insertText.length);
                range = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn + insertText.length);
                const editor = context.widget.inputEditor;
                const success = editor.executeEdits('chatInsertDynamicVariableWithArguments', [{ range: insertRange, text: insertText + ' ' }]);
                if (!success) {
                    doCleanup();
                    return;
                }
            }
            context.widget.getContrib(ChatDynamicVariableModel.ID)?.addReference({
                range: range,
                data: variableData
            });
        }
    }
    exports.AddDynamicVariableAction = AddDynamicVariableAction;
    (0, actions_1.registerAction2)(AddDynamicVariableAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdER5bmFtaWNWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY29udHJpYi9jaGF0RHluYW1pY1ZhcmlhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJuRixRQUFBLDZCQUE2QixHQUFHLHVCQUF1QixDQUFDO0lBRTlELElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7O2lCQUNoQyxPQUFFLEdBQUcsMEJBQTBCLEFBQTdCLENBQThCO1FBR3ZELElBQUksU0FBUztZQUNaLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRUQsSUFBSSxFQUFFO1lBQ0wsT0FBTywwQkFBd0IsQ0FBQyxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELFlBQ2tCLE1BQW1CLEVBQ3JCLFlBQTRDLEVBQzlDLFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSlMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNKLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzdCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFaOUMsZUFBVSxHQUF1QixFQUFFLENBQUM7WUFlM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM3RCxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDckIsa0ZBQWtGO29CQUNsRixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFD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