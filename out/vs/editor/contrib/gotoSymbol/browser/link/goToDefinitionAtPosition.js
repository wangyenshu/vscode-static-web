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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/contextkey/common/contextkey", "../goToCommands", "../goToSymbol", "vs/editor/common/services/languageFeatures", "vs/editor/common/model/textModel", "vs/css!./goToDefinitionAtPosition"], function (require, exports, async_1, errors_1, htmlContent_1, lifecycle_1, editorState_1, editorExtensions_1, range_1, language_1, resolverService_1, clickLinkGesture_1, peekView_1, nls, contextkey_1, goToCommands_1, goToSymbol_1, languageFeatures_1, textModel_1) {
    "use strict";
    var GotoDefinitionAtPositionEditorContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoDefinitionAtPositionEditorContribution = void 0;
    let GotoDefinitionAtPositionEditorContribution = class GotoDefinitionAtPositionEditorContribution {
        static { GotoDefinitionAtPositionEditorContribution_1 = this; }
        static { this.ID = 'editor.contrib.gotodefinitionatposition'; }
        static { this.MAX_SOURCE_PREVIEW_LINES = 8; }
        constructor(editor, textModelResolverService, languageService, languageFeaturesService) {
            this.textModelResolverService = textModelResolverService;
            this.languageService = languageService;
            this.languageFeaturesService = languageFeaturesService;
            this.toUnhook = new lifecycle_1.DisposableStore();
            this.toUnhookForKeyboard = new lifecycle_1.DisposableStore();
            this.currentWordAtPosition = null;
            this.previousPromise = null;
            this.editor = editor;
            this.linkDecorations = this.editor.createDecorationsCollection();
            const linkGesture = new clickLinkGesture_1.ClickLinkGesture(editor);
            this.toUnhook.add(linkGesture);
            this.toUnhook.add(linkGesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, keyboardEvent]) => {
                this.startFindDefinitionFromMouse(mouseEvent, keyboardEvent ?? undefined);
            }));
            this.toUnhook.add(linkGesture.onExecute((mouseEvent) => {
                if (this.isEnabled(mouseEvent)) {
                    this.gotoDefinition(mouseEvent.target.position, mouseEvent.hasSideBySideModifier)
                        .catch((error) => {
                        (0, errors_1.onUnexpectedError)(error);
                    })
                        .finally(() => {
                        this.removeLinkDecorations();
                    });
                }
            }));
            this.toUnhook.add(linkGesture.onCancel(() => {
                this.removeLinkDecorations();
                this.currentWordAtPosition = null;
            }));
        }
        static get(editor) {
            return editor.getContribution(GotoDefinitionAtPositionEditorContribution_1.ID);
        }
        async startFindDefinitionFromCursor(position) {
            // For issue: https://github.com/microsoft/vscode/issues/46257
            // equivalent to mouse move with meta/ctrl key
            // First find the definition and add decorations
            // to the editor to be shown with the content hover widget
            await this.startFindDefinition(position);
            // Add listeners for editor cursor move and key down events
            // Dismiss the "extended" editor decorations when the user hides
            // the hover widget. There is no event for the widget itself so these
            // serve as a best effort. After removing the link decorations, the hover
            // widget is clean and will only show declarations per next request.
            this.toUnhookForKeyboard.add(this.editor.onDidChangeCursorPosition(() => {
                this.currentWordAtPosition = null;
                this.removeLinkDecorations();
                this.toUnhookForKeyboard.clear();
            }));
            this.toUnhookForKeyboard.add(this.editor.onKeyDown((e) => {
                if (e) {
                    this.currentWordAtPosition = null;
                    this.removeLinkDecorations();
                    this.toUnhookForKeyboard.clear();
                }
            }));
        }
        startFindDefinitionFromMouse(mouseEvent, withKey) {
            // check if we are active and on a content widget
            if (mouseEvent.target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && this.linkDecorations.length > 0) {
                return;
            }
            if (!this.editor.hasModel() || !this.isEnabled(mouseEvent, withKey)) {
                this.currentWordAtPosition = null;
                this.removeLinkDecorations();
                return;
            }
            const position = mouseEvent.target.position;
            this.startFindDefinition(position);
        }
        async startFindDefinition(position) {
            // Dispose listeners for updating decorations when using keyboard to show definition hover
            this.toUnhookForKeyboard.clear();
            // Find word at mouse position
            const word = position ? this.editor.getModel()?.getWordAtPosition(position) : null;
            if (!word) {
                this.currentWordAtPosition = null;
                this.removeLinkDecorations();
                return;
            }
            // Return early if word at position is still the same
            if (this.currentWordAtPosition && this.currentWordAtPosition.startColumn === word.startColumn && this.currentWordAtPosition.endColumn === word.endColumn && this.currentWordAtPosition.word === word.word) {
                return;
            }
            this.currentWordAtPosition = word;
            // Find definition and decorate word if found
            const state = new editorState_1.EditorState(this.editor, 4 /* CodeEditorStateFlag.Position */ | 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */ | 8 /* CodeEditorStateFlag.Scroll */);
            if (this.previousPromise) {
                this.previousPromise.cancel();
                this.previousPromise = null;
            }
            this.previousPromise = (0, async_1.createCancelablePromise)(token => this.findDefinition(position, token));
            let results;
            try {
                results = await this.previousPromise;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                return;
            }
            if (!results || !results.length || !state.validate(this.editor)) {
                this.removeLinkDecorations();
                return;
            }
            const linkRange = results[0].originSelectionRange
                ? range_1.Range.lift(results[0].originSelectionRange)
                : new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            // Multiple results
            if (results.length > 1) {
                let combinedRange = linkRange;
                for (const { originSelectionRange } of results) {
                    if (originSelectionRange) {
                        combinedRange = range_1.Range.plusRange(combinedRange, originSelectionRange);
                    }
                }
                this.addDecoration(combinedRange, new htmlContent_1.MarkdownString().appendText(nls.localize('multipleResults', "Click to show {0} definitions.", results.length)));
            }
            else {
                // Single result
                const result = results[0];
                if (!result.uri) {
                    return;
                }
                this.textModelResolverService.createModelReference(result.uri).then(ref => {
                    if (!ref.object || !ref.object.textEditorModel) {
                        ref.dispose();
                        return;
                    }
                    const { object: { textEditorModel } } = ref;
                    const { startLineNumber } = result.range;
                    if (startLineNumber < 1 || startLineNumber > textEditorModel.getLineCount()) {
                        // invalid range
                        ref.dispose();
                        return;
                    }
                    const previewValue = this.getPreviewValue(textEditorModel, startLineNumber, result);
                    const languageId = this.languageService.guessLanguageIdByFilepathOrFirstLine(textEditorModel.uri);
                    this.addDecoration(linkRange, previewValue ? new htmlContent_1.MarkdownString().appendCodeblock(languageId ? languageId : '', previewValue) : undefined);
                    ref.dispose();
                });
            }
        }
        getPreviewValue(textEditorModel, startLineNumber, result) {
            let rangeToUse = result.range;
            const numberOfLinesInRange = rangeToUse.endLineNumber - rangeToUse.startLineNumber;
            if (numberOfLinesInRange >= GotoDefinitionAtPositionEditorContribution_1.MAX_SOURCE_PREVIEW_LINES) {
                rangeToUse = this.getPreviewRangeBasedOnIndentation(textEditorModel, startLineNumber);
            }
            const previewValue = this.stripIndentationFromPreviewRange(textEditorModel, startLineNumber, rangeToUse);
            return previewValue;
        }
        stripIndentationFromPreviewRange(textEditorModel, startLineNumber, previewRange) {
            const startIndent = textEditorModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            let minIndent = startIndent;
            for (let endLineNumber = startLineNumber + 1; endLineNumber < previewRange.endLineNumber; endLineNumber++) {
                const endIndent = textEditorModel.getLineFirstNonWhitespaceColumn(endLineNumber);
                minIndent = Math.min(minIndent, endIndent);
            }
            const previewValue = textEditorModel.getValueInRange(previewRange).replace(new RegExp(`^\\s{${minIndent - 1}}`, 'gm'), '').trim();
            return previewValue;
        }
        getPreviewRangeBasedOnIndentation(textEditorModel, startLineNumber) {
            const startIndent = textEditorModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            const maxLineNumber = Math.min(textEditorModel.getLineCount(), startLineNumber + GotoDefinitionAtPositionEditorContribution_1.MAX_SOURCE_PREVIEW_LINES);
            let endLineNumber = startLineNumber + 1;
            for (; endLineNumber < maxLineNumber; endLineNumber++) {
                const endIndent = textEditorModel.getLineFirstNonWhitespaceColumn(endLineNumber);
                if (startIndent === endIndent) {
                    break;
                }
            }
            return new range_1.Range(startLineNumber, 1, endLineNumber + 1, 1);
        }
        addDecoration(range, hoverMessage) {
            const newDecorations = {
                range: range,
                options: {
                    description: 'goto-definition-link',
                    inlineClassName: 'goto-definition-link',
                    hoverMessage
                }
            };
            this.linkDecorations.set([newDecorations]);
        }
        removeLinkDecorations() {
            this.linkDecorations.clear();
        }
        isEnabled(mouseEvent, withKey) {
            return this.editor.hasModel()
                && mouseEvent.isLeftClick
                && mouseEvent.isNoneOrSingleMouseDown
                && mouseEvent.target.type === 6 /* MouseTargetType.CONTENT_TEXT */
                && !(mouseEvent.target.detail.injectedText?.options instanceof textModel_1.ModelDecorationInjectedTextOptions)
                && (mouseEvent.hasTriggerModifier || (withKey ? withKey.keyCodeIsTriggerKey : false))
                && this.languageFeaturesService.definitionProvider.has(this.editor.getModel());
        }
        findDefinition(position, token) {
            const model = this.editor.getModel();
            if (!model) {
                return Promise.resolve(null);
            }
            return (0, goToSymbol_1.getDefinitionsAtPosition)(this.languageFeaturesService.definitionProvider, model, position, token);
        }
        gotoDefinition(position, openToSide) {
            this.editor.setPosition(position);
            return this.editor.invokeWithinContext((accessor) => {
                const canPeek = !openToSide && this.editor.getOption(88 /* EditorOption.definitionLinkOpensInPeek */) && !this.isInPeekEditor(accessor);
                const action = new goToCommands_1.DefinitionAction({ openToSide, openInPeek: canPeek, muteMessage: true }, { title: { value: '', original: '' }, id: '', precondition: undefined });
                return action.run(accessor);
            });
        }
        isInPeekEditor(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            return peekView_1.PeekContext.inPeekEditor.getValue(contextKeyService);
        }
        dispose() {
            this.toUnhook.dispose();
            this.toUnhookForKeyboard.dispose();
        }
    };
    exports.GotoDefinitionAtPositionEditorContribution = GotoDefinitionAtPositionEditorContribution;
    exports.GotoDefinitionAtPositionEditorContribution = GotoDefinitionAtPositionEditorContribution = GotoDefinitionAtPositionEditorContribution_1 = __decorate([
        __param(1, resolverService_1.ITextModelService),
        __param(2, language_1.ILanguageService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], GotoDefinitionAtPositionEditorContribution);
    (0, editorExtensions_1.registerEditorContribution)(GotoDefinitionAtPositionEditorContribution.ID, GotoDefinitionAtPositionEditorContribution, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29Ub0RlZmluaXRpb25BdFBvc2l0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZ290b1N5bWJvbC9icm93c2VyL2xpbmsvZ29Ub0RlZmluaXRpb25BdFBvc2l0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErQnpGLElBQU0sMENBQTBDLEdBQWhELE1BQU0sMENBQTBDOztpQkFFL0IsT0FBRSxHQUFHLHlDQUF5QyxBQUE1QyxDQUE2QztpQkFDdEQsNkJBQXdCLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFTN0MsWUFDQyxNQUFtQixFQUNBLHdCQUE0RCxFQUM3RCxlQUFrRCxFQUMxQyx1QkFBa0U7WUFGeEQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFtQjtZQUM1QyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDekIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQVY1RSxhQUFRLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDakMsd0JBQW1CLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFckQsMEJBQXFCLEdBQTJCLElBQUksQ0FBQztZQUNyRCxvQkFBZSxHQUFvRCxJQUFJLENBQUM7WUFRL0UsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFFakUsTUFBTSxXQUFXLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUvQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsRUFBRSxFQUFFO2dCQUMxRixJQUFJLENBQUMsNEJBQTRCLENBQUMsVUFBVSxFQUFFLGFBQWEsSUFBSSxTQUFTLENBQUMsQ0FBQztZQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQStCLEVBQUUsRUFBRTtnQkFDM0UsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFTLEVBQUUsVUFBVSxDQUFDLHFCQUFxQixDQUFDO3lCQUNoRixLQUFLLENBQUMsQ0FBQyxLQUFZLEVBQUUsRUFBRTt3QkFDdkIsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUIsQ0FBQyxDQUFDO3lCQUNELE9BQU8sQ0FBQyxHQUFHLEVBQUU7d0JBQ2IsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQzlCLENBQUMsQ0FBQyxDQUFDO2dCQUNMLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTZDLDRDQUEwQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFILENBQUM7UUFFRCxLQUFLLENBQUMsNkJBQTZCLENBQUMsUUFBa0I7WUFDckQsOERBQThEO1lBQzlELDhDQUE4QztZQUU5QyxnREFBZ0Q7WUFDaEQsMERBQTBEO1lBQzFELE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLDJEQUEyRDtZQUMzRCxnRUFBZ0U7WUFDaEUscUVBQXFFO1lBQ3JFLHlFQUF5RTtZQUN6RSxvRUFBb0U7WUFDcEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRTtnQkFDdkUsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRTtnQkFDeEUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDUCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO29CQUNsQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxVQUErQixFQUFFLE9BQWdDO1lBRXJHLGlEQUFpRDtZQUNqRCxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSwyQ0FBbUMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbEcsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUyxDQUFDO1lBRTdDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU8sS0FBSyxDQUFDLG1CQUFtQixDQUFDLFFBQWtCO1lBRW5ELDBGQUEwRjtZQUMxRixJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFakMsOEJBQThCO1lBQzlCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25GLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO2dCQUNsQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztZQUNSLENBQUM7WUFFRCxxREFBcUQ7WUFDckQsSUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDM00sT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1lBRWxDLDZDQUE2QztZQUM3QyxNQUFNLEtBQUssR0FBRyxJQUFJLHlCQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSx3RUFBd0Qsd0NBQWdDLHFDQUE2QixDQUFDLENBQUM7WUFFbEssSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFFRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUEsK0JBQXVCLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRTlGLElBQUksT0FBOEIsQ0FBQztZQUNuQyxJQUFJLENBQUM7Z0JBQ0osT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUV0QyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztnQkFDekIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7Z0JBQ2hELENBQUMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQztnQkFDN0MsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV6RixtQkFBbUI7WUFDbkIsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUV4QixJQUFJLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQzlCLEtBQUssTUFBTSxFQUFFLG9CQUFvQixFQUFFLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2hELElBQUksb0JBQW9CLEVBQUUsQ0FBQzt3QkFDMUIsYUFBYSxHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLG9CQUFvQixDQUFDLENBQUM7b0JBQ3RFLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsYUFBYSxDQUNqQixhQUFhLEVBQ2IsSUFBSSw0QkFBYyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsZ0NBQWdDLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQ2xILENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsZ0JBQWdCO2dCQUNoQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2pCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFFekUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUNoRCxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2QsT0FBTztvQkFDUixDQUFDO29CQUVELE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxlQUFlLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQztvQkFDNUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBRXpDLElBQUksZUFBZSxHQUFHLENBQUMsSUFBSSxlQUFlLEdBQUcsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7d0JBQzdFLGdCQUFnQjt3QkFDaEIsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNkLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQ3BGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsb0NBQW9DLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNsRyxJQUFJLENBQUMsYUFBYSxDQUNqQixTQUFTLEVBQ1QsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLDRCQUFjLEVBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUMzRyxDQUFDO29CQUNGLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sZUFBZSxDQUFDLGVBQTJCLEVBQUUsZUFBdUIsRUFBRSxNQUFvQjtZQUNqRyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQzlCLE1BQU0sb0JBQW9CLEdBQUcsVUFBVSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO1lBQ25GLElBQUksb0JBQW9CLElBQUksNENBQTBDLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDakcsVUFBVSxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDdkYsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3pHLE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFTyxnQ0FBZ0MsQ0FBQyxlQUEyQixFQUFFLGVBQXVCLEVBQUUsWUFBb0I7WUFDbEgsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLCtCQUErQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3JGLElBQUksU0FBUyxHQUFHLFdBQVcsQ0FBQztZQUU1QixLQUFLLElBQUksYUFBYSxHQUFHLGVBQWUsR0FBRyxDQUFDLEVBQUUsYUFBYSxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLEVBQUUsQ0FBQztnQkFDM0csTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLCtCQUErQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNqRixTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLFFBQVEsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xJLE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFTyxpQ0FBaUMsQ0FBQyxlQUEyQixFQUFFLGVBQXVCO1lBQzdGLE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNyRixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxlQUFlLEdBQUcsNENBQTBDLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUN0SixJQUFJLGFBQWEsR0FBRyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1lBRXhDLE9BQU8sYUFBYSxHQUFHLGFBQWEsRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsK0JBQStCLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRWpGLElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUMvQixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLGFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLGFBQWEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVPLGFBQWEsQ0FBQyxLQUFZLEVBQUUsWUFBd0M7WUFFM0UsTUFBTSxjQUFjLEdBQTBCO2dCQUM3QyxLQUFLLEVBQUUsS0FBSztnQkFDWixPQUFPLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLHNCQUFzQjtvQkFDbkMsZUFBZSxFQUFFLHNCQUFzQjtvQkFDdkMsWUFBWTtpQkFDWjthQUNELENBQUM7WUFFRixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFTyxTQUFTLENBQUMsVUFBK0IsRUFBRSxPQUFnQztZQUNsRixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO21CQUN6QixVQUFVLENBQUMsV0FBVzttQkFDdEIsVUFBVSxDQUFDLHVCQUF1QjttQkFDbEMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLHlDQUFpQzttQkFDdkQsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxPQUFPLFlBQVksOENBQWtDLENBQUM7bUJBQy9GLENBQUMsVUFBVSxDQUFDLGtCQUFrQixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO21CQUNsRixJQUFJLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRU8sY0FBYyxDQUFDLFFBQWtCLEVBQUUsS0FBd0I7WUFDbEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFFRCxPQUFPLElBQUEscUNBQXdCLEVBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUcsQ0FBQztRQUVPLGNBQWMsQ0FBQyxRQUFrQixFQUFFLFVBQW1CO1lBQzdELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUNuRCxNQUFNLE9BQU8sR0FBRyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsaURBQXdDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvSCxNQUFNLE1BQU0sR0FBRyxJQUFJLCtCQUFnQixDQUFDLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDckssT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGNBQWMsQ0FBQyxRQUEwQjtZQUNoRCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMzRCxPQUFPLHNCQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFTSxPQUFPO1lBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsQ0FBQzs7SUE3UlcsZ0dBQTBDO3lEQUExQywwQ0FBMEM7UUFjcEQsV0FBQSxtQ0FBaUIsQ0FBQTtRQUNqQixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsMkNBQXdCLENBQUE7T0FoQmQsMENBQTBDLENBOFJ0RDtJQUVELElBQUEsNkNBQTBCLEVBQUMsMENBQTBDLENBQUMsRUFBRSxFQUFFLDBDQUEwQyxpRUFBeUQsQ0FBQyJ9