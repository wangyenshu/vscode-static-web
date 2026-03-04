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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/contrib/semanticTokens/common/semanticTokensConfig", "vs/editor/common/services/semanticTokensProviderStyling", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/semanticTokensStyling"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, getSemanticTokens_1, semanticTokensConfig_1, semanticTokensProviderStyling_1, configuration_1, themeService_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1, semanticTokensStyling_1) {
    "use strict";
    var ViewportSemanticTokensContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewportSemanticTokensContribution = void 0;
    let ViewportSemanticTokensContribution = class ViewportSemanticTokensContribution extends lifecycle_1.Disposable {
        static { ViewportSemanticTokensContribution_1 = this; }
        static { this.ID = 'editor.contrib.viewportSemanticTokens'; }
        static get(editor) {
            return editor.getContribution(ViewportSemanticTokensContribution_1.ID);
        }
        constructor(editor, _semanticTokensStylingService, _themeService, _configurationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._semanticTokensStylingService = _semanticTokensStylingService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._editor = editor;
            this._provider = languageFeaturesService.documentRangeSemanticTokensProvider;
            this._debounceInformation = languageFeatureDebounceService.for(this._provider, 'DocumentRangeSemanticTokens', { min: 100, max: 500 });
            this._tokenizeViewport = this._register(new async_1.RunOnceScheduler(() => this._tokenizeViewportNow(), 100));
            this._outstandingRequests = [];
            const scheduleTokenizeViewport = () => {
                if (this._editor.hasModel()) {
                    this._tokenizeViewport.schedule(this._debounceInformation.get(this._editor.getModel()));
                }
            };
            this._register(this._editor.onDidScrollChange(() => {
                scheduleTokenizeViewport();
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._provider.onDidChange(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(semanticTokensConfig_1.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    this._cancelAll();
                    scheduleTokenizeViewport();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            scheduleTokenizeViewport();
        }
        _cancelAll() {
            for (const request of this._outstandingRequests) {
                request.cancel();
            }
            this._outstandingRequests = [];
        }
        _removeOutstandingRequest(req) {
            for (let i = 0, len = this._outstandingRequests.length; i < len; i++) {
                if (this._outstandingRequests[i] === req) {
                    this._outstandingRequests.splice(i, 1);
                    return;
                }
            }
        }
        _tokenizeViewportNow() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (model.tokenization.hasCompleteSemanticTokens()) {
                return;
            }
            if (!(0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, this._themeService, this._configurationService)) {
                if (model.tokenization.hasSomeSemanticTokens()) {
                    model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            if (!(0, getSemanticTokens_1.hasDocumentRangeSemanticTokensProvider)(this._provider, model)) {
                if (model.tokenization.hasSomeSemanticTokens()) {
                    model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            this._outstandingRequests = this._outstandingRequests.concat(visibleRanges.map(range => this._requestRange(model, range)));
        }
        _requestRange(model, range) {
            const requestVersionId = model.getVersionId();
            const request = (0, async_1.createCancelablePromise)(token => Promise.resolve((0, getSemanticTokens_1.getDocumentRangeSemanticTokens)(this._provider, model, range, token)));
            const sw = new stopwatch_1.StopWatch(false);
            request.then((r) => {
                this._debounceInformation.update(model, sw.elapsed());
                if (!r || !r.tokens || model.isDisposed() || model.getVersionId() !== requestVersionId) {
                    return;
                }
                const { provider, tokens: result } = r;
                const styling = this._semanticTokensStylingService.getStyling(provider);
                model.tokenization.setPartialSemanticTokens(range, (0, semanticTokensProviderStyling_1.toMultilineTokens2)(result, styling, model.getLanguageId()));
            }).then(() => this._removeOutstandingRequest(request), () => this._removeOutstandingRequest(request));
            return request;
        }
    };
    exports.ViewportSemanticTokensContribution = ViewportSemanticTokensContribution;
    exports.ViewportSemanticTokensContribution = ViewportSemanticTokensContribution = ViewportSemanticTokensContribution_1 = __decorate([
        __param(1, semanticTokensStyling_1.ISemanticTokensStylingService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], ViewportSemanticTokensContribution);
    (0, editorExtensions_1.registerEditorContribution)(ViewportSemanticTokensContribution.ID, ViewportSemanticTokensContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3BvcnRTZW1hbnRpY1Rva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NlbWFudGljVG9rZW5zL2Jyb3dzZXIvdmlld3BvcnRTZW1hbnRpY1Rva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFtQyxTQUFRLHNCQUFVOztpQkFFMUMsT0FBRSxHQUFHLHVDQUF1QyxBQUExQyxDQUEyQztRQUU3RCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBcUMsb0NBQWtDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUcsQ0FBQztRQVFELFlBQ0MsTUFBbUIsRUFDNkIsNkJBQTRELEVBQzVFLGFBQTRCLEVBQ3BCLHFCQUE0QyxFQUNuRCw4QkFBK0QsRUFDdEUsdUJBQWlEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBTndDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFDNUUsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDcEIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUtwRixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLHVCQUF1QixDQUFDLG1DQUFtQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyw4QkFBOEIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSw2QkFBNkIsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdEksSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFT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