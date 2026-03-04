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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentsView", "../common/extHost.protocol", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/common/views", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/nls", "vs/base/common/network", "vs/workbench/services/views/common/viewsService"], function (require, exports, event_1, lifecycle_1, uri_1, range_1, platform_1, extHostCustomers_1, commentService_1, commentsView_1, extHost_protocol_1, commentsTreeViewer_1, views_1, descriptors_1, viewPaneContainer_1, codicons_1, iconRegistry_1, nls_1, network_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadComments = exports.MainThreadCommentController = exports.MainThreadCommentThread = void 0;
    class MainThreadCommentThread {
        get input() {
            return this._input;
        }
        set input(value) {
            this._input = value;
            this._onDidChangeInput.fire(value);
        }
        get onDidChangeInput() { return this._onDidChangeInput.event; }
        get label() {
            return this._label;
        }
        set label(label) {
            this._label = label;
            this._onDidChangeLabel.fire(this._label);
        }
        get contextValue() {
            return this._contextValue;
        }
        set contextValue(context) {
            this._contextValue = context;
        }
        get comments() {
            return this._comments;
        }
        set comments(newComments) {
            this._comments = newComments;
            this._onDidChangeComments.fire(this._comments);
        }
        get onDidChangeComments() { return this._onDidChangeComments.event; }
        set range(range) {
            this._range = range;
            this._onDidChangeRange.fire(this._range);
        }
        get range() {
            return this._range;
        }
        get onDidChangeCanReply() { return this._onDidChangeCanReply.event; }
        set canReply(state) {
            this._canReply = state;
            this._onDidChangeCanReply.fire(this._canReply);
        }
        get canReply() {
            return this._canReply;
        }
        get collapsibleState() {
            return this._collapsibleState;
        }
        set collapsibleState(newState) {
            this._collapsibleState = newState;
            this._onDidChangeCollapsibleState.fire(this._collapsibleState);
        }
        get initialCollapsibleState() {
            return this._initialCollapsibleState;
        }
        set initialCollapsibleState(initialCollapsibleState) {
            this._initialCollapsibleState = initialCollapsibleState;
            if (this.collapsibleState === undefined) {
                this.collapsibleState = this.initialCollapsibleState;
            }
            this._onDidChangeInitialCollapsibleState.fire(initialCollapsibleState);
        }
        get isDisposed() {
            return this._isDisposed;
        }
        isDocumentCommentThread() {
            return this._range === undefined || range_1.Range.isIRange(this._range);
        }
        get state() {
            return this._state;
        }
        set state(newState) {
            this._state = newState;
            this._onDidChangeState.fire(this._state);
        }
        get applicability() {
            return this._applicability;
        }
        set applicability(value) {
            this._applicability = value;
            this._onDidChangeApplicability.fire(value);
        }
        get isTemplate() {
            return this._isTemplate;
        }
        constructor(commentThreadHandle, controllerHandle, extensionId, threadId, resource, _range, _canReply, _isTemplate) {
            this.commentThreadHandle = commentThreadHandle;
            this.controllerHandle = controllerHandle;
            this.extensionId = extensionId;
            this.threadId = threadId;
            this.resource = resource;
            this._range = _range;
            this._canReply = _canReply;
            this._isTemplate = _isTemplate;
            this._onDidChangeInput = new event_1.Emitter();
            this._onDidChangeLabel = new event_1.Emitter();
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this._onDidChangeComments = new event_1.Emitter();
            this._onDidChangeCanReply = new event_1.Emitter();
            this._onDidChangeRange = new event_1.Emitter();
            this.onDidChangeRange = this._onDidChangeRange.event;
            this._onDidChangeCollapsibleState = new event_1.Emitter();
            this.onDidChangeCollapsibleState = this._onDidChangeCollapsibleState.event;
            this._onDidChangeInitialCollapsibleState = new event_1.Emitter();
            this.onDidChangeInitialCollapsibleState = this._onDidChangeInitialCollapsibleState.event;
            this._onDidChangeApplicability = new event_1.Emitter();
            this.onDidChangeApplicability = this._onDidChangeApplicability.event;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._isDisposed = false;
            if (_isTemplate) {
                this.comments = [];
            }
        }
        batchUpdate(changes) {
            const modified = (value) => Object.prototype.hasOwnProperty.call(changes, value);
            if (modified('range')) {
                this._range = changes.range;
            }
            if (modified('label')) {
                this._label = changes.label;
            }
            if (modified('contextValue')) {
                this._contextValue = changes.contextValue === null ? undefined : changes.contextValue;
            }
            if (modified('comments')) {
                this._comments = changes.comments;
            }
            if (modified('collapseState')) {
                this.initialCollapsibleState = changes.collapseState;
            }
            if (modified('canReply')) {
                this.canReply = changes.canReply;
            }
            if (modified('state')) {
                this.state = changes.state;
            }
            if (modified('applicability')) {
                this.applicability = changes.applicability;
            }
            if (modified('isTemplate')) {
                this._isTemplate = changes.isTemplate;
            }
        }
        dispose() {
            this._isDisposed = true;
            this._onDidChangeCollapsibleState.dispose();
            this._onDidChangeComments.dispose();
            this._onDidChangeInput.dispose();
            this._onDidChangeLabel.dispose();
            this._onDidChangeRange.dispose();
            this._onDidChangeState.dispose();
        }
        toJSON() {
            return {
                $mid: 7 /* MarshalledId.CommentThread */,
                commentControlHandle: this.controllerHandle,
                commentThreadHandle: this.commentThreadHandle,
            };
        }
    }
    exports.MainThreadCommentThread = MainThreadCommentThread;
    class MainThreadCommentController {
        get handle() {
            return this._handle;
        }
        get id() {
            return this._id;
        }
        get contextValue() {
            return this._id;
        }
        get proxy() {
            return this._proxy;
        }
        get label() {
            return this._label;
        }
        get reactions() {
            return this._reactions;
        }
        set reactions(reactions) {
            this._reactions = reactions;
        }
        get options() {
            return this._features.options;
        }
        get features() {
            return this._features;
        }
        get owner() {
            return this._id;
        }
        constructor(_proxy, _commentService, _handle, _uniqueId, _id, _label, _features) {
            this._proxy = _proxy;
            this._commentService = _commentService;
            this._handle = _handle;
            this._uniqueId = _uniqueId;
            this._id = _id;
            this._label = _label;
            this._features = _features;
            this._threads = new Map();
        }
        async setActiveCommentAndThread(commentInfo) {
            return this._proxy.$setActiveComment(this._handle, commentInfo ? { commentThreadHandle: commentInfo.thread.commentThreadHandle, uniqueIdInThread: commentInfo.comment?.uniqueIdInThread } : undefined);
        }
        updateFeatures(features) {
            this._features = features;
        }
        createCommentThread(extensionId, commentThreadHandle, threadId, resource, range, isTemplate) {
            const thread = new MainThreadCommentThread(commentThreadHandle, this.handle, extensionId, threadId, uri_1.URI.revive(resource).toString(), range, true, isTemplate);
            this._threads.set(commentThreadHandle, thread);
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [thread],
                    removed: [],
                    changed: [],
                    pending: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [thread],
                    removed: [],
                    changed: [],
                    pending: []
                });
            }
            return thread;
        }
        updateCommentThread(commentThreadHandle, threadId, resource, changes) {
            const thread = this.getKnownThread(commentThreadHandle);
            thread.batchUpdate(changes);
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [],
                    removed: [],
                    changed: [thread],
                    pending: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [],
                    removed: [],
                    changed: [thread],
                    pending: []
                });
            }
        }
        deleteCommentThread(commentThreadHandle) {
            const thread = this.getKnownThread(commentThreadHandle);
            this._threads.delete(commentThreadHandle);
            thread.dispose();
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [],
                    removed: [thread],
                    changed: [],
                    pending: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [],
                    removed: [thread],
                    changed: [],
                    pending: []
                });
            }
        }
        deleteCommentThreadMain(commentThreadId) {
            this._threads.forEach(thread => {
                if (thread.threadId === commentThreadId) {
                    this._proxy.$deleteCommentThread(this._handle, thread.commentThreadHandle);
                }
            });
        }
        updateInput(input) {
            const thread = this.activeEditingCommentThread;
            if (thread && thread.input) {
                const commentInput = thread.input;
                commentInput.value = input;
                thread.input = commentInput;
            }
        }
        updateCommentingRanges(resourceHints) {
            this._commentService.updateCommentingRanges(this._uniqueId, resourceHints);
        }
        getKnownThread(commentThreadHandle) {
            const thread = this._threads.get(commentThreadHandle);
            if (!thread) {
                throw new Error('unknown thread');
            }
            return thread;
        }
        async getDocumentComments(resource, token) {
            if (resource.scheme === network_1.Schemas.vscodeNotebookCell) {
                return {
                    uniqueOwner: this._uniqueId,
                    label: this.label,
                    threads: [],
                    commentingRanges: {
                        resource: resource,
                        ranges: [],
                        fileComments: false
                    }
                };
            }
            const ret = [];
            for (const thread of [...this._threads.keys()]) {
                const commentThread = this._threads.get(thread);
                if (commentThread.resource === resource.toString()) {
                    ret.push(commentThread);
                }
            }
            const commentingRanges = await this._proxy.$provideCommentingRanges(this.handle, resource, token);
            return {
                uniqueOwner: this._uniqueId,
                label: this.label,
                threads: ret,
                commentingRanges: {
                    resource: resource,
                    ranges: commentingRanges?.ranges || [],
                    fileComments: commentingRanges?.fileComments
                }
            };
        }
        async getNotebookComments(resource, token) {
            if (resource.scheme !== network_1.Schemas.vscodeNotebookCell) {
                return {
                    uniqueOwner: this._uniqueId,
                    label: this.label,
                    threads: []
                };
            }
            const ret = [];
            for (const thread of [...this._threads.keys()]) {
                const commentThread = this._threads.get(thread);
                if (commentThread.resource === resource.toString()) {
                    ret.push(commentThread);
                }
            }
            return {
                uniqueOwner: this._uniqueId,
                label: this.label,
                threads: ret
            };
        }
        async toggleReaction(uri, thread, comment, reaction, token) {
            return this._proxy.$toggleReaction(this._handle, thread.commentThreadHandle, uri, comment, reaction);
        }
        getAllComments() {
            const ret = [];
            for (const thread of [...this._threads.keys()]) {
                ret.push(this._threads.get(thread));
            }
            return ret;
        }
        createCommentThreadTemplate(resource, range) {
            return this._proxy.$createCommentThreadTemplate(this.handle, resource, range);
        }
        async updateCommentThreadTemplate(threadHandle, range) {
            await this._proxy.$updateCommentThreadTemplate(this.handle, threadHandle, range);
        }
        toJSON() {
            return {
                $mid: 6 /* MarshalledId.CommentController */,
                handle: this.handle
            };
        }
    }
    exports.MainThreadCommentController = MainThreadCommentController;
    const commentsViewIcon = (0, iconRegistry_1.registerIcon)('comments-view-icon', codicons_1.Codicon.commentDiscussion, (0, nls_1.localize)('commentsViewIcon', 'View icon of the comments view.'));
    let MainThreadComments = class MainThreadComments extends lifecycle_1.Disposable {
        constructor(extHostContext, _commentService, _viewsService, _viewDescriptorService) {
            super();
            this._commentService = _commentService;
            this._viewsService = _viewsService;
            this._viewDescriptorService = _viewDescriptorService;
            this._handlers = new Map();
            this._commentControllers = new Map();
            this._activeEditingCommentThreadDisposables = this._register(new lifecycle_1.DisposableStore());
            this._openViewListener = null;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostComments);
            this._commentService.unregisterCommentController();
            this._register(this._commentService.onDidChangeActiveEditingCommentThread(async (thread) => {
                const handle = thread.controllerHandle;
                const controller = this._commentControllers.get(handle);
                if (!controller) {
                    return;
                }
                this._activeEditingCommentThreadDisposables.clear();
                this._activeEditingCommentThread = thread;
                controller.activeEditingCommentThread = this._activeEditingCommentThread;
            }));
        }
        $registerCommentController(handle, id, label, extensionId) {
            const providerId = `${id}-${extensionId}`;
            this._handlers.set(handle, providerId);
            const provider = new MainThreadCommentController(this._proxy, this._commentService, handle, providerId, id, label, {});
            this._commentService.registerCommentController(providerId, provider);
            this._commentControllers.set(handle, provider);
            const commentsPanelAlreadyConstructed = !!this._viewDescriptorService.getViewDescriptorById(commentsTreeViewer_1.COMMENTS_VIEW_ID);
            if (!commentsPanelAlreadyConstructed) {
                this.registerView(commentsPanelAlreadyConstructed);
            }
            this.registerViewListeners(commentsPanelAlreadyConstructed);
            this._commentService.setWorkspaceComments(String(handle), []);
        }
        $unregisterCommentController(handle) {
            const providerId = this._handlers.get(handle);
            this._handlers.delete(handle);
            this._commentControllers.delete(handle);
            if (typeof providerId !== 'string') {
                return;
                // throw new Error('unknown handler');
            }
            else {
                this._commentService.unregisterCommentController(providerId);
            }
        }
        $updateCommentControllerFeatures(handle, features) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            provider.updateFeatures(features);
        }
        $createCommentThread(handle, commentThreadHandle, threadId, resource, range, extensionId, isTemplate) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.createCommentThread(extensionId.value, commentThreadHandle, threadId, resource, range, isTemplate);
        }
        $updateCommentThread(handle, commentThreadHandle, threadId, resource, changes) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.updateCommentThread(commentThreadHandle, threadId, resource, changes);
        }
        $deleteCommentThread(handle, commentThreadHandle) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            return provider.deleteCommentThread(commentThreadHandle);
        }
        $updateCommentingRanges(handle, resourceHints) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateCommentingRanges(resourceHints);
        }
        registerView(commentsViewAlreadyRegistered) {
            if (!commentsViewAlreadyRegistered) {
                const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                    id: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                    title: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [commentsTreeViewer_1.COMMENTS_VIEW_ID, { mergeViewWithContainerWhenSingleView: true }]),
                    storageId: commentsTreeViewer_1.COMMENTS_VIEW_STORAGE_ID,
                    hideIfEmpty: true,
                    icon: commentsViewIcon,
                    order: 10,
                }, 1 /* ViewContainerLocation.Panel */);
                platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
                        id: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                        name: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                        canToggleVisibility: false,
                        ctorDescriptor: new descriptors_1.SyncDescriptor(commentsView_1.CommentsPanel),
                        canMoveView: true,
                        containerIcon: commentsViewIcon,
                        focusCommand: {
                            id: 'workbench.action.focusCommentsPanel'
                        }
                    }], VIEW_CONTAINER);
            }
        }
        setComments() {
            [...this._commentControllers.keys()].forEach(handle => {
                const threads = this._commentControllers.get(handle).getAllComments();
                if (threads.length) {
                    const providerId = this.getHandler(handle);
                    this._commentService.setWorkspaceComments(providerId, threads);
                }
            });
        }
        registerViewOpenedListener() {
            if (!this._openViewListener) {
                this._openViewListener = this._viewsService.onDidChangeViewVisibility(e => {
                    if (e.id === commentsTreeViewer_1.COMMENTS_VIEW_ID && e.visible) {
                        this.setComments();
                        if (this._openViewListener) {
                            this._openViewListener.dispose();
                            this._openViewListener = null;
                        }
                    }
                });
            }
        }
        /**
         * If the comments view has never been opened, the constructor for it has not yet run so it has
         * no listeners for comment threads being set or updated. Listen for the view opening for the
         * first time and send it comments then.
         */
        registerViewListeners(commentsPanelAlreadyConstructed) {
            if (!commentsPanelAlreadyConstructed) {
                this.registerViewOpenedListener();
            }
            this._register(this._viewDescriptorService.onDidChangeContainer(e => {
                if (e.views.find(view => view.id === commentsTreeViewer_1.COMMENTS_VIEW_ID)) {
                    this.setComments();
                    this.registerViewOpenedListener();
                }
            }));
            this._register(this._viewDescriptorService.onDidChangeContainerLocation(e => {
                const commentsContainer = this._viewDescriptorService.getViewContainerByViewId(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                if (e.viewContainer.id === commentsContainer?.id) {
                    this.setComments();
                    this.registerViewOpenedListener();
                }
            }));
        }
        getHandler(handle) {
            if (!this._handlers.has(handle)) {
                throw new Error('Unknown handler');
            }
            return this._handlers.get(handle);
        }
    };
    exports.MainThreadComments = MainThreadComments;
    exports.MainThreadComments = MainThreadComments = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadComments),
        __param(1, commentService_1.ICommentService),
        __param(2, viewsService_1.IViewsService),
        __param(3, views_1.IViewDescriptorService)
    ], MainThreadComments);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRDb21tZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLE1BQWEsdUJBQXVCO1FBRW5DLElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxLQUFLLENBQUMsS0FBeUM7WUFDbEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBR0QsSUFBSSxnQkFBZ0IsS0FBZ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUkxRyxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLEtBQXlCO1lBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFJRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksWUFBWSxDQUFDLE9BQTJCO1lBQzNDLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDO1FBQzlCLENBQUM7UUFPRCxJQUFXLFFBQVE7WUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFXLFFBQVEsQ0FB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