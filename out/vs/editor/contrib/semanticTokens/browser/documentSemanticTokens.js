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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/theme/common/themeService", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/semanticTokensStyling", "vs/editor/common/editorFeatures", "vs/editor/contrib/semanticTokens/common/semanticTokensConfig"], function (require, exports, lifecycle_1, errors, model_1, configuration_1, async_1, cancellation_1, themeService_1, semanticTokensProviderStyling_1, getSemanticTokens_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1, semanticTokensStyling_1, editorFeatures_1, semanticTokensConfig_1) {
    "use strict";
    var ModelSemanticColoring_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentSemanticTokensFeature = void 0;
    let DocumentSemanticTokensFeature = class DocumentSemanticTokensFeature extends lifecycle_1.Disposable {
        constructor(semanticTokensStylingService, modelService, themeService, configurationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._watchers = Object.create(null);
            const register = (model) => {
                this._watchers[model.uri.toString()] = new ModelSemanticColoring(model, semanticTokensStylingService, themeService, languageFeatureDebounceService, languageFeaturesService);
            };
            const deregister = (model, modelSemanticColoring) => {
                modelSemanticColoring.dispose();
                delete this._watchers[model.uri.toString()];
            };
            const handleSettingOrThemeChange = () => {
                for (const model of modelService.getModels()) {
                    const curr = this._watchers[model.uri.toString()];
                    if ((0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, themeService, configurationService)) {
                        if (!curr) {
                            register(model);
                        }
                    }
                    else {
                        if (curr) {
                            deregister(model, curr);
                        }
                    }
                }
            };
            modelService.getModels().forEach(model => {
                if ((0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, themeService, configurationService)) {
                    register(model);
                }
            });
            this._register(modelService.onModelAdded((model) => {
                if ((0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, themeService, configurationService)) {
                    register(model);
                }
            }));
            this._register(modelService.onModelRemoved((model) => {
                const curr = this._watchers[model.uri.toString()];
                if (curr) {
                    deregister(model, curr);
                }
            }));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(semanticTokensConfig_1.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    handleSettingOrThemeChange();
                }
            }));
            this._register(themeService.onDidColorThemeChange(handleSettingOrThemeChange));
        }
        dispose() {
            // Dispose all watchers
            for (const watcher of Object.values(this._watchers)) {
                watcher.dispose();
            }
            super.dispose();
        }
    };
    exports.DocumentSemanticTokensFeature = DocumentSemanticTokensFeature;
    exports.DocumentSemanticTokensFeature = DocumentSemanticTokensFeature = __decorate([
        __param(0, semanticTokensStyling_1.ISemanticTokensStylingService),
        __param(1, model_1.IModelService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], DocumentSemanticTokensFeature);
    let ModelSemanticColoring = class ModelSemanticColoring extends lifecycle_1.Disposable {
        static { ModelSemanticColoring_1 = this; }
        static { this.REQUEST_MIN_DELAY = 300; }
        static { this.REQUEST_MAX_DELAY = 2000; }
        constructor(model, _semanticTokensStylingService, themeService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._semanticTokensStylingService = _semanticTokensStylingService;
            this._isDisposed = false;
            this._model = model;
            this._provider = languageFeaturesService.documentSemanticTokensProvider;
            this._debounceInformation = languageFeatureDebounceService.for(this._provider, 'DocumentSemanticTokens', { min: ModelSemanticColoring_1.REQUEST_MIN_DELAY, max: ModelSemanticColoring_1.REQUEST_MAX_DELAY });
            this._fetchDocumentSemanticTokens = this._register(new async_1.RunOnceScheduler(() => this._fetchDocumentSemanticTokensNow(), ModelSemanticColoring_1.REQUEST_MIN_DELAY));
            this._currentDocumentResponse = null;
            this._currentDocumentRequestCancellationTokenSource = null;
            this._documentProvidersChangeListeners = [];
            this._providersChangedDuringRequest = false;
            this._register(this._model.onDidChangeContent(() => {
                if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            }));
            this._register(this._model.onDidChangeAttached(() => {
                if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            }));
            this._register(this._model.onDidChangeLanguage(() => {
                // clear any outstanding state
                if (this._currentDocumentResponse) {
                    this._currentDocumentResponse.dispose();
                    this._currentDocumentResponse = null;
                }
                if (this._currentDocumentRequestCancellationTokenSource) {
                    this._currentDocumentRequestCancellationTokenSource.cancel();
                    this._currentDocumentRequestCancellationTokenSource = null;
                }
                this._setDocumentSemanticTokens(null, null, null, []);
                this._fetchDocumentSemanticTokens.schedule(0);
            }));
            const bindDocumentChangeListeners = () => {
                (0, lifecycle_1.dispose)(this._documentProvidersChangeListeners);
                this._documentProvidersChangeListeners = [];
                for (const provider of this._provider.all(model)) {
                    if (typeof provider.onDidChange === 'function') {
                        this._documentProvidersChangeListeners.push(provider.onDidChange(() => {
                            if (this._currentDocumentRequestCancellationTokenSource) {
                                // there is already a request running,
                                this._providersChangedDuringRequest = true;
                                return;
                            }
                            this._fetchDocumentSemanticTokens.schedule(0);
                        }));
                    }
                }
            };
            bindDocumentChangeListeners();
            this._register(this._provider.onDidChange(() => {
                bindDocumentChangeListeners();
                this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
            }));
            this._register(themeService.onDidColorThemeChange(_ => {
                // clear out existing tokens
                this._setDocumentSemanticTokens(null, null, null, []);
                this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
            }));
            this._fetchDocumentSemanticTokens.schedule(0);
        }
        dispose() {
            if (this._currentDocumentResponse) {
                this._currentDocumentResponse.dispose();
                this._currentDocumentResponse = null;
            }
            if (this._currentDocumentRequestCancellationTokenSource) {
                this._currentDocumentRequestCancellationTokenSource.cancel();
                this._currentDocumentRequestCancellationTokenSource = null;
            }
            (0, lifecycle_1.dispose)(this._documentProvidersChangeListeners);
            this._documentProvidersChangeListeners = [];
            this._setDocumentSemanticTokens(null, null, null, []);
            this._isDisposed = true;
            super.dispose();
        }
        _fetchDocumentSemanticTokensNow() {
            if (this._currentDocumentRequestCancellationTokenSource) {
                // there is already a request running, let it finish...
                return;
            }
            if (!(0, getSemanticTokens_1.hasDocumentSemanticTokensProvider)(this._provider, this._model)) {
                // there is no provider
                if (this._currentDocumentResponse) {
                    // there are semantic tokens set
                    this._model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            if (!this._model.isAttachedToEditor()) {
                // this document is not visible, there is no need to fetch semantic tokens for it
                return;
            }
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const lastProvider = this._currentDocumentResponse ? this._currentDocumentResponse.provider : null;
            const lastResultId = this._currentDocumentResponse ? this._currentDocumentResponse.resultId || null : null;
            const request = (0, getSemanticTokens_1.getDocumentSemanticTokens)(this._provider, this._model, lastProvider, lastResultId, cancellationTokenSource.token);
            this._currentDocumentRequestCancellationTokenSource = cancellationTokenSource;
            this._providersChangedDuringRequest = false;
            const pendingChanges = [];
            const contentChangeListener = this._model.onDidChangeContent((e) => {
                pendingChanges.push(e);
            });
            const sw = new stopwatch_1.StopWatch(false);
            request.then((res) => {
                this._debounceInformation.update(this._model, sw.elapsed());
                this._currentDocumentRequestCancellationTokenSource = null;
                contentChangeListener.dispose();
                if (!res) {
                    this._setDocumentSemanticTokens(null, null, null, pendingChanges);
                }
                else {
                    const { provider, tokens } = res;
                    const styling = this._semanticTokensStylingService.getStyling(provider);
                    this._setDocumentSemanticTokens(provider, tokens || null, styling, pendingChanges);
                }
            }, (err) => {
                const isExpectedError = err && (errors.isCancellationError(err) || (typeof err.message === 'string' && err.message.indexOf('busy') !== -1));
                if (!isExpectedError) {
                    errors.onUnexpectedError(err);
                }
                // Semantic tokens eats up all errors and considers errors to mean that the result is temporarily not available
                // The API does not have a special error kind to express this...
                this._currentDocumentRequestCancellationTokenSource = null;
                contentChangeListener.dispose();
                if (pendingChanges.length > 0 || this._providersChangedDuringRequest) {
                    // More changes occurred while the request was running
                    if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                        this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                    }
                }
            });
        }
        static _copy(src, srcOffset, dest, destOffset, length) {
            // protect against overflows
            length = Math.min(length, dest.length - destOffset, src.length - srcOffset);
            for (let i = 0; i < length; i++) {
                dest[destOffset + i] = src[srcOffset + i];
            }
        }
        _setDocumentSemanticTokens(provider, tokens, styling, pendingChanges) {
            const currentResponse = this._currentDocumentResponse;
            const rescheduleIfNeeded = () => {
                if ((pendingChanges.length > 0 || this._providersChangedDuringRequest) && !this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            };
            if (this._currentDocumentResponse) {
                this._currentDocumentResponse.dispose();
                this._currentDocumentResponse = null;
            }
            if (this._isDisposed) {
                // disposed!
                if (provider && tokens) {
                    provider.releaseDocumentSemanticTokens(tokens.resultId);
                }
                return;
            }
            if (!provider || !styling) {
                this._model.tokenization.setSemanticTokens(null, false);
                return;
            }
            if (!tokens) {
                this._model.tokenization.setSemanticTokens(null, true);
                rescheduleIfNeeded();
                return;
            }
            if ((0, getSemanticTokens_1.isSemanticTokensEdits)(tokens)) {
                if (!currentResponse) {
                    // not possible!
                    this._model.tokenization.setSemanticTokens(null, true);
                    return;
                }
                if (tokens.edits.length === 0) {
                    // nothing to do!
                    tokens = {
                        resultId: tokens.resultId,
                        data: currentResponse.data
                    };
                }
                else {
                    let deltaLength = 0;
                    for (const edit of tokens.edits) {
                        deltaLength += (edit.data ? edit.data.length : 0) - edit.deleteCount;
                    }
                    const srcData = currentResponse.data;
                    const destData = new Uint32Array(srcData.length + deltaLength);
                    let srcLastStart = srcData.length;
                    let destLastStart = destData.length;
                    for (let i = tokens.edits.length - 1; i >= 0; i--) {
                        const edit = tokens.edits[i];
                        if (edit.start > srcData.length) {
                            styling.warnInvalidEditStart(currentResponse.resultId, tokens.resultId, i, edit.start, srcData.length);
                            // The edits are invalid and there's no way to recover
                            this._model.tokenization.setSemanticTokens(null, true);
                            return;
                        }
                        const copyCount = srcLastStart - (edit.start + edit.deleteCount);
                        if (copyCount > 0) {
                            ModelSemanticColoring_1._copy(srcData, srcLastStart - copyCount, destData, destLastStart - copyCount, copyCount);
                            destLastStart -= copyCount;
                        }
                        if (edit.data) {
                            ModelSemanticColoring_1._copy(edit.data, 0, destData, destLastStart - edit.data.length, edit.data.length);
                            destLastStart -= edit.data.length;
                        }
                        srcLastStart = edit.start;
                    }
                    if (srcLastStart > 0) {
                        ModelSemanticColoring_1._copy(srcData, 0, destData, 0, srcLastStart);
                    }
                    tokens = {
                        resultId: tokens.resultId,
                        data: destData
                    };
                }
            }
            if ((0, getSemanticTokens_1.isSemanticTokens)(tokens)) {
                this._currentDocumentResponse = new SemanticTokensResponse(provider, tokens.resultId, tokens.data);
                const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(tokens, styling, this._model.getLanguageId());
                // Adjust incoming semantic tokens
                if (pendingChanges.length > 0) {
                    // More changes occurred while the request was running
                    // We need to:
                    // 1. Adjust incoming semantic tokens
                    // 2. Request them again
                    for (const change of pendingChanges) {
                        for (const area of result) {
                            for (const singleChange of change.changes) {
                                area.applyEdit(singleChange.range, singleChange.text);
                            }
                        }
                    }
                }
                this._model.tokenization.setSemanticTokens(result, true);
            }
            else {
                this._model.tokenization.setSemanticTokens(null, true);
            }
            rescheduleIfNeeded();
        }
    };
    ModelSemanticColoring = ModelSemanticColoring_1 = __decorate([
        __param(1, semanticTokensStyling_1.ISemanticTokensStylingService),
        __param(2, themeService_1.IThemeService),
        __param(3, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], ModelSemanticColoring);
    class SemanticTokensResponse {
        constructor(provider, resultId, data) {
            this.provider = provider;
            this.resultId = resultId;
            this.data = data;
        }
        dispose() {
            this.provider.releaseDocumentSemanticTokens(this.resultId);
        }
    }
    (0, editorFeatures_1.registerEditorFeature)(DocumentSemanticTokensFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTZW1hbnRpY1Rva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NlbWFudGljVG9rZW5zL2Jyb3dzZXIvZG9jdW1lbnRTZW1hbnRpY1Rva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO1FBSTVELFlBQ2dDLDRCQUEyRCxFQUMzRSxZQUEyQixFQUMzQixZQUEyQixFQUNuQixvQkFBMkMsRUFDakMsOEJBQStELEVBQ3RFLHVCQUFpRDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVyQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtnQkFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsNEJBQTRCLEVBQUUsWUFBWSxFQUFFLDhCQUE4QixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDOUssQ0FBQyxDQUFDO1lBQ0YsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFpQixFQUFFLHFCQUE0QyxFQUFFLEVBQUU7Z0JBQ3RGLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQztZQUNGLE1BQU0sMEJBQTBCLEdBQUcsR0FBRyxFQUFFO2dCQUN2QyxLQUFLLE1BQU0sS0FBSyxJ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