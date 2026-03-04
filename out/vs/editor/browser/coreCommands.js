/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/common/types", "vs/base/browser/ui/aria/aria", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/cursor/cursorColumnSelection", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorDeleteOperations", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/browser/dom"], function (require, exports, nls, browser_1, types, aria_1, editorExtensions_1, codeEditorService_1, cursorColumnSelection_1, cursorCommon_1, cursorDeleteOperations_1, cursorMoveCommands_1, cursorTypeOperations_1, position_1, range_1, editorContextKeys_1, contextkey_1, keybindingsRegistry_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CoreEditingCommands = exports.CoreNavigationCommands = exports.NavigationCommandRevealType = exports.RevealLine_ = exports.EditorScroll_ = exports.CoreEditorCommand = void 0;
    const CORE_WEIGHT = 0 /* KeybindingWeight.EditorCore */;
    class CoreEditorCommand extends editorExtensions_1.EditorCommand {
        runEditorCommand(accessor, editor, args) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                // the editor has no view => has no cursors
                return;
            }
            this.runCoreEditorCommand(viewModel, args || {});
        }
    }
    exports.CoreEditorCommand = CoreEditorCommand;
    var EditorScroll_;
    (function (EditorScroll_) {
        const isEditorScrollArgs = function (arg) {
            if (!types.isObject(arg)) {
                return false;
            }
            const scrollArg = arg;
            if (!types.isString(scrollArg.to)) {
                return false;
            }
            if (!types.isUndefined(scrollArg.by) && !types.isString(scrollArg.by)) {
                return false;
            }
            if (!types.isUndefined(scrollArg.value) && !types.isNumber(scrollArg.value)) {
                return false;
            }
            if (!types.isUndefined(scrollArg.revealCursor) && !types.isBoolean(scrollArg.revealCursor)) {
                return false;
            }
            return true;
        };
        EditorScroll_.metadata = {
            description: 'Scroll editor in the given direction',
            args: [
                {
                    name: 'Editor scroll argument object',
                    description: `Property-value pairs that can be passed through this argument:
					* 'to': A mandatory direction value.
						\`\`\`
						'up', 'down'
						\`\`\`
					* 'by': Unit to move. Default is computed based on 'to' value.
						\`\`\`
						'line', 'wrappedLine', 'page', 'halfPage', 'editor'
						\`\`\`
					* 'value': Number of units to move. Default is '1'.
					* 'revealCursor': If 'true' reveals the cursor if it is outside view port.
				`,
                    constraint: isEditorScrollArgs,
                    schema: {
                        'type': 'object',
                        'required': ['to'],
                        'properties': {
                            'to': {
                                'type': 'string',
                                'enum': ['up', 'down']
                            },
                            'by': {
                                'type': 'string',
                                'enum': ['line', 'wrappedLine', 'page', 'halfPage', 'editor']
                            },
                            'value': {
                                'type': 'number',
                                'default': 1
                            },
                            'revealCursor': {
                                'type': 'boolean',
                            }
                        }
                    }
                }
            ]
        };
        /**
         * Directions in the view for editor scroll command.
         */
        EditorScroll_.RawDirection = {
            Up: 'up',
            Right: 'right',
            Down: 'down',
            Left: 'left'
        };
        /**
         * Units for editor scroll 'by' argument
         */
        EditorScroll_.RawUnit = {
            Line: 'line',
            WrappedLine: 'wrappedLine',
            Page: 'page',
            HalfPage: 'halfPage',
            Editor: 'editor',
            Column: 'column'
        };
        function parse(args) {
            let direction;
            switch (args.to) {
                case EditorScroll_.RawDirection.Up:
                    direction = 1 /* Direction.Up */;
                    break;
                case EditorScroll_.RawDirection.Right:
                    direction = 2 /* Direction.Right */;
                    break;
                case EditorScroll_.RawDirection.Down:
                    direction = 3 /* Direction.Down */;
                    break;
                case EditorScroll_.RawDirection.Left:
                    direction = 4 /* Direction.Left */;
                    break;
                default:
                    // Illegal arguments
                    return null;
            }
            let unit;
            switch (args.by) {
                case EditorScroll_.RawUnit.Line:
                    unit = 1 /* Unit.Line */;
                    break;
                case EditorScroll_.RawUnit.WrappedLine:
                    unit = 2 /* Unit.WrappedLine */;
                    break;
                case EditorScroll_.RawUnit.Page:
                    unit = 3 /* Unit.Page */;
                    break;
                case EditorScroll_.RawUnit.HalfPage:
                    unit = 4 /* Unit.HalfPage */;
                    break;
                case EditorScroll_.RawUnit.Editor:
                    unit = 5 /* Unit.Editor */;
                    break;
                case EditorScroll_.RawUnit.Column:
                    unit = 6 /* Unit.Column */;
                    break;
                default:
                    unit = 2 /* Unit.WrappedLine */;
            }
            const value = Math.floor(args.value || 1);
            const revealCursor = !!args.revealCursor;
            return {
                direction: direction,
                unit: unit,
                value: value,
                revealCursor: revealCursor,
                select: (!!args.select)
            };
        }
        EditorScroll_.parse = parse;
        let Direction;
        (function (Direction) {
            Direction[Direction["Up"] = 1] = "Up";
            Direction[Direction["Right"] = 2] = "Right";
            Direction[Direction["Down"] = 3] = "Down";
            Direction[Direction["Left"] = 4] = "Left";
        })(Direction = EditorScroll_.Direction || (EditorScroll_.Direction = {}));
        let Unit;
        (function (Unit) {
            Unit[Unit["Line"] = 1] = "Line";
            Unit[Unit["WrappedLine"] = 2] = "WrappedLine";
            Unit[Unit["Page"] = 3] = "Page";
            Unit[Unit["HalfPage"] = 4] = "HalfPage";
            Unit[Unit["Editor"] = 5] = "Editor";
            Unit[Unit["Column"] = 6] = "Column";
        })(Unit = EditorScroll_.Unit || (EditorScroll_.Unit = {}));
    })(EditorScroll_ || (exports.EditorScroll_ = EditorScroll_ = {}));
    var RevealLine_;
    (function (RevealLine_) {
        const isRevealLineArgs = function (arg) {
            if (!types.isObject(arg)) {
                return false;
            }
            const reveaLineArg = arg;
            if (!types.isNumber(reveaLineArg.lineNumber) && !types.isString(reveaLineArg.lineNumber)) {
                return false;
            }
            if (!types.isUndefined(reveaLineArg.at) && !types.isString(reveaLineArg.at)) {
                return false;
            }
            return true;
        };
        RevealLine_.metadata = {
            description: 'Reveal the given line at the given logical position',
            args: [
                {
                    name: 'Reveal line argument object',
                    description: `Property-value pairs that can be passed through this argument:
					* 'lineNumber': A mandatory line number value.
					* 'at': Logical position at which line has to be revealed.
						\`\`\`
						'top', 'center', 'bottom'
						\`\`\`
				`,
                    constraint: isRevealLineArgs,
                    schema: {
                        'type': 'object',
                        'required': ['lineNumber'],
                        'properties': {
                            'lineNumber': {
                                'type': ['number', 'string'],
                            },
                            'at': {
                                'type': 'string',
                                'enum': ['top', 'center', 'bottom']
                            }
                        }
                    }
                }
            ]
        };
        /**
         * Values for reveal line 'at' argument
         */
        RevealLine_.RawAtArgument = {
            Top: 'top',
            Center: 'center',
            Bottom: 'bottom'
        };
    })(RevealLine_ || (exports.RevealLine_ = RevealLine_ = {}));
    class EditorOrNativeTextInputCommand {
        constructor(target) {
            // 1. handle case when focus is in editor.
            target.addImplementation(10000, 'code-editor', (accessor, args) => {
                // Only if editor text focus (i.e. not if editor has widget focus).
                const focusedEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
                if (focusedEditor && focusedEditor.hasTextFocus()) {
                    return this._runEditorCommand(accessor, focusedEditor, args);
                }
                return false;
            });
            // 2. handle case when focus is in some other `input` / `textarea`.
            target.addImplementation(1000, 'generic-dom-input-textarea', (accessor, args) => {
                // Only if focused on an element that allows for entering text
                const activeElement = (0, dom_1.getActiveElement)();
                if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                    this.runDOMCommand(activeElement);
                    return true;
                }
                return false;
            });
            // 3. (default) handle case when focus is somewhere else.
            target.addImplementation(0, 'generic-dom', (accessor, args) => {
                // Redirecting to active editor
                const activeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor();
                if (activeEditor) {
                    activeEditor.focus();
                    return this._runEditorCommand(accessor, activeEditor, args);
                }
                return false;
            });
        }
        _runEditorCommand(accessor, editor, args) {
            const result = this.runEditorCommand(accessor, editor, args);
            if (result) {
                return result;
            }
            return true;
        }
    }
    var NavigationCommandRevealType;
    (function (NavigationCommandRevealType) {
        /**
         * Do regular revealing.
         */
        NavigationCommandRevealType[NavigationCommandRevealType["Regular"] = 0] = "Regular";
        /**
         * Do only minimal revealing.
         */
        NavigationCommandRevealType[NavigationCommandRevealType["Minimal"] = 1] = "Minimal";
        /**
         * Do not reveal the position.
         */
        NavigationCommandRevealType[NavigationCommandRevealType["None"] = 2] = "None";
    })(NavigationCommandRevealType || (exports.NavigationCommandRevealType = NavigationCommandRevealType = {}));
    var CoreNavigationCommands;
    (function (CoreNavigationCommands) {
        class BaseMoveToCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                viewModel.model.pushStackElement();
                const cursorStateChanged = viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.moveTo(viewModel, viewModel.getPrimaryCursorState(), this._inSelectionMode, args.position, args.viewPosition)
                ]);
                if (cursorStateChanged && args.revealType !== 2 /* NavigationCommandRevealType.None */) {
                    viewModel.revealAllCursors(args.source, true, true);
                }
            }
        }
        CoreNavigationCommands.MoveTo = (0, editorExtensions_1.registerEditorCommand)(new BaseMoveToCommand({
            id: '_moveTo',
            inSelectionMode: false,
            precondition: undefined
        }));
        CoreNavigationCommands.MoveToSelect = (0, editorExtensions_1.registerEditorCommand)(new BaseMoveToCommand({
            id: '_moveToSelect',
            inSelectionMode: true,
            precondition: undefined
        }));
        class ColumnSelectCommand extends CoreEditorCommand {
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                const result = this._getColumnSelectResult(viewModel, viewModel.getPrimaryCursorState(), viewModel.getCursorColumnSelectData(), args);
                if (result === null) {
                    // invalid arguments
                    return;
                }
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, result.viewStates.map((viewState) => cursorCommon_1.CursorState.fromViewState(viewState)));
                viewModel.setCursorColumnSelectData({
                    isReal: true,
                    fromViewLineNumber: result.fromLineNumber,
                    fromViewVisualColumn: result.fromVisualColumn,
                    toViewLineNumber: result.toLineNumber,
                    toViewVisualColumn: result.toVisualColumn
                });
                if (result.reversed) {
                    viewModel.revealTopMostCursor(args.source);
                }
                else {
                    viewModel.revealBottomMostCursor(args.source);
                }
            }
        }
        CoreNavigationCommands.ColumnSelect = (0, editorExtensions_1.registerEditorCommand)(new class extends ColumnSelectCommand {
            constructor() {
                super({
                    id: 'columnSelect',
                    precondition: undefined
                });
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                if (typeof args.position === 'undefined' || typeof args.viewPosition === 'undefined' || typeof args.mouseColumn === 'undefined') {
                    return null;
                }
                // validate `args`
                const validatedPosition = viewModel.model.validatePosition(args.position);
                const validatedViewPosition = viewModel.coordinatesConverter.validateViewPosition(new position_1.Position(args.viewPosition.lineNumber, args.viewPosition.column), validatedPosition);
                const fromViewLineNumber = args.doColumnSelect ? prevColumnSelectData.fromViewLineNumber : validatedViewPosition.lineNumber;
                const fromViewVisualColumn = args.doColumnSelect ? prevColumnSelectData.fromViewVisualColumn : args.mouseColumn - 1;
                return cursorColumnSelection_1.ColumnSelection.columnSelect(viewModel.cursorConfig, viewModel, fromViewLineNumber, fromViewVisualColumn, validatedViewPosition.lineNumber, args.mouseColumn - 1);
            }
        });
        CoreNavigationCommands.CursorColumnSelectLeft = (0, editorExtensions_1.registerEditorCommand)(new class extends ColumnSelectCommand {
            constructor() {
                super({
                    id: 'cursorColumnSelectLeft',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                        linux: { primary: 0 }
                    }
                });
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectLeft(viewModel.cursorConfig, viewModel, prevColumnSelectData);
            }
        });
        CoreNavigationCommands.CursorColumnSelectRight = (0, editorExtensions_1.registerEditorCommand)(new class extends ColumnSelectCommand {
            constructor() {
                super({
                    id: 'cursorColumnSelectRight',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                        linux: { primary: 0 }
                    }
                });
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectRight(viewModel.cursorConfig, viewModel, prevColumnSelectData);
            }
        });
        class ColumnSelectUpCommand extends ColumnSelectCommand {
            constructor(opts) {
                super(opts);
                this._isPaged = opts.isPaged;
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectUp(viewModel.cursorConfig, viewModel, prevColumnSelectData, this._isPaged);
            }
        }
        CoreNavigationCommands.CursorColumnSelectUp = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectUpCommand({
            isPaged: false,
            id: 'cursorColumnSelectUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                linux: { primary: 0 }
            }
        }));
        CoreNavigationCommands.CursorColumnSelectPageUp = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectUpCommand({
            isPaged: true,
            id: 'cursorColumnSelectPageUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                linux: { primary: 0 }
            }
        }));
        class ColumnSelectDownCommand extends ColumnSelectCommand {
            constructor(opts) {
                super(opts);
                this._isPaged = opts.isPaged;
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectDown(viewModel.cursorConfig, viewModel, prevColumnSelectData, this._isPaged);
            }
        }
        CoreNavigationCommands.CursorColumnSelectDown = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectDownCommand({
            isPaged: false,
            id: 'cursorColumnSelectDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                linux: { primary: 0 }
            }
        }));
        CoreNavigationCommands.CursorColumnSelectPageDown = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectDownCommand({
            isPaged: true,
            id: 'cursorColumnSelectPageDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                linux: { primary: 0 }
            }
        }));
        class CursorMoveImpl extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'cursorMove',
                    precondition: undefined,
                    metadata: cursorMoveCommands_1.CursorMove.metadata
                });
            }
            runCoreEditorCommand(viewModel, args) {
                const parsed = cursorMoveCommands_1.CursorMove.parse(args);
                if (!parsed) {
                    // illegal arguments
                    return;
                }
                this._runCursorMove(viewModel, args.source, parsed);
            }
            _runCursorMove(viewModel, source, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(source, 3 /* CursorChangeReason.Explicit */, CursorMoveImpl._move(viewModel, viewModel.getCursorStates(), args));
                viewModel.revealAllCursors(source, true);
            }
            static _move(viewModel, cursors, args) {
                const inSelectionMode = args.select;
                const value = args.value;
                switch (args.direction) {
                    case 0 /* CursorMove_.Direction.Left */:
                    case 1 /* CursorMove_.Direction.Right */:
                    case 2 /* CursorMove_.Direction.Up */:
                    case 3 /* CursorMove_.Direction.Down */:
                    case 4 /* CursorMove_.Direction.PrevBlankLine */:
                    case 5 /* CursorMove_.Direction.NextBlankLine */:
                    case 6 /* CursorMove_.Direction.WrappedLineStart */:
                    case 7 /* CursorMove_.Direction.WrappedLineFirstNonWhitespaceCharacter */:
                    case 8 /* CursorMove_.Direction.WrappedLineColumnCenter */:
                    case 9 /* CursorMove_.Direction.WrappedLineEnd */:
                    case 10 /* CursorMove_.Direction.WrappedLineLastNonWhitespaceCharacter */:
                        return cursorMoveCommands_1.CursorMoveCommands.simpleMove(viewModel, cursors, args.direction, inSelectionMode, value, args.unit);
                    case 11 /* CursorMove_.Direction.ViewPortTop */:
                    case 13 /* CursorMove_.Direction.ViewPortBottom */:
                    case 12 /* CursorMove_.Direction.ViewPortCenter */:
                    case 14 /* CursorMove_.Direction.ViewPortIfOutside */:
                        return cursorMoveCommands_1.CursorMoveCommands.viewportMove(viewModel, cursors, args.direction, inSelectionMode, value);
                    default:
                        return null;
                }
            }
        }
        CoreNavigationCommands.CursorMoveImpl = CursorMoveImpl;
        CoreNavigationCommands.CursorMove = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveImpl());
        let Constants;
        (function (Constants) {
            Constants[Constants["PAGE_SIZE_MARKER"] = -1] = "PAGE_SIZE_MARKER";
        })(Constants || (Constants = {}));
        class CursorMoveBasedCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._staticArgs = opts.args;
            }
            runCoreEditorCommand(viewModel, dynamicArgs) {
                let args = this._staticArgs;
                if (this._staticArgs.value === -1 /* Constants.PAGE_SIZE_MARKER */) {
                    // -1 is a marker for page size
                    args = {
                        direction: this._staticArgs.direction,
                        unit: this._staticArgs.unit,
                        select: this._staticArgs.select,
                        value: dynamicArgs.pageSize || viewModel.cursorConfig.pageSize
                    };
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(dynamicArgs.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.simpleMove(viewModel, viewModel.getCursorStates(), args.direction, args.select, args.value, args.unit));
                viewModel.revealAllCursors(dynamicArgs.source, true);
            }
        }
        CoreNavigationCommands.CursorLeft = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 0 /* CursorMove_.Direction.Left */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: false,
                value: 1
            },
            id: 'cursorLeft',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 15 /* KeyCode.LeftArrow */,
                mac: { primary: 15 /* KeyCode.LeftArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 32 /* KeyCode.KeyB */] }
            }
        }));
        CoreNavigationCommands.CursorLeftSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 0 /* CursorMove_.Direction.Left */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: true,
                value: 1
            },
            id: 'cursorLeftSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */
            }
        }));
        CoreNavigationCommands.CursorRight = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 1 /* CursorMove_.Direction.Right */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: false,
                value: 1
            },
            id: 'cursorRight',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 17 /* KeyCode.RightArrow */,
                mac: { primary: 17 /* KeyCode.RightArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 36 /* KeyCode.KeyF */] }
            }
        }));
        CoreNavigationCommands.CursorRightSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 1 /* CursorMove_.Direction.Right */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: true,
                value: 1
            },
            id: 'cursorRightSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */
            }
        }));
        CoreNavigationCommands.CursorUp = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: 1
            },
            id: 'cursorUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 16 /* KeyCode.UpArrow */,
                mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] }
            }
        }));
        CoreNavigationCommands.CursorUpSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: 1
            },
            id: 'cursorUpSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */],
                mac: { primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                linux: { primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ }
            }
        }));
        CoreNavigationCommands.CursorPageUp = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 11 /* KeyCode.PageUp */
            }
        }));
        CoreNavigationCommands.CursorPageUpSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageUpSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */
            }
        }));
        CoreNavigationCommands.CursorDown = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: 1
            },
            id: 'cursorDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 18 /* KeyCode.DownArrow */,
                mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
            }
        }));
        CoreNavigationCommands.CursorDownSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: 1
            },
            id: 'cursorDownSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */],
                mac: { primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                linux: { primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ }
            }
        }));
        CoreNavigationCommands.CursorPageDown = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 12 /* KeyCode.PageDown */
            }
        }));
        CoreNavigationCommands.CursorPageDownSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageDownSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */
            }
        }));
        CoreNavigationCommands.CreateCursor = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'createCursor',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                let newState;
                if (args.wholeLine) {
                    newState = cursorMoveCommands_1.CursorMoveCommands.line(viewModel, viewModel.getPrimaryCursorState(), false, args.position, args.viewPosition);
                }
                else {
                    newState = cursorMoveCommands_1.CursorMoveCommands.moveTo(viewModel, viewModel.getPrimaryCursorState(), false, args.position, args.viewPosition);
                }
                const states = viewModel.getCursorStates();
                // Check if we should remove a cursor (sort of like a toggle)
                if (states.length > 1) {
                    const newModelPosition = (newState.modelState ? newState.modelState.position : null);
                    const newViewPosition = (newState.viewState ? newState.viewState.position : null);
                    for (let i = 0, len = states.length; i < len; i++) {
                        const state = states[i];
                        if (newModelPosition && !state.modelState.selection.containsPosition(newModelPosition)) {
                            continue;
                        }
                        if (newViewPosition && !state.viewState.selection.containsPosition(newViewPosition)) {
                            continue;
                        }
                        // => Remove the cursor
                        states.splice(i, 1);
                        viewModel.model.pushStackElement();
                        viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, states);
                        return;
                    }
                }
                // => Add the new cursor
                states.push(newState);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, states);
            }
        });
        CoreNavigationCommands.LastCursorMoveToSelect = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: '_lastCursorMoveToSelect',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                const lastAddedCursorIndex = viewModel.getLastAddedCursorIndex();
                const states = viewModel.getCursorStates();
                const newStates = states.slice(0);
                newStates[lastAddedCursorIndex] = cursorMoveCommands_1.CursorMoveCommands.moveTo(viewModel, states[lastAddedCursorIndex], true, args.position, args.viewPosition);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, newStates);
            }
        });
        class HomeCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToBeginningOfLine(viewModel, viewModel.getCursorStates(), this._inSelectionMode));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorHome = (0, editorExtensions_1.registerEditorCommand)(new HomeCommand({
            inSelectionMode: false,
            id: 'cursorHome',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 14 /* KeyCode.Home */,
                mac: { primary: 14 /* KeyCode.Home */, secondary: [2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */] }
            }
        }));
        CoreNavigationCommands.CursorHomeSelect = (0, editorExtensions_1.registerEditorCommand)(new HomeCommand({
            inSelectionMode: true,
            id: 'cursorHomeSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */,
                mac: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */] }
            }
        }));
        class LineStartCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, this._exec(viewModel.getCursorStates()));
                viewModel.revealAllCursors(args.source, true);
            }
            _exec(cursors) {
                const result = [];
                for (let i = 0, len = cursors.length; i < len; i++) {
                    const cursor = cursors[i];
                    const lineNumber = cursor.modelState.position.lineNumber;
                    result[i] = cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(this._inSelectionMode, lineNumber, 1, 0));
                }
                return result;
            }
        }
        CoreNavigationCommands.CursorLineStart = (0, editorExtensions_1.registerEditorCommand)(new LineStartCommand({
            inSelectionMode: false,
            id: 'cursorLineStart',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */ }
            }
        }));
        CoreNavigationCommands.CursorLineStartSelect = (0, editorExtensions_1.registerEditorCommand)(new LineStartCommand({
            inSelectionMode: true,
            id: 'cursorLineStartSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */ }
            }
        }));
        class EndCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToEndOfLine(viewModel, viewModel.getCursorStates(), this._inSelectionMode, args.sticky || false));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorEnd = (0, editorExtensions_1.registerEditorCommand)(new EndCommand({
            inSelectionMode: false,
            id: 'cursorEnd',
            precondition: undefined,
            kbOpts: {
                args: { sticky: false },
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 13 /* KeyCode.End */,
                mac: { primary: 13 /* KeyCode.End */, secondary: [2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */] }
            },
            metadata: {
                description: `Go to End`,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            properties: {
                                'sticky': {
                                    description: nls.localize('stickydesc', "Stick to the end even when going to longer lines"),
                                    type: 'boolean',
                                    default: false
                                }
                            }
                        }
                    }]
            }
        }));
        CoreNavigationCommands.CursorEndSelect = (0, editorExtensions_1.registerEditorCommand)(new EndCommand({
            inSelectionMode: true,
            id: 'cursorEndSelect',
            precondition: undefined,
            kbOpts: {
                args: { sticky: false },
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */,
                mac: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */] }
            },
            metadata: {
                description: `Select to End`,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            properties: {
                                'sticky': {
                                    description: nls.localize('stickydesc', "Stick to the end even when going to longer lines"),
                                    type: 'boolean',
                                    default: false
                                }
                            }
                        }
                    }]
            }
        }));
        class LineEndCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, this._exec(viewModel, viewModel.getCursorStates()));
                viewModel.revealAllCursors(args.source, true);
            }
            _exec(viewModel, cursors) {
                const result = [];
                for (let i = 0, len = cursors.length; i < len; i++) {
                    const cursor = cursors[i];
                    const lineNumber = cursor.modelState.position.lineNumber;
                    const maxColumn = viewModel.model.getLineMaxColumn(lineNumber);
                    result[i] = cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(this._inSelectionMode, lineNumber, maxColumn, 0));
                }
                return result;
            }
        }
        CoreNavigationCommands.CursorLineEnd = (0, editorExtensions_1.registerEditorCommand)(new LineEndCommand({
            inSelectionMode: false,
            id: 'cursorLineEnd',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 35 /* KeyCode.KeyE */ }
            }
        }));
        CoreNavigationCommands.CursorLineEndSelect = (0, editorExtensions_1.registerEditorCommand)(new LineEndCommand({
            inSelectionMode: true,
            id: 'cursorLineEndSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 35 /* KeyCode.KeyE */ }
            }
        }));
        class TopCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToBeginningOfBuffer(viewModel, viewModel.getCursorStates(), this._inSelectionMode));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorTop = (0, editorExtensions_1.registerEditorCommand)(new TopCommand({
            inSelectionMode: false,
            id: 'cursorTop',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ }
            }
        }));
        CoreNavigationCommands.CursorTopSelect = (0, editorExtensions_1.registerEditorCommand)(new TopCommand({
            inSelectionMode: true,
            id: 'cursorTopSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ }
            }
        }));
        class BottomCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToEndOfBuffer(viewModel, viewModel.getCursorStates(), this._inSelectionMode));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorBottom = (0, editorExtensions_1.registerEditorCommand)(new BottomCommand({
            inSelectionMode: false,
            id: 'cursorBottom',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ }
            }
        }));
        CoreNavigationCommands.CursorBottomSelect = (0, editorExtensions_1.registerEditorCommand)(new BottomCommand({
            inSelectionMode: true,
            id: 'cursorBottomSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ }
            }
        }));
        class EditorScrollImpl extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'editorScroll',
                    precondition: undefined,
                    metadata: EditorScroll_.metadata
                });
            }
            determineScrollMethod(args) {
                const horizontalUnits = [6 /* EditorScroll_.Unit.Column */];
                const verticalUnits = [
                    1 /* EditorScroll_.Unit.Line */,
                    2 /* EditorScroll_.Unit.WrappedLine */,
                    3 /* EditorScroll_.Unit.Page */,
                    4 /* EditorScroll_.Unit.HalfPage */,
                    5 /* EditorScroll_.Unit.Editor */,
                    6 /* EditorScroll_.Unit.Column */
                ];
                const horizontalDirections = [4 /* EditorScroll_.Direction.Left */, 2 /* EditorScroll_.Direction.Right */];
                const verticalDirections = [1 /* EditorScroll_.Direction.Up */, 3 /* EditorScroll_.Direction.Down */];
                if (horizontalUnits.includes(args.unit) && horizontalDirections.includes(args.direction)) {
                    return this._runHorizontalEditorScroll.bind(this);
                }
                if (verticalUnits.includes(args.unit) && verticalDirections.includes(args.direction)) {
                    return this._runVerticalEditorScroll.bind(this);
                }
                return null;
            }
            runCoreEditorCommand(viewModel, args) {
                const parsed = EditorScroll_.parse(args);
                if (!parsed) {
                    // illegal arguments
                    return;
                }
                const runEditorScroll = this.determineScrollMethod(parsed);
                if (!runEditorScroll) {
                    // Incompatible unit and direction
                    return;
                }
                runEditorScroll(viewModel, args.source, parsed);
            }
            _runVerticalEditorScroll(viewModel, source, args) {
                const desiredScrollTop = this._computeDesiredScrollTop(viewModel, args);
                if (args.revealCursor) {
                    // must ensure cursor is in new visible range
                    const desiredVisibleViewRange = viewModel.getCompletelyVisibleViewRangeAtScrollTop(desiredScrollTop);
                    viewModel.setCursorStates(source, 3 /* CursorChangeReason.Explicit */, [
                        cursorMoveCommands_1.CursorMoveCommands.findPositionInViewportIfOutside(viewModel, viewModel.getPrimaryCursorState(), desiredVisibleViewRange, args.select)
                    ]);
                }
                viewModel.viewLayout.setScrollPosition({ scrollTop: desiredScrollTop }, 0 /* ScrollType.Smooth */);
            }
            _computeDesiredScrollTop(viewModel, args) {
                if (args.unit === 1 /* EditorScroll_.Unit.Line */) {
                    // scrolling by model lines
                    const futureViewport = viewModel.viewLayout.getFutureViewport();
                    const visibleViewRange = viewModel.getCompletelyVisibleViewRangeAtScrollTop(futureViewport.top);
                    const visibleModelRange = viewModel.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
                    let desiredTopModelLineNumber;
                    if (args.direction === 1 /* EditorScroll_.Direction.Up */) {
                        // must go x model lines up
                        desiredTopModelLineNumber = Math.max(1, visibleModelRange.startLineNumber - args.value);
                    }
                    else {
                        // must go x model lines down
                        desiredTopModelLineNumber = Math.min(viewModel.model.getLineCount(), visibleModelRange.startLineNumber + args.value);
                    }
                    const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(desiredTopModelLineNumber, 1));
                    return viewModel.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                }
                if (args.unit === 5 /* EditorScroll_.Unit.Editor */) {
                    let desiredTopModelLineNumber = 0;
                    if (args.direction === 3 /* EditorScroll_.Direction.Down */) {
                        desiredTopModelLineNumber = viewModel.model.getLineCount() - viewModel.cursorConfig.pageSize;
                    }
                    return viewModel.viewLayout.getVerticalOffsetForLineNumber(desiredTopModelLineNumber);
                }
                let noOfLines;
                if (args.unit === 3 /* EditorScroll_.Unit.Page */) {
                    noOfLines = viewModel.cursorConfig.pageSize * args.value;
                }
                else if (args.unit === 4 /* EditorScroll_.Unit.HalfPage */) {
                    noOfLines = Math.round(viewModel.cursorConfig.pageSize / 2) * args.value;
                }
                else {
                    noOfLines = args.value;
                }
                const deltaLines = (args.direction === 1 /* EditorScroll_.Direction.Up */ ? -1 : 1) * noOfLines;
                return viewModel.viewLayout.getCurrentScrollTop() + deltaLines * viewModel.cursorConfig.lineHeight;
            }
            _runHorizontalEditorScroll(viewModel, source, args) {
                const desiredScrollLeft = this._computeDesiredScrollLeft(viewModel, args);
                viewModel.viewLayout.setScrollPosition({ scrollLeft: desiredScrollLeft }, 0 /* ScrollType.Smooth */);
            }
            _computeDesiredScrollLeft(viewModel, args) {
                const deltaColumns = (args.direction === 4 /* EditorScroll_.Direction.Left */ ? -1 : 1) * args.value;
                return viewModel.viewLayout.getCurrentScrollLeft() + deltaColumns * viewModel.cursorConfig.typicalHalfwidthCharacterWidth;
            }
        }
        CoreNavigationCommands.EditorScrollImpl = EditorScrollImpl;
        CoreNavigationCommands.EditorScroll = (0, editorExtensions_1.registerEditorCommand)(new EditorScrollImpl());
        CoreNavigationCommands.ScrollLineUp = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollLineUp',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 11 /* KeyCode.PageUp */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Up,
                    by: EditorScroll_.RawUnit.WrappedLine,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollPageUp = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollPageUp',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                        win: { primary: 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */ },
                        linux: { primary: 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Up,
                    by: EditorScroll_.RawUnit.Page,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollEditorTop = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollEditorTop',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Up,
                    by: EditorScroll_.RawUnit.Editor,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollLineDown = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollLineDown',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 12 /* KeyCode.PageDown */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Down,
                    by: EditorScroll_.RawUnit.WrappedLine,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollPageDown = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollPageDown',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                        win: { primary: 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */ },
                        linux: { primary: 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Down,
                    by: EditorScroll_.RawUnit.Page,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollEditorBottom = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollEditorBottom',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Down,
                    by: EditorScroll_.RawUnit.Editor,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollLeft = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollLeft',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Left,
                    by: EditorScroll_.RawUnit.Column,
                    value: 2,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollRight = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollRight',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Right,
                    by: EditorScroll_.RawUnit.Column,
                    value: 2,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        class WordCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.word(viewModel, viewModel.getPrimaryCursorState(), this._inSelectionMode, args.position)
                ]);
                if (args.revealType !== 2 /* NavigationCommandRevealType.None */) {
                    viewModel.revealAllCursors(args.source, true, true);
                }
            }
        }
        CoreNavigationCommands.WordSelect = (0, editorExtensions_1.registerEditorCommand)(new WordCommand({
            inSelectionMode: false,
            id: '_wordSelect',
            precondition: undefined
        }));
        CoreNavigationCommands.WordSelectDrag = (0, editorExtensions_1.registerEditorCommand)(new WordCommand({
            inSelectionMode: true,
            id: '_wordSelectDrag',
            precondition: undefined
        }));
        CoreNavigationCommands.LastCursorWordSelect = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'lastCursorWordSelect',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                const lastAddedCursorIndex = viewModel.getLastAddedCursorIndex();
                const states = viewModel.getCursorStates();
                const newStates = states.slice(0);
                const lastAddedState = states[lastAddedCursorIndex];
                newStates[lastAddedCursorIndex] = cursorMoveCommands_1.CursorMoveCommands.word(viewModel, lastAddedState, lastAddedState.modelState.hasSelection(), args.position);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, newStates);
            }
        });
        class LineCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.line(viewModel, viewModel.getPrimaryCursorState(), this._inSelectionMode, args.position, args.viewPosition)
                ]);
                if (args.revealType !== 2 /* NavigationCommandRevealType.None */) {
                    viewModel.revealAllCursors(args.source, false, true);
                }
            }
        }
        CoreNavigationCommands.LineSelect = (0, editorExtensions_1.registerEditorCommand)(new LineCommand({
            inSelectionMode: false,
            id: '_lineSelect',
            precondition: undefined
        }));
        CoreNavigationCommands.LineSelectDrag = (0, editorExtensions_1.registerEditorCommand)(new LineCommand({
            inSelectionMode: true,
            id: '_lineSelectDrag',
            precondition: undefined
        }));
        class LastCursorLineCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                const lastAddedCursorIndex = viewModel.getLastAddedCursorIndex();
                const states = viewModel.getCursorStates();
                const newStates = states.slice(0);
                newStates[lastAddedCursorIndex] = cursorMoveCommands_1.CursorMoveCommands.line(viewModel, states[lastAddedCursorIndex], this._inSelectionMode, args.position, args.viewPosition);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, newStates);
            }
        }
        CoreNavigationCommands.LastCursorLineSelect = (0, editorExtensions_1.registerEditorCommand)(new LastCursorLineCommand({
            inSelectionMode: false,
            id: 'lastCursorLineSelect',
            precondition: undefined
        }));
        CoreNavigationCommands.LastCursorLineSelectDrag = (0, editorExtensions_1.registerEditorCommand)(new LastCursorLineCommand({
            inSelectionMode: true,
            id: 'lastCursorLineSelectDrag',
            precondition: undefined
        }));
        CoreNavigationCommands.CancelSelection = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'cancelSelection',
                    precondition: editorContextKeys_1.EditorContextKeys.hasNonEmptySelection,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 9 /* KeyCode.Escape */,
                        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.cancelSelection(viewModel, viewModel.getPrimaryCursorState())
                ]);
                viewModel.revealAllCursors(args.source, true);
            }
        });
        CoreNavigationCommands.RemoveSecondaryCursors = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'removeSecondaryCursors',
                    precondition: editorContextKeys_1.EditorContextKeys.hasMultipleSelections,
                    kbOpts: {
                        weight: CORE_WEIGHT + 1,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 9 /* KeyCode.Escape */,
                        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    viewModel.getPrimaryCursorState()
                ]);
                viewModel.revealAllCursors(args.source, true);
                (0, aria_1.status)(nls.localize('removedCursor', "Removed secondary cursors"));
            }
        });
        CoreNavigationCommands.RevealLine = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'revealLine',
                    precondition: undefined,
                    metadata: RevealLine_.metadata
                });
            }
            runCoreEditorCommand(viewModel, args) {
                const revealLineArg = args;
                const lineNumberArg = revealLineArg.lineNumber || 0;
                let lineNumber = typeof lineNumberArg === 'number' ? (lineNumberArg + 1) : (parseInt(lineNumberArg) + 1);
                if (lineNumber < 1) {
                    lineNumber = 1;
                }
                const lineCount = viewModel.model.getLineCount();
                if (lineNumber > lineCount) {
                    lineNumber = lineCount;
                }
                const range = new range_1.Range(lineNumber, 1, lineNumber, viewModel.model.getLineMaxColumn(lineNumber));
                let revealAt = 0 /* VerticalRevealType.Simple */;
                if (revealLineArg.at) {
                    switch (revealLineArg.at) {
                        case RevealLine_.RawAtArgument.Top:
                            revealAt = 3 /* VerticalRevealType.Top */;
                            break;
                        case RevealLine_.RawAtArgument.Center:
                            revealAt = 1 /* VerticalRevealType.Center */;
                            break;
                        case RevealLine_.RawAtArgument.Bottom:
                            revealAt = 4 /* VerticalRevealType.Bottom */;
                            break;
                        default:
                            break;
                    }
                }
                const viewRange = viewModel.coordinatesConverter.convertModelRangeToViewRange(range);
                viewModel.revealRange(args.source, false, viewRange, revealAt, 0 /* ScrollType.Smooth */);
            }
        });
        CoreNavigationCommands.SelectAll = new class extends EditorOrNativeTextInputCommand {
            constructor() {
                super(editorExtensions_1.SelectAllCommand);
            }
            runDOMCommand(activeElement) {
                if (browser_1.isFirefox) {
                    activeElement.focus();
                    activeElement.select();
                }
                activeElement.ownerDocument.execCommand('selectAll');
            }
            runEditorCommand(accessor, editor, args) {
                const viewModel = editor._getViewModel();
                if (!viewModel) {
                    // the editor has no view => has no cursors
                    return;
                }
                this.runCoreEditorCommand(viewModel, args);
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates('keyboard', 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.selectAll(viewModel, viewModel.getPrimaryCursorState())
                ]);
            }
        }();
        CoreNavigationCommands.SetSelection = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'setSelection',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.selection) {
                    return;
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorCommon_1.CursorState.fromModelSelection(args.selection)
                ]);
            }
        });
    })(CoreNavigationCommands || (exports.CoreNavigationCommands = CoreNavigationCommands = {}));
    const columnSelectionCondition = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, editorContextKeys_1.EditorContextKeys.columnSelection);
    function registerColumnSelection(id, keybinding) {
        keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
            id: id,
            primary: keybinding,
            when: columnSelectionCondition,
            weight: CORE_WEIGHT + 1
        });
    }
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectLeft.id, 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectRight.id, 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectUp.id, 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectPageUp.id, 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectDown.id, 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectPageDown.id, 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */);
    function registerCommand(command) {
        command.register();
        return command;
    }
    var CoreEditingCommands;
    (function (CoreEditingCommands) {
        class CoreEditingCommand extends editorExtensions_1.EditorCommand {
            runEditorCommand(accessor, editor, args) {
                const viewModel = editor._getViewModel();
                if (!viewModel) {
                    // the editor has no view => has no cursors
                    return;
                }
                this.runCoreEditingCommand(editor, viewModel, args || {});
            }
        }
        CoreEditingCommands.CoreEditingCommand = CoreEditingCommand;
        CoreEditingCommands.LineBreakInsert = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'lineBreakInsert',
                    precondition: editorContextKeys_1.EditorContextKeys.writable,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 0,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 45 /* KeyCode.KeyO */ }
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.lineBreakInsert(viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection)));
            }
        });
        CoreEditingCommands.Outdent = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'outdent',
                    precondition: editorContextKeys_1.EditorContextKeys.writable,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus),
                        primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.outdent(viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection)));
                editor.pushUndoStop();
            }
        });
        CoreEditingCommands.Tab = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'tab',
                    precondition: editorContextKeys_1.EditorContextKeys.writable,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus),
                        primary: 2 /* KeyCode.Tab */
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.tab(viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection)));
                editor.pushUndoStop();
            }
        });
        CoreEditingCommands.DeleteLeft = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'deleteLeft',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 1 /* KeyCode.Backspace */,
                        secondary: [1024 /* KeyMod.Shift */ | 1 /* KeyCode.Backspace */],
                        mac: { primary: 1 /* KeyCode.Backspace */, secondary: [1024 /* KeyMod.Shift */ | 1 /* KeyCode.Backspace */, 256 /* KeyMod.WinCtrl */ | 38 /* KeyCode.KeyH */, 256 /* KeyMod.WinCtrl */ | 1 /* KeyCode.Backspace */] }
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                const [shouldPushStackElementBefore, commands] = cursorDeleteOperations_1.DeleteOperations.deleteLeft(viewModel.getPrevEditOperationType(), viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection), viewModel.getCursorAutoClosedCharacters());
                if (shouldPushStackElementBefore) {
                    editor.pushUndoStop();
                }
                editor.executeCommands(this.id, commands);
                viewModel.setPrevEditOperationType(2 /* EditOperationType.DeletingLeft */);
            }
        });
        CoreEditingCommands.DeleteRight = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'deleteRight',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 20 /* KeyCode.Delete */,
                        mac: { primary: 20 /* KeyCode.Delete */, secondary: [256 /* KeyMod.WinCtrl */ | 34 /* KeyCode.KeyD */, 256 /* KeyMod.WinCtrl */ | 20 /* KeyCode.Delete */] }
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                const [shouldPushStackElementBefore, commands] = cursorDeleteOperations_1.DeleteOperations.deleteRight(viewModel.getPrevEditOperationType(), viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection));
                if (shouldPushStackElementBefore) {
                    editor.pushUndoStop();
                }
                editor.executeCommands(this.id, commands);
                viewModel.setPrevEditOperationType(3 /* EditOperationType.DeletingRight */);
            }
        });
        CoreEditingCommands.Undo = new class extends EditorOrNativeTextInputCommand {
            constructor() {
                super(editorExtensions_1.UndoCommand);
            }
            runDOMCommand(activeElement) {
                activeElement.ownerDocument.execCommand('undo');
            }
            runEditorCommand(accessor, editor, args) {
                if (!editor.hasModel() || editor.getOption(91 /* EditorOption.readOnly */) === true) {
                    return;
                }
                return editor.getModel().undo();
            }
        }();
        CoreEditingCommands.Redo = new class extends EditorOrNativeTextInputCommand {
            constructor() {
                super(editorExtensions_1.RedoCommand);
            }
            runDOMCommand(activeElement) {
                activeElement.ownerDocument.execCommand('redo');
            }
            runEditorCommand(accessor, editor, args) {
                if (!editor.hasModel() || editor.getOption(91 /* EditorOption.readOnly */) === true) {
                    return;
                }
                return editor.getModel().redo();
            }
        }();
    })(CoreEditingCommands || (exports.CoreEditingCommands = CoreEditingCommands = {}));
    /**
     * A command that will invoke a command on the focused editor.
     */
    class EditorHandlerCommand extends editorExtensions_1.Command {
        constructor(id, handlerId, metadata) {
            super({
                id: id,
                precondition: undefined,
                metadata
            });
            this._handlerId = handlerId;
        }
        runCommand(accessor, args) {
            const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (!editor) {
                return;
            }
            editor.trigger('keyboard', this._handlerId, args);
        }
    }
    function registerOverwritableCommand(handlerId, metadata) {
        registerCommand(new EditorHandlerCommand('default:' + handlerId, handlerId));
        registerCommand(new EditorHandlerCommand(handlerId, handlerId, metadata));
    }
    registerOverwritableCommand("type" /* Handler.Type */, {
        description: `Type`,
        args: [{
                name: 'args',
                schema: {
                    'type': 'object',
                    'required': ['text'],
                    'properties': {
                        'text': {
                            'type': 'string'
                        }
                    },
                }
            }]
    });
    registerOverwritableCommand("replacePreviousChar" /* Handler.ReplacePreviousChar */);
    registerOverwritableCommand("compositionType" /* Handler.CompositionType */);
    registerOverwritableCommand("compositionStart" /* Handler.CompositionStart */);
    registerOverwritableCommand("compositionEnd" /* Handler.CompositionEnd */);
    registerOverwritableCommand("paste" /* Handler.Paste */);
    registerOverwritableCommand("cut" /* Handler.Cut */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29yZUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThCaEcsTUFBTSxXQUFXLHNDQUE4QixDQUFDO0lBRWhELE1BQXNCLGlCQUFxQixTQUFRLGdDQUFhO1FBQ3hELGdCQUFnQixDQUFDLFFBQWlDLEVBQUUsTUFBbUIsRUFBRSxJQUF3QjtZQUN2RyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQiwyQ0FBMkM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQztLQUdEO0lBWEQsOENBV0M7SUFFRCxJQUFpQixhQUFhLENBd0w3QjtJQXhMRCxXQUFpQixhQUFhO1FBRTdCLE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxHQUFRO1lBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFpQixHQUFHLENBQUM7WUFFcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUs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