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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/workbench/contrib/comments/browser/commentMenus", "vs/workbench/services/layout/browser/layoutService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/comments/common/commentsConfiguration", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/platform/log/common/log", "vs/workbench/contrib/comments/browser/commentsModel", "vs/editor/common/services/model"], function (require, exports, instantiation_1, event_1, lifecycle_1, range_1, cancellation_1, commentMenus_1, layoutService_1, configuration_1, commentsConfiguration_1, contextkey_1, storage_1, commentContextKeys_1, log_1, commentsModel_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentService = exports.ICommentService = void 0;
    exports.ICommentService = (0, instantiation_1.createDecorator)('commentService');
    const CONTINUE_ON_COMMENTS = 'comments.continueOnComments';
    let CommentService = class CommentService extends lifecycle_1.Disposable {
        constructor(instantiationService, layoutService, configurationService, contextKeyService, storageService, logService, modelService) {
            super();
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.logService = logService;
            this.modelService = modelService;
            this._onDidSetDataProvider = this._register(new event_1.Emitter());
            this.onDidSetDataProvider = this._onDidSetDataProvider.event;
            this._onDidDeleteDataProvider = this._register(new event_1.Emitter());
            this.onDidDeleteDataProvider = this._onDidDeleteDataProvider.event;
            this._onDidSetResourceCommentInfos = this._register(new event_1.Emitter());
            this.onDidSetResourceCommentInfos = this._onDidSetResourceCommentInfos.event;
            this._onDidSetAllCommentThreads = this._register(new event_1.Emitter());
            this.onDidSetAllCommentThreads = this._onDidSetAllCommentThreads.event;
            this._onDidUpdateCommentThreads = this._register(new event_1.Emitter());
            this.onDidUpdateCommentThreads = this._onDidUpdateCommentThreads.event;
            this._onDidUpdateNotebookCommentThreads = this._register(new event_1.Emitter());
            this.onDidUpdateNotebookCommentThreads = this._onDidUpdateNotebookCommentThreads.event;
            this._onDidUpdateCommentingRanges = this._register(new event_1.Emitter());
            this.onDidUpdateCommentingRanges = this._onDidUpdateCommentingRanges.event;
            this._onDidChangeActiveEditingCommentThread = this._register(new event_1.Emitter());
            this.onDidChangeActiveEditingCommentThread = this._onDidChangeActiveEditingCommentThread.event;
            this._onDidChangeCurrentCommentThread = this._register(new event_1.Emitter());
            this.onDidChangeCurrentCommentThread = this._onDidChangeCurrentCommentThread.event;
            this._onDidChangeCommentingEnabled = this._register(new event_1.Emitter());
            this.onDidChangeCommentingEnabled = this._onDidChangeCommentingEnabled.event;
            this._onDidChangeActiveCommentingRange = this._register(new event_1.Emitter());
            this.onDidChangeActiveCommentingRange = this._onDidChangeActiveCommentingRange.event;
            this._commentControls = new Map();
            this._commentMenus = new Map();
            this._isCommentingEnabled = true;
            this._continueOnComments = new Map(); // uniqueOwner -> PendingCommentThread[]
            this._continueOnCommentProviders = new Set();
            this._commentsModel = this._register(new commentsModel_1.CommentsModel());
            this.commentsModel = this._commentsModel;
            this._commentingRangeResources = new Set(); // URIs
            this._commentingRangeResourceHintSchemes = new Set(); // schemes
            this._handleConfiguration();
            this._handleZenMode();
            this._workspaceHasCommenting = commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting.bindTo(contextKeyService);
            const storageListener = this._register(new lifecycle_1.DisposableStore());
            const storageEvent = event_1.Event.debounce(this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, CONTINUE_ON_COMMENTS, storageListener), (last, event) => last?.external ? last : event, 500);
            storageListener.add(storageEvent(v => {
                if (!v.external) {
                    return;
                }
                const commentsToRestore = this.storageService.getObject(CONTINUE_ON_COMMENTS, 1 /* StorageScope.WORKSPACE */);
                if (!commentsToRestore) {
                    return;
                }
                this.logService.debug(`Comments: URIs of continue on comments from storage ${commentsToRestore.map(thread => thread.uri.toString()).join(', ')}.`);
                const changedOwners = this._addContinueOnComments(commentsToRestore, this._continueOnComments);
                for (const uniqueOwner of changedOwners) {
                    const control = this._commentControls.get(uniqueOwner);
                    if (!control) {
                        continue;
                    }
                    const evt = {
                        uniqueOwner: uniqueOwner,
                        owner: control.owner,
                        ownerLabel: control.label,
                        pending: this._continueOnComments.get(uniqueOwner) || [],
                        added: [],
                        removed: [],
                        changed: []
                    };
                    this.updateModelThreads(evt);
                }
            }));
            this._register(storageService.onWillSaveState(() => {
                const map = new Map();
                for (const provider of this._continueOnCommentProviders) {
                    const pendingComments = provider.provideContinueOnComments();
                    this._addContinueOnComments(pendingComments, map);
                }
                this._saveContinueOnComments(map);
            }));
            this._register(this.modelService.onModelAdded(model => {
                // Allows comment providers to cause their commenting ranges to be prefetched by opening text documents in the background.
                if (!this._commentingRangeResources.has(model.uri.toString())) {
                    this.getDocumentComments(model.uri);
                }
            }));
        }
        _updateResourcesWithCommentingRanges(resource, commentInfos) {
            for (const comments of commentInfos) {
                if (comments && (comments.commentingRanges.ranges.length > 0 || comments.threads.length > 0)) {
                    this._commentingRangeResources.add(resource.toString());
                }
            }
        }
        _handleConfiguration() {
            this._isCommentingEnabled = this._defaultCommentingEnablement;
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('comments.visible')) {
                    this.enableCommenting(this._defaultCommentingEnablement);
                }
            }));
        }
        _handleZenMode() {
            let preZenModeValue = this._isCommentingEnabled;
            this._register(this.layoutService.onDidChangeZenMode(e => {
                if (e) {
                    preZenModeValue = this._isCommentingEnabled;
                    this.enableCommenting(false);
                }
                else {
                    this.enableCommenting(preZenModeValue);
                }
            }));
        }
        get _defaultCommentingEnablement() {
            return !!this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION)?.visible;
        }
        get isCommentingEnabled() {
            return this._isCommentingEnabled;
        }
        enableCommenting(enable) {
            if (enable !== this._isCommentingEnabled) {
                this._isCommentingEnabled = enable;
                this._onDidChangeCommentingEnabled.fire(enable);
            }
        }
        /**
         * The current comment thread is the thread that has focus or is being hovered.
         * @param commentThread
         */
        setCurrentCommentThread(commentThread) {
            this._onDidChangeCurrentCommentThread.fire(commentThread);
        }
        /**
         * The active comment thread is the the thread that is currently being edited.
         * @param commentThread
         */
        setActiveEditingCommentThread(commentThread) {
            this._onDidChangeActiveEditingCommentThread.fire(commentThread);
        }
        async setActiveCommentAndThread(uniqueOwner, commentInfo) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (!commentController) {
                return;
            }
            if (commentController !== this._lastActiveCommentController) {
                await this._lastActiveCommentController?.setActiveCommentAndThread(undefined);
            }
            this._lastActiveCommentController = commentController;
            return commentController.setActiveCommentAndThread(commentInfo);
        }
        setDocumentComments(resource, commentInfos) {
            this._onDidSetResourceCommentInfos.fire({ resource, commentInfos });
        }
        setModelThreads(ownerId, owner, ownerLabel, commentThreads) {
            this._commentsModel.setCommentThreads(ownerId, owner, ownerLabel, commentThreads);
            this._onDidSetAllCommentThreads.fire({ ownerId, ownerLabel, commentThreads });
        }
        updateModelThreads(event) {
            this._commentsModel.updateCommentThreads(event);
            this._onDidUpdateCommentThreads.fire(event);
        }
        setWorkspaceComments(uniqueOwner, commentsByResource) {
            if (commentsByResource.length) {
                this._workspaceHasCommenting.set(true);
            }
            const control = this._commentControls.get(uniqueOwner);
            if (control) {
                this.setModelThreads(uniqueOwner, control.owner, control.label, commentsByResource);
            }
        }
        removeWorkspaceComments(uniqueOwner) {
            const control = this._commentControls.get(uniqueOwner);
            if (control) {
                this.setModelThreads(uniqueOwner, control.owner, control.label, []);
            }
        }
        registerCommentController(uniqueOwner, commentControl) {
            this._commentControls.set(uniqueOwner, commentControl);
            this._onDidSetDataProvider.fire();
        }
        unregisterCommentController(uniqueOwner) {
            if (uniqueOwner) {
                this._commentControls.delete(uniqueOwner);
            }
            else {
                this._commentControls.clear();
            }
            this._commentsModel.deleteCommentsByOwner(uniqueOwner);
            this._onDidDeleteDataProvider.fire(uniqueOwner);
        }
        getCommentController(uniqueOwner) {
            return this._commentControls.get(uniqueOwner);
        }
        async createCommentThreadTemplate(uniqueOwner, resource, range) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (!commentController) {
                return;
            }
            return commentController.createCommentThreadTemplate(resource, range);
        }
        async updateCommentThreadTemplate(uniqueOwner, threadHandle, range) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (!commentController) {
                return;
            }
            await commentController.updateCommentThreadTemplate(threadHandle, range);
        }
        disposeCommentThread(uniqueOwner, threadId) {
            const controller = this.getCommentController(uniqueOwner);
            controller?.deleteCommentThreadMain(threadId);
        }
        getCommentMenus(uniqueOwner) {
            if (this._commentMenus.get(uniqueOwner)) {
                return this._commentMenus.get(uniqueOwner);
            }
            const menu = this.instantiationService.createInstance(commentMenus_1.CommentMenus);
            this._commentMenus.set(uniqueOwner, menu);
            return menu;
        }
        updateComments(ownerId, event) {
            const control = this._commentControls.get(ownerId);
            if (control) {
                const evt = Object.assign({}, event, { uniqueOwner: ownerId, ownerLabel: control.label, owner: control.owner });
                this.updateModelThreads(evt);
            }
        }
        updateNotebookComments(ownerId, event) {
            const evt = Object.assign({}, event, { uniqueOwner: ownerId });
            this._onDidUpdateNotebookCommentThreads.fire(evt);
        }
        updateCommentingRanges(ownerId, resourceHints) {
            if (resourceHints?.schemes && resourceHints.schemes.length > 0) {
                for (const scheme of resourceHints.schemes) {
                    this._commentingRangeResourceHintSchemes.add(scheme);
                }
            }
            this._workspaceHasCommenting.set(true);
            this._onDidUpdateCommentingRanges.fire({ uniqueOwner: ownerId });
        }
        async toggleReaction(uniqueOwner, resource, thread, comment, reaction) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (commentController) {
                return commentController.toggleReaction(resource, thread, comment, reaction, cancellation_1.CancellationToken.None);
            }
            else {
                throw new Error('Not supported');
            }
        }
        hasReactionHandler(uniqueOwner) {
            const commentProvider = this._commentControls.get(uniqueOwner);
            if (commentProvider) {
                return !!commentProvider.features.reactionHandler;
            }
            return false;
        }
        async getDocumentComments(resource) {
            const commentControlResult = [];
            for (const control of this._commentControls.values()) {
                commentControlResult.push(control.getDocumentComments(resource, cancellation_1.CancellationToken.None)
                    .then(documentComments => {
                    // Check that there aren't any continue on comments in the provided comments
                    // This can happen because continue on comments are stored separately from local un-submitted comments.
                    for (const documentCommentThread of documentComments.threads) {
                        if (documentCommentThread.comments?.length === 0 && documentCommentThread.range) {
                            this.removeContinueOnComment({ range: documentCommentThread.range, uri: resource, uniqueOwner: documentComments.uniqueOwner });
                        }
                    }
                    const pendingComments = this._continueOnComments.get(documentComments.uniqueOwner);
                    documentComments.pendingCommentThreads = pendingComments?.filter(pendingComment => pendingComment.uri.toString() === resource.toString());
                    return documentComments;
                })
                    .catch(_ => {
                    return null;
                }));
            }
            const commentInfos = await Promise.all(commentControlResult);
            this._updateResourcesWithCommentingRanges(resource, commentInfos);
            return commentInfos;
        }
        async getNotebookComments(resource) {
            const commentControlResult = [];
            this._commentControls.forEach(control => {
                commentControlResult.push(control.getNotebookComments(resource, cancellation_1.CancellationToken.None)
                    .catch(_ => {
                    return null;
                }));
            });
            return Promise.all(commentControlResult);
        }
        registerContinueOnCommentProvider(provider) {
            this._continueOnCommentProviders.add(provider);
            return {
                dispose: () => {
                    this._continueOnCommentProviders.delete(provider);
                }
            };
        }
        _saveContinueOnComments(map) {
            const commentsToSave = [];
            for (const pendingComments of map.values()) {
                commentsToSave.push(...pendingComments);
            }
            this.logService.debug(`Comments: URIs of continue on comments to add to storage ${commentsToSave.map(thread => thread.uri.toString()).join(', ')}.`);
            this.storageService.store(CONTINUE_ON_COMMENTS, commentsToSave, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        removeContinueOnComment(pendingComment) {
            const pendingComments = this._continueOnComments.get(pendingComment.uniqueOwner);
            if (pendingComments) {
                const commentIndex = pendingComments.findIndex(comment => comment.uri.toString() === pendingComment.uri.toString() && range_1.Range.equalsRange(comment.range, pendingComment.range) && (pendingComment.isReply === undefined || comment.isReply === pendingComment.isReply));
                if (commentIndex > -1) {
                    return pendingComments.splice(commentIndex, 1)[0];
                }
            }
            return undefined;
        }
        _addContinueOnComments(pendingComments, map) {
            const changedOwners = new Set();
            for (const pendingComment of pendingComments) {
                if (!map.has(pendingComment.uniqueOwner)) {
                    map.set(pendingComment.uniqueOwner, [pendingComment]);
                    changedOwners.add(pendingComment.uniqueOwner);
                }
                else {
                    const commentsForOwner = map.get(pendingComment.uniqueOwner);
                    if (commentsForOwner.every(comment => (comment.uri.toString() !== pendingComment.uri.toString()) || !range_1.Range.equalsRange(comment.range, pendingComment.range))) {
                        commentsForOwner.push(pendingComment);
                        changedOwners.add(pendingComment.uniqueOwner);
                    }
                }
            }
            return changedOwners;
        }
        resourceHasCommentingRanges(resource) {
            return this._commentingRangeResourceHintSchemes.has(resource.scheme) || this._commentingRangeResources.has(resource.toString());
        }
    };
    exports.CommentService = CommentService;
    exports.CommentService = CommentService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, storage_1.IStorageService),
        __param(5, log_1.ILogService),
        __param(6, model_1.IModelService)
    ], CommentService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCbkYsUUFBQSxlQUFlLEdBQUcsSUFBQSwrQkFBZSxFQUFrQixnQkFBZ0IsQ0FBQyxDQUFDO0lBOEZsRixNQUFNLG9CQUFvQixHQUFHLDZCQUE2QixDQUFDO0lBRXBELElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQXdEN0MsWUFDd0Isb0JBQThELEVBQzVELGFBQXVELEVBQ3pELG9CQUE0RCxFQUMvRCxpQkFBcUMsRUFDeEMsY0FBZ0QsRUFDcEQsVUFBd0MsRUFDdEMsWUFBNEM7WUFFM0QsS0FBSyxFQUFFLENBQUM7WUFSa0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyxrQkFBYSxHQUFiLGFBQWEsQ0FBeUI7WUFDeEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNyQixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQTVEM0MsMEJBQXFCLEdBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ25GLHlCQUFvQixHQUFnQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRTdELDZCQUF3QixHQUFnQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDbEgsNEJBQXVCLEdBQThCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFFakYsa0NB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