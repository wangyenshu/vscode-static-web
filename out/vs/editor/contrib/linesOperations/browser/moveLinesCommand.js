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
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/indentation/common/indentUtils", "vs/editor/common/languages/autoIndent", "vs/editor/common/languages/enterAction"], function (require, exports, strings, shiftCommand_1, range_1, selection_1, languageConfiguration_1, languageConfigurationRegistry_1, indentUtils, autoIndent_1, enterAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveLinesCommand = void 0;
    let MoveLinesCommand = class MoveLinesCommand {
        constructor(selection, isMovingDown, autoIndent, _languageConfigurationService) {
            this._languageConfigurationService = _languageConfigurationService;
            this._selection = selection;
            this._isMovingDown = isMovingDown;
            this._autoIndent = autoIndent;
            this._selectionId = null;
            this._moveEndLineSelectionShrink = false;
        }
        getEditOperations(model, builder) {
            const modelLineCount = model.getLineCount();
            if (this._isMovingDown && this._selection.endLineNumber === modelLineCount) {
                this._selectionId = builder.trackSelection(this._selection);
                return;
            }
            if (!this._isMovingDown && this._selection.startLineNumber === 1) {
                this._selectionId = builder.trackSelection(this._selection);
                return;
            }
            this._moveEndPositionDown = false;
            let s = this._selection;
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._moveEndPositionDown = true;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            const { tabSize, indentSize, insertSpaces } = model.getOptions();
            const indentConverter = this.buildIndentConverter(tabSize, indentSize, insertSpaces);
            const virtualModel = {
                tokenization: {
                    getLineTokens: (lineNumber) => {
                        return model.tokenization.getLineTokens(lineNumber);
                    },
                    getLanguageId: () => {
                        return model.getLanguageId();
                    },
                    getLanguageIdAtPosition: (lineNumber, column) => {
                        return model.getLanguageIdAtPosition(lineNumber, column);
                    },
                },
                getLineContent: null,
            };
            if (s.startLineNumber === s.endLineNumber && model.getLineMaxColumn(s.startLineNumber) === 1) {
                // Current line is empty
                const lineNumber = s.startLineNumber;
                const otherLineNumber = (this._isMovingDown ? lineNumber + 1 : lineNumber - 1);
                if (model.getLineMaxColumn(otherLineNumber) === 1) {
                    // Other line number is empty too, so no editing is needed
                    // Add a no-op to force running by the model
                    builder.addEditOperation(new range_1.Range(1, 1, 1, 1), null);
                }
                else {
                    // Type content from other line number on line number
                    builder.addEditOperation(new range_1.Range(lineNumber, 1, lineNumber, 1), model.getLineContent(otherLineNumber));
                    // Remove content from other line number
                    builder.addEditOperation(new range_1.Range(otherLineNumber, 1, otherLineNumber, model.getLineMaxColumn(otherLineNumber)), null);
                }
                // Track selection at the other line number
                s = new selection_1.Selection(otherLineNumber, 1, otherLineNumber, 1);
            }
            else {
                let movingLineNumber;
                let movingLineText;
                if (this._isMovingDown) {
                    movingLineNumber = s.endLineNumber + 1;
                    movingLineText = model.getLineContent(movingLineNumber);
                    // Delete line that needs to be moved
                    builder.addEditOperation(new range_1.Range(movingLineNumber - 1, model.getLineMaxColumn(movingLineNumber - 1), movingLineNumber, model.getLineMaxColumn(movingLineNumber)), null);
                    let insertingText = movingLineText;
                    if (this.shouldAutoIndent(model, s)) {
                        const movingLineMatchResult = this.matchEnterRule(model, indentConverter, tabSize, movingLineNumber, s.startLineNumber - 1);
                        // if s.startLineNumber - 1 matches onEnter rule, we still honor that.
                        if (movingLineMatchResult !== null) {
                            const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(movingLineNumber));
                            const newSpaceCnt = movingLineMatchResult + indentUtils.getSpaceCnt(oldIndentation, tabSize);
                            const newIndentation = indentUtils.generateIndent(newSpaceCnt, tabSize, insertSpaces);
                            insertingText = newIndentation + this.trimStart(movingLineText);
                        }
                        else {
                            // no enter rule matches, let's check indentatin rules then.
                            virtualModel.getLineContent = (lineNumber) => {
                                if (lineNumber === s.startLineNumber) {
                                    return model.getLineContent(movingLineNumber);
                                }
                                else {
                                    return model.getLineContent(lineNumber);
                                }
                            };
                            const indentOfMovingLine = (0, autoIndent_1.getGoodIndentForLine)(this._autoIndent, virtualModel, model.getLanguageIdAtPosition(movingLineNumber, 1), s.startLineNumber, indentConverter, this._languageConfigurationService);
                            if (indentOfMovingLine !== null) {
                                const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(movingLineNumber));
                                const newSpaceCnt = indentUtils.getSpaceCnt(indentOfMovingLine, tabSize);
                                const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                                if (newSpaceCnt !== oldSpaceCnt) {
                                    const newIndentation = indentUtils.generateIndent(newSpaceCnt, tabSize, insertSpaces);
                                    insertingText = newIndentation + this.trimStart(movingLineText);
                                }
                            }
                        }
                        // add edit operations for moving line first to make sure it's executed after we make indentation change
                        // to s.startLineNumber
                        builder.addEditOperation(new range_1.Range(s.startLineNumber, 1, s.startLineNumber, 1), insertingText + '\n');
                        const ret = this.matchEnterRuleMovingDown(model, indentConverter, tabSize, s.startLineNumber, movingLineNumber, insertingText);
                        // check if the line being moved before matches onEnter rules, if so let's adjust the indentation by onEnter rules.
                        if (ret !== null) {
                            if (ret !== 0) {
                                this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, ret);
                            }
                        }
                        else {
                            // it doesn't match onEnter rules, let's check indentation rules then.
                            virtualModel.getLineContent = (lineNumber) => {
                                if (lineNumber === s.startLineNumber) {
                                    return insertingText;
                                }
                                else if (lineNumber >= s.startLineNumber + 1 && lineNumber <= s.endLineNumber + 1) {
                                    return model.getLineContent(lineNumber - 1);
                                }
                                else {
                                    return model.getLineContent(lineNumber);
                                }
                            };
                            const newIndentatOfMovingBlock = (0, autoIndent_1.getGoodIndentForLine)(this._autoIndent, virtualModel, model.getLanguageIdAtPosition(movingLineNumber, 1), s.startLineNumber + 1, indentConverter, this._languageConfigurationService);
                            if (newIndentatOfMovingBlock !== null) {
                                const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(s.startLineNumber));
                                const newSpaceCnt = indentUtils.getSpaceCnt(newIndentatOfMovingBlock, tabSize);
                                const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                                if (newSpaceCnt !== oldSpaceCnt) {
                                    const spaceCntOffset = newSpaceCnt - oldSpaceCnt;
                                    this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, spaceCntOffset);
                                }
                            }
                        }
                    }
                    else {
                        // Insert line that needs to be moved before
                        builder.addEditOperation(new range_1.Range(s.startLineNumber, 1, s.startLineNumber, 1), insertingText + '\n');
                    }
                }
                else {
                    movingLineNumber = s.startLineNumber - 1;
                    movingLineText = model.getLineContent(movingLineNumber);
                    // Delete line that needs to be moved
                    builder.addEditOperation(new range_1.Range(movingLineNumber, 1, movingLineNumber + 1, 1), null);
                    // Insert line that needs to be moved after
                    builder.addEditOperation(new range_1.Range(s.endLineNumber, model.getLineMaxColumn(s.endLineNumber), s.endLineNumber, model.getLineMaxColumn(s.endLineNumber)), '\n' + movingLineText);
                    if (this.shouldAutoIndent(model, s)) {
                        virtualModel.getLineContent = (lineNumber) => {
                            if (lineNumber === movingLineNumber) {
                                return model.getLineContent(s.startLineNumber);
                            }
                            else {
                                return model.getLineContent(lineNumber);
                            }
                        };
                        const ret = this.matchEnterRule(model, indentConverter, tabSize, s.startLineNumber, s.startLineNumber - 2);
                        // check if s.startLineNumber - 2 matches onEnter rules, if so adjust the moving block by onEnter rules.
                        if (ret !== null) {
                            if (ret !== 0) {
                                this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, ret);
                            }
                        }
                        else {
                            // it doesn't match any onEnter rule, let's check indentation rules then.
                            const indentOfFirstLine = (0, autoIndent_1.getGoodIndentForLine)(this._autoIndent, virtualModel, model.getLanguageIdAtPosition(s.startLineNumber, 1), movingLineNumber, indentConverter, this._languageConfigurationService);
                            if (indentOfFirstLine !== null) {
                                // adjust the indentation of the moving block
                                const oldIndent = strings.getLeadingWhitespace(model.getLineContent(s.startLineNumber));
                                const newSpaceCnt = indentUtils.getSpaceCnt(indentOfFirstLine, tabSize);
                                const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndent, tabSize);
                                if (newSpaceCnt !== oldSpaceCnt) {
                                    const spaceCntOffset = newSpaceCnt - oldSpaceCnt;
                                    this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, spaceCntOffset);
                                }
                            }
                        }
                    }
                }
            }
            this._selectionId = builder.trackSelection(s);
        }
        buildIndentConverter(tabSize, indentSize, insertSpaces) {
            return {
                shiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.shiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                },
                unshiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.unshiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                }
            };
        }
        parseEnterResult(model, indentConverter, tabSize, line, enter) {
            if (enter) {
                let enterPrefix = enter.indentation;
                if (enter.indentAction === languageConfiguration_1.IndentAction.None) {
                    enterPrefix = enter.indentation + enter.appendText;
                }
                else if (enter.indentAction === languageConfiguration_1.IndentAction.Indent) {
                    enterPrefix = enter.indentation + enter.appendText;
                }
                else if (enter.indentAction === languageConfiguration_1.IndentAction.IndentOutdent) {
                    enterPrefix = enter.indentation;
                }
                else if (enter.indentAction === languageConfiguration_1.IndentAction.Outdent) {
                    enterPrefix = indentConverter.unshiftIndent(enter.indentation) + enter.appendText;
                }
                const movingLineText = model.getLineContent(line);
                if (this.trimStart(movingLineText).indexOf(this.trimStart(enterPrefix)) >= 0) {
                    const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(line));
                    let newIndentation = strings.getLeadingWhitespace(enterPrefix);
                    const indentMetadataOfMovelingLine = (0, autoIndent_1.getIndentMetadata)(model, line, this._languageConfigurationService);
                    if (indentMetadataOfMovelingLine !== null && indentMetadataOfMovelingLine & 2 /* IndentConsts.DECREASE_MASK */) {
                        newIndentation = indentConverter.unshiftIndent(newIndentation);
                    }
                    const newSpaceCnt = indentUtils.getSpaceCnt(newIndentation, tabSize);
                    const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                    return newSpaceCnt - oldSpaceCnt;
                }
            }
            return null;
        }
        /**
         *
         * @param model
         * @param indentConverter
         * @param tabSize
         * @param line the line moving down
         * @param futureAboveLineNumber the line which will be at the `line` position
         * @param futureAboveLineText
         */
        matchEnterRuleMovingDown(model, indentConverter, tabSize, line, futureAboveLineNumber, futureAboveLineText) {
            if (strings.lastNonWhitespaceIndex(futureAboveLineText) >= 0) {
                // break
                const maxColumn = model.getLineMaxColumn(futureAboveLineNumber);
                const enter = (0, enterAction_1.getEnterAction)(this._autoIndent, model, new range_1.Range(futureAboveLineNumber, maxColumn, futureAboveLineNumber, maxColumn), this._languageConfigurationService);
                return this.parseEnterResult(model, indentConverter, tabSize, line, enter);
            }
            else {
                // go upwards, starting from `line - 1`
                let validPrecedingLine = line - 1;
                while (validPrecedingLine >= 1) {
                    const lineContent = model.getLineContent(validPrecedingLine);
                    const nonWhitespaceIdx = strings.lastNonWhitespaceIndex(lineContent);
                    if (nonWhitespaceIdx >= 0) {
                        break;
                    }
                    validPrecedingLine--;
                }
                if (validPrecedingLine < 1 || line > model.getLineCount()) {
                    return null;
                }
                const maxColumn = model.getLineMaxColumn(validPrecedingLine);
                const enter = (0, enterAction_1.getEnterAction)(this._autoIndent, model, new range_1.Range(validPrecedingLine, maxColumn, validPrecedingLine, maxColumn), this._languageConfigurationService);
                return this.parseEnterResult(model, indentConverter, tabSize, line, enter);
            }
        }
        matchEnterRule(model, indentConverter, tabSize, line, oneLineAbove, previousLineText) {
            let validPrecedingLine = oneLineAbove;
            while (validPrecedingLine >= 1) {
                // ship empty lines as empty lines just inherit indentation
                let lineContent;
                if (validPrecedingLine === oneLineAbove && previousLineText !== undefined) {
                    lineContent = previousLineText;
                }
                else {
                    lineContent = model.getLineContent(validPrecedingLine);
                }
                const nonWhitespaceIdx = strings.lastNonWhitespaceIndex(lineContent);
                if (nonWhitespaceIdx >= 0) {
                    break;
                }
                validPrecedingLine--;
            }
            if (validPrecedingLine < 1 || line > model.getLineCount()) {
                return null;
            }
            const maxColumn = model.getLineMaxColumn(validPrecedingLine);
            const enter = (0, enterAction_1.getEnterAction)(this._autoIndent, model, new range_1.Range(validPrecedingLine, maxColumn, validPrecedingLine, maxColumn), this._languageConfigurationService);
            return this.parseEnterResult(model, indentConverter, tabSize, line, enter);
        }
        trimStart(str) {
            return str.replace(/^\s+/, '');
        }
        shouldAutoIndent(model, selection) {
            if (this._autoIndent < 4 /* EditorAutoIndentStrategy.Full */) {
                return false;
            }
            // if it's not easy to tokenize, we stop auto indent.
            if (!model.tokenization.isCheapToTokenize(selection.startLineNumber)) {
                return false;
            }
            const languageAtSelectionStart = model.getLanguageIdAtPosition(selection.startLineNumber, 1);
            const languageAtSelectionEnd = model.getLanguageIdAtPosition(selection.endLineNumber, 1);
            if (languageAtSelectionStart !== languageAtSelectionEnd) {
                return false;
            }
            if (this._languageConfigurationService.getLanguageConfiguration(languageAtSelectionStart).indentRulesSupport === null) {
                return false;
            }
            return true;
        }
        getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, offset) {
            for (let i = s.startLineNumber; i <= s.endLineNumber; i++) {
                const lineContent = model.getLineContent(i);
                const originalIndent = strings.getLeadingWhitespace(lineContent);
                const originalSpacesCnt = indentUtils.getSpaceCnt(originalIndent, tabSize);
                const newSpacesCnt = originalSpacesCnt + offset;
                const newIndent = indentUtils.generateIndent(newSpacesCnt, tabSize, insertSpaces);
                if (newIndent !== originalIndent) {
                    builder.addEditOperation(new range_1.Range(i, 1, i, originalIndent.length + 1), newIndent);
                    if (i === s.endLineNumber && s.endColumn <= originalIndent.length + 1 && newIndent === '') {
                        // as users select part of the original indent white spaces
                        // when we adjust the indentation of endLine, we should adjust the cursor position as well.
                        this._moveEndLineSelectionShrink = true;
                    }
                }
            }
        }
        computeCursorState(model, helper) {
            let result = helper.getTrackedSelection(this._selectionId);
            if (this._moveEndPositionDown) {
                result = result.setEndPosition(result.endLineNumber + 1, 1);
            }
            if (this._moveEndLineSelectionShrink && result.startLineNumber < result.endLineNumber) {
                result = result.setEndPosition(result.endLineNumber, 2);
            }
            return result;
        }
    };
    exports.MoveLinesCommand = MoveLinesCommand;
    exports.MoveLinesCommand = MoveLinesCommand = __decorate([
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], MoveLinesCommand);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZUxpbmVzQ29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2xpbmVzT3BlcmF0aW9ucy9icm93c2VyL21vdmVMaW5lc0NvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtRQVU1QixZQUNDLFNBQW9CLEVBQ3BCLFlBQXFCLEVBQ3JCLFVBQW9DLEVBQ1ksNkJBQTREO1lBQTVELGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFFNUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7WUFDbEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLDJCQUEyQixHQUFHLEtBQUssQ0FBQztRQUMxQyxDQUFDO1FBRU0saUJBQWlCLENBQUMsS0FBaUIsRUFBRSxPQUE4QjtZQUV6RSxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFNUMsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxLQUFLLGNBQWMsRUFBRSxDQUFDO2dCQUM1RSxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRSxJQUFJ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