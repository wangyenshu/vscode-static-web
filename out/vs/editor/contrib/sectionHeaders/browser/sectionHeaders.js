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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, languageConfigurationRegistry_1, textModel_1, editorWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SectionHeaderDetector = void 0;
    let SectionHeaderDetector = class SectionHeaderDetector extends lifecycle_1.Disposable {
        static { this.ID = 'editor.sectionHeaderDetector'; }
        constructor(editor, languageConfigurationService, editorWorkerService) {
            super();
            this.editor = editor;
            this.languageConfigurationService = languageConfigurationService;
            this.editorWorkerService = editorWorkerService;
            this.decorations = this.editor.createDecorationsCollection();
            this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
            this.computePromise = null;
            this.currentOccurrences = {};
            this._register(editor.onDidChangeModel((e) => {
                this.currentOccurrences = {};
                this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                this.stop();
                this.computeSectionHeaders.schedule(0);
            }));
            this._register(editor.onDidChangeModelLanguage((e) => {
                this.currentOccurrences = {};
                this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                this.stop();
                this.computeSectionHeaders.schedule(0);
            }));
            this._register(languageConfigurationService.onDidChange((e) => {
                const editorLanguageId = this.editor.getModel()?.getLanguageId();
                if (editorLanguageId && e.affects(editorLanguageId)) {
                    this.currentOccurrences = {};
                    this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                    this.stop();
                    this.computeSectionHeaders.schedule(0);
                }
            }));
            this._register(editor.onDidChangeConfiguration(e => {
                if (this.options && !e.hasChanged(73 /* EditorOption.minimap */)) {
                    return;
                }
                this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                // Remove any links (for the getting disabled case)
                this.updateDecorations([]);
                // Stop any computation (for the getting disabled case)
                this.stop();
                // Start computing (for the getting enabled case)
                this.computeSectionHeaders.schedule(0);
            }));
            this._register(this.editor.onDidChangeModelContent(e => {
                this.computeSectionHeaders.schedule();
            }));
            this._register(editor.onDidChangeModelTokens((e) => {
                if (!this.computeSectionHeaders.isScheduled()) {
                    this.computeSectionHeaders.schedule(1000);
                }
            }));
            this.computeSectionHeaders = this._register(new async_1.RunOnceScheduler(() => {
                this.findSectionHeaders();
            }, 250));
            this.computeSectionHeaders.schedule(0);
        }
        createOptions(minimap) {
            if (!minimap || !this.editor.hasModel()) {
                return undefined;
            }
            const languageId = this.editor.getModel().getLanguageId();
            if (!languageId) {
                return undefined;
            }
            const commentsConfiguration = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            const foldingRules = this.languageConfigurationService.getLanguageConfiguration(languageId).foldingRules;
            if (!commentsConfiguration && !foldingRules?.markers) {
                return undefined;
            }
            return {
                foldingRules,
                findMarkSectionHeaders: minimap.showMarkSectionHeaders,
                findRegionSectionHeaders: minimap.showRegionSectionHeaders,
            };
        }
        findSectionHeaders() {
            if (!this.editor.hasModel()
                || (!this.options?.findMarkSectionHeaders && !this.options?.findRegionSectionHeaders)) {
                return;
            }
            const model = this.editor.getModel();
            if (model.isDisposed() || model.isTooLargeForSyncing()) {
                return;
            }
            const modelVersionId = model.getVersionId();
            this.editorWorkerService.findSectionHeaders(model.uri, this.options)
                .then((sectionHeaders) => {
                if (model.isDisposed() || model.getVersionId() !== modelVersionId) {
                    // model changed in the meantime
                    return;
                }
                this.updateDecorations(sectionHeaders);
            });
        }
        updateDecorations(sectionHeaders) {
            const model = this.editor.getModel();
            if (model) {
                // Remove all section headers that should be in comments and are not in comments
                sectionHeaders = sectionHeaders.filter((sectionHeader) => {
                    if (!sectionHeader.shouldBeInComments) {
                        return true;
                    }
                    const validRange = model.validateRange(sectionHeader.range);
                    const tokens = model.tokenization.getLineTokens(validRange.startLineNumber);
                    const idx = tokens.findTokenIndexAtOffset(validRange.startColumn - 1);
                    const tokenType = tokens.getStandardTokenType(idx);
                    const languageId = tokens.getLanguageId(idx);
                    return (languageId === model.getLanguageId() && tokenType === 1 /* StandardTokenType.Comment */);
                });
            }
            const oldDecorations = Object.values(this.currentOccurrences).map(occurrence => occurrence.decorationId);
            const newDecorations = sectionHeaders.map(sectionHeader => decoration(sectionHeader));
            this.editor.changeDecorations((changeAccessor) => {
                const decorations = changeAccessor.deltaDecorations(oldDecorations, newDecorations);
                this.currentOccurrences = {};
                for (let i = 0, len = decorations.length; i < len; i++) {
                    const occurrence = { sectionHeader: sectionHeaders[i], decorationId: decorations[i] };
                    this.currentOccurrences[occurrence.decorationId] = occurrence;
                }
            });
        }
        stop() {
            this.computeSectionHeaders.cancel();
            if (this.computePromise) {
                this.computePromise.cancel();
                this.computePromise = null;
            }
        }
        dispose() {
            super.dispose();
            this.stop();
            this.decorations.clear();
        }
    };
    exports.SectionHeaderDetector = SectionHeaderDetector;
    exports.SectionHeaderDetector = SectionHeaderDetector = __decorate([
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(2, editorWorker_1.IEditorWorkerService)
    ], SectionHeaderDetector);
    function decoration(sectionHeader) {
        return {
            range: sectionHeader.range,
            options: textModel_1.ModelDecorationOptions.createDynamic({
                description: 'section-header',
                stickiness: 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */,
                collapseOnReplaceEdit: true,
                minimap: {
                    color: undefined,
                    position: 1 /* MinimapPosition.Inline */,
                    sectionHeaderStyle: sectionHeader.hasSeparatorLine ? 2 /* MinimapSectionHeaderStyle.Underlined */ : 1 /* MinimapSectionHeaderStyle.Normal */,
                    sectionHeaderText: sectionHeader.text,
                },
            })
        };
    }
    (0, editorExtensions_1.registerEditorContribution)(SectionHeaderDetector.ID, SectionHeaderDetector, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdGlvbkhlYWRlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zZWN0aW9uSGVhZGVycy9icm93c2VyL3NlY3Rpb25IZWFkZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO2lCQUU3QixPQUFFLEdBQVcsOEJBQThCLEFBQXpDLENBQTBDO1FBUW5FLFlBQ2tCLE1BQW1CLEVBQ0wsNEJBQTRFLEVBQ3JGLG1CQUEwRDtZQUVoRixLQUFLLEVBQUUsQ0FBQztZQUpTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDWSxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQ3BFLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFSekUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFZL0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLCtCQUFzQixDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDM0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztZQUU3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsK0JBQXNCLENBQUMsQ0FBQztnQkFDMUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dC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