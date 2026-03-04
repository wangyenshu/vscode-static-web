/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/strings", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/range", "vs/editor/common/model/textModelPart", "vs/editor/common/model/utils", "vs/editor/common/textModelGuides", "vs/base/common/errors"], function (require, exports, arraysFind_1, strings, cursorColumns_1, range_1, textModelPart_1, utils_1, textModelGuides_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairGuidesClassNames = exports.GuidesTextModelPart = void 0;
    class GuidesTextModelPart extends textModelPart_1.TextModelPart {
        constructor(textModel, languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.languageConfigurationService = languageConfigurationService;
        }
        getLanguageConfiguration(languageId) {
            return this.languageConfigurationService.getLanguageConfiguration(languageId);
        }
        _computeIndentLevel(lineIndex) {
            return (0, utils_1.computeIndentLevel)(this.textModel.getLineContent(lineIndex + 1), this.textModel.getOptions().tabSize);
        }
        getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber) {
            this.assertNotDisposed();
            const lineCount = this.textModel.getLineCount();
            if (lineNumber < 1 || lineNumber > lineCount) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            const foldingRules = this.getLanguageConfiguration(this.textModel.getLanguageId()).foldingRules;
            const offSide = Boolean(foldingRules && foldingRules.offSide);
            let up_aboveContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let up_aboveContentLineIndent = -1;
            let up_belowContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let up_belowContentLineIndent = -1;
            const up_resolveIndents = (lineNumber) => {
                if (up_aboveContentLineIndex !== -1 &&
                    (up_aboveContentLineIndex === -2 ||
                        up_aboveContentLineIndex > lineNumber - 1)) {
                    up_aboveContentLineIndex = -1;
                    up_aboveContentLineIndent = -1;
                    // must find previous line with content
                    for (let lineIndex = lineNumber - 2; lineIndex >= 0; lineIndex--) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            up_aboveContentLineIndex = lineIndex;
                            up_aboveContentLineIndent = indent;
                            break;
                        }
                    }
                }
                if (up_belowContentLineIndex === -2) {
                    up_belowContentLineIndex = -1;
                    up_belowContentLineIndent = -1;
                    // must find next line with content
                    for (let lineIndex = lineNumber; lineIndex < lineCount; lineIndex++) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            up_belowContentLineIndex = lineIndex;
                            up_belowContentLineIndent = indent;
                            break;
                        }
                    }
                }
            };
            let down_aboveContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let down_aboveContentLineIndent = -1;
            let down_belowContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let down_belowContentLineIndent = -1;
            const down_resolveIndents = (lineNumber) => {
                if (down_aboveContentLineIndex === -2) {
                    down_aboveContentLineIndex = -1;
                    down_aboveContentLineIndent = -1;
                    // must find previous line with content
                    for (let lineIndex = lineNumber - 2; lineIndex >= 0; lineIndex--) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            down_aboveContentLineIndex = lineIndex;
                            down_aboveContentLineIndent = indent;
                            break;
                        }
                    }
                }
                if (down_belowContentLineIndex !== -1 &&
                    (down_belowContentLineIndex === -2 ||
                        down_belowContentLineIndex < lineNumber - 1)) {
                    down_belowContentLineIndex = -1;
                    down_belowContentLineIndent = -1;
                    // must find next line with content
                    for (let lineIndex = lineNumber; lineIndex < lineCount; lineIndex++) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            down_belowContentLineIndex = lineIndex;
                            down_belowContentLineIndent = indent;
                            break;
                        }
                    }
                }
            };
            let startLineNumber = 0;
            let goUp = true;
            let endLineNumber = 0;
            let goDown = true;
            let indent = 0;
            let initialIndent = 0;
            for (let distance = 0; goUp || goDown; distance++) {
                const upLineNumber = lineNumber - distance;
                const downLineNumber = lineNumber + distance;
                if (distance > 1 && (upLineNumber < 1 || upLineNumber < minLineNumber)) {
                    goUp = false;
                }
                if (distance > 1 &&
                    (downLineNumber > lineCount || downLineNumber > maxLineNumber)) {
                    goDown = false;
                }
                if (distance > 50000) {
                    // stop processing
                    goUp = false;
                    goDown = false;
                }
                let upLineIndentLevel = -1;
                if (goUp && upLineNumber >= 1) {
                    // compute indent level going up
                    const currentIndent = this._computeIndentLevel(upLineNumber - 1);
                    if (currentIndent >= 0) {
                        // This line has content (besides whitespace)
                        // Use the line's indent
                        up_belowContentLineIndex = upLineNumber - 1;
                        up_belowContentLineIndent = currentIndent;
                        upLineIndentLevel = Math.ceil(currentIndent / this.textModel.getOptions().indentSize);
                    }
                    else {
                        up_resolveIndents(upLineNumber);
                        upLineIndentLevel = this._getIndentLevelForWhitespaceLine(offSide, up_aboveContentLineIndent, up_belowContentLineIndent);
                    }
                }
                let downLineIndentLevel = -1;
                if (goDown && downLineNumber <= lineCount) {
                    // compute indent level going down
                    const currentIndent = this._computeIndentLevel(downLineNumber - 1);
                    if (currentIndent >= 0) {
                        // This line has content (besides whitespace)
                        // Use the line's indent
                        down_aboveContentLineIndex = downLineNumber - 1;
                        down_aboveContentLineIndent = currentIndent;
                        downLineIndentLevel = Math.ceil(currentIndent / this.textModel.getOptions().indentSize);
                    }
                    else {
                        down_resolveIndents(downLineNumber);
                        downLineIndentLevel = this._getIndentLevelForWhitespaceLine(offSide, down_aboveContentLineIndent, down_belowContentLineIndent);
                    }
                }
                if (distance === 0) {
                    initialIndent = upLineIndentLevel;
                    continue;
                }
                if (distance === 1) {
                    if (downLineNumber <= lineCount &&
                        downLineIndentLevel >= 0 &&
                        initialIndent + 1 === downLineIndentLevel) {
                        // This is the beginning of a scope, we have special handling here, since we want the
                        // child scope indent to be active, not the parent scope
                        goUp = false;
                        startLineNumber = downLineNumber;
                        endLineNumber = downLineNumber;
                        indent = downLineIndentLevel;
                        continue;
                    }
                    if (upLineNumber >= 1 &&
                        upLineIndentLevel >= 0 &&
                        upLineIndentLevel - 1 === initialIndent) {
                        // This is the end of a scope, just like above
                        goDown = false;
                        startLineNumber = upLineNumber;
                        endLineNumber = upLineNumber;
                        indent = upLineIndentLevel;
                        continue;
                    }
                    startLineNumber = lineNumber;
                    endLineNumber = lineNumber;
                    indent = initialIndent;
                    if (indent === 0) {
                        // No need to continue
                        return { startLineNumber, endLineNumber, indent };
                    }
                }
                if (goUp) {
                    if (upLineIndentLevel >= indent) {
                        startLineNumber = upLineNumber;
                    }
                    else {
                        goUp = false;
                    }
                }
                if (goDown) {
                    if (downLineIndentLevel >= indent) {
                        endLineNumber = downLineNumber;
                    }
                    else {
                        goDown = false;
                    }
                }
            }
            return { startLineNumber, endLineNumber, indent };
        }
        getLinesBracketGuides(startLineNumber, endLineNumber, activePosition, options) {
            const result = [];
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                result.push([]);
            }
            // If requested, this could be made configurable.
            const includeSingleLinePairs = true;
            const bracketPairs = this.textModel.bracketPairs.getBracketPairsInRangeWithMinIndentation(new range_1.Range(startLineNumber, 1, endLineNumber, this.textModel.getLineMaxColumn(endLineNumber))).toArray();
            let activeBracketPairRange = undefined;
            if (activePosition && bracketPairs.length > 0) {
                const bracketsContainingActivePosition = (startLineNumber <= activePosition.lineNumber &&
                    activePosition.lineNumber <= endLineNumber
                    // We don't need to query the brackets again if the cursor is in the viewport
                    ? bracketPairs
                    : this.textModel.bracketPairs.getBracketPairsInRange(range_1.Range.fromPositions(activePosition)).toArray()).filter((bp) => range_1.Range.strictContainsPosition(bp.range, activePosition));
                activeBracketPairRange = (0, arraysFind_1.findLast)(bracketsContainingActivePosition, (i) => includeSingleLinePairs || i.range.startLineNumber !== i.range.endLineNumber)?.range;
            }
            const independentColorPoolPerBracketType = this.textModel.getOptions().bracketPairColorizationOptions.independentColorPoolPerBracketType;
            const colorProvider = new BracketPairGuidesClassNames();
            for (const pair of bracketPairs) {
                /*
    
    
                        {
                        |
                        }
    
                        {
                        |
                        ----}
    
                    ____{
                    |test
                    ----}
    
                    renderHorizontalEndLineAtTheBottom:
                        {
                        |
                        |x}
                        --
                    renderHorizontalEndLineAtTheBottom:
                    ____{
                    |test
                    | x }
                    ----
                */
                if (!pair.closingBracketRange) {
                    continue;
                }
                const isActive = activeBracketPairRange && pair.range.equalsRange(activeBracketPairRange);
                if (!isActive && !options.includeInactive) {
                    continue;
                }
                const className = colorProvider.getInlineClassName(pair.nestingLevel, pair.nestingLevelOfEqualBracketType, independentColorPoolPerBracketType) +
                    (options.highlightActive && isActive
                        ? ' ' + colorProvider.activeClassName
                        : '');
                const start = pair.openingBracketRange.getStartPosition();
                const end = pair.closingBracketRange.getStartPosition();
                const horizontalGuides = options.horizontalGuides === textModelGuides_1.HorizontalGuidesState.Enabled || (options.horizontalGuides === textModelGuides_1.HorizontalGuidesState.EnabledForActive && isActive);
                if (pair.range.startLineNumber === pair.range.endLineNumber) {
                    if (includeSingleLinePairs && horizontalGuides) {
                        result[pair.range.startLineNumber - startLineNumber].push(new textModelGuides_1.IndentGuide(-1, pair.openingBracketRange.getEndPosition().column, className, new textModelGuides_1.IndentGuideHorizontalLine(false, end.column), -1, -1));
                    }
                    continue;
                }
                const endVisibleColumn = this.getVisibleColumnFromPosition(end);
                const startVisibleColumn = this.getVisibleColumnFromPosition(pair.openingBracketRange.getStartPosition());
                const guideVisibleColumn = Math.min(startVisibleColumn, endVisibleColumn, pair.minVisibleColumnIndentation + 1);
                let renderHorizontalEndLineAtTheBottom = false;
                const firstNonWsIndex = strings.firstNonWhitespaceIndex(this.textModel.getLineContent(pair.closingBracketRange.startLineNumber));
                const hasTextBeforeClosingBracket = firstNonWsIndex < pair.closingBracketRange.startColumn - 1;
                if (hasTextBeforeClosingBracket) {
                    renderHorizontalEndLineAtTheBottom = true;
                }
                const visibleGuideStartLineNumber = Math.max(start.lineNumber, startLineNumber);
                const visibleGuideEndLineNumber = Math.min(end.lineNumber, endLineNumber);
                const offset = renderHorizontalEndLineAtTheBottom ? 1 : 0;
                for (let l = visibleGuideStartLineNumber; l < visibleGuideEndLineNumber + offset; l++) {
                    result[l - startLineNumber].push(new textModelGuides_1.IndentGuide(guideVisibleColumn, -1, className, null, l === start.lineNumber ? start.column : -1, l === end.lineNumber ? end.column : -1));
                }
                if (horizontalGuides) {
                    if (start.lineNumber >= startLineNumber && startVisibleColumn > guideVisibleColumn) {
                        result[start.lineNumber - startLineNumber].push(new textModelGuides_1.IndentGuide(guideVisibleColumn, -1, className, new textModelGuides_1.IndentGuideHorizontalLine(false, start.column), -1, -1));
                    }
                    if (end.lineNumber <= endLineNumber && endVisibleColumn > guideVisibleColumn) {
                        result[end.lineNumber - startLineNumber].push(new textModelGuides_1.IndentGuide(guideVisibleColumn, -1, className, new textModelGuides_1.IndentGuideHorizontalLine(!renderHorizontalEndLineAtTheBottom, end.column), -1, -1));
                    }
                }
            }
            for (const guides of result) {
                guides.sort((a, b) => a.visibleColumn - b.visibleColumn);
            }
            return result;
        }
        getVisibleColumnFromPosition(position) {
            return (cursorColumns_1.CursorColumns.visibleColumnFromColumn(this.textModel.getLineContent(position.lineNumber), position.column, this.textModel.getOptions().tabSize) + 1);
        }
        getLinesIndentGuides(startLineNumber, endLineNumber) {
            this.assertNotDisposed();
            const lineCount = this.textModel.getLineCount();
            if (startLineNumber < 1 || startLineNumber > lineCount) {
                throw new Error('Illegal value for startLineNumber');
            }
            if (endLineNumber < 1 || endLineNumber > lineCount) {
                throw new Error('Illegal value for endLineNumber');
            }
            const options = this.textModel.getOptions();
            const foldingRules = this.getLanguageConfiguration(this.textModel.getLanguageId()).foldingRules;
            const offSide = Boolean(foldingRules && foldingRules.offSide);
            const result = new Array(endLineNumber - startLineNumber + 1);
            let aboveContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let aboveContentLineIndent = -1;
            let belowContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let belowContentLineIndent = -1;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const resultIndex = lineNumber - startLineNumber;
                const currentIndent = this._computeIndentLevel(lineNumber - 1);
                if (currentIndent >= 0) {
                    // This line has content (besides whitespace)
                    // Use the line's indent
                    aboveContentLineIndex = lineNumber - 1;
                    aboveContentLineIndent = currentIndent;
                    result[resultIndex] = Math.ceil(currentIndent / options.indentSize);
                    continue;
                }
                if (aboveContentLineIndex === -2) {
                    aboveContentLineIndex = -1;
                    aboveContentLineIndent = -1;
                    // must find previous line with content
                    for (let lineIndex = lineNumber - 2; lineIndex >= 0; lineIndex--) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            aboveContentLineIndex = lineIndex;
                            aboveContentLineIndent = indent;
                            break;
                        }
                    }
                }
                if (belowContentLineIndex !== -1 &&
                    (belowContentLineIndex === -2 || belowContentLineIndex < lineNumber - 1)) {
                    belowContentLineIndex = -1;
                    belowContentLineIndent = -1;
                    // must find next line with content
                    for (let lineIndex = lineNumber; lineIndex < lineCount; lineIndex++) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            belowContentLineIndex = lineIndex;
                            belowContentLineIndent = indent;
                            break;
                        }
                    }
                }
                result[resultIndex] = this._getIndentLevelForWhitespaceLine(offSide, aboveContentLineIndent, belowContentLineIndent);
            }
            return result;
        }
        _getIndentLevelForWhitespaceLine(offSide, aboveContentLineIndent, belowContentLineIndent) {
            const options = this.textModel.getOptions();
            if (aboveContentLineIndent === -1 || belowContentLineIndent === -1) {
                // At the top or bottom of the file
                return 0;
            }
            else if (aboveContentLineIndent < belowContentLineIndent) {
                // we are inside the region above
                return 1 + Math.floor(aboveContentLineIndent / options.indentSize);
            }
            else if (aboveContentLineIndent === belowContentLineIndent) {
                // we are in between two regions
                return Math.ceil(belowContentLineIndent / options.indentSize);
            }
            else {
                if (offSide) {
                    // same level as region below
                    return Math.ceil(belowContentLineIndent / options.indentSize);
                }
                else {
                    // we are inside the region that ends below
                    return 1 + Math.floor(belowContentLineIndent / options.indentSize);
                }
            }
        }
    }
    exports.GuidesTextModelPart = GuidesTextModelPart;
    class BracketPairGuidesClassNames {
        constructor() {
            this.activeClassName = 'indent-active';
        }
        getInlineClassName(nestingLevel, nestingLevelOfEqualBracketType, independentColorPoolPerBracketType) {
            return this.getInlineClassNameOfLevel(independentColorPoolPerBracketType ? nestingLevelOfEqualBracketType : nestingLevel);
        }
        getInlineClassNameOfLevel(level) {
            // To support a dynamic amount of colors up to 6 colors,
            // we use a number that is a lcm of all numbers from 1 to 6.
            return `bracket-indent-guide lvl-${level % 30}`;
        }
    }
    exports.BracketPairGuidesClassNames = BracketPairGuidesClassNames;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGVzVGV4dE1vZGVsUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvZ3VpZGVzVGV4dE1vZGVsUGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxtQkFBb0IsU0FBUSw2QkFBYTtRQUNyRCxZQUNrQixTQUFvQixFQUNwQiw0QkFBMkQ7WUFFNUUsS0FBSyxFQUFFLENBQUM7WUFIUyxjQUFTLEdBQVQsU0FBUyxDQUFXO1lBQ3BCLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7UUFHN0UsQ0FBQztRQUVPLHdCQUF3QixDQUMvQixVQUFrQjtZQUVsQixPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FDaEUsVUFBVSxDQUNWLENBQUM7UUFDSCxDQUFDO1FBRU8sbUJBQW1CLENBQUMsU0FBaUI7WUFDNUMsT0FBTyxJQUFBLDBCQUFrQixFQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBTyxDQUNuQyxDQUFDO1FBQ0gsQ0FBQztRQUVNLG9CQUFvQixDQUMxQixVQUFrQixFQUNsQixhQUFxQixFQUNyQixhQUFxQjtZQUVyQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRWhELElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsU0FBUyxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFRCxNQUFNLFlBQVks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