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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/map", "vs/base/common/mime", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, arrays_1, errors_1, htmlContent_1, map_1, mime_1, strings_1, types_1, uri_1, uuid_1, extensions_1, files_1, remoteAuthorityResolver_1, notebookCommon_1) {
    "use strict";
    var Disposable_1, Position_1, Range_1, Selection_1, TextEdit_1, NotebookEdit_1, SnippetString_1, Location_1, SymbolInformation_1, DocumentSymbol_1, CodeActionKind_1, MarkdownString_1, TaskGroup_1, Task_1, TreeItem_1, FileSystemError_1, TestMessage_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineEditTriggerKind = exports.InlineEdit = exports.KeywordRecognitionStatus = exports.SpeechToTextStatus = exports.RelatedInformationType = exports.LanguageModelError = exports.LanguageModelChatAssistantMessage = exports.LanguageModelChatUserMessage = exports.LanguageModelChatSystemMessage = exports.ChatLocation = exports.ChatResponseTurn = exports.ChatRequestTurn = exports.ChatResponseTextEditPart = exports.ChatResponseReferencePart = exports.ChatResponseCommandButtonPart = exports.ChatResponseProgressPart = exports.ChatResponseAnchorPart = exports.ChatResponseFileTreePart = exports.ChatResponseDetectedParticipantPart = exports.ChatResponseMarkdownWithVulnerabilitiesPart = exports.ChatResponseMarkdownPart = exports.ChatResultFeedbackKind = exports.InteractiveEditorResponseFeedbackKind = exports.ChatCompletionItem = exports.ChatVariableLevel = exports.ChatCopyKind = exports.InteractiveSessionVoteDirection = exports.TextMultiDiffTabInput = exports.ChatEditorTabInput = exports.InteractiveWindowInput = exports.TerminalEditorTabInput = exports.NotebookDiffEditorTabInput = exports.NotebookEditorTabInput = exports.WebviewEditorTabInput = exports.CustomEditorTabInput = exports.TextMergeTabInput = exports.TextDiffTabInput = exports.TextTabInput = exports.TypeHierarchyItem = exports.PortAutoForwardAction = exports.WorkspaceTrustState = exports.ExternalUriOpenerPriority = exports.DeclarationCoverage = exports.BranchCoverage = exports.StatementCoverage = exports.FileCoverage = exports.TestCoverageCount = exports.TestTag = exports.TestMessage = exports.TestRunRequest = exports.TestRunProfileKind = exports.TestResultState = exports.PortAttributes = exports.LinkedEditingRanges = exports.StandardTokenType = exports.ExtensionRuntime = exports.ExtensionMode = exports.TimelineItem = exports.NotebookVariablesRequestKind = exports.NotebookKernelSourceAction = exports.NotebookRendererScript = exports.NotebookControllerAffinity2 = exports.NotebookControllerAffinity = exports.NotebookCellStatusBarItem = exports.NotebookEditorRevealType = exports.NotebookCellStatusBarAlignment = exports.NotebookCellExecutionState = exports.NotebookCellKind = exports.NotebookCellOutput = exports.NotebookCellOutputItem = exports.NotebookData = exports.NotebookCellData = exports.NotebookRange = exports.ColorThemeKind = exports.ColorTheme = exports.FileDecoration = exports.ExtensionKind = exports.InputBoxValidationSeverity = exports.QuickPickItemKind = exports.QuickInputButtons = exports.DebugVisualization = exports.DebugConsoleMode = exports.SemanticTokensEdits = exports.SemanticTokensEdit = exports.SemanticTokens = exports.SemanticTokensBuilder = exports.SemanticTokensLegend = exports.CommentThreadApplicability = exports.CommentThreadState = exports.CommentState = exports.CommentMode = exports.CommentThreadCollapsibleState = exports.FoldingRangeKind = exports.FoldingRange = exports.FileSystemError = exports.FileChangeType = exports.NewSymbolName = exports.NewSymbolNameTriggerKind = exports.NewSymbolNameTag = exports.InlineValueContext = exports.InlineValueEvaluatableExpression = exports.InlineValueVariableLookup = exports.InlineValueText = exports.InlineCompletionTriggerKind = exports.EvaluatableExpression = exports.DebugThread = exports.DebugStackFrame = exports.DebugAdapterInlineImplementation = exports.DebugAdapterNamedPipeServer = exports.DebugAdapterServer = exports.DebugAdapterExecutable = exports.DataBreakpoint = exports.FunctionBreakpoint = exports.SourceBreakpoint = exports.Breakpoint = exports.RelativePattern = exports.ConfigurationTarget = exports.ThemeColor = exports.ThemeIcon = exports.DocumentPasteEdit = exports.DocumentDropOrPasteEditKind = exports.DocumentPasteTriggerKind = exports.DocumentDropEdit = exports.DataTransfer = exports.DataTransferFile = exports.InternalFileDataTransferItem = exports.InternalDataTransferItem = exports.DataTransferItem = exports.TreeItemCheckboxState = exports.TreeItemCollapsibleState = exports.TreeItem = exports.ViewBadge = exports.ProgressLocation = exports.Task = exports.CustomExecution = exports.TaskScope = exports.ShellQuoting = exports.ShellExecution = exports.ProcessExecution = exports.TaskGroup = exports.TaskPanelKind = exports.TaskRevealKind = exports.TerminalProfile = exports.TerminalLocation = exports.TerminalQuickFixCommand = exports.TerminalQuickFixOpener = exports.TerminalLink = exports.TerminalShellExecutionCommandLineConfidence = exports.TerminalExitReason = exports.SourceControlInputBoxValidationType = exports.ColorFormat = exports.ColorPresentation = exports.ColorInformation = exports.Color = exports.DocumentLink = exports.SyntaxTokenType = exports.DecorationRangeBehavior = exports.TextDocumentChangeReason = exports.TextEditorSelectionChangeKind = exports.TextEditorRevealType = exports.TextDocumentSaveReason = exports.TextEditorLineNumbersStyle = exports.StatusBarAlignment = exports.ViewColumn = exports.PartialAcceptTriggerKind = exports.InlineSuggestionList = exports.InlineSuggestion = exports.CompletionList = exports.CompletionItem = exports.CompletionItemTag = exports.CompletionItemKind = exports.CompletionTriggerKind = exports.InlayHint = exports.InlayHintLabelPart = exports.InlayHintKind = exports.SignatureHelpTriggerKind = exports.SignatureHelp = exports.SignatureInformation = exports.ParameterInformation = exports.MarkdownString = exports.CodeLens = exports.LanguageStatusSeverity = exports.CallHierarchyOutgoingCall = exports.CallHierarchyIncomingCall = exports.CallHierarchyItem = exports.SelectionRange = exports.CodeActionKind = exports.CodeAction = exports.CodeActionTriggerKind = exports.DocumentSymbol = exports.SymbolInformation = exports.SymbolTag = exports.SymbolKind = exports.MultiDocumentHighlight = exports.DocumentHighlight = exports.DocumentHighlightKind = exports.HoverVerbosityAction = exports.VerboseHover = exports.Hover = exports.Diagnostic = exports.DiagnosticRelatedInformation = exports.Location = exports.DiagnosticSeverity = exports.DiagnosticTag = exports.SnippetString = exports.WorkspaceEdit = exports.FileEditType = exports.SnippetTextEdit = exports.NotebookEdit = exports.TextEdit = exports.EnvironmentVariableMutatorType = exports.EndOfLine = exports.RemoteAuthorityResolverError = exports.ManagedResolvedAuthority = exports.ResolvedAuthority = exports.Selection = exports.Range = exports.Position = exports.Disposable = exports.TerminalQuickFixType = exports.TerminalOutputAnchor = void 0;
    exports.asStatusBarItemIdentifier = asStatusBarItemIdentifier;
    exports.setBreakpointId = setBreakpointId;
    exports.validateTestCoverageCount = validateTestCoverageCount;
    /**
     * @deprecated
     *
     * This utility ensures that old JS code that uses functions for classes still works. Existing usages cannot be removed
     * but new ones must not be added
     * */
    function es5ClassCompat(target) {
        const interceptFunctions = {
            apply: function (...args) {
                if (args.length === 0) {
                    return Reflect.construct(target, []);
                }
                else {
                    const argsList = args.length === 1 ? [] : args[1];
                    return Reflect.construct(target, argsList, args[0].constructor);
                }
            },
            call: function (...args) {
                if (args.length === 0) {
                    return Reflect.construct(target, []);
                }
                else {
                    const [thisArg, ...restArgs] = args;
                    return Reflect.construct(target, restArgs, thisArg.constructor);
                }
            }
        };
        return Object.assign(target, interceptFunctions);
    }
    var TerminalOutputAnchor;
    (function (TerminalOutputAnchor) {
        TerminalOutputAnchor[TerminalOutputAnchor["Top"] = 0] = "Top";
        TerminalOutputAnchor[TerminalOutputAnchor["Bottom"] = 1] = "Bottom";
    })(TerminalOutputAnchor || (exports.TerminalOutputAnchor = TerminalOutputAnchor = {}));
    var TerminalQuickFixType;
    (function (TerminalQuickFixType) {
        TerminalQuickFixType[TerminalQuickFixType["TerminalCommand"] = 0] = "TerminalCommand";
        TerminalQuickFixType[TerminalQuickFixType["Opener"] = 1] = "Opener";
        TerminalQuickFixType[TerminalQuickFixType["Command"] = 3] = "Command";
    })(TerminalQuickFixType || (exports.TerminalQuickFixType = TerminalQuickFixType = {}));
    let Disposable = Disposable_1 = class Disposable {
        static from(...inDisposables) {
            let disposables = inDisposables;
            return new Disposable_1(function () {
                if (disposables) {
                    for (const disposable of disposables) {
                        if (disposable && typeof disposable.dispose === 'function') {
                            disposable.dispose();
                        }
                    }
                    disposables = undefined;
                }
            });
        }
        #callOnDispose;
        constructor(callOnDispose) {
            this.#callOnDispose = callOnDispose;
        }
        dispose() {
            if (typeof this.#callOnDispose === 'function') {
                this.#callOnDispose();
                this.#callOnDispose = undefined;
            }
        }
    };
    exports.Disposable = Disposable;
    exports.Disposable = Disposable = Disposable_1 = __decorate([
        es5ClassCompat
    ], Disposable);
    let Position = Position_1 = class Position {
        static Min(...positions) {
            if (positions.length === 0) {
                throw new TypeError();
            }
            let result = positions[0];
            for (let i = 1; i < positions.length; i++) {
                const p = positions[i];
                if (p.isBefore(result)) {
                    result = p;
                }
            }
            return result;
        }
        static Max(...positions) {
            if (positions.length === 0) {
                throw new TypeError();
            }
            let result = positions[0];
            for (let i = 1; i < positions.length; i++) {
                const p = positions[i];
                if (p.isAfter(result)) {
                    result = p;
                }
            }
            return result;
        }
        static isPosition(other) {
            if (!other) {
                return false;
            }
            if (other instanceof Position_1) {
                return true;
            }
            const { line, character } = other;
            if (typeof line === 'number' && typeof character === 'number') {
                return true;
            }
            return false;
        }
        static of(obj) {
            if (obj instanceof Position_1) {
                return obj;
            }
            else if (this.isPosition(obj)) {
                return new Position_1(obj.line, obj.character);
            }
            throw new Error('Invalid argument, is NOT a position-like object');
        }
        get line() {
            return this._line;
        }
        get character() {
            return this._character;
        }
        constructor(line, character) {
            if (line < 0) {
                throw (0, errors_1.illegalArgument)('line must be non-negative');
            }
            if (character < 0) {
                throw (0, errors_1.illegalArgument)('character must be non-negative');
            }
            this._line = line;
            this._character = character;
        }
        isBefore(other) {
            if (this._line < other._line) {
                return true;
            }
            if (other._line < this._line) {
                return false;
            }
            return this._character < other._character;
        }
        isBeforeOrEqual(other) {
            if (this._line < other._line) {
                return true;
            }
            if (other._line < this._line) {
                return false;
            }
            return this._character <= other._character;
        }
        isAfter(other) {
            return !this.isBeforeOrEqual(other);
        }
        isAfterOrEqual(other) {
            return !this.isBefore(other);
        }
        isEqual(other) {
            return this._line === other._line && this._character === other._character;
        }
        compareTo(other) {
            if (this._line < other._line) {
                return -1;
            }
            else if (this._line > other.line) {
                return 1;
            }
            else {
                // equal line
                if (this._character < other._character) {
                    return -1;
                }
                else if (this._character > other._character) {
                    return 1;
                }
                else {
                    // equal line and character
                    return 0;
                }
            }
        }
        translate(lineDeltaOrChange, characterDelta = 0) {
            if (lineDeltaOrChange === null || characterDelta === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let lineDelta;
            if (typeof lineDeltaOrChange === 'undefined') {
                lineDelta = 0;
            }
            else if (typeof lineDeltaOrChange === 'number') {
                lineDelta = lineDeltaOrChange;
            }
            else {
                lineDelta = typeof lineDeltaOrChange.lineDelta === 'number' ? lineDeltaOrChange.lineDelta : 0;
                characterDelta = typeof lineDeltaOrChange.characterDelta === 'number' ? lineDeltaOrChange.characterDelta : 0;
            }
            if (lineDelta === 0 && characterDelta === 0) {
                return this;
            }
            return new Position_1(this.line + lineDelta, this.character + characterDelta);
        }
        with(lineOrChange, character = this.character) {
            if (lineOrChange === null || character === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let line;
            if (typeof lineOrChange === 'undefined') {
                line = this.line;
            }
            else if (typeof lineOrChange === 'number') {
                line = lineOrChange;
            }
            else {
                line = typeof lineOrChange.line === 'number' ? lineOrChange.line : this.line;
                character = typeof lineOrChange.character === 'number' ? lineOrChange.character : this.character;
            }
            if (line === this.line && character === this.character) {
                return this;
            }
            return new Position_1(line, character);
        }
        toJSON() {
            return { line: this.line, character: this.character };
        }
    };
    exports.Position = Position;
    exports.Position = Position = Position_1 = __decorate([
        es5ClassCompat
    ], Position);
    let Range = Range_1 = class Range {
        static isRange(thing) {
            if (thing instanceof Range_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Position.isPosition(thing.start)
                && Position.isPosition(thing.end);
        }
        static of(obj) {
            if (obj instanceof Range_1) {
                return obj;
            }
            if (this.isRange(obj)) {
                return new Range_1(obj.start, obj.end);
            }
            throw new Error('Invalid argument, is NOT a range-like object');
        }
        get start() {
            return this._start;
        }
        get end() {
            return this._end;
        }
        constructor(startLineOrStart, startColumnOrEnd, endLine, endColumn) {
            let start;
            let end;
            if (typeof startLineOrStart === 'number' && typeof startColumnOrEnd === 'number' && typeof endLine === 'number' && typeof endColumn === 'number') {
                start = new Position(startLineOrStart, startColumnOrEnd);
                end = new Position(endLine, endColumn);
            }
            else if (Position.isPosition(startLineOrStart) && Position.isPosition(startColumnOrEnd)) {
                start = Position.of(startLineOrStart);
                end = Position.of(startColumnOrEnd);
            }
            if (!start || !end) {
                throw new Error('Invalid arguments');
            }
            if (start.isBefore(end)) {
                this._start = start;
                this._end = end;
            }
            else {
                this._start = end;
                this._end = start;
            }
        }
        contains(positionOrRange) {
            if (Range_1.isRange(positionOrRange)) {
                return this.contains(positionOrRange.start)
                    && this.contains(positionOrRange.end);
            }
            else if (Position.isPosition(positionOrRange)) {
                if (Position.of(positionOrRange).isBefore(this._start)) {
                    return false;
                }
                if (this._end.isBefore(positionOrRange)) {
                    return false;
                }
                return true;
            }
            return false;
        }
        isEqual(other) {
            return this._start.isEqual(other._start) && this._end.isEqual(other._end);
        }
        intersection(other) {
            const start = Position.Max(other.start, this._start);
            const end = Position.Min(other.end, this._end);
            if (start.isAfter(end)) {
                // this happens when there is no overlap:
                // |-----|
                //          |----|
                return undefined;
            }
            return new Range_1(start, end);
        }
        union(other) {
            if (this.contains(other)) {
                return this;
            }
            else if (other.contains(this)) {
                return other;
            }
            const start = Position.Min(other.start, this._start);
            const end = Position.Max(other.end, this.end);
            return new Range_1(start, end);
        }
        get isEmpty() {
            return this._start.isEqual(this._end);
        }
        get isSingleLine() {
            return this._start.line === this._end.line;
        }
        with(startOrChange, end = this.end) {
            if (startOrChange === null || end === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let start;
            if (!startOrChange) {
                start = this.start;
            }
            else if (Position.isPosition(startOrChange)) {
                start = startOrChange;
            }
            else {
                start = startOrChange.start || this.start;
                end = startOrChange.end || this.end;
            }
            if (start.isEqual(this._start) && end.isEqual(this.end)) {
                return this;
            }
            return new Range_1(start, end);
        }
        toJSON() {
            return [this.start, this.end];
        }
    };
    exports.Range = Range;
    exports.Range = Range = Range_1 = __decorate([
        es5ClassCompat
    ], Range);
    let Selection = Selection_1 = class Selection extends Range {
        static isSelection(thing) {
            if (thing instanceof Selection_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing)
                && Position.isPosition(thing.anchor)
                && Position.isPosition(thing.active)
                && typeof thing.isReversed === 'boolean';
        }
        get anchor() {
            return this._anchor;
        }
        get active() {
            return this._active;
        }
        constructor(anchorLineOrAnchor, anchorColumnOrActive, activeLine, activeColumn) {
            let anchor;
            let active;
            if (typeof anchorLineOrAnchor === 'number' && typeof anchorColumnOrActive === 'number' && typeof activeLine === 'number' && typeof activeColumn === 'number') {
                anchor = new Position(anchorLineOrAnchor, anchorColumnOrActive);
                active = new Position(activeLine, activeColumn);
            }
            else if (Position.isPosition(anchorLineOrAnchor) && Position.isPosition(anchorColumnOrActive)) {
                anchor = Position.of(anchorLineOrAnchor);
                active = Position.of(anchorColumnOrActive);
            }
            if (!anchor || !active) {
                throw new Error('Invalid arguments');
            }
            super(anchor, active);
            this._anchor = anchor;
            this._active = active;
        }
        get isReversed() {
            return this._anchor === this._end;
        }
        toJSON() {
            return {
                start: this.start,
                end: this.end,
                active: this.active,
                anchor: this.anchor
            };
        }
    };
    exports.Selection = Selection;
    exports.Selection = Selection = Selection_1 = __decorate([
        es5ClassCompat
    ], Selection);
    const validateConnectionToken = (connectionToken) => {
        if (typeof connectionToken !== 'string' || connectionToken.length === 0 || !/^[0-9A-Za-z_\-]+$/.test(connectionToken)) {
            throw (0, errors_1.illegalArgument)('connectionToken');
        }
    };
    class ResolvedAuthority {
        static isResolvedAuthority(resolvedAuthority) {
            return resolvedAuthority
                && typeof resolvedAuthority === 'object'
                && typeof resolvedAuthority.host === 'string'
                && typeof resolvedAuthority.port === 'number'
                && (resolvedAuthority.connectionToken === undefined || typeof resolvedAuthority.connectionToken === 'string');
        }
        constructor(host, port, connectionToken) {
            if (typeof host !== 'string' || host.length === 0) {
                throw (0, errors_1.illegalArgument)('host');
            }
            if (typeof port !== 'number' || port === 0 || Math.round(port) !== port) {
                throw (0, errors_1.illegalArgument)('port');
            }
            if (typeof connectionToken !== 'undefined') {
                validateConnectionToken(connectionToken);
            }
            this.host = host;
            this.port = Math.round(port);
            this.connectionToken = connectionToken;
        }
    }
    exports.ResolvedAuthority = ResolvedAuthority;
    class ManagedResolvedAuthority {
        static isManagedResolvedAuthority(resolvedAuthority) {
            return resolvedAuthority
                && typeof resolvedAuthority === 'object'
                && typeof resolvedAuthority.makeConnection === 'function'
                && (resolvedAuthority.connectionToken === undefined || typeof resolvedAuthority.connectionToken === 'string');
        }
        constructor(makeConnection, connectionToken) {
            this.makeConnection = makeConnection;
            this.connectionToken = connectionToken;
            if (typeof connectionToken !== 'undefined') {
                validateConnectionToken(connectionToken);
            }
        }
    }
    exports.ManagedResolvedAuthority = ManagedResolvedAuthority;
    class RemoteAuthorityResolverError extends Error {
        static NotAvailable(message, handled) {
            return new RemoteAuthorityResolverError(message, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NotAvailable, handled);
        }
        static TemporarilyNotAvailable(message) {
            return new RemoteAuthorityResolverError(message, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable);
        }
        constructor(message, code = remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown, detail) {
            super(message);
            this._message = message;
            this._code = code;
            this._detail = detail;
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, RemoteAuthorityResolverError.prototype);
        }
    }
    exports.RemoteAuthorityResolverError = RemoteAuthorityResolverError;
    var EndOfLine;
    (function (EndOfLine) {
        EndOfLine[EndOfLine["LF"] = 1] = "LF";
        EndOfLine[EndOfLine["CRLF"] = 2] = "CRLF";
    })(EndOfLine || (exports.EndOfLine = EndOfLine = {}));
    var EnvironmentVariableMutatorType;
    (function (EnvironmentVariableMutatorType) {
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Replace"] = 1] = "Replace";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Append"] = 2] = "Append";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Prepend"] = 3] = "Prepend";
    })(EnvironmentVariableMutatorType || (exports.EnvironmentVariableMutatorType = EnvironmentVariableMutatorType = {}));
    let TextEdit = TextEdit_1 = class TextEdit {
        static isTextEdit(thing) {
            if (thing instanceof TextEdit_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing)
                && typeof thing.newText === 'string';
        }
        static replace(range, newText) {
            return new TextEdit_1(range, newText);
        }
        static insert(position, newText) {
            return TextEdit_1.replace(new Range(position, position), newText);
        }
        static delete(range) {
            return TextEdit_1.replace(range, '');
        }
        static setEndOfLine(eol) {
            const ret = new TextEdit_1(new Range(new Position(0, 0), new Position(0, 0)), '');
            ret.newEol = eol;
            return ret;
        }
        get range() {
            return this._range;
        }
        set range(value) {
            if (value && !Range.isRange(value)) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this._range = value;
        }
        get newText() {
            return this._newText || '';
        }
        set newText(value) {
            if (value && typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('newText');
            }
            this._newText = value;
        }
        get newEol() {
            return this._newEol;
        }
        set newEol(value) {
            if (value && typeof value !== 'number') {
                throw (0, errors_1.illegalArgument)('newEol');
            }
            this._newEol = value;
        }
        constructor(range, newText) {
            this._range = range;
            this._newText = newText;
        }
        toJSON() {
            return {
                range: this.range,
                newText: this.newText,
                newEol: this._newEol
            };
        }
    };
    exports.TextEdit = TextEdit;
    exports.TextEdit = TextEdit = TextEdit_1 = __decorate([
        es5ClassCompat
    ], TextEdit);
    let NotebookEdit = NotebookEdit_1 = class NotebookEdit {
        static isNotebookCellEdit(thing) {
            if (thing instanceof NotebookEdit_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return NotebookRange.isNotebookRange(thing)
                && Array.isArray(thing.newCells);
        }
        static replaceCells(range, newCells) {
            return new NotebookEdit_1(range, newCells);
        }
        static insertCells(index, newCells) {
            return new NotebookEdit_1(new NotebookRange(index, index), newCells);
        }
        static deleteCells(range) {
            return new NotebookEdit_1(range, []);
        }
        static updateCellMetadata(index, newMetadata) {
            const edit = new NotebookEdit_1(new NotebookRange(index, index), []);
            edit.newCellMetadata = newMetadata;
            return edit;
        }
        static updateNotebookMetadata(newMetadata) {
            const edit = new NotebookEdit_1(new NotebookRange(0, 0), []);
            edit.newNotebookMetadata = newMetadata;
            return edit;
        }
        constructor(range, newCells) {
            this.range = range;
            this.newCells = newCells;
        }
    };
    exports.NotebookEdit = NotebookEdit;
    exports.NotebookEdit = NotebookEdit = NotebookEdit_1 = __decorate([
        es5ClassCompat
    ], NotebookEdit);
    class SnippetTextEdit {
        static isSnippetTextEdit(thing) {
            if (thing instanceof SnippetTextEdit) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing.range)
                && SnippetString.isSnippetString(thing.snippet);
        }
        static replace(range, snippet) {
            return new SnippetTextEdit(range, snippet);
        }
        static insert(position, snippet) {
            return SnippetTextEdit.replace(new Range(position, position), snippet);
        }
        constructor(range, snippet) {
            this.range = range;
            this.snippet = snippet;
        }
    }
    exports.SnippetTextEdit = SnippetTextEdit;
    var FileEditType;
    (function (FileEditType) {
        FileEditType[FileEditType["File"] = 1] = "File";
        FileEditType[FileEditType["Text"] = 2] = "Text";
        FileEditType[FileEditType["Cell"] = 3] = "Cell";
        FileEditType[FileEditType["CellReplace"] = 5] = "CellReplace";
        FileEditType[FileEditType["Snippet"] = 6] = "Snippet";
    })(FileEditType || (exports.FileEditType = FileEditType = {}));
    let WorkspaceEdit = class WorkspaceEdit {
        constructor() {
            this._edits = [];
        }
        _allEntries() {
            return this._edits;
        }
        // --- file
        renameFile(from, to, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from, to, options, metadata });
        }
        createFile(uri, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from: undefined, to: uri, options, metadata });
        }
        deleteFile(uri, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from: uri, to: undefined, options, metadata });
        }
        // --- notebook
        replaceNotebookMetadata(uri, value, metadata) {
            this._edits.push({ _type: 3 /* FileEditType.Cell */, metadata, uri, edit: { editType: 5 /* CellEditType.DocumentMetadata */, metadata: value }, notebookMetadata: value });
        }
        replaceNotebookCells(uri, startOrRange, cellData, metadata) {
            const start = startOrRange.start;
            const end = startOrRange.end;
            if (start !== end || cellData.length > 0) {
                this._edits.push({ _type: 5 /* FileEditType.CellReplace */, uri, index: start, count: end - start, cells: cellData, metadata });
            }
        }
        replaceNotebookCellMetadata(uri, index, cellMetadata, metadata) {
            this._edits.push({ _type: 3 /* FileEditType.Cell */, metadata, uri, edit: { editType: 3 /* CellEditType.Metadata */, index, metadata: cellMetadata } });
        }
        // --- text
        replace(uri, range, newText, metadata) {
            this._edits.push({ _type: 2 /* FileEditType.Text */, uri, edit: new TextEdit(range, newText), metadata });
        }
        insert(resource, position, newText, metadata) {
            this.replace(resource, new Range(position, position), newText, metadata);
        }
        delete(resource, range, metadata) {
            this.replace(resource, range, '', metadata);
        }
        // --- text (Maplike)
        has(uri) {
            return this._edits.some(edit => edit._type === 2 /* FileEditType.Text */ && edit.uri.toString() === uri.toString());
        }
        set(uri, edits) {
            if (!edits) {
                // remove all text, snippet, or notebook edits for `uri`
                for (let i = 0; i < this._edits.length; i++) {
                    const element = this._edits[i];
                    switch (element._type) {
                        case 2 /* FileEditType.Text */:
                        case 6 /* FileEditType.Snippet */:
                        case 3 /* FileEditType.Cell */:
                        case 5 /* FileEditType.CellReplace */:
                            if (element.uri.toString() === uri.toString()) {
                                this._edits[i] = undefined; // will be coalesced down below
                            }
                            break;
                    }
                }
                (0, arrays_1.coalesceInPlace)(this._edits);
            }
            else {
                // append edit to the end
                for (const editOrTuple of edits) {
                    if (!editOrTuple) {
                        continue;
                    }
                    let edit;
                    let metadata;
                    if (Array.isArray(editOrTuple)) {
                        edit = editOrTuple[0];
                        metadata = editOrTuple[1];
                    }
                    else {
                        edit = editOrTuple;
                    }
                    if (NotebookEdit.isNotebookCellEdit(edit)) {
                        if (edit.newCellMetadata) {
                            this.replaceNotebookCellMetadata(uri, edit.range.start, edit.newCellMetadata, metadata);
                        }
                        else if (edit.newNotebookMetadata) {
                            this.replaceNotebookMetadata(uri, edit.newNotebookMetadata, metadata);
                        }
                        else {
                            this.replaceNotebookCells(uri, edit.range, edit.newCells, metadata);
                        }
                    }
                    else if (SnippetTextEdit.isSnippetTextEdit(edit)) {
                        this._edits.push({ _type: 6 /* FileEditType.Snippet */, uri, range: edit.range, edit: edit.snippet, metadata });
                    }
                    else {
                        this._edits.push({ _type: 2 /* FileEditType.Text */, uri, edit, metadata });
                    }
                }
            }
        }
        get(uri) {
            const res = [];
            for (const candidate of this._edits) {
                if (candidate._type === 2 /* FileEditType.Text */ && candidate.uri.toString() === uri.toString()) {
                    res.push(candidate.edit);
                }
            }
            return res;
        }
        entries() {
            const textEdits = new map_1.ResourceMap();
            for (const candidate of this._edits) {
                if (candidate._type === 2 /* FileEditType.Text */) {
                    let textEdit = textEdits.get(candidate.uri);
                    if (!textEdit) {
                        textEdit = [candidate.uri, []];
                        textEdits.set(candidate.uri, textEdit);
                    }
                    textEdit[1].push(candidate.edit);
                }
            }
            return [...textEdits.values()];
        }
        get size() {
            return this.entries().length;
        }
        toJSON() {
            return this.entries();
        }
    };
    exports.WorkspaceEdit = WorkspaceEdit;
    exports.WorkspaceEdit = WorkspaceEdit = __decorate([
        es5ClassCompat
    ], WorkspaceEdit);
    let SnippetString = SnippetString_1 = class SnippetString {
        static isSnippetString(thing) {
            if (thing instanceof SnippetString_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.value === 'string';
        }
        static _escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        constructor(value) {
            this._tabstop = 1;
            this.value = value || '';
        }
        appendText(string) {
            this.value += SnippetString_1._escape(string);
            return this;
        }
        appendTabstop(number = this._tabstop++) {
            this.value += '$';
            this.value += number;
            return this;
        }
        appendPlaceholder(value, number = this._tabstop++) {
            if (typeof value === 'function') {
                const nested = new SnippetString_1();
                nested._tabstop = this._tabstop;
                value(nested);
                this._tabstop = nested._tabstop;
                value = nested.value;
            }
            else {
                value = SnippetString_1._escape(value);
            }
            this.value += '${';
            this.value += number;
            this.value += ':';
            this.value += value;
            this.value += '}';
            return this;
        }
        appendChoice(values, number = this._tabstop++) {
            const value = values.map(s => s.replaceAll(/[|\\,]/g, '\\$&')).join(',');
            this.value += '${';
            this.value += number;
            this.value += '|';
            this.value += value;
            this.value += '|}';
            return this;
        }
        appendVariable(name, defaultValue) {
            if (typeof defaultValue === 'function') {
                const nested = new SnippetString_1();
                nested._tabstop = this._tabstop;
                defaultValue(nested);
                this._tabstop = nested._tabstop;
                defaultValue = nested.value;
            }
            else if (typeof defaultValue === 'string') {
                defaultValue = defaultValue.replace(/\$|}/g, '\\$&'); // CodeQL [SM02383] I do not want to escape backslashes here
            }
            this.value += '${';
            this.value += name;
            if (defaultValue) {
                this.value += ':';
                this.value += defaultValue;
            }
            this.value += '}';
            return this;
        }
    };
    exports.SnippetString = SnippetString;
    exports.SnippetString = SnippetString = SnippetString_1 = __decorate([
        es5ClassCompat
    ], SnippetString);
    var DiagnosticTag;
    (function (DiagnosticTag) {
        DiagnosticTag[DiagnosticTag["Unnecessary"] = 1] = "Unnecessary";
        DiagnosticTag[DiagnosticTag["Deprecated"] = 2] = "Deprecated";
    })(DiagnosticTag || (exports.DiagnosticTag = DiagnosticTag = {}));
    var DiagnosticSeverity;
    (function (DiagnosticSeverity) {
        DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
        DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
        DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
        DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    })(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
    let Location = Location_1 = class Location {
        static isLocation(thing) {
            if (thing instanceof Location_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing.range)
                && uri_1.URI.isUri(thing.uri);
        }
        constructor(uri, rangeOrPosition) {
            this.uri = uri;
            if (!rangeOrPosition) {
                //that's OK
            }
            else if (Range.isRange(rangeOrPosition)) {
                this.range = Range.of(rangeOrPosition);
            }
            else if (Position.isPosition(rangeOrPosition)) {
                this.range = new Range(rangeOrPosition, rangeOrPosition);
            }
            else {
                throw new Error('Illegal argument');
            }
        }
        toJSON() {
            return {
                uri: this.uri,
                range: this.range
            };
        }
    };
    exports.Location = Location;
    exports.Location = Location = Location_1 = __decorate([
        es5ClassCompat
    ], Location);
    let DiagnosticRelatedInformation = class DiagnosticRelatedInformation {
        static is(thing) {
            if (!thing) {
                return false;
            }
            return typeof thing.message === 'string'
                && thing.location
                && Range.isRange(thing.location.range)
                && uri_1.URI.isUri(thing.location.uri);
        }
        constructor(location, message) {
            this.location = location;
            this.message = message;
        }
        static isEqual(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.message === b.message
                && a.location.range.isEqual(b.location.range)
                && a.location.uri.toString() === b.location.uri.toString();
        }
    };
    exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation;
    exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation = __decorate([
        es5ClassCompat
    ], DiagnosticRelatedInformation);
    let Diagnostic = class Diagnostic {
        constructor(range, message, severity = DiagnosticSeverity.Error) {
            if (!Range.isRange(range)) {
                throw new TypeError('range must be set');
            }
            if (!message) {
                throw new TypeError('message must be set');
            }
            this.range = range;
            this.message = message;
            this.severity = severity;
        }
        toJSON() {
            return {
                severity: DiagnosticSeverity[this.severity],
                message: this.message,
                range: this.range,
                source: this.source,
                code: this.code,
            };
        }
        static isEqual(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.message === b.message
                && a.severity === b.severity
                && a.code === b.code
                && a.severity === b.severity
                && a.source === b.source
                && a.range.isEqual(b.range)
                && (0, arrays_1.equals)(a.tags, b.tags)
                && (0, arrays_1.equals)(a.relatedInformation, b.relatedInformation, DiagnosticRelatedInformation.isEqual);
        }
    };
    exports.Diagnostic = Diagnostic;
    exports.Diagnostic = Diagnostic = __decorate([
        es5ClassCompat
    ], Diagnostic);
    let Hover = class Hover {
        constructor(contents, range) {
            if (!contents) {
                throw new Error('Illegal argument, contents must be defined');
            }
            if (Array.isArray(contents)) {
                this.contents = contents;
            }
            else {
                this.contents = [contents];
            }
            this.range = range;
        }
    };
    exports.Hover = Hover;
    exports.Hover = Hover = __decorate([
        es5ClassCompat
    ], Hover);
    let VerboseHover = class VerboseHover extends Hover {
        constructor(contents, range, canIncreaseHover, canDecreaseHover) {
            super(contents, range);
            this.canIncreaseHover = canIncreaseHover;
            this.canDecreaseHover = canDecreaseHover;
        }
    };
    exports.VerboseHover = VerboseHover;
    exports.VerboseHover = VerboseHover = __decorate([
        es5ClassCompat
    ], VerboseHover);
    var HoverVerbosityAction;
    (function (HoverVerbosityAction) {
        HoverVerbosityAction[HoverVerbosityAction["Increase"] = 0] = "Increase";
        HoverVerbosityAction[HoverVerbosityAction["Decrease"] = 1] = "Decrease";
    })(HoverVerbosityAction || (exports.HoverVerbosityAction = HoverVerbosityAction = {}));
    var DocumentHighlightKind;
    (function (DocumentHighlightKind) {
        DocumentHighlightKind[DocumentHighlightKind["Text"] = 0] = "Text";
        DocumentHighlightKind[DocumentHighlightKind["Read"] = 1] = "Read";
        DocumentHighlightKind[DocumentHighlightKind["Write"] = 2] = "Write";
    })(DocumentHighlightKind || (exports.DocumentHighlightKind = DocumentHighlightKind = {}));
    let DocumentHighlight = class DocumentHighlight {
        constructor(range, kind = DocumentHighlightKind.Text) {
            this.range = range;
            this.kind = kind;
        }
        toJSON() {
            return {
                range: this.range,
                kind: DocumentHighlightKind[this.kind]
            };
        }
    };
    exports.DocumentHighlight = DocumentHighlight;
    exports.DocumentHighlight = DocumentHighlight = __decorate([
        es5ClassCompat
    ], DocumentHighlight);
    let MultiDocumentHighlight = class MultiDocumentHighlight {
        constructor(uri, highlights) {
            this.uri = uri;
            this.highlights = highlights;
        }
        toJSON() {
            return {
                uri: this.uri,
                highlights: this.highlights.map(h => h.toJSON())
            };
        }
    };
    exports.MultiDocumentHighlight = MultiDocumentHighlight;
    exports.MultiDocumentHighlight = MultiDocumentHighlight = __decorate([
        es5ClassCompat
    ], MultiDocumentHighlight);
    var SymbolKind;
    (function (SymbolKind) {
        SymbolKind[SymbolKind["File"] = 0] = "File";
        SymbolKind[SymbolKind["Module"] = 1] = "Module";
        SymbolKind[SymbolKind["Namespace"] = 2] = "Namespace";
        SymbolKind[SymbolKind["Package"] = 3] = "Package";
        SymbolKind[SymbolKind["Class"] = 4] = "Class";
        SymbolKind[SymbolKind["Method"] = 5] = "Method";
        SymbolKind[SymbolKind["Property"] = 6] = "Property";
        SymbolKind[SymbolKind["Field"] = 7] = "Field";
        SymbolKind[SymbolKind["Constructor"] = 8] = "Constructor";
        SymbolKind[SymbolKind["Enum"] = 9] = "Enum";
        SymbolKind[SymbolKind["Interface"] = 10] = "Interface";
        SymbolKind[SymbolKind["Function"] = 11] = "Function";
        SymbolKind[SymbolKind["Variable"] = 12] = "Variable";
        SymbolKind[SymbolKind["Constant"] = 13] = "Constant";
        SymbolKind[SymbolKind["String"] = 14] = "String";
        SymbolKind[SymbolKind["Number"] = 15] = "Number";
        SymbolKind[SymbolKind["Boolean"] = 16] = "Boolean";
        SymbolKind[SymbolKind["Array"] = 17] = "Array";
        SymbolKind[SymbolKind["Object"] = 18] = "Object";
        SymbolKind[SymbolKind["Key"] = 19] = "Key";
        SymbolKind[SymbolKind["Null"] = 20] = "Null";
        SymbolKind[SymbolKind["EnumMember"] = 21] = "EnumMember";
        SymbolKind[SymbolKind["Struct"] = 22] = "Struct";
        SymbolKind[SymbolKind["Event"] = 23] = "Event";
        SymbolKind[SymbolKind["Operator"] = 24] = "Operator";
        SymbolKind[SymbolKind["TypeParameter"] = 25] = "TypeParameter";
    })(SymbolKind || (exports.SymbolKind = SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        SymbolTag[SymbolTag["Deprecated"] = 1] = "Deprecated";
    })(SymbolTag || (exports.SymbolTag = SymbolTag = {}));
    let SymbolInformation = SymbolInformation_1 = class SymbolInformation {
        static validate(candidate) {
            if (!candidate.name) {
                throw new Error('name must not be falsy');
            }
        }
        constructor(name, kind, rangeOrContainer, locationOrUri, containerName) {
            this.name = name;
            this.kind = kind;
            this.containerName = containerName;
            if (typeof rangeOrContainer === 'string') {
                this.containerName = rangeOrContainer;
            }
            if (locationOrUri instanceof Location) {
                this.location = locationOrUri;
            }
            else if (rangeOrContainer instanceof Range) {
                this.location = new Location(locationOrUri, rangeOrContainer);
            }
            SymbolInformation_1.validate(this);
        }
        toJSON() {
            return {
                name: this.name,
                kind: SymbolKind[this.kind],
                location: this.location,
                containerName: this.containerName
            };
        }
    };
    exports.SymbolInformation = SymbolInformation;
    exports.SymbolInformation = SymbolInformation = SymbolInformation_1 = __decorate([
        es5ClassCompat
    ], SymbolInformation);
    let DocumentSymbol = DocumentSymbol_1 = class DocumentSymbol {
        static validate(candidate) {
            if (!candidate.name) {
                throw new Error('name must not be falsy');
            }
            if (!candidate.range.contains(candidate.selectionRange)) {
                throw new Error('selectionRange must be contained in fullRange');
            }
            candidate.children?.forEach(DocumentSymbol_1.validate);
        }
        constructor(name, detail, kind, range, selectionRange) {
            this.name = name;
            this.detail = detail;
            this.kind = kind;
            this.range = range;
            this.selectionRange = selectionRange;
            this.children = [];
            DocumentSymbol_1.validate(this);
        }
    };
    exports.DocumentSymbol = DocumentSymbol;
    exports.DocumentSymbol = DocumentSymbol = DocumentSymbol_1 = __decorate([
        es5ClassCompat
    ], DocumentSymbol);
    var CodeActionTriggerKind;
    (function (CodeActionTriggerKind) {
        CodeActionTriggerKind[CodeActionTriggerKind["Invoke"] = 1] = "Invoke";
        CodeActionTriggerKind[CodeActionTriggerKind["Automatic"] = 2] = "Automatic";
    })(CodeActionTriggerKind || (exports.CodeActionTriggerKind = CodeActionTriggerKind = {}));
    let CodeAction = class CodeAction {
        constructor(title, kind) {
            this.title = title;
            this.kind = kind;
        }
    };
    exports.CodeAction = CodeAction;
    exports.CodeAction = CodeAction = __decorate([
        es5ClassCompat
    ], CodeAction);
    let CodeActionKind = class CodeActionKind {
        static { CodeActionKind_1 = this; }
        static { this.sep = '.'; }
        constructor(value) {
            this.value = value;
        }
        append(parts) {
            return new CodeActionKind_1(this.value ? this.value + CodeActionKind_1.sep + parts : parts);
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
        contains(other) {
            return this.value === other.value || other.value.startsWith(this.value + CodeActionKind_1.sep);
        }
    };
    exports.CodeActionKind = CodeActionKind;
    exports.CodeActionKind = CodeActionKind = CodeActionKind_1 = __decorate([
        es5ClassCompat
    ], CodeActionKind);
    CodeActionKind.Empty = new CodeActionKind('');
    CodeActionKind.QuickFix = CodeActionKind.Empty.append('quickfix');
    CodeActionKind.Refactor = CodeActionKind.Empty.append('refactor');
    CodeActionKind.RefactorExtract = CodeActionKind.Refactor.append('extract');
    CodeActionKind.RefactorInline = CodeActionKind.Refactor.append('inline');
    CodeActionKind.RefactorMove = CodeActionKind.Refactor.append('move');
    CodeActionKind.RefactorRewrite = CodeActionKind.Refactor.append('rewrite');
    CodeActionKind.Source = CodeActionKind.Empty.append('source');
    CodeActionKind.SourceOrganizeImports = CodeActionKind.Source.append('organizeImports');
    CodeActionKind.SourceFixAll = CodeActionKind.Source.append('fixAll');
    CodeActionKind.Notebook = CodeActionKind.Empty.append('notebook');
    let SelectionRange = class SelectionRange {
        constructor(range, parent) {
            this.range = range;
            this.parent = parent;
            if (parent && !parent.range.contains(this.range)) {
                throw new Error('Invalid argument: parent must contain this range');
            }
        }
    };
    exports.SelectionRange = SelectionRange;
    exports.SelectionRange = SelectionRange = __decorate([
        es5ClassCompat
    ], SelectionRange);
    class CallHierarchyItem {
        constructor(kind, name, detail, uri, range, selectionRange) {
            this.kind = kind;
            this.name = name;
            this.detail = detail;
            this.uri = uri;
            this.range = range;
            this.selectionRange = selectionRange;
        }
    }
    exports.CallHierarchyItem = CallHierarchyItem;
    class CallHierarchyIncomingCall {
        constructor(item, fromRanges) {
            this.fromRanges = fromRanges;
            this.from = item;
        }
    }
    exports.CallHierarchyIncomingCall = CallHierarchyIncomingCall;
    class CallHierarchyOutgoingCall {
        constructor(item, fromRanges) {
            this.fromRanges = fromRanges;
            this.to = item;
        }
    }
    exports.CallHierarchyOutgoingCall = CallHierarchyOutgoingCall;
    var LanguageStatusSeverity;
    (function (LanguageStatusSeverity) {
        LanguageStatusSeverity[LanguageStatusSeverity["Information"] = 0] = "Information";
        LanguageStatusSeverity[LanguageStatusSeverity["Warning"] = 1] = "Warning";
        LanguageStatusSeverity[LanguageStatusSeverity["Error"] = 2] = "Error";
    })(LanguageStatusSeverity || (exports.LanguageStatusSeverity = LanguageStatusSeverity = {}));
    let CodeLens = class CodeLens {
        constructor(range, command) {
            this.range = range;
            this.command = command;
        }
        get isResolved() {
            return !!this.command;
        }
    };
    exports.CodeLens = CodeLens;
    exports.CodeLens = CodeLens = __decorate([
        es5ClassCompat
    ], CodeLens);
    let MarkdownString = MarkdownString_1 = class MarkdownString {
        #delegate;
        static isMarkdownString(thing) {
            if (thing instanceof MarkdownString_1) {
                return true;
            }
            return thing && thing.appendCodeblock && thing.appendMarkdown && thing.appendText && (thing.value !== undefined);
        }
        constructor(value, supportThemeIcons = false) {
            this.#delegate = new htmlContent_1.MarkdownString(value, { supportThemeIcons });
        }
        get value() {
            return this.#delegate.value;
        }
        set value(value) {
            this.#delegate.value = value;
        }
        get isTrusted() {
            return this.#delegate.isTrusted;
        }
        set isTrusted(value) {
            this.#delegate.isTrusted = value;
        }
        get supportThemeIcons() {
            return this.#delegate.supportThemeIcons;
        }
        set supportThemeIcons(value) {
            this.#delegate.supportThemeIcons = value;
        }
        get supportHtml() {
            return this.#delegate.supportHtml;
        }
        set supportHtml(value) {
            this.#delegate.supportHtml = value;
        }
        get baseUri() {
            return this.#delegate.baseUri;
        }
        set baseUri(value) {
            this.#delegate.baseUri = value;
        }
        appendText(value) {
            this.#delegate.appendText(value);
            return this;
        }
        appendMarkdown(value) {
            this.#delegate.appendMarkdown(value);
            return this;
        }
        appendCodeblock(value, language) {
            this.#delegate.appendCodeblock(language ?? '', value);
            return this;
        }
    };
    exports.MarkdownString = MarkdownString;
    exports.MarkdownString = MarkdownString = MarkdownString_1 = __decorate([
        es5ClassCompat
    ], MarkdownString);
    let ParameterInformation = class ParameterInformation {
        constructor(label, documentation) {
            this.label = label;
            this.documentation = documentation;
        }
    };
    exports.ParameterInformation = ParameterInformation;
    exports.ParameterInformation = ParameterInformation = __decorate([
        es5ClassCompat
    ], ParameterInformation);
    let SignatureInformation = class SignatureInformation {
        constructor(label, documentation) {
            this.label = label;
            this.documentation = documentation;
            this.parameters = [];
        }
    };
    exports.SignatureInformation = SignatureInformation;
    exports.SignatureInformation = SignatureInformation = __decorate([
        es5ClassCompat
    ], SignatureInformation);
    let SignatureHelp = class SignatureHelp {
        constructor() {
            this.activeSignature = 0;
            this.activeParameter = 0;
            this.signatures = [];
        }
    };
    exports.SignatureHelp = SignatureHelp;
    exports.SignatureHelp = SignatureHelp = __decorate([
        es5ClassCompat
    ], SignatureHelp);
    var SignatureHelpTriggerKind;
    (function (SignatureHelpTriggerKind) {
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["Invoke"] = 1] = "Invoke";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["TriggerCharacter"] = 2] = "TriggerCharacter";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["ContentChange"] = 3] = "ContentChange";
    })(SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = SignatureHelpTriggerKind = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        InlayHintKind[InlayHintKind["Type"] = 1] = "Type";
        InlayHintKind[InlayHintKind["Parameter"] = 2] = "Parameter";
    })(InlayHintKind || (exports.InlayHintKind = InlayHintKind = {}));
    let InlayHintLabelPart = class InlayHintLabelPart {
        constructor(value) {
            this.value = value;
        }
    };
    exports.InlayHintLabelPart = InlayHintLabelPart;
    exports.InlayHintLabelPart = InlayHintLabelPart = __decorate([
        es5ClassCompat
    ], InlayHintLabelPart);
    let InlayHint = class InlayHint {
        constructor(position, label, kind) {
            this.position = position;
            this.label = label;
            this.kind = kind;
        }
    };
    exports.InlayHint = InlayHint;
    exports.InlayHint = InlayHint = __decorate([
        es5ClassCompat
    ], InlayHint);
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        CompletionTriggerKind[CompletionTriggerKind["Invoke"] = 0] = "Invoke";
        CompletionTriggerKind[CompletionTriggerKind["TriggerCharacter"] = 1] = "TriggerCharacter";
        CompletionTriggerKind[CompletionTriggerKind["TriggerForIncompleteCompletions"] = 2] = "TriggerForIncompleteCompletions";
    })(CompletionTriggerKind || (exports.CompletionTriggerKind = CompletionTriggerKind = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        CompletionItemKind[CompletionItemKind["Text"] = 0] = "Text";
        CompletionItemKind[CompletionItemKind["Method"] = 1] = "Method";
        CompletionItemKind[CompletionItemKind["Function"] = 2] = "Function";
        CompletionItemKind[CompletionItemKind["Constructor"] = 3] = "Constructor";
        CompletionItemKind[CompletionItemKind["Field"] = 4] = "Field";
        CompletionItemKind[CompletionItemKind["Variable"] = 5] = "Variable";
        CompletionItemKind[CompletionItemKind["Class"] = 6] = "Class";
        CompletionItemKind[CompletionItemKind["Interface"] = 7] = "Interface";
        CompletionItemKind[CompletionItemKind["Module"] = 8] = "Module";
        CompletionItemKind[CompletionItemKind["Property"] = 9] = "Property";
        CompletionItemKind[CompletionItemKind["Unit"] = 10] = "Unit";
        CompletionItemKind[CompletionItemKind["Value"] = 11] = "Value";
        CompletionItemKind[CompletionItemKind["Enum"] = 12] = "Enum";
        CompletionItemKind[CompletionItemKind["Keyword"] = 13] = "Keyword";
        CompletionItemKind[CompletionItemKind["Snippet"] = 14] = "Snippet";
        CompletionItemKind[CompletionItemKind["Color"] = 15] = "Color";
        CompletionItemKind[CompletionItemKind["File"] = 16] = "File";
        CompletionItemKind[CompletionItemKind["Reference"] = 17] = "Reference";
        CompletionItemKind[CompletionItemKind["Folder"] = 18] = "Folder";
        CompletionItemKind[CompletionItemKind["EnumMember"] = 19] = "EnumMember";
        CompletionItemKind[CompletionItemKind["Constant"] = 20] = "Constant";
        CompletionItemKind[CompletionItemKind["Struct"] = 21] = "Struct";
        CompletionItemKind[CompletionItemKind["Event"] = 22] = "Event";
        CompletionItemKind[CompletionItemKind["Operator"] = 23] = "Operator";
        CompletionItemKind[CompletionItemKind["TypeParameter"] = 24] = "TypeParameter";
        CompletionItemKind[CompletionItemKind["User"] = 25] = "User";
        CompletionItemKind[CompletionItemKind["Issue"] = 26] = "Issue";
    })(CompletionItemKind || (exports.CompletionItemKind = CompletionItemKind = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        CompletionItemTag[CompletionItemTag["Deprecated"] = 1] = "Deprecated";
    })(CompletionItemTag || (exports.CompletionItemTag = CompletionItemTag = {}));
    let CompletionItem = class CompletionItem {
        constructor(label, kind) {
            this.label = label;
            this.kind = kind;
        }
        toJSON() {
            return {
                label: this.label,
                kind: this.kind && CompletionItemKind[this.kind],
                detail: this.detail,
                documentation: this.documentation,
                sortText: this.sortText,
                filterText: this.filterText,
                preselect: this.preselect,
                insertText: this.insertText,
                textEdit: this.textEdit
            };
        }
    };
    exports.CompletionItem = CompletionItem;
    exports.CompletionItem = CompletionItem = __decorate([
        es5ClassCompat
    ], CompletionItem);
    let CompletionList = class CompletionList {
        constructor(items = [], isIncomplete = false) {
            this.items = items;
            this.isIncomplete = isIncomplete;
        }
    };
    exports.CompletionList = CompletionList;
    exports.CompletionList = CompletionList = __decorate([
        es5ClassCompat
    ], CompletionList);
    let InlineSuggestion = class InlineSuggestion {
        constructor(insertText, range, command) {
            this.insertText = insertText;
            this.range = range;
            this.command = command;
        }
    };
    exports.InlineSuggestion = InlineSuggestion;
    exports.InlineSuggestion = InlineSuggestion = __decorate([
        es5ClassCompat
    ], InlineSuggestion);
    let InlineSuggestionList = class InlineSuggestionList {
        constructor(items) {
            this.commands = undefined;
            this.suppressSuggestions = undefined;
            this.items = items;
        }
    };
    exports.InlineSuggestionList = InlineSuggestionList;
    exports.InlineSuggestionList = InlineSuggestionList = __decorate([
        es5ClassCompat
    ], InlineSuggestionList);
    var PartialAcceptTriggerKind;
    (function (PartialAcceptTriggerKind) {
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Unknown"] = 0] = "Unknown";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Word"] = 1] = "Word";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Line"] = 2] = "Line";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Suggest"] = 3] = "Suggest";
    })(PartialAcceptTriggerKind || (exports.PartialAcceptTriggerKind = PartialAcceptTriggerKind = {}));
    var ViewColumn;
    (function (ViewColumn) {
        ViewColumn[ViewColumn["Active"] = -1] = "Active";
        ViewColumn[ViewColumn["Beside"] = -2] = "Beside";
        ViewColumn[ViewColumn["One"] = 1] = "One";
        ViewColumn[ViewColumn["Two"] = 2] = "Two";
        ViewColumn[ViewColumn["Three"] = 3] = "Three";
        ViewColumn[ViewColumn["Four"] = 4] = "Four";
        ViewColumn[ViewColumn["Five"] = 5] = "Five";
        ViewColumn[ViewColumn["Six"] = 6] = "Six";
        ViewColumn[ViewColumn["Seven"] = 7] = "Seven";
        ViewColumn[ViewColumn["Eight"] = 8] = "Eight";
        ViewColumn[ViewColumn["Nine"] = 9] = "Nine";
    })(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
    var StatusBarAlignment;
    (function (StatusBarAlignment) {
        StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
        StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
    })(StatusBarAlignment || (exports.StatusBarAlignment = StatusBarAlignment = {}));
    function asStatusBarItemIdentifier(extension, id) {
        return `${extensions_1.ExtensionIdentifier.toKey(extension)}.${id}`;
    }
    var TextEditorLineNumbersStyle;
    (function (TextEditorLineNumbersStyle) {
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Off"] = 0] = "Off";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["On"] = 1] = "On";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Relative"] = 2] = "Relative";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Interval"] = 3] = "Interval";
    })(TextEditorLineNumbersStyle || (exports.TextEditorLineNumbersStyle = TextEditorLineNumbersStyle = {}));
    var TextDocumentSaveReason;
    (function (TextDocumentSaveReason) {
        TextDocumentSaveReason[TextDocumentSaveReason["Manual"] = 1] = "Manual";
        TextDocumentSaveReason[TextDocumentSaveReason["AfterDelay"] = 2] = "AfterDelay";
        TextDocumentSaveReason[TextDocumentSaveReason["FocusOut"] = 3] = "FocusOut";
    })(TextDocumentSaveReason || (exports.TextDocumentSaveReason = TextDocumentSaveReason = {}));
    var TextEditorRevealType;
    (function (TextEditorRevealType) {
        TextEditorRevealType[TextEditorRevealType["Default"] = 0] = "Default";
        TextEditorRevealType[TextEditorRevealType["InCenter"] = 1] = "InCenter";
        TextEditorRevealType[TextEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        TextEditorRevealType[TextEditorRevealType["AtTop"] = 3] = "AtTop";
    })(TextEditorRevealType || (exports.TextEditorRevealType = TextEditorRevealType = {}));
    var TextEditorSelectionChangeKind;
    (function (TextEditorSelectionChangeKind) {
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Keyboard"] = 1] = "Keyboard";
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Mouse"] = 2] = "Mouse";
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Command"] = 3] = "Command";
    })(TextEditorSelectionChangeKind || (exports.TextEditorSelectionChangeKind = TextEditorSelectionChangeKind = {}));
    var TextDocumentChangeReason;
    (function (TextDocumentChangeReason) {
        TextDocumentChangeReason[TextDocumentChangeReason["Undo"] = 1] = "Undo";
        TextDocumentChangeReason[TextDocumentChangeReason["Redo"] = 2] = "Redo";
    })(TextDocumentChangeReason || (exports.TextDocumentChangeReason = TextDocumentChangeReason = {}));
    /**
     * These values match very carefully the values of `TrackedRangeStickiness`
     */
    var DecorationRangeBehavior;
    (function (DecorationRangeBehavior) {
        /**
         * TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges
         */
        DecorationRangeBehavior[DecorationRangeBehavior["OpenOpen"] = 0] = "OpenOpen";
        /**
         * TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
         */
        DecorationRangeBehavior[DecorationRangeBehavior["ClosedClosed"] = 1] = "ClosedClosed";
        /**
         * TrackedRangeStickiness.GrowsOnlyWhenTypingBefore
         */
        DecorationRangeBehavior[DecorationRangeBehavior["OpenClosed"] = 2] = "OpenClosed";
        /**
         * TrackedRangeStickiness.GrowsOnlyWhenTypingAfter
         */
        DecorationRangeBehavior[DecorationRangeBehavior["ClosedOpen"] = 3] = "ClosedOpen";
    })(DecorationRangeBehavior || (exports.DecorationRangeBehavior = DecorationRangeBehavior = {}));
    (function (TextEditorSelectionChangeKind) {
        function fromValue(s) {
            switch (s) {
                case 'keyboard': return TextEditorSelectionChangeKind.Keyboard;
                case 'mouse': return TextEditorSelectionChangeKind.Mouse;
                case 'api': return TextEditorSelectionChangeKind.Command;
            }
            return undefined;
        }
        TextEditorSelectionChangeKind.fromValue = fromValue;
    })(TextEditorSelectionChangeKind || (exports.TextEditorSelectionChangeKind = TextEditorSelectionChangeKind = {}));
    var SyntaxTokenType;
    (function (SyntaxTokenType) {
        SyntaxTokenType[SyntaxTokenType["Other"] = 0] = "Other";
        SyntaxTokenType[SyntaxTokenType["Comment"] = 1] = "Comment";
        SyntaxTokenType[SyntaxTokenType["String"] = 2] = "String";
        SyntaxTokenType[SyntaxTokenType["RegEx"] = 3] = "RegEx";
    })(SyntaxTokenType || (exports.SyntaxTokenType = SyntaxTokenType = {}));
    (function (SyntaxTokenType) {
        function toString(v) {
            switch (v) {
                case SyntaxTokenType.Other: return 'other';
                case SyntaxTokenType.Comment: return 'comment';
                case SyntaxTokenType.String: return 'string';
                case SyntaxTokenType.RegEx: return 'regex';
            }
            return 'other';
        }
        SyntaxTokenType.toString = toString;
    })(SyntaxTokenType || (exports.SyntaxTokenType = SyntaxTokenType = {}));
    let DocumentLink = class DocumentLink {
        constructor(range, target) {
            if (target && !(uri_1.URI.isUri(target))) {
                throw (0, errors_1.illegalArgument)('target');
            }
            if (!Range.isRange(range) || range.isEmpty) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this.range = range;
            this.target = target;
        }
    };
    exports.DocumentLink = DocumentLink;
    exports.DocumentLink = DocumentLink = __decorate([
        es5ClassCompat
    ], DocumentLink);
    let Color = class Color {
        constructor(red, green, blue, alpha) {
            this.red = red;
            this.green = green;
            this.blue = blue;
            this.alpha = alpha;
        }
    };
    exports.Color = Color;
    exports.Color = Color = __decorate([
        es5ClassCompat
    ], Color);
    let ColorInformation = class ColorInformation {
        constructor(range, color) {
            if (color && !(color instanceof Color)) {
                throw (0, errors_1.illegalArgument)('color');
            }
            if (!Range.isRange(range) || range.isEmpty) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this.range = range;
            this.color = color;
        }
    };
    exports.ColorInformation = ColorInformation;
    exports.ColorInformation = ColorInformation = __decorate([
        es5ClassCompat
    ], ColorInformation);
    let ColorPresentation = class ColorPresentation {
        constructor(label) {
            if (!label || typeof label !== 'string') {
                throw (0, errors_1.illegalArgument)('label');
            }
            this.label = label;
        }
    };
    exports.ColorPresentation = ColorPresentation;
    exports.ColorPresentation = ColorPresentation = __decorate([
        es5ClassCompat
    ], ColorPresentation);
    var ColorFormat;
    (function (ColorFormat) {
        ColorFormat[ColorFormat["RGB"] = 0] = "RGB";
        ColorFormat[ColorFormat["HEX"] = 1] = "HEX";
        ColorFormat[ColorFormat["HSL"] = 2] = "HSL";
    })(ColorFormat || (exports.ColorFormat = ColorFormat = {}));
    var SourceControlInputBoxValidationType;
    (function (SourceControlInputBoxValidationType) {
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Error"] = 0] = "Error";
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Warning"] = 1] = "Warning";
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Information"] = 2] = "Information";
    })(SourceControlInputBoxValidationType || (exports.SourceControlInputBoxValidationType = SourceControlInputBoxValidationType = {}));
    var TerminalExitReason;
    (function (TerminalExitReason) {
        TerminalExitReason[TerminalExitReason["Unknown"] = 0] = "Unknown";
        TerminalExitReason[TerminalExitReason["Shutdown"] = 1] = "Shutdown";
        TerminalExitReason[TerminalExitReason["Process"] = 2] = "Process";
        TerminalExitReason[TerminalExitReason["User"] = 3] = "User";
        TerminalExitReason[TerminalExitReason["Extension"] = 4] = "Extension";
    })(TerminalExitReason || (exports.TerminalExitReason = TerminalExitReason = {}));
    var TerminalShellExecutionCommandLineConfidence;
    (function (TerminalShellExecutionCommandLineConfidence) {
        TerminalShellExecutionCommandLineConfidence[TerminalShellExecutionCommandLineConfidence["Low"] = 0] = "Low";
        TerminalShellExecutionCommandLineConfidence[TerminalShellExecutionCommandLineConfidence["Medium"] = 1] = "Medium";
        TerminalShellExecutionCommandLineConfidence[TerminalShellExecutionCommandLineConfidence["High"] = 2] = "High";
    })(TerminalShellExecutionCommandLineConfidence || (exports.TerminalShellExecutionCommandLineConfidence = TerminalShellExecutionCommandLineConfidence = {}));
    class TerminalLink {
        constructor(startIndex, length, tooltip) {
            this.startIndex = startIndex;
            this.length = length;
            this.tooltip = tooltip;
            if (typeof startIndex !== 'number' || startIndex < 0) {
                throw (0, errors_1.illegalArgument)('startIndex');
            }
            if (typeof length !== 'number' || length < 1) {
                throw (0, errors_1.illegalArgument)('length');
            }
            if (tooltip !== undefined && typeof tooltip !== 'string') {
                throw (0, errors_1.illegalArgument)('tooltip');
            }
        }
    }
    exports.TerminalLink = TerminalLink;
    class TerminalQuickFixOpener {
        constructor(uri) {
            this.uri = uri;
        }
    }
    exports.TerminalQuickFixOpener = TerminalQuickFixOpener;
    class TerminalQuickFixCommand {
        constructor(terminalCommand) {
            this.terminalCommand = terminalCommand;
        }
    }
    exports.TerminalQuickFixCommand = TerminalQuickFixCommand;
    var TerminalLocation;
    (function (TerminalLocation) {
        TerminalLocation[TerminalLocation["Panel"] = 1] = "Panel";
        TerminalLocation[TerminalLocation["Editor"] = 2] = "Editor";
    })(TerminalLocation || (exports.TerminalLocation = TerminalLocation = {}));
    class TerminalProfile {
        constructor(options) {
            this.options = options;
            if (typeof options !== 'object') {
                throw (0, errors_1.illegalArgument)('options');
            }
        }
    }
    exports.TerminalProfile = TerminalProfile;
    var TaskRevealKind;
    (function (TaskRevealKind) {
        TaskRevealKind[TaskRevealKind["Always"] = 1] = "Always";
        TaskRevealKind[TaskRevealKind["Silent"] = 2] = "Silent";
        TaskRevealKind[TaskRevealKind["Never"] = 3] = "Never";
    })(TaskRevealKind || (exports.TaskRevealKind = TaskRevealKind = {}));
    var TaskPanelKind;
    (function (TaskPanelKind) {
        TaskPanelKind[TaskPanelKind["Shared"] = 1] = "Shared";
        TaskPanelKind[TaskPanelKind["Dedicated"] = 2] = "Dedicated";
        TaskPanelKind[TaskPanelKind["New"] = 3] = "New";
    })(TaskPanelKind || (exports.TaskPanelKind = TaskPanelKind = {}));
    let TaskGroup = class TaskGroup {
        static { TaskGroup_1 = this; }
        static { this.Clean = new TaskGroup_1('clean', 'Clean'); }
        static { this.Build = new TaskGroup_1('build', 'Build'); }
        static { this.Rebuild = new TaskGroup_1('rebuild', 'Rebuild'); }
        static { this.Test = new TaskGroup_1('test', 'Test'); }
        static from(value) {
            switch (value) {
                case 'clean':
                    return TaskGroup_1.Clean;
                case 'build':
                    return TaskGroup_1.Build;
                case 'rebuild':
                    return TaskGroup_1.Rebuild;
                case 'test':
                    return TaskGroup_1.Test;
                default:
                    return undefined;
            }
        }
        constructor(id, label) {
            this.label = label;
            if (typeof id !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            if (typeof label !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            this._id = id;
        }
        get id() {
            return this._id;
        }
    };
    exports.TaskGroup = TaskGroup;
    exports.TaskGroup = TaskGroup = TaskGroup_1 = __decorate([
        es5ClassCompat
    ], TaskGroup);
    function computeTaskExecutionId(values) {
        let id = '';
        for (let i = 0; i < values.length; i++) {
            id += values[i].replace(/,/g, ',,') + ',';
        }
        return id;
    }
    let ProcessExecution = class ProcessExecution {
        constructor(process, varg1, varg2) {
            if (typeof process !== 'string') {
                throw (0, errors_1.illegalArgument)('process');
            }
            this._args = [];
            this._process = process;
            if (varg1 !== undefined) {
                if (Array.isArray(varg1)) {
                    this._args = varg1;
                    this._options = varg2;
                }
                else {
                    this._options = varg1;
                }
            }
        }
        get process() {
            return this._process;
        }
        set process(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('process');
            }
            this._process = value;
        }
        get args() {
            return this._args;
        }
        set args(value) {
            if (!Array.isArray(value)) {
                value = [];
            }
            this._args = value;
        }
        get options() {
            return this._options;
        }
        set options(value) {
            this._options = value;
        }
        computeId() {
            const props = [];
            props.push('process');
            if (this._process !== undefined) {
                props.push(this._process);
            }
            if (this._args && this._args.length > 0) {
                for (const arg of this._args) {
                    props.push(arg);
                }
            }
            return computeTaskExecutionId(props);
        }
    };
    exports.ProcessExecution = ProcessExecution;
    exports.ProcessExecution = ProcessExecution = __decorate([
        es5ClassCompat
    ], ProcessExecution);
    let ShellExecution = class ShellExecution {
        constructor(arg0, arg1, arg2) {
            this._args = [];
            if (Array.isArray(arg1)) {
                if (!arg0) {
                    throw (0, errors_1.illegalArgument)('command can\'t be undefined or null');
                }
                if (typeof arg0 !== 'string' && typeof arg0.value !== 'string') {
                    throw (0, errors_1.illegalArgument)('command');
                }
                this._command = arg0;
                this._args = arg1;
                this._options = arg2;
            }
            else {
                if (typeof arg0 !== 'string') {
                    throw (0, errors_1.illegalArgument)('commandLine');
                }
                this._commandLine = arg0;
                this._options = arg1;
            }
        }
        get commandLine() {
            return this._commandLine;
        }
        set commandLine(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('commandLine');
            }
            this._commandLine = value;
        }
        get command() {
            return this._command ? this._command : '';
        }
        set command(value) {
            if (typeof value !== 'string' && typeof value.value !== 'string') {
                throw (0, errors_1.illegalArgument)('command');
            }
            this._command = value;
        }
        get args() {
            return this._args;
        }
        set args(value) {
            this._args = value || [];
        }
        get options() {
            return this._options;
        }
        set options(value) {
            this._options = value;
        }
        computeId() {
            const props = [];
            props.push('shell');
            if (this._commandLine !== undefined) {
                props.push(this._commandLine);
            }
            if (this._command !== undefined) {
                props.push(typeof this._command === 'string' ? this._command : this._command.value);
            }
            if (this._args && this._args.length > 0) {
                for (const arg of this._args) {
                    props.push(typeof arg === 'string' ? arg : arg.value);
                }
            }
            return computeTaskExecutionId(props);
        }
    };
    exports.ShellExecution = ShellExecution;
    exports.ShellExecution = ShellExecution = __decorate([
        es5ClassCompat
    ], ShellExecution);
    var ShellQuoting;
    (function (ShellQuoting) {
        ShellQuoting[ShellQuoting["Escape"] = 1] = "Escape";
        ShellQuoting[ShellQuoting["Strong"] = 2] = "Strong";
        ShellQuoting[ShellQuoting["Weak"] = 3] = "Weak";
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    var TaskScope;
    (function (TaskScope) {
        TaskScope[TaskScope["Global"] = 1] = "Global";
        TaskScope[TaskScope["Workspace"] = 2] = "Workspace";
    })(TaskScope || (exports.TaskScope = TaskScope = {}));
    class CustomExecution {
        constructor(callback) {
            this._callback = callback;
        }
        computeId() {
            return 'customExecution' + (0, uuid_1.generateUuid)();
        }
        set callback(value) {
            this._callback = value;
        }
        get callback() {
            return this._callback;
        }
    }
    exports.CustomExecution = CustomExecution;
    let Task = class Task {
        static { Task_1 = this; }
        static { this.ExtensionCallbackType = 'customExecution'; }
        static { this.ProcessType = 'process'; }
        static { this.ShellType = 'shell'; }
        static { this.EmptyType = '$empty'; }
        constructor(definition, arg2, arg3, arg4, arg5, arg6) {
            this.__deprecated = false;
            this._definition = this.definition = definition;
            let problemMatchers;
            if (typeof arg2 === 'string') {
                this._name = this.name = arg2;
                this._source = this.source = arg3;
                this.execution = arg4;
                problemMatchers = arg5;
                this.__deprecated = true;
            }
            else if (arg2 === TaskScope.Global || arg2 === TaskScope.Workspace) {
                this.target = arg2;
                this._name = this.name = arg3;
                this._source = this.source = arg4;
                this.execution = arg5;
                problemMatchers = arg6;
            }
            else {
                this.target = arg2;
                this._name = this.name = arg3;
                this._source = this.source = arg4;
                this.execution = arg5;
                problemMatchers = arg6;
            }
            if (typeof problemMatchers === 'string') {
                this._problemMatchers = [problemMatchers];
                this._hasDefinedMatchers = true;
            }
            else if (Array.isArray(problemMatchers)) {
                this._problemMatchers = problemMatchers;
                this._hasDefinedMatchers = true;
            }
            else {
                this._problemMatchers = [];
                this._hasDefinedMatchers = false;
            }
            this._isBackground = false;
            this._presentationOptions = Object.create(null);
            this._runOptions = Object.create(null);
        }
        get _id() {
            return this.__id;
        }
        set _id(value) {
            this.__id = value;
        }
        get _deprecated() {
            return this.__deprecated;
        }
        clear() {
            if (this.__id === undefined) {
                return;
            }
            this.__id = undefined;
            this._scope = undefined;
            this.computeDefinitionBasedOnExecution();
        }
        computeDefinitionBasedOnExecution() {
            if (this._execution instanceof ProcessExecution) {
                this._definition = {
                    type: Task_1.ProcessType,
                    id: this._execution.computeId()
                };
            }
            else if (this._execution instanceof ShellExecution) {
                this._definition = {
                    type: Task_1.ShellType,
                    id: this._execution.computeId()
                };
            }
            else if (this._execution instanceof CustomExecution) {
                this._definition = {
                    type: Task_1.ExtensionCallbackType,
                    id: this._execution.computeId()
                };
            }
            else {
                this._definition = {
                    type: Task_1.EmptyType,
                    id: (0, uuid_1.generateUuid)()
                };
            }
        }
        get definition() {
            return this._definition;
        }
        set definition(value) {
            if (value === undefined || value === null) {
                throw (0, errors_1.illegalArgument)('Kind can\'t be undefined or null');
            }
            this.clear();
            this._definition = value;
        }
        get scope() {
            return this._scope;
        }
        set target(value) {
            this.clear();
            this._scope = value;
        }
        get name() {
            return this._name;
        }
        set name(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            this.clear();
            this._name = value;
        }
        get execution() {
            return this._execution;
        }
        set execution(value) {
            if (value === null) {
                value = undefined;
            }
            this.clear();
            this._execution = value;
            const type = this._definition.type;
            if (Task_1.EmptyType === type || Task_1.ProcessType === type || Task_1.ShellType === type || Task_1.ExtensionCallbackType === type) {
                this.computeDefinitionBasedOnExecution();
            }
        }
        get problemMatchers() {
            return this._problemMatchers;
        }
        set problemMatchers(value) {
            if (!Array.isArray(value)) {
                this.clear();
                this._problemMatchers = [];
                this._hasDefinedMatchers = false;
                return;
            }
            else {
                this.clear();
                this._problemMatchers = value;
                this._hasDefinedMatchers = true;
            }
        }
        get hasDefinedMatchers() {
            return this._hasDefinedMatchers;
        }
        get isBackground() {
            return this._isBackground;
        }
        set isBackground(value) {
            if (value !== true && value !== false) {
                value = false;
            }
            this.clear();
            this._isBackground = value;
        }
        get source() {
            return this._source;
        }
        set source(value) {
            if (typeof value !== 'string' || value.length === 0) {
                throw (0, errors_1.illegalArgument)('source must be a string of length > 0');
            }
            this.clear();
            this._source = value;
        }
        get group() {
            return this._group;
        }
        set group(value) {
            if (value === null) {
                value = undefined;
            }
            this.clear();
            this._group = value;
        }
        get detail() {
            return this._detail;
        }
        set detail(value) {
            if (value === null) {
                value = undefined;
            }
            this._detail = value;
        }
        get presentationOptions() {
            return this._presentationOptions;
        }
        set presentationOptions(value) {
            if (value === null || value === undefined) {
                value = Object.create(null);
            }
            this.clear();
            this._presentationOptions = value;
        }
        get runOptions() {
            return this._runOptions;
        }
        set runOptions(value) {
            if (value === null || value === undefined) {
                value = Object.create(null);
            }
            this.clear();
            this._runOptions = value;
        }
    };
    exports.Task = Task;
    exports.Task = Task = Task_1 = __decorate([
        es5ClassCompat
    ], Task);
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["SourceControl"] = 1] = "SourceControl";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
    })(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
    var ViewBadge;
    (function (ViewBadge) {
        function isViewBadge(thing) {
            const viewBadgeThing = thing;
            if (!(0, types_1.isNumber)(viewBadgeThing.value)) {
                console.log('INVALID view badge, invalid value', viewBadgeThing.value);
                return false;
            }
            if (viewBadgeThing.tooltip && !(0, types_1.isString)(viewBadgeThing.tooltip)) {
                console.log('INVALID view badge, invalid tooltip', viewBadgeThing.tooltip);
                return false;
            }
            return true;
        }
        ViewBadge.isViewBadge = isViewBadge;
    })(ViewBadge || (exports.ViewBadge = ViewBadge = {}));
    let TreeItem = TreeItem_1 = class TreeItem {
        static isTreeItem(thing, extension) {
            const treeItemThing = thing;
            if (treeItemThing.checkboxState !== undefined) {
                const checkbox = (0, types_1.isNumber)(treeItemThing.checkboxState) ? treeItemThing.checkboxState :
                    (0, types_1.isObject)(treeItemThing.checkboxState) && (0, types_1.isNumber)(treeItemThing.checkboxState.state) ? treeItemThing.checkboxState.state : undefined;
                const tooltip = !(0, types_1.isNumber)(treeItemThing.checkboxState) && (0, types_1.isObject)(treeItemThing.checkboxState) ? treeItemThing.checkboxState.tooltip : undefined;
                if (checkbox === undefined || (checkbox !== TreeItemCheckboxState.Checked && checkbox !== TreeItemCheckboxState.Unchecked) || (tooltip !== undefined && !(0, types_1.isString)(tooltip))) {
                    console.log('INVALID tree item, invalid checkboxState', treeItemThing.checkboxState);
                    return false;
                }
            }
            if (thing instanceof TreeItem_1) {
                return true;
            }
            if (treeItemThing.label !== undefined && !(0, types_1.isString)(treeItemThing.label) && !(treeItemThing.label?.label)) {
                console.log('INVALID tree item, invalid label', treeItemThing.label);
                return false;
            }
            if ((treeItemThing.id !== undefined) && !(0, types_1.isString)(treeItemThing.id)) {
                console.log('INVALID tree item, invalid id', treeItemThing.id);
                return false;
            }
            if ((treeItemThing.iconPath !== undefined) && !(0, types_1.isString)(treeItemThing.iconPath) && !uri_1.URI.isUri(treeItemThing.iconPath) && (!treeItemThing.iconPath || !(0, types_1.isString)(treeItemThing.iconPath.id))) {
                const asLightAndDarkThing = treeItemThing.iconPath;
                if (!asLightAndDarkThing || (!(0, types_1.isString)(asLightAndDarkThing.light) && !uri_1.URI.isUri(asLightAndDarkThing.light) && !(0, types_1.isString)(asLightAndDarkThing.dark) && !uri_1.URI.isUri(asLightAndDarkThing.dark))) {
                    console.log('INVALID tree item, invalid iconPath', treeItemThing.iconPath);
                    return false;
                }
            }
            if ((treeItemThing.description !== undefined) && !(0, types_1.isString)(treeItemThing.description) && (typeof treeItemThing.description !== 'boolean')) {
                console.log('INVALID tree item, invalid description', treeItemThing.description);
                return false;
            }
            if ((treeItemThing.resourceUri !== undefined) && !uri_1.URI.isUri(treeItemThing.resourceUri)) {
                console.log('INVALID tree item, invalid resourceUri', treeItemThing.resourceUri);
                return false;
            }
            if ((treeItemThing.tooltip !== undefined) && !(0, types_1.isString)(treeItemThing.tooltip) && !(treeItemThing.tooltip instanceof MarkdownString)) {
                console.log('INVALID tree item, invalid tooltip', treeItemThing.tooltip);
                return false;
            }
            if ((treeItemThing.command !== undefined) && !treeItemThing.command.command) {
                console.log('INVALID tree item, invalid command', treeItemThing.command);
                return false;
            }
            if ((treeItemThing.collapsibleState !== undefined) && (treeItemThing.collapsibleState < TreeItemCollapsibleState.None) && (treeItemThing.collapsibleState > TreeItemCollapsibleState.Expanded)) {
                console.log('INVALID tree item, invalid collapsibleState', treeItemThing.collapsibleState);
                return false;
            }
            if ((treeItemThing.contextValue !== undefined) && !(0, types_1.isString)(treeItemThing.contextValue)) {
                console.log('INVALID tree item, invalid contextValue', treeItemThing.contextValue);
                return false;
            }
            if ((treeItemThing.accessibilityInformation !== undefined) && !treeItemThing.accessibilityInformation?.label) {
                console.log('INVALID tree item, invalid accessibilityInformation', treeItemThing.accessibilityInformation);
                return false;
            }
            return true;
        }
        constructor(arg1, collapsibleState = TreeItemCollapsibleState.None) {
            this.collapsibleState = collapsibleState;
            if (uri_1.URI.isUri(arg1)) {
                this.resourceUri = arg1;
            }
            else {
                this.label = arg1;
            }
        }
    };
    exports.TreeItem = TreeItem;
    exports.TreeItem = TreeItem = TreeItem_1 = __decorate([
        es5ClassCompat
    ], TreeItem);
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = TreeItemCollapsibleState = {}));
    var TreeItemCheckboxState;
    (function (TreeItemCheckboxState) {
        TreeItemCheckboxState[TreeItemCheckboxState["Unchecked"] = 0] = "Unchecked";
        TreeItemCheckboxState[TreeItemCheckboxState["Checked"] = 1] = "Checked";
    })(TreeItemCheckboxState || (exports.TreeItemCheckboxState = TreeItemCheckboxState = {}));
    let DataTransferItem = class DataTransferItem {
        async asString() {
            return typeof this.value === 'string' ? this.value : JSON.stringify(this.value);
        }
        asFile() {
            return undefined;
        }
        constructor(value) {
            this.value = value;
        }
    };
    exports.DataTransferItem = DataTransferItem;
    exports.DataTransferItem = DataTransferItem = __decorate([
        es5ClassCompat
    ], DataTransferItem);
    /**
     * A data transfer item that has been created by VS Code instead of by a extension.
     *
     * Intentionally not exported to extensions.
     */
    class InternalDataTransferItem extends DataTransferItem {
    }
    exports.InternalDataTransferItem = InternalDataTransferItem;
    /**
     * A data transfer item for a file.
     *
     * Intentionally not exported to extensions as only we can create these.
     */
    class InternalFileDataTransferItem extends InternalDataTransferItem {
        #file;
        constructor(file) {
            super('');
            this.#file = file;
        }
        asFile() {
            return this.#file;
        }
    }
    exports.InternalFileDataTransferItem = InternalFileDataTransferItem;
    /**
     * Intentionally not exported to extensions
     */
    class DataTransferFile {
        constructor(name, uri, itemId, getData) {
            this.name = name;
            this.uri = uri;
            this._itemId = itemId;
            this._getData = getData;
        }
        data() {
            return this._getData();
        }
    }
    exports.DataTransferFile = DataTransferFile;
    let DataTransfer = class DataTransfer {
        #items = new Map();
        constructor(init) {
            for (const [mime, item] of init ?? []) {
                const existing = this.#items.get(this.#normalizeMime(mime));
                if (existing) {
                    existing.push(item);
                }
                else {
                    this.#items.set(this.#normalizeMime(mime), [item]);
                }
            }
        }
        get(mimeType) {
            return this.#items.get(this.#normalizeMime(mimeType))?.[0];
        }
        set(mimeType, value) {
            // This intentionally overwrites all entries for a given mimetype.
            // This is similar to how the DOM DataTransfer type works
            this.#items.set(this.#normalizeMime(mimeType), [value]);
        }
        forEach(callbackfn, thisArg) {
            for (const [mime, items] of this.#items) {
                for (const item of items) {
                    callbackfn.call(thisArg, item, mime, this);
                }
            }
        }
        *[Symbol.iterator]() {
            for (const [mime, items] of this.#items) {
                for (const item of items) {
                    yield [mime, item];
                }
            }
        }
        #normalizeMime(mimeType) {
            return mimeType.toLowerCase();
        }
    };
    exports.DataTransfer = DataTransfer;
    exports.DataTransfer = DataTransfer = __decorate([
        es5ClassCompat
    ], DataTransfer);
    let DocumentDropEdit = class DocumentDropEdit {
        constructor(insertText, title, kind) {
            this.insertText = insertText;
            this.title = title;
            this.kind = kind;
        }
    };
    exports.DocumentDropEdit = DocumentDropEdit;
    exports.DocumentDropEdit = DocumentDropEdit = __decorate([
        es5ClassCompat
    ], DocumentDropEdit);
    var DocumentPasteTriggerKind;
    (function (DocumentPasteTriggerKind) {
        DocumentPasteTriggerKind[DocumentPasteTriggerKind["Automatic"] = 0] = "Automatic";
        DocumentPasteTriggerKind[DocumentPasteTriggerKind["PasteAs"] = 1] = "PasteAs";
    })(DocumentPasteTriggerKind || (exports.DocumentPasteTriggerKind = DocumentPasteTriggerKind = {}));
    class DocumentDropOrPasteEditKind {
        static { this.sep = '.'; }
        constructor(value) {
            this.value = value;
        }
        append(...parts) {
            return new DocumentDropOrPasteEditKind((this.value ? [this.value, ...parts] : parts).join(DocumentDropOrPasteEditKind.sep));
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
        contains(other) {
            return this.value === other.value || other.value.startsWith(this.value + DocumentDropOrPasteEditKind.sep);
        }
    }
    exports.DocumentDropOrPasteEditKind = DocumentDropOrPasteEditKind;
    DocumentDropOrPasteEditKind.Empty = new DocumentDropOrPasteEditKind('');
    class DocumentPasteEdit {
        constructor(insertText, title, kind) {
            this.title = title;
            this.insertText = insertText;
            this.kind = kind;
        }
    }
    exports.DocumentPasteEdit = DocumentPasteEdit;
    let ThemeIcon = class ThemeIcon {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
        static isThemeIcon(thing) {
            if (typeof thing.id !== 'string') {
                console.log('INVALID ThemeIcon, invalid id', thing.id);
                return false;
            }
            return true;
        }
    };
    exports.ThemeIcon = ThemeIcon;
    exports.ThemeIcon = ThemeIcon = __decorate([
        es5ClassCompat
    ], ThemeIcon);
    ThemeIcon.File = new ThemeIcon('file');
    ThemeIcon.Folder = new ThemeIcon('folder');
    let ThemeColor = class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    };
    exports.ThemeColor = ThemeColor;
    exports.ThemeColor = ThemeColor = __decorate([
        es5ClassCompat
    ], ThemeColor);
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["Global"] = 1] = "Global";
        ConfigurationTarget[ConfigurationTarget["Workspace"] = 2] = "Workspace";
        ConfigurationTarget[ConfigurationTarget["WorkspaceFolder"] = 3] = "WorkspaceFolder";
    })(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
    let RelativePattern = class RelativePattern {
        get base() {
            return this._base;
        }
        set base(base) {
            this._base = base;
            this._baseUri = uri_1.URI.file(base);
        }
        get baseUri() {
            return this._baseUri;
        }
        set baseUri(baseUri) {
            this._baseUri = baseUri;
            this._base = baseUri.fsPath;
        }
        constructor(base, pattern) {
            if (typeof base !== 'string') {
                if (!base || !uri_1.URI.isUri(base) && !uri_1.URI.isUri(base.uri)) {
                    throw (0, errors_1.illegalArgument)('base');
                }
            }
            if (typeof pattern !== 'string') {
                throw (0, errors_1.illegalArgument)('pattern');
            }
            if (typeof base === 'string') {
                this.baseUri = uri_1.URI.file(base);
            }
            else if (uri_1.URI.isUri(base)) {
                this.baseUri = base;
            }
            else {
                this.baseUri = base.uri;
            }
            this.pattern = pattern;
        }
        toJSON() {
            return {
                pattern: this.pattern,
                base: this.base,
                baseUri: this.baseUri.toJSON()
            };
        }
    };
    exports.RelativePattern = RelativePattern;
    exports.RelativePattern = RelativePattern = __decorate([
        es5ClassCompat
    ], RelativePattern);
    const breakpointIds = new WeakMap();
    /**
     * We want to be able to construct Breakpoints internally that have a particular id, but we don't want extensions to be
     * able to do this with the exposed Breakpoint classes in extension API.
     * We also want "instanceof" to work with debug.breakpoints and the exposed breakpoint classes.
     * And private members will be renamed in the built js, so casting to any and setting a private member is not safe.
     * So, we store internal breakpoint IDs in a WeakMap. This function must be called after constructing a Breakpoint
     * with a known id.
     */
    function setBreakpointId(bp, id) {
        breakpointIds.set(bp, id);
    }
    let Breakpoint = class Breakpoint {
        constructor(enabled, condition, hitCondition, logMessage, mode) {
            this.enabled = typeof enabled === 'boolean' ? enabled : true;
            if (typeof condition === 'string') {
                this.condition = condition;
            }
            if (typeof hitCondition === 'string') {
                this.hitCondition = hitCondition;
            }
            if (typeof logMessage === 'string') {
                this.logMessage = logMessage;
            }
            if (typeof mode === 'string') {
                this.mode = mode;
            }
        }
        get id() {
            if (!this._id) {
                this._id = breakpointIds.get(this) ?? (0, uuid_1.generateUuid)();
            }
            return this._id;
        }
    };
    exports.Breakpoint = Breakpoint;
    exports.Breakpoint = Breakpoint = __decorate([
        es5ClassCompat
    ], Breakpoint);
    let SourceBreakpoint = class SourceBreakpoint extends Breakpoint {
        constructor(location, enabled, condition, hitCondition, logMessage, mode) {
            super(enabled, condition, hitCondition, logMessage, mode);
            if (location === null) {
                throw (0, errors_1.illegalArgument)('location');
            }
            this.location = location;
        }
    };
    exports.SourceBreakpoint = SourceBreakpoint;
    exports.SourceBreakpoint = SourceBreakpoint = __decorate([
        es5ClassCompat
    ], SourceBreakpoint);
    let FunctionBreakpoint = class FunctionBreakpoint extends Breakpoint {
        constructor(functionName, enabled, condition, hitCondition, logMessage, mode) {
            super(enabled, condition, hitCondition, logMessage, mode);
            this.functionName = functionName;
        }
    };
    exports.FunctionBreakpoint = FunctionBreakpoint;
    exports.FunctionBreakpoint = FunctionBreakpoint = __decorate([
        es5ClassCompat
    ], FunctionBreakpoint);
    let DataBreakpoint = class DataBreakpoint extends Breakpoint {
        constructor(label, dataId, canPersist, enabled, condition, hitCondition, logMessage, mode) {
            super(enabled, condition, hitCondition, logMessage, mode);
            if (!dataId) {
                throw (0, errors_1.illegalArgument)('dataId');
            }
            this.label = label;
            this.dataId = dataId;
            this.canPersist = canPersist;
        }
    };
    exports.DataBreakpoint = DataBreakpoint;
    exports.DataBreakpoint = DataBreakpoint = __decorate([
        es5ClassCompat
    ], DataBreakpoint);
    let DebugAdapterExecutable = class DebugAdapterExecutable {
        constructor(command, args, options) {
            this.command = command;
            this.args = args || [];
            this.options = options;
        }
    };
    exports.DebugAdapterExecutable = DebugAdapterExecutable;
    exports.DebugAdapterExecutable = DebugAdapterExecutable = __decorate([
        es5ClassCompat
    ], DebugAdapterExecutable);
    let DebugAdapterServer = class DebugAdapterServer {
        constructor(port, host) {
            this.port = port;
            this.host = host;
        }
    };
    exports.DebugAdapterServer = DebugAdapterServer;
    exports.DebugAdapterServer = DebugAdapterServer = __decorate([
        es5ClassCompat
    ], DebugAdapterServer);
    let DebugAdapterNamedPipeServer = class DebugAdapterNamedPipeServer {
        constructor(path) {
            this.path = path;
        }
    };
    exports.DebugAdapterNamedPipeServer = DebugAdapterNamedPipeServer;
    exports.DebugAdapterNamedPipeServer = DebugAdapterNamedPipeServer = __decorate([
        es5ClassCompat
    ], DebugAdapterNamedPipeServer);
    let DebugAdapterInlineImplementation = class DebugAdapterInlineImplementation {
        constructor(impl) {
            this.implementation = impl;
        }
    };
    exports.DebugAdapterInlineImplementation = DebugAdapterInlineImplementation;
    exports.DebugAdapterInlineImplementation = DebugAdapterInlineImplementation = __decorate([
        es5ClassCompat
    ], DebugAdapterInlineImplementation);
    class DebugStackFrame {
        constructor(session, threadId, frameId) {
            this.session = session;
            this.threadId = threadId;
            this.frameId = frameId;
        }
    }
    exports.DebugStackFrame = DebugStackFrame;
    class DebugThread {
        constructor(session, threadId) {
            this.session = session;
            this.threadId = threadId;
        }
    }
    exports.DebugThread = DebugThread;
    let EvaluatableExpression = class EvaluatableExpression {
        constructor(range, expression) {
            this.range = range;
            this.expression = expression;
        }
    };
    exports.EvaluatableExpression = EvaluatableExpression;
    exports.EvaluatableExpression = EvaluatableExpression = __decorate([
        es5ClassCompat
    ], EvaluatableExpression);
    var InlineCompletionTriggerKind;
    (function (InlineCompletionTriggerKind) {
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Invoke"] = 0] = "Invoke";
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 1] = "Automatic";
    })(InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = InlineCompletionTriggerKind = {}));
    let InlineValueText = class InlineValueText {
        constructor(range, text) {
            this.range = range;
            this.text = text;
        }
    };
    exports.InlineValueText = InlineValueText;
    exports.InlineValueText = InlineValueText = __decorate([
        es5ClassCompat
    ], InlineValueText);
    let InlineValueVariableLookup = class InlineValueVariableLookup {
        constructor(range, variableName, caseSensitiveLookup = true) {
            this.range = range;
            this.variableName = variableName;
            this.caseSensitiveLookup = caseSensitiveLookup;
        }
    };
    exports.InlineValueVariableLookup = InlineValueVariableLookup;
    exports.InlineValueVariableLookup = InlineValueVariableLookup = __decorate([
        es5ClassCompat
    ], InlineValueVariableLookup);
    let InlineValueEvaluatableExpression = class InlineValueEvaluatableExpression {
        constructor(range, expression) {
            this.range = range;
            this.expression = expression;
        }
    };
    exports.InlineValueEvaluatableExpression = InlineValueEvaluatableExpression;
    exports.InlineValueEvaluatableExpression = InlineValueEvaluatableExpression = __decorate([
        es5ClassCompat
    ], InlineValueEvaluatableExpression);
    let InlineValueContext = class InlineValueContext {
        constructor(frameId, range) {
            this.frameId = frameId;
            this.stoppedLocation = range;
        }
    };
    exports.InlineValueContext = InlineValueContext;
    exports.InlineValueContext = InlineValueContext = __decorate([
        es5ClassCompat
    ], InlineValueContext);
    var NewSymbolNameTag;
    (function (NewSymbolNameTag) {
        NewSymbolNameTag[NewSymbolNameTag["AIGenerated"] = 1] = "AIGenerated";
    })(NewSymbolNameTag || (exports.NewSymbolNameTag = NewSymbolNameTag = {}));
    var NewSymbolNameTriggerKind;
    (function (NewSymbolNameTriggerKind) {
        NewSymbolNameTriggerKind[NewSymbolNameTriggerKind["Invoke"] = 0] = "Invoke";
        NewSymbolNameTriggerKind[NewSymbolNameTriggerKind["Automatic"] = 1] = "Automatic";
    })(NewSymbolNameTriggerKind || (exports.NewSymbolNameTriggerKind = NewSymbolNameTriggerKind = {}));
    class NewSymbolName {
        constructor(newSymbolName, tags) {
            this.newSymbolName = newSymbolName;
            this.tags = tags;
        }
    }
    exports.NewSymbolName = NewSymbolName;
    //#region file api
    var FileChangeType;
    (function (FileChangeType) {
        FileChangeType[FileChangeType["Changed"] = 1] = "Changed";
        FileChangeType[FileChangeType["Created"] = 2] = "Created";
        FileChangeType[FileChangeType["Deleted"] = 3] = "Deleted";
    })(FileChangeType || (exports.FileChangeType = FileChangeType = {}));
    let FileSystemError = FileSystemError_1 = class FileSystemError extends Error {
        static FileExists(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileExists, FileSystemError_1.FileExists);
        }
        static FileNotFound(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileNotFound, FileSystemError_1.FileNotFound);
        }
        static FileNotADirectory(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileNotADirectory, FileSystemError_1.FileNotADirectory);
        }
        static FileIsADirectory(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileIsADirectory, FileSystemError_1.FileIsADirectory);
        }
        static NoPermissions(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.NoPermissions, FileSystemError_1.NoPermissions);
        }
        static Unavailable(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.Unavailable, FileSystemError_1.Unavailable);
        }
        constructor(uriOrMessage, code = files_1.FileSystemProviderErrorCode.Unknown, terminator) {
            super(uri_1.URI.isUri(uriOrMessage) ? uriOrMessage.toString(true) : uriOrMessage);
            this.code = terminator?.name ?? 'Unknown';
            // mark the error as file system provider error so that
            // we can extract the error code on the receiving side
            (0, files_1.markAsFileSystemProviderError)(this, code);
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, FileSystemError_1.prototype);
            if (typeof Error.captureStackTrace === 'function' && typeof terminator === 'function') {
                // nice stack traces
                Error.captureStackTrace(this, terminator);
            }
        }
    };
    exports.FileSystemError = FileSystemError;
    exports.FileSystemError = FileSystemError = FileSystemError_1 = __decorate([
        es5ClassCompat
    ], FileSystemError);
    //#endregion
    //#region folding api
    let FoldingRange = class FoldingRange {
        constructor(start, end, kind) {
            this.start = start;
            this.end = end;
            this.kind = kind;
        }
    };
    exports.FoldingRange = FoldingRange;
    exports.FoldingRange = FoldingRange = __decorate([
        es5ClassCompat
    ], FoldingRange);
    var FoldingRangeKind;
    (function (FoldingRangeKind) {
        FoldingRangeKind[FoldingRangeKind["Comment"] = 1] = "Comment";
        FoldingRangeKind[FoldingRangeKind["Imports"] = 2] = "Imports";
        FoldingRangeKind[FoldingRangeKind["Region"] = 3] = "Region";
    })(FoldingRangeKind || (exports.FoldingRangeKind = FoldingRangeKind = {}));
    //#endregion
    //#region Comment
    var CommentThreadCollapsibleState;
    (function (CommentThreadCollapsibleState) {
        /**
         * Determines an item is collapsed
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Collapsed"] = 0] = "Collapsed";
        /**
         * Determines an item is expanded
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Expanded"] = 1] = "Expanded";
    })(CommentThreadCollapsibleState || (exports.CommentThreadCollapsibleState = CommentThreadCollapsibleState = {}));
    var CommentMode;
    (function (CommentMode) {
        CommentMode[CommentMode["Editing"] = 0] = "Editing";
        CommentMode[CommentMode["Preview"] = 1] = "Preview";
    })(CommentMode || (exports.CommentMode = CommentMode = {}));
    var CommentState;
    (function (CommentState) {
        CommentState[CommentState["Published"] = 0] = "Published";
        CommentState[CommentState["Draft"] = 1] = "Draft";
    })(CommentState || (exports.CommentState = CommentState = {}));
    var CommentThreadState;
    (function (CommentThreadState) {
        CommentThreadState[CommentThreadState["Unresolved"] = 0] = "Unresolved";
        CommentThreadState[CommentThreadState["Resolved"] = 1] = "Resolved";
    })(CommentThreadState || (exports.CommentThreadState = CommentThreadState = {}));
    var CommentThreadApplicability;
    (function (CommentThreadApplicability) {
        CommentThreadApplicability[CommentThreadApplicability["Current"] = 0] = "Current";
        CommentThreadApplicability[CommentThreadApplicability["Outdated"] = 1] = "Outdated";
    })(CommentThreadApplicability || (exports.CommentThreadApplicability = CommentThreadApplicability = {}));
    //#endregion
    //#region Semantic Coloring
    class SemanticTokensLegend {
        constructor(tokenTypes, tokenModifiers = []) {
            this.tokenTypes = tokenTypes;
            this.tokenModifiers = tokenModifiers;
        }
    }
    exports.SemanticTokensLegend = SemanticTokensLegend;
    function isStrArrayOrUndefined(arg) {
        return ((typeof arg === 'undefined') || (0, types_1.isStringArray)(arg));
    }
    class SemanticTokensBuilder {
        constructor(legend) {
            this._prevLine = 0;
            this._prevChar = 0;
            this._dataIsSortedAndDeltaEncoded = true;
            this._data = [];
            this._dataLen = 0;
            this._tokenTypeStrToInt = new Map();
            this._tokenModifierStrToInt = new Map();
            this._hasLegend = false;
            if (legend) {
                this._hasLegend = true;
                for (let i = 0, len = legend.tokenTypes.length; i < len; i++) {
                    this._tokenTypeStrToInt.set(legend.tokenTypes[i], i);
                }
                for (let i = 0, len = legend.tokenModifiers.length; i < len; i++) {
                    this._tokenModifierStrToInt.set(legend.tokenModifiers[i], i);
                }
            }
        }
        push(arg0, arg1, arg2, arg3, arg4) {
            if (typeof arg0 === 'number' && typeof arg1 === 'number' && typeof arg2 === 'number' && typeof arg3 === 'number' && (typeof arg4 === 'number' || typeof arg4 === 'undefined')) {
                if (typeof arg4 === 'undefined') {
                    arg4 = 0;
                }
                // 1st overload
                return this._pushEncoded(arg0, arg1, arg2, arg3, arg4);
            }
            if (Range.isRange(arg0) && typeof arg1 === 'string' && isStrArrayOrUndefined(arg2)) {
                // 2nd overload
                return this._push(arg0, arg1, arg2);
            }
            throw (0, errors_1.illegalArgument)();
        }
        _push(range, tokenType, tokenModifiers) {
            if (!this._hasLegend) {
                throw new Error('Legend must be provided in constructor');
            }
            if (range.start.line !== range.end.line) {
                throw new Error('`range` cannot span multiple lines');
            }
            if (!this._tokenTypeStrToInt.has(tokenType)) {
                throw new Error('`tokenType` is not in the provided legend');
            }
            const line = range.start.line;
            const char = range.start.character;
            const length = range.end.character - range.start.character;
            const nTokenType = this._tokenTypeStrToInt.get(tokenType);
            let nTokenModifiers = 0;
            if (tokenModifiers) {
                for (const tokenModifier of tokenModifiers) {
                    if (!this._tokenModifierStrToInt.has(tokenModifier)) {
                        throw new Error('`tokenModifier` is not in the provided legend');
                    }
                    const nTokenModifier = this._tokenModifierStrToInt.get(tokenModifier);
                    nTokenModifiers |= (1 << nTokenModifier) >>> 0;
                }
            }
            this._pushEncoded(line, char, length, nTokenType, nTokenModifiers);
        }
        _pushEncoded(line, char, length, tokenType, tokenModifiers) {
            if (this._dataIsSortedAndDeltaEncoded && (line < this._prevLine || (line === this._prevLine && char < this._prevChar))) {
                // push calls were ordered and are no longer ordered
                this._dataIsSortedAndDeltaEncoded = false;
                // Remove delta encoding from data
                const tokenCount = (this._data.length / 5) | 0;
                let prevLine = 0;
                let prevChar = 0;
                for (let i = 0; i < tokenCount; i++) {
                    let line = this._data[5 * i];
                    let char = this._data[5 * i + 1];
                    if (line === 0) {
                        // on the same line as previous token
                        line = prevLine;
                        char += prevChar;
                    }
                    else {
                        // on a different line than previous token
                        line += prevLine;
                    }
                    this._data[5 * i] = line;
                    this._data[5 * i + 1] = char;
                    prevLine = line;
                    prevChar = char;
                }
            }
            let pushLine = line;
            let pushChar = char;
            if (this._dataIsSortedAndDeltaEncoded && this._dataLen > 0) {
                pushLine -= this._prevLine;
                if (pushLine === 0) {
                    pushChar -= this._prevChar;
                }
            }
            this._data[this._dataLen++] = pushLine;
            this._data[this._dataLen++] = pushChar;
            this._data[this._dataLen++] = length;
            this._data[this._dataLen++] = tokenType;
            this._data[this._dataLen++] = tokenModifiers;
            this._prevLine = line;
            this._prevChar = char;
        }
        static _sortAndDeltaEncode(data) {
            const pos = [];
            const tokenCount = (data.length / 5) | 0;
            for (let i = 0; i < tokenCount; i++) {
                pos[i] = i;
            }
            pos.sort((a, b) => {
                const aLine = data[5 * a];
                const bLine = data[5 * b];
                if (aLine === bLine) {
                    const aChar = data[5 * a + 1];
                    const bChar = data[5 * b + 1];
                    return aChar - bChar;
                }
                return aLine - bLine;
            });
            const result = new Uint32Array(data.length);
            let prevLine = 0;
            let prevChar = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 5 * pos[i];
                const line = data[srcOffset + 0];
                const char = data[srcOffset + 1];
                const length = data[srcOffset + 2];
                const tokenType = data[srcOffset + 3];
                const tokenModifiers = data[srcOffset + 4];
                const pushLine = line - prevLine;
                const pushChar = (pushLine === 0 ? char - prevChar : char);
                const dstOffset = 5 * i;
                result[dstOffset + 0] = pushLine;
                result[dstOffset + 1] = pushChar;
                result[dstOffset + 2] = length;
                result[dstOffset + 3] = tokenType;
                result[dstOffset + 4] = tokenModifiers;
                prevLine = line;
                prevChar = char;
            }
            return result;
        }
        build(resultId) {
            if (!this._dataIsSortedAndDeltaEncoded) {
                return new SemanticTokens(SemanticTokensBuilder._sortAndDeltaEncode(this._data), resultId);
            }
            return new SemanticTokens(new Uint32Array(this._data), resultId);
        }
    }
    exports.SemanticTokensBuilder = SemanticTokensBuilder;
    class SemanticTokens {
        constructor(data, resultId) {
            this.resultId = resultId;
            this.data = data;
        }
    }
    exports.SemanticTokens = SemanticTokens;
    class SemanticTokensEdit {
        constructor(start, deleteCount, data) {
            this.start = start;
            this.deleteCount = deleteCount;
            this.data = data;
        }
    }
    exports.SemanticTokensEdit = SemanticTokensEdit;
    class SemanticTokensEdits {
        constructor(edits, resultId) {
            this.resultId = resultId;
            this.edits = edits;
        }
    }
    exports.SemanticTokensEdits = SemanticTokensEdits;
    //#endregion
    //#region debug
    var DebugConsoleMode;
    (function (DebugConsoleMode) {
        /**
         * Debug session should have a separate debug console.
         */
        DebugConsoleMode[DebugConsoleMode["Separate"] = 0] = "Separate";
        /**
         * Debug session should share debug console with its parent session.
         * This value has no effect for sessions which do not have a parent session.
         */
        DebugConsoleMode[DebugConsoleMode["MergeWithParent"] = 1] = "MergeWithParent";
    })(DebugConsoleMode || (exports.DebugConsoleMode = DebugConsoleMode = {}));
    class DebugVisualization {
        constructor(name) {
            this.name = name;
        }
    }
    exports.DebugVisualization = DebugVisualization;
    //#endregion
    let QuickInputButtons = class QuickInputButtons {
        static { this.Back = { iconPath: new ThemeIcon('arrow-left') }; }
        constructor() { }
    };
    exports.QuickInputButtons = QuickInputButtons;
    exports.QuickInputButtons = QuickInputButtons = __decorate([
        es5ClassCompat
    ], QuickInputButtons);
    var QuickPickItemKind;
    (function (QuickPickItemKind) {
        QuickPickItemKind[QuickPickItemKind["Separator"] = -1] = "Separator";
        QuickPickItemKind[QuickPickItemKind["Default"] = 0] = "Default";
    })(QuickPickItemKind || (exports.QuickPickItemKind = QuickPickItemKind = {}));
    var InputBoxValidationSeverity;
    (function (InputBoxValidationSeverity) {
        InputBoxValidationSeverity[InputBoxValidationSeverity["Info"] = 1] = "Info";
        InputBoxValidationSeverity[InputBoxValidationSeverity["Warning"] = 2] = "Warning";
        InputBoxValidationSeverity[InputBoxValidationSeverity["Error"] = 3] = "Error";
    })(InputBoxValidationSeverity || (exports.InputBoxValidationSeverity = InputBoxValidationSeverity = {}));
    var ExtensionKind;
    (function (ExtensionKind) {
        ExtensionKind[ExtensionKind["UI"] = 1] = "UI";
        ExtensionKind[ExtensionKind["Workspace"] = 2] = "Workspace";
    })(ExtensionKind || (exports.ExtensionKind = ExtensionKind = {}));
    class FileDecoration {
        static validate(d) {
            if (typeof d.badge === 'string') {
                let len = (0, strings_1.nextCharLength)(d.badge, 0);
                if (len < d.badge.length) {
                    len += (0, strings_1.nextCharLength)(d.badge, len);
                }
                if (d.badge.length > len) {
                    throw new Error(`The 'badge'-property must be undefined or a short character`);
                }
            }
            else if (d.badge) {
                if (!ThemeIcon.isThemeIcon(d.badge)) {
                    throw new Error(`The 'badge'-property is not a valid ThemeIcon`);
                }
            }
            if (!d.color && !d.badge && !d.tooltip) {
                throw new Error(`The decoration is empty`);
            }
            return true;
        }
        constructor(badge, tooltip, color) {
            this.badge = badge;
            this.tooltip = tooltip;
            this.color = color;
        }
    }
    exports.FileDecoration = FileDecoration;
    //#region Theming
    let ColorTheme = class ColorTheme {
        constructor(kind) {
            this.kind = kind;
        }
    };
    exports.ColorTheme = ColorTheme;
    exports.ColorTheme = ColorTheme = __decorate([
        es5ClassCompat
    ], ColorTheme);
    var ColorThemeKind;
    (function (ColorThemeKind) {
        ColorThemeKind[ColorThemeKind["Light"] = 1] = "Light";
        ColorThemeKind[ColorThemeKind["Dark"] = 2] = "Dark";
        ColorThemeKind[ColorThemeKind["HighContrast"] = 3] = "HighContrast";
        ColorThemeKind[ColorThemeKind["HighContrastLight"] = 4] = "HighContrastLight";
    })(ColorThemeKind || (exports.ColorThemeKind = ColorThemeKind = {}));
    //#endregion Theming
    //#region Notebook
    class NotebookRange {
        static isNotebookRange(thing) {
            if (thing instanceof NotebookRange) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.start === 'number'
                && typeof thing.end === 'number';
        }
        get start() {
            return this._start;
        }
        get end() {
            return this._end;
        }
        get isEmpty() {
            return this._start === this._end;
        }
        constructor(start, end) {
            if (start < 0) {
                throw (0, errors_1.illegalArgument)('start must be positive');
            }
            if (end < 0) {
                throw (0, errors_1.illegalArgument)('end must be positive');
            }
            if (start <= end) {
                this._start = start;
                this._end = end;
            }
            else {
                this._start = end;
                this._end = start;
            }
        }
        with(change) {
            let start = this._start;
            let end = this._end;
            if (change.start !== undefined) {
                start = change.start;
            }
            if (change.end !== undefined) {
                end = change.end;
            }
            if (start === this._start && end === this._end) {
                return this;
            }
            return new NotebookRange(start, end);
        }
    }
    exports.NotebookRange = NotebookRange;
    class NotebookCellData {
        static validate(data) {
            if (typeof data.kind !== 'number') {
                throw new Error('NotebookCellData MUST have \'kind\' property');
            }
            if (typeof data.value !== 'string') {
                throw new Error('NotebookCellData MUST have \'value\' property');
            }
            if (typeof data.languageId !== 'string') {
                throw new Error('NotebookCellData MUST have \'languageId\' property');
            }
        }
        static isNotebookCellDataArray(value) {
            return Array.isArray(value) && value.every(elem => NotebookCellData.isNotebookCellData(elem));
        }
        static isNotebookCellData(value) {
            // return value instanceof NotebookCellData;
            return true;
        }
        constructor(kind, value, languageId, mime, outputs, metadata, executionSummary) {
            this.kind = kind;
            this.value = value;
            this.languageId = languageId;
            this.mime = mime;
            this.outputs = outputs ?? [];
            this.metadata = metadata;
            this.executionSummary = executionSummary;
            NotebookCellData.validate(this);
        }
    }
    exports.NotebookCellData = NotebookCellData;
    class NotebookData {
        constructor(cells) {
            this.cells = cells;
        }
    }
    exports.NotebookData = NotebookData;
    class NotebookCellOutputItem {
        static isNotebookCellOutputItem(obj) {
            if (obj instanceof NotebookCellOutputItem) {
                return true;
            }
            if (!obj) {
                return false;
            }
            return typeof obj.mime === 'string'
                && obj.data instanceof Uint8Array;
        }
        static error(err) {
            const obj = {
                name: err.name,
                message: err.message,
                stack: err.stack
            };
            return NotebookCellOutputItem.json(obj, 'application/vnd.code.notebook.error');
        }
        static stdout(value) {
            return NotebookCellOutputItem.text(value, 'application/vnd.code.notebook.stdout');
        }
        static stderr(value) {
            return NotebookCellOutputItem.text(value, 'application/vnd.code.notebook.stderr');
        }
        static bytes(value, mime = 'application/octet-stream') {
            return new NotebookCellOutputItem(value, mime);
        }
        static #encoder = new TextEncoder();
        static text(value, mime = mime_1.Mimes.text) {
            const bytes = NotebookCellOutputItem.#encoder.encode(String(value));
            return new NotebookCellOutputItem(bytes, mime);
        }
        static json(value, mime = 'text/x-json') {
            const rawStr = JSON.stringify(value, undefined, '\t');
            return NotebookCellOutputItem.text(rawStr, mime);
        }
        constructor(data, mime) {
            this.data = data;
            this.mime = mime;
            const mimeNormalized = (0, mime_1.normalizeMimeType)(mime, true);
            if (!mimeNormalized) {
                throw new Error(`INVALID mime type: ${mime}. Must be in the format "type/subtype[;optionalparameter]"`);
            }
            this.mime = mimeNormalized;
        }
    }
    exports.NotebookCellOutputItem = NotebookCellOutputItem;
    class NotebookCellOutput {
        static isNotebookCellOutput(candidate) {
            if (candidate instanceof NotebookCellOutput) {
                return true;
            }
            if (!candidate || typeof candidate !== 'object') {
                return false;
            }
            return typeof candidate.id === 'string' && Array.isArray(candidate.items);
        }
        static ensureUniqueMimeTypes(items, warn = false) {
            const seen = new Set();
            const removeIdx = new Set();
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const normalMime = (0, mime_1.normalizeMimeType)(item.mime);
                // We can have multiple text stream mime types in the same output.
                if (!seen.has(normalMime) || (0, notebookCommon_1.isTextStreamMime)(normalMime)) {
                    seen.add(normalMime);
                    continue;
                }
                // duplicated mime types... first has won
                removeIdx.add(i);
                if (warn) {
                    console.warn(`DUPLICATED mime type '${item.mime}' will be dropped`);
                }
            }
            if (removeIdx.size === 0) {
                return items;
            }
            return items.filter((_item, index) => !removeIdx.has(index));
        }
        constructor(items, idOrMetadata, metadata) {
            this.items = NotebookCellOutput.ensureUniqueMimeTypes(items, true);
            if (typeof idOrMetadata === 'string') {
                this.id = idOrMetadata;
                this.metadata = metadata;
            }
            else {
                this.id = (0, uuid_1.generateUuid)();
                this.metadata = idOrMetadata ?? metadata;
            }
        }
    }
    exports.NotebookCellOutput = NotebookCellOutput;
    var NotebookCellKind;
    (function (NotebookCellKind) {
        NotebookCellKind[NotebookCellKind["Markup"] = 1] = "Markup";
        NotebookCellKind[NotebookCellKind["Code"] = 2] = "Code";
    })(NotebookCellKind || (exports.NotebookCellKind = NotebookCellKind = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        NotebookCellExecutionState[NotebookCellExecutionState["Idle"] = 1] = "Idle";
        NotebookCellExecutionState[NotebookCellExecutionState["Pending"] = 2] = "Pending";
        NotebookCellExecutionState[NotebookCellExecutionState["Executing"] = 3] = "Executing";
    })(NotebookCellExecutionState || (exports.NotebookCellExecutionState = NotebookCellExecutionState = {}));
    var NotebookCellStatusBarAlignment;
    (function (NotebookCellStatusBarAlignment) {
        NotebookCellStatusBarAlignment[NotebookCellStatusBarAlignment["Left"] = 1] = "Left";
        NotebookCellStatusBarAlignment[NotebookCellStatusBarAlignment["Right"] = 2] = "Right";
    })(NotebookCellStatusBarAlignment || (exports.NotebookCellStatusBarAlignment = NotebookCellStatusBarAlignment = {}));
    var NotebookEditorRevealType;
    (function (NotebookEditorRevealType) {
        NotebookEditorRevealType[NotebookEditorRevealType["Default"] = 0] = "Default";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenter"] = 1] = "InCenter";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        NotebookEditorRevealType[NotebookEditorRevealType["AtTop"] = 3] = "AtTop";
    })(NotebookEditorRevealType || (exports.NotebookEditorRevealType = NotebookEditorRevealType = {}));
    class NotebookCellStatusBarItem {
        constructor(text, alignment) {
            this.text = text;
            this.alignment = alignment;
        }
    }
    exports.NotebookCellStatusBarItem = NotebookCellStatusBarItem;
    var NotebookControllerAffinity;
    (function (NotebookControllerAffinity) {
        NotebookControllerAffinity[NotebookControllerAffinity["Default"] = 1] = "Default";
        NotebookControllerAffinity[NotebookControllerAffinity["Preferred"] = 2] = "Preferred";
    })(NotebookControllerAffinity || (exports.NotebookControllerAffinity = NotebookControllerAffinity = {}));
    var NotebookControllerAffinity2;
    (function (NotebookControllerAffinity2) {
        NotebookControllerAffinity2[NotebookControllerAffinity2["Default"] = 1] = "Default";
        NotebookControllerAffinity2[NotebookControllerAffinity2["Preferred"] = 2] = "Preferred";
        NotebookControllerAffinity2[NotebookControllerAffinity2["Hidden"] = -1] = "Hidden";
    })(NotebookControllerAffinity2 || (exports.NotebookControllerAffinity2 = NotebookControllerAffinity2 = {}));
    class NotebookRendererScript {
        constructor(uri, provides = []) {
            this.uri = uri;
            this.provides = (0, arrays_1.asArray)(provides);
        }
    }
    exports.NotebookRendererScript = NotebookRendererScript;
    class NotebookKernelSourceAction {
        constructor(label) {
            this.label = label;
        }
    }
    exports.NotebookKernelSourceAction = NotebookKernelSourceAction;
    var NotebookVariablesRequestKind;
    (function (NotebookVariablesRequestKind) {
        NotebookVariablesRequestKind[NotebookVariablesRequestKind["Named"] = 1] = "Named";
        NotebookVariablesRequestKind[NotebookVariablesRequestKind["Indexed"] = 2] = "Indexed";
    })(NotebookVariablesRequestKind || (exports.NotebookVariablesRequestKind = NotebookVariablesRequestKind = {}));
    //#endregion
    //#region Timeline
    let TimelineItem = class TimelineItem {
        constructor(label, timestamp) {
            this.label = label;
            this.timestamp = timestamp;
        }
    };
    exports.TimelineItem = TimelineItem;
    exports.TimelineItem = TimelineItem = __decorate([
        es5ClassCompat
    ], TimelineItem);
    //#endregion Timeline
    //#region ExtensionContext
    var ExtensionMode;
    (function (ExtensionMode) {
        /**
         * The extension is installed normally (for example, from the marketplace
         * or VSIX) in VS Code.
         */
        ExtensionMode[ExtensionMode["Production"] = 1] = "Production";
        /**
         * The extension is running from an `--extensionDevelopmentPath` provided
         * when launching VS Code.
         */
        ExtensionMode[ExtensionMode["Development"] = 2] = "Development";
        /**
         * The extension is running from an `--extensionDevelopmentPath` and
         * the extension host is running unit tests.
         */
        ExtensionMode[ExtensionMode["Test"] = 3] = "Test";
    })(ExtensionMode || (exports.ExtensionMode = ExtensionMode = {}));
    var ExtensionRuntime;
    (function (ExtensionRuntime) {
        /**
         * The extension is running in a NodeJS extension host. Runtime access to NodeJS APIs is available.
         */
        ExtensionRuntime[ExtensionRuntime["Node"] = 1] = "Node";
        /**
         * The extension is running in a Webworker extension host. Runtime access is limited to Webworker APIs.
         */
        ExtensionRuntime[ExtensionRuntime["Webworker"] = 2] = "Webworker";
    })(ExtensionRuntime || (exports.ExtensionRuntime = ExtensionRuntime = {}));
    //#endregion ExtensionContext
    var StandardTokenType;
    (function (StandardTokenType) {
        StandardTokenType[StandardTokenType["Other"] = 0] = "Other";
        StandardTokenType[StandardTokenType["Comment"] = 1] = "Comment";
        StandardTokenType[StandardTokenType["String"] = 2] = "String";
        StandardTokenType[StandardTokenType["RegEx"] = 3] = "RegEx";
    })(StandardTokenType || (exports.StandardTokenType = StandardTokenType = {}));
    class LinkedEditingRanges {
        constructor(ranges, wordPattern) {
            this.ranges = ranges;
            this.wordPattern = wordPattern;
        }
    }
    exports.LinkedEditingRanges = LinkedEditingRanges;
    //#region ports
    class PortAttributes {
        constructor(autoForwardAction) {
            this._autoForwardAction = autoForwardAction;
        }
        get autoForwardAction() {
            return this._autoForwardAction;
        }
    }
    exports.PortAttributes = PortAttributes;
    //#endregion ports
    //#region Testing
    var TestResultState;
    (function (TestResultState) {
        TestResultState[TestResultState["Queued"] = 1] = "Queued";
        TestResultState[TestResultState["Running"] = 2] = "Running";
        TestResultState[TestResultState["Passed"] = 3] = "Passed";
        TestResultState[TestResultState["Failed"] = 4] = "Failed";
        TestResultState[TestResultState["Skipped"] = 5] = "Skipped";
        TestResultState[TestResultState["Errored"] = 6] = "Errored";
    })(TestResultState || (exports.TestResultState = TestResultState = {}));
    var TestRunProfileKind;
    (function (TestRunProfileKind) {
        TestRunProfileKind[TestRunProfileKind["Run"] = 1] = "Run";
        TestRunProfileKind[TestRunProfileKind["Debug"] = 2] = "Debug";
        TestRunProfileKind[TestRunProfileKind["Coverage"] = 3] = "Coverage";
    })(TestRunProfileKind || (exports.TestRunProfileKind = TestRunProfileKind = {}));
    let TestRunRequest = class TestRunRequest {
        constructor(include = undefined, exclude = undefined, profile = undefined, continuous = false, preserveFocus = true) {
            this.include = include;
            this.exclude = exclude;
            this.profile = profile;
            this.continuous = continuous;
            this.preserveFocus = preserveFocus;
        }
    };
    exports.TestRunRequest = TestRunRequest;
    exports.TestRunRequest = TestRunRequest = __decorate([
        es5ClassCompat
    ], TestRunRequest);
    let TestMessage = TestMessage_1 = class TestMessage {
        static diff(message, expected, actual) {
            const msg = new TestMessage_1(message);
            msg.expectedOutput = expected;
            msg.actualOutput = actual;
            return msg;
        }
        constructor(message) {
            this.message = message;
        }
    };
    exports.TestMessage = TestMessage;
    exports.TestMessage = TestMessage = TestMessage_1 = __decorate([
        es5ClassCompat
    ], TestMessage);
    let TestTag = class TestTag {
        constructor(id) {
            this.id = id;
        }
    };
    exports.TestTag = TestTag;
    exports.TestTag = TestTag = __decorate([
        es5ClassCompat
    ], TestTag);
    //#endregion
    //#region Test Coverage
    class TestCoverageCount {
        constructor(covered, total) {
            this.covered = covered;
            this.total = total;
            validateTestCoverageCount(this);
        }
    }
    exports.TestCoverageCount = TestCoverageCount;
    function validateTestCoverageCount(cc) {
        if (!cc) {
            return;
        }
        if (cc.covered > cc.total) {
            throw new Error(`The total number of covered items (${cc.covered}) cannot be greater than the total (${cc.total})`);
        }
        if (cc.total < 0) {
            throw new Error(`The number of covered items (${cc.total}) cannot be negative`);
        }
    }
    class FileCoverage {
        static fromDetails(uri, details) {
            const statements = new TestCoverageCount(0, 0);
            const branches = new TestCoverageCount(0, 0);
            const decl = new TestCoverageCount(0, 0);
            for (const detail of details) {
                if ('branches' in detail) {
                    statements.total += 1;
                    statements.covered += detail.executed ? 1 : 0;
                    for (const branch of detail.branches) {
                        branches.total += 1;
                        branches.covered += branch.executed ? 1 : 0;
                    }
                }
                else {
                    decl.total += 1;
                    decl.covered += detail.executed ? 1 : 0;
                }
            }
            const coverage = new FileCoverage(uri, statements, branches.total > 0 ? branches : undefined, decl.total > 0 ? decl : undefined);
            coverage.detailedCoverage = details;
            return coverage;
        }
        constructor(uri, statementCoverage, branchCoverage, declarationCoverage) {
            this.uri = uri;
            this.statementCoverage = statementCoverage;
            this.branchCoverage = branchCoverage;
            this.declarationCoverage = declarationCoverage;
        }
    }
    exports.FileCoverage = FileCoverage;
    class StatementCoverage {
        // back compat until finalization:
        get executionCount() { return +this.executed; }
        set executionCount(n) { this.executed = n; }
        constructor(executed, location, branches = []) {
            this.executed = executed;
            this.location = location;
            this.branches = branches;
        }
    }
    exports.StatementCoverage = StatementCoverage;
    class BranchCoverage {
        // back compat until finalization:
        get executionCount() { return +this.executed; }
        set executionCount(n) { this.executed = n; }
        constructor(executed, location, label) {
            this.executed = executed;
            this.location = location;
            this.label = label;
        }
    }
    exports.BranchCoverage = BranchCoverage;
    class DeclarationCoverage {
        // back compat until finalization:
        get executionCount() { return +this.executed; }
        set executionCount(n) { this.executed = n; }
        constructor(name, executed, location) {
            this.name = name;
            this.executed = executed;
            this.location = location;
        }
    }
    exports.DeclarationCoverage = DeclarationCoverage;
    //#endregion
    var ExternalUriOpenerPriority;
    (function (ExternalUriOpenerPriority) {
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["None"] = 0] = "None";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Option"] = 1] = "Option";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Default"] = 2] = "Default";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Preferred"] = 3] = "Preferred";
    })(ExternalUriOpenerPriority || (exports.ExternalUriOpenerPriority = ExternalUriOpenerPriority = {}));
    var WorkspaceTrustState;
    (function (WorkspaceTrustState) {
        WorkspaceTrustState[WorkspaceTrustState["Untrusted"] = 0] = "Untrusted";
        WorkspaceTrustState[WorkspaceTrustState["Trusted"] = 1] = "Trusted";
        WorkspaceTrustState[WorkspaceTrustState["Unspecified"] = 2] = "Unspecified";
    })(WorkspaceTrustState || (exports.WorkspaceTrustState = WorkspaceTrustState = {}));
    var PortAutoForwardAction;
    (function (PortAutoForwardAction) {
        PortAutoForwardAction[PortAutoForwardAction["Notify"] = 1] = "Notify";
        PortAutoForwardAction[PortAutoForwardAction["OpenBrowser"] = 2] = "OpenBrowser";
        PortAutoForwardAction[PortAutoForwardAction["OpenPreview"] = 3] = "OpenPreview";
        PortAutoForwardAction[PortAutoForwardAction["Silent"] = 4] = "Silent";
        PortAutoForwardAction[PortAutoForwardAction["Ignore"] = 5] = "Ignore";
        PortAutoForwardAction[PortAutoForwardAction["OpenBrowserOnce"] = 6] = "OpenBrowserOnce";
    })(PortAutoForwardAction || (exports.PortAutoForwardAction = PortAutoForwardAction = {}));
    class TypeHierarchyItem {
        constructor(kind, name, detail, uri, range, selectionRange) {
            this.kind = kind;
            this.name = name;
            this.detail = detail;
            this.uri = uri;
            this.range = range;
            this.selectionRange = selectionRange;
        }
    }
    exports.TypeHierarchyItem = TypeHierarchyItem;
    //#region Tab Inputs
    class TextTabInput {
        constructor(uri) {
            this.uri = uri;
        }
    }
    exports.TextTabInput = TextTabInput;
    class TextDiffTabInput {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
        }
    }
    exports.TextDiffTabInput = TextDiffTabInput;
    class TextMergeTabInput {
        constructor(base, input1, input2, result) {
            this.base = base;
            this.input1 = input1;
            this.input2 = input2;
            this.result = result;
        }
    }
    exports.TextMergeTabInput = TextMergeTabInput;
    class CustomEditorTabInput {
        constructor(uri, viewType) {
            this.uri = uri;
            this.viewType = viewType;
        }
    }
    exports.CustomEditorTabInput = CustomEditorTabInput;
    class WebviewEditorTabInput {
        constructor(viewType) {
            this.viewType = viewType;
        }
    }
    exports.WebviewEditorTabInput = WebviewEditorTabInput;
    class NotebookEditorTabInput {
        constructor(uri, notebookType) {
            this.uri = uri;
            this.notebookType = notebookType;
        }
    }
    exports.NotebookEditorTabInput = NotebookEditorTabInput;
    class NotebookDiffEditorTabInput {
        constructor(original, modified, notebookType) {
            this.original = original;
            this.modified = modified;
            this.notebookType = notebookType;
        }
    }
    exports.NotebookDiffEditorTabInput = NotebookDiffEditorTabInput;
    class TerminalEditorTabInput {
        constructor() { }
    }
    exports.TerminalEditorTabInput = TerminalEditorTabInput;
    class InteractiveWindowInput {
        constructor(uri, inputBoxUri) {
            this.uri = uri;
            this.inputBoxUri = inputBoxUri;
        }
    }
    exports.InteractiveWindowInput = InteractiveWindowInput;
    class ChatEditorTabInput {
        constructor() { }
    }
    exports.ChatEditorTabInput = ChatEditorTabInput;
    class TextMultiDiffTabInput {
        constructor(textDiffs) {
            this.textDiffs = textDiffs;
        }
    }
    exports.TextMultiDiffTabInput = TextMultiDiffTabInput;
    //#endregion
    //#region Chat
    var InteractiveSessionVoteDirection;
    (function (InteractiveSessionVoteDirection) {
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Down"] = 0] = "Down";
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Up"] = 1] = "Up";
    })(InteractiveSessionVoteDirection || (exports.InteractiveSessionVoteDirection = InteractiveSessionVoteDirection = {}));
    var ChatCopyKind;
    (function (ChatCopyKind) {
        ChatCopyKind[ChatCopyKind["Action"] = 1] = "Action";
        ChatCopyKind[ChatCopyKind["Toolbar"] = 2] = "Toolbar";
    })(ChatCopyKind || (exports.ChatCopyKind = ChatCopyKind = {}));
    var ChatVariableLevel;
    (function (ChatVariableLevel) {
        ChatVariableLevel[ChatVariableLevel["Short"] = 1] = "Short";
        ChatVariableLevel[ChatVariableLevel["Medium"] = 2] = "Medium";
        ChatVariableLevel[ChatVariableLevel["Full"] = 3] = "Full";
    })(ChatVariableLevel || (exports.ChatVariableLevel = ChatVariableLevel = {}));
    class ChatCompletionItem {
        constructor(label, values) {
            this.label = label;
            this.values = values;
        }
    }
    exports.ChatCompletionItem = ChatCompletionItem;
    //#endregion
    //#region Interactive Editor
    var InteractiveEditorResponseFeedbackKind;
    (function (InteractiveEditorResponseFeedbackKind) {
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Unhelpful"] = 0] = "Unhelpful";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Helpful"] = 1] = "Helpful";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Undone"] = 2] = "Undone";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Accepted"] = 3] = "Accepted";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Bug"] = 4] = "Bug";
    })(InteractiveEditorResponseFeedbackKind || (exports.InteractiveEditorResponseFeedbackKind = InteractiveEditorResponseFeedbackKind = {}));
    var ChatResultFeedbackKind;
    (function (ChatResultFeedbackKind) {
        ChatResultFeedbackKind[ChatResultFeedbackKind["Unhelpful"] = 0] = "Unhelpful";
        ChatResultFeedbackKind[ChatResultFeedbackKind["Helpful"] = 1] = "Helpful";
    })(ChatResultFeedbackKind || (exports.ChatResultFeedbackKind = ChatResultFeedbackKind = {}));
    class ChatResponseMarkdownPart {
        constructor(value) {
            if (typeof value !== 'string' && value.isTrusted === true) {
                throw new Error('The boolean form of MarkdownString.isTrusted is NOT supported for chat participants.');
            }
            this.value = typeof value === 'string' ? new MarkdownString(value) : value;
        }
    }
    exports.ChatResponseMarkdownPart = ChatResponseMarkdownPart;
    /**
     * TODO if 'vulnerabilities' is finalized, this should be merged with the base ChatResponseMarkdownPart. I just don't see how to do that while keeping
     * vulnerabilities in a seperate API proposal in a clean way.
     */
    class ChatResponseMarkdownWithVulnerabilitiesPart {
        constructor(value, vulnerabilities) {
            if (typeof value !== 'string' && value.isTrusted === true) {
                throw new Error('The boolean form of MarkdownString.isTrusted is NOT supported for chat participants.');
            }
            this.value = typeof value === 'string' ? new MarkdownString(value) : value;
            this.vulnerabilities = vulnerabilities;
        }
    }
    exports.ChatResponseMarkdownWithVulnerabilitiesPart = ChatResponseMarkdownWithVulnerabilitiesPart;
    class ChatResponseDetectedParticipantPart {
        constructor(participant, command) {
            this.participant = participant;
            this.command = command;
        }
    }
    exports.ChatResponseDetectedParticipantPart = ChatResponseDetectedParticipantPart;
    class ChatResponseFileTreePart {
        constructor(value, baseUri) {
            this.value = value;
            this.baseUri = baseUri;
        }
    }
    exports.ChatResponseFileTreePart = ChatResponseFileTreePart;
    class ChatResponseAnchorPart {
        constructor(value, title) {
            this.value = value;
            this.title = title;
        }
    }
    exports.ChatResponseAnchorPart = ChatResponseAnchorPart;
    class ChatResponseProgressPart {
        constructor(value) {
            this.value = value;
        }
    }
    exports.ChatResponseProgressPart = ChatResponseProgressPart;
    class ChatResponseCommandButtonPart {
        constructor(value) {
            this.value = value;
        }
    }
    exports.ChatResponseCommandButtonPart = ChatResponseCommandButtonPart;
    class ChatResponseReferencePart {
        constructor(value, iconPath) {
            this.value = value;
            this.iconPath = iconPath;
        }
    }
    exports.ChatResponseReferencePart = ChatResponseReferencePart;
    class ChatResponseTextEditPart {
        constructor(uri, edits) {
            this.uri = uri;
            this.edits = Array.isArray(edits) ? edits : [edits];
        }
    }
    exports.ChatResponseTextEditPart = ChatResponseTextEditPart;
    class ChatRequestTurn {
        constructor(prompt, command, variables, participant) {
            this.prompt = prompt;
            this.command = command;
            this.variables = variables;
            this.participant = participant;
        }
    }
    exports.ChatRequestTurn = ChatRequestTurn;
    class ChatResponseTurn {
        constructor(response, result, participant, command) {
            this.response = response;
            this.result = result;
            this.participant = participant;
            this.command = command;
        }
    }
    exports.ChatResponseTurn = ChatResponseTurn;
    var ChatLocation;
    (function (ChatLocation) {
        ChatLocation[ChatLocation["Panel"] = 1] = "Panel";
        ChatLocation[ChatLocation["Terminal"] = 2] = "Terminal";
        ChatLocation[ChatLocation["Notebook"] = 3] = "Notebook";
        ChatLocation[ChatLocation["Editor"] = 4] = "Editor";
    })(ChatLocation || (exports.ChatLocation = ChatLocation = {}));
    class LanguageModelChatSystemMessage {
        constructor(content) {
            this.content = content;
        }
    }
    exports.LanguageModelChatSystemMessage = LanguageModelChatSystemMessage;
    class LanguageModelChatUserMessage {
        constructor(content, name) {
            this.content = content;
            this.name = name;
        }
    }
    exports.LanguageModelChatUserMessage = LanguageModelChatUserMessage;
    class LanguageModelChatAssistantMessage {
        constructor(content, name) {
            this.content = content;
            this.name = name;
        }
    }
    exports.LanguageModelChatAssistantMessage = LanguageModelChatAssistantMessage;
    class LanguageModelError extends Error {
        static NotFound(message) {
            return new LanguageModelError(message, LanguageModelError.NotFound.name);
        }
        static NoPermissions(message) {
            return new LanguageModelError(message, LanguageModelError.NoPermissions.name);
        }
        constructor(message, code, cause) {
            super(message, { cause });
            this.name = 'LanguageModelError';
            this.code = code ?? '';
        }
    }
    exports.LanguageModelError = LanguageModelError;
    //#endregion
    //#region ai
    var RelatedInformationType;
    (function (RelatedInformationType) {
        RelatedInformationType[RelatedInformationType["SymbolInformation"] = 1] = "SymbolInformation";
        RelatedInformationType[RelatedInformationType["CommandInformation"] = 2] = "CommandInformation";
        RelatedInformationType[RelatedInformationType["SearchInformation"] = 3] = "SearchInformation";
        RelatedInformationType[RelatedInformationType["SettingInformation"] = 4] = "SettingInformation";
    })(RelatedInformationType || (exports.RelatedInformationType = RelatedInformationType = {}));
    //#endregion
    //#region Speech
    var SpeechToTextStatus;
    (function (SpeechToTextStatus) {
        SpeechToTextStatus[SpeechToTextStatus["Started"] = 1] = "Started";
        SpeechToTextStatus[SpeechToTextStatus["Recognizing"] = 2] = "Recognizing";
        SpeechToTextStatus[SpeechToTextStatus["Recognized"] = 3] = "Recognized";
        SpeechToTextStatus[SpeechToTextStatus["Stopped"] = 4] = "Stopped";
        SpeechToTextStatus[SpeechToTextStatus["Error"] = 5] = "Error";
    })(SpeechToTextStatus || (exports.SpeechToTextStatus = SpeechToTextStatus = {}));
    var KeywordRecognitionStatus;
    (function (KeywordRecognitionStatus) {
        KeywordRecognitionStatus[KeywordRecognitionStatus["Recognized"] = 1] = "Recognized";
        KeywordRecognitionStatus[KeywordRecognitionStatus["Stopped"] = 2] = "Stopped";
    })(KeywordRecognitionStatus || (exports.KeywordRecognitionStatus = KeywordRecognitionStatus = {}));
    //#endregion
    //#region InlineEdit
    class InlineEdit {
        constructor(text, range) {
            this.text = text;
            this.range = range;
        }
    }
    exports.InlineEdit = InlineEdit;
    var InlineEditTriggerKind;
    (function (InlineEditTriggerKind) {
        InlineEditTriggerKind[InlineEditTriggerKind["Invoke"] = 0] = "Invoke";
        InlineEditTriggerKind[InlineEditTriggerKind["Automatic"] = 1] = "Automatic";
    })(InlineEditTriggerKind || (exports.InlineEditTriggerKind = InlineEditTriggerKind = {}));
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR5cGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7SUF1ekRoRyw4REFFQztJQTBtQ0QsMENBRUM7SUEyakNELDhEQVlDO0lBdjlIRDs7Ozs7U0FLSztJQUNMLFNBQVMsY0FBYyxDQUFDLE1BQWdCO1FBQ3ZDLE1BQU0sa0JBQWtCLEdBQUc7WUFDMUIsS0FBSyxFQUFFLFVBQVUsR0FBRyxJQUFXO2dCQUM5QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDakUsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLEVBQUUsVUFBVSxHQUFHLElBQVc7Z0JBQzdCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FB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