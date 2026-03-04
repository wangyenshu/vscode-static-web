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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/configuration/common/configuration", "./inlineChatSessionService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/iterator", "vs/base/common/network", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/base/common/strings", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/log/common/log", "vs/base/common/event", "vs/workbench/contrib/inlineChat/browser/inlineChatController"], function (require, exports, async_1, lifecycle_1, editorBrowser_1, nls_1, configuration_1, inlineChatSessionService_1, editorGroupsService_1, editorService_1, filesConfigurationService_1, textfiles_1, iterator_1, network_1, notebookCommon_1, notebookBrowser_1, strings_1, workingCopyFileService_1, log_1, event_1, inlineChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatSavingServiceImpl = void 0;
    let InlineChatSavingServiceImpl = class InlineChatSavingServiceImpl {
        constructor(_fileConfigService, _editorGroupService, _textFileService, _editorService, _inlineChatSessionService, _configService, _workingCopyFileService, _logService) {
            this._fileConfigService = _fileConfigService;
            this._editorGroupService = _editorGroupService;
            this._textFileService = _textFileService;
            this._editorService = _editorService;
            this._inlineChatSessionService = _inlineChatSessionService;
            this._configService = _configService;
            this._workingCopyFileService = _workingCopyFileService;
            this._logService = _logService;
            this._store = new lifecycle_1.DisposableStore();
            this._saveParticipant = this._store.add(new lifecycle_1.MutableDisposable());
            this._sessionData = new Map();
            this._store.add(event_1.Event.any(_inlineChatSessionService.onDidEndSession, _inlineChatSessionService.onDidStashSession)(e => {
                this._sessionData.get(e.session)?.dispose();
            }));
        }
        dispose() {
            this._store.dispose();
            (0, lifecycle_1.dispose)(this._sessionData.values());
        }
        markChanged(session) {
            if (!this._sessionData.has(session)) {
                let uri = session.targetUri;
                // notebooks: use the notebook-uri because saving happens on the notebook-level
                if (uri.scheme === network_1.Schemas.vscodeNotebookCell) {
                    const data = notebookCommon_1.CellUri.parse(uri);
                    if (!data) {
                        return;
                    }
                    uri = data?.notebook;
                }
                if (this._sessionData.size === 0) {
                    this._installSaveParticpant();
                }
                const saveConfigOverride = this._fileConfigService.disableAutoSave(uri);
                this._sessionData.set(session, {
                    resourceUri: uri,
                    groupCandidate: this._editorGroupService.activeGroup,
                    session,
                    dispose: () => {
                        saveConfigOverride.dispose();
                        this._sessionData.delete(session);
                        if (this._sessionData.size === 0) {
                            this._saveParticipant.clear();
                        }
                    }
                });
            }
        }
        _installSaveParticpant() {
            const queue = new async_1.Queue();
            const d1 = this._textFileService.files.addSaveParticipant({
                participate: (model, ctx, progress, token) => {
                    return queue.queue(() => this._participate(ctx.savedFrom ?? model.textEditorModel?.uri, ctx.reason, progress, token));
                }
            });
            const d2 = this._workingCopyFileService.addSaveParticipant({
                participate: (workingCopy, ctx, progress, token) => {
                    return queue.queue(() => this._participate(ctx.savedFrom ?? workingCopy.resource, ctx.reason, progress, token));
                }
            });
            this._saveParticipant.value = (0, lifecycle_1.combinedDisposable)(d1, d2, queue);
        }
        async _participate(uri, reason, progress, token) {
            if (reason !== 1 /* SaveReason.EXPLICIT */) {
                // all saves that we are concerned about are explicit
                // because we have disabled auto-save for them
                return;
            }
            if (!this._configService.getValue("inlineChat.acceptedOrDiscardBeforeSave" /* InlineChatConfigKeys.AcceptedOrDiscardBeforeSave */)) {
                // disabled
                return;
            }
            const sessions = new Map();
            for (const [session, data] of this._sessionData) {
                if (uri?.toString() === data.resourceUri.toString()) {
                    sessions.set(session, data);
                }
            }
            if (sessions.size === 0) {
                return;
            }
            progress.report({
                message: sessions.size === 1
                    ? (0, nls_1.localize)('inlineChat', "Waiting for Inline Chat changes to be Accepted or Discarded...")
                    : (0, nls_1.localize)('inlineChat.N', "Waiting for Inline Chat changes in {0} editors to be Accepted or Discarded...", sessions.size)
            });
            // reveal all sessions in order and also show dangling sessions
            const { groups, orphans } = this._getGroupsAndOrphans(sessions.values());
            const editorsOpenedAndSessionsEnded = this._openAndWait(groups, token).then(() => {
                if (token.isCancellationRequested) {
                    return;
                }
                return this._openAndWait(iterator_1.Iterable.map(orphans, s => [this._editorGroupService.activeGroup, s]), token);
            });
            // fallback: resolve when all sessions for this model have been resolved. this is independent of the editor opening
            const allSessionsEnded = this._whenSessionsEnded(iterator_1.Iterable.concat(groups.map(tuple => tuple[1]), orphans), token);
            await Promise.race([allSessionsEnded, editorsOpenedAndSessionsEnded]);
        }
        _getGroupsAndOrphans(sessions) {
            const groupByEditor = new Map();
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                const candidate = group.activeEditorPane?.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(candidate)) {
                    groupByEditor.set(candidate, group);
                }
            }
            const groups = [];
            const orphans = new Set();
            for (const data of sessions) {
                const editor = this._inlineChatSessionService.getCodeEditor(data.session);
                const group = groupByEditor.get(editor);
                if (group) {
                    // there is only one session per group because all sessions have the same model
                    // because we save one file.
                    groups.push([group, data]);
                }
                else if (this._editorGroupService.groups.includes(data.groupCandidate)) {
                    // the group candidate is still there. use it
                    groups.push([data.groupCandidate, data]);
                }
                else {
                    orphans.add(data);
                }
            }
            return { groups, orphans };
        }
        async _openAndWait(groups, token) {
            const dataByGroup = new Map();
            for (const [group, data] of groups) {
                let array = dataByGroup.get(group);
                if (!array) {
                    array = [];
                    dataByGroup.set(group, array);
                }
                array.push(data);
            }
            for (const [group, array] of dataByGroup) {
                if (token.isCancellationRequested) {
                    break;
                }
                array.sort((a, b) => (0, strings_1.compare)(a.session.targetUri.toString(), b.session.targetUri.toString()));
                for (const data of array) {
                    const input = { resource: data.resourceUri };
                    const pane = await this._editorService.openEditor(input, group);
                    let editor;
                    if (data.session.targetUri.scheme === network_1.Schemas.vscodeNotebookCell) {
                        const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(pane);
                        const uriData = notebookCommon_1.CellUri.parse(data.session.targetUri);
                        if (notebookEditor && notebookEditor.hasModel() && uriData) {
                            const cell = notebookEditor.getCellByHandle(uriData.handle);
                            if (cell) {
                                await notebookEditor.revealRangeInCenterIfOutsideViewportAsync(cell, data.session.wholeRange.value);
                            }
                            const tuple = notebookEditor.codeEditors.find(tuple => tuple[1].getModel()?.uri.toString() === data.session.targetUri.toString());
                            editor = tuple?.[1];
                        }
                    }
                    else {
                        if ((0, editorBrowser_1.isCodeEditor)(pane?.getControl())) {
                            editor = pane.getControl();
                        }
                    }
                    if (!editor) {
                        // PANIC
                        break;
                    }
                    this._inlineChatSessionService.moveSession(data.session, editor);
                    inlineChatController_1.InlineChatController.get(editor)?.showSaveHint();
                    this._logService.info('WAIT for session to end', editor.getId(), data.session.targetUri.toString());
                    await this._whenSessionsEnded(iterator_1.Iterable.single(data), token);
                }
            }
        }
        async _whenSessionsEnded(iterable, token) {
            const sessions = new Map();
            for (const item of iterable) {
                sessions.set(item.session, item);
            }
            if (sessions.size === 0) {
                // nothing to do
                return;
            }
            let listener;
            const whenEnded = new Promise(resolve => {
                listener = event_1.Event.any(this._inlineChatSessionService.onDidEndSession, this._inlineChatSessionService.onDidStashSession)(e => {
                    const data = sessions.get(e.session);
                    if (data) {
                        data.dispose();
                        sessions.delete(e.session);
                        if (sessions.size === 0) {
                            resolve(); // DONE, release waiting
                        }
                    }
                });
            });
            try {
                await (0, async_1.raceCancellation)(whenEnded, token);
            }
            finally {
                listener?.dispose();
            }
        }
    };
    exports.InlineChatSavingServiceImpl = InlineChatSavingServiceImpl;
    exports.InlineChatSavingServiceImpl = InlineChatSavingServiceImpl = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorService_1.IEditorService),
        __param(4, inlineChatSessionService_1.IInlineChatSessionService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, workingCopyFileService_1.IWorkingCopyFileService),
        __param(7, log_1.ILogService)
    ], InlineChatSavingServiceImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNhdmluZ1NlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9icm93c2VyL2lubGluZUNoYXRTYXZpbmdTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQ3pGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBUXZDLFlBQzZCLGtCQUErRCxFQUNyRSxtQkFBMEQsRUFDOUQsZ0JBQW1ELEVBQ3JELGNBQStDLEVBQ3BDLHlCQUFxRSxFQUN6RSxjQUFzRCxFQUNwRCx1QkFBaUUsRUFDN0UsV0FBeUM7WUFQVCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTRCO1lBQ3BELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDN0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNwQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDbkIsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEyQjtZQUN4RCxtQkFBYyxHQUFkLGNBQWMsQ0FBdUI7WUFDbkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUM1RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQVp0QyxXQUFNLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDL0IscUJBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDNUQsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztZQVkvRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLGVBQWUsRUFBRSx5QkFBeUIsQ0FBQyxpQkFBaUIsQ0FB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