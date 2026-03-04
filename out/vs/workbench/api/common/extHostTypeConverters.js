/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/base/common/dataTransfer", "vs/base/common/functional", "vs/base/common/htmlContent", "vs/base/common/map", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/mime", "vs/base/common/objects", "vs/base/common/prefixTree", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/platform/markers/common/markers", "vs/workbench/api/common/extHostTestingPrivateApi", "vs/workbench/common/editor", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/services/editor/common/editorService", "./extHostTypes", "vs/base/common/themables"], function (require, exports, arrays_1, buffer_1, dataTransfer_1, functional_1, htmlContent, map_1, marked_1, marshalling_1, mime_1, objects_1, prefixTree_1, resources_1, types_1, uri_1, editorRange, languages, markers_1, extHostTestingPrivateApi_1, editor_1, chatAgents_1, notebooks, testId_1, testTypes_1, editorService_1, types, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTreeItem = exports.PartialAcceptTriggerKind = exports.PartialAcceptInfo = exports.TerminalQuickFix = exports.ChatAgentUserActionEvent = exports.ChatAgentResult = exports.ChatAgentCompletionItem = exports.ChatAgentResolvedVariable = exports.ChatLocation = exports.ChatAgentRequest = exports.ChatResponsePart = exports.ChatResponseReferencePart = exports.ChatResponseTextEditPart = exports.ChatResponseCommandButtonPart = exports.ChatResponseProgressPart = exports.ChatResponseAnchorPart = exports.ChatResponseFilesPart = exports.ChatResponseDetectedParticipantPart = exports.ChatResponseMarkdownWithVulnerabilitiesPart = exports.ChatResponseMarkdownPart = exports.InteractiveEditorResponseFeedbackKind = exports.ChatVariableLevel = exports.ChatVariable = exports.LanguageModelMessage = exports.ChatInlineFollowup = exports.ChatFollowup = exports.DataTransfer = exports.DataTransferItem = exports.ViewBadge = exports.TypeHierarchyItem = exports.CodeActionTriggerKind = exports.TestCoverage = exports.TestResults = exports.TestItem = exports.TestTag = exports.TestMessage = exports.NotebookRendererScript = exports.NotebookDocumentContentOptions = exports.NotebookKernelSourceAction = exports.NotebookStatusBarItem = exports.NotebookExclusiveDocumentPattern = exports.NotebookCellOutput = exports.NotebookCellOutputItem = exports.NotebookCellData = exports.NotebookData = exports.NotebookCellKind = exports.NotebookCellExecutionState = exports.NotebookCellExecutionSummary = exports.NotebookRange = exports.MappedEditsContext = exports.LanguageSelector = exports.GlobPattern = exports.TextEditorOpenOptions = exports.FoldingRangeKind = exports.FoldingRange = exports.ProgressLocation = exports.EndOfLine = exports.TextEditorLineNumbersStyle = exports.TextDocumentSaveReason = exports.SelectionRange = exports.Color = exports.ColorPresentation = exports.DocumentLink = exports.InlayHintKind = exports.InlayHintLabelPart = exports.InlayHint = exports.SignatureHelp = exports.SignatureInformation = exports.ParameterInformation = exports.CompletionItem = exports.CompletionItemKind = exports.CompletionItemTag = exports.CompletionContext = exports.CompletionTriggerKind = exports.MultiDocumentHighlight = exports.DocumentHighlight = exports.InlineValueContext = exports.InlineValue = exports.EvaluatableExpression = exports.Hover = exports.DefinitionLink = exports.location = exports.CallHierarchyOutgoingCall = exports.CallHierarchyIncomingCall = exports.CallHierarchyItem = exports.DocumentSymbol = exports.WorkspaceSymbol = exports.SymbolTag = exports.SymbolKind = exports.WorkspaceEdit = exports.TextEdit = exports.DecorationRenderOptions = exports.DecorationRangeBehavior = exports.ThemableDecorationRenderOptions = exports.ThemableDecorationAttachmentRenderOptions = exports.MarkdownString = exports.ViewColumn = exports.DiagnosticSeverity = exports.DiagnosticRelatedInformation = exports.Diagnostic = exports.DiagnosticTag = exports.DocumentSelector = exports.Position = exports.TokenType = exports.Location = exports.Range = exports.Selection = void 0;
    exports.isDecorationOptionsArr = isDecorationOptionsArr;
    exports.fromRangeOrRangeWithMessage = fromRangeOrRangeWithMessage;
    exports.pathOrURIToURI = pathOrURIToURI;
    var Selection;
    (function (Selection) {
        function to(selection) {
            const { selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn } = selection;
            const start = new types.Position(selectionStartLineNumber - 1, selectionStartColumn - 1);
            const end = new types.Position(positionLineNumber - 1, positionColumn - 1);
            return new types.Selection(start, end);
        }
        Selection.to = to;
        function from(selection) {
            const { anchor, active } = selection;
            return {
                selectionStartLineNumber: anchor.line + 1,
                selectionStartColumn: anchor.character + 1,
                positionLineNumber: active.line + 1,
                positionColumn: active.character + 1
            };
        }
        Selection.from = from;
    })(Selection || (exports.Selection = Selection = {}));
    var Range;
    (function (Range) {
        function from(range) {
            if (!range) {
                return undefined;
            }
            const { start, end } = range;
            return {
                startLineNumber: start.line + 1,
                startColumn: start.character + 1,
                endLineNumber: end.line + 1,
                endColumn: end.character + 1
            };
        }
        Range.from = from;
        function to(range) {
            if (!range) {
                return undefined;
            }
            const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
            return new types.Range(startLineNumber - 1, startColumn - 1, endLineNumber - 1, endColumn - 1);
        }
        Range.to = to;
    })(Range || (exports.Range = Range = {}));
    var Location;
    (function (Location) {
        function from(location) {
            return {
                uri: location.uri,
                range: Range.from(location.range)
            };
        }
        Location.from = from;
        function to(location) {
            return new types.Location(uri_1.URI.revive(location.uri), Range.to(location.range));
        }
        Location.to = to;
    })(Location || (exports.Location = Location = {}));
    var TokenType;
    (function (TokenType) {
        function to(type) {
            switch (type) {
                case 1 /* encodedTokenAttributes.StandardTokenType.Comment */: return types.StandardTokenType.Comment;
                case 0 /* encodedTokenAttributes.StandardTokenType.Other */: return types.StandardTokenType.Other;
                case 3 /* encodedTokenAttributes.StandardTokenType.RegEx */: return types.StandardTokenType.RegEx;
                case 2 /* encodedTokenAttributes.StandardTokenType.String */: return types.StandardTokenType.String;
            }
        }
        TokenType.to = to;
    })(TokenType || (exports.TokenType = TokenType = {}));
    var Position;
    (function (Position) {
        function to(position) {
            return new types.Position(position.lineNumber - 1, position.column - 1);
        }
        Position.to = to;
        function from(position) {
            return { lineNumber: position.line + 1, column: position.character + 1 };
        }
        Position.from = from;
    })(Position || (exports.Position = Position = {}));
    var DocumentSelector;
    (function (DocumentSelector) {
        function from(value, uriTransformer, extension) {
            return (0, arrays_1.coalesce)((0, arrays_1.asArray)(value).map(sel => _doTransformDocumentSelector(sel, uriTransformer, extension)));
        }
        DocumentSelector.from = from;
        function _doTransformDocumentSelector(selector, uriTransformer, extension) {
            if (typeof selector === 'string') {
                return {
                    $serialized: true,
                    language: selector,
                    isBuiltin: extension?.isBuiltin,
                };
            }
            if (selector) {
                return {
                    $serialized: true,
                    language: selector.language,
                    scheme: _transformScheme(selector.scheme, uriTransformer),
                    pattern: GlobPattern.from(selector.pattern) ?? undefined,
                    exclusive: selector.exclusive,
                    notebookType: selector.notebookType,
                    isBuiltin: extension?.isBuiltin
                };
            }
            return undefined;
        }
        function _transformScheme(scheme, uriTransformer) {
            if (uriTransformer && typeof scheme === 'string') {
                return uriTransformer.transformOutgoingScheme(scheme);
            }
            return scheme;
        }
    })(DocumentSelector || (exports.DocumentSelector = DocumentSelector = {}));
    var DiagnosticTag;
    (function (DiagnosticTag) {
        function from(value) {
            switch (value) {
                case types.DiagnosticTag.Unnecessary:
                    return 1 /* MarkerTag.Unnecessary */;
                case types.DiagnosticTag.Deprecated:
                    return 2 /* MarkerTag.Deprecated */;
            }
            return undefined;
        }
        DiagnosticTag.from = from;
        function to(value) {
            switch (value) {
                case 1 /* MarkerTag.Unnecessary */:
                    return types.DiagnosticTag.Unnecessary;
                case 2 /* MarkerTag.Deprecated */:
                    return types.DiagnosticTag.Deprecated;
                default:
                    return undefined;
            }
        }
        DiagnosticTag.to = to;
    })(DiagnosticTag || (exports.DiagnosticTag = DiagnosticTag = {}));
    var Diagnostic;
    (function (Diagnostic) {
        function from(value) {
            let code;
            if (value.code) {
                if ((0, types_1.isString)(value.code) || (0, types_1.isNumber)(value.code)) {
                    code = String(value.code);
                }
                else {
                    code = {
                        value: String(value.code.value),
                        target: value.code.target,
                    };
                }
            }
            return {
                ...Range.from(value.range),
                message: value.message,
                source: value.source,
                code,
                severity: DiagnosticSeverity.from(value.severity),
                relatedInformation: value.relatedInformation && value.relatedInformation.map(DiagnosticRelatedInformation.from),
                tags: Array.isArray(value.tags) ? (0, arrays_1.coalesce)(value.tags.map(DiagnosticTag.from)) : undefined,
            };
        }
        Diagnostic.from = from;
        function to(value) {
            const res = new types.Diagnostic(Range.to(value), value.message, DiagnosticSeverity.to(value.severity));
            res.source = value.source;
            res.code = (0, types_1.isString)(value.code) ? value.code : value.code?.value;
            res.relatedInformation = value.relatedInformation && value.relatedInformation.map(DiagnosticRelatedInformation.to);
            res.tags = value.tags && (0, arrays_1.coalesce)(value.tags.map(DiagnosticTag.to));
            return res;
        }
        Diagnostic.to = to;
    })(Diagnostic || (exports.Diagnostic = Diagnostic = {}));
    var DiagnosticRelatedInformation;
    (function (DiagnosticRelatedInformation) {
        function from(value) {
            return {
                ...Range.from(value.location.range),
                message: value.message,
                resource: value.location.uri
            };
        }
        DiagnosticRelatedInformation.from = from;
        function to(value) {
            return new types.DiagnosticRelatedInformation(new types.Location(value.resource, Range.to(value)), value.message);
        }
        DiagnosticRelatedInformation.to = to;
    })(DiagnosticRelatedInformation || (exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation = {}));
    var DiagnosticSeverity;
    (function (DiagnosticSeverity) {
        function from(value) {
            switch (value) {
                case types.DiagnosticSeverity.Error:
                    return markers_1.MarkerSeverity.Error;
                case types.DiagnosticSeverity.Warning:
                    return markers_1.MarkerSeverity.Warning;
                case types.DiagnosticSeverity.Information:
                    return markers_1.MarkerSeverity.Info;
                case types.DiagnosticSeverity.Hint:
                    return markers_1.MarkerSeverity.Hint;
            }
            return markers_1.MarkerSeverity.Error;
        }
        DiagnosticSeverity.from = from;
        function to(value) {
            switch (value) {
                case markers_1.MarkerSeverity.Info:
                    return types.DiagnosticSeverity.Information;
                case markers_1.MarkerSeverity.Warning:
                    return types.DiagnosticSeverity.Warning;
                case markers_1.MarkerSeverity.Error:
                    return types.DiagnosticSeverity.Error;
                case markers_1.MarkerSeverity.Hint:
                    return types.DiagnosticSeverity.Hint;
                default:
                    return types.DiagnosticSeverity.Error;
            }
        }
        DiagnosticSeverity.to = to;
    })(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
    var ViewColumn;
    (function (ViewColumn) {
        function from(column) {
            if (typeof column === 'number' && column >= types.ViewColumn.One) {
                return column - 1; // adjust zero index (ViewColumn.ONE => 0)
            }
            if (column === types.ViewColumn.Beside) {
                return editorService_1.SIDE_GROUP;
            }
            return editorService_1.ACTIVE_GROUP; // default is always the active group
        }
        ViewColumn.from = from;
        function to(position) {
            if (typeof position === 'number' && position >= 0) {
                return position + 1; // adjust to index (ViewColumn.ONE => 1)
            }
            throw new Error(`invalid 'EditorGroupColumn'`);
        }
        ViewColumn.to = to;
    })(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
    function isDecorationOptions(something) {
        return (typeof something.range !== 'undefined');
    }
    function isDecorationOptionsArr(something) {
        if (something.length === 0) {
            return true;
        }
        return isDecorationOptions(something[0]) ? true : false;
    }
    var MarkdownString;
    (function (MarkdownString) {
        function fromMany(markup) {
            return markup.map(MarkdownString.from);
        }
        MarkdownString.fromMany = fromMany;
        function isCodeblock(thing) {
            return thing && typeof thing === 'object'
                && typeof thing.language === 'string'
                && typeof thing.value === 'string';
        }
        function from(markup) {
            let res;
            if (isCodeblock(markup)) {
                const { language, value } = markup;
                res = { value: '```' + language + '\n' + value + '\n```\n' };
            }
            else if (types.MarkdownString.isMarkdownString(markup)) {
                res = { value: markup.value, isTrusted: markup.isTrusted, supportThemeIcons: markup.supportThemeIcons, supportHtml: markup.supportHtml, baseUri: markup.baseUri };
            }
            else if (typeof markup === 'string') {
                res = { value: markup };
            }
            else {
                res = { value: '' };
            }
            // extract uris into a separate object
            const resUris = Object.create(null);
            res.uris = resUris;
            const collectUri = (href) => {
                try {
                    let uri = uri_1.URI.parse(href, true);
                    uri = uri.with({ query: _uriMassage(uri.query, resUris) });
                    resUris[href] = uri;
                }
                catch (e) {
                    // ignore
                }
                return '';
            };
            const renderer = new marked_1.marked.Renderer();
            renderer.link = collectUri;
            renderer.image = href => typeof href === 'string' ? collectUri(htmlContent.parseHrefAndDimensions(href).href) : '';
            (0, marked_1.marked)(res.value, { renderer });
            return res;
        }
        MarkdownString.from = from;
        function _uriMassage(part, bucket) {
            if (!part) {
                return part;
            }
            let data;
            try {
                data = (0, marshalling_1.parse)(part);
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            let changed = false;
            data = (0, objects_1.cloneAndChange)(data, value => {
                if (uri_1.URI.isUri(value)) {
                    const key = `__uri_${Math.random().toString(16).slice(2, 8)}`;
                    bucket[key] = value;
                    changed = true;
                    return key;
                }
                else {
                    return undefined;
                }
            });
            if (!changed) {
                return part;
            }
            return JSON.stringify(data);
        }
        function to(value) {
            const result = new types.MarkdownString(value.value, value.supportThemeIcons);
            result.isTrusted = value.isTrusted;
            result.supportHtml = value.supportHtml;
            result.baseUri = value.baseUri ? uri_1.URI.from(value.baseUri) : undefined;
            return result;
        }
        MarkdownString.to = to;
        function fromStrict(value) {
            if (!value) {
                return undefined;
            }
            return typeof value === 'string' ? value : MarkdownString.from(value);
        }
        MarkdownString.fromStrict = fromStrict;
    })(MarkdownString || (exports.MarkdownString = MarkdownString = {}));
    function fromRangeOrRangeWithMessage(ranges) {
        if (isDecorationOptionsArr(ranges)) {
            return ranges.map((r) => {
                return {
                    range: Range.from(r.range),
                    hoverMessage: Array.isArray(r.hoverMessage)
                        ? MarkdownString.fromMany(r.hoverMessage)
                        : (r.hoverMessage ? MarkdownString.from(r.hoverMessage) : undefined),
                    renderOptions: /* URI vs Uri */ r.renderOptions
                };
            });
        }
        else {
            return ranges.map((r) => {
                return {
                    range: Range.from(r)
                };
            });
        }
    }
    function pathOrURIToURI(value) {
        if (typeof value === 'undefined') {
            return value;
        }
        if (typeof value === 'string') {
            return uri_1.URI.file(value);
        }
        else {
            return value;
        }
    }
    var ThemableDecorationAttachmentRenderOptions;
    (function (ThemableDecorationAttachmentRenderOptions) {
        function from(options) {
            if (typeof options === 'undefined') {
                return options;
            }
            return {
                contentText: options.contentText,
                contentIconPath: options.contentIconPath ? pathOrURIToURI(options.contentIconPath) : undefined,
                border: options.border,
                borderColor: options.borderColor,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                color: options.color,
                backgroundColor: options.backgroundColor,
                margin: options.margin,
                width: options.width,
                height: options.height,
            };
        }
        ThemableDecorationAttachmentRenderOptions.from = from;
    })(ThemableDecorationAttachmentRenderOptions || (exports.ThemableDecorationAttachmentRenderOptions = ThemableDecorationAttachmentRenderOptions = {}));
    var ThemableDecorationRenderOptions;
    (function (ThemableDecorationRenderOptions) {
        function from(options) {
            if (typeof options === 'undefined') {
                return options;
            }
            return {
                backgroundColor: options.backgroundColor,
                outline: options.outline,
                outlineColor: options.outlineColor,
                outlineStyle: options.outlineStyle,
                outlineWidth: options.outlineWidth,
                border: options.border,
                borderColor: options.borderColor,
                borderRadius: options.borderRadius,
                borderSpacing: options.borderSpacing,
                borderStyle: options.borderStyle,
                borderWidth: options.borderWidth,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                cursor: options.cursor,
                color: options.color,
                opacity: options.opacity,
                letterSpacing: options.letterSpacing,
                gutterIconPath: options.gutterIconPath ? pathOrURIToURI(options.gutterIconPath) : undefined,
                gutterIconSize: options.gutterIconSize,
                overviewRulerColor: options.overviewRulerColor,
                before: options.before ? ThemableDecorationAttachmentRenderOptions.from(options.before) : undefined,
                after: options.after ? ThemableDecorationAttachmentRenderOptions.from(options.after) : undefined,
            };
        }
        ThemableDecorationRenderOptions.from = from;
    })(ThemableDecorationRenderOptions || (exports.ThemableDecorationRenderOptions = ThemableDecorationRenderOptions = {}));
    var DecorationRangeBehavior;
    (function (DecorationRangeBehavior) {
        function from(value) {
            if (typeof value === 'undefined') {
                return value;
            }
            switch (value) {
                case types.DecorationRangeBehavior.OpenOpen:
                    return 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */;
                case types.DecorationRangeBehavior.ClosedClosed:
                    return 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
                case types.DecorationRangeBehavior.OpenClosed:
                    return 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */;
                case types.DecorationRangeBehavior.ClosedOpen:
                    return 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */;
            }
        }
        DecorationRangeBehavior.from = from;
    })(DecorationRangeBehavior || (exports.DecorationRangeBehavior = DecorationRangeBehavior = {}));
    var DecorationRenderOptions;
    (function (DecorationRenderOptions) {
        function from(options) {
            return {
                isWholeLine: options.isWholeLine,
                rangeBehavior: options.rangeBehavior ? DecorationRangeBehavior.from(options.rangeBehavior) : undefined,
                overviewRulerLane: options.overviewRulerLane,
                light: options.light ? ThemableDecorationRenderOptions.from(options.light) : undefined,
                dark: options.dark ? ThemableDecorationRenderOptions.from(options.dark) : undefined,
                backgroundColor: options.backgroundColor,
                outline: options.outline,
                outlineColor: options.outlineColor,
                outlineStyle: options.outlineStyle,
                outlineWidth: options.outlineWidth,
                border: options.border,
                borderColor: options.borderColor,
                borderRadius: options.borderRadius,
                borderSpacing: options.borderSpacing,
                borderStyle: options.borderStyle,
                borderWidth: options.borderWidth,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                cursor: options.cursor,
                color: options.color,
                opacity: options.opacity,
                letterSpacing: options.letterSpacing,
                gutterIconPath: options.gutterIconPath ? pathOrURIToURI(options.gutterIconPath) : undefined,
                gutterIconSize: options.gutterIconSize,
                overviewRulerColor: options.overviewRulerColor,
                before: options.before ? ThemableDecorationAttachmentRenderOptions.from(options.before) : undefined,
                after: options.after ? ThemableDecorationAttachmentRenderOptions.from(options.after) : undefined,
            };
        }
        DecorationRenderOptions.from = from;
    })(DecorationRenderOptions || (exports.DecorationRenderOptions = DecorationRenderOptions = {}));
    var TextEdit;
    (function (TextEdit) {
        function from(edit) {
            return {
                text: edit.newText,
                eol: edit.newEol && EndOfLine.from(edit.newEol),
                range: Range.from(edit.range)
            };
        }
        TextEdit.from = from;
        function to(edit) {
            const result = new types.TextEdit(Range.to(edit.range), edit.text);
            result.newEol = (typeof edit.eol === 'undefined' ? undefined : EndOfLine.to(edit.eol));
            return result;
        }
        TextEdit.to = to;
    })(TextEdit || (exports.TextEdit = TextEdit = {}));
    var WorkspaceEdit;
    (function (WorkspaceEdit) {
        function from(value, versionInfo) {
            const result = {
                edits: []
            };
            if (value instanceof types.WorkspaceEdit) {
                // collect all files that are to be created so that their version
                // information (in case they exist as text model already) can be ignored
                const toCreate = new map_1.ResourceSet();
                for (const entry of value._allEntries()) {
                    if (entry._type === 1 /* types.FileEditType.File */ && uri_1.URI.isUri(entry.to) && entry.from === undefined) {
                        toCreate.add(entry.to);
                    }
                }
                for (const entry of value._allEntries()) {
                    if (entry._type === 1 /* types.FileEditType.File */) {
                        let contents;
                        if (entry.options?.contents) {
                            if (ArrayBuffer.isView(entry.options.contents)) {
                                contents = { type: 'base64', value: (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(entry.options.contents)) };
                            }
                            else {
                                contents = { type: 'dataTransferItem', id: entry.options.contents._itemId };
                            }
                        }
                        // file operation
                        result.edits.push({
                            oldResource: entry.from,
                            newResource: entry.to,
                            options: { ...entry.options, contents },
                            metadata: entry.metadata
                        });
                    }
                    else if (entry._type === 2 /* types.FileEditType.Text */) {
                        // text edits
                        result.edits.push({
                            resource: entry.uri,
                            textEdit: TextEdit.from(entry.edit),
                            versionId: !toCreate.has(entry.uri) ? versionInfo?.getTextDocumentVersion(entry.uri) : undefined,
                            metadata: entry.metadata
                        });
                    }
                    else if (entry._type === 6 /* types.FileEditType.Snippet */) {
                        result.edits.push({
                            resource: entry.uri,
                            textEdit: {
                                range: Range.from(entry.range),
                                text: entry.edit.value,
                                insertAsSnippet: true
                            },
                            versionId: !toCreate.has(entry.uri) ? versionInfo?.getTextDocumentVersion(entry.uri) : undefined,
                            metadata: entry.metadata
                        });
                    }
                    else if (entry._type === 3 /* types.FileEditType.Cell */) {
                        // cell edit
                        result.edits.push({
                            metadata: entry.metadata,
                            resource: entry.uri,
                            cellEdit: entry.edit,
                            notebookMetadata: entry.notebookMetadata,
                            notebookVersionId: versionInfo?.getNotebookDocumentVersion(entry.uri)
                        });
                    }
                    else if (entry._type === 5 /* types.FileEditType.CellReplace */) {
                        // cell replace
                        result.edits.push({
                            metadata: entry.metadata,
                            resource: entry.uri,
                            notebookVersionId: versionInfo?.getNotebookDocumentVersion(entry.uri),
                            cellEdit: {
                                editType: 1 /* notebooks.CellEditType.Replace */,
                                index: entry.index,
                                count: entry.count,
                                cells: entry.cells.map(NotebookCellData.from)
                            }
                        });
                    }
                }
            }
            return result;
        }
        WorkspaceEdit.from = from;
        function to(value) {
            const result = new types.WorkspaceEdit();
            const edits = new map_1.ResourceMap();
            for (const edit of value.edits) {
                if (edit.textEdit) {
                    const item = edit;
                    const uri = uri_1.URI.revive(item.resource);
                    const range = Range.to(item.textEdit.range);
                    const text = item.textEdit.text;
                    const isSnippet = item.textEdit.insertAsSnippet;
                    let editOrSnippetTest;
                    if (isSnippet) {
                        editOrSnippetTest = types.SnippetTextEdit.replace(range, new types.SnippetString(text));
                    }
                    else {
                        editOrSnippetTest = types.TextEdit.replace(range, text);
                    }
                    const array = edits.get(uri);
                    if (!array) {
                        edits.set(uri, [editOrSnippetTest]);
                    }
                    else {
                        array.push(editOrSnippetTest);
                    }
                }
                else {
                    result.renameFile(uri_1.URI.revive(edit.oldResource), uri_1.URI.revive(edit.newResource), edit.options);
                }
            }
            for (const [uri, array] of edits) {
                result.set(uri, array);
            }
            return result;
        }
        WorkspaceEdit.to = to;
    })(WorkspaceEdit || (exports.WorkspaceEdit = WorkspaceEdit = {}));
    var SymbolKind;
    (function (SymbolKind) {
        const _fromMapping = Object.create(null);
        _fromMapping[types.SymbolKind.File] = 0 /* languages.SymbolKind.File */;
        _fromMapping[types.SymbolKind.Module] = 1 /* languages.SymbolKind.Module */;
        _fromMapping[types.SymbolKind.Namespace] = 2 /* languages.SymbolKind.Namespace */;
        _fromMapping[types.SymbolKind.Package] = 3 /* languages.SymbolKind.Package */;
        _fromMapping[types.SymbolKind.Class] = 4 /* languages.SymbolKind.Class */;
        _fromMapping[types.SymbolKind.Method] = 5 /* languages.SymbolKind.Method */;
        _fromMapping[types.SymbolKind.Property] = 6 /* languages.SymbolKind.Property */;
        _fromMapping[types.SymbolKind.Field] = 7 /* languages.SymbolKind.Field */;
        _fromMapping[types.SymbolKind.Constructor] = 8 /* languages.SymbolKind.Constructor */;
        _fromMapping[types.SymbolKind.Enum] = 9 /* languages.SymbolKind.Enum */;
        _fromMapping[types.SymbolKind.Interface] = 10 /* languages.SymbolKind.Interface */;
        _fromMapping[types.SymbolKind.Function] = 11 /* languages.SymbolKind.Function */;
        _fromMapping[types.SymbolKind.Variable] = 12 /* languages.SymbolKind.Variable */;
        _fromMapping[types.SymbolKind.Constant] = 13 /* languages.SymbolKind.Constant */;
        _fromMapping[types.SymbolKind.String] = 14 /* languages.SymbolKind.String */;
        _fromMapping[types.SymbolKind.Number] = 15 /* languages.SymbolKind.Number */;
        _fromMapping[types.SymbolKind.Boolean] = 16 /* languages.SymbolKind.Boolean */;
        _fromMapping[types.SymbolKind.Array] = 17 /* languages.SymbolKind.Array */;
        _fromMapping[types.SymbolKind.Object] = 18 /* languages.SymbolKind.Object */;
        _fromMapping[types.SymbolKind.Key] = 19 /* languages.SymbolKind.Key */;
        _fromMapping[types.SymbolKind.Null] = 20 /* languages.SymbolKind.Null */;
        _fromMapping[types.SymbolKind.EnumMember] = 21 /* languages.SymbolKind.EnumMember */;
        _fromMapping[types.SymbolKind.Struct] = 22 /* languages.SymbolKind.Struct */;
        _fromMapping[types.SymbolKind.Event] = 23 /* languages.SymbolKind.Event */;
        _fromMapping[types.SymbolKind.Operator] = 24 /* languages.SymbolKind.Operator */;
        _fromMapping[types.SymbolKind.TypeParameter] = 25 /* languages.SymbolKind.TypeParameter */;
        function from(kind) {
            return typeof _fromMapping[kind] === 'number' ? _fromMapping[kind] : 6 /* languages.SymbolKind.Property */;
        }
        SymbolKind.from = from;
        function to(kind) {
            for (const k in _fromMapping) {
                if (_fromMapping[k] === kind) {
                    return Number(k);
                }
            }
            return types.SymbolKind.Property;
        }
        SymbolKind.to = to;
    })(SymbolKind || (exports.SymbolKind = SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        function from(kind) {
            switch (kind) {
                case types.SymbolTag.Deprecated: return 1 /* languages.SymbolTag.Deprecated */;
            }
        }
        SymbolTag.from = from;
        function to(kind) {
            switch (kind) {
                case 1 /* languages.SymbolTag.Deprecated */: return types.SymbolTag.Deprecated;
            }
        }
        SymbolTag.to = to;
    })(SymbolTag || (exports.SymbolTag = SymbolTag = {}));
    var WorkspaceSymbol;
    (function (WorkspaceSymbol) {
        function from(info) {
            return {
                name: info.name,
                kind: SymbolKind.from(info.kind),
                tags: info.tags && info.tags.map(SymbolTag.from),
                containerName: info.containerName,
                location: location.from(info.location)
            };
        }
        WorkspaceSymbol.from = from;
        function to(info) {
            const result = new types.SymbolInformation(info.name, SymbolKind.to(info.kind), info.containerName, location.to(info.location));
            result.tags = info.tags && info.tags.map(SymbolTag.to);
            return result;
        }
        WorkspaceSymbol.to = to;
    })(WorkspaceSymbol || (exports.WorkspaceSymbol = WorkspaceSymbol = {}));
    var DocumentSymbol;
    (function (DocumentSymbol) {
        function from(info) {
            const result = {
                name: info.name || '!!MISSING: name!!',
                detail: info.detail,
                range: Range.from(info.range),
                selectionRange: Range.from(info.selectionRange),
                kind: SymbolKind.from(info.kind),
                tags: info.tags?.map(SymbolTag.from) ?? []
            };
            if (info.children) {
                result.children = info.children.map(from);
            }
            return result;
        }
        DocumentSymbol.from = from;
        function to(info) {
            const result = new types.DocumentSymbol(info.name, info.detail, SymbolKind.to(info.kind), Range.to(info.range), Range.to(info.selectionRange));
            if ((0, arrays_1.isNonEmptyArray)(info.tags)) {
                result.tags = info.tags.map(SymbolTag.to);
            }
            if (info.children) {
                result.children = info.children.map(to);
            }
            return result;
        }
        DocumentSymbol.to = to;
    })(DocumentSymbol || (exports.DocumentSymbol = DocumentSymbol = {}));
    var CallHierarchyItem;
    (function (CallHierarchyItem) {
        function to(item) {
            const result = new types.CallHierarchyItem(SymbolKind.to(item.kind), item.name, item.detail || '', uri_1.URI.revive(item.uri), Range.to(item.range), Range.to(item.selectionRange));
            result._sessionId = item._sessionId;
            result._itemId = item._itemId;
            return result;
        }
        CallHierarchyItem.to = to;
        function from(item, sessionId, itemId) {
            sessionId = sessionId ?? item._sessionId;
            itemId = itemId ?? item._itemId;
            if (sessionId === undefined || itemId === undefined) {
                throw new Error('invalid item');
            }
            return {
                _sessionId: sessionId,
                _itemId: itemId,
                name: item.name,
                detail: item.detail,
                kind: SymbolKind.from(item.kind),
                uri: item.uri,
                range: Range.from(item.range),
                selectionRange: Range.from(item.selectionRange),
                tags: item.tags?.map(SymbolTag.from)
            };
        }
        CallHierarchyItem.from = from;
    })(CallHierarchyItem || (exports.CallHierarchyItem = CallHierarchyItem = {}));
    var CallHierarchyIncomingCall;
    (function (CallHierarchyIncomingCall) {
        function to(item) {
            return new types.CallHierarchyIncomingCall(CallHierarchyItem.to(item.from), item.fromRanges.map(r => Range.to(r)));
        }
        CallHierarchyIncomingCall.to = to;
    })(CallHierarchyIncomingCall || (exports.CallHierarchyIncomingCall = CallHierarchyIncomingCall = {}));
    var CallHierarchyOutgoingCall;
    (function (CallHierarchyOutgoingCall) {
        function to(item) {
            return new types.CallHierarchyOutgoingCall(CallHierarchyItem.to(item.to), item.fromRanges.map(r => Range.to(r)));
        }
        CallHierarchyOutgoingCall.to = to;
    })(CallHierarchyOutgoingCall || (exports.CallHierarchyOutgoingCall = CallHierarchyOutgoingCall = {}));
    var location;
    (function (location) {
        function from(value) {
            return {
                range: value.range && Range.from(value.range),
                uri: value.uri
            };
        }
        location.from = from;
        function to(value) {
            return new types.Location(uri_1.URI.revive(value.uri), Range.to(value.range));
        }
        location.to = to;
    })(location || (exports.location = location = {}));
    var DefinitionLink;
    (function (DefinitionLink) {
        function from(value) {
            const definitionLink = value;
            const location = value;
            return {
                originSelectionRange: definitionLink.originSelectionRange
                    ? Range.from(definitionLink.originSelectionRange)
                    : undefined,
                uri: definitionLink.targetUri ? definitionLink.targetUri : location.uri,
                range: Range.from(definitionLink.targetRange ? definitionLink.targetRange : location.range),
                targetSelectionRange: definitionLink.targetSelectionRange
                    ? Range.from(definitionLink.targetSelectionRange)
                    : undefined,
            };
        }
        DefinitionLink.from = from;
        function to(value) {
            return {
                targetUri: uri_1.URI.revive(value.uri),
                targetRange: Range.to(value.range),
                targetSelectionRange: value.targetSelectionRange
                    ? Range.to(value.targetSelectionRange)
                    : undefined,
                originSelectionRange: value.originSelectionRange
                    ? Range.to(value.originSelectionRange)
                    : undefined
            };
        }
        DefinitionLink.to = to;
    })(DefinitionLink || (exports.DefinitionLink = DefinitionLink = {}));
    var Hover;
    (function (Hover) {
        function from(hover) {
            const convertedHover = {
                range: Range.from(hover.range),
                contents: MarkdownString.fromMany(hover.contents),
                canIncreaseVerbosity: hover.canIncreaseVerbosity,
                canDecreaseVerbosity: hover.canDecreaseVerbosity,
            };
            return convertedHover;
        }
        Hover.from = from;
        function to(info) {
            const contents = info.contents.map(MarkdownString.to);
            const range = Range.to(info.range);
            const canIncreaseVerbosity = info.canIncreaseVerbosity;
            const canDecreaseVerbosity = info.canDecreaseVerbosity;
            return new types.VerboseHover(contents, range, canIncreaseVerbosity, canDecreaseVerbosity);
        }
        Hover.to = to;
    })(Hover || (exports.Hover = Hover = {}));
    var EvaluatableExpression;
    (function (EvaluatableExpression) {
        function from(expression) {
            return {
                range: Range.from(expression.range),
                expression: expression.expression
            };
        }
        EvaluatableExpression.from = from;
        function to(info) {
            return new types.EvaluatableExpression(Range.to(info.range), info.expression);
        }
        EvaluatableExpression.to = to;
    })(EvaluatableExpression || (exports.EvaluatableExpression = EvaluatableExpression = {}));
    var InlineValue;
    (function (InlineValue) {
        function from(inlineValue) {
            if (inlineValue instanceof types.InlineValueText) {
                return {
                    type: 'text',
                    range: Range.from(inlineValue.range),
                    text: inlineValue.text
                };
            }
            else if (inlineValue instanceof types.InlineValueVariableLookup) {
                return {
                    type: 'variable',
                    range: Range.from(inlineValue.range),
                    variableName: inlineValue.variableName,
                    caseSensitiveLookup: inlineValue.caseSensitiveLookup
                };
            }
            else if (inlineValue instanceof types.InlineValueEvaluatableExpression) {
                return {
                    type: 'expression',
                    range: Range.from(inlineValue.range),
                    expression: inlineValue.expression
                };
            }
            else {
                throw new Error(`Unknown 'InlineValue' type`);
            }
        }
        InlineValue.from = from;
        function to(inlineValue) {
            switch (inlineValue.type) {
                case 'text':
                    return {
                        range: Range.to(inlineValue.range),
                        text: inlineValue.text
                    };
                case 'variable':
                    return {
                        range: Range.to(inlineValue.range),
                        variableName: inlineValue.variableName,
                        caseSensitiveLookup: inlineValue.caseSensitiveLookup
                    };
                case 'expression':
                    return {
                        range: Range.to(inlineValue.range),
                        expression: inlineValue.expression
                    };
            }
        }
        InlineValue.to = to;
    })(InlineValue || (exports.InlineValue = InlineValue = {}));
    var InlineValueContext;
    (function (InlineValueContext) {
        function from(inlineValueContext) {
            return {
                frameId: inlineValueContext.frameId,
                stoppedLocation: Range.from(inlineValueContext.stoppedLocation)
            };
        }
        InlineValueContext.from = from;
        function to(inlineValueContext) {
            return new types.InlineValueContext(inlineValueContext.frameId, Range.to(inlineValueContext.stoppedLocation));
        }
        InlineValueContext.to = to;
    })(InlineValueContext || (exports.InlineValueContext = InlineValueContext = {}));
    var DocumentHighlight;
    (function (DocumentHighlight) {
        function from(documentHighlight) {
            return {
                range: Range.from(documentHighlight.range),
                kind: documentHighlight.kind
            };
        }
        DocumentHighlight.from = from;
        function to(occurrence) {
            return new types.DocumentHighlight(Range.to(occurrence.range), occurrence.kind);
        }
        DocumentHighlight.to = to;
    })(DocumentHighlight || (exports.DocumentHighlight = DocumentHighlight = {}));
    var MultiDocumentHighlight;
    (function (MultiDocumentHighlight) {
        function from(multiDocumentHighlight) {
            return {
                uri: multiDocumentHighlight.uri,
                highlights: multiDocumentHighlight.highlights.map(DocumentHighlight.from)
            };
        }
        MultiDocumentHighlight.from = from;
        function to(multiDocumentHighlight) {
            return new types.MultiDocumentHighlight(uri_1.URI.revive(multiDocumentHighlight.uri), multiDocumentHighlight.highlights.map(DocumentHighlight.to));
        }
        MultiDocumentHighlight.to = to;
    })(MultiDocumentHighlight || (exports.MultiDocumentHighlight = MultiDocumentHighlight = {}));
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        function to(kind) {
            switch (kind) {
                case 1 /* languages.CompletionTriggerKind.TriggerCharacter */:
                    return types.CompletionTriggerKind.TriggerCharacter;
                case 2 /* languages.CompletionTriggerKind.TriggerForIncompleteCompletions */:
                    return types.CompletionTriggerKind.TriggerForIncompleteCompletions;
                case 0 /* languages.CompletionTriggerKind.Invoke */:
                default:
                    return types.CompletionTriggerKind.Invoke;
            }
        }
        CompletionTriggerKind.to = to;
    })(CompletionTriggerKind || (exports.CompletionTriggerKind = CompletionTriggerKind = {}));
    var CompletionContext;
    (function (CompletionContext) {
        function to(context) {
            return {
                triggerKind: CompletionTriggerKind.to(context.triggerKind),
                triggerCharacter: context.triggerCharacter
            };
        }
        CompletionContext.to = to;
    })(CompletionContext || (exports.CompletionContext = CompletionContext = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        function from(kind) {
            switch (kind) {
                case types.CompletionItemTag.Deprecated: return 1 /* languages.CompletionItemTag.Deprecated */;
            }
        }
        CompletionItemTag.from = from;
        function to(kind) {
            switch (kind) {
                case 1 /* languages.CompletionItemTag.Deprecated */: return types.CompletionItemTag.Deprecated;
            }
        }
        CompletionItemTag.to = to;
    })(CompletionItemTag || (exports.CompletionItemTag = CompletionItemTag = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        const _from = new Map([
            [types.CompletionItemKind.Method, 0 /* languages.CompletionItemKind.Method */],
            [types.CompletionItemKind.Function, 1 /* languages.CompletionItemKind.Function */],
            [types.CompletionItemKind.Constructor, 2 /* languages.CompletionItemKind.Constructor */],
            [types.CompletionItemKind.Field, 3 /* languages.CompletionItemKind.Field */],
            [types.CompletionItemKind.Variable, 4 /* languages.CompletionItemKind.Variable */],
            [types.CompletionItemKind.Class, 5 /* languages.CompletionItemKind.Class */],
            [types.CompletionItemKind.Interface, 7 /* languages.CompletionItemKind.Interface */],
            [types.CompletionItemKind.Struct, 6 /* languages.CompletionItemKind.Struct */],
            [types.CompletionItemKind.Module, 8 /* languages.CompletionItemKind.Module */],
            [types.CompletionItemKind.Property, 9 /* languages.CompletionItemKind.Property */],
            [types.CompletionItemKind.Unit, 12 /* languages.CompletionItemKind.Unit */],
            [types.CompletionItemKind.Value, 13 /* languages.CompletionItemKind.Value */],
            [types.CompletionItemKind.Constant, 14 /* languages.CompletionItemKind.Constant */],
            [types.CompletionItemKind.Enum, 15 /* languages.CompletionItemKind.Enum */],
            [types.CompletionItemKind.EnumMember, 16 /* languages.CompletionItemKind.EnumMember */],
            [types.CompletionItemKind.Keyword, 17 /* languages.CompletionItemKind.Keyword */],
            [types.CompletionItemKind.Snippet, 27 /* languages.CompletionItemKind.Snippet */],
            [types.CompletionItemKind.Text, 18 /* languages.CompletionItemKind.Text */],
            [types.CompletionItemKind.Color, 19 /* languages.CompletionItemKind.Color */],
            [types.CompletionItemKind.File, 20 /* languages.CompletionItemKind.File */],
            [types.CompletionItemKind.Reference, 21 /* languages.CompletionItemKind.Reference */],
            [types.CompletionItemKind.Folder, 23 /* languages.CompletionItemKind.Folder */],
            [types.CompletionItemKind.Event, 10 /* languages.CompletionItemKind.Event */],
            [types.CompletionItemKind.Operator, 11 /* languages.CompletionItemKind.Operator */],
            [types.CompletionItemKind.TypeParameter, 24 /* languages.CompletionItemKind.TypeParameter */],
            [types.CompletionItemKind.Issue, 26 /* languages.CompletionItemKind.Issue */],
            [types.CompletionItemKind.User, 25 /* languages.CompletionItemKind.User */],
        ]);
        function from(kind) {
            return _from.get(kind) ?? 9 /* languages.CompletionItemKind.Property */;
        }
        CompletionItemKind.from = from;
        const _to = new Map([
            [0 /* languages.CompletionItemKind.Method */, types.CompletionItemKind.Method],
            [1 /* languages.CompletionItemKind.Function */, types.CompletionItemKind.Function],
            [2 /* languages.CompletionItemKind.Constructor */, types.CompletionItemKind.Constructor],
            [3 /* languages.CompletionItemKind.Field */, types.CompletionItemKind.Field],
            [4 /* languages.CompletionItemKind.Variable */, types.CompletionItemKind.Variable],
            [5 /* languages.CompletionItemKind.Class */, types.CompletionItemKind.Class],
            [7 /* languages.CompletionItemKind.Interface */, types.CompletionItemKind.Interface],
            [6 /* languages.CompletionItemKind.Struct */, types.CompletionItemKind.Struct],
            [8 /* languages.CompletionItemKind.Module */, types.CompletionItemKind.Module],
            [9 /* languages.CompletionItemKind.Property */, types.CompletionItemKind.Property],
            [12 /* languages.CompletionItemKind.Unit */, types.CompletionItemKind.Unit],
            [13 /* languages.CompletionItemKind.Value */, types.CompletionItemKind.Value],
            [14 /* languages.CompletionItemKind.Constant */, types.CompletionItemKind.Constant],
            [15 /* languages.CompletionItemKind.Enum */, types.CompletionItemKind.Enum],
            [16 /* languages.CompletionItemKind.EnumMember */, types.CompletionItemKind.EnumMember],
            [17 /* languages.CompletionItemKind.Keyword */, types.CompletionItemKind.Keyword],
            [27 /* languages.CompletionItemKind.Snippet */, types.CompletionItemKind.Snippet],
            [18 /* languages.CompletionItemKind.Text */, types.CompletionItemKind.Text],
            [19 /* languages.CompletionItemKind.Color */, types.CompletionItemKind.Color],
            [20 /* languages.CompletionItemKind.File */, types.CompletionItemKind.File],
            [21 /* languages.CompletionItemKind.Reference */, types.CompletionItemKind.Reference],
            [23 /* languages.CompletionItemKind.Folder */, types.CompletionItemKind.Folder],
            [10 /* languages.CompletionItemKind.Event */, types.CompletionItemKind.Event],
            [11 /* languages.CompletionItemKind.Operator */, types.CompletionItemKind.Operator],
            [24 /* languages.CompletionItemKind.TypeParameter */, types.CompletionItemKind.TypeParameter],
            [25 /* languages.CompletionItemKind.User */, types.CompletionItemKind.User],
            [26 /* languages.CompletionItemKind.Issue */, types.CompletionItemKind.Issue],
        ]);
        function to(kind) {
            return _to.get(kind) ?? types.CompletionItemKind.Property;
        }
        CompletionItemKind.to = to;
    })(CompletionItemKind || (exports.CompletionItemKind = CompletionItemKind = {}));
    var CompletionItem;
    (function (CompletionItem) {
        function to(suggestion, converter) {
            const result = new types.CompletionItem(suggestion.label);
            result.insertText = suggestion.insertText;
            result.kind = CompletionItemKind.to(suggestion.kind);
            result.tags = suggestion.tags?.map(CompletionItemTag.to);
            result.detail = suggestion.detail;
            result.documentation = htmlContent.isMarkdownString(suggestion.documentation) ? MarkdownString.to(suggestion.documentation) : suggestion.documentation;
            result.sortText = suggestion.sortText;
            result.filterText = suggestion.filterText;
            result.preselect = suggestion.preselect;
            result.commitCharacters = suggestion.commitCharacters;
            // range
            if (editorRange.Range.isIRange(suggestion.range)) {
                result.range = Range.to(suggestion.range);
            }
            else if (typeof suggestion.range === 'object') {
                result.range = { inserting: Range.to(suggestion.range.insert), replacing: Range.to(suggestion.range.replace) };
            }
            result.keepWhitespace = typeof suggestion.insertTextRules === 'undefined' ? false : Boolean(suggestion.insertTextRules & 1 /* languages.CompletionItemInsertTextRule.KeepWhitespace */);
            // 'insertText'-logic
            if (typeof suggestion.insertTextRules !== 'undefined' && suggestion.insertTextRules & 4 /* languages.CompletionItemInsertTextRule.InsertAsSnippet */) {
                result.insertText = new types.SnippetString(suggestion.insertText);
            }
            else {
                result.insertText = suggestion.insertText;
                result.textEdit = result.range instanceof types.Range ? new types.TextEdit(result.range, result.insertText) : undefined;
            }
            if (suggestion.additionalTextEdits && suggestion.additionalTextEdits.length > 0) {
                result.additionalTextEdits = suggestion.additionalTextEdits.map(e => TextEdit.to(e));
            }
            result.command = converter && suggestion.command ? converter.fromInternal(suggestion.command) : undefined;
            return result;
        }
        CompletionItem.to = to;
    })(CompletionItem || (exports.CompletionItem = CompletionItem = {}));
    var ParameterInformation;
    (function (ParameterInformation) {
        function from(info) {
            if (typeof info.label !== 'string' && !Array.isArray(info.label)) {
                throw new TypeError('Invalid label');
            }
            return {
                label: info.label,
                documentation: MarkdownString.fromStrict(info.documentation)
            };
        }
        ParameterInformation.from = from;
        function to(info) {
            return {
                label: info.label,
                documentation: htmlContent.isMarkdownString(info.documentation) ? MarkdownString.to(info.documentation) : info.documentation
            };
        }
        ParameterInformation.to = to;
    })(ParameterInformation || (exports.ParameterInformation = ParameterInformation = {}));
    var SignatureInformation;
    (function (SignatureInformation) {
        function from(info) {
            return {
                label: info.label,
                documentation: MarkdownString.fromStrict(info.documentation),
                parameters: Array.isArray(info.parameters) ? info.parameters.map(ParameterInformation.from) : [],
                activeParameter: info.activeParameter,
            };
        }
        SignatureInformation.from = from;
        function to(info) {
            return {
                label: info.label,
                documentation: htmlContent.isMarkdownString(info.documentation) ? MarkdownString.to(info.documentation) : info.documentation,
                parameters: Array.isArray(info.parameters) ? info.parameters.map(ParameterInformation.to) : [],
                activeParameter: info.activeParameter,
            };
        }
        SignatureInformation.to = to;
    })(SignatureInformation || (exports.SignatureInformation = SignatureInformation = {}));
    var SignatureHelp;
    (function (SignatureHelp) {
        function from(help) {
            return {
                activeSignature: help.activeSignature,
                activeParameter: help.activeParameter,
                signatures: Array.isArray(help.signatures) ? help.signatures.map(SignatureInformation.from) : [],
            };
        }
        SignatureHelp.from = from;
        function to(help) {
            return {
                activeSignature: help.activeSignature,
                activeParameter: help.activeParameter,
                signatures: Array.isArray(help.signatures) ? help.signatures.map(SignatureInformation.to) : [],
            };
        }
        SignatureHelp.to = to;
    })(SignatureHelp || (exports.SignatureHelp = SignatureHelp = {}));
    var InlayHint;
    (function (InlayHint) {
        function to(converter, hint) {
            const res = new types.InlayHint(Position.to(hint.position), typeof hint.label === 'string' ? hint.label : hint.label.map(InlayHintLabelPart.to.bind(undefined, converter)), hint.kind && InlayHintKind.to(hint.kind));
            res.textEdits = hint.textEdits && hint.textEdits.map(TextEdit.to);
            res.tooltip = htmlContent.isMarkdownString(hint.tooltip) ? MarkdownString.to(hint.tooltip) : hint.tooltip;
            res.paddingLeft = hint.paddingLeft;
            res.paddingRight = hint.paddingRight;
            return res;
        }
        InlayHint.to = to;
    })(InlayHint || (exports.InlayHint = InlayHint = {}));
    var InlayHintLabelPart;
    (function (InlayHintLabelPart) {
        function to(converter, part) {
            const result = new types.InlayHintLabelPart(part.label);
            result.tooltip = htmlContent.isMarkdownString(part.tooltip)
                ? MarkdownString.to(part.tooltip)
                : part.tooltip;
            if (languages.Command.is(part.command)) {
                result.command = converter.fromInternal(part.command);
            }
            if (part.location) {
                result.location = location.to(part.location);
            }
            return result;
        }
        InlayHintLabelPart.to = to;
    })(InlayHintLabelPart || (exports.InlayHintLabelPart = InlayHintLabelPart = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        function from(kind) {
            return kind;
        }
        InlayHintKind.from = from;
        function to(kind) {
            return kind;
        }
        InlayHintKind.to = to;
    })(InlayHintKind || (exports.InlayHintKind = InlayHintKind = {}));
    var DocumentLink;
    (function (DocumentLink) {
        function from(link) {
            return {
                range: Range.from(link.range),
                url: link.target,
                tooltip: link.tooltip
            };
        }
        DocumentLink.from = from;
        function to(link) {
            let target = undefined;
            if (link.url) {
                try {
                    target = typeof link.url === 'string' ? uri_1.URI.parse(link.url, true) : uri_1.URI.revive(link.url);
                }
                catch (err) {
                    // ignore
                }
            }
            return new types.DocumentLink(Range.to(link.range), target);
        }
        DocumentLink.to = to;
    })(DocumentLink || (exports.DocumentLink = DocumentLink = {}));
    var ColorPresentation;
    (function (ColorPresentation) {
        function to(colorPresentation) {
            const cp = new types.ColorPresentation(colorPresentation.label);
            if (colorPresentation.textEdit) {
                cp.textEdit = TextEdit.to(colorPresentation.textEdit);
            }
            if (colorPresentation.additionalTextEdits) {
                cp.additionalTextEdits = colorPresentation.additionalTextEdits.map(value => TextEdit.to(value));
            }
            return cp;
        }
        ColorPresentation.to = to;
        function from(colorPresentation) {
            return {
                label: colorPresentation.label,
                textEdit: colorPresentation.textEdit ? TextEdit.from(colorPresentation.textEdit) : undefined,
                additionalTextEdits: colorPresentation.additionalTextEdits ? colorPresentation.additionalTextEdits.map(value => TextEdit.from(value)) : undefined
            };
        }
        ColorPresentation.from = from;
    })(ColorPresentation || (exports.ColorPresentation = ColorPresentation = {}));
    var Color;
    (function (Color) {
        function to(c) {
            return new types.Color(c[0], c[1], c[2], c[3]);
        }
        Color.to = to;
        function from(color) {
            return [color.red, color.green, color.blue, color.alpha];
        }
        Color.from = from;
    })(Color || (exports.Color = Color = {}));
    var SelectionRange;
    (function (SelectionRange) {
        function from(obj) {
            return { range: Range.from(obj.range) };
        }
        SelectionRange.from = from;
        function to(obj) {
            return new types.SelectionRange(Range.to(obj.range));
        }
        SelectionRange.to = to;
    })(SelectionRange || (exports.SelectionRange = SelectionRange = {}));
    var TextDocumentSaveReason;
    (function (TextDocumentSaveReason) {
        function to(reason) {
            switch (reason) {
                case 2 /* SaveReason.AUTO */:
                    return types.TextDocumentSaveReason.AfterDelay;
                case 1 /* SaveReason.EXPLICIT */:
                    return types.TextDocumentSaveReason.Manual;
                case 3 /* SaveReason.FOCUS_CHANGE */:
                case 4 /* SaveReason.WINDOW_CHANGE */:
                    return types.TextDocumentSaveReason.FocusOut;
            }
        }
        TextDocumentSaveReason.to = to;
    })(TextDocumentSaveReason || (exports.TextDocumentSaveReason = TextDocumentSaveReason = {}));
    var TextEditorLineNumbersStyle;
    (function (TextEditorLineNumbersStyle) {
        function from(style) {
            switch (style) {
                case types.TextEditorLineNumbersStyle.Off:
                    return 0 /* RenderLineNumbersType.Off */;
                case types.TextEditorLineNumbersStyle.Relative:
                    return 2 /* RenderLineNumbersType.Relative */;
                case types.TextEditorLineNumbersStyle.Interval:
                    return 3 /* RenderLineNumbersType.Interval */;
                case types.TextEditorLineNumbersStyle.On:
                default:
                    return 1 /* RenderLineNumbersType.On */;
            }
        }
        TextEditorLineNumbersStyle.from = from;
        function to(style) {
            switch (style) {
                case 0 /* RenderLineNumbersType.Off */:
                    return types.TextEditorLineNumbersStyle.Off;
                case 2 /* RenderLineNumbersType.Relative */:
                    return types.TextEditorLineNumbersStyle.Relative;
                case 3 /* RenderLineNumbersType.Interval */:
                    return types.TextEditorLineNumbersStyle.Interval;
                case 1 /* RenderLineNumbersType.On */:
                default:
                    return types.TextEditorLineNumbersStyle.On;
            }
        }
        TextEditorLineNumbersStyle.to = to;
    })(TextEditorLineNumbersStyle || (exports.TextEditorLineNumbersStyle = TextEditorLineNumbersStyle = {}));
    var EndOfLine;
    (function (EndOfLine) {
        function from(eol) {
            if (eol === types.EndOfLine.CRLF) {
                return 1 /* EndOfLineSequence.CRLF */;
            }
            else if (eol === types.EndOfLine.LF) {
                return 0 /* EndOfLineSequence.LF */;
            }
            return undefined;
        }
        EndOfLine.from = from;
        function to(eol) {
            if (eol === 1 /* EndOfLineSequence.CRLF */) {
                return types.EndOfLine.CRLF;
            }
            else if (eol === 0 /* EndOfLineSequence.LF */) {
                return types.EndOfLine.LF;
            }
            return undefined;
        }
        EndOfLine.to = to;
    })(EndOfLine || (exports.EndOfLine = EndOfLine = {}));
    var ProgressLocation;
    (function (ProgressLocation) {
        function from(loc) {
            if (typeof loc === 'object') {
                return loc.viewId;
            }
            switch (loc) {
                case types.ProgressLocation.SourceControl: return 3 /* MainProgressLocation.Scm */;
                case types.ProgressLocation.Window: return 10 /* MainProgressLocation.Window */;
                case types.ProgressLocation.Notification: return 15 /* MainProgressLocation.Notification */;
            }
            throw new Error(`Unknown 'ProgressLocation'`);
        }
        ProgressLocation.from = from;
    })(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
    var FoldingRange;
    (function (FoldingRange) {
        function from(r) {
            const range = { start: r.start + 1, end: r.end + 1 };
            if (r.kind) {
                range.kind = FoldingRangeKind.from(r.kind);
            }
            return range;
        }
        FoldingRange.from = from;
        function to(r) {
            const range = { start: r.start - 1, end: r.end - 1 };
            if (r.kind) {
                range.kind = FoldingRangeKind.to(r.kind);
            }
            return range;
        }
        FoldingRange.to = to;
    })(FoldingRange || (exports.FoldingRange = FoldingRange = {}));
    var FoldingRangeKind;
    (function (FoldingRangeKind) {
        function from(kind) {
            if (kind) {
                switch (kind) {
                    case types.FoldingRangeKind.Comment:
                        return languages.FoldingRangeKind.Comment;
                    case types.FoldingRangeKind.Imports:
                        return languages.FoldingRangeKind.Imports;
                    case types.FoldingRangeKind.Region:
                        return languages.FoldingRangeKind.Region;
                }
            }
            return undefined;
        }
        FoldingRangeKind.from = from;
        function to(kind) {
            if (kind) {
                switch (kind.value) {
                    case languages.FoldingRangeKind.Comment.value:
                        return types.FoldingRangeKind.Comment;
                    case languages.FoldingRangeKind.Imports.value:
                        return types.FoldingRangeKind.Imports;
                    case languages.FoldingRangeKind.Region.value:
                        return types.FoldingRangeKind.Region;
                }
            }
            return undefined;
        }
        FoldingRangeKind.to = to;
    })(FoldingRangeKind || (exports.FoldingRangeKind = FoldingRangeKind = {}));
    var TextEditorOpenOptions;
    (function (TextEditorOpenOptions) {
        function from(options) {
            if (options) {
                return {
                    pinned: typeof options.preview === 'boolean' ? !options.preview : undefined,
                    inactive: options.background,
                    preserveFocus: options.preserveFocus,
                    selection: typeof options.selection === 'object' ? Range.from(options.selection) : undefined,
                    override: typeof options.override === 'boolean' ? editor_1.DEFAULT_EDITOR_ASSOCIATION.id : undefined
                };
            }
            return undefined;
        }
        TextEditorOpenOptions.from = from;
    })(TextEditorOpenOptions || (exports.TextEditorOpenOptions = TextEditorOpenOptions = {}));
    var GlobPattern;
    (function (GlobPattern) {
        function from(pattern) {
            if (pattern instanceof types.RelativePattern) {
                return pattern.toJSON();
            }
            if (typeof pattern === 'string') {
                return pattern;
            }
            // This is slightly bogus because we declare this method to accept
            // `vscode.GlobPattern` which can be `vscode.RelativePattern` class,
            // but given we cannot enforce classes from our vscode.d.ts, we have
            // to probe for objects too
            // Refs: https://github.com/microsoft/vscode/issues/140771
            if (isRelativePatternShape(pattern) || isLegacyRelativePatternShape(pattern)) {
                return new types.RelativePattern(pattern.baseUri ?? pattern.base, pattern.pattern).toJSON();
            }
            return pattern; // preserve `undefined` and `null`
        }
        GlobPattern.from = from;
        function isRelativePatternShape(obj) {
            const rp = obj;
            if (!rp) {
                return false;
            }
            return uri_1.URI.isUri(rp.baseUri) && typeof rp.pattern === 'string';
        }
        function isLegacyRelativePatternShape(obj) {
            // Before 1.64.x, `RelativePattern` did not have any `baseUri: Uri`
            // property. To preserve backwards compatibility with older extensions
            // we allow this old format when creating the `vscode.RelativePattern`.
            const rp = obj;
            if (!rp) {
                return false;
            }
            return typeof rp.base === 'string' && typeof rp.pattern === 'string';
        }
        function to(pattern) {
            if (typeof pattern === 'string') {
                return pattern;
            }
            return new types.RelativePattern(uri_1.URI.revive(pattern.baseUri), pattern.pattern);
        }
        GlobPattern.to = to;
    })(GlobPattern || (exports.GlobPattern = GlobPattern = {}));
    var LanguageSelector;
    (function (LanguageSelector) {
        function from(selector) {
            if (!selector) {
                return undefined;
            }
            else if (Array.isArray(selector)) {
                return selector.map(from);
            }
            else if (typeof selector === 'string') {
                return selector;
            }
            else {
                const filter = selector; // TODO: microsoft/TypeScript#42768
                return {
                    language: filter.language,
                    scheme: filter.scheme,
                    pattern: GlobPattern.from(filter.pattern),
                    exclusive: filter.exclusive,
                    notebookType: filter.notebookType
                };
            }
        }
        LanguageSelector.from = from;
    })(LanguageSelector || (exports.LanguageSelector = LanguageSelector = {}));
    var MappedEditsContext;
    (function (MappedEditsContext) {
        function is(v) {
            return (!!v && typeof v === 'object' &&
                'documents' in v &&
                Array.isArray(v.documents) &&
                v.documents.every(subArr => Array.isArray(subArr) &&
                    subArr.every(docRef => docRef && typeof docRef === 'object' &&
                        'uri' in docRef && uri_1.URI.isUri(docRef.uri) &&
                        'version' in docRef && typeof docRef.version === 'number' &&
                        'ranges' in docRef && Array.isArray(docRef.ranges) && docRef.ranges.every((r) => r instanceof types.Range))));
        }
        MappedEditsContext.is = is;
        function from(extContext) {
            return {
                documents: extContext.documents.map((subArray) => subArray.map((r) => ({
                    uri: uri_1.URI.from(r.uri),
                    version: r.version,
                    ranges: r.ranges.map((r) => Range.from(r)),
                }))),
            };
        }
        MappedEditsContext.from = from;
    })(MappedEditsContext || (exports.MappedEditsContext = MappedEditsContext = {}));
    var NotebookRange;
    (function (NotebookRange) {
        function from(range) {
            return { start: range.start, end: range.end };
        }
        NotebookRange.from = from;
        function to(range) {
            return new types.NotebookRange(range.start, range.end);
        }
        NotebookRange.to = to;
    })(NotebookRange || (exports.NotebookRange = NotebookRange = {}));
    var NotebookCellExecutionSummary;
    (function (NotebookCellExecutionSummary) {
        function to(data) {
            return {
                timing: typeof data.runStartTime === 'number' && typeof data.runEndTime === 'number' ? { startTime: data.runStartTime, endTime: data.runEndTime } : undefined,
                executionOrder: data.executionOrder,
                success: data.lastRunSuccess
            };
        }
        NotebookCellExecutionSummary.to = to;
        function from(data) {
            return {
                lastRunSuccess: data.success,
                runStartTime: data.timing?.startTime,
                runEndTime: data.timing?.endTime,
                executionOrder: data.executionOrder
            };
        }
        NotebookCellExecutionSummary.from = from;
    })(NotebookCellExecutionSummary || (exports.NotebookCellExecutionSummary = NotebookCellExecutionSummary = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        function to(state) {
            if (state === notebooks.NotebookCellExecutionState.Unconfirmed) {
                return types.NotebookCellExecutionState.Pending;
            }
            else if (state === notebooks.NotebookCellExecutionState.Pending) {
                // Since the (proposed) extension API doesn't have the distinction between Unconfirmed and Pending, we don't want to fire an update for Pending twice
                return undefined;
            }
            else if (state === notebooks.NotebookCellExecutionState.Executing) {
                return types.NotebookCellExecutionState.Executing;
            }
            else {
                throw new Error(`Unknown state: ${state}`);
            }
        }
        NotebookCellExecutionState.to = to;
    })(NotebookCellExecutionState || (exports.NotebookCellExecutionState = NotebookCellExecutionState = {}));
    var NotebookCellKind;
    (function (NotebookCellKind) {
        function from(data) {
            switch (data) {
                case types.NotebookCellKind.Markup:
                    return notebooks.CellKind.Markup;
                case types.NotebookCellKind.Code:
                default:
                    return notebooks.CellKind.Code;
            }
        }
        NotebookCellKind.from = from;
        function to(data) {
            switch (data) {
                case notebooks.CellKind.Markup:
                    return types.NotebookCellKind.Markup;
                case notebooks.CellKind.Code:
                default:
                    return types.NotebookCellKind.Code;
            }
        }
        NotebookCellKind.to = to;
    })(NotebookCellKind || (exports.NotebookCellKind = NotebookCellKind = {}));
    var NotebookData;
    (function (NotebookData) {
        function from(data) {
            const res = {
                metadata: data.metadata ?? Object.create(null),
                cells: [],
            };
            for (const cell of data.cells) {
                types.NotebookCellData.validate(cell);
                res.cells.push(NotebookCellData.from(cell));
            }
            return res;
        }
        NotebookData.from = from;
        function to(data) {
            const res = new types.NotebookData(data.cells.map(NotebookCellData.to));
            if (!(0, types_1.isEmptyObject)(data.metadata)) {
                res.metadata = data.metadata;
            }
            return res;
        }
        NotebookData.to = to;
    })(NotebookData || (exports.NotebookData = NotebookData = {}));
    var NotebookCellData;
    (function (NotebookCellData) {
        function from(data) {
            return {
                cellKind: NotebookCellKind.from(data.kind),
                language: data.languageId,
                mime: data.mime,
                source: data.value,
                metadata: data.metadata,
                internalMetadata: NotebookCellExecutionSummary.from(data.executionSummary ?? {}),
                outputs: data.outputs ? data.outputs.map(NotebookCellOutput.from) : []
            };
        }
        NotebookCellData.from = from;
        function to(data) {
            return new types.NotebookCellData(NotebookCellKind.to(data.cellKind), data.source, data.language, data.mime, data.outputs ? data.outputs.map(NotebookCellOutput.to) : undefined, data.metadata, data.internalMetadata ? NotebookCellExecutionSummary.to(data.internalMetadata) : undefined);
        }
        NotebookCellData.to = to;
    })(NotebookCellData || (exports.NotebookCellData = NotebookCellData = {}));
    var NotebookCellOutputItem;
    (function (NotebookCellOutputItem) {
        function from(item) {
            return {
                mime: item.mime,
                valueBytes: buffer_1.VSBuffer.wrap(item.data),
            };
        }
        NotebookCellOutputItem.from = from;
        function to(item) {
            return new types.NotebookCellOutputItem(item.valueBytes.buffer, item.mime);
        }
        NotebookCellOutputItem.to = to;
    })(NotebookCellOutputItem || (exports.NotebookCellOutputItem = NotebookCellOutputItem = {}));
    var NotebookCellOutput;
    (function (NotebookCellOutput) {
        function from(output) {
            return {
                outputId: output.id,
                items: output.items.map(NotebookCellOutputItem.from),
                metadata: output.metadata
            };
        }
        NotebookCellOutput.from = from;
        function to(output) {
            const items = output.items.map(NotebookCellOutputItem.to);
            return new types.NotebookCellOutput(items, output.outputId, output.metadata);
        }
        NotebookCellOutput.to = to;
    })(NotebookCellOutput || (exports.NotebookCellOutput = NotebookCellOutput = {}));
    var NotebookExclusiveDocumentPattern;
    (function (NotebookExclusiveDocumentPattern) {
        function from(pattern) {
            if (isExclusivePattern(pattern)) {
                return {
                    include: GlobPattern.from(pattern.include) ?? undefined,
                    exclude: GlobPattern.from(pattern.exclude) ?? undefined,
                };
            }
            return GlobPattern.from(pattern) ?? undefined;
        }
        NotebookExclusiveDocumentPattern.from = from;
        function to(pattern) {
            if (isExclusivePattern(pattern)) {
                return {
                    include: GlobPattern.to(pattern.include),
                    exclude: GlobPattern.to(pattern.exclude)
                };
            }
            return GlobPattern.to(pattern);
        }
        NotebookExclusiveDocumentPattern.to = to;
        function isExclusivePattern(obj) {
            const ep = obj;
            if (!ep) {
                return false;
            }
            return !(0, types_1.isUndefinedOrNull)(ep.include) && !(0, types_1.isUndefinedOrNull)(ep.exclude);
        }
    })(NotebookExclusiveDocumentPattern || (exports.NotebookExclusiveDocumentPattern = NotebookExclusiveDocumentPattern = {}));
    var NotebookStatusBarItem;
    (function (NotebookStatusBarItem) {
        function from(item, commandsConverter, disposables) {
            const command = typeof item.command === 'string' ? { title: '', command: item.command } : item.command;
            return {
                alignment: item.alignment === types.NotebookCellStatusBarAlignment.Left ? 1 /* notebooks.CellStatusbarAlignment.Left */ : 2 /* notebooks.CellStatusbarAlignment.Right */,
                command: commandsConverter.toInternal(command, disposables), // TODO@roblou
                text: item.text,
                tooltip: item.tooltip,
                accessibilityInformation: item.accessibilityInformation,
                priority: item.priority
            };
        }
        NotebookStatusBarItem.from = from;
    })(NotebookStatusBarItem || (exports.NotebookStatusBarItem = NotebookStatusBarItem = {}));
    var NotebookKernelSourceAction;
    (function (NotebookKernelSourceAction) {
        function from(item, commandsConverter, disposables) {
            const command = typeof item.command === 'string' ? { title: '', command: item.command } : item.command;
            return {
                command: commandsConverter.toInternal(command, disposables),
                label: item.label,
                description: item.description,
                detail: item.detail,
                documentation: item.documentation
            };
        }
        NotebookKernelSourceAction.from = from;
    })(NotebookKernelSourceAction || (exports.NotebookKernelSourceAction = NotebookKernelSourceAction = {}));
    var NotebookDocumentContentOptions;
    (function (NotebookDocumentContentOptions) {
        function from(options) {
            return {
                transientOutputs: options?.transientOutputs ?? false,
                transientCellMetadata: options?.transientCellMetadata ?? {},
                transientDocumentMetadata: options?.transientDocumentMetadata ?? {},
                cellContentMetadata: options?.cellContentMetadata ?? {}
            };
        }
        NotebookDocumentContentOptions.from = from;
    })(NotebookDocumentContentOptions || (exports.NotebookDocumentContentOptions = NotebookDocumentContentOptions = {}));
    var NotebookRendererScript;
    (function (NotebookRendererScript) {
        function from(preload) {
            return {
                uri: preload.uri,
                provides: preload.provides
            };
        }
        NotebookRendererScript.from = from;
        function to(preload) {
            return new types.NotebookRendererScript(uri_1.URI.revive(preload.uri), preload.provides);
        }
        NotebookRendererScript.to = to;
    })(NotebookRendererScript || (exports.NotebookRendererScript = NotebookRendererScript = {}));
    var TestMessage;
    (function (TestMessage) {
        function from(message) {
            return {
                message: MarkdownString.fromStrict(message.message) || '',
                type: 0 /* TestMessageType.Error */,
                expected: message.expectedOutput,
                actual: message.actualOutput,
                contextValue: message.contextValue,
                location: message.location && ({ range: Range.from(message.location.range), uri: message.location.uri }),
            };
        }
        TestMessage.from = from;
        function to(item) {
            const message = new types.TestMessage(typeof item.message === 'string' ? item.message : MarkdownString.to(item.message));
            message.actualOutput = item.actual;
            message.expectedOutput = item.expected;
            message.contextValue = item.contextValue;
            message.location = item.location ? location.to(item.location) : undefined;
            return message;
        }
        TestMessage.to = to;
    })(TestMessage || (exports.TestMessage = TestMessage = {}));
    var TestTag;
    (function (TestTag) {
        TestTag.namespace = testTypes_1.namespaceTestTag;
        TestTag.denamespace = testTypes_1.denamespaceTestTag;
    })(TestTag || (exports.TestTag = TestTag = {}));
    var TestItem;
    (function (TestItem) {
        function from(item) {
            const ctrlId = (0, extHostTestingPrivateApi_1.getPrivateApiFor)(item).controllerId;
            return {
                extId: testId_1.TestId.fromExtHostTestItem(item, ctrlId).toString(),
                label: item.label,
                uri: uri_1.URI.revive(item.uri),
                busy: item.busy,
                tags: item.tags.map(t => TestTag.namespace(ctrlId, t.id)),
                range: editorRange.Range.lift(Range.from(item.range)),
                description: item.description || null,
                sortText: item.sortText || null,
                error: item.error ? (MarkdownString.fromStrict(item.error) || null) : null,
            };
        }
        TestItem.from = from;
        function toPlain(item) {
            return {
                parent: undefined,
                error: undefined,
                id: testId_1.TestId.fromString(item.extId).localId,
                label: item.label,
                uri: uri_1.URI.revive(item.uri),
                tags: (item.tags || []).map(t => {
                    const { tagId } = TestTag.denamespace(t);
                    return new types.TestTag(tagId);
                }),
                children: {
                    add: () => { },
                    delete: () => { },
                    forEach: () => { },
                    *[Symbol.iterator]() { },
                    get: () => undefined,
                    replace: () => { },
                    size: 0,
                },
                range: Range.to(item.range || undefined),
                canResolveChildren: false,
                busy: item.busy,
                description: item.description || undefined,
                sortText: item.sortText || undefined,
            };
        }
        TestItem.toPlain = toPlain;
    })(TestItem || (exports.TestItem = TestItem = {}));
    (function (TestTag) {
        function from(tag) {
            return { id: tag.id };
        }
        TestTag.from = from;
        function to(tag) {
            return new types.TestTag(tag.id);
        }
        TestTag.to = to;
    })(TestTag || (exports.TestTag = TestTag = {}));
    var TestResults;
    (function (TestResults) {
        const convertTestResultItem = (node, parent) => {
            const item = node.value;
            if (!item) {
                return undefined; // should be unreachable
            }
            const snapshot = ({
                ...TestItem.toPlain(item.item),
                parent,
                taskStates: item.tasks.map(t => ({
                    state: t.state,
                    duration: t.duration,
                    messages: t.messages
                        .filter((m) => m.type === 0 /* TestMessageType.Error */)
                        .map(TestMessage.to),
                })),
                children: [],
            });
            if (node.children) {
                for (const child of node.children.values()) {
                    const c = convertTestResultItem(child, snapshot);
                    if (c) {
                        snapshot.children.push(c);
                    }
                }
            }
            return snapshot;
        };
        function to(serialized) {
            const tree = new prefixTree_1.WellDefinedPrefixTree();
            for (const item of serialized.items) {
                tree.insert(testId_1.TestId.fromString(item.item.extId).path, item);
            }
            // Get the first node with a value in each subtree of IDs.
            const queue = [tree.nodes];
            const roots = [];
            while (queue.length) {
                for (const node of queue.pop()) {
                    if (node.value) {
                        roots.push(node);
                    }
                    else if (node.children) {
                        queue.push(node.children.values());
                    }
                }
            }
            return {
                completedAt: serialized.completedAt,
                results: roots.map(r => convertTestResultItem(r)).filter(types_1.isDefined),
            };
        }
        TestResults.to = to;
    })(TestResults || (exports.TestResults = TestResults = {}));
    var TestCoverage;
    (function (TestCoverage) {
        function fromCoverageCount(count) {
            return { covered: count.covered, total: count.total };
        }
        function fromLocation(location) {
            return 'line' in location ? Position.from(location) : Range.from(location);
        }
        function fromDetails(coverage) {
            if (typeof coverage.executed === 'number' && coverage.executed < 0) {
                throw new Error(`Invalid coverage count ${coverage.executed}`);
            }
            if ('branches' in coverage) {
                return {
                    count: coverage.executed,
                    location: fromLocation(coverage.location),
                    type: 1 /* DetailType.Statement */,
                    branches: coverage.branches.length
                        ? coverage.branches.map(b => ({ count: b.executed, location: b.location && fromLocation(b.location), label: b.label }))
                        : undefined,
                };
            }
            else {
                return {
                    type: 0 /* DetailType.Declaration */,
                    name: coverage.name,
                    count: coverage.executed,
                    location: fromLocation(coverage.location),
                };
            }
        }
        TestCoverage.fromDetails = fromDetails;
        function fromFile(id, coverage) {
            types.validateTestCoverageCount(coverage.statementCoverage);
            types.validateTestCoverageCount(coverage.branchCoverage);
            types.validateTestCoverageCount(coverage.declarationCoverage);
            return {
                id,
                uri: coverage.uri,
                statement: fromCoverageCount(coverage.statementCoverage),
                branch: coverage.branchCoverage && fromCoverageCount(coverage.branchCoverage),
                declaration: coverage.declarationCoverage && fromCoverageCount(coverage.declarationCoverage),
            };
        }
        TestCoverage.fromFile = fromFile;
    })(TestCoverage || (exports.TestCoverage = TestCoverage = {}));
    var CodeActionTriggerKind;
    (function (CodeActionTriggerKind) {
        function to(value) {
            switch (value) {
                case 1 /* languages.CodeActionTriggerType.Invoke */:
                    return types.CodeActionTriggerKind.Invoke;
                case 2 /* languages.CodeActionTriggerType.Auto */:
                    return types.CodeActionTriggerKind.Automatic;
            }
        }
        CodeActionTriggerKind.to = to;
    })(CodeActionTriggerKind || (exports.CodeActionTriggerKind = CodeActionTriggerKind = {}));
    var TypeHierarchyItem;
    (function (TypeHierarchyItem) {
        function to(item) {
            const result = new types.TypeHierarchyItem(SymbolKind.to(item.kind), item.name, item.detail || '', uri_1.URI.revive(item.uri), Range.to(item.range), Range.to(item.selectionRange));
            result._sessionId = item._sessionId;
            result._itemId = item._itemId;
            return result;
        }
        TypeHierarchyItem.to = to;
        function from(item, sessionId, itemId) {
            sessionId = sessionId ?? item._sessionId;
            itemId = itemId ?? item._itemId;
            if (sessionId === undefined || itemId === undefined) {
                throw new Error('invalid item');
            }
            return {
                _sessionId: sessionId,
                _itemId: itemId,
                kind: SymbolKind.from(item.kind),
                name: item.name,
                detail: item.detail ?? '',
                uri: item.uri,
                range: Range.from(item.range),
                selectionRange: Range.from(item.selectionRange),
                tags: item.tags?.map(SymbolTag.from)
            };
        }
        TypeHierarchyItem.from = from;
    })(TypeHierarchyItem || (exports.TypeHierarchyItem = TypeHierarchyItem = {}));
    var ViewBadge;
    (function (ViewBadge) {
        function from(badge) {
            if (!badge) {
                return undefined;
            }
            return {
                value: badge.value,
                tooltip: badge.tooltip
            };
        }
        ViewBadge.from = from;
    })(ViewBadge || (exports.ViewBadge = ViewBadge = {}));
    var DataTransferItem;
    (function (DataTransferItem) {
        function to(mime, item, resolveFileData) {
            const file = item.fileData;
            if (file) {
                return new types.InternalFileDataTransferItem(new types.DataTransferFile(file.name, uri_1.URI.revive(file.uri), file.id, (0, functional_1.createSingleCallFunction)(() => resolveFileData(file.id))));
            }
            if (mime === mime_1.Mimes.uriList && item.uriListData) {
                return new types.InternalDataTransferItem(reviveUriList(item.uriListData));
            }
            return new types.InternalDataTransferItem(item.asString);
        }
        DataTransferItem.to = to;
        async function from(mime, item) {
            const stringValue = await item.asString();
            if (mime === mime_1.Mimes.uriList) {
                return {
                    asString: stringValue,
                    fileData: undefined,
                    uriListData: serializeUriList(stringValue),
                };
            }
            const fileValue = item.asFile();
            return {
                asString: stringValue,
                fileData: fileValue ? {
                    name: fileValue.name,
                    uri: fileValue.uri,
                    id: fileValue._itemId ?? fileValue.id,
                } : undefined,
            };
        }
        DataTransferItem.from = from;
        function serializeUriList(stringValue) {
            return dataTransfer_1.UriList.split(stringValue).map(part => {
                if (part.startsWith('#')) {
                    return part;
                }
                try {
                    return uri_1.URI.parse(part);
                }
                catch {
                    // noop
                }
                return part;
            });
        }
        function reviveUriList(parts) {
            return dataTransfer_1.UriList.create(parts.map(part => {
                return typeof part === 'string' ? part : uri_1.URI.revive(part);
            }));
        }
    })(DataTransferItem || (exports.DataTransferItem = DataTransferItem = {}));
    var DataTransfer;
    (function (DataTransfer) {
        function toDataTransfer(value, resolveFileData) {
            const init = value.items.map(([type, item]) => {
                return [type, DataTransferItem.to(type, item, resolveFileData)];
            });
            return new types.DataTransfer(init);
        }
        DataTransfer.toDataTransfer = toDataTransfer;
        async function from(dataTransfer) {
            const newDTO = { items: [] };
            const promises = [];
            for (const [mime, value] of dataTransfer) {
                promises.push((async () => {
                    newDTO.items.push([mime, await DataTransferItem.from(mime, value)]);
                })());
            }
            await Promise.all(promises);
            return newDTO;
        }
        DataTransfer.from = from;
    })(DataTransfer || (exports.DataTransfer = DataTransfer = {}));
    var ChatFollowup;
    (function (ChatFollowup) {
        function from(followup, request) {
            return {
                kind: 'reply',
                agentId: followup.participant ?? request?.agentId ?? '',
                subCommand: followup.command ?? request?.command,
                message: followup.prompt,
                title: followup.label
            };
        }
        ChatFollowup.from = from;
        function to(followup) {
            return {
                prompt: followup.message,
                label: followup.title,
                participant: followup.agentId,
                command: followup.subCommand,
            };
        }
        ChatFollowup.to = to;
    })(ChatFollowup || (exports.ChatFollowup = ChatFollowup = {}));
    var ChatInlineFollowup;
    (function (ChatInlineFollowup) {
        function from(followup) {
            if ('commandId' in followup) {
                return {
                    kind: 'command',
                    title: followup.title ?? '',
                    commandId: followup.commandId ?? '',
                    when: followup.when ?? '',
                    args: followup.args
                };
            }
            else {
                return {
                    kind: 'reply',
                    message: followup.message,
                    title: followup.title,
                    tooltip: followup.tooltip,
                };
            }
        }
        ChatInlineFollowup.from = from;
    })(ChatInlineFollowup || (exports.ChatInlineFollowup = ChatInlineFollowup = {}));
    var LanguageModelMessage;
    (function (LanguageModelMessage) {
        function to(message) {
            switch (message.role) {
                case 0 /* chatProvider.ChatMessageRole.System */: return new types.LanguageModelChatSystemMessage(message.content);
                case 1 /* chatProvider.ChatMessageRole.User */: return new types.LanguageModelChatUserMessage(message.content);
                case 2 /* chatProvider.ChatMessageRole.Assistant */: return new types.LanguageModelChatAssistantMessage(message.content);
            }
        }
        LanguageModelMessage.to = to;
        function from(message) {
            if (message instanceof types.LanguageModelChatSystemMessage) {
                return { role: 0 /* chatProvider.ChatMessageRole.System */, content: message.content };
            }
            else if (message instanceof types.LanguageModelChatUserMessage) {
                return { role: 1 /* chatProvider.ChatMessageRole.User */, content: message.content };
            }
            else if (message instanceof types.LanguageModelChatAssistantMessage) {
                return { role: 2 /* chatProvider.ChatMessageRole.Assistant */, content: message.content };
            }
            else {
                throw new Error('Invalid LanguageModelMessage');
            }
        }
        LanguageModelMessage.from = from;
    })(LanguageModelMessage || (exports.LanguageModelMessage = LanguageModelMessage = {}));
    var ChatVariable;
    (function (ChatVariable) {
        function objectTo(variableObject) {
            const result = {};
            for (const key of Object.keys(variableObject)) {
                result[key] = variableObject[key].map(ChatVariable.to);
            }
            return result;
        }
        ChatVariable.objectTo = objectTo;
        function to(variable) {
            return {
                level: ChatVariableLevel.to(variable.level),
                kind: variable.kind,
                value: (0, uri_1.isUriComponents)(variable.value) ? uri_1.URI.revive(variable.value) : variable.value,
                description: variable.description
            };
        }
        ChatVariable.to = to;
        function from(variable) {
            return {
                level: ChatVariableLevel.from(variable.level),
                kind: variable.kind,
                value: variable.value,
                description: variable.description
            };
        }
        ChatVariable.from = from;
    })(ChatVariable || (exports.ChatVariable = ChatVariable = {}));
    var ChatVariableLevel;
    (function (ChatVariableLevel) {
        function to(level) {
            switch (level) {
                case 'short': return types.ChatVariableLevel.Short;
                case 'medium': return types.ChatVariableLevel.Medium;
                case 'full':
                default:
                    return types.ChatVariableLevel.Full;
            }
        }
        ChatVariableLevel.to = to;
        function from(level) {
            switch (level) {
                case types.ChatVariableLevel.Short: return 'short';
                case types.ChatVariableLevel.Medium: return 'medium';
                case types.ChatVariableLevel.Full:
                default:
                    return 'full';
            }
        }
        ChatVariableLevel.from = from;
    })(ChatVariableLevel || (exports.ChatVariableLevel = ChatVariableLevel = {}));
    var InteractiveEditorResponseFeedbackKind;
    (function (InteractiveEditorResponseFeedbackKind) {
        function to(kind) {
            switch (kind) {
                case 1 /* InlineChatResponseFeedbackKind.Helpful */:
                    return types.InteractiveEditorResponseFeedbackKind.Helpful;
                case 0 /* InlineChatResponseFeedbackKind.Unhelpful */:
                    return types.InteractiveEditorResponseFeedbackKind.Unhelpful;
                case 2 /* InlineChatResponseFeedbackKind.Undone */:
                    return types.InteractiveEditorResponseFeedbackKind.Undone;
                case 3 /* InlineChatResponseFeedbackKind.Accepted */:
                    return types.InteractiveEditorResponseFeedbackKind.Accepted;
                case 4 /* InlineChatResponseFeedbackKind.Bug */:
                    return types.InteractiveEditorResponseFeedbackKind.Bug;
            }
        }
        InteractiveEditorResponseFeedbackKind.to = to;
    })(InteractiveEditorResponseFeedbackKind || (exports.InteractiveEditorResponseFeedbackKind = InteractiveEditorResponseFeedbackKind = {}));
    var ChatResponseMarkdownPart;
    (function (ChatResponseMarkdownPart) {
        function from(part) {
            return {
                kind: 'markdownContent',
                content: MarkdownString.from(part.value)
            };
        }
        ChatResponseMarkdownPart.from = from;
        function to(part) {
            return new types.ChatResponseMarkdownPart(MarkdownString.to(part.content));
        }
        ChatResponseMarkdownPart.to = to;
    })(ChatResponseMarkdownPart || (exports.ChatResponseMarkdownPart = ChatResponseMarkdownPart = {}));
    var ChatResponseMarkdownWithVulnerabilitiesPart;
    (function (ChatResponseMarkdownWithVulnerabilitiesPart) {
        function from(part) {
            return {
                kind: 'markdownVuln',
                content: MarkdownString.from(part.value),
                vulnerabilities: part.vulnerabilities,
            };
        }
        ChatResponseMarkdownWithVulnerabilitiesPart.from = from;
        function to(part) {
            return new types.ChatResponseMarkdownWithVulnerabilitiesPart(MarkdownString.to(part.content), part.vulnerabilities);
        }
        ChatResponseMarkdownWithVulnerabilitiesPart.to = to;
    })(ChatResponseMarkdownWithVulnerabilitiesPart || (exports.ChatResponseMarkdownWithVulnerabilitiesPart = ChatResponseMarkdownWithVulnerabilitiesPart = {}));
    var ChatResponseDetectedParticipantPart;
    (function (ChatResponseDetectedParticipantPart) {
        function from(part) {
            return {
                kind: 'agentDetection',
                agentId: part.participant,
                command: part.command,
            };
        }
        ChatResponseDetectedParticipantPart.from = from;
        function to(part) {
            return new types.ChatResponseDetectedParticipantPart(part.agentId, part.command);
        }
        ChatResponseDetectedParticipantPart.to = to;
    })(ChatResponseDetectedParticipantPart || (exports.ChatResponseDetectedParticipantPart = ChatResponseDetectedParticipantPart = {}));
    var ChatResponseFilesPart;
    (function (ChatResponseFilesPart) {
        function from(part) {
            const { value, baseUri } = part;
            function convert(items, baseUri) {
                return items.map(item => {
                    const myUri = uri_1.URI.joinPath(baseUri, item.name);
                    return {
                        label: item.name,
                        uri: myUri,
                        children: item.children && convert(item.children, myUri)
                    };
                });
            }
            return {
                kind: 'treeData',
                treeData: {
                    label: (0, resources_1.basename)(baseUri),
                    uri: baseUri,
                    children: convert(value, baseUri)
                }
            };
        }
        ChatResponseFilesPart.from = from;
        function to(part) {
            const treeData = (0, marshalling_1.revive)(part.treeData);
            function convert(items) {
                return items.map(item => {
                    return {
                        name: item.label,
                        children: item.children && convert(item.children)
                    };
                });
            }
            const baseUri = treeData.uri;
            const items = treeData.children ? convert(treeData.children) : [];
            return new types.ChatResponseFileTreePart(items, baseUri);
        }
        ChatResponseFilesPart.to = to;
    })(ChatResponseFilesPart || (exports.ChatResponseFilesPart = ChatResponseFilesPart = {}));
    var ChatResponseAnchorPart;
    (function (ChatResponseAnchorPart) {
        function from(part) {
            return {
                kind: 'inlineReference',
                name: part.title,
                inlineReference: !uri_1.URI.isUri(part.value) ? Location.from(part.value) : part.value
            };
        }
        ChatResponseAnchorPart.from = from;
        function to(part) {
            const value = (0, marshalling_1.revive)(part);
            return new types.ChatResponseAnchorPart(uri_1.URI.isUri(value.inlineReference) ? value.inlineReference : Location.to(value.inlineReference), part.name);
        }
        ChatResponseAnchorPart.to = to;
    })(ChatResponseAnchorPart || (exports.ChatResponseAnchorPart = ChatResponseAnchorPart = {}));
    var ChatResponseProgressPart;
    (function (ChatResponseProgressPart) {
        function from(part) {
            return {
                kind: 'progressMessage',
                content: MarkdownString.from(part.value)
            };
        }
        ChatResponseProgressPart.from = from;
        function to(part) {
            return new types.ChatResponseProgressPart(part.content.value);
        }
        ChatResponseProgressPart.to = to;
    })(ChatResponseProgressPart || (exports.ChatResponseProgressPart = ChatResponseProgressPart = {}));
    var ChatResponseCommandButtonPart;
    (function (ChatResponseCommandButtonPart) {
        function from(part, commandsConverter, commandDisposables) {
            // If the command isn't in the converter, then this session may have been restored, and the command args don't exist anymore
            const command = commandsConverter.toInternal(part.value, commandDisposables) ?? { command: part.value.command, title: part.value.title };
            return {
                kind: 'command',
                command
            };
        }
        ChatResponseCommandButtonPart.from = from;
        function to(part, commandsConverter) {
            // If the command isn't in the converter, then this session may have been restored, and the command args don't exist anymore
            return new types.ChatResponseCommandButtonPart(commandsConverter.fromInternal(part.command) ?? { command: part.command.id, title: part.command.title });
        }
        ChatResponseCommandButtonPart.to = to;
    })(ChatResponseCommandButtonPart || (exports.ChatResponseCommandButtonPart = ChatResponseCommandButtonPart = {}));
    var ChatResponseTextEditPart;
    (function (ChatResponseTextEditPart) {
        function from(part) {
            return {
                kind: 'textEdit',
                uri: part.uri,
                edits: part.edits.map(e => TextEdit.from(e))
            };
        }
        ChatResponseTextEditPart.from = from;
        function to(part) {
            return new types.ChatResponseTextEditPart(uri_1.URI.revive(part.uri), part.edits.map(e => TextEdit.to(e)));
        }
        ChatResponseTextEditPart.to = to;
    })(ChatResponseTextEditPart || (exports.ChatResponseTextEditPart = ChatResponseTextEditPart = {}));
    var ChatResponseReferencePart;
    (function (ChatResponseReferencePart) {
        function from(part) {
            const iconPath = themables_1.ThemeIcon.isThemeIcon(part.iconPath) ? part.iconPath : undefined;
            if ('variableName' in part.value) {
                return {
                    kind: 'reference',
                    reference: {
                        variableName: part.value.variableName,
                        value: uri_1.URI.isUri(part.value.value) || !part.value.value ?
                            part.value.value :
                            Location.from(part.value.value)
                    },
                    iconPath
                };
            }
            return {
                kind: 'reference',
                reference: uri_1.URI.isUri(part.value) ?
                    part.value :
                    Location.from(part.value),
                iconPath
            };
        }
        ChatResponseReferencePart.from = from;
        function to(part) {
            const value = (0, marshalling_1.revive)(part);
            const mapValue = (value) => uri_1.URI.isUri(value) ?
                value :
                Location.to(value);
            return new types.ChatResponseReferencePart('variableName' in value.reference ? {
                variableName: value.reference.variableName,
                value: value.reference.value && mapValue(value.reference.value)
            } :
                mapValue(value.reference));
        }
        ChatResponseReferencePart.to = to;
    })(ChatResponseReferencePart || (exports.ChatResponseReferencePart = ChatResponseReferencePart = {}));
    var ChatResponsePart;
    (function (ChatResponsePart) {
        function from(part, commandsConverter, commandDisposables) {
            if (part instanceof types.ChatResponseMarkdownPart) {
                return ChatResponseMarkdownPart.from(part);
            }
            else if (part instanceof types.ChatResponseAnchorPart) {
                return ChatResponseAnchorPart.from(part);
            }
            else if (part instanceof types.ChatResponseReferencePart) {
                return ChatResponseReferencePart.from(part);
            }
            else if (part instanceof types.ChatResponseProgressPart) {
                return ChatResponseProgressPart.from(part);
            }
            else if (part instanceof types.ChatResponseFileTreePart) {
                return ChatResponseFilesPart.from(part);
            }
            else if (part instanceof types.ChatResponseCommandButtonPart) {
                return ChatResponseCommandButtonPart.from(part, commandsConverter, commandDisposables);
            }
            else if (part instanceof types.ChatResponseTextEditPart) {
                return ChatResponseTextEditPart.from(part);
            }
            else if (part instanceof types.ChatResponseMarkdownWithVulnerabilitiesPart) {
                return ChatResponseMarkdownWithVulnerabilitiesPart.from(part);
            }
            else if (part instanceof types.ChatResponseDetectedParticipantPart) {
                return ChatResponseDetectedParticipantPart.from(part);
            }
            return {
                kind: 'markdownContent',
                content: MarkdownString.from('')
            };
        }
        ChatResponsePart.from = from;
        function to(part, commandsConverter) {
            switch (part.kind) {
                case 'reference': return ChatResponseReferencePart.to(part);
                case 'markdownContent':
                case 'inlineReference':
                case 'progressMessage':
                case 'treeData':
                case 'command':
                    return toContent(part, commandsConverter);
            }
            return undefined;
        }
        ChatResponsePart.to = to;
        function toContent(part, commandsConverter) {
            switch (part.kind) {
                case 'markdownContent': return ChatResponseMarkdownPart.to(part);
                case 'inlineReference': return ChatResponseAnchorPart.to(part);
                case 'progressMessage': return undefined;
                case 'treeData': return ChatResponseFilesPart.to(part);
                case 'command': return ChatResponseCommandButtonPart.to(part, commandsConverter);
            }
            return undefined;
        }
        ChatResponsePart.toContent = toContent;
    })(ChatResponsePart || (exports.ChatResponsePart = ChatResponsePart = {}));
    var ChatAgentRequest;
    (function (ChatAgentRequest) {
        function to(request) {
            return {
                prompt: request.message,
                command: request.command,
                attempt: request.attempt ?? 0,
                enableCommandDetection: request.enableCommandDetection ?? true,
                variables: request.variables.variables.map(ChatAgentResolvedVariable.to),
                location: ChatLocation.to(request.location),
            };
        }
        ChatAgentRequest.to = to;
    })(ChatAgentRequest || (exports.ChatAgentRequest = ChatAgentRequest = {}));
    var ChatLocation;
    (function (ChatLocation) {
        function to(loc) {
            switch (loc) {
                case chatAgents_1.ChatAgentLocation.Notebook: return types.ChatLocation.Notebook;
                case chatAgents_1.ChatAgentLocation.Terminal: return types.ChatLocation.Terminal;
                case chatAgents_1.ChatAgentLocation.Panel: return types.ChatLocation.Panel;
                case chatAgents_1.ChatAgentLocation.Editor: return types.ChatLocation.Editor;
            }
        }
        ChatLocation.to = to;
    })(ChatLocation || (exports.ChatLocation = ChatLocation = {}));
    var ChatAgentResolvedVariable;
    (function (ChatAgentResolvedVariable) {
        function to(request) {
            return {
                name: request.name,
                range: request.range && [request.range.start, request.range.endExclusive],
                values: request.values.map(ChatVariable.to)
            };
        }
        ChatAgentResolvedVariable.to = to;
    })(ChatAgentResolvedVariable || (exports.ChatAgentResolvedVariable = ChatAgentResolvedVariable = {}));
    var ChatAgentCompletionItem;
    (function (ChatAgentCompletionItem) {
        function from(item, commandsConverter, disposables) {
            return {
                label: item.label,
                values: item.values.map(ChatVariable.from),
                insertText: item.insertText,
                detail: item.detail,
                documentation: item.documentation,
                command: commandsConverter.toInternal(item.command, disposables),
            };
        }
        ChatAgentCompletionItem.from = from;
    })(ChatAgentCompletionItem || (exports.ChatAgentCompletionItem = ChatAgentCompletionItem = {}));
    var ChatAgentResult;
    (function (ChatAgentResult) {
        function to(result) {
            return {
                errorDetails: result.errorDetails,
                metadata: result.metadata,
            };
        }
        ChatAgentResult.to = to;
    })(ChatAgentResult || (exports.ChatAgentResult = ChatAgentResult = {}));
    var ChatAgentUserActionEvent;
    (function (ChatAgentUserActionEvent) {
        function to(result, event, commandsConverter) {
            if (event.action.kind === 'vote') {
                // Is the "feedback" type
                return;
            }
            const ehResult = ChatAgentResult.to(result);
            if (event.action.kind === 'command') {
                const command = event.action.commandButton.command;
                const commandButton = {
                    command: commandsConverter.fromInternal(command) ?? { command: command.id, title: command.title },
                };
                const commandAction = { kind: 'command', commandButton };
                return { action: commandAction, result: ehResult };
            }
            else if (event.action.kind === 'followUp') {
                const followupAction = { kind: 'followUp', followup: ChatFollowup.to(event.action.followup) };
                return { action: followupAction, result: ehResult };
            }
            else if (event.action.kind === 'inlineChat') {
                return { action: { kind: 'editor', accepted: event.action.action === 'accepted' }, result: ehResult };
            }
            else {
                return { action: event.action, result: ehResult };
            }
        }
        ChatAgentUserActionEvent.to = to;
    })(ChatAgentUserActionEvent || (exports.ChatAgentUserActionEvent = ChatAgentUserActionEvent = {}));
    var TerminalQuickFix;
    (function (TerminalQuickFix) {
        function from(quickFix, converter, disposables) {
            if ('terminalCommand' in quickFix) {
                return { terminalCommand: quickFix.terminalCommand, shouldExecute: quickFix.shouldExecute };
            }
            if ('uri' in quickFix) {
                return { uri: quickFix.uri };
            }
            return converter.toInternal(quickFix, disposables);
        }
        TerminalQuickFix.from = from;
    })(TerminalQuickFix || (exports.TerminalQuickFix = TerminalQuickFix = {}));
    var PartialAcceptInfo;
    (function (PartialAcceptInfo) {
        function to(info) {
            return {
                kind: PartialAcceptTriggerKind.to(info.kind),
            };
        }
        PartialAcceptInfo.to = to;
    })(PartialAcceptInfo || (exports.PartialAcceptInfo = PartialAcceptInfo = {}));
    var PartialAcceptTriggerKind;
    (function (PartialAcceptTriggerKind) {
        function to(kind) {
            switch (kind) {
                case 0 /* languages.PartialAcceptTriggerKind.Word */:
                    return types.PartialAcceptTriggerKind.Word;
                case 1 /* languages.PartialAcceptTriggerKind.Line */:
                    return types.PartialAcceptTriggerKind.Line;
                case 2 /* languages.PartialAcceptTriggerKind.Suggest */:
                    return types.PartialAcceptTriggerKind.Suggest;
                default:
                    return types.PartialAcceptTriggerKind.Unknown;
            }
        }
        PartialAcceptTriggerKind.to = to;
    })(PartialAcceptTriggerKind || (exports.PartialAcceptTriggerKind = PartialAcceptTriggerKind = {}));
    var DebugTreeItem;
    (function (DebugTreeItem) {
        function from(item, id) {
            return {
                id,
                label: item.label,
                description: item.description,
                canEdit: item.canEdit,
                collapsibleState: (item.collapsibleState || 0 /* DebugTreeItemCollapsibleState.None */),
                contextValue: item.contextValue,
            };
        }
        DebugTreeItem.from = from;
    })(DebugTreeItem || (exports.DebugTreeItem = DebugTreeItem = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR5cGVDb252ZXJ0ZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFR5cGVDb252ZXJ0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNVaEcsd0RBS0M7SUF1R0Qsa0VBa0JDO0lBRUQsd0NBU0M7SUFsWUQsSUFBaUIsU0FBUyxDQWtCekI7SUFsQkQsV0FBaUIsU0FBUztRQUV6QixTQUFnQixFQUFFLENBQUMsU0FBcUI7WUFDdkMsTUFBTSxFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUN6RyxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxFQUFFLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEVBQUUsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE9BQU8sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBTGUsWUFBRSxLQUtqQixDQUFBO1FBRUQsU0FBZ0IsSUFBSSxDQUFDLFNBQXdCO1lBQzVDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBQ3JDLE9BQU87Z0JBQ04sd0JBQXdCLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUN6QyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUM7Z0JBQzFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxJQUFJ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QUM7WUFDMUUsbURBQTJDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7WUFDaEYsNkNBQXFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDcEUsZ0RBQXdDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7WUFDMUUsNkNBQXFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDcEUsaURBQXlDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7WUFDNUUsOENBQXNDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7WUFDdEUsOENBQXNDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7WUFDdEUsZ0RBQXdDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7WUFDMUUsNkNBQW9DLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7WUFDbEUsOENBQXFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDcEUsaURBQXdDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7WUFDMUUsNkNBQW9DLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7WUFDbEUsbURBQTBDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7WUFDOUUsZ0RBQXVDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDeEUsZ0RBQXVDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDeEUsNkNBQW9DLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7WUFDbEUsOENBQXFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDcEUsNkNBQW9DLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7WUFDbEUsa0RBQXlDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7WUFDNUUsK0NBQXNDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7WUFDdEUsOENBQXFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDcEUsaURBQXdDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7WUFDMUUsc0RBQTZDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUM7WUFDcEYsNkNBQW9DLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7WUFDbEUsOENBQXFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7U0FDcEUsQ0FBQyxDQUFDO1FBRUgsU0FBZ0IsRUFBRSxDQUFDLElBQWtDO1lBQ3BELE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDO1FBQzNELENBQUM7UUFGZSxxQkFBRSxLQUVqQixDQUFBO0lBQ0YsQ0FBQyxFQXJFZ0Isa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFxRWxDO0lBRUQsSUFBaUIsY0FBYyxDQXFDOUI7SUFyQ0QsV0FBaUIsY0FBYztRQUU5QixTQUFnQixFQUFFLENBQUMsVUFBb0MsRUFBRSxTQUFzQztZQUU5RixNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxNQUFNLENBQUMsSUFBSSxHQUFHLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDbEMsTUFBTSxDQUFDLGFBQWEsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztZQUN2SixNQUFNLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDdEMsTUFBTSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixDQUFDO1lBRXRELFFBQVE7WUFDUixJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLENBQUM7aUJBQU0sSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNoSCxDQUFDO1lBRUQsTUFBTSxDQUFDLGNBQWMsR0FBRyxPQUFPLFVBQVUsQ0FBQyxlQUFlLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZSxnRUFBd0QsQ0FBQyxDQUFDO1lBQ2hMLHFCQUFxQjtZQUNyQixJQUFJLE9BQU8sVUFBVSxDQUFDLGVBQWUsS0FBSyxXQUFXLElBQUksVUFBVSxDQUFDLGVBQWUsaUVBQXlELEVBQUUsQ0FBQztnQkFDOUksTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUN6SCxDQUFDO1lBQ0QsSUFBSSxVQUFVLENBQUMsbUJBQW1CLElBQUksVUFBVSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDakYsTUFBTSxDQUFDLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQXVCLENBQUMsQ0FBQyxDQUFDO1lBQzVHLENBQUM7WUFDRCxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRTFHLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQWxDZSxpQkFBRSxLQWtDakIsQ0FBQTtJQUNGLENBQUMsRUFyQ2dCLGNBQWMsOEJBQWQsY0FBYyxRQXFDOUI7SUFFRCxJQUFpQixvQkFBb0IsQ0FpQnBDO0lBakJELFdBQWlCLG9CQUFvQjtRQUNwQyxTQUFnQixJQUFJLENBQUMsSUFBZ0M7WUFDcEQsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsTUFBTSxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsT0FBTztnQkFDTixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLGFBQWEsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7YUFDNUQsQ0FBQztRQUNILENBQUM7UUFUZSx5QkFBSSxPQVNuQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLElBQW9DO1lBQ3RELE9BQU87Z0JBQ04sS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixhQUFhLEVBQUUsV0FBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhO2FBQzVILENBQUM7UUFDSCxDQUFDO1FBTGUsdUJBQUUsS0FLakIsQ0FBQTtJQUNGLENBQUMsRUFqQmdCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBaUJwQztJQUVELElBQWlCLG9CQUFvQixDQW1CcEM7SUFuQkQsV0FBaUIsb0JBQW9CO1FBRXBDLFNBQWdCLElBQUksQ0FBQyxJQUFnQztZQUNwRCxPQUFPO2dCQUNOLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsYUFBYSxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztnQkFDNUQsVUFBVSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEcsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO2FBQ3JDLENBQUM7UUFDSCxDQUFDO1FBUGUseUJBQUksT0FPbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxJQUFvQztZQUN0RCxPQUFPO2dCQUNOLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsYUFBYSxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYTtnQkFDNUgsVUFBVSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUYsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO2FBQ3JDLENBQUM7UUFDSCxDQUFDO1FBUGUsdUJBQUUsS0FPakIsQ0FBQTtJQUNGLENBQUMsRUFuQmdCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBbUJwQztJQUVELElBQWlCLGFBQWEsQ0FpQjdCO0lBakJELFdBQWlCLGFBQWE7UUFFN0IsU0FBZ0IsSUFBSSxDQUFDLElBQXlCO1lBQzdDLE9BQU87Z0JBQ04sZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO2dCQUNyQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7Z0JBQ3JDLFVBQVUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7YUFDaEcsQ0FBQztRQUNILENBQUM7UUFOZSxrQkFBSSxPQU1uQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLElBQTZCO1lBQy9DLE9BQU87Z0JBQ04sZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO2dCQUNyQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7Z0JBQ3JDLFVBQVUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7YUFDOUYsQ0FBQztRQUNILENBQUM7UUFOZSxnQkFBRSxLQU1qQixDQUFBO0lBQ0YsQ0FBQyxFQWpCZ0IsYUFBYSw2QkFBYixhQUFhLFFBaUI3QjtJQUVELElBQWlCLFNBQVMsQ0FjekI7SUFkRCxXQUFpQixTQUFTO1FBRXpCLFNBQWdCLEVBQUUsQ0FBQyxTQUFxQyxFQUFFLElBQXlCO1lBQ2xGLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FDOUIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQzFCLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQzlHLElBQUksQ0FBQyxJQUFJLElBQUksYUFBYSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ3hDLENBQUM7WUFDRixHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLEdBQUcsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDMUcsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ25DLEdBQUcsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNyQyxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFYZSxZQUFFLEtBV2pCLENBQUE7SUFDRixDQUFDLEVBZGdCLFNBQVMseUJBQVQsU0FBUyxRQWN6QjtJQUVELElBQWlCLGtCQUFrQixDQWVsQztJQWZELFdBQWlCLGtCQUFrQjtRQUVsQyxTQUFnQixFQUFFLENBQUMsU0FBcUMsRUFBRSxJQUFrQztZQUMzRixNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDMUQsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDakMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDaEIsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2RCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQVplLHFCQUFFLEtBWWpCLENBQUE7SUFDRixDQUFDLEVBZmdCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBZWxDO0lBRUQsSUFBaUIsYUFBYSxDQU83QjtJQVBELFdBQWlCLGFBQWE7UUFDN0IsU0FBZ0IsSUFBSSxDQUFDLElBQTBCO1lBQzlDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUZlLGtCQUFJLE9BRW5CLENBQUE7UUFDRCxTQUFnQixFQUFFLENBQUMsSUFBNkI7WUFDL0MsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRmUsZ0JBQUUsS0FFakIsQ0FBQTtJQUNGLENBQUMsRUFQZ0IsYUFBYSw2QkFBYixhQUFhLFFBTzdCO0lBRUQsSUFBaUIsWUFBWSxDQXFCNUI7SUFyQkQsV0FBaUIsWUFBWTtRQUU1QixTQUFnQixJQUFJLENBQUMsSUFBeUI7WUFDN0MsT0FBTztnQkFDTixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUM3QixHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0JBQ2hCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTzthQUNyQixDQUFDO1FBQ0gsQ0FBQztRQU5lLGlCQUFJLE9BTW5CLENBQUE7UUFFRCxTQUFnQixFQUFFLENBQUMsSUFBcUI7WUFDdkMsSUFBSSxNQUFNLEdBQW9CLFNBQVMsQ0FBQztZQUN4QyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUM7b0JBQ0osTUFBTSxHQUFHLE9BQU8sSUFBSSxDQUFDLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFGLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxTQUFTO2dCQUNWLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQVZlLGVBQUUsS0FVakIsQ0FBQTtJQUNGLENBQUMsRUFyQmdCLFlBQVksNEJBQVosWUFBWSxRQXFCNUI7SUFFRCxJQUFpQixpQkFBaUIsQ0FtQmpDO0lBbkJELFdBQWlCLGlCQUFpQjtRQUNqQyxTQUFnQixFQUFFLENBQUMsaUJBQStDO1lBQ2pFLE1BQU0sRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hFLElBQUksaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2RCxDQUFDO1lBQ0QsSUFBSSxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMzQyxFQUFFLENBQUMsbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFUZSxvQkFBRSxLQVNqQixDQUFBO1FBRUQsU0FBZ0IsSUFBSSxDQUFDLGlCQUEyQztZQUMvRCxPQUFPO2dCQUNOLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxLQUFLO2dCQUM5QixRQUFRLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM1RixtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ2pKLENBQUM7UUFDSCxDQUFDO1FBTmUsc0JBQUksT0FNbkIsQ0FBQTtJQUNGLENBQUMsRUFuQmdCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBbUJqQztJQUVELElBQWlCLEtBQUssQ0FPckI7SUFQRCxXQUFpQixLQUFLO1FBQ3JCLFNBQWdCLEVBQUUsQ0FBQyxDQUFtQztZQUNyRCxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRmUsUUFBRSxLQUVqQixDQUFBO1FBQ0QsU0FBZ0IsSUFBSSxDQUFDLEtBQWtCO1lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUZlLFVBQUksT0FFbkIsQ0FBQTtJQUNGLENBQUMsRUFQZ0IsS0FBSyxxQkFBTCxLQUFLLFFBT3JCO0lBR0QsSUFBaUIsY0FBYyxDQVE5QjtJQVJELFdBQWlCLGNBQWM7UUFDOUIsU0FBZ0IsSUFBSSxDQUFDLEdBQTBCO1lBQzlDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRmUsbUJBQUksT0FFbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxHQUE2QjtZQUMvQyxPQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFGZSxpQkFBRSxLQUVqQixDQUFBO0lBQ0YsQ0FBQyxFQVJnQixjQUFjLDhCQUFkLGNBQWMsUUFROUI7SUFFRCxJQUFpQixzQkFBc0IsQ0FhdEM7SUFiRCxXQUFpQixzQkFBc0I7UUFFdEMsU0FBZ0IsRUFBRSxDQUFDLE1BQWtCO1lBQ3BDLFFBQVEsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCO29CQUNDLE9BQU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQztnQkFDaEQ7b0JBQ0MsT0FBTyxLQUFLLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDO2dCQUM1QyxxQ0FBNkI7Z0JBQzdCO29CQUNDLE9BQU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztRQVZlLHlCQUFFLEtBVWpCLENBQUE7SUFDRixDQUFDLEVBYmdCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBYXRDO0lBRUQsSUFBaUIsMEJBQTBCLENBMkIxQztJQTNCRCxXQUFpQiwwQkFBMEI7UUFDMUMsU0FBZ0IsSUFBSSxDQUFDLEtBQXdDO1lBQzVELFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxLQUFLLENBQUMsMEJBQTBCLENBQUMsR0FBRztvQkFDeEMseUNBQWlDO2dCQUNsQyxLQUFLLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxRQUFRO29CQUM3Qyw4Q0FBc0M7Z0JBQ3ZDLEtBQUssS0FBSyxDQUFDLDBCQUEwQixDQUFDLFFBQVE7b0JBQzdDLDhDQUFzQztnQkFDdkMsS0FBSyxLQUFLLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDO2dCQUN6QztvQkFDQyx3Q0FBZ0M7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFaZSwrQkFBSSxPQVluQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLEtBQTRCO1lBQzlDLFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2Y7b0JBQ0MsT0FBTyxLQUFLLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDO2dCQUM3QztvQkFDQyxPQUFPLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUM7Z0JBQ2xEO29CQUNDLE9BQU8sS0FBSyxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQztnQkFDbEQsc0NBQThCO2dCQUM5QjtvQkFDQyxPQUFPLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFaZSw2QkFBRSxLQVlqQixDQUFBO0lBQ0YsQ0FBQyxFQTNCZ0IsMEJBQTBCLDBDQUExQiwwQkFBMEIsUUEyQjFDO0lBRUQsSUFBaUIsU0FBUyxDQW1CekI7SUFuQkQsV0FBaUIsU0FBUztRQUV6QixTQUFnQixJQUFJLENBQUMsR0FBcUI7WUFDekMsSUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEMsc0NBQThCO1lBQy9CLENBQUM7aUJBQU0sSUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsb0NBQTRCO1lBQzdCLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBUGUsY0FBSSxPQU9uQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLEdBQXNCO1lBQ3hDLElBQUksR0FBRyxtQ0FBMkIsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1lBQzdCLENBQUM7aUJBQU0sSUFBSSxHQUFHLGlDQUF5QixFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFQZSxZQUFFLEtBT2pCLENBQUE7SUFDRixDQUFDLEVBbkJnQixTQUFTLHlCQUFULFNBQVMsUUFtQnpCO0lBRUQsSUFBaUIsZ0JBQWdCLENBYWhDO0lBYkQsV0FBaUIsZ0JBQWdCO1FBQ2hDLFNBQWdCLElBQUksQ0FBQyxHQUFpRDtZQUNyRSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDbkIsQ0FBQztZQUVELFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ2IsS0FBSyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsd0NBQWdDO2dCQUMzRSxLQUFLLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyw0Q0FBbUM7Z0JBQ3ZFLEtBQUssS0FBSyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLGtEQUF5QztZQUNwRixDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFYZSxxQkFBSSxPQVduQixDQUFBO0lBQ0YsQ0FBQyxFQWJnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQWFoQztJQUVELElBQWlCLFlBQVksQ0FlNUI7SUFmRCxXQUFpQixZQUFZO1FBQzVCLFNBQWdCLElBQUksQ0FBQyxDQUFzQjtZQUMxQyxNQUFNLEtBQUssR0FBMkIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDN0UsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1osS0FBSyxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFOZSxpQkFBSSxPQU1uQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLENBQXlCO1lBQzNDLE1BQU0sS0FBSyxHQUF3QixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMxRSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWixLQUFLLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQU5lLGVBQUUsS0FNakIsQ0FBQTtJQUNGLENBQUMsRUFmZ0IsWUFBWSw0QkFBWixZQUFZLFFBZTVCO0lBRUQsSUFBaUIsZ0JBQWdCLENBMkJoQztJQTNCRCxXQUFpQixnQkFBZ0I7UUFDaEMsU0FBZ0IsSUFBSSxDQUFDLElBQXlDO1lBQzdELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxJQUFJLEVBQUUsQ0FBQztvQkFDZCxLQUFLLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPO3dCQUNsQyxPQUFPLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7b0JBQzNDLEtBQUssS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU87d0JBQ2xDLE9BQU8sU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztvQkFDM0MsS0FBSyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBTTt3QkFDakMsT0FBTyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO2dCQUMzQyxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFaZSxxQkFBSSxPQVluQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLElBQTRDO1lBQzlELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3BCLEtBQUssU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxLQUFLO3dCQUM1QyxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7b0JBQ3ZDLEtBQUssU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxLQUFLO3dCQUM1QyxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7b0JBQ3ZDLEtBQUssU0FBUyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxLQUFLO3dCQUMzQyxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7Z0JBQ3ZDLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQVplLG1CQUFFLEtBWWpCLENBQUE7SUFDRixDQUFDLEVBM0JnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQTJCaEM7SUFPRCxJQUFpQixxQkFBcUIsQ0FnQnJDO0lBaEJELFdBQWlCLHFCQUFxQjtRQUVyQyxTQUFnQixJQUFJLENBQUMsT0FBK0I7WUFDbkQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixPQUFPO29CQUNOLE1BQU0sRUFBRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQzNFLFFBQVEsRUFBRSxPQUFPLENBQUMsVUFBVTtvQkFDNUIsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO29CQUNwQyxTQUFTLEVBQUUsT0FBTyxPQUFPLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQzVGLFFBQVEsRUFBRSxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxtQ0FBMEIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7aUJBQzNGLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQVplLDBCQUFJLE9BWW5CLENBQUE7SUFFRixDQUFDLEVBaEJnQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQWdCckM7SUFFRCxJQUFpQixXQUFXLENBeUQzQjtJQXpERCxXQUFpQixXQUFXO1FBTTNCLFNBQWdCLElBQUksQ0FBQyxPQUE4QztZQUNsRSxJQUFJLE9BQU8sWUFBWSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzlDLE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLENBQUM7WUFFRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1lBRUQsa0VBQWtFO1lBQ2xFLG9FQUFvRTtZQUNwRSxvRUFBb0U7WUFDcEUsMkJBQTJCO1lBQzNCLDBEQUEwRDtZQUMxRCxJQUFJLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxJQUFJLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzlFLE9BQU8sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDN0YsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDLENBQUMsa0NBQWtDO1FBQ25ELENBQUM7UUFuQmUsZ0JBQUksT0FtQm5CLENBQUE7UUFFRCxTQUFTLHNCQUFzQixDQUFDLEdBQVk7WUFDM0MsTUFBTSxFQUFFLEdBQUcsR0FBeUUsQ0FBQztZQUNyRixJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDO1FBQ2hFLENBQUM7UUFFRCxTQUFTLDRCQUE0QixDQUFDLEdBQVk7WUFFakQsbUVBQW1FO1lBQ25FLHNFQUFzRTtZQUN0RSx1RUFBdUU7WUFFdkUsTUFBTSxFQUFFLEdBQUcsR0FBMkQsQ0FBQztZQUN2RSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sRUFBRSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUM7UUFDdEUsQ0FBQztRQUVELFNBQWdCLEVBQUUsQ0FBQyxPQUFxRDtZQUN2RSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1lBRUQsT0FBTyxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFOZSxjQUFFLEtBTWpCLENBQUE7SUFDRixDQUFDLEVBekRnQixXQUFXLDJCQUFYLFdBQVcsUUF5RDNCO0lBRUQsSUFBaUIsZ0JBQWdCLENBdUJoQztJQXZCRCxXQUFpQixnQkFBZ0I7UUFLaEMsU0FBZ0IsSUFBSSxDQUFDLFFBQTZDO1lBQ2pFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNwQyxPQUEwQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELENBQUM7aUJBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sTUFBTSxHQUFHLFFBQWlDLENBQUMsQ0FBQyxtQ0FBbUM7Z0JBQ3JGLE9BQXdDO29CQUN2QyxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7b0JBQ3pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtvQkFDckIsT0FBTyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztvQkFDekMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO29CQUMzQixZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7aUJBQ2pDLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQWpCZSxxQkFBSSxPQWlCbkIsQ0FBQTtJQUNGLENBQUMsRUF2QmdCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBdUJoQztJQUVELElBQWlCLGtCQUFrQixDQThCbEM7SUE5QkQsV0FBaUIsa0JBQWtCO1FBRWxDLFNBQWdCLEVBQUUsQ0FBQyxDQUFVO1lBQzVCLE9BQU8sQ0FDTixDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVE7Z0JBQzVCLFdBQVcsSUFBSSxDQUFDO2dCQUNoQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQzFCLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQzFCLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO29CQUNyQixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQ3JCLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRO3dCQUNwQyxLQUFLLElBQUksTUFBTSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQzt3QkFDeEMsU0FBUyxJQUFJLE1BQU0sSUFBSSxPQUFPLE1BQU0sQ0FBQyxPQUFPLEtBQUssUUFBUTt3QkFDekQsUUFBUSxJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FDbkgsQ0FDRCxDQUNELENBQUM7UUFDSCxDQUFDO1FBZmUscUJBQUUsS0FlakIsQ0FBQTtRQUVELFNBQWdCLElBQUksQ0FBQyxVQUFxQztZQUN6RCxPQUFPO2dCQUNOLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQ2hELFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3BCLEdBQUcsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ3BCLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTztvQkFDbEIsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUMxQyxDQUFDLENBQUMsQ0FDSDthQUNELENBQUM7UUFDSCxDQUFDO1FBVmUsdUJBQUksT0FVbkIsQ0FBQTtJQUNGLENBQUMsRUE5QmdCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBOEJsQztJQUVELElBQWlCLGFBQWEsQ0FTN0I7SUFURCxXQUFpQixhQUFhO1FBRTdCLFNBQWdCLElBQUksQ0FBQyxLQUEyQjtZQUMvQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMvQyxDQUFDO1FBRmUsa0JBQUksT0FFbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxLQUFpQjtZQUNuQyxPQUFPLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRmUsZ0JBQUUsS0FFakIsQ0FBQTtJQUNGLENBQUMsRUFUZ0IsYUFBYSw2QkFBYixhQUFhLFFBUzdCO0lBRUQsSUFBaUIsNEJBQTRCLENBaUI1QztJQWpCRCxXQUFpQiw0QkFBNEI7UUFDNUMsU0FBZ0IsRUFBRSxDQUFDLElBQTRDO1lBQzlELE9BQU87Z0JBQ04sTUFBTSxFQUFFLE9BQU8sSUFBSSxDQUFDLFlBQVksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM3SixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQ25DLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYzthQUM1QixDQUFDO1FBQ0gsQ0FBQztRQU5lLCtCQUFFLEtBTWpCLENBQUE7UUFFRCxTQUFnQixJQUFJLENBQUMsSUFBeUM7WUFDN0QsT0FBTztnQkFDTixjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU87Z0JBQzVCLFlBQVksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVM7Z0JBQ3BDLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU87Z0JBQ2hDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYzthQUNuQyxDQUFDO1FBQ0gsQ0FBQztRQVBlLGlDQUFJLE9BT25CLENBQUE7SUFDRixDQUFDLEVBakJnQiw0QkFBNEIsNENBQTVCLDRCQUE0QixRQWlCNUM7SUFFRCxJQUFpQiwwQkFBMEIsQ0FhMUM7SUFiRCxXQUFpQiwwQkFBMEI7UUFDMUMsU0FBZ0IsRUFBRSxDQUFDLEtBQTJDO1lBQzdELElBQUksS0FBSyxLQUFLLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDaEUsT0FBTyxLQUFLLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDO1lBQ2pELENBQUM7aUJBQU0sSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuRSxxSkFBcUo7Z0JBQ3JKLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7aUJBQU0sSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDLDBCQUEwQixDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyRSxPQUFPLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUM7WUFDbkQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFYZSw2QkFBRSxLQVdqQixDQUFBO0lBQ0YsQ0FBQyxFQWJnQiwwQkFBMEIsMENBQTFCLDBCQUEwQixRQWExQztJQUVELElBQWlCLGdCQUFnQixDQW9CaEM7SUFwQkQsV0FBaUIsZ0JBQWdCO1FBQ2hDLFNBQWdCLElBQUksQ0FBQyxJQUE2QjtZQUNqRCxRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNkLEtBQUssS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU07b0JBQ2pDLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xDLEtBQUssS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQztnQkFDakM7b0JBQ0MsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQVJlLHFCQUFJLE9BUW5CLENBQUE7UUFFRCxTQUFnQixFQUFFLENBQUMsSUFBd0I7WUFDMUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztnQkFDZCxLQUFLLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTTtvQkFDN0IsT0FBTyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO2dCQUN0QyxLQUFLLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUM3QjtvQkFDQyxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFSZSxtQkFBRSxLQVFqQixDQUFBO0lBQ0YsQ0FBQyxFQXBCZ0IsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFvQmhDO0lBRUQsSUFBaUIsWUFBWSxDQXVCNUI7SUF2QkQsV0FBaUIsWUFBWTtRQUU1QixTQUFnQixJQUFJLENBQUMsSUFBeUI7WUFDN0MsTUFBTSxHQUFHLEdBQW9DO2dCQUM1QyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDOUMsS0FBSyxFQUFFLEVBQUU7YUFDVCxDQUFDO1lBQ0YsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQy9CLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFWZSxpQkFBSSxPQVVuQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLElBQXFDO1lBQ3ZELE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLFlBQVksQ0FDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQ25DLENBQUM7WUFDRixJQUFJLENBQUMsSUFBQSxxQkFBYSxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDOUIsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQVJlLGVBQUUsS0FRakIsQ0FBQTtJQUNGLENBQUMsRUF2QmdCLFlBQVksNEJBQVosWUFBWSxRQXVCNUI7SUFFRCxJQUFpQixnQkFBZ0IsQ0F5QmhDO0lBekJELFdBQWlCLGdCQUFnQjtRQUVoQyxTQUFnQixJQUFJLENBQUMsSUFBNkI7WUFDakQsT0FBTztnQkFDTixRQUFRLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQzFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDekIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDbEIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixnQkFBZ0IsRUFBRSw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztnQkFDaEYsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2FBQ3RFLENBQUM7UUFDSCxDQUFDO1FBVmUscUJBQUksT0FVbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxJQUF5QztZQUMzRCxPQUFPLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUNoQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUNsQyxJQUFJLENBQUMsTUFBTSxFQUNYLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUNsRSxJQUFJLENBQUMsUUFBUSxFQUNiLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsNEJBQTRCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQzFGLENBQUM7UUFDSCxDQUFDO1FBVmUsbUJBQUUsS0FVakIsQ0FBQTtJQUNGLENBQUMsRUF6QmdCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBeUJoQztJQUVELElBQWlCLHNCQUFzQixDQVd0QztJQVhELFdBQWlCLHNCQUFzQjtRQUN0QyxTQUFnQixJQUFJLENBQUMsSUFBa0M7WUFDdEQsT0FBTztnQkFDTixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2YsVUFBVSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDcEMsQ0FBQztRQUNILENBQUM7UUFMZSwyQkFBSSxPQUtuQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLElBQTJDO1lBQzdELE9BQU8sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFGZSx5QkFBRSxLQUVqQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQixzQkFBc0Isc0NBQXRCLHNCQUFzQixRQVd0QztJQUVELElBQWlCLGtCQUFrQixDQWFsQztJQWJELFdBQWlCLGtCQUFrQjtRQUNsQyxTQUFnQixJQUFJLENBQUMsTUFBaUM7WUFDckQsT0FBTztnQkFDTixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ25CLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7Z0JBQ3BELFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTthQUN6QixDQUFDO1FBQ0gsQ0FBQztRQU5lLHVCQUFJLE9BTW5CLENBQUE7UUFFRCxTQUFnQixFQUFFLENBQUMsTUFBeUM7WUFDM0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUQsT0FBTyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUhlLHFCQUFFLEtBR2pCLENBQUE7SUFDRixDQUFDLEVBYmdCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBYWxDO0lBR0QsSUFBaUIsZ0NBQWdDLENBa0NoRDtJQWxDRCxXQUFpQixnQ0FBZ0M7UUFLaEQsU0FBZ0IsSUFBSSxDQUFDLE9BQXFJO1lBQ3pKLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTztvQkFDTixPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksU0FBUztvQkFDdkQsT0FBTyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVM7aUJBQ3ZELENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUMvQyxDQUFDO1FBVGUscUNBQUksT0FTbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxPQUF3SztZQUMxTCxJQUFJLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLE9BQU87b0JBQ04sT0FBTyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztvQkFDeEMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztpQkFDeEMsQ0FBQztZQUNILENBQUM7WUFFRCxPQUFPLFdBQVcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQVRlLG1DQUFFLEtBU2pCLENBQUE7UUFFRCxTQUFTLGtCQUFrQixDQUFJLEdBQVE7WUFDdEMsTUFBTSxFQUFFLEdBQUcsR0FBc0QsQ0FBQztZQUNsRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxDQUFDLElBQUEseUJBQWlCLEVBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSx5QkFBaUIsRUFBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekUsQ0FBQztJQUNGLENBQUMsRUFsQ2dCLGdDQUFnQyxnREFBaEMsZ0NBQWdDLFFBa0NoRDtJQUVELElBQWlCLHFCQUFxQixDQVlyQztJQVpELFdBQWlCLHFCQUFxQjtRQUNyQyxTQUFnQixJQUFJLENBQUMsSUFBc0MsRUFBRSxpQkFBNkMsRUFBRSxXQUE0QjtZQUN2SSxNQUFNLE9BQU8sR0FBRyxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUN2RyxPQUFPO2dCQUNOLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsQ0FBQywrQ0FBdUMsQ0FBQywrQ0FBdUM7Z0JBQ3hKLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxFQUFFLGNBQWM7Z0JBQzNFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87Z0JBQ3JCLHdCQUF3QixFQUFFLElBQUksQ0FBQyx3QkFBd0I7Z0JBQ3ZELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTthQUN2QixDQUFDO1FBQ0gsQ0FBQztRQVZlLDBCQUFJLE9BVW5CLENBQUE7SUFDRixDQUFDLEVBWmdCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBWXJDO0lBRUQsSUFBaUIsMEJBQTBCLENBWTFDO0lBWkQsV0FBaUIsMEJBQTBCO1FBQzFDLFNBQWdCLElBQUksQ0FBQyxJQUF1QyxFQUFFLGlCQUE2QyxFQUFFLFdBQTRCO1lBQ3hJLE1BQU0sT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBRXZHLE9BQU87Z0JBQ04sT0FBTyxFQUFFLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDO2dCQUMzRCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7YUFDakMsQ0FBQztRQUNILENBQUM7UUFWZSwrQkFBSSxPQVVuQixDQUFBO0lBQ0YsQ0FBQyxFQVpnQiwwQkFBMEIsMENBQTFCLDBCQUEwQixRQVkxQztJQUVELElBQWlCLDhCQUE4QixDQVM5QztJQVRELFdBQWlCLDhCQUE4QjtRQUM5QyxTQUFnQixJQUFJLENBQUMsT0FBMEQ7WUFDOUUsT0FBTztnQkFDTixnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLElBQUksS0FBSztnQkFDcEQscUJBQXFCLEVBQUUsT0FBTyxFQUFFLHFCQUFxQixJQUFJLEVBQUU7Z0JBQzNELHlCQUF5QixFQUFFLE9BQU8sRUFBRSx5QkFBeUIsSUFBSSxFQUFFO2dCQUNuRSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLElBQUksRUFBRTthQUN2RCxDQUFDO1FBQ0gsQ0FBQztRQVBlLG1DQUFJLE9BT25CLENBQUE7SUFDRixDQUFDLEVBVGdCLDhCQUE4Qiw4Q0FBOUIsOEJBQThCLFFBUzlDO0lBRUQsSUFBaUIsc0JBQXNCLENBV3RDO0lBWEQsV0FBaUIsc0JBQXNCO1FBQ3RDLFNBQWdCLElBQUksQ0FBQyxPQUFzQztZQUMxRCxPQUFPO2dCQUNOLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRztnQkFDaEIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO2FBQzFCLENBQUM7UUFDSCxDQUFDO1FBTGUsMkJBQUksT0FLbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxPQUE0RDtZQUM5RSxPQUFPLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRmUseUJBQUUsS0FFakIsQ0FBQTtJQUNGLENBQUMsRUFYZ0Isc0JBQXNCLHNDQUF0QixzQkFBc0IsUUFXdEM7SUFFRCxJQUFpQixXQUFXLENBb0IzQjtJQXBCRCxXQUFpQixXQUFXO1FBQzNCLFNBQWdCLElBQUksQ0FBQyxPQUEyQjtZQUMvQyxPQUFPO2dCQUNOLE9BQU8sRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO2dCQUN6RCxJQUFJLCtCQUF1QjtnQkFDM0IsUUFBUSxFQUFFLE9BQU8sQ0FBQyxjQUFjO2dCQUNoQyxNQUFNLEVBQUUsT0FBTyxDQUFDLFlBQVk7Z0JBQzVCLFlBQVksRUFBRSxPQUFPLENBQUMsWUFBWTtnQkFDbEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDeEcsQ0FBQztRQUNILENBQUM7UUFUZSxnQkFBSSxPQVNuQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLElBQWtDO1lBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pILE9BQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNuQyxPQUFPLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdkMsT0FBTyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUMxRSxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBUGUsY0FBRSxLQU9qQixDQUFBO0lBQ0YsQ0FBQyxFQXBCZ0IsV0FBVywyQkFBWCxXQUFXLFFBb0IzQjtJQUVELElBQWlCLE9BQU8sQ0FJdkI7SUFKRCxXQUFpQixPQUFPO1FBQ1YsaUJBQVMsR0FBRyw0QkFBZ0IsQ0FBQztRQUU3QixtQkFBVyxHQUFHLDhCQUFrQixDQUFDO0lBQy9DLENBQUMsRUFKZ0IsT0FBTyx1QkFBUCxPQUFPLFFBSXZCO0lBRUQsSUFBaUIsUUFBUSxDQTZDeEI7SUE3Q0QsV0FBaUIsUUFBUTtRQUd4QixTQUFnQixJQUFJLENBQUMsSUFBcUI7WUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQ0FBZ0IsRUFBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUM7WUFDbkQsT0FBTztnQkFDTixLQUFLLEVBQUUsZUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0JBQzFELEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsR0FBRyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDekIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekQsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNyRCxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJO2dCQUNyQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJO2dCQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTthQUMxRSxDQUFDO1FBQ0gsQ0FBQztRQWJlLGFBQUksT0FhbkIsQ0FBQTtRQUVELFNBQWdCLE9BQU8sQ0FBQyxJQUEwQjtZQUNqRCxPQUFPO2dCQUNOLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixLQUFLLEVBQUUsU0FBUztnQkFDaEIsRUFBRSxFQUFFLGVBQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU87Z0JBQ3pDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsR0FBRyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDekIsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQy9CLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN6QyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakMsQ0FBQyxDQUFDO2dCQUNGLFFBQVEsRUFBRTtvQkFDVCxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDZCxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDakIsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztvQkFDeEIsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVM7b0JBQ3BCLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNsQixJQUFJLEVBQUUsQ0FBQztpQkFDUDtnQkFDRCxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQztnQkFDeEMsa0JBQWtCLEVBQUUsS0FBSztnQkFDekIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLFNBQVM7Z0JBQzFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLFNBQVM7YUFDcEMsQ0FBQztRQUNILENBQUM7UUExQmUsZ0JBQU8sVUEwQnRCLENBQUE7SUFDRixDQUFDLEVBN0NnQixRQUFRLHdCQUFSLFFBQVEsUUE2Q3hCO0lBRUQsV0FBaUIsT0FBTztRQUN2QixTQUFnQixJQUFJLENBQUMsR0FBbUI7WUFDdkMsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUZlLFlBQUksT0FFbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxHQUFhO1lBQy9CLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRmUsVUFBRSxLQUVqQixDQUFBO0lBQ0YsQ0FBQyxFQVJnQixPQUFPLHVCQUFQLE9BQU8sUUFRdkI7SUFFRCxJQUFpQixXQUFXLENBd0QzQjtJQXhERCxXQUFpQixXQUFXO1FBQzNCLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxJQUFnRCxFQUFFLE1BQWtDLEVBQXlDLEVBQUU7WUFDN0osTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxTQUFTLENBQUMsQ0FBQyx3QkFBd0I7WUFDM0MsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUE4QixDQUFDO2dCQUM1QyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDOUIsTUFBTTtnQkFDTixVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNoQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQXdDO29CQUNqRCxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVE7b0JBQ3BCLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUTt5QkFDbEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFxQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksa0NBQTBCLENBQUM7eUJBQ2xGLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2lCQUNyQixDQUFDLENBQUM7Z0JBQ0gsUUFBUSxFQUFFLEVBQUU7YUFDWixDQUFDLENBQUM7WUFFSCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQzVDLE1BQU0sQ0FBQyxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakQsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDUCxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDM0IsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUMsQ0FBQztRQUVGLFNBQWdCLEVBQUUsQ0FBQyxVQUFrQztZQUNwRCxNQUFNLElBQUksR0FBRyxJQUFJLGtDQUFxQixFQUE2QixDQUFDO1lBQ3BFLEtBQUssTUFBTSxJQUFJLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELDBEQUEwRDtZQUMxRCxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLEtBQUssR0FBaUQsRUFBRSxDQUFDO1lBQy9ELE9BQU8sS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUcsRUFBRSxDQUFDO29CQUNqQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDaEIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEIsQ0FBQzt5QkFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDMUIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7b0JBQ3BDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPO2dCQUNOLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVztnQkFDbkMsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBUyxDQUFDO2FBQ25FLENBQUM7UUFDSCxDQUFDO1FBdkJlLGNBQUUsS0F1QmpCLENBQUE7SUFDRixDQUFDLEVBeERnQixXQUFXLDJCQUFYLFdBQVcsUUF3RDNCO0lBRUQsSUFBaUIsWUFBWSxDQThDNUI7SUE5Q0QsV0FBaUIsWUFBWTtRQUM1QixTQUFTLGlCQUFpQixDQUFDLEtBQStCO1lBQ3pELE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxTQUFTLFlBQVksQ0FBQyxRQUF3QztZQUM3RCxPQUFPLE1BQU0sSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVELFNBQWdCLFdBQVcsQ0FBQyxRQUFtQztZQUM5RCxJQUFJLE9BQU8sUUFBUSxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDcEUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUVELElBQUksVUFBVSxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUM1QixPQUFPO29CQUNOLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUTtvQkFDeEIsUUFBUSxFQUFFLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO29CQUN6QyxJQUFJLDhCQUFzQjtvQkFDMUIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTTt3QkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUN2SCxDQUFDLENBQUMsU0FBUztpQkFDWixDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU87b0JBQ04sSUFBSSxnQ0FBd0I7b0JBQzVCLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtvQkFDbkIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxRQUFRO29CQUN4QixRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7aUJBQ3pDLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQXRCZSx3QkFBVyxjQXNCMUIsQ0FBQTtRQUVELFNBQWdCLFFBQVEsQ0FBQyxFQUFVLEVBQUUsUUFBNkI7WUFDakUsS0FBSyxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVELEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDekQsS0FBSyxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRTlELE9BQU87Z0JBQ04sRUFBRTtnQkFDRixHQUFHLEVBQUUsUUFBUSxDQUFDLEdBQUc7Z0JBQ2pCLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3hELE1BQU0sRUFBRSxRQUFRLENBQUMsY0FBYyxJQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7Z0JBQzdFLFdBQVcsRUFBRSxRQUFRLENBQUMsbUJBQW1CLElBQUksaUJBQWlCLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDO2FBQzVGLENBQUM7UUFDSCxDQUFDO1FBWmUscUJBQVEsV0FZdkIsQ0FBQTtJQUNGLENBQUMsRUE5Q2dCLFlBQVksNEJBQVosWUFBWSxRQThDNUI7SUFFRCxJQUFpQixxQkFBcUIsQ0FXckM7SUFYRCxXQUFpQixxQkFBcUI7UUFFckMsU0FBZ0IsRUFBRSxDQUFDLEtBQXNDO1lBQ3hELFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2Y7b0JBQ0MsT0FBTyxLQUFLLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDO2dCQUUzQztvQkFDQyxPQUFPLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFSZSx3QkFBRSxLQVFqQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQVdyQztJQUVELElBQWlCLGlCQUFpQixDQXVDakM7SUF2Q0QsV0FBaUIsaUJBQWlCO1FBRWpDLFNBQWdCLEVBQUUsQ0FBQyxJQUEyQztZQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FDekMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ3hCLElBQUksQ0FBQyxJQUFJLEVBQ1QsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQ2pCLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUNwQixLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFDcEIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQzdCLENBQUM7WUFFRixNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDcEMsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBRTlCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQWRlLG9CQUFFLEtBY2pCLENBQUE7UUFFRCxTQUFnQixJQUFJLENBQUMsSUFBOEIsRUFBRSxTQUFrQixFQUFFLE1BQWU7WUFFdkYsU0FBUyxHQUFHLFNBQVMsSUFBOEIsSUFBSyxDQUFDLFVBQVUsQ0FBQztZQUNwRSxNQUFNLEdBQUcsTUFBTSxJQUE4QixJQUFLLENBQUMsT0FBTyxDQUFDO1lBRTNELElBQUksU0FBUyxLQUFLLFNBQVMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELE9BQU87Z0JBQ04sVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLE9BQU8sRUFBRSxNQUFNO2dCQUNmLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFO2dCQUN6QixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7Z0JBQ2IsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDN0IsY0FBYyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztnQkFDL0MsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7YUFDcEMsQ0FBQztRQUNILENBQUM7UUFwQmUsc0JBQUksT0FvQm5CLENBQUE7SUFDRixDQUFDLEVBdkNnQixpQkFBaUIsaUNBQWpCLGlCQUFpQixRQXVDakM7SUFFRCxJQUFpQixTQUFTLENBV3pCO0lBWEQsV0FBaUIsU0FBUztRQUN6QixTQUFnQixJQUFJLENBQUMsS0FBbUM7WUFDdkQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPO2dCQUNOLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztnQkFDbEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2FBQ3RCLENBQUM7UUFDSCxDQUFDO1FBVGUsY0FBSSxPQVNuQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQixTQUFTLHlCQUFULFNBQVMsUUFXekI7SUFFRCxJQUFpQixnQkFBZ0IsQ0EwRGhDO0lBMURELFdBQWlCLGdCQUFnQjtRQUNoQyxTQUFnQixFQUFFLENBQUMsSUFBWSxFQUFFLElBQXlDLEVBQUUsZUFBb0Q7WUFDL0gsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMzQixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLE9BQU8sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQzVDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFBLHFDQUF3QixFQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEksQ0FBQztZQUVELElBQUksSUFBSSxLQUFLLFlBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNoRCxPQUFPLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBRUQsT0FBTyxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQVplLG1CQUFFLEtBWWpCLENBQUE7UUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLElBQVksRUFBRSxJQUFpRDtZQUN6RixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUUxQyxJQUFJLElBQUksS0FBSyxZQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzVCLE9BQU87b0JBQ04sUUFBUSxFQUFFLFdBQVc7b0JBQ3JCLFFBQVEsRUFBRSxTQUFTO29CQUNuQixXQUFXLEVBQUUsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO2lCQUMxQyxDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQyxPQUFPO2dCQUNOLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDckIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO29CQUNwQixHQUFHLEVBQUUsU0FBUyxDQUFDLEdBQUc7b0JBQ2xCLEVBQUUsRUFBRyxTQUFvQyxDQUFDLE9BQU8sSUFBSyxTQUErQixDQUFDLEVBQUU7aUJBQ3hGLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDYixDQUFDO1FBQ0gsQ0FBQztRQXBCcUIscUJBQUksT0FvQnpCLENBQUE7UUFFRCxTQUFTLGdCQUFnQixDQUFDLFdBQW1CO1lBQzVDLE9BQU8sc0JBQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxJQUFJLENBQUM7b0JBQ0osT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4QixDQUFDO2dCQUFDLE1BQU0sQ0FBQztvQkFDUixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxTQUFTLGFBQWEsQ0FBQyxLQUE0QztZQUNsRSxPQUFPLHNCQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3RDLE9BQU8sT0FBTyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDRixDQUFDLEVBMURnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQTBEaEM7SUFFRCxJQUFpQixZQUFZLENBc0I1QjtJQXRCRCxXQUFpQixZQUFZO1FBQzVCLFNBQWdCLGNBQWMsQ0FBQyxLQUFzQyxFQUFFLGVBQXdEO1lBQzlILE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsT0FBTyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBVSxDQUFDO1lBQzFFLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUxlLDJCQUFjLGlCQUs3QixDQUFBO1FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxZQUFzRjtZQUNoSCxNQUFNLE1BQU0sR0FBb0MsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFFOUQsTUFBTSxRQUFRLEdBQW1CLEVBQUUsQ0FBQztZQUNwQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQzFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDekIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUVELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU1QixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFicUIsaUJBQUksT0FhekIsQ0FBQTtJQUNGLENBQUMsRUF0QmdCLFlBQVksNEJBQVosWUFBWSxRQXNCNUI7SUFFRCxJQUFpQixZQUFZLENBbUI1QjtJQW5CRCxXQUFpQixZQUFZO1FBQzVCLFNBQWdCLElBQUksQ0FBQyxRQUE2QixFQUFFLE9BQXNDO1lBQ3pGLE9BQU87Z0JBQ04sSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLFFBQVEsQ0FBQyxXQUFXLElBQUksT0FBTyxFQUFFLE9BQU8sSUFBSSxFQUFFO2dCQUN2RCxVQUFVLEVBQUUsUUFBUSxDQUFDLE9BQU8sSUFBSSxPQUFPLEVBQUUsT0FBTztnQkFDaEQsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNO2dCQUN4QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7YUFDckIsQ0FBQztRQUNILENBQUM7UUFSZSxpQkFBSSxPQVFuQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLFFBQXVCO1lBQ3pDLE9BQU87Z0JBQ04sTUFBTSxFQUFFLFFBQVEsQ0FBQyxPQUFPO2dCQUN4QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7Z0JBQ3JCLFdBQVcsRUFBRSxRQUFRLENBQUMsT0FBTztnQkFDN0IsT0FBTyxFQUFFLFFBQVEsQ0FBQyxVQUFVO2FBQzVCLENBQUM7UUFDSCxDQUFDO1FBUGUsZUFBRSxLQU9qQixDQUFBO0lBQ0YsQ0FBQyxFQW5CZ0IsWUFBWSw0QkFBWixZQUFZLFFBbUI1QjtJQUVELElBQWlCLGtCQUFrQixDQW9CbEM7SUFwQkQsV0FBaUIsa0JBQWtCO1FBQ2xDLFNBQWdCLElBQUksQ0FBQyxRQUEwQztZQUM5RCxJQUFJLFdBQVcsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztvQkFDTixJQUFJLEVBQUUsU0FBUztvQkFDZixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO29CQUMzQixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsSUFBSSxFQUFFO29CQUNuQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFO29CQUN6QixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7aUJBQ2tCLENBQUM7WUFDeEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU87b0JBQ04sSUFBSSxFQUFFLE9BQU87b0JBQ2IsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPO29CQUN6QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7b0JBQ3JCLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztpQkFDVSxDQUFDO1lBQ3RDLENBQUM7UUFFRixDQUFDO1FBbEJlLHVCQUFJLE9Ba0JuQixDQUFBO0lBQ0YsQ0FBQyxFQXBCZ0Isa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFvQmxDO0lBRUQsSUFBaUIsb0JBQW9CLENBcUJwQztJQXJCRCxXQUFpQixvQkFBb0I7UUFFcEMsU0FBZ0IsRUFBRSxDQUFDLE9BQWtDO1lBQ3BELFFBQVEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN0QixnREFBd0MsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzRyw4Q0FBc0MsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN2RyxtREFBMkMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xILENBQUM7UUFDRixDQUFDO1FBTmUsdUJBQUUsS0FNakIsQ0FBQTtRQUVELFNBQWdCLElBQUksQ0FBQyxPQUF3QztZQUM1RCxJQUFJLE9BQU8sWUFBWSxLQUFLLENBQUMsOEJBQThCLEVBQUUsQ0FBQztnQkFDN0QsT0FBTyxFQUFFLElBQUksNkNBQXFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoRixDQUFDO2lCQUFNLElBQUksT0FBTyxZQUFZLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUNsRSxPQUFPLEVBQUUsSUFBSSwyQ0FBbUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlFLENBQUM7aUJBQU0sSUFBSSxPQUFPLFlBQVksS0FBSyxDQUFDLGlDQUFpQyxFQUFFLENBQUM7Z0JBQ3ZFLE9BQU8sRUFBRSxJQUFJLGdEQUF3QyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkYsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0YsQ0FBQztRQVZlLHlCQUFJLE9BVW5CLENBQUE7SUFDRixDQUFDLEVBckJnQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQXFCcEM7SUFFRCxJQUFpQixZQUFZLENBMkI1QjtJQTNCRCxXQUFpQixZQUFZO1FBQzVCLFNBQWdCLFFBQVEsQ0FBQyxjQUEyRDtZQUNuRixNQUFNLE1BQU0sR0FBK0MsRUFBRSxDQUFDO1lBQzlELEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQVBlLHFCQUFRLFdBT3ZCLENBQUE7UUFFRCxTQUFnQixFQUFFLENBQUMsUUFBbUM7WUFDckQsT0FBTztnQkFDTixLQUFLLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQzNDLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtnQkFDbkIsS0FBSyxFQUFFLElBQUEscUJBQWUsRUFBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSztnQkFDcEYsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2FBQ2pDLENBQUM7UUFDSCxDQUFDO1FBUGUsZUFBRSxLQU9qQixDQUFBO1FBRUQsU0FBZ0IsSUFBSSxDQUFDLFFBQWtDO1lBQ3RELE9BQU87Z0JBQ04sS0FBSyxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO2dCQUM3QyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7Z0JBQ25CLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2FBQ2pDLENBQUM7UUFDSCxDQUFDO1FBUGUsaUJBQUksT0FPbkIsQ0FBQTtJQUNGLENBQUMsRUEzQmdCLFlBQVksNEJBQVosWUFBWSxRQTJCNUI7SUFFRCxJQUFpQixpQkFBaUIsQ0FxQmpDO0lBckJELFdBQWlCLGlCQUFpQjtRQUdqQyxTQUFnQixFQUFFLENBQUMsS0FBa0M7WUFDcEQsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztnQkFDbkQsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7Z0JBQ3JELEtBQUssTUFBTSxDQUFDO2dCQUNaO29CQUNDLE9BQU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQVJlLG9CQUFFLEtBUWpCLENBQUE7UUFDRCxTQUFnQixJQUFJLENBQUMsS0FBK0I7WUFDbkQsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQztnQkFDbkQsS0FBSyxLQUFLLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxRQUFRLENBQUM7Z0JBQ3JELEtBQUssS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztnQkFDbEM7b0JBQ0MsT0FBTyxNQUFNLENBQUM7WUFDaEIsQ0FBQztRQUNGLENBQUM7UUFSZSxzQkFBSSxPQVFuQixDQUFBO0lBQ0YsQ0FBQyxFQXJCZ0IsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFxQmpDO0lBRUQsSUFBaUIscUNBQXFDLENBZ0JyRDtJQWhCRCxXQUFpQixxQ0FBcUM7UUFFckQsU0FBZ0IsRUFBRSxDQUFDLElBQW9DO1lBQ3RELFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2Q7b0JBQ0MsT0FBTyxLQUFLLENBQUMscUNBQXFDLENBQUMsT0FBTyxDQUFDO2dCQUM1RDtvQkFDQyxPQUFPLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxTQUFTLENBQUM7Z0JBQzlEO29CQUNDLE9BQU8sS0FBSyxDQUFDLHFDQUFxQyxDQUFDLE1BQU0sQ0FBQztnQkFDM0Q7b0JBQ0MsT0FBTyxLQUFLLENBQUMscUNBQXFDLENBQUMsUUFBUSxDQUFDO2dCQUM3RDtvQkFDQyxPQUFPLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUM7WUFDekQsQ0FBQztRQUNGLENBQUM7UUFiZSx3Q0FBRSxLQWFqQixDQUFBO0lBQ0YsQ0FBQyxFQWhCZ0IscUNBQXFDLHFEQUFyQyxxQ0FBcUMsUUFnQnJEO0lBRUQsSUFBaUIsd0JBQXdCLENBVXhDO0lBVkQsV0FBaUIsd0JBQXdCO1FBQ3hDLFNBQWdCLElBQUksQ0FBQyxJQUFxQztZQUN6RCxPQUFPO2dCQUNOLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLE9BQU8sRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7YUFDeEMsQ0FBQztRQUNILENBQUM7UUFMZSw2QkFBSSxPQUtuQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLElBQStCO1lBQ2pELE9BQU8sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRmUsMkJBQUUsS0FFakIsQ0FBQTtJQUNGLENBQUMsRUFWZ0Isd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUFVeEM7SUFFRCxJQUFpQiwyQ0FBMkMsQ0FXM0Q7SUFYRCxXQUFpQiwyQ0FBMkM7UUFDM0QsU0FBZ0IsSUFBSSxDQUFDLElBQXdEO1lBQzVFLE9BQU87Z0JBQ04sSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLE9BQU8sRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ3hDLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTthQUNyQyxDQUFDO1FBQ0gsQ0FBQztRQU5lLGdEQUFJLE9BTW5CLENBQUE7UUFDRCxTQUFnQixFQUFFLENBQUMsSUFBcUQ7WUFDdkUsT0FBTyxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUZlLDhDQUFFLEtBRWpCLENBQUE7SUFDRixDQUFDLEVBWGdCLDJDQUEyQywyREFBM0MsMkNBQTJDLFFBVzNEO0lBRUQsSUFBaUIsbUNBQW1DLENBV25EO0lBWEQsV0FBaUIsbUNBQW1DO1FBQ25ELFNBQWdCLElBQUksQ0FBQyxJQUFnRDtZQUNwRSxPQUFPO2dCQUNOLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDekIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO2FBQ3JCLENBQUM7UUFDSCxDQUFDO1FBTmUsd0NBQUksT0FNbkIsQ0FBQTtRQUNELFNBQWdCLEVBQUUsQ0FBQyxJQUE4QjtZQUNoRCxPQUFPLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFGZSxzQ0FBRSxLQUVqQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQixtQ0FBbUMsbURBQW5DLG1DQUFtQyxRQVduRDtJQUVELElBQWlCLHFCQUFxQixDQXFDckM7SUFyQ0QsV0FBaUIscUJBQXFCO1FBQ3JDLFNBQWdCLElBQUksQ0FBQyxJQUFxQztZQUN6RCxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUNoQyxTQUFTLE9BQU8sQ0FBQyxLQUFvQyxFQUFFLE9BQVk7Z0JBQ2xFLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkIsTUFBTSxLQUFLLEdBQUcsU0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMvQyxPQUFPO3dCQUNOLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSTt3QkFDaEIsR0FBRyxFQUFFLEtBQUs7d0JBQ1YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDO3FCQUN4RCxDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU87Z0JBQ04sSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLFFBQVEsRUFBRTtvQkFDVCxLQUFLLEVBQUUsSUFBQSxvQkFBUSxFQUFDLE9BQU8sQ0FBQztvQkFDeEIsR0FBRyxFQUFFLE9BQU87b0JBQ1osUUFBUSxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDO2lCQUNqQzthQUNELENBQUM7UUFDSCxDQUFDO1FBcEJlLDBCQUFJLE9Bb0JuQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLElBQXdCO1lBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUEsb0JBQU0sRUFBb0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFGLFNBQVMsT0FBTyxDQUFDLEtBQTBEO2dCQUMxRSxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3ZCLE9BQU87d0JBQ04sSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLO3dCQUNoQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztxQkFDakQsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQzdCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxPQUFPLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBZGUsd0JBQUUsS0FjakIsQ0FBQTtJQUNGLENBQUMsRUFyQ2dCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBcUNyQztJQUVELElBQWlCLHNCQUFzQixDQWdCdEM7SUFoQkQsV0FBaUIsc0JBQXNCO1FBQ3RDLFNBQWdCLElBQUksQ0FBQyxJQUFtQztZQUN2RCxPQUFPO2dCQUNOLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDaEIsZUFBZSxFQUFFLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQWtCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUs7YUFDakcsQ0FBQztRQUNILENBQUM7UUFOZSwyQkFBSSxPQU1uQixDQUFBO1FBRUQsU0FBZ0IsRUFBRSxDQUFDLElBQXNDO1lBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUEsb0JBQU0sRUFBOEIsSUFBSSxDQUFDLENBQUM7WUFDeEQsT0FBTyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FDdEMsU0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUM3RixJQUFJLENBQUMsSUFBSSxDQUNULENBQUM7UUFDSCxDQUFDO1FBTmUseUJBQUUsS0FNakIsQ0FBQTtJQUNGLENBQUMsRUFoQmdCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBZ0J0QztJQUVELElBQWlCLHdCQUF3QixDQVV4QztJQVZELFdBQWlCLHdCQUF3QjtRQUN4QyxTQUFnQixJQUFJLENBQUMsSUFBcUM7WUFDekQsT0FBTztnQkFDTixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixPQUFPLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQ3hDLENBQUM7UUFDSCxDQUFDO1FBTGUsNkJBQUksT0FLbkIsQ0FBQTtRQUNELFNBQWdCLEVBQUUsQ0FBQyxJQUErQjtZQUNqRCxPQUFPLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUZlLDJCQUFFLEtBRWpCLENBQUE7SUFDRixDQUFDLEVBVmdCLHdCQUF3Qix3Q0FBeEIsd0JBQXdCLFFBVXhDO0lBRUQsSUFBaUIsNkJBQTZCLENBYTdDO0lBYkQsV0FBaUIsNkJBQTZCO1FBQzdDLFNBQWdCLElBQUksQ0FBQyxJQUEwQyxFQUFFLGlCQUFvQyxFQUFFLGtCQUFtQztZQUN6SSw0SEFBNEg7WUFDNUgsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6SSxPQUFPO2dCQUNOLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU87YUFDUCxDQUFDO1FBQ0gsQ0FBQztRQVBlLGtDQUFJLE9BT25CLENBQUE7UUFDRCxTQUFnQixFQUFFLENBQUMsSUFBNkIsRUFBRSxpQkFBb0M7WUFDckYsNEhBQTRIO1lBQzVILE9BQU8sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3pKLENBQUM7UUFIZSxnQ0FBRSxLQUdqQixDQUFBO0lBQ0YsQ0FBQyxFQWJnQiw2QkFBNkIsNkNBQTdCLDZCQUE2QixRQWE3QztJQUVELElBQWlCLHdCQUF3QixDQVl4QztJQVpELFdBQWlCLHdCQUF3QjtRQUN4QyxTQUFnQixJQUFJLENBQUMsSUFBcUM7WUFDekQsT0FBTztnQkFDTixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO2dCQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDNUMsQ0FBQztRQUNILENBQUM7UUFOZSw2QkFBSSxPQU1uQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLElBQXdCO1lBQzFDLE9BQU8sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRmUsMkJBQUUsS0FFakIsQ0FBQTtJQUVGLENBQUMsRUFaZ0Isd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUFZeEM7SUFFRCxJQUFpQix5QkFBeUIsQ0F1Q3pDO0lBdkNELFdBQWlCLHlCQUF5QjtRQUN6QyxTQUFnQixJQUFJLENBQUMsSUFBc0M7WUFDMUQsTUFBTSxRQUFRLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDbEYsSUFBSSxjQUFjLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxPQUFPO29CQUNOLElBQUksRUFBRSxXQUFXO29CQUNqQixTQUFTLEVBQUU7d0JBQ1YsWUFBWSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWTt3QkFDckMsS0FBSyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3hELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ2xCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUF3QixDQUFDO3FCQUNuRDtvQkFDRCxRQUFRO2lCQUNSLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTztnQkFDTixJQUFJLEVBQUUsV0FBVztnQkFDakIsU0FBUyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDWixRQUFRLENBQUMsSUFBSSxDQUFrQixJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUMzQyxRQUFRO2FBQ1IsQ0FBQztRQUNILENBQUM7UUF0QmUsOEJBQUksT0FzQm5CLENBQUE7UUFDRCxTQUFnQixFQUFFLENBQUMsSUFBZ0M7WUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBQSxvQkFBTSxFQUF3QixJQUFJLENBQUMsQ0FBQztZQUVsRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQStCLEVBQWdDLEVBQUUsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLEtBQUssQ0FBQyxDQUFDO2dCQUNQLFFBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFcEIsT0FBTyxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FDekMsY0FBYyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFZO2dCQUMxQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO2FBQy9ELENBQUMsQ0FBQztnQkFDRixRQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUMxQixDQUFDO1FBQ0gsQ0FBQztRQWRlLDRCQUFFLEtBY2pCLENBQUE7SUFDRixDQUFDLEVBdkNnQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQXVDekM7SUFFRCxJQUFpQixnQkFBZ0IsQ0FxRGhDO0lBckRELFdBQWlCLGdCQUFnQjtRQUVoQyxTQUFnQixJQUFJLENBQUMsSUFBaUssRUFBRSxpQkFBb0MsRUFBRSxrQkFBbUM7WUFDaFEsSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3BELE9BQU8sd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3pELE9BQU8sc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBQzVELE9BQU8seUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQzNELE9BQU8sd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQzNELE9BQU8scUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLDZCQUE2QixFQUFFLENBQUM7Z0JBQ2hFLE9BQU8sNkJBQTZCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQzNELE9BQU8sd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLDJDQUEyQyxFQUFFLENBQUM7Z0JBQzlFLE9BQU8sMkNBQTJDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9ELENBQUM7aUJBQU0sSUFBSSxJQUFJLFlBQVksS0FBSyxDQUFDLG1DQUFtQyxFQUFFLENBQUM7Z0JBQ3RFLE9BQU8sbUNBQW1DLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZELENBQUM7WUFFRCxPQUFPO2dCQUNOLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLE9BQU8sRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNoQyxDQUFDO1FBQ0gsQ0FBQztRQXpCZSxxQkFBSSxPQXlCbkIsQ0FBQTtRQUVELFNBQWdCLEVBQUUsQ0FBQyxJQUFzQyxFQUFFLGlCQUFvQztZQUM5RixRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsS0FBSyxXQUFXLENBQUMsQ0FBQyxPQUFPLHlCQUF5QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUQsS0FBSyxpQkFBaUIsQ0FBQztnQkFDdkIsS0FBSyxpQkFBaUIsQ0FBQztnQkFDdkIsS0FBSyxpQkFBaUIsQ0FBQztnQkFDdkIsS0FBSyxVQUFVLENBQUM7Z0JBQ2hCLEtBQUssU0FBUztvQkFDYixPQUFPLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQVhlLG1CQUFFLEtBV2pCLENBQUE7UUFFRCxTQUFnQixTQUFTLENBQUMsSUFBNkMsRUFBRSxpQkFBb0M7WUFDNUcsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ25CLEtBQUssaUJBQWlCLENBQUMsQ0FBQyxPQUFPLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakUsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sc0JBQXNCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxLQUFLLGlCQUFpQixDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7Z0JBQ3pDLEtBQUssVUFBVSxDQUFDLENBQUMsT0FBTyxxQkFBcUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZELEtBQUssU0FBUyxDQUFDLENBQUMsT0FBTyw2QkFBNkIsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDbEYsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFWZSwwQkFBUyxZQVV4QixDQUFBO0lBQ0YsQ0FBQyxFQXJEZ0IsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFxRGhDO0lBRUQsSUFBaUIsZ0JBQWdCLENBV2hDO0lBWEQsV0FBaUIsZ0JBQWdCO1FBQ2hDLFNBQWdCLEVBQUUsQ0FBQyxPQUEwQjtZQUM1QyxPQUFPO2dCQUNOLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTztnQkFDdkIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2dCQUN4QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDO2dCQUM3QixzQkFBc0IsRUFBRSxPQUFPLENBQUMsc0JBQXNCLElBQUksSUFBSTtnQkFDOUQsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hFLFFBQVEsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7YUFDM0MsQ0FBQztRQUNILENBQUM7UUFUZSxtQkFBRSxLQVNqQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQVdoQztJQUVELElBQWlCLFlBQVksQ0FTNUI7SUFURCxXQUFpQixZQUFZO1FBQzVCLFNBQWdCLEVBQUUsQ0FBQyxHQUFzQjtZQUN4QyxRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUNiLEtBQUssOEJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQztnQkFDcEUsS0FBSyw4QkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDO2dCQUNwRSxLQUFLLDhCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7Z0JBQzlELEtBQUssOEJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQztZQUNqRSxDQUFDO1FBQ0YsQ0FBQztRQVBlLGVBQUUsS0FPakIsQ0FBQTtJQUNGLENBQUMsRUFUZ0IsWUFBWSw0QkFBWixZQUFZLFFBUzVCO0lBRUQsSUFBaUIseUJBQXlCLENBUXpDO0lBUkQsV0FBaUIseUJBQXlCO1FBQ3pDLFNBQWdCLEVBQUUsQ0FBQyxPQUFrQztZQUNwRCxPQUFPO2dCQUNOLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztnQkFDekUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7YUFDM0MsQ0FBQztRQUNILENBQUM7UUFOZSw0QkFBRSxLQU1qQixDQUFBO0lBQ0YsQ0FBQyxFQVJnQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQVF6QztJQUVELElBQWlCLHVCQUF1QixDQVd2QztJQVhELFdBQWlCLHVCQUF1QjtRQUN2QyxTQUFnQixJQUFJLENBQUMsSUFBK0IsRUFBRSxpQkFBb0MsRUFBRSxXQUE0QjtZQUN2SCxPQUFPO2dCQUNOLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0JBQzFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDM0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7Z0JBQ2pDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUM7YUFDaEUsQ0FBQztRQUNILENBQUM7UUFUZSw0QkFBSSxPQVNuQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQix1QkFBdUIsdUNBQXZCLHVCQUF1QixRQVd2QztJQUVELElBQWlCLGVBQWUsQ0FPL0I7SUFQRCxXQUFpQixlQUFlO1FBQy9CLFNBQWdCLEVBQUUsQ0FBQyxNQUF3QjtZQUMxQyxPQUFPO2dCQUNOLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTtnQkFDakMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO2FBQ3pCLENBQUM7UUFDSCxDQUFDO1FBTGUsa0JBQUUsS0FLakIsQ0FBQTtJQUNGLENBQUMsRUFQZ0IsZUFBZSwrQkFBZixlQUFlLFFBTy9CO0lBRUQsSUFBaUIsd0JBQXdCLENBd0J4QztJQXhCRCxXQUFpQix3QkFBd0I7UUFDeEMsU0FBZ0IsRUFBRSxDQUFDLE1BQXdCLEVBQUUsS0FBMkIsRUFBRSxpQkFBb0M7WUFDN0csSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDbEMseUJBQXlCO2dCQUN6QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO2dCQUNuRCxNQUFNLGFBQWEsR0FBRztvQkFDckIsT0FBTyxFQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFO2lCQUNqRyxDQUFDO2dCQUNGLE1BQU0sYUFBYSxHQUE2QixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLENBQUM7Z0JBQ25GLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUNwRCxDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sY0FBYyxHQUE4QixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN6SCxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7WUFDckQsQ0FBQztpQkFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUMvQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ3ZHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ25ELENBQUM7UUFDRixDQUFDO1FBdEJlLDJCQUFFLEtBc0JqQixDQUFBO0lBQ0YsQ0FBQyxFQXhCZ0Isd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUF3QnhDO0lBR0QsSUFBaUIsZ0JBQWdCLENBVWhDO0lBVkQsV0FBaUIsZ0JBQWdCO1FBQ2hDLFNBQWdCLElBQUksQ0FBQyxRQUFpRyxFQUFFLFNBQXFDLEVBQUUsV0FBNEI7WUFDMUwsSUFBSSxpQkFBaUIsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxFQUFFLGVBQWUsRUFBRSxRQUFRLENBQUMsZUFBZSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0YsQ0FBQztZQUNELElBQUksS0FBSyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM5QixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBUmUscUJBQUksT0FRbkIsQ0FBQTtJQUNGLENBQUMsRUFWZ0IsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFVaEM7SUFFRCxJQUFpQixpQkFBaUIsQ0FNakM7SUFORCxXQUFpQixpQkFBaUI7UUFDakMsU0FBZ0IsRUFBRSxDQUFDLElBQWlDO1lBQ25ELE9BQU87Z0JBQ04sSUFBSSxFQUFFLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQzVDLENBQUM7UUFDSCxDQUFDO1FBSmUsb0JBQUUsS0FJakIsQ0FBQTtJQUNGLENBQUMsRUFOZ0IsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFNakM7SUFFRCxJQUFpQix3QkFBd0IsQ0FheEM7SUFiRCxXQUFpQix3QkFBd0I7UUFDeEMsU0FBZ0IsRUFBRSxDQUFDLElBQXdDO1lBQzFELFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2Q7b0JBQ0MsT0FBTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDO2dCQUM1QztvQkFDQyxPQUFPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUM7Z0JBQzVDO29CQUNDLE9BQU8sS0FBSyxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQztnQkFDL0M7b0JBQ0MsT0FBTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO1FBWGUsMkJBQUUsS0FXakIsQ0FBQTtJQUNGLENBQUMsRUFiZ0Isd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUFheEM7SUFFRCxJQUFpQixhQUFhLENBVzdCO0lBWEQsV0FBaUIsYUFBYTtRQUM3QixTQUFnQixJQUFJLENBQUMsSUFBMEIsRUFBRSxFQUFVO1lBQzFELE9BQU87Z0JBQ04sRUFBRTtnQkFDRixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO2dCQUNyQixnQkFBZ0IsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsOENBQXNDLENBQWtDO2dCQUNoSCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7YUFDL0IsQ0FBQztRQUNILENBQUM7UUFUZSxrQkFBSSxPQVNuQixDQUFBO0lBQ0YsQ0FBQyxFQVhnQixhQUFhLDZCQUFiLGFBQWEsUUFXN0IifQ==