/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/glob", "vs/base/common/iterator", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/notebook/common/notebookDocumentService"], function (require, exports, buffer_1, glob, iterator_1, mime_1, network_1, path_1, platform_1, contextkey_1, notebookDocumentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MOVE_CURSOR_1_LINE_COMMAND = exports.NotebookWorkingCopyTypeIdentifier = exports.CellStatusbarAlignment = exports.NotebookSetting = exports.NotebookEditorPriority = exports.NOTEBOOK_EDITOR_CURSOR_LINE_BOUNDARY = exports.NOTEBOOK_EDITOR_CURSOR_BOUNDARY = exports.MimeTypeDisplayOrder = exports.CellUri = exports.CellEditType = exports.SelectionStateType = exports.NotebookCellsChangeType = exports.RendererMessagingSpec = exports.NotebookRendererMatch = exports.NotebookExecutionState = exports.NotebookCellExecutionState = exports.NotebookRunState = exports.RENDERER_NOT_AVAILABLE = exports.RENDERER_EQUIVALENT_EXTENSIONS = exports.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER = exports.NOTEBOOK_DISPLAY_ORDER = exports.CellKind = exports.INTERACTIVE_WINDOW_EDITOR_ID = exports.NOTEBOOK_DIFF_EDITOR_ID = exports.NOTEBOOK_EDITOR_ID = void 0;
    exports.diff = diff;
    exports.isDocumentExcludePattern = isDocumentExcludePattern;
    exports.notebookDocumentFilterMatch = notebookDocumentFilterMatch;
    exports.isTextStreamMime = isTextStreamMime;
    exports.compressOutputItemStreams = compressOutputItemStreams;
    exports.NOTEBOOK_EDITOR_ID = 'workbench.editor.notebook';
    exports.NOTEBOOK_DIFF_EDITOR_ID = 'workbench.editor.notebookTextDiffEditor';
    exports.INTERACTIVE_WINDOW_EDITOR_ID = 'workbench.editor.interactive';
    var CellKind;
    (function (CellKind) {
        CellKind[CellKind["Markup"] = 1] = "Markup";
        CellKind[CellKind["Code"] = 2] = "Code";
    })(CellKind || (exports.CellKind = CellKind = {}));
    exports.NOTEBOOK_DISPLAY_ORDER = [
        'application/json',
        'application/javascript',
        'text/html',
        'image/svg+xml',
        mime_1.Mimes.latex,
        mime_1.Mimes.markdown,
        'image/png',
        'image/jpeg',
        mime_1.Mimes.text
    ];
    exports.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER = [
        mime_1.Mimes.latex,
        mime_1.Mimes.markdown,
        'application/json',
        'text/html',
        'image/svg+xml',
        'image/png',
        'image/jpeg',
        mime_1.Mimes.text,
    ];
    /**
     * A mapping of extension IDs who contain renderers, to notebook ids who they
     * should be treated as the same in the renderer selection logic. This is used
     * to prefer the 1st party Jupyter renderers even though they're in a separate
     * extension, for instance. See #136247.
     */
    exports.RENDERER_EQUIVALENT_EXTENSIONS = new Map([
        ['ms-toolsai.jupyter', new Set(['jupyter-notebook', 'interactive'])],
        ['ms-toolsai.jupyter-renderers', new Set(['jupyter-notebook', 'interactive'])],
    ]);
    exports.RENDERER_NOT_AVAILABLE = '_notAvailable';
    var NotebookRunState;
    (function (NotebookRunState) {
        NotebookRunState[NotebookRunState["Running"] = 1] = "Running";
        NotebookRunState[NotebookRunState["Idle"] = 2] = "Idle";
    })(NotebookRunState || (exports.NotebookRunState = NotebookRunState = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        NotebookCellExecutionState[NotebookCellExecutionState["Unconfirmed"] = 1] = "Unconfirmed";
        NotebookCellExecutionState[NotebookCellExecutionState["Pending"] = 2] = "Pending";
        NotebookCellExecutionState[NotebookCellExecutionState["Executing"] = 3] = "Executing";
    })(NotebookCellExecutionState || (exports.NotebookCellExecutionState = NotebookCellExecutionState = {}));
    var NotebookExecutionState;
    (function (NotebookExecutionState) {
        NotebookExecutionState[NotebookExecutionState["Unconfirmed"] = 1] = "Unconfirmed";
        NotebookExecutionState[NotebookExecutionState["Pending"] = 2] = "Pending";
        NotebookExecutionState[NotebookExecutionState["Executing"] = 3] = "Executing";
    })(NotebookExecutionState || (exports.NotebookExecutionState = NotebookExecutionState = {}));
    /** Note: enum values are used for sorting */
    var NotebookRendererMatch;
    (function (NotebookRendererMatch) {
        /** Renderer has a hard dependency on an available kernel */
        NotebookRendererMatch[NotebookRendererMatch["WithHardKernelDependency"] = 0] = "WithHardKernelDependency";
        /** Renderer works better with an available kernel */
        NotebookRendererMatch[NotebookRendererMatch["WithOptionalKernelDependency"] = 1] = "WithOptionalKernelDependency";
        /** Renderer is kernel-agnostic */
        NotebookRendererMatch[NotebookRendererMatch["Pure"] = 2] = "Pure";
        /** Renderer is for a different mimeType or has a hard dependency which is unsatisfied */
        NotebookRendererMatch[NotebookRendererMatch["Never"] = 3] = "Never";
    })(NotebookRendererMatch || (exports.NotebookRendererMatch = NotebookRendererMatch = {}));
    /**
     * Renderer messaging requirement. While this allows for 'optional' messaging,
     * VS Code effectively treats it the same as true right now. "Partial
     * activation" of extensions is a very tricky problem, which could allow
     * solving this. But for now, optional is mostly only honored for aznb.
     */
    var RendererMessagingSpec;
    (function (RendererMessagingSpec) {
        RendererMessagingSpec["Always"] = "always";
        RendererMessagingSpec["Never"] = "never";
        RendererMessagingSpec["Optional"] = "optional";
    })(RendererMessagingSpec || (exports.RendererMessagingSpec = RendererMessagingSpec = {}));
    var NotebookCellsChangeType;
    (function (NotebookCellsChangeType) {
        NotebookCellsChangeType[NotebookCellsChangeType["ModelChange"] = 1] = "ModelChange";
        NotebookCellsChangeType[NotebookCellsChangeType["Move"] = 2] = "Move";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellLanguage"] = 5] = "ChangeCellLanguage";
        NotebookCellsChangeType[NotebookCellsChangeType["Initialize"] = 6] = "Initialize";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellMetadata"] = 7] = "ChangeCellMetadata";
        NotebookCellsChangeType[NotebookCellsChangeType["Output"] = 8] = "Output";
        NotebookCellsChangeType[NotebookCellsChangeType["OutputItem"] = 9] = "OutputItem";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellContent"] = 10] = "ChangeCellContent";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeDocumentMetadata"] = 11] = "ChangeDocumentMetadata";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellInternalMetadata"] = 12] = "ChangeCellInternalMetadata";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeCellMime"] = 13] = "ChangeCellMime";
        NotebookCellsChangeType[NotebookCellsChangeType["Unknown"] = 100] = "Unknown";
    })(NotebookCellsChangeType || (exports.NotebookCellsChangeType = NotebookCellsChangeType = {}));
    var SelectionStateType;
    (function (SelectionStateType) {
        SelectionStateType[SelectionStateType["Handle"] = 0] = "Handle";
        SelectionStateType[SelectionStateType["Index"] = 1] = "Index";
    })(SelectionStateType || (exports.SelectionStateType = SelectionStateType = {}));
    var CellEditType;
    (function (CellEditType) {
        CellEditType[CellEditType["Replace"] = 1] = "Replace";
        CellEditType[CellEditType["Output"] = 2] = "Output";
        CellEditType[CellEditType["Metadata"] = 3] = "Metadata";
        CellEditType[CellEditType["CellLanguage"] = 4] = "CellLanguage";
        CellEditType[CellEditType["DocumentMetadata"] = 5] = "DocumentMetadata";
        CellEditType[CellEditType["Move"] = 6] = "Move";
        CellEditType[CellEditType["OutputItems"] = 7] = "OutputItems";
        CellEditType[CellEditType["PartialMetadata"] = 8] = "PartialMetadata";
        CellEditType[CellEditType["PartialInternalMetadata"] = 9] = "PartialInternalMetadata";
    })(CellEditType || (exports.CellEditType = CellEditType = {}));
    var CellUri;
    (function (CellUri) {
        CellUri.scheme = network_1.Schemas.vscodeNotebookCell;
        function generate(notebook, handle) {
            return (0, notebookDocumentService_1.generate)(notebook, handle);
        }
        CellUri.generate = generate;
        function parse(cell) {
            return (0, notebookDocumentService_1.parse)(cell);
        }
        CellUri.parse = parse;
        function generateCellOutputUri(notebook, outputId) {
            return notebook.with({
                scheme: network_1.Schemas.vscodeNotebookCellOutput,
                fragment: `op${outputId ?? ''},${notebook.scheme !== network_1.Schemas.file ? notebook.scheme : ''}`
            });
        }
        CellUri.generateCellOutputUri = generateCellOutputUri;
        function parseCellOutputUri(uri) {
            if (uri.scheme !== network_1.Schemas.vscodeNotebookCellOutput) {
                return;
            }
            const match = /^op([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?\,(.*)$/i.exec(uri.fragment);
            if (!match) {
                return undefined;
            }
            const outputId = (match[1] && match[1] !== '') ? match[1] : undefined;
            const scheme = match[2];
            return {
                outputId,
                notebook: uri.with({
                    scheme: scheme || network_1.Schemas.file,
                    fragment: null
                })
            };
        }
        CellUri.parseCellOutputUri = parseCellOutputUri;
        function generateCellPropertyUri(notebook, handle, scheme) {
            return CellUri.generate(notebook, handle).with({ scheme: scheme });
        }
        CellUri.generateCellPropertyUri = generateCellPropertyUri;
        function parseCellPropertyUri(uri, propertyScheme) {
            if (uri.scheme !== propertyScheme) {
                return undefined;
            }
            return CellUri.parse(uri.with({ scheme: CellUri.scheme }));
        }
        CellUri.parseCellPropertyUri = parseCellPropertyUri;
    })(CellUri || (exports.CellUri = CellUri = {}));
    const normalizeSlashes = (str) => platform_1.isWindows ? str.replace(/\//g, '\\') : str;
    class MimeTypeDisplayOrder {
        constructor(initialValue = [], defaultOrder = exports.NOTEBOOK_DISPLAY_ORDER) {
            this.defaultOrder = defaultOrder;
            this.order = [...new Set(initialValue)].map(pattern => ({
                pattern,
                matches: glob.parse(normalizeSlashes(pattern))
            }));
        }
        /**
         * Returns a sorted array of the input mimetypes.
         */
        sort(mimetypes) {
            const remaining = new Map(iterator_1.Iterable.map(mimetypes, m => [m, normalizeSlashes(m)]));
            let sorted = [];
            for (const { matches } of this.order) {
                for (const [original, normalized] of remaining) {
                    if (matches(normalized)) {
                        sorted.push(original);
                        remaining.delete(original);
                        break;
                    }
                }
            }
            if (remaining.size) {
                sorted = sorted.concat([...remaining.keys()].sort((a, b) => this.defaultOrder.indexOf(a) - this.defaultOrder.indexOf(b)));
            }
            return sorted;
        }
        /**
         * Records that the user selected the given mimetype over the other
         * possible mimetypes, prioritizing it for future reference.
         */
        prioritize(chosenMimetype, otherMimetypes) {
            const chosenIndex = this.findIndex(chosenMimetype);
            if (chosenIndex === -1) {
                // always first, nothing more to do
                this.order.unshift({ pattern: chosenMimetype, matches: glob.parse(normalizeSlashes(chosenMimetype)) });
                return;
            }
            // Get the other mimetypes that are before the chosenMimetype. Then, move
            // them after it, retaining order.
            const uniqueIndicies = new Set(otherMimetypes.map(m => this.findIndex(m, chosenIndex)));
            uniqueIndicies.delete(-1);
            const otherIndices = Array.from(uniqueIndicies).sort();
            this.order.splice(chosenIndex + 1, 0, ...otherIndices.map(i => this.order[i]));
            for (let oi = otherIndices.length - 1; oi >= 0; oi--) {
                this.order.splice(otherIndices[oi], 1);
            }
        }
        /**
         * Gets an array of in-order mimetype preferences.
         */
        toArray() {
            return this.order.map(o => o.pattern);
        }
        findIndex(mimeType, maxIndex = this.order.length) {
            const normalized = normalizeSlashes(mimeType);
            for (let i = 0; i < maxIndex; i++) {
                if (this.order[i].matches(normalized)) {
                    return i;
                }
            }
            return -1;
        }
    }
    exports.MimeTypeDisplayOrder = MimeTypeDisplayOrder;
    function diff(before, after, contains, equal = (a, b) => a === b) {
        const result = [];
        function pushSplice(start, deleteCount, toInsert) {
            if (deleteCount === 0 && toInsert.length === 0) {
                return;
            }
            const latest = result[result.length - 1];
            if (latest && latest.start + latest.deleteCount === start) {
                latest.deleteCount += deleteCount;
                latest.toInsert.push(...toInsert);
            }
            else {
                result.push({ start, deleteCount, toInsert });
            }
        }
        let beforeIdx = 0;
        let afterIdx = 0;
        while (true) {
            if (beforeIdx === before.length) {
                pushSplice(beforeIdx, 0, after.slice(afterIdx));
                break;
            }
            if (afterIdx === after.length) {
                pushSplice(beforeIdx, before.length - beforeIdx, []);
                break;
            }
            const beforeElement = before[beforeIdx];
            const afterElement = after[afterIdx];
            if (equal(beforeElement, afterElement)) {
                // equal
                beforeIdx += 1;
                afterIdx += 1;
                continue;
            }
            if (contains(afterElement)) {
                // `afterElement` exists before, which means some elements before `afterElement` are deleted
                pushSplice(beforeIdx, 1, []);
                beforeIdx += 1;
            }
            else {
                // `afterElement` added
                pushSplice(beforeIdx, 0, [afterElement]);
                afterIdx += 1;
            }
        }
        return result;
    }
    exports.NOTEBOOK_EDITOR_CURSOR_BOUNDARY = new contextkey_1.RawContextKey('notebookEditorCursorAtBoundary', 'none');
    exports.NOTEBOOK_EDITOR_CURSOR_LINE_BOUNDARY = new contextkey_1.RawContextKey('notebookEditorCursorAtLineBoundary', 'none');
    var NotebookEditorPriority;
    (function (NotebookEditorPriority) {
        NotebookEditorPriority["default"] = "default";
        NotebookEditorPriority["option"] = "option";
    })(NotebookEditorPriority || (exports.NotebookEditorPriority = NotebookEditorPriority = {}));
    //TODO@rebornix test
    function isDocumentExcludePattern(filenamePattern) {
        const arg = filenamePattern;
        if ((typeof arg.include === 'string' || glob.isRelativePattern(arg.include))
            && (typeof arg.exclude === 'string' || glob.isRelativePattern(arg.exclude))) {
            return true;
        }
        return false;
    }
    function notebookDocumentFilterMatch(filter, viewType, resource) {
        if (Array.isArray(filter.viewType) && filter.viewType.indexOf(viewType) >= 0) {
            return true;
        }
        if (filter.viewType === viewType) {
            return true;
        }
        if (filter.filenamePattern) {
            const filenamePattern = isDocumentExcludePattern(filter.filenamePattern) ? filter.filenamePattern.include : filter.filenamePattern;
            const excludeFilenamePattern = isDocumentExcludePattern(filter.filenamePattern) ? filter.filenamePattern.exclude : undefined;
            if (glob.match(filenamePattern, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                if (excludeFilenamePattern) {
                    if (glob.match(excludeFilenamePattern, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                        // should exclude
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    exports.NotebookSetting = {
        displayOrder: 'notebook.displayOrder',
        cellToolbarLocation: 'notebook.cellToolbarLocation',
        cellToolbarVisibility: 'notebook.cellToolbarVisibility',
        showCellStatusBar: 'notebook.showCellStatusBar',
        textDiffEditorPreview: 'notebook.diff.enablePreview',
        diffOverviewRuler: 'notebook.diff.overviewRuler',
        experimentalInsertToolbarAlignment: 'notebook.experimental.insertToolbarAlignment',
        compactView: 'notebook.compactView',
        focusIndicator: 'notebook.cellFocusIndicator',
        insertToolbarLocation: 'notebook.insertToolbarLocation',
        globalToolbar: 'notebook.globalToolbar',
        stickyScrollEnabled: 'notebook.stickyScroll.enabled',
        stickyScrollMode: 'notebook.stickyScroll.mode',
        undoRedoPerCell: 'notebook.undoRedoPerCell',
        consolidatedOutputButton: 'notebook.consolidatedOutputButton',
        showFoldingControls: 'notebook.showFoldingControls',
        dragAndDropEnabled: 'notebook.dragAndDropEnabled',
        cellEditorOptionsCustomizations: 'notebook.editorOptionsCustomizations',
        consolidatedRunButton: 'notebook.consolidatedRunButton',
        openGettingStarted: 'notebook.experimental.openGettingStarted',
        globalToolbarShowLabel: 'notebook.globalToolbarShowLabel',
        markupFontSize: 'notebook.markup.fontSize',
        interactiveWindowCollapseCodeCells: 'interactiveWindow.collapseCellInputCode',
        outputScrollingDeprecated: 'notebook.experimental.outputScrolling',
        outputScrolling: 'notebook.output.scrolling',
        textOutputLineLimit: 'notebook.output.textLineLimit',
        LinkifyOutputFilePaths: 'notebook.output.linkifyFilePaths',
        minimalErrorRendering: 'notebook.output.minimalErrorRendering',
        formatOnSave: 'notebook.formatOnSave.enabled',
        insertFinalNewline: 'notebook.insertFinalNewline',
        formatOnCellExecution: 'notebook.formatOnCellExecution',
        codeActionsOnSave: 'notebook.codeActionsOnSave',
        outputWordWrap: 'notebook.output.wordWrap',
        outputLineHeightDeprecated: 'notebook.outputLineHeight',
        outputLineHeight: 'notebook.output.lineHeight',
        outputFontSizeDeprecated: 'notebook.outputFontSize',
        outputFontSize: 'notebook.output.fontSize',
        outputFontFamilyDeprecated: 'notebook.outputFontFamily',
        outputFontFamily: 'notebook.output.fontFamily',
        findScope: 'notebook.find.scope',
        logging: 'notebook.logging',
        confirmDeleteRunningCell: 'notebook.confirmDeleteRunningCell',
        remoteSaving: 'notebook.experimental.remoteSave',
        gotoSymbolsAllSymbols: 'notebook.gotoSymbols.showAllSymbols',
        outlineShowMarkdownHeadersOnly: 'notebook.outline.showMarkdownHeadersOnly',
        outlineShowCodeCells: 'notebook.outline.showCodeCells',
        outlineShowCodeCellSymbols: 'notebook.outline.showCodeCellSymbols',
        breadcrumbsShowCodeCells: 'notebook.breadcrumbs.showCodeCells',
        scrollToRevealCell: 'notebook.scrolling.revealNextCellOnExecute',
        cellChat: 'notebook.experimental.cellChat',
        cellGenerate: 'notebook.experimental.generate',
        notebookVariablesView: 'notebook.experimental.variablesView',
        InteractiveWindowPromptToSave: 'interactiveWindow.promptToSaveOnClose',
        cellFailureDiagnostics: 'notebook.cellFailureDiagnostics',
        outputBackupSizeLimit: 'notebook.backup.sizeLimit',
    };
    var CellStatusbarAlignment;
    (function (CellStatusbarAlignment) {
        CellStatusbarAlignment[CellStatusbarAlignment["Left"] = 1] = "Left";
        CellStatusbarAlignment[CellStatusbarAlignment["Right"] = 2] = "Right";
    })(CellStatusbarAlignment || (exports.CellStatusbarAlignment = CellStatusbarAlignment = {}));
    class NotebookWorkingCopyTypeIdentifier {
        static { this._prefix = 'notebook/'; }
        static create(viewType) {
            return `${NotebookWorkingCopyTypeIdentifier._prefix}${viewType}`;
        }
        static parse(candidate) {
            if (candidate.startsWith(NotebookWorkingCopyTypeIdentifier._prefix)) {
                return candidate.substring(NotebookWorkingCopyTypeIdentifier._prefix.length);
            }
            return undefined;
        }
    }
    exports.NotebookWorkingCopyTypeIdentifier = NotebookWorkingCopyTypeIdentifier;
    /**
     * Whether the provided mime type is a text stream like `stdout`, `stderr`.
     */
    function isTextStreamMime(mimeType) {
        return ['application/vnd.code.notebook.stdout', 'application/vnd.code.notebook.stderr'].includes(mimeType);
    }
    const textDecoder = new TextDecoder();
    /**
     * Given a stream of individual stdout outputs, this function will return the compressed lines, escaping some of the common terminal escape codes.
     * E.g. some terminal escape codes would result in the previous line getting cleared, such if we had 3 lines and
     * last line contained such a code, then the result string would be just the first two lines.
     * @returns a single VSBuffer with the concatenated and compressed data, and whether any compression was done.
     */
    function compressOutputItemStreams(outputs) {
        const buffers = [];
        let startAppending = false;
        // Pick the first set of outputs with the same mime type.
        for (const output of outputs) {
            if ((buffers.length === 0 || startAppending)) {
                buffers.push(output);
                startAppending = true;
            }
        }
        let didCompression = compressStreamBuffer(buffers);
        const concatenated = buffer_1.VSBuffer.concat(buffers.map(buffer => buffer_1.VSBuffer.wrap(buffer)));
        const data = formatStreamText(concatenated);
        didCompression = didCompression || data.byteLength !== concatenated.byteLength;
        return { data, didCompression };
    }
    exports.MOVE_CURSOR_1_LINE_COMMAND = `${String.fromCharCode(27)}[A`;
    const MOVE_CURSOR_1_LINE_COMMAND_BYTES = exports.MOVE_CURSOR_1_LINE_COMMAND.split('').map(c => c.charCodeAt(0));
    const LINE_FEED = 10;
    function compressStreamBuffer(streams) {
        let didCompress = false;
        streams.forEach((stream, index) => {
            if (index === 0 || stream.length < exports.MOVE_CURSOR_1_LINE_COMMAND.length) {
                return;
            }
            const previousStream = streams[index - 1];
            // Remove the previous line if required.
            const command = stream.subarray(0, exports.MOVE_CURSOR_1_LINE_COMMAND.length);
            if (command[0] === MOVE_CURSOR_1_LINE_COMMAND_BYTES[0] && command[1] === MOVE_CURSOR_1_LINE_COMMAND_BYTES[1] && command[2] === MOVE_CURSOR_1_LINE_COMMAND_BYTES[2]) {
                const lastIndexOfLineFeed = previousStream.lastIndexOf(LINE_FEED);
                if (lastIndexOfLineFeed === -1) {
                    return;
                }
                didCompress = true;
                streams[index - 1] = previousStream.subarray(0, lastIndexOfLineFeed);
                streams[index] = stream.subarray(exports.MOVE_CURSOR_1_LINE_COMMAND.length);
            }
        });
        return didCompress;
    }
    /**
     * Took this from jupyter/notebook
     * https://github.com/jupyter/notebook/blob/b8b66332e2023e83d2ee04f83d8814f567e01a4e/notebook/static/base/js/utils.js
     * Remove characters that are overridden by backspace characters
     */
    function fixBackspace(txt) {
        let tmp = txt;
        do {
            txt = tmp;
            // Cancel out anything-but-newline followed by backspace
            tmp = txt.replace(/[^\n]\x08/gm, '');
        } while (tmp.length < txt.length);
        return txt;
    }
    /**
     * Remove chunks that should be overridden by the effect of carriage return characters
     * From https://github.com/jupyter/notebook/blob/master/notebook/static/base/js/utils.js
     */
    function fixCarriageReturn(txt) {
        txt = txt.replace(/\r+\n/gm, '\n'); // \r followed by \n --> newline
        while (txt.search(/\r[^$]/g) > -1) {
            const base = txt.match(/^(.*)\r+/m)[1];
            let insert = txt.match(/\r+(.*)$/m)[1];
            insert = insert + base.slice(insert.length, base.length);
            txt = txt.replace(/\r+.*$/m, '\r').replace(/^.*\r/m, insert);
        }
        return txt;
    }
    const BACKSPACE_CHARACTER = '\b'.charCodeAt(0);
    const CARRIAGE_RETURN_CHARACTER = '\r'.charCodeAt(0);
    function formatStreamText(buffer) {
        // We have special handling for backspace and carriage return characters.
        // Don't unnecessary decode the bytes if we don't need to perform any processing.
        if (!buffer.buffer.includes(BACKSPACE_CHARACTER) && !buffer.buffer.includes(CARRIAGE_RETURN_CHARACTER)) {
            return buffer;
        }
        // Do the same thing jupyter is doing
        return buffer_1.VSBuffer.fromString(fixCarriageReturn(fixBackspace(textDecoder.decode(buffer.buffer))));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDb21tb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbm90ZWJvb2tDb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMnJCaEcsb0JBc0RDO0lBdUZELDREQVNDO0lBQ0Qsa0VBeUJDO0lBd0hELDRDQUVDO0lBV0QsOERBaUJDO0lBaCtCWSxRQUFBLGtCQUFrQixHQUFHLDJCQUEyQixDQUFDO0lBQ2pELFFBQUEsdUJBQXVCLEdBQUcseUNBQXlDLENBQUM7SUFDcEUsUUFBQSw0QkFBNEIsR0FBRyw4QkFBOEIsQ0FBQztJQUczRSxJQUFZLFFBR1g7SUFIRCxXQUFZLFFBQVE7UUFDbkIsMkNBQVUsQ0FBQTtRQUNWLHVDQUFRLENBQUE7SUFDVCxDQUFDLEVBSFcsUUFBUSx3QkFBUixRQUFRLFFBR25CO0lBRVksUUFBQSxzQkFBc0IsR0FBc0I7UUFDeEQsa0JBQWtCO1FBQ2xCLHdCQUF3QjtRQUN4QixXQUFXO1FBQ1gsZUFBZTtRQUNmLFlBQUssQ0FBQyxLQUFLO1FBQ1gsWUFBSyxDQUFDLFFBQVE7UUFDZCxXQUFXO1FBQ1gsWUFBWTtRQUNaLFlBQUssQ0FBQyxJQUFJO0tBQ1YsQ0FBQztJQUVXLFFBQUEsaUNBQWlDLEdBQXNCO1FBQ25FLFlBQUssQ0FBQyxLQUFLO1FBQ1gsWUFBSyxDQUFDLFFBQVE7UUFDZCxrQkFBa0I7UUFDbEIsV0FBVztRQUNYLGVBQWU7UUFDZixXQUFXO1FBQ1gsWUFBWTtRQUNaLFlBQUssQ0FBQyxJQUFJO0tBQ1YsQ0FBQztJQUVGOzs7OztPQUtHO0lBQ1UsUUFBQSw4QkFBOEIsR0FBNkMsSUFBSSxHQUFHLENBQUM7UUFDL0YsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGtC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