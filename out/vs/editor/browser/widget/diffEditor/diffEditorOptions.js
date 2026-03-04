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
define(["require", "exports", "vs/base/common/observable", "vs/editor/common/config/diffEditor", "vs/editor/common/config/editorOptions", "vs/platform/accessibility/common/accessibility"], function (require, exports, observable_1, diffEditor_1, editorOptions_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorOptions = void 0;
    let DiffEditorOptions = class DiffEditorOptions {
        get editorOptions() { return this._options; }
        constructor(options, _accessibilityService) {
            this._accessibilityService = _accessibilityService;
            this._diffEditorWidth = (0, observable_1.observableValue)(this, 0);
            this._screenReaderMode = (0, observable_1.observableFromEvent)(this._accessibilityService.onDidChangeScreenReaderOptimized, () => this._accessibilityService.isScreenReaderOptimized());
            this.couldShowInlineViewBecauseOfSize = (0, observable_1.derived)(this, reader => this._options.read(reader).renderSideBySide && this._diffEditorWidth.read(reader) <= this._options.read(reader).renderSideBySideInlineBreakpoint);
            this.renderOverviewRuler = (0, observable_1.derived)(this, reader => this._options.read(reader).renderOverviewRuler);
            this.renderSideBySide = (0, observable_1.derived)(this, reader => this._options.read(reader).renderSideBySide
                && !(this._options.read(reader).useInlineViewWhenSpaceIsLimited && this.couldShowInlineViewBecauseOfSize.read(reader) && !this._screenReaderMode.read(reader)));
            this.readOnly = (0, observable_1.derived)(this, reader => this._options.read(reader).readOnly);
            this.shouldRenderOldRevertArrows = (0, observable_1.derived)(this, reader => {
                if (!this._options.read(reader).renderMarginRevertIcon) {
                    return false;
                }
                if (!this.renderSideBySide.read(reader)) {
                    return false;
                }
                if (this.readOnly.read(reader)) {
                    return false;
                }
                if (this.shouldRenderGutterMenu.read(reader)) {
                    return false;
                }
                return true;
            });
            this.shouldRenderGutterMenu = (0, observable_1.derived)(this, reader => this._options.read(reader).renderGutterMenu);
            this.renderIndicators = (0, observable_1.derived)(this, reader => this._options.read(reader).renderIndicators);
            this.enableSplitViewResizing = (0, observable_1.derived)(this, reader => this._options.read(reader).enableSplitViewResizing);
            this.splitViewDefaultRatio = (0, observable_1.derived)(this, reader => this._options.read(reader).splitViewDefaultRatio);
            this.ignoreTrimWhitespace = (0, observable_1.derived)(this, reader => this._options.read(reader).ignoreTrimWhitespace);
            this.maxComputationTimeMs = (0, observable_1.derived)(this, reader => this._options.read(reader).maxComputationTime);
            this.showMoves = (0, observable_1.derived)(this, reader => this._options.read(reader).experimental.showMoves && this.renderSideBySide.read(reader));
            this.isInEmbeddedEditor = (0, observable_1.derived)(this, reader => this._options.read(reader).isInEmbeddedEditor);
            this.diffWordWrap = (0, observable_1.derived)(this, reader => this._options.read(reader).diffWordWrap);
            this.originalEditable = (0, observable_1.derived)(this, reader => this._options.read(reader).originalEditable);
            this.diffCodeLens = (0, observable_1.derived)(this, reader => this._options.read(reader).diffCodeLens);
            this.accessibilityVerbose = (0, observable_1.derived)(this, reader => this._options.read(reader).accessibilityVerbose);
            this.diffAlgorithm = (0, observable_1.derived)(this, reader => this._options.read(reader).diffAlgorithm);
            this.showEmptyDecorations = (0, observable_1.derived)(this, reader => this._options.read(reader).experimental.showEmptyDecorations);
            this.onlyShowAccessibleDiffViewer = (0, observable_1.derived)(this, reader => this._options.read(reader).onlyShowAccessibleDiffViewer);
            this.hideUnchangedRegions = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.enabled);
            this.hideUnchangedRegionsRevealLineCount = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.revealLineCount);
            this.hideUnchangedRegionsContextLineCount = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.contextLineCount);
            this.hideUnchangedRegionsMinimumLineCount = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.minimumLineCount);
            const optionsCopy = { ...options, ...validateDiffEditorOptions(options, diffEditor_1.diffEditorDefaultOptions) };
            this._options = (0, observable_1.observableValue)(this, optionsCopy);
        }
        updateOptions(changedOptions) {
            const newDiffEditorOptions = validateDiffEditorOptions(changedOptions, this._options.get());
            const newOptions = { ...this._options.get(), ...changedOptions, ...newDiffEditorOptions };
            this._options.set(newOptions, undefined, { changedOptions: changedOptions });
        }
        setWidth(width) {
            this._diffEditorWidth.set(width, undefined);
        }
    };
    exports.DiffEditorOptions = DiffEditorOptions;
    exports.DiffEditorOptions = DiffEditorOptions = __decorate([
        __param(1, accessibility_1.IAccessibilityService)
    ], DiffEditorOptions);
    function validateDiffEditorOptions(options, defaults) {
        return {
            enableSplitViewResizing: (0, editorOptions_1.boolean)(options.enableSplitViewResizing, defaults.enableSplitViewResizing),
            splitViewDefaultRatio: (0, editorOptions_1.clampedFloat)(options.splitViewDefaultRatio, 0.5, 0.1, 0.9),
            renderSideBySide: (0, editorOptions_1.boolean)(options.renderSideBySide, defaults.renderSideBySide),
            renderMarginRevertIcon: (0, editorOptions_1.boolean)(options.renderMarginRevertIcon, defaults.renderMarginRevertIcon),
            maxComputationTime: (0, editorOptions_1.clampedInt)(options.maxComputationTime, defaults.maxComputationTime, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            maxFileSize: (0, editorOptions_1.clampedInt)(options.maxFileSize, defaults.maxFileSize, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            ignoreTrimWhitespace: (0, editorOptions_1.boolean)(options.ignoreTrimWhitespace, defaults.ignoreTrimWhitespace),
            renderIndicators: (0, editorOptions_1.boolean)(options.renderIndicators, defaults.renderIndicators),
            originalEditable: (0, editorOptions_1.boolean)(options.originalEditable, defaults.originalEditable),
            diffCodeLens: (0, editorOptions_1.boolean)(options.diffCodeLens, defaults.diffCodeLens),
            renderOverviewRuler: (0, editorOptions_1.boolean)(options.renderOverviewRuler, defaults.renderOverviewRuler),
            diffWordWrap: (0, editorOptions_1.stringSet)(options.diffWordWrap, defaults.diffWordWrap, ['off', 'on', 'inherit']),
            diffAlgorithm: (0, editorOptions_1.stringSet)(options.diffAlgorithm, defaults.diffAlgorithm, ['legacy', 'advanced'], { 'smart': 'legacy', 'experimental': 'advanced' }),
            accessibilityVerbose: (0, editorOptions_1.boolean)(options.accessibilityVerbose, defaults.accessibilityVerbose),
            experimental: {
                showMoves: (0, editorOptions_1.boolean)(options.experimental?.showMoves, defaults.experimental.showMoves),
                showEmptyDecorations: (0, editorOptions_1.boolean)(options.experimental?.showEmptyDecorations, defaults.experimental.showEmptyDecorations),
            },
            hideUnchangedRegions: {
                enabled: (0, editorOptions_1.boolean)(options.hideUnchangedRegions?.enabled ?? options.experimental?.collapseUnchangedRegions, defaults.hideUnchangedRegions.enabled),
                contextLineCount: (0, editorOptions_1.clampedInt)(options.hideUnchangedRegions?.contextLineCount, defaults.hideUnchangedRegions.contextLineCount, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                minimumLineCount: (0, editorOptions_1.clampedInt)(options.hideUnchangedRegions?.minimumLineCount, defaults.hideUnchangedRegions.minimumLineCount, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                revealLineCount: (0, editorOptions_1.clampedInt)(options.hideUnchangedRegions?.revealLineCount, defaults.hideUnchangedRegions.revealLineCount, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            },
            isInEmbeddedEditor: (0, editorOptions_1.boolean)(options.isInEmbeddedEditor, defaults.isInEmbeddedEditor),
            onlyShowAccessibleDiffViewer: (0, editorOptions_1.boolean)(options.onlyShowAccessibleDiffViewer, defaults.onlyShowAccessibleDiffViewer),
            renderSideBySideInlineBreakpoint: (0, editorOptions_1.clampedInt)(options.renderSideBySideInlineBreakpoint, defaults.renderSideBySideInlineBreakpoint, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            useInlineViewWhenSpaceIsLimited: (0, editorOptions_1.boolean)(options.useInlineViewWhenSpaceIsLimited, defaults.useInlineViewWhenSpaceIsLimited),
            renderGutterMenu: (0, editorOptions_1.boolean)(options.renderGutterMenu, defaults.renderGutterMenu),
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvck9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9kaWZmRWRpdG9yT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFHN0IsSUFBVyxhQUFhLEtBQXNFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFNckgsWUFDQyxPQUFxQyxFQUNkLHFCQUE2RDtZQUE1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBTnBFLHFCQUFnQixHQUFHLElBQUEsNEJBQWUsRUFBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFcEQsc0JBQWlCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztZQVVsSyxxQ0FBZ0MsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQ3pFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsZ0NBQWdDLENBQ2hKLENBQUM7WUFFYyx3QkFBbUIsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJ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