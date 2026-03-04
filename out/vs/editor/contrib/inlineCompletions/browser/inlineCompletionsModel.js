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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/equals", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/textEdit", "vs/editor/common/core/textLength", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsSource", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, arraysFind_1, equals_1, errors_1, lifecycle_1, observable_1, strings_1, types_1, editOperation_1, position_1, range_1, selection_1, textEdit_1, textLength_1, languages_1, languageConfigurationRegistry_1, ghostText_1, inlineCompletionsSource_1, singleTextEdit_1, utils_1, snippetController2_1, commands_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsModel = exports.VersionIdChangeReason = void 0;
    exports.getSecondaryEdits = getSecondaryEdits;
    var VersionIdChangeReason;
    (function (VersionIdChangeReason) {
        VersionIdChangeReason[VersionIdChangeReason["Undo"] = 0] = "Undo";
        VersionIdChangeReason[VersionIdChangeReason["Redo"] = 1] = "Redo";
        VersionIdChangeReason[VersionIdChangeReason["AcceptWord"] = 2] = "AcceptWord";
        VersionIdChangeReason[VersionIdChangeReason["Other"] = 3] = "Other";
    })(VersionIdChangeReason || (exports.VersionIdChangeReason = VersionIdChangeReason = {}));
    let InlineCompletionsModel = class InlineCompletionsModel extends lifecycle_1.Disposable {
        get isAcceptingPartially() { return this._isAcceptingPartially; }
        constructor(textModel, selectedSuggestItem, textModelVersionId, _positions, _debounceValue, _suggestPreviewEnabled, _suggestPreviewMode, _inlineSuggestMode, _enabled, _instantiationService, _commandService, _languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.selectedSuggestItem = selectedSuggestItem;
            this.textModelVersionId = textModelVersionId;
            this._positions = _positions;
            this._debounceValue = _debounceValue;
            this._suggestPreviewEnabled = _suggestPreviewEnabled;
            this._suggestPreviewMode = _suggestPreviewMode;
            this._inlineSuggestMode = _inlineSuggestMode;
            this._enabled = _enabled;
            this._instantiationService = _instantiationService;
            this._commandService = _commandService;
            this._languageConfigurationService = _languageConfigurationService;
            this._source = this._register(this._instantiationService.createInstance(inlineCompletionsSource_1.InlineCompletionsSource, this.textModel, this.textModelVersionId, this._debounceValue));
            this._isActive = (0, observable_1.observableValue)(this, false);
            this._forceUpdateExplicitlySignal = (0, observable_1.observableSignal)(this);
            // We use a semantic id to keep the same inline completion selected even if the provider reorders the completions.
            this._selectedInlineCompletionId = (0, observable_1.observableValue)(this, undefined);
            this._primaryPosition = (0, observable_1.derived)(this, reader => this._positions.read(reader)[0] ?? new position_1.Position(1, 1));
            this._isAcceptingPartially = false;
            this._preserveCurrentCompletionReasons = new Set([
                VersionIdChangeReason.Redo,
                VersionIdChangeReason.Undo,
                VersionIdChangeReason.AcceptWord,
            ]);
            this._fetchInlineCompletionsPromise = (0, observable_1.derivedHandleChanges)({
                owner: this,
                createEmptyChangeSummary: () => ({
                    preserveCurrentCompletion: false,
                    inlineCompletionTriggerKind: languages_1.InlineCompletionTriggerKind.Automatic
                }),
                handleChange: (ctx, changeSummary) => {
                    /** @description fetch inline completions */
                    if (ctx.didChange(this.textModelVersionId) && this._preserveCurrentCompletionReasons.has(ctx.change)) {
                        changeSummary.preserveCurrentCompletion = true;
                    }
                    else if (ctx.didChange(this._forceUpdateExplicitlySignal)) {
                        changeSummary.inlineCompletionTriggerKind = languages_1.InlineCompletionTriggerKind.Explicit;
                    }
                    return true;
                },
            }, (reader, changeSummary) => {
                this._forceUpdateExplicitlySignal.read(reader);
                const shouldUpdate = (this._enabled.read(reader) && this.selectedSuggestItem.read(reader)) || this._isActive.read(reader);
                if (!shouldUpdate) {
                    this._source.cancelUpdate();
                    return undefined;
                }
                this.textModelVersionId.read(reader); // Refetch on text change
                const suggestWidgetInlineCompletions = this._source.suggestWidgetInlineCompletions.get();
                const suggestItem = this.selectedSuggestItem.read(reader);
                if (suggestWidgetInlineCompletions && !suggestItem) {
                    const inlineCompletions = this._source.inlineCompletions.get();
                    (0, observable_1.transaction)(tx => {
                        /** @description Seed inline completions with (newer) suggest widget inline completions */
                        if (!inlineCompletions || suggestWidgetInlineCompletions.request.versionId > inlineCompletions.request.versionId) {
                            this._source.inlineCompletions.set(suggestWidgetInlineCompletions.clone(), tx);
                        }
                        this._source.clearSuggestWidgetInlineCompletions(tx);
                    });
                }
                const cursorPosition = this._primaryPosition.read(reader);
                const context = {
                    triggerKind: changeSummary.inlineCompletionTriggerKind,
                    selectedSuggestionInfo: suggestItem?.toSelectedSuggestionInfo(),
                };
                const itemToPreserveCandidate = this.selectedInlineCompletion.get();
                const itemToPreserve = changeSummary.preserveCurrentCompletion || itemToPreserveCandidate?.forwardStable
                    ? itemToPreserveCandidate : undefined;
                return this._source.fetch(cursorPosition, context, itemToPreserve);
            });
            this._filteredInlineCompletionItems = (0, observable_1.derivedOpts)({ owner: this, equalsFn: (0, equals_1.itemsEquals)() }, reader => {
                const c = this._source.inlineCompletions.read(reader);
                if (!c) {
                    return [];
                }
                const cursorPosition = this._primaryPosition.read(reader);
                const filteredCompletions = c.inlineCompletions.filter(c => c.isVisible(this.textModel, cursorPosition, reader));
                return filteredCompletions;
            });
            this.selectedInlineCompletionIndex = (0, observable_1.derived)(this, (reader) => {
                const selectedInlineCompletionId = this._selectedInlineCompletionId.read(reader);
                const filteredCompletions = this._filteredInlineCompletionItems.read(reader);
                const idx = this._selectedInlineCompletionId === undefined ? -1
                    : filteredCompletions.findIndex(v => v.semanticId === selectedInlineCompletionId);
                if (idx === -1) {
                    // Reset the selection so that the selection does not jump back when it appears again
                    this._selectedInlineCompletionId.set(undefined, undefined);
                    return 0;
                }
                return idx;
            });
            this.selectedInlineCompletion = (0, observable_1.derived)(this, (reader) => {
                const filteredCompletions = this._filteredInlineCompletionItems.read(reader);
                const idx = this.selectedInlineCompletionIndex.read(reader);
                return filteredCompletions[idx];
            });
            this.activeCommands = (0, observable_1.derivedOpts)({ owner: this, equalsFn: (0, equals_1.itemsEquals)() }, r => this.selectedInlineCompletion.read(r)?.inlineCompletion.source.inlineCompletions.commands ?? []);
            this.lastTriggerKind = this._source.inlineCompletions.map(this, v => v?.request.context.triggerKind);
            this.inlineCompletionsCount = (0, observable_1.derived)(this, reader => {
                if (this.lastTriggerKind.read(reader) === languages_1.InlineCompletionTriggerKind.Explicit) {
                    return this._filteredInlineCompletionItems.read(reader).length;
                }
                else {
                    return undefined;
                }
            });
            this.state = (0, observable_1.derivedOpts)({
                owner: this,
                equalsFn: (a, b) => {
                    if (!a || !b) {
                        return a === b;
                    }
                    return (0, ghostText_1.ghostTextsOrReplacementsEqual)(a.ghostTexts, b.ghostTexts)
                        && a.inlineCompletion === b.inlineCompletion
                        && a.suggestItem === b.suggestItem;
                }
            }, (reader) => {
                const model = this.textModel;
                const suggestItem = this.selectedSuggestItem.read(reader);
                if (suggestItem) {
                    const suggestCompletionEdit = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(suggestItem.toSingleTextEdit(), model);
                    const augmentation = this._computeAugmentation(suggestCompletionEdit, reader);
                    const isSuggestionPreviewEnabled = this._suggestPreviewEnabled.read(reader);
                    if (!isSuggestionPreviewEnabled && !augmentation) {
                        return undefined;
                    }
                    const fullEdit = augmentation?.edit ?? suggestCompletionEdit;
                    const fullEditPreviewLength = augmentation ? augmentation.edit.text.length - suggestCompletionEdit.text.length : 0;
                    const mode = this._suggestPreviewMode.read(reader);
                    const positions = this._positions.read(reader);
                    const edits = [fullEdit, ...getSecondaryEdits(this.textModel, positions, fullEdit)];
                    const ghostTexts = edits
                        .map((edit, idx) => (0, singleTextEdit_1.computeGhostText)(edit, model, mode, positions[idx], fullEditPreviewLength))
                        .filter(types_1.isDefined);
                    const primaryGhostText = ghostTexts[0] ?? new ghostText_1.GhostText(fullEdit.range.endLineNumber, []);
                    return { edits, primaryGhostText, ghostTexts, inlineCompletion: augmentation?.completion, suggestItem };
                }
                else {
                    if (!this._isActive.read(reader)) {
                        return undefined;
                    }
                    const inlineCompletion = this.selectedInlineCompletion.read(reader);
                    if (!inlineCompletion) {
                        return undefined;
                    }
                    const replacement = inlineCompletion.toSingleTextEdit(reader);
                    const mode = this._inlineSuggestMode.read(reader);
                    const positions = this._positions.read(reader);
                    const edits = [replacement, ...getSecondaryEdits(this.textModel, positions, replacement)];
                    const ghostTexts = edits
                        .map((edit, idx) => (0, singleTextEdit_1.computeGhostText)(edit, model, mode, positions[idx], 0))
                        .filter(types_1.isDefined);
                    if (!ghostTexts[0]) {
                        return undefined;
                    }
                    return { edits, primaryGhostText: ghostTexts[0], ghostTexts, inlineCompletion, suggestItem: undefined };
                }
            });
            this.ghostTexts = (0, observable_1.derivedOpts)({
                owner: this,
                equalsFn: ghostText_1.ghostTextsOrReplacementsEqual
            }, reader => {
                const v = this.state.read(reader);
                if (!v) {
                    return undefined;
                }
                return v.ghostTexts;
            });
            this.primaryGhostText = (0, observable_1.derivedOpts)({
                owner: this,
                equalsFn: ghostText_1.ghostTextOrReplacementEquals
            }, reader => {
                const v = this.state.read(reader);
                if (!v) {
                    return undefined;
                }
                return v?.primaryGhostText;
            });
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._fetchInlineCompletionsPromise));
            let lastItem = undefined;
            this._register((0, observable_1.autorun)(reader => {
                /** @description call handleItemDidShow */
                const item = this.state.read(reader);
                const completion = item?.inlineCompletion;
                if (completion?.semanticId !== lastItem?.semanticId) {
                    lastItem = completion;
                    if (completion) {
                        const i = completion.inlineCompletion;
                        const src = i.source;
                        src.provider.handleItemDidShow?.(src.inlineCompletions, i.sourceInlineCompletion, i.insertText);
                    }
                }
            }));
        }
        async trigger(tx) {
            this._isActive.set(true, tx);
            await this._fetchInlineCompletionsPromise.get();
        }
        async triggerExplicitly(tx) {
            (0, observable_1.subtransaction)(tx, tx => {
                this._isActive.set(true, tx);
                this._forceUpdateExplicitlySignal.trigger(tx);
            });
            await this._fetchInlineCompletionsPromise.get();
        }
        stop(tx) {
            (0, observable_1.subtransaction)(tx, tx => {
                this._isActive.set(false, tx);
                this._source.clear(tx);
            });
        }
        _computeAugmentation(suggestCompletion, reader) {
            const model = this.textModel;
            const suggestWidgetInlineCompletions = this._source.suggestWidgetInlineCompletions.read(reader);
            const candidateInlineCompletions = suggestWidgetInlineCompletions
                ? suggestWidgetInlineCompletions.inlineCompletions
                : [this.selectedInlineCompletion.read(reader)].filter(types_1.isDefined);
            const augmentedCompletion = (0, arraysFind_1.mapFindFirst)(candidateInlineCompletions, completion => {
                let r = completion.toSingleTextEdit(reader);
                r = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(r, model, range_1.Range.fromPositions(r.range.getStartPosition(), suggestCompletion.range.getEndPosition()));
                return (0, singleTextEdit_1.singleTextEditAugments)(r, suggestCompletion) ? { completion, edit: r } : undefined;
            });
            return augmentedCompletion;
        }
        async _deltaSelectedInlineCompletionIndex(delta) {
            await this.triggerExplicitly();
            const completions = this._filteredInlineCompletionItems.get() || [];
            if (completions.length > 0) {
                const newIdx = (this.selectedInlineCompletionIndex.get() + delta + completions.length) % completions.length;
                this._selectedInlineCompletionId.set(completions[newIdx].semanticId, undefined);
            }
            else {
                this._selectedInlineCompletionId.set(undefined, undefined);
            }
        }
        async next() {
            await this._deltaSelectedInlineCompletionIndex(1);
        }
        async previous() {
            await this._deltaSelectedInlineCompletionIndex(-1);
        }
        async accept(editor) {
            if (editor.getModel() !== this.textModel) {
                throw new errors_1.BugIndicatingError();
            }
            const state = this.state.get();
            if (!state || state.primaryGhostText.isEmpty() || !state.inlineCompletion) {
                return;
            }
            const completion = state.inlineCompletion.toInlineCompletion(undefined);
            editor.pushUndoStop();
            if (completion.snippetInfo) {
                editor.executeEdits('inlineSuggestion.accept', [
                    editOperation_1.EditOperation.replace(completion.range, ''),
                    ...completion.additionalTextEdits
                ]);
                editor.setPosition(completion.snippetInfo.range.getStartPosition(), 'inlineCompletionAccept');
                snippetController2_1.SnippetController2.get(editor)?.insert(completion.snippetInfo.snippet, { undoStopBefore: false });
            }
            else {
                const edits = state.edits;
                const selections = getEndPositionsAfterApplying(edits).map(p => selection_1.Selection.fromPositions(p));
                editor.executeEdits('inlineSuggestion.accept', [
                    ...edits.map(edit => editOperation_1.EditOperation.replace(edit.range, edit.text)),
                    ...completion.additionalTextEdits
                ]);
                editor.setSelections(selections, 'inlineCompletionAccept');
            }
            if (completion.command) {
                // Make sure the completion list will not be disposed.
                completion.source.addRef();
            }
            // Reset before invoking the command, since the command might cause a follow up trigger.
            (0, observable_1.transaction)(tx => {
                this._source.clear(tx);
                // Potentially, isActive will get set back to true by the typing or accept inline suggest event
                // if automatic inline suggestions are enabled.
                this._isActive.set(false, tx);
            });
            if (completion.command) {
                await this._commandService
                    .executeCommand(completion.command.id, ...(completion.command.arguments || []))
                    .then(undefined, errors_1.onUnexpectedExternalError);
                completion.source.removeRef();
            }
        }
        async acceptNextWord(editor) {
            await this._acceptNext(editor, (pos, text) => {
                const langId = this.textModel.getLanguageIdAtPosition(pos.lineNumber, pos.column);
                const config = this._languageConfigurationService.getLanguageConfiguration(langId);
                const wordRegExp = new RegExp(config.wordDefinition.source, config.wordDefinition.flags.replace('g', ''));
                const m1 = text.match(wordRegExp);
                let acceptUntilIndexExclusive = 0;
                if (m1 && m1.index !== undefined) {
                    if (m1.index === 0) {
                        acceptUntilIndexExclusive = m1[0].length;
                    }
                    else {
                        acceptUntilIndexExclusive = m1.index;
                    }
                }
                else {
                    acceptUntilIndexExclusive = text.length;
                }
                const wsRegExp = /\s+/g;
                const m2 = wsRegExp.exec(text);
                if (m2 && m2.index !== undefined) {
                    if (m2.index + m2[0].length < acceptUntilIndexExclusive) {
                        acceptUntilIndexExclusive = m2.index + m2[0].length;
                    }
                }
                return acceptUntilIndexExclusive;
            }, 0 /* PartialAcceptTriggerKind.Word */);
        }
        async acceptNextLine(editor) {
            await this._acceptNext(editor, (pos, text) => {
                const m = text.match(/\n/);
                if (m && m.index !== undefined) {
                    return m.index + 1;
                }
                return text.length;
            }, 1 /* PartialAcceptTriggerKind.Line */);
        }
        async _acceptNext(editor, getAcceptUntilIndex, kind) {
            if (editor.getModel() !== this.textModel) {
                throw new errors_1.BugIndicatingError();
            }
            const state = this.state.get();
            if (!state || state.primaryGhostText.isEmpty() || !state.inlineCompletion) {
                return;
            }
            const ghostText = state.primaryGhostText;
            const completion = state.inlineCompletion.toInlineCompletion(undefined);
            if (completion.snippetInfo || completion.filterText !== completion.insertText) {
                // not in WYSIWYG mode, partial commit might change completion, thus it is not supported
                await this.accept(editor);
                return;
            }
            const firstPart = ghostText.parts[0];
            const ghostTextPos = new position_1.Position(ghostText.lineNumber, firstPart.column);
            const ghostTextVal = firstPart.text;
            const acceptUntilIndexExclusive = getAcceptUntilIndex(ghostTextPos, ghostTextVal);
            if (acceptUntilIndexExclusive === ghostTextVal.length && ghostText.parts.length === 1) {
                this.accept(editor);
                return;
            }
            const partialGhostTextVal = ghostTextVal.substring(0, acceptUntilIndexExclusive);
            const positions = this._positions.get();
            const cursorPosition = positions[0];
            // Executing the edit might free the completion, so we have to hold a reference on it.
            completion.source.addRef();
            try {
                this._isAcceptingPartially = true;
                try {
                    editor.pushUndoStop();
                    const replaceRange = range_1.Range.fromPositions(cursorPosition, ghostTextPos);
                    const newText = editor.getModel().getValueInRange(replaceRange) + partialGhostTextVal;
                    const primaryEdit = new textEdit_1.SingleTextEdit(replaceRange, newText);
                    const edits = [primaryEdit, ...getSecondaryEdits(this.textModel, positions, primaryEdit)];
                    const selections = getEndPositionsAfterApplying(edits).map(p => selection_1.Selection.fromPositions(p));
                    editor.executeEdits('inlineSuggestion.accept', edits.map(edit => editOperation_1.EditOperation.replace(edit.range, edit.text)));
                    editor.setSelections(selections, 'inlineCompletionPartialAccept');
                }
                finally {
                    this._isAcceptingPartially = false;
                }
                if (completion.source.provider.handlePartialAccept) {
                    const acceptedRange = range_1.Range.fromPositions(completion.range.getStartPosition(), textLength_1.TextLength.ofText(partialGhostTextVal).addToPosition(ghostTextPos));
                    // This assumes that the inline completion and the model use the same EOL style.
                    const text = editor.getModel().getValueInRange(acceptedRange, 1 /* EndOfLinePreference.LF */);
                    completion.source.provider.handlePartialAccept(completion.source.inlineCompletions, completion.sourceInlineCompletion, text.length, {
                        kind,
                    });
                }
            }
            finally {
                completion.source.removeRef();
            }
        }
        handleSuggestAccepted(item) {
            const itemEdit = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(item.toSingleTextEdit(), this.textModel);
            const augmentedCompletion = this._computeAugmentation(itemEdit, undefined);
            if (!augmentedCompletion) {
                return;
            }
            const inlineCompletion = augmentedCompletion.completion.inlineCompletion;
            inlineCompletion.source.provider.handlePartialAccept?.(inlineCompletion.source.inlineCompletions, inlineCompletion.sourceInlineCompletion, itemEdit.text.length, {
                kind: 2 /* PartialAcceptTriggerKind.Suggest */,
            });
        }
    };
    exports.InlineCompletionsModel = InlineCompletionsModel;
    exports.InlineCompletionsModel = InlineCompletionsModel = __decorate([
        __param(9, instantiation_1.IInstantiationService),
        __param(10, commands_1.ICommandService),
        __param(11, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], InlineCompletionsModel);
    function getSecondaryEdits(textModel, positions, primaryEdit) {
        if (positions.length === 1) {
            // No secondary cursor positions
            return [];
        }
        const primaryPosition = positions[0];
        const secondaryPositions = positions.slice(1);
        const primaryEditStartPosition = primaryEdit.range.getStartPosition();
        const primaryEditEndPosition = primaryEdit.range.getEndPosition();
        const replacedTextAfterPrimaryCursor = textModel.getValueInRange(range_1.Range.fromPositions(primaryPosition, primaryEditEndPosition));
        const positionWithinTextEdit = (0, utils_1.subtractPositions)(primaryPosition, primaryEditStartPosition);
        if (positionWithinTextEdit.lineNumber < 1) {
            (0, errors_1.onUnexpectedError)(new errors_1.BugIndicatingError(`positionWithinTextEdit line number should be bigger than 0.
			Invalid subtraction between ${primaryPosition.toString()} and ${primaryEditStartPosition.toString()}`));
            return [];
        }
        const secondaryEditText = substringPos(primaryEdit.text, positionWithinTextEdit);
        return secondaryPositions.map(pos => {
            const posEnd = (0, utils_1.addPositions)((0, utils_1.subtractPositions)(pos, primaryEditStartPosition), primaryEditEndPosition);
            const textAfterSecondaryCursor = textModel.getValueInRange(range_1.Range.fromPositions(pos, posEnd));
            const l = (0, strings_1.commonPrefixLength)(replacedTextAfterPrimaryCursor, textAfterSecondaryCursor);
            const range = range_1.Range.fromPositions(pos, pos.delta(0, l));
            return new textEdit_1.SingleTextEdit(range, secondaryEditText);
        });
    }
    function substringPos(text, pos) {
        let subtext = '';
        const lines = (0, strings_1.splitLinesIncludeSeparators)(text);
        for (let i = pos.lineNumber - 1; i < lines.length; i++) {
            subtext += lines[i].substring(i === pos.lineNumber - 1 ? pos.column - 1 : 0);
        }
        return subtext;
    }
    function getEndPositionsAfterApplying(edits) {
        const sortPerm = arrays_1.Permutation.createSortPermutation(edits, (edit1, edit2) => range_1.Range.compareRangesUsingStarts(edit1.range, edit2.range));
        const edit = new textEdit_1.TextEdit(sortPerm.apply(edits));
        const sortedNewRanges = edit.getNewRanges();
        const newRanges = sortPerm.inverse().apply(sortedNewRanges);
        return newRanges.map(range => range.getEndPosition());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvaW5saW5lQ29tcGxldGlvbnNNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrZWhHLDhDQThCQztJQWxlRCxJQUFZLHFCQUtYO0lBTEQsV0FBWSxxQkFBcUI7UUFDaEMsaUVBQUksQ0FBQTtRQUNKLGlFQUFJLENBQUE7UUFDSiw2RUFBVSxDQUFBO1FBQ1YsbUVBQUssQ0FBQTtJQUNOLENBQUMsRUFMVyxxQkFBcUIscUNBQXJCLHFCQUFxQixRQUtoQztJQUVNLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFVckQsSUFBVyxvQkFBb0IsS0FBSyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFFeEUsWUFDaUIsU0FBcUIsRUFDckIsbUJBQTZELEVBQzdELGtCQUE4RCxFQUM3RCxVQUE0QyxFQUM1QyxjQUEyQyxFQUMzQyxzQkFBNEMsRUFDNUMsbUJBQXVFLEVBQ3ZFLGtCQUFzRSxFQUN0RSxRQUE4QixFQUN4QixxQkFBNkQsRUFDbkUsZUFBaUQsRUFDbkMsNkJBQTZFO1lBRTVHLEtBQUssRUFBRSxDQUFDO1lBYlEsY0FBUyxHQUFULFNBQVMsQ0FBWTtZQUNyQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTBDO1lBQzdELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBNEM7WUFDN0QsZUFBVSxHQUFWLFVBQVUsQ0FBa0M7WUFDNUMsbUJBQWMsR0FBZCxjQUFjLENBQTZCO1lBQzNDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBc0I7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixD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