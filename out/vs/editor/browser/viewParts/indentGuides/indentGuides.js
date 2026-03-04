/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/core/position", "vs/base/common/arrays", "vs/base/common/types", "vs/editor/common/model/guidesTextModelPart", "vs/editor/common/textModelGuides", "vs/css!./indentGuides"], function (require, exports, dynamicViewOverlay_1, editorColorRegistry_1, themeService_1, position_1, arrays_1, types_1, guidesTextModelPart_1, textModelGuides_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentGuidesOverlay = void 0;
    class IndentGuidesOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            this._primaryPosition = null;
            const options = this._context.configuration.options;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._spaceWidth = fontInfo.spaceWidth;
            this._maxIndentLeft = wrappingInfo.wrappingColumn === -1 ? -1 : (wrappingInfo.wrappingColumn * fontInfo.typicalHalfwidthCharacterWidth);
            this._bracketPairGuideOptions = options.get(16 /* EditorOption.guides */);
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._spaceWidth = fontInfo.spaceWidth;
            this._maxIndentLeft = wrappingInfo.wrappingColumn === -1 ? -1 : (wrappingInfo.wrappingColumn * fontInfo.typicalHalfwidthCharacterWidth);
            this._bracketPairGuideOptions = options.get(16 /* EditorOption.guides */);
            return true;
        }
        onCursorStateChanged(e) {
            const selection = e.selections[0];
            const newPosition = selection.getPosition();
            if (!this._primaryPosition?.equals(newPosition)) {
                this._primaryPosition = newPosition;
                return true;
            }
            return false;
        }
        onDecorationsChanged(e) {
            // true for inline decorations
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged; // || e.scrollWidthChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        onLanguageConfigurationChanged(e) {
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            if (!this._bracketPairGuideOptions.indentation && this._bracketPairGuideOptions.bracketPairs === false) {
                this._renderResult = null;
                return;
            }
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const scrollWidth = ctx.scrollWidth;
            const activeCursorPosition = this._primaryPosition;
            const indents = this.getGuidesByLine(visibleStartLineNumber, Math.min(visibleEndLineNumber + 1, this._context.viewModel.getLineCount()), activeCursorPosition);
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                const indent = indents[lineIndex];
                let result = '';
                const leftOffset = ctx.visibleRangeForPosition(new position_1.Position(lineNumber, 1))?.left ?? 0;
                for (const guide of indent) {
                    const left = guide.column === -1
                        ? leftOffset + (guide.visibleColumn - 1) * this._spaceWidth
                        : ctx.visibleRangeForPosition(new position_1.Position(lineNumber, guide.column)).left;
                    if (left > scrollWidth || (this._maxIndentLeft > 0 && left > this._maxIndentLeft)) {
                        break;
                    }
                    const className = guide.horizontalLine ? (guide.horizontalLine.top ? 'horizontal-top' : 'horizontal-bottom') : 'vertical';
                    const width = guide.horizontalLine
                        ? (ctx.visibleRangeForPosition(new position_1.Position(lineNumber, guide.horizontalLine.endColumn))?.left ?? (left + this._spaceWidth)) - left
                        : this._spaceWidth;
                    result += `<div class="core-guide ${guide.className} ${className}" style="left:${left}px;width:${width}px"></div>`;
                }
                output[lineIndex] = result;
            }
            this._renderResult = output;
        }
        getGuidesByLine(visibleStartLineNumber, visibleEndLineNumber, activeCursorPosition) {
            const bracketGuides = this._bracketPairGuideOptions.bracketPairs !== false
                ? this._context.viewModel.getBracketGuidesInRangeByLine(visibleStartLineNumber, visibleEndLineNumber, activeCursorPosition, {
                    highlightActive: this._bracketPairGuideOptions.highlightActiveBracketPair,
                    horizontalGuides: this._bracketPairGuideOptions.bracketPairsHorizontal === true
                        ? textModelGuides_1.HorizontalGuidesState.Enabled
                        : this._bracketPairGuideOptions.bracketPairsHorizontal === 'active'
                            ? textModelGuides_1.HorizontalGuidesState.EnabledForActive
                            : textModelGuides_1.HorizontalGuidesState.Disabled,
                    includeInactive: this._bracketPairGuideOptions.bracketPairs === true,
                })
                : null;
            const indentGuides = this._bracketPairGuideOptions.indentation
                ? this._context.viewModel.getLinesIndentGuides(visibleStartLineNumber, visibleEndLineNumber)
                : null;
            let activeIndentStartLineNumber = 0;
            let activeIndentEndLineNumber = 0;
            let activeIndentLevel = 0;
            if (this._bracketPairGuideOptions.highlightActiveIndentation !== false && activeCursorPosition) {
                const activeIndentInfo = this._context.viewModel.getActiveIndentGuide(activeCursorPosition.lineNumber, visibleStartLineNumber, visibleEndLineNumber);
                activeIndentStartLineNumber = activeIndentInfo.startLineNumber;
                activeIndentEndLineNumber = activeIndentInfo.endLineNumber;
                activeIndentLevel = activeIndentInfo.indent;
            }
            const { indentSize } = this._context.viewModel.model.getOptions();
            const result = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineGuides = new Array();
                result.push(lineGuides);
                const bracketGuidesInLine = bracketGuides ? bracketGuides[lineNumber - visibleStartLineNumber] : [];
                const bracketGuidesInLineQueue = new arrays_1.ArrayQueue(bracketGuidesInLine);
                const indentGuidesInLine = indentGuides ? indentGuides[lineNumber - visibleStartLineNumber] : 0;
                for (let indentLvl = 1; indentLvl <= indentGuidesInLine; indentLvl++) {
                    const indentGuide = (indentLvl - 1) * indentSize + 1;
                    const isActive = 
                    // Disable active indent guide if there are bracket guides.
                    (this._bracketPairGuideOptions.highlightActiveIndentation === 'always' || bracketGuidesInLine.length === 0) &&
                        activeIndentStartLineNumber <= lineNumber &&
                        lineNumber <= activeIndentEndLineNumber &&
                        indentLvl === activeIndentLevel;
                    lineGuides.push(...bracketGuidesInLineQueue.takeWhile(g => g.visibleColumn < indentGuide) || []);
                    const peeked = bracketGuidesInLineQueue.peek();
                    if (!peeked || peeked.visibleColumn !== indentGuide || peeked.horizontalLine) {
                        lineGuides.push(new textModelGuides_1.IndentGuide(indentGuide, -1, `core-guide-indent lvl-${(indentLvl - 1) % 30}` + (isActive ? ' indent-active' : ''), null, -1, -1));
                    }
                }
                lineGuides.push(...bracketGuidesInLineQueue.takeWhile(g => true) || []);
            }
            return result;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.IndentGuidesOverlay = IndentGuidesOverlay;
    function transparentToUndefined(color) {
        if (color && color.isTransparent()) {
            return undefined;
        }
        return color;
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const colors = [
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground1, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground1, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground1 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground2, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground2, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground2 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground3, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground3, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground3 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground4, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground4, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground4 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground5, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground5, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground5 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground6, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground6, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground6 }
        ];
        const colorProvider = new guidesTextModelPart_1.BracketPairGuidesClassNames();
        const indentColors = [
            { indentColor: editorColorRegistry_1.editorIndentGuide1, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide1 },
            { indentColor: editorColorRegistry_1.editorIndentGuide2, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide2 },
            { indentColor: editorColorRegistry_1.editorIndentGuide3, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide3 },
            { indentColor: editorColorRegistry_1.editorIndentGuide4, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide4 },
            { indentColor: editorColorRegistry_1.editorIndentGuide5, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide5 },
            { indentColor: editorColorRegistry_1.editorIndentGuide6, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide6 },
        ];
        const colorValues = colors
            .map(c => {
            const bracketColor = theme.getColor(c.bracketColor);
            const guideColor = theme.getColor(c.guideColor);
            const guideColorActive = theme.getColor(c.guideColorActive);
            const effectiveGuideColor = transparentToUndefined(transparentToUndefined(guideColor) ?? bracketColor?.transparent(0.3));
            const effectiveGuideColorActive = transparentToUndefined(transparentToUndefined(guideColorActive) ?? bracketColor);
            if (!effectiveGuideColor || !effectiveGuideColorActive) {
                return undefined;
            }
            return {
                guideColor: effectiveGuideColor,
                guideColorActive: effectiveGuideColorActive,
            };
        })
            .filter(types_1.isDefined);
        const indentColorValues = indentColors
            .map(c => {
            const indentColor = theme.getColor(c.indentColor);
            const indentColorActive = theme.getColor(c.indentColorActive);
            const effectiveIndentColor = transparentToUndefined(indentColor);
            const effectiveIndentColorActive = transparentToUndefined(indentColorActive);
            if (!effectiveIndentColor || !effectiveIndentColorActive) {
                return undefined;
            }
            return {
                indentColor: effectiveIndentColor,
                indentColorActive: effectiveIndentColorActive,
            };
        })
            .filter(types_1.isDefined);
        if (colorValues.length > 0) {
            for (let level = 0; level < 30; level++) {
                const colors = colorValues[level % colorValues.length];
                collector.addRule(`.monaco-editor .${colorProvider.getInlineClassNameOfLevel(level).replace(/ /g, '.')} { --guide-color: ${colors.guideColor}; --guide-color-active: ${colors.guideColorActive}; }`);
            }
            collector.addRule(`.monaco-editor .vertical { box-shadow: 1px 0 0 0 var(--guide-color) inset; }`);
            collector.addRule(`.monaco-editor .horizontal-top { border-top: 1px solid var(--guide-color); }`);
            collector.addRule(`.monaco-editor .horizontal-bottom { border-bottom: 1px solid var(--guide-color); }`);
            collector.addRule(`.monaco-editor .vertical.${colorProvider.activeClassName} { box-shadow: 1px 0 0 0 var(--guide-color-active) inset; }`);
            collector.addRule(`.monaco-editor .horizontal-top.${colorProvider.activeClassName} { border-top: 1px solid var(--guide-color-active); }`);
            collector.addRule(`.monaco-editor .horizontal-bottom.${colorProvider.activeClassName} { border-bottom: 1px solid var(--guide-color-active); }`);
        }
        if (indentColorValues.length > 0) {
            for (let level = 0; level < 30; level++) {
                const colors = indentColorValues[level % indentColorValues.length];
                collector.addRule(`.monaco-editor .lines-content .core-guide-indent.lvl-${level} { --indent-color: ${colors.indentColor}; --indent-color-active: ${colors.indentColorActive}; }`);
            }
            collector.addRule(`.monaco-editor .lines-content .core-guide-indent { box-shadow: 1px 0 0 0 var(--indent-color) inset; }`);
            collector.addRule(`.monaco-editor .lines-content .core-guide-indent.indent-active { box-shadow: 1px 0 0 0 var(--indent-color-active) inset; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50R3VpZGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL2luZGVudEd1aWRlcy9pbmRlbnRHdWlkZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFhLG1CQUFvQixTQUFRLHVDQUFrQjtRQVMxRCxZQUFZLE9BQW9CO1lBQy9CLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUU3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcscUNBQTJCLENBQUM7WUFDNUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFFcEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxjQUFjLEdBQUcsWUFBWSxDQUFDLGNBQWMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUN4SSxJQUFJLENBQUMsd0JBQXdCLEdBQUcsT0FBTyxDQUFDLEdBQUcsOEJBQXFCLENBQUM7WUFFakUsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFFMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLFFB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