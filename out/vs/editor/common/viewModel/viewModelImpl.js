/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/common/config/editorOptions", "vs/editor/common/cursor/cursor", "vs/editor/common/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/textModelEvents", "vs/editor/common/languages", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/textToHtmlTokenizer", "vs/editor/common/viewEvents", "vs/editor/common/viewLayout/viewLayout", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/viewModel", "vs/editor/common/viewModel/viewModelDecorations", "vs/editor/common/viewModelEventDispatcher", "vs/editor/common/viewModel/viewModelLines", "vs/editor/common/viewModel/glyphLanesModel"], function (require, exports, arrays_1, async_1, color_1, lifecycle_1, platform, strings, editorOptions_1, cursor_1, cursorCommon_1, position_1, range_1, textModelEvents, languages_1, modesRegistry_1, textToHtmlTokenizer_1, viewEvents, viewLayout_1, minimapTokensColorTracker_1, viewModel_1, viewModelDecorations_1, viewModelEventDispatcher_1, viewModelLines_1, glyphLanesModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModel = void 0;
    const USE_IDENTITY_LINES_COLLECTION = true;
    class ViewModel extends lifecycle_1.Disposable {
        constructor(editorId, configuration, model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, scheduleAtNextAnimationFrame, languageConfigurationService, _themeService, _attachedView) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            this._themeService = _themeService;
            this._attachedView = _attachedView;
            this.hiddenAreasModel = new HiddenAreasModel();
            this.previousHiddenAreas = [];
            this._editorId = editorId;
            this._configuration = configuration;
            this.model = model;
            this._eventDispatcher = new viewModelEventDispatcher_1.ViewModelEventDispatcher();
            this.onEvent = this._eventDispatcher.onEvent;
            this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
            this._updateConfigurationViewLineCount = this._register(new async_1.RunOnceScheduler(() => this._updateConfigurationViewLineCountNow(), 0));
            this._hasFocus = false;
            this._viewportStart = ViewportStart.create(this.model);
            this.glyphLanes = new glyphLanesModel_1.GlyphMarginLanesModel(0);
            if (USE_IDENTITY_LINES_COLLECTION && this.model.isTooLargeForTokenization()) {
                this._lines = new viewModelLines_1.ViewModelLinesFromModelAsIs(this.model);
            }
            else {
                const options = this._configuration.options;
                const fontInfo = options.get(50 /* EditorOption.fontInfo */);
                const wrappingStrategy = options.get(139 /* EditorOption.wrappingStrategy */);
                const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
                const wrappingIndent = options.get(138 /* EditorOption.wrappingIndent */);
                const wordBreak = options.get(129 /* EditorOption.wordBreak */);
                this._lines = new viewModelLines_1.ViewModelLinesFromProjectedModel(this._editorId, this.model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, fontInfo, this.model.getOptions().tabSize, wrappingStrategy, wrappingInfo.wrappingColumn, wrappingIndent, wordBreak);
            }
            this.coordinatesConverter = this._lines.createCoordinatesConverter();
            this._cursor = this._register(new cursor_1.CursorsController(model, this, this.coordinatesConverter, this.cursorConfig));
            this.viewLayout = this._register(new viewLayout_1.ViewLayout(this._configuration, this.getLineCount(), scheduleAtNextAnimationFrame));
            this._register(this.viewLayout.onDidScroll((e) => {
                if (e.scrollTopChanged) {
                    this._handleVisibleLinesChanged();
                }
                if (e.scrollTopChanged) {
                    this._viewportStart.invalidate();
                }
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewScrollChangedEvent(e));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ScrollChangedEvent(e.oldScrollWidth, e.oldScrollLeft, e.oldScrollHeight, e.oldScrollTop, e.scrollWidth, e.scrollLeft, e.scrollHeight, e.scrollTop));
            }));
            this._register(this.viewLayout.onDidContentSizeChange((e) => {
                this._eventDispatcher.emitOutgoingEvent(e);
            }));
            this._decorations = new viewModelDecorations_1.ViewModelDecorations(this._editorId, this.model, this._configuration, this._lines, this.coordinatesConverter);
            this._registerModelEvents();
            this._register(this._configuration.onDidChangeFast((e) => {
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    this._onConfigurationChanged(eventsCollector, e);
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
            }));
            this._register(minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance().onDidChange(() => {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewTokensColorsChangedEvent());
            }));
            this._register(this._themeService.onDidColorThemeChange((theme) => {
                this._invalidateDecorationsColorCache();
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewThemeChangedEvent(theme));
            }));
            this._updateConfigurationViewLineCountNow();
        }
        dispose() {
            // First remove listeners, as disposing the lines might end up sending
            // model decoration changed events ... and we no longer care about them ...
            super.dispose();
            this._decorations.dispose();
            this._lines.dispose();
            this._viewportStart.dispose();
            this._eventDispatcher.dispose();
        }
        createLineBreaksComputer() {
            return this._lines.createLineBreaksComputer();
        }
        addViewEventHandler(eventHandler) {
            this._eventDispatcher.addViewEventHandler(eventHandler);
        }
        removeViewEventHandler(eventHandler) {
            this._eventDispatcher.removeViewEventHandler(eventHandler);
        }
        _updateConfigurationViewLineCountNow() {
            this._configuration.setViewLineCount(this._lines.getViewLineCount());
        }
        getModelVisibleRanges() {
            const linesViewportData = this.viewLayout.getLinesViewportData();
            const viewVisibleRange = new range_1.Range(linesViewportData.startLineNumber, this.getLineMinColumn(linesViewportData.startLineNumber), linesViewportData.endLineNumber, this.getLineMaxColumn(linesViewportData.endLineNumber));
            const modelVisibleRanges = this._toModelVisibleRanges(viewVisibleRange);
            return modelVisibleRanges;
        }
        visibleLinesStabilized() {
            const modelVisibleRanges = this.getModelVisibleRanges();
            this._attachedView.setVisibleLines(modelVisibleRanges, true);
        }
        _handleVisibleLinesChanged() {
            const modelVisibleRanges = this.getModelVisibleRanges();
            this._attachedView.setVisibleLines(modelVisibleRanges, false);
        }
        setHasFocus(hasFocus) {
            this._hasFocus = hasFocus;
            this._cursor.setHasFocus(hasFocus);
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewFocusChangedEvent(hasFocus));
            this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.FocusChangedEvent(!hasFocus, hasFocus));
        }
        onCompositionStart() {
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewCompositionStartEvent());
        }
        onCompositionEnd() {
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewCompositionEndEvent());
        }
        _captureStableViewport() {
            // We might need to restore the current start view range, so save it (if available)
            // But only if the scroll position is not at the top of the file
            if (this._viewportStart.isValid && this.viewLayout.getCurrentScrollTop() > 0) {
                const previousViewportStartViewPosition = new position_1.Position(this._viewportStart.viewLineNumber, this.getLineMinColumn(this._viewportStart.viewLineNumber));
                const previousViewportStartModelPosition = this.coordinatesConverter.convertViewPositionToModelPosition(previousViewportStartViewPosition);
                return new StableViewport(previousViewportStartModelPosition, this._viewportStart.startLineDelta);
            }
            return new StableViewport(null, 0);
        }
        _onConfigurationChanged(eventsCollector, e) {
            const stableViewport = this._captureStableViewport();
            const options = this._configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const wrappingStrategy = options.get(139 /* EditorOption.wrappingStrategy */);
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const wrappingIndent = options.get(138 /* EditorOption.wrappingIndent */);
            const wordBreak = options.get(129 /* EditorOption.wordBreak */);
            if (this._lines.setWrappingSettings(fontInfo, wrappingStrategy, wrappingInfo.wrappingColumn, wrappingIndent, wordBreak)) {
                eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                this._cursor.onLineMappingChanged(eventsCollector);
                this._decorations.onLineMappingChanged();
                this.viewLayout.onFlushed(this.getLineCount());
                this._updateConfigurationViewLineCount.schedule();
            }
            if (e.hasChanged(91 /* EditorOption.readOnly */)) {
                // Must read again all decorations due to readOnly filtering
                this._decorations.reset();
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
            }
            if (e.hasChanged(98 /* EditorOption.renderValidationDecorations */)) {
                this._decorations.reset();
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
            }
            eventsCollector.emitViewEvent(new viewEvents.ViewConfigurationChangedEvent(e));
            this.viewLayout.onConfigurationChanged(e);
            stableViewport.recoverViewportStart(this.coordinatesConverter, this.viewLayout);
            if (cursorCommon_1.CursorConfiguration.shouldRecreate(e)) {
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
            }
        }
        _registerModelEvents() {
            this._register(this.model.onDidChangeContentOrInjectedText((e) => {
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    let hadOtherModelChange = false;
                    let hadModelLineChangeThatChangedLineMapping = false;
                    const changes = (e instanceof textModelEvents.InternalModelContentChangeEvent ? e.rawContentChangedEvent.changes : e.changes);
                    const versionId = (e instanceof textModelEvents.InternalModelContentChangeEvent ? e.rawContentChangedEvent.versionId : null);
                    // Do a first pass to compute line mappings, and a second pass to actually interpret them
                    const lineBreaksComputer = this._lines.createLineBreaksComputer();
                    for (const change of changes) {
                        switch (change.changeType) {
                            case 4 /* textModelEvents.RawContentChangedType.LinesInserted */: {
                                for (let lineIdx = 0; lineIdx < change.detail.length; lineIdx++) {
                                    const line = change.detail[lineIdx];
                                    let injectedText = change.injectedTexts[lineIdx];
                                    if (injectedText) {
                                        injectedText = injectedText.filter(element => (!element.ownerId || element.ownerId === this._editorId));
                                    }
                                    lineBreaksComputer.addRequest(line, injectedText, null);
                                }
                                break;
                            }
                            case 2 /* textModelEvents.RawContentChangedType.LineChanged */: {
                                let injectedText = null;
                                if (change.injectedText) {
                                    injectedText = change.injectedText.filter(element => (!element.ownerId || element.ownerId === this._editorId));
                                }
                                lineBreaksComputer.addRequest(change.detail, injectedText, null);
                                break;
                            }
                        }
                    }
                    const lineBreaks = lineBreaksComputer.finalize();
                    const lineBreakQueue = new arrays_1.ArrayQueue(lineBreaks);
                    for (const change of changes) {
                        switch (change.changeType) {
                            case 1 /* textModelEvents.RawContentChangedType.Flush */: {
                                this._lines.onModelFlushed();
                                eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                                this._decorations.reset();
                                this.viewLayout.onFlushed(this.getLineCount());
                                hadOtherModelChange = true;
                                break;
                            }
                            case 3 /* textModelEvents.RawContentChangedType.LinesDeleted */: {
                                const linesDeletedEvent = this._lines.onModelLinesDeleted(versionId, change.fromLineNumber, change.toLineNumber);
                                if (linesDeletedEvent !== null) {
                                    eventsCollector.emitViewEvent(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 4 /* textModelEvents.RawContentChangedType.LinesInserted */: {
                                const insertedLineBreaks = lineBreakQueue.takeCount(change.detail.length);
                                const linesInsertedEvent = this._lines.onModelLinesInserted(versionId, change.fromLineNumber, change.toLineNumber, insertedLineBreaks);
                                if (linesInsertedEvent !== null) {
                                    eventsCollector.emitViewEvent(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 2 /* textModelEvents.RawContentChangedType.LineChanged */: {
                                const changedLineBreakData = lineBreakQueue.dequeue();
                                const [lineMappingChanged, linesChangedEvent, linesInsertedEvent, linesDeletedEvent] = this._lines.onModelLineChanged(versionId, change.lineNumber, changedLineBreakData);
                                hadModelLineChangeThatChangedLineMapping = lineMappingChanged;
                                if (linesChangedEvent) {
                                    eventsCollector.emitViewEvent(linesChangedEvent);
                                }
                                if (linesInsertedEvent) {
                                    eventsCollector.emitViewEvent(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                if (linesDeletedEvent) {
                                    eventsCollector.emitViewEvent(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                break;
                            }
                            case 5 /* textModelEvents.RawContentChangedType.EOLChanged */: {
                                // Nothing to do. The new version will be accepted below
                                break;
                            }
                        }
                    }
                    if (versionId !== null) {
                        this._lines.acceptVersionId(versionId);
                    }
                    this.viewLayout.onHeightMaybeChanged();
                    if (!hadOtherModelChange && hadModelLineChangeThatChangedLineMapping) {
                        eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                        this._cursor.onLineMappingChanged(eventsCollector);
                        this._decorations.onLineMappingChanged();
                    }
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
                // Update the configuration and reset the centered view line
                const viewportStartWasValid = this._viewportStart.isValid;
                this._viewportStart.invalidate();
                this._configuration.setModelLineCount(this.model.getLineCount());
                this._updateConfigurationViewLineCountNow();
                // Recover viewport
                if (!this._hasFocus && this.model.getAttachedEditorCount() >= 2 && viewportStartWasValid) {
                    const modelRange = this.model._getTrackedRange(this._viewportStart.modelTrackedRange);
                    if (modelRange) {
                        const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelRange.getStartPosition());
                        const viewPositionTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                        this.viewLayout.setScrollPosition({ scrollTop: viewPositionTop + this._viewportStart.startLineDelta }, 1 /* ScrollType.Immediate */);
                    }
                }
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    if (e instanceof textModelEvents.InternalModelContentChangeEvent) {
                        eventsCollector.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelContentChangedEvent(e.contentChangedEvent));
                    }
                    this._cursor.onModelContentChanged(eventsCollector, e);
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
                this._handleVisibleLinesChanged();
            }));
            this._register(this.model.onDidChangeTokens((e) => {
                const viewRanges = [];
                for (let j = 0, lenJ = e.ranges.length; j < lenJ; j++) {
                    const modelRange = e.ranges[j];
                    const viewStartLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.fromLineNumber, 1)).lineNumber;
                    const viewEndLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.toLineNumber, this.model.getLineMaxColumn(modelRange.toLineNumber))).lineNumber;
                    viewRanges[j] = {
                        fromLineNumber: viewStartLineNumber,
                        toLineNumber: viewEndLineNumber
                    };
                }
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewTokensChangedEvent(viewRanges));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelTokensChangedEvent(e));
            }));
            this._register(this.model.onDidChangeLanguageConfiguration((e) => {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewLanguageConfigurationEvent());
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelLanguageConfigurationChangedEvent(e));
            }));
            this._register(this.model.onDidChangeLanguage((e) => {
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelLanguageChangedEvent(e));
            }));
            this._register(this.model.onDidChangeOptions((e) => {
                // A tab size change causes a line mapping changed event => all view parts will repaint OK, no further event needed here
                if (this._lines.setTabSize(this.model.getOptions().tabSize)) {
                    try {
                        const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                        eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                        this._cursor.onLineMappingChanged(eventsCollector);
                        this._decorations.onLineMappingChanged();
                        this.viewLayout.onFlushed(this.getLineCount());
                    }
                    finally {
                        this._eventDispatcher.endEmitViewEvents();
                    }
                    this._updateConfigurationViewLineCount.schedule();
                }
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelOptionsChangedEvent(e));
            }));
            this._register(this.model.onDidChangeDecorations((e) => {
                this._decorations.onModelDecorationsChanged();
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewDecorationsChangedEvent(e));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelDecorationsChangedEvent(e));
            }));
        }
        setHiddenAreas(ranges, source) {
            this.hiddenAreasModel.setHiddenAreas(source, ranges);
            const mergedRanges = this.hiddenAreasModel.getMergedRanges();
            if (mergedRanges === this.previousHiddenAreas) {
                return;
            }
            this.previousHiddenAreas = mergedRanges;
            const stableViewport = this._captureStableViewport();
            let lineMappingChanged = false;
            try {
                const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                lineMappingChanged = this._lines.setHiddenAreas(mergedRanges);
                if (lineMappingChanged) {
                    eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                    eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                    eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                    this._cursor.onLineMappingChanged(eventsCollector);
                    this._decorations.onLineMappingChanged();
                    this.viewLayout.onFlushed(this.getLineCount());
                    this.viewLayout.onHeightMaybeChanged();
                }
                const firstModelLineInViewPort = stableViewport.viewportStartModelPosition?.lineNumber;
                const firstModelLineIsHidden = firstModelLineInViewPort && mergedRanges.some(range => range.startLineNumber <= firstModelLineInViewPort && firstModelLineInViewPort <= range.endLineNumber);
                if (!firstModelLineIsHidden) {
                    stableViewport.recoverViewportStart(this.coordinatesConverter, this.viewLayout);
                }
            }
            finally {
                this._eventDispatcher.endEmitViewEvents();
            }
            this._updateConfigurationViewLineCount.schedule();
            if (lineMappingChanged) {
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.HiddenAreasChangedEvent());
            }
        }
        getVisibleRangesPlusViewportAboveBelow() {
            const layoutInfo = this._configuration.options.get(145 /* EditorOption.layoutInfo */);
            const lineHeight = this._configuration.options.get(67 /* EditorOption.lineHeight */);
            const linesAround = Math.max(20, Math.round(layoutInfo.height / lineHeight));
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = Math.max(1, partialData.completelyVisibleStartLineNumber - linesAround);
            const endViewLineNumber = Math.min(this.getLineCount(), partialData.completelyVisibleEndLineNumber + linesAround);
            return this._toModelVisibleRanges(new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber)));
        }
        getVisibleRanges() {
            const visibleViewRange = this.getCompletelyVisibleViewRange();
            return this._toModelVisibleRanges(visibleViewRange);
        }
        getHiddenAreas() {
            return this._lines.getHiddenAreas();
        }
        _toModelVisibleRanges(visibleViewRange) {
            const visibleRange = this.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
            const hiddenAreas = this._lines.getHiddenAreas();
            if (hiddenAreas.length === 0) {
                return [visibleRange];
            }
            const result = [];
            let resultLen = 0;
            let startLineNumber = visibleRange.startLineNumber;
            let startColumn = visibleRange.startColumn;
            const endLineNumber = visibleRange.endLineNumber;
            const endColumn = visibleRange.endColumn;
            for (let i = 0, len = hiddenAreas.length; i < len; i++) {
                const hiddenStartLineNumber = hiddenAreas[i].startLineNumber;
                const hiddenEndLineNumber = hiddenAreas[i].endLineNumber;
                if (hiddenEndLineNumber < startLineNumber) {
                    continue;
                }
                if (hiddenStartLineNumber > endLineNumber) {
                    continue;
                }
                if (startLineNumber < hiddenStartLineNumber) {
                    result[resultLen++] = new range_1.Range(startLineNumber, startColumn, hiddenStartLineNumber - 1, this.model.getLineMaxColumn(hiddenStartLineNumber - 1));
                }
                startLineNumber = hiddenEndLineNumber + 1;
                startColumn = 1;
            }
            if (startLineNumber < endLineNumber || (startLineNumber === endLineNumber && startColumn < endColumn)) {
                result[resultLen++] = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
            }
            return result;
        }
        getCompletelyVisibleViewRange() {
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        getCompletelyVisibleViewRangeAtScrollTop(scrollTop) {
            const partialData = this.viewLayout.getLinesViewportDataAtScrollTop(scrollTop);
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        saveState() {
            const compatViewState = this.viewLayout.saveState();
            const scrollTop = compatViewState.scrollTop;
            const firstViewLineNumber = this.viewLayout.getLineNumberAtVerticalOffset(scrollTop);
            const firstPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(firstViewLineNumber, this.getLineMinColumn(firstViewLineNumber)));
            const firstPositionDeltaTop = this.viewLayout.getVerticalOffsetForLineNumber(firstViewLineNumber) - scrollTop;
            return {
                scrollLeft: compatViewState.scrollLeft,
                firstPosition: firstPosition,
                firstPositionDeltaTop: firstPositionDeltaTop
            };
        }
        reduceRestoreState(state) {
            if (typeof state.firstPosition === 'undefined') {
                // This is a view state serialized by an older version
                return this._reduceRestoreStateCompatibility(state);
            }
            const modelPosition = this.model.validatePosition(state.firstPosition);
            const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            const scrollTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber) - state.firstPositionDeltaTop;
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: scrollTop
            };
        }
        _reduceRestoreStateCompatibility(state) {
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: state.scrollTopWithoutViewZones
            };
        }
        getTabSize() {
            return this.model.getOptions().tabSize;
        }
        getLineCount() {
            return this._lines.getViewLineCount();
        }
        /**
         * Gives a hint that a lot of requests are about to come in for these line numbers.
         */
        setViewport(startLineNumber, endLineNumber, centeredLineNumber) {
            this._viewportStart.update(this, startLineNumber);
        }
        getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber) {
            return this._lines.getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber);
        }
        getLinesIndentGuides(startLineNumber, endLineNumber) {
            return this._lines.getViewLinesIndentGuides(startLineNumber, endLineNumber);
        }
        getBracketGuidesInRangeByLine(startLineNumber, endLineNumber, activePosition, options) {
            return this._lines.getViewLinesBracketGuides(startLineNumber, endLineNumber, activePosition, options);
        }
        getLineContent(lineNumber) {
            return this._lines.getViewLineContent(lineNumber);
        }
        getLineLength(lineNumber) {
            return this._lines.getViewLineLength(lineNumber);
        }
        getLineMinColumn(lineNumber) {
            return this._lines.getViewLineMinColumn(lineNumber);
        }
        getLineMaxColumn(lineNumber) {
            return this._lines.getViewLineMaxColumn(lineNumber);
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            const result = strings.firstNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 1;
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            const result = strings.lastNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 2;
        }
        getMinimapDecorationsInRange(range) {
            return this._decorations.getMinimapDecorationsInRange(range);
        }
        getDecorationsInViewport(visibleRange) {
            return this._decorations.getDecorationsViewportData(visibleRange).decorations;
        }
        getInjectedTextAt(viewPosition) {
            return this._lines.getInjectedTextAt(viewPosition);
        }
        getViewportViewLineRenderingData(visibleRange, lineNumber) {
            const allInlineDecorations = this._decorations.getDecorationsViewportData(visibleRange).inlineDecorations;
            const inlineDecorations = allInlineDecorations[lineNumber - visibleRange.startLineNumber];
            return this._getViewLineRenderingData(lineNumber, inlineDecorations);
        }
        getViewLineRenderingData(lineNumber) {
            const inlineDecorations = this._decorations.getInlineDecorationsOnLine(lineNumber);
            return this._getViewLineRenderingData(lineNumber, inlineDecorations);
        }
        _getViewLineRenderingData(lineNumber, inlineDecorations) {
            const mightContainRTL = this.model.mightContainRTL();
            const mightContainNonBasicASCII = this.model.mightContainNonBasicASCII();
            const tabSize = this.getTabSize();
            const lineData = this._lines.getViewLineData(lineNumber);
            if (lineData.inlineDecorations) {
                inlineDecorations = [
                    ...inlineDecorations,
                    ...lineData.inlineDecorations.map(d => d.toInlineDecoration(lineNumber))
                ];
            }
            return new viewModel_1.ViewLineRenderingData(lineData.minColumn, lineData.maxColumn, lineData.content, lineData.continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, lineData.tokens, inlineDecorations, tabSize, lineData.startVisibleColumn);
        }
        getViewLineData(lineNumber) {
            return this._lines.getViewLineData(lineNumber);
        }
        getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed) {
            const result = this._lines.getViewLinesData(startLineNumber, endLineNumber, needed);
            return new viewModel_1.MinimapLinesRenderingData(this.getTabSize(), result);
        }
        getAllOverviewRulerDecorations(theme) {
            const decorations = this.model.getOverviewRulerDecorations(this._editorId, (0, editorOptions_1.filterValidationDecorations)(this._configuration.options));
            const result = new OverviewRulerDecorations();
            for (const decoration of decorations) {
                const decorationOptions = decoration.options;
                const opts = decorationOptions.overviewRuler;
                if (!opts) {
                    continue;
                }
                const lane = opts.position;
                if (lane === 0) {
                    continue;
                }
                const color = opts.getColor(theme.value);
                const viewStartLineNumber = this.coordinatesConverter.getViewLineNumberOfModelPosition(decoration.range.startLineNumber, decoration.range.startColumn);
                const viewEndLineNumber = this.coordinatesConverter.getViewLineNumberOfModelPosition(decoration.range.endLineNumber, decoration.range.endColumn);
                result.accept(color, decorationOptions.zIndex, viewStartLineNumber, viewEndLineNumber, lane);
            }
            return result.asArray;
        }
        _invalidateDecorationsColorCache() {
            const decorations = this.model.getOverviewRulerDecorations();
            for (const decoration of decorations) {
                const opts1 = decoration.options.overviewRuler;
                opts1?.invalidateCachedColor();
                const opts2 = decoration.options.minimap;
                opts2?.invalidateCachedColor();
            }
        }
        getValueInRange(range, eol) {
            const modelRange = this.coordinatesConverter.convertViewRangeToModelRange(range);
            return this.model.getValueInRange(modelRange, eol);
        }
        getValueLengthInRange(range, eol) {
            const modelRange = this.coordinatesConverter.convertViewRangeToModelRange(range);
            return this.model.getValueLengthInRange(modelRange, eol);
        }
        modifyPosition(position, offset) {
            const modelPosition = this.coordinatesConverter.convertViewPositionToModelPosition(position);
            const resultModelPosition = this.model.modifyPosition(modelPosition, offset);
            return this.coordinatesConverter.convertModelPositionToViewPosition(resultModelPosition);
        }
        deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt) {
            const modelAnchor = this.coordinatesConverter.convertViewPositionToModelPosition(viewAnchorPosition);
            if (this.model.getEOL().length === 2) {
                // This model uses CRLF, so the delta must take that into account
                if (deltaOffset < 0) {
                    deltaOffset -= lineFeedCnt;
                }
                else {
                    deltaOffset += lineFeedCnt;
                }
            }
            const modelAnchorOffset = this.model.getOffsetAt(modelAnchor);
            const resultOffset = modelAnchorOffset + deltaOffset;
            return this.model.getPositionAt(resultOffset);
        }
        getPlainTextToCopy(modelRanges, emptySelectionClipboard, forceCRLF) {
            const newLineCharacter = forceCRLF ? '\r\n' : this.model.getEOL();
            modelRanges = modelRanges.slice(0);
            modelRanges.sort(range_1.Range.compareRangesUsingStarts);
            let hasEmptyRange = false;
            let hasNonEmptyRange = false;
            for (const range of modelRanges) {
                if (range.isEmpty()) {
                    hasEmptyRange = true;
                }
                else {
                    hasNonEmptyRange = true;
                }
            }
            if (!hasNonEmptyRange) {
                // all ranges are empty
                if (!emptySelectionClipboard) {
                    return '';
                }
                const modelLineNumbers = modelRanges.map((r) => r.startLineNumber);
                let result = '';
                for (let i = 0; i < modelLineNumbers.length; i++) {
                    if (i > 0 && modelLineNumbers[i - 1] === modelLineNumbers[i]) {
                        continue;
                    }
                    result += this.model.getLineContent(modelLineNumbers[i]) + newLineCharacter;
                }
                return result;
            }
            if (hasEmptyRange && emptySelectionClipboard) {
                // mixed empty selections and non-empty selections
                const result = [];
                let prevModelLineNumber = 0;
                for (const modelRange of modelRanges) {
                    const modelLineNumber = modelRange.startLineNumber;
                    if (modelRange.isEmpty()) {
                        if (modelLineNumber !== prevModelLineNumber) {
                            result.push(this.model.getLineContent(modelLineNumber));
                        }
                    }
                    else {
                        result.push(this.model.getValueInRange(modelRange, forceCRLF ? 2 /* EndOfLinePreference.CRLF */ : 0 /* EndOfLinePreference.TextDefined */));
                    }
                    prevModelLineNumber = modelLineNumber;
                }
                return result.length === 1 ? result[0] : result;
            }
            const result = [];
            for (const modelRange of modelRanges) {
                if (!modelRange.isEmpty()) {
                    result.push(this.model.getValueInRange(modelRange, forceCRLF ? 2 /* EndOfLinePreference.CRLF */ : 0 /* EndOfLinePreference.TextDefined */));
                }
            }
            return result.length === 1 ? result[0] : result;
        }
        getRichTextToCopy(modelRanges, emptySelectionClipboard) {
            const languageId = this.model.getLanguageId();
            if (languageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                return null;
            }
            if (modelRanges.length !== 1) {
                // no multiple selection support at this time
                return null;
            }
            let range = modelRanges[0];
            if (range.isEmpty()) {
                if (!emptySelectionClipboard) {
                    // nothing to copy
                    return null;
                }
                const lineNumber = range.startLineNumber;
                range = new range_1.Range(lineNumber, this.model.getLineMinColumn(lineNumber), lineNumber, this.model.getLineMaxColumn(lineNumber));
            }
            const fontInfo = this._configuration.options.get(50 /* EditorOption.fontInfo */);
            const colorMap = this._getColorMap();
            const hasBadChars = (/[:;\\\/<>]/.test(fontInfo.fontFamily));
            const useDefaultFontFamily = (hasBadChars || fontInfo.fontFamily === editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily);
            let fontFamily;
            if (useDefaultFontFamily) {
                fontFamily = editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            }
            else {
                fontFamily = fontInfo.fontFamily;
                fontFamily = fontFamily.replace(/"/g, '\'');
                const hasQuotesOrIsList = /[,']/.test(fontFamily);
                if (!hasQuotesOrIsList) {
                    const needsQuotes = /[+ ]/.test(fontFamily);
                    if (needsQuotes) {
                        fontFamily = `'${fontFamily}'`;
                    }
                }
                fontFamily = `${fontFamily}, ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`;
            }
            return {
                mode: languageId,
                html: (`<div style="`
                    + `color: ${colorMap[1 /* ColorId.DefaultForeground */]};`
                    + `background-color: ${colorMap[2 /* ColorId.DefaultBackground */]};`
                    + `font-family: ${fontFamily};`
                    + `font-weight: ${fontInfo.fontWeight};`
                    + `font-size: ${fontInfo.fontSize}px;`
                    + `line-height: ${fontInfo.lineHeight}px;`
                    + `white-space: pre;`
                    + `">`
                    + this._getHTMLToCopy(range, colorMap)
                    + '</div>')
            };
        }
        _getHTMLToCopy(modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = this.getTabSize();
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = this.model.tokenization.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += (0, textToHtmlTokenizer_1.tokenizeLineToHTML)(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return result;
        }
        _getColorMap() {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
        //#region cursor operations
        getPrimaryCursorState() {
            return this._cursor.getPrimaryCursorState();
        }
        getLastAddedCursorIndex() {
            return this._cursor.getLastAddedCursorIndex();
        }
        getCursorStates() {
            return this._cursor.getCursorStates();
        }
        setCursorStates(source, reason, states) {
            return this._withViewEventsCollector(eventsCollector => this._cursor.setStates(eventsCollector, source, reason, states));
        }
        getCursorColumnSelectData() {
            return this._cursor.getCursorColumnSelectData();
        }
        getCursorAutoClosedCharacters() {
            return this._cursor.getAutoClosedCharacters();
        }
        setCursorColumnSelectData(columnSelectData) {
            this._cursor.setCursorColumnSelectData(columnSelectData);
        }
        getPrevEditOperationType() {
            return this._cursor.getPrevEditOperationType();
        }
        setPrevEditOperationType(type) {
            this._cursor.setPrevEditOperationType(type);
        }
        getSelection() {
            return this._cursor.getSelection();
        }
        getSelections() {
            return this._cursor.getSelections();
        }
        getPosition() {
            return this._cursor.getPrimaryCursorState().modelState.position;
        }
        setSelections(source, selections, reason = 0 /* CursorChangeReason.NotSet */) {
            this._withViewEventsCollector(eventsCollector => this._cursor.setSelections(eventsCollector, source, selections, reason));
        }
        saveCursorState() {
            return this._cursor.saveState();
        }
        restoreCursorState(states) {
            this._withViewEventsCollector(eventsCollector => this._cursor.restoreState(eventsCollector, states));
        }
        _executeCursorEdit(callback) {
            if (this._cursor.context.cursorConfig.readOnly) {
                // we cannot edit when read only...
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ReadOnlyEditAttemptEvent());
                return;
            }
            this._withViewEventsCollector(callback);
        }
        executeEdits(source, edits, cursorStateComputer) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeEdits(eventsCollector, source, edits, cursorStateComputer));
        }
        startComposition() {
            this._executeCursorEdit(eventsCollector => this._cursor.startComposition(eventsCollector));
        }
        endComposition(source) {
            this._executeCursorEdit(eventsCollector => this._cursor.endComposition(eventsCollector, source));
        }
        type(text, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.type(eventsCollector, text, source));
        }
        compositionType(text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.compositionType(eventsCollector, text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source));
        }
        paste(text, pasteOnNewLine, multicursorText, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.paste(eventsCollector, text, pasteOnNewLine, multicursorText, source));
        }
        cut(source) {
            this._executeCursorEdit(eventsCollector => this._cursor.cut(eventsCollector, source));
        }
        executeCommand(command, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeCommand(eventsCollector, command, source));
        }
        executeCommands(commands, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeCommands(eventsCollector, commands, source));
        }
        revealAllCursors(source, revealHorizontal, minimalReveal = false) {
            this._withViewEventsCollector(eventsCollector => this._cursor.revealAll(eventsCollector, source, minimalReveal, 0 /* viewEvents.VerticalRevealType.Simple */, revealHorizontal, 0 /* ScrollType.Smooth */));
        }
        revealPrimaryCursor(source, revealHorizontal, minimalReveal = false) {
            this._withViewEventsCollector(eventsCollector => this._cursor.revealPrimary(eventsCollector, source, minimalReveal, 0 /* viewEvents.VerticalRevealType.Simple */, revealHorizontal, 0 /* ScrollType.Smooth */));
        }
        revealTopMostCursor(source) {
            const viewPosition = this._cursor.getTopMostViewPosition();
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, false, viewRange, null, 0 /* viewEvents.VerticalRevealType.Simple */, true, 0 /* ScrollType.Smooth */)));
        }
        revealBottomMostCursor(source) {
            const viewPosition = this._cursor.getBottomMostViewPosition();
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, false, viewRange, null, 0 /* viewEvents.VerticalRevealType.Simple */, true, 0 /* ScrollType.Smooth */)));
        }
        revealRange(source, revealHorizontal, viewRange, verticalType, scrollType) {
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, false, viewRange, null, verticalType, revealHorizontal, scrollType)));
        }
        //#endregion
        //#region viewLayout
        changeWhitespace(callback) {
            const hadAChange = this.viewLayout.changeWhitespace(callback);
            if (hadAChange) {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewZonesChangedEvent());
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ViewZonesChangedEvent());
            }
        }
        //#endregion
        _withViewEventsCollector(callback) {
            try {
                const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                return callback(eventsCollector);
            }
            finally {
                this._eventDispatcher.endEmitViewEvents();
            }
        }
        batchEvents(callback) {
            this._withViewEventsCollector(() => { callback(); });
        }
        normalizePosition(position, affinity) {
            return this._lines.normalizePosition(position, affinity);
        }
        /**
         * Gets the column at which indentation stops at a given line.
         * @internal
        */
        getLineIndentColumn(lineNumber) {
            return this._lines.getLineIndentColumn(lineNumber);
        }
    }
    exports.ViewModel = ViewModel;
    class ViewportStart {
        static create(model) {
            const viewportStartLineTrackedRange = model._setTrackedRange(null, new range_1.Range(1, 1, 1, 1), 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
            return new ViewportStart(model, 1, false, viewportStartLineTrackedRange, 0);
        }
        get viewLineNumber() {
            return this._viewLineNumber;
        }
        get isValid() {
            return this._isValid;
        }
        get modelTrackedRange() {
            return this._modelTrackedRange;
        }
        get startLineDelta() {
            return this._startLineDelta;
        }
        constructor(_model, _viewLineNumber, _isValid, _modelTrackedRange, _startLineDelta) {
            this._model = _model;
            this._viewLineNumber = _viewLineNumber;
            this._isValid = _isValid;
            this._modelTrackedRange = _modelTrackedRange;
            this._startLineDelta = _startLineDelta;
        }
        dispose() {
            this._model._setTrackedRange(this._modelTrackedRange, null, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
        }
        update(viewModel, startLineNumber) {
            const position = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(startLineNumber, viewModel.getLineMinColumn(startLineNumber)));
            const viewportStartLineTrackedRange = viewModel.model._setTrackedRange(this._modelTrackedRange, new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column), 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
            const viewportStartLineTop = viewModel.viewLayout.getVerticalOffsetForLineNumber(startLineNumber);
            const scrollTop = viewModel.viewLayout.getCurrentScrollTop();
            this._viewLineNumber = startLineNumber;
            this._isValid = true;
            this._modelTrackedRange = viewportStartLineTrackedRange;
            this._startLineDelta = scrollTop - viewportStartLineTop;
        }
        invalidate() {
            this._isValid = false;
        }
    }
    class OverviewRulerDecorations {
        constructor() {
            this._asMap = Object.create(null);
            this.asArray = [];
        }
        accept(color, zIndex, startLineNumber, endLineNumber, lane) {
            const prevGroup = this._asMap[color];
            if (prevGroup) {
                const prevData = prevGroup.data;
                const prevLane = prevData[prevData.length - 3];
                const prevEndLineNumber = prevData[prevData.length - 1];
                if (prevLane === lane && prevEndLineNumber + 1 >= startLineNumber) {
                    // merge into prev
                    if (endLineNumber > prevEndLineNumber) {
                        prevData[prevData.length - 1] = endLineNumber;
                    }
                    return;
                }
                // push
                prevData.push(lane, startLineNumber, endLineNumber);
            }
            else {
                const group = new viewModel_1.OverviewRulerDecorationsGroup(color, zIndex, [lane, startLineNumber, endLineNumber]);
                this._asMap[color] = group;
                this.asArray.push(group);
            }
        }
    }
    class HiddenAreasModel {
        constructor() {
            this.hiddenAreas = new Map();
            this.shouldRecompute = false;
            this.ranges = [];
        }
        setHiddenAreas(source, ranges) {
            const existing = this.hiddenAreas.get(source);
            if (existing && rangeArraysEqual(existing, ranges)) {
                return;
            }
            this.hiddenAreas.set(source, ranges);
            this.shouldRecompute = true;
        }
        /**
         * The returned array is immutable.
        */
        getMergedRanges() {
            if (!this.shouldRecompute) {
                return this.ranges;
            }
            this.shouldRecompute = false;
            const newRanges = Array.from(this.hiddenAreas.values()).reduce((r, hiddenAreas) => mergeLineRangeArray(r, hiddenAreas), []);
            if (rangeArraysEqual(this.ranges, newRanges)) {
                return this.ranges;
            }
            this.ranges = newRanges;
            return this.ranges;
        }
    }
    function mergeLineRangeArray(arr1, arr2) {
        const result = [];
        let i = 0;
        let j = 0;
        while (i < arr1.length && j < arr2.length) {
            const item1 = arr1[i];
            const item2 = arr2[j];
            if (item1.endLineNumber < item2.startLineNumber - 1) {
                result.push(arr1[i++]);
            }
            else if (item2.endLineNumber < item1.startLineNumber - 1) {
                result.push(arr2[j++]);
            }
            else {
                const startLineNumber = Math.min(item1.startLineNumber, item2.startLineNumber);
                const endLineNumber = Math.max(item1.endLineNumber, item2.endLineNumber);
                result.push(new range_1.Range(startLineNumber, 1, endLineNumber, 1));
                i++;
                j++;
            }
        }
        while (i < arr1.length) {
            result.push(arr1[i++]);
        }
        while (j < arr2.length) {
            result.push(arr2[j++]);
        }
        return result;
    }
    function rangeArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        for (let i = 0; i < arr1.length; i++) {
            if (!arr1[i].equalsRange(arr2[i])) {
                return false;
            }
        }
        return true;
    }
    /**
     * Maintain a stable viewport by trying to keep the first line in the viewport constant.
     */
    class StableViewport {
        constructor(viewportStartModelPosition, startLineDelta) {
            this.viewportStartModelPosition = viewportStartModelPosition;
            this.startLineDelta = startLineDelta;
        }
        recoverViewportStart(coordinatesConverter, viewLayout) {
            if (!this.viewportStartModelPosition) {
                return;
            }
            const viewPosition = coordinatesConverter.convertModelPositionToViewPosition(this.viewportStartModelPosition);
            const viewPositionTop = viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
            viewLayout.setScrollPosition({ scrollTop: viewPositionTop + this.startLineDelta }, 1 /* ScrollType.Immediate */);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld01vZGVsL3ZpZXdNb2RlbEltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0NoRyxNQUFNLDZCQUE2QixHQUFHLElBQUksQ0FBQztJQUUzQyxNQUFhLFNBQVUsU0FBUSxzQkFBVTtRQWtCeEMsWUFDQyxRQUFnQixFQUNoQixhQUFtQyxFQUNuQyxLQUFpQixFQUNqQiw0QkFBd0QsRUFDeEQsa0NBQThELEVBQzlELDRCQUFtRSxFQUNsRCw0QkFBMkQsRUFDM0QsYUFBNEIsRUFDNUIsYUFBNEI7WUFFN0MsS0FBSyxFQUFFLENBQUM7WUFKUyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQzNELGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQzVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBa1o3QixxQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7WUFDbkQsd0JBQW1CLEdBQXFCLEVBQUUsQ0FBQztZQS9ZbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7WUFDcEMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUN2RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7WUFDN0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLGtDQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxJ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