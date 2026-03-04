/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, async_1, lifecycle_1, uri_1, extHost_protocol_1, extHostCommands_1, typeConvert, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostInteractiveEditor = void 0;
    class ProviderWrapper {
        static { this._pool = 0; }
        constructor(extension, provider) {
            this.extension = extension;
            this.provider = provider;
            this.handle = ProviderWrapper._pool++;
        }
    }
    class SessionWrapper {
        constructor(session) {
            this.session = session;
            this.responses = [];
        }
    }
    class ExtHostInteractiveEditor {
        static { this._nextId = 0; }
        constructor(mainContext, extHostCommands, _documents, _logService) {
            this._documents = _documents;
            this._logService = _logService;
            this._inputProvider = new Map();
            this._inputSessions = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadInlineChat);
            extHostCommands.registerApiCommand(new extHostCommands_1.ApiCommand('vscode.editorChat.start', 'inlineChat.start', 'Invoke a new editor chat session', [new extHostCommands_1.ApiCommandArgument('Run arguments', '', _v => true, v => {
                    if (!v) {
                        return undefined;
                    }
                    return {
                        initialRange: v.initialRange ? typeConvert.Range.from(v.initialRange) : undefined,
                        initialSelection: extHostTypes.Selection.isSelection(v.initialSelection) ? typeConvert.Selection.from(v.initialSelection) : undefined,
                        message: v.message,
                        autoSend: v.autoSend,
                        position: v.position ? typeConvert.Position.from(v.position) : undefined,
                    };
                })], extHostCommands_1.ApiCommandResult.Void));
        }
        registerProvider(extension, provider, metadata) {
            const wrapper = new ProviderWrapper(extension, provider);
            this._inputProvider.set(wrapper.handle, wrapper);
            this._proxy.$registerInteractiveEditorProvider(wrapper.handle, metadata?.label ?? extension.displayName ?? extension.name, extension.identifier, typeof provider.handleInteractiveEditorResponseFeedback === 'function', typeof provider.provideFollowups === 'function', metadata?.supportReportIssue ?? false);
            return (0, lifecycle_1.toDisposable)(() => {
                this._proxy.$unregisterInteractiveEditorProvider(wrapper.handle);
                this._inputProvider.delete(wrapper.handle);
            });
        }
        async $prepareSession(handle, uri, range, token) {
            const entry = this._inputProvider.get(handle);
            if (!entry) {
                this._logService.warn('CANNOT prepare session because the PROVIDER IS GONE');
                return undefined;
            }
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const selection = typeConvert.Selection.to(range);
            const session = await entry.provider.prepareInteractiveEditorSession({ document, selection }, token);
            if (!session) {
                return undefined;
            }
            if (session.wholeRange && !session.wholeRange.contains(selection)) {
                throw new Error(`InteractiveEditorSessionProvider returned a wholeRange that does not contain the selection.`);
            }
            const id = ExtHostInteractiveEditor._nextId++;
            this._inputSessions.set(id, new SessionWrapper(session));
            return {
                id,
                placeholder: session.placeholder,
                input: session.input,
                slashCommands: session.slashCommands?.map(c => ({ command: c.command, detail: c.detail, refer: c.refer, executeImmediately: c.executeImmediately })),
                wholeRange: typeConvert.Range.from(session.wholeRange),
                message: session.message
            };
        }
        async $provideResponse(handle, item, request, token) {
            const entry = this._inputProvider.get(handle);
            if (!entry) {
                return undefined;
            }
            const sessionData = this._inputSessions.get(item.id);
            if (!sessionData) {
                return;
            }
            const apiRequest = {
                prompt: request.prompt,
                selection: typeConvert.Selection.to(request.selection),
                wholeRange: typeConvert.Range.to(request.wholeRange),
                attempt: request.attempt,
                live: request.live,
                previewDocument: this._documents.getDocument(uri_1.URI.revive(request.previewDocument)),
                withIntentDetection: request.withIntentDetection,
            };
            let done = false;
            const progress = {
                report: async (value) => {
                    if (!request.live && value.edits?.length) {
                        throw new Error('Progress reporting is only supported for live sessions');
                    }
                    if (done || token.isCancellationRequested) {
                        return;
                    }
                    await this._proxy.$handleProgressChunk(request.requestId, {
                        message: value.message,
                        edits: value.edits?.map(typeConvert.TextEdit.from),
                        editsShouldBeInstant: value.editsShouldBeInstant,
                        slashCommand: value.slashCommand?.command,
                        markdownFragment: extHostTypes.MarkdownString.isMarkdownString(value.content) ? value.content.value : value.content
                    });
                }
            };
            const task = Promise.resolve(entry.provider.provideInteractiveEditorResponse(sessionData.session, apiRequest, progress, token));
            let res;
            try {
                res = await (0, async_1.raceCancellation)(task, token);
            }
            finally {
                done = true;
            }
            if (!res) {
                return undefined;
            }
            const id = sessionData.responses.push(res) - 1;
            const stub = {
                wholeRange: typeConvert.Range.from(res.wholeRange),
                placeholder: res.placeholder,
            };
            if (!ExtHostInteractiveEditor._isEditResponse(res)) {
                return {
                    ...stub,
                    id,
                    type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                    message: typeConvert.MarkdownString.from(res.contents),
                    edits: []
                };
            }
            const { edits, contents } = res;
            const message = contents !== undefined ? typeConvert.MarkdownString.from(contents) : undefined;
            if (edits instanceof extHostTypes.WorkspaceEdit) {
                return {
                    ...stub,
                    id,
                    type: "bulkEdit" /* InlineChatResponseType.BulkEdit */,
                    edits: typeConvert.WorkspaceEdit.from(edits),
                    message
                };
            }
            else {
                return {
                    ...stub,
                    id,
                    type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                    edits: edits.map(typeConvert.TextEdit.from),
                    message
                };
            }
        }
        async $provideFollowups(handle, sessionId, responseId, token) {
            const entry = this._inputProvider.get(handle);
            const sessionData = this._inputSessions.get(sessionId);
            const response = sessionData?.responses[responseId];
            if (entry && response && entry.provider.provideFollowups) {
                const task = Promise.resolve(entry.provider.provideFollowups(sessionData.session, response, token));
                const followups = await (0, async_1.raceCancellation)(task, token);
                return followups?.map(typeConvert.ChatInlineFollowup.from);
            }
            return undefined;
        }
        $handleFeedback(handle, sessionId, responseId, kind) {
            const entry = this._inputProvider.get(handle);
            const sessionData = this._inputSessions.get(sessionId);
            const response = sessionData?.responses[responseId];
            if (entry && response) {
                const apiKind = typeConvert.InteractiveEditorResponseFeedbackKind.to(kind);
                entry.provider.handleInteractiveEditorResponseFeedback?.(sessionData.session, response, apiKind);
            }
        }
        $releaseSession(handle, sessionId) {
            // TODO@jrieken remove this
        }
        static _isEditResponse(thing) {
            return typeof thing === 'object' && typeof thing.edits === 'object';
        }
    }
    exports.ExtHostInteractiveEditor = ExtHostInteractiveEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdElubGluZUNoYXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0SW5saW5lQ2hhdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQU0sZUFBZTtpQkFFTCxVQUFLLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFJekIsWUFDVSxTQUFpRCxFQUNqRCxRQUFpRDtZQURqRCxjQUFTLEdBQVQsU0FBUyxDQUF3QztZQUNqRCxhQUFRLEdBQVIsUUFBUSxDQUF5QztZQUpsRCxXQUFNLEdBQVcsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBSzlDLENBQUM7O0lBR04sTUFBTSxjQUFjO1FBSW5CLFlBQ1UsT0FBd0M7WUFBeEMsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7WUFIekMsY0FBUyxHQUFtRixFQUFFLENBQUM7UUFJcEcsQ0FBQztLQUNMO0lBRUQsTUFBYSx3QkFBd0I7aUJBRXJCLFlBQU8sR0FBRyxDQUFDLEFBQUosQ0FBSztRQU0zQixZQUNDLFdBQXlCLEVBQ3pCLGVBQWdDLEVBQ2YsVUFBNEIsRUFDNUIsV0FBd0I7WUFEeEIsZUFBVSxHQUFWLFVBQVUsQ0FBa0I7WUFDNUIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFSekIsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUNwRCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUEwQixDQUFDO1lBU25FLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFrQnJFLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLDRCQUFVLENBQ2hELHlCQUF5QixFQUFFLGtCQUFrQixFQUFFLGtDQUFrQyxFQUNqRixDQUFDLElB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