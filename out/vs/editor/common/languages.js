/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/uri", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/tokenizationRegistry", "vs/nls"], function (require, exports, codicons_1, uri_1, editOperation_1, range_1, tokenizationRegistry_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineEditTriggerKind = exports.ExternalUriOpenerPriority = exports.TokenizationRegistry = exports.LazyTokenizationSupport = exports.InlayHintKind = exports.CommentState = exports.CommentMode = exports.CommentThreadApplicability = exports.CommentThreadState = exports.CommentThreadCollapsibleState = exports.Command = exports.NewSymbolNameTriggerKind = exports.NewSymbolNameTag = exports.FoldingRangeKind = exports.TextEdit = exports.SymbolKinds = exports.SymbolTag = exports.symbolKindNames = exports.SymbolKind = exports.DocumentHighlightKind = exports.SignatureHelpTriggerKind = exports.DocumentPasteTriggerKind = exports.CodeActionTriggerType = exports.SelectedSuggestionInfo = exports.InlineCompletionTriggerKind = exports.CompletionTriggerKind = exports.PartialAcceptTriggerKind = exports.CompletionItemInsertTextRule = exports.CompletionItemTag = exports.CompletionItemKinds = exports.CompletionItemKind = exports.HoverVerbosityAction = exports.EncodedTokenizationResult = exports.TokenizationResult = exports.Token = void 0;
    exports.isLocationLink = isLocationLink;
    exports.getAriaLabelForSymbol = getAriaLabelForSymbol;
    class Token {
        constructor(offset, type, language) {
            this.offset = offset;
            this.type = type;
            this.language = language;
            this._tokenBrand = undefined;
        }
        toString() {
            return '(' + this.offset + ', ' + this.type + ')';
        }
    }
    exports.Token = Token;
    /**
     * @internal
     */
    class TokenizationResult {
        constructor(tokens, endState) {
            this.tokens = tokens;
            this.endState = endState;
            this._tokenizationResultBrand = undefined;
        }
    }
    exports.TokenizationResult = TokenizationResult;
    /**
     * @internal
     */
    class EncodedTokenizationResult {
        constructor(
        /**
         * The tokens in binary format. Each token occupies two array indices. For token i:
         *  - at offset 2*i => startIndex
         *  - at offset 2*i + 1 => metadata
         *
         */
        tokens, endState) {
            this.tokens = tokens;
            this.endState = endState;
            this._encodedTokenizationResultBrand = undefined;
        }
    }
    exports.EncodedTokenizationResult = EncodedTokenizationResult;
    var HoverVerbosityAction;
    (function (HoverVerbosityAction) {
        /**
         * Increase the verbosity of the hover
         */
        HoverVerbosityAction[HoverVerbosityAction["Increase"] = 0] = "Increase";
        /**
         * Decrease the verbosity of the hover
         */
        HoverVerbosityAction[HoverVerbosityAction["Decrease"] = 1] = "Decrease";
    })(HoverVerbosityAction || (exports.HoverVerbosityAction = HoverVerbosityAction = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        CompletionItemKind[CompletionItemKind["Method"] = 0] = "Method";
        CompletionItemKind[CompletionItemKind["Function"] = 1] = "Function";
        CompletionItemKind[CompletionItemKind["Constructor"] = 2] = "Constructor";
        CompletionItemKind[CompletionItemKind["Field"] = 3] = "Field";
        CompletionItemKind[CompletionItemKind["Variable"] = 4] = "Variable";
        CompletionItemKind[CompletionItemKind["Class"] = 5] = "Class";
        CompletionItemKind[CompletionItemKind["Struct"] = 6] = "Struct";
        CompletionItemKind[CompletionItemKind["Interface"] = 7] = "Interface";
        CompletionItemKind[CompletionItemKind["Module"] = 8] = "Module";
        CompletionItemKind[CompletionItemKind["Property"] = 9] = "Property";
        CompletionItemKind[CompletionItemKind["Event"] = 10] = "Event";
        CompletionItemKind[CompletionItemKind["Operator"] = 11] = "Operator";
        CompletionItemKind[CompletionItemKind["Unit"] = 12] = "Unit";
        CompletionItemKind[CompletionItemKind["Value"] = 13] = "Value";
        CompletionItemKind[CompletionItemKind["Constant"] = 14] = "Constant";
        CompletionItemKind[CompletionItemKind["Enum"] = 15] = "Enum";
        CompletionItemKind[CompletionItemKind["EnumMember"] = 16] = "EnumMember";
        CompletionItemKind[CompletionItemKind["Keyword"] = 17] = "Keyword";
        CompletionItemKind[CompletionItemKind["Text"] = 18] = "Text";
        CompletionItemKind[CompletionItemKind["Color"] = 19] = "Color";
        CompletionItemKind[CompletionItemKind["File"] = 20] = "File";
        CompletionItemKind[CompletionItemKind["Reference"] = 21] = "Reference";
        CompletionItemKind[CompletionItemKind["Customcolor"] = 22] = "Customcolor";
        CompletionItemKind[CompletionItemKind["Folder"] = 23] = "Folder";
        CompletionItemKind[CompletionItemKind["TypeParameter"] = 24] = "TypeParameter";
        CompletionItemKind[CompletionItemKind["User"] = 25] = "User";
        CompletionItemKind[CompletionItemKind["Issue"] = 26] = "Issue";
        CompletionItemKind[CompletionItemKind["Snippet"] = 27] = "Snippet";
    })(CompletionItemKind || (exports.CompletionItemKind = CompletionItemKind = {}));
    /**
     * @internal
     */
    var CompletionItemKinds;
    (function (CompletionItemKinds) {
        const byKind = new Map();
        byKind.set(0 /* CompletionItemKind.Method */, codicons_1.Codicon.symbolMethod);
        byKind.set(1 /* CompletionItemKind.Function */, codicons_1.Codicon.symbolFunction);
        byKind.set(2 /* CompletionItemKind.Constructor */, codicons_1.Codicon.symbolConstructor);
        byKind.set(3 /* CompletionItemKind.Field */, codicons_1.Codicon.symbolField);
        byKind.set(4 /* CompletionItemKind.Variable */, codicons_1.Codicon.symbolVariable);
        byKind.set(5 /* CompletionItemKind.Class */, codicons_1.Codicon.symbolClass);
        byKind.set(6 /* CompletionItemKind.Struct */, codicons_1.Codicon.symbolStruct);
        byKind.set(7 /* CompletionItemKind.Interface */, codicons_1.Codicon.symbolInterface);
        byKind.set(8 /* CompletionItemKind.Module */, codicons_1.Codicon.symbolModule);
        byKind.set(9 /* CompletionItemKind.Property */, codicons_1.Codicon.symbolProperty);
        byKind.set(10 /* CompletionItemKind.Event */, codicons_1.Codicon.symbolEvent);
        byKind.set(11 /* CompletionItemKind.Operator */, codicons_1.Codicon.symbolOperator);
        byKind.set(12 /* CompletionItemKind.Unit */, codicons_1.Codicon.symbolUnit);
        byKind.set(13 /* CompletionItemKind.Value */, codicons_1.Codicon.symbolValue);
        byKind.set(15 /* CompletionItemKind.Enum */, codicons_1.Codicon.symbolEnum);
        byKind.set(14 /* CompletionItemKind.Constant */, codicons_1.Codicon.symbolConstant);
        byKind.set(15 /* CompletionItemKind.Enum */, codicons_1.Codicon.symbolEnum);
        byKind.set(16 /* CompletionItemKind.EnumMember */, codicons_1.Codicon.symbolEnumMember);
        byKind.set(17 /* CompletionItemKind.Keyword */, codicons_1.Codicon.symbolKeyword);
        byKind.set(27 /* CompletionItemKind.Snippet */, codicons_1.Codicon.symbolSnippet);
        byKind.set(18 /* CompletionItemKind.Text */, codicons_1.Codicon.symbolText);
        byKind.set(19 /* CompletionItemKind.Color */, codicons_1.Codicon.symbolColor);
        byKind.set(20 /* CompletionItemKind.File */, codicons_1.Codicon.symbolFile);
        byKind.set(21 /* CompletionItemKind.Reference */, codicons_1.Codicon.symbolReference);
        byKind.set(22 /* CompletionItemKind.Customcolor */, codicons_1.Codicon.symbolCustomColor);
        byKind.set(23 /* CompletionItemKind.Folder */, codicons_1.Codicon.symbolFolder);
        byKind.set(24 /* CompletionItemKind.TypeParameter */, codicons_1.Codicon.symbolTypeParameter);
        byKind.set(25 /* CompletionItemKind.User */, codicons_1.Codicon.account);
        byKind.set(26 /* CompletionItemKind.Issue */, codicons_1.Codicon.issues);
        /**
         * @internal
         */
        function toIcon(kind) {
            let codicon = byKind.get(kind);
            if (!codicon) {
                console.info('No codicon found for CompletionItemKind ' + kind);
                codicon = codicons_1.Codicon.symbolProperty;
            }
            return codicon;
        }
        CompletionItemKinds.toIcon = toIcon;
        const data = new Map();
        data.set('method', 0 /* CompletionItemKind.Method */);
        data.set('function', 1 /* CompletionItemKind.Function */);
        data.set('constructor', 2 /* CompletionItemKind.Constructor */);
        data.set('field', 3 /* CompletionItemKind.Field */);
        data.set('variable', 4 /* CompletionItemKind.Variable */);
        data.set('class', 5 /* CompletionItemKind.Class */);
        data.set('struct', 6 /* CompletionItemKind.Struct */);
        data.set('interface', 7 /* CompletionItemKind.Interface */);
        data.set('module', 8 /* CompletionItemKind.Module */);
        data.set('property', 9 /* CompletionItemKind.Property */);
        data.set('event', 10 /* CompletionItemKind.Event */);
        data.set('operator', 11 /* CompletionItemKind.Operator */);
        data.set('unit', 12 /* CompletionItemKind.Unit */);
        data.set('value', 13 /* CompletionItemKind.Value */);
        data.set('constant', 14 /* CompletionItemKind.Constant */);
        data.set('enum', 15 /* CompletionItemKind.Enum */);
        data.set('enum-member', 16 /* CompletionItemKind.EnumMember */);
        data.set('enumMember', 16 /* CompletionItemKind.EnumMember */);
        data.set('keyword', 17 /* CompletionItemKind.Keyword */);
        data.set('snippet', 27 /* CompletionItemKind.Snippet */);
        data.set('text', 18 /* CompletionItemKind.Text */);
        data.set('color', 19 /* CompletionItemKind.Color */);
        data.set('file', 20 /* CompletionItemKind.File */);
        data.set('reference', 21 /* CompletionItemKind.Reference */);
        data.set('customcolor', 22 /* CompletionItemKind.Customcolor */);
        data.set('folder', 23 /* CompletionItemKind.Folder */);
        data.set('type-parameter', 24 /* CompletionItemKind.TypeParameter */);
        data.set('typeParameter', 24 /* CompletionItemKind.TypeParameter */);
        data.set('account', 25 /* CompletionItemKind.User */);
        data.set('issue', 26 /* CompletionItemKind.Issue */);
        /**
         * @internal
         */
        function fromString(value, strict) {
            let res = data.get(value);
            if (typeof res === 'undefined' && !strict) {
                res = 9 /* CompletionItemKind.Property */;
            }
            return res;
        }
        CompletionItemKinds.fromString = fromString;
    })(CompletionItemKinds || (exports.CompletionItemKinds = CompletionItemKinds = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        CompletionItemTag[CompletionItemTag["Deprecated"] = 1] = "Deprecated";
    })(CompletionItemTag || (exports.CompletionItemTag = CompletionItemTag = {}));
    var CompletionItemInsertTextRule;
    (function (CompletionItemInsertTextRule) {
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["None"] = 0] = "None";
        /**
         * Adjust whitespace/indentation of multiline insert texts to
         * match the current line indentation.
         */
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["KeepWhitespace"] = 1] = "KeepWhitespace";
        /**
         * `insertText` is a snippet.
         */
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["InsertAsSnippet"] = 4] = "InsertAsSnippet";
    })(CompletionItemInsertTextRule || (exports.CompletionItemInsertTextRule = CompletionItemInsertTextRule = {}));
    /**
     * How a partial acceptance was triggered.
     */
    var PartialAcceptTriggerKind;
    (function (PartialAcceptTriggerKind) {
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Word"] = 0] = "Word";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Line"] = 1] = "Line";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Suggest"] = 2] = "Suggest";
    })(PartialAcceptTriggerKind || (exports.PartialAcceptTriggerKind = PartialAcceptTriggerKind = {}));
    /**
     * How a suggest provider was triggered.
     */
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        CompletionTriggerKind[CompletionTriggerKind["Invoke"] = 0] = "Invoke";
        CompletionTriggerKind[CompletionTriggerKind["TriggerCharacter"] = 1] = "TriggerCharacter";
        CompletionTriggerKind[CompletionTriggerKind["TriggerForIncompleteCompletions"] = 2] = "TriggerForIncompleteCompletions";
    })(CompletionTriggerKind || (exports.CompletionTriggerKind = CompletionTriggerKind = {}));
    /**
     * How an {@link InlineCompletionsProvider inline completion provider} was triggered.
     */
    var InlineCompletionTriggerKind;
    (function (InlineCompletionTriggerKind) {
        /**
         * Completion was triggered automatically while editing.
         * It is sufficient to return a single completion item in this case.
         */
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 0] = "Automatic";
        /**
         * Completion was triggered explicitly by a user gesture.
         * Return multiple completion items to enable cycling through them.
         */
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Explicit"] = 1] = "Explicit";
    })(InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = InlineCompletionTriggerKind = {}));
    class SelectedSuggestionInfo {
        constructor(range, text, completionKind, isSnippetText) {
            this.range = range;
            this.text = text;
            this.completionKind = completionKind;
            this.isSnippetText = isSnippetText;
        }
        equals(other) {
            return range_1.Range.lift(this.range).equalsRange(other.range)
                && this.text === other.text
                && this.completionKind === other.completionKind
                && this.isSnippetText === other.isSnippetText;
        }
    }
    exports.SelectedSuggestionInfo = SelectedSuggestionInfo;
    var CodeActionTriggerType;
    (function (CodeActionTriggerType) {
        CodeActionTriggerType[CodeActionTriggerType["Invoke"] = 1] = "Invoke";
        CodeActionTriggerType[CodeActionTriggerType["Auto"] = 2] = "Auto";
    })(CodeActionTriggerType || (exports.CodeActionTriggerType = CodeActionTriggerType = {}));
    /**
     * @internal
     */
    var DocumentPasteTriggerKind;
    (function (DocumentPasteTriggerKind) {
        DocumentPasteTriggerKind[DocumentPasteTriggerKind["Automatic"] = 0] = "Automatic";
        DocumentPasteTriggerKind[DocumentPasteTriggerKind["PasteAs"] = 1] = "PasteAs";
    })(DocumentPasteTriggerKind || (exports.DocumentPasteTriggerKind = DocumentPasteTriggerKind = {}));
    var SignatureHelpTriggerKind;
    (function (SignatureHelpTriggerKind) {
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["Invoke"] = 1] = "Invoke";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["TriggerCharacter"] = 2] = "TriggerCharacter";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["ContentChange"] = 3] = "ContentChange";
    })(SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = SignatureHelpTriggerKind = {}));
    /**
     * A document highlight kind.
     */
    var DocumentHighlightKind;
    (function (DocumentHighlightKind) {
        /**
         * A textual occurrence.
         */
        DocumentHighlightKind[DocumentHighlightKind["Text"] = 0] = "Text";
        /**
         * Read-access of a symbol, like reading a variable.
         */
        DocumentHighlightKind[DocumentHighlightKind["Read"] = 1] = "Read";
        /**
         * Write-access of a symbol, like writing to a variable.
         */
        DocumentHighlightKind[DocumentHighlightKind["Write"] = 2] = "Write";
    })(DocumentHighlightKind || (exports.DocumentHighlightKind = DocumentHighlightKind = {}));
    /**
     * @internal
     */
    function isLocationLink(thing) {
        return thing
            && uri_1.URI.isUri(thing.uri)
            && range_1.Range.isIRange(thing.range)
            && (range_1.Range.isIRange(thing.originSelectionRange) || range_1.Range.isIRange(thing.targetSelectionRange));
    }
    /**
     * A symbol kind.
     */
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
    /**
     * @internal
     */
    exports.symbolKindNames = {
        [17 /* SymbolKind.Array */]: (0, nls_1.localize)('Array', "array"),
        [16 /* SymbolKind.Boolean */]: (0, nls_1.localize)('Boolean', "boolean"),
        [4 /* SymbolKind.Class */]: (0, nls_1.localize)('Class', "class"),
        [13 /* SymbolKind.Constant */]: (0, nls_1.localize)('Constant', "constant"),
        [8 /* SymbolKind.Constructor */]: (0, nls_1.localize)('Constructor', "constructor"),
        [9 /* SymbolKind.Enum */]: (0, nls_1.localize)('Enum', "enumeration"),
        [21 /* SymbolKind.EnumMember */]: (0, nls_1.localize)('EnumMember', "enumeration member"),
        [23 /* SymbolKind.Event */]: (0, nls_1.localize)('Event', "event"),
        [7 /* SymbolKind.Field */]: (0, nls_1.localize)('Field', "field"),
        [0 /* SymbolKind.File */]: (0, nls_1.localize)('File', "file"),
        [11 /* SymbolKind.Function */]: (0, nls_1.localize)('Function', "function"),
        [10 /* SymbolKind.Interface */]: (0, nls_1.localize)('Interface', "interface"),
        [19 /* SymbolKind.Key */]: (0, nls_1.localize)('Key', "key"),
        [5 /* SymbolKind.Method */]: (0, nls_1.localize)('Method', "method"),
        [1 /* SymbolKind.Module */]: (0, nls_1.localize)('Module', "module"),
        [2 /* SymbolKind.Namespace */]: (0, nls_1.localize)('Namespace', "namespace"),
        [20 /* SymbolKind.Null */]: (0, nls_1.localize)('Null', "null"),
        [15 /* SymbolKind.Number */]: (0, nls_1.localize)('Number', "number"),
        [18 /* SymbolKind.Object */]: (0, nls_1.localize)('Object', "object"),
        [24 /* SymbolKind.Operator */]: (0, nls_1.localize)('Operator', "operator"),
        [3 /* SymbolKind.Package */]: (0, nls_1.localize)('Package', "package"),
        [6 /* SymbolKind.Property */]: (0, nls_1.localize)('Property', "property"),
        [14 /* SymbolKind.String */]: (0, nls_1.localize)('String', "string"),
        [22 /* SymbolKind.Struct */]: (0, nls_1.localize)('Struct', "struct"),
        [25 /* SymbolKind.TypeParameter */]: (0, nls_1.localize)('TypeParameter', "type parameter"),
        [12 /* SymbolKind.Variable */]: (0, nls_1.localize)('Variable', "variable"),
    };
    /**
     * @internal
     */
    function getAriaLabelForSymbol(symbolName, kind) {
        return (0, nls_1.localize)('symbolAriaLabel', '{0} ({1})', symbolName, exports.symbolKindNames[kind]);
    }
    var SymbolTag;
    (function (SymbolTag) {
        SymbolTag[SymbolTag["Deprecated"] = 1] = "Deprecated";
    })(SymbolTag || (exports.SymbolTag = SymbolTag = {}));
    /**
     * @internal
     */
    var SymbolKinds;
    (function (SymbolKinds) {
        const byKind = new Map();
        byKind.set(0 /* SymbolKind.File */, codicons_1.Codicon.symbolFile);
        byKind.set(1 /* SymbolKind.Module */, codicons_1.Codicon.symbolModule);
        byKind.set(2 /* SymbolKind.Namespace */, codicons_1.Codicon.symbolNamespace);
        byKind.set(3 /* SymbolKind.Package */, codicons_1.Codicon.symbolPackage);
        byKind.set(4 /* SymbolKind.Class */, codicons_1.Codicon.symbolClass);
        byKind.set(5 /* SymbolKind.Method */, codicons_1.Codicon.symbolMethod);
        byKind.set(6 /* SymbolKind.Property */, codicons_1.Codicon.symbolProperty);
        byKind.set(7 /* SymbolKind.Field */, codicons_1.Codicon.symbolField);
        byKind.set(8 /* SymbolKind.Constructor */, codicons_1.Codicon.symbolConstructor);
        byKind.set(9 /* SymbolKind.Enum */, codicons_1.Codicon.symbolEnum);
        byKind.set(10 /* SymbolKind.Interface */, codicons_1.Codicon.symbolInterface);
        byKind.set(11 /* SymbolKind.Function */, codicons_1.Codicon.symbolFunction);
        byKind.set(12 /* SymbolKind.Variable */, codicons_1.Codicon.symbolVariable);
        byKind.set(13 /* SymbolKind.Constant */, codicons_1.Codicon.symbolConstant);
        byKind.set(14 /* SymbolKind.String */, codicons_1.Codicon.symbolString);
        byKind.set(15 /* SymbolKind.Number */, codicons_1.Codicon.symbolNumber);
        byKind.set(16 /* SymbolKind.Boolean */, codicons_1.Codicon.symbolBoolean);
        byKind.set(17 /* SymbolKind.Array */, codicons_1.Codicon.symbolArray);
        byKind.set(18 /* SymbolKind.Object */, codicons_1.Codicon.symbolObject);
        byKind.set(19 /* SymbolKind.Key */, codicons_1.Codicon.symbolKey);
        byKind.set(20 /* SymbolKind.Null */, codicons_1.Codicon.symbolNull);
        byKind.set(21 /* SymbolKind.EnumMember */, codicons_1.Codicon.symbolEnumMember);
        byKind.set(22 /* SymbolKind.Struct */, codicons_1.Codicon.symbolStruct);
        byKind.set(23 /* SymbolKind.Event */, codicons_1.Codicon.symbolEvent);
        byKind.set(24 /* SymbolKind.Operator */, codicons_1.Codicon.symbolOperator);
        byKind.set(25 /* SymbolKind.TypeParameter */, codicons_1.Codicon.symbolTypeParameter);
        /**
         * @internal
         */
        function toIcon(kind) {
            let icon = byKind.get(kind);
            if (!icon) {
                console.info('No codicon found for SymbolKind ' + kind);
                icon = codicons_1.Codicon.symbolProperty;
            }
            return icon;
        }
        SymbolKinds.toIcon = toIcon;
    })(SymbolKinds || (exports.SymbolKinds = SymbolKinds = {}));
    /** @internal */
    class TextEdit {
        static asEditOperation(edit) {
            return editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text);
        }
    }
    exports.TextEdit = TextEdit;
    class FoldingRangeKind {
        /**
         * Kind for folding range representing a comment. The value of the kind is 'comment'.
         */
        static { this.Comment = new FoldingRangeKind('comment'); }
        /**
         * Kind for folding range representing a import. The value of the kind is 'imports'.
         */
        static { this.Imports = new FoldingRangeKind('imports'); }
        /**
         * Kind for folding range representing regions (for example marked by `#region`, `#endregion`).
         * The value of the kind is 'region'.
         */
        static { this.Region = new FoldingRangeKind('region'); }
        /**
         * Returns a {@link FoldingRangeKind} for the given value.
         *
         * @param value of the kind.
         */
        static fromValue(value) {
            switch (value) {
                case 'comment': return FoldingRangeKind.Comment;
                case 'imports': return FoldingRangeKind.Imports;
                case 'region': return FoldingRangeKind.Region;
            }
            return new FoldingRangeKind(value);
        }
        /**
         * Creates a new {@link FoldingRangeKind}.
         *
         * @param value of the kind.
         */
        constructor(value) {
            this.value = value;
        }
    }
    exports.FoldingRangeKind = FoldingRangeKind;
    var NewSymbolNameTag;
    (function (NewSymbolNameTag) {
        NewSymbolNameTag[NewSymbolNameTag["AIGenerated"] = 1] = "AIGenerated";
    })(NewSymbolNameTag || (exports.NewSymbolNameTag = NewSymbolNameTag = {}));
    var NewSymbolNameTriggerKind;
    (function (NewSymbolNameTriggerKind) {
        NewSymbolNameTriggerKind[NewSymbolNameTriggerKind["Invoke"] = 0] = "Invoke";
        NewSymbolNameTriggerKind[NewSymbolNameTriggerKind["Automatic"] = 1] = "Automatic";
    })(NewSymbolNameTriggerKind || (exports.NewSymbolNameTriggerKind = NewSymbolNameTriggerKind = {}));
    /**
     * @internal
     */
    var Command;
    (function (Command) {
        /**
         * @internal
         */
        function is(obj) {
            if (!obj || typeof obj !== 'object') {
                return false;
            }
            return typeof obj.id === 'string' &&
                typeof obj.title === 'string';
        }
        Command.is = is;
    })(Command || (exports.Command = Command = {}));
    /**
     * @internal
     */
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
    /**
     * @internal
     */
    var CommentThreadState;
    (function (CommentThreadState) {
        CommentThreadState[CommentThreadState["Unresolved"] = 0] = "Unresolved";
        CommentThreadState[CommentThreadState["Resolved"] = 1] = "Resolved";
    })(CommentThreadState || (exports.CommentThreadState = CommentThreadState = {}));
    /**
     * @internal
     */
    var CommentThreadApplicability;
    (function (CommentThreadApplicability) {
        CommentThreadApplicability[CommentThreadApplicability["Current"] = 0] = "Current";
        CommentThreadApplicability[CommentThreadApplicability["Outdated"] = 1] = "Outdated";
    })(CommentThreadApplicability || (exports.CommentThreadApplicability = CommentThreadApplicability = {}));
    /**
     * @internal
     */
    var CommentMode;
    (function (CommentMode) {
        CommentMode[CommentMode["Editing"] = 0] = "Editing";
        CommentMode[CommentMode["Preview"] = 1] = "Preview";
    })(CommentMode || (exports.CommentMode = CommentMode = {}));
    /**
     * @internal
     */
    var CommentState;
    (function (CommentState) {
        CommentState[CommentState["Published"] = 0] = "Published";
        CommentState[CommentState["Draft"] = 1] = "Draft";
    })(CommentState || (exports.CommentState = CommentState = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        InlayHintKind[InlayHintKind["Type"] = 1] = "Type";
        InlayHintKind[InlayHintKind["Parameter"] = 2] = "Parameter";
    })(InlayHintKind || (exports.InlayHintKind = InlayHintKind = {}));
    /**
     * @internal
     */
    class LazyTokenizationSupport {
        constructor(createSupport) {
            this.createSupport = createSupport;
            this._tokenizationSupport = null;
        }
        dispose() {
            if (this._tokenizationSupport) {
                this._tokenizationSupport.then((support) => {
                    if (support) {
                        support.dispose();
                    }
                });
            }
        }
        get tokenizationSupport() {
            if (!this._tokenizationSupport) {
                this._tokenizationSupport = this.createSupport();
            }
            return this._tokenizationSupport;
        }
    }
    exports.LazyTokenizationSupport = LazyTokenizationSupport;
    /**
     * @internal
     */
    exports.TokenizationRegistry = new tokenizationRegistry_1.TokenizationRegistry();
    /**
     * @internal
     */
    var ExternalUriOpenerPriority;
    (function (ExternalUriOpenerPriority) {
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["None"] = 0] = "None";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Option"] = 1] = "Option";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Default"] = 2] = "Default";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Preferred"] = 3] = "Preferred";
    })(ExternalUriOpenerPriority || (exports.ExternalUriOpenerPriority = ExternalUriOpenerPriority = {}));
    var InlineEditTriggerKind;
    (function (InlineEditTriggerKind) {
        InlineEditTriggerKind[InlineEditTriggerKind["Invoke"] = 0] = "Invoke";
        InlineEditTriggerKind[InlineEditTriggerKind["Automatic"] = 1] = "Automatic";
    })(InlineEditTriggerKind || (exports.InlineEditTriggerKind = InlineEditTriggerKind = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd3BDaEcsd0NBS0M7SUFxSEQsc0RBRUM7SUFsdkNELE1BQWEsS0FBSztRQUdqQixZQUNpQixNQUFjLEVBQ2QsSUFBWSxFQUNaLFFBQWdCO1lBRmhCLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUxqQyxnQkFBVyxHQUFTLFNBQVMsQ0FBQztRQU85QixDQUFDO1FBRU0sUUFBUTtZQUNkLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ25ELENBQUM7S0FDRDtJQWJELHNCQWFDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLGtCQUFrQjtRQUc5QixZQUNpQixNQUFlLEVBQ2YsUUFBZ0I7WUFEaEIsV0FBTSxHQUFOLE1BQU0sQ0FBUztZQUNmLGFBQVEsR0FBUixRQUFRLENBQVE7WUFKakMsNkJBQXdCLEdBQVMsU0FBUyxDQUFDO1FBTTNDLENBQUM7S0FDRDtJQVJELGdEQVFDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLHlCQUF5QjtRQUdyQztRQUNDOzs7OztXQUtHO1FBQ2EsTUFBbUIsRUFDbkIsUUFBZ0I7WUFEaEIsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBVmpDLG9DQUErQixHQUFTLFNBQVMsQ0FBQztRQVlsRCxDQUFDO0tBQ0Q7SUFkRCw4REFjQztJQW1JRCxJQUFZLG9CQVNYO0lBVEQsV0FBWSxvQkFBb0I7UUFDL0I7O1dBRUc7UUFDSCx1RUFBUSxDQUFBO1FBQ1I7O1dBRUc7UUFDSCx1RUFBUSxDQUFBO0lBQ1QsQ0FBQyxFQVRXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBUy9CO0lBb0dELElBQWtCLGtCQTZCakI7SUE3QkQsV0FBa0Isa0JBQWtCO1FBQ25DLCtEQUFNLENBQUE7UUFDTixtRUFBUSxDQUFBO1FBQ1IseUVBQVcsQ0FBQTtRQUNYLDZEQUFLLENBQUE7UUFDTCxtRUFBUSxDQUFBO1FBQ1IsNkRBQUssQ0FBQTtRQUNMLCtEQUFNLENBQUE7UUFDTixxRUFBUyxDQUFBO1FBQ1QsK0RBQU0sQ0FBQTtRQUNOLG1FQUFRLENBQUE7UUFDUiw4REFBSyxDQUFBO1FBQ0wsb0VBQVEsQ0FBQTtRQUNSLDREQUFJLENBQUE7UUFDSiw4REFBSyxDQUFBO1FBQ0wsb0VBQVEsQ0FBQTtRQUNSLDREQUFJLENBQUE7UUFDSix3RUFBVSxDQUFBO1FBQ1Ysa0VBQU8sQ0FBQTtRQUNQLDREQUFJLENBQUE7UUFDSiw4REFBSyxDQUFBO1FBQ0wsNERBQUksQ0FBQTtRQUNKLHNFQUFTLENBQUE7UUFDVCwwRUFBVyxDQUFBO1FBQ1gsZ0VBQU0sQ0FBQTtRQUNOLDhFQUFhLENBQUE7UUFDYiw0REFBSSxDQUFBO1FBQ0osOERBQUssQ0FBQTtRQUNMLGtFQUFPLENBQUE7SUFDUixDQUFDLEVBN0JpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQTZCbkM7SUFFRDs7T0FFRztJQUNILElBQWlCLG1CQUFtQixDQStGbkM7SUEvRkQsV0FBaUIsbUJBQW1CO1FBRW5DLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxHQUFHLG9DQUE0QixrQkFBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVELE1BQU0sQ0FBQyxHQUFHLHNDQUE4QixrQkFBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sQ0FBQyxHQUFHLHlDQUFpQyxrQkFBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdEUsTUFBTSxDQUFDLEdBQUcsbUNBQTJCLGtCQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLEdBQUcsc0NBQThCLGtCQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLEdBQUcsbUNBQTJCLGtCQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLEdBQUcsb0NBQTRCLGtCQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDNUQsTUFBTSxDQUFDLEdBQUcsdUNBQStCLGtCQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEUsTUFBTSxDQUFDLEdBQUcsb0NBQTRCLGtCQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDNUQsTUFBTSxDQUFDLEdBQUcsc0NBQThCLGtCQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLEdBQUcsb0NBQTJCLGtCQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLEdBQUcsdUNBQThCLGtCQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLEdBQUcsbUNBQTBCLGtCQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLEdBQUcsb0NBQTJCLGtCQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLEdBQUcsbUNBQTBCLGtCQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLEdBQUcsdUNBQThCLGtCQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLEdBQUcsbUNBQTBCLGtCQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLEdBQUcseUNBQWdDLGtCQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNwRSxNQUFNLENBQUMsR0FBRyxzQ0FBNkIsa0JBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RCxNQUFNLENBQUMsR0FBRyxzQ0FBNkIsa0JBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RCxN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