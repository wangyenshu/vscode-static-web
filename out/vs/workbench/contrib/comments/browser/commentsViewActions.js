/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/workbench/contrib/comments/browser/comments", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/common/contextkeys", "vs/workbench/browser/parts/views/viewFilter"], function (require, exports, lifecycle_1, nls_1, contextkey_1, event_1, comments_1, actions_1, viewPane_1, commentsTreeViewer_1, contextkeys_1, viewFilter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsFilters = void 0;
    const CONTEXT_KEY_SHOW_RESOLVED = new contextkey_1.RawContextKey('commentsView.showResolvedFilter', true);
    const CONTEXT_KEY_SHOW_UNRESOLVED = new contextkey_1.RawContextKey('commentsView.showUnResolvedFilter', true);
    class CommentsFilters extends lifecycle_1.Disposable {
        constructor(options, contextKeyService) {
            super();
            this.contextKeyService = contextKeyService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._showUnresolved = CONTEXT_KEY_SHOW_UNRESOLVED.bindTo(this.contextKeyService);
            this._showResolved = CONTEXT_KEY_SHOW_RESOLVED.bindTo(this.contextKeyService);
            this._showResolved.set(options.showResolved);
            this._showUnresolved.set(options.showUnresolved);
        }
        get showUnresolved() {
            return !!this._showUnresolved.get();
        }
        set showUnresolved(showUnresolved) {
            if (this._showUnresolved.get() !== showUnresolved) {
                this._showUnresolved.set(showUnresolved);
                this._onDidChange.fire({ showUnresolved: true });
            }
        }
        get showResolved() {
            return !!this._showResolved.get();
        }
        set showResolved(showResolved) {
            if (this._showResolved.get() !== showResolved) {
                this._showResolved.set(showResolved);
                this._onDidChange.fire({ showResolved: true });
            }
        }
    }
    exports.CommentsFilters = CommentsFilters;
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'commentsFocusViewFromFilter',
                title: (0, nls_1.localize)('focusCommentsList', "Focus Comments view"),
                keybinding: {
                    when: comments_1.CommentsViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, commentsView) {
            commentsView.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'commentsClearFilterText',
                title: (0, nls_1.localize)('commentsClearFilterText', "Clear filter text"),
                keybinding: {
                    when: comments_1.CommentsViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, commentsView) {
            commentsView.clearFilterText();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'commentsFocusFilter',
                title: (0, nls_1.localize)('focusCommentsFilter', "Focus comments filter"),
                keybinding: {
                    when: contextkeys_1.FocusedViewContext.isEqualTo(commentsTreeViewer_1.COMMENTS_VIEW_ID),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, commentsView) {
            commentsView.focusFilter();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${commentsTreeViewer_1.COMMENTS_VIEW_ID}.toggleUnResolvedComments`,
                title: (0, nls_1.localize)('toggle unresolved', "Show Unresolved"),
                category: (0, nls_1.localize)('comments', "Comments"),
                toggled: {
                    condition: CONTEXT_KEY_SHOW_UNRESOLVED,
                    title: (0, nls_1.localize)('unresolved', "Show Unresolved"),
                },
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID),
                    order: 1
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showUnresolved = !view.filters.showUnresolved;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${commentsTreeViewer_1.COMMENTS_VIEW_ID}.toggleResolvedComments`,
                title: (0, nls_1.localize)('toggle resolved', "Show Resolved"),
                category: (0, nls_1.localize)('comments', "Comments"),
                toggled: {
                    condition: CONTEXT_KEY_SHOW_RESOLVED,
                    title: (0, nls_1.localize)('resolved', "Show Resolved"),
                },
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID),
                    order: 1
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showResolved = !view.filters.showResolved;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNWaWV3QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudHNWaWV3QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQU0seUJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGlDQUFpQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RHLE1BQU0sMkJBQTJCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG1DQUFtQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBWTFHLE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQUs5QyxZQUFZLE9BQStCLEVBQW1CLGlCQUFxQztZQUNsRyxLQUFLLEVBQUUsQ0FBQztZQURxRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBSGxGLGlCQUFZLEdBQXdDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQThCLENBQUMsQ0FBQztZQUN0SCxnQkFBVyxHQUFzQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQVFqRSxvQkFBZSxHQUFHLDJCQUEyQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQVd0RixrQkFBYSxHQUFHLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQWZoRixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFHRCxJQUFJLGNBQWM7WUFDakIsT0FBTyxDQUFDLENBQUMsSUFBSSxD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