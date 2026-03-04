/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, event_1, lifecycle_1, range_1, editorColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorizedBracketPairsDecorationProvider = void 0;
    class ColorizedBracketPairsDecorationProvider extends lifecycle_1.Disposable {
        constructor(textModel) {
            super();
            this.textModel = textModel;
            this.colorProvider = new ColorProvider();
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.colorizationOptions = textModel.getOptions().bracketPairColorizationOptions;
            this._register(textModel.bracketPairs.onDidChange(e => {
                this.onDidChangeEmitter.fire();
            }));
        }
        //#region TextModel events
        handleDidChangeOptions(e) {
            this.colorizationOptions = this.textModel.getOptions().bracketPairColorizationOptions;
        }
        //#endregion
        getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations) {
            if (onlyMinimapDecorations) {
                // Bracket pair colorization decorations are not rendered in the minimap
                return [];
            }
            if (ownerId === undefined) {
                return [];
            }
            if (!this.colorizationOptions.enabled) {
                return [];
            }
            const result = this.textModel.bracketPairs.getBracketsInRange(range, true).map(bracket => ({
                id: `bracket${bracket.range.toString()}-${bracket.nestingLevel}`,
                options: {
                    description: 'BracketPairColorization',
                    inlineClassName: this.colorProvider.getInlineClassName(bracket, this.colorizationOptions.independentColorPoolPerBracketType),
                },
                ownerId: 0,
                range: bracket.range,
            })).toArray();
            return result;
        }
        getAllDecorations(ownerId, filterOutValidation) {
            if (ownerId === undefined) {
                return [];
            }
            if (!this.colorizationOptions.enabled) {
                return [];
            }
            return this.getDecorationsInRange(new range_1.Range(1, 1, this.textModel.getLineCount(), 1), ownerId, filterOutValidation);
        }
    }
    exports.ColorizedBracketPairsDecorationProvider = ColorizedBracketPairsDecorationProvider;
    class ColorProvider {
        constructor() {
            this.unexpectedClosingBracketClassName = 'unexpected-closing-bracket';
        }
        getInlineClassName(bracket, independentColorPoolPerBracketType) {
            if (bracket.isInvalid) {
                return this.unexpectedClosingBracketClassName;
            }
            return this.getInlineClassNameOfLevel(independentColorPoolPerBracketType ? bracket.nestingLevelOfEqualBracketType : bracket.nestingLevel);
        }
        getInlineClassNameOfLevel(level) {
            // To support a dynamic amount of colors up to 6 colors,
            // we use a number that is a lcm of all numbers from 1 to 6.
            return `bracket-highlighting-${level % 30}`;
        }
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const colors = [
            editorColorRegistry_1.editorBracketHighlightingForeground1,
            editorColorRegistry_1.editorBracketHighlightingForeground2,
            editorColorRegistry_1.editorBracketHighlightingForeground3,
            editorColorRegistry_1.editorBracketHighlightingForeground4,
            editorColorRegistry_1.editorBracketHighlightingForeground5,
            editorColorRegistry_1.editorBracketHighlightingForeground6
        ];
        const colorProvider = new ColorProvider();
        collector.addRule(`.monaco-editor .${colorProvider.unexpectedClosingBracketClassName} { color: ${theme.getColor(editorColorRegistry_1.editorBracketHighlightingUnexpectedBracketForeground)}; }`);
        const colorValues = colors
            .map(c => theme.getColor(c))
            .filter((c) => !!c)
            .filter(c => !c.isTransparent());
        for (let level = 0; level < 30; level++) {
            const color = colorValues[level % colorValues.length];
            collector.addRule(`.monaco-editor .${colorProvider.getInlineClassNameOfLevel(level)} { color: ${color}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JpemVkQnJhY2tldFBhaXJzRGVjb3JhdGlvblByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2NvbG9yaXplZEJyYWNrZXRQYWlyc0RlY29yYXRpb25Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQWEsdUNBQXdDLFNBQVEsc0JBQVU7UUFPdEUsWUFBNkIsU0FBb0I7WUFDaEQsS0FBSyxFQUFFLENBQUM7WUFEb0IsY0FBUyxHQUFULFNBQVMsQ0FBVztZQUxoQyxrQkFBYSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7WUFFcEMsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUMxQyxnQkFBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFLM0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztZQUVqRixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCwwQkFBMEI7UUFFbkIsc0JBQXNCLENBQUMsQ0FBNEI7WUFDekQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsOEJBQThCLENBQUM7UUFDdkYsQ0FBQztRQUVELFlBQVk7UUFFWixxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsT0FBZ0IsRUFBRSxtQkFBNkIs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