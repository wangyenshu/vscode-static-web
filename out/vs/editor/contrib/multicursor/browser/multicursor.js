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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/contrib/find/browser/findController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/wordHighlighter/browser/highlightDecorations", "vs/platform/instantiation/common/instantiation"], function (require, exports, aria_1, async_1, keyCodes_1, lifecycle_1, editorExtensions_1, cursorMoveCommands_1, range_1, selection_1, editorContextKeys_1, findController_1, nls, actions_1, contextkey_1, languageFeatures_1, highlightDecorations_1, instantiation_1) {
    "use strict";
    var SelectionHighlighter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FocusPreviousCursor = exports.FocusNextCursor = exports.SelectionHighlighter = exports.CompatChangeAll = exports.SelectHighlightsAction = exports.MoveSelectionToPreviousFindMatchAction = exports.MoveSelectionToNextFindMatchAction = exports.AddSelectionToPreviousFindMatchAction = exports.AddSelectionToNextFindMatchAction = exports.MultiCursorSelectionControllerAction = exports.MultiCursorSelectionController = exports.MultiCursorSession = exports.MultiCursorSessionResult = exports.InsertCursorBelow = exports.InsertCursorAbove = void 0;
    function announceCursorChange(previousCursorState, cursorState) {
        const cursorDiff = cursorState.filter(cs => !previousCursorState.find(pcs => pcs.equals(cs)));
        if (cursorDiff.length >= 1) {
            const cursorPositions = cursorDiff.map(cs => `line ${cs.viewState.position.lineNumber} column ${cs.viewState.position.column}`).join(', ');
            const msg = cursorDiff.length === 1 ? nls.localize('cursorAdded', "Cursor added: {0}", cursorPositions) : nls.localize('cursorsAdded', "Cursors added: {0}", cursorPositions);
            (0, aria_1.status)(msg);
        }
    }
    class InsertCursorAbove extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertCursorAbove',
                label: nls.localize('mutlicursor.insertAbove', "Add Cursor Above"),
                alias: 'Add Cursor Above',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                    linux: {
                        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */]
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miInsertCursorAbove', comment: ['&& denotes a mnemonic'] }, "&&Add Cursor Above"),
                    order: 2
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            let useLogicalLine = true;
            if (args && args.logicalLine === false) {
                useLogicalLine = false;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = viewModel.getCursorStates();
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.addCursorUp(viewModel, previousCursorState, useLogicalLine));
            viewModel.revealTopMostCursor(args.source);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.InsertCursorAbove = InsertCursorAbove;
    class InsertCursorBelow extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertCursorBelow',
                label: nls.localize('mutlicursor.insertBelow', "Add Cursor Below"),
                alias: 'Add Cursor Below',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                    linux: {
                        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */]
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miInsertCursorBelow', comment: ['&& denotes a mnemonic'] }, "A&&dd Cursor Below"),
                    order: 3
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            let useLogicalLine = true;
            if (args && args.logicalLine === false) {
                useLogicalLine = false;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = viewModel.getCursorStates();
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.addCursorDown(viewModel, previousCursorState, useLogicalLine));
            viewModel.revealBottomMostCursor(args.source);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.InsertCursorBelow = InsertCursorBelow;
    class InsertCursorAtEndOfEachLineSelected extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertCursorAtEndOfEachLineSelected',
                label: nls.localize('mutlicursor.insertAtEndOfEachLineSelected', "Add Cursors to Line Ends"),
                alias: 'Add Cursors to Line Ends',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miInsertCursorAtEndOfEachLineSelected', comment: ['&& denotes a mnemonic'] }, "Add C&&ursors to Line Ends"),
                    order: 4
                }
            });
        }
        getCursorsForSelection(selection, model, result) {
            if (selection.isEmpty()) {
                return;
            }
            for (let i = selection.startLineNumber; i < selection.endLineNumber; i++) {
                const currentLineMaxColumn = model.getLineMaxColumn(i);
                result.push(new selection_1.Selection(i, currentLineMaxColumn, i, currentLineMaxColumn));
            }
            if (selection.endColumn > 1) {
                result.push(new selection_1.Selection(selection.endLineNumber, selection.endColumn, selection.endLineNumber, selection.endColumn));
            }
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            const selections = editor.getSelections();
            const viewModel = editor._getViewModel();
            const previousCursorState = viewModel.getCursorStates();
            const newSelections = [];
            selections.forEach((sel) => this.getCursorsForSelection(sel, model, newSelections));
            if (newSelections.length > 0) {
                editor.setSelections(newSelections);
            }
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    class InsertCursorAtEndOfLineSelected extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.addCursorsToBottom',
                label: nls.localize('mutlicursor.addCursorsToBottom', "Add Cursors To Bottom"),
                alias: 'Add Cursors To Bottom',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections();
            const lineCount = editor.getModel().getLineCount();
            const newSelections = [];
            for (let i = selections[0].startLineNumber; i <= lineCount; i++) {
                newSelections.push(new selection_1.Selection(i, selections[0].startColumn, i, selections[0].endColumn));
            }
            const viewModel = editor._getViewModel();
            const previousCursorState = viewModel.getCursorStates();
            if (newSelections.length > 0) {
                editor.setSelections(newSelections);
            }
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    class InsertCursorAtTopOfLineSelected extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.addCursorsToTop',
                label: nls.localize('mutlicursor.addCursorsToTop', "Add Cursors To Top"),
                alias: 'Add Cursors To Top',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections();
            const newSelections = [];
            for (let i = selections[0].startLineNumber; i >= 1; i--) {
                newSelections.push(new selection_1.Selection(i, selections[0].startColumn, i, selections[0].endColumn));
            }
            const viewModel = editor._getViewModel();
            const previousCursorState = viewModel.getCursorStates();
            if (newSelections.length > 0) {
                editor.setSelections(newSelections);
            }
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    class MultiCursorSessionResult {
        constructor(selections, revealRange, revealScrollType) {
            this.selections = selections;
            this.revealRange = revealRange;
            this.revealScrollType = revealScrollType;
        }
    }
    exports.MultiCursorSessionResult = MultiCursorSessionResult;
    class MultiCursorSession {
        static create(editor, findController) {
            if (!editor.hasModel()) {
                return null;
            }
            const findState = findController.getState();
            // Find widget owns entirely what we search for if:
            //  - focus is not in the editor (i.e. it is in the find widget)
            //  - and the search widget is visible
            //  - and the search string is non-empty
            if (!editor.hasTextFocus() && findState.isRevealed && findState.searchString.length > 0) {
                // Find widget owns what is searched for
                return new MultiCursorSession(editor, findController, false, findState.searchString, findState.wholeWord, findState.matchCase, null);
            }
            // Otherwise, the selection gives the search text, and the find widget gives the search settings
            // The exception is the find state disassociation case: when beginning with a single, collapsed selection
            let isDisconnectedFromFindController = false;
            let wholeWord;
            let matchCase;
            const selections = editor.getSelections();
            if (selections.length === 1 && selections[0].isEmpty()) {
                isDisconnectedFromFindController = true;
                wholeWord = true;
                matchCase = true;
            }
            else {
                wholeWord = findState.wholeWord;
                matchCase = findState.matchCase;
            }
            // Selection owns what is searched for
            const s = editor.getSelection();
            let searchText;
            let currentMatch = null;
            if (s.isEmpty()) {
                // selection is empty => expand to current word
                const word = editor.getConfiguredWordAtPosition(s.getStartPosition());
                if (!word) {
                    return null;
                }
                searchText = word.word;
                currentMatch = new selection_1.Selection(s.startLineNumber, word.startColumn, s.startLineNumber, word.endColumn);
            }
            else {
                searchText = editor.getModel().getValueInRange(s).replace(/\r\n/g, '\n');
            }
            return new MultiCursorSession(editor, findController, isDisconnectedFromFindController, searchText, wholeWord, matchCase, currentMatch);
        }
        constructor(_editor, findController, isDisconnectedFromFindController, searchText, wholeWord, matchCase, currentMatch) {
            this._editor = _editor;
            this.findController = findController;
            this.isDisconnectedFromFindController = isDisconnectedFromFindController;
            this.searchText = searchText;
            this.wholeWord = wholeWord;
            this.matchCase = matchCase;
            this.currentMatch = currentMatch;
        }
        addSelectionToNextFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const nextMatch = this._getNextMatch();
            if (!nextMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.concat(nextMatch), nextMatch, 0 /* ScrollType.Smooth */);
        }
        moveSelectionToNextFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const nextMatch = this._getNextMatch();
            if (!nextMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.slice(0, allSelections.length - 1).concat(nextMatch), nextMatch, 0 /* ScrollType.Smooth */);
        }
        _getNextMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            if (this.currentMatch) {
                const result = this.currentMatch;
                this.currentMatch = null;
                return result;
            }
            this.findController.highlightFindOptions();
            const allSelections = this._editor.getSelections();
            const lastAddedSelection = allSelections[allSelections.length - 1];
            const nextMatch = this._editor.getModel().findNextMatch(this.searchText, lastAddedSelection.getEndPosition(), false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false);
            if (!nextMatch) {
                return null;
            }
            return new selection_1.Selection(nextMatch.range.startLineNumber, nextMatch.range.startColumn, nextMatch.range.endLineNumber, nextMatch.range.endColumn);
        }
        addSelectionToPreviousFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const previousMatch = this._getPreviousMatch();
            if (!previousMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.concat(previousMatch), previousMatch, 0 /* ScrollType.Smooth */);
        }
        moveSelectionToPreviousFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const previousMatch = this._getPreviousMatch();
            if (!previousMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.slice(0, allSelections.length - 1).concat(previousMatch), previousMatch, 0 /* ScrollType.Smooth */);
        }
        _getPreviousMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            if (this.currentMatch) {
                const result = this.currentMatch;
                this.currentMatch = null;
                return result;
            }
            this.findController.highlightFindOptions();
            const allSelections = this._editor.getSelections();
            const lastAddedSelection = allSelections[allSelections.length - 1];
            const previousMatch = this._editor.getModel().findPreviousMatch(this.searchText, lastAddedSelection.getStartPosition(), false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false);
            if (!previousMatch) {
                return null;
            }
            return new selection_1.Selection(previousMatch.range.startLineNumber, previousMatch.range.startColumn, previousMatch.range.endLineNumber, previousMatch.range.endColumn);
        }
        selectAll(searchScope) {
            if (!this._editor.hasModel()) {
                return [];
            }
            this.findController.highlightFindOptions();
            const editorModel = this._editor.getModel();
            if (searchScope) {
                return editorModel.findMatches(this.searchText, searchScope, false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            }
            return editorModel.findMatches(this.searchText, true, false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        }
    }
    exports.MultiCursorSession = MultiCursorSession;
    class MultiCursorSelectionController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.multiCursorController'; }
        static get(editor) {
            return editor.getContribution(MultiCursorSelectionController.ID);
        }
        constructor(editor) {
            super();
            this._sessionDispose = this._register(new lifecycle_1.DisposableStore());
            this._editor = editor;
            this._ignoreSelectionChange = false;
            this._session = null;
        }
        dispose() {
            this._endSession();
            super.dispose();
        }
        _beginSessionIfNeeded(findController) {
            if (!this._session) {
                // Create a new session
                const session = MultiCursorSession.create(this._editor, findController);
                if (!session) {
                    return;
                }
                this._session = session;
                const newState = { searchString: this._session.searchText };
                if (this._session.isDisconnectedFromFindController) {
                    newState.wholeWordOverride = 1 /* FindOptionOverride.True */;
                    newState.matchCaseOverride = 1 /* FindOptionOverride.True */;
                    newState.isRegexOverride = 2 /* FindOptionOverride.False */;
                }
                findController.getState().change(newState, false);
                this._sessionDispose.add(this._editor.onDidChangeCursorSelection((e) => {
                    if (this._ignoreSelectionChange) {
                        return;
                    }
                    this._endSession();
                }));
                this._sessionDispose.add(this._editor.onDidBlurEditorText(() => {
                    this._endSession();
                }));
                this._sessionDispose.add(findController.getState().onFindReplaceStateChange((e) => {
                    if (e.matchCase || e.wholeWord) {
                        this._endSession();
                    }
                }));
            }
        }
        _endSession() {
            this._sessionDispose.clear();
            if (this._session && this._session.isDisconnectedFromFindController) {
                const newState = {
                    wholeWordOverride: 0 /* FindOptionOverride.NotSet */,
                    matchCaseOverride: 0 /* FindOptionOverride.NotSet */,
                    isRegexOverride: 0 /* FindOptionOverride.NotSet */,
                };
                this._session.findController.getState().change(newState, false);
            }
            this._session = null;
        }
        _setSelections(selections) {
            this._ignoreSelectionChange = true;
            this._editor.setSelections(selections);
            this._ignoreSelectionChange = false;
        }
        _expandEmptyToWord(model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const word = this._editor.getConfiguredWordAtPosition(selection.getStartPosition());
            if (!word) {
                return selection;
            }
            return new selection_1.Selection(selection.startLineNumber, word.startColumn, selection.startLineNumber, word.endColumn);
        }
        _applySessionResult(result) {
            if (!result) {
                return;
            }
            this._setSelections(result.selections);
            if (result.revealRange) {
                this._editor.revealRangeInCenterIfOutsideViewport(result.revealRange, result.revealScrollType);
            }
        }
        getSession(findController) {
            return this._session;
        }
        addSelectionToNextFindMatch(findController) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (!this._session) {
                // If there are multiple cursors, handle the case where they do not all select the same text.
                const allSelections = this._editor.getSelections();
                if (allSelections.length > 1) {
                    const findState = findController.getState();
                    const matchCase = findState.matchCase;
                    const selectionsContainSameText = modelRangesContainSameText(this._editor.getModel(), allSelections, matchCase);
                    if (!selectionsContainSameText) {
                        const model = this._editor.getModel();
                        const resultingSelections = [];
                        for (let i = 0, len = allSelections.length; i < len; i++) {
                            resultingSelections[i] = this._expandEmptyToWord(model, allSelections[i]);
                        }
                        this._editor.setSelections(resultingSelections);
                        return;
                    }
                }
            }
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.addSelectionToNextFindMatch());
            }
        }
        addSelectionToPreviousFindMatch(findController) {
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.addSelectionToPreviousFindMatch());
            }
        }
        moveSelectionToNextFindMatch(findController) {
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.moveSelectionToNextFindMatch());
            }
        }
        moveSelectionToPreviousFindMatch(findController) {
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.moveSelectionToPreviousFindMatch());
            }
        }
        selectAll(findController) {
            if (!this._editor.hasModel()) {
                return;
            }
            let matches = null;
            const findState = findController.getState();
            // Special case: find widget owns entirely what we search for if:
            // - focus is not in the editor (i.e. it is in the find widget)
            // - and the search widget is visible
            // - and the search string is non-empty
            // - and we're searching for a regex
            if (findState.isRevealed && findState.searchString.length > 0 && findState.isRegex) {
                const editorModel = this._editor.getModel();
                if (findState.searchScope) {
                    matches = editorModel.findMatches(findState.searchString, findState.searchScope, findState.isRegex, findState.matchCase, findState.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
                }
                else {
                    matches = editorModel.findMatches(findState.searchString, true, findState.isRegex, findState.matchCase, findState.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
                }
            }
            else {
                this._beginSessionIfNeeded(findController);
                if (!this._session) {
                    return;
                }
                matches = this._session.selectAll(findState.searchScope);
            }
            if (matches.length > 0) {
                const editorSelection = this._editor.getSelection();
                // Have the primary cursor remain the one where the action was invoked
                for (let i = 0, len = matches.length; i < len; i++) {
                    const match = matches[i];
                    const intersection = match.range.intersectRanges(editorSelection);
                    if (intersection) {
                        // bingo!
                        matches[i] = matches[0];
                        matches[0] = match;
                        break;
                    }
                }
                this._setSelections(matches.map(m => new selection_1.Selection(m.range.startLineNumber, m.range.startColumn, m.range.endLineNumber, m.range.endColumn)));
            }
        }
        selectAllUsingSelections(selections) {
            if (selections.length > 0) {
                this._setSelections(selections);
            }
        }
    }
    exports.MultiCursorSelectionController = MultiCursorSelectionController;
    class MultiCursorSelectionControllerAction extends editorExtensions_1.EditorAction {
        run(accessor, editor) {
            const multiCursorController = MultiCursorSelectionController.get(editor);
            if (!multiCursorController) {
                return;
            }
            const viewModel = editor._getViewModel();
            if (viewModel) {
                const previousCursorState = viewModel.getCursorStates();
                const findController = findController_1.CommonFindController.get(editor);
                if (findController) {
                    this._run(multiCursorController, findController);
                }
                else {
                    const newFindController = accessor.get(instantiation_1.IInstantiationService).createInstance(findController_1.CommonFindController, editor);
                    this._run(multiCursorController, newFindController);
                    newFindController.dispose();
                }
                announceCursorChange(previousCursorState, viewModel.getCursorStates());
            }
        }
    }
    exports.MultiCursorSelectionControllerAction = MultiCursorSelectionControllerAction;
    class AddSelectionToNextFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.addSelectionToNextFindMatch',
                label: nls.localize('addSelectionToNextFindMatch', "Add Selection To Next Find Match"),
                alias: 'Add Selection To Next Find Match',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 34 /* KeyCode.KeyD */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miAddSelectionToNextFindMatch', comment: ['&& denotes a mnemonic'] }, "Add &&Next Occurrence"),
                    order: 5
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.addSelectionToNextFindMatch(findController);
        }
    }
    exports.AddSelectionToNextFindMatchAction = AddSelectionToNextFindMatchAction;
    class AddSelectionToPreviousFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.addSelectionToPreviousFindMatch',
                label: nls.localize('addSelectionToPreviousFindMatch', "Add Selection To Previous Find Match"),
                alias: 'Add Selection To Previous Find Match',
                precondition: undefined,
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miAddSelectionToPreviousFindMatch', comment: ['&& denotes a mnemonic'] }, "Add P&&revious Occurrence"),
                    order: 6
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.addSelectionToPreviousFindMatch(findController);
        }
    }
    exports.AddSelectionToPreviousFindMatchAction = AddSelectionToPreviousFindMatchAction;
    class MoveSelectionToNextFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.moveSelectionToNextFindMatch',
                label: nls.localize('moveSelectionToNextFindMatch', "Move Last Selection To Next Find Match"),
                alias: 'Move Last Selection To Next Find Match',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 34 /* KeyCode.KeyD */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.moveSelectionToNextFindMatch(findController);
        }
    }
    exports.MoveSelectionToNextFindMatchAction = MoveSelectionToNextFindMatchAction;
    class MoveSelectionToPreviousFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.moveSelectionToPreviousFindMatch',
                label: nls.localize('moveSelectionToPreviousFindMatch', "Move Last Selection To Previous Find Match"),
                alias: 'Move Last Selection To Previous Find Match',
                precondition: undefined
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.moveSelectionToPreviousFindMatch(findController);
        }
    }
    exports.MoveSelectionToPreviousFindMatchAction = MoveSelectionToPreviousFindMatchAction;
    class SelectHighlightsAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.selectHighlights',
                label: nls.localize('selectAllOccurrencesOfFindMatch', "Select All Occurrences of Find Match"),
                alias: 'Select All Occurrences of Find Match',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miSelectHighlights', comment: ['&& denotes a mnemonic'] }, "Select All &&Occurrences"),
                    order: 7
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.selectAll(findController);
        }
    }
    exports.SelectHighlightsAction = SelectHighlightsAction;
    class CompatChangeAll extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.changeAll',
                label: nls.localize('changeAll.label', "Change All Occurrences"),
                alias: 'Change All Occurrences',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 60 /* KeyCode.F2 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.2
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.selectAll(findController);
        }
    }
    exports.CompatChangeAll = CompatChangeAll;
    class SelectionHighlighterState {
        constructor(_model, _searchText, _matchCase, _wordSeparators, prevState) {
            this._model = _model;
            this._searchText = _searchText;
            this._matchCase = _matchCase;
            this._wordSeparators = _wordSeparators;
            this._modelVersionId = this._model.getVersionId();
            this._cachedFindMatches = null;
            if (prevState
                && this._model === prevState._model
                && this._searchText === prevState._searchText
                && this._matchCase === prevState._matchCase
                && this._wordSeparators === prevState._wordSeparators
                && this._modelVersionId === prevState._modelVersionId) {
                this._cachedFindMatches = prevState._cachedFindMatches;
            }
        }
        findMatches() {
            if (this._cachedFindMatches === null) {
                this._cachedFindMatches = this._model.findMatches(this._searchText, true, false, this._matchCase, this._wordSeparators, false).map(m => m.range);
                this._cachedFindMatches.sort(range_1.Range.compareRangesUsingStarts);
            }
            return this._cachedFindMatches;
        }
    }
    let SelectionHighlighter = class SelectionHighlighter extends lifecycle_1.Disposable {
        static { SelectionHighlighter_1 = this; }
        static { this.ID = 'editor.contrib.selectionHighlighter'; }
        constructor(editor, _languageFeaturesService) {
            super();
            this._languageFeaturesService = _languageFeaturesService;
            this.editor = editor;
            this._isEnabled = editor.getOption(108 /* EditorOption.selectionHighlight */);
            this._decorations = editor.createDecorationsCollection();
            this.updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 300));
            this.state = null;
            this._register(editor.onDidChangeConfiguration((e) => {
                this._isEnabled = editor.getOption(108 /* EditorOption.selectionHighlight */);
            }));
            this._register(editor.onDidChangeCursorSelection((e) => {
                if (!this._isEnabled) {
                    // Early exit if nothing needs to be done!
                    // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                    return;
                }
                if (e.selection.isEmpty()) {
                    if (e.reason === 3 /* CursorChangeReason.Explicit */) {
                        if (this.state) {
                            // no longer valid
                            this._setState(null);
                        }
                        this.updateSoon.schedule();
                    }
                    else {
                        this._setState(null);
                    }
                }
                else {
                    this._update();
                }
            }));
            this._register(editor.onDidChangeModel((e) => {
                this._setState(null);
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                if (this._isEnabled) {
                    this.updateSoon.schedule();
                }
            }));
            const findController = findController_1.CommonFindController.get(editor);
            if (findController) {
                this._register(findController.getState().onFindReplaceStateChange((e) => {
                    this._update();
                }));
            }
            this.updateSoon.schedule();
        }
        _update() {
            this._setState(SelectionHighlighter_1._createState(this.state, this._isEnabled, this.editor));
        }
        static _createState(oldState, isEnabled, editor) {
            if (!isEnabled) {
                return null;
            }
            if (!editor.hasModel()) {
                return null;
            }
            const s = editor.getSelection();
            if (s.startLineNumber !== s.endLineNumber) {
                // multiline forbidden for perf reasons
                return null;
            }
            const multiCursorController = MultiCursorSelectionController.get(editor);
            if (!multiCursorController) {
                return null;
            }
            const findController = findController_1.CommonFindController.get(editor);
            if (!findController) {
                return null;
            }
            let r = multiCursorController.getSession(findController);
            if (!r) {
                const allSelections = editor.getSelections();
                if (allSelections.length > 1) {
                    const findState = findController.getState();
                    const matchCase = findState.matchCase;
                    const selectionsContainSameText = modelRangesContainSameText(editor.getModel(), allSelections, matchCase);
                    if (!selectionsContainSameText) {
                        return null;
                    }
                }
                r = MultiCursorSession.create(editor, findController);
            }
            if (!r) {
                return null;
            }
            if (r.currentMatch) {
                // This is an empty selection
                // Do not interfere with semantic word highlighting in the no selection case
                return null;
            }
            if (/^[ \t]+$/.test(r.searchText)) {
                // whitespace only selection
                return null;
            }
            if (r.searchText.length > 200) {
                // very long selection
                return null;
            }
            // TODO: better handling of this case
            const findState = findController.getState();
            const caseSensitive = findState.matchCase;
            // Return early if the find widget shows the exact same matches
            if (findState.isRevealed) {
                let findStateSearchString = findState.searchString;
                if (!caseSensitive) {
                    findStateSearchString = findStateSearchString.toLowerCase();
                }
                let mySearchString = r.searchText;
                if (!caseSensitive) {
                    mySearchString = mySearchString.toLowerCase();
                }
                if (findStateSearchString === mySearchString && r.matchCase === findState.matchCase && r.wholeWord === findState.wholeWord && !findState.isRegex) {
                    return null;
                }
            }
            return new SelectionHighlighterState(editor.getModel(), r.searchText, r.matchCase, r.wholeWord ? editor.getOption(131 /* EditorOption.wordSeparators */) : null, oldState);
        }
        _setState(newState) {
            this.state = newState;
            if (!this.state) {
                this._decorations.clear();
                return;
            }
            if (!this.editor.hasModel()) {
                return;
            }
            const model = this.editor.getModel();
            if (model.isTooLargeForTokenization()) {
                // the file is too large, so searching word under cursor in the whole document would be blocking the UI.
                return;
            }
            const allMatches = this.state.findMatches();
            const selections = this.editor.getSelections();
            selections.sort(range_1.Range.compareRangesUsingStarts);
            // do not overlap with selection (issue #64 and #512)
            const matches = [];
            for (let i = 0, j = 0, len = allMatches.length, lenJ = selections.length; i < len;) {
                const match = allMatches[i];
                if (j >= lenJ) {
                    // finished all editor selections
                    matches.push(match);
                    i++;
                }
                else {
                    const cmp = range_1.Range.compareRangesUsingStarts(match, selections[j]);
                    if (cmp < 0) {
                        // match is before sel
                        if (selections[j].isEmpty() || !range_1.Range.areIntersecting(match, selections[j])) {
                            matches.push(match);
                        }
                        i++;
                    }
                    else if (cmp > 0) {
                        // sel is before match
                        j++;
                    }
                    else {
                        // sel is equal to match
                        i++;
                        j++;
                    }
                }
            }
            const occurrenceHighlighting = this.editor.getOption(81 /* EditorOption.occurrencesHighlight */) !== 'off';
            const hasSemanticHighlights = this._languageFeaturesService.documentHighlightProvider.has(model) && occurrenceHighlighting;
            const decorations = matches.map(r => {
                return {
                    range: r,
                    options: (0, highlightDecorations_1.getSelectionHighlightDecorationOptions)(hasSemanticHighlights)
                };
            });
            this._decorations.set(decorations);
        }
        dispose() {
            this._setState(null);
            super.dispose();
        }
    };
    exports.SelectionHighlighter = SelectionHighlighter;
    exports.SelectionHighlighter = SelectionHighlighter = SelectionHighlighter_1 = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], SelectionHighlighter);
    function modelRangesContainSameText(model, ranges, matchCase) {
        const selectedText = getValueInRange(model, ranges[0], !matchCase);
        for (let i = 1, len = ranges.length; i < len; i++) {
            const range = ranges[i];
            if (range.isEmpty()) {
                return false;
            }
            const thisSelectedText = getValueInRange(model, range, !matchCase);
            if (selectedText !== thisSelectedText) {
                return false;
            }
        }
        return true;
    }
    function getValueInRange(model, range, toLowerCase) {
        const text = model.getValueInRange(range);
        return (toLowerCase ? text.toLowerCase() : text);
    }
    class FocusNextCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.focusNextCursor',
                label: nls.localize('mutlicursor.focusNextCursor', "Focus Next Cursor"),
                metadata: {
                    description: nls.localize('mutlicursor.focusNextCursor.description', "Focuses the next cursor"),
                    args: [],
                },
                alias: 'Focus Next Cursor',
                precondition: undefined
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = Array.from(viewModel.getCursorStates());
            const firstCursor = previousCursorState.shift();
            if (!firstCursor) {
                return;
            }
            previousCursorState.push(firstCursor);
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, previousCursorState);
            viewModel.revealPrimaryCursor(args.source, true);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.FocusNextCursor = FocusNextCursor;
    class FocusPreviousCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.focusPreviousCursor',
                label: nls.localize('mutlicursor.focusPreviousCursor', "Focus Previous Cursor"),
                metadata: {
                    description: nls.localize('mutlicursor.focusPreviousCursor.description', "Focuses the previous cursor"),
                    args: [],
                },
                alias: 'Focus Previous Cursor',
                precondition: undefined
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = Array.from(viewModel.getCursorStates());
            const firstCursor = previousCursorState.pop();
            if (!firstCursor) {
                return;
            }
            previousCursorState.unshift(firstCursor);
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, previousCursorState);
            viewModel.revealPrimaryCursor(args.source, true);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.FocusPreviousCursor = FocusPreviousCursor;
    (0, editorExtensions_1.registerEditorContribution)(MultiCursorSelectionController.ID, MultiCursorSelectionController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorContribution)(SelectionHighlighter.ID, SelectionHighlighter, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAbove);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorBelow);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAtEndOfEachLineSelected);
    (0, editorExtensions_1.registerEditorAction)(AddSelectionToNextFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(AddSelectionToPreviousFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(MoveSelectionToNextFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(MoveSelectionToPreviousFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(SelectHighlightsAction);
    (0, editorExtensions_1.registerEditorAction)(CompatChangeAll);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAtEndOfLineSelected);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAtTopOfLineSelected);
    (0, editorExtensions_1.registerEditorAction)(FocusNextCursor);
    (0, editorExtensions_1.registerEditorAction)(FocusPreviousCursor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGljdXJzb3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9tdWx0aWN1cnNvci9icm93c2VyL211bHRpY3Vyc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0QmhHLFNBQVMsb0JBQW9CLENBQUMsbUJBQWtDLEVBQUUsV0FBMEI7UUFDM0YsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUYsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzVCLE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsV0FBVyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzSSxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLG9CQUFvQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzlLLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsQ0FBQztJQUNGLENBQUM7SUFFRCxN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