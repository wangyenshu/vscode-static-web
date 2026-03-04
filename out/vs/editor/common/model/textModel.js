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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/core/eolCounter", "vs/editor/common/core/indentation", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/textModelDefaults", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsImpl", "vs/editor/common/model/bracketPairsTextModelPart/colorizedBracketPairsDecorationProvider", "vs/editor/common/model/editStack", "vs/editor/common/model/guidesTextModelPart", "vs/editor/common/model/indentationGuesser", "vs/editor/common/model/intervalTree", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/model/textModelSearch", "vs/editor/common/model/tokenizationTextModelPart", "vs/editor/common/textModelEvents", "vs/platform/undoRedo/common/undoRedo"], function (require, exports, arrays_1, color_1, errors_1, event_1, lifecycle_1, stream_1, strings, uri_1, eolCounter_1, indentation_1, lineRange_1, position_1, range_1, selection_1, textModelDefaults_1, language_1, languageConfigurationRegistry_1, model, bracketPairsImpl_1, colorizedBracketPairsDecorationProvider_1, editStack_1, guidesTextModelPart_1, indentationGuesser_1, intervalTree_1, pieceTreeTextBuffer_1, pieceTreeTextBufferBuilder_1, textModelSearch_1, tokenizationTextModelPart_1, textModelEvents_1, undoRedo_1) {
    "use strict";
    var TextModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AttachedViews = exports.ModelDecorationOptions = exports.ModelDecorationInjectedTextOptions = exports.ModelDecorationMinimapOptions = exports.ModelDecorationGlyphMarginOptions = exports.ModelDecorationOverviewRulerOptions = exports.TextModel = void 0;
    exports.createTextBufferFactory = createTextBufferFactory;
    exports.createTextBufferFactoryFromStream = createTextBufferFactoryFromStream;
    exports.createTextBufferFactoryFromSnapshot = createTextBufferFactoryFromSnapshot;
    exports.createTextBuffer = createTextBuffer;
    function createTextBufferFactory(text) {
        const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
        builder.acceptChunk(text);
        return builder.finish();
    }
    function createTextBufferFactoryFromStream(stream) {
        return new Promise((resolve, reject) => {
            const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            let done = false;
            (0, stream_1.listenStream)(stream, {
                onData: chunk => {
                    builder.acceptChunk((typeof chunk === 'string') ? chunk : chunk.toString());
                },
                onError: error => {
                    if (!done) {
                        done = true;
                        reject(error);
                    }
                },
                onEnd: () => {
                    if (!done) {
                        done = true;
                        resolve(builder.finish());
                    }
                }
            });
        });
    }
    function createTextBufferFactoryFromSnapshot(snapshot) {
        const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
        let chunk;
        while (typeof (chunk = snapshot.read()) === 'string') {
            builder.acceptChunk(chunk);
        }
        return builder.finish();
    }
    function createTextBuffer(value, defaultEOL) {
        let factory;
        if (typeof value === 'string') {
            factory = createTextBufferFactory(value);
        }
        else if (model.isITextSnapshot(value)) {
            factory = createTextBufferFactoryFromSnapshot(value);
        }
        else {
            factory = value;
        }
        return factory.create(defaultEOL);
    }
    let MODEL_ID = 0;
    const LIMIT_FIND_COUNT = 999;
    const LONG_LINE_BOUNDARY = 10000;
    class TextModelSnapshot {
        constructor(source) {
            this._source = source;
            this._eos = false;
        }
        read() {
            if (this._eos) {
                return null;
            }
            const result = [];
            let resultCnt = 0;
            let resultLength = 0;
            do {
                const tmp = this._source.read();
                if (tmp === null) {
                    // end-of-stream
                    this._eos = true;
                    if (resultCnt === 0) {
                        return null;
                    }
                    else {
                        return result.join('');
                    }
                }
                if (tmp.length > 0) {
                    result[resultCnt++] = tmp;
                    resultLength += tmp.length;
                }
                if (resultLength >= 64 * 1024) {
                    return result.join('');
                }
            } while (true);
        }
    }
    const invalidFunc = () => { throw new Error(`Invalid change accessor`); };
    var StringOffsetValidationType;
    (function (StringOffsetValidationType) {
        /**
         * Even allowed in surrogate pairs
         */
        StringOffsetValidationType[StringOffsetValidationType["Relaxed"] = 0] = "Relaxed";
        /**
         * Not allowed in surrogate pairs
         */
        StringOffsetValidationType[StringOffsetValidationType["SurrogatePairs"] = 1] = "SurrogatePairs";
    })(StringOffsetValidationType || (StringOffsetValidationType = {}));
    let TextModel = class TextModel extends lifecycle_1.Disposable {
        static { TextModel_1 = this; }
        static { this._MODEL_SYNC_LIMIT = 50 * 1024 * 1024; } // 50 MB,  // used in tests
        static { this.LARGE_FILE_SIZE_THRESHOLD = 20 * 1024 * 1024; } // 20 MB;
        static { this.LARGE_FILE_LINE_COUNT_THRESHOLD = 300 * 1000; } // 300K lines
        static { this.LARGE_FILE_HEAP_OPERATION_THRESHOLD = 256 * 1024 * 1024; } // 256M characters, usually ~> 512MB memory usage
        static { this.DEFAULT_CREATION_OPTIONS = {
            isForSimpleWidget: false,
            tabSize: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize,
            indentSize: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.indentSize,
            insertSpaces: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces,
            detectIndentation: false,
            defaultEOL: 1 /* model.DefaultEndOfLine.LF */,
            trimAutoWhitespace: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace,
            largeFileOptimizations: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations,
            bracketPairColorizationOptions: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions,
        }; }
        static resolveOptions(textBuffer, options) {
            if (options.detectIndentation) {
                const guessedIndentation = (0, indentationGuesser_1.guessIndentation)(textBuffer, options.tabSize, options.insertSpaces);
                return new model.TextModelResolvedOptions({
                    tabSize: guessedIndentation.tabSize,
                    indentSize: 'tabSize', // TODO@Alex: guess indentSize independent of tabSize
                    insertSpaces: guessedIndentation.insertSpaces,
                    trimAutoWhitespace: options.trimAutoWhitespace,
                    defaultEOL: options.defaultEOL,
                    bracketPairColorizationOptions: options.bracketPairColorizationOptions,
                });
            }
            return new model.TextModelResolvedOptions(options);
        }
        get onDidChangeLanguage() { return this._tokenizationTextModelPart.onDidChangeLanguage; }
        get onDidChangeLanguageConfiguration() { return this._tokenizationTextModelPart.onDidChangeLanguageConfiguration; }
        get onDidChangeTokens() { return this._tokenizationTextModelPart.onDidChangeTokens; }
        onDidChangeContent(listener) {
            return this._eventEmitter.slowEvent((e) => listener(e.contentChangedEvent));
        }
        onDidChangeContentOrInjectedText(listener) {
            return (0, lifecycle_1.combinedDisposable)(this._eventEmitter.fastEvent(e => listener(e)), this._onDidChangeInjectedText.event(e => listener(e)));
        }
        _isDisposing() { return this.__isDisposing; }
        get tokenization() { return this._tokenizationTextModelPart; }
        get bracketPairs() { return this._bracketPairs; }
        get guides() { return this._guidesTextModelPart; }
        constructor(source, languageIdOrSelection, creationOptions, associatedResource = null, _undoRedoService, _languageService, _languageConfigurationService) {
            super();
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            //#region Events
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._onDidChangeDecorations = this._register(new DidChangeDecorationsEmitter(affectedInjectedTextLines => this.handleBeforeFireDecorationsChangedEvent(affectedInjectedTextLines)));
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            this._onDidChangeAttached = this._register(new event_1.Emitter());
            this.onDidChangeAttached = this._onDidChangeAttached.event;
            this._onDidChangeInjectedText = this._register(new event_1.Emitter());
            this._eventEmitter = this._register(new DidChangeContentEmitter());
            this._languageSelectionListener = this._register(new lifecycle_1.MutableDisposable());
            this._deltaDecorationCallCnt = 0;
            this._attachedViews = new AttachedViews();
            // Generate a new unique model id
            MODEL_ID++;
            this.id = '$model' + MODEL_ID;
            this.isForSimpleWidget = creationOptions.isForSimpleWidget;
            if (typeof associatedResource === 'undefined' || associatedResource === null) {
                this._associatedResource = uri_1.URI.parse('inmemory://model/' + MODEL_ID);
            }
            else {
                this._associatedResource = associatedResource;
            }
            this._attachedEditorCount = 0;
            const { textBuffer, disposable } = createTextBuffer(source, creationOptions.defaultEOL);
            this._buffer = textBuffer;
            this._bufferDisposable = disposable;
            this._options = TextModel_1.resolveOptions(this._buffer, creationOptions);
            const languageId = (typeof languageIdOrSelection === 'string' ? languageIdOrSelection : languageIdOrSelection.languageId);
            if (typeof languageIdOrSelection !== 'string') {
                this._languageSelectionListener.value = languageIdOrSelection.onDidChange(() => this._setLanguage(languageIdOrSelection.languageId));
            }
            this._bracketPairs = this._register(new bracketPairsImpl_1.BracketPairsTextModelPart(this, this._languageConfigurationService));
            this._guidesTextModelPart = this._register(new guidesTextModelPart_1.GuidesTextModelPart(this, this._languageConfigurationService));
            this._decorationProvider = this._register(new colorizedBracketPairsDecorationProvider_1.ColorizedBracketPairsDecorationProvider(this));
            this._tokenizationTextModelPart = new tokenizationTextModelPart_1.TokenizationTextModelPart(this._languageService, this._languageConfigurationService, this, this._bracketPairs, languageId, this._attachedViews);
            const bufferLineCount = this._buffer.getLineCount();
            const bufferTextLength = this._buffer.getValueLengthInRange(new range_1.Range(1, 1, bufferLineCount, this._buffer.getLineLength(bufferLineCount) + 1), 0 /* model.EndOfLinePreference.TextDefined */);
            // !!! Make a decision in the ctor and permanently respect this decision !!!
            // If a model is too large at construction time, it will never get tokenized,
            // under no circumstances.
            if (creationOptions.largeFileOptimizations) {
                this._isTooLargeForTokenization = ((bufferTextLength > TextModel_1.LARGE_FILE_SIZE_THRESHOLD)
                    || (bufferLineCount > TextModel_1.LARGE_FILE_LINE_COUNT_THRESHOLD));
                this._isTooLargeForHeapOperation = bufferTextLength > TextModel_1.LARGE_FILE_HEAP_OPERATION_THRESHOLD;
            }
            else {
                this._isTooLargeForTokenization = false;
                this._isTooLargeForHeapOperation = false;
            }
            this._isTooLargeForSyncing = (bufferTextLength > TextModel_1._MODEL_SYNC_LIMIT);
            this._versionId = 1;
            this._alternativeVersionId = 1;
            this._initialUndoRedoSnapshot = null;
            this._isDisposed = false;
            this.__isDisposing = false;
            this._instanceId = strings.singleLetterHash(MODEL_ID);
            this._lastDecorationId = 0;
            this._decorations = Object.create(null);
            this._decorationsTree = new DecorationsTrees();
            this._commandManager = new editStack_1.EditStack(this, this._undoRedoService);
            this._isUndoing = false;
            this._isRedoing = false;
            this._trimAutoWhitespaceLines = null;
            this._register(this._decorationProvider.onDidChange(() => {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._onDidChangeDecorations.fire();
                this._onDidChangeDecorations.endDeferredEmit();
            }));
            this._languageService.requestRichLanguageFeatures(languageId);
        }
        dispose() {
            this.__isDisposing = true;
            this._onWillDispose.fire();
            this._tokenizationTextModelPart.dispose();
            this._isDisposed = true;
            super.dispose();
            this._bufferDisposable.dispose();
            this.__isDisposing = false;
            // Manually release reference to previous text buffer to avoid large leaks
            // in case someone leaks a TextModel reference
            const emptyDisposedTextBuffer = new pieceTreeTextBuffer_1.PieceTreeTextBuffer([], '', '\n', false, false, true, true);
            emptyDisposedTextBuffer.dispose();
            this._buffer = emptyDisposedTextBuffer;
            this._bufferDisposable = lifecycle_1.Disposable.None;
        }
        _hasListeners() {
            return (this._onWillDispose.hasListeners()
                || this._onDidChangeDecorations.hasListeners()
                || this._tokenizationTextModelPart._hasListeners()
                || this._onDidChangeOptions.hasListeners()
                || this._onDidChangeAttached.hasListeners()
                || this._onDidChangeInjectedText.hasListeners()
                || this._eventEmitter.hasListeners());
        }
        _assertNotDisposed() {
            if (this._isDisposed) {
                throw new Error('Model is disposed!');
            }
        }
        equalsTextBuffer(other) {
            this._assertNotDisposed();
            return this._buffer.equals(other);
        }
        getTextBuffer() {
            this._assertNotDisposed();
            return this._buffer;
        }
        _emitContentChangedEvent(rawChange, change) {
            if (this.__isDisposing) {
                // Do not confuse listeners by emitting any event after disposing
                return;
            }
            this._tokenizationTextModelPart.handleDidChangeContent(change);
            this._bracketPairs.handleDidChangeContent(change);
            this._eventEmitter.fire(new textModelEvents_1.InternalModelContentChangeEvent(rawChange, change));
        }
        setValue(value) {
            this._assertNotDisposed();
            if (value === null || value === undefined) {
                throw (0, errors_1.illegalArgument)();
            }
            const { textBuffer, disposable } = createTextBuffer(value, this._options.defaultEOL);
            this._setValueFromTextBuffer(textBuffer, disposable);
        }
        _createContentChanged2(range, rangeOffset, rangeLength, text, isUndoing, isRedoing, isFlush, isEolChange) {
            return {
                changes: [{
                        range: range,
                        rangeOffset: rangeOffset,
                        rangeLength: rangeLength,
                        text: text,
                    }],
                eol: this._buffer.getEOL(),
                isEolChange: isEolChange,
                versionId: this.getVersionId(),
                isUndoing: isUndoing,
                isRedoing: isRedoing,
                isFlush: isFlush
            };
        }
        _setValueFromTextBuffer(textBuffer, textBufferDisposable) {
            this._assertNotDisposed();
            const oldFullModelRange = this.getFullModelRange();
            const oldModelValueLength = this.getValueLengthInRange(oldFullModelRange);
            const endLineNumber = this.getLineCount();
            const endColumn = this.getLineMaxColumn(endLineNumber);
            this._buffer = textBuffer;
            this._bufferDisposable.dispose();
            this._bufferDisposable = textBufferDisposable;
            this._increaseVersionId();
            // Destroy all my decorations
            this._decorations = Object.create(null);
            this._decorationsTree = new DecorationsTrees();
            // Destroy my edit history and settings
            this._commandManager.clear();
            this._trimAutoWhitespaceLines = null;
            this._emitContentChangedEvent(new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawFlush()
            ], this._versionId, false, false), this._createContentChanged2(new range_1.Range(1, 1, endLineNumber, endColumn), 0, oldModelValueLength, this.getValue(), false, false, true, false));
        }
        setEOL(eol) {
            this._assertNotDisposed();
            const newEOL = (eol === 1 /* model.EndOfLineSequence.CRLF */ ? '\r\n' : '\n');
            if (this._buffer.getEOL() === newEOL) {
                // Nothing to do
                return;
            }
            const oldFullModelRange = this.getFullModelRange();
            const oldModelValueLength = this.getValueLengthInRange(oldFullModelRange);
            const endLineNumber = this.getLineCount();
            const endColumn = this.getLineMaxColumn(endLineNumber);
            this._onBeforeEOLChange();
            this._buffer.setEOL(newEOL);
            this._increaseVersionId();
            this._onAfterEOLChange();
            this._emitContentChangedEvent(new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawEOLChanged()
            ], this._versionId, false, false), this._createContentChanged2(new range_1.Range(1, 1, endLineNumber, endColumn), 0, oldModelValueLength, this.getValue(), false, false, false, true));
        }
        _onBeforeEOLChange() {
            // Ensure all decorations get their `range` set.
            this._decorationsTree.ensureAllNodesHaveRanges(this);
        }
        _onAfterEOLChange() {
            // Transform back `range` to offsets
            const versionId = this.getVersionId();
            const allDecorations = this._decorationsTree.collectNodesPostOrder();
            for (let i = 0, len = allDecorations.length; i < len; i++) {
                const node = allDecorations[i];
                const range = node.range; // the range is defined due to `_onBeforeEOLChange`
                const delta = node.cachedAbsoluteStart - node.start;
                const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
                const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
                node.cachedAbsoluteStart = startOffset;
                node.cachedAbsoluteEnd = endOffset;
                node.cachedVersionId = versionId;
                node.start = startOffset - delta;
                node.end = endOffset - delta;
                (0, intervalTree_1.recomputeMaxEnd)(node);
            }
        }
        onBeforeAttached() {
            this._attachedEditorCount++;
            if (this._attachedEditorCount === 1) {
                this._tokenizationTextModelPart.handleDidChangeAttached();
                this._onDidChangeAttached.fire(undefined);
            }
            return this._attachedViews.attachView();
        }
        onBeforeDetached(view) {
            this._attachedEditorCount--;
            if (this._attachedEditorCount === 0) {
                this._tokenizationTextModelPart.handleDidChangeAttached();
                this._onDidChangeAttached.fire(undefined);
            }
            this._attachedViews.detachView(view);
        }
        isAttachedToEditor() {
            return this._attachedEditorCount > 0;
        }
        getAttachedEditorCount() {
            return this._attachedEditorCount;
        }
        isTooLargeForSyncing() {
            return this._isTooLargeForSyncing;
        }
        isTooLargeForTokenization() {
            return this._isTooLargeForTokenization;
        }
        isTooLargeForHeapOperation() {
            return this._isTooLargeForHeapOperation;
        }
        isDisposed() {
            return this._isDisposed;
        }
        isDominatedByLongLines() {
            this._assertNotDisposed();
            if (this.isTooLargeForTokenization()) {
                // Cannot word wrap huge files anyways, so it doesn't really matter
                return false;
            }
            let smallLineCharCount = 0;
            let longLineCharCount = 0;
            const lineCount = this._buffer.getLineCount();
            for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
                const lineLength = this._buffer.getLineLength(lineNumber);
                if (lineLength >= LONG_LINE_BOUNDARY) {
                    longLineCharCount += lineLength;
                }
                else {
                    smallLineCharCount += lineLength;
                }
            }
            return (longLineCharCount > smallLineCharCount);
        }
        get uri() {
            return this._associatedResource;
        }
        //#region Options
        getOptions() {
            this._assertNotDisposed();
            return this._options;
        }
        getFormattingOptions() {
            return {
                tabSize: this._options.indentSize,
                insertSpaces: this._options.insertSpaces
            };
        }
        updateOptions(_newOpts) {
            this._assertNotDisposed();
            const tabSize = (typeof _newOpts.tabSize !== 'undefined') ? _newOpts.tabSize : this._options.tabSize;
            const indentSize = (typeof _newOpts.indentSize !== 'undefined') ? _newOpts.indentSize : this._options.originalIndentSize;
            const insertSpaces = (typeof _newOpts.insertSpaces !== 'undefined') ? _newOpts.insertSpaces : this._options.insertSpaces;
            const trimAutoWhitespace = (typeof _newOpts.trimAutoWhitespace !== 'undefined') ? _newOpts.trimAutoWhitespace : this._options.trimAutoWhitespace;
            const bracketPairColorizationOptions = (typeof _newOpts.bracketColorizationOptions !== 'undefined') ? _newOpts.bracketColorizationOptions : this._options.bracketPairColorizationOptions;
            const newOpts = new model.TextModelResolvedOptions({
                tabSize: tabSize,
                indentSize: indentSize,
                insertSpaces: insertSpaces,
                defaultEOL: this._options.defaultEOL,
                trimAutoWhitespace: trimAutoWhitespace,
                bracketPairColorizationOptions,
            });
            if (this._options.equals(newOpts)) {
                return;
            }
            const e = this._options.createChangeEvent(newOpts);
            this._options = newOpts;
            this._bracketPairs.handleDidChangeOptions(e);
            this._decorationProvider.handleDidChangeOptions(e);
            this._onDidChangeOptions.fire(e);
        }
        detectIndentation(defaultInsertSpaces, defaultTabSize) {
            this._assertNotDisposed();
            const guessedIndentation = (0, indentationGuesser_1.guessIndentation)(this._buffer, defaultTabSize, defaultInsertSpaces);
            this.updateOptions({
                insertSpaces: guessedIndentation.insertSpaces,
                tabSize: guessedIndentation.tabSize,
                indentSize: guessedIndentation.tabSize, // TODO@Alex: guess indentSize independent of tabSize
            });
        }
        normalizeIndentation(str) {
            this._assertNotDisposed();
            return (0, indentation_1.normalizeIndentation)(str, this._options.indentSize, this._options.insertSpaces);
        }
        //#endregion
        //#region Reading
        getVersionId() {
            this._assertNotDisposed();
            return this._versionId;
        }
        mightContainRTL() {
            return this._buffer.mightContainRTL();
        }
        mightContainUnusualLineTerminators() {
            return this._buffer.mightContainUnusualLineTerminators();
        }
        removeUnusualLineTerminators(selections = null) {
            const matches = this.findMatches(strings.UNUSUAL_LINE_TERMINATORS.source, false, true, false, null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            this._buffer.resetMightContainUnusualLineTerminators();
            this.pushEditOperations(selections, matches.map(m => ({ range: m.range, text: null })), () => null);
        }
        mightContainNonBasicASCII() {
            return this._buffer.mightContainNonBasicASCII();
        }
        getAlternativeVersionId() {
            this._assertNotDisposed();
            return this._alternativeVersionId;
        }
        getInitialUndoRedoSnapshot() {
            this._assertNotDisposed();
            return this._initialUndoRedoSnapshot;
        }
        getOffsetAt(rawPosition) {
            this._assertNotDisposed();
            const position = this._validatePosition(rawPosition.lineNumber, rawPosition.column, 0 /* StringOffsetValidationType.Relaxed */);
            return this._buffer.getOffsetAt(position.lineNumber, position.column);
        }
        getPositionAt(rawOffset) {
            this._assertNotDisposed();
            const offset = (Math.min(this._buffer.getLength(), Math.max(0, rawOffset)));
            return this._buffer.getPositionAt(offset);
        }
        _increaseVersionId() {
            this._versionId = this._versionId + 1;
            this._alternativeVersionId = this._versionId;
        }
        _overwriteVersionId(versionId) {
            this._versionId = versionId;
        }
        _overwriteAlternativeVersionId(newAlternativeVersionId) {
            this._alternativeVersionId = newAlternativeVersionId;
        }
        _overwriteInitialUndoRedoSnapshot(newInitialUndoRedoSnapshot) {
            this._initialUndoRedoSnapshot = newInitialUndoRedoSnapshot;
        }
        getValue(eol, preserveBOM = false) {
            this._assertNotDisposed();
            if (this.isTooLargeForHeapOperation()) {
                throw new errors_1.BugIndicatingError('Operation would exceed heap memory limits');
            }
            const fullModelRange = this.getFullModelRange();
            const fullModelValue = this.getValueInRange(fullModelRange, eol);
            if (preserveBOM) {
                return this._buffer.getBOM() + fullModelValue;
            }
            return fullModelValue;
        }
        createSnapshot(preserveBOM = false) {
            return new TextModelSnapshot(this._buffer.createSnapshot(preserveBOM));
        }
        getValueLength(eol, preserveBOM = false) {
            this._assertNotDisposed();
            const fullModelRange = this.getFullModelRange();
            const fullModelValue = this.getValueLengthInRange(fullModelRange, eol);
            if (preserveBOM) {
                return this._buffer.getBOM().length + fullModelValue;
            }
            return fullModelValue;
        }
        getValueInRange(rawRange, eol = 0 /* model.EndOfLinePreference.TextDefined */) {
            this._assertNotDisposed();
            return this._buffer.getValueInRange(this.validateRange(rawRange), eol);
        }
        getValueLengthInRange(rawRange, eol = 0 /* model.EndOfLinePreference.TextDefined */) {
            this._assertNotDisposed();
            return this._buffer.getValueLengthInRange(this.validateRange(rawRange), eol);
        }
        getCharacterCountInRange(rawRange, eol = 0 /* model.EndOfLinePreference.TextDefined */) {
            this._assertNotDisposed();
            return this._buffer.getCharacterCountInRange(this.validateRange(rawRange), eol);
        }
        getLineCount() {
            this._assertNotDisposed();
            return this._buffer.getLineCount();
        }
        getLineContent(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineContent(lineNumber);
        }
        getLineLength(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineLength(lineNumber);
        }
        getLinesContent() {
            this._assertNotDisposed();
            if (this.isTooLargeForHeapOperation()) {
                throw new errors_1.BugIndicatingError('Operation would exceed heap memory limits');
            }
            return this._buffer.getLinesContent();
        }
        getEOL() {
            this._assertNotDisposed();
            return this._buffer.getEOL();
        }
        getEndOfLineSequence() {
            this._assertNotDisposed();
            return (this._buffer.getEOL() === '\n'
                ? 0 /* model.EndOfLineSequence.LF */
                : 1 /* model.EndOfLineSequence.CRLF */);
        }
        getLineMinColumn(lineNumber) {
            this._assertNotDisposed();
            return 1;
        }
        getLineMaxColumn(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineLength(lineNumber) + 1;
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineFirstNonWhitespaceColumn(lineNumber);
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineLastNonWhitespaceColumn(lineNumber);
        }
        /**
         * Validates `range` is within buffer bounds, but allows it to sit in between surrogate pairs, etc.
         * Will try to not allocate if possible.
         */
        _validateRangeRelaxedNoAllocations(range) {
            const linesCount = this._buffer.getLineCount();
            const initialStartLineNumber = range.startLineNumber;
            const initialStartColumn = range.startColumn;
            let startLineNumber = Math.floor((typeof initialStartLineNumber === 'number' && !isNaN(initialStartLineNumber)) ? initialStartLineNumber : 1);
            let startColumn = Math.floor((typeof initialStartColumn === 'number' && !isNaN(initialStartColumn)) ? initialStartColumn : 1);
            if (startLineNumber < 1) {
                startLineNumber = 1;
                startColumn = 1;
            }
            else if (startLineNumber > linesCount) {
                startLineNumber = linesCount;
                startColumn = this.getLineMaxColumn(startLineNumber);
            }
            else {
                if (startColumn <= 1) {
                    startColumn = 1;
                }
                else {
                    const maxColumn = this.getLineMaxColumn(startLineNumber);
                    if (startColumn >= maxColumn) {
                        startColumn = maxColumn;
                    }
                }
            }
            const initialEndLineNumber = range.endLineNumber;
            const initialEndColumn = range.endColumn;
            let endLineNumber = Math.floor((typeof initialEndLineNumber === 'number' && !isNaN(initialEndLineNumber)) ? initialEndLineNumber : 1);
            let endColumn = Math.floor((typeof initialEndColumn === 'number' && !isNaN(initialEndColumn)) ? initialEndColumn : 1);
            if (endLineNumber < 1) {
                endLineNumber = 1;
                endColumn = 1;
            }
            else if (endLineNumber > linesCount) {
                endLineNumber = linesCount;
                endColumn = this.getLineMaxColumn(endLineNumber);
            }
            else {
                if (endColumn <= 1) {
                    endColumn = 1;
                }
                else {
                    const maxColumn = this.getLineMaxColumn(endLineNumber);
                    if (endColumn >= maxColumn) {
                        endColumn = maxColumn;
                    }
                }
            }
            if (initialStartLineNumber === startLineNumber
                && initialStartColumn === startColumn
                && initialEndLineNumber === endLineNumber
                && initialEndColumn === endColumn
                && range instanceof range_1.Range
                && !(range instanceof selection_1.Selection)) {
                return range;
            }
            return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
        }
        _isValidPosition(lineNumber, column, validationType) {
            if (typeof lineNumber !== 'number' || typeof column !== 'number') {
                return false;
            }
            if (isNaN(lineNumber) || isNaN(column)) {
                return false;
            }
            if (lineNumber < 1 || column < 1) {
                return false;
            }
            if ((lineNumber | 0) !== lineNumber || (column | 0) !== column) {
                return false;
            }
            const lineCount = this._buffer.getLineCount();
            if (lineNumber > lineCount) {
                return false;
            }
            if (column === 1) {
                return true;
            }
            const maxColumn = this.getLineMaxColumn(lineNumber);
            if (column > maxColumn) {
                return false;
            }
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                // !!At this point, column > 1
                const charCodeBefore = this._buffer.getLineCharCode(lineNumber, column - 2);
                if (strings.isHighSurrogate(charCodeBefore)) {
                    return false;
                }
            }
            return true;
        }
        _validatePosition(_lineNumber, _column, validationType) {
            const lineNumber = Math.floor((typeof _lineNumber === 'number' && !isNaN(_lineNumber)) ? _lineNumber : 1);
            const column = Math.floor((typeof _column === 'number' && !isNaN(_column)) ? _column : 1);
            const lineCount = this._buffer.getLineCount();
            if (lineNumber < 1) {
                return new position_1.Position(1, 1);
            }
            if (lineNumber > lineCount) {
                return new position_1.Position(lineCount, this.getLineMaxColumn(lineCount));
            }
            if (column <= 1) {
                return new position_1.Position(lineNumber, 1);
            }
            const maxColumn = this.getLineMaxColumn(lineNumber);
            if (column >= maxColumn) {
                return new position_1.Position(lineNumber, maxColumn);
            }
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                // If the position would end up in the middle of a high-low surrogate pair,
                // we move it to before the pair
                // !!At this point, column > 1
                const charCodeBefore = this._buffer.getLineCharCode(lineNumber, column - 2);
                if (strings.isHighSurrogate(charCodeBefore)) {
                    return new position_1.Position(lineNumber, column - 1);
                }
            }
            return new position_1.Position(lineNumber, column);
        }
        validatePosition(position) {
            const validationType = 1 /* StringOffsetValidationType.SurrogatePairs */;
            this._assertNotDisposed();
            // Avoid object allocation and cover most likely case
            if (position instanceof position_1.Position) {
                if (this._isValidPosition(position.lineNumber, position.column, validationType)) {
                    return position;
                }
            }
            return this._validatePosition(position.lineNumber, position.column, validationType);
        }
        _isValidRange(range, validationType) {
            const startLineNumber = range.startLineNumber;
            const startColumn = range.startColumn;
            const endLineNumber = range.endLineNumber;
            const endColumn = range.endColumn;
            if (!this._isValidPosition(startLineNumber, startColumn, 0 /* StringOffsetValidationType.Relaxed */)) {
                return false;
            }
            if (!this._isValidPosition(endLineNumber, endColumn, 0 /* StringOffsetValidationType.Relaxed */)) {
                return false;
            }
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                const charCodeBeforeStart = (startColumn > 1 ? this._buffer.getLineCharCode(startLineNumber, startColumn - 2) : 0);
                const charCodeBeforeEnd = (endColumn > 1 && endColumn <= this._buffer.getLineLength(endLineNumber) ? this._buffer.getLineCharCode(endLineNumber, endColumn - 2) : 0);
                const startInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeStart);
                const endInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeEnd);
                if (!startInsideSurrogatePair && !endInsideSurrogatePair) {
                    return true;
                }
                return false;
            }
            return true;
        }
        validateRange(_range) {
            const validationType = 1 /* StringOffsetValidationType.SurrogatePairs */;
            this._assertNotDisposed();
            // Avoid object allocation and cover most likely case
            if ((_range instanceof range_1.Range) && !(_range instanceof selection_1.Selection)) {
                if (this._isValidRange(_range, validationType)) {
                    return _range;
                }
            }
            const start = this._validatePosition(_range.startLineNumber, _range.startColumn, 0 /* StringOffsetValidationType.Relaxed */);
            const end = this._validatePosition(_range.endLineNumber, _range.endColumn, 0 /* StringOffsetValidationType.Relaxed */);
            const startLineNumber = start.lineNumber;
            const startColumn = start.column;
            const endLineNumber = end.lineNumber;
            const endColumn = end.column;
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                const charCodeBeforeStart = (startColumn > 1 ? this._buffer.getLineCharCode(startLineNumber, startColumn - 2) : 0);
                const charCodeBeforeEnd = (endColumn > 1 && endColumn <= this._buffer.getLineLength(endLineNumber) ? this._buffer.getLineCharCode(endLineNumber, endColumn - 2) : 0);
                const startInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeStart);
                const endInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeEnd);
                if (!startInsideSurrogatePair && !endInsideSurrogatePair) {
                    return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                }
                if (startLineNumber === endLineNumber && startColumn === endColumn) {
                    // do not expand a collapsed range, simply move it to a valid location
                    return new range_1.Range(startLineNumber, startColumn - 1, endLineNumber, endColumn - 1);
                }
                if (startInsideSurrogatePair && endInsideSurrogatePair) {
                    // expand range at both ends
                    return new range_1.Range(startLineNumber, startColumn - 1, endLineNumber, endColumn + 1);
                }
                if (startInsideSurrogatePair) {
                    // only expand range at the start
                    return new range_1.Range(startLineNumber, startColumn - 1, endLineNumber, endColumn);
                }
                // only expand range at the end
                return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn + 1);
            }
            return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
        }
        modifyPosition(rawPosition, offset) {
            this._assertNotDisposed();
            const candidate = this.getOffsetAt(rawPosition) + offset;
            return this.getPositionAt(Math.min(this._buffer.getLength(), Math.max(0, candidate)));
        }
        getFullModelRange() {
            this._assertNotDisposed();
            const lineCount = this.getLineCount();
            return new range_1.Range(1, 1, lineCount, this.getLineMaxColumn(lineCount));
        }
        findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount) {
            return this._buffer.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
        }
        findMatches(searchString, rawSearchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount = LIMIT_FIND_COUNT) {
            this._assertNotDisposed();
            let searchRanges = null;
            if (rawSearchScope !== null) {
                if (!Array.isArray(rawSearchScope)) {
                    rawSearchScope = [rawSearchScope];
                }
                if (rawSearchScope.every((searchScope) => range_1.Range.isIRange(searchScope))) {
                    searchRanges = rawSearchScope.map((searchScope) => this.validateRange(searchScope));
                }
            }
            if (searchRanges === null) {
                searchRanges = [this.getFullModelRange()];
            }
            searchRanges = searchRanges.sort((d1, d2) => d1.startLineNumber - d2.startLineNumber || d1.startColumn - d2.startColumn);
            const uniqueSearchRanges = [];
            uniqueSearchRanges.push(searchRanges.reduce((prev, curr) => {
                if (range_1.Range.areIntersecting(prev, curr)) {
                    return prev.plusRange(curr);
                }
                uniqueSearchRanges.push(prev);
                return curr;
            }));
            let matchMapper;
            if (!isRegex && searchString.indexOf('\n') < 0) {
                // not regex, not multi line
                const searchParams = new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    return [];
                }
                matchMapper = (searchRange) => this.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
            }
            else {
                matchMapper = (searchRange) => textModelSearch_1.TextModelSearch.findMatches(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchRange, captureMatches, limitResultCount);
            }
            return uniqueSearchRanges.map(matchMapper).reduce((arr, matches) => arr.concat(matches), []);
        }
        findNextMatch(searchString, rawSearchStart, isRegex, matchCase, wordSeparators, captureMatches) {
            this._assertNotDisposed();
            const searchStart = this.validatePosition(rawSearchStart);
            if (!isRegex && searchString.indexOf('\n') < 0) {
                const searchParams = new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    return null;
                }
                const lineCount = this.getLineCount();
                let searchRange = new range_1.Range(searchStart.lineNumber, searchStart.column, lineCount, this.getLineMaxColumn(lineCount));
                let ret = this.findMatchesLineByLine(searchRange, searchData, captureMatches, 1);
                textModelSearch_1.TextModelSearch.findNextMatch(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchStart, captureMatches);
                if (ret.length > 0) {
                    return ret[0];
                }
                searchRange = new range_1.Range(1, 1, searchStart.lineNumber, this.getLineMaxColumn(searchStart.lineNumber));
                ret = this.findMatchesLineByLine(searchRange, searchData, captureMatches, 1);
                if (ret.length > 0) {
                    return ret[0];
                }
                return null;
            }
            return textModelSearch_1.TextModelSearch.findNextMatch(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchStart, captureMatches);
        }
        findPreviousMatch(searchString, rawSearchStart, isRegex, matchCase, wordSeparators, captureMatches) {
            this._assertNotDisposed();
            const searchStart = this.validatePosition(rawSearchStart);
            return textModelSearch_1.TextModelSearch.findPreviousMatch(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchStart, captureMatches);
        }
        //#endregion
        //#region Editing
        pushStackElement() {
            this._commandManager.pushStackElement();
        }
        popStackElement() {
            this._commandManager.popStackElement();
        }
        pushEOL(eol) {
            const currentEOL = (this.getEOL() === '\n' ? 0 /* model.EndOfLineSequence.LF */ : 1 /* model.EndOfLineSequence.CRLF */);
            if (currentEOL === eol) {
                return;
            }
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                if (this._initialUndoRedoSnapshot === null) {
                    this._initialUndoRedoSnapshot = this._undoRedoService.createSnapshot(this.uri);
                }
                this._commandManager.pushEOL(eol);
            }
            finally {
                this._eventEmitter.endDeferredEmit();
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _validateEditOperation(rawOperation) {
            if (rawOperation instanceof model.ValidAnnotatedEditOperation) {
                return rawOperation;
            }
            return new model.ValidAnnotatedEditOperation(rawOperation.identifier || null, this.validateRange(rawOperation.range), rawOperation.text, rawOperation.forceMoveMarkers || false, rawOperation.isAutoWhitespaceEdit || false, rawOperation._isTracked || false);
        }
        _validateEditOperations(rawOperations) {
            const result = [];
            for (let i = 0, len = rawOperations.length; i < len; i++) {
                result[i] = this._validateEditOperation(rawOperations[i]);
            }
            return result;
        }
        pushEditOperations(beforeCursorState, editOperations, cursorStateComputer, group) {
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                return this._pushEditOperations(beforeCursorState, this._validateEditOperations(editOperations), cursorStateComputer, group);
            }
            finally {
                this._eventEmitter.endDeferredEmit();
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _pushEditOperations(beforeCursorState, editOperations, cursorStateComputer, group) {
            if (this._options.trimAutoWhitespace && this._trimAutoWhitespaceLines) {
                // Go through each saved line number and insert a trim whitespace edit
                // if it is safe to do so (no conflicts with other edits).
                const incomingEdits = editOperations.map((op) => {
                    return {
                        range: this.validateRange(op.range),
                        text: op.text
                    };
                });
                // Sometimes, auto-formatters change ranges automatically which can cause undesired auto whitespace trimming near the cursor
                // We'll use the following heuristic: if the edits occur near the cursor, then it's ok to trim auto whitespace
                let editsAreNearCursors = true;
                if (beforeCursorState) {
                    for (let i = 0, len = beforeCursorState.length; i < len; i++) {
                        const sel = beforeCursorState[i];
                        let foundEditNearSel = false;
                        for (let j = 0, lenJ = incomingEdits.length; j < lenJ; j++) {
                            const editRange = incomingEdits[j].range;
                            const selIsAbove = editRange.startLineNumber > sel.endLineNumber;
                            const selIsBelow = sel.startLineNumber > editRange.endLineNumber;
                            if (!selIsAbove && !selIsBelow) {
                                foundEditNearSel = true;
                                break;
                            }
                        }
                        if (!foundEditNearSel) {
                            editsAreNearCursors = false;
                            break;
                        }
                    }
                }
                if (editsAreNearCursors) {
                    for (let i = 0, len = this._trimAutoWhitespaceLines.length; i < len; i++) {
                        const trimLineNumber = this._trimAutoWhitespaceLines[i];
                        const maxLineColumn = this.getLineMaxColumn(trimLineNumber);
                        let allowTrimLine = true;
                        for (let j = 0, lenJ = incomingEdits.length; j < lenJ; j++) {
                            const editRange = incomingEdits[j].range;
                            const editText = incomingEdits[j].text;
                            if (trimLineNumber < editRange.startLineNumber || trimLineNumber > editRange.endLineNumber) {
                                // `trimLine` is completely outside this edit
                                continue;
                            }
                            // At this point:
                            //   editRange.startLineNumber <= trimLine <= editRange.endLineNumber
                            if (trimLineNumber === editRange.startLineNumber && editRange.startColumn === maxLineColumn
                                && editRange.isEmpty() && editText && editText.length > 0 && editText.charAt(0) === '\n') {
                                // This edit inserts a new line (and maybe other text) after `trimLine`
                                continue;
                            }
                            if (trimLineNumber === editRange.startLineNumber && editRange.startColumn === 1
                                && editRange.isEmpty() && editText && editText.length > 0 && editText.charAt(editText.length - 1) === '\n') {
                                // This edit inserts a new line (and maybe other text) before `trimLine`
                                continue;
                            }
                            // Looks like we can't trim this line as it would interfere with an incoming edit
                            allowTrimLine = false;
                            break;
                        }
                        if (allowTrimLine) {
                            const trimRange = new range_1.Range(trimLineNumber, 1, trimLineNumber, maxLineColumn);
                            editOperations.push(new model.ValidAnnotatedEditOperation(null, trimRange, null, false, false, false));
                        }
                    }
                }
                this._trimAutoWhitespaceLines = null;
            }
            if (this._initialUndoRedoSnapshot === null) {
                this._initialUndoRedoSnapshot = this._undoRedoService.createSnapshot(this.uri);
            }
            return this._commandManager.pushEditOperation(beforeCursorState, editOperations, cursorStateComputer, group);
        }
        _applyUndo(changes, eol, resultingAlternativeVersionId, resultingSelection) {
            const edits = changes.map((change) => {
                const rangeStart = this.getPositionAt(change.newPosition);
                const rangeEnd = this.getPositionAt(change.newEnd);
                return {
                    range: new range_1.Range(rangeStart.lineNumber, rangeStart.column, rangeEnd.lineNumber, rangeEnd.column),
                    text: change.oldText
                };
            });
            this._applyUndoRedoEdits(edits, eol, true, false, resultingAlternativeVersionId, resultingSelection);
        }
        _applyRedo(changes, eol, resultingAlternativeVersionId, resultingSelection) {
            const edits = changes.map((change) => {
                const rangeStart = this.getPositionAt(change.oldPosition);
                const rangeEnd = this.getPositionAt(change.oldEnd);
                return {
                    range: new range_1.Range(rangeStart.lineNumber, rangeStart.column, rangeEnd.lineNumber, rangeEnd.column),
                    text: change.newText
                };
            });
            this._applyUndoRedoEdits(edits, eol, false, true, resultingAlternativeVersionId, resultingSelection);
        }
        _applyUndoRedoEdits(edits, eol, isUndoing, isRedoing, resultingAlternativeVersionId, resultingSelection) {
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                this._isUndoing = isUndoing;
                this._isRedoing = isRedoing;
                this.applyEdits(edits, false);
                this.setEOL(eol);
                this._overwriteAlternativeVersionId(resultingAlternativeVersionId);
            }
            finally {
                this._isUndoing = false;
                this._isRedoing = false;
                this._eventEmitter.endDeferredEmit(resultingSelection);
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        applyEdits(rawOperations, computeUndoEdits = false) {
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                const operations = this._validateEditOperations(rawOperations);
                return this._doApplyEdits(operations, computeUndoEdits);
            }
            finally {
                this._eventEmitter.endDeferredEmit();
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _doApplyEdits(rawOperations, computeUndoEdits) {
            const oldLineCount = this._buffer.getLineCount();
            const result = this._buffer.applyEdits(rawOperations, this._options.trimAutoWhitespace, computeUndoEdits);
            const newLineCount = this._buffer.getLineCount();
            const contentChanges = result.changes;
            this._trimAutoWhitespaceLines = result.trimAutoWhitespaceLineNumbers;
            if (contentChanges.length !== 0) {
                // We do a first pass to update decorations
                // because we want to read decorations in the second pass
                // where we will emit content change events
                // and we want to read the final decorations
                for (let i = 0, len = contentChanges.length; i < len; i++) {
                    const change = contentChanges[i];
                    this._decorationsTree.acceptReplace(change.rangeOffset, change.rangeLength, change.text.length, change.forceMoveMarkers);
                }
                const rawContentChanges = [];
                this._increaseVersionId();
                let lineCount = oldLineCount;
                for (let i = 0, len = contentChanges.length; i < len; i++) {
                    const change = contentChanges[i];
                    const [eolCount] = (0, eolCounter_1.countEOL)(change.text);
                    this._onDidChangeDecorations.fire();
                    const startLineNumber = change.range.startLineNumber;
                    const endLineNumber = change.range.endLineNumber;
                    const deletingLinesCnt = endLineNumber - startLineNumber;
                    const insertingLinesCnt = eolCount;
                    const editingLinesCnt = Math.min(deletingLinesCnt, insertingLinesCnt);
                    const changeLineCountDelta = (insertingLinesCnt - deletingLinesCnt);
                    const currentEditStartLineNumber = newLineCount - lineCount - changeLineCountDelta + startLineNumber;
                    const firstEditLineNumber = currentEditStartLineNumber;
                    const lastInsertedLineNumber = currentEditStartLineNumber + insertingLinesCnt;
                    const decorationsWithInjectedTextInEditedRange = this._decorationsTree.getInjectedTextInInterval(this, this.getOffsetAt(new position_1.Position(firstEditLineNumber, 1)), this.getOffsetAt(new position_1.Position(lastInsertedLineNumber, this.getLineMaxColumn(lastInsertedLineNumber))), 0);
                    const injectedTextInEditedRange = textModelEvents_1.LineInjectedText.fromDecorations(decorationsWithInjectedTextInEditedRange);
                    const injectedTextInEditedRangeQueue = new arrays_1.ArrayQueue(injectedTextInEditedRange);
                    for (let j = editingLinesCnt; j >= 0; j--) {
                        const editLineNumber = startLineNumber + j;
                        const currentEditLineNumber = currentEditStartLineNumber + j;
                        injectedTextInEditedRangeQueue.takeFromEndWhile(r => r.lineNumber > currentEditLineNumber);
                        const decorationsInCurrentLine = injectedTextInEditedRangeQueue.takeFromEndWhile(r => r.lineNumber === currentEditLineNumber);
                        rawContentChanges.push(new textModelEvents_1.ModelRawLineChanged(editLineNumber, this.getLineContent(currentEditLineNumber), decorationsInCurrentLine));
                    }
                    if (editingLinesCnt < deletingLinesCnt) {
                        // Must delete some lines
                        const spliceStartLineNumber = startLineNumber + editingLinesCnt;
                        rawContentChanges.push(new textModelEvents_1.ModelRawLinesDeleted(spliceStartLineNumber + 1, endLineNumber));
                    }
                    if (editingLinesCnt < insertingLinesCnt) {
                        const injectedTextInEditedRangeQueue = new arrays_1.ArrayQueue(injectedTextInEditedRange);
                        // Must insert some lines
                        const spliceLineNumber = startLineNumber + editingLinesCnt;
                        const cnt = insertingLinesCnt - editingLinesCnt;
                        const fromLineNumber = newLineCount - lineCount - cnt + spliceLineNumber + 1;
                        const injectedTexts = [];
                        const newLines = [];
                        for (let i = 0; i < cnt; i++) {
                            const lineNumber = fromLineNumber + i;
                            newLines[i] = this.getLineContent(lineNumber);
                            injectedTextInEditedRangeQueue.takeWhile(r => r.lineNumber < lineNumber);
                            injectedTexts[i] = injectedTextInEditedRangeQueue.takeWhile(r => r.lineNumber === lineNumber);
                        }
                        rawContentChanges.push(new textModelEvents_1.ModelRawLinesInserted(spliceLineNumber + 1, startLineNumber + insertingLinesCnt, newLines, injectedTexts));
                    }
                    lineCount += changeLineCountDelta;
                }
                this._emitContentChangedEvent(new textModelEvents_1.ModelRawContentChangedEvent(rawContentChanges, this.getVersionId(), this._isUndoing, this._isRedoing), {
                    changes: contentChanges,
                    eol: this._buffer.getEOL(),
                    isEolChange: false,
                    versionId: this.getVersionId(),
                    isUndoing: this._isUndoing,
                    isRedoing: this._isRedoing,
                    isFlush: false
                });
            }
            return (result.reverseEdits === null ? undefined : result.reverseEdits);
        }
        undo() {
            return this._undoRedoService.undo(this.uri);
        }
        canUndo() {
            return this._undoRedoService.canUndo(this.uri);
        }
        redo() {
            return this._undoRedoService.redo(this.uri);
        }
        canRedo() {
            return this._undoRedoService.canRedo(this.uri);
        }
        //#endregion
        //#region Decorations
        handleBeforeFireDecorationsChangedEvent(affectedInjectedTextLines) {
            // This is called before the decoration changed event is fired.
            if (affectedInjectedTextLines === null || affectedInjectedTextLines.size === 0) {
                return;
            }
            const affectedLines = Array.from(affectedInjectedTextLines);
            const lineChangeEvents = affectedLines.map(lineNumber => new textModelEvents_1.ModelRawLineChanged(lineNumber, this.getLineContent(lineNumber), this._getInjectedTextInLine(lineNumber)));
            this._onDidChangeInjectedText.fire(new textModelEvents_1.ModelInjectedTextChangedEvent(lineChangeEvents));
        }
        changeDecorations(callback, ownerId = 0) {
            this._assertNotDisposed();
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                return this._changeDecorations(ownerId, callback);
            }
            finally {
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _changeDecorations(ownerId, callback) {
            const changeAccessor = {
                addDecoration: (range, options) => {
                    return this._deltaDecorationsImpl(ownerId, [], [{ range: range, options: options }])[0];
                },
                changeDecoration: (id, newRange) => {
                    this._changeDecorationImpl(id, newRange);
                },
                changeDecorationOptions: (id, options) => {
                    this._changeDecorationOptionsImpl(id, _normalizeOptions(options));
                },
                removeDecoration: (id) => {
                    this._deltaDecorationsImpl(ownerId, [id], []);
                },
                deltaDecorations: (oldDecorations, newDecorations) => {
                    if (oldDecorations.length === 0 && newDecorations.length === 0) {
                        // nothing to do
                        return [];
                    }
                    return this._deltaDecorationsImpl(ownerId, oldDecorations, newDecorations);
                }
            };
            let result = null;
            try {
                result = callback(changeAccessor);
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            // Invalidate change accessor
            changeAccessor.addDecoration = invalidFunc;
            changeAccessor.changeDecoration = invalidFunc;
            changeAccessor.changeDecorationOptions = invalidFunc;
            changeAccessor.removeDecoration = invalidFunc;
            changeAccessor.deltaDecorations = invalidFunc;
            return result;
        }
        deltaDecorations(oldDecorations, newDecorations, ownerId = 0) {
            this._assertNotDisposed();
            if (!oldDecorations) {
                oldDecorations = [];
            }
            if (oldDecorations.length === 0 && newDecorations.length === 0) {
                // nothing to do
                return [];
            }
            try {
                this._deltaDecorationCallCnt++;
                if (this._deltaDecorationCallCnt > 1) {
                    console.warn(`Invoking deltaDecorations recursively could lead to leaking decorations.`);
                    (0, errors_1.onUnexpectedError)(new Error(`Invoking deltaDecorations recursively could lead to leaking decorations.`));
                }
                this._onDidChangeDecorations.beginDeferredEmit();
                return this._deltaDecorationsImpl(ownerId, oldDecorations, newDecorations);
            }
            finally {
                this._onDidChangeDecorations.endDeferredEmit();
                this._deltaDecorationCallCnt--;
            }
        }
        _getTrackedRange(id) {
            return this.getDecorationRange(id);
        }
        _setTrackedRange(id, newRange, newStickiness) {
            const node = (id ? this._decorations[id] : null);
            if (!node) {
                if (!newRange) {
                    // node doesn't exist, the request is to delete => nothing to do
                    return null;
                }
                // node doesn't exist, the request is to set => add the tracked range
                return this._deltaDecorationsImpl(0, [], [{ range: newRange, options: TRACKED_RANGE_OPTIONS[newStickiness] }], true)[0];
            }
            if (!newRange) {
                // node exists, the request is to delete => delete node
                this._decorationsTree.delete(node);
                delete this._decorations[node.id];
                return null;
            }
            // node exists, the request is to set => change the tracked range and its options
            const range = this._validateRangeRelaxedNoAllocations(newRange);
            const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
            const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
            this._decorationsTree.delete(node);
            node.reset(this.getVersionId(), startOffset, endOffset, range);
            node.setOptions(TRACKED_RANGE_OPTIONS[newStickiness]);
            this._decorationsTree.insert(node);
            return node.id;
        }
        removeAllDecorationsWithOwnerId(ownerId) {
            if (this._isDisposed) {
                return;
            }
            const nodes = this._decorationsTree.collectNodesFromOwner(ownerId);
            for (let i = 0, len = nodes.length; i < len; i++) {
                const node = nodes[i];
                this._decorationsTree.delete(node);
                delete this._decorations[node.id];
            }
        }
        getDecorationOptions(decorationId) {
            const node = this._decorations[decorationId];
            if (!node) {
                return null;
            }
            return node.options;
        }
        getDecorationRange(decorationId) {
            const node = this._decorations[decorationId];
            if (!node) {
                return null;
            }
            return this._decorationsTree.getNodeRange(this, node);
        }
        getLineDecorations(lineNumber, ownerId = 0, filterOutValidation = false) {
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                return [];
            }
            return this.getLinesDecorations(lineNumber, lineNumber, ownerId, filterOutValidation);
        }
        getLinesDecorations(_startLineNumber, _endLineNumber, ownerId = 0, filterOutValidation = false, onlyMarginDecorations = false) {
            const lineCount = this.getLineCount();
            const startLineNumber = Math.min(lineCount, Math.max(1, _startLineNumber));
            const endLineNumber = Math.min(lineCount, Math.max(1, _endLineNumber));
            const endColumn = this.getLineMaxColumn(endLineNumber);
            const range = new range_1.Range(startLineNumber, 1, endLineNumber, endColumn);
            const decorations = this._getDecorationsInRange(range, ownerId, filterOutValidation, onlyMarginDecorations);
            (0, arrays_1.pushMany)(decorations, this._decorationProvider.getDecorationsInRange(range, ownerId, filterOutValidation));
            return decorations;
        }
        getDecorationsInRange(range, ownerId = 0, filterOutValidation = false, onlyMinimapDecorations = false, onlyMarginDecorations = false) {
            const validatedRange = this.validateRange(range);
            const decorations = this._getDecorationsInRange(validatedRange, ownerId, filterOutValidation, onlyMarginDecorations);
            (0, arrays_1.pushMany)(decorations, this._decorationProvider.getDecorationsInRange(validatedRange, ownerId, filterOutValidation, onlyMinimapDecorations));
            return decorations;
        }
        getOverviewRulerDecorations(ownerId = 0, filterOutValidation = false) {
            return this._decorationsTree.getAll(this, ownerId, filterOutValidation, true, false);
        }
        getInjectedTextDecorations(ownerId = 0) {
            return this._decorationsTree.getAllInjectedText(this, ownerId);
        }
        _getInjectedTextInLine(lineNumber) {
            const startOffset = this._buffer.getOffsetAt(lineNumber, 1);
            const endOffset = startOffset + this._buffer.getLineLength(lineNumber);
            const result = this._decorationsTree.getInjectedTextInInterval(this, startOffset, endOffset, 0);
            return textModelEvents_1.LineInjectedText.fromDecorations(result).filter(t => t.lineNumber === lineNumber);
        }
        getAllDecorations(ownerId = 0, filterOutValidation = false) {
            let result = this._decorationsTree.getAll(this, ownerId, filterOutValidation, false, false);
            result = result.concat(this._decorationProvider.getAllDecorations(ownerId, filterOutValidation));
            return result;
        }
        getAllMarginDecorations(ownerId = 0) {
            return this._decorationsTree.getAll(this, ownerId, false, false, true);
        }
        _getDecorationsInRange(filterRange, filterOwnerId, filterOutValidation, onlyMarginDecorations) {
            const startOffset = this._buffer.getOffsetAt(filterRange.startLineNumber, filterRange.startColumn);
            const endOffset = this._buffer.getOffsetAt(filterRange.endLineNumber, filterRange.endColumn);
            return this._decorationsTree.getAllInInterval(this, startOffset, endOffset, filterOwnerId, filterOutValidation, onlyMarginDecorations);
        }
        getRangeAt(start, end) {
            return this._buffer.getRangeAt(start, end - start);
        }
        _changeDecorationImpl(decorationId, _range) {
            const node = this._decorations[decorationId];
            if (!node) {
                return;
            }
            if (node.options.after) {
                const oldRange = this.getDecorationRange(decorationId);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(oldRange.endLineNumber);
            }
            if (node.options.before) {
                const oldRange = this.getDecorationRange(decorationId);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(oldRange.startLineNumber);
            }
            const range = this._validateRangeRelaxedNoAllocations(_range);
            const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
            const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
            this._decorationsTree.delete(node);
            node.reset(this.getVersionId(), startOffset, endOffset, range);
            this._decorationsTree.insert(node);
            this._onDidChangeDecorations.checkAffectedAndFire(node.options);
            if (node.options.after) {
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.endLineNumber);
            }
            if (node.options.before) {
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.startLineNumber);
            }
        }
        _changeDecorationOptionsImpl(decorationId, options) {
            const node = this._decorations[decorationId];
            if (!node) {
                return;
            }
            const nodeWasInOverviewRuler = (node.options.overviewRuler && node.options.overviewRuler.color ? true : false);
            const nodeIsInOverviewRuler = (options.overviewRuler && options.overviewRuler.color ? true : false);
            this._onDidChangeDecorations.checkAffectedAndFire(node.options);
            this._onDidChangeDecorations.checkAffectedAndFire(options);
            if (node.options.after || options.after) {
                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.endLineNumber);
            }
            if (node.options.before || options.before) {
                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.startLineNumber);
            }
            const movedInOverviewRuler = nodeWasInOverviewRuler !== nodeIsInOverviewRuler;
            const changedWhetherInjectedText = isOptionsInjectedText(options) !== isNodeInjectedText(node);
            if (movedInOverviewRuler || changedWhetherInjectedText) {
                this._decorationsTree.delete(node);
                node.setOptions(options);
                this._decorationsTree.insert(node);
            }
            else {
                node.setOptions(options);
            }
        }
        _deltaDecorationsImpl(ownerId, oldDecorationsIds, newDecorations, suppressEvents = false) {
            const versionId = this.getVersionId();
            const oldDecorationsLen = oldDecorationsIds.length;
            let oldDecorationIndex = 0;
            const newDecorationsLen = newDecorations.length;
            let newDecorationIndex = 0;
            this._onDidChangeDecorations.beginDeferredEmit();
            try {
                const result = new Array(newDecorationsLen);
                while (oldDecorationIndex < oldDecorationsLen || newDecorationIndex < newDecorationsLen) {
                    let node = null;
                    if (oldDecorationIndex < oldDecorationsLen) {
                        // (1) get ourselves an old node
                        do {
                            node = this._decorations[oldDecorationsIds[oldDecorationIndex++]];
                        } while (!node && oldDecorationIndex < oldDecorationsLen);
                        // (2) remove the node from the tree (if it exists)
                        if (node) {
                            if (node.options.after) {
                                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.endLineNumber);
                            }
                            if (node.options.before) {
                                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.startLineNumber);
                            }
                            this._decorationsTree.delete(node);
                            if (!suppressEvents) {
                                this._onDidChangeDecorations.checkAffectedAndFire(node.options);
                            }
                        }
                    }
                    if (newDecorationIndex < newDecorationsLen) {
                        // (3) create a new node if necessary
                        if (!node) {
                            const internalDecorationId = (++this._lastDecorationId);
                            const decorationId = `${this._instanceId};${internalDecorationId}`;
                            node = new intervalTree_1.IntervalNode(decorationId, 0, 0);
                            this._decorations[decorationId] = node;
                        }
                        // (4) initialize node
                        const newDecoration = newDecorations[newDecorationIndex];
                        const range = this._validateRangeRelaxedNoAllocations(newDecoration.range);
                        const options = _normalizeOptions(newDecoration.options);
                        const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
                        const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
                        node.ownerId = ownerId;
                        node.reset(versionId, startOffset, endOffset, range);
                        node.setOptions(options);
                        if (node.options.after) {
                            this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.endLineNumber);
                        }
                        if (node.options.before) {
                            this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.startLineNumber);
                        }
                        if (!suppressEvents) {
                            this._onDidChangeDecorations.checkAffectedAndFire(options);
                        }
                        this._decorationsTree.insert(node);
                        result[newDecorationIndex] = node.id;
                        newDecorationIndex++;
                    }
                    else {
                        if (node) {
                            delete this._decorations[node.id];
                        }
                    }
                }
                return result;
            }
            finally {
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        //#endregion
        //#region Tokenization
        // TODO move them to the tokenization part.
        getLanguageId() {
            return this.tokenization.getLanguageId();
        }
        setLanguage(languageIdOrSelection, source) {
            if (typeof languageIdOrSelection === 'string') {
                this._languageSelectionListener.clear();
                this._setLanguage(languageIdOrSelection, source);
            }
            else {
                this._languageSelectionListener.value = languageIdOrSelection.onDidChange(() => this._setLanguage(languageIdOrSelection.languageId, source));
                this._setLanguage(languageIdOrSelection.languageId, source);
            }
        }
        _setLanguage(languageId, source) {
            this.tokenization.setLanguageId(languageId, source);
            this._languageService.requestRichLanguageFeatures(languageId);
        }
        getLanguageIdAtPosition(lineNumber, column) {
            return this.tokenization.getLanguageIdAtPosition(lineNumber, column);
        }
        getWordAtPosition(position) {
            return this._tokenizationTextModelPart.getWordAtPosition(position);
        }
        getWordUntilPosition(position) {
            return this._tokenizationTextModelPart.getWordUntilPosition(position);
        }
        //#endregion
        normalizePosition(position, affinity) {
            return position;
        }
        /**
         * Gets the column at which indentation stops at a given line.
         * @internal
        */
        getLineIndentColumn(lineNumber) {
            // Columns start with 1.
            return indentOfLine(this.getLineContent(lineNumber)) + 1;
        }
    };
    exports.TextModel = TextModel;
    exports.TextModel = TextModel = TextModel_1 = __decorate([
        __param(4, undoRedo_1.IUndoRedoService),
        __param(5, language_1.ILanguageService),
        __param(6, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], TextModel);
    function indentOfLine(line) {
        let indent = 0;
        for (const c of line) {
            if (c === ' ' || c === '\t') {
                indent++;
            }
            else {
                break;
            }
        }
        return indent;
    }
    //#region Decorations
    function isNodeInOverviewRuler(node) {
        return (node.options.overviewRuler && node.options.overviewRuler.color ? true : false);
    }
    function isOptionsInjectedText(options) {
        return !!options.after || !!options.before;
    }
    function isNodeInjectedText(node) {
        return !!node.options.after || !!node.options.before;
    }
    class DecorationsTrees {
        constructor() {
            this._decorationsTree0 = new intervalTree_1.IntervalTree();
            this._decorationsTree1 = new intervalTree_1.IntervalTree();
            this._injectedTextDecorationsTree = new intervalTree_1.IntervalTree();
        }
        ensureAllNodesHaveRanges(host) {
            this.getAll(host, 0, false, false, false);
        }
        _ensureNodesHaveRanges(host, nodes) {
            for (const node of nodes) {
                if (node.range === null) {
                    node.range = host.getRangeAt(node.cachedAbsoluteStart, node.cachedAbsoluteEnd);
                }
            }
            return nodes;
        }
        getAllInInterval(host, start, end, filterOwnerId, filterOutValidation, onlyMarginDecorations) {
            const versionId = host.getVersionId();
            const result = this._intervalSearch(start, end, filterOwnerId, filterOutValidation, versionId, onlyMarginDecorations);
            return this._ensureNodesHaveRanges(host, result);
        }
        _intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations) {
            const r0 = this._decorationsTree0.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            const r1 = this._decorationsTree1.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            const r2 = this._injectedTextDecorationsTree.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            return r0.concat(r1).concat(r2);
        }
        getInjectedTextInInterval(host, start, end, filterOwnerId) {
            const versionId = host.getVersionId();
            const result = this._injectedTextDecorationsTree.intervalSearch(start, end, filterOwnerId, false, versionId, false);
            return this._ensureNodesHaveRanges(host, result).filter((i) => i.options.showIfCollapsed || !i.range.isEmpty());
        }
        getAllInjectedText(host, filterOwnerId) {
            const versionId = host.getVersionId();
            const result = this._injectedTextDecorationsTree.search(filterOwnerId, false, versionId, false);
            return this._ensureNodesHaveRanges(host, result).filter((i) => i.options.showIfCollapsed || !i.range.isEmpty());
        }
        getAll(host, filterOwnerId, filterOutValidation, overviewRulerOnly, onlyMarginDecorations) {
            const versionId = host.getVersionId();
            const result = this._search(filterOwnerId, filterOutValidation, overviewRulerOnly, versionId, onlyMarginDecorations);
            return this._ensureNodesHaveRanges(host, result);
        }
        _search(filterOwnerId, filterOutValidation, overviewRulerOnly, cachedVersionId, onlyMarginDecorations) {
            if (overviewRulerOnly) {
                return this._decorationsTree1.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            }
            else {
                const r0 = this._decorationsTree0.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
                const r1 = this._decorationsTree1.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
                const r2 = this._injectedTextDecorationsTree.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
                return r0.concat(r1).concat(r2);
            }
        }
        collectNodesFromOwner(ownerId) {
            const r0 = this._decorationsTree0.collectNodesFromOwner(ownerId);
            const r1 = this._decorationsTree1.collectNodesFromOwner(ownerId);
            const r2 = this._injectedTextDecorationsTree.collectNodesFromOwner(ownerId);
            return r0.concat(r1).concat(r2);
        }
        collectNodesPostOrder() {
            const r0 = this._decorationsTree0.collectNodesPostOrder();
            const r1 = this._decorationsTree1.collectNodesPostOrder();
            const r2 = this._injectedTextDecorationsTree.collectNodesPostOrder();
            return r0.concat(r1).concat(r2);
        }
        insert(node) {
            if (isNodeInjectedText(node)) {
                this._injectedTextDecorationsTree.insert(node);
            }
            else if (isNodeInOverviewRuler(node)) {
                this._decorationsTree1.insert(node);
            }
            else {
                this._decorationsTree0.insert(node);
            }
        }
        delete(node) {
            if (isNodeInjectedText(node)) {
                this._injectedTextDecorationsTree.delete(node);
            }
            else if (isNodeInOverviewRuler(node)) {
                this._decorationsTree1.delete(node);
            }
            else {
                this._decorationsTree0.delete(node);
            }
        }
        getNodeRange(host, node) {
            const versionId = host.getVersionId();
            if (node.cachedVersionId !== versionId) {
                this._resolveNode(node, versionId);
            }
            if (node.range === null) {
                node.range = host.getRangeAt(node.cachedAbsoluteStart, node.cachedAbsoluteEnd);
            }
            return node.range;
        }
        _resolveNode(node, cachedVersionId) {
            if (isNodeInjectedText(node)) {
                this._injectedTextDecorationsTree.resolveNode(node, cachedVersionId);
            }
            else if (isNodeInOverviewRuler(node)) {
                this._decorationsTree1.resolveNode(node, cachedVersionId);
            }
            else {
                this._decorationsTree0.resolveNode(node, cachedVersionId);
            }
        }
        acceptReplace(offset, length, textLength, forceMoveMarkers) {
            this._decorationsTree0.acceptReplace(offset, length, textLength, forceMoveMarkers);
            this._decorationsTree1.acceptReplace(offset, length, textLength, forceMoveMarkers);
            this._injectedTextDecorationsTree.acceptReplace(offset, length, textLength, forceMoveMarkers);
        }
    }
    function cleanClassName(className) {
        return className.replace(/[^a-z0-9\-_]/gi, ' ');
    }
    class DecorationOptions {
        constructor(options) {
            this.color = options.color || '';
            this.darkColor = options.darkColor || '';
        }
    }
    class ModelDecorationOverviewRulerOptions extends DecorationOptions {
        constructor(options) {
            super(options);
            this._resolvedColor = null;
            this.position = (typeof options.position === 'number' ? options.position : model.OverviewRulerLane.Center);
        }
        getColor(theme) {
            if (!this._resolvedColor) {
                if (theme.type !== 'light' && this.darkColor) {
                    this._resolvedColor = this._resolveColor(this.darkColor, theme);
                }
                else {
                    this._resolvedColor = this._resolveColor(this.color, theme);
                }
            }
            return this._resolvedColor;
        }
        invalidateCachedColor() {
            this._resolvedColor = null;
        }
        _resolveColor(color, theme) {
            if (typeof color === 'string') {
                return color;
            }
            const c = color ? theme.getColor(color.id) : null;
            if (!c) {
                return '';
            }
            return c.toString();
        }
    }
    exports.ModelDecorationOverviewRulerOptions = ModelDecorationOverviewRulerOptions;
    class ModelDecorationGlyphMarginOptions {
        constructor(options) {
            this.position = options?.position ?? model.GlyphMarginLane.Center;
            this.persistLane = options?.persistLane;
        }
    }
    exports.ModelDecorationGlyphMarginOptions = ModelDecorationGlyphMarginOptions;
    class ModelDecorationMinimapOptions extends DecorationOptions {
        constructor(options) {
            super(options);
            this.position = options.position;
            this.sectionHeaderStyle = options.sectionHeaderStyle ?? null;
            this.sectionHeaderText = options.sectionHeaderText ?? null;
        }
        getColor(theme) {
            if (!this._resolvedColor) {
                if (theme.type !== 'light' && this.darkColor) {
                    this._resolvedColor = this._resolveColor(this.darkColor, theme);
                }
                else {
                    this._resolvedColor = this._resolveColor(this.color, theme);
                }
            }
            return this._resolvedColor;
        }
        invalidateCachedColor() {
            this._resolvedColor = undefined;
        }
        _resolveColor(color, theme) {
            if (typeof color === 'string') {
                return color_1.Color.fromHex(color);
            }
            return theme.getColor(color.id);
        }
    }
    exports.ModelDecorationMinimapOptions = ModelDecorationMinimapOptions;
    class ModelDecorationInjectedTextOptions {
        static from(options) {
            if (options instanceof ModelDecorationInjectedTextOptions) {
                return options;
            }
            return new ModelDecorationInjectedTextOptions(options);
        }
        constructor(options) {
            this.content = options.content || '';
            this.inlineClassName = options.inlineClassName || null;
            this.inlineClassNameAffectsLetterSpacing = options.inlineClassNameAffectsLetterSpacing || false;
            this.attachedData = options.attachedData || null;
            this.cursorStops = options.cursorStops || null;
        }
    }
    exports.ModelDecorationInjectedTextOptions = ModelDecorationInjectedTextOptions;
    class ModelDecorationOptions {
        static register(options) {
            return new ModelDecorationOptions(options);
        }
        static createDynamic(options) {
            return new ModelDecorationOptions(options);
        }
        constructor(options) {
            this.description = options.description;
            this.blockClassName = options.blockClassName ? cleanClassName(options.blockClassName) : null;
            this.blockDoesNotCollapse = options.blockDoesNotCollapse ?? null;
            this.blockIsAfterEnd = options.blockIsAfterEnd ?? null;
            this.blockPadding = options.blockPadding ?? null;
            this.stickiness = options.stickiness || 0 /* model.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */;
            this.zIndex = options.zIndex || 0;
            this.className = options.className ? cleanClassName(options.className) : null;
            this.shouldFillLineOnLineBreak = options.shouldFillLineOnLineBreak ?? null;
            this.hoverMessage = options.hoverMessage || null;
            this.glyphMarginHoverMessage = options.glyphMarginHoverMessage || null;
            this.lineNumberHoverMessage = options.lineNumberHoverMessage || null;
            this.isWholeLine = options.isWholeLine || false;
            this.showIfCollapsed = options.showIfCollapsed || false;
            this.collapseOnReplaceEdit = options.collapseOnReplaceEdit || false;
            this.overviewRuler = options.overviewRuler ? new ModelDecorationOverviewRulerOptions(options.overviewRuler) : null;
            this.minimap = options.minimap ? new ModelDecorationMinimapOptions(options.minimap) : null;
            this.glyphMargin = options.glyphMarginClassName ? new ModelDecorationGlyphMarginOptions(options.glyphMargin) : null;
            this.glyphMarginClassName = options.glyphMarginClassName ? cleanClassName(options.glyphMarginClassName) : null;
            this.linesDecorationsClassName = options.linesDecorationsClassName ? cleanClassName(options.linesDecorationsClassName) : null;
            this.lineNumberClassName = options.lineNumberClassName ? cleanClassName(options.lineNumberClassName) : null;
            this.linesDecorationsTooltip = options.linesDecorationsTooltip ? strings.htmlAttributeEncodeValue(options.linesDecorationsTooltip) : null;
            this.firstLineDecorationClassName = options.firstLineDecorationClassName ? cleanClassName(options.firstLineDecorationClassName) : null;
            this.marginClassName = options.marginClassName ? cleanClassName(options.marginClassName) : null;
            this.inlineClassName = options.inlineClassName ? cleanClassName(options.inlineClassName) : null;
            this.inlineClassNameAffectsLetterSpacing = options.inlineClassNameAffectsLetterSpacing || false;
            this.beforeContentClassName = options.beforeContentClassName ? cleanClassName(options.beforeContentClassName) : null;
            this.afterContentClassName = options.afterContentClassName ? cleanClassName(options.afterContentClassName) : null;
            this.after = options.after ? ModelDecorationInjectedTextOptions.from(options.after) : null;
            this.before = options.before ? ModelDecorationInjectedTextOptions.from(options.before) : null;
            this.hideInCommentTokens = options.hideInCommentTokens ?? false;
            this.hideInStringTokens = options.hideInStringTokens ?? false;
        }
    }
    exports.ModelDecorationOptions = ModelDecorationOptions;
    ModelDecorationOptions.EMPTY = ModelDecorationOptions.register({ description: 'empty' });
    /**
     * The order carefully matches the values of the enum.
     */
    const TRACKED_RANGE_OPTIONS = [
        ModelDecorationOptions.register({ description: 'tracked-range-always-grows-when-typing-at-edges', stickiness: 0 /* model.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */ }),
        ModelDecorationOptions.register({ description: 'tracked-range-never-grows-when-typing-at-edges', stickiness: 1 /* model.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */ }),
        ModelDecorationOptions.register({ description: 'tracked-range-grows-only-when-typing-before', stickiness: 2 /* model.TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */ }),
        ModelDecorationOptions.register({ description: 'tracked-range-grows-only-when-typing-after', stickiness: 3 /* model.TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */ }),
    ];
    function _normalizeOptions(options) {
        if (options instanceof ModelDecorationOptions) {
            return options;
        }
        return ModelDecorationOptions.createDynamic(options);
    }
    class DidChangeDecorationsEmitter extends lifecycle_1.Disposable {
        constructor(handleBeforeFire) {
            super();
            this.handleBeforeFire = handleBeforeFire;
            this._actual = this._register(new event_1.Emitter());
            this.event = this._actual.event;
            this._affectedInjectedTextLines = null;
            this._deferredCnt = 0;
            this._shouldFireDeferred = false;
            this._affectsMinimap = false;
            this._affectsOverviewRuler = false;
            this._affectsGlyphMargin = false;
            this._affectsLineNumber = false;
        }
        hasListeners() {
            return this._actual.hasListeners();
        }
        beginDeferredEmit() {
            this._deferredCnt++;
        }
        endDeferredEmit() {
            this._deferredCnt--;
            if (this._deferredCnt === 0) {
                if (this._shouldFireDeferred) {
                    this.doFire();
                }
                this._affectedInjectedTextLines?.clear();
                this._affectedInjectedTextLines = null;
            }
        }
        recordLineAffectedByInjectedText(lineNumber) {
            if (!this._affectedInjectedTextLines) {
                this._affectedInjectedTextLines = new Set();
            }
            this._affectedInjectedTextLines.add(lineNumber);
        }
        checkAffectedAndFire(options) {
            this._affectsMinimap ||= !!options.minimap?.position;
            this._affectsOverviewRuler ||= !!options.overviewRuler?.color;
            this._affectsGlyphMargin ||= !!options.glyphMarginClassName;
            this._affectsLineNumber ||= !!options.lineNumberClassName;
            this.tryFire();
        }
        fire() {
            this._affectsMinimap = true;
            this._affectsOverviewRuler = true;
            this._affectsGlyphMargin = true;
            this.tryFire();
        }
        tryFire() {
            if (this._deferredCnt === 0) {
                this.doFire();
            }
            else {
                this._shouldFireDeferred = true;
            }
        }
        doFire() {
            this.handleBeforeFire(this._affectedInjectedTextLines);
            const event = {
                affectsMinimap: this._affectsMinimap,
                affectsOverviewRuler: this._affectsOverviewRuler,
                affectsGlyphMargin: this._affectsGlyphMargin,
                affectsLineNumber: this._affectsLineNumber,
            };
            this._shouldFireDeferred = false;
            this._affectsMinimap = false;
            this._affectsOverviewRuler = false;
            this._affectsGlyphMargin = false;
            this._actual.fire(event);
        }
    }
    //#endregion
    class DidChangeContentEmitter extends lifecycle_1.Disposable {
        constructor() {
            super();
            /**
             * Both `fastEvent` and `slowEvent` work the same way and contain the same events, but first we invoke `fastEvent` and then `slowEvent`.
             */
            this._fastEmitter = this._register(new event_1.Emitter());
            this.fastEvent = this._fastEmitter.event;
            this._slowEmitter = this._register(new event_1.Emitter());
            this.slowEvent = this._slowEmitter.event;
            this._deferredCnt = 0;
            this._deferredEvent = null;
        }
        hasListeners() {
            return (this._fastEmitter.hasListeners()
                || this._slowEmitter.hasListeners());
        }
        beginDeferredEmit() {
            this._deferredCnt++;
        }
        endDeferredEmit(resultingSelection = null) {
            this._deferredCnt--;
            if (this._deferredCnt === 0) {
                if (this._deferredEvent !== null) {
                    this._deferredEvent.rawContentChangedEvent.resultingSelection = resultingSelection;
                    const e = this._deferredEvent;
                    this._deferredEvent = null;
                    this._fastEmitter.fire(e);
                    this._slowEmitter.fire(e);
                }
            }
        }
        fire(e) {
            if (this._deferredCnt > 0) {
                if (this._deferredEvent) {
                    this._deferredEvent = this._deferredEvent.merge(e);
                }
                else {
                    this._deferredEvent = e;
                }
                return;
            }
            this._fastEmitter.fire(e);
            this._slowEmitter.fire(e);
        }
    }
    /**
     * @internal
     */
    class AttachedViews {
        constructor() {
            this._onDidChangeVisibleRanges = new event_1.Emitter();
            this.onDidChangeVisibleRanges = this._onDidChangeVisibleRanges.event;
            this._views = new Set();
        }
        attachView() {
            const view = new AttachedViewImpl((state) => {
                this._onDidChangeVisibleRanges.fire({ view, state });
            });
            this._views.add(view);
            return view;
        }
        detachView(view) {
            this._views.delete(view);
            this._onDidChangeVisibleRanges.fire({ view, state: undefined });
        }
    }
    exports.AttachedViews = AttachedViews;
    class AttachedViewImpl {
        constructor(handleStateChange) {
            this.handleStateChange = handleStateChange;
        }
        setVisibleLines(visibleLines, stabilized) {
            const visibleLineRanges = visibleLines.map((line) => new lineRange_1.LineRange(line.startLineNumber, line.endLineNumber + 1));
            this.handleStateChange({ visibleLineRanges, stabilized });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC90ZXh0TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZDaEcsMERBSUM7SUFXRCw4RUF3QkM7SUFFRCxrRkFTQztJQUVELDRDQVVDO0lBOURELFNBQWdCLHVCQUF1QixDQUFDLElBQVk7UUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSx1REFBMEIsRUFBRSxDQUFDO1FBQ2pELE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDekIsQ0FBQztJQVdELFNBQWdCLGlDQUFpQyxDQUFDLE1BQTRDO1FBQzdGLE9BQU8sSUFBSSxPQUFPLENBQTJCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ2hFLE1BQU0sT0FBTyxHQUFHLElBQUksdURBQTBCLEVBQUUsQ0FBQztZQUVqRCxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7WUFFakIsSUFBQSxxQkFBWSxFQUFvQixNQUFNLEVBQUU7Z0JBQ3ZDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtvQkFDZixPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzdFLENBQUM7Z0JBQ0QsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNoQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ1gsSUFBSSxHQUFHLElBQUksQ0FBQzt3QkFDWixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JB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