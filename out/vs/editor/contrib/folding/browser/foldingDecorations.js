/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables"], function (require, exports, codicons_1, textModel_1, nls_1, colorRegistry_1, iconRegistry_1, themeService_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingDecorationProvider = exports.foldingManualExpandedIcon = exports.foldingManualCollapsedIcon = exports.foldingCollapsedIcon = exports.foldingExpandedIcon = void 0;
    const foldBackground = (0, colorRegistry_1.registerColor)('editor.foldBackground', { light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorSelectionBackground, 0.3), dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorSelectionBackground, 0.3), hcDark: null, hcLight: null }, (0, nls_1.localize)('foldBackgroundBackground', "Background color behind folded ranges. The color must not be opaque so as not to hide underlying decorations."), true);
    (0, colorRegistry_1.registerColor)('editorGutter.foldingControlForeground', { dark: colorRegistry_1.iconForeground, light: colorRegistry_1.iconForeground, hcDark: colorRegistry_1.iconForeground, hcLight: colorRegistry_1.iconForeground }, (0, nls_1.localize)('editorGutter.foldingControlForeground', 'Color of the folding control in the editor gutter.'));
    exports.foldingExpandedIcon = (0, iconRegistry_1.registerIcon)('folding-expanded', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('foldingExpandedIcon', 'Icon for expanded ranges in the editor glyph margin.'));
    exports.foldingCollapsedIcon = (0, iconRegistry_1.registerIcon)('folding-collapsed', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('foldingCollapsedIcon', 'Icon for collapsed ranges in the editor glyph margin.'));
    exports.foldingManualCollapsedIcon = (0, iconRegistry_1.registerIcon)('folding-manual-collapsed', exports.foldingCollapsedIcon, (0, nls_1.localize)('foldingManualCollapedIcon', 'Icon for manually collapsed ranges in the editor glyph margin.'));
    exports.foldingManualExpandedIcon = (0, iconRegistry_1.registerIcon)('folding-manual-expanded', exports.foldingExpandedIcon, (0, nls_1.localize)('foldingManualExpandedIcon', 'Icon for manually expanded ranges in the editor glyph margin.'));
    const foldedBackgroundMinimap = { color: (0, themeService_1.themeColorFromId)(foldBackground), position: 1 /* MinimapPosition.Inline */ };
    const collapsed = (0, nls_1.localize)('linesCollapsed', "Click to expand the range.");
    const expanded = (0, nls_1.localize)('linesExpanded', "Click to collapse the range.");
    class FoldingDecorationProvider {
        static { this.COLLAPSED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-collapsed-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingCollapsedIcon),
        }); }
        static { this.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-collapsed-highlighted-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            className: 'folded-background',
            minimap: foldedBackgroundMinimap,
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingCollapsedIcon)
        }); }
        static { this.MANUALLY_COLLAPSED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-collapsed-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingManualCollapsedIcon)
        }); }
        static { this.MANUALLY_COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-collapsed-highlighted-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            className: 'folded-background',
            minimap: foldedBackgroundMinimap,
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingManualCollapsedIcon)
        }); }
        static { this.NO_CONTROLS_COLLAPSED_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-no-controls-range-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
        }); }
        static { this.NO_CONTROLS_COLLAPSED_HIGHLIGHTED_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-no-controls-range-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            className: 'folded-background',
            minimap: foldedBackgroundMinimap,
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
        }); }
        static { this.EXPANDED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-expanded-visual-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: 'alwaysShowFoldIcons ' + themables_1.ThemeIcon.asClassName(exports.foldingExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.EXPANDED_AUTO_HIDE_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-expanded-auto-hide-visual-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.MANUALLY_EXPANDED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-expanded-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: 'alwaysShowFoldIcons ' + themables_1.ThemeIcon.asClassName(exports.foldingManualExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.MANUALLY_EXPANDED_AUTO_HIDE_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-expanded-auto-hide-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingManualExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.NO_CONTROLS_EXPANDED_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-no-controls-range-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            isWholeLine: true
        }); }
        static { this.HIDDEN_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-hidden-range-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
        }); }
        constructor(editor) {
            this.editor = editor;
            this.showFoldingControls = 'mouseover';
            this.showFoldingHighlights = true;
        }
        getDecorationOption(isCollapsed, isHidden, isManual) {
            if (isHidden) { // is inside another collapsed region
                return FoldingDecorationProvider.HIDDEN_RANGE_DECORATION;
            }
            if (this.showFoldingControls === 'never') {
                if (isCollapsed) {
                    return this.showFoldingHighlights ? FoldingDecorationProvider.NO_CONTROLS_COLLAPSED_HIGHLIGHTED_RANGE_DECORATION : FoldingDecorationProvider.NO_CONTROLS_COLLAPSED_RANGE_DECORATION;
                }
                return FoldingDecorationProvider.NO_CONTROLS_EXPANDED_RANGE_DECORATION;
            }
            if (isCollapsed) {
                return isManual ?
                    (this.showFoldingHighlights ? FoldingDecorationProvider.MANUALLY_COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION : FoldingDecorationProvider.MANUALLY_COLLAPSED_VISUAL_DECORATION)
                    : (this.showFoldingHighlights ? FoldingDecorationProvider.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION : FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION);
            }
            else if (this.showFoldingControls === 'mouseover') {
                return isManual ? FoldingDecorationProvider.MANUALLY_EXPANDED_AUTO_HIDE_VISUAL_DECORATION : FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION;
            }
            else {
                return isManual ? FoldingDecorationProvider.MANUALLY_EXPANDED_VISUAL_DECORATION : FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION;
            }
        }
        changeDecorations(callback) {
            return this.editor.changeDecorations(callback);
        }
        removeDecorations(decorationIds) {
            this.editor.removeDecorations(decorationIds);
        }
    }
    exports.FoldingDecorationProvider = FoldingDecorationProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ0RlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy9icm93c2VyL2ZvbGRpbmdEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBTSxjQUFjLEdBQUcsSUFBQSw2QkFBYSxFQUFDLHVCQUF1QixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQyx5Q0FBeUIsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBQSwyQkFBVyxFQUFDLHlDQUF5QixFQUFFLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLCtHQUErRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDblcsSUFBQSw2QkFBYSxFQUFDLHVDQUF1QyxFQUFFLEVBQUUsSUFBSSxFQUFFLDhCQUFjLEVBQUUsS0FBSyxFQUFFLDhCQUFjLEVBQUUsTUFBTSxFQUFFLDhCQUFjLEVBQUUsT0FBTyxFQUFFLDhCQUFjLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyx1Q0FBdUMsRUFBRSxvREFBb0QsQ0FBQyxDQUFDLENBQUM7SUFFclAsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsa0JBQWtCLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsc0RBQXNELENBQUMsQ0FBQyxDQUFDO0lBQ3JLLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG1CQUFtQixFQUFFLGtCQUFPLENBQUMsWUFBWSxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHVEQUF1RCxD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