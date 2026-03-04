/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/languages"], function (require, exports, nls, color_1, model_1, textModel_1, colorRegistry_1, themeService_1, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentGlyphWidget = exports.overviewRulerCommentingRangeForeground = void 0;
    exports.overviewRulerCommentingRangeForeground = (0, colorRegistry_1.registerColor)('editorGutter.commentRangeForeground', { dark: (0, colorRegistry_1.opaque)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.editorBackground), light: (0, colorRegistry_1.darken)((0, colorRegistry_1.opaque)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.editorBackground), .05), hcDark: color_1.Color.white, hcLight: color_1.Color.black }, nls.localize('editorGutterCommentRangeForeground', 'Editor gutter decoration color for commenting ranges. This color should be opaque.'));
    const overviewRulerCommentForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.commentForeground', { dark: exports.overviewRulerCommentingRangeForeground, light: exports.overviewRulerCommentingRangeForeground, hcDark: exports.overviewRulerCommentingRangeForeground, hcLight: exports.overviewRulerCommentingRangeForeground }, nls.localize('editorOverviewRuler.commentForeground', 'Editor overview ruler decoration color for resolved comments. This color should be opaque.'));
    const overviewRulerCommentUnresolvedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.commentUnresolvedForeground', { dark: overviewRulerCommentForeground, light: overviewRulerCommentForeground, hcDark: overviewRulerCommentForeground, hcLight: overviewRulerCommentForeground }, nls.localize('editorOverviewRuler.commentUnresolvedForeground', 'Editor overview ruler decoration color for unresolved comments. This color should be opaque.'));
    const editorGutterCommentGlyphForeground = (0, colorRegistry_1.registerColor)('editorGutter.commentGlyphForeground', { dark: colorRegistry_1.editorForeground, light: colorRegistry_1.editorForeground, hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('editorGutterCommentGlyphForeground', 'Editor gutter decoration color for commenting glyphs.'));
    (0, colorRegistry_1.registerColor)('editorGutter.commentUnresolvedGlyphForeground', { dark: editorGutterCommentGlyphForeground, light: editorGutterCommentGlyphForeground, hcDark: editorGutterCommentGlyphForeground, hcLight: editorGutterCommentGlyphForeground }, nls.localize('editorGutterCommentUnresolvedGlyphForeground', 'Editor gutter decoration color for commenting glyphs for unresolved comment threads.'));
    class CommentGlyphWidget {
        static { this.description = 'comment-glyph-widget'; }
        constructor(editor, lineNumber) {
            this._commentsOptions = this.createDecorationOptions();
            this._editor = editor;
            this._commentsDecorations = this._editor.createDecorationsCollection();
            this.setLineNumber(lineNumber);
        }
        createDecorationOptions() {
            const unresolved = this._threadState === languages_1.CommentThreadState.Unresolved;
            const decorationOptions = {
                description: CommentGlyphWidget.description,
                isWholeLine: true,
                overviewRuler: {
                    color: (0, themeService_1.themeColorFromId)(unresolved ? overviewRulerCommentUnresolvedForeground : overviewRulerCommentForeground),
                    position: model_1.OverviewRulerLane.Center
                },
                collapseOnReplaceEdit: true,
                linesDecorationsClassName: `comment-range-glyph comment-thread${unresolved ? '-unresolved' : ''}`
            };
            return textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
        }
        setThreadState(state) {
            if (this._threadState !== state) {
                this._threadState = state;
                this._commentsOptions = this.createDecorationOptions();
                this._updateDecorations();
            }
        }
        _updateDecorations() {
            const commentsDecorations = [{
                    range: {
                        startLineNumber: this._lineNumber, startColumn: 1,
                        endLineNumber: this._lineNumber, endColumn: 1
                    },
                    options: this._commentsOptions
                }];
            this._commentsDecorations.set(commentsDecorations);
        }
        setLineNumber(lineNumber) {
            this._lineNumber = lineNumber;
            this._updateDecorations();
        }
        getPosition() {
            const range = (this._commentsDecorations.length > 0 ? this._commentsDecorations.getRange(0) : null);
            return {
                position: {
                    lineNumber: range ? range.endLineNumber : this._lineNumber,
                    column: 1
                },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            this._commentsDecorations.clear();
        }
    }
    exports.CommentGlyphWidget = CommentGlyphWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudEdseXBoV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50R2x5cGhXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWW5GLFFBQUEsc0NBQXNDLEdBQUcsSUFBQSw2QkFBYSxFQUFDLHFDQUFxQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUEsc0JBQU0sRUFBQywrQ0FBK0IsRUFBRSxnQ0FBZ0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLHNCQUFNLEVBQUMsSUFBQSxzQkFBTSxFQUFDLCtDQUErQixFQUFFLGdDQUFnQixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLGFBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGFBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9DQUFvQyxFQUFFLG9GQUFvRixDQUFDLENBQUMsQ0FBQztJQUNwYixNQUFNLDhCQUE4QixHQUFHLElBQUEsNkJBQWEsRUFBQyx1Q0FBdUMsRUFBRSxFQUFFLElBQUksRUFBRSw4Q0FBc0MsRUFBRSxLQUFLLEVBQUUsOENBQXNDLEVBQUUsTUFBTSxFQUFFLDhDQUFzQyxFQUFFLE9BQU8sRUFBRSw4Q0FBc0MsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsNEZBQTRGLENBQUMsQ0FBQyxDQUFDO0lBQ3JiLE1BQU0sd0NBQXdDLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGlEQUFpRCxFQUFFLEVBQUUsSUFBSSxFQUFFLDhCQUE4QixFQUFFLEtBQUssRUFBRSw4QkFBOEIsRUFBRSxNQUFNLEVBQUUsOEJBQThCLEVBQUUsT0FBTyxFQUFFLDhCQUE4QixFQUFFLEVB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