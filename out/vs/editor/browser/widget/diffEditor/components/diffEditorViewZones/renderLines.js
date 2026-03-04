/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/editor/browser/config/domFontInfo", "vs/editor/common/config/editorOptions", "vs/editor/common/core/stringBuilder", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel"], function (require, exports, trustedTypes_1, domFontInfo_1, editorOptions_1, stringBuilder_1, lineDecorations_1, viewLineRenderer_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenderOptions = exports.LineSource = void 0;
    exports.renderLines = renderLines;
    const ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('diffEditorWidget', { createHTML: value => value });
    function renderLines(source, options, decorations, domNode) {
        (0, domFontInfo_1.applyFontInfo)(domNode, options.fontInfo);
        const hasCharChanges = (decorations.length > 0);
        const sb = new stringBuilder_1.StringBuilder(10000);
        let maxCharsPerLine = 0;
        let renderedLineCount = 0;
        const viewLineCounts = [];
        for (let lineIndex = 0; lineIndex < source.lineTokens.length; lineIndex++) {
            const lineNumber = lineIndex + 1;
            const lineTokens = source.lineTokens[lineIndex];
            const lineBreakData = source.lineBreakData[lineIndex];
            const actualDecorations = lineDecorations_1.LineDecoration.filter(decorations, lineNumber, 1, Number.MAX_SAFE_INTEGER);
            if (lineBreakData) {
                let lastBreakOffset = 0;
                for (const breakOffset of lineBreakData.breakOffsets) {
                    const viewLineTokens = lineTokens.sliceAndInflate(lastBreakOffset, breakOffset, 0);
                    maxCharsPerLine = Math.max(maxCharsPerLine, renderOriginalLine(renderedLineCount, viewLineTokens, lineDecorations_1.LineDecoration.extractWrapped(actualDecorations, lastBreakOffset, breakOffset), hasCharChanges, source.mightContainNonBasicASCII, source.mightContainRTL, options, sb));
                    renderedLineCount++;
                    lastBreakOffset = breakOffset;
                }
                viewLineCounts.push(lineBreakData.breakOffsets.length);
            }
            else {
                viewLineCounts.push(1);
                maxCharsPerLine = Math.max(maxCharsPerLine, renderOriginalLine(renderedLineCount, lineTokens, actualDecorations, hasCharChanges, source.mightContainNonBasicASCII, source.mightContainRTL, options, sb));
                renderedLineCount++;
            }
        }
        maxCharsPerLine += options.scrollBeyondLastColumn;
        const html = sb.build();
        const trustedhtml = ttPolicy ? ttPolicy.createHTML(html) : html;
        domNode.innerHTML = trustedhtml;
        const minWidthInPx = (maxCharsPerLine * options.typicalHalfwidthCharacterWidth);
        return {
            heightInLines: renderedLineCount,
            minWidthInPx,
            viewLineCounts,
        };
    }
    class LineSource {
        constructor(lineTokens, lineBreakData, mightContainNonBasicASCII, mightContainRTL) {
            this.lineTokens = lineTokens;
            this.lineBreakData = lineBreakData;
            this.mightContainNonBasicASCII = mightContainNonBasicASCII;
            this.mightContainRTL = mightContainRTL;
        }
    }
    exports.LineSource = LineSource;
    class RenderOptions {
        static fromEditor(editor) {
            const modifiedEditorOptions = editor.getOptions();
            const fontInfo = modifiedEditorOptions.get(50 /* EditorOption.fontInfo */);
            const layoutInfo = modifiedEditorOptions.get(145 /* EditorOption.layoutInfo */);
            return new RenderOptions(editor.getModel()?.getOptions().tabSize || 0, fontInfo, modifiedEditorOptions.get(33 /* EditorOption.disableMonospaceOptimizations */), fontInfo.typicalHalfwidthCharacterWidth, modifiedEditorOptions.get(104 /* EditorOption.scrollBeyondLastColumn */), modifiedEditorOptions.get(67 /* EditorOption.lineHeight */), layoutInfo.decorationsWidth, modifiedEditorOptions.get(117 /* EditorOption.stopRenderingLineAfter */), modifiedEditorOptions.get(99 /* EditorOption.renderWhitespace */), modifiedEditorOptions.get(94 /* EditorOption.renderControlCharacters */), modifiedEditorOptions.get(51 /* EditorOption.fontLigatures */));
        }
        constructor(tabSize, fontInfo, disableMonospaceOptimizations, typicalHalfwidthCharacterWidth, scrollBeyondLastColumn, lineHeight, lineDecorationsWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures) {
            this.tabSize = tabSize;
            this.fontInfo = fontInfo;
            this.disableMonospaceOptimizations = disableMonospaceOptimizations;
            this.typicalHalfwidthCharacterWidth = typicalHalfwidthCharacterWidth;
            this.scrollBeyondLastColumn = scrollBeyondLastColumn;
            this.lineHeight = lineHeight;
            this.lineDecorationsWidth = lineDecorationsWidth;
            this.stopRenderingLineAfter = stopRenderingLineAfter;
            this.renderWhitespace = renderWhitespace;
            this.renderControlCharacters = renderControlCharacters;
            this.fontLigatures = fontLigatures;
        }
    }
    exports.RenderOptions = RenderOptions;
    function renderOriginalLine(viewLineIdx, lineTokens, decorations, hasCharChanges, mightContainNonBasicASCII, mightContainRTL, options, sb) {
        sb.appendString('<div class="view-line');
        if (!hasCharChanges) {
            // No char changes
            sb.appendString(' char-delete');
        }
        sb.appendString('" style="top:');
        sb.appendString(String(viewLineIdx * options.lineHeight));
        sb.appendString('px;width:1000000px;">');
        const lineContent = lineTokens.getLineContent();
        const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(lineContent, mightContainNonBasicASCII);
        const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, mightContainRTL);
        const output = (0, viewLineRenderer_1.renderViewLine)(new viewLineRenderer_1.RenderLineInput((options.fontInfo.isMonospace && !options.disableMonospaceOptimizations), options.fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, decorations, options.tabSize, 0, options.fontInfo.spaceWidth, options.fontInfo.middotWidth, options.fontInfo.wsmiddotWidth, options.stopRenderingLineAfter, options.renderWhitespace, options.renderControlCharacters, options.fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, null // Send no selections, original line cannot be selected
        ), sb);
        sb.appendString('</div>');
        return output.characterMapping.getHorizontalOffset(output.characterMapping.length);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyTGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21wb25lbnRzL2RpZmZFZGl0b3JWaWV3Wm9uZXMvcmVuZGVyTGluZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxrQ0E0REM7SUE5REQsTUFBTSxRQUFRLEdBQUcsSUFBQSx1Q0FBd0IsRUFBQyxrQkFBa0IsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFOUYsU0FBZ0IsV0FBVyxDQUFDLE1BQWtCLEVBQUUsT0FBc0IsRUFBRSxXQUErQixFQUFFLE9BQW9CO1FBQzVILElBQUEsMkJBQWEsRUFBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXpDLE1BQU0sY0FBYyxHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUVoRCxNQUFNLEVBQUUsR0FBRyxJQUFJLDZCQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztRQUNwQyxLQUFLLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxTQUFTLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQztZQUMzRSxNQUFNLFVBQVUsR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEQsTUFBTSxh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