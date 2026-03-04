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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/common/strings", "vs/base/browser/dom", "vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode"], function (require, exports, lifecycle_1, contextkey_1, instantiation_1, accessibleView_1, accessibleViewActions_1, simpleCommentEditor_1, commentContextKeys_1, nls, keybinding_1, strings, dom_1, toggleTabFocusMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsAccessibilityHelpContribution = exports.CommentsAccessibilityHelpProvider = exports.CommentAccessibilityHelpNLS = void 0;
    var CommentAccessibilityHelpNLS;
    (function (CommentAccessibilityHelpNLS) {
        CommentAccessibilityHelpNLS.intro = nls.localize('intro', "The editor contains commentable range(s). Some useful commands include:");
        CommentAccessibilityHelpNLS.introWidget = nls.localize('introWidget', "This widget contains a text area, for composition of new comments, and actions, that can be tabbed to once tab moves focus mode has been enabled ({0}).");
        CommentAccessibilityHelpNLS.introWidgetNoKb = nls.localize('introWidgetNoKb', "This widget contains a text area, for composition of new comments, and actions, that can be tabbed to once tab moves focus mode has been enabled with the command Toggle Tab Key Moves Focus, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.commentCommands = nls.localize('commentCommands', "Some useful comment commands include:");
        CommentAccessibilityHelpNLS.escape = nls.localize('escape', "- Dismiss Comment (Escape)");
        CommentAccessibilityHelpNLS.nextRange = nls.localize('next', "- Go to Next Commenting Range ({0})");
        CommentAccessibilityHelpNLS.nextRangeNoKb = nls.localize('nextNoKb', "- Go to Next Commenting Range, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.previousRange = nls.localize('previous', "- Go to Previous Commenting Range ({0})");
        CommentAccessibilityHelpNLS.previousRangeNoKb = nls.localize('previousNoKb', "- Go to Previous Commenting Range, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.nextCommentThreadKb = nls.localize('nextCommentThreadKb', "- Go to Next Comment Thread ({0})");
        CommentAccessibilityHelpNLS.nextCommentThreadNoKb = nls.localize('nextCommentThreadNoKb', "- Go to Next Comment Thread, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.previousCommentThreadKb = nls.localize('previousCommentThreadKb', "- Go to Previous Comment Thread ({0})");
        CommentAccessibilityHelpNLS.previousCommentThreadNoKb = nls.localize('previousCommentThreadNoKb', "- Go to Previous Comment Thread, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.addComment = nls.localize('addComment', "- Add Comment ({0})");
        CommentAccessibilityHelpNLS.addCommentNoKb = nls.localize('addCommentNoKb', "- Add Comment on Current Selection, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.submitComment = nls.localize('submitComment', "- Submit Comment ({0})");
        CommentAccessibilityHelpNLS.submitCommentNoKb = nls.localize('submitCommentNoKb', "- Submit Comment, accessible via tabbing, as it's currently not triggerable with a keybinding.");
    })(CommentAccessibilityHelpNLS || (exports.CommentAccessibilityHelpNLS = CommentAccessibilityHelpNLS = {}));
    let CommentsAccessibilityHelpProvider = class CommentsAccessibilityHelpProvider {
        constructor(_keybindingService) {
            this._keybindingService = _keybindingService;
            this.id = "comments" /* AccessibleViewProviderId.Comments */;
            this.verbositySettingKey = "accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */;
            this.options = { type: "help" /* AccessibleViewType.Help */ };
        }
        _descriptionForCommand(commandId, msg, noKbMsg) {
            const kb = this._keybindingService.lookupKeybinding(commandId);
            if (kb) {
                return strings.format(msg, kb.getAriaLabel());
            }
            return strings.format(noKbMsg, commandId);
        }
        provideContent() {
            this._element = (0, dom_1.getActiveElement)();
            const content = [];
            content.push(this._descriptionForCommand(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, CommentAccessibilityHelpNLS.introWidget, CommentAccessibilityHelpNLS.introWidgetNoKb) + '\n');
            content.push(CommentAccessibilityHelpNLS.commentCommands);
            content.push(CommentAccessibilityHelpNLS.escape);
            content.push(this._descriptionForCommand("workbench.action.addComment" /* CommentCommandId.Add */, CommentAccessibilityHelpNLS.addComment, CommentAccessibilityHelpNLS.addCommentNoKb));
            content.push(this._descriptionForCommand("editor.action.submitComment" /* CommentCommandId.Submit */, CommentAccessibilityHelpNLS.submitComment, CommentAccessibilityHelpNLS.submitCommentNoKb));
            content.push(this._descriptionForCommand("editor.action.nextCommentingRange" /* CommentCommandId.NextRange */, CommentAccessibilityHelpNLS.nextRange, CommentAccessibilityHelpNLS.nextRangeNoKb));
            content.push(this._descriptionForCommand("editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */, CommentAccessibilityHelpNLS.previousRange, CommentAccessibilityHelpNLS.previousRangeNoKb));
            return content.join('\n');
        }
        onClose() {
            this._element?.focus();
        }
    };
    exports.CommentsAccessibilityHelpProvider = CommentsAccessibilityHelpProvider;
    exports.CommentsAccessibilityHelpProvider = CommentsAccessibilityHelpProvider = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], CommentsAccessibilityHelpProvider);
    class CommentsAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(110, 'comments', accessor => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                accessibleViewService.show(instantiationService.createInstance(CommentsAccessibilityHelpProvider));
                return true;
            }, contextkey_1.ContextKeyExpr.or(simpleCommentEditor_1.ctxCommentEditorFocused, commentContextKeys_1.CommentContextKeys.commentFocused)));
        }
    }
    exports.CommentsAccessibilityHelpContribution = CommentsAccessibilityHelpContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNBY2Nlc3NpYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50c0FjY2Vzc2liaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxJQUFpQiwyQkFBMkIsQ0FrQjNDO0lBbEJELFdBQWlCLDJCQUEyQjtRQUM5QixpQ0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLHlFQUF5RSxDQUFDLENBQUM7UUFDekcsdUNBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSx5SkFBeUosQ0FBQyxDQUFDO1FBQ3JNLDJDQUFlLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxrUEFBa1AsQ0FBQyxDQUFDO1FBQ3RTLDJDQUFlLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1FBQzNGLGtDQUFNLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUM5RCxxQ0FBUyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLHFDQUFxQyxDQUFDLENBQUM7UUFDeEUseUNBQWEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxtRkFBbUYsQ0FBQyxDQUFDO1FBQzlILHlDQUFhLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUseUNBQXlDLENBQUMsQ0FBQztRQUNwRiw2Q0FBaUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSx1RkFBdUYsQ0FBQyxDQUFDO1FBQzFJLCtDQUFtQixHQUFHLEdBQUcs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