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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/equals", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/range", "vs/editor/common/core/textEdit", "vs/editor/common/core/textLength", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/inlineCompletions/browser/provideInlineCompletions", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit"], function (require, exports, cancellation_1, equals_1, filters_1, lifecycle_1, observable_1, range_1, textEdit_1, textLength_1, languages_1, languageConfigurationRegistry_1, languageFeatures_1, provideInlineCompletions_1, singleTextEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionWithUpdatedRange = exports.UpToDateInlineCompletions = exports.InlineCompletionsSource = void 0;
    let InlineCompletionsSource = class InlineCompletionsSource extends lifecycle_1.Disposable {
        constructor(textModel, versionId, _debounceValue, languageFeaturesService, languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.versionId = versionId;
            this._debounceValue = _debounceValue;
            this.languageFeaturesService = languageFeaturesService;
            this.languageConfigurationService = languageConfigurationService;
            this._updateOperation = this._register(new lifecycle_1.MutableDisposable());
            this.inlineCompletions = (0, observable_1.disposableObservableValue)('inlineCompletions', undefined);
            this.suggestWidgetInlineCompletions = (0, observable_1.disposableObservableValue)('suggestWidgetInlineCompletions', undefined);
            this._register(this.textModel.onDidChangeContent(() => {
                this._updateOperation.clear();
            }));
        }
        fetch(position, context, activeInlineCompletion) {
            const request = new UpdateRequest(position, context, this.textModel.getVersionId());
            const target = context.selectedSuggestionInfo ? this.suggestWidgetInlineCompletions : this.inlineCompletions;
            if (this._updateOperation.value?.request.satisfies(request)) {
                return this._updateOperation.value.promise;
            }
            else if (target.get()?.request.satisfies(request)) {
                return Promise.resolve(true);
            }
            const updateOngoing = !!this._updateOperation.value;
            this._updateOperation.clear();
            const source = new cancellation_1.CancellationTokenSource();
            const promise = (async () => {
                const shouldDebounce = updateOngoing || context.triggerKind === languages_1.InlineCompletionTriggerKind.Automatic;
                if (shouldDebounce) {
                    // This debounces the operation
                    await wait(this._debounceValue.get(this.textModel), source.token);
                }
                if (source.token.isCancellationRequested || this.textModel.getVersionId() !== request.versionId) {
                    return false;
                }
                const startTime = new Date();
                const updatedCompletions = await (0, provideInlineCompletions_1.provideInlineCompletions)(this.languageFeaturesService.inlineCompletionsProvider, position, this.textModel, context, source.token, this.languageConfigurationService);
                if (source.token.isCancellationRequested || this.textModel.getVersionId() !== request.versionId) {
                    return false;
                }
                const endTime = new Date();
                this._debounceValue.update(this.textModel, endTime.getTime() - startTime.getTime());
                const completions = new UpToDateInlineCompletions(updatedCompletions, request, this.textModel, this.versionId);
                if (activeInlineCompletion) {
                    const asInlineCompletion = activeInlineCompletion.toInlineCompletion(undefined);
                    if (activeInlineCompletion.canBeReused(this.textModel, position) && !updatedCompletions.has(asInlineCompletion)) {
                        completions.prepend(activeInlineCompletion.inlineCompletion, asInlineCompletion.range, true);
                    }
                }
                this._updateOperation.clear();
                (0, observable_1.transaction)(tx => {
                    /** @description Update completions with provider result */
                    target.set(completions, tx);
                });
                return true;
            })();
            const updateOperation = new UpdateOperation(request, source, promise);
            this._updateOperation.value = updateOperation;
            return promise;
        }
        clear(tx) {
            this._updateOperation.clear();
            this.inlineCompletions.set(undefined, tx);
            this.suggestWidgetInlineCompletions.set(undefined, tx);
        }
        clearSuggestWidgetInlineCompletions(tx) {
            if (this._updateOperation.value?.request.context.selectedSuggestionInfo) {
                this._updateOperation.clear();
            }
            this.suggestWidgetInlineCompletions.set(undefined, tx);
        }
        cancelUpdate() {
            this._updateOperation.clear();
        }
    };
    exports.InlineCompletionsSource = InlineCompletionsSource;
    exports.InlineCompletionsSource = InlineCompletionsSource = __decorate([
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], InlineCompletionsSource);
    function wait(ms, cancellationToken) {
        return new Promise(resolve => {
            let d = undefined;
            const handle = setTimeout(() => {
                if (d) {
                    d.dispose();
                }
                resolve();
            }, ms);
            if (cancellationToken) {
                d = cancellationToken.onCancellationRequested(() => {
                    clearTimeout(handle);
                    if (d) {
                        d.dispose();
                    }
                    resolve();
                });
            }
        });
    }
    class UpdateRequest {
        constructor(position, context, versionId) {
            this.position = position;
            this.context = context;
            this.versionId = versionId;
        }
        satisfies(other) {
            return this.position.equals(other.position)
                && (0, equals_1.equalsIfDefined)(this.context.selectedSuggestionInfo, other.context.selectedSuggestionInfo, (0, equals_1.itemEquals)())
                && (other.context.triggerKind === languages_1.InlineCompletionTriggerKind.Automatic
                    || this.context.triggerKind === languages_1.InlineCompletionTriggerKind.Explicit)
                && this.versionId === other.versionId;
        }
    }
    class UpdateOperation {
        constructor(request, cancellationTokenSource, promise) {
            this.request = request;
            this.cancellationTokenSource = cancellationTokenSource;
            this.promise = promise;
        }
        dispose() {
            this.cancellationTokenSource.cancel();
        }
    }
    class UpToDateInlineCompletions {
        get inlineCompletions() { return this._inlineCompletions; }
        constructor(inlineCompletionProviderResult, request, _textModel, _versionId) {
            this.inlineCompletionProviderResult = inlineCompletionProviderResult;
            this.request = request;
            this._textModel = _textModel;
            this._versionId = _versionId;
            this._refCount = 1;
            this._prependedInlineCompletionItems = [];
            const ids = _textModel.deltaDecorations([], inlineCompletionProviderResult.completions.map(i => ({
                range: i.range,
                options: {
                    description: 'inline-completion-tracking-range'
                },
            })));
            this._inlineCompletions = inlineCompletionProviderResult.completions.map((i, index) => new InlineCompletionWithUpdatedRange(i, ids[index], this._textModel, this._versionId));
        }
        clone() {
            this._refCount++;
            return this;
        }
        dispose() {
            this._refCount--;
            if (this._refCount === 0) {
                setTimeout(() => {
                    // To fix https://github.com/microsoft/vscode/issues/188348
                    if (!this._textModel.isDisposed()) {
                        // This is just cleanup. It's ok if it happens with a delay.
                        this._textModel.deltaDecorations(this._inlineCompletions.map(i => i.decorationId), []);
                    }
                }, 0);
                this.inlineCompletionProviderResult.dispose();
                for (const i of this._prependedInlineCompletionItems) {
                    i.source.removeRef();
                }
            }
        }
        prepend(inlineCompletion, range, addRefToSource) {
            if (addRefToSource) {
                inlineCompletion.source.addRef();
            }
            const id = this._textModel.deltaDecorations([], [{
                    range,
                    options: {
                        description: 'inline-completion-tracking-range'
                    },
                }])[0];
            this._inlineCompletions.unshift(new InlineCompletionWithUpdatedRange(inlineCompletion, id, this._textModel, this._versionId));
            this._prependedInlineCompletionItems.push(inlineCompletion);
        }
    }
    exports.UpToDateInlineCompletions = UpToDateInlineCompletions;
    class InlineCompletionWithUpdatedRange {
        get forwardStable() {
            return this.inlineCompletion.source.inlineCompletions.enableForwardStability ?? false;
        }
        constructor(inlineCompletion, decorationId, _textModel, _modelVersion) {
            this.inlineCompletion = inlineCompletion;
            this.decorationId = decorationId;
            this._textModel = _textModel;
            this._modelVersion = _modelVersion;
            this.semanticId = JSON.stringify([
                this.inlineCompletion.filterText,
                this.inlineCompletion.insertText,
                this.inlineCompletion.range.getStartPosition().toString()
            ]);
            this._updatedRange = (0, observable_1.derivedOpts)({ owner: this, equalsFn: range_1.Range.equalsRange }, reader => {
                this._modelVersion.read(reader);
                return this._textModel.getDecorationRange(this.decorationId);
            });
        }
        toInlineCompletion(reader) {
            return this.inlineCompletion.withRange(this._updatedRange.read(reader) ?? emptyRange);
        }
        toSingleTextEdit(reader) {
            return new textEdit_1.SingleTextEdit(this._updatedRange.read(reader) ?? emptyRange, this.inlineCompletion.insertText);
        }
        isVisible(model, cursorPosition, reader) {
            const minimizedReplacement = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(this._toFilterTextReplacement(reader), model);
            const updatedRange = this._updatedRange.read(reader);
            if (!updatedRange
                || !this.inlineCompletion.range.getStartPosition().equals(updatedRange.getStartPosition())
                || cursorPosition.lineNumber !== minimizedReplacement.range.startLineNumber) {
                return false;
            }
            // We might consider comparing by .toLowerText, but this requires GhostTextReplacement
            const originalValue = model.getValueInRange(minimizedReplacement.range, 1 /* EndOfLinePreference.LF */);
            const filterText = minimizedReplacement.text;
            const cursorPosIndex = Math.max(0, cursorPosition.column - minimizedReplacement.range.startColumn);
            let filterTextBefore = filterText.substring(0, cursorPosIndex);
            let filterTextAfter = filterText.substring(cursorPosIndex);
            let originalValueBefore = originalValue.substring(0, cursorPosIndex);
            let originalValueAfter = originalValue.substring(cursorPosIndex);
            const originalValueIndent = model.getLineIndentColumn(minimizedReplacement.range.startLineNumber);
            if (minimizedReplacement.range.startColumn <= originalValueIndent) {
                // Remove indentation
                originalValueBefore = originalValueBefore.trimStart();
                if (originalValueBefore.length === 0) {
                    originalValueAfter = originalValueAfter.trimStart();
                }
                filterTextBefore = filterTextBefore.trimStart();
                if (filterTextBefore.length === 0) {
                    filterTextAfter = filterTextAfter.trimStart();
                }
            }
            return filterTextBefore.startsWith(originalValueBefore)
                && !!(0, filters_1.matchesSubString)(originalValueAfter, filterTextAfter);
        }
        canBeReused(model, position) {
            const updatedRange = this._updatedRange.read(undefined);
            const result = !!updatedRange
                && updatedRange.containsPosition(position)
                && this.isVisible(model, position, undefined)
                && textLength_1.TextLength.ofRange(updatedRange).isGreaterThanOrEqualTo(textLength_1.TextLength.ofRange(this.inlineCompletion.range));
            return result;
        }
        _toFilterTextReplacement(reader) {
            return new textEdit_1.SingleTextEdit(this._updatedRange.read(reader) ?? emptyRange, this.inlineCompletion.filterText);
        }
    }
    exports.InlineCompletionWithUpdatedRange = InlineCompletionWithUpdatedRange;
    const emptyRange = new range_1.Range(1, 1, 1, 1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNTb3VyY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL2lubGluZUNvbXBsZXRpb25zU291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQUt0RCxZQUNrQixTQUFxQixFQUNyQixTQUE4QixFQUM5QixjQUEyQyxFQUNsQyx1QkFBa0UsRUFDN0QsNEJBQTRFO1lBRTNHLEtBQUssRUFBRSxDQUFDO1lBTlMsY0FBUyxHQUFULFNBQVMsQ0FBWTtZQUNyQixjQUFTLEdBQVQsU0FBUyxDQUFxQjtZQUM5QixtQkFBYyxHQUFkLGNBQWMsQ0FBNkI7WUFDakIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUM1QyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBVDNGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBbUIsQ0FBQyxDQUFDO1lBQzdFLHNCQUFpQixHQUFHLElBQUEsc0NBQXlCLEVBQXdDLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JILG1DQUE4QixHQUFHLElBQUEsc0NBQXlCLEVBQXdDLGdDQUFnQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBVzlKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVNLEtBQUssQ0FBQyxRQUFr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