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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "./extHost.protocol", "vs/workbench/services/extensions/common/extensions"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, uri_1, languages, extensions_1, extHostTypeConverter, types, extHost_protocol_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExtHostComments = createExtHostComments;
    function createExtHostComments(mainContext, commands, documents) {
        const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadComments);
        class ExtHostCommentsImpl {
            static { this.handlePool = 0; }
            constructor() {
                this._commentControllers = new Map();
                this._commentControllersByExtension = new extensions_1.ExtensionIdentifierMap();
                commands.registerArgumentProcessor({
                    processArgument: arg => {
                        if (arg && arg.$mid === 6 /* MarshalledId.CommentController */) {
                            const commentController = this._commentControllers.get(arg.handle);
                            if (!commentController) {
                                return arg;
                            }
                            return commentController.value;
                        }
                        else if (arg && arg.$mid === 7 /* MarshalledId.CommentThread */) {
                            const marshalledCommentThread = arg;
                            const commentController = this._commentControllers.get(marshalledCommentThread.commentControlHandle);
                            if (!commentController) {
                                return marshalledCommentThread;
                            }
                            const commentThread = commentController.getCommentThread(marshalledCommentThread.commentThreadHandle);
                            if (!commentThread) {
                                return marshalledCommentThread;
                            }
                            return commentThread.value;
                        }
                        else if (arg && (arg.$mid === 9 /* MarshalledId.CommentThreadReply */ || arg.$mid === 8 /* MarshalledId.CommentThreadInstance */)) {
                            const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                            if (!commentController) {
                                return arg;
                            }
                            const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                            if (!commentThread) {
                                return arg;
                            }
                            if (arg.$mid === 8 /* MarshalledId.CommentThreadInstance */) {
                                return commentThread.value;
                            }
                            return {
                                thread: commentThread.value,
                                text: arg.text
                            };
                        }
                        else if (arg && arg.$mid === 10 /* MarshalledId.CommentNode */) {
                            const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                            if (!commentController) {
                                return arg;
                            }
                            const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                            if (!commentThread) {
                                return arg;
                            }
                            const commentUniqueId = arg.commentUniqueId;
                            const comment = commentThread.getCommentByUniqueId(commentUniqueId);
                            if (!comment) {
                                return arg;
                            }
                            return comment;
                        }
                        else if (arg && arg.$mid === 11 /* MarshalledId.CommentThreadNode */) {
                            const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                            if (!commentController) {
                                return arg;
                            }
                            const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                            if (!commentThread) {
                                return arg;
                            }
                            const body = arg.text;
                            const commentUniqueId = arg.commentUniqueId;
                            const comment = commentThread.getCommentByUniqueId(commentUniqueId);
                            if (!comment) {
                                return arg;
                            }
                            // If the old comment body was a markdown string, use a markdown string here too.
                            if (typeof comment.body === 'string') {
                                comment.body = body;
                            }
                            else {
                                comment.body = new types.MarkdownString(body);
                            }
                            return comment;
                        }
                        return arg;
                    }
                });
            }
            createCommentController(extension, id, label) {
                const handle = ExtHostCommentsImpl.handlePool++;
                const commentController = new ExtHostCommentController(extension, handle, id, label);
                this._commentControllers.set(commentController.handle, commentController);
                const commentControllers = this._commentControllersByExtension.get(extension.identifier) || [];
                commentControllers.push(commentController);
                this._commentControllersByExtension.set(extension.identifier, commentControllers);
                return commentController.value;
            }
            async $createCommentThreadTemplate(commentControllerHandle, uriComponents, range) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController) {
                    return;
                }
                commentController.$createCommentThreadTemplate(uriComponents, range);
            }
            async $setActiveComment(controllerHandle, commentInfo) {
                const commentController = this._commentControllers.get(controllerHandle);
                if (!commentController) {
                    return;
                }
                commentController.$setActiveComment(commentInfo ?? undefined);
            }
            async $updateCommentThreadTemplate(commentControllerHandle, threadHandle, range) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController) {
                    return;
                }
                commentController.$updateCommentThreadTemplate(threadHandle, range);
            }
            $deleteCommentThread(commentControllerHandle, commentThreadHandle) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                commentController?.$deleteCommentThread(commentThreadHandle);
            }
            async $provideCommentingRanges(commentControllerHandle, uriComponents, token) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController || !commentController.commentingRangeProvider) {
                    return Promise.resolve(undefined);
                }
                const document = await documents.ensureDocumentData(uri_1.URI.revive(uriComponents));
                return (0, async_1.asPromise)(async () => {
                    const rangesResult = await commentController.commentingRangeProvider.provideCommentingRanges(document.document, token);
                    let ranges;
                    if (Array.isArray(rangesResult)) {
                        ranges = {
                            ranges: rangesResult,
                            fileComments: false
                        };
                    }
                    else if (rangesResult) {
                        ranges = {
                            ranges: rangesResult.ranges || [],
                            fileComments: rangesResult.fileComments || false
                        };
                    }
                    else {
                        ranges = rangesResult ?? undefined;
                    }
                    return ranges;
                }).then(ranges => {
                    let convertedResult = undefined;
                    if (ranges) {
                        convertedResult = {
                            ranges: ranges.ranges.map(x => extHostTypeConverter.Range.from(x)),
                            fileComments: ranges.fileComments
                        };
                    }
                    return convertedResult;
                });
            }
            $toggleReaction(commentControllerHandle, threadHandle, uri, comment, reaction) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController || !commentController.reactionHandler) {
                    return Promise.resolve(undefined);
                }
                return (0, async_1.asPromise)(() => {
                    const commentThread = commentController.getCommentThread(threadHandle);
                    if (commentThread) {
                        const vscodeComment = commentThread.getCommentByUniqueId(comment.uniqueIdInThread);
                        if (commentController !== undefined && vscodeComment) {
                            if (commentController.reactionHandler) {
                                return commentController.reactionHandler(vscodeComment, convertFromReaction(reaction));
                            }
                        }
                    }
                    return Promise.resolve(undefined);
                });
            }
        }
        class ExtHostCommentThread {
            static { this._handlePool = 0; }
            set threadId(id) {
                this._id = id;
            }
            get threadId() {
                return this._id;
            }
            get id() {
                return this._id;
            }
            get resource() {
                return this._uri;
            }
            get uri() {
                return this._uri;
            }
            set range(range) {
                if (((range === undefined) !== (this._range === undefined)) || (!range || !this._range || !range.isEqual(this._range))) {
                    this._range = range;
                    this.modifications.range = range;
                    this._onDidUpdateCommentThread.fire();
                }
            }
            get range() {
                return this._range;
            }
            set canReply(state) {
                if (this._canReply !== state) {
                    this._canReply = state;
                    this.modifications.canReply = state;
                    this._onDidUpdateCommentThread.fire();
                }
            }
            get canReply() {
                return this._canReply;
            }
            get label() {
                return this._label;
            }
            set label(label) {
                this._label = label;
                this.modifications.label = label;
                this._onDidUpdateCommentThread.fire();
            }
            get contextValue() {
                return this._contextValue;
            }
            set contextValue(context) {
                this._contextValue = context;
                this.modifications.contextValue = context;
                this._onDidUpdateCommentThread.fire();
            }
            get comments() {
                return this._comments;
            }
            set comments(newComments) {
                this._comments = newComments;
                this.modifications.comments = newComments;
                this._onDidUpdateCommentThread.fire();
            }
            get collapsibleState() {
                return this._collapseState;
            }
            set collapsibleState(newState) {
                this._collapseState = newState;
                this.modifications.collapsibleState = newState;
                this._onDidUpdateCommentThread.fire();
            }
            get state() {
                return this._state;
            }
            set state(newState) {
                this._state = newState;
                if (typeof newState === 'object') {
                    (0, extensions_2.checkProposedApiEnabled)(this.extensionDescription, 'commentThreadApplicability');
                    this.modifications.state = newState.resolved;
                    this.modifications.applicability = newState.applicability;
                }
                else {
                    this.modifications.state = newState;
                }
                this._onDidUpdateCommentThread.fire();
            }
            get isDisposed() {
                return this._isDiposed;
            }
            constructor(commentControllerId, _commentControllerHandle, _id, _uri, _range, _comments, extensionDescription, _isTemplate) {
                this._commentControllerHandle = _commentControllerHandle;
                this._id = _id;
                this._uri = _uri;
                this._range = _range;
                this._comments = _comments;
                this.extensionDescription = extensionDescription;
                this._isTemplate = _isTemplate;
                this.handle = ExtHostCommentThread._handlePool++;
                this.commentHandle = 0;
                this.modifications = Object.create(null);
                this._onDidUpdateCommentThread = new event_1.Emitter();
                this.onDidUpdateCommentThread = this._onDidUpdateCommentThread.event;
                this._canReply = true;
                this._commentsMap = new Map();
                this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
                this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
                if (this._id === undefined) {
                    this._id = `${commentControllerId}.${this.handle}`;
                }
                proxy.$createCommentThread(_commentControllerHandle, this.handle, this._id, this._uri, extHostTypeConverter.Range.from(this._range), extensionDescription.identifier, this._isTemplate);
                this._localDisposables = [];
                this._isDiposed = false;
                this._localDisposables.push(this.onDidUpdateCommentThread(() => {
                    this.eventuallyUpdateCommentThread();
                }));
                // set up comments after ctor to batch update events.
                this.comments = _comments;
                this._localDisposables.push({
                    dispose: () => {
                        proxy.$deleteCommentThread(_commentControllerHandle, this.handle);
                    }
                });
                const that = this;
                this.value = {
                    get uri() { return that.uri; },
                    get range() { return that.range; },
                    set range(value) { that.range = value; },
                    get comments() { return that.comments; },
                    set comments(value) { that.comments = value; },
                    get collapsibleState() { return that.collapsibleState; },
                    set collapsibleState(value) { that.collapsibleState = value; },
                    get canReply() { return that.canReply; },
                    set canReply(state) { that.canReply = state; },
                    get contextValue() { return that.contextValue; },
                    set contextValue(value) { that.contextValue = value; },
                    get label() { return that.label; },
                    set label(value) { that.label = value; },
                    get state() { return that.state; },
                    set state(value) { that.state = value; },
                    dispose: () => {
                        that.dispose();
                    }
                };
            }
            updateIsTemplate() {
                if (this._isTemplate) {
                    this._isTemplate = false;
                    this.modifications.isTemplate = false;
                }
            }
            eventuallyUpdateCommentThread() {
                if (this._isDiposed) {
                    return;
                }
                this.updateIsTemplate();
                if (!this._acceptInputDisposables.value) {
                    this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
                }
                const modified = (value) => Object.prototype.hasOwnProperty.call(this.modifications, value);
                const formattedModifications = {};
                if (modified('range')) {
                    formattedModifications.range = extHostTypeConverter.Range.from(this._range);
                }
                if (modified('label')) {
                    formattedModifications.label = this.label;
                }
                if (modified('contextValue')) {
                    /*
                     * null -> cleared contextValue
                     * undefined -> no change
                     */
                    formattedModifications.contextValue = this.contextValue ?? null;
                }
                if (modified('comments')) {
                    formattedModifications.comments =
                        this._comments.map(cmt => convertToDTOComment(this, cmt, this._commentsMap, this.extensionDescription));
                }
                if (modified('collapsibleState')) {
                    formattedModifications.collapseState = convertToCollapsibleState(this._collapseState);
                }
                if (modified('canReply')) {
                    formattedModifications.canReply = this.canReply;
                }
                if (modified('state')) {
                    formattedModifications.state = convertToState(this._state);
                }
                if (modified('applicability')) {
                    formattedModifications.applicability = convertToRelevance(this._state);
                }
                if (modified('isTemplate')) {
                    formattedModifications.isTemplate = this._isTemplate;
                }
                this.modifications = {};
                proxy.$updateCommentThread(this._commentControllerHandle, this.handle, this._id, this._uri, formattedModifications);
            }
            getCommentByUniqueId(uniqueId) {
                for (const key of this._commentsMap) {
                    const comment = key[0];
                    const id = key[1];
                    if (uniqueId === id) {
                        return comment;
                    }
                }
                return;
            }
            dispose() {
                this._isDiposed = true;
                this._acceptInputDisposables.dispose();
                this._localDisposables.forEach(disposable => disposable.dispose());
            }
        }
        __decorate([
            (0, decorators_1.debounce)(100)
        ], ExtHostCommentThread.prototype, "eventuallyUpdateCommentThread", null);
        class ExtHostCommentController {
            get id() {
                return this._id;
            }
            get label() {
                return this._label;
            }
            get handle() {
                return this._handle;
            }
            get commentingRangeProvider() {
                return this._commentingRangeProvider;
            }
            set commentingRangeProvider(provider) {
                this._commentingRangeProvider = provider;
                if (provider?.resourceHints) {
                    (0, extensions_2.checkProposedApiEnabled)(this._extension, 'commentingRangeHint');
                }
                proxy.$updateCommentingRanges(this.handle, provider?.resourceHints);
            }
            get reactionHandler() {
                return this._reactionHandler;
            }
            set reactionHandler(handler) {
                this._reactionHandler = handler;
                proxy.$updateCommentControllerFeatures(this.handle, { reactionHandler: !!handler });
            }
            get options() {
                return this._options;
            }
            set options(options) {
                this._options = options;
                proxy.$updateCommentControllerFeatures(this.handle, { options: this._options });
            }
            get activeComment() {
                (0, extensions_2.checkProposedApiEnabled)(this._extension, 'activeComment');
                return this._activeComment;
            }
            get activeCommentThread() {
                (0, extensions_2.checkProposedApiEnabled)(this._extension, 'activeComment');
                return this._activeThread;
            }
            constructor(_extension, _handle, _id, _label) {
                this._extension = _extension;
                this._handle = _handle;
                this._id = _id;
                this._label = _label;
                this._threads = new Map();
                proxy.$registerCommentController(this.handle, _id, _label, this._extension.identifier.value);
                const that = this;
                this.value = Object.freeze({
                    id: that.id,
                    label: that.label,
                    get options() { return that.options; },
                    set options(options) { that.options = options; },
                    get commentingRangeProvider() { return that.commentingRangeProvider; },
                    set commentingRangeProvider(commentingRangeProvider) { that.commentingRangeProvider = commentingRangeProvider; },
                    get reactionHandler() { return that.reactionHandler; },
                    set reactionHandler(handler) { that.reactionHandler = handler; },
                    // get activeComment(): vscode.Comment | undefined { return that.activeComment; },
                    get activeCommentThread() { return that.activeCommentThread; },
                    createCommentThread(uri, range, comments) {
                        return that.createCommentThread(uri, range, comments).value;
                    },
                    dispose: () => { that.dispose(); },
                }); // TODO @alexr00 remove this cast when the proposed API is stable
                this._localDisposables = [];
                this._localDisposables.push({
                    dispose: () => {
                        proxy.$unregisterCommentController(this.handle);
                    }
                });
            }
            createCommentThread(resource, range, comments) {
                if (range === undefined) {
                    (0, extensions_2.checkProposedApiEnabled)(this._extension, 'fileComments');
                }
                const commentThread = new ExtHostCommentThread(this.id, this.handle, undefined, resource, range, comments, this._extension, false);
                this._threads.set(commentThread.handle, commentThread);
                return commentThread;
            }
            $setActiveComment(commentInfo) {
                if (!commentInfo) {
                    this._activeComment = undefined;
                    this._activeThread = undefined;
                    return;
                }
                const thread = this._threads.get(commentInfo.commentThreadHandle);
                if (thread) {
                    this._activeComment = commentInfo.uniqueIdInThread ? thread.getCommentByUniqueId(commentInfo.uniqueIdInThread) : undefined;
                    this._activeThread = thread;
                }
            }
            $createCommentThreadTemplate(uriComponents, range) {
                const commentThread = new ExtHostCommentThread(this.id, this.handle, undefined, uri_1.URI.revive(uriComponents), extHostTypeConverter.Range.to(range), [], this._extension, true);
                commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
                this._threads.set(commentThread.handle, commentThread);
                return commentThread;
            }
            $updateCommentThreadTemplate(threadHandle, range) {
                const thread = this._threads.get(threadHandle);
                if (thread) {
                    thread.range = extHostTypeConverter.Range.to(range);
                }
            }
            $deleteCommentThread(threadHandle) {
                const thread = this._threads.get(threadHandle);
                thread?.dispose();
                this._threads.delete(threadHandle);
            }
            getCommentThread(handle) {
                return this._threads.get(handle);
            }
            dispose() {
                this._threads.forEach(value => {
                    value.dispose();
                });
                this._localDisposables.forEach(disposable => disposable.dispose());
            }
        }
        function convertToDTOComment(thread, vscodeComment, commentsMap, extension) {
            let commentUniqueId = commentsMap.get(vscodeComment);
            if (!commentUniqueId) {
                commentUniqueId = ++thread.commentHandle;
                commentsMap.set(vscodeComment, commentUniqueId);
            }
            if (vscodeComment.state !== undefined) {
                (0, extensions_2.checkProposedApiEnabled)(extension, 'commentsDraftState');
            }
            if (vscodeComment.reactions?.some(reaction => reaction.reactors !== undefined)) {
                (0, extensions_2.checkProposedApiEnabled)(extension, 'commentReactor');
            }
            return {
                mode: vscodeComment.mode,
                contextValue: vscodeComment.contextValue,
                uniqueIdInThread: commentUniqueId,
                body: (typeof vscodeComment.body === 'string') ? vscodeComment.body : extHostTypeConverter.MarkdownString.from(vscodeComment.body),
                userName: vscodeComment.author.name,
                userIconPath: vscodeComment.author.iconPath,
                label: vscodeComment.label,
                commentReactions: vscodeComment.reactions ? vscodeComment.reactions.map(reaction => convertToReaction(reaction)) : undefined,
                state: vscodeComment.state,
                timestamp: vscodeComment.timestamp?.toJSON()
            };
        }
        function convertToReaction(reaction) {
            return {
                label: reaction.label,
                iconPath: reaction.iconPath ? extHostTypeConverter.pathOrURIToURI(reaction.iconPath) : undefined,
                count: reaction.count,
                hasReacted: reaction.authorHasReacted,
                reactors: ((reaction.reactors && (reaction.reactors.length > 0) && (typeof reaction.reactors[0] !== 'string')) ? reaction.reactors.map(reactor => reactor.name) : reaction.reactors)
            };
        }
        function convertFromReaction(reaction) {
            return {
                label: reaction.label || '',
                count: reaction.count || 0,
                iconPath: reaction.iconPath ? uri_1.URI.revive(reaction.iconPath) : '',
                authorHasReacted: reaction.hasReacted || false,
                reactors: reaction.reactors?.map(reactor => ({ name: reactor }))
            };
        }
        function convertToCollapsibleState(kind) {
            if (kind !== undefined) {
                switch (kind) {
                    case types.CommentThreadCollapsibleState.Expanded:
                        return languages.CommentThreadCollapsibleState.Expanded;
                    case types.CommentThreadCollapsibleState.Collapsed:
                        return languages.CommentThreadCollapsibleState.Collapsed;
                }
            }
            return languages.CommentThreadCollapsibleState.Collapsed;
        }
        function convertToState(kind) {
            let resolvedKind;
            if (typeof kind === 'object') {
                resolvedKind = kind.resolved;
            }
            else {
                resolvedKind = kind;
            }
            if (resolvedKind !== undefined) {
                switch (resolvedKind) {
                    case types.CommentThreadState.Unresolved:
                        return languages.CommentThreadState.Unresolved;
                    case types.CommentThreadState.Resolved:
                        return languages.CommentThreadState.Resolved;
                }
            }
            return languages.CommentThreadState.Unresolved;
        }
        function convertToRelevance(kind) {
            let applicabilityKind = undefined;
            if (typeof kind === 'object') {
                applicabilityKind = kind.applicability;
            }
            if (applicabilityKind !== undefined) {
                switch (applicabilityKind) {
                    case types.CommentThreadApplicability.Current:
                        return languages.CommentThreadApplicability.Current;
                    case types.CommentThreadApplicability.Outdated:
                        return languages.CommentThreadApplicability.Outdated;
                }
            }
            return languages.CommentThreadApplicability.Current;
        }
        return new ExtHostCommentsImpl();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdENvbW1lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7O0lBMkJoRyxzREFpeEJDO0lBanhCRCxTQUFnQixxQkFBcUIsQ0FBQyxXQUF5QixFQUFFLFFBQXlCLEVBQUUsU0FBMkI7UUFDdEgsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFbkUsTUFBTSxtQkFBbUI7cUJBRVQsZUFBVSxHQUFHLENBQUMsQUFBSixDQUFLO1lBUTlCO2dCQUxRLHdCQUFtQixHQUFrRCxJQUFJLEdBQUcsRUFBNEMsQ0FBQztnQkFFekgsbUNBQThCLEdBQXVELElBQUksbUNBQXNCLEVBQThCLENBQUM7Z0JBS3JKLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQztvQkFDbEMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxFQUFFO3dCQUN0QixJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSwyQ0FBbUMsRUFBRSxDQUFDOzRCQUN4RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUVuRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQ0FDeEIsT0FBTyxHQUFHLENBQUM7NEJBQ1osQ0FBQzs0QkFFRCxPQUFPLGlCQUFpQixDQUFDLEtBQUssQ0FBQzt3QkFDaEMsQ0FBQzs2QkFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSx1Q0FBK0IsRUFBRSxDQUFDOzRCQUMzRCxNQUFNLHVCQUF1QixHQUE0QixHQUFHLENBQUM7NEJBQzdELE1B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