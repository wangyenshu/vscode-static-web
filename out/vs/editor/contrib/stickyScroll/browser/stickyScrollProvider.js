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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "vs/base/common/cancellation", "vs/base/common/async", "vs/base/common/arrays", "vs/base/common/event", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/stickyScroll/browser/stickyScrollModelProvider"], function (require, exports, lifecycle_1, languageFeatures_1, cancellation_1, async_1, arrays_1, event_1, languageConfigurationRegistry_1, stickyScrollModelProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyLineCandidateProvider = exports.StickyLineCandidate = void 0;
    class StickyLineCandidate {
        constructor(startLineNumber, endLineNumber, nestingDepth) {
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
            this.nestingDepth = nestingDepth;
        }
    }
    exports.StickyLineCandidate = StickyLineCandidate;
    let StickyLineCandidateProvider = class StickyLineCandidateProvider extends lifecycle_1.Disposable {
        static { this.ID = 'store.contrib.stickyScrollController'; }
        constructor(editor, _languageFeaturesService, _languageConfigurationService) {
            super();
            this._languageFeaturesService = _languageFeaturesService;
            this._languageConfigurationService = _languageConfigurationService;
            this._onDidChangeStickyScroll = this._register(new event_1.Emitter());
            this.onDidChangeStickyScroll = this._onDidChangeStickyScroll.event;
            this._model = null;
            this._cts = null;
            this._stickyModelProvider = null;
            this._editor = editor;
            this._sessionStore = this._register(new lifecycle_1.DisposableStore());
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this.update(), 50));
            this._register(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(115 /* EditorOption.stickyScroll */)) {
                    this.readConfiguration();
                }
            }));
            this.readConfiguration();
        }
        readConfiguration() {
            this._sessionStore.clear();
            const options = this._editor.getOption(115 /* EditorOption.stickyScroll */);
            if (!options.enabled) {
                return;
            }
            this._sessionStore.add(this._editor.onDidChangeModel(() => {
                // We should not show an old model for a different file, it will always be wrong.
                // So we clear the model here immediately and then trigger an update.
                this._model = null;
                this.updateStickyModelProvider();
                this._onDidChangeStickyScroll.fire();
                this.update();
            }));
            this._sessionStore.add(this._editor.onDidChangeHiddenAreas(() => this.update()));
            this._sessionStore.add(this._editor.onDidChangeModelContent(() => this._updateSoon.schedule()));
            this._sessionStore.add(this._languageFeaturesService.documentSymbolProvider.onDidChange(() => this.update()));
            this._sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                this._stickyModelProvider?.dispose();
                this._stickyModelProvider = null;
            }));
            this.updateStickyModelProvider();
            this.update();
        }
        getVersionId() {
            return this._model?.version;
        }
        updateStickyModelProvider() {
            this._stickyModelProvider?.dispose();
            this._stickyModelProvider = null;
            const editor = this._editor;
            if (editor.hasModel()) {
                this._stickyModelProvider = new stickyScrollModelProvider_1.StickyModelProvider(editor, () => this._updateSoon.schedule(), this._languageConfigurationService, this._languageFeaturesService);
            }
        }
        async update() {
            this._cts?.dispose(true);
            this._cts = new cancellation_1.CancellationTokenSource();
            await this.updateStickyModel(this._cts.token);
            this._onDidChangeStickyScroll.fire();
        }
        async updateStickyModel(token) {
            if (!this._editor.hasModel() || !this._stickyModelProvider || this._editor.getModel().isTooLargeForTokenization()) {
                this._model = null;
                return;
            }
            const model = await this._stickyModelProvider.update(token);
            if (token.isCancellationRequested) {
                // the computation was canceled, so do not overwrite the model
                return;
            }
            this._model = model;
        }
        updateIndex(index) {
            if (index === -1) {
                index = 0;
            }
            else if (index < 0) {
                index = -index - 2;
            }
            return index;
        }
        getCandidateStickyLinesIntersectingFromStickyModel(range, outlineModel, result, depth, lastStartLineNumber) {
            if (outlineModel.children.length === 0) {
                return;
            }
            let lastLine = lastStartLineNumber;
            const childrenStartLines = [];
            for (let i = 0; i < outlineModel.children.length; i++) {
                const child = outlineModel.children[i];
                if (child.range) {
                    childrenStartLines.push(child.range.startLineNumber);
                }
            }
            const lowerBound = this.updateIndex((0, arrays_1.binarySearch)(childrenStartLines, range.startLineNumber, (a, b) => { return a - b; }));
            const upperBound = this.updateIndex((0, arrays_1.binarySearch)(childrenStartLines, range.startLineNumber + depth, (a, b) => { return a - b; }));
            for (let i = lowerBound; i <= upperBound; i++) {
                const child = outlineModel.children[i];
                if (!child) {
                    return;
                }
                if (child.range) {
                    const childStartLine = child.range.startLineNumber;
                    const childEndLine = child.range.endLineNumber;
                    if (range.startLineNumber <= childEndLine + 1 && childStartLine - 1 <= range.endLineNumber && childStartLine !== lastLine) {
                        lastLine = childStartLine;
                        result.push(new StickyLineCandidate(childStartLine, childEndLine - 1, depth + 1));
                        this.getCandidateStickyLinesIntersectingFromStickyModel(range, child, result, depth + 1, childStartLine);
                    }
                }
                else {
                    this.getCandidateStickyLinesIntersectingFromStickyModel(range, child, result, depth, lastStartLineNumber);
                }
            }
        }
        getCandidateStickyLinesIntersecting(range) {
            if (!this._model?.element) {
                return [];
            }
            let stickyLineCandidates = [];
            this.getCandidateStickyLinesIntersectingFromStickyModel(range, this._model.element, stickyLineCandidates, 0, -1);
            const hiddenRanges = this._editor._getViewModel()?.getHiddenAreas();
            if (hiddenRanges) {
                for (const hiddenRange of hiddenRanges) {
                    stickyLineCandidates = stickyLineCandidates.filter(stickyLine => !(stickyLine.startLineNumber >= hiddenRange.startLineNumber && stickyLine.endLineNumber <= hiddenRange.endLineNumber + 1));
                }
            }
            return stickyLineCandidates;
        }
    };
    exports.StickyLineCandidateProvider = StickyLineCandidateProvider;
    exports.StickyLineCandidateProvider = StickyLineCandidateProvider = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], StickyLineCandidateProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdGlja3lTY3JvbGwvYnJvd3Nlci9zdGlja3lTY3JvbGxQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEcsTUFBYSxtQkFBbUI7UUFDL0IsWUFDaUIsZUFBdUIsRUFDdkIsYUFBcUIsRUFDckIsWUFBb0I7WUFGcEIsb0JBQWUsR0FBZixlQUFlLENBQVE7WUFDdkIsa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDckIsaUJBQVksR0FBWixZQUFZLENBQVE7UUFDakMsQ0FBQztLQUNMO0lBTkQsa0RBTUM7SUFZTSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO2lCQUUxQyxPQUFFLEdBQUcsc0NBQXNDLEFBQXpDLENBQTBDO1FBYTVELFlBQ0MsTUFBbUIsRUFDTyx3QkFBbUUsRUFDOUQsNkJBQTZFO1lBRTVHLEtBQUssRUFBRSxDQUFDO1lBSG1DLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDN0Msa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQWQ1Riw2QkFBd0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNoRSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBTXRFLFdBQU0sR0FBdUIsSUFBSSxDQUFDO1lBQ2xDLFNBQUksR0FBbUMsSUFBSSxDQUFDO1lBQzVDLHlCQUFvQixHQUFnQyxJQUFJLENBQUM7WUFRaEUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxD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