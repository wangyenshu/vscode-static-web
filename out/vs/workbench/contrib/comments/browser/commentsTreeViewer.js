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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/browser/markdownRenderer", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/workbench/contrib/comments/common/commentModel", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/comments/browser/timestamp", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/contrib/comments/browser/commentColors", "vs/editor/common/languages", "vs/workbench/contrib/comments/browser/commentsFilterOptions", "vs/base/common/resources", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/workbench/contrib/comments/browser/commentsModel", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/keybinding/common/keybinding", "vs/platform/hover/browser/hover"], function (require, exports, dom, nls, markdownRenderer_1, lifecycle_1, opener_1, commentModel_1, configuration_1, contextkey_1, listService_1, themeService_1, instantiation_1, timestamp_1, codicons_1, themables_1, commentColors_1, languages_1, commentsFilterOptions_1, resources_1, markdownRenderer_2, commentsModel_1, hoverDelegateFactory_1, actionbar_1, menuEntryActionViewItem_1, actions_1, contextView_1, actionViewItems_1, keybinding_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsList = exports.Filter = exports.CommentNodeRenderer = exports.CommentsMenus = exports.ResourceWithCommentsRenderer = exports.COMMENTS_VIEW_TITLE = exports.COMMENTS_VIEW_STORAGE_ID = exports.COMMENTS_VIEW_ID = void 0;
    exports.COMMENTS_VIEW_ID = 'workbench.panel.comments';
    exports.COMMENTS_VIEW_STORAGE_ID = 'Comments';
    exports.COMMENTS_VIEW_TITLE = nls.localize2('comments.view.title', "Comments");
    class CommentsModelVirualDelegate {
        static { this.RESOURCE_ID = 'resource-with-comments'; }
        static { this.COMMENT_ID = 'comment-node'; }
        getHeight(element) {
            if ((element instanceof commentModel_1.CommentNode) && element.hasReply()) {
                return 44;
            }
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return CommentsModelVirualDelegate.RESOURCE_ID;
            }
            if (element instanceof commentModel_1.CommentNode) {
                return CommentsModelVirualDelegate.COMMENT_ID;
            }
            return '';
        }
    }
    class ResourceWithCommentsRenderer {
        constructor(labels) {
            this.labels = labels;
            this.templateId = 'resource-with-comments';
        }
        renderTemplate(container) {
            const labelContainer = dom.append(container, dom.$('.resource-container'));
            const resourceLabel = this.labels.create(labelContainer);
            const separator = dom.append(labelContainer, dom.$('.separator'));
            const owner = labelContainer.appendChild(dom.$('.owner'));
            return { resourceLabel, owner, separator };
        }
        renderElement(node, index, templateData, height) {
            templateData.resourceLabel.setFile(node.element.resource);
            templateData.separator.innerText = '\u00b7';
            if (node.element.ownerLabel) {
                templateData.owner.innerText = node.element.ownerLabel;
                templateData.separator.style.display = 'inline';
            }
            else {
                templateData.owner.innerText = '';
                templateData.separator.style.display = 'none';
            }
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
        }
    }
    exports.ResourceWithCommentsRenderer = ResourceWithCommentsRenderer;
    let CommentsMenus = class CommentsMenus {
        constructor(menuService) {
            this.menuService = menuService;
        }
        getResourceActions(element) {
            const actions = this.getActions(actions_1.MenuId.CommentsViewThreadActions, element);
            return { menu: actions.menu, actions: actions.primary };
        }
        getResourceContextActions(element) {
            return this.getActions(actions_1.MenuId.CommentsViewThreadActions, element).secondary;
        }
        setContextKeyService(service) {
            this.contextKeyService = service;
        }
        getActions(menuId, element) {
            if (!this.contextKeyService) {
                return { primary: [], secondary: [] };
            }
            const overlay = [
                ['commentController', element.owner],
                ['resourceScheme', element.resource.scheme],
                ['commentThread', element.contextValue],
                ['canReply', element.thread.canReply]
            ];
            const contextKeyService = this.contextKeyService.createOverlay(overlay);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary, menu };
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, result, 'inline');
            menu.dispose();
            return result;
        }
        dispose() {
            this.contextKeyService = undefined;
        }
    };
    exports.CommentsMenus = CommentsMenus;
    exports.CommentsMenus = CommentsMenus = __decorate([
        __param(0, actions_1.IMenuService)
    ], CommentsMenus);
    let CommentNodeRenderer = class CommentNodeRenderer {
        constructor(actionViewItemProvider, menus, openerService, configurationService, hoverService, themeService) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.menus = menus;
            this.openerService = openerService;
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.themeService = themeService;
            this.templateId = 'comment-node';
        }
        renderTemplate(container) {
            const threadContainer = dom.append(container, dom.$('.comment-thread-container'));
            const metadataContainer = dom.append(threadContainer, dom.$('.comment-metadata-container'));
            const metadata = dom.append(metadataContainer, dom.$('.comment-metadata'));
            const threadMetadata = {
                icon: dom.append(metadata, dom.$('.icon')),
                userNames: dom.append(metadata, dom.$('.user')),
                timestamp: new timestamp_1.TimestampWidget(this.configurationService, this.hoverService, dom.append(metadata, dom.$('.timestamp-container'))),
                relevance: dom.append(metadata, dom.$('.relevance')),
                separator: dom.append(metadata, dom.$('.separator')),
                commentPreview: dom.append(metadata, dom.$('.text')),
                range: dom.append(metadata, dom.$('.range'))
            };
            threadMetadata.separator.innerText = '\u00b7';
            const actionsContainer = dom.append(metadataContainer, dom.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider
            });
            const snippetContainer = dom.append(threadContainer, dom.$('.comment-snippet-container'));
            const repliesMetadata = {
                container: snippetContainer,
                icon: dom.append(snippetContainer, dom.$('.icon')),
                count: dom.append(snippetContainer, dom.$('.count')),
                lastReplyDetail: dom.append(snippetContainer, dom.$('.reply-detail')),
                separator: dom.append(snippetContainer, dom.$('.separator')),
                timestamp: new timestamp_1.TimestampWidget(this.configurationService, this.hoverService, dom.append(snippetContainer, dom.$('.timestamp-container'))),
            };
            repliesMetadata.separator.innerText = '\u00b7';
            repliesMetadata.icon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.indent));
            const disposables = [threadMetadata.timestamp, repliesMetadata.timestamp];
            return { threadMetadata, repliesMetadata, actionBar, disposables };
        }
        getCountString(commentCount) {
            if (commentCount > 2) {
                return nls.localize('commentsCountReplies', "{0} replies", commentCount - 1);
            }
            else if (commentCount === 2) {
                return nls.localize('commentsCountReply', "1 reply");
            }
            else {
                return nls.localize('commentCount', "1 comment");
            }
        }
        getRenderedComment(commentBody, disposables) {
            const renderedComment = (0, markdownRenderer_1.renderMarkdown)(commentBody, {
                inline: true,
                actionHandler: {
                    callback: (link) => (0, markdownRenderer_2.openLinkFromMarkdown)(this.openerService, link, commentBody.isTrusted),
                    disposables: disposables
                }
            });
            const images = renderedComment.element.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const textDescription = dom.$('');
                textDescription.textContent = image.alt ? nls.localize('imageWithLabel', "Image: {0}", image.alt) : nls.localize('image', "Image");
                image.parentNode.replaceChild(textDescription, image);
            }
            return renderedComment;
        }
        getIcon(threadState) {
            if (threadState === languages_1.CommentThreadState.Unresolved) {
                return codicons_1.Codicon.commentUnresolved;
            }
            else {
                return codicons_1.Codicon.comment;
            }
        }
        renderElement(node, index, templateData, height) {
            templateData.actionBar.clear();
            const commentCount = node.element.replies.length + 1;
            if (node.element.threadRelevance === languages_1.CommentThreadApplicability.Outdated) {
                templateData.threadMetadata.relevance.style.display = '';
                templateData.threadMetadata.relevance.innerText = nls.localize('outdated', "Outdated");
                templateData.threadMetadata.separator.style.display = 'none';
            }
            else {
                templateData.threadMetadata.relevance.innerText = '';
                templateData.threadMetadata.relevance.style.display = 'none';
                templateData.threadMetadata.separator.style.display = '';
            }
            templateData.threadMetadata.icon.classList.remove(...Array.from(templateData.threadMetadata.icon.classList.values())
                .filter(value => value.startsWith('codicon')));
            templateData.threadMetadata.icon.classList.add(...themables_1.ThemeIcon.asClassNameArray(this.getIcon(node.element.threadState)));
            if (node.element.threadState !== undefined) {
                const color = this.getCommentThreadWidgetStateColor(node.element.threadState, this.themeService.getColorTheme());
                templateData.threadMetadata.icon.style.setProperty(commentColors_1.commentViewThreadStateColorVar, `${color}`);
                templateData.threadMetadata.icon.style.color = `var(${commentColors_1.commentViewThreadStateColorVar})`;
            }
            templateData.threadMetadata.userNames.textContent = node.element.comment.userName;
            templateData.threadMetadata.timestamp.setTimestamp(node.element.comment.timestamp ? new Date(node.element.comment.timestamp) : undefined);
            const originalComment = node.element;
            templateData.threadMetadata.commentPreview.innerText = '';
            templateData.threadMetadata.commentPreview.style.height = '22px';
            if (typeof originalComment.comment.body === 'string') {
                templateData.threadMetadata.commentPreview.innerText = originalComment.comment.body;
            }
            else {
                const disposables = new lifecycle_1.DisposableStore();
                templateData.disposables.push(disposables);
                const renderedComment = this.getRenderedComment(originalComment.comment.body, disposables);
                templateData.disposables.push(renderedComment);
                templateData.threadMetadata.commentPreview.appendChild(renderedComment.element.firstElementChild ?? renderedComment.element);
                templateData.disposables.push(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), templateData.threadMetadata.commentPreview, renderedComment.element.textContent ?? ''));
            }
            if (node.element.range) {
                if (node.element.range.startLineNumber === node.element.range.endLineNumber) {
                    templateData.threadMetadata.range.textContent = nls.localize('commentLine', "[Ln {0}]", node.element.range.startLineNumber);
                }
                else {
                    templateData.threadMetadata.range.textContent = nls.localize('commentRange', "[Ln {0}-{1}]", node.element.range.startLineNumber, node.element.range.endLineNumber);
                }
            }
            const menuActions = this.menus.getResourceActions(node.element);
            templateData.actionBar.push(menuActions.actions, { icon: true, label: false });
            templateData.actionBar.context = {
                commentControlHandle: node.element.controllerHandle,
                commentThreadHandle: node.element.threadHandle,
                $mid: 7 /* MarshalledId.CommentThread */
            };
            if (!node.element.hasReply()) {
                templateData.repliesMetadata.container.style.display = 'none';
                return;
            }
            templateData.repliesMetadata.container.style.display = '';
            templateData.repliesMetadata.count.textContent = this.getCountString(commentCount);
            const lastComment = node.element.replies[node.element.replies.length - 1].comment;
            templateData.repliesMetadata.lastReplyDetail.textContent = nls.localize('lastReplyFrom', "Last reply from {0}", lastComment.userName);
            templateData.repliesMetadata.timestamp.setTimestamp(lastComment.timestamp ? new Date(lastComment.timestamp) : undefined);
        }
        getCommentThreadWidgetStateColor(state, theme) {
            return (state !== undefined) ? (0, commentColors_1.getCommentThreadStateIconColor)(state, theme) : undefined;
        }
        disposeTemplate(templateData) {
            templateData.disposables.forEach(disposeable => disposeable.dispose());
            templateData.actionBar.dispose();
        }
    };
    exports.CommentNodeRenderer = CommentNodeRenderer;
    exports.CommentNodeRenderer = CommentNodeRenderer = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, hover_1.IHoverService),
        __param(5, themeService_1.IThemeService)
    ], CommentNodeRenderer);
    var FilterDataType;
    (function (FilterDataType) {
        FilterDataType[FilterDataType["Resource"] = 0] = "Resource";
        FilterDataType[FilterDataType["Comment"] = 1] = "Comment";
    })(FilterDataType || (FilterDataType = {}));
    class Filter {
        constructor(options) {
            this.options = options;
        }
        filter(element, parentVisibility) {
            if (this.options.filter === '' && this.options.showResolved && this.options.showUnresolved) {
                return 1 /* TreeVisibility.Visible */;
            }
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return this.filterResourceMarkers(element);
            }
            else {
                return this.filterCommentNode(element, parentVisibility);
            }
        }
        filterResourceMarkers(resourceMarkers) {
            // Filter by text. Do not apply negated filters on resources instead use exclude patterns
            if (this.options.textFilter.text && !this.options.textFilter.negate) {
                const uriMatches = commentsFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, (0, resources_1.basename)(resourceMarkers.resource));
                if (uriMatches) {
                    return { visibility: true, data: { type: 0 /* FilterDataType.Resource */, uriMatches: uriMatches || [] } };
                }
            }
            return 2 /* TreeVisibility.Recurse */;
        }
        filterCommentNode(comment, parentVisibility) {
            const matchesResolvedState = (comment.threadState === undefined) || (this.options.showResolved && languages_1.CommentThreadState.Resolved === comment.threadState) ||
                (this.options.showUnresolved && languages_1.CommentThreadState.Unresolved === comment.threadState);
            if (!matchesResolvedState) {
                return false;
            }
            if (!this.options.textFilter.text) {
                return true;
            }
            const textMatches = 
            // Check body of comment for value
            commentsFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, typeof comment.comment.body === 'string' ? comment.comment.body : comment.comment.body.value)
                // Check first user for value
                || commentsFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, comment.comment.userName)
                // Check all replies for value
                || comment.replies.map(reply => {
                    // Check user for value
                    return commentsFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, reply.comment.userName)
                        // Check body of reply for value
                        || commentsFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, typeof reply.comment.body === 'string' ? reply.comment.body : reply.comment.body.value);
                }).filter(value => !!value).flat();
            // Matched and not negated
            if (textMatches.length && !this.options.textFilter.negate) {
                return { visibility: true, data: { type: 1 /* FilterDataType.Comment */, textMatches } };
            }
            // Matched and negated - exclude it only if parent visibility is not set
            if (textMatches.length && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return false;
            }
            // Not matched and negated - include it only if parent visibility is not set
            if ((textMatches.length === 0) && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return true;
            }
            return parentVisibility;
        }
    }
    exports.Filter = Filter;
    let CommentsList = class CommentsList extends listService_1.WorkbenchObjectTree {
        constructor(labels, container, options, contextKeyService, listService, instantiationService, configurationService, contextMenuService, keybindingService) {
            const delegate = new CommentsModelVirualDelegate();
            const actionViewItemProvider = menuEntryActionViewItem_1.createActionViewItem.bind(undefined, instantiationService);
            const menus = instantiationService.createInstance(CommentsMenus);
            menus.setContextKeyService(contextKeyService);
            const renderers = [
                instantiationService.createInstance(ResourceWithCommentsRenderer, labels),
                instantiationService.createInstance(CommentNodeRenderer, actionViewItemProvider, menus)
            ];
            super('CommentsTree', container, delegate, renderers, {
                accessibilityProvider: options.accessibilityProvider,
                identityProvider: {
                    getId: (element) => {
                        if (element instanceof commentsModel_1.CommentsModel) {
                            return 'root';
                        }
                        if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                            return `${element.uniqueOwner}-${element.id}`;
                        }
                        if (element instanceof commentModel_1.CommentNode) {
                            return `${element.uniqueOwner}-${element.resource.toString()}-${element.threadId}-${element.comment.uniqueIdInThread}` + (element.isRoot ? '-root' : '');
                        }
                        return '';
                    }
                },
                expandOnlyOnTwistieClick: true,
                collapseByDefault: false,
                overrideStyles: options.overrideStyles,
                filter: options.filter,
                findWidgetEnabled: false,
                multipleSelectionSupport: false,
            }, instantiationService, contextKeyService, listService, configurationService);
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menus = menus;
            this.disposables.add(this.onContextMenu(e => this.commentsOnContextMenu(e)));
        }
        commentsOnContextMenu(treeEvent) {
            const node = treeEvent.element;
            if (!(node instanceof commentModel_1.CommentNode)) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            this.setFocus([node]);
            const actions = this.menus.getResourceContextActions(node);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.domFocus();
                    }
                },
                getActionsContext: () => ({
                    commentControlHandle: node.controllerHandle,
                    commentThreadHandle: node.threadHandle,
                    $mid: 7 /* MarshalledId.CommentThread */,
                    thread: node.thread
                })
            });
        }
        filterComments() {
            this.refilter();
        }
        getVisibleItemCount() {
            let filtered = 0;
            const root = this.getNode();
            for (const resourceNode of root.children) {
                for (const commentNode of resourceNode.children) {
                    if (commentNode.visible && resourceNode.visible) {
                        filtered++;
                    }
                }
            }
            return filtered;
        }
    };
    exports.CommentsList = CommentsList;
    exports.CommentsList = CommentsList = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService)
    ], CommentsList);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNUcmVlVmlld2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50c1RyZWVWaWV3ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkNuRixRQUFBLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDO0lBQzlDLFFBQUEsd0JBQXdCLEdBQUcsVUFBVSxDQUFDO0lBQ3RDLFFBQUEsbUJBQW1CLEdBQXFCLEdBQUcsQ0FBQyxTQUFTLENBQUMscUJBQXFCLEVBQUUsVUFBVSxDQUFDLENBQUM7SUE4QnRHLE1BQU0sMkJBQTJCO2lCQUNSLGdCQUFXLEdBQUcsd0JBQXdCLENBQUM7aUJBQ3ZDLGVBQVUsR0FBRyxjQUFjLENBQUM7UUFHcEQsU0FBUyxDQUFDLE9BQVk7WUFDckIsSUFBSSxDQUFDLE9BQU8sWUFBWSwwQkFBVyxDQUFDLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQzVELE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVNLGFBQWEsQ0FBQyxPQUFZO1lBQ2hDLElBQUksT0FBTyxZQUFZLHlDQUEwQixFQUFFLENBQUM7Z0JBQ25ELE9BQU8sMkJBQTJCLENBQUMsV0FBVyxDQUFDO1lBQ2hELENBQUM7WUFDRCxJQUFJLE9BQU8sWUFBWSwwQkFBVyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sMkJBQTJCLENBQUMsVUFBVSxDQUFDO1lBQy9DLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7O0lBR0YsTUFBYSw0QkFBNEI7UUFHeEMsWUFDUyxNQUFzQjtZQUF0QixXQUFNLEdBQU4sTUFBTSxDQUFnQjtZQUgvQixlQUFV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