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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/workbench/contrib/comments/browser/commentReply", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadBody", "vs/workbench/contrib/comments/browser/commentThreadHeader", "vs/workbench/contrib/comments/browser/commentThreadAdditionalActions", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/contrib/comments/browser/commentColors", "vs/platform/contextview/browser/contextView", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/comments/common/commentsConfiguration", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/css!./media/review"], function (require, exports, dom, event_1, lifecycle_1, languages, commentReply_1, commentService_1, commentThreadBody_1, commentThreadHeader_1, commentThreadAdditionalActions_1, commentContextKeys_1, colorRegistry_1, theme_1, commentColors_1, contextView_1, widgetNavigationCommands_1, configuration_1, commentsConfiguration_1, nls_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadWidget = exports.COMMENTEDITOR_DECORATION_KEY = void 0;
    exports.COMMENTEDITOR_DECORATION_KEY = 'commenteditordecoration';
    let CommentThreadWidget = class CommentThreadWidget extends lifecycle_1.Disposable {
        get commentThread() {
            return this._commentThread;
        }
        constructor(container, _parentEditor, _owner, _parentResourceUri, _contextKeyService, _scopedInstantiationService, _commentThread, _pendingComment, _pendingEdits, _markdownOptions, _commentOptions, _containerDelegate, commentService, contextMenuService, configurationService, _keybindingService) {
            super();
            this.container = container;
            this._parentEditor = _parentEditor;
            this._owner = _owner;
            this._parentResourceUri = _parentResourceUri;
            this._contextKeyService = _contextKeyService;
            this._scopedInstantiationService = _scopedInstantiationService;
            this._commentThread = _commentThread;
            this._pendingComment = _pendingComment;
            this._pendingEdits = _pendingEdits;
            this._markdownOptions = _markdownOptions;
            this._commentOptions = _commentOptions;
            this._containerDelegate = _containerDelegate;
            this.commentService = commentService;
            this.configurationService = configurationService;
            this._keybindingService = _keybindingService;
            this._commentThreadDisposables = [];
            this._onDidResize = new event_1.Emitter();
            this.onDidResize = this._onDidResize.event;
            this._threadIsEmpty = commentContextKeys_1.CommentContextKeys.commentThreadIsEmpty.bindTo(this._contextKeyService);
            this._threadIsEmpty.set(!_commentThread.comments || !_commentThread.comments.length);
            this._focusedContextKey = commentContextKeys_1.CommentContextKeys.commentFocused.bindTo(this._contextKeyService);
            this._commentMenus = this.commentService.getCommentMenus(this._owner);
            this._header = new commentThreadHeader_1.CommentThreadHeader(container, {
                collapse: this.collapse.bind(this)
            }, this._commentMenus, this._commentThread, this._contextKeyService, this._scopedInstantiationService, contextMenuService);
            this._header.updateCommentThread(this._commentThread);
            const bodyElement = dom.$('.body');
            container.appendChild(bodyElement);
            const tracker = this._register(dom.trackFocus(bodyElement));
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                name: 'commentThreadWidget',
                focusNotifiers: [tracker],
                focusNextWidget: () => {
                    if (!this._commentReply?.isCommentEditorFocused()) {
                        this._commentReply?.expandReplyAreaAndFocusCommentEditor();
                    }
                },
                focusPreviousWidget: () => {
                    if (this._commentReply?.isCommentEditorFocused() && this._commentThread.comments?.length) {
                        this._body.focus();
                    }
                }
            }));
            this._register(tracker.onDidFocus(() => this._focusedContextKey.set(true)));
            this._register(tracker.onDidBlur(() => this._focusedContextKey.reset()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */)) {
                    this._setAriaLabel();
                }
            }));
            this._body = this._scopedInstantiationService.createInstance(commentThreadBody_1.CommentThreadBody, this._parentEditor, this._owner, this._parentResourceUri, bodyElement, this._markdownOptions, this._commentThread, this._pendingEdits, this._scopedInstantiationService, this);
            this._register(this._body);
            this._setAriaLabel();
            this._styleElement = dom.createStyleSheet(this.container);
            this._commentThreadContextValue = commentContextKeys_1.CommentContextKeys.commentThreadContext.bindTo(this._contextKeyService);
            this._commentThreadContextValue.set(_commentThread.contextValue);
            const commentControllerKey = commentContextKeys_1.CommentContextKeys.commentControllerContext.bindTo(this._contextKeyService);
            const controller = this.commentService.getCommentController(this._owner);
            if (controller?.contextValue) {
                commentControllerKey.set(controller.contextValue);
            }
            this.currentThreadListeners();
        }
        _setAriaLabel() {
            let ariaLabel = (0, nls_1.localize)('commentLabel', "Comment");
            let keybinding;
            const verbose = this.configurationService.getValue("accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */);
            if (verbose) {
                keybinding = this._keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */, this._contextKeyService)?.getLabel() ?? undefined;
            }
            if (keybinding) {
                ariaLabel = (0, nls_1.localize)('commentLabelWithKeybinding', "{0}, use ({1}) for accessibility help", ariaLabel, keybinding);
            }
            else {
                ariaLabel = (0, nls_1.localize)('commentLabelWithKeybindingNoKeybinding', "{0}, run the command Open Accessibility Help which is currently not triggerable via keybinding.", ariaLabel);
            }
            this._body.container.ariaLabel = ariaLabel;
        }
        updateCurrentThread(hasMouse, hasFocus) {
            if (hasMouse || hasFocus) {
                this.commentService.setCurrentCommentThread(this.commentThread);
            }
            else {
                this.commentService.setCurrentCommentThread(undefined);
            }
        }
        currentThreadListeners() {
            let hasMouse = false;
            let hasFocus = false;
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_ENTER, (e) => {
                if (e.toElement === this.container) {
                    hasMouse = true;
                    this.updateCurrentThread(hasMouse, hasFocus);
                }
            }, true));
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_LEAVE, (e) => {
                if (e.fromElement === this.container) {
                    hasMouse = false;
                    this.updateCurrentThread(hasMouse, hasFocus);
                }
            }, true));
            this._register(dom.addDisposableListener(this.container, dom.EventType.FOCUS_IN, () => {
                hasFocus = true;
                this.updateCurrentThread(hasMouse, hasFocus);
            }, true));
            this._register(dom.addDisposableListener(this.container, dom.EventType.FOCUS_OUT, () => {
                hasFocus = false;
                this.updateCurrentThread(hasMouse, hasFocus);
            }, true));
        }
        async updateCommentThread(commentThread) {
            const shouldCollapse = (this._commentThread.collapsibleState === languages.CommentThreadCollapsibleState.Expanded) && (this._commentThreadState === languages.CommentThreadState.Unresolved)
                && (commentThread.state === languages.CommentThreadState.Resolved);
            this._commentThreadState = commentThread.state;
            this._commentThread = commentThread;
            (0, lifecycle_1.dispose)(this._commentThreadDisposables);
            this._commentThreadDisposables = [];
            this._bindCommentThreadListeners();
            await this._body.updateCommentThread(commentThread, this._commentReply?.isCommentEditorFocused() ?? false);
            this._threadIsEmpty.set(!this._body.length);
            this._header.updateCommentThread(commentThread);
            this._commentReply?.updateCommentThread(commentThread);
            if (this._commentThread.contextValue) {
                this._commentThreadContextValue.set(this._commentThread.contextValue);
            }
            else {
                this._commentThreadContextValue.reset();
            }
            if (shouldCollapse && this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION).collapseOnResolve) {
                this.collapse();
            }
        }
        async display(lineHeight) {
            const headHeight = Math.max(23, Math.ceil(lineHeight * 1.2)); // 23 is the value of `Math.ceil(lineHeight * 1.2)` with the default editor font size
            this._header.updateHeight(headHeight);
            await this._body.display();
            // create comment thread only when it supports reply
            if (this._commentThread.canReply) {
                this._createCommentForm();
            }
            this._createAdditionalActions();
            this._register(this._body.onDidResize(dimension => {
                this._refresh(dimension);
            }));
            // If there are no existing comments, place focus on the text area. This must be done after show, which also moves focus.
            // if this._commentThread.comments is undefined, it doesn't finish initialization yet, so we don't focus the editor immediately.
            if (this._commentThread.canReply && this._commentReply) {
                this._commentReply.focusIfNeeded();
            }
            this._bindCommentThreadListeners();
        }
        _refresh(dimension) {
            this._body.layout();
            this._onDidResize.fire(dimension);
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this._commentThreadDisposables);
            this.updateCurrentThread(false, false);
        }
        _bindCommentThreadListeners() {
            this._commentThreadDisposables.push(this._commentThread.onDidChangeCanReply(() => {
                if (this._commentReply) {
                    this._commentReply.updateCanReply();
                }
                else {
                    if (this._commentThread.canReply) {
                        this._createCommentForm();
                    }
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeComments(async (_) => {
                await this.updateCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeLabel(_ => {
                this._header.createThreadLabel();
            }));
        }
        _createCommentForm() {
            this._commentReply = this._scopedInstantiationService.createInstance(commentReply_1.CommentReply, this._owner, this._body.container, this._parentEditor, this._commentThread, this._scopedInstantiationService, this._contextKeyService, this._commentMenus, this._commentOptions, this._pendingComment, this, this._containerDelegate.actionRunner);
            this._register(this._commentReply);
        }
        _createAdditionalActions() {
            this._additionalActions = this._scopedInstantiationService.createInstance(commentThreadAdditionalActions_1.CommentThreadAdditionalActions, this._body.container, this._commentThread, this._contextKeyService, this._commentMenus, this._containerDelegate.actionRunner);
            this._register(this._additionalActions);
        }
        getCommentCoords(commentUniqueId) {
            return this._body.getCommentCoords(commentUniqueId);
        }
        getPendingEdits() {
            return this._body.getPendingEdits();
        }
        getPendingComment() {
            if (this._commentReply) {
                return this._commentReply.getPendingComment();
            }
            return undefined;
        }
        setPendingComment(comment) {
            this._pendingComment = comment;
            this._commentReply?.setPendingComment(comment);
        }
        getDimensions() {
            return this._body.getDimensions();
        }
        layout(widthInPixel) {
            this._body.layout(widthInPixel);
            if (widthInPixel !== undefined) {
                this._commentReply?.layout(widthInPixel);
            }
        }
        focusCommentEditor() {
            this._commentReply?.expandReplyAreaAndFocusCommentEditor();
        }
        focus() {
            this._body.focus();
        }
        async submitComment() {
            const activeComment = this._body.activeComment;
            if (activeComment) {
                return activeComment.submitComment();
            }
            else if ((this._commentReply?.getPendingComment()?.length ?? 0) > 0) {
                return this._commentReply?.submitComment();
            }
        }
        collapse() {
            this._containerDelegate.collapse();
        }
        applyTheme(theme, fontInfo) {
            const content = [];
            content.push(`.monaco-editor .review-widget > .body { border-top: 1px solid var(${commentColors_1.commentThreadStateColorVar}) }`);
            content.push(`.monaco-editor .review-widget > .head { background-color: var(${commentColors_1.commentThreadStateBackgroundColorVar}) }`);
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.review-widget .body .comment-body a { color: ${linkColor} }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.review-widget .body .comment-body a:hover, a:active { color: ${linkActiveColor} }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.review-widget .body .comment-body a:focus { outline: 1px solid ${focusColor}; }`);
                content.push(`.review-widget .body .monaco-editor.focused { outline: 1px solid ${focusColor}; }`);
            }
            const blockQuoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
            if (blockQuoteBackground) {
                content.push(`.review-widget .body .review-comment blockquote { background: ${blockQuoteBackground}; }`);
            }
            const blockQuoteBOrder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
            if (blockQuoteBOrder) {
                content.push(`.review-widget .body .review-comment blockquote { border-color: ${blockQuoteBOrder}; }`);
            }
            const border = theme.getColor(theme_1.PANEL_BORDER);
            if (border) {
                content.push(`.review-widget .body .review-comment .review-comment-contents .comment-reactions .action-item a.action-label { border-color: ${border}; }`);
            }
            const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
            if (hcBorder) {
                content.push(`.review-widget .body .comment-form .review-thread-reply-button { outline-color: ${hcBorder}; }`);
                content.push(`.review-widget .body .monaco-editor { outline: 1px solid ${hcBorder}; }`);
            }
            const errorBorder = theme.getColor(colorRegistry_1.inputValidationErrorBorder);
            if (errorBorder) {
                content.push(`.review-widget .validation-error { border: 1px solid ${errorBorder}; }`);
            }
            const errorBackground = theme.getColor(colorRegistry_1.inputValidationErrorBackground);
            if (errorBackground) {
                content.push(`.review-widget .validation-error { background: ${errorBackground}; }`);
            }
            const errorForeground = theme.getColor(colorRegistry_1.inputValidationErrorForeground);
            if (errorForeground) {
                content.push(`.review-widget .body .comment-form .validation-error { color: ${errorForeground}; }`);
            }
            const fontFamilyVar = '--comment-thread-editor-font-family';
            const fontSizeVar = '--comment-thread-editor-font-size';
            const fontWeightVar = '--comment-thread-editor-font-weight';
            this.container?.style.setProperty(fontFamilyVar, fontInfo.fontFamily);
            this.container?.style.setProperty(fontSizeVar, `${fontInfo.fontSize}px`);
            this.container?.style.setProperty(fontWeightVar, fontInfo.fontWeight);
            content.push(`.review-widget .body code {
			font-family: var(${fontFamilyVar});
			font-weight: var(${fontWeightVar});
		}`);
            this._styleElement.textContent = content.join('\n');
            this._commentReply?.setCommentEditorDecorations();
        }
    };
    exports.CommentThreadWidget = CommentThreadWidget;
    exports.CommentThreadWidget = CommentThreadWidget = __decorate([
        __param(12, commentService_1.ICommentService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, configuration_1.IConfigurationService),
        __param(15, keybinding_1.IKeybindingService)
    ], CommentThreadWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudFRocmVhZFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQ25GLFFBQUEsNEJBQTRCLEdBQUcseUJBQXlCLENBQUM7SUFHL0QsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBNEQsU0FBUSxzQkFBVTtRQWdCMUYsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUM1QixDQUFDO1FBQ0QsWUFDVSxTQUFzQixFQUN0QixhQUErQixFQUNoQyxNQUFjLEVBQ2Qsa0JBQXVCLEVBQ3ZCLGtCQUFzQyxFQUN0QywyQkFBa0QsRUFDbEQsY0FBMEMsRUFDMUMsZUFBbUMsRUFDbkMsYUFBb0QsRUFDcEQsZ0JBQTBDLEVBQzFDLGVBQXFELEVBQ3JELGtCQUdQLEVBQ2dCLGNBQXVDLEVBQ25DLGtCQUF1QyxFQUNyQyxvQkFBbUQsRUFDdEQsa0JBQThDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBcEJDLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFDdEIsa0JBQWEsR0FBYixhQUFhLENBQWtCO1lBQ2hDLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQUs7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN0QyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQXVCO1lBQ2xELG1CQUFjLEdBQWQsY0FBYyxDQUE0QjtZQUMxQyxvQkFBZSxHQUFmLGVBQWUsQ0FBb0I7WUFDbkMsa0JBQWEsR0FBYixhQUFhLENBQXVDO1lBQ3BELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBMEI7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