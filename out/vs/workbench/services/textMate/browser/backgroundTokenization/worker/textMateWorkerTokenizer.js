/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/amdX", "vs/base/common/async", "vs/base/common/observable", "vs/base/common/platform", "vs/editor/common/core/lineRange", "vs/editor/common/model/mirrorTextModel", "vs/editor/common/model/textModelTokens", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/editor/common/tokens/lineTokens", "vs/workbench/services/textMate/browser/tokenizationSupport/textMateTokenizationSupport", "vs/workbench/services/textMate/browser/tokenizationSupport/tokenizationSupportWithLineLimit"], function (require, exports, amdX_1, async_1, observable_1, platform_1, lineRange_1, mirrorTextModel_1, textModelTokens_1, contiguousMultilineTokensBuilder_1, lineTokens_1, textMateTokenizationSupport_1, tokenizationSupportWithLineLimit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateWorkerTokenizer = void 0;
    class TextMateWorkerTokenizer extends mirrorTextModel_1.MirrorTextModel {
        constructor(uri, lines, eol, versionId, _host, _languageId, _encodedLanguageId, maxTokenizationLineLength) {
            super(uri, lines, eol, versionId);
            this._host = _host;
            this._languageId = _languageId;
            this._encodedLanguageId = _encodedLanguageId;
            this._tokenizerWithStateStore = null;
            this._isDisposed = false;
            this._maxTokenizationLineLength = (0, observable_1.observableValue)(this, -1);
            this._tokenizeDebouncer = new async_1.RunOnceScheduler(() => this._tokenize(), 10);
            this._maxTokenizationLineLength.set(maxTokenizationLineLength, undefined);
            this._resetTokenization();
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        onLanguageId(languageId, encodedLanguageId) {
            this._languageId = languageId;
            this._encodedLanguageId = encodedLanguageId;
            this._resetTokenization();
        }
        onEvents(e) {
            super.onEvents(e);
            this._tokenizerWithStateStore?.store.acceptChanges(e.changes);
            this._tokenizeDebouncer.schedule();
        }
        acceptMaxTokenizationLineLength(maxTokenizationLineLength) {
            this._maxTokenizationLineLength.set(maxTokenizationLineLength, undefined);
        }
        retokenize(startLineNumber, endLineNumberExclusive) {
            if (this._tokenizerWithStateStore) {
                this._tokenizerWithStateStore.store.invalidateEndStateRange(new lineRange_1.LineRange(startLineNumber, endLineNumberExclusive));
                this._tokenizeDebouncer.schedule();
            }
        }
        async _resetTokenization() {
            this._tokenizerWithStateStore = null;
            const languageId = this._languageId;
            const encodedLanguageId = this._encodedLanguageId;
            const r = await this._host.getOrCreateGrammar(languageId, encodedLanguageId);
            if (this._isDisposed || languageId !== this._languageId || encodedLanguageId !== this._encodedLanguageId || !r) {
                return;
            }
            if (r.grammar) {
                const tokenizationSupport = new tokenizationSupportWithLineLimit_1.TokenizationSupportWithLineLimit(this._encodedLanguageId, new textMateTokenizationSupport_1.TextMateTokenizationSupport(r.grammar, r.initialState, false, undefined, () => false, (timeMs, lineLength, isRandomSample) => {
                    this._host.reportTokenizationTime(timeMs, languageId, r.sourceExtensionId, lineLength, isRandomSample);
                }, false), this._maxTokenizationLineLength);
                this._tokenizerWithStateStore = new textModelTokens_1.TokenizerWithStateStore(this._lines.length, tokenizationSupport);
            }
            else {
                this._tokenizerWithStateStore = null;
            }
            this._tokenize();
        }
        async _tokenize() {
            if (this._isDisposed || !this._tokenizerWithStateStore) {
                return;
            }
            if (!this._diffStateStacksRefEqFn) {
                const { diffStateStacksRefEq } = await (0, amdX_1.importAMDNodeModule)('vscode-textmate', 'release/main.js');
                this._diffStateStacksRefEqFn = diffStateStacksRefEq;
            }
            const startTime = new Date().getTime();
            while (true) {
                let tokenizedLines = 0;
                const tokenBuilder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
                const stateDeltaBuilder = new StateDeltaBuilder();
                while (true) {
                    const lineToTokenize = this._tokenizerWithStateStore.getFirstInvalidLine();
                    if (lineToTokenize === null || tokenizedLines > 200) {
                        break;
                    }
                    tokenizedLines++;
                    const text = this._lines[lineToTokenize.lineNumber - 1];
                    const r = this._tokenizerWithStateStore.tokenizationSupport.tokenizeEncoded(text, true, lineToTokenize.startState);
                    if (this._tokenizerWithStateStore.store.setEndState(lineToTokenize.lineNumber, r.endState)) {
                        const delta = this._diffStateStacksRefEqFn(lineToTokenize.startState, r.endState);
                        stateDeltaBuilder.setState(lineToTokenize.lineNumber, delta);
                    }
                    else {
                        stateDeltaBuilder.setState(lineToTokenize.lineNumber, null);
                    }
                    lineTokens_1.LineTokens.convertToEndOffset(r.tokens, text.length);
                    tokenBuilder.add(lineToTokenize.lineNumber, r.tokens);
                    const deltaMs = new Date().getTime() - startTime;
                    if (deltaMs > 20) {
                        // yield to check for changes
                        break;
                    }
                }
                if (tokenizedLines === 0) {
                    break;
                }
                const stateDeltas = stateDeltaBuilder.getStateDeltas();
                this._host.setTokensAndStates(this._versionId, tokenBuilder.serialize(), stateDeltas);
                const deltaMs = new Date().getTime() - startTime;
                if (deltaMs > 20) {
                    // yield to check for changes
                    (0, platform_1.setTimeout0)(() => this._tokenize());
                    return;
                }
            }
        }
    }
    exports.TextMateWorkerTokenizer = TextMateWorkerTokenizer;
    class StateDeltaBuilder {
        constructor() {
            this._lastStartLineNumber = -1;
            this._stateDeltas = [];
        }
        setState(lineNumber, stackDiff) {
            if (lineNumber === this._lastStartLineNumber + 1) {
                this._stateDeltas[this._stateDeltas.length - 1].stateDeltas.push(stackDiff);
            }
            else {
                this._stateDeltas.push({ startLineNumber: lineNumber, stateDeltas: [stackDiff] });
            }
            this._lastStartLineNumber = lineNumber;
        }
        getStateDeltas() {
            return this._stateDeltas;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVXb3JrZXJUb2tlbml6ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvYnJvd3Nlci9iYWNrZ3JvdW5kVG9rZW5pemF0aW9uL3dvcmtlci90ZXh0TWF0ZVdvcmtlclRva2VuaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5QmhHLE1BQWEsdUJBQXdCLFNBQVEsaUNBQWU7UUFPM0QsWUFDQyxHQUFRLEVBQ1IsS0FBZSxFQUNmLEdBQVcsRUFDWCxTQUFpQixFQUNBLEtBQWlDLEVBQzFDLFdBQW1CLEVBQ25CLGtCQUE4QixFQUN0Qyx5QkFBaUM7WUFFakMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBTGpCLFVBQUssR0FBTCxLQUFLLENBQTRCO1lBQzFDLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBWTtZQWIvQiw2QkFBd0IsR0FBK0MsSUFBSSxDQUFDO1lBQzVFLGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBQ3BCLCtCQUEwQixHQUFHLElBQUEsNEJBQWUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV2RCx1QkFBa0IsR0FBRyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQWF0RixJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFZSxPQUFPO1lBQ3RCLElBQUksQ0FBQyxXQUFXLEdB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