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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/base/common/strings", "vs/platform/commands/common/commands", "vs/platform/contextview/browser/contextView", "vs/editor/common/editorContextKeys", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/list/browser/listService", "vs/workbench/common/contextkeys", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/platform/hover/browser/hover", "vs/base/browser/ui/aria/aria", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/base/common/themables", "vs/base/common/codicons", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/comments/browser/commentsView", "vs/platform/actions/common/actions", "vs/editor/contrib/hover/browser/hoverController", "vs/base/common/htmlContent", "vs/base/common/uri"], function (require, exports, lifecycle_1, codeEditorService_1, nls_1, keybinding_1, accessibilityConfiguration_1, strings, commands_1, contextView_1, editorContextKeys_1, notificationsCommands_1, listService_1, contextkeys_1, accessibleView_1, hover_1, aria_1, accessibleViewActions_1, themables_1, codicons_1, inlineCompletionsController_1, inlineCompletionContextKeys_1, contextkey_1, accessibilitySignalService_1, views_1, platform_1, commentsTreeViewer_1, viewsService_1, commentsView_1, actions_1, hoverController_1, htmlContent_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionAccessibilityHelpDialogContribution = exports.InlineCompletionsAccessibleViewContribution = exports.CommentAccessibleViewContribution = exports.NotificationAccessibleViewContribution = exports.HoverAccessibleViewContribution = void 0;
    exports.descriptionForCommand = descriptionForCommand;
    exports.alertFocusChange = alertFocusChange;
    function descriptionForCommand(commandId, msg, noKbMsg, keybindingService) {
        const kb = keybindingService.lookupKeybinding(commandId);
        if (kb) {
            return strings.format(msg, kb.getAriaLabel());
        }
        return strings.format(noKbMsg, commandId);
    }
    class HoverAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._options = { language: 'typescript', type: "view" /* AccessibleViewType.View */ };
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(95, 'hover', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
                const editorHoverContent = editor ? hoverController_1.HoverController.get(editor)?.getWidgetContent() ?? undefined : undefined;
                if (!editor || !editorHoverContent) {
                    return false;
                }
                this._options.language = editor?.getModel()?.getLanguageId() ?? undefined;
                accessibleViewService.show({
                    id: "hover" /* AccessibleViewProviderId.Hover */,
                    verbositySettingKey: "accessibility.verbosity.hover" /* AccessibilityVerbositySettingId.Hover */,
                    provideContent() { return editorHoverContent; },
                    onClose() {
                        hoverController_1.HoverController.get(editor)?.focus();
                    },
                    options: this._options
                });
                return true;
            }, editorContextKeys_1.EditorContextKeys.hoverFocused));
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'extension-hover', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const contextViewService = accessor.get(contextView_1.IContextViewService);
                const contextViewElement = contextViewService.getContextViewElement();
                const extensionHoverContent = contextViewElement?.textContent ?? undefined;
                const hoverService = accessor.get(hover_1.IHoverService);
                if (contextViewElement.classList.contains('accessible-view-container') || !extensionHoverContent) {
                    // The accessible view, itself, uses the context view service to display the text. We don't want to read that.
                    return false;
                }
                accessibleViewService.show({
                    id: "hover" /* AccessibleViewProviderId.Hover */,
                    verbositySettingKey: "accessibility.verbosity.hover" /* AccessibilityVerbositySettingId.Hover */,
                    provideContent() { return extensionHoverContent; },
                    onClose() {
                        hoverService.showAndFocusLastHover();
                    },
                    options: this._options
                });
                return true;
            }));
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(115, 'accessible-view', accessor => {
                accessor.get(accessibleView_1.IAccessibleViewService).showAccessibleViewHelp();
                return true;
            }, accessibilityConfiguration_1.accessibleViewIsShown));
        }
    }
    exports.HoverAccessibleViewContribution = HoverAccessibleViewContribution;
    class NotificationAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'notifications', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const listService = accessor.get(listService_1.IListService);
                const commandService = accessor.get(commands_1.ICommandService);
                const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
                function renderAccessibleView() {
                    const notification = (0, notificationsCommands_1.getNotificationFromContext)(listService);
                    if (!notification) {
                        return false;
                    }
                    commandService.executeCommand('notifications.showList');
                    let notificationIndex;
                    let length;
                    const list = listService.lastFocusedList;
                    if (list instanceof listService_1.WorkbenchList) {
                        notificationIndex = list.indexOf(notification);
                        length = list.length;
                    }
                    if (notificationIndex === undefined) {
                        return false;
                    }
                    function focusList() {
                        commandService.executeCommand('notifications.showList');
                        if (list && notificationIndex !== undefined) {
                            list.domFocus();
                            try {
                                list.setFocus([notificationIndex]);
                            }
                            catch { }
                        }
                    }
                    const message = notification.message.original.toString();
                    if (!message) {
                        return false;
                    }
                    notification.onDidClose(() => accessibleViewService.next());
                    accessibleViewService.show({
                        id: "notification" /* AccessibleViewProviderId.Notification */,
                        provideContent: () => {
                            return notification.source ? (0, nls_1.localize)('notification.accessibleViewSrc', '{0} Source: {1}', message, notification.source) : (0, nls_1.localize)('notification.accessibleView', '{0}', message);
                        },
                        onClose() {
                            focusList();
                        },
                        next() {
                            if (!list) {
                                return;
                            }
                            focusList();
                            list.focusNext();
                            alertFocusChange(notificationIndex, length, 'next');
                            renderAccessibleView();
                        },
                        previous() {
                            if (!list) {
                                return;
                            }
                            focusList();
                            list.focusPrevious();
                            alertFocusChange(notificationIndex, length, 'previous');
                            renderAccessibleView();
                        },
                        verbositySettingKey: "accessibility.verbosity.notification" /* AccessibilityVerbositySettingId.Notification */,
                        options: { type: "view" /* AccessibleViewType.View */ },
                        actions: getActionsFromNotification(notification, accessibilitySignalService)
                    });
                    return true;
                }
                return renderAccessibleView();
            }, contextkeys_1.NotificationFocusedContext));
        }
    }
    exports.NotificationAccessibleViewContribution = NotificationAccessibleViewContribution;
    function getActionsFromNotification(notification, accessibilitySignalService) {
        let actions = undefined;
        if (notification.actions) {
            actions = [];
            if (notification.actions.primary) {
                actions.push(...notification.actions.primary);
            }
            if (notification.actions.secondary) {
                actions.push(...notification.actions.secondary);
            }
        }
        if (actions) {
            for (const action of actions) {
                action.class = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.bell);
                const initialAction = action.run;
                action.run = () => {
                    initialAction();
                    notification.close();
                };
            }
        }
        const manageExtension = actions?.find(a => a.label.includes('Manage Extension'));
        if (manageExtension) {
            manageExtension.class = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.gear);
        }
        if (actions) {
            actions.push({
                id: 'clearNotification', label: (0, nls_1.localize)('clearNotification', "Clear Notification"), tooltip: (0, nls_1.localize)('clearNotification', "Clear Notification"), run: () => {
                    notification.close();
                    accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
                }, enabled: true, class: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.clearAll)
            });
        }
        return actions;
    }
    function alertFocusChange(index, length, type) {
        if (index === undefined || length === undefined) {
            return;
        }
        const number = index + 1;
        if (type === 'next' && number + 1 <= length) {
            (0, aria_1.alert)(`Focused ${number + 1} of ${length}`);
        }
        else if (type === 'previous' && number - 1 > 0) {
            (0, aria_1.alert)(`Focused ${number - 1} of ${length}`);
        }
        return;
    }
    class CommentAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'comment', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
                const viewsService = accessor.get(viewsService_1.IViewsService);
                const menuService = accessor.get(actions_1.IMenuService);
                const commentsView = viewsService.getActiveViewWithId(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                if (!commentsView) {
                    return false;
                }
                const menus = this._register(new commentsTreeViewer_1.CommentsMenus(menuService));
                menus.setContextKeyService(contextKeyService);
                function renderAccessibleView() {
                    if (!commentsView) {
                        return false;
                    }
                    const commentNode = commentsView.focusedCommentNode;
                    const content = commentsView.focusedCommentInfo?.toString();
                    if (!commentNode || !content) {
                        return false;
                    }
                    const menuActions = [...menus.getResourceContextActions(commentNode)].filter(i => i.enabled);
                    const actions = menuActions.map(action => {
                        return {
                            ...action,
                            run: () => {
                                commentsView.focus();
                                action.run({
                                    thread: commentNode.thread,
                                    $mid: 7 /* MarshalledId.CommentThread */,
                                    commentControlHandle: commentNode.controllerHandle,
                                    commentThreadHandle: commentNode.threadHandle,
                                });
                            }
                        };
                    });
                    accessibleViewService.show({
                        id: "notification" /* AccessibleViewProviderId.Notification */,
                        provideContent: () => {
                            return content;
                        },
                        onClose() {
                            commentsView.focus();
                        },
                        next() {
                            commentsView.focus();
                            commentsView.focusNextNode();
                            renderAccessibleView();
                        },
                        previous() {
                            commentsView.focus();
                            commentsView.focusPreviousNode();
                            renderAccessibleView();
                        },
                        verbositySettingKey: "accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */,
                        options: { type: "view" /* AccessibleViewType.View */ },
                        actions
                    });
                    return true;
                }
                return renderAccessibleView();
            }, commentsView_1.CONTEXT_KEY_HAS_COMMENTS));
        }
    }
    exports.CommentAccessibleViewContribution = CommentAccessibleViewContribution;
    class InlineCompletionsAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._options = { type: "view" /* AccessibleViewType.View */ };
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(95, 'inline-completions', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const show = () => {
                    const editor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
                    if (!editor) {
                        return false;
                    }
                    const model = inlineCompletionsController_1.InlineCompletionsController.get(editor)?.model.get();
                    const state = model?.state.get();
                    if (!model || !state) {
                        return false;
                    }
                    const lineText = model.textModel.getLineContent(state.primaryGhostText.lineNumber);
                    const ghostText = state.primaryGhostText.renderForScreenReader(lineText);
                    if (!ghostText) {
                        return false;
                    }
                    this._options.language = editor.getModel()?.getLanguageId() ?? undefined;
                    accessibleViewService.show({
                        id: "inlineCompletions" /* AccessibleViewProviderId.InlineCompletions */,
                        verbositySettingKey: "accessibility.verbosity.inlineCompletions" /* AccessibilityVerbositySettingId.InlineCompletions */,
                        provideContent() { return lineText + ghostText; },
                        onClose() {
                            model.stop();
                            editor.focus();
                        },
                        next() {
                            model.next();
                            setTimeout(() => show(), 50);
                        },
                        previous() {
                            model.previous();
                            setTimeout(() => show(), 50);
                        },
                        options: this._options
                    });
                    return true;
                };
                contextkey_1.ContextKeyExpr.and(inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible);
                return show();
            }));
        }
    }
    exports.InlineCompletionsAccessibleViewContribution = InlineCompletionsAccessibleViewContribution;
    let ExtensionAccessibilityHelpDialogContribution = class ExtensionAccessibilityHelpDialogContribution extends lifecycle_1.Disposable {
        static { this.ID = 'extensionAccessibilityHelpDialogContribution'; }
        constructor(keybindingService) {
            super();
            this._viewHelpDialogMap = this._register(new lifecycle_1.DisposableMap());
            this._register(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).onViewsRegistered(e => {
                for (const view of e) {
                    for (const viewDescriptor of view.views) {
                        if (viewDescriptor.accessibilityHelpContent) {
                            this._viewHelpDialogMap.set(viewDescriptor.id, registerAccessibilityHelpAction(keybindingService, viewDescriptor));
                        }
                    }
                }
            }));
            this._register(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).onViewsDeregistered(e => {
                for (const viewDescriptor of e.views) {
                    if (viewDescriptor.accessibilityHelpContent) {
                        this._viewHelpDialogMap.get(viewDescriptor.id)?.dispose();
                    }
                }
            }));
        }
    };
    exports.ExtensionAccessibilityHelpDialogContribution = ExtensionAccessibilityHelpDialogContribution;
    exports.ExtensionAccessibilityHelpDialogContribution = ExtensionAccessibilityHelpDialogContribution = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], ExtensionAccessibilityHelpDialogContribution);
    function registerAccessibilityHelpAction(keybindingService, viewDescriptor) {
        const disposableStore = new lifecycle_1.DisposableStore();
        const helpContent = resolveExtensionHelpContent(keybindingService, viewDescriptor.accessibilityHelpContent);
        if (!helpContent) {
            throw new Error('No help content for view');
        }
        disposableStore.add(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(95, viewDescriptor.id, accessor => {
            const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            accessibleViewService.show(new accessibleView_1.ExtensionContentProvider(viewDescriptor.id, { type: "help" /* AccessibleViewType.Help */ }, () => helpContent.value, () => viewsService.openView(viewDescriptor.id, true)));
            return true;
        }, contextkeys_1.FocusedViewContext.isEqualTo(viewDescriptor.id)));
        disposableStore.add(keybindingService.onDidUpdateKeybindings(() => {
            disposableStore.clear();
            disposableStore.add(registerAccessibilityHelpAction(keybindingService, viewDescriptor));
        }));
        return disposableStore;
    }
    function resolveExtensionHelpContent(keybindingService, content) {
        if (!content) {
            return;
        }
        let resolvedContent = typeof content === 'string' ? content : content.value;
        const matches = resolvedContent.matchAll(/\<keybinding:(?<commandId>.*)\>/gm);
        for (const match of [...matches]) {
            const commandId = match?.groups?.commandId;
            if (match?.length && commandId) {
                const keybinding = keybindingService.lookupKeybinding(commandId)?.getAriaLabel();
                let kbLabel = keybinding;
                if (!kbLabel) {
                    const args = uri_1.URI.parse(`command:workbench.action.openGlobalKeybindings?${encodeURIComponent(JSON.stringify(commandId))}`);
                    kbLabel = ` [Configure a keybinding](${args})`;
                }
                else {
                    kbLabel = ' (' + keybinding + ')';
                }
                resolvedContent = resolvedContent.replace(match[0], kbLabel);
            }
        }
        const result = new htmlContent_1.MarkdownString(resolvedContent);
        result.isTrusted = true;
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZVZpZXdDb250cmlidXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL2FjY2Vzc2libGVWaWV3Q29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQ2hHLHNEQU1DO0lBMEtELDRDQVlDO0lBNUxELFNBQWdCLHFCQUFxQixDQUFDLFNBQWlCLEVBQUUsR0FBVyxFQUFFLE9BQWUsRUFBRSxpQkFBcUM7UUFDM0gsTUFBTSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekQsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUNSLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELE1BQWEsK0JBQWdDLFNBQVEsc0JBQVU7UUFHOUQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUZELGFBQVEsR0FBMkIsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLElBQUksc0NBQXlCLEVBQUUsQ0FBQztZQUdwRyxJQUFJLENBQUMsU0FBUyxDQUFDLDRDQUFvQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQzdFLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNuRyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsaUNBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDN0csSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3BDLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLFNBQVMsQ0FBQztnQkFDMUUscUJBQXFCLENBQUMsSUFBSSxDQUFDO29CQUMxQixFQUFFLDhDQUFnQztvQkFDbEMsbUJBQW1CLDZFQUF1QztvQkFDMUQsY0FBYyxLQUFLLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxPQUFPO3dCQUNOLGlDQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO29CQUN0QyxDQUFDO29CQUNELE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUTtpQkFDdEIsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxFQUFFLHFDQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0Q0FBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ3ZGLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN0RSxNQUFNLHFCQUFxQixHQUFHLGtCQUFrQixFQUFFLFdBQVcsSUFBSSxTQUFTLENBQUM7Z0JBQzNFLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUJBQWEsQ0FBQyxDQUFDO2dCQUVqRCxJQUFJLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ2xHLDhHQUE4RztvQkFDOUcsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFDRCxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLEVBQUUsOENBQWdDO29CQUNsQyxtQkFBbUIsNkVBQXVDO29CQUMxRCxjQUFjLEtBQUssT0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELE9BQU87d0JBQ04sWUFBWSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3RDLENBQUM7b0JBQ0QsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO2lCQUN0QixDQUFDLENBQUM7Z0JBQ0gsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQywrQ0FBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQzNGLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUM5RCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsRUFBRSxrREFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBcERELDBFQW9EQztJQUVELE1BQWEsc0NBQXVDLFNBQVEsc0JBQVU7UUFFckU7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsNENBQW9CLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGVBQWUsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDckYsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7Z0JBQ25FLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQVksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztnQkFDckQsTUFBTSwwQkFBMEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdEQUEyQixDQUFDLENBQUM7Z0JBRTdFLFNBQVMsb0JBQW9CO29CQUM1QixNQUFNLFlBQVksR0FBRyxJQUFBLGtEQUEwQixFQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsY0FBYyxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO29CQUN4RCxJQUFJLGlCQUFxQyxDQUFDO29CQUMxQyxJQUFJLE1BQTBCLENBQUM7b0JBQy9CLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUM7b0JBQ3pDLElBQUksSUFBSSxZQUFZLDJCQUFhLEVBQUUsQ0FBQzt3QkFDbkMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDL0MsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7b0JBQ3RCLENBQUM7b0JBQ0QsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDckMsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztvQkFFRCxTQUFTLFNBQVM7d0JBQ2pCLGNBQWMsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQzt3QkFDeEQsSUFBSSxJQUFJLElBQUksaUJBQWlCLEtBQUssU0FBUyxFQUFFLENBQUM7NEJBQzdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDaEIsSUFBSSxDQUFDO2dDQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7NEJBQ3BDLENBQUM7NEJBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDWixDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3pELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZCxPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUNELFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDNUQscUJBQXFCLENBQUMsSUFBSSxDQUFDO3dCQUMxQixFQUFFLDREQUF1Qzt3QkFDekMsY0FBYyxFQUFFLEdBQUcsRUFBRTs0QkFDcEIsT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ3BMLENBQUM7d0JBQ0QsT0FBTzs0QkFDTixTQUFTLEVBQUUsQ0FBQzt3QkFDYixDQUFDO3dCQUNELElBQUk7NEJBQ0gsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dDQUNYLE9BQU87NEJBQ1IsQ0FBQzs0QkFDRCxTQUFTLEVBQUUsQ0FBQzs0QkFDWixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ2pCLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDcEQsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDeEIsQ0FBQzt3QkFDRCxRQUFROzRCQUNQLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQ0FDWCxPQUFPOzRCQUNSLENBQUM7NEJBQ0QsU0FBUyxFQUFFLENBQUM7NEJBQ1osSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzRCQUNyQixnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBQ3hELG9CQUFvQixFQUFFLENBQUM7d0JBQ3hCLENBQUM7d0JBQ0QsbUJBQW1CLDJGQUE4Qzt3QkFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxzQ0FBeUIsRUFBRTt3QkFDMUMsT0FBTyxFQUFFLDBCQUEwQixDQUFDLFlBQVksRUFBRSwwQkFBMEIsQ0FBQztxQkFDN0UsQ0FBQyxDQUFDO29CQUNILE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBQ0QsT0FBTyxvQkFBb0IsRUFBRSxDQUFDO1lBQy9CLENBQUMsRUFBRSx3Q0FBMEIsQ0FBQyxDQUFDLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBNUVELHdGQTRFQztJQUVELFNBQVMsMEJBQTBCLENBQUMsWUFBbUMsRUFBRSwwQkFBdUQ7UUFDL0gsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDO1FBQ3hCLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFDRCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO1FBQ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxLQUFLLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztnQkFDakMsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUU7b0JBQ2pCLGFBQWEsRUFBRSxDQUFDO29CQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDO1FBQ0QsTUFBTSxlQUFlLEdBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLGVBQWUsQ0FBQyxLQUFLLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBQ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ1osRUFBRSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7b0JBQzVKLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDckIsMEJBQTBCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxRQUFRLENBQUM7YUFDaEUsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUF5QixFQUFFLE1BQTBCLEVBQUUsSUFBeUI7UUFDaEgsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNqRCxPQUFPO1FBQ1IsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7UUFFekIsSUFBSSxJQUFJLEtBQUssTUFBTSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7WUFDN0MsSUFBQSxZQUFLLEVBQUMsV0FBVyxNQUFNLEdBQUcsQ0FBQyxPQUFPLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQzthQUFNLElBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xELElBQUEsWUFBSyxFQUFDLFdBQVcsTUFBTSxHQUFHLENBQUMsT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxPQUFPO0lBQ1IsQ0FBQztJQUdELE1BQWEsaUNBQWtDLFNBQVEsc0JBQVU7UUFFaEU7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsNENBQW9CLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDL0UsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7Z0JBQ25FLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFhLENBQUMsQ0FBQztnQkFDakQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQkFBWSxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxtQkFBbUIsQ0FBZ0IscUNBQWdCLENBQUMsQ0FBQztnQkFDdkYsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNuQixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQ0FBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUU5QyxTQUFTLG9CQUFvQjtvQkFDNUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNuQixPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUVELE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQztvQkFDcEQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxDQUFDO29CQUM1RCxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQzlCLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDN0YsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDeEMsT0FBTzs0QkFDTixHQUFHLE1BQU07NEJBQ1QsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQ0FDVCxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7Z0NBQ3JCLE1BQU0sQ0FBQyxHQUFHLENBQUM7b0NBQ1YsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO29DQUMxQixJQUFJLG9DQUE0QjtvQ0FDaEMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLGdCQUFnQjtvQ0FDbEQsbUJBQW1CLEVBQUUsV0FBVyxDQUFDLFlBQVk7aUNBQzdDLENBQUMsQ0FBQzs0QkFDSixDQUFDO3lCQUNELENBQUM7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBQ0gscUJBQXFCLENBQUMsSUFBSSxDQUFDO3dCQUMxQixFQUFFLDREQUF1Qzt3QkFDekMsY0FBYyxFQUFFLEdBQUcsRUFBRTs0QkFDcEIsT0FBTyxPQUFPLENBQUM7d0JBQ2hCLENBQUM7d0JBQ0QsT0FBTzs0QkFDTixZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ3RCLENBQUM7d0JBQ0QsSUFBSTs0QkFDSCxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ3JCLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQzs0QkFDN0Isb0JBQW9CLEVBQUUsQ0FBQzt3QkFDeEIsQ0FBQzt3QkFDRCxRQUFROzRCQUNQLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDckIsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUM7NEJBQ2pDLG9CQUFvQixFQUFFLENBQUM7d0JBQ3hCLENBQUM7d0JBQ0QsbUJBQW1CLG1GQUEwQzt3QkFDN0QsT0FBTyxFQUFFLEVBQUUsSUFBSSxzQ0FBeUIsRUFBRTt3QkFDMUMsT0FBTztxQkFDUCxDQUFDLENBQUM7b0JBQ0gsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFDRCxPQUFPLG9CQUFvQixFQUFFLENBQUM7WUFDL0IsQ0FBQyxFQUFFLHVDQUF3QixDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDO0tBQ0Q7SUFwRUQsOEVBb0VDO0lBRUQsTUFBYSwyQ0FBNEMsU0FBUSxzQkFBVTtRQUcxRTtZQUNDLEtBQUssRUFBRSxDQUFDO1lBRkQsYUFBUSxHQUEyQixFQUFFLElBQUksc0NBQXlCLEVBQUUsQ0FBQztZQUc1RSxJQUFJLENBQUMsU0FBUyxDQUFDLDRDQUFvQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDMUYsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7Z0JBQ25FLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQ0FBa0IsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUU7b0JBQ2pCLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLElBQUksaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDbkcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNiLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsTUFBTSxLQUFLLEdBQUcseURBQTJCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDbkUsTUFBTSxLQUFLLEdBQUcsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDakMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUN0QixPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDbkYsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN6RSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ2hCLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLFNBQVMsQ0FBQztvQkFDekUscUJBQXFCLENBQUMsSUFBSSxDQUFDO3dCQUMxQixFQUFFLHNFQUE0Qzt3QkFDOUMsbUJBQW1CLHFHQUFtRDt3QkFDdEUsY0FBYyxLQUFLLE9BQU8sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pELE9BQU87NEJBQ04sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUNiLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDaEIsQ0FBQzt3QkFDRCxJQUFJOzRCQUNILEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDYixVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzlCLENBQUM7d0JBQ0QsUUFBUTs0QkFDUCxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7NEJBQ2pCLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDOUIsQ0FBQzt3QkFDRCxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVE7cUJBQ3RCLENBQUMsQ0FBQztvQkFDSCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDLENBQUM7Z0JBQUMsMkJBQWMsQ0FBQyxHQUFHLENBQUMseURBQTJCLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDM0UsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Q7SUEvQ0Qsa0dBK0NDO0lBRU0sSUFBTSw0Q0FBNEMsR0FBbEQsTUFBTSw0Q0FBNkMsU0FBUSxzQkFBVTtpQkFDcEUsT0FBRSxHQUFHLDhDQUE4QyxBQUFqRCxDQUFrRDtRQUUzRCxZQUFnQyxpQkFBcUM7WUFDcEUsS0FBSyxFQUFFLENBQUM7WUFGRCx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBdUIsQ0FBQyxDQUFDO1lBR3JGLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzFGLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3RCLEtBQUssTUFBTSxjQUFjLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUN6QyxJQUFJLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDOzRCQUM3QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsK0JBQStCLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQzt3QkFDcEgsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsa0JBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDNUYsS0FBSyxNQUFNLGNBQWMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3RDLElBQUksY0FBYyxDQUFDLHdCQUF3QixFQUFFLENBQUM7d0JBQzdDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO29CQUMzRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzs7SUFyQlcsb0dBQTRDOzJEQUE1Qyw0Q0FBNEM7UUFHM0MsV0FBQSwrQkFBa0IsQ0FBQTtPQUhuQiw0Q0FBNEMsQ0FzQnhEO0lBRUQsU0FBUywrQkFBK0IsQ0FBQyxpQkFBcUMsRUFBRSxjQUErQjtRQUM5RyxNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUM5QyxNQUFNLFdBQVcsR0FBRywyQkFBMkIsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUM1RyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxlQUFlLENBQUMsR0FBRyxDQUFDLCtDQUF1QixDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQy9GLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWEsQ0FBQyxDQUFDO1lBQ2pELHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLHlDQUF3QixDQUN0RCxjQUFjLENBQUMsRUFBRSxFQUNqQixFQUFFLElBQUksc0NBQXlCLEVBQUUsRUFDakMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssRUFDdkIsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUNwRCxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsRUFBRSxnQ0FBa0IsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRCxlQUFlLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRTtZQUNqRSxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDeEIsZUFBZSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDSixPQUFPLGVBQWUsQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBUywyQkFBMkIsQ0FBQyxpQkFBcUMsRUFBRSxPQUF3QjtRQUNuRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZCxPQUFPO1FBQ1IsQ0FBQztRQUNELElBQUksZUFBZSxHQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQzVFLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsbUNBQW1DLENBQUMsQ0FBQztRQUM5RSxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDO1lBQzNDLElBQUksS0FBSyxFQUFFLE1BQU0sSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUM7Z0JBQ2pGLElBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE1BQU0sSUFBSSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsa0RBQWtELGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzFILE9BQU8sR0FBRyw2QkFBNkIsSUFBSSxHQUFHLENBQUM7Z0JBQ2hELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLEdBQUcsSUFBSSxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUM7Z0JBQ25DLENBQUM7Z0JBQ0QsZUFBZSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlELENBQUM7UUFDRixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSw0QkFBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9