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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/contrib/comments/browser/commentService", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions", "vs/workbench/services/activity/common/activity", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/editor/common/languages", "vs/platform/actions/common/actions", "vs/workbench/contrib/comments/browser/commentsView", "vs/workbench/browser/parts/views/viewPane", "vs/base/common/codicons", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/comments/browser/commentsController", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/comments/browser/commentsEditorContribution"], function (require, exports, nls, extensions_1, platform_1, commentService_1, configurationRegistry_1, lifecycle_1, contextkey_1, contributions_1, activity_1, commentsTreeViewer_1, languages_1, actions_1, commentsView_1, viewPane_1, codicons_1, editorService_1, uriIdentity_1, commentsController_1, accessibilityConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnresolvedCommentsBadge = void 0;
    (0, actions_1.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                id: 'comments.collapse',
                title: nls.localize('collapseAll', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID), commentsView_1.CONTEXT_KEY_HAS_COMMENTS), commentsView_1.CONTEXT_KEY_SOME_COMMENTS_EXPANDED),
                    order: 100
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
    (0, actions_1.registerAction2)(class Expand extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                id: 'comments.expand',
                title: nls.localize('expandAll', "Expand All"),
                f1: false,
                icon: codicons_1.Codicon.expandAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID), commentsView_1.CONTEXT_KEY_HAS_COMMENTS), contextkey_1.ContextKeyExpr.not(commentsView_1.CONTEXT_KEY_SOME_COMMENTS_EXPANDED.key)),
                    order: 100
                }
            });
        }
        runInView(_accessor, view) {
            view.expandAll();
        }
    });
    (0, actions_1.registerAction2)(class Reply extends actions_1.Action2 {
        constructor() {
            super({
                id: 'comments.reply',
                title: nls.localize('reply', "Reply"),
                icon: codicons_1.Codicon.reply,
                precondition: contextkey_1.ContextKeyExpr.equals('canReply', true),
                menu: [{
                        id: actions_1.MenuId.CommentsViewThreadActions,
                        order: 100
                    },
                    {
                        id: actions_1.MenuId.AccessibleView,
                        when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "comments" /* AccessibleViewProviderId.Comments */)),
                    }]
            });
        }
        run(accessor, marshalledCommentThread) {
            const commentService = accessor.get(commentService_1.ICommentService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            (0, commentsController_1.revealCommentThread)(commentService, editorService, uriIdentityService, marshalledCommentThread.thread, marshalledCommentThread.thread.comments[marshalledCommentThread.thread.comments.length - 1], true);
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'comments',
        order: 20,
        title: nls.localize('commentsConfigurationTitle', "Comments"),
        type: 'object',
        properties: {
            'comments.openPanel': {
                enum: ['neverOpen', 'openOnSessionStart', 'openOnSessionStartWithComments'],
                default: 'openOnSessionStartWithComments',
                description: nls.localize('openComments', "Controls when the comments panel should open."),
                restricted: false,
                markdownDeprecationMessage: nls.localize('comments.openPanel.deprecated', "This setting is deprecated in favor of `comments.openView`.")
            },
            'comments.openView': {
                enum: ['never', 'file', 'firstFile', 'firstFileUnresolved'],
                enumDescriptions: [nls.localize('comments.openView.never', "The comments view will never be opened."), nls.localize('comments.openView.file', "The comments view will open when a file with comments is active."), nls.localize('comments.openView.firstFile', "If the comments view has not been opened yet during this session it will open the first time during a session that a file with comments is active."), nls.localize('comments.openView.firstFileUnresolved', "If the comments view has not been opened yet during this session and the comment is not resolved, it will open the first time during a session that a file with comments is active.")],
                default: 'firstFile',
                description: nls.localize('comments.openView', "Controls when the comments view should open."),
                restricted: false
            },
            'comments.useRelativeTime': {
                type: 'boolean',
                default: true,
                description: nls.localize('useRelativeTime', "Determines if relative time will be used in comment timestamps (ex. '1 day ago').")
            },
            'comments.visible': {
                type: 'boolean',
                default: true,
                description: nls.localize('comments.visible', "Controls the visibility of the comments bar and comment threads in editors that have commenting ranges and comments. Comments are still accessible via the Comments view and will cause commenting to be toggled on in the same way running the command \"Comments: Toggle Editor Commenting\" toggles comments.")
            },
            'comments.maxHeight': {
                type: 'boolean',
                default: true,
                description: nls.localize('comments.maxHeight', "Controls whether the comments widget scrolls or expands.")
            },
            'comments.collapseOnResolve': {
                type: 'boolean',
                default: true,
                description: nls.localize('collapseOnResolve', "Controls whether the comment thread should collapse when the thread is resolved.")
            }
        }
    });
    (0, extensions_1.registerSingleton)(commentService_1.ICommentService, commentService_1.CommentService, 1 /* InstantiationType.Delayed */);
    let UnresolvedCommentsBadge = class UnresolvedCommentsBadge extends lifecycle_1.Disposable {
        constructor(_commentService, activityService) {
            super();
            this._commentService = _commentService;
            this.activityService = activityService;
            this.activity = this._register(new lifecycle_1.MutableDisposable());
            this.totalUnresolved = 0;
            this._register(this._commentService.onDidSetAllCommentThreads(this.onAllCommentsChanged, this));
            this._register(this._commentService.onDidUpdateCommentThreads(this.onCommentsUpdated, this));
        }
        onAllCommentsChanged(e) {
            let unresolved = 0;
            for (const thread of e.commentThreads) {
                if (thread.state === languages_1.CommentThreadState.Unresolved) {
                    unresolved++;
                }
            }
            this.updateBadge(unresolved);
        }
        onCommentsUpdated() {
            let unresolved = 0;
            for (const resource of this._commentService.commentsModel.resourceCommentThreads) {
                for (const thread of resource.commentThreads) {
                    if (thread.threadState === languages_1.CommentThreadState.Unresolved) {
                        unresolved++;
                    }
                }
            }
            this.updateBadge(unresolved);
        }
        updateBadge(unresolved) {
            if (unresolved === this.totalUnresolved) {
                return;
            }
            this.totalUnresolved = unresolved;
            const message = nls.localize('totalUnresolvedComments', '{0} Unresolved Comments', this.totalUnresolved);
            this.activity.value = this.activityService.showViewActivity(commentsTreeViewer_1.COMMENTS_VIEW_ID, { badge: new activity_1.NumberBadge(this.totalUnresolved, () => message) });
        }
    };
    exports.UnresolvedCommentsBadge = UnresolvedCommentsBadge;
    exports.UnresolvedCommentsBadge = UnresolvedCommentsBadge = __decorate([
        __param(0, commentService_1.ICommentService),
        __param(1, activity_1.IActivityService)
    ], UnresolvedCommentsBadge);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(UnresolvedCommentsBadge, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50cy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEJoRyxJQUFBLHlCQUFlLEVBQUMsTUFBTSxRQUFTLFNBQVEscUJBQXlCO1FBQy9EO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLE1BQU0sRUFBRSxxQ0FBZ0I7Z0JBQ3hCLEVBQUUsRUFBRSxtQkFBbUI7Z0JBQ3ZCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxjQUFjLENBQUM7Z0JBQ2xELEVBQUUsRUFBRSxLQUFLO2dCQUNULElBQUksRUFBRSxrQkFBTyxDQUFDLFdBQVc7Z0JBQ3pCLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxTQUFTO29CQUNwQixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxxQ0FBZ0IsQ0FBQyxFQUFFLHVDQUF3QixDQUFDLEVBQUUsaURBQWtDLENBQUM7b0JBQzNKLEtBQUssRUFBRSxHQUFHO2lCQUNWO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELFNBQVMsQ0FBQyxTQUEyQixFQUFFLElBQW1CO1lBQ3pELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNwQixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sTUFBTyxTQUFRLHFCQUF5QjtRQUM3RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxNQUFNLEVB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