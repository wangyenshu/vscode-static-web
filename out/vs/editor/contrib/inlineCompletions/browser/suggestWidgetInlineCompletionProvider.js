/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetSession", "vs/editor/contrib/suggest/browser/suggestController", "vs/base/common/observable", "vs/editor/common/core/textEdit", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit"], function (require, exports, event_1, lifecycle_1, position_1, range_1, languages_1, snippetParser_1, snippetSession_1, suggestController_1, observable_1, textEdit_1, arrays_1, arraysFind_1, singleTextEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestItemInfo = exports.SuggestWidgetAdaptor = void 0;
    class SuggestWidgetAdaptor extends lifecycle_1.Disposable {
        get selectedItem() {
            return this._selectedItem;
        }
        constructor(editor, suggestControllerPreselector, checkModelVersion, onWillAccept) {
            super();
            this.editor = editor;
            this.suggestControllerPreselector = suggestControllerPreselector;
            this.checkModelVersion = checkModelVersion;
            this.onWillAccept = onWillAccept;
            this.isSuggestWidgetVisible = false;
            this.isShiftKeyPressed = false;
            this._isActive = false;
            this._currentSuggestItemInfo = undefined;
            this._selectedItem = (0, observable_1.observableValue)(this, undefined);
            // See the command acceptAlternativeSelectedSuggestion that is bound to shift+tab
            this._register(editor.onKeyDown(e => {
                if (e.shiftKey && !this.isShiftKeyPressed) {
                    this.isShiftKeyPressed = true;
                    this.update(this._isActive);
                }
            }));
            this._register(editor.onKeyUp(e => {
                if (e.shiftKey && this.isShiftKeyPressed) {
                    this.isShiftKeyPressed = false;
                    this.update(this._isActive);
                }
            }));
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (suggestController) {
                this._register(suggestController.registerSelector({
                    priority: 100,
                    select: (model, pos, suggestItems) => {
                        (0, observable_1.transaction)(tx => this.checkModelVersion(tx));
                        const textModel = this.editor.getModel();
                        if (!textModel) {
                            // Should not happen
                            return -1;
                        }
                        const i = this.suggestControllerPreselector();
                        const itemToPreselect = i ? (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(i, textModel) : undefined;
                        if (!itemToPreselect) {
                            return -1;
                        }
                        const position = position_1.Position.lift(pos);
                        const candidates = suggestItems
                            .map((suggestItem, index) => {
                            const suggestItemInfo = SuggestItemInfo.fromSuggestion(suggestController, textModel, position, suggestItem, this.isShiftKeyPressed);
                            const suggestItemTextEdit = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(suggestItemInfo.toSingleTextEdit(), textModel);
                            const valid = (0, singleTextEdit_1.singleTextEditAugments)(itemToPreselect, suggestItemTextEdit);
                            return { index, valid, prefixLength: suggestItemTextEdit.text.length, suggestItem };
                        })
                            .filter(item => item && item.valid && item.prefixLength > 0);
                        const result = (0, arraysFind_1.findFirstMax)(candidates, (0, arrays_1.compareBy)(s => s.prefixLength, arrays_1.numberComparator));
                        return result ? result.index : -1;
                    }
                }));
                let isBoundToSuggestWidget = false;
                const bindToSuggestWidget = () => {
                    if (isBoundToSuggestWidget) {
                        return;
                    }
                    isBoundToSuggestWidget = true;
                    this._register(suggestController.widget.value.onDidShow(() => {
                        this.isSuggestWidgetVisible = true;
                        this.update(true);
                    }));
                    this._register(suggestController.widget.value.onDidHide(() => {
                        this.isSuggestWidgetVisible = false;
                        this.update(false);
                    }));
                    this._register(suggestController.widget.value.onDidFocus(() => {
                        this.isSuggestWidgetVisible = true;
                        this.update(true);
                    }));
                };
                this._register(event_1.Event.once(suggestController.model.onDidTrigger)(e => {
                    bindToSuggestWidget();
                }));
                this._register(suggestController.onWillInsertSuggestItem(e => {
                    const position = this.editor.getPosition();
                    const model = this.editor.getModel();
                    if (!position || !model) {
                        return undefined;
                    }
                    const suggestItemInfo = SuggestItemInfo.fromSuggestion(suggestController, model, position, e.item, this.isShiftKeyPressed);
                    this.onWillAccept(suggestItemInfo);
                }));
            }
            this.update(this._isActive);
        }
        update(newActive) {
            const newInlineCompletion = this.getSuggestItemInfo();
            if (this._isActive !== newActive || !suggestItemInfoEquals(this._currentSuggestItemInfo, newInlineCompletion)) {
                this._isActive = newActive;
                this._currentSuggestItemInfo = newInlineCompletion;
                (0, observable_1.transaction)(tx => {
                    /** @description Update state from suggest widget */
                    this.checkModelVersion(tx);
                    this._selectedItem.set(this._isActive ? this._currentSuggestItemInfo : undefined, tx);
                });
            }
        }
        getSuggestItemInfo() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (!suggestController || !this.isSuggestWidgetVisible) {
                return undefined;
            }
            const focusedItem = suggestController.widget.value.getFocusedItem();
            const position = this.editor.getPosition();
            const model = this.editor.getModel();
            if (!focusedItem || !position || !model) {
                return undefined;
            }
            return SuggestItemInfo.fromSuggestion(suggestController, model, position, focusedItem.item, this.isShiftKeyPressed);
        }
        stopForceRenderingAbove() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            suggestController?.stopForceRenderingAbove();
        }
        forceRenderingAbove() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            suggestController?.forceRenderingAbove();
        }
    }
    exports.SuggestWidgetAdaptor = SuggestWidgetAdaptor;
    class SuggestItemInfo {
        static fromSuggestion(suggestController, model, position, item, toggleMode) {
            let { insertText } = item.completion;
            let isSnippetText = false;
            if (item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */) {
                const snippet = new snippetParser_1.SnippetParser().parse(insertText);
                if (snippet.children.length < 100) {
                    // Adjust whitespace is expensive.
                    snippetSession_1.SnippetSession.adjustWhitespace(model, position, true, snippet);
                }
                insertText = snippet.toString();
                isSnippetText = true;
            }
            const info = suggestController.getOverwriteInfo(item, toggleMode);
            return new SuggestItemInfo(range_1.Range.fromPositions(position.delta(0, -info.overwriteBefore), position.delta(0, Math.max(info.overwriteAfter, 0))), insertText, item.completion.kind, isSnippetText);
        }
        constructor(range, insertText, completionItemKind, isSnippetText) {
            this.range = range;
            this.insertText = insertText;
            this.completionItemKind = completionItemKind;
            this.isSnippetText = isSnippetText;
        }
        equals(other) {
            return this.range.equalsRange(other.range)
                && this.insertText === other.insertText
                && this.completionItemKind === other.completionItemKind
                && this.isSnippetText === other.isSnippetText;
        }
        toSelectedSuggestionInfo() {
            return new languages_1.SelectedSuggestionInfo(this.range, this.insertText, this.completionItemKind, this.isSnippetText);
        }
        toSingleTextEdit() {
            return new textEdit_1.SingleTextEdit(this.range, this.insertText);
        }
    }
    exports.SuggestItemInfo = SuggestItemInfo;
    function suggestItemInfoEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return a.equals(b);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldElubGluZUNvbXBsZXRpb25Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvc3VnZ2VzdFdpZGdldElubGluZUNvbXBsZXRpb25Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQWEsb0JBQXFCLFNBQVEsc0JBQVU7UUFRbkQsSUFBVyxZQUFZO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsWUFDa0IsTUFBbUIsRUFDbkIsNEJBQThELEVBQzlELGlCQUE2QyxFQUM3QyxZQUE2QztZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQUxTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUFrQztZQUM5RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQTRCO1lBQzdDLGlCQUFZLEdBQVosWUFBWSxDQUFpQztZQWZ2RCwyQkFBc0IsR0FBWSxLQUFLLENBQUM7WUFDeEMsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQzFCLGNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsNEJBQXVCLEdBQWdDLFNBQVMsQ0FBQztZQUV4RCxrQkFBYSxHQUFHLElBQUEsNEJBQWUsRUFBQyxJQUFJLEVBQUUsU0FBd0MsQ0FBQyxDQUFDO1lBY2hHLGlGQUFpRjtZQUNqRixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25DLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUMzQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFB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