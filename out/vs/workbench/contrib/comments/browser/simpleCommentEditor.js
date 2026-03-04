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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/dictation/editorDictation", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/platform/theme/common/themeService", "vs/platform/notification/common/notification", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/base/common/numbers", "vs/editor/contrib/dropOrPasteInto/browser/copyPasteController", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorController", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/links/browser/links", "vs/editor/contrib/message/browser/messageController", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/platform/actions/common/actions", "vs/editor/contrib/hover/browser/hoverController"], function (require, exports, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, contextkey_1, instantiation_1, commands_1, menuPreventer_1, editorDictation_1, contextmenu_1, suggestController_1, snippetController2_1, tabCompletion_1, themeService_1, notification_1, accessibility_1, commentContextKeys_1, languageConfigurationRegistry_1, languageFeatures_1, numbers_1, copyPasteController_1, codeActionController_1, dropIntoEditorController_1, inlineCompletionsController_1, links_1, messageController_1, selectionClipboard_1, actions_1, hoverController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCommentEditor = exports.MAX_EDITOR_HEIGHT = exports.MIN_EDITOR_HEIGHT = exports.ctxCommentEditorFocused = void 0;
    exports.calculateEditorHeight = calculateEditorHeight;
    exports.ctxCommentEditorFocused = new contextkey_1.RawContextKey('commentEditorFocused', false);
    exports.MIN_EDITOR_HEIGHT = 5 * 18;
    exports.MAX_EDITOR_HEIGHT = 25 * 18;
    let SimpleCommentEditor = class SimpleCommentEditor extends codeEditorWidget_1.CodeEditorWidget {
        constructor(domElement, options, scopedContextKeyService, parentThread, instantiationService, codeEditorService, commandService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService) {
            const codeEditorWidgetOptions = {
                contributions: [
                    { id: menuPreventer_1.MenuPreventer.ID, ctor: menuPreventer_1.MenuPreventer, instantiation: 2 /* EditorContributionInstantiation.BeforeFirstInteraction */ },
                    { id: contextmenu_1.ContextMenuController.ID, ctor: contextmenu_1.ContextMenuController, instantiation: 2 /* EditorContributionInstantiation.BeforeFirstInteraction */ },
                    { id: suggestController_1.SuggestController.ID, ctor: suggestController_1.SuggestController, instantiation: 0 /* EditorContributionInstantiation.Eager */ },
                    { id: snippetController2_1.SnippetController2.ID, ctor: snippetController2_1.SnippetController2, instantiation: 4 /* EditorContributionInstantiation.Lazy */ },
                    { id: tabCompletion_1.TabCompletionController.ID, ctor: tabCompletion_1.TabCompletionController, instantiation: 0 /* EditorContributionInstantiation.Eager */ }, // eager because it needs to define a context key
                    { id: editorDictation_1.EditorDictation.ID, ctor: editorDictation_1.EditorDictation, instantiation: 4 /* EditorContributionInstantiation.Lazy */ },
                    ...editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                        copyPasteController_1.CopyPasteController.ID,
                        dropIntoEditorController_1.DropIntoEditorController.ID,
                        links_1.LinkDetector.ID,
                        messageController_1.MessageController.ID,
                        hoverController_1.HoverController.ID,
                        selectionClipboard_1.SelectionClipboardContributionID,
                        inlineCompletionsController_1.InlineCompletionsController.ID,
                        codeActionController_1.CodeActionController.ID,
                    ])
                ],
                contextMenuId: actions_1.MenuId.SimpleEditorContext
            };
            super(domElement, options, codeEditorWidgetOptions, instantiationService, codeEditorService, commandService, scopedContextKeyService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService);
            this._commentEditorFocused = exports.ctxCommentEditorFocused.bindTo(scopedContextKeyService);
            this._commentEditorEmpty = commentContextKeys_1.CommentContextKeys.commentIsEmpty.bindTo(scopedContextKeyService);
            this._commentEditorEmpty.set(!this.getModel()?.getValueLength());
            this._parentThread = parentThread;
            this._register(this.onDidFocusEditorWidget(_ => this._commentEditorFocused.set(true)));
            this._register(this.onDidChangeModelContent(e => this._commentEditorEmpty.set(!this.getModel()?.getValueLength())));
            this._register(this.onDidBlurEditorWidget(_ => this._commentEditorFocused.reset()));
        }
        getParentThread() {
            return this._parentThread;
        }
        _getActions() {
            return editorExtensions_1.EditorExtensionsRegistry.getEditorActions();
        }
        static getEditorOptions(configurationService) {
            return {
                wordWrap: 'on',
                glyphMargin: false,
                lineNumbers: 'off',
                folding: false,
                selectOnLineNumbers: false,
                scrollbar: {
                    vertical: 'visible',
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: false
                },
                overviewRulerLanes: 2,
                lineDecorationsWidth: 0,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                fixedOverflowWidgets: true,
                acceptSuggestionOnEnter: 'smart',
                minimap: {
                    enabled: false
                },
                dropIntoEditor: { enabled: true },
                autoClosingBrackets: configurationService.getValue('editor.autoClosingBrackets'),
                quickSuggestions: false,
                accessibilitySupport: configurationService.getValue('editor.accessibilitySupport'),
            };
        }
    };
    exports.SimpleCommentEditor = SimpleCommentEditor;
    exports.SimpleCommentEditor = SimpleCommentEditor = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, codeEditorService_1.ICodeEditorService),
        __param(6, commands_1.ICommandService),
        __param(7, themeService_1.IThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, accessibility_1.IAccessibilityService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(11, languageFeatures_1.ILanguageFeaturesService)
    ], SimpleCommentEditor);
    function calculateEditorHeight(parentEditor, editor, currentHeight) {
        const layoutInfo = editor.getLayoutInfo();
        const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
        const contentHeight = (editor._getViewModel()?.getLineCount() * lineHeight) ?? editor.getContentHeight(); // Can't just call getContentHeight() because it returns an incorrect, large, value when the editor is first created.
        if ((contentHeight > layoutInfo.height) ||
            (contentHeight < layoutInfo.height && currentHeight > exports.MIN_EDITOR_HEIGHT)) {
            const linesToAdd = Math.ceil((contentHeight - layoutInfo.height) / lineHeight);
            const proposedHeight = layoutInfo.height + (lineHeight * linesToAdd);
            return (0, numbers_1.clamp)(proposedHeight, exports.MIN_EDITOR_HEIGHT, (0, numbers_1.clamp)(parentEditor.getLayoutInfo().height - 90, exports.MIN_EDITOR_HEIGHT, exports.MAX_EDITOR_HEIGHT));
        }
        return currentHeight;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlQ29tbWVudEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvc2ltcGxlQ29tbWVudEVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0SWhHLHNEQVdDO0lBbEhZLFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BGLFFBQUEsaUJBQWlCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMzQixRQUFBLGlCQUFpQixHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFNbEMsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxtQ0FBZ0I7UUFLeEQsWUFDQyxVQUF1QixFQUN2QixPQUF1QixFQUN2Qix1QkFBMkMsRUFDM0MsWUFBa0MsRUFDWCxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3hDLGNBQStCLEVBQ2pDLFlBQTJCLEVBQ3BCLG1CQUF5QyxFQUN4QyxvQkFBMkMsRUFDbkMsNEJBQTJELEVBQ2hFLHVCQUFpRDtZQUUzRSxNQUFNLHVCQUF1QixHQUE2QjtnQkFDekQsYUFBYSxFQUFvQztvQkFDaEQsRUFBRSxFQUFFLEVBQUUsNkJBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLDZCQUFhLEVBQUUsYUFBYSxnRUFBd0QsRUFBRTtvQkFDcEgsRUFBRSxFQUFFLEVBQUUsbUNBQXFCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxtQ0FBcUIsRUFBRSxhQUFhLGdFQUF3RCxFQUFFO29CQUNwSSxFQUFFLEVBQUUsRUFBRSxxQ0FBaUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLHFDQUFpQixFQUFFLGFBQWEsK0NBQXVDLEVB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