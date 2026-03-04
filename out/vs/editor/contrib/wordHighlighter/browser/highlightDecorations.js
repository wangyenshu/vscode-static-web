/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./highlightDecorations"], function (require, exports, model_1, textModel_1, languages_1, nls, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getHighlightDecorationOptions = getHighlightDecorationOptions;
    exports.getSelectionHighlightDecorationOptions = getSelectionHighlightDecorationOptions;
    const wordHighlightBackground = (0, colorRegistry_1.registerColor)('editor.wordHighlightBackground', { dark: '#575757B8', light: '#57575740', hcDark: null, hcLight: null }, nls.localize('wordHighlight', 'Background color of a symbol during read-access, like reading a variable. The color must not be opaque so as not to hide underlying decorations.'), true);
    (0, colorRegistry_1.registerColor)('editor.wordHighlightStrongBackground', { dark: '#004972B8', light: '#0e639c40', hcDark: null, hcLight: null }, nls.localize('wordHighlightStrong', 'Background color of a symbol during write-access, like writing to a variable. The color must not be opaque so as not to hide underlying decorations.'), true);
    (0, colorRegistry_1.registerColor)('editor.wordHighlightTextBackground', { light: wordHighlightBackground, dark: wordHighlightBackground, hcDark: wordHighlightBackground, hcLight: wordHighlightBackground }, nls.localize('wordHighlightText', 'Background color of a textual occurrence for a symbol. The color must not be opaque so as not to hide underlying decorations.'), true);
    const wordHighlightBorder = (0, colorRegistry_1.registerColor)('editor.wordHighlightBorder', { light: null, dark: null, hcDark: colorRegistry_1.activeContrastBorder, hcLight: colorRegistry_1.activeContrastBorder }, nls.localize('wordHighlightBorder', 'Border color of a symbol during read-access, like reading a variable.'));
    (0, colorRegistry_1.registerColor)('editor.wordHighlightStrongBorder', { light: null, dark: null, hcDark: colorRegistry_1.activeContrastBorder, hcLight: colorRegistry_1.activeContrastBorder }, nls.localize('wordHighlightStrongBorder', 'Border color of a symbol during write-access, like writing to a variable.'));
    (0, colorRegistry_1.registerColor)('editor.wordHighlightTextBorder', { light: wordHighlightBorder, dark: wordHighlightBorder, hcDark: wordHighlightBorder, hcLight: wordHighlightBorder }, nls.localize('wordHighlightTextBorder', "Border color of a textual occurrence for a symbol."));
    const overviewRulerWordHighlightForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.wordHighlightForeground', { dark: '#A0A0A0CC', light: '#A0A0A0CC', hcDark: '#A0A0A0CC', hcLight: '#A0A0A0CC' }, nls.localize('overviewRulerWordHighlightForeground', 'Overview ruler marker color for symbol highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    const overviewRulerWordHighlightStrongForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.wordHighlightStrongForeground', { dark: '#C0A0C0CC', light: '#C0A0C0CC', hcDark: '#C0A0C0CC', hcLight: '#C0A0C0CC' }, nls.localize('overviewRulerWordHighlightStrongForeground', 'Overview ruler marker color for write-access symbol highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    const overviewRulerWordHighlightTextForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.wordHighlightTextForeground', { dark: colorRegistry_1.overviewRulerSelectionHighlightForeground, light: colorRegistry_1.overviewRulerSelectionHighlightForeground, hcDark: colorRegistry_1.overviewRulerSelectionHighlightForeground, hcLight: colorRegistry_1.overviewRulerSelectionHighlightForeground }, nls.localize('overviewRulerWordHighlightTextForeground', 'Overview ruler marker color of a textual occurrence for a symbol. The color must not be opaque so as not to hide underlying decorations.'), true);
    const _WRITE_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'word-highlight-strong',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'wordHighlightStrong',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(overviewRulerWordHighlightStrongForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    const _TEXT_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'word-highlight-text',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'wordHighlightText',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(overviewRulerWordHighlightTextForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    const _SELECTION_HIGHLIGHT_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'selection-highlight-overview',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'selectionHighlight',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerSelectionHighlightForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    const _SELECTION_HIGHLIGHT_OPTIONS_NO_OVERVIEW = textModel_1.ModelDecorationOptions.register({
        description: 'selection-highlight',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'selectionHighlight',
    });
    const _REGULAR_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'word-highlight',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'wordHighlight',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(overviewRulerWordHighlightForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    function getHighlightDecorationOptions(kind) {
        if (kind === languages_1.DocumentHighlightKind.Write) {
            return _WRITE_OPTIONS;
        }
        else if (kind === languages_1.DocumentHighlightKind.Text) {
            return _TEXT_OPTIONS;
        }
        else {
            return _REGULAR_OPTIONS;
        }
    }
    function getSelectionHighlightDecorationOptions(hasSemanticHighlights) {
        // Show in overviewRuler only if model has no semantic highlighting
        return (hasSemanticHighlights ? _SELECTION_HIGHLIGHT_OPTIONS_NO_OVERVIEW : _SELECTION_HIGHLIGHT_OPTIONS);
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const selectionHighlight = theme.getColor(colorRegistry_1.editorSelectionHighlight);
        if (selectionHighlight) {
            collector.addRule(`.monaco-editor .selectionHighlight { background-color: ${selectionHighlight.transparent(0.5)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGxpZ2h0RGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi93b3JkSGlnaGxpZ2h0ZXIvYnJvd3Nlci9oaWdobGlnaHREZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtGaEcsc0VBUUM7SUFFRCx3RkFHQztJQXJGRCxNQUFNLHVCQUF1QixHQUFHLElBQUEsNkJBQWEsRUFBQyxnQ0FBZ0MsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxrSkFBa0osQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pWLElBQUEsNkJBQWEsRUFBQyxzQ0FBc0MsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLHNKQUFzSixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDalUsSUFBQSw2QkFBYSxFQUFDLG9DQUFvQyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxNQUFNLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSwrSEFBK0gsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BXLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSw2QkFBYSxFQUFDLDRCQUE0QixF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