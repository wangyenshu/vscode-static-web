/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/supports", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/indentation"], function (require, exports, position_1, range_1, selection_1, supports_1, cursorColumns_1, indentation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditOperationResult = exports.SingleCursorState = exports.SelectionStartKind = exports.PartialViewCursorState = exports.PartialModelCursorState = exports.CursorState = exports.CursorConfiguration = exports.EditOperationType = void 0;
    exports.isQuote = isQuote;
    /**
     * This is an operation type that will be recorded for undo/redo purposes.
     * The goal is to introduce an undo stop when the controller switches between different operation types.
     */
    var EditOperationType;
    (function (EditOperationType) {
        EditOperationType[EditOperationType["Other"] = 0] = "Other";
        EditOperationType[EditOperationType["DeletingLeft"] = 2] = "DeletingLeft";
        EditOperationType[EditOperationType["DeletingRight"] = 3] = "DeletingRight";
        EditOperationType[EditOperationType["TypingOther"] = 4] = "TypingOther";
        EditOperationType[EditOperationType["TypingFirstSpace"] = 5] = "TypingFirstSpace";
        EditOperationType[EditOperationType["TypingConsecutiveSpace"] = 6] = "TypingConsecutiveSpace";
    })(EditOperationType || (exports.EditOperationType = EditOperationType = {}));
    const autoCloseAlways = () => true;
    const autoCloseNever = () => false;
    const autoCloseBeforeWhitespace = (chr) => (chr === ' ' || chr === '\t');
    class CursorConfiguration {
        static shouldRecreate(e) {
            return (e.hasChanged(145 /* EditorOption.layoutInfo */)
                || e.hasChanged(131 /* EditorOption.wordSeparators */)
                || e.hasChanged(37 /* EditorOption.emptySelectionClipboard */)
                || e.hasChanged(77 /* EditorOption.multiCursorMergeOverlapping */)
                || e.hasChanged(79 /* EditorOption.multiCursorPaste */)
                || e.hasChanged(80 /* EditorOption.multiCursorLimit */)
                || e.hasChanged(6 /* EditorOption.autoClosingBrackets */)
                || e.hasChanged(7 /* EditorOption.autoClosingComments */)
                || e.hasChanged(11 /* EditorOption.autoClosingQuotes */)
                || e.hasChanged(9 /* EditorOption.autoClosingDelete */)
                || e.hasChanged(10 /* EditorOption.autoClosingOvertype */)
                || e.hasChanged(14 /* EditorOption.autoSurround */)
                || e.hasChanged(128 /* EditorOption.useTabStops */)
                || e.hasChanged(50 /* EditorOption.fontInfo */)
                || e.hasChanged(91 /* EditorOption.readOnly */)
                || e.hasChanged(130 /* EditorOption.wordSegmenterLocales */));
        }
        constructor(languageId, modelOptions, configuration, languageConfigurationService) {
            this.languageConfigurationService = languageConfigurationService;
            this._cursorMoveConfigurationBrand = undefined;
            this._languageId = languageId;
            const options = configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this.readOnly = options.get(91 /* EditorOption.readOnly */);
            this.tabSize = modelOptions.tabSize;
            this.indentSize = modelOptions.indentSize;
            this.insertSpaces = modelOptions.insertSpaces;
            this.stickyTabStops = options.get(116 /* EditorOption.stickyTabStops */);
            this.lineHeight = fontInfo.lineHeight;
            this.typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this.pageSize = Math.max(1, Math.floor(layoutInfo.height / this.lineHeight) - 2);
            this.useTabStops = options.get(128 /* EditorOption.useTabStops */);
            this.wordSeparators = options.get(131 /* EditorOption.wordSeparators */);
            this.emptySelectionClipboard = options.get(37 /* EditorOption.emptySelectionClipboard */);
            this.copyWithSyntaxHighlighting = options.get(25 /* EditorOption.copyWithSyntaxHighlighting */);
            this.multiCursorMergeOverlapping = options.get(77 /* EditorOption.multiCursorMergeOverlapping */);
            this.multiCursorPaste = options.get(79 /* EditorOption.multiCursorPaste */);
            this.multiCursorLimit = options.get(80 /* EditorOption.multiCursorLimit */);
            this.autoClosingBrackets = options.get(6 /* EditorOption.autoClosingBrackets */);
            this.autoClosingComments = options.get(7 /* EditorOption.autoClosingComments */);
            this.autoClosingQuotes = options.get(11 /* EditorOption.autoClosingQuotes */);
            this.autoClosingDelete = options.get(9 /* EditorOption.autoClosingDelete */);
            this.autoClosingOvertype = options.get(10 /* EditorOption.autoClosingOvertype */);
            this.autoSurround = options.get(14 /* EditorOption.autoSurround */);
            this.autoIndent = options.get(12 /* EditorOption.autoIndent */);
            this.wordSegmenterLocales = options.get(130 /* EditorOption.wordSegmenterLocales */);
            this.surroundingPairs = {};
            this._electricChars = null;
            this.shouldAutoCloseBefore = {
                quote: this._getShouldAutoClose(languageId, this.autoClosingQuotes, true),
                comment: this._getShouldAutoClose(languageId, this.autoClosingComments, false),
                bracket: this._getShouldAutoClose(languageId, this.autoClosingBrackets, false),
            };
            this.autoClosingPairs = this.languageConfigurationService.getLanguageConfiguration(languageId).getAutoClosingPairs();
            const surroundingPairs = this.languageConfigurationService.getLanguageConfiguration(languageId).getSurroundingPairs();
            if (surroundingPairs) {
                for (const pair of surroundingPairs) {
                    this.surroundingPairs[pair.open] = pair.close;
                }
            }
            const commentsConfiguration = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            this.blockCommentStartToken = commentsConfiguration?.blockCommentStartToken ?? null;
        }
        get electricChars() {
            if (!this._electricChars) {
                this._electricChars = {};
                const electricChars = this.languageConfigurationService.getLanguageConfiguration(this._languageId).electricCharacter?.getElectricCharacters();
                if (electricChars) {
                    for (const char of electricChars) {
                        this._electricChars[char] = true;
                    }
                }
            }
            return this._electricChars;
        }
        /**
         * Should return opening bracket type to match indentation with
         */
        onElectricCharacter(character, context, column) {
            const scopedLineTokens = (0, supports_1.createScopedLineTokens)(context, column - 1);
            const electricCharacterSupport = this.languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId).electricCharacter;
            if (!electricCharacterSupport) {
                return null;
            }
            return electricCharacterSupport.onElectricCharacter(character, scopedLineTokens, column - scopedLineTokens.firstCharOffset);
        }
        normalizeIndentation(str) {
            return (0, indentation_1.normalizeIndentation)(str, this.indentSize, this.insertSpaces);
        }
        _getShouldAutoClose(languageId, autoCloseConfig, forQuotes) {
            switch (autoCloseConfig) {
                case 'beforeWhitespace':
                    return autoCloseBeforeWhitespace;
                case 'languageDefined':
                    return this._getLanguageDefinedShouldAutoClose(languageId, forQuotes);
                case 'always':
                    return autoCloseAlways;
                case 'never':
                    return autoCloseNever;
            }
        }
        _getLanguageDefinedShouldAutoClose(languageId, forQuotes) {
            const autoCloseBeforeSet = this.languageConfigurationService.getLanguageConfiguration(languageId).getAutoCloseBeforeSet(forQuotes);
            return c => autoCloseBeforeSet.indexOf(c) !== -1;
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        visibleColumnFromColumn(model, position) {
            return cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(position.lineNumber), position.column, this.tabSize);
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        columnFromVisibleColumn(model, lineNumber, visibleColumn) {
            const result = cursorColumns_1.CursorColumns.columnFromVisibleColumn(model.getLineContent(lineNumber), visibleColumn, this.tabSize);
            const minColumn = model.getLineMinColumn(lineNumber);
            if (result < minColumn) {
                return minColumn;
            }
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (result > maxColumn) {
                return maxColumn;
            }
            return result;
        }
    }
    exports.CursorConfiguration = CursorConfiguration;
    class CursorState {
        static fromModelState(modelState) {
            return new PartialModelCursorState(modelState);
        }
        static fromViewState(viewState) {
            return new PartialViewCursorState(viewState);
        }
        static fromModelSelection(modelSelection) {
            const selection = selection_1.Selection.liftSelection(modelSelection);
            const modelState = new SingleCursorState(range_1.Range.fromPositions(selection.getSelectionStart()), 0 /* SelectionStartKind.Simple */, 0, selection.getPosition(), 0);
            return CursorState.fromModelState(modelState);
        }
        static fromModelSelections(modelSelections) {
            const states = [];
            for (let i = 0, len = modelSelections.length; i < len; i++) {
                states[i] = this.fromModelSelection(modelSelections[i]);
            }
            return states;
        }
        constructor(modelState, viewState) {
            this._cursorStateBrand = undefined;
            this.modelState = modelState;
            this.viewState = viewState;
        }
        equals(other) {
            return (this.viewState.equals(other.viewState) && this.modelState.equals(other.modelState));
        }
    }
    exports.CursorState = CursorState;
    class PartialModelCursorState {
        constructor(modelState) {
            this.modelState = modelState;
            this.viewState = null;
        }
    }
    exports.PartialModelCursorState = PartialModelCursorState;
    class PartialViewCursorState {
        constructor(viewState) {
            this.modelState = null;
            this.viewState = viewState;
        }
    }
    exports.PartialViewCursorState = PartialViewCursorState;
    var SelectionStartKind;
    (function (SelectionStartKind) {
        SelectionStartKind[SelectionStartKind["Simple"] = 0] = "Simple";
        SelectionStartKind[SelectionStartKind["Word"] = 1] = "Word";
        SelectionStartKind[SelectionStartKind["Line"] = 2] = "Line";
    })(SelectionStartKind || (exports.SelectionStartKind = SelectionStartKind = {}));
    /**
     * Represents the cursor state on either the model or on the view model.
     */
    class SingleCursorState {
        constructor(selectionStart, selectionStartKind, selectionStartLeftoverVisibleColumns, position, leftoverVisibleColumns) {
            this.selectionStart = selectionStart;
            this.selectionStartKind = selectionStartKind;
            this.selectionStartLeftoverVisibleColumns = selectionStartLeftoverVisibleColumns;
            this.position = position;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
            this._singleCursorStateBrand = undefined;
            this.selection = SingleCursorState._computeSelection(this.selectionStart, this.position);
        }
        equals(other) {
            return (this.selectionStartLeftoverVisibleColumns === other.selectionStartLeftoverVisibleColumns
                && this.leftoverVisibleColumns === other.leftoverVisibleColumns
                && this.selectionStartKind === other.selectionStartKind
                && this.position.equals(other.position)
                && this.selectionStart.equalsRange(other.selectionStart));
        }
        hasSelection() {
            return (!this.selection.isEmpty() || !this.selectionStart.isEmpty());
        }
        move(inSelectionMode, lineNumber, column, leftoverVisibleColumns) {
            if (inSelectionMode) {
                // move just position
                return new SingleCursorState(this.selectionStart, this.selectionStartKind, this.selectionStartLeftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
            else {
                // move everything
                return new SingleCursorState(new range_1.Range(lineNumber, column, lineNumber, column), 0 /* SelectionStartKind.Simple */, leftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
        }
        static _computeSelection(selectionStart, position) {
            if (selectionStart.isEmpty() || !position.isBeforeOrEqual(selectionStart.getStartPosition())) {
                return selection_1.Selection.fromPositions(selectionStart.getStartPosition(), position);
            }
            else {
                return selection_1.Selection.fromPositions(selectionStart.getEndPosition(), position);
            }
        }
    }
    exports.SingleCursorState = SingleCursorState;
    class EditOperationResult {
        constructor(type, commands, opts) {
            this._editOperationResultBrand = undefined;
            this.type = type;
            this.commands = commands;
            this.shouldPushStackElementBefore = opts.shouldPushStackElementBefore;
            this.shouldPushStackElementAfter = opts.shouldPushStackElementAfter;
        }
    }
    exports.EditOperationResult = EditOperationResult;
    function isQuote(ch) {
        return (ch === '\'' || ch === '"' || ch === '`');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29tbW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jdXJzb3JDb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMFpoRywwQkFFQztJQW5ZRDs7O09BR0c7SUFDSCxJQUFrQixpQkFPakI7SUFQRCxXQUFrQixpQkFBaUI7UUFDbEMsMkRBQVMsQ0FBQTtRQUNULHlFQUFnQixDQUFBO1FBQ2hCLDJFQUFpQixDQUFBO1FBQ2pCLHVFQUFlLENBQUE7UUFDZixpRkFBb0IsQ0FBQTtRQUNwQiw2RkFBMEIsQ0FBQTtJQUMzQixDQUFDLEVBUGlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBT2xDO0lBTUQsTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ25DLE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztJQUNuQyxNQUFNLHlCQUF5QixHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDO0lBRWpGLE1BQWEsbUJBQW1CO1FBa0N4QixNQUFNLENBQUMsY0FBYyxDQUFDLENBQTRCO1lBQ3hELE9BQU8sQ0FDTixDQUFDLENBQUMsVUFBVSxtQ0FBeUI7bUJBQ2xDLENBQUMsQ0FBQyxVQUFVLHVDQUE2QjttQkFDekMsQ0FBQyxDQUFDLFVBQVUsK0NBQXNDO21CQUNsRCxDQUFDLENBQUMsVUFBVSxtREFBMEM7bUJBQ3RELENBQUMsQ0FBQyxVQUFVLHdDQUErQjttQkFDM0MsQ0FBQyxDQUFDLFVBQVUsd0NBQStCO21CQUMzQyxDQUFDLENBQUMsVUFBVSwwQ0FBa0M7bUJBQzlDLENBQUMsQ0FBQyxVQUFVLDBDQUFrQzttQkFDOUMs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