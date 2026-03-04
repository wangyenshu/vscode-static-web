/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/amdX", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/eolCounter", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/model/textModelTokens", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/workbench/services/textMate/browser/arrayOperation"], function (require, exports, amdX_1, lifecycle_1, observable_1, eolCounter_1, lineRange_1, range_1, textModelTokens_1, contiguousMultilineTokensBuilder_1, arrayOperation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateWorkerTokenizerController = void 0;
    class TextMateWorkerTokenizerController extends lifecycle_1.Disposable {
        static { this._id = 0; }
        constructor(_model, _worker, _languageIdCodec, _backgroundTokenizationStore, _configurationService, _maxTokenizationLineLength) {
            super();
            this._model = _model;
            this._worker = _worker;
            this._languageIdCodec = _languageIdCodec;
            this._backgroundTokenizationStore = _backgroundTokenizationStore;
            this._configurationService = _configurationService;
            this._maxTokenizationLineLength = _maxTokenizationLineLength;
            this.controllerId = TextMateWorkerTokenizerController._id++;
            this._pendingChanges = [];
            /**
             * These states will eventually equal the worker states.
             * _states[i] stores the state at the end of line number i+1.
             */
            this._states = new textModelTokens_1.TokenizationStateStore();
            this._loggingEnabled = observableConfigValue('editor.experimental.asyncTokenizationLogging', false, this._configurationService);
            this._register((0, observable_1.keepObserved)(this._loggingEnabled));
            this._register(this._model.onDidChangeContent((e) => {
                if (this._shouldLog) {
                    console.log('model change', {
                        fileName: this._model.uri.fsPath.split('\\').pop(),
                        changes: changesToString(e.changes),
                    });
                }
                this._worker.acceptModelChanged(this.controllerId, e);
                this._pendingChanges.push(e);
            }));
            this._register(this._model.onDidChangeLanguage((e) => {
                const languageId = this._model.getLanguageId();
                const encodedLanguageId = this._languageIdCodec.encodeLanguageId(languageId);
                this._worker.acceptModelLanguageChanged(this.controllerId, languageId, encodedLanguageId);
            }));
            const languageId = this._model.getLanguageId();
            const encodedLanguageId = this._languageIdCodec.encodeLanguageId(languageId);
            this._worker.acceptNewModel({
                uri: this._model.uri,
                versionId: this._model.getVersionId(),
                lines: this._model.getLinesContent(),
                EOL: this._model.getEOL(),
                languageId,
                encodedLanguageId,
                maxTokenizationLineLength: this._maxTokenizationLineLength.get(),
                controllerId: this.controllerId,
            });
            this._register((0, observable_1.autorun)(reader => {
                /** @description update maxTokenizationLineLength */
                const maxTokenizationLineLength = this._maxTokenizationLineLength.read(reader);
                this._worker.acceptMaxTokenizationLineLength(this.controllerId, maxTokenizationLineLength);
            }));
        }
        dispose() {
            super.dispose();
            this._worker.acceptRemovedModel(this.controllerId);
        }
        requestTokens(startLineNumber, endLineNumberExclusive) {
            this._worker.retokenize(this.controllerId, startLineNumber, endLineNumberExclusive);
        }
        /**
         * This method is called from the worker through the worker host.
         */
        async setTokensAndStates(controllerId, versionId, rawTokens, stateDeltas) {
            if (this.controllerId !== controllerId) {
                // This event is for an outdated controller (the worker didn't receive the delete/create messages yet), ignore the event.
                return;
            }
            // _states state, change{k}, ..., change{versionId}, state delta base & rawTokens, change{j}, ..., change{m}, current renderer state
            //                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                                ^^^^^^^^^^^^^^^^^^^^^^^^^
            //                | past changes                                                   | future states
            let tokens = contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder.deserialize(new Uint8Array(rawTokens));
            if (this._shouldLog) {
                console.log('received background tokenization result', {
                    fileName: this._model.uri.fsPath.split('\\').pop(),
                    updatedTokenLines: tokens.map((t) => t.getLineRange()).join(' & '),
                    updatedStateLines: stateDeltas.map((s) => new lineRange_1.LineRange(s.startLineNumber, s.startLineNumber + s.stateDeltas.length).toString()).join(' & '),
                });
            }
            if (this._shouldLog) {
                const changes = this._pendingChanges.filter(c => c.versionId <= versionId).map(c => c.changes).map(c => changesToString(c)).join(' then ');
                console.log('Applying changes to local states', changes);
            }
            // Apply past changes to _states
            while (this._pendingChanges.length > 0 &&
                this._pendingChanges[0].versionId <= versionId) {
                const change = this._pendingChanges.shift();
                this._states.acceptChanges(change.changes);
            }
            if (this._pendingChanges.length > 0) {
                if (this._shouldLog) {
                    const changes = this._pendingChanges.map(c => c.changes).map(c => changesToString(c)).join(' then ');
                    console.log('Considering non-processed changes', changes);
                }
                const curToFutureTransformerTokens = arrayOperation_1.MonotonousIndexTransformer.fromMany(this._pendingChanges.map((c) => fullLineArrayEditFromModelContentChange(c.changes)));
                // Filter tokens in lines that got changed in the future to prevent flickering
                // These tokens are recomputed anyway.
                const b = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
                for (const t of tokens) {
                    for (let i = t.startLineNumber; i <= t.endLineNumber; i++) {
                        const result = curToFutureTransformerTokens.transform(i - 1);
                        // If result is undefined, the current line got touched by an edit.
                        // The webworker will send us new tokens for all the new/touched lines after it received the edits.
                        if (result !== undefined) {
                            b.add(i, t.getLineTokens(i));
                        }
                    }
                }
                tokens = b.finalize();
                // Apply future changes to tokens
                for (const change of this._pendingChanges) {
                    for (const innerChanges of change.changes) {
                        for (let j = 0; j < tokens.length; j++) {
                            tokens[j].applyEdit(innerChanges.range, innerChanges.text);
                        }
                    }
                }
            }
            const curToFutureTransformerStates = arrayOperation_1.MonotonousIndexTransformer.fromMany(this._pendingChanges.map((c) => fullLineArrayEditFromModelContentChange(c.changes)));
            if (!this._applyStateStackDiffFn || !this._initialState) {
                const { applyStateStackDiff, INITIAL } = await (0, amdX_1.importAMDNodeModule)('vscode-textmate', 'release/main.js');
                this._applyStateStackDiffFn = applyStateStackDiff;
                this._initialState = INITIAL;
            }
            // Apply state deltas to _states and _backgroundTokenizationStore
            for (const d of stateDeltas) {
                let prevState = d.startLineNumber <= 1 ? this._initialState : this._states.getEndState(d.startLineNumber - 1);
                for (let i = 0; i < d.stateDeltas.length; i++) {
                    const delta = d.stateDeltas[i];
                    let state;
                    if (delta) {
                        state = this._applyStateStackDiffFn(prevState, delta);
                        this._states.setEndState(d.startLineNumber + i, state);
                    }
                    else {
                        state = this._states.getEndState(d.startLineNumber + i);
                    }
                    const offset = curToFutureTransformerStates.transform(d.startLineNumber + i - 1);
                    if (offset !== undefined) {
                        // Only set the state if there is no future change in this line,
                        // as this might make consumers believe that the state/tokens are accurate
                        this._backgroundTokenizationStore.setEndState(offset + 1, state);
                    }
                    if (d.startLineNumber + i >= this._model.getLineCount() - 1) {
                        this._backgroundTokenizationStore.backgroundTokenizationFinished();
                    }
                    prevState = state;
                }
            }
            // First set states, then tokens, so that events fired from set tokens don't read invalid states
            this._backgroundTokenizationStore.setTokens(tokens);
        }
        get _shouldLog() { return this._loggingEnabled.get(); }
    }
    exports.TextMateWorkerTokenizerController = TextMateWorkerTokenizerController;
    function fullLineArrayEditFromModelContentChange(c) {
        return new arrayOperation_1.ArrayEdit(c.map((c) => new arrayOperation_1.SingleArrayEdit(c.range.startLineNumber - 1, 
        // Expand the edit range to include the entire line
        c.range.endLineNumber - c.range.startLineNumber + 1, (0, eolCounter_1.countEOL)(c.text)[0] + 1)));
    }
    function changesToString(changes) {
        return changes.map(c => range_1.Range.lift(c.range).toString() + ' => ' + c.text).join(' & ');
    }
    function observableConfigValue(key, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key)) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key) ?? defaultValue);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVXb3JrZXJUb2tlbml6ZXJDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRNYXRlL2Jyb3dzZXIvYmFja2dyb3VuZFRva2VuaXphdGlvbi90ZXh0TWF0ZVdvcmtlclRva2VuaXplckNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLGlDQUFrQyxTQUFRLHNCQUFVO2lCQUNqRCxRQUFHLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFnQnZCLFlBQ2tCLE1BQWtCLEVBQ2xCLE9BQW1DLEVBQ25DLGdCQUFrQyxFQUNsQyw0QkFBMEQsRUFDMUQscUJBQTRDLEVBQzVDLDBCQUErQztZQUVoRSxLQUFLLEVBQUUsQ0FBQztZQVBTLFdBQU0sR0FBTixNQUFNLENBQVk7WUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBNEI7WUFDbkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQThCO1lBQzFELDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFxQjtZQXBCakQsaUJBQVksR0FBRyxpQ0FBaUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0RCxvQkFBZSxHQUFnQyxFQUFFLENBQUM7WUFFbkU7OztlQUdHO1lBQ2MsWUFBTyxHQUFHLElBQUksd0NBQXNCLEVBQWMsQ0FBQztZQUVuRCxvQkFBZSxHQUFHLHFCQUFxQixDQUFDLDhDQUE4QyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQWUzSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQVksRUFBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENB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